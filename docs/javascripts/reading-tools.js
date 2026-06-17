// Reader controls for individual fable pages:
// - previous/next story links from MkDocs' static search index
// - return links to the site home and the current book shelf
// - local, per-page text highlights
(function () {
  'use strict';

  var HIGHLIGHT_PREFIX = 'fables:highlights:';
  var collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

  function normalisePath(pathname) {
    return (pathname || '/')
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '/')
      .replace(/\/+$/, '/') || '/';
  }

  function classify(pathname) {
    var path = normalisePath(pathname);
    var match = path.match(/^\/?fables\/([^/]+)\/(.+)$/);
    if (!match) return null;
    if (match[2] === '') return null;
    if (match[2] === 'index/' || match[2] === 'progress/') return null;
    return {
      path: path.charAt(0) === '/' ? path : '/' + path,
      bookId: match[1],
      bookPath: '/fables/' + match[1] + '/'
    };
  }

  var page = classify(window.location.pathname);
  var article = document.querySelector('.md-content__inner');
  if (!page || !article) return;

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
      status.textContent = '先选中一段正文，再点“划重点”。';
      return;
    }

    var start = offsetForPoint(article, range.startContainer, range.startOffset);
    var end = offsetForPoint(article, range.endContainer, range.endOffset);
    if (start === null || end === null || start === end) {
      status.textContent = '这段文字暂时不能划重点。';
      return;
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
    status.textContent = '已保存本页重点。';
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

  function insertReaderTools(prev, next) {
    var tools = document.createElement('nav');
    tools.className = 'reader-tools';
    tools.setAttribute('aria-label', '阅读工具');

    var nav = document.createElement('div');
    nav.className = 'reader-tools__nav';
    nav.appendChild(createLink('reader-tools__link', '/', '主页', '回到书架首页'));
    nav.appendChild(createLink('reader-tools__link', page.bookPath, '本书目录', '选择章节'));
    if (prev) nav.appendChild(createLink('reader-tools__link', prev.href, '上一篇', shortTitle(prev, '上一章')));
    if (next) nav.appendChild(createLink('reader-tools__link', next.href, '下一篇', shortTitle(next, '下一章')));

    var highlight = document.createElement('div');
    highlight.className = 'reader-highlight-actions';
    highlight.innerHTML =
      '<button type="button" data-reader-action="highlight">划重点</button>' +
      '<button type="button" data-reader-action="clear">清除本页重点</button>' +
      '<span data-reader-status>选中文字后保存到本机。</span>';

    tools.appendChild(nav);
    tools.appendChild(highlight);
    article.insertBefore(tools, article.firstChild);

    var bottom = document.createElement('nav');
    bottom.className = 'reader-bottom-nav';
    bottom.setAttribute('aria-label', '章节切换');
    if (prev) bottom.appendChild(createLink('reader-bottom-nav__link', prev.href, '上一篇', shortTitle(prev, '上一章')));
    bottom.appendChild(createLink('reader-bottom-nav__link', page.bookPath, '本书目录', '返回章节选择'));
    if (next) bottom.appendChild(createLink('reader-bottom-nav__link', next.href, '下一篇', shortTitle(next, '下一章')));
    article.appendChild(bottom);

    var status = tools.querySelector('[data-reader-status]');
    tools.querySelector('[data-reader-action="highlight"]').addEventListener('click', function () {
      saveSelectionAsHighlight(status);
    });
    tools.querySelector('[data-reader-action="clear"]').addEventListener('click', function () {
      clearHighlights(status);
    });
  }

  fetch(searchIndexUrl())
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (index) {
      if (!index || !index.docs) return;
      var pages = uniquePages(index.docs);
      var currentIndex = pages.findIndex(function (item) { return item.href === page.path; });
      if (currentIndex === -1) return;
      insertReaderTools(pages[currentIndex - 1] || null, pages[currentIndex + 1] || null);
      restoreHighlights();
    })
    .catch(function () {});
})();
