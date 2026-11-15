/* Runs in <head>, before the page is drawn (not deferred). It applies the learner's saved language, text size,
   contrast and motion settings to <html> at once, so the first frame already has the right size and font and
   nothing jumps when the module loads a moment later. It also starts loading the Amharic font early when the page is
   in Amharic. Same keys as the module (savanna-onboarding.prefs). An external file, as the security policy allows no
   inline scripts. */
(function () {
  var p = {};
  try { p = JSON.parse(localStorage.getItem('savanna-onboarding.prefs') || '{}') || {}; } catch (e) {}
  var root = document.documentElement, lang = p.lang === 'en' || p.lang === 'om' ? p.lang : 'am';
  root.lang = lang;
  root.setAttribute('data-dm-size', p.size || 'normal');
  root.setAttribute('data-dm-contrast', p.contrast || 'normal');
  root.setAttribute('data-dm-motion', p.motion === 'reduce' ? 'reduce' : 'normal');
  if (lang === 'am') {
    var l = document.createElement('link');
    l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = 'anonymous';
    l.href = 'assets/fonts/noto-sans-ethiopic-ethiopic.woff2';
    document.head.appendChild(l);
  }
})();
