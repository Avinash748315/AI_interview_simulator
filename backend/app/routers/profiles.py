from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Profile, User
from ..schemas import ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _profile_out(user: User, profile: Profile) -> ProfileOut:
    return ProfileOut(
        email=user.email,
        full_name=user.full_name,
        credits=user.credits,
        college=profile.college or "",
        graduation_year=profile.graduation_year or "",
        target_role=profile.target_role or "",
        experience_level=profile.experience_level or "",
        phone=profile.phone or "",
        city=profile.city or "",
        onboarding_complete=bool(profile.onboarding_complete),
    )


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.profile
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return _profile_out(user, profile)


@router.put("", response_model=ProfileOut)
def update_profile(body: ProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = user.profile
    if profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
    profile.college = body.college.strip()
    profile.graduation_year = body.graduation_year.strip()
    profile.target_role = body.target_role.strip()
    profile.experience_level = body.experience_level.strip()
    profile.phone = body.phone.strip()
    profile.city = body.city.strip()
    profile.onboarding_complete = body.onboarding_complete
    db.commit()
    db.refresh(profile)
    db.refresh(user)
    return _profile_out(user, profile)
