import threading
from datetime import timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..data.catalog import BUDGET, COMPANIES, LEVELS, ROLES
from ..models import (
    AnswerEvaluation,
    CandidateAnswer,
    InterviewQuestion,
    InterviewSession,
    Resume,
    ResumeAnalysis,
    User,
)
from ..util import dumps, loads, utcnow
from .engine import evaluate_answer, plan_question
from .reporting import create_report

_guard = threading.Lock()
_locks: dict[str, threading.Lock] = {}

CLOSING = "Thank you. That completes this interview. I will prepare your feedback report now."
GREETING_NAME = "Asha"


def _lock(key: str) -> threading.Lock:
    with _guard:
        if key not in _locks:
            _locks[key] = threading.Lock()
        return _locks[key]


def _analysis_dict(db: Session, user_id: int, resume_id: int | None) -> dict | None:
    if not resume_id:
        return None
    row = db.scalar(
        select(ResumeAnalysis)
        .where(ResumeAnalysis.resume_id == resume_id, ResumeAnalysis.user_id == user_id)
        .order_by(ResumeAnalysis.id.desc())
    )
    if row is None:
        return None
    return {
        "skills": loads(row.skills_json, []),
        "languages": loads(row.languages_json, []),
        "education": loads(row.education_json, []),
        "projects": loads(row.projects_json, []),
        "internships": loads(row.internships_json, []),
        "achievements": loads(row.achievements_json, []),
        "tools": loads(row.tools_json, []),
        "summary": row.summary,
    }


def public_question(question: InterviewQuestion) -> dict:
    return {
        "id": question.id,
        "text": question.text,
        "topic": question.topic,
        "difficulty": question.difficulty,
        "order_index": question.order_index,
        "is_followup": question.is_followup,
    }


def _owned(db: Session, user: User, session_id: int) -> InterviewSession:
    session = db.get(InterviewSession, session_id)
    if session is None or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Interview not found.")
    return session


def _questions(db: Session, session_id: int) -> list[InterviewQuestion]:
    return list(
        db.scalars(
            select(InterviewQuestion).where(InterviewQuestion.session_id == session_id).order_by(InterviewQuestion.order_index)
        ).all()
    )


def _answers(db: Session, session_id: int) -> dict[int, CandidateAnswer]:
    rows = db.scalars(select(CandidateAnswer).where(CandidateAnswer.session_id == session_id)).all()
    return {row.question_id: row for row in rows}


def _save_question(db: Session, session: InterviewSession, payload: dict, order_index: int) -> InterviewQuestion:
    question = InterviewQuestion(
        session_id=session.id,
        order_index=order_index,
        text=payload["text"].strip(),
        topic=payload.get("topic") or "interview",
        difficulty=payload.get("difficulty") or "medium",
        is_followup=bool(payload.get("is_followup")),
        concepts_json=dumps(payload.get("concepts") or []),
        model_answer=payload.get("model") or "",
        followup_json=dumps(payload.get("followup")) if payload.get("followup") else "",
        provider=payload.get("provider") or "local",
    )
    db.add(question)
    db.flush()
    return question


def _turns(db: Session, session: InterviewSession) -> list[dict]:
    answers = _answers(db, session.id)
    turns = []
    for question in _questions(db, session.id):
        answer = answers.get(question.id)
        turns.append(
            {
                "question_id": question.id,
                "question": question.text,
                "topic": question.topic,
                "answer": answer.transcript if answer else None,
            }
        )
    return turns


def session_payload(db: Session, session: InterviewSession, *, greeting: str | None = None, resumed: bool = False) -> dict:
    questions = _questions(db, session.id)
    answers = _answers(db, session.id)
    pending = next((q for q in reversed(questions) if q.id not in answers), None)
    return {
        "session_id": session.id,
        "status": session.status,
        "level": session.level,
        "role": session.role,
        "company": session.company,
        "duration_minutes": session.duration_minutes,
        "question_budget": session.question_budget,
        "questions_asked": len(questions),
        "started_at": session.started_at,
        "interviewer": questions[-1].provider if questions else "local",
        "greeting": greeting,
        "resumed": resumed,
        "question": public_question(pending) if pending else None,
        "turns": _turns(db, session),
        "closing": CLOSING if session.status == "active" and pending is None and questions else None,
    }


def create_session(db: Session, user: User, payload) -> InterviewSession:
    if payload.level not in LEVELS:
        raise HTTPException(status_code=422, detail="Choose Internship, Fresher, or Experienced.")
    if payload.company not in COMPANIES:
        raise HTTPException(status_code=422, detail="Choose a supported company style.")
    if payload.duration_minutes not in BUDGET:
        raise HTTPException(status_code=422, detail="Choose a 5, 10, 15, or 20 minute interview.")
    role = payload.role.strip()
    if role not in ROLES and not 2 <= len(role) <= 60:
        raise HTTPException(status_code=422, detail="Enter a job role between 2 and 60 characters.")
    if user.credits < 1:
        raise HTTPException(status_code=402, detail="You have no interview credits left. Add a pack to continue.")
    if payload.resume_id is not None:
        resume = db.get(Resume, payload.resume_id)
        if resume is None or resume.user_id != user.id:
            raise HTTPException(status_code=404, detail="Resume not found.")

    with _lock(f"user:{user.id}"):
        active = db.scalar(
            select(InterviewSession).where(InterviewSession.user_id == user.id, InterviewSession.status == "active")
        )
        if active is not None:
            raise HTTPException(
                status_code=409,
                detail={"message": "Finish or end your current interview before starting another.", "session_id": active.id},
            )
        configured = db.scalars(
            select(InterviewSession).where(InterviewSession.user_id == user.id, InterviewSession.status == "configured")
        ).all()
        for row in configured:
            db.delete(row)
        session = InterviewSession(
            user_id=user.id,
            level=payload.level,
            role=role,
            company=payload.company,
            duration_minutes=payload.duration_minutes,
            resume_id=payload.resume_id,
            status="configured",
            question_budget=BUDGET[payload.duration_minutes],
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session


def start_session(db: Session, user: User, session_id: int) -> dict:
    with _lock(f"session:{session_id}"):
        session = _owned(db, user, session_id)
        if session.status == "completed" or session.status == "abandoned":
            raise HTTPException(status_code=400, detail="This interview has already ended.")
        questions = _questions(db, session.id)
        answers = _answers(db, session.id)
        if session.status == "active":
            pending = next((q for q in reversed(questions) if q.id not in answers), None)
            if pending is None and questions:
                return {**session_payload(db, session), "done": True, "closing": CLOSING}
            return {**session_payload(db, session, resumed=True), "done": False}
        analysis = _analysis_dict(db, user.id, session.resume_id)
        planned = plan_question(session, [], {}, None, analysis, "")
        if planned is None:
            raise HTTPException(status_code=500, detail="A question could not be prepared.")
        _save_question(db, session, planned, 1)
        session.status = "active"
        session.started_at = utcnow()
        db.commit()
        db.refresh(session)
        greeting = (
            f"Hello {user.full_name.split()[0]}. I am {GREETING_NAME}, and I will interview you for a "
            f"{session.level} {session.role} round in a {session.company} interview style. "
            "I will ask one question at a time. Answer out loud, then you can correct the transcript before I continue."
        )
        return {**session_payload(db, session, greeting=greeting), "done": False}


def _over_time(session: InterviewSession) -> bool:
    if session.started_at is None:
        return False
    started = session.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    now = utcnow()
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    elapsed = (now - started).total_seconds()
    return elapsed > session.duration_minutes * 60 + 45


def _store_answer(db: Session, session: InterviewSession, question: InterviewQuestion, transcript: str, edited: bool) -> AnswerEvaluation:
    if db.scalar(select(CandidateAnswer).where(CandidateAnswer.question_id == question.id)):
        raise HTTPException(status_code=409, detail="That question already has an answer.")
    text = transcript.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Enter or record an answer before continuing.")
    answer = CandidateAnswer(
        question_id=question.id,
        session_id=session.id,
        transcript=text[:8000],
        edited=edited,
    )
    db.add(answer)
    db.flush()
    scored = evaluate_answer(question, answer.transcript)
    evaluation = AnswerEvaluation(
        answer_id=answer.id,
        technical=scored["technical"],
        relevance=scored["relevance"],
        conceptual=scored["conceptual"],
        completeness=scored["completeness"],
        clarity=scored["clarity"],
        communication=scored["communication"],
        problem_solving=scored["problem_solving"],
        score=scored["score"],
        strengths_json=dumps(scored["strengths"]),
        weaknesses_json=dumps(scored["weaknesses"]),
        missing_json=dumps(scored["missing"]),
        incorrect_json=dumps(scored["incorrect"]),
        suggestion=scored["suggestion"],
        ideal_answer=scored["ideal_answer"],
        provider=scored["provider"],
    )
    db.add(evaluation)
    db.flush()
    return evaluation


def _after_answer(db: Session, user: User, session: InterviewSession, evaluation: AnswerEvaluation, transcript: str) -> dict:
    questions = _questions(db, session.id)
    if len(questions) >= session.question_budget or _over_time(session):
        db.commit()
        return {"done": True, "closing": CLOSING, "session_id": session.id, "questions_asked": len(questions), "question_budget": session.question_budget, "question": None}
    analysis = _analysis_dict(db, user.id, session.resume_id)
    answers = _answers(db, session.id)
    planned = plan_question(session, questions, answers, evaluation, analysis, transcript)
    if planned is None:
        db.commit()
        return {"done": True, "closing": CLOSING, "session_id": session.id, "questions_asked": len(questions), "question_budget": session.question_budget, "question": None}
    question = _save_question(db, session, planned, len(questions) + 1)
    db.commit()
    return {
        "done": False,
        "closing": None,
        "session_id": session.id,
        "questions_asked": question.order_index,
        "question_budget": session.question_budget,
        "question": public_question(question),
    }


def submit_answer(db: Session, user: User, session_id: int, question_id: int, transcript: str, edited: bool) -> dict:
    with _lock(f"session:{session_id}"):
        session = _owned(db, user, session_id)
        if session.status != "active":
            raise HTTPException(status_code=400, detail="Start the interview before submitting an answer.")
        question = db.get(InterviewQuestion, question_id)
        if question is None or question.session_id != session.id:
            raise HTTPException(status_code=404, detail="Question not found.")
        evaluation = _store_answer(db, session, question, transcript, edited)
        return _after_answer(db, user, session, evaluation, transcript.strip())


def skip_question(db: Session, user: User, session_id: int, question_id: int) -> dict:
    return submit_answer(
        db,
        user,
        session_id,
        question_id,
        "I don't know. I would like to move to the next question.",
        True,
    )


def end_session(db: Session, user: User, session_id: int) -> dict:
    with _lock(f"session:{session_id}"):
        session = _owned(db, user, session_id)
        if session.status in {"completed", "abandoned"}:
            report = create_report(db, user, session)
            return {"report_id": None if report is None else report.id, "status": session.status, "overall_score": None if report is None else report.overall_score}
        report = create_report(db, user, session)
        db.commit()
        db.refresh(session)
        fresh = None if report is None else db.get(type(report), report.id)
        return {
            "report_id": None if fresh is None else fresh.id,
            "status": session.status,
            "overall_score": None if fresh is None else fresh.overall_score,
        }
