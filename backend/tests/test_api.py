import io
import pytest
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_health_and_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_auth_and_profile():
    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Candidate",
            "email": "candidate@example.com",
            "password": "Password123!",
        },
    )
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Me
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "candidate@example.com"
    assert me_res.json()["credits"] == 2

    # Profile get & update
    prof_get = client.get("/api/profile", headers=headers)
    assert prof_get.status_code == 200

    prof_put = client.put(
        "/api/profile",
        headers=headers,
        json={
            "college": "IIT Delhi",
            "graduation_year": "2025",
            "target_role": "Full Stack Developer",
            "experience_level": "fresher",
            "phone": "+91 9876543210",
            "city": "Bengaluru",
            "onboarding_complete": True,
        },
    )
    assert prof_put.status_code == 200
    assert prof_put.json()["target_role"] == "Full Stack Developer"
    assert prof_put.json()["onboarding_complete"] is True


def test_interview_lifecycle():
    # 1. Register candidate
    reg_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Interviewee",
            "email": "interviewee@example.com",
            "password": "Password123!",
        },
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get catalog
    cat_res = client.get("/api/interviews/catalog")
    assert cat_res.status_code == 200
    catalog = cat_res.json()
    assert "Full Stack Developer" in catalog["roles"]
    assert len(catalog["companies"]) > 0

    # 3. Create interview
    create_res = client.post(
        "/api/interviews",
        headers=headers,
        json={
            "level": "fresher",
            "role": "Full Stack Developer",
            "company": "Google",
            "duration_minutes": 5,
            "resume_id": None,
        },
    )
    assert create_res.status_code == 200
    session_data = create_res.json()
    session_id = session_data["session_id"]
    assert session_data["status"] == "configured"

    # 4. Start interview
    start_res = client.post(f"/api/interviews/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["status"] == "active"
    assert start_data["question"] is not None
    q1 = start_data["question"]
    assert "text" in q1
    assert q1["id"] > 0

    # 5. Submit answer to question 1
    ans_res = client.post(
        f"/api/interviews/{session_id}/answer",
        headers=headers,
        json={
            "session_id": session_id,
            "question_id": q1["id"],
            "transcript": "A REST API uses HTTP methods like GET, POST, PUT, DELETE to communicate state representations. It is stateless and uses standard status codes.",
            "edited": False,
        },
    )
    assert ans_res.status_code == 200
    ans_data = ans_res.json()
    assert ans_data["done"] is False
    assert ans_data["question"] is not None
    q2 = ans_data["question"]

    # 6. Skip question 2
    skip_res = client.post(
        f"/api/interviews/{session_id}/skip",
        headers=headers,
        json={
            "session_id": session_id,
            "question_id": q2["id"],
        },
    )
    assert skip_res.status_code == 200

    # 7. End interview
    end_res = client.post(f"/api/interviews/{session_id}/end", headers=headers)
    assert end_res.status_code == 200
    end_data = end_res.json()
    assert end_data["status"] == "completed"
    report_id = end_data["report_id"]
    assert report_id is not None

    # 8. Get report
    rep_res = client.get(f"/api/reports/{report_id}", headers=headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["overall_score"] is not None
    assert "technical" in rep_data["categories"]
    assert len(rep_data["questions"]) >= 2

    # 9. Download PDF
    pdf_res = client.get(f"/api/reports/{report_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500

    # 10. Study guide
    guide_res = client.get(f"/api/reports/{report_id}/study-guide", headers=headers)
    assert guide_res.status_code == 200
    assert len(guide_res.json()["items"]) >= 2

    # 11. Dashboard check
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["stats"]["total_interviews"] == 1
    assert dash_data["stats"]["average_score"] == rep_data["overall_score"]
    assert len(dash_data["recent_sessions"]) == 1


def test_payments_flow():
    # Register candidate
    reg_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Buyer Candidate",
            "email": "buyer@example.com",
            "password": "Password123!",
        },
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get plans
    plans_res = client.get("/api/payments/plans")
    assert plans_res.status_code == 200
    plans = plans_res.json()
    assert len(plans) == 4

    # Create order
    order_res = client.post(
        "/api/payments/order",
        headers=headers,
        json={"plan": "spark"},
    )
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["credits"] == 1
    order_id = order_data["order_id"]

    # Simulate payment in test mode
    sim_res = client.post(
        "/api/payments/simulate",
        headers=headers,
        json={"order_id": order_id},
    )
    assert sim_res.status_code == 200
    assert sim_res.json()["ok"] is True
    assert sim_res.json()["credits"] == 3  # Started with 2 + 1 = 3
