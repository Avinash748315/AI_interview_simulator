from fpdf import FPDF


def _clean(value) -> str:
    text = "" if value is None else str(value)
    return text.encode("latin-1", "replace").decode("latin-1")


def build_report_pdf(report: dict) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    epw = pdf.epw

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(epw, 10, "Clarivo interview report", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        epw,
        6,
        _clean(
            f"{report['role']} · {report['level']} · {report['company']} style · {report['duration_minutes']} minutes"
        ),
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 12)
    score = "n/a" if report["overall_score"] is None else str(report["overall_score"])
    pdf.cell(epw, 8, _clean(f"Overall score: {score} / 100"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        epw,
        6,
        _clean(
            f"Status: {report['completion_status']}. Questions: {report['total_questions']}. "
            f"Answers scoring 7 or above: {report['correct_count']}. "
            f"Answers needing improvement: {report['needs_improvement']}."
        ),
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(epw, 8, "Category scores", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    for name, value in (report.get("categories") or {}).items():
        pdf.cell(epw, 6, _clean(f"{name.replace('_', ' ').title()}: {value} / 100"), new_x="LMARGIN", new_y="NEXT")

    recommendations = report.get("recommendations") or {}
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 13)
    pdf.cell(epw, 8, "What to practice next", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    weak = ", ".join(recommendations.get("weak_topics") or []) or "No topic was consistently below the rubric line."
    pdf.multi_cell(epw, 6, _clean(f"Weak topics: {weak}"), new_x="LMARGIN", new_y="NEXT")
    pdf.multi_cell(epw, 6, _clean(recommendations.get("next_difficulty") or ""), new_x="LMARGIN", new_y="NEXT")
    for prompt in recommendations.get("practice_questions") or []:
        pdf.multi_cell(epw, 6, _clean(f"- {prompt}"), new_x="LMARGIN", new_y="NEXT")

    for index, item in enumerate(report.get("questions") or [], start=1):
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 12)
        pdf.multi_cell(epw, 7, _clean(f"{index}. {item['question']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(epw, 6, _clean(f"Score: {item['score']} / 10"), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean(f"Your answer: {item['answer']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean("Strengths: " + "; ".join(item.get("strengths") or [])), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean("Weaknesses: " + "; ".join(item.get("weaknesses") or [])), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean("Mistakes: " + "; ".join(item.get("mistakes") or ["None flagged."])), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean("Missing: " + ", ".join(item.get("missing_concepts") or ["None."])), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean(f"Ideal answer: {item['ideal_answer']}"), new_x="LMARGIN", new_y="NEXT")
        pdf.multi_cell(epw, 6, _clean(f"Suggestion: {item['suggestion']}"), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 9)
    pdf.multi_cell(
        epw,
        5,
        "Clarivo practice questions are original. Company names describe a public interview style, not confidential question banks. "
        "Scores come from the rubric recorded for this session.",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    output = pdf.output()
    return bytes(output)
