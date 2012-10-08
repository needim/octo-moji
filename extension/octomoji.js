/*global chrome: true*/

(function () {
'use strict';

  var root = window,
  doc = window.document,
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
      this.queryRegex = /\:([a-z0-9_\-+]+)$/i;
      this.menuEl = null;
      this.emojiList = null;
      this.filteredEmojiList = null;
      this.activeInput = null;
      this.baseImgPath = this.scrapeBaseImgUrl();
      this.fetch(this.onFetch.bind(this));
      this.injectMenu();
      this.attachListeners();
      return this;
    },

    /**
     * Attach all needed DOM event listeners.
     */
    attachListeners: function () {
      doc.addEventListener('keydown', this.onKeydown.bind(this), false);
      doc.addEventListener('keyup', this.onKeyup.bind(this), false);
      doc.addEventListener('click', this.onClick.bind(this), false);
    },

    /**
     * Determines if the menu is visible or not.
     * @return {boolean}
     */
    isVisible: function () {
      return this.menuEl && this.menuEl.style.display === 'block';
    },

    /**
     * Injects the menu element into the DOM.
     */
    injectMenu: function () {
      var menuEl = this.menuEl = doc.createElement('ul');
      menuEl.setAttribute('class', 'octo-moji-menu');
      doc.body.appendChild(menuEl);
    },

    /**
     * Determines what base img url to use for images.
     */
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

    /**
     * Loads the emoji definitions from external file.
     * @param {function} callback
     */
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

    /**
     * Gets input, filters list, re-renders and shows menu.
     * @param {Element} targetEl The element to show menu below.
     */
    render: function (targetEl) {
      var value, query;

      if (targetEl.nodeName !== 'TEXTAREA') {
        return;
      }
      this.activeInput = targetEl;
      value = targetEl.value;
      query = this.parseQuery(value);
      // Skip rendering if there's no query (ie no colon).
      if (query === null) {
        this.hide();
        return;
      }
      this.filteredEmojiList = this.filter(query);
      this.renderList();
      if (!this.isVisible()) {
        this.show(targetEl);
        this.menuEl.scrollIntoViewIfNeeded();
      }
    },

    /**
     * Updates the list of emoji in the menu.
     */
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

    /**
     * Filters the total list of emoji to items that match the query.
     * @param {string} query
     * @return {string[]}
     */
    filter: function (query) {
      return this.emojiList.filter(function (item) {
        if (item.indexOf(query) === 0) {
          return item;
        }
      });
    },

    getCurrentLine: function (allText) {
      var cursorPos = this.activeInput.selectionStart - 1,
          lines = allText.split('\n'),
          cnt = 0,
          i = 0,
          currentLine;

      lines = allText.split('\n');
      while (cursorPos > cnt) {
        cnt += lines[i].length;
        // for line breaks
        cnt += 1;
        i += 1;
      }
      if (cnt === cursorPos) {
        currentLine = lines[i];
      } else {
        currentLine = lines[i - 1];
      }
      return currentLine;
    },

    /**
     * Parses the query out of the full text.
     * @param {string} allText
     */
    parseQuery: function (allText) {
      var cursorPos = this.activeInput.selectionStart - 1,
          currentLine = this.getCurrentLine(allText),
          matches;

      // Last character is a colon, so query is emtpy.
      if (currentLine[currentLine.length - 1] === ':') {
        return '';
      }
      matches = this.queryRegex.exec(currentLine);
      if (matches && matches.length) {
        return matches.pop();
      }
      return null;
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
      this.focusFirst();
    },

    /**
     * Hides the auto-complete menu.
     */
    hide: function () {
      var input = this.activeInput;
      this.menuEl.style.display = 'none';
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

      // TODO: replace the query with the selection on the current line
      // do this while keeping other lines in place
      // then move cursor to end of current line

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

    /**
     * Calculate the total left offset in pixels of an element from the
     *    document.
     * @param {Element} el
     * @return {number}
     */
    calcOffsetLeft: function (el) {
      var offset = 0;
      this.walkTree(el, function (parentEl) {
        offset += parentEl.offsetLeft;
      });
      return offset;
    },

    /**
     * Calculate the total top offset in pixels of an element from the document.
     * @param {Element} el
     * @return {number}
     */
    calcOffsetTop: function (el) {
      var offset = 0;
      this.walkTree(el, function (parentEl) {
        offset += parentEl.offsetTop;
      });
      return offset;
    },

    /**
     * Generates the img url given an emoji name.
     * @param {string} emojiName
     * @return {string}
     */
    buildImgUrl: function (emojiName) {
      return this.baseImgPath + emojiName + '.png';
    },

    /**
     * Generates an html img tag for a given emoji anme.
     * @param {string} emojiName
     * @return {string}
     */
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

    /**
     * Unfocus all menu items, focus on the given element.
     * @param {Element} el
     */
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
     * @param {KeyboardEvent} e
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
     * @param {KeyboardEvent} e
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

    /**
     * Handles up arrow key presses. Assumes menu is visible.
     * @param {KeyboardEvent} e
     */
    onArrowUpKey: function (e) {
      this.focusPrevious();
      e.preventDefault();
      e.stopPropagation();
    },

    /**
     * Handles down arrow key presses. Assumes menu is visible.
     * @param {KeyboardEvent} e
     */
    onArrowDownKey: function (e) {
      this.focusNext();
      e.preventDefault();
      e.stopPropagation();
    },

    /**
     * Handles esc key presses. Assumes menu is visible.
     * @param {KeyboardEvent} e
     */
    onEscapeKey: function (e) {
      if (this.isVisible()) {
        this.hide();
        e.preventDefault();
        e.stopPropagation();
      }
    },

    /**
     * Handles spacebar key presses. Assumes menu is visible.
     * @param {KeyboardEvent} e
     */
    onSpaceKey: function (e) {
      if (this.isVisible() && e.target.nodeName === 'TEXTAREA') {
        this.hide();
      }
    },

    /**
     * Handles colon key presses. Assumes menu is visible.
     * @param {KeyboardEvent} e
     */
    onColonKey: function (e) {
      this.render(e.target);
    },

    /**
     * Delegates to specific keydown handlers.
     * {Event} e The event.
     */
    onKeydown: function (e) {
      var code = e.keyCode;

      if (!this.isVisible()) {
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
          if (!this.isVisible()) {
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

      if (!this.isVisible()) {
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

}());
