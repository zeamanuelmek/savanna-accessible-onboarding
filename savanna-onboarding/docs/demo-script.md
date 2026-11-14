# Demo script (draft) — 3 minutes, one learner journey

**Learner:** Selam, 24, in Addis Ababa. She has low vision and prefers Amharic. She came to Ethiopia as a refugee and
has a proof-of-registration paper, not a Fayda ID. She uses a cheap Android phone.

**Setup before the pitch:** live site open on a phone (mirrored to the screen) at
https://savanna-accessible-onboarding.vercel.app, data cleared, language Amharic, sound on, volume up. A second tab on
`/test-host/`. If the Wi-Fi fails: the site works offline after one visit (open it once before the pitch).

| Time | Show (click) | Say |
|---|---|---|
| 0:00–0:20 | Savanna home | "On 21 October, co-designers told us: forms time out, refugees are asked for ID they don't have, help is English only, and job boards break with screen readers. This is Selam's sign-up for Savanna, inside Savanna's own pages." |
| 0:20–0:40 | **Sign up** → "How would you like to answer?" → **Listen and respond** | "Selam chooses how to answer, never why. No disability question. Everything stays on her phone until she sends it." |
| 0:40–1:00 | First question: press **Listen** on one answer; show **Pause/Stop** | "Every question and every answer can be read aloud in recorded Amharic, and stopped at any time. Audio is never required." |
| 1:00–1:20 | "What should we call you?" → **Answer by voice** → "I heard…" box → fix one letter → **Use this answer** | "Voice gets Ethiopian names wrong, so we say so, and nothing is used until she checks it. She could also ask someone to type it." |
| 1:20–1:40 | ID question: point at the badges → choose **Refugee ID or proof of registration** → skip the number | "Six ways to prove who you are, or none — a partner can confirm later. Every badge is honest: self-declared, never 'verified'." |
| 1:40–2:00 | Check your answers → **Create my account** → **Tell us what helps you** → choose two needs → "Only me" is preselected → Save | "Her Support Passport asks what helps, never her condition. Private by default." |
| 2:00–2:20 | **Jobs** → tick "only jobs that offer all the support I need" → **Apply** → the sharing question shows exactly what would be shared | "The filter runs on her phone; the job board never learns her needs. She shares with an employer only for this job, and can withdraw it." |
| 2:20–2:40 | Switch to `/test-host/` → **Mount** → show "Events the host received" | "For Savanna it is two script tags and one `mount()` call, or `docker compose up`. Jobs go out as schema.org JobPosting. No server, no paid API." |
| 2:40–3:00 | Back to the slide or the dashboard | "Tested: 164 automated accessibility scans with zero serious issues, the gate task by keyboard at 200% zoom with sound off, and NVDA on Windows — which showed us that its default voice spells Amharic, so we added recorded audio and a one-tap English switch. Simulated: log-in and SMS. Next: local Amharic speech, so voice works offline and no data leaves the centre." |

**If asked:** the conformance report (`docs/conformance-report.md`) separates automated evidence from what people
still have to check; the privacy review is `docs/privacy-security.md`; the cheap-phone 3G numbers are in
`DEVELOPMENT_PROGRESS.md` (Phase 9).

**Before the pitch, check:** recordings added (otherwise Amharic read-aloud shows the "words are on the screen"
message), the Amharic review is merged, and the numbers in the last line still match the latest test run.
