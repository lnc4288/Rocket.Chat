(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Restivus = Package['nimble:restivus'].Restivus;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var result, endpoints, options, routes;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:api":{"server":{"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/api.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

class API extends Restivus {
  constructor(properties) {
    super(properties);
    this.logger = new Logger(`API ${properties.version ? properties.version : 'default'} Logger`, {});
    this.authMethods = [];
    this.fieldSeparator = '.';
    this.defaultFieldsToExclude = {
      joinCode: 0,
      $loki: 0,
      meta: 0,
      members: 0,
      usernames: 0,
      // Please use the `channel/dm/group.members` endpoint. This is disabled for performance reasons
      importIds: 0
    };
    this.limitedUserFieldsToExclude = {
      avatarOrigin: 0,
      emails: 0,
      phone: 0,
      statusConnection: 0,
      createdAt: 0,
      lastLogin: 0,
      services: 0,
      requirePasswordChange: 0,
      requirePasswordChangeReason: 0,
      roles: 0,
      statusDefault: 0,
      _updatedAt: 0,
      customFields: 0
    };

    this._config.defaultOptionsEndpoint = function _defaultOptionsEndpoint() {
      if (this.request.method === 'OPTIONS' && this.request.headers['access-control-request-method']) {
        if (RocketChat.settings.get('API_Enable_CORS') === true) {
          this.response.writeHead(200, {
            'Access-Control-Allow-Origin': RocketChat.settings.get('API_CORS_Origin'),
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, X-User-Id, X-Auth-Token'
          });
        } else {
          this.response.writeHead(405);
          this.response.write('CORS not enabled. Go to "Admin > General > REST Api" to enable it.');
        }
      } else {
        this.response.writeHead(404);
      }

      this.done();
    };
  }

  hasHelperMethods() {
    return RocketChat.API.helperMethods.size !== 0;
  }

  getHelperMethods() {
    return RocketChat.API.helperMethods;
  }

  addAuthMethod(method) {
    this.authMethods.push(method);
  }

  success(result = {}) {
    if (_.isObject(result)) {
      result.success = true;
    }

    return {
      statusCode: 200,
      body: result
    };
  }

  failure(result, errorType) {
    if (_.isObject(result)) {
      result.success = false;
    } else {
      result = {
        success: false,
        error: result
      };

      if (errorType) {
        result.errorType = errorType;
      }
    }

    return {
      statusCode: 400,
      body: result
    };
  }

  notFound(msg) {
    return {
      statusCode: 404,
      body: {
        success: false,
        error: msg ? msg : 'Resource not found'
      }
    };
  }

  unauthorized(msg) {
    return {
      statusCode: 403,
      body: {
        success: false,
        error: msg ? msg : 'unauthorized'
      }
    };
  }

  addRoute(routes, options, endpoints) {
    //Note: required if the developer didn't provide options
    if (typeof endpoints === 'undefined') {
      endpoints = options;
      options = {};
    } //Allow for more than one route using the same option and endpoints


    if (!_.isArray(routes)) {
      routes = [routes];
    }

    routes.forEach(route => {
      //Note: This is required due to Restivus calling `addRoute` in the constructor of itself
      if (this.hasHelperMethods()) {
        Object.keys(endpoints).forEach(method => {
          if (typeof endpoints[method] === 'function') {
            endpoints[method] = {
              action: endpoints[method]
            };
          } //Add a try/catch for each endpoint


          const originalAction = endpoints[method].action;

          endpoints[method].action = function _internalRouteActionHandler() {
            this.logger.debug(`${this.request.method.toUpperCase()}: ${this.request.url}`);
            let result;

            try {
              result = originalAction.apply(this);
            } catch (e) {
              this.logger.debug(`${method} ${route} threw an error:`, e.stack);
              return RocketChat.API.v1.failure(e.message, e.error);
            }

            result = result ? result : RocketChat.API.v1.success();

            if (/(channels|groups)\./.test(route) && result && result.body && result.body.success === true && (result.body.channel || result.body.channels || result.body.group || result.body.groups)) {
              // TODO: Remove this after three versions have been released. That means at 0.64 this should be gone. ;)
              result.body.developerWarning = '[WARNING]: The "usernames" field has been removed for performance reasons. Please use the "*.members" endpoint to get a list of members/users in a room.';
            }

            return result;
          };

          for (const [name, helperMethod] of this.getHelperMethods()) {
            endpoints[method][name] = helperMethod;
          } //Allow the endpoints to make usage of the logger which respects the user's settings


          endpoints[method].logger = this.logger;
        });
      }

      super.addRoute(route, options, endpoints);
    });
  }

  _initAuth() {
    const loginCompatibility = bodyParams => {
      // Grab the username or email that the user is logging in with
      const {
        user,
        username,
        email,
        password,
        code
      } = bodyParams;

      if (password == null) {
        return bodyParams;
      }

      if (_.without(Object.keys(bodyParams), 'user', 'username', 'email', 'password', 'code').length > 0) {
        return bodyParams;
      }

      const auth = {
        password
      };

      if (typeof user === 'string') {
        auth.user = user.includes('@') ? {
          email: user
        } : {
          username: user
        };
      } else if (username) {
        auth.user = {
          username
        };
      } else if (email) {
        auth.user = {
          email
        };
      }

      if (auth.user == null) {
        return bodyParams;
      }

      if (auth.password.hashed) {
        auth.password = {
          digest: auth.password,
          algorithm: 'sha-256'
        };
      }

      if (code) {
        return {
          totp: {
            code,
            login: auth
          }
        };
      }

      return auth;
    };

    const self = this;
    this.addRoute('login', {
      authRequired: false
    }, {
      post() {
        const args = loginCompatibility(this.bodyParams);
        const invocation = new DDPCommon.MethodInvocation({
          connection: {
            close() {}

          }
        });
        let auth;

        try {
          auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('login', args));
        } catch (error) {
          let e = error;

          if (error.reason === 'User not found') {
            e = {
              error: 'Unauthorized',
              reason: 'Unauthorized'
            };
          }

          return {
            statusCode: 401,
            body: {
              status: 'error',
              error: e.error,
              message: e.reason || e.message
            }
          };
        }

        this.user = Meteor.users.findOne({
          _id: auth.id
        });
        this.userId = this.user._id; // Remove tokenExpires to keep the old behavior

        Meteor.users.update({
          _id: this.user._id,
          'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(auth.token)
        }, {
          $unset: {
            'services.resume.loginTokens.$.when': 1
          }
        });
        const response = {
          status: 'success',
          data: {
            userId: this.userId,
            authToken: auth.token
          }
        };

        const extraData = self._config.onLoggedIn && self._config.onLoggedIn.call(this);

        if (extraData != null) {
          _.extend(response.data, {
            extra: extraData
          });
        }

        return response;
      }

    });

    const logout = function () {
      // Remove the given auth token from the user's account
      const authToken = this.request.headers['x-auth-token'];

      const hashedToken = Accounts._hashLoginToken(authToken);

      const tokenLocation = self._config.auth.token;
      const index = tokenLocation.lastIndexOf('.');
      const tokenPath = tokenLocation.substring(0, index);
      const tokenFieldName = tokenLocation.substring(index + 1);
      const tokenToRemove = {};
      tokenToRemove[tokenFieldName] = hashedToken;
      const tokenRemovalQuery = {};
      tokenRemovalQuery[tokenPath] = tokenToRemove;
      Meteor.users.update(this.user._id, {
        $pull: tokenRemovalQuery
      });
      const response = {
        status: 'success',
        data: {
          message: 'You\'ve been logged out!'
        }
      }; // Call the logout hook with the authenticated user attached

      const extraData = self._config.onLoggedOut && self._config.onLoggedOut.call(this);

      if (extraData != null) {
        _.extend(response.data, {
          extra: extraData
        });
      }

      return response;
    };
    /*
    	Add a logout endpoint to the API
    	After the user is logged out, the onLoggedOut hook is called (see Restfully.configure() for
    	adding hook).
    */


    return this.addRoute('logout', {
      authRequired: true
    }, {
      get() {
        console.warn('Warning: Default logout via GET will be removed in Restivus v1.0. Use POST instead.');
        console.warn('    See https://github.com/kahmali/meteor-restivus/issues/100');
        return logout.call(this);
      },

      post: logout
    });
  }

}

const getUserAuth = function _getUserAuth() {
  const invalidResults = [undefined, null, false];
  return {
    token: 'services.resume.loginTokens.hashedToken',

    user() {
      if (this.bodyParams && this.bodyParams.payload) {
        this.bodyParams = JSON.parse(this.bodyParams.payload);
      }

      for (let i = 0; i < RocketChat.API.v1.authMethods.length; i++) {
        const method = RocketChat.API.v1.authMethods[i];

        if (typeof method === 'function') {
          const result = method.apply(this, arguments);

          if (!invalidResults.includes(result)) {
            return result;
          }
        }
      }

      let token;

      if (this.request.headers['x-auth-token']) {
        token = Accounts._hashLoginToken(this.request.headers['x-auth-token']);
      }

      return {
        userId: this.request.headers['x-user-id'],
        token
      };
    }

  };
};

RocketChat.API = {
  helperMethods: new Map(),
  getUserAuth,
  ApiClass: API
};

const createApi = function _createApi(enableCors) {
  if (!RocketChat.API.v1 || RocketChat.API.v1._config.enableCors !== enableCors) {
    RocketChat.API.v1 = new API({
      version: 'v1',
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }

  if (!RocketChat.API.default || RocketChat.API.default._config.enableCors !== enableCors) {
    RocketChat.API.default = new API({
      useDefaultAuth: true,
      prettyJson: process.env.NODE_ENV === 'development',
      enableCors,
      auth: getUserAuth()
    });
  }
}; // register the API to be re-created once the CORS-setting changes.


RocketChat.settings.get('API_Enable_CORS', (key, value) => {
  createApi(value);
}); // also create the API immediately

createApi(!!RocketChat.settings.get('API_Enable_CORS'));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/settings.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('REST API', function () {
    this.add('API_Upper_Count_Limit', 100, {
      type: 'int',
      public: false
    });
    this.add('API_Default_Count', 50, {
      type: 'int',
      public: false
    });
    this.add('API_Allow_Infinite_Count', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Direct_Message_History_EndPoint', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_Enable_Shields', true, {
      type: 'boolean',
      public: false
    });
    this.add('API_Shield_Types', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_Shields',
        value: true
      }
    });
    this.add('API_Enable_CORS', false, {
      type: 'boolean',
      public: false
    });
    this.add('API_CORS_Origin', '*', {
      type: 'string',
      public: false,
      enableQuery: {
        _id: 'API_Enable_CORS',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"requestParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/requestParams.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('requestParams', function _requestParams() {
  return ['POST', 'PUT'].includes(this.request.method) ? this.bodyParams : this.queryParams;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPaginationItems.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getPaginationItems.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// If the count query param is higher than the "API_Upper_Count_Limit" setting, then we limit that
// If the count query param isn't defined, then we set it to the "API_Default_Count" setting
// If the count is zero, then that means unlimited and is only allowed if the setting "API_Allow_Infinite_Count" is true
RocketChat.API.helperMethods.set('getPaginationItems', function _getPaginationItems() {
  const hardUpperLimit = RocketChat.settings.get('API_Upper_Count_Limit') <= 0 ? 100 : RocketChat.settings.get('API_Upper_Count_Limit');
  const defaultCount = RocketChat.settings.get('API_Default_Count') <= 0 ? 50 : RocketChat.settings.get('API_Default_Count');
  const offset = this.queryParams.offset ? parseInt(this.queryParams.offset) : 0;
  let count = defaultCount; // Ensure count is an appropiate amount

  if (typeof this.queryParams.count !== 'undefined') {
    count = parseInt(this.queryParams.count);
  } else {
    count = defaultCount;
  }

  if (count > hardUpperLimit) {
    count = hardUpperLimit;
  }

  if (count === 0 && !RocketChat.settings.get('API_Allow_Infinite_Count')) {
    count = defaultCount;
  }

  return {
    offset,
    count
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getUserFromParams.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//Convenience method, almost need to turn it into a middleware of sorts
RocketChat.API.helperMethods.set('getUserFromParams', function _getUserFromParams() {
  const doesntExist = {
    _doesntExist: true
  };
  let user;
  const params = this.requestParams();

  if (params.userId && params.userId.trim()) {
    user = RocketChat.models.Users.findOneById(params.userId) || doesntExist;
  } else if (params.username && params.username.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.username) || doesntExist;
  } else if (params.user && params.user.trim()) {
    user = RocketChat.models.Users.findOneByUsername(params.user) || doesntExist;
  } else {
    throw new Meteor.Error('error-user-param-not-provided', 'The required "userId" or "username" param was not provided');
  }

  if (user._doesntExist) {
    throw new Meteor.Error('error-invalid-user', 'The required "userId" or "username" param provided does not match any users');
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"isUserFromParams.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/isUserFromParams.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('isUserFromParams', function _isUserFromParams() {
  const params = this.requestParams();
  return !params.userId && !params.username && !params.user || params.userId && this.userId === params.userId || params.username && this.user.username === params.username || params.user && this.user.username === params.user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"parseJsonQuery.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/parseJsonQuery.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
  let sort;

  if (this.queryParams.sort) {
    try {
      sort = JSON.parse(this.queryParams.sort);
    } catch (e) {
      this.logger.warn(`Invalid sort parameter provided "${this.queryParams.sort}":`, e);
      throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${this.queryParams.sort}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  }

  let fields;

  if (this.queryParams.fields) {
    try {
      fields = JSON.parse(this.queryParams.fields);
    } catch (e) {
      this.logger.warn(`Invalid fields parameter provided "${this.queryParams.fields}":`, e);
      throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${this.queryParams.fields}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user's selected fields only contains ones which their role allows


  if (typeof fields === 'object') {
    let nonSelectableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
      nonSelectableFields = nonSelectableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
    }

    Object.keys(fields).forEach(k => {
      if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete fields[k];
      }
    });
  } // Limit the fields by default


  fields = Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude);

  if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
    fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExclude);
  }

  let query;

  if (this.queryParams.query) {
    try {
      query = JSON.parse(this.queryParams.query);
    } catch (e) {
      this.logger.warn(`Invalid query parameter provided "${this.queryParams.query}":`, e);
      throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${this.queryParams.query}"`, {
        helperMethod: 'parseJsonQuery'
      });
    }
  } // Verify the user has permission to query the fields they are


  if (typeof query === 'object') {
    let nonQuerableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);

    if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
      nonQuerableFields = nonQuerableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
    }

    Object.keys(query).forEach(k => {
      if (nonQuerableFields.includes(k) || nonQuerableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
        delete query[k];
      }
    });
  }

  return {
    sort,
    fields,
    query
  };
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getLoggedInUser.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/helpers/getLoggedInUser.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.helperMethods.set('getLoggedInUser', function _getLoggedInUser() {
  let user;

  if (this.request.headers['x-auth-token'] && this.request.headers['x-user-id']) {
    user = RocketChat.models.Users.findOne({
      '_id': this.request.headers['x-user-id'],
      'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(this.request.headers['x-auth-token'])
    });
  }

  return user;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"default":{"info.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/info.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      version: RocketChat.Info.version
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"metrics.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/default/metrics.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.default.addRoute('metrics', {
  authRequired: false
}, {
  get() {
    return {
      headers: {
        'Content-Type': 'text/plain'
      },
      body: RocketChat.promclient.register.metrics()
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"v1":{"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/channels.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _extends = require("@babel/runtime/helpers/builtin/extends");

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the channel IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findChannelByIdOrName({
  params,
  checkedArchived = true,
  returnUsernames = false
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  const fields = _extends({}, RocketChat.API.v1.defaultFieldsToExclude);

  if (returnUsernames) {
    delete fields.usernames;
  }

  let room;

  if (params.roomId) {
    room = RocketChat.models.Rooms.findOneById(params.roomId, {
      fields
    });
  } else if (params.roomName) {
    room = RocketChat.models.Rooms.findOneByName(params.roomName, {
      fields
    });
  }

  if (!room || room.t !== 'c') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
  }

  if (checkedArchived && room.archived) {
    throw new Meteor.Error('error-room-archived', `The channel, ${room.name}, is archived`);
  }

  return room;
}

RocketChat.API.v1.addRoute('channels.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult._id, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.cleanHistory', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (!this.bodyParams.latest) {
      return RocketChat.API.v1.failure('Body parameter "latest" is required.');
    }

    if (!this.bodyParams.oldest) {
      return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
    }

    const latest = new Date(this.bodyParams.latest);
    const oldest = new Date(this.bodyParams.oldest);
    let inclusive = false;

    if (typeof this.bodyParams.inclusive !== 'undefined') {
      inclusive = this.bodyParams.inclusive;
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('cleanChannelHistory', {
        roomId: findResult._id,
        latest,
        oldest,
        inclusive
      });
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.close', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}.`);
    }

    if (!sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

}); // Channel -> create

function createChannelValidator(params) {
  if (!RocketChat.authz.hasPermission(params.user.value, 'create-c')) {
    throw new Error('unauthorized');
  }

  if (!params.name || !params.name.value) {
    throw new Error(`Param "${params.name.key}" is required`);
  }

  if (params.members && params.members.value && !_.isArray(params.members.value)) {
    throw new Error(`Param "${params.members.key}" must be an array if provided`);
  }

  if (params.customFields && params.customFields.value && !(typeof params.customFields.value === 'object')) {
    throw new Error(`Param "${params.customFields.key}" must be an object if provided`);
  }
}

function createChannel(userId, params) {
  let readOnly = false;

  if (typeof params.readOnly !== 'undefined') {
    readOnly = params.readOnly;
  }

  let id;
  Meteor.runAsUser(userId, () => {
    id = Meteor.call('createChannel', params.name, params.members ? params.members : [], readOnly, params.customFields);
  });
  return {
    channel: RocketChat.models.Rooms.findOneById(id.rid, {
      fields: RocketChat.API.v1.defaultFieldsToExclude
    })
  };
}

RocketChat.API.channels = {};
RocketChat.API.channels.create = {
  validate: createChannelValidator,
  execute: createChannel
};
RocketChat.API.v1.addRoute('channels.create', {
  authRequired: true
}, {
  post() {
    const userId = this.userId;
    const bodyParams = this.bodyParams;
    let error;

    try {
      RocketChat.API.channels.create.validate({
        user: {
          value: userId
        },
        name: {
          value: bodyParams.name,
          key: 'name'
        },
        members: {
          value: bodyParams.members,
          key: 'members'
        }
      });
    } catch (e) {
      if (e.message === 'unauthorized') {
        error = RocketChat.API.v1.unauthorized();
      } else {
        error = RocketChat.API.v1.failure(e.message);
      }
    }

    if (error) {
      return error;
    }

    return RocketChat.API.v1.success(RocketChat.API.channels.create.execute(userId, bodyParams));
  }

});
RocketChat.API.v1.addRoute('channels.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: findResult
    });
  }

});
RocketChat.API.v1.addRoute('channels.files', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('canAccessRoom', findResult._id, this.userId);
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files,
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let includeAllPublicChannels = true;

    if (typeof this.queryParams.includeAllPublicChannels !== 'undefined') {
      includeAllPublicChannels = this.queryParams.includeAllPublicChannels === 'true';
    }

    let ourQuery = {
      channel: `#${findResult.name}`
    };

    if (includeAllPublicChannels) {
      ourQuery.channel = {
        $in: [ourQuery.channel, 'all_public_channels']
      };
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    ourQuery = Object.assign({}, query, ourQuery);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.history', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('channels.info', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.join', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('joinRoom', findResult._id, this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult._id,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult._id);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.list', {
  authRequired: true
}, {
  get: {
    //This is defined as such only to provide an example of how the routes can be defined :X
    action() {
      const {
        offset,
        count
      } = this.getPaginationItems();
      const {
        sort,
        fields,
        query
      } = this.parseJsonQuery();
      const hasPermissionToSeeAllPublicChannels = RocketChat.authz.hasPermission(this.userId, 'view-c-room');
      const ourQuery = Object.assign({}, query, {
        t: 'c'
      });

      if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !hasPermissionToSeeAllPublicChannels) {
        ourQuery.usernames = {
          $in: [this.user.username]
        };
      } else if (!hasPermissionToSeeAllPublicChannels) {
        return RocketChat.API.v1.unauthorized();
      }

      const rooms = RocketChat.models.Rooms.find(ourQuery, {
        sort: sort ? sort : {
          name: 1
        },
        skip: offset,
        limit: count,
        fields
      }).fetch();
      return RocketChat.API.v1.success({
        channels: rooms,
        count: rooms.length,
        offset,
        total: RocketChat.models.Rooms.find(ourQuery).count()
      });
    }

  }
});
RocketChat.API.v1.addRoute('channels.list.joined', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      channels: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('channels.members', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false,
      returnUsernames: true
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    let sortFn = (a, b) => a > b;

    if (Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1) {
      sortFn = (a, b) => b < a;
    }

    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.usernames).sort(sortFn), {
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('channels.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult._id
    }); //Special check for the permissions

    if (RocketChat.authz.hasPermission(this.userId, 'view-joined-room') && !findResult.usernames.includes(this.user.username)) {
      return RocketChat.API.v1.unauthorized();
    } else if (!RocketChat.authz.hasPermission(this.userId, 'view-c-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('channels.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'c'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Channel does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('channels.open', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });
    const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(findResult._id, this.userId);

    if (!sub) {
      return RocketChat.API.v1.failure(`The user/callee is not in the channel "${findResult.name}".`);
    }

    if (sub.open) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is already open to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult._id, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('channels.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findChannelByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      }
    });

    if (findResult.name === this.bodyParams.name) {
      return RocketChat.API.v1.failure('The channel name is the same as what it would be renamed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.description) {
      return RocketChat.API.v1.failure('The channel description is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('channels.setJoinCode', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.joinCode || !this.bodyParams.joinCode.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "joinCode" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'joinCode', this.bodyParams.joinCode);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.description === this.bodyParams.purpose) {
      return RocketChat.API.v1.failure('The channel purpose (description) is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('channels.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The channel read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.topic === this.bodyParams.topic) {
      return RocketChat.API.v1.failure('The channel topic is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('channels.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findChannelByIdOrName({
      params: this.requestParams()
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The channel type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult._id, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      channel: RocketChat.models.Rooms.findOneById(findResult._id, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('channels.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findChannelByIdOrName({
      params: this.requestParams(),
      checkedArchived: false
    });

    if (!findResult.archived) {
      return RocketChat.API.v1.failure(`The channel, ${findResult.name}, is not archived`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult._id);
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/rooms.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 0);
RocketChat.API.v1.addRoute('rooms.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('rooms/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('rooms.upload/:rid', {
  authRequired: true
}, {
  post() {
    const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

    if (!room) {
      return RocketChat.API.v1.unauthorized();
    }

    const busboy = new Busboy({
      headers: this.request.headers
    });
    const files = [];
    const fields = {};
    Meteor.wrapAsync(callback => {
      busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname !== 'file') {
          return files.push(new Meteor.Error('invalid-field'));
        }

        const fileDate = [];
        file.on('data', data => fileDate.push(data));
        file.on('end', () => {
          files.push({
            fieldname,
            file,
            filename,
            encoding,
            mimetype,
            fileBuffer: Buffer.concat(fileDate)
          });
        });
      });
      busboy.on('field', (fieldname, value) => fields[fieldname] = value);
      busboy.on('finish', Meteor.bindEnvironment(() => callback()));
      this.request.pipe(busboy);
    })();

    if (files.length === 0) {
      return RocketChat.API.v1.failure('File required');
    }

    if (files.length > 1) {
      return RocketChat.API.v1.failure('Just 1 file is allowed');
    }

    const file = files[0];
    const fileStore = FileUpload.getStore('Uploads');
    const details = {
      name: file.filename,
      size: file.fileBuffer.length,
      type: file.mimetype,
      rid: this.urlParams.rid
    };
    Meteor.runAsUser(this.userId, () => {
      const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
      uploadedFile.description = fields.description;
      delete fields.description;
      RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/subscriptions.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('subscriptions.get', {
  authRequired: true
}, {
  get() {
    const {
      updatedSince
    } = this.queryParams;
    let updatedSinceDate;

    if (updatedSince) {
      if (isNaN(Date.parse(updatedSince))) {
        throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
      } else {
        updatedSinceDate = new Date(updatedSince);
      }
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('subscriptions/get', updatedSinceDate));

    if (Array.isArray(result)) {
      result = {
        update: result,
        remove: []
      };
    }

    return RocketChat.API.v1.success(result);
  }

});
/**
	This API is suppose to mark any room as read.

	Method: POST
	Route: api/v1/subscriptions.read
	Params:
		- rid: The rid of the room to be marked as read.
 */

RocketChat.API.v1.addRoute('subscriptions.read', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      rid: String
    });
    Meteor.runAsUser(this.userId, () => Meteor.call('readMessages', this.bodyParams.rid));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chat.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/chat.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global processWebhookMessage */
RocketChat.API.v1.addRoute('chat.delete', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      msgId: String,
      roomId: String,
      asUser: Match.Maybe(Boolean)
    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId, {
      fields: {
        u: 1,
        rid: 1
      }
    });

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    }

    if (this.bodyParams.asUser && msg.u._id !== this.userId && !RocketChat.authz.hasPermission(Meteor.userId(), 'force-delete-message', msg.rid)) {
      return RocketChat.API.v1.failure('Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.');
    }

    Meteor.runAsUser(this.bodyParams.asUser ? msg.u._id : this.userId, () => {
      Meteor.call('deleteMessage', {
        _id: msg._id
      });
    });
    return RocketChat.API.v1.success({
      _id: msg._id,
      ts: Date.now(),
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.syncMessages', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      lastUpdate
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!lastUpdate) {
      throw new Meteor.Error('error-lastUpdate-param-not-provided', 'The required "lastUpdate" query param is missing.');
    } else if (isNaN(Date.parse(lastUpdate))) {
      throw new Meteor.Error('error-roomId-param-invalid', 'The "lastUpdate" query parameter must be a valid date.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('messages/get', roomId, {
        lastUpdate: new Date(lastUpdate)
      });
    });

    if (!result) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      result
    });
  }

});
RocketChat.API.v1.addRoute('chat.getMessage', {
  authRequired: true
}, {
  get() {
    if (!this.queryParams.msgId) {
      return RocketChat.API.v1.failure('The "msgId" query parameter must be provided.');
    }

    let msg;
    Meteor.runAsUser(this.userId, () => {
      msg = Meteor.call('getSingleMessage', this.queryParams.msgId);
    });

    if (!msg) {
      return RocketChat.API.v1.failure();
    }

    return RocketChat.API.v1.success({
      message: msg
    });
  }

});
RocketChat.API.v1.addRoute('chat.pinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    let pinnedMessage;
    Meteor.runAsUser(this.userId, () => pinnedMessage = Meteor.call('pinMessage', msg));
    return RocketChat.API.v1.success({
      message: pinnedMessage
    });
  }

});
RocketChat.API.v1.addRoute('chat.postMessage', {
  authRequired: true
}, {
  post() {
    const messageReturn = processWebhookMessage(this.bodyParams, this.user, undefined, true)[0];

    if (!messageReturn) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    return RocketChat.API.v1.success({
      ts: Date.now(),
      channel: messageReturn.channel,
      message: messageReturn.message
    });
  }

});
RocketChat.API.v1.addRoute('chat.search', {
  authRequired: true
}, {
  get() {
    const {
      roomId,
      searchText,
      limit
    } = this.queryParams;

    if (!roomId) {
      throw new Meteor.Error('error-roomId-param-not-provided', 'The required "roomId" query param is missing.');
    }

    if (!searchText) {
      throw new Meteor.Error('error-searchText-param-not-provided', 'The required "searchText" query param is missing.');
    }

    if (limit && (typeof limit !== 'number' || isNaN(limit) || limit <= 0)) {
      throw new Meteor.Error('error-limit-param-invalid', 'The "limit" query parameter must be a valid number and be greater than 0.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('messageSearch', searchText, roomId, limit));
    return RocketChat.API.v1.success({
      messages: result.messages
    });
  }

}); // The difference between `chat.postMessage` and `chat.sendMessage` is that `chat.sendMessage` allows
// for passing a value for `_id` and the other one doesn't. Also, `chat.sendMessage` only sends it to
// one channel whereas the other one allows for sending to more than one channel at a time.

RocketChat.API.v1.addRoute('chat.sendMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.message) {
      throw new Meteor.Error('error-invalid-params', 'The "message" parameter must be provided.');
    }

    let message;
    Meteor.runAsUser(this.userId, () => message = Meteor.call('sendMessage', this.bodyParams.message));
    return RocketChat.API.v1.success({
      message
    });
  }

});
RocketChat.API.v1.addRoute('chat.starMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: true
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unPinMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('unpinMessage', msg));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.unStarMessage', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is required.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    Meteor.runAsUser(this.userId, () => Meteor.call('starMessage', {
      _id: msg._id,
      rid: msg.rid,
      starred: false
    }));
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('chat.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      roomId: String,
      msgId: String,
      text: String //Using text to be consistant with chat.postMessage

    }));
    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.msgId); //Ensure the message exists

    if (!msg) {
      return RocketChat.API.v1.failure(`No message found with the id of "${this.bodyParams.msgId}".`);
    }

    if (this.bodyParams.roomId !== msg.rid) {
      return RocketChat.API.v1.failure('The room id provided does not match where the message is from.');
    } //Permission checks are already done in the updateMessage method, so no need to duplicate them


    Meteor.runAsUser(this.userId, () => {
      Meteor.call('updateMessage', {
        _id: msg._id,
        msg: this.bodyParams.text,
        rid: msg.rid
      });
    });
    return RocketChat.API.v1.success({
      message: RocketChat.models.Messages.findOneById(msg._id)
    });
  }

});
RocketChat.API.v1.addRoute('chat.react', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.messageId || !this.bodyParams.messageId.trim()) {
      throw new Meteor.Error('error-messageid-param-not-provided', 'The required "messageId" param is missing.');
    }

    const msg = RocketChat.models.Messages.findOneById(this.bodyParams.messageId);

    if (!msg) {
      throw new Meteor.Error('error-message-not-found', 'The provided "messageId" does not match any existing message.');
    }

    const emoji = this.bodyParams.emoji;
    Meteor.runAsUser(this.userId, () => Meteor.call('setReaction', emoji, msg._id));
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/commands.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('commands.get', {
  authRequired: true
}, {
  get() {
    const params = this.queryParams;

    if (typeof params.command !== 'string') {
      return RocketChat.API.v1.failure('The query param "command" must be provided.');
    }

    const cmd = RocketChat.slashCommands.commands[params.command.toLowerCase()];

    if (!cmd) {
      return RocketChat.API.v1.failure(`There is no command in the system by the name of: ${params.command}`);
    }

    return RocketChat.API.v1.success({
      command: cmd
    });
  }

});
RocketChat.API.v1.addRoute('commands.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let commands = Object.values(RocketChat.slashCommands.commands);

    if (query && query.command) {
      commands = commands.filter(command => command.command === query.command);
    }

    const totalCount = commands.length;
    commands = RocketChat.models.Rooms.processQueryOptionsOnResult(commands, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      commands,
      offset,
      count: commands.length,
      total: totalCount
    });
  }

}); // Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value' }

RocketChat.API.v1.addRoute('commands.run', {
  authRequired: true
}, {
  post() {
    const body = this.bodyParams;
    const user = this.getLoggedInUser();

    if (typeof body.command !== 'string') {
      return RocketChat.API.v1.failure('You must provide a command to run.');
    }

    if (body.params && typeof body.params !== 'string') {
      return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
    }

    if (typeof body.roomId !== 'string') {
      return RocketChat.API.v1.failure('The room\'s id where to execute this command must provided and be a string.');
    }

    const cmd = body.command.toLowerCase();

    if (!RocketChat.slashCommands.commands[body.command.toLowerCase()]) {
      return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
    } // This will throw an error if they can't or the room is invalid


    Meteor.call('canAccessRoom', body.roomId, user._id);
    const params = body.params ? body.params : '';
    let result;
    Meteor.runAsUser(user._id, () => {
      result = RocketChat.slashCommands.run(cmd, params, {
        _id: Random.id(),
        rid: body.roomId,
        msg: `/${cmd} ${params}`
      });
    });
    return RocketChat.API.v1.success({
      result
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"groups.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/groups.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

//Returns the private group subscription IF found otherwise it will return the failure of why it didn't. Check the `statusCode` property
function findPrivateGroupByIdOrName({
  params,
  userId,
  checkedArchived = true
}) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'The parameter "roomId" or "roomName" is required');
  }

  let roomSub;

  if (params.roomId) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(params.roomId, userId);
  } else if (params.roomName) {
    roomSub = RocketChat.models.Subscriptions.findOneByRoomNameAndUserId(params.roomName, userId);
  }

  if (!roomSub || roomSub.t !== 'p') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any group');
  }

  if (checkedArchived && roomSub.archived) {
    throw new Meteor.Error('error-room-archived', `The private group, ${roomSub.name}, is archived`);
  }

  return roomSub;
}

RocketChat.API.v1.addRoute('groups.addAll', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addAllUserToRoom', findResult.rid, this.bodyParams.activeUsersOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.addModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.addLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

}); //Archives a private group only if it wasn't

RocketChat.API.v1.addRoute('groups.archive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('archiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.close', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (!findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //Create Private Group

RocketChat.API.v1.addRoute('groups.create', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'create-p')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.bodyParams.name) {
      return RocketChat.API.v1.failure('Body param "name" is required');
    }

    if (this.bodyParams.members && !_.isArray(this.bodyParams.members)) {
      return RocketChat.API.v1.failure('Body param "members" must be an array if provided');
    }

    if (this.bodyParams.customFields && !(typeof this.bodyParams.customFields === 'object')) {
      return RocketChat.API.v1.failure('Body param "customFields" must be an object if provided');
    }

    let readOnly = false;

    if (typeof this.bodyParams.readOnly !== 'undefined') {
      readOnly = this.bodyParams.readOnly;
    }

    let id;
    Meteor.runAsUser(this.userId, () => {
      id = Meteor.call('createPrivateGroup', this.bodyParams.name, this.bodyParams.members ? this.bodyParams.members : [], readOnly, this.bodyParams.customFields);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(id.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.delete', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('eraseRoom', findResult.rid);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.processQueryOptionsOnResult([findResult._room], {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })[0]
    });
  }

});
RocketChat.API.v1.addRoute('groups.files', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files,
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.getIntegrations', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let includeAllPrivateGroups = true;

    if (typeof this.queryParams.includeAllPrivateGroups !== 'undefined') {
      includeAllPrivateGroups = this.queryParams.includeAllPrivateGroups === 'true';
    }

    const channelsToSearch = [`#${findResult.name}`];

    if (includeAllPrivateGroups) {
      channelsToSearch.push('all_private_groups');
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      channel: {
        $in: channelsToSearch
      }
    });
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        _createdAt: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      count: integrations.length,
      offset,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.history', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.rid,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute('groups.info', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.invite', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('addUserToRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.kick', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeUserFromRoom', {
        rid: findResult.rid,
        username: user.username
      });
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.leave', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('leaveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

}); //List Private Groups a user has access to

RocketChat.API.v1.addRoute('groups.list', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.listAll', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    let rooms = RocketChat.models.Rooms.find(ourQuery).fetch();
    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      groups: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute('groups.members', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();

    let sortFn = (a, b) => a > b;

    if (Match.test(sort, Object) && Match.test(sort.username, Number) && sort.username === -1) {
      sortFn = (a, b) => b < a;
    }

    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult._room.usernames).sort(sortFn), {
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      },
      sort: sort ? sort : {
        username: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult._room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute('groups.messages', {
  authRequired: true
}, {
  get() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.rid
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('groups.online', {
  authRequired: true
}, {
  get() {
    const {
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'p'
    });
    const room = RocketChat.models.Rooms.findOne(ourQuery);

    if (room == null) {
      return RocketChat.API.v1.failure('Group does not exists');
    }

    const online = RocketChat.models.Users.findUsersNotOffline({
      fields: {
        username: 1
      }
    }).fetch();
    const onlineInRoom = [];
    online.forEach(user => {
      if (room.usernames.indexOf(user.username) !== -1) {
        onlineInRoom.push({
          _id: user._id,
          username: user.username
        });
      }
    });
    return RocketChat.API.v1.success({
      online: onlineInRoom
    });
  }

});
RocketChat.API.v1.addRoute('groups.open', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });

    if (findResult.open) {
      return RocketChat.API.v1.failure(`The private group, ${findResult.name}, is already open for the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('openRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeModerator', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomModerator', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeOwner', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomOwner', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.removeLeader', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('removeRoomLeader', findResult.rid, user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('groups.rename', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.name || !this.bodyParams.name.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "name" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: {
        roomId: this.bodyParams.roomId
      },
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomName', this.bodyParams.name);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setDescription', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.description || !this.bodyParams.description.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "description" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.description);
    });
    return RocketChat.API.v1.success({
      description: this.bodyParams.description
    });
  }

});
RocketChat.API.v1.addRoute('groups.setPurpose', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.purpose || !this.bodyParams.purpose.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "purpose" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomDescription', this.bodyParams.purpose);
    });
    return RocketChat.API.v1.success({
      purpose: this.bodyParams.purpose
    });
  }

});
RocketChat.API.v1.addRoute('groups.setReadOnly', {
  authRequired: true
}, {
  post() {
    if (typeof this.bodyParams.readOnly === 'undefined') {
      return RocketChat.API.v1.failure('The bodyParam "readOnly" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.ro === this.bodyParams.readOnly) {
      return RocketChat.API.v1.failure('The private group read only setting is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'readOnly', this.bodyParams.readOnly);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.setTopic', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
RocketChat.API.v1.addRoute('groups.setType', {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.type || !this.bodyParams.type.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "type" is required');
    }

    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId
    });

    if (findResult.t === this.bodyParams.type) {
      return RocketChat.API.v1.failure('The private group type is the same as what it would be changed to.');
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.rid, 'roomType', this.bodyParams.type);
    });
    return RocketChat.API.v1.success({
      group: RocketChat.models.Rooms.findOneById(findResult.rid, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('groups.unarchive', {
  authRequired: true
}, {
  post() {
    const findResult = findPrivateGroupByIdOrName({
      params: this.requestParams(),
      userId: this.userId,
      checkedArchived: false
    });
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('unarchiveRoom', findResult.rid);
    });
    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"im.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/im.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

function findDirectMessageRoom(params, user) {
  if ((!params.roomId || !params.roomId.trim()) && (!params.username || !params.username.trim())) {
    throw new Meteor.Error('error-room-param-not-provided', 'Body param "roomId" or "username" is required');
  }

  const room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
    currentUserId: user._id,
    nameOrId: params.username || params.roomId,
    type: 'd'
  });

  if (!room || room.t !== 'd') {
    throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "username" param provided does not match any dirct message');
  }

  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);
  return {
    room,
    subscription
  };
}

RocketChat.API.v1.addRoute(['dm.create', 'im.create'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    return RocketChat.API.v1.success({
      room: findResult.room
    });
  }

});
RocketChat.API.v1.addRoute(['dm.close', 'im.close'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      return RocketChat.API.v1.failure(`The direct message room, ${this.bodyParams.name}, is already closed to the sender`);
    }

    Meteor.runAsUser(this.userId, () => {
      Meteor.call('hideRoom', findResult.room._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.files', 'im.files'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const files = RocketChat.models.Uploads.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      files,
      count: files.length,
      offset,
      total: RocketChat.models.Uploads.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.history', 'im.history'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    let latestDate = new Date();

    if (this.queryParams.latest) {
      latestDate = new Date(this.queryParams.latest);
    }

    let oldestDate = undefined;

    if (this.queryParams.oldest) {
      oldestDate = new Date(this.queryParams.oldest);
    }

    let inclusive = false;

    if (this.queryParams.inclusive) {
      inclusive = this.queryParams.inclusive;
    }

    let count = 20;

    if (this.queryParams.count) {
      count = parseInt(this.queryParams.count);
    }

    let unreads = false;

    if (this.queryParams.unreads) {
      unreads = this.queryParams.unreads;
    }

    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getChannelHistory', {
        rid: findResult.room._id,
        latest: latestDate,
        oldest: oldestDate,
        inclusive,
        count,
        unreads
      });
    });

    if (!result) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(result);
  }

});
RocketChat.API.v1.addRoute(['dm.members', 'im.members'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort
    } = this.parseJsonQuery();
    const members = RocketChat.models.Rooms.processQueryOptionsOnResult(Array.from(findResult.room.usernames), {
      sort: sort ? sort : -1,
      skip: offset,
      limit: count
    });
    const users = RocketChat.models.Users.find({
      username: {
        $in: members
      }
    }, {
      fields: {
        _id: 1,
        username: 1,
        name: 1,
        status: 1,
        utcOffset: 1
      }
    }).fetch();
    return RocketChat.API.v1.success({
      members: users,
      count: members.length,
      offset,
      total: findResult.room.usernames.length
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages', 'im.messages'], {
  authRequired: true
}, {
  get() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    console.log(findResult);
    const ourQuery = Object.assign({}, query, {
      rid: findResult.room._id
    });
    const messages = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages,
      count: messages.length,
      offset,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.messages.others', 'im.messages.others'], {
  authRequired: true
}, {
  get() {
    if (RocketChat.settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/im.messages.others'
      });
    }

    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const roomId = this.queryParams.roomId;

    if (!roomId || !roomId.trim()) {
      throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'd') {
      throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${roomId}`);
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      rid: room._id
    });
    const msgs = RocketChat.models.Messages.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      messages: msgs,
      offset,
      count: msgs.length,
      total: RocketChat.models.Messages.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list', 'im.list'], {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'd',
      'u._id': this.userId
    });

    let rooms = _.pluck(RocketChat.models.Subscriptions.find(ourQuery).fetch(), '_room');

    const totalCount = rooms.length;
    rooms = RocketChat.models.Rooms.processQueryOptionsOnResult(rooms, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    });
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: totalCount
    });
  }

});
RocketChat.API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      t: 'd'
    });
    const rooms = RocketChat.models.Rooms.find(ourQuery, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      ims: rooms,
      offset,
      count: rooms.length,
      total: RocketChat.models.Rooms.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute(['dm.open', 'im.open'], {
  authRequired: true
}, {
  post() {
    const findResult = findDirectMessageRoom(this.requestParams(), this.user);

    if (!findResult.subscription.open) {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('openRoom', findResult.room._id);
      });
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute(['dm.setTopic', 'im.setTopic'], {
  authRequired: true
}, {
  post() {
    if (!this.bodyParams.topic || !this.bodyParams.topic.trim()) {
      return RocketChat.API.v1.failure('The bodyParam "topic" is required');
    }

    const findResult = findDirectMessageRoom(this.requestParams(), this.user);
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('saveRoomSettings', findResult.room._id, 'roomTopic', this.bodyParams.topic);
    });
    return RocketChat.API.v1.success({
      topic: this.bodyParams.topic
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrations.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/integrations.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('integrations.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      name: String,
      enabled: Boolean,
      username: String,
      urls: Match.Maybe([String]),
      channel: String,
      event: Match.Maybe(String),
      triggerWords: Match.Maybe([String]),
      alias: Match.Maybe(String),
      avatar: Match.Maybe(String),
      emoji: Match.Maybe(String),
      token: Match.Maybe(String),
      scriptEnabled: Boolean,
      script: Match.Maybe(String),
      targetChannel: Match.Maybe(String)
    }));
    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addOutgoingIntegration', this.bodyParams);
        });
        break;

      case 'webhook-incoming':
        Meteor.runAsUser(this.userId, () => {
          integration = Meteor.call('addIncomingIntegration', this.bodyParams);
        });
        break;

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }

    return RocketChat.API.v1.success({
      integration
    });
  }

});
RocketChat.API.v1.addRoute('integrations.history', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    if (!this.queryParams.id || this.queryParams.id.trim() === '') {
      return RocketChat.API.v1.failure('Invalid integration id.');
    }

    const id = this.queryParams.id;
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query, {
      'integration._id': id
    });
    const history = RocketChat.models.IntegrationHistory.find(ourQuery, {
      sort: sort ? sort : {
        _updatedAt: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      history,
      offset,
      items: history.length,
      total: RocketChat.models.IntegrationHistory.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const ourQuery = Object.assign({}, query);
    const integrations = RocketChat.models.Integrations.find(ourQuery, {
      sort: sort ? sort : {
        ts: -1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      integrations,
      offset,
      items: integrations.length,
      total: RocketChat.models.Integrations.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('integrations.remove', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      type: String,
      target_url: Match.Maybe(String),
      integrationId: Match.Maybe(String)
    }));

    if (!this.bodyParams.target_url && !this.bodyParams.integrationId) {
      return RocketChat.API.v1.failure('An integrationId or target_url needs to be provided.');
    }

    let integration;

    switch (this.bodyParams.type) {
      case 'webhook-outgoing':
        if (this.bodyParams.target_url) {
          integration = RocketChat.models.Integrations.findOne({
            urls: this.bodyParams.target_url
          });
        } else if (this.bodyParams.integrationId) {
          integration = RocketChat.models.Integrations.findOne({
            _id: this.bodyParams.integrationId
          });
        }

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteOutgoingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      case 'webhook-incoming':
        integration = RocketChat.models.Integrations.findOne({
          _id: this.bodyParams.integrationId
        });

        if (!integration) {
          return RocketChat.API.v1.failure('No integration found.');
        }

        Meteor.runAsUser(this.userId, () => {
          Meteor.call('deleteIncomingIntegration', integration._id);
        });
        return RocketChat.API.v1.success({
          integration
        });

      default:
        return RocketChat.API.v1.failure('Invalid integration type.');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"misc.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/misc.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('info', {
  authRequired: false
}, {
  get() {
    const user = this.getLoggedInUser();

    if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
      return RocketChat.API.v1.success({
        info: RocketChat.Info
      });
    }

    return RocketChat.API.v1.success({
      info: {
        'version': RocketChat.Info.version
      }
    });
  }

});
RocketChat.API.v1.addRoute('me', {
  authRequired: true
}, {
  get() {
    const me = _.pick(this.user, ['_id', 'name', 'emails', 'status', 'statusConnection', 'username', 'utcOffset', 'active', 'language']);

    const verifiedEmail = me.emails.find(email => email.verified);
    me.email = verifiedEmail ? verifiedEmail.address : undefined;
    return RocketChat.API.v1.success(me);
  }

});
let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute

RocketChat.API.v1.addRoute('shield.svg', {
  authRequired: false
}, {
  get() {
    const {
      type,
      channel,
      name,
      icon
    } = this.queryParams;

    if (!RocketChat.settings.get('API_Enable_Shields')) {
      throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const types = RocketChat.settings.get('API_Shield_Types');

    if (type && types !== '*' && !types.split(',').map(t => t.trim()).includes(type)) {
      throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', {
        route: '/api/v1/shield.svg'
      });
    }

    const hideIcon = icon === 'false';

    if (hideIcon && (!name || !name.trim())) {
      return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
    }

    let text;
    let backgroundColor = '#4c1';

    switch (type) {
      case 'online':
        if (Date.now() - onlineCacheDate > cacheInvalid) {
          onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
          onlineCacheDate = Date.now();
        }

        text = `${onlineCache} ${TAPi18n.__('Online')}`;
        break;

      case 'channel':
        if (!channel) {
          return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
        }

        text = `#${channel}`;
        break;

      case 'user':
        const user = this.getUserFromParams(); // Respect the server's choice for using their real names or not

        if (user.name && RocketChat.settings.get('UI_Use_Real_Name')) {
          text = `${user.name}`;
        } else {
          text = `@${user.username}`;
        }

        switch (user.status) {
          case 'online':
            backgroundColor = '#1fb31f';
            break;

          case 'away':
            backgroundColor = '#dc9b01';
            break;

          case 'busy':
            backgroundColor = '#bc2031';
            break;

          case 'offline':
            backgroundColor = '#a5a1a1';
        }

        break;

      default:
        text = TAPi18n.__('Join_Chat').toUpperCase();
    }

    const iconSize = hideIcon ? 7 : 24;
    const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
    const rightSize = text.length * 6 + 20;
    const width = leftSize + rightSize;
    const height = 20;
    return {
      headers: {
        'Content-Type': 'image/svg+xml;charset=utf-8'
      },
      body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${width}" height="${height}" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${leftSize}v${height}H0z"/>
				    <path fill="${backgroundColor}" d="M${leftSize} 0h${rightSize}v${height}H${leftSize}z"/>
				    <path fill="url(#b)" d="M0 0h${width}v${height}H0z"/>
				  </g>
				    ${hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="/assets/favicon.svg"/>'}
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${name ? `<text x="${iconSize}" y="15" fill="#010101" fill-opacity=".3">${name}</text>
				    <text x="${iconSize}" y="14">${name}</text>` : ''}
				    <text x="${leftSize + 7}" y="15" fill="#010101" fill-opacity=".3">${text}</text>
				    <text x="${leftSize + 7}" y="14">${text}</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"permissions.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/permissions.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
	This API returns all permissions that exists
	on the server, with respective roles.

	Method: GET
	Route: api/v1/permissions
 */
RocketChat.API.v1.addRoute('permissions', {
  authRequired: true
}, {
  get() {
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('permissions/get'));
    return RocketChat.API.v1.success(result);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"push.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/push.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals Push */
RocketChat.API.v1.addRoute('push.token', {
  authRequired: true
}, {
  post() {
    const {
      type,
      value,
      appName
    } = this.bodyParams;
    let {
      id
    } = this.bodyParams;

    if (id && typeof id !== 'string') {
      throw new Meteor.Error('error-id-param-not-valid', 'The required "id" body param is invalid.');
    } else {
      id = Random.id();
    }

    if (!type || type !== 'apn' && type !== 'gcm') {
      throw new Meteor.Error('error-type-param-not-valid', 'The required "type" body param is missing or invalid.');
    }

    if (!value || typeof value !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    if (!appName || typeof appName !== 'string') {
      throw new Meteor.Error('error-appName-param-not-valid', 'The required "appName" body param is missing or invalid.');
    }

    let result;
    Meteor.runAsUser(this.userId, () => result = Meteor.call('raix:push-update', {
      id,
      token: {
        [type]: value
      },
      appName,
      userId: this.userId
    }));
    return RocketChat.API.v1.success({
      result
    });
  },

  delete() {
    const {
      token
    } = this.bodyParams;

    if (!token || typeof token !== 'string') {
      throw new Meteor.Error('error-token-param-not-valid', 'The required "token" body param is missing or invalid.');
    }

    const affectedRecords = Push.appCollection.remove({
      $or: [{
        'token.apn': token
      }, {
        'token.gcm': token
      }],
      userId: this.userId
    });

    if (affectedRecords === 0) {
      return RocketChat.API.v1.notFound();
    }

    return RocketChat.API.v1.success();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/settings.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
// settings endpoints
RocketChat.API.v1.addRoute('settings.public', {
  authRequired: false
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      },
      'public': true
    };
    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings', {
  authRequired: true
}, {
  get() {
    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    let ourQuery = {
      hidden: {
        $ne: true
      }
    };

    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      ourQuery.public = true;
    }

    ourQuery = Object.assign({}, query, ourQuery);
    const settings = RocketChat.models.Settings.find(ourQuery, {
      sort: sort ? sort : {
        _id: 1
      },
      skip: offset,
      limit: count,
      fields: Object.assign({
        _id: 1,
        value: 1
      }, fields)
    }).fetch();
    return RocketChat.API.v1.success({
      settings,
      count: settings.length,
      offset,
      total: RocketChat.models.Settings.find(ourQuery).count()
    });
  }

});
RocketChat.API.v1.addRoute('settings/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success(_.pick(RocketChat.models.Settings.findOneNotHiddenById(this.urlParams._id), '_id', 'value'));
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'edit-privileged-setting')) {
      return RocketChat.API.v1.unauthorized();
    }

    check(this.bodyParams, {
      value: Match.Any
    });

    if (RocketChat.models.Settings.updateValueNotHiddenById(this.urlParams._id, this.bodyParams.value)) {
      return RocketChat.API.v1.success();
    }

    return RocketChat.API.v1.failure();
  }

});
RocketChat.API.v1.addRoute('service.configurations', {
  authRequired: false
}, {
  get() {
    const ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
    return RocketChat.API.v1.success({
      configurations: ServiceConfiguration.configurations.find({}, {
        fields: {
          secret: 0
        }
      }).fetch()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/stats.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('statistics', {
  authRequired: true
}, {
  get() {
    let refresh = false;

    if (typeof this.queryParams.refresh !== 'undefined' && this.queryParams.refresh === 'true') {
      refresh = true;
    }

    let stats;
    Meteor.runAsUser(this.userId, () => {
      stats = Meteor.call('getStatistics', refresh);
    });
    return RocketChat.API.v1.success({
      statistics: stats
    });
  }

});
RocketChat.API.v1.addRoute('statistics.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-statistics')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const statistics = RocketChat.models.Statistics.find(query, {
      sort: sort ? sort : {
        name: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      statistics,
      count: statistics.length,
      offset,
      total: RocketChat.models.Statistics.find(query).count()
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/users.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let Busboy;
module.watch(require("busboy"), {
  default(v) {
    Busboy = v;
  }

}, 1);
RocketChat.API.v1.addRoute('users.create', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      email: String,
      name: String,
      password: String,
      username: String,
      active: Match.Maybe(Boolean),
      roles: Match.Maybe(Array),
      joinDefaultChannels: Match.Maybe(Boolean),
      requirePasswordChange: Match.Maybe(Boolean),
      sendWelcomeEmail: Match.Maybe(Boolean),
      verified: Match.Maybe(Boolean),
      customFields: Match.Maybe(Object)
    }); //New change made by pull request #5152

    if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
      this.bodyParams.joinDefaultChannels = true;
    }

    if (this.bodyParams.customFields) {
      RocketChat.validateCustomFields(this.bodyParams.customFields);
    }

    const newUserId = RocketChat.saveUser(this.userId, this.bodyParams);

    if (this.bodyParams.customFields) {
      RocketChat.saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
    }

    if (typeof this.bodyParams.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(newUserId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.delete', {
  authRequired: true
}, {
  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'delete-user')) {
      return RocketChat.API.v1.unauthorized();
    }

    const user = this.getUserFromParams();
    Meteor.runAsUser(this.userId, () => {
      Meteor.call('deleteUser', user._id);
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.getAvatar', {
  authRequired: false
}, {
  get() {
    const user = this.getUserFromParams();
    const url = RocketChat.getURL(`/avatar/${user.username}`, {
      cdn: false,
      full: true
    });
    this.response.setHeader('Location', url);
    return {
      statusCode: 307,
      body: url
    };
  }

});
RocketChat.API.v1.addRoute('users.getPresence', {
  authRequired: true
}, {
  get() {
    if (this.isUserFromParams()) {
      const user = RocketChat.models.Users.findOneById(this.userId);
      return RocketChat.API.v1.success({
        presence: user.status,
        connectionStatus: user.statusConnection,
        lastLogin: user.lastLogin
      });
    }

    const user = this.getUserFromParams();
    return RocketChat.API.v1.success({
      presence: user.status
    });
  }

});
RocketChat.API.v1.addRoute('users.info', {
  authRequired: true
}, {
  get() {
    const user = this.getUserFromParams();
    let result;
    Meteor.runAsUser(this.userId, () => {
      result = Meteor.call('getFullUserData', {
        filter: user.username,
        limit: 1
      });
    });

    if (!result || result.length !== 1) {
      return RocketChat.API.v1.failure(`Failed to get the user data for the userId of "${user._id}".`);
    }

    return RocketChat.API.v1.success({
      user: result[0]
    });
  }

});
RocketChat.API.v1.addRoute('users.list', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-d-room')) {
      return RocketChat.API.v1.unauthorized();
    }

    const {
      offset,
      count
    } = this.getPaginationItems();
    const {
      sort,
      fields,
      query
    } = this.parseJsonQuery();
    const users = RocketChat.models.Users.find(query, {
      sort: sort ? sort : {
        username: 1
      },
      skip: offset,
      limit: count,
      fields
    }).fetch();
    return RocketChat.API.v1.success({
      users,
      count: users.length,
      offset,
      total: RocketChat.models.Users.find(query).count()
    });
  }

});
RocketChat.API.v1.addRoute('users.register', {
  authRequired: false
}, {
  post() {
    if (this.userId) {
      return RocketChat.API.v1.failure('Logged in users can not register again.');
    } //We set their username here, so require it
    //The `registerUser` checks for the other requirements


    check(this.bodyParams, Match.ObjectIncluding({
      username: String
    })); //Register the user

    const userId = Meteor.call('registerUser', this.bodyParams); //Now set their username

    Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.resetAvatar', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();

    if (user._id === this.userId) {
      Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.setAvatar', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, Match.ObjectIncluding({
      avatarUrl: Match.Maybe(String),
      userId: Match.Maybe(String),
      username: Match.Maybe(String)
    }));
    let user;

    if (this.isUserFromParams()) {
      user = Meteor.users.findOne(this.userId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'edit-other-user-info')) {
      user = this.getUserFromParams();
    } else {
      return RocketChat.API.v1.unauthorized();
    }

    Meteor.runAsUser(user._id, () => {
      if (this.bodyParams.avatarUrl) {
        RocketChat.setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
      } else {
        const busboy = new Busboy({
          headers: this.request.headers
        });
        Meteor.wrapAsync(callback => {
          busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
            if (fieldname !== 'image') {
              return callback(new Meteor.Error('invalid-field'));
            }

            const imageData = [];
            file.on('data', Meteor.bindEnvironment(data => {
              imageData.push(data);
            }));
            file.on('end', Meteor.bindEnvironment(() => {
              RocketChat.setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
              callback();
            }));
          }));
          this.request.pipe(busboy);
        })();
      }
    });
    return RocketChat.API.v1.success();
  }

});
RocketChat.API.v1.addRoute('users.update', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: String,
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        password: Match.Maybe(String),
        username: Match.Maybe(String),
        active: Match.Maybe(Boolean),
        roles: Match.Maybe(Array),
        joinDefaultChannels: Match.Maybe(Boolean),
        requirePasswordChange: Match.Maybe(Boolean),
        sendWelcomeEmail: Match.Maybe(Boolean),
        verified: Match.Maybe(Boolean),
        customFields: Match.Maybe(Object)
      })
    });

    const userData = _.extend({
      _id: this.bodyParams.userId
    }, this.bodyParams.data);

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, userData));

    if (this.bodyParams.data.customFields) {
      RocketChat.saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
    }

    if (typeof this.bodyParams.data.active !== 'undefined') {
      Meteor.runAsUser(this.userId, () => {
        Meteor.call('setUserActiveStatus', this.bodyParams.userId, this.bodyParams.data.active);
      });
    }

    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.updateOwnBasicInfo', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      data: Match.ObjectIncluding({
        email: Match.Maybe(String),
        name: Match.Maybe(String),
        username: Match.Maybe(String),
        currentPassword: Match.Maybe(String),
        newPassword: Match.Maybe(String)
      }),
      customFields: Match.Maybe(Object)
    });
    const userData = {
      email: this.bodyParams.data.email,
      realname: this.bodyParams.data.name,
      username: this.bodyParams.data.username,
      newPassword: this.bodyParams.data.newPassword,
      typedPassword: this.bodyParams.data.currentPassword
    };
    Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.userId, {
        fields: RocketChat.API.v1.defaultFieldsToExclude
      })
    });
  }

});
RocketChat.API.v1.addRoute('users.createToken', {
  authRequired: true
}, {
  post() {
    const user = this.getUserFromParams();
    let data;
    Meteor.runAsUser(this.userId, () => {
      data = Meteor.call('createToken', user._id);
    });
    return data ? RocketChat.API.v1.success({
      data
    }) : RocketChat.API.v1.unauthorized();
  }

});
RocketChat.API.v1.addRoute('users.getPreferences', {
  authRequired: true
}, {
  get() {
    const user = RocketChat.models.Users.findOneById(this.userId);

    if (user.settings) {
      const preferences = user.settings.preferences;
      preferences['language'] = user.language;
      return RocketChat.API.v1.success({
        preferences
      });
    } else {
      return RocketChat.API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
    }
  }

});
RocketChat.API.v1.addRoute('users.setPreferences', {
  authRequired: true
}, {
  post() {
    check(this.bodyParams, {
      userId: Match.Maybe(String),
      data: Match.ObjectIncluding({
        newRoomNotification: Match.Maybe(String),
        newMessageNotification: Match.Maybe(String),
        useEmojis: Match.Maybe(Boolean),
        convertAsciiEmoji: Match.Maybe(Boolean),
        saveMobileBandwidth: Match.Maybe(Boolean),
        collapseMediaByDefault: Match.Maybe(Boolean),
        autoImageLoad: Match.Maybe(Boolean),
        emailNotificationMode: Match.Maybe(String),
        roomsListExhibitionMode: Match.Maybe(String),
        unreadAlert: Match.Maybe(Boolean),
        notificationsSoundVolume: Match.Maybe(Number),
        desktopNotifications: Match.Maybe(String),
        mobileNotifications: Match.Maybe(String),
        enableAutoAway: Match.Maybe(Boolean),
        highlights: Match.Maybe(Array),
        desktopNotificationDuration: Match.Maybe(Number),
        viewMode: Match.Maybe(Number),
        hideUsernames: Match.Maybe(Boolean),
        hideRoles: Match.Maybe(Boolean),
        hideAvatars: Match.Maybe(Boolean),
        hideFlexTab: Match.Maybe(Boolean),
        sendOnEnter: Match.Maybe(String),
        roomCounterSidebar: Match.Maybe(Boolean),
        language: Match.Maybe(String),
        sidebarShowFavorites: Match.Optional(Boolean),
        sidebarShowUnread: Match.Optional(Boolean),
        sidebarSortby: Match.Optional(String),
        sidebarViewMode: Match.Optional(String),
        sidebarHideAvatar: Match.Optional(Boolean),
        mergeChannels: Match.Optional(Boolean),
        muteFocusedConversations: Match.Optional(Boolean)
      })
    });
    let preferences;
    const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;

    if (this.bodyParams.data.language) {
      const language = this.bodyParams.data.language;
      delete this.bodyParams.data.language;
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        },
        language
      });
    } else {
      preferences = _.extend({
        _id: userId,
        settings: {
          preferences: this.bodyParams.data
        }
      });
    }

    Meteor.runAsUser(this.userId, () => RocketChat.saveUser(this.userId, preferences));
    return RocketChat.API.v1.success({
      user: RocketChat.models.Users.findOneById(this.bodyParams.userId, {
        fields: preferences
      })
    });
  }

});
/**
	This API returns the logged user roles.

	Method: GET
	Route: api/v1/user.roles
 */

RocketChat.API.v1.addRoute('user.roles', {
  authRequired: true
}, {
  get() {
    let currentUserRoles = {};
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUserRoles'));

    if (Array.isArray(result) && result.length > 0) {
      currentUserRoles = result[0];
    }

    return RocketChat.API.v1.success(currentUserRoles);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"spotlight.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_api/server/v1/spotlight.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
	This API returns the result of a query of rooms
	and users, using Meteor's Spotlight method.

	Method: GET
	Route: api/v1/spotlight
	Query params:
		- query: The term to be searched.
 */
RocketChat.API.v1.addRoute('spotlight', {
  authRequired: true
}, {
  get() {
    check(this.queryParams, {
      query: String
    });
    const {
      query
    } = this.queryParams;
    const result = Meteor.runAsUser(this.userId, () => Meteor.call('spotlight', query, null, {
      rooms: true,
      users: true
    }));
    return RocketChat.API.v1.success(result);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:api/server/api.js");
require("/node_modules/meteor/rocketchat:api/server/settings.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/requestParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getPaginationItems.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/isUserFromParams.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/parseJsonQuery.js");
require("/node_modules/meteor/rocketchat:api/server/helpers/getLoggedInUser.js");
require("/node_modules/meteor/rocketchat:api/server/default/info.js");
require("/node_modules/meteor/rocketchat:api/server/default/metrics.js");
require("/node_modules/meteor/rocketchat:api/server/v1/channels.js");
require("/node_modules/meteor/rocketchat:api/server/v1/rooms.js");
require("/node_modules/meteor/rocketchat:api/server/v1/subscriptions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/chat.js");
require("/node_modules/meteor/rocketchat:api/server/v1/commands.js");
require("/node_modules/meteor/rocketchat:api/server/v1/groups.js");
require("/node_modules/meteor/rocketchat:api/server/v1/im.js");
require("/node_modules/meteor/rocketchat:api/server/v1/integrations.js");
require("/node_modules/meteor/rocketchat:api/server/v1/misc.js");
require("/node_modules/meteor/rocketchat:api/server/v1/permissions.js");
require("/node_modules/meteor/rocketchat:api/server/v1/push.js");
require("/node_modules/meteor/rocketchat:api/server/v1/settings.js");
require("/node_modules/meteor/rocketchat:api/server/v1/stats.js");
require("/node_modules/meteor/rocketchat:api/server/v1/users.js");
require("/node_modules/meteor/rocketchat:api/server/v1/spotlight.js");

/* Exports */
Package._define("rocketchat:api");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_api.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9yZXF1ZXN0UGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9nZXRQYWdpbmF0aW9uSXRlbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci9oZWxwZXJzL2dldFVzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9pc1VzZXJGcm9tUGFyYW1zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvaGVscGVycy9wYXJzZUpzb25RdWVyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL2hlbHBlcnMvZ2V0TG9nZ2VkSW5Vc2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvZGVmYXVsdC9pbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvZGVmYXVsdC9tZXRyaWNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY2hhbm5lbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9jaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvY29tbWFuZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9ncm91cHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9pbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL21pc2MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3B1c2guanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcGkvc2VydmVyL3YxL3N0YXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwaS9zZXJ2ZXIvdjEvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBpL3NlcnZlci92MS9zcG90bGlnaHQuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiQVBJIiwiUmVzdGl2dXMiLCJjb25zdHJ1Y3RvciIsInByb3BlcnRpZXMiLCJsb2dnZXIiLCJMb2dnZXIiLCJ2ZXJzaW9uIiwiYXV0aE1ldGhvZHMiLCJmaWVsZFNlcGFyYXRvciIsImRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUiLCJqb2luQ29kZSIsIiRsb2tpIiwibWV0YSIsIm1lbWJlcnMiLCJ1c2VybmFtZXMiLCJpbXBvcnRJZHMiLCJsaW1pdGVkVXNlckZpZWxkc1RvRXhjbHVkZSIsImF2YXRhck9yaWdpbiIsImVtYWlscyIsInBob25lIiwic3RhdHVzQ29ubmVjdGlvbiIsImNyZWF0ZWRBdCIsImxhc3RMb2dpbiIsInNlcnZpY2VzIiwicmVxdWlyZVBhc3N3b3JkQ2hhbmdlIiwicmVxdWlyZVBhc3N3b3JkQ2hhbmdlUmVhc29uIiwicm9sZXMiLCJzdGF0dXNEZWZhdWx0IiwiX3VwZGF0ZWRBdCIsImN1c3RvbUZpZWxkcyIsIl9jb25maWciLCJkZWZhdWx0T3B0aW9uc0VuZHBvaW50IiwiX2RlZmF1bHRPcHRpb25zRW5kcG9pbnQiLCJyZXF1ZXN0IiwibWV0aG9kIiwiaGVhZGVycyIsIlJvY2tldENoYXQiLCJzZXR0aW5ncyIsImdldCIsInJlc3BvbnNlIiwid3JpdGVIZWFkIiwid3JpdGUiLCJkb25lIiwiaGFzSGVscGVyTWV0aG9kcyIsImhlbHBlck1ldGhvZHMiLCJzaXplIiwiZ2V0SGVscGVyTWV0aG9kcyIsImFkZEF1dGhNZXRob2QiLCJwdXNoIiwic3VjY2VzcyIsInJlc3VsdCIsImlzT2JqZWN0Iiwic3RhdHVzQ29kZSIsImJvZHkiLCJmYWlsdXJlIiwiZXJyb3JUeXBlIiwiZXJyb3IiLCJub3RGb3VuZCIsIm1zZyIsInVuYXV0aG9yaXplZCIsImFkZFJvdXRlIiwicm91dGVzIiwib3B0aW9ucyIsImVuZHBvaW50cyIsImlzQXJyYXkiLCJmb3JFYWNoIiwicm91dGUiLCJPYmplY3QiLCJrZXlzIiwiYWN0aW9uIiwib3JpZ2luYWxBY3Rpb24iLCJfaW50ZXJuYWxSb3V0ZUFjdGlvbkhhbmRsZXIiLCJkZWJ1ZyIsInRvVXBwZXJDYXNlIiwidXJsIiwiYXBwbHkiLCJlIiwic3RhY2siLCJ2MSIsIm1lc3NhZ2UiLCJ0ZXN0IiwiY2hhbm5lbCIsImNoYW5uZWxzIiwiZ3JvdXAiLCJncm91cHMiLCJkZXZlbG9wZXJXYXJuaW5nIiwibmFtZSIsImhlbHBlck1ldGhvZCIsIl9pbml0QXV0aCIsImxvZ2luQ29tcGF0aWJpbGl0eSIsImJvZHlQYXJhbXMiLCJ1c2VyIiwidXNlcm5hbWUiLCJlbWFpbCIsInBhc3N3b3JkIiwiY29kZSIsIndpdGhvdXQiLCJsZW5ndGgiLCJhdXRoIiwiaW5jbHVkZXMiLCJoYXNoZWQiLCJkaWdlc3QiLCJhbGdvcml0aG0iLCJ0b3RwIiwibG9naW4iLCJzZWxmIiwiYXV0aFJlcXVpcmVkIiwicG9zdCIsImFyZ3MiLCJpbnZvY2F0aW9uIiwiRERQQ29tbW9uIiwiTWV0aG9kSW52b2NhdGlvbiIsImNvbm5lY3Rpb24iLCJjbG9zZSIsIkREUCIsIl9DdXJyZW50SW52b2NhdGlvbiIsIndpdGhWYWx1ZSIsIk1ldGVvciIsImNhbGwiLCJyZWFzb24iLCJzdGF0dXMiLCJ1c2VycyIsImZpbmRPbmUiLCJfaWQiLCJpZCIsInVzZXJJZCIsInVwZGF0ZSIsIkFjY291bnRzIiwiX2hhc2hMb2dpblRva2VuIiwidG9rZW4iLCIkdW5zZXQiLCJkYXRhIiwiYXV0aFRva2VuIiwiZXh0cmFEYXRhIiwib25Mb2dnZWRJbiIsImV4dGVuZCIsImV4dHJhIiwibG9nb3V0IiwiaGFzaGVkVG9rZW4iLCJ0b2tlbkxvY2F0aW9uIiwiaW5kZXgiLCJsYXN0SW5kZXhPZiIsInRva2VuUGF0aCIsInN1YnN0cmluZyIsInRva2VuRmllbGROYW1lIiwidG9rZW5Ub1JlbW92ZSIsInRva2VuUmVtb3ZhbFF1ZXJ5IiwiJHB1bGwiLCJvbkxvZ2dlZE91dCIsImNvbnNvbGUiLCJ3YXJuIiwiZ2V0VXNlckF1dGgiLCJfZ2V0VXNlckF1dGgiLCJpbnZhbGlkUmVzdWx0cyIsInVuZGVmaW5lZCIsInBheWxvYWQiLCJKU09OIiwicGFyc2UiLCJpIiwiYXJndW1lbnRzIiwiTWFwIiwiQXBpQ2xhc3MiLCJjcmVhdGVBcGkiLCJfY3JlYXRlQXBpIiwiZW5hYmxlQ29ycyIsInVzZURlZmF1bHRBdXRoIiwicHJldHR5SnNvbiIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsImtleSIsInZhbHVlIiwiYWRkR3JvdXAiLCJzZWN0aW9uIiwiYWRkIiwidHlwZSIsInB1YmxpYyIsImVuYWJsZVF1ZXJ5Iiwic2V0IiwiX3JlcXVlc3RQYXJhbXMiLCJxdWVyeVBhcmFtcyIsIl9nZXRQYWdpbmF0aW9uSXRlbXMiLCJoYXJkVXBwZXJMaW1pdCIsImRlZmF1bHRDb3VudCIsIm9mZnNldCIsInBhcnNlSW50IiwiY291bnQiLCJfZ2V0VXNlckZyb21QYXJhbXMiLCJkb2VzbnRFeGlzdCIsIl9kb2VzbnRFeGlzdCIsInBhcmFtcyIsInJlcXVlc3RQYXJhbXMiLCJ0cmltIiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lQnlJZCIsImZpbmRPbmVCeVVzZXJuYW1lIiwiRXJyb3IiLCJfaXNVc2VyRnJvbVBhcmFtcyIsIl9wYXJzZUpzb25RdWVyeSIsInNvcnQiLCJmaWVsZHMiLCJub25TZWxlY3RhYmxlRmllbGRzIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiY29uY2F0IiwiayIsInNwbGl0IiwiYXNzaWduIiwicXVlcnkiLCJub25RdWVyYWJsZUZpZWxkcyIsIl9nZXRMb2dnZWRJblVzZXIiLCJnZXRMb2dnZWRJblVzZXIiLCJoYXNSb2xlIiwiaW5mbyIsIkluZm8iLCJwcm9tY2xpZW50IiwicmVnaXN0ZXIiLCJtZXRyaWNzIiwiZmluZENoYW5uZWxCeUlkT3JOYW1lIiwiY2hlY2tlZEFyY2hpdmVkIiwicmV0dXJuVXNlcm5hbWVzIiwicm9vbUlkIiwicm9vbU5hbWUiLCJyb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwidCIsImFyY2hpdmVkIiwiZmluZFJlc3VsdCIsInJ1bkFzVXNlciIsImFjdGl2ZVVzZXJzT25seSIsImdldFVzZXJGcm9tUGFyYW1zIiwibGF0ZXN0Iiwib2xkZXN0IiwiRGF0ZSIsImluY2x1c2l2ZSIsInN1YiIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJvcGVuIiwiY3JlYXRlQ2hhbm5lbFZhbGlkYXRvciIsImNyZWF0ZUNoYW5uZWwiLCJyZWFkT25seSIsInJpZCIsImNyZWF0ZSIsInZhbGlkYXRlIiwiZXhlY3V0ZSIsImdldFBhZ2luYXRpb25JdGVtcyIsInBhcnNlSnNvblF1ZXJ5Iiwib3VyUXVlcnkiLCJmaWxlcyIsIlVwbG9hZHMiLCJmaW5kIiwic2tpcCIsImxpbWl0IiwiZmV0Y2giLCJ0b3RhbCIsImluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyIsIiRpbiIsImludGVncmF0aW9ucyIsIkludGVncmF0aW9ucyIsIl9jcmVhdGVkQXQiLCJsYXRlc3REYXRlIiwib2xkZXN0RGF0ZSIsInVucmVhZHMiLCJoYXNQZXJtaXNzaW9uVG9TZWVBbGxQdWJsaWNDaGFubmVscyIsInJvb21zIiwicGx1Y2siLCJ0b3RhbENvdW50IiwicHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0Iiwic29ydEZuIiwiYSIsImIiLCJNYXRjaCIsIk51bWJlciIsIkFycmF5IiwiZnJvbSIsInV0Y09mZnNldCIsIm1lc3NhZ2VzIiwiTWVzc2FnZXMiLCJ0cyIsIm9ubGluZSIsImZpbmRVc2Vyc05vdE9mZmxpbmUiLCJvbmxpbmVJblJvb20iLCJpbmRleE9mIiwiZGVzY3JpcHRpb24iLCJwdXJwb3NlIiwicm8iLCJ0b3BpYyIsIkJ1c2JveSIsInVwZGF0ZWRTaW5jZSIsInVwZGF0ZWRTaW5jZURhdGUiLCJpc05hTiIsInJlbW92ZSIsInVybFBhcmFtcyIsImJ1c2JveSIsIndyYXBBc3luYyIsImNhbGxiYWNrIiwib24iLCJmaWVsZG5hbWUiLCJmaWxlIiwiZmlsZW5hbWUiLCJlbmNvZGluZyIsIm1pbWV0eXBlIiwiZmlsZURhdGUiLCJmaWxlQnVmZmVyIiwiQnVmZmVyIiwiYmluZEVudmlyb25tZW50IiwicGlwZSIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImRldGFpbHMiLCJ1cGxvYWRlZEZpbGUiLCJpbnNlcnQiLCJiaW5kIiwiY2hlY2siLCJTdHJpbmciLCJPYmplY3RJbmNsdWRpbmciLCJtc2dJZCIsImFzVXNlciIsIk1heWJlIiwiQm9vbGVhbiIsInUiLCJub3ciLCJsYXN0VXBkYXRlIiwibWVzc2FnZUlkIiwicGlubmVkTWVzc2FnZSIsIm1lc3NhZ2VSZXR1cm4iLCJwcm9jZXNzV2ViaG9va01lc3NhZ2UiLCJzZWFyY2hUZXh0Iiwic3RhcnJlZCIsInRleHQiLCJlbW9qaSIsImNvbW1hbmQiLCJjbWQiLCJzbGFzaENvbW1hbmRzIiwiY29tbWFuZHMiLCJ0b0xvd2VyQ2FzZSIsInZhbHVlcyIsImZpbHRlciIsInJ1biIsIlJhbmRvbSIsImZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lIiwicm9vbVN1YiIsImZpbmRPbmVCeVJvb21OYW1lQW5kVXNlcklkIiwiX3Jvb20iLCJpbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyIsImNoYW5uZWxzVG9TZWFyY2giLCJmaW5kRGlyZWN0TWVzc2FnZVJvb20iLCJnZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4iLCJjdXJyZW50VXNlcklkIiwibmFtZU9ySWQiLCJzdWJzY3JpcHRpb24iLCJsb2ciLCJtc2dzIiwiaW1zIiwiZW5hYmxlZCIsInVybHMiLCJldmVudCIsInRyaWdnZXJXb3JkcyIsImFsaWFzIiwiYXZhdGFyIiwic2NyaXB0RW5hYmxlZCIsInNjcmlwdCIsInRhcmdldENoYW5uZWwiLCJpbnRlZ3JhdGlvbiIsImhpc3RvcnkiLCJJbnRlZ3JhdGlvbkhpc3RvcnkiLCJpdGVtcyIsInRhcmdldF91cmwiLCJpbnRlZ3JhdGlvbklkIiwibWUiLCJwaWNrIiwidmVyaWZpZWRFbWFpbCIsInZlcmlmaWVkIiwiYWRkcmVzcyIsIm9ubGluZUNhY2hlIiwib25saW5lQ2FjaGVEYXRlIiwiY2FjaGVJbnZhbGlkIiwiaWNvbiIsInR5cGVzIiwibWFwIiwiaGlkZUljb24iLCJiYWNrZ3JvdW5kQ29sb3IiLCJUQVBpMThuIiwiX18iLCJpY29uU2l6ZSIsImxlZnRTaXplIiwicmlnaHRTaXplIiwid2lkdGgiLCJoZWlnaHQiLCJyZXBsYWNlIiwiYXBwTmFtZSIsImRlbGV0ZSIsImFmZmVjdGVkUmVjb3JkcyIsIlB1c2giLCJhcHBDb2xsZWN0aW9uIiwiJG9yIiwiaGlkZGVuIiwiJG5lIiwiU2V0dGluZ3MiLCJmaW5kT25lTm90SGlkZGVuQnlJZCIsIkFueSIsInVwZGF0ZVZhbHVlTm90SGlkZGVuQnlJZCIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiUGFja2FnZSIsImNvbmZpZ3VyYXRpb25zIiwic2VjcmV0IiwicmVmcmVzaCIsInN0YXRzIiwic3RhdGlzdGljcyIsIlN0YXRpc3RpY3MiLCJhY3RpdmUiLCJqb2luRGVmYXVsdENoYW5uZWxzIiwic2VuZFdlbGNvbWVFbWFpbCIsInZhbGlkYXRlQ3VzdG9tRmllbGRzIiwibmV3VXNlcklkIiwic2F2ZVVzZXIiLCJzYXZlQ3VzdG9tRmllbGRzV2l0aG91dFZhbGlkYXRpb24iLCJnZXRVUkwiLCJjZG4iLCJmdWxsIiwic2V0SGVhZGVyIiwiaXNVc2VyRnJvbVBhcmFtcyIsInByZXNlbmNlIiwiY29ubmVjdGlvblN0YXR1cyIsImF2YXRhclVybCIsInNldFVzZXJBdmF0YXIiLCJpbWFnZURhdGEiLCJ1c2VyRGF0YSIsInNhdmVDdXN0b21GaWVsZHMiLCJjdXJyZW50UGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsInJlYWxuYW1lIiwidHlwZWRQYXNzd29yZCIsInByZWZlcmVuY2VzIiwibGFuZ3VhZ2UiLCJuZXdSb29tTm90aWZpY2F0aW9uIiwibmV3TWVzc2FnZU5vdGlmaWNhdGlvbiIsInVzZUVtb2ppcyIsImNvbnZlcnRBc2NpaUVtb2ppIiwic2F2ZU1vYmlsZUJhbmR3aWR0aCIsImNvbGxhcHNlTWVkaWFCeURlZmF1bHQiLCJhdXRvSW1hZ2VMb2FkIiwiZW1haWxOb3RpZmljYXRpb25Nb2RlIiwicm9vbXNMaXN0RXhoaWJpdGlvbk1vZGUiLCJ1bnJlYWRBbGVydCIsIm5vdGlmaWNhdGlvbnNTb3VuZFZvbHVtZSIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlTm90aWZpY2F0aW9ucyIsImVuYWJsZUF1dG9Bd2F5IiwiaGlnaGxpZ2h0cyIsImRlc2t0b3BOb3RpZmljYXRpb25EdXJhdGlvbiIsInZpZXdNb2RlIiwiaGlkZVVzZXJuYW1lcyIsImhpZGVSb2xlcyIsImhpZGVBdmF0YXJzIiwiaGlkZUZsZXhUYWIiLCJzZW5kT25FbnRlciIsInJvb21Db3VudGVyU2lkZWJhciIsInNpZGViYXJTaG93RmF2b3JpdGVzIiwiT3B0aW9uYWwiLCJzaWRlYmFyU2hvd1VucmVhZCIsInNpZGViYXJTb3J0YnkiLCJzaWRlYmFyVmlld01vZGUiLCJzaWRlYmFySGlkZUF2YXRhciIsIm1lcmdlQ2hhbm5lbHMiLCJtdXRlRm9jdXNlZENvbnZlcnNhdGlvbnMiLCJjdXJyZW50VXNlclJvbGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBR04sTUFBTUMsR0FBTixTQUFrQkMsUUFBbEIsQ0FBMkI7QUFDMUJDLGNBQVlDLFVBQVosRUFBd0I7QUFDdkIsVUFBTUEsVUFBTjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxNQUFKLENBQVksT0FBT0YsV0FBV0csT0FBWCxHQUFxQkgsV0FBV0csT0FBaEMsR0FBMEMsU0FBVyxTQUF4RSxFQUFrRixFQUFsRixDQUFkO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixFQUFuQjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsR0FBdEI7QUFDQSxTQUFLQyxzQkFBTCxHQUE4QjtBQUM3QkMsZ0JBQVUsQ0FEbUI7QUFFN0JDLGFBQU8sQ0FGc0I7QUFHN0JDLFlBQU0sQ0FIdUI7QUFJN0JD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QUFzQztBQUNyQzBELGFBQU8sSUFEOEI7QUFFckNsSixhQUFPO0FBRjhCLEtBQXRDLENBRGMsQ0FBZjtBQU9BLFdBQU9yRixXQUFXcEMsR0FBWCxDQUFlOEUsRUFBZixDQUFrQjdCLE9BQWxCLENBQTBCQyxNQUExQixDQUFQO0FBQ0E7O0FBaEI4RCxDQUFoRSxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FwaS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbCBSZXN0aXZ1cywgRERQLCBERFBDb21tb24gKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5jbGFzcyBBUEkgZXh0ZW5kcyBSZXN0aXZ1cyB7XG5cdGNvbnN0cnVjdG9yKHByb3BlcnRpZXMpIHtcblx0XHRzdXBlcihwcm9wZXJ0aWVzKTtcblx0XHR0aGlzLmxvZ2dlciA9IG5ldyBMb2dnZXIoYEFQSSAkeyBwcm9wZXJ0aWVzLnZlcnNpb24gPyBwcm9wZXJ0aWVzLnZlcnNpb24gOiAnZGVmYXVsdCcgfSBMb2dnZXJgLCB7fSk7XG5cdFx0dGhpcy5hdXRoTWV0aG9kcyA9IFtdO1xuXHRcdHRoaXMuZmllbGRTZXBhcmF0b3IgPSAnLic7XG5cdFx0dGhpcy5kZWZhdWx0RmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0am9pbkNvZGU6IDAsXG5cdFx0XHQkbG9raTogMCxcblx0XHRcdG1ldGE6IDAsXG5cdFx0XHRtZW1iZXJzOiAwLFxuXHRcdFx0dXNlcm5hbWVzOiAwLCAvLyBQbGVhc2UgdXNlIHRoZSBgY2hhbm5lbC9kbS9ncm91cC5tZW1iZXJzYCBlbmRwb2ludC4gVGhpcyBpcyBkaXNhYmxlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uc1xuXHRcdFx0aW1wb3J0SWRzOiAwXG5cdFx0fTtcblx0XHR0aGlzLmxpbWl0ZWRVc2VyRmllbGRzVG9FeGNsdWRlID0ge1xuXHRcdFx0YXZhdGFyT3JpZ2luOiAwLFxuXHRcdFx0ZW1haWxzOiAwLFxuXHRcdFx0cGhvbmU6IDAsXG5cdFx0XHRzdGF0dXNDb25uZWN0aW9uOiAwLFxuXHRcdFx0Y3JlYXRlZEF0OiAwLFxuXHRcdFx0bGFzdExvZ2luOiAwLFxuXHRcdFx0c2VydmljZXM6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2U6IDAsXG5cdFx0XHRyZXF1aXJlUGFzc3dvcmRDaGFuZ2VSZWFzb246IDAsXG5cdFx0XHRyb2xlczogMCxcblx0XHRcdHN0YXR1c0RlZmF1bHQ6IDAsXG5cdFx0XHRfdXBkYXRlZEF0OiAwLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiAwXG5cdFx0fTtcblxuXHRcdHRoaXMuX2NvbmZpZy5kZWZhdWx0T3B0aW9uc0VuZHBvaW50ID0gZnVuY3Rpb24gX2RlZmF1bHRPcHRpb25zRW5kcG9pbnQoKSB7XG5cdFx0XHRpZiAodGhpcy5yZXF1ZXN0Lm1ldGhvZCA9PT0gJ09QVElPTlMnICYmIHRoaXMucmVxdWVzdC5oZWFkZXJzWydhY2Nlc3MtY29udHJvbC1yZXF1ZXN0LW1ldGhvZCddKSB7XG5cdFx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9DT1JTJykgPT09IHRydWUpIHtcblx0XHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCgyMDAsIHtcblx0XHRcdFx0XHRcdCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0NPUlNfT3JpZ2luJyksXG5cdFx0XHRcdFx0XHQnQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycyc6ICdPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBYLVVzZXItSWQsIFgtQXV0aC1Ub2tlbidcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnJlc3BvbnNlLndyaXRlSGVhZCg0MDUpO1xuXHRcdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGUoJ0NPUlMgbm90IGVuYWJsZWQuIEdvIHRvIFwiQWRtaW4gPiBHZW5lcmFsID4gUkVTVCBBcGlcIiB0byBlbmFibGUgaXQuJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMucmVzcG9uc2Uud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZG9uZSgpO1xuXHRcdH07XG5cdH1cblxuXHRoYXNIZWxwZXJNZXRob2RzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNpemUgIT09IDA7XG5cdH1cblxuXHRnZXRIZWxwZXJNZXRob2RzKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzO1xuXHR9XG5cblx0YWRkQXV0aE1ldGhvZChtZXRob2QpIHtcblx0XHR0aGlzLmF1dGhNZXRob2RzLnB1c2gobWV0aG9kKTtcblx0fVxuXG5cdHN1Y2Nlc3MocmVzdWx0ID0ge30pIHtcblx0XHRpZiAoXy5pc09iamVjdChyZXN1bHQpKSB7XG5cdFx0XHRyZXN1bHQuc3VjY2VzcyA9IHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDIwMCxcblx0XHRcdGJvZHk6IHJlc3VsdFxuXHRcdH07XG5cdH1cblxuXHRmYWlsdXJlKHJlc3VsdCwgZXJyb3JUeXBlKSB7XG5cdFx0aWYgKF8uaXNPYmplY3QocmVzdWx0KSkge1xuXHRcdFx0cmVzdWx0LnN1Y2Nlc3MgPSBmYWxzZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0ZXJyb3I6IHJlc3VsdFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGVycm9yVHlwZSkge1xuXHRcdFx0XHRyZXN1bHQuZXJyb3JUeXBlID0gZXJyb3JUeXBlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRzdGF0dXNDb2RlOiA0MDAsXG5cdFx0XHRib2R5OiByZXN1bHRcblx0XHR9O1xuXHR9XG5cblx0bm90Rm91bmQobXNnKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDQwNCxcblx0XHRcdGJvZHk6IHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiBtc2cgPyBtc2cgOiAnUmVzb3VyY2Ugbm90IGZvdW5kJ1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHR1bmF1dGhvcml6ZWQobXNnKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN0YXR1c0NvZGU6IDQwMyxcblx0XHRcdGJvZHk6IHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGVycm9yOiBtc2cgPyBtc2cgOiAndW5hdXRob3JpemVkJ1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cblxuXHRhZGRSb3V0ZShyb3V0ZXMsIG9wdGlvbnMsIGVuZHBvaW50cykge1xuXHRcdC8vTm90ZTogcmVxdWlyZWQgaWYgdGhlIGRldmVsb3BlciBkaWRuJ3QgcHJvdmlkZSBvcHRpb25zXG5cdFx0aWYgKHR5cGVvZiBlbmRwb2ludHMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRlbmRwb2ludHMgPSBvcHRpb25zO1xuXHRcdFx0b3B0aW9ucyA9IHt9O1xuXHRcdH1cblxuXHRcdC8vQWxsb3cgZm9yIG1vcmUgdGhhbiBvbmUgcm91dGUgdXNpbmcgdGhlIHNhbWUgb3B0aW9uIGFuZCBlbmRwb2ludHNcblx0XHRpZiAoIV8uaXNBcnJheShyb3V0ZXMpKSB7XG5cdFx0XHRyb3V0ZXMgPSBbcm91dGVzXTtcblx0XHR9XG5cblx0XHRyb3V0ZXMuZm9yRWFjaCgocm91dGUpID0+IHtcblx0XHRcdC8vTm90ZTogVGhpcyBpcyByZXF1aXJlZCBkdWUgdG8gUmVzdGl2dXMgY2FsbGluZyBgYWRkUm91dGVgIGluIHRoZSBjb25zdHJ1Y3RvciBvZiBpdHNlbGZcblx0XHRcdGlmICh0aGlzLmhhc0hlbHBlck1ldGhvZHMoKSkge1xuXHRcdFx0XHRPYmplY3Qua2V5cyhlbmRwb2ludHMpLmZvckVhY2goKG1ldGhvZCkgPT4ge1xuXHRcdFx0XHRcdGlmICh0eXBlb2YgZW5kcG9pbnRzW21ldGhvZF0gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdID0ge2FjdGlvbjogZW5kcG9pbnRzW21ldGhvZF19O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vQWRkIGEgdHJ5L2NhdGNoIGZvciBlYWNoIGVuZHBvaW50XG5cdFx0XHRcdFx0Y29uc3Qgb3JpZ2luYWxBY3Rpb24gPSBlbmRwb2ludHNbbWV0aG9kXS5hY3Rpb247XG5cdFx0XHRcdFx0ZW5kcG9pbnRzW21ldGhvZF0uYWN0aW9uID0gZnVuY3Rpb24gX2ludGVybmFsUm91dGVBY3Rpb25IYW5kbGVyKCkge1xuXHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYCR7IHRoaXMucmVxdWVzdC5tZXRob2QudG9VcHBlckNhc2UoKSB9OiAkeyB0aGlzLnJlcXVlc3QudXJsIH1gKTtcblx0XHRcdFx0XHRcdGxldCByZXN1bHQ7XG5cdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRyZXN1bHQgPSBvcmlnaW5hbEFjdGlvbi5hcHBseSh0aGlzKTtcblx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIuZGVidWcoYCR7IG1ldGhvZCB9ICR7IHJvdXRlIH0gdGhyZXcgYW4gZXJyb3I6YCwgZS5zdGFjayk7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSwgZS5lcnJvcik7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJlc3VsdCA9IHJlc3VsdCA/IHJlc3VsdCA6IFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblxuXHRcdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0XHQvKGNoYW5uZWxzfGdyb3VwcylcXC4vLnRlc3Qocm91dGUpXG5cdFx0XHRcdFx0XHRcdCYmIHJlc3VsdFxuXHRcdFx0XHRcdFx0XHQmJiByZXN1bHQuYm9keVxuXHRcdFx0XHRcdFx0XHQmJiByZXN1bHQuYm9keS5zdWNjZXNzID09PSB0cnVlXG5cdFx0XHRcdFx0XHRcdCYmIChyZXN1bHQuYm9keS5jaGFubmVsIHx8IHJlc3VsdC5ib2R5LmNoYW5uZWxzIHx8IHJlc3VsdC5ib2R5Lmdyb3VwIHx8IHJlc3VsdC5ib2R5Lmdyb3Vwcylcblx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHQvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciB0aHJlZSB2ZXJzaW9ucyBoYXZlIGJlZW4gcmVsZWFzZWQuIFRoYXQgbWVhbnMgYXQgMC42NCB0aGlzIHNob3VsZCBiZSBnb25lLiA7KVxuXHRcdFx0XHRcdFx0XHRyZXN1bHQuYm9keS5kZXZlbG9wZXJXYXJuaW5nID0gJ1tXQVJOSU5HXTogVGhlIFwidXNlcm5hbWVzXCIgZmllbGQgaGFzIGJlZW4gcmVtb3ZlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucy4gUGxlYXNlIHVzZSB0aGUgXCIqLm1lbWJlcnNcIiBlbmRwb2ludCB0byBnZXQgYSBsaXN0IG9mIG1lbWJlcnMvdXNlcnMgaW4gYSByb29tLic7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGZvciAoY29uc3QgW25hbWUsIGhlbHBlck1ldGhvZF0gb2YgdGhpcy5nZXRIZWxwZXJNZXRob2RzKCkpIHtcblx0XHRcdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdW25hbWVdID0gaGVscGVyTWV0aG9kO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vQWxsb3cgdGhlIGVuZHBvaW50cyB0byBtYWtlIHVzYWdlIG9mIHRoZSBsb2dnZXIgd2hpY2ggcmVzcGVjdHMgdGhlIHVzZXIncyBzZXR0aW5nc1xuXHRcdFx0XHRcdGVuZHBvaW50c1ttZXRob2RdLmxvZ2dlciA9IHRoaXMubG9nZ2VyO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0c3VwZXIuYWRkUm91dGUocm91dGUsIG9wdGlvbnMsIGVuZHBvaW50cyk7XG5cdFx0fSk7XG5cdH1cblxuXHRfaW5pdEF1dGgoKSB7XG5cdFx0Y29uc3QgbG9naW5Db21wYXRpYmlsaXR5ID0gKGJvZHlQYXJhbXMpID0+IHtcblx0XHRcdC8vIEdyYWIgdGhlIHVzZXJuYW1lIG9yIGVtYWlsIHRoYXQgdGhlIHVzZXIgaXMgbG9nZ2luZyBpbiB3aXRoXG5cdFx0XHRjb25zdCB7dXNlciwgdXNlcm5hbWUsIGVtYWlsLCBwYXNzd29yZCwgY29kZX0gPSBib2R5UGFyYW1zO1xuXG5cdFx0XHRpZiAocGFzc3dvcmQgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gYm9keVBhcmFtcztcblx0XHRcdH1cblxuXHRcdFx0aWYgKF8ud2l0aG91dChPYmplY3Qua2V5cyhib2R5UGFyYW1zKSwgJ3VzZXInLCAndXNlcm5hbWUnLCAnZW1haWwnLCAncGFzc3dvcmQnLCAnY29kZScpLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0cmV0dXJuIGJvZHlQYXJhbXM7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGF1dGggPSB7XG5cdFx0XHRcdHBhc3N3b3JkXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAodHlwZW9mIHVzZXIgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdGF1dGgudXNlciA9IHVzZXIuaW5jbHVkZXMoJ0AnKSA/IHtlbWFpbDogdXNlcn0gOiB7dXNlcm5hbWU6IHVzZXJ9O1xuXHRcdFx0fSBlbHNlIGlmICh1c2VybmFtZSkge1xuXHRcdFx0XHRhdXRoLnVzZXIgPSB7dXNlcm5hbWV9O1xuXHRcdFx0fSBlbHNlIGlmIChlbWFpbCkge1xuXHRcdFx0XHRhdXRoLnVzZXIgPSB7ZW1haWx9O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoYXV0aC51c2VyID09IG51bGwpIHtcblx0XHRcdFx0cmV0dXJuIGJvZHlQYXJhbXM7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChhdXRoLnBhc3N3b3JkLmhhc2hlZCkge1xuXHRcdFx0XHRhdXRoLnBhc3N3b3JkID0ge1xuXHRcdFx0XHRcdGRpZ2VzdDogYXV0aC5wYXNzd29yZCxcblx0XHRcdFx0XHRhbGdvcml0aG06ICdzaGEtMjU2J1xuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoY29kZSkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRvdHA6IHtcblx0XHRcdFx0XHRcdGNvZGUsXG5cdFx0XHRcdFx0XHRsb2dpbjogYXV0aFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGF1dGg7XG5cdFx0fTtcblxuXHRcdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5hZGRSb3V0ZSgnbG9naW4nLCB7YXV0aFJlcXVpcmVkOiBmYWxzZX0sIHtcblx0XHRcdHBvc3QoKSB7XG5cdFx0XHRcdGNvbnN0IGFyZ3MgPSBsb2dpbkNvbXBhdGliaWxpdHkodGhpcy5ib2R5UGFyYW1zKTtcblxuXHRcdFx0XHRjb25zdCBpbnZvY2F0aW9uID0gbmV3IEREUENvbW1vbi5NZXRob2RJbnZvY2F0aW9uKHtcblx0XHRcdFx0XHRjb25uZWN0aW9uOiB7XG5cdFx0XHRcdFx0XHRjbG9zZSgpIHt9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRsZXQgYXV0aDtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRhdXRoID0gRERQLl9DdXJyZW50SW52b2NhdGlvbi53aXRoVmFsdWUoaW52b2NhdGlvbiwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2xvZ2luJywgYXJncykpO1xuXHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdGxldCBlID0gZXJyb3I7XG5cdFx0XHRcdFx0aWYgKGVycm9yLnJlYXNvbiA9PT0gJ1VzZXIgbm90IGZvdW5kJykge1xuXHRcdFx0XHRcdFx0ZSA9IHtcblx0XHRcdFx0XHRcdFx0ZXJyb3I6ICdVbmF1dGhvcml6ZWQnLFxuXHRcdFx0XHRcdFx0XHRyZWFzb246ICdVbmF1dGhvcml6ZWQnXG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRzdGF0dXNDb2RlOiA0MDEsXG5cdFx0XHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0XHRcdHN0YXR1czogJ2Vycm9yJyxcblx0XHRcdFx0XHRcdFx0ZXJyb3I6IGUuZXJyb3IsXG5cdFx0XHRcdFx0XHRcdG1lc3NhZ2U6IGUucmVhc29uIHx8IGUubWVzc2FnZVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLnVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG5cdFx0XHRcdFx0X2lkOiBhdXRoLmlkXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHRoaXMudXNlcklkID0gdGhpcy51c2VyLl9pZDtcblxuXHRcdFx0XHQvLyBSZW1vdmUgdG9rZW5FeHBpcmVzIHRvIGtlZXAgdGhlIG9sZCBiZWhhdmlvclxuXHRcdFx0XHRNZXRlb3IudXNlcnMudXBkYXRlKHtcblx0XHRcdFx0XHRfaWQ6IHRoaXMudXNlci5faWQsXG5cdFx0XHRcdFx0J3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbic6IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbihhdXRoLnRva2VuKVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0JHVuc2V0OiB7XG5cdFx0XHRcdFx0XHQnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLiQud2hlbic6IDFcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGNvbnN0IHJlc3BvbnNlID0ge1xuXHRcdFx0XHRcdHN0YXR1czogJ3N1Y2Nlc3MnLFxuXHRcdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRcdHVzZXJJZDogdGhpcy51c2VySWQsXG5cdFx0XHRcdFx0XHRhdXRoVG9rZW46IGF1dGgudG9rZW5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29uc3QgZXh0cmFEYXRhID0gc2VsZi5fY29uZmlnLm9uTG9nZ2VkSW4gJiYgc2VsZi5fY29uZmlnLm9uTG9nZ2VkSW4uY2FsbCh0aGlzKTtcblxuXHRcdFx0XHRpZiAoZXh0cmFEYXRhICE9IG51bGwpIHtcblx0XHRcdFx0XHRfLmV4dGVuZChyZXNwb25zZS5kYXRhLCB7XG5cdFx0XHRcdFx0XHRleHRyYTogZXh0cmFEYXRhXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRjb25zdCBsb2dvdXQgPSBmdW5jdGlvbigpIHtcblx0XHRcdC8vIFJlbW92ZSB0aGUgZ2l2ZW4gYXV0aCB0b2tlbiBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudFxuXHRcdFx0Y29uc3QgYXV0aFRva2VuID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddO1xuXHRcdFx0Y29uc3QgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcblx0XHRcdGNvbnN0IHRva2VuTG9jYXRpb24gPSBzZWxmLl9jb25maWcuYXV0aC50b2tlbjtcblx0XHRcdGNvbnN0IGluZGV4ID0gdG9rZW5Mb2NhdGlvbi5sYXN0SW5kZXhPZignLicpO1xuXHRcdFx0Y29uc3QgdG9rZW5QYXRoID0gdG9rZW5Mb2NhdGlvbi5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuXHRcdFx0Y29uc3QgdG9rZW5GaWVsZE5hbWUgPSB0b2tlbkxvY2F0aW9uLnN1YnN0cmluZyhpbmRleCArIDEpO1xuXHRcdFx0Y29uc3QgdG9rZW5Ub1JlbW92ZSA9IHt9O1xuXHRcdFx0dG9rZW5Ub1JlbW92ZVt0b2tlbkZpZWxkTmFtZV0gPSBoYXNoZWRUb2tlbjtcblx0XHRcdGNvbnN0IHRva2VuUmVtb3ZhbFF1ZXJ5ID0ge307XG5cdFx0XHR0b2tlblJlbW92YWxRdWVyeVt0b2tlblBhdGhdID0gdG9rZW5Ub1JlbW92ZTtcblxuXHRcdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh0aGlzLnVzZXIuX2lkLCB7XG5cdFx0XHRcdCRwdWxsOiB0b2tlblJlbW92YWxRdWVyeVxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHJlc3BvbnNlID0ge1xuXHRcdFx0XHRzdGF0dXM6ICdzdWNjZXNzJyxcblx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdG1lc3NhZ2U6ICdZb3VcXCd2ZSBiZWVuIGxvZ2dlZCBvdXQhJ1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBDYWxsIHRoZSBsb2dvdXQgaG9vayB3aXRoIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgYXR0YWNoZWRcblx0XHRcdGNvbnN0IGV4dHJhRGF0YSA9IHNlbGYuX2NvbmZpZy5vbkxvZ2dlZE91dCAmJiBzZWxmLl9jb25maWcub25Mb2dnZWRPdXQuY2FsbCh0aGlzKTtcblx0XHRcdGlmIChleHRyYURhdGEgIT0gbnVsbCkge1xuXHRcdFx0XHRfLmV4dGVuZChyZXNwb25zZS5kYXRhLCB7XG5cdFx0XHRcdFx0ZXh0cmE6IGV4dHJhRGF0YVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZXNwb25zZTtcblx0XHR9O1xuXG5cdFx0Lypcblx0XHRcdEFkZCBhIGxvZ291dCBlbmRwb2ludCB0byB0aGUgQVBJXG5cdFx0XHRBZnRlciB0aGUgdXNlciBpcyBsb2dnZWQgb3V0LCB0aGUgb25Mb2dnZWRPdXQgaG9vayBpcyBjYWxsZWQgKHNlZSBSZXN0ZnVsbHkuY29uZmlndXJlKCkgZm9yXG5cdFx0XHRhZGRpbmcgaG9vaykuXG5cdFx0Ki9cblx0XHRyZXR1cm4gdGhpcy5hZGRSb3V0ZSgnbG9nb3V0Jywge1xuXHRcdFx0YXV0aFJlcXVpcmVkOiB0cnVlXG5cdFx0fSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oJ1dhcm5pbmc6IERlZmF1bHQgbG9nb3V0IHZpYSBHRVQgd2lsbCBiZSByZW1vdmVkIGluIFJlc3RpdnVzIHYxLjAuIFVzZSBQT1NUIGluc3RlYWQuJyk7XG5cdFx0XHRcdGNvbnNvbGUud2FybignICAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20va2FobWFsaS9tZXRlb3ItcmVzdGl2dXMvaXNzdWVzLzEwMCcpO1xuXHRcdFx0XHRyZXR1cm4gbG9nb3V0LmNhbGwodGhpcyk7XG5cdFx0XHR9LFxuXHRcdFx0cG9zdDogbG9nb3V0XG5cdFx0fSk7XG5cdH1cbn1cblxuY29uc3QgZ2V0VXNlckF1dGggPSBmdW5jdGlvbiBfZ2V0VXNlckF1dGgoKSB7XG5cdGNvbnN0IGludmFsaWRSZXN1bHRzID0gW3VuZGVmaW5lZCwgbnVsbCwgZmFsc2VdO1xuXHRyZXR1cm4ge1xuXHRcdHRva2VuOiAnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuJyxcblx0XHR1c2VyKCkge1xuXHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcyAmJiB0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCkge1xuXHRcdFx0XHR0aGlzLmJvZHlQYXJhbXMgPSBKU09OLnBhcnNlKHRoaXMuYm9keVBhcmFtcy5wYXlsb2FkKTtcblx0XHRcdH1cblxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBSb2NrZXRDaGF0LkFQSS52MS5hdXRoTWV0aG9kcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRjb25zdCBtZXRob2QgPSBSb2NrZXRDaGF0LkFQSS52MS5hdXRoTWV0aG9kc1tpXTtcblxuXHRcdFx0XHRpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IG1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0XHRcdGlmICghaW52YWxpZFJlc3VsdHMuaW5jbHVkZXMocmVzdWx0KSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bGV0IHRva2VuO1xuXHRcdFx0aWYgKHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWF1dGgtdG9rZW4nXSkge1xuXHRcdFx0XHR0b2tlbiA9IEFjY291bnRzLl9oYXNoTG9naW5Ub2tlbih0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1c2VySWQ6IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LXVzZXItaWQnXSxcblx0XHRcdFx0dG9rZW5cblx0XHRcdH07XG5cdFx0fVxuXHR9O1xufTtcblxuUm9ja2V0Q2hhdC5BUEkgPSB7XG5cdGhlbHBlck1ldGhvZHM6IG5ldyBNYXAoKSxcblx0Z2V0VXNlckF1dGgsXG5cdEFwaUNsYXNzOiBBUElcbn07XG5cbmNvbnN0IGNyZWF0ZUFwaSA9IGZ1bmN0aW9uIF9jcmVhdGVBcGkoZW5hYmxlQ29ycykge1xuXHRpZiAoIVJvY2tldENoYXQuQVBJLnYxIHx8IFJvY2tldENoYXQuQVBJLnYxLl9jb25maWcuZW5hYmxlQ29ycyAhPT0gZW5hYmxlQ29ycykge1xuXHRcdFJvY2tldENoYXQuQVBJLnYxID0gbmV3IEFQSSh7XG5cdFx0XHR2ZXJzaW9uOiAndjEnLFxuXHRcdFx0dXNlRGVmYXVsdEF1dGg6IHRydWUsXG5cdFx0XHRwcmV0dHlKc29uOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50Jyxcblx0XHRcdGVuYWJsZUNvcnMsXG5cdFx0XHRhdXRoOiBnZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuQVBJLmRlZmF1bHQgfHwgUm9ja2V0Q2hhdC5BUEkuZGVmYXVsdC5fY29uZmlnLmVuYWJsZUNvcnMgIT09IGVuYWJsZUNvcnMpIHtcblx0XHRSb2NrZXRDaGF0LkFQSS5kZWZhdWx0ID0gbmV3IEFQSSh7XG5cdFx0XHR1c2VEZWZhdWx0QXV0aDogdHJ1ZSxcblx0XHRcdHByZXR0eUpzb246IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxuXHRcdFx0ZW5hYmxlQ29ycyxcblx0XHRcdGF1dGg6IGdldFVzZXJBdXRoKClcblx0XHR9KTtcblx0fVxufTtcblxuLy8gcmVnaXN0ZXIgdGhlIEFQSSB0byBiZSByZS1jcmVhdGVkIG9uY2UgdGhlIENPUlMtc2V0dGluZyBjaGFuZ2VzLlxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbmFibGVfQ09SUycsIChrZXksIHZhbHVlKSA9PiB7XG5cdGNyZWF0ZUFwaSh2YWx1ZSk7XG59KTtcblxuLy8gYWxzbyBjcmVhdGUgdGhlIEFQSSBpbW1lZGlhdGVseVxuY3JlYXRlQXBpKCEhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9FbmFibGVfQ09SUycpKTtcbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0dlbmVyYWwnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5zZWN0aW9uKCdSRVNUIEFQSScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdBUElfVXBwZXJfQ291bnRfTGltaXQnLCAxMDAsIHsgdHlwZTogJ2ludCcsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9EZWZhdWx0X0NvdW50JywgNTAsIHsgdHlwZTogJ2ludCcsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9BbGxvd19JbmZpbml0ZV9Db3VudCcsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRW5hYmxlX0RpcmVjdF9NZXNzYWdlX0hpc3RvcnlfRW5kUG9pbnQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9FbmFibGVfU2hpZWxkcycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlIH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfU2hpZWxkX1R5cGVzJywgJyonLCB7IHR5cGU6ICdzdHJpbmcnLCBwdWJsaWM6IGZhbHNlLCBlbmFibGVRdWVyeTogeyBfaWQ6ICdBUElfRW5hYmxlX1NoaWVsZHMnLCB2YWx1ZTogdHJ1ZSB9IH0pO1xuXHRcdHRoaXMuYWRkKCdBUElfRW5hYmxlX0NPUlMnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9DT1JTX09yaWdpbicsICcqJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnQVBJX0VuYWJsZV9DT1JTJywgdmFsdWU6IHRydWUgfSB9KTtcblx0fSk7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmhlbHBlck1ldGhvZHMuc2V0KCdyZXF1ZXN0UGFyYW1zJywgZnVuY3Rpb24gX3JlcXVlc3RQYXJhbXMoKSB7XG5cdHJldHVybiBbJ1BPU1QnLCAnUFVUJ10uaW5jbHVkZXModGhpcy5yZXF1ZXN0Lm1ldGhvZCkgPyB0aGlzLmJvZHlQYXJhbXMgOiB0aGlzLnF1ZXJ5UGFyYW1zO1xufSk7XG4iLCIvLyBJZiB0aGUgY291bnQgcXVlcnkgcGFyYW0gaXMgaGlnaGVyIHRoYW4gdGhlIFwiQVBJX1VwcGVyX0NvdW50X0xpbWl0XCIgc2V0dGluZywgdGhlbiB3ZSBsaW1pdCB0aGF0XG4vLyBJZiB0aGUgY291bnQgcXVlcnkgcGFyYW0gaXNuJ3QgZGVmaW5lZCwgdGhlbiB3ZSBzZXQgaXQgdG8gdGhlIFwiQVBJX0RlZmF1bHRfQ291bnRcIiBzZXR0aW5nXG4vLyBJZiB0aGUgY291bnQgaXMgemVybywgdGhlbiB0aGF0IG1lYW5zIHVubGltaXRlZCBhbmQgaXMgb25seSBhbGxvd2VkIGlmIHRoZSBzZXR0aW5nIFwiQVBJX0FsbG93X0luZmluaXRlX0NvdW50XCIgaXMgdHJ1ZVxuXG5Sb2NrZXRDaGF0LkFQSS5oZWxwZXJNZXRob2RzLnNldCgnZ2V0UGFnaW5hdGlvbkl0ZW1zJywgZnVuY3Rpb24gX2dldFBhZ2luYXRpb25JdGVtcygpIHtcblx0Y29uc3QgaGFyZFVwcGVyTGltaXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1VwcGVyX0NvdW50X0xpbWl0JykgPD0gMCA/IDEwMCA6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfVXBwZXJfQ291bnRfTGltaXQnKTtcblx0Y29uc3QgZGVmYXVsdENvdW50ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9EZWZhdWx0X0NvdW50JykgPD0gMCA/IDUwIDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9EZWZhdWx0X0NvdW50Jyk7XG5cdGNvbnN0IG9mZnNldCA9IHRoaXMucXVlcnlQYXJhbXMub2Zmc2V0ID8gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5vZmZzZXQpIDogMDtcblx0bGV0IGNvdW50ID0gZGVmYXVsdENvdW50O1xuXG5cdC8vIEVuc3VyZSBjb3VudCBpcyBhbiBhcHByb3BpYXRlIGFtb3VudFxuXHRpZiAodHlwZW9mIHRoaXMucXVlcnlQYXJhbXMuY291bnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0Y291bnQgPSBwYXJzZUludCh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KTtcblx0fSBlbHNlIHtcblx0XHRjb3VudCA9IGRlZmF1bHRDb3VudDtcblx0fVxuXG5cdGlmIChjb3VudCA+IGhhcmRVcHBlckxpbWl0KSB7XG5cdFx0Y291bnQgPSBoYXJkVXBwZXJMaW1pdDtcblx0fVxuXG5cdGlmIChjb3VudCA9PT0gMCAmJiAhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9BbGxvd19JbmZpbml0ZV9Db3VudCcpKSB7XG5cdFx0Y291bnQgPSBkZWZhdWx0Q291bnQ7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdG9mZnNldCxcblx0XHRjb3VudFxuXHR9O1xufSk7XG4iLCIvL0NvbnZlbmllbmNlIG1ldGhvZCwgYWxtb3N0IG5lZWQgdG8gdHVybiBpdCBpbnRvIGEgbWlkZGxld2FyZSBvZiBzb3J0c1xuUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2dldFVzZXJGcm9tUGFyYW1zJywgZnVuY3Rpb24gX2dldFVzZXJGcm9tUGFyYW1zKCkge1xuXHRjb25zdCBkb2VzbnRFeGlzdCA9IHsgX2RvZXNudEV4aXN0OiB0cnVlIH07XG5cdGxldCB1c2VyO1xuXHRjb25zdCBwYXJhbXMgPSB0aGlzLnJlcXVlc3RQYXJhbXMoKTtcblxuXHRpZiAocGFyYW1zLnVzZXJJZCAmJiBwYXJhbXMudXNlcklkLnRyaW0oKSkge1xuXHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChwYXJhbXMudXNlcklkKSB8fCBkb2VzbnRFeGlzdDtcblx0fSBlbHNlIGlmIChwYXJhbXMudXNlcm5hbWUgJiYgcGFyYW1zLnVzZXJuYW1lLnRyaW0oKSkge1xuXHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShwYXJhbXMudXNlcm5hbWUpIHx8IGRvZXNudEV4aXN0O1xuXHR9IGVsc2UgaWYgKHBhcmFtcy51c2VyICYmIHBhcmFtcy51c2VyLnRyaW0oKSkge1xuXHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShwYXJhbXMudXNlcikgfHwgZG9lc250RXhpc3Q7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItdXNlci1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwidXNlcklkXCIgb3IgXCJ1c2VybmFtZVwiIHBhcmFtIHdhcyBub3QgcHJvdmlkZWQnKTtcblx0fVxuXG5cdGlmICh1c2VyLl9kb2VzbnRFeGlzdCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdUaGUgcmVxdWlyZWQgXCJ1c2VySWRcIiBvciBcInVzZXJuYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IHVzZXJzJyk7XG5cdH1cblxuXHRyZXR1cm4gdXNlcjtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2lzVXNlckZyb21QYXJhbXMnLCBmdW5jdGlvbiBfaXNVc2VyRnJvbVBhcmFtcygpIHtcblx0Y29uc3QgcGFyYW1zID0gdGhpcy5yZXF1ZXN0UGFyYW1zKCk7XG5cblx0cmV0dXJuICghcGFyYW1zLnVzZXJJZCAmJiAhcGFyYW1zLnVzZXJuYW1lICYmICFwYXJhbXMudXNlcikgfHxcblx0XHQocGFyYW1zLnVzZXJJZCAmJiB0aGlzLnVzZXJJZCA9PT0gcGFyYW1zLnVzZXJJZCkgfHxcblx0XHQocGFyYW1zLnVzZXJuYW1lICYmIHRoaXMudXNlci51c2VybmFtZSA9PT0gcGFyYW1zLnVzZXJuYW1lKSB8fFxuXHRcdChwYXJhbXMudXNlciAmJiB0aGlzLnVzZXIudXNlcm5hbWUgPT09IHBhcmFtcy51c2VyKTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ3BhcnNlSnNvblF1ZXJ5JywgZnVuY3Rpb24gX3BhcnNlSnNvblF1ZXJ5KCkge1xuXHRsZXQgc29ydDtcblx0aWYgKHRoaXMucXVlcnlQYXJhbXMuc29ydCkge1xuXHRcdHRyeSB7XG5cdFx0XHRzb3J0ID0gSlNPTi5wYXJzZSh0aGlzLnF1ZXJ5UGFyYW1zLnNvcnQpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEludmFsaWQgc29ydCBwYXJhbWV0ZXIgcHJvdmlkZWQgXCIkeyB0aGlzLnF1ZXJ5UGFyYW1zLnNvcnQgfVwiOmAsIGUpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1zb3J0JywgYEludmFsaWQgc29ydCBwYXJhbWV0ZXIgcHJvdmlkZWQ6IFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5zb3J0IH1cImAsIHsgaGVscGVyTWV0aG9kOiAncGFyc2VKc29uUXVlcnknIH0pO1xuXHRcdH1cblx0fVxuXG5cdGxldCBmaWVsZHM7XG5cdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmZpZWxkcykge1xuXHRcdHRyeSB7XG5cdFx0XHRmaWVsZHMgPSBKU09OLnBhcnNlKHRoaXMucXVlcnlQYXJhbXMuZmllbGRzKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBJbnZhbGlkIGZpZWxkcyBwYXJhbWV0ZXIgcHJvdmlkZWQgXCIkeyB0aGlzLnF1ZXJ5UGFyYW1zLmZpZWxkcyB9XCI6YCwgZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWZpZWxkcycsIGBJbnZhbGlkIGZpZWxkcyBwYXJhbWV0ZXIgcHJvdmlkZWQ6IFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5maWVsZHMgfVwiYCwgeyBoZWxwZXJNZXRob2Q6ICdwYXJzZUpzb25RdWVyeScgfSk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gVmVyaWZ5IHRoZSB1c2VyJ3Mgc2VsZWN0ZWQgZmllbGRzIG9ubHkgY29udGFpbnMgb25lcyB3aGljaCB0aGVpciByb2xlIGFsbG93c1xuXHRpZiAodHlwZW9mIGZpZWxkcyA9PT0gJ29iamVjdCcpIHtcblx0XHRsZXQgbm9uU2VsZWN0YWJsZUZpZWxkcyA9IE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1mdWxsLW90aGVyLXVzZXItaW5mbycpICYmIHRoaXMucmVxdWVzdC5yb3V0ZS5pbmNsdWRlcygnL3YxL3VzZXJzLicpKSB7XG5cdFx0XHRub25TZWxlY3RhYmxlRmllbGRzID0gbm9uU2VsZWN0YWJsZUZpZWxkcy5jb25jYXQoT2JqZWN0LmtleXMoUm9ja2V0Q2hhdC5BUEkudjEubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUpKTtcblx0XHR9XG5cblx0XHRPYmplY3Qua2V5cyhmaWVsZHMpLmZvckVhY2goKGspID0+IHtcblx0XHRcdGlmIChub25TZWxlY3RhYmxlRmllbGRzLmluY2x1ZGVzKGspIHx8IG5vblNlbGVjdGFibGVGaWVsZHMuaW5jbHVkZXMoay5zcGxpdChSb2NrZXRDaGF0LkFQSS52MS5maWVsZFNlcGFyYXRvcilbMF0pKSB7XG5cdFx0XHRcdGRlbGV0ZSBmaWVsZHNba107XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvLyBMaW1pdCB0aGUgZmllbGRzIGJ5IGRlZmF1bHRcblx0ZmllbGRzID0gT2JqZWN0LmFzc2lnbih7fSwgZmllbGRzLCBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlKTtcblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWZ1bGwtb3RoZXItdXNlci1pbmZvJykgJiYgdGhpcy5yZXF1ZXN0LnJvdXRlLmluY2x1ZGVzKCcvdjEvdXNlcnMuJykpIHtcblx0XHRmaWVsZHMgPSBPYmplY3QuYXNzaWduKGZpZWxkcywgUm9ja2V0Q2hhdC5BUEkudjEubGltaXRlZFVzZXJGaWVsZHNUb0V4Y2x1ZGUpO1xuXHR9XG5cblx0bGV0IHF1ZXJ5O1xuXHRpZiAodGhpcy5xdWVyeVBhcmFtcy5xdWVyeSkge1xuXHRcdHRyeSB7XG5cdFx0XHRxdWVyeSA9IEpTT04ucGFyc2UodGhpcy5xdWVyeVBhcmFtcy5xdWVyeSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5sb2dnZXIud2FybihgSW52YWxpZCBxdWVyeSBwYXJhbWV0ZXIgcHJvdmlkZWQgXCIkeyB0aGlzLnF1ZXJ5UGFyYW1zLnF1ZXJ5IH1cIjpgLCBlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcXVlcnknLCBgSW52YWxpZCBxdWVyeSBwYXJhbWV0ZXIgcHJvdmlkZWQ6IFwiJHsgdGhpcy5xdWVyeVBhcmFtcy5xdWVyeSB9XCJgLCB7IGhlbHBlck1ldGhvZDogJ3BhcnNlSnNvblF1ZXJ5JyB9KTtcblx0XHR9XG5cdH1cblxuXHQvLyBWZXJpZnkgdGhlIHVzZXIgaGFzIHBlcm1pc3Npb24gdG8gcXVlcnkgdGhlIGZpZWxkcyB0aGV5IGFyZVxuXHRpZiAodHlwZW9mIHF1ZXJ5ID09PSAnb2JqZWN0Jykge1xuXHRcdGxldCBub25RdWVyYWJsZUZpZWxkcyA9IE9iamVjdC5rZXlzKFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUpO1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1mdWxsLW90aGVyLXVzZXItaW5mbycpICYmIHRoaXMucmVxdWVzdC5yb3V0ZS5pbmNsdWRlcygnL3YxL3VzZXJzLicpKSB7XG5cdFx0XHRub25RdWVyYWJsZUZpZWxkcyA9IG5vblF1ZXJhYmxlRmllbGRzLmNvbmNhdChPYmplY3Qua2V5cyhSb2NrZXRDaGF0LkFQSS52MS5saW1pdGVkVXNlckZpZWxkc1RvRXhjbHVkZSkpO1xuXHRcdH1cblxuXHRcdE9iamVjdC5rZXlzKHF1ZXJ5KS5mb3JFYWNoKChrKSA9PiB7XG5cdFx0XHRpZiAobm9uUXVlcmFibGVGaWVsZHMuaW5jbHVkZXMoaykgfHwgbm9uUXVlcmFibGVGaWVsZHMuaW5jbHVkZXMoay5zcGxpdChSb2NrZXRDaGF0LkFQSS52MS5maWVsZFNlcGFyYXRvcilbMF0pKSB7XG5cdFx0XHRcdGRlbGV0ZSBxdWVyeVtrXTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0c29ydCxcblx0XHRmaWVsZHMsXG5cdFx0cXVlcnlcblx0fTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkuaGVscGVyTWV0aG9kcy5zZXQoJ2dldExvZ2dlZEluVXNlcicsIGZ1bmN0aW9uIF9nZXRMb2dnZWRJblVzZXIoKSB7XG5cdGxldCB1c2VyO1xuXG5cdGlmICh0aGlzLnJlcXVlc3QuaGVhZGVyc1sneC1hdXRoLXRva2VuJ10gJiYgdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtdXNlci1pZCddKSB7XG5cdFx0dXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0J19pZCc6IHRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LXVzZXItaWQnXSxcblx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nOiBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4odGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtYXV0aC10b2tlbiddKVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIHVzZXI7XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLmRlZmF1bHQuYWRkUm91dGUoJ2luZm8nLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodXNlciAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGluZm86IFJvY2tldENoYXQuSW5mb1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dmVyc2lvbjogUm9ja2V0Q2hhdC5JbmZvLnZlcnNpb25cblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS5kZWZhdWx0LmFkZFJvdXRlKCdtZXRyaWNzJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0Z2V0KCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAndGV4dC9wbGFpbicgfSxcblx0XHRcdGJvZHk6IFJvY2tldENoYXQucHJvbWNsaWVudC5yZWdpc3Rlci5tZXRyaWNzKClcblx0XHR9O1xuXHR9XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG4vL1JldHVybnMgdGhlIGNoYW5uZWwgSUYgZm91bmQgb3RoZXJ3aXNlIGl0IHdpbGwgcmV0dXJuIHRoZSBmYWlsdXJlIG9mIHdoeSBpdCBkaWRuJ3QuIENoZWNrIHRoZSBgc3RhdHVzQ29kZWAgcHJvcGVydHlcbmZ1bmN0aW9uIGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtcywgY2hlY2tlZEFyY2hpdmVkID0gdHJ1ZSwgcmV0dXJuVXNlcm5hbWVzID0gZmFsc2UgfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdH1cblxuXHRjb25zdCBmaWVsZHMgPSB7IC4uLlJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfTtcblx0aWYgKHJldHVyblVzZXJuYW1lcykge1xuXHRcdGRlbGV0ZSBmaWVsZHMudXNlcm5hbWVzO1xuXHR9XG5cblx0bGV0IHJvb207XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHBhcmFtcy5yb29tSWQsIHsgZmllbGRzIH0pO1xuXHR9IGVsc2UgaWYgKHBhcmFtcy5yb29tTmFtZSkge1xuXHRcdHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHBhcmFtcy5yb29tTmFtZSwgeyBmaWVsZHMgfSk7XG5cdH1cblxuXHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnYycpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBvciBcInJvb21OYW1lXCIgcGFyYW0gcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggYW55IGNoYW5uZWwnKTtcblx0fVxuXG5cdGlmIChjaGVja2VkQXJjaGl2ZWQgJiYgcm9vbS5hcmNoaXZlZCkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tYXJjaGl2ZWQnLCBgVGhlIGNoYW5uZWwsICR7IHJvb20ubmFtZSB9LCBpcyBhcmNoaXZlZGApO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkQWxsVXNlclRvUm9vbScsIGZpbmRSZXN1bHQuX2lkLCB0aGlzLmJvZHlQYXJhbXMuYWN0aXZlVXNlcnNPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmFkZE93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0Ll9pZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5hcmNoaXZlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5jbGVhbkhpc3RvcnknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5sYXRlc3QpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtZXRlciBcImxhdGVzdFwiIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm9sZGVzdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0JvZHkgcGFyYW1ldGVyIFwib2xkZXN0XCIgaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbGF0ZXN0ID0gbmV3IERhdGUodGhpcy5ib2R5UGFyYW1zLmxhdGVzdCk7XG5cdFx0Y29uc3Qgb2xkZXN0ID0gbmV3IERhdGUodGhpcy5ib2R5UGFyYW1zLm9sZGVzdCk7XG5cblx0XHRsZXQgaW5jbHVzaXZlID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuaW5jbHVzaXZlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5ib2R5UGFyYW1zLmluY2x1c2l2ZTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnY2xlYW5DaGFubmVsSGlzdG9yeScsIHsgcm9vbUlkOiBmaW5kUmVzdWx0Ll9pZCwgbGF0ZXN0LCBvbGRlc3QsIGluY2x1c2l2ZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuY2xvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRjb25zdCBzdWIgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChmaW5kUmVzdWx0Ll9pZCwgdGhpcy51c2VySWQpO1xuXG5cdFx0aWYgKCFzdWIpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgdXNlci9jYWxsZWUgaXMgbm90IGluIHRoZSBjaGFubmVsIFwiJHsgZmluZFJlc3VsdC5uYW1lIH0uYCk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzdWIub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBjaGFubmVsLCAkeyBmaW5kUmVzdWx0Lm5hbWUgfSwgaXMgYWxyZWFkeSBjbG9zZWQgdG8gdGhlIHNlbmRlcmApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdoaWRlUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG4vLyBDaGFubmVsIC0+IGNyZWF0ZVxuXG5mdW5jdGlvbiBjcmVhdGVDaGFubmVsVmFsaWRhdG9yKHBhcmFtcykge1xuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihwYXJhbXMudXNlci52YWx1ZSwgJ2NyZWF0ZS1jJykpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ3VuYXV0aG9yaXplZCcpO1xuXHR9XG5cblx0aWYgKCFwYXJhbXMubmFtZSB8fCAhcGFyYW1zLm5hbWUudmFsdWUpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhcmFtIFwiJHsgcGFyYW1zLm5hbWUua2V5IH1cIiBpcyByZXF1aXJlZGApO1xuXHR9XG5cblx0aWYgKHBhcmFtcy5tZW1iZXJzICYmIHBhcmFtcy5tZW1iZXJzLnZhbHVlICYmICFfLmlzQXJyYXkocGFyYW1zLm1lbWJlcnMudmFsdWUpKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBQYXJhbSBcIiR7IHBhcmFtcy5tZW1iZXJzLmtleSB9XCIgbXVzdCBiZSBhbiBhcnJheSBpZiBwcm92aWRlZGApO1xuXHR9XG5cblx0aWYgKHBhcmFtcy5jdXN0b21GaWVsZHMgJiYgcGFyYW1zLmN1c3RvbUZpZWxkcy52YWx1ZSAmJiAhKHR5cGVvZiBwYXJhbXMuY3VzdG9tRmllbGRzLnZhbHVlID09PSAnb2JqZWN0JykpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYFBhcmFtIFwiJHsgcGFyYW1zLmN1c3RvbUZpZWxkcy5rZXkgfVwiIG11c3QgYmUgYW4gb2JqZWN0IGlmIHByb3ZpZGVkYCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQ2hhbm5lbCh1c2VySWQsIHBhcmFtcykge1xuXHRsZXQgcmVhZE9ubHkgPSBmYWxzZTtcblx0aWYgKHR5cGVvZiBwYXJhbXMucmVhZE9ubHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0cmVhZE9ubHkgPSBwYXJhbXMucmVhZE9ubHk7XG5cdH1cblxuXHRsZXQgaWQ7XG5cdE1ldGVvci5ydW5Bc1VzZXIodXNlcklkLCAoKSA9PiB7XG5cdFx0aWQgPSBNZXRlb3IuY2FsbCgnY3JlYXRlQ2hhbm5lbCcsIHBhcmFtcy5uYW1lLCBwYXJhbXMubWVtYmVycyA/IHBhcmFtcy5tZW1iZXJzIDogW10sIHJlYWRPbmx5LCBwYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0fSk7XG5cblx0cmV0dXJuIHtcblx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChpZC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdH07XG59XG5cblJvY2tldENoYXQuQVBJLmNoYW5uZWxzID0ge307XG5Sb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUgPSB7XG5cdHZhbGlkYXRlOiBjcmVhdGVDaGFubmVsVmFsaWRhdG9yLFxuXHRleGVjdXRlOiBjcmVhdGVDaGFubmVsXG59O1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHVzZXJJZCA9IHRoaXMudXNlcklkO1xuXHRcdGNvbnN0IGJvZHlQYXJhbXMgPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRsZXQgZXJyb3I7XG5cblx0XHR0cnkge1xuXHRcdFx0Um9ja2V0Q2hhdC5BUEkuY2hhbm5lbHMuY3JlYXRlLnZhbGlkYXRlKHtcblx0XHRcdFx0dXNlcjoge1xuXHRcdFx0XHRcdHZhbHVlOiB1c2VySWRcblx0XHRcdFx0fSxcblx0XHRcdFx0bmFtZToge1xuXHRcdFx0XHRcdHZhbHVlOiBib2R5UGFyYW1zLm5hbWUsXG5cdFx0XHRcdFx0a2V5OiAnbmFtZSdcblx0XHRcdFx0fSxcblx0XHRcdFx0bWVtYmVyczoge1xuXHRcdFx0XHRcdHZhbHVlOiBib2R5UGFyYW1zLm1lbWJlcnMsXG5cdFx0XHRcdFx0a2V5OiAnbWVtYmVycydcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUubWVzc2FnZSA9PT0gJ3VuYXV0aG9yaXplZCcpIHtcblx0XHRcdFx0ZXJyb3IgPSBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGVycm9yID0gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChlcnJvcikge1xuXHRcdFx0cmV0dXJuIGVycm9yO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKFJvY2tldENoYXQuQVBJLmNoYW5uZWxzLmNyZWF0ZS5leGVjdXRlKHVzZXJJZCwgYm9keVBhcmFtcykpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdlcmFzZVJvb20nLCBmaW5kUmVzdWx0Ll9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBmaW5kUmVzdWx0XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuZmlsZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdGNvbnN0IGZpbGVzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGZpbGVzLFxuXHRcdFx0Y291bnQ6IGZpbGVzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5nZXRJbnRlZ3JhdGlvbnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0bGV0IGluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyA9IHRydWU7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGluY2x1ZGVBbGxQdWJsaWNDaGFubmVscyA9IHRoaXMucXVlcnlQYXJhbXMuaW5jbHVkZUFsbFB1YmxpY0NoYW5uZWxzID09PSAndHJ1ZSc7XG5cdFx0fVxuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0Y2hhbm5lbDogYCMkeyBmaW5kUmVzdWx0Lm5hbWUgfWBcblx0XHR9O1xuXG5cdFx0aWYgKGluY2x1ZGVBbGxQdWJsaWNDaGFubmVscykge1xuXHRcdFx0b3VyUXVlcnkuY2hhbm5lbCA9IHtcblx0XHRcdFx0JGluOiBbb3VyUXVlcnkuY2hhbm5lbCwgJ2FsbF9wdWJsaWNfY2hhbm5lbHMnXVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCBvdXJRdWVyeSk7XG5cblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF9jcmVhdGVkQXQ6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRpbnRlZ3JhdGlvbnMsXG5cdFx0XHRjb3VudDogaW50ZWdyYXRpb25zLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmhpc3RvcnknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGxldCBsYXRlc3REYXRlID0gbmV3IERhdGUoKTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5sYXRlc3QpIHtcblx0XHRcdGxhdGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IG9sZGVzdERhdGUgPSB1bmRlZmluZWQ7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMub2xkZXN0KSB7XG5cdFx0XHRvbGRlc3REYXRlID0gbmV3IERhdGUodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpO1xuXHRcdH1cblxuXHRcdGxldCBpbmNsdXNpdmUgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmUpIHtcblx0XHRcdGluY2x1c2l2ZSA9IHRoaXMucXVlcnlQYXJhbXMuaW5jbHVzaXZlO1xuXHRcdH1cblxuXHRcdGxldCBjb3VudCA9IDIwO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmNvdW50KSB7XG5cdFx0XHRjb3VudCA9IHBhcnNlSW50KHRoaXMucXVlcnlQYXJhbXMuY291bnQpO1xuXHRcdH1cblxuXHRcdGxldCB1bnJlYWRzID0gZmFsc2U7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMudW5yZWFkcykge1xuXHRcdFx0dW5yZWFkcyA9IHRoaXMucXVlcnlQYXJhbXMudW5yZWFkcztcblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdnZXRDaGFubmVsSGlzdG9yeScsIHtcblx0XHRcdFx0cmlkOiBmaW5kUmVzdWx0Ll9pZCxcblx0XHRcdFx0bGF0ZXN0OiBsYXRlc3REYXRlLFxuXHRcdFx0XHRvbGRlc3Q6IG9sZGVzdERhdGUsXG5cdFx0XHRcdGluY2x1c2l2ZSxcblx0XHRcdFx0Y291bnQsXG5cdFx0XHRcdHVucmVhZHNcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmluZm8nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQuX2lkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLmludml0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkVXNlclRvUm9vbScsIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCwgdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5qb2luJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2pvaW5Sb29tJywgZmluZFJlc3VsdC5faWQsIHRoaXMuYm9keVBhcmFtcy5qb2luQ29kZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5raWNrJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVVc2VyRnJvbVJvb20nLCB7IHJpZDogZmluZFJlc3VsdC5faWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMubGVhdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnbGVhdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0OiB7XG5cdFx0Ly9UaGlzIGlzIGRlZmluZWQgYXMgc3VjaCBvbmx5IHRvIHByb3ZpZGUgYW4gZXhhbXBsZSBvZiBob3cgdGhlIHJvdXRlcyBjYW4gYmUgZGVmaW5lZCA6WFxuXHRcdGFjdGlvbigpIHtcblx0XHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXHRcdFx0Y29uc3QgaGFzUGVybWlzc2lvblRvU2VlQWxsUHVibGljQ2hhbm5lbHMgPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWMtcm9vbScpO1xuXG5cdFx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdjJyB9KTtcblxuXHRcdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctam9pbmVkLXJvb20nKSAmJiAhaGFzUGVybWlzc2lvblRvU2VlQWxsUHVibGljQ2hhbm5lbHMpIHtcblx0XHRcdFx0b3VyUXVlcnkudXNlcm5hbWVzID0ge1xuXHRcdFx0XHRcdCRpbjogW3RoaXMudXNlci51c2VybmFtZV1cblx0XHRcdFx0fTtcblx0XHRcdH0gZWxzZSBpZiAoIWhhc1Blcm1pc3Npb25Ub1NlZUFsbFB1YmxpY0NoYW5uZWxzKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0XHRmaWVsZHNcblx0XHRcdH0pLmZldGNoKCk7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0Y2hhbm5lbHM6IHJvb21zLFxuXHRcdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0XHRvZmZzZXQsXG5cdFx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMubGlzdC5qb2luZWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwge1xuXHRcdFx0dDogJ2MnLFxuXHRcdFx0J3UuX2lkJzogdGhpcy51c2VySWRcblx0XHR9KTtcblxuXHRcdGxldCByb29tcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kKG91clF1ZXJ5KS5mZXRjaCgpLCAnX3Jvb20nKTtcblx0XHRjb25zdCB0b3RhbENvdW50ID0gcm9vbXMubGVuZ3RoO1xuXG5cdFx0cm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQocm9vbXMsIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGNoYW5uZWxzOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLm1lbWJlcnMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZENoYW5uZWxCeUlkT3JOYW1lKHtcblx0XHRcdHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksXG5cdFx0XHRjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlLFxuXHRcdFx0cmV0dXJuVXNlcm5hbWVzOiB0cnVlXG5cdFx0fSk7XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRsZXQgc29ydEZuID0gKGEsIGIpID0+IGEgPiBiO1xuXHRcdGlmIChNYXRjaC50ZXN0KHNvcnQsIE9iamVjdCkgJiYgTWF0Y2gudGVzdChzb3J0LnVzZXJuYW1lLCBOdW1iZXIpICYmIHNvcnQudXNlcm5hbWUgPT09IC0xKSB7XG5cdFx0XHRzb3J0Rm4gPSAoYSwgYikgPT4gYiA8IGE7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVtYmVycyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChBcnJheS5mcm9tKGZpbmRSZXN1bHQudXNlcm5hbWVzKS5zb3J0KHNvcnRGbiksIHtcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudFxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHsgdXNlcm5hbWU6IHsgJGluOiBtZW1iZXJzIH0gfSwge1xuXHRcdFx0ZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEsIG5hbWU6IDEsIHN0YXR1czogMSwgdXRjT2Zmc2V0OiAxIH0sXG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdXNlcm5hbWU6IDEgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiBtZW1iZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnVzZXJuYW1lcy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5tZXNzYWdlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0Ll9pZCB9KTtcblxuXHRcdC8vU3BlY2lhbCBjaGVjayBmb3IgdGhlIHBlcm1pc3Npb25zXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctam9pbmVkLXJvb20nKSAmJiAhZmluZFJlc3VsdC51c2VybmFtZXMuaW5jbHVkZXModGhpcy51c2VyLnVzZXJuYW1lKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH0gZWxzZSBpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctYy1yb29tJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLm9ubGluZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdjJyB9KTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKG91clF1ZXJ5KTtcblxuXHRcdGlmIChyb29tID09IG51bGwpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdDaGFubmVsIGRvZXMgbm90IGV4aXN0cycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRVc2Vyc05vdE9mZmxpbmUoe1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHR9XG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdGNvbnN0IG9ubGluZUluUm9vbSA9IFtdO1xuXHRcdG9ubGluZS5mb3JFYWNoKHVzZXIgPT4ge1xuXHRcdFx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgIT09IC0xKSB7XG5cdFx0XHRcdG9ubGluZUluUm9vbS5wdXNoKHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0b25saW5lOiBvbmxpbmVJblJvb21cblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5vcGVuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0Y29uc3Qgc3ViID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQoZmluZFJlc3VsdC5faWQsIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghc3ViKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHVzZXIvY2FsbGVlIGlzIG5vdCBpbiB0aGUgY2hhbm5lbCBcIiR7IGZpbmRSZXN1bHQubmFtZSB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0aWYgKHN1Yi5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIGNoYW5uZWwsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IG9wZW4gdG8gdGhlIHNlbmRlcmApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMucmVtb3ZlTW9kZXJhdG9yJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tTW9kZXJhdG9yJywgZmluZFJlc3VsdC5faWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMucmVtb3ZlT3duZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21Pd25lcicsIGZpbmRSZXN1bHQuX2lkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnJlbmFtZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5uYW1lIHx8ICF0aGlzLmJvZHlQYXJhbXMubmFtZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogeyByb29tSWQ6IHRoaXMuYm9keVBhcmFtcy5yb29tSWQgfSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0Lm5hbWUgPT09IHRoaXMuYm9keVBhcmFtcy5uYW1lKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgbmFtZSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIHJlbmFtZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0Ll9pZCwgJ3Jvb21OYW1lJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0RGVzY3JpcHRpb24nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24gfHwgIXRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbi50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwiZGVzY3JpcHRpb25cIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQuZGVzY3JpcHRpb24gPT09IHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBjaGFubmVsIGRlc2NyaXB0aW9uIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbURlc2NyaXB0aW9uJywgdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGRlc2NyaXB0aW9uOiB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb25cblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRKb2luQ29kZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5qb2luQ29kZSB8fCAhdGhpcy5ib2R5UGFyYW1zLmpvaW5Db2RlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJqb2luQ29kZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAnam9pbkNvZGUnLCB0aGlzLmJvZHlQYXJhbXMuam9pbkNvZGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y2hhbm5lbDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5faWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhbm5lbHMuc2V0UHVycG9zZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5wdXJwb3NlIHx8ICF0aGlzLmJvZHlQYXJhbXMucHVycG9zZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwicHVycG9zZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5kZXNjcmlwdGlvbiA9PT0gdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCBwdXJwb3NlIChkZXNjcmlwdGlvbikgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSBjaGFuZ2VkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tRGVzY3JpcHRpb24nLCB0aGlzLmJvZHlQYXJhbXMucHVycG9zZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRwdXJwb3NlOiB0aGlzLmJvZHlQYXJhbXMucHVycG9zZVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFJlYWRPbmx5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJyZWFkT25seVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC5ybyA9PT0gdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgcmVhZCBvbmx5IHNldHRpbmcgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSBjaGFuZ2VkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyZWFkT25seScsIHRoaXMuYm9keVBhcmFtcy5yZWFkT25seSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy5zZXRUb3BpYycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50b3BpYyB8fCAhdGhpcy5ib2R5UGFyYW1zLnRvcGljLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJ0b3BpY1wiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCkgfSk7XG5cblx0XHRpZiAoZmluZFJlc3VsdC50b3BpYyA9PT0gdGhpcy5ib2R5UGFyYW1zLnRvcGljKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNoYW5uZWwgdG9waWMgaXMgdGhlIHNhbWUgYXMgd2hhdCBpdCB3b3VsZCBiZSBjaGFuZ2VkIHRvLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5faWQsICdyb29tVG9waWMnLCB0aGlzLmJvZHlQYXJhbXMudG9waWMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dG9waWM6IHRoaXMuYm9keVBhcmFtcy50b3BpY1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYW5uZWxzLnNldFR5cGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudHlwZSB8fCAhdGhpcy5ib2R5UGFyYW1zLnR5cGUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInR5cGVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kQ2hhbm5lbEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpIH0pO1xuXG5cdFx0aWYgKGZpbmRSZXN1bHQudCA9PT0gdGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgY2hhbm5lbCB0eXBlIGlzIHRoZSBzYW1lIGFzIHdoYXQgaXQgd291bGQgYmUgY2hhbmdlZCB0by4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQuX2lkLCAncm9vbVR5cGUnLCB0aGlzLmJvZHlQYXJhbXMudHlwZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjaGFubmVsOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0Ll9pZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGFubmVscy51bmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRDaGFubmVsQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRpZiAoIWZpbmRSZXN1bHQuYXJjaGl2ZWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgY2hhbm5lbCwgJHsgZmluZFJlc3VsdC5uYW1lIH0sIGlzIG5vdCBhcmNoaXZlZGApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgZmluZFJlc3VsdC5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgQnVzYm95IGZyb20gJ2J1c2JveSc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy5nZXQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHVwZGF0ZWRTaW5jZSB9ID0gdGhpcy5xdWVyeVBhcmFtcztcblxuXHRcdGxldCB1cGRhdGVkU2luY2VEYXRlO1xuXHRcdGlmICh1cGRhdGVkU2luY2UpIHtcblx0XHRcdGlmIChpc05hTihEYXRlLnBhcnNlKHVwZGF0ZWRTaW5jZSkpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVwZGF0ZWRTaW5jZS1wYXJhbS1pbnZhbGlkJywgJ1RoZSBcInVwZGF0ZWRTaW5jZVwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIGEgdmFsaWQgZGF0ZS4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVwZGF0ZWRTaW5jZURhdGUgPSBuZXcgRGF0ZSh1cGRhdGVkU2luY2UpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ3Jvb21zL2dldCcsIHVwZGF0ZWRTaW5jZURhdGUpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkpIHtcblx0XHRcdHJlc3VsdCA9IHtcblx0XHRcdFx0dXBkYXRlOiByZXN1bHQsXG5cdFx0XHRcdHJlbW92ZTogW11cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdyb29tcy51cGxvYWQvOnJpZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCByb29tID0gTWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCB0aGlzLnVybFBhcmFtcy5yaWQsIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGJ1c2JveSA9IG5ldyBCdXNib3koeyBoZWFkZXJzOiB0aGlzLnJlcXVlc3QuaGVhZGVycyB9KTtcblx0XHRjb25zdCBmaWxlcyA9IFtdO1xuXHRcdGNvbnN0IGZpZWxkcyA9IHt9O1xuXG5cdFx0TWV0ZW9yLndyYXBBc3luYygoY2FsbGJhY2spID0+IHtcblx0XHRcdGJ1c2JveS5vbignZmlsZScsIChmaWVsZG5hbWUsIGZpbGUsIGZpbGVuYW1lLCBlbmNvZGluZywgbWltZXR5cGUpID0+IHtcblx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gJ2ZpbGUnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZpbGVzLnB1c2gobmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWVsZCcpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGZpbGVEYXRlID0gW107XG5cdFx0XHRcdGZpbGUub24oJ2RhdGEnLCBkYXRhID0+IGZpbGVEYXRlLnB1c2goZGF0YSkpO1xuXG5cdFx0XHRcdGZpbGUub24oJ2VuZCcsICgpID0+IHtcblx0XHRcdFx0XHRmaWxlcy5wdXNoKHsgZmllbGRuYW1lLCBmaWxlLCBmaWxlbmFtZSwgZW5jb2RpbmcsIG1pbWV0eXBlLCBmaWxlQnVmZmVyOiBCdWZmZXIuY29uY2F0KGZpbGVEYXRlKSB9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0YnVzYm95Lm9uKCdmaWVsZCcsIChmaWVsZG5hbWUsIHZhbHVlKSA9PiBmaWVsZHNbZmllbGRuYW1lXSA9IHZhbHVlKTtcblxuXHRcdFx0YnVzYm95Lm9uKCdmaW5pc2gnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IGNhbGxiYWNrKCkpKTtcblxuXHRcdFx0dGhpcy5yZXF1ZXN0LnBpcGUoYnVzYm95KTtcblx0XHR9KSgpO1xuXG5cdFx0aWYgKGZpbGVzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ZpbGUgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRpZiAoZmlsZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0p1c3QgMSBmaWxlIGlzIGFsbG93ZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaWxlID0gZmlsZXNbMF07XG5cblx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJyk7XG5cblx0XHRjb25zdCBkZXRhaWxzID0ge1xuXHRcdFx0bmFtZTogZmlsZS5maWxlbmFtZSxcblx0XHRcdHNpemU6IGZpbGUuZmlsZUJ1ZmZlci5sZW5ndGgsXG5cdFx0XHR0eXBlOiBmaWxlLm1pbWV0eXBlLFxuXHRcdFx0cmlkOiB0aGlzLnVybFBhcmFtcy5yaWRcblx0XHR9O1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0Y29uc3QgdXBsb2FkZWRGaWxlID0gTWV0ZW9yLndyYXBBc3luYyhmaWxlU3RvcmUuaW5zZXJ0LmJpbmQoZmlsZVN0b3JlKSkoZGV0YWlscywgZmlsZS5maWxlQnVmZmVyKTtcblxuXHRcdFx0dXBsb2FkZWRGaWxlLmRlc2NyaXB0aW9uID0gZmllbGRzLmRlc2NyaXB0aW9uO1xuXG5cdFx0XHRkZWxldGUgZmllbGRzLmRlc2NyaXB0aW9uO1xuXG5cdFx0XHRSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKE1ldGVvci5jYWxsKCdzZW5kRmlsZU1lc3NhZ2UnLCB0aGlzLnVybFBhcmFtcy5yaWQsIG51bGwsIHVwbG9hZGVkRmlsZSwgZmllbGRzKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdWJzY3JpcHRpb25zLmdldCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgdXBkYXRlZFNpbmNlIH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXG5cdFx0bGV0IHVwZGF0ZWRTaW5jZURhdGU7XG5cdFx0aWYgKHVwZGF0ZWRTaW5jZSkge1xuXHRcdFx0aWYgKGlzTmFOKERhdGUucGFyc2UodXBkYXRlZFNpbmNlKSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbUlkLXBhcmFtLWludmFsaWQnLCAnVGhlIFwibGFzdFVwZGF0ZVwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIGEgdmFsaWQgZGF0ZS4nKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVwZGF0ZWRTaW5jZURhdGUgPSBuZXcgRGF0ZSh1cGRhdGVkU2luY2UpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ3N1YnNjcmlwdGlvbnMvZ2V0JywgdXBkYXRlZFNpbmNlRGF0ZSkpO1xuXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkocmVzdWx0KSkge1xuXHRcdFx0cmVzdWx0ID0ge1xuXHRcdFx0XHR1cGRhdGU6IHJlc3VsdCxcblx0XHRcdFx0cmVtb3ZlOiBbXVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcblxuLyoqXG5cdFRoaXMgQVBJIGlzIHN1cHBvc2UgdG8gbWFyayBhbnkgcm9vbSBhcyByZWFkLlxuXG5cdE1ldGhvZDogUE9TVFxuXHRSb3V0ZTogYXBpL3YxL3N1YnNjcmlwdGlvbnMucmVhZFxuXHRQYXJhbXM6XG5cdFx0LSByaWQ6IFRoZSByaWQgb2YgdGhlIHJvb20gdG8gYmUgbWFya2VkIGFzIHJlYWQuXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdWJzY3JpcHRpb25zLnJlYWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHRyaWQ6IFN0cmluZ1xuXHRcdH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT5cblx0XHRcdE1ldGVvci5jYWxsKCdyZWFkTWVzc2FnZXMnLCB0aGlzLmJvZHlQYXJhbXMucmlkKVxuXHRcdCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuIiwiLyogZ2xvYmFsIHByb2Nlc3NXZWJob29rTWVzc2FnZSAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdG1zZ0lkOiBTdHJpbmcsXG5cdFx0XHRyb29tSWQ6IFN0cmluZyxcblx0XHRcdGFzVXNlcjogTWF0Y2guTWF5YmUoQm9vbGVhbilcblx0XHR9KSk7XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubXNnSWQsIHsgZmllbGRzOiB7IHU6IDEsIHJpZDogMSB9fSk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyB0aGlzLmJvZHlQYXJhbXMubXNnSWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMucm9vbUlkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmFzVXNlciAmJiBtc2cudS5faWQgIT09IHRoaXMudXNlcklkICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnZm9yY2UtZGVsZXRlLW1lc3NhZ2UnLCBtc2cucmlkKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1VuYXV0aG9yaXplZC4gWW91IG11c3QgaGF2ZSB0aGUgcGVybWlzc2lvbiBcImZvcmNlLWRlbGV0ZS1tZXNzYWdlXCIgdG8gZGVsZXRlIG90aGVyXFwncyBtZXNzYWdlIGFzIHRoZW0uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLmJvZHlQYXJhbXMuYXNVc2VyID8gbXNnLnUuX2lkIDogdGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVNZXNzYWdlJywgeyBfaWQ6IG1zZy5faWQgfSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRfaWQ6IG1zZy5faWQsXG5cdFx0XHR0czogRGF0ZS5ub3coKSxcblx0XHRcdG1lc3NhZ2U6IG1zZ1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQuc3luY01lc3NhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyByb29tSWQsIGxhc3RVcGRhdGUgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbUlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBxdWVyeSBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICghbGFzdFVwZGF0ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbGFzdFVwZGF0ZS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibGFzdFVwZGF0ZVwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fSBlbHNlIGlmIChpc05hTihEYXRlLnBhcnNlKGxhc3RVcGRhdGUpKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbUlkLXBhcmFtLWludmFsaWQnLCAnVGhlIFwibGFzdFVwZGF0ZVwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIGEgdmFsaWQgZGF0ZS4nKTtcblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdHJlc3VsdCA9IE1ldGVvci5jYWxsKCdtZXNzYWdlcy9nZXQnLCByb29tSWQsIHsgbGFzdFVwZGF0ZTogbmV3IERhdGUobGFzdFVwZGF0ZSkgfSk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRyZXN1bHRcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LmdldE1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIXRoaXMucXVlcnlQYXJhbXMubXNnSWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgXCJtc2dJZFwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGxldCBtc2c7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0bXNnID0gTWV0ZW9yLmNhbGwoJ2dldFNpbmdsZU1lc3NhZ2UnLCB0aGlzLnF1ZXJ5UGFyYW1zLm1zZ0lkKTtcblx0XHR9KTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2U6IG1zZ1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQucGluTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQgfHwgIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcIm1lc3NhZ2VJZFwiIHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZS1ub3QtZm91bmQnLCAnVGhlIHByb3ZpZGVkIFwibWVzc2FnZUlkXCIgZG9lcyBub3QgbWF0Y2ggYW55IGV4aXN0aW5nIG1lc3NhZ2UuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHBpbm5lZE1lc3NhZ2U7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcGlubmVkTWVzc2FnZSA9IE1ldGVvci5jYWxsKCdwaW5NZXNzYWdlJywgbXNnKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlOiBwaW5uZWRNZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5wb3N0TWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBtZXNzYWdlUmV0dXJuID0gcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKHRoaXMuYm9keVBhcmFtcywgdGhpcy51c2VyLCB1bmRlZmluZWQsIHRydWUpWzBdO1xuXG5cdFx0aWYgKCFtZXNzYWdlUmV0dXJuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgndW5rbm93bi1lcnJvcicpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRzOiBEYXRlLm5vdygpLFxuXHRcdFx0Y2hhbm5lbDogbWVzc2FnZVJldHVybi5jaGFubmVsLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZVJldHVybi5tZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zZWFyY2gnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHJvb21JZCwgc2VhcmNoVGV4dCwgbGltaXQgfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRpZiAoIXJvb21JZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbUlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJyb29tSWRcIiBxdWVyeSBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGlmICghc2VhcmNoVGV4dCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itc2VhcmNoVGV4dC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwic2VhcmNoVGV4dFwiIHF1ZXJ5IHBhcmFtIGlzIG1pc3NpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGxpbWl0ICYmICh0eXBlb2YgbGltaXQgIT09ICdudW1iZXInIHx8IGlzTmFOKGxpbWl0KSB8fCBsaW1pdCA8PSAwKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbGltaXQtcGFyYW0taW52YWxpZCcsICdUaGUgXCJsaW1pdFwiIHF1ZXJ5IHBhcmFtZXRlciBtdXN0IGJlIGEgdmFsaWQgbnVtYmVyIGFuZCBiZSBncmVhdGVyIHRoYW4gMC4nKTtcblx0XHR9XG5cblx0XHRsZXQgcmVzdWx0O1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHJlc3VsdCA9IE1ldGVvci5jYWxsKCdtZXNzYWdlU2VhcmNoJywgc2VhcmNoVGV4dCwgcm9vbUlkLCBsaW1pdCkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0bWVzc2FnZXM6IHJlc3VsdC5tZXNzYWdlc1xuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBgY2hhdC5wb3N0TWVzc2FnZWAgYW5kIGBjaGF0LnNlbmRNZXNzYWdlYCBpcyB0aGF0IGBjaGF0LnNlbmRNZXNzYWdlYCBhbGxvd3Ncbi8vIGZvciBwYXNzaW5nIGEgdmFsdWUgZm9yIGBfaWRgIGFuZCB0aGUgb3RoZXIgb25lIGRvZXNuJ3QuIEFsc28sIGBjaGF0LnNlbmRNZXNzYWdlYCBvbmx5IHNlbmRzIGl0IHRvXG4vLyBvbmUgY2hhbm5lbCB3aGVyZWFzIHRoZSBvdGhlciBvbmUgYWxsb3dzIGZvciBzZW5kaW5nIHRvIG1vcmUgdGhhbiBvbmUgY2hhbm5lbCBhdCBhIHRpbWUuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zZW5kTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBhcmFtcycsICdUaGUgXCJtZXNzYWdlXCIgcGFyYW1ldGVyIG11c3QgYmUgcHJvdmlkZWQuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2U7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gbWVzc2FnZSA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC5zdGFyTWVzc2FnZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQgfHwgIXRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQudHJpbSgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlaWQtcGFyYW0tbm90LXByb3ZpZGVkJywgJ1RoZSByZXF1aXJlZCBcIm1lc3NhZ2VJZFwiIHBhcmFtIGlzIHJlcXVpcmVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQpO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2Utbm90LWZvdW5kJywgJ1RoZSBwcm92aWRlZCBcIm1lc3NhZ2VJZFwiIGRvZXMgbm90IG1hdGNoIGFueSBleGlzdGluZyBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdzdGFyTWVzc2FnZScsIHtcblx0XHRcdF9pZDogbXNnLl9pZCxcblx0XHRcdHJpZDogbXNnLnJpZCxcblx0XHRcdHN0YXJyZWQ6IHRydWVcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQudW5QaW5NZXNzYWdlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCB8fCAhdGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZC50cmltKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2VpZC1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHJlcXVpcmVkIFwibWVzc2FnZUlkXCIgcGFyYW0gaXMgcmVxdWlyZWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLm1lc3NhZ2VJZCk7XG5cblx0XHRpZiAoIW1zZykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZS1ub3QtZm91bmQnLCAnVGhlIHByb3ZpZGVkIFwibWVzc2FnZUlkXCIgZG9lcyBub3QgbWF0Y2ggYW55IGV4aXN0aW5nIG1lc3NhZ2UuJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3VucGluTWVzc2FnZScsIG1zZykpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdjaGF0LnVuU3Rhck1lc3NhZ2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkIHx8ICF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyByZXF1aXJlZC4nKTtcblx0XHR9XG5cblx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkKTtcblxuXHRcdGlmICghbXNnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1tZXNzYWdlLW5vdC1mb3VuZCcsICdUaGUgcHJvdmlkZWQgXCJtZXNzYWdlSWRcIiBkb2VzIG5vdCBtYXRjaCBhbnkgZXhpc3RpbmcgbWVzc2FnZS4nKTtcblx0XHR9XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnc3Rhck1lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IG1zZy5faWQsXG5cdFx0XHRyaWQ6IG1zZy5yaWQsXG5cdFx0XHRzdGFycmVkOiBmYWxzZVxuXHRcdH0pKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY2hhdC51cGRhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHRtc2dJZDogU3RyaW5nLFxuXHRcdFx0dGV4dDogU3RyaW5nIC8vVXNpbmcgdGV4dCB0byBiZSBjb25zaXN0YW50IHdpdGggY2hhdC5wb3N0TWVzc2FnZVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tc2dJZCk7XG5cblx0XHQvL0Vuc3VyZSB0aGUgbWVzc2FnZSBleGlzdHNcblx0XHRpZiAoIW1zZykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYE5vIG1lc3NhZ2UgZm91bmQgd2l0aCB0aGUgaWQgb2YgXCIkeyB0aGlzLmJvZHlQYXJhbXMubXNnSWQgfVwiLmApO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMucm9vbUlkICE9PSBtc2cucmlkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHJvb20gaWQgcHJvdmlkZWQgZG9lcyBub3QgbWF0Y2ggd2hlcmUgdGhlIG1lc3NhZ2UgaXMgZnJvbS4nKTtcblx0XHR9XG5cblx0XHQvL1Blcm1pc3Npb24gY2hlY2tzIGFyZSBhbHJlYWR5IGRvbmUgaW4gdGhlIHVwZGF0ZU1lc3NhZ2UgbWV0aG9kLCBzbyBubyBuZWVkIHRvIGR1cGxpY2F0ZSB0aGVtXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3VwZGF0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCwgbXNnOiB0aGlzLmJvZHlQYXJhbXMudGV4dCwgcmlkOiBtc2cucmlkIH0pO1xuXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlOiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChtc2cuX2lkKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NoYXQucmVhY3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkIHx8ICF0aGlzLmJvZHlQYXJhbXMubWVzc2FnZUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItbWVzc2FnZWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcmVxdWlyZWQgXCJtZXNzYWdlSWRcIiBwYXJhbSBpcyBtaXNzaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy5tZXNzYWdlSWQpO1xuXG5cdFx0aWYgKCFtc2cpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW1lc3NhZ2Utbm90LWZvdW5kJywgJ1RoZSBwcm92aWRlZCBcIm1lc3NhZ2VJZFwiIGRvZXMgbm90IG1hdGNoIGFueSBleGlzdGluZyBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGVtb2ppID0gdGhpcy5ib2R5UGFyYW1zLmVtb2ppO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NldFJlYWN0aW9uJywgZW1vamksIG1zZy5faWQpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2NvbW1hbmRzLmdldCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHBhcmFtcyA9IHRoaXMucXVlcnlQYXJhbXM7XG5cblx0XHRpZiAodHlwZW9mIHBhcmFtcy5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBxdWVyeSBwYXJhbSBcImNvbW1hbmRcIiBtdXN0IGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1twYXJhbXMuY29tbWFuZC50b0xvd2VyQ2FzZSgpXTtcblxuXHRcdGlmICghY21kKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlcmUgaXMgbm8gY29tbWFuZCBpbiB0aGUgc3lzdGVtIGJ5IHRoZSBuYW1lIG9mOiAkeyBwYXJhbXMuY29tbWFuZCB9YCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBjb21tYW5kOiBjbWQgfSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGxldCBjb21tYW5kcyA9IE9iamVjdC52YWx1ZXMoUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzKTtcblxuXHRcdGlmIChxdWVyeSAmJiBxdWVyeS5jb21tYW5kKSB7XG5cdFx0XHRjb21tYW5kcyA9IGNvbW1hbmRzLmZpbHRlcigoY29tbWFuZCkgPT4gY29tbWFuZC5jb21tYW5kID09PSBxdWVyeS5jb21tYW5kKTtcblx0XHR9XG5cblx0XHRjb25zdCB0b3RhbENvdW50ID0gY29tbWFuZHMubGVuZ3RoO1xuXHRcdGNvbW1hbmRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KGNvbW1hbmRzLCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRjb21tYW5kcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiBjb21tYW5kcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuLy8gRXhwZWN0cyBhIGJvZHkgb2Y6IHsgY29tbWFuZDogJ2dpbW1lJywgcGFyYW1zOiAnYW55IHN0cmluZyB2YWx1ZScsIHJvb21JZDogJ3ZhbHVlJyB9XG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnY29tbWFuZHMucnVuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGJvZHkgPSB0aGlzLmJvZHlQYXJhbXM7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodHlwZW9mIGJvZHkuY29tbWFuZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdZb3UgbXVzdCBwcm92aWRlIGEgY29tbWFuZCB0byBydW4uJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGJvZHkucGFyYW1zICYmIHR5cGVvZiBib2R5LnBhcmFtcyAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcGFyYW1ldGVycyBmb3IgdGhlIGNvbW1hbmQgbXVzdCBiZSBhIHNpbmdsZSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBib2R5LnJvb21JZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcm9vbVxcJ3MgaWQgd2hlcmUgdG8gZXhlY3V0ZSB0aGlzIGNvbW1hbmQgbXVzdCBwcm92aWRlZCBhbmQgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gYm9keS5jb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbYm9keS5jb21tYW5kLnRvTG93ZXJDYXNlKCldKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGNvbW1hbmQgcHJvdmlkZWQgZG9lcyBub3QgZXhpc3QgKG9yIGlzIGRpc2FibGVkKS4nKTtcblx0XHR9XG5cblx0XHQvLyBUaGlzIHdpbGwgdGhyb3cgYW4gZXJyb3IgaWYgdGhleSBjYW4ndCBvciB0aGUgcm9vbSBpcyBpbnZhbGlkXG5cdFx0TWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCBib2R5LnJvb21JZCwgdXNlci5faWQpO1xuXG5cdFx0Y29uc3QgcGFyYW1zID0gYm9keS5wYXJhbXMgPyBib2R5LnBhcmFtcyA6ICcnO1xuXG5cdFx0bGV0IHJlc3VsdDtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRyZXN1bHQgPSBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMucnVuKGNtZCwgcGFyYW1zLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogYm9keS5yb29tSWQsXG5cdFx0XHRcdG1zZzogYC8keyBjbWQgfSAkeyBwYXJhbXMgfWBcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyByZXN1bHQgfSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vUmV0dXJucyB0aGUgcHJpdmF0ZSBncm91cCBzdWJzY3JpcHRpb24gSUYgZm91bmQgb3RoZXJ3aXNlIGl0IHdpbGwgcmV0dXJuIHRoZSBmYWlsdXJlIG9mIHdoeSBpdCBkaWRuJ3QuIENoZWNrIHRoZSBgc3RhdHVzQ29kZWAgcHJvcGVydHlcbmZ1bmN0aW9uIGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zLCB1c2VySWQsIGNoZWNrZWRBcmNoaXZlZCA9IHRydWUgfSkge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMucm9vbU5hbWUgfHwgIXBhcmFtcy5yb29tTmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnVGhlIHBhcmFtZXRlciBcInJvb21JZFwiIG9yIFwicm9vbU5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0bGV0IHJvb21TdWI7XG5cdGlmIChwYXJhbXMucm9vbUlkKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHBhcmFtcy5yb29tSWQsIHVzZXJJZCk7XG5cdH0gZWxzZSBpZiAocGFyYW1zLnJvb21OYW1lKSB7XG5cdFx0cm9vbVN1YiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbU5hbWVBbmRVc2VySWQocGFyYW1zLnJvb21OYW1lLCB1c2VySWQpO1xuXHR9XG5cblx0aWYgKCFyb29tU3ViIHx8IHJvb21TdWIudCAhPT0gJ3AnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1ub3QtZm91bmQnLCAnVGhlIHJlcXVpcmVkIFwicm9vbUlkXCIgb3IgXCJyb29tTmFtZVwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBncm91cCcpO1xuXHR9XG5cblx0aWYgKGNoZWNrZWRBcmNoaXZlZCAmJiByb29tU3ViLmFyY2hpdmVkKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1hcmNoaXZlZCcsIGBUaGUgcHJpdmF0ZSBncm91cCwgJHsgcm9vbVN1Yi5uYW1lIH0sIGlzIGFyY2hpdmVkYCk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbVN1Yjtcbn1cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRBbGwnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRBbGxVc2VyVG9Sb29tJywgZmluZFJlc3VsdC5yaWQsIHRoaXMuYm9keVBhcmFtcy5hY3RpdmVVc2Vyc09ubHkpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRNb2RlcmF0b3InLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbU1vZGVyYXRvcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5hZGRPd25lcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRSb29tT3duZXInLCBmaW5kUmVzdWx0LnJpZCwgdXNlci5faWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYWRkTGVhZGVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnYWRkUm9vbUxlYWRlcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLy9BcmNoaXZlcyBhIHByaXZhdGUgZ3JvdXAgb25seSBpZiBpdCB3YXNuJ3RcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuYXJjaGl2ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2FyY2hpdmVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY2xvc2UnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5vcGVuKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShgVGhlIHByaXZhdGUgZ3JvdXAsICR7IGZpbmRSZXN1bHQubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cbi8vQ3JlYXRlIFByaXZhdGUgR3JvdXBcblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuY3JlYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLXAnKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLm5hbWUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdCb2R5IHBhcmFtIFwibmFtZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzICYmICFfLmlzQXJyYXkodGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcIm1lbWJlcnNcIiBtdXN0IGJlIGFuIGFycmF5IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMgJiYgISh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcyA9PT0gJ29iamVjdCcpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQm9keSBwYXJhbSBcImN1c3RvbUZpZWxkc1wiIG11c3QgYmUgYW4gb2JqZWN0IGlmIHByb3ZpZGVkJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHJlYWRPbmx5ID0gZmFsc2U7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZWFkT25seSA9IHRoaXMuYm9keVBhcmFtcy5yZWFkT25seTtcblx0XHR9XG5cblx0XHRsZXQgaWQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0aWQgPSBNZXRlb3IuY2FsbCgnY3JlYXRlUHJpdmF0ZUdyb3VwJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUsIHRoaXMuYm9keVBhcmFtcy5tZW1iZXJzID8gdGhpcy5ib2R5UGFyYW1zLm1lbWJlcnMgOiBbXSwgcmVhZE9ubHksIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlkLnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuZGVsZXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnZXJhc2VSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChbZmluZFJlc3VsdC5fcm9vbV0sIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pWzBdXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmZpbGVzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCB9KTtcblxuXHRcdGNvbnN0IGZpbGVzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGZpbGVzLFxuXHRcdFx0Y291bnQ6IGZpbGVzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuZ2V0SW50ZWdyYXRpb25zJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0bGV0IGluY2x1ZGVBbGxQcml2YXRlR3JvdXBzID0gdHJ1ZTtcblx0XHRpZiAodHlwZW9mIHRoaXMucXVlcnlQYXJhbXMuaW5jbHVkZUFsbFByaXZhdGVHcm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRpbmNsdWRlQWxsUHJpdmF0ZUdyb3VwcyA9IHRoaXMucXVlcnlQYXJhbXMuaW5jbHVkZUFsbFByaXZhdGVHcm91cHMgPT09ICd0cnVlJztcblx0XHR9XG5cblx0XHRjb25zdCBjaGFubmVsc1RvU2VhcmNoID0gW2AjJHsgZmluZFJlc3VsdC5uYW1lIH1gXTtcblx0XHRpZiAoaW5jbHVkZUFsbFByaXZhdGVHcm91cHMpIHtcblx0XHRcdGNoYW5uZWxzVG9TZWFyY2gucHVzaCgnYWxsX3ByaXZhdGVfZ3JvdXBzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyBjaGFubmVsOiB7ICRpbjogY2hhbm5lbHNUb1NlYXJjaCB9IH0pO1xuXHRcdGNvbnN0IGludGVncmF0aW9ucyA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgX2NyZWF0ZWRBdDogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGludGVncmF0aW9ucyxcblx0XHRcdGNvdW50OiBpbnRlZ3JhdGlvbnMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmhpc3RvcnknLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkLCBjaGVja2VkQXJjaGl2ZWQ6IGZhbHNlIH0pO1xuXG5cdFx0bGV0IGxhdGVzdERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0bGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgb2xkZXN0RGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdG9sZGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZSkge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0bGV0IGNvdW50ID0gMjA7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuY291bnQpIHtcblx0XHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdFx0fVxuXG5cdFx0bGV0IHVucmVhZHMgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzKSB7XG5cdFx0XHR1bnJlYWRzID0gdGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldENoYW5uZWxIaXN0b3J5JywgeyByaWQ6IGZpbmRSZXN1bHQucmlkLCBsYXRlc3Q6IGxhdGVzdERhdGUsIG9sZGVzdDogb2xkZXN0RGF0ZSwgaW5jbHVzaXZlLCBjb3VudCwgdW5yZWFkcyB9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuaW5mbycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQsIGNoZWNrZWRBcmNoaXZlZDogZmFsc2UgfSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRncm91cDogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoZmluZFJlc3VsdC5yaWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmludml0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdhZGRVc2VyVG9Sb29tJywgeyByaWQ6IGZpbmRSZXN1bHQucmlkLCB1c2VybmFtZTogdXNlci51c2VybmFtZSB9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMua2ljaycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVVc2VyRnJvbVJvb20nLCB7IHJpZDogZmluZFJlc3VsdC5yaWQsIHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lIH0pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubGVhdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdsZWF2ZVJvb20nLCBmaW5kUmVzdWx0LnJpZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuLy9MaXN0IFByaXZhdGUgR3JvdXBzIGEgdXNlciBoYXMgYWNjZXNzIHRvXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLmxpc3QnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwge1xuXHRcdFx0dDogJ3AnLFxuXHRcdFx0J3UuX2lkJzogdGhpcy51c2VySWRcblx0XHR9KTtcblxuXHRcdGxldCByb29tcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kKG91clF1ZXJ5KS5mZXRjaCgpLCAnX3Jvb20nKTtcblx0XHRjb25zdCB0b3RhbENvdW50ID0gcm9vbXMubGVuZ3RoO1xuXG5cdFx0cm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5wcm9jZXNzUXVlcnlPcHRpb25zT25SZXN1bHQocm9vbXMsIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3Vwczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IHRvdGFsQ291bnRcblx0XHR9KTtcblx0fVxufSk7XG5cblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5saXN0QWxsJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyB0OiAncCcgfSk7XG5cblx0XHRsZXQgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5KS5mZXRjaCgpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXBzOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5tZW1iZXJzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRsZXQgc29ydEZuID0gKGEsIGIpID0+IGEgPiBiO1xuXHRcdGlmIChNYXRjaC50ZXN0KHNvcnQsIE9iamVjdCkgJiYgTWF0Y2gudGVzdChzb3J0LnVzZXJuYW1lLCBOdW1iZXIpICYmIHNvcnQudXNlcm5hbWUgPT09IC0xKSB7XG5cdFx0XHRzb3J0Rm4gPSAoYSwgYikgPT4gYiA8IGE7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWVtYmVycyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChBcnJheS5mcm9tKGZpbmRSZXN1bHQuX3Jvb20udXNlcm5hbWVzKS5zb3J0KHNvcnRGbiksIHtcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudFxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdXNlcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHsgdXNlcm5hbWU6IHsgJGluOiBtZW1iZXJzIH0gfSwge1xuXHRcdFx0ZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEsIG5hbWU6IDEsIHN0YXR1czogMSwgdXRjT2Zmc2V0OiAxIH0sXG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgdXNlcm5hbWU6IDEgfVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiBtZW1iZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0Ll9yb29tLnVzZXJuYW1lcy5sZW5ndGhcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMubWVzc2FnZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgcmlkOiBmaW5kUmVzdWx0LnJpZCB9KTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzLFxuXHRcdFx0Y291bnQ6IG1lc3NhZ2VzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm9ubGluZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHQ6ICdwJyB9KTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKG91clF1ZXJ5KTtcblxuXHRcdGlmIChyb29tID09IG51bGwpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdHcm91cCBkb2VzIG5vdCBleGlzdHMnKTtcblx0XHR9XG5cblx0XHRjb25zdCBvbmxpbmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHR1c2VybmFtZTogMVxuXHRcdFx0fVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRjb25zdCBvbmxpbmVJblJvb20gPSBbXTtcblx0XHRvbmxpbmUuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdGlmIChyb29tLnVzZXJuYW1lcy5pbmRleE9mKHVzZXIudXNlcm5hbWUpICE9PSAtMSkge1xuXHRcdFx0XHRvbmxpbmVJblJvb20ucHVzaCh7XG5cdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG9ubGluZTogb25saW5lSW5Sb29tXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLm9wZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0Lm9wZW4pIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBUaGUgcHJpdmF0ZSBncm91cCwgJHsgZmluZFJlc3VsdC5uYW1lIH0sIGlzIGFscmVhZHkgb3BlbiBmb3IgdGhlIHNlbmRlcmApO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQucmlkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbW92ZU1vZGVyYXRvcicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdyZW1vdmVSb29tTW9kZXJhdG9yJywgZmluZFJlc3VsdC5yaWQsIHVzZXIuX2lkKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnJlbW92ZU93bmVyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVJvb21Pd25lcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5yZW1vdmVMZWFkZXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgncmVtb3ZlUm9vbUxlYWRlcicsIGZpbmRSZXN1bHQucmlkLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5yZW5hbWUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMubmFtZSB8fCAhdGhpcy5ib2R5UGFyYW1zLm5hbWUudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcIm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogeyByb29tSWQ6IHRoaXMuYm9keVBhcmFtcy5yb29tSWR9LCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21OYW1lJywgdGhpcy5ib2R5UGFyYW1zLm5hbWUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXREZXNjcmlwdGlvbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvbiB8fCAhdGhpcy5ib2R5UGFyYW1zLmRlc2NyaXB0aW9uLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJkZXNjcmlwdGlvblwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCdzYXZlUm9vbVNldHRpbmdzJywgZmluZFJlc3VsdC5yaWQsICdyb29tRGVzY3JpcHRpb24nLCB0aGlzLmJvZHlQYXJhbXMuZGVzY3JpcHRpb24pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZGVzY3JpcHRpb246IHRoaXMuYm9keVBhcmFtcy5kZXNjcmlwdGlvblxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy5zZXRQdXJwb3NlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnB1cnBvc2UgfHwgIXRoaXMuYm9keVBhcmFtcy5wdXJwb3NlLnRyaW0oKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJwdXJwb3NlXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZFByaXZhdGVHcm91cEJ5SWRPck5hbWUoeyBwYXJhbXM6IHRoaXMucmVxdWVzdFBhcmFtcygpLCB1c2VySWQ6IHRoaXMudXNlcklkIH0pO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21EZXNjcmlwdGlvbicsIHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHB1cnBvc2U6IHRoaXMuYm9keVBhcmFtcy5wdXJwb3NlXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnZ3JvdXBzLnNldFJlYWRPbmx5JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ1RoZSBib2R5UGFyYW0gXCJyZWFkT25seVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnJvID09PSB0aGlzLmJvZHlQYXJhbXMucmVhZE9ubHkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgcHJpdmF0ZSBncm91cCByZWFkIG9ubHkgc2V0dGluZyBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3JlYWRPbmx5JywgdGhpcy5ib2R5UGFyYW1zLnJlYWRPbmx5KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGdyb3VwOiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChmaW5kUmVzdWx0LnJpZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSlcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0VG9waWMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudG9waWMgfHwgIXRoaXMuYm9keVBhcmFtcy50b3BpYy50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidG9waWNcIiBpcyByZXF1aXJlZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kUHJpdmF0ZUdyb3VwQnlJZE9yTmFtZSh7IHBhcmFtczogdGhpcy5yZXF1ZXN0UGFyYW1zKCksIHVzZXJJZDogdGhpcy51c2VySWQgfSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRNZXRlb3IuY2FsbCgnc2F2ZVJvb21TZXR0aW5ncycsIGZpbmRSZXN1bHQucmlkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdncm91cHMuc2V0VHlwZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy50eXBlIHx8ICF0aGlzLmJvZHlQYXJhbXMudHlwZS50cmltKCkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgYm9keVBhcmFtIFwidHlwZVwiIGlzIHJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCB9KTtcblxuXHRcdGlmIChmaW5kUmVzdWx0LnQgPT09IHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIHByaXZhdGUgZ3JvdXAgdHlwZSBpcyB0aGUgc2FtZSBhcyB3aGF0IGl0IHdvdWxkIGJlIGNoYW5nZWQgdG8uJyk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJpZCwgJ3Jvb21UeXBlJywgdGhpcy5ib2R5UGFyYW1zLnR5cGUpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Z3JvdXA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbmRSZXN1bHQucmlkLCB7IGZpZWxkczogUm9ja2V0Q2hhdC5BUEkudjEuZGVmYXVsdEZpZWxkc1RvRXhjbHVkZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2dyb3Vwcy51bmFyY2hpdmUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmRQcml2YXRlR3JvdXBCeUlkT3JOYW1lKHsgcGFyYW1zOiB0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdXNlcklkOiB0aGlzLnVzZXJJZCwgY2hlY2tlZEFyY2hpdmVkOiBmYWxzZSB9KTtcblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdE1ldGVvci5jYWxsKCd1bmFyY2hpdmVSb29tJywgZmluZFJlc3VsdC5yaWQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuZnVuY3Rpb24gZmluZERpcmVjdE1lc3NhZ2VSb29tKHBhcmFtcywgdXNlcikge1xuXHRpZiAoKCFwYXJhbXMucm9vbUlkIHx8ICFwYXJhbXMucm9vbUlkLnRyaW0oKSkgJiYgKCFwYXJhbXMudXNlcm5hbWUgfHwgIXBhcmFtcy51c2VybmFtZS50cmltKCkpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbS1wYXJhbS1ub3QtcHJvdmlkZWQnLCAnQm9keSBwYXJhbSBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBpcyByZXF1aXJlZCcpO1xuXHR9XG5cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHtcblx0XHRjdXJyZW50VXNlcklkOiB1c2VyLl9pZCxcblx0XHRuYW1lT3JJZDogcGFyYW1zLnVzZXJuYW1lIHx8IHBhcmFtcy5yb29tSWQsXG5cdFx0dHlwZTogJ2QnXG5cdH0pO1xuXG5cdGlmICghcm9vbSB8fCByb29tLnQgIT09ICdkJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcInJvb21JZFwiIG9yIFwidXNlcm5hbWVcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgZGlyY3QgbWVzc2FnZScpO1xuXHR9XG5cblx0Y29uc3Qgc3Vic2NyaXB0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vbS5faWQsIHVzZXIuX2lkKTtcblxuXHRyZXR1cm4ge1xuXHRcdHJvb20sXG5cdFx0c3Vic2NyaXB0aW9uXG5cdH07XG59XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uY3JlYXRlJywgJ2ltLmNyZWF0ZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHJvb206IGZpbmRSZXN1bHQucm9vbVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5jbG9zZScsICdpbS5jbG9zZSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgZmluZFJlc3VsdCA9IGZpbmREaXJlY3RNZXNzYWdlUm9vbSh0aGlzLnJlcXVlc3RQYXJhbXMoKSwgdGhpcy51c2VyKTtcblxuXHRcdGlmICghZmluZFJlc3VsdC5zdWJzY3JpcHRpb24ub3Blbikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoYFRoZSBkaXJlY3QgbWVzc2FnZSByb29tLCAkeyB0aGlzLmJvZHlQYXJhbXMubmFtZSB9LCBpcyBhbHJlYWR5IGNsb3NlZCB0byB0aGUgc2VuZGVyYCk7XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2hpZGVSb29tJywgZmluZFJlc3VsdC5yb29tLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5maWxlcycsICdpbS5maWxlcyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBmaWxlcyA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRmaWxlcyxcblx0XHRcdGNvdW50OiBmaWxlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZShbJ2RtLmhpc3RvcnknLCAnaW0uaGlzdG9yeSddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0bGV0IGxhdGVzdERhdGUgPSBuZXcgRGF0ZSgpO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmxhdGVzdCkge1xuXHRcdFx0bGF0ZXN0RGF0ZSA9IG5ldyBEYXRlKHRoaXMucXVlcnlQYXJhbXMubGF0ZXN0KTtcblx0XHR9XG5cblx0XHRsZXQgb2xkZXN0RGF0ZSA9IHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy5vbGRlc3QpIHtcblx0XHRcdG9sZGVzdERhdGUgPSBuZXcgRGF0ZSh0aGlzLnF1ZXJ5UGFyYW1zLm9sZGVzdCk7XG5cdFx0fVxuXG5cdFx0bGV0IGluY2x1c2l2ZSA9IGZhbHNlO1xuXHRcdGlmICh0aGlzLnF1ZXJ5UGFyYW1zLmluY2x1c2l2ZSkge1xuXHRcdFx0aW5jbHVzaXZlID0gdGhpcy5xdWVyeVBhcmFtcy5pbmNsdXNpdmU7XG5cdFx0fVxuXG5cdFx0bGV0IGNvdW50ID0gMjA7XG5cdFx0aWYgKHRoaXMucXVlcnlQYXJhbXMuY291bnQpIHtcblx0XHRcdGNvdW50ID0gcGFyc2VJbnQodGhpcy5xdWVyeVBhcmFtcy5jb3VudCk7XG5cdFx0fVxuXG5cdFx0bGV0IHVucmVhZHMgPSBmYWxzZTtcblx0XHRpZiAodGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzKSB7XG5cdFx0XHR1bnJlYWRzID0gdGhpcy5xdWVyeVBhcmFtcy51bnJlYWRzO1xuXHRcdH1cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldENoYW5uZWxIaXN0b3J5Jywge1xuXHRcdFx0XHRyaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQsXG5cdFx0XHRcdGxhdGVzdDogbGF0ZXN0RGF0ZSxcblx0XHRcdFx0b2xkZXN0OiBvbGRlc3REYXRlLFxuXHRcdFx0XHRpbmNsdXNpdmUsXG5cdFx0XHRcdGNvdW50LFxuXHRcdFx0XHR1bnJlYWRzXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MocmVzdWx0KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubWVtYmVycycsICdpbS5tZW1iZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IGZpbmRSZXN1bHQgPSBmaW5kRGlyZWN0TWVzc2FnZVJvb20odGhpcy5yZXF1ZXN0UGFyYW1zKCksIHRoaXMudXNlcik7XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBtZW1iZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMucHJvY2Vzc1F1ZXJ5T3B0aW9uc09uUmVzdWx0KEFycmF5LmZyb20oZmluZFJlc3VsdC5yb29tLnVzZXJuYW1lcyksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogLTEsXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnRcblx0XHR9KTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZCh7IHVzZXJuYW1lOiB7ICRpbjogbWVtYmVycyB9IH0sXG5cdFx0XHR7IGZpZWxkczogeyBfaWQ6IDEsIHVzZXJuYW1lOiAxLCBuYW1lOiAxLCBzdGF0dXM6IDEsIHV0Y09mZnNldDogMSB9IH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZW1iZXJzOiB1c2Vycyxcblx0XHRcdGNvdW50OiBtZW1iZXJzLmxlbmd0aCxcblx0XHRcdG9mZnNldCxcblx0XHRcdHRvdGFsOiBmaW5kUmVzdWx0LnJvb20udXNlcm5hbWVzLmxlbmd0aFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcycsICdpbS5tZXNzYWdlcyddLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0Y29uc29sZS5sb2coZmluZFJlc3VsdCk7XG5cdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyByaWQ6IGZpbmRSZXN1bHQucm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtZXNzYWdlcyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyB0czogLTEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRtZXNzYWdlcyxcblx0XHRcdGNvdW50OiBtZXNzYWdlcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5tZXNzYWdlcy5vdGhlcnMnLCAnaW0ubWVzc2FnZXMub3RoZXJzJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9EaXJlY3RfTWVzc2FnZV9IaXN0b3J5X0VuZFBvaW50JykgIT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9pbS5tZXNzYWdlcy5vdGhlcnMnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1yb29tLWFkbWluaXN0cmF0aW9uJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tSWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLnJvb21JZDtcblx0XHRpZiAoIXJvb21JZCB8fCAhcm9vbUlkLnRyaW0oKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9vbWlkLXBhcmFtLW5vdC1wcm92aWRlZCcsICdUaGUgcGFyYW1ldGVyIFwicm9vbUlkXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblx0XHRpZiAoIXJvb20gfHwgcm9vbS50ICE9PSAnZCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgYE5vIGRpcmVjdCBtZXNzYWdlIHJvb20gZm91bmQgYnkgdGhlIGlkIG9mOiAkeyByb29tSWQgfWApO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7IHJpZDogcm9vbS5faWQgfSk7XG5cblx0XHRjb25zdCBtc2dzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdG1lc3NhZ2VzOiBtc2dzLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0Y291bnQ6IG1zZ3MubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ubGlzdCcsICdpbS5saXN0J10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCB7XG5cdFx0XHR0OiAnZCcsXG5cdFx0XHQndS5faWQnOiB0aGlzLnVzZXJJZFxuXHRcdH0pO1xuXG5cdFx0bGV0IHJvb21zID0gXy5wbHVjayhSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmQob3VyUXVlcnkpLmZldGNoKCksICdfcm9vbScpO1xuXHRcdGNvbnN0IHRvdGFsQ291bnQgPSByb29tcy5sZW5ndGg7XG5cblx0XHRyb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnByb2Nlc3NRdWVyeU9wdGlvbnNPblJlc3VsdChyb29tcywge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IG5hbWU6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW1zOiByb29tcyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGNvdW50OiByb29tcy5sZW5ndGgsXG5cdFx0XHR0b3RhbDogdG90YWxDb3VudFxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoWydkbS5saXN0LmV2ZXJ5b25lJywgJ2ltLmxpc3QuZXZlcnlvbmUnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgdDogJ2QnIH0pO1xuXG5cdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKG91clF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGltczogcm9vbXMsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHRjb3VudDogcm9vbXMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmQob3VyUXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0ub3BlbicsICdpbS5vcGVuJ10sIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0aWYgKCFmaW5kUmVzdWx0LnN1YnNjcmlwdGlvbi5vcGVuKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdvcGVuUm9vbScsIGZpbmRSZXN1bHQucm9vbS5faWQpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKFsnZG0uc2V0VG9waWMnLCAnaW0uc2V0VG9waWMnXSwgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRvcGljIHx8ICF0aGlzLmJvZHlQYXJhbXMudG9waWMudHJpbSgpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnVGhlIGJvZHlQYXJhbSBcInRvcGljXCIgaXMgcmVxdWlyZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCBmaW5kUmVzdWx0ID0gZmluZERpcmVjdE1lc3NhZ2VSb29tKHRoaXMucmVxdWVzdFBhcmFtcygpLCB0aGlzLnVzZXIpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCBmaW5kUmVzdWx0LnJvb20uX2lkLCAncm9vbVRvcGljJywgdGhpcy5ib2R5UGFyYW1zLnRvcGljKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHRvcGljOiB0aGlzLmJvZHlQYXJhbXMudG9waWNcblx0XHR9KTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLmNyZWF0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHRuYW1lOiBTdHJpbmcsXG5cdFx0XHRlbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0dXNlcm5hbWU6IFN0cmluZyxcblx0XHRcdHVybHM6IE1hdGNoLk1heWJlKFtTdHJpbmddKSxcblx0XHRcdGNoYW5uZWw6IFN0cmluZyxcblx0XHRcdGV2ZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dHJpZ2dlcldvcmRzOiBNYXRjaC5NYXliZShbU3RyaW5nXSksXG5cdFx0XHRhbGlhczogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGF2YXRhcjogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dG9rZW46IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRzY3JpcHRFbmFibGVkOiBCb29sZWFuLFxuXHRcdFx0c2NyaXB0OiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0dGFyZ2V0Q2hhbm5lbDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdHN3aXRjaCAodGhpcy5ib2R5UGFyYW1zLnR5cGUpIHtcblx0XHRcdGNhc2UgJ3dlYmhvb2stb3V0Z29pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3dlYmhvb2staW5jb21pbmcnOlxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBNZXRlb3IuY2FsbCgnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdJbnZhbGlkIGludGVncmF0aW9uIHR5cGUuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBpbnRlZ3JhdGlvbiB9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdpbnRlZ3JhdGlvbnMuaGlzdG9yeScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnF1ZXJ5UGFyYW1zLmlkIHx8IHRoaXMucXVlcnlQYXJhbXMuaWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaWQgPSB0aGlzLnF1ZXJ5UGFyYW1zLmlkO1xuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IG91clF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnksIHsgJ2ludGVncmF0aW9uLl9pZCc6IGlkIH0pO1xuXHRcdGNvbnN0IGhpc3RvcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IF91cGRhdGVkQXQ6IC0xIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aGlzdG9yeSxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBoaXN0b3J5Lmxlbmd0aCxcblx0XHRcdHRvdGFsOiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2ludGVncmF0aW9ucy5saXN0JywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcblx0XHRjb25zdCBpbnRlZ3JhdGlvbnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZChvdXJRdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHRzOiAtMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdGludGVncmF0aW9ucyxcblx0XHRcdG9mZnNldCxcblx0XHRcdGl0ZW1zOiBpbnRlZ3JhdGlvbnMubGVuZ3RoLFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKG91clF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnaW50ZWdyYXRpb25zLnJlbW92ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHR0eXBlOiBTdHJpbmcsXG5cdFx0XHR0YXJnZXRfdXJsOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0aW50ZWdyYXRpb25JZDogTWF0Y2guTWF5YmUoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnRhcmdldF91cmwgJiYgIXRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnQW4gaW50ZWdyYXRpb25JZCBvciB0YXJnZXRfdXJsIG5lZWRzIHRvIGJlIHByb3ZpZGVkLicpO1xuXHRcdH1cblxuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblx0XHRzd2l0Y2ggKHRoaXMuYm9keVBhcmFtcy50eXBlKSB7XG5cdFx0XHRjYXNlICd3ZWJob29rLW91dGdvaW5nJzpcblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IHVybHM6IHRoaXMuYm9keVBhcmFtcy50YXJnZXRfdXJsIH0pO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkKSB7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogdGhpcy5ib2R5UGFyYW1zLmludGVncmF0aW9uSWQgfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWludGVncmF0aW9uKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ05vIGludGVncmF0aW9uIGZvdW5kLicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb24uX2lkKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGludGVncmF0aW9uXG5cdFx0XHRcdH0pO1xuXHRcdFx0Y2FzZSAnd2ViaG9vay1pbmNvbWluZyc6XG5cdFx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoeyBfaWQ6IHRoaXMuYm9keVBhcmFtcy5pbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0XHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTm8gaW50ZWdyYXRpb24gZm91bmQuJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24nLCBpbnRlZ3JhdGlvbi5faWQpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdFx0aW50ZWdyYXRpb25cblx0XHRcdFx0fSk7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnSW52YWxpZCBpbnRlZ3JhdGlvbiB0eXBlLicpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2luZm8nLCB7IGF1dGhSZXF1aXJlZDogZmFsc2UgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyKCk7XG5cblx0XHRpZiAodXNlciAmJiBSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdGluZm86IFJvY2tldENoYXQuSW5mb1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0aW5mbzoge1xuXHRcdFx0XHQndmVyc2lvbic6IFJvY2tldENoYXQuSW5mby52ZXJzaW9uXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbWUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBtZSA9IF8ucGljayh0aGlzLnVzZXIsIFtcblx0XHRcdCdfaWQnLFxuXHRcdFx0J25hbWUnLFxuXHRcdFx0J2VtYWlscycsXG5cdFx0XHQnc3RhdHVzJyxcblx0XHRcdCdzdGF0dXNDb25uZWN0aW9uJyxcblx0XHRcdCd1c2VybmFtZScsXG5cdFx0XHQndXRjT2Zmc2V0Jyxcblx0XHRcdCdhY3RpdmUnLFxuXHRcdFx0J2xhbmd1YWdlJ1xuXHRcdF0pO1xuXG5cdFx0Y29uc3QgdmVyaWZpZWRFbWFpbCA9IG1lLmVtYWlscy5maW5kKChlbWFpbCkgPT4gZW1haWwudmVyaWZpZWQpO1xuXG5cdFx0bWUuZW1haWwgPSB2ZXJpZmllZEVtYWlsID8gdmVyaWZpZWRFbWFpbC5hZGRyZXNzIDogdW5kZWZpbmVkO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MobWUpO1xuXHR9XG59KTtcblxubGV0IG9ubGluZUNhY2hlID0gMDtcbmxldCBvbmxpbmVDYWNoZURhdGUgPSAwO1xuY29uc3QgY2FjaGVJbnZhbGlkID0gNjAwMDA7IC8vIDEgbWludXRlXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2hpZWxkLnN2ZycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IHR5cGUsIGNoYW5uZWwsIG5hbWUsIGljb24gfSA9IHRoaXMucXVlcnlQYXJhbXM7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX0VuYWJsZV9TaGllbGRzJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWVuZHBvaW50LWRpc2FibGVkJywgJ1RoaXMgZW5kcG9pbnQgaXMgZGlzYWJsZWQnLCB7IHJvdXRlOiAnL2FwaS92MS9zaGllbGQuc3ZnJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfU2hpZWxkX1R5cGVzJyk7XG5cdFx0aWYgKHR5cGUgJiYgKHR5cGVzICE9PSAnKicgJiYgIXR5cGVzLnNwbGl0KCcsJykubWFwKCh0KSA9PiB0LnRyaW0oKSkuaW5jbHVkZXModHlwZSkpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zaGllbGQtZGlzYWJsZWQnLCAnVGhpcyBzaGllbGQgdHlwZSBpcyBkaXNhYmxlZCcsIHsgcm91dGU6ICcvYXBpL3YxL3NoaWVsZC5zdmcnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhpZGVJY29uID0gaWNvbiA9PT0gJ2ZhbHNlJztcblx0XHRpZiAoaGlkZUljb24gJiYgKCFuYW1lIHx8ICFuYW1lLnRyaW0oKSkpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdOYW1lIGNhbm5vdCBiZSBlbXB0eSB3aGVuIGljb24gaXMgaGlkZGVuJyk7XG5cdFx0fVxuXG5cdFx0bGV0IHRleHQ7XG5cdFx0bGV0IGJhY2tncm91bmRDb2xvciA9ICcjNGMxJztcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ29ubGluZSc6XG5cdFx0XHRcdGlmIChEYXRlLm5vdygpIC0gb25saW5lQ2FjaGVEYXRlID4gY2FjaGVJbnZhbGlkKSB7XG5cdFx0XHRcdFx0b25saW5lQ2FjaGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNOb3RPZmZsaW5lKCkuY291bnQoKTtcblx0XHRcdFx0XHRvbmxpbmVDYWNoZURhdGUgPSBEYXRlLm5vdygpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGV4dCA9IGAkeyBvbmxpbmVDYWNoZSB9ICR7IFRBUGkxOG4uX18oJ09ubGluZScpIH1gO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2NoYW5uZWwnOlxuXHRcdFx0XHRpZiAoIWNoYW5uZWwpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnU2hpZWxkIGNoYW5uZWwgaXMgcmVxdWlyZWQgZm9yIHR5cGUgXCJjaGFubmVsXCInKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRleHQgPSBgIyR7IGNoYW5uZWwgfWA7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAndXNlcic6XG5cdFx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRcdFx0Ly8gUmVzcGVjdCB0aGUgc2VydmVyJ3MgY2hvaWNlIGZvciB1c2luZyB0aGVpciByZWFsIG5hbWVzIG9yIG5vdFxuXHRcdFx0XHRpZiAodXNlci5uYW1lICYmIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVSV9Vc2VfUmVhbF9OYW1lJykpIHtcblx0XHRcdFx0XHR0ZXh0ID0gYCR7IHVzZXIubmFtZSB9YDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0ZXh0ID0gYEAkeyB1c2VyLnVzZXJuYW1lIH1gO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0c3dpdGNoICh1c2VyLnN0YXR1cykge1xuXHRcdFx0XHRcdGNhc2UgJ29ubGluZSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnIzFmYjMxZic7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICdhd2F5Jzpcblx0XHRcdFx0XHRcdGJhY2tncm91bmRDb2xvciA9ICcjZGM5YjAxJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ2J1c3knOlxuXHRcdFx0XHRcdFx0YmFja2dyb3VuZENvbG9yID0gJyNiYzIwMzEnO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAnb2ZmbGluZSc6XG5cdFx0XHRcdFx0XHRiYWNrZ3JvdW5kQ29sb3IgPSAnI2E1YTFhMSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0ZXh0ID0gVEFQaTE4bi5fXygnSm9pbl9DaGF0JykudG9VcHBlckNhc2UoKTtcblx0XHR9XG5cblx0XHRjb25zdCBpY29uU2l6ZSA9IGhpZGVJY29uID8gNyA6IDI0O1xuXHRcdGNvbnN0IGxlZnRTaXplID0gbmFtZSA/IG5hbWUubGVuZ3RoICogNiArIDcgKyBpY29uU2l6ZSA6IGljb25TaXplO1xuXHRcdGNvbnN0IHJpZ2h0U2l6ZSA9IHRleHQubGVuZ3RoICogNiArIDIwO1xuXHRcdGNvbnN0IHdpZHRoID0gbGVmdFNpemUgKyByaWdodFNpemU7XG5cdFx0Y29uc3QgaGVpZ2h0ID0gMjA7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdpbWFnZS9zdmcreG1sO2NoYXJzZXQ9dXRmLTgnIH0sXG5cdFx0XHRib2R5OiBgXG5cdFx0XHRcdDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHdpZHRoPVwiJHsgd2lkdGggfVwiIGhlaWdodD1cIiR7IGhlaWdodCB9XCI+XG5cdFx0XHRcdCAgPGxpbmVhckdyYWRpZW50IGlkPVwiYlwiIHgyPVwiMFwiIHkyPVwiMTAwJVwiPlxuXHRcdFx0XHQgICAgPHN0b3Agb2Zmc2V0PVwiMFwiIHN0b3AtY29sb3I9XCIjYmJiXCIgc3RvcC1vcGFjaXR5PVwiLjFcIi8+XG5cdFx0XHRcdCAgICA8c3RvcCBvZmZzZXQ9XCIxXCIgc3RvcC1vcGFjaXR5PVwiLjFcIi8+XG5cdFx0XHRcdCAgPC9saW5lYXJHcmFkaWVudD5cblx0XHRcdFx0ICA8bWFzayBpZD1cImFcIj5cblx0XHRcdFx0ICAgIDxyZWN0IHdpZHRoPVwiJHsgd2lkdGggfVwiIGhlaWdodD1cIiR7IGhlaWdodCB9XCIgcng9XCIzXCIgZmlsbD1cIiNmZmZcIi8+XG5cdFx0XHRcdCAgPC9tYXNrPlxuXHRcdFx0XHQgIDxnIG1hc2s9XCJ1cmwoI2EpXCI+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwiIzU1NVwiIGQ9XCJNMCAwaCR7IGxlZnRTaXplIH12JHsgaGVpZ2h0IH1IMHpcIi8+XG5cdFx0XHRcdCAgICA8cGF0aCBmaWxsPVwiJHsgYmFja2dyb3VuZENvbG9yIH1cIiBkPVwiTSR7IGxlZnRTaXplIH0gMGgkeyByaWdodFNpemUgfXYkeyBoZWlnaHQgfUgkeyBsZWZ0U2l6ZSB9elwiLz5cblx0XHRcdFx0ICAgIDxwYXRoIGZpbGw9XCJ1cmwoI2IpXCIgZD1cIk0wIDBoJHsgd2lkdGggfXYkeyBoZWlnaHQgfUgwelwiLz5cblx0XHRcdFx0ICA8L2c+XG5cdFx0XHRcdCAgICAkeyBoaWRlSWNvbiA/ICcnIDogJzxpbWFnZSB4PVwiNVwiIHk9XCIzXCIgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgeGxpbms6aHJlZj1cIi9hc3NldHMvZmF2aWNvbi5zdmdcIi8+JyB9XG5cdFx0XHRcdCAgPGcgZmlsbD1cIiNmZmZcIiBmb250LWZhbWlseT1cIkRlamFWdSBTYW5zLFZlcmRhbmEsR2VuZXZhLHNhbnMtc2VyaWZcIiBmb250LXNpemU9XCIxMVwiPlxuXHRcdFx0XHRcdFx0JHsgbmFtZSA/IGA8dGV4dCB4PVwiJHsgaWNvblNpemUgfVwiIHk9XCIxNVwiIGZpbGw9XCIjMDEwMTAxXCIgZmlsbC1vcGFjaXR5PVwiLjNcIj4keyBuYW1lIH08L3RleHQ+XG5cdFx0XHRcdCAgICA8dGV4dCB4PVwiJHsgaWNvblNpemUgfVwiIHk9XCIxNFwiPiR7IG5hbWUgfTwvdGV4dD5gIDogJycgfVxuXHRcdFx0XHQgICAgPHRleHQgeD1cIiR7IGxlZnRTaXplICsgNyB9XCIgeT1cIjE1XCIgZmlsbD1cIiMwMTAxMDFcIiBmaWxsLW9wYWNpdHk9XCIuM1wiPiR7IHRleHQgfTwvdGV4dD5cblx0XHRcdFx0ICAgIDx0ZXh0IHg9XCIkeyBsZWZ0U2l6ZSArIDcgfVwiIHk9XCIxNFwiPiR7IHRleHQgfTwvdGV4dD5cblx0XHRcdFx0ICA8L2c+XG5cdFx0XHRcdDwvc3ZnPlxuXHRcdFx0YC50cmltKCkucmVwbGFjZSgvXFw+W1xcc10rXFw8L2dtLCAnPjwnKVxuXHRcdH07XG5cdH1cbn0pO1xuIiwiLyoqXG5cdFRoaXMgQVBJIHJldHVybnMgYWxsIHBlcm1pc3Npb25zIHRoYXQgZXhpc3RzXG5cdG9uIHRoZSBzZXJ2ZXIsIHdpdGggcmVzcGVjdGl2ZSByb2xlcy5cblxuXHRNZXRob2Q6IEdFVFxuXHRSb3V0ZTogYXBpL3YxL3Blcm1pc3Npb25zXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdwZXJtaXNzaW9ucycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdwZXJtaXNzaW9ucy9nZXQnKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhyZXN1bHQpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgUHVzaCAqL1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgncHVzaC50b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjb25zdCB7IHR5cGUsIHZhbHVlLCBhcHBOYW1lIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cdFx0bGV0IHsgaWQgfSA9IHRoaXMuYm9keVBhcmFtcztcblxuXHRcdGlmIChpZCAmJiB0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pZC1wYXJhbS1ub3QtdmFsaWQnLCAnVGhlIHJlcXVpcmVkIFwiaWRcIiBib2R5IHBhcmFtIGlzIGludmFsaWQuJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlkID0gUmFuZG9tLmlkKCk7XG5cdFx0fVxuXG5cdFx0aWYgKCF0eXBlIHx8ICh0eXBlICE9PSAnYXBuJyAmJiB0eXBlICE9PSAnZ2NtJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXR5cGUtcGFyYW0tbm90LXZhbGlkJywgJ1RoZSByZXF1aXJlZCBcInR5cGVcIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblx0XHRpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXRva2VuLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJ0b2tlblwiIGJvZHkgcGFyYW0gaXMgbWlzc2luZyBvciBpbnZhbGlkLicpO1xuXHRcdH1cblxuXHRcdGlmICghYXBwTmFtZSB8fCB0eXBlb2YgYXBwTmFtZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFwcE5hbWUtcGFyYW0tbm90LXZhbGlkJywgJ1RoZSByZXF1aXJlZCBcImFwcE5hbWVcIiBib2R5IHBhcmFtIGlzIG1pc3Npbmcgb3IgaW52YWxpZC4nKTtcblx0XHR9XG5cblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gcmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ3JhaXg6cHVzaC11cGRhdGUnLCB7XG5cdFx0XHRpZCxcblx0XHRcdHRva2VuOiB7IFt0eXBlXTogdmFsdWUgfSxcblx0XHRcdGFwcE5hbWUsXG5cdFx0XHR1c2VySWQ6IHRoaXMudXNlcklkXG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyByZXN1bHQgfSk7XG5cdH0sXG5cdGRlbGV0ZSgpIHtcblx0XHRjb25zdCB7IHRva2VuIH0gPSB0aGlzLmJvZHlQYXJhbXM7XG5cblx0XHRpZiAoIXRva2VuIHx8IHR5cGVvZiB0b2tlbiAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXRva2VuLXBhcmFtLW5vdC12YWxpZCcsICdUaGUgcmVxdWlyZWQgXCJ0b2tlblwiIGJvZHkgcGFyYW0gaXMgbWlzc2luZyBvciBpbnZhbGlkLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFmZmVjdGVkUmVjb3JkcyA9IFB1c2guYXBwQ29sbGVjdGlvbi5yZW1vdmUoe1xuXHRcdFx0JG9yOiBbe1xuXHRcdFx0XHQndG9rZW4uYXBuJzogdG9rZW5cblx0XHRcdH0sIHtcblx0XHRcdFx0J3Rva2VuLmdjbSc6IHRva2VuXG5cdFx0XHR9XSxcblx0XHRcdHVzZXJJZDogdGhpcy51c2VySWRcblx0XHR9KTtcblxuXHRcdGlmIChhZmZlY3RlZFJlY29yZHMgPT09IDApIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbi8vIHNldHRpbmdzIGVuZHBvaW50c1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NldHRpbmdzLnB1YmxpYycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRsZXQgb3VyUXVlcnkgPSB7XG5cdFx0XHRoaWRkZW46IHsgJG5lOiB0cnVlIH0sXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH07XG5cblx0XHRvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCBvdXJRdWVyeSk7XG5cblx0XHRjb25zdCBzZXR0aW5ncyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfaWQ6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkczogT2JqZWN0LmFzc2lnbih7IF9pZDogMSwgdmFsdWU6IDEgfSwgZmllbGRzKVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzZXR0aW5ncyxcblx0XHRcdGNvdW50OiBzZXR0aW5ncy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NldHRpbmdzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0bGV0IG91clF1ZXJ5ID0ge1xuXHRcdFx0aGlkZGVuOiB7ICRuZTogdHJ1ZSB9XG5cdFx0fTtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1wcml2aWxlZ2VkLXNldHRpbmcnKSkge1xuXHRcdFx0b3VyUXVlcnkucHVibGljID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRvdXJRdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5LCBvdXJRdWVyeSk7XG5cblx0XHRjb25zdCBzZXR0aW5ncyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQob3VyUXVlcnksIHtcblx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfaWQ6IDEgfSxcblx0XHRcdHNraXA6IG9mZnNldCxcblx0XHRcdGxpbWl0OiBjb3VudCxcblx0XHRcdGZpZWxkczogT2JqZWN0LmFzc2lnbih7IF9pZDogMSwgdmFsdWU6IDEgfSwgZmllbGRzKVxuXHRcdH0pLmZldGNoKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzZXR0aW5ncyxcblx0XHRcdGNvdW50OiBzZXR0aW5ncy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChvdXJRdWVyeSkuY291bnQoKVxuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3NldHRpbmdzLzpfaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcyhfLnBpY2soUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKSwgJ19pZCcsICd2YWx1ZScpKTtcblx0fSxcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtcHJpdmlsZWdlZC1zZXR0aW5nJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHZhbHVlOiBNYXRjaC5Bbnlcblx0XHR9KTtcblxuXHRcdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy51cGRhdGVWYWx1ZU5vdEhpZGRlbkJ5SWQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMudmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnc2VydmljZS5jb25maWd1cmF0aW9ucycsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCBTZXJ2aWNlQ29uZmlndXJhdGlvbiA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddLlNlcnZpY2VDb25maWd1cmF0aW9uO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0Y29uZmlndXJhdGlvbnM6IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmQoe30sIHtmaWVsZHM6IHtzZWNyZXQ6IDB9fSkuZmV0Y2goKVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIlJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzdGF0aXN0aWNzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0bGV0IHJlZnJlc2ggPSBmYWxzZTtcblx0XHRpZiAodHlwZW9mIHRoaXMucXVlcnlQYXJhbXMucmVmcmVzaCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5xdWVyeVBhcmFtcy5yZWZyZXNoID09PSAndHJ1ZScpIHtcblx0XHRcdHJlZnJlc2ggPSB0cnVlO1xuXHRcdH1cblxuXHRcdGxldCBzdGF0cztcblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRzdGF0cyA9IE1ldGVvci5jYWxsKCdnZXRTdGF0aXN0aWNzJywgcmVmcmVzaCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRzdGF0aXN0aWNzOiBzdGF0c1xuXHRcdH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3N0YXRpc3RpY3MubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1zdGF0aXN0aWNzJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB7IG9mZnNldCwgY291bnQgfSA9IHRoaXMuZ2V0UGFnaW5hdGlvbkl0ZW1zKCk7XG5cdFx0Y29uc3QgeyBzb3J0LCBmaWVsZHMsIHF1ZXJ5IH0gPSB0aGlzLnBhcnNlSnNvblF1ZXJ5KCk7XG5cblx0XHRjb25zdCBzdGF0aXN0aWNzID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3RhdGlzdGljcy5maW5kKHF1ZXJ5LCB7XG5cdFx0XHRzb3J0OiBzb3J0ID8gc29ydCA6IHsgbmFtZTogMSB9LFxuXHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0ZmllbGRzXG5cdFx0fSkuZmV0Y2goKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdHN0YXRpc3RpY3MsXG5cdFx0XHRjb3VudDogc3RhdGlzdGljcy5sZW5ndGgsXG5cdFx0XHRvZmZzZXQsXG5cdFx0XHR0b3RhbDogUm9ja2V0Q2hhdC5tb2RlbHMuU3RhdGlzdGljcy5maW5kKHF1ZXJ5KS5jb3VudCgpXG5cdFx0fSk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgQnVzYm95IGZyb20gJ2J1c2JveSc7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5jcmVhdGUnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHRlbWFpbDogU3RyaW5nLFxuXHRcdFx0bmFtZTogU3RyaW5nLFxuXHRcdFx0cGFzc3dvcmQ6IFN0cmluZyxcblx0XHRcdHVzZXJuYW1lOiBTdHJpbmcsXG5cdFx0XHRhY3RpdmU6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0cm9sZXM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdGpvaW5EZWZhdWx0Q2hhbm5lbHM6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0cmVxdWlyZVBhc3N3b3JkQ2hhbmdlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdHNlbmRXZWxjb21lRW1haWw6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0dmVyaWZpZWQ6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiBNYXRjaC5NYXliZShPYmplY3QpXG5cdFx0fSk7XG5cblx0XHQvL05ldyBjaGFuZ2UgbWFkZSBieSBwdWxsIHJlcXVlc3QgIzUxNTJcblx0XHRpZiAodHlwZW9mIHRoaXMuYm9keVBhcmFtcy5qb2luRGVmYXVsdENoYW5uZWxzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhpcy5ib2R5UGFyYW1zLmpvaW5EZWZhdWx0Q2hhbm5lbHMgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnZhbGlkYXRlQ3VzdG9tRmllbGRzKHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG5ld1VzZXJJZCA9IFJvY2tldENoYXQuc2F2ZVVzZXIodGhpcy51c2VySWQsIHRoaXMuYm9keVBhcmFtcyk7XG5cblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zYXZlQ3VzdG9tRmllbGRzV2l0aG91dFZhbGlkYXRpb24obmV3VXNlcklkLCB0aGlzLmJvZHlQYXJhbXMuY3VzdG9tRmllbGRzKTtcblx0XHR9XG5cblxuXHRcdGlmICh0eXBlb2YgdGhpcy5ib2R5UGFyYW1zLmFjdGl2ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFVzZXJBY3RpdmVTdGF0dXMnLCBuZXdVc2VySWQsIHRoaXMuYm9keVBhcmFtcy5hY3RpdmUpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1c2VyOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChuZXdVc2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmRlbGV0ZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2RlbGV0ZS11c2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZVVzZXInLCB1c2VyLl9pZCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmdldEF2YXRhcicsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRVc2VyRnJvbVBhcmFtcygpO1xuXG5cdFx0Y29uc3QgdXJsID0gUm9ja2V0Q2hhdC5nZXRVUkwoYC9hdmF0YXIvJHsgdXNlci51c2VybmFtZSB9YCwgeyBjZG46IGZhbHNlLCBmdWxsOiB0cnVlIH0pO1xuXHRcdHRoaXMucmVzcG9uc2Uuc2V0SGVhZGVyKCdMb2NhdGlvbicsIHVybCk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RhdHVzQ29kZTogMzA3LFxuXHRcdFx0Ym9keTogdXJsXG5cdFx0fTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5nZXRQcmVzZW5jZScsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICh0aGlzLmlzVXNlckZyb21QYXJhbXMoKSkge1xuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMudXNlcklkKTtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0cHJlc2VuY2U6IHVzZXIuc3RhdHVzLFxuXHRcdFx0XHRjb25uZWN0aW9uU3RhdHVzOiB1c2VyLnN0YXR1c0Nvbm5lY3Rpb24sXG5cdFx0XHRcdGxhc3RMb2dpbjogdXNlci5sYXN0TG9naW5cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRwcmVzZW5jZTogdXNlci5zdGF0dXNcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5pbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdGxldCByZXN1bHQ7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0cmVzdWx0ID0gTWV0ZW9yLmNhbGwoJ2dldEZ1bGxVc2VyRGF0YScsIHsgZmlsdGVyOiB1c2VyLnVzZXJuYW1lLCBsaW1pdDogMSB9KTtcblx0XHR9KTtcblxuXHRcdGlmICghcmVzdWx0IHx8IHJlc3VsdC5sZW5ndGggIT09IDEpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGBGYWlsZWQgdG8gZ2V0IHRoZSB1c2VyIGRhdGEgZm9yIHRoZSB1c2VySWQgb2YgXCIkeyB1c2VyLl9pZCB9XCIuYCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dXNlcjogcmVzdWx0WzBdXG5cdFx0fSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMubGlzdCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1kLXJvb20nKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHsgb2Zmc2V0LCBjb3VudCB9ID0gdGhpcy5nZXRQYWdpbmF0aW9uSXRlbXMoKTtcblx0XHRjb25zdCB7IHNvcnQsIGZpZWxkcywgcXVlcnkgfSA9IHRoaXMucGFyc2VKc29uUXVlcnkoKTtcblxuXHRcdGNvbnN0IHVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZChxdWVyeSwge1xuXHRcdFx0c29ydDogc29ydCA/IHNvcnQgOiB7IHVzZXJuYW1lOiAxIH0sXG5cdFx0XHRza2lwOiBvZmZzZXQsXG5cdFx0XHRsaW1pdDogY291bnQsXG5cdFx0XHRmaWVsZHNcblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0dXNlcnMsXG5cdFx0XHRjb3VudDogdXNlcnMubGVuZ3RoLFxuXHRcdFx0b2Zmc2V0LFxuXHRcdFx0dG90YWw6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmQocXVlcnkpLmNvdW50KClcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5yZWdpc3RlcicsIHsgYXV0aFJlcXVpcmVkOiBmYWxzZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKHRoaXMudXNlcklkKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnTG9nZ2VkIGluIHVzZXJzIGNhbiBub3QgcmVnaXN0ZXIgYWdhaW4uJyk7XG5cdFx0fVxuXG5cdFx0Ly9XZSBzZXQgdGhlaXIgdXNlcm5hbWUgaGVyZSwgc28gcmVxdWlyZSBpdFxuXHRcdC8vVGhlIGByZWdpc3RlclVzZXJgIGNoZWNrcyBmb3IgdGhlIG90aGVyIHJlcXVpcmVtZW50c1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdHVzZXJuYW1lOiBTdHJpbmdcblx0XHR9KSk7XG5cblx0XHQvL1JlZ2lzdGVyIHRoZSB1c2VyXG5cdFx0Y29uc3QgdXNlcklkID0gTWV0ZW9yLmNhbGwoJ3JlZ2lzdGVyVXNlcicsIHRoaXMuYm9keVBhcmFtcyk7XG5cblx0XHQvL05vdyBzZXQgdGhlaXIgdXNlcm5hbWVcblx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ3NldFVzZXJuYW1lJywgdGhpcy5ib2R5UGFyYW1zLnVzZXJuYW1lKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSkgfSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMucmVzZXRBdmF0YXInLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3QoKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblxuXHRcdGlmICh1c2VyLl9pZCA9PT0gdGhpcy51c2VySWQpIHtcblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IE1ldGVvci5jYWxsKCdyZXNldEF2YXRhcicpKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2VkaXQtb3RoZXItdXNlci1pbmZvJykpIHtcblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IE1ldGVvci5jYWxsKCdyZXNldEF2YXRhcicpKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuc2V0QXZhdGFyJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdGF2YXRhclVybDogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdHVzZXJJZDogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdHVzZXJuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpXG5cdFx0fSkpO1xuXG5cdFx0bGV0IHVzZXI7XG5cdFx0aWYgKHRoaXMuaXNVc2VyRnJvbVBhcmFtcygpKSB7XG5cdFx0XHR1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnZWRpdC1vdGhlci11c2VyLWluZm8nKSkge1xuXHRcdFx0dXNlciA9IHRoaXMuZ2V0VXNlckZyb21QYXJhbXMoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdGlmICh0aGlzLmJvZHlQYXJhbXMuYXZhdGFyVXJsKSB7XG5cdFx0XHRcdFJvY2tldENoYXQuc2V0VXNlckF2YXRhcih1c2VyLCB0aGlzLmJvZHlQYXJhbXMuYXZhdGFyVXJsLCAnJywgJ3VybCcpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgYnVzYm95ID0gbmV3IEJ1c2JveSh7IGhlYWRlcnM6IHRoaXMucmVxdWVzdC5oZWFkZXJzIH0pO1xuXG5cdFx0XHRcdE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRcdFx0YnVzYm95Lm9uKCdmaWxlJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZmllbGRuYW1lLCBmaWxlLCBmaWxlbmFtZSwgZW5jb2RpbmcsIG1pbWV0eXBlKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoZmllbGRuYW1lICE9PSAnaW1hZ2UnKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWZpZWxkJykpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjb25zdCBpbWFnZURhdGEgPSBbXTtcblx0XHRcdFx0XHRcdGZpbGUub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChkYXRhKSA9PiB7XG5cdFx0XHRcdFx0XHRcdGltYWdlRGF0YS5wdXNoKGRhdGEpO1xuXHRcdFx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdFx0XHRmaWxlLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZXRVc2VyQXZhdGFyKHVzZXIsIEJ1ZmZlci5jb25jYXQoaW1hZ2VEYXRhKSwgbWltZXR5cGUsICdyZXN0Jyk7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRcdFx0XHR9KSk7XG5cblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdFx0dGhpcy5yZXF1ZXN0LnBpcGUoYnVzYm95KTtcblx0XHRcdFx0fSkoKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMudXBkYXRlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0dXNlcklkOiBTdHJpbmcsXG5cdFx0XHRkYXRhOiBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRlbWFpbDogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0bmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0cGFzc3dvcmQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHVzZXJuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRhY3RpdmU6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRyb2xlczogTWF0Y2guTWF5YmUoQXJyYXkpLFxuXHRcdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0cmVxdWlyZVBhc3N3b3JkQ2hhbmdlOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0c2VuZFdlbGNvbWVFbWFpbDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdHZlcmlmaWVkOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0Y3VzdG9tRmllbGRzOiBNYXRjaC5NYXliZShPYmplY3QpXG5cdFx0XHR9KVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdXNlckRhdGEgPSBfLmV4dGVuZCh7IF9pZDogdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCB9LCB0aGlzLmJvZHlQYXJhbXMuZGF0YSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBSb2NrZXRDaGF0LnNhdmVVc2VyKHRoaXMudXNlcklkLCB1c2VyRGF0YSkpO1xuXG5cdFx0aWYgKHRoaXMuYm9keVBhcmFtcy5kYXRhLmN1c3RvbUZpZWxkcykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zYXZlQ3VzdG9tRmllbGRzKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHRoaXMuYm9keVBhcmFtcy5kYXRhLmN1c3RvbUZpZWxkcyk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB0aGlzLmJvZHlQYXJhbXMuZGF0YS5hY3RpdmUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCwgdGhpcy5ib2R5UGFyYW1zLmRhdGEuYWN0aXZlKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy5ib2R5UGFyYW1zLnVzZXJJZCwgeyBmaWVsZHM6IFJvY2tldENoYXQuQVBJLnYxLmRlZmF1bHRGaWVsZHNUb0V4Y2x1ZGUgfSkgfSk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMudXBkYXRlT3duQmFzaWNJbmZvJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNoZWNrKHRoaXMuYm9keVBhcmFtcywge1xuXHRcdFx0ZGF0YTogTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcblx0XHRcdFx0ZW1haWw6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5hbWU6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHVzZXJuYW1lOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRjdXJyZW50UGFzc3dvcmQ6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5ld1Bhc3N3b3JkOiBNYXRjaC5NYXliZShTdHJpbmcpXG5cdFx0XHR9KSxcblx0XHRcdGN1c3RvbUZpZWxkczogTWF0Y2guTWF5YmUoT2JqZWN0KVxuXHRcdH0pO1xuXG5cdFx0Y29uc3QgdXNlckRhdGEgPSB7XG5cdFx0XHRlbWFpbDogdGhpcy5ib2R5UGFyYW1zLmRhdGEuZW1haWwsXG5cdFx0XHRyZWFsbmFtZTogdGhpcy5ib2R5UGFyYW1zLmRhdGEubmFtZSxcblx0XHRcdHVzZXJuYW1lOiB0aGlzLmJvZHlQYXJhbXMuZGF0YS51c2VybmFtZSxcblx0XHRcdG5ld1Bhc3N3b3JkOiB0aGlzLmJvZHlQYXJhbXMuZGF0YS5uZXdQYXNzd29yZCxcblx0XHRcdHR5cGVkUGFzc3dvcmQ6IHRoaXMuYm9keVBhcmFtcy5kYXRhLmN1cnJlbnRQYXNzd29yZFxuXHRcdH07XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKHRoaXMudXNlcklkLCAoKSA9PiBNZXRlb3IuY2FsbCgnc2F2ZVVzZXJQcm9maWxlJywgdXNlckRhdGEsIHRoaXMuYm9keVBhcmFtcy5jdXN0b21GaWVsZHMpKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlcjogUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQsIHsgZmllbGRzOiBSb2NrZXRDaGF0LkFQSS52MS5kZWZhdWx0RmllbGRzVG9FeGNsdWRlIH0pIH0pO1xuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXJzLmNyZWF0ZVRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFVzZXJGcm9tUGFyYW1zKCk7XG5cdFx0bGV0IGRhdGE7XG5cdFx0TWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0ZGF0YSA9IE1ldGVvci5jYWxsKCdjcmVhdGVUb2tlbicsIHVzZXIuX2lkKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gZGF0YSA/IFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBkYXRhIH0pIDogUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgndXNlcnMuZ2V0UHJlZmVyZW5jZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQpO1xuXHRcdGlmICh1c2VyLnNldHRpbmdzKSB7XG5cdFx0XHRjb25zdCBwcmVmZXJlbmNlcyA9IHVzZXIuc2V0dGluZ3MucHJlZmVyZW5jZXM7XG5cdFx0XHRwcmVmZXJlbmNlc1snbGFuZ3VhZ2UnXSA9IHVzZXIubGFuZ3VhZ2U7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0cHJlZmVyZW5jZXNcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShUQVBpMThuLl9fKCdBY2NvdW50c19EZWZhdWx0X1VzZXJfUHJlZmVyZW5jZXNfbm90X2F2YWlsYWJsZScpLnRvVXBwZXJDYXNlKCkpO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCd1c2Vycy5zZXRQcmVmZXJlbmNlcycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdCgpIHtcblx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdHVzZXJJZDogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdGRhdGE6IE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRcdG5ld1Jvb21Ob3RpZmljYXRpb246IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdG5ld01lc3NhZ2VOb3RpZmljYXRpb246IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHVzZUVtb2ppczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGNvbnZlcnRBc2NpaUVtb2ppOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0c2F2ZU1vYmlsZUJhbmR3aWR0aDogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGNvbGxhcHNlTWVkaWFCeURlZmF1bHQ6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRhdXRvSW1hZ2VMb2FkOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0ZW1haWxOb3RpZmljYXRpb25Nb2RlOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRyb29tc0xpc3RFeGhpYml0aW9uTW9kZTogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0dW5yZWFkQWxlcnQ6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRub3RpZmljYXRpb25zU291bmRWb2x1bWU6IE1hdGNoLk1heWJlKE51bWJlciksXG5cdFx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRtb2JpbGVOb3RpZmljYXRpb25zOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0XHRlbmFibGVBdXRvQXdheTogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZ2hsaWdodHM6IE1hdGNoLk1heWJlKEFycmF5KSxcblx0XHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbkR1cmF0aW9uOiBNYXRjaC5NYXliZShOdW1iZXIpLFxuXHRcdFx0XHR2aWV3TW9kZTogTWF0Y2guTWF5YmUoTnVtYmVyKSxcblx0XHRcdFx0aGlkZVVzZXJuYW1lczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZGVSb2xlczogTWF0Y2guTWF5YmUoQm9vbGVhbiksXG5cdFx0XHRcdGhpZGVBdmF0YXJzOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0aGlkZUZsZXhUYWI6IE1hdGNoLk1heWJlKEJvb2xlYW4pLFxuXHRcdFx0XHRzZW5kT25FbnRlcjogTWF0Y2guTWF5YmUoU3RyaW5nKSxcblx0XHRcdFx0cm9vbUNvdW50ZXJTaWRlYmFyOiBNYXRjaC5NYXliZShCb29sZWFuKSxcblx0XHRcdFx0bGFuZ3VhZ2U6IE1hdGNoLk1heWJlKFN0cmluZyksXG5cdFx0XHRcdHNpZGViYXJTaG93RmF2b3JpdGVzOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdFx0c2lkZWJhclNob3dVbnJlYWQ6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0XHRzaWRlYmFyU29ydGJ5OiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0XHRzaWRlYmFyVmlld01vZGU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRcdHNpZGViYXJIaWRlQXZhdGFyOiBNYXRjaC5PcHRpb25hbChCb29sZWFuKSxcblx0XHRcdFx0bWVyZ2VDaGFubmVsczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbiksXG5cdFx0XHRcdG11dGVGb2N1c2VkQ29udmVyc2F0aW9uczogTWF0Y2guT3B0aW9uYWwoQm9vbGVhbilcblx0XHRcdH0pXG5cdFx0fSk7XG5cblx0XHRsZXQgcHJlZmVyZW5jZXM7XG5cdFx0Y29uc3QgdXNlcklkID0gdGhpcy5ib2R5UGFyYW1zLnVzZXJJZCA/IHRoaXMuYm9keVBhcmFtcy51c2VySWQgOiB0aGlzLnVzZXJJZDtcblx0XHRpZiAodGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2UpIHtcblx0XHRcdGNvbnN0IGxhbmd1YWdlID0gdGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2U7XG5cdFx0XHRkZWxldGUgdGhpcy5ib2R5UGFyYW1zLmRhdGEubGFuZ3VhZ2U7XG5cdFx0XHRwcmVmZXJlbmNlcyA9IF8uZXh0ZW5kKHsgX2lkOiB1c2VySWQsIHNldHRpbmdzOiB7IHByZWZlcmVuY2VzOiB0aGlzLmJvZHlQYXJhbXMuZGF0YSB9LCBsYW5ndWFnZSB9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cHJlZmVyZW5jZXMgPSBfLmV4dGVuZCh7IF9pZDogdXNlcklkLCBzZXR0aW5nczogeyBwcmVmZXJlbmNlczogdGhpcy5ib2R5UGFyYW1zLmRhdGEgfX0pO1xuXHRcdH1cblxuXHRcdE1ldGVvci5ydW5Bc1VzZXIodGhpcy51c2VySWQsICgpID0+IFJvY2tldENoYXQuc2F2ZVVzZXIodGhpcy51c2VySWQsIHByZWZlcmVuY2VzKSk7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHVzZXI6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRoaXMuYm9keVBhcmFtcy51c2VySWQsIHsgZmllbGRzOiBwcmVmZXJlbmNlcyB9KSB9KTtcblx0fVxufSk7XG5cbi8qKlxuXHRUaGlzIEFQSSByZXR1cm5zIHRoZSBsb2dnZWQgdXNlciByb2xlcy5cblxuXHRNZXRob2Q6IEdFVFxuXHRSb3V0ZTogYXBpL3YxL3VzZXIucm9sZXNcbiAqL1xuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ3VzZXIucm9sZXMnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRsZXQgY3VycmVudFVzZXJSb2xlcyA9IHt9O1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT4gTWV0ZW9yLmNhbGwoJ2dldFVzZXJSb2xlcycpKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJlc3VsdCkgJiYgcmVzdWx0Lmxlbmd0aCA+IDApIHtcblx0XHRcdGN1cnJlbnRVc2VyUm9sZXMgPSByZXN1bHRbMF07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoY3VycmVudFVzZXJSb2xlcyk7XG5cdH1cbn0pO1xuIiwiLyoqXG5cdFRoaXMgQVBJIHJldHVybnMgdGhlIHJlc3VsdCBvZiBhIHF1ZXJ5IG9mIHJvb21zXG5cdGFuZCB1c2VycywgdXNpbmcgTWV0ZW9yJ3MgU3BvdGxpZ2h0IG1ldGhvZC5cblxuXHRNZXRob2Q6IEdFVFxuXHRSb3V0ZTogYXBpL3YxL3Nwb3RsaWdodFxuXHRRdWVyeSBwYXJhbXM6XG5cdFx0LSBxdWVyeTogVGhlIHRlcm0gdG8gYmUgc2VhcmNoZWQuXG4gKi9cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdzcG90bGlnaHQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRjaGVjayh0aGlzLnF1ZXJ5UGFyYW1zLCB7XG5cdFx0XHRxdWVyeTogU3RyaW5nXG5cdFx0fSk7XG5cblx0XHRjb25zdCB7IHF1ZXJ5IH0gPSB0aGlzLnF1ZXJ5UGFyYW1zO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gTWV0ZW9yLnJ1bkFzVXNlcih0aGlzLnVzZXJJZCwgKCkgPT5cblx0XHRcdE1ldGVvci5jYWxsKCdzcG90bGlnaHQnLCBxdWVyeSwgbnVsbCwge1xuXHRcdFx0XHRyb29tczogdHJ1ZSxcblx0XHRcdFx0dXNlcnM6IHRydWVcblx0XHRcdH0pXG5cdFx0KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHJlc3VsdCk7XG5cdH1cbn0pO1xuIl19
