from datetime import UTC, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator

from app.models import Status

Text = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)
]


class BookCreate(BaseModel):
    title: Text
    author: Text
    status: Status = Status.want_to_read


class BookUpdate(BaseModel):
    status: Status


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    status: Status
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

    @field_validator(
        "created_at", "updated_at", "started_at", "finished_at", mode="after"
    )
    @classmethod
    def as_utc(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            return value.replace(tzinfo=UTC)
        return value
