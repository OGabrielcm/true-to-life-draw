import { createFileRoute } from "@tanstack/react-router";
import { Board } from "@/components/kanban/Board";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Gerenciador de Molas — Estágio, Faculdade & IA/Dev" },
      { name: "description", content: "Quadro Kanban pessoal para gerenciar tarefas de estágio, faculdade e projetos de IA/Dev." },
    ],
  }),
});

function Index() {
  return <Board />;
}
