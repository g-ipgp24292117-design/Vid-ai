"""Generate Malay narration with the open VITS-osman model (malaya-speech architecture).

Usage: python3 -I build/tts.py <dir holding vitslite/ (VITS modules from malaya-speech)> <model dir> <project dir>
Writes assets/vo/<id>.wav and build/vo.json (durations in seconds).
"""
import json, os, re, sys

libdir, model_dir, proj = sys.argv[1:4]
sys.path.insert(0, libdir)

import numpy as np
import soundfile as sf
import torch

from vitslite.model_infer import SynthesizerTrn
from vitslite.commons import intersperse

_pad, _start, _eos = 'pad', 'start', 'eos'
_punctuation = "!'(),.:;? "
_special = '-'
_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
SYMBOLS = [_pad, _start, _eos] + list(_special) + list(_punctuation) + list(_letters)


class H(dict):
    def __getattr__(self, k):
        v = self[k]
        return H(v) if isinstance(v, dict) else v


cfg = H(json.load(open(os.path.join(model_dir, 'config.json'))))
model = SynthesizerTrn(
    len(SYMBOLS),
    cfg.data.filter_length // 2 + 1,
    cfg.train.segment_size // cfg.data.hop_length,
    n_speakers=cfg.data.n_speakers,
    **cfg.model,
).eval()
model.load_state_dict(torch.load(os.path.join(model_dir, 'model.pth'), map_location='cpu', weights_only=True))
SR = cfg.data.sampling_rate


def ids_for(text):
    s = text.replace(':', ',').replace(';', ',')
    s = re.sub(r'\s+', ' ', s).strip()
    if s[-1] not in '.,?!':
        s += '.'
    s = ''.join(c for c in s if c in SYMBOLS)
    ids = [SYMBOLS.index(c) for c in s]
    ids = intersperse(ids, 0)
    return torch.LongTensor(ids).unsqueeze(0)


def synth(text, length_scale):
    x = ids_for(text)
    with torch.no_grad():
        audio = model.infer(x, torch.LongTensor([x.size(1)]), noise_scale=0.0,
                            noise_scale_w=0.0, length_scale=length_scale)
    y = audio[0].squeeze().numpy().astype(np.float32)
    # trim leading/trailing silence
    thr = 0.01 * np.max(np.abs(y))
    nz = np.where(np.abs(y) > thr)[0]
    if len(nz):
        y = y[max(0, nz[0] - int(0.03 * SR)): nz[-1] + int(0.08 * SR)]
    return y


script = json.load(open(os.path.join(proj, 'build/script.json')))
jobs = []
for l in script['intro']['lines']:
    jobs.append((l['id'], l['text']))
for c in script['cases']:
    for k, t in c['vo'].items():
        jobs.append((f"c{c['n']}_{k}", t))
for l in script['outro']['lines']:
    jobs.append((l['id'], l['text']))

only = set(sys.argv[4:])
out_dir = os.path.join(proj, 'assets/vo')
os.makedirs(out_dir, exist_ok=True)
meta_path = os.path.join(proj, 'build/vo.json')
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
for jid, text in jobs:
    if only and jid not in only:
        continue
    # sentences read as the wrong/right evidence are read a touch slower
    ls = 1.08 if jid.endswith('_wrong') or jid.endswith('_correct') else 1.0
    y = synth(text, ls)
    peak = np.max(np.abs(y))
    y = y / peak * 0.89
    sf.write(os.path.join(out_dir, f'{jid}.wav'), y, SR)
    meta[jid] = round(len(y) / SR, 3)
    print(jid, meta[jid], text, flush=True)
json.dump(meta, open(meta_path, 'w'), indent=1)
