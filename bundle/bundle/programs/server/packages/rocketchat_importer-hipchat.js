(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer-hipchat":{"info.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_importer-hipchat/info.js                                                            //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  HipChatImporterInfo: () => HipChatImporterInfo
});
let ImporterInfo;
module.watch(require("meteor/rocketchat:importer"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

class HipChatImporterInfo extends ImporterInfo {
  constructor() {
    super('hipchat', 'HipChat', 'application/zip');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"importer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_importer-hipchat/server/importer.js                                                 //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
module.export({
  HipChatImporter: () => HipChatImporter
});
let Base, ProgressStep, Selection, SelectionChannel, SelectionUser;
module.watch(require("meteor/rocketchat:importer"), {
  Base(v) {
    Base = v;
  },

  ProgressStep(v) {
    ProgressStep = v;
  },

  Selection(v) {
    Selection = v;
  },

  SelectionChannel(v) {
    SelectionChannel = v;
  },

  SelectionUser(v) {
    SelectionUser = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 2);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 3);
module.watch(require("moment-timezone"));

class HipChatImporter extends Base {
  constructor(info) {
    super(info);
    this.userTags = [];
    this.roomPrefix = 'hipchat_export/rooms/';
    this.usersPrefix = 'hipchat_export/users/';
  }

  prepare(dataURI, sentContentType, fileName) {
    super.prepare(dataURI, sentContentType, fileName);
    const image = RocketChatFile.dataURIParse(dataURI).image; // const contentType = ref.contentType;

    const zip = new this.AdmZip(new Buffer(image, 'base64'));
    const zipEntries = zip.getEntries();
    const tempRooms = [];
    let tempUsers = [];
    const tempMessages = {};
    zipEntries.forEach(entry => {
      if (entry.entryName.indexOf('__MACOSX') > -1) {
        this.logger.debug(`Ignoring the file: ${entry.entryName}`);
      }

      if (entry.isDirectory) {
        return;
      }

      if (entry.entryName.indexOf(this.roomPrefix) > -1) {
        let roomName = entry.entryName.split(this.roomPrefix)[1];

        if (roomName === 'list.json') {
          super.updateProgress(ProgressStep.PREPARING_CHANNELS);
          const tempRooms = JSON.parse(entry.getData().toString()).rooms;
          tempRooms.forEach(room => {
            room.name = s.slugify(room.name);
          });
        } else if (roomName.indexOf('/') > -1) {
          const item = roomName.split('/');
          roomName = s.slugify(item[0]);
          const msgGroupData = item[1].split('.')[0];

          if (!tempMessages[roomName]) {
            tempMessages[roomName] = {};
          }

          try {
            return tempMessages[roomName][msgGroupData] = JSON.parse(entry.getData().toString());
          } catch (error) {
            return this.logger.warn(`${entry.entryName} is not a valid JSON file! Unable to import it.`);
          }
        }
      } else if (entry.entryName.indexOf(this.usersPrefix) > -1) {
        const usersName = entry.entryName.split(this.usersPrefix)[1];

        if (usersName === 'list.json') {
          super.updateProgress(ProgressStep.PREPARING_USERS);
          return tempUsers = JSON.parse(entry.getData().toString()).users;
        } else {
          return this.logger.warn(`Unexpected file in the ${this.name} import: ${entry.entryName}`);
        }
      }
    });
    const usersId = this.collection.insert({
      'import': this.importRecord._id,
      'importer': this.name,
      'type': 'users',
      'users': tempUsers
    });
    this.users = this.collection.findOne(usersId);
    this.updateRecord({
      'count.users': tempUsers.length
    });
    this.addCountToTotal(tempUsers.length);
    const channelsId = this.collection.insert({
      'import': this.importRecord._id,
      'importer': this.name,
      'type': 'channels',
      'channels': tempRooms
    });
    this.channels = this.collection.findOne(channelsId);
    this.updateRecord({
      'count.channels': tempRooms.length
    });
    this.addCountToTotal(tempRooms.length);
    super.updateProgress(ProgressStep.PREPARING_MESSAGES);
    let messagesCount = 0;
    Object.keys(tempMessages).forEach(channel => {
      const messagesObj = tempMessages[channel];
      this.messages[channel] = this.messages[channel] || {};
      Object.keys(messagesObj).forEach(date => {
        const msgs = messagesObj[date];
        messagesCount += msgs.length;
        this.updateRecord({
          'messagesstatus': `${channel}/${date}`
        });

        if (Base.getBSONSize(msgs) > Base.getMaxBSONSize()) {
          Base.getBSONSafeArraysFromAnArray(msgs).forEach((splitMsg, i) => {
            const messagesId = this.collection.insert({
              'import': this.importRecord._id,
              'importer': this.name,
              'type': 'messages',
              'name': `${channel}/${date}.${i}`,
              'messages': splitMsg
            });
            this.messages[channel][`${date}.${i}`] = this.collection.findOne(messagesId);
          });
        } else {
          const messagesId = this.collection.insert({
            'import': this.importRecord._id,
            'importer': this.name,
            'type': 'messages',
            'name': `${channel}/${date}`,
            'messages': msgs
          });
          this.messages[channel][date] = this.collection.findOne(messagesId);
        }
      });
    });
    this.updateRecord({
      'count.messages': messagesCount,
      'messagesstatus': null
    });
    this.addCountToTotal(messagesCount);

    if (tempUsers.length === 0 || tempRooms.length === 0 || messagesCount === 0) {
      this.logger.warn(`The loaded users count ${tempUsers.length}, the loaded channels ${tempRooms.length}, and the loaded messages ${messagesCount}`);
      super.updateProgress(ProgressStep.ERROR);
      return this.getProgress();
    }

    const selectionUsers = tempUsers.map(function (user) {
      return new SelectionUser(user.user_id, user.name, user.email, user.is_deleted, false, !user.is_bot);
    });
    const selectionChannels = tempRooms.map(function (room) {
      return new SelectionChannel(room.room_id, room.name, room.is_archived, true, false);
    });
    const selectionMessages = this.importRecord.count.messages;
    super.updateProgress(ProgressStep.USER_SELECTION);
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
  }

  startImport(importSelection) {
    super.startImport(importSelection);
    const start = Date.now();
    importSelection.users.forEach(user => {
      this.users.users.forEach(u => {
        if (u.user_id === user.user_id) {
          u.do_import = user.do_import;
        }
      });
    });
    this.collection.update({
      _id: this.users._id
    }, {
      $set: {
        'users': this.users.users
      }
    });
    importSelection.channels.forEach(channel => this.channels.channels.forEach(c => c.room_id === channel.channel_id && (c.do_import = channel.do_import)));
    this.collection.update({
      _id: this.channels._id
    }, {
      $set: {
        'channels': this.channels.channels
      }
    });
    const startedByUserId = Meteor.userId();
    Meteor.defer(() => {
      super.updateProgress(ProgressStep.IMPORTING_USERS);

      try {
        this.users.users.forEach(user => {
          if (!user.do_import) {
            return;
          }

          Meteor.runAsUser(startedByUserId, () => {
            const existantUser = RocketChat.models.Users.findOneByEmailAddress(user.email);

            if (existantUser) {
              user.rocketId = existantUser._id;
              this.userTags.push({
                hipchat: `@${user.mention_name}`,
                rocket: `@${existantUser.username}`
              });
            } else {
              const userId = Accounts.createUser({
                email: user.email,
                password: Date.now() + user.name + user.email.toUpperCase()
              });
              user.rocketId = userId;
              this.userTags.push({
                hipchat: `@${user.mention_name}`,
                rocket: `@${user.mention_name}`
              });
              Meteor.runAsUser(userId, () => {
                Meteor.call('setUsername', user.mention_name, {
                  joinDefaultChannelsSilenced: true
                });
                Meteor.call('setAvatarFromService', user.photo_url, undefined, 'url');
                return Meteor.call('userSetUtcOffset', parseInt(moment().tz(user.timezone).format('Z').toString().split(':')[0]));
              });

              if (user.name != null) {
                RocketChat.models.Users.setName(userId, user.name);
              }

              if (user.is_deleted) {
                Meteor.call('setUserActiveStatus', userId, false);
              }
            }

            return this.addCountCompleted(1);
          });
        });
        this.collection.update({
          _id: this.users._id
        }, {
          $set: {
            'users': this.users.users
          }
        });
        super.updateProgress(ProgressStep.IMPORTING_CHANNELS);
        this.channels.channels.forEach(channel => {
          if (!channel.do_import) {
            return;
          }

          Meteor.runAsUser(startedByUserId, () => {
            channel.name = channel.name.replace(/ /g, '');
            const existantRoom = RocketChat.models.Rooms.findOneByName(channel.name);

            if (existantRoom) {
              channel.rocketId = existantRoom._id;
            } else {
              let userId = '';
              this.users.users.forEach(user => {
                if (user.user_id === channel.owner_user_id) {
                  userId = user.rocketId;
                }
              });

              if (userId === '') {
                this.logger.warn(`Failed to find the channel creator for ${channel.name}, setting it to the current running user.`);
                userId = startedByUserId;
              }

              Meteor.runAsUser(userId, () => {
                const returned = Meteor.call('createChannel', channel.name, []);
                return channel.rocketId = returned.rid;
              });
              RocketChat.models.Rooms.update({
                _id: channel.rocketId
              }, {
                $set: {
                  'ts': new Date(channel.created * 1000)
                }
              });
            }

            return this.addCountCompleted(1);
          });
        });
        this.collection.update({
          _id: this.channels._id
        }, {
          $set: {
            'channels': this.channels.channels
          }
        });
        super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
        const nousers = {};
        Object.keys(this.messages).forEach(channel => {
          const messagesObj = this.messages[channel];
          Meteor.runAsUser(startedByUserId, () => {
            const hipchatChannel = this.getHipChatChannelFromName(channel);

            if (hipchatChannel != null ? hipchatChannel.do_import : undefined) {
              const room = RocketChat.models.Rooms.findOneById(hipchatChannel.rocketId, {
                fields: {
                  usernames: 1,
                  t: 1,
                  name: 1
                }
              });
              Object.keys(messagesObj).forEach(date => {
                const msgs = messagesObj[date];
                this.updateRecord({
                  'messagesstatus': `${channel}/${date}.${msgs.messages.length}`
                });
                msgs.messages.forEach(message => {
                  if (message.from != null) {
                    const user = this.getRocketUser(message.from.user_id);

                    if (user != null) {
                      const msgObj = {
                        msg: this.convertHipChatMessageToRocketChat(message.message),
                        ts: new Date(message.date),
                        u: {
                          _id: user._id,
                          username: user.username
                        }
                      };
                      RocketChat.sendMessage(user, msgObj, room, true);
                    } else if (!nousers[message.from.user_id]) {
                      nousers[message.from.user_id] = message.from;
                    }
                  } else if (!_.isArray(message)) {
                    console.warn('Please report the following:', message);
                  }

                  this.addCountCompleted(1);
                });
              });
            }
          });
        });
        this.logger.warn('The following did not have users:', nousers);
        super.updateProgress(ProgressStep.FINISHING);
        this.channels.channels.forEach(channel => {
          if (channel.do_import && channel.is_archived) {
            Meteor.runAsUser(startedByUserId, () => {
              return Meteor.call('archiveRoom', channel.rocketId);
            });
          }
        });
        super.updateProgress(ProgressStep.DONE);
      } catch (e) {
        this.logger.error(e);
        super.updateProgress(ProgressStep.ERROR);
      }

      const timeTook = Date.now() - start;
      return this.logger.log(`Import took ${timeTook} milliseconds.`);
    });
    return this.getProgress();
  }

  getHipChatChannelFromName(channelName) {
    return this.channels.channels.find(channel => channel.name === channelName);
  }

  getRocketUser(hipchatId) {
    const user = this.users.users.find(user => user.user_id === hipchatId);
    return user ? RocketChat.models.Users.findOneById(user.rocketId, {
      fields: {
        username: 1,
        name: 1
      }
    }) : undefined;
  }

  convertHipChatMessageToRocketChat(message) {
    if (message != null) {
      this.userTags.forEach(userReplace => {
        message = message.replace(userReplace.hipchat, userReplace.rocket);
      });
    } else {
      message = '';
    }

    return message;
  }

  getSelection() {
    const selectionUsers = this.users.users.map(function (user) {
      return new SelectionUser(user.user_id, user.name, user.email, user.is_deleted, false, !user.is_bot);
    });
    const selectionChannels = this.channels.channels.map(function (room) {
      return new SelectionChannel(room.room_id, room.name, room.is_archived, true, false);
    });
    return new Selection(this.name, selectionUsers, selectionChannels, this.importRecord.count.messages);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"adder.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/rocketchat_importer-hipchat/server/adder.js                                                    //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
let HipChatImporterInfo;
module.watch(require("../info"), {
  HipChatImporterInfo(v) {
    HipChatImporterInfo = v;
  }

}, 1);
let HipChatImporter;
module.watch(require("./importer"), {
  HipChatImporter(v) {
    HipChatImporter = v;
  }

}, 2);
Importers.add(new HipChatImporterInfo(), HipChatImporter);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer-hipchat/info.js");
require("/node_modules/meteor/rocketchat:importer-hipchat/server/importer.js");
require("/node_modules/meteor/rocketchat:importer-hipchat/server/adder.js");

/* Exports */
Package._define("rocketchat:importer-hipchat");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer-hipchat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1oaXBjaGF0L2luZm8uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXItaGlwY2hhdC9zZXJ2ZXIvaW1wb3J0ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW1wb3J0ZXItaGlwY2hhdC9zZXJ2ZXIvYWRkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiSGlwQ2hhdEltcG9ydGVySW5mbyIsIkltcG9ydGVySW5mbyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJjb25zdHJ1Y3RvciIsIkhpcENoYXRJbXBvcnRlciIsIkJhc2UiLCJQcm9ncmVzc1N0ZXAiLCJTZWxlY3Rpb24iLCJTZWxlY3Rpb25DaGFubmVsIiwiU2VsZWN0aW9uVXNlciIsIl8iLCJkZWZhdWx0IiwicyIsIm1vbWVudCIsImluZm8iLCJ1c2VyVGFncyIsInJvb21QcmVmaXgiLCJ1c2Vyc1ByZWZpeCIsInByZXBhcmUiLCJkYXRhVVJJIiwic2VudENvbnRlbnRUeXBlIiwiZmlsZU5hbWUiLCJpbWFnZSIsIlJvY2tldENoYXRGaWxlIiwiZGF0YVVSSVBhcnNlIiwiemlwIiwiQWRtWmlwIiwiQnVmZmVyIiwiemlwRW50cmllcyIsImdldEVudHJpZXMiLCJ0ZW1wUm9vbXMiLCJ0ZW1wVXNlcnMiLCJ0ZW1wTWVzc2FnZXMiLCJmb3JFYWNoIiwiZW50cnkiLCJlbnRyeU5hbWUiLCJpbmRleE9mIiwibG9nZ2VyIiwiZGVidWciLCJpc0RpcmVjdG9yeSIsInJvb21OYW1lIiwic3BsaXQiLCJ1cGRhdGVQcm9ncmVzcyIsIlBSRVBBUklOR19DSEFOTkVMUyIsIkpTT04iLCJwYXJzZSIsImdldERhdGEiLCJ0b1N0cmluZyIsInJvb21zIiwicm9vbSIsIm5hbWUiLCJzbHVnaWZ5IiwiaXRlbSIsIm1zZ0dyb3VwRGF0YSIsImVycm9yIiwid2FybiIsInVzZXJzTmFtZSIsIlBSRVBBUklOR19VU0VSUyIsInVzZXJzIiwidXNlcnNJZCIsImNvbGxlY3Rpb24iLCJpbnNlcnQiLCJpbXBvcnRSZWNvcmQiLCJfaWQiLCJmaW5kT25lIiwidXBkYXRlUmVjb3JkIiwibGVuZ3RoIiwiYWRkQ291bnRUb1RvdGFsIiwiY2hhbm5lbHNJZCIsImNoYW5uZWxzIiwiUFJFUEFSSU5HX01FU1NBR0VTIiwibWVzc2FnZXNDb3VudCIsIk9iamVjdCIsImtleXMiLCJjaGFubmVsIiwibWVzc2FnZXNPYmoiLCJtZXNzYWdlcyIsImRhdGUiLCJtc2dzIiwiZ2V0QlNPTlNpemUiLCJnZXRNYXhCU09OU2l6ZSIsImdldEJTT05TYWZlQXJyYXlzRnJvbUFuQXJyYXkiLCJzcGxpdE1zZyIsImkiLCJtZXNzYWdlc0lkIiwiRVJST1IiLCJnZXRQcm9ncmVzcyIsInNlbGVjdGlvblVzZXJzIiwibWFwIiwidXNlciIsInVzZXJfaWQiLCJlbWFpbCIsImlzX2RlbGV0ZWQiLCJpc19ib3QiLCJzZWxlY3Rpb25DaGFubmVscyIsInJvb21faWQiLCJpc19hcmNoaXZlZCIsInNlbGVjdGlvbk1lc3NhZ2VzIiwiY291bnQiLCJVU0VSX1NFTEVDVElPTiIsInN0YXJ0SW1wb3J0IiwiaW1wb3J0U2VsZWN0aW9uIiwic3RhcnQiLCJEYXRlIiwibm93IiwidSIsImRvX2ltcG9ydCIsInVwZGF0ZSIsIiRzZXQiLCJjIiwiY2hhbm5lbF9pZCIsInN0YXJ0ZWRCeVVzZXJJZCIsIk1ldGVvciIsInVzZXJJZCIsImRlZmVyIiwiSU1QT1JUSU5HX1VTRVJTIiwicnVuQXNVc2VyIiwiZXhpc3RhbnRVc2VyIiwiUm9ja2V0Q2hhdCIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5RW1haWxBZGRyZXNzIiwicm9ja2V0SWQiLCJwdXNoIiwiaGlwY2hhdCIsIm1lbnRpb25fbmFtZSIsInJvY2tldCIsInVzZXJuYW1lIiwiQWNjb3VudHMiLCJjcmVhdGVVc2VyIiwicGFzc3dvcmQiLCJ0b1VwcGVyQ2FzZSIsImNhbGwiLCJqb2luRGVmYXVsdENoYW5uZWxzU2lsZW5jZWQiLCJwaG90b191cmwiLCJ1bmRlZmluZWQiLCJwYXJzZUludCIsInR6IiwidGltZXpvbmUiLCJmb3JtYXQiLCJzZXROYW1lIiwiYWRkQ291bnRDb21wbGV0ZWQiLCJJTVBPUlRJTkdfQ0hBTk5FTFMiLCJyZXBsYWNlIiwiZXhpc3RhbnRSb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwib3duZXJfdXNlcl9pZCIsInJldHVybmVkIiwicmlkIiwiY3JlYXRlZCIsIklNUE9SVElOR19NRVNTQUdFUyIsIm5vdXNlcnMiLCJoaXBjaGF0Q2hhbm5lbCIsImdldEhpcENoYXRDaGFubmVsRnJvbU5hbWUiLCJmaW5kT25lQnlJZCIsImZpZWxkcyIsInVzZXJuYW1lcyIsInQiLCJtZXNzYWdlIiwiZnJvbSIsImdldFJvY2tldFVzZXIiLCJtc2dPYmoiLCJtc2ciLCJjb252ZXJ0SGlwQ2hhdE1lc3NhZ2VUb1JvY2tldENoYXQiLCJ0cyIsInNlbmRNZXNzYWdlIiwiaXNBcnJheSIsImNvbnNvbGUiLCJGSU5JU0hJTkciLCJET05FIiwiZSIsInRpbWVUb29rIiwibG9nIiwiY2hhbm5lbE5hbWUiLCJmaW5kIiwiaGlwY2hhdElkIiwidXNlclJlcGxhY2UiLCJnZXRTZWxlY3Rpb24iLCJJbXBvcnRlcnMiLCJhZGQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLHVCQUFvQixNQUFJQTtBQUF6QixDQUFkO0FBQTZELElBQUlDLFlBQUo7QUFBaUJILE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNGLGVBQWFHLENBQWIsRUFBZTtBQUFDSCxtQkFBYUcsQ0FBYjtBQUFlOztBQUFoQyxDQUFuRCxFQUFxRixDQUFyRjs7QUFFdkUsTUFBTUosbUJBQU4sU0FBa0NDLFlBQWxDLENBQStDO0FBQ3JESSxnQkFBYztBQUNiLFVBQU0sU0FBTixFQUFpQixT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QXVCbUIsR0FBdkIsQ0FBMkIsVUFBU3ZDLElBQVQsRUFBZTtBQUNuRSxhQUFPLElBQUl6QyxnQkFBSixDQUFxQnlDLEtBQUs4QyxPQUExQixFQUFtQzlDLEtBQUtDLElBQXhDLEVBQThDRCxLQUFLK0MsV0FBbkQsRUFBZ0UsSUFBaEUsRUFBc0UsS0FBdEUsQ0FBUDtBQUNBLEtBRnlCLENBQTFCO0FBR0EsV0FBTyxJQUFJekYsU0FBSixDQUFjLEtBQUsyQyxJQUFuQixFQUF5QnFDLGNBQXpCLEVBQXlDTyxpQkFBekMsRUFBNEQsS0FBS2hDLFlBQUwsQ0FBa0JvQyxLQUFsQixDQUF3QnRCLFFBQXBGLENBQVA7QUFDQTs7QUF4VndDLEM7Ozs7Ozs7Ozs7O0FDZDFDLElBQUl1RyxTQUFKO0FBQWN2TCxPQUFPSSxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDa0wsWUFBVWpMLENBQVYsRUFBWTtBQUFDaUwsZ0JBQVVqTCxDQUFWO0FBQVk7O0FBQTFCLENBQW5ELEVBQStFLENBQS9FO0FBQWtGLElBQUlKLG1CQUFKO0FBQXdCRixPQUFPSSxLQUFQLENBQWFDLFFBQVEsU0FBUixDQUFiLEVBQWdDO0FBQUNILHNCQUFvQkksQ0FBcEIsRUFBc0I7QUFBQ0osMEJBQW9CSSxDQUFwQjtBQUFzQjs7QUFBOUMsQ0FBaEMsRUFBZ0YsQ0FBaEY7QUFBbUYsSUFBSUUsZUFBSjtBQUFvQlIsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDRyxrQkFBZ0JGLENBQWhCLEVBQWtCO0FBQUNFLHNCQUFnQkYsQ0FBaEI7QUFBa0I7O0FBQXRDLENBQW5DLEVBQTJFLENBQTNFO0FBSS9OaUwsVUFBVUMsR0FBVixDQUFjLElBQUl0TCxtQkFBSixFQUFkLEVBQXlDTSxlQUF6QyxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2ltcG9ydGVyLWhpcGNoYXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbXBvcnRlckluZm8gfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5cbmV4cG9ydCBjbGFzcyBIaXBDaGF0SW1wb3J0ZXJJbmZvIGV4dGVuZHMgSW1wb3J0ZXJJbmZvIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2hpcGNoYXQnLCAnSGlwQ2hhdCcsICdhcHBsaWNhdGlvbi96aXAnKTtcblx0fVxufVxuIiwiaW1wb3J0IHtcblx0QmFzZSxcblx0UHJvZ3Jlc3NTdGVwLFxuXHRTZWxlY3Rpb24sXG5cdFNlbGVjdGlvbkNoYW5uZWwsXG5cdFNlbGVjdGlvblVzZXJcbn0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6aW1wb3J0ZXInO1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcblxuaW1wb3J0ICdtb21lbnQtdGltZXpvbmUnO1xuXG5leHBvcnQgY2xhc3MgSGlwQ2hhdEltcG9ydGVyIGV4dGVuZHMgQmFzZSB7XG5cdGNvbnN0cnVjdG9yKGluZm8pIHtcblx0XHRzdXBlcihpbmZvKTtcblxuXHRcdHRoaXMudXNlclRhZ3MgPSBbXTtcblx0XHR0aGlzLnJvb21QcmVmaXggPSAnaGlwY2hhdF9leHBvcnQvcm9vbXMvJztcblx0XHR0aGlzLnVzZXJzUHJlZml4ID0gJ2hpcGNoYXRfZXhwb3J0L3VzZXJzLyc7XG5cdH1cblxuXHRwcmVwYXJlKGRhdGFVUkksIHNlbnRDb250ZW50VHlwZSwgZmlsZU5hbWUpIHtcblx0XHRzdXBlci5wcmVwYXJlKGRhdGFVUkksIHNlbnRDb250ZW50VHlwZSwgZmlsZU5hbWUpO1xuXHRcdGNvbnN0IGltYWdlID0gUm9ja2V0Q2hhdEZpbGUuZGF0YVVSSVBhcnNlKGRhdGFVUkkpLmltYWdlO1xuXHRcdC8vIGNvbnN0IGNvbnRlbnRUeXBlID0gcmVmLmNvbnRlbnRUeXBlO1xuXHRcdGNvbnN0IHppcCA9IG5ldyB0aGlzLkFkbVppcChuZXcgQnVmZmVyKGltYWdlLCAnYmFzZTY0JykpO1xuXHRcdGNvbnN0IHppcEVudHJpZXMgPSB6aXAuZ2V0RW50cmllcygpO1xuXHRcdGNvbnN0IHRlbXBSb29tcyA9IFtdO1xuXHRcdGxldCB0ZW1wVXNlcnMgPSBbXTtcblx0XHRjb25zdCB0ZW1wTWVzc2FnZXMgPSB7fTtcblxuXHRcdHppcEVudHJpZXMuZm9yRWFjaChlbnRyeSA9PiB7XG5cdFx0XHRpZiAoZW50cnkuZW50cnlOYW1lLmluZGV4T2YoJ19fTUFDT1NYJykgPiAtMSkge1xuXHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZyhgSWdub3JpbmcgdGhlIGZpbGU6ICR7IGVudHJ5LmVudHJ5TmFtZSB9YCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGVudHJ5LmVudHJ5TmFtZS5pbmRleE9mKHRoaXMucm9vbVByZWZpeCkgPiAtMSkge1xuXHRcdFx0XHRsZXQgcm9vbU5hbWUgPSBlbnRyeS5lbnRyeU5hbWUuc3BsaXQodGhpcy5yb29tUHJlZml4KVsxXTtcblx0XHRcdFx0aWYgKHJvb21OYW1lID09PSAnbGlzdC5qc29uJykge1xuXHRcdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfQ0hBTk5FTFMpO1xuXHRcdFx0XHRcdGNvbnN0IHRlbXBSb29tcyA9IEpTT04ucGFyc2UoZW50cnkuZ2V0RGF0YSgpLnRvU3RyaW5nKCkpLnJvb21zO1xuXHRcdFx0XHRcdHRlbXBSb29tcy5mb3JFYWNoKHJvb20gPT4ge1xuXHRcdFx0XHRcdFx0cm9vbS5uYW1lID0gcy5zbHVnaWZ5KHJvb20ubmFtZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAocm9vbU5hbWUuaW5kZXhPZignLycpID4gLTEpIHtcblx0XHRcdFx0XHRjb25zdCBpdGVtID0gcm9vbU5hbWUuc3BsaXQoJy8nKTtcblx0XHRcdFx0XHRyb29tTmFtZSA9IHMuc2x1Z2lmeShpdGVtWzBdKTtcblx0XHRcdFx0XHRjb25zdCBtc2dHcm91cERhdGEgPSBpdGVtWzFdLnNwbGl0KCcuJylbMF07XG5cdFx0XHRcdFx0aWYgKCF0ZW1wTWVzc2FnZXNbcm9vbU5hbWVdKSB7XG5cdFx0XHRcdFx0XHR0ZW1wTWVzc2FnZXNbcm9vbU5hbWVdID0ge307XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdGVtcE1lc3NhZ2VzW3Jvb21OYW1lXVttc2dHcm91cERhdGFdID0gSlNPTi5wYXJzZShlbnRyeS5nZXREYXRhKCkudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmxvZ2dlci53YXJuKGAkeyBlbnRyeS5lbnRyeU5hbWUgfSBpcyBub3QgYSB2YWxpZCBKU09OIGZpbGUhIFVuYWJsZSB0byBpbXBvcnQgaXQuYCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKGVudHJ5LmVudHJ5TmFtZS5pbmRleE9mKHRoaXMudXNlcnNQcmVmaXgpID4gLTEpIHtcblx0XHRcdFx0Y29uc3QgdXNlcnNOYW1lID0gZW50cnkuZW50cnlOYW1lLnNwbGl0KHRoaXMudXNlcnNQcmVmaXgpWzFdO1xuXHRcdFx0XHRpZiAodXNlcnNOYW1lID09PSAnbGlzdC5qc29uJykge1xuXHRcdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfVVNFUlMpO1xuXHRcdFx0XHRcdHJldHVybiB0ZW1wVXNlcnMgPSBKU09OLnBhcnNlKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKS51c2Vycztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5sb2dnZXIud2FybihgVW5leHBlY3RlZCBmaWxlIGluIHRoZSAkeyB0aGlzLm5hbWUgfSBpbXBvcnQ6ICR7IGVudHJ5LmVudHJ5TmFtZSB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0XHRjb25zdCB1c2Vyc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7XG5cdFx0XHQnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLFxuXHRcdFx0J2ltcG9ydGVyJzogdGhpcy5uYW1lLFxuXHRcdFx0J3R5cGUnOiAndXNlcnMnLFxuXHRcdFx0J3VzZXJzJzogdGVtcFVzZXJzXG5cdFx0fSk7XG5cdFx0dGhpcy51c2VycyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHVzZXJzSWQpO1xuXHRcdHRoaXMudXBkYXRlUmVjb3JkKHtcblx0XHRcdCdjb3VudC51c2Vycyc6IHRlbXBVc2Vycy5sZW5ndGhcblx0XHR9KTtcblx0XHR0aGlzLmFkZENvdW50VG9Ub3RhbCh0ZW1wVXNlcnMubGVuZ3RoKTtcblx0XHRjb25zdCBjaGFubmVsc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7XG5cdFx0XHQnaW1wb3J0JzogdGhpcy5pbXBvcnRSZWNvcmQuX2lkLFxuXHRcdFx0J2ltcG9ydGVyJzogdGhpcy5uYW1lLFxuXHRcdFx0J3R5cGUnOiAnY2hhbm5lbHMnLFxuXHRcdFx0J2NoYW5uZWxzJzogdGVtcFJvb21zXG5cdFx0fSk7XG5cdFx0dGhpcy5jaGFubmVscyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKGNoYW5uZWxzSWQpO1xuXHRcdHRoaXMudXBkYXRlUmVjb3JkKHtcblx0XHRcdCdjb3VudC5jaGFubmVscyc6IHRlbXBSb29tcy5sZW5ndGhcblx0XHR9KTtcblx0XHR0aGlzLmFkZENvdW50VG9Ub3RhbCh0ZW1wUm9vbXMubGVuZ3RoKTtcblx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuUFJFUEFSSU5HX01FU1NBR0VTKTtcblx0XHRsZXQgbWVzc2FnZXNDb3VudCA9IDA7XG5cdFx0T2JqZWN0LmtleXModGVtcE1lc3NhZ2VzKS5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0Y29uc3QgbWVzc2FnZXNPYmogPSB0ZW1wTWVzc2FnZXNbY2hhbm5lbF07XG5cdFx0XHR0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdID0gdGhpcy5tZXNzYWdlc1tjaGFubmVsXSB8fCB7fTtcblx0XHRcdE9iamVjdC5rZXlzKG1lc3NhZ2VzT2JqKS5mb3JFYWNoKGRhdGUgPT4ge1xuXHRcdFx0XHRjb25zdCBtc2dzID0gbWVzc2FnZXNPYmpbZGF0ZV07XG5cdFx0XHRcdG1lc3NhZ2VzQ291bnQgKz0gbXNncy5sZW5ndGg7XG5cdFx0XHRcdHRoaXMudXBkYXRlUmVjb3JkKHtcblx0XHRcdFx0XHQnbWVzc2FnZXNzdGF0dXMnOiBgJHsgY2hhbm5lbCB9LyR7IGRhdGUgfWBcblx0XHRcdFx0fSk7XG5cdFx0XHRcdGlmIChCYXNlLmdldEJTT05TaXplKG1zZ3MpID4gQmFzZS5nZXRNYXhCU09OU2l6ZSgpKSB7XG5cdFx0XHRcdFx0QmFzZS5nZXRCU09OU2FmZUFycmF5c0Zyb21BbkFycmF5KG1zZ3MpLmZvckVhY2goKHNwbGl0TXNnLCBpKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBtZXNzYWdlc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7XG5cdFx0XHRcdFx0XHRcdCdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsXG5cdFx0XHRcdFx0XHRcdCdpbXBvcnRlcic6IHRoaXMubmFtZSxcblx0XHRcdFx0XHRcdFx0J3R5cGUnOiAnbWVzc2FnZXMnLFxuXHRcdFx0XHRcdFx0XHQnbmFtZSc6IGAkeyBjaGFubmVsIH0vJHsgZGF0ZSB9LiR7IGkgfWAsXG5cdFx0XHRcdFx0XHRcdCdtZXNzYWdlcyc6IHNwbGl0TXNnXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHRoaXMubWVzc2FnZXNbY2hhbm5lbF1bYCR7IGRhdGUgfS4keyBpIH1gXSA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKG1lc3NhZ2VzSWQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IG1lc3NhZ2VzSWQgPSB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHtcblx0XHRcdFx0XHRcdCdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsXG5cdFx0XHRcdFx0XHQnaW1wb3J0ZXInOiB0aGlzLm5hbWUsXG5cdFx0XHRcdFx0XHQndHlwZSc6ICdtZXNzYWdlcycsXG5cdFx0XHRcdFx0XHQnbmFtZSc6IGAkeyBjaGFubmVsIH0vJHsgZGF0ZSB9YCxcblx0XHRcdFx0XHRcdCdtZXNzYWdlcyc6IG1zZ3Ncblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdW2RhdGVdID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUobWVzc2FnZXNJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMudXBkYXRlUmVjb3JkKHtcblx0XHRcdCdjb3VudC5tZXNzYWdlcyc6IG1lc3NhZ2VzQ291bnQsXG5cdFx0XHQnbWVzc2FnZXNzdGF0dXMnOiBudWxsXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGRDb3VudFRvVG90YWwobWVzc2FnZXNDb3VudCk7XG5cdFx0aWYgKHRlbXBVc2Vycy5sZW5ndGggPT09IDAgfHwgdGVtcFJvb21zLmxlbmd0aCA9PT0gMCB8fCBtZXNzYWdlc0NvdW50ID09PSAwKSB7XG5cdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBUaGUgbG9hZGVkIHVzZXJzIGNvdW50ICR7IHRlbXBVc2Vycy5sZW5ndGggfSwgdGhlIGxvYWRlZCBjaGFubmVscyAkeyB0ZW1wUm9vbXMubGVuZ3RoIH0sIGFuZCB0aGUgbG9hZGVkIG1lc3NhZ2VzICR7IG1lc3NhZ2VzQ291bnQgfWApO1xuXHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLkVSUk9SKTtcblx0XHRcdHJldHVybiB0aGlzLmdldFByb2dyZXNzKCk7XG5cdFx0fVxuXHRcdGNvbnN0IHNlbGVjdGlvblVzZXJzID0gdGVtcFVzZXJzLm1hcChmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvblVzZXIodXNlci51c2VyX2lkLCB1c2VyLm5hbWUsIHVzZXIuZW1haWwsIHVzZXIuaXNfZGVsZXRlZCwgZmFsc2UsICF1c2VyLmlzX2JvdCk7XG5cdFx0fSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uQ2hhbm5lbHMgPSB0ZW1wUm9vbXMubWFwKGZ1bmN0aW9uKHJvb20pIHtcblx0XHRcdHJldHVybiBuZXcgU2VsZWN0aW9uQ2hhbm5lbChyb29tLnJvb21faWQsIHJvb20ubmFtZSwgcm9vbS5pc19hcmNoaXZlZCwgdHJ1ZSwgZmFsc2UpO1xuXHRcdH0pO1xuXHRcdGNvbnN0IHNlbGVjdGlvbk1lc3NhZ2VzID0gdGhpcy5pbXBvcnRSZWNvcmQuY291bnQubWVzc2FnZXM7XG5cdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLlVTRVJfU0VMRUNUSU9OKTtcblx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbih0aGlzLm5hbWUsIHNlbGVjdGlvblVzZXJzLCBzZWxlY3Rpb25DaGFubmVscywgc2VsZWN0aW9uTWVzc2FnZXMpO1xuXHR9XG5cblx0c3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKSB7XG5cdFx0c3VwZXIuc3RhcnRJbXBvcnQoaW1wb3J0U2VsZWN0aW9uKTtcblx0XHRjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG5cblx0XHRpbXBvcnRTZWxlY3Rpb24udXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdHRoaXMudXNlcnMudXNlcnMuZm9yRWFjaCh1ID0+IHtcblx0XHRcdFx0aWYgKHUudXNlcl9pZCA9PT0gdXNlci51c2VyX2lkKSB7XG5cdFx0XHRcdFx0dS5kb19pbXBvcnQgPSB1c2VyLmRvX2ltcG9ydDtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5jb2xsZWN0aW9uLnVwZGF0ZSh7X2lkOiB0aGlzLnVzZXJzLl9pZH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH0gfSk7XG5cblx0XHRpbXBvcnRTZWxlY3Rpb24uY2hhbm5lbHMuZm9yRWFjaChjaGFubmVsID0+XG5cdFx0XHR0aGlzLmNoYW5uZWxzLmNoYW5uZWxzLmZvckVhY2goYyA9PiBjLnJvb21faWQgPT09IGNoYW5uZWwuY2hhbm5lbF9pZCAmJiAoYy5kb19pbXBvcnQgPSBjaGFubmVsLmRvX2ltcG9ydCkpXG5cdFx0KTtcblx0XHR0aGlzLmNvbGxlY3Rpb24udXBkYXRlKHsgX2lkOiB0aGlzLmNoYW5uZWxzLl9pZCB9LCB7ICRzZXQ6IHsgJ2NoYW5uZWxzJzogdGhpcy5jaGFubmVscy5jaGFubmVscyB9fSk7XG5cblx0XHRjb25zdCBzdGFydGVkQnlVc2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5JTVBPUlRJTkdfVVNFUlMpO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLnVzZXJzLnVzZXJzLmZvckVhY2godXNlciA9PiB7XG5cdFx0XHRcdFx0aWYgKCF1c2VyLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIoc3RhcnRlZEJ5VXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBleGlzdGFudFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlFbWFpbEFkZHJlc3ModXNlci5lbWFpbCk7XG5cdFx0XHRcdFx0XHRpZiAoZXhpc3RhbnRVc2VyKSB7XG5cdFx0XHRcdFx0XHRcdHVzZXIucm9ja2V0SWQgPSBleGlzdGFudFVzZXIuX2lkO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVzZXJUYWdzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGhpcGNoYXQ6IGBAJHsgdXNlci5tZW50aW9uX25hbWUgfWAsXG5cdFx0XHRcdFx0XHRcdFx0cm9ja2V0OiBgQCR7IGV4aXN0YW50VXNlci51c2VybmFtZSB9YFxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnN0IHVzZXJJZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIoe1xuXHRcdFx0XHRcdFx0XHRcdGVtYWlsOiB1c2VyLmVtYWlsLFxuXHRcdFx0XHRcdFx0XHRcdHBhc3N3b3JkOiBEYXRlLm5vdygpICsgdXNlci5uYW1lICsgdXNlci5lbWFpbC50b1VwcGVyQ2FzZSgpXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR1c2VyLnJvY2tldElkID0gdXNlcklkO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVzZXJUYWdzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGhpcGNoYXQ6IGBAJHsgdXNlci5tZW50aW9uX25hbWUgfWAsXG5cdFx0XHRcdFx0XHRcdFx0cm9ja2V0OiBgQCR7IHVzZXIubWVudGlvbl9uYW1lIH1gXG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VybmFtZScsIHVzZXIubWVudGlvbl9uYW1lLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRqb2luRGVmYXVsdENoYW5uZWxzU2lsZW5jZWQ6IHRydWVcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0QXZhdGFyRnJvbVNlcnZpY2UnLCB1c2VyLnBob3RvX3VybCwgdW5kZWZpbmVkLCAndXJsJyk7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCd1c2VyU2V0VXRjT2Zmc2V0JywgcGFyc2VJbnQobW9tZW50KCkudHoodXNlci50aW1lem9uZSkuZm9ybWF0KCdaJykudG9TdHJpbmcoKS5zcGxpdCgnOicpWzBdKSk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRpZiAodXNlci5uYW1lICE9IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXROYW1lKHVzZXJJZCwgdXNlci5uYW1lKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAodXNlci5pc19kZWxldGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldFVzZXJBY3RpdmVTdGF0dXMnLCB1c2VySWQsIGZhbHNlKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuYWRkQ291bnRDb21wbGV0ZWQoMSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuSU1QT1JUSU5HX0NIQU5ORUxTKTtcblx0XHRcdFx0dGhpcy5jaGFubmVscy5jaGFubmVscy5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0XHRcdGlmICghY2hhbm5lbC5kb19pbXBvcnQpIHtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdGNoYW5uZWwubmFtZSA9IGNoYW5uZWwubmFtZS5yZXBsYWNlKC8gL2csICcnKTtcblx0XHRcdFx0XHRcdGNvbnN0IGV4aXN0YW50Um9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoY2hhbm5lbC5uYW1lKTtcblx0XHRcdFx0XHRcdGlmIChleGlzdGFudFJvb20pIHtcblx0XHRcdFx0XHRcdFx0Y2hhbm5lbC5yb2NrZXRJZCA9IGV4aXN0YW50Um9vbS5faWQ7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRsZXQgdXNlcklkID0gJyc7XG5cdFx0XHRcdFx0XHRcdHRoaXMudXNlcnMudXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdFx0XHRcdFx0XHRpZiAodXNlci51c2VyX2lkID09PSBjaGFubmVsLm93bmVyX3VzZXJfaWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHVzZXJJZCA9IHVzZXIucm9ja2V0SWQ7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0aWYgKHVzZXJJZCA9PT0gJycpIHtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci53YXJuKGBGYWlsZWQgdG8gZmluZCB0aGUgY2hhbm5lbCBjcmVhdG9yIGZvciAkeyBjaGFubmVsLm5hbWUgfSwgc2V0dGluZyBpdCB0byB0aGUgY3VycmVudCBydW5uaW5nIHVzZXIuYCk7XG5cdFx0XHRcdFx0XHRcdFx0dXNlcklkID0gc3RhcnRlZEJ5VXNlcklkO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0Y29uc3QgcmV0dXJuZWQgPSBNZXRlb3IuY2FsbCgnY3JlYXRlQ2hhbm5lbCcsIGNoYW5uZWwubmFtZSwgW10pO1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBjaGFubmVsLnJvY2tldElkID0gcmV0dXJuZWQucmlkO1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHtcblx0XHRcdFx0XHRcdFx0XHRfaWQ6IGNoYW5uZWwucm9ja2V0SWRcblx0XHRcdFx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRcdFx0XHRcdCd0cyc6IG5ldyBEYXRlKGNoYW5uZWwuY3JlYXRlZCAqIDEwMDApXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHJldHVybiB0aGlzLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLmNvbGxlY3Rpb24udXBkYXRlKHsgX2lkOiB0aGlzLmNoYW5uZWxzLl9pZCB9LCB7ICRzZXQ6IHsgJ2NoYW5uZWxzJzogdGhpcy5jaGFubmVscy5jaGFubmVscyB9fSk7XG5cblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19NRVNTQUdFUyk7XG5cdFx0XHRcdGNvbnN0IG5vdXNlcnMgPSB7fTtcblxuXHRcdFx0XHRPYmplY3Qua2V5cyh0aGlzLm1lc3NhZ2VzKS5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IG1lc3NhZ2VzT2JqID0gdGhpcy5tZXNzYWdlc1tjaGFubmVsXTtcblx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHN0YXJ0ZWRCeVVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0Y29uc3QgaGlwY2hhdENoYW5uZWwgPSB0aGlzLmdldEhpcENoYXRDaGFubmVsRnJvbU5hbWUoY2hhbm5lbCk7XG5cdFx0XHRcdFx0XHRpZiAoaGlwY2hhdENoYW5uZWwgIT0gbnVsbCA/IGhpcGNoYXRDaGFubmVsLmRvX2ltcG9ydCA6IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQoaGlwY2hhdENoYW5uZWwucm9ja2V0SWQsIHtcblx0XHRcdFx0XHRcdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lczogMSxcblx0XHRcdFx0XHRcdFx0XHRcdHQ6IDEsXG5cdFx0XHRcdFx0XHRcdFx0XHRuYW1lOiAxXG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRPYmplY3Qua2V5cyhtZXNzYWdlc09iaikuZm9yRWFjaChkYXRlID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dzID0gbWVzc2FnZXNPYmpbZGF0ZV07XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVSZWNvcmQoe1xuXHRcdFx0XHRcdFx0XHRcdFx0J21lc3NhZ2Vzc3RhdHVzJzogYCR7IGNoYW5uZWwgfS8keyBkYXRlIH0uJHsgbXNncy5tZXNzYWdlcy5sZW5ndGggfWBcblx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdG1zZ3MubWVzc2FnZXMuZm9yRWFjaChtZXNzYWdlID0+IHtcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLmZyb20gIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCB1c2VyID0gdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UuZnJvbS51c2VyX2lkKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHVzZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IG1zZ09iaiA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG1zZzogdGhpcy5jb252ZXJ0SGlwQ2hhdE1lc3NhZ2VUb1JvY2tldENoYXQobWVzc2FnZS5tZXNzYWdlKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRzOiBuZXcgRGF0ZShtZXNzYWdlLmRhdGUpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dToge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1c2VybmFtZTogdXNlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZW5kTWVzc2FnZSh1c2VyLCBtc2dPYmosIHJvb20sIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCFub3VzZXJzW21lc3NhZ2UuZnJvbS51c2VyX2lkXSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5vdXNlcnNbbWVzc2FnZS5mcm9tLnVzZXJfaWRdID0gbWVzc2FnZS5mcm9tO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCFfLmlzQXJyYXkobWVzc2FnZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS53YXJuKCdQbGVhc2UgcmVwb3J0IHRoZSBmb2xsb3dpbmc6JywgbWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmFkZENvdW50Q29tcGxldGVkKDEpO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0dGhpcy5sb2dnZXIud2FybignVGhlIGZvbGxvd2luZyBkaWQgbm90IGhhdmUgdXNlcnM6Jywgbm91c2Vycyk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5GSU5JU0hJTkcpO1xuXG5cdFx0XHRcdHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMuZm9yRWFjaChjaGFubmVsID0+IHtcblx0XHRcdFx0XHRpZiAoY2hhbm5lbC5kb19pbXBvcnQgJiYgY2hhbm5lbC5pc19hcmNoaXZlZCkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdhcmNoaXZlUm9vbScsIGNoYW5uZWwucm9ja2V0SWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuRE9ORSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRoaXMubG9nZ2VyLmVycm9yKGUpO1xuXHRcdFx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuRVJST1IpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB0aW1lVG9vayA9IERhdGUubm93KCkgLSBzdGFydDtcblx0XHRcdHJldHVybiB0aGlzLmxvZ2dlci5sb2coYEltcG9ydCB0b29rICR7IHRpbWVUb29rIH0gbWlsbGlzZWNvbmRzLmApO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRoaXMuZ2V0UHJvZ3Jlc3MoKTtcblx0fVxuXG5cdGdldEhpcENoYXRDaGFubmVsRnJvbU5hbWUoY2hhbm5lbE5hbWUpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFubmVscy5jaGFubmVscy5maW5kKGNoYW5uZWwgPT4gY2hhbm5lbC5uYW1lID09PSBjaGFubmVsTmFtZSk7XG5cdH1cblxuXHRnZXRSb2NrZXRVc2VyKGhpcGNoYXRJZCkge1xuXHRcdGNvbnN0IHVzZXIgPSB0aGlzLnVzZXJzLnVzZXJzLmZpbmQodXNlciA9PiB1c2VyLnVzZXJfaWQgPT09IGhpcGNoYXRJZCk7XG5cdFx0cmV0dXJuIHVzZXIgPyBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh1c2VyLnJvY2tldElkLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRcdG5hbWU6IDFcblx0XHRcdH1cblx0XHR9KSA6IHVuZGVmaW5lZDtcblx0fVxuXG5cdGNvbnZlcnRIaXBDaGF0TWVzc2FnZVRvUm9ja2V0Q2hhdChtZXNzYWdlKSB7XG5cdFx0aWYgKG1lc3NhZ2UgIT0gbnVsbCkge1xuXHRcdFx0dGhpcy51c2VyVGFncy5mb3JFYWNoKHVzZXJSZXBsYWNlID0+IHtcblx0XHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSh1c2VyUmVwbGFjZS5oaXBjaGF0LCB1c2VyUmVwbGFjZS5yb2NrZXQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UgPSAnJztcblx0XHR9XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRnZXRTZWxlY3Rpb24oKSB7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uVXNlcnMgPSB0aGlzLnVzZXJzLnVzZXJzLm1hcChmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvblVzZXIodXNlci51c2VyX2lkLCB1c2VyLm5hbWUsIHVzZXIuZW1haWwsIHVzZXIuaXNfZGVsZXRlZCwgZmFsc2UsICF1c2VyLmlzX2JvdCk7XG5cdFx0fSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uQ2hhbm5lbHMgPSB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzLm1hcChmdW5jdGlvbihyb29tKSB7XG5cdFx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbkNoYW5uZWwocm9vbS5yb29tX2lkLCByb29tLm5hbWUsIHJvb20uaXNfYXJjaGl2ZWQsIHRydWUsIGZhbHNlKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbih0aGlzLm5hbWUsIHNlbGVjdGlvblVzZXJzLCBzZWxlY3Rpb25DaGFubmVscywgdGhpcy5pbXBvcnRSZWNvcmQuY291bnQubWVzc2FnZXMpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBJbXBvcnRlcnMgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5pbXBvcnQgeyBIaXBDaGF0SW1wb3J0ZXJJbmZvIH0gZnJvbSAnLi4vaW5mbyc7XG5pbXBvcnQgeyBIaXBDaGF0SW1wb3J0ZXIgfSBmcm9tICcuL2ltcG9ydGVyJztcblxuSW1wb3J0ZXJzLmFkZChuZXcgSGlwQ2hhdEltcG9ydGVySW5mbygpLCBIaXBDaGF0SW1wb3J0ZXIpO1xuIl19
