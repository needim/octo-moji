/*global chrome: true*/

(function () {
'use strict';

  var root = this,
  doc = root.document,
  instance,
  KEYCODE_COLON = 186,
  KEYCODE_SPACE = 32,
  KEYCODE_ESCAPE = 27,
  //KEYCODE_TAB = ,
  //KEYCODE_ENTER = ,
  KEYCODE_ARROW_UP = 38,
  KEYCODE_ARROW_DOWN = 40,
  DATA_ENDPOINT = chrome.extension.getURL('emoji.json'),
  IMG_PATH_FALLBACK =
      'https://a248.e.akamai.net/assets.github.com/images/icons/emoji/',

  OctoMoji = function () {
    this.menuVisible = false;
    this.menuEl = null;
    this.isVisible = false;
    this.emojiList = null;
    this.filteredEmojiList = null;
    this.activeInput = null;
  };

  OctoMoji.prototype = {

    // TODO: display error message if something went wrong
    init: function () {
      this.baseImgPath = this.scrapeBaseImgUrl();
      this.fetch(this.onFetch.bind(this));
      this.injectMenu();
      this.attachListeners();
      return this;
    },

    // TODO: hide menu on textarea blur
    // TODO: listen to keydown for arrow keys
    attachListeners: function () {
      doc.addEventListener('keyup', this.onKeyup.bind(this), false);
      doc.addEventListener('keydown', this.onKeydown.bind(this), false);
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
      var listHtml = '<ul>', cnt = 0;
      this.filteredEmojiList.forEach(function (e) {
        listHtml += '<li tabindex="' + cnt + '">' +
          this.buildImgTag(e) + ':' + e + ':</li>';
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

    /**
     * Parses the query out of the full text.
     */
    parseQuery: function (allText) {
      var startIndex = allText.lastIndexOf(':') + 1,
          query;

      query = allText.substring(startIndex);
      return query;
    },

    // TODO: if not visible, scroll into view.
    /**
     * Display the auto-complete menu.
     * @param {Element} targetEl The target element below which to show
     *    the menu.
     */
    show: function (targetEl) {
      var topPos, leftPos;

      topPos = this.calcOffsetTop(targetEl) + targetEl.offsetHeight;
      leftPos = this.calcOffsetLeft(targetEl);
      this.menuEl.style.top = topPos + 'px';
      this.menuEl.style.left = leftPos + 'px';
      this.menuEl.style.display = 'block';
      this.isVisible = true;
    },

    /**
     * Hides the auto-complete menu.
     */
    hide: function () {
      this.menuEl.style.display = 'none';
      this.isVisible = false;
      this.activeInput = null;
    },

    /**
     * Make user selection from menu and inject text into current textarea.
     * @param {string} selection The string value of the selected emoji.
     */
    select: function (selection) {
      var input = this.activeInput,
          value = input.value,
          colonIndex = value.lastIndexOf(':');

      input.value = value.substring(0, colonIndex) + selection;
      this.dispatchChangeEvent(input);
      input.focus();
      this.moveCursorToEnd(input);
    },

    /**
     * Fires a CHANGE event from the given element.
     * XXX: Need this for github preview to work
     * @param {Element} el The element from which to fire the event.
     */
    dispatchChangeEvent: function (el) {
      var evt = doc.createEvent('HTMLEvents');
      evt.initEvent('change', true, false);
      el.dispatchEvent(evt);
    },

    /**
     * Moves the user's cursor to the end of the input's text.
     * @param {Element} el The input/textarea element.
     */
    moveCursorToEnd: function (el) {
      el.selectionStart = el.selectionEnd = el.value.length;
    },

    /**
     * Walk up the tree applying func to each element's parent for as long as
     *    parents exist. Useful when calculating offsets.
     * @param {Element} el The starting element.
     * @param {function} func The function to apply.
     */
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

    /**
     * Gets the currently focused menu item's element.
     * @return {Element|null}
     */
    getFocusedMenuEl: function () {
      return this.menuEl.querySelector('li:focus');
    },

    /**
     * Focus on the 1st item in the menu.
     */
    focusFirst: function () {
      var first = this.menuEl.querySelector('li');
      if (first) {
        first.focus();
      }
    },

    /**
     * Focus on the next item in the menu.
     */
    focusNext: function () {
      var current = this.getFocusedMenuEl();

      if (!current) {
        this.focusFirst();
      } else if (current.nextSibling) {
        current.nextSibling.focus();
      }
    },

    /**
     * Focus on the previous item in the menu.
     */
    focusPrevious: function () {
      var current = this.getFocusedMenuEl();

      if (!current) {
        this.focusFirst();
      } else if (current.previousSibling) {
        current.previousSibling.focus();
      }
    },

    /**
     * Runs after fetch completes.
     */
    onFetch: function (results) {
      this.emojiList = results;
    },

    /**
     * Handles up/down arrow key events.
     * {Event} e The event.
     */
    onKeydown: function (e) {
      var code = e.keyCode;

      if (!this.isVisible) {
        return;
      }
      if (code === KEYCODE_ARROW_UP) {
        this.focusPrevious();
        e.preventDefault();
        e.stopPropagation();
      } else if (code === KEYCODE_ARROW_DOWN) {
        this.focusNext();
        e.preventDefault();
        e.stopPropagation();
      }
    },

    /**
     * Handles keyup events.
     * {Event} e The event.
     */
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

    /**
     * Handles click events.
     * {Event} e The event.
     */
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

  instance = new OctoMoji().init();

}).call(this);
