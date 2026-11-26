import { useEffect, useState } from "react";
import { addBook, deleteBook, listBooks, updateStatus } from "./api";
import { AddBookForm } from "./components/AddBookForm";
import { BookSection } from "./components/BookSection";
import { FilterTabs } from "./components/FilterTabs";

const STATUS_ORDER = ["reading", "want_to_read", "finished"];
const STATUS_LABELS = {
  reading: "Currently reading",
  want_to_read: "Want to read",
  finished: "Finished",
};

function sortBooks(books) {
  const rank = { reading: 0, want_to_read: 1, finished: 2 };
  return [...books].sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status];
    const byTitle = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    return byStatus || byTitle || a.id - b.id;
  });
}

function Banner({ message, label, onClick }) {
  return (
    <div className="banner" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onClick}>
        {label}
      </button>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [filter, setFilter] = useState("all");

  function loadBooks() {
    setLoading(true);
    setLoadError(null);
    listBooks()
      .then((data) => setBooks(data))
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function handleAdd(title, author) {
    return addBook(title, author).then((book) => {
      setBooks((current) => sortBooks([...current, book]));
      setActionError(null);
    });
  }

  function handleStatus(book, status) {
    return updateStatus(book.id, status)
      .then((updated) => {
        setBooks((current) =>
          sortBooks(current.map((item) => (item.id === updated.id ? updated : item))),
        );
        setActionError(null);
      })
      .catch(() => setActionError(`Couldn't update "${book.title}". Try again.`));
  }

  function handleRemove(book) {
    if (!window.confirm(`Remove "${book.title}" from your shelf?`)) return Promise.resolve();
    return deleteBook(book.id)
      .then(() => {
        setBooks((current) => current.filter((item) => item.id !== book.id));
        setActionError(null);
      })
      .catch(() => setActionError(`Couldn't remove "${book.title}". Try again.`));
  }

  const counts = { all: books.length, reading: 0, want_to_read: 0, finished: 0 };
  for (const book of books) counts[book.status] += 1;

  const sections = STATUS_ORDER.filter(
    (status) =>
      (filter === "all" || status === filter) && books.some((book) => book.status === status),
  );

  let list = <p className="muted">Your shelf is empty. Add your first book above.</p>;
  if (books.length > 0 && sections.length === 0) {
    list = <p className="muted">No books here yet.</p>;
  } else if (sections.length > 0) {
    list = sections.map((status) => (
      <BookSection
        key={status}
        label={STATUS_LABELS[status]}
        books={books.filter((book) => book.status === status)}
        onStatusChange={handleStatus}
        onRemove={handleRemove}
      />
    ));
  }

  return (
    <main>
      <h1>My Bookshelf</h1>
      {loading ? (
        <p>Loading your shelf…</p>
      ) : loadError ? (
        <Banner message={loadError} label="Retry" onClick={loadBooks} />
      ) : (
        <>
          <AddBookForm onAdd={handleAdd} />
          <FilterTabs filter={filter} counts={counts} onChange={setFilter} />
          {actionError && (
            <Banner message={actionError} label="Dismiss" onClick={() => setActionError(null)} />
          )}
          {list}
        </>
      )}
    </main>
  );
}
