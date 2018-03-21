(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var SHA256 = Package.sha.SHA256;
var Random = Package.random.Random;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:2fa":{"server":{"lib":{"totp.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/lib/totp.js                                                            //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
let speakeasy;
module.watch(require("speakeasy"), {
  default(v) {
    speakeasy = v;
  }

}, 0);
RocketChat.TOTP = {
  generateSecret() {
    return speakeasy.generateSecret();
  },

  generateOtpauthURL(secret, username) {
    return speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `Rocket.Chat:${username}`
    });
  },

  verify({
    secret,
    token,
    backupTokens,
    userId
  }) {
    let verified; // validates a backup code

    if (token.length === 8 && backupTokens) {
      const hashedCode = SHA256(token);
      const usedCode = backupTokens.indexOf(hashedCode);

      if (usedCode !== -1) {
        verified = true;
        backupTokens.splice(usedCode, 1); // mark the code as used (remove it from the list)

        RocketChat.models.Users.update2FABackupCodesByUserId(userId, backupTokens);
      }
    } else {
      verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });
    }

    return verified;
  },

  generateCodes() {
    // generate 12 backup codes
    const codes = [];
    const hashedCodes = [];

    for (let i = 0; i < 12; i++) {
      const code = Random.id(8);
      codes.push(code);
      hashedCodes.push(SHA256(code));
    }

    return {
      codes,
      hashedCodes
    };
  }

};
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"checkCodesRemaining.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/checkCodesRemaining.js                                         //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:checkCodesRemaining'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.enabled) {
      throw new Meteor.Error('invalid-totp');
    }

    return {
      remaining: user.services.totp.hashedBackup.length
    };
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"disable.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/disable.js                                                     //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:disable'(code) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();
    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.secret,
      token: code,
      userId: Meteor.userId(),
      backupTokens: user.services.totp.hashedBackup
    });

    if (!verified) {
      return false;
    }

    return RocketChat.models.Users.disable2FAByUserId(Meteor.userId());
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"enable.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/enable.js                                                      //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:enable'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();
    const secret = RocketChat.TOTP.generateSecret();
    RocketChat.models.Users.disable2FAAndSetTempSecretByUserId(Meteor.userId(), secret.base32);
    return {
      secret: secret.base32,
      url: RocketChat.TOTP.generateOtpauthURL(secret, user.username)
    };
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"regenerateCodes.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/regenerateCodes.js                                             //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:regenerateCodes'(userToken) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.enabled) {
      throw new Meteor.Error('invalid-totp');
    }

    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.secret,
      token: userToken,
      userId: Meteor.userId(),
      backupTokens: user.services.totp.hashedBackup
    });

    if (verified) {
      const {
        codes,
        hashedCodes
      } = RocketChat.TOTP.generateCodes();
      RocketChat.models.Users.update2FABackupCodesByUserId(Meteor.userId(), hashedCodes);
      return {
        codes
      };
    }
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateTempToken.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/methods/validateTempToken.js                                           //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Meteor.methods({
  '2fa:validateTempToken'(userToken) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    const user = Meteor.user();

    if (!user.services || !user.services.totp || !user.services.totp.tempSecret) {
      throw new Meteor.Error('invalid-totp');
    }

    const verified = RocketChat.TOTP.verify({
      secret: user.services.totp.tempSecret,
      token: userToken
    });

    if (verified) {
      const {
        codes,
        hashedCodes
      } = RocketChat.TOTP.generateCodes();
      RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId(Meteor.userId(), user.services.totp.tempSecret, hashedCodes);
      return {
        codes
      };
    }
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"users.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/models/users.js                                                        //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
RocketChat.models.Users.disable2FAAndSetTempSecretByUserId = function (userId, tempToken) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp': {
        enabled: false,
        tempSecret: tempToken
      }
    }
  });
};

RocketChat.models.Users.enable2FAAndSetSecretAndCodesByUserId = function (userId, secret, backupCodes) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp.enabled': true,
      'services.totp.secret': secret,
      'services.totp.hashedBackup': backupCodes
    },
    $unset: {
      'services.totp.tempSecret': 1
    }
  });
};

RocketChat.models.Users.disable2FAByUserId = function (userId) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp': {
        enabled: false
      }
    }
  });
};

RocketChat.models.Users.update2FABackupCodesByUserId = function (userId, backupCodes) {
  return this.update({
    _id: userId
  }, {
    $set: {
      'services.totp.hashedBackup': backupCodes
    }
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"loginHandler.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/rocketchat_2fa/server/loginHandler.js                                                        //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
Accounts.registerLoginHandler('totp', function (options) {
  if (!options.totp || !options.totp.code) {
    return;
  }

  return Accounts._runLoginHandlers(this, options.totp.login);
});
RocketChat.callbacks.add('onValidateLogin', login => {
  if (login.type === 'password' && login.user.services && login.user.services.totp && login.user.services.totp.enabled === true) {
    const {
      totp
    } = login.methodArguments[0];

    if (!totp || !totp.code) {
      throw new Meteor.Error('totp-required', 'TOTP Required');
    }

    const verified = RocketChat.TOTP.verify({
      secret: login.user.services.totp.secret,
      token: totp.code,
      userId: login.user._id,
      backupTokens: login.user.services.totp.hashedBackup
    });

    if (verified !== true) {
      throw new Meteor.Error('totp-invalid', 'TOTP Invalid');
    }
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:2fa/server/lib/totp.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/checkCodesRemaining.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/disable.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/enable.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/regenerateCodes.js");
require("/node_modules/meteor/rocketchat:2fa/server/methods/validateTempToken.js");
require("/node_modules/meteor/rocketchat:2fa/server/models/users.js");
require("/node_modules/meteor/rocketchat:2fa/server/loginHandler.js");

/* Exports */
Package._define("rocketchat:2fa");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_2fa.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDoyZmEvc2VydmVyL2xpYi90b3RwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9jaGVja0NvZGVzUmVtYWluaW5nLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9kaXNhYmxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OjJmYS9zZXJ2ZXIvbWV0aG9kcy9lbmFibGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9tZXRob2RzL3JlZ2VuZXJhdGVDb2Rlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDoyZmEvc2VydmVyL21ldGhvZHMvdmFsaWRhdGVUZW1wVG9rZW4uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9tb2RlbHMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6MmZhL3NlcnZlci9sb2dpbkhhbmRsZXIuanMiXSwibmFtZXMiOlsic3BlYWtlYXN5IiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJSb2NrZXRDaGF0IiwiVE9UUCIsImdlbmVyYXRlU2VjcmV0IiwiZ2VuZXJhdGVPdHBhdXRoVVJMIiwic2VjcmV0IiwidXNlcm5hbWUiLCJvdHBhdXRoVVJMIiwiYXNjaWkiLCJsYWJlbCIsInZlcmlmeSIsInRva2VuIiwiYmFja3VwVG9rZW5zIiwidXNlcklkIiwidmVyaWZpZWQiLCJsZW5ndGgiLCJoYXNoZWRDb2RlIiwiU0hBMjU2IiwidXNlZENvZGUiLCJpbmRleE9mIiwic3BsaWNlIiwibW9kZWxzIiwiVXNlcnMiLCJ1cGRhdGUyRkFCYWNrdXBDb2Rlc0J5VXNlcklkIiwidG90cCIsImVuY29kaW5nIiwiZ2VuZXJhdGVDb2RlcyIsImNvZGVzIiwiaGFzaGVkQ29kZXMiLCJpIiwiY29kZSIsIlJhbmRvbSIsImlkIiwicHVzaCIsIk1ldGVvciIsIm1ldGhvZHMiLCJFcnJvciIsInVzZXIiLCJzZXJ2aWNlcyIsImVuYWJsZWQiLCJyZW1haW5pbmciLCJoYXNoZWRCYWNrdXAiLCJkaXNhYmxlMkZBQnlVc2VySWQiLCJkaXNhYmxlMkZBQW5kU2V0VGVtcFNlY3JldEJ5VXNlcklkIiwiYmFzZTMyIiwidXJsIiwidXNlclRva2VuIiwidGVtcFNlY3JldCIsImVuYWJsZTJGQUFuZFNldFNlY3JldEFuZENvZGVzQnlVc2VySWQiLCJ0ZW1wVG9rZW4iLCJ1cGRhdGUiLCJfaWQiLCIkc2V0IiwiYmFja3VwQ29kZXMiLCIkdW5zZXQiLCJBY2NvdW50cyIsInJlZ2lzdGVyTG9naW5IYW5kbGVyIiwib3B0aW9ucyIsIl9ydW5Mb2dpbkhhbmRsZXJzIiwibG9naW4iLCJjYWxsYmFja3MiLCJhZGQiLCJ0eXBlIiwibWV0aG9kQXJndW1lbnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsU0FBSjtBQUFjQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsV0FBUixDQUFiLEVBQWtDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxnQkFBVUssQ0FBVjtBQUFZOztBQUF4QixDQUFsQyxFQUE0RCxDQUE1RDtBQUVkQyxXQUFXQyxJQUFYLEdBQWtCO0FBQ2pCQyxtQkFBaUI7QUFDaEIsV0FBT1IsVUFBVVEsY0FBVixFQUFQO0FBQ0EsR0FIZ0I7O0FBS2pCQyxxQkFBbUJDLE1BQW5CLEVBQTJCQyxRQUEzQixFQUFxQztBQUNwQyxXQUFPWCxVQUFVWSxVQUFWLENBQXFCO0FBQzNCRixjQUFRQSxPQUFPRyxLQURZO0FBRTNCQyxhQUFRLGVBQWVILFFBQVU7QUFGTixLQUFyQixDQUFQO0FBSUEsR0FWZ0I7O0FBWWpCSSxTQUFPO0FBQUVMLFVBQUY7QUFBVU0sU0FBVjtBQUFpQkMsZ0JBQWpCO0FBQStCQztBQUEvQixHQUFQLEVBQWdEO0FBQy9DLFFBQUlDLFFBQUosQ0FEK0MsQ0FHL0M7O0FBQ0EsUUFBSUgsTUFBTUksTUFBTixLQUFpQixDQUFqQixJQUFzQkgsWUFBMUIsRUFBd0M7QUFDdkMsWUFBTUksYUFBYUMsT0FBT04sS0FBUCxDQUFuQjtBQUNBLFlBQU1PLFdBQVdOLGFBQWFPLE9BQWIsQ0FBcUJILFVBQXJCLENBQWpCOztBQUVBLFVBQUlFLGFBQWEsQ0FBQyxDQUFsQixFQUFxQjtBQUNwQkosbUJBQVcsSUFBWDtBQUVBRixxQkFBYVEsTUFBYixDQUFvQkYsUUFBcEIsRUFBOEIsQ0FBOUIsRUFIb0IsQ0FLcEI7O0FBQ0FqQixtQkFBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyw0QkFBeEIsQ0FBcURWLE1BQXJELEVBQTZERCxZQUE3RDtBQUNBO0FBQ0QsS0FaRCxNQVlPO0FBQ05FLGlCQUFXbkIsVUFBVTZCLElBQVYsQ0FBZWQsTUFBZixDQUFzQjtBQUNoQ0wsY0FEZ0M7QUFFaENvQixrQkFBVSxRQUZzQjtBQUdoQ2Q7QUFIZ0MsT0FBdEIsQ0FBWDtBQUtBOztBQUVELFdBQU9HLFFBQVA7QUFDQSxHQXJDZ0I7O0FBdUNqQlksa0JBQWdCO0FBQ2Y7QUFDQSxVQUFNQyxRQUFRLEVBQWQ7QUFDQSxVQUFNQyxjQUFjLEVBQXBCOztBQUNBLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEVBQXBCLEVBQXdCQSxHQUF4QixFQUE2QjtBQUM1QixZQUFNQyxPQUFPQyxPQUFPQyxFQUFQLENBQVUsQ0FBVixDQUFiO0FBQ0FMLFlBQU1NLElBQU4sQ0FBV0gsSUFBWDtBQUNBRixrQkFBWUssSUFBWixDQUFpQmhCLE9BQU9hLElBQVAsQ0FBakI7QUFDQTs7QUFFRCxXQUFPO0FBQUVILFdBQUY7QUFBU0M7QUFBVCxLQUFQO0FBQ0E7O0FBbERnQixDQUFsQixDOzs7Ozs7Ozs7OztBQ0ZBTSxPQUFPQyxPQUFQLENBQWU7QUFDZCw4QkFBNEI7QUFDM0IsUUFBSSxDQUFDRCxPQUFPckIsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSXFCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7O0FBRUEsUUFBSSxDQUFDQSxLQUFLQyxRQUFOLElBQWtCLENBQUNELEtBQUtDLFFBQUwsQ0FBY2QsSUFBakMsSUFBeUMsQ0FBQ2EsS0FBS0MsUUFBTCxDQUFjZCxJQUFkLENBQW1CZSxPQUFqRSxFQUEwRTtBQUN6RSxZQUFNLElBQUlMLE9BQU9FLEtBQVgsQ0FBaUIsY0FBakIsQ0FBTjtBQUNBOztBQUVELFdBQU87QUFDTkksaUJBQVdILEtBQUtDLFFBQUwsQ0FBY2QsSUFBZCxDQUFtQmlCLFlBQW5CLENBQWdDMUI7QUFEckMsS0FBUDtBQUdBOztBQWZhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQW1CLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLGdCQUFjTCxJQUFkLEVBQW9CO0FBQ25CLFFBQUksQ0FBQ0ksT0FBT3JCLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlxQixPQUFPRSxLQUFYLENBQWlCLGdCQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsT0FBT0gsT0FBT0csSUFBUCxFQUFiO0FBRUEsVUFBTXZCLFdBQVdiLFdBQVdDLElBQVgsQ0FBZ0JRLE1BQWhCLENBQXVCO0FBQ3ZDTCxjQUFRZ0MsS0FBS0MsUUFBTCxDQUFjZCxJQUFkLENBQW1CbkIsTUFEWTtBQUV2Q00sYUFBT21CLElBRmdDO0FBR3ZDakIsY0FBUXFCLE9BQU9yQixNQUFQLEVBSCtCO0FBSXZDRCxvQkFBY3lCLEtBQUtDLFFBQUwsQ0FBY2QsSUFBZCxDQUFtQmlCO0FBSk0sS0FBdkIsQ0FBakI7O0FBT0EsUUFBSSxDQUFDM0IsUUFBTCxFQUFlO0FBQ2QsYUFBTyxLQUFQO0FBQ0E7O0FBRUQsV0FBT2IsV0FBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCb0Isa0JBQXhCLENBQTJDUixPQUFPckIsTUFBUCxFQUEzQyxDQUFQO0FBQ0E7O0FBcEJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQXFCLE9BQU9DLE9BQVAsQ0FBZTtBQUNkLGlCQUFlO0FBQ2QsUUFBSSxDQUFDRCxPQUFPckIsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSXFCLE9BQU9FLEtBQVgsQ0FBaUIsZ0JBQWpCLENBQU47QUFDQTs7QUFFRCxVQUFNQyxPQUFPSCxPQUFPRyxJQUFQLEVBQWI7QUFFQSxVQUFNaEMsU0FBU0osV0FBV0MsSUFBWCxDQUFnQkMsY0FBaEIsRUFBZjtBQUVBRixlQUFXb0IsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JxQixrQ0FBeEIsQ0FBMkRULE9BQU9yQixNQUFQLEVBQTNELEVBQTRFUixPQUFPdUMsTUFBbkY7QUFFQSxXQUFPO0FBQ052QyxjQUFRQSxPQUFPdUMsTUFEVDtBQUVOQyxXQUFLNUMsV0FBV0MsSUFBWCxDQUFnQkUsa0JBQWhCLENBQW1DQyxNQUFuQyxFQUEyQ2dDLEtBQUsvQixRQUFoRDtBQUZDLEtBQVA7QUFJQTs7QUFoQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBNEIsT0FBT0MsT0FBUCxDQUFlO0FBQ2Qsd0JBQXNCVyxTQUF0QixFQUFpQztBQUNoQyxRQUFJLENBQUNaLE9BQU9yQixNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJcUIsT0FBT0UsS0FBWCxDQUFpQixnQkFBakIsQ0FBTjtBQUNBOztBQUVELFVBQU1DLE9BQU9ILE9BQU9HLElBQVAsRUFBYjs7QUFFQSxRQUFJLENBQUNBLEtBQUtDLFFBQU4sSUFBa0IsQ0FBQ0QsS0FBS0MsUUFBTCxDQUFjZCxJQUFqQyxJQUF5QyxDQUFDYSxLQUFLQyxRQUFMLENBQWNkLElBQWQsQ0FBbUJlLE9BQWpFLEVBQTBFO0FBQ3pFLFlBQU0sSUFBSUwsT0FBT0UsS0FBWCxDQUFpQixjQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTXRCLFdBQVdiLFdBQVdDLElBQVgsQ0FBZ0JRLE1BQWhCLENBQXVCO0FBQ3ZDTCxjQUFRZ0MsS0FBS0MsUUFBTCxDQUFjZCxJQUFkLENBQW1CbkIsTUFEWTtBQUV2Q00sYUFBT21DLFNBRmdDO0FBR3ZDakMsY0FBUXFCLE9BQU9yQixNQUFQLEVBSCtCO0FBSXZDRCxvQkFBY3lCLEtBQUtDLFFBQUwsQ0FBY2QsSUFBZCxDQUFtQmlCO0FBSk0sS0FBdkIsQ0FBakI7O0FBT0EsUUFBSTNCLFFBQUosRUFBYztBQUNiLFlBQU07QUFBRWEsYUFBRjtBQUFTQztBQUFULFVBQXlCM0IsV0FBV0MsSUFBWCxDQUFnQndCLGFBQWhCLEVBQS9CO0FBRUF6QixpQkFBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyw0QkFBeEIsQ0FBcURXLE9BQU9yQixNQUFQLEVBQXJELEVBQXNFZSxXQUF0RTtBQUNBLGFBQU87QUFBRUQ7QUFBRixPQUFQO0FBQ0E7QUFDRDs7QUF6QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBTyxPQUFPQyxPQUFQLENBQWU7QUFDZCwwQkFBd0JXLFNBQXhCLEVBQW1DO0FBQ2xDLFFBQUksQ0FBQ1osT0FBT3JCLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlxQixPQUFPRSxLQUFYLENBQWlCLGdCQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsT0FBT0gsT0FBT0csSUFBUCxFQUFiOztBQUVBLFFBQUksQ0FBQ0EsS0FBS0MsUUFBTixJQUFrQixDQUFDRCxLQUFLQyxRQUFMLENBQWNkLElBQWpDLElBQXlDLENBQUNhLEtBQUtDLFFBQUwsQ0FBY2QsSUFBZCxDQUFtQnVCLFVBQWpFLEVBQTZFO0FBQzVFLFlBQU0sSUFBSWIsT0FBT0UsS0FBWCxDQUFpQixjQUFqQixDQUFOO0FBQ0E7O0FBRUQsVUFBTXRCLFdBQVdiLFdBQVdDLElBQVgsQ0FBZ0JRLE1BQWhCLENBQXVCO0FBQ3ZDTCxjQUFRZ0MsS0FBS0MsUUFBTCxDQUFjZCxJQUFkLENBQW1CdUIsVUFEWTtBQUV2Q3BDLGFBQU9tQztBQUZnQyxLQUF2QixDQUFqQjs7QUFLQSxRQUFJaEMsUUFBSixFQUFjO0FBQ2IsWUFBTTtBQUFFYSxhQUFGO0FBQVNDO0FBQVQsVUFBeUIzQixXQUFXQyxJQUFYLENBQWdCd0IsYUFBaEIsRUFBL0I7QUFFQXpCLGlCQUFXb0IsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0IwQixxQ0FBeEIsQ0FBOERkLE9BQU9yQixNQUFQLEVBQTlELEVBQStFd0IsS0FBS0MsUUFBTCxDQUFjZCxJQUFkLENBQW1CdUIsVUFBbEcsRUFBOEduQixXQUE5RztBQUNBLGFBQU87QUFBRUQ7QUFBRixPQUFQO0FBQ0E7QUFDRDs7QUF2QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBMUIsV0FBV29CLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcUIsa0NBQXhCLEdBQTZELFVBQVM5QixNQUFULEVBQWlCb0MsU0FBakIsRUFBNEI7QUFDeEYsU0FBTyxLQUFLQyxNQUFMLENBQVk7QUFDbEJDLFNBQUt0QztBQURhLEdBQVosRUFFSjtBQUNGdUMsVUFBTTtBQUNMLHVCQUFpQjtBQUNoQmIsaUJBQVMsS0FETztBQUVoQlEsb0JBQVlFO0FBRkk7QUFEWjtBQURKLEdBRkksQ0FBUDtBQVVBLENBWEQ7O0FBYUFoRCxXQUFXb0IsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0IwQixxQ0FBeEIsR0FBZ0UsVUFBU25DLE1BQVQsRUFBaUJSLE1BQWpCLEVBQXlCZ0QsV0FBekIsRUFBc0M7QUFDckcsU0FBTyxLQUFLSCxNQUFMLENBQVk7QUFDbEJDLFNBQUt0QztBQURhLEdBQVosRUFFSjtBQUNGdUMsVUFBTTtBQUNMLCtCQUF5QixJQURwQjtBQUVMLDhCQUF3Qi9DLE1BRm5CO0FBR0wsb0NBQThCZ0Q7QUFIekIsS0FESjtBQU1GQyxZQUFRO0FBQ1Asa0NBQTRCO0FBRHJCO0FBTk4sR0FGSSxDQUFQO0FBWUEsQ0FiRDs7QUFlQXJELFdBQVdvQixNQUFYLENBQWtCQyxLQUFsQixDQUF3Qm9CLGtCQUF4QixHQUE2QyxVQUFTN0IsTUFBVCxFQUFpQjtBQUM3RCxTQUFPLEtBQUtxQyxNQUFMLENBQVk7QUFDbEJDLFNBQUt0QztBQURhLEdBQVosRUFFSjtBQUNGdUMsVUFBTTtBQUNMLHVCQUFpQjtBQUNoQmIsaUJBQVM7QUFETztBQURaO0FBREosR0FGSSxDQUFQO0FBU0EsQ0FWRDs7QUFZQXRDLFdBQVdvQixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsNEJBQXhCLEdBQXVELFVBQVNWLE1BQVQsRUFBaUJ3QyxXQUFqQixFQUE4QjtBQUNwRixTQUFPLEtBQUtILE1BQUwsQ0FBWTtBQUNsQkMsU0FBS3RDO0FBRGEsR0FBWixFQUVKO0FBQ0Z1QyxVQUFNO0FBQ0wsb0NBQThCQztBQUR6QjtBQURKLEdBRkksQ0FBUDtBQU9BLENBUkQsQzs7Ozs7Ozs7Ozs7QUN4Q0FFLFNBQVNDLG9CQUFULENBQThCLE1BQTlCLEVBQXNDLFVBQVNDLE9BQVQsRUFBa0I7QUFDdkQsTUFBSSxDQUFDQSxRQUFRakMsSUFBVCxJQUFpQixDQUFDaUMsUUFBUWpDLElBQVIsQ0FBYU0sSUFBbkMsRUFBeUM7QUFDeEM7QUFDQTs7QUFFRCxTQUFPeUIsU0FBU0csaUJBQVQsQ0FBMkIsSUFBM0IsRUFBaUNELFFBQVFqQyxJQUFSLENBQWFtQyxLQUE5QyxDQUFQO0FBQ0EsQ0FORDtBQVFBMUQsV0FBVzJELFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGlCQUF6QixFQUE2Q0YsS0FBRCxJQUFXO0FBQ3RELE1BQUlBLE1BQU1HLElBQU4sS0FBZSxVQUFmLElBQTZCSCxNQUFNdEIsSUFBTixDQUFXQyxRQUF4QyxJQUFvRHFCLE1BQU10QixJQUFOLENBQVdDLFFBQVgsQ0FBb0JkLElBQXhFLElBQWdGbUMsTUFBTXRCLElBQU4sQ0FBV0MsUUFBWCxDQUFvQmQsSUFBcEIsQ0FBeUJlLE9BQXpCLEtBQXFDLElBQXpILEVBQStIO0FBQzlILFVBQU07QUFBRWY7QUFBRixRQUFXbUMsTUFBTUksZUFBTixDQUFzQixDQUF0QixDQUFqQjs7QUFFQSxRQUFJLENBQUN2QyxJQUFELElBQVMsQ0FBQ0EsS0FBS00sSUFBbkIsRUFBeUI7QUFDeEIsWUFBTSxJQUFJSSxPQUFPRSxLQUFYLENBQWlCLGVBQWpCLEVBQWtDLGVBQWxDLENBQU47QUFDQTs7QUFFRCxVQUFNdEIsV0FBV2IsV0FBV0MsSUFBWCxDQUFnQlEsTUFBaEIsQ0FBdUI7QUFDdkNMLGNBQVFzRCxNQUFNdEIsSUFBTixDQUFXQyxRQUFYLENBQW9CZCxJQUFwQixDQUF5Qm5CLE1BRE07QUFFdkNNLGFBQU9hLEtBQUtNLElBRjJCO0FBR3ZDakIsY0FBUThDLE1BQU10QixJQUFOLENBQVdjLEdBSG9CO0FBSXZDdkMsb0JBQWMrQyxNQUFNdEIsSUFBTixDQUFXQyxRQUFYLENBQW9CZCxJQUFwQixDQUF5QmlCO0FBSkEsS0FBdkIsQ0FBakI7O0FBT0EsUUFBSTNCLGFBQWEsSUFBakIsRUFBdUI7QUFDdEIsWUFBTSxJQUFJb0IsT0FBT0UsS0FBWCxDQUFpQixjQUFqQixFQUFpQyxjQUFqQyxDQUFOO0FBQ0E7QUFDRDtBQUNELENBbkJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfMmZhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNwZWFrZWFzeSBmcm9tICdzcGVha2Vhc3knO1xuXG5Sb2NrZXRDaGF0LlRPVFAgPSB7XG5cdGdlbmVyYXRlU2VjcmV0KCkge1xuXHRcdHJldHVybiBzcGVha2Vhc3kuZ2VuZXJhdGVTZWNyZXQoKTtcblx0fSxcblxuXHRnZW5lcmF0ZU90cGF1dGhVUkwoc2VjcmV0LCB1c2VybmFtZSkge1xuXHRcdHJldHVybiBzcGVha2Vhc3kub3RwYXV0aFVSTCh7XG5cdFx0XHRzZWNyZXQ6IHNlY3JldC5hc2NpaSxcblx0XHRcdGxhYmVsOiBgUm9ja2V0LkNoYXQ6JHsgdXNlcm5hbWUgfWBcblx0XHR9KTtcblx0fSxcblxuXHR2ZXJpZnkoeyBzZWNyZXQsIHRva2VuLCBiYWNrdXBUb2tlbnMsIHVzZXJJZCB9KSB7XG5cdFx0bGV0IHZlcmlmaWVkO1xuXG5cdFx0Ly8gdmFsaWRhdGVzIGEgYmFja3VwIGNvZGVcblx0XHRpZiAodG9rZW4ubGVuZ3RoID09PSA4ICYmIGJhY2t1cFRva2Vucykge1xuXHRcdFx0Y29uc3QgaGFzaGVkQ29kZSA9IFNIQTI1Nih0b2tlbik7XG5cdFx0XHRjb25zdCB1c2VkQ29kZSA9IGJhY2t1cFRva2Vucy5pbmRleE9mKGhhc2hlZENvZGUpO1xuXG5cdFx0XHRpZiAodXNlZENvZGUgIT09IC0xKSB7XG5cdFx0XHRcdHZlcmlmaWVkID0gdHJ1ZTtcblxuXHRcdFx0XHRiYWNrdXBUb2tlbnMuc3BsaWNlKHVzZWRDb2RlLCAxKTtcblxuXHRcdFx0XHQvLyBtYXJrIHRoZSBjb2RlIGFzIHVzZWQgKHJlbW92ZSBpdCBmcm9tIHRoZSBsaXN0KVxuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUyRkFCYWNrdXBDb2Rlc0J5VXNlcklkKHVzZXJJZCwgYmFja3VwVG9rZW5zKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmVyaWZpZWQgPSBzcGVha2Vhc3kudG90cC52ZXJpZnkoe1xuXHRcdFx0XHRzZWNyZXQsXG5cdFx0XHRcdGVuY29kaW5nOiAnYmFzZTMyJyxcblx0XHRcdFx0dG9rZW5cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB2ZXJpZmllZDtcblx0fSxcblxuXHRnZW5lcmF0ZUNvZGVzKCkge1xuXHRcdC8vIGdlbmVyYXRlIDEyIGJhY2t1cCBjb2Rlc1xuXHRcdGNvbnN0IGNvZGVzID0gW107XG5cdFx0Y29uc3QgaGFzaGVkQ29kZXMgPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDEyOyBpKyspIHtcblx0XHRcdGNvbnN0IGNvZGUgPSBSYW5kb20uaWQoOCk7XG5cdFx0XHRjb2Rlcy5wdXNoKGNvZGUpO1xuXHRcdFx0aGFzaGVkQ29kZXMucHVzaChTSEEyNTYoY29kZSkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7IGNvZGVzLCBoYXNoZWRDb2RlcyB9O1xuXHR9XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnMmZhOmNoZWNrQ29kZXNSZW1haW5pbmcnKCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzLnRvdHAgfHwgIXVzZXIuc2VydmljZXMudG90cC5lbmFibGVkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRvdHAnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVtYWluaW5nOiB1c2VyLnNlcnZpY2VzLnRvdHAuaGFzaGVkQmFja3VwLmxlbmd0aFxuXHRcdH07XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnMmZhOmRpc2FibGUnKGNvZGUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90LWF1dGhvcml6ZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGNvbnN0IHZlcmlmaWVkID0gUm9ja2V0Q2hhdC5UT1RQLnZlcmlmeSh7XG5cdFx0XHRzZWNyZXQ6IHVzZXIuc2VydmljZXMudG90cC5zZWNyZXQsXG5cdFx0XHR0b2tlbjogY29kZSxcblx0XHRcdHVzZXJJZDogTWV0ZW9yLnVzZXJJZCgpLFxuXHRcdFx0YmFja3VwVG9rZW5zOiB1c2VyLnNlcnZpY2VzLnRvdHAuaGFzaGVkQmFja3VwXG5cdFx0fSk7XG5cblx0XHRpZiAoIXZlcmlmaWVkKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmRpc2FibGUyRkFCeVVzZXJJZChNZXRlb3IudXNlcklkKCkpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0JzJmYTplbmFibGUnKCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3Qgc2VjcmV0ID0gUm9ja2V0Q2hhdC5UT1RQLmdlbmVyYXRlU2VjcmV0KCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5kaXNhYmxlMkZBQW5kU2V0VGVtcFNlY3JldEJ5VXNlcklkKE1ldGVvci51c2VySWQoKSwgc2VjcmV0LmJhc2UzMik7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VjcmV0OiBzZWNyZXQuYmFzZTMyLFxuXHRcdFx0dXJsOiBSb2NrZXRDaGF0LlRPVFAuZ2VuZXJhdGVPdHBhdXRoVVJMKHNlY3JldCwgdXNlci51c2VybmFtZSlcblx0XHR9O1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0JzJmYTpyZWdlbmVyYXRlQ29kZXMnKHVzZXJUb2tlbikge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3QtYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKCF1c2VyLnNlcnZpY2VzIHx8ICF1c2VyLnNlcnZpY2VzLnRvdHAgfHwgIXVzZXIuc2VydmljZXMudG90cC5lbmFibGVkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRvdHAnKTtcblx0XHR9XG5cblx0XHRjb25zdCB2ZXJpZmllZCA9IFJvY2tldENoYXQuVE9UUC52ZXJpZnkoe1xuXHRcdFx0c2VjcmV0OiB1c2VyLnNlcnZpY2VzLnRvdHAuc2VjcmV0LFxuXHRcdFx0dG9rZW46IHVzZXJUb2tlbixcblx0XHRcdHVzZXJJZDogTWV0ZW9yLnVzZXJJZCgpLFxuXHRcdFx0YmFja3VwVG9rZW5zOiB1c2VyLnNlcnZpY2VzLnRvdHAuaGFzaGVkQmFja3VwXG5cdFx0fSk7XG5cblx0XHRpZiAodmVyaWZpZWQpIHtcblx0XHRcdGNvbnN0IHsgY29kZXMsIGhhc2hlZENvZGVzIH0gPSBSb2NrZXRDaGF0LlRPVFAuZ2VuZXJhdGVDb2RlcygpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUyRkFCYWNrdXBDb2Rlc0J5VXNlcklkKE1ldGVvci51c2VySWQoKSwgaGFzaGVkQ29kZXMpO1xuXHRcdFx0cmV0dXJuIHsgY29kZXMgfTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnMmZhOnZhbGlkYXRlVGVtcFRva2VuJyh1c2VyVG9rZW4pIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90LWF1dGhvcml6ZWQnKTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmICghdXNlci5zZXJ2aWNlcyB8fCAhdXNlci5zZXJ2aWNlcy50b3RwIHx8ICF1c2VyLnNlcnZpY2VzLnRvdHAudGVtcFNlY3JldCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC10b3RwJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmVyaWZpZWQgPSBSb2NrZXRDaGF0LlRPVFAudmVyaWZ5KHtcblx0XHRcdHNlY3JldDogdXNlci5zZXJ2aWNlcy50b3RwLnRlbXBTZWNyZXQsXG5cdFx0XHR0b2tlbjogdXNlclRva2VuXG5cdFx0fSk7XG5cblx0XHRpZiAodmVyaWZpZWQpIHtcblx0XHRcdGNvbnN0IHsgY29kZXMsIGhhc2hlZENvZGVzIH0gPSBSb2NrZXRDaGF0LlRPVFAuZ2VuZXJhdGVDb2RlcygpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5lbmFibGUyRkFBbmRTZXRTZWNyZXRBbmRDb2Rlc0J5VXNlcklkKE1ldGVvci51c2VySWQoKSwgdXNlci5zZXJ2aWNlcy50b3RwLnRlbXBTZWNyZXQsIGhhc2hlZENvZGVzKTtcblx0XHRcdHJldHVybiB7IGNvZGVzIH07XG5cdFx0fVxuXHR9XG59KTtcbiIsIlJvY2tldENoYXQubW9kZWxzLlVzZXJzLmRpc2FibGUyRkFBbmRTZXRUZW1wU2VjcmV0QnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQsIHRlbXBUb2tlbikge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogdXNlcklkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHQnc2VydmljZXMudG90cCc6IHtcblx0XHRcdFx0ZW5hYmxlZDogZmFsc2UsXG5cdFx0XHRcdHRlbXBTZWNyZXQ6IHRlbXBUb2tlblxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5lbmFibGUyRkFBbmRTZXRTZWNyZXRBbmRDb2Rlc0J5VXNlcklkID0gZnVuY3Rpb24odXNlcklkLCBzZWNyZXQsIGJhY2t1cENvZGVzKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiB1c2VySWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdzZXJ2aWNlcy50b3RwLmVuYWJsZWQnOiB0cnVlLFxuXHRcdFx0J3NlcnZpY2VzLnRvdHAuc2VjcmV0Jzogc2VjcmV0LFxuXHRcdFx0J3NlcnZpY2VzLnRvdHAuaGFzaGVkQmFja3VwJzogYmFja3VwQ29kZXNcblx0XHR9LFxuXHRcdCR1bnNldDoge1xuXHRcdFx0J3NlcnZpY2VzLnRvdHAudGVtcFNlY3JldCc6IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZGlzYWJsZTJGQUJ5VXNlcklkID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiB1c2VySWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdCdzZXJ2aWNlcy50b3RwJzoge1xuXHRcdFx0XHRlbmFibGVkOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy51cGRhdGUyRkFCYWNrdXBDb2Rlc0J5VXNlcklkID0gZnVuY3Rpb24odXNlcklkLCBiYWNrdXBDb2Rlcykge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogdXNlcklkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHQnc2VydmljZXMudG90cC5oYXNoZWRCYWNrdXAnOiBiYWNrdXBDb2Rlc1xuXHRcdH1cblx0fSk7XG59O1xuIiwiQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoJ3RvdHAnLCBmdW5jdGlvbihvcHRpb25zKSB7XG5cdGlmICghb3B0aW9ucy50b3RwIHx8ICFvcHRpb25zLnRvdHAuY29kZSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHJldHVybiBBY2NvdW50cy5fcnVuTG9naW5IYW5kbGVycyh0aGlzLCBvcHRpb25zLnRvdHAubG9naW4pO1xufSk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnb25WYWxpZGF0ZUxvZ2luJywgKGxvZ2luKSA9PiB7XG5cdGlmIChsb2dpbi50eXBlID09PSAncGFzc3dvcmQnICYmIGxvZ2luLnVzZXIuc2VydmljZXMgJiYgbG9naW4udXNlci5zZXJ2aWNlcy50b3RwICYmIGxvZ2luLnVzZXIuc2VydmljZXMudG90cC5lbmFibGVkID09PSB0cnVlKSB7XG5cdFx0Y29uc3QgeyB0b3RwIH0gPSBsb2dpbi5tZXRob2RBcmd1bWVudHNbMF07XG5cblx0XHRpZiAoIXRvdHAgfHwgIXRvdHAuY29kZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcigndG90cC1yZXF1aXJlZCcsICdUT1RQIFJlcXVpcmVkJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmVyaWZpZWQgPSBSb2NrZXRDaGF0LlRPVFAudmVyaWZ5KHtcblx0XHRcdHNlY3JldDogbG9naW4udXNlci5zZXJ2aWNlcy50b3RwLnNlY3JldCxcblx0XHRcdHRva2VuOiB0b3RwLmNvZGUsXG5cdFx0XHR1c2VySWQ6IGxvZ2luLnVzZXIuX2lkLFxuXHRcdFx0YmFja3VwVG9rZW5zOiBsb2dpbi51c2VyLnNlcnZpY2VzLnRvdHAuaGFzaGVkQmFja3VwXG5cdFx0fSk7XG5cblx0XHRpZiAodmVyaWZpZWQgIT09IHRydWUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ3RvdHAtaW52YWxpZCcsICdUT1RQIEludmFsaWQnKTtcblx0XHR9XG5cdH1cbn0pO1xuIl19
