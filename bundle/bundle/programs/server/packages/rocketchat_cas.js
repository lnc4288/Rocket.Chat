(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var RoutePolicy = Package.routepolicy.RoutePolicy;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var logger;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:cas":{"server":{"cas_rocketchat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_rocketchat.js                                                        //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
/* globals logger:true */
logger = new Logger('CAS', {});
Meteor.startup(function () {
  RocketChat.settings.addGroup('CAS', function () {
    this.add('CAS_enabled', false, {
      type: 'boolean',
      group: 'CAS',
      public: true
    });
    this.add('CAS_base_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_login_url', '', {
      type: 'string',
      group: 'CAS',
      public: true
    });
    this.add('CAS_version', '1.0', {
      type: 'select',
      values: [{
        key: '1.0',
        i18nLabel: '1.0'
      }, {
        key: '2.0',
        i18nLabel: '2.0'
      }],
      group: 'CAS'
    });
    this.section('Attribute_handling', function () {
      // Enable/disable sync
      this.add('CAS_Sync_User_Data_Enabled', true, {
        type: 'boolean'
      }); // Attribute mapping table

      this.add('CAS_Sync_User_Data_FieldMap', '{}', {
        type: 'string'
      });
    });
    this.section('CAS_Login_Layout', function () {
      this.add('CAS_popup_width', '810', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_popup_height', '610', {
        type: 'string',
        group: 'CAS',
        public: true
      });
      this.add('CAS_button_label_text', 'CAS', {
        type: 'string',
        group: 'CAS'
      });
      this.add('CAS_button_label_color', '#FFFFFF', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_button_color', '#13679A', {
        type: 'color',
        group: 'CAS'
      });
      this.add('CAS_autoclose', true, {
        type: 'boolean',
        group: 'CAS'
      });
    });
  });
});
let timer;

function updateServices()
/*record*/
{
  if (typeof timer !== 'undefined') {
    Meteor.clearTimeout(timer);
  }

  timer = Meteor.setTimeout(function () {
    const data = {
      // These will pe passed to 'node-cas' as options
      enabled: RocketChat.settings.get('CAS_enabled'),
      base_url: RocketChat.settings.get('CAS_base_url'),
      login_url: RocketChat.settings.get('CAS_login_url'),
      // Rocketchat Visuals
      buttonLabelText: RocketChat.settings.get('CAS_button_label_text'),
      buttonLabelColor: RocketChat.settings.get('CAS_button_label_color'),
      buttonColor: RocketChat.settings.get('CAS_button_color'),
      width: RocketChat.settings.get('CAS_popup_width'),
      height: RocketChat.settings.get('CAS_popup_height'),
      autoclose: RocketChat.settings.get('CAS_autoclose')
    }; // Either register or deregister the CAS login service based upon its configuration

    if (data.enabled) {
      logger.info('Enabling CAS login service');
      ServiceConfiguration.configurations.upsert({
        service: 'cas'
      }, {
        $set: data
      });
    } else {
      logger.info('Disabling CAS login service');
      ServiceConfiguration.configurations.remove({
        service: 'cas'
      });
    }
  }, 2000);
}

RocketChat.settings.get(/^CAS_.+/, (key, value) => {
  updateServices(value);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"cas_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/cas_server.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fiber;
module.watch(require("fibers"), {
  default(v) {
    fiber = v;
  }

}, 1);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 2);
let CAS;
module.watch(require("cas"), {
  default(v) {
    CAS = v;
  }

}, 3);
RoutePolicy.declare('/_cas/', 'network');

const closePopup = function (res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  const content = '<html><head><script>window.close()</script></head></html>';
  res.end(content, 'utf-8');
};

const casTicket = function (req, token, callback) {
  // get configuration
  if (!RocketChat.settings.get('CAS_enabled')) {
    logger.error('Got ticket validation request, but CAS is not enabled');
    callback();
  } // get ticket and validate.


  const parsedUrl = url.parse(req.url, true);
  const ticketId = parsedUrl.query.ticket;
  const baseUrl = RocketChat.settings.get('CAS_base_url');
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));

  const appUrl = Meteor.absoluteUrl().replace(/\/$/, '') + __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;

  logger.debug(`Using CAS_base_url: ${baseUrl}`);
  const cas = new CAS({
    base_url: baseUrl,
    version: cas_version,
    service: `${appUrl}/_cas/${token}`
  });
  cas.validate(ticketId, Meteor.bindEnvironment(function (err, status, username, details) {
    if (err) {
      logger.error(`error when trying to validate: ${err.message}`);
    } else if (status) {
      logger.info(`Validated user: ${username}`);
      const user_info = {
        username
      }; // CAS 2.0 attributes handling

      if (details && details.attributes) {
        _.extend(user_info, {
          attributes: details.attributes
        });
      }

      RocketChat.models.CredentialTokens.create(token, user_info);
    } else {
      logger.error(`Unable to validate ticket: ${ticketId}`);
    } //logger.debug("Receveied response: " + JSON.stringify(details, null , 4));


    callback();
  }));
  return;
};

const middleware = function (req, res, next) {
  // Make sure to catch any exceptions because otherwise we'd crash
  // the runner
  try {
    const barePath = req.url.substring(0, req.url.indexOf('?'));
    const splitPath = barePath.split('/'); // Any non-cas request will continue down the default
    // middlewares.

    if (splitPath[1] !== '_cas') {
      next();
      return;
    } // get auth token


    const credentialToken = splitPath[2];

    if (!credentialToken) {
      closePopup(res);
      return;
    } // validate ticket


    casTicket(req, credentialToken, function () {
      closePopup(res);
    });
  } catch (err) {
    logger.error(`Unexpected error : ${err.message}`);
    closePopup(res);
  }
}; // Listen to incoming OAuth http requests


WebApp.connectHandlers.use(function (req, res, next) {
  // Need to create a fiber since we're using synchronous http calls and nothing
  // else is wrapping this in a fiber automatically
  fiber(function () {
    middleware(req, res, next);
  }).run();
});
/*
 * Register a server-side login handle.
 * It is call after Accounts.callLoginMethod() is call from client.
 *
 */

Accounts.registerLoginHandler(function (options) {
  if (!options.cas) {
    return undefined;
  }

  const credentials = RocketChat.models.CredentialTokens.findOneById(options.cas.credentialToken);

  if (credentials === undefined) {
    throw new Meteor.Error(Accounts.LoginCancelledError.numericError, 'no matching login attempt found');
  }

  const result = credentials.userInfo;
  const syncUserDataFieldMap = RocketChat.settings.get('CAS_Sync_User_Data_FieldMap').trim();
  const cas_version = parseFloat(RocketChat.settings.get('CAS_version'));
  const sync_enabled = RocketChat.settings.get('CAS_Sync_User_Data_Enabled'); // We have these

  const ext_attrs = {
    username: result.username
  }; // We need these

  const int_attrs = {
    email: undefined,
    name: undefined,
    username: undefined,
    rooms: undefined
  }; // Import response attributes

  if (cas_version >= 2.0) {
    // Clean & import external attributes
    _.each(result.attributes, function (value, ext_name) {
      if (value) {
        ext_attrs[ext_name] = value[0];
      }
    });
  } // Source internal attributes


  if (syncUserDataFieldMap) {
    // Our mapping table: key(int_attr) -> value(ext_attr)
    // Spoken: Source this internal attribute from these external attributes
    const attr_map = JSON.parse(syncUserDataFieldMap);

    _.each(attr_map, function (source, int_name) {
      // Source is our String to interpolate
      if (_.isString(source)) {
        _.each(ext_attrs, function (value, ext_name) {
          source = source.replace(`%${ext_name}%`, ext_attrs[ext_name]);
        });

        int_attrs[int_name] = source;
        logger.debug(`Sourced internal attribute: ${int_name} = ${source}`);
      }
    });
  } // Search existing user by its external service id


  logger.debug(`Looking up user by id: ${result.username}`);
  let user = Meteor.users.findOne({
    'services.cas.external_id': result.username
  });

  if (user) {
    logger.debug(`Using existing user for '${result.username}' with id: ${user._id}`);

    if (sync_enabled) {
      logger.debug('Syncing user attributes'); // Update name

      if (int_attrs.name) {
        RocketChat._setRealName(user._id, int_attrs.name);
      } // Update email


      if (int_attrs.email) {
        Meteor.users.update(user, {
          $set: {
            emails: [{
              address: int_attrs.email,
              verified: true
            }]
          }
        });
      }
    }
  } else {
    // Define new user
    const newUser = {
      username: result.username,
      active: true,
      globalRoles: ['user'],
      emails: [],
      services: {
        cas: {
          external_id: result.username,
          version: cas_version,
          attrs: int_attrs
        }
      }
    }; // Add User.name

    if (int_attrs.name) {
      _.extend(newUser, {
        name: int_attrs.name
      });
    } // Add email


    if (int_attrs.email) {
      _.extend(newUser, {
        emails: [{
          address: int_attrs.email,
          verified: true
        }]
      });
    } // Create the user


    logger.debug(`User "${result.username}" does not exist yet, creating it`);
    const userId = Accounts.insertUserDoc({}, newUser); // Fetch and use it

    user = Meteor.users.findOne(userId);
    logger.debug(`Created new user for '${result.username}' with id: ${user._id}`); //logger.debug(JSON.stringify(user, undefined, 4));

    logger.debug(`Joining user to attribute channels: ${int_attrs.rooms}`);

    if (int_attrs.rooms) {
      _.each(int_attrs.rooms.split(','), function (room_name) {
        if (room_name) {
          let room = RocketChat.models.Rooms.findOneByNameAndType(room_name, 'c');

          if (!room) {
            room = RocketChat.models.Rooms.createWithIdTypeAndName(Random.id(), 'c', room_name);
          }

          RocketChat.models.Rooms.addUsernameByName(room_name, result.username);
          RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
            ts: new Date(),
            open: true,
            alert: true,
            unread: 1,
            userMentions: 1,
            groupMentions: 0
          });
        }
      });
    }
  }

  return {
    userId: user._id
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"models":{"CredentialTokens.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_cas/server/models/CredentialTokens.js                                               //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
RocketChat.models.CredentialTokens = new class extends RocketChat.models._Base {
  constructor() {
    super('credential_tokens');
    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  create(_id, userInfo) {
    const validForMilliseconds = 60000; // Valid for 60 seconds

    const token = {
      _id,
      userInfo,
      expireAt: new Date(Date.now() + validForMilliseconds)
    };
    this.insert(token);
    return token;
  }

  findOneById(_id) {
    const query = {
      _id,
      expireAt: {
        $gt: new Date()
      }
    };
    return this.findOne(query);
  }

}();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:cas/server/cas_rocketchat.js");
require("/node_modules/meteor/rocketchat:cas/server/cas_server.js");
require("/node_modules/meteor/rocketchat:cas/server/models/CredentialTokens.js");

/* Exports */
Package._define("rocketchat:cas");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_cas.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL2Nhc19yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNhcy9zZXJ2ZXIvY2FzX3NlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjYXMvc2VydmVyL21vZGVscy9DcmVkZW50aWFsVG9rZW5zLmpzIl0sIm5hbWVzIjpbImxvZ2dlciIsIkxvZ2dlciIsIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJncm91cCIsInB1YmxpYyIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsInNlY3Rpb24iLCJ0aW1lciIsInVwZGF0ZVNlcnZpY2VzIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsImRhdGEiLCJlbmFibGVkIiwiZ2V0IiwiYmFzZV91cmwiLCJsb2dpbl91cmwiLCJidXR0b25MYWJlbFRleHQiLCJidXR0b25MYWJlbENvbG9yIiwiYnV0dG9uQ29sb3IiLCJ3aWR0aCIsImhlaWdodCIsImF1dG9jbG9zZSIsImluZm8iLCJTZXJ2aWNlQ29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb25zIiwidXBzZXJ0Iiwic2VydmljZSIsIiRzZXQiLCJyZW1vdmUiLCJ2YWx1ZSIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsImZpYmVyIiwidXJsIiwiQ0FTIiwiUm91dGVQb2xpY3kiLCJkZWNsYXJlIiwiY2xvc2VQb3B1cCIsInJlcyIsIndyaXRlSGVhZCIsImNvbnRlbnQiLCJlbmQiLCJjYXNUaWNrZXQiLCJyZXEiLCJ0b2tlbiIsImNhbGxiYWNrIiwiZXJyb3IiLCJwYXJzZWRVcmwiLCJwYXJzZSIsInRpY2tldElkIiwicXVlcnkiLCJ0aWNrZXQiLCJiYXNlVXJsIiwiY2FzX3ZlcnNpb24iLCJwYXJzZUZsb2F0IiwiYXBwVXJsIiwiYWJzb2x1dGVVcmwiLCJyZXBsYWNlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsIlJPT1RfVVJMX1BBVEhfUFJFRklYIiwiZGVidWciLCJjYXMiLCJ2ZXJzaW9uIiwidmFsaWRhdGUiLCJiaW5kRW52aXJvbm1lbnQiLCJlcnIiLCJzdGF0dXMiLCJ1c2VybmFtZSIsImRldGFpbHMiLCJtZXNzYWdlIiwidXNlcl9pbmZvIiwiYXR0cmlidXRlcyIsImV4dGVuZCIsIm1vZGVscyIsIkNyZWRlbnRpYWxUb2tlbnMiLCJjcmVhdGUiLCJtaWRkbGV3YXJlIiwibmV4dCIsImJhcmVQYXRoIiwic3Vic3RyaW5nIiwiaW5kZXhPZiIsInNwbGl0UGF0aCIsInNwbGl0IiwiY3JlZGVudGlhbFRva2VuIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicnVuIiwiQWNjb3VudHMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsIm9wdGlvbnMiLCJ1bmRlZmluZWQiLCJjcmVkZW50aWFscyIsImZpbmRPbmVCeUlkIiwiRXJyb3IiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibnVtZXJpY0Vycm9yIiwicmVzdWx0IiwidXNlckluZm8iLCJzeW5jVXNlckRhdGFGaWVsZE1hcCIsInRyaW0iLCJzeW5jX2VuYWJsZWQiLCJleHRfYXR0cnMiLCJpbnRfYXR0cnMiLCJlbWFpbCIsIm5hbWUiLCJyb29tcyIsImVhY2giLCJleHRfbmFtZSIsImF0dHJfbWFwIiwiSlNPTiIsInNvdXJjZSIsImludF9uYW1lIiwiaXNTdHJpbmciLCJ1c2VyIiwidXNlcnMiLCJmaW5kT25lIiwiX2lkIiwiX3NldFJlYWxOYW1lIiwidXBkYXRlIiwiZW1haWxzIiwiYWRkcmVzcyIsInZlcmlmaWVkIiwibmV3VXNlciIsImFjdGl2ZSIsImdsb2JhbFJvbGVzIiwic2VydmljZXMiLCJleHRlcm5hbF9pZCIsImF0dHJzIiwidXNlcklkIiwiaW5zZXJ0VXNlckRvYyIsInJvb21fbmFtZSIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeU5hbWVBbmRUeXBlIiwiY3JlYXRlV2l0aElkVHlwZUFuZE5hbWUiLCJSYW5kb20iLCJpZCIsImFkZFVzZXJuYW1lQnlOYW1lIiwiU3Vic2NyaXB0aW9ucyIsImNyZWF0ZVdpdGhSb29tQW5kVXNlciIsInRzIiwiRGF0ZSIsIm9wZW4iLCJhbGVydCIsInVucmVhZCIsInVzZXJNZW50aW9ucyIsImdyb3VwTWVudGlvbnMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwidHJ5RW5zdXJlSW5kZXgiLCJzcGFyc2UiLCJleHBpcmVBZnRlclNlY29uZHMiLCJ2YWxpZEZvck1pbGxpc2Vjb25kcyIsImV4cGlyZUF0Iiwibm93IiwiaW5zZXJ0IiwiJGd0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQUEsU0FBUyxJQUFJQyxNQUFKLENBQVcsS0FBWCxFQUFrQixFQUFsQixDQUFUO0FBRUFDLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxhQUFXQyxRQUFYLENBQW9CQyxRQUFwQixDQUE2QixLQUE3QixFQUFvQyxZQUFXO0FBQzlDLFNBQUtDLEdBQUwsQ0FBUyxhQUFULEVBQXdCLEtBQXhCLEVBQStCO0FBQUVDLFlBQU0sU0FBUjtBQUFtQkMsYUFBTyxLQUExQjtBQUFpQ0MsY0FBUTtBQUF6QyxLQUEvQjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxjQUFULEVBQXlCLEVBQXpCLEVBQTZCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkMsYUFBTyxLQUF6QjtBQUFnQ0MsY0FBUTtBQUF4QyxLQUE3QjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxlQUFULEVBQTBCLEVBQTFCLEVBQThCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkMsYUFBTyxLQUF6QjtBQUFnQ0MsY0FBUTtBQUF4QyxLQUE5QjtBQUNBLFNBQUtILEdBQUwsQ0FBUyxhQUFULEVBQXdCLEtBQXhCLEVBQStCO0FBQUVDLFlBQU0sUUFBUjtBQUFrQkcsY0FBUSxDQUFDO0FBQUVDLGFB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QVE7QUFDYm1FLFNBRGE7QUFFYnFDLGdCQUFVO0FBQUVHLGFBQUssSUFBSWYsSUFBSjtBQUFQO0FBRkcsS0FBZDtBQUtBLFdBQU8sS0FBSzFCLE9BQUwsQ0FBYWxFLEtBQWIsQ0FBUDtBQUNBOztBQTFCNkUsQ0FBMUMsRUFBckMsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9jYXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIGxvZ2dlcjp0cnVlICovXG5cbmxvZ2dlciA9IG5ldyBMb2dnZXIoJ0NBUycsIHt9KTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0NBUycsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdDQVNfZW5hYmxlZCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdDQVMnLCBwdWJsaWM6IHRydWUgfSk7XG5cdFx0dGhpcy5hZGQoJ0NBU19iYXNlX3VybCcsICcnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHR0aGlzLmFkZCgnQ0FTX2xvZ2luX3VybCcsICcnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHR0aGlzLmFkZCgnQ0FTX3ZlcnNpb24nLCAnMS4wJywgeyB0eXBlOiAnc2VsZWN0JywgdmFsdWVzOiBbeyBrZXk6ICcxLjAnLCBpMThuTGFiZWw6ICcxLjAnfSwgeyBrZXk6ICcyLjAnLCBpMThuTGFiZWw6ICcyLjAnfV0sIGdyb3VwOiAnQ0FTJyB9KTtcblxuXHRcdHRoaXMuc2VjdGlvbignQXR0cmlidXRlX2hhbmRsaW5nJywgZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBFbmFibGUvZGlzYWJsZSBzeW5jXG5cdFx0XHR0aGlzLmFkZCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0VuYWJsZWQnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJyB9KTtcblx0XHRcdC8vIEF0dHJpYnV0ZSBtYXBwaW5nIHRhYmxlXG5cdFx0XHR0aGlzLmFkZCgnQ0FTX1N5bmNfVXNlcl9EYXRhX0ZpZWxkTWFwJywgJ3t9JywgeyB0eXBlOiAnc3RyaW5nJyB9KTtcblx0XHR9KTtcblxuXHRcdHRoaXMuc2VjdGlvbignQ0FTX0xvZ2luX0xheW91dCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19wb3B1cF93aWR0aCcsICc4MTAnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUycsIHB1YmxpYzogdHJ1ZSB9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfcG9wdXBfaGVpZ2h0JywgJzYxMCcsIHsgdHlwZTogJ3N0cmluZycsIGdyb3VwOiAnQ0FTJywgcHVibGljOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19idXR0b25fbGFiZWxfdGV4dCcsICdDQVMnLCB7IHR5cGU6ICdzdHJpbmcnLCBncm91cDogJ0NBUyd9KTtcblx0XHRcdHRoaXMuYWRkKCdDQVNfYnV0dG9uX2xhYmVsX2NvbG9yJywgJyNGRkZGRkYnLCB7IHR5cGU6ICdjb2xvcicsIGdyb3VwOiAnQ0FTJ30pO1xuXHRcdFx0dGhpcy5hZGQoJ0NBU19idXR0b25fY29sb3InLCAnIzEzNjc5QScsIHsgdHlwZTogJ2NvbG9yJywgZ3JvdXA6ICdDQVMnfSk7XG5cdFx0XHR0aGlzLmFkZCgnQ0FTX2F1dG9jbG9zZScsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBncm91cDogJ0NBUyd9KTtcblx0XHR9KTtcblx0fSk7XG59KTtcblxubGV0IHRpbWVyO1xuXG5mdW5jdGlvbiB1cGRhdGVTZXJ2aWNlcygvKnJlY29yZCovKSB7XG5cdGlmICh0eXBlb2YgdGltZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0TWV0ZW9yLmNsZWFyVGltZW91dCh0aW1lcik7XG5cdH1cblxuXHR0aW1lciA9IE1ldGVvci5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHQvLyBUaGVzZSB3aWxsIHBlIHBhc3NlZCB0byAnbm9kZS1jYXMnIGFzIG9wdGlvbnNcblx0XHRcdGVuYWJsZWQ6ICAgICAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfZW5hYmxlZCcpLFxuXHRcdFx0YmFzZV91cmw6ICAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19iYXNlX3VybCcpLFxuXHRcdFx0bG9naW5fdXJsOiAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19sb2dpbl91cmwnKSxcblx0XHRcdC8vIFJvY2tldGNoYXQgVmlzdWFsc1xuXHRcdFx0YnV0dG9uTGFiZWxUZXh0OiAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19idXR0b25fbGFiZWxfdGV4dCcpLFxuXHRcdFx0YnV0dG9uTGFiZWxDb2xvcjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19idXR0b25fbGFiZWxfY29sb3InKSxcblx0XHRcdGJ1dHRvbkNvbG9yOiAgICAgIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfYnV0dG9uX2NvbG9yJyksXG5cdFx0XHR3aWR0aDogICAgICAgICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX3BvcHVwX3dpZHRoJyksXG5cdFx0XHRoZWlnaHQ6ICAgICAgICAgICBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX3BvcHVwX2hlaWdodCcpLFxuXHRcdFx0YXV0b2Nsb3NlOiAgICAgICAgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0NBU19hdXRvY2xvc2UnKVxuXHRcdH07XG5cblx0XHQvLyBFaXRoZXIgcmVnaXN0ZXIgb3IgZGVyZWdpc3RlciB0aGUgQ0FTIGxvZ2luIHNlcnZpY2UgYmFzZWQgdXBvbiBpdHMgY29uZmlndXJhdGlvblxuXHRcdGlmIChkYXRhLmVuYWJsZWQpIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdFbmFibGluZyBDQVMgbG9naW4gc2VydmljZScpO1xuXHRcdFx0U2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMudXBzZXJ0KHtzZXJ2aWNlOiAnY2FzJ30sIHsgJHNldDogZGF0YSB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLmluZm8oJ0Rpc2FibGluZyBDQVMgbG9naW4gc2VydmljZScpO1xuXHRcdFx0U2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMucmVtb3ZlKHtzZXJ2aWNlOiAnY2FzJ30pO1xuXHRcdH1cblx0fSwgMjAwMCk7XG59XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eQ0FTXy4rLywgKGtleSwgdmFsdWUpID0+IHtcblx0dXBkYXRlU2VydmljZXModmFsdWUpO1xufSk7XG4iLCIvKiBnbG9iYWxzIFJvdXRlUG9saWN5LCBsb2dnZXIgKi9cbi8qIGpzaGludCBuZXdjYXA6IGZhbHNlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuaW1wb3J0IGZpYmVyIGZyb20gJ2ZpYmVycyc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgQ0FTIGZyb20gJ2Nhcyc7XG5cblJvdXRlUG9saWN5LmRlY2xhcmUoJy9fY2FzLycsICduZXR3b3JrJyk7XG5cbmNvbnN0IGNsb3NlUG9wdXAgPSBmdW5jdGlvbihyZXMpIHtcblx0cmVzLndyaXRlSGVhZCgyMDAsIHsnQ29udGVudC1UeXBlJzogJ3RleHQvaHRtbCd9KTtcblx0Y29uc3QgY29udGVudCA9ICc8aHRtbD48aGVhZD48c2NyaXB0PndpbmRvdy5jbG9zZSgpPC9zY3JpcHQ+PC9oZWFkPjwvaHRtbD4nO1xuXHRyZXMuZW5kKGNvbnRlbnQsICd1dGYtOCcpO1xufTtcblxuY29uc3QgY2FzVGlja2V0ID0gZnVuY3Rpb24ocmVxLCB0b2tlbiwgY2FsbGJhY2spIHtcblxuXHQvLyBnZXQgY29uZmlndXJhdGlvblxuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfZW5hYmxlZCcpKSB7XG5cdFx0bG9nZ2VyLmVycm9yKCdHb3QgdGlja2V0IHZhbGlkYXRpb24gcmVxdWVzdCwgYnV0IENBUyBpcyBub3QgZW5hYmxlZCcpO1xuXHRcdGNhbGxiYWNrKCk7XG5cdH1cblxuXHQvLyBnZXQgdGlja2V0IGFuZCB2YWxpZGF0ZS5cblx0Y29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHJlcS51cmwsIHRydWUpO1xuXHRjb25zdCB0aWNrZXRJZCA9IHBhcnNlZFVybC5xdWVyeS50aWNrZXQ7XG5cdGNvbnN0IGJhc2VVcmwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX2Jhc2VfdXJsJyk7XG5cdGNvbnN0IGNhc192ZXJzaW9uID0gcGFyc2VGbG9hdChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX3ZlcnNpb24nKSk7XG5cdGNvbnN0IGFwcFVybCA9IE1ldGVvci5hYnNvbHV0ZVVybCgpLnJlcGxhY2UoL1xcLyQvLCAnJykgKyBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYO1xuXHRsb2dnZXIuZGVidWcoYFVzaW5nIENBU19iYXNlX3VybDogJHsgYmFzZVVybCB9YCk7XG5cblx0Y29uc3QgY2FzID0gbmV3IENBUyh7XG5cdFx0YmFzZV91cmw6IGJhc2VVcmwsXG5cdFx0dmVyc2lvbjogY2FzX3ZlcnNpb24sXG5cdFx0c2VydmljZTogYCR7IGFwcFVybCB9L19jYXMvJHsgdG9rZW4gfWBcblx0fSk7XG5cblx0Y2FzLnZhbGlkYXRlKHRpY2tldElkLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKGVyciwgc3RhdHVzLCB1c2VybmFtZSwgZGV0YWlscykge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdGxvZ2dlci5lcnJvcihgZXJyb3Igd2hlbiB0cnlpbmcgdG8gdmFsaWRhdGU6ICR7IGVyci5tZXNzYWdlIH1gKTtcblx0XHR9IGVsc2UgaWYgKHN0YXR1cykge1xuXHRcdFx0bG9nZ2VyLmluZm8oYFZhbGlkYXRlZCB1c2VyOiAkeyB1c2VybmFtZSB9YCk7XG5cdFx0XHRjb25zdCB1c2VyX2luZm8gPSB7IHVzZXJuYW1lIH07XG5cblx0XHRcdC8vIENBUyAyLjAgYXR0cmlidXRlcyBoYW5kbGluZ1xuXHRcdFx0aWYgKGRldGFpbHMgJiYgZGV0YWlscy5hdHRyaWJ1dGVzKSB7XG5cdFx0XHRcdF8uZXh0ZW5kKHVzZXJfaW5mbywgeyBhdHRyaWJ1dGVzOiBkZXRhaWxzLmF0dHJpYnV0ZXMgfSk7XG5cdFx0XHR9XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5DcmVkZW50aWFsVG9rZW5zLmNyZWF0ZSh0b2tlbiwgdXNlcl9pbmZvKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLmVycm9yKGBVbmFibGUgdG8gdmFsaWRhdGUgdGlja2V0OiAkeyB0aWNrZXRJZCB9YCk7XG5cdFx0fVxuXHRcdC8vbG9nZ2VyLmRlYnVnKFwiUmVjZXZlaWVkIHJlc3BvbnNlOiBcIiArIEpTT04uc3RyaW5naWZ5KGRldGFpbHMsIG51bGwgLCA0KSk7XG5cblx0XHRjYWxsYmFjaygpO1xuXHR9KSk7XG5cblx0cmV0dXJuO1xufTtcblxuY29uc3QgbWlkZGxld2FyZSA9IGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cdC8vIE1ha2Ugc3VyZSB0byBjYXRjaCBhbnkgZXhjZXB0aW9ucyBiZWNhdXNlIG90aGVyd2lzZSB3ZSdkIGNyYXNoXG5cdC8vIHRoZSBydW5uZXJcblx0dHJ5IHtcblx0XHRjb25zdCBiYXJlUGF0aCA9IHJlcS51cmwuc3Vic3RyaW5nKDAsIHJlcS51cmwuaW5kZXhPZignPycpKTtcblx0XHRjb25zdCBzcGxpdFBhdGggPSBiYXJlUGF0aC5zcGxpdCgnLycpO1xuXG5cdFx0Ly8gQW55IG5vbi1jYXMgcmVxdWVzdCB3aWxsIGNvbnRpbnVlIGRvd24gdGhlIGRlZmF1bHRcblx0XHQvLyBtaWRkbGV3YXJlcy5cblx0XHRpZiAoc3BsaXRQYXRoWzFdICE9PSAnX2NhcycpIHtcblx0XHRcdG5leHQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBnZXQgYXV0aCB0b2tlblxuXHRcdGNvbnN0IGNyZWRlbnRpYWxUb2tlbiA9IHNwbGl0UGF0aFsyXTtcblx0XHRpZiAoIWNyZWRlbnRpYWxUb2tlbikge1xuXHRcdFx0Y2xvc2VQb3B1cChyZXMpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIHZhbGlkYXRlIHRpY2tldFxuXHRcdGNhc1RpY2tldChyZXEsIGNyZWRlbnRpYWxUb2tlbiwgZnVuY3Rpb24oKSB7XG5cdFx0XHRjbG9zZVBvcHVwKHJlcyk7XG5cdFx0fSk7XG5cblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0bG9nZ2VyLmVycm9yKGBVbmV4cGVjdGVkIGVycm9yIDogJHsgZXJyLm1lc3NhZ2UgfWApO1xuXHRcdGNsb3NlUG9wdXAocmVzKTtcblx0fVxufTtcblxuLy8gTGlzdGVuIHRvIGluY29taW5nIE9BdXRoIGh0dHAgcmVxdWVzdHNcbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cdC8vIE5lZWQgdG8gY3JlYXRlIGEgZmliZXIgc2luY2Ugd2UncmUgdXNpbmcgc3luY2hyb25vdXMgaHR0cCBjYWxscyBhbmQgbm90aGluZ1xuXHQvLyBlbHNlIGlzIHdyYXBwaW5nIHRoaXMgaW4gYSBmaWJlciBhdXRvbWF0aWNhbGx5XG5cdGZpYmVyKGZ1bmN0aW9uKCkge1xuXHRcdG1pZGRsZXdhcmUocmVxLCByZXMsIG5leHQpO1xuXHR9KS5ydW4oKTtcbn0pO1xuXG4vKlxuICogUmVnaXN0ZXIgYSBzZXJ2ZXItc2lkZSBsb2dpbiBoYW5kbGUuXG4gKiBJdCBpcyBjYWxsIGFmdGVyIEFjY291bnRzLmNhbGxMb2dpbk1ldGhvZCgpIGlzIGNhbGwgZnJvbSBjbGllbnQuXG4gKlxuICovXG5BY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcihmdW5jdGlvbihvcHRpb25zKSB7XG5cblx0aWYgKCFvcHRpb25zLmNhcykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRjb25zdCBjcmVkZW50aWFscyA9IFJvY2tldENoYXQubW9kZWxzLkNyZWRlbnRpYWxUb2tlbnMuZmluZE9uZUJ5SWQob3B0aW9ucy5jYXMuY3JlZGVudGlhbFRva2VuKTtcblx0aWYgKGNyZWRlbnRpYWxzID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKEFjY291bnRzLkxvZ2luQ2FuY2VsbGVkRXJyb3IubnVtZXJpY0Vycm9yLFxuXHRcdFx0J25vIG1hdGNoaW5nIGxvZ2luIGF0dGVtcHQgZm91bmQnKTtcblx0fVxuXG5cdGNvbnN0IHJlc3VsdCA9IGNyZWRlbnRpYWxzLnVzZXJJbmZvO1xuXHRjb25zdCBzeW5jVXNlckRhdGFGaWVsZE1hcCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfU3luY19Vc2VyX0RhdGFfRmllbGRNYXAnKS50cmltKCk7XG5cdGNvbnN0IGNhc192ZXJzaW9uID0gcGFyc2VGbG9hdChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQ0FTX3ZlcnNpb24nKSk7XG5cdGNvbnN0IHN5bmNfZW5hYmxlZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdDQVNfU3luY19Vc2VyX0RhdGFfRW5hYmxlZCcpO1xuXG5cdC8vIFdlIGhhdmUgdGhlc2Vcblx0Y29uc3QgZXh0X2F0dHJzID0ge1xuXHRcdHVzZXJuYW1lOiByZXN1bHQudXNlcm5hbWVcblx0fTtcblxuXHQvLyBXZSBuZWVkIHRoZXNlXG5cdGNvbnN0IGludF9hdHRycyA9IHtcblx0XHRlbWFpbDogdW5kZWZpbmVkLFxuXHRcdG5hbWU6IHVuZGVmaW5lZCxcblx0XHR1c2VybmFtZTogdW5kZWZpbmVkLFxuXHRcdHJvb21zOiB1bmRlZmluZWRcblx0fTtcblxuXHQvLyBJbXBvcnQgcmVzcG9uc2UgYXR0cmlidXRlc1xuXHRpZiAoY2FzX3ZlcnNpb24gPj0gMi4wKSB7XG5cdFx0Ly8gQ2xlYW4gJiBpbXBvcnQgZXh0ZXJuYWwgYXR0cmlidXRlc1xuXHRcdF8uZWFjaChyZXN1bHQuYXR0cmlidXRlcywgZnVuY3Rpb24odmFsdWUsIGV4dF9uYW1lKSB7XG5cdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0ZXh0X2F0dHJzW2V4dF9uYW1lXSA9IHZhbHVlWzBdO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gU291cmNlIGludGVybmFsIGF0dHJpYnV0ZXNcblx0aWYgKHN5bmNVc2VyRGF0YUZpZWxkTWFwKSB7XG5cblx0XHQvLyBPdXIgbWFwcGluZyB0YWJsZToga2V5KGludF9hdHRyKSAtPiB2YWx1ZShleHRfYXR0cilcblx0XHQvLyBTcG9rZW46IFNvdXJjZSB0aGlzIGludGVybmFsIGF0dHJpYnV0ZSBmcm9tIHRoZXNlIGV4dGVybmFsIGF0dHJpYnV0ZXNcblx0XHRjb25zdCBhdHRyX21hcCA9IEpTT04ucGFyc2Uoc3luY1VzZXJEYXRhRmllbGRNYXApO1xuXG5cdFx0Xy5lYWNoKGF0dHJfbWFwLCBmdW5jdGlvbihzb3VyY2UsIGludF9uYW1lKSB7XG5cdFx0XHQvLyBTb3VyY2UgaXMgb3VyIFN0cmluZyB0byBpbnRlcnBvbGF0ZVxuXHRcdFx0aWYgKF8uaXNTdHJpbmcoc291cmNlKSkge1xuXHRcdFx0XHRfLmVhY2goZXh0X2F0dHJzLCBmdW5jdGlvbih2YWx1ZSwgZXh0X25hbWUpIHtcblx0XHRcdFx0XHRzb3VyY2UgPSBzb3VyY2UucmVwbGFjZShgJSR7IGV4dF9uYW1lIH0lYCwgZXh0X2F0dHJzW2V4dF9uYW1lXSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGludF9hdHRyc1tpbnRfbmFtZV0gPSBzb3VyY2U7XG5cdFx0XHRcdGxvZ2dlci5kZWJ1ZyhgU291cmNlZCBpbnRlcm5hbCBhdHRyaWJ1dGU6ICR7IGludF9uYW1lIH0gPSAkeyBzb3VyY2UgfWApO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gU2VhcmNoIGV4aXN0aW5nIHVzZXIgYnkgaXRzIGV4dGVybmFsIHNlcnZpY2UgaWRcblx0bG9nZ2VyLmRlYnVnKGBMb29raW5nIHVwIHVzZXIgYnkgaWQ6ICR7IHJlc3VsdC51c2VybmFtZSB9YCk7XG5cdGxldCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoeyAnc2VydmljZXMuY2FzLmV4dGVybmFsX2lkJzogcmVzdWx0LnVzZXJuYW1lIH0pO1xuXG5cdGlmICh1c2VyKSB7XG5cdFx0bG9nZ2VyLmRlYnVnKGBVc2luZyBleGlzdGluZyB1c2VyIGZvciAnJHsgcmVzdWx0LnVzZXJuYW1lIH0nIHdpdGggaWQ6ICR7IHVzZXIuX2lkIH1gKTtcblx0XHRpZiAoc3luY19lbmFibGVkKSB7XG5cdFx0XHRsb2dnZXIuZGVidWcoJ1N5bmNpbmcgdXNlciBhdHRyaWJ1dGVzJyk7XG5cdFx0XHQvLyBVcGRhdGUgbmFtZVxuXHRcdFx0aWYgKGludF9hdHRycy5uYW1lKSB7XG5cdFx0XHRcdFJvY2tldENoYXQuX3NldFJlYWxOYW1lKHVzZXIuX2lkLCBpbnRfYXR0cnMubmFtZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFVwZGF0ZSBlbWFpbFxuXHRcdFx0aWYgKGludF9hdHRycy5lbWFpbCkge1xuXHRcdFx0XHRNZXRlb3IudXNlcnMudXBkYXRlKHVzZXIsIHsgJHNldDogeyBlbWFpbHM6IFt7IGFkZHJlc3M6IGludF9hdHRycy5lbWFpbCwgdmVyaWZpZWQ6IHRydWUgfV0gfX0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblxuXHRcdC8vIERlZmluZSBuZXcgdXNlclxuXHRcdGNvbnN0IG5ld1VzZXIgPSB7XG5cdFx0XHR1c2VybmFtZTogcmVzdWx0LnVzZXJuYW1lLFxuXHRcdFx0YWN0aXZlOiB0cnVlLFxuXHRcdFx0Z2xvYmFsUm9sZXM6IFsndXNlciddLFxuXHRcdFx0ZW1haWxzOiBbXSxcblx0XHRcdHNlcnZpY2VzOiB7XG5cdFx0XHRcdGNhczoge1xuXHRcdFx0XHRcdGV4dGVybmFsX2lkOiByZXN1bHQudXNlcm5hbWUsXG5cdFx0XHRcdFx0dmVyc2lvbjogY2FzX3ZlcnNpb24sXG5cdFx0XHRcdFx0YXR0cnM6IGludF9hdHRyc1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIEFkZCBVc2VyLm5hbWVcblx0XHRpZiAoaW50X2F0dHJzLm5hbWUpIHtcblx0XHRcdF8uZXh0ZW5kKG5ld1VzZXIsIHtcblx0XHRcdFx0bmFtZTogaW50X2F0dHJzLm5hbWVcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIEFkZCBlbWFpbFxuXHRcdGlmIChpbnRfYXR0cnMuZW1haWwpIHtcblx0XHRcdF8uZXh0ZW5kKG5ld1VzZXIsIHtcblx0XHRcdFx0ZW1haWxzOiBbeyBhZGRyZXNzOiBpbnRfYXR0cnMuZW1haWwsIHZlcmlmaWVkOiB0cnVlIH1dXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvLyBDcmVhdGUgdGhlIHVzZXJcblx0XHRsb2dnZXIuZGVidWcoYFVzZXIgXCIkeyByZXN1bHQudXNlcm5hbWUgfVwiIGRvZXMgbm90IGV4aXN0IHlldCwgY3JlYXRpbmcgaXRgKTtcblx0XHRjb25zdCB1c2VySWQgPSBBY2NvdW50cy5pbnNlcnRVc2VyRG9jKHt9LCBuZXdVc2VyKTtcblxuXHRcdC8vIEZldGNoIGFuZCB1c2UgaXRcblx0XHR1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodXNlcklkKTtcblx0XHRsb2dnZXIuZGVidWcoYENyZWF0ZWQgbmV3IHVzZXIgZm9yICckeyByZXN1bHQudXNlcm5hbWUgfScgd2l0aCBpZDogJHsgdXNlci5faWQgfWApO1xuXHRcdC8vbG9nZ2VyLmRlYnVnKEpTT04uc3RyaW5naWZ5KHVzZXIsIHVuZGVmaW5lZCwgNCkpO1xuXG5cdFx0bG9nZ2VyLmRlYnVnKGBKb2luaW5nIHVzZXIgdG8gYXR0cmlidXRlIGNoYW5uZWxzOiAkeyBpbnRfYXR0cnMucm9vbXMgfWApO1xuXHRcdGlmIChpbnRfYXR0cnMucm9vbXMpIHtcblx0XHRcdF8uZWFjaChpbnRfYXR0cnMucm9vbXMuc3BsaXQoJywnKSwgZnVuY3Rpb24ocm9vbV9uYW1lKSB7XG5cdFx0XHRcdGlmIChyb29tX25hbWUpIHtcblx0XHRcdFx0XHRsZXQgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWVBbmRUeXBlKHJvb21fbmFtZSwgJ2MnKTtcblx0XHRcdFx0XHRpZiAoIXJvb20pIHtcblx0XHRcdFx0XHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jcmVhdGVXaXRoSWRUeXBlQW5kTmFtZShSYW5kb20uaWQoKSwgJ2MnLCByb29tX25hbWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5hZGRVc2VybmFtZUJ5TmFtZShyb29tX25hbWUsIHJlc3VsdC51c2VybmFtZSk7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5jcmVhdGVXaXRoUm9vbUFuZFVzZXIocm9vbSwgdXNlciwge1xuXHRcdFx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0XHRcdFx0YWxlcnQ6IHRydWUsXG5cdFx0XHRcdFx0XHR1bnJlYWQ6IDEsXG5cdFx0XHRcdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRcdFx0XHRncm91cE1lbnRpb25zOiAwXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9XG5cblx0cmV0dXJuIHsgdXNlcklkOiB1c2VyLl9pZCB9O1xufSk7XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5DcmVkZW50aWFsVG9rZW5zID0gbmV3IGNsYXNzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignY3JlZGVudGlhbF90b2tlbnMnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnZXhwaXJlQXQnOiAxIH0sIHsgc3BhcnNlOiAxLCBleHBpcmVBZnRlclNlY29uZHM6IDAgfSk7XG5cdH1cblxuXHRjcmVhdGUoX2lkLCB1c2VySW5mbykge1xuXHRcdGNvbnN0IHZhbGlkRm9yTWlsbGlzZWNvbmRzID0gNjAwMDA7XHRcdC8vIFZhbGlkIGZvciA2MCBzZWNvbmRzXG5cdFx0Y29uc3QgdG9rZW4gPSB7XG5cdFx0XHRfaWQsXG5cdFx0XHR1c2VySW5mbyxcblx0XHRcdGV4cGlyZUF0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgdmFsaWRGb3JNaWxsaXNlY29uZHMpXG5cdFx0fTtcblxuXHRcdHRoaXMuaW5zZXJ0KHRva2VuKTtcblx0XHRyZXR1cm4gdG9rZW47XG5cdH1cblxuXHRmaW5kT25lQnlJZChfaWQpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZCxcblx0XHRcdGV4cGlyZUF0OiB7ICRndDogbmV3IERhdGUoKSB9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xuXHR9XG59O1xuIl19
