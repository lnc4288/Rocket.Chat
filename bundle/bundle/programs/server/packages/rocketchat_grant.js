(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:grant":{"server":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/index.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  path: () => path,
  generateCallback: () => generateCallback,
  generateAppCallback: () => generateAppCallback,
  Providers: () => Providers,
  Settings: () => Settings,
  GrantError: () => GrantError
});
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 0);
let session;
module.watch(require("express-session"), {
  default(v) {
    session = v;
  }

}, 1);
let Grant;
module.watch(require("grant-express"), {
  default(v) {
    Grant = v;
  }

}, 2);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 3);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 4);
let generateConfig;
module.watch(require("./grant"), {
  generateConfig(v) {
    generateConfig = v;
  }

}, 5);
let path, generateCallback, generateAppCallback;
module.watch(require("./routes"), {
  path(v) {
    path = v;
  },

  generateCallback(v) {
    generateCallback = v;
  },

  generateAppCallback(v) {
    generateAppCallback = v;
  }

}, 6);
let redirect;
module.watch(require("./redirect"), {
  middleware(v) {
    redirect = v;
  }

}, 7);
let Providers, providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  },

  middleware(v) {
    providers = v;
  }

}, 8);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 9);
let grant;
WebApp.connectHandlers.use(session({
  secret: 'grant',
  resave: true,
  saveUninitialized: true
})); // grant

WebApp.connectHandlers.use(path, (req, res, next) => {
  if (grant) {
    grant(req, res, next);
  } else {
    next();
  }
}); // callbacks

WebApp.connectHandlers.use((req, res, next) => {
  fiber(() => {
    redirect(req, res, next);
  }).run();
}); // providers

WebApp.connectHandlers.use((req, res, next) => {
  fiber(() => {
    providers(req, res, next);
  }).run();
});
Meteor.startup(() => {
  const config = generateConfig();
  grant = new Grant(config);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"authenticate.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/authenticate.js                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
var _extends = require("@babel/runtime/helpers/builtin/extends");

module.export({
  authenticate: () => authenticate
});
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let Accounts;
module.watch(require("meteor/accounts-base"), {
  Accounts(v) {
    Accounts = v;
  }

}, 2);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 3);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 4);
let Providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  }

}, 5);

const setAvatarFromUrl = (userId, url) => {
  return new Promise((resolve, reject) => {
    Meteor.runAsUser(userId, () => {
      Meteor.call('setAvatarFromService', url, '', 'url', err => {
        if (err) {
          if (err.details.timeToReset && err.details.timeToReset) {
            reject(t('error-too-many-requests', {
              seconds: parseInt(err.details.timeToReset / 1000)
            }));
          } else {
            reject(t('Avatar_url_invalid_or_error'));
          }
        } else {
          resolve();
        }
      });
    });
  });
};

const findUserByOAuthId = (providerName, id) => {
  return RocketChat.models.Users.findOne({
    [`settings.profile.oauth.${providerName}`]: id
  });
};

const addOAuthIdToUserProfile = (user, providerName, providerId) => {
  const profile = Object.assign({}, user.settings.profile, {
    oauth: _extends({}, user.settings.profile.oauth, {
      [providerName]: providerId
    })
  });
  RocketChat.models.Users.setProfile(user.id, profile);
};

function getAccessToken(req) {
  const i = req.url.indexOf('?');

  if (i === -1) {
    return;
  }

  const barePath = req.url.substring(i + 1);
  const splitPath = barePath.split('&');
  const token = splitPath.find(p => p.match(/access_token=[a-zA-Z0-9]+/));

  if (token) {
    return token.replace('access_token=', '');
  }
}

function authenticate(providerName, req) {
  return Promise.asyncApply(() => {
    let tokens;
    const accessToken = getAccessToken(req);
    const provider = Providers.get(providerName);

    if (!provider) {
      throw new GrantError(`Provider '${providerName}' not found`);
    }

    const userData = provider.getUser(accessToken);
    let user = findUserByOAuthId(providerName, userData.id);

    if (user) {
      user.id = user._id;
    } else {
      user = RocketChat.models.Users.findOneByEmailAddress(userData.email);

      if (user) {
        user.id = user._id;
      }
    }

    if (user) {
      addOAuthIdToUserProfile(user, providerName, userData.id);
      const loginResult = Promise.await(AccountsServer.loginWithUser({
        id: user.id
      }));
      tokens = loginResult.tokens;
    } else {
      const id = Accounts.createUser({
        email: userData.email,
        username: userData.username
      });
      RocketChat.models.Users.setProfile(id, {
        avatar: userData.avatar,
        oauth: {
          [providerName]: userData.id
        }
      });
      RocketChat.models.Users.setName(id, userData.name);
      RocketChat.models.Users.setEmailVerified(id, userData.email);
      Promise.await(setAvatarFromUrl(id, userData.avatar));
      const loginResult = Promise.await(AccountsServer.loginWithUser({
        id
      }));
      tokens = loginResult.tokens;
    }

    return tokens;
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"error.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/error.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  GrantError: () => GrantError
});

class GrantError extends Error {
  constructor(...args) {
    super(...args);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"grant.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/grant.js                                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  generateConfig: () => generateConfig,
  getConfig: () => getConfig
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let Providers;
module.watch(require("./providers"), {
  default(v) {
    Providers = v;
  }

}, 1);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 2);
let path, generateCallback, generateAppCallback;
module.watch(require("./routes"), {
  path(v) {
    path = v;
  },

  generateCallback(v) {
    generateCallback = v;
  },

  generateAppCallback(v) {
    generateAppCallback = v;
  }

}, 3);

function addProviders(config) {
  Settings.forEach((settings, providerName) => {
    if (settings.enabled === true) {
      const registeredProvider = Providers.get(providerName);

      if (!registeredProvider) {
        console.error(`No configuration for '${providerName}' provider`);
      } // basic settings


      const data = {
        key: settings.key,
        secret: settings.secret,
        scope: registeredProvider.scope,
        callback: generateCallback(providerName)
      }; // set each app

      Settings.apps.forEach((_, appName) => {
        data[appName] = {
          callback: generateAppCallback(providerName, appName)
        };
      });
      config[providerName] = data;
    }
  });
}

const config = {};

function generateConfig() {
  config['server'] = {
    protocol: 'http',
    host: RocketChat.hostname,
    path,
    state: true
  };
  addProviders(config);
  return config;
}

function getConfig() {
  return config;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"providers.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/providers.js                                                           //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  middleware: () => middleware
});
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 0);
let Storage;
module.watch(require("./storage"), {
  Storage(v) {
    Storage = v;
  }

}, 1);
let routes;
module.watch(require("./routes"), {
  routes(v) {
    routes = v;
  }

}, 2);

class Providers extends Storage {
  register(name, options, getUser) {
    check(name, String);
    check(options, {
      // eslint-disable-next-line
      scope: Match.OneOf(String, [String])
    });
    check(getUser, Function);

    this._add(name.toLowerCase(), {
      scope: options.scope,
      getUser
    });
  }

}

const providers = new Providers();
module.exportDefault(providers);

function middleware(req, res, next) {
  const route = routes.providers(req);

  if (route) {
    const list = [];
    providers.forEach((_, name) => list.push(name));
    res.end(JSON.stringify({
      data: list
    }));
    return;
  }

  next();
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"redirect.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/redirect.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  middleware: () => middleware
});
let authenticate;
module.watch(require("./authenticate"), {
  authenticate(v) {
    authenticate = v;
  }

}, 0);
let Settings;
module.watch(require("./settings"), {
  default(v) {
    Settings = v;
  }

}, 1);
let routes;
module.watch(require("./routes"), {
  routes(v) {
    routes = v;
  }

}, 2);
let GrantError;
module.watch(require("./error"), {
  GrantError(v) {
    GrantError = v;
  }

}, 3);

function parseUrl(url, config) {
  return url.replace(/\{[\ ]*(provider|accessToken|refreshToken|error)[\ ]*\}/g, (_, key) => config[key]);
}

function getAppConfig(providerName, appName) {
  const providerConfig = Settings.get(providerName);

  if (providerConfig) {
    return Settings.apps.get(appName);
  }
}

function middleware(req, res, next) {
  return Promise.asyncApply(() => {
    const route = routes.appCallback(req); // handle app callback

    if (route) {
      const config = {
        provider: route.provider
      };
      const appConfig = getAppConfig(route.provider, route.app);

      if (appConfig) {
        const {
          redirectUrl,
          errorUrl
        } = appConfig;

        try {
          const tokens = Promise.await(authenticate(route.provider, req));
          config.accessToken = tokens.accessToken;
          config.refreshToken = tokens.refreshToken;
          res.redirect(parseUrl(redirectUrl, config));
          return;
        } catch (error) {
          config.error = error instanceof GrantError ? error.message : 'Something went wrong';
          console.error(error);
          res.redirect(parseUrl(errorUrl, config));
          return;
        }
      }
    }

    next();
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"routes.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/routes.js                                                              //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  path: () => path,
  generateCallback: () => generateCallback,
  generateAppCallback: () => generateAppCallback,
  getPaths: () => getPaths,
  routes: () => routes
});
const path = '/_oauth_apps';

function generateCallback(providerName) {
  return `${path}/${providerName}/callback`;
}

function generateAppCallback(providerName, appName) {
  return generateCallback(`${providerName}/${appName}`);
}

function getPaths(req) {
  const i = req.url.indexOf('?');
  let barePath;

  if (i === -1) {
    barePath = req.url;
  } else {
    barePath = req.url.substring(0, i);
  }

  const splitPath = barePath.split('/'); // Any non-oauth request will continue down the default
  // middlewares.

  if (splitPath[1] === '_oauth_apps') {
    return splitPath.slice(2);
  }
}

const routes = {
  // :path/:provider/:app/callback
  appCallback: req => {
    const paths = getPaths(req);

    if (paths && paths[2] === 'callback') {
      return {
        provider: paths[0],
        app: paths[1]
      };
    }
  },
  // :path/providers
  providers: req => {
    const paths = getPaths(req);
    return paths && paths[0] === 'providers';
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/settings.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 0);
let Storage;
module.watch(require("./storage"), {
  Storage(v) {
    Storage = v;
  }

}, 1);

class Apps extends Storage {
  add(name, body) {
    check(name, String);
    check(body, {
      redirectUrl: String,
      errorUrl: String
    });

    this._add(name, body);
  }

}

class Settings extends Storage {
  constructor() {
    super();
    this.apps = new Apps();
  }

  add(settings) {
    check(settings, {
      enabled: Match.Optional(Boolean),
      provider: String,
      key: String,
      secret: String
    });

    this._add(settings.provider, {
      enabled: settings.enabled === true,
      provider: settings.provider,
      key: settings.key,
      secret: settings.secret
    });
  }

}

const settings = new Settings();
module.exportDefault(settings);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_grant/server/storage.js                                                             //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  Storage: () => Storage
});

class Storage {
  constructor() {
    this._data = {};
  }

  all() {
    return this._data;
  }

  forEach(fn) {
    Object.keys(this.all()).forEach(name => {
      fn(this.get(name), name);
    });
  }

  get(name) {
    return this.all()[name.toLowerCase()];
  }

  has(name) {
    return !!this._data[name];
  }

  _add(name, body) {
    if (this.has(name)) {
      console.error(`'${name}' have been already defined`);
      return;
    }

    this._data[name] = body;
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"express-session":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/express-session/package.json                          //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
exports.name = "express-session";
exports.version = "1.15.4";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/express-session/index.js                              //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/*!
 * express-session
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var cookie = require('cookie');
var crc = require('crc').crc32;
var debug = require('debug')('express-session');
var deprecate = require('depd')('express-session');
var parseUrl = require('parseurl');
var uid = require('uid-safe').sync
  , onHeaders = require('on-headers')
  , signature = require('cookie-signature')

var Session = require('./session/session')
  , MemoryStore = require('./session/memory')
  , Cookie = require('./session/cookie')
  , Store = require('./session/store')

// environment

var env = process.env.NODE_ENV;

/**
 * Expose the middleware.
 */

exports = module.exports = session;

/**
 * Expose constructors.
 */

exports.Store = Store;
exports.Cookie = Cookie;
exports.Session = Session;
exports.MemoryStore = MemoryStore;

/**
 * Warning message for `MemoryStore` usage in production.
 * @private
 */

var warning = 'Warning: connect.session() MemoryStore is not\n'
  + 'designed for a production environment, as it will leak\n'
  + 'memory, and will not scale past a single process.';

/**
 * Node.js 0.8+ async implementation.
 * @private
 */

/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

/**
 * Setup session store with the given `options`.
 *
 * @param {Object} [options]
 * @param {Object} [options.cookie] Options for cookie
 * @param {Function} [options.genid]
 * @param {String} [options.name=connect.sid] Session ID cookie name
 * @param {Boolean} [options.proxy]
 * @param {Boolean} [options.resave] Resave unmodified sessions back to the store
 * @param {Boolean} [options.rolling] Enable/disable rolling session expiration
 * @param {Boolean} [options.saveUninitialized] Save uninitialized sessions to the store
 * @param {String|Array} [options.secret] Secret for signing session ID
 * @param {Object} [options.store=MemoryStore] Session store
 * @param {String} [options.unset]
 * @return {Function} middleware
 * @public
 */

function session(options) {
  var opts = options || {}

  // get the cookie options
  var cookieOptions = opts.cookie || {}

  // get the session id generate function
  var generateId = opts.genid || generateSessionId

  // get the session cookie name
  var name = opts.name || opts.key || 'connect.sid'

  // get the session store
  var store = opts.store || new MemoryStore()

  // get the trust proxy setting
  var trustProxy = opts.proxy

  // get the resave session option
  var resaveSession = opts.resave;

  // get the rolling session option
  var rollingSessions = Boolean(opts.rolling)

  // get the save uninitialized session option
  var saveUninitializedSession = opts.saveUninitialized

  // get the cookie signing secret
  var secret = opts.secret

  if (typeof generateId !== 'function') {
    throw new TypeError('genid option must be a function');
  }

  if (resaveSession === undefined) {
    deprecate('undefined resave option; provide resave option');
    resaveSession = true;
  }

  if (saveUninitializedSession === undefined) {
    deprecate('undefined saveUninitialized option; provide saveUninitialized option');
    saveUninitializedSession = true;
  }

  if (opts.unset && opts.unset !== 'destroy' && opts.unset !== 'keep') {
    throw new TypeError('unset option must be "destroy" or "keep"');
  }

  // TODO: switch to "destroy" on next major
  var unsetDestroy = opts.unset === 'destroy'

  if (Array.isArray(secret) && secret.length === 0) {
    throw new TypeError('secret option array must contain one or more strings');
  }

  if (secret && !Array.isArray(secret)) {
    secret = [secret];
  }

  if (!secret) {
    deprecate('req.secret; provide secret option');
  }

  // notify user that this store is not
  // meant for a production environment
  /* istanbul ignore next: not tested */
  if ('production' == env && store instanceof MemoryStore) {
    console.warn(warning);
  }

  // generates the new session
  store.generate = function(req){
    req.sessionID = generateId(req);
    req.session = new Session(req);
    req.session.cookie = new Cookie(cookieOptions);

    if (cookieOptions.secure === 'auto') {
      req.session.cookie.secure = issecure(req, trustProxy);
    }
  };

  var storeImplementsTouch = typeof store.touch === 'function';

  // register event listeners for the store to track readiness
  var storeReady = true
  store.on('disconnect', function ondisconnect() {
    storeReady = false
  })
  store.on('connect', function onconnect() {
    storeReady = true
  })

  return function session(req, res, next) {
    // self-awareness
    if (req.session) {
      next()
      return
    }

    // Handle connection as if there is no session if
    // the store has temporarily disconnected etc
    if (!storeReady) {
      debug('store is disconnected')
      next()
      return
    }

    // pathname mismatch
    var originalPath = parseUrl.original(req).pathname;
    if (originalPath.indexOf(cookieOptions.path || '/') !== 0) return next();

    // ensure a secret is available or bail
    if (!secret && !req.secret) {
      next(new Error('secret option required for sessions'));
      return;
    }

    // backwards compatibility for signed cookies
    // req.secret is passed from the cookie parser middleware
    var secrets = secret || [req.secret];

    var originalHash;
    var originalId;
    var savedHash;
    var touched = false

    // expose store
    req.sessionStore = store;

    // get the session ID from the cookie
    var cookieId = req.sessionID = getcookie(req, name, secrets);

    // set-cookie
    onHeaders(res, function(){
      if (!req.session) {
        debug('no session');
        return;
      }

      if (!shouldSetCookie(req)) {
        return;
      }

      // only send secure cookies via https
      if (req.session.cookie.secure && !issecure(req, trustProxy)) {
        debug('not secured');
        return;
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      // set cookie
      setcookie(res, name, req.sessionID, secrets[0], req.session.cookie.data);
    });

    // proxy end() to commit the session
    var _end = res.end;
    var _write = res.write;
    var ended = false;
    res.end = function end(chunk, encoding) {
      if (ended) {
        return false;
      }

      ended = true;

      var ret;
      var sync = true;

      function writeend() {
        if (sync) {
          ret = _end.call(res, chunk, encoding);
          sync = false;
          return;
        }

        _end.call(res);
      }

      function writetop() {
        if (!sync) {
          return ret;
        }

        if (chunk == null) {
          ret = true;
          return ret;
        }

        var contentLength = Number(res.getHeader('Content-Length'));

        if (!isNaN(contentLength) && contentLength > 0) {
          // measure chunk
          chunk = !Buffer.isBuffer(chunk)
            ? new Buffer(chunk, encoding)
            : chunk;
          encoding = undefined;

          if (chunk.length !== 0) {
            debug('split response');
            ret = _write.call(res, chunk.slice(0, chunk.length - 1));
            chunk = chunk.slice(chunk.length - 1, chunk.length);
            return ret;
          }
        }

        ret = _write.call(res, chunk, encoding);
        sync = false;

        return ret;
      }

      if (shouldDestroy(req)) {
        // destroy session
        debug('destroying');
        store.destroy(req.sessionID, function ondestroy(err) {
          if (err) {
            defer(next, err);
          }

          debug('destroyed');
          writeend();
        });

        return writetop();
      }

      // no session to save
      if (!req.session) {
        debug('no session');
        return _end.call(res, chunk, encoding);
      }

      if (!touched) {
        // touch session
        req.session.touch()
        touched = true
      }

      if (shouldSave(req)) {
        req.session.save(function onsave(err) {
          if (err) {
            defer(next, err);
          }

          writeend();
        });

        return writetop();
      } else if (storeImplementsTouch && shouldTouch(req)) {
        // store implements touch method
        debug('touching');
        store.touch(req.sessionID, req.session, function ontouch(err) {
          if (err) {
            defer(next, err);
          }

          debug('touched');
          writeend();
        });

        return writetop();
      }

      return _end.call(res, chunk, encoding);
    };

    // generate the session
    function generate() {
      store.generate(req);
      originalId = req.sessionID;
      originalHash = hash(req.session);
      wrapmethods(req.session);
    }

    // wrap session methods
    function wrapmethods(sess) {
      var _reload = sess.reload
      var _save = sess.save;

      function reload(callback) {
        debug('reloading %s', this.id)
        _reload.call(this, function () {
          wrapmethods(req.session)
          callback.apply(this, arguments)
        })
      }

      function save() {
        debug('saving %s', this.id);
        savedHash = hash(this);
        _save.apply(this, arguments);
      }

      Object.defineProperty(sess, 'reload', {
        configurable: true,
        enumerable: false,
        value: reload,
        writable: true
      })

      Object.defineProperty(sess, 'save', {
        configurable: true,
        enumerable: false,
        value: save,
        writable: true
      });
    }

    // check if session has been modified
    function isModified(sess) {
      return originalId !== sess.id || originalHash !== hash(sess);
    }

    // check if session has been saved
    function isSaved(sess) {
      return originalId === sess.id && savedHash === hash(sess);
    }

    // determine if session should be destroyed
    function shouldDestroy(req) {
      return req.sessionID && unsetDestroy && req.session == null;
    }

    // determine if session should be saved to store
    function shouldSave(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return !saveUninitializedSession && cookieId !== req.sessionID
        ? isModified(req.session)
        : !isSaved(req.session)
    }

    // determine if session should be touched
    function shouldTouch(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        debug('session ignored because of bogus req.sessionID %o', req.sessionID);
        return false;
      }

      return cookieId === req.sessionID && !shouldSave(req);
    }

    // determine if cookie should be set on response
    function shouldSetCookie(req) {
      // cannot set cookie without a session ID
      if (typeof req.sessionID !== 'string') {
        return false;
      }

      return cookieId != req.sessionID
        ? saveUninitializedSession || isModified(req.session)
        : rollingSessions || req.session.cookie.expires != null && isModified(req.session);
    }

    // generate a session if the browser doesn't send a sessionID
    if (!req.sessionID) {
      debug('no SID sent, generating session');
      generate();
      next();
      return;
    }

    // generate the session object
    debug('fetching %s', req.sessionID);
    store.get(req.sessionID, function(err, sess){
      // error handling
      if (err) {
        debug('error %j', err);

        if (err.code !== 'ENOENT') {
          next(err);
          return;
        }

        generate();
      // no session
      } else if (!sess) {
        debug('no session found');
        generate();
      // populate req.session
      } else {
        debug('session found');
        store.createSession(req, sess);
        originalId = req.sessionID;
        originalHash = hash(sess);

        if (!resaveSession) {
          savedHash = originalHash
        }

        wrapmethods(req.session);
      }

      next();
    });
  };
};

/**
 * Generate a session ID for a new session.
 *
 * @return {String}
 * @private
 */

function generateSessionId(sess) {
  return uid(24);
}

/**
 * Get the session ID cookie from request.
 *
 * @return {string}
 * @private
 */

function getcookie(req, name, secrets) {
  var header = req.headers.cookie;
  var raw;
  var val;

  // read from cookie header
  if (header) {
    var cookies = cookie.parse(header);

    raw = cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  // back-compat read from cookieParser() signedCookies data
  if (!val && req.signedCookies) {
    val = req.signedCookies[name];

    if (val) {
      deprecate('cookie should be available in req.headers.cookie');
    }
  }

  // back-compat read from cookieParser() cookies data
  if (!val && req.cookies) {
    raw = req.cookies[name];

    if (raw) {
      if (raw.substr(0, 2) === 's:') {
        val = unsigncookie(raw.slice(2), secrets);

        if (val) {
          deprecate('cookie should be available in req.headers.cookie');
        }

        if (val === false) {
          debug('cookie signature invalid');
          val = undefined;
        }
      } else {
        debug('cookie unsigned')
      }
    }
  }

  return val;
}

/**
 * Hash the given `sess` object omitting changes to `.cookie`.
 *
 * @param {Object} sess
 * @return {String}
 * @private
 */

function hash(sess) {
  return crc(JSON.stringify(sess, function (key, val) {
    // ignore sess.cookie property
    if (this === sess && key === 'cookie') {
      return
    }

    return val
  }))
}

/**
 * Determine if request is secure.
 *
 * @param {Object} req
 * @param {Boolean} [trustProxy]
 * @return {Boolean}
 * @private
 */

function issecure(req, trustProxy) {
  // socket is https server
  if (req.connection && req.connection.encrypted) {
    return true;
  }

  // do not trust proxy
  if (trustProxy === false) {
    return false;
  }

  // no explicit trust; try req.secure from express
  if (trustProxy !== true) {
    var secure = req.secure;
    return typeof secure === 'boolean'
      ? secure
      : false;
  }

  // read the proto from x-forwarded-proto header
  var header = req.headers['x-forwarded-proto'] || '';
  var index = header.indexOf(',');
  var proto = index !== -1
    ? header.substr(0, index).toLowerCase().trim()
    : header.toLowerCase().trim()

  return proto === 'https';
}

/**
 * Set cookie on response.
 *
 * @private
 */

function setcookie(res, name, val, secret, options) {
  var signed = 's:' + signature.sign(val, secret);
  var data = cookie.serialize(name, signed, options);

  debug('set-cookie %s', data);

  var prev = res.getHeader('set-cookie') || [];
  var header = Array.isArray(prev) ? prev.concat(data) : [prev, data];

  res.setHeader('set-cookie', header)
}

/**
 * Verify and decode the given `val` with `secrets`.
 *
 * @param {String} val
 * @param {Array} secrets
 * @returns {String|Boolean}
 * @private
 */
function unsigncookie(val, secrets) {
  for (var i = 0; i < secrets.length; i++) {
    var result = signature.unsign(val, secrets[i]);

    if (result !== false) {
      return result;
    }
  }

  return false;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"grant-express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/grant-express/package.json                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
exports.name = "grant-express";
exports.version = "3.8.0";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// node_modules/meteor/rocketchat_grant/node_modules/grant-express/index.js                                //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //

module.exports = require('grant').express()

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:grant/server/index.js");

/* Exports */
Package._define("rocketchat:grant", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_grant.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC9zZXJ2ZXIvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL2F1dGhlbnRpY2F0ZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFudC9zZXJ2ZXIvZXJyb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL2dyYW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9wcm92aWRlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL3JlZGlyZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9yb3V0ZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhbnQvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYW50L3NlcnZlci9zdG9yYWdlLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsInBhdGgiLCJnZW5lcmF0ZUNhbGxiYWNrIiwiZ2VuZXJhdGVBcHBDYWxsYmFjayIsIlByb3ZpZGVycyIsIlNldHRpbmdzIiwiR3JhbnRFcnJvciIsIldlYkFwcCIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJzZXNzaW9uIiwiZGVmYXVsdCIsIkdyYW50IiwiZmliZXIiLCJnZW5lcmF0ZUNvbmZpZyIsInJlZGlyZWN0IiwibWlkZGxld2FyZSIsInByb3ZpZGVycyIsImdyYW50IiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwic2VjcmV0IiwicmVzYXZlIiwic2F2ZVVuaW5pdGlhbGl6ZWQiLCJyZXEiLCJyZXMiLCJuZXh0IiwicnVuIiwiTWV0ZW9yIiwic3RhcnR1cCIsImNvbmZpZyIsImF1dGhlbnRpY2F0ZSIsIkFjY291bnRzU2VydmVyIiwiUm9ja2V0Q2hhdCIsIkFjY291bnRzIiwic2V0QXZhdGFyRnJvbVVybCIsInVzZXJJZCIsInVybCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicnVuQXNVc2VyIiwiY2FsbCIsImVyciIsImRldGFpbHMiLCJ0aW1lVG9SZXNldCIsInQiLCJzZWNvbmRzIiwicGFyc2VJbnQiLCJmaW5kVXNlckJ5T0F1dGhJZCIsInByb3ZpZGVyTmFtZSIsImlkIiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lIiwiYWRkT0F1dGhJZFRvVXNlclByb2ZpbGUiLCJ1c2VyIiwicHJvdmlkZXJJZCIsInByb2ZpbGUiLCJPYmplY3QiLCJhc3NpZ24iLCJzZXR0aW5ncyIsIm9hdXRoIiwic2V0UHJvZmlsZSIsImdldEFjY2Vzc1Rva2VuIiwiaSIsImluZGV4T2YiLCJiYXJlUGF0aCIsInN1YnN0cmluZyIsInNwbGl0UGF0aCIsInNwbGl0IiwidG9rZW4iLCJmaW5kIiwicCIsIm1hdGNoIiwicmVwbGFjZSIsInRva2VucyIsImFjY2Vzc1Rva2VuIiwicHJvdmlkZXIiLCJnZXQiLCJ1c2VyRGF0YSIsImdldFVzZXIiLCJfaWQiLCJmaW5kT25lQnlFbWFpbEFkZHJlc3MiLCJlbWFpbCIsImxvZ2luUmVzdWx0IiwibG9naW5XaXRoVXNlciIsImNyZWF0ZVVzZXIiLCJ1c2VybmFtZSIsImF2YXRhciIsInNldE5hbWUiLCJuYW1lIiwic2V0RW1haWxWZXJpZmllZCIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJhcmdzIiwiZ2V0Q29uZmlnIiwiYWRkUHJvdmlkZXJzIiwiZm9yRWFjaCIsImVuYWJsZWQiLCJyZWdpc3RlcmVkUHJvdmlkZXIiLCJjb25zb2xlIiwiZXJyb3IiLCJkYXRhIiwia2V5Iiwic2NvcGUiLCJjYWxsYmFjayIsImFwcHMiLCJfIiwiYXBwTmFtZSIsInByb3RvY29sIiwiaG9zdCIsImhvc3RuYW1lIiwic3RhdGUiLCJjaGVjayIsIlN0b3JhZ2UiLCJyb3V0ZXMiLCJyZWdpc3RlciIsIm9wdGlvbnMiLCJTdHJpbmciLCJNYXRjaCIsIk9uZU9mIiwiRnVuY3Rpb24iLCJfYWRkIiwidG9Mb3dlckNhc2UiLCJleHBvcnREZWZhdWx0Iiwicm91dGUiLCJsaXN0IiwicHVzaCIsImVuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJwYXJzZVVybCIsImdldEFwcENvbmZpZyIsInByb3ZpZGVyQ29uZmlnIiwiYXBwQ2FsbGJhY2siLCJhcHBDb25maWciLCJhcHAiLCJyZWRpcmVjdFVybCIsImVycm9yVXJsIiwicmVmcmVzaFRva2VuIiwibWVzc2FnZSIsImdldFBhdGhzIiwic2xpY2UiLCJwYXRocyIsIkFwcHMiLCJhZGQiLCJib2R5IiwiT3B0aW9uYWwiLCJCb29sZWFuIiwiX2RhdGEiLCJhbGwiLCJmbiIsImtleXMiLCJoYXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxRQUFLLE1BQUlBLElBQVY7QUFBZUMsb0JBQWlCLE1BQUlBLGdCQUFwQztBQUFxREMsdUJBQW9CLE1BQUlBLG1CQUE3RTtBQUFpR0MsYUFBVSxNQUFJQSxTQUEvRztBQUF5SEMsWUFBUyxNQUFJQSxRQUF0STtBQUErSUMsY0FBVyxNQUFJQTtBQUE5SixDQUFkO0FBQXlMLElBQUlDLE1BQUo7QUFBV1IsT0FBT1MsS0FBUCxDQUFhQyxRQUFRLGVBQVIsQ0FBYixFQUFzQztBQUFDRixTQUFPRyxDQUFQLEVBQVM7QUFBQ0gsYUFBT0csQ0FBUDtBQUFTOztBQUFwQixDQUF0QyxFQUE0RCxDQUE1RDtBQUErRCxJQUFJQyxPQUFKO0FBQVlaLE9BQU9TLEtBQVAsQ0FBYUMsUUFBUSxpQkFBUixDQUFiLEVBQXdDO0FBQUNHLFVBQVFGLENBQVIsRUFBVTtBQUFDQyxjQUFRRCxDQUFSO0FBQVU7O0FBQXRCLENBQXhDLEVBQWdFLENBQWhF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LE9BQU8rSCxhQUFQLENBeUNlaEUsUUF6Q2YsRTs7Ozs7Ozs7Ozs7QUNBQS9ELE9BQU9DLE1BQVAsQ0FBYztBQUFDb0gsV0FBUSxNQUFJQTtBQUFiLENBQWQ7O0FBQU8sTUFBTUEsT0FBTixDQUFjO0FBQ3BCckIsZ0JBQWM7QUFDYixTQUFLd0QsS0FBTCxHQUFhLEVBQWI7QUFDQTs7QUFFREMsUUFBTTtBQUNMLFdBQU8sS0FBS0QsS0FBWjtBQUNBOztBQUVEcEQsVUFBUXNELEVBQVIsRUFBWTtBQUNYN0YsV0FBTzhGLElBQVAsQ0FBWSxLQUFLRixHQUFMLEVBQVosRUFDRXJELE9BREYsQ0FDV1AsSUFBRCxJQUFVO0FBQ2xCNkQsU0FBRyxLQUFLekUsR0FBTCxDQUFTWSxJQUFULENBQUgsRUFBbUJBLElBQW5CO0FBQ0EsS0FIRjtBQUlBOztBQUVEWixNQUFJWSxJQUFKLEVBQVU7QUFDVCxXQUFPLEtBQUs0RCxHQUFMLEdBQVc1RCxLQUFLaUMsV0FBTCxFQUFYLENBQVA7QUFDQTs7QUFFRDhCLE1BQUkvRCxJQUFKLEVBQVU7QUFDVCxXQUFPLENBQUMsQ0FBQyxLQUFLMkQsS0FBTCxDQUFXM0QsSUFBWCxDQUFUO0FBQ0E7O0FBRURnQyxPQUFLaEMsSUFBTCxFQUFXd0QsSUFBWCxFQUFpQjtBQUNoQixRQUFJLEtBQUtPLEdBQUwsQ0FBUy9ELElBQVQsQ0FBSixFQUFvQjtBQUNuQlUsY0FBUUMsS0FBUixDQUFlLElBQUlYLElBQU0sNkJBQXpCO0FBQ0E7QUFDQTs7QUFFRCxTQUFLMkQsS0FBTCxDQUFXM0QsSUFBWCxJQUFtQndELElBQW5CO0FBQ0E7O0FBL0JtQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2dyYW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV2ViQXBwIH0gZnJvbSAnbWV0ZW9yL3dlYmFwcCc7XG5pbXBvcnQgc2Vzc2lvbiBmcm9tICdleHByZXNzLXNlc3Npb24nO1xuaW1wb3J0IEdyYW50IGZyb20gJ2dyYW50LWV4cHJlc3MnO1xuaW1wb3J0IGZpYmVyIGZyb20gJ2ZpYmVycyc7XG5cbmltcG9ydCB7IEdyYW50RXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IGdlbmVyYXRlQ29uZmlnIH0gZnJvbSAnLi9ncmFudCc7XG5pbXBvcnQgeyBwYXRoLCBnZW5lcmF0ZUNhbGxiYWNrLCBnZW5lcmF0ZUFwcENhbGxiYWNrIH0gZnJvbSAnLi9yb3V0ZXMnO1xuaW1wb3J0IHsgbWlkZGxld2FyZSBhcyByZWRpcmVjdCB9IGZyb20gJy4vcmVkaXJlY3QnO1xuaW1wb3J0IFByb3ZpZGVycywgeyBtaWRkbGV3YXJlIGFzIHByb3ZpZGVycyB9IGZyb20gJy4vcHJvdmlkZXJzJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL3NldHRpbmdzJztcblxubGV0IGdyYW50O1xuXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShzZXNzaW9uKHtcblx0c2VjcmV0OiAnZ3JhbnQnLFxuXHRyZXNhdmU6IHRydWUsXG5cdHNhdmVVbmluaXRpYWxpemVkOiB0cnVlXG59KSk7XG5cbi8vIGdyYW50XG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShwYXRoLCAocmVxLCByZXMsIG5leHQpID0+IHtcblx0aWYgKGdyYW50KSB7XG5cdFx0Z3JhbnQocmVxLCByZXMsIG5leHQpO1xuXHR9IGVsc2Uge1xuXHRcdG5leHQoKTtcblx0fVxufSk7XG5cbi8vIGNhbGxiYWNrc1xuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGZpYmVyKCgpID0+IHtcblx0XHRyZWRpcmVjdChyZXEsIHJlcywgbmV4dCk7XG5cdH0pLnJ1bigpO1xufSk7XG5cbi8vIHByb3ZpZGVyc1xuV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGZpYmVyKCgpID0+IHtcblx0XHRwcm92aWRlcnMocmVxLCByZXMsIG5leHQpO1xuXHR9KS5ydW4oKTtcbn0pO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdGNvbnN0IGNvbmZpZyA9IGdlbmVyYXRlQ29uZmlnKCk7XG5cblx0Z3JhbnQgPSBuZXcgR3JhbnQoY29uZmlnKTtcbn0pO1xuXG5leHBvcnQge1xuXHRwYXRoLFxuXHRnZW5lcmF0ZUNhbGxiYWNrLFxuXHRnZW5lcmF0ZUFwcENhbGxiYWNrLFxuXHRQcm92aWRlcnMsXG5cdFNldHRpbmdzLFxuXHRHcmFudEVycm9yXG59O1xuIiwiaW1wb3J0IHsgQWNjb3VudHNTZXJ2ZXIgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDphY2NvdW50cyc7XG5pbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcbmltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmltcG9ydCB7IEdyYW50RXJyb3IgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCBQcm92aWRlcnMgZnJvbSAnLi9wcm92aWRlcnMnO1xuXG5jb25zdCBzZXRBdmF0YXJGcm9tVXJsID0gKHVzZXJJZCwgdXJsKSA9PiB7XG5cdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzZXRBdmF0YXJGcm9tU2VydmljZScsIHVybCwgJycsICd1cmwnLCAoZXJyKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRpZiAoZXJyLmRldGFpbHMudGltZVRvUmVzZXQgJiYgZXJyLmRldGFpbHMudGltZVRvUmVzZXQpIHtcblx0XHRcdFx0XHRcdHJlamVjdCgodCgnZXJyb3ItdG9vLW1hbnktcmVxdWVzdHMnLCB7XG5cdFx0XHRcdFx0XHRcdHNlY29uZHM6IHBhcnNlSW50KGVyci5kZXRhaWxzLnRpbWVUb1Jlc2V0IC8gMTAwMClcblx0XHRcdFx0XHRcdH0pKSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJlamVjdCh0KCdBdmF0YXJfdXJsX2ludmFsaWRfb3JfZXJyb3InKSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0pO1xufTtcblxuY29uc3QgZmluZFVzZXJCeU9BdXRoSWQgPSAocHJvdmlkZXJOYW1lLCBpZCkgPT4ge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7IFtgc2V0dGluZ3MucHJvZmlsZS5vYXV0aC4keyBwcm92aWRlck5hbWUgfWBdOiBpZCB9KTtcbn07XG5cbmNvbnN0IGFkZE9BdXRoSWRUb1VzZXJQcm9maWxlID0gKHVzZXIsIHByb3ZpZGVyTmFtZSwgcHJvdmlkZXJJZCkgPT4ge1xuXHRjb25zdCBwcm9maWxlID0gT2JqZWN0LmFzc2lnbih7fSwgdXNlci5zZXR0aW5ncy5wcm9maWxlLCB7XG5cdFx0b2F1dGg6IHtcblx0XHRcdC4uLnVzZXIuc2V0dGluZ3MucHJvZmlsZS5vYXV0aCxcblx0XHRcdFtwcm92aWRlck5hbWVdOiBwcm92aWRlcklkXG5cdFx0fVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRQcm9maWxlKHVzZXIuaWQsIHByb2ZpbGUpO1xufTtcblxuZnVuY3Rpb24gZ2V0QWNjZXNzVG9rZW4ocmVxKSB7XG5cdGNvbnN0IGkgPSByZXEudXJsLmluZGV4T2YoJz8nKTtcblxuXHRpZiAoaSA9PT0gLTEpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBiYXJlUGF0aCA9IHJlcS51cmwuc3Vic3RyaW5nKGkgKyAxKTtcblx0Y29uc3Qgc3BsaXRQYXRoID0gYmFyZVBhdGguc3BsaXQoJyYnKTtcblx0Y29uc3QgdG9rZW4gPSBzcGxpdFBhdGguZmluZChwID0+IHAubWF0Y2goL2FjY2Vzc190b2tlbj1bYS16QS1aMC05XSsvKSk7XG5cblx0aWYgKHRva2VuKSB7XG5cdFx0cmV0dXJuIHRva2VuLnJlcGxhY2UoJ2FjY2Vzc190b2tlbj0nLCAnJyk7XG5cdH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGF1dGhlbnRpY2F0ZShwcm92aWRlck5hbWUsIHJlcSkge1xuXHRsZXQgdG9rZW5zO1xuXHRjb25zdCBhY2Nlc3NUb2tlbiA9IGdldEFjY2Vzc1Rva2VuKHJlcSk7XG5cdGNvbnN0IHByb3ZpZGVyID0gUHJvdmlkZXJzLmdldChwcm92aWRlck5hbWUpO1xuXG5cdGlmICghcHJvdmlkZXIpIHtcblx0XHR0aHJvdyBuZXcgR3JhbnRFcnJvcihgUHJvdmlkZXIgJyR7IHByb3ZpZGVyTmFtZSB9JyBub3QgZm91bmRgKTtcblx0fVxuXG5cdGNvbnN0IHVzZXJEYXRhID0gcHJvdmlkZXIuZ2V0VXNlcihhY2Nlc3NUb2tlbik7XG5cblx0bGV0IHVzZXIgPSBmaW5kVXNlckJ5T0F1dGhJZChwcm92aWRlck5hbWUsIHVzZXJEYXRhLmlkKTtcblxuXHRpZiAodXNlcikge1xuXHRcdHVzZXIuaWQgPSB1c2VyLl9pZDtcblx0fSBlbHNlIHtcblx0XHR1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5RW1haWxBZGRyZXNzKHVzZXJEYXRhLmVtYWlsKTtcblx0XHRpZiAodXNlcikge1xuXHRcdFx0dXNlci5pZCA9IHVzZXIuX2lkO1xuXHRcdH1cblx0fVxuXG5cdGlmICh1c2VyKSB7XG5cdFx0YWRkT0F1dGhJZFRvVXNlclByb2ZpbGUodXNlciwgcHJvdmlkZXJOYW1lLCB1c2VyRGF0YS5pZCk7XG5cblx0XHRjb25zdCBsb2dpblJlc3VsdCA9IGF3YWl0IEFjY291bnRzU2VydmVyLmxvZ2luV2l0aFVzZXIoeyBpZDogdXNlci5pZCB9KTtcblxuXHRcdHRva2VucyA9IGxvZ2luUmVzdWx0LnRva2Vucztcblx0fSBlbHNlIHtcblx0XHRjb25zdCBpZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIoe1xuXHRcdFx0ZW1haWw6IHVzZXJEYXRhLmVtYWlsLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXJEYXRhLnVzZXJuYW1lXG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRQcm9maWxlKGlkLCB7XG5cdFx0XHRhdmF0YXI6IHVzZXJEYXRhLmF2YXRhcixcblx0XHRcdG9hdXRoOiB7XG5cdFx0XHRcdFtwcm92aWRlck5hbWVdOiB1c2VyRGF0YS5pZFxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldE5hbWUoaWQsIHVzZXJEYXRhLm5hbWUpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldEVtYWlsVmVyaWZpZWQoaWQsIHVzZXJEYXRhLmVtYWlsKTtcblxuXHRcdGF3YWl0IHNldEF2YXRhckZyb21VcmwoaWQsIHVzZXJEYXRhLmF2YXRhcik7XG5cblx0XHRjb25zdCBsb2dpblJlc3VsdCA9IGF3YWl0IEFjY291bnRzU2VydmVyLmxvZ2luV2l0aFVzZXIoeyBpZCB9KTtcblxuXHRcdHRva2VucyA9IGxvZ2luUmVzdWx0LnRva2Vucztcblx0fVxuXG5cdHJldHVybiB0b2tlbnM7XG59XG4iLCJleHBvcnQgY2xhc3MgR3JhbnRFcnJvciBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3IoLi4uYXJncykge1xuXHRcdHN1cGVyKC4uLmFyZ3MpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuaW1wb3J0IFByb3ZpZGVycyBmcm9tICcuL3Byb3ZpZGVycyc7XG5pbXBvcnQgU2V0dGluZ3MgZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBwYXRoLCBnZW5lcmF0ZUNhbGxiYWNrLCBnZW5lcmF0ZUFwcENhbGxiYWNrIH0gZnJvbSAnLi9yb3V0ZXMnO1xuXG5mdW5jdGlvbiBhZGRQcm92aWRlcnMoY29uZmlnKSB7XG5cdFNldHRpbmdzLmZvckVhY2goKHNldHRpbmdzLCBwcm92aWRlck5hbWUpID0+IHtcblx0XHRpZiAoc2V0dGluZ3MuZW5hYmxlZCA9PT0gdHJ1ZSkge1xuXHRcdFx0Y29uc3QgcmVnaXN0ZXJlZFByb3ZpZGVyID0gUHJvdmlkZXJzLmdldChwcm92aWRlck5hbWUpO1xuXG5cdFx0XHRpZiAoIXJlZ2lzdGVyZWRQcm92aWRlcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBObyBjb25maWd1cmF0aW9uIGZvciAnJHsgcHJvdmlkZXJOYW1lIH0nIHByb3ZpZGVyYCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGJhc2ljIHNldHRpbmdzXG5cdFx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0XHRrZXk6IHNldHRpbmdzLmtleSxcblx0XHRcdFx0c2VjcmV0OiBzZXR0aW5ncy5zZWNyZXQsXG5cdFx0XHRcdHNjb3BlOiByZWdpc3RlcmVkUHJvdmlkZXIuc2NvcGUsXG5cdFx0XHRcdGNhbGxiYWNrOiBnZW5lcmF0ZUNhbGxiYWNrKHByb3ZpZGVyTmFtZSlcblx0XHRcdH07XG5cblx0XHRcdC8vIHNldCBlYWNoIGFwcFxuXHRcdFx0U2V0dGluZ3MuYXBwcy5mb3JFYWNoKChfLCBhcHBOYW1lKSA9PiB7XG5cdFx0XHRcdGRhdGFbYXBwTmFtZV0gPSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGdlbmVyYXRlQXBwQ2FsbGJhY2socHJvdmlkZXJOYW1lLCBhcHBOYW1lKVxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbmZpZ1twcm92aWRlck5hbWVdID0gZGF0YTtcblx0XHR9XG5cdH0pO1xufVxuXG5jb25zdCBjb25maWcgPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlQ29uZmlnKCkge1xuXHRjb25maWdbJ3NlcnZlciddID0ge1xuXHRcdHByb3RvY29sOiAnaHR0cCcsXG5cdFx0aG9zdDogUm9ja2V0Q2hhdC5ob3N0bmFtZSxcblx0XHRwYXRoLFxuXHRcdHN0YXRlOiB0cnVlXG5cdH07XG5cblx0YWRkUHJvdmlkZXJzKGNvbmZpZyk7XG5cblx0cmV0dXJuIGNvbmZpZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcblx0cmV0dXJuIGNvbmZpZztcbn1cbiIsImltcG9ydCB7IGNoZWNrIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5pbXBvcnQgeyByb3V0ZXMgfSBmcm9tICcuL3JvdXRlcyc7XG5cbmNsYXNzIFByb3ZpZGVycyBleHRlbmRzIFN0b3JhZ2Uge1xuXHRyZWdpc3RlcihuYW1lLCBvcHRpb25zLCBnZXRVc2VyKSB7XG5cdFx0Y2hlY2sobmFtZSwgU3RyaW5nKTtcblx0XHRjaGVjayhvcHRpb25zLCB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcblx0XHRcdHNjb3BlOiBNYXRjaC5PbmVPZihTdHJpbmcsIFtTdHJpbmddKVxuXHRcdH0pO1xuXHRcdGNoZWNrKGdldFVzZXIsIEZ1bmN0aW9uKTtcblxuXHRcdHRoaXMuX2FkZChuYW1lLnRvTG93ZXJDYXNlKCksIHtcblx0XHRcdHNjb3BlOiBvcHRpb25zLnNjb3BlLFxuXHRcdFx0Z2V0VXNlclxuXHRcdH0pO1xuXHR9XG59XG5cbmNvbnN0IHByb3ZpZGVycyA9IG5ldyBQcm92aWRlcnM7XG5cbmV4cG9ydCBkZWZhdWx0IHByb3ZpZGVycztcblxuZXhwb3J0IGZ1bmN0aW9uIG1pZGRsZXdhcmUocmVxLCByZXMsIG5leHQpIHtcblx0Y29uc3Qgcm91dGUgPSByb3V0ZXMucHJvdmlkZXJzKHJlcSk7XG5cblx0aWYgKHJvdXRlKSB7XG5cdFx0Y29uc3QgbGlzdCA9IFtdO1xuXG5cdFx0cHJvdmlkZXJzLmZvckVhY2goKF8sIG5hbWUpID0+IGxpc3QucHVzaChuYW1lKSk7XG5cblx0XHRyZXMuZW5kKEpTT04uc3RyaW5naWZ5KHtcblx0XHRcdGRhdGE6IGxpc3Rcblx0XHR9KSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0bmV4dCgpO1xufVxuIiwiaW1wb3J0IHsgYXV0aGVudGljYXRlIH0gZnJvbSAnLi9hdXRoZW50aWNhdGUnO1xuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgcm91dGVzIH0gZnJvbSAnLi9yb3V0ZXMnO1xuaW1wb3J0IHsgR3JhbnRFcnJvciB9IGZyb20gJy4vZXJyb3InO1xuXG5mdW5jdGlvbiBwYXJzZVVybCh1cmwsIGNvbmZpZykge1xuXHRyZXR1cm4gdXJsLnJlcGxhY2UoL1xce1tcXCBdKihwcm92aWRlcnxhY2Nlc3NUb2tlbnxyZWZyZXNoVG9rZW58ZXJyb3IpW1xcIF0qXFx9L2csIChfLCBrZXkpID0+IGNvbmZpZ1trZXldKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXBwQ29uZmlnKHByb3ZpZGVyTmFtZSwgYXBwTmFtZSkge1xuXHRjb25zdCBwcm92aWRlckNvbmZpZyA9IFNldHRpbmdzLmdldChwcm92aWRlck5hbWUpO1xuXG5cdGlmIChwcm92aWRlckNvbmZpZykge1xuXHRcdHJldHVybiBTZXR0aW5ncy5hcHBzLmdldChhcHBOYW1lKTtcblx0fVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlkZGxld2FyZShyZXEsIHJlcywgbmV4dCkge1xuXHRjb25zdCByb3V0ZSA9IHJvdXRlcy5hcHBDYWxsYmFjayhyZXEpO1xuXG5cdC8vIGhhbmRsZSBhcHAgY2FsbGJhY2tcblx0aWYgKHJvdXRlKSB7XG5cdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0cHJvdmlkZXI6IHJvdXRlLnByb3ZpZGVyXG5cdFx0fTtcblx0XHRjb25zdCBhcHBDb25maWcgPSBnZXRBcHBDb25maWcocm91dGUucHJvdmlkZXIsIHJvdXRlLmFwcCk7XG5cblx0XHRpZiAoYXBwQ29uZmlnKSB7XG5cdFx0XHRjb25zdCB7XG5cdFx0XHRcdHJlZGlyZWN0VXJsLFxuXHRcdFx0XHRlcnJvclVybFxuXHRcdFx0fSA9IGFwcENvbmZpZztcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgdG9rZW5zID0gYXdhaXQgYXV0aGVudGljYXRlKHJvdXRlLnByb3ZpZGVyLCByZXEpO1xuXG5cdFx0XHRcdGNvbmZpZy5hY2Nlc3NUb2tlbiA9IHRva2Vucy5hY2Nlc3NUb2tlbjtcblx0XHRcdFx0Y29uZmlnLnJlZnJlc2hUb2tlbiA9IHRva2Vucy5yZWZyZXNoVG9rZW47XG5cblx0XHRcdFx0cmVzLnJlZGlyZWN0KHBhcnNlVXJsKHJlZGlyZWN0VXJsLCBjb25maWcpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0Y29uZmlnLmVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBHcmFudEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdTb21ldGhpbmcgd2VudCB3cm9uZyc7XG5cblx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cblx0XHRcdFx0cmVzLnJlZGlyZWN0KHBhcnNlVXJsKGVycm9yVXJsLCBjb25maWcpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG5leHQoKTtcbn1cbiIsImV4cG9ydCBjb25zdCBwYXRoID0gJy9fb2F1dGhfYXBwcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUNhbGxiYWNrKHByb3ZpZGVyTmFtZSkge1xuXHRyZXR1cm4gYCR7IHBhdGggfS8keyBwcm92aWRlck5hbWUgfS9jYWxsYmFja2A7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUFwcENhbGxiYWNrKHByb3ZpZGVyTmFtZSwgYXBwTmFtZSkge1xuXHRyZXR1cm4gZ2VuZXJhdGVDYWxsYmFjayhgJHsgcHJvdmlkZXJOYW1lIH0vJHsgYXBwTmFtZSB9YCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXRocyhyZXEpIHtcblx0Y29uc3QgaSA9IHJlcS51cmwuaW5kZXhPZignPycpO1xuXHRsZXQgYmFyZVBhdGg7XG5cblx0aWYgKGkgPT09IC0xKSB7XG5cdFx0YmFyZVBhdGggPSByZXEudXJsO1xuXHR9IGVsc2Uge1xuXHRcdGJhcmVQYXRoID0gcmVxLnVybC5zdWJzdHJpbmcoMCwgaSk7XG5cdH1cblxuXHRjb25zdCBzcGxpdFBhdGggPSBiYXJlUGF0aC5zcGxpdCgnLycpO1xuXG5cdC8vIEFueSBub24tb2F1dGggcmVxdWVzdCB3aWxsIGNvbnRpbnVlIGRvd24gdGhlIGRlZmF1bHRcblx0Ly8gbWlkZGxld2FyZXMuXG5cdGlmIChzcGxpdFBhdGhbMV0gPT09ICdfb2F1dGhfYXBwcycpIHtcblx0XHRyZXR1cm4gc3BsaXRQYXRoLnNsaWNlKDIpO1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCByb3V0ZXMgPSB7XG5cdC8vIDpwYXRoLzpwcm92aWRlci86YXBwL2NhbGxiYWNrXG5cdGFwcENhbGxiYWNrOiAocmVxKSA9PiB7XG5cdFx0Y29uc3QgcGF0aHMgPSBnZXRQYXRocyhyZXEpO1xuXG5cdFx0aWYgKHBhdGhzICYmIHBhdGhzWzJdID09PSAnY2FsbGJhY2snKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRwcm92aWRlcjogcGF0aHNbMF0sXG5cdFx0XHRcdGFwcDogcGF0aHNbMV1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHQvLyA6cGF0aC9wcm92aWRlcnNcblx0cHJvdmlkZXJzOiAocmVxKSA9PiB7XG5cdFx0Y29uc3QgcGF0aHMgPSBnZXRQYXRocyhyZXEpO1xuXG5cdFx0cmV0dXJuIHBhdGhzICYmIHBhdGhzWzBdID09PSAncHJvdmlkZXJzJztcblx0fVxufTtcbiIsImltcG9ydCB7IGNoZWNrIH0gZnJvbSAnbWV0ZW9yL2NoZWNrJztcblxuaW1wb3J0IHsgU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmNsYXNzIEFwcHMgZXh0ZW5kcyBTdG9yYWdlIHtcblx0YWRkKG5hbWUsIGJvZHkpIHtcblx0XHRjaGVjayhuYW1lLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGJvZHksIHtcblx0XHRcdHJlZGlyZWN0VXJsOiBTdHJpbmcsXG5cdFx0XHRlcnJvclVybDogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHR0aGlzLl9hZGQobmFtZSwgYm9keSk7XG5cdH1cbn1cblxuY2xhc3MgU2V0dGluZ3MgZXh0ZW5kcyBTdG9yYWdlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuYXBwcyA9IG5ldyBBcHBzO1xuXHR9XG5cdGFkZChzZXR0aW5ncykge1xuXHRcdGNoZWNrKHNldHRpbmdzLCB7XG5cdFx0XHRlbmFibGVkOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdHByb3ZpZGVyOiBTdHJpbmcsXG5cdFx0XHRrZXk6IFN0cmluZyxcblx0XHRcdHNlY3JldDogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHR0aGlzLl9hZGQoc2V0dGluZ3MucHJvdmlkZXIsIHtcblx0XHRcdGVuYWJsZWQ6IHNldHRpbmdzLmVuYWJsZWQgPT09IHRydWUsXG5cdFx0XHRwcm92aWRlcjogc2V0dGluZ3MucHJvdmlkZXIsXG5cdFx0XHRrZXk6IHNldHRpbmdzLmtleSxcblx0XHRcdHNlY3JldDogc2V0dGluZ3Muc2VjcmV0XG5cdFx0fSk7XG5cdH1cbn1cblxuY29uc3Qgc2V0dGluZ3MgPSBuZXcgU2V0dGluZ3M7XG5cbmV4cG9ydCBkZWZhdWx0IHNldHRpbmdzO1xuIiwiZXhwb3J0IGNsYXNzIFN0b3JhZ2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLl9kYXRhID0ge307XG5cdH1cblxuXHRhbGwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2RhdGE7XG5cdH1cblxuXHRmb3JFYWNoKGZuKSB7XG5cdFx0T2JqZWN0LmtleXModGhpcy5hbGwoKSlcblx0XHRcdC5mb3JFYWNoKChuYW1lKSA9PiB7XG5cdFx0XHRcdGZuKHRoaXMuZ2V0KG5hbWUpLCBuYW1lKTtcblx0XHRcdH0pO1xuXHR9XG5cblx0Z2V0KG5hbWUpIHtcblx0XHRyZXR1cm4gdGhpcy5hbGwoKVtuYW1lLnRvTG93ZXJDYXNlKCldO1xuXHR9XG5cblx0aGFzKG5hbWUpIHtcblx0XHRyZXR1cm4gISF0aGlzLl9kYXRhW25hbWVdO1xuXHR9XG5cblx0X2FkZChuYW1lLCBib2R5KSB7XG5cdFx0aWYgKHRoaXMuaGFzKG5hbWUpKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGAnJHsgbmFtZSB9JyBoYXZlIGJlZW4gYWxyZWFkeSBkZWZpbmVkYCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5fZGF0YVtuYW1lXSA9IGJvZHk7XG5cdH1cbn1cbiJdfQ==
