from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    credits: int
    onboarding_complete: bool = False


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileIn(BaseModel):
    college: str = ""
    graduation_year: str = ""
    target_role: str = ""
    experience_level: str = ""
    phone: str = ""
    city: str = ""
    onboarding_complete: bool = True


class ProfileOut(ProfileIn):
    email: str
    full_name: str
    credits: int


class InterviewCreate(BaseModel):
    level: Literal["internship", "fresher", "experienced"]
    role: str = Field(min_length=2, max_length=60)
    company: str
    duration_minutes: Literal[5, 10, 15, 20]
    resume_id: int | None = None


class AnswerIn(BaseModel):
    session_id: int
    question_id: int
    transcript: str = ""
    edited: bool = False


class SkipIn(BaseModel):
    session_id: int
    question_id: int


class SessionRef(BaseModel):
    session_id: int


class SpeechIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class OrderIn(BaseModel):
    plan: Literal["spark", "hustle", "grind", "beast"]


class VerifyIn(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class SimulateIn(BaseModel):
    order_id: str
