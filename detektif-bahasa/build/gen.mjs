// Generates index.html and compositions/*.html from build/script.json and the
// measured narration lengths in build/vo.json. Run: node build/gen.mjs
import fs from "node:fs";
import path from "node:path";
import { MATERIAL_CSS, material } from "./materials.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const S = JSON.parse(fs.readFileSync(path.join(ROOT, "build/script.json"), "utf8"));
const VO = JSON.parse(fs.readFileSync(path.join(ROOT, "build/vo.json"), "utf8"));
const MUSIC = fs.existsSync(path.join(ROOT, "assets/music/bed.m4a"));
const r2 = (x) => Math.round(x * 100) / 100;
const pad2 = (n) => String(n).padStart(2, "0");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// deterministic PRNG
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const COMMON_CSS = `
#root { position:absolute; inset:0; overflow:hidden; background:#03050b; color:#fff; font-family:'Inter',sans-serif; }
.bg { position:absolute; inset:0; background:radial-gradient(120% 90% at 50% 45%, #0b1630 0%, #060a16 55%, #020308 100%); }
.grid { position:absolute; inset:-60px; background-image:linear-gradient(rgba(30,144,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(30,144,255,.07) 1px, transparent 1px); background-size:60px 60px; }
.dust { position:absolute; border-radius:50%; background:#6cc4ff; }
.wrap { position:absolute; inset:0; }
.persp { position:absolute; inset:0; perspective:1600px; }
.stage { position:absolute; inset:0; }
.scan { position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px); }
.vig { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.75) 100%); }
.corner { position:absolute; width:70px; height:70px; border-color:#1e90ff; border-style:solid; opacity:.85; }
.corner.tl { left:96px; top:54px; border-width:4px 0 0 4px; } .corner.tr { right:96px; top:54px; border-width:4px 4px 0 0; }
.corner.bl { left:96px; bottom:54px; border-width:0 0 4px 4px; } .corner.br { right:96px; bottom:54px; border-width:0 4px 4px 0; }
.gbar { position:absolute; left:0; right:0; opacity:0; mix-blend-mode:screen; }
.mono { font-family:'JetBrains Mono',monospace; }
.alert { position:absolute; inset:0; pointer-events:none; box-shadow:inset 0 0 160px 30px rgba(255,30,50,.75); opacity:0; }
`;

function dust(prefix, n, seed) {
  const r = rng(seed);
  let html = "";
  const tw = [];
  for (let i = 0; i < n; i++) {
    const s = 2 + Math.round(r() * 4);
    html += `<div id="${prefix}-d${i}" class="dust" style="left:${Math.round(r() * 1920)}px;top:${Math.round(r() * 1080)}px;width:${s}px;height:${s}px;opacity:${(0.15 + r() * 0.45).toFixed(2)}"></div>`;
    tw.push([`#${prefix}-d${i}`, Math.round(-40 - r() * 120), Math.round(-30 + r() * 60)]);
  }
  return { html, tw };
}

const chrome = (p) => `<div class="scan"></div><div class="vig"></div>
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div id="${p}-alert" class="alert"></div>
  <div id="${p}-g1" class="gbar" style="top:180px;height:70px;background:#00b4ff"></div>
  <div id="${p}-g2" class="gbar" style="top:520px;height:40px;background:#ff2d3d"></div>
  <div id="${p}-g3" class="gbar" style="top:800px;height:110px;background:#7df9ff"></div>`;

// glitch in at t, glitch out ending just before end
const glitchIn = (p, t = 0) => `
tl.fromTo("#${p}-wrap", {opacity:0, x:-60, skewX:-12}, {opacity:1, x:0, skewX:0, duration:0.45, ease:"steps(6)"}, ${t});
tl.fromTo("#${p}-g1", {opacity:0, x:-300}, {opacity:0.9, x:200, duration:0.12, ease:"none", yoyo:true, repeat:3}, ${t});
tl.fromTo("#${p}-g2", {opacity:0, x:300}, {opacity:0.8, x:-160, duration:0.1, ease:"none", yoyo:true, repeat:3}, ${t + 0.08});
tl.fromTo("#${p}-g3", {opacity:0, x:-200}, {opacity:0.6, x:120, duration:0.09, ease:"none", yoyo:true, repeat:3}, ${t + 0.04});`;
const glitchOut = (p, end) => `
tl.to("#${p}-wrap", {opacity:0, x:80, skewX:14, duration:0.4, ease:"steps(5)"}, ${r2(end - 0.48)});
tl.to("#${p}-g1", {opacity:0.9, x:-240, duration:0.08, ease:"none", yoyo:true, repeat:3}, ${r2(end - 0.44)});
tl.to("#${p}-g3", {opacity:0.7, x:180, duration:0.08, ease:"none", yoyo:true, repeat:3}, ${r2(end - 0.4)});`;

function sceneFile(id, css, body, script, dur) {
  return `<template>
  <style>${COMMON_CSS}${css}</style>
  <div id="root" data-composition-id="${id}" data-width="1920" data-height="1080" data-layout-allow-overlap data-layout-allow-overflow>
${body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${script}
    tl.set({}, {}, ${r2(dur)});
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

// ---------------- audio cue list (absolute times) ----------------
const cues = [];
const vo = (id, t) => cues.push({ id: `vo-${id}`, src: `assets/vo/${id}.wav`, t, d: VO[id], vol: 1, kind: "vo" });
const SFXD = {
  "chime": 2.54, "click": 0.37, "error": 1.62, "glitch-1": 2.64, "glitch-2": 3.5, "glitch-3": 3.1, "impact-bass-1": 2.12,
  "impact-bass-2": 2.59, "key-press": 0.43, "notification": 2.46, "ping": 1.32, "pop": 0.72, "riser": 10.03, "sparkle": 1.8,
  "typing": 1.54, "whoosh-cinematic": 5.54, "whoosh-short": 0.57, "whoosh": 0.57, "radio-static": 2.43,
};
let sfxN = 0;
const sfx = (name, t, vol) => cues.push({ id: `sfx-${++sfxN}-${name}`, src: `assets/sfx/${name}.mp3`, t, d: SFXD[name], vol, kind: "sfx" });

// =================================================================
// INTRO
// =================================================================
function buildIntro(T0) {
  const p = "in";
  const d = (k) => VO[k];
  const tI1 = 1.5;
  const tTitle = r2(tI1 + d("i1") + 0.35);
  const tI2 = r2(tTitle + 1.6);
  const tI3 = r2(tI2 + d("i2") + 0.5);
  const tI4 = r2(tI3 + d("i3") + 0.5);
  let tI5 = r2(tI4 + d("i4") + 0.7);
  let tI6 = r2(tI5 + d("i5") + 0.6);
  let end = r2(tI6 + d("i6") + 2.0);
  const extra = Math.max(0, 30 - end);
  tI5 = r2(tI5 + extra * 0.6);
  tI6 = r2(tI6 + extra * 0.6);
  end = r2(Math.max(30, end));

  const cards = [
    { x: 120, y: 120, w: 420, t: "MAJALAH", s: ["Saya bertemu dengan ", "ali", "..."], r: -4 },
    { x: 640, y: 80, w: 460, t: "SURAT RASMI", s: ["Mereka ", "memperolehi", " hadiah..."], r: 3 },
    { x: 1220, y: 140, w: 420, t: "PAPAN TANDA", s: ["Adik belajar ", "disekolah", "."], r: -2 },
    { x: 1760, y: 90, w: 440, t: "POSTER", s: ["...ini ", "adalah untuk", " membantu..."], r: 4 },
    { x: 200, y: 600, w: 440, t: "RISALAH", s: ["Ayah membeli ", "sebuah", " pisang."], r: 3 },
    { x: 780, y: 640, w: 420, t: "KOMIK", s: ["...saling ", "tolong-menolong", "..."], r: -3 },
    { x: 1330, y: 600, w: 460, t: "AKHBAR", s: ["Walaupun... ", "tetapi", "..."], r: 2 },
    { x: 1880, y: 640, w: 380, t: "PENGUMUMAN", s: ["Dia ", "bukan", " rajin."], r: -4 },
  ];
  const pins = cards.map((c) => [c.x + c.w / 2, c.y + 14]);
  const links = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [1, 5], [2, 6], [3, 7]];
  const cardHtml = cards
    .map(
      (c, i) => `<div id="in-card${i}" class="ecard" style="left:${c.x}px;top:${c.y}px;width:${c.w}px">
      <div class="pin"></div><div class="et mono" data-layout-ignore>BUKTI ${pad2(i + 1)} · ${c.t}</div>
      <div class="es">${esc(c.s[0])}<span class="ew">${esc(c.s[1])}<svg viewBox="0 0 100 40" preserveAspectRatio="none"><ellipse id="in-ring${i}" cx="50" cy="20" rx="48" ry="18" pathLength="1"/></svg></span>${esc(c.s[2])}</div>
      <div class="lines"><i style="width:92%"></i><i style="width:76%"></i><i style="width:84%"></i></div></div>`,
    )
    .join("");
  const linkSvg = `<svg class="strings" width="2400" height="1100">${links
    .map(([a, b], i) => `<line id="in-str${i}" x1="${pins[a][0]}" y1="${pins[a][1]}" x2="${pins[b][0]}" y2="${pins[b][1]}" pathLength="1"/>`)
    .join("")}</svg>`;
  const bars = Array.from({ length: 28 }, (_, i) => `<i id="in-wv${i}"></i>`).join("");
  const dz = dust(p, 40, 11);

  const css = `
.board { position:absolute; left:-200px; top:-10px; width:2400px; height:1100px; }
.cork { position:absolute; inset:0; background:#2a1d14; background-image:radial-gradient(rgba(0,0,0,.35) 1.5px,transparent 2px), radial-gradient(rgba(255,200,150,.06) 1.5px,transparent 2px); background-size:16px 16px, 22px 22px; }
.strings line { stroke:#ff2d3d; stroke-width:3; stroke-dasharray:1; stroke-dashoffset:1; filter:drop-shadow(0 0 6px rgba(255,45,61,.8)); }
.ecard { position:absolute; background:#f3eee2; padding:34px 26px 22px; box-shadow:0 20px 40px rgba(0,0,0,.6); }
.ecard .pin { position:absolute; left:50%; top:-6px; width:30px; height:30px; margin-left:-15px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#ff8a8a,#d00000 60%,#600); }
.ecard .et { font-size:18px; color:#7a6a55; letter-spacing:.08em; margin-bottom:10px; }
.ecard .es { font:800 32px/1.25 'Inter'; color:#1a1a1a; }
.ecard .ew { position:relative; color:#c1121f; }
.ecard .ew svg { position:absolute; left:-14px; right:-14px; top:-10px; bottom:-10px; width:calc(100% + 28px); height:calc(100% + 20px); overflow:visible; }
.ecard .ew ellipse { fill:none; stroke:#ff2d3d; stroke-width:4; vector-effect:non-scaling-stroke; stroke-dasharray:1; stroke-dashoffset:1; }
.ecard .lines { margin-top:16px; } .ecard .lines i { display:block; height:9px; background:#d9d0bd; border-radius:5px; margin-bottom:10px; }
.dark { position:absolute; inset:0; background:#000; }
.lamp { position:absolute; inset:0; background:radial-gradient(60% 55% at 50% 40%, rgba(120,180,255,.10), transparent 70%); }
.tx { position:absolute; left:192px; top:108px; background:rgba(3,5,11,.82); padding:10px 16px; border-radius:8px; }
.tx .l1 { font:700 26px 'JetBrains Mono'; color:#00b4ff; letter-spacing:.16em; }
.tx .wave { display:flex; gap:6px; align-items:center; height:60px; margin-top:12px; }
.tx .wave i { display:block; width:8px; height:56px; background:#00b4ff; border-radius:3px; }
.rec { background:rgba(3,5,11,.82); padding:10px 16px; border-radius:8px; position:absolute; right:192px; top:108px; font:700 26px 'JetBrains Mono'; color:#ff2d3d; letter-spacing:.14em; }
.rec b { display:inline-block; width:16px; height:16px; border-radius:50%; background:#ff2d3d; margin-right:12px; }
.amaran { position:absolute; left:0; right:0; top:440px; height:200px; background:rgba(120,0,10,.82); border-top:4px solid #ff2d3d; border-bottom:4px solid #ff2d3d; text-align:center; }
.amaran .a1 { margin-top:28px; font:700 30px 'JetBrains Mono'; color:#ffb3b9; letter-spacing:.5em; }
.amaran .a2 { margin-top:10px; font:700 64px 'Oswald'; color:#fff; letter-spacing:.04em; }
.hazard { position:absolute; left:0; right:0; height:22px; background:repeating-linear-gradient(-45deg,#ff2d3d 0 26px,#1a0003 26px 52px); }
.title { position:absolute; left:0; right:0; top:330px; text-align:center; }
.title .t0 { font:700 30px 'JetBrains Mono'; color:#00b4ff; letter-spacing:.6em; }
.title .t1 { white-space:nowrap; font-family:'Archivo Black'; font-size:124px; line-height:1.02; color:#fff; text-shadow:0 0 30px rgba(30,144,255,.85), 0 0 80px rgba(30,144,255,.45); margin-top:14px; }
.title .t1 span { display:inline-block; }
.title .t2 { font:700 62px 'Oswald'; color:#00b4ff; letter-spacing:.32em; margin-top:16px; }
.title .uline { width:900px; height:6px; margin:22px auto 0; background:linear-gradient(90deg,transparent,#ff2d3d,transparent); }
.steps { position:absolute; left:0; right:0; top:820px; display:flex; justify-content:center; gap:40px; }
.chip { background:rgba(6,20,45,.9); border:3px solid #1e90ff; border-radius:12px; padding:14px 30px; font:700 36px 'Oswald'; letter-spacing:.08em; color:#fff; }
.chip b { color:#00b4ff; font-family:'JetBrains Mono'; margin-right:16px; }
.ready { position:absolute; left:0; right:0; top:420px; text-align:center; font-family:'Archivo Black'; font-size:130px; color:#fff; }
.ready span { color:#00b4ff; }
.flash { position:absolute; inset:0; background:#bfe6ff; opacity:0; }
.sweep { position:absolute; top:-100px; bottom:-100px; width:16px; left:0; background:#ff2d3d; box-shadow:0 0 40px 14px rgba(255,45,61,.7); opacity:0; }
`;
  const titleWord = (w, pre) => w.split("").map((ch, i) => `<span id="${pre}${i}">${ch}</span>`).join("");
  const body = `
    <div class="bg"></div>
    <div id="in-wrap" class="wrap">
      <div class="persp"><div id="in-board" class="board" data-layout-ignore><div class="cork"></div>${linkSvg}${cardHtml}</div></div>
      <div class="lamp"></div>
      ${dz.html}
      <div id="in-dark" class="dark"></div>
      <div id="in-tx" class="tx"><div class="l1">TRANSMISI SULIT · SALURAN 07</div><div class="wave">${bars}</div></div>
      <div id="in-rec" class="rec"><b></b>REKOD · MARKAS DETEKTIF</div>
      <div id="in-amaran" class="amaran"><div class="hazard" style="top:-26px"></div><div class="a1">AMARAN</div>
        <div class="a2">BEBERAPA KESALAHAN BAHASA TELAH DIKESAN!</div><div class="hazard" style="bottom:-26px"></div></div>
      <div id="in-title" class="title"><div id="in-t0" class="t0">MISI RAHSIA · TAHUN 6</div>
        <div class="t1">${titleWord("MISI", "in-ta")} ${titleWord("DETEKTIF", "in-tb")} ${titleWord("BAHASA", "in-tc")}</div>
        <div id="in-t2" class="t2">OPERASI BANCI KESALAHAN</div><div id="in-ul" class="uline"></div></div>
      <div id="in-sweep" class="sweep"></div>
      <div class="steps"><div id="in-s1" class="chip"><b>01</b>KENAL PASTI</div><div id="in-s2" class="chip"><b>02</b>KLASIFIKASI</div><div id="in-s3" class="chip"><b>03</b>BETULKAN</div></div>
      <div id="in-ready" class="ready">OPERASI <span>BERMULA!</span></div>
      <div id="in-flash" class="flash"></div>
    </div>
    ${chrome(p)}`;

  const rr = rng(5);
  let s = "";
  // light flicker on
  s += `tl.fromTo("#in-dark", {opacity:1}, {keyframes:{opacity:[1,0.6,1,0.3,0.9,0.4,1,0.25]}, duration:1.1, ease:"none"}, 0.2);\n`;
  s += `tl.to("#in-dark", {opacity:0.2, duration:0.2}, 1.3);\n`;
  // board camera: slow push and pan for the whole scene
  s += `tl.fromTo("#in-board", {x:120, y:30, scale:1.08, rotationX:10, rotationY:-6}, {x:-220, y:-10, scale:0.9, rotationX:4, rotationY:4, duration:${r2(end)}, ease:"sine.inOut"}, 0);\n`;
  // strings draw
  links.forEach((_, i) => (s += `tl.fromTo("#in-str${i}", {strokeDashoffset:1}, {strokeDashoffset:0, duration:0.9, ease:"power2.inOut"}, ${r2(0.5 + i * 0.22)});\n`));
  // radio transmission
  s += `tl.fromTo("#in-tx", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.4, ease:"power3.out"}, 0.3);\n`;
  s += `tl.fromTo("#in-rec", {opacity:0}, {opacity:1, duration:0.3, ease:"steps(3)"}, 0.5);\n`;
  for (let i = 0; i < 28; i++) {
    const kf = Array.from({ length: Math.ceil(end / 0.18) }, () => +(0.12 + rr() * 0.88).toFixed(2));
    s += `tl.fromTo("#in-wv${i}", {scaleY:0.1}, {keyframes:{scaleY:${JSON.stringify(kf)}}, duration:${r2(end)}, ease:"none"}, 0);\n`;
  }
  // AMARAN
  const aEnd = r2(tTitle - 0.05);
  s += `tl.fromTo("#in-amaran", {opacity:0, scaleY:0}, {opacity:1, scaleY:1, duration:0.25, ease:"power4.out"}, 0.9);\n`;
  s += `tl.fromTo("#in-amaran .a1, #in-amaran .hazard", {opacity:1}, {keyframes:{opacity:[1,0.2,1,0.2,1,0.2,1,0.2,1]}, duration:${r2(aEnd - 1.4)}, ease:"none"}, 1.2);\n`;
  s += `tl.to("#in-amaran", {opacity:0, scaleY:0, duration:0.2, ease:"power2.in"}, ${r2(aEnd - 0.2)});\n`;
  s += `tl.fromTo("#in-alert", {opacity:0}, {keyframes:{opacity:[0,1,0.2,1,0.2,0.8,0]}, duration:${r2(aEnd - 0.9)}, ease:"none"}, 0.9);\n`;
  // TITLE slam
  const letters = [..."MISI"].map((_, i) => `#in-ta${i}`).concat([..."DETEKTIF"].map((_, i) => `#in-tb${i}`), [..."BAHASA"].map((_, i) => `#in-tc${i}`));
  s += `tl.to("#in-dark", {opacity:0.7, duration:0.3}, ${tTitle - 0.1});\n`;
  s += `tl.fromTo("#in-t0", {opacity:0, scaleX:1.4}, {opacity:1, scaleX:1, duration:0.8, ease:"power3.out"}, ${tTitle});\n`;
  s += `tl.fromTo(${JSON.stringify(letters.join(","))}, {opacity:0, scale:2.6, y:-40, filter:"blur(14px)"}, {opacity:1, scale:1, y:0, filter:"blur(0px)", duration:0.42, ease:"power4.out", stagger:0.035}, ${tTitle});\n`;
  s += `tl.fromTo("#in-t2", {opacity:0, y:30, scaleX:1.25}, {opacity:1, y:0, scaleX:1, duration:0.7, ease:"power3.out"}, ${r2(tTitle + 0.7)});\n`;
  s += `tl.fromTo("#in-ul", {scaleX:0}, {scaleX:1, duration:0.8, ease:"power2.inOut"}, ${r2(tTitle + 0.9)});\n`;
  s += `tl.fromTo("#in-flash", {opacity:0}, {keyframes:{opacity:[0,0.55,0]}, duration:0.35, ease:"none"}, ${r2(tTitle + 0.4)});\n`;
  s += `tl.fromTo("#in-title", {scale:1}, {scale:1.05, duration:${r2(tI3 - tTitle - 0.25)}, ease:"none"}, ${tTitle});\n`;
  // title moves up for the board scan
  s += `tl.to("#in-title", {y:-120, opacity:0, filter:"blur(10px)", duration:0.7, ease:"power3.in"}, ${r2(tI3 - 0.2)});\n`;
  s += `tl.to("#in-dark", {opacity:0.15, duration:0.9}, ${r2(tI3 - 0.2)});\n`;
  // laser sweep across the board + rings
  s += `tl.fromTo("#in-sweep", {x:-60, opacity:1}, {x:1980, duration:${r2(Math.max(2.4, d("i3") - 0.6))}, ease:"none"}, ${r2(tI3 + 0.4)});\n`;
  s += `tl.to("#in-sweep", {opacity:0, duration:0.2}, ${r2(tI3 + 0.4 + Math.max(2.4, d("i3") - 0.6))});\n`;
  cards.forEach((_, i) => {
    const t = r2(tI3 + 0.6 + i * (Math.max(2.4, d("i3") - 0.8) / 8));
    s += `tl.fromTo("#in-ring${i}", {strokeDashoffset:1}, {strokeDashoffset:0, duration:0.35, ease:"power2.out"}, ${t});\n`;
    if (i % 2 === 0) sfx("pop", T0 + t, 0.28);
  });
  // steps
  const sT = [0.08, 0.38, 0.72].map((f) => r2(tI4 + f * d("i4")));
  ["#in-s1", "#in-s2", "#in-s3"].forEach((id, i) => {
    s += `tl.fromTo("${id}", {opacity:0, y:40, scale:0.8}, {opacity:1, y:0, scale:1, duration:0.4, ease:"back.out(2)"}, ${sT[i]});\n`;
    sfx("click", T0 + sT[i], 0.45);
  });
  // ready?
  s += `tl.to(["#in-s1","#in-s2","#in-s3"], {opacity:0, y:-20, duration:0.35, ease:"power2.in"}, ${r2(tI5 - 0.4)});\n`;
  s += `tl.to("#in-dark", {opacity:0.85, duration:0.5}, ${r2(tI5 - 0.4)});\n`;
  s += `tl.fromTo("#in-ready", {opacity:0, scale:0.6, filter:"blur(20px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.35, ease:"power4.out"}, ${r2(tI6 + 0.15)});\n`;
  s += `tl.fromTo("#in-flash", {opacity:0}, {keyframes:{opacity:[0,0.8,0]}, duration:0.4, ease:"none", immediateRender:false}, ${r2(tI6 + 0.15)});\n`;
  s += `tl.to("#in-ready", {scale:1.08, duration:${r2(end - tI6 - 0.9)}, ease:"none"}, ${r2(tI6 + 0.5)});\n`;
  dz.tw.forEach(([id, dy, dx]) => (s += `tl.fromTo("${id}", {x:0, y:0}, {x:${dx}, y:${dy}, duration:${r2(end)}, ease:"none"}, 0);\n`));
  s += glitchOut(p, end);

  // audio
  sfx("radio-static", T0 + 0.1, 0.35);
  sfx("error", T0 + 0.92, 0.42);
  sfx("error", T0 + 2.6, 0.32);
  vo("i1", T0 + tI1);
  sfx("impact-bass-2", T0 + tTitle - 0.2, 0.55);
  sfx("whoosh-cinematic", T0 + tTitle - 0.4, 0.3);
  vo("i2", T0 + tI2);
  sfx("radio-static", T0 + tI2 - 0.5, 0.18);
  vo("i3", T0 + tI3);
  sfx("glitch-3", T0 + tI3 + 0.4, 0.3);
  vo("i4", T0 + tI4);
  vo("i5", T0 + tI5);
  sfx("riser", T0 + tI6 + 0.15 - 10.03 + 0.2, 0.32);
  vo("i6", T0 + tI6);
  sfx("impact-bass-1", T0 + tI6 + 0.15, 0.6);
  sfx("glitch-1", T0 + end - 0.5, 0.35);

  return { id: "intro", dur: end, html: sceneFile("intro", css, body, s, end) };
}

// =================================================================
// CASES
// =================================================================
const CASE_CSS = `
.hdr { position:absolute; left:192px; top:100px; }
.hdr .k { font-family:'Archivo Black'; font-size:96px; line-height:1; color:#fff; text-shadow:0 0 24px rgba(30,144,255,.8); }
.hdr .k span { color:#00b4ff; font-size:46px; vertical-align:top; margin-left:10px; }
.hdr .f { font:600 24px 'JetBrains Mono'; color:#7fb8ff; letter-spacing:.18em; margin-top:8px; }
.mat { position:absolute; right:192px; top:108px; width:430px; text-align:right; }
.topfade { position:absolute; left:0; right:0; top:0; height:380px; background:linear-gradient(180deg, rgba(3,5,11,.98) 0%, rgba(3,5,11,.95) 60%, transparent 100%); opacity:0; }
.mat .m1 { font:600 24px 'JetBrains Mono'; color:#7fb8ff; letter-spacing:.2em; }
.mat .m2 { white-space:nowrap; font:700 28px/1.1 'Oswald'; color:#fff; letter-spacing:.05em; margin-top:4px; }
.dots { display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
.dots i { display:block; width:26px; height:8px; border-radius:4px; background:#1b2b4a; }
.dots i.done { background:#22e57a; } .dots i.cur { background:#ff2d3d; }
.cat { position:absolute; left:690px; top:96px; width:540px; text-align:center; background:rgba(40,0,8,.92); border:3px solid #ff2d3d; border-left-width:12px; padding:16px 22px; box-shadow:0 0 40px rgba(255,45,61,.35); }
.cat .c0 { font:700 24px 'JetBrains Mono'; color:#ff8a94; letter-spacing:.2em; }
.cat .c1 { white-space:nowrap; font:700 32px/1.1 'Oswald'; color:#fff; margin-top:6px; letter-spacing:.02em; }
.cat .c2 { display:inline-block; font:700 24px 'JetBrains Mono'; color:#05070d; background:#ff2d3d; padding:3px 10px; margin-top:10px; letter-spacing:.1em; }
.folder { position:absolute; left:610px; top:300px; width:700px; height:470px; }
.folder .back { position:absolute; inset:0; background:#c99a4b; border-radius:6px 18px 18px 18px; }
.folder .tab { position:absolute; left:0; top:-46px; width:300px; height:60px; background:#c99a4b; border-radius:14px 14px 0 0; font:700 24px/58px 'JetBrains Mono'; color:#3a2a10; text-align:center; letter-spacing:.1em; }
.folder .front { position:absolute; inset:24px 0 0 0; background:linear-gradient(170deg,#e2b764,#c99a4b); border-radius:6px; box-shadow:0 30px 60px rgba(0,0,0,.6); }
.folder .lbl { position:absolute; left:60px; top:80px; font-family:'Archivo Black'; font-size:84px; color:#3a2a10; }
.folder .sub { position:absolute; left:64px; top:190px; font:700 28px 'JetBrains Mono'; color:#5b4317; letter-spacing:.12em; }
.folder .stampR { position:absolute; right:50px; bottom:56px; font-family:'Archivo Black'; font-size:52px; color:#c1121f; border:7px solid #c1121f; padding:2px 22px; opacity:.85; }
.err { position:relative; border-radius:8px; }
.err .ring { position:absolute; left:-22px; top:-14px; width:calc(100% + 44px); height:calc(100% + 28px); overflow:visible; pointer-events:none; }
.err .ring ellipse { fill:none; stroke:#ff2d3d; stroke-width:6; stroke-dasharray:1; stroke-dashoffset:1; vector-effect:non-scaling-stroke; filter:drop-shadow(0 0 8px rgba(255,45,61,.9)); }
.err .strike { position:absolute; left:-6px; right:-6px; top:50%; height:7px; margin-top:-3px; background:#ff2d3d; border-radius:4px; }
.lens { position:absolute; left:50%; top:50%; width:240px; height:300px; pointer-events:none; }
.laser { position:absolute; left:330px; width:1260px; top:0; height:6px; background:#ff2d3d; box-shadow:0 0 22px 6px rgba(255,45,61,.85); opacity:0; }
.laserband { position:absolute; left:330px; width:1260px; top:0; height:150px; background:linear-gradient(0deg, rgba(255,45,61,.28), transparent); opacity:0; }
.note { position:absolute; left:200px; right:200px; top:545px; text-align:center; }
.bad { position:absolute; left:220px; right:220px; top:300px; background:rgba(40,0,8,.88); border:3px solid #ff2d3d; border-radius:14px; padding:18px 40px 24px; text-align:center; }
.bad .b0 { font:700 26px 'JetBrains Mono'; color:#ff6b78; letter-spacing:.3em; }
.bad .b0 b { display:inline-block; position:relative; width:20px; height:20px; margin-right:14px; vertical-align:-2px; }
.bad .b0 b:before, .bad .b0 b:after { content:''; position:absolute; left:8px; top:-2px; width:5px; height:24px; background:#ff6b78; transform:rotate(45deg); }
.bad .b0 b:after { transform:rotate(-45deg); }
.bad .bt { font:800 48px/1.25 'Inter'; color:#fff; margin-top:8px; }
.bad .bw { color:#ff2d3d; background:rgba(255,45,61,.16); border-radius:8px; padding:0 8px; text-decoration:line-through; text-decoration-thickness:3px; }
.note .n0 { font:700 26px 'JetBrains Mono'; color:#00b4ff; letter-spacing:.3em; }
.note .n1 { font:600 38px/1.3 'Inter'; color:#fff; margin-top:10px; }
.fix { overflow:hidden; position:absolute; left:220px; right:220px; top:715px; background:rgba(3,30,18,.92); border:3px solid #22e57a; border-radius:14px; padding:20px 40px 26px; text-align:center; box-shadow:0 0 60px rgba(34,229,122,.25); }
.fix .f0 { font:700 26px 'JetBrains Mono'; color:#22e57a; letter-spacing:.3em; }
.fix .f0 b { display:inline-block; width:26px; height:14px; border-left:5px solid #22e57a; border-bottom:5px solid #22e57a; transform:rotate(-45deg) translateY(-6px); margin-right:14px; }
.fix .f1 { font:800 50px/1.25 'Inter'; color:#fff; margin-top:8px; }
.fix .good { color:#22e57a; background:rgba(34,229,122,.16); border-radius:8px; padding:0 8px; box-shadow:0 0 0 2px rgba(34,229,122,.5); }
.fix .sheen { position:absolute; top:0; bottom:0; width:160px; left:0; background:linear-gradient(90deg,transparent,rgba(160,255,200,.35),transparent); }
.stamp { position:absolute; left:610px; top:420px; width:700px; height:240px; border:12px solid #22e57a; border-radius:18px; text-align:center; color:#22e57a; background:rgba(2,20,10,.55); }
.stamp .s1 { font-family:'Archivo Black'; font-size:118px; line-height:1; margin-top:30px; letter-spacing:.04em; }
.stamp .s2 { font:700 30px 'JetBrains Mono'; letter-spacing:.4em; margin-top:10px; }
`;

const LENS = `<svg viewBox="0 0 240 300"><defs><radialGradient id="LG" cx="40%" cy="35%"><stop offset="0" stop-color="#bfe9ff" stop-opacity=".35"/><stop offset="1" stop-color="#1e90ff" stop-opacity=".08"/></radialGradient></defs>
<line x1="170" y1="170" x2="230" y2="290" stroke="#0d1b33" stroke-width="30" stroke-linecap="round"/><line x1="170" y1="170" x2="230" y2="290" stroke="#2a4a7a" stroke-width="18" stroke-linecap="round"/>
<circle cx="110" cy="110" r="96" fill="url(#LG)" stroke="#cfe8ff" stroke-width="14"/><circle cx="110" cy="110" r="96" fill="none" stroke="#1e90ff" stroke-width="4"/>
<path d="M60 70 Q80 45 115 40" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7"/></svg>`;

function chars(str, cls = "ch") {
  return [...str].map((c) => `<span class="${cls}">${c === " " ? " " : esc(c)}</span>`).join("");
}

function buildCase(c, T0, sfxSet) {
  const p = `c${c.n}`;
  const d = (k) => VO[`${p}_${k}`];
  const short = c.wrong[1].length <= 14;
  const errHtml = `<span id="${p}-err" class="err">${chars(c.wrong[1])}${short ? `<svg class="ring" viewBox="0 0 100 40" preserveAspectRatio="none"><ellipse id="${p}-ring" cx="50" cy="20" rx="49" ry="19" pathLength="1"/></svg><i id="${p}-strike" class="strike"></i>` : ""}<div id="${p}-lens" class="lens">${LENS}</div></span>`;
  const sent = `<div id="${p}-sent" class="sent">${chars(c.wrong[0])}${errHtml}${chars(c.wrong[2])}</div>`;
  const nChars = [...c.wrong[0]].length + [...c.wrong[1]].length + [...c.wrong[2]].length;

  // ---- timing ----
  let tIntro = 0.7;
  let tWrong = r2(tIntro + d("intro") + 0.5);
  let tScan = r2(tWrong + d("wrong") + 0.4);
  const scanD = 1.7;
  let tDetect = r2(tScan + scanD);
  let tExplain = r2(tDetect + d("detect") + 0.7);
  let tCorrect = r2(tExplain + d("explain") + 0.6);
  let tClose = r2(tCorrect + d("correct") + 0.8);
  let end = r2(tClose + d("close") + 1.3);
  const extra = Math.max(0, 30 - end);
  // spread the spare time: before scan, after detect, after explain, after correct
  const add = [0.15, 0.3, 0.3, 0.25].map((f) => f * extra);
  tScan = r2(tScan + add[0]); tDetect = r2(tDetect + add[0]);
  tExplain = r2(tExplain + add[0] + add[1]);
  tCorrect = r2(tCorrect + add[0] + add[1] + add[2]);
  tClose = r2(tClose + add[0] + add[1] + add[2] + add[3]);
  end = r2(Math.max(30, end));

  const dz = dust(p, 26, 100 + c.n);
  const dots = Array.from({ length: 8 }, (_, i) => `<i id="${p}-dot${i}" class="${i + 1 < c.n ? "done" : i + 1 === c.n ? "cur" : ""}"></i>`).join("");
  const fixSent = `${esc(c.right[0])}<span class="good">${esc(c.right[1])}</span>${esc(c.right[2])}`;

  const body = `
    <div class="bg"></div><div id="${p}-grid" class="grid"></div>${dz.html}
    <div id="${p}-wrap" class="wrap">
      <div class="persp"><div id="${p}-stage" class="stage">
        ${material(c.kind, sent)}
        <div id="${p}-band" class="laserband"></div><div id="${p}-laser" class="laser"></div>
      </div></div>
      <div id="${p}-topfade" class="topfade"></div>
      <div id="${p}-folder" class="folder"><div class="back"></div><div class="tab" data-layout-ignore>FAIL ${pad2(c.n)}</div>
        <div class="front"><div class="lbl">KES ${pad2(c.n)}</div><div class="sub">${esc(c.material)}</div><div class="stampR">SULIT</div></div></div>
      <div id="${p}-hdr" class="hdr"><div class="k">KES ${pad2(c.n)}<span>/08</span></div><div class="f">FAIL BUKTI · BB-26-${pad2(c.n)}</div></div>
      <div id="${p}-mat" class="mat"><div class="m1">BAHAN BUKTI</div><div class="m2">${esc(c.material)}</div><div class="dots">${dots}</div></div>
      <div id="${p}-cat" class="cat"><div class="c0">KESALAHAN DIKESAN</div><div class="c1">KESALAHAN ${esc(c.category)}</div><div class="c2">${esc(c.sub)}</div></div>
      <div id="${p}-bad" class="bad"><div class="b0"><b></b>AYAT SALAH</div><div class="bt">${esc(c.wrong[0])}<span class="bw">${esc(c.wrong[1])}</span>${esc(c.wrong[2])}</div></div>
      <div id="${p}-note" class="note"><div class="n0">NOTA DETEKTIF</div><div class="n1">${esc(c.explain)}</div></div>
      <div id="${p}-fix" class="fix"><div class="f0"><b></b>AYAT BETUL</div><div class="f1">${fixSent}</div><div id="${p}-sheen" class="sheen"></div></div>
      <div id="${p}-stamp" class="stamp"><div class="s1">SELESAI</div><div class="s2">KES ${pad2(c.n)} DITUTUP</div></div>
    </div>
    ${chrome(p)}`;

  let s = glitchIn(p, 0);
  // header + material label
  s += `tl.fromTo("#${p}-hdr", {opacity:0, scale:1.5, filter:"blur(12px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.45, ease:"power4.out", transformOrigin:"0% 50%"}, 0.25);\n`;
  s += `tl.fromTo("#${p}-mat", {opacity:0, x:60}, {opacity:1, x:0, duration:0.5, ease:"power3.out"}, 0.5);\n`;
  // evidence folder enters, then flies off revealing the document
  const tFolderOut = r2(tIntro + d("intro") * 0.75);
  s += `tl.fromTo("#${p}-folder", {opacity:0, y:300, rotation:8, scale:0.8}, {opacity:1, y:0, rotation:-2, scale:1, duration:0.6, ease:"power3.out"}, 0.35);\n`;
  s += `tl.to("#${p}-folder", {rotation:2, duration:${r2(tFolderOut - 0.95)}, ease:"sine.inOut"}, 0.95);\n`;
  s += `tl.to("#${p}-folder", {y:-900, x:${c.n % 2 ? 500 : -500}, rotation:${c.n % 2 ? 24 : -24}, duration:0.7, ease:"power3.in"}, ${tFolderOut});\n`;
  // document rises in 3D
  s += `tl.fromTo("#${p}-stage", {opacity:0, y:220, rotationX:38, scale:0.78, transformOrigin:"960px 560px"}, {opacity:1, y:0, rotationX:0, scale:0.92, duration:1.1, ease:"power3.out"}, ${r2(tFolderOut + 0.25)});\n`;
  // slow dolly during typing
  s += `tl.to("#${p}-stage", {scale:0.98, rotationY:${c.n % 2 ? -3 : 3}, duration:${r2(tScan - tFolderOut - 1.35)}, ease:"sine.inOut"}, ${r2(tFolderOut + 1.35)});\n`;
  // typing
  const typeD = r2(Math.max(1.0, d("wrong") * 0.92));
  s += `tl.fromTo("#${p}-sent .ch", {opacity:0}, {opacity:1, duration:0.01, stagger:${(typeD / nChars).toFixed(4)}, ease:"none"}, ${tWrong});\n`;
  // laser scan (down, back up, lock on sentence)
  s += `tl.fromTo("#${p}-laser", {y:250, opacity:0}, {opacity:1, duration:0.1}, ${tScan});\n`;
  s += `tl.to("#${p}-laser", {keyframes:{y:[250, 840, 560]}, duration:${scanD - 0.2}, ease:"sine.inOut"}, ${tScan});\n`;
  s += `tl.fromTo("#${p}-band", {y:100, opacity:0}, {opacity:1, duration:0.1}, ${tScan});\n`;
  s += `tl.to("#${p}-band", {keyframes:{y:[100, 690, 410]}, duration:${scanD - 0.2}, ease:"sine.inOut"}, ${tScan});\n`;
  // magnifying glass sweeps onto the error word
  s += `tl.fromTo("#${p}-lens", {xPercent:-40, yPercent:-38, x:-520, y:340, rotation:-20, opacity:0}, {x:0, y:0, rotation:0, opacity:1, duration:${scanD}, ease:"power2.inOut"}, ${tScan});\n`;
  // detect: zoom to error, red highlight, ring, alert
  s += `tl.to("#${p}-laser", {opacity:0, duration:0.25}, ${tDetect});\n`;
  s += `tl.to("#${p}-band", {opacity:0, duration:0.25}, ${tDetect});\n`;
  s += `tl.to("#${p}-lens", {opacity:0, scale:1.6, duration:0.4, ease:"power2.in"}, ${r2(tDetect + 0.05)});\n`;
  s += `tl.to("#${p}-stage", {scale:1.32, rotationY:0, y:30, duration:0.75, ease:"power3.inOut"}, ${tDetect});\n`;
  s += `tl.fromTo("#${p}-topfade", {opacity:0}, {opacity:1, duration:0.5}, ${tDetect});\n`;
  s += `tl.to("#${p}-topfade", {opacity:0, duration:0.5}, ${r2(tExplain - 0.4)});\n`;
  s += `tl.fromTo("#${p}-err", {color:"inherit", backgroundColor:"rgba(255,45,61,0)"}, {color:"#ff2d3d", backgroundColor:"rgba(255,45,61,0.16)", duration:0.25, ease:"steps(4)"}, ${r2(tDetect + 0.1)});\n`;
  if (short) s += `tl.fromTo("#${p}-ring", {strokeDashoffset:1}, {strokeDashoffset:0, duration:0.5, ease:"power2.out"}, ${r2(tDetect + 0.3)});\n`;
  s += `tl.fromTo("#${p}-alert", {opacity:0}, {keyframes:{opacity:[0,0.9,0.15,0.8,0]}, duration:0.9, ease:"none"}, ${r2(tDetect + 0.05)});\n`;
  s += `tl.fromTo("#${p}-cat", {opacity:0, x:-80, clipPath:"inset(0 100% 0 0)"}, {opacity:1, x:0, clipPath:"inset(0 0% 0 0)", duration:0.5, ease:"power3.out"}, ${r2(tDetect + 0.55)});\n`;
  // explanation: pull back, document up, note in
  s += `tl.to("#${p}-stage", {scale:0.45, y:-180, opacity:0, filter:"blur(8px)", duration:0.7, ease:"power3.in"}, ${r2(tExplain - 0.7)});\n`;
  s += `tl.fromTo("#${p}-bad", {opacity:0, y:-40, scale:1.1}, {opacity:1, y:0, scale:1, duration:0.5, ease:"power3.out"}, ${r2(tExplain - 0.2)});\n`;
  s += `tl.fromTo("#${p}-note", {opacity:0, y:30}, {opacity:1, y:0, duration:0.5, ease:"power3.out"}, ${r2(tExplain + 0.1)});\n`;
  // correction: strike in doc, green panel
  if (short) s += `tl.fromTo("#${p}-strike", {scaleX:0}, {scaleX:1, duration:0.35, ease:"power2.out"}, ${r2(tCorrect)});\n`;
  else s += `tl.to("#${p}-err", {opacity:0.45, duration:0.3}, ${r2(tCorrect)});\n`;
  s += `tl.fromTo("#${p}-fix", {opacity:0, y:60, scale:0.94}, {opacity:1, y:0, scale:1, duration:0.55, ease:"back.out(1.6)"}, ${r2(tCorrect + 0.05)});\n`;
  s += `tl.fromTo("#${p}-sheen", {x:-200, opacity:1}, {x:1500, duration:0.9, ease:"power2.inOut"}, ${r2(tCorrect + 0.4)});\n`;
  // close: stamp
  s += `tl.to("#${p}-dot${c.n - 1}", {backgroundColor:"#22e57a", duration:0.2}, ${r2(tClose)});\n`;
  s += `tl.fromTo("#${p}-stamp", {opacity:0, scale:2.6, rotation:-18}, {opacity:1, scale:1, rotation:-8, duration:0.32, ease:"power4.in"}, ${r2(tClose)});\n`;
  s += `tl.to("#${p}-wrap", {keyframes:{x:[0,-14,10,-6,0]}, duration:0.3, ease:"none"}, ${r2(tClose + 0.32)});\n`;
  dz.tw.forEach(([id, dy, dx]) => (s += `tl.fromTo("${id}", {x:0, y:0}, {x:${dx}, y:${dy}, duration:${r2(end)}, ease:"none"}, 0);\n`));
  s += `tl.fromTo("#${p}-grid", {x:0, y:0}, {x:${c.n % 2 ? -60 : 60}, y:-60, duration:${r2(end)}, ease:"none"}, 0);\n`;
  s += glitchOut(p, end);

  // ---- audio ----
  sfx(sfxSet.inG, T0 + 0.0, 0.35);
  sfx("whoosh-short", T0 + tFolderOut + 0.15, 0.4);
  vo(`${p}_intro`, T0 + tIntro);
  vo(`${p}_wrong`, T0 + tWrong);
  sfx("typing", T0 + tWrong, 0.22);
  if (d("wrong") > 1.8) sfx("typing", T0 + tWrong + 1.45, 0.18);
  sfx("glitch-3", T0 + tScan, 0.3);
  sfx("error", T0 + tDetect + 0.05, 0.42);
  vo(`${p}_detect`, T0 + tDetect + 0.35);
  sfx("pop", T0 + tDetect + 0.55, 0.35);
  vo(`${p}_explain`, T0 + tExplain);
  vo(`${p}_correct`, T0 + tCorrect);
  sfx(sfxSet.ok, T0 + tCorrect + 0.05, 0.42);
  vo(`${p}_close`, T0 + tClose + 0.1);
  sfx(sfxSet.stamp, T0 + tClose + 0.28, 0.5);

  return { id: `case${c.n}`, dur: end, html: sceneFile(`case${c.n}`, MATERIAL_CSS + CASE_CSS, body, s, end) };
}

// fix: detect VO starts 0.35 after detect; shift explain accordingly
// (handled by the 0.7 s gap in timing above)

// =================================================================
// OUTRO
// =================================================================
function buildOutro(T0) {
  const p = "out";
  const d = (k) => VO[k];
  const tO1 = 1.2;
  const tO2 = r2(tO1 + d("o1") + 0.4);
  const tWin = r2(tO2 + d("o2") + 0.3);
  const tO3 = r2(tWin + 1.6);
  const tO4 = r2(tO3 + d("o3") + 0.5);
  const tBJB = r2(tO4 + d("o4") + 0.5);
  const end = r2(Math.max(30, tBJB + 4.0));
  const flipStart = 1.0;
  const flipStep = r2((tWin - 0.8 - flipStart) / 8);

  const cards = S.cases
    .map(
      (c, i) => `<div id="out-cd${i}" class="cd" data-layout-ignore style="left:${190 + (i % 4) * 392}px;top:${200 + Math.floor(i / 4) * 300}px">
        <div class="red"><div class="k">KES ${pad2(c.n)}</div><div class="cg">${esc(c.category)}</div><div class="st">BELUM SELESAI</div></div>
        <div id="out-gr${i}" class="green"><div class="k">KES ${pad2(c.n)}</div><div class="cg">${esc(c.category)}</div><div class="st"><b></b>SELESAI</div></div></div>`,
    )
    .join("");
  const css = `
.btitle { position:absolute; left:0; right:0; top:100px; text-align:center; font:700 30px 'JetBrains Mono'; color:#00b4ff; letter-spacing:.4em; }
.cd { position:absolute; width:364px; height:262px; }
.cd .red, .cd .green { position:absolute; inset:0; border-radius:14px; padding:26px 26px; }
.cd .red { background:rgba(50,0,8,.9); border:3px solid #ff2d3d; box-shadow:0 0 30px rgba(255,45,61,.25); }
.cd .green { background:rgba(2,36,18,.95); border:3px solid #22e57a; box-shadow:0 0 40px rgba(34,229,122,.35); opacity:0; }
.cd .k { font-family:'Archivo Black'; font-size:56px; color:#fff; line-height:1; }
.cd .cg { font:700 30px/1.1 'Oswald'; color:#fff; margin-top:14px; letter-spacing:.03em; min-height:66px; }
.cd .red .st { font:700 24px 'JetBrains Mono'; color:#ff2d3d; letter-spacing:.2em; margin-top:16px; }
.cd .green .st { font:700 24px 'JetBrains Mono'; color:#22e57a; letter-spacing:.2em; margin-top:16px; }
.cd .green .st b { display:inline-block; width:22px; height:12px; border-left:5px solid #22e57a; border-bottom:5px solid #22e57a; transform:rotate(-45deg) translateY(-5px); margin-right:12px; }
.win { position:absolute; left:0; right:0; top:330px; text-align:center; }
.win .w1 { font-family:'Archivo Black'; font-size:150px; color:#22e57a; text-shadow:0 0 40px rgba(34,229,122,.7); line-height:1; }
.win .w2 { font:700 30px 'JetBrains Mono'; color:#bfffd9; letter-spacing:.5em; margin-top:22px; }
.bjb { position:absolute; left:0; right:0; top:640px; text-align:center; }
.bjb .b1 { font:700 92px 'Oswald'; color:#fff; letter-spacing:.22em; }
.bjb .b2 { width:760px; height:6px; margin:18px auto 0; background:linear-gradient(90deg,transparent,#00b4ff,transparent); }
.dark { position:absolute; inset:0; background:#000; opacity:0; }
.flash { position:absolute; inset:0; background:#c8ffe0; opacity:0; }
.ray { position:absolute; left:960px; top:420px; width:2400px; height:2400px; margin:-1200px 0 0 -1200px; border-radius:50%;
  background:repeating-conic-gradient(rgba(34,229,122,.10) 0 6deg, transparent 6deg 18deg); opacity:0; }
`;
  const body = `
    <div class="bg"></div><div id="out-grid" class="grid"></div>
    <div id="out-wrap" class="wrap">
      <div id="out-ray" class="ray"></div>
      <div id="out-bt" class="btitle">PAPAN PENYIASATAN · STATUS OPERASI</div>
      <div id="out-board">${cards}</div>
      <div id="out-win" class="win"><div class="w1">OPERASI BERJAYA!</div><div class="w2">8 / 8 KES SELESAI</div></div>
      <div id="out-bjb" class="bjb"><div class="b1">BAHASA JIWA BANGSA</div><div id="out-bl" class="b2"></div></div>
      <div id="out-flash" class="flash"></div>
      <div id="out-dark" class="dark"></div>
    </div>
    ${chrome(p)}`;
  let s = glitchIn(p, 0);
  s += `tl.fromTo("#out-bt", {opacity:0, scaleX:1.3}, {opacity:1, scaleX:1, duration:0.8, ease:"power3.out"}, 0.3);\n`;
  S.cases.forEach((_, i) => {
    s += `tl.fromTo("#out-cd${i}", {opacity:0, y:80, rotation:${i % 2 ? 6 : -6}}, {opacity:1, y:0, rotation:0, duration:0.45, ease:"back.out(1.7)"}, ${r2(0.3 + i * 0.07)});\n`;
    const tf = r2(flipStart + i * flipStep);
    s += `tl.to("#out-cd${i}", {keyframes:{scaleX:[1,0,1]}, duration:0.36, ease:"power2.inOut"}, ${tf});\n`;
    s += `tl.fromTo("#out-gr${i}", {opacity:0}, {opacity:1, duration:0.01}, ${r2(tf + 0.18)});\n`;
    if (i % 2 === 0) sfx(i % 4 === 0 ? "pop" : "click", T0 + tf + 0.18, 0.35);
  });
  s += `tl.to("#out-board", {scale:0.5, y:-330, opacity:0.0, duration:0.7, ease:"power3.inOut", transformOrigin:"960px 450px"}, ${r2(tWin - 0.4)});\n`;
  s += `tl.to("#out-bt", {opacity:0, duration:0.4}, ${r2(tWin - 0.4)});\n`;
  s += `tl.fromTo("#out-win", {opacity:0, scale:2.2, filter:"blur(20px)"}, {opacity:1, scale:1, filter:"blur(0px)", duration:0.4, ease:"power4.out"}, ${tWin});\n`;
  s += `tl.fromTo("#out-flash", {opacity:0}, {keyframes:{opacity:[0,0.7,0]}, duration:0.45, ease:"none"}, ${r2(tWin + 0.25)});\n`;
  s += `tl.fromTo("#out-ray", {opacity:0, rotation:0}, {opacity:1, rotation:40, duration:${r2(end - tWin)}, ease:"none"}, ${tWin});\n`;
  s += `tl.to("#out-win", {scale:1.06, duration:${r2(end - tWin - 0.5)}, ease:"none"}, ${r2(tWin + 0.4)});\n`;
  s += `tl.fromTo("#out-bjb", {opacity:0, y:40, scaleX:1.2}, {opacity:1, y:0, scaleX:1, duration:0.9, ease:"power3.out"}, ${tBJB});\n`;
  s += `tl.fromTo("#out-bl", {scaleX:0}, {scaleX:1, duration:1.0, ease:"power2.inOut"}, ${r2(tBJB + 0.3)});\n`;
  s += `tl.fromTo("#out-grid", {x:0, y:0}, {x:-60, y:-60, duration:${r2(end)}, ease:"none"}, 0);\n`;
  s += `tl.to("#out-dark", {opacity:1, duration:1.4, ease:"power1.in"}, ${r2(end - 1.5)});\n`;

  sfx("glitch-2", T0 + 0.0, 0.3);
  vo("o1", T0 + tO1);
  vo("o2", T0 + tO2);
  sfx("riser", T0 + tWin - 10.03 + 0.2, 0.3);
  sfx("impact-bass-2", T0 + tWin - 0.15, 0.6);
  sfx("sparkle", T0 + tWin + 0.2, 0.4);
  vo("o3", T0 + tO3);
  vo("o4", T0 + tO4);
  sfx("chime", T0 + tBJB, 0.4);
  return { id: "outro", dur: end, html: sceneFile("outro", css, body, s, end) };
}

// =================================================================
const scenes = [];
let T = 0;
const intro = buildIntro(T); scenes.push({ ...intro, start: T }); T = r2(T + intro.dur);
const sets = [
  { inG: "glitch-1", ok: "ping", stamp: "impact-bass-1" },
  { inG: "whoosh-cinematic", ok: "notification", stamp: "impact-bass-2" },
  { inG: "glitch-2", ok: "chime", stamp: "impact-bass-1" },
];
for (const c of S.cases) {
  const sc = buildCase(c, T, sets[(c.n - 1) % 3]);
  scenes.push({ ...sc, start: T });
  T = r2(T + sc.dur);
}
const outro = buildOutro(T); scenes.push({ ...outro, start: T }); T = r2(T + outro.dur);
const TOTAL = T;

for (const sc of scenes) fs.writeFileSync(path.join(ROOT, "compositions", `${sc.id}.html`), sc.html);

const hosts = scenes
  .map((sc, i) => `      <div id="${sc.id}" class="clip" data-composition-id="${sc.id}" data-composition-src="compositions/${sc.id}.html" data-start="${sc.start}" data-duration="${r2(sc.dur)}" data-track-index="${1}" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index:${i + 1}"></div>`)
  .join("\n");
let track = 10;
const laneEnd = [];
for (const q of cues.filter((q) => q.kind === "sfx").sort((x, y) => x.t - y.t)) {
  let L = laneEnd.findIndex((e) => e <= q.t);
  if (L < 0) { L = laneEnd.length; laneEnd.push(0); }
  laneEnd[L] = q.t + q.d; q.lane = 3 + L;
}
const audio = cues
  .filter((q) => q.t >= 0)
  .map((q) => `      <audio id="${q.id}" class="clip" src="${q.src}" data-start="${r2(q.t)}" data-duration="${r2(Math.min(q.d, TOTAL - q.t))}" data-track-index="${q.kind === "vo" ? 2 : q.lane}" data-volume="${q.vol}"></audio>`)
  .join("\n");
const music = MUSIC
  ? `      <audio id="music-bed" class="clip" src="assets/music/bed.m4a" data-start="0" data-duration="${TOTAL}" data-track-index="20" data-volume="0.28" data-fade-in="1.5" data-fade-out="3"></audio>`
  : "";

const index = `<!doctype html>
<html lang="ms">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { margin:0; width:1920px; height:1080px; overflow:hidden; background:#03050b; }
      #root { position:relative; width:100%; height:100%; background:#03050b; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
${hosts}
${audio}
${music}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "index.html"), index);
fs.writeFileSync(path.join(ROOT, "build/timing.json"), JSON.stringify({ total: TOTAL, scenes: scenes.map((s) => ({ id: s.id, start: s.start, dur: s.dur })) }, null, 1));
console.log("total", TOTAL, scenes.map((s) => `${s.id}@${s.start}+${s.dur}`).join(" "));
