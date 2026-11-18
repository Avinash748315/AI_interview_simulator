ROLES = [
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Product Manager",
    "Data Analyst",
    "DevOps Engineer",
    "Cloud Architect",
    "Data Engineer",
    "Business Analyst",
    "Systems Architect",
    "UX/UI Designer",
    "Mobile App Developer",
    "AI/ML Engineer",
    "Cybersecurity Analyst",
    "Site Reliability Engineer",
    "Network Security Engineer",
    "Big Data Engineer",
    "IT Project Manager",
    "Automation Test Engineer",
    "AR/VR Developer",
    "Blockchain Developer",
    "HR Manager",
    "Marketing Manager",
    "Sales Executive",
    "Content Writer",
    "Digital Marketer",
    "Graphic Designer",
    "Finance Analyst",
    "Operations Manager",
    "Customer Success Manager",
    "Brand Manager",
    "Recruiter",
    "Account Manager",
    "Manual Tester",
    ".NET Developer",
    "Product Support Specialist",
    "Accountant",
]

TECHNICAL_ROLES = {
    "Full Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Data Analyst",
    "DevOps Engineer",
    "Cloud Architect",
    "Data Engineer",
    "Systems Architect",
    "Mobile App Developer",
    "AI/ML Engineer",
    "Cybersecurity Analyst",
    "Site Reliability Engineer",
    "Network Security Engineer",
    "Big Data Engineer",
    "Automation Test Engineer",
    "AR/VR Developer",
    "Blockchain Developer",
    "Manual Tester",
    ".NET Developer",
}

COMPANIES = {
    "Google": "structured problem solving, clarifying requirements, and reasoning about complexity",
    "Amazon": "ownership, customer obsession, and diving deep before deciding",
    "Flipkart": "e-commerce scale, customer experience, and ownership of outcomes",
    "Razorpay": "payment reliability, edge cases, and precise communication",
    "Swiggy": "marketplace operations, consumer impact, and practical trade-offs",
    "TCS": "fundamentals, client communication, and delivery discipline",
    "Infosys": "fundamentals, teamwork, and service-delivery judgment",
    "Zepto": "speed, quick-commerce operations, and pragmatic execution",
    "General": "a balanced mix of role knowledge and professional judgment",
}

ROLE_SKILLS = {
    "Full Stack Developer": ["JavaScript", "React", "Node.js", "REST APIs", "databases"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "accessibility", "responsive design"],
    "Backend Developer": ["APIs", "databases", "authentication", "caching", "transactions"],
    "Product Manager": ["user problems", "prioritization", "metrics", "stakeholders", "roadmaps"],
    "Data Analyst": ["SQL", "Excel", "dashboards", "data cleaning", "insights"],
    "DevOps Engineer": ["CI/CD", "Linux", "containers", "monitoring", "infrastructure as code"],
    "Cloud Architect": ["cloud architecture", "availability", "cost", "security", "networking"],
    "Data Engineer": ["pipelines", "SQL", "data modeling", "data quality", "batch processing"],
    "Business Analyst": ["requirements", "stakeholders", "process mapping", "user stories", "acceptance criteria"],
    "Systems Architect": ["architecture", "scalability", "integration", "trade-offs", "reliability"],
    "UX/UI Designer": ["user research", "wireframes", "usability", "visual hierarchy", "design systems"],
    "Mobile App Developer": ["mobile UI", "app lifecycle", "offline behavior", "performance", "releases"],
    "AI/ML Engineer": ["machine learning", "training data", "evaluation metrics", "feature engineering", "model drift"],
    "Cybersecurity Analyst": ["threats", "vulnerabilities", "access control", "incident response", "logging"],
    "Site Reliability Engineer": ["SLIs", "SLOs", "incidents", "monitoring", "toil"],
    "Network Security Engineer": ["firewalls", "segmentation", "TLS", "intrusion detection", "least privilege"],
    "Big Data Engineer": ["distributed processing", "partitioning", "data lakes", "schema evolution", "data quality"],
    "IT Project Manager": ["scope", "timeline", "risks", "stakeholders", "delivery"],
    "Automation Test Engineer": ["test automation", "selectors", "CI", "flaky tests", "coverage"],
    "AR/VR Developer": ["spatial interaction", "frame rate", "3D scenes", "comfort", "input devices"],
    "Blockchain Developer": ["transactions", "smart contracts", "consensus", "wallets", "security reviews"],
    "HR Manager": ["hiring", "employee relations", "policies", "confidentiality", "feedback"],
    "Marketing Manager": ["audience", "positioning", "campaigns", "channels", "measurement"],
    "Sales Executive": ["discovery", "qualification", "objections", "pipeline", "closing"],
    "Content Writer": ["audience", "structure", "clarity", "editing", "research"],
    "Digital Marketer": ["channels", "campaigns", "analytics", "conversion", "content"],
    "Graphic Designer": ["composition", "typography", "brand consistency", "critique", "tools"],
    "Finance Analyst": ["financial statements", "variance", "forecasting", "assumptions", "Excel"],
    "Operations Manager": ["process", "bottlenecks", "stakeholders", "metrics", "improvement"],
    "Customer Success Manager": ["onboarding", "retention", "health scores", "escalations", "value"],
    "Brand Manager": ["brand positioning", "consistency", "audience", "campaigns", "brand equity"],
    "Recruiter": ["sourcing", "screening", "candidate experience", "bias", "coordination"],
    "Account Manager": ["accounts", "renewals", "stakeholders", "expectations", "growth"],
    "Manual Tester": ["test cases", "bug reports", "regression", "severity", "exploratory testing"],
    ".NET Developer": ["C#", ".NET", "APIs", "dependency injection", "Entity Framework"],
    "Product Support Specialist": ["troubleshooting", "customers", "tickets", "reproduction steps", "escalation"],
    "Accountant": ["journal entries", "reconciliation", "compliance", "accuracy", "close process"],
}

BUDGET = {5: 3, 10: 5, 15: 7, 20: 9}
LEVELS = ("internship", "fresher", "experienced")


def _q(topic, difficulty, text, concepts, model, followup_text=None, followup_concepts=None):
    followup = None
    if followup_text:
        followup = {
            "text": followup_text,
            "concepts": followup_concepts or concepts,
            "model": f"Answer the follow-up directly. Cover: {', '.join(followup_concepts or concepts)}. Use one concrete example and name the trade-off.",
            "difficulty": "hard" if difficulty == "medium" else "medium",
        }
    return {
        "topic": topic,
        "difficulty": difficulty,
        "text": text,
        "concepts": concepts,
        "model": model,
        "followup": followup,
    }


def skill_questions(role: str, level: str) -> list[dict]:
    skills = ROLE_SKILLS.get(role, ["communication", "ownership", "stakeholders", "priorities", "results"])
    difficulty = {"internship": "easy", "fresher": "medium", "experienced": "hard"}[level]
    built = []
    for skill in skills[:4]:
        if level == "internship":
            text = f"What does {skill} mean in the daily work of a {role}, and where have you practiced it?"
            model = f"Define {skill} in plain language, name one real practice or project moment, and state what you learned."
        elif level == "fresher":
            text = f"How would you use {skill} as a {role}? Walk through a specific example and the trade-off you would watch."
            model = f"Explain {skill}, give a worked example, name the trade-off, and say how you would judge that the work succeeded."
        else:
            text = f"Describe a situation where {skill} changed a decision you owned as a {role}. What was the trade-off and the outcome?"
            model = f"Use a real situation. State the context, the decision, why {skill} mattered, the trade-off, and the outcome you can actually explain."
        built.append(
            _q(
                skill,
                difficulty,
                text,
                [skill.lower(), "example", "trade-off"],
                model,
                f"What is the first mistake a teammate makes with {skill}, and how would you catch it early?",
                [skill.lower(), "mistake", "example"],
            )
        )
    return built


def level_questions(level: str, role: str, technical: bool, has_project: bool) -> list[dict]:
    items = []
    if level == "internship":
        if technical:
            items.append(
                _q(
                    "complexity",
                    "easy",
                    "A function compares every item with every other item using two nested loops. What is the time complexity, and why does that matter for larger input?",
                    ["o(n^2)", "nested", "quadratic"],
                    "The nested loops do work proportional to n times n, so the time complexity is O(n^2), or quadratic. It matters because doubling the input roughly quadruples the work.",
                    "If the input grew from 1,000 rows to 1,000,000 rows, what would you change first?",
                    ["complexity", "scale", "trade-off"],
                )
            )
            items.append(
                _q(
                    "aptitude",
                    "easy",
                    "A campus club has 30 members and every member must be paired with every other member exactly once for a mock interview. How do you reason about the number of pairs?",
                    ["pairs", "combination", "reasoning"],
                    "Each unordered pair is unique, so the count is 30 choose 2, which is 30 times 29 divided by 2. Explain the reasoning rather than only the final number.",
                )
            )
        items.append(
            _q(
                "teamwork",
                "easy",
                "Tell me about a time you worked with someone whose approach differed from yours. What did you do, and what was the result?",
                ["situation", "action", "result"],
                "Describe a specific situation, the action you took to work through the difference, and the result. Keep the story concrete.",
                "What would you do differently if the same disagreement happened again?",
                ["reflection", "action", "result"],
            )
        )
        if not has_project:
            items.append(
                _q(
                    "college project",
                    "easy",
                    f"Walk me through a college project you would discuss for a {role} internship. What did you build, and what was your part of it?",
                    ["project", "role", "challenge"],
                    "Name the project, your individual contribution, one technical or process choice, and one difficulty you actually faced.",
                )
            )
    elif level == "fresher":
        if technical:
            items.extend(
                [
                    _q(
                        "OOP",
                        "medium",
                        "Explain encapsulation and one other OOP idea using an example from code you have written or studied.",
                        ["encapsulation", "abstraction", "example"],
                        "Encapsulation keeps internal state private and exposes a small interface. Pair it with abstraction, inheritance, or polymorphism using a real class or module, and say why the boundary exists.",
                        "How would weak encapsulation show up as a bug later?",
                        ["encapsulation", "bug", "interface"],
                    ),
                    _q(
                        "DBMS",
                        "medium",
                        "Why do we normalize a relational schema? Use a small example and mention the problem it prevents.",
                        ["normalization", "redundancy", "update"],
                        "Normalization reduces repeated data so a fact is stored once. Use a small example and show an update anomaly or inconsistent duplicate that the new structure prevents.",
                    ),
                    _q(
                        "operating systems",
                        "medium",
                        "What is the difference between a process and a thread, and when would you choose more than one thread?",
                        ["process", "thread", "memory"],
                        "A process has its own memory space. Threads inside a process share that memory and are lighter to switch. Use more than one thread when work can proceed concurrently and you can handle shared-state bugs.",
                    ),
                    _q(
                        "computer networks",
                        "medium",
                        "A user says the site is 'not secure' because the address starts with HTTP. What is actually different between HTTP and HTTPS?",
                        ["http", "https", "tls"],
                        "HTTP sends data without transport encryption. HTTPS is HTTP over TLS, which authenticates the server and encrypts the traffic. The page content can still be insecure for other reasons.",
                    ),
                ]
            )
        if not has_project:
            items.append(
                _q(
                    "final-year project",
                    "medium",
                    f"Walk me through a project you would defend in a {role} interview. What was the architecture, your role, and one hard bug or decision?",
                    ["architecture", "role", "decision"],
                    "Describe the main parts of the system, what you personally owned, the decision or bug, and how you judged that the result worked.",
                )
            )
    else:
        items.append(
            _q(
                "scenario",
                "hard",
                f"You join a team as a {role} and discover a commitment that cannot be met with the current approach. How do you handle the next week?",
                ["stakeholders", "trade-off", "plan"],
                "Explain how you confirm the gap, who you tell, which scope or design trade-off you propose, and how you track the revised plan.",
                "What would you escalate, and what would you decide yourself?",
                ["escalation", "ownership", "trade-off"],
            )
        )
        if technical:
            items.append(
                _q(
                    "system design",
                    "hard",
                    f"Design the core of a system a {role} would own for a product used across India. What are the main components, the data that must not be lost, and one bottleneck?",
                    ["components", "data", "bottleneck"],
                    "Name a few components, the data that needs durable storage, how requests flow, one likely bottleneck, and the trade-off you accept. This is a public-style design discussion, not a claim about any company's internal system.",
                    "How would you know the design is failing in production?",
                    ["metrics", "failure", "bottleneck"],
                )
            )
        else:
            items.append(
                _q(
                    "strategy",
                    "hard",
                    f"A {role} is asked to improve a struggling workflow in one quarter. How do you choose what to change first?",
                    ["goal", "metric", "trade-off"],
                    "Define the outcome, pick a metric you can observe, compare options, and explain the trade-off behind the first change.",
                )
            )
        items.append(
            _q(
                "conflict",
                "medium",
                "Tell me about a disagreement with a teammate or stakeholder where both of you had a reasonable point. How did you resolve it?",
                ["conflict", "listening", "resolution"],
                "State both positions fairly, what you changed after listening, the resolution, and what you would repeat.",
            )
        )
    return items


def company_question(company: str, role: str) -> dict:
    style = COMPANIES[company]
    return _q(
        "company style",
        "medium",
        f"This practice round uses a {company} interview style, which emphasizes {style}. Tell me about a time you showed that quality. What was the situation, what did you do, and what changed?",
        ["situation", "action", "result"],
        f"Use one specific story with a situation, your action, and the result. Connect it to {style}. These prompts are original practice questions, not confidential {company} interview questions.",
        "What feedback did you take from that situation?",
        ["feedback", "action", "result"],
    )


def resume_questions(analysis: dict | None) -> list[dict]:
    if not analysis:
        return []
    items = []
    for project in (analysis.get("projects") or [])[:2]:
        name = str(project.get("name") or "").strip()
        if len(name) < 3:
            continue
        token = next((part for part in name.replace("/", " ").split() if len(part) > 3), "project")
        items.append(
            _q(
                "resume project",
                "medium",
                f'Your resume mentions "{name}". What was your role, how was the work structured, and which decision did you own?',
                ["role", "structure", token.lower()],
                f'Discuss only "{name}" as it appears on the resume. Explain your role, the structure of the work, and one decision you owned. Do not add experience that is not on the resume.',
                f'What was difficult about "{name}", and how did you deal with it?',
                ["challenge", "decision", token.lower()],
            )
        )
    for skill in (analysis.get("skills") or [])[:3]:
        items.append(
            _q(
                "resume skill",
                "medium",
                f"Your resume lists {skill}. Explain your experience with {skill} using work that is actually on the resume.",
                [str(skill).lower(), "experience", "example"],
                f"Explain {skill} only through experience supported by the resume. Name the work, what you did, and what you learned.",
                f"Where would {skill} be the wrong tool, based on the work you have described?",
                [str(skill).lower(), "trade-off", "example"],
            )
        )
    return items


def build_pool(level: str, role: str, company: str, analysis: dict | None) -> list[dict]:
    technical = role in TECHNICAL_ROLES
    from_resume = resume_questions(analysis)
    pool = []
    pool.extend(from_resume)
    pool.extend(skill_questions(role, level))
    pool.extend(level_questions(level, role, technical, bool(analysis and analysis.get("projects"))))
    pool.append(company_question(company, role))
    seen = set()
    unique = []
    for item in pool:
        key = " ".join(item["text"].lower().split())
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return unique
