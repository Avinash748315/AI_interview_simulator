import hashlib
import hmac
import uuid

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Payment, User

PLANS = {
    "spark": {"name": "Spark", "amount": 3900, "credits": 1, "label": "Rs 39"},
    "hustle": {"name": "Hustle", "amount": 9900, "credits": 3, "label": "Rs 99"},
    "grind": {"name": "Grind", "amount": 17900, "credits": 5, "label": "Rs 179"},
    "beast": {"name": "Beast Mode", "amount": 29900, "credits": 10, "label": "Rs 299"},
}


def signature_for(order_id: str, payment_id: str, secret: str) -> str:
    message = f"{order_id}|{payment_id}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def create_order(db: Session, user: User, plan_code: str) -> Payment:
    plan = PLANS.get(plan_code)
    if plan is None:
        raise HTTPException(status_code=422, detail="Choose Spark, Hustle, Grind, or Beast Mode.")
    test_mode = settings.payment_mode() == "test"
    if test_mode:
        order_id = f"order_test_{uuid.uuid4().hex[:16]}"
    else:
        response = httpx.post(
            "https://api.razorpay.com/v1/orders",
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret),
            json={"amount": plan["amount"], "currency": "INR", "receipt": f"clarivo_{user.id}_{uuid.uuid4().hex[:8]}"},
            timeout=30,
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=502, detail="Razorpay could not create the order.")
        order_id = response.json().get("id")
        if not order_id:
            raise HTTPException(status_code=502, detail="Razorpay returned an incomplete order.")
    payment = Payment(
        user_id=user.id,
        plan=plan_code,
        amount_paise=plan["amount"],
        credits=plan["credits"],
        order_id=order_id,
        status="created",
        test_mode=test_mode,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def verify_payment(db: Session, user: User, order_id: str, payment_id: str, signature: str) -> Payment:
    payment = db.scalar(select(Payment).where(Payment.order_id == order_id))
    if payment is None or payment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found.")
    if payment.status == "paid":
        return payment
    if not payment_id or not signature:
        raise HTTPException(status_code=400, detail="Payment verification failed.")
    secret = settings.payment_test_secret if payment.test_mode else settings.razorpay_key_secret
    expected = signature_for(order_id, payment_id, secret)
    if not hmac.compare_digest(expected, signature):
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed.")
    payment.payment_id = payment_id
    payment.status = "paid"
    user.credits += payment.credits
    db.commit()
    db.refresh(payment)
    return payment
