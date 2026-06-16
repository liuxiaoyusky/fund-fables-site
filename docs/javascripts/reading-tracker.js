// Per-page reading tracker. Runs on every page; does work only when the URL
// points to a fable (i.e. /fables/<bookId>/<sectionPath>.html).
//
// Responsibilities:
//   1. Identify the current book + section from the URL.
//   2. Persist (bookId -> { lastUrl, lastSection, lastReadAt, scrollY }) to
//      localStorage under the "fables:library" key.
//   3. Restore the previous scroll position, with two entry modes:
//        - explicit ?y=NNN from a cover-card click  (one-shot, then cleaned)
//        - the saved book.scrollY from a bfcache restore (pageshow.persisted)
//   4. Save the live scrollY on every debounced scroll and on beforeunload.
(function () {
  'use strict';

  var STORAGE_KEY = 'fables:library';
  var SAVE_DEBOUNCE_MS = 400;

  // ---- 1. Classify the URL ----
  // /fables/<bookId>/<sectionPath...>.html  ->  { bookId, sectionPath, url }
  // Book-level index pages (one path segment after /fables/<bookId>/) are
  // also tracked so that the cover can resume there if no fable has been
  // opened yet.
  function classify(pathname) {
    var p = (pathname || '').replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '');
    if (!p) return null;
    var m = p.match(/^fables\/([^/]+)\/(.+)$/);
    if (!m) return null;
    return {
      bookId: m[1],
      sectionPath: m[2],
      url: 'fables/' + m[1] + '/' + m[2] + '.html'
    };
  }

  var info = classify(window.location.pathname);
  if (!info) return;

  // ---- 2. Read library state ----
  var state = {};
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : {};
  } catch (e) { state = {}; }

  var book = state[info.bookId] || {};

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---- 3. Scroll restoration ----
  // Returns the target scrollY for this page, or null if no restoration
  // is desired (default behaviour: top of page).
  function readTargetY() {
    var params = new URLSearchParams(window.location.search);
    var fromCover = params.get('y');
    var y = parseInt(fromCover, 10);
    if (!isNaN(y) && y > 0) {
      // One-shot: clean the URL so a refresh doesn't re-apply.
      var clean = window.location.pathname + window.location.hash;
      window.history.replaceState({ scrollY: y }, '', clean);
      return y;
    }
    if (book.scrollY && book.scrollY > 0) return book.scrollY;
    return null;
  }

  function applyScroll() {
    var y = readTargetY();
    if (y === null) return;
    // Wait one frame for Material's post-load layout, then scroll.
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  if (document.readyState === 'complete') {
    applyScroll();
  } else {
    window.addEventListener('load', applyScroll);
  }
  // Re-apply on bfcache restore.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) applyScroll();
  });

  // ---- 4. Persist current section on every visit ----
  book.lastSection = info.sectionPath;
  book.lastUrl     = info.url;
  book.lastReadAt  = Date.now();
  state[info.bookId] = book;
  persist();

  // ---- 5. Debounced scroll -> persist scrollY ----
  var saveTimer = null;
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      book.scrollY = window.scrollY || window.pageYOffset || 0;
      book.lastReadAt = Date.now();
      persist();
    }, SAVE_DEBOUNCE_MS);
  }
  window.addEventListener('scroll', scheduleSave, { passive: true });

  // Final flush on unload (mobile browsers often skip the last debounce).
  window.addEventListener('beforeunload', function () {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    book.scrollY = window.scrollY || window.pageYOffset || 0;
    book.lastReadAt = Date.now();
    persist();
  });

  // Also flush on visibility hidden (covers tab-switch on mobile).
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      book.scrollY = window.scrollY || window.pageYOffset || 0;
      book.lastReadAt = Date.now();
      persist();
    }
  });
})();
