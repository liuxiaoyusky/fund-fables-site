// Reader controls for individual fable pages:
// - previous/next story links from MkDocs' static search index
// - return links to the site home and the current book shelf
// - local, per-page text highlights
(function () {
  'use strict';

  var HIGHLIGHT_PREFIX = 'fables:highlights:';
  var collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

  function normalisePath(pathname) {
    var path = (pathname || '/')
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '/')
      .replace(/\/+$/, '/') || '/';
    try { path = decodeURIComponent(path); } catch (e) {}
    return path;
  }

  function classify(pathname) {
    var path = normalisePath(pathname);
    var match = path.match(/^\/?fables\/([^/]+)\/(.+)$/);
    if (!match) return null;
    if (match[2] === '') return null;
    if (match[2] === 'index/' || match[2] === 'catalog/' || match[2] === 'progress/') return null;
    var catalogPaths = {
      'fund-fables': '/fables/fund-fables/catalog/',
      'iique-paper-1': '/fables/iique-paper-1/catalog/',
      'iique-paper-1-v2': '/fables/iique-paper-1-v2/catalog/'
    };
    return {
      path: path.charAt(0) === '/' ? path : '/' + path,
      bookId: match[1],
      bookPath: '/fables/' + match[1] + '/',
      catalogPath: catalogPaths[match[1]] || '/fables/' + match[1] + '/'
    };
  }

  var page = classify(window.location.pathname);
  var article = document.querySelector('.md-content__inner');
  if (!page || !article) return;
  document.body.classList.add('page-reader');
  article.classList.add('reader-article');

  function storageKey() {
    return HIGHLIGHT_PREFIX + page.path;
  }

  function readHighlights() {
    try {
      var raw = localStorage.getItem(storageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeHighlights(items) {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(items));
    } catch (e) {}
  }

  function textNodes(root) {
    var nodes = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.closest('.reader-tools, .reader-bottom-nav, .reader-highlight-actions')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
  }

  function offsetForPoint(root, targetNode, targetOffset) {
    var offset = 0;
    var nodes = textNodes(root);
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      if (node === targetNode) return offset + targetOffset;
      offset += node.nodeValue.length;
    }
    return null;
  }

  function pointForOffset(root, targetOffset) {
    var offset = 0;
    var nodes = textNodes(root);
    for (var i = 0; i < nodes.length; i += 1) {
      var node = nodes[i];
      var next = offset + node.nodeValue.length;
      if (targetOffset < next) {
        return { node: node, offset: Math.max(0, targetOffset - offset) };
      }
      offset = next;
    }
    var last = nodes[nodes.length - 1];
    return last ? { node: last, offset: last.nodeValue.length } : null;
  }

  function unwrapExistingHighlights() {
    Array.prototype.slice.call(article.querySelectorAll('mark.reader-highlight')).forEach(function (mark) {
      var parent = mark.parentNode;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    });
  }

  function applyHighlight(item) {
    var start = pointForOffset(article, item.start);
    var end = pointForOffset(article, item.end);
    if (!start || !end) return false;

    var range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    if (!range.toString().trim()) return false;

    var mark = document.createElement('mark');
    mark.className = 'reader-highlight';
    mark.dataset.highlightId = item.id;

    try {
      range.surroundContents(mark);
      return true;
    } catch (e) {
      return false;
    }
  }

  function restoreHighlights() {
    unwrapExistingHighlights();
    readHighlights()
      .sort(function (a, b) { return b.start - a.start; })
      .forEach(applyHighlight);
  }

  function selectedRange() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
    var range = selection.getRangeAt(0);
    if (!article.contains(range.commonAncestorContainer)) return null;
    return range;
  }

  function saveSelectionAsHighlight(status) {
    var range = selectedRange();
    if (!range) {
      if (status) status.textContent = '先选中一段正文，再点“划重点”。';
      return false;
    }

    var start = offsetForPoint(article, range.startContainer, range.startOffset);
    var end = offsetForPoint(article, range.endContainer, range.endOffset);
    if (start === null || end === null || start === end) {
      if (status) status.textContent = '这段文字暂时不能划重点。';
      return false;
    }

    if (start > end) {
      var tmp = start;
      start = end;
      end = tmp;
    }

    var highlights = readHighlights();
    highlights.push({
      id: String(Date.now()),
      start: start,
      end: end,
      text: range.toString()
    });
    writeHighlights(highlights);
    window.getSelection().removeAllRanges();
    restoreHighlights();
    if (status) status.textContent = '已保存本页重点。';
    return true;
  }

  function clearHighlights(status) {
    writeHighlights([]);
    restoreHighlights();
    status.textContent = '已清除本页重点。';
  }

  function searchIndexUrl() {
    var prefix = window.location.pathname.split('/fables/')[0] || '';
    return prefix + '/search/search_index.json';
  }

  function pageFromDoc(doc) {
    if (!doc || !doc.location || doc.location.indexOf('#') !== -1) return null;
    var location = normalisePath('/' + doc.location.replace(/^\//, ''));
    if (location.indexOf(page.bookPath) !== 0) return null;
    if (location === page.bookPath || location === page.bookPath + 'progress/') return null;
    return {
      href: location,
      title: doc.title || '未命名故事'
    };
  }

  function uniquePages(docs) {
    var seen = {};
    return docs
      .map(pageFromDoc)
      .filter(Boolean)
      .filter(function (item) {
        if (seen[item.href]) return false;
        seen[item.href] = true;
        return true;
      })
      .sort(function (a, b) { return collator.compare(a.href, b.href); });
  }

  function shortTitle(item, fallback) {
    if (!item) return fallback;
    return item.title || fallback;
  }

  function createLink(className, href, label, caption) {
    var link = document.createElement('a');
    link.className = className;
    link.href = href;
    link.innerHTML = '<span>' + label + '</span><strong>' + caption + '</strong>';
    return link;
  }

  function insertReaderTools(prev, next, currentIndex, total) {
    var tools = document.createElement('nav');
    tools.className = 'reader-tools';
    tools.setAttribute('aria-label', '阅读工具');
    tools.style.setProperty('--reader-progress', total > 0 ? (currentIndex + 1) / total : 0);

    var nav = document.createElement('div');
    nav.className = 'reader-tools__nav';
    nav.appendChild(createLink('reader-tools__link', '/', '主页', '回到书架首页'));
    nav.appendChild(createLink('reader-tools__link', page.catalogPath, '本书目录', '选择章节'));
    if (prev) nav.appendChild(createLink('reader-tools__link', prev.href, '上一篇', shortTitle(prev, '上一章')));
    if (next) nav.appendChild(createLink('reader-tools__link', next.href, '下一篇', shortTitle(next, '下一章')));

    tools.appendChild(nav);

    var position = document.createElement('div');
    position.className = 'reader-tools__position';
    position.innerHTML = '<span>Reading position</span><strong>' +
      String(currentIndex + 1).padStart(3, '0') + ' / ' + String(total).padStart(3, '0') +
      '</strong>';
    tools.appendChild(position);
    article.insertBefore(tools, article.firstChild);

    var bottom = document.createElement('nav');
    bottom.className = 'reader-bottom-nav';
    bottom.setAttribute('aria-label', '章节切换');
    if (prev) bottom.appendChild(createLink('reader-bottom-nav__link', prev.href, '上一篇', shortTitle(prev, '上一章')));
    bottom.appendChild(createLink('reader-bottom-nav__link', page.catalogPath, '本书目录', '返回章节选择'));
    if (next) bottom.appendChild(createLink('reader-bottom-nav__link', next.href, '下一篇', shortTitle(next, '下一章')));
    article.appendChild(bottom);

    // Floating highlight panel — docked to the bottom-right of the viewport
    // so the controls stay reachable while the reader is mid-paragraph.
    var panel = document.createElement('aside');
    panel.className = 'reader-highlight-panel';
    panel.setAttribute('aria-label', '划重点');
    panel.innerHTML =
      '<button type="button" class="reader-highlight-panel__toggle" ' +
        'data-reader-action="toggle" aria-expanded="false" aria-controls="reader-highlight-panel__body">' +
        '<span class="reader-highlight-panel__label">划重点</span>' +
      '</button>' +
      '<div class="reader-highlight-panel__body" id="reader-highlight-panel__body" hidden>' +
        '<button type="button" data-reader-action="highlight">保存本段重点</button>' +
        '<button type="button" data-reader-action="clear">清除本页重点</button>' +
        '<span class="reader-highlight-panel__status" data-reader-status>选中文字后保存到本机。</span>' +
      '</div>';
    document.body.appendChild(panel);

    var toggle = panel.querySelector('[data-reader-action="toggle"]');
    var body = panel.querySelector('.reader-highlight-panel__body');
    var status = panel.querySelector('[data-reader-status]');
    var open = false;
    toggle.addEventListener('click', function () {
      open = !open;
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.classList.toggle('reader-highlight-panel--open', open);
    });

    panel.querySelector('[data-reader-action="highlight"]').addEventListener('click', function () {
      saveSelectionAsHighlight(status);
    });
    panel.querySelector('[data-reader-action="clear"]').addEventListener('click', function () {
      clearHighlights(status);
    });

    // Expose status for tests / external callers without leaking globals.
    tools.__status = status;

    // Selection toolbar — the primary highlight path on mobile.
    // After a long-press selects text, browsers raise the native selection
    // menu; we position a small floating bar above the selection with a
    // single “划重点” button, so the user doesn't have to reach the
    // bottom-right panel while the native menu is still on screen.
    var toolbar = document.createElement('div');
    toolbar.className = 'reader-highlight-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', '划重点');
    toolbar.hidden = true;
    toolbar.innerHTML =
      '<button type="button" data-reader-action="toolbar-highlight">划重点</button>';
    document.body.appendChild(toolbar);

    function positionToolbar() {
      var sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        toolbar.hidden = true;
        return;
      }
      var range = sel.getRangeAt(0);
      if (!article.contains(range.commonAncestorContainer)) {
        toolbar.hidden = true;
        return;
      }
      var rect = range.getBoundingClientRect();
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        toolbar.hidden = true;
        return;
      }
      var tbWidth = toolbar.offsetWidth || 120;
      var left = rect.left + rect.width / 2 - tbWidth / 2;
      var top = rect.top - 44;
      var viewportW = document.documentElement.clientWidth;
      var margin = 8;
      left = Math.max(margin, Math.min(left, viewportW - tbWidth - margin));
      if (top < margin) top = rect.bottom + 8;
      toolbar.style.left = left + 'px';
      toolbar.style.top = top + 'px';
      toolbar.hidden = false;
    }

    var toolbarBtn = toolbar.querySelector('button');
    toolbarBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var saved = saveSelectionAsHighlight(status);
      toolbar.hidden = true;
      // Mirror save feedback into the panel status too.
      if (saved) status.textContent = '已保存本页重点。';
    });

    // Hide on any of: selection collapse, scroll, escape, click outside.
    document.addEventListener('selectionchange', positionToolbar);
    // selectionchange is not always fired after a touch long-press on iOS,
    // so we also position the toolbar on the trailing mouseup/touchend
    // events. These fire on real user interaction even when the synthetic
    // selectionchange is unreliable.
    function onSelectionFinal() {
      // Defer one frame so the selection is finalised before measuring.
      setTimeout(positionToolbar, 0);
    }
    document.addEventListener('mouseup', onSelectionFinal);
    document.addEventListener('touchend', onSelectionFinal);
    window.addEventListener('scroll', function () { toolbar.hidden = true; }, { passive: true });
    window.addEventListener('resize', function () { toolbar.hidden = true; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') toolbar.hidden = true;
    });
    // Touch/click outside the toolbar dismisses it but keeps the selection
    // so the user can still use the bottom-right panel if they prefer.
    document.addEventListener('mousedown', function (e) {
      if (!toolbar.hidden && !toolbar.contains(e.target)) toolbar.hidden = true;
    });
    document.addEventListener('touchstart', function (e) {
      if (!toolbar.hidden && !toolbar.contains(e.target)) toolbar.hidden = true;
    }, { passive: true });
    // The toolbar button's own mousedown/touchstart would otherwise trigger
    // the dismissal handler above. Stop it from bubbling.
    toolbar.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    toolbar.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
  }

  fetch(searchIndexUrl())
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (index) {
      if (!index || !index.docs) return;
      var pages = uniquePages(index.docs);
      var currentIndex = pages.findIndex(function (item) { return item.href === page.path; });
      if (currentIndex === -1) return;
      insertReaderTools(pages[currentIndex - 1] || null, pages[currentIndex + 1] || null, currentIndex, pages.length);
      restoreHighlights();
    })
    .catch(function () {});
})();
