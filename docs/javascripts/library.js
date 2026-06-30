// Home-page book gallery: read state from localStorage, promote the most
// recently read book into the featured slot, and sort the remaining rows
// by most-recently-read first. Each shelf-row click jumps to the last
// read section (with a ?y=NNN scroll-restore hint).
(function () {
  'use strict';

  var STORAGE_KEY = 'fables:library';
  var gallery = document.getElementById('book-gallery');
  var featured = document.querySelector('.featured');
  var bookHome = document.querySelector('[data-book-home]');
  var bookHomes = document.querySelectorAll('[data-book-home]');
  if (!gallery && !featured && !bookHome) return;

  // ---- 1. Read library state ----
  var state = {};
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : {};
  } catch (e) { state = {}; }

  // ---- 2. Pretty-print a chapter slug ----
  function prettyChapter(slug) {
    if (!slug) return '';
    return slug
      .replace(/^\d+-/, function (m) { return m + ' '; })
      .split('-')
      .map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; })
      .join(' ');
  }

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

  // ---- 3. Enhance every homepage/book landing control ----
  var quickLinks = Array.prototype.slice.call(document.querySelectorAll('.library-quick-book'));

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

  // ---- 3b. Enhance every book-home panel (a page may carry several, e.g.
  //         the IIQE P1 book home shows v1 and v2 panels behind a switcher) ----
  Array.prototype.slice.call(bookHomes).forEach(function (bookHomePanel) {
    var homeBookId = bookHomePanel.getAttribute('data-book-home');
    var homeEntry = state[homeBookId] || null;
    var continueLink = bookHomePanel.querySelector('[data-role="book-continue"]');
    var statusLine = bookHomePanel.querySelector('[data-role="book-status"]');
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
  });

  // ---- 3c. Version switcher (IIQE P1 keeps v1 + v2 behind tabs) ----
  var switcher = document.querySelector('[data-version-switcher]');
  if (switcher) {
    var panels = document.querySelectorAll('[data-version-panel]');
    var tabs = Array.prototype.slice.call(switcher.querySelectorAll('[data-version]'));
    var VER_PREF_KEY = 'fables:iique-version';

    function showVersion(ver) {
      Array.prototype.slice.call(panels).forEach(function (p) {
        p.hidden = (p.getAttribute('data-version-panel') !== ver);
      });
      tabs.forEach(function (t) {
        var active = (t.getAttribute('data-version') === ver);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        t.classList.toggle('version-tab--active', active);
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var ver = t.getAttribute('data-version');
        showVersion(ver);
        try { localStorage.setItem(VER_PREF_KEY, ver); } catch (e) {}
      });
    });

    // Restore saved preference (default v2). Only override if the user has
    // explicitly chosen v1 before.
    var savedVer = null;
    try { savedVer = localStorage.getItem(VER_PREF_KEY); } catch (e) {}
    if (savedVer === 'v1' || savedVer === 'v2') showVersion(savedVer);
  }

  if (!gallery) return;

  var rows = Array.prototype.slice.call(gallery.querySelectorAll('.shelf-row'));

  // ---- 4. Pick featured book ----
  // Priority: most-recently-read > first row > default from data-featured-source
  var featuredId = null;
  var bestTime = -1;
  rows.forEach(function (row) {
    var entry = state[row.getAttribute('data-book-id')] || {};
    var t = entry.lastReadAt || 0;
    if (t > bestTime) { bestTime = t; featuredId = row.getAttribute('data-book-id'); }
  });
  if (!featuredId && featured) {
    featuredId = featured.getAttribute('data-featured-source') ||
                 (rows[0] && rows[0].getAttribute('data-book-id'));
  }
  if (!featuredId) return;

  var featuredRow = rows.find(function (r) {
    return r.getAttribute('data-book-id') === featuredId;
  });
  if (!featuredRow) return;

  // ---- 5. Hydrate the featured slot from the chosen row's metadata ----
  if (featured) {
    var fEntry = state[featuredId] || null;
    var fTitle = featuredRow.querySelector('.shelf-row__title strong');
    var fSub   = featuredRow.querySelector('.shelf-row__title small');
    var fTotal = parseInt(featuredRow.getAttribute('data-total-fables'), 10) || 0;
    var fHref  = featuredRow.getAttribute('data-href') || '';
    var fCover = featuredRow.getAttribute('data-cover-class') || 'book-card--fund';
    var fVol   = featuredRow.querySelector('.shelf-row__vol');

    var titleEl  = featured.querySelector('[data-role="featured-title"]');
    var subEl    = featured.querySelector('[data-role="featured-subtitle"]');
    var leadEl   = featured.querySelector('[data-role="featured-lead"]');
    var coverEl  = featured.querySelector('[data-role], .featured__cover');
    var meterEl  = featured.querySelector('[data-role="featured-meter"]');
    var progEl   = featured.querySelector('[data-role="featured-progress"]');
    var chapEl   = featured.querySelector('[data-role="featured-chapter"]');
    var ctaEl    = featured.querySelector('[data-role="featured-cta"]');
    var eyebrow  = featured.querySelector('[data-role="featured-eyebrow"]');
    var volEl    = featured.querySelector('[data-role="featured-vol"]');
    var coverVol = featured.querySelector('[data-role="featured-cover-vol"]');

    // Look for the right .featured__cover (it also has data-role="..." actually it's a div without role)
    coverEl = featured.querySelector('.featured__cover') || coverEl;

    if (titleEl && fTitle) titleEl.textContent = fTitle.textContent;
    if (subEl && fSub) subEl.textContent = fSub.textContent;
    if (leadEl) {
      // Lead text: prefer a row-scoped dataset, otherwise a default per book
      var lead = featuredRow.getAttribute('data-lead');
      if (!lead) {
        var defaults = {
          'fund-fables': '用故事串起基金分类、投资工具、风险管理和业绩评价，覆盖 18 个章节。',
          'private-equity-funds': '从概念到退出，9 章 337 篇私募股权基金知识都被改写成连续的小镇故事。',
          'finite-and-infinite-games': '把 James Carse 的小书每一节都改写成 1952 年上海十六铺风格的寓言故事。',
          'zhishen-dingnei': '产品经理读《孙子兵法》：用九篇小故事把"道、天、地、将、法"翻译成日常决策的语言。',
          'iique-paper-1': '香港保险中介 IIQE 卷一核心考点：从核保到索偿，每一节都换成可以一口气读完的小故事。',
          'iique-paper-1-v2': '香港保险中介 IIQE 卷一 v2 新版：196 篇老香港风情寓言，叙事与细节全面重写。'
        };
        lead = defaults[featuredId] || '';
      }
      leadEl.textContent = lead;
    }

    if (coverEl) {
      // Strip previous cover modifier class, add the one matching this row
      coverEl.classList.remove('book-card--fund', 'book-card--equity', 'book-card--game', 'book-card--dingnei', 'book-card--iique');
      if (fCover) coverEl.classList.add(fCover);
    }

    if (volEl && fVol) volEl.textContent = fVol.textContent;
    if (coverVol && fVol) coverVol.textContent = fVol.textContent.replace(/^Vol\.\s*/, '').trim();

    // Progress + chapter + CTA
    var seen = (fEntry && fEntry.lastIndex && fEntry.lastIndex > 0) ? fEntry.lastIndex : null;
    var firstSeg = fEntry && fEntry.lastSection ? fEntry.lastSection.split('/')[0] : '';
    var chapter = firstSeg ? prettyChapter(firstSeg) : '';

    if (progEl) progEl.textContent = seen ? (seen + ' / ' + fTotal + ' 篇') : ('共 ' + fTotal + ' 篇寓言');
    if (chapEl) chapEl.textContent = seen ? ('读到第 ' + seen + ' 篇') : (chapter ? ('最近读到 · ' + chapter) : '尚未开始');

    if (meterEl) {
      var progress = seen ? Math.min(seen / fTotal, 1) : 0;
      meterEl.style.setProperty('--book-progress', progress);
    }

    if (ctaEl) {
      ctaEl.textContent = seen ? '继续阅读' : '开始阅读';
      ctaEl.setAttribute('href', entryTarget(fEntry, fHref));
    }

    if (eyebrow) {
      eyebrow.textContent = seen
        ? 'Currently Reading · 续读'
        : 'Editor’s Pick · 编辑推荐';
    }
  }

  // ---- 6. Mark rows + fill shelf-row state, hide the featured one ----
  rows.forEach(function (row) {
    var bookId  = row.getAttribute('data-book-id');
    var total   = parseInt(row.getAttribute('data-total-fables'), 10) || 0;
    var status  = row.querySelector('[data-role="row-status"]');
    var meter   = row.querySelector('[data-role="meter"]');
    var entry   = state[bookId] || null;

    if (bookId === featuredId) {
      row.classList.add('shelf-row--hidden');
    } else {
      row.classList.remove('shelf-row--hidden');
    }

    if (entry && entry.lastSection) {
      var firstSeg = entry.lastSection.split('/')[0];
      var chapter  = prettyChapter(firstSeg);
      var seen     = (entry.lastIndex && entry.lastIndex > 0) ? entry.lastIndex : null;

      row.classList.add('shelf-row--seen');
      if (status) status.textContent = seen ? ('读到第 ' + seen + ' 篇') : (chapter || '可继续');
      if (meter) {
        if (seen) {
          meter.style.setProperty('--book-progress', Math.min(seen / total, 1));
        } else {
          meter.style.setProperty('--book-progress', 0.04);
        }
      }
    } else {
      row.classList.remove('shelf-row--seen');
      if (status) status.textContent = '未开始';
      if (meter) meter.style.setProperty('--book-progress', 0);
    }

    // ---- 7. Click → jump to last-read section ----
    row.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      var fallback = row.getAttribute('data-href');
      var target = entryTarget(entry, fallback);
      window.location.assign(target);
    });

    // Make rows keyboard-focusable so the red hover bar works without a mouse
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'link');
  });

  // ---- 8. Sort: most-recently-read first, never-read last ----
  // Hidden rows (the one currently in featured) sort to the very top so
  // they end up at the front of the DOM, then we keep them out of sight
  // via .shelf-row--hidden. This keeps DOM order stable for screen readers.
  rows.sort(function (a, b) {
    var aHidden = a.classList.contains('shelf-row--hidden');
    var bHidden = b.classList.contains('shelf-row--hidden');
    if (aHidden !== bHidden) return aHidden ? -1 : 1;
    var ea = state[a.getAttribute('data-book-id')] || {};
    var eb = state[b.getAttribute('data-book-id')] || {};
    return (eb.lastReadAt || 0) - (ea.lastReadAt || 0);
  });
  rows.forEach(function (c) { gallery.appendChild(c); });

  // ---- 9. Update shelf count ----
  var countEl = document.querySelector('[data-role="shelf-count"]');
  if (countEl) countEl.textContent = String(rows.length);
})();