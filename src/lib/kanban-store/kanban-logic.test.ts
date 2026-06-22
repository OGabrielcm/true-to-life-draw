import { describe, it, expect } from "vitest";
import {
  computeReorderOrder,
  computeTrackDeletion,
  computeColumnDeletion,
  getVisibleTracks,
} from "./kanban-logic";
import type { Card, Column, Track } from "../kanban-types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: "card-1",
    col: "todo",
    track: "track-1",
    type: "Task",
    title: "Test card",
    prio: "Média",
    starred: false,
    tags: [],
    order: 1,
    checklist: [],
    blocked_by: [],
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: "track-1",
    name: "Track",
    bg: "#fff",
    border: "#000",
    fg: "#000",
    darkBg: "#111",
    darkFg: "#eee",
    order: 0,
    ...overrides,
  };
}

function makeColumn(overrides: Partial<Column> = {}): Column {
  return { id: "todo", name: "To Do", order: 1, ...overrides };
}

const NOW = "2025-06-15T12:00:00.000Z";

// ── computeReorderOrder ───────────────────────────────────────────────────────

describe("computeReorderOrder", () => {
  it("returns null when the card does not exist", () => {
    expect(computeReorderOrder([], "ghost", {})).toBeNull();
  });

  it("returns null when nothing actually changes (same col/track/order)", () => {
    // Card sozinho na coluna, sem âncora → newOrder=1, igual ao atual → null.
    const cards = [makeCard({ id: "a", order: 1 })];
    expect(computeReorderOrder(cards, "a", {})).toBeNull();
  });

  it("returns null when beforeId anchor is not in the target column", () => {
    const cards = [makeCard({ id: "a", order: 1 })];
    expect(computeReorderOrder(cards, "a", { beforeId: "nope" })).toBeNull();
  });

  it("returns null when afterId anchor is not in the target column", () => {
    const cards = [makeCard({ id: "a", order: 1 })];
    expect(computeReorderOrder(cards, "a", { afterId: "nope" })).toBeNull();
  });

  it("drops to the end of an empty target column with order 1", () => {
    const cards = [makeCard({ id: "a", col: "todo", order: 5 })];
    const res = computeReorderOrder(cards, "a", { col: "done" });
    expect(res).toEqual({ col: "done", track: "track-1", order: 1 });
  });

  it("appends to the end of a populated column (max order + 1)", () => {
    const cards = [
      makeCard({ id: "a", col: "done", order: 1 }),
      makeCard({ id: "b", col: "done", order: 2 }),
      makeCard({ id: "moving", col: "todo", order: 9 }),
    ];
    const res = computeReorderOrder(cards, "moving", { col: "done" });
    expect(res).toEqual({ col: "done", track: "track-1", order: 3 });
  });

  it("inserts between two cards using the midpoint (beforeId)", () => {
    const cards = [
      makeCard({ id: "a", col: "todo", order: 1 }),
      makeCard({ id: "b", col: "todo", order: 2 }),
      makeCard({ id: "moving", col: "backlog", order: 9 }),
    ];
    // Inserir ANTES de "b": meio entre a(1) e b(2) = 1.5
    const res = computeReorderOrder(cards, "moving", { col: "todo", beforeId: "b" });
    expect(res).toEqual({ col: "todo", track: "track-1", order: 1.5 });
  });

  it("inserts before the first card using order - 1 (no previous neighbor)", () => {
    const cards = [
      makeCard({ id: "a", col: "todo", order: 1 }),
      makeCard({ id: "moving", col: "backlog", order: 9 }),
    ];
    const res = computeReorderOrder(cards, "moving", { col: "todo", beforeId: "a" });
    expect(res).toEqual({ col: "todo", track: "track-1", order: 0 });
  });

  it("inserts between two cards using the midpoint (afterId)", () => {
    const cards = [
      makeCard({ id: "a", col: "todo", order: 1 }),
      makeCard({ id: "b", col: "todo", order: 2 }),
      makeCard({ id: "moving", col: "backlog", order: 9 }),
    ];
    // Inserir DEPOIS de "a": meio entre a(1) e b(2) = 1.5
    const res = computeReorderOrder(cards, "moving", { col: "todo", afterId: "a" });
    expect(res).toEqual({ col: "todo", track: "track-1", order: 1.5 });
  });

  it("inserts after the last card using order + 1 (no next neighbor)", () => {
    const cards = [
      makeCard({ id: "a", col: "todo", order: 1 }),
      makeCard({ id: "b", col: "todo", order: 2 }),
      makeCard({ id: "moving", col: "backlog", order: 9 }),
    ];
    const res = computeReorderOrder(cards, "moving", { col: "todo", afterId: "b" });
    expect(res).toEqual({ col: "todo", track: "track-1", order: 3 });
  });

  it("scopes the target column by track, not just column id", () => {
    const cards = [
      makeCard({ id: "a", track: "t1", col: "todo", order: 1 }),
      makeCard({ id: "b", track: "t2", col: "todo", order: 50 }),
      makeCard({ id: "moving", track: "t1", col: "backlog", order: 9 }),
    ];
    // Move para t2/todo: lá só existe "b" (order 50) → final = 51.
    const res = computeReorderOrder(cards, "moving", { track: "t2", col: "todo" });
    expect(res).toEqual({ col: "todo", track: "t2", order: 51 });
  });
});

// ── computeTrackDeletion ──────────────────────────────────────────────────────

describe("computeTrackDeletion", () => {
  it("reassigns orphan cards to the first remaining track", () => {
    const tracks = [makeTrack({ id: "t1" }), makeTrack({ id: "t2" })];
    const cards = [makeCard({ id: "a", track: "t1" }), makeCard({ id: "b", track: "t2" })];
    const res = computeTrackDeletion(cards, tracks, "t1", NOW);

    expect(res.remaining).toEqual([makeTrack({ id: "t2" })]);
    expect(res.fallbackId).toBe("t2");
    expect(res.movedCardIds).toEqual(["a"]);
    expect(res.deletedCardIds).toEqual([]);
    expect(res.cards.find((c) => c.id === "a")).toMatchObject({ track: "t2", updated_at: NOW });
    // Card de outra track não é tocado.
    expect(res.cards.find((c) => c.id === "b")).toMatchObject({
      track: "t2",
      updated_at: "2025-01-01T00:00:00.000Z",
    });
  });

  it("deletes orphan cards when no track remains", () => {
    const tracks = [makeTrack({ id: "t1" })];
    const cards = [makeCard({ id: "a", track: "t1" }), makeCard({ id: "b", track: "t1" })];
    const res = computeTrackDeletion(cards, tracks, "t1", NOW);

    expect(res.remaining).toEqual([]);
    expect(res.fallbackId).toBeNull();
    expect(res.movedCardIds).toEqual([]);
    expect(res.deletedCardIds).toEqual(["a", "b"]);
    expect(res.cards).toEqual([]);
  });

  it("does not mutate the input arrays", () => {
    const tracks = [makeTrack({ id: "t1" }), makeTrack({ id: "t2" })];
    const cards = [makeCard({ id: "a", track: "t1" })];
    const cardsBefore = structuredClone(cards);
    computeTrackDeletion(cards, tracks, "t1", NOW);
    expect(cards).toEqual(cardsBefore);
  });
});

// ── computeColumnDeletion ─────────────────────────────────────────────────────

describe("computeColumnDeletion", () => {
  it("reassigns orphan cards to the first remaining column", () => {
    const columns = [makeColumn({ id: "todo" }), makeColumn({ id: "done", order: 2 })];
    const cards = [makeCard({ id: "a", col: "todo" }), makeCard({ id: "b", col: "done" })];
    const res = computeColumnDeletion(cards, columns, "todo", NOW);

    expect(res.fallbackId).toBe("done");
    expect(res.movedCardIds).toEqual(["a"]);
    expect(res.deletedCardIds).toEqual([]);
    expect(res.cards.find((c) => c.id === "a")).toMatchObject({ col: "done", updated_at: NOW });
  });

  it("deletes orphan cards when no column remains", () => {
    const columns = [makeColumn({ id: "todo" })];
    const cards = [makeCard({ id: "a", col: "todo" })];
    const res = computeColumnDeletion(cards, columns, "todo", NOW);

    expect(res.fallbackId).toBeNull();
    expect(res.deletedCardIds).toEqual(["a"]);
    expect(res.cards).toEqual([]);
  });
});

// ── getVisibleTracks ──────────────────────────────────────────────────────────

describe("getVisibleTracks", () => {
  const tracks = [
    makeTrack({ id: "work", name: "Work", order: 0 }),
    makeTrack({ id: "college", name: "College", order: 1 }),
    makeTrack({ id: "ai-dev", name: "AI / Dev", order: 2 }),
  ];

  it("shows all areas when no area is selected and there is no search", () => {
    expect(getVisibleTracks(tracks, [], [], "").map((track) => track.id)).toEqual([
      "work",
      "college",
      "ai-dev",
    ]);
  });

  it("shows only selected areas", () => {
    expect(getVisibleTracks(tracks, [], ["work", "ai-dev"], "").map((track) => track.id)).toEqual([
      "work",
      "ai-dev",
    ]);
  });

  it("keeps search optimization by hiding selected areas without matching cards", () => {
    const filteredCards = [makeCard({ id: "match", track: "ai-dev" })];

    expect(
      getVisibleTracks(tracks, filteredCards, ["work", "ai-dev"], "langgraph").map(
        (track) => track.id,
      ),
    ).toEqual(["ai-dev"]);
  });
});
