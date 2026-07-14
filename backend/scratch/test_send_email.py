import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_send_email_endpoint():
    # 1. Register recruiter
    print("Registering recruiter...")
    email = "test_send_email_recruiter@example.com"
    password = "password123"
    register_payload = {
        "email": email,
        "password": password,
        "full_name": "Test Recruiter S"
    }
    
    # Try logging in first in case it is already registered
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code == 200:
        print("✓ Logged in existing recruiter.")
        token = res.json()["access_token"]
    else:
        res = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        assert res.status_code == 200
        print("✓ Recruiter registered.")
        
        res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        assert res.status_code == 200
        token = res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create job
    print("Creating temporary job...")
    job_payload = {
        "title": "Backend Python Developer",
        "description": "We are looking for a Python backend engineer with FastAPI, Docker, and PostgreSQL experience.",
        "department": "Engineering",
        "location": "Remote",
        "experience_years": 3,
        "required_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
        "employment_type": "Full-time",
        "salary_range": "$90,000 - $120,000",
        "work_model": "Remote"
    }
    res = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=headers)
    assert res.status_code == 201, f"Job creation failed: {res.text}"
    job = res.json()
    job_id = job["id"]

    # 3. Seed candidate and MatchResult
    print("Seeding candidate...")
    from app.database import SessionLocal
    from app.models.schema import Candidate, MatchResult
    
    db = SessionLocal()
    try:
        cand_email = "candidate_s_test@example.com"
        cand = db.query(Candidate).filter(Candidate.email == cand_email).first()
        if not cand:
            cand = Candidate(
                name="Alice S. Developer",
                email=cand_email,
                resume_text="I am a developer with experience in Python, Flask, PostgreSQL, and AWS.",
                extracted_skills=["Python", "Flask", "PostgreSQL", "AWS"],
                experience_years=4,
                education="BS in Computer Science",
                phone="123-456-7890"
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)
            
        candidate_id = cand.id
        
        match = db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id, MatchResult.job_id == job_id).first()
        if not match:
            match = MatchResult(
                job_id=job_id,
                candidate_id=candidate_id,
                ats_score=75.0,
                skill_match_score=50.0,
                semantic_score=80.0,
                experience_match_score=100.0,
                education_match_score=100.0,
                missing_skills=["FastAPI", "Docker"],
                status="Screened"
            )
            db.add(match)
            db.commit()
    finally:
        db.close()

    # 4. Request send email API
    print("Triggering direct send email endpoint...")
    send_payload = {
        "job_id": job_id,
        "subject": "Introductory Chat - Python Backend Developer",
        "body": "Hi Alice, we would love to connect with you next week for a 15-minute call."
    }
    res = requests.post(
        f"{BASE_URL}/resumes/candidates/{candidate_id}/send-email",
        json=send_payload,
        headers=headers
    )
    assert res.status_code == 200, f"Failed to send email: {res.text}"
    
    resp_data = res.json()
    print("\n✓ SUCCESS: Email Dispatch endpoint responded with:")
    print(resp_data)
    assert "message" in resp_data

    # 5. Clean up
    print("\nCleaning up temporary test records...")
    db = SessionLocal()
    try:
        db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
        db.query(Candidate).filter(Candidate.id == candidate_id).delete()
        db.commit()
    finally:
        db.close()
        
    res = requests.delete(f"{BASE_URL}/jobs/{job_id}", headers=headers)
    assert res.status_code == 204
    print("✓ Cleanup successful.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    test_send_email_endpoint()
