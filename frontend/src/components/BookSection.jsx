import { BookRow } from "./BookRow";

export function BookSection({ label, books, onStatusChange, onRemove }) {
  return (
    <section>
      <h2>{label}</h2>
      <ul>
        {books.map((book) => (
          <BookRow key={book.id} book={book} onStatusChange={onStatusChange} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  );
}
