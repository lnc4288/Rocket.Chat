(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:cors":{"cors.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_cors/cors.js                                                                       //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 2);
let tls;
module.watch(require("tls"), {
  default(v) {
    tls = v;
  }

}, 3);
// FIX For TLS error see more here https://github.com/RocketChat/Rocket.Chat/issues/9316
// TODO: Remove after NodeJS fix it, more information https://github.com/nodejs/node/issues/16196 https://github.com/nodejs/node/pull/16853
tls.DEFAULT_ECDH_CURVE = 'auto'; // Revert change from Meteor 1.6.1 who set ignoreUndefined: true
// more information https://github.com/meteor/meteor/pull/9444

Mongo.setConnectionOptions({
  ignoreUndefined: false
});
WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(function (req, res, next) {
  if (req._body) {
    return next();
  }

  if (req.headers['transfer-encoding'] === undefined && isNaN(req.headers['content-length'])) {
    return next();
  }

  if (req.headers['content-type'] !== '' && req.headers['content-type'] !== undefined) {
    return next();
  }

  if (req.url.indexOf(`${__meteor_runtime_config__.ROOT_URL_PATH_PREFIX}/ufs/`) === 0) {
    return next();
  }

  let buf = '';
  req.setEncoding('utf8');
  req.on('data', function (chunk) {
    return buf += chunk;
  });
  req.on('end', function () {
    if (RocketChat && RocketChat.debugLevel === 'debug') {
      console.log('[request]'.green, req.method, req.url, '\nheaders ->', req.headers, '\nbody ->', buf);
    }

    try {
      req.body = JSON.parse(buf);
    } catch (error) {
      req.body = buf;
    }

    req._body = true;
    return next();
  });
}));
WebApp.rawConnectHandlers.use(function (req, res, next) {
  if (/^\/(api|_timesync|sockjs|tap-i18n|__cordova)(\/|$)/.test(req.url)) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  const setHeader = res.setHeader;

  res.setHeader = function (key, val) {
    if (key.toLowerCase() === 'access-control-allow-origin' && val === 'http://meteor.local') {
      return;
    }

    return setHeader.apply(this, arguments);
  };

  return next();
});
const _staticFilesMiddleware = WebAppInternals.staticFilesMiddleware;

WebAppInternals._staticFilesMiddleware = function (staticFiles, req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return _staticFilesMiddleware(staticFiles, req, res, next);
};

const oldHttpServerListeners = WebApp.httpServer.listeners('request').slice(0);
WebApp.httpServer.removeAllListeners('request');
WebApp.httpServer.addListener('request', function (req, res) {
  const next = () => {
    for (const oldListener of oldHttpServerListeners) {
      oldListener.apply(WebApp.httpServer, arguments);
    }
  };

  if (RocketChat.settings.get('Force_SSL') !== true) {
    next();
    return;
  }

  const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
  const localhostRegexp = /^\s*(127\.0\.0\.1|::1)\s*$/;

  const localhostTest = function (x) {
    return localhostRegexp.test(x);
  };

  const isLocal = localhostRegexp.test(remoteAddress) && (!req.headers['x-forwarded-for'] || _.all(req.headers['x-forwarded-for'].split(','), localhostTest));

  const isSsl = req.connection.pair || req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'].indexOf('https') !== -1;

  if (RocketChat && RocketChat.debugLevel === 'debug') {
    console.log('req.url', req.url);
    console.log('remoteAddress', remoteAddress);
    console.log('isLocal', isLocal);
    console.log('isSsl', isSsl);
    console.log('req.headers', req.headers);
  }

  if (!isLocal && !isSsl) {
    let host = req.headers['host'] || url.parse(Meteor.absoluteUrl()).hostname;
    host = host.replace(/:\d+$/, '');
    res.writeHead(302, {
      'Location': `https://${host}${req.url}`
    });
    res.end();
    return;
  }

  return next();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_cors/common.js                                                                     //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
Meteor.startup(function () {
  RocketChat.settings.onload('Force_SSL', function (key, value) {
    Meteor.absoluteUrl.defaultOptions.secure = value;
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:cors/cors.js");
require("/node_modules/meteor/rocketchat:cors/common.js");

/* Exports */
Package._define("rocketchat:cors");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_cors.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjb3JzL2NvcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y29ycy9jb21tb24uanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwidXJsIiwiTW9uZ28iLCJ0bHMiLCJERUZBVUxUX0VDREhfQ1VSVkUiLCJzZXRDb25uZWN0aW9uT3B0aW9ucyIsImlnbm9yZVVuZGVmaW5lZCIsIldlYkFwcCIsInJhd0Nvbm5lY3RIYW5kbGVycyIsInVzZSIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsInJlcSIsInJlcyIsIm5leHQiLCJfYm9keSIsImhlYWRlcnMiLCJ1bmRlZmluZWQiLCJpc05hTiIsImluZGV4T2YiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiUk9PVF9VUkxfUEFUSF9QUkVGSVgiLCJidWYiLCJzZXRFbmNvZGluZyIsIm9uIiwiY2h1bmsiLCJSb2NrZXRDaGF0IiwiZGVidWdMZXZlbCIsImNvbnNvbGUiLCJsb2ciLCJncmVlbiIsIm1ldGhvZCIsImJvZHkiLCJKU09OIiwicGFyc2UiLCJlcnJvciIsInRlc3QiLCJzZXRIZWFkZXIiLCJrZXkiLCJ2YWwiLCJ0b0xvd2VyQ2FzZSIsImFwcGx5IiwiYXJndW1lbnRzIiwiX3N0YXRpY0ZpbGVzTWlkZGxld2FyZSIsIldlYkFwcEludGVybmFscyIsInN0YXRpY0ZpbGVzTWlkZGxld2FyZSIsInN0YXRpY0ZpbGVzIiwib2xkSHR0cFNlcnZlckxpc3RlbmVycyIsImh0dHBTZXJ2ZXIiLCJsaXN0ZW5lcnMiLCJzbGljZSIsInJlbW92ZUFsbExpc3RlbmVycyIsImFkZExpc3RlbmVyIiwib2xkTGlzdGVuZXIiLCJzZXR0aW5ncyIsImdldCIsInJlbW90ZUFkZHJlc3MiLCJjb25uZWN0aW9uIiwic29ja2V0IiwibG9jYWxob3N0UmVnZXhwIiwibG9jYWxob3N0VGVzdCIsIngiLCJpc0xvY2FsIiwiYWxsIiwic3BsaXQiLCJpc1NzbCIsInBhaXIiLCJob3N0IiwiYWJzb2x1dGVVcmwiLCJob3N0bmFtZSIsInJlcGxhY2UiLCJ3cml0ZUhlYWQiLCJlbmQiLCJzdGFydHVwIiwib25sb2FkIiwidmFsdWUiLCJkZWZhdWx0T3B0aW9ucyIsInNlY3VyZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxHQUFKO0FBQVFMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxLQUFSLENBQWIsRUFBNEI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFVBQUlELENBQUo7QUFBTTs7QUFBbEIsQ0FBNUIsRUFBZ0QsQ0FBaEQ7QUFBbUQsSUFBSUUsS0FBSjtBQUFVTixPQUFPQyxLQUFQLENBQWFDLFFBQVEsY0FBUixDQUFiLEVBQXFDO0FBQUNJLFFBQU1GLENBQU4sRUFBUTtBQUFDRSxZQUFNRixDQUFOO0FBQVE7O0FBQWxCLENBQXJDLEVBQXlELENBQXpEO0FBQTRELElBQUlHLEdBQUo7QUFBUVAsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLEtBQVIsQ0FBYixFQUE0QjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0csVUFBSUgsQ0FBSjtBQUFNOztBQUFsQixDQUE1QixFQUFnRCxDQUFoRDtBQU92TTtBQUNBO0FBQ0FHLElBQUlDLGtCQUFKLEdBQXlCLE1BQXpCLEMsQ0FFQTtBQUNBOztBQUNBRixNQUFNRyxvQkFBTixDQUEyQjtBQUMxQkMsbUJBQWlCO0FBRFMsQ0FBM0I7QUFJQUMsT0FBT0Msa0JBQVAsQ0FBMEJDLEdBQTFCLENBQThCQyxPQUFPQyxlQUFQLENBQXVCLFVBQVNDLEdBQVQsRUFBY0Ms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QUFDQTJCLFlBQVFDLEdBQVIsQ0FBWSxlQUFaLEVBQTZCMkIsYUFBN0I7QUFDQTVCLFlBQVFDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCaUMsT0FBdkI7QUFDQWxDLFlBQVFDLEdBQVIsQ0FBWSxPQUFaLEVBQXFCb0MsS0FBckI7QUFDQXJDLFlBQVFDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCakIsSUFBSUksT0FBL0I7QUFDQTs7QUFFRCxNQUFJLENBQUM4QyxPQUFELElBQVksQ0FBQ0csS0FBakIsRUFBd0I7QUFDdkIsUUFBSUUsT0FBT3ZELElBQUlJLE9BQUosQ0FBWSxNQUFaLEtBQXVCZixJQUFJaUMsS0FBSixDQUFVeEIsT0FBTzBELFdBQVAsRUFBVixFQUFnQ0MsUUFBbEU7QUFDQUYsV0FBT0EsS0FBS0csT0FBTCxDQUFhLE9BQWIsRUFBc0IsRUFBdEIsQ0FBUDtBQUNBekQsUUFBSTBELFNBQUosQ0FBYyxHQUFkLEVBQW1CO0FBQ2xCLGtCQUFhLFdBQVdKLElBQU0sR0FBR3ZELElBQUlYLEdBQUs7QUFEeEIsS0FBbkI7QUFHQVksUUFBSTJELEdBQUo7QUFDQTtBQUNBOztBQUVELFNBQU8xRCxNQUFQO0FBQ0EsQ0F4Q0QsRTs7Ozs7Ozs7Ozs7QUMvRUFKLE9BQU8rRCxPQUFQLENBQWUsWUFBVztBQUN6Qi9DLGFBQVc0QixRQUFYLENBQW9Cb0IsTUFBcEIsQ0FBMkIsV0FBM0IsRUFBd0MsVUFBU3BDLEdBQVQsRUFBY3FDLEtBQWQsRUFBcUI7QUFDNURqRSxXQUFPMEQsV0FBUCxDQUFtQlEsY0FBbkIsQ0FBa0NDLE1BQWxDLEdBQTJDRixLQUEzQztBQUNBLEdBRkQ7QUFHQSxDQUpELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfY29ycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgV2ViQXBwSW50ZXJuYWxzICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuXG5pbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgdGxzIGZyb20gJ3Rscyc7XG4vLyBGSVggRm9yIFRMUyBlcnJvciBzZWUgbW9yZSBoZXJlIGh0dHBzOi8vZ2l0aHViLmNvbS9Sb2NrZXRDaGF0L1JvY2tldC5DaGF0L2lzc3Vlcy85MzE2XG4vLyBUT0RPOiBSZW1vdmUgYWZ0ZXIgTm9kZUpTIGZpeCBpdCwgbW9yZSBpbmZvcm1hdGlvbiBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvaXNzdWVzLzE2MTk2IGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9wdWxsLzE2ODUzXG50bHMuREVGQVVMVF9FQ0RIX0NVUlZFID0gJ2F1dG8nO1xuXG4vLyBSZXZlcnQgY2hhbmdlIGZyb20gTWV0ZW9yIDEuNi4xIHdobyBzZXQgaWdub3JlVW5kZWZpbmVkOiB0cnVlXG4vLyBtb3JlIGluZm9ybWF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvOTQ0NFxuTW9uZ28uc2V0Q29ubmVjdGlvbk9wdGlvbnMoe1xuXHRpZ25vcmVVbmRlZmluZWQ6IGZhbHNlXG59KTtcblxuV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy51c2UoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHRpZiAocmVxLl9ib2R5KSB7XG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fVxuXHRpZiAocmVxLmhlYWRlcnNbJ3RyYW5zZmVyLWVuY29kaW5nJ10gPT09IHVuZGVmaW5lZCAmJiBpc05hTihyZXEuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSkpIHtcblx0XHRyZXR1cm4gbmV4dCgpO1xuXHR9XG5cdGlmIChyZXEuaGVhZGVyc1snY29udGVudC10eXBlJ10gIT09ICcnICYmIHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fVxuXHRpZiAocmVxLnVybC5pbmRleE9mKGAkeyBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYIH0vdWZzL2ApID09PSAwKSB7XG5cdFx0cmV0dXJuIG5leHQoKTtcblx0fVxuXG5cdGxldCBidWYgPSAnJztcblx0cmVxLnNldEVuY29kaW5nKCd1dGY4Jyk7XG5cdHJlcS5vbignZGF0YScsIGZ1bmN0aW9uKGNodW5rKSB7XG5cdFx0cmV0dXJuIGJ1ZiArPSBjaHVuaztcblx0fSk7XG5cblx0cmVxLm9uKCdlbmQnLCBmdW5jdGlvbigpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdCAmJiBSb2NrZXRDaGF0LmRlYnVnTGV2ZWwgPT09ICdkZWJ1ZycpIHtcblx0XHRcdGNvbnNvbGUubG9nKCdbcmVxdWVzdF0nLmdyZWVuLCByZXEubWV0aG9kLCByZXEudXJsLCAnXFxuaGVhZGVycyAtPicsIHJlcS5oZWFkZXJzLCAnXFxuYm9keSAtPicsIGJ1Zik7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdHJlcS5ib2R5ID0gSlNPTi5wYXJzZShidWYpO1xuXHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRyZXEuYm9keSA9IGJ1Zjtcblx0XHR9XG5cdFx0cmVxLl9ib2R5ID0gdHJ1ZTtcblxuXHRcdHJldHVybiBuZXh0KCk7XG5cdH0pO1xufSkpO1xuXG5XZWJBcHAucmF3Q29ubmVjdEhhbmRsZXJzLnVzZShmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHRpZiAoL15cXC8oYXBpfF90aW1lc3luY3xzb2NranN8dGFwLWkxOG58X19jb3Jkb3ZhKShcXC98JCkvLnRlc3QocmVxLnVybCkpIHtcblx0XHRyZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xuXHR9XG5cblx0Y29uc3Qgc2V0SGVhZGVyID0gcmVzLnNldEhlYWRlcjtcblx0cmVzLnNldEhlYWRlciA9IGZ1bmN0aW9uKGtleSwgdmFsKSB7XG5cdFx0aWYgKGtleS50b0xvd2VyQ2FzZSgpID09PSAnYWNjZXNzLWNvbnRyb2wtYWxsb3ctb3JpZ2luJyAmJiB2YWwgPT09ICdodHRwOi8vbWV0ZW9yLmxvY2FsJykge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyZXR1cm4gc2V0SGVhZGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdH07XG5cdHJldHVybiBuZXh0KCk7XG59KTtcblxuY29uc3QgX3N0YXRpY0ZpbGVzTWlkZGxld2FyZSA9IFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc01pZGRsZXdhcmU7XG5cbldlYkFwcEludGVybmFscy5fc3RhdGljRmlsZXNNaWRkbGV3YXJlID0gZnVuY3Rpb24oc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KSB7XG5cdHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG5cdHJldHVybiBfc3RhdGljRmlsZXNNaWRkbGV3YXJlKHN0YXRpY0ZpbGVzLCByZXEsIHJlcywgbmV4dCk7XG59O1xuXG5jb25zdCBvbGRIdHRwU2VydmVyTGlzdGVuZXJzID0gV2ViQXBwLmh0dHBTZXJ2ZXIubGlzdGVuZXJzKCdyZXF1ZXN0Jykuc2xpY2UoMCk7XG5cbldlYkFwcC5odHRwU2VydmVyLnJlbW92ZUFsbExpc3RlbmVycygncmVxdWVzdCcpO1xuXG5XZWJBcHAuaHR0cFNlcnZlci5hZGRMaXN0ZW5lcigncmVxdWVzdCcsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG5cdGNvbnN0IG5leHQgPSAoKSA9PiB7XG5cdFx0Zm9yIChjb25zdCBvbGRMaXN0ZW5lciBvZiBvbGRIdHRwU2VydmVyTGlzdGVuZXJzKSB7XG5cdFx0XHRvbGRMaXN0ZW5lci5hcHBseShXZWJBcHAuaHR0cFNlcnZlciwgYXJndW1lbnRzKTtcblx0XHR9XG5cdH07XG5cblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGb3JjZV9TU0wnKSAhPT0gdHJ1ZSkge1xuXHRcdG5leHQoKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCByZW1vdGVBZGRyZXNzID0gcmVxLmNvbm5lY3Rpb24ucmVtb3RlQWRkcmVzcyB8fCByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3M7XG5cdGNvbnN0IGxvY2FsaG9zdFJlZ2V4cCA9IC9eXFxzKigxMjdcXC4wXFwuMFxcLjF8OjoxKVxccyokLztcblx0Y29uc3QgbG9jYWxob3N0VGVzdCA9IGZ1bmN0aW9uKHgpIHtcblx0XHRyZXR1cm4gbG9jYWxob3N0UmVnZXhwLnRlc3QoeCk7XG5cdH07XG5cblx0Y29uc3QgaXNMb2NhbCA9IGxvY2FsaG9zdFJlZ2V4cC50ZXN0KHJlbW90ZUFkZHJlc3MpICYmICghcmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddIHx8IF8uYWxsKHJlcS5oZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXS5zcGxpdCgnLCcpLCBsb2NhbGhvc3RUZXN0KSk7XG5cdGNvbnN0IGlzU3NsID0gcmVxLmNvbm5lY3Rpb24ucGFpciB8fCAocmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLXByb3RvJ10gJiYgcmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLXByb3RvJ10uaW5kZXhPZignaHR0cHMnKSAhPT0gLTEpO1xuXG5cdGlmIChSb2NrZXRDaGF0ICYmIFJvY2tldENoYXQuZGVidWdMZXZlbCA9PT0gJ2RlYnVnJykge1xuXHRcdGNvbnNvbGUubG9nKCdyZXEudXJsJywgcmVxLnVybCk7XG5cdFx0Y29uc29sZS5sb2coJ3JlbW90ZUFkZHJlc3MnLCByZW1vdGVBZGRyZXNzKTtcblx0XHRjb25zb2xlLmxvZygnaXNMb2NhbCcsIGlzTG9jYWwpO1xuXHRcdGNvbnNvbGUubG9nKCdpc1NzbCcsIGlzU3NsKTtcblx0XHRjb25zb2xlLmxvZygncmVxLmhlYWRlcnMnLCByZXEuaGVhZGVycyk7XG5cdH1cblxuXHRpZiAoIWlzTG9jYWwgJiYgIWlzU3NsKSB7XG5cdFx0bGV0IGhvc3QgPSByZXEuaGVhZGVyc1snaG9zdCddIHx8IHVybC5wYXJzZShNZXRlb3IuYWJzb2x1dGVVcmwoKSkuaG9zdG5hbWU7XG5cdFx0aG9zdCA9IGhvc3QucmVwbGFjZSgvOlxcZCskLywgJycpO1xuXHRcdHJlcy53cml0ZUhlYWQoMzAyLCB7XG5cdFx0XHQnTG9jYXRpb24nOiBgaHR0cHM6Ly8keyBob3N0IH0keyByZXEudXJsIH1gXG5cdFx0fSk7XG5cdFx0cmVzLmVuZCgpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHJldHVybiBuZXh0KCk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLm9ubG9hZCgnRm9yY2VfU1NMJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdE1ldGVvci5hYnNvbHV0ZVVybC5kZWZhdWx0T3B0aW9ucy5zZWN1cmUgPSB2YWx1ZTtcblx0fSk7XG59KTtcbiJdfQ==
