/* Test host page: uses only the public API (mount, unmount, events). In a file, not inline, so the page works under a strict Content Security Policy. */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('controls').addEventListener('submit', function (e) { e.preventDefault(); });
  var D = window.SavannaOnboarding, handle = null, log = [];
  document.getElementById('version').textContent = D.version;
  // Optional for hosts: the module's sample service worker, so this page also opens offline after one visit.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(function () {});
  function say(msg) { var s = document.getElementById('status'); s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 50); }
  function record(name, detail) {
    log.unshift({ event: name, at: new Date().toISOString().slice(11, 19), detail: detail });
    document.getElementById('log').textContent = JSON.stringify(log, null, 2);
  }
  document.addEventListener('savanna-onboarding:complete', function (e) { record('savanna-onboarding:complete', e.detail); say('The host received the answers (see "Events the host received").'); });
  document.addEventListener('savanna-onboarding:prefs', function (e) { record('savanna-onboarding:prefs', e.detail); });
  document.getElementById('mount').onclick = function () {
    var form = document.querySelector('input[name=form]:checked').value;
    handle = D.mount('#slot', form === 'settings' ? { settings: true, focus: false } : {
      form: form, instance: form === 'apply' ? 'test-job' : null, headingLevel: 2,
      onComplete: function (detail, doneSlot) {
        if (form === 'apply' && doneSlot) {
          var support = D.supportForEmployer(detail.answers); // only with "share" for this application
          doneSlot.innerHTML = '<p>Support the employer may see: ' + (support.length ? support.map(function (n) { return n.label.en; }).join(', ') : 'none (not shared)') + '</p>';
        }
      }
    });
    say('Mounted: ' + form + '.');
  };
  document.getElementById('unmount').onclick = function () {
    D.unmount('#slot'); handle = null;
    say('Unmounted. The learner\'s draft stays saved on this device.');
  };
});
