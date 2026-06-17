// Home-page book gallery: read state from localStorage, sort cards by
// most-recently-read, and rewrite each cover's click target to the last
// read section (with a ?y=NNN scroll-restore hint).
(function () {
  'use strict';

  var STORAGE_KEY = 'fables:library';
  var gallery = document.getElementById('book-gallery');
  var bookHome = document.querySelector('[data-book-home]');
  if (!gallery && !bookHome) return;

  // ---- 1. Read library state ----
  var state = {};
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : {};
  } catch (e) { state = {}; }

  // ---- 2. Pretty-print a chapter slug: "01-there-are-at-least-two-kinds-of-games" -> "01 There Are at Least Two Kinds of Games" ----
  function prettyChapter(slug) {
    if (!slug) return '';
    return slug
      .replace(/^\d+-/, function (m) { return m + ' '; })
      .split('-')
      .map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; })
      .join(' ');
  }

  // ---- 3. Enhance every homepage/book landing control ----
  var quickLinks = Array.prototype.slice.call(document.querySelectorAll('.library-quick-book'));

  function normaliseStoredUrl(url) {
    if (!url) return url;
    var clean = url.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
    return clean.indexOf('fables/') === 0 ? '/' + clean : clean;
  }

  function entryTarget(entry, fallback) {
    if (entry && entry.lastUrl) {
      var y = parseInt(entry.scrollY, 10);
      return normaliseStoredUrl(entry.lastUrl) + (y > 0 ? '?y=' + y : '');
    }
    return fallback;
  }

  quickLinks.forEach(function (link) {
    var bookId = link.getAttribute('data-book-id');
    var entry = state[bookId] || null;
    var status = link.querySelector('[data-role="quick-status"]');
    var action = link.querySelector('[data-role="quick-action"]');

    if (entry && entry.lastSection) {
      var seen = (entry.lastIndex && entry.lastIndex > 0) ? entry.lastIndex : null;
      if (status) status.textContent = seen ? '读到第 ' + seen + ' 篇' : '可继续阅读';
      if (action) action.textContent = '继续';
      link.setAttribute('href', entryTarget(entry, link.getAttribute('href')));
    }
  });

  if (bookHome) {
    var homeBookId = bookHome.getAttribute('data-book-home');
    var homeEntry = state[homeBookId] || null;
    var continueLink = bookHome.querySelector('[data-role="book-continue"]');
    var statusLine = bookHome.querySelector('[data-role="book-status"]');
    if (homeEntry && homeEntry.lastSection) {
      var homeSeen = (homeEntry.lastIndex && homeEntry.lastIndex > 0) ? homeEntry.lastIndex : null;
      if (continueLink) {
        continueLink.textContent = homeSeen ? '继续阅读第 ' + homeSeen + ' 篇' : '继续阅读';
        continueLink.setAttribute('href', entryTarget(homeEntry, continueLink.getAttribute('href')));
      }
      if (statusLine) {
        statusLine.textContent = homeSeen ? '上次读到第 ' + homeSeen + ' 篇，点击继续会回到正文位置。' : '已保存上次阅读位置。';
      }
    }
  }

  if (!gallery) return;

  var cards = Array.prototype.slice.call(gallery.querySelectorAll('.book-card'));

  cards.forEach(function (card) {
    var bookId  = card.getAttribute('data-book-id');
    var total   = parseInt(card.getAttribute('data-total-fables'), 10) || 0;
    var badge   = card.querySelector('[data-role="badge"]');
    var prog    = card.querySelector('[data-role="progress"]');
    var hint    = card.querySelector('[data-role="hint"]');
    var meter   = card.querySelector('[data-role="meter"]');
    var entry   = state[bookId] || null;

    if (entry && entry.lastSection) {
      // The first path segment under the book root is the chapter folder slug
      // (e.g. "01-证券投资基金概述" or "01-there-are-at-least-two-kinds-of-games").
      var firstSeg = entry.lastSection.split('/')[0];
      var chapter  = prettyChapter(firstSeg);
      var seen     = (entry.lastIndex && entry.lastIndex > 0) ? entry.lastIndex : null;

      badge.textContent = '最近读到 ' + (seen ? '第 ' + seen + ' 篇' : chapter);
      badge.classList.add('book-card__badge--seen');
      badge.title = chapter; // hover shows the full chapter name even when truncated
      if (seen) {
        prog.textContent = seen + ' / ' + total + ' 篇';
        card.style.setProperty('--book-progress', Math.min(seen / total, 1));
      }
      if (hint) hint.textContent = '继续阅读';
    } else if (meter) {
      card.style.setProperty('--book-progress', 0);
    }

    // ---- 4. Click → jump to last-read section ----
    card.addEventListener('click', function (ev) {
      // Allow normal link behaviour when modifier keys are held
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

      ev.preventDefault();
      var target = entryTarget(entry, card.getAttribute('href'));
      window.location.assign(target);
    });
  });

  // ---- 5. Sort: most-recently-read first, never-read last ----
  cards.sort(function (a, b) {
    var ea = state[a.getAttribute('data-book-id')] || {};
    var eb = state[b.getAttribute('data-book-id')] || {};
    return (eb.lastReadAt || 0) - (ea.lastReadAt || 0);
  });
  cards.forEach(function (c) { gallery.appendChild(c); });
})();
