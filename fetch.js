(function () {
  'use strict';

  var http = require('http'),
      jsdom = require('jsdom'),
      fs = require('fs'),
      request = require('request'),
      EMOJI_URL = 'http://www.emoji-cheat-sheet.com';

  function writeFile(jsonData) {
    var dataString = JSON.stringify(jsonData, null, ' ');
    fs.writeFile('./extension/emoji.json', dataString, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('The emojis were saved to extension/emoji.json!');
      }
    });
  }

  function scrapeHtml(html) {
    jsdom.env(html, null, function (err, window) {
      var emojiNodes, emojiNames;
      emojiNodes = window.document.body.getElementsByClassName('emoji');
      emojiNames = Array.prototype.map.call(emojiNodes, function (emojiNode) {
        return emojiNode.getAttribute('data-src')
          .replace('graphics/emojis/', '')
          .replace('.png', '');
      });
      emojiNames.sort();
      writeFile(emojiNames);
    });
  }

  function fetchEmoji() {
    request.get(EMOJI_URL, function (err, response, body) {
      if (err) {
        console.log('Error fetching emoji!');
      } else {
        scrapeHtml(body);
      }
    });
  }

  fetchEmoji();

}());
