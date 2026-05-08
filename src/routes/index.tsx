import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/kanban/Board";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Personal Kanban — Estágio, Faculdade & IA/Dev" },
      { name: "description", content: "Lightweight personal Kanban board for managing internship, university, and side-project tasks." },
    ],
  }),
});

function Index() {
  return <Board />;
}
