import { useRef, useState } from "react";

export function AddBookForm({ onAdd }) {
  const titleRef = useRef(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onAdd(title, author)
      .then(() => {
        setTitle("");
        setAuthor("");
        setError(null);
        titleRef.current.focus();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="book-title">Title</label>
        <input
          id="book-title"
          ref={titleRef}
          value={title}
          required
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="book-author">Author</label>
        <input
          id="book-author"
          value={author}
          required
          maxLength={200}
          onChange={(event) => setAuthor(event.target.value)}
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add book"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
