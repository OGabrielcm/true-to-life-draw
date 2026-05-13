export function renderMarkdown(text: string): string {
  if (!text) return "";

  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(
    /\[(.+?)\]\((.+?)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-blue-500 hover:underline">$1</a>',
  );

  const lines = html.split("\n");
  let inList = false;
  const processed = lines
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ")) {
        const item = trimmed.substring(2);
        if (!inList) {
          inList = true;
          return `<ul class="ml-4 list-disc"><li>${item}</li>`;
        }
        return `<li>${item}</li>`;
      }
      if (inList && trimmed !== "") {
        inList = false;
        return `</ul>\n${trimmed}`;
      }
      if (inList && trimmed === "") {
        return "";
      }
      return trimmed ? line : "";
    })
    .join("\n");

  return inList ? processed + "</ul>" : processed;
}
