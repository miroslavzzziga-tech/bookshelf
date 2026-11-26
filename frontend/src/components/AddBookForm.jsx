import { useState } from "react";

export function AddBookForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fields = [
    ["book-title", "Title", title, setTitle],
    ["book-author", "Author", author, setAuthor],
  ];

  function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    onAdd(title, author)
      .then(() => {
        setTitle("");
        setAuthor("");
        setError(null);
        document.getElementById("book-title").focus();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={onSubmit}>
      {fields.map(([id, label, value, setValue]) => (
        <div className="field" key={id}>
          <label htmlFor={id}>{label}</label>
          <input
            id={id}
            value={value}
            required
            maxLength={200}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
      ))}
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add book"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
