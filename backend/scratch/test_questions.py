import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_questions_generation_isolated():
    # 1. Register temporary user
    print("Registering temporary recruiter...")
    email = "test_questions_recruiter@example.com"
    password = "password123"
    register_payload = {
        "email": email,
        "password": password,
        "full_name": "Test Recruiter Q"
    }
    # Try logging in first in case it is already registered
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
    if res.status_code == 200:
        print("✓ Logged in existing recruiter.")
        token = res.json()["access_token"]
    else:
        res = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        assert res.status_code == 200, f"Registration failed: {res.text}"
        print("✓ Recruiter registered.")
        
        res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": password})
        assert res.status_code == 200
        token = res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a job
    print("Creating temporary job vacancy...")
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
    print(f"✓ Job created with ID: {job_id}")

    # 3. Create candidate and match manually via direct uploads flow fallback or seed
    # Since candidates are uploaded via files, we can upload a mock file or seed DB directly.
    # To test the API endpoint cleanly, let's look at Candidate and MatchResult seeding.
    # We can use our python command runner to seed Candidate and MatchResult in the DB directly!
    print("Seeding candidate and match result in database...")
    from app.database import SessionLocal
    from app.models.schema import Candidate, MatchResult
    
    db = SessionLocal()
    try:
        # Check if candidate exists, if not create
        cand_email = "candidate_q_test@example.com"
        cand = db.query(Candidate).filter(Candidate.email == cand_email).first()
        if not cand:
            cand = Candidate(
                name="Alice Q. Developer",
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
        
        # Create MatchResult
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
            
        print(f"✓ Seeded Candidate ID: {candidate_id} and MatchResult successfully.")
        
    finally:
        db.close()

    # 4. Request interview questions
    print("Requesting tailored AI interview questions...")
    res = requests.get(
        f"{BASE_URL}/resumes/candidates/{candidate_id}/questions?job_id={job_id}", 
        headers=headers
    )
    assert res.status_code == 200, f"Failed to retrieve questions: {res.text}"
    
    questions = res.json()
    assert isinstance(questions, list), "Response must be a list"
    assert len(questions) == 5, f"Response should have 5 questions, got {len(questions)}"
    
    print("\n✓ SUCCESS: Tailored Interview Questions generated successfully:")
    for q in questions:
        print(f"\n[{q['category']} Q{q['id']}]: {q['question']}")
        print(f"  Evaluation Guide: {q['evaluation_guide']}")
        assert "question" in q
        assert "category" in q
        assert "evaluation_guide" in q

    # 5. Clean up temporary test data
    print("\nCleaning up temporary test records...")
    db = SessionLocal()
    try:
        db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
        db.query(Candidate).filter(Candidate.id == candidate_id).delete()
        db.commit()
        print("✓ MatchResult and Candidate cleaned up.")
    finally:
        db.close()
        
    res = requests.delete(f"{BASE_URL}/jobs/{job_id}", headers=headers)
    assert res.status_code == 204
    print("✓ Temporary job vacancy cleaned up.")

    print("\nALL AI INTERVIEW QUESTIONS INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    # We run inside the backend folder to make sure we can import local modules
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    test_questions_generation_isolated()
