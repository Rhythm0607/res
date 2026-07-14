import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_bulk_email_endpoint():
    # 1. Register Recruiter
    print("Registering temporary recruiter...")
    email = "test_bulk_recruiter@example.com"
    password = "password123"
    register_payload = {
        "email": email,
        "password": password,
        "full_name": "Test Recruiter B"
    }
    
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code == 200:
        print("✓ Logged in recruiter.")
        token = res.json()["access_token"]
    else:
        res = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        print("✓ Recruiter registered.")
        
        res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        assert res.status_code == 200
        token = res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create job
    print("Creating temporary job...")
    job_payload = {
        "title": "React Engineer",
        "description": "We are seeking a React Front-end Engineer.",
        "department": "Engineering",
        "location": "Remote",
        "experience_years": 2,
        "required_skills": ["React", "JavaScript"],
        "employment_type": "Full-time",
        "salary_range": "$80k - $100k",
        "work_model": "Remote"
    }
    res = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=headers)
    assert res.status_code == 201, f"Job creation failed: {res.text}"
    job = res.json()
    job_id = job["id"]

    # 3. Seed multiple candidates
    print("Seeding multiple candidates...")
    from app.database import SessionLocal
    from app.models.schema import Candidate, MatchResult
    
    db = SessionLocal()
    candidate_ids = []
    try:
        candidates_data = [
            ("Alice Johnson", "alice_j_test@example.com"),
            ("Bob Smith", "bob_s_test@example.com"),
            ("Charlie Brown", "charlie_b_test@example.com")
        ]
        for name, c_email in candidates_data:
            cand = db.query(Candidate).filter(Candidate.email == c_email).first()
            if not cand:
                cand = Candidate(
                    name=name,
                    email=c_email,
                    resume_text=f"I am {name} with expertise in React development.",
                    extracted_skills=["React", "JavaScript"],
                    experience_years=3,
                    education="BS",
                    phone="12345"
                )
                db.add(cand)
                db.commit()
                db.refresh(cand)
                
            candidate_ids.append(cand.id)
            
            # Seed MatchResult
            match = db.query(MatchResult).filter(MatchResult.candidate_id == cand.id, MatchResult.job_id == job_id).first()
            if not match:
                match = MatchResult(
                    job_id=job_id,
                    candidate_id=cand.id,
                    ats_score=85.0,
                    skill_match_score=90.0,
                    semantic_score=80.0,
                    experience_match_score=100.0,
                    education_match_score=100.0,
                    missing_skills=[],
                    status="Screened"
                )
                db.add(match)
                db.commit()
    finally:
        db.close()

    # 4. Trigger bulk email transmission
    print("Triggering bulk email transmission endpoint...")
    bulk_payload = {
        "candidate_ids": candidate_ids,
        "subject_template": "Interview invitation: {job_title} role at HireSense",
        "body_template": "Hi {candidate_name},\n\nWe would love to invite you for a call for the {job_title} vacancy."
    }
    
    res = requests.post(f"{BASE_URL}/resumes/jobs/{job_id}/bulk-email", json=bulk_payload, headers=headers)
    assert res.status_code == 200, f"Bulk email failed: {res.text}"
    
    response_data = res.json()
    print("\n✓ SUCCESS: Bulk email dispatch completed successfully:")
    print(response_data)
    assert response_data["total_sent"] == len(candidate_ids)

    # 5. Cleanup
    print("\nCleaning up temporary test records...")
    db = SessionLocal()
    try:
        db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
        for cid in candidate_ids:
            db.query(Candidate).filter(Candidate.id == cid).delete()
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
    test_bulk_email_endpoint()
