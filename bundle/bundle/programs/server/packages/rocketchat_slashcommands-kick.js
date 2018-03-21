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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-kick":{"server":{"server.js":function(){

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/rocketchat_slashcommands-kick/server/server.js                   //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
// Kick is a named function that will replace /kick commands
const Kick = function (command, params, {
  rid
}) {
  if (command !== 'kick' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const user = Meteor.users.findOne(Meteor.userId());
  const kickedUser = RocketChat.models.Users.findOneByUsername(username);
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (kickedUser == null) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  if ((room.usernames || []).includes(username) === false) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  Meteor.call('removeUserFromRoom', {
    rid,
    username
  });
};

RocketChat.slashCommands.add('kick', Kick, {
  description: 'Remove_someone_from_room',
  params: '@username',
  permission: 'remove-user'
});
///////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-kick/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-kick");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-kick.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWtpY2svc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJLaWNrIiwiY29tbWFuZCIsInBhcmFtcyIsInJpZCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsInVzZXJuYW1lIiwidHJpbSIsInJlcGxhY2UiLCJ1c2VyIiwiTWV0ZW9yIiwidXNlcnMiLCJmaW5kT25lIiwidXNlcklkIiwia2lja2VkVXNlciIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJVc2VycyIsImZpbmRPbmVCeVVzZXJuYW1lIiwicm9vbSIsIlJvb21zIiwiZmluZE9uZUJ5SWQiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5VXNlciIsIl9pZCIsIlJhbmRvbSIsImlkIiwidHMiLCJEYXRlIiwibXNnIiwiVEFQaTE4biIsIl9fIiwicG9zdFByb2Nlc3MiLCJzcHJpbnRmIiwibGFuZ3VhZ2UiLCJ1c2VybmFtZXMiLCJpbmNsdWRlcyIsImNhbGwiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiZGVzY3JpcHRpb24iLCJwZXJtaXNzaW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTtBQUVBLE1BQU1BLE9BQU8sVUFBU0MsT0FBVCxFQUFrQkMsTUFBbEIsRUFBMEI7QUFBQ0M7QUFBRCxDQUExQixFQUFpQztBQUM3QyxNQUFJRixZQUFZLE1BQVosSUFBc0IsQ0FBQ0csTUFBTUMsSUFBTixDQUFXSCxNQUFYLEVBQW1CSSxNQUFuQixDQUEzQixFQUF1RDtBQUN0RDtBQUNBOztBQUNELFFBQU1DLFdBQVdMLE9BQU9NLElBQVAsR0FBY0MsT0FBZCxDQUFzQixHQUF0QixFQUEyQixFQUEzQixDQUFqQjs7QUFDQSxNQUFJRixhQUFhLEVBQWpCLEVBQXFCO0FBQ3BCO0FBQ0E7O0FBQ0QsUUFBTUcsT0FBT0MsT0FBT0MsS0FBUCxDQUFhQyxPQUFiLENBQXFCRixPQUFPRyxNQUFQLEVBQXJCLENBQWI7QUFDQSxRQUFNQyxhQUFhQyxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsaUJBQXhCLENBQTBDWixRQUExQyxDQUFuQjtBQUNBLFFBQU1hLE9BQU9KLFdBQVdDLE1BQVgsQ0FBa0JJLEtBQWxCLENBQXdCQyxXQUF4QixDQUFvQ25CLEdBQXBDLENBQWI7O0FBQ0EsTUFBSVksY0FBYyxJQUFsQixFQUF3QjtBQUN2QixXQUFPQyxXQUFXTyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ2IsT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUN0RVcsV0FBS0MsT0FBT0MsRUFBUCxFQURpRTtBQUV0RXhCLFNBRnNFO0FBR3RFeUIsVUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsdUJBQVgsRUFBb0M7QUFDeENDLHFCQUFhLFNBRDJCO0FBRXhDQyxpQkFBUyxDQUFDM0IsUUFBRDtBQUYrQixPQUFwQyxFQUdGRyxLQUFLeUIsUUFISDtBQUppRSxLQUFoRSxDQUFQO0FBU0E7O0FBQ0QsTUFBSSxDQUFDZixLQUFLZ0IsU0FBTCxJQUFrQixFQUFuQixFQUF1QkMsUUFBdkIsQ0FBZ0M5QixRQUFoQyxNQUE4QyxLQUFsRCxFQUF5RDtBQUN4RCxXQUFPUyxXQUFXTyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ2IsT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUN0RVcsV0FBS0MsT0FBT0MsRUFBUCxFQURpRTtBQUV0RXhCLFNBRnNFO0FBR3RFeUIsVUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsOEJBQVgsRUFBMkM7QUFDL0NDLHFCQUFhLFNBRGtDO0FBRS9DQyxpQkFBUyxDQUFDM0IsUUFBRDtBQUZzQyxPQUEzQyxFQUdGRyxLQUFLeUIsUUFISDtBQUppRSxLQUFoRSxDQUFQO0FBU0E7O0FBQ0R4QixTQUFPMkIsSUFBUCxDQUFZLG9CQUFaLEVBQWtDO0FBQUNuQyxPQUFEO0FBQU1JO0FBQU4sR0FBbEM7QUFDQSxDQWxDRDs7QUFvQ0FTLFdBQVd1QixhQUFYLENBQXlCQyxHQUF6QixDQUE2QixNQUE3QixFQUFxQ3hDLElBQXJDLEVBQTJDO0FBQzFDeUMsZUFBYSwwQkFENkI7QUFFMUN2QyxVQUFRLFdBRmtDO0FBRzFDd0MsY0FBWTtBQUg4QixDQUEzQyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NsYXNoY29tbWFuZHMta2ljay5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gS2ljayBpcyBhIG5hbWVkIGZ1bmN0aW9uIHRoYXQgd2lsbCByZXBsYWNlIC9raWNrIGNvbW1hbmRzXG5cbmNvbnN0IEtpY2sgPSBmdW5jdGlvbihjb21tYW5kLCBwYXJhbXMsIHtyaWR9KSB7XG5cdGlmIChjb21tYW5kICE9PSAna2ljaycgfHwgIU1hdGNoLnRlc3QocGFyYW1zLCBTdHJpbmcpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IHVzZXJuYW1lID0gcGFyYW1zLnRyaW0oKS5yZXBsYWNlKCdAJywgJycpO1xuXHRpZiAodXNlcm5hbWUgPT09ICcnKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXHRjb25zdCBraWNrZWRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblx0aWYgKGtpY2tlZFVzZXIgPT0gbnVsbCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcm5hbWVfZG9lc250X2V4aXN0Jywge1xuXHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRzcHJpbnRmOiBbdXNlcm5hbWVdXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHRcdH0pO1xuXHR9XG5cdGlmICgocm9vbS51c2VybmFtZXMgfHwgW10pLmluY2x1ZGVzKHVzZXJuYW1lKSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2lzX25vdF9pbl90aGlzX3Jvb20nLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFt1c2VybmFtZV1cblx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0fSk7XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ3JlbW92ZVVzZXJGcm9tUm9vbScsIHtyaWQsIHVzZXJuYW1lfSk7XG59O1xuXG5Sb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuYWRkKCdraWNrJywgS2ljaywge1xuXHRkZXNjcmlwdGlvbjogJ1JlbW92ZV9zb21lb25lX2Zyb21fcm9vbScsXG5cdHBhcmFtczogJ0B1c2VybmFtZScsXG5cdHBlcm1pc3Npb246ICdyZW1vdmUtdXNlcidcbn0pO1xuIl19
