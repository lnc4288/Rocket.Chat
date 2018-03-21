(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var ECMAScript = Package.ecmascript.ECMAScript;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Migrations, migrated;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:migrations":{"migrations.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_migrations/migrations.js                                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 1);

/*
	Adds migration capabilities. Migrations are defined like:

	Migrations.add({
		up: function() {}, //*required* code to run to migrate upwards
		version: 1, //*required* number to identify migration order
		down: function() {}, //*optional* code to run to migrate downwards
		name: 'Something' //*optional* display name for the migration
	});

	The ordering of migrations is determined by the version you set.

	To run the migrations, set the MIGRATE environment variable to either
	'latest' or the version number you want to migrate to. Optionally, append
	',exit' if you want the migrations to exit the meteor process, e.g if you're
	migrating from a script (remember to pass the --once parameter).

	e.g:
	MIGRATE="latest" mrt # ensure we'll be at the latest version and run the app
	MIGRATE="latest,exit" mrt --once # ensure we'll be at the latest version and exit
	MIGRATE="2,exit" mrt --once # migrate to version 2 and exit

	Note: Migrations will lock ensuring only 1 app can be migrating at once. If
	a migration crashes, the control record in the migrations collection will
	remain locked and at the version it was at previously, however the db could
	be in an inconsistant state.
*/
// since we'll be at version 0 by default, we should have a migration set for it.
var DefaultMigration = {
  version: 0,
  up: function () {// @TODO: check if collection "migrations" exist
    // If exists, rename and rerun _migrateTo
  }
};
Migrations = {
  _list: [DefaultMigration],
  options: {
    // false disables logging
    log: true,
    // null or a function
    logger: null,
    // enable/disable info log "already at latest."
    logIfLatest: true,
    // lock will be valid for this amount of minutes
    lockExpiration: 5,
    // retry interval in seconds
    retryInterval: 10,
    // max number of attempts to retry unlock
    maxAttempts: 30,
    // migrations collection name
    collectionName: "migrations" // collectionName: "rocketchat_migrations"

  },
  config: function (opts) {
    this.options = _.extend({}, this.options, opts);
  }
};
Migrations._collection = new Mongo.Collection(Migrations.options.collectionName);
/* Create a box around messages for displaying on a console.log */

function makeABox(message, color = 'red') {
  if (!_.isArray(message)) {
    message = message.split("\n");
  }

  let len = _(message).reduce(function (memo, msg) {
    return Math.max(memo, msg.length);
  }, 0) + 4;
  let text = message.map(msg => {
    return "|"[color] + s.lrpad(msg, len)[color] + "|"[color];
  }).join("\n");
  let topLine = "+"[color] + s.pad('', len, '-')[color] + "+"[color];
  let separator = "|"[color] + s.pad('', len, '') + "|"[color];
  let bottomLine = "+"[color] + s.pad('', len, '-')[color] + "+"[color];
  return `\n${topLine}\n${separator}\n${text}\n${separator}\n${bottomLine}\n`;
}
/*
	Logger factory function. Takes a prefix string and options object
	and uses an injected `logger` if provided, else falls back to
	Meteor's `Log` package.
	Will send a log object to the injected logger, on the following form:
		message: String
		level: String (info, warn, error, debug)
		tag: 'Migrations'
*/


function createLogger(prefix) {
  check(prefix, String); // Return noop if logging is disabled.

  if (Migrations.options.log === false) {
    return function () {};
  }

  return function (level, message) {
    check(level, Match.OneOf('info', 'error', 'warn', 'debug'));
    check(message, Match.OneOf(String, [String]));
    var logger = Migrations.options && Migrations.options.logger;

    if (logger && _.isFunction(logger)) {
      logger({
        level: level,
        message: message,
        tag: prefix
      });
    } else {
      Log[level]({
        message: prefix + ': ' + message
      });
    }
  };
}

var log;
var options = Migrations.options; // collection holding the control record

log = createLogger('Migrations');
['info', 'warn', 'error', 'debug'].forEach(function (level) {
  log[level] = _.partial(log, level);
}); // if (process.env.MIGRATE)
//   Migrations.migrateTo(process.env.MIGRATE);
// Add a new migration:
// {up: function *required
//  version: Number *required
//  down: function *optional
//  name: String *optional
// }

Migrations.add = function (migration) {
  if (typeof migration.up !== 'function') throw new Meteor.Error('Migration must supply an up function.');
  if (typeof migration.version !== 'number') throw new Meteor.Error('Migration must supply a version number.');
  if (migration.version <= 0) throw new Meteor.Error('Migration version must be greater than 0'); // Freeze the migration object to make it hereafter immutable

  Object.freeze(migration);

  this._list.push(migration);

  this._list = _.sortBy(this._list, function (m) {
    return m.version;
  });
}; // Attempts to run the migrations using command in the form of:
// e.g 'latest', 'latest,exit', 2
// use 'XX,rerun' to re-run the migration at that version


Migrations.migrateTo = function (command) {
  if (_.isUndefined(command) || command === '' || this._list.length === 0) throw new Error("Cannot migrate using invalid command: " + command);

  if (typeof command === 'number') {
    var version = command;
  } else {
    var version = command.split(',')[0];
    var subcommand = command.split(',')[1];
  }

  const maxAttempts = Migrations.options.maxAttempts;
  const retryInterval = Migrations.options.retryInterval;

  for (let attempts = 1; attempts <= maxAttempts; attempts++) {
    if (version === 'latest') {
      migrated = this._migrateTo(_.last(this._list).version);
    } else {
      migrated = this._migrateTo(parseInt(version), subcommand === 'rerun');
    }

    if (migrated) {
      break;
    } else {
      let willRetry;

      if (attempts < maxAttempts) {
        willRetry = ` Trying again in ${retryInterval} seconds.`;

        Meteor._sleepForMs(retryInterval * 1000);
      } else {
        willRetry = "";
      }

      console.log(`Not migrating, control is locked. Attempt ${attempts}/${maxAttempts}.${willRetry}`.yellow);
    }
  }

  if (!migrated) {
    let control = this._getControl(); // Side effect: upserts control document.


    console.log(makeABox(["ERROR! SERVER STOPPED", "", "Your database migration control is locked.", "Please make sure you are running the latest version and try again.", "If the problem persists, please contact support.", "", "This Rocket.Chat version: " + RocketChat.Info.version, "Database locked at version: " + control.version, "Database target version: " + (version === 'latest' ? _.last(this._list).version : version), "", "Commit: " + RocketChat.Info.commit.hash, "Date: " + RocketChat.Info.commit.date, "Branch: " + RocketChat.Info.commit.branch, "Tag: " + RocketChat.Info.commit.tag]));
    process.exit(1);
  } // remember to run meteor with --once otherwise it will restart


  if (subcommand === 'exit') process.exit(0);
}; // just returns the current version


Migrations.getVersion = function () {
  return this._getControl().version;
}; // migrates to the specific version passed in


Migrations._migrateTo = function (version, rerun) {
  var self = this;

  var control = this._getControl(); // Side effect: upserts control document.


  var currentVersion = control.version;

  if (lock() === false) {
    // log.info('Not migrating, control is locked.');
    // Warning
    return false;
  }

  if (rerun) {
    log.info('Rerunning version ' + version);
    migrate('up', this._findIndexByVersion(version));
    log.info('Finished migrating.');
    unlock();
    return true;
  }

  if (currentVersion === version) {
    if (this.options.logIfLatest) {
      log.info('Not migrating, already at version ' + version);
    }

    unlock();
    return true;
  }

  var startIdx = this._findIndexByVersion(currentVersion);

  var endIdx = this._findIndexByVersion(version); // log.info('startIdx:' + startIdx + ' endIdx:' + endIdx);


  log.info('Migrating from version ' + this._list[startIdx].version + ' -> ' + this._list[endIdx].version); // run the actual migration

  function migrate(direction, idx) {
    var migration = self._list[idx];

    if (typeof migration[direction] !== 'function') {
      unlock();
      throw new Meteor.Error('Cannot migrate ' + direction + ' on version ' + migration.version);
    }

    function maybeName() {
      return migration.name ? ' (' + migration.name + ')' : '';
    }

    log.info('Running ' + direction + '() on version ' + migration.version + maybeName());

    try {
      RocketChat.models._CacheControl.withValue(false, function () {
        migration[direction](migration);
      });
    } catch (e) {
      console.log(makeABox(["ERROR! SERVER STOPPED", "", "Your database migration failed:", e.message, "", "Please make sure you are running the latest version and try again.", "If the problem persists, please contact support.", "", "This Rocket.Chat version: " + RocketChat.Info.version, "Database locked at version: " + control.version, "Database target version: " + version, "", "Commit: " + RocketChat.Info.commit.hash, "Date: " + RocketChat.Info.commit.date, "Branch: " + RocketChat.Info.commit.branch, "Tag: " + RocketChat.Info.commit.tag]));
      process.exit(1);
    }
  } // Returns true if lock was acquired.


  function lock() {
    const date = new Date();
    const dateMinusInterval = moment(date).subtract(self.options.lockExpiration, 'minutes').toDate();
    const build = RocketChat.Info ? RocketChat.Info.build.date : date; // This is atomic. The selector ensures only one caller at a time will see
    // the unlocked control, and locking occurs in the same update's modifier.
    // All other simultaneous callers will get false back from the update.

    return self._collection.update({
      _id: 'control',
      $or: [{
        locked: false
      }, {
        lockedAt: {
          $lt: dateMinusInterval
        }
      }, {
        buildAt: {
          $ne: build
        }
      }]
    }, {
      $set: {
        locked: true,
        lockedAt: date,
        buildAt: build
      }
    }) === 1;
  } // Side effect: saves version.


  function unlock() {
    self._setControl({
      locked: false,
      version: currentVersion
    });
  }

  if (currentVersion < version) {
    for (var i = startIdx; i < endIdx; i++) {
      migrate('up', i + 1);
      currentVersion = self._list[i + 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  } else {
    for (var i = startIdx; i > endIdx; i--) {
      migrate('down', i);
      currentVersion = self._list[i - 1].version;

      self._setControl({
        locked: true,
        version: currentVersion
      });
    }
  }

  unlock();
  log.info('Finished migrating.');
}; // gets the current control record, optionally creating it if non-existant


Migrations._getControl = function () {
  var control = this._collection.findOne({
    _id: 'control'
  });

  return control || this._setControl({
    version: 0,
    locked: false
  });
}; // sets the control record


Migrations._setControl = function (control) {
  // be quite strict
  check(control.version, Number);
  check(control.locked, Boolean);

  this._collection.update({
    _id: 'control'
  }, {
    $set: {
      version: control.version,
      locked: control.locked
    }
  }, {
    upsert: true
  });

  return control;
}; // returns the migration index in _list or throws if not found


Migrations._findIndexByVersion = function (version) {
  for (var i = 0; i < this._list.length; i++) {
    if (this._list[i].version === version) return i;
  }

  throw new Meteor.Error('Can\'t find migration version ' + version);
}; //reset (mainly intended for tests)


Migrations._reset = function () {
  this._list = [{
    version: 0,
    up: function () {}
  }];

  this._collection.remove({});
};

RocketChat.Migrations = Migrations;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:migrations/migrations.js");

/* Exports */
Package._define("rocketchat:migrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_migrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDptaWdyYXRpb25zL21pZ3JhdGlvbnMuanMiXSwibmFtZXMiOlsiXyIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2IiwibW9tZW50IiwiRGVmYXVsdE1pZ3JhdGlvbiIsInZlcnNpb24iLCJ1cCIsIk1pZ3JhdGlvbnMiLCJfbGlzdCIsIm9wdGlvbnMiLCJsb2ciLCJsb2dnZXIiLCJsb2dJZkxhdGVzdCIsImxvY2tFeHBpcmF0aW9uIiwicmV0cnlJbnRlcnZhbCIsIm1heEF0dGVtcHRzIiwiY29sbGVjdGlvbk5hbWUiLCJjb25maWciLCJvcHRzIiwiZXh0ZW5kIiwiX2NvbGxlY3Rpb24iLCJNb25nbyIsIkNvbGxlY3Rpb24iLCJtYWtlQUJveCIsIm1lc3NhZ2UiLCJjb2xvciIsImlzQXJyYXkiLCJzcGxpdCIsImxlbiIsInJlZHVjZSIsIm1lbW8iLCJtc2ciLCJNYXRoIiwibWF4IiwibGVuZ3RoIiwidGV4dCIsIm1hcCIsInMiLCJscnBhZCIsImpvaW4iLCJ0b3BMaW5lIiwicGFkIiwic2VwYXJhdG9yIiwiYm90dG9tTGluZSIsImNyZWF0ZUxvZ2dlciIsInByZWZpeCIsImNoZWNrIiwiU3RyaW5nIiwibGV2ZWwiLCJNYXRjaCIsIk9uZU9mIiwiaXNGdW5jdGlvbiIsInRhZyIsIkxvZyIsImZvckVhY2giLCJwYXJ0aWFsIiwiYWRkIiwibWlncmF0aW9uIiwiTWV0ZW9yIiwiRXJyb3IiLCJPYmplY3QiLCJmcmVlemUiLCJwdXNoIiwic29ydEJ5IiwibSIsIm1pZ3JhdGVUbyIsImNvbW1hbmQiLCJpc1VuZGVmaW5lZCIsInN1YmNvbW1hbmQiLCJhdHRlbXB0cyIsIm1pZ3JhdGVkIiwiX21pZ3JhdGVUbyIsImxhc3QiLCJwYXJzZUludCIsIndpbGxSZXRyeSIsIl9zbGVlcEZvck1zIiwiY29uc29sZSIsInllbGxvdyIsImNvbnRyb2wiLCJfZ2V0Q29udHJvbCIsIlJvY2tldENoYXQiLCJJbmZvIiwiY29tbWl0IiwiaGFzaCIsImRhdGUiLCJicmFuY2giLCJwcm9jZXNzIiwiZXhpdCIsImdldFZlcnNpb24iLCJyZXJ1biIsInNlbGYiLCJjdXJyZW50VmVyc2lvbiIsImxvY2siLCJpbmZvIiwibWlncmF0ZSIsIl9maW5kSW5kZXhCeVZlcnNpb24iLCJ1bmxvY2siLCJzdGFydElkeCIsImVuZElkeCIsImRpcmVjdGlvbiIsImlkeCIsIm1heWJlTmFtZSIsIm5hbWUiLCJtb2RlbHMiLCJfQ2FjaGVDb250cm9sIiwid2l0aFZhbHVlIiwiZSIsIkRhdGUiLCJkYXRlTWludXNJbnRlcnZhbCIsInN1YnRyYWN0IiwidG9EYXRlIiwiYnVpbGQiLCJ1cGRhdGUiLCJfaWQiLCIkb3IiLCJsb2NrZWQiLCJsb2NrZWRBdCIsIiRsdCIsImJ1aWxkQXQiLCIkbmUiLCIkc2V0IiwiX3NldENvbnRyb2wiLCJpIiwiZmluZE9uZSIsIk51bWJlciIsIkJvb2xlYW4iLCJ1cHNlcnQiLCJfcmVzZXQiLCJyZW1vdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxNQUFKO0FBQVdMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLGFBQU9ELENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7O0FBR3pFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkE7QUFDQSxJQUFJRSxtQkFBbUI7QUFDdEJDLFdBQVMsQ0FEYTtBQUV0QkMsTUFBSSxZQUFXLENBQ2Q7QUFDQTtBQUNBO0FBTHFCLENBQXZCO0FBUUFDLGFBQWE7QUFDWkMsU0FB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V0FBTCxDQUFpQjRGLE1BQWpCLENBQXdCO0FBQ3ZCQyxTQUFLO0FBRGtCLEdBQXhCLEVBRUc7QUFDRk8sVUFBTTtBQUNMbkgsZUFBU3lFLFFBQVF6RSxPQURaO0FBRUw4RyxjQUFRckMsUUFBUXFDO0FBRlg7QUFESixHQUZILEVBT0c7QUFDRlcsWUFBUTtBQUROLEdBUEg7O0FBV0EsU0FBT2hELE9BQVA7QUFDQSxDQWpCRCxDLENBbUJBOzs7QUFDQXZFLFdBQVd3RixtQkFBWCxHQUFpQyxVQUFTMUYsT0FBVCxFQUFrQjtBQUNsRCxPQUFLLElBQUlxSCxJQUFJLENBQWIsRUFBZ0JBLElBQUksS0FBS2xILEtBQUwsQ0FBVzBCLE1BQS9CLEVBQXVDd0YsR0FBdkMsRUFBNEM7QUFDM0MsUUFBSSxLQUFLbEgsS0FBTCxDQUFXa0gsQ0FBWCxFQUFjckgsT0FBZCxLQUEwQkEsT0FBOUIsRUFDQyxPQUFPcUgsQ0FBUDtBQUNEOztBQUVELFFBQU0sSUFBSWhFLE9BQU9DLEtBQVgsQ0FBaUIsbUNBQW1DdEQsT0FBcEQsQ0FBTjtBQUNBLENBUEQsQyxDQVNBOzs7QUFDQUUsV0FBV3dILE1BQVgsR0FBb0IsWUFBVztBQUM5QixPQUFLdkgsS0FBTCxHQUFhLENBQUM7QUFDYkgsYUFBUyxDQURJO0FBRWJDLFFBQUksWUFBVyxDQUFFO0FBRkosR0FBRCxDQUFiOztBQUlBLE9BQUtjLFdBQUwsQ0FBaUI0RyxNQUFqQixDQUF3QixFQUF4QjtBQUNBLENBTkQ7O0FBUUFoRCxXQUFXekUsVUFBWCxHQUF3QkEsVUFBeEIsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9taWdyYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IG1vbWVudCBmcm9tICdtb21lbnQnO1xuLypcblx0QWRkcyBtaWdyYXRpb24gY2FwYWJpbGl0aWVzLiBNaWdyYXRpb25zIGFyZSBkZWZpbmVkIGxpa2U6XG5cblx0TWlncmF0aW9ucy5hZGQoe1xuXHRcdHVwOiBmdW5jdGlvbigpIHt9LCAvLypyZXF1aXJlZCogY29kZSB0byBydW4gdG8gbWlncmF0ZSB1cHdhcmRzXG5cdFx0dmVyc2lvbjogMSwgLy8qcmVxdWlyZWQqIG51bWJlciB0byBpZGVudGlmeSBtaWdyYXRpb24gb3JkZXJcblx0XHRkb3duOiBmdW5jdGlvbigpIHt9LCAvLypvcHRpb25hbCogY29kZSB0byBydW4gdG8gbWlncmF0ZSBkb3dud2FyZHNcblx0XHRuYW1lOiAnU29tZXRoaW5nJyAvLypvcHRpb25hbCogZGlzcGxheSBuYW1lIGZvciB0aGUgbWlncmF0aW9uXG5cdH0pO1xuXG5cdFRoZSBvcmRlcmluZyBvZiBtaWdyYXRpb25zIGlzIGRldGVybWluZWQgYnkgdGhlIHZlcnNpb24geW91IHNldC5cblxuXHRUbyBydW4gdGhlIG1pZ3JhdGlvbnMsIHNldCB0aGUgTUlHUkFURSBlbnZpcm9ubWVudCB2YXJpYWJsZSB0byBlaXRoZXJcblx0J2xhdGVzdCcgb3IgdGhlIHZlcnNpb24gbnVtYmVyIHlvdSB3YW50IHRvIG1pZ3JhdGUgdG8uIE9wdGlvbmFsbHksIGFwcGVuZFxuXHQnLGV4aXQnIGlmIHlvdSB3YW50IHRoZSBtaWdyYXRpb25zIHRvIGV4aXQgdGhlIG1ldGVvciBwcm9jZXNzLCBlLmcgaWYgeW91J3JlXG5cdG1pZ3JhdGluZyBmcm9tIGEgc2NyaXB0IChyZW1lbWJlciB0byBwYXNzIHRoZSAtLW9uY2UgcGFyYW1ldGVyKS5cblxuXHRlLmc6XG5cdE1JR1JBVEU9XCJsYXRlc3RcIiBtcnQgIyBlbnN1cmUgd2UnbGwgYmUgYXQgdGhlIGxhdGVzdCB2ZXJzaW9uIGFuZCBydW4gdGhlIGFwcFxuXHRNSUdSQVRFPVwibGF0ZXN0LGV4aXRcIiBtcnQgLS1vbmNlICMgZW5zdXJlIHdlJ2xsIGJlIGF0IHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgZXhpdFxuXHRNSUdSQVRFPVwiMixleGl0XCIgbXJ0IC0tb25jZSAjIG1pZ3JhdGUgdG8gdmVyc2lvbiAyIGFuZCBleGl0XG5cblx0Tm90ZTogTWlncmF0aW9ucyB3aWxsIGxvY2sgZW5zdXJpbmcgb25seSAxIGFwcCBjYW4gYmUgbWlncmF0aW5nIGF0IG9uY2UuIElmXG5cdGEgbWlncmF0aW9uIGNyYXNoZXMsIHRoZSBjb250cm9sIHJlY29yZCBpbiB0aGUgbWlncmF0aW9ucyBjb2xsZWN0aW9uIHdpbGxcblx0cmVtYWluIGxvY2tlZCBhbmQgYXQgdGhlIHZlcnNpb24gaXQgd2FzIGF0IHByZXZpb3VzbHksIGhvd2V2ZXIgdGhlIGRiIGNvdWxkXG5cdGJlIGluIGFuIGluY29uc2lzdGFudCBzdGF0ZS5cbiovXG5cbi8vIHNpbmNlIHdlJ2xsIGJlIGF0IHZlcnNpb24gMCBieSBkZWZhdWx0LCB3ZSBzaG91bGQgaGF2ZSBhIG1pZ3JhdGlvbiBzZXQgZm9yIGl0LlxudmFyIERlZmF1bHRNaWdyYXRpb24gPSB7XG5cdHZlcnNpb246IDAsXG5cdHVwOiBmdW5jdGlvbigpIHtcblx0XHQvLyBAVE9ETzogY2hlY2sgaWYgY29sbGVjdGlvbiBcIm1pZ3JhdGlvbnNcIiBleGlzdFxuXHRcdC8vIElmIGV4aXN0cywgcmVuYW1lIGFuZCByZXJ1biBfbWlncmF0ZVRvXG5cdH1cbn07XG5cbk1pZ3JhdGlvbnMgPSB7XG5cdF9saXN0OiBbRGVmYXVsdE1pZ3JhdGlvbl0sXG5cdG9wdGlvbnM6IHtcblx0XHQvLyBmYWxzZSBkaXNhYmxlcyBsb2dnaW5nXG5cdFx0bG9nOiB0cnVlLFxuXHRcdC8vIG51bGwgb3IgYSBmdW5jdGlvblxuXHRcdGxvZ2dlcjogbnVsbCxcblx0XHQvLyBlbmFibGUvZGlzYWJsZSBpbmZvIGxvZyBcImFscmVhZHkgYXQgbGF0ZXN0LlwiXG5cdFx0bG9nSWZMYXRlc3Q6IHRydWUsXG5cdFx0Ly8gbG9jayB3aWxsIGJlIHZhbGlkIGZvciB0aGlzIGFtb3VudCBvZiBtaW51dGVzXG5cdFx0bG9ja0V4cGlyYXRpb246IDUsXG5cdFx0Ly8gcmV0cnkgaW50ZXJ2YWwgaW4gc2Vjb25kc1xuXHRcdHJldHJ5SW50ZXJ2YWw6IDEwLFxuXHRcdC8vIG1heCBudW1iZXIgb2YgYXR0ZW1wdHMgdG8gcmV0cnkgdW5sb2NrXG5cdFx0bWF4QXR0ZW1wdHM6IDMwLFxuXHRcdC8vIG1pZ3JhdGlvbnMgY29sbGVjdGlvbiBuYW1lXG5cdFx0Y29sbGVjdGlvbk5hbWU6IFwibWlncmF0aW9uc1wiXG5cdFx0XHQvLyBjb2xsZWN0aW9uTmFtZTogXCJyb2NrZXRjaGF0X21pZ3JhdGlvbnNcIlxuXHR9LFxuXHRjb25maWc6IGZ1bmN0aW9uKG9wdHMpIHtcblx0XHR0aGlzLm9wdGlvbnMgPSBfLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRzKTtcblx0fSxcbn1cblxuTWlncmF0aW9ucy5fY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKE1pZ3JhdGlvbnMub3B0aW9ucy5jb2xsZWN0aW9uTmFtZSk7XG5cbi8qIENyZWF0ZSBhIGJveCBhcm91bmQgbWVzc2FnZXMgZm9yIGRpc3BsYXlpbmcgb24gYSBjb25zb2xlLmxvZyAqL1xuZnVuY3Rpb24gbWFrZUFCb3gobWVzc2FnZSwgY29sb3IgPSAncmVkJykge1xuXHRpZiAoIV8uaXNBcnJheShtZXNzYWdlKSkge1xuXHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnNwbGl0KFwiXFxuXCIpO1xuXHR9XG5cdGxldCBsZW4gPSBfKG1lc3NhZ2UpLnJlZHVjZShmdW5jdGlvbihtZW1vLCBtc2cpIHtcblx0XHRyZXR1cm4gTWF0aC5tYXgobWVtbywgbXNnLmxlbmd0aClcblx0fSwgMCkgKyA0O1xuXHRsZXQgdGV4dCA9IG1lc3NhZ2UubWFwKChtc2cpID0+IHtcblx0XHRyZXR1cm4gXCJ8XCIgW2NvbG9yXSArIHMubHJwYWQobXNnLCBsZW4pW2NvbG9yXSArIFwifFwiIFtjb2xvcl1cblx0fSkuam9pbihcIlxcblwiKTtcblx0bGV0IHRvcExpbmUgPSBcIitcIiBbY29sb3JdICsgcy5wYWQoJycsIGxlbiwgJy0nKVtjb2xvcl0gKyBcIitcIiBbY29sb3JdO1xuXHRsZXQgc2VwYXJhdG9yID0gXCJ8XCIgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICcnKSArIFwifFwiIFtjb2xvcl07XG5cdGxldCBib3R0b21MaW5lID0gXCIrXCIgW2NvbG9yXSArIHMucGFkKCcnLCBsZW4sICctJylbY29sb3JdICsgXCIrXCIgW2NvbG9yXTtcblx0cmV0dXJuIGBcXG4ke3RvcExpbmV9XFxuJHtzZXBhcmF0b3J9XFxuJHt0ZXh0fVxcbiR7c2VwYXJhdG9yfVxcbiR7Ym90dG9tTGluZX1cXG5gO1xufVxuXG4vKlxuXHRMb2dnZXIgZmFjdG9yeSBmdW5jdGlvbi4gVGFrZXMgYSBwcmVmaXggc3RyaW5nIGFuZCBvcHRpb25zIG9iamVjdFxuXHRhbmQgdXNlcyBhbiBpbmplY3RlZCBgbG9nZ2VyYCBpZiBwcm92aWRlZCwgZWxzZSBmYWxscyBiYWNrIHRvXG5cdE1ldGVvcidzIGBMb2dgIHBhY2thZ2UuXG5cdFdpbGwgc2VuZCBhIGxvZyBvYmplY3QgdG8gdGhlIGluamVjdGVkIGxvZ2dlciwgb24gdGhlIGZvbGxvd2luZyBmb3JtOlxuXHRcdG1lc3NhZ2U6IFN0cmluZ1xuXHRcdGxldmVsOiBTdHJpbmcgKGluZm8sIHdhcm4sIGVycm9yLCBkZWJ1Zylcblx0XHR0YWc6ICdNaWdyYXRpb25zJ1xuKi9cbmZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihwcmVmaXgpIHtcblx0Y2hlY2socHJlZml4LCBTdHJpbmcpO1xuXG5cdC8vIFJldHVybiBub29wIGlmIGxvZ2dpbmcgaXMgZGlzYWJsZWQuXG5cdGlmIChNaWdyYXRpb25zLm9wdGlvbnMubG9nID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHt9O1xuXHR9XG5cblx0cmV0dXJuIGZ1bmN0aW9uKGxldmVsLCBtZXNzYWdlKSB7XG5cdFx0Y2hlY2sobGV2ZWwsIE1hdGNoLk9uZU9mKCdpbmZvJywgJ2Vycm9yJywgJ3dhcm4nLCAnZGVidWcnKSk7XG5cdFx0Y2hlY2sobWVzc2FnZSwgTWF0Y2guT25lT2YoU3RyaW5nLCBbU3RyaW5nXSkpO1xuXG5cdFx0dmFyIGxvZ2dlciA9IE1pZ3JhdGlvbnMub3B0aW9ucyAmJiBNaWdyYXRpb25zLm9wdGlvbnMubG9nZ2VyO1xuXG5cdFx0aWYgKGxvZ2dlciAmJiBfLmlzRnVuY3Rpb24obG9nZ2VyKSkge1xuXG5cdFx0XHRsb2dnZXIoe1xuXHRcdFx0XHRsZXZlbDogbGV2ZWwsXG5cdFx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRcdHRhZzogcHJlZml4XG5cdFx0XHR9KTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRMb2dbbGV2ZWxdKHtcblx0XHRcdFx0bWVzc2FnZTogcHJlZml4ICsgJzogJyArIG1lc3NhZ2Vcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufVxuXG52YXIgbG9nO1xuXG52YXIgb3B0aW9ucyA9IE1pZ3JhdGlvbnMub3B0aW9ucztcblxuLy8gY29sbGVjdGlvbiBob2xkaW5nIHRoZSBjb250cm9sIHJlY29yZFxuXG5sb2cgPSBjcmVhdGVMb2dnZXIoJ01pZ3JhdGlvbnMnKTtcblxuWydpbmZvJywgJ3dhcm4nLCAnZXJyb3InLCAnZGVidWcnXS5mb3JFYWNoKGZ1bmN0aW9uKGxldmVsKSB7XG5cdGxvZ1tsZXZlbF0gPSBfLnBhcnRpYWwobG9nLCBsZXZlbCk7XG59KTtcblxuLy8gaWYgKHByb2Nlc3MuZW52Lk1JR1JBVEUpXG4vLyAgIE1pZ3JhdGlvbnMubWlncmF0ZVRvKHByb2Nlc3MuZW52Lk1JR1JBVEUpO1xuXG4vLyBBZGQgYSBuZXcgbWlncmF0aW9uOlxuLy8ge3VwOiBmdW5jdGlvbiAqcmVxdWlyZWRcbi8vICB2ZXJzaW9uOiBOdW1iZXIgKnJlcXVpcmVkXG4vLyAgZG93bjogZnVuY3Rpb24gKm9wdGlvbmFsXG4vLyAgbmFtZTogU3RyaW5nICpvcHRpb25hbFxuLy8gfVxuTWlncmF0aW9ucy5hZGQgPSBmdW5jdGlvbihtaWdyYXRpb24pIHtcblx0aWYgKHR5cGVvZiBtaWdyYXRpb24udXAgIT09ICdmdW5jdGlvbicpXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignTWlncmF0aW9uIG11c3Qgc3VwcGx5IGFuIHVwIGZ1bmN0aW9uLicpO1xuXG5cdGlmICh0eXBlb2YgbWlncmF0aW9uLnZlcnNpb24gIT09ICdudW1iZXInKVxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiBtdXN0IHN1cHBseSBhIHZlcnNpb24gbnVtYmVyLicpO1xuXG5cdGlmIChtaWdyYXRpb24udmVyc2lvbiA8PSAwKVxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ01pZ3JhdGlvbiB2ZXJzaW9uIG11c3QgYmUgZ3JlYXRlciB0aGFuIDAnKTtcblxuXHQvLyBGcmVlemUgdGhlIG1pZ3JhdGlvbiBvYmplY3QgdG8gbWFrZSBpdCBoZXJlYWZ0ZXIgaW1tdXRhYmxlXG5cdE9iamVjdC5mcmVlemUobWlncmF0aW9uKTtcblxuXHR0aGlzLl9saXN0LnB1c2gobWlncmF0aW9uKTtcblx0dGhpcy5fbGlzdCA9IF8uc29ydEJ5KHRoaXMuX2xpc3QsIGZ1bmN0aW9uKG0pIHtcblx0XHRyZXR1cm4gbS52ZXJzaW9uO1xuXHR9KTtcbn1cblxuLy8gQXR0ZW1wdHMgdG8gcnVuIHRoZSBtaWdyYXRpb25zIHVzaW5nIGNvbW1hbmQgaW4gdGhlIGZvcm0gb2Y6XG4vLyBlLmcgJ2xhdGVzdCcsICdsYXRlc3QsZXhpdCcsIDJcbi8vIHVzZSAnWFgscmVydW4nIHRvIHJlLXJ1biB0aGUgbWlncmF0aW9uIGF0IHRoYXQgdmVyc2lvblxuTWlncmF0aW9ucy5taWdyYXRlVG8gPSBmdW5jdGlvbihjb21tYW5kKSB7XG5cdGlmIChfLmlzVW5kZWZpbmVkKGNvbW1hbmQpIHx8IGNvbW1hbmQgPT09ICcnIHx8IHRoaXMuX2xpc3QubGVuZ3RoID09PSAwKVxuXHRcdHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBtaWdyYXRlIHVzaW5nIGludmFsaWQgY29tbWFuZDogXCIgKyBjb21tYW5kKTtcblxuXHRpZiAodHlwZW9mIGNvbW1hbmQgPT09ICdudW1iZXInKSB7XG5cdFx0dmFyIHZlcnNpb24gPSBjb21tYW5kO1xuXHR9IGVsc2Uge1xuXHRcdHZhciB2ZXJzaW9uID0gY29tbWFuZC5zcGxpdCgnLCcpWzBdO1xuXHRcdHZhciBzdWJjb21tYW5kID0gY29tbWFuZC5zcGxpdCgnLCcpWzFdO1xuXHR9XG5cblx0Y29uc3QgbWF4QXR0ZW1wdHMgPSBNaWdyYXRpb25zLm9wdGlvbnMubWF4QXR0ZW1wdHM7XG5cdGNvbnN0IHJldHJ5SW50ZXJ2YWwgPSBNaWdyYXRpb25zLm9wdGlvbnMucmV0cnlJbnRlcnZhbDtcblx0Zm9yIChsZXQgYXR0ZW1wdHMgPSAxOyBhdHRlbXB0cyA8PSBtYXhBdHRlbXB0czsgYXR0ZW1wdHMrKykge1xuXHRcdGlmICh2ZXJzaW9uID09PSAnbGF0ZXN0Jykge1xuXHRcdFx0bWlncmF0ZWQgPSB0aGlzLl9taWdyYXRlVG8oXy5sYXN0KHRoaXMuX2xpc3QpLnZlcnNpb24pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtaWdyYXRlZCA9IHRoaXMuX21pZ3JhdGVUbyhwYXJzZUludCh2ZXJzaW9uKSwgKHN1YmNvbW1hbmQgPT09ICdyZXJ1bicpKTtcblx0XHR9XG5cdFx0aWYgKG1pZ3JhdGVkKSB7XG5cdFx0XHRicmVhaztcblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IHdpbGxSZXRyeTtcblx0XHRcdGlmIChhdHRlbXB0cyA8IG1heEF0dGVtcHRzKSB7XG5cdFx0XHRcdHdpbGxSZXRyeSA9IGAgVHJ5aW5nIGFnYWluIGluICR7cmV0cnlJbnRlcnZhbH0gc2Vjb25kcy5gO1xuXHRcdFx0XHRNZXRlb3IuX3NsZWVwRm9yTXMocmV0cnlJbnRlcnZhbCAqIDEwMDApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0d2lsbFJldHJ5ID0gXCJcIjtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKGBOb3QgbWlncmF0aW5nLCBjb250cm9sIGlzIGxvY2tlZC4gQXR0ZW1wdCAke2F0dGVtcHRzfS8ke21heEF0dGVtcHRzfS4ke3dpbGxSZXRyeX1gLnllbGxvdyk7XG5cdFx0fVxuXHR9XG5cdGlmICghbWlncmF0ZWQpIHtcblx0XHRsZXQgY29udHJvbCA9IHRoaXMuX2dldENvbnRyb2woKTsgLy8gU2lkZSBlZmZlY3Q6IHVwc2VydHMgY29udHJvbCBkb2N1bWVudC5cblx0XHRjb25zb2xlLmxvZyhtYWtlQUJveChbXG5cdFx0XHRcIkVSUk9SISBTRVJWRVIgU1RPUFBFRFwiLFxuXHRcdFx0XCJcIixcblx0XHRcdFwiWW91ciBkYXRhYmFzZSBtaWdyYXRpb24gY29udHJvbCBpcyBsb2NrZWQuXCIsXG5cdFx0XHRcIlBsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSBydW5uaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgdHJ5IGFnYWluLlwiLFxuXHRcdFx0XCJJZiB0aGUgcHJvYmxlbSBwZXJzaXN0cywgcGxlYXNlIGNvbnRhY3Qgc3VwcG9ydC5cIixcblx0XHRcdFwiXCIsXG5cdFx0XHRcIlRoaXMgUm9ja2V0LkNoYXQgdmVyc2lvbjogXCIgKyBSb2NrZXRDaGF0LkluZm8udmVyc2lvbixcblx0XHRcdFwiRGF0YWJhc2UgbG9ja2VkIGF0IHZlcnNpb246IFwiICsgY29udHJvbC52ZXJzaW9uLFxuXHRcdFx0XCJEYXRhYmFzZSB0YXJnZXQgdmVyc2lvbjogXCIgKyAodmVyc2lvbiA9PT0gJ2xhdGVzdCcgPyBfLmxhc3QodGhpcy5fbGlzdCkudmVyc2lvbiA6IHZlcnNpb24pLFxuXHRcdFx0XCJcIixcblx0XHRcdFwiQ29tbWl0OiBcIiArIFJvY2tldENoYXQuSW5mby5jb21taXQuaGFzaCxcblx0XHRcdFwiRGF0ZTogXCIgKyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmRhdGUsXG5cdFx0XHRcIkJyYW5jaDogXCIgKyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmJyYW5jaCxcblx0XHRcdFwiVGFnOiBcIiArIFJvY2tldENoYXQuSW5mby5jb21taXQudGFnXG5cdFx0XSkpO1xuXHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0fVxuXG5cdC8vIHJlbWVtYmVyIHRvIHJ1biBtZXRlb3Igd2l0aCAtLW9uY2Ugb3RoZXJ3aXNlIGl0IHdpbGwgcmVzdGFydFxuXHRpZiAoc3ViY29tbWFuZCA9PT0gJ2V4aXQnKVxuXHRcdHByb2Nlc3MuZXhpdCgwKTtcbn1cblxuLy8ganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IHZlcnNpb25cbk1pZ3JhdGlvbnMuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5fZ2V0Q29udHJvbCgpLnZlcnNpb247XG59XG5cbi8vIG1pZ3JhdGVzIHRvIHRoZSBzcGVjaWZpYyB2ZXJzaW9uIHBhc3NlZCBpblxuTWlncmF0aW9ucy5fbWlncmF0ZVRvID0gZnVuY3Rpb24odmVyc2lvbiwgcmVydW4pIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHR2YXIgY29udHJvbCA9IHRoaXMuX2dldENvbnRyb2woKTsgLy8gU2lkZSBlZmZlY3Q6IHVwc2VydHMgY29udHJvbCBkb2N1bWVudC5cblx0dmFyIGN1cnJlbnRWZXJzaW9uID0gY29udHJvbC52ZXJzaW9uO1xuXG5cdGlmIChsb2NrKCkgPT09IGZhbHNlKSB7XG5cdFx0Ly8gbG9nLmluZm8oJ05vdCBtaWdyYXRpbmcsIGNvbnRyb2wgaXMgbG9ja2VkLicpO1xuXHRcdC8vIFdhcm5pbmdcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRpZiAocmVydW4pIHtcblx0XHRsb2cuaW5mbygnUmVydW5uaW5nIHZlcnNpb24gJyArIHZlcnNpb24pO1xuXHRcdG1pZ3JhdGUoJ3VwJywgdGhpcy5fZmluZEluZGV4QnlWZXJzaW9uKHZlcnNpb24pKTtcblx0XHRsb2cuaW5mbygnRmluaXNoZWQgbWlncmF0aW5nLicpO1xuXHRcdHVubG9jaygpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0aWYgKGN1cnJlbnRWZXJzaW9uID09PSB2ZXJzaW9uKSB7XG5cdFx0aWYgKHRoaXMub3B0aW9ucy5sb2dJZkxhdGVzdCkge1xuXHRcdFx0bG9nLmluZm8oJ05vdCBtaWdyYXRpbmcsIGFscmVhZHkgYXQgdmVyc2lvbiAnICsgdmVyc2lvbik7XG5cdFx0fVxuXHRcdHVubG9jaygpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cblx0dmFyIHN0YXJ0SWR4ID0gdGhpcy5fZmluZEluZGV4QnlWZXJzaW9uKGN1cnJlbnRWZXJzaW9uKTtcblx0dmFyIGVuZElkeCA9IHRoaXMuX2ZpbmRJbmRleEJ5VmVyc2lvbih2ZXJzaW9uKTtcblxuXHQvLyBsb2cuaW5mbygnc3RhcnRJZHg6JyArIHN0YXJ0SWR4ICsgJyBlbmRJZHg6JyArIGVuZElkeCk7XG5cdGxvZy5pbmZvKCdNaWdyYXRpbmcgZnJvbSB2ZXJzaW9uICcgKyB0aGlzLl9saXN0W3N0YXJ0SWR4XS52ZXJzaW9uICsgJyAtPiAnICsgdGhpcy5fbGlzdFtlbmRJZHhdLnZlcnNpb24pO1xuXG5cdC8vIHJ1biB0aGUgYWN0dWFsIG1pZ3JhdGlvblxuXHRmdW5jdGlvbiBtaWdyYXRlKGRpcmVjdGlvbiwgaWR4KSB7XG5cdFx0dmFyIG1pZ3JhdGlvbiA9IHNlbGYuX2xpc3RbaWR4XTtcblxuXHRcdGlmICh0eXBlb2YgbWlncmF0aW9uW2RpcmVjdGlvbl0gIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHVubG9jaygpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignQ2Fubm90IG1pZ3JhdGUgJyArIGRpcmVjdGlvbiArICcgb24gdmVyc2lvbiAnICsgbWlncmF0aW9uLnZlcnNpb24pO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG1heWJlTmFtZSgpIHtcblx0XHRcdHJldHVybiBtaWdyYXRpb24ubmFtZSA/ICcgKCcgKyBtaWdyYXRpb24ubmFtZSArICcpJyA6ICcnO1xuXHRcdH1cblxuXHRcdGxvZy5pbmZvKCdSdW5uaW5nICcgKyBkaXJlY3Rpb24gKyAnKCkgb24gdmVyc2lvbiAnICsgbWlncmF0aW9uLnZlcnNpb24gKyBtYXliZU5hbWUoKSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuX0NhY2hlQ29udHJvbC53aXRoVmFsdWUoZmFsc2UsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRtaWdyYXRpb25bZGlyZWN0aW9uXShtaWdyYXRpb24pO1xuXHRcdFx0fSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0Y29uc29sZS5sb2cobWFrZUFCb3goW1xuXHRcdFx0XHRcIkVSUk9SISBTRVJWRVIgU1RPUFBFRFwiLFxuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcIllvdXIgZGF0YWJhc2UgbWlncmF0aW9uIGZhaWxlZDpcIixcblx0XHRcdFx0ZS5tZXNzYWdlLFxuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcIlBsZWFzZSBtYWtlIHN1cmUgeW91IGFyZSBydW5uaW5nIHRoZSBsYXRlc3QgdmVyc2lvbiBhbmQgdHJ5IGFnYWluLlwiLFxuXHRcdFx0XHRcIklmIHRoZSBwcm9ibGVtIHBlcnNpc3RzLCBwbGVhc2UgY29udGFjdCBzdXBwb3J0LlwiLFxuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRcIlRoaXMgUm9ja2V0LkNoYXQgdmVyc2lvbjogXCIgKyBSb2NrZXRDaGF0LkluZm8udmVyc2lvbixcblx0XHRcdFx0XCJEYXRhYmFzZSBsb2NrZWQgYXQgdmVyc2lvbjogXCIgKyBjb250cm9sLnZlcnNpb24sXG5cdFx0XHRcdFwiRGF0YWJhc2UgdGFyZ2V0IHZlcnNpb246IFwiICsgdmVyc2lvbixcblx0XHRcdFx0XCJcIixcblx0XHRcdFx0XCJDb21taXQ6IFwiICsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC5oYXNoLFxuXHRcdFx0XHRcIkRhdGU6IFwiICsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC5kYXRlLFxuXHRcdFx0XHRcIkJyYW5jaDogXCIgKyBSb2NrZXRDaGF0LkluZm8uY29tbWl0LmJyYW5jaCxcblx0XHRcdFx0XCJUYWc6IFwiICsgUm9ja2V0Q2hhdC5JbmZvLmNvbW1pdC50YWdcblx0XHRcdF0pKTtcblx0XHRcdHByb2Nlc3MuZXhpdCgxKTtcblx0XHR9XG5cdH1cblxuXHQvLyBSZXR1cm5zIHRydWUgaWYgbG9jayB3YXMgYWNxdWlyZWQuXG5cdGZ1bmN0aW9uIGxvY2soKSB7XG5cdFx0Y29uc3QgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cdFx0Y29uc3QgZGF0ZU1pbnVzSW50ZXJ2YWwgPSBtb21lbnQoZGF0ZSkuc3VidHJhY3Qoc2VsZi5vcHRpb25zLmxvY2tFeHBpcmF0aW9uLCAnbWludXRlcycpLnRvRGF0ZSgpO1xuXHRcdGNvbnN0IGJ1aWxkID0gUm9ja2V0Q2hhdC5JbmZvID8gUm9ja2V0Q2hhdC5JbmZvLmJ1aWxkLmRhdGUgOiBkYXRlO1xuXG5cdFx0Ly8gVGhpcyBpcyBhdG9taWMuIFRoZSBzZWxlY3RvciBlbnN1cmVzIG9ubHkgb25lIGNhbGxlciBhdCBhIHRpbWUgd2lsbCBzZWVcblx0XHQvLyB0aGUgdW5sb2NrZWQgY29udHJvbCwgYW5kIGxvY2tpbmcgb2NjdXJzIGluIHRoZSBzYW1lIHVwZGF0ZSdzIG1vZGlmaWVyLlxuXHRcdC8vIEFsbCBvdGhlciBzaW11bHRhbmVvdXMgY2FsbGVycyB3aWxsIGdldCBmYWxzZSBiYWNrIGZyb20gdGhlIHVwZGF0ZS5cblx0XHRyZXR1cm4gc2VsZi5fY29sbGVjdGlvbi51cGRhdGUoe1xuXHRcdFx0X2lkOiAnY29udHJvbCcsXG5cdFx0XHQkb3I6IFt7XG5cdFx0XHRcdGxvY2tlZDogZmFsc2Vcblx0XHRcdH0sIHtcblx0XHRcdFx0bG9ja2VkQXQ6IHtcblx0XHRcdFx0XHQkbHQ6IGRhdGVNaW51c0ludGVydmFsXG5cdFx0XHRcdH1cblx0XHRcdH0sIHtcblx0XHRcdFx0YnVpbGRBdDoge1xuXHRcdFx0XHRcdCRuZTogYnVpbGRcblx0XHRcdFx0fVxuXHRcdFx0fV1cblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGxvY2tlZDogdHJ1ZSxcblx0XHRcdFx0bG9ja2VkQXQ6IGRhdGUsXG5cdFx0XHRcdGJ1aWxkQXQ6IGJ1aWxkXG5cdFx0XHR9XG5cdFx0fSkgPT09IDE7XG5cdH1cblxuXG5cdC8vIFNpZGUgZWZmZWN0OiBzYXZlcyB2ZXJzaW9uLlxuXHRmdW5jdGlvbiB1bmxvY2soKSB7XG5cdFx0c2VsZi5fc2V0Q29udHJvbCh7XG5cdFx0XHRsb2NrZWQ6IGZhbHNlLFxuXHRcdFx0dmVyc2lvbjogY3VycmVudFZlcnNpb25cblx0XHR9KTtcblx0fVxuXG5cdGlmIChjdXJyZW50VmVyc2lvbiA8IHZlcnNpb24pIHtcblx0XHRmb3IgKHZhciBpID0gc3RhcnRJZHg7IGkgPCBlbmRJZHg7IGkrKykge1xuXHRcdFx0bWlncmF0ZSgndXAnLCBpICsgMSk7XG5cdFx0XHRjdXJyZW50VmVyc2lvbiA9IHNlbGYuX2xpc3RbaSArIDFdLnZlcnNpb247XG5cdFx0XHRzZWxmLl9zZXRDb250cm9sKHtcblx0XHRcdFx0bG9ja2VkOiB0cnVlLFxuXHRcdFx0XHR2ZXJzaW9uOiBjdXJyZW50VmVyc2lvblxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdGZvciAodmFyIGkgPSBzdGFydElkeDsgaSA+IGVuZElkeDsgaS0tKSB7XG5cdFx0XHRtaWdyYXRlKCdkb3duJywgaSk7XG5cdFx0XHRjdXJyZW50VmVyc2lvbiA9IHNlbGYuX2xpc3RbaSAtIDFdLnZlcnNpb247XG5cdFx0XHRzZWxmLl9zZXRDb250cm9sKHtcblx0XHRcdFx0bG9ja2VkOiB0cnVlLFxuXHRcdFx0XHR2ZXJzaW9uOiBjdXJyZW50VmVyc2lvblxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0dW5sb2NrKCk7XG5cdGxvZy5pbmZvKCdGaW5pc2hlZCBtaWdyYXRpbmcuJyk7XG59XG5cbi8vIGdldHMgdGhlIGN1cnJlbnQgY29udHJvbCByZWNvcmQsIG9wdGlvbmFsbHkgY3JlYXRpbmcgaXQgaWYgbm9uLWV4aXN0YW50XG5NaWdyYXRpb25zLl9nZXRDb250cm9sID0gZnVuY3Rpb24oKSB7XG5cdHZhciBjb250cm9sID0gdGhpcy5fY29sbGVjdGlvbi5maW5kT25lKHtcblx0XHRfaWQ6ICdjb250cm9sJ1xuXHR9KTtcblxuXHRyZXR1cm4gY29udHJvbCB8fCB0aGlzLl9zZXRDb250cm9sKHtcblx0XHR2ZXJzaW9uOiAwLFxuXHRcdGxvY2tlZDogZmFsc2Vcblx0fSk7XG59XG5cbi8vIHNldHMgdGhlIGNvbnRyb2wgcmVjb3JkXG5NaWdyYXRpb25zLl9zZXRDb250cm9sID0gZnVuY3Rpb24oY29udHJvbCkge1xuXHQvLyBiZSBxdWl0ZSBzdHJpY3Rcblx0Y2hlY2soY29udHJvbC52ZXJzaW9uLCBOdW1iZXIpO1xuXHRjaGVjayhjb250cm9sLmxvY2tlZCwgQm9vbGVhbik7XG5cblx0dGhpcy5fY29sbGVjdGlvbi51cGRhdGUoe1xuXHRcdF9pZDogJ2NvbnRyb2wnXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHR2ZXJzaW9uOiBjb250cm9sLnZlcnNpb24sXG5cdFx0XHRsb2NrZWQ6IGNvbnRyb2wubG9ja2VkXG5cdFx0fVxuXHR9LCB7XG5cdFx0dXBzZXJ0OiB0cnVlXG5cdH0pO1xuXG5cdHJldHVybiBjb250cm9sO1xufVxuXG4vLyByZXR1cm5zIHRoZSBtaWdyYXRpb24gaW5kZXggaW4gX2xpc3Qgb3IgdGhyb3dzIGlmIG5vdCBmb3VuZFxuTWlncmF0aW9ucy5fZmluZEluZGV4QnlWZXJzaW9uID0gZnVuY3Rpb24odmVyc2lvbikge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2xpc3QubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAodGhpcy5fbGlzdFtpXS52ZXJzaW9uID09PSB2ZXJzaW9uKVxuXHRcdFx0cmV0dXJuIGk7XG5cdH1cblxuXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDYW5cXCd0IGZpbmQgbWlncmF0aW9uIHZlcnNpb24gJyArIHZlcnNpb24pO1xufVxuXG4vL3Jlc2V0IChtYWlubHkgaW50ZW5kZWQgZm9yIHRlc3RzKVxuTWlncmF0aW9ucy5fcmVzZXQgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5fbGlzdCA9IFt7XG5cdFx0dmVyc2lvbjogMCxcblx0XHR1cDogZnVuY3Rpb24oKSB7fVxuXHR9XTtcblx0dGhpcy5fY29sbGVjdGlvbi5yZW1vdmUoe30pO1xufVxuXG5Sb2NrZXRDaGF0Lk1pZ3JhdGlvbnMgPSBNaWdyYXRpb25zO1xuIl19
