# Savanna Accessible Onboarding Module

**Live demo: https://savanna-accessible-onboarding.vercel.app** · **Submission summary: [`SUBMISSION.md`](SUBMISSION.md)**

Accessible onboarding and learner-profile module for the Savanna learning platform. Digital Bridge Accessibility
Hackathon 2026 (ALX Ethiopia), Track 1.

- **Live demo:** https://savanna-accessible-onboarding.vercel.app (the learner journey inside Savanna's own pages;
  log-in is simulated). Test host page: `/test-host/`. Developer and test page: `/showroom.html`.
- **Install guide (under an hour), features, keyboard and ARIA support:** [`savanna-onboarding/README.md`](savanna-onboarding/README.md)
- **Run it locally:** `docker compose up`, then open http://localhost:8080 (optional Addis AI speech: `docker compose --profile addis up`, key in `.env`; see the install guide)
- **Data and events for the host (JSON Schema, JobPosting):** [`savanna-onboarding/docs/api-schema.md`](savanna-onboarding/docs/api-schema.md)
- **WCAG 2.2 AA conformance report:** [`savanna-onboarding/docs/conformance-report.md`](savanna-onboarding/docs/conformance-report.md)
- **Progress, test results and decisions:** [`DEVELOPMENT_PROGRESS.md`](DEVELOPMENT_PROGRESS.md) · design tokens: [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md)
- **Licence:** [`LICENSE`](LICENSE). Released under MIT, chosen pending confirmation of the open licence ALX named at kickoff; we will relicense if required. Savanna's own files in `savanna-onboarding/vendor/` belong to ALX and keep their own terms.
