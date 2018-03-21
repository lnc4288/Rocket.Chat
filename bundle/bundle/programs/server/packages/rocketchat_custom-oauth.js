(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var check = Package.check.check;
var Match = Package.check.Match;
var OAuth = Package.oauth.OAuth;
var Oauth = Package.oauth.Oauth;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Accounts = Package['accounts-base'].Accounts;

/* Package-scope variables */
var CustomOAuth;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:custom-oauth":{"server":{"custom_oauth_server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_custom-oauth/server/custom_oauth_server.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
module.export({
  CustomOAuth: () => CustomOAuth
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
const logger = new Logger('CustomOAuth');
const Services = {};
const BeforeUpdateOrCreateUserFromExternalService = [];

class CustomOAuth {
  constructor(name, options) {
    logger.debug('Init CustomOAuth', name, options);
    this.name = name;

    if (!Match.test(this.name, String)) {
      throw new Meteor.Error('CustomOAuth: Name is required and must be String');
    }

    if (Services[this.name]) {
      Services[this.name].configure(options);
      return;
    }

    Services[this.name] = this;
    this.configure(options);
    this.userAgent = 'Meteor';

    if (Meteor.release) {
      this.userAgent += `/${Meteor.release}`;
    }

    Accounts.oauth.registerService(this.name);
    this.registerService();
    this.addHookToProcessUser();
  }

  configure(options) {
    if (!Match.test(options, Object)) {
      throw new Meteor.Error('CustomOAuth: Options is required and must be Object');
    }

    if (!Match.test(options.serverURL, String)) {
      throw new Meteor.Error('CustomOAuth: Options.serverURL is required and must be String');
    }

    if (!Match.test(options.tokenPath, String)) {
      options.tokenPath = '/oauth/token';
    }

    if (!Match.test(options.identityPath, String)) {
      options.identityPath = '/me';
    }

    this.serverURL = options.serverURL;
    this.tokenPath = options.tokenPath;
    this.identityPath = options.identityPath;
    this.tokenSentVia = options.tokenSentVia;
    this.identityTokenSentVia = options.identityTokenSentVia;
    this.usernameField = (options.usernameField || '').trim();
    this.mergeUsers = options.mergeUsers;

    if (this.identityTokenSentVia == null || this.identityTokenSentVia === 'default') {
      this.identityTokenSentVia = this.tokenSentVia;
    }

    if (!/^https?:\/\/.+/.test(this.tokenPath)) {
      this.tokenPath = this.serverURL + this.tokenPath;
    }

    if (!/^https?:\/\/.+/.test(this.identityPath)) {
      this.identityPath = this.serverURL + this.identityPath;
    }

    if (Match.test(options.addAutopublishFields, Object)) {
      Accounts.addAutopublishFields(options.addAutopublishFields);
    }
  }

  getAccessToken(query) {
    const config = ServiceConfiguration.configurations.findOne({
      service: this.name
    });

    if (!config) {
      throw new ServiceConfiguration.ConfigError();
    }

    let response = undefined;
    const allOptions = {
      headers: {
        'User-Agent': this.userAgent,
        // http://doc.gitlab.com/ce/api/users.html#Current-user
        Accept: 'application/json'
      },
      params: {
        code: query.code,
        redirect_uri: OAuth._redirectUri(this.name, config),
        grant_type: 'authorization_code',
        state: query.state
      }
    }; // Only send clientID / secret once on header or payload.

    if (this.tokenSentVia === 'header') {
      allOptions['auth'] = `${config.clientId}:${OAuth.openSecret(config.secret)}`;
    } else {
      allOptions['params']['client_secret'] = OAuth.openSecret(config.secret);
      allOptions['params']['client_id'] = config.clientId;
    }

    try {
      response = HTTP.post(this.tokenPath, allOptions);
    } catch (err) {
      const error = new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${err.message}`);
      throw _.extend(error, {
        response: err.response
      });
    }

    let data;

    if (response.data) {
      data = response.data;
    } else {
      data = JSON.parse(response.content);
    }

    if (data.error) {
      //if the http response was a json object with an error attribute
      throw new Error(`Failed to complete OAuth handshake with ${this.name} at ${this.tokenPath}. ${data.error}`);
    } else {
      return data.access_token;
    }
  }

  getIdentity(accessToken) {
    const params = {};
    const headers = {
      'User-Agent': this.userAgent // http://doc.gitlab.com/ce/api/users.html#Current-user

    };

    if (this.identityTokenSentVia === 'header') {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else {
      params['access_token'] = accessToken;
    }

    try {
      const response = HTTP.get(this.identityPath, {
        headers,
        params
      });
      let data;

      if (response.data) {
        data = response.data;
      } else {
        data = JSON.parse(response.content);
      }

      logger.debug('Identity response', JSON.stringify(data, null, 2));
      return data;
    } catch (err) {
      const error = new Error(`Failed to fetch identity from ${this.name} at ${this.identityPath}. ${err.message}`);
      throw _.extend(error, {
        response: err.response
      });
    }
  }

  registerService() {
    const self = this;
    OAuth.registerService(this.name, 2, null, query => {
      const accessToken = self.getAccessToken(query); // console.log 'at:', accessToken

      let identity = self.getIdentity(accessToken);

      if (identity) {
        // Set 'id' to '_id' for any sources that provide it
        if (identity._id && !identity.id) {
          identity.id = identity._id;
        } // Fix for Reddit


        if (identity.result) {
          identity = identity.result;
        } // Fix WordPress-like identities having 'ID' instead of 'id'


        if (identity.ID && !identity.id) {
          identity.id = identity.ID;
        } // Fix Auth0-like identities having 'user_id' instead of 'id'


        if (identity.user_id && !identity.id) {
          identity.id = identity.user_id;
        }

        if (identity.CharacterID && !identity.id) {
          identity.id = identity.CharacterID;
        } // Fix Dataporten having 'user.userid' instead of 'id'


        if (identity.user && identity.user.userid && !identity.id) {
          if (identity.user.userid_sec && identity.user.userid_sec[0]) {
            identity.id = identity.user.userid_sec[0];
          } else {
            identity.id = identity.user.userid;
          }

          identity.email = identity.user.email;
        } // Fix for Xenforo [BD]API plugin for 'user.user_id; instead of 'id'


        if (identity.user && identity.user.user_id && !identity.id) {
          identity.id = identity.user.user_id;
          identity.email = identity.user.user_email;
        } // Fix general 'phid' instead of 'id' from phabricator


        if (identity.phid && !identity.id) {
          identity.id = identity.phid;
        } // Fix Keycloak-like identities having 'sub' instead of 'id'


        if (identity.sub && !identity.id) {
          identity.id = identity.sub;
        } // Fix general 'userid' instead of 'id' from provider


        if (identity.userid && !identity.id) {
          identity.id = identity.userid;
        } // Fix when authenticating from a meteor app with 'emails' field


        if (!identity.email && identity.emails && Array.isArray(identity.emails) && identity.emails.length >= 1) {
          identity.email = identity.emails[0].address ? identity.emails[0].address : undefined;
        }
      } // console.log 'id:', JSON.stringify identity, null, '  '


      const serviceData = {
        _OAuthCustom: true,
        accessToken
      };

      _.extend(serviceData, identity);

      const data = {
        serviceData,
        options: {
          profile: {
            name: identity.name || identity.username || identity.nickname || identity.CharacterName || identity.userName || identity.preferred_username || identity.user && identity.user.name
          }
        }
      }; // console.log data

      return data;
    });
  }

  retrieveCredential(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
  }

  getUsername(data) {
    let username = '';
    username = this.usernameField.split('.').reduce(function (prev, curr) {
      return prev ? prev[curr] : undefined;
    }, data);

    if (!username) {
      throw new Meteor.Error('field_not_found', `Username field "${this.usernameField}" not found in data`, data);
    }

    return username;
  }

  addHookToProcessUser() {
    BeforeUpdateOrCreateUserFromExternalService.push((serviceName, serviceData
    /*, options*/
    ) => {
      if (serviceName !== this.name) {
        return;
      }

      if (this.usernameField) {
        const username = this.getUsername(serviceData);
        const user = RocketChat.models.Users.findOneByUsername(username);

        if (!user) {
          return;
        } // User already created or merged


        if (user.services && user.services[serviceName] && user.services[serviceName].id === serviceData.id) {
          return;
        }

        if (this.mergeUsers !== true) {
          throw new Meteor.Error('CustomOAuth', `User with username ${user.username} already exists`);
        }

        const serviceIdKey = `services.${serviceName}.id`;
        const update = {
          $set: {
            [serviceIdKey]: serviceData.id
          }
        };
        RocketChat.models.Users.update({
          _id: user._id
        }, update);
      }
    });
    Accounts.validateNewUser(user => {
      if (!user.services || !user.services[this.name] || !user.services[this.name].id) {
        return true;
      }

      if (this.usernameField) {
        user.username = this.getUsername(user.services[this.name]);
      }

      return true;
    });
  }

}

const updateOrCreateUserFromExternalService = Accounts.updateOrCreateUserFromExternalService;

Accounts.updateOrCreateUserFromExternalService = function ()
/*serviceName, serviceData, options*/
{
  for (const hook of BeforeUpdateOrCreateUserFromExternalService) {
    hook.apply(this, arguments);
  }

  return updateOrCreateUserFromExternalService.apply(this, arguments);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:custom-oauth/server/custom_oauth_server.js");

/* Exports */
Package._define("rocketchat:custom-oauth", exports, {
  CustomOAuth: CustomOAuth
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_custom-oauth.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjdXN0b20tb2F1dGgvc2VydmVyL2N1c3RvbV9vYXV0aF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiQ3VzdG9tT0F1dGgiLCJfIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJsb2dnZXIiLCJMb2dnZXIiLCJTZXJ2aWNlcyIsIkJlZm9yZVVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJvcHRpb25zIiwiZGVidWciLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJNZXRlb3IiLCJFcnJvciIsImNvbmZpZ3VyZSIsInVzZXJBZ2VudCIsInJlbGVhc2UiLCJBY2NvdW50cyIsIm9hdXRoIiwicmVnaXN0ZXJTZXJ2aWNlIiwiYWRkSG9va1RvUHJvY2Vzc1VzZXIiLCJPYmplY3QiLCJzZXJ2ZXJVUkwiLCJ0b2tlblBhdGgiLCJpZGVudGl0eVBhdGgiLCJ0b2tlblNlbnRWaWEiLCJpZGVudGl0eVRva2VuU2VudFZpYSIsInVzZXJuYW1lRmllbGQiLCJ0cmltIiwibWVyZ2VVc2VycyIsImFkZEF1dG9wdWJsaXNoRmllbGRzIiwiZ2V0QWNjZXNzVG9rZW4iLCJxdWVyeSIsImNvbmZpZyIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJmaW5kT25lIiwic2VydmljZSIsIkNvbmZpZ0Vycm9yIiwicmVzcG9uc2UiLCJ1bmRlZmluZWQiLCJhbGxPcHRpb25zIiwiaGVhZGVycyIsIkFjY2VwdCIsInBhcmFtcyIsImNvZGUiLCJyZWRpcmVjdF91cmkiLCJPQXV0aCIsIl9yZWRpcmVjdFVyaSIsImdyYW50X3R5cGUiLCJzdGF0ZSIsImNsaWVudElkIiwib3BlblNlY3JldCIsInNlY3JldCIsIkhUVFAiLCJwb3N0IiwiZXJyIiwiZXJyb3IiLCJtZXNzYWdlIiwiZXh0ZW5kIiwiZGF0YSIsIkpTT04iLCJwYXJzZSIsImNvbnRlbnQiLCJhY2Nlc3NfdG9rZW4iLCJnZXRJZGVudGl0eSIsImFjY2Vzc1Rva2VuIiwiZ2V0Iiwic3RyaW5naWZ5Iiwic2VsZiIsImlkZW50aXR5IiwiX2lkIiwiaWQiLCJyZXN1bHQiLCJJRCIsInVzZXJfaWQiLCJDaGFyYWN0ZXJJRCIsInVzZXIiLCJ1c2VyaWQiLCJ1c2VyaWRfc2VjIiwiZW1haWwiLCJ1c2VyX2VtYWlsIiwicGhpZCIsInN1YiIsImVtYWlscyIsIkFycmF5IiwiaXNBcnJheSIsImxlbmd0aCIsImFkZHJlc3MiLCJzZXJ2aWNlRGF0YSIsIl9PQXV0aEN1c3RvbSIsInByb2ZpbGUiLCJ1c2VybmFtZSIsIm5pY2tuYW1lIiwiQ2hhcmFjdGVyTmFtZSIsInVzZXJOYW1lIiwicHJlZmVycmVkX3VzZXJuYW1lIiwicmV0cmlldmVDcmVkZW50aWFsIiwiY3JlZGVudGlhbFRva2VuIiwiY3JlZGVudGlhbFNlY3JldCIsImdldFVzZXJuYW1lIiwic3BsaXQiLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsInB1c2giLCJzZXJ2aWNlTmFtZSIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmVCeVVzZXJuYW1lIiwic2VydmljZXMiLCJzZXJ2aWNlSWRLZXkiLCJ1cGRhdGUiLCIkc2V0IiwidmFsaWRhdGVOZXdVc2VyIiwidXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSIsImhvb2siLCJhcHBseSIsImFyZ3VtZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE1BQVAsQ0FBYztBQUFDQyxlQUFZLE1BQUlBO0FBQWpCLENBQWQ7O0FBQTZDLElBQUlDLENBQUo7O0FBQU1ILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNKLFFBQUVJLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7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QUFBUztBQUF1QztBQUNoRyxPQUFLLE1BQU1DLElBQVgsSUFBbUJqSCwyQ0FBbkIsRUFBZ0U7QUFDL0RpSCxTQUFLQyxLQUFMLENBQVcsSUFBWCxFQUFpQkMsU0FBakI7QUFDQTs7QUFFRCxTQUFPSCxzQ0FBc0NFLEtBQXRDLENBQTRDLElBQTVDLEVBQWtEQyxTQUFsRCxDQUFQO0FBQ0EsQ0FORCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2N1c3RvbS1vYXV0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qZ2xvYmFscyBPQXV0aCovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignQ3VzdG9tT0F1dGgnKTtcblxuY29uc3QgU2VydmljZXMgPSB7fTtcbmNvbnN0IEJlZm9yZVVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UgPSBbXTtcblxuZXhwb3J0IGNsYXNzIEN1c3RvbU9BdXRoIHtcblx0Y29uc3RydWN0b3IobmFtZSwgb3B0aW9ucykge1xuXHRcdGxvZ2dlci5kZWJ1ZygnSW5pdCBDdXN0b21PQXV0aCcsIG5hbWUsIG9wdGlvbnMpO1xuXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHRpZiAoIU1hdGNoLnRlc3QodGhpcy5uYW1lLCBTdHJpbmcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21PQXV0aDogTmFtZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBTdHJpbmcnKTtcblx0XHR9XG5cblx0XHRpZiAoU2VydmljZXNbdGhpcy5uYW1lXSkge1xuXHRcdFx0U2VydmljZXNbdGhpcy5uYW1lXS5jb25maWd1cmUob3B0aW9ucyk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0U2VydmljZXNbdGhpcy5uYW1lXSA9IHRoaXM7XG5cblx0XHR0aGlzLmNvbmZpZ3VyZShvcHRpb25zKTtcblxuXHRcdHRoaXMudXNlckFnZW50ID0gJ01ldGVvcic7XG5cdFx0aWYgKE1ldGVvci5yZWxlYXNlKSB7XG5cdFx0XHR0aGlzLnVzZXJBZ2VudCArPSBgLyR7IE1ldGVvci5yZWxlYXNlIH1gO1xuXHRcdH1cblxuXHRcdEFjY291bnRzLm9hdXRoLnJlZ2lzdGVyU2VydmljZSh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucmVnaXN0ZXJTZXJ2aWNlKCk7XG5cdFx0dGhpcy5hZGRIb29rVG9Qcm9jZXNzVXNlcigpO1xuXHR9XG5cblx0Y29uZmlndXJlKG9wdGlvbnMpIHtcblx0XHRpZiAoIU1hdGNoLnRlc3Qob3B0aW9ucywgT2JqZWN0KSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ3VzdG9tT0F1dGg6IE9wdGlvbnMgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgT2JqZWN0Jyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFNYXRjaC50ZXN0KG9wdGlvbnMuc2VydmVyVVJMLCBTdHJpbmcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21PQXV0aDogT3B0aW9ucy5zZXJ2ZXJVUkwgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgU3RyaW5nJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFNYXRjaC50ZXN0KG9wdGlvbnMudG9rZW5QYXRoLCBTdHJpbmcpKSB7XG5cdFx0XHRvcHRpb25zLnRva2VuUGF0aCA9ICcvb2F1dGgvdG9rZW4nO1xuXHRcdH1cblxuXHRcdGlmICghTWF0Y2gudGVzdChvcHRpb25zLmlkZW50aXR5UGF0aCwgU3RyaW5nKSkge1xuXHRcdFx0b3B0aW9ucy5pZGVudGl0eVBhdGggPSAnL21lJztcblx0XHR9XG5cblx0XHR0aGlzLnNlcnZlclVSTCA9IG9wdGlvbnMuc2VydmVyVVJMO1xuXHRcdHRoaXMudG9rZW5QYXRoID0gb3B0aW9ucy50b2tlblBhdGg7XG5cdFx0dGhpcy5pZGVudGl0eVBhdGggPSBvcHRpb25zLmlkZW50aXR5UGF0aDtcblx0XHR0aGlzLnRva2VuU2VudFZpYSA9IG9wdGlvbnMudG9rZW5TZW50VmlhO1xuXHRcdHRoaXMuaWRlbnRpdHlUb2tlblNlbnRWaWEgPSBvcHRpb25zLmlkZW50aXR5VG9rZW5TZW50VmlhO1xuXHRcdHRoaXMudXNlcm5hbWVGaWVsZCA9IChvcHRpb25zLnVzZXJuYW1lRmllbGQgfHwgJycpLnRyaW0oKTtcblx0XHR0aGlzLm1lcmdlVXNlcnMgPSBvcHRpb25zLm1lcmdlVXNlcnM7XG5cblx0XHRpZiAodGhpcy5pZGVudGl0eVRva2VuU2VudFZpYSA9PSBudWxsIHx8IHRoaXMuaWRlbnRpdHlUb2tlblNlbnRWaWEgPT09ICdkZWZhdWx0Jykge1xuXHRcdFx0dGhpcy5pZGVudGl0eVRva2VuU2VudFZpYSA9IHRoaXMudG9rZW5TZW50VmlhO1xuXHRcdH1cblxuXHRcdGlmICghL15odHRwcz86XFwvXFwvLisvLnRlc3QodGhpcy50b2tlblBhdGgpKSB7XG5cdFx0XHR0aGlzLnRva2VuUGF0aCA9IHRoaXMuc2VydmVyVVJMICsgdGhpcy50b2tlblBhdGg7XG5cdFx0fVxuXG5cdFx0aWYgKCEvXmh0dHBzPzpcXC9cXC8uKy8udGVzdCh0aGlzLmlkZW50aXR5UGF0aCkpIHtcblx0XHRcdHRoaXMuaWRlbnRpdHlQYXRoID0gdGhpcy5zZXJ2ZXJVUkwgKyB0aGlzLmlkZW50aXR5UGF0aDtcblx0XHR9XG5cblx0XHRpZiAoTWF0Y2gudGVzdChvcHRpb25zLmFkZEF1dG9wdWJsaXNoRmllbGRzLCBPYmplY3QpKSB7XG5cdFx0XHRBY2NvdW50cy5hZGRBdXRvcHVibGlzaEZpZWxkcyhvcHRpb25zLmFkZEF1dG9wdWJsaXNoRmllbGRzKTtcblx0XHR9XG5cdH1cblxuXHRnZXRBY2Nlc3NUb2tlbihxdWVyeSkge1xuXHRcdGNvbnN0IGNvbmZpZyA9IFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmZpbmRPbmUoe3NlcnZpY2U6IHRoaXMubmFtZX0pO1xuXHRcdGlmICghY29uZmlnKSB7XG5cdFx0XHR0aHJvdyBuZXcgU2VydmljZUNvbmZpZ3VyYXRpb24uQ29uZmlnRXJyb3IoKTtcblx0XHR9XG5cblx0XHRsZXQgcmVzcG9uc2UgPSB1bmRlZmluZWQ7XG5cblx0XHRjb25zdCBhbGxPcHRpb25zID0ge1xuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnVXNlci1BZ2VudCc6IHRoaXMudXNlckFnZW50LCAvLyBodHRwOi8vZG9jLmdpdGxhYi5jb20vY2UvYXBpL3VzZXJzLmh0bWwjQ3VycmVudC11c2VyXG5cdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0XHR9LFxuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdGNvZGU6IHF1ZXJ5LmNvZGUsXG5cdFx0XHRcdHJlZGlyZWN0X3VyaTogT0F1dGguX3JlZGlyZWN0VXJpKHRoaXMubmFtZSwgY29uZmlnKSxcblx0XHRcdFx0Z3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZScsXG5cdFx0XHRcdHN0YXRlOiBxdWVyeS5zdGF0ZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBPbmx5IHNlbmQgY2xpZW50SUQgLyBzZWNyZXQgb25jZSBvbiBoZWFkZXIgb3IgcGF5bG9hZC5cblx0XHRpZiAodGhpcy50b2tlblNlbnRWaWEgPT09ICdoZWFkZXInKSB7XG5cdFx0XHRhbGxPcHRpb25zWydhdXRoJ10gPSBgJHsgY29uZmlnLmNsaWVudElkIH06JHsgT0F1dGgub3BlblNlY3JldChjb25maWcuc2VjcmV0KSB9YDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YWxsT3B0aW9uc1sncGFyYW1zJ11bJ2NsaWVudF9zZWNyZXQnXSA9IE9BdXRoLm9wZW5TZWNyZXQoY29uZmlnLnNlY3JldCk7XG5cdFx0XHRhbGxPcHRpb25zWydwYXJhbXMnXVsnY2xpZW50X2lkJ10gPSBjb25maWcuY2xpZW50SWQ7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdHJlc3BvbnNlID0gSFRUUC5wb3N0KHRoaXMudG9rZW5QYXRoLCBhbGxPcHRpb25zKTtcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBGYWlsZWQgdG8gY29tcGxldGUgT0F1dGggaGFuZHNoYWtlIHdpdGggJHsgdGhpcy5uYW1lIH0gYXQgJHsgdGhpcy50b2tlblBhdGggfS4gJHsgZXJyLm1lc3NhZ2UgfWApO1xuXHRcdFx0dGhyb3cgXy5leHRlbmQoZXJyb3IsIHtyZXNwb25zZTogZXJyLnJlc3BvbnNlfSk7XG5cdFx0fVxuXG5cdFx0bGV0IGRhdGE7XG5cdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdGRhdGEgPSByZXNwb25zZS5kYXRhO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcblx0XHR9XG5cblx0XHRpZiAoZGF0YS5lcnJvcikgeyAvL2lmIHRoZSBodHRwIHJlc3BvbnNlIHdhcyBhIGpzb24gb2JqZWN0IHdpdGggYW4gZXJyb3IgYXR0cmlidXRlXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjb21wbGV0ZSBPQXV0aCBoYW5kc2hha2Ugd2l0aCAkeyB0aGlzLm5hbWUgfSBhdCAkeyB0aGlzLnRva2VuUGF0aCB9LiAkeyBkYXRhLmVycm9yIH1gKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGRhdGEuYWNjZXNzX3Rva2VuO1xuXHRcdH1cblx0fVxuXG5cdGdldElkZW50aXR5KGFjY2Vzc1Rva2VuKSB7XG5cdFx0Y29uc3QgcGFyYW1zID0ge307XG5cdFx0Y29uc3QgaGVhZGVycyA9IHtcblx0XHRcdCdVc2VyLUFnZW50JzogdGhpcy51c2VyQWdlbnQgLy8gaHR0cDovL2RvYy5naXRsYWIuY29tL2NlL2FwaS91c2Vycy5odG1sI0N1cnJlbnQtdXNlclxuXHRcdH07XG5cblx0XHRpZiAodGhpcy5pZGVudGl0eVRva2VuU2VudFZpYSA9PT0gJ2hlYWRlcicpIHtcblx0XHRcdGhlYWRlcnNbJ0F1dGhvcml6YXRpb24nXSA9IGBCZWFyZXIgJHsgYWNjZXNzVG9rZW4gfWA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHBhcmFtc1snYWNjZXNzX3Rva2VuJ10gPSBhY2Nlc3NUb2tlbjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldCh0aGlzLmlkZW50aXR5UGF0aCwge1xuXHRcdFx0XHRoZWFkZXJzLFxuXHRcdFx0XHRwYXJhbXNcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgZGF0YTtcblxuXHRcdFx0aWYgKHJlc3BvbnNlLmRhdGEpIHtcblx0XHRcdFx0ZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShyZXNwb25zZS5jb250ZW50KTtcblx0XHRcdH1cblxuXHRcdFx0bG9nZ2VyLmRlYnVnKCdJZGVudGl0eSByZXNwb25zZScsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpKTtcblxuXHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIGlkZW50aXR5IGZyb20gJHsgdGhpcy5uYW1lIH0gYXQgJHsgdGhpcy5pZGVudGl0eVBhdGggfS4gJHsgZXJyLm1lc3NhZ2UgfWApO1xuXHRcdFx0dGhyb3cgXy5leHRlbmQoZXJyb3IsIHtyZXNwb25zZTogZXJyLnJlc3BvbnNlfSk7XG5cdFx0fVxuXHR9XG5cblx0cmVnaXN0ZXJTZXJ2aWNlKCkge1xuXHRcdGNvbnN0IHNlbGYgPSB0aGlzO1xuXHRcdE9BdXRoLnJlZ2lzdGVyU2VydmljZSh0aGlzLm5hbWUsIDIsIG51bGwsIChxdWVyeSkgPT4ge1xuXHRcdFx0Y29uc3QgYWNjZXNzVG9rZW4gPSBzZWxmLmdldEFjY2Vzc1Rva2VuKHF1ZXJ5KTtcblx0XHRcdC8vIGNvbnNvbGUubG9nICdhdDonLCBhY2Nlc3NUb2tlblxuXG5cdFx0XHRsZXQgaWRlbnRpdHkgPSBzZWxmLmdldElkZW50aXR5KGFjY2Vzc1Rva2VuKTtcblxuXHRcdFx0aWYgKGlkZW50aXR5KSB7XG5cdFx0XHRcdC8vIFNldCAnaWQnIHRvICdfaWQnIGZvciBhbnkgc291cmNlcyB0aGF0IHByb3ZpZGUgaXRcblx0XHRcdFx0aWYgKGlkZW50aXR5Ll9pZCAmJiAhaWRlbnRpdHkuaWQpIHtcblx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5Ll9pZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZpeCBmb3IgUmVkZGl0XG5cdFx0XHRcdGlmIChpZGVudGl0eS5yZXN1bHQpIHtcblx0XHRcdFx0XHRpZGVudGl0eSA9IGlkZW50aXR5LnJlc3VsdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZpeCBXb3JkUHJlc3MtbGlrZSBpZGVudGl0aWVzIGhhdmluZyAnSUQnIGluc3RlYWQgb2YgJ2lkJ1xuXHRcdFx0XHRpZiAoaWRlbnRpdHkuSUQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS5JRDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZpeCBBdXRoMC1saWtlIGlkZW50aXRpZXMgaGF2aW5nICd1c2VyX2lkJyBpbnN0ZWFkIG9mICdpZCdcblx0XHRcdFx0aWYgKGlkZW50aXR5LnVzZXJfaWQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS51c2VyX2lkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGlkZW50aXR5LkNoYXJhY3RlcklEICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkuQ2hhcmFjdGVySUQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggRGF0YXBvcnRlbiBoYXZpbmcgJ3VzZXIudXNlcmlkJyBpbnN0ZWFkIG9mICdpZCdcblx0XHRcdFx0aWYgKGlkZW50aXR5LnVzZXIgJiYgaWRlbnRpdHkudXNlci51c2VyaWQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWYgKGlkZW50aXR5LnVzZXIudXNlcmlkX3NlYyAmJiBpZGVudGl0eS51c2VyLnVzZXJpZF9zZWNbMF0pIHtcblx0XHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkudXNlci51c2VyaWRfc2VjWzBdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LnVzZXIudXNlcmlkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZGVudGl0eS5lbWFpbCA9IGlkZW50aXR5LnVzZXIuZW1haWw7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gRml4IGZvciBYZW5mb3JvIFtCRF1BUEkgcGx1Z2luIGZvciAndXNlci51c2VyX2lkOyBpbnN0ZWFkIG9mICdpZCdcblx0XHRcdFx0aWYgKGlkZW50aXR5LnVzZXIgJiYgaWRlbnRpdHkudXNlci51c2VyX2lkICYmICFpZGVudGl0eS5pZCkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmlkID0gaWRlbnRpdHkudXNlci51c2VyX2lkO1xuXHRcdFx0XHRcdGlkZW50aXR5LmVtYWlsID0gaWRlbnRpdHkudXNlci51c2VyX2VtYWlsO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIEZpeCBnZW5lcmFsICdwaGlkJyBpbnN0ZWFkIG9mICdpZCcgZnJvbSBwaGFicmljYXRvclxuXHRcdFx0XHRpZiAoaWRlbnRpdHkucGhpZCAmJiAhaWRlbnRpdHkuaWQpIHtcblx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LnBoaWQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggS2V5Y2xvYWstbGlrZSBpZGVudGl0aWVzIGhhdmluZyAnc3ViJyBpbnN0ZWFkIG9mICdpZCdcblx0XHRcdFx0aWYgKGlkZW50aXR5LnN1YiAmJiAhaWRlbnRpdHkuaWQpIHtcblx0XHRcdFx0XHRpZGVudGl0eS5pZCA9IGlkZW50aXR5LnN1Yjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIEZpeCBnZW5lcmFsICd1c2VyaWQnIGluc3RlYWQgb2YgJ2lkJyBmcm9tIHByb3ZpZGVyXG5cdFx0XHRcdGlmIChpZGVudGl0eS51c2VyaWQgJiYgIWlkZW50aXR5LmlkKSB7XG5cdFx0XHRcdFx0aWRlbnRpdHkuaWQgPSBpZGVudGl0eS51c2VyaWQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBGaXggd2hlbiBhdXRoZW50aWNhdGluZyBmcm9tIGEgbWV0ZW9yIGFwcCB3aXRoICdlbWFpbHMnIGZpZWxkXG5cdFx0XHRcdGlmICghaWRlbnRpdHkuZW1haWwgJiYgKGlkZW50aXR5LmVtYWlscyAmJiBBcnJheS5pc0FycmF5KGlkZW50aXR5LmVtYWlscykgJiYgaWRlbnRpdHkuZW1haWxzLmxlbmd0aCA+PSAxKSkge1xuXHRcdFx0XHRcdGlkZW50aXR5LmVtYWlsID0gaWRlbnRpdHkuZW1haWxzWzBdLmFkZHJlc3MgPyBpZGVudGl0eS5lbWFpbHNbMF0uYWRkcmVzcyA6IHVuZGVmaW5lZDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyAnaWQ6JywgSlNPTi5zdHJpbmdpZnkgaWRlbnRpdHksIG51bGwsICcgICdcblxuXHRcdFx0Y29uc3Qgc2VydmljZURhdGEgPSB7XG5cdFx0XHRcdF9PQXV0aEN1c3RvbTogdHJ1ZSxcblx0XHRcdFx0YWNjZXNzVG9rZW5cblx0XHRcdH07XG5cblx0XHRcdF8uZXh0ZW5kKHNlcnZpY2VEYXRhLCBpZGVudGl0eSk7XG5cblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHNlcnZpY2VEYXRhLFxuXHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0cHJvZmlsZToge1xuXHRcdFx0XHRcdFx0bmFtZTogaWRlbnRpdHkubmFtZSB8fCBpZGVudGl0eS51c2VybmFtZSB8fCBpZGVudGl0eS5uaWNrbmFtZSB8fCBpZGVudGl0eS5DaGFyYWN0ZXJOYW1lIHx8IGlkZW50aXR5LnVzZXJOYW1lIHx8IGlkZW50aXR5LnByZWZlcnJlZF91c2VybmFtZSB8fCAoaWRlbnRpdHkudXNlciAmJiBpZGVudGl0eS51c2VyLm5hbWUpXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBjb25zb2xlLmxvZyBkYXRhXG5cblx0XHRcdHJldHVybiBkYXRhO1xuXHRcdH0pO1xuXHR9XG5cblx0cmV0cmlldmVDcmVkZW50aWFsKGNyZWRlbnRpYWxUb2tlbiwgY3JlZGVudGlhbFNlY3JldCkge1xuXHRcdHJldHVybiBPQXV0aC5yZXRyaWV2ZUNyZWRlbnRpYWwoY3JlZGVudGlhbFRva2VuLCBjcmVkZW50aWFsU2VjcmV0KTtcblx0fVxuXG5cdGdldFVzZXJuYW1lKGRhdGEpIHtcblx0XHRsZXQgdXNlcm5hbWUgPSAnJztcblxuXHRcdHVzZXJuYW1lID0gdGhpcy51c2VybmFtZUZpZWxkLnNwbGl0KCcuJykucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpIHtcblx0XHRcdHJldHVybiBwcmV2ID8gcHJldltjdXJyXSA6IHVuZGVmaW5lZDtcblx0XHR9LCBkYXRhKTtcblx0XHRpZiAoIXVzZXJuYW1lKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmaWVsZF9ub3RfZm91bmQnLCBgVXNlcm5hbWUgZmllbGQgXCIkeyB0aGlzLnVzZXJuYW1lRmllbGQgfVwiIG5vdCBmb3VuZCBpbiBkYXRhYCwgZGF0YSk7XG5cdFx0fVxuXHRcdHJldHVybiB1c2VybmFtZTtcblx0fVxuXG5cdGFkZEhvb2tUb1Byb2Nlc3NVc2VyKCkge1xuXHRcdEJlZm9yZVVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2UucHVzaCgoc2VydmljZU5hbWUsIHNlcnZpY2VEYXRhLyosIG9wdGlvbnMqLykgPT4ge1xuXHRcdFx0aWYgKHNlcnZpY2VOYW1lICE9PSB0aGlzLm5hbWUpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy51c2VybmFtZUZpZWxkKSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJuYW1lID0gdGhpcy5nZXRVc2VybmFtZShzZXJ2aWNlRGF0YSk7XG5cblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gVXNlciBhbHJlYWR5IGNyZWF0ZWQgb3IgbWVyZ2VkXG5cdFx0XHRcdGlmICh1c2VyLnNlcnZpY2VzICYmIHVzZXIuc2VydmljZXNbc2VydmljZU5hbWVdICYmIHVzZXIuc2VydmljZXNbc2VydmljZU5hbWVdLmlkID09PSBzZXJ2aWNlRGF0YS5pZCkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLm1lcmdlVXNlcnMgIT09IHRydWUpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21PQXV0aCcsIGBVc2VyIHdpdGggdXNlcm5hbWUgJHsgdXNlci51c2VybmFtZSB9IGFscmVhZHkgZXhpc3RzYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zdCBzZXJ2aWNlSWRLZXkgPSBgc2VydmljZXMuJHsgc2VydmljZU5hbWUgfS5pZGA7XG5cdFx0XHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdFx0XHQkc2V0OiB7XG5cdFx0XHRcdFx0XHRbc2VydmljZUlkS2V5XTogc2VydmljZURhdGEuaWRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgdXBkYXRlKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdEFjY291bnRzLnZhbGlkYXRlTmV3VXNlcigodXNlcikgPT4ge1xuXHRcdFx0aWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzW3RoaXMubmFtZV0gfHwgIXVzZXIuc2VydmljZXNbdGhpcy5uYW1lXS5pZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMudXNlcm5hbWVGaWVsZCkge1xuXHRcdFx0XHR1c2VyLnVzZXJuYW1lID0gdGhpcy5nZXRVc2VybmFtZSh1c2VyLnNlcnZpY2VzW3RoaXMubmFtZV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHR9XG59XG5cblxuY29uc3QgdXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSA9IEFjY291bnRzLnVwZGF0ZU9yQ3JlYXRlVXNlckZyb21FeHRlcm5hbFNlcnZpY2U7XG5BY2NvdW50cy51cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlID0gZnVuY3Rpb24oLypzZXJ2aWNlTmFtZSwgc2VydmljZURhdGEsIG9wdGlvbnMqLykge1xuXHRmb3IgKGNvbnN0IGhvb2sgb2YgQmVmb3JlVXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSkge1xuXHRcdGhvb2suYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0fVxuXG5cdHJldHVybiB1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuIl19
