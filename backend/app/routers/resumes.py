import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..models import Resume, ResumeAnalysis, User
from ..services.resume_parser import analyze_resume, extract_text
from ..util import dumps, loads

router = APIRouter(prefix="/api/resumes", tags=["resumes"])


def _analysis_dict(analysis: ResumeAnalysis | None) -> dict | None:
    if analysis is None:
        return None
    return {
        "id": analysis.id,
        "skills": loads(analysis.skills_json, []),
        "languages": loads(analysis.languages_json, []),
        "education": loads(analysis.education_json, []),
        "projects": loads(analysis.projects_json, []),
        "internships": loads(analysis.internships_json, []),
        "achievements": loads(analysis.achievements_json, []),
        "tools": loads(analysis.tools_json, []),
        "summary": analysis.summary,
        "provider": analysis.provider,
        "created_at": analysis.created_at,
    }


def _resume_dict(resume: Resume, analysis: ResumeAnalysis | None = None) -> dict:
    return {
        "id": resume.id,
        "filename": resume.filename,
        "size_bytes": resume.size_bytes,
        "mime": resume.mime,
        "created_at": resume.created_at,
        "analysis": _analysis_dict(analysis),
    }


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = file.filename or "resume.pdf"
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        kind = "pdf"
    elif lower_name.endswith(".docx"):
        kind = "docx"
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX resume files are supported.")

    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size ({settings.max_upload_bytes // (1024 * 1024)}MB).",
        )
    if len(content) < 100:
        raise HTTPException(status_code=400, detail="The uploaded file appears to be empty or corrupted.")

    try:
        extracted = extract_text(kind, content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read text from resume file: {exc}")

    # Ensure upload directory exists
    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex[:12]}_{Path(filename).name}"
    dest_path = os.path.join(settings.upload_dir, safe_name)
    with open(dest_path, "wb") as f:
        f.write(content)

    analysis_data = analyze_resume(extracted)

    resume = Resume(
        user_id=user.id,
        filename=filename,
        stored_path=dest_path,
        mime=file.content_type or f"application/{kind}",
        size_bytes=len(content),
        extracted_text=extracted,
    )
    db.add(resume)
    db.flush()

    analysis = ResumeAnalysis(
        resume_id=resume.id,
        user_id=user.id,
        skills_json=dumps(analysis_data.get("skills", [])),
        languages_json=dumps(analysis_data.get("languages", [])),
        education_json=dumps(analysis_data.get("education", [])),
        projects_json=dumps(analysis_data.get("projects", [])),
        internships_json=dumps(analysis_data.get("internships", [])),
        achievements_json=dumps(analysis_data.get("achievements", [])),
        tools_json=dumps(analysis_data.get("tools", [])),
        summary=analysis_data.get("summary", ""),
        provider=analysis_data.get("provider", "local"),
    )
    db.add(analysis)
    db.commit()
    db.refresh(resume)
    db.refresh(analysis)

    return _resume_dict(resume, analysis)


@router.get("")
def list_resumes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resumes = list(
        db.scalars(select(Resume).where(Resume.user_id == user.id).order_by(Resume.id.desc())).all()
    )
    results = []
    for r in resumes:
        analysis = db.scalar(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.resume_id == r.id)
            .order_by(ResumeAnalysis.id.desc())
        )
        results.append(_resume_dict(r, analysis))
    return results


@router.get("/latest")
def get_latest_resume(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.scalar(
        select(Resume).where(Resume.user_id == user.id).order_by(Resume.id.desc())
    )
    if resume is None:
        return None
    analysis = db.scalar(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.resume_id == resume.id)
        .order_by(ResumeAnalysis.id.desc())
    )
    return _resume_dict(resume, analysis)


@router.get("/{resume_id}")
def get_resume(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if resume is None or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found.")
    analysis = db.scalar(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.resume_id == resume.id)
        .order_by(ResumeAnalysis.id.desc())
    )
    return _resume_dict(resume, analysis)


@router.delete("/{resume_id}")
def delete_resume(resume_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    resume = db.get(Resume, resume_id)
    if resume is None or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if os.path.exists(resume.stored_path):
        try:
            os.remove(resume.stored_path)
        except OSError:
            pass
    db.delete(resume)
    db.commit()
    return {"ok": True}
