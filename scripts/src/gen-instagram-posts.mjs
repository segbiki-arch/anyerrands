// Generates three 1080x1080 branded Instagram post images for AnyErrands.
// Renders SVG -> PNG via ImageMagick (librsvg delegate).
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../deliverables/instagram");
mkdirSync(OUT, { recursive: true });

const YELLOW = "#F5C400";
const BLACK = "#0D0D0D";
const WHITE = "#FFFFFF";
const SANS = "DejaVu Sans";

// AnyErrands icon mark (yellow rounded square + running helper figure).
function logoMark(x, y, size) {
  const sc = size / 80;
  return `<g transform="translate(${x},${y}) scale(${sc})">
    <rect width="80" height="80" rx="20" fill="${YELLOW}"/>
    <circle cx="40" cy="22" r="8" fill="${BLACK}"/>
    <path d="M28 44 C28 36 34 33 40 33 C46 33 52 36 52 44" stroke="${BLACK}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M33 44 L28 58" stroke="${BLACK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M47 44 L54 56" stroke="${BLACK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M33 38 L24 48" stroke="${BLACK}" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M47 38 L57 44" stroke="${BLACK}" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="17" y="46" width="10" height="9" rx="2" fill="${BLACK}"/>
    <line x1="14" y1="30" x2="20" y2="30" stroke="${BLACK}" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
    <line x1="12" y1="37" x2="19" y2="37" stroke="${BLACK}" stroke-width="3" stroke-linecap="round" opacity="0.35"/>
    <line x1="14" y1="44" x2="20" y2="44" stroke="${BLACK}" stroke-width="3" stroke-linecap="round" opacity="0.2"/>
  </g>`;
}

function header() {
  // Logo mark + wordmark, top-left
  return `${logoMark(80, 70, 60)}
    <text x="156" y="116" font-family="${SANS}" font-weight="bold" font-size="40" letter-spacing="-1">
      <tspan fill="${WHITE}">Any</tspan><tspan fill="${YELLOW}">Errands</tspan>
    </text>`;
}

function eyebrow(label) {
  const w = 40 + label.length * 21;
  return `<g transform="translate(80,250)">
    <rect width="${w}" height="64" rx="32" fill="${YELLOW}"/>
    <text x="${w / 2}" y="42" text-anchor="middle" font-family="${SANS}" font-weight="bold" font-size="30" letter-spacing="2" fill="${BLACK}">${label}</text>
  </g>`;
}

// Big two-line title; second word/phrase highlighted yellow.
function title(line1, line2) {
  return `<text x="80" y="430" font-family="${SANS}" font-weight="bold" font-size="92" letter-spacing="-2" fill="${WHITE}">${line1}</text>
    <text x="80" y="528" font-family="${SANS}" font-weight="bold" font-size="92" letter-spacing="-2" fill="${YELLOW}">${line2}</text>`;
}

function checkRows(rows, startY) {
  let y = startY;
  let out = "";
  for (const r of rows) {
    out += `<g transform="translate(80,${y})">
      <circle cx="32" cy="0" r="32" fill="${YELLOW}"/>
      <path d="M21 0 L29 10 L45 -10" stroke="${BLACK}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="88" y="13" font-family="${SANS}" font-size="37" fill="${WHITE}">${r}</text>
    </g>`;
    y += 108;
  }
  return out;
}

function numberedSteps(steps, startY) {
  let y = startY;
  let out = "";
  steps.forEach((s, i) => {
    out += `<g transform="translate(80,${y})">
      <circle cx="34" cy="0" r="34" fill="${YELLOW}"/>
      <text x="34" y="14" text-anchor="middle" font-family="${SANS}" font-weight="bold" font-size="40" fill="${BLACK}">${i + 1}</text>
      <text x="92" y="13" font-family="${SANS}" font-size="37" fill="${WHITE}">${s}</text>
    </g>`;
    y += 100;
  });
  return out;
}

function footer(text) {
  return `<g transform="translate(0,982)">
    <rect x="80" y="0" width="920" height="76" rx="38" fill="${YELLOW}"/>
    <text x="540" y="51" text-anchor="middle" font-family="${SANS}" font-weight="bold" font-size="33" fill="${BLACK}">${text}</text>
  </g>`;
}

function bg() {
  // Black background with a soft yellow blob top-right for depth.
  return `<rect width="1080" height="1080" fill="${BLACK}"/>
    <circle cx="1080" cy="0" r="340" fill="${YELLOW}" opacity="0.10"/>
    <circle cx="40" cy="1080" r="260" fill="${YELLOW}" opacity="0.06"/>`;
}

function wrap(svgInner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
${bg()}
${header()}
${svgInner}
</svg>`;
}

const posts = {
  "1-what-is-anyerrands": wrap(`
    ${eyebrow("WELCOME TO")}
    ${title("What is", "AnyErrands?")}
    <text x="80" y="610" font-family="${SANS}" font-size="40" fill="#CFCFCF">Your community marketplace for</text>
    <text x="80" y="662" font-family="${SANS}" font-size="40" fill="#CFCFCF">everyday errands &amp; lifts.</text>
    ${checkRows([
      "Errands run — shopping, jobs &amp; more",
      "Lifts given — a ride when you need one",
      "By trusted neighbours, Nenagh &amp; surrounds",
    ], 720)}
    ${footer("anyerrands.live")}
  `),

  "2-how-to-earn-money": wrap(`
    ${eyebrow("EARN MONEY")}
    ${title("Get paid to", "help out")}
    ${numberedSteps([
      "Set up your free Helper profile",
      "Accept errands &amp; lifts near you",
      "Get the job done for a neighbour",
      "Get paid securely once it's complete",
    ], 620)}
    ${footer("Become a Helper · anyerrands.live")}
  `),

  "3-how-posting-works": wrap(`
    ${eyebrow("NEED A HAND?")}
    ${title("Posting a task", "is easy")}
    ${numberedSteps([
      "Post your errand or lift in seconds",
      "A trusted local helper accepts it",
      "They get it done — you stay updated",
      "Pay securely through the app",
    ], 620)}
    ${footer("Post yours · anyerrands.live")}
  `),
};

for (const [name, svg] of Object.entries(posts)) {
  const svgPath = join(OUT, `${name}.svg`);
  const pngPath = join(OUT, `${name}.png`);
  writeFileSync(svgPath, svg);
  execFileSync("magick", ["-background", "none", svgPath, pngPath], { stdio: "inherit" });
  console.log("wrote", pngPath);
}
console.log("Done. Output in", OUT);
