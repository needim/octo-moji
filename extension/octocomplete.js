(function () {
'use strict';

  var root = this,
  doc = root.document,
  store = root.localStorage,
  DATA_ENDPOINT = 'http://localhost:3000/?q=http://www.emoji-cheat-sheet.com',
  IMG_PATH = 'https://a248.e.akamai.net/assets.github.com/images/icons/emoji/',
  instance,
  OctoComplete = function () {
    this.menuVisible = false;
    this.menuEl = null;
    this.isVisible = false;
    this.emojiList = store.emojiList || null;
  };

  OctoComplete.prototype = {
    init: function () {
      this.fetch(this.onFetch.bind(this));
      this.injectMenu();
      this.attachListeners();
    },

    // TODO: hide menu on any type of click or textarea blur
    attachListeners: function () {
      doc.addEventListener('keypress', this.onKeypress.bind(this), false);
      doc.addEventListener('click', this.onClick.bind(this), false);
    },

    injectMenu: function () {
      var menuEl = this.menuEl = doc.createElement('div');
      menuEl.setAttribute('class', 'octo-complete-menu');
      menuEl.innerText = 'thisis a menu';
      doc.body.appendChild(menuEl);
    },

    // TODO: use github's CDN images?
    // TODO: cache these
    fetch: function (callback, errback) {
      // if exists in local storage
      // ...
      // else
      var xhr = new root.XMLHttpRequest();
      xhr.open('GET', DATA_ENDPOINT, true);
      xhr.onreadystatechange = function() {
        // TODO: call errback() if error
        if (xhr.readyState === 4) {
          callback(xhr.response);
        }
      };
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

    // TODO: if not visible, scroll into view.
    // TOTO: populate menu with matching names
    show: function (targetEl) {
      var cursorPosition = targetEl.selectionStart,
          fontSize = parseInt(root.getComputedStyle(targetEl)['font-size'], 10),
          topPos = this.calcOffsetTop(targetEl) + targetEl.offsetHeight,
          leftPos = this.calcOffsetLeft(targetEl);

      this.populateMenu();
      this.menuEl.style.top = topPos + 'px';
      this.menuEl.style.left = leftPos + 'px';
      this.menuEl.style.display = 'block';
      this.isVisible = true;
    },

    hide: function() {
      this.menuEl.style.display = 'none';
      this.isVisible = false;
    },

    select: function (content) {
      console.log('selected: ' + content);
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

    // TODO: make this work
    filter: function (search) {
      return this.emojiList;
    },

    buildImgUrl: function (emojiName) {
      return IMG_PATH + emojiName + '.png';
    },

    buildImgTag: function (emojiName) {
      return '<img src="' + this.buildImgUrl(emojiName) + '"/>';
    },

    populateMenu: function () {
      var ul = doc.createElement('ul'),
          listItemHtml = '';
      this.menuEl.innerHTML = '';
      this.emojiList.forEach(function (e) {
        listItemHtml += '<li>' + this.buildImgTag(e) + ':' + e + ':</li>';
      }, this);
      ul.innerHTML = listItemHtml;
      this.menuEl.appendChild(ul);
    },

    // TODO: strip out script tags, images, css, etc.
    // and any other uneeded junk prior to creating dom element
    scrubHtmlString: function (htmlString) {
      var newString = htmlString;
      return newString;
    },

    onFetch: function (response) {
      this.emojiList = this.scrape(response);
      // TODO: show message 'fetch complete'
    },

    onKeypress: function (e) {
      var target = e.target;
      if (target.nodeName !== 'TEXTAREA') {
        return;
      }
      if (e.keyCode === 58) {
        if (!this.menuVisible) {
          //menuVisible = 'show-menu';
          this.show(target);
        }
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
