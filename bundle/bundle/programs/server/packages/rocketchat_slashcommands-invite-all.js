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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slashcommands-invite-all":{"server":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_slashcommands-invite-all/server/server.js                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/*
 * Invite is a named function that will replace /invite commands
 * @param {Object} message - The message object
 */
function inviteAll(type) {
  return function inviteAll(command, params, item) {
    if (!/invite\-all-(to|from)/.test(command) || !Match.test(params, String)) {
      return;
    }

    const regexp = /#?([\d-_\w]+)/g;
    const [, channel] = regexp.exec(params.trim());

    if (!channel) {
      return;
    }

    const currentUser = Meteor.users.findOne(Meteor.userId());
    const baseChannel = type === 'to' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);
    const targetChannel = type === 'from' ? RocketChat.models.Rooms.findOneById(item.rid) : RocketChat.models.Rooms.findOneByName(channel);

    if (!baseChannel) {
      return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Channel_doesnt_exist', {
          postProcess: 'sprintf',
          sprintf: [channel]
        }, currentUser.language)
      });
    }

    const users = baseChannel.usernames || [];

    try {
      if (users.length > RocketChat.settings.get('API_User_Limit')) {
        throw new Meteor.Error('error-user-limit-exceeded', 'User Limit Exceeded', {
          method: 'addAllToRoom'
        });
      }

      if (!targetChannel && ['c', 'p'].indexOf(baseChannel.t) > -1) {
        Meteor.call(baseChannel.t === 'c' ? 'createChannel' : 'createPrivateGroup', channel, users);
        RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
          _id: Random.id(),
          rid: item.rid,
          ts: new Date(),
          msg: TAPi18n.__('Channel_created', {
            postProcess: 'sprintf',
            sprintf: [channel]
          }, currentUser.language)
        });
      } else {
        Meteor.call('addUsersToRoom', {
          rid: targetChannel._id,
          users
        });
      }

      return RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__('Users_added', null, currentUser.language)
      });
    } catch (e) {
      const msg = e.error === 'cant-invite-for-direct-room' ? 'Cannot_invite_users_to_direct_rooms' : e.error;
      RocketChat.Notifications.notifyUser(Meteor.userId(), 'message', {
        _id: Random.id(),
        rid: item.rid,
        ts: new Date(),
        msg: TAPi18n.__(msg, null, currentUser.language)
      });
    }
  };
}

RocketChat.slashCommands.add('invite-all-to', inviteAll('to'), {
  description: 'Invite_user_to_join_channel_all_to',
  params: '#room'
});
RocketChat.slashCommands.add('invite-all-from', inviteAll('from'), {
  description: 'Invite_user_to_join_channel_all_from',
  params: '#room'
});
module.exports = inviteAll;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slashcommands-invite-all/server/server.js");

/* Exports */
Package._define("rocketchat:slashcommands-invite-all");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slashcommands-invite-all.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFzaGNvbW1hbmRzLWludml0ZS1hbGwvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJpbnZpdGVBbGwiLCJ0eXBlIiwiY29tbWFuZCIsInBhcmFtcyIsIml0ZW0iLCJ0ZXN0IiwiTWF0Y2giLCJTdHJpbmciLCJyZWdleHAiLCJjaGFubmVsIiwiZXhlYyIsInRyaW0iLCJjdXJyZW50VXNlciIsIk1ldGVvciIsInVzZXJzIiwiZmluZE9uZSIsInVzZXJJZCIsImJhc2VDaGFubmVsIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlJvb21zIiwiZmluZE9uZUJ5SWQiLCJyaWQiLCJmaW5kT25lQnlOYW1lIiwidGFyZ2V0Q2hhbm5lbCIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlVc2VyIiwiX2lkIiwiUmFuZG9tIiwiaWQiLCJ0cyIsIkRhdGUiLCJtc2ciLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInVzZXJuYW1lcyIsImxlbmd0aCIsInNldHRpbmdzIiwiZ2V0IiwiRXJyb3IiLCJtZXRob2QiLCJpbmRleE9mIiwidCIsImNhbGwiLCJlIiwiZXJyb3IiLCJzbGFzaENvbW1hbmRzIiwiYWRkIiwiZGVzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7OztBQUtBLFNBQVNBLFNBQVQsQ0FBbUJDLElBQW5CLEVBQXlCO0FBQ3hCLFNBQU8sU0FBU0QsU0FBVCxDQUFtQkUsT0FBbkIsRUFBNEJDLE1BQTVCLEVBQW9DQyxJQUFwQyxFQUEwQztBQUVoRCxRQUFJLENBQUMsd0JBQXdCQyxJQUF4QixDQUE2QkgsT0FBN0IsQ0FBRCxJQUEwQyxDQUFDSSxNQUFNRCxJQUFOLENBQVdGLE1BQVgsRUFBbUJJLE1BQW5CLENBQS9DLEVBQTJFO0FBQzFFO0FBQ0E7O0FBRUQsVUFBTUMs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RDtBQUd0RVEsWUFBSSxJQUFJQyxJQUFKLEVBSGtFO0FBSXRFQyxhQUFLQyxRQUFRQyxFQUFSLENBQVcsYUFBWCxFQUEwQixJQUExQixFQUFnQ3RCLFlBQVl5QixRQUE1QztBQUppRSxPQUFoRSxDQUFQO0FBTUEsS0E5QkQsQ0E4QkUsT0FBT1UsQ0FBUCxFQUFVO0FBQ1gsWUFBTWYsTUFBTWUsRUFBRUMsS0FBRixLQUFZLDZCQUFaLEdBQTRDLHFDQUE1QyxHQUFvRkQsRUFBRUMsS0FBbEc7QUFDQTlCLGlCQUFXTyxhQUFYLENBQXlCQyxVQUF6QixDQUFvQ2IsT0FBT0csTUFBUCxFQUFwQyxFQUFxRCxTQUFyRCxFQUFnRTtBQUMvRFcsYUFBS0MsT0FBT0MsRUFBUCxFQUQwRDtBQUUvRFAsYUFBS2xCLEtBQUtrQixHQUZxRDtBQUcvRFEsWUFBSSxJQUFJQyxJQUFKLEVBSDJEO0FBSS9EQyxhQUFLQyxRQUFRQyxFQUFSLENBQVdGLEdBQVgsRUFBZ0IsSUFBaEIsRUFBc0JwQixZQUFZeUIsUUFBbEM7QUFKMEQsT0FBaEU7QUFNQTtBQUNELEdBckVEO0FBc0VBOztBQUVEbkIsV0FBVytCLGFBQVgsQ0FBeUJDLEdBQXpCLENBQTZCLGVBQTdCLEVBQThDbEQsVUFBVSxJQUFWLENBQTlDLEVBQStEO0FBQzlEbUQsZUFBYSxvQ0FEaUQ7QUFFOURoRCxVQUFRO0FBRnNELENBQS9EO0FBSUFlLFdBQVcrQixhQUFYLENBQXlCQyxHQUF6QixDQUE2QixpQkFBN0IsRUFBZ0RsRCxVQUFVLE1BQVYsQ0FBaEQsRUFBbUU7QUFDbEVtRCxlQUFhLHNDQURxRDtBQUVsRWhELFVBQVE7QUFGMEQsQ0FBbkU7QUFJQWlELE9BQU9DLE9BQVAsR0FBaUJyRCxTQUFqQixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X3NsYXNoY29tbWFuZHMtaW52aXRlLWFsbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBJbnZpdGUgaXMgYSBuYW1lZCBmdW5jdGlvbiB0aGF0IHdpbGwgcmVwbGFjZSAvaW52aXRlIGNvbW1hbmRzXG4gKiBAcGFyYW0ge09iamVjdH0gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIG9iamVjdFxuICovXG5cbmZ1bmN0aW9uIGludml0ZUFsbCh0eXBlKSB7XG5cdHJldHVybiBmdW5jdGlvbiBpbnZpdGVBbGwoY29tbWFuZCwgcGFyYW1zLCBpdGVtKSB7XG5cblx0XHRpZiAoIS9pbnZpdGVcXC1hbGwtKHRvfGZyb20pLy50ZXN0KGNvbW1hbmQpIHx8ICFNYXRjaC50ZXN0KHBhcmFtcywgU3RyaW5nKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlZ2V4cCA9IC8jPyhbXFxkLV9cXHddKykvZztcblx0XHRjb25zdCBbLCBjaGFubmVsXSA9IHJlZ2V4cC5leGVjKHBhcmFtcy50cmltKCkpO1xuXG5cdFx0aWYgKCFjaGFubmVsKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgY3VycmVudFVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShNZXRlb3IudXNlcklkKCkpO1xuXHRcdGNvbnN0IGJhc2VDaGFubmVsID0gdHlwZSA9PT0gJ3RvJyA/IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGl0ZW0ucmlkKSA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbCk7XG5cdFx0Y29uc3QgdGFyZ2V0Q2hhbm5lbCA9IHR5cGUgPT09ICdmcm9tJyA/IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGl0ZW0ucmlkKSA6IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbCk7XG5cblx0XHRpZiAoIWJhc2VDaGFubmVsKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnQ2hhbm5lbF9kb2VzbnRfZXhpc3QnLCB7XG5cdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRzcHJpbnRmOiBbY2hhbm5lbF1cblx0XHRcdFx0fSwgY3VycmVudFVzZXIubGFuZ3VhZ2UpXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0Y29uc3QgdXNlcnMgPSBiYXNlQ2hhbm5lbC51c2VybmFtZXMgfHwgW107XG5cblx0XHR0cnkge1xuXHRcdFx0aWYgKHVzZXJzLmxlbmd0aCA+IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfVXNlcl9MaW1pdCcpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXVzZXItbGltaXQtZXhjZWVkZWQnLCAnVXNlciBMaW1pdCBFeGNlZWRlZCcsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdhZGRBbGxUb1Jvb20nXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRhcmdldENoYW5uZWwgJiYgWydjJywgJ3AnXS5pbmRleE9mKGJhc2VDaGFubmVsLnQpID4gLTEpIHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoYmFzZUNoYW5uZWwudCA9PT0gJ2MnID8gJ2NyZWF0ZUNoYW5uZWwnIDogJ2NyZWF0ZVByaXZhdGVHcm91cCcsIGNoYW5uZWwsIHVzZXJzKTtcblx0XHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKCdDaGFubmVsX2NyZWF0ZWQnLCB7XG5cdFx0XHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHRcdFx0fSwgY3VycmVudFVzZXIubGFuZ3VhZ2UpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2FkZFVzZXJzVG9Sb29tJywge1xuXHRcdFx0XHRcdHJpZDogdGFyZ2V0Q2hhbm5lbC5faWQsXG5cdFx0XHRcdFx0dXNlcnNcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVVzZXIoTWV0ZW9yLnVzZXJJZCgpLCAnbWVzc2FnZScsIHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdG1zZzogVEFQaTE4bi5fXygnVXNlcnNfYWRkZWQnLCBudWxsLCBjdXJyZW50VXNlci5sYW5ndWFnZSlcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnN0IG1zZyA9IGUuZXJyb3IgPT09ICdjYW50LWludml0ZS1mb3ItZGlyZWN0LXJvb20nID8gJ0Nhbm5vdF9pbnZpdGVfdXNlcnNfdG9fZGlyZWN0X3Jvb21zJyA6IGUuZXJyb3I7XG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5VXNlcihNZXRlb3IudXNlcklkKCksICdtZXNzYWdlJywge1xuXHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKG1zZywgbnVsbCwgY3VycmVudFVzZXIubGFuZ3VhZ2UpXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2ludml0ZS1hbGwtdG8nLCBpbnZpdGVBbGwoJ3RvJyksIHtcblx0ZGVzY3JpcHRpb246ICdJbnZpdGVfdXNlcl90b19qb2luX2NoYW5uZWxfYWxsX3RvJyxcblx0cGFyYW1zOiAnI3Jvb20nXG59KTtcblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ2ludml0ZS1hbGwtZnJvbScsIGludml0ZUFsbCgnZnJvbScpLCB7XG5cdGRlc2NyaXB0aW9uOiAnSW52aXRlX3VzZXJfdG9fam9pbl9jaGFubmVsX2FsbF9mcm9tJyxcblx0cGFyYW1zOiAnI3Jvb20nXG59KTtcbm1vZHVsZS5leHBvcnRzID0gaW52aXRlQWxsO1xuIl19
