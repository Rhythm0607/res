from app.core.config import settings

print("Checking SMTP settings loaded by Pydantic:")
print(f"SMTP_USER: {settings.SMTP_USER!r}")
print(f"SMTP_PASSWORD: {'***' if settings.SMTP_PASSWORD else 'EMPTY'}")
print(f"SMTP_HOST: {settings.SMTP_HOST!r}")
print(f"SMTP_PORT: {settings.SMTP_PORT!r}")
print(f"SMTP_FROM: {settings.SMTP_FROM!r}")
print(f"OPENAI_API_KEY: {'***' if settings.OPENAI_API_KEY else 'EMPTY'}")
print(f"GEMINI_API_KEY: {'***' if settings.GEMINI_API_KEY else 'EMPTY'}")
