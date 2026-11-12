# Design tokens — Savanna Accessible Onboarding Module

Every value comes from the frozen Savanna reference (`alx-africa/Savanna-static-pages`, kept read-only next to this
repo at `../Savanna-static-pages`) and was measured in Chromium (`savanna-onboarding/tests/baseline/reference-audit.json`).
Where a Savanna value fails WCAG 2.2 AA, an accessible variant is used **for that use only**, as decided by the team
(`CLAUDE.md` §2.6).

- **Where they live:** CSS custom properties prefixed `--so-` ("Savanna onboarding"). They are defined in
  `savanna-onboarding/savanna-onboarding.js` (`TOKENS`) and added to the page when the script loads.
- **Overriding:** a host can override any token on `:root` or on the element.
- **No clashes:** the prefix means they never collide with Savanna's `--bs-*` / `--savanna-*` variables.
- **Checked automatically:** `tests/design.spec.mjs` measures every pair in the contrast table below, in normal and
  high-contrast mode.

`application_alx.css` line numbers refer to `../Savanna-static-pages/assets/css/application_alx.css`.

## Colour

| Token | Value | Savanna source | Used for |
|---|---|---|---|
| `--so-navy`, `--so-text`, `--so-heading` | `#002b56` | `--savanna-alx-primary`, `application_alx.css:31641` | All headings and text (team decision) |
| `--so-text-muted` | `#335578` | `--savanna-alx-primary-hover`, `:31645` | Hints, progress text, secondary text |
| `--so-primary` | **`#da3a3a`** | Savanna red `#db3e3e` (`--bs-primary` `:58`, `--savanna-theme-primary` `:40563`), **darkened by 1 point of HSL lightness** (55.1% → 54.1%). Same hue and saturation | Primary action buttons. The smallest change that reaches 4.5:1 with white |
| `--so-primary-hover` | `#bf2424` | same hue, darker | Primary button hover |
| `--so-on-primary` | `#ffffff` | — | Text on the red button |
| `--so-surface` | `#ffffff` | `--bs-body-bg` `:110` | Page and card background |
| `--so-surface-alt`, `--so-selected-bg` | `#e7e9ec` | `--savanna-alx-light-background` `:31661` | Hero, help panel, callouts, selected option |
| `--so-surface-info` | `#cce8f4` | `--savanna-alx-tertiary-80` `:31657` | Voice "I heard…" panel |
| `--so-border` | `#66809a` | `--savanna-alx-primary-40` `:31649` | Edges of inputs and options (needs 3:1) |
| `--so-border-strong`, `--so-selected-border`, `--so-focus` | `#002b56` | navy | Hover edges, selected option, focus outline |
| `--so-border-subtle` | `#dee2e6` | `--bs-border-color` `:133` | Decorative dividers and card edges only |
| `--so-header-border` | `#e5e6e6` | `--savanna-theme-header-border-color` `:40568` | Decorative header line only |
| `--so-error` | `#dc3545` | `--bs-form-invalid-color` `:151` | Error text, error summary and invalid field border |
| `--so-success-bg` | `#cdfce6` | `--savanna-alx-secondary-80` `:31654` | Success panel background |
| `--so-success-accent` | `#05f283` | `--savanna-alx-secondary` `:31642` | Bar on the success panel. **Never text** (1.50:1 on white) |
| `--so-accent` | `#5648b7` | `--savanna-alx-accent` `:31644` | Callout bar (Savanna `.callout`, `alx.scss:119`), small eyebrow text |
| `--so-info-accent` | `#028eca` | `--savanna-alx-tertiary` `:31643` | Voice-panel edge only. **Not text** (3.67:1 fails) |

### Colour rules (team decision, `CLAUDE.md` §2.6)

- **Red is for primary actions.** `#da3a3a` passes 4.5:1 **on white only** (3.71:1 on `#e7e9ec`), so red text or
  red-on-tint is not used. White text on the red button is 4.52:1.
- **Navy is for headings and text.**
- **Green is for success only, never text.** `tests/design.spec.mjs` checks that no text is rendered in `#05f283`.
- **Links** use navy, not Savanna's tertiary blue `#028eca` (3.67:1 fails for text).
- **Focus outline:** 3px solid navy, offset 2px. That gives 14.19:1 on white and 11.67:1 on light panels. Savanna's own
  focus ring (`0.25rem rgba(219,62,62,.25)`, `:146-148`) is far below 3:1 and is not used.
- **Selected options** never rely on colour alone. The native radio or checkbox shows as checked, the edge gets
  thicker (2px + 1px inset), and the text becomes heavier.

### Contrast results (WCAG 2.2 AA: 4.5:1 text, 3:1 large text and UI)

| Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|
| navy `#002b56` | white | 14.19 | 4.5 | pass |
| navy `#002b56` | light `#e7e9ec` | 11.67 | 4.5 | pass |
| muted `#335578` | white | 7.75 | 4.5 | pass |
| muted `#335578` | light `#e7e9ec` | 6.37 | 4.5 | pass |
| white | red `#da3a3a` | **4.52** | 4.5 | pass (Savanna's `#db3e3e` = 4.40, fails) |
| white | hover red `#bf2424` | 6.01 | 4.5 | pass |
| red `#da3a3a` | light `#e7e9ec` | 3.71 | 3 (button edge) | pass as UI; **not used for text** |
| error `#dc3545` | white | 4.53 | 4.5 | pass |
| navy | success `#cdfce6` | 12.61 | 4.5 | pass |
| navy | info `#cce8f4` | 11.09 | 4.5 | pass |
| accent `#5648b7` | white / light | 6.99 / 5.74 | 4.5 | pass |
| border `#66809a` | white | 4.10 | 3 | pass |
| focus navy | white / light | 14.19 / 11.67 | 3 | pass |
| info edge `#028eca` | white | 3.67 | 3 | pass (UI only) |
| green `#05f283` | white | 1.50 | — | not used for text or edges |
| `#dee2e6`, `#e5e6e6` | white | 1.30 / 1.25 | — | decorative only |

### High-contrast mode (learner setting, `html[data-dm-contrast=high]`)

Text, headings, borders and focus become black `#000` (21:1). The primary button becomes black with white text.
Panels become white with 3px black borders. Error becomes `#a3000b` (8.20:1). The selected option gets a 5px border.
Windows forced-colours mode is also handled (`@media (forced-colors: active)`).

## Typography

| Token / rule | Value | Source / reason |
|---|---|---|
| `--so-font` | `"Poppins", "Noto Sans Ethiopic", "Nyala", "Ebrima", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Poppins = Savanna body font (`--bs-font-sans-serif`, `application_alx.css:100`). Poppins has no Ethiopic letters, so the browser takes each Amharic letter from Noto Sans Ethiopic. Nyala / Ebrima are Windows Ethiopic fonts, as a last resort |
| Weights | 400, 500, 600, 700 | The weights the reference pages actually render |
| `--so-base-size` | `max(1rem, 16px)` | Savanna sets the root to **14px** (`--bs-root-font-size`, `application_alx.css:103`). The module never goes below 16px, and it grows if the browser default is larger |
| `--so-scale` | 1 / 1.25 / 1.5 | Learner text-size setting: Normal / Large / Extra large (`html[data-dm-size]`) → 16 / 20 / 24px |
| Module root | `font-size: calc(var(--so-base-size) * var(--so-scale))` | Everything inside uses `em`, so the whole module scales together |
| Question heading | 1.75em, weight 600, line-height 1.3 | Savanna ratio 1.75 (h3 = 1.75rem). Weight 600 rather than Savanna's 500 headings, for readability |
| Body line-height | 1.5 (English), **1.7 (Amharic)** | Bootstrap 1.5 (`:107`); Ethiopic letters need more room |
| Section heading | 1.35em / 1.25em, weight 600 | |

### Fonts — where they come from and the licence

| Font | Files in `savanna-onboarding/assets/fonts/` | Origin | Licence |
|---|---|---|---|
| Poppins 400/500/600/700, latin + latin-ext | `poppins-{400,500,600,700}-{latin,latin-ext}.woff2` (8 files, ~53 KB) | Copied unchanged from the Savanna reference `assets/fonts/pxi*.woff2`, declared in `assets/css/google-fonts-poppins.css` (Google Fonts) | SIL Open Font Licence 1.1, `OFL-Poppins.txt` (from github.com/google/fonts) |
| Noto Sans Ethiopic (variable, 400–700), Ethiopic range only | `noto-sans-ethiopic-ethiopic.woff2` (~198 KB, loaded only when Amharic letters are on screen) | Google Fonts (`fonts.gstatic.com`, v50), downloaded once and self-hosted | SIL Open Font Licence 1.1, `OFL-NotoSansEthiopic.txt` |
| Aktiv Grotesk (Typekit) | **not used** | Linked by Savanna pages but never applied in their CSS. Adobe-licensed and locked to ALX domains | — |

- **How fonts load:** `@font-face` rules use `unicode-range`, so a browser downloads only the files it needs.
- **Where the files are found:** the font addresses are worked out from where `savanna-onboarding.js` was loaded.
  If the script is inlined (no address), no fonts are declared and the stack falls back cleanly.
- **Tested:** `tests/design.spec.mjs` checks on localhost that Poppins and Noto Sans Ethiopic load (HTTP 200) and are
  applied. Vercel was checked after deploy (see `DEVELOPMENT_PROGRESS.md`, Phase 1).

## Shape, spacing, sizes

| Token | Value | Source |
|---|---|---|
| `--so-radius-sm` | 5.25px | Buttons: `--bs-border-radius` 0.375rem × 14px (`:135`) |
| `--so-radius` | 7px | `--bs-border-radius-lg` 0.5rem × 14px (`:137`): inputs, options, callouts |
| `--so-radius-card` | 15px | Savanna cards (`border-radius: 15px`, e.g. `application_alx.css:33576`, `classes/common.scss`) |
| `--so-radius-pill` | 999px | `--bs-border-radius-pill` (`:141`) |
| `--so-border-width` | 2px (3px in high contrast) | Module choice, for visible control edges |
| `--so-target` / `--so-target-sm` | 48px / 44px | Module minimum. Savanna buttons are ~33px tall; WCAG 2.5.8 needs 24px; the team standard is 44–48px |
| Breakpoint | 48em (768px) for the demo menu | Bootstrap `md` 768px (`--bs-breakpoint-md`, `:944`) |

## States

| State | How it looks |
|---|---|
| Focus | 3px navy outline, 2px offset, on every interactive element (`:focus-visible`) |
| Hover | Edge turns navy; secondary buttons get the light background; primary goes darker red |
| Selected (option) | Navy edge 2px + 1px inset, light background, heavier text, native checked mark |
| Error | 4px red-bordered error summary (focused), red error text above the field, field border 3px red, `aria-invalid="true"` |
| Success | Light green panel with green bar and a ✓, navy text |
| Disabled | Not used by the module yet (no disabled controls). If added: `--so-border` text colour, with the reason explained in text |
| Current page (demo nav) | Light background + heavier text + red bottom bar |
