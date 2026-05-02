import re

from pydantic import BaseModel, EmailStr, field_validator


_PASSWORD_RE = re.compile(
    r"^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]).{8,}$"
)


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Name must be between 2 and 100 characters")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must contain at least one uppercase letter, "
                "one digit, and one special character"
            )
        return v


class RegisterResponse(BaseModel):
    id: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not _PASSWORD_RE.match(v):
            raise ValueError(
                "Password must contain at least one uppercase letter, "
                "one digit, and one special character"
            )
        return v


class MeResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    latitude: float | None = None
    longitude: float | None = None
    radius_preference: int
    subscription_type: str | None = None
    stripe_customer_id: str | None = None
