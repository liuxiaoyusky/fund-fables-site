// Version gateways and recursive Story Route catalogs.
(function () {
  'use strict';

  var LIBRARY_KEY = 'fables:library';
  var gateway = document.querySelector('[data-version-gateway]');
  var catalog = document.querySelector('[data-recursive-catalog]');
  if (!gateway && !catalog) return;

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function normaliseId(value) {
    var result = value || '';
    try { result = decodeURIComponent(result); } catch (error) {}
    return result
      .replace(/^\/+/, '')
      .replace(/\/index\.html$/, '')
      .replace(/\.html$/, '')
      .replace(/\/+$/, '');
  }

  function setupVersionGateway(root) {
    document.body.classList.add('page-version-gateway');
    var options = Array.prototype.slice.call(root.querySelectorAll('[data-version-option]'));
    var action = root.querySelector('[data-role="version-action"]');
    var note = root.querySelector('[data-role="version-note"]');
    var preferenceKey = root.getAttribute('data-preference-key');
    var defaultVersion = root.getAttribute('data-default-version');
    if (!options.length || !action) return;

    function optionForVersion(version) {
      return options.find(function (option) {
        return option.getAttribute('data-version') === version;
      });
    }

    function setAction(option) {
      var available = option.getAttribute('data-available') !== 'false';
      var href = option.getAttribute('data-href');
      var availableLabel = option.getAttribute('data-action-label') || '进入该版本目录';
      var unavailableLabel = option.getAttribute('data-unavailable-label') || '该版本仍在创作';
      var availableNote = option.getAttribute('data-note') || '不同版本的阅读进度独立记录。';
      var unavailableNote = option.getAttribute('data-unavailable-note') || '完成后会在这里开放目录。';

      action.textContent = available ? availableLabel : unavailableLabel;
      action.classList.toggle('version-gateway__action--disabled', !available);
      action.setAttribute('aria-disabled', available ? 'false' : 'true');
      action.tabIndex = available ? 0 : -1;
      if (available && href) action.setAttribute('href', href);
      else action.removeAttribute('href');
      if (note) note.textContent = available ? availableNote : unavailableNote;
    }

    function selectOption(option, shouldFocus) {
      options.forEach(function (candidate) {
        var selected = candidate === option;
        candidate.classList.toggle('version-row--selected', selected);
        candidate.setAttribute('aria-checked', selected ? 'true' : 'false');
        candidate.tabIndex = selected ? 0 : -1;
      });
      setAction(option);
      if (preferenceKey) {
        try { localStorage.setItem(preferenceKey, option.getAttribute('data-version')); } catch (error) {}
      }
      if (shouldFocus) option.focus();
    }

    options.forEach(function (option, index) {
      option.addEventListener('click', function () { selectOption(option, false); });
      option.addEventListener('keydown', function (event) {
        var nextIndex = null;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % options.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + options.length) % options.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = options.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        selectOption(options[nextIndex], true);
      });
    });

    action.addEventListener('click', function (event) {
      if (action.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });

    var initial = null;
    if (preferenceKey) {
      try { initial = optionForVersion(localStorage.getItem(preferenceKey)); } catch (error) {}
    }
    initial = initial || optionForVersion(defaultVersion) || options[0];
    selectOption(initial, false);
  }

  function setupCatalog(root) {
    document.body.classList.add('page-recursive-catalog');
    var tree = root.querySelector('[data-catalog-tree]');
    if (!tree) return;

    var storageBookId = root.getAttribute('data-storage-book-id');
    var library = readJson(LIBRARY_KEY);
    var entry = library[storageBookId] || {};
    var sectionState = entry.sections || {};
    var seen = {};
    Object.keys(sectionState).forEach(function (sectionId) {
      seen[normaliseId(sectionId)] = true;
    });
    var currentId = normaliseId(entry.lastSection);
    if (currentId) seen[currentId] = true;
    var leaves = Array.prototype.slice.call(tree.querySelectorAll('[data-catalog-leaf]'));
    var branches = Array.prototype.slice.call(tree.querySelectorAll('details[data-catalog-branch]'));
    var currentLeaf = null;

    leaves.forEach(function (leaf) {
      var id = normaliseId(leaf.getAttribute('data-node-id'));
      var status = leaf.querySelector('[data-role="leaf-status"]');
      var isCurrent = Boolean(currentId && id === currentId);
      var isSeen = Boolean(seen[id]);
      leaf.classList.toggle('catalog-tree__row--current', isCurrent);
      leaf.classList.toggle('catalog-tree__row--seen', isSeen && !isCurrent);
      leaf.setAttribute('data-reading-state', isCurrent ? 'current' : (isSeen ? 'seen' : 'unread'));
      if (status) status.textContent = isCurrent ? '当前阅读' : (isSeen ? '已读' : '未读');
      if (isCurrent) {
        leaf.setAttribute('aria-current', 'location');
        currentLeaf = leaf;
      }
    });

    function leavesWithin(branch) {
      return Array.prototype.slice.call(branch.querySelectorAll('[data-catalog-leaf]'));
    }

    branches.forEach(function (branch) {
      var branchLeaves = leavesWithin(branch);
      var readCount = branchLeaves.filter(function (leaf) {
        return seen[normaliseId(leaf.getAttribute('data-node-id'))];
      }).length;
      var summary = branch.querySelector(':scope > summary');
      var status = summary && summary.querySelector('[data-role="branch-status"]');
      var containsCurrent = Boolean(currentId && branchLeaves.some(function (leaf) {
        return normaliseId(leaf.getAttribute('data-node-id')) === currentId;
      }));
      branch.classList.toggle('catalog-tree__branch--seen', readCount > 0);
      branch.classList.toggle('catalog-tree__branch--complete', readCount > 0 && readCount === branchLeaves.length);
      branch.classList.toggle('catalog-tree__branch--current', containsCurrent);
      if (status) {
        status.textContent = readCount === 0
          ? '未开始'
          : (readCount === branchLeaves.length ? '已完成' : readCount + ' / ' + branchLeaves.length);
      }
    });

    var fallbackLeaf = leaves[0] || null;
    var anchorLeaf = currentLeaf || fallbackLeaf;
    if (anchorLeaf) {
      var ancestor = anchorLeaf.parentElement;
      while (ancestor && ancestor !== tree) {
        if (ancestor.tagName === 'DETAILS') ancestor.open = true;
        ancestor = ancestor.parentElement;
      }
    }

    var previewTitle = root.querySelector('[data-role="catalog-preview-title"]');
    var previewKicker = root.querySelector('[data-role="catalog-preview-kicker"]');
    var previewProgress = root.querySelector('[data-role="catalog-preview-progress"]');
    var previewList = root.querySelector('[data-role="catalog-preview-list"]');
    var continueLink = root.querySelector('[data-role="catalog-continue"]');
    var total = parseInt(tree.getAttribute('data-story-count'), 10) || leaves.length;
    var readTotal = leaves.filter(function (leaf) {
      return seen[normaliseId(leaf.getAttribute('data-node-id'))];
    }).length;
    var totalProgress = root.querySelector('[data-role="catalog-total-progress"]');
    var totalMeter = root.querySelector('[data-role="catalog-total-meter"]');
    var selectedBranch = null;

    if (totalProgress) totalProgress.textContent = '已读 ' + readTotal + ' / ' + total;
    if (totalMeter) totalMeter.style.setProperty('--catalog-progress', total ? readTotal / total : 0);
    if (continueLink && anchorLeaf) {
      continueLink.href = currentLeaf && entry.lastUrl ? entry.lastUrl : anchorLeaf.href;
      continueLink.textContent = currentLeaf ? '继续当前故事' : '从第一篇开始';
    }

    function directChildren(branch) {
      var list = branch.querySelector(':scope > ol');
      return list ? Array.prototype.slice.call(list.children) : [];
    }

    function makePreviewRow(item) {
      var childBranch = item.querySelector(':scope > details[data-catalog-branch]');
      var leaf = item.querySelector(':scope > [data-catalog-leaf]');
      var source = childBranch ? childBranch.querySelector(':scope > summary') : leaf;
      if (!source) return null;

      var row = document.createElement(childBranch ? 'button' : 'a');
      row.className = 'catalog-preview__row';
      if (childBranch) row.type = 'button';
      else row.href = leaf.href;
      var number = document.createElement('span');
      number.className = 'catalog-preview__number';
      number.textContent = (source.querySelector('.catalog-tree__number') || {}).textContent || '';
      var label = document.createElement('strong');
      label.textContent = source.getAttribute('data-node-label') || '';
      var meta = document.createElement('span');
      meta.className = 'catalog-preview__meta';
      if (childBranch) {
        meta.textContent = childBranch.getAttribute('data-story-count') + ' 篇';
        row.addEventListener('click', function () {
          childBranch.open = true;
          selectBranch(childBranch, true);
        });
      } else {
        meta.textContent = (source.querySelector('[data-role="leaf-status"]') || {}).textContent || '未读';
        row.classList.toggle('catalog-preview__row--current', leaf.getAttribute('data-reading-state') === 'current');
        row.classList.toggle('catalog-preview__row--seen', leaf.getAttribute('data-reading-state') === 'seen');
      }
      row.appendChild(number);
      row.appendChild(label);
      row.appendChild(meta);
      return row;
    }

    function selectBranch(branch, scrollPreview) {
      if (!branch || !previewList) return;
      if (selectedBranch) selectedBranch.classList.remove('catalog-tree__branch--selected');
      selectedBranch = branch;
      selectedBranch.classList.add('catalog-tree__branch--selected');
      var summary = branch.querySelector(':scope > summary');
      var branchLeaves = leavesWithin(branch);
      var branchRead = branchLeaves.filter(function (leaf) {
        return seen[normaliseId(leaf.getAttribute('data-node-id'))];
      }).length;

      if (previewTitle) previewTitle.textContent = summary.getAttribute('data-node-label') || '当前目录';
      var parentList = branch.parentElement && branch.parentElement.parentElement;
      var isChapter = parentList && parentList.classList.contains('catalog-tree__list--level-0');
      if (previewKicker) previewKicker.textContent = isChapter ? '当前章节' : '当前小节';
      if (previewProgress) previewProgress.textContent = '已读 ' + branchRead + ' / ' + branchLeaves.length;
      previewList.replaceChildren();
      directChildren(branch).forEach(function (item) {
        var row = makePreviewRow(item);
        if (row) previewList.appendChild(row);
      });
      if (scrollPreview && window.matchMedia('(min-width: 721px)').matches) {
        var pane = root.querySelector('.route-catalog__preview');
        if (pane) pane.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }

    branches.forEach(function (branch) {
      var summary = branch.querySelector(':scope > summary');
      summary.addEventListener('click', function () { selectBranch(branch, false); });
    });

    var initialBranch = anchorLeaf && anchorLeaf.closest('details[data-catalog-branch]');
    selectBranch(initialBranch || branches[0], false);
  }

  if (gateway) setupVersionGateway(gateway);
  if (catalog) setupCatalog(catalog);
})();
