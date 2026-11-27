import { useState } from "react";

const OPTIONS = [
  ["want_to_read", "Want to read"],
  ["reading", "Reading"],
  ["finished", "Finished"],
];

function formatDate(value) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(value).toLocaleDateString("en-GB", options);
}

export function BookRow({ book, onStatusChange, onRemove }) {
  const [busy, setBusy] = useState(false);
  function run(action) {
    setBusy(true);
    Promise.resolve(action()).finally(() => setBusy(false));
  }
  let when = null;
  if (book.status === "reading" && book.started_at) {
    when = `Started ${formatDate(book.started_at)}`;
  }
  if (book.status === "finished" && book.finished_at) {
    when = `Finished ${formatDate(book.finished_at)}`;
  }

  return (
    <li className={`book status-${book.status}`}>
      <div>
        <p className="title">{book.title}</p>
        <p className="muted">{book.author}</p>
        {when && <p className="when">{when}</p>}
      </div>
      <div className="row-actions">
        <select
          aria-label={`Status for ${book.title}`}
          value={book.status}
          disabled={busy}
          onChange={(event) => run(() => onStatusChange(book, event.target.value))}
        >
          {OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button
          type="button"
          aria-label={`Remove ${book.title}`}
          disabled={busy}
          onClick={() => run(() => onRemove(book))}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
