"""Voiceover + timing for the explainer.

Reads explainer/narration.json and, for every line, uses (in order of preference):
  1. a recorded take at explainer/vo-recorded/<line id>.<wav|m4a|mp3|…>   (your own voice)
  2. a synthetic take generated with Kokoro TTS               (needs the model files)

Writes explainer/vo/<line id>.wav (mono, 24 kHz) and explainer/timing.json, which
the animation and the soundtrack both read, so every scene follows the narration.

  python3 scripts/voice.py            # (re)generate missing synthetic lines, rebuild timing
  python3 scripts/voice.py --force    # regenerate every synthetic line
"""
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXP = os.path.join(ROOT, "explainer")
VO = os.path.join(EXP, "vo")
REC = os.path.join(EXP, "vo-recorded")
MODEL = os.environ.get("KOKORO_MODEL", os.path.join(ROOT, "build", "tts", "kokoro-v1.0.onnx"))
VOICES = os.environ.get("KOKORO_VOICES", os.path.join(ROOT, "build", "tts", "voices-v1.0.bin"))
SR = 24000

force = "--force" in sys.argv
cfg = json.load(open(os.path.join(EXP, "narration.json")))
os.makedirs(VO, exist_ok=True)

kokoro = None


def tts(text):
    global kokoro
    if kokoro is None:
        from kokoro_onnx import Kokoro
        kokoro = Kokoro(MODEL, VOICES)
    samples, sr = kokoro.create(text, voice=cfg["voice"], speed=cfg["speed"], lang="en-us")
    if sr != SR:
        x = np.linspace(0, len(samples) - 1, int(len(samples) * SR / sr))
        samples = np.interp(x, np.arange(len(samples)), samples)
    return samples.astype(np.float32)


def trim(x, thresh=0.01, pad=0.04):
    """Cut leading/trailing silence so gaps between lines are ours to set."""
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


def recorded(line_id):
    """Find a recorded take in any common format; convert non-WAV files with ffmpeg."""
    if not os.path.isdir(REC):
        return None
    for name in sorted(os.listdir(REC)):
        stem, ext = os.path.splitext(name)
        if stem != line_id:
            continue
        src = os.path.join(REC, name)
        if ext.lower() in (".wav", ".flac", ".ogg"):
            return src
        tmp = os.path.join(ROOT, "build", "vo-converted", line_id + ".wav")
        os.makedirs(os.path.dirname(tmp), exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), tmp], check=True)
        return tmp
    return None


t = 0.0
scenes = []
for sc in cfg["scenes"]:
    start = t
    t += sc["lead"]
    lines = []
    for i, ln in enumerate(sc["lines"]):
        out = os.path.join(VO, ln["id"] + ".wav")
        rec = recorded(ln["id"])
        if rec:
            x, sr = sf.read(rec, dtype="float32", always_2d=True)
            x = x.mean(axis=1)
            if sr != SR:
                xi = np.linspace(0, len(x) - 1, int(len(x) * SR / sr))
                x = np.interp(xi, np.arange(len(x)), x).astype(np.float32)
            x = trim(x)
            x = x * (0.9 / (float(np.max(np.abs(x))) or 1.0))
            sf.write(out, x, SR, subtype="PCM_16")
            src = "recorded"
        elif force or not os.path.exists(out):
            x = trim(tts(ln["text"]))
            peak = float(np.max(np.abs(x))) or 1.0
            x = x * (0.9 / peak)
            sf.write(out, x, SR, subtype="PCM_16")
            src = "kokoro"
        else:
            x, _ = sf.read(out, dtype="float32")
            src = "cached"
        dur = len(x) / SR
        lines.append({"id": ln["id"], "text": ln["text"], "start": round(t, 3), "end": round(t + dur, 3), "src": src})
        print(f"{ln['id']:>3}  {dur:5.2f}s  {src:8}  {ln['text'][:60]}")
        t += dur + (cfg["gap"] if i < len(sc["lines"]) - 1 else 0)
    t += sc["tail"]
    scenes.append({"id": sc["id"], "start": round(start, 3), "end": round(t, 3), "lines": lines})

json.dump({"duration": round(t, 3), "sampleRate": SR, "scenes": scenes}, open(os.path.join(EXP, "timing.json"), "w"), indent=1)
print(f"\ntotal {t:.1f}s  →  explainer/timing.json")
