/*global chrome: true*/

(function () {
'use strict';

  var root = this,
  doc = root.document,
  KEYCODE_COLON = 186,
  KEYCODE_SPACE = 32,
  KEYCODE_ESCAPE = 27,
  DATA_ENDPOINT = chrome.extension.getURL('emoji.json'),
  IMG_PATH_FALLBACK = 'https://a248.e.akamai.net/assets.github.com/images/icons/emoji/',
  instance,
  OctoMoji = function () {
    this.menuVisible = false;
    this.menuEl = null;
    this.isVisible = false;
    this.emojiList = null;
    this.filteredEmojiList = null;
    this.activeInput = null;
  };

  OctoMoji.prototype = {

    init: function () {
      this.baseImgPath = this.scrapeBaseImgUrl();
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
      menuEl.setAttribute('class', 'octo-moji-menu');
      doc.body.appendChild(menuEl);
    },

    scrapeBaseImgUrl: function () {
      var logo = doc.querySelectorAll('.site-logo > img'),
          src;

      if (logo && logo.length) {
        src = logo[0].getAttribute('src');
        src = src.substring(0, src.lastIndexOf('images/'));
      }
      if (src && src !== '') {
        return src + 'images/icons/emoji/';
      }
      return IMG_PATH_FALLBACK;
    },

    fetch: function (callback, errback) {
      var xhr;

      xhr = new root.XMLHttpRequest();
      xhr.open('GET', DATA_ENDPOINT, true);
      xhr.onreadystatechange = function() {
        var results;
        // TODO: call errback() if error
        if (xhr.readyState === 4) {
          callback(JSON.parse(xhr.response));
        }
      }.bind(this);
      xhr.send();
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
      return this.baseImgPath + emojiName + '.png';
    },

    buildImgTag: function (emojiName) {
      return '<img rel="prefetch" src="' + this.buildImgUrl(emojiName) + '"/>';
    },

    onFetch: function (results) {
      this.emojiList = results;
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

  instance = new OctoMoji();
  instance.init();

}).call(this);
