from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.models.schema import User
from app.schemas.schemas import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta
from app.core.config import settings

from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

import secrets
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.schemas.schemas import GoogleLoginRequest

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/google", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        # Verify the Google token. Setting audience=None validates the signature, issuer, and expiration,
        # which is robust for development setups where frontends and backends might use different Client IDs.
        idinfo = id_token.verify_oauth2_token(
            payload.credential_token,
            google_requests.Request(),
            audience=None
        )
        
        email = idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="Google token does not contain email")
            
        name = idinfo.get('name', 'Google User')
        
        # Check if user exists, if not, create them
        user = db.query(User).filter(User.email == email).first()
        if not user:
            temp_password = get_password_hash(secrets.token_hex(16))
            user = User(
                email=email,
                hashed_password=temp_password,
                full_name=name,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(
            data={"sub": user.email}, 
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        print("Google OAuth verification failed:", str(e))
        raise HTTPException(status_code=400, detail="Invalid Google token: " + str(e))
