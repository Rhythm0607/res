from app.database import SessionLocal
from app.models.schema import Candidate, MatchResult

db = SessionLocal()
candidate = db.query(Candidate).filter(Candidate.id == 8).first()
if candidate:
    print(f"Candidate ID: {candidate.id}")
    print(f"Name: {candidate.name}")
    print(f"Email: {candidate.email}")
else:
    print("Candidate not found.")
db.close()
