/*global chrome: true*/

// TODO: bug: menu still showing after deletion of colon
// TODO: ":*" to bring up all
// TODO: Comments
// TODO: Optimize

(function () {
'use strict';

  var root = this,
  doc = root.document,
  KEYCODES = {
    COLON: 186,
    SPACE: 32,
    ESCAPE: 27,
    ENTER: 13,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    TAB: 9
  },
  DATA_ENDPOINT = chrome.extension.getURL('emoji.json'),
  IMG_PATH_FALLBACK =
      'https://a248.e.akamai.net/assets.github.com/images/icons/emoji/',

  OctoMoji = {

    /**
     * All extension initialization.
     */
    init: function () {
      this.menuVisible = false;
      this.menuEl = null;
      this.isVisible = false;
      this.emojiList = null;
      this.filteredEmojiList = null;
      this.activeInput = null;
      this.baseImgPath = this.scrapeBaseImgUrl();
      this.fetch(this.onFetch.bind(this));
      this.injectMenu();
      this.attachListeners();
      return this;
    },

    attachListeners: function () {
      doc.addEventListener('keydown', this.onKeydown.bind(this), false);
      doc.addEventListener('keyup', this.onKeyup.bind(this), false);
      doc.addEventListener('click', this.onClick.bind(this), false);
    },

    injectMenu: function () {
      var menuEl = this.menuEl = doc.createElement('ul');
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

    fetch: function (callback) {
      var xhr;

      xhr = new root.XMLHttpRequest();
      xhr.open('GET', DATA_ENDPOINT, true);
      xhr.onreadystatechange = function() {
        var results;
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            callback(JSON.parse(xhr.response));
          } else {
            this.showError('Oops. There was a problem loading Octo-Moji. ' +
              'Try refreshing or file a bug.');
          }
        }
      }.bind(this);
      xhr.send();
    },

    /**
     * Injects a div at the top of the screen with an error message.
     * @param {string} msg
     */
    showError: function (msg) {
      if (!this.errorEl) {
        this.errorEl = doc.createElement('div');
        this.errorEl.setAttribute('class', 'octo-moji-error');
        doc.body.appendChild(this.errorEl);
      }
      this.errorEl.innerText = msg;
      this.errorEl.style.display = 'block';
      setTimeout(this.hideError.bind(this), 5000);
    },

    /**
     * Hides the error message if it exists.
     */
    hideError: function () {
      if (this.errorEl) {
        this.errorEl.style.display = 'none';
      }
    },

    render: function (targetEl) {
      var value;

      if (targetEl.nodeName !== 'TEXTAREA') {
        return;
      }
      value = targetEl.value;
      this.activeInput = targetEl;
      this.filteredEmojiList = this.filter(value);
      this.renderList();
      if (!this.menuVisible) {
        this.show(targetEl);
        this.menuEl.scrollIntoViewIfNeeded();
      }
    },

    renderList: function () {
      var listHtml = '';
      this.filteredEmojiList.forEach(function (e) {
        listHtml += '<li>' + this.buildImgTag(e) + ':' + e + ':</li>';
      }, this);
      if (!this.filteredEmojiList.length) {
        listHtml += '<li>no results</li>';
      }
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

    /**
     * Display the auto-complete menu.
     * @param {Element} targetEl The target element below which to show
     *    the menu.
     */
    show: function (targetEl) {
      var menuEl = this.menuEl,
          topPos,
          leftPos;

      topPos = this.calcOffsetTop(targetEl) + targetEl.offsetHeight;
      leftPos = this.calcOffsetLeft(targetEl);
      menuEl.style.top = topPos + 'px';
      menuEl.style.left = leftPos + 'px';
      menuEl.style.display = 'block';
      this.isVisible = true;
      this.focusFirst();
    },

    /**
     * Hides the auto-complete menu.
     */
    hide: function () {
      var input = this.activeInput;
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
      this.hide();
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
      return this.menuEl.querySelector('.is-active');
    },

    focusMenuEl: function (el) {
      var current = this.getFocusedMenuEl();
      if (current) {
        current.setAttribute('class', '');
      }
      if (el) {
        el.setAttribute('class', 'is-active');
        el.scrollIntoViewIfNeeded();
      }
    },

    /**
     * Focus on the 1st item in the menu.
     */
    focusFirst: function () {
      this.focusMenuEl(this.menuEl.querySelector('li'));
      this.menuEl.scrollTop = 0;
    },

    /**
     * Focus on the next item in the menu.
     */
    focusNext: function () {
      var current = this.getFocusedMenuEl();

      if (!current) {
        this.focusFirst();
      } else if (current.nextSibling) {
        this.focusMenuEl(current.nextSibling);
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
        //current.previousSibling.focus();
        this.focusMenuEl(current.previousSibling);
      }
    },

    /**
     * Tests an element to see if it's a part of the menu.
     * @param {Element}
     * @return {boolean}
     */
    isMenuDescendant: function (el) {
      return (el.parentElement &&
          el.parentElement === this.menuEl);
    },

    /**
     * Runs after fetch completes.
     */
    onFetch: function (results) {
      this.emojiList = results;
    },

    /**
     * Handles enter key presses. Assumes menu is visible.
     * @param {Event} e
     */
    onEnterKey: function (e) {
      var current = this.getFocusedMenuEl();

      if (current) {
        this.select(current.textContent);
        e.preventDefault();
        e.stopPropagation();
      } else {
        this.hide();
      }
    },

    /**
     * Handles tab key presses. Assumes menu is visible.
     * @param {Event} e
     */
    onTabKey: function (e) {
      var current = this.getFocusedMenuEl();

      if (current) {
        this.select(current.textContent);
      } else {
        this.hide();
      }
      e.preventDefault();
      e.stopPropagation();
    },

    onArrowUpKey: function (e) {
      this.focusPrevious();
      e.preventDefault();
      e.stopPropagation();
    },

    onArrowDownKey: function (e) {
      this.focusNext();
      e.preventDefault();
      e.stopPropagation();
    },

    onEscapeKey: function (e) {
      if (this.isVisible) {
        this.hide();
        e.preventDefault();
        e.stopPropagation();
      }
    },

    onSpaceKey: function (e) {
      if (this.isVisible && e.target.nodeName === 'TEXTAREA') {
        this.hide();
      }
    },

    onColonKey: function (e) {
      this.render(e.target);
    },

    /**
     * Delegates to specific keydown handlers.
     * {Event} e The event.
     */
    onKeydown: function (e) {
      var code = e.keyCode;

      if (!this.isVisible) {
        return;
      }
      switch (code) {
        case KEYCODES.ENTER:
          this.onEnterKey(e);
          break;
        case KEYCODES.TAB:
          this.onTabKey(e);
          break;
        case KEYCODES.ARROW_UP:
          this.onArrowUpKey(e);
          break;
        case KEYCODES.ARROW_DOWN:
          this.onArrowDownKey(e);
          break;
        case KEYCODES.ESCAPE:
          this.onEscapeKey(e);
          break;
        case KEYCODES.SPACE:
          this.onSpaceKey(e);
          break;
      }
    },

    /**
     * Handles keyup events.
     * {Event} e The event.
     */
    onKeyup: function (e) {
      var ignoreKeys;

      switch (e.keyCode) {
        case KEYCODES.COLON:
            if (e.shiftKey) {
              this.onColonKey(e);
            }
          break;
        // XXX: Need this for code comments.
        // Seems like github is cancelling esc key bubble.
        case KEYCODES.ESCAPE:
          this.onEscapeKey(e);
          break;
        default:
          // Only render(read "filter") menu when it's visible
          if (!this.isVisible) {
            return;
          }
          ignoreKeys = [KEYCODES.ARROW_UP, KEYCODES.ARROW_DOWN];
          if (ignoreKeys.indexOf(e.keyCode) === -1) {
            this.render(e.target);
          }
      }
    },

    /**
     * Handles click events.
     * {Event} e The event.
     */
    onClick: function (e) {
      var target;

      if (!this.isVisible) {
        return;
      }
      target = e.target;
      if (this.isMenuDescendant(target)) {
        this.select(target.textContent);
      } else {
        this.hide();
      }
    }

  }.init();

}).call(this);
