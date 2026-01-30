export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function toCSV(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");
}

export function parseCSV(text: string) {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      current.push(value.trim());
      value = "";
      if (char !== ",") {
        if (current.some((cell) => cell.length > 0)) {
          rows.push(current);
        }
        current = [];
      }
      continue;
    }

    value += char;
  }

  if (value.length > 0 || current.length > 0) {
    current.push(value.trim());
    if (current.some((cell) => cell.length > 0)) {
      rows.push(current);
    }
  }

  return rows;
}
