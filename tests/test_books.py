def test_post_creates_book(client):
    response = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "want_to_read"
    assert body["started_at"] is None
    assert body["finished_at"] is None


def test_post_rejects_empty_title_and_whitespace_author(client):
    empty_title = client.post(
        "/api/books", json={"title": "", "author": "Frank Herbert"}
    )
    assert empty_title.status_code == 422
    whitespace_author = client.post(
        "/api/books", json={"title": "Dune", "author": "   "}
    )
    assert whitespace_author.status_code == 422


def test_post_trims_title_and_author(client):
    response = client.post(
        "/api/books", json={"title": "  Dune  ", "author": "  Frank Herbert  "}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Dune"
    assert body["author"] == "Frank Herbert"


def test_post_duplicate_ignores_case_and_extra_spaces(client):
    first = client.post("/api/books", json={"title": "Dune", "author": "Frank Herbert"})
    assert first.status_code == 201
    second = client.post(
        "/api/books", json={"title": "  dune ", "author": "frank   herbert"}
    )
    assert second.status_code == 409
    assert second.json()["detail"] == "This book is already on your shelf."


def test_post_rejects_title_over_200_characters(client):
    response = client.post(
        "/api/books", json={"title": "a" * 201, "author": "Frank Herbert"}
    )
    assert response.status_code == 422


def test_get_orders_by_status_group_then_title(client):
    books = [
        {"title": "Zebra", "author": "Zed", "status": "finished"},
        {"title": "Neuromancer", "author": "William Gibson", "status": "reading"},
        {"title": "Dune", "author": "Frank Herbert", "status": "want_to_read"},
        {"title": "Foundation", "author": "Isaac Asimov", "status": "want_to_read"},
        {"title": "the hobbit", "author": "J.R.R. Tolkien", "status": "finished"},
        {"title": "Snow Crash", "author": "Neal Stephenson", "status": "reading"},
    ]
    for book in books:
        response = client.post("/api/books", json=book)
        assert response.status_code == 201

    response = client.get("/api/books")
    assert response.status_code == 200
    assert [(book["status"], book["title"]) for book in response.json()] == [
        ("reading", "Neuromancer"),
        ("reading", "Snow Crash"),
        ("want_to_read", "Dune"),
        ("want_to_read", "Foundation"),
        ("finished", "the hobbit"),
        ("finished", "Zebra"),
    ]


def test_patch_reading_sets_started_at(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    response = client.patch(f"/api/books/{created['id']}", json={"status": "reading"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reading"
    assert body["started_at"] is not None
    assert body["finished_at"] is None


def test_patch_finished_keeps_started_at(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    reading = client.patch(
        f"/api/books/{created['id']}", json={"status": "reading"}
    ).json()
    response = client.patch(f"/api/books/{created['id']}", json={"status": "finished"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "finished"
    assert body["finished_at"] is not None
    assert body["started_at"] == reading["started_at"]


def test_patch_want_to_read_clears_dates(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    book_id = created["id"]
    assert (
        client.patch(f"/api/books/{book_id}", json={"status": "reading"}).status_code
        == 200
    )
    assert (
        client.patch(f"/api/books/{book_id}", json={"status": "finished"}).status_code
        == 200
    )
    response = client.patch(f"/api/books/{book_id}", json={"status": "want_to_read"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "want_to_read"
    assert body["started_at"] is None
    assert body["finished_at"] is None


def test_patch_same_status_does_not_change_started_at(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    reading = client.patch(
        f"/api/books/{created['id']}", json={"status": "reading"}
    ).json()
    response = client.patch(f"/api/books/{created['id']}", json={"status": "reading"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "reading"
    assert body["started_at"] == reading["started_at"]


def test_patch_invalid_status(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    response = client.patch(f"/api/books/{created['id']}", json={"status": "abandoned"})
    assert response.status_code == 422


def test_patch_and_delete_unknown_id(client):
    patch = client.patch("/api/books/999", json={"status": "reading"})
    assert patch.status_code == 404
    assert patch.json()["detail"] == "Book not found."
    delete = client.delete("/api/books/999")
    assert delete.status_code == 404
    assert delete.json()["detail"] == "Book not found."


def test_delete_existing_book(client):
    created = client.post(
        "/api/books", json={"title": "Dune", "author": "Frank Herbert"}
    ).json()
    response = client.delete(f"/api/books/{created['id']}")
    assert response.status_code == 204
    assert response.content == b""
    listing = client.get("/api/books")
    assert listing.status_code == 200
    assert all(book["id"] != created["id"] for book in listing.json())


def test_post_finished_sets_finished_at(client):
    response = client.post(
        "/api/books",
        json={"title": "Dune", "author": "Frank Herbert", "status": "finished"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "finished"
    assert body["finished_at"] is not None


def test_timestamps_are_returned_as_utc(client):
    created = client.post(
        "/api/books",
        json={"title": "Dune", "author": "Frank Herbert", "status": "finished"},
    )
    assert created.status_code == 201
    response = client.get("/api/books")
    assert response.status_code == 200
    book = response.json()[0]
    assert book["created_at"].endswith("Z")
    assert book["updated_at"].endswith("Z")
    assert book["finished_at"].endswith("Z")
