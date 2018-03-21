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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:action-links":{"both":{"lib":{"actionLinks.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// packages/rocketchat_action-links/both/lib/actionLinks.js                                       //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
//Action Links namespace creation.
RocketChat.actionLinks = {
  actions: {},

  register(name, funct) {
    RocketChat.actionLinks.actions[name] = funct;
  },

  getMessage(name, messageId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        function: 'actionLinks.getMessage'
      });
    }

    const message = RocketChat.models.Messages.findOne({
      _id: messageId
    });

    if (!message) {
      throw new Meteor.Error('error-invalid-message', 'Invalid message', {
        function: 'actionLinks.getMessage'
      });
    }

    const room = RocketChat.models.Rooms.findOne({
      _id: message.rid
    });

    if (Array.isArray(room.usernames) && room.usernames.indexOf(Meteor.user().username) === -1) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        function: 'actionLinks.getMessage'
      });
    }

    if (!message.actionLinks || !message.actionLinks[name]) {
      throw new Meteor.Error('error-invalid-actionlink', 'Invalid action link', {
        function: 'actionLinks.getMessage'
      });
    }

    return message;
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"actionLinkHandler.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                //
// packages/rocketchat_action-links/server/actionLinkHandler.js                                   //
//                                                                                                //
////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                  //
//Action Links Handler. This method will be called off the client.
Meteor.methods({
  actionLinkHandler(name, messageId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'actionLinkHandler'
      });
    }

    const message = RocketChat.actionLinks.getMessage(name, messageId);
    const actionLink = message.actionLinks[name];
    RocketChat.actionLinks.actions[actionLink.method_id](message, actionLink.params);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:action-links/both/lib/actionLinks.js");
require("/node_modules/meteor/rocketchat:action-links/server/actionLinkHandler.js");

/* Exports */
Package._define("rocketchat:action-links");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_action-links.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphY3Rpb24tbGlua3MvYm90aC9saWIvYWN0aW9uTGlua3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YWN0aW9uLWxpbmtzL3NlcnZlci9hY3Rpb25MaW5rSGFuZGxlci5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0IiwiYWN0aW9uTGlua3MiLCJhY3Rpb25zIiwicmVnaXN0ZXIiLCJuYW1lIiwiZnVuY3QiLCJnZXRNZXNzYWdlIiwibWVzc2FnZUlkIiwiTWV0ZW9yIiwidXNlcklkIiwiRXJyb3IiLCJmdW5jdGlvbiIsIm1lc3NhZ2UiLCJtb2RlbHMiLCJNZXNzYWdlcyIsImZpbmRPbmUiLCJfaWQiLCJyb29tIiwiUm9vbXMiLCJyaWQiLCJBcnJheSIsImlzQXJyYXkiLCJ1c2VybmFtZXMiLCJpbmRleE9mIiwidXNlciIsInVzZXJuYW1lIiwibWV0aG9kcyIsImFjdGlvbkxpbmtIYW5kbGVyIiwibWV0aG9kIiwiYWN0aW9uTGluayIsIm1ldGhvZF9pZCIsInBhcmFtcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxXQUFXQyxXQUFYLEdBQXlCO0FBQ3hCQyxXQUFTLEVBRGU7O0FBRXhCQyxXQUFTQyxJQUFULEVBQWVDLEtBQWYsRUFBc0I7QUFDckJMLGVBQVdDLFdBQVgsQ0FBdUJDLE9BQXZCLENBQStCRSxJQUEvQixJQUF1Q0MsS0FBdkM7QUFDQSxHQUp1Qjs7QUFLeEJDLGFBQVdGLElBQVgsRUFBaUJHLFNBQWpCLEVBQTRCO0FBQzNCLFFBQUksQ0FBQ0MsT0FBT0MsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSUQsT0FBT0UsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRUMsa0JBQVU7QUFBWixPQUF2RCxDQUFOO0FBQ0E7O0FBRUQsVUFBTUMsVUFBVVosV0FBV2EsTUFBWCxDQUFrQkMsUUFBbEIsQ0FBMkJDLE9BQTNCLENBQW1DO0FBQUVDLFdBQUtUO0FBQVAsS0FBbkMsQ0FBaEI7O0FBQ0EsUUFBSSxDQUFDSyxPQUFMLEVBQWM7QUFDYixZQUFNLElBQUlKLE9BQU9FLEtBQVgsQ0FBaUIsdUJBQWpCLEVBQTBDLGlCQUExQyxFQUE2RDtBQUFFQyxrQkFBVTtBQUFaLE9BQTdELENBQU47QUFDQTs7QUFFRCxVQUFNTSxPQUFPakIsV0FBV2EsTUFBWCxDQUFrQkssS0FBbEIsQ0FBd0JILE9BQXhCLENBQWdDO0FBQUVDLFdBQUtKLFFBQVFPO0FBQWYsS0FBaEMsQ0FBYjs7QUFDQSxRQUFJQyxNQUFNQyxPQUFOLENBQWNKLEtBQUtLLFNBQW5CLEtBQWlDTCxLQUFLSyxTQUFMLENBQWVDLE9BQWYsQ0FBdUJmLE9BQU9nQixJQUFQLEdBQWNDLFFBQXJDLE1BQW1ELENBQUMsQ0FBekYsRUFBNEY7QUFDM0YsWUFBTSxJQUFJakIsT0FBT0UsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRUMsa0JBQVU7QUFBWixPQUFyRCxDQUFOO0FBQ0E7O0FBRUQsUUFBSSxDQUFDQyxRQUFRWCxXQUFULElBQXdCLENBQUNXLFFBQVFYLFdBQVIsQ0FBb0JHLElBQXBCLENBQTdCLEVBQXdEO0FBQ3ZELFlBQU0sSUFBSUksT0FBT0UsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMscUJBQTdDLEVBQW9FO0FBQUVDLGtCQUFVO0FBQVosT0FBcEUsQ0FBTjtBQUNBOztBQUVELFdBQU9DLE9BQVA7QUFDQTs7QUF6QnVCLENBQXpCLEM7Ozs7Ozs7Ozs7O0FDREE7QUFFQUosT0FBT2tCLE9BQVAsQ0FBZTtBQUNkQyxvQkFBa0J2QixJQUFsQixFQUF3QkcsU0FBeEIsRUFBbUM7QUFDbEMsUUFBSSxDQUFDQyxPQUFPQyxNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJRCxPQUFPRSxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUFFa0IsZ0JBQVE7QUFBVixPQUF2RCxDQUFOO0FBQ0E7O0FBRUQsVUFBTWhCLFVBQVVaLFdBQVdDLFdBQVgsQ0FBdUJLLFVBQXZCLENBQWtDRixJQUFsQyxFQUF3Q0csU0FBeEMsQ0FBaEI7QUFFQSxVQUFNc0IsYUFBYWpCLFFBQVFYLFdBQVIsQ0FBb0JHLElBQXBCLENBQW5CO0FBRUFKLGVBQVdDLFdBQVgsQ0FBdUJDLE9BQXZCLENBQStCMkIsV0FBV0MsU0FBMUMsRUFBcURsQixPQUFyRCxFQUE4RGlCLFdBQVdFLE1BQXpFO0FBQ0E7O0FBWGEsQ0FBZixFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FjdGlvbi1saW5rcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vQWN0aW9uIExpbmtzIG5hbWVzcGFjZSBjcmVhdGlvbi5cblJvY2tldENoYXQuYWN0aW9uTGlua3MgPSB7XG5cdGFjdGlvbnM6IHt9LFxuXHRyZWdpc3RlcihuYW1lLCBmdW5jdCkge1xuXHRcdFJvY2tldENoYXQuYWN0aW9uTGlua3MuYWN0aW9uc1tuYW1lXSA9IGZ1bmN0O1xuXHR9LFxuXHRnZXRNZXNzYWdlKG5hbWUsIG1lc3NhZ2VJZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlSWQgfSk7XG5cdFx0aWYgKCFtZXNzYWdlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLW1lc3NhZ2UnLCAnSW52YWxpZCBtZXNzYWdlJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHsgX2lkOiBtZXNzYWdlLnJpZCB9KTtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShyb29tLnVzZXJuYW1lcykgJiYgcm9vbS51c2VybmFtZXMuaW5kZXhPZihNZXRlb3IudXNlcigpLnVzZXJuYW1lKSA9PT0gLTEpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBmdW5jdGlvbjogJ2FjdGlvbkxpbmtzLmdldE1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghbWVzc2FnZS5hY3Rpb25MaW5rcyB8fCAhbWVzc2FnZS5hY3Rpb25MaW5rc1tuYW1lXSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hY3Rpb25saW5rJywgJ0ludmFsaWQgYWN0aW9uIGxpbmsnLCB7IGZ1bmN0aW9uOiAnYWN0aW9uTGlua3MuZ2V0TWVzc2FnZScgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cbn07XG4iLCIvL0FjdGlvbiBMaW5rcyBIYW5kbGVyLiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCBvZmYgdGhlIGNsaWVudC5cblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRhY3Rpb25MaW5rSGFuZGxlcihuYW1lLCBtZXNzYWdlSWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnYWN0aW9uTGlua0hhbmRsZXInIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSBSb2NrZXRDaGF0LmFjdGlvbkxpbmtzLmdldE1lc3NhZ2UobmFtZSwgbWVzc2FnZUlkKTtcblxuXHRcdGNvbnN0IGFjdGlvbkxpbmsgPSBtZXNzYWdlLmFjdGlvbkxpbmtzW25hbWVdO1xuXG5cdFx0Um9ja2V0Q2hhdC5hY3Rpb25MaW5rcy5hY3Rpb25zW2FjdGlvbkxpbmsubWV0aG9kX2lkXShtZXNzYWdlLCBhY3Rpb25MaW5rLnBhcmFtcyk7XG5cdH1cbn0pO1xuIl19
