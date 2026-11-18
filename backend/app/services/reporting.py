from sqlalchemy import select
from sqlalchemy.orm import Session

from ..data.catalog import build_pool
from ..models import (
    AnswerEvaluation,
    CandidateAnswer,
    InterviewQuestion,
    InterviewReport,
    InterviewSession,
    ResumeAnalysis,
    StudyGuide,
    User,
    UserProgress,
)
from ..util import dumps, loads, utcnow


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 1)


def compile_snapshot(db: Session, session: InterviewSession) -> dict:
    questions = list(
        db.scalars(
            select(InterviewQuestion).where(InterviewQuestion.session_id == session.id).order_by(InterviewQuestion.order_index)
        ).all()
    )
    answers = {
        row.question_id: row
        for row in db.scalars(select(CandidateAnswer).where(CandidateAnswer.session_id == session.id)).all()
    }
    evals = {}
    if answers:
        evals = {
            row.answer_id: row
            for row in db.scalars(select(AnswerEvaluation).where(AnswerEvaluation.answer_id.in_([a.id for a in answers.values()]))).all()
        }
    items = []
    for question in questions:
        answer = answers.get(question.id)
        if answer is None:
            continue
        evaluation = evals.get(answer.id)
        if evaluation is None:
            continue
        items.append(
            {
                "question": question.text,
                "topic": question.topic,
                "answer": answer.transcript,
                "score": evaluation.score,
                "strengths": loads(evaluation.strengths_json, []),
                "weaknesses": loads(evaluation.weaknesses_json, []),
                "mistakes": loads(evaluation.incorrect_json, []),
                "missing_concepts": loads(evaluation.missing_json, []),
                "ideal_answer": evaluation.ideal_answer,
                "suggestion": evaluation.suggestion,
                "dimensions": {
                    "technical": evaluation.technical,
                    "relevance": evaluation.relevance,
                    "conceptual": evaluation.conceptual,
                    "completeness": evaluation.completeness,
                    "clarity": evaluation.clarity,
                    "communication": evaluation.communication,
                    "problem_solving": evaluation.problem_solving,
                },
            }
        )
    return {"items": items}


def _recommendations(session: InterviewSession, items: list[dict], overall: float, db: Session) -> dict:
    topic_scores: dict[str, list[float]] = {}
    for item in items:
        topic_scores.setdefault(item["topic"], []).append(item["score"])
    weak = [topic for topic, scores in topic_scores.items() if _mean(scores) < 6]
    analysis = None
    if session.resume_id:
        row = db.scalar(select(ResumeAnalysis).where(ResumeAnalysis.resume_id == session.resume_id))
        if row is not None:
            analysis = {"skills": loads(row.skills_json, []), "projects": loads(row.projects_json, [])}
    pool = build_pool(session.level, session.role, session.company, analysis)
    asked = {item["question"] for item in items}
    practice = [entry["text"] for entry in pool if entry["text"] not in asked][:4]
    if overall >= 80:
        nxt = "Practice a harder round and answer with trade-offs unprompted."
    elif overall >= 50:
        nxt = "Stay at this level and tighten the topics scored below 6."
    else:
        nxt = "Repeat this level with shorter, concept-first answers before moving up."
    return {
        "weak_topics": weak,
        "study_topics": weak or [item["topic"] for item in items[:3]],
        "practice_questions": practice,
        "next_difficulty": nxt,
    }


def create_report(db: Session, user: User, session: InterviewSession) -> InterviewReport | None:
    existing = db.scalar(select(InterviewReport).where(InterviewReport.session_id == session.id))
    if existing is not None:
        return existing
    snapshot = compile_snapshot(db, session)
    items = snapshot["items"]
    if not items:
        session.status = "abandoned"
        session.ended_at = utcnow()
        db.flush()
        return None

    scores = [item["score"] for item in items]
    overall = round(_mean(scores) * 10, 1)
    correct = sum(1 for score in scores if score >= 7)
    categories = {
        "technical": round(_mean([item["dimensions"]["technical"] for item in items]) * 10, 1),
        "communication": round(_mean([item["dimensions"]["communication"] for item in items]) * 10, 1),
        "relevance": round(_mean([item["dimensions"]["relevance"] for item in items]) * 10, 1),
        "conceptual": round(_mean([item["dimensions"]["conceptual"] for item in items]) * 10, 1),
        "problem_solving": round(_mean([item["dimensions"]["problem_solving"] for item in items]) * 10, 1),
    }
    recommendations = _recommendations(session, items, overall, db)
    previous = list(
        db.scalars(
            select(InterviewReport)
            .where(InterviewReport.user_id == user.id, InterviewReport.completion_status == "completed")
            .order_by(InterviewReport.id.desc())
        ).all()
    )
    comparison = [
        {"report_id": row.id, "score": row.overall_score, "created_at": row.created_at.isoformat()}
        for row in reversed(previous[:6])
        if row.overall_score is not None
    ]
    report = InterviewReport(
        session_id=session.id,
        user_id=user.id,
        overall_score=overall,
        completion_status="completed",
        total_questions=len(items),
        correct_count=correct,
        needs_improvement=len(items) - correct,
        categories_json=dumps(categories),
        recommendations_json=dumps(recommendations),
        comparison_json=dumps(comparison),
        questions_json=dumps(items),
    )
    db.add(report)
    db.flush()
    guide_items = [
        {
            "question": item["question"],
            "candidate_answer": item["answer"],
            "model_answer": item["ideal_answer"],
            "score": item["score"],
            "tips": item["suggestion"],
        }
        for item in items
    ]
    db.add(
        StudyGuide(
            report_id=report.id,
            session_id=session.id,
            user_id=user.id,
            items_json=dumps(guide_items),
        )
    )
    session.status = "completed"
    session.ended_at = utcnow()
    if not session.credit_charged and user.credits > 0:
        user.credits -= 1
        session.credit_charged = True
    _refresh_progress(db, user.id)
    db.flush()
    return report


def _refresh_progress(db: Session, user_id: int) -> None:
    reports = list(
        db.scalars(
            select(InterviewReport)
            .where(InterviewReport.user_id == user_id, InterviewReport.completion_status == "completed")
            .order_by(InterviewReport.id.asc())
        ).all()
    )
    scores = [row.overall_score for row in reports if row.overall_score is not None]
    weakest: dict[str, int] = {}
    for row in reports:
        for topic in loads(row.recommendations_json, {}).get("weak_topics") or []:
            weakest[topic] = weakest.get(topic, 0) + 1
    ranked = [topic for topic, _count in sorted(weakest.items(), key=lambda item: item[1], reverse=True)]
    progress = db.get(UserProgress, user_id)
    if progress is None:
        progress = UserProgress(user_id=user_id)
        db.add(progress)
    progress.completed = len(reports)
    progress.average_score = round(sum(scores) / len(scores), 1) if scores else None
    progress.highest_score = max(scores) if scores else None
    progress.weakest_json = dumps(ranked[:5])
    progress.recommended_json = dumps(ranked[:5])
    progress.updated_at = utcnow()


def report_dict(report: InterviewReport, session: InterviewSession) -> dict:
    return {
        "id": report.id,
        "session_id": report.session_id,
        "level": session.level,
        "role": session.role,
        "company": session.company,
        "duration_minutes": session.duration_minutes,
        "overall_score": report.overall_score,
        "completion_status": report.completion_status,
        "total_questions": report.total_questions,
        "correct_count": report.correct_count,
        "needs_improvement": report.needs_improvement,
        "categories": loads(report.categories_json, {}),
        "recommendations": loads(report.recommendations_json, {}),
        "comparison": loads(report.comparison_json, []),
        "questions": loads(report.questions_json, []),
        "created_at": report.created_at,
    }
