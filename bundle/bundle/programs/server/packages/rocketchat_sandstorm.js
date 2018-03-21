(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var getHttpBridge, waitPromise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:sandstorm":{"server":{"lib.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/lib.js                                                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 0);
RocketChat.Sandstorm = {};

if (process.env.SANDSTORM === '1') {
  const Capnp = require('/node_modules/capnp.js');

  const SandstormHttpBridge = Capnp.importSystem('sandstorm/sandstorm-http-bridge.capnp').SandstormHttpBridge;
  let capnpConnection = null;
  let httpBridge = null;

  getHttpBridge = function () {
    if (!httpBridge) {
      capnpConnection = Capnp.connect('unix:/tmp/sandstorm-api');
      httpBridge = capnpConnection.restore(null, SandstormHttpBridge);
    }

    return httpBridge;
  };

  const promiseToFuture = function (promise) {
    const result = new Future();
    promise.then(result.return.bind(result), result.throw.bind(result));
    return result;
  };

  waitPromise = function (promise) {
    return promiseToFuture(promise).wait();
  }; // This usual implementation of this method returns an absolute URL that is invalid
  // under Sandstorm.


  UploadFS.Store.prototype.getURL = function (path) {
    return this.getRelativeURL(path);
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"events.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/events.js                                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.Sandstorm.notify = function () {};

if (process.env.SANDSTORM === '1') {
  const ACTIVITY_TYPES = {
    'message': 0,
    'privateMessage': 1
  };

  RocketChat.Sandstorm.notify = function (message, userIds, caption, type) {
    const sessionId = message.sandstormSessionId;

    if (!sessionId) {
      return;
    }

    const httpBridge = getHttpBridge();
    const activity = {};

    if (type) {
      activity.type = ACTIVITY_TYPES[type];
    }

    if (caption) {
      activity.notification = {
        caption: {
          defaultText: caption
        }
      };
    }

    if (userIds) {
      activity.users = _.map(userIds, function (userId) {
        const user = Meteor.users.findOne({
          _id: userId
        }, {
          fields: {
            'services.sandstorm.id': 1
          }
        });
        return {
          identity: waitPromise(httpBridge.getSavedIdentity(user.services.sandstorm.id)).identity,
          mentioned: true
        };
      });
    }

    return waitPromise(httpBridge.getSessionContext(sessionId).context.activity(activity));
  };
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"powerbox.js":function(require){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_sandstorm/server/powerbox.js                                                                  //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* globals getHttpBridge, waitPromise */
RocketChat.Sandstorm.offerUiView = function () {};

if (process.env.SANDSTORM === '1') {
  const Capnp = require('/node_modules/capnp.js');

  const Powerbox = Capnp.importSystem('sandstorm/powerbox.capnp');
  const Grain = Capnp.importSystem('sandstorm/grain.capnp');

  RocketChat.Sandstorm.offerUiView = function (token, serializedDescriptor, sessionId) {
    const httpBridge = getHttpBridge();
    const session = httpBridge.getSessionContext(sessionId).context;
    const api = httpBridge.getSandstormApi(sessionId).api;
    const cap = waitPromise(api.restore(new Buffer(token, 'base64'))).cap;
    return waitPromise(session.offer(cap, undefined, {
      tags: [{
        id: '15831515641881813735',
        value: new Buffer(serializedDescriptor, 'base64')
      }]
    }));
  };

  Meteor.methods({
    sandstormClaimRequest(token, serializedDescriptor) {
      const descriptor = Capnp.parsePacked(Powerbox.PowerboxDescriptor, new Buffer(serializedDescriptor, 'base64'));
      const grainTitle = Capnp.parse(Grain.UiView.PowerboxTag, descriptor.tags[0].value).title;
      const sessionId = this.connection.sandstormSessionId();
      const httpBridge = getHttpBridge();
      const session = httpBridge.getSessionContext(sessionId).context;
      const cap = waitPromise(session.claimRequest(token)).cap.castAs(Grain.UiView);
      const api = httpBridge.getSandstormApi(sessionId).api;
      const newToken = waitPromise(api.save(cap)).token.toString('base64');
      const viewInfo = waitPromise(cap.getViewInfo());
      const appTitle = viewInfo.appTitle;
      const asset = waitPromise(viewInfo.grainIcon.getUrl());
      const appIconUrl = `${asset.protocol}://${asset.hostPath}`;
      return {
        token: newToken,
        appTitle,
        appIconUrl,
        grainTitle,
        descriptor: descriptor.tags[0].value.toString('base64')
      };
    },

    sandstormOffer(token, serializedDescriptor) {
      RocketChat.Sandstorm.offerUiView(token, serializedDescriptor, this.connection.sandstormSessionId());
    }

  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:sandstorm/server/lib.js");
require("/node_modules/meteor/rocketchat:sandstorm/server/events.js");
require("/node_modules/meteor/rocketchat:sandstorm/server/powerbox.js");

/* Exports */
Package._define("rocketchat:sandstorm");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_sandstorm.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL2xpYi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL2V2ZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzYW5kc3Rvcm0vc2VydmVyL3Bvd2VyYm94LmpzIl0sIm5hbWVzIjpbIkZ1dHVyZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiUm9ja2V0Q2hhdCIsIlNhbmRzdG9ybSIsInByb2Nlc3MiLCJlbnYiLCJTQU5EU1RPUk0iLCJDYXBucCIsIlNhbmRzdG9ybUh0dHBCcmlkZ2UiLCJpbXBvcnRTeXN0ZW0iLCJjYXBucENvbm5lY3Rpb24iLCJodHRwQnJpZGdlIiwiZ2V0SHR0cEJyaWRnZSIsImNvbm5lY3QiLCJyZXN0b3JlIiwicHJvbWlzZVRvRnV0dXJlIiwicHJvbWlzZSIsInJlc3VsdCIsInRoZW4iLCJyZXR1cm4iLCJiaW5kIiwidGhyb3ciLCJ3YWl0UHJvbWlzZSIsIndhaXQiLCJVcGxvYWRGUyIsIlN0b3JlIiwicHJvdG90eXBlIiwiZ2V0VVJMIiwicGF0aCIsImdldFJlbGF0aXZlVVJMIiwiXyIsIm5vdGlmeSIsIkFDVElWSVRZX1RZUEVTIiwibWVzc2FnZSIsInVzZXJJZHMiLCJjYXB0aW9uIiwidHlwZSIsInNlc3Npb25JZCIsInNhbmRzdG9ybVNlc3Npb25JZCIsImFjdGl2aXR5Iiwibm90aWZpY2F0aW9uIiwiZGVmYXVsdFRleHQiLCJ1c2VycyIsIm1hcCIsInVzZXJJZCIsInVzZXIiLCJNZXRlb3IiLCJmaW5kT25lIiwiX2lkIiwiZmllbGRzIiwiaWRlbnRpdHkiLCJnZXRTYXZlZElkZW50aXR5Iiwic2VydmljZXMiLCJzYW5kc3Rvcm0iLCJpZCIsIm1lbnRpb25lZCIsImdldFNlc3Npb25Db250ZXh0IiwiY29udGV4dCIsIm9mZmVyVWlWaWV3IiwiUG93ZXJib3giLCJHcmFpbiIsInRva2VuIiwic2VyaWFsaXplZERlc2NyaXB0b3IiLCJzZXNzaW9uIiwiYXBpIiwiZ2V0U2FuZHN0b3JtQXBpIiwiY2FwIiwiQnVmZmVyIiwib2ZmZXIiLCJ1bmRlZmluZWQiLCJ0YWdzIiwidmFsdWUiLCJtZXRob2RzIiwic2FuZHN0b3JtQ2xhaW1SZXF1ZXN0IiwiZGVzY3JpcHRvciIsInBhcnNlUGFja2VkIiwiUG93ZXJib3hEZXNjcmlwdG9yIiwiZ3JhaW5UaXRsZSIsInBhcnNlIiwiVWlWaWV3IiwiUG93ZXJib3hUYWciLCJ0aXRsZSIsImNvbm5lY3Rpb24iLCJjbGFpbVJlcXVlc3QiLCJjYXN0QXMiLCJuZXdUb2tlbiIsInNhdmUiLCJ0b1N0cmluZyIsInZpZXdJbmZvIiwiZ2V0Vmlld0luZm8iLCJhcHBUaXRsZSIsImFzc2V0IiwiZ3JhaW5JY29uIiwiZ2V0VXJsIiwiYXBwSWNvblVybCIsInByb3RvY29sIiwiaG9zdFBhdGgiLCJzYW5kc3Rvcm1PZmZlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxlQUFSLENBQWIsRUFBc0M7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBdEMsRUFBNkQsQ0FBN0Q7QUFJWEMsV0FBV0MsU0FBWCxHQUF1QixFQUF2Qjs7QUFFQSxJQUFJQyxRQUFRQyxHQUFSLENBQVlDLFNBQVosS0FBMEIsR0FBOUIsRUFBbUM7QUFDbEMsUUFBTUMsUUFBUVIsUUFBUSx3QkFBUixDQUFkOztBQUNBLFFBQU1TLHNCQUFzQkQsTUFBTUUsWUFBTixDQUFtQix1Q0FBbkIsRUFBNERELG1CQUF4RjtBQUVBLE1BQUlFLGtCQUFrQixJQUF0QjtBQUNBLE1BQUlDLGFBQWEsSUFBakI7O0FBRUFDLGtCQUFnQixZQUFXO0FBQzFCLFFBQUksQ0FBQ0QsVUFBTCxFQUFp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dUQsV0FBckIsQ0FBaUNHLEtBQWpDLEVBQXdDQyxvQkFBeEMsRUFDQyxLQUFLb0IsVUFBTCxDQUFnQjVDLGtCQUFoQixFQUREO0FBRUE7O0FBekJhLEdBQWY7QUEyQkEsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zYW5kc3Rvcm0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIGdldEh0dHBCcmlkZ2UsIHdhaXRQcm9taXNlLCBVcGxvYWRGUyAqL1xuLyogZXhwb3J0ZWQgZ2V0SHR0cEJyaWRnZSwgd2FpdFByb21pc2UgKi9cbmltcG9ydCBGdXR1cmUgZnJvbSAnZmliZXJzL2Z1dHVyZSc7XG5cblJvY2tldENoYXQuU2FuZHN0b3JtID0ge307XG5cbmlmIChwcm9jZXNzLmVudi5TQU5EU1RPUk0gPT09ICcxJykge1xuXHRjb25zdCBDYXBucCA9IHJlcXVpcmUoJy9ub2RlX21vZHVsZXMvY2FwbnAuanMnKTtcblx0Y29uc3QgU2FuZHN0b3JtSHR0cEJyaWRnZSA9IENhcG5wLmltcG9ydFN5c3RlbSgnc2FuZHN0b3JtL3NhbmRzdG9ybS1odHRwLWJyaWRnZS5jYXBucCcpLlNhbmRzdG9ybUh0dHBCcmlkZ2U7XG5cblx0bGV0IGNhcG5wQ29ubmVjdGlvbiA9IG51bGw7XG5cdGxldCBodHRwQnJpZGdlID0gbnVsbDtcblxuXHRnZXRIdHRwQnJpZGdlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKCFodHRwQnJpZGdlKSB7XG5cdFx0XHRjYXBucENvbm5lY3Rpb24gPSBDYXBucC5jb25uZWN0KCd1bml4Oi90bXAvc2FuZHN0b3JtLWFwaScpO1xuXHRcdFx0aHR0cEJyaWRnZSA9IGNhcG5wQ29ubmVjdGlvbi5yZXN0b3JlKG51bGwsIFNhbmRzdG9ybUh0dHBCcmlkZ2UpO1xuXHRcdH1cblx0XHRyZXR1cm4gaHR0cEJyaWRnZTtcblx0fTtcblxuXHRjb25zdCBwcm9taXNlVG9GdXR1cmUgPSBmdW5jdGlvbihwcm9taXNlKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gbmV3IEZ1dHVyZSgpO1xuXHRcdHByb21pc2UudGhlbihyZXN1bHQucmV0dXJuLmJpbmQocmVzdWx0KSwgcmVzdWx0LnRocm93LmJpbmQocmVzdWx0KSk7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fTtcblxuXHR3YWl0UHJvbWlzZSA9IGZ1bmN0aW9uKHByb21pc2UpIHtcblx0XHRyZXR1cm4gcHJvbWlzZVRvRnV0dXJlKHByb21pc2UpLndhaXQoKTtcblx0fTtcblxuXHQvLyBUaGlzIHVzdWFsIGltcGxlbWVudGF0aW9uIG9mIHRoaXMgbWV0aG9kIHJldHVybnMgYW4gYWJzb2x1dGUgVVJMIHRoYXQgaXMgaW52YWxpZFxuXHQvLyB1bmRlciBTYW5kc3Rvcm0uXG5cdFVwbG9hZEZTLlN0b3JlLnByb3RvdHlwZS5nZXRVUkwgPSBmdW5jdGlvbihwYXRoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0UmVsYXRpdmVVUkwocGF0aCk7XG5cdH07XG59XG4iLCIvKiBnbG9iYWxzIGdldEh0dHBCcmlkZ2UsIHdhaXRQcm9taXNlICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5Sb2NrZXRDaGF0LlNhbmRzdG9ybS5ub3RpZnkgPSBmdW5jdGlvbigpIHt9O1xuXG5pZiAocHJvY2Vzcy5lbnYuU0FORFNUT1JNID09PSAnMScpIHtcblx0Y29uc3QgQUNUSVZJVFlfVFlQRVMgPSB7XG5cdFx0J21lc3NhZ2UnOiAwLFxuXHRcdCdwcml2YXRlTWVzc2FnZSc6IDFcblx0fTtcblxuXHRSb2NrZXRDaGF0LlNhbmRzdG9ybS5ub3RpZnkgPSBmdW5jdGlvbihtZXNzYWdlLCB1c2VySWRzLCBjYXB0aW9uLCB0eXBlKSB7XG5cdFx0Y29uc3Qgc2Vzc2lvbklkID0gbWVzc2FnZS5zYW5kc3Rvcm1TZXNzaW9uSWQ7XG5cdFx0aWYgKCFzZXNzaW9uSWQpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Y29uc3QgaHR0cEJyaWRnZSA9IGdldEh0dHBCcmlkZ2UoKTtcblx0XHRjb25zdCBhY3Rpdml0eSA9IHt9O1xuXG5cdFx0aWYgKHR5cGUpIHtcblx0XHRcdGFjdGl2aXR5LnR5cGUgPSBBQ1RJVklUWV9UWVBFU1t0eXBlXTtcblx0XHR9XG5cblx0XHRpZiAoY2FwdGlvbikge1xuXHRcdFx0YWN0aXZpdHkubm90aWZpY2F0aW9uID0ge2NhcHRpb246IHtkZWZhdWx0VGV4dDogY2FwdGlvbn19O1xuXHRcdH1cblxuXHRcdGlmICh1c2VySWRzKSB7XG5cdFx0XHRhY3Rpdml0eS51c2VycyA9IF8ubWFwKHVzZXJJZHMsIGZ1bmN0aW9uKHVzZXJJZCkge1xuXHRcdFx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe19pZDogdXNlcklkfSwge2ZpZWxkczogeydzZXJ2aWNlcy5zYW5kc3Rvcm0uaWQnOiAxfX0pO1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGlkZW50aXR5OiB3YWl0UHJvbWlzZShodHRwQnJpZGdlLmdldFNhdmVkSWRlbnRpdHkodXNlci5zZXJ2aWNlcy5zYW5kc3Rvcm0uaWQpKS5pZGVudGl0eSxcblx0XHRcdFx0XHRtZW50aW9uZWQ6IHRydWVcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB3YWl0UHJvbWlzZShodHRwQnJpZGdlLmdldFNlc3Npb25Db250ZXh0KHNlc3Npb25JZCkuY29udGV4dC5hY3Rpdml0eShhY3Rpdml0eSkpO1xuXHR9O1xufVxuIiwiLyogZ2xvYmFscyBnZXRIdHRwQnJpZGdlLCB3YWl0UHJvbWlzZSAqL1xuXG5Sb2NrZXRDaGF0LlNhbmRzdG9ybS5vZmZlclVpVmlldyA9IGZ1bmN0aW9uKCkge307XG5cbmlmIChwcm9jZXNzLmVudi5TQU5EU1RPUk0gPT09ICcxJykge1xuXHRjb25zdCBDYXBucCA9IHJlcXVpcmUoJy9ub2RlX21vZHVsZXMvY2FwbnAuanMnKTtcblx0Y29uc3QgUG93ZXJib3ggPSBDYXBucC5pbXBvcnRTeXN0ZW0oJ3NhbmRzdG9ybS9wb3dlcmJveC5jYXBucCcpO1xuXHRjb25zdCBHcmFpbiA9IENhcG5wLmltcG9ydFN5c3RlbSgnc2FuZHN0b3JtL2dyYWluLmNhcG5wJyk7XG5cblx0Um9ja2V0Q2hhdC5TYW5kc3Rvcm0ub2ZmZXJVaVZpZXcgPSBmdW5jdGlvbih0b2tlbiwgc2VyaWFsaXplZERlc2NyaXB0b3IsIHNlc3Npb25JZCkge1xuXHRcdGNvbnN0IGh0dHBCcmlkZ2UgPSBnZXRIdHRwQnJpZGdlKCk7XG5cdFx0Y29uc3Qgc2Vzc2lvbiA9IGh0dHBCcmlkZ2UuZ2V0U2Vzc2lvbkNvbnRleHQoc2Vzc2lvbklkKS5jb250ZXh0O1xuXHRcdGNvbnN0IGFwaSA9IGh0dHBCcmlkZ2UuZ2V0U2FuZHN0b3JtQXBpKHNlc3Npb25JZCkuYXBpO1xuXHRcdGNvbnN0IGNhcCA9IHdhaXRQcm9taXNlKGFwaS5yZXN0b3JlKG5ldyBCdWZmZXIodG9rZW4sICdiYXNlNjQnKSkpLmNhcDtcblx0XHRyZXR1cm4gd2FpdFByb21pc2Uoc2Vzc2lvbi5vZmZlcihjYXAsIHVuZGVmaW5lZCwge3RhZ3M6IFt7XG5cdFx0XHRpZDogJzE1ODMxNTE1NjQxODgxODEzNzM1Jyxcblx0XHRcdHZhbHVlOiBuZXcgQnVmZmVyKHNlcmlhbGl6ZWREZXNjcmlwdG9yLCAnYmFzZTY0Jylcblx0XHR9XX0pKTtcblx0fTtcblxuXHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0c2FuZHN0b3JtQ2xhaW1SZXF1ZXN0KHRva2VuLCBzZXJpYWxpemVkRGVzY3JpcHRvcikge1xuXHRcdFx0Y29uc3QgZGVzY3JpcHRvciA9IENhcG5wLnBhcnNlUGFja2VkKFBvd2VyYm94LlBvd2VyYm94RGVzY3JpcHRvciwgbmV3IEJ1ZmZlcihzZXJpYWxpemVkRGVzY3JpcHRvciwgJ2Jhc2U2NCcpKTtcblx0XHRcdGNvbnN0IGdyYWluVGl0bGUgPSBDYXBucC5wYXJzZShHcmFpbi5VaVZpZXcuUG93ZXJib3hUYWcsIGRlc2NyaXB0b3IudGFnc1swXS52YWx1ZSkudGl0bGU7XG5cdFx0XHRjb25zdCBzZXNzaW9uSWQgPSB0aGlzLmNvbm5lY3Rpb24uc2FuZHN0b3JtU2Vzc2lvbklkKCk7XG5cdFx0XHRjb25zdCBodHRwQnJpZGdlID0gZ2V0SHR0cEJyaWRnZSgpO1xuXHRcdFx0Y29uc3Qgc2Vzc2lvbiA9IGh0dHBCcmlkZ2UuZ2V0U2Vzc2lvbkNvbnRleHQoc2Vzc2lvbklkKS5jb250ZXh0O1xuXHRcdFx0Y29uc3QgY2FwID0gd2FpdFByb21pc2Uoc2Vzc2lvbi5jbGFpbVJlcXVlc3QodG9rZW4pKS5jYXAuY2FzdEFzKEdyYWluLlVpVmlldyk7XG5cdFx0XHRjb25zdCBhcGkgPSBodHRwQnJpZGdlLmdldFNhbmRzdG9ybUFwaShzZXNzaW9uSWQpLmFwaTtcblx0XHRcdGNvbnN0IG5ld1Rva2VuID0gd2FpdFByb21pc2UoYXBpLnNhdmUoY2FwKSkudG9rZW4udG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXHRcdFx0Y29uc3Qgdmlld0luZm8gPSB3YWl0UHJvbWlzZShjYXAuZ2V0Vmlld0luZm8oKSk7XG5cdFx0XHRjb25zdCBhcHBUaXRsZSA9IHZpZXdJbmZvLmFwcFRpdGxlO1xuXHRcdFx0Y29uc3QgYXNzZXQgPSB3YWl0UHJvbWlzZSh2aWV3SW5mby5ncmFpbkljb24uZ2V0VXJsKCkpO1xuXHRcdFx0Y29uc3QgYXBwSWNvblVybCA9IGAkeyBhc3NldC5wcm90b2NvbCB9Oi8vJHsgYXNzZXQuaG9zdFBhdGggfWA7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0b2tlbjogbmV3VG9rZW4sXG5cdFx0XHRcdGFwcFRpdGxlLFxuXHRcdFx0XHRhcHBJY29uVXJsLFxuXHRcdFx0XHRncmFpblRpdGxlLFxuXHRcdFx0XHRkZXNjcmlwdG9yOiBkZXNjcmlwdG9yLnRhZ3NbMF0udmFsdWUudG9TdHJpbmcoJ2Jhc2U2NCcpXG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0c2FuZHN0b3JtT2ZmZXIodG9rZW4sIHNlcmlhbGl6ZWREZXNjcmlwdG9yKSB7XG5cdFx0XHRSb2NrZXRDaGF0LlNhbmRzdG9ybS5vZmZlclVpVmlldyh0b2tlbiwgc2VyaWFsaXplZERlc2NyaXB0b3IsXG5cdFx0XHRcdHRoaXMuY29ubmVjdGlvbi5zYW5kc3Rvcm1TZXNzaW9uSWQoKSk7XG5cdFx0fVxuXHR9KTtcbn1cbiJdfQ==
