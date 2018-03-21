(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Random = Package.random.Random;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:message-snippet":{"server":{"startup":{"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/startup/settings.js                                                    //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.startup(function () {
  RocketChat.settings.add('Message_AllowSnippeting', false, {
    type: 'boolean',
    public: true,
    group: 'Message'
  });
  RocketChat.models.Permissions.upsert('snippet-message', {
    $setOnInsert: {
      roles: ['owner', 'moderator', 'admin']
    }
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"snippetMessage.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/methods/snippetMessage.js                                              //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.methods({
  snippetMessage(message, filename) {
    if (typeof Meteor.userId() === 'undefined' || Meteor.userId() === null) {
      //noinspection JSUnresolvedFunction
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'snippetMessage'
      });
    }

    const room = RocketChat.models.Rooms.findOne({
      _id: message.rid
    });

    if (typeof room === 'undefined' || room === null) {
      return false;
    }

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      return false;
    } // If we keep history of edits, insert a new message to store history information


    if (RocketChat.settings.get('Message_KeepHistory')) {
      RocketChat.models.Messages.cloneAndSaveAsHistoryById(message._id);
    }

    const me = RocketChat.models.Users.findOneById(Meteor.userId());
    message.snippeted = true;
    message.snippetedAt = Date.now;
    message.snippetedBy = {
      _id: Meteor.userId(),
      username: me.username
    };
    message = RocketChat.callbacks.run('beforeSaveMessage', message); // Create the SnippetMessage

    RocketChat.models.Messages.setSnippetedByIdAndUserId(message, filename, message.snippetedBy, message.snippeted, Date.now, filename);
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_snippeted', message.rid, '', me, {
      'snippetId': message._id,
      'snippetName': filename
    });
  }

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"requests.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/requests.js                                                            //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
/* global Cookies */
WebApp.connectHandlers.use('/snippet/download', function (req, res) {
  let rawCookies;
  let token;
  let uid;
  const cookie = new Cookies();

  if (req.headers && req.headers.cookie !== null) {
    rawCookies = req.headers.cookie;
  }

  if (rawCookies !== null) {
    uid = cookie.get('rc_uid', rawCookies);
  }

  if (rawCookies !== null) {
    token = cookie.get('rc_token', rawCookies);
  }

  if (uid === null) {
    uid = req.query.rc_uid;
    token = req.query.rc_token;
  }

  const user = RocketChat.models.Users.findOneByIdAndLoginToken(uid, token);

  if (!(uid && token && user)) {
    res.writeHead(403);
    res.end();
    return false;
  }

  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const snippet = RocketChat.models.Messages.findOne({
      '_id': match[1],
      'snippeted': true
    });
    const room = RocketChat.models.Rooms.findOne({
      '_id': snippet.rid,
      'usernames': {
        '$in': [user.username]
      }
    });

    if (room === undefined) {
      res.writeHead(403);
      res.end();
      return false;
    }

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(snippet.snippetName)}`);
    res.setHeader('Content-Type', 'application/octet-stream'); // Removing the ``` contained in the msg.

    const snippetContent = snippet.msg.substr(3, snippet.msg.length - 6);
    res.setHeader('Content-Length', snippetContent.length);
    res.write(snippetContent);
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
  return;
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"snippetedMessagesByRoom.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/publications/snippetedMessagesByRoom.js                                //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.publish('snippetedMessages', function (rid, limit = 50) {
  if (typeof this.userId === 'undefined' || this.userId === null) {
    return this.ready();
  }

  const publication = this;
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (typeof user === 'undefined' || user === null) {
    return this.ready();
  }

  const cursorHandle = RocketChat.models.Messages.findSnippetedByRoom(rid, {
    sort: {
      ts: -1
    },
    limit
  }).observeChanges({
    added(_id, record) {
      publication.added('rocketchat_snippeted_message', _id, record);
    },

    changed(_id, record) {
      publication.changed('rocketchat_snippeted_message', _id, record);
    },

    removed(_id) {
      publication.removed('rocketchat_snippeted_message', _id);
    }

  });
  this.ready();

  this.onStop = function () {
    cursorHandle.stop();
  };
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"snippetedMessage.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                   //
// packages/rocketchat_message-snippet/server/publications/snippetedMessage.js                                       //
//                                                                                                                   //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                     //
Meteor.publish('snippetedMessage', function (_id) {
  if (typeof this.userId === 'undefined' || this.userId === null) {
    return this.ready();
  }

  const snippet = RocketChat.models.Messages.findOne({
    _id,
    snippeted: true
  });
  const user = RocketChat.models.Users.findOneById(this.userId);
  const roomSnippetQuery = {
    '_id': snippet.rid,
    'usernames': {
      '$in': [user.username]
    }
  };

  if (RocketChat.models.Rooms.findOne(roomSnippetQuery) === undefined) {
    return this.ready();
  }

  const publication = this;

  if (typeof user === 'undefined' || user === null) {
    return this.ready();
  }

  const cursor = RocketChat.models.Messages.find({
    _id
  }).observeChanges({
    added(_id, record) {
      publication.added('rocketchat_snippeted_message', _id, record);
    },

    changed(_id, record) {
      publication.changed('rocketchat_snippeted_message', _id, record);
    },

    removed(_id) {
      publication.removed('rocketchat_snippeted_message', _id);
    }

  });
  this.ready();

  this.onStop = function () {
    cursor.stop();
  };
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:message-snippet/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/methods/snippetMessage.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/requests.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/publications/snippetedMessagesByRoom.js");
require("/node_modules/meteor/rocketchat:message-snippet/server/publications/snippetedMessage.js");

/* Exports */
Package._define("rocketchat:message-snippet");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_message-snippet.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptZXNzYWdlLXNuaXBwZXQvc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9tZXRob2RzL3NuaXBwZXRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0Om1lc3NhZ2Utc25pcHBldC9zZXJ2ZXIvcmVxdWVzdHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9wdWJsaWNhdGlvbnMvc25pcHBldGVkTWVzc2FnZXNCeVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bWVzc2FnZS1zbmlwcGV0L3NlcnZlci9wdWJsaWNhdGlvbnMvc25pcHBldGVkTWVzc2FnZS5qcyJdLCJuYW1lcyI6WyJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiYWRkIiwidHlwZSIsInB1YmxpYyIsImdyb3VwIiwibW9kZWxzIiwiUGVybWlzc2lvbnMiLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJyb2xlcyIsIm1ldGhvZHMiLCJzbmlwcGV0TWVzc2FnZSIsIm1lc3NhZ2UiLCJmaWxlbmFtZSIsInVzZXJJZCIsIkVycm9yIiwibWV0aG9kIiwicm9vbSIsIlJvb21zIiwiZmluZE9uZSIsIl9pZCIsInJpZCIsIkFycmF5IiwiaXNBcnJheSIsInVzZXJuYW1lcyIsImluZGV4T2YiLCJ1c2VyIiwidXNlcm5hbWUiLCJnZXQiLCJNZXNzYWdlcyIsImNsb25lQW5kU2F2ZUFzSGlzdG9yeUJ5SWQiLCJtZSIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJzbmlwcGV0ZWQiLCJzbmlwcGV0ZWRBdCIsIkRhdGUiLCJub3ciLCJzbmlwcGV0ZWRCeSIsImNhbGxiYWNrcyIsInJ1biIsInNldFNuaXBwZXRlZEJ5SWRBbmRVc2VySWQiLCJjcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicmVxIiwicmVzIiwicmF3Q29va2llcyIsInRva2VuIiwidWlkIiwiY29va2llIiwiQ29va2llcyIsImhlYWRlcnMiLCJxdWVyeSIsInJjX3VpZCIsInJjX3Rva2VuIiwiZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuIiwid3JpdGVIZWFkIiwiZW5kIiwibWF0Y2giLCJleGVjIiwidXJsIiwic25pcHBldCIsInVuZGVmaW5lZCIsInNldEhlYWRlciIsImVuY29kZVVSSUNvbXBvbmVudCIsInNuaXBwZXROYW1lIiwic25pcHBldENvbnRlbnQiLCJtc2ciLCJzdWJzdHIiLCJsZW5ndGgiLCJ3cml0ZSIsInB1Ymxpc2giLCJsaW1pdCIsInJlYWR5IiwicHVibGljYXRpb24iLCJjdXJzb3JIYW5kbGUiLCJmaW5kU25pcHBldGVkQnlSb29tIiwic29ydCIsInRzIiwib2JzZXJ2ZUNoYW5nZXMiLCJhZGRlZCIsInJlY29yZCIsImNoYW5nZWQiLCJyZW1vdmVkIiwib25TdG9wIiwic3RvcCIsInJvb21TbmlwcGV0UXVlcnkiLCJjdXJzb3IiLCJmaW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCQyxhQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsRUFBbUQsS0FBbkQsRUFBMEQ7QUFDekRDLFVBQU0sU0FEbUQ7QUFFekRDLFlBQVEsSUFGaUQ7QUFHekRDLFdBQU87QUFIa0QsR0FBMUQ7QUFLQUwsYUFBV00sTUFBWCxDQUFrQkMsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLGlCQUFyQyxFQUF3RDtBQUN2REMsa0JBQWM7QUFDYkMsYUFBTyxDQUFDLE9BQUQsRUFBVSxXQUFWLEVBQXVCLE9BQXZC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TyxLQUFLVyxLQUFMLEVBQVA7QUFDQTs7QUFFRCxRQUFNQyxjQUFjLElBQXBCOztBQUdBLE1BQUksT0FBT2xELElBQVAsS0FBZ0IsV0FBaEIsSUFBK0JBLFNBQVMsSUFBNUMsRUFBa0Q7QUFDakQsV0FBTyxLQUFLaUQsS0FBTCxFQUFQO0FBQ0E7O0FBRUQsUUFBTWMsU0FBUzFGLFdBQVdNLE1BQVgsQ0FBa0J3QixRQUFsQixDQUEyQjZELElBQTNCLENBQ2Q7QUFBRXRFO0FBQUYsR0FEYyxFQUViNkQsY0FGYSxDQUVFO0FBQ2hCQyxVQUFNOUQsR0FBTixFQUFXK0QsTUFBWCxFQUFtQjtBQUNsQlAsa0JBQVlNLEtBQVosQ0FBa0IsOEJBQWxCLEVBQWtEOUQsR0FBbEQsRUFBdUQrRCxNQUF2RDtBQUNBLEtBSGU7O0FBSWhCQyxZQUFRaEUsR0FBUixFQUFhK0QsTUFBYixFQUFxQjtBQUNwQlAsa0JBQVlRLE9BQVosQ0FBb0IsOEJBQXBCLEVBQW9EaEUsR0FBcEQsRUFBeUQrRCxNQUF6RDtBQUNBLEtBTmU7O0FBT2hCRSxZQUFRakUsR0FBUixFQUFhO0FBQ1p3RCxrQkFBWVMsT0FBWixDQUFvQiw4QkFBcEIsRUFBb0RqRSxHQUFwRDtBQUNBOztBQVRlLEdBRkYsQ0FBZjtBQWNBLE9BQUt1RCxLQUFMOztBQUVBLE9BQUtXLE1BQUwsR0FBYyxZQUFXO0FBQ3hCRyxXQUFPRixJQUFQO0FBQ0EsR0FGRDtBQUdBLENBOUNELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfbWVzc2FnZS1zbmlwcGV0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdNZXNzYWdlX0FsbG93U25pcHBldGluZycsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRncm91cDogJ01lc3NhZ2UnXG5cdH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NuaXBwZXQtbWVzc2FnZScsIHtcblx0XHQkc2V0T25JbnNlcnQ6IHtcblx0XHRcdHJvbGVzOiBbJ293bmVyJywgJ21vZGVyYXRvcicsICdhZG1pbiddXG5cdFx0fVxuXHR9KTtcbn0pO1xuXG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdHNuaXBwZXRNZXNzYWdlKG1lc3NhZ2UsIGZpbGVuYW1lKSB7XG5cdFx0aWYgKCh0eXBlb2YgTWV0ZW9yLnVzZXJJZCgpID09PSAndW5kZWZpbmVkJykgfHwgKE1ldGVvci51c2VySWQoKSA9PT0gbnVsbCkpIHtcblx0XHRcdC8vbm9pbnNwZWN0aW9uIEpTVW5yZXNvbHZlZEZ1bmN0aW9uXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJyxcblx0XHRcdFx0e21ldGhvZDogJ3NuaXBwZXRNZXNzYWdlJ30pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLnJpZCB9KTtcblxuXHRcdGlmICgodHlwZW9mIHJvb20gPT09ICd1bmRlZmluZWQnKSB8fCAocm9vbSA9PT0gbnVsbCkpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoQXJyYXkuaXNBcnJheShyb29tLnVzZXJuYW1lcykgJiYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YoTWV0ZW9yLnVzZXIoKS51c2VybmFtZSkgPT09IC0xKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIElmIHdlIGtlZXAgaGlzdG9yeSBvZiBlZGl0cywgaW5zZXJ0IGEgbmV3IG1lc3NhZ2UgdG8gc3RvcmUgaGlzdG9yeSBpbmZvcm1hdGlvblxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWVzc2FnZV9LZWVwSGlzdG9yeScpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jbG9uZUFuZFNhdmVBc0hpc3RvcnlCeUlkKG1lc3NhZ2UuX2lkKTtcblx0XHR9XG5cblx0XHRjb25zdCBtZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cblx0XHRtZXNzYWdlLnNuaXBwZXRlZCA9IHRydWU7XG5cdFx0bWVzc2FnZS5zbmlwcGV0ZWRBdCA9IERhdGUubm93O1xuXHRcdG1lc3NhZ2Uuc25pcHBldGVkQnkgPSB7XG5cdFx0XHRfaWQ6IE1ldGVvci51c2VySWQoKSxcblx0XHRcdHVzZXJuYW1lOiBtZS51c2VybmFtZVxuXHRcdH07XG5cblx0XHRtZXNzYWdlID0gUm9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdiZWZvcmVTYXZlTWVzc2FnZScsIG1lc3NhZ2UpO1xuXG5cdFx0Ly8gQ3JlYXRlIHRoZSBTbmlwcGV0TWVzc2FnZVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFNuaXBwZXRlZEJ5SWRBbmRVc2VySWQobWVzc2FnZSwgZmlsZW5hbWUsIG1lc3NhZ2Uuc25pcHBldGVkQnksXG5cdFx0XHRtZXNzYWdlLnNuaXBwZXRlZCwgRGF0ZS5ub3csIGZpbGVuYW1lKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoXG5cdFx0XHQnbWVzc2FnZV9zbmlwcGV0ZWQnLCBtZXNzYWdlLnJpZCwgJycsIG1lLCB7XHQnc25pcHBldElkJzogbWVzc2FnZS5faWQsICdzbmlwcGV0TmFtZSc6IGZpbGVuYW1lIH0pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBDb29raWVzICovXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZSgnL3NuaXBwZXQvZG93bmxvYWQnLCBmdW5jdGlvbihyZXEsIHJlcykge1xuXHRsZXQgcmF3Q29va2llcztcblx0bGV0IHRva2VuO1xuXHRsZXQgdWlkO1xuXHRjb25zdCBjb29raWUgPSBuZXcgQ29va2llcygpO1xuXG5cdGlmIChyZXEuaGVhZGVycyAmJiByZXEuaGVhZGVycy5jb29raWUgIT09IG51bGwpIHtcblx0XHRyYXdDb29raWVzID0gcmVxLmhlYWRlcnMuY29va2llO1xuXHR9XG5cblx0aWYgKHJhd0Nvb2tpZXMgIT09IG51bGwpIHtcblx0XHR1aWQgPSBjb29raWUuZ2V0KCdyY191aWQnLCByYXdDb29raWVzKTtcblx0fVxuXG5cdGlmIChyYXdDb29raWVzICE9PSBudWxsKSB7XG5cdFx0dG9rZW4gPSBjb29raWUuZ2V0KCdyY190b2tlbicsIHJhd0Nvb2tpZXMpO1xuXHR9XG5cblx0aWYgKHVpZCA9PT0gbnVsbCkge1xuXHRcdHVpZCA9IHJlcS5xdWVyeS5yY191aWQ7XG5cdFx0dG9rZW4gPSByZXEucXVlcnkucmNfdG9rZW47XG5cdH1cblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWRBbmRMb2dpblRva2VuKHVpZCwgdG9rZW4pO1xuXG5cdGlmICghKHVpZCAmJiB0b2tlbiAmJiB1c2VyKSkge1xuXHRcdHJlcy53cml0ZUhlYWQoNDAzKTtcblx0XHRyZXMuZW5kKCk7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGNvbnN0IG1hdGNoID0gL15cXC8oW15cXC9dKylcXC8oLiopLy5leGVjKHJlcS51cmwpO1xuXG5cdGlmIChtYXRjaFsxXSkge1xuXHRcdGNvbnN0IHNuaXBwZXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lKFxuXHRcdFx0e1xuXHRcdFx0XHQnX2lkJzogbWF0Y2hbMV0sXG5cdFx0XHRcdCdzbmlwcGV0ZWQnOiB0cnVlXG5cdFx0XHR9XG5cdFx0KTtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7ICdfaWQnOiBzbmlwcGV0LnJpZCwgJ3VzZXJuYW1lcyc6IHsgJyRpbic6IFt1c2VyLnVzZXJuYW1lXSB9fSk7XG5cdFx0aWYgKHJvb20gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDMpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCBgYXR0YWNobWVudDsgZmlsZW5hbWUqPVVURi04JyckeyBlbmNvZGVVUklDb21wb25lbnQoc25pcHBldC5zbmlwcGV0TmFtZSkgfWApO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcblxuXHRcdC8vIFJlbW92aW5nIHRoZSBgYGAgY29udGFpbmVkIGluIHRoZSBtc2cuXG5cdFx0Y29uc3Qgc25pcHBldENvbnRlbnQgPSBzbmlwcGV0Lm1zZy5zdWJzdHIoMywgc25pcHBldC5tc2cubGVuZ3RoIC0gNik7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBzbmlwcGV0Q29udGVudC5sZW5ndGgpO1xuXHRcdHJlcy53cml0ZShzbmlwcGV0Q29udGVudCk7XG5cdFx0cmVzLmVuZCgpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0cmVzLmVuZCgpO1xuXHRyZXR1cm47XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdzbmlwcGV0ZWRNZXNzYWdlcycsIGZ1bmN0aW9uKHJpZCwgbGltaXQ9NTApIHtcblx0aWYgKHR5cGVvZiB0aGlzLnVzZXJJZCA9PT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy51c2VySWQgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3QgcHVibGljYXRpb24gPSB0aGlzO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cblx0aWYgKHR5cGVvZiB1c2VyID09PSAndW5kZWZpbmVkJyB8fCB1c2VyID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGNvbnN0IGN1cnNvckhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRTbmlwcGV0ZWRCeVJvb20oXG5cdFx0cmlkLFxuXHRcdHtcblx0XHRcdHNvcnQ6IHt0czogLTF9LFxuXHRcdFx0bGltaXRcblx0XHR9XG5cdCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRwdWJsaWNhdGlvbi5hZGRlZCgncm9ja2V0Y2hhdF9zbmlwcGV0ZWRfbWVzc2FnZScsIF9pZCwgcmVjb3JkKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoX2lkLCByZWNvcmQpIHtcblx0XHRcdHB1YmxpY2F0aW9uLmNoYW5nZWQoJ3JvY2tldGNoYXRfc25pcHBldGVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKF9pZCkge1xuXHRcdFx0cHVibGljYXRpb24ucmVtb3ZlZCgncm9ja2V0Y2hhdF9zbmlwcGV0ZWRfbWVzc2FnZScsIF9pZCk7XG5cdFx0fVxuXHR9KTtcblx0dGhpcy5yZWFkeSgpO1xuXG5cdHRoaXMub25TdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0Y3Vyc29ySGFuZGxlLnN0b3AoKTtcblx0fTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ3NuaXBwZXRlZE1lc3NhZ2UnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKHR5cGVvZiB0aGlzLnVzZXJJZCA9PT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy51c2VySWQgPT09IG51bGwpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3Qgc25pcHBldCA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmUoe19pZCwgc25pcHBldGVkOiB0cnVlfSk7XG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cdGNvbnN0IHJvb21TbmlwcGV0UXVlcnkgPSB7XG5cdFx0J19pZCc6IHNuaXBwZXQucmlkLFxuXHRcdCd1c2VybmFtZXMnOiB7XG5cdFx0XHQnJGluJzogW1xuXHRcdFx0XHR1c2VyLnVzZXJuYW1lXG5cdFx0XHRdXG5cdFx0fVxuXHR9O1xuXG5cdGlmIChSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHJvb21TbmlwcGV0UXVlcnkpID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0Y29uc3QgcHVibGljYXRpb24gPSB0aGlzO1xuXG5cblx0aWYgKHR5cGVvZiB1c2VyID09PSAndW5kZWZpbmVkJyB8fCB1c2VyID09PSBudWxsKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGNvbnN0IGN1cnNvciA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmQoXG5cdFx0eyBfaWQgfVxuXHQpLm9ic2VydmVDaGFuZ2VzKHtcblx0XHRhZGRlZChfaWQsIHJlY29yZCkge1xuXHRcdFx0cHVibGljYXRpb24uYWRkZWQoJ3JvY2tldGNoYXRfc25pcHBldGVkX21lc3NhZ2UnLCBfaWQsIHJlY29yZCk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKF9pZCwgcmVjb3JkKSB7XG5cdFx0XHRwdWJsaWNhdGlvbi5jaGFuZ2VkKCdyb2NrZXRjaGF0X3NuaXBwZXRlZF9tZXNzYWdlJywgX2lkLCByZWNvcmQpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChfaWQpIHtcblx0XHRcdHB1YmxpY2F0aW9uLnJlbW92ZWQoJ3JvY2tldGNoYXRfc25pcHBldGVkX21lc3NhZ2UnLCBfaWQpO1xuXHRcdH1cblx0fSk7XG5cblx0dGhpcy5yZWFkeSgpO1xuXG5cdHRoaXMub25TdG9wID0gZnVuY3Rpb24oKSB7XG5cdFx0Y3Vyc29yLnN0b3AoKTtcblx0fTtcbn0pO1xuIl19
