from pydantic import BaseModel, field_validator
import bleach


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    radius_preference: int | None = None


class UpdateSocialProfileRequest(BaseModel):
    bio: str | None = None
    avatar_url: str | None = None
    interests: list[str] | None = None
    social_links: dict[str, str] | None = None
    location_label: str | None = None

    @field_validator("bio", mode="before")
    @classmethod
    def sanitize_bio(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()[:500]

    @field_validator("location_label", mode="before")
    @classmethod
    def sanitize_location_label(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return bleach.clean(v, tags=[], strip=True).strip()[:200]


class UpdateLocationRequest(BaseModel):
    latitude: float
    longitude: float
    radius: int | None = None


class UserSummary(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: object

    model_config = {"from_attributes": True}


class MemberListResponse(BaseModel):
    members: list[UserSummary]
    total_members: int
