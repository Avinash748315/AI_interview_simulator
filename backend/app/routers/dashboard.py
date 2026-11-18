from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import InterviewReport, InterviewSession, Resume, ResumeAnalysis, User, UserProgress
from ..util import loads

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = db.get(UserProgress, user.id)
    reports = list(
        db.scalars(
            select(InterviewReport)
            .where(InterviewReport.user_id == user.id, InterviewReport.completion_status == "completed")
            .order_by(InterviewReport.id.desc())
        ).all()
    )

    scores = [r.overall_score for r in reports if r.overall_score is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else None
    highest_score = max(scores) if scores else None

    # Performance trend (chronological)
    trend = [
        {
            "report_id": r.id,
            "session_id": r.session_id,
            "score": r.overall_score,
            "created_at": r.created_at.isoformat(),
        }
        for r in reversed(reports[:8])
        if r.overall_score is not None
    ]

    # Category performance averages
    categories_agg: dict[str, list[float]] = {}
    for r in reports:
        cat = loads(r.categories_json, {})
        for k, v in cat.items():
            if isinstance(v, (int, float)):
                categories_agg.setdefault(k, []).append(float(v))
    categories_avg = {
        k: round(sum(v) / len(v), 1) for k, v in categories_agg.items()
    }

    # Recent sessions
    recent_sessions = []
    recent_rows = list(
        db.scalars(
            select(InterviewSession)
            .where(InterviewSession.user_id == user.id)
            .order_by(InterviewSession.id.desc())
            .limit(5)
        ).all()
    )
    for s in recent_rows:
        rep = db.scalar(select(InterviewReport).where(InterviewReport.session_id == s.id))
        recent_sessions.append(
            {
                "id": s.id,
                "role": s.role,
                "level": s.level,
                "company": s.company,
                "duration_minutes": s.duration_minutes,
                "status": s.status,
                "created_at": s.created_at,
                "overall_score": rep.overall_score if rep else None,
                "report_id": rep.id if rep else None,
            }
        )

    # Resume status
    latest_resume = db.scalar(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.id.desc())
    )
    resume_status = None
    if latest_resume:
        analysis = db.scalar(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.resume_id == latest_resume.id)
            .order_by(ResumeAnalysis.id.desc())
        )
        resume_status = {
            "id": latest_resume.id,
            "filename": latest_resume.filename,
            "created_at": latest_resume.created_at,
            "skills": loads(analysis.skills_json, []) if analysis else [],
            "summary": analysis.summary if analysis else "",
        }

    weak_topics = loads(progress.weakest_json, []) if progress else []
    recommended = loads(progress.recommended_json, []) if progress else []

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "credits": user.credits,
            "onboarding_complete": bool(user.profile and user.profile.onboarding_complete),
        },
        "stats": {
            "total_interviews": len(reports),
            "average_score": avg_score,
            "highest_score": highest_score,
            "credits_remaining": user.credits,
        },
        "trend": trend,
        "categories_avg": categories_avg,
        "recent_sessions": recent_sessions,
        "resume": resume_status,
        "weak_topics": weak_topics,
        "recommended_topics": recommended,
    }
