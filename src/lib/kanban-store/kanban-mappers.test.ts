import { describe, it, expect } from "vitest";
import { nextOrder, rowToCard, rowToColumn, trackToRow, rowToTrack } from "./kanban-mappers";
import type { Card } from "../kanban-types";

function makeCard(o: Partial<Card> = {}): Card {
  return {
    id: "c1",
    col: "todo",
    track: "t1",
    type: "Task",
    title: "Card",
    prio: "Média",
    starred: false,
    tags: [],
    order: 1,
    checklist: [],
    blocked_by: [],
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...o,
  };
}

// ── nextOrder ─────────────────────────────────────────────────────────────────

describe("nextOrder", () => {
  it("retorna 1 quando a coluna+track está vazia", () => {
    expect(nextOrder([], "t1", "todo")).toBe(1);
  });

  it("retorna 1 quando há cards mas em outra coluna", () => {
    const cards = [makeCard({ id: "a", col: "done", order: 5 })];
    expect(nextOrder(cards, "t1", "todo")).toBe(1);
  });

  it("retorna max(order)+1 dentro da mesma coluna+track", () => {
    const cards = [
      makeCard({ id: "a", col: "todo", order: 1 }),
      makeCard({ id: "b", col: "todo", order: 4 }),
    ];
    expect(nextOrder(cards, "t1", "todo")).toBe(5);
  });

  it("é escopado por track (mesma coluna em outra track não conta)", () => {
    const cards = [
      makeCard({ id: "a", track: "t1", col: "todo", order: 2 }),
      makeCard({ id: "b", track: "t2", col: "todo", order: 99 }),
    ];
    expect(nextOrder(cards, "t1", "todo")).toBe(3);
  });
});

// ── rowToCard (preenchimento de defaults) ─────────────────────────────────────

describe("rowToCard", () => {
  it("aplica defaults para campos ausentes/nulos do banco", () => {
    const card = rowToCard({
      id: "c1",
      col: "todo",
      track: "t1",
      title: "Sem extras",
      prio: "Alta",
      created_at: "x",
      updated_at: "y",
    });
    expect(card.type).toBe("Task");
    expect(card.starred).toBe(false);
    expect(card.tags).toEqual([]);
    expect(card.order).toBe(0);
    expect(card.checklist).toEqual([]);
    expect(card.blocked_by).toEqual([]);
  });

  it("preserva valores presentes", () => {
    const card = rowToCard({
      id: "c1",
      col: "todo",
      track: "t1",
      type: "Goal",
      title: "Com extras",
      prio: "Baixa",
      starred: true,
      tags: ["tag1"],
      order: 7,
      created_at: "x",
      updated_at: "y",
    });
    expect(card.type).toBe("Goal");
    expect(card.starred).toBe(true);
    expect(card.tags).toEqual(["tag1"]);
    expect(card.order).toBe(7);
  });
});

// ── rowToColumn ───────────────────────────────────────────────────────────────

describe("rowToColumn", () => {
  it("mapeia track_id null para undefined (coluna global)", () => {
    const col = rowToColumn({ id: "todo", name: "To Do", order: 1, track_id: null });
    expect(col.track_id).toBeUndefined();
  });
  it("default order = 0 quando ausente", () => {
    const col = rowToColumn({ id: "todo", name: "To Do" });
    expect(col.order).toBe(0);
  });
});

// ── trackToRow ↔ rowToTrack (round-trip camelCase ↔ snake_case) ────────────────

describe("trackToRow / rowToTrack", () => {
  it("converte camelCase do modelo para snake_case do banco e de volta", () => {
    const row = trackToRow({
      name: "Faculdade",
      bg: "#fff",
      border: "#000",
      fg: "#111",
      darkBg: "#222",
      darkFg: "#333",
      order: 2,
    });
    // grava em snake_case
    expect(row.dark_bg).toBe("#222");
    expect(row.dark_fg).toBe("#333");
    expect(row).not.toHaveProperty("darkBg");

    // e lê de volta para camelCase
    const track = rowToTrack({ id: "t1", ...row });
    expect(track.darkBg).toBe("#222");
    expect(track.darkFg).toBe("#333");
    expect(track.order).toBe(2);
  });
});
