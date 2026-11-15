// Builds dashboard.html (where a learner lands after onboarding) from ALX's own self-paced learner homepage,
// vendor/savanna-static-pages/pages/homepage-v1-self-paced.html (copied unchanged by tools/vendor-savanna.cjs).
// Run from savanna-onboarding/:   node tools/dashboard-page.cjs
//
// What we take: everything ALX's page shows inside <main> (curriculum bar, greeting, Course Progression, My activities,
// My Pacing Boost, My upcoming events) and the dialogs after it ("Program details"), word for word.
// What we leave out: ALX's header and sidebar (journey/journey.js draws the same Savanna header and sidebar, with the
// accessibility fixes listed in the README), the Typekit fonts (licensed to ALX's domains), and static-page.js
// (journey/dashboard.js does the same jobs; ALX's script would take over our accessible menu button).
//
// The small changes below are accessibility fixes and the learner's own name. Each must match ALX's markup exactly
// once; if ALX changes the page, this script stops and says which one no longer matches.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'vendor/savanna-static-pages/pages/homepage-v1-self-paced.html'), 'utf8');

const start = src.indexOf('<main class="content" id="content">'), mainEnd = src.indexOf('</main>'), end = src.indexOf('<script src="../assets/js/popper.js">');
if (start < 0 || mainEnd < 0 || end < 0) throw new Error('The self-paced page no longer has the expected <main> and scripts');
let main = src.slice(src.indexOf('>', start) + 1, mainEnd);
let dialogs = src.slice(mainEnd + '</main>'.length, end);

const changes = [];
function fix(where, from, to, why) {
  const text = where === 'main' ? main : dialogs, n = text.split(from).length - 1;
  if (n !== 1) throw new Error('Expected one match (found ' + n + ') for: ' + why);
  if (where === 'main') main = text.replace(from, to); else dialogs = text.replace(from, to);
  changes.push(why);
}
const re = (where, pattern, to, why) => { // whitespace-tolerant version of fix()
  const text = where === 'main' ? main : dialogs, m = text.match(pattern);
  if (!m || text.match(new RegExp(pattern.source, 'g')).length !== 1) throw new Error('Expected one match for: ' + why);
  fix(where, m[0], typeof to === 'function' ? to(m) : to, why);
};

// 1. The curriculum bar is fixed under ALX's fixed header; in our pages it sits in the page flow (under the
//    accessibility bar and the sticky header), so the padding that made room for it goes.
fix('main', '<div id="layout-bars" style="padding-top: 118px">', '<div id="layout-bars">', 'curriculum bar in the page flow');
// 2. The course switcher opens from a <div>: not reachable by keyboard and not a button for screen readers.
re('main', /<div\s+class="align-items-center d-flex flex-shrink-0 gap-3"\s+aria-expanded="false"\s+data-bs-auto-close="outside"\s+data-bs-toggle="dropdown"\s+type="button"\s*>([\s\S]*?)<\/div>(\s*)<ul class="curriculum-switcher-menu p-3 dropdown-menu">/,
  m => '<button class="align-items-center d-flex flex-shrink-0 gap-3 sj-switcher" aria-expanded="false" data-bs-auto-close="outside" data-bs-toggle="dropdown" type="button">' +
    m[1].replace(/<div/g, '<span').replace(/<\/div>/g, '</span>') + '</button>' + m[2] + '<div class="curriculum-switcher-menu p-3 dropdown-menu">',
  'course switcher is a real <button>');
// 3. ...and its menu was a <ul> whose children are <div>s (not list items): now a plain container.
re('main', /(<div class="curriculum-switcher-menu p-3 dropdown-menu">[\s\S]*?)<\/ul>/, m => m[1] + '</div>', 'course switcher menu is not a broken list');
// 4. The progress bar has no name.
fix('main', 'role="progressbar"', 'role="progressbar" aria-label="Program progress"', 'progress bar has a name');
// 5. The pacing tooltip: a <span> with aria-label (not allowed on a plain span) that only opens on mouse hover.
re('main', /<span\s+data-bs-toggle="tooltip"\s+data-bs-placement="top"\s+class="ms-2"\s+aria-label=/, '<span data-bs-toggle="tooltip" data-bs-placement="top" class="ms-2" role="img" tabindex="0" aria-label=', 'pacing tooltip has a role and opens on keyboard focus');
// 6. The page has no <h1>: the greeting becomes it (same look), and the card titles follow as <h2>.
re('main', /<div class="d-flex fs-3 mb-4 mt-2 flex-wrap gap-1">([\s\S]*?)<\/div>(\s*<div class="row g-3 align-items-stretch">)/,
  m => '<h1 class="d-flex fs-3 mb-4 mt-2 flex-wrap gap-1 sj-greeting" tabindex="-1">' + m[1] + '</h1>' + m[2], 'greeting is the page heading');
fix('main', '<h3 class="card-title text-center mb-2 mt-2 text-primary">Course Progression</h3>', '<h2 class="card-title text-center mb-2 mt-2 text-primary h3">Course Progression</h2>', 'heading levels in order');
// 7. The learner's own name and greeting (filled in by journey/dashboard.js), instead of the sample learner "Amara".
re('main', /class="fw-semibold"\s*>Good evening,<\/span\s*>/, 'class="fw-semibold" data-sj-greeting>Good evening,</span>', 'greeting follows the time of day');
fix('main', '<span>Amara 👋.</span>', '<span><span data-sj-name>Amara</span> <span aria-hidden="true">👋</span>.</span>', 'learner name');
fix('dialogs', 'Congratulations, Amara!', 'Congratulations, <span data-sj-name>Amara</span>!', 'learner name in the badge dialog');

// 8. Activity titles were <h5> under the <h2> card titles: now <h3> with the same look (all four, incl. the stored panels).
if ((main.match(/<h5\b/g) || []).length !== 4) throw new Error('Expected four activity titles (<h5>)');
main = main.replace(/<h5\b/g, '<h3').replace(/class="fw-light mb-0 flex-md-grow-1"/g, 'class="h5 fw-light mb-0 flex-md-grow-1"').replace(/<\/h5>/g, '</h3>');
changes.push('activity titles in heading order');

const asset = s => s.split('../assets/').join('vendor/savanna-static-pages/assets/');
const page = `<!doctype html>
<!-- Savanna learner journey page "dashboard": ALX's self-paced learner homepage (vendor/savanna-static-pages/pages/
     homepage-v1-self-paced.html), where the learner lands after onboarding. Savanna's header and sidebar are drawn by
     journey/journey.js. Generated by tools/dashboard-page.cjs: edit the generator, not this file.
     Changes to ALX's markup: ${changes.join('; ')}. -->
<html lang="am">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Savanna</title>
  <meta name="theme-color" content="#002b56">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 rx=%2215%22 fill=%22%23002b56%22/%3E%3Ctext x=%2250%22 y=%2270%22 font-size=%2260%22 font-family=%22sans-serif%22 font-weight=%22700%22 text-anchor=%22middle%22 fill=%22%23fff%22%3ES%3C/text%3E%3C/svg%3E">
  <script src="journey/early.js"></script>
  <link rel="preload" href="assets/fonts/poppins-400-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/poppins-500-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/poppins-600-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="vendor/savanna-static-pages/assets/css/application_alx.css">
  <link rel="stylesheet" href="vendor/savanna-static-pages/assets/css/app.css">
  <link rel="stylesheet" href="journey/journey.css">
  <script src="savanna-onboarding.js" defer></script>
  <script src="forms.js" defer></script>
  <script src="app.js" defer></script>
  <script src="journey/journey.js" defer></script>
  <script src="vendor/savanna-static-pages/assets/js/popper.js" defer></script>
  <script src="vendor/savanna-static-pages/assets/js/bootstrap.bundle.js" defer></script>
  <script src="journey/dashboard.js" defer></script>
</head>
<body data-page="dashboard" class="signed_in">
  <noscript><p lang="en">Savanna needs JavaScript for this demo.</p></noscript>
  <main class="content" id="content" tabindex="-1">
    <div class="sj sj-dash-top"><p id="sj-offline" class="notice" role="status" hidden></p><div id="sj-view"></div></div>
    <div class="sj-alx" lang="en">
${asset(main).trimEnd()}
    </div>
    <div class="sj"><footer class="sj-foot"><p id="sj-foot"></p><p class="sj-foot-links"></p></footer></div>
  </main>
  <div class="sj-alx-dialogs" lang="en">
${asset(dialogs)}
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'dashboard.html'), page);
console.log('dashboard.html written,', changes.length, 'changes to ALX markup');
