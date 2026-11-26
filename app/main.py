from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Book, Status
from app.schemas import BookCreate, BookOut, BookUpdate

Db = Annotated[Session, Depends(get_db)]


def make_dedupe_key(title: str, author: str) -> str:
    return "|".join(" ".join(part.split()).casefold() for part in (title, author))


def apply_status(book: Book, new_status: Status, now: datetime) -> None:
    if new_status == book.status:
        return
    if new_status == Status.reading:
        book.started_at, book.finished_at = now, None
    elif new_status == Status.finished:
        book.finished_at = now
    elif new_status == Status.want_to_read:
        book.started_at = book.finished_at = None
    book.status = new_status


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Bookshelf", lifespan=lifespan)


@app.get("/api/books", response_model=list[BookOut])
def list_books(db: Db) -> list[Book]:
    rank = case(
        (Book.status == Status.reading, 0),
        (Book.status == Status.want_to_read, 1),
        (Book.status == Status.finished, 2),
    )
    rows = select(Book).order_by(rank, func.lower(Book.title), Book.id)
    return list(db.scalars(rows))


@app.post("/api/books", response_model=BookOut, status_code=201)
def create_book(payload: BookCreate, db: Db) -> Book:
    key = make_dedupe_key(payload.title, payload.author)
    if db.scalar(select(Book).where(Book.dedupe_key == key)):
        raise HTTPException(409, detail="This book is already on your shelf.")
    book = Book(title=payload.title, author=payload.author, dedupe_key=key)
    book.status = Status.want_to_read
    apply_status(book, payload.status, datetime.now(UTC))
    db.add(book)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, detail="This book is already on your shelf.") from None
    db.refresh(book)
    return book


@app.patch("/api/books/{book_id}", response_model=BookOut)
def update_book(book_id: int, payload: BookUpdate, db: Db) -> Book:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(404, detail="Book not found.")
    apply_status(book, payload.status, datetime.now(UTC))
    db.commit()
    db.refresh(book)
    return book


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(book_id: int, db: Db) -> None:
    book = db.get(Book, book_id)
    if book is None:
        raise HTTPException(404, detail="Book not found.")
    db.delete(book)
    db.commit()
