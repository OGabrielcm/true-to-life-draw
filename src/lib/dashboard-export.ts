import { formatDate } from "./kanban-types";
import type { Card, Track, Column } from "./kanban-types";

export function exportToCSV(rows: Card[], tracks: Track[], columns: Column[]) {
  const headers = ["Title", "Track", "Status", "Priority", "Deadline", "Updated"];
  const csvData = [
    headers.join(","),
    ...rows.map((c) => {
      const track = tracks.find((t) => t.id === c.track)?.name ?? "";
      const col = columns.find((x) => x.id === c.col)?.name ?? "";
      return [
        c.title,
        track,
        col,
        c.prio,
        formatDate(c.date),
        new Date(c.updated_at).toLocaleDateString("pt-BR"),
      ]
        .map((v) => `"${v}"`)
        .join(",");
    }),
  ].join("\n");

  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `molas-export-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

export function exportToPDF(rows: Card[], tracks: Track[], columns: Column[]) {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;

  const lines: string[] = [
    `MOLAS - Kanban Board Export - ${new Date().toLocaleDateString("pt-BR")}\n\n`,
  ];
  rows.forEach((c) => {
    const track = tracks.find((t) => t.id === c.track)?.name ?? "";
    const col = columns.find((x) => x.id === c.col)?.name ?? "";
    lines.push(`${c.title} | ${track} | ${col} | ${c.prio} | ${formatDate(c.date)}\n`);
  });

  const content = lines.join("");
  let pdf = "%PDF-1.4\n";
  pdf += "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n";
  pdf += "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n";
  pdf += `3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${pageWidth} ${pageHeight}]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n`;
  pdf += `4 0 obj<</Length ${content.length + 50}>>stream\nBT\n/F1 10 Tf\n${margin} ${pageHeight - margin} Td\n(${content.replace(/\n/g, ")Tj\nT*\n(")})Tj\nET\nendstream\nendobj\n`;
  pdf += "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n";
  pdf += "xref\n0 6\n";
  pdf += "0000000000 65535 f\n";
  pdf += "0000000009 00000 n\n";
  pdf += "0000000058 00000 n\n";
  pdf += "0000000115 00000 n\n";
  pdf += "0000000273 00000 n\n";
  pdf += `000000${String(content.length + 600).padStart(6, "0")} 00000 n\n`;
  pdf += "trailer<</Size 6/Root 1 0 R>>\nstartxref\n";
  pdf += `${pdf.length}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `molas-export-${new Date().toISOString().split("T")[0]}.pdf`;
  link.click();
}
