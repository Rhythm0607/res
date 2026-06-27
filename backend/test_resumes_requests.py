import os
import io
import zipfile
import requests

BASE_URL = "http://localhost:8000/api/v1"

def create_mock_docx():
    """Generates a valid minimal DOCX zip structure in memory."""
    docx_io = io.BytesIO()
    with zipfile.ZipFile(docx_io, "w") as docx:
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

def test_flow():
    print("Starting integration test against running server...")
    
    # 1. Register a test user
    email = "jane.recruiter@example.com"
    pwd = "password123"
    
    reg_data = {
        "email": email,
        "password": pwd,
        "full_name": "Jane Recruiter"
    }
    
    # Try logging in first in case user already exists, or register
    login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd})
    if login_res.status_code == 200:
        print("Test user already exists, logged in.")
        token = login_res.json()["access_token"]
    else:
        reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
        if reg_res.status_code == 200:
            print("Successfully registered test user.")
        else:
            print(f"Failed to register test user: {reg_res.text}")
            
        login_res = requests.post(f"{BASE_URL}/auth/login", data={"username": email, "password": pwd})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a Job
    job_payload = {
        "title": "FastAPI Engineer",
        "department": "Engineering",
        "location": "Remote",
        "description": "Looking for a Python Developer experienced with FastAPI, React, and SQL database systems.",
        "required_skills": ["Python", "FastAPI", "React", "SQL"],
        "preferred_skills": ["Docker"],
        "experience_years": 4,
        "employment_type": "Full-time",
        "salary_range": "$120k-$140k",
        "work_model": "Remote"
    }
    
    job_res = requests.post(f"{BASE_URL}/jobs/", json=job_payload, headers=headers)
    assert job_res.status_code == 201, f"Job creation failed: {job_res.text}"
    job_data = job_res.json()
    job_id = job_data["id"]
    print(f"Created Job ID: {job_id}")

    # 3. Create mock PDF content
    pdf_content = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> /Contents 4 0 R >>\nendobj\n"
        b"4 0 obj\n<< /Length 60 >>\nstream\n"
        b"BT\n/F1 12 Tf\n70 700 Td\n(email: alice.dev@example.com skills: Python, FastAPI, React) Tj\nET\n"
        b"endstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000210 00000 n\n"
        b"trailer\n<< /Size 5 /Root 1 0 R >>\n"
        b"startxref\n321\n"
        b"%%EOF"
    )
    
    # 4. Upload PDF Resume
    print("Uploading PDF Resume...")
    pdf_files = {"file": ("alice_resume.pdf", pdf_content, "application/pdf")}
    pdf_res = requests.post(
        f"{BASE_URL}/resumes/upload?job_id={job_id}",
        files=pdf_files,
        headers=headers
    )
    
    assert pdf_res.status_code == 200, f"PDF upload failed: {pdf_res.text}"
    pdf_data = pdf_res.json()
    print("PDF Upload Result:", pdf_data)
    assert pdf_data["name"] == "Alice Resume"
    assert pdf_data["email"] == "alice.dev@example.com"
    assert pdf_data["status"] == "Screened"
    assert pdf_data["ats_score"] > 0

    # 5. Upload DOCX Resume
    print("Uploading DOCX Resume...")
    docx_file = create_mock_docx()
    docx_files = {"file": ("john_doe_resume.docx", docx_file, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    docx_res = requests.post(
        f"{BASE_URL}/resumes/upload?job_id={job_id}",
        files=docx_files,
        headers=headers
    )
    
    assert docx_res.status_code == 200, f"DOCX upload failed: {docx_res.text}"
    docx_data = docx_res.json()
    print("DOCX Upload Result:", docx_data)
    assert docx_data["name"] == "John Doe Resume"
    assert docx_data["email"] == "john.doe@example.com"
    assert docx_data["status"] == "Screened"
    assert docx_data["ats_score"] > 0

    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_flow()
