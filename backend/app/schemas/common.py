from pydantic import BaseModel


class OkResponse(BaseModel):
    ok: bool = True


class PaginatedMeta(BaseModel):
    total: int
    page: int
    page_size: int
