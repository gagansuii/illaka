from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ─── App ────────────────────────────────────────────────────────────────
    APP_NAME: str = "Ilaaka API"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # ─── Database ───────────────────────────────────────────────────────────
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30

    @field_validator("DATABASE_URL")
    @classmethod
    def coerce_postgres_scheme(cls, v: str) -> str:
        """Alembic/asyncpg require postgresql+asyncpg:// scheme."""
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and "+asyncpg" not in v:
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # ─── JWT / Auth ─────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    JWT_SHORT_SESSION_EXPIRE_HOURS: int = 24

    # ─── Redis ──────────────────────────────────────────────────────────────
    REDIS_URL: str | None = None

    # ─── Stripe ─────────────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_PUBLISHABLE_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None

    # Stripe price IDs for recurring products
    STRIPE_SUBSCRIPTION_PRICE_ID: str | None = None

    # ─── Razorpay (legacy / transitional) ───────────────────────────────────
    RAZORPAY_KEY_ID: str | None = None
    RAZORPAY_KEY_SECRET: str | None = None
    RAZORPAY_WEBHOOK_SECRET: str | None = None
    RAZORPAY_UPI_VPA: str | None = None

    # ─── Pricing (paise) ────────────────────────────────────────────────────
    SUBSCRIPTION_PRICE: int = 49900
    HOSTING_FEE_AMOUNT: int = 25000
    PROMOTION_PRICE: int = 15000
    HOSTING_FEE_THRESHOLD: int = 50

    # ─── Cloudinary ─────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None

    # ─── OpenAI ─────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str | None = None

    # ─── Pinecone ───────────────────────────────────────────────────────────
    PINECONE_API_KEY: str | None = None
    PINECONE_INDEX: str | None = None

    # ─── Email ──────────────────────────────────────────────────────────────
    EMAIL_USER: str | None = None
    EMAIL_APP_PASSWORD: str | None = None
    EMAIL_FROM_NAME: str = "Ilaaka"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587

    # ─── Geolocation ────────────────────────────────────────────────────────
    IPINFO_TOKEN: str | None = None

    # ─── Cron / Internal secrets ────────────────────────────────────────────
    CRON_SECRET: str | None = None
    HEALTH_SECRET: str | None = None

    # ─── CORS ───────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    # ─── Community / Push ────────────────────────────────────────────────────
    FCM_SERVER_KEY: str | None = None
    FLOWER_PASSWORD: str = "ilaka"
    RETENTION_DAYS: int = 30

    # ─── Feature flags ───────────────────────────────────────────────────────
    REQUIRE_EMAIL_VERIFICATION: bool = False
    ENABLE_GAMIFICATION: bool = True
    ENABLE_COMMUNITY_FEED: bool = True

    # ─── Derived helpers ────────────────────────────────────────────────────
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def stripe_configured(self) -> bool:
        return bool(self.STRIPE_SECRET_KEY)

    @property
    def razorpay_configured(self) -> bool:
        return bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET)

    @property
    def cloudinary_configured(self) -> bool:
        return bool(
            self.CLOUDINARY_CLOUD_NAME
            and self.CLOUDINARY_API_KEY
            and self.CLOUDINARY_API_SECRET
        )

    @property
    def openai_configured(self) -> bool:
        return bool(self.OPENAI_API_KEY)

    @property
    def pinecone_configured(self) -> bool:
        return bool(self.PINECONE_API_KEY and self.PINECONE_INDEX)

    @property
    def ai_search_configured(self) -> bool:
        return self.openai_configured and self.pinecone_configured

    @property
    def email_configured(self) -> bool:
        return bool(self.EMAIL_USER and self.EMAIL_APP_PASSWORD)

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.JWT_SECRET_KEY:
            raise ValueError("JWT_SECRET_KEY must be set")
        if len(self.JWT_SECRET_KEY) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
