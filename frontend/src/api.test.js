import { afterEach, expect, test, vi } from "vitest";

import { addBook, deleteBook, listBooks, updateStatus } from "./api.js";

const UNREACHABLE = "Can't reach the server right now. Please try again.";
const GENERIC = "Something went wrong. Please try again.";
const INVALID = "Please enter a title and author (max 200 characters).";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function messageOf(promise) {
  try {
    await promise;
  } catch (error) {
    return error.message;
  }
  throw new Error("expected the request to throw");
}

test("listBooks resolves with the parsed JSON on a 200 response", async () => {
  const books = [{ id: 1, title: "Dune", author: "Frank Herbert", status: "reading" }];
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse(200, books))),
  );

  await expect(listBooks()).resolves.toEqual(books);
});

test("deleteBook resolves with null on a 204 response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
  );

  await expect(deleteBook(1)).resolves.toBeNull();
});

test("fetch rejection throws the unreachable message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
  );

  expect(await messageOf(addBook("Dune", "Frank Herbert"))).toBe(UNREACHABLE);
});

test("503 response throws the unreachable message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse(503, { detail: "unavailable" }))),
  );

  expect(await messageOf(updateStatus(1, "reading"))).toBe(UNREACHABLE);
});

test("500 response with a string detail still throws the unreachable message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse(500, { detail: "Internal Server Error" }))),
  );

  expect(await messageOf(listBooks())).toBe(UNREACHABLE);
});

test("409 response throws the string detail", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(jsonResponse(409, { detail: "This book is already on your shelf." })),
    ),
  );

  expect(await messageOf(addBook("Dune", "Frank Herbert"))).toBe(
    "This book is already on your shelf.",
  );
});

test("422 response with an array detail throws the invalid message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(jsonResponse(422, { detail: [{ loc: ["body", "title"], msg: "required" }] })),
    ),
  );

  expect(await messageOf(addBook("", ""))).toBe(INVALID);
});

test("400 response with a non-string detail throws the generic message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(jsonResponse(400, { detail: { msg: "bad request" } }))),
  );

  expect(await messageOf(updateStatus(1, "nope"))).toBe(GENERIC);
});
