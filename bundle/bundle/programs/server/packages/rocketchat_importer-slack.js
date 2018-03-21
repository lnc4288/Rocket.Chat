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

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:importer-slack":{"info.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/info.js                                                                  //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
module.export({
  SlackImporterInfo: () => SlackImporterInfo
});
let ImporterInfo;
module.watch(require("meteor/rocketchat:importer"), {
  ImporterInfo(v) {
    ImporterInfo = v;
  }

}, 0);

class SlackImporterInfo extends ImporterInfo {
  constructor() {
    super('slack', 'Slack', 'application/zip');
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"importer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/server/importer.js                                                       //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
var _extends = require("@babel/runtime/helpers/builtin/extends");

module.export({
  SlackImporter: () => SlackImporter
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

class SlackImporter extends Base {
  constructor(info) {
    super(info);
    this.userTags = [];
    this.bots = {};
  }

  prepare(dataURI, sentContentType, fileName) {
    super.prepare(dataURI, sentContentType, fileName);
    const {
      image
    } = RocketChatFile.dataURIParse(dataURI);
    const zip = new this.AdmZip(new Buffer(image, 'base64'));
    const zipEntries = zip.getEntries();
    let tempChannels = [];
    let tempUsers = [];
    const tempMessages = {};
    zipEntries.forEach(entry => {
      if (entry.entryName.indexOf('__MACOSX') > -1) {
        return this.logger.debug(`Ignoring the file: ${entry.entryName}`);
      }

      if (entry.entryName === 'channels.json') {
        super.updateProgress(ProgressStep.PREPARING_CHANNELS);
        tempChannels = JSON.parse(entry.getData().toString()).filter(channel => channel.creator != null);
        return;
      }

      if (entry.entryName === 'users.json') {
        super.updateProgress(ProgressStep.PREPARING_USERS);
        tempUsers = JSON.parse(entry.getData().toString());
        tempUsers.forEach(user => {
          if (user.is_bot) {
            this.bots[user.profile.bot_id] = user;
          }
        });
        return;
      }

      if (!entry.isDirectory && entry.entryName.indexOf('/') > -1) {
        const item = entry.entryName.split('/');
        const channelName = item[0];
        const msgGroupData = item[1].split('.')[0];
        tempMessages[channelName] = tempMessages[channelName] || {};

        try {
          tempMessages[channelName][msgGroupData] = JSON.parse(entry.getData().toString());
        } catch (error) {
          this.logger.warn(`${entry.entryName} is not a valid JSON file! Unable to import it.`);
        }
      }
    }); // Insert the users record, eventually this might have to be split into several ones as well
    // if someone tries to import a several thousands users instance

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
    this.addCountToTotal(tempUsers.length); // Insert the channels records.

    const channelsId = this.collection.insert({
      'import': this.importRecord._id,
      'importer': this.name,
      'type': 'channels',
      'channels': tempChannels
    });
    this.channels = this.collection.findOne(channelsId);
    this.updateRecord({
      'count.channels': tempChannels.length
    });
    this.addCountToTotal(tempChannels.length); // Insert the messages records

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
          const tmp = Base.getBSONSafeArraysFromAnArray(msgs);
          Object.keys(tmp).forEach(i => {
            const splitMsg = tmp[i];
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

    if ([tempUsers.length, tempChannels.length, messagesCount].some(e => e === 0)) {
      this.logger.warn(`The loaded users count ${tempUsers.length}, the loaded channels ${tempChannels.length}, and the loaded messages ${messagesCount}`);
      console.log(`The loaded users count ${tempUsers.length}, the loaded channels ${tempChannels.length}, and the loaded messages ${messagesCount}`);
      super.updateProgress(ProgressStep.ERROR);
      return this.getProgress();
    }

    const selectionUsers = tempUsers.map(user => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
    const selectionChannels = tempChannels.map(channel => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
    const selectionMessages = this.importRecord.count.messages;
    super.updateProgress(ProgressStep.USER_SELECTION);
    return new Selection(this.name, selectionUsers, selectionChannels, selectionMessages);
  }

  startImport(importSelection) {
    super.startImport(importSelection);
    const start = Date.now();
    Object.keys(importSelection.users).forEach(key => {
      const user = importSelection.users[key];
      Object.keys(this.users.users).forEach(k => {
        const u = this.users.users[k];

        if (u.id === user.user_id) {
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
    Object.keys(importSelection.channels).forEach(key => {
      const channel = importSelection.channels[key];
      Object.keys(this.channels.channels).forEach(k => {
        const c = this.channels.channels[k];

        if (c.id === channel.channel_id) {
          c.do_import = channel.do_import;
        }
      });
    });
    this.collection.update({
      _id: this.channels._id
    }, {
      $set: {
        'channels': this.channels.channels
      }
    });
    const startedByUserId = Meteor.userId();
    Meteor.defer(() => {
      try {
        super.updateProgress(ProgressStep.IMPORTING_USERS);
        this.users.users.forEach(user => {
          if (!user.do_import) {
            return;
          }

          Meteor.runAsUser(startedByUserId, () => {
            const existantUser = RocketChat.models.Users.findOneByEmailAddress(user.profile.email) || RocketChat.models.Users.findOneByUsername(user.name);

            if (existantUser) {
              user.rocketId = existantUser._id;
              RocketChat.models.Users.update({
                _id: user.rocketId
              }, {
                $addToSet: {
                  importIds: user.id
                }
              });
              this.userTags.push({
                slack: `<@${user.id}>`,
                slackLong: `<@${user.id}|${user.name}>`,
                rocket: `@${existantUser.username}`
              });
            } else {
              const userId = user.profile.email ? Accounts.createUser({
                email: user.profile.email,
                password: Date.now() + user.name + user.profile.email.toUpperCase()
              }) : Accounts.createUser({
                username: user.name,
                password: Date.now() + user.name,
                joinDefaultChannelsSilenced: true
              });
              Meteor.runAsUser(userId, () => {
                Meteor.call('setUsername', user.name, {
                  joinDefaultChannelsSilenced: true
                });
                const url = user.profile.image_original || user.profile.image_512;

                try {
                  Meteor.call('setAvatarFromService', url, undefined, 'url');
                } catch (error) {
                  this.logger.warn(`Failed to set ${user.name}'s avatar from url ${url}`);
                  console.log(`Failed to set ${user.name}'s avatar from url ${url}`);
                } // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600


                if (user.tz_offset) {
                  Meteor.call('userSetUtcOffset', user.tz_offset / 3600);
                }
              });
              RocketChat.models.Users.update({
                _id: userId
              }, {
                $addToSet: {
                  importIds: user.id
                }
              });

              if (user.profile.real_name) {
                RocketChat.models.Users.setName(userId, user.profile.real_name);
              } //Deleted users are 'inactive' users in Rocket.Chat


              if (user.deleted) {
                Meteor.call('setUserActiveStatus', userId, false);
              }

              user.rocketId = userId;
              this.userTags.push({
                slack: `<@${user.id}>`,
                slackLong: `<@${user.id}|${user.name}>`,
                rocket: `@${user.name}`
              });
            }

            this.addCountCompleted(1);
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
            const existantRoom = RocketChat.models.Rooms.findOneByName(channel.name);

            if (existantRoom || channel.is_general) {
              if (channel.is_general && existantRoom && channel.name !== existantRoom.name) {
                Meteor.call('saveRoomSettings', 'GENERAL', 'roomName', channel.name);
              }

              channel.rocketId = channel.is_general ? 'GENERAL' : existantRoom._id;
              RocketChat.models.Rooms.update({
                _id: channel.rocketId
              }, {
                $addToSet: {
                  importIds: channel.id
                }
              });
            } else {
              const users = channel.members.reduce((ret, member) => {
                if (member !== channel.creator) {
                  const user = this.getRocketUser(member);

                  if (user && user.username) {
                    ret.push(user.username);
                  }
                }

                return ret;
              }, []);
              let userId = startedByUserId;
              this.users.users.forEach(user => {
                if (user.id === channel.creator && user.do_import) {
                  userId = user.rocketId;
                }
              });
              Meteor.runAsUser(userId, () => {
                const returned = Meteor.call('createChannel', channel.name, users);
                channel.rocketId = returned.rid;
              }); // @TODO implement model specific function

              const roomUpdate = {
                ts: new Date(channel.created * 1000)
              };

              if (!_.isEmpty(channel.topic && channel.topic.value)) {
                roomUpdate.topic = channel.topic.value;
              }

              if (!_.isEmpty(channel.purpose && channel.purpose.value)) {
                roomUpdate.description = channel.purpose.value;
              }

              RocketChat.models.Rooms.update({
                _id: channel.rocketId
              }, {
                $set: roomUpdate,
                $addToSet: {
                  importIds: channel.id
                }
              });
            }

            this.addCountCompleted(1);
          });
        });
        this.collection.update({
          _id: this.channels._id
        }, {
          $set: {
            'channels': this.channels.channels
          }
        });
        const missedTypes = {};
        const ignoreTypes = {
          'bot_add': true,
          'file_comment': true,
          'file_mention': true
        };
        super.updateProgress(ProgressStep.IMPORTING_MESSAGES);
        Object.keys(this.messages).forEach(channel => {
          const messagesObj = this.messages[channel];
          Meteor.runAsUser(startedByUserId, () => {
            const slackChannel = this.getSlackChannelFromName(channel);

            if (!slackChannel || !slackChannel.do_import) {
              return;
            }

            const room = RocketChat.models.Rooms.findOneById(slackChannel.rocketId, {
              fields: {
                usernames: 1,
                t: 1,
                name: 1
              }
            });
            Object.keys(messagesObj).forEach(date => {
              const msgs = messagesObj[date];
              msgs.messages.forEach(message => {
                this.updateRecord({
                  'messagesstatus': `${channel}/${date}.${msgs.messages.length}`
                });
                const msgDataDefaults = {
                  _id: `slack-${slackChannel.id}-${message.ts.replace(/\./g, '-')}`,
                  ts: new Date(parseInt(message.ts.split('.')[0]) * 1000)
                }; // Process the reactions

                if (message.reactions && message.reactions.length > 0) {
                  msgDataDefaults.reactions = {};
                  message.reactions.forEach(reaction => {
                    reaction.name = `:${reaction.name}:`;
                    msgDataDefaults.reactions[reaction.name] = {
                      usernames: []
                    };
                    reaction.users.forEach(u => {
                      const rcUser = this.getRocketUser(u);

                      if (!rcUser) {
                        return;
                      }

                      msgDataDefaults.reactions[reaction.name].usernames.push(rcUser.username);
                    });

                    if (msgDataDefaults.reactions[reaction.name].usernames.length === 0) {
                      delete msgDataDefaults.reactions[reaction.name];
                    }
                  });
                }

                if (message.type === 'message') {
                  if (message.subtype) {
                    if (message.subtype === 'channel_join') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_leave') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'me_message') {
                      const msgObj = _extends({}, msgDataDefaults, {
                        msg: `_${this.convertSlackMessageToRocketChat(message.text)}_`
                      });

                      RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
                    } else if (message.subtype === 'bot_message' || message.subtype === 'slackbot_response') {
                      const botUser = RocketChat.models.Users.findOneById('rocket.cat', {
                        fields: {
                          username: 1
                        }
                      });
                      const botUsername = this.bots[message.bot_id] ? this.bots[message.bot_id].name : message.username;

                      const msgObj = _extends({}, msgDataDefaults, {
                        msg: this.convertSlackMessageToRocketChat(message.text),
                        rid: room._id,
                        bot: true,
                        attachments: message.attachments,
                        username: botUsername || undefined
                      });

                      if (message.edited) {
                        msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
                        const editedBy = this.getRocketUser(message.edited.user);

                        if (editedBy) {
                          msgObj.editedBy = {
                            _id: editedBy._id,
                            username: editedBy.username
                          };
                        }
                      }

                      if (message.icons) {
                        msgObj.emoji = message.icons.emoji;
                      }

                      RocketChat.sendMessage(botUser, msgObj, room, true);
                    } else if (message.subtype === 'channel_purpose') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', room._id, message.purpose, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_topic') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', room._id, message.topic, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'channel_name') {
                      if (this.getRocketUser(message.user)) {
                        RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(room._id, message.name, this.getRocketUser(message.user), msgDataDefaults);
                      }
                    } else if (message.subtype === 'pinned_item') {
                      if (message.attachments) {
                        const msgObj = _extends({}, msgDataDefaults, {
                          attachments: [{
                            'text': this.convertSlackMessageToRocketChat(message.attachments[0].text),
                            'author_name': message.attachments[0].author_subname,
                            'author_icon': getAvatarUrlFromUsername(message.attachments[0].author_subname)
                          }]
                        });

                        RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('message_pinned', room._id, '', this.getRocketUser(message.user), msgObj);
                      } else {
                        //TODO: make this better
                        this.logger.debug('Pinned item with no attachment, needs work.'); //RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', room._id, '', @getRocketUser(message.user), msgDataDefaults
                      }
                    } else if (message.subtype === 'file_share') {
                      if (message.file && message.file.url_private_download !== undefined) {
                        const details = {
                          message_id: `slack-${message.ts.replace(/\./g, '-')}`,
                          name: message.file.name,
                          size: message.file.size,
                          type: message.file.mimetype,
                          rid: room._id
                        };
                        this.uploadFile(details, message.file.url_private_download, this.getRocketUser(message.user), room, new Date(parseInt(message.ts.split('.')[0]) * 1000));
                      }
                    } else if (!missedTypes[message.subtype] && !ignoreTypes[message.subtype]) {
                      missedTypes[message.subtype] = message;
                    }
                  } else {
                    const user = this.getRocketUser(message.user);

                    if (user) {
                      const msgObj = _extends({}, msgDataDefaults, {
                        msg: this.convertSlackMessageToRocketChat(message.text),
                        rid: room._id,
                        u: {
                          _id: user._id,
                          username: user.username
                        }
                      });

                      if (message.edited) {
                        msgObj.editedAt = new Date(parseInt(message.edited.ts.split('.')[0]) * 1000);
                        const editedBy = this.getRocketUser(message.edited.user);

                        if (editedBy) {
                          msgObj.editedBy = {
                            _id: editedBy._id,
                            username: editedBy.username
                          };
                        }
                      }

                      try {
                        RocketChat.sendMessage(this.getRocketUser(message.user), msgObj, room, true);
                      } catch (e) {
                        this.logger.warn(`Failed to import the message: ${msgDataDefaults._id}`);
                      }
                    }
                  }
                }

                this.addCountCompleted(1);
              });
            });
          });
        });

        if (!_.isEmpty(missedTypes)) {
          console.log('Missed import types:', missedTypes);
        }

        super.updateProgress(ProgressStep.FINISHING);
        this.channels.channels.forEach(channel => {
          if (channel.do_import && channel.is_archived) {
            Meteor.runAsUser(startedByUserId, function () {
              Meteor.call('archiveRoom', channel.rocketId);
            });
          }
        });
        super.updateProgress(ProgressStep.DONE);
        this.logger.log(`Import took ${Date.now() - start} milliseconds.`);
      } catch (e) {
        this.logger.error(e);
        super.updateProgress(ProgressStep.ERROR);
      }
    });
    return this.getProgress();
  }

  getSlackChannelFromName(channelName) {
    return this.channels.channels.find(channel => channel.name === channelName);
  }

  getRocketUser(slackId) {
    const user = this.users.users.find(user => user.id === slackId);

    if (user) {
      return RocketChat.models.Users.findOneById(user.rocketId, {
        fields: {
          username: 1,
          name: 1
        }
      });
    }
  }

  convertSlackMessageToRocketChat(message) {
    if (message) {
      message = message.replace(/<!everyone>/g, '@all');
      message = message.replace(/<!channel>/g, '@all');
      message = message.replace(/<!here>/g, '@here');
      message = message.replace(/&gt;/g, '>');
      message = message.replace(/&lt;/g, '<');
      message = message.replace(/&amp;/g, '&');
      message = message.replace(/:simple_smile:/g, ':smile:');
      message = message.replace(/:memo:/g, ':pencil:');
      message = message.replace(/:piggy:/g, ':pig:');
      message = message.replace(/:uk:/g, ':gb:');
      message = message.replace(/<(http[s]?:[^>]*)>/g, '$1');

      for (const userReplace of Array.from(this.userTags)) {
        message = message.replace(userReplace.slack, userReplace.rocket);
        message = message.replace(userReplace.slackLong, userReplace.rocket);
      }
    } else {
      message = '';
    }

    return message;
  }

  getSelection() {
    const selectionUsers = this.users.users.map(user => new SelectionUser(user.id, user.name, user.profile.email, user.deleted, user.is_bot, !user.is_bot));
    const selectionChannels = this.channels.channels.map(channel => new SelectionChannel(channel.id, channel.name, channel.is_archived, true, false));
    return new Selection(this.name, selectionUsers, selectionChannels, this.importRecord.count.messages);
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"adder.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/rocketchat_importer-slack/server/adder.js                                                          //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
let Importers;
module.watch(require("meteor/rocketchat:importer"), {
  Importers(v) {
    Importers = v;
  }

}, 0);
let SlackImporterInfo;
module.watch(require("../info"), {
  SlackImporterInfo(v) {
    SlackImporterInfo = v;
  }

}, 1);
let SlackImporter;
module.watch(require("./importer"), {
  SlackImporter(v) {
    SlackImporter = v;
  }

}, 2);
Importers.add(new SlackImporterInfo(), SlackImporter);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:importer-slack/info.js");
require("/node_modules/meteor/rocketchat:importer-slack/server/importer.js");
require("/node_modules/meteor/rocketchat:importer-slack/server/adder.js");

/* Exports */
Package._define("rocketchat:importer-slack");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_importer-slack.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1zbGFjay9pbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmltcG9ydGVyLXNsYWNrL3NlcnZlci9pbXBvcnRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbXBvcnRlci1zbGFjay9zZXJ2ZXIvYWRkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiU2xhY2tJbXBvcnRlckluZm8iLCJJbXBvcnRlckluZm8iLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiY29uc3RydWN0b3IiLCJTbGFja0ltcG9ydGVyIiwiQmFzZSIsIlByb2dyZXNzU3RlcCIsIlNlbGVjdGlvbiIsIlNlbGVjdGlvbkNoYW5uZWwiLCJTZWxlY3Rpb25Vc2VyIiwiXyIsImRlZmF1bHQiLCJpbmZvIiwidXNlclRhZ3MiLCJib3RzIiwicHJlcGFyZSIsImRhdGFVUkkiLCJzZW50Q29udGVudFR5cGUiLCJmaWxlTmFtZSIsImltYWdlIiwiUm9ja2V0Q2hhdEZpbGUiLCJkYXRhVVJJUGFyc2UiLCJ6aXAiLCJBZG1aaXAiLCJCdWZmZXIiLCJ6aXBFbnRyaWVzIiwiZ2V0RW50cmllcyIsInRlbXBDaGFubmVscyIsInRlbXBVc2VycyIsInRlbXBNZXNzYWdlcyIsImZvckVhY2giLCJlbnRyeSIsImVudHJ5TmFtZSIsImluZGV4T2YiLCJsb2dnZXIiLCJkZWJ1ZyIsInVwZGF0ZVByb2dyZXNzIiwiUFJFUEFSSU5HX0NIQU5ORUxTIiwiSlNPTiIsInBhcnNlIiwiZ2V0RGF0YSIsInRvU3RyaW5nIiwiZmlsdGVyIiwiY2hhbm5lbCIsImNyZWF0b3IiLCJQUkVQQVJJTkdfVVNFUlMiLCJ1c2VyIiwiaXNfYm90IiwicHJvZmlsZSIsImJvdF9pZCIsImlzRGlyZWN0b3J5IiwiaXRlbSIsInNwbGl0IiwiY2hhbm5lbE5hbWUiLCJtc2dHcm91cERhdGEiLCJlcnJvciIsIndhcm4iLCJ1c2Vyc0lkIiwiY29sbGVjdGlvbiIsImluc2VydCIsImltcG9ydFJlY29yZCIsIl9pZCIsIm5hbWUiLCJ1c2VycyIsImZpbmRPbmUiLCJ1cGRhdGVSZWNvcmQiLCJsZW5ndGgiLCJhZGRDb3VudFRvVG90YWwiLCJjaGFubmVsc0lkIiwiY2hhbm5lbHMiLCJQUkVQQVJJTkdfTUVTU0FHRVMiLCJtZXNzYWdlc0NvdW50IiwiT2JqZWN0Iiwia2V5cyIsIm1lc3NhZ2VzT2JqIiwibWVzc2FnZXMiLCJkYXRlIiwibXNncyIsImdldEJTT05TaXplIiwiZ2V0TWF4QlNPTlNpemUiLCJ0bXAiLCJnZXRCU09OU2FmZUFycmF5c0Zyb21BbkFycmF5IiwiaSIsInNwbGl0TXNnIiwibWVzc2FnZXNJZCIsInNvbWUiLCJlIiwiY29uc29sZSIsImxvZyIsIkVSUk9SIiwiZ2V0UHJvZ3Jlc3MiLCJzZWxlY3Rpb25Vc2VycyIsIm1hcCIsImlkIiwiZW1haWwiLCJkZWxldGVkIiwic2VsZWN0aW9uQ2hhbm5lbHMiLCJpc19hcmNoaXZlZCIsInNlbGVjdGlvbk1lc3NhZ2VzIiwiY291bnQiLCJVU0VSX1NFTEVDVElPTiIsInN0YXJ0SW1wb3J0IiwiaW1wb3J0U2VsZWN0aW9uIiwic3RhcnQiLCJEYXRlIiwibm93Iiwia2V5IiwiayIsInUiLCJ1c2VyX2lkIiwiZG9faW1wb3J0IiwidXBkYXRlIiwiJHNldCIsImMiLCJjaGFubmVsX2lkIiwic3RhcnRlZEJ5VXNlcklkIiwiTWV0ZW9yIiwidXNlcklkIiwiZGVmZXIiLCJJTVBPUlRJTkdfVVNFUlMiLCJydW5Bc1VzZXIiLCJleGlzdGFudFVzZXIiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiVXNlcnMiLCJmaW5kT25lQnlFbWFpbEFkZHJlc3MiLCJmaW5kT25lQnlVc2VybmFtZSIsInJvY2tldElkIiwiJGFkZFRvU2V0IiwiaW1wb3J0SWRzIiwicHVzaCIsInNsYWNrIiwic2xhY2tMb25nIiwicm9ja2V0IiwidXNlcm5hbWUiLCJBY2NvdW50cyIsImNyZWF0ZVVzZXIiLCJwYXNzd29yZCIsInRvVXBwZXJDYXNlIiwiam9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkIiwiY2FsbCIsInVybCIsImltYWdlX29yaWdpbmFsIiwiaW1hZ2VfNTEyIiwidW5kZWZpbmVkIiwidHpfb2Zmc2V0IiwicmVhbF9uYW1lIiwic2V0TmFtZSIsImFkZENvdW50Q29tcGxldGVkIiwiSU1QT1JUSU5HX0NIQU5ORUxTIiwiZXhpc3RhbnRSb29tIiwiUm9vbXMiLCJmaW5kT25lQnlOYW1lIiwiaXNfZ2VuZXJhbCIsIm1lbWJlcnMiLCJyZWR1Y2UiLCJyZXQiLCJtZW1iZXIiLCJnZXRSb2NrZXRVc2VyIiwicmV0dXJuZWQiLCJyaWQiLCJyb29tVXBkYXRlIiwidHMiLCJjcmVhdGVkIiwiaXNFbXB0eSIsInRvcGljIiwidmFsdWUiLCJwdXJwb3NlIiwiZGVzY3JpcHRpb24iLCJtaXNzZWRUeXBlcyIsImlnbm9yZVR5cGVzIiwiSU1QT1JUSU5HX01FU1NBR0VTIiwic2xhY2tDaGFubmVsIiwiZ2V0U2xhY2tDaGFubmVsRnJvbU5hbWUiLCJyb29tIiwiZmluZE9uZUJ5SWQiLCJmaWVsZHMiLCJ1c2VybmFtZXMiLCJ0IiwibWVzc2FnZSIsIm1zZ0RhdGFEZWZhdWx0cyIsInJlcGxhY2UiLCJwYXJzZUludCIsInJlYWN0aW9ucyIsInJlYWN0aW9uIiwicmNVc2VyIiwidHlwZSIsInN1YnR5cGUiLCJNZXNzYWdlcyIsImNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIiLCJjcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlciIsIm1zZ09iaiIsIm1zZyIsImNvbnZlcnRTbGFja01lc3NhZ2VUb1JvY2tldENoYXQiLCJ0ZXh0Iiwic2VuZE1lc3NhZ2UiLCJib3RVc2VyIiwiYm90VXNlcm5hbWUiLCJib3QiLCJhdHRhY2htZW50cyIsImVkaXRlZCIsImVkaXRlZEF0IiwiZWRpdGVkQnkiLCJpY29ucyIsImVtb2ppIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJjcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIiLCJhdXRob3Jfc3VibmFtZSIsImdldEF2YXRhclVybEZyb21Vc2VybmFtZSIsImNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJmaWxlIiwidXJsX3ByaXZhdGVfZG93bmxvYWQiLCJkZXRhaWxzIiwibWVzc2FnZV9pZCIsInNpemUiLCJtaW1ldHlwZSIsInVwbG9hZEZpbGUiLCJGSU5JU0hJTkciLCJET05FIiwiZmluZCIsInNsYWNrSWQiLCJ1c2VyUmVwbGFjZSIsIkFycmF5IiwiZnJvbSIsImdldFNlbGVjdGlvbiIsIkltcG9ydGVycyIsImFkZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxNQUFQLENBQWM7QUFBQ0MscUJBQWtCLE1BQUlBO0FBQXZCLENBQWQ7QUFBeUQsSUFBSUMsWUFBSjtBQUFpQkgsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0YsZUFBYUcsQ0FBYixFQUFlO0FBQUNILG1CQUFhRyxDQUFiO0FBQWU7O0FBQWhDLENBQW5ELEVBQXFGLENBQXJGOztBQUVuRSxNQUFNSixpQkFBTixTQUFnQ0MsWUFBaEMsQ0FBNkM7QUFDbkRJLGdCQUFjO0FBQ2IsVUFBTSxPQUFOLEVBQWUsT0FBZixFQUF3QixpQkFBeEI7QUFDQTs7QUFIa0QsQzs7Ozs7Ozs7Ozs7OztBQ0ZwRFAsT0FBT0MsTUFBUCxDQUFjO0FBQUNPLGlCQUFjLE1BQUlBO0FBQW5CLENBQWQ7QUFBaUQsSUFBSUMsSUFBSixFQUFTQyxZQUFULEVBQXNCQyxTQUF0QixFQUFnQ0MsZ0JBQWhDLEVBQWlEQyxhQUFqRDtBQUErRGIsT0FBT0ksS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0ksT0FBS0gsQ0FBTCxFQUFPO0FBQUNHLFdBQUtILENBQUw7QUFBTyxHQUFoQjs7QUFBaUJJLGVBQWFKLENBQWIsRUFBZTtBQUFDSSxtQkFBYUosQ0FBYjtBQUFlLEdBQWhEOztBQUFpREssWUFBVUwsQ0FBVixFQUFZO0FBQUNLLGdCQUFVTCxDQUFWO0FBQVksR0FBMUU7O0FBQTJFTSxtQkFBaUJOLENBQWpCLEVBQW1CO0FBQUNNLHVCQUFpQk4sQ0FBakI7QUFBbUIsR0FBbEg7O0FBQW1ITyxnQkFBY1AsQ0FBZCxFQUFnQjtBQUFDTyxvQkFBY1AsQ0FBZDtBQUFnQjs7QUFBcEosQ0FBbkQsRUFBeU0sQ0FBek07O0FBQTRNLElBQUlRLENBQUo7O0FBQU1kLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ1UsVUFBUVQsQ0FBUixFQUFVO0FBQUNRLFFBQUVSLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBVTNULE1BQU1FLGFBQU4sU0FBNEJDLElBQTVCLENBQWlDO0FBQ3ZDRixjQUFZUyxJQUFaLEVBQWtCO0FBQ2pCLFVBQU1BLElBQU47QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLEVBQVo7QUFDQTs7QUFFREMsVUFBUUMsT0FBUixFQUFpQkMsZUFBakIsRUFBa0NDLFFBQWxDLEVBQTRDO0FBQzNDLFVBQU1ILE9BQU4sQ0FBY0MsT0FBZCxFQUF1QkMsZUFBdkIsRUFBd0NDLFFBQXhDO0FBRUEsVUFBTTtBQUFFQztBQUFGLFFBQVlDLGVBQWVDLFlBQWYsQ0FBNEJMLE9BQTVCLENBQWxCO0FBQ0EsVUFBTU0sTUFBTSxJQUFJLEtBQUtDLE1BQVQsQ0FBZ0IsSUFBSUMsTUFBSixDQUFXTCxLQUFYLEVBQWtCLFFBQWxCLENBQWhCLENBQVo7QUFDQSxVQUFNTSxhQUFhSCxJQUFJSSxVQUFKLEVBQW5CO0FBRUEsUUFBSUMsZUFBZSxFQUFuQjtBQUNBLFFBQUlDLFlBQVksRUFBaEI7QUFDQSxVQUFNQyxlQUFlLEVBQXJCO0FBRUFKLGVBQVdLLE9BQVgsQ0FBbUJDLFNBQVM7QUFDM0IsVUFBSUEsTUFBTUMsU0FBTixDQUFnQkMsT0FBaEIsQ0FBd0IsVUFBeEIsSUFBc0MsQ0FBQyxDQUEzQyxFQUE4QztBQUM3QyxlQUFPLEtBQUtDLE1BQUwsQ0FBWUMsS0FBWixDQUFtQixzQkFBc0JKLE1BQU1DLFNBQVcsRUFBMUQsQ0FBUDtBQUNBOztBQUVELFVBQUlELE1BQU1DLFNBQU4sS0FBb0IsZUFBeEIsRUFBeUM7QUFDeEMsY0FBTUksY0FBTixDQUFxQjlCLGFBQWErQixrQkFBbEM7QUFDQVYsdUJBQWVXLEtBQUtDLEtBQUwsQ0FBV1IsTUFBTVMsT0FBTixHQUFnQkMsUUFBaEIsRUFBWCxFQUF1Q0MsTUFBdkMsQ0FBOENDLFdBQVdBLFFBQVFDLE9BQVIsSUFBbUIsSUFBNUUsQ0FBZjtBQUNBO0FBQ0E7O0FBRUQsVUFBSWIsTUFBTUMsU0FBTixLQUFvQixZQUF4QixFQUFzQztBQUNyQyxjQUFNSSxjQUFOLENBQXFCOUIsYUFBYXVDLGVBQWxDO0FBQ0FqQixvQkFBWVUsS0FBS0MsS0FBTCxDQUFXUixNQUFNUyxPQUFOLEdBQWdCQyxRQUFoQixFQUFYLENBQVo7QUFFQWIsa0JBQVVFLE9BQVYsQ0FBa0JnQixRQUFRO0FBQ3pCLGNBQUlBLEtBQUtDLE1BQVQsRUFBaUI7QUFDaEIsaUJBQUtqQyxJQUFMLENBQVVnQyxLQUFLRSxPQUFMLENBQWFDLE1BQXZCLElBQWlDSCxJQUFqQztBQUNBO0FBQ0QsU0FKRDtBQU1BO0FBQ0E7O0FBRUQsVUFBSSxDQUFDZixNQUFNbUIsV0FBUCxJQUFzQm5CLE1BQU1DLFNBQU4sQ0FBZ0JDLE9BQWhCLENBQXdCLEdBQXhCLElBQStCLENBQUMsQ0FBMUQsRUFBNkQ7QUFDNUQsY0FBTWtCLE9BQU9wQixNQUFNQyxTQUFOLENBQWdCb0IsS0FBaEIsQ0FBc0IsR0FBdEIsQ0FBYjtBQUNBLGNBQU1DLGNBQWNGLEtBQUssQ0FBTCxDQUFwQjtBQUNBLGNBQU1HLGVBQWVILEtBQUssQ0FBTCxFQUFRQyxLQUFSLENBQWMsR0FBZCxFQUFtQixDQUFuQixDQUFyQjtBQUNBdkIscUJBQWF3QixXQUFiLElBQTRCeEIsYUFBYXdCLFdBQWIsS0FBNkIsRUFBekQ7O0FBRUEsWUFBSTtBQUNIeEIsdUJBQWF3QixXQUFiLEVBQTBCQyxZQUExQixJQUEwQ2hCLEtBQUtDLEtBQUwsQ0FBV1IsTUFBTVMsT0FBTixHQUFnQkMsUUFBaEIsRUFBWCxDQUExQztBQUNBLFNBRkQsQ0FFRSxPQUFPYyxLQUFQLEVBQWM7QUFDZixlQUFLckIsTUFBTCxDQUFZc0IsSUFBWixDQUFrQixHQUFHekIsTUFBTUMsU0FBVyxpREFBdEM7QUFDQTtBQUNEO0FBQ0QsS0FwQ0QsRUFYMkMsQ0FpRDNDO0FBQ0E7O0FBQ0EsVUFBTXlCLFVBQVUsS0FBS0MsVUFBTCxDQUFnQkMsTUFBaEIsQ0FBdUI7QUFBRSxnQkFBVSxLQUFLQyxZQUFMLENBQWtCQyxHQUE5QjtBQUFtQyxrQkFBWSxLQUFLQyxJQUFwRDtBQUEwRCxjQUFRLE9BQWxFO0FBQTJFLGVBQVNsQztBQUFwRixLQUF2QixDQUFoQjtBQUNBLFNBQUttQyxLQUFMLEdBQWEsS0FBS0wsVUFBTCxDQUFnQk0sT0FBaEIsQ0FBd0JQLE9BQXhCLENBQWI7QUFDQSxTQUFLUSxZQUFMLENBQWtCO0FBQUUscUJBQWVyQyxVQUFVc0M7QUFBM0IsS0FBbEI7QUFDQSxTQUFLQyxlQUFMLENBQXFCdkMsVUFBVXNDLE1BQS9CLEVBdEQyQyxDQXdEM0M7O0FBQ0EsVUFBTUUsYUFBYSxLQUFLVixVQUFMLENBQWdCQyxNQUFoQixDQUF1QjtBQUFFLGdCQUFVLEtBQUtDLFlBQUwsQ0FBa0JDLEdBQTlCO0FBQW1DLGtCQUFZLEtBQUtDLElBQXBEO0FBQTBELGNBQVEsVUFBbEU7QUFBOEUsa0JBQVluQztBQUExRixLQUF2QixDQUFuQjtBQUNBLFNBQUswQyxRQUFMLEdBQWdCLEtBQUtYLFVBQUwsQ0FBZ0JNLE9BQWhCLENBQXdCSSxVQUF4QixDQUFoQjtBQUNBLFNBQUtILFlBQUwsQ0FBa0I7QUFBRSx3QkFBa0J0QyxhQUFhdUM7QUFBakMsS0FBbEI7QUFDQSxTQUFLQyxlQUFMLENBQXFCeEMsYUFBYXVDLE1BQWxDLEVBNUQyQyxDQThEM0M7O0FBQ0EsVUFBTTlCLGNBQU4sQ0FBcUI5QixhQUFhZ0Usa0JBQWxDO0FBRUEsUUFBSUMsZ0JBQWdCLENBQXBCO0FBQ0FDLFdBQU9DLElBQVAsQ0FBWTVDLFlBQVosRUFBMEJDLE9BQTFCLENBQWtDYSxXQUFXO0FBQzVDLFlBQU0rQixjQUFjN0MsYUFBYWMsT0FBYixDQUFwQjtBQUNBLFdBQUtnQyxRQUFMLENBQWNoQyxPQUFkLElBQXlCLEtBQUtnQyxRQUFMLENBQWNoQyxPQUFkLEtBQTBCLEVBQW5EO0FBRUE2QixhQUFPQyxJQUFQLENBQVlDLFdBQVosRUFBeUI1QyxPQUF6QixDQUFpQzhDLFFBQVE7QUFDeEMsY0FBTUMsT0FBT0gsWUFBWUUsSUFBWixDQUFiO0FBQ0FMLHlCQUFpQk0sS0FBS1gsTUFBdEI7QUFDQSxhQUFLRCxZQUFMLENBQWtCO0FBQUUsNEJBQW1CLEdBQUd0QixPQUFTLElBQUlpQyxJQUFNO0FBQTNDLFNBQWxCOztBQUNBLFlBQUl2RSxLQUFLeUUsV0FBTCxDQUFpQkQsSUFBakIsSUFBeUJ4RSxLQUFLMEUsY0FBTCxFQUE3QixFQUFvRDtBQUNuRCxnQkFBTUMsTUFBTTNFLEtBQUs0RSw0QkFBTCxDQUFrQ0osSUFBbEMsQ0FBWjtBQUNBTCxpQkFBT0MsSUFBUCxDQUFZTyxHQUFaLEVBQWlCbEQsT0FBakIsQ0FBeUJvRCxLQUFLO0FBQzdCLGtCQUFNQyxXQUFXSCxJQUFJRSxDQUFKLENBQWpCO0FBQ0Esa0JBQU1FLGFBQWEsS0FBSzFCLFVBQUwsQ0FBZ0JDLE1BQWhCLENBQXVCO0FBQUUsd0JBQVUsS0FBS0MsWUFBTCxDQUFrQkMsR0FBOUI7QUFBbUMsMEJBQVksS0FBS0MsSUFBcEQ7QUFBMEQsc0JBQVEsVUFBbEU7QUFBOEUsc0JBQVMsR0FBR25CLE9BQVMsSUFBSWlDLElBQU0sSUFBSU0sQ0FBRyxFQUFwSDtBQUF1SCwwQkFBWUM7QUFBbkksYUFBdkIsQ0FBbkI7QUFDQSxpQkFBS1IsUUFBTCxDQUFjaEMsT0FBZCxFQUF3QixHQUFHaUMsSUFBTSxJQUFJTSxDQUFHLEVBQXhDLElBQTZDLEtBQUt4QixVQUFMLENBQWdCTSxPQUFoQixDQUF3Qm9CLFVBQXhCLENBQTdDO0FBQ0EsV0FKRDtBQUtBLFNBUEQsTUFPTztBQUNOLGdCQUFNQSxhQUFhLEtBQUsxQixVQUFMLENBQWdCQyxNQUFoQixDQUF1QjtBQUFFLHNCQUFVLEtBQUtDLFlBQUwsQ0FBa0JDLEdBQTlCO0FBQW1DLHdCQUFZLEtBQUtDLElBQXBEO0FBQTBELG9CQUFRLFVBQWxFO0FBQThFLG9CQUFTLEdBQUduQixPQUFTLElBQUlpQyxJQUFNLEVBQTdHO0FBQWdILHdCQUFZQztBQUE1SCxXQUF2QixDQUFuQjtBQUNBLGVBQUtGLFFBQUwsQ0FBY2hDLE9BQWQsRUFBdUJpQyxJQUF2QixJQUErQixLQUFLbEIsVUFBTCxDQUFnQk0sT0FBaEIsQ0FBd0JvQixVQUF4QixDQUEvQjtBQUNBO0FBQ0QsT0FmRDtBQWdCQSxLQXBCRDtBQXNCQSxTQUFLbkIsWUFBTCxDQUFrQjtBQUFFLHdCQUFrQk0sYUFBcEI7QUFBbUMsd0JBQWtCO0FBQXJELEtBQWxCO0FBQ0EsU0FBS0osZUFBTCxDQUFxQkksYUFBckI7O0FBRUEsUUFBSSxDQUFDM0MsVUFBVXNDLE1BQVgsRUFBbUJ2QyxhQUFhdUMsTUFBaEMsRUFBd0NLLGFBQXhDLEVBQXVEYyxJQUF2RCxDQUE0REMsS0FBS0EsTUFBTSxDQUF2RSxDQUFKLEVBQStFO0FBQzlFLFdBQUtwRCxNQUFMLENBQVlzQixJQUFaLENBQWtCLDBCQUEwQjVCLFVBQVVzQyxNQUFRLHlCQUF5QnZDLGFBQWF1QyxNQUFRLDZCQUE2QkssYUFBZSxFQUF4SjtBQUNBZ0IsY0FBUUMsR0FBUixDQUFhLDBCQUEwQjVELFVBQVVzQyxNQUFRLHlCQUF5QnZDLGFBQWF1QyxNQUFRLDZCQUE2QkssYUFBZSxFQUFuSjtBQUNBLFlBQU1uQyxjQUFOLENBQXFCOUIsYUFBYW1GLEtBQWxDO0FBQ0EsYUFBTyxLQUFLQyxXQUFMLEVBQVA7QUFDQTs7QUFFRCxVQUFNQyxpQkFBaUIvRCxVQUFVZ0UsR0FBVixDQUFjOUMsUUFBUSxJQUFJckMsYUFBSixDQUFrQnFDLEtBQUsrQyxFQUF2QixFQUEyQi9DLEtBQUtnQixJQUFoQyxFQUFzQ2hCLEtBQUtFLE9BQUwsQ0FBYThDLEtBQW5ELEVBQTBEaEQsS0FBS2lELE9BQS9ELEVBQXdFakQsS0FBS0MsTUFBN0UsRUFBcUYsQ0FBQ0QsS0FBS0MsTUFBM0YsQ0FBdEIsQ0FBdkI7QUFDQSxVQUFNaUQsb0JBQW9CckUsYUFBYWlFLEdBQWIsQ0FBaUJqRCxXQUFXLElBQUluQyxnQkFBSixDQUFxQm1DLFFBQVFrRCxFQUE3QixFQUFpQ2xELFFBQVFtQixJQUF6QyxFQUErQ25CLFFBQVFzRCxXQUF2RCxFQUFvRSxJQUFwRSxFQUEwRSxLQUExRSxDQUE1QixDQUExQjtBQUNBLFVBQU1DLG9CQUFvQixLQUFLdEMsWUFBTCxDQUFrQnVDLEtBQWxCLENBQXdCeEIsUUFBbEQ7QUFDQSxVQUFNdkMsY0FBTixDQUFxQjlCLGFBQWE4RixjQUFsQztBQUVBLFdBQU8sSUFBSTdGLFNBQUosQ0FBYyxLQUFLdUQsSUFBbkIsRUFBeUI2QixjQUF6QixFQUF5Q0ssaUJBQXpDLEVBQTRERSxpQkFBNUQsQ0FBUDtBQUNBOztBQUVERyxjQUFZQyxlQUFaLEVBQTZCO0FBQzVCLFVBQU1ELFdBQU4sQ0FBa0JDLGVBQWxCO0FBQ0EsVUFBTUMsUUFBUUMsS0FBS0MsR0FBTCxFQUFkO0FBRUFqQyxXQUFPQyxJQUFQLENBQVk2QixnQkFBZ0J2QyxLQUE1QixFQUFtQ2pDLE9BQW5DLENBQTJDNEUsT0FBTztBQUNqRCxZQUFNNUQsT0FBT3dELGdCQUFnQnZDLEtBQWhCLENBQXNCMkMsR0FBdEIsQ0FBYjtBQUNBbEMsYUFBT0MsSUFBUCxDQUFZLEtBQUtWLEtBQUwsQ0FBV0EsS0FBdkIsRUFBOEJqQyxPQUE5QixDQUFzQzZFLEtBQUs7QUFDMUMsY0FBTUMsSUFBSSxLQUFLN0MsS0FBTCxDQUFXQSxLQUFYLENBQWlCNEMsQ0FBakIsQ0FBVjs7QUFDQSxZQUFJQyxFQUFFZixFQUFGLEtBQVMvQyxLQUFLK0QsT0FBbEIsRUFBMkI7QUFDMUJELFlBQUVFLFNBQUYsR0FBY2hFLEtBQUtnRSxTQUFuQjtBQUNBO0FBQ0QsT0FMRDtBQU1BLEtBUkQ7QUFTQSxTQUFLcEQsVUFBTCxDQUFnQnFELE1BQWhCLENBQXVCO0FBQUVsRCxXQUFLLEtBQUtFLEtBQUwsQ0FBV0Y7QUFBbEIsS0FBdkIsRUFBZ0Q7QUFBRW1ELFlBQU07QUFBRSxpQkFBUyxLQUFLakQsS0FBTCxDQUFXQTtBQUF0QjtBQUFSLEtBQWhEO0FBRUFTLFdBQU9DLElBQVAsQ0FBWTZCLGdCQUFnQmpDLFFBQTVCLEVBQXNDdkMsT0FBdEMsQ0FBOEM0RSxPQUFPO0FBQ3BELFlBQU0vRCxVQUFVMkQsZ0JBQWdCakMsUUFBaEIsQ0FBeUJxQyxHQUF6QixDQUFoQjtBQUNBbEMsYUFBT0MsSUFBUCxDQUFZLEtBQUtKLFFBQUwsQ0FBY0EsUUFBMUIsRUFBb0N2QyxPQUFwQyxDQUE0QzZFLEtBQUs7QUFDaEQsY0FBTU0sSUFBSSxLQUFLNUMsUUFBTCxDQUFjQSxRQUFkLENBQXVCc0MsQ0FBdkIsQ0FBVjs7QUFDQSxZQUFJTSxFQUFFcEIsRUFBRixLQUFTbEQsUUFBUXVFLFVBQXJCLEVBQWlDO0FBQ2hDRCxZQUFFSCxTQUFGLEdBQWNuRSxRQUFRbUUsU0FBdEI7QUFDQTtBQUNELE9BTEQ7QUFNQSxLQVJEO0FBU0EsU0FBS3BELFVBQUwsQ0FBZ0JxRCxNQUFoQixDQUF1QjtBQUFFbEQsV0FBSyxLQUFLUSxRQUFMLENBQWNSO0FBQXJCLEtBQXZCLEVBQW1EO0FBQUVtRCxZQUFNO0FBQUUsb0JBQVksS0FBSzNDLFFBQUwsQ0FBY0E7QUFBNUI7QUFBUixLQUFuRDtBQUVBLFVBQU04QyxrQkFBa0JDLE9BQU9DLE1BQVAsRUFBeEI7QUFDQUQsV0FBT0UsS0FBUCxDQUFhLE1BQU07QUFDbEIsVUFBSTtBQUNILGNBQU1sRixjQUFOLENBQXFCOUIsYUFBYWlILGVBQWxDO0FBQ0EsYUFBS3hELEtBQUwsQ0FBV0EsS0FBWCxDQUFpQmpDLE9BQWpCLENBQXlCZ0IsUUFBUTtBQUNoQyxjQUFJLENBQUNBLEtBQUtnRSxTQUFWLEVBQXFCO0FBQ3BCO0FBQ0E7O0FBRURNLGlCQUFPSSxTQUFQLENBQWlCTCxlQUFqQixFQUFrQyxNQUFNO0FBQ3ZDLGtCQUFNTSxlQUFlQyxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMscUJBQXhCLENBQThDL0UsS0FBS0UsT0FBTCxDQUFhOEMsS0FBM0QsS0FBcUU0QixXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkUsaUJBQXhCLENBQTBDaEYsS0FBS2dCLElBQS9DLENBQTFGOztBQUNBLGdCQUFJMkQsWUFBSixFQUFrQjtBQUNqQjNFLG1CQUFLaUYsUUFBTCxHQUFnQk4sYUFBYTVELEdBQTdCO0FBQ0E2RCx5QkFBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JiLE1BQXhCLENBQStCO0FBQUVsRCxxQkFBS2YsS0FBS2lGO0FBQVosZUFBL0IsRUFBdUQ7QUFBRUMsMkJBQVc7QUFBRUMsNkJBQVduRixLQUFLK0M7QUFBbEI7QUFBYixlQUF2RDtBQUNBLG1CQUFLaEYsUUFBTCxDQUFjcUgsSUFBZCxDQUFtQjtBQUNsQkMsdUJBQVEsS0FBS3JGLEtBQUsrQyxFQUFJLEdBREo7QUFFbEJ1QywyQkFBWSxLQUFLdEYsS0FBSytDLEVBQUksSUFBSS9DLEtBQUtnQixJQUFNLEdBRnZCO0FBR2xCdUUsd0JBQVMsSUFBSVosYUFBYWEsUUFBVTtBQUhsQixlQUFuQjtBQUtBLGFBUkQsTUFRTztBQUNOLG9CQUFNakIsU0FBU3ZFLEtBQUtFLE9BQUwsQ0FBYThDLEtBQWIsR0FBcUJ5QyxTQUFTQyxVQUFULENBQW9CO0FBQUUxQyx1QkFBT2hELEtBQUtFLE9BQUwsQ0FBYThDLEtBQXRCO0FBQTZCMkMsMEJBQVVqQyxLQUFLQyxHQUFMLEtBQWEzRCxLQUFLZ0IsSUFBbEIsR0FBeUJoQixLQUFLRSxPQUFMLENBQWE4QyxLQUFiLENBQW1CNEMsV0FBbkI7QUFBaEUsZUFBcEIsQ0FBckIsR0FBK0lILFNBQVNDLFVBQVQsQ0FBb0I7QUFBRUYsMEJBQVV4RixLQUFLZ0IsSUFBakI7QUFBdUIyRSwwQkFBVWpDLEtBQUtDLEdBQUwsS0FBYTNELEtBQUtnQixJQUFuRDtBQUF5RDZFLDZDQUE2QjtBQUF0RixlQUFwQixDQUE5SjtBQUNBdkIscUJBQU9JLFNBQVAsQ0FBaUJILE1BQWpCLEVBQXlCLE1BQU07QUFDOUJELHVCQUFPd0IsSUFBUCxDQUFZLGFBQVosRUFBMkI5RixLQUFLZ0IsSUFBaEMsRUFBc0M7QUFBRTZFLCtDQUE2QjtBQUEvQixpQkFBdEM7QUFFQSxzQkFBTUUsTUFBTS9GLEtBQUtFLE9BQUwsQ0FBYThGLGNBQWIsSUFBK0JoRyxLQUFLRSxPQUFMLENBQWErRixTQUF4RDs7QUFDQSxvQkFBSTtBQUNIM0IseUJBQU93QixJQUFQLENBQVksc0JBQVosRUFBb0NDLEdBQXBDLEVBQXlDRyxTQUF6QyxFQUFvRCxLQUFwRDtBQUNBLGlCQUZELENBRUUsT0FBT3pGLEtBQVAsRUFBYztBQUNmLHVCQUFLckIsTUFBTCxDQUFZc0IsSUFBWixDQUFrQixpQkFBaUJWLEtBQUtnQixJQUFNLHNCQUFzQitFLEdBQUssRUFBekU7QUFDQXRELDBCQUFRQyxHQUFSLENBQWEsaUJBQWlCMUMsS0FBS2dCLElBQU0sc0JBQXNCK0UsR0FBSyxFQUFwRTtBQUNBLGlCQVQ2QixDQVc5Qjs7O0FBQ0Esb0JBQUkvRixLQUFLbUcsU0FBVCxFQUFvQjtBQUNuQjdCLHlCQUFPd0IsSUFBUCxDQUFZLGtCQUFaLEVBQWdDOUYsS0FBS21HLFNBQUwsR0FBaUIsSUFBakQ7QUFDQTtBQUNELGVBZkQ7QUFpQkF2Qix5QkFBV0MsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JiLE1BQXhCLENBQStCO0FBQUVsRCxxQkFBS3dEO0FBQVAsZUFBL0IsRUFBZ0Q7QUFBRVcsMkJBQVc7QUFBRUMsNkJBQVduRixLQUFLK0M7QUFBbEI7QUFBYixlQUFoRDs7QUFFQSxrQkFBSS9DLEtBQUtFLE9BQUwsQ0FBYWtHLFNBQWpCLEVBQTRCO0FBQzNCeEIsMkJBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCdUIsT0FBeEIsQ0FBZ0M5QixNQUFoQyxFQUF3Q3ZFLEtBQUtFLE9BQUwsQ0FBYWtHLFNBQXJEO0FBQ0EsZUF2QkssQ0F5Qk47OztBQUNBLGtCQUFJcEcsS0FBS2lELE9BQVQsRUFBa0I7QUFDakJxQix1QkFBT3dCLElBQVAsQ0FBWSxxQkFBWixFQUFtQ3ZCLE1BQW5DLEVBQTJDLEtBQTNDO0FBQ0E7O0FBRUR2RSxtQkFBS2lGLFFBQUwsR0FBZ0JWLE1BQWhCO0FBQ0EsbUJBQUt4RyxRQUFMLENBQWNxSCxJQUFkLENBQW1CO0FBQ2xCQyx1QkFBUSxLQUFLckYsS0FBSytDLEVBQUksR0FESjtBQUVsQnVDLDJCQUFZLEtBQUt0RixLQUFLK0MsRUFBSSxJQUFJL0MsS0FBS2dCLElBQU0sR0FGdkI7QUFHbEJ1RSx3QkFBUyxJQUFJdkYsS0FBS2dCLElBQU07QUFITixlQUFuQjtBQUtBOztBQUVELGlCQUFLc0YsaUJBQUwsQ0FBdUIsQ0FBdkI7QUFDQSxXQWpERDtBQWtEQSxTQXZERDtBQXdEQSxhQUFLMUYsVUFBTCxDQUFnQnFELE1BQWhCLENBQXVCO0FBQUVsRCxlQUFLLEtBQUtFLEtBQUwsQ0FBV0Y7QUFBbEIsU0FBdkIsRUFBZ0Q7QUFBRW1ELGdCQUFNO0FBQUUscUJBQVMsS0FBS2pELEtBQUwsQ0FBV0E7QUFBdEI7QUFBUixTQUFoRDtBQUVBLGNBQU0zQixjQUFOLENBQXFCOUIsYUFBYStJLGtCQUFsQztBQUNBLGFBQUtoRixRQUFMLENBQWNBLFFBQWQsQ0FBdUJ2QyxPQUF2QixDQUErQmEsV0FBVztBQUN6QyxjQUFJLENBQUNBLFFBQVFtRSxTQUFiLEVBQXdCO0FBQ3ZCO0FBQ0E7O0FBRURNLGlCQUFPSSxTQUFQLENBQWtCTCxlQUFsQixFQUFtQyxNQUFNO0FBQ3hDLGtCQUFNbUMsZUFBZTVCLFdBQVdDLE1BQVgsQ0FBa0I0QixLQUFsQixDQUF3QkMsYUFBeEIsQ0FBc0M3RyxRQUFRbUIsSUFBOUMsQ0FBckI7O0FBQ0EsZ0JBQUl3RixnQkFBZ0IzRyxRQUFROEcsVUFBNUIsRUFBd0M7QUFDdkMsa0JBQUk5RyxRQUFROEcsVUFBUixJQUFzQkgsWUFBdEIsSUFBc0MzRyxRQUFRbUIsSUFBUixLQUFpQndGLGFBQWF4RixJQUF4RSxFQUE4RTtBQUM3RXNELHVCQUFPd0IsSUFBUCxDQUFZLGtCQUFaLEVBQWdDLFNBQWhDLEVBQTJDLFVBQTNDLEVBQXVEakcsUUFBUW1CLElBQS9EO0FBQ0E7O0FBRURuQixzQkFBUW9GLFFBQVIsR0FBbUJwRixRQUFROEcsVUFBUixHQUFxQixTQUFyQixHQUFpQ0gsYUFBYXpGLEdBQWpFO0FBQ0E2RCx5QkFBV0MsTUFBWCxDQUFrQjRCLEtBQWxCLENBQXdCeEMsTUFBeEIsQ0FBK0I7QUFBRWxELHFCQUFLbEIsUUFBUW9GO0FBQWYsZUFBL0IsRUFBMEQ7QUFBRUMsMkJBQVc7QUFBRUMsNkJBQVd0RixRQUFRa0Q7QUFBckI7QUFBYixlQUExRDtBQUNBLGFBUEQsTUFPTztBQUNOLG9CQUFNOUIsUUFBUXBCLFFBQVErRyxPQUFSLENBQ1pDLE1BRFksQ0FDTCxDQUFDQyxHQUFELEVBQU1DLE1BQU4sS0FBaUI7QUFDeEIsb0JBQUlBLFdBQVdsSCxRQUFRQyxPQUF2QixFQUFnQztBQUMvQix3QkFBTUUsT0FBTyxLQUFLZ0gsYUFBTCxDQUFtQkQsTUFBbkIsQ0FBYjs7QUFDQSxzQkFBSS9HLFFBQVFBLEtBQUt3RixRQUFqQixFQUEyQjtBQUMxQnNCLHdCQUFJMUIsSUFBSixDQUFTcEYsS0FBS3dGLFFBQWQ7QUFDQTtBQUNEOztBQUNELHVCQUFPc0IsR0FBUDtBQUNBLGVBVFksRUFTVixFQVRVLENBQWQ7QUFVQSxrQkFBSXZDLFNBQVNGLGVBQWI7QUFDQSxtQkFBS3BELEtBQUwsQ0FBV0EsS0FBWCxDQUFpQmpDLE9BQWpCLENBQXlCZ0IsUUFBUTtBQUNoQyxvQkFBSUEsS0FBSytDLEVBQUwsS0FBWWxELFFBQVFDLE9BQXBCLElBQStCRSxLQUFLZ0UsU0FBeEMsRUFBbUQ7QUFDbERPLDJCQUFTdkUsS0FBS2lGLFFBQWQ7QUFDQTtBQUNELGVBSkQ7QUFLQVgscUJBQU9JLFNBQVAsQ0FBaUJILE1BQWpCLEVBQXlCLE1BQU07QUFDOUIsc0JBQU0wQyxXQUFXM0MsT0FBT3dCLElBQVAsQ0FBWSxlQUFaLEVBQTZCakcsUUFBUW1CLElBQXJDLEVBQTJDQyxLQUEzQyxDQUFqQjtBQUNBcEIsd0JBQVFvRixRQUFSLEdBQW1CZ0MsU0FBU0MsR0FBNUI7QUFDQSxlQUhELEVBakJNLENBc0JOOztBQUNBLG9CQUFNQyxhQUFhO0FBQ2xCQyxvQkFBSSxJQUFJMUQsSUFBSixDQUFTN0QsUUFBUXdILE9BQVIsR0FBa0IsSUFBM0I7QUFEYyxlQUFuQjs7QUFHQSxrQkFBSSxDQUFDekosRUFBRTBKLE9BQUYsQ0FBVXpILFFBQVEwSCxLQUFSLElBQWlCMUgsUUFBUTBILEtBQVIsQ0FBY0MsS0FBekMsQ0FBTCxFQUFzRDtBQUNyREwsMkJBQVdJLEtBQVgsR0FBbUIxSCxRQUFRMEgsS0FBUixDQUFjQyxLQUFqQztBQUNBOztBQUNELGtCQUFJLENBQUM1SixFQUFFMEosT0FBRixDQUFVekgsUUFBUTRILE9BQVIsSUFBbUI1SCxRQUFRNEgsT0FBUixDQUFnQkQsS0FBN0MsQ0FBTCxFQUEwRDtBQUN6REwsMkJBQVdPLFdBQVgsR0FBeUI3SCxRQUFRNEgsT0FBUixDQUFnQkQsS0FBekM7QUFDQTs7QUFDRDVDLHlCQUFXQyxNQUFYLENBQWtCNEIsS0FBbEIsQ0FBd0J4QyxNQUF4QixDQUErQjtBQUFFbEQscUJBQUtsQixRQUFRb0Y7QUFBZixlQUEvQixFQUEwRDtBQUFFZixzQkFBTWlELFVBQVI7QUFBb0JqQywyQkFBVztBQUFFQyw2QkFBV3RGLFFBQVFrRDtBQUFyQjtBQUEvQixlQUExRDtBQUNBOztBQUNELGlCQUFLdUQsaUJBQUwsQ0FBdUIsQ0FBdkI7QUFDQSxXQTVDRDtBQTZDQSxTQWxERDtBQW1EQSxhQUFLMUYsVUFBTCxDQUFnQnFELE1BQWhCLENBQXVCO0FBQUVsRCxlQUFLLEtBQUtRLFFBQUwsQ0FBY1I7QUFBckIsU0FBdkIsRUFBbUQ7QUFBRW1ELGdCQUFNO0FBQUUsd0JBQVksS0FBSzNDLFFBQUwsQ0FBY0E7QUFBNUI7QUFBUixTQUFuRDtBQUVBLGNBQU1vRyxjQUFjLEVBQXBCO0FBQ0EsY0FBTUMsY0FBYztBQUFFLHFCQUFXLElBQWI7QUFBbUIsMEJBQWdCLElBQW5DO0FBQXlDLDBCQUFnQjtBQUF6RCxTQUFwQjtBQUNBLGNBQU10SSxjQUFOLENBQXFCOUIsYUFBYXFLLGtCQUFsQztBQUNBbkcsZUFBT0MsSUFBUCxDQUFZLEtBQUtFLFFBQWpCLEVBQTJCN0MsT0FBM0IsQ0FBbUNhLFdBQVc7QUFDN0MsZ0JBQU0rQixjQUFjLEtBQUtDLFFBQUwsQ0FBY2hDLE9BQWQsQ0FBcEI7QUFFQXlFLGlCQUFPSSxTQUFQLENBQWlCTCxlQUFqQixFQUFrQyxNQUFLO0FBQ3RDLGtCQUFNeUQsZUFBZSxLQUFLQyx1QkFBTCxDQUE2QmxJLE9BQTdCLENBQXJCOztBQUNBLGdCQUFJLENBQUNpSSxZQUFELElBQWlCLENBQUNBLGFBQWE5RCxTQUFuQyxFQUE4QztBQUFFO0FBQVM7O0FBQ3pELGtCQUFNZ0UsT0FBT3BELFdBQVdDLE1BQVgsQ0FBa0I0QixLQUFsQixDQUF3QndCLFdBQXhCLENBQW9DSCxhQUFhN0MsUUFBakQsRUFBMkQ7QUFBRWlELHNCQUFRO0FBQUVDLDJCQUFXLENBQWI7QUFBZ0JDLG1CQUFHLENBQW5CO0FBQXNCcEgsc0JBQU07QUFBNUI7QUFBVixhQUEzRCxDQUFiO0FBQ0FVLG1CQUFPQyxJQUFQLENBQVlDLFdBQVosRUFBeUI1QyxPQUF6QixDQUFpQzhDLFFBQVE7QUFDeEMsb0JBQU1DLE9BQU9ILFlBQVlFLElBQVosQ0FBYjtBQUNBQyxtQkFBS0YsUUFBTCxDQUFjN0MsT0FBZCxDQUFzQnFKLFdBQVc7QUFDaEMscUJBQUtsSCxZQUFMLENBQWtCO0FBQUUsb0NBQW1CLEdBQUd0QixPQUFTLElBQUlpQyxJQUFNLElBQUlDLEtBQUtGLFFBQUwsQ0FBY1QsTUFBUTtBQUFyRSxpQkFBbEI7QUFDQSxzQkFBTWtILGtCQUFpQjtBQUN0QnZILHVCQUFNLFNBQVMrRyxhQUFhL0UsRUFBSSxJQUFJc0YsUUFBUWpCLEVBQVIsQ0FBV21CLE9BQVgsQ0FBbUIsS0FBbkIsRUFBMEIsR0FBMUIsQ0FBZ0MsRUFEOUM7QUFFdEJuQixzQkFBSSxJQUFJMUQsSUFBSixDQUFTOEUsU0FBU0gsUUFBUWpCLEVBQVIsQ0FBVzlHLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsQ0FBdEIsQ0FBVCxJQUFxQyxJQUE5QztBQUZrQixpQkFBdkIsQ0FGZ0MsQ0FPaEM7O0FBQ0Esb0JBQUkrSCxRQUFRSSxTQUFSLElBQXFCSixRQUFRSSxTQUFSLENBQWtCckgsTUFBbEIsR0FBMkIsQ0FBcEQsRUFBdUQ7QUFDdERrSCxrQ0FBZ0JHLFNBQWhCLEdBQTRCLEVBQTVCO0FBRUFKLDBCQUFRSSxTQUFSLENBQWtCekosT0FBbEIsQ0FBMEIwSixZQUFZO0FBQ3JDQSw2QkFBUzFILElBQVQsR0FBaUIsSUFBSTBILFNBQVMxSCxJQUFNLEdBQXBDO0FBQ0FzSCxvQ0FBZ0JHLFNBQWhCLENBQTBCQyxTQUFTMUgsSUFBbkMsSUFBMkM7QUFBRW1ILGlDQUFXO0FBQWIscUJBQTNDO0FBRUFPLDZCQUFTekgsS0FBVCxDQUFlakMsT0FBZixDQUF1QjhFLEtBQUs7QUFDM0IsNEJBQU02RSxTQUFTLEtBQUszQixhQUFMLENBQW1CbEQsQ0FBbkIsQ0FBZjs7QUFDQSwwQkFBSSxDQUFDNkUsTUFBTCxFQUFhO0FBQUU7QUFBUzs7QUFFeEJMLHNDQUFnQkcsU0FBaEIsQ0FBMEJDLFNBQVMxSCxJQUFuQyxFQUF5Q21ILFNBQXpDLENBQW1EL0MsSUFBbkQsQ0FBd0R1RCxPQUFPbkQsUUFBL0Q7QUFDQSxxQkFMRDs7QUFPQSx3QkFBSThDLGdCQUFnQkcsU0FBaEIsQ0FBMEJDLFNBQVMxSCxJQUFuQyxFQUF5Q21ILFNBQXpDLENBQW1EL0csTUFBbkQsS0FBOEQsQ0FBbEUsRUFBcUU7QUFDcEUsNkJBQU9rSCxnQkFBZ0JHLFNBQWhCLENBQTBCQyxTQUFTMUgsSUFBbkMsQ0FBUDtBQUNBO0FBQ0QsbUJBZEQ7QUFlQTs7QUFFRCxvQkFBSXFILFFBQVFPLElBQVIsS0FBaUIsU0FBckIsRUFBZ0M7QUFDL0Isc0JBQUlQLFFBQVFRLE9BQVosRUFBcUI7QUFDcEIsd0JBQUlSLFFBQVFRLE9BQVIsS0FBb0IsY0FBeEIsRUFBd0M7QUFDdkMsMEJBQUksS0FBSzdCLGFBQUwsQ0FBbUJxQixRQUFRckksSUFBM0IsQ0FBSixFQUFzQztBQUNyQzRFLG1DQUFXQyxNQUFYLENBQWtCaUUsUUFBbEIsQ0FBMkJDLCtCQUEzQixDQUEyRGYsS0FBS2pILEdBQWhFLEVBQXFFLEtBQUtpRyxhQUFMLENBQW1CcUIsUUFBUXJJLElBQTNCLENBQXJFLEVBQXVHc0ksZUFBdkc7QUFDQTtBQUNELHFCQUpELE1BSU8sSUFBSUQsUUFBUVEsT0FBUixLQUFvQixlQUF4QixFQUF5QztBQUMvQywwQkFBSSxLQUFLN0IsYUFBTCxDQUFtQnFCLFFBQVFySSxJQUEzQixDQUFKLEVBQXNDO0FBQ3JDNEUsbUNBQVdDLE1BQVgsQ0FBa0JpRSxRQUFsQixDQUEyQkUsZ0NBQTNCLENBQTREaEIsS0FBS2pILEdBQWpFLEVBQXNFLEtBQUtpRyxhQUFMLENBQW1CcUIsUUFBUXJJLElBQTNCLENBQXRFLEVBQXdHc0ksZUFBeEc7QUFDQTtBQUNELHFCQUpNLE1BSUEsSUFBSUQsUUFBUVEsT0FBUixLQUFvQixZQUF4QixFQUFzQztBQUM1Qyw0QkFBTUksc0JBQ0ZYLGVBREU7QUFFTFksNkJBQU0sSUFBSSxLQUFLQywrQkFBTCxDQUFxQ2QsUUFBUWUsSUFBN0MsQ0FBb0Q7QUFGekQsd0JBQU47O0FBSUF4RSxpQ0FBV3lFLFdBQVgsQ0FBdUIsS0FBS3JDLGFBQUwsQ0FBbUJxQixRQUFRckksSUFBM0IsQ0FBdkIsRUFBeURpSixNQUF6RCxFQUFpRWpCLElBQWpFLEVBQXVFLElBQXZFO0FBQ0EscUJBTk0sTUFNQSxJQUFJSyxRQUFRUSxPQUFSLEtBQW9CLGFBQXBCLElBQXFDUixRQUFRUSxPQUFSLEtBQW9CLG1CQUE3RCxFQUFrRjtBQUN4Riw0QkFBTVMsVUFBVTFFLFdBQVdDLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCbUQsV0FBeEIsQ0FBb0MsWUFBcEMsRUFBa0Q7QUFBRUMsZ0NBQVE7QUFBRTFDLG9DQUFVO0FBQVo7QUFBVix1QkFBbEQsQ0FBaEI7QUFDQSw0QkFBTStELGNBQWMsS0FBS3ZMLElBQUwsQ0FBVXFLLFFBQVFsSSxNQUFsQixJQUE0QixLQUFLbkMsSUFBTCxDQUFVcUssUUFBUWxJLE1BQWxCLEVBQTBCYSxJQUF0RCxHQUE2RHFILFFBQVE3QyxRQUF6Rjs7QUFDQSw0QkFBTXlELHNCQUNGWCxlQURFO0FBRUxZLDZCQUFLLEtBQUtDLCtCQUFMLENBQXFDZCxRQUFRZSxJQUE3QyxDQUZBO0FBR0xsQyw2QkFBS2MsS0FBS2pILEdBSEw7QUFJTHlJLDZCQUFLLElBSkE7QUFLTEMscUNBQWFwQixRQUFRb0IsV0FMaEI7QUFNTGpFLGtDQUFVK0QsZUFBZXJEO0FBTnBCLHdCQUFOOztBQVNBLDBCQUFJbUMsUUFBUXFCLE1BQVosRUFBb0I7QUFDbkJULCtCQUFPVSxRQUFQLEdBQWtCLElBQUlqRyxJQUFKLENBQVM4RSxTQUFTSCxRQUFRcUIsTUFBUixDQUFldEMsRUFBZixDQUFrQjlHLEtBQWxCLENBQXdCLEdBQXhCLEVBQTZCLENBQTdCLENBQVQsSUFBNEMsSUFBckQsQ0FBbEI7QUFDQSw4QkFBTXNKLFdBQVcsS0FBSzVDLGFBQUwsQ0FBbUJxQixRQUFRcUIsTUFBUixDQUFlMUosSUFBbEMsQ0FBakI7O0FBQ0EsNEJBQUk0SixRQUFKLEVBQWM7QUFDYlgsaUNBQU9XLFFBQVAsR0FBa0I7QUFDakI3SSxpQ0FBSzZJLFNBQVM3SSxHQURHO0FBRWpCeUUsc0NBQVVvRSxTQUFTcEU7QUFGRiwyQkFBbEI7QUFJQTtBQUNEOztBQUVELDBCQUFJNkMsUUFBUXdCLEtBQVosRUFBbUI7QUFDbEJaLCtCQUFPYSxLQUFQLEdBQWV6QixRQUFRd0IsS0FBUixDQUFjQyxLQUE3QjtBQUNBOztBQUNEbEYsaUNBQVd5RSxXQUFYLENBQXVCQyxPQUF2QixFQUFnQ0wsTUFBaEMsRUFBd0NqQixJQUF4QyxFQUE4QyxJQUE5QztBQUNBLHFCQTNCTSxNQTJCQSxJQUFJSyxRQUFRUSxPQUFSLEtBQW9CLGlCQUF4QixFQUEyQztBQUNqRCwwQkFBSSxLQUFLN0IsYUFBTCxDQUFtQnFCLFFBQVFySSxJQUEzQixDQUFKLEVBQXNDO0FBQ3JDNEUsbUNBQVdDLE1BQVgsQ0FBa0JpRSxRQUFsQixDQUEyQmlCLHFEQUEzQixDQUFpRiwwQkFBakYsRUFBNkcvQixLQUFLakgsR0FBbEgsRUFBdUhzSCxRQUFRWixPQUEvSCxFQUF3SSxLQUFLVCxhQUFMLENBQW1CcUIsUUFBUXJJLElBQTNCLENBQXhJLEVBQTBLc0ksZUFBMUs7QUFDQTtBQUNELHFCQUpNLE1BSUEsSUFBSUQsUUFBUVEsT0FBUixLQUFvQixlQUF4QixFQUF5QztBQUMvQywwQkFBSSxLQUFLN0IsYUFBTCxDQUFtQnFCLFFBQVFySSxJQUEzQixDQUFKLEVBQXNDO0FBQ3JDNEUsbUNBQVdDLE1BQVgsQ0FBa0JpRSxRQUFsQixDQUEyQmlCLHFEQUEzQixDQUFpRixvQkFBakYsRUFBdUcvQixLQUFLakgsR0FBNUcsRUFBaUhzSCxRQUFRZCxLQUF6SCxFQUFnSSxLQUFLUCxhQUFMLENBQW1CcUIsUUFBUXJJLElBQTNCLENBQWhJLEVBQWtLc0ksZUFBbEs7QUFDQTtBQUNELHFCQUpNLE1BSUEsSUFBSUQsUUFBUVEsT0FBUixLQUFvQixjQUF4QixFQUF3QztBQUM5QywwQkFBSSxLQUFLN0IsYUFBTCxDQUFtQnFCLFFBQVFySSxJQUEzQixDQUFKLEVBQXNDO0FBQ3JDNEUsbUNBQVdDLE1BQVgsQ0FBa0JpRSxRQUFsQixDQUEyQmtCLDBDQUEzQixDQUFzRWhDLEtBQUtqSCxHQUEzRSxFQUFnRnNILFFBQVFySCxJQUF4RixFQUE4RixLQUFLZ0csYUFBTCxDQUFtQnFCLFFBQVFySSxJQUEzQixDQUE5RixFQUFnSXNJLGVBQWhJO0FBQ0E7QUFDRCxxQkFKTSxNQUlBLElBQUlELFFBQVFRLE9BQVIsS0FBb0IsYUFBeEIsRUFBdUM7QUFDN0MsMEJBQUlSLFFBQVFvQixXQUFaLEVBQXlCO0FBQ3hCLDhCQUFNUixzQkFDRlgsZUFERTtBQUVMbUIsdUNBQWEsQ0FBQztBQUNiLG9DQUFRLEtBQUtOLCtCQUFMLENBQXFDZCxRQUFRb0IsV0FBUixDQUFvQixDQUFwQixFQUF1QkwsSUFBNUQsQ0FESztBQUViLDJDQUFnQmYsUUFBUW9CLFdBQVIsQ0FBb0IsQ0FBcEIsRUFBdUJRLGNBRjFCO0FBR2IsMkNBQWdCQyx5QkFBeUI3QixRQUFRb0IsV0FBUixDQUFvQixDQUFwQixFQUF1QlEsY0FBaEQ7QUFISCwyQkFBRDtBQUZSLDBCQUFOOztBQVFBckYsbUNBQVdDLE1BQVgsQ0FBa0JpRSxRQUFsQixDQUEyQnFCLGtDQUEzQixDQUE4RCxnQkFBOUQsRUFBZ0ZuQyxLQUFLakgsR0FBckYsRUFBMEYsRUFBMUYsRUFBOEYsS0FBS2lHLGFBQUwsQ0FBbUJxQixRQUFRckksSUFBM0IsQ0FBOUYsRUFBZ0lpSixNQUFoSTtBQUNBLHVCQVZELE1BVU87QUFDTjtBQUNBLDZCQUFLN0osTUFBTCxDQUFZQyxLQUFaLENBQWtCLDZDQUFsQixFQUZNLENBR047QUFDQTtBQUNELHFCQWhCTSxNQWdCQSxJQUFJZ0osUUFBUVEsT0FBUixLQUFvQixZQUF4QixFQUFzQztBQUM1QywwQkFBSVIsUUFBUStCLElBQVIsSUFBZ0IvQixRQUFRK0IsSUFBUixDQUFhQyxvQkFBYixLQUFzQ25FLFNBQTFELEVBQXFFO0FBQ3BFLDhCQUFNb0UsVUFBVTtBQUNmQyxzQ0FBYSxTQUFTbEMsUUFBUWpCLEVBQVIsQ0FBV21CLE9BQVgsQ0FBbUIsS0FBbkIsRUFBMEIsR0FBMUIsQ0FBZ0MsRUFEdkM7QUFFZnZILGdDQUFNcUgsUUFBUStCLElBQVIsQ0FBYXBKLElBRko7QUFHZndKLGdDQUFNbkMsUUFBUStCLElBQVIsQ0FBYUksSUFISjtBQUlmNUIsZ0NBQU1QLFFBQVErQixJQUFSLENBQWFLLFFBSko7QUFLZnZELCtCQUFLYyxLQUFLakg7QUFMSyx5QkFBaEI7QUFPQSw2QkFBSzJKLFVBQUwsQ0FBZ0JKLE9BQWhCLEVBQXlCakMsUUFBUStCLElBQVIsQ0FBYUMsb0JBQXRDLEVBQTRELEtBQUtyRCxhQUFMLENBQW1CcUIsUUFBUXJJLElBQTNCLENBQTVELEVBQThGZ0ksSUFBOUYsRUFBb0csSUFBSXRFLElBQUosQ0FBUzhFLFNBQVNILFFBQVFqQixFQUFSLENBQVc5RyxLQUFYLENBQWlCLEdBQWpCLEVBQXNCLENBQXRCLENBQVQsSUFBcUMsSUFBOUMsQ0FBcEc7QUFDQTtBQUNELHFCQVhNLE1BV0EsSUFBSSxDQUFDcUgsWUFBWVUsUUFBUVEsT0FBcEIsQ0FBRCxJQUFpQyxDQUFDakIsWUFBWVMsUUFBUVEsT0FBcEIsQ0FBdEMsRUFBb0U7QUFDMUVsQixrQ0FBWVUsUUFBUVEsT0FBcEIsSUFBK0JSLE9BQS9CO0FBQ0E7QUFDRCxtQkFwRkQsTUFvRk87QUFDTiwwQkFBTXJJLE9BQU8sS0FBS2dILGFBQUwsQ0FBbUJxQixRQUFRckksSUFBM0IsQ0FBYjs7QUFDQSx3QkFBSUEsSUFBSixFQUFVO0FBQ1QsNEJBQU1pSixzQkFDRlgsZUFERTtBQUVMWSw2QkFBSyxLQUFLQywrQkFBTCxDQUFxQ2QsUUFBUWUsSUFBN0MsQ0FGQTtBQUdMbEMsNkJBQUtjLEtBQUtqSCxHQUhMO0FBSUwrQywyQkFBRztBQUNGL0MsK0JBQUtmLEtBQUtlLEdBRFI7QUFFRnlFLG9DQUFVeEYsS0FBS3dGO0FBRmI7QUFKRSx3QkFBTjs7QUFVQSwwQkFBSTZDLFFBQVFxQixNQUFaLEVBQW9CO0FBQ25CVCwrQkFBT1UsUUFBUCxHQUFrQixJQUFJakcsSUFBSixDQUFTOEUsU0FBU0gsUUFBUXFCLE1BQVIsQ0FBZXRDLEVBQWYsQ0FBa0I5RyxLQUFsQixDQUF3QixHQUF4QixFQUE2QixDQUE3QixDQUFULElBQTRDLElBQXJELENBQWxCO0FBQ0EsOEJBQU1zSixXQUFXLEtBQUs1QyxhQUFMLENBQW1CcUIsUUFBUXFCLE1BQVIsQ0FBZTFKLElBQWxDLENBQWpCOztBQUNBLDRCQUFJNEosUUFBSixFQUFjO0FBQ2JYLGlDQUFPVyxRQUFQLEdBQWtCO0FBQ2pCN0ksaUNBQUs2SSxTQUFTN0ksR0FERztBQUVqQnlFLHNDQUFVb0UsU0FBU3BFO0FBRkYsMkJBQWxCO0FBSUE7QUFDRDs7QUFFRCwwQkFBSTtBQUNIWixtQ0FBV3lFLFdBQVgsQ0FBdUIsS0FBS3JDLGFBQUwsQ0FBbUJxQixRQUFRckksSUFBM0IsQ0FBdkIsRUFBeURpSixNQUF6RCxFQUFpRWpCLElBQWpFLEVBQXVFLElBQXZFO0FBQ0EsdUJBRkQsQ0FFRSxPQUFPeEYsQ0FBUCxFQUFVO0FBQ1gsNkJBQUtwRCxNQUFMLENBQVlzQixJQUFaLENBQWtCLGlDQUFpQzRILGdCQUFnQnZILEdBQUssRUFBeEU7QUFDQTtBQUNEO0FBQ0Q7QUFDRDs7QUFFRCxxQkFBS3VGLGlCQUFMLENBQXVCLENBQXZCO0FBQ0EsZUFuSkQ7QUFvSkEsYUF0SkQ7QUF1SkEsV0EzSkQ7QUE0SkEsU0EvSkQ7O0FBaUtBLFlBQUksQ0FBQzFJLEVBQUUwSixPQUFGLENBQVVLLFdBQVYsQ0FBTCxFQUE2QjtBQUM1QmxGLGtCQUFRQyxHQUFSLENBQVksc0JBQVosRUFBb0NpRixXQUFwQztBQUNBOztBQUVELGNBQU1ySSxjQUFOLENBQXFCOUIsYUFBYW1OLFNBQWxDO0FBRUEsYUFBS3BKLFFBQUwsQ0FBY0EsUUFBZCxDQUF1QnZDLE9BQXZCLENBQStCYSxXQUFXO0FBQ3pDLGNBQUlBLFFBQVFtRSxTQUFSLElBQXFCbkUsUUFBUXNELFdBQWpDLEVBQThDO0FBQzdDbUIsbUJBQU9JLFNBQVAsQ0FBaUJMLGVBQWpCLEVBQWtDLFlBQVc7QUFDNUNDLHFCQUFPd0IsSUFBUCxDQUFZLGFBQVosRUFBMkJqRyxRQUFRb0YsUUFBbkM7QUFDQSxhQUZEO0FBR0E7QUFDRCxTQU5EO0FBT0EsY0FBTTNGLGNBQU4sQ0FBcUI5QixhQUFhb04sSUFBbEM7QUFFQSxhQUFLeEwsTUFBTCxDQUFZc0QsR0FBWixDQUFpQixlQUFlZ0IsS0FBS0MsR0FBTCxLQUFhRixLQUFPLGdCQUFwRDtBQUNBLE9BdFNELENBc1NFLE9BQU9qQixDQUFQLEVBQVU7QUFDWCxhQUFLcEQsTUFBTCxDQUFZcUIsS0FBWixDQUFrQitCLENBQWxCO0FBQ0EsY0FBTWxELGNBQU4sQ0FBcUI5QixhQUFhbUYsS0FBbEM7QUFDQTtBQUNELEtBM1NEO0FBNlNBLFdBQU8sS0FBS0MsV0FBTCxFQUFQO0FBQ0E7O0FBRURtRiwwQkFBd0J4SCxXQUF4QixFQUFxQztBQUNwQyxXQUFPLEtBQUtnQixRQUFMLENBQWNBLFFBQWQsQ0FBdUJzSixJQUF2QixDQUE0QmhMLFdBQVdBLFFBQVFtQixJQUFSLEtBQWlCVCxXQUF4RCxDQUFQO0FBQ0E7O0FBRUR5RyxnQkFBYzhELE9BQWQsRUFBdUI7QUFDdEIsVUFBTTlLLE9BQU8sS0FBS2lCLEtBQUwsQ0FBV0EsS0FBWCxDQUFpQjRKLElBQWpCLENBQXNCN0ssUUFBUUEsS0FBSytDLEVBQUwsS0FBWStILE9BQTFDLENBQWI7O0FBRUEsUUFBSTlLLElBQUosRUFBVTtBQUNULGFBQU80RSxXQUFXQyxNQUFYLENBQWtCQyxLQUFsQixDQUF3Qm1ELFdBQXhCLENBQW9DakksS0FBS2lGLFFBQXpDLEVBQW1EO0FBQUVpRCxnQkFBUTtBQUFFMUMsb0JBQVUsQ0FBWjtBQUFleEUsZ0JBQU07QUFBckI7QUFBVixPQUFuRCxDQUFQO0FBQ0E7QUFDRDs7QUFFRG1JLGtDQUFnQ2QsT0FBaEMsRUFBeUM7QUFDeEMsUUFBSUEsT0FBSixFQUFhO0FBQ1pBLGdCQUFVQSxRQUFRRSxPQUFSLENBQWdCLGNBQWhCLEVBQWdDLE1BQWhDLENBQVY7QUFDQUYsZ0JBQVVBLFFBQVFFLE9BQVIsQ0FBZ0IsYUFBaEIsRUFBK0IsTUFBL0IsQ0FBVjtBQUNBRixnQkFBVUEsUUFBUUUsT0FBUixDQUFnQixVQUFoQixFQUE0QixPQUE1QixDQUFWO0FBQ0FGLGdCQUFVQSxRQUFRRSxPQUFSLENBQWdCLE9BQWhCLEVBQXlCLEdBQXpCLENBQVY7QUFDQUYsZ0JBQVVBLFFBQVFFLE9BQVIsQ0FBZ0IsT0FBaEIsRUFBeUIsR0FBekIsQ0FBVjtBQUNBRixnQkFBVUEsUUFBUUUsT0FBUixDQUFnQixRQUFoQixFQUEwQixHQUExQixDQUFWO0FBQ0FGLGdCQUFVQSxRQUFRRSxPQUFSLENBQWdCLGlCQUFoQixFQUFtQyxTQUFuQyxDQUFWO0FBQ0FGLGdCQUFVQSxRQUFRRSxPQUFSLENBQWdCLFNBQWhCLEVBQTJCLFVBQTNCLENBQVY7QUFDQUYsZ0JBQVVBLFFBQVFFLE9BQVIsQ0FBZ0IsVUFBaEIsRUFBNEIsT0FBNUIsQ0FBVjtBQUNBRixnQkFBVUEsUUFBUUUsT0FBUixDQUFnQixPQUFoQixFQUF5QixNQUF6QixDQUFWO0FBQ0FGLGdCQUFVQSxRQUFRRSxPQUFSLENBQWdCLHFCQUFoQixFQUF1QyxJQUF2QyxDQUFWOztBQUVBLFdBQUssTUFBTXdDLFdBQVgsSUFBMEJDLE1BQU1DLElBQU4sQ0FBVyxLQUFLbE4sUUFBaEIsQ0FBMUIsRUFBcUQ7QUFDcERzSyxrQkFBVUEsUUFBUUUsT0FBUixDQUFnQndDLFlBQVkxRixLQUE1QixFQUFtQzBGLFlBQVl4RixNQUEvQyxDQUFWO0FBQ0E4QyxrQkFBVUEsUUFBUUUsT0FBUixDQUFnQndDLFlBQVl6RixTQUE1QixFQUF1Q3lGLFlBQVl4RixNQUFuRCxDQUFWO0FBQ0E7QUFDRCxLQWpCRCxNQWlCTztBQUNOOEMsZ0JBQVUsRUFBVjtBQUNBOztBQUVELFdBQU9BLE9BQVA7QUFDQTs7QUFFRDZDLGlCQUFlO0FBQ2QsVUFBTXJJLGlCQUFpQixLQUFLNUIsS0FBTCxDQUFXQSxLQUFYLENBQWlCNkIsR0FBakIsQ0FBcUI5QyxRQUFRLElBQUlyQyxhQUFKLENBQWtCcUMsS0FBSytDLEVBQXZCLEVBQTJCL0MsS0FBS2dCLElBQWhDLEVBQXNDaEIsS0FBS0UsT0FBTCxDQUFhOEMsS0FBbkQsRUFBMERoRCxLQUFLaUQsT0FBL0QsRUFBd0VqRCxLQUFLQyxNQUE3RSxFQUFxRixDQUFDRCxLQUFLQyxNQUEzRixDQUE3QixDQUF2QjtBQUNBLFVBQU1pRCxvQkFBb0IsS0FBSzNCLFFBQUwsQ0FBY0EsUUFBZCxDQUF1QnVCLEdBQXZCLENBQTJCakQsV0FBVyxJQUFJbkMsZ0JBQUosQ0FBcUJtQyxRQUFRa0QsRUFBN0IsRUFBaUNsRCxRQUFRbUIsSUFBekMsRUFBK0NuQixRQUFRc0QsV0FBdkQsRUFBb0UsSUFBcEUsRUFBMEUsS0FBMUUsQ0FBdEMsQ0FBMUI7QUFDQSxXQUFPLElBQUkxRixTQUFKLENBQWMsS0FBS3VELElBQW5CLEVBQXlCNkIsY0FBekIsRUFBeUNLLGlCQUF6QyxFQUE0RCxLQUFLcEMsWUFBTCxDQUFrQnVDLEtBQWxCLENBQXdCeEIsUUFBcEYsQ0FBUDtBQUNBOztBQXJlc0MsQzs7Ozs7Ozs7Ozs7QUNWeEMsSUFBSXNKLFNBQUo7QUFBY3JPLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNnTyxZQUFVL04sQ0FBVixFQUFZO0FBQUMrTixnQkFBVS9OLENBQVY7QUFBWTs7QUFBMUIsQ0FBbkQsRUFBK0UsQ0FBL0U7QUFBa0YsSUFBSUosaUJBQUo7QUFBc0JGLE9BQU9JLEtBQVAsQ0FBYUMsUUFBUSxTQUFSLENBQWIsRUFBZ0M7QUFBQ0gsb0JBQWtCSSxDQUFsQixFQUFvQjtBQUFDSix3QkFBa0JJLENBQWxCO0FBQW9COztBQUExQyxDQUFoQyxFQUE0RSxDQUE1RTtBQUErRSxJQUFJRSxhQUFKO0FBQWtCUixPQUFPSSxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNHLGdCQUFjRixDQUFkLEVBQWdCO0FBQUNFLG9CQUFjRixDQUFkO0FBQWdCOztBQUFsQyxDQUFuQyxFQUF1RSxDQUF2RTtBQUl2TitOLFVBQVVDLEdBQVYsQ0FBYyxJQUFJcE8saUJBQUosRUFBZCxFQUF1Q00sYUFBdkMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pbXBvcnRlci1zbGFjay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEltcG9ydGVySW5mbyB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmltcG9ydGVyJztcblxuZXhwb3J0IGNsYXNzIFNsYWNrSW1wb3J0ZXJJbmZvIGV4dGVuZHMgSW1wb3J0ZXJJbmZvIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ3NsYWNrJywgJ1NsYWNrJywgJ2FwcGxpY2F0aW9uL3ppcCcpO1xuXHR9XG59XG4iLCJpbXBvcnQge1xuXHRCYXNlLFxuXHRQcm9ncmVzc1N0ZXAsXG5cdFNlbGVjdGlvbixcblx0U2VsZWN0aW9uQ2hhbm5lbCxcblx0U2VsZWN0aW9uVXNlclxufSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5leHBvcnQgY2xhc3MgU2xhY2tJbXBvcnRlciBleHRlbmRzIEJhc2Uge1xuXHRjb25zdHJ1Y3RvcihpbmZvKSB7XG5cdFx0c3VwZXIoaW5mbyk7XG5cdFx0dGhpcy51c2VyVGFncyA9IFtdO1xuXHRcdHRoaXMuYm90cyA9IHt9O1xuXHR9XG5cblx0cHJlcGFyZShkYXRhVVJJLCBzZW50Q29udGVudFR5cGUsIGZpbGVOYW1lKSB7XG5cdFx0c3VwZXIucHJlcGFyZShkYXRhVVJJLCBzZW50Q29udGVudFR5cGUsIGZpbGVOYW1lKTtcblxuXHRcdGNvbnN0IHsgaW1hZ2UgfSA9IFJvY2tldENoYXRGaWxlLmRhdGFVUklQYXJzZShkYXRhVVJJKTtcblx0XHRjb25zdCB6aXAgPSBuZXcgdGhpcy5BZG1aaXAobmV3IEJ1ZmZlcihpbWFnZSwgJ2Jhc2U2NCcpKTtcblx0XHRjb25zdCB6aXBFbnRyaWVzID0gemlwLmdldEVudHJpZXMoKTtcblxuXHRcdGxldCB0ZW1wQ2hhbm5lbHMgPSBbXTtcblx0XHRsZXQgdGVtcFVzZXJzID0gW107XG5cdFx0Y29uc3QgdGVtcE1lc3NhZ2VzID0ge307XG5cblx0XHR6aXBFbnRyaWVzLmZvckVhY2goZW50cnkgPT4ge1xuXHRcdFx0aWYgKGVudHJ5LmVudHJ5TmFtZS5pbmRleE9mKCdfX01BQ09TWCcpID4gLTEpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMubG9nZ2VyLmRlYnVnKGBJZ25vcmluZyB0aGUgZmlsZTogJHsgZW50cnkuZW50cnlOYW1lIH1gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVudHJ5LmVudHJ5TmFtZSA9PT0gJ2NoYW5uZWxzLmpzb24nKSB7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfQ0hBTk5FTFMpO1xuXHRcdFx0XHR0ZW1wQ2hhbm5lbHMgPSBKU09OLnBhcnNlKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKS5maWx0ZXIoY2hhbm5lbCA9PiBjaGFubmVsLmNyZWF0b3IgIT0gbnVsbCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGVudHJ5LmVudHJ5TmFtZSA9PT0gJ3VzZXJzLmpzb24nKSB7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfVVNFUlMpO1xuXHRcdFx0XHR0ZW1wVXNlcnMgPSBKU09OLnBhcnNlKGVudHJ5LmdldERhdGEoKS50b1N0cmluZygpKTtcblxuXHRcdFx0XHR0ZW1wVXNlcnMuZm9yRWFjaCh1c2VyID0+IHtcblx0XHRcdFx0XHRpZiAodXNlci5pc19ib3QpIHtcblx0XHRcdFx0XHRcdHRoaXMuYm90c1t1c2VyLnByb2ZpbGUuYm90X2lkXSA9IHVzZXI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZW50cnkuaXNEaXJlY3RvcnkgJiYgZW50cnkuZW50cnlOYW1lLmluZGV4T2YoJy8nKSA+IC0xKSB7XG5cdFx0XHRcdGNvbnN0IGl0ZW0gPSBlbnRyeS5lbnRyeU5hbWUuc3BsaXQoJy8nKTtcblx0XHRcdFx0Y29uc3QgY2hhbm5lbE5hbWUgPSBpdGVtWzBdO1xuXHRcdFx0XHRjb25zdCBtc2dHcm91cERhdGEgPSBpdGVtWzFdLnNwbGl0KCcuJylbMF07XG5cdFx0XHRcdHRlbXBNZXNzYWdlc1tjaGFubmVsTmFtZV0gPSB0ZW1wTWVzc2FnZXNbY2hhbm5lbE5hbWVdIHx8IHt9O1xuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0dGVtcE1lc3NhZ2VzW2NoYW5uZWxOYW1lXVttc2dHcm91cERhdGFdID0gSlNPTi5wYXJzZShlbnRyeS5nZXREYXRhKCkudG9TdHJpbmcoKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybihgJHsgZW50cnkuZW50cnlOYW1lIH0gaXMgbm90IGEgdmFsaWQgSlNPTiBmaWxlISBVbmFibGUgdG8gaW1wb3J0IGl0LmApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQvLyBJbnNlcnQgdGhlIHVzZXJzIHJlY29yZCwgZXZlbnR1YWxseSB0aGlzIG1pZ2h0IGhhdmUgdG8gYmUgc3BsaXQgaW50byBzZXZlcmFsIG9uZXMgYXMgd2VsbFxuXHRcdC8vIGlmIHNvbWVvbmUgdHJpZXMgdG8gaW1wb3J0IGEgc2V2ZXJhbCB0aG91c2FuZHMgdXNlcnMgaW5zdGFuY2Vcblx0XHRjb25zdCB1c2Vyc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAndXNlcnMnLCAndXNlcnMnOiB0ZW1wVXNlcnMgfSk7XG5cdFx0dGhpcy51c2VycyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKHVzZXJzSWQpO1xuXHRcdHRoaXMudXBkYXRlUmVjb3JkKHsgJ2NvdW50LnVzZXJzJzogdGVtcFVzZXJzLmxlbmd0aCB9KTtcblx0XHR0aGlzLmFkZENvdW50VG9Ub3RhbCh0ZW1wVXNlcnMubGVuZ3RoKTtcblxuXHRcdC8vIEluc2VydCB0aGUgY2hhbm5lbHMgcmVjb3Jkcy5cblx0XHRjb25zdCBjaGFubmVsc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAnY2hhbm5lbHMnLCAnY2hhbm5lbHMnOiB0ZW1wQ2hhbm5lbHMgfSk7XG5cdFx0dGhpcy5jaGFubmVscyA9IHRoaXMuY29sbGVjdGlvbi5maW5kT25lKGNoYW5uZWxzSWQpO1xuXHRcdHRoaXMudXBkYXRlUmVjb3JkKHsgJ2NvdW50LmNoYW5uZWxzJzogdGVtcENoYW5uZWxzLmxlbmd0aCB9KTtcblx0XHR0aGlzLmFkZENvdW50VG9Ub3RhbCh0ZW1wQ2hhbm5lbHMubGVuZ3RoKTtcblxuXHRcdC8vIEluc2VydCB0aGUgbWVzc2FnZXMgcmVjb3Jkc1xuXHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5QUkVQQVJJTkdfTUVTU0FHRVMpO1xuXG5cdFx0bGV0IG1lc3NhZ2VzQ291bnQgPSAwO1xuXHRcdE9iamVjdC5rZXlzKHRlbXBNZXNzYWdlcykuZm9yRWFjaChjaGFubmVsID0+IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2VzT2JqID0gdGVtcE1lc3NhZ2VzW2NoYW5uZWxdO1xuXHRcdFx0dGhpcy5tZXNzYWdlc1tjaGFubmVsXSA9IHRoaXMubWVzc2FnZXNbY2hhbm5lbF0gfHwge307XG5cblx0XHRcdE9iamVjdC5rZXlzKG1lc3NhZ2VzT2JqKS5mb3JFYWNoKGRhdGUgPT4ge1xuXHRcdFx0XHRjb25zdCBtc2dzID0gbWVzc2FnZXNPYmpbZGF0ZV07XG5cdFx0XHRcdG1lc3NhZ2VzQ291bnQgKz0gbXNncy5sZW5ndGg7XG5cdFx0XHRcdHRoaXMudXBkYXRlUmVjb3JkKHsgJ21lc3NhZ2Vzc3RhdHVzJzogYCR7IGNoYW5uZWwgfS8keyBkYXRlIH1gIH0pO1xuXHRcdFx0XHRpZiAoQmFzZS5nZXRCU09OU2l6ZShtc2dzKSA+IEJhc2UuZ2V0TWF4QlNPTlNpemUoKSkge1xuXHRcdFx0XHRcdGNvbnN0IHRtcCA9IEJhc2UuZ2V0QlNPTlNhZmVBcnJheXNGcm9tQW5BcnJheShtc2dzKTtcblx0XHRcdFx0XHRPYmplY3Qua2V5cyh0bXApLmZvckVhY2goaSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBzcGxpdE1zZyA9IHRtcFtpXTtcblx0XHRcdFx0XHRcdGNvbnN0IG1lc3NhZ2VzSWQgPSB0aGlzLmNvbGxlY3Rpb24uaW5zZXJ0KHsgJ2ltcG9ydCc6IHRoaXMuaW1wb3J0UmVjb3JkLl9pZCwgJ2ltcG9ydGVyJzogdGhpcy5uYW1lLCAndHlwZSc6ICdtZXNzYWdlcycsICduYW1lJzogYCR7IGNoYW5uZWwgfS8keyBkYXRlIH0uJHsgaSB9YCwgJ21lc3NhZ2VzJzogc3BsaXRNc2cgfSk7XG5cdFx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdW2AkeyBkYXRlIH0uJHsgaSB9YF0gPSB0aGlzLmNvbGxlY3Rpb24uZmluZE9uZShtZXNzYWdlc0lkKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zdCBtZXNzYWdlc0lkID0gdGhpcy5jb2xsZWN0aW9uLmluc2VydCh7ICdpbXBvcnQnOiB0aGlzLmltcG9ydFJlY29yZC5faWQsICdpbXBvcnRlcic6IHRoaXMubmFtZSwgJ3R5cGUnOiAnbWVzc2FnZXMnLCAnbmFtZSc6IGAkeyBjaGFubmVsIH0vJHsgZGF0ZSB9YCwgJ21lc3NhZ2VzJzogbXNncyB9KTtcblx0XHRcdFx0XHR0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdW2RhdGVdID0gdGhpcy5jb2xsZWN0aW9uLmZpbmRPbmUobWVzc2FnZXNJZCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy51cGRhdGVSZWNvcmQoeyAnY291bnQubWVzc2FnZXMnOiBtZXNzYWdlc0NvdW50LCAnbWVzc2FnZXNzdGF0dXMnOiBudWxsIH0pO1xuXHRcdHRoaXMuYWRkQ291bnRUb1RvdGFsKG1lc3NhZ2VzQ291bnQpO1xuXG5cdFx0aWYgKFt0ZW1wVXNlcnMubGVuZ3RoLCB0ZW1wQ2hhbm5lbHMubGVuZ3RoLCBtZXNzYWdlc0NvdW50XS5zb21lKGUgPT4gZSA9PT0gMCkpIHtcblx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYFRoZSBsb2FkZWQgdXNlcnMgY291bnQgJHsgdGVtcFVzZXJzLmxlbmd0aCB9LCB0aGUgbG9hZGVkIGNoYW5uZWxzICR7IHRlbXBDaGFubmVscy5sZW5ndGggfSwgYW5kIHRoZSBsb2FkZWQgbWVzc2FnZXMgJHsgbWVzc2FnZXNDb3VudCB9YCk7XG5cdFx0XHRjb25zb2xlLmxvZyhgVGhlIGxvYWRlZCB1c2VycyBjb3VudCAkeyB0ZW1wVXNlcnMubGVuZ3RoIH0sIHRoZSBsb2FkZWQgY2hhbm5lbHMgJHsgdGVtcENoYW5uZWxzLmxlbmd0aCB9LCBhbmQgdGhlIGxvYWRlZCBtZXNzYWdlcyAkeyBtZXNzYWdlc0NvdW50IH1gKTtcblx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5FUlJPUik7XG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRQcm9ncmVzcygpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlbGVjdGlvblVzZXJzID0gdGVtcFVzZXJzLm1hcCh1c2VyID0+IG5ldyBTZWxlY3Rpb25Vc2VyKHVzZXIuaWQsIHVzZXIubmFtZSwgdXNlci5wcm9maWxlLmVtYWlsLCB1c2VyLmRlbGV0ZWQsIHVzZXIuaXNfYm90LCAhdXNlci5pc19ib3QpKTtcblx0XHRjb25zdCBzZWxlY3Rpb25DaGFubmVscyA9IHRlbXBDaGFubmVscy5tYXAoY2hhbm5lbCA9PiBuZXcgU2VsZWN0aW9uQ2hhbm5lbChjaGFubmVsLmlkLCBjaGFubmVsLm5hbWUsIGNoYW5uZWwuaXNfYXJjaGl2ZWQsIHRydWUsIGZhbHNlKSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uTWVzc2FnZXMgPSB0aGlzLmltcG9ydFJlY29yZC5jb3VudC5tZXNzYWdlcztcblx0XHRzdXBlci51cGRhdGVQcm9ncmVzcyhQcm9ncmVzc1N0ZXAuVVNFUl9TRUxFQ1RJT04pO1xuXG5cdFx0cmV0dXJuIG5ldyBTZWxlY3Rpb24odGhpcy5uYW1lLCBzZWxlY3Rpb25Vc2Vycywgc2VsZWN0aW9uQ2hhbm5lbHMsIHNlbGVjdGlvbk1lc3NhZ2VzKTtcblx0fVxuXG5cdHN0YXJ0SW1wb3J0KGltcG9ydFNlbGVjdGlvbikge1xuXHRcdHN1cGVyLnN0YXJ0SW1wb3J0KGltcG9ydFNlbGVjdGlvbik7XG5cdFx0Y29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuXG5cdFx0T2JqZWN0LmtleXMoaW1wb3J0U2VsZWN0aW9uLnVzZXJzKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0XHRjb25zdCB1c2VyID0gaW1wb3J0U2VsZWN0aW9uLnVzZXJzW2tleV07XG5cdFx0XHRPYmplY3Qua2V5cyh0aGlzLnVzZXJzLnVzZXJzKS5mb3JFYWNoKGsgPT4ge1xuXHRcdFx0XHRjb25zdCB1ID0gdGhpcy51c2Vycy51c2Vyc1trXTtcblx0XHRcdFx0aWYgKHUuaWQgPT09IHVzZXIudXNlcl9pZCkge1xuXHRcdFx0XHRcdHUuZG9faW1wb3J0ID0gdXNlci5kb19pbXBvcnQ7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMudXNlcnMuX2lkIH0sIHsgJHNldDogeyAndXNlcnMnOiB0aGlzLnVzZXJzLnVzZXJzIH19KTtcblxuXHRcdE9iamVjdC5rZXlzKGltcG9ydFNlbGVjdGlvbi5jaGFubmVscykuZm9yRWFjaChrZXkgPT4ge1xuXHRcdFx0Y29uc3QgY2hhbm5lbCA9IGltcG9ydFNlbGVjdGlvbi5jaGFubmVsc1trZXldO1xuXHRcdFx0T2JqZWN0LmtleXModGhpcy5jaGFubmVscy5jaGFubmVscykuZm9yRWFjaChrID0+IHtcblx0XHRcdFx0Y29uc3QgYyA9IHRoaXMuY2hhbm5lbHMuY2hhbm5lbHNba107XG5cdFx0XHRcdGlmIChjLmlkID09PSBjaGFubmVsLmNoYW5uZWxfaWQpIHtcblx0XHRcdFx0XHRjLmRvX2ltcG9ydCA9IGNoYW5uZWwuZG9faW1wb3J0O1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmNvbGxlY3Rpb24udXBkYXRlKHsgX2lkOiB0aGlzLmNoYW5uZWxzLl9pZCB9LCB7ICRzZXQ6IHsgJ2NoYW5uZWxzJzogdGhpcy5jaGFubmVscy5jaGFubmVscyB9fSk7XG5cblx0XHRjb25zdCBzdGFydGVkQnlVc2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5JTVBPUlRJTkdfVVNFUlMpO1xuXHRcdFx0XHR0aGlzLnVzZXJzLnVzZXJzLmZvckVhY2godXNlciA9PiB7XG5cdFx0XHRcdFx0aWYgKCF1c2VyLmRvX2ltcG9ydCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIoc3RhcnRlZEJ5VXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBleGlzdGFudFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlFbWFpbEFkZHJlc3ModXNlci5wcm9maWxlLmVtYWlsKSB8fCBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VyLm5hbWUpO1xuXHRcdFx0XHRcdFx0aWYgKGV4aXN0YW50VXNlcikge1xuXHRcdFx0XHRcdFx0XHR1c2VyLnJvY2tldElkID0gZXhpc3RhbnRVc2VyLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1c2VyLnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogdXNlci5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVzZXJUYWdzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdHNsYWNrOiBgPEAkeyB1c2VyLmlkIH0+YCxcblx0XHRcdFx0XHRcdFx0XHRzbGFja0xvbmc6IGA8QCR7IHVzZXIuaWQgfXwkeyB1c2VyLm5hbWUgfT5gLFxuXHRcdFx0XHRcdFx0XHRcdHJvY2tldDogYEAkeyBleGlzdGFudFVzZXIudXNlcm5hbWUgfWBcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb25zdCB1c2VySWQgPSB1c2VyLnByb2ZpbGUuZW1haWwgPyBBY2NvdW50cy5jcmVhdGVVc2VyKHsgZW1haWw6IHVzZXIucHJvZmlsZS5lbWFpbCwgcGFzc3dvcmQ6IERhdGUubm93KCkgKyB1c2VyLm5hbWUgKyB1c2VyLnByb2ZpbGUuZW1haWwudG9VcHBlckNhc2UoKSB9KSA6IEFjY291bnRzLmNyZWF0ZVVzZXIoeyB1c2VybmFtZTogdXNlci5uYW1lLCBwYXNzd29yZDogRGF0ZS5ub3coKSArIHVzZXIubmFtZSwgam9pbkRlZmF1bHRDaGFubmVsc1NpbGVuY2VkOiB0cnVlIH0pO1xuXHRcdFx0XHRcdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXJJZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VybmFtZScsIHVzZXIubmFtZSwgeyBqb2luRGVmYXVsdENoYW5uZWxzU2lsZW5jZWQ6IHRydWUgfSk7XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zdCB1cmwgPSB1c2VyLnByb2ZpbGUuaW1hZ2Vfb3JpZ2luYWwgfHwgdXNlci5wcm9maWxlLmltYWdlXzUxMjtcblx0XHRcdFx0XHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NldEF2YXRhckZyb21TZXJ2aWNlJywgdXJsLCB1bmRlZmluZWQsICd1cmwnKTtcblx0XHRcdFx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5sb2dnZXIud2FybihgRmFpbGVkIHRvIHNldCAkeyB1c2VyLm5hbWUgfSdzIGF2YXRhciBmcm9tIHVybCAkeyB1cmwgfWApO1xuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coYEZhaWxlZCB0byBzZXQgJHsgdXNlci5uYW1lIH0ncyBhdmF0YXIgZnJvbSB1cmwgJHsgdXJsIH1gKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHQvLyBTbGFjaydzIGlzIC0xODAwMCB3aGljaCB0cmFuc2xhdGVzIHRvIFJvY2tldC5DaGF0J3MgYWZ0ZXIgZGl2aWRpbmcgYnkgMzYwMFxuXHRcdFx0XHRcdFx0XHRcdGlmICh1c2VyLnR6X29mZnNldCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3VzZXJTZXRVdGNPZmZzZXQnLCB1c2VyLnR6X29mZnNldCAvIDM2MDApO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiB1c2VySWQgfSwgeyAkYWRkVG9TZXQ6IHsgaW1wb3J0SWRzOiB1c2VyLmlkIH0gfSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHVzZXIucHJvZmlsZS5yZWFsX25hbWUpIHtcblx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXROYW1lKHVzZXJJZCwgdXNlci5wcm9maWxlLnJlYWxfbmFtZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvL0RlbGV0ZWQgdXNlcnMgYXJlICdpbmFjdGl2ZScgdXNlcnMgaW4gUm9ja2V0LkNoYXRcblx0XHRcdFx0XHRcdFx0aWYgKHVzZXIuZGVsZXRlZCkge1xuXHRcdFx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRVc2VyQWN0aXZlU3RhdHVzJywgdXNlcklkLCBmYWxzZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR1c2VyLnJvY2tldElkID0gdXNlcklkO1xuXHRcdFx0XHRcdFx0XHR0aGlzLnVzZXJUYWdzLnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdHNsYWNrOiBgPEAkeyB1c2VyLmlkIH0+YCxcblx0XHRcdFx0XHRcdFx0XHRzbGFja0xvbmc6IGA8QCR7IHVzZXIuaWQgfXwkeyB1c2VyLm5hbWUgfT5gLFxuXHRcdFx0XHRcdFx0XHRcdHJvY2tldDogYEAkeyB1c2VyLm5hbWUgfWBcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMuYWRkQ291bnRDb21wbGV0ZWQoMSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHR0aGlzLmNvbGxlY3Rpb24udXBkYXRlKHsgX2lkOiB0aGlzLnVzZXJzLl9pZCB9LCB7ICRzZXQ6IHsgJ3VzZXJzJzogdGhpcy51c2Vycy51c2VycyB9fSk7XG5cblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19DSEFOTkVMUyk7XG5cdFx0XHRcdHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMuZm9yRWFjaChjaGFubmVsID0+IHtcblx0XHRcdFx0XHRpZiAoIWNoYW5uZWwuZG9faW1wb3J0KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlciAoc3RhcnRlZEJ5VXNlcklkLCAoKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zdCBleGlzdGFudFJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKGNoYW5uZWwubmFtZSk7XG5cdFx0XHRcdFx0XHRpZiAoZXhpc3RhbnRSb29tIHx8IGNoYW5uZWwuaXNfZ2VuZXJhbCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoY2hhbm5lbC5pc19nZW5lcmFsICYmIGV4aXN0YW50Um9vbSAmJiBjaGFubmVsLm5hbWUgIT09IGV4aXN0YW50Um9vbS5uYW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ3NhdmVSb29tU2V0dGluZ3MnLCAnR0VORVJBTCcsICdyb29tTmFtZScsIGNoYW5uZWwubmFtZSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRjaGFubmVsLnJvY2tldElkID0gY2hhbm5lbC5pc19nZW5lcmFsID8gJ0dFTkVSQUwnIDogZXhpc3RhbnRSb29tLl9pZDtcblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHsgX2lkOiBjaGFubmVsLnJvY2tldElkIH0sIHsgJGFkZFRvU2V0OiB7IGltcG9ydElkczogY2hhbm5lbC5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgdXNlcnMgPSBjaGFubmVsLm1lbWJlcnNcblx0XHRcdFx0XHRcdFx0XHQucmVkdWNlKChyZXQsIG1lbWJlcikgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lbWJlciAhPT0gY2hhbm5lbC5jcmVhdG9yKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFJvY2tldFVzZXIobWVtYmVyKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHVzZXIgJiYgdXNlci51c2VybmFtZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldC5wdXNoKHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0XHRcdFx0XHRcdH0sIFtdKTtcblx0XHRcdFx0XHRcdFx0bGV0IHVzZXJJZCA9IHN0YXJ0ZWRCeVVzZXJJZDtcblx0XHRcdFx0XHRcdFx0dGhpcy51c2Vycy51c2Vycy5mb3JFYWNoKHVzZXIgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdGlmICh1c2VyLmlkID09PSBjaGFubmVsLmNyZWF0b3IgJiYgdXNlci5kb19pbXBvcnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHVzZXJJZCA9IHVzZXIucm9ja2V0SWQ7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VySWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCByZXR1cm5lZCA9IE1ldGVvci5jYWxsKCdjcmVhdGVDaGFubmVsJywgY2hhbm5lbC5uYW1lLCB1c2Vycyk7XG5cdFx0XHRcdFx0XHRcdFx0Y2hhbm5lbC5yb2NrZXRJZCA9IHJldHVybmVkLnJpZDtcblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0Ly8gQFRPRE8gaW1wbGVtZW50IG1vZGVsIHNwZWNpZmljIGZ1bmN0aW9uXG5cdFx0XHRcdFx0XHRcdGNvbnN0IHJvb21VcGRhdGUgPSB7XG5cdFx0XHRcdFx0XHRcdFx0dHM6IG5ldyBEYXRlKGNoYW5uZWwuY3JlYXRlZCAqIDEwMDApXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdGlmICghXy5pc0VtcHR5KGNoYW5uZWwudG9waWMgJiYgY2hhbm5lbC50b3BpYy52YWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRyb29tVXBkYXRlLnRvcGljID0gY2hhbm5lbC50b3BpYy52YWx1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRpZiAoIV8uaXNFbXB0eShjaGFubmVsLnB1cnBvc2UgJiYgY2hhbm5lbC5wdXJwb3NlLnZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRcdHJvb21VcGRhdGUuZGVzY3JpcHRpb24gPSBjaGFubmVsLnB1cnBvc2UudmFsdWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlKHsgX2lkOiBjaGFubmVsLnJvY2tldElkIH0sIHsgJHNldDogcm9vbVVwZGF0ZSwgJGFkZFRvU2V0OiB7IGltcG9ydElkczogY2hhbm5lbC5pZCB9IH0pO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0dGhpcy5hZGRDb3VudENvbXBsZXRlZCgxKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHRcdHRoaXMuY29sbGVjdGlvbi51cGRhdGUoeyBfaWQ6IHRoaXMuY2hhbm5lbHMuX2lkIH0sIHsgJHNldDogeyAnY2hhbm5lbHMnOiB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzIH19KTtcblxuXHRcdFx0XHRjb25zdCBtaXNzZWRUeXBlcyA9IHt9O1xuXHRcdFx0XHRjb25zdCBpZ25vcmVUeXBlcyA9IHsgJ2JvdF9hZGQnOiB0cnVlLCAnZmlsZV9jb21tZW50JzogdHJ1ZSwgJ2ZpbGVfbWVudGlvbic6IHRydWUgfTtcblx0XHRcdFx0c3VwZXIudXBkYXRlUHJvZ3Jlc3MoUHJvZ3Jlc3NTdGVwLklNUE9SVElOR19NRVNTQUdFUyk7XG5cdFx0XHRcdE9iamVjdC5rZXlzKHRoaXMubWVzc2FnZXMpLmZvckVhY2goY2hhbm5lbCA9PiB7XG5cdFx0XHRcdFx0Y29uc3QgbWVzc2FnZXNPYmogPSB0aGlzLm1lc3NhZ2VzW2NoYW5uZWxdO1xuXG5cdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsICgpID0+e1xuXHRcdFx0XHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5nZXRTbGFja0NoYW5uZWxGcm9tTmFtZShjaGFubmVsKTtcblx0XHRcdFx0XHRcdGlmICghc2xhY2tDaGFubmVsIHx8ICFzbGFja0NoYW5uZWwuZG9faW1wb3J0KSB7IHJldHVybjsgfVxuXHRcdFx0XHRcdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHNsYWNrQ2hhbm5lbC5yb2NrZXRJZCwgeyBmaWVsZHM6IHsgdXNlcm5hbWVzOiAxLCB0OiAxLCBuYW1lOiAxIH0gfSk7XG5cdFx0XHRcdFx0XHRPYmplY3Qua2V5cyhtZXNzYWdlc09iaikuZm9yRWFjaChkYXRlID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3QgbXNncyA9IG1lc3NhZ2VzT2JqW2RhdGVdO1xuXHRcdFx0XHRcdFx0XHRtc2dzLm1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0dGhpcy51cGRhdGVSZWNvcmQoeyAnbWVzc2FnZXNzdGF0dXMnOiBgJHsgY2hhbm5lbCB9LyR7IGRhdGUgfS4keyBtc2dzLm1lc3NhZ2VzLmxlbmd0aCB9YCB9KTtcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dEYXRhRGVmYXVsdHMgPXtcblx0XHRcdFx0XHRcdFx0XHRcdF9pZDogYHNsYWNrLSR7IHNsYWNrQ2hhbm5lbC5pZCB9LSR7IG1lc3NhZ2UudHMucmVwbGFjZSgvXFwuL2csICctJykgfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHR0czogbmV3IERhdGUocGFyc2VJbnQobWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0XHRcdC8vIFByb2Nlc3MgdGhlIHJlYWN0aW9uc1xuXHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLnJlYWN0aW9ucyAmJiBtZXNzYWdlLnJlYWN0aW9ucy5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRtc2dEYXRhRGVmYXVsdHMucmVhY3Rpb25zID0ge307XG5cblx0XHRcdFx0XHRcdFx0XHRcdG1lc3NhZ2UucmVhY3Rpb25zLmZvckVhY2gocmVhY3Rpb24gPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZWFjdGlvbi5uYW1lID0gYDokeyByZWFjdGlvbi5uYW1lIH06YDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnRGF0YURlZmF1bHRzLnJlYWN0aW9uc1tyZWFjdGlvbi5uYW1lXSA9IHsgdXNlcm5hbWVzOiBbXSB9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJlYWN0aW9uLnVzZXJzLmZvckVhY2godSA9PiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgcmNVc2VyID0gdGhpcy5nZXRSb2NrZXRVc2VyKHUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghcmNVc2VyKSB7IHJldHVybjsgfVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnRGF0YURlZmF1bHRzLnJlYWN0aW9uc1tyZWFjdGlvbi5uYW1lXS51c2VybmFtZXMucHVzaChyY1VzZXIudXNlcm5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobXNnRGF0YURlZmF1bHRzLnJlYWN0aW9uc1tyZWFjdGlvbi5uYW1lXS51c2VybmFtZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG1zZ0RhdGFEZWZhdWx0cy5yZWFjdGlvbnNbcmVhY3Rpb24ubmFtZV07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLnR5cGUgPT09ICdtZXNzYWdlJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2Uuc3VidHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnY2hhbm5lbF9qb2luJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIG1zZ0RhdGFEZWZhdWx0cyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ2NoYW5uZWxfbGVhdmUnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlcihyb29tLl9pZCwgdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIG1zZ0RhdGFEZWZhdWx0cyk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ21lX21lc3NhZ2UnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgbXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Li4ubXNnRGF0YURlZmF1bHRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnOiBgXyR7IHRoaXMuY29udmVydFNsYWNrTWVzc2FnZVRvUm9ja2V0Q2hhdChtZXNzYWdlLnRleHQpIH1fYFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zZW5kTWVzc2FnZSh0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnT2JqLCByb29tLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdib3RfbWVzc2FnZScgfHwgbWVzc2FnZS5zdWJ0eXBlID09PSAnc2xhY2tib3RfcmVzcG9uc2UnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgYm90VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0JywgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfX0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IGJvdFVzZXJuYW1lID0gdGhpcy5ib3RzW21lc3NhZ2UuYm90X2lkXSA/IHRoaXMuYm90c1ttZXNzYWdlLmJvdF9pZF0ubmFtZSA6IG1lc3NhZ2UudXNlcm5hbWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgbXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Li4ubXNnRGF0YURlZmF1bHRzLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnOiB0aGlzLmNvbnZlcnRTbGFja01lc3NhZ2VUb1JvY2tldENoYXQobWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRib3Q6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhdHRhY2htZW50czogbWVzc2FnZS5hdHRhY2htZW50cyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBib3RVc2VybmFtZSB8fCB1bmRlZmluZWRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UuZWRpdGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dPYmouZWRpdGVkQXQgPSBuZXcgRGF0ZShwYXJzZUludChtZXNzYWdlLmVkaXRlZC50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgZWRpdGVkQnkgPSB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS5lZGl0ZWQudXNlcik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoZWRpdGVkQnkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnT2JqLmVkaXRlZEJ5ID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdF9pZDogZWRpdGVkQnkuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBlZGl0ZWRCeS51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXNzYWdlLmljb25zKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dPYmouZW1vamkgPSBtZXNzYWdlLmljb25zLmVtb2ppO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKGJvdFVzZXIsIG1zZ09iaiwgcm9vbSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnY2hhbm5lbF9wdXJwb3NlJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9kZXNjcmlwdGlvbicsIHJvb20uX2lkLCBtZXNzYWdlLnB1cnBvc2UsIHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dEYXRhRGVmYXVsdHMpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdjaGFubmVsX3RvcGljJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF90b3BpYycsIHJvb20uX2lkLCBtZXNzYWdlLnRvcGljLCB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnRGF0YURlZmF1bHRzKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAobWVzc2FnZS5zdWJ0eXBlID09PSAnY2hhbm5lbF9uYW1lJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyKHJvb20uX2lkLCBtZXNzYWdlLm5hbWUsIHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dEYXRhRGVmYXVsdHMpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChtZXNzYWdlLnN1YnR5cGUgPT09ICdwaW5uZWRfaXRlbScpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWVzc2FnZS5hdHRhY2htZW50cykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgbXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuLi5tc2dEYXRhRGVmYXVsdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGF0dGFjaG1lbnRzOiBbe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCd0ZXh0JzogdGhpcy5jb252ZXJ0U2xhY2tNZXNzYWdlVG9Sb2NrZXRDaGF0KG1lc3NhZ2UuYXR0YWNobWVudHNbMF0udGV4dCksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0J2F1dGhvcl9uYW1lJyA6IG1lc3NhZ2UuYXR0YWNobWVudHNbMF0uYXV0aG9yX3N1Ym5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0J2F1dGhvcl9pY29uJyA6IGdldEF2YXRhclVybEZyb21Vc2VybmFtZShtZXNzYWdlLmF0dGFjaG1lbnRzWzBdLmF1dGhvcl9zdWJuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ21lc3NhZ2VfcGlubmVkJywgcm9vbS5faWQsICcnLCB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnT2JqKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9UT0RPOiBtYWtlIHRoaXMgYmV0dGVyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aGlzLmxvZ2dlci5kZWJ1ZygnUGlubmVkIGl0ZW0gd2l0aCBubyBhdHRhY2htZW50LCBuZWVkcyB3b3JrLicpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9Sb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyICdtZXNzYWdlX3Bpbm5lZCcsIHJvb20uX2lkLCAnJywgQGdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKSwgbXNnRGF0YURlZmF1bHRzXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKG1lc3NhZ2Uuc3VidHlwZSA9PT0gJ2ZpbGVfc2hhcmUnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UuZmlsZSAmJiBtZXNzYWdlLmZpbGUudXJsX3ByaXZhdGVfZG93bmxvYWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgZGV0YWlscyA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWVzc2FnZV9pZDogYHNsYWNrLSR7IG1lc3NhZ2UudHMucmVwbGFjZSgvXFwuL2csICctJykgfWAsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IG1lc3NhZ2UuZmlsZS5uYW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzaXplOiBtZXNzYWdlLmZpbGUuc2l6ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHlwZTogbWVzc2FnZS5maWxlLm1pbWV0eXBlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyaWQ6IHJvb20uX2lkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhpcy51cGxvYWRGaWxlKGRldGFpbHMsIG1lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCwgdGhpcy5nZXRSb2NrZXRVc2VyKG1lc3NhZ2UudXNlciksIHJvb20sIG5ldyBEYXRlKHBhcnNlSW50KG1lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKCFtaXNzZWRUeXBlc1ttZXNzYWdlLnN1YnR5cGVdICYmICFpZ25vcmVUeXBlc1ttZXNzYWdlLnN1YnR5cGVdKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bWlzc2VkVHlwZXNbbWVzc2FnZS5zdWJ0eXBlXSA9IG1lc3NhZ2U7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnN0IHVzZXIgPSB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS51c2VyKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHVzZXIpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zdCBtc2dPYmogPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQuLi5tc2dEYXRhRGVmYXVsdHMsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2c6IHRoaXMuY29udmVydFNsYWNrTWVzc2FnZVRvUm9ja2V0Q2hhdChtZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1lc3NhZ2UuZWRpdGVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRtc2dPYmouZWRpdGVkQXQgPSBuZXcgRGF0ZShwYXJzZUludChtZXNzYWdlLmVkaXRlZC50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29uc3QgZWRpdGVkQnkgPSB0aGlzLmdldFJvY2tldFVzZXIobWVzc2FnZS5lZGl0ZWQudXNlcik7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoZWRpdGVkQnkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bXNnT2JqLmVkaXRlZEJ5ID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdF9pZDogZWRpdGVkQnkuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBlZGl0ZWRCeS51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHRoaXMuZ2V0Um9ja2V0VXNlcihtZXNzYWdlLnVzZXIpLCBtc2dPYmosIHJvb20sIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubG9nZ2VyLndhcm4oYEZhaWxlZCB0byBpbXBvcnQgdGhlIG1lc3NhZ2U6ICR7IG1zZ0RhdGFEZWZhdWx0cy5faWQgfWApO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdHRoaXMuYWRkQ291bnRDb21wbGV0ZWQoMSk7XG5cdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGlmICghXy5pc0VtcHR5KG1pc3NlZFR5cGVzKSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdNaXNzZWQgaW1wb3J0IHR5cGVzOicsIG1pc3NlZFR5cGVzKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5GSU5JU0hJTkcpO1xuXG5cdFx0XHRcdHRoaXMuY2hhbm5lbHMuY2hhbm5lbHMuZm9yRWFjaChjaGFubmVsID0+IHtcblx0XHRcdFx0XHRpZiAoY2hhbm5lbC5kb19pbXBvcnQgJiYgY2hhbm5lbC5pc19hcmNoaXZlZCkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcihzdGFydGVkQnlVc2VySWQsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnYXJjaGl2ZVJvb20nLCBjaGFubmVsLnJvY2tldElkKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5ET05FKTtcblxuXHRcdFx0XHR0aGlzLmxvZ2dlci5sb2coYEltcG9ydCB0b29rICR7IERhdGUubm93KCkgLSBzdGFydCB9IG1pbGxpc2Vjb25kcy5gKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhpcy5sb2dnZXIuZXJyb3IoZSk7XG5cdFx0XHRcdHN1cGVyLnVwZGF0ZVByb2dyZXNzKFByb2dyZXNzU3RlcC5FUlJPUik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdGhpcy5nZXRQcm9ncmVzcygpO1xuXHR9XG5cblx0Z2V0U2xhY2tDaGFubmVsRnJvbU5hbWUoY2hhbm5lbE5hbWUpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFubmVscy5jaGFubmVscy5maW5kKGNoYW5uZWwgPT4gY2hhbm5lbC5uYW1lID09PSBjaGFubmVsTmFtZSk7XG5cdH1cblxuXHRnZXRSb2NrZXRVc2VyKHNsYWNrSWQpIHtcblx0XHRjb25zdCB1c2VyID0gdGhpcy51c2Vycy51c2Vycy5maW5kKHVzZXIgPT4gdXNlci5pZCA9PT0gc2xhY2tJZCk7XG5cblx0XHRpZiAodXNlcikge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXIucm9ja2V0SWQsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxLCBuYW1lOiAxIH19KTtcblx0XHR9XG5cdH1cblxuXHRjb252ZXJ0U2xhY2tNZXNzYWdlVG9Sb2NrZXRDaGF0KG1lc3NhZ2UpIHtcblx0XHRpZiAobWVzc2FnZSkge1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvPCFldmVyeW9uZT4vZywgJ0BhbGwnKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzwhY2hhbm5lbD4vZywgJ0BhbGwnKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzwhaGVyZT4vZywgJ0BoZXJlJyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC8mbHQ7L2csICc8Jyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC8mYW1wOy9nLCAnJicpO1xuXHRcdFx0bWVzc2FnZSA9IG1lc3NhZ2UucmVwbGFjZSgvOnNpbXBsZV9zbWlsZTovZywgJzpzbWlsZTonKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzptZW1vOi9nLCAnOnBlbmNpbDonKTtcblx0XHRcdG1lc3NhZ2UgPSBtZXNzYWdlLnJlcGxhY2UoLzpwaWdneTovZywgJzpwaWc6Jyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC86dWs6L2csICc6Z2I6Jyk7XG5cdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKC88KGh0dHBbc10/OltePl0qKT4vZywgJyQxJyk7XG5cblx0XHRcdGZvciAoY29uc3QgdXNlclJlcGxhY2Ugb2YgQXJyYXkuZnJvbSh0aGlzLnVzZXJUYWdzKSkge1xuXHRcdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKHVzZXJSZXBsYWNlLnNsYWNrLCB1c2VyUmVwbGFjZS5yb2NrZXQpO1xuXHRcdFx0XHRtZXNzYWdlID0gbWVzc2FnZS5yZXBsYWNlKHVzZXJSZXBsYWNlLnNsYWNrTG9uZywgdXNlclJlcGxhY2Uucm9ja2V0KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bWVzc2FnZSA9ICcnO1xuXHRcdH1cblxuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Z2V0U2VsZWN0aW9uKCkge1xuXHRcdGNvbnN0IHNlbGVjdGlvblVzZXJzID0gdGhpcy51c2Vycy51c2Vycy5tYXAodXNlciA9PiBuZXcgU2VsZWN0aW9uVXNlcih1c2VyLmlkLCB1c2VyLm5hbWUsIHVzZXIucHJvZmlsZS5lbWFpbCwgdXNlci5kZWxldGVkLCB1c2VyLmlzX2JvdCwgIXVzZXIuaXNfYm90KSk7XG5cdFx0Y29uc3Qgc2VsZWN0aW9uQ2hhbm5lbHMgPSB0aGlzLmNoYW5uZWxzLmNoYW5uZWxzLm1hcChjaGFubmVsID0+IG5ldyBTZWxlY3Rpb25DaGFubmVsKGNoYW5uZWwuaWQsIGNoYW5uZWwubmFtZSwgY2hhbm5lbC5pc19hcmNoaXZlZCwgdHJ1ZSwgZmFsc2UpKTtcblx0XHRyZXR1cm4gbmV3IFNlbGVjdGlvbih0aGlzLm5hbWUsIHNlbGVjdGlvblVzZXJzLCBzZWxlY3Rpb25DaGFubmVscywgdGhpcy5pbXBvcnRSZWNvcmQuY291bnQubWVzc2FnZXMpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBJbXBvcnRlcnMgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDppbXBvcnRlcic7XG5pbXBvcnQgeyBTbGFja0ltcG9ydGVySW5mbyB9IGZyb20gJy4uL2luZm8nO1xuaW1wb3J0IHsgU2xhY2tJbXBvcnRlciB9IGZyb20gJy4vaW1wb3J0ZXInO1xuXG5JbXBvcnRlcnMuYWRkKG5ldyBTbGFja0ltcG9ydGVySW5mbygpLCBTbGFja0ltcG9ydGVyKTtcbiJdfQ==
