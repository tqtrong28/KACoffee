import hashlib
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.common.enums import ActorType
from app.core.config import get_settings
from app.core.security import create_token, decode_token, get_password_hash, verify_password
from app.modules.admin.models import Employee
from app.modules.auth.models import RefreshToken
from app.modules.auth.schemas import TokenResponse
from app.modules.customer_notifications.service import create_customer_notification
from app.modules.customers.models import Customer
from app.modules.membership.models import MembershipRank


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def register_customer(
    db: Session,
    phone: str,
    password: str,
    full_name: str,
    email: str | None,
) -> Customer:
    existing = db.scalar(select(Customer).where(Customer.phone == phone))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered")

    default_rank = db.scalar(
        select(MembershipRank).where(MembershipRank.code == "new", MembershipRank.is_active.is_(True))
    )
    if not default_rank:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Default rank missing")

    customer = Customer(
        phone=phone,
        password_hash=get_password_hash(password),
        full_name=full_name,
        email=email,
        membership_rank_id=default_rank.id,
        total_points=0,
        is_active=True,
    )
    db.add(customer)
    db.flush()
    create_customer_notification(
        db,
        customer.id,
        "membership_welcome",
        "Chúc mừng bạn đã trở thành thành viên KACoffee",
        "Tài khoản thành viên của bạn đã sẵn sàng. Hãy đặt món và tích điểm để sớm lên hạng mới.",
    )
    db.commit()
    db.refresh(customer)
    return customer


def authenticate_customer(db: Session, phone: str, password: str) -> Customer:
    customer = db.scalar(select(Customer).where(Customer.phone == phone, Customer.is_active.is_(True)))
    if not customer or not verify_password(password, customer.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return customer


def authenticate_employee(db: Session, username: str, password: str) -> Employee:
    employee = db.scalar(select(Employee).where(Employee.username == username, Employee.is_active.is_(True)))
    if not employee or not verify_password(password, employee.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return employee


def issue_tokens(db: Session, actor_type: ActorType, actor_id: int, role: str | None = None) -> TokenResponse:
    settings = get_settings()
    access_token = create_token(str(actor_id), actor_type.value, "access", role=role)
    refresh_expires = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    refresh_token = create_token(
        str(actor_id),
        actor_type.value,
        "refresh",
        role=role,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )
    stored = RefreshToken(
        actor_type=actor_type.value,
        actor_id=actor_id,
        token_hash=_hash_token(refresh_token),
        expires_at=refresh_expires,
    )
    db.add(stored)
    db.commit()
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        actor_type=actor_type,
        role=role,
    )


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("token_type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    token_hash = _hash_token(refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if not stored or stored.revoked_at is not None or stored.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    role = payload.get("role")
    return issue_tokens(
        db=db,
        actor_type=ActorType(payload["actor_type"]),
        actor_id=int(payload["sub"]),
        role=role,
    )


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    token_hash = _hash_token(refresh_token)
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    if stored and stored.revoked_at is None:
        stored.revoked_at = datetime.utcnow()
        db.add(stored)
        db.commit()
