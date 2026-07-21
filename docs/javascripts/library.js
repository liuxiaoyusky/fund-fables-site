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

  if (gallery || featured) document.body.classList.add('page-library-home');
  if (bookHome) document.body.classList.add('page-book-directory');

  // ---- 1. Read library state ----
  var state = {};
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    state = raw ? JSON.parse(raw) : {};
  } catch (e) { state = {}; }

  var preferredIiqeVersion = 'v2';
  try {
    preferredIiqeVersion = localStorage.getItem('fables:iique-version') === 'v1' ? 'v1' : 'v2';
  } catch (e) {}

  function entryForBook(bookId) {
    if (bookId === 'iique-paper-1-v2' && preferredIiqeVersion === 'v1') {
      return state['iique-paper-1'] || null;
    }
    return state[bookId] || null;
  }

  function preferredMetadata(row) {
    var useIiqeV1 = row.getAttribute('data-book-id') === 'iique-paper-1-v2'
      && preferredIiqeVersion === 'v1';
    return {
      total: parseInt(row.getAttribute(useIiqeV1 ? 'data-total-fables-v1' : 'data-total-fables'), 10) || 0,
      subtitle: useIiqeV1 ? row.getAttribute('data-subtitle-v1') : null,
      fablesLabel: useIiqeV1 ? row.getAttribute('data-fables-label-v1') : null,
      lead: useIiqeV1 ? row.getAttribute('data-lead-v1') : null
    };
  }

  function seenCount(entry) {
    if (!entry) return 0;
    var sectionCount = entry.sections ? Object.keys(entry.sections).length : 0;
    if (sectionCount > 0) return sectionCount;
    return entry.lastIndex && entry.lastIndex > 0 ? entry.lastIndex : 0;
  }

  function savedScrollY(entry) {
    if (!entry) return 0;
    var section = entry.lastSection && entry.sections ? entry.sections[entry.lastSection] : null;
    var y = section ? parseInt(section.scrollY, 10) : 0;
    return isNaN(y) ? 0 : y;
  }

  // ---- 2. Pretty-print a chapter slug ----
  function prettyChapter(slug) {
    if (!slug) return '';
    try { slug = decodeURIComponent(slug); } catch (e) {}
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
      var y = savedScrollY(entry);
      return normaliseStoredUrl(entry.lastUrl) + (y > 0 ? '?y=' + y : '');
    }
    return fallback;
  }

  // ---- 3. Enhance every homepage/book landing control ----
  var quickLinks = Array.prototype.slice.call(document.querySelectorAll('.library-quick-book'));

  quickLinks.forEach(function (link) {
    var bookId = link.getAttribute('data-book-id');
    var entry = entryForBook(bookId);
    var status = link.querySelector('[data-role="quick-status"]');
    var action = link.querySelector('[data-role="quick-action"]');

    if (entry && entry.lastSection) {
      var seen = seenCount(entry) || null;
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
      var homeSeen = seenCount(homeEntry) || null;
      if (continueLink) {
        continueLink.textContent = homeSeen ? '继续阅读第 ' + homeSeen + ' 篇' : '继续阅读';
        continueLink.setAttribute('href', entryTarget(homeEntry, continueLink.getAttribute('href')));
      }
      if (statusLine) {
        statusLine.textContent = homeSeen ? '上次读到第 ' + homeSeen + ' 篇，点击继续会回到正文位置。' : '已保存上次阅读位置。';
      }
    }

    var version = bookHomePanel.getAttribute('data-version-panel');
    var toc = document.querySelector('.book-toc[data-version-panel="' + version + '"]');
    if (toc) {
      Array.prototype.slice.call(toc.querySelectorAll('.book-toc-card[data-chapter-key]')).forEach(function (card) {
        var chapterKey = card.getAttribute('data-chapter-key');
        var total = parseInt(card.getAttribute('data-chapter-total'), 10) || 0;
        var sections = homeEntry && homeEntry.sections ? Object.keys(homeEntry.sections) : [];
        var count = sections.filter(function (sectionPath) {
          return sectionPath === chapterKey || sectionPath.indexOf(chapterKey + '/') === 0;
        }).length;
        var progress = total > 0 ? Math.min(count / total, 1) : 0;
        var progressEl = card.querySelector('[data-role="chapter-progress"]');
        var statusEl = card.querySelector('[data-role="chapter-status"]');
        card.style.setProperty('--chapter-progress', progress);
        card.classList.toggle('book-toc-card--seen', count > 0 && count < total);
        card.classList.toggle('book-toc-card--complete', total > 0 && count >= total);
        if (progressEl) progressEl.textContent = count + ' / ' + total;
        if (statusEl) statusEl.textContent = count >= total && total > 0 ? '已完成' : (count > 0 ? '阅读中' : '未开始');
      });
    }
  });

  if (!gallery) return;

  var rows = Array.prototype.slice.call(gallery.querySelectorAll('.shelf-row'));

  // ---- 4. Pick featured book ----
  // Priority: most-recently-read > first row > default from data-featured-source
  var featuredId = null;
  var bestTime = -1;
  rows.forEach(function (row) {
    var entry = entryForBook(row.getAttribute('data-book-id')) || {};
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
    var fEntry = entryForBook(featuredId);
    var fTitle = featuredRow.querySelector('.shelf-row__title strong');
    var fSub   = featuredRow.querySelector('.shelf-row__title small');
    var featuredMetadata = preferredMetadata(featuredRow);
    var fTotal = featuredMetadata.total;
    var fHref  = featuredRow.getAttribute('data-href') || '';
    var hasVersions = featuredRow.getAttribute('data-has-versions') === 'true';
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
    var secondaryEl = featured.querySelector('[data-role="featured-secondary"]');
    var eyebrow  = featured.querySelector('[data-role="featured-eyebrow"]');
    var volEl    = featured.querySelector('[data-role="featured-vol"]');
    var coverVol = featured.querySelector('[data-role="featured-cover-vol"]');

    // Look for the right .featured__cover (it also has data-role="..." actually it's a div without role)
    coverEl = featured.querySelector('.featured__cover') || coverEl;

    if (titleEl && fTitle) titleEl.textContent = fTitle.textContent;
    if (subEl && fSub) subEl.textContent = featuredMetadata.subtitle || fSub.textContent;
    if (leadEl) {
      // Lead text: prefer a row-scoped dataset, otherwise a default per book
      var lead = featuredMetadata.lead || featuredRow.getAttribute('data-lead');
      if (!lead) {
        var defaults = {
          'fund-fables': '用故事串起基金分类、投资工具、风险管理和业绩评价，覆盖 18 个章节。',
          'private-equity-funds': '从概念到退出，9 章 568 篇私募股权基金知识都被改写成连续的小镇故事。',
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
    var seen = seenCount(fEntry) || null;
    var firstSeg = fEntry && fEntry.lastSection ? fEntry.lastSection.split('/')[0] : '';
    var chapter = firstSeg ? prettyChapter(firstSeg) : '';

    if (progEl) progEl.textContent = (seen || 0) + ' / ' + fTotal + ' 篇';
    if (chapEl) chapEl.textContent = seen ? ('读到第 ' + seen + ' 篇') : (chapter ? ('最近读到 · ' + chapter) : '尚未开始');

    if (meterEl) {
      var progress = seen ? Math.min(seen / fTotal, 1) : 0;
      meterEl.style.setProperty('--book-progress', progress);
    }

    if (ctaEl) {
      ctaEl.textContent = seen ? '继续阅读' : '开始阅读';
      ctaEl.setAttribute('href', entryTarget(fEntry, fHref));
    }
    if (secondaryEl) {
      secondaryEl.textContent = hasVersions ? '选择版本' : '查看目录';
      secondaryEl.setAttribute('href', fHref);
    }

    if (eyebrow) {
      eyebrow.textContent = seen
        ? 'Currently Reading · 续读'
        : 'Editor’s Pick · 编辑推荐';
    }
  }

  // ---- 6. Mark rows + fill shelf-row state. The featured book remains
  //         visible so the shelf always contains the stated five books. ----
  rows.forEach(function (row) {
    var bookId  = row.getAttribute('data-book-id');
    var metadata = preferredMetadata(row);
    var total   = metadata.total;
    var status  = row.querySelector('[data-role="row-status"]');
    var meter   = row.querySelector('[data-role="meter"]');
    var entry   = entryForBook(bookId);
    var rowSubtitle = row.querySelector('.shelf-row__title small');
    var rowFables = row.querySelector('.shelf-row__fables');
    row.classList.remove('shelf-row--hidden');

    if (metadata.subtitle && rowSubtitle) rowSubtitle.textContent = metadata.subtitle;
    if (metadata.fablesLabel && rowFables) rowFables.textContent = metadata.fablesLabel;

    if (entry && entry.lastSection) {
      var firstSeg = entry.lastSection.split('/')[0];
      var chapter  = prettyChapter(firstSeg);
      var seen     = seenCount(entry) || null;

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
      var target = row.getAttribute('data-has-versions') === 'true'
        ? fallback
        : entryTarget(entry, fallback);
      window.location.assign(target);
    });

    row.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      var fallback = row.getAttribute('data-href');
      var target = row.getAttribute('data-has-versions') === 'true'
        ? fallback
        : entryTarget(entry, fallback);
      window.location.assign(target);
    });

    // Make rows keyboard-focusable so the red hover bar works without a mouse
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'link');
  });

  // ---- 8. Sort: most-recently-read first, never-read last ----
  rows.sort(function (a, b) {
    var ea = entryForBook(a.getAttribute('data-book-id')) || {};
    var eb = entryForBook(b.getAttribute('data-book-id')) || {};
    return (eb.lastReadAt || 0) - (ea.lastReadAt || 0);
  });
  rows.forEach(function (c) { gallery.appendChild(c); });

  // ---- 9. Update shelf count ----
  var countEl = document.querySelector('[data-role="shelf-count"]');
  if (countEl) countEl.textContent = String(rows.length);
})();
