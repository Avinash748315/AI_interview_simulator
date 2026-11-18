from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..limiter import enforce_rate_limit
from ..models import Profile, User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    complete = bool(user.profile and user.profile.onboarding_complete)
    return UserOut(id=user.id, full_name=user.full_name, email=user.email, credits=user.credits, onboarding_complete=complete)


def _token(user: User) -> TokenOut:
    return TokenOut(access_token=create_access_token(user.id, user.token_version), user=_user_out(user))


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"register:{request.client.host if request.client else 'local'}", 8, 300)
    email = body.email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    user = User(email=email, full_name=body.full_name.strip(), password_hash=hash_password(body.password), credits=2, token_version=0)
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id))
    db.commit()
    db.refresh(user)
    return _token(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    enforce_rate_limit(f"login:{request.client.host if request.client else 'local'}", 12, 300)
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _token(user)


@router.post("/logout")
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token_version += 1
    db.commit()
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)
