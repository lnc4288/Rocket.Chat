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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-mute":{"server":{"mute.js":function(){

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/rocketchat_slashcommands-mute/server/mute.js                        //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
/*
* Mute is a named function that will replace /mute commands
*/
RocketChat.slashCommands.add('mute', function Mute(command, params, item) {
  if (command !== 'mute' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const user = Meteor.users.findOne(Meteor.userId());
  const mutedUser = RocketChat.models.Users.findOneByUsername(username);
  const room = RocketChat.models.Rooms.findOneById(item.rid);

  if (mutedUser == null) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_doesnt_exist', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
    return;
  }

  if ((room.usernames || []).includes(username) === false) {
    RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
    return;
  }

  Meteor.call('muteUserInRoom', {
    rid: item.rid,
    username
  });
}, {
  description: 'Mute_someone_in_room',
  params: '@username'
});
//////////////////////////////////////////////////////////////////////////////////

},"unmute.js":function(){

//////////////////////////////////////////////////////////////////////////////////
//                                                                              //
// packages/rocketchat_slashcommands-mute/server/unmute.js                      //
//                                                                              //
//////////////////////////////////////////////////////////////////////////////////
                                                                                //
/*
* Unmute is a named function that will replace /unmute commands
*/
RocketChat.slashCommands.add('unmute', function Unmute(command, params, item) {
  if (command !== 'unmute' || !Match.test(params, String)) {
    return;
  }

  const username = params.trim().replace('@', '');

  if (username === '') {
    return;
  }

  const user = Meteor.users.findOne(Meteor.userId());
  const unmutedUser = RocketChat.models.Users.findOneByUsername(username);
  const room = RocketChat.models.Rooms.findOneById(item.rid);

  if (unmutedUser == null) {
    return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
      _id: Random.id(),
      rid: item.rid,
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
      rid: item.rid,
      ts: new Date(),
      msg: TAPi18n.__('Username_is_not_in_this_room', {
        postProcess: 'sprintf',
        sprintf: [username]
      }, user.language)
    });
  }

  Meteor.call('unmuteUserInRoom', {
    rid: item.rid,
    username
  });
}, {
  description: 'Unmute_someone_in_room',
  params: '@username'
});
//////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-mute/server/mute.js");
require("/node_modules/meteor/rocketchat:slashcommands-mute/server/unmute.js");

/* Exports */
Package._define("rocketchat:slashcommands-mute");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-mute.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLW11dGUvc2VydmVyL211dGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhc2hjb21tYW5kcy1tdXRlL3NlcnZlci91bm11dGUuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsInNsYXNoQ29tbWFuZHMiLCJhZGQiLCJNdXRlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJNYXRjaCIsInRlc3QiLCJTdHJpbmciLCJ1c2VybmFtZSIsInRyaW0iLCJyZXBsYWNlIiwidXNlciIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInVzZXJJZCIsIm11dGVkVXNlciIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJyb29tIiwiUm9vbXMiLCJmaW5kT25lQnlJZCIsInJpZCIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInVzZXJuYW1lcyIsImluY2x1ZGVzIiwiY2FsbCIsImRlc2NyaXB0aW9uIiwiVW5tdXRlIiwidW5tdXRlZFVzZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOzs7QUFJQUEsV0FBV0MsYUFBWCxDQUF5QkMsR0FBekIsQ0FBNkIsTUFBN0IsRUFBcUMsU0FBU0MsSUFBVCxDQUFjQyxPQUFkLEVBQXVCQyxNQUF2QixFQUErQkMsSUFBL0IsRUFBcUM7QUFDekUsTUFBSUYsWUFBWSxNQUFaLElBQXNCLENBQUNHLE1BQU1DLElBQU4sQ0FBV0gsTUFBWCxFQUFtQkksTUFBbkIsQ0FBM0IsRUFBdUQ7QUFDdEQ7QUFDQTs7QUFDRCxRQUFNQyxXQUFXTCxPQUFPTSxJQUFQLEdBQWNDLE9BQWQsQ0FBc0IsR0FB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RUFBZ0U7QUFDdEVXLFdBQUtDLE9BQU9DLEVBQVAsRUFEaUU7QUFFdEVMLFdBQUtuQixLQUFLbUIsR0FGNEQ7QUFHdEVNLFVBQUksSUFBSUMsSUFBSixFQUhrRTtBQUl0RUMsV0FBS0MsUUFBUUMsRUFBUixDQUFXLHVCQUFYLEVBQW9DO0FBQ3hDQyxxQkFBYSxTQUQyQjtBQUV4Q0MsaUJBQVMsQ0FBQzNCLFFBQUQ7QUFGK0IsT0FBcEMsRUFHRkcsS0FBS3lCLFFBSEg7QUFKaUUsS0FBaEUsQ0FBUDtBQVNBOztBQUNELE1BQUksQ0FBQ2hCLEtBQUtpQixTQUFMLElBQWtCLEVBQW5CLEVBQXVCQyxRQUF2QixDQUFnQzlCLFFBQWhDLE1BQThDLEtBQWxELEVBQXlEO0FBQ3hELFdBQU9WLFdBQVcwQixhQUFYLENBQXlCQyxVQUF6QixDQUFvQ2IsT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUN0RVcsV0FBS0MsT0FBT0MsRUFBUCxFQURpRTtBQUV0RUwsV0FBS25CLEtBQUttQixHQUY0RDtBQUd0RU0sVUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxXQUFLQyxRQUFRQyxFQUFSLENBQVcsOEJBQVgsRUFBMkM7QUFDL0NDLHFCQUFhLFNBRGtDO0FBRS9DQyxpQkFBUyxDQUFDM0IsUUFBRDtBQUZzQyxPQUEzQyxFQUdGRyxLQUFLeUIsUUFISDtBQUppRSxLQUFoRSxDQUFQO0FBU0E7O0FBQ0R4QixTQUFPMkIsSUFBUCxDQUFZLGtCQUFaLEVBQWdDO0FBQy9CaEIsU0FBS25CLEtBQUttQixHQURxQjtBQUUvQmY7QUFGK0IsR0FBaEM7QUFJQSxDQXRDRCxFQXNDRztBQUNGZ0MsZUFBYSx3QkFEWDtBQUVGckMsVUFBUTtBQUZOLENBdENILEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc2xhc2hjb21tYW5kcy1tdXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4vKlxuKiBNdXRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL211dGUgY29tbWFuZHNcbiovXG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ211dGUnLCBmdW5jdGlvbiBNdXRlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCAhPT0gJ211dGUnIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCB1c2VybmFtZSA9IHBhcmFtcy50cmltKCkucmVwbGFjZSgnQCcsICcnKTtcblx0aWYgKHVzZXJuYW1lID09PSAnJykge1xuXHRcdHJldHVybjtcblx0fVxuXHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoTWV0ZW9yLnVzZXJJZCgpKTtcblx0Y29uc3QgbXV0ZWRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoaXRlbS5yaWQpO1xuXHRpZiAobXV0ZWRVc2VyID09IG51bGwpIHtcblx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2RvZXNudF9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKChyb29tLnVzZXJuYW1lcyB8fCBbXSkuaW5jbHVkZXModXNlcm5hbWUpID09PSBmYWxzZSkge1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcm5hbWVfaXNfbm90X2luX3RoaXNfcm9vbScsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0XHRyZXR1cm47XG5cdH1cblx0TWV0ZW9yLmNhbGwoJ211dGVVc2VySW5Sb29tJywge1xuXHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0dXNlcm5hbWVcblx0fSk7XG59LCB7XG5cdGRlc2NyaXB0aW9uOiAnTXV0ZV9zb21lb25lX2luX3Jvb20nLFxuXHRwYXJhbXM6ICdAdXNlcm5hbWUnXG59KTtcbiIsIlxuLypcbiogVW5tdXRlIGlzIGEgbmFtZWQgZnVuY3Rpb24gdGhhdCB3aWxsIHJlcGxhY2UgL3VubXV0ZSBjb21tYW5kc1xuKi9cblxuUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmFkZCgndW5tdXRlJywgZnVuY3Rpb24gVW5tdXRlKGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXG5cdGlmIChjb21tYW5kICE9PSAndW5tdXRlJyB8fCAhTWF0Y2gudGVzdChwYXJhbXMsIFN0cmluZykpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlcm5hbWUgPSBwYXJhbXMudHJpbSgpLnJlcGxhY2UoJ0AnLCAnJyk7XG5cdGlmICh1c2VybmFtZSA9PT0gJycpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKE1ldGVvci51c2VySWQoKSk7XG5cdGNvbnN0IHVubXV0ZWRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoaXRlbS5yaWQpO1xuXHRpZiAodW5tdXRlZFVzZXIgPT0gbnVsbCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHR0czogbmV3IERhdGUsXG5cdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1VzZXJuYW1lX2RvZXNudF9leGlzdCcsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0fVxuXHRpZiAoKHJvb20udXNlcm5hbWVzIHx8IFtdKS5pbmNsdWRlcyh1c2VybmFtZSkgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlVc2VyKE1ldGVvci51c2VySWQoKSwgJ21lc3NhZ2UnLCB7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdHRzOiBuZXcgRGF0ZSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcm5hbWVfaXNfbm90X2luX3RoaXNfcm9vbScsIHtcblx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0c3ByaW50ZjogW3VzZXJuYW1lXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0fVxuXHRNZXRlb3IuY2FsbCgndW5tdXRlVXNlckluUm9vbScsIHtcblx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdHVzZXJuYW1lXG5cdH0pO1xufSwge1xuXHRkZXNjcmlwdGlvbjogJ1VubXV0ZV9zb21lb25lX2luX3Jvb20nLFxuXHRwYXJhbXM6ICdAdXNlcm5hbWUnXG59KTtcbiJdfQ==
