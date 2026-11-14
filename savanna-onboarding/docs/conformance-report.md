# WCAG 2.2 AA conformance report — Savanna Accessible Onboarding Module

> **Status: SKELETON. Nothing in this report has been tested yet.** Every result below reads "Not yet tested".
> The report is filled in during Phase 9 and is a required hackathon deliverable (`CLAUDE.md` §11).
> No claim of WCAG 2.2 AA conformance is made until every row has a result with evidence.

## 1. About this report

| Item | Value |
|---|---|
| Product | Savanna Accessible Onboarding Module (web component + demo host page) |
| Version / commit | _to fill in_ |
| Standard | WCAG 2.2, Levels A and AA (55 success criteria; 4.1.1 Parsing is obsolete in WCAG 2.2) |
| Report date | _to fill in_ |
| Evaluated by | _to fill in (names / roles, including co-designers)_ |
| Scope | Learner journeys: welcome, sign-up, Support Passport, jobs, job application, settings. Employer form. Test host page (Phase 8) |
| Out of scope | The Savanna platform itself; third-party browser speech services |

### Result values

- **Supports** — meets the criterion everywhere in scope, with evidence.
- **Partially supports** — some parts do not meet the criterion; the limitations column says which.
- **Does not support** — most of it does not meet the criterion.
- **Not applicable** — nothing in scope that the criterion applies to; the reason is stated.
- **Not yet tested** — no evidence yet. This is the starting value for every row.

## 2. Judging gate (`CLAUDE.md` §11)

| Gate | Expected | Actual | Pass/fail | Evidence |
|---|---|---|---|---|
| Co-designer completes the main task unaided with **NVDA** | Completes without help | Not yet tested | — | |
| … with **TalkBack** (incl. inside an Android WebView) | Completes without help | Not yet tested | — | |
| … with **keyboard only** | Completes without help | Not yet tested | — | |
| … at **200% zoom** | Completes without help | Not yet tested | — | |
| … with **sound off** | Completes without help | Not yet tested | — | |
| **axe-core**: zero critical or serious issues | 0 | Not yet tested (for the final build) | — | |
| Conformance report submitted | This file, completed | Not yet tested | — | |

Main task: _to be agreed by the team (proposed: sign up and save a Support Passport)._

## 2a. The 21 October co-design findings

| Finding | How the module addresses it | Related criteria | Evidence |
|---|---|---|---|
| Forms timed out | No time limits; answers saved on the device after every question; "Finish later" | 2.2.1 | Autosave and resume tests (E1); not yet tested with co-designers |
| Refugees were asked for ID they don't have | Six ID routes incl. refugee ID / proof of registration and "refer me through a partner"; ID number optional; no ID photo; never "verified" | 3.3.2 | Sign-up journey tests (E1) |
| Help was English only | All text in Amharic and English; language switch and help in the same place on every screen | 3.1.1, 3.1.2, 3.2.6 | Language-of-parts checks (E1); Amharic review pending |
| Job boards broke under screen readers | Job titles as headings, named "Apply" links, count announced, native checkbox filter | 1.3.1, 2.4.4, 2.4.6, 4.1.3 | Automated (E1); NVDA (E2) and TalkBack (E3) to do |

## 3. Test environments

| Assistive technology / setting | Browser / device | Version | Tested by | Date |
|---|---|---|---|---|
| NVDA | _e.g. Chrome on Windows 11_ | | | |
| TalkBack | _e.g. Android WebView inside Telegram, low-cost Android phone_ | | | |
| Keyboard only | | | | |
| Zoom 200% / 400% (320px reflow) | | | | |
| Sound off | | | | |
| High contrast / forced colours | | | | |
| axe-core (automated) | Playwright + Chromium | | | |
| 3G-speed connection, low-cost Android | | | | |

## 4. Success criteria

Columns: **Result** · **Expected** (what conformance looks like here) · **Actual** · **Evidence** (test name, screenshot,
recording, tester) · **Limitations / untested parts**.

### Principle 1 — Perceivable

| SC | Name | Level | Result | Expected | Actual | Evidence | Limitations / untested |
|---|---|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | Not yet tested | Icons are decorative (`aria-hidden`) next to visible text; no meaningful image lacks a text alternative | | | |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | Not yet tested | Recorded question audio has the same words on screen | | | Likely only applies once recorded audio is added (Phase 4) |
| 1.2.2 | Captions (Prerecorded) | A | Not yet tested | — | | | No video in scope yet |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | Not yet tested | — | | | No video in scope yet |
| 1.2.4 | Captions (Live) | AA | Not yet tested | — | | | No live media in scope |
| 1.2.5 | Audio Description (Prerecorded) | AA | Not yet tested | — | | | No video in scope yet |
| 1.3.1 | Info and Relationships | A | Not yet tested | Questions as `<h1>`/`<legend>`, options in `<fieldset>`, labels tied to fields, lists and landmarks | | | |
| 1.3.2 | Meaningful Sequence | A | Not yet tested | Reading order matches the visual order | | | |
| 1.3.3 | Sensory Characteristics | A | Not yet tested | Instructions do not rely on shape, colour, size, position or sound | | | |
| 1.3.4 | Orientation | AA | Not yet tested | Works in portrait and landscape | | | |
| 1.3.5 | Identify Input Purpose | AA | Not yet tested | Name and phone fields have `autocomplete` | | | |
| 1.4.1 | Use of Color | A | Not yet tested | Selected, current and error states are not shown by colour alone | | | |
| 1.4.2 | Audio Control | A | Not yet tested | Read-aloud can be stopped; nothing plays for more than 3 seconds without a control | | | Pause/stop arrives in Phase 4 |
| 1.4.3 | Contrast (Minimum) | AA | Not yet tested | Text ≥ 4.5:1 (large ≥ 3:1) | | | |
| 1.4.4 | Resize Text | AA | Not yet tested | Usable at 200% text size, with no loss of content | | | |
| 1.4.5 | Images of Text | AA | Not yet tested | No images of text | | | |
| 1.4.10 | Reflow | AA | Not yet tested | No sideways scrolling at 320 CSS px (400% zoom) | | | |
| 1.4.11 | Non-text Contrast | AA | Not yet tested | Control edges, focus outline and states ≥ 3:1 | | | |
| 1.4.12 | Text Spacing | AA | Not yet tested | No loss of content with increased line, letter and word spacing | | | |
| 1.4.13 | Content on Hover or Focus | AA | Not yet tested | No hover/focus pop-ups, or they can be dismissed, hovered and stay visible | | | |

### Principle 2 — Operable

| SC | Name | Level | Result | Expected | Actual | Evidence | Limitations / untested |
|---|---|---|---|---|---|---|---|
| 2.1.1 | Keyboard | A | Not yet tested | Every function works with the keyboard alone | | | |
| 2.1.2 | No Keyboard Trap | A | Not yet tested | Focus can always move away | | | |
| 2.1.4 | Character Key Shortcuts | A | Not yet tested | No single-key shortcuts | | | |
| 2.2.1 | Timing Adjustable | A | Not yet tested | No time limits | | | |
| 2.2.2 | Pause, Stop, Hide | A | Not yet tested | No auto-moving content; read-aloud can be stopped | | | |
| 2.3.1 | Three Flashes or Below Threshold | A | Not yet tested | Nothing flashes | | | |
| 2.4.1 | Bypass Blocks | A | Not yet tested | Skip link to main content; landmarks | | | |
| 2.4.2 | Page Titled | A | Not yet tested | Each view has a descriptive title | | | |
| 2.4.3 | Focus Order | A | Not yet tested | Focus order is logical; focus moves to the question or error summary | | | |
| 2.4.4 | Link Purpose (In Context) | A | Not yet tested | Every link makes sense (e.g. "Apply" includes the job title) | | | |
| 2.4.5 | Multiple Ways | AA | Not yet tested | Navigation menu plus links | | | |
| 2.4.6 | Headings and Labels | AA | Not yet tested | Headings and labels describe their purpose | | | |
| 2.4.7 | Focus Visible | AA | Not yet tested | Visible focus outline on every control | | | |
| 2.4.11 | Focus Not Obscured (Minimum) | AA | Not yet tested | Focused item never hidden by sticky content | | | |
| 2.5.1 | Pointer Gestures | A | Not yet tested | No multi-point or path gestures | | | |
| 2.5.2 | Pointer Cancellation | A | Not yet tested | Actions happen on release (native controls) | | | |
| 2.5.3 | Label in Name | A | Not yet tested | Spoken name includes the visible label | | | |
| 2.5.4 | Motion Actuation | A | Not yet tested | Nothing is triggered by shaking or tilting | | | |
| 2.5.7 | Dragging Movements | AA | Not yet tested | No dragging needed | | | |
| 2.5.8 | Target Size (Minimum) | AA | Not yet tested | Targets ≥ 24×24 px (team standard 44–48 px) | | | |

### Principle 3 — Understandable

| SC | Name | Level | Result | Expected | Actual | Evidence | Limitations / untested |
|---|---|---|---|---|---|---|---|
| 3.1.1 | Language of Page | A | Not yet tested | `<html lang>` matches the chosen language | | | |
| 3.1.2 | Language of Parts | AA | Not yet tested | Amharic and English parts marked with `lang` | | | Amharic is an AI draft pending native review |
| 3.2.1 | On Focus | A | Not yet tested | Focusing never changes the context | | | |
| 3.2.2 | On Input | A | Not yet tested | Choosing an option never changes the context unexpectedly | | | |
| 3.2.3 | Consistent Navigation | AA | Not yet tested | Same menu in the same order on every page | | | |
| 3.2.4 | Consistent Identification | AA | Not yet tested | Same functions have the same names everywhere | | | |
| 3.2.6 | Consistent Help | A | Not yet tested | "Get help" is in the same place on every screen | | | |
| 3.3.1 | Error Identification | A | Not yet tested | Errors are described in text and linked to the field | | | |
| 3.3.2 | Labels or Instructions | A | Not yet tested | Every field has a label and hint where needed | | | |
| 3.3.3 | Error Suggestion | AA | Not yet tested | Errors say how to fix (e.g. phone format) | | | |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | Not yet tested | "Check your answers" before submitting; answers can be changed | | | |
| 3.3.7 | Redundant Entry | A | Not yet tested | Information is never asked for twice (prefill) | | | |
| 3.3.8 | Accessible Authentication (Minimum) | AA | Not yet tested | No login or puzzles in scope; any future login allows paste and password managers | | | No login in scope yet |

### Principle 4 — Robust

| SC | Name | Level | Result | Expected | Actual | Evidence | Limitations / untested |
|---|---|---|---|---|---|---|---|
| 4.1.2 | Name, Role, Value | A | Not yet tested | Native controls; toggles expose `aria-pressed` / `aria-expanded` | | | |
| 4.1.3 | Status Messages | AA | Not yet tested | Saved, welcome-back and job-count messages announced via `role="status"` | | | |

## 5. Known limitations (fill in during Phase 9)

- _List any criterion that is "Partially supports" or "Does not support", with the reason and the plan._
- _List what was not tested (for example, browsers or screen readers not available)._
- _Simulated features (SMS) and unavailable features (ID verification, backend) are out of scope for conformance._

## 6. Evidence index

| ID | What | Where |
|---|---|---|
| E1 | Automated test run (Playwright + axe-core) | `savanna-onboarding/tests/`, run output |
| E2 | NVDA session notes / recording | _to add_ |
| E3 | TalkBack session notes / recording | _to add_ |
| E4 | Co-designer gate session | _to add_ |
