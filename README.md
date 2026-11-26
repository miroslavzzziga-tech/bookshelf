# Bookshelf

A small personal reading list: add books, track what you're reading, filter by status, remove books.

FastAPI + SQLAlchemy + SQLite backend, React (Vite) frontend.

## How to run

Requires Python 3.12 and Node 22.

Backend (terminal 1):

```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Frontend (terminal 2):

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on port 8000.

Tests: `pytest -q` (backend) and `cd frontend && npm test` (frontend API client)

## Decisions

**Statuses.** Want to read, Reading, Finished. Kept simple. Moving a book to Reading records the start date, Finished records the finish date, and moving back to Want to read clears both. That gives the user an easy overview of their reading history.

**Sort order.** The list is split into sections: Currently reading first, then Want to read, then Finished. The user sees what they're reading right now first, and finished books are history. Inside each section books are alphabetical (case-insensitive), which keeps each section clean and easy to glance through.

**Duplicates.** Blocked. There's no reason to have the same book twice; it would just be clutter. Title and author are compared ignoring case and extra spaces, and the database enforces it with a unique constraint. Known gap: a typo ("Dxne") gets through. With more time I'd show a "similar book is already on your shelf, add anyway?" prompt pointing at the closest match.

**Loading and errors.** The user should always understand what went wrong. There's a loading state on first load, buttons are disabled while a request is running, a failed load shows a message with Retry, a failed add keeps what the user typed, and a failed status change or removal shows a clear message.

**Data model.** One `books` table: title, author, status, a normalised duplicate key, and created / updated / started / finished timestamps. If we added user accounts: a `users` table, a `user_id` on books, and the duplicate rule becomes per user. Then authentication on top: passwords hashed with Argon2id, token-based sessions, and email verification and password recovery.

**Frontend: React.** I'm most familiar with React, so it's what I can work in fastest and most carefully. React can easily lead to over-engineering, so I kept it minimal: no router, no state library, no UI library, plain fetch. The trade-off versus vanilla JS is a Node build step.

**SQLite and filtering.** SQLite fits a small single-user CRUD app: nothing to set up. For anything bigger with real users I'd use PostgreSQL; since everything goes through SQLAlchemy, that's mostly a connection-string change plus migrations. Filtering happens in the browser because a personal list is small; with large lists I'd move filtering and pagination to the server.

## What I'd do with more time

1. Edit title and author, plus the "similar book" warning for typos
2. Ratings and favourites
3. User accounts, then shared ratings so users can see what others thought of a book
4. A book catalogue with autocomplete while typing (genres, covers)
5. Reading priority: what to read next
6. Deployment pipeline, Alembic migrations and Playwright end-to-end tests
7. A more polished UI
