# Offline plan (one page)

Decision (14 Nov training): **a minimum offline mode is never cut.** Everything else about offline (sync, IndexedDB)
is cut-first. We never claim more than the table below says, and we never claim offline voice input.

## Should work with no internet today (by design; not yet tested with the network switched off)

| What | Why it works | Evidence so far (online tests) |
|---|---|---|
| Answering a form that is already open | No network calls; the module is plain JavaScript in the page | Code review: the module makes no network requests (no fetch, XHR, beacon or socket); an automated check is planned |
| Answers kept after every question | Saved on the device (`savanna-onboarding.draft.*` in localStorage) before moving on | Autosave and reload tests |
| Coming back later, on the same phone | The draft is reloaded; "Welcome back" is announced | Resume tests |
| Ethiopian calendar, validation, check your answers | Worked out on the device | Unit and journey tests |
| Settings (text size, contrast, language) | Stored on the device | Settings tests |
| Job filter by Support Passport | Runs on the device | Jobs filter test |

**Not yet:** opening the page for the first time, or reloading it, without a connection. The browser still needs to
download the files. That is what we add next.

## What we will add (Phase 6 minimum)

1. **Answers saved on the device first** (done for drafts). Completed records stay on the device until the host
   sends them; the host is told whether it is online.
2. **The module cached for offline use:** a small service worker caches `savanna-onboarding.js`, `forms.js`, the
   fonts (Poppins and Noto Sans Ethiopic, about 260 KB in total) and the demo page, so they open again with no
   connection.
3. **Recorded audio cached:** reviewed Amharic and English question recordings (Phase 4) are cached with the module,
   so read-aloud works offline without depending on a device voice.
4. **Clear offline status:** a short message such as "You are offline. Your answers are saved on this phone." in a
   polite status region, in Amharic and English.

Later, only if time allows: IndexedDB instead of localStorage, and background sync to the host.

## Never works offline

| What | Why |
|---|---|
| **Voice input** (speech to text) | The browser sends the audio to a cloud service (Google). With no connection, the microphone button explains this and the learner types or taps instead. A future local engine (for example Addis AI, if it runs on the device) would be needed to change this. |
| Device read-aloud in Amharic | Depends on the phone having an Amharic voice, which most do not; recorded audio is the offline path |
| Sending answers to the host's server | Needs a connection; answers wait on the device |
| ID checks | Not offered at all, online or offline |

## How we will test it (Phase 9)

Chrome DevTools "Offline" and a 3G-speed profile; the cheapest Android phone the team can borrow, in flight mode
after one visit. Results go into `docs/conformance-report.md` and `DEVELOPMENT_PROGRESS.md`.
