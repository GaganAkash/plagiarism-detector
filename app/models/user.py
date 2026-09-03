from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # nullable: OTP-registered users have no password (only email-verified accounts)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
