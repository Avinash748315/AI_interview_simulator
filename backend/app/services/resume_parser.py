import io
import re

from docx import Document
from pypdf import PdfReader

from ..config import settings
from .engine import _chat_json

LANGUAGES = {
    "Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Golang", "Rust",
    "Ruby", "PHP", "Kotlin", "Swift", "SQL", "R", "Scala", "Dart", "MATLAB",
}
TOOLS = {
    "React", "Node.js", "Flask", "Django", "FastAPI", "Spring", "Express", "Next.js", "Angular",
    "Vue", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "PostgreSQL", "MySQL", "MongoDB",
    "Redis", "TensorFlow", "PyTorch", "Pandas", "Excel", "Tableau", "Power BI", "Figma", "Linux",
    "Jenkins", "GitHub Actions", "Terraform", "Selenium", "Jira", "Salesforce", "HTML", "CSS",
}
SKILLS = LANGUAGES | TOOLS | {
    "Machine Learning", "Deep Learning", "Data Structures", "Algorithms", "DBMS", "Operating Systems",
    "Computer Networks", "REST", "System Design", "OOP", "Object Oriented Programming", "Communication",
    "Leadership", "Project Management", "Digital Marketing", "SEO", "Accounting", "Financial Modeling",
    "User Research", "UI Design", "UX Design", "Cybersecurity", "Testing", "Manual Testing",
    "Automation Testing", "Blockchain", "Smart Contracts",
}

HEADINGS = {
    "education": re.compile(r"^(education|academics?|academic background)\b", re.I),
    "projects": re.compile(r"^(projects?|academic projects?|personal projects?)\b", re.I),
    "experience": re.compile(r"^(experience|work experience|professional experience)\b", re.I),
    "internships": re.compile(r"^(internships?|internship experience)\b", re.I),
    "skills": re.compile(r"^(skills?|technical skills?|core skills?)\b", re.I),
    "achievements": re.compile(r"^(achievements?|awards?|accomplishments?|honou?rs)\b", re.I),
}


def extract_text(kind: str, content: bytes) -> str:
    if kind == "pdf":
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages[:20]:
            pages.append(page.extract_text() or "")
        return "\n".join(pages)
    document = Document(io.BytesIO(content))
    parts = [p.text for p in document.paragraphs]
    for table in document.tables:
        for row in table.rows:
            parts.append(" | ".join(cell.text.strip() for cell in row.cells if cell.text.strip()))
    return "\n".join(parts)


def _contains(text: str, term: str) -> bool:
    if term in {"C++", "C#", ".NET"}:
        return term.lower() in text.lower()
    pattern = r"(?<![A-Za-z0-9])" + re.escape(term) + r"(?![A-Za-z0-9])"
    return re.search(pattern, text, flags=re.I) is not None


def _sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {key: [] for key in HEADINGS}
    current = ""
    for raw_line in text.splitlines():
        line = raw_line.strip(" \t•-–—*")
        if not line:
            continue
        heading = ""
        if len(line) < 60:
            for name, pattern in HEADINGS.items():
                if pattern.search(line) and len(line.split()) <= 6:
                    heading = name
                    break
        if heading:
            current = heading
            continue
        if current:
            sections[current].append(line)
    return sections


def _clean_items(lines: list[str], limit: int = 8) -> list[str]:
    items = []
    seen = set()
    for line in lines:
        chunk = re.split(r"[|•]", line)[0].strip()
        chunk = chunk[:140].strip(" -")
        key = chunk.lower()
        if len(chunk) < 3 or key in seen:
            continue
        seen.add(key)
        items.append(chunk)
        if len(items) >= limit:
            break
    return items


def parse_resume_locally(text: str) -> dict:
    found_skills = [term for term in sorted(SKILLS, key=len, reverse=True) if _contains(text, term)]
    # Drop broader duplicates when a longer term already matched, keeping a stable list.
    skills = []
    for term in found_skills:
        if any(term != other and term.lower() in other.lower() and other in skills for other in found_skills):
            continue
        skills.append(term)
    sections = _sections(text)
    education = []
    for line in sections["education"] or text.splitlines():
        if re.search(r"\b(b\.?\s?tech|b\.?\s?e|bachelor|master|m\.?\s?tech|bca|mca|b\.?\s?sc|m\.?\s?sc|university|college|degree|xii|xiith|hsc|ssc)\b", line, re.I):
            education.append(line.strip()[:160])
        if len(education) >= 6:
            break
    projects = [{"name": item} for item in _clean_items(sections["projects"])]
    internships = _clean_items(sections["internships"] + sections["experience"])
    achievements = _clean_items(sections["achievements"])
    languages = [item for item in skills if item in LANGUAGES or item in {"C++", "C#"}]
    tools = [item for item in skills if item in TOOLS]
    summary_bits = []
    if skills:
        summary_bits.append("Skills found in the resume: " + ", ".join(skills[:12]) + ".")
    if projects:
        summary_bits.append("Projects found: " + ", ".join(item["name"] for item in projects[:4]) + ".")
    if not summary_bits:
        summary_bits.append("The file was read, but labeled skills and projects were not detected. Interview questions will use the selected role.")
    return {
        "skills": skills[:20],
        "languages": languages[:12],
        "education": education[:6],
        "projects": projects[:8],
        "internships": internships[:8],
        "achievements": achievements[:8],
        "tools": tools[:20],
        "summary": " ".join(summary_bits),
        "provider": "local",
    }


def _supported(items: list, source: str) -> list:
    kept = []
    for item in items:
        if isinstance(item, dict):
            name = str(item.get("name") or "").strip()
            if name and name.lower() in source.lower():
                kept.append({"name": name[:140]})
        else:
            text = str(item).strip()
            if text and text.lower() in source.lower():
                kept.append(text[:160])
    return kept


def analyze_resume(text: str) -> dict:
    local = parse_resume_locally(text)
    if settings.ai_provider() == "local" or not text.strip():
        return local
    system = (
        "Extract resume facts. Return JSON only. Every skill, language, tool, school, project, internship, "
        "and achievement must be copied from the resume text. If something is absent, use an empty list. Do not infer."
    )
    user = f"""
Resume text:
{text[:12000]}

Return JSON with keys skills, languages, education, projects, internships, achievements, tools, summary.
projects is a list of objects with a name field. Other lists are strings. summary is one or two sentences using only the resume.
"""
    parsed = _chat_json(system, user)
    if not isinstance(parsed, dict):
        return local
    source = text
    skills = [item for item in _supported(parsed.get("skills") or [], source) if isinstance(item, str)]
    merged = {
        "skills": skills[:20] or local["skills"],
        "languages": [item for item in _supported(parsed.get("languages") or [], source) if isinstance(item, str)][:12] or local["languages"],
        "education": [item for item in _supported(parsed.get("education") or [], source) if isinstance(item, str)][:6] or local["education"],
        "projects": _supported(parsed.get("projects") or [], source)[:8] or local["projects"],
        "internships": [item for item in _supported(parsed.get("internships") or [], source) if isinstance(item, str)][:8] or local["internships"],
        "achievements": [item for item in _supported(parsed.get("achievements") or [], source) if isinstance(item, str)][:8] or local["achievements"],
        "tools": [item for item in _supported(parsed.get("tools") or [], source) if isinstance(item, str)][:20] or local["tools"],
        "summary": local["summary"],
        "provider": settings.ai_provider(),
    }
    hosted_summary = str(parsed.get("summary") or "").strip()
    if hosted_summary and all(word.lower() in source.lower() for word in re.findall(r"[A-Za-z][A-Za-z0-9+.#-]{3,}", hosted_summary)[:12]):
        merged["summary"] = hosted_summary[:500]
    return merged
