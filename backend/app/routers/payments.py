import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_user
from ..models import Payment, User
from ..schemas import OrderIn, SimulateIn, VerifyIn
from ..services.payments import PLANS, create_order, signature_for, verify_payment

router = APIRouter(prefix="/api/payments", tags=["payments"])


def _payment_dict(payment: Payment) -> dict:
    return {
        "id": payment.id,
        "plan": payment.plan,
        "amount_paise": payment.amount_paise,
        "credits": payment.credits,
        "order_id": payment.order_id,
        "payment_id": payment.payment_id,
        "status": payment.status,
        "test_mode": payment.test_mode,
        "created_at": payment.created_at,
    }


@router.get("/plans")
def list_plans():
    return [
        {
            "id": key,
            "name": val["name"],
            "amount_paise": val["amount"],
            "price_inr": val["amount"] // 100,
            "credits": val["credits"],
            "label": val["label"],
            "popular": key == "hustle",
        }
        for key, val in PLANS.items()
    ]


@router.post("/order")
def create_payment_order(
    body: OrderIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = create_order(db, user, body.plan)
    return {
        **_payment_dict(payment),
        "key_id": settings.razorpay_key_id if not payment.test_mode else "test",
    }


@router.post("/verify")
def verify_payment_order(
    body: VerifyIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = verify_payment(db, user, body.order_id, body.payment_id, body.signature)
    return {
        "ok": True,
        "credits": user.credits,
        "payment": _payment_dict(payment),
    }


@router.post("/simulate")
def simulate_payment(
    body: SimulateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.scalar(select(Payment).where(Payment.order_id == body.order_id))
    if payment is None or payment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found.")
    if not payment.test_mode:
        raise HTTPException(status_code=400, detail="Cannot simulate production payments.")
    fake_payment_id = f"pay_test_{uuid.uuid4().hex[:14]}"
    sig = signature_for(payment.order_id, fake_payment_id, settings.payment_test_secret)
    verified = verify_payment(db, user, payment.order_id, fake_payment_id, sig)
    return {
        "ok": True,
        "credits": user.credits,
        "payment": _payment_dict(verified),
    }


@router.get("/history")
def payment_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = list(
        db.scalars(
            select(Payment).where(Payment.user_id == user.id).order_by(Payment.id.desc())
        ).all()
    )
    return [_payment_dict(p) for p in payments]
