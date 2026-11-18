from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..data.catalog import BUDGET, COMPANIES, LEVELS, ROLES, TECHNICAL_ROLES
from ..database import get_db
from ..deps import get_current_user
from ..models import InterviewReport, InterviewSession, User
from ..schemas import AnswerIn, InterviewCreate, SkipIn
from ..services.interview_service import (
    _owned,
    create_session,
    end_session,
    session_payload,
    skip_question,
    start_session,
    submit_answer,
)

router = APIRouter(prefix="/api/interviews", tags=["interviews"])


@router.get("/catalog")
def get_catalog():
    return {
        "roles": ROLES,
        "technical_roles": sorted(list(TECHNICAL_ROLES)),
        "companies": [{"id": k, "name": k, "style": v} for k, v in COMPANIES.items()],
        "levels": [
            {"id": "internship", "name": "Internship", "desc": "Focus on core concepts, coursework, and willingness to learn."},
            {"id": "fresher", "name": "Fresher", "desc": "Covers CS fundamentals, basic design, coding concepts, and problem solving."},
            {"id": "experienced", "name": "Experienced", "desc": "In-depth architecture, production trade-offs, edge cases, and leadership."},
        ],
        "durations": [
            {"minutes": 5, "questions": BUDGET[5], "label": "Quick 5 min (3 Qs)"},
            {"minutes": 10, "questions": BUDGET[10], "label": "Standard 10 min (5 Qs)"},
            {"minutes": 15, "questions": BUDGET[15], "label": "In-Depth 15 min (7 Qs)"},
            {"minutes": 20, "questions": BUDGET[20], "label": "Full 20 min (10 Qs)"},
        ],
    }


@router.post("")
def create_interview(
    payload: InterviewCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = create_session(db, user, payload)
    return session_payload(db, session)


@router.get("/active")
def get_active_interview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.scalar(
        select(InterviewSession)
        .where(
            InterviewSession.user_id == user.id,
            InterviewSession.status.in_(["active", "configured"]),
        )
        .order_by(InterviewSession.id.desc())
    )
    if session is None:
        return None
    return session_payload(db, session)


@router.get("/history")
def get_interview_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = list(
        db.scalars(
            select(InterviewSession)
            .where(InterviewSession.user_id == user.id)
            .order_by(InterviewSession.id.desc())
        ).all()
    )
    results = []
    for s in sessions:
        report = db.scalar(select(InterviewReport).where(InterviewReport.session_id == s.id))
        results.append(
            {
                "id": s.id,
                "role": s.role,
                "level": s.level,
                "company": s.company,
                "duration_minutes": s.duration_minutes,
                "status": s.status,
                "started_at": s.started_at,
                "ended_at": s.ended_at,
                "created_at": s.created_at,
                "report_id": report.id if report else None,
                "overall_score": report.overall_score if report else None,
            }
        )
    return results


@router.get("/{session_id}")
def get_interview(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _owned(db, user, session_id)
    return session_payload(db, session)


@router.post("/{session_id}/start")
def start_interview(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return start_session(db, user, session_id)


@router.post("/{session_id}/answer")
def submit_interview_answer(
    session_id: int,
    body: AnswerIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.session_id != session_id:
        raise HTTPException(status_code=400, detail="Mismatched session identifier.")
    return submit_answer(db, user, session_id, body.question_id, body.transcript, body.edited)


@router.post("/{session_id}/skip")
def skip_interview_question(
    session_id: int,
    body: SkipIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.session_id != session_id:
        raise HTTPException(status_code=400, detail="Mismatched session identifier.")
    return skip_question(db, user, session_id, body.question_id)


@router.post("/{session_id}/end")
def end_interview(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return end_session(db, user, session_id)
