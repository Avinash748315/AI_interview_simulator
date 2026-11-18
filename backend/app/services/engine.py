import re
from difflib import SequenceMatcher

import httpx

from ..config import settings
from ..data.catalog import build_pool
from ..util import loads

WEIGHTS = {
    "technical": 0.24,
    "relevance": 0.14,
    "conceptual": 0.16,
    "completeness": 0.14,
    "clarity": 0.10,
    "communication": 0.10,
    "problem_solving": 0.12,
}

STOP = {
    "about", "with", "that", "this", "from", "your", "have", "what", "when", "where", "would",
    "could", "should", "there", "their", "which", "using", "into", "than", "then", "them",
    "because", "while", "does", "were", "been", "being", "will", "just", "only", "also",
    "interview", "question", "explain", "describe", "through", "other", "every",
}

FALSE_PATTERNS = [
    (re.compile(r"\bhttp is encrypted\b", re.I), "HTTP itself is not encrypted. HTTPS adds TLS."),
    (re.compile(r"\btcp\b[^.]*\bconnectionless\b", re.I), "TCP is connection-oriented. UDP is the common connectionless transport."),
    (re.compile(r"\bprimary key\b[^.]*\b(duplicated|duplicates|repeated)\b", re.I), "Primary key values must be unique."),
    (re.compile(r"\bhttps\b[^.]*\bdoes not encrypt\b", re.I), "HTTPS encrypts HTTP traffic with TLS."),
]


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def concept_hit(concept: str, answer: str) -> bool:
    folded = answer.lower()
    needle = concept.lower().strip()
    if not needle:
        return False
    if needle in folded:
        return True
    compact_answer = folded.replace("-", "").replace(" ", "")
    compact_needle = needle.replace("-", "").replace(" ", "")
    if compact_needle and compact_needle in compact_answer:
        return True
    # O(n^2) style concepts
    if needle.startswith("o(") and needle.replace(" ", "") in folded.replace(" ", ""):
        return True
    return False


def _tokens(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z0-9+.#/-]{1,}", text.lower())


def said_dont_know(answer: str) -> bool:
    return bool(re.search(r"\b(i don't know|i dont know|no idea|not sure|skip this|pass)\b", answer.lower()))


def evaluate_locally(question: str, concepts: list[str], model_answer: str, answer: str) -> dict:
    raw = (answer or "").strip()
    folded = raw.lower()
    tokens = _tokens(raw)
    word_count = len(tokens)
    concepts = [c for c in concepts if c]
    hits = [c for c in concepts if concept_hit(c, raw)]
    missing = [c for c in concepts if c not in hits]
    coverage = (len(hits) / len(concepts)) if concepts else 0.45

    question_terms = [t for t in _tokens(question) if t not in STOP and len(t) > 3]
    rel_hits = sum(1 for term in question_terms if term in folded)
    relevance = _clamp(rel_hits / max(3, len(question_terms) * 0.34))

    markers = ["because", "for example", "for instance", "so that", "which means", "trade-off", "tradeoff", "approach", "first", "then"]
    marker_hits = sum(1 for marker in markers if marker in folded)
    conceptual = _clamp(0.25 + coverage * 0.5 + marker_hits * 0.08)

    if word_count < 12:
        completeness = _clamp(0.15 + coverage * 0.25)
    elif word_count < 40:
        completeness = _clamp(0.4 + coverage * 0.45)
    elif word_count < 160:
        completeness = _clamp(0.55 + coverage * 0.4)
    else:
        completeness = _clamp(0.5 + coverage * 0.25)

    fillers = len(re.findall(r"\b(um|uh|like|basically|actually)\b", folded))
    clarity = _clamp(0.7 + marker_hits * 0.04 - fillers * 0.07 + (0.05 if 20 <= word_count <= 160 else -0.12))
    communication = _clamp((0.28 if word_count < 15 else 0.62) + coverage * 0.25 - fillers * 0.05)
    ps_markers = ["approach", "step", "trade", "edge", "complex", "optimi", "design", "impact", "result", "metric", "measure"]
    problem_solving = _clamp(0.2 + coverage * 0.35 + 0.07 * sum(1 for marker in ps_markers if marker in folded))
    technical = _clamp(coverage * 0.75 + (0.25 if marker_hits else 0))
    if word_count < 20:
        technical *= 0.7
    if coverage < 0.34 and word_count > 80:
        technical = min(technical, 0.35)
        completeness = min(completeness, 0.5)
    if said_dont_know(raw) and coverage < 0.34:
        technical = min(technical, 0.2)
        completeness = min(completeness, 0.2)
        communication = min(communication, 0.35)

    dimensions = {
        "technical": round(technical * 10, 1),
        "relevance": round(relevance * 10, 1),
        "conceptual": round(conceptual * 10, 1),
        "completeness": round(completeness * 10, 1),
        "clarity": round(clarity * 10, 1),
        "communication": round(communication * 10, 1),
        "problem_solving": round(problem_solving * 10, 1),
    }
    score = round(sum((dimensions[name] / 10) * weight for name, weight in WEIGHTS.items()) * 10, 1)

    strengths = []
    if hits:
        strengths.append("Covers " + ", ".join(hits[:3]) + ".")
    if marker_hits:
        strengths.append("Gives a reason or an example instead of only naming a term.")
    if not strengths:
        strengths.append("The answer is on record and can be revised with a concrete example.")

    weaknesses = []
    if word_count < 15:
        weaknesses.append("The answer is too short to show how the idea works.")
    if missing:
        weaknesses.append("Missing concepts: " + ", ".join(missing[:4]) + ".")
    if fillers > 3:
        weaknesses.append("Filler words make the explanation harder to follow.")
    if coverage < 0.34 and word_count > 80:
        weaknesses.append("Length does not make up for the missing concepts.")
    if said_dont_know(raw):
        weaknesses.append("The answer says this topic is not known yet.")
    if not weaknesses:
        weaknesses.append("The answer can still be tighter about the trade-off and the result.")

    incorrect = [message for pattern, message in FALSE_PATTERNS if pattern.search(raw)]
    if missing:
        suggestion = f"Add a specific example that explains {missing[0]}, including the trade-off and how you would judge the result."
    elif word_count < 20:
        suggestion = "Rebuild the answer as situation, what you did, the trade-off, and the result."
    else:
        suggestion = "Close with how you would measure that the approach worked."

    ideal = (model_answer or "").strip()
    if len(ideal) < 40:
        covered = ", ".join(concepts) if concepts else "the idea in the question"
        ideal = f"A strong answer defines the idea, covers {covered}, gives one concrete example, names a trade-off, and says how to tell the result worked."

    return {
        "technical": dimensions["technical"],
        "relevance": dimensions["relevance"],
        "conceptual": dimensions["conceptual"],
        "completeness": dimensions["completeness"],
        "clarity": dimensions["clarity"],
        "communication": dimensions["communication"],
        "problem_solving": dimensions["problem_solving"],
        "score": score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing": missing,
        "incorrect": incorrect,
        "suggestion": suggestion,
        "ideal_answer": ideal,
        "provider": "local",
    }


def _similar(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _local_choice(session, questions, last_eval, analysis: dict | None, answer_text: str = "") -> dict | None:
    pool = build_pool(session.level, session.role, session.company, analysis)
    asked = {" ".join(q.text.lower().split()) for q in questions}
    remaining = [item for item in pool if " ".join(item["text"].lower().split()) not in asked]
    if not questions:
        return remaining[0] if remaining else None

    last = questions[-1]
    if last_eval is not None and not last.is_followup:
        followups_already = sum(1 for q in questions if q.is_followup and q.topic == last.topic)
        transcript = ""
        if said_dont_know(answer_text):
            followups_already = 99
        if followups_already == 0 and last_eval.score >= 7:
            payload = loads(last.followup_json, None)
            if isinstance(payload, dict) and payload.get("text"):
                text = payload["text"].strip()
                if " ".join(text.lower().split()) not in asked:
                    return {
                        "text": text,
                        "topic": last.topic,
                        "difficulty": payload.get("difficulty") or "hard",
                        "is_followup": True,
                        "concepts": payload.get("concepts") or loads(last.concepts_json, []),
                        "model": payload.get("model") or last.model_answer,
                        "followup": None,
                        "provider": "local",
                    }
        if followups_already == 0 and 4 <= last_eval.score < 7:
            missing = loads(last_eval.missing_json, [])
            if missing:
                concept = missing[0]
                text = f"Let me stay with {last.topic}. How does {concept} fit into the answer you just gave?"
                if " ".join(text.lower().split()) not in asked:
                    return {
                        "text": text,
                        "topic": last.topic,
                        "difficulty": last.difficulty,
                        "is_followup": True,
                        "concepts": [concept, "example"],
                        "model": f"Explain {concept} in the context of the previous answer. Give one example and say why it changes the result.",
                        "followup": None,
                        "provider": "local",
                    }

    asked_topics = {q.topic for q in questions}
    for item in remaining:
        if item["topic"] not in asked_topics:
            return {**item, "is_followup": False, "provider": "local"}
    if remaining:
        return {**remaining[0], "is_followup": False, "provider": "local"}
    return None


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    try:
        import json
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            import json
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
    return None


def _chat_json(system: str, user: str) -> dict | None:
    provider = settings.ai_provider()
    if provider == "local":
        return None
    try:
        if provider == "openai":
            from openai import OpenAI

            client = OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model=settings.openai_model,
                temperature=0.4,
                response_format={"type": "json_object"},
                messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            )
            content = response.choices[0].message.content or ""
            return _extract_json(content)
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 1400,
                "temperature": 0.4,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
            timeout=50,
        )
        response.raise_for_status()
        body = response.json()
        text = "".join(part.get("text", "") for part in body.get("content", []) if part.get("type") == "text")
        return _extract_json(text)
    except Exception:
        return None


def _history_lines(questions, answers_by_qid) -> str:
    lines = []
    for question in questions:
        answer = answers_by_qid.get(question.id)
        lines.append(f"Q: {question.text}")
        lines.append(f"A: {answer.transcript if answer else '(unanswered)'}")
    return "\n".join(lines) if lines else "(no questions yet)"


def _valid_model_question(obj: dict | None, previous_texts: list[str]) -> dict | None:
    if not isinstance(obj, dict):
        return None
    text = str(obj.get("question") or obj.get("text") or "").strip()
    if len(text) < 12 or text.count("?") > 2:
        return None
    if any(_similar(text, prev) > 0.82 for prev in previous_texts):
        return None
    difficulty = obj.get("difficulty")
    if difficulty not in {"easy", "medium", "hard"}:
        difficulty = "medium"
    concepts = [str(item).strip() for item in obj.get("concepts") or [] if str(item).strip()][:8]
    model = str(obj.get("model_answer") or obj.get("model") or "").strip()
    return {
        "text": text,
        "topic": str(obj.get("topic") or "interview")[:80],
        "difficulty": difficulty,
        "is_followup": bool(obj.get("is_followup")),
        "concepts": concepts,
        "model": model,
        "followup": None,
        "provider": settings.ai_provider(),
    }


def plan_question(session, questions, answers_by_qid, last_eval, analysis: dict | None, answer_text: str = "") -> dict | None:
    local = _local_choice(session, questions, last_eval, analysis, answer_text)
    if settings.ai_provider() == "local":
        return local

    resume_note = "No resume was uploaded."
    if analysis:
        resume_note = (
            "Use only these resume facts. Do not invent employers, projects, or skills. "
            f"Skills: {analysis.get('skills')}. Projects: {analysis.get('projects')}. "
            f"Education: {analysis.get('education')}. Internships: {analysis.get('internships')}."
        )
    system = (
        "You are Asha, a professional interview coach running one live practice interview. "
        "Return JSON only. Ask exactly one main question. Do not include an ideal answer in the question text. "
        "Do not claim the question is a leaked or confidential company interview question. "
        "Adapt to the last answer: go deeper after a strong answer, clarify after a partial answer, "
        "and move to a new relevant topic after an incorrect answer or an explicit 'I do not know'. "
        "Never repeat a previous question."
    )
    user = f"""
Role: {session.role}
Level: {session.level}
Company style: {session.company}. Emphasize the public interview style only.
Duration minutes: {session.duration_minutes}
Questions already asked: {len(questions)} of {session.question_budget}
{resume_note}
History:
{_history_lines(questions, answers_by_qid)}

Return JSON:
{{
  "question": "one question ending with a question mark",
  "topic": "short topic",
  "difficulty": "easy|medium|hard",
  "is_followup": false,
  "concepts": ["terms a strong answer should mention"],
  "model_answer": "private reference answer stored on the server and never spoken"
}}
"""
    parsed = _valid_model_question(_chat_json(system, user), [q.text for q in questions])
    if parsed is None:
        return local
    if len(parsed["model"]) < 40 and local is not None:
        parsed["model"] = local["model"]
    if len(parsed["model"]) < 40:
        parsed["model"] = "A strong answer states the situation, the action, the trade-off, and a result the candidate can explain."
    return parsed


def _valid_eval(obj: dict | None, fallback_ideal: str) -> dict | None:
    if not isinstance(obj, dict):
        return None
    try:
        dims = {}
        for name in WEIGHTS:
            value = float(obj[name])
            if not 0 <= value <= 10:
                return None
            dims[name] = round(value, 1)
    except (KeyError, TypeError, ValueError):
        return None
    score = round(sum((dims[name] / 10) * weight for name, weight in WEIGHTS.items()) * 10, 1)
    ideal = str(obj.get("ideal_answer") or "").strip() or fallback_ideal
    if len(ideal) < 40:
        return None

    def as_list(key):
        value = obj.get(key) or []
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()][:6]

    return {
        **dims,
        "score": score,
        "strengths": as_list("strengths") or ["The answer addresses the question."],
        "weaknesses": as_list("weaknesses") or ["The answer can be more specific."],
        "missing": as_list("missing_concepts"),
        "incorrect": as_list("incorrect_statements"),
        "suggestion": str(obj.get("suggestion") or "Add a concrete example and the result.").strip(),
        "ideal_answer": ideal,
        "provider": settings.ai_provider(),
    }


def evaluate_answer(question, transcript: str) -> dict:
    concepts = loads(question.concepts_json, [])
    local = evaluate_locally(question.text, concepts, question.model_answer, transcript)
    if settings.ai_provider() == "local":
        return local
    system = (
        "You score one interview answer. Return JSON only. "
        "Do not give a high score because the answer is long. "
        "Score each dimension from 0 to 10 using this rubric: "
        "technical correctness, relevance, conceptual understanding, completeness, clarity, communication, problem-solving. "
        "List incorrect statements only when the answer states something false. Use an empty list when you are unsure. "
        "Do not invent projects or employers that are not in the answer."
    )
    user = f"""
Question: {question.text}
Private concepts: {concepts}
Candidate answer: {transcript}

Return JSON with keys:
technical, relevance, conceptual, completeness, clarity, communication, problem_solving,
strengths, weaknesses, missing_concepts, incorrect_statements, suggestion, ideal_answer.
Each score is a number from 0 to 10. Lists are arrays of short strings. ideal_answer is at least two sentences.
"""
    hosted = _valid_eval(_chat_json(system, user), local["ideal_answer"])
    return hosted or local
