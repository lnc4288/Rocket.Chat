(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var ServiceConfiguration = Package['service-configuration'].ServiceConfiguration;
var SyncedCron = Package['percolate:synced-cron'].SyncedCron;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:tokenpass":{"common.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/common.js                                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* global CustomOAuth */
const config = {
  serverURL: '',
  identityPath: '/oauth/user',
  authorizePath: '/oauth/authorize',
  tokenPath: '/oauth/access-token',
  scope: 'user,tca,private-balances',
  tokenSentVia: 'payload',
  usernameField: 'username',
  mergeUsers: true,
  addAutopublishFields: {
    forLoggedInUser: ['services.tokenpass'],
    forOtherUsers: ['services.tokenpass.name']
  }
};
const Tokenpass = new CustomOAuth('tokenpass', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    RocketChat.settings.get('API_Tokenpass_URL', function (key, value) {
      config.serverURL = value;
      Tokenpass.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Tokenpass_URL')) {
        config.serverURL = RocketChat.settings.get('API_Tokenpass_URL');
        Tokenpass.configure(config);
      }
    });
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/startup.js                                                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.settings.addGroup('OAuth', function () {
  this.section('Tokenpass', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Tokenpass',
      value: true
    };
    this.add('Accounts_OAuth_Tokenpass', false, {
      type: 'boolean'
    });
    this.add('API_Tokenpass_URL', '', {
      type: 'string',
      public: true,
      enableQuery,
      i18nDescription: 'API_Tokenpass_URL_Description'
    });
    this.add('Accounts_OAuth_Tokenpass_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Tokenpass_secret', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});

function validateTokenAccess(userData, roomData) {
  if (!userData || !userData.services || !userData.services.tokenpass || !userData.services.tokenpass.tcaBalances) {
    return false;
  }

  return RocketChat.Tokenpass.validateAccess(roomData.tokenpass, userData.services.tokenpass.tcaBalances);
}

Meteor.startup(function () {
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    if (!room.tokenpass || !user) {
      return false;
    }

    const userData = RocketChat.models.Users.getTokenBalancesByUserId(user._id);
    return validateTokenAccess(userData, room);
  });
  RocketChat.callbacks.add('beforeJoinRoom', function (user, room) {
    if (room.tokenpass && !validateTokenAccess(user, room)) {
      throw new Meteor.Error('error-not-allowed', 'Token required', {
        method: 'joinRoom'
      });
    }

    return room;
  });
});
Accounts.onLogin(function ({
  user
}) {
  if (user && user.services && user.services.tokenpass) {
    RocketChat.updateUserTokenpassBalances(user);
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"functions":{"getProtectedTokenpassBalances.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/getProtectedTokenpassBalances.js                                   //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let userAgent = 'Meteor';

if (Meteor.release) {
  userAgent += `/${Meteor.release}`;
}

RocketChat.getProtectedTokenpassBalances = function (accessToken) {
  try {
    return HTTP.get(`${RocketChat.settings.get('API_Tokenpass_URL')}/api/v1/tca/protected/balances`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent
      },
      params: {
        oauth_token: accessToken
      }
    }).data;
  } catch (error) {
    throw new Error(`Failed to fetch protected tokenpass balances from Tokenpass. ${error.message}`);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPublicTokenpassBalances.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/getPublicTokenpassBalances.js                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let userAgent = 'Meteor';

if (Meteor.release) {
  userAgent += `/${Meteor.release}`;
}

RocketChat.getPublicTokenpassBalances = function (accessToken) {
  try {
    return HTTP.get(`${RocketChat.settings.get('API_Tokenpass_URL')}/api/v1/tca/public/balances`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': userAgent
      },
      params: {
        oauth_token: accessToken
      }
    }).data;
  } catch (error) {
    throw new Error(`Failed to fetch public tokenpass balances from Tokenpass. ${error.message}`);
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTokens.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/saveRoomTokens.js                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.saveRoomTokenpass = function (rid, tokenpass) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTokens'
    });
  }

  return RocketChat.models.Rooms.setTokenpassById(rid, tokenpass);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTokensMinimumBalance.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/saveRoomTokensMinimumBalance.js                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTokensMinimumBalance = function (rid, roomTokensMinimumBalance) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTokensMinimumBalance'
    });
  }

  const minimumTokenBalance = parseFloat(s.escapeHTML(roomTokensMinimumBalance));
  return RocketChat.models.Rooms.setMinimumTokenBalanceById(rid, minimumTokenBalance);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateUserTokenpassBalances.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/functions/updateUserTokenpassBalances.js                                     //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.updateUserTokenpassBalances = function (user) {
  if (user && user.services && user.services.tokenpass) {
    const tcaPublicBalances = RocketChat.getPublicTokenpassBalances(user.services.tokenpass.accessToken);
    const tcaProtectedBalances = RocketChat.getProtectedTokenpassBalances(user.services.tokenpass.accessToken);

    const balances = _.uniq(_.union(tcaPublicBalances, tcaProtectedBalances), false, item => item.asset);

    RocketChat.models.Users.setTokenpassTcaBalances(user._id, balances);
    return balances;
  }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"indexes.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/indexes.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    'tokenpass.tokens.token': 1
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Rooms.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Rooms.findByTokenpass = function (tokens) {
  const query = {
    'tokenpass.tokens.token': {
      $in: tokens
    }
  };
  return this._db.find(query).fetch();
};

RocketChat.models.Rooms.setTokensById = function (_id, tokens) {
  const update = {
    $set: {
      'tokenpass.tokens.token': tokens
    }
  };
  return this.update({
    _id
  }, update);
};

RocketChat.models.Rooms.setTokenpassById = function (_id, tokenpass) {
  const update = {
    $set: {
      tokenpass
    }
  };
  return this.update({
    _id
  }, update);
};

RocketChat.models.Rooms.findAllTokenChannels = function () {
  const query = {
    tokenpass: {
      $exists: true
    }
  };
  const options = {
    fields: {
      tokenpass: 1
    }
  };
  return this._db.find(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Subscriptions.js                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Subscriptions.findByRoomIds = function (roomIds) {
  const query = {
    rid: {
      $in: roomIds
    }
  };
  const options = {
    fields: {
      'u._id': 1,
      rid: 1
    }
  };
  return this._db.find(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/models/Users.js                                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Users.setTokenpassTcaBalances = function (_id, tcaBalances) {
  const update = {
    $set: {
      'services.tokenpass.tcaBalances': tcaBalances
    }
  };
  return this.update(_id, update);
};

RocketChat.models.Users.getTokenBalancesByUserId = function (userId) {
  const query = {
    _id: userId
  };
  const options = {
    fields: {
      'services.tokenpass.tcaBalances': 1
    }
  };
  return this.findOne(query, options);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"findTokenChannels.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/methods/findTokenChannels.js                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  findTokenChannels() {
    if (!Meteor.userId()) {
      return [];
    }

    const user = Meteor.user();

    if (user.services && user.services.tokenpass && user.services.tokenpass.tcaBalances) {
      const tokens = {};
      user.services.tokenpass.tcaBalances.forEach(token => {
        tokens[token.asset] = 1;
      });
      return RocketChat.models.Rooms.findByTokenpass(Object.keys(tokens)).filter(room => RocketChat.Tokenpass.validateAccess(room.tokenpass, user.services.tokenpass.tcaBalances));
    }

    return [];
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getChannelTokenpass.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/methods/getChannelTokenpass.js                                               //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  getChannelTokenpass(rid) {
    check(rid, String);

    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getChannelTokenpass'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'getChannelTokenpass'
      });
    }

    return room.tokenpass;
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cronRemoveUsers.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/cronRemoveUsers.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* globals SyncedCron */
function removeUsersFromTokenChannels() {
  const rooms = {};
  RocketChat.models.Rooms.findAllTokenChannels().forEach(room => {
    rooms[room._id] = room.tokenpass;
  });
  const users = {};
  RocketChat.models.Subscriptions.findByRoomIds(Object.keys(rooms)).forEach(sub => {
    if (!users[sub.u._id]) {
      users[sub.u._id] = [];
    }

    users[sub.u._id].push(sub.rid);
  });
  Object.keys(users).forEach(user => {
    const userInfo = RocketChat.models.Users.findOneById(user);

    if (userInfo && userInfo.services && userInfo.services.tokenpass) {
      const balances = RocketChat.updateUserTokenpassBalances(userInfo);
      users[user].forEach(roomId => {
        const valid = RocketChat.Tokenpass.validateAccess(rooms[roomId], balances);

        if (!valid) {
          RocketChat.removeUserFromRoom(roomId, userInfo);
        }
      });
    }
  });
}

Meteor.startup(function () {
  Meteor.defer(function () {
    removeUsersFromTokenChannels();
    SyncedCron.add({
      name: 'Remove users from Token Channels',
      schedule: parser => parser.cron('0 * * * *'),
      job: removeUsersFromTokenChannels
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Tokenpass.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_tokenpass/server/Tokenpass.js                                                                 //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.Tokenpass = {
  validateAccess(tokenpass, balances) {
    const compFunc = tokenpass.require === 'any' ? 'some' : 'every';
    return tokenpass.tokens[compFunc](config => {
      return balances.some(userToken => {
        return config.token === userToken.asset && parseFloat(config.balance) <= parseFloat(userToken.balance);
      });
    });
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:tokenpass/common.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/startup.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/getProtectedTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/getPublicTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/saveRoomTokens.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/saveRoomTokensMinimumBalance.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/functions/updateUserTokenpassBalances.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/models/Users.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/methods/findTokenChannels.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/methods/getChannelTokenpass.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/cronRemoveUsers.js");
require("/node_modules/meteor/rocketchat:tokenpass/server/Tokenpass.js");

/* Exports */
Package._define("rocketchat:tokenpass");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_tokenpass.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3MvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXRQcm90ZWN0ZWRUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXRQdWJsaWNUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVRva2Vucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVRva2Vuc01pbmltdW1CYWxhbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvZnVuY3Rpb25zL3VwZGF0ZVVzZXJUb2tlbnBhc3NCYWxhbmNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp0b2tlbnBhc3Mvc2VydmVyL21vZGVscy9pbmRleGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbW9kZWxzL1Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbW9kZWxzL1N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dG9rZW5wYXNzL3NlcnZlci9tb2RlbHMvVXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6dG9rZW5wYXNzL3NlcnZlci9tZXRob2RzL2ZpbmRUb2tlbkNoYW5uZWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvbWV0aG9kcy9nZXRDaGFubmVsVG9rZW5wYXNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvY3JvblJlbW92ZVVzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnRva2VucGFzcy9zZXJ2ZXIvVG9rZW5wYXNzLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImF1dGhvcml6ZVBhdGgiLCJ0b2tlblBhdGgiLCJzY29wZSIsInRva2VuU2VudFZpYSIsInVzZXJuYW1lRmllbGQiLCJtZXJnZVVzZXJzIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwiVG9rZW5wYXNzIiwiQ3VzdG9tT0F1dGgiLCJNZXRlb3IiLCJpc1NlcnZlciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsImNvbmZpZ3VyZSIsIlRyYWNrZXIiLCJhdXRvcnVuIiwiYWRkR3JvdXAiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiaTE4bkRlc2NyaXB0aW9uIiwicmVhZG9ubHkiLCJmb3JjZSIsInZhbGlkYXRlVG9rZW5BY2Nlc3MiLCJ1c2VyRGF0YSIsInJvb21EYXRhIiwic2VydmljZXMiLCJ0b2tlbnBhc3MiLCJ0Y2FCYWxhbmNlcyIsInZhbGlkYXRlQWNjZXNzIiwiYXV0aHoiLCJhZGRSb29tQWNjZXNzVmFsaWRhdG9yIiwicm9vbSIsInVzZXIiLCJtb2RlbHMiLCJVc2VycyIsImdldFRva2VuQmFsYW5jZXNCeVVzZXJJZCIsImNhbGxiYWNrcyIsIkVycm9yIiwibWV0aG9kIiwiQWNjb3VudHMiLCJvbkxvZ2luIiwidXBkYXRlVXNlclRva2VucGFzc0JhbGFuY2VzIiwidXNlckFnZW50IiwicmVsZWFzZSIsImdldFByb3RlY3RlZFRva2VucGFzc0JhbGFuY2VzIiwiYWNjZXNzVG9rZW4iLCJIVFRQIiwiaGVhZGVycyIsIkFjY2VwdCIsInBhcmFtcyIsIm9hdXRoX3Rva2VuIiwiZGF0YSIsImVycm9yIiwibWVzc2FnZSIsImdldFB1YmxpY1Rva2VucGFzc0JhbGFuY2VzIiwic2F2ZVJvb21Ub2tlbnBhc3MiLCJyaWQiLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJSb29tcyIsInNldFRva2VucGFzc0J5SWQiLCJzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzYXZlUm9vbVRva2Vuc01pbmltdW1CYWxhbmNlIiwicm9vbVRva2Vuc01pbmltdW1CYWxhbmNlIiwibWluaW11bVRva2VuQmFsYW5jZSIsInBhcnNlRmxvYXQiLCJlc2NhcGVIVE1MIiwic2V0TWluaW11bVRva2VuQmFsYW5jZUJ5SWQiLCJfIiwidGNhUHVibGljQmFsYW5jZXMiLCJ0Y2FQcm90ZWN0ZWRCYWxhbmNlcyIsImJhbGFuY2VzIiwidW5pcSIsInVuaW9uIiwiaXRlbSIsImFzc2V0Iiwic2V0VG9rZW5wYXNzVGNhQmFsYW5jZXMiLCJ0cnlFbnN1cmVJbmRleCIsImZpbmRCeVRva2VucGFzcyIsInRva2VucyIsInF1ZXJ5IiwiJGluIiwiX2RiIiwiZmluZCIsImZldGNoIiwic2V0VG9rZW5zQnlJZCIsInVwZGF0ZSIsIiRzZXQiLCJmaW5kQWxsVG9rZW5DaGFubmVscyIsIiRleGlzdHMiLCJvcHRpb25zIiwiZmllbGRzIiwiU3Vic2NyaXB0aW9ucyIsImZpbmRCeVJvb21JZHMiLCJyb29tSWRzIiwidXNlcklkIiwiZmluZE9uZSIsIm1ldGhvZHMiLCJmaW5kVG9rZW5DaGFubmVscyIsImZvckVhY2giLCJ0b2tlbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXIiLCJnZXRDaGFubmVsVG9rZW5wYXNzIiwiY2hlY2siLCJmaW5kT25lQnlJZCIsInJlbW92ZVVzZXJzRnJvbVRva2VuQ2hhbm5lbHMiLCJyb29tcyIsInVzZXJzIiwic3ViIiwidSIsInB1c2giLCJ1c2VySW5mbyIsInJvb21JZCIsInZhbGlkIiwicmVtb3ZlVXNlckZyb21Sb29tIiwiZGVmZXIiLCJTeW5jZWRDcm9uIiwibmFtZSIsInNjaGVkdWxlIiwicGFyc2VyIiwiY3JvbiIsImpvYiIsImNvbXBGdW5jIiwic29tZSIsInVzZXJUb2tlbiIsImJhbGFuY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQSxNQUFNQSxTQUFTO0FBQ2RDLGFBQVcsRUFERztBQUVkQyxnQkFBYyxhQUZBO0FBR2RDLGlCQUFlLGtCQUhEO0FBSWRDLGFBQVcscUJBSkc7QUFLZEMsU0FBTywyQkFMTztBQU1kQyxnQkFBYyxTQU5BO0FBT2RDLGlCQUFlLFVBUEQ7QUFRZEMsY0FBWSxJQVJFO0FBU2RDLHdCQUFzQjtBQUNyQkMscUJBQWlCLENBQUMsb0JBQUQsQ0FESTtBQUVyQkMsbUJBQWUsQ0FBQyx5QkFBRDtBQUZNO0FBVFIsQ0FBZjtBQWVBLE1BQU1DLFlBQVksSUFBSUMsV0FBSixDQUFnQixXQUFoQixFQUE2QmIsTUFBN0IsQ0FBbEI7O0FBRUEsSUFBSWMsT0FBT0MsUUFBWCxFQUFxQjtBQUNwQkQsU0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekJDLGVBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixFQUE2QyxVQUFTQyxHQUFULEVBQWNDLEtBQWQsRUFBcUI7QUFDakVyQixhQUFPQyxTQUFQLEdBQW1Cb0IsS0FBbkI7QUFDQVQsZ0JBQVVVLFNBQVYsQ0FBb0J0QixNQUFwQjtBQUNBLEtBSEQ7QUFJQSxHQUxEO0FBTUEsQ0FQRCxNQU9PO0FBQ05jLFNBQU9F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LENBQWQ7O0FBRUEsWUFBSSxDQUFDNEMsS0FBTCxFQUFZO0FBQ1hySCxxQkFBV3NILGtCQUFYLENBQThCRixNQUE5QixFQUFzQ0QsUUFBdEM7QUFDQTtBQUNELE9BTkQ7QUFPQTtBQUNELEdBZEQ7QUFlQTs7QUFFRHRILE9BQU9FLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCRixTQUFPMEgsS0FBUCxDQUFhLFlBQVc7QUFDdkJWO0FBRUFXLGVBQVc1RyxHQUFYLENBQWU7QUFDZDZHLFlBQU0sa0NBRFE7QUFFZEMsZ0JBQVdDLE1BQUQsSUFBWUEsT0FBT0MsSUFBUCxDQUFZLFdBQVosQ0FGUjtBQUdkQyxXQUFLaEI7QUFIUyxLQUFmO0FBS0EsR0FSRDtBQVNBLENBVkQsRTs7Ozs7Ozs7Ozs7QUNsQ0E3RyxXQUFXTCxTQUFYLEdBQXVCO0FBQ3RCNkIsaUJBQWVGLFNBQWYsRUFBMEJtRCxRQUExQixFQUFvQztBQUNuQyxVQUFNcUQsV0FBV3hHLFVBQVV1QyxPQUFWLEtBQXNCLEtBQXRCLEdBQThCLE1BQTlCLEdBQXVDLE9BQXhEO0FBQ0EsV0FBT3ZDLFVBQVUyRCxNQUFWLENBQWlCNkMsUUFBakIsRUFBNEIvSSxNQUFELElBQVk7QUFDN0MsYUFBTzBGLFNBQVNzRCxJQUFULENBQWNDLGFBQWE7QUFDakMsZUFBT2pKLE9BQU91SCxLQUFQLEtBQWlCMEIsVUFBVW5ELEtBQTNCLElBQW9DVixXQUFXcEYsT0FBT2tKLE9BQWxCLEtBQThCOUQsV0FBVzZELFVBQVVDLE9BQXJCLENBQXpFO0FBQ0EsT0FGTSxDQUFQO0FBR0EsS0FKTSxDQUFQO0FBS0E7O0FBUnFCLENBQXZCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdG9rZW5wYXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIEN1c3RvbU9BdXRoICovXG5cbmNvbnN0IGNvbmZpZyA9IHtcblx0c2VydmVyVVJMOiAnJyxcblx0aWRlbnRpdHlQYXRoOiAnL29hdXRoL3VzZXInLFxuXHRhdXRob3JpemVQYXRoOiAnL29hdXRoL2F1dGhvcml6ZScsXG5cdHRva2VuUGF0aDogJy9vYXV0aC9hY2Nlc3MtdG9rZW4nLFxuXHRzY29wZTogJ3VzZXIsdGNhLHByaXZhdGUtYmFsYW5jZXMnLFxuXHR0b2tlblNlbnRWaWE6ICdwYXlsb2FkJyxcblx0dXNlcm5hbWVGaWVsZDogJ3VzZXJuYW1lJyxcblx0bWVyZ2VVc2VyczogdHJ1ZSxcblx0YWRkQXV0b3B1Ymxpc2hGaWVsZHM6IHtcblx0XHRmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMudG9rZW5wYXNzJ10sXG5cdFx0Zm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy50b2tlbnBhc3MubmFtZSddXG5cdH1cbn07XG5cbmNvbnN0IFRva2VucGFzcyA9IG5ldyBDdXN0b21PQXV0aCgndG9rZW5wYXNzJywgY29uZmlnKTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1Rva2VucGFzc19VUkwnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdFx0XHRjb25maWcuc2VydmVyVVJMID0gdmFsdWU7XG5cdFx0XHRUb2tlbnBhc3MuY29uZmlndXJlKGNvbmZpZyk7XG5cdFx0fSk7XG5cdH0pO1xufSBlbHNlIHtcblx0TWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFx0VHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfVG9rZW5wYXNzX1VSTCcpKSB7XG5cdFx0XHRcdGNvbmZpZy5zZXJ2ZXJVUkwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1Rva2VucGFzc19VUkwnKTtcblx0XHRcdFx0VG9rZW5wYXNzLmNvbmZpZ3VyZShjb25maWcpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcbn1cbiIsIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ09BdXRoJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VjdGlvbignVG9rZW5wYXNzJywgZnVuY3Rpb24oKSB7XG5cdFx0Y29uc3QgZW5hYmxlUXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdBY2NvdW50c19PQXV0aF9Ub2tlbnBhc3MnLFxuXHRcdFx0dmFsdWU6IHRydWVcblx0XHR9O1xuXG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1Rva2VucGFzcycsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJyB9KTtcblx0XHR0aGlzLmFkZCgnQVBJX1Rva2VucGFzc19VUkwnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgcHVibGljOiB0cnVlLCBlbmFibGVRdWVyeSwgaTE4bkRlc2NyaXB0aW9uOiAnQVBJX1Rva2VucGFzc19VUkxfRGVzY3JpcHRpb24nIH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Ub2tlbnBhc3NfaWQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1Rva2VucGFzc19zZWNyZXQnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1Rva2VucGFzc19jYWxsYmFja191cmwnLCAnX29hdXRoL3Rva2VucGFzcycsIHsgdHlwZTogJ3JlbGF0aXZlVXJsJywgcmVhZG9ubHk6IHRydWUsIGZvcmNlOiB0cnVlLCBlbmFibGVRdWVyeSB9KTtcblx0fSk7XG59KTtcblxuZnVuY3Rpb24gdmFsaWRhdGVUb2tlbkFjY2Vzcyh1c2VyRGF0YSwgcm9vbURhdGEpIHtcblx0aWYgKCF1c2VyRGF0YSB8fCAhdXNlckRhdGEuc2VydmljZXMgfHwgIXVzZXJEYXRhLnNlcnZpY2VzLnRva2VucGFzcyB8fCAhdXNlckRhdGEuc2VydmljZXMudG9rZW5wYXNzLnRjYUJhbGFuY2VzKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQuVG9rZW5wYXNzLnZhbGlkYXRlQWNjZXNzKHJvb21EYXRhLnRva2VucGFzcywgdXNlckRhdGEuc2VydmljZXMudG9rZW5wYXNzLnRjYUJhbGFuY2VzKTtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuYXV0aHouYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvcihmdW5jdGlvbihyb29tLCB1c2VyKSB7XG5cdFx0aWYgKCFyb29tLnRva2VucGFzcyB8fCAhdXNlcikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJEYXRhID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0VG9rZW5CYWxhbmNlc0J5VXNlcklkKHVzZXIuX2lkKTtcblxuXHRcdHJldHVybiB2YWxpZGF0ZVRva2VuQWNjZXNzKHVzZXJEYXRhLCByb29tKTtcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdiZWZvcmVKb2luUm9vbScsIGZ1bmN0aW9uKHVzZXIsIHJvb20pIHtcblx0XHRpZiAocm9vbS50b2tlbnBhc3MgJiYgIXZhbGlkYXRlVG9rZW5BY2Nlc3ModXNlciwgcm9vbSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ1Rva2VuIHJlcXVpcmVkJywgeyBtZXRob2Q6ICdqb2luUm9vbScgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJvb207XG5cdH0pO1xufSk7XG5cbkFjY291bnRzLm9uTG9naW4oZnVuY3Rpb24oeyB1c2VyIH0pIHtcblx0aWYgKHVzZXIgJiYgdXNlci5zZXJ2aWNlcyAmJiB1c2VyLnNlcnZpY2VzLnRva2VucGFzcykge1xuXHRcdFJvY2tldENoYXQudXBkYXRlVXNlclRva2VucGFzc0JhbGFuY2VzKHVzZXIpO1xuXHR9XG59KTtcbiIsImxldCB1c2VyQWdlbnQgPSAnTWV0ZW9yJztcbmlmIChNZXRlb3IucmVsZWFzZSkgeyB1c2VyQWdlbnQgKz0gYC8keyBNZXRlb3IucmVsZWFzZSB9YDsgfVxuXG5Sb2NrZXRDaGF0LmdldFByb3RlY3RlZFRva2VucGFzc0JhbGFuY2VzID0gZnVuY3Rpb24oYWNjZXNzVG9rZW4pIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gSFRUUC5nZXQoXG5cdFx0XHRgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Ub2tlbnBhc3NfVVJMJykgfS9hcGkvdjEvdGNhL3Byb3RlY3RlZC9iYWxhbmNlc2AsIHtcblx0XHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHRcdEFjY2VwdDogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdCdVc2VyLUFnZW50JzogdXNlckFnZW50XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHBhcmFtczoge1xuXHRcdFx0XHRcdG9hdXRoX3Rva2VuOiBhY2Nlc3NUb2tlblxuXHRcdFx0XHR9XG5cdFx0XHR9KS5kYXRhO1xuXHR9IGNhdGNoIChlcnJvcikge1xuXHRcdHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGZldGNoIHByb3RlY3RlZCB0b2tlbnBhc3MgYmFsYW5jZXMgZnJvbSBUb2tlbnBhc3MuICR7IGVycm9yLm1lc3NhZ2UgfWApO1xuXHR9XG59O1xuIiwibGV0IHVzZXJBZ2VudCA9ICdNZXRlb3InO1xuaWYgKE1ldGVvci5yZWxlYXNlKSB7IHVzZXJBZ2VudCArPSBgLyR7IE1ldGVvci5yZWxlYXNlIH1gOyB9XG5cblJvY2tldENoYXQuZ2V0UHVibGljVG9rZW5wYXNzQmFsYW5jZXMgPSBmdW5jdGlvbihhY2Nlc3NUb2tlbikge1xuXHR0cnkge1xuXHRcdHJldHVybiBIVFRQLmdldChcblx0XHRcdGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1Rva2VucGFzc19VUkwnKSB9L2FwaS92MS90Y2EvcHVibGljL2JhbGFuY2VzYCwge1xuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0QWNjZXB0OiAnYXBwbGljYXRpb24vanNvbicsXG5cdFx0XHRcdFx0J1VzZXItQWdlbnQnOiB1c2VyQWdlbnRcblx0XHRcdFx0fSxcblx0XHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdFx0b2F1dGhfdG9rZW46IGFjY2Vzc1Rva2VuXG5cdFx0XHRcdH1cblx0XHRcdH0pLmRhdGE7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZmV0Y2ggcHVibGljIHRva2VucGFzcyBiYWxhbmNlcyBmcm9tIFRva2VucGFzcy4gJHsgZXJyb3IubWVzc2FnZSB9YCk7XG5cdH1cbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tVG9rZW5wYXNzID0gZnVuY3Rpb24ocmlkLCB0b2tlbnBhc3MpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVRva2Vucydcblx0XHR9KTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUb2tlbnBhc3NCeUlkKHJpZCwgdG9rZW5wYXNzKTtcbn07XG4iLCJpbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cblJvY2tldENoYXQuc2F2ZVJvb21Ub2tlbnNNaW5pbXVtQmFsYW5jZSA9IGZ1bmN0aW9uKHJpZCwgcm9vbVRva2Vuc01pbmltdW1CYWxhbmNlKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21Ub2tlbnNNaW5pbXVtQmFsYW5jZSdcblx0XHR9KTtcblx0fVxuXG5cdGNvbnN0IG1pbmltdW1Ub2tlbkJhbGFuY2UgPSBwYXJzZUZsb2F0KHMuZXNjYXBlSFRNTChyb29tVG9rZW5zTWluaW11bUJhbGFuY2UpKTtcblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TWluaW11bVRva2VuQmFsYW5jZUJ5SWQocmlkLCBtaW5pbXVtVG9rZW5CYWxhbmNlKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC51cGRhdGVVc2VyVG9rZW5wYXNzQmFsYW5jZXMgPSBmdW5jdGlvbih1c2VyKSB7XG5cdGlmICh1c2VyICYmIHVzZXIuc2VydmljZXMgJiYgdXNlci5zZXJ2aWNlcy50b2tlbnBhc3MpIHtcblx0XHRjb25zdCB0Y2FQdWJsaWNCYWxhbmNlcyA9IFJvY2tldENoYXQuZ2V0UHVibGljVG9rZW5wYXNzQmFsYW5jZXModXNlci5zZXJ2aWNlcy50b2tlbnBhc3MuYWNjZXNzVG9rZW4pO1xuXHRcdGNvbnN0IHRjYVByb3RlY3RlZEJhbGFuY2VzID0gUm9ja2V0Q2hhdC5nZXRQcm90ZWN0ZWRUb2tlbnBhc3NCYWxhbmNlcyh1c2VyLnNlcnZpY2VzLnRva2VucGFzcy5hY2Nlc3NUb2tlbik7XG5cblx0XHRjb25zdCBiYWxhbmNlcyA9IF8udW5pcShfLnVuaW9uKHRjYVB1YmxpY0JhbGFuY2VzLCB0Y2FQcm90ZWN0ZWRCYWxhbmNlcyksIGZhbHNlLCBpdGVtID0+IGl0ZW0uYXNzZXQpO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0VG9rZW5wYXNzVGNhQmFsYW5jZXModXNlci5faWQsIGJhbGFuY2VzKTtcblxuXHRcdHJldHVybiBiYWxhbmNlcztcblx0fVxufTtcbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy50cnlFbnN1cmVJbmRleCh7ICd0b2tlbnBhc3MudG9rZW5zLnRva2VuJzogMSB9KTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VG9rZW5wYXNzID0gZnVuY3Rpb24odG9rZW5zKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd0b2tlbnBhc3MudG9rZW5zLnRva2VuJzoge1xuXHRcdFx0JGluOiB0b2tlbnNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuX2RiLmZpbmQocXVlcnkpLmZldGNoKCk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUb2tlbnNCeUlkID0gZnVuY3Rpb24oX2lkLCB0b2tlbnMpIHtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCd0b2tlbnBhc3MudG9rZW5zLnRva2VuJzogdG9rZW5zXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7X2lkfSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFRva2VucGFzc0J5SWQgPSBmdW5jdGlvbihfaWQsIHRva2VucGFzcykge1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0dG9rZW5wYXNzXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEFsbFRva2VuQ2hhbm5lbHMgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0dG9rZW5wYXNzOiB7ICRleGlzdHM6IHRydWUgfVxuXHR9O1xuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGZpZWxkczoge1xuXHRcdFx0dG9rZW5wYXNzOiAxXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy5fZGIuZmluZChxdWVyeSwgb3B0aW9ucyk7XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kQnlSb29tSWRzID0gZnVuY3Rpb24ocm9vbUlkcykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyaWQ6IHtcblx0XHRcdCRpbjogcm9vbUlkc1xuXHRcdH1cblx0fTtcblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdCd1Ll9pZCc6IDEsXG5cdFx0XHRyaWQ6IDFcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuX2RiLmZpbmQocXVlcnksIG9wdGlvbnMpO1xufTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldFRva2VucGFzc1RjYUJhbGFuY2VzID0gZnVuY3Rpb24oX2lkLCB0Y2FCYWxhbmNlcykge1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0J3NlcnZpY2VzLnRva2VucGFzcy50Y2FCYWxhbmNlcyc6IHRjYUJhbGFuY2VzXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShfaWQsIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRUb2tlbkJhbGFuY2VzQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiB1c2VySWRcblx0fTtcblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGZpZWxkczoge1xuXHRcdFx0J3NlcnZpY2VzLnRva2VucGFzcy50Y2FCYWxhbmNlcyc6IDFcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRmaW5kVG9rZW5DaGFubmVscygpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKHVzZXIuc2VydmljZXMgJiYgdXNlci5zZXJ2aWNlcy50b2tlbnBhc3MgJiYgdXNlci5zZXJ2aWNlcy50b2tlbnBhc3MudGNhQmFsYW5jZXMpIHtcblx0XHRcdGNvbnN0IHRva2VucyA9IHt9O1xuXHRcdFx0dXNlci5zZXJ2aWNlcy50b2tlbnBhc3MudGNhQmFsYW5jZXMuZm9yRWFjaCh0b2tlbiA9PiB7XG5cdFx0XHRcdHRva2Vuc1t0b2tlbi5hc3NldF0gPSAxO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUb2tlbnBhc3MoT2JqZWN0LmtleXModG9rZW5zKSlcblx0XHRcdFx0LmZpbHRlcihyb29tID0+IFJvY2tldENoYXQuVG9rZW5wYXNzLnZhbGlkYXRlQWNjZXNzKHJvb20udG9rZW5wYXNzLCB1c2VyLnNlcnZpY2VzLnRva2VucGFzcy50Y2FCYWxhbmNlcykpO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGdldENoYW5uZWxUb2tlbnBhc3MocmlkKSB7XG5cdFx0Y2hlY2socmlkLCBTdHJpbmcpO1xuXG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2dldENoYW5uZWxUb2tlbnBhc3MnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBtZXRob2Q6ICdnZXRDaGFubmVsVG9rZW5wYXNzJyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcm9vbS50b2tlbnBhc3M7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBTeW5jZWRDcm9uICovXG5mdW5jdGlvbiByZW1vdmVVc2Vyc0Zyb21Ub2tlbkNoYW5uZWxzKCkge1xuXHRjb25zdCByb29tcyA9IHt9O1xuXG5cdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRBbGxUb2tlbkNoYW5uZWxzKCkuZm9yRWFjaChyb29tID0+IHtcblx0XHRyb29tc1tyb29tLl9pZF0gPSByb29tLnRva2VucGFzcztcblx0fSk7XG5cblx0Y29uc3QgdXNlcnMgPSB7fTtcblxuXHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRCeVJvb21JZHMoT2JqZWN0LmtleXMocm9vbXMpKS5mb3JFYWNoKHN1YiA9PiB7XG5cdFx0aWYgKCF1c2Vyc1tzdWIudS5faWRdKSB7XG5cdFx0XHR1c2Vyc1tzdWIudS5faWRdID0gW107XG5cdFx0fVxuXHRcdHVzZXJzW3N1Yi51Ll9pZF0ucHVzaChzdWIucmlkKTtcblx0fSk7XG5cblx0T2JqZWN0LmtleXModXNlcnMpLmZvckVhY2godXNlciA9PiB7XG5cdFx0Y29uc3QgdXNlckluZm8gPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VyKTtcblxuXHRcdGlmICh1c2VySW5mbyAmJiB1c2VySW5mby5zZXJ2aWNlcyAmJiB1c2VySW5mby5zZXJ2aWNlcy50b2tlbnBhc3MpIHtcblx0XHRcdGNvbnN0IGJhbGFuY2VzID0gUm9ja2V0Q2hhdC51cGRhdGVVc2VyVG9rZW5wYXNzQmFsYW5jZXModXNlckluZm8pO1xuXG5cdFx0XHR1c2Vyc1t1c2VyXS5mb3JFYWNoKHJvb21JZCA9PiB7XG5cdFx0XHRcdGNvbnN0IHZhbGlkID0gUm9ja2V0Q2hhdC5Ub2tlbnBhc3MudmFsaWRhdGVBY2Nlc3Mocm9vbXNbcm9vbUlkXSwgYmFsYW5jZXMpO1xuXG5cdFx0XHRcdGlmICghdmFsaWQpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnJlbW92ZVVzZXJGcm9tUm9vbShyb29tSWQsIHVzZXJJbmZvKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcbn1cblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdE1ldGVvci5kZWZlcihmdW5jdGlvbigpIHtcblx0XHRyZW1vdmVVc2Vyc0Zyb21Ub2tlbkNoYW5uZWxzKCk7XG5cblx0XHRTeW5jZWRDcm9uLmFkZCh7XG5cdFx0XHRuYW1lOiAnUmVtb3ZlIHVzZXJzIGZyb20gVG9rZW4gQ2hhbm5lbHMnLFxuXHRcdFx0c2NoZWR1bGU6IChwYXJzZXIpID0+IHBhcnNlci5jcm9uKCcwICogKiAqIConKSxcblx0XHRcdGpvYjogcmVtb3ZlVXNlcnNGcm9tVG9rZW5DaGFubmVsc1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5Ub2tlbnBhc3MgPSB7XG5cdHZhbGlkYXRlQWNjZXNzKHRva2VucGFzcywgYmFsYW5jZXMpIHtcblx0XHRjb25zdCBjb21wRnVuYyA9IHRva2VucGFzcy5yZXF1aXJlID09PSAnYW55JyA/ICdzb21lJyA6ICdldmVyeSc7XG5cdFx0cmV0dXJuIHRva2VucGFzcy50b2tlbnNbY29tcEZ1bmNdKChjb25maWcpID0+IHtcblx0XHRcdHJldHVybiBiYWxhbmNlcy5zb21lKHVzZXJUb2tlbiA9PiB7XG5cdFx0XHRcdHJldHVybiBjb25maWcudG9rZW4gPT09IHVzZXJUb2tlbi5hc3NldCAmJiBwYXJzZUZsb2F0KGNvbmZpZy5iYWxhbmNlKSA8PSBwYXJzZUZsb2F0KHVzZXJUb2tlbi5iYWxhbmNlKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG59O1xuIl19
