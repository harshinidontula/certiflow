from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.TokenResponse)
def register(req: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    org = models.Organization(name=req.organization_name)
    db.add(org)
    db.commit()
    db.refresh(org)

    hashed_pw = auth.get_password_hash(req.password)
    user = models.User(
        email=req.email,
        hashed_password=hashed_pw,
        full_name=req.full_name,
        role=req.role or "Admin",
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_name": org.name,
            "organization_id": org.id
        }
    }

@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    org_name = user.organization.name if user.organization else "CertiFlow Org"
    token = auth.create_access_token({"sub": user.id, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_name": org_name,
            "organization_id": user.organization_id
        }
    }

@router.get("/me")
def get_current_user_profile(user: models.User = Depends(auth.get_current_user)):
    org = user.organization
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "organization": {
            "id": org.id if org else None,
            "name": org.name if org else "CertiFlow Org",
            "logo_url": org.logo_url if org else None,
            "website": org.website if org else None,
            "contact_email": org.contact_email if org else None
        }
    }

@router.put("/profile")
def update_profile(req: schemas.UserProfileUpdate, user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if req.full_name:
        user.full_name = req.full_name
    if user.organization:
        if req.organization_name:
            user.organization.name = req.organization_name
        if req.website:
            user.organization.website = req.website
        if req.contact_email:
            user.organization.contact_email = req.contact_email
        if req.logo_url:
            user.organization.logo_url = req.logo_url
    db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest):
    # Simulated password reset link
    return {"message": f"Password reset instructions have been sent to {req.email}"}
