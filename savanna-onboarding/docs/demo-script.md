# Demo script — 3 minutes, one learner journey

**Learner:** Selam, 24, in Addis Ababa. She has low vision and prefers Amharic. She came to Ethiopia as a refugee and
has a proof-of-registration paper, not a Fayda ID. She uses a cheap Android phone.

**Setup before the pitch:** live site open on a phone (mirrored to the screen) at
https://savanna-accessible-onboarding.vercel.app, refreshed twice, data cleared (My profile → Delete my data, or a new
private tab), language Amharic, sound on, volume up. A second tab on `/test-host/`. Open the site once before the pitch
so it also works if the Wi-Fi fails (offline after one visit).

| Time | Show (tap) | Say |
|---|---|---|
| 0:00–0:20 | Savanna home: the one header bar, open **Accessibility ▾** (Larger text, High contrast, Stop motion, Automatic reading) | "On 21 October, co-designers told us: forms time out, refugees are asked for ID they don't have, help is English only, and job boards break with screen readers. This is Selam's sign-up for Savanna, inside Savanna's own pages." |
| 0:20–0:40 | Choose **Listen and respond** → **Sign up** | "Selam chooses how to answer, never why. With automatic reading on, every page and every step reads a short summary and the question when it opens, in Amharic, English or Afaan Oromo." |
| 0:40–1:00 | First question reads by itself; press **Listen** on one answer; show **Now reading… Pause · Stop** at the bottom; press Escape | "Recorded Amharic first, then Addis AI, an Ethiopian speech service, then the phone's own voice. Audio is never required, and Escape stops it at once." |
| 1:00–1:20 | "What should we call you?" → **Answer by voice** (consent names Addis AI) → it reads back "I heard: …" → **Spell it** → **Use this answer** | "Voice gets Ethiopian names wrong, so it reads back what it heard and can spell it. Nothing is used until she checks it. She could also ask someone to type it." |
| 1:20–1:35 | Phone number → type it → **Read back my answer** | "Phone numbers are shown and read the Ethiopian way, 0911 23 45 67, 'zero nine eleven, twenty-three…', and only on the phone: a personal number never goes to a cloud voice." |
| 1:35–1:50 | Check your answers → **Create my account** → dashboard: **Add your ID (optional)** → **Refugee ID or proof of registration** | "Sign-up asks no ID at all. She can start learning now and add an ID later, from six routes or none. Every badge is honest: self-declared, never 'verified'." |
| 1:50–2:10 | **Support Passport**: "No documents needed." → choose two needs → "Only me" is preselected → Save → **Read all my answers** | "No medical proof, no diagnosis: the Support Passport asks what helps her learn and work. Private by default." |
| 2:10–2:30 | **Jobs** → filter "only jobs that offer all the support I need" → **Listen to this job** (English job text, Amharic labels) → **Apply** → confirmation "Your application was sent to …", "Support Passport: shared / not shared" | "The filter runs on her phone. Mixed text is read in its own language. She shares support needs only for this job, and can withdraw it later." |
| 2:30–2:45 | Switch to `/test-host/` → **Mount** → "Events the host received" | "For Savanna it is two script tags and one `mount()` call, or `docker compose up`. Jobs go out as schema.org JobPosting. Addis AI is optional, behind the host's own proxy, and the key never reaches the browser." |
| 2:45–3:00 | Back to the slide | "Tested: [N] automated tests and 192 accessibility scans with zero serious or critical issues, the gate task by keyboard at 200% zoom with sound off, plus the team's NVDA, TalkBack and cheap-phone checks. Simulated: log-in and SMS. Next: human Amharic recordings and local speech, so no data leaves the centre." |

**Log-in during the demo (if needed):** Log in → type the phone number used at sign-up → **Send me a code** → the
simulated SMS shows the code on screen → paste or type it → **Log in**. No real SMS is sent.

**If asked:** the conformance report (`docs/conformance-report.md`) separates automated evidence from what people
checked; the privacy review is `docs/privacy-security.md` (what goes to Addis AI or Google, and when); the inventory of
reading on every page and the test results are in `DEVELOPMENT_PROGRESS.md`; how to set the Addis AI key is in the
README.

**Before the pitch, check:** `[N]` in the last line matches the overnight test run (`SUBMISSION.md`); the live site
shows the header bar (refresh twice); Addis AI answers on the live site (Production key set in Vercel); the Amharic
review is merged.
