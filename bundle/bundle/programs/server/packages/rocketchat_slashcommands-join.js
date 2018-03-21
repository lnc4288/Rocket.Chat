(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-join":{"server":{"server.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/rocketchat_slashcommands-join/server/server.js                                   //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
/*
* Join is a named function that will replace /join commands
* @param {Object} message - The message object
*/
RocketChat.slashCommands.add('join', function Join(command, params, item) {
  if (command !== 'join' || !Match.test(params, String)) {
    return;
  }

  let channel = params.trim();

  if (channel === '') {
    return;
  }

  channel = channel.replace('#', '');
  const user = Meteor.users.findOne(Meteor.userId());
  const room = RocketChat.models.Rooms.findOneByNameAndType(channel, 'c');

  if (!room) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Channel_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [channel]
      }, user.language)
    });
  }

  if (room.usernames.includes(user.username)) {
    throw new Meteor.Error('error-user-already-in-room', 'You are already in the channel', {
      method: 'slashCommands'
    });
  }

  Meteor.call('joinRoom', room._id);
}, {
  description: 'Join_the_given_channel',
  params: '#channel'
});
///////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-join/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-join");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-join.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWpvaW4vc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2xhc2hDb21tYW5kcyIsImFkZCIsIkpvaW4iLCJjb21tYW5kIiwicGFyYW1zIiwiaXRlbSIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsImNoYW5uZWwiLCJ0cmltIiwicmVwbGFjZSIsInVzZXIiLCJNZXRlb3IiLCJ1c2VycyIsImZpbmRPbmUiLCJ1c2VySWQiLCJyb29tIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lQW5kVHlwZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJyaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInVzZXJuYW1lcyIsImluY2x1ZGVzIiwidXNlcm5hbWUiLCJFcnJvciIsIm1ldGhvZCIsImNhbGwiLCJkZXNjcmlwdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7Ozs7QUFNQUEsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUMsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQXVCQyxNQUF2QixFQUErQkMsSUFBL0IsRUFBcUM7QUFFekUsTUFBSUYsWUFBWSxNQUFaLElBQXNCLENBQUNHLE1BQU1DLElBQU4sQ0FBV0gsTUFBWCxFQUFtQkksTUFBbkIsQ0FBM0IsRUFBdUQ7QUFDdEQ7QUFDQTs7QUFDRCxNQUFJQyxVQUFVTCxPQUFPTSxJQUFQLEVBQWQ7O0FBQ0EsTUFBSUQsWUFBWSxFQUFoQixFQUFvQjtBQUNuQjtBQUNBOztBQUNEQSxZQUFVQSxRQUFRRSxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEVBQXJCLENBQVY7QUFDQSxRQUFNQyxPQUFPQyxPQUFPQyxLQUFQLENBQWFDLE9BQWIsQ0FBcUJGLE9BQU9HLE1BQVAsRUFBckIsQ0FBYjtBQUNBLFFBQU1DLE9BQU9sQixXQUFXbUIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLG9CQUF4QixDQUE2Q1gsT0FBN0MsRUFBc0QsR0FBdEQsQ0FBYjs7QUFDQSxNQUFJLENBQUNRLElBQUwsRUFBVztBQUNWbEIsZUFBV3NCLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DVCxPQUFPRyxNQUFQLEVBQXBDLEVBQXFELFNBQXJELEVBQWdFO0FBQy9ETyxXQUFLQyxPQUFPQyxFQUFQLEVBRDBEO0FBRS9EQyxXQUFLckIsS0FBS3FCLEdBRnFEO0FBRy9EQyxVQUFJLElBQUlDLElBQUosRUFIMkQ7QUFJL0RDLFdBQUtDLFFBQVFDLEVBQVIsQ0FBVyxzQkFBWCxFQUFtQztBQUN2Q0MscUJBQWEsU0FEMEI7QUFFdkNDLGlCQUFTLENBQUN4QixPQUFEO0FBRjhCLE9BQW5DLEVBR0ZHLEtBQUtzQixRQUhIO0FBSjBELEtBQWhFO0FBU0E7O0FBQ0QsTUFBSWpCLEtBQUtrQixTQUFMLENBQWVDLFFBQWYsQ0FBd0J4QixLQUFLeUIsUUFBN0IsQ0FBSixFQUE0QztBQUMzQyxVQUFNLElBQUl4QixPQUFPeUIsS0FBWCxDQUFpQiw0QkFBakIsRUFBK0MsZ0NBQS9DLEVBQWlGO0FBQ3RGQyxjQUFRO0FBRDhFLEtBQWpGLENBQU47QUFHQTs7QUFDRDFCLFNBQU8yQixJQUFQLENBQVksVUFBWixFQUF3QnZCLEtBQUtNLEdBQTdCO0FBQ0EsQ0E3QkQsRUE2Qkc7QUFDRmtCLGVBQWEsd0JBRFg7QUFFRnJDLFVBQVE7QUFGTixDQTdCSCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NsYXNoY29tbWFuZHMtam9pbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLypcbiogSm9pbiBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9qb2luIGNvbW1hbmRzXG4qIEBwYXJhbSB7T2JqZWN0fSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2Ugb2JqZWN0XG4qL1xuXG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2pvaW4nLCBmdW5jdGlvbiBKb2luKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXG5cdGlmIChjb21tYW5kICE9PSAnam9pbicgfHwgIU1hdGNoLnRlc3QocGFyYW1zLCBTdHJpbmcpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGxldCBjaGFubmVsID0gcGFyYW1zLnRyaW0oKTtcblx0aWYgKGNoYW5uZWwgPT09ICcnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNoYW5uZWwgPSBjaGFubmVsLnJlcGxhY2UoJyMnLCAnJyk7XG5cdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5TmFtZUFuZFR5cGUoY2hhbm5lbCwgJ2MnKTtcblx0aWYgKCFyb29tKSB7XG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0dHM6IG5ldyBEYXRlLFxuXHRcdFx0bXNnOiBUQVBpMThuLl9fKCdDaGFubmVsX2RvZXNudF9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdH0pO1xuXHR9XG5cdGlmIChyb29tLnVzZXJuYW1lcy5pbmNsdWRlcyh1c2VyLnVzZXJuYW1lKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItYWxyZWFkeS1pbi1yb29tJywgJ1lvdSBhcmUgYWxyZWFkeSBpbiB0aGUgY2hhbm5lbCcsIHtcblx0XHRcdG1ldGhvZDogJ3NsYXNoQ29tbWFuZHMnXG5cdFx0fSk7XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ2pvaW5Sb29tJywgcm9vbS5faWQpO1xufSwge1xuXHRkZXNjcmlwdGlvbjogJ0pvaW5fdGhlX2dpdmVuX2NoYW5uZWwnLFxuXHRwYXJhbXM6ICcjY2hhbm5lbCdcbn0pO1xuIl19
