import os
import io
import zipfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app
from app.database import Base, get_db
from app.models.schema import User, Job, Candidate, MatchResult
from app.core.security import get_password_hash

# Use a test database
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:password@localhost:5432/hiresense"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    # Setup test schema
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Clear previous test data
        db.query(MatchResult).delete()
        db.query(Candidate).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.commit()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def client(db_session):
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def create_mock_docx():
    """Generates a valid minimal DOCX zip structure in memory."""
    docx_io = io.BytesIO()
    with zipfile.ZipFile(docx_io, "w") as docx:
        # The document text must match XML openXML format
        xml_content = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
            <w:body>
                <w:p>
                    <w:r>
                        <w:t>John Doe Resume</w:t>
                        <w:t>email: john.doe@example.com</w:t>
                        <w:t>Skills: Python, React, FastAPI, AWS, Docker</w:t>
                        <w:t>Experience: 5 years</w:t>
                    </w:r>
                </w:p>
            </w:body>
        </w:document>
        """
        docx.writestr("word/document.xml", xml_content)
    docx_io.seek(0)
    return docx_io

def test_resume_upload_flow(client, db_session):
    # 1. Create a test recruiter user
    hashed_pwd = get_password_hash("password123")
    user = User(email="recruiter@example.com", hashed_password=hashed_pwd, full_name="Recruiter Jane", is_active=True)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Log in to get token
    login_res = client.post("/api/v1/auth/login", data={"username": "recruiter@example.com", "password": "password123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a Job
    job = Job(
        title="Python Backend Developer",
        department="Engineering",
        location="Remote",
        description="Looking for a Python Developer experienced with FastAPI, React, and AWS.",
        required_skills=["Python", "FastAPI", "React", "AWS"],
        preferred_skills=["Docker"],
        experience_years=3,
        employment_type="Full-time",
        salary_range="$100k-$120k",
        work_model="Remote",
        user_id=user.id
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    # 3. Create mock PDF content
    pdf_content = b"%PDF-1.4 Mock PDF Resume details: email jane.doe@example.com, skills: Python, FastAPI, React, SQL"
    
    # 4. Upload PDF Resume
    pdf_res = client.post(
        f"/api/v1/resumes/upload?job_id={job.id}",
        files={"file": ("jane_doe_resume.pdf", pdf_content, "application/pdf")},
        headers=headers
      )
    
    assert pdf_res.status_code == 200
    pdf_data = pdf_res.json()
    assert pdf_data["name"] == "Jane Doe Resume"
    assert pdf_data["email"] == "jane.doe@example.com"
    assert pdf_data["status"] == "Screened"
    assert pdf_data["ats_score"] > 0
    assert "python" in [s.lower() for s in pdf_data["skills"]]

    # 5. Upload DOCX Resume
    docx_file = create_mock_docx()
    docx_res = client.post(
        f"/api/v1/resumes/upload?job_id={job.id}",
        files={"file": ("john_doe_resume.docx", docx_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
        headers=headers
    )
    
    assert docx_res.status_code == 200
    docx_data = docx_res.json()
    assert docx_data["name"] == "John Doe Resume"
    assert docx_data["email"] == "john.doe@example.com"
    assert docx_data["status"] == "Screened"
    assert docx_data["ats_score"] > 0
    assert "react" in [s.lower() for s in docx_data["skills"]]
    
    # 6. Verify database records
    candidates = db_session.query(Candidate).all()
    assert len(candidates) == 2
    
    match_results = db_session.query(MatchResult).filter(MatchResult.job_id == job.id).all()
    assert len(match_results) == 2
    assert all(mr.ats_score > 0 for mr in match_results)
