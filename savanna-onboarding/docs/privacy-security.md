# Privacy and security review

Phase 9, 14 Nov 2026. Module version 0.11. Rule: **nothing leaves the host without consent.** Automated evidence:
`tests/security.spec.mjs`, `tests/gate.spec.mjs` (deletion), `tests/voice.spec.mjs`, `tests/identity.spec.mjs`.
A person still has to review this with the team; nothing here replaces a professional security audit.

## 1. What is stored on the phone, and for how long

Everything is in the browser on the learner's phone. There is no server and no database in this project.

| Store | What | Personal? | How long |
|---|---|---|---|
| `savanna-onboarding.prefs` | Language, text size, contrast, how I like to answer, read aloud, pictures | No (preferences; never a reason) | Until changed or the browser data is cleared |
| `savanna-onboarding.voiceConsent` | Yes/no to voice input | No | Until changed in Settings |
| `savanna-onboarding.draft.<form>` | Answers to a form not yet sent, the question reached, a resume code | **Yes** (name, phone, ID type, ID number if typed, date of birth, support needs) | **Deleted when the form is sent.** Otherwise kept until sent or deleted (no automatic expiry yet; see §6) |
| `savanna-onboarding.resume.<code>` | Which draft a "finish later" link belongs to | No | Deleted when the form is sent |
| `savanna-onboarding.profile` | (Demo host) name we call you, full name if given, phone, ID type, honest ID status, referral partner, date of birth, who helped (organisation; staff name only until takeover) | **Yes** | Until "Delete my data" or the browser data is cleared. **The ID number itself is not kept** |
| `savanna-onboarding.passport` | (Demo host) support needs, own words, who can see it | **Yes, sensitive** | Until deleted on the Support Passport card or "Delete my data" |
| `savanna-onboarding.applications` | (Demo host) what each employer received, withdrawals | **Yes** | Until "Delete my data" |
| `savanna-onboarding.jobs`, `.jobFilter` | (Demo host) jobs posted on this phone; filter on/off | No | Until "Delete my data" |
| `savanna-demo.session` | (Demo host) simulated log-in | No | Until log-out or "Delete my data" |
| `sidebar-collapsed` | (Demo host) menu open or closed | No | Until changed |
| Cache Storage `savanna-onboarding-v2` | (Sample service worker) pages, scripts, fonts, styles, recordings played once | No | Until a new version replaces it, or the browser data is cleared |
| Cache Storage `savanna-onboarding-audio` | Recordings the learner chose to download | No | Until "Remove downloaded audio" |

Data is stored as **plain text** in the browser. Anyone with the unlocked phone and its browser can read it. This was
an approved cut (encrypting device storage); the mitigations are deletion on submit, "Delete my data", and keeping
the ID number out of the profile. A shared or borrowed phone is the main risk (see §6).

## 2. What ever leaves the device, and the consent each needs

| What | Where to | When | Consent |
|---|---|---|---|
| **Voice recordings** (speech to text) | The browser's speech service (Google, in Chrome) | Only when the learner presses "Answer by voice" | **Asked before first use**, with the reason ("this browser sends your recording to Google"). Withdrawable in Settings. **Never offered** on ID or support-needs questions, or the date. The text is shown for checking and is not used until "Use this answer" |
| Answers (`savanna-onboarding:complete` event) | **The host page only**, inside the browser | When the learner submits a form | Submitting after "Check your answers". The module itself sends nothing over the network; the host decides what to do (see `api-schema.md`) |
| Support needs to an employer | The host (demo: shown on screen; nothing is sent) | Only if the learner says "yes, share" **for that job** | Per application; the learner sees exactly what would be shared; withdrawable on the card. `supportForEmployer()` enforces it; the learner's own words are never shared |
| Page files (scripts, fonts, styles, recordings) | Downloaded **from the same site** | When pages open; recordings when played or downloaded | Not personal data |

**Checked by a test:** during the whole gate task, no request goes to any other site — no CDN, no analytics, no
Google Fonts, no tracking (`security.spec.mjs`). The Web Speech request is made by the browser itself, only after
consent, and is not visible to page code.

## 3. Deleting and withdrawing

| What the learner wants | Where |
|---|---|
| Delete everything about me on this phone | Dashboard → "Delete my data from this phone" (confirm on the page). Keeps only settings. *Added in Phase 9: the sign-up consent promises "you can change or delete your answers at any time", and the Savanna pages had no delete path* |
| Delete my Support Passport | Support Passport card → "Delete my Support Passport" |
| Stop sharing with ALX trainers | Support Passport card → "Stop sharing with my trainers" |
| Withdraw what an employer was shown | Support Passport card → "Shared with employers" → "Withdraw" (demo: changes the copy on the phone; a live system must tell the employer) |
| Stop voice input | Settings → Voice answers → Not allowed |
| Remove downloaded audio | Settings → "Remove downloaded audio" |
| Change any answer | "Check your answers" → Change; My profile → Change |
| Leave a form half-done | The draft stays on the phone; it is deleted when the form is sent, or with "Delete my data" |

## 4. Secrets

**None in the repository.** `security.spec.mjs` scans every file for private keys, AWS/GitHub/Slack/Google keys,
`sk-` API keys, hard-coded passwords or tokens, and `.env` files: none found. The project needs no keys: no paid API,
no server, no database. Vercel deploys from the public build settings only.

## 5. Security headers

Set in `savanna-onboarding/vercel.json` (live site) and `docker/nginx.conf` (Docker); the test server reads
`vercel.json`, so every automated test runs under the same policy. `security.spec.mjs` checks every page has them and
that no page breaks the policy.

| Header | Value | Why |
|---|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'` | Only this site's own scripts run (no inline scripts, no third parties). `'unsafe-inline'` for styles: the module injects its scoped stylesheet. `data:` fonts: Savanna's stylesheet embeds some. `blob:` media: downloaded recordings |
| X-Content-Type-Options | `nosniff` | No content-type guessing |
| Referrer-Policy | `no-referrer` | Page addresses (e.g. resume codes) are not passed to other sites |
| Permissions-Policy | `microphone=(self), camera=(), geolocation=(), payment=(), usb=()` | Only this site may ask for the microphone, and only for voice answers |
| Cross-Origin-Opener-Policy | `same-origin` | Isolates the window from other sites |
| X-Frame-Options / `frame-ancestors` | `SAMEORIGIN` / `'self'` | The demo cannot be framed by other sites (Savanna would set its own policy when embedding) |
| `sw.js`: Cache-Control | `no-cache` | Service-worker updates are picked up |

HTTPS: Vercel serves HTTPS only (with HSTS). Docker serves plain HTTP on localhost, for local testing only.

**Code-level checks:** every learner answer is escaped before it is shown (`esc()`); the job board's JSON-LD escapes
`<`; no `eval`, no `innerHTML` with unescaped learner text; no third-party scripts. The module never reads cookies.

## 6. Risks and recommendations

1. **Shared phones.** Drafts and the profile are readable by the next person using the same browser. Recommend: a
   "This is a shared phone" choice that keeps nothing after submit; an automatic expiry for unfinished drafts (e.g. 30
   days). Not built.
2. **Plain-text storage** (approved cut). If Savanna keeps data on the device in production, encrypt it, or store it
   on Savanna's server instead.
3. **Voice input uses Google.** Consent covers it; for "no cloud", see "Future: local speech" in `offline-plan.md`.
4. **Resume links** contain only a random code, not personal data; they work only on the same phone.
5. **The simulated log-in is not real authentication.** Savanna must use its own sign-in (and keep it WCAG 3.3.8:
   paste, password managers, no puzzles).
6. **Partner staff names** are kept only until the learner takes over; a partner who never hands over leaves the name
   on the phone. Recommend: a time limit on pending takeovers.
7. **Host responsibility:** the host decides where submitted answers go; it must ask consent before sending anything
   to a server, and store support needs separately with stricter access.
