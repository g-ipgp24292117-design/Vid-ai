"""Background bed with MusicGen-small (transformers, safetensors weights).
Usage: python3 build/music.py  -> assets/music/part_a.wav, part_b.wav
"""
import os
import numpy as np
import soundfile as sf
import torch
from transformers import AutoProcessor, MusicgenForConditionalGeneration

PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
torch.manual_seed(11)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small", use_safetensors=True).eval()
sr = model.config.audio_encoder.sampling_rate
prompts = {
    "part_a": "mysterious detective investigation underscore, ticking pulse, dark futuristic synth arpeggio, soft sub bass, suspenseful, cinematic documentary, 100 bpm, no vocals",
    "part_b": "futuristic high-tech investigation theme, pulsing synth bass, light electronic percussion, suspense building, cinematic, 100 bpm, no vocals",
}
os.makedirs(os.path.join(PROJ, "assets/music"), exist_ok=True)
for name, prompt in prompts.items():
    inp = proc(text=[prompt], padding=True, return_tensors="pt")
    with torch.no_grad():
        audio = model.generate(**inp, do_sample=True, guidance_scale=3.0, max_new_tokens=1500)
    y = audio[0, 0].numpy().astype(np.float32)
    y = y / np.max(np.abs(y)) * 0.9
    sf.write(os.path.join(PROJ, f"assets/music/{name}.wav"), y, sr)
    print(name, len(y) / sr, flush=True)
