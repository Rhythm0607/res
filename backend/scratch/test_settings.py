import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_settings_api():
    # 1. Log in
    print("Testing credentials login...")
    login_payload = {
        "username": "hr@company.com",
        "password": "password"
    }
    res = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful.")

    # 2. Get current user profile details
    res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert res.status_code == 200
    original_profile = res.json()
    original_name = original_profile["full_name"]
    print(f"✓ Active Recruiter profile loaded: {original_name}")

    # 3. Update profile details
    print("Updating recruiter profile details...")
    update_payload = {
        "full_name": "Jane Recruiter Edited",
        "email": "hr@company.com"
    }
    res = requests.put(f"{BASE_URL}/auth/profile", json=update_payload, headers=headers)
    assert res.status_code == 200, f"Profile update failed: {res.text}"
    assert res.json()["full_name"] == "Jane Recruiter Edited"
    print("✓ Profile details updated successfully.")

    # 4. Restore original profile details
    print("Restoring original profile details...")
    restore_payload = {
        "full_name": original_name,
        "email": "hr@company.com"
    }
    res = requests.put(f"{BASE_URL}/auth/profile", json=restore_payload, headers=headers)
    assert res.status_code == 200
    print("✓ Original profile details restored.")

    # 5. Try updating password with incorrect current password
    print("Testing password update with wrong current password...")
    password_payload = {
        "current_password": "wrong_password",
        "new_password": "new_password_123"
    }
    res = requests.put(f"{BASE_URL}/auth/password", json=password_payload, headers=headers)
    assert res.status_code == 400, "Should fail with wrong password"
    assert "Incorrect current" in res.json()["detail"]
    print("✓ Wrong current password check rejected as expected.")

    # 6. Update password with correct password
    print("Testing password update with correct current password...")
    password_payload = {
        "current_password": "password",
        "new_password": "new_password_123"
    }
    res = requests.put(f"{BASE_URL}/auth/password", json=password_payload, headers=headers)
    assert res.status_code == 204, f"Password change failed: {res.text}"
    print("✓ Password changed successfully.")

    # 7. Restore original password (new_password_123 -> password)
    print("Restoring original password...")
    restore_password_payload = {
        "current_password": "new_password_123",
        "new_password": "password"
    }
    res = requests.put(f"{BASE_URL}/auth/password", json=restore_password_payload, headers=headers)
    assert res.status_code == 204, f"Restoring password failed: {res.text}"
    print("✓ Original password restored.")
    
    print("\nALL SETTINGS END-TO-END TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_settings_api()
