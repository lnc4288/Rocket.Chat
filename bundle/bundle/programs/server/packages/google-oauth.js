(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Google;

var require = meteorInstall({"node_modules":{"meteor":{"google-oauth":{"google_server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/google_server.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _extends = require("@babel/runtime/helpers/builtin/extends");

var Google = require("./namespace.js");

var Accounts = require("meteor/accounts-base").Accounts;

var hasOwn = Object.prototype.hasOwnProperty; // https://developers.google.com/accounts/docs/OAuth2Login#userinfocall

Google.whitelistedFields = ['id', 'email', 'verified_email', 'name', 'given_name', 'family_name', 'picture', 'locale', 'timezone', 'gender'];

function getServiceDataFromTokens(tokens) {
  var accessToken = tokens.accessToken;
  var idToken = tokens.idToken;
  var scopes = getScopes(accessToken);
  var identity = getIdentity(accessToken);
  var serviceData = {
    accessToken: accessToken,
    idToken: idToken,
    scope: scopes
  };

  if (hasOwn.call(tokens, "expiresIn")) {
    serviceData.expiresAt = Date.now() + 1000 * parseInt(tokens.expiresIn, 10);
  }

  var fields = Object.create(null);
  Google.whitelistedFields.forEach(function (name) {
    if (hasOwn.call(identity, name)) {
      fields[name] = identity[name];
    }
  });
  Object.assign(serviceData, fields); // only set the token in serviceData if it's there. this ensures
  // that we don't lose old ones (since we only get this on the first
  // log in attempt)

  if (tokens.refreshToken) {
    serviceData.refreshToken = tokens.refreshToken;
  }

  return {
    serviceData: serviceData,
    options: {
      profile: {
        name: identity.name
      }
    }
  };
}

Accounts.registerLoginHandler(function (request) {
  if (request.googleSignIn !== true) {
    return;
  }

  const tokens = {
    accessToken: request.accessToken,
    refreshToken: request.refreshToken,
    idToken: request.idToken
  };

  if (request.serverAuthCode) {
    Object.assign(tokens, getTokens({
      code: request.serverAuthCode
    }));
  }

  const result = getServiceDataFromTokens(tokens);
  return Accounts.updateOrCreateUserFromExternalService("google", _extends({
    id: request.userId,
    idToken: request.idToken,
    accessToken: request.accessToken,
    email: request.email,
    picture: request.imageUrl
  }, result.serviceData), result.options);
});

function getServiceData(query) {
  return getServiceDataFromTokens(getTokens(query));
}

OAuth.registerService('google', 2, null, getServiceData); // returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
// - refreshToken, if this is the first authorization request

var getTokens = function (query) {
  var config = ServiceConfiguration.configurations.findOne({
    service: 'google'
  });
  if (!config) throw new ServiceConfiguration.ConfigError();
  var response;

  try {
    response = HTTP.post("https://accounts.google.com/o/oauth2/token", {
      params: {
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('google', config),
        grant_type: 'authorization_code'
      }
    });
  } catch (err) {
    throw Object.assign(new Error("Failed to complete OAuth handshake with Google. " + err.message), {
      response: err.response
    });
  }

  if (response.data.error) {
    // if the http response was a json object with an error attribute
    throw new Error("Failed to complete OAuth handshake with Google. " + response.data.error);
  } else {
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      idToken: response.data.id_token
    };
  }
};

var getIdentity = function (accessToken) {
  try {
    return HTTP.get("https://www.googleapis.com/oauth2/v1/userinfo", {
      params: {
        access_token: accessToken
      }
    }).data;
  } catch (err) {
    throw Object.assign(new Error("Failed to fetch identity from Google. " + err.message), {
      response: err.response
    });
  }
};

var getScopes = function (accessToken) {
  try {
    return HTTP.get("https://www.googleapis.com/oauth2/v1/tokeninfo", {
      params: {
        access_token: accessToken
      }
    }).data.scope.split(' ');
  } catch (err) {
    throw Object.assign(new Error("Failed to fetch tokeninfo from Google. " + err.message), {
      response: err.response
    });
  }
};

Google.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"namespace.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/google-oauth/namespace.js                                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// The module.exports object of this module becomes the Google namespace
// for other modules in this package.
Google = module.exports; // So that api.export finds the "Google" property.

Google.Google = Google;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/google-oauth/google_server.js");
var exports = require("/node_modules/meteor/google-oauth/namespace.js");

/* Exports */
Package._define("google-oauth", exports, {
  Google: Google
});

})();

//# sourceURL=meteor://💻app/packages/google-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZ29vZ2xlLW9hdXRoL2dvb2dsZV9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2dvb2dsZS1vYXV0aC9uYW1lc3BhY2UuanMiXSwibmFtZXMiOlsiR29vZ2xlIiwicmVxdWlyZSIsIkFjY291bnRzIiwiaGFzT3duIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJ3aGl0ZWxpc3RlZEZpZWxkcyIsImdldFNlcnZpY2VEYXRhRnJvbVRva2VucyIsInRva2VucyIsImFjY2Vzc1Rva2VuIiwiaWRUb2tlbiIsInNjb3BlcyIsImdldFNjb3BlcyIsImlkZW50aXR5IiwiZ2V0SWRlbnRpdHkiLCJzZXJ2aWNlRGF0YSIsInNjb3BlIiwiY2FsbCIsImV4cGlyZXNBdCIsIkRhdGUiLCJub3ciLCJwYXJzZUludCIsImV4cGlyZXNJbiIsImZpZWxkcyIsImNyZWF0ZSIsImZvckVhY2giLCJuYW1lIiwiYXNzaWduIiwicmVmcmVzaFRva2VuIiwib3B0aW9ucyIsInByb2ZpbGUiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsInJlcXVlc3QiLCJnb29nbGVTaWduSW4iLCJzZXJ2ZXJBdXRoQ29kZSIsImdldFRva2VucyIsImNvZGUiLCJyZXN1bHQiLCJ1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlIiwiaWQiLCJ1c2VySWQiLCJlbWFpbCIsInBpY3R1cmUiLCJpbWFnZVVybCIsImdldFNlcnZpY2VEYXRhIiwicXVlcnkiLCJPQXV0aCIsInJlZ2lzdGVyU2VydmljZSIsImNvbmZpZyIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJmaW5kT25lIiwic2VydmljZSIsIkNvbmZpZ0Vycm9yIiwicmVzcG9uc2UiLCJIVFRQIiwicG9zdCIsInBhcmFtcyIsImNsaWVudF9pZCIsImNsaWVudElkIiwiY2xpZW50X3NlY3JldCIsIm9wZW5TZWNyZXQiLCJzZWNyZXQiLCJyZWRpcmVjdF91cmkiLCJfcmVkaXJlY3RVcmkiLCJncmFudF90eXBlIiwiZXJyIiwiRXJyb3IiLCJtZXNzYWdlIiwiZGF0YSIsImVycm9yIiwiYWNjZXNzX3Rva2VuIiwicmVmcmVzaF90b2tlbiIsImV4cGlyZXNfaW4iLCJpZF90b2tlbiIsImdldCIsInNwbGl0IiwicmV0cmlldmVDcmVkZW50aWFsIiwiY3JlZGVudGlhbFRva2VuIiwiY3JlZGVudGlhbFNlY3JldCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsU0FBU0MsUUFBUSxnQkFBUixDQUFiOztBQUNBLElBQUlDLFdBQVdELFFBQVEsc0JBQVIsRUFBZ0NDLFFBQS9DOztBQUNBLElBQUlDLFNBQVNDLE9BQU9DLFNBQVAsQ0FBaUJDLGNBQTlCLEMsQ0FFQTs7QUFDQU4sT0FBT08saUJBQVAsR0FBMkIsQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQixnQkFBaEIsRUFBa0MsTUFBbEMsRUFBMEMsWUFBMUMsRUFDUixhQURRLEVBQ08sU0FEUCxFQUNrQixRQURsQixFQUM0QixVQUQ1QixFQUN3QyxRQUR4QyxDQUEzQjs7QUFHQSxTQUFTQyx3QkFBVCxDQUFrQ0MsTUFBbEMsRUFBMEM7QUFDeEMsTUFBSUMsY0FBY0QsT0FBT0MsV0FBekI7QUFDQSxNQUFJQyxVQUFVRixPQUFPRSxPQUFyQjtBQUNBLE1BQUlDLFNBQVNDLFVBQVVILFdBQVYsQ0FBYjtBQUNBLE1BQUlJLFdBQVdDLFlBQVlMLFdBQVosQ0FBZjtBQUNBLE1BQUlNLGNBQWM7QUFDaEJOLGlCQUFhQSxXQURHO0FBRWhCQyxhQUFTQSxPQUZPO0FBR2hCTSxXQUFPTDtBQUhTLEdBQWxCOztBQU1BLE1BQUlULE9BQU9lLElBQVAsQ0FBWVQsTUFBWixFQUFvQixXQUFwQixDQUFKLEVBQXNDO0FBQ3BDTyxnQkFBWUcsU0FBWixHQUNFQyxLQUFLQyxHQUFMLEtBQWEsT0FBT0MsU0FBU2IsT0FB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QURJLEVBRUo7QUFBRWQsZ0JBQVVZLElBQUlaO0FBQWhCLEtBRkksQ0FBTjtBQUlEO0FBQ0YsQ0FYRDs7QUFhQXZELE9BQU84RSxrQkFBUCxHQUE0QixVQUFTQyxlQUFULEVBQTBCQyxnQkFBMUIsRUFBNEM7QUFDdEUsU0FBT2pDLE1BQU0rQixrQkFBTixDQUF5QkMsZUFBekIsRUFBMENDLGdCQUExQyxDQUFQO0FBQ0QsQ0FGRCxDOzs7Ozs7Ozs7OztBQ3JKQTtBQUNBO0FBQ0FoRixTQUFTaUYsT0FBT0MsT0FBaEIsQyxDQUVBOztBQUNBbEYsT0FBT0EsTUFBUCxHQUFnQkEsTUFBaEIsQyIsImZpbGUiOiIvcGFja2FnZXMvZ29vZ2xlLW9hdXRoLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIEdvb2dsZSA9IHJlcXVpcmUoXCIuL25hbWVzcGFjZS5qc1wiKTtcbnZhciBBY2NvdW50cyA9IHJlcXVpcmUoXCJtZXRlb3IvYWNjb3VudHMtYmFzZVwiKS5BY2NvdW50cztcbnZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hY2NvdW50cy9kb2NzL09BdXRoMkxvZ2luI3VzZXJpbmZvY2FsbFxuR29vZ2xlLndoaXRlbGlzdGVkRmllbGRzID0gWydpZCcsICdlbWFpbCcsICd2ZXJpZmllZF9lbWFpbCcsICduYW1lJywgJ2dpdmVuX25hbWUnLFxuICAgICAgICAgICAgICAgICAgICdmYW1pbHlfbmFtZScsICdwaWN0dXJlJywgJ2xvY2FsZScsICd0aW1lem9uZScsICdnZW5kZXInXTtcblxuZnVuY3Rpb24gZ2V0U2VydmljZURhdGFGcm9tVG9rZW5zKHRva2Vucykge1xuICB2YXIgYWNjZXNzVG9rZW4gPSB0b2tlbnMuYWNjZXNzVG9rZW47XG4gIHZhciBpZFRva2VuID0gdG9rZW5zLmlkVG9rZW47XG4gIHZhciBzY29wZXMgPSBnZXRTY29wZXMoYWNjZXNzVG9rZW4pO1xuICB2YXIgaWRlbnRpdHkgPSBnZXRJZGVudGl0eShhY2Nlc3NUb2tlbik7XG4gIHZhciBzZXJ2aWNlRGF0YSA9IHtcbiAgICBhY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW4sXG4gICAgaWRUb2tlbjogaWRUb2tlbixcbiAgICBzY29wZTogc2NvcGVzXG4gIH07XG5cbiAgaWYgKGhhc093bi5jYWxsKHRva2VucywgXCJleHBpcmVzSW5cIikpIHtcbiAgICBzZXJ2aWNlRGF0YS5leHBpcmVzQXQgPVxuICAgICAgRGF0ZS5ub3coKSArIDEwMDAgKiBwYXJzZUludCh0b2tlbnMuZXhwaXJlc0luLCAxMCk7XG4gIH1cblxuICB2YXIgZmllbGRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgR29vZ2xlLndoaXRlbGlzdGVkRmllbGRzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZiAoaGFzT3duLmNhbGwoaWRlbnRpdHksIG5hbWUpKSB7XG4gICAgICBmaWVsZHNbbmFtZV0gPSBpZGVudGl0eVtuYW1lXTtcbiAgICB9XG4gIH0pO1xuXG4gIE9iamVjdC5hc3NpZ24oc2VydmljZURhdGEsIGZpZWxkcyk7XG5cbiAgLy8gb25seSBzZXQgdGhlIHRva2VuIGluIHNlcnZpY2VEYXRhIGlmIGl0J3MgdGhlcmUuIHRoaXMgZW5zdXJlc1xuICAvLyB0aGF0IHdlIGRvbid0IGxvc2Ugb2xkIG9uZXMgKHNpbmNlIHdlIG9ubHkgZ2V0IHRoaXMgb24gdGhlIGZpcnN0XG4gIC8vIGxvZyBpbiBhdHRlbXB0KVxuICBpZiAodG9rZW5zLnJlZnJlc2hUb2tlbikge1xuICAgIHNlcnZpY2VEYXRhLnJlZnJlc2hUb2tlbiA9IHRva2Vucy5yZWZyZXNoVG9rZW47XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNlcnZpY2VEYXRhOiBzZXJ2aWNlRGF0YSxcbiAgICBvcHRpb25zOiB7XG4gICAgICBwcm9maWxlOiB7XG4gICAgICAgIG5hbWU6IGlkZW50aXR5Lm5hbWVcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbkFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gIGlmIChyZXF1ZXN0Lmdvb2dsZVNpZ25JbiAhPT0gdHJ1ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRva2VucyA9IHtcbiAgICBhY2Nlc3NUb2tlbjogcmVxdWVzdC5hY2Nlc3NUb2tlbixcbiAgICByZWZyZXNoVG9rZW46IHJlcXVlc3QucmVmcmVzaFRva2VuLFxuICAgIGlkVG9rZW46IHJlcXVlc3QuaWRUb2tlbixcbiAgfTtcblxuICBpZiAocmVxdWVzdC5zZXJ2ZXJBdXRoQ29kZSkge1xuICAgIE9iamVjdC5hc3NpZ24odG9rZW5zLCBnZXRUb2tlbnMoe1xuICAgICAgY29kZTogcmVxdWVzdC5zZXJ2ZXJBdXRoQ29kZVxuICAgIH0pKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGdldFNlcnZpY2VEYXRhRnJvbVRva2Vucyh0b2tlbnMpO1xuXG4gIHJldHVybiBBY2NvdW50cy51cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlKFwiZ29vZ2xlXCIsIHtcbiAgICBpZDogcmVxdWVzdC51c2VySWQsXG4gICAgaWRUb2tlbjogcmVxdWVzdC5pZFRva2VuLFxuICAgIGFjY2Vzc1Rva2VuOiByZXF1ZXN0LmFjY2Vzc1Rva2VuLFxuICAgIGVtYWlsOiByZXF1ZXN0LmVtYWlsLFxuICAgIHBpY3R1cmU6IHJlcXVlc3QuaW1hZ2VVcmwsXG4gICAgLi4ucmVzdWx0LnNlcnZpY2VEYXRhLFxuICB9LCByZXN1bHQub3B0aW9ucyk7XG59KTtcblxuZnVuY3Rpb24gZ2V0U2VydmljZURhdGEocXVlcnkpIHtcbiAgcmV0dXJuIGdldFNlcnZpY2VEYXRhRnJvbVRva2VucyhnZXRUb2tlbnMocXVlcnkpKTtcbn1cblxuT0F1dGgucmVnaXN0ZXJTZXJ2aWNlKCdnb29nbGUnLCAyLCBudWxsLCBnZXRTZXJ2aWNlRGF0YSk7XG5cbi8vIHJldHVybnMgYW4gb2JqZWN0IGNvbnRhaW5pbmc6XG4vLyAtIGFjY2Vzc1Rva2VuXG4vLyAtIGV4cGlyZXNJbjogbGlmZXRpbWUgb2YgdG9rZW4gaW4gc2Vjb25kc1xuLy8gLSByZWZyZXNoVG9rZW4sIGlmIHRoaXMgaXMgdGhlIGZpcnN0IGF1dGhvcml6YXRpb24gcmVxdWVzdFxudmFyIGdldFRva2VucyA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICB2YXIgY29uZmlnID0gU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMuZmluZE9uZSh7c2VydmljZTogJ2dvb2dsZSd9KTtcbiAgaWYgKCFjb25maWcpXG4gICAgdGhyb3cgbmV3IFNlcnZpY2VDb25maWd1cmF0aW9uLkNvbmZpZ0Vycm9yKCk7XG5cbiAgdmFyIHJlc3BvbnNlO1xuICB0cnkge1xuICAgIHJlc3BvbnNlID0gSFRUUC5wb3N0KFxuICAgICAgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvdG9rZW5cIiwge3BhcmFtczoge1xuICAgICAgICBjb2RlOiBxdWVyeS5jb2RlLFxuICAgICAgICBjbGllbnRfaWQ6IGNvbmZpZy5jbGllbnRJZCxcbiAgICAgICAgY2xpZW50X3NlY3JldDogT0F1dGgub3BlblNlY3JldChjb25maWcuc2VjcmV0KSxcbiAgICAgICAgcmVkaXJlY3RfdXJpOiBPQXV0aC5fcmVkaXJlY3RVcmkoJ2dvb2dsZScsIGNvbmZpZyksXG4gICAgICAgIGdyYW50X3R5cGU6ICdhdXRob3JpemF0aW9uX2NvZGUnXG4gICAgICB9fSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IE9iamVjdC5hc3NpZ24oXG4gICAgICBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gY29tcGxldGUgT0F1dGggaGFuZHNoYWtlIHdpdGggR29vZ2xlLiBcIiArIGVyci5tZXNzYWdlKSxcbiAgICAgIHsgcmVzcG9uc2U6IGVyci5yZXNwb25zZSB9XG4gICAgKTtcbiAgfVxuXG4gIGlmIChyZXNwb25zZS5kYXRhLmVycm9yKSB7IC8vIGlmIHRoZSBodHRwIHJlc3BvbnNlIHdhcyBhIGpzb24gb2JqZWN0IHdpdGggYW4gZXJyb3IgYXR0cmlidXRlXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGNvbXBsZXRlIE9BdXRoIGhhbmRzaGFrZSB3aXRoIEdvb2dsZS4gXCIgKyByZXNwb25zZS5kYXRhLmVycm9yKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWNjZXNzVG9rZW46IHJlc3BvbnNlLmRhdGEuYWNjZXNzX3Rva2VuLFxuICAgICAgcmVmcmVzaFRva2VuOiByZXNwb25zZS5kYXRhLnJlZnJlc2hfdG9rZW4sXG4gICAgICBleHBpcmVzSW46IHJlc3BvbnNlLmRhdGEuZXhwaXJlc19pbixcbiAgICAgIGlkVG9rZW46IHJlc3BvbnNlLmRhdGEuaWRfdG9rZW5cbiAgICB9O1xuICB9XG59O1xuXG52YXIgZ2V0SWRlbnRpdHkgPSBmdW5jdGlvbiAoYWNjZXNzVG9rZW4pIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSFRUUC5nZXQoXG4gICAgICBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS91c2VyaW5mb1wiLFxuICAgICAge3BhcmFtczoge2FjY2Vzc190b2tlbjogYWNjZXNzVG9rZW59fSkuZGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgT2JqZWN0LmFzc2lnbihcbiAgICAgIG5ldyBFcnJvcihcIkZhaWxlZCB0byBmZXRjaCBpZGVudGl0eSBmcm9tIEdvb2dsZS4gXCIgKyBlcnIubWVzc2FnZSksXG4gICAgICB7IHJlc3BvbnNlOiBlcnIucmVzcG9uc2UgfVxuICAgICk7XG4gIH1cbn07XG5cbnZhciBnZXRTY29wZXMgPSBmdW5jdGlvbiAoYWNjZXNzVG9rZW4pIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSFRUUC5nZXQoXG4gICAgICBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS90b2tlbmluZm9cIixcbiAgICAgIHtwYXJhbXM6IHthY2Nlc3NfdG9rZW46IGFjY2Vzc1Rva2VufX0pLmRhdGEuc2NvcGUuc3BsaXQoJyAnKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgT2JqZWN0LmFzc2lnbihcbiAgICAgIG5ldyBFcnJvcihcIkZhaWxlZCB0byBmZXRjaCB0b2tlbmluZm8gZnJvbSBHb29nbGUuIFwiICsgZXJyLm1lc3NhZ2UpLFxuICAgICAgeyByZXNwb25zZTogZXJyLnJlc3BvbnNlIH1cbiAgICApO1xuICB9XG59O1xuXG5Hb29nbGUucmV0cmlldmVDcmVkZW50aWFsID0gZnVuY3Rpb24oY3JlZGVudGlhbFRva2VuLCBjcmVkZW50aWFsU2VjcmV0KSB7XG4gIHJldHVybiBPQXV0aC5yZXRyaWV2ZUNyZWRlbnRpYWwoY3JlZGVudGlhbFRva2VuLCBjcmVkZW50aWFsU2VjcmV0KTtcbn07XG4iLCIvLyBUaGUgbW9kdWxlLmV4cG9ydHMgb2JqZWN0IG9mIHRoaXMgbW9kdWxlIGJlY29tZXMgdGhlIEdvb2dsZSBuYW1lc3BhY2Vcbi8vIGZvciBvdGhlciBtb2R1bGVzIGluIHRoaXMgcGFja2FnZS5cbkdvb2dsZSA9IG1vZHVsZS5leHBvcnRzO1xuXG4vLyBTbyB0aGF0IGFwaS5leHBvcnQgZmluZHMgdGhlIFwiR29vZ2xlXCIgcHJvcGVydHkuXG5Hb29nbGUuR29vZ2xlID0gR29vZ2xlO1xuIl19
