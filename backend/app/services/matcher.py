# Cache model instance to load lazily only when needed
_model = None

def get_sentence_transformer():
    global _model
    if _model is None:
        print("Lazy-loading SentenceTransformer('all-MiniLM-L6-v2')...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def compute_semantic_similarity(resume_text: str, jd_text: str) -> float:
    from sklearn.metrics.pairwise import cosine_similarity
    model = get_sentence_transformer()
    embeddings = model.encode([resume_text, jd_text])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(similarity) * 100

def calculate_ats_score(semantic_score: float, skill_match: float, exp_match: float, edu_match: float) -> float:
    return (semantic_score * 0.40) + (skill_match * 0.25) + (exp_match * 0.15) + (edu_match * 0.10) + 10.0
