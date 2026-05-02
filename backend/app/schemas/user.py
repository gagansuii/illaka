from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    radius_preference: int | None = None


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
