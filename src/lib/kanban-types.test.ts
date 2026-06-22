import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getDeadlineStatus,
  isArchived,
  isBlocked,
  getGoalProgress,
  getChecklistProgress,
  getCardAging,
  formatBytes,
  formatMinutes,
  formatDate,
  ARCHIVE_AFTER_DAYS,
} from "./kanban-types";
import type { Card, ChecklistItem } from "./kanban-types";

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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── getDeadlineStatus ─────────────────────────────────────────────────────────

describe("getDeadlineStatus", () => {
  // Pin "today" so tests are deterministic
  const TODAY = "2025-06-12";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-12T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns null when card has no date", () => {
    const card = makeCard({ date: undefined });
    expect(getDeadlineStatus(card)).toBeNull();
  });

  it("returns null when card is in 'done' column", () => {
    const card = makeCard({ col: "done", date: "2025-06-10" });
    expect(getDeadlineStatus(card)).toBeNull();
  });

  it("returns 'overdue' for a past date", () => {
    const card = makeCard({ date: "2025-06-11" }); // yesterday
    expect(getDeadlineStatus(card)).toBe("overdue");
  });

  it("returns 'today' for today's date", () => {
    const card = makeCard({ date: TODAY });
    expect(getDeadlineStatus(card)).toBe("today");
  });

  it("returns 'soon' for a date 1 day away", () => {
    const card = makeCard({ date: "2025-06-13" });
    expect(getDeadlineStatus(card)).toBe("soon");
  });

  it("returns 'soon' for a date exactly 3 days away", () => {
    const card = makeCard({ date: "2025-06-15" });
    expect(getDeadlineStatus(card)).toBe("soon");
  });

  it("returns null for a date 4+ days away", () => {
    const card = makeCard({ date: "2025-06-16" });
    expect(getDeadlineStatus(card)).toBeNull();
  });
});

// ── isArchived ────────────────────────────────────────────────────────────────

describe("isArchived", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-12T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns false when card is not in done column", () => {
    const card = makeCard({ col: "inprogress", updated_at: "2025-05-01T00:00:00Z" });
    expect(isArchived(card)).toBe(false);
  });

  it("returns false when done but updated recently (< 7 days)", () => {
    const card = makeCard({ col: "done", updated_at: "2025-06-10T00:00:00Z" });
    expect(isArchived(card)).toBe(false);
  });

  it(`returns true when done and updated more than ${ARCHIVE_AFTER_DAYS} days ago`, () => {
    // 8 days ago
    const card = makeCard({ col: "done", updated_at: "2025-06-04T00:00:00Z" });
    expect(isArchived(card)).toBe(true);
  });

  it("returns false exactly at the cutoff boundary (7 days)", () => {
    // exactly 7 days ago — cutoff is STRICTLY less, so at exactly 7 days it should be true
    // 7*24*60*60*1000 ms ago
    const sevenDaysAgo = new Date("2025-06-12T12:00:00Z").getTime() - 7 * 24 * 60 * 60 * 1000;
    const card = makeCard({ col: "done", updated_at: new Date(sevenDaysAgo).toISOString() });
    // updated < cutoff => updated === cutoff is NOT < cutoff => false
    expect(isArchived(card)).toBe(false);
  });
});

// ── isBlocked ─────────────────────────────────────────────────────────────────

describe("isBlocked", () => {
  it("returns false when blocked_by is empty", () => {
    const card = makeCard({ blocked_by: [] });
    expect(isBlocked(card, [])).toBe(false);
  });

  it("returns true when a blocker is not done", () => {
    const blocker = makeCard({ id: "b-1", col: "inprogress" });
    const card = makeCard({ blocked_by: ["b-1"] });
    expect(isBlocked(card, [blocker])).toBe(true);
  });

  it("returns false when all blockers are done", () => {
    const blocker = makeCard({ id: "b-1", col: "done" });
    const card = makeCard({ blocked_by: ["b-1"] });
    expect(isBlocked(card, [blocker])).toBe(false);
  });

  it("returns true when at least one blocker is not done", () => {
    const b1 = makeCard({ id: "b-1", col: "done" });
    const b2 = makeCard({ id: "b-2", col: "review" });
    const card = makeCard({ blocked_by: ["b-1", "b-2"] });
    expect(isBlocked(card, [b1, b2])).toBe(true);
  });

  it("returns false when blocker id references a card not in allCards", () => {
    // Blocker not found => blocker is undefined => condition is false
    const card = makeCard({ blocked_by: ["non-existent-id"] });
    expect(isBlocked(card, [])).toBe(false);
  });
});

// ── getGoalProgress ───────────────────────────────────────────────────────────

describe("getGoalProgress", () => {
  it("returns zeros when goal has no children", () => {
    const goal = makeCard({ id: "goal-1", type: "Goal" });
    expect(getGoalProgress(goal, [])).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("returns 100% when all children are done", () => {
    const goal = makeCard({ id: "goal-1" });
    const child1 = makeCard({ id: "c1", parent_id: "goal-1", col: "done" });
    const child2 = makeCard({ id: "c2", parent_id: "goal-1", col: "done" });
    expect(getGoalProgress(goal, [child1, child2])).toEqual({ done: 2, total: 2, percent: 100 });
  });

  it("calculates partial progress correctly", () => {
    const goal = makeCard({ id: "goal-1" });
    const c1 = makeCard({ id: "c1", parent_id: "goal-1", col: "done" });
    const c2 = makeCard({ id: "c2", parent_id: "goal-1", col: "inprogress" });
    const c3 = makeCard({ id: "c3", parent_id: "goal-1", col: "todo" });
    const result = getGoalProgress(goal, [c1, c2, c3]);
    expect(result.done).toBe(1);
    expect(result.total).toBe(3);
    expect(result.percent).toBe(33); // Math.round(1/3*100)
  });

  it("only counts direct children (matching parent_id)", () => {
    const goal = makeCard({ id: "goal-1" });
    const otherGoalChild = makeCard({ id: "c1", parent_id: "goal-99", col: "done" });
    expect(getGoalProgress(goal, [otherGoalChild])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

// ── getChecklistProgress ──────────────────────────────────────────────────────

describe("getChecklistProgress", () => {
  it("returns zeros for empty checklist", () => {
    const card = makeCard({ checklist: [] });
    expect(getChecklistProgress(card)).toEqual({ done: 0, total: 0, percent: 0 });
  });

  it("returns 100% when all items are done", () => {
    const items: ChecklistItem[] = [
      { id: "1", text: "A", done: true },
      { id: "2", text: "B", done: true },
    ];
    const card = makeCard({ checklist: items });
    expect(getChecklistProgress(card)).toEqual({ done: 2, total: 2, percent: 100 });
  });

  it("calculates partial progress", () => {
    const items: ChecklistItem[] = [
      { id: "1", text: "A", done: true },
      { id: "2", text: "B", done: false },
      { id: "3", text: "C", done: false },
      { id: "4", text: "D", done: false },
    ];
    const card = makeCard({ checklist: items });
    expect(getChecklistProgress(card)).toEqual({ done: 1, total: 4, percent: 25 });
  });
});

// ── getCardAging ──────────────────────────────────────────────────────────────

describe("getCardAging", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-12T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  function daysAgo(n: number): string {
    const d = new Date("2025-06-12T12:00:00Z");
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  it("returns 1 for a card updated less than 7 days ago", () => {
    const card = makeCard({ updated_at: daysAgo(3) });
    expect(getCardAging(card)).toBe(1);
  });

  it("returns 0.7 for a card updated 7-13 days ago", () => {
    const card = makeCard({ updated_at: daysAgo(10) });
    expect(getCardAging(card)).toBe(0.7);
  });

  it("returns 0.5 for a card updated 14-29 days ago", () => {
    const card = makeCard({ updated_at: daysAgo(20) });
    expect(getCardAging(card)).toBe(0.5);
  });

  it("returns 0.3 for a card updated 30+ days ago", () => {
    const card = makeCard({ updated_at: daysAgo(45) });
    expect(getCardAging(card)).toBe(0.3);
  });
});

// ── formatBytes ───────────────────────────────────────────────────────────────

describe("formatBytes", () => {
  it("returns empty string for undefined", () => {
    expect(formatBytes(undefined)).toBe("");
  });

  it("returns empty string for 0", () => {
    expect(formatBytes(0)).toBe("");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats exact kilobytes without unnecessary decimal", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes with one decimal for small values", () => {
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });

  it("formats megabytes rounded for large values", () => {
    expect(formatBytes(20 * 1024 * 1024)).toBe("20 MB");
  });
});

// ── formatMinutes ─────────────────────────────────────────────────────────────

describe("formatMinutes", () => {
  it("formats minutes less than 60", () => {
    expect(formatMinutes(45)).toBe("45m");
  });

  it("formats exactly 60 minutes as 1h", () => {
    expect(formatMinutes(60)).toBe("1h");
  });

  it("formats hours with remainder", () => {
    expect(formatMinutes(90)).toBe("1h 30m");
  });

  it("formats multiple hours with no remainder", () => {
    expect(formatMinutes(120)).toBe("2h");
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("converts ISO date to dd/mm/yyyy", () => {
    expect(formatDate("2025-06-12")).toBe("12/06/2025");
  });

  it("converts a different date correctly", () => {
    expect(formatDate("2024-01-05")).toBe("05/01/2024");
  });
});
