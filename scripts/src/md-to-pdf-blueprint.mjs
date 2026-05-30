import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PDFDocument = require("pdfkit");

const YELLOW = "#F5C400";
const INK = "#141414";
const GREY = "#666666";
const LIGHT = "#fafafa";
const BORDER = "#e0e0e0";

const src = readFileSync("deliverables/AnyErrands-Blueprint.md", "utf8");
const lines = src.split("\n");

const doc = new PDFDocument({ size: "A4", margins: { top: 56, bottom: 56, left: 56, right: 56 } });
doc.pipe(require("node:fs").createWriteStream("deliverables/AnyErrands-Blueprint.pdf"));

const PAGE_W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const LEFT = doc.page.margins.left;

const FONT = "Helvetica";
const BOLD = "Helvetica-Bold";
const MONO = "Courier";

// Strip inline markdown to plain text (pdfkit text segments handled separately)
const segments = (s) => {
  // returns array of {text, bold, code, link}
  const out = [];
  let rest = s;
  const re = /(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\))/;
  let m;
  while ((m = re.exec(rest))) {
    if (m.index > 0) out.push({ text: rest.slice(0, m.index) });
    if (m[2] !== undefined) out.push({ text: m[2], bold: true });
    else if (m[3] !== undefined) out.push({ text: m[3], code: true });
    else if (m[4] !== undefined) out.push({ text: m[4], link: m[5] });
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) out.push({ text: rest });
  return out;
};

const ensure = (h) => {
  if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage();
};

const writeRich = (s, opts = {}) => {
  const size = opts.size || 10.5;
  const color = opts.color || INK;
  const segs = segments(s);
  segs.forEach((seg, idx) => {
    doc.font(seg.bold ? BOLD : seg.code ? MONO : FONT)
      .fontSize(seg.code ? size - 0.5 : size)
      .fillColor(seg.link ? "#9a7b00" : color);
    const last = idx === segs.length - 1;
    doc.text(seg.text, { continued: !last, link: seg.link, underline: !!seg.link });
  });
};

let i = 0;
const flushTable = (rows) => {
  const cells = (r) => r.split("|").slice(1, -1).map((c) => c.trim());
  const header = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  const cols = header.length;
  const colW = PAGE_W / cols;
  const pad = 5;

  const rowHeight = (vals, bold) => {
    let max = 0;
    vals.forEach((v) => {
      doc.font(bold ? BOLD : FONT).fontSize(8.5);
      const h = doc.heightOfString(v.replace(/\*\*/g, "").replace(/`/g, ""), { width: colW - pad * 2 });
      if (h > max) max = h;
    });
    return max + pad * 2;
  };

  const drawRow = (vals, { bold = false, fill = null } = {}) => {
    const h = rowHeight(vals, bold);
    ensure(h);
    const y0 = doc.y;
    if (fill) doc.rect(LEFT, y0, PAGE_W, h).fill(fill);
    vals.forEach((v, c) => {
      const x = LEFT + c * colW;
      doc.rect(x, y0, colW, h).strokeColor(BORDER).lineWidth(0.5).stroke();
      doc.font(bold ? BOLD : FONT).fontSize(8.5).fillColor(INK);
      doc.text(v.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1"),
        x + pad, y0 + pad, { width: colW - pad * 2 });
    });
    doc.y = y0 + h;
  };

  doc.moveDown(0.3);
  drawRow(header, { bold: true, fill: YELLOW });
  body.forEach((r, idx) => drawRow(r, { fill: idx % 2 ? LIGHT : "#ffffff" }));
  doc.moveDown(0.6);
};

while (i < lines.length) {
  const line = lines[i];

  if (/^\s*$/.test(line)) { i++; continue; }

  // blockquote
  if (line.startsWith(">")) {
    const buf = [];
    while (i < lines.length && lines[i].startsWith(">")) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
    const text = buf.join(" ").trim();
    doc.font(FONT).fontSize(9.5);
    const h = doc.heightOfString(text, { width: PAGE_W - 24 }) + 16;
    ensure(h);
    const y0 = doc.y;
    doc.rect(LEFT, y0, PAGE_W, h).fill("#fffbe6");
    doc.rect(LEFT, y0, 4, h).fill(YELLOW);
    doc.fillColor("#3a3a3a").font(FONT).fontSize(9.5)
      .text(text, LEFT + 14, y0 + 8, { width: PAGE_W - 24 });
    doc.y = y0 + h;
    doc.moveDown(0.5);
    continue;
  }

  // table
  if (/^\|.*\|/.test(line)) {
    const rows = [];
    while (i < lines.length && /^\|.*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
    flushTable(rows);
    continue;
  }

  // headings
  const h = line.match(/^(#{1,4})\s+(.*)$/);
  if (h) {
    const lvl = h[1].length;
    const sizes = { 1: 22, 2: 15, 3: 12, 4: 10.5 };
    doc.moveDown(lvl === 1 ? 0 : lvl === 2 ? 0.8 : 0.4);
    ensure(40);
    doc.font(BOLD).fontSize(sizes[lvl]).fillColor(lvl >= 4 ? GREY : INK);
    doc.text(h[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/`(.+?)`/g, "$1"), { width: PAGE_W });
    if (lvl === 1) {
      doc.moveTo(LEFT, doc.y + 3).lineTo(LEFT + PAGE_W, doc.y + 3).lineWidth(3).strokeColor(YELLOW).stroke();
      doc.moveDown(0.5);
    } else if (lvl === 2) {
      doc.moveTo(LEFT, doc.y + 2).lineTo(LEFT + PAGE_W, doc.y + 2).lineWidth(0.5).strokeColor(BORDER).stroke();
      doc.moveDown(0.4);
    } else {
      doc.moveDown(0.2);
    }
    i++;
    continue;
  }

  // hr
  if (/^(---|\*\*\*)\s*$/.test(line)) {
    doc.moveDown(0.4); ensure(12);
    doc.moveTo(LEFT, doc.y).lineTo(LEFT + PAGE_W, doc.y).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc.moveDown(0.6);
    i++;
    continue;
  }

  // unordered / checklist
  if (/^\s*[-*]\s+/.test(line)) {
    while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
      let item = lines[i].replace(/^\s*[-*]\s+/, "");
      let bullet = "•";
      if (/^\[ \]\s/.test(item)) { bullet = "☐"; item = item.replace(/^\[ \]\s/, ""); }
      else if (/^\[[xX]\]\s/.test(item)) { bullet = "☑"; item = item.replace(/^\[[xX]\]\s/, ""); }
      doc.font(FONT).fontSize(10.5);
      const ih = doc.heightOfString(item.replace(/\*\*/g, "").replace(/`/g, ""), { width: PAGE_W - 18 }) + 3;
      ensure(ih);
      const y0 = doc.y;
      doc.fillColor(INK).font(FONT).fontSize(10.5).text(bullet, LEFT, y0, { width: 14 });
      doc.y = y0;
      doc.text("", LEFT + 16, y0);
      writeRich(item, { size: 10.5 });
      doc.moveDown(0.15);
      i++;
    }
    doc.moveDown(0.3);
    continue;
  }

  // ordered
  if (/^\s*\d+\.\s+/.test(line)) {
    let n = 1;
    while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
      const item = lines[i].replace(/^\s*\d+\.\s+/, "");
      doc.font(FONT).fontSize(10.5);
      const ih = doc.heightOfString(item.replace(/\*\*/g, "").replace(/`/g, ""), { width: PAGE_W - 20 }) + 3;
      ensure(ih);
      const y0 = doc.y;
      doc.fillColor(INK).font(BOLD).fontSize(10.5).text(n + ".", LEFT, y0, { width: 18 });
      doc.y = y0;
      doc.text("", LEFT + 20, y0);
      writeRich(item, { size: 10.5 });
      doc.moveDown(0.2);
      i++; n++;
    }
    doc.moveDown(0.3);
    continue;
  }

  // paragraph
  const buf = [line];
  i++;
  while (i < lines.length && !/^\s*$/.test(lines[i]) &&
         !/^(#{1,4})\s/.test(lines[i]) && !/^\|.*\|/.test(lines[i]) &&
         !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) &&
         !/^>/.test(lines[i]) && !/^(---|\*\*\*)\s*$/.test(lines[i])) {
    buf.push(lines[i]); i++;
  }
  ensure(20);
  writeRich(buf.join(" "), { size: 10.5 });
  doc.moveDown(0.5);
}

doc.end();
console.log("Wrote deliverables/AnyErrands-Blueprint.pdf");
