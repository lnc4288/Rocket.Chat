(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var reaction;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:reactions":{"server":{"models":{"Messages.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_reactions/server/models/Messages.js                                                           //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
RocketChat.models.Messages.setReactions = function (messageId, reactions) {
  return this.update({
    _id: messageId
  }, {
    $set: {
      reactions
    }
  });
};

RocketChat.models.Messages.unsetReactions = function (messageId) {
  return this.update({
    _id: messageId
  }, {
    $unset: {
      reactions: 1
    }
  });
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"setReaction.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_reactions/setReaction.js                                                                      //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  setReaction(reaction, messageId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setReaction'
      });
    }

    const message = RocketChat.models.Messages.findOneById(messageId);

    if (!message) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setReaction'
      });
    }

    const room = Meteor.call('canAccessRoom', message.rid, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'setReaction'
      });
    }

    const user = Meteor.user();

    if (Array.isArray(room.muted) && room.muted.indexOf(user.username) !== -1 && !room.reactWhenReadOnly) {
      RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: room._id,
        ts: new Date(),
        msg: TAPi18n.__('You_have_been_muted', {}, user.language)
      });
      return false;
    } else if (!RocketChat.models.Subscriptions.findOne({
      rid: message.rid
    })) {
      return false;
    }

    reaction = `:${reaction.replace(/:/g, '')}:`;

    if (message.reactions && message.reactions[reaction] && message.reactions[reaction].usernames.indexOf(user.username) !== -1) {
      message.reactions[reaction].usernames.splice(message.reactions[reaction].usernames.indexOf(user.username), 1);

      if (message.reactions[reaction].usernames.length === 0) {
        delete message.reactions[reaction];
      }

      if (_.isEmpty(message.reactions)) {
        delete message.reactions;
        RocketChat.models.Messages.unsetReactions(messageId);
        RocketChat.callbacks.run('unsetReaction', messageId, reaction);
      } else {
        RocketChat.models.Messages.setReactions(messageId, message.reactions);
        RocketChat.callbacks.run('setReaction', messageId, reaction);
      }
    } else {
      if (!message.reactions) {
        message.reactions = {};
      }

      if (!message.reactions[reaction]) {
        message.reactions[reaction] = {
          usernames: []
        };
      }

      message.reactions[reaction].usernames.push(user.username);
      RocketChat.models.Messages.setReactions(messageId, message.reactions);
      RocketChat.callbacks.run('setReaction', messageId, reaction);
    }

    msgStream.emit(message.rid, message);
    return;
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:reactions/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:reactions/setReaction.js");

/* Exports */
Package._define("rocketchat:reactions");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_reactions.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpyZWFjdGlvbnMvc2VydmVyL21vZGVscy9NZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpyZWFjdGlvbnMvc2V0UmVhY3Rpb24uanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIk1lc3NhZ2VzIiwic2V0UmVhY3Rpb25zIiwibWVzc2FnZUlkIiwicmVhY3Rpb25zIiwidXBkYXRlIiwiX2lkIiwiJHNldCIsInVuc2V0UmVhY3Rpb25zIiwiJHVuc2V0IiwiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwiTWV0ZW9yIiwibWV0aG9kcyIsInNldFJlYWN0aW9uIiwicmVhY3Rpb24iLCJ1c2VySWQiLCJFcnJvciIsIm1ldGhvZCIsIm1lc3NhZ2UiLCJmaW5kT25lQnlJZCIsInJvb20iLCJjYWxsIiwicmlkIiwidXNlciIsIkFycmF5IiwiaXNBcnJheSIsIm11dGVkIiwiaW5kZXhPZiIsInVzZXJuYW1lIiwicmVhY3RXaGVuUmVhZE9ubHkiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5VXNlciIsIlJhbmRvbSIsImlkIiwidHMiLCJEYXRlIiwibXNnIiwiVEFQaTE4biIsIl9fIiwibGFuZ3VhZ2UiLCJTdWJzY3JpcHRpb25zIiwiZmluZE9uZSIsInJlcGxhY2UiLCJ1c2VybmFtZXMiLCJzcGxpY2UiLCJsZW5ndGgiLCJpc0VtcHR5IiwiY2FsbGJhY2tzIiwicnVuIiwicHVzaCIsIm1zZ1N0cmVhbSIsImVtaXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxZQUEzQixHQUEwQyxVQUFTQyxTQUFULEVBQW9CQyxTQUFwQixFQUErQjtBQUN4RSxTQUFPLEtBQUtDLE1BQUwsQ0FBWTtBQUFFQyxTQUFLSDtBQUFQLEdBQVos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MUIsS0FBS0ssUUFBaEQ7QUFFQWxDLGlCQUFXQyxNQUFYLENBQWtCQyxRQUFsQixDQUEyQkMsWUFBM0IsQ0FBd0NDLFNBQXhDLEVBQW1Eb0IsUUFBUW5CLFNBQTNEO0FBQ0FMLGlCQUFXcUQsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsYUFBekIsRUFBd0NsRCxTQUF4QyxFQUFtRGdCLFFBQW5EO0FBQ0E7O0FBRURvQyxjQUFVQyxJQUFWLENBQWVqQyxRQUFRSSxHQUF2QixFQUE0QkosT0FBNUI7QUFFQTtBQUNBOztBQW5FYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfcmVhY3Rpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuc2V0UmVhY3Rpb25zID0gZnVuY3Rpb24obWVzc2FnZUlkLCByZWFjdGlvbnMpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkOiBtZXNzYWdlSWQgfSwgeyAkc2V0OiB7IHJlYWN0aW9ucyB9fSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy51bnNldFJlYWN0aW9ucyA9IGZ1bmN0aW9uKG1lc3NhZ2VJZCkge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQ6IG1lc3NhZ2VJZCB9LCB7ICR1bnNldDogeyByZWFjdGlvbnM6IDEgfX0pO1xufTtcbiIsIi8qIGdsb2JhbHMgbXNnU3RyZWFtICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRzZXRSZWFjdGlvbihyZWFjdGlvbiwgbWVzc2FnZUlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ3NldFJlYWN0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBtZXNzYWdlID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZUlkKTtcblxuXHRcdGlmICghbWVzc2FnZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ3NldFJlYWN0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gTWV0ZW9yLmNhbGwoJ2NhbkFjY2Vzc1Jvb20nLCBtZXNzYWdlLnJpZCwgTWV0ZW9yLnVzZXJJZCgpKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ3NldFJlYWN0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmIChBcnJheS5pc0FycmF5KHJvb20ubXV0ZWQpICYmIHJvb20ubXV0ZWQuaW5kZXhPZih1c2VyLnVzZXJuYW1lKSAhPT0gLTEgJiYgIXJvb20ucmVhY3RXaGVuUmVhZE9ubHkpIHtcblx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1lvdV9oYXZlX2JlZW5fbXV0ZWQnLCB7fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gZWxzZSBpZiAoIVJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZSh7IHJpZDogbWVzc2FnZS5yaWQgfSkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZWFjdGlvbiA9IGA6JHsgcmVhY3Rpb24ucmVwbGFjZSgvOi9nLCAnJykgfTpgO1xuXG5cdFx0aWYgKG1lc3NhZ2UucmVhY3Rpb25zICYmIG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXSAmJiBtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgIT09IC0xKSB7XG5cdFx0XHRtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0udXNlcm5hbWVzLnNwbGljZShtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSksIDEpO1xuXG5cdFx0XHRpZiAobWVzc2FnZS5yZWFjdGlvbnNbcmVhY3Rpb25dLnVzZXJuYW1lcy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0ZGVsZXRlIG1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKF8uaXNFbXB0eShtZXNzYWdlLnJlYWN0aW9ucykpIHtcblx0XHRcdFx0ZGVsZXRlIG1lc3NhZ2UucmVhY3Rpb25zO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy51bnNldFJlYWN0aW9ucyhtZXNzYWdlSWQpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ3Vuc2V0UmVhY3Rpb24nLCBtZXNzYWdlSWQsIHJlYWN0aW9uKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFJlYWN0aW9ucyhtZXNzYWdlSWQsIG1lc3NhZ2UucmVhY3Rpb25zKTtcblx0XHRcdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdzZXRSZWFjdGlvbicsIG1lc3NhZ2VJZCwgcmVhY3Rpb24pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIW1lc3NhZ2UucmVhY3Rpb25zKSB7XG5cdFx0XHRcdG1lc3NhZ2UucmVhY3Rpb25zID0ge307XG5cdFx0XHR9XG5cdFx0XHRpZiAoIW1lc3NhZ2UucmVhY3Rpb25zW3JlYWN0aW9uXSkge1xuXHRcdFx0XHRtZXNzYWdlLnJlYWN0aW9uc1tyZWFjdGlvbl0gPSB7XG5cdFx0XHRcdFx0dXNlcm5hbWVzOiBbXVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdFx0bWVzc2FnZS5yZWFjdGlvbnNbcmVhY3Rpb25dLnVzZXJuYW1lcy5wdXNoKHVzZXIudXNlcm5hbWUpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRSZWFjdGlvbnMobWVzc2FnZUlkLCBtZXNzYWdlLnJlYWN0aW9ucyk7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ3NldFJlYWN0aW9uJywgbWVzc2FnZUlkLCByZWFjdGlvbik7XG5cdFx0fVxuXG5cdFx0bXNnU3RyZWFtLmVtaXQobWVzc2FnZS5yaWQsIG1lc3NhZ2UpO1xuXG5cdFx0cmV0dXJuO1xuXHR9XG59KTtcbiJdfQ==
