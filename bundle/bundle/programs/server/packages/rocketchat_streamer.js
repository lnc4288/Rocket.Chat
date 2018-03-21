(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var DDPCommon = Package['ddp-common'].DDPCommon;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var EV, self, fn, eventName, args, Streamer;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:streamer":{"lib":{"ev.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_streamer/lib/ev.js                                                                 //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
/* globals EV:true */

/* exported EV */
EV = class EV {
  constructor() {
    this.handlers = {};
  }

  emit(event, ...args) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler.apply(this, args));
    }
  }

  emitWithScope(event, scope, ...args) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(handler => handler.apply(scope, args));
    }
  }

  on(event, callback) {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }

    this.handlers[event].push(callback);
  }

  once(event, callback) {
    self = this;
    self.on(event, function onetimeCallback() {
      callback.apply(this, arguments);
      self.removeListener(event, onetimeCallback);
    });
  }

  removeListener(event, callback) {
    if (this.handlers[event]) {
      const index = this.handlers[event].indexOf(callback);

      if (index > -1) {
        this.handlers[event].splice(index, 1);
      }
    }
  }

  removeAllListeners(event) {
    this.handlers[event] = undefined;
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                        //
// packages/rocketchat_streamer/server/server.js                                                          //
//                                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                          //
/* globals EV */

/* eslint new-cap: false */
class StreamerCentral extends EV {
  constructor() {
    super();
    this.instances = {};
  }

}

Meteor.StreamerCentral = new StreamerCentral();
Meteor.Streamer = class Streamer extends EV {
  constructor(name, {
    retransmit = true,
    retransmitToSelf = false
  } = {}) {
    if (Meteor.StreamerCentral.instances[name]) {
      console.warn('Streamer instance already exists:', name);
      return Meteor.StreamerCentral.instances[name];
    }

    super();
    Meteor.StreamerCentral.instances[name] = this;
    this.name = name;
    this.retransmit = retransmit;
    this.retransmitToSelf = retransmitToSelf;
    this.subscriptions = [];
    this.subscriptionsByEventName = {};
    this.transformers = {};
    this.iniPublication();
    this.initMethod();
    this._allowRead = {};
    this._allowEmit = {};
    this._allowWrite = {};
    this.allowRead('none');
    this.allowEmit('all');
    this.allowWrite('none');
  }

  get name() {
    return this._name;
  }

  set name(name) {
    check(name, String);
    this._name = name;
  }

  get subscriptionName() {
    return `stream-${this.name}`;
  }

  get retransmit() {
    return this._retransmit;
  }

  set retransmit(retransmit) {
    check(retransmit, Boolean);
    this._retransmit = retransmit;
  }

  get retransmitToSelf() {
    return this._retransmitToSelf;
  }

  set retransmitToSelf(retransmitToSelf) {
    check(retransmitToSelf, Boolean);
    this._retransmitToSelf = retransmitToSelf;
  }

  allowRead(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowRead[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowRead shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowRead[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowRead[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowRead[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  allowEmit(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowEmit[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowRead shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowEmit[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowEmit[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowEmit[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  allowWrite(eventName, fn) {
    if (fn === undefined) {
      fn = eventName;
      eventName = '__all__';
    }

    if (typeof fn === 'function') {
      return this._allowWrite[eventName] = fn;
    }

    if (typeof fn === 'string' && ['all', 'none', 'logged'].indexOf(fn) === -1) {
      console.error(`allowWrite shortcut '${fn}' is invalid`);
    }

    if (fn === 'all' || fn === true) {
      return this._allowWrite[eventName] = function () {
        return true;
      };
    }

    if (fn === 'none' || fn === false) {
      return this._allowWrite[eventName] = function () {
        return false;
      };
    }

    if (fn === 'logged') {
      return this._allowWrite[eventName] = function () {
        return Boolean(this.userId);
      };
    }
  }

  isReadAllowed(scope, eventName, args) {
    if (this._allowRead[eventName]) {
      return this._allowRead[eventName].call(scope, eventName, ...args);
    }

    return this._allowRead['__all__'].call(scope, eventName, ...args);
  }

  isEmitAllowed(scope, eventName, ...args) {
    if (this._allowEmit[eventName]) {
      return this._allowEmit[eventName].call(scope, eventName, ...args);
    }

    return this._allowEmit['__all__'].call(scope, eventName, ...args);
  }

  isWriteAllowed(scope, eventName, args) {
    if (this._allowWrite[eventName]) {
      return this._allowWrite[eventName].call(scope, eventName, ...args);
    }

    return this._allowWrite['__all__'].call(scope, eventName, ...args);
  }

  addSubscription(subscription, eventName) {
    this.subscriptions.push(subscription);

    if (!this.subscriptionsByEventName[eventName]) {
      this.subscriptionsByEventName[eventName] = [];
    }

    this.subscriptionsByEventName[eventName].push(subscription);
  }

  removeSubscription(subscription, eventName) {
    const index = this.subscriptions.indexOf(subscription);

    if (index > -1) {
      this.subscriptions.splice(index, 1);
    }

    if (this.subscriptionsByEventName[eventName]) {
      const index = this.subscriptionsByEventName[eventName].indexOf(subscription);

      if (index > -1) {
        this.subscriptionsByEventName[eventName].splice(index, 1);
      }
    }
  }

  transform(eventName, fn) {
    if (typeof eventName === 'function') {
      fn = eventName;
      eventName = '__all__';
    }

    if (!this.transformers[eventName]) {
      this.transformers[eventName] = [];
    }

    this.transformers[eventName].push(fn);
  }

  applyTransformers(methodScope, eventName, args) {
    if (this.transformers['__all__']) {
      this.transformers['__all__'].forEach(transform => {
        args = transform.call(methodScope, eventName, args);
        methodScope.tranformed = true;

        if (!Array.isArray(args)) {
          args = [args];
        }
      });
    }

    if (this.transformers[eventName]) {
      this.transformers[eventName].forEach(transform => {
        args = transform.call(methodScope, ...args);
        methodScope.tranformed = true;

        if (!Array.isArray(args)) {
          args = [args];
        }
      });
    }

    return args;
  }

  iniPublication() {
    const stream = this;
    Meteor.publish(this.subscriptionName, function (eventName, options) {
      check(eventName, String);
      let useCollection,
          args = [];

      if (typeof options === 'boolean') {
        useCollection = options;
      } else {
        if (options.useCollection) {
          useCollection = options.useCollection;
        }

        if (options.args) {
          args = options.args;
        }
      }

      if (eventName.length === 0) {
        this.stop();
        return;
      }

      if (stream.isReadAllowed(this, eventName, args) !== true) {
        this.stop();
        return;
      }

      const subscription = {
        subscription: this,
        eventName: eventName
      };
      stream.addSubscription(subscription, eventName);
      this.onStop(() => {
        stream.removeSubscription(subscription, eventName);
      });

      if (useCollection === true) {
        // Collection compatibility
        this._session.sendAdded(stream.subscriptionName, 'id', {
          eventName: eventName
        });
      }

      this.ready();
    });
  }

  initMethod() {
    const stream = this;
    const method = {};

    method[this.subscriptionName] = function (eventName, ...args) {
      check(eventName, String);
      check(args, Array);
      this.unblock();

      if (stream.isWriteAllowed(this, eventName, args) !== true) {
        return;
      }

      const methodScope = {
        userId: this.userId,
        connection: this.connection,
        originalParams: args,
        tranformed: false
      };
      args = stream.applyTransformers(methodScope, eventName, args);
      stream.emitWithScope(eventName, methodScope, ...args);

      if (stream.retransmit === true) {
        stream._emit(eventName, args, this.connection, true);
      }
    };

    try {
      Meteor.methods(method);
    } catch (e) {
      console.error(e);
    }
  }

  _emit(eventName, args, origin, broadcast) {
    if (broadcast === true) {
      Meteor.StreamerCentral.emit('broadcast', this.name, eventName, args);
    }

    const subscriptions = this.subscriptionsByEventName[eventName];

    if (!Array.isArray(subscriptions)) {
      return;
    }

    subscriptions.forEach(subscription => {
      if (this.retransmitToSelf === false && origin && origin === subscription.subscription.connection) {
        return;
      }

      if (this.isEmitAllowed(subscription.subscription, eventName, ...args)) {
        subscription.subscription._session.sendChanged(this.subscriptionName, 'id', {
          eventName: eventName,
          args: args
        });
      }
    });
  }

  emit(eventName, ...args) {
    this._emit(eventName, args, undefined, true);
  }

  emitWithoutBroadcast(eventName, ...args) {
    this._emit(eventName, args, undefined, false);
  }

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:streamer/lib/ev.js");
require("/node_modules/meteor/rocketchat:streamer/server/server.js");

/* Exports */
Package._define("rocketchat:streamer", {
  Streamer: Streamer
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_streamer.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzdHJlYW1lci9saWIvZXYuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c3RyZWFtZXIvc2VydmVyL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJFViIsImNvbnN0cnVjdG9yIiwiaGFuZGxlcnMiLCJlbWl0IiwiZXZlbnQiLCJhcmdzIiwiZm9yRWFjaCIsImhhbmRsZXIiLCJhcHBseSIsImVtaXRXaXRoU2NvcGUiLCJzY29wZSIsIm9uIiwiY2FsbGJhY2siLCJwdXNoIiwib25jZSIsInNlbGYiLCJvbmV0aW1lQ2FsbGJhY2siLCJhcmd1bWVudHMiLCJyZW1vdmVMaXN0ZW5lciIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInJlbW92ZUFsbExpc3RlbmVycyIsInVuZGVmaW5lZCIsIlN0cmVhbWVyQ2VudHJhbCIsImluc3RhbmNlcyIsIk1ldGVvciIsIlN0cmVhbWVyIiwibmFtZSIsInJldHJhbnNtaXQiLCJyZXRyYW5zbWl0VG9TZWxmIiwiY29uc29sZSIsIndhcm4iLCJzdWJzY3JpcHRpb25zIiwic3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lIiwidHJhbnNmb3JtZXJzIiwiaW5pUHVibGljYXRpb24iLCJpbml0TWV0aG9kIiwiX2FsbG93UmVhZCIsIl9hbGxvd0VtaXQiLCJfYWxsb3dXcml0ZSIsImFsbG93UmVhZCIsImFsbG93RW1pdCIsImFsbG93V3JpdGUiLCJfbmFtZSIsImNoZWNrIiwiU3RyaW5nIiwic3Vic2NyaXB0aW9uTmFtZSIsIl9yZXRyYW5zbWl0IiwiQm9vbGVhbiIsIl9yZXRyYW5zbWl0VG9TZWxmIiwiZXZlbnROYW1lIiwiZm4iLCJlcnJvciIsInVzZXJJZCIsImlzUmVhZEFsbG93ZWQiLCJjYWxsIiwiaXNFbWl0QWxsb3dlZCIsImlzV3JpdGVBbGxvd2VkIiwiYWRkU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwicmVtb3ZlU3Vic2NyaXB0aW9uIiwidHJhbnNmb3JtIiwiYXBwbHlUcmFuc2Zvcm1lcnMiLCJtZXRob2RTY29wZSIsInRyYW5mb3JtZWQiLCJBcnJheSIsImlzQXJyYXkiLCJzdHJlYW0iLCJwdWJsaXNoIiwib3B0aW9ucyIsInVzZUNvbGxlY3Rpb24iLCJsZW5ndGgiLCJzdG9wIiwib25TdG9wIiwiX3Nlc3Npb24iLCJzZW5kQWRkZWQiLCJyZWFkeSIsIm1ldGhvZCIsInVuYmxvY2siLCJjb25uZWN0aW9uIiwib3JpZ2luYWxQYXJhbXMiLCJfZW1pdCIsIm1ldGhvZHMiLCJlIiwib3JpZ2luIiwiYnJvYWRjYXN0Iiwic2VuZENoYW5nZWQiLCJlbWl0V2l0aG91dEJyb2FkY2FzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7QUFFQUEsS0FBSyxNQUFNQSxFQUFOLENBQVM7QUFDYkMsZ0JBQWM7QUFDYixTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0E7O0FBRURDLE9BQUtDLEtBQUwsRUFBWSxHQUFHQyxJQUFmLEVBQXFCO0FBQ3BCLFFBQUksS0FBS0gsUUFBTCxDQUFjRSxLQUFkLENBQUosRUFBMEI7QUFDekIsV0FBS0YsUUFBTCxDQUFjRSxLQUFkLEVBQXFCRSxPQUFyQixDQUE4QkMsT0FBRCxJQUFhQSxRQUFRQyxLQUFSLENBQWMsSUFBZCxFQUFvQkgsSUFBcEIsQ0FBMUM7QUFDQTtBQUNEOztBQUVESSxnQkFBY0wsS0FBZCxFQUFxQk0sS0FBckIsRUFBNEIsR0FBR0wsSUFBL0IsRUFBcUM7QUFDcEMsUUFBSSxLQUFLSCxRQUFMLENBQWNFLEtBQWQsQ0FBSixFQUEwQjtBQUN6QixXQUFLRixRQUFMLENBQWNFLEtBQWQsRUFBcUJFLE9BQXJCLENBQThCQyxPQUFELElBQWFBLFFBQVFDLEtBQVIsQ0FBY0UsS0FBZCxFQUFxQkwsSUFBckIsQ0FBMUM7QUFDQTtBQUNEOztBQUVETSxLQUFHUCxLQUFILEVBQVVRLFFBQVYsRUFBb0I7QUFDbkIsUUFBSSxDQUFDLEtBQUtWLFFB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QUFDdkMsVUFBSSxLQUFLOUIsZ0JBQUwsS0FBMEIsS0FBMUIsSUFBbUN1RCxNQUFuQyxJQUE2Q0EsV0FBV3pCLGFBQWFBLFlBQWIsQ0FBMEJvQixVQUF0RixFQUFrRztBQUNqRztBQUNBOztBQUVELFVBQUksS0FBS3ZCLGFBQUwsQ0FBbUJHLGFBQWFBLFlBQWhDLEVBQThDVCxTQUE5QyxFQUF5RCxHQUFHOUMsSUFBNUQsQ0FBSixFQUF1RTtBQUN0RXVELHFCQUFhQSxZQUFiLENBQTBCZSxRQUExQixDQUFtQ1ksV0FBbkMsQ0FBK0MsS0FBS3hDLGdCQUFwRCxFQUFzRSxJQUF0RSxFQUE0RTtBQUMzRUkscUJBQVdBLFNBRGdFO0FBRTNFOUMsZ0JBQU1BO0FBRnFFLFNBQTVFO0FBSUE7QUFDRCxLQVhEO0FBWUE7O0FBRURGLE9BQUtnRCxTQUFMLEVBQWdCLEdBQUc5QyxJQUFuQixFQUF5QjtBQUN4QixTQUFLNkUsS0FBTCxDQUFXL0IsU0FBWCxFQUFzQjlDLElBQXRCLEVBQTRCa0IsU0FBNUIsRUFBdUMsSUFBdkM7QUFDQTs7QUFFRGlFLHVCQUFxQnJDLFNBQXJCLEVBQWdDLEdBQUc5QyxJQUFuQyxFQUF5QztBQUN4QyxTQUFLNkUsS0FBTCxDQUFXL0IsU0FBWCxFQUFzQjlDLElBQXRCLEVBQTRCa0IsU0FBNUIsRUFBdUMsS0FBdkM7QUFDQTs7QUE1VzBDLENBQTVDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfc3RyZWFtZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIEVWOnRydWUgKi9cbi8qIGV4cG9ydGVkIEVWICovXG5cbkVWID0gY2xhc3MgRVYge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmhhbmRsZXJzID0ge307XG5cdH1cblxuXHRlbWl0KGV2ZW50LCAuLi5hcmdzKSB7XG5cdFx0aWYgKHRoaXMuaGFuZGxlcnNbZXZlbnRdKSB7XG5cdFx0XHR0aGlzLmhhbmRsZXJzW2V2ZW50XS5mb3JFYWNoKChoYW5kbGVyKSA9PiBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpKTtcblx0XHR9XG5cdH1cblxuXHRlbWl0V2l0aFNjb3BlKGV2ZW50LCBzY29wZSwgLi4uYXJncykge1xuXHRcdGlmICh0aGlzLmhhbmRsZXJzW2V2ZW50XSkge1xuXHRcdFx0dGhpcy5oYW5kbGVyc1tldmVudF0uZm9yRWFjaCgoaGFuZGxlcikgPT4gaGFuZGxlci5hcHBseShzY29wZSwgYXJncykpO1xuXHRcdH1cblx0fVxuXG5cdG9uKGV2ZW50LCBjYWxsYmFjaykge1xuXHRcdGlmICghdGhpcy5oYW5kbGVyc1tldmVudF0pIHtcblx0XHRcdHRoaXMuaGFuZGxlcnNbZXZlbnRdID0gW107XG5cdFx0fVxuXHRcdHRoaXMuaGFuZGxlcnNbZXZlbnRdLnB1c2goY2FsbGJhY2spO1xuXHR9XG5cblx0b25jZShldmVudCwgY2FsbGJhY2spIHtcblx0XHRzZWxmID0gdGhpcztcblx0XHRzZWxmLm9uKGV2ZW50LCBmdW5jdGlvbiBvbmV0aW1lQ2FsbGJhY2soKSB7XG5cdFx0XHRjYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0c2VsZi5yZW1vdmVMaXN0ZW5lcihldmVudCwgb25ldGltZUNhbGxiYWNrKTtcblx0XHR9KTtcblx0fVxuXG5cdHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBjYWxsYmFjaykge1xuXHRcdGlmKHRoaXMuaGFuZGxlcnNbZXZlbnRdKSB7XG5cdFx0XHRjb25zdCBpbmRleCA9IHRoaXMuaGFuZGxlcnNbZXZlbnRdLmluZGV4T2YoY2FsbGJhY2spO1xuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0dGhpcy5oYW5kbGVyc1tldmVudF0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcblx0XHR0aGlzLmhhbmRsZXJzW2V2ZW50XSA9IHVuZGVmaW5lZDtcblx0fVxufTtcbiIsIi8qIGdsb2JhbHMgRVYgKi9cbi8qIGVzbGludCBuZXctY2FwOiBmYWxzZSAqL1xuXG5jbGFzcyBTdHJlYW1lckNlbnRyYWwgZXh0ZW5kcyBFViB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cblx0XHR0aGlzLmluc3RhbmNlcyA9IHt9O1xuXHR9XG59XG5cbk1ldGVvci5TdHJlYW1lckNlbnRyYWwgPSBuZXcgU3RyZWFtZXJDZW50cmFsO1xuXG5cbk1ldGVvci5TdHJlYW1lciA9IGNsYXNzIFN0cmVhbWVyIGV4dGVuZHMgRVYge1xuXHRjb25zdHJ1Y3RvcihuYW1lLCB7cmV0cmFuc21pdCA9IHRydWUsIHJldHJhbnNtaXRUb1NlbGYgPSBmYWxzZX0gPSB7fSkge1xuXHRcdGlmIChNZXRlb3IuU3RyZWFtZXJDZW50cmFsLmluc3RhbmNlc1tuYW1lXSkge1xuXHRcdFx0Y29uc29sZS53YXJuKCdTdHJlYW1lciBpbnN0YW5jZSBhbHJlYWR5IGV4aXN0czonLCBuYW1lKTtcblx0XHRcdHJldHVybiBNZXRlb3IuU3RyZWFtZXJDZW50cmFsLmluc3RhbmNlc1tuYW1lXTtcblx0XHR9XG5cblx0XHRzdXBlcigpO1xuXG5cdFx0TWV0ZW9yLlN0cmVhbWVyQ2VudHJhbC5pbnN0YW5jZXNbbmFtZV0gPSB0aGlzO1xuXG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLnJldHJhbnNtaXQgPSByZXRyYW5zbWl0O1xuXHRcdHRoaXMucmV0cmFuc21pdFRvU2VsZiA9IHJldHJhbnNtaXRUb1NlbGY7XG5cblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBbXTtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZSA9IHt9O1xuXHRcdHRoaXMudHJhbnNmb3JtZXJzID0ge307XG5cblx0XHR0aGlzLmluaVB1YmxpY2F0aW9uKCk7XG5cdFx0dGhpcy5pbml0TWV0aG9kKCk7XG5cblx0XHR0aGlzLl9hbGxvd1JlYWQgPSB7fTtcblx0XHR0aGlzLl9hbGxvd0VtaXQgPSB7fTtcblx0XHR0aGlzLl9hbGxvd1dyaXRlID0ge307XG5cblx0XHR0aGlzLmFsbG93UmVhZCgnbm9uZScpO1xuXHRcdHRoaXMuYWxsb3dFbWl0KCdhbGwnKTtcblx0XHR0aGlzLmFsbG93V3JpdGUoJ25vbmUnKTtcblx0fVxuXG5cdGdldCBuYW1lKCkge1xuXHRcdHJldHVybiB0aGlzLl9uYW1lO1xuXHR9XG5cblx0c2V0IG5hbWUobmFtZSkge1xuXHRcdGNoZWNrKG5hbWUsIFN0cmluZyk7XG5cdFx0dGhpcy5fbmFtZSA9IG5hbWU7XG5cdH1cblxuXHRnZXQgc3Vic2NyaXB0aW9uTmFtZSgpIHtcblx0XHRyZXR1cm4gYHN0cmVhbS0ke3RoaXMubmFtZX1gO1xuXHR9XG5cblx0Z2V0IHJldHJhbnNtaXQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3JldHJhbnNtaXQ7XG5cdH1cblxuXHRzZXQgcmV0cmFuc21pdChyZXRyYW5zbWl0KSB7XG5cdFx0Y2hlY2socmV0cmFuc21pdCwgQm9vbGVhbik7XG5cdFx0dGhpcy5fcmV0cmFuc21pdCA9IHJldHJhbnNtaXQ7XG5cdH1cblxuXHRnZXQgcmV0cmFuc21pdFRvU2VsZigpIHtcblx0XHRyZXR1cm4gdGhpcy5fcmV0cmFuc21pdFRvU2VsZjtcblx0fVxuXG5cdHNldCByZXRyYW5zbWl0VG9TZWxmKHJldHJhbnNtaXRUb1NlbGYpIHtcblx0XHRjaGVjayhyZXRyYW5zbWl0VG9TZWxmLCBCb29sZWFuKTtcblx0XHR0aGlzLl9yZXRyYW5zbWl0VG9TZWxmID0gcmV0cmFuc21pdFRvU2VsZjtcblx0fVxuXG5cdGFsbG93UmVhZChldmVudE5hbWUsIGZuKSB7XG5cdFx0aWYgKGZuID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGZuID0gZXZlbnROYW1lO1xuXHRcdFx0ZXZlbnROYW1lID0gJ19fYWxsX18nO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXSA9IGZuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZm4gPT09ICdzdHJpbmcnICYmIFsnYWxsJywgJ25vbmUnLCAnbG9nZ2VkJ10uaW5kZXhPZihmbikgPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhbGxvd1JlYWQgc2hvcnRjdXQgJyR7Zm59JyBpcyBpbnZhbGlkYCk7XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnYWxsJyB8fCBmbiA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93UmVhZFtldmVudE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoZm4gPT09ICdub25lJyB8fCBmbiA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2xvZ2dlZCcpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gQm9vbGVhbih0aGlzLnVzZXJJZCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdGFsbG93RW1pdChldmVudE5hbWUsIGZuKSB7XG5cdFx0aWYgKGZuID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGZuID0gZXZlbnROYW1lO1xuXHRcdFx0ZXZlbnROYW1lID0gJ19fYWxsX18nO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbZXZlbnROYW1lXSA9IGZuO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZm4gPT09ICdzdHJpbmcnICYmIFsnYWxsJywgJ25vbmUnLCAnbG9nZ2VkJ10uaW5kZXhPZihmbikgPT09IC0xKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGBhbGxvd1JlYWQgc2hvcnRjdXQgJyR7Zm59JyBpcyBpbnZhbGlkYCk7XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnYWxsJyB8fCBmbiA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93RW1pdFtldmVudE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoZm4gPT09ICdub25lJyB8fCBmbiA9PT0gZmFsc2UpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmIChmbiA9PT0gJ2xvZ2dlZCcpIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gQm9vbGVhbih0aGlzLnVzZXJJZCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdGFsbG93V3JpdGUoZXZlbnROYW1lLCBmbikge1xuXHRcdGlmIChmbiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRmbiA9IGV2ZW50TmFtZTtcblx0XHRcdGV2ZW50TmFtZSA9ICdfX2FsbF9fJztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZuID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dXcml0ZVtldmVudE5hbWVdID0gZm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBmbiA9PT0gJ3N0cmluZycgJiYgWydhbGwnLCAnbm9uZScsICdsb2dnZWQnXS5pbmRleE9mKGZuKSA9PT0gLTEpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYGFsbG93V3JpdGUgc2hvcnRjdXQgJyR7Zm59JyBpcyBpbnZhbGlkYCk7XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnYWxsJyB8fCBmbiA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93V3JpdGVbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnbm9uZScgfHwgZm4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fYWxsb3dXcml0ZVtldmVudE5hbWVdID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKGZuID09PSAnbG9nZ2VkJykge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93V3JpdGVbZXZlbnROYW1lXSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gQm9vbGVhbih0aGlzLnVzZXJJZCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fVxuXG5cdGlzUmVhZEFsbG93ZWQoc2NvcGUsIGV2ZW50TmFtZSwgYXJncykge1xuXHRcdGlmICh0aGlzLl9hbGxvd1JlYWRbZXZlbnROYW1lXSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX2FsbG93UmVhZFtldmVudE5hbWVdLmNhbGwoc2NvcGUsIGV2ZW50TmFtZSwgLi4uYXJncyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuX2FsbG93UmVhZFsnX19hbGxfXyddLmNhbGwoc2NvcGUsIGV2ZW50TmFtZSwgLi4uYXJncyk7XG5cdH1cblxuXHRpc0VtaXRBbGxvd2VkKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpIHtcblx0XHRpZiAodGhpcy5fYWxsb3dFbWl0W2V2ZW50TmFtZV0pIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbZXZlbnROYW1lXS5jYWxsKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLl9hbGxvd0VtaXRbJ19fYWxsX18nXS5jYWxsKHNjb3BlLCBldmVudE5hbWUsIC4uLmFyZ3MpO1xuXHR9XG5cblx0aXNXcml0ZUFsbG93ZWQoc2NvcGUsIGV2ZW50TmFtZSwgYXJncykge1xuXHRcdGlmICh0aGlzLl9hbGxvd1dyaXRlW2V2ZW50TmFtZV0pIHtcblx0XHRcdHJldHVybiB0aGlzLl9hbGxvd1dyaXRlW2V2ZW50TmFtZV0uY2FsbChzY29wZSwgZXZlbnROYW1lLCAuLi5hcmdzKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5fYWxsb3dXcml0ZVsnX19hbGxfXyddLmNhbGwoc2NvcGUsIGV2ZW50TmFtZSwgLi4uYXJncyk7XG5cdH1cblxuXHRhZGRTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uLCBldmVudE5hbWUpIHtcblx0XHR0aGlzLnN1YnNjcmlwdGlvbnMucHVzaChzdWJzY3JpcHRpb24pO1xuXG5cdFx0aWYgKCF0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZVtldmVudE5hbWVdKSB7XG5cdFx0XHR0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZVtldmVudE5hbWVdID0gW107XG5cdFx0fVxuXG5cdFx0dGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWVbZXZlbnROYW1lXS5wdXNoKHN1YnNjcmlwdGlvbik7XG5cdH1cblxuXHRyZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uLCBldmVudE5hbWUpIHtcblx0XHRjb25zdCBpbmRleCA9IHRoaXMuc3Vic2NyaXB0aW9ucy5pbmRleE9mKHN1YnNjcmlwdGlvbik7XG5cdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdHRoaXMuc3Vic2NyaXB0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZVtldmVudE5hbWVdKSB7XG5cdFx0XHRjb25zdCBpbmRleCA9IHRoaXMuc3Vic2NyaXB0aW9uc0J5RXZlbnROYW1lW2V2ZW50TmFtZV0uaW5kZXhPZihzdWJzY3JpcHRpb24pO1xuXHRcdFx0aWYgKGluZGV4ID4gLTEpIHtcblx0XHRcdFx0dGhpcy5zdWJzY3JpcHRpb25zQnlFdmVudE5hbWVbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRyYW5zZm9ybShldmVudE5hbWUsIGZuKSB7XG5cdFx0aWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGZuID0gZXZlbnROYW1lO1xuXHRcdFx0ZXZlbnROYW1lID0gJ19fYWxsX18nO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy50cmFuc2Zvcm1lcnNbZXZlbnROYW1lXSkge1xuXHRcdFx0dGhpcy50cmFuc2Zvcm1lcnNbZXZlbnROYW1lXSA9IFtdO1xuXHRcdH1cblxuXHRcdHRoaXMudHJhbnNmb3JtZXJzW2V2ZW50TmFtZV0ucHVzaChmbik7XG5cdH1cblxuXHRhcHBseVRyYW5zZm9ybWVycyhtZXRob2RTY29wZSwgZXZlbnROYW1lLCBhcmdzKSB7XG5cdFx0aWYgKHRoaXMudHJhbnNmb3JtZXJzWydfX2FsbF9fJ10pIHtcblx0XHRcdHRoaXMudHJhbnNmb3JtZXJzWydfX2FsbF9fJ10uZm9yRWFjaCgodHJhbnNmb3JtKSA9PiB7XG5cdFx0XHRcdGFyZ3MgPSB0cmFuc2Zvcm0uY2FsbChtZXRob2RTY29wZSwgZXZlbnROYW1lLCBhcmdzKTtcblx0XHRcdFx0bWV0aG9kU2NvcGUudHJhbmZvcm1lZCA9IHRydWU7XG5cdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShhcmdzKSkge1xuXHRcdFx0XHRcdGFyZ3MgPSBbYXJnc107XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRyYW5zZm9ybWVyc1tldmVudE5hbWVdKSB7XG5cdFx0XHR0aGlzLnRyYW5zZm9ybWVyc1tldmVudE5hbWVdLmZvckVhY2goKHRyYW5zZm9ybSkgPT4ge1xuXHRcdFx0XHRhcmdzID0gdHJhbnNmb3JtLmNhbGwobWV0aG9kU2NvcGUsIC4uLmFyZ3MpO1xuXHRcdFx0XHRtZXRob2RTY29wZS50cmFuZm9ybWVkID0gdHJ1ZTtcblx0XHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KGFyZ3MpKSB7XG5cdFx0XHRcdFx0YXJncyA9IFthcmdzXTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGFyZ3M7XG5cdH1cblxuXHRpbmlQdWJsaWNhdGlvbigpIHtcblx0XHRjb25zdCBzdHJlYW0gPSB0aGlzO1xuXHRcdE1ldGVvci5wdWJsaXNoKHRoaXMuc3Vic2NyaXB0aW9uTmFtZSwgZnVuY3Rpb24oZXZlbnROYW1lLCBvcHRpb25zKSB7XG5cdFx0XHRjaGVjayhldmVudE5hbWUsIFN0cmluZyk7XG5cblx0XHRcdGxldCB1c2VDb2xsZWN0aW9uLCBhcmdzID0gW107XG5cblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0XHRcdHVzZUNvbGxlY3Rpb24gPSBvcHRpb25zO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKG9wdGlvbnMudXNlQ29sbGVjdGlvbikge1xuXHRcdFx0XHRcdHVzZUNvbGxlY3Rpb24gPSBvcHRpb25zLnVzZUNvbGxlY3Rpb247XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAob3B0aW9ucy5hcmdzKSB7XG5cdFx0XHRcdFx0YXJncyA9IG9wdGlvbnMuYXJncztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZXZlbnROYW1lLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHR0aGlzLnN0b3AoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc3RyZWFtLmlzUmVhZEFsbG93ZWQodGhpcywgZXZlbnROYW1lLCBhcmdzKSAhPT0gdHJ1ZSkge1xuXHRcdFx0XHR0aGlzLnN0b3AoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdWJzY3JpcHRpb24gPSB7XG5cdFx0XHRcdHN1YnNjcmlwdGlvbjogdGhpcyxcblx0XHRcdFx0ZXZlbnROYW1lOiBldmVudE5hbWVcblx0XHRcdH07XG5cblx0XHRcdHN0cmVhbS5hZGRTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uLCBldmVudE5hbWUpO1xuXG5cdFx0XHR0aGlzLm9uU3RvcCgoKSA9PiB7XG5cdFx0XHRcdHN0cmVhbS5yZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uLCBldmVudE5hbWUpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICh1c2VDb2xsZWN0aW9uID09PSB0cnVlKSB7XG5cdFx0XHRcdC8vIENvbGxlY3Rpb24gY29tcGF0aWJpbGl0eVxuXHRcdFx0XHR0aGlzLl9zZXNzaW9uLnNlbmRBZGRlZChzdHJlYW0uc3Vic2NyaXB0aW9uTmFtZSwgJ2lkJywge1xuXHRcdFx0XHRcdGV2ZW50TmFtZTogZXZlbnROYW1lXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJlYWR5KCk7XG5cdFx0fSk7XG5cdH1cblxuXHRpbml0TWV0aG9kKCkge1xuXHRcdGNvbnN0IHN0cmVhbSA9IHRoaXM7XG5cdFx0Y29uc3QgbWV0aG9kID0ge307XG5cblx0XHRtZXRob2RbdGhpcy5zdWJzY3JpcHRpb25OYW1lXSA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgLi4uYXJncykge1xuXHRcdFx0Y2hlY2soZXZlbnROYW1lLCBTdHJpbmcpO1xuXHRcdFx0Y2hlY2soYXJncywgQXJyYXkpO1xuXG5cdFx0XHR0aGlzLnVuYmxvY2soKTtcblxuXHRcdFx0aWYgKHN0cmVhbS5pc1dyaXRlQWxsb3dlZCh0aGlzLCBldmVudE5hbWUsIGFyZ3MpICE9PSB0cnVlKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgbWV0aG9kU2NvcGUgPSB7XG5cdFx0XHRcdHVzZXJJZDogdGhpcy51c2VySWQsXG5cdFx0XHRcdGNvbm5lY3Rpb246IHRoaXMuY29ubmVjdGlvbixcblx0XHRcdFx0b3JpZ2luYWxQYXJhbXM6IGFyZ3MsXG5cdFx0XHRcdHRyYW5mb3JtZWQ6IGZhbHNlXG5cdFx0XHR9O1xuXG5cdFx0XHRhcmdzID0gc3RyZWFtLmFwcGx5VHJhbnNmb3JtZXJzKG1ldGhvZFNjb3BlLCBldmVudE5hbWUsIGFyZ3MpO1xuXG5cdFx0XHRzdHJlYW0uZW1pdFdpdGhTY29wZShldmVudE5hbWUsIG1ldGhvZFNjb3BlLCAuLi5hcmdzKTtcblxuXHRcdFx0aWYgKHN0cmVhbS5yZXRyYW5zbWl0ID09PSB0cnVlKSB7XG5cdFx0XHRcdHN0cmVhbS5fZW1pdChldmVudE5hbWUsIGFyZ3MsIHRoaXMuY29ubmVjdGlvbiwgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHRyeSB7XG5cdFx0XHRNZXRlb3IubWV0aG9kcyhtZXRob2QpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZSk7XG5cdFx0fVxuXHR9XG5cblx0X2VtaXQoZXZlbnROYW1lLCBhcmdzLCBvcmlnaW4sIGJyb2FkY2FzdCkge1xuXHRcdGlmIChicm9hZGNhc3QgPT09IHRydWUpIHtcblx0XHRcdE1ldGVvci5TdHJlYW1lckNlbnRyYWwuZW1pdCgnYnJvYWRjYXN0JywgdGhpcy5uYW1lLCBldmVudE5hbWUsIGFyZ3MpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbnMgPSB0aGlzLnN1YnNjcmlwdGlvbnNCeUV2ZW50TmFtZVtldmVudE5hbWVdO1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShzdWJzY3JpcHRpb25zKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHN1YnNjcmlwdGlvbnMuZm9yRWFjaCgoc3Vic2NyaXB0aW9uKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5yZXRyYW5zbWl0VG9TZWxmID09PSBmYWxzZSAmJiBvcmlnaW4gJiYgb3JpZ2luID09PSBzdWJzY3JpcHRpb24uc3Vic2NyaXB0aW9uLmNvbm5lY3Rpb24pIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5pc0VtaXRBbGxvd2VkKHN1YnNjcmlwdGlvbi5zdWJzY3JpcHRpb24sIGV2ZW50TmFtZSwgLi4uYXJncykpIHtcblx0XHRcdFx0c3Vic2NyaXB0aW9uLnN1YnNjcmlwdGlvbi5fc2Vzc2lvbi5zZW5kQ2hhbmdlZCh0aGlzLnN1YnNjcmlwdGlvbk5hbWUsICdpZCcsIHtcblx0XHRcdFx0XHRldmVudE5hbWU6IGV2ZW50TmFtZSxcblx0XHRcdFx0XHRhcmdzOiBhcmdzXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0ZW1pdChldmVudE5hbWUsIC4uLmFyZ3MpIHtcblx0XHR0aGlzLl9lbWl0KGV2ZW50TmFtZSwgYXJncywgdW5kZWZpbmVkLCB0cnVlKTtcblx0fVxuXG5cdGVtaXRXaXRob3V0QnJvYWRjYXN0KGV2ZW50TmFtZSwgLi4uYXJncykge1xuXHRcdHRoaXMuX2VtaXQoZXZlbnROYW1lLCBhcmdzLCB1bmRlZmluZWQsIGZhbHNlKTtcblx0fVxufTtcbiJdfQ==
