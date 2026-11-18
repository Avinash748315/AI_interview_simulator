from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import InterviewReport, InterviewSession, StudyGuide, User
from ..services.pdf_report import build_report_pdf
from ..services.reporting import report_dict
from ..util import loads

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{report_id}")
def get_report(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.get(InterviewReport, report_id)
    if report is None or report.user_id != user.id:
        raise HTTPException(status_code=404, detail="Interview report not found.")
    session = db.get(InterviewSession, report.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return report_dict(report, session)


@router.get("/session/{session_id}")
def get_report_by_session(
    session_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.scalar(
        select(InterviewReport).where(
            InterviewReport.session_id == session_id, InterviewReport.user_id == user.id
        )
    )
    if report is None:
        raise HTTPException(status_code=404, detail="Interview report not found for this session.")
    session = db.get(InterviewSession, report.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return report_dict(report, session)


@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.get(InterviewReport, report_id)
    if report is None or report.user_id != user.id:
        raise HTTPException(status_code=404, detail="Interview report not found.")
    session = db.get(InterviewSession, report.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    data = report_dict(report, session)
    pdf_bytes = build_report_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=clarivo_report_{report_id}.pdf"},
    )


@router.get("/{report_id}/study-guide")
def get_report_study_guide(
    report_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    guide = db.scalar(
        select(StudyGuide).where(StudyGuide.report_id == report_id, StudyGuide.user_id == user.id)
    )
    if guide is None:
        raise HTTPException(status_code=404, detail="Study guide not found.")
    return {
        "report_id": guide.report_id,
        "session_id": guide.session_id,
        "items": loads(guide.items_json, []),
    }
