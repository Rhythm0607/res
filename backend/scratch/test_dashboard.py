import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_dashboard_stats():
    # 1. Log in (try recruiter test3)
    print("Testing credentials login...")
    login_payload = {
        "username": "test3@gmail.com",
        "password": "password"
    }
    res = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
    if res.status_code != 200:
        # Fallback to standard hr company credentials
        login_payload = {
            "username": "hr@company.com",
            "password": "password"
        }
        res = requests.post(f"{BASE_URL}/auth/login", data=login_payload)
        
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Login successful.")

    # 2. Call dashboard stats API
    print("Requesting recruiter dashboard statistics...")
    res = requests.get(f"{BASE_URL}/jobs/dashboard/stats", headers=headers)
    assert res.status_code == 200, f"Failed to get stats: {res.text}"
    
    stats = res.json()
    print("\n✓ SUCCESS: Dashboard Statistics retrieved:")
    print(f"  Active Jobs: {stats['active_jobs']}")
    print(f"  Total Candidates: {stats['total_candidates']}")
    print(f"  Resumes Analyzed: {stats['resumes_analyzed']}")
    print(f"  Highly Qualified Candidates (>=80%): {stats['high_matches']}")
    print(f"  Job Distribution: {stats['job_distribution']}")
    print(f"  Average ATS Scores: {stats['score_trends']}")
    
    assert "active_jobs" in stats
    assert "total_candidates" in stats
    assert "resumes_analyzed" in stats
    assert "high_matches" in stats
    assert isinstance(stats["job_distribution"], list)
    assert isinstance(stats["score_trends"], list)
    
    print("\nALL DASHBOARD END-TO-END TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_dashboard_stats()
