"""Single source of truth for the documentary edit.

Segments (10), footage ranges, on-screen labels, music moods and sound effects.
`python3 scripts/plan.py` prints the timeline and writes:
  footage/edit/edl.json            (machine-readable plan used by assemble.py)
  overlays/batch.json              (label rows for `hyperframes render --batch`)
  docs/TIMELINE.md                 (timeline with timestamps + per-segment durations)
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
XF = 0.4  # crossfade (s) at every cut inside a shot: video xfade + audio crossfade

GOLD, SKY, CYAN, GREEN = "#f5c451", "#7cc4ff", "#5ff0ff", "#6dffa8"

# Each graphics scene lives in graphics/index.html at [start, start+dur).
SEGMENTS = [
    {"id": "S01", "title": "Pengenalan Diri", "music": "intro",
     "parts": [{"kind": "graphics", "scene": "s01", "start": 0, "dur": 60}]},
    {"id": "S02", "title": "Penerangan Set Induksi", "music": "induksi",
     "parts": [{"kind": "graphics", "scene": "s02", "start": 60, "dur": 60}]},
    {"id": "S03", "title": "Pelaksanaan Set Induksi", "music": "induksi",
     "parts": [{"kind": "footage", "src": "IMG_8232", "in": 16.0, "out": 244.0}]},
    {"id": "S04", "title": "Penerangan Aktiviti Sorok Kad Mercu Tanda", "music": "treasure",
     "parts": [{"kind": "graphics", "scene": "s04", "start": 120, "dur": 62}]},
    {"id": "S05", "title": "Pelaksanaan Aktiviti Sorok Kad Mercu Tanda", "music": "treasure",
     "parts": [{"kind": "footage", "src": "IMG_8233", "in": 0.0, "out": 36.0},
               {"kind": "footage", "src": "IMG_8235", "in": 0.0, "out": 229.5,
                "cuts": [(146.0, 153.5), (162.0, 165.0), (170.0, 173.9)]}]},
    {"id": "S06", "title": "Penerangan Teknologi Augmented Reality", "music": "ar",
     "parts": [{"kind": "graphics", "scene": "s06", "start": 182, "dur": 52}]},
    {"id": "S07", "title": "Penerangan Permainan Misi Tembak Kata", "music": "game",
     "parts": [{"kind": "graphics", "scene": "s07", "start": 234, "dur": 72}]},
    {"id": "S08", "title": "Pelaksanaan Pengajaran Menggunakan AR", "music": "game",
     "parts": [{"kind": "footage", "src": "IMG_8236", "in": 0.0, "out": 142.5,
                "cuts": [(89.0, 93.5), (106.5, 126.0)]},
               {"kind": "footage", "src": "IMG_8237", "in": 0.5, "out": 145.0,
                "cuts": [(58.2, 62.9)]},
               {"kind": "footage", "src": "IMG_8238", "in": 0.0, "out": 200.9,
                "cuts": [(126.4, 137.8)]},
               {"kind": "footage", "src": "IMG_8239", "in": 0.0, "out": 31.0,
                "cuts": [(7.6, 24.0)]},
               {"kind": "footage", "src": "IMG_8241", "in": 8.8, "out": 177.6,
                "cuts": [(57.0, 73.3), (118.5, 123.8), (136.0, 139.6)]}]},
    {"id": "S09", "title": "Penerangan Rumusan dan Tiket Refleksi", "music": "reflection",
     "parts": [{"kind": "graphics", "scene": "s09", "start": 306, "dur": 52}]},
    {"id": "S10", "title": "Pelaksanaan Rumusan dan Refleksi", "music": "reflection",
     "parts": [{"kind": "footage", "src": "IMG_8241", "in": 177.6, "out": 239.0},
               {"kind": "graphics", "scene": "s10", "start": 358, "dur": 22}]},
]

# Labels on real footage: (source, source_time, kind, tag, text, wrong, right, dur, align, accent)
LABELS = [
    ("IMG_8232", 16.6, "chapter", "Segmen 03 · Rakaman sebenar", "Pelaksanaan Set Induksi", "", "", 5.5, "left", GOLD),
    ("IMG_8232", 47.0, "note", "Set induksi", "Sorakan kelas untuk membina semangat", "", "", 4.5, "left", GOLD),
    ("IMG_8232", 66.5, "note", "Set induksi", "Teka-teki: ke manakah destinasi hari ini?", "", "", 5.0, "left", GOLD),
    ("IMG_8232", 85.0, "note", "Set induksi", "Tayangan video Menara Berkembar PETRONAS", "", "", 5.0, "left", GOLD),
    ("IMG_8232", 156.0, "note", "Tajuk pembelajaran", "Kesalahan kata dalam ayat", "", "", 5.0, "left", GOLD),
    ("IMG_8232", 172.6, "note", "Aspek bahasa", "Penjodoh bilangan · Kata nama", "", "", 5.0, "left", GOLD),
    ("IMG_8232", 211.0, "note", "Destinasi misi", "KLCC — kad mercu tanda disorok di dalam kelas", "", "", 5.5, "left", GOLD),
    ("IMG_8233", 0.4, "chapter", "Segmen 05 · Rakaman sebenar", "Pelaksanaan Sorok Kad Mercu Tanda", "", "", 5.5, "left", GOLD),
    ("IMG_8233", 17.8, "note", "Sorok kad", "Kad ditemui di Stesen 1", "", "", 4.5, "left", GOLD),
    ("IMG_8235", 2.0, "note", "Petikan", "Petikan: Menara Berkembar PETRONAS", "", "", 5.0, "left", GOLD),
    ("IMG_8235", 15.0, "note", "Membaca", "Murid membaca petikan dengan kuat", "", "", 5.0, "left", GOLD),
    ("IMG_8235", 66.0, "note", "Bimbingan guru", "Adakah terdapat kesalahan dalam petikan?", "", "", 5.0, "left", GOLD),
    ("IMG_8235", 112.5, "fix", "Kesalahan 1 · kata nama khas", "", "huruf kecil", "Menara Berkembar Petronas", 6.0, "left", GREEN),
    ("IMG_8235", 176.0, "fix", "Kesalahan 2 · kata ganti nama", "", "beliau", "ia", 6.0, "right", GREEN),
    ("IMG_8235", 214.0, "note", "Seterusnya", "Misi Tembak Kata bermula", "", "", 5.0, "right", GOLD),
    ("IMG_8236", 0.4, "chapter", "Segmen 08 · Rakaman sebenar", "Pelaksanaan Misi Tembak Kata (AR)", "", "", 5.5, "right", CYAN),
    ("IMG_8236", 23.0, "note", "Langkah 1–2", "Murid berdiri di hadapan kamera dan membaca soalan", "", "", 5.0, "right", CYAN),
    ("IMG_8236", 55.2, "fix", "Soalan 1/10 · penjodoh bilangan", "", "seekor kerusi", "sebuah kerusi", 6.0, "right", GREEN),
    ("IMG_8236", 62.0, "note", "Gerak isyarat tangan", "Telunjuk lurus = KUNCI · rapatkan ibu jari = TEMBAK", "", "", 5.5, "right", CYAN),
    ("IMG_8237", 47.0, "note", "Soalan 3/10", "Keluarga Aiman bercuti di kuala lumpur pada minggu lalu.", "", "", 5.0, "left", CYAN),
    ("IMG_8237", 66.0, "fix", "Soalan 3/10 · kata nama khas", "", "kuala lumpur", "Kuala Lumpur", 6.0, "left", GREEN),
    ("IMG_8237", 95.8, "fix", "Soalan 4/10 · kata nama khas", "", "sang kancil dengan buaya", "Sang Kancil dengan Buaya", 6.0, "left", GREEN),
    ("IMG_8238", 32.4, "fix", "Soalan 6/10 · kata ganti nama", "", "patik", "saya", 6.0, "left", GREEN),
    ("IMG_8238", 138.5, "note", "Penjelasan guru", "‘Beliau’ untuk orang ternama atau bergelar", "", "", 5.5, "left", CYAN),
    ("IMG_8238", 148.5, "fix", "Soalan 7/10 · kata ganti nama", "", "beliau", "dia", 6.0, "left", GREEN),
    ("IMG_8241", 96.0, "fix", "Soalan 9/10 · penjodoh bilangan", "", "lima buah ikan", "lima ekor ikan", 6.0, "left", GREEN),
    ("IMG_8241", 171.5, "fix", "Soalan 10/10 · penjodoh bilangan", "", "dua helai kasut", "dua pasang kasut", 6.0, "left", GREEN),
    ("IMG_8241", 178.2, "chapter", "Segmen 10 · Rakaman sebenar", "Pelaksanaan Rumusan & Refleksi", "", "", 5.5, "left", SKY),
    ("IMG_8241", 186.0, "note", "Rumusan guru", "Menggunakan perkataan dengan betul dan tepat", "", "", 5.0, "left", SKY),
    ("IMG_8241", 207.5, "note", "Penutup kelas", "Sorakan penutup kelas", "", "", 4.5, "left", SKY),
    # appended (keeps earlier label ids stable): question 2, answer confirmed on screen "TEPAT SEKALI! +100"
    ("IMG_8236", 138.0, "fix", "Soalan 2/10 · kata nama am", "", "Pasar malam", "pasar malam", 4.5, "left", GREEN),
]

# Sound effects at scene-local times inside graphics scenes: scene -> [(time, file, gain_db)]
SFX = {
    "s01": [(1.9, "riser", -10), (3.85, "impact-bass-1", -8), (13.0, "whoosh-cinematic", -12), (30.0, "whoosh", -16),
            (46.4, "whoosh-cinematic", -14)],
    "s02": [(0.05, "whoosh-cinematic", -10), (0.45, "impact-bass-2", -12), (5.6, "whoosh", -14), (24.6, "whoosh-short", -14),
            (47.8, "pop", -14)],
    "s04": [(0.05, "whoosh-cinematic", -10), (0.6, "impact-bass-1", -13), (18.0, "whoosh", -14), (23.8, "sparkle", -14),
            (30.6, "whoosh-short", -14), (39.6, "pop", -15), (40.1, "pop", -15), (40.6, "pop", -15)],
    "s06": [(0.05, "glitch-1", -12), (0.4, "whoosh-cinematic", -12), (14.4, "whoosh", -14), (22.0, "glitch-2", -16),
            (38.8, "glitch-3", -14)],
    "s07": [(0.05, "whoosh-cinematic", -10), (0.15, "impact-bass-2", -12), (6.0, "pop", -14), (7.6, "pop", -14), (9.2, "pop", -14),
            (22.0, "key-press", -16), (30.8, "error", -16), (42.2, "ping", -12), (45.0, "impact-bass-1", -10),
            (49.0, "chime", -12), (58.4, "whoosh", -14)],
    "s09": [(0.05, "whoosh-cinematic", -12), (1.4, "pop", -14), (7.8, "pop", -15), (14.2, "pop", -15), (20.6, "pop", -15),
            (31.4, "whoosh-short", -14)],
    "s10": [(0.0, "whoosh-cinematic", -12), (10.2, "sparkle", -14)],
}
# Label SFX: a soft click/pop when each card lands (output-relative to label start).
LABEL_SFX = {"chapter": ("whoosh-short", -18, 0.05), "note": ("click-soft", -20, 0.1), "fix": ("pop", -18, 1.8)}

MUSIC_GAIN_DB = {"graphics": -15.0, "footage": -27.0}
# Per-scene music gain over graphics, measured so every explanation scene lands near -19 LUFS (dialogue ~ -16).
SCENE_MUSIC_GAIN_DB = {"s01": -14.5, "s02": -14.5, "s04": -11.0, "s06": -8.0, "s07": -12.0, "s09": -9.5, "s10": -9.5}


def snap(t):
    return round(t * FPS) / FPS


def build():
    timeline, t = [], 0.0
    for seg in SEGMENTS:
        seg_start = t
        for p in seg["parts"]:
            if p["kind"] == "footage":
                p["in"], p["out"] = snap(p["in"]), snap(p["out"])
                cuts = sorted((snap(a), snap(b)) for a, b in p.get("cuts", []))
                edges = [p["in"]] + [x for c in cuts for x in c] + [p["out"]]
                p["ranges"] = [[edges[i], edges[i + 1]] for i in range(0, len(edges), 2)]
                p["xf"] = XF
                dur = snap(sum(b - a for a, b in p["ranges"]) - XF * (len(p["ranges"]) - 1))
            else:
                dur = snap(p["dur"])
            p["dur_out"] = dur
            p["t_out"] = snap(t)
            t = snap(t + dur)
        timeline.append({"id": seg["id"], "title": seg["title"], "start": seg_start, "end": t, "music": seg["music"]})
    labels = []
    for i, (src, st, kind, tag, text, wrong, right, dur, align, accent) in enumerate(LABELS):
        hit = None
        for seg in SEGMENTS:
            for p in seg["parts"]:
                if p["kind"] == "footage" and p["src"] == src and p["in"] <= st < p["out"]:
                    hit = (seg, p)
        assert hit, (src, st)
        seg, p = hit
        acc = 0.0
        for k, (a, b) in enumerate(p["ranges"]):
            if a <= st < b:
                local = snap(acc + (st - a))
                room = (b - st) - (XF if k < len(p["ranges"]) - 1 else 0.0)
                break
            acc += (b - a) - XF
        else:
            raise AssertionError(f"label {src}@{st} falls inside a cut")
        dur = min(dur, room, p["dur_out"] - local)
        assert dur >= 3.0, (src, st, dur)
        labels.append({"id": f"L{i:02d}", "segment": seg["id"], "src": src, "src_time": st, "local": local,
                       "t_out": snap(p["t_out"] + local), "dur": snap(dur), "kind": kind,
                       "vars": {"kind": kind, "tag": tag, "text": text, "wrong": wrong, "right": right,
                                "align": align, "accent": accent, "dur": dur}})
    return timeline, labels, t


def fmt(s):
    m, s = divmod(s, 60)
    return f"{int(m):02d}:{s:05.2f}"


def main():
    timeline, labels, total = build()
    edl = {"fps": FPS, "total": total, "segments": SEGMENTS, "timeline": timeline, "labels": labels,
           "sfx": SFX, "label_sfx": LABEL_SFX, "music_gain_db": MUSIC_GAIN_DB,
           "scene_music_gain_db": SCENE_MUSIC_GAIN_DB}
    (ROOT / "footage/edit").mkdir(parents=True, exist_ok=True)
    (ROOT / "footage/edit/edl.json").write_text(json.dumps(edl, ensure_ascii=False, indent=1))
    rows = [dict(l["vars"], output=f"renders/{l['id']}.webm") for l in labels]
    (ROOT / "overlays/batch.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))

    md = ["# Timeline — DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4", "",
          f"Jumlah durasi: **{fmt(total)}** ({total:.1f} s) · 1920×1080 · 30 fps", "",
          "## Ringkasan durasi setiap segmen", "", "| Segmen | Tajuk | Mula | Tamat | Durasi | Sumber |", "|---|---|---|---|---|---|"]
    for seg, tl in zip(SEGMENTS, timeline):
        srcs = ", ".join(f"{p['src']} " + " + ".join(f"{a:.1f}–{b:.1f}" for a, b in p["ranges"]) + "s" if p["kind"] == "footage" else f"grafik `{p['scene']}`"
                         for p in seg["parts"])
        md.append(f"| {seg['id']} | {seg['title']} | {fmt(tl['start'])} | {fmt(tl['end'])} | {fmt(tl['end'] - tl['start'])} | {srcs} |")
    foot = sum(p["dur_out"] for s in SEGMENTS for p in s["parts"] if p["kind"] == "footage")
    md += ["", f"Rakaman sebenar: {fmt(foot)} · Grafik penerangan: {fmt(total - foot)}", "",
           "## Label pada rakaman (masa dalam video akhir)", "", "| Masa | Segmen | Jenis | Teks |", "|---|---|---|---|"]
    for l in labels:
        v = l["vars"]
        txt = f"{v['wrong']} → {v['right']}" if v["kind"] == "fix" else v["text"]
        md.append(f"| {fmt(l['t_out'])} | {l['segment']} | {v['tag']} | {txt} |")
    (ROOT / "docs/TIMELINE.md").write_text("\n".join(md) + "\n")
    for tl in timeline:
        print(f"{tl['id']}  {fmt(tl['start'])} – {fmt(tl['end'])}  ({fmt(tl['end'] - tl['start'])})  {tl['title']}")
    print("TOTAL", fmt(total), f"labels={len(labels)}")


if __name__ == "__main__":
    main()
