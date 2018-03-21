(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livestream":{"server":{"models":{"Rooms.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_livestream/server/models/Rooms.js                                                         //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.models.Rooms.setStreamingOptionsById = function (_id, streamingOptions) {
  const update = {
    $set: {
      streamingOptions
    }
  };
  return this.update({
    _id
  }, update);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"saveStreamingOptions.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_livestream/server/functions/saveStreamingOptions.js                                       //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
RocketChat.saveStreamingOptions = function (rid, streamingOptions) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveStreamingOptions'
    });
  }

  return RocketChat.models.Rooms.setStreamingOptionsById(rid, streamingOptions);
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"settings.js":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/rocketchat_livestream/server/settings.js                                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
Meteor.startup(function () {
  RocketChat.settings.addGroup('LiveStream', function () {
    this.add('Livestream_enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled',
      public: true,
      alert: 'This feature is currently in beta! Please report bugs to github.com/RocketChat/Rocket.Chat/issues'
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livestream/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livestream/server/functions/saveStreamingOptions.js");
require("/node_modules/meteor/rocketchat:livestream/server/settings.js");

/* Exports */
Package._define("rocketchat:livestream");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livestream.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlc3RyZWFtL3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZXN0cmVhbS9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVTdHJlYW1pbmdPcHRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVzdHJlYW0vc2VydmVyL3NldHRpbmdzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJtb2RlbHMiLCJSb29tcyIsInNldFN0cmVhbWluZ09wdGlvbnNCeUlkIiwiX2lkIiwic3RyZWFtaW5nT3B0aW9ucyIsInVwZGF0ZSIsIiRzZXQiLCJzYXZlU3RyZWFtaW5nT3B0aW9ucyIsInJpZCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsIk1ldGVvciIsIkVycm9yIiwic3RhcnR1cCIsInNldHRpbmdzIiwiYWRkR3JvdXAiLCJhZGQiLCJ0eXBlIiwiaTE4bkxhYmVsIiwicHVibGljIiwiYWxlcnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JDLHVCQUF4QixHQUFrRCxVQUFTQyxHQUFULEVBQWNDLGdCQUFkLEVBQWdDO0FBQ2pGLFFBQU1DLFNBQVM7QUFDZEMsVUFBTTtBQUNMRjtBQURLO0FBRFEsR0FBZjtBQUtBLFNBQU8sS0FBS0MsTUFBTCxDQUFZO0FBQUVGO0FBQUYsR0FBWixFQUFxQkUsTUFBckIsQ0FBUDtBQUNBLENBUEQsQzs7Ozs7Ozs7Ozs7QUNBQU4sV0FBV1Esb0JBQVgsR0FBa0MsVUFBU0MsR0FBVCxFQUFjSixnQkFBZCxFQUFnQztBQUNqRSxNQUFJLENBQUNLLE1BQU1DLElBQU4sQ0FBV0YsR0FBWCxFQUFnQkcsTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUVELFNBQU9kLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyx1QkFBeEIsQ0FBZ0RNLEdBQWhELEVBQXFESixnQkFBckQsQ0FBUDtBQUNBLENBUkQsQzs7Ozs7Ozs7Ozs7QUNBQVEsT0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekJmLGFBQVdnQixRQUFYLENBQW9CQyxRQUFwQixDQUE2QixZQUE3QixFQUEyQyxZQUFXO0FBQ3JELFNBQUtDLEdBQUwsQ0FBUyxvQkFBVCxFQUErQixLQUEvQixFQUFzQztBQUNyQ0MsWUFBTSxTQUQrQjtBQUVyQ0MsaUJBQVcsU0FGMEI7QUFHckNDLGNBQVEsSUFINkI7QUFJckNDLGFBQU87QUFKOEIsS0FBdEM7QUFNQSxHQVBEO0FBUUEsQ0FURCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2xpdmVzdHJlYW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRTdHJlYW1pbmdPcHRpb25zQnlJZCA9IGZ1bmN0aW9uKF9pZCwgc3RyZWFtaW5nT3B0aW9ucykge1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c3RyZWFtaW5nT3B0aW9uc1xuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkIH0sIHVwZGF0ZSk7XG59O1xuIiwiUm9ja2V0Q2hhdC5zYXZlU3RyZWFtaW5nT3B0aW9ucyA9IGZ1bmN0aW9uKHJpZCwgc3RyZWFtaW5nT3B0aW9ucykge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdCdmdW5jdGlvbic6ICdSb2NrZXRDaGF0LnNhdmVTdHJlYW1pbmdPcHRpb25zJ1xuXHRcdH0pO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFN0cmVhbWluZ09wdGlvbnNCeUlkKHJpZCwgc3RyZWFtaW5nT3B0aW9ucyk7XG59O1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0xpdmVTdHJlYW0nLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnTGl2ZXN0cmVhbV9lbmFibGVkJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGkxOG5MYWJlbDogJ0VuYWJsZWQnLFxuXHRcdFx0cHVibGljOiB0cnVlLFxuXHRcdFx0YWxlcnQ6ICdUaGlzIGZlYXR1cmUgaXMgY3VycmVudGx5IGluIGJldGEhIFBsZWFzZSByZXBvcnQgYnVncyB0byBnaXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzJ1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIl19
