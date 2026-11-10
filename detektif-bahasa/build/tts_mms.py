"""Malay narration with Meta MMS-TTS (facebook/mms-tts-zlm) through transformers.

Usage: python3 build/tts_mms.py [line ids...]
Writes assets/vo/<id>.wav and build/vo.json (durations in seconds).
"""
import json, os, re, sys

import numpy as np
import soundfile as sf
import torch
from transformers import AutoTokenizer, VitsModel

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = "facebook/mms-tts-zlm"
tok = AutoTokenizer.from_pretrained(MODEL)
model = VitsModel.from_pretrained(MODEL, use_safetensors=True).eval()
SR = model.config.sampling_rate
torch.manual_seed(7)


def synth(text, rate):
    pass
    model.noise_scale = 0.55
    model.noise_scale_duration = 0.7
    parts = [p.strip() for p in re.split(r"(?<=[,.!?])\s+", text) if p.strip()]
    out = []
    for i, p in enumerate(parts):
        clean = re.sub(r"[^a-zA-Z' ]", " ", p.replace("-", " ")).lower()
        clean = re.sub(r"\s+", " ", clean).strip()
        inp = tok(clean, return_tensors="pt")
        with torch.no_grad():
            y = model(**inp, speaking_rate=rate).waveform[0].numpy().astype(np.float32)
        thr = 0.006 * np.max(np.abs(y))
        nz = np.where(np.abs(y) > thr)[0]
        y = y[max(0, nz[0] - int(0.06 * SR)): nz[-1] + int(0.08 * SR)]
        out.append(y)
        if i < len(parts) - 1:
            gap = 0.32 if p.endswith((".", "!", "?")) else 0.16
            out.append(np.zeros(int(gap * SR), np.float32))
    return np.concatenate(out)


script = json.load(open(os.path.join(PROJ, "build/script.json")))
jobs = [(l["id"], l["text"]) for l in script["intro"]["lines"]]
for c in script["cases"]:
    jobs += [(f"c{c['n']}_{k}", t) for k, t in c["vo"].items()]
jobs += [(l["id"], l["text"]) for l in script["outro"]["lines"]]

only = set(sys.argv[1:])
out_dir = os.path.join(PROJ, "assets/vo")
os.makedirs(out_dir, exist_ok=True)
meta_path = os.path.join(PROJ, "build/vo.json")
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
for jid, text in jobs:
    if only and jid not in only:
        continue
    slow = jid.endswith("_wrong") or jid.endswith("_correct")
    y = synth(text, 0.85 if slow else 0.92)
    y = y / np.max(np.abs(y)) * 0.89
    sf.write(os.path.join(out_dir, f"{jid}.wav"), y, SR)
    meta[jid] = round(len(y) / SR, 3)
    print(jid, meta[jid], text, flush=True)
json.dump(meta, open(meta_path, "w"), indent=1)
