# Amharic recordings go here

1. Save each clip in **this folder** (`savanna-onboarding/assets/audio/am/`), named **exactly** as in
   `docs/audio-script.md`, for example `signup-name-question.mp3`.
2. Format: **MP3** (recommended: mono, 64–96 kbps, under 300 KB). M4A (AAC) also works.
   **Easiest:** record in any format (WAV, M4A, MP3…), named as in the script, into one folder, then from
   `savanna-onboarding/` run `node tools/convert-audio.cjs "C:\path\to\recordings"`. It converts them all into this
   folder as mono MP3 (80 kbps, even loudness) and runs the check below. It needs ffmpeg (Windows: `winget install Gyan.FFmpeg`).
3. From `savanna-onboarding/`, run `node tools/check-audio.cjs`. It lists found, missing and broken clips and writes
   `assets/audio/manifest.json`, which tells the module which clips exist.
4. Commit the clips **and** `manifest.json` together. A clip that is not in the manifest is never played.
