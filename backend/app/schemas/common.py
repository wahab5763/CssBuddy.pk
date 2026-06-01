from pydantic import BaseModel


class Msg(BaseModel):
    detail: str


class PaginatedMeta(BaseModel):
    page: int
    per_page: int
    total: int
    pages: int
