(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-pin":{"server":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/settings.js                                              //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  RocketChat.settings.add('Message_AllowPinning', true, {
    type: 'boolean',
    group: 'Message',
    'public': true
  });
  return RocketChat.models.Permissions.upsert('pin-message', {
    $setOnInsert: {
      roles: ['owner', 'moderator', 'admin']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

},"pinMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/pinMessage.js                                            //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.methods({
  pinMessage(message, pinnedAt) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'pinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(message.rid);

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
        method: 'pinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    originalMessage.pinned = true;
    originalMessage.pinnedAt = pinnedAt || Date.now;
    originalMessage.pinnedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
    return RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', originalMessage.rid, '', me, {
      attachments: [{
        'text': originalMessage.msg,
        'author_name': originalMessage.u.username,
        'author_icon': getAvatarUrlFromUsername(originalMessage.u.username),
        'ts': originalMessage.ts
      }]
    });
  },

  unpinMessage(message) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unpinMessage'
      });
    }

    if (!RocketChat.settings.get('Message_AllowPinning')) {
      throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(message.rid);

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      return false;
    }

    let originalMessage = RocketChat.models.Messages.findOneById(message._id);

    if (originalMessage == null || originalMessage._id == null) {
      throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
        method: 'unpinMessage',
        action: 'Message_pinning'
      });
    } //If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(originalMessage._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    originalMessage.pinned = false;
    originalMessage.pinnedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    originalMessage = RocketChat.callbacks.run('beforeSaveMessage', originalMessage);
    return RocketChat.models.Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"pinnedMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/publications/pinnedMessages.js                           //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.publish('pinnedMessages', function (rid, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (!user) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findPinnedByRoom(rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      return publication.added('rocketchat_pinned_message', _id, record);
    },

    changed(_id, record) {
      return publication.changed('rocketchat_pinned_message', _id, record);
    },

    removed(_id) {
      return publication.removed('rocketchat_pinned_message', _id);
    }

  });
  this.ready();
  return this.onStop(function () {
    return cursorHandle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_message-pin/server/startup/indexes.js                                       //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  return Meteor.defer(function () {
    return RocketChat.models.Messages.tryEnsureIndex({
      'pinnedBy._id': 1
    }, {
      sparse: 1
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-pin/server/settings.js");
require("/node_modules/meteor/rocketchat:message-pin/server/pinMessage.js");
require("/node_modules/meteor/rocketchat:message-pin/server/publications/pinnedMessages.js");
require("/node_modules/meteor/rocketchat:message-pin/server/startup/indexes.js");

/* Exports */
Package._define("rocketchat:message-pin");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-pin.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3Bpbk1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1waW4vc2VydmVyL3B1YmxpY2F0aW9ucy9waW5uZWRNZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXBpbi9zZXJ2ZXIvc3RhcnR1cC9pbmRleGVzLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGQiLCJ0eXBlIiwiZ3JvdXAiLCJtb2RlbHMiLCJQZXJtaXNzaW9ucyIsInVwc2VydCIsIiRzZXRPbkluc2VydCIsInJvbGVzIiwibWV0aG9kcyIsInBpbk1lc3NhZ2UiLCJtZXNzYWdlIiwicGlubmVkQXQiLCJ1c2VySWQiLCJFcnJvciIsIm1ldGhvZCIsImdldCIsImFjdGlvbiIsInJvb20iLCJSb29tcyIsImZpbmRPbmVCeUlkIiwicmlkIiwiQXJyYXkiLCJpc0FycmF5IiwidXNlcm5hbWVzIiwiaW5kZXhPZiIsInVzZXIiLCJ1c2VybmFtZSIsIm9yaWdpbmFsTWVzc2FnZSIsIk1lc3NhZ2VzIiwiX2lkIiwiY2xvbmVBbmRTYXZlQXNIaXN0b3J5QnlJZCIsIm1lIiwiVXNlcnMiLCJwaW5uZWQiLCJEYXRlIiwibm93IiwicGlubmVkQnkiLCJjYWxsYmFja3MiLCJydW4iLCJzZXRQaW5uZWRCeUlkQW5kVXNlcklkIiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsImF0dGFjaG1lbnRzIiwibXNnIiwidSIsImdldEF2YXRhclVybEZyb21Vc2VybmFtZSIsInRzIiwidW5waW5NZXNzYWdlIiwicHVibGlzaCIsImxpbWl0IiwicmVhZHkiLCJwdWJsaWNhdGlvbiIsImN1cnNvckhhbmRsZSIsImZpbmRQaW5uZWRCeVJvb20iLCJzb3J0Iiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsInJlY29yZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwib25TdG9wIiwic3RvcCIsImRlZmVyIiwidHJ5RW5zdXJlSW5kZXgiLCJzcGFyc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isc0JBQXhCLEVBQWdELElBQWhELEVBQXNEO0FBQ3JEQyxVQUFNLFNBRCtDO0FBRXJEQyxXQUFPLFNBRjhDO0FBR3JELGNBQVU7QUFIMkMsR0FBdEQ7QUFLQSxTQUFPSixXQUFXSyxNQUFYLENBQWtCQyxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMsYUFBckMsRUFBb0Q7QUFDMURDLGtCQUFjO0FBQ2JDLGFBQU8sQ0FBQyxPQUFELEVBQVUsV0FBVixFQUF1QixPQUF2QjtBQURNO0FBRDRDLEdBQXBELENBQVA7QUFLQSxDQVhELEU7Ozs7Ozs7Ozs7O0FDQUFYLE9BQU9ZLE9BQVAsQ0FBZTtBQUNkQyxhQUFXQyxPQUFYLEVBQW9CQyxRQUFwQixFQUE4QjtBQUM3QixRQUFJLENBQUNmLE9BQU9nQixNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJaEIsT0FBT2lCLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEQyxnQkFBUTtBQURvRCxPQUF2RCxDQUFOO0FBR0E7O0FBRUQsUUFBSSxDQUFDaEIsV0FBV0MsUUFBWCxDQUFvQmdCLEdBQXBCLENBQXdCLHNCQUF4QixDQUFMLEVBQXNEO0FBQ3JELFlBQU0sSUFBSW5CLE9BQU9pQixLQUFYLENBQWlCLDBCQUFqQixFQUE2Qyw2QkFBN0MsRUFBNEU7QUFDakZDLGdCQUFRLFlBRHlFO0FBRWpGRSxnQkFBUTtBQUZ5RSxPQUE1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O0FBVGdILEdBQTdGLENBQXJCO0FBV0EsT0FBS29CLEtBQUw7QUFDQSxTQUFPLEtBQUtVLE1BQUwsQ0FBWSxZQUFXO0FBQzdCLFdBQU9SLGFBQWFTLElBQWIsRUFBUDtBQUNBLEdBRk0sQ0FBUDtBQUdBLENBekJELEU7Ozs7Ozs7Ozs7O0FDQUFoRSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QixTQUFPRCxPQUFPaUUsS0FBUCxDQUFhLFlBQVc7QUFDOUIsV0FBTy9ELFdBQVdLLE1BQVgsQ0FBa0J5QixRQUFsQixDQUEyQmtDLGNBQTNCLENBQTBDO0FBQ2hELHNCQUFnQjtBQURnQyxLQUExQyxFQUVKO0FBQ0ZDLGNBQVE7QUFETixLQUZJLENBQVA7QUFLQSxHQU5NLENBQVA7QUFPQSxDQVJELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbWVzc2FnZS1waW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ01lc3NhZ2VfQWxsb3dQaW5uaW5nJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ01lc3NhZ2UnLFxuXHRcdCdwdWJsaWMnOiB0cnVlXG5cdH0pO1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdwaW4tbWVzc2FnZScsIHtcblx0XHQkc2V0T25JbnNlcnQ6IHtcblx0XHRcdHJvbGVzOiBbJ293bmVyJywgJ21vZGVyYXRvcicsICdhZG1pbiddXG5cdFx0fVxuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRwaW5NZXNzYWdlKG1lc3NhZ2UsIHBpbm5lZEF0KSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3Bpbk1lc3NhZ2UnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93UGlubmluZycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWVzc2FnZSBwaW5uaW5nIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9waW5uaW5nJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKG1lc3NhZ2UucmlkKTtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShyb29tLnVzZXJuYW1lcykgJiYgcm9vbS51c2VybmFtZXMuaW5kZXhPZihNZXRlb3IudXNlcigpLnVzZXJuYW1lKSA9PT0gLTEpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRsZXQgb3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdGlmIChvcmlnaW5hbE1lc3NhZ2UgPT0gbnVsbCB8fCBvcmlnaW5hbE1lc3NhZ2UuX2lkID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtbWVzc2FnZScsICdNZXNzYWdlIHlvdSBhcmUgcGlubmluZyB3YXMgbm90IGZvdW5kJywge1xuXHRcdFx0XHRtZXRob2Q6ICdwaW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9waW5uaW5nJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly9JZiB3ZSBrZWVwIGhpc3Rvcnkgb2YgZWRpdHMsIGluc2VydCBhIG5ldyBtZXNzYWdlIHRvIHN0b3JlIGhpc3RvcnkgaW5mb3JtYXRpb25cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfS2VlcEhpc3RvcnknKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY2xvbmVBbmRTYXZlQXNIaXN0b3J5QnlJZChtZXNzYWdlLl9pZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChNZXRlb3IudXNlcklkKCkpO1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWQgPSB0cnVlO1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWRBdCA9IHBpbm5lZEF0IHx8IERhdGUubm93O1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWRCeSA9IHtcblx0XHRcdF9pZDogTWV0ZW9yLnVzZXJJZCgpLFxuXHRcdFx0dXNlcm5hbWU6IG1lLnVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdG9yaWdpbmFsTWVzc2FnZSA9IFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignYmVmb3JlU2F2ZU1lc3NhZ2UnLCBvcmlnaW5hbE1lc3NhZ2UpO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFBpbm5lZEJ5SWRBbmRVc2VySWQob3JpZ2luYWxNZXNzYWdlLl9pZCwgb3JpZ2luYWxNZXNzYWdlLnBpbm5lZEJ5LCBvcmlnaW5hbE1lc3NhZ2UucGlubmVkKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdtZXNzYWdlX3Bpbm5lZCcsIG9yaWdpbmFsTWVzc2FnZS5yaWQsICcnLCBtZSwge1xuXHRcdFx0YXR0YWNobWVudHM6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdCd0ZXh0Jzogb3JpZ2luYWxNZXNzYWdlLm1zZyxcblx0XHRcdFx0XHQnYXV0aG9yX25hbWUnOiBvcmlnaW5hbE1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0XHQnYXV0aG9yX2ljb24nOiBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUob3JpZ2luYWxNZXNzYWdlLnUudXNlcm5hbWUpLFxuXHRcdFx0XHRcdCd0cyc6IG9yaWdpbmFsTWVzc2FnZS50c1xuXHRcdFx0XHR9XG5cdFx0XHRdXG5cdFx0fSk7XG5cdH0sXG5cdHVucGluTWVzc2FnZShtZXNzYWdlKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3VucGluTWVzc2FnZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfQWxsb3dQaW5uaW5nJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdNZXNzYWdlIHBpbm5pbmcgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3VucGluTWVzc2FnZScsXG5cdFx0XHRcdGFjdGlvbjogJ01lc3NhZ2VfcGlubmluZydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChtZXNzYWdlLnJpZCk7XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyb29tLnVzZXJuYW1lcykgJiYgcm9vbS51c2VybmFtZXMuaW5kZXhPZihNZXRlb3IudXNlcigpLnVzZXJuYW1lKSA9PT0gLTEpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRsZXQgb3JpZ2luYWxNZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZS5faWQpO1xuXG5cdFx0aWYgKG9yaWdpbmFsTWVzc2FnZSA9PSBudWxsIHx8IG9yaWdpbmFsTWVzc2FnZS5faWQgPT0gbnVsbCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1tZXNzYWdlJywgJ01lc3NhZ2UgeW91IGFyZSB1bnBpbm5pbmcgd2FzIG5vdCBmb3VuZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5waW5NZXNzYWdlJyxcblx0XHRcdFx0YWN0aW9uOiAnTWVzc2FnZV9waW5uaW5nJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly9JZiB3ZSBrZWVwIGhpc3Rvcnkgb2YgZWRpdHMsIGluc2VydCBhIG5ldyBtZXNzYWdlIHRvIHN0b3JlIGhpc3RvcnkgaW5mb3JtYXRpb25cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01lc3NhZ2VfS2VlcEhpc3RvcnknKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY2xvbmVBbmRTYXZlQXNIaXN0b3J5QnlJZChvcmlnaW5hbE1lc3NhZ2UuX2lkKTtcblx0XHR9XG5cblx0XHRjb25zdCBtZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cdFx0b3JpZ2luYWxNZXNzYWdlLnBpbm5lZCA9IGZhbHNlO1xuXHRcdG9yaWdpbmFsTWVzc2FnZS5waW5uZWRCeSA9IHtcblx0XHRcdF9pZDogTWV0ZW9yLnVzZXJJZCgpLFxuXHRcdFx0dXNlcm5hbWU6IG1lLnVzZXJuYW1lXG5cdFx0fTtcblx0XHRvcmlnaW5hbE1lc3NhZ2UgPSBSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2JlZm9yZVNhdmVNZXNzYWdlJywgb3JpZ2luYWxNZXNzYWdlKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRQaW5uZWRCeUlkQW5kVXNlcklkKG9yaWdpbmFsTWVzc2FnZS5faWQsIG9yaWdpbmFsTWVzc2FnZS5waW5uZWRCeSwgb3JpZ2luYWxNZXNzYWdlLnBpbm5lZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ3Bpbm5lZE1lc3NhZ2VzJywgZnVuY3Rpb24ocmlkLCBsaW1pdCA9IDUwKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cdGNvbnN0IHB1YmxpY2F0aW9uID0gdGhpcztcblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51c2VySWQpO1xuXHRpZiAoIXVzZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cdGNvbnN0IGN1cnNvckhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRQaW5uZWRCeVJvb20ocmlkLCB7IHNvcnQ6IHsgdHM6IC0xIH0sIGxpbWl0IH0pLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChfaWQsIHJlY29yZCkge1xuXHRcdFx0cmV0dXJuIHB1YmxpY2F0aW9uLmFkZGVkKCdyb2NrZXRjaGF0X3Bpbm5lZF9tZXNzYWdlJywgX2lkLCByZWNvcmQpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChfaWQsIHJlY29yZCkge1xuXHRcdFx0cmV0dXJuIHB1YmxpY2F0aW9uLmNoYW5nZWQoJ3JvY2tldGNoYXRfcGlubmVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKF9pZCkge1xuXHRcdFx0cmV0dXJuIHB1YmxpY2F0aW9uLnJlbW92ZWQoJ3JvY2tldGNoYXRfcGlubmVkX21lc3NhZ2UnLCBfaWQpO1xuXHRcdH1cblx0fSk7XG5cdHRoaXMucmVhZHkoKTtcblx0cmV0dXJuIHRoaXMub25TdG9wKGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBjdXJzb3JIYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdHJldHVybiBNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnRyeUVuc3VyZUluZGV4KHtcblx0XHRcdCdwaW5uZWRCeS5faWQnOiAxXG5cdFx0fSwge1xuXHRcdFx0c3BhcnNlOiAxXG5cdFx0fSk7XG5cdH0pO1xufSk7XG4iXX0=
