from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')

def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    embeddings = model.encode([resume_text, jd_text])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(similarity) * 100

def calculate_ats_score(semantic_score: float, skill_match: float, exp_match: float, edu_match: float) -> float:
    return (semantic_score * 0.40) + (skill_match * 0.25) + (exp_match * 0.15) + (edu_match * 0.10) + 10.0
