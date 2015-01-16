var http = require('http');
var sys = require('sys');
function make_proxy_request(request) {
  var proxy, proxy_request;
  var mingle = request.url.indexOf('/mingle/') > -1;
  if (mingle) {
    var mingle_site = 'mingle-staging.thoughtworks.com';
    proxy = http.createClient(80, mingle_site);
    var headers = JSON.parse(JSON.stringify(request.headers));
    headers.host = mingle_site;
    proxy_request = proxy.request(request.method, request.url, headers);
  }
  else {
    proxy = http.createClient(9292, 'localhost');
    proxy_request = proxy.request(request.method, request.url, request.headers);
  }
  return proxy_request;
}
http.createServer(function(request, response) {
  sys.log('proxying request for: ' + request.headers['host']);
  sys.log('proxying request url: ' + request.url);
  sys.log('proxying request: ' + JSON.stringify(request.headers));
  var proxy_request = make_proxy_request(request);
  proxy_request.addListener('response', function (proxy_response) {
    proxy_response.addListener('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.addListener('end', function() {
      response.end();
    });
    response.writeHead(proxy_response.statusCode, proxy_response.headers);
  });
  request.addListener('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxy_request.end();
  });
}).listen(8080);
