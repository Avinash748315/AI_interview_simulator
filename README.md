# Clarivo — AI Interview Simulator

Clarivo is a full-stack, enterprise-grade AI mock interview simulator designed for engineering students, fresh graduates, and experienced software professionals preparing for technical, HR, and behavioral rounds.

The system features real-time speech recognition, natural text-to-speech AI interviewer audio, adaptive follow-up questions, resume parsing (PDF/DOCX), 7-dimension rubric answer evaluations, downloadable PDF performance reports, and an interactive study guide.

---

## 🌟 Key Features

1. **User Authentication & Profiles**
   - Secure registration, login, and JWT-authenticated sessions with token-version logout invalidation.
   - Candidate career profile tracking: target role, experience level, graduation year, and college.

2. **Resume Upload & AI Parsing (PDF & DOCX)**
   - Upload any standard PDF or Word DOCX resume.
   - Automatic extraction of skills, programming languages, libraries, tools, projects, and education.
   - AI personalizes interview questions directly using the candidate's actual projects and tech stack.

3. **Interview Configuration Matrix**
   - **37+ Target Roles:** Full Stack, Frontend, Backend, DevOps, Data Analyst, Cloud Architect, AI/ML, SRE, Mobile, Product Manager, HR, and more.
   - **3 Experience Tiers:** Internship (coursework & fundamentals), Fresher (algorithms & practical reasoning), Experienced (architecture, trade-offs & scale).
   - **Company Interview Styles:** Modeled after Google, Amazon, Flipkart, Razorpay, Swiggy, TCS, Infosys, Zepto, and General.
   - **Session Durations:** 5 minutes (3 questions), 10 minutes (5 questions), 15 minutes (7 questions), 20 minutes (10 questions).
   - **Modes:** Voice Mode (Microphone speech-to-text & audio responses) and Text Mode (keyboard entry).

4. **Live Adaptive AI Interviewer ("Asha")**
   - Asks one question at a time and maintains complete conversation memory.
   - Prevents AI from speaking while the candidate records to eliminate audio feedback loops.
   - **Adaptive Follow-Up Logic:** Dives deep into architectural trade-offs after strong answers, and tests core fundamentals when concepts are missed.
   - Real-time speech-to-text transcript streaming with live candidate manual editing fallback.
   - Countdown session timer and question progress tracking.

5. **7-Dimension Rubric Evaluation**
   Every answer is scored across 7 rubric dimensions:
   - Technical Correctness
   - Relevance
   - Conceptual Understanding
   - Completeness
   - Clarity
   - Communication
   - Problem Solving

6. **Comprehensive Performance Reports & PDF Download**
   - Overall composite score (0 to 100 points).
   - Category breakdown charts and rubric dimension bars.
   - Question-by-question breakdown: candidate answer, strengths, weaknesses, missing concepts, personalized improvement tip, and senior engineer model reference answer.
   - Instant downloadable official PDF report.

7. **Interactive Study Guide & Flashcards**
   - Carousel flashcard interface for targeted revision before real company interviews.
   - Side-by-side comparison between the candidate's transcript and the ideal reference answer.

8. **Interview Packs & Test Payment Simulation**
   - Built-in credit management with 2 free credits upon registration.
   - Credit packs: Spark (1 credit), Hustle (3 credits), Grind (5 credits), Beast Mode (10 credits).
   - Test mode simulation for instant credit top-up during college demonstrations.
   - Razorpay API integration ready for production.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.0 ORM, Pydantic v2, PyJWT, Bcrypt, FPDF2, PyPDF, Python-docx.
- **Database:** SQLite with foreign key enforcement (`clarivo.db`) & cascade relationships (PostgreSQL-ready).
- **AI Engine:** Dual-mode architecture:
  - **Local Adaptive Engine:** Built-in rules and rubric scoring that runs 100% offline with zero external API dependencies.
  - **Cloud LLM Support:** Optional OpenAI (`gpt-4o-mini`) and Anthropic (`claude-3-5-haiku`) integrations via environment variables.
- **Voice & Speech:** Web Speech API (`SpeechRecognition` & `speechSynthesis`) with optional ElevenLabs TTS and OpenAI Whisper STT backends.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ (Node.js 20 or 24 recommended)
- npm 10+

---

### 2. Backend Setup & Startup

Open a terminal and navigate to the project directory:

```powershell
cd C:\Users\Avinash\OneDrive\Desktop\AI_interview_simulator\backend

# Activate the virtual environment
.\.venv\Scripts\Activate.ps1

# (Optional: install dependencies if setting up on a new machine)
# pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend will start at: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup & Startup

Open a second terminal:

```powershell
cd C:\Users\Avinash\OneDrive\Desktop\AI_interview_simulator\frontend

# Run development server
npm run dev
```

The frontend will start at: `http://localhost:3000`

---

### 4. Running Backend Automated Tests

To run the complete automated pytest suite:

```powershell
cd C:\Users\Avinash\OneDrive\Desktop\AI_interview_simulator\backend
$env:PYTHONPATH="."
.\.venv\Scripts\python.exe -m pytest tests -v
```

All tests will run and assert:
- API health and root configuration
- Registration, login, and JWT authorization
- Candidate profile updates
- Complete interview lifecycle (creation, start, answers, adaptive questions, skipping, completion, report generation, and PDF export)
- Credit management and payment simulation

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=sqlite:///./clarivo.db
JWT_SECRET=clarivo-jwt-secret-key-session-auth-token-salt-2026
FRONTEND_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
UPLOAD_DIR=./uploads
AI_MODE=auto

# Optional Cloud Providers (Leave blank to use the built-in Local Adaptive Engine)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-haiku-20241022
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PAYMENT_TEST_SECRET=clarivo_local_test_secret
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📋 Available Roles in Catalog
- **Software Engineering:** Full Stack Developer, Frontend Developer, Backend Developer, .NET Developer, Mobile App Developer, AR/VR Developer, Blockchain Developer.
- **Data & AI:** AI/ML Engineer, Data Analyst, Data Engineer, Big Data Engineer.
- **Infrastructure & Security:** DevOps Engineer, Cloud Architect, Systems Architect, Site Reliability Engineer, Cybersecurity Analyst, Network Security Engineer.
- **Quality Assurance:** Automation Test Engineer, Manual Tester.
- **Product & Management:** Product Manager, Business Analyst, IT Project Manager, Operations Manager, Product Support Specialist.
- **Design:** UX/UI Designer, Graphic Designer.
- **Business & HR:** HR Manager, Recruiter, Marketing Manager, Digital Marketer, Brand Manager, Sales Executive, Account Manager, Finance Analyst, Accountant, Content Writer, Customer Success Manager.
