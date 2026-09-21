/**
 * Generate circular PUBG-style frame PNGs + upload to market + static /frames/{code}.png
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { execSync } = require("child_process");

const OUT = path.join(__dirname, "frames_out");
fs.mkdirSync(OUT, { recursive: true });

const FRAMES = [
  { code: "frame_minimal", title: "Minimal Ramka", price: 1000, colors: ["#E0E0E0", "#9E9E9E", "#FFFFFF"], premium: false },
  { code: "frame_pixel", title: "Pixel Ramka", price: 1500, colors: ["#69F0AE", "#00C853", "#B9F6CA"], premium: false, pixel: true },
  { code: "b2", title: "B2 Ramka", price: 2000, colors: ["#90CAF9", "#1976D2", "#E3F2FD"], premium: false },
  { code: "frame_tech", title: "Tech Ramka", price: 2000, colors: ["#80DEEA", "#00ACC1", "#E0F7FA"], premium: false },
  { code: "frame_sport", title: "Sport Ramka", price: 2500, colors: ["#FF8A65", "#E64A19", "#FFCCBC"], premium: false },
  { code: "frame_neon", title: "Neon Ramka", price: 3000, colors: ["#E040FB", "#AA00FF", "#F3E5F5"], premium: false },
  { code: "frame_pulse", title: "Pulse Ramka", price: 3500, colors: ["#B388FF", "#7C4DFF", "#EDE7F6"], premium: false },
  { code: "b3", title: "B3 Ramka", price: 4000, colors: ["#FFD54F", "#FF8F00", "#FFF8E1"], premium: false },
  { code: "frame_ice", title: "Muzli Ramka", price: 4500, colors: ["#A8E8FF", "#4FC3F7", "#1565C0"], premium: true, ice: true },
  { code: "frame_gold", title: "Oltin Ramka", price: 5000, colors: ["#FFE082", "#F5C542", "#B8860B"], premium: true, gold: true },
];

function svgFor(f) {
  const [c1, c2, c3] = f.colors;
  const shards = f.ice || f.gold
    ? `
    <g fill="url(#ring)" stroke="${c3}" stroke-width="1" opacity="0.95">
      <path d="M256 46 L268 82 L256 74 L244 82 Z"/>
      <path d="M392 90 L400 122 L380 112 L378 132 Z"/>
      <path d="M466 256 L430 244 L438 256 L430 268 Z"/>
      <path d="M392 422 L378 392 L398 402 L400 382 Z"/>
      <path d="M256 466 L244 430 L256 438 L268 430 Z"/>
      <path d="M120 422 L100 392 L120 402 L124 382 Z"/>
      <path d="M46 256 L82 244 L74 256 L82 268 Z"/>
      <path d="M120 90 L100 122 L120 112 L124 132 Z"/>
    </g>`
    : "";
  const pixel = f.pixel
    ? `<g fill="${c1}" opacity="0.85">
        <rect x="236" y="52" width="16" height="16"/><rect x="252" y="52" width="16" height="16"/>
        <rect x="420" y="236" width="16" height="16"/><rect x="420" y="252" width="16" height="16"/>
        <rect x="236" y="444" width="16" height="16"/><rect x="252" y="444" width="16" height="16"/>
        <rect x="76" y="236" width="16" height="16"/><rect x="76" y="252" width="16" height="16"/>
      </g>`
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="ring" x1="70" y1="70" x2="442" y2="442" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c3}"/>
      <stop offset="35%" stop-color="${c1}"/>
      <stop offset="70%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
    <filter id="glow"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${c1}" flood-opacity="0.7"/></filter>
  </defs>
  <rect width="512" height="512" fill="#05070B"/>
  <circle cx="256" cy="256" r="210" fill="${c2}" opacity="0.12"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="url(#ring)" stroke-width="34" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="${c3}" stroke-width="8" opacity="0.55"/>
  <circle cx="256" cy="256" r="166" fill="none" stroke="${c1}" stroke-width="2" opacity="0.5"/>
  <circle cx="256" cy="256" r="148" fill="#0A0C10"/>
  <circle cx="256" cy="256" r="142" fill="none" stroke="${c1}" stroke-width="1" opacity="0.25"/>
  <path d="M168 150 A130 130 0 0 1 344 150" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.28"/>
  ${shards}
  ${pixel}
</svg>`;
}

async function main() {
  for (const f of FRAMES) {
    const svg = svgFor(f);
    const svgPath = path.join(OUT, f.code + ".svg");
    const pngPath = path.join(OUT, f.code + ".png");
    fs.writeFileSync(svgPath, svg);
    await sharp(Buffer.from(svg)).png().resize(512, 512).toFile(pngPath);
    console.log("made", f.code, fs.statSync(pngPath).size);
  }
  console.log("ALL_OK", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
