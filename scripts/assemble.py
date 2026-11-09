"""Assemble the final documentary from footage/edit/edl.json.

Stages (each cached; delete the output to redo it):
  gfx     render each HyperFrames scene (graphics/) to footage/edit/gfx/<scene>.mp4
  clips   per-part video: footage graded + labels overlaid, graphics normalised  -> footage/edit/clips/NN.mp4
  audio   dialogue (per-part extract), music bed (looped, ducked), SFX (peak-aligned), mix + 2-pass loudnorm
  mux     concat video (stream copy) + mixed audio -> DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4
  preview 720p preview copy

Run with a Python that has numpy + soundfile:  python scripts/assemble.py [stage ...]
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
FOOT = ROOT / "footage"
EDIT = FOOT / "edit"
EDL = json.loads((EDIT / "edl.json").read_text())
FPS, SR = EDL["fps"], 48000
TOTAL = EDL["total"]
SFX_DIR = Path("/root/.claude/plugins/cache/hyperframes/hyperframes/0.9.26/skills/media-use/audio/assets/sfx")
OUT_NAME = "DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU_FINAL.mp4"
NAVY = "0x071229"
GRADE = ("eq=contrast=1.07:saturation=0.93:gamma=0.97,"
         "colorbalance=rs=-0.02:bs=0.035:rm=-0.01:bm=0.015:rh=0.01:bh=-0.01")
VENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-g", "60", "-profile:v", "high", "-video_track_timescale", "15360"]


def run(cmd, **kw):
    print("+", " ".join(str(c) for c in cmd)[:240], flush=True)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def parts():
    """Flatten segments into ordered parts with segment-boundary flags."""
    out = []
    for seg in EDL["segments"]:
        ps = seg["parts"]
        for i, p in enumerate(ps):
            q = dict(p, seg=seg["id"], music=seg["music"], first=(i == 0), last=(i == len(ps) - 1))
            out.append(q)
    for i, q in enumerate(out):
        q["idx"] = i
        q["prev_kind"] = out[i - 1]["kind"] if i else None
        q["next_kind"] = out[i + 1]["kind"] if i + 1 < len(out) else None
    return out


# ---------------------------------------------------------------- gfx
def stage_gfx():
    d = EDIT / "gfx"; d.mkdir(exist_ok=True)
    for p in parts():
        if p["kind"] != "graphics":
            continue
        out = d / f"{p['scene']}.mp4"
        if out.exists() and out.stat().st_size > 0:
            continue
        run(["npx", "hyperframes", "render", ".", "--start", p["start"], "--end", p["start"] + p["dur"],
             "--crf", "14", "-o", out, "--quiet"], cwd=ROOT / "graphics")


# ---------------------------------------------------------------- clips
def stage_clips():
    d = EDIT / "clips"; d.mkdir(exist_ok=True)
    labels = EDL["labels"]
    for p in parts():
        out = d / f"{p['idx']:02d}.mp4"
        if out.exists() and out.stat().st_size > 0:
            continue
        D = p["dur_out"]
        if p["kind"] == "graphics":
            run(["ffmpeg", "-v", "error", "-y", "-i", EDIT / "gfx" / f"{p['scene']}.mp4", "-t", f"{D:.4f}", "-an",
                 "-vf", f"fps={FPS},format=yuv420p", *VENC, out])
            continue
        mine = [l for l in labels if l["src"] == p["src"] and p["in"] <= l["src_time"] < p["out"]]
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{p['in']:.4f}", "-t", f"{D:.4f}", "-i", FOOT / f"{p['src']}.MOV"]
        fc = [f"[0:v]scale=1920:1080:flags=lanczos,fps={FPS},{GRADE},format=yuv420p,setpts=PTS-STARTPTS[v0]"]
        last = "v0"
        for k, l in enumerate(mine, start=1):
            cmd += ["-c:v", "libvpx-vp9", "-i", ROOT / "overlays" / "renders" / f"{l['id']}.webm"]
            T = l["local"]
            fc.append(f"[{k}:v]trim=0:{l['dur']:.3f},setpts=PTS-STARTPTS+{T:.4f}/TB[o{k}]")
            fc.append(f"[{last}][o{k}]overlay=0:0:eof_action=pass:format=auto[v{k}]")
            last = f"v{k}"
        # soft dips: longer at segment boundaries next to graphics, short between camera clips
        fin = 0.35 if p["prev_kind"] == "graphics" or p["first"] else 0.12
        fout = 0.35 if p["next_kind"] == "graphics" or p["last"] else 0.12
        fc.append(f"[{last}]fade=t=in:st=0:d={fin}:color={NAVY},fade=t=out:st={D - fout:.4f}:d={fout}:color={NAVY},format=yuv420p[vout]")
        cmd += ["-filter_complex", ";".join(fc), "-map", "[vout]", "-an", "-t", f"{D:.4f}", *VENC, out]
        run(cmd)


# ---------------------------------------------------------------- audio
def load_mono(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def db(x):
    return 10 ** (x / 20)


def loop_to(clip, n, xf):
    """Crossfade-loop a clip to n samples."""
    out = np.zeros(n, np.float32)
    ramp = np.linspace(0, 1, xf, dtype=np.float32)
    pos, step = 0, len(clip) - xf
    while pos < n:
        seg = clip.copy()
        if pos > 0:
            seg[:xf] *= ramp
        seg[-xf:] *= ramp[::-1]
        end = min(n, pos + len(seg))
        out[pos:end] += seg[: end - pos]
        pos += step
    return out


def stage_audio():
    ad = EDIT / "audio"; ad.mkdir(exist_ok=True)
    N = int(round(TOTAL * SR))
    # 1) dialogue: footage audio in place, silence over graphics
    dlg = np.zeros(N, np.float32)
    for p in parts():
        if p["kind"] != "footage":
            continue
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{p['in']:.4f}", "-t", f"{p['dur_out']:.4f}",
                              "-i", str(FOOT / f"{p['src']}.MOV"), "-vn", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                             check=True, capture_output=True).stdout
        a = np.frombuffer(raw, dtype=np.float32).copy()
        fi = int(SR * (0.3 if p["first"] else 0.03)); fo = int(SR * (0.3 if p["last"] else 0.03))
        a[:fi] *= np.linspace(0, 1, fi, dtype=np.float32); a[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)
        s = int(round(p["t_out"] * SR)); e = min(N, s + len(a))
        dlg[s:e] = a[: e - s]
    sf.write(ad / "dialog_raw.wav", dlg, SR, subtype="FLOAT")
    run(["ffmpeg", "-v", "error", "-y", "-i", ad / "dialog_raw.wav", "-af",
         "highpass=f=85,lowpass=f=12000,afftdn=nr=10:nf=-38:tn=1,dynaudnorm=f=400:g=15:p=0.9:m=4:r=0.4",
         "-ar", str(SR), "-c:a", "pcm_f32le", ad / "dialog.wav"])

    # 2) music: one looped bed per segment, faded at the edges, quieter under footage
    music = np.zeros(N, np.float32)
    cache = {}
    for tl, seg in zip(EDL["timeline"], EDL["segments"]):
        mood = tl["music"]
        if mood not in cache:
            src = EDIT / "music" / f"{mood}.wav"
            norm = ad / f"music_{mood}.wav"
            run(["ffmpeg", "-v", "error", "-y", "-i", src, "-af", "loudnorm=I=-20:TP=-2:LRA=11", "-ar", str(SR), "-ac", "1", norm])
            cache[mood] = load_mono(norm)
        s, e = int(round(tl["start"] * SR)), int(round(tl["end"] * SR))
        bed = loop_to(cache[mood], e - s, int(1.5 * SR))
        # per-part gain: louder over graphics, low under footage (further ducked by sidechain)
        gain = np.zeros(e - s, np.float32)
        for p in seg["parts"]:
            ps, pe = int(round(p["t_out"] * SR)) - s, int(round((p["t_out"] + p["dur_out"]) * SR)) - s
            gain[ps:pe] = db(EDL["music_gain_db"][p["kind"]])
        k = int(0.8 * SR)  # smooth gain changes
        gain = np.convolve(gain, np.ones(k, np.float32) / k, mode="same")
        fi, fo = int(1.2 * SR), int(2.0 * SR)
        bed[:fi] *= np.linspace(0, 1, fi, dtype=np.float32); bed[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)
        music[s:e] += bed * gain
    sf.write(ad / "music.wav", music, SR, subtype="FLOAT")

    # 3) SFX: peak-aligned one frame after the picture event
    sfx = np.zeros(N, np.float32)
    starts = {p["scene"]: p["t_out"] for p in parts() if p["kind"] == "graphics"}
    events = [(starts[sc] + t, f, g) for sc, lst in EDL["sfx"].items() for (t, f, g) in lst]
    for l in EDL["labels"]:
        f, g, off = EDL["label_sfx"][l["kind"]]
        events.append((l["t_out"] + off, f, g))
    clips = {}
    for t, f, g in events:
        if f not in clips:
            c = load_mono(SFX_DIR / f"{f}.mp3")
            thr = 0.5 * np.max(np.abs(c))
            clips[f] = (c, int(np.argmax(np.abs(c) >= thr)))
        c, pk = clips[f]
        s = int(round((t + 1 / FPS) * SR)) - pk
        if s < 0:
            c, s = c[-s:], 0
        e = min(N, s + len(c))
        sfx[s:e] += c[: e - s] * db(g)
    sf.write(ad / "sfx.wav", sfx, SR, subtype="FLOAT")

    # 4) mix: duck music under dialogue, sum, 2-pass loudnorm
    mixf = ("[0:a]aformat=channel_layouts=mono,asplit=2[d1][d2];"
            "[1:a]aformat=channel_layouts=mono[m];"
            "[m][d2]sidechaincompress=threshold=0.015:ratio=8:attack=40:release=600:makeup=1[mduck];"
            "[d1][mduck][2:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89:level=false[mix]")
    run(["ffmpeg", "-v", "error", "-y", "-i", ad / "dialog.wav", "-i", ad / "music.wav", "-i", ad / "sfx.wav",
         "-filter_complex", mixf, "-map", "[mix]", "-ar", str(SR), "-c:a", "pcm_f32le", ad / "mix_pre.wav"])
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(ad / "mix_pre.wav"), "-af",
                        "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    m = json.loads(r[r.rindex("{"): r.rindex("}") + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    run(["ffmpeg", "-v", "error", "-y", "-i", ad / "mix_pre.wav", "-af", f"{ln},aformat=channel_layouts=stereo",
         "-ar", str(SR), "-c:a", "aac", "-b:a", "192k", ad / "mix.m4a"])


# ---------------------------------------------------------------- mux
def stage_mux():
    lst = EDIT / "clips" / "list.txt"
    lst.write_text("".join(f"file '{p['idx']:02d}.mp4'\n" for p in parts()))
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", EDIT / "video.mp4"])
    run(["ffmpeg", "-v", "error", "-y", "-i", EDIT / "video.mp4", "-i", EDIT / "audio" / "mix.m4a", "-map", "0:v", "-map", "1:a",
         "-c", "copy", "-movflags", "+faststart", "-shortest", ROOT / "output" / OUT_NAME])


def stage_preview():
    run(["ffmpeg", "-v", "error", "-y", "-i", ROOT / "output" / OUT_NAME, "-vf", "scale=1280:720", "-c:v", "libx264",
         "-preset", "veryfast", "-crf", "26", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
         ROOT / "output" / "PREVIEW_720p_DOKUMENTASI_PENGAJARAN_BAHASA_MELAYU.mp4"])


if __name__ == "__main__":
    (ROOT / "output").mkdir(exist_ok=True)
    stages = sys.argv[1:] or ["gfx", "clips", "audio", "mux", "preview"]
    for s in stages:
        globals()[f"stage_{s}"]()
