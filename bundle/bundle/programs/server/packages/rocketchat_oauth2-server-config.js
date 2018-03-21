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
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var OAuth2Server = Package['rocketchat:oauth2-server'].OAuth2Server;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:oauth2-server-config":{"server":{"models":{"OAuthApps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/server/models/OAuthApps.js                                        //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
RocketChat.models.OAuthApps = new class extends RocketChat.models._Base {
  constructor() {
    super('oauth_apps');
  }

}(); // FIND
// findByRole: (role, options) ->
// 	query =
// 	roles: role
// 	return @find query, options
// CREATE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"oauth":{"server":{"oauth2-server.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/oauth/server/oauth2-server.js                                     //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const oauth2server = new OAuth2Server({
  accessTokensCollectionName: 'rocketchat_oauth_access_tokens',
  refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens',
  authCodesCollectionName: 'rocketchat_oauth_auth_codes',
  clientsCollection: RocketChat.models.OAuthApps.model,
  debug: true
});
WebApp.connectHandlers.use(oauth2server.app);
oauth2server.routes.get('/oauth/userinfo', function (req, res) {
  if (req.headers.authorization == null) {
    return res.sendStatus(401).send('No token');
  }

  const accessToken = req.headers.authorization.replace('Bearer ', '');
  const token = oauth2server.oauth.model.AccessTokens.findOne({
    accessToken
  });

  if (token == null) {
    return res.sendStatus(401).send('Invalid Token');
  }

  const user = RocketChat.models.Users.findOneById(token.userId);

  if (user == null) {
    return res.sendStatus(401).send('Invalid Token');
  }

  return res.send({
    sub: user._id,
    name: user.name,
    email: user.emails[0].address,
    email_verified: user.emails[0].verified,
    department: '',
    birthdate: '',
    preffered_username: user.username,
    updated_at: user._updatedAt,
    picture: `${Meteor.absoluteUrl()}avatar/${user.username}`
  });
});
Meteor.publish('oauthClient', function (clientId) {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.OAuthApps.find({
    clientId,
    active: true
  }, {
    fields: {
      name: 1
    }
  });
});
RocketChat.API.v1.addAuthMethod(function () {
  let headerToken = this.request.headers['authorization'];
  const getToken = this.request.query.access_token;

  if (headerToken != null) {
    const matches = headerToken.match(/Bearer\s(\S+)/);

    if (matches) {
      headerToken = matches[1];
    } else {
      headerToken = undefined;
    }
  }

  const bearerToken = headerToken || getToken;

  if (bearerToken == null) {
    return;
  }

  const getAccessToken = Meteor.wrapAsync(oauth2server.oauth.model.getAccessToken, oauth2server.oauth.model);
  const accessToken = getAccessToken(bearerToken);

  if (accessToken == null) {
    return;
  }

  if (accessToken.expires != null && accessToken.expires !== 0 && accessToken.expires < new Date()) {
    return;
  }

  const user = RocketChat.models.Users.findOne(accessToken.userId);

  if (user == null) {
    return;
  }

  return {
    user: _.omit(user, '$loki')
  };
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"default-services.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/oauth/server/default-services.js                                  //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
if (!RocketChat.models.OAuthApps.findOne('zapier')) {
  RocketChat.models.OAuthApps.insert({
    _id: 'zapier',
    name: 'Zapier',
    active: true,
    clientId: 'zapier',
    clientSecret: 'RTK6TlndaCIolhQhZ7_KHIGOKj41RnlaOq_o-7JKwLr',
    redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/RocketChatDevAPI/',
    _createdAt: new Date(),
    _createdBy: {
      _id: 'system',
      username: 'system'
    }
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"admin":{"server":{"publications":{"oauthApps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/admin/server/publications/oauthApps.js                            //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
Meteor.publish('oauthApps', function () {
  if (!this.userId) {
    return this.ready();
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
    this.error(Meteor.Error('error-not-allowed', 'Not allowed', {
      publish: 'oauthApps'
    }));
  }

  return RocketChat.models.OAuthApps.find();
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addOAuthApp.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/admin/server/methods/addOAuthApp.js                               //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  addOAuthApp(application) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'addOAuthApp'
      });
    }

    if (!_.isString(application.name) || application.name.trim() === '') {
      throw new Meteor.Error('error-invalid-name', 'Invalid name', {
        method: 'addOAuthApp'
      });
    }

    if (!_.isString(application.redirectUri) || application.redirectUri.trim() === '') {
      throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
        method: 'addOAuthApp'
      });
    }

    if (!_.isBoolean(application.active)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'addOAuthApp'
      });
    }

    application.clientId = Random.id();
    application.clientSecret = Random.secret();
    application._createdAt = new Date();
    application._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    application._id = RocketChat.models.OAuthApps.insert(application);
    return application;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOAuthApp.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/admin/server/methods/updateOAuthApp.js                            //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  updateOAuthApp(applicationId, application) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'updateOAuthApp'
      });
    }

    if (!_.isString(application.name) || application.name.trim() === '') {
      throw new Meteor.Error('error-invalid-name', 'Invalid name', {
        method: 'updateOAuthApp'
      });
    }

    if (!_.isString(application.redirectUri) || application.redirectUri.trim() === '') {
      throw new Meteor.Error('error-invalid-redirectUri', 'Invalid redirectUri', {
        method: 'updateOAuthApp'
      });
    }

    if (!_.isBoolean(application.active)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'updateOAuthApp'
      });
    }

    const currentApplication = RocketChat.models.OAuthApps.findOne(applicationId);

    if (currentApplication == null) {
      throw new Meteor.Error('error-application-not-found', 'Application not found', {
        method: 'updateOAuthApp'
      });
    }

    RocketChat.models.OAuthApps.update(applicationId, {
      $set: {
        name: application.name,
        active: application.active,
        redirectUri: application.redirectUri,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.OAuthApps.findOne(applicationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteOAuthApp.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                            //
// packages/rocketchat_oauth2-server-config/admin/server/methods/deleteOAuthApp.js                            //
//                                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                              //
Meteor.methods({
  deleteOAuthApp(applicationId) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-oauth-apps')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'deleteOAuthApp'
      });
    }

    const application = RocketChat.models.OAuthApps.findOne(applicationId);

    if (application == null) {
      throw new Meteor.Error('error-application-not-found', 'Application not found', {
        method: 'deleteOAuthApp'
      });
    }

    RocketChat.models.OAuthApps.remove({
      _id: applicationId
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:oauth2-server-config/server/models/OAuthApps.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/oauth/server/oauth2-server.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/oauth/server/default-services.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/admin/server/publications/oauthApps.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/admin/server/methods/addOAuthApp.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/admin/server/methods/updateOAuthApp.js");
require("/node_modules/meteor/rocketchat:oauth2-server-config/admin/server/methods/deleteOAuthApp.js");

/* Exports */
Package._define("rocketchat:oauth2-server-config");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_oauth2-server-config.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9zZXJ2ZXIvbW9kZWxzL09BdXRoQXBwcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9vYXV0aC9zZXJ2ZXIvb2F1dGgyLXNlcnZlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9vYXV0aC9zZXJ2ZXIvZGVmYXVsdC1zZXJ2aWNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9hZG1pbi9zZXJ2ZXIvcHVibGljYXRpb25zL29hdXRoQXBwcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9hZG1pbi9zZXJ2ZXIvbWV0aG9kcy9hZGRPQXV0aEFwcC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9hZG1pbi9zZXJ2ZXIvbWV0aG9kcy91cGRhdGVPQXV0aEFwcC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpvYXV0aDItc2VydmVyLWNvbmZpZy9hZG1pbi9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVPQXV0aEFwcC5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0IiwibW9kZWxzIiwiT0F1dGhBcHBzIiwiX0Jhc2UiLCJjb25zdHJ1Y3RvciIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm9hdXRoMnNlcnZlciIsIk9BdXRoMlNlcnZlciIsImFjY2Vzc1Rva2Vuc0NvbGxlY3Rpb25OYW1lIiwicmVmcmVzaFRva2Vuc0NvbGxlY3Rpb25OYW1lIiwiYXV0aENvZGVzQ29sbGVjdGlvbk5hbWUiLCJjbGllbnRzQ29sbGVjdGlvbiIsIm1vZGVsIiwiZGVidWciLCJXZWJBcHAiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJhcHAiLCJyb3V0ZXMiLCJnZXQiLCJyZXEiLCJyZXMiLCJoZWFkZXJzIiwiYXV0aG9yaXphdGlvbiIsInNlbmRTdGF0dXMiLCJzZW5kIiwiYWNjZXNzVG9rZW4iLCJyZXBsYWNlIiwidG9rZW4iLCJvYXV0aCIsIkFjY2Vzc1Rva2VucyIsImZpbmRPbmUiLCJ1c2VyIiwiVXNlcnMiLCJmaW5kT25lQnlJZCIsInVzZXJJZCIsInN1YiIsIl9pZCIsIm5hbWUiLCJlbWFpbCIsImVtYWlscyIsImFkZHJlc3MiLCJlbWFpbF92ZXJpZmllZCIsInZlcmlmaWVkIiwiZGVwYXJ0bWVudCIsImJpcnRoZGF0ZSIsInByZWZmZXJlZF91c2VybmFtZSIsInVzZXJuYW1lIiwidXBkYXRlZF9hdCIsIl91cGRhdGVkQXQiLCJwaWN0dXJlIiwiTWV0ZW9yIiwiYWJzb2x1dGVVcmwiLCJwdWJsaXNoIiwiY2xpZW50SWQiLCJyZWFkeSIsImZpbmQiLCJhY3RpdmUiLCJmaWVsZHMiLCJBUEkiLCJ2MSIsImFkZEF1dGhNZXRob2QiLCJoZWFkZXJUb2tlbiIsInJlcXVlc3QiLCJnZXRUb2tlbiIsInF1ZXJ5IiwiYWNjZXNzX3Rva2VuIiwibWF0Y2hlcyIsIm1hdGNoIiwidW5kZWZpbmVkIiwiYmVhcmVyVG9rZW4iLCJnZXRBY2Nlc3NUb2tlbiIsIndyYXBBc3luYyIsImV4cGlyZXMiLCJEYXRlIiwib21pdCIsImluc2VydCIsImNsaWVudFNlY3JldCIsInJlZGlyZWN0VXJpIiwiX2NyZWF0ZWRBdCIsIl9jcmVhdGVkQnkiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJlcnJvciIsIkVycm9yIiwibWV0aG9kcyIsImFkZE9BdXRoQXBwIiwiYXBwbGljYXRpb24iLCJtZXRob2QiLCJpc1N0cmluZyIsInRyaW0iLCJpc0Jvb2xlYW4iLCJSYW5kb20iLCJpZCIsInNlY3JldCIsInVwZGF0ZU9BdXRoQXBwIiwiYXBwbGljYXRpb25JZCIsImN1cnJlbnRBcHBsaWNhdGlvbiIsInVwZGF0ZSIsIiRzZXQiLCJfdXBkYXRlZEJ5IiwiZGVsZXRlT0F1dGhBcHAiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsTUFBWCxDQUFrQkMsU0FBbEIsR0FBOEIsSUFBSSxjQUFjRixXQUFXQyxNQUFYLENBQWtCRSxLQUFoQyxDQUFzQztBQUN2RUMsZ0JBQWM7QUFDYixVQUFNLFlBQU47QUFDQTs7QUFIc0UsQ0FBMUMsRUFBOUIsQyxDQVNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQSxTOzs7Ozs7Ozs7OztBQ2hCQSxJQUFJQyxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBR04sTUFBTUMsZUFBZSxJQUFJQyxZQUFKLENBQWlCO0FBQ3JDQyw4QkFBNEIsZ0NBRFM7QUFFckNDLCtCQUE2QixpQ0FGUTtBQUdyQ0MsMkJBQXlCLDZCQUhZO0FBSXJDQyxxQkFBbUJoQixXQUFXQyxNQUFYLENBQWtCQyxTQUFsQixDQUE0QmUsS0FKVjtBQUtyQ0MsU0FBTztBQUw4QixDQUFqQixDQUFyQjtBQVFBQyxPQUFPQyxlQUFQLENBQXVCQyxHQUF2QixDQUEyQlYsYUFBYVcsR0FBeEM7QUFFQVgsYUFBYVksTUFBYixDQUFvQkMsR0FBcEIsQ0FBd0IsaUJBQXhCLEVBQTJDLFVBQVNDLEdBQVQsRUFBY0MsR0FBZCxFQUFtQjtBQUM3RCxNQUFJRCxJQUFJRSxPQUFKLENBQVlDLGFBQVosSUFBNkIsSUFBakMsRUFBdUM7QUFDdEMsV0FBT0YsSUFBSUcsVUFBSixDQUFlLEdBQWYsRUFBb0JDLElBQXBCLENBQXlCLFVBQXpCLENBQVA7QUFDQTs7QUFDRCxRQUFNQyxjQUFjTixJQUFJRSxPQUFKLENB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VTtBQURIO0FBRGdELFNBQTdDO0FBTFA7QUFEMkMsS0FBbEQ7QUFhQSxXQUFPcEQsV0FBV0MsTUFBWCxDQUFrQkMsU0FBbEIsQ0FBNEJrQyxPQUE1QixDQUFvQ2lFLGFBQXBDLENBQVA7QUFDQTs7QUFoQ2EsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBN0MsT0FBT2tDLE9BQVAsQ0FBZTtBQUNkZ0IsaUJBQWVMLGFBQWYsRUFBOEI7QUFDN0IsUUFBSSxDQUFDckcsV0FBV3NGLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCLEtBQUsvQyxNQUFwQyxFQUE0QyxtQkFBNUMsQ0FBTCxFQUF1RTtBQUN0RSxZQUFNLElBQUlnQixPQUFPaUMsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRUksZ0JBQVE7QUFBVixPQUFyRCxDQUFOO0FBQ0E7O0FBQ0QsVUFBTUQsY0FBYzVGLFdBQVdDLE1BQVgsQ0FBa0JDLFNBQWxCLENBQTRCa0MsT0FBNUIsQ0FBb0NpRSxhQUFwQyxDQUFwQjs7QUFDQSxRQUFJVCxlQUFlLElBQW5CLEVBQXlCO0FBQ3hCLFlBQU0sSUFBSXBDLE9BQU9pQyxLQUFYLENBQWlCLDZCQUFqQixFQUFnRCx1QkFBaEQsRUFBeUU7QUFBRUksZ0JBQVE7QUFBVixPQUF6RSxDQUFOO0FBQ0E7O0FBQ0Q3RixlQUFXQyxNQUFYLENBQWtCQyxTQUFsQixDQUE0QnlHLE1BQTVCLENBQW1DO0FBQUVqRSxXQUFLMkQ7QUFBUCxLQUFuQztBQUNBLFdBQU8sSUFBUDtBQUNBOztBQVhhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9vYXV0aDItc2VydmVyLWNvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcyA9IG5ldyBjbGFzcyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ29hdXRoX2FwcHMnKTtcblx0fVxufTtcblxuXG5cblxuLy8gRklORFxuLy8gZmluZEJ5Um9sZTogKHJvbGUsIG9wdGlvbnMpIC0+XG4vLyBcdHF1ZXJ5ID1cbi8vIFx0cm9sZXM6IHJvbGVcblxuLy8gXHRyZXR1cm4gQGZpbmQgcXVlcnksIG9wdGlvbnNcblxuLy8gQ1JFQVRFXG4iLCIvKmdsb2JhbCBPQXV0aDJTZXJ2ZXIgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5jb25zdCBvYXV0aDJzZXJ2ZXIgPSBuZXcgT0F1dGgyU2VydmVyKHtcblx0YWNjZXNzVG9rZW5zQ29sbGVjdGlvbk5hbWU6ICdyb2NrZXRjaGF0X29hdXRoX2FjY2Vzc190b2tlbnMnLFxuXHRyZWZyZXNoVG9rZW5zQ29sbGVjdGlvbk5hbWU6ICdyb2NrZXRjaGF0X29hdXRoX3JlZnJlc2hfdG9rZW5zJyxcblx0YXV0aENvZGVzQ29sbGVjdGlvbk5hbWU6ICdyb2NrZXRjaGF0X29hdXRoX2F1dGhfY29kZXMnLFxuXHRjbGllbnRzQ29sbGVjdGlvbjogUm9ja2V0Q2hhdC5tb2RlbHMuT0F1dGhBcHBzLm1vZGVsLFxuXHRkZWJ1ZzogdHJ1ZVxufSk7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKG9hdXRoMnNlcnZlci5hcHApO1xuXG5vYXV0aDJzZXJ2ZXIucm91dGVzLmdldCgnL29hdXRoL3VzZXJpbmZvJywgZnVuY3Rpb24ocmVxLCByZXMpIHtcblx0aWYgKHJlcS5oZWFkZXJzLmF1dGhvcml6YXRpb24gPT0gbnVsbCkge1xuXHRcdHJldHVybiByZXMuc2VuZFN0YXR1cyg0MDEpLnNlbmQoJ05vIHRva2VuJyk7XG5cdH1cblx0Y29uc3QgYWNjZXNzVG9rZW4gPSByZXEuaGVhZGVycy5hdXRob3JpemF0aW9uLnJlcGxhY2UoJ0JlYXJlciAnLCAnJyk7XG5cdGNvbnN0IHRva2VuID0gb2F1dGgyc2VydmVyLm9hdXRoLm1vZGVsLkFjY2Vzc1Rva2Vucy5maW5kT25lKHtcblx0XHRhY2Nlc3NUb2tlblxuXHR9KTtcblx0aWYgKHRva2VuID09IG51bGwpIHtcblx0XHRyZXR1cm4gcmVzLnNlbmRTdGF0dXMoNDAxKS5zZW5kKCdJbnZhbGlkIFRva2VuJyk7XG5cdH1cblx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHRva2VuLnVzZXJJZCk7XG5cdGlmICh1c2VyID09IG51bGwpIHtcblx0XHRyZXR1cm4gcmVzLnNlbmRTdGF0dXMoNDAxKS5zZW5kKCdJbnZhbGlkIFRva2VuJyk7XG5cdH1cblx0cmV0dXJuIHJlcy5zZW5kKHtcblx0XHRzdWI6IHVzZXIuX2lkLFxuXHRcdG5hbWU6IHVzZXIubmFtZSxcblx0XHRlbWFpbDogdXNlci5lbWFpbHNbMF0uYWRkcmVzcyxcblx0XHRlbWFpbF92ZXJpZmllZDogdXNlci5lbWFpbHNbMF0udmVyaWZpZWQsXG5cdFx0ZGVwYXJ0bWVudDogJycsXG5cdFx0YmlydGhkYXRlOiAnJyxcblx0XHRwcmVmZmVyZWRfdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUsXG5cdFx0dXBkYXRlZF9hdDogdXNlci5fdXBkYXRlZEF0LFxuXHRcdHBpY3R1cmU6IGAkeyBNZXRlb3IuYWJzb2x1dGVVcmwoKSB9YXZhdGFyLyR7IHVzZXIudXNlcm5hbWUgfWBcblx0fSk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ29hdXRoQ2xpZW50JywgZnVuY3Rpb24oY2xpZW50SWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcy5maW5kKHtcblx0XHRjbGllbnRJZCxcblx0XHRhY3RpdmU6IHRydWVcblx0fSwge1xuXHRcdGZpZWxkczoge1xuXHRcdFx0bmFtZTogMVxuXHRcdH1cblx0fSk7XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkQXV0aE1ldGhvZChmdW5jdGlvbigpIHtcblx0bGV0IGhlYWRlclRva2VuID0gdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ2F1dGhvcml6YXRpb24nXTtcblx0Y29uc3QgZ2V0VG9rZW4gPSB0aGlzLnJlcXVlc3QucXVlcnkuYWNjZXNzX3Rva2VuO1xuXHRpZiAoaGVhZGVyVG9rZW4gIT0gbnVsbCkge1xuXHRcdGNvbnN0IG1hdGNoZXMgPSBoZWFkZXJUb2tlbi5tYXRjaCgvQmVhcmVyXFxzKFxcUyspLyk7XG5cdFx0aWYgKG1hdGNoZXMpIHtcblx0XHRcdGhlYWRlclRva2VuID0gbWF0Y2hlc1sxXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aGVhZGVyVG9rZW4gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHR9XG5cdGNvbnN0IGJlYXJlclRva2VuID0gaGVhZGVyVG9rZW4gfHwgZ2V0VG9rZW47XG5cdGlmIChiZWFyZXJUb2tlbiA9PSBudWxsKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IGdldEFjY2Vzc1Rva2VuID0gTWV0ZW9yLndyYXBBc3luYyhvYXV0aDJzZXJ2ZXIub2F1dGgubW9kZWwuZ2V0QWNjZXNzVG9rZW4sIG9hdXRoMnNlcnZlci5vYXV0aC5tb2RlbCk7XG5cdGNvbnN0IGFjY2Vzc1Rva2VuID0gZ2V0QWNjZXNzVG9rZW4oYmVhcmVyVG9rZW4pO1xuXHRpZiAoYWNjZXNzVG9rZW4gPT0gbnVsbCkge1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoKGFjY2Vzc1Rva2VuLmV4cGlyZXMgIT0gbnVsbCkgJiYgYWNjZXNzVG9rZW4uZXhwaXJlcyAhPT0gMCAmJiBhY2Nlc3NUb2tlbi5leHBpcmVzIDwgbmV3IERhdGUoKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZShhY2Nlc3NUb2tlbi51c2VySWQpO1xuXHRpZiAodXNlciA9PSBudWxsKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdHJldHVybiB7IHVzZXI6IF8ub21pdCh1c2VyLCAnJGxva2knKSB9O1xufSk7XG4iLCJpZiAoIVJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcy5maW5kT25lKCd6YXBpZXInKSkge1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5PQXV0aEFwcHMuaW5zZXJ0KHtcblx0XHRfaWQ6ICd6YXBpZXInLFxuXHRcdG5hbWU6ICdaYXBpZXInLFxuXHRcdGFjdGl2ZTogdHJ1ZSxcblx0XHRjbGllbnRJZDogJ3phcGllcicsXG5cdFx0Y2xpZW50U2VjcmV0OiAnUlRLNlRsbmRhQ0lvbGhRaFo3X0tISUdPS2o0MVJubGFPcV9vLTdKS3dMcicsXG5cdFx0cmVkaXJlY3RVcmk6ICdodHRwczovL3phcGllci5jb20vZGFzaGJvYXJkL2F1dGgvb2F1dGgvcmV0dXJuL1JvY2tldENoYXREZXZBUEkvJyxcblx0XHRfY3JlYXRlZEF0OiBuZXcgRGF0ZSxcblx0XHRfY3JlYXRlZEJ5OiB7XG5cdFx0XHRfaWQ6ICdzeXN0ZW0nLFxuXHRcdFx0dXNlcm5hbWU6ICdzeXN0ZW0nXG5cdFx0fVxuXHR9KTtcbn1cbiIsIk1ldGVvci5wdWJsaXNoKCdvYXV0aEFwcHMnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb2F1dGgtYXBwcycpKSB7XG5cdFx0dGhpcy5lcnJvcihNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBwdWJsaXNoOiAnb2F1dGhBcHBzJyB9KSk7XG5cdH1cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcy5maW5kKCk7XG59KTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGFkZE9BdXRoQXBwKGFwcGxpY2F0aW9uKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb2F1dGgtYXBwcycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnYWRkT0F1dGhBcHAnIH0pO1xuXHRcdH1cblx0XHRpZiAoIV8uaXNTdHJpbmcoYXBwbGljYXRpb24ubmFtZSkgfHwgYXBwbGljYXRpb24ubmFtZS50cmltKCkgPT09ICcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLW5hbWUnLCAnSW52YWxpZCBuYW1lJywgeyBtZXRob2Q6ICdhZGRPQXV0aEFwcCcgfSk7XG5cdFx0fVxuXHRcdGlmICghXy5pc1N0cmluZyhhcHBsaWNhdGlvbi5yZWRpcmVjdFVyaSkgfHwgYXBwbGljYXRpb24ucmVkaXJlY3RVcmkudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yZWRpcmVjdFVyaScsICdJbnZhbGlkIHJlZGlyZWN0VXJpJywgeyBtZXRob2Q6ICdhZGRPQXV0aEFwcCcgfSk7XG5cdFx0fVxuXHRcdGlmICghXy5pc0Jvb2xlYW4oYXBwbGljYXRpb24uYWN0aXZlKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hcmd1bWVudHMnLCAnSW52YWxpZCBhcmd1bWVudHMnLCB7IG1ldGhvZDogJ2FkZE9BdXRoQXBwJyB9KTtcblx0XHR9XG5cdFx0YXBwbGljYXRpb24uY2xpZW50SWQgPSBSYW5kb20uaWQoKTtcblx0XHRhcHBsaWNhdGlvbi5jbGllbnRTZWNyZXQgPSBSYW5kb20uc2VjcmV0KCk7XG5cdFx0YXBwbGljYXRpb24uX2NyZWF0ZWRBdCA9IG5ldyBEYXRlO1xuXHRcdGFwcGxpY2F0aW9uLl9jcmVhdGVkQnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7IGZpZWxkczogeyB1c2VybmFtZTogMSB9IH0pO1xuXHRcdGFwcGxpY2F0aW9uLl9pZCA9IFJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcy5pbnNlcnQoYXBwbGljYXRpb24pO1xuXHRcdHJldHVybiBhcHBsaWNhdGlvbjtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHR1cGRhdGVPQXV0aEFwcChhcHBsaWNhdGlvbklkLCBhcHBsaWNhdGlvbikge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW9hdXRoLWFwcHMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ3VwZGF0ZU9BdXRoQXBwJyB9KTtcblx0XHR9XG5cdFx0aWYgKCFfLmlzU3RyaW5nKGFwcGxpY2F0aW9uLm5hbWUpIHx8IGFwcGxpY2F0aW9uLm5hbWUudHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1uYW1lJywgJ0ludmFsaWQgbmFtZScsIHsgbWV0aG9kOiAndXBkYXRlT0F1dGhBcHAnIH0pO1xuXHRcdH1cblx0XHRpZiAoIV8uaXNTdHJpbmcoYXBwbGljYXRpb24ucmVkaXJlY3RVcmkpIHx8IGFwcGxpY2F0aW9uLnJlZGlyZWN0VXJpLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcmVkaXJlY3RVcmknLCAnSW52YWxpZCByZWRpcmVjdFVyaScsIHsgbWV0aG9kOiAndXBkYXRlT0F1dGhBcHAnIH0pO1xuXHRcdH1cblx0XHRpZiAoIV8uaXNCb29sZWFuKGFwcGxpY2F0aW9uLmFjdGl2ZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtYXJndW1lbnRzJywgJ0ludmFsaWQgYXJndW1lbnRzJywgeyBtZXRob2Q6ICd1cGRhdGVPQXV0aEFwcCcgfSk7XG5cdFx0fVxuXHRcdGNvbnN0IGN1cnJlbnRBcHBsaWNhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLk9BdXRoQXBwcy5maW5kT25lKGFwcGxpY2F0aW9uSWQpO1xuXHRcdGlmIChjdXJyZW50QXBwbGljYXRpb24gPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYXBwbGljYXRpb24tbm90LWZvdW5kJywgJ0FwcGxpY2F0aW9uIG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAndXBkYXRlT0F1dGhBcHAnIH0pO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5PQXV0aEFwcHMudXBkYXRlKGFwcGxpY2F0aW9uSWQsIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0bmFtZTogYXBwbGljYXRpb24ubmFtZSxcblx0XHRcdFx0YWN0aXZlOiBhcHBsaWNhdGlvbi5hY3RpdmUsXG5cdFx0XHRcdHJlZGlyZWN0VXJpOiBhcHBsaWNhdGlvbi5yZWRpcmVjdFVyaSxcblx0XHRcdFx0X3VwZGF0ZWRBdDogbmV3IERhdGUsXG5cdFx0XHRcdF91cGRhdGVkQnk6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtcblx0XHRcdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5PQXV0aEFwcHMuZmluZE9uZShhcHBsaWNhdGlvbklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGRlbGV0ZU9BdXRoQXBwKGFwcGxpY2F0aW9uSWQpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vYXV0aC1hcHBzJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdkZWxldGVPQXV0aEFwcCcgfSk7XG5cdFx0fVxuXHRcdGNvbnN0IGFwcGxpY2F0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuT0F1dGhBcHBzLmZpbmRPbmUoYXBwbGljYXRpb25JZCk7XG5cdFx0aWYgKGFwcGxpY2F0aW9uID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFwcGxpY2F0aW9uLW5vdC1mb3VuZCcsICdBcHBsaWNhdGlvbiBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2RlbGV0ZU9BdXRoQXBwJyB9KTtcblx0XHR9XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuT0F1dGhBcHBzLnJlbW92ZSh7IF9pZDogYXBwbGljYXRpb25JZCB9KTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iXX0=
