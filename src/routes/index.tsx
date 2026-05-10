import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/kanban/Board";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Gerenciador de Molas — Estágio, Faculdade & IA/Dev" },
      { name: "description", content: "Quadro Kanban pessoal para gerenciar tarefas." },
    ],
  }),
});

function Index() {
  return (
    <AppShell>
      <Board />
    </AppShell>
  );
}
