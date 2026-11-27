const TABS = [
  ["all", "All"],
  ["reading", "Currently reading"],
  ["want_to_read", "Want to read"],
  ["finished", "Finished"],
];

export function FilterTabs({ filter, counts, onChange }) {
  return (
    <div className="tabs">
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={filter === id}
          className={filter === id ? "active" : undefined}
          onClick={() => onChange(id)}
        >
          {label} ({counts[id]})
        </button>
      ))}
    </div>
  );
}
