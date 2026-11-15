# Submission — Savanna Accessible Onboarding Module

Digital Bridge Accessibility Hackathon 2026 (ALX Ethiopia), Track 1: Accessible Onboarding.

**Live demo: https://savanna-accessible-onboarding.vercel.app** (refresh twice to get the newest version)

| Page | What it is |
|---|---|
| `/` | The learner journey inside Savanna's own pages: home → sign up → dashboard → Add your ID → Support Passport → jobs and apply → employer form |
| `/test-host/` | An ordinary page (not Savanna) that installs the module with two script tags and shows what the host receives |
| `/showroom.html` | Developer and test page (all journeys, raw data views) |

## How to log in (simulated)

Log-in is a labelled simulation: there is no server and no SMS. Accounts live on the device.
1. **Sign up first** on the same phone or browser (any name, a phone number such as 0911 23 45 67).
2. Go to **Log in**, type the same phone number, choose **Send me a code**.
3. The "Simulated SMS" box shows the code on the screen: paste or type it, then **Log in**. No time limit.

## How to run it

- **Docker:** `docker compose up`, then http://localhost:8080 (also `/test-host/`, `/showroom.html`).
  Optional, paid: Addis AI speech for Amharic and Afaan Oromo: copy `.env.example` to `.env`, set `ADDIS_API_KEY`, then
  `docker compose --profile addis up`. Without a key everything works with the browser's own speech.
- **Without Docker:** `cd savanna-onboarding && npx --yes serve -l 8080 .`
- **On another site:** two script tags and `SavannaOnboarding.mount('#where', { form: 'signup' })` — see the install
  guide (under an hour).

## Where each deliverable is

| Deliverable | Where |
|---|---|
| D1 Code under the open licence | This repository. **Open item:** [`LICENSE`](LICENSE) is still a placeholder: the licence name announced at kickoff must be filled in |
| D2 README / install in about an hour | [`savanna-onboarding/README.md`](savanna-onboarding/README.md) (install steps, keyboard and ARIA support, real vs simulated, audio tools, Addis AI key) |
| D3 Docker Compose | [`docker-compose.yml`](docker-compose.yml) + [`docker/nginx.conf`](docker/nginx.conf) (`docker compose up`; optional `--profile addis`) |
| D4 WCAG 2.2 AA conformance report | [`savanna-onboarding/docs/conformance-report.md`](savanna-onboarding/docs/conformance-report.md) — automated part complete; "Manual result" column for the team |
| Data and events for hosts (JSON Schema, JobPosting) | [`savanna-onboarding/docs/api-schema.md`](savanna-onboarding/docs/api-schema.md) |
| Architecture | [`savanna-onboarding/docs/architecture.md`](savanna-onboarding/docs/architecture.md) |
| Demo script | [`savanna-onboarding/docs/demo-script.md`](savanna-onboarding/docs/demo-script.md) |
| Privacy and security review | [`savanna-onboarding/docs/privacy-security.md`](savanna-onboarding/docs/privacy-security.md) |
| Offline plan · developer guide · audio script | [`offline-plan.md`](savanna-onboarding/docs/offline-plan.md) · [`for-developers.md`](savanna-onboarding/docs/for-developers.md) · [`audio-script.md`](savanna-onboarding/docs/audio-script.md) |
| Progress, decisions, test results, reading inventory | [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) · design tokens: [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md) |

## Test summary

Automated (Playwright + axe-core, Chromium, phone and desktop sizes, one worker), on commit `d24af23` (16 Nov):
every affected file passes (302 tests in the last two batches, after updating tests to the new behaviour), and
**192 axe scans (48 screens × 2 languages × 2 sizes), 0 serious or critical**. A full-suite run is the last step
before submitting. The gate task (sign up and save a Support Passport) passes by keyboard only, at 200% zoom
and with sound off, on phone and desktop sizes. Addis AI: checked on the live site (16 Nov):
`/api/tts` returns audio for Amharic and Oromo and `/api/stt` transcribes a real Amharic clip; in a real browser with
no Amharic system voice, turning on automatic reading plays the recorded Amharic clips. Manual checks (NVDA, TalkBack in an Android WebView, co-designer gate, cheapest
Android phone on 3G): the team's results go in the conformance report.

## Known limitations

- **Simulated:** log-in and SMS; the trainer and employer systems (nothing is actually sent; withdrawing changes only
  the copy on the phone). IDs are never verified (honest badges).
- **Amharic and Afaan Oromo text are drafts** for native-speaker review. **Amharic audio is synthetic:** demo Amharic
  audio was generated with Microsoft's Amharic neural voice (edge-tts, an unofficial tool) from our reviewed text; it
  will be replaced with human recordings, or Microsoft's official Azure service, in the hardening sprint.
- **Every fixed text is pre-recorded** (754 clips: Amharic and Afaan Oromo, 28.8 MB); the online voice (Addis AI) is
  used only for dynamic text (names, typed answers, employer-written job text). The Oromo clips were made with
  Addis AI from draft text.
- **NVDA's default Windows voice spells Amharic** letter by letter (mitigations: recorded Amharic, one-tap English,
  `lang` tags, a tip).
- Voice input needs a connection and a browser speech engine; never offered on ID or support-needs questions.
- Browsers allow sound only after an interaction with each page: then "Tap anywhere or press any key to hear this
  page" is shown. Settings has no per-setting Listen button.
- Docker Compose is written and its paths checked, but **not yet run on a machine with Docker**.

## Open items before submitting

1. Fill in [`LICENSE`](LICENSE) with the licence announced at kickoff.
2. The team's manual results in the conformance report (NVDA, TalkBack, co-designer gate, cheap phone on 3G).
3. A clean-machine `docker compose up` check.
