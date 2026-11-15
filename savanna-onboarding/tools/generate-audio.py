"""Generates the demo Amharic clips from docs/audio-script.md with Microsoft's Amharic neural voice.

Demo audio only: it uses edge-tts, an unofficial tool that calls the voice behind Microsoft Edge's "Read aloud".
It will be replaced with human recordings, or Microsoft's official Azure Speech service, in the hardening sprint.

Run from savanna-onboarding/ after any wording change:

    node tools/audio-script.cjs          # 1. rebuild the clip list from the live text
    pip install edge-tts                 # 2. once
    python tools/generate-audio.py       # 3. generate, convert (ffmpeg) and check

The clips are first written to a temporary folder (with the exact file names from the script), then passed
through tools/convert-audio.cjs (mono MP3, 44.1 kHz, 80 kbps, even loudness), which also runs tools/check-audio.cjs
and writes assets/audio/manifest.json. Without ffmpeg, use --no-convert: edge-tts's own mono MP3 files
(24 kHz, 48 kbps) are copied as they are and the check still runs.

Options:
  --voice am-ET-MekdesNeural   main voice (female). am-ET-AmehaNeural (male) is used only if a clip fails with Mekdes.
  --rate -10%                  speaking speed (slower is clearer for first-time listeners)
  --only key1,key2             generate only these clips (file names without .mp3)
  --out <folder>               temporary folder (default: a new folder in the system temp directory)
  --no-convert                 skip ffmpeg; copy the edge-tts MP3 files straight into assets/audio/am/
Amharic only: Microsoft has no Afaan Oromo voice, so Oromo stays text only (plus the phone's voice, if it has one).
"""
import argparse
import asyncio
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SCRIPT = os.path.join(ROOT, 'docs', 'audio-script.md')
FALLBACK = 'am-ET-AmehaNeural'
ROW = re.compile(r'^\|\s*(\d+)\s*\|\s*`am/([a-z0-9-]+)\.mp3`\s*\|\s*(?:<span[^>]*>)?(.*?)(?:</span>)?\s*\|')


def clips():
    out = []
    with open(SCRIPT, encoding='utf-8') as fh:
        for line in fh:
            m = ROW.match(line)
            if m:
                out.append((m.group(2), m.group(3).replace('\\|', '|').strip()))
    return out


async def say(text, voice, rate, dest):
    import edge_tts
    tmp = dest + '.part'
    await edge_tts.Communicate(text, voice, rate=rate).save(tmp)
    if not os.path.exists(tmp) or os.path.getsize(tmp) < 1000:
        raise RuntimeError('no audio returned')
    os.replace(tmp, dest)


async def generate(items, out, voice, rate, tries=8):
    """The free service often returns no audio at random (it limits fast callers). Each clip is retried with a
    growing wait before the fallback voice is tried, so the clips stay in one voice. Clips already in `out` are
    kept, so an interrupted run can simply be started again with the same --out."""
    used = {}
    for i, (key, text) in enumerate(items, 1):
        dest = os.path.join(out, key + '.mp3')
        if os.path.exists(dest) and os.path.getsize(dest) >= 1000:
            used[key] = voice
            print(f'  kept {i:3}/{len(items)} {key}.mp3 (already generated)')
            continue
        for v in (voice, FALLBACK) if voice != FALLBACK else (voice,):
            ok, err = False, None
            for attempt in range(tries):
                try:
                    await asyncio.wait_for(say(text, v, rate, dest), 60)
                    ok = True
                    break
                except Exception as e:  # no audio or network hiccup: wait and try again
                    err = e
                    await asyncio.sleep(min(5 * (attempt + 1), 30))
            if ok:
                used[key] = v
                print(f'  ok   {i:3}/{len(items)} {key}.mp3 ({os.path.getsize(dest) // 1024} KB, {v})', flush=True)
                await asyncio.sleep(1)  # gentle pace for the free service
                break
            print(f'  {v} failed for {key}: {err}')
        else:
            print(f'  FAIL {key}: no voice worked')
    return used


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--voice', default='am-ET-MekdesNeural')
    ap.add_argument('--rate', default='-10%')
    ap.add_argument('--only', default='')
    ap.add_argument('--out', default='')
    ap.add_argument('--no-convert', action='store_true')
    a = ap.parse_args()
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        sys.exit('edge-tts is not installed. Run:  pip install edge-tts')

    items = clips()
    if not items:
        sys.exit('No Amharic clips found in docs/audio-script.md. Run: node tools/audio-script.cjs')
    if a.only:
        want = set(a.only.split(','))
        items = [c for c in items if c[0] in want]
    out = a.out or tempfile.mkdtemp(prefix='savanna-audio-')
    os.makedirs(out, exist_ok=True)
    print(f'Generating {len(items)} clips with {a.voice} (rate {a.rate}) into {out}\n')
    used = asyncio.run(generate(items, out, a.voice, a.rate))
    fallback = [k for k, v in used.items() if v != a.voice]
    print(f'\nGenerated {len(used)} of {len(items)} clips.' + (f' With {FALLBACK}: {", ".join(fallback)}' if fallback else ''))
    if len(used) < len(items):
        print('Some clips failed. Run again (only the missing ones with --only) before converting.')

    if a.no_convert:
        dest = os.path.join(ROOT, 'assets', 'audio', 'am')
        os.makedirs(dest, exist_ok=True)
        for key in used:
            shutil.copyfile(os.path.join(out, key + '.mp3'), os.path.join(dest, key + '.mp3'))
        print(f'Copied {len(used)} clips to assets/audio/am/ without conversion.\n')
        r = subprocess.run(['node', os.path.join('tools', 'check-audio.cjs')], cwd=ROOT)
    else:
        r = subprocess.run(['node', os.path.join('tools', 'convert-audio.cjs'), out], cwd=ROOT)
    sys.exit(r.returncode or (0 if len(used) == len(items) else 1))


if __name__ == '__main__':
    main()
