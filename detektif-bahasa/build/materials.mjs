// Evidence props: one distinct material per case. Each returns HTML for the
// document body; the sentence markup (`sent`) is placed inside it.
// All props are 1180 x 600 and keep the sentence centred around y = 330.

const bars = (n, w0, seed) => {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, () => `<i style="width:${Math.round(w0 * (0.55 + r() * 0.45))}%"></i>`).join("");
};

export const MATERIAL_CSS = `
.doc { position:absolute; left:370px; top:240px; width:1180px; height:600px; }
.doc .sent { position:absolute; left:90px; right:90px; top:260px; text-align:center;
  font-family:'Inter',sans-serif; font-weight:800; font-size:54px; line-height:1.28; letter-spacing:-0.01em; }
.lines i { display:block; height:12px; border-radius:6px; margin:0 0 16px 0; }

/* 1 magazine */
.mag-doc { background:linear-gradient(160deg,#fff7ec 0%,#ffe9d3 100%); border-radius:10px; overflow:hidden;
  box-shadow:0 40px 90px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.15); }
.mag-doc .mast { position:absolute; left:0; right:0; top:0; height:150px; background:#ff4d6d; }
.mag-doc .mast b { position:absolute; left:56px; top:22px; font-family:'Archivo Black',sans-serif; font-size:84px; color:#fff; letter-spacing:-.02em; }
.mag-doc .mast em { position:absolute; right:56px; top:40px; font:700 24px 'Oswald',sans-serif; color:#fff; letter-spacing:.12em; text-align:right; font-style:normal; line-height:1.35; }
.mag-doc .lines { position:absolute; left:90px; right:90px; top:440px; }
.mag-doc .lines i { background:#e6cfb6; }
.mag-doc .tag { position:absolute; left:90px; top:190px; font:700 26px 'Oswald'; color:#ff4d6d; letter-spacing:.14em; }
.mag-doc .sent { color:#1b1b2f; }

/* 2 sign */
.sign-doc .post { position:absolute; top:520px; width:34px; height:260px; background:linear-gradient(90deg,#5b6472,#9aa3b1,#5b6472); }
.sign-doc .board { position:absolute; inset:0 0 40px 0; background:#0f6b3f; border-radius:22px;
  border:12px solid #e9f1ec; box-shadow:0 40px 90px rgba(0,0,0,.65), inset 0 0 0 6px #0f6b3f, inset 0 0 0 9px #e9f1ec; }
.sign-doc .head { position:absolute; left:0; right:0; top:70px; text-align:center; font:700 36px 'Oswald'; color:#e9f1ec; letter-spacing:.3em; }
.sign-doc .arrow { position:absolute; left:50%; top:430px; width:220px; height:16px; margin-left:-110px; background:#e9f1ec; border-radius:8px; }
.sign-doc .sent { color:#fff; font-size:72px; top:220px; }

/* 3 letter */
.let-doc { background:#fbfbf7; box-shadow:0 40px 90px rgba(0,0,0,.6); }
.let-doc .lh { position:absolute; left:80px; right:80px; top:40px; height:110px; border-bottom:4px double #1d3557; }
.let-doc .lh b { position:absolute; left:120px; top:6px; font:700 34px 'Oswald'; color:#1d3557; letter-spacing:.06em; }
.let-doc .lh em { position:absolute; left:120px; top:56px; font:400 20px 'Inter'; color:#5a6b80; font-style:normal; }
.let-doc .crest { position:absolute; left:0; top:4px; width:92px; height:92px; border-radius:50%; border:5px solid #1d3557;
  background:radial-gradient(circle,#ffd166 0 30%,transparent 31%); }
.let-doc .ref { position:absolute; left:80px; top:178px; font:500 20px 'JetBrains Mono'; color:#5a6b80; }
.let-doc .lines { position:absolute; left:80px; right:80px; top:430px; }
.let-doc .lines i { background:#dfe3ea; }
.let-doc .sent { color:#16213e; font-family:'Inter'; font-weight:700; text-align:left; left:80px; right:80px; }
.let-doc .sig { position:absolute; right:110px; bottom:40px; font:italic 400 40px 'EB Garamond'; color:#1d3557; }

/* 4 poster */
.pos-doc { background:linear-gradient(140deg,#3a0ca3 0%,#7209b7 55%,#f72585 100%); border-radius:8px; overflow:hidden;
  box-shadow:0 40px 90px rgba(0,0,0,.6); }
.pos-doc .c1 { position:absolute; right:-80px; top:-120px; width:420px; height:420px; border-radius:50%; background:#ffbe0b; opacity:.9; }
.pos-doc .c2 { position:absolute; left:-60px; bottom:-90px; width:260px; height:260px; border-radius:50%; border:28px solid #4cc9f0; }
.pos-doc .ttl { position:absolute; left:80px; top:60px; font-family:'Archivo Black'; font-size:76px; line-height:.95; color:#fff; letter-spacing:-.02em; }
.pos-doc .ttl span { color:#ffbe0b; }
.pos-doc .when { position:absolute; left:80px; bottom:60px; font:700 28px 'Oswald'; color:#fff; letter-spacing:.12em; }
.pos-doc .sent { color:#fff; top:290px; background:rgba(10,0,40,.45); padding:22px 26px; border-radius:14px; }

/* 5 flyer */
.fly-doc { background:#ffd23f; border-radius:6px; box-shadow:0 40px 90px rgba(0,0,0,.6); overflow:hidden; }
.fly-doc .band { position:absolute; left:0; right:0; top:0; height:150px; background:#2b9348; }
.fly-doc .band b { position:absolute; left:60px; top:34px; font-family:'Archivo Black'; font-size:62px; color:#fff; letter-spacing:-.01em; }
.fly-doc .price { position:absolute; right:60px; top:180px; width:170px; height:170px; border-radius:50%; background:#e63946; color:#fff;
  font:700 30px/1.05 'Oswald'; text-align:center; padding-top:46px; transform:rotate(12deg); }
.fly-doc .fruit { position:absolute; left:60px; top:178px; }
.fly-doc .sent { color:#1d1d1d; top:380px; }
.fly-doc .dash { position:absolute; left:40px; right:40px; bottom:28px; border-top:5px dashed rgba(0,0,0,.35); }

/* 6 comic */
.com-doc { background:#fdfdf8; border:8px solid #111; box-shadow:0 40px 90px rgba(0,0,0,.6); }
.com-doc .ttl { position:absolute; left:28px; top:18px; font-family:'Archivo Black'; font-size:40px; color:#111; background:#ffe066; padding:4px 16px; border:4px solid #111; }
.com-doc .pnl { position:absolute; top:96px; bottom:24px; border:6px solid #111; background:#e8f4ff; overflow:hidden; }
.com-doc .p1 { left:24px; width:300px; } .com-doc .p2 { left:340px; right:24px; background:#fff4e6; }
.com-doc .kid { position:absolute; bottom:-10px; width:120px; height:220px; }
.com-doc .bub { position:absolute; left:380px; right:60px; top:120px; height:300px; background:#fff; border:6px solid #111; border-radius:50%/42%; }
.com-doc .bub:after { content:''; position:absolute; left:120px; bottom:-50px; border:26px solid transparent; border-top:44px solid #111; }
.com-doc .sent { color:#111; font-family:'Inter'; font-weight:900; font-size:40px; line-height:1.22; left:450px; right:120px; top:186px; }

/* 7 newspaper */
.new-doc { background:#efe9dc; box-shadow:0 40px 90px rgba(0,0,0,.6); clip-path:polygon(0 2%,6% 0,14% 2%,26% 0,40% 1.5%,55% 0,70% 2%,84% 0,100% 1.5%,99% 30%,100% 60%,98.5% 100%,80% 98%,62% 100%,44% 98.5%,28% 100%,12% 98%,0 100%,1.2% 70%,0 35%); }
.new-doc .np { position:absolute; left:70px; right:70px; top:40px; text-align:center; font-family:'Playfair Display'; font-weight:900; font-size:66px; color:#1b1b1b; border-bottom:3px solid #1b1b1b; padding-bottom:6px; }
.new-doc .meta { position:absolute; left:70px; right:70px; top:140px; display:flex; justify-content:space-between; font:500 18px 'JetBrains Mono'; color:#4b4b4b; border-bottom:1px solid #4b4b4b; padding-bottom:6px; }
.new-doc .hd { position:absolute; left:70px; right:70px; top:190px; font-family:'Playfair Display'; font-weight:700; font-size:36px; color:#1b1b1b; }
.new-doc .cols { position:absolute; left:70px; right:70px; top:430px; columns:3; column-gap:40px; }
.new-doc .cols i { background:#cfc6b3; height:10px; margin-bottom:13px; }
.new-doc .sent { color:#1b1b1b; font-family:'Playfair Display'; font-weight:900; font-size:56px; top:262px; }

/* 8 notice board */
.not-doc .cork { position:absolute; inset:-30px -60px; background:#b5835a; border-radius:12px; border:14px solid #6b4226;
  background-image:radial-gradient(rgba(0,0,0,.18) 1.5px,transparent 2px),radial-gradient(rgba(255,255,255,.12) 1.5px,transparent 2px);
  background-size:18px 18px, 26px 26px; background-position:0 0, 9px 11px; box-shadow:0 40px 90px rgba(0,0,0,.65); }
.not-doc .paper { position:absolute; left:150px; right:150px; top:40px; bottom:40px; background:#fff; box-shadow:0 18px 30px rgba(0,0,0,.35); transform:rotate(-1.2deg); }
.not-doc .pin { position:absolute; top:-14px; width:38px; height:38px; border-radius:50%; background:radial-gradient(circle at 35% 35%,#ff8a8a,#d00000 60%,#7a0000); }
.not-doc .ph { position:absolute; left:0; right:0; top:44px; text-align:center; font-family:'Archivo Black'; font-size:62px; color:#d00000; letter-spacing:.06em; }
.not-doc .pl { position:absolute; left:60px; right:60px; top:140px; text-align:center; font:600 22px 'Oswald'; color:#555; letter-spacing:.2em; border-bottom:3px solid #d00000; padding-bottom:12px; }
.not-doc .lines { position:absolute; left:110px; right:110px; top:420px; }
.not-doc .lines i { background:#e3e3e3; }
.not-doc .sent { color:#111; font-size:80px; top:230px; }
`;

const kid = (x, c, flip) => `<svg class="kid" style="left:${x}px${flip ? ";transform:scaleX(-1)" : ""}" viewBox="0 0 120 220">
  <circle cx="60" cy="52" r="40" fill="#f2c9a0" stroke="#111" stroke-width="5"/>
  <path d="M22 44 Q60 0 98 44 Q80 22 60 26 Q40 22 22 44Z" fill="#111"/>
  <circle cx="46" cy="54" r="5" fill="#111"/><circle cx="74" cy="54" r="5" fill="#111"/>
  <path d="M46 72 Q60 84 74 72" stroke="#111" stroke-width="4" fill="none"/>
  <path d="M20 220 L28 110 Q60 96 92 110 L100 220Z" fill="${c}" stroke="#111" stroke-width="5"/></svg>`;

const banana = `<svg width="200" height="170" viewBox="0 0 200 170">
  <g stroke="#7a5c00" stroke-width="4">
  <path d="M20 40 Q40 150 170 140 Q100 120 60 40Z" fill="#ffe14d"/>
  <path d="M30 30 Q70 130 185 110 Q110 100 72 28Z" fill="#ffd60a"/>
  <path d="M42 22 Q100 110 190 78 Q120 80 84 18Z" fill="#ffe14d"/>
  <rect x="26" y="10" width="62" height="22" rx="6" fill="#5a7d1a"/></g></svg>`;

export function material(kind, sent) {
  switch (kind) {
    case "magazine":
      return `<div class="doc mag-doc"><div class="mast"><b>SUARA PELAJAR</b><em data-layout-ignore>EDISI 06<br>RUANGAN CERITA</em></div>
        <div class="tag" data-layout-ignore>CATATAN HARIANKU</div>${sent}<div class="lines">${bars(3, 100, 3)}</div></div>`;
    case "sign":
      return `<div class="doc sign-doc"><div class="post" style="left:240px"></div><div class="post" style="right:240px"></div>
        <div class="board"><div class="head" data-layout-ignore>ZON PEMBELAJARAN</div>${sent}<div class="arrow"></div></div></div>`;
    case "letter":
      return `<div class="doc let-doc"><div class="lh"><div class="crest"></div><b>SEKOLAH KEBANGSAAN TAMAN ILMU</b><em data-layout-ignore>Jalan Cendekia, 40000 Shah Alam</em></div>
        <div class="ref" data-layout-ignore>Ruj. Kami: SKTI/KOKU/2026 &nbsp;·&nbsp; Perkara: Keputusan Pertandingan</div>${sent}
        <div class="lines">${bars(2, 100, 5)}</div><div class="sig" data-layout-ignore>Guru Besar</div></div>`;
    case "poster":
      return `<div class="doc pos-doc"><div class="c1"></div><div class="c2"></div>
        <div class="ttl">PROGRAM<br><span>MINDA CERIA</span></div>${sent}<div class="when" data-layout-ignore>SABTU · 8.00 PAGI · DEWAN SEKOLAH</div></div>`;
    case "flyer":
      return `<div class="doc fly-doc"><div class="band"><b>JUALAN BUAH SEGAR</b></div><div class="fruit">${banana}</div>
        <div class="price" data-layout-ignore>HARGA<br>MURAH!</div>${sent}<div class="dash"></div></div>`;
    case "comic":
      return `<div class="doc com-doc"><div class="ttl">KOMIK SEKOLAH</div><div class="pnl p1">${kid(30, "#4cc9f0")}${kid(150, "#f72585", true)}</div>
        <div class="pnl p2"></div><div class="bub"></div>${sent}</div>`;
    case "newspaper":
      return `<div class="doc new-doc"><div class="np">WARTA PELAJAR</div><div class="meta" data-layout-ignore><span>ISNIN, 9 NOVEMBER 2026</span><span>BERITA SEKOLAH</span><span>HALAMAN 3</span></div>
        <div class="hd" data-layout-ignore>Hari Sukan Tetap Meriah</div>${sent}<div class="cols lines">${bars(9, 100, 9)}</div></div>`;
    case "notice":
      return `<div class="doc not-doc"><div class="cork"></div><div class="paper"><div class="pin" style="left:50%;margin-left:-19px"></div>
        <div class="ph">PENGUMUMAN</div><div class="pl" data-layout-ignore>UNTUK PERHATIAN SEMUA MURID</div>${sent}<div class="lines">${bars(2, 100, 11)}</div></div></div>`;
  }
  throw new Error(kind);
}
