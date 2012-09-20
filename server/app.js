(function () {
  'use strict';

  var http = require('http'),
      url = require('url'),
      request = require('request');

  function handleRequest(req, res) {
    var query = url.parse(req.url, true).query,
        reqUrl = query.q || null;
    if (reqUrl === null) {
      res.writeHead(400, {'Content-Type': 'text/plain'});
      res.end('You must supply a "q" parameter in the query string.\n');
      return;
    }

    request.get(reqUrl, function (err, response, body) {
      var headers = response.headers;
      headers['Access-Control-Allow-Origin'] = '*';
      res.writeHead(response.statusCode, headers);
      res.end(body);
    });
  }

  http.createServer(handleRequest)
    .listen(3000, '127.0.0.1');

  console.log('Server running at http://127.0.0.1:3000/');

}());
