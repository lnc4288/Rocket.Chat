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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:statistics":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/lib/rocketchat.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Statistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/models/Statistics.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Statistics = new class extends RocketChat.models._Base {
  constructor() {
    super('statistics');
    this.tryEnsureIndex({
      'createdAt': 1
    });
  } // FIND ONE


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findLast() {
    const options = {
      sort: {
        createdAt: -1
      },
      limit: 1
    };
    const records = this.find({}, options).fetch();
    return records && records[0];
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"get.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/get.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let os;
module.watch(require("os"), {
  default(v) {
    os = v;
  }

}, 1);

RocketChat.statistics.get = function _getStatistics() {
  const statistics = {}; // Version

  statistics.uniqueId = RocketChat.settings.get('uniqueID');

  if (RocketChat.models.Settings.findOne('uniqueID')) {
    statistics.installedAt = RocketChat.models.Settings.findOne('uniqueID').createdAt;
  }

  if (RocketChat.Info) {
    statistics.version = RocketChat.Info.version;
    statistics.tag = RocketChat.Info.tag;
    statistics.branch = RocketChat.Info.branch;
  } // User statistics


  statistics.totalUsers = Meteor.users.find().count();
  statistics.activeUsers = Meteor.users.find({
    active: true
  }).count();
  statistics.nonActiveUsers = statistics.totalUsers - statistics.activeUsers;
  statistics.onlineUsers = Meteor.users.find({
    statusConnection: 'online'
  }).count();
  statistics.awayUsers = Meteor.users.find({
    statusConnection: 'away'
  }).count();
  statistics.offlineUsers = statistics.totalUsers - statistics.onlineUsers - statistics.awayUsers; // Room statistics

  statistics.totalRooms = RocketChat.models.Rooms.find().count();
  statistics.totalChannels = RocketChat.models.Rooms.findByType('c').count();
  statistics.totalPrivateGroups = RocketChat.models.Rooms.findByType('p').count();
  statistics.totalDirect = RocketChat.models.Rooms.findByType('d').count();
  statistics.totlalLivechat = RocketChat.models.Rooms.findByType('l').count(); // Message statistics

  statistics.totalMessages = RocketChat.models.Messages.find().count();
  statistics.totalChannelMessages = _.reduce(RocketChat.models.Rooms.findByType('c', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countChannelMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalPrivateGroupMessages = _.reduce(RocketChat.models.Rooms.findByType('p', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countPrivateGroupMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalDirectMessages = _.reduce(RocketChat.models.Rooms.findByType('d', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countDirectMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.totalLivechatMessages = _.reduce(RocketChat.models.Rooms.findByType('l', {
    fields: {
      'msgs': 1
    }
  }).fetch(), function _countLivechatMessages(num, room) {
    return num + room.msgs;
  }, 0);
  statistics.lastLogin = RocketChat.models.Users.getLastLogin();
  statistics.lastMessageSentAt = RocketChat.models.Messages.getLastTimestamp();
  statistics.lastSeenSubscription = RocketChat.models.Subscriptions.getLastSeen();
  statistics.os = {
    type: os.type(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    uptime: os.uptime(),
    loadavg: os.loadavg(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    cpus: os.cpus()
  };
  statistics.process = {
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime()
  };
  statistics.deploy = {
    method: process.env.DEPLOY_METHOD || 'tar',
    platform: process.env.DEPLOY_PLATFORM || 'selfinstall'
  };
  statistics.migration = RocketChat.Migrations._getControl();
  statistics.instanceCount = InstanceStatus.getCollection().find({
    _updatedAt: {
      $gt: new Date(Date.now() - process.uptime() * 1000 - 2000)
    }
  }).count();

  if (MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle && MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry && RocketChat.settings.get('Force_Disable_OpLog_For_Cache') !== true) {
    statistics.oplogEnabled = true;
  }

  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"save.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/functions/save.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.statistics.save = function () {
  const statistics = RocketChat.statistics.get();
  statistics.createdAt = new Date();
  RocketChat.models.Statistics.insert(statistics);
  return statistics;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"getStatistics.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_statistics/server/methods/getStatistics.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  getStatistics(refresh) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'getStatistics'
      });
    }

    if (RocketChat.authz.hasPermission(Meteor.userId(), 'view-statistics') !== true) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'getStatistics'
      });
    }

    if (refresh) {
      return RocketChat.statistics.save();
    } else {
      return RocketChat.models.Statistics.findLast();
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:statistics/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:statistics/server/models/Statistics.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/get.js");
require("/node_modules/meteor/rocketchat:statistics/server/functions/save.js");
require("/node_modules/meteor/rocketchat:statistics/server/methods/getStatistics.js");

/* Exports */
Package._define("rocketchat:statistics");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_statistics.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzdGF0aXN0aWNzL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL21vZGVscy9TdGF0aXN0aWNzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnN0YXRpc3RpY3Mvc2VydmVyL2Z1bmN0aW9ucy9nZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RhdGlzdGljcy9zZXJ2ZXIvbWV0aG9kcy9nZXRTdGF0aXN0aWNzLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJzdGF0aXN0aWNzIiwibW9kZWxzIiwiU3RhdGlzdGljcyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJ0cnlFbnN1cmVJbmRleCIsImZpbmRPbmVCeUlkIiwiX2lkIiwib3B0aW9ucyIsInF1ZXJ5IiwiZmluZE9uZSIsImZpbmRMYXN0Iiwic29ydCIsImNyZWF0ZWRBdCIsImxpbWl0IiwicmVjb3JkcyIsImZpbmQiLCJmZXRjaCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm9zIiwiZ2V0IiwiX2dldFN0YXRpc3RpY3MiLCJ1bmlxdWVJZCIsInNldHRpbmdzIiwiU2V0dGluZ3MiLCJpbnN0YWxsZWRBdCIsIkluZm8iLCJ2ZXJzaW9uIiwidGFnIiwiYnJhbmNoIiwidG90YWxVc2VycyIsIk1ldGVvciIsInVzZXJzIiwiY291bnQiLCJhY3RpdmVVc2VycyIsImFjdGl2ZSIsIm5vbkFjdGl2ZVVzZXJzIiwib25saW5lVXNlcnMiLCJzdGF0dXNDb25uZWN0aW9uIiwiYXdheVVzZXJzIiwib2ZmbGluZVVzZXJzIiwidG90YWxSb29tcyIsIlJvb21zIiwidG90YWxDaGFubmVscyIsImZpbmRCeVR5cGUiLCJ0b3RhbFByaXZhdGVHcm91cHMiLCJ0b3RhbERpcmVjdCIsInRvdGxhbExpdmVjaGF0IiwidG90YWxNZXNzYWdlcyIsIk1lc3NhZ2VzIiwidG90YWxDaGFubmVsTWVzc2FnZXMiLCJyZWR1Y2UiLCJmaWVsZHMiLCJfY291bnRDaGFubmVsTWVzc2FnZXMiLCJudW0iLCJyb29tIiwibXNncyIsInRvdGFsUHJpdmF0ZUdyb3VwTWVzc2FnZXMiLCJfY291bnRQcml2YXRlR3JvdXBNZXNzYWdlcyIsInRvdGFsRGlyZWN0TWVzc2FnZXMiLCJfY291bnREaXJlY3RNZXNzYWdlcyIsInRvdGFsTGl2ZWNoYXRNZXNzYWdlcyIsIl9jb3VudExpdmVjaGF0TWVzc2FnZXMiLCJsYXN0TG9naW4iLCJVc2VycyIsImdldExhc3RMb2dpbiIsImxhc3RNZXNzYWdlU2VudEF0IiwiZ2V0TGFzdFRpbWVzdGFtcCIsImxhc3RTZWVuU3Vic2NyaXB0aW9uIiwiU3Vic2NyaXB0aW9ucyIsImdldExhc3RTZWVuIiwidHlwZSIsInBsYXRmb3JtIiwiYXJjaCIsInJlbGVhc2UiLCJ1cHRpbWUiLCJsb2FkYXZnIiwidG90YWxtZW0iLCJmcmVlbWVtIiwiY3B1cyIsInByb2Nlc3MiLCJub2RlVmVyc2lvbiIsInBpZCIsImRlcGxveSIsIm1ldGhvZCIsImVudiIsIkRFUExPWV9NRVRIT0QiLCJERVBMT1lfUExBVEZPUk0iLCJtaWdyYXRpb24iLCJNaWdyYXRpb25zIiwiX2dldENvbnRyb2wiLCJpbnN0YW5jZUNvdW50IiwiSW5zdGFuY2VTdGF0dXMiLCJnZXRDb2xsZWN0aW9uIiwiX3VwZGF0ZWRBdCIsIiRndCIsIkRhdGUiLCJub3ciLCJNb25nb0ludGVybmFscyIsImRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyIiwibW9uZ28iLCJfb3Bsb2dIYW5kbGUiLCJvbk9wbG9nRW50cnkiLCJvcGxvZ0VuYWJsZWQiLCJzYXZlIiwiaW5zZXJ0IiwibWV0aG9kcyIsImdldFN0YXRpc3RpY3MiLCJyZWZyZXNoIiwidXNlcklkIiwiRXJyb3IiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxVQUFYLEdBQXdCLEVBQXhCLEM7Ozs7Ozs7Ozs7O0FDQUFELFdBQVdFLE1BQVgsQ0FBa0JDLFVBQWxCLEdBQStCLElBQUksY0FBY0gsV0FBV0UsTUFBWCxDQUFrQkUsS0FBaEMsQ0FBc0M7QUFDeEVDLGdCQUFjO0FBQ2IsVUFBTSxZQUFOO0FBRUEsU0FBS0MsY0FBTCxDQUFvQjtBQUFFLG1CQUFhO0FBQWYsS0FBcEI7QUFDQSxHQUx1RSxDQU94RTs7O0FBQ0FDLGNBQVlDLEdBQVosRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFBRUY7QUFBRixLQUFkO0FBQ0EsV0FBTyxLQUFLRyxPQUFMLENBQWFELEtBQWIsRUFBb0JELE9BQXBCLENBQVA7QUFDQTs7QUFFREcsYUFBVztBQUNWLFVBQU1ILFVBQVU7QUFDZkksWUFBTTtBQUNMQyxtQkFBVyxDQUFDO0FBRFAsT0FEUztBQUlmQyxhQUFPO0FBSlEsS0FBaEI7QUFNQSxVQUFNQyxVQUFVLEtBQUtDLElBQUwsQ0FBVSxFQUFWLEVBQWNSLE9BQWQsRUFBdUJTLEtBQXZCLEVBQWhCO0FBQ0EsV0FBT0YsV0FBV0EsUUFBUSxDQUFSLENBQWxCO0FBQ0E7O0FBdEJ1RSxDQUExQyxFQUEvQixDOzs7Ozs7Ozs7OztBQ0FBLElBQUlHLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFBd0QsSUFBSUMsRUFBSjtBQUFPTCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsSUFBUixDQUFiLEVBQTJCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDQyxTQUFHRCxDQUFI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RjtBQUNoRixZQUFNLElBQUk5RSxPQUFPK0UsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRTFCLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVELFFBQUl3QixPQUFKLEVBQWE7QUFDWixhQUFPbEgsV0FBV0MsVUFBWCxDQUFzQjZHLElBQXRCLEVBQVA7QUFDQSxLQUZELE1BRU87QUFDTixhQUFPOUcsV0FBV0UsTUFBWCxDQUFrQkMsVUFBbEIsQ0FBNkJTLFFBQTdCLEVBQVA7QUFDQTtBQUNEOztBQWZhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zdGF0aXN0aWNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiUm9ja2V0Q2hhdC5zdGF0aXN0aWNzID0ge307XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5TdGF0aXN0aWNzID0gbmV3IGNsYXNzIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignc3RhdGlzdGljcycpO1xuXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdjcmVhdGVkQXQnOiAxIH0pO1xuXHR9XG5cblx0Ly8gRklORCBPTkVcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZExhc3QoKSB7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0Y3JlYXRlZEF0OiAtMVxuXHRcdFx0fSxcblx0XHRcdGxpbWl0OiAxXG5cdFx0fTtcblx0XHRjb25zdCByZWNvcmRzID0gdGhpcy5maW5kKHt9LCBvcHRpb25zKS5mZXRjaCgpO1xuXHRcdHJldHVybiByZWNvcmRzICYmIHJlY29yZHNbMF07XG5cdH1cbn07XG4iLCIvKiBnbG9iYWwgSW5zdGFuY2VTdGF0dXMsIE1vbmdvSW50ZXJuYWxzICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBvcyBmcm9tICdvcyc7XG5cblJvY2tldENoYXQuc3RhdGlzdGljcy5nZXQgPSBmdW5jdGlvbiBfZ2V0U3RhdGlzdGljcygpIHtcblx0Y29uc3Qgc3RhdGlzdGljcyA9IHt9O1xuXG5cdC8vIFZlcnNpb25cblx0c3RhdGlzdGljcy51bmlxdWVJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpO1xuXHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZSgndW5pcXVlSUQnKSkge1xuXHRcdHN0YXRpc3RpY3MuaW5zdGFsbGVkQXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKCd1bmlxdWVJRCcpLmNyZWF0ZWRBdDtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LkluZm8pIHtcblx0XHRzdGF0aXN0aWNzLnZlcnNpb24gPSBSb2NrZXRDaGF0LkluZm8udmVyc2lvbjtcblx0XHRzdGF0aXN0aWNzLnRhZyA9IFJvY2tldENoYXQuSW5mby50YWc7XG5cdFx0c3RhdGlzdGljcy5icmFuY2ggPSBSb2NrZXRDaGF0LkluZm8uYnJhbmNoO1xuXHR9XG5cblx0Ly8gVXNlciBzdGF0aXN0aWNzXG5cdHN0YXRpc3RpY3MudG90YWxVc2VycyA9IE1ldGVvci51c2Vycy5maW5kKCkuY291bnQoKTtcblx0c3RhdGlzdGljcy5hY3RpdmVVc2VycyA9IE1ldGVvci51c2Vycy5maW5kKHsgYWN0aXZlOiB0cnVlIH0pLmNvdW50KCk7XG5cdHN0YXRpc3RpY3Mubm9uQWN0aXZlVXNlcnMgPSBzdGF0aXN0aWNzLnRvdGFsVXNlcnMgLSBzdGF0aXN0aWNzLmFjdGl2ZVVzZXJzO1xuXHRzdGF0aXN0aWNzLm9ubGluZVVzZXJzID0gTWV0ZW9yLnVzZXJzLmZpbmQoeyBzdGF0dXNDb25uZWN0aW9uOiAnb25saW5lJyB9KS5jb3VudCgpO1xuXHRzdGF0aXN0aWNzLmF3YXlVc2VycyA9IE1ldGVvci51c2Vycy5maW5kKHsgc3RhdHVzQ29ubmVjdGlvbjogJ2F3YXknIH0pLmNvdW50KCk7XG5cdHN0YXRpc3RpY3Mub2ZmbGluZVVzZXJzID0gc3RhdGlzdGljcy50b3RhbFVzZXJzIC0gc3RhdGlzdGljcy5vbmxpbmVVc2VycyAtIHN0YXRpc3RpY3MuYXdheVVzZXJzO1xuXG5cdC8vIFJvb20gc3RhdGlzdGljc1xuXHRzdGF0aXN0aWNzLnRvdGFsUm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKCkuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbENoYW5uZWxzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VHlwZSgnYycpLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MudG90YWxQcml2YXRlR3JvdXBzID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VHlwZSgncCcpLmNvdW50KCk7XG5cdHN0YXRpc3RpY3MudG90YWxEaXJlY3QgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kQnlUeXBlKCdkJykuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RsYWxMaXZlY2hhdCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2wnKS5jb3VudCgpO1xuXG5cdC8vIE1lc3NhZ2Ugc3RhdGlzdGljc1xuXHRzdGF0aXN0aWNzLnRvdGFsTWVzc2FnZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kKCkuY291bnQoKTtcblx0c3RhdGlzdGljcy50b3RhbENoYW5uZWxNZXNzYWdlcyA9IF8ucmVkdWNlKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2MnLCB7IGZpZWxkczogeyAnbXNncyc6IDEgfX0pLmZldGNoKCksIGZ1bmN0aW9uIF9jb3VudENoYW5uZWxNZXNzYWdlcyhudW0sIHJvb20pIHsgcmV0dXJuIG51bSArIHJvb20ubXNnczsgfSwgMCk7XG5cdHN0YXRpc3RpY3MudG90YWxQcml2YXRlR3JvdXBNZXNzYWdlcyA9IF8ucmVkdWNlKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ3AnLCB7IGZpZWxkczogeyAnbXNncyc6IDEgfX0pLmZldGNoKCksIGZ1bmN0aW9uIF9jb3VudFByaXZhdGVHcm91cE1lc3NhZ2VzKG51bSwgcm9vbSkgeyByZXR1cm4gbnVtICsgcm9vbS5tc2dzOyB9LCAwKTtcblx0c3RhdGlzdGljcy50b3RhbERpcmVjdE1lc3NhZ2VzID0gXy5yZWR1Y2UoUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VHlwZSgnZCcsIHsgZmllbGRzOiB7ICdtc2dzJzogMSB9fSkuZmV0Y2goKSwgZnVuY3Rpb24gX2NvdW50RGlyZWN0TWVzc2FnZXMobnVtLCByb29tKSB7IHJldHVybiBudW0gKyByb29tLm1zZ3M7IH0sIDApO1xuXHRzdGF0aXN0aWNzLnRvdGFsTGl2ZWNoYXRNZXNzYWdlcyA9IF8ucmVkdWNlKFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGUoJ2wnLCB7IGZpZWxkczogeyAnbXNncyc6IDEgfX0pLmZldGNoKCksIGZ1bmN0aW9uIF9jb3VudExpdmVjaGF0TWVzc2FnZXMobnVtLCByb29tKSB7IHJldHVybiBudW0gKyByb29tLm1zZ3M7IH0sIDApO1xuXG5cdHN0YXRpc3RpY3MubGFzdExvZ2luID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0TGFzdExvZ2luKCk7XG5cdHN0YXRpc3RpY3MubGFzdE1lc3NhZ2VTZW50QXQgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5nZXRMYXN0VGltZXN0YW1wKCk7XG5cdHN0YXRpc3RpY3MubGFzdFNlZW5TdWJzY3JpcHRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmdldExhc3RTZWVuKCk7XG5cblx0c3RhdGlzdGljcy5vcyA9IHtcblx0XHR0eXBlOiBvcy50eXBlKCksXG5cdFx0cGxhdGZvcm06IG9zLnBsYXRmb3JtKCksXG5cdFx0YXJjaDogb3MuYXJjaCgpLFxuXHRcdHJlbGVhc2U6IG9zLnJlbGVhc2UoKSxcblx0XHR1cHRpbWU6IG9zLnVwdGltZSgpLFxuXHRcdGxvYWRhdmc6IG9zLmxvYWRhdmcoKSxcblx0XHR0b3RhbG1lbTogb3MudG90YWxtZW0oKSxcblx0XHRmcmVlbWVtOiBvcy5mcmVlbWVtKCksXG5cdFx0Y3B1czogb3MuY3B1cygpXG5cdH07XG5cblx0c3RhdGlzdGljcy5wcm9jZXNzID0ge1xuXHRcdG5vZGVWZXJzaW9uOiBwcm9jZXNzLnZlcnNpb24sXG5cdFx0cGlkOiBwcm9jZXNzLnBpZCxcblx0XHR1cHRpbWU6IHByb2Nlc3MudXB0aW1lKClcblx0fTtcblxuXHRzdGF0aXN0aWNzLmRlcGxveSA9IHtcblx0XHRtZXRob2Q6IHByb2Nlc3MuZW52LkRFUExPWV9NRVRIT0QgfHwgJ3RhcicsXG5cdFx0cGxhdGZvcm06IHByb2Nlc3MuZW52LkRFUExPWV9QTEFURk9STSB8fCAnc2VsZmluc3RhbGwnXG5cdH07XG5cblx0c3RhdGlzdGljcy5taWdyYXRpb24gPSBSb2NrZXRDaGF0Lk1pZ3JhdGlvbnMuX2dldENvbnRyb2woKTtcblx0c3RhdGlzdGljcy5pbnN0YW5jZUNvdW50ID0gSW5zdGFuY2VTdGF0dXMuZ2V0Q29sbGVjdGlvbigpLmZpbmQoeyBfdXBkYXRlZEF0OiB7ICRndDogbmV3IERhdGUoRGF0ZS5ub3coKSAtIHByb2Nlc3MudXB0aW1lKCkgKiAxMDAwIC0gMjAwMCkgfX0pLmNvdW50KCk7XG5cblx0aWYgKE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCkubW9uZ28uX29wbG9nSGFuZGxlICYmIE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCkubW9uZ28uX29wbG9nSGFuZGxlLm9uT3Bsb2dFbnRyeSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRm9yY2VfRGlzYWJsZV9PcExvZ19Gb3JfQ2FjaGUnKSAhPT0gdHJ1ZSkge1xuXHRcdHN0YXRpc3RpY3Mub3Bsb2dFbmFibGVkID0gdHJ1ZTtcblx0fVxuXG5cdHJldHVybiBzdGF0aXN0aWNzO1xufTtcbiIsIlJvY2tldENoYXQuc3RhdGlzdGljcy5zYXZlID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHN0YXRpc3RpY3MgPSBSb2NrZXRDaGF0LnN0YXRpc3RpY3MuZ2V0KCk7XG5cdHN0YXRpc3RpY3MuY3JlYXRlZEF0ID0gbmV3IERhdGU7XG5cdFJvY2tldENoYXQubW9kZWxzLlN0YXRpc3RpY3MuaW5zZXJ0KHN0YXRpc3RpY3MpO1xuXHRyZXR1cm4gc3RhdGlzdGljcztcbn07XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGdldFN0YXRpc3RpY3MocmVmcmVzaCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdnZXRTdGF0aXN0aWNzJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctc3RhdGlzdGljcycpICE9PSB0cnVlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnZ2V0U3RhdGlzdGljcycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKHJlZnJlc2gpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnN0YXRpc3RpY3Muc2F2ZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuU3RhdGlzdGljcy5maW5kTGFzdCgpO1xuXHRcdH1cblx0fVxufSk7XG4iXX0=
