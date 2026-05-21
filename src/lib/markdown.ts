export function renderMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener" class="text-blue-500 hover:underline">$1</a>',
    );

  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        inList = true;
        result.push('<ul class="ml-4 list-disc my-1">');
      }
      result.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) {
        inList = false;
        result.push("</ul>");
      }
      result.push(trimmed === "" ? "<br>" : `${line}<br>`);
    }
  }
  if (inList) result.push("</ul>");

  let joined = result.join("");
  joined = joined.replace(/(<br>)+$/, "");
  return joined;
}
