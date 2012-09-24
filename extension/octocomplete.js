(function () {
'use strict';

  var store = window.localStorage,
      DATA_ENDPOINT = 'http://localhost:3000/?q=http://www.emoji-cheat-sheet.com',
      IMG_PATH = 'http://www.emoji-cheat-sheet.com/graphics/emojis/',
      menuVisible = false,
      menuEl = null;

  function fetchEmoji(cb) {
    var xhr = new XMLHttpRequest();
    console.log('start fetch');
    xhr.open('GET', DATA_ENDPOINT, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        window.resp = xhr.response;
        //console.log(xhr.response);
        cb(xhr.response);
      }
    };
    xhr.send();
    console.log('end fetch');
  }

  // remove uneeded junk prior to creating dom element
  function scrubDocString(docString) {
    // TODO: strip out script tags, images, css, etc.
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

  function showMenu(targetEl) {
    var cursorPosition = targetEl.selectionStart,
        fontSize = parseInt(window.getComputedStyle(targetEl)['font-size'], 10),
        //topPos = document.body.scrollTop + targetEl.offsetTop + parseInt(fontSize, 10),
        topPos = getOffsetTop(targetEl) + targetEl.offsetHeight,
        leftPos = getOffsetLeft(targetEl);

    console.log('textposition:' + targetEl.selectionStart);
    console.log('left:' + leftPos);
    console.log('top:' + topPos);
    menuEl.style.top = topPos + 'px';
    menuEl.style.left = leftPos + 'px';
    console.log('el top: ' + menuEl.style.top);
  }

  function hideMenu() {
  }

  function makeSelection(text) {
  }

  function initMenu() {
    menuEl = window.document.createElement('div');
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

  function setupListeners() {
    document.addEventListener('keypress', handleKeypress, false);
  }

  fetchEmoji(scrape);
  initMenu();
  setupListeners();

}());
