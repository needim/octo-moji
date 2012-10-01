(function () {
'use strict';

  var root = this,
  doc = root.document,
  store = root.localStorage,
  CACHE_LIMIT_MS = 604800000, // 1 week
  KEYCODE_COLON = 186,
  KEYCODE_SPACE = 32,
  KEYCODE_ESCAPE = 27,
  DATA_ENDPOINT = 'http://localhost:3000/?q=http://www.emoji-cheat-sheet.com',
  // TODO: determine this base url on init
  IMG_PATH = 'https://a248.e.akamai.net/assets.github.com/images/icons/emoji/',
  instance,
  OctoComplete = function () {
    this.menuVisible = false;
    this.menuEl = null;
    this.isVisible = false;
    this.emojiList = null;
    this.filteredEmojiList = null;
    this.activeInput = null;
  };

  OctoComplete.prototype = {
    init: function () {
      this.fetch(this.onFetch.bind(this));
      this.injectMenu();
      this.attachListeners();
    },

    // TODO: hide menu on any type of click or textarea blur
    attachListeners: function () {
      doc.addEventListener('keyup', this.onKeyup.bind(this), false);
      doc.addEventListener('click', this.onClick.bind(this), false);
    },

    injectMenu: function () {
      var menuEl = this.menuEl = doc.createElement('div');
      menuEl.setAttribute('class', 'octo-complete-menu');
      doc.body.appendChild(menuEl);
    },

    isStale: function () {
      var cachedList = store.emojiList,
          now = (new Date()).getTime(),
          updateDate = parseInt(store.updateDate, 10);

      if (!cachedList || !updateDate || (now - updateDate) > CACHE_LIMIT_MS) {
        return true;
      }
      return false;
    },

    getFromCache: function () {
      return store.emojiList ? store.emojiList.split(',') : null;
    },

    saveToCache: function (data) {
      store.emojiList = data;
      store.updateDate = (new Date()).getTime();
    },

    fetch: function (callback, errback) {
      var xhr;

      if (!this.isStale()) {
        callback(this.getFromCache());
        return;
      }
      xhr = new root.XMLHttpRequest();
      xhr.open('GET', DATA_ENDPOINT, true);
      xhr.onreadystatechange = function() {
        var results;
        // TODO: call errback() if error
        if (xhr.readyState === 4) {
          results = this.scrape(xhr.response);
          this.saveToCache(results);
          callback(results);
        }
      }.bind(this);
      xhr.send();
    },

    scrape: function (htmlString) {
      var tmpEl = doc.createElement('div'),
          emojiNodes,
          emojiNames;

      tmpEl.innerHTML = this.scrubHtmlString(htmlString);
      emojiNodes = tmpEl.querySelectorAll('.emoji');
      emojiNames = Array.prototype.map.call(emojiNodes, function (emojiNode) {
        return emojiNode.getAttribute('data-src')
          .replace('graphics/emojis/', '')
          .replace('.png', '');
      });
      return emojiNames.sort();
    },

    render: function (targetEl) {
      var value = targetEl.value;
      this.activeInput = targetEl;
      this.filteredEmojiList = this.filter(value);
      this.renderList();
      if (!this.menuVisible) {
        this.show(targetEl);
      }
    },

    renderList: function () {
      var listHtml = '<ul>';
      this.filteredEmojiList.forEach(function (e) {
        listHtml += '<li>' + this.buildImgTag(e) + ':' + e + ':</li>';
      }, this);
      if (!this.filteredEmojiList.length) {
        listHtml += '<li>no results</li>';
      }
      listHtml += '</ul>';
      this.menuEl.innerHTML = listHtml;
    },

    filter: function (allText) {
      var query = this.parseQuery(allText);

      return this.emojiList.filter(function (item) {
        if (item.indexOf(query) === 0) {
          return item;
        }
      });
    },

    parseQuery: function (allText) {
      var startIndex = allText.lastIndexOf(':') + 1,
          query;

      query = allText.substring(startIndex);
      return query;
    },

    // TODO: if not visible, scroll into view.
    show: function (targetEl) {
      var topPos, leftPos;

      topPos = this.calcOffsetTop(targetEl) + targetEl.offsetHeight;
      leftPos = this.calcOffsetLeft(targetEl);
      this.menuEl.style.top = topPos + 'px';
      this.menuEl.style.left = leftPos + 'px';
      this.menuEl.style.display = 'block';
      this.isVisible = true;
    },

    hide: function() {
      this.menuEl.style.display = 'none';
      this.isVisible = false;
      this.activeInput = null;
      this.query = '';
    },

    select: function (content) {
      var input = this.activeInput,
          value = input.value,
          colonIndex = value.lastIndexOf(':');

      input.value = value.substring(0, colonIndex) + content;
      this.dispatchChangeEvent(input);
      input.focus();
      this.moveCursorToEnd(input);
    },

    // Need this for github preview to work
    dispatchChangeEvent: function (el) {
      var evt = doc.createEvent('HTMLEvents');
      evt.initEvent('change', true, false);
      el.dispatchEvent(evt);
    },

    moveCursorToEnd: function (el) {
      el.selectionStart = el.selectionEnd = el.value.length;
    },

    // walk up the tree applying func to each el.prop
    walkTree: function (el, func) {
      var parentEl = el;
      while (parentEl) {
        func(parentEl);
        parentEl = parentEl.offsetParent;
      }
    },

    calcOffsetLeft: function (el) {
      var offset = 0;
      this.walkTree(el, function (parentEl) {
        offset += parentEl.offsetLeft;
      });
      return offset;
    },

    calcOffsetTop: function (el) {
      var offset = 0;
      this.walkTree(el, function (parentEl) {
        offset += parentEl.offsetTop;
      });
      return offset;
    },

    buildImgUrl: function (emojiName) {
      return IMG_PATH + emojiName + '.png';
    },

    buildImgTag: function (emojiName) {
      return '<img src="' + this.buildImgUrl(emojiName) + '"/>';
    },

    // TODO: strip out script tags, images, css, etc.
    // and any other uneeded junk prior to creating dom element
    scrubHtmlString: function (htmlString) {
      var newString = htmlString;
      return newString;
    },

    onFetch: function (results) {
      this.emojiList = results;
      // TODO: show message 'fetch complete'
    },

    onKeyup: function (e) {
      var target = e.target,
          code = e.keyCode;

      if (this.isVisible && code === KEYCODE_ESCAPE) {
        this.hide();
        return;
      }
      if (target.nodeName !== 'TEXTAREA') {
        return;
      }
      if (this.isVisible && code === KEYCODE_SPACE) {
        this.hide();
        return;
      }
      if (this.isVisible || (code === KEYCODE_COLON && e.shiftKey)) {
        this.render(target);
      }
    },

    onClick: function (e) {
      var target = e.target;
      if (!this.isVisible) {
        return;
      }
      // TODO: or not a descendant
      if (target.parentElement &&
          target.parentElement.parentElement === this.menuEl) {
        // TODO: pass inner content
        this.select(target.textContent);
      }
      this.hide();
    }

  };

  instance = new OctoComplete();
  instance.init();

}).call(this);
