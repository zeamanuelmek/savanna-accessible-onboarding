/* Behaviour for dashboard.html, ALX's self-paced learner homepage. It does the same jobs as ALX's
   assets/js/static-page.js (which we do not load: it would take over our accessible menu button), with the
   accessibility ALX's starter leaves out on purpose:
   - "My activities": choosing a module shows its activity beside the list. The buttons say which one is chosen
     (aria-pressed), and the panel is announced.
   - "Program details" dialog: each course and module section opens and closes (aria-expanded was already there).
   - Bootstrap's tooltip on "My Pacing Boost" (it also opens on keyboard focus).
   Bootstrap's own script (vendored, unchanged) handles the course switcher and the dialog. */
(function () {
  'use strict';
  function activities() {
    var host = document.querySelector('[data-section-host]'), store = document.getElementById('static-section-store');
    if (!host || !store) return;
    var buttons = Array.prototype.slice.call(document.querySelectorAll('button[data-section-index]'));
    host.setAttribute('aria-live', 'polite');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.classList.contains('bg-light')));
      b.addEventListener('click', function () {
        var panel = store.querySelector('template[data-section-panel="' + b.getAttribute('data-section-index') + '"]');
        if (!panel) return;
        host.replaceChildren(panel.content.cloneNode(true));
        buttons.forEach(function (o) {
          var on = o === b;
          o.classList.toggle('fw-medium', on); o.classList.toggle('bg-light', on); o.classList.toggle('fw-light', !on);
          o.setAttribute('aria-pressed', String(on));
        });
      });
    });
  }
  function collapsibles() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-static-collapse-toggle]'), function (t) {
      var body = document.querySelector('[data-static-collapse-body="' + t.getAttribute('data-static-collapse-toggle') + '"]');
      if (!body) return;
      t.addEventListener('click', function () {
        var open = body.hidden;
        body.hidden = !open;
        t.setAttribute('aria-expanded', String(open));
        Array.prototype.forEach.call(t.querySelectorAll('.fa-angle-up, .fa-angle-down'), function (i) {
          i.classList.toggle('fa-angle-up', open); i.classList.toggle('fa-angle-down', !open);
        });
      });
    });
  }
  function tooltips() {
    if (!window.bootstrap) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'), function (el) {
      if (!window.bootstrap.Tooltip.getInstance(el)) new window.bootstrap.Tooltip(el);
    });
  }
  function boot() { activities(); collapsibles(); tooltips(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
