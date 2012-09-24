(function () {
'use strict';

  var store = window.localStorage,
      DATA_ENDPOINT = 'http://localhost:3000/?q=http://www.emoji-cheat-sheet.com',
      IMG_PATH = 'http://www.emoji-cheat-sheet.com/graphics/emojis/',
      menuVisible = false,
      menuEl = null,
      emoji = null;

  // TODO: use github's CDN images?
  // TODO: cache these
  function fetchEmoji(cb) {
    var xhr = new XMLHttpRequest();
    console.log('start fetch');
    xhr.open('GET', DATA_ENDPOINT, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        window.resp = xhr.response;
        cb(xhr.response);
      }
    };
    xhr.send();
    console.log('end fetch');
  }

  // TODO: strip out script tags, images, css, etc.
  // and any other uneeded junk prior to creating dom element
  function scrubDocString(docString) {
    var newString = docString;
    return newString;
  }

  function scrape(docString) {
    var el = document.createElement('div'),
        emojiNodes,
        emojiNames;
    el.innerHTML = scrubDocString(docString);
    emojiNodes = el.querySelectorAll('.emoji');
    emojiNames = Array.prototype.map.call(emojiNodes, function (emojiNode) {
      return emojiNode.getAttribute('data-src')
        .replace('graphics/emojis/', '')
        .replace('.png', '');
    });
    console.log(emojiNames);
    emoji = emojiNames.sort();
  }

  // walk up the tree applying func to each el.prop
  function walkTree(el, func) {
    var parentEl = el;
    while (parentEl) {
      func(parentEl);
      parentEl = parentEl.offsetParent;
    }
  }

  function getOffsetLeft(el) {
    var offset = 0;
    walkTree(el, function (parentEl) {
      offset += parentEl.offsetLeft;
    });
    return offset;
  }

  function getOffsetTop(el) {
    var offset = 0;
    walkTree(el, function (parentEl) {
      offset += parentEl.offsetTop;
    });
    return offset;
  }

  function filterEmoji(search) {
    // TODO: make this work
    return emoji;
  }

  function getImgUrl(emojiName) {
    return IMG_PATH + emojiName + '.png';
  }

  function getImgTag(emojiName) {
    return '<img src="' + getImgUrl(emojiName) + '"/>';
  }

  function populateMenu() {
    var ul = document.createElement('ul'),
        listItemHtml = '';
    menuEl.innerHTML = '';
    emoji.forEach(function (e) {
      listItemHtml += '<li>' + getImgTag(e) + ':' + e + ':</li>';
    });
    ul.innerHTML = listItemHtml;
    menuEl.appendChild(ul);
  }

  // TODO: if not visible, scroll into view.
  // TOTO: populate menu with matching names
  function showMenu(targetEl) {
    var cursorPosition = targetEl.selectionStart,
        fontSize = parseInt(window.getComputedStyle(targetEl)['font-size'], 10),
        topPos = getOffsetTop(targetEl) + targetEl.offsetHeight,
        leftPos = getOffsetLeft(targetEl);

    populateMenu();
    menuEl.style.top = topPos + 'px';
    menuEl.style.left = leftPos + 'px';
  }

  function hideMenu() {
  }

  function makeSelection(text) {
  }

  function initMenu() {
    menuEl = document.createElement('div');
    menuEl.setAttribute('class', 'octo-complete-menu');
    menuEl.innerText = 'thisis a menu';
    document.body.appendChild(menuEl);
  }

  function handleKeypress(e) {
    var target = e.target;
    if (target.nodeName !== 'TEXTAREA') {
      return;
    }
    if (e.keyCode === 58) {
      if (!menuVisible) {
        //menuVisible = 'show-menu';
        showMenu(target);
      }
    }
  }

  // TODO: hide menu on any type of click or textarea blur
  function setupListeners() {
    document.addEventListener('keypress', handleKeypress, false);
  }

  fetchEmoji(scrape);
  initMenu();
  setupListeners();

}());
