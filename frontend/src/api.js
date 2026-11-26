const GENERIC = "Something went wrong. Please try again.";
const INVALID = "Please enter a title and author (max 200 characters).";

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error(GENERIC);
  }
  if (response.status === 204) return null;
  if (response.ok) return response.json();
  let detail;
  try {
    detail = (await response.json()).detail;
  } catch {
    detail = null;
  }
  if (typeof detail === "string") throw new Error(detail);
  throw new Error(response.status === 422 ? INVALID : GENERIC);
}

function sendJson(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const listBooks = () => request("/api/books");

export const addBook = (title, author) =>
  request("/api/books", sendJson("POST", { title, author }));

export const updateStatus = (id, status) =>
  request(`/api/books/${id}`, sendJson("PATCH", { status }));

export const deleteBook = (id) => request(`/api/books/${id}`, { method: "DELETE" });
