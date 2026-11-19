# How to plug it in (one page)

Everything a platform needs to add the Savanna Accessible Onboarding Module and receive the data. No build step, no
server, no account. See it working: **[host demo](../host-demo/)** (`/host-demo/`: mounts sign-up and the Support
Passport, saves every event as a record, checks each one against the schemas, exports JSON / CSV). Exact schemas:
**[api-schema.md](api-schema.md)**. Longer reference: [for-developers.md](for-developers.md).

## 1. Script tags

```html
<script src="https://YOUR-HOST/savanna-onboarding/savanna-onboarding.js" defer></script>
<script src="https://YOUR-HOST/savanna-onboarding/forms.js" defer></script>
<div id="onboarding"></div>
```

Copy the `savanna-onboarding/` folder to your site (keep `assets/` next to the script: fonts and recorded audio are
found relative to it). To receive `savanna-onboarding:ready`, add your listeners in a script that runs **before**
these two (the host demo does this).

## 2. `mount()` and `unmount()`

```js
var handle = SavannaOnboarding.mount('#onboarding', { form: 'signup', lang: 'am', headingLevel: 2 });
handle.unmount();                            // or SavannaOnboarding.unmount('#onboarding')
```

| Option | Type | Default | What it does |
|---|---|---|---|
| `form` | `'signup'` `'passport'` `'profile'` `'takeover'` `'identity'` `'apply'` `'employer'` or your own registered id | required (unless `settings`) | Which journey to show |
| `settings` | boolean | `false` | Show the settings panel (language, text size, contrast, reading, voice) instead of a form |
| `lang` | `'am'` `'en'` `'om'` | the learner's saved choice | Starting language |
| `instance` | string | none | Keeps a separate draft (for example one per job) and is returned in `complete` |
| `welcome` | boolean | `false` | Start with "How would you like to answer?" (read and type / listen / speak / simple steps) |
| `backUrl` | string | none | The first screen shows "Back" to this page |
| `headingLevel` | number | `1` | Use `2` when your page has its own `<h1>`; all module headings move down |
| `focus` | boolean | `true` | Move focus to the question after mounting |
| `speechProxy` | string | none | Your own speech proxy for Amharic and Afaan Oromo (for example Addis AI). Without it, voice uses the browser |
| `onComplete(detail, slot)` | function | none | Called with the `complete` detail; `slot` is where you can add your own "what next" |

`mount()` returns `{ element, host, unmount() }`. Mounting into the same element again replaces the form. Unmounting
stops speech and listeners; the learner's draft stays on the device, so mounting again resumes it. A wrong selector
throws `[savanna-onboarding] mount: no element matches …`.

## 3. Events (every one, with every field)

All are `CustomEvent`s. `ready`, `prefs` and `audioblocked` are sent on `document`; `step` and `complete` on the form
element and **bubble**, so one `document` listener catches all of them. (A copy with the old `dimts:` prefix is also
sent; it is deprecated, ignore it.) Schema `$id`s refer to [api-schema.md](api-schema.md).

```js
['ready', 'prefs', 'step', 'complete', 'audioblocked'].forEach(function (n) {
  document.addEventListener('savanna-onboarding:' + n, function (e) { save(n, e.detail); });
});
```

### `savanna-onboarding:ready`: the script has loaded

`detail` is `null` (schema `savanna-onboarding/no-detail`).

### `savanna-onboarding:audioblocked`: the browser refused to play sound

The page has had no tap or key press yet (autoplay rules). The player stopped quietly. `detail` is `null`
(schema `savanna-onboarding/no-detail`). Suggested host action: show "Tap anywhere or press any key to hear this page".

### `savanna-onboarding:step`: a new screen opened

Schema `savanna-onboarding/step`.

| Field | Type | Meaning |
|---|---|---|
| `form` | string | Form id |
| `mode` | `welcome` `question` `review` `done` `saved` | Which kind of screen |
| `step` | integer | Index of the question (0 = first) |
| `summary` | string | A short English summary of the screen (may be empty in other languages) |

```json
{ "form": "signup", "mode": "question", "step": 2, "summary": "Step 3 of 5: your phone number. You can type it or say it. Below are Continue and Back." }
```

### `savanna-onboarding:prefs`: the learner changed a setting

Schema `savanna-onboarding/prefs`. Describes **how** the learner likes to use forms, never why. Never send it to employers.

| Field | Type | Meaning |
|---|---|---|
| `lang` | `am` `en` `om` | Language |
| `easy` | boolean | Read questions aloud |
| `mode` | `""` `read_type` `listen` `speak` `simple` | How they chose to answer |
| `size` | `normal` `large` `xlarge` | Text size |
| `contrast` | `normal` `high` | Contrast |
| `motion` | `normal` `reduce` | Stop motion |
| `pictures` | boolean | Simple steps with pictures |
| `autoRead` | `ask` `on` `off` | Automatic reading of page summaries |

```json
{ "lang": "am", "easy": true, "mode": "listen", "size": "large", "contrast": "normal", "motion": "normal", "pictures": false, "autoRead": "on" }
```

### `savanna-onboarding:complete`: the learner pressed the final button

Schema `savanna-onboarding/complete`; `answers` against `savanna-onboarding/answers/<form>`. Only answers to
questions the learner was actually shown are sent; the draft is then deleted from the device.

| Field | Type | Meaning |
|---|---|---|
| `form` | string | Form id |
| `instance` | string or `null` | The `instance` you mounted with |
| `lang` | `am` `en` `om` | Language the learner used |
| `answers` | object | The answers, by question id (below). Values are always English codes, never translated text |

**Sign-up** (`signup`) answers:

| Field | Type | When |
|---|---|---|
| `filler` | `self` `partner` | Always |
| `partner_org` | `aaapd` `tib` `other` | Only when `filler` = `partner` |
| `staff_name` | string | Only when `filler` = `partner` |
| `learner_consent` | `"yes"` | Only when `filler` = `partner` |
| `name` | string | Always: what the learner wants to be called |
| `phone` | string | Always, as typed (10 digits, or +251 / 251 and 9 digits) |
| `dob` | date object, or absent | Optional. `{ cal, d, m, y, gregorian }`; or `{ cal, precision: "year", y }`; or `{ cal, precision: "age", age, asOf }` |
| `consent` | `"yes"` | Always |

```json
{ "form": "signup", "instance": null, "lang": "en",
  "answers": { "filler": "self", "name": "Abebe Kebede", "phone": "0911234567",
               "dob": { "cal": "eth", "d": 1, "m": 1, "y": 2000, "gregorian": "2007-09-12" }, "consent": "yes" } }
```

**Support Passport** (`passport`) answers. Private: a need, never a diagnosis.

| Field | Type | When |
|---|---|---|
| `want` | `yes` `later` | Always |
| `needs` | array of `screen_reader` `audio` `sign_language` `captions` `simple_words` `written` `step_free` `extra_time` `flexible_hours` `remote` `helper` | Only when `want` = `yes` (at least one) |
| `other_need` | string | Optional, the learner's own words |
| `sharing` | `ask` (only me, ask each time I apply) or `trainers` | Only when `want` = `yes` |

```json
{ "form": "passport", "instance": null, "lang": "en",
  "answers": { "want": "yes", "needs": ["screen_reader", "captions"], "sharing": "ask" } }
```

Other forms (`profile`, `takeover`, `identity`, `apply`, `employer`): fields and schemas in
[api-schema.md, section 3](api-schema.md#3-completion-envelope). **Never** pass Support Passport needs to an employer
unless `share_passport` is `"share"` for that application: use `SavannaOnboarding.supportForEmployer(answers)`.

## 4. Where the data goes: your choice

The module sends nothing over the network. Your listener decides. The host demo shows three ways: keep it in the
browser (IndexedDB), download it (JSON / CSV), or POST each event as JSON to your own endpoint ("Send to your
endpoint", off by default). That box is the start of a **"bring your own backend" adapter**: replace the URL with your
API, and add consent and authentication there. The body it sends:

```json
{ "event": "savanna-onboarding:complete", "receivedAt": "2026-11-19T09:30:00.000Z", "recordId": 7, "detail": { "form": "passport", "…": "…" } }
```

## 5. Voice without a paid key

Voice answers work in Chrome (on Android too) without any key: the browser's own speech recognition, for Amharic
(`am-ET`) and English (`en-US`). Afaan Oromo (`om-ET`) depends on the browser and is not verified; if the browser
refuses the language, the learner is told plainly and types or taps instead. Reading aloud uses our recorded Amharic clips first. With a `speechProxy`
that has an Addis AI key, Amharic and Afaan Oromo go to Addis AI instead. The voice panel always names the engine in
use: **"Voice: Addis AI"** or **"Voice: your browser"**. If Addis AI fails, the module switches to the browser and
says so. `SavannaOnboarding.voiceEngine('am')` returns `'addis'`, `'browser'` or `null`. Your proxy answers
`GET <proxy>/stt` with `{ "ready": true|false }` (free: no recording is sent).

## 6. Other helpers

| Call | Returns / does |
|---|---|
| `SavannaOnboarding.version` | Module version |
| `SavannaOnboarding.describe(form, answers, lang)` | `[{ id, label, value }]`: readable answers for your own confirmation screen |
| `SavannaOnboarding.supportForEmployer(applyAnswers)` | The needs an employer may see: `[]` unless the learner chose "share" for this application |
| `SavannaOnboarding.prefs()` / `setPrefs(patch)` | Read or change the learner's settings |
| `SavannaOnboarding.register(id, config)` | Add your own form (see for-developers.md, section 3) |
| `SavannaOnboarding.setStorage(adapter)` | Store drafts somewhere other than `localStorage` |
| `SavannaOnboarding.setSpeech({ input, output })` | Use your own speech engine |
| `SavannaOnboarding.setSpeechProxy(url)` / `speechProxy()` | Set or read the speech proxy (`{ url, ready, down, languages }`) |
