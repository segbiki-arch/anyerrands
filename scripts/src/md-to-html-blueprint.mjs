import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("deliverables/AnyErrands-Blueprint.md", "utf8");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

const lines = src.split("\n");
let html = "";
let i = 0;

const flushTable = (rows) => {
  const cells = (r) => r.split("|").slice(1, -1).map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  let t = "<table><thead><tr>";
  head.forEach((h) => (t += `<th>${inline(h)}</th>`));
  t += "</tr></thead><tbody>";
  body.forEach((r) => {
    t += "<tr>";
    r.forEach((c) => (t += `<td>${inline(c)}</td>`));
    t += "</tr>";
  });
  return t + "</tbody></table>";
};

while (i < lines.length) {
  let line = lines[i];

  if (/^\s*$/.test(line)) { i++; continue; }

  if (line.startsWith("> ")) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith(">")) {
      buf.push(lines[i].replace(/^>\s?/, ""));
      i++;
    }
    html += `<blockquote>${inline(buf.join(" ").trim())}</blockquote>`;
    continue;
  }

  if (/^\|.*\|/.test(line)) {
    const rows = [];
    while (i < lines.length && /^\|.*\|/.test(lines[i])) {
      rows.push(lines[i]);
      i++;
    }
    html += flushTable(rows);
    continue;
  }

  const h = line.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const lvl = h[1].length;
    html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
    i++;
    continue;
  }

  if (/^(---|\*\*\*)\s*$/.test(line)) { html += "<hr/>"; i++; continue; }

  if (/^\s*[-*]\s+/.test(line)) {
    let list = "<ul>";
    while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
      let item = lines[i].replace(/^\s*[-*]\s+/, "");
      item = item.replace(/^\[ \]\s/, "&#9744; ").replace(/^\[[xX]\]\s/, "&#9745; ");
      list += `<li>${inline(item)}</li>`;
      i++;
    }
    html += list + "</ul>";
    continue;
  }

  if (/^\s*\d+\.\s+/.test(line)) {
    let list = "<ol>";
    while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
      list += `<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`;
      i++;
    }
    html += list + "</ol>";
    continue;
  }

  const buf = [line];
  i++;
  while (i < lines.length && !/^\s*$/.test(lines[i]) &&
         !/^(#{1,4})\s/.test(lines[i]) && !/^\|.*\|/.test(lines[i]) &&
         !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) &&
         !/^>/.test(lines[i]) && !/^(---|\*\*\*)\s*$/.test(lines[i])) {
    buf.push(lines[i]);
    i++;
  }
  html += `<p>${inline(buf.join(" "))}</p>`;
}

const doc = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AnyErrands — Project Blueprint</title>
<style>
  :root { --yellow:#F5C400; --ink:#141414; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink); line-height: 1.6; max-width: 820px; margin: 0 auto; padding: 56px 40px 80px; }
  h1 { font-size: 30px; border-bottom: 5px solid var(--yellow); padding-bottom: 12px; margin-bottom: 4px; }
  h2 { font-size: 21px; margin-top: 38px; border-bottom: 1px solid #e4e4e4; padding-bottom: 6px; }
  h3 { font-size: 16px; margin-top: 24px; }
  h4 { font-size: 14px; margin-top: 18px; color:#444; }
  p, li { font-size: 14px; }
  a { color: #9a7b00; }
  code { background:#f4f4f4; padding:1px 5px; border-radius:4px; font-size: 13px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
  blockquote { background:#fffbe6; border-left:4px solid var(--yellow); margin:18px 0; padding:12px 18px; font-size:13.5px; color:#3a3a3a; }
  table { border-collapse: collapse; width:100%; margin:16px 0; font-size:13px; }
  th, td { border:1px solid #e0e0e0; padding:8px 10px; text-align:left; vertical-align:top; }
  th { background: var(--yellow); color: var(--ink); font-weight:700; }
  tr:nth-child(even) td { background:#fafafa; }
  hr { border:0; border-top:1px solid #eaeaea; margin:34px 0; }
  ul, ol { padding-left: 22px; }
  li { margin: 3px 0; }
  @media print { body { padding: 0 12px; } h2 { page-break-after: avoid; } table, blockquote { page-break-inside: avoid; } }
</style></head>
<body>
${html}
</body></html>`;

writeFileSync("deliverables/AnyErrands-Blueprint.html", doc);
console.log("Wrote deliverables/AnyErrands-Blueprint.html (" + doc.length + " bytes)");
