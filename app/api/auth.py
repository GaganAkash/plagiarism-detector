from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from pydantic import BaseModel
from app.db import get_db
from app.models.user import User
from app.config import settings
from app.api.rate_limit import rate_limit
from app.services import otp as otp_svc
from app.services.email import send_email

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24h


class RegisterRequest(BaseModel):
    email: str
    password: str


class OTPRequest(BaseModel):
    email: str


class OTPVerify(BaseModel):
    email: str
    code: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire}, settings.resolved_secret_key(), algorithm=ALGORITHM
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, settings.resolved_secret_key(), algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=Token)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit(settings.auth_rate_limit_per_minute)),
):
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=req.email,
        hashed_password=bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode(),
    )
    db.add(user)
    await db.commit()
    return Token(access_token=create_token(user.id))


@router.post("/login", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit(settings.auth_rate_limit_per_minute)),
):
    result = await db.execute(select(User).where(User.email == form.username))
    user = result.scalar_one_or_none()
    # OTP-only users have no password -> password login can't succeed for them.
    if (
        not user
        or not user.hashed_password
        or not bcrypt.checkpw(form.password.encode(), user.hashed_password.encode())
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(access_token=create_token(user.id))


@router.post("/request-otp", response_model=dict)
async def request_otp(
    req: OTPRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit(10)),
):
    email = req.email.strip().lower()
    if not settings.email_enabled:
        raise HTTPException(status_code=503, detail="Email sending is not configured")
    code = otp_svc.generate(email)
    try:
        send_email(
            to=email,
            subject="Your verification code",
            text=f"Your Plagiarism & AI Detector verification code is: {code}\n"
            f"It expires in {settings.otp_minutes} minutes.",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to send email: {e}")
    return {"message": f"Code sent to {email}"}


@router.post("/verify-otp", response_model=Token)
async def verify_otp(
    req: OTPVerify,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(rate_limit(settings.auth_rate_limit_per_minute)),
):
    email = req.email.strip().lower()
    if not otp_svc.verify(email, req.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=email)  # OTP-verified account, no password
        db.add(user)
        await db.commit()
    return Token(access_token=create_token(user.id))
