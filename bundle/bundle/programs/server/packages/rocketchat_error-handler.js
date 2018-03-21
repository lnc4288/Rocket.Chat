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

/* Package-scope variables */
var roomName, message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:error-handler":{"server":{"lib":{"RocketChat.ErrorHandler.js":function(){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/rocketchat_error-handler/server/lib/RocketChat.ErrorHandler.js //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
class ErrorHandler {
  constructor() {
    this.reporting = false;
    this.rid = null;
    this.lastError = null;
    this.registerHandlers();
    RocketChat.settings.get('Log_Exceptions_to_Channel', (key, value) => {
      if (value.trim()) {
        this.reporting = true;
        this.rid = this.getRoomId(value);
      } else {
        this.reporting = false;
        this.rid = '';
      }
    });
  }

  registerHandlers() {
    process.on('uncaughtException', Meteor.bindEnvironment(error => {
      if (!this.reporting) {
        return;
      }

      this.trackError(error.message, error.stack);
    }));
    const self = this;
    const originalMeteorDebug = Meteor._debug;

    Meteor._debug = function (message, stack) {
      if (!self.reporting) {
        return originalMeteorDebug.call(this, message, stack);
      }

      self.trackError(message, stack);
      return originalMeteorDebug.apply(this, arguments);
    };
  }

  getRoomId(roomName) {
    roomName = roomName.replace('#');
    const room = RocketChat.models.Rooms.findOneByName(roomName, {
      fields: {
        _id: 1,
        t: 1
      }
    });

    if (room && (room.t === 'c' || room.t === 'p')) {
      return room._id;
    } else {
      this.reporting = false;
    }
  }

  trackError(message, stack) {
    if (this.reporting && this.rid && this.lastError !== message) {
      this.lastError = message;
      const user = RocketChat.models.Users.findOneById('rocket.cat');

      if (stack) {
        message = `${message}\n\`\`\`\n${stack}\n\`\`\``;
      }

      RocketChat.sendMessage(user, {
        msg: message
      }, {
        _id: this.rid
      });
    }
  }

}

RocketChat.ErrorHandler = new ErrorHandler();
/////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/rocketchat_error-handler/server/startup/settings.js            //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
RocketChat.settings.addGroup('Logs', function () {
  this.add('Log_Exceptions_to_Channel', '', {
    type: 'string'
  });
});
/////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:error-handler/server/lib/RocketChat.ErrorHandler.js");
require("/node_modules/meteor/rocketchat:error-handler/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:error-handler");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_error-handler.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplcnJvci1oYW5kbGVyL3NlcnZlci9saWIvUm9ja2V0Q2hhdC5FcnJvckhhbmRsZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZXJyb3ItaGFuZGxlci9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyJdLCJuYW1lcyI6WyJFcnJvckhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsInJlcG9ydGluZyIsInJpZCIsImxhc3RFcnJvciIsInJlZ2lzdGVySGFuZGxlcnMiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJ2YWx1ZSIsInRyaW0iLCJnZXRSb29tSWQiLCJwcm9jZXNzIiwib24iLCJNZXRlb3IiLCJiaW5kRW52aXJvbm1lbnQiLCJlcnJvciIsInRyYWNrRXJyb3IiLCJtZXNzYWdlIiwic3RhY2siLCJzZWxmIiwib3JpZ2luYWxNZXRlb3JEZWJ1ZyIsIl9kZWJ1ZyIsImNhbGwiLCJhcHBseSIsImFyZ3VtZW50cyIsInJvb21OYW1lIiwicmVwbGFjZSIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeU5hbWUiLCJmaWVsZHMiLCJfaWQiLCJ0IiwidXNlciIsIlVzZXJzIiwiZmluZE9uZUJ5SWQiLCJzZW5kTWVzc2FnZSIsIm1zZyIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU1BLFlBQU4sQ0FBbUI7QUFDbEJDLGdCQUFjO0FBQ2IsU0FBS0MsU0FBTCxHQUFpQixLQUFqQjtBQUNBLFNBQUtDLEdBQUwsR0FBVyxJQUFYO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQixJQUFqQjtBQUVBLFNBQUtDLGdCQUFMO0FBRUFDLGVBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixFQUFxRCxDQUFDQyxHQUFELEVBQU1DLEtBQU4sS0FBZ0I7QUFDcEUsVUFBSUEsTUFBTUMsSUFBTixFQUFKLEVBQWtCO0FBQ2pCLGFBQUtULFNBQUwsR0FBaUIsSUFBakI7QUFDQSxhQUFLQyxHQUFMLEdBQVcsS0FBS1MsU0FBTCxDQUFlRixLQUFmLENBQVg7QUFDQSxPQUhELE1BR087QUFDTixhQUFLUixTQUFMLEdBQWlCLEtBQWpCO0FBQ0EsYUFBS0MsR0FBTCxHQUFXLEVBQVg7QUFDQTtBQUNELEtBUkQ7QUFTQTs7QUFFREUscUJBQW1CO0FBQ2xCUSxZQUFRQyxFQUFSLENBQVcsbUJBQVgsRUFBZ0NDLE9BQU9DLGVBQVAsQ0FBd0JDLEtBQUQsSUFBVztBQUNqRSxVQUFJLENBQUMsS0FBS2YsU0FBVixFQUFxQjtBQUNwQjtBQUNBOztBQUNELFdBQUtnQixVQUFMLENBQWdCRCxNQUFNRSxPQUF0QixFQUErQkYsTUFBTUcsS0FBckM7QUFDQSxLQUwrQixDQUFoQztBQU9BLFVBQU1DLE9BQU8sSUFBYjtBQUNBLFVBQU1DLHNCQUFzQlAsT0FBT1EsTUFBbkM7O0FBQ0FSLFdBQU9RLE1BQVAsR0FBZ0IsVUFBU0osT0FBVCxFQUFrQkMsS0FBbEIsRUFBeUI7QUFDeEMsVUFBSSxDQUFDQyxLQUFLbkIsU0FBVixFQUFxQjtBQUNwQixlQUFPb0Isb0JBQW9CRSxJQUFwQixDQUF5QixJQUF6QixFQUErQkwsT0FBL0IsRUFBd0NDLEtBQXhDLENBQVA7QUFDQTs7QUFDREMsV0FBS0gsVUFBTCxDQUFnQkMsT0FBaEIsRUFBeUJDLEtBQXpCO0FBQ0EsYUFBT0Usb0JBQW9CRyxLQUFwQixDQUEwQixJQUExQixFQUFnQ0MsU0FBaEMsQ0FBUDtBQUNBLEtBTkQ7QUFPQTs7QUFFRGQsWUFBVWUsUUFBVixFQUFvQjtBQUNuQkEsZUFBV0EsU0FBU0MsT0FBVCxDQUFpQixHQUFqQixDQUFYO0FBQ0EsVUFBTUMsT0FBT3ZCLFdBQVd3QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsYUFBeEIsQ0FBc0NMLFFBQXRDLEVBQWdEO0FBQUVNLGNBQVE7QUFBRUMsYUFBSyxDQUFQO0FBQVVDLFdBQUc7QUFBYjtBQUFWLEtBQWhELENBQWI7O0FBQ0EsUUFBSU4sU0FBU0EsS0FBS00sQ0FBTCxLQUFXLEdBQVgsSUFBa0JOLEtBQUtNLENBQUwsS0FBVyxHQUF0QyxDQUFKLEVBQWdEO0FBQy9DLGFBQU9OLEtBQUtLLEdBQVo7QUFDQSxLQUZELE1BRU87QUFDTixXQUFLaEMsU0FBTCxHQUFpQixLQUFqQjtBQUNBO0FBQ0Q7O0FBRURnQixhQUFXQyxPQUFYLEVBQW9CQyxLQUFwQixFQUEyQjtBQUMxQixRQUFJLEtBQUtsQixTQUFMLElBQWtCLEtBQUtDLEdBQXZCLElBQThCLEtBQUtDLFNBQUwsS0FBbUJlLE9BQXJELEVBQThEO0FBQzdELFdBQUtmLFNBQUwsR0FBaUJlLE9BQWpCO0FBQ0EsWUFBTWlCLE9BQU85QixXQUFXd0IsTUFBWCxDQUFrQk8sS0FBbEIsQ0FBd0JDLFdBQXhCLENBQW9DLFlBQXBDLENBQWI7O0FBRUEsVUFBSWxCLEtBQUosRUFBVztBQUNWRCxrQkFBVyxHQUFHQSxPQUFTLGFBQWFDLEtBQU8sVUFBM0M7QUFDQTs7QUFFRGQsaUJBQVdpQyxXQUFYLENBQXVCSCxJQUF2QixFQUE2QjtBQUFFSSxhQUFLckI7QUFBUCxPQUE3QixFQUErQztBQUFFZSxhQUFLLEtBQUsvQjtBQUFaLE9BQS9DO0FBQ0E7QUFDRDs7QUEzRGlCOztBQThEbkJHLFdBQVdOLFlBQVgsR0FBMEIsSUFBSUEsWUFBSixFQUExQixDOzs7Ozs7Ozs7OztBQzlEQU0sV0FBV0MsUUFBWCxDQUFvQmtDLFFBQXBCLENBQTZCLE1BQTdCLEVBQXFDLFlBQVc7QUFDL0MsT0FBS0MsR0FBTCxDQUFTLDJCQUFULEVBQXNDLEVBQXRDLEVBQTBDO0FBQUVDLFVBQU07QUFBUixHQUExQztBQUNBLENBRkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9lcnJvci1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgRXJyb3JIYW5kbGVyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5yZXBvcnRpbmcgPSBmYWxzZTtcblx0XHR0aGlzLnJpZCA9IG51bGw7XG5cdFx0dGhpcy5sYXN0RXJyb3IgPSBudWxsO1xuXG5cdFx0dGhpcy5yZWdpc3RlckhhbmRsZXJzKCk7XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTG9nX0V4Y2VwdGlvbnNfdG9fQ2hhbm5lbCcsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRpZiAodmFsdWUudHJpbSgpKSB7XG5cdFx0XHRcdHRoaXMucmVwb3J0aW5nID0gdHJ1ZTtcblx0XHRcdFx0dGhpcy5yaWQgPSB0aGlzLmdldFJvb21JZCh2YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnJlcG9ydGluZyA9IGZhbHNlO1xuXHRcdFx0XHR0aGlzLnJpZCA9ICcnO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVnaXN0ZXJIYW5kbGVycygpIHtcblx0XHRwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVycm9yKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMucmVwb3J0aW5nKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHRoaXMudHJhY2tFcnJvcihlcnJvci5tZXNzYWdlLCBlcnJvci5zdGFjayk7XG5cdFx0fSkpO1xuXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cdFx0Y29uc3Qgb3JpZ2luYWxNZXRlb3JEZWJ1ZyA9IE1ldGVvci5fZGVidWc7XG5cdFx0TWV0ZW9yLl9kZWJ1ZyA9IGZ1bmN0aW9uKG1lc3NhZ2UsIHN0YWNrKSB7XG5cdFx0XHRpZiAoIXNlbGYucmVwb3J0aW5nKSB7XG5cdFx0XHRcdHJldHVybiBvcmlnaW5hbE1ldGVvckRlYnVnLmNhbGwodGhpcywgbWVzc2FnZSwgc3RhY2spO1xuXHRcdFx0fVxuXHRcdFx0c2VsZi50cmFja0Vycm9yKG1lc3NhZ2UsIHN0YWNrKTtcblx0XHRcdHJldHVybiBvcmlnaW5hbE1ldGVvckRlYnVnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdGdldFJvb21JZChyb29tTmFtZSkge1xuXHRcdHJvb21OYW1lID0gcm9vbU5hbWUucmVwbGFjZSgnIycpO1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvb21OYW1lLCB7IGZpZWxkczogeyBfaWQ6IDEsIHQ6IDEgfSB9KTtcblx0XHRpZiAocm9vbSAmJiAocm9vbS50ID09PSAnYycgfHwgcm9vbS50ID09PSAncCcpKSB7XG5cdFx0XHRyZXR1cm4gcm9vbS5faWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucmVwb3J0aW5nID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0dHJhY2tFcnJvcihtZXNzYWdlLCBzdGFjaykge1xuXHRcdGlmICh0aGlzLnJlcG9ydGluZyAmJiB0aGlzLnJpZCAmJiB0aGlzLmxhc3RFcnJvciAhPT0gbWVzc2FnZSkge1xuXHRcdFx0dGhpcy5sYXN0RXJyb3IgPSBtZXNzYWdlO1xuXHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0Jyk7XG5cblx0XHRcdGlmIChzdGFjaykge1xuXHRcdFx0XHRtZXNzYWdlID0gYCR7IG1lc3NhZ2UgfVxcblxcYFxcYFxcYFxcbiR7IHN0YWNrIH1cXG5cXGBcXGBcXGBgO1xuXHRcdFx0fVxuXG5cdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHVzZXIsIHsgbXNnOiBtZXNzYWdlIH0sIHsgX2lkOiB0aGlzLnJpZCB9KTtcblx0XHR9XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5FcnJvckhhbmRsZXIgPSBuZXcgRXJyb3JIYW5kbGVyO1xuIiwiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnTG9ncycsIGZ1bmN0aW9uKCkge1xuXHR0aGlzLmFkZCgnTG9nX0V4Y2VwdGlvbnNfdG9fQ2hhbm5lbCcsICcnLCB7IHR5cGU6ICdzdHJpbmcnIH0pO1xufSk7XG4iXX0=
