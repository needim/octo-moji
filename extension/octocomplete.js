(function () {
'use strict';

  var store = window.localStorage,
      DATA_ENDPOINT = 'http://localhost:3000/?q=http://www.emoji-cheat-sheet.com',
      IMG_PATH = 'http://www.emoji-cheat-sheet.com/graphics/emojis/';

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

  fetchEmoji(scrape);

}());
