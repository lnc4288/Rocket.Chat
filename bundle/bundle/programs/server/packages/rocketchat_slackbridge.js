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
var logger, slackMsgTxt, rocketUser;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:slackbridge":{"server":{"logger.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/logger.js                                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals logger:true */

/* exported logger */
logger = new Logger('SlackBridge', {
  sections: {
    connection: 'Connection',
    events: 'Events',
    class: 'Class'
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/settings.js                                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.startup(function () {
  RocketChat.settings.addGroup('SlackBridge', function () {
    this.add('SlackBridge_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled',
      public: true
    });
    this.add('SlackBridge_APIToken', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'API_Token'
    });
    this.add('SlackBridge_AliasFormat', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Alias_Format',
      i18nDescription: 'Alias_Format_Description'
    });
    this.add('SlackBridge_ExcludeBotnames', '', {
      type: 'string',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      },
      i18nLabel: 'Exclude_Botnames',
      i18nDescription: 'Exclude_Botnames_Description'
    });
    this.add('SlackBridge_Out_Enabled', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'SlackBridge_Enabled',
        value: true
      }
    });
    this.add('SlackBridge_Out_All', false, {
      type: 'boolean',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }]
    });
    this.add('SlackBridge_Out_Channels', '', {
      type: 'roomPick',
      enableQuery: [{
        _id: 'SlackBridge_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_Enabled',
        value: true
      }, {
        _id: 'SlackBridge_Out_All',
        value: false
      }]
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/slackbridge.js                                                        //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 1);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 2);
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 3);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 4);

class SlackBridge {
  constructor() {
    this.util = util;
    this.slackClient = require('slack-client');
    this.apiToken = RocketChat.settings.get('SlackBridge_APIToken');
    this.aliasFormat = RocketChat.settings.get('SlackBridge_AliasFormat');
    this.excludeBotnames = RocketChat.settings.get('SlackBridge_Botnames');
    this.rtm = {};
    this.connected = false;
    this.userTags = {};
    this.slackChannelMap = {};
    this.reactionsMap = new Map();
    RocketChat.settings.get('SlackBridge_APIToken', (key, value) => {
      if (value !== this.apiToken) {
        this.apiToken = value;

        if (this.connected) {
          this.disconnect();
          this.connect();
        }
      }
    });
    RocketChat.settings.get('SlackBridge_AliasFormat', (key, value) => {
      this.aliasFormat = value;
    });
    RocketChat.settings.get('SlackBridge_ExcludeBotnames', (key, value) => {
      this.excludeBotnames = value;
    });
    RocketChat.settings.get('SlackBridge_Enabled', (key, value) => {
      if (value && this.apiToken) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  connect() {
    if (this.connected === false) {
      this.connected = true;
      logger.connection.info('Connecting via token: ', this.apiToken);
      const RtmClient = this.slackClient.RtmClient;
      this.rtm = new RtmClient(this.apiToken);
      this.rtm.start();
      this.registerForSlackEvents();
      RocketChat.settings.get('SlackBridge_Out_Enabled', (key, value) => {
        if (value) {
          this.registerForRocketEvents();
        } else {
          this.unregisterForRocketEvents();
        }
      });
      Meteor.startup(() => {
        try {
          this.populateSlackChannelMap(); // If run outside of Meteor.startup, HTTP is not defined
        } catch (err) {
          logger.class.error('Error attempting to connect to Slack', err);
          this.disconnect();
        }
      });
    }
  }

  disconnect() {
    if (this.connected === true) {
      this.connected = false;
      this.rtm.disconnect && this.rtm.disconnect();
      logger.connection.info('Disconnected');
      this.unregisterForRocketEvents();
    }
  }

  convertSlackMsgTxtToRocketTxtFormat(slackMsgTxt) {
    if (!_.isEmpty(slackMsgTxt)) {
      slackMsgTxt = slackMsgTxt.replace(/<!everyone>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!channel>/g, '@all');
      slackMsgTxt = slackMsgTxt.replace(/<!here>/g, '@here');
      slackMsgTxt = slackMsgTxt.replace(/&gt;/g, '>');
      slackMsgTxt = slackMsgTxt.replace(/&lt;/g, '<');
      slackMsgTxt = slackMsgTxt.replace(/&amp;/g, '&');
      slackMsgTxt = slackMsgTxt.replace(/:simple_smile:/g, ':smile:');
      slackMsgTxt = slackMsgTxt.replace(/:memo:/g, ':pencil:');
      slackMsgTxt = slackMsgTxt.replace(/:piggy:/g, ':pig:');
      slackMsgTxt = slackMsgTxt.replace(/:uk:/g, ':gb:');
      slackMsgTxt = slackMsgTxt.replace(/<(http[s]?:[^>]*)>/g, '$1');
      slackMsgTxt.replace(/(?:<@)([a-zA-Z0-9]+)(?:\|.+)?(?:>)/g, (match, userId) => {
        if (!this.userTags[userId]) {
          this.findRocketUser(userId) || this.addRocketUser(userId); // This adds userTags for the userId
        }

        const userTags = this.userTags[userId];

        if (userTags) {
          slackMsgTxt = slackMsgTxt.replace(userTags.slack, userTags.rocket);
        }
      });
    } else {
      slackMsgTxt = '';
    }

    return slackMsgTxt;
  }

  findRocketChannel(slackChannelId) {
    return RocketChat.models.Rooms.findOneByImportId(slackChannelId);
  }

  addRocketChannel(slackChannelID, hasRetried = false) {
    logger.class.debug('Adding Rocket.Chat channel from Slack', slackChannelID);
    let slackResults = null;
    let isGroup = false;

    if (slackChannelID.charAt(0) === 'C') {
      slackResults = HTTP.get('https://slack.com/api/channels.info', {
        params: {
          token: this.apiToken,
          channel: slackChannelID
        }
      });
    } else if (slackChannelID.charAt(0) === 'G') {
      slackResults = HTTP.get('https://slack.com/api/groups.info', {
        params: {
          token: this.apiToken,
          channel: slackChannelID
        }
      });
      isGroup = true;
    }

    if (slackResults && slackResults.data && slackResults.data.ok === true) {
      const rocketChannelData = isGroup ? slackResults.data.group : slackResults.data.channel;
      const existingRocketRoom = RocketChat.models.Rooms.findOneByName(rocketChannelData.name); // If the room exists, make sure we have its id in importIds

      if (existingRocketRoom || rocketChannelData.is_general) {
        rocketChannelData.rocketId = rocketChannelData.is_general ? 'GENERAL' : existingRocketRoom._id;
        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
      } else {
        const rocketUsers = [];

        for (const member of rocketChannelData.members) {
          if (member !== rocketChannelData.creator) {
            const rocketUser = this.findRocketUser(member) || this.addRocketUser(member);

            if (rocketUser && rocketUser.username) {
              rocketUsers.push(rocketUser.username);
            }
          }
        }

        const rocketUserCreator = rocketChannelData.creator ? this.findRocketUser(rocketChannelData.creator) || this.addRocketUser(rocketChannelData.creator) : null;

        if (!rocketUserCreator) {
          logger.class.error('Could not fetch room creator information', rocketChannelData.creator);
          return;
        }

        try {
          const rocketChannel = RocketChat.createRoom(isGroup ? 'p' : 'c', rocketChannelData.name, rocketUserCreator.username, rocketUsers);
          rocketChannelData.rocketId = rocketChannel.rid;
        } catch (e) {
          if (!hasRetried) {
            logger.class.debug('Error adding channel from Slack. Will retry in 1s.', e.message); // If first time trying to create channel fails, could be because of multiple messages received at the same time. Try again once after 1s.

            Meteor._sleepForMs(1000);

            return this.findRocketChannel(slackChannelID) || this.addRocketChannel(slackChannelID, true);
          } else {
            console.log(e.message);
          }
        }

        const roomUpdate = {
          ts: new Date(rocketChannelData.created * 1000)
        };
        let lastSetTopic = 0;

        if (!_.isEmpty(rocketChannelData.topic && rocketChannelData.topic.value)) {
          roomUpdate.topic = rocketChannelData.topic.value;
          lastSetTopic = rocketChannelData.topic.last_set;
        }

        if (!_.isEmpty(rocketChannelData.purpose && rocketChannelData.purpose.value) && rocketChannelData.purpose.last_set > lastSetTopic) {
          roomUpdate.topic = rocketChannelData.purpose.value;
        }

        RocketChat.models.Rooms.addImportIds(rocketChannelData.rocketId, rocketChannelData.id);
        this.slackChannelMap[rocketChannelData.rocketId] = {
          id: slackChannelID,
          family: slackChannelID.charAt(0) === 'C' ? 'channels' : 'groups'
        };
      }

      return RocketChat.models.Rooms.findOneById(rocketChannelData.rocketId);
    }

    logger.class.debug('Channel not added');
    return;
  }

  findRocketUser(slackUserID) {
    const rocketUser = RocketChat.models.Users.findOneByImportId(slackUserID);

    if (rocketUser && !this.userTags[slackUserID]) {
      this.userTags[slackUserID] = {
        slack: `<@${slackUserID}>`,
        rocket: `@${rocketUser.username}`
      };
    }

    return rocketUser;
  }

  addRocketUser(slackUserID) {
    logger.class.debug('Adding Rocket.Chat user from Slack', slackUserID);
    const slackResults = HTTP.get('https://slack.com/api/users.info', {
      params: {
        token: this.apiToken,
        user: slackUserID
      }
    });

    if (slackResults && slackResults.data && slackResults.data.ok === true && slackResults.data.user) {
      const rocketUserData = slackResults.data.user;
      const isBot = rocketUserData.is_bot === true;
      const email = rocketUserData.profile && rocketUserData.profile.email || '';
      let existingRocketUser;

      if (!isBot) {
        existingRocketUser = RocketChat.models.Users.findOneByEmailAddress(email) || RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      } else {
        existingRocketUser = RocketChat.models.Users.findOneByUsername(rocketUserData.name);
      }

      if (existingRocketUser) {
        rocketUserData.rocketId = existingRocketUser._id;
        rocketUserData.name = existingRocketUser.username;
      } else {
        const newUser = {
          password: Random.id(),
          username: rocketUserData.name
        };

        if (!isBot && email) {
          newUser.email = email;
        }

        if (isBot) {
          newUser.joinDefaultChannels = false;
        }

        rocketUserData.rocketId = Accounts.createUser(newUser);
        const userUpdate = {
          utcOffset: rocketUserData.tz_offset / 3600,
          // Slack's is -18000 which translates to Rocket.Chat's after dividing by 3600,
          roles: isBot ? ['bot'] : ['user']
        };

        if (rocketUserData.profile && rocketUserData.profile.real_name) {
          userUpdate['name'] = rocketUserData.profile.real_name;
        }

        if (rocketUserData.deleted) {
          userUpdate['active'] = false;
          userUpdate['services.resume.loginTokens'] = [];
        }

        RocketChat.models.Users.update({
          _id: rocketUserData.rocketId
        }, {
          $set: userUpdate
        });
        const user = RocketChat.models.Users.findOneById(rocketUserData.rocketId);
        let url = null;

        if (rocketUserData.profile) {
          if (rocketUserData.profile.image_original) {
            url = rocketUserData.profile.image_original;
          } else if (rocketUserData.profile.image_512) {
            url = rocketUserData.profile.image_512;
          }
        }

        if (url) {
          try {
            RocketChat.setUserAvatar(user, url, null, 'url');
          } catch (error) {
            logger.class.debug('Error setting user avatar', error.message);
          }
        }
      }

      const importIds = [rocketUserData.id];

      if (isBot && rocketUserData.profile && rocketUserData.profile.bot_id) {
        importIds.push(rocketUserData.profile.bot_id);
      }

      RocketChat.models.Users.addImportIds(rocketUserData.rocketId, importIds);

      if (!this.userTags[slackUserID]) {
        this.userTags[slackUserID] = {
          slack: `<@${slackUserID}>`,
          rocket: `@${rocketUserData.name}`
        };
      }

      return RocketChat.models.Users.findOneById(rocketUserData.rocketId);
    }

    logger.class.debug('User not added');
    return;
  }

  addAliasToRocketMsg(rocketUserName, rocketMsgObj) {
    if (this.aliasFormat) {
      const alias = this.util.format(this.aliasFormat, rocketUserName);

      if (alias !== rocketUserName) {
        rocketMsgObj.alias = alias;
      }
    }

    return rocketMsgObj;
  }

  createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, rocketMsgDataDefaults, isImporting) {
    if (slackMessage.type === 'message') {
      let rocketMsgObj = {};

      if (!_.isEmpty(slackMessage.subtype)) {
        rocketMsgObj = this.processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting);

        if (!rocketMsgObj) {
          return;
        }
      } else {
        rocketMsgObj = {
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
          rid: rocketChannel._id,
          u: {
            _id: rocketUser._id,
            username: rocketUser.username
          }
        };
        this.addAliasToRocketMsg(rocketUser.username, rocketMsgObj);
      }

      _.extend(rocketMsgObj, rocketMsgDataDefaults);

      if (slackMessage.edited) {
        rocketMsgObj.editedAt = new Date(parseInt(slackMessage.edited.ts.split('.')[0]) * 1000);
      }

      if (slackMessage.subtype === 'bot_message') {
        rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
          fields: {
            username: 1
          }
        });
      }

      if (slackMessage.pinned_to && slackMessage.pinned_to.indexOf(slackMessage.channel) !== -1) {
        rocketMsgObj.pinned = true;
        rocketMsgObj.pinnedAt = Date.now;
        rocketMsgObj.pinnedBy = _.pick(rocketUser, '_id', 'username');
      }

      if (slackMessage.subtype === 'bot_message') {
        Meteor.setTimeout(() => {
          if (slackMessage.bot_id && slackMessage.ts && !RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.bot_id, slackMessage.ts)) {
            RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
          }
        }, 500);
      } else {
        logger.class.debug('Send message to Rocket.Chat');
        RocketChat.sendMessage(rocketUser, rocketMsgObj, rocketChannel, true);
      }
    }
  }
  /*
   https://api.slack.com/events/reaction_removed
   */


  onSlackReactionRemoved(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.getRocketUser(slackReactionMsg.user); //Lets find our Rocket originated message

      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already been removed, then this is an echo back from slack

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) === -1) {
              return; //Reaction already removed
            }
          }
        } else {
          //Reaction already removed
          return;
        } //Stash this away to key off it later so we don't send it back to Slack


        this.reactionsMap.set(`unset${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.class.debug('Removing reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }
  /*
   https://api.slack.com/events/reaction_added
   */


  onSlackReactionAdded(slackReactionMsg) {
    if (slackReactionMsg) {
      const rocketUser = this.getRocketUser(slackReactionMsg.user);

      if (rocketUser.roles.includes('bot')) {
        return;
      } //Lets find our Rocket originated message


      let rocketMsg = RocketChat.models.Messages.findOneBySlackTs(slackReactionMsg.item.ts);

      if (!rocketMsg) {
        //Must have originated from Slack
        const rocketID = this.createRocketID(slackReactionMsg.item.channel, slackReactionMsg.item.ts);
        rocketMsg = RocketChat.models.Messages.findOneById(rocketID);
      }

      if (rocketMsg && rocketUser) {
        const rocketReaction = `:${slackReactionMsg.reaction}:`; //If the Rocket user has already reacted, then this is Slack echoing back to us

        if (rocketMsg.reactions) {
          const theReaction = rocketMsg.reactions[rocketReaction];

          if (theReaction) {
            if (theReaction.usernames.indexOf(rocketUser.username) !== -1) {
              return; //Already reacted
            }
          }
        } //Stash this away to key off it later so we don't send it back to Slack


        this.reactionsMap.set(`set${rocketMsg._id}${rocketReaction}`, rocketUser);
        logger.class.debug('Adding reaction from Slack');
        Meteor.runAsUser(rocketUser._id, () => {
          Meteor.call('setReaction', rocketReaction, rocketMsg._id);
        });
      }
    }
  }
  /**
   * We have received a message from slack and we need to save/delete/update it into rocket
   * https://api.slack.com/events/message
   */


  onSlackMessage(slackMessage, isImporting) {
    if (slackMessage.subtype) {
      switch (slackMessage.subtype) {
        case 'message_deleted':
          this.processSlackMessageDeleted(slackMessage);
          break;

        case 'message_changed':
          this.processSlackMessageChanged(slackMessage);
          break;

        default:
          //Keeping backwards compatability for now, refactor later
          this.processSlackNewMessage(slackMessage, isImporting);
      }
    } else {
      //Simple message
      this.processSlackNewMessage(slackMessage, isImporting);
    }
  }

  processSlackSubtypedMessage(rocketChannel, rocketUser, slackMessage, isImporting) {
    let rocketMsgObj = null;

    switch (slackMessage.subtype) {
      case 'bot_message':
        if (slackMessage.username !== undefined && this.excludeBotnames && slackMessage.username.match(this.excludeBotnames)) {
          return;
        }

        rocketMsgObj = {
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text),
          rid: rocketChannel._id,
          bot: true,
          attachments: slackMessage.attachments,
          username: slackMessage.username || slackMessage.bot_id
        };
        this.addAliasToRocketMsg(slackMessage.username || slackMessage.bot_id, rocketMsgObj);

        if (slackMessage.icons) {
          rocketMsgObj.emoji = slackMessage.icons.emoji;
        }

        return rocketMsgObj;

      case 'me_message':
        return this.addAliasToRocketMsg(rocketUser.username, {
          msg: `_${this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.text)}_`
        });

      case 'channel_join':
        if (isImporting) {
          RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rocketChannel._id, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.addUserToRoom(rocketChannel._id, rocketUser);
        }

        return;

      case 'group_join':
        if (slackMessage.inviter) {
          const inviter = slackMessage.inviter ? this.findRocketUser(slackMessage.inviter) || this.addRocketUser(slackMessage.inviter) : null;

          if (isImporting) {
            RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rocketChannel._id, rocketUser, {
              ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
              u: {
                _id: inviter._id,
                username: inviter.username
              },
              imported: 'slackbridge'
            });
          } else {
            RocketChat.addUserToRoom(rocketChannel._id, rocketUser, inviter);
          }
        }

        return;

      case 'channel_leave':
      case 'group_leave':
        if (isImporting) {
          RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(rocketChannel._id, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.removeUserFromRoom(rocketChannel._id, rocketUser);
        }

        return;

      case 'channel_topic':
      case 'group_topic':
        if (isImporting) {
          RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.topic, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.topic, rocketUser, false);
        }

        return;

      case 'channel_purpose':
      case 'group_purpose':
        if (isImporting) {
          RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rocketChannel._id, slackMessage.purpose, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomTopic(rocketChannel._id, slackMessage.purpose, rocketUser, false);
        }

        return;

      case 'channel_name':
      case 'group_name':
        if (isImporting) {
          RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rocketChannel._id, slackMessage.name, rocketUser, {
            ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000),
            imported: 'slackbridge'
          });
        } else {
          RocketChat.saveRoomName(rocketChannel._id, slackMessage.name, rocketUser, false);
        }

        return;

      case 'channel_archive':
      case 'group_archive':
        if (!isImporting) {
          RocketChat.archiveRoom(rocketChannel);
        }

        return;

      case 'channel_unarchive':
      case 'group_unarchive':
        if (!isImporting) {
          RocketChat.unarchiveRoom(rocketChannel);
        }

        return;

      case 'file_share':
        if (slackMessage.file && slackMessage.file.url_private_download !== undefined) {
          const details = {
            message_id: `slack-${slackMessage.ts.replace(/\./g, '-')}`,
            name: slackMessage.file.name,
            size: slackMessage.file.size,
            type: slackMessage.file.mimetype,
            rid: rocketChannel._id
          };
          return this.uploadFileFromSlack(details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);
        }

        break;

      case 'file_comment':
        logger.class.error('File comment not implemented');
        return;

      case 'file_mention':
        logger.class.error('File mentioned not implemented');
        return;

      case 'pinned_item':
        if (slackMessage.attachments && slackMessage.attachments[0] && slackMessage.attachments[0].text) {
          rocketMsgObj = {
            rid: rocketChannel._id,
            t: 'message_pinned',
            msg: '',
            u: {
              _id: rocketUser._id,
              username: rocketUser.username
            },
            attachments: [{
              'text': this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.attachments[0].text),
              'author_name': slackMessage.attachments[0].author_subname,
              'author_icon': getAvatarUrlFromUsername(slackMessage.attachments[0].author_subname),
              'ts': new Date(parseInt(slackMessage.attachments[0].ts.split('.')[0]) * 1000)
            }]
          };

          if (!isImporting) {
            RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${slackMessage.attachments[0].channel_id}-${slackMessage.attachments[0].ts.replace(/\./g, '-')}`, rocketMsgObj.u, true, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000));
          }

          return rocketMsgObj;
        } else {
          logger.class.error('Pinned item with no attachment');
        }

        return;

      case 'unpinned_item':
        logger.class.error('Unpinned item not implemented');
        return;
    }
  }
  /**
  Uploads the file to the storage.
  @param [Object] details an object with details about the upload. name, size, type, and rid
  @param [String] fileUrl url of the file to download/import
  @param [Object] user the Rocket.Chat user
  @param [Object] room the Rocket.Chat room
  @param [Date] timeStamp the timestamp the file was uploaded
  **/
  //details, slackMessage.file.url_private_download, rocketUser, rocketChannel, new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000), isImporting);


  uploadFileFromSlack(details, slackFileURL, rocketUser, rocketChannel, timeStamp, isImporting) {
    const requestModule = /https/i.test(slackFileURL) ? https : http;
    const parsedUrl = url.parse(slackFileURL, true);
    parsedUrl.headers = {
      'Authorization': `Bearer ${this.apiToken}`
    };
    requestModule.get(parsedUrl, Meteor.bindEnvironment(stream => {
      const fileStore = FileUpload.getStore('Uploads');
      fileStore.insert(details, stream, (err, file) => {
        if (err) {
          throw new Error(err);
        } else {
          const url = file.url.replace(Meteor.absoluteUrl(), '/');
          const attachment = {
            title: file.name,
            title_link: url
          };

          if (/^image\/.+/.test(file.type)) {
            attachment.image_url = url;
            attachment.image_type = file.type;
            attachment.image_size = file.size;
            attachment.image_dimensions = file.identify && file.identify.size;
          }

          if (/^audio\/.+/.test(file.type)) {
            attachment.audio_url = url;
            attachment.audio_type = file.type;
            attachment.audio_size = file.size;
          }

          if (/^video\/.+/.test(file.type)) {
            attachment.video_url = url;
            attachment.video_type = file.type;
            attachment.video_size = file.size;
          }

          const msg = {
            rid: details.rid,
            ts: timeStamp,
            msg: '',
            file: {
              _id: file._id
            },
            groupable: false,
            attachments: [attachment]
          };

          if (isImporting) {
            msg.imported = 'slackbridge';
          }

          if (details.message_id && typeof details.message_id === 'string') {
            msg['_id'] = details.message_id;
          }

          return RocketChat.sendMessage(rocketUser, msg, rocketChannel, true);
        }
      });
    }));
  }

  registerForRocketEvents() {
    RocketChat.callbacks.add('afterSaveMessage', this.onRocketMessage.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Out');
    RocketChat.callbacks.add('afterDeleteMessage', this.onRocketMessageDelete.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_Delete');
    RocketChat.callbacks.add('setReaction', this.onRocketSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_SetReaction');
    RocketChat.callbacks.add('unsetReaction', this.onRocketUnSetReaction.bind(this), RocketChat.callbacks.priority.LOW, 'SlackBridge_UnSetReaction');
  }

  unregisterForRocketEvents() {
    RocketChat.callbacks.remove('afterSaveMessage', 'SlackBridge_Out');
    RocketChat.callbacks.remove('afterDeleteMessage', 'SlackBridge_Delete');
    RocketChat.callbacks.remove('setReaction', 'SlackBridge_SetReaction');
    RocketChat.callbacks.remove('unsetReaction', 'SlackBridge_UnSetReaction');
  }

  registerForSlackEvents() {
    const CLIENT_EVENTS = this.slackClient.CLIENT_EVENTS;
    this.rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, () => {
      logger.connection.info('Connected to Slack');
    });
    this.rtm.on(CLIENT_EVENTS.RTM.UNABLE_TO_RTM_START, () => {
      this.disconnect();
    });
    this.rtm.on(CLIENT_EVENTS.RTM.DISCONNECT, () => {
      this.disconnect();
    });
    const RTM_EVENTS = this.slackClient.RTM_EVENTS;
    /**
    * Event fired when someone messages a channel the bot is in
    * {
    *	type: 'message',
    * 	channel: [channel_id],
    * 	user: [user_id],
    * 	text: [message],
    * 	ts: [ts.milli],
    * 	team: [team_id],
    * 	subtype: [message_subtype],
    * 	inviter: [message_subtype = 'group_join|channel_join' -> user_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.MESSAGE, Meteor.bindEnvironment(slackMessage => {
      logger.events.debug('OnSlackEvent-MESSAGE: ', slackMessage);

      if (slackMessage) {
        this.onSlackMessage(slackMessage);
      }
    }));
    this.rtm.on(RTM_EVENTS.REACTION_ADDED, Meteor.bindEnvironment(reactionMsg => {
      logger.events.debug('OnSlackEvent-REACTION_ADDED: ', reactionMsg);

      if (reactionMsg) {
        this.onSlackReactionAdded(reactionMsg);
      }
    }));
    this.rtm.on(RTM_EVENTS.REACTION_REMOVED, Meteor.bindEnvironment(reactionMsg => {
      logger.events.debug('OnSlackEvent-REACTION_REMOVED: ', reactionMsg);

      if (reactionMsg) {
        this.onSlackReactionRemoved(reactionMsg);
      }
    }));
    /**
    * Event fired when someone creates a public channel
    * {
    *	type: 'channel_created',
    *	channel: {
    *		id: [channel_id],
    *		is_channel: true,
    *		name: [channel_name],
    *		created: [ts],
    *		creator: [user_id],
    *		is_shared: false,
    *		is_org_shared: false
    *	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_CREATED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot joins a public channel
    * {
    * 	type: 'channel_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_general: false,
    * 		is_member: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_JOINED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot leaves (or is removed from) a public channel
    * {
    * 	type: 'channel_left',
    * 	channel: [channel_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_LEFT, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when an archived channel is deleted by an admin
    * {
    * 	type: 'channel_deleted',
    * 	channel: [channel_id],
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_DELETED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the channel has its name changed
    * {
    * 	type: 'channel_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_channel: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.CHANNEL_RENAME, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot joins a private channel
    * {
    * 	type: 'group_joined',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts],
    * 		creator: [user_id],
    * 		is_archived: false,
    * 		is_mpim: false,
    * 		is_open: true,
    * 		last_read: [ts.milli],
    * 		latest: [message_obj],
    * 		unread_count: 0,
    * 		unread_count_display: 0,
    * 		members: [ user_ids ],
    * 		topic: {
    * 			value: [channel_topic],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		},
    * 		purpose: {
    * 			value: [channel_purpose],
    * 			creator: [user_id],
    * 			last_set: 0
    * 		}
    * 	}
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_JOINED, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the bot leaves (or is removed from) a private channel
    * {
    * 	type: 'group_left',
    * 	channel: [channel_id]
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_LEFT, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when the private channel has its name changed
    * {
    * 	type: 'group_rename',
    * 	channel: {
    * 		id: [channel_id],
    * 		name: [channel_name],
    * 		is_group: true,
    * 		created: [ts]
    * 	},
    *	event_ts: [ts.milli]
    * }
    **/

    this.rtm.on(RTM_EVENTS.GROUP_RENAME, Meteor.bindEnvironment(() => {}));
    /**
    * Event fired when a new user joins the team
    * {
    * 	type: 'team_join',
    * 	user:
    * 	{
    * 		id: [user_id],
    * 		team_id: [team_id],
    * 		name: [user_name],
    * 		deleted: false,
    * 		status: null,
    * 		color: [color_code],
    * 		real_name: '',
    * 		tz: [timezone],
    * 		tz_label: [timezone_label],
    * 		tz_offset: [timezone_offset],
    * 		profile:
    * 		{
    * 			avatar_hash: '',
    * 			real_name: '',
    * 			real_name_normalized: '',
    * 			email: '',
    * 			image_24: '',
    * 			image_32: '',
    * 			image_48: '',
    * 			image_72: '',
    * 			image_192: '',
    * 			image_512: '',
    * 			fields: null
    * 		},
    * 		is_admin: false,
    * 		is_owner: false,
    * 		is_primary_owner: false,
    * 		is_restricted: false,
    * 		is_ultra_restricted: false,
    * 		is_bot: false,
    * 		presence: [user_presence]
    * 	},
    * 	cache_ts: [ts]
    * }
    **/

    this.rtm.on(RTM_EVENTS.TEAM_JOIN, Meteor.bindEnvironment(() => {}));
  }

  findSlackChannel(rocketChannelName) {
    logger.class.debug('Searching for Slack channel or group', rocketChannelName);
    let response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const channel of response.data.channels) {
        if (channel.name === rocketChannelName && channel.is_member === true) {
          return channel;
        }
      }
    }

    response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const group of response.data.groups) {
        if (group.name === rocketChannelName) {
          return group;
        }
      }
    }
  }

  importFromHistory(family, options) {
    logger.class.debug('Importing messages history');
    const response = HTTP.get(`https://slack.com/api/${family}.history`, {
      params: _.extend({
        token: this.apiToken
      }, options)
    });

    if (response && response.data && _.isArray(response.data.messages) && response.data.messages.length > 0) {
      let latest = 0;

      for (const message of response.data.messages.reverse()) {
        logger.class.debug('MESSAGE: ', message);

        if (!latest || message.ts > latest) {
          latest = message.ts;
        }

        message.channel = options.channel;
        this.onSlackMessage(message, true);
      }

      return {
        has_more: response.data.has_more,
        ts: latest
      };
    }
  }

  copySlackChannelInfo(rid, channelMap) {
    logger.class.debug('Copying users from Slack channel to Rocket.Chat', channelMap.id, rid);
    const response = HTTP.get(`https://slack.com/api/${channelMap.family}.info`, {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data) {
      const data = channelMap.family === 'channels' ? response.data.channel : response.data.group;

      if (data && _.isArray(data.members) && data.members.length > 0) {
        for (const member of data.members) {
          const user = this.findRocketUser(member) || this.addRocketUser(member);

          if (user) {
            logger.class.debug('Adding user to room', user.username, rid);
            RocketChat.addUserToRoom(rid, user, null, true);
          }
        }
      }

      let topic = '';
      let topic_last_set = 0;
      let topic_creator = null;

      if (data && data.topic && data.topic.value) {
        topic = data.topic.value;
        topic_last_set = data.topic.last_set;
        topic_creator = data.topic.creator;
      }

      if (data && data.purpose && data.purpose.value) {
        if (topic_last_set) {
          if (topic_last_set < data.purpose.last_set) {
            topic = data.purpose.topic;
            topic_creator = data.purpose.creator;
          }
        } else {
          topic = data.purpose.topic;
          topic_creator = data.purpose.creator;
        }
      }

      if (topic) {
        const creator = this.findRocketUser(topic_creator) || this.addRocketUser(topic_creator);
        logger.class.debug('Setting room topic', rid, topic, creator.username);
        RocketChat.saveRoomTopic(rid, topic, creator, false);
      }
    }
  }

  copyPins(rid, channelMap) {
    const response = HTTP.get('https://slack.com/api/pins.list', {
      params: {
        token: this.apiToken,
        channel: channelMap.id
      }
    });

    if (response && response.data && _.isArray(response.data.items) && response.data.items.length > 0) {
      for (const pin of response.data.items) {
        if (pin.message) {
          const user = this.findRocketUser(pin.message.user);
          const msgObj = {
            rid,
            t: 'message_pinned',
            msg: '',
            u: {
              _id: user._id,
              username: user.username
            },
            attachments: [{
              'text': this.convertSlackMsgTxtToRocketTxtFormat(pin.message.text),
              'author_name': user.username,
              'author_icon': getAvatarUrlFromUsername(user.username),
              'ts': new Date(parseInt(pin.message.ts.split('.')[0]) * 1000)
            }]
          };
          RocketChat.models.Messages.setPinnedByIdAndUserId(`slack-${pin.channel}-${pin.message.ts.replace(/\./g, '-')}`, msgObj.u, true, new Date(parseInt(pin.message.ts.split('.')[0]) * 1000));
        }
      }
    }
  }

  importMessages(rid, callback) {
    logger.class.info('importMessages: ', rid);
    const rocketchat_room = RocketChat.models.Rooms.findOneById(rid);

    if (rocketchat_room) {
      if (this.slackChannelMap[rid]) {
        this.copySlackChannelInfo(rid, this.slackChannelMap[rid]);
        logger.class.debug('Importing messages from Slack to Rocket.Chat', this.slackChannelMap[rid], rid);
        let results = this.importFromHistory(this.slackChannelMap[rid].family, {
          channel: this.slackChannelMap[rid].id,
          oldest: 1
        });

        while (results && results.has_more) {
          results = this.importFromHistory(this.slackChannelMap[rid].family, {
            channel: this.slackChannelMap[rid].id,
            oldest: results.ts
          });
        }

        logger.class.debug('Pinning Slack channel messages to Rocket.Chat', this.slackChannelMap[rid], rid);
        this.copyPins(rid, this.slackChannelMap[rid]);
        return callback();
      } else {
        const slack_room = this.findSlackChannel(rocketchat_room.name);

        if (slack_room) {
          this.slackChannelMap[rid] = {
            id: slack_room.id,
            family: slack_room.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
          return this.importMessages(rid, callback);
        } else {
          logger.class.error('Could not find Slack room with specified name', rocketchat_room.name);
          return callback(new Meteor.Error('error-slack-room-not-found', 'Could not find Slack room with specified name'));
        }
      }
    } else {
      logger.class.error('Could not find Rocket.Chat room with specified id', rid);
      return callback(new Meteor.Error('error-invalid-room', 'Invalid room'));
    }
  }

  populateSlackChannelMap() {
    logger.class.debug('Populating channel map');
    let response = HTTP.get('https://slack.com/api/channels.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.channels) && response.data.channels.length > 0) {
      for (const slackChannel of response.data.channels) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackChannel.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          this.slackChannelMap[rocketchat_room._id] = {
            id: slackChannel.id,
            family: slackChannel.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
        }
      }
    }

    response = HTTP.get('https://slack.com/api/groups.list', {
      params: {
        token: this.apiToken
      }
    });

    if (response && response.data && _.isArray(response.data.groups) && response.data.groups.length > 0) {
      for (const slackGroup of response.data.groups) {
        const rocketchat_room = RocketChat.models.Rooms.findOneByName(slackGroup.name, {
          fields: {
            _id: 1
          }
        });

        if (rocketchat_room) {
          this.slackChannelMap[rocketchat_room._id] = {
            id: slackGroup.id,
            family: slackGroup.id.charAt(0) === 'C' ? 'channels' : 'groups'
          };
        }
      }
    }
  }

  onRocketMessageDelete(rocketMessageDeleted) {
    logger.class.debug('onRocketMessageDelete', rocketMessageDeleted);
    this.postDeleteMessageToSlack(rocketMessageDeleted);
  }

  onRocketSetReaction(rocketMsgID, reaction) {
    logger.class.debug('onRocketSetReaction');

    if (rocketMsgID && reaction) {
      if (this.reactionsMap.delete(`set${rocketMsgID}${reaction}`)) {
        //This was a Slack reaction, we don't need to tell Slack about it
        return;
      }

      const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

      if (rocketMsg) {
        const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
        const slackTS = this.getSlackTS(rocketMsg);
        this.postReactionAddedToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
      }
    }
  }

  onRocketUnSetReaction(rocketMsgID, reaction) {
    logger.class.debug('onRocketUnSetReaction');

    if (rocketMsgID && reaction) {
      if (this.reactionsMap.delete(`unset${rocketMsgID}${reaction}`)) {
        //This was a Slack unset reaction, we don't need to tell Slack about it
        return;
      }

      const rocketMsg = RocketChat.models.Messages.findOneById(rocketMsgID);

      if (rocketMsg) {
        const slackChannel = this.slackChannelMap[rocketMsg.rid].id;
        const slackTS = this.getSlackTS(rocketMsg);
        this.postReactionRemoveToSlack(reaction.replace(/:/g, ''), slackChannel, slackTS);
      }
    }
  }

  onRocketMessage(rocketMessage) {
    logger.class.debug('onRocketMessage', rocketMessage);

    if (rocketMessage.editedAt) {
      //This is an Edit Event
      this.processRocketMessageChanged(rocketMessage);
      return rocketMessage;
    } // Ignore messages originating from Slack


    if (rocketMessage._id.indexOf('slack-') === 0) {
      return rocketMessage;
    } //Probably a new message from Rocket.Chat


    const outSlackChannels = RocketChat.settings.get('SlackBridge_Out_All') ? _.keys(this.slackChannelMap) : _.pluck(RocketChat.settings.get('SlackBridge_Out_Channels'), '_id') || []; //logger.class.debug('Out SlackChannels: ', outSlackChannels);

    if (outSlackChannels.indexOf(rocketMessage.rid) !== -1) {
      this.postMessageToSlack(this.slackChannelMap[rocketMessage.rid], rocketMessage);
    }

    return rocketMessage;
  }
  /*
   https://api.slack.com/methods/reactions.add
   */


  postReactionAddedToSlack(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.class.debug('Posting Add Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.add', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Reaction added to Slack');
      }
    }
  }
  /*
   https://api.slack.com/methods/reactions.remove
   */


  postReactionRemoveToSlack(reaction, slackChannel, slackTS) {
    if (reaction && slackChannel && slackTS) {
      const data = {
        token: this.apiToken,
        name: reaction,
        channel: slackChannel,
        timestamp: slackTS
      };
      logger.class.debug('Posting Remove Reaction to Slack');
      const postResult = HTTP.post('https://slack.com/api/reactions.remove', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Reaction removed from Slack');
      }
    }
  }

  postDeleteMessageToSlack(rocketMessage) {
    if (rocketMessage) {
      const data = {
        token: this.apiToken,
        ts: this.getSlackTS(rocketMessage),
        channel: this.slackChannelMap[rocketMessage.rid].id,
        as_user: true
      };
      logger.class.debug('Post Delete Message to Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.delete', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Message deleted on Slack');
      }
    }
  }

  postMessageToSlack(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      let iconUrl = getAvatarUrlFromUsername(rocketMessage.u && rocketMessage.u.username);

      if (iconUrl) {
        iconUrl = Meteor.absoluteUrl().replace(/\/$/, '') + iconUrl;
      }

      const data = {
        token: this.apiToken,
        text: rocketMessage.msg,
        channel: slackChannel.id,
        username: rocketMessage.u && rocketMessage.u.username,
        icon_url: iconUrl,
        link_names: 1
      };
      logger.class.debug('Post Message To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.postMessage', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.message && postResult.data.message.bot_id && postResult.data.message.ts) {
        RocketChat.models.Messages.setSlackBotIdAndSlackTs(rocketMessage._id, postResult.data.message.bot_id, postResult.data.message.ts);
        logger.class.debug(`RocketMsgID=${rocketMessage._id} SlackMsgID=${postResult.data.message.ts} SlackBotID=${postResult.data.message.bot_id}`);
      }
    }
  }
  /*
   https://api.slack.com/methods/chat.update
   */


  postMessageUpdateToSlack(slackChannel, rocketMessage) {
    if (slackChannel && slackChannel.id) {
      const data = {
        token: this.apiToken,
        ts: this.getSlackTS(rocketMessage),
        channel: slackChannel.id,
        text: rocketMessage.msg,
        as_user: true
      };
      logger.class.debug('Post UpdateMessage To Slack', data);
      const postResult = HTTP.post('https://slack.com/api/chat.update', {
        params: data
      });

      if (postResult.statusCode === 200 && postResult.data && postResult.data.ok === true) {
        logger.class.debug('Message updated on Slack');
      }
    }
  }

  processRocketMessageChanged(rocketMessage) {
    if (rocketMessage) {
      if (rocketMessage.updatedBySlack) {
        //We have already processed this
        delete rocketMessage.updatedBySlack;
        return;
      } //This was a change from Rocket.Chat


      const slackChannel = this.slackChannelMap[rocketMessage.rid];
      this.postMessageUpdateToSlack(slackChannel, rocketMessage);
    }
  }
  /*
   https://api.slack.com/events/message/message_deleted
   */


  processSlackMessageDeleted(slackMessage) {
    if (slackMessage.previous_message) {
      const rocketChannel = this.getRocketChannel(slackMessage);
      const rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });

      if (rocketChannel && rocketUser) {
        //Find the Rocket message to delete
        let rocketMsgObj = RocketChat.models.Messages.findOneBySlackBotIdAndSlackTs(slackMessage.previous_message.bot_id, slackMessage.previous_message.ts);

        if (!rocketMsgObj) {
          //Must have been a Slack originated msg
          const _id = this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts);

          rocketMsgObj = RocketChat.models.Messages.findOneById(_id);
        }

        if (rocketMsgObj) {
          RocketChat.deleteMessage(rocketMsgObj, rocketUser);
          logger.class.debug('Rocket message deleted by Slack');
        }
      }
    }
  }
  /*
   https://api.slack.com/events/message/message_changed
   */


  processSlackMessageChanged(slackMessage) {
    if (slackMessage.previous_message) {
      const currentMsg = RocketChat.models.Messages.findOneById(this.createRocketID(slackMessage.channel, slackMessage.message.ts)); //Only process this change, if its an actual update (not just Slack repeating back our Rocket original change)

      if (currentMsg && slackMessage.message.text !== currentMsg.msg) {
        const rocketChannel = this.getRocketChannel(slackMessage);
        const rocketUser = slackMessage.previous_message.user ? this.findRocketUser(slackMessage.previous_message.user) || this.addRocketUser(slackMessage.previous_message.user) : null;
        const rocketMsgObj = {
          //@TODO _id
          _id: this.createRocketID(slackMessage.channel, slackMessage.previous_message.ts),
          rid: rocketChannel._id,
          msg: this.convertSlackMsgTxtToRocketTxtFormat(slackMessage.message.text),
          updatedBySlack: true //We don't want to notify slack about this change since Slack initiated it

        };
        RocketChat.updateMessage(rocketMsgObj, rocketUser);
        logger.class.debug('Rocket message updated by Slack');
      }
    }
  }
  /*
   This method will get refactored and broken down into single responsibilities
   */


  processSlackNewMessage(slackMessage, isImporting) {
    const rocketChannel = this.getRocketChannel(slackMessage);
    let rocketUser = null;

    if (slackMessage.subtype === 'bot_message') {
      rocketUser = RocketChat.models.Users.findOneById('rocket.cat', {
        fields: {
          username: 1
        }
      });
    } else {
      rocketUser = slackMessage.user ? this.findRocketUser(slackMessage.user) || this.addRocketUser(slackMessage.user) : null;
    }

    if (rocketChannel && rocketUser) {
      const msgDataDefaults = {
        _id: this.createRocketID(slackMessage.channel, slackMessage.ts),
        ts: new Date(parseInt(slackMessage.ts.split('.')[0]) * 1000)
      };

      if (isImporting) {
        msgDataDefaults['imported'] = 'slackbridge';
      }

      try {
        this.createAndSaveRocketMessage(rocketChannel, rocketUser, slackMessage, msgDataDefaults, isImporting);
      } catch (e) {
        // http://www.mongodb.org/about/contributors/error-codes/
        // 11000 == duplicate key error
        if (e.name === 'MongoError' && e.code === 11000) {
          return;
        }

        throw e;
      }
    }
  }
  /**
   * Retrieves the Slack TS from a Rocket msg that originated from Slack
   * @param rocketMsg
   * @returns Slack TS or undefined if not a message that originated from slack
   * @private
   */


  getSlackTS(rocketMsg) {
    //slack-G3KJGGE15-1483081061-000169
    let slackTS;

    let index = rocketMsg._id.indexOf('slack-');

    if (index === 0) {
      //This is a msg that originated from Slack
      slackTS = rocketMsg._id.substr(6, rocketMsg._id.length);
      index = slackTS.indexOf('-');
      slackTS = slackTS.substr(index + 1, slackTS.length);
      slackTS = slackTS.replace('-', '.');
    } else {
      //This probably originated as a Rocket msg, but has been sent to Slack
      slackTS = rocketMsg.slackTs;
    }

    return slackTS;
  }

  getRocketChannel(slackMessage) {
    return slackMessage.channel ? this.findRocketChannel(slackMessage.channel) || this.addRocketChannel(slackMessage.channel) : null;
  }

  getRocketUser(slackUser) {
    return slackUser ? this.findRocketUser(slackUser) || this.addRocketUser(slackUser) : null;
  }

  createRocketID(slackChannel, ts) {
    return `slack-${slackChannel}-${ts.replace(/\./g, '-')}`;
  }

}

RocketChat.SlackBridge = new SlackBridge();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"slackbridge_import.server.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_slackbridge/server/slackbridge_import.server.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals msgStream */
function SlackBridgeImport(command, params, item) {
  if (command !== 'slackbridge-import' || !Match.test(params, String)) {
    return;
  }

  const room = RocketChat.models.Rooms.findOneById(item.rid);
  const channel = room.name;
  const user = Meteor.users.findOne(Meteor.userId());
  msgStream.emit(item.rid, {
    _id: Random.id(),
    rid: item.rid,
    u: {
      username: 'rocket.cat'
    },
    ts: new Date(),
    msg: TAPi18n.__('SlackBridge_start', {
      postProcess: 'sprintf',
      sprintf: [user.username, channel]
    }, user.language)
  });

  try {
    RocketChat.SlackBridge.importMessages(item.rid, error => {
      if (error) {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_error', {
            postProcess: 'sprintf',
            sprintf: [channel, error.message]
          }, user.language)
        });
      } else {
        msgStream.emit(item.rid, {
          _id: Random.id(),
          rid: item.rid,
          u: {
            username: 'rocket.cat'
          },
          ts: new Date(),
          msg: TAPi18n.__('SlackBridge_finish', {
            postProcess: 'sprintf',
            sprintf: [channel]
          }, user.language)
        });
      }
    });
  } catch (error) {
    msgStream.emit(item.rid, {
      _id: Random.id(),
      rid: item.rid,
      u: {
        username: 'rocket.cat'
      },
      ts: new Date(),
      msg: TAPi18n.__('SlackBridge_error', {
        postProcess: 'sprintf',
        sprintf: [channel, error.message]
      }, user.language)
    });
    throw error;
  }

  return SlackBridgeImport;
}

RocketChat.slashCommands.add('slackbridge-import', SlackBridgeImport);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:slackbridge/server/logger.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/settings.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge.js");
require("/node_modules/meteor/rocketchat:slackbridge/server/slackbridge_import.server.js");

/* Exports */
Package._define("rocketchat:slackbridge");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_slackbridge.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvbG9nZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OnNsYWNrYnJpZGdlL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbGFja2JyaWRnZS9zZXJ2ZXIvc2xhY2ticmlkZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c2xhY2ticmlkZ2Uvc2VydmVyL3NsYWNrYnJpZGdlX2ltcG9ydC5zZXJ2ZXIuanMiXSwibmFtZXMiOlsibG9nZ2VyIiwiTG9nZ2VyIiwic2VjdGlvbnMiLCJjb25uZWN0aW9uIiwiZXZlbnRzIiwiY2xhc3MiLCJNZXRlb3IiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiYWRkR3JvdXAiLCJhZGQiLCJ0eXBlIiwiaTE4bkxhYmVsIiwicHVibGljIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsImkxOG5EZXNjcmlwdGlvbiIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInV0aWwiLCJ1cmwiLCJodHRwIiwiaHR0cHMiLCJTbGFja0JyaWRnZSIsImNvbnN0cnVjdG9yIiwic2xhY2tDbGllbnQiLCJhcGlUb2tlbiIsImdldCIsImFsaWFzRm9ybWF0IiwiZXhjbHVkZUJvdG5hbWVzIiwicnRtIiwiY29ubmVjdGVkIiwidXNlclRhZ3MiLCJzbGFja0NoYW5uZWxNYXAiLCJyZWFjdGlvbnNNYXAiLCJNYXAiLCJrZXkiLCJkaXNjb25uZWN0IiwiY29ubmVjdCIsImluZm8iLCJSdG1DbGllbnQiLCJzdGFydCIsInJlZ2lzdGVyRm9yU2xhY2tFdmVudHMiLCJyZWdpc3RlckZvclJvY2tldEV2ZW50cyIsInVucmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMiLCJwb3B1bGF0ZVNsYWNrQ2hhbm5lbE1hcCIsImVyciIsImVycm9yIiwiY29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQiLCJzbGFja01zZ1R4dCIsImlzRW1wdHkiLCJyZXBsYWNlIiwibWF0Y2giLCJ1c2VySWQiLCJmaW5kUm9ja2V0VXNlciIsImFkZFJvY2tldFVzZXIiLCJzbGFjayIsInJvY2tldCIsImZpbmRSb2NrZXRDaGFubmVsIiwic2xhY2tDaGFubmVsSWQiLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUltcG9ydElkIiwiYWRkUm9ja2V0Q2hhbm5lbCIsInNsYWNrQ2hhbm5lbElEIiwiaGFzUmV0cmllZCIsImRlYnVnIiwic2xhY2tSZXN1bHRzIiwiaXNHcm91cCIsImNoYXJBdCIsIkhUVFAiLCJwYXJhbXMiLCJ0b2tlbiIsImNoYW5uZWwiLCJkYXRhIiwib2siLCJyb2NrZXRDaGFubmVsRGF0YSIsImdyb3VwIiwiZXhpc3RpbmdSb2NrZXRSb29tIiwiZmluZE9uZUJ5TmFtZSIsIm5hbWUiLCJpc19nZW5lcmFsIiwicm9ja2V0SWQiLCJhZGRJbXBvcnRJZHMiLCJpZCIsInJvY2tldFVzZXJzIiwibWVtYmVyIiwibWVtYmVycyIsImNyZWF0b3IiLCJyb2NrZXRVc2VyIiwidXNlcm5hbWUiLCJwdXNoIiwicm9ja2V0VXNlckNyZWF0b3IiLCJyb2NrZXRDaGFubmVsIiwiY3JlYXRlUm9vbSIsInJpZCIsImUiLCJtZXNzYWdlIiwiX3NsZWVwRm9yTXMiLCJjb25zb2xlIiwibG9nIiwicm9vbVVwZGF0ZSIsInRzIiwiRGF0ZSIsImNyZWF0ZWQiLCJsYXN0U2V0VG9waWMiLCJ0b3BpYyIsImxhc3Rfc2V0IiwicHVycG9zZSIsImZhbWlseSIsImZpbmRPbmVCeUlkIiwic2xhY2tVc2VySUQiLCJVc2VycyIsInVzZXIiLCJyb2NrZXRVc2VyRGF0YSIsImlzQm90IiwiaXNfYm90IiwiZW1haWwiLCJwcm9maWxlIiwiZXhpc3RpbmdSb2NrZXRVc2VyIiwiZmluZE9uZUJ5RW1haWxBZGRyZXNzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJuZXdVc2VyIiwicGFzc3dvcmQiLCJSYW5kb20iLCJqb2luRGVmYXVsdENoYW5uZWxzIiwiQWNjb3VudHMiLCJjcmVhdGVVc2VyIiwidXNlclVwZGF0ZSIsInV0Y09mZnNldCIsInR6X29mZnNldCIsInJvbGVzIiwicmVhbF9uYW1lIiwiZGVsZXRlZCIsInVwZGF0ZSIsIiRzZXQiLCJpbWFnZV9vcmlnaW5hbCIsImltYWdlXzUxMiIsInNldFVzZXJBdmF0YXIiLCJpbXBvcnRJZHMiLCJib3RfaWQiLCJhZGRBbGlhc1RvUm9ja2V0TXNnIiwicm9ja2V0VXNlck5hbWUiLCJyb2NrZXRNc2dPYmoiLCJhbGlhcyIsImZvcm1hdCIsImNyZWF0ZUFuZFNhdmVSb2NrZXRNZXNzYWdlIiwic2xhY2tNZXNzYWdlIiwicm9ja2V0TXNnRGF0YURlZmF1bHRzIiwiaXNJbXBvcnRpbmciLCJzdWJ0eXBlIiwicHJvY2Vzc1NsYWNrU3VidHlwZWRNZXNzYWdlIiwibXNnIiwidGV4dCIsInUiLCJleHRlbmQiLCJlZGl0ZWQiLCJlZGl0ZWRBdCIsInBhcnNlSW50Iiwic3BsaXQiLCJmaWVsZHMiLCJwaW5uZWRfdG8iLCJpbmRleE9mIiwicGlubmVkIiwicGlubmVkQXQiLCJub3ciLCJwaW5uZWRCeSIsInBpY2siLCJzZXRUaW1lb3V0IiwiTWVzc2FnZXMiLCJmaW5kT25lQnlTbGFja0JvdElkQW5kU2xhY2tUcyIsInNlbmRNZXNzYWdlIiwib25TbGFja1JlYWN0aW9uUmVtb3ZlZCIsInNsYWNrUmVhY3Rpb25Nc2ciLCJnZXRSb2NrZXRVc2VyIiwicm9ja2V0TXNnIiwiZmluZE9uZUJ5U2xhY2tUcyIsIml0ZW0iLCJyb2NrZXRJRCIsImNyZWF0ZVJvY2tldElEIiwicm9ja2V0UmVhY3Rpb24iLCJyZWFjdGlvbiIsInJlYWN0aW9ucyIsInRoZVJlYWN0aW9uIiwidXNlcm5hbWVzIiwic2V0IiwicnVuQXNVc2VyIiwiY2FsbCIsIm9uU2xhY2tSZWFjdGlvbkFkZGVkIiwiaW5jbHVkZXMiLCJvblNsYWNrTWVzc2FnZSIsInByb2Nlc3NTbGFja01lc3NhZ2VEZWxldGVkIiwicHJvY2Vzc1NsYWNrTWVzc2FnZUNoYW5nZWQiLCJwcm9jZXNzU2xhY2tOZXdNZXNzYWdlIiwidW5kZWZpbmVkIiwiYm90IiwiYXR0YWNobWVudHMiLCJpY29ucyIsImVtb2ppIiwiY3JlYXRlVXNlckpvaW5XaXRoUm9vbUlkQW5kVXNlciIsImltcG9ydGVkIiwiYWRkVXNlclRvUm9vbSIsImludml0ZXIiLCJjcmVhdGVVc2VyQWRkZWRXaXRoUm9vbUlkQW5kVXNlciIsImNyZWF0ZVVzZXJMZWF2ZVdpdGhSb29tSWRBbmRVc2VyIiwicmVtb3ZlVXNlckZyb21Sb29tIiwiY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIiLCJzYXZlUm9vbVRvcGljIiwiY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyIiwic2F2ZVJvb21OYW1lIiwiYXJjaGl2ZVJvb20iLCJ1bmFyY2hpdmVSb29tIiwiZmlsZSIsInVybF9wcml2YXRlX2Rvd25sb2FkIiwiZGV0YWlscyIsIm1lc3NhZ2VfaWQiLCJzaXplIiwibWltZXR5cGUiLCJ1cGxvYWRGaWxlRnJvbVNsYWNrIiwidCIsImF1dGhvcl9zdWJuYW1lIiwiZ2V0QXZhdGFyVXJsRnJvbVVzZXJuYW1lIiwic2V0UGlubmVkQnlJZEFuZFVzZXJJZCIsImNoYW5uZWxfaWQiLCJzbGFja0ZpbGVVUkwiLCJ0aW1lU3RhbXAiLCJyZXF1ZXN0TW9kdWxlIiwidGVzdCIsInBhcnNlZFVybCIsInBhcnNlIiwiaGVhZGVycyIsImJpbmRFbnZpcm9ubWVudCIsInN0cmVhbSIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImluc2VydCIsIkVycm9yIiwiYWJzb2x1dGVVcmwiLCJhdHRhY2htZW50IiwidGl0bGUiLCJ0aXRsZV9saW5rIiwiaW1hZ2VfdXJsIiwiaW1hZ2VfdHlwZSIsImltYWdlX3NpemUiLCJpbWFnZV9kaW1lbnNpb25zIiwiaWRlbnRpZnkiLCJhdWRpb191cmwiLCJhdWRpb190eXBlIiwiYXVkaW9fc2l6ZSIsInZpZGVvX3VybCIsInZpZGVvX3R5cGUiLCJ2aWRlb19zaXplIiwiZ3JvdXBhYmxlIiwiY2FsbGJhY2tzIiwib25Sb2NrZXRNZXNzYWdlIiwiYmluZCIsInByaW9yaXR5IiwiTE9XIiwib25Sb2NrZXRNZXNzYWdlRGVsZXRlIiwib25Sb2NrZXRTZXRSZWFjdGlvbiIsIm9uUm9ja2V0VW5TZXRSZWFjdGlvbiIsInJlbW92ZSIsIkNMSUVOVF9FVkVOVFMiLCJvbiIsIlJUTSIsIkFVVEhFTlRJQ0FURUQiLCJVTkFCTEVfVE9fUlRNX1NUQVJUIiwiRElTQ09OTkVDVCIsIlJUTV9FVkVOVFMiLCJNRVNTQUdFIiwiUkVBQ1RJT05fQURERUQiLCJyZWFjdGlvbk1zZyIsIlJFQUNUSU9OX1JFTU9WRUQiLCJDSEFOTkVMX0NSRUFURUQiLCJDSEFOTkVMX0pPSU5FRCIsIkNIQU5ORUxfTEVGVCIsIkNIQU5ORUxfREVMRVRFRCIsIkNIQU5ORUxfUkVOQU1FIiwiR1JPVVBfSk9JTkVEIiwiR1JPVVBfTEVGVCIsIkdST1VQX1JFTkFNRSIsIlRFQU1fSk9JTiIsImZpbmRTbGFja0NoYW5uZWwiLCJyb2NrZXRDaGFubmVsTmFtZSIsInJlc3BvbnNlIiwiaXNBcnJheSIsImNoYW5uZWxzIiwibGVuZ3RoIiwiaXNfbWVtYmVyIiwiZ3JvdXBzIiwiaW1wb3J0RnJvbUhpc3RvcnkiLCJvcHRpb25zIiwibWVzc2FnZXMiLCJsYXRlc3QiLCJyZXZlcnNlIiwiaGFzX21vcmUiLCJjb3B5U2xhY2tDaGFubmVsSW5mbyIsImNoYW5uZWxNYXAiLCJ0b3BpY19sYXN0X3NldCIsInRvcGljX2NyZWF0b3IiLCJjb3B5UGlucyIsIml0ZW1zIiwicGluIiwibXNnT2JqIiwiaW1wb3J0TWVzc2FnZXMiLCJjYWxsYmFjayIsInJvY2tldGNoYXRfcm9vbSIsInJlc3VsdHMiLCJvbGRlc3QiLCJzbGFja19yb29tIiwic2xhY2tDaGFubmVsIiwic2xhY2tHcm91cCIsInJvY2tldE1lc3NhZ2VEZWxldGVkIiwicG9zdERlbGV0ZU1lc3NhZ2VUb1NsYWNrIiwicm9ja2V0TXNnSUQiLCJkZWxldGUiLCJzbGFja1RTIiwiZ2V0U2xhY2tUUyIsInBvc3RSZWFjdGlvbkFkZGVkVG9TbGFjayIsInBvc3RSZWFjdGlvblJlbW92ZVRvU2xhY2siLCJyb2NrZXRNZXNzYWdlIiwicHJvY2Vzc1JvY2tldE1lc3NhZ2VDaGFuZ2VkIiwib3V0U2xhY2tDaGFubmVscyIsImtleXMiLCJwbHVjayIsInBvc3RNZXNzYWdlVG9TbGFjayIsInRpbWVzdGFtcCIsInBvc3RSZXN1bHQiLCJwb3N0Iiwic3RhdHVzQ29kZSIsImFzX3VzZXIiLCJpY29uVXJsIiwiaWNvbl91cmwiLCJsaW5rX25hbWVzIiwic2V0U2xhY2tCb3RJZEFuZFNsYWNrVHMiLCJwb3N0TWVzc2FnZVVwZGF0ZVRvU2xhY2siLCJ1cGRhdGVkQnlTbGFjayIsInByZXZpb3VzX21lc3NhZ2UiLCJnZXRSb2NrZXRDaGFubmVsIiwiZGVsZXRlTWVzc2FnZSIsImN1cnJlbnRNc2ciLCJ1cGRhdGVNZXNzYWdlIiwibXNnRGF0YURlZmF1bHRzIiwiY29kZSIsImluZGV4Iiwic3Vic3RyIiwic2xhY2tUcyIsInNsYWNrVXNlciIsIlNsYWNrQnJpZGdlSW1wb3J0IiwiY29tbWFuZCIsIk1hdGNoIiwiU3RyaW5nIiwicm9vbSIsInVzZXJzIiwiZmluZE9uZSIsIm1zZ1N0cmVhbSIsImVtaXQiLCJUQVBpMThuIiwiX18iLCJwb3N0UHJvY2VzcyIsInNwcmludGYiLCJsYW5ndWFnZSIsInNsYXNoQ29tbWFuZHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFDQTtBQUVBQSxTQUFTLElBQUlDLE1BQUosQ0FBVyxhQUFYLEVBQTBCO0FBQ2xDQyxZQUFVO0FBQ1RDLGdCQUFZLFlBREg7QUFFVEMsWUFBUSxRQUZDO0FBR1RDLFdBQU87QUFIRTtBQUR3QixDQUExQixDQUFU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dGVudCI6WyIvKiBnbG9iYWxzIGxvZ2dlcjp0cnVlICovXG4vKiBleHBvcnRlZCBsb2dnZXIgKi9cblxubG9nZ2VyID0gbmV3IExvZ2dlcignU2xhY2tCcmlkZ2UnLCB7XG5cdHNlY3Rpb25zOiB7XG5cdFx0Y29ubmVjdGlvbjogJ0Nvbm5lY3Rpb24nLFxuXHRcdGV2ZW50czogJ0V2ZW50cycsXG5cdFx0Y2xhc3M6ICdDbGFzcydcblx0fVxufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU2xhY2tCcmlkZ2UnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRpMThuTGFiZWw6ICdFbmFibGVkJyxcblx0XHRcdHB1YmxpYzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FQSVRva2VuJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQVBJX1Rva2VuJ1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5hZGQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0aTE4bkxhYmVsOiAnQWxpYXNfRm9ybWF0Jyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0FsaWFzX0Zvcm1hdF9EZXNjcmlwdGlvbidcblx0XHR9KTtcblxuXHRcdHRoaXMuYWRkKCdTbGFja0JyaWRnZV9FeGNsdWRlQm90bmFtZXMnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdTbGFja0JyaWRnZV9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRpMThuTGFiZWw6ICdFeGNsdWRlX0JvdG5hbWVzJyxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ0V4Y2x1ZGVfQm90bmFtZXNfRGVzY3JpcHRpb24nXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH1dXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU2xhY2tCcmlkZ2VfT3V0X0NoYW5uZWxzJywgJycsIHtcblx0XHRcdHR5cGU6ICdyb29tUGljaycsXG5cdFx0XHRlbmFibGVRdWVyeTogW3tcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfRW5hYmxlZCcsXG5cdFx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0XHR9LCB7XG5cdFx0XHRcdF9pZDogJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJyxcblx0XHRcdFx0dmFsdWU6IHRydWVcblx0XHRcdH0sIHtcblx0XHRcdFx0X2lkOiAnU2xhY2tCcmlkZ2VfT3V0X0FsbCcsXG5cdFx0XHRcdHZhbHVlOiBmYWxzZVxuXHRcdFx0fV1cblx0XHR9KTtcblx0fSk7XG59KTtcbiIsIi8qIGdsb2JhbHMgbG9nZ2VyICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jbGFzcyBTbGFja0JyaWRnZSB7XG5cblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy51dGlsID0gdXRpbDtcblx0XHR0aGlzLnNsYWNrQ2xpZW50ID0gcmVxdWlyZSgnc2xhY2stY2xpZW50Jyk7XG5cdFx0dGhpcy5hcGlUb2tlbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9BUElUb2tlbicpO1xuXHRcdHRoaXMuYWxpYXNGb3JtYXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfQWxpYXNGb3JtYXQnKTtcblx0XHR0aGlzLmV4Y2x1ZGVCb3RuYW1lcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9Cb3RuYW1lcycpO1xuXHRcdHRoaXMucnRtID0ge307XG5cdFx0dGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcblx0XHR0aGlzLnVzZXJUYWdzID0ge307XG5cdFx0dGhpcy5zbGFja0NoYW5uZWxNYXAgPSB7fTtcblx0XHR0aGlzLnJlYWN0aW9uc01hcCA9IG5ldyBNYXAoKTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9BUElUb2tlbicsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRpZiAodmFsdWUgIT09IHRoaXMuYXBpVG9rZW4pIHtcblx0XHRcdFx0dGhpcy5hcGlUb2tlbiA9IHZhbHVlO1xuXHRcdFx0XHRpZiAodGhpcy5jb25uZWN0ZWQpIHtcblx0XHRcdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHRcdFx0XHR0aGlzLmNvbm5lY3QoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX0FsaWFzRm9ybWF0JywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdHRoaXMuYWxpYXNGb3JtYXQgPSB2YWx1ZTtcblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9FeGNsdWRlQm90bmFtZXMnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0dGhpcy5leGNsdWRlQm90bmFtZXMgPSB2YWx1ZTtcblx0XHR9KTtcblxuXHRcdFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9FbmFibGVkJywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdGlmICh2YWx1ZSAmJiB0aGlzLmFwaVRva2VuKSB7XG5cdFx0XHRcdHRoaXMuY29ubmVjdCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5kaXNjb25uZWN0KCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRjb25uZWN0KCkge1xuXHRcdGlmICh0aGlzLmNvbm5lY3RlZCA9PT0gZmFsc2UpIHtcblx0XHRcdHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcblx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ0Nvbm5lY3RpbmcgdmlhIHRva2VuOiAnLCB0aGlzLmFwaVRva2VuKTtcblx0XHRcdGNvbnN0IFJ0bUNsaWVudCA9IHRoaXMuc2xhY2tDbGllbnQuUnRtQ2xpZW50O1xuXHRcdFx0dGhpcy5ydG0gPSBuZXcgUnRtQ2xpZW50KHRoaXMuYXBpVG9rZW4pO1xuXHRcdFx0dGhpcy5ydG0uc3RhcnQoKTtcblx0XHRcdHRoaXMucmVnaXN0ZXJGb3JTbGFja0V2ZW50cygpO1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NsYWNrQnJpZGdlX091dF9FbmFibGVkJywgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdFx0dGhpcy5yZWdpc3RlckZvclJvY2tldEV2ZW50cygpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoaXMudW5yZWdpc3RlckZvclJvY2tldEV2ZW50cygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdE1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR0aGlzLnBvcHVsYXRlU2xhY2tDaGFubmVsTWFwKCk7IC8vIElmIHJ1biBvdXRzaWRlIG9mIE1ldGVvci5zdGFydHVwLCBIVFRQIGlzIG5vdCBkZWZpbmVkXG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdGxvZ2dlci5jbGFzcy5lcnJvcignRXJyb3IgYXR0ZW1wdGluZyB0byBjb25uZWN0IHRvIFNsYWNrJywgZXJyKTtcblx0XHRcdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0ZGlzY29ubmVjdCgpIHtcblx0XHRpZiAodGhpcy5jb25uZWN0ZWQgPT09IHRydWUpIHtcblx0XHRcdHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG5cdFx0XHR0aGlzLnJ0bS5kaXNjb25uZWN0ICYmIHRoaXMucnRtLmRpc2Nvbm5lY3QoKTtcblx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ0Rpc2Nvbm5lY3RlZCcpO1xuXHRcdFx0dGhpcy51bnJlZ2lzdGVyRm9yUm9ja2V0RXZlbnRzKCk7XG5cdFx0fVxuXHR9XG5cblx0Y29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQoc2xhY2tNc2dUeHQpIHtcblx0XHRpZiAoIV8uaXNFbXB0eShzbGFja01zZ1R4dCkpIHtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvPCFldmVyeW9uZT4vZywgJ0BhbGwnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvPCFjaGFubmVsPi9nLCAnQGFsbCcpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC88IWhlcmU+L2csICdAaGVyZScpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC8mZ3Q7L2csICc+Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLyZsdDsvZywgJzwnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvJmFtcDsvZywgJyYnKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOnNpbXBsZV9zbWlsZTovZywgJzpzbWlsZTonKTtcblx0XHRcdHNsYWNrTXNnVHh0ID0gc2xhY2tNc2dUeHQucmVwbGFjZSgvOm1lbW86L2csICc6cGVuY2lsOicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC86cGlnZ3k6L2csICc6cGlnOicpO1xuXHRcdFx0c2xhY2tNc2dUeHQgPSBzbGFja01zZ1R4dC5yZXBsYWNlKC86dWs6L2csICc6Z2I6Jyk7XG5cdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UoLzwoaHR0cFtzXT86W14+XSopPi9nLCAnJDEnKTtcblxuXHRcdFx0c2xhY2tNc2dUeHQucmVwbGFjZSgvKD86PEApKFthLXpBLVowLTldKykoPzpcXHwuKyk/KD86PikvZywgKG1hdGNoLCB1c2VySWQpID0+IHtcblx0XHRcdFx0aWYgKCF0aGlzLnVzZXJUYWdzW3VzZXJJZF0pIHtcblx0XHRcdFx0XHR0aGlzLmZpbmRSb2NrZXRVc2VyKHVzZXJJZCkgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKHVzZXJJZCk7IC8vIFRoaXMgYWRkcyB1c2VyVGFncyBmb3IgdGhlIHVzZXJJZFxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IHVzZXJUYWdzID0gdGhpcy51c2VyVGFnc1t1c2VySWRdO1xuXHRcdFx0XHRpZiAodXNlclRhZ3MpIHtcblx0XHRcdFx0XHRzbGFja01zZ1R4dCA9IHNsYWNrTXNnVHh0LnJlcGxhY2UodXNlclRhZ3Muc2xhY2ssIHVzZXJUYWdzLnJvY2tldCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzbGFja01zZ1R4dCA9ICcnO1xuXHRcdH1cblx0XHRyZXR1cm4gc2xhY2tNc2dUeHQ7XG5cdH1cblxuXHRmaW5kUm9ja2V0Q2hhbm5lbChzbGFja0NoYW5uZWxJZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJbXBvcnRJZChzbGFja0NoYW5uZWxJZCk7XG5cdH1cblxuXHRhZGRSb2NrZXRDaGFubmVsKHNsYWNrQ2hhbm5lbElELCBoYXNSZXRyaWVkID0gZmFsc2UpIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0FkZGluZyBSb2NrZXQuQ2hhdCBjaGFubmVsIGZyb20gU2xhY2snLCBzbGFja0NoYW5uZWxJRCk7XG5cdFx0bGV0IHNsYWNrUmVzdWx0cyA9IG51bGw7XG5cdFx0bGV0IGlzR3JvdXAgPSBmYWxzZTtcblx0XHRpZiAoc2xhY2tDaGFubmVsSUQuY2hhckF0KDApID09PSAnQycpIHtcblx0XHRcdHNsYWNrUmVzdWx0cyA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhbm5lbHMuaW5mbycsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuLCBjaGFubmVsOiBzbGFja0NoYW5uZWxJRCB9IH0pO1xuXHRcdH0gZWxzZSBpZiAoc2xhY2tDaGFubmVsSUQuY2hhckF0KDApID09PSAnRycpIHtcblx0XHRcdHNsYWNrUmVzdWx0cyA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvZ3JvdXBzLmluZm8nLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogc2xhY2tDaGFubmVsSUQgfSB9KTtcblx0XHRcdGlzR3JvdXAgPSB0cnVlO1xuXHRcdH1cblx0XHRpZiAoc2xhY2tSZXN1bHRzICYmIHNsYWNrUmVzdWx0cy5kYXRhICYmIHNsYWNrUmVzdWx0cy5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRjb25zdCByb2NrZXRDaGFubmVsRGF0YSA9IGlzR3JvdXAgPyBzbGFja1Jlc3VsdHMuZGF0YS5ncm91cCA6IHNsYWNrUmVzdWx0cy5kYXRhLmNoYW5uZWw7XG5cdFx0XHRjb25zdCBleGlzdGluZ1JvY2tldFJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvY2tldENoYW5uZWxEYXRhLm5hbWUpO1xuXG5cdFx0XHQvLyBJZiB0aGUgcm9vbSBleGlzdHMsIG1ha2Ugc3VyZSB3ZSBoYXZlIGl0cyBpZCBpbiBpbXBvcnRJZHNcblx0XHRcdGlmIChleGlzdGluZ1JvY2tldFJvb20gfHwgcm9ja2V0Q2hhbm5lbERhdGEuaXNfZ2VuZXJhbCkge1xuXHRcdFx0XHRyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZCA9IHJvY2tldENoYW5uZWxEYXRhLmlzX2dlbmVyYWwgPyAnR0VORVJBTCcgOiBleGlzdGluZ1JvY2tldFJvb20uX2lkO1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5hZGRJbXBvcnRJZHMocm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQsIHJvY2tldENoYW5uZWxEYXRhLmlkKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHJvY2tldFVzZXJzID0gW107XG5cdFx0XHRcdGZvciAoY29uc3QgbWVtYmVyIG9mIHJvY2tldENoYW5uZWxEYXRhLm1lbWJlcnMpIHtcblx0XHRcdFx0XHRpZiAobWVtYmVyICE9PSByb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKSB7XG5cdFx0XHRcdFx0XHRjb25zdCByb2NrZXRVc2VyID0gdGhpcy5maW5kUm9ja2V0VXNlcihtZW1iZXIpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcihtZW1iZXIpO1xuXHRcdFx0XHRcdFx0aWYgKHJvY2tldFVzZXIgJiYgcm9ja2V0VXNlci51c2VybmFtZSkge1xuXHRcdFx0XHRcdFx0XHRyb2NrZXRVc2Vycy5wdXNoKHJvY2tldFVzZXIudXNlcm5hbWUpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCByb2NrZXRVc2VyQ3JlYXRvciA9IHJvY2tldENoYW5uZWxEYXRhLmNyZWF0b3IgPyB0aGlzLmZpbmRSb2NrZXRVc2VyKHJvY2tldENoYW5uZWxEYXRhLmNyZWF0b3IpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcihyb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKSA6IG51bGw7XG5cdFx0XHRcdGlmICghcm9ja2V0VXNlckNyZWF0b3IpIHtcblx0XHRcdFx0XHRsb2dnZXIuY2xhc3MuZXJyb3IoJ0NvdWxkIG5vdCBmZXRjaCByb29tIGNyZWF0b3IgaW5mb3JtYXRpb24nLCByb2NrZXRDaGFubmVsRGF0YS5jcmVhdG9yKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdGNvbnN0IHJvY2tldENoYW5uZWwgPSBSb2NrZXRDaGF0LmNyZWF0ZVJvb20oaXNHcm91cCA/ICdwJyA6ICdjJywgcm9ja2V0Q2hhbm5lbERhdGEubmFtZSwgcm9ja2V0VXNlckNyZWF0b3IudXNlcm5hbWUsIHJvY2tldFVzZXJzKTtcblx0XHRcdFx0XHRyb2NrZXRDaGFubmVsRGF0YS5yb2NrZXRJZCA9IHJvY2tldENoYW5uZWwucmlkO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0aWYgKCFoYXNSZXRyaWVkKSB7XG5cdFx0XHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0Vycm9yIGFkZGluZyBjaGFubmVsIGZyb20gU2xhY2suIFdpbGwgcmV0cnkgaW4gMXMuJywgZS5tZXNzYWdlKTtcblx0XHRcdFx0XHRcdC8vIElmIGZpcnN0IHRpbWUgdHJ5aW5nIHRvIGNyZWF0ZSBjaGFubmVsIGZhaWxzLCBjb3VsZCBiZSBiZWNhdXNlIG9mIG11bHRpcGxlIG1lc3NhZ2VzIHJlY2VpdmVkIGF0IHRoZSBzYW1lIHRpbWUuIFRyeSBhZ2FpbiBvbmNlIGFmdGVyIDFzLlxuXHRcdFx0XHRcdFx0TWV0ZW9yLl9zbGVlcEZvck1zKDEwMDApO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuZmluZFJvY2tldENoYW5uZWwoc2xhY2tDaGFubmVsSUQpIHx8IHRoaXMuYWRkUm9ja2V0Q2hhbm5lbChzbGFja0NoYW5uZWxJRCwgdHJ1ZSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3Qgcm9vbVVwZGF0ZSA9IHtcblx0XHRcdFx0XHR0czogbmV3IERhdGUocm9ja2V0Q2hhbm5lbERhdGEuY3JlYXRlZCAqIDEwMDApXG5cdFx0XHRcdH07XG5cdFx0XHRcdGxldCBsYXN0U2V0VG9waWMgPSAwO1xuXHRcdFx0XHRpZiAoIV8uaXNFbXB0eShyb2NrZXRDaGFubmVsRGF0YS50b3BpYyAmJiByb2NrZXRDaGFubmVsRGF0YS50b3BpYy52YWx1ZSkpIHtcblx0XHRcdFx0XHRyb29tVXBkYXRlLnRvcGljID0gcm9ja2V0Q2hhbm5lbERhdGEudG9waWMudmFsdWU7XG5cdFx0XHRcdFx0bGFzdFNldFRvcGljID0gcm9ja2V0Q2hhbm5lbERhdGEudG9waWMubGFzdF9zZXQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFfLmlzRW1wdHkocm9ja2V0Q2hhbm5lbERhdGEucHVycG9zZSAmJiByb2NrZXRDaGFubmVsRGF0YS5wdXJwb3NlLnZhbHVlKSAmJiByb2NrZXRDaGFubmVsRGF0YS5wdXJwb3NlLmxhc3Rfc2V0ID4gbGFzdFNldFRvcGljKSB7XG5cdFx0XHRcdFx0cm9vbVVwZGF0ZS50b3BpYyA9IHJvY2tldENoYW5uZWxEYXRhLnB1cnBvc2UudmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuYWRkSW1wb3J0SWRzKHJvY2tldENoYW5uZWxEYXRhLnJvY2tldElkLCByb2NrZXRDaGFubmVsRGF0YS5pZCk7XG5cdFx0XHRcdHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldENoYW5uZWxEYXRhLnJvY2tldElkXSA9IHsgaWQ6IHNsYWNrQ2hhbm5lbElELCBmYW1pbHk6IHNsYWNrQ2hhbm5lbElELmNoYXJBdCgwKSA9PT0gJ0MnID8gJ2NoYW5uZWxzJyA6ICdncm91cHMnIH07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9ja2V0Q2hhbm5lbERhdGEucm9ja2V0SWQpO1xuXHRcdH1cblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0NoYW5uZWwgbm90IGFkZGVkJyk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0ZmluZFJvY2tldFVzZXIoc2xhY2tVc2VySUQpIHtcblx0XHRjb25zdCByb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SW1wb3J0SWQoc2xhY2tVc2VySUQpO1xuXHRcdGlmIChyb2NrZXRVc2VyICYmICF0aGlzLnVzZXJUYWdzW3NsYWNrVXNlcklEXSkge1xuXHRcdFx0dGhpcy51c2VyVGFnc1tzbGFja1VzZXJJRF0gPSB7IHNsYWNrOiBgPEAkeyBzbGFja1VzZXJJRCB9PmAsIHJvY2tldDogYEAkeyByb2NrZXRVc2VyLnVzZXJuYW1lIH1gIH07XG5cdFx0fVxuXHRcdHJldHVybiByb2NrZXRVc2VyO1xuXHR9XG5cblx0YWRkUm9ja2V0VXNlcihzbGFja1VzZXJJRCkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnQWRkaW5nIFJvY2tldC5DaGF0IHVzZXIgZnJvbSBTbGFjaycsIHNsYWNrVXNlcklEKTtcblx0XHRjb25zdCBzbGFja1Jlc3VsdHMgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL3VzZXJzLmluZm8nLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgdXNlcjogc2xhY2tVc2VySUQgfSB9KTtcblx0XHRpZiAoc2xhY2tSZXN1bHRzICYmIHNsYWNrUmVzdWx0cy5kYXRhICYmIHNsYWNrUmVzdWx0cy5kYXRhLm9rID09PSB0cnVlICYmIHNsYWNrUmVzdWx0cy5kYXRhLnVzZXIpIHtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXJEYXRhID0gc2xhY2tSZXN1bHRzLmRhdGEudXNlcjtcblx0XHRcdGNvbnN0IGlzQm90ID0gcm9ja2V0VXNlckRhdGEuaXNfYm90ID09PSB0cnVlO1xuXHRcdFx0Y29uc3QgZW1haWwgPSByb2NrZXRVc2VyRGF0YS5wcm9maWxlICYmIHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuZW1haWwgfHwgJyc7XG5cdFx0XHRsZXQgZXhpc3RpbmdSb2NrZXRVc2VyO1xuXHRcdFx0aWYgKCFpc0JvdCkge1xuXHRcdFx0XHRleGlzdGluZ1JvY2tldFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlFbWFpbEFkZHJlc3MoZW1haWwpIHx8IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHJvY2tldFVzZXJEYXRhLm5hbWUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZXhpc3RpbmdSb2NrZXRVc2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocm9ja2V0VXNlckRhdGEubmFtZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChleGlzdGluZ1JvY2tldFVzZXIpIHtcblx0XHRcdFx0cm9ja2V0VXNlckRhdGEucm9ja2V0SWQgPSBleGlzdGluZ1JvY2tldFVzZXIuX2lkO1xuXHRcdFx0XHRyb2NrZXRVc2VyRGF0YS5uYW1lID0gZXhpc3RpbmdSb2NrZXRVc2VyLnVzZXJuYW1lO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc3QgbmV3VXNlciA9IHtcblx0XHRcdFx0XHRwYXNzd29yZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdFx0dXNlcm5hbWU6IHJvY2tldFVzZXJEYXRhLm5hbWVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAoIWlzQm90ICYmIGVtYWlsKSB7XG5cdFx0XHRcdFx0bmV3VXNlci5lbWFpbCA9IGVtYWlsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGlzQm90KSB7XG5cdFx0XHRcdFx0bmV3VXNlci5qb2luRGVmYXVsdENoYW5uZWxzID0gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIobmV3VXNlcik7XG5cdFx0XHRcdGNvbnN0IHVzZXJVcGRhdGUgPSB7XG5cdFx0XHRcdFx0dXRjT2Zmc2V0OiByb2NrZXRVc2VyRGF0YS50el9vZmZzZXQgLyAzNjAwLCAvLyBTbGFjaydzIGlzIC0xODAwMCB3aGljaCB0cmFuc2xhdGVzIHRvIFJvY2tldC5DaGF0J3MgYWZ0ZXIgZGl2aWRpbmcgYnkgMzYwMCxcblx0XHRcdFx0XHRyb2xlczogaXNCb3QgPyBbICdib3QnIF0gOiBbICd1c2VyJyBdXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0aWYgKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUgJiYgcm9ja2V0VXNlckRhdGEucHJvZmlsZS5yZWFsX25hbWUpIHtcblx0XHRcdFx0XHR1c2VyVXBkYXRlWyduYW1lJ10gPSByb2NrZXRVc2VyRGF0YS5wcm9maWxlLnJlYWxfbmFtZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyb2NrZXRVc2VyRGF0YS5kZWxldGVkKSB7XG5cdFx0XHRcdFx0dXNlclVwZGF0ZVsnYWN0aXZlJ10gPSBmYWxzZTtcblx0XHRcdFx0XHR1c2VyVXBkYXRlWydzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMnXSA9IFtdO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHsgX2lkOiByb2NrZXRVc2VyRGF0YS5yb2NrZXRJZCB9LCB7ICRzZXQ6IHVzZXJVcGRhdGUgfSk7XG5cblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvY2tldFVzZXJEYXRhLnJvY2tldElkKTtcblxuXHRcdFx0XHRsZXQgdXJsID0gbnVsbDtcblx0XHRcdFx0aWYgKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUpIHtcblx0XHRcdFx0XHRpZiAocm9ja2V0VXNlckRhdGEucHJvZmlsZS5pbWFnZV9vcmlnaW5hbCkge1xuXHRcdFx0XHRcdFx0dXJsID0gcm9ja2V0VXNlckRhdGEucHJvZmlsZS5pbWFnZV9vcmlnaW5hbDtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHJvY2tldFVzZXJEYXRhLnByb2ZpbGUuaW1hZ2VfNTEyKSB7XG5cdFx0XHRcdFx0XHR1cmwgPSByb2NrZXRVc2VyRGF0YS5wcm9maWxlLmltYWdlXzUxMjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHVybCkge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNldFVzZXJBdmF0YXIodXNlciwgdXJsLCBudWxsLCAndXJsJyk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnRXJyb3Igc2V0dGluZyB1c2VyIGF2YXRhcicsIGVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpbXBvcnRJZHMgPSBbIHJvY2tldFVzZXJEYXRhLmlkIF07XG5cdFx0XHRpZiAoaXNCb3QgJiYgcm9ja2V0VXNlckRhdGEucHJvZmlsZSAmJiByb2NrZXRVc2VyRGF0YS5wcm9maWxlLmJvdF9pZCkge1xuXHRcdFx0XHRpbXBvcnRJZHMucHVzaChyb2NrZXRVc2VyRGF0YS5wcm9maWxlLmJvdF9pZCk7XG5cdFx0XHR9XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5hZGRJbXBvcnRJZHMocm9ja2V0VXNlckRhdGEucm9ja2V0SWQsIGltcG9ydElkcyk7XG5cdFx0XHRpZiAoIXRoaXMudXNlclRhZ3Nbc2xhY2tVc2VySURdKSB7XG5cdFx0XHRcdHRoaXMudXNlclRhZ3Nbc2xhY2tVc2VySURdID0geyBzbGFjazogYDxAJHsgc2xhY2tVc2VySUQgfT5gLCByb2NrZXQ6IGBAJHsgcm9ja2V0VXNlckRhdGEubmFtZSB9YCB9O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvY2tldFVzZXJEYXRhLnJvY2tldElkKTtcblx0XHR9XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdVc2VyIG5vdCBhZGRlZCcpO1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGFkZEFsaWFzVG9Sb2NrZXRNc2cocm9ja2V0VXNlck5hbWUsIHJvY2tldE1zZ09iaikge1xuXHRcdGlmICh0aGlzLmFsaWFzRm9ybWF0KSB7XG5cdFx0XHRjb25zdCBhbGlhcyA9IHRoaXMudXRpbC5mb3JtYXQodGhpcy5hbGlhc0Zvcm1hdCwgcm9ja2V0VXNlck5hbWUpO1xuXG5cdFx0XHRpZiAoYWxpYXMgIT09IHJvY2tldFVzZXJOYW1lKSB7XG5cdFx0XHRcdHJvY2tldE1zZ09iai5hbGlhcyA9IGFsaWFzO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByb2NrZXRNc2dPYmo7XG5cdH1cblxuXHRjcmVhdGVBbmRTYXZlUm9ja2V0TWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIHJvY2tldE1zZ0RhdGFEZWZhdWx0cywgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnR5cGUgPT09ICdtZXNzYWdlJykge1xuXHRcdFx0bGV0IHJvY2tldE1zZ09iaiA9IHt9O1xuXHRcdFx0aWYgKCFfLmlzRW1wdHkoc2xhY2tNZXNzYWdlLnN1YnR5cGUpKSB7XG5cdFx0XHRcdHJvY2tldE1zZ09iaiA9IHRoaXMucHJvY2Vzc1NsYWNrU3VidHlwZWRNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpO1xuXHRcdFx0XHRpZiAoIXJvY2tldE1zZ09iaikge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cm9ja2V0TXNnT2JqID0ge1xuXHRcdFx0XHRcdG1zZzogdGhpcy5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChzbGFja01lc3NhZ2UudGV4dCksXG5cdFx0XHRcdFx0cmlkOiByb2NrZXRDaGFubmVsLl9pZCxcblx0XHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0XHRfaWQ6IHJvY2tldFVzZXIuX2lkLFxuXHRcdFx0XHRcdFx0dXNlcm5hbWU6IHJvY2tldFVzZXIudXNlcm5hbWVcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dGhpcy5hZGRBbGlhc1RvUm9ja2V0TXNnKHJvY2tldFVzZXIudXNlcm5hbWUsIHJvY2tldE1zZ09iaik7XG5cdFx0XHR9XG5cdFx0XHRfLmV4dGVuZChyb2NrZXRNc2dPYmosIHJvY2tldE1zZ0RhdGFEZWZhdWx0cyk7XG5cdFx0XHRpZiAoc2xhY2tNZXNzYWdlLmVkaXRlZCkge1xuXHRcdFx0XHRyb2NrZXRNc2dPYmouZWRpdGVkQXQgPSBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UuZWRpdGVkLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2xhY2tNZXNzYWdlLnN1YnR5cGUgPT09ICdib3RfbWVzc2FnZScpIHtcblx0XHRcdFx0cm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0JywgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfSB9KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5waW5uZWRfdG8gJiYgc2xhY2tNZXNzYWdlLnBpbm5lZF90by5pbmRleE9mKHNsYWNrTWVzc2FnZS5jaGFubmVsKSAhPT0gLTEpIHtcblx0XHRcdFx0cm9ja2V0TXNnT2JqLnBpbm5lZCA9IHRydWU7XG5cdFx0XHRcdHJvY2tldE1zZ09iai5waW5uZWRBdCA9IERhdGUubm93O1xuXHRcdFx0XHRyb2NrZXRNc2dPYmoucGlubmVkQnkgPSBfLnBpY2socm9ja2V0VXNlciwgJ19pZCcsICd1c2VybmFtZScpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5zdWJ0eXBlID09PSAnYm90X21lc3NhZ2UnKSB7XG5cdFx0XHRcdE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRpZiAoc2xhY2tNZXNzYWdlLmJvdF9pZCAmJiBzbGFja01lc3NhZ2UudHMgJiYgIVJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeVNsYWNrQm90SWRBbmRTbGFja1RzKHNsYWNrTWVzc2FnZS5ib3RfaWQsIHNsYWNrTWVzc2FnZS50cykpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2VuZE1lc3NhZ2Uocm9ja2V0VXNlciwgcm9ja2V0TXNnT2JqLCByb2NrZXRDaGFubmVsLCB0cnVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIDUwMCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1NlbmQgbWVzc2FnZSB0byBSb2NrZXQuQ2hhdCcpO1xuXHRcdFx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHJvY2tldFVzZXIsIHJvY2tldE1zZ09iaiwgcm9ja2V0Q2hhbm5lbCwgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9ldmVudHMvcmVhY3Rpb25fcmVtb3ZlZFxuXHQgKi9cblx0b25TbGFja1JlYWN0aW9uUmVtb3ZlZChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0aWYgKHNsYWNrUmVhY3Rpb25Nc2cpIHtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSB0aGlzLmdldFJvY2tldFVzZXIoc2xhY2tSZWFjdGlvbk1zZy51c2VyKTtcblx0XHRcdC8vTGV0cyBmaW5kIG91ciBSb2NrZXQgb3JpZ2luYXRlZCBtZXNzYWdlXG5cdFx0XHRsZXQgcm9ja2V0TXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5U2xhY2tUcyhzbGFja1JlYWN0aW9uTXNnLml0ZW0udHMpO1xuXG5cdFx0XHRpZiAoIXJvY2tldE1zZykge1xuXHRcdFx0XHQvL011c3QgaGF2ZSBvcmlnaW5hdGVkIGZyb20gU2xhY2tcblx0XHRcdFx0Y29uc3Qgcm9ja2V0SUQgPSB0aGlzLmNyZWF0ZVJvY2tldElEKHNsYWNrUmVhY3Rpb25Nc2cuaXRlbS5jaGFubmVsLCBzbGFja1JlYWN0aW9uTXNnLml0ZW0udHMpO1xuXHRcdFx0XHRyb2NrZXRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChyb2NrZXRJRCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyb2NrZXRNc2cgJiYgcm9ja2V0VXNlcikge1xuXHRcdFx0XHRjb25zdCByb2NrZXRSZWFjdGlvbiA9IGA6JHsgc2xhY2tSZWFjdGlvbk1zZy5yZWFjdGlvbiB9OmA7XG5cblx0XHRcdFx0Ly9JZiB0aGUgUm9ja2V0IHVzZXIgaGFzIGFscmVhZHkgYmVlbiByZW1vdmVkLCB0aGVuIHRoaXMgaXMgYW4gZWNobyBiYWNrIGZyb20gc2xhY2tcblx0XHRcdFx0aWYgKHJvY2tldE1zZy5yZWFjdGlvbnMpIHtcblx0XHRcdFx0XHRjb25zdCB0aGVSZWFjdGlvbiA9IHJvY2tldE1zZy5yZWFjdGlvbnNbcm9ja2V0UmVhY3Rpb25dO1xuXHRcdFx0XHRcdGlmICh0aGVSZWFjdGlvbikge1xuXHRcdFx0XHRcdFx0aWYgKHRoZVJlYWN0aW9uLnVzZXJuYW1lcy5pbmRleE9mKHJvY2tldFVzZXIudXNlcm5hbWUpID09PSAtMSkge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47IC8vUmVhY3Rpb24gYWxyZWFkeSByZW1vdmVkXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vUmVhY3Rpb24gYWxyZWFkeSByZW1vdmVkXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9TdGFzaCB0aGlzIGF3YXkgdG8ga2V5IG9mZiBpdCBsYXRlciBzbyB3ZSBkb24ndCBzZW5kIGl0IGJhY2sgdG8gU2xhY2tcblx0XHRcdFx0dGhpcy5yZWFjdGlvbnNNYXAuc2V0KGB1bnNldCR7IHJvY2tldE1zZy5faWQgfSR7IHJvY2tldFJlYWN0aW9uIH1gLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdSZW1vdmluZyByZWFjdGlvbiBmcm9tIFNsYWNrJyk7XG5cdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIocm9ja2V0VXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0UmVhY3Rpb24nLCByb2NrZXRSZWFjdGlvbiwgcm9ja2V0TXNnLl9pZCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL3JlYWN0aW9uX2FkZGVkXG5cdCAqL1xuXHRvblNsYWNrUmVhY3Rpb25BZGRlZChzbGFja1JlYWN0aW9uTXNnKSB7XG5cdFx0aWYgKHNsYWNrUmVhY3Rpb25Nc2cpIHtcblx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSB0aGlzLmdldFJvY2tldFVzZXIoc2xhY2tSZWFjdGlvbk1zZy51c2VyKTtcblxuXHRcdFx0aWYgKHJvY2tldFVzZXIucm9sZXMuaW5jbHVkZXMoJ2JvdCcpKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Ly9MZXRzIGZpbmQgb3VyIFJvY2tldCBvcmlnaW5hdGVkIG1lc3NhZ2Vcblx0XHRcdGxldCByb2NrZXRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlTbGFja1RzKHNsYWNrUmVhY3Rpb25Nc2cuaXRlbS50cyk7XG5cblx0XHRcdGlmICghcm9ja2V0TXNnKSB7XG5cdFx0XHRcdC8vTXVzdCBoYXZlIG9yaWdpbmF0ZWQgZnJvbSBTbGFja1xuXHRcdFx0XHRjb25zdCByb2NrZXRJRCA9IHRoaXMuY3JlYXRlUm9ja2V0SUQoc2xhY2tSZWFjdGlvbk1zZy5pdGVtLmNoYW5uZWwsIHNsYWNrUmVhY3Rpb25Nc2cuaXRlbS50cyk7XG5cdFx0XHRcdHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHJvY2tldElEKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHJvY2tldE1zZyAmJiByb2NrZXRVc2VyKSB7XG5cdFx0XHRcdGNvbnN0IHJvY2tldFJlYWN0aW9uID0gYDokeyBzbGFja1JlYWN0aW9uTXNnLnJlYWN0aW9uIH06YDtcblxuXHRcdFx0XHQvL0lmIHRoZSBSb2NrZXQgdXNlciBoYXMgYWxyZWFkeSByZWFjdGVkLCB0aGVuIHRoaXMgaXMgU2xhY2sgZWNob2luZyBiYWNrIHRvIHVzXG5cdFx0XHRcdGlmIChyb2NrZXRNc2cucmVhY3Rpb25zKSB7XG5cdFx0XHRcdFx0Y29uc3QgdGhlUmVhY3Rpb24gPSByb2NrZXRNc2cucmVhY3Rpb25zW3JvY2tldFJlYWN0aW9uXTtcblx0XHRcdFx0XHRpZiAodGhlUmVhY3Rpb24pIHtcblx0XHRcdFx0XHRcdGlmICh0aGVSZWFjdGlvbi51c2VybmFtZXMuaW5kZXhPZihyb2NrZXRVc2VyLnVzZXJuYW1lKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuOyAvL0FscmVhZHkgcmVhY3RlZFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vU3Rhc2ggdGhpcyBhd2F5IHRvIGtleSBvZmYgaXQgbGF0ZXIgc28gd2UgZG9uJ3Qgc2VuZCBpdCBiYWNrIHRvIFNsYWNrXG5cdFx0XHRcdHRoaXMucmVhY3Rpb25zTWFwLnNldChgc2V0JHsgcm9ja2V0TXNnLl9pZCB9JHsgcm9ja2V0UmVhY3Rpb24gfWAsIHJvY2tldFVzZXIpO1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0FkZGluZyByZWFjdGlvbiBmcm9tIFNsYWNrJyk7XG5cdFx0XHRcdE1ldGVvci5ydW5Bc1VzZXIocm9ja2V0VXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0XHRNZXRlb3IuY2FsbCgnc2V0UmVhY3Rpb24nLCByb2NrZXRSZWFjdGlvbiwgcm9ja2V0TXNnLl9pZCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBXZSBoYXZlIHJlY2VpdmVkIGEgbWVzc2FnZSBmcm9tIHNsYWNrIGFuZCB3ZSBuZWVkIHRvIHNhdmUvZGVsZXRlL3VwZGF0ZSBpdCBpbnRvIHJvY2tldFxuXHQgKiBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL21lc3NhZ2Vcblx0ICovXG5cdG9uU2xhY2tNZXNzYWdlKHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnN1YnR5cGUpIHtcblx0XHRcdHN3aXRjaCAoc2xhY2tNZXNzYWdlLnN1YnR5cGUpIHtcblx0XHRcdFx0Y2FzZSAnbWVzc2FnZV9kZWxldGVkJzpcblx0XHRcdFx0XHR0aGlzLnByb2Nlc3NTbGFja01lc3NhZ2VEZWxldGVkKHNsYWNrTWVzc2FnZSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ21lc3NhZ2VfY2hhbmdlZCc6XG5cdFx0XHRcdFx0dGhpcy5wcm9jZXNzU2xhY2tNZXNzYWdlQ2hhbmdlZChzbGFja01lc3NhZ2UpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdC8vS2VlcGluZyBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eSBmb3Igbm93LCByZWZhY3RvciBsYXRlclxuXHRcdFx0XHRcdHRoaXMucHJvY2Vzc1NsYWNrTmV3TWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly9TaW1wbGUgbWVzc2FnZVxuXHRcdFx0dGhpcy5wcm9jZXNzU2xhY2tOZXdNZXNzYWdlKHNsYWNrTWVzc2FnZSwgaXNJbXBvcnRpbmcpO1xuXHRcdH1cblx0fVxuXG5cdHByb2Nlc3NTbGFja1N1YnR5cGVkTWVzc2FnZShyb2NrZXRDaGFubmVsLCByb2NrZXRVc2VyLCBzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0bGV0IHJvY2tldE1zZ09iaiA9IG51bGw7XG5cdFx0c3dpdGNoIChzbGFja01lc3NhZ2Uuc3VidHlwZSkge1xuXHRcdFx0Y2FzZSAnYm90X21lc3NhZ2UnOlxuXHRcdFx0XHRpZiAoc2xhY2tNZXNzYWdlLnVzZXJuYW1lICE9PSB1bmRlZmluZWQgJiYgdGhpcy5leGNsdWRlQm90bmFtZXMgJiYgc2xhY2tNZXNzYWdlLnVzZXJuYW1lLm1hdGNoKHRoaXMuZXhjbHVkZUJvdG5hbWVzKSkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJvY2tldE1zZ09iaiA9IHtcblx0XHRcdFx0XHRtc2c6IHRoaXMuY29udmVydFNsYWNrTXNnVHh0VG9Sb2NrZXRUeHRGb3JtYXQoc2xhY2tNZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdHJpZDogcm9ja2V0Q2hhbm5lbC5faWQsXG5cdFx0XHRcdFx0Ym90OiB0cnVlLFxuXHRcdFx0XHRcdGF0dGFjaG1lbnRzOiBzbGFja01lc3NhZ2UuYXR0YWNobWVudHMsXG5cdFx0XHRcdFx0dXNlcm5hbWU6IHNsYWNrTWVzc2FnZS51c2VybmFtZSB8fCBzbGFja01lc3NhZ2UuYm90X2lkXG5cdFx0XHRcdH07XG5cdFx0XHRcdHRoaXMuYWRkQWxpYXNUb1JvY2tldE1zZyhzbGFja01lc3NhZ2UudXNlcm5hbWUgfHwgc2xhY2tNZXNzYWdlLmJvdF9pZCwgcm9ja2V0TXNnT2JqKTtcblx0XHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5pY29ucykge1xuXHRcdFx0XHRcdHJvY2tldE1zZ09iai5lbW9qaSA9IHNsYWNrTWVzc2FnZS5pY29ucy5lbW9qaTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcm9ja2V0TXNnT2JqO1xuXHRcdFx0Y2FzZSAnbWVfbWVzc2FnZSc6XG5cdFx0XHRcdHJldHVybiB0aGlzLmFkZEFsaWFzVG9Sb2NrZXRNc2cocm9ja2V0VXNlci51c2VybmFtZSwge1xuXHRcdFx0XHRcdG1zZzogYF8keyB0aGlzLmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS50ZXh0KSB9X2Bcblx0XHRcdFx0fSk7XG5cdFx0XHRjYXNlICdjaGFubmVsX2pvaW4nOlxuXHRcdFx0XHRpZiAoaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VySm9pbldpdGhSb29tSWRBbmRVc2VyKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyLCB7IHRzOiBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaW1wb3J0ZWQ6ICdzbGFja2JyaWRnZScgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5hZGRVc2VyVG9Sb29tKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdncm91cF9qb2luJzpcblx0XHRcdFx0aWYgKHNsYWNrTWVzc2FnZS5pbnZpdGVyKSB7XG5cdFx0XHRcdFx0Y29uc3QgaW52aXRlciA9IHNsYWNrTWVzc2FnZS5pbnZpdGVyID8gdGhpcy5maW5kUm9ja2V0VXNlcihzbGFja01lc3NhZ2UuaW52aXRlcikgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKHNsYWNrTWVzc2FnZS5pbnZpdGVyKSA6IG51bGw7XG5cdFx0XHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VyQWRkZWRXaXRoUm9vbUlkQW5kVXNlcihyb2NrZXRDaGFubmVsLl9pZCwgcm9ja2V0VXNlciwge1xuXHRcdFx0XHRcdFx0XHR0czogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksXG5cdFx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0XHRfaWQ6IGludml0ZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHRcdHVzZXJuYW1lOiBpbnZpdGVyLnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGltcG9ydGVkOiAnc2xhY2ticmlkZ2UnXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5hZGRVc2VyVG9Sb29tKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyLCBpbnZpdGVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnY2hhbm5lbF9sZWF2ZSc6XG5cdFx0XHRjYXNlICdncm91cF9sZWF2ZSc6XG5cdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJMZWF2ZVdpdGhSb29tSWRBbmRVc2VyKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyLCB7XG5cdFx0XHRcdFx0XHR0czogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksXG5cdFx0XHRcdFx0XHRpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJ1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFJvY2tldENoYXQucmVtb3ZlVXNlckZyb21Sb29tKHJvY2tldENoYW5uZWwuX2lkLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdjaGFubmVsX3RvcGljJzpcblx0XHRcdGNhc2UgJ2dyb3VwX3RvcGljJzpcblx0XHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF90b3BpYycsIHJvY2tldENoYW5uZWwuX2lkLCBzbGFja01lc3NhZ2UudG9waWMsIHJvY2tldFVzZXIsIHsgdHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tVG9waWMocm9ja2V0Q2hhbm5lbC5faWQsIHNsYWNrTWVzc2FnZS50b3BpYywgcm9ja2V0VXNlciwgZmFsc2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgJ2NoYW5uZWxfcHVycG9zZSc6XG5cdFx0XHRjYXNlICdncm91cF9wdXJwb3NlJzpcblx0XHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF90b3BpYycsIHJvY2tldENoYW5uZWwuX2lkLCBzbGFja01lc3NhZ2UucHVycG9zZSwgcm9ja2V0VXNlciwgeyB0czogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksIGltcG9ydGVkOiAnc2xhY2ticmlkZ2UnIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub3BpYyhyb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLnB1cnBvc2UsIHJvY2tldFVzZXIsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdjaGFubmVsX25hbWUnOlxuXHRcdFx0Y2FzZSAnZ3JvdXBfbmFtZSc6XG5cdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21SZW5hbWVkV2l0aFJvb21JZFJvb21OYW1lQW5kVXNlcihyb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLm5hbWUsIHJvY2tldFVzZXIsIHsgdHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApLCBpbXBvcnRlZDogJ3NsYWNrYnJpZGdlJyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tTmFtZShyb2NrZXRDaGFubmVsLl9pZCwgc2xhY2tNZXNzYWdlLm5hbWUsIHJvY2tldFVzZXIsIGZhbHNlKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdjaGFubmVsX2FyY2hpdmUnOlxuXHRcdFx0Y2FzZSAnZ3JvdXBfYXJjaGl2ZSc6XG5cdFx0XHRcdGlmICghaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LmFyY2hpdmVSb29tKHJvY2tldENoYW5uZWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdGNhc2UgJ2NoYW5uZWxfdW5hcmNoaXZlJzpcblx0XHRcdGNhc2UgJ2dyb3VwX3VuYXJjaGl2ZSc6XG5cdFx0XHRcdGlmICghaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LnVuYXJjaGl2ZVJvb20ocm9ja2V0Q2hhbm5lbCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0Y2FzZSAnZmlsZV9zaGFyZSc6XG5cdFx0XHRcdGlmIChzbGFja01lc3NhZ2UuZmlsZSAmJiBzbGFja01lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc3QgZGV0YWlscyA9IHtcblx0XHRcdFx0XHRcdG1lc3NhZ2VfaWQ6IGBzbGFjay0keyBzbGFja01lc3NhZ2UudHMucmVwbGFjZSgvXFwuL2csICctJykgfWAsXG5cdFx0XHRcdFx0XHRuYW1lOiBzbGFja01lc3NhZ2UuZmlsZS5uYW1lLFxuXHRcdFx0XHRcdFx0c2l6ZTogc2xhY2tNZXNzYWdlLmZpbGUuc2l6ZSxcblx0XHRcdFx0XHRcdHR5cGU6IHNsYWNrTWVzc2FnZS5maWxlLm1pbWV0eXBlLFxuXHRcdFx0XHRcdFx0cmlkOiByb2NrZXRDaGFubmVsLl9pZFxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMudXBsb2FkRmlsZUZyb21TbGFjayhkZXRhaWxzLCBzbGFja01lc3NhZ2UuZmlsZS51cmxfcHJpdmF0ZV9kb3dubG9hZCwgcm9ja2V0VXNlciwgcm9ja2V0Q2hhbm5lbCwgbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCksIGlzSW1wb3J0aW5nKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ2ZpbGVfY29tbWVudCc6XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5lcnJvcignRmlsZSBjb21tZW50IG5vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdmaWxlX21lbnRpb24nOlxuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZXJyb3IoJ0ZpbGUgbWVudGlvbmVkIG5vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICdwaW5uZWRfaXRlbSc6XG5cdFx0XHRcdGlmIChzbGFja01lc3NhZ2UuYXR0YWNobWVudHMgJiYgc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzWzBdICYmIHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS50ZXh0KSB7XG5cdFx0XHRcdFx0cm9ja2V0TXNnT2JqID0ge1xuXHRcdFx0XHRcdFx0cmlkOiByb2NrZXRDaGFubmVsLl9pZCxcblx0XHRcdFx0XHRcdHQ6ICdtZXNzYWdlX3Bpbm5lZCcsXG5cdFx0XHRcdFx0XHRtc2c6ICcnLFxuXHRcdFx0XHRcdFx0dToge1xuXHRcdFx0XHRcdFx0XHRfaWQ6IHJvY2tldFVzZXIuX2lkLFxuXHRcdFx0XHRcdFx0XHR1c2VybmFtZTogcm9ja2V0VXNlci51c2VybmFtZVxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnRzOiBbe1xuXHRcdFx0XHRcdFx0XHQndGV4dCcgOiB0aGlzLmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS50ZXh0KSxcblx0XHRcdFx0XHRcdFx0J2F1dGhvcl9uYW1lJyA6IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS5hdXRob3Jfc3VibmFtZSxcblx0XHRcdFx0XHRcdFx0J2F1dGhvcl9pY29uJyA6IGdldEF2YXRhclVybEZyb21Vc2VybmFtZShzbGFja01lc3NhZ2UuYXR0YWNobWVudHNbMF0uYXV0aG9yX3N1Ym5hbWUpLFxuXHRcdFx0XHRcdFx0XHQndHMnIDogbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzWzBdLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMClcblx0XHRcdFx0XHRcdH1dXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGlmICghaXNJbXBvcnRpbmcpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFBpbm5lZEJ5SWRBbmRVc2VySWQoYHNsYWNrLSR7IHNsYWNrTWVzc2FnZS5hdHRhY2htZW50c1swXS5jaGFubmVsX2lkIH0tJHsgc2xhY2tNZXNzYWdlLmF0dGFjaG1lbnRzWzBdLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLCByb2NrZXRNc2dPYmoudSwgdHJ1ZSwgbmV3IERhdGUocGFyc2VJbnQoc2xhY2tNZXNzYWdlLnRzLnNwbGl0KCcuJylbMF0pICogMTAwMCkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiByb2NrZXRNc2dPYmo7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdQaW5uZWQgaXRlbSB3aXRoIG5vIGF0dGFjaG1lbnQnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRjYXNlICd1bnBpbm5lZF9pdGVtJzpcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdVbnBpbm5lZCBpdGVtIG5vdCBpbXBsZW1lbnRlZCcpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdFVwbG9hZHMgdGhlIGZpbGUgdG8gdGhlIHN0b3JhZ2UuXG5cdEBwYXJhbSBbT2JqZWN0XSBkZXRhaWxzIGFuIG9iamVjdCB3aXRoIGRldGFpbHMgYWJvdXQgdGhlIHVwbG9hZC4gbmFtZSwgc2l6ZSwgdHlwZSwgYW5kIHJpZFxuXHRAcGFyYW0gW1N0cmluZ10gZmlsZVVybCB1cmwgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWQvaW1wb3J0XG5cdEBwYXJhbSBbT2JqZWN0XSB1c2VyIHRoZSBSb2NrZXQuQ2hhdCB1c2VyXG5cdEBwYXJhbSBbT2JqZWN0XSByb29tIHRoZSBSb2NrZXQuQ2hhdCByb29tXG5cdEBwYXJhbSBbRGF0ZV0gdGltZVN0YW1wIHRoZSB0aW1lc3RhbXAgdGhlIGZpbGUgd2FzIHVwbG9hZGVkXG5cdCoqL1xuXHQvL2RldGFpbHMsIHNsYWNrTWVzc2FnZS5maWxlLnVybF9wcml2YXRlX2Rvd25sb2FkLCByb2NrZXRVc2VyLCByb2NrZXRDaGFubmVsLCBuZXcgRGF0ZShwYXJzZUludChzbGFja01lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSwgaXNJbXBvcnRpbmcpO1xuXHR1cGxvYWRGaWxlRnJvbVNsYWNrKGRldGFpbHMsIHNsYWNrRmlsZVVSTCwgcm9ja2V0VXNlciwgcm9ja2V0Q2hhbm5lbCwgdGltZVN0YW1wLCBpc0ltcG9ydGluZykge1xuXHRcdGNvbnN0IHJlcXVlc3RNb2R1bGUgPSAvaHR0cHMvaS50ZXN0KHNsYWNrRmlsZVVSTCkgPyBodHRwcyA6IGh0dHA7XG5cdFx0Y29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHNsYWNrRmlsZVVSTCwgdHJ1ZSk7XG5cdFx0cGFyc2VkVXJsLmhlYWRlcnMgPSB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyB0aGlzLmFwaVRva2VuIH1gIH07XG5cdFx0cmVxdWVzdE1vZHVsZS5nZXQocGFyc2VkVXJsLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChzdHJlYW0pID0+IHtcblx0XHRcdGNvbnN0IGZpbGVTdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmUoJ1VwbG9hZHMnKTtcblxuXHRcdFx0ZmlsZVN0b3JlLmluc2VydChkZXRhaWxzLCBzdHJlYW0sIChlcnIsIGZpbGUpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGNvbnN0IHVybCA9IGZpbGUudXJsLnJlcGxhY2UoTWV0ZW9yLmFic29sdXRlVXJsKCksICcvJyk7XG5cdFx0XHRcdFx0Y29uc3QgYXR0YWNobWVudCA9IHtcblx0XHRcdFx0XHRcdHRpdGxlOiBmaWxlLm5hbWUsXG5cdFx0XHRcdFx0XHR0aXRsZV9saW5rOiB1cmxcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0aWYgKC9eaW1hZ2VcXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRcdFx0XHRhdHRhY2htZW50LmltYWdlX3VybCA9IHVybDtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2Vfc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuaW1hZ2VfZGltZW5zaW9ucyA9IGZpbGUuaWRlbnRpZnkgJiYgZmlsZS5pZGVudGlmeS5zaXplO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoL15hdWRpb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQuYXVkaW9fdXJsID0gdXJsO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC5hdWRpb19zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoL152aWRlb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdFx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdXJsID0gdXJsO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0XHRcdFx0YXR0YWNobWVudC52aWRlb19zaXplID0gZmlsZS5zaXplO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0XHRcdHJpZDogZGV0YWlscy5yaWQsXG5cdFx0XHRcdFx0XHR0czogdGltZVN0YW1wLFxuXHRcdFx0XHRcdFx0bXNnOiAnJyxcblx0XHRcdFx0XHRcdGZpbGU6IHtcblx0XHRcdFx0XHRcdFx0X2lkOiBmaWxlLl9pZFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRcdGdyb3VwYWJsZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRhdHRhY2htZW50czogW2F0dGFjaG1lbnRdXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGlmIChpc0ltcG9ydGluZykge1xuXHRcdFx0XHRcdFx0bXNnLmltcG9ydGVkID0gJ3NsYWNrYnJpZGdlJztcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZGV0YWlscy5tZXNzYWdlX2lkICYmICh0eXBlb2YgZGV0YWlscy5tZXNzYWdlX2lkID09PSAnc3RyaW5nJykpIHtcblx0XHRcdFx0XHRcdG1zZ1snX2lkJ10gPSBkZXRhaWxzLm1lc3NhZ2VfaWQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuc2VuZE1lc3NhZ2Uocm9ja2V0VXNlciwgbXNnLCByb2NrZXRDaGFubmVsLCB0cnVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSkpO1xuXHR9XG5cblx0cmVnaXN0ZXJGb3JSb2NrZXRFdmVudHMoKSB7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgdGhpcy5vblJvY2tldE1lc3NhZ2UuYmluZCh0aGlzKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnU2xhY2tCcmlkZ2VfT3V0Jyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckRlbGV0ZU1lc3NhZ2UnLCB0aGlzLm9uUm9ja2V0TWVzc2FnZURlbGV0ZS5iaW5kKHRoaXMpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdTbGFja0JyaWRnZV9EZWxldGUnKTtcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ3NldFJlYWN0aW9uJywgdGhpcy5vblJvY2tldFNldFJlYWN0aW9uLmJpbmQodGhpcyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ1NsYWNrQnJpZGdlX1NldFJlYWN0aW9uJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCd1bnNldFJlYWN0aW9uJywgdGhpcy5vblJvY2tldFVuU2V0UmVhY3Rpb24uYmluZCh0aGlzKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnU2xhY2tCcmlkZ2VfVW5TZXRSZWFjdGlvbicpO1xuXHR9XG5cblx0dW5yZWdpc3RlckZvclJvY2tldEV2ZW50cygpIHtcblx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5yZW1vdmUoJ2FmdGVyU2F2ZU1lc3NhZ2UnLCAnU2xhY2tCcmlkZ2VfT3V0Jyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucmVtb3ZlKCdhZnRlckRlbGV0ZU1lc3NhZ2UnLCAnU2xhY2tCcmlkZ2VfRGVsZXRlJyk7XG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucmVtb3ZlKCdzZXRSZWFjdGlvbicsICdTbGFja0JyaWRnZV9TZXRSZWFjdGlvbicpO1xuXHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJlbW92ZSgndW5zZXRSZWFjdGlvbicsICdTbGFja0JyaWRnZV9VblNldFJlYWN0aW9uJyk7XG5cdH1cblxuXHRyZWdpc3RlckZvclNsYWNrRXZlbnRzKCkge1xuXHRcdGNvbnN0IENMSUVOVF9FVkVOVFMgPSB0aGlzLnNsYWNrQ2xpZW50LkNMSUVOVF9FVkVOVFM7XG5cdFx0dGhpcy5ydG0ub24oQ0xJRU5UX0VWRU5UUy5SVE0uQVVUSEVOVElDQVRFRCwgKCkgPT4ge1xuXHRcdFx0bG9nZ2VyLmNvbm5lY3Rpb24uaW5mbygnQ29ubmVjdGVkIHRvIFNsYWNrJyk7XG5cdFx0fSk7XG5cblx0XHR0aGlzLnJ0bS5vbihDTElFTlRfRVZFTlRTLlJUTS5VTkFCTEVfVE9fUlRNX1NUQVJULCAoKSA9PiB7XG5cdFx0XHR0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHR9KTtcblxuXHRcdHRoaXMucnRtLm9uKENMSUVOVF9FVkVOVFMuUlRNLkRJU0NPTk5FQ1QsICgpID0+IHtcblx0XHRcdHRoaXMuZGlzY29ubmVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgUlRNX0VWRU5UUyA9IHRoaXMuc2xhY2tDbGllbnQuUlRNX0VWRU5UUztcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiBzb21lb25lIG1lc3NhZ2VzIGEgY2hhbm5lbCB0aGUgYm90IGlzIGluXG5cdFx0KiB7XG5cdFx0Klx0dHlwZTogJ21lc3NhZ2UnLFxuXHRcdCogXHRjaGFubmVsOiBbY2hhbm5lbF9pZF0sXG5cdFx0KiBcdHVzZXI6IFt1c2VyX2lkXSxcblx0XHQqIFx0dGV4dDogW21lc3NhZ2VdLFxuXHRcdCogXHR0czogW3RzLm1pbGxpXSxcblx0XHQqIFx0dGVhbTogW3RlYW1faWRdLFxuXHRcdCogXHRzdWJ0eXBlOiBbbWVzc2FnZV9zdWJ0eXBlXSxcblx0XHQqIFx0aW52aXRlcjogW21lc3NhZ2Vfc3VidHlwZSA9ICdncm91cF9qb2lufGNoYW5uZWxfam9pbicgLT4gdXNlcl9pZF1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLk1FU1NBR0UsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKHNsYWNrTWVzc2FnZSkgPT4ge1xuXHRcdFx0bG9nZ2VyLmV2ZW50cy5kZWJ1ZygnT25TbGFja0V2ZW50LU1FU1NBR0U6ICcsIHNsYWNrTWVzc2FnZSk7XG5cdFx0XHRpZiAoc2xhY2tNZXNzYWdlKSB7XG5cdFx0XHRcdHRoaXMub25TbGFja01lc3NhZ2Uoc2xhY2tNZXNzYWdlKTtcblx0XHRcdH1cblx0XHR9KSk7XG5cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLlJFQUNUSU9OX0FEREVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KChyZWFjdGlvbk1zZykgPT4ge1xuXHRcdFx0bG9nZ2VyLmV2ZW50cy5kZWJ1ZygnT25TbGFja0V2ZW50LVJFQUNUSU9OX0FEREVEOiAnLCByZWFjdGlvbk1zZyk7XG5cdFx0XHRpZiAocmVhY3Rpb25Nc2cpIHtcblx0XHRcdFx0dGhpcy5vblNsYWNrUmVhY3Rpb25BZGRlZChyZWFjdGlvbk1zZyk7XG5cdFx0XHR9XG5cdFx0fSkpO1xuXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5SRUFDVElPTl9SRU1PVkVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KChyZWFjdGlvbk1zZykgPT4ge1xuXHRcdFx0bG9nZ2VyLmV2ZW50cy5kZWJ1ZygnT25TbGFja0V2ZW50LVJFQUNUSU9OX1JFTU9WRUQ6ICcsIHJlYWN0aW9uTXNnKTtcblx0XHRcdGlmIChyZWFjdGlvbk1zZykge1xuXHRcdFx0XHR0aGlzLm9uU2xhY2tSZWFjdGlvblJlbW92ZWQocmVhY3Rpb25Nc2cpO1xuXHRcdFx0fVxuXHRcdH0pKTtcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiBzb21lb25lIGNyZWF0ZXMgYSBwdWJsaWMgY2hhbm5lbFxuXHRcdCoge1xuXHRcdCpcdHR5cGU6ICdjaGFubmVsX2NyZWF0ZWQnLFxuXHRcdCpcdGNoYW5uZWw6IHtcblx0XHQqXHRcdGlkOiBbY2hhbm5lbF9pZF0sXG5cdFx0Klx0XHRpc19jaGFubmVsOiB0cnVlLFxuXHRcdCpcdFx0bmFtZTogW2NoYW5uZWxfbmFtZV0sXG5cdFx0Klx0XHRjcmVhdGVkOiBbdHNdLFxuXHRcdCpcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCpcdFx0aXNfc2hhcmVkOiBmYWxzZSxcblx0XHQqXHRcdGlzX29yZ19zaGFyZWQ6IGZhbHNlXG5cdFx0Klx0fSxcblx0XHQqXHRldmVudF90czogW3RzLm1pbGxpXVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuQ0hBTk5FTF9DUkVBVEVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBqb2lucyBhIHB1YmxpYyBjaGFubmVsXG5cdFx0KiB7XG5cdFx0KiBcdHR5cGU6ICdjaGFubmVsX2pvaW5lZCcsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2NoYW5uZWw6IHRydWUsXG5cdFx0KiBcdFx0Y3JlYXRlZDogW3RzXSxcblx0XHQqIFx0XHRjcmVhdG9yOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0aXNfYXJjaGl2ZWQ6IGZhbHNlLFxuXHRcdCogXHRcdGlzX2dlbmVyYWw6IGZhbHNlLFxuXHRcdCogXHRcdGlzX21lbWJlcjogdHJ1ZSxcblx0XHQqIFx0XHRsYXN0X3JlYWQ6IFt0cy5taWxsaV0sXG5cdFx0KiBcdFx0bGF0ZXN0OiBbbWVzc2FnZV9vYmpdLFxuXHRcdCogXHRcdHVucmVhZF9jb3VudDogMCxcblx0XHQqIFx0XHR1bnJlYWRfY291bnRfZGlzcGxheTogMCxcblx0XHQqIFx0XHRtZW1iZXJzOiBbIHVzZXJfaWRzIF0sXG5cdFx0KiBcdFx0dG9waWM6IHtcblx0XHQqIFx0XHRcdHZhbHVlOiBbY2hhbm5lbF90b3BpY10sXG5cdFx0KiBcdFx0XHRjcmVhdG9yOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0XHRsYXN0X3NldDogMFxuXHRcdCogXHRcdH0sXG5cdFx0KiBcdFx0cHVycG9zZToge1xuXHRcdCogXHRcdFx0dmFsdWU6IFtjaGFubmVsX3B1cnBvc2VdLFxuXHRcdCogXHRcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdFx0bGFzdF9zZXQ6IDBcblx0XHQqIFx0XHR9XG5cdFx0KiBcdH1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkNIQU5ORUxfSk9JTkVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBsZWF2ZXMgKG9yIGlzIHJlbW92ZWQgZnJvbSkgYSBwdWJsaWMgY2hhbm5lbFxuXHRcdCoge1xuXHRcdCogXHR0eXBlOiAnY2hhbm5lbF9sZWZ0Jyxcblx0XHQqIFx0Y2hhbm5lbDogW2NoYW5uZWxfaWRdXG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5DSEFOTkVMX0xFRlQsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiBhbiBhcmNoaXZlZCBjaGFubmVsIGlzIGRlbGV0ZWQgYnkgYW4gYWRtaW5cblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2NoYW5uZWxfZGVsZXRlZCcsXG5cdFx0KiBcdGNoYW5uZWw6IFtjaGFubmVsX2lkXSxcblx0XHQqXHRldmVudF90czogW3RzLm1pbGxpXVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuQ0hBTk5FTF9ERUxFVEVELCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGNoYW5uZWwgaGFzIGl0cyBuYW1lIGNoYW5nZWRcblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2NoYW5uZWxfcmVuYW1lJyxcblx0XHQqIFx0Y2hhbm5lbDoge1xuXHRcdCogXHRcdGlkOiBbY2hhbm5lbF9pZF0sXG5cdFx0KiBcdFx0bmFtZTogW2NoYW5uZWxfbmFtZV0sXG5cdFx0KiBcdFx0aXNfY2hhbm5lbDogdHJ1ZSxcblx0XHQqIFx0XHRjcmVhdGVkOiBbdHNdXG5cdFx0KiBcdH0sXG5cdFx0Klx0ZXZlbnRfdHM6IFt0cy5taWxsaV1cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLkNIQU5ORUxfUkVOQU1FLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gdGhlIGJvdCBqb2lucyBhIHByaXZhdGUgY2hhbm5lbFxuXHRcdCoge1xuXHRcdCogXHR0eXBlOiAnZ3JvdXBfam9pbmVkJyxcblx0XHQqIFx0Y2hhbm5lbDoge1xuXHRcdCogXHRcdGlkOiBbY2hhbm5lbF9pZF0sXG5cdFx0KiBcdFx0bmFtZTogW2NoYW5uZWxfbmFtZV0sXG5cdFx0KiBcdFx0aXNfZ3JvdXA6IHRydWUsXG5cdFx0KiBcdFx0Y3JlYXRlZDogW3RzXSxcblx0XHQqIFx0XHRjcmVhdG9yOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0aXNfYXJjaGl2ZWQ6IGZhbHNlLFxuXHRcdCogXHRcdGlzX21waW06IGZhbHNlLFxuXHRcdCogXHRcdGlzX29wZW46IHRydWUsXG5cdFx0KiBcdFx0bGFzdF9yZWFkOiBbdHMubWlsbGldLFxuXHRcdCogXHRcdGxhdGVzdDogW21lc3NhZ2Vfb2JqXSxcblx0XHQqIFx0XHR1bnJlYWRfY291bnQ6IDAsXG5cdFx0KiBcdFx0dW5yZWFkX2NvdW50X2Rpc3BsYXk6IDAsXG5cdFx0KiBcdFx0bWVtYmVyczogWyB1c2VyX2lkcyBdLFxuXHRcdCogXHRcdHRvcGljOiB7XG5cdFx0KiBcdFx0XHR2YWx1ZTogW2NoYW5uZWxfdG9waWNdLFxuXHRcdCogXHRcdFx0Y3JlYXRvcjogW3VzZXJfaWRdLFxuXHRcdCogXHRcdFx0bGFzdF9zZXQ6IDBcblx0XHQqIFx0XHR9LFxuXHRcdCogXHRcdHB1cnBvc2U6IHtcblx0XHQqIFx0XHRcdHZhbHVlOiBbY2hhbm5lbF9wdXJwb3NlXSxcblx0XHQqIFx0XHRcdGNyZWF0b3I6IFt1c2VyX2lkXSxcblx0XHQqIFx0XHRcdGxhc3Rfc2V0OiAwXG5cdFx0KiBcdFx0fVxuXHRcdCogXHR9XG5cdFx0KiB9XG5cdFx0KiovXG5cdFx0dGhpcy5ydG0ub24oUlRNX0VWRU5UUy5HUk9VUF9KT0lORUQsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge30pKTtcblxuXHRcdC8qKlxuXHRcdCogRXZlbnQgZmlyZWQgd2hlbiB0aGUgYm90IGxlYXZlcyAob3IgaXMgcmVtb3ZlZCBmcm9tKSBhIHByaXZhdGUgY2hhbm5lbFxuXHRcdCoge1xuXHRcdCogXHR0eXBlOiAnZ3JvdXBfbGVmdCcsXG5cdFx0KiBcdGNoYW5uZWw6IFtjaGFubmVsX2lkXVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuR1JPVVBfTEVGVCwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXG5cdFx0LyoqXG5cdFx0KiBFdmVudCBmaXJlZCB3aGVuIHRoZSBwcml2YXRlIGNoYW5uZWwgaGFzIGl0cyBuYW1lIGNoYW5nZWRcblx0XHQqIHtcblx0XHQqIFx0dHlwZTogJ2dyb3VwX3JlbmFtZScsXG5cdFx0KiBcdGNoYW5uZWw6IHtcblx0XHQqIFx0XHRpZDogW2NoYW5uZWxfaWRdLFxuXHRcdCogXHRcdG5hbWU6IFtjaGFubmVsX25hbWVdLFxuXHRcdCogXHRcdGlzX2dyb3VwOiB0cnVlLFxuXHRcdCogXHRcdGNyZWF0ZWQ6IFt0c11cblx0XHQqIFx0fSxcblx0XHQqXHRldmVudF90czogW3RzLm1pbGxpXVxuXHRcdCogfVxuXHRcdCoqL1xuXHRcdHRoaXMucnRtLm9uKFJUTV9FVkVOVFMuR1JPVVBfUkVOQU1FLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHt9KSk7XG5cblx0XHQvKipcblx0XHQqIEV2ZW50IGZpcmVkIHdoZW4gYSBuZXcgdXNlciBqb2lucyB0aGUgdGVhbVxuXHRcdCoge1xuXHRcdCogXHR0eXBlOiAndGVhbV9qb2luJyxcblx0XHQqIFx0dXNlcjpcblx0XHQqIFx0e1xuXHRcdCogXHRcdGlkOiBbdXNlcl9pZF0sXG5cdFx0KiBcdFx0dGVhbV9pZDogW3RlYW1faWRdLFxuXHRcdCogXHRcdG5hbWU6IFt1c2VyX25hbWVdLFxuXHRcdCogXHRcdGRlbGV0ZWQ6IGZhbHNlLFxuXHRcdCogXHRcdHN0YXR1czogbnVsbCxcblx0XHQqIFx0XHRjb2xvcjogW2NvbG9yX2NvZGVdLFxuXHRcdCogXHRcdHJlYWxfbmFtZTogJycsXG5cdFx0KiBcdFx0dHo6IFt0aW1lem9uZV0sXG5cdFx0KiBcdFx0dHpfbGFiZWw6IFt0aW1lem9uZV9sYWJlbF0sXG5cdFx0KiBcdFx0dHpfb2Zmc2V0OiBbdGltZXpvbmVfb2Zmc2V0XSxcblx0XHQqIFx0XHRwcm9maWxlOlxuXHRcdCogXHRcdHtcblx0XHQqIFx0XHRcdGF2YXRhcl9oYXNoOiAnJyxcblx0XHQqIFx0XHRcdHJlYWxfbmFtZTogJycsXG5cdFx0KiBcdFx0XHRyZWFsX25hbWVfbm9ybWFsaXplZDogJycsXG5cdFx0KiBcdFx0XHRlbWFpbDogJycsXG5cdFx0KiBcdFx0XHRpbWFnZV8yNDogJycsXG5cdFx0KiBcdFx0XHRpbWFnZV8zMjogJycsXG5cdFx0KiBcdFx0XHRpbWFnZV80ODogJycsXG5cdFx0KiBcdFx0XHRpbWFnZV83MjogJycsXG5cdFx0KiBcdFx0XHRpbWFnZV8xOTI6ICcnLFxuXHRcdCogXHRcdFx0aW1hZ2VfNTEyOiAnJyxcblx0XHQqIFx0XHRcdGZpZWxkczogbnVsbFxuXHRcdCogXHRcdH0sXG5cdFx0KiBcdFx0aXNfYWRtaW46IGZhbHNlLFxuXHRcdCogXHRcdGlzX293bmVyOiBmYWxzZSxcblx0XHQqIFx0XHRpc19wcmltYXJ5X293bmVyOiBmYWxzZSxcblx0XHQqIFx0XHRpc19yZXN0cmljdGVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc191bHRyYV9yZXN0cmljdGVkOiBmYWxzZSxcblx0XHQqIFx0XHRpc19ib3Q6IGZhbHNlLFxuXHRcdCogXHRcdHByZXNlbmNlOiBbdXNlcl9wcmVzZW5jZV1cblx0XHQqIFx0fSxcblx0XHQqIFx0Y2FjaGVfdHM6IFt0c11cblx0XHQqIH1cblx0XHQqKi9cblx0XHR0aGlzLnJ0bS5vbihSVE1fRVZFTlRTLlRFQU1fSk9JTiwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7fSkpO1xuXHR9XG5cblx0ZmluZFNsYWNrQ2hhbm5lbChyb2NrZXRDaGFubmVsTmFtZSkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnU2VhcmNoaW5nIGZvciBTbGFjayBjaGFubmVsIG9yIGdyb3VwJywgcm9ja2V0Q2hhbm5lbE5hbWUpO1xuXHRcdGxldCByZXNwb25zZSA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhbm5lbHMubGlzdCcsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMpICYmIHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIHJlc3BvbnNlLmRhdGEuY2hhbm5lbHMpIHtcblx0XHRcdFx0aWYgKGNoYW5uZWwubmFtZSA9PT0gcm9ja2V0Q2hhbm5lbE5hbWUgJiYgY2hhbm5lbC5pc19tZW1iZXIgPT09IHRydWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gY2hhbm5lbDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXNwb25zZSA9IEhUVFAuZ2V0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvZ3JvdXBzLmxpc3QnLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhICYmIF8uaXNBcnJheShyZXNwb25zZS5kYXRhLmdyb3VwcykgJiYgcmVzcG9uc2UuZGF0YS5ncm91cHMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCBncm91cCBvZiByZXNwb25zZS5kYXRhLmdyb3Vwcykge1xuXHRcdFx0XHRpZiAoZ3JvdXAubmFtZSA9PT0gcm9ja2V0Q2hhbm5lbE5hbWUpIHtcblx0XHRcdFx0XHRyZXR1cm4gZ3JvdXA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpbXBvcnRGcm9tSGlzdG9yeShmYW1pbHksIG9wdGlvbnMpIHtcblx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ0ltcG9ydGluZyBtZXNzYWdlcyBoaXN0b3J5Jyk7XG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldChgaHR0cHM6Ly9zbGFjay5jb20vYXBpLyR7IGZhbWlseSB9Lmhpc3RvcnlgLCB7IHBhcmFtczogXy5leHRlbmQoeyB0b2tlbjogdGhpcy5hcGlUb2tlbiB9LCBvcHRpb25zKSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5tZXNzYWdlcykgJiYgcmVzcG9uc2UuZGF0YS5tZXNzYWdlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRsZXQgbGF0ZXN0ID0gMDtcblx0XHRcdGZvciAoY29uc3QgbWVzc2FnZSBvZiByZXNwb25zZS5kYXRhLm1lc3NhZ2VzLnJldmVyc2UoKSkge1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ01FU1NBR0U6ICcsIG1lc3NhZ2UpO1xuXHRcdFx0XHRpZiAoIWxhdGVzdCB8fCBtZXNzYWdlLnRzID4gbGF0ZXN0KSB7XG5cdFx0XHRcdFx0bGF0ZXN0ID0gbWVzc2FnZS50cztcblx0XHRcdFx0fVxuXHRcdFx0XHRtZXNzYWdlLmNoYW5uZWwgPSBvcHRpb25zLmNoYW5uZWw7XG5cdFx0XHRcdHRoaXMub25TbGFja01lc3NhZ2UobWVzc2FnZSwgdHJ1ZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4geyBoYXNfbW9yZTogcmVzcG9uc2UuZGF0YS5oYXNfbW9yZSwgdHM6IGxhdGVzdCB9O1xuXHRcdH1cblx0fVxuXG5cdGNvcHlTbGFja0NoYW5uZWxJbmZvKHJpZCwgY2hhbm5lbE1hcCkge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnQ29weWluZyB1c2VycyBmcm9tIFNsYWNrIGNoYW5uZWwgdG8gUm9ja2V0LkNoYXQnLCBjaGFubmVsTWFwLmlkLCByaWQpO1xuXHRcdGNvbnN0IHJlc3BvbnNlID0gSFRUUC5nZXQoYGh0dHBzOi8vc2xhY2suY29tL2FwaS8keyBjaGFubmVsTWFwLmZhbWlseSB9LmluZm9gLCB7IHBhcmFtczogeyB0b2tlbjogdGhpcy5hcGlUb2tlbiwgY2hhbm5lbDogY2hhbm5lbE1hcC5pZCB9IH0pO1xuXHRcdGlmIChyZXNwb25zZSAmJiByZXNwb25zZS5kYXRhKSB7XG5cdFx0XHRjb25zdCBkYXRhID0gY2hhbm5lbE1hcC5mYW1pbHkgPT09ICdjaGFubmVscycgPyByZXNwb25zZS5kYXRhLmNoYW5uZWwgOiByZXNwb25zZS5kYXRhLmdyb3VwO1xuXHRcdFx0aWYgKGRhdGEgJiYgXy5pc0FycmF5KGRhdGEubWVtYmVycykgJiYgZGF0YS5tZW1iZXJzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Zm9yIChjb25zdCBtZW1iZXIgb2YgZGF0YS5tZW1iZXJzKSB7XG5cdFx0XHRcdFx0Y29uc3QgdXNlciA9IHRoaXMuZmluZFJvY2tldFVzZXIobWVtYmVyKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIobWVtYmVyKTtcblx0XHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdBZGRpbmcgdXNlciB0byByb29tJywgdXNlci51c2VybmFtZSwgcmlkKTtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuYWRkVXNlclRvUm9vbShyaWQsIHVzZXIsIG51bGwsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgdG9waWMgPSAnJztcblx0XHRcdGxldCB0b3BpY19sYXN0X3NldCA9IDA7XG5cdFx0XHRsZXQgdG9waWNfY3JlYXRvciA9IG51bGw7XG5cdFx0XHRpZiAoZGF0YSAmJiBkYXRhLnRvcGljICYmIGRhdGEudG9waWMudmFsdWUpIHtcblx0XHRcdFx0dG9waWMgPSBkYXRhLnRvcGljLnZhbHVlO1xuXHRcdFx0XHR0b3BpY19sYXN0X3NldCA9IGRhdGEudG9waWMubGFzdF9zZXQ7XG5cdFx0XHRcdHRvcGljX2NyZWF0b3IgPSBkYXRhLnRvcGljLmNyZWF0b3I7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChkYXRhICYmIGRhdGEucHVycG9zZSAmJiBkYXRhLnB1cnBvc2UudmFsdWUpIHtcblx0XHRcdFx0aWYgKHRvcGljX2xhc3Rfc2V0KSB7XG5cdFx0XHRcdFx0aWYgKHRvcGljX2xhc3Rfc2V0IDwgZGF0YS5wdXJwb3NlLmxhc3Rfc2V0KSB7XG5cdFx0XHRcdFx0XHR0b3BpYyA9IGRhdGEucHVycG9zZS50b3BpYztcblx0XHRcdFx0XHRcdHRvcGljX2NyZWF0b3IgPSBkYXRhLnB1cnBvc2UuY3JlYXRvcjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dG9waWMgPSBkYXRhLnB1cnBvc2UudG9waWM7XG5cdFx0XHRcdFx0dG9waWNfY3JlYXRvciA9IGRhdGEucHVycG9zZS5jcmVhdG9yO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0b3BpYykge1xuXHRcdFx0XHRjb25zdCBjcmVhdG9yID0gdGhpcy5maW5kUm9ja2V0VXNlcih0b3BpY19jcmVhdG9yKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIodG9waWNfY3JlYXRvcik7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnU2V0dGluZyByb29tIHRvcGljJywgcmlkLCB0b3BpYywgY3JlYXRvci51c2VybmFtZSk7XG5cdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21Ub3BpYyhyaWQsIHRvcGljLCBjcmVhdG9yLCBmYWxzZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29weVBpbnMocmlkLCBjaGFubmVsTWFwKSB7XG5cdFx0Y29uc3QgcmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL3BpbnMubGlzdCcsIHsgcGFyYW1zOiB7IHRva2VuOiB0aGlzLmFwaVRva2VuLCBjaGFubmVsOiBjaGFubmVsTWFwLmlkIH0gfSk7XG5cdFx0aWYgKHJlc3BvbnNlICYmIHJlc3BvbnNlLmRhdGEgJiYgXy5pc0FycmF5KHJlc3BvbnNlLmRhdGEuaXRlbXMpICYmIHJlc3BvbnNlLmRhdGEuaXRlbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0Zm9yIChjb25zdCBwaW4gb2YgcmVzcG9uc2UuZGF0YS5pdGVtcykge1xuXHRcdFx0XHRpZiAocGluLm1lc3NhZ2UpIHtcblx0XHRcdFx0XHRjb25zdCB1c2VyID0gdGhpcy5maW5kUm9ja2V0VXNlcihwaW4ubWVzc2FnZS51c2VyKTtcblx0XHRcdFx0XHRjb25zdCBtc2dPYmogPSB7XG5cdFx0XHRcdFx0XHRyaWQsXG5cdFx0XHRcdFx0XHR0OiAnbWVzc2FnZV9waW5uZWQnLFxuXHRcdFx0XHRcdFx0bXNnOiAnJyxcblx0XHRcdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRhdHRhY2htZW50czogW3tcblx0XHRcdFx0XHRcdFx0J3RleHQnIDogdGhpcy5jb252ZXJ0U2xhY2tNc2dUeHRUb1JvY2tldFR4dEZvcm1hdChwaW4ubWVzc2FnZS50ZXh0KSxcblx0XHRcdFx0XHRcdFx0J2F1dGhvcl9uYW1lJyA6IHVzZXIudXNlcm5hbWUsXG5cdFx0XHRcdFx0XHRcdCdhdXRob3JfaWNvbicgOiBnZXRBdmF0YXJVcmxGcm9tVXNlcm5hbWUodXNlci51c2VybmFtZSksXG5cdFx0XHRcdFx0XHRcdCd0cycgOiBuZXcgRGF0ZShwYXJzZUludChwaW4ubWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHRcdFx0XHR9XVxuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5zZXRQaW5uZWRCeUlkQW5kVXNlcklkKGBzbGFjay0keyBwaW4uY2hhbm5lbCB9LSR7IHBpbi5tZXNzYWdlLnRzLnJlcGxhY2UoL1xcLi9nLCAnLScpIH1gLCBtc2dPYmoudSwgdHJ1ZSwgbmV3IERhdGUocGFyc2VJbnQocGluLm1lc3NhZ2UudHMuc3BsaXQoJy4nKVswXSkgKiAxMDAwKSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpbXBvcnRNZXNzYWdlcyhyaWQsIGNhbGxiYWNrKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmluZm8oJ2ltcG9ydE1lc3NhZ2VzOiAnLCByaWQpO1xuXHRcdGNvbnN0IHJvY2tldGNoYXRfcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cdFx0aWYgKHJvY2tldGNoYXRfcm9vbSkge1xuXHRcdFx0aWYgKHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0pIHtcblx0XHRcdFx0dGhpcy5jb3B5U2xhY2tDaGFubmVsSW5mbyhyaWQsIHRoaXMuc2xhY2tDaGFubmVsTWFwW3JpZF0pO1xuXG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnSW1wb3J0aW5nIG1lc3NhZ2VzIGZyb20gU2xhY2sgdG8gUm9ja2V0LkNoYXQnLCB0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyaWRdLCByaWQpO1xuXHRcdFx0XHRsZXQgcmVzdWx0cyA9IHRoaXMuaW1wb3J0RnJvbUhpc3RvcnkodGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXS5mYW1pbHksIHsgY2hhbm5lbDogdGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXS5pZCwgb2xkZXN0OiAxIH0pO1xuXHRcdFx0XHR3aGlsZSAocmVzdWx0cyAmJiByZXN1bHRzLmhhc19tb3JlKSB7XG5cdFx0XHRcdFx0cmVzdWx0cyA9IHRoaXMuaW1wb3J0RnJvbUhpc3RvcnkodGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXS5mYW1pbHksIHsgY2hhbm5lbDogdGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXS5pZCwgb2xkZXN0OiByZXN1bHRzLnRzIH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQaW5uaW5nIFNsYWNrIGNoYW5uZWwgbWVzc2FnZXMgdG8gUm9ja2V0LkNoYXQnLCB0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyaWRdLCByaWQpO1xuXHRcdFx0XHR0aGlzLmNvcHlQaW5zKHJpZCwgdGhpcy5zbGFja0NoYW5uZWxNYXBbcmlkXSk7XG5cblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBzbGFja19yb29tID0gdGhpcy5maW5kU2xhY2tDaGFubmVsKHJvY2tldGNoYXRfcm9vbS5uYW1lKTtcblx0XHRcdFx0aWYgKHNsYWNrX3Jvb20pIHtcblx0XHRcdFx0XHR0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyaWRdID0geyBpZDogc2xhY2tfcm9vbS5pZCwgZmFtaWx5OiBzbGFja19yb29tLmlkLmNoYXJBdCgwKSA9PT0gJ0MnID8gJ2NoYW5uZWxzJyA6ICdncm91cHMnIH07XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuaW1wb3J0TWVzc2FnZXMocmlkLCBjYWxsYmFjayk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmNsYXNzLmVycm9yKCdDb3VsZCBub3QgZmluZCBTbGFjayByb29tIHdpdGggc3BlY2lmaWVkIG5hbWUnLCByb2NrZXRjaGF0X3Jvb20ubmFtZSk7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXNsYWNrLXJvb20tbm90LWZvdW5kJywgJ0NvdWxkIG5vdCBmaW5kIFNsYWNrIHJvb20gd2l0aCBzcGVjaWZpZWQgbmFtZScpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2dnZXIuY2xhc3MuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIFJvY2tldC5DaGF0IHJvb20gd2l0aCBzcGVjaWZpZWQgaWQnLCByaWQpO1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nKSk7XG5cdFx0fVxuXHR9XG5cblx0cG9wdWxhdGVTbGFja0NoYW5uZWxNYXAoKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQb3B1bGF0aW5nIGNoYW5uZWwgbWFwJyk7XG5cdFx0bGV0IHJlc3BvbnNlID0gSFRUUC5nZXQoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9jaGFubmVscy5saXN0JywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5jaGFubmVscykgJiYgcmVzcG9uc2UuZGF0YS5jaGFubmVscy5sZW5ndGggPiAwKSB7XG5cdFx0XHRmb3IgKGNvbnN0IHNsYWNrQ2hhbm5lbCBvZiByZXNwb25zZS5kYXRhLmNoYW5uZWxzKSB7XG5cdFx0XHRcdGNvbnN0IHJvY2tldGNoYXRfcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeU5hbWUoc2xhY2tDaGFubmVsLm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXHRcdFx0XHRpZiAocm9ja2V0Y2hhdF9yb29tKSB7XG5cdFx0XHRcdFx0dGhpcy5zbGFja0NoYW5uZWxNYXBbcm9ja2V0Y2hhdF9yb29tLl9pZF0gPSB7IGlkOiBzbGFja0NoYW5uZWwuaWQsIGZhbWlseTogc2xhY2tDaGFubmVsLmlkLmNoYXJBdCgwKSA9PT0gJ0MnID8gJ2NoYW5uZWxzJyA6ICdncm91cHMnIH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmVzcG9uc2UgPSBIVFRQLmdldCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2dyb3Vwcy5saXN0JywgeyBwYXJhbXM6IHsgdG9rZW46IHRoaXMuYXBpVG9rZW4gfSB9KTtcblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiBfLmlzQXJyYXkocmVzcG9uc2UuZGF0YS5ncm91cHMpICYmIHJlc3BvbnNlLmRhdGEuZ3JvdXBzLmxlbmd0aCA+IDApIHtcblx0XHRcdGZvciAoY29uc3Qgc2xhY2tHcm91cCBvZiByZXNwb25zZS5kYXRhLmdyb3Vwcykge1xuXHRcdFx0XHRjb25zdCByb2NrZXRjaGF0X3Jvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHNsYWNrR3JvdXAubmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cdFx0XHRcdGlmIChyb2NrZXRjaGF0X3Jvb20pIHtcblx0XHRcdFx0XHR0aGlzLnNsYWNrQ2hhbm5lbE1hcFtyb2NrZXRjaGF0X3Jvb20uX2lkXSA9IHsgaWQ6IHNsYWNrR3JvdXAuaWQsIGZhbWlseTogc2xhY2tHcm91cC5pZC5jaGFyQXQoMCkgPT09ICdDJyA/ICdjaGFubmVscycgOiAnZ3JvdXBzJyB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0b25Sb2NrZXRNZXNzYWdlRGVsZXRlKHJvY2tldE1lc3NhZ2VEZWxldGVkKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdvblJvY2tldE1lc3NhZ2VEZWxldGUnLCByb2NrZXRNZXNzYWdlRGVsZXRlZCk7XG5cblx0XHR0aGlzLnBvc3REZWxldGVNZXNzYWdlVG9TbGFjayhyb2NrZXRNZXNzYWdlRGVsZXRlZCk7XG5cdH1cblxuXHRvblJvY2tldFNldFJlYWN0aW9uKHJvY2tldE1zZ0lELCByZWFjdGlvbikge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1Zygnb25Sb2NrZXRTZXRSZWFjdGlvbicpO1xuXG5cdFx0aWYgKHJvY2tldE1zZ0lEICYmIHJlYWN0aW9uKSB7XG5cdFx0XHRpZiAodGhpcy5yZWFjdGlvbnNNYXAuZGVsZXRlKGBzZXQkeyByb2NrZXRNc2dJRCB9JHsgcmVhY3Rpb24gfWApKSB7XG5cdFx0XHRcdC8vVGhpcyB3YXMgYSBTbGFjayByZWFjdGlvbiwgd2UgZG9uJ3QgbmVlZCB0byB0ZWxsIFNsYWNrIGFib3V0IGl0XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHJvY2tldE1zZ0lEKTtcblx0XHRcdGlmIChyb2NrZXRNc2cpIHtcblx0XHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5zbGFja0NoYW5uZWxNYXBbcm9ja2V0TXNnLnJpZF0uaWQ7XG5cdFx0XHRcdGNvbnN0IHNsYWNrVFMgPSB0aGlzLmdldFNsYWNrVFMocm9ja2V0TXNnKTtcblx0XHRcdFx0dGhpcy5wb3N0UmVhY3Rpb25BZGRlZFRvU2xhY2socmVhY3Rpb24ucmVwbGFjZSgvOi9nLCAnJyksIHNsYWNrQ2hhbm5lbCwgc2xhY2tUUyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0b25Sb2NrZXRVblNldFJlYWN0aW9uKHJvY2tldE1zZ0lELCByZWFjdGlvbikge1xuXHRcdGxvZ2dlci5jbGFzcy5kZWJ1Zygnb25Sb2NrZXRVblNldFJlYWN0aW9uJyk7XG5cblx0XHRpZiAocm9ja2V0TXNnSUQgJiYgcmVhY3Rpb24pIHtcblx0XHRcdGlmICh0aGlzLnJlYWN0aW9uc01hcC5kZWxldGUoYHVuc2V0JHsgcm9ja2V0TXNnSUQgfSR7IHJlYWN0aW9uIH1gKSkge1xuXHRcdFx0XHQvL1RoaXMgd2FzIGEgU2xhY2sgdW5zZXQgcmVhY3Rpb24sIHdlIGRvbid0IG5lZWQgdG8gdGVsbCBTbGFjayBhYm91dCBpdFxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IHJvY2tldE1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKHJvY2tldE1zZ0lEKTtcblx0XHRcdGlmIChyb2NrZXRNc2cpIHtcblx0XHRcdFx0Y29uc3Qgc2xhY2tDaGFubmVsID0gdGhpcy5zbGFja0NoYW5uZWxNYXBbcm9ja2V0TXNnLnJpZF0uaWQ7XG5cdFx0XHRcdGNvbnN0IHNsYWNrVFMgPSB0aGlzLmdldFNsYWNrVFMocm9ja2V0TXNnKTtcblx0XHRcdFx0dGhpcy5wb3N0UmVhY3Rpb25SZW1vdmVUb1NsYWNrKHJlYWN0aW9uLnJlcGxhY2UoLzovZywgJycpLCBzbGFja0NoYW5uZWwsIHNsYWNrVFMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdG9uUm9ja2V0TWVzc2FnZShyb2NrZXRNZXNzYWdlKSB7XG5cdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdvblJvY2tldE1lc3NhZ2UnLCByb2NrZXRNZXNzYWdlKTtcblxuXHRcdGlmIChyb2NrZXRNZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0XHQvL1RoaXMgaXMgYW4gRWRpdCBFdmVudFxuXHRcdFx0dGhpcy5wcm9jZXNzUm9ja2V0TWVzc2FnZUNoYW5nZWQocm9ja2V0TWVzc2FnZSk7XG5cdFx0XHRyZXR1cm4gcm9ja2V0TWVzc2FnZTtcblx0XHR9XG5cdFx0Ly8gSWdub3JlIG1lc3NhZ2VzIG9yaWdpbmF0aW5nIGZyb20gU2xhY2tcblx0XHRpZiAocm9ja2V0TWVzc2FnZS5faWQuaW5kZXhPZignc2xhY2stJykgPT09IDApIHtcblx0XHRcdHJldHVybiByb2NrZXRNZXNzYWdlO1xuXHRcdH1cblxuXHRcdC8vUHJvYmFibHkgYSBuZXcgbWVzc2FnZSBmcm9tIFJvY2tldC5DaGF0XG5cdFx0Y29uc3Qgb3V0U2xhY2tDaGFubmVscyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTbGFja0JyaWRnZV9PdXRfQWxsJykgPyBfLmtleXModGhpcy5zbGFja0NoYW5uZWxNYXApIDogXy5wbHVjayhSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU2xhY2tCcmlkZ2VfT3V0X0NoYW5uZWxzJyksICdfaWQnKSB8fCBbXTtcblx0XHQvL2xvZ2dlci5jbGFzcy5kZWJ1ZygnT3V0IFNsYWNrQ2hhbm5lbHM6ICcsIG91dFNsYWNrQ2hhbm5lbHMpO1xuXHRcdGlmIChvdXRTbGFja0NoYW5uZWxzLmluZGV4T2Yocm9ja2V0TWVzc2FnZS5yaWQpICE9PSAtMSkge1xuXHRcdFx0dGhpcy5wb3N0TWVzc2FnZVRvU2xhY2sodGhpcy5zbGFja0NoYW5uZWxNYXBbcm9ja2V0TWVzc2FnZS5yaWRdLCByb2NrZXRNZXNzYWdlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJvY2tldE1lc3NhZ2U7XG5cdH1cblxuXHQvKlxuXHQgaHR0cHM6Ly9hcGkuc2xhY2suY29tL21ldGhvZHMvcmVhY3Rpb25zLmFkZFxuXHQgKi9cblx0cG9zdFJlYWN0aW9uQWRkZWRUb1NsYWNrKHJlYWN0aW9uLCBzbGFja0NoYW5uZWwsIHNsYWNrVFMpIHtcblx0XHRpZiAocmVhY3Rpb24gJiYgc2xhY2tDaGFubmVsICYmIHNsYWNrVFMpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHRuYW1lOiByZWFjdGlvbixcblx0XHRcdFx0Y2hhbm5lbDogc2xhY2tDaGFubmVsLFxuXHRcdFx0XHR0aW1lc3RhbXA6IHNsYWNrVFNcblx0XHRcdH07XG5cblx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUG9zdGluZyBBZGQgUmVhY3Rpb24gdG8gU2xhY2snKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9yZWFjdGlvbnMuYWRkJywgeyBwYXJhbXM6IGRhdGEgfSk7XG5cdFx0XHRpZiAocG9zdFJlc3VsdC5zdGF0dXNDb2RlID09PSAyMDAgJiYgcG9zdFJlc3VsdC5kYXRhICYmIHBvc3RSZXN1bHQuZGF0YS5vayA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1JlYWN0aW9uIGFkZGVkIHRvIFNsYWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9tZXRob2RzL3JlYWN0aW9ucy5yZW1vdmVcblx0ICovXG5cdHBvc3RSZWFjdGlvblJlbW92ZVRvU2xhY2socmVhY3Rpb24sIHNsYWNrQ2hhbm5lbCwgc2xhY2tUUykge1xuXHRcdGlmIChyZWFjdGlvbiAmJiBzbGFja0NoYW5uZWwgJiYgc2xhY2tUUykge1xuXHRcdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdFx0dG9rZW46IHRoaXMuYXBpVG9rZW4sXG5cdFx0XHRcdG5hbWU6IHJlYWN0aW9uLFxuXHRcdFx0XHRjaGFubmVsOiBzbGFja0NoYW5uZWwsXG5cdFx0XHRcdHRpbWVzdGFtcDogc2xhY2tUU1xuXHRcdFx0fTtcblxuXHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQb3N0aW5nIFJlbW92ZSBSZWFjdGlvbiB0byBTbGFjaycpO1xuXHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL3JlYWN0aW9ucy5yZW1vdmUnLCB7IHBhcmFtczogZGF0YSB9KTtcblx0XHRcdGlmIChwb3N0UmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBwb3N0UmVzdWx0LmRhdGEgJiYgcG9zdFJlc3VsdC5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnUmVhY3Rpb24gcmVtb3ZlZCBmcm9tIFNsYWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cG9zdERlbGV0ZU1lc3NhZ2VUb1NsYWNrKHJvY2tldE1lc3NhZ2UpIHtcblx0XHRpZiAocm9ja2V0TWVzc2FnZSkge1xuXHRcdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdFx0dG9rZW46IHRoaXMuYXBpVG9rZW4sXG5cdFx0XHRcdHRzOiB0aGlzLmdldFNsYWNrVFMocm9ja2V0TWVzc2FnZSksXG5cdFx0XHRcdGNoYW5uZWw6IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldE1lc3NhZ2UucmlkXS5pZCxcblx0XHRcdFx0YXNfdXNlcjogdHJ1ZVxuXHRcdFx0fTtcblxuXHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQb3N0IERlbGV0ZSBNZXNzYWdlIHRvIFNsYWNrJywgZGF0YSk7XG5cdFx0XHRjb25zdCBwb3N0UmVzdWx0ID0gSFRUUC5wb3N0KCdodHRwczovL3NsYWNrLmNvbS9hcGkvY2hhdC5kZWxldGUnLCB7IHBhcmFtczogZGF0YSB9KTtcblx0XHRcdGlmIChwb3N0UmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBwb3N0UmVzdWx0LmRhdGEgJiYgcG9zdFJlc3VsdC5kYXRhLm9rID09PSB0cnVlKSB7XG5cdFx0XHRcdGxvZ2dlci5jbGFzcy5kZWJ1ZygnTWVzc2FnZSBkZWxldGVkIG9uIFNsYWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cG9zdE1lc3NhZ2VUb1NsYWNrKHNsYWNrQ2hhbm5lbCwgcm9ja2V0TWVzc2FnZSkge1xuXHRcdGlmIChzbGFja0NoYW5uZWwgJiYgc2xhY2tDaGFubmVsLmlkKSB7XG5cdFx0XHRsZXQgaWNvblVybCA9IGdldEF2YXRhclVybEZyb21Vc2VybmFtZShyb2NrZXRNZXNzYWdlLnUgJiYgcm9ja2V0TWVzc2FnZS51LnVzZXJuYW1lKTtcblx0XHRcdGlmIChpY29uVXJsKSB7XG5cdFx0XHRcdGljb25VcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9cXC8kLywgJycpICsgaWNvblVybDtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHR0ZXh0OiByb2NrZXRNZXNzYWdlLm1zZyxcblx0XHRcdFx0Y2hhbm5lbDogc2xhY2tDaGFubmVsLmlkLFxuXHRcdFx0XHR1c2VybmFtZTogcm9ja2V0TWVzc2FnZS51ICYmIHJvY2tldE1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0aWNvbl91cmw6IGljb25VcmwsXG5cdFx0XHRcdGxpbmtfbmFtZXM6IDFcblx0XHRcdH07XG5cdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1Bvc3QgTWVzc2FnZSBUbyBTbGFjaycsIGRhdGEpO1xuXHRcdFx0Y29uc3QgcG9zdFJlc3VsdCA9IEhUVFAucG9zdCgnaHR0cHM6Ly9zbGFjay5jb20vYXBpL2NoYXQucG9zdE1lc3NhZ2UnLCB7IHBhcmFtczogZGF0YSB9KTtcblx0XHRcdGlmIChwb3N0UmVzdWx0LnN0YXR1c0NvZGUgPT09IDIwMCAmJiBwb3N0UmVzdWx0LmRhdGEgJiYgcG9zdFJlc3VsdC5kYXRhLm1lc3NhZ2UgJiYgcG9zdFJlc3VsdC5kYXRhLm1lc3NhZ2UuYm90X2lkICYmIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLnRzKSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldFNsYWNrQm90SWRBbmRTbGFja1RzKHJvY2tldE1lc3NhZ2UuX2lkLCBwb3N0UmVzdWx0LmRhdGEubWVzc2FnZS5ib3RfaWQsIHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLnRzKTtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKGBSb2NrZXRNc2dJRD0keyByb2NrZXRNZXNzYWdlLl9pZCB9IFNsYWNrTXNnSUQ9JHsgcG9zdFJlc3VsdC5kYXRhLm1lc3NhZ2UudHMgfSBTbGFja0JvdElEPSR7IHBvc3RSZXN1bHQuZGF0YS5tZXNzYWdlLmJvdF9pZCB9YCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9tZXRob2RzL2NoYXQudXBkYXRlXG5cdCAqL1xuXHRwb3N0TWVzc2FnZVVwZGF0ZVRvU2xhY2soc2xhY2tDaGFubmVsLCByb2NrZXRNZXNzYWdlKSB7XG5cdFx0aWYgKHNsYWNrQ2hhbm5lbCAmJiBzbGFja0NoYW5uZWwuaWQpIHtcblx0XHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHRcdHRva2VuOiB0aGlzLmFwaVRva2VuLFxuXHRcdFx0XHR0czogdGhpcy5nZXRTbGFja1RTKHJvY2tldE1lc3NhZ2UpLFxuXHRcdFx0XHRjaGFubmVsOiBzbGFja0NoYW5uZWwuaWQsXG5cdFx0XHRcdHRleHQ6IHJvY2tldE1lc3NhZ2UubXNnLFxuXHRcdFx0XHRhc191c2VyOiB0cnVlXG5cdFx0XHR9O1xuXHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdQb3N0IFVwZGF0ZU1lc3NhZ2UgVG8gU2xhY2snLCBkYXRhKTtcblx0XHRcdGNvbnN0IHBvc3RSZXN1bHQgPSBIVFRQLnBvc3QoJ2h0dHBzOi8vc2xhY2suY29tL2FwaS9jaGF0LnVwZGF0ZScsIHsgcGFyYW1zOiBkYXRhIH0pO1xuXHRcdFx0aWYgKHBvc3RSZXN1bHQuc3RhdHVzQ29kZSA9PT0gMjAwICYmIHBvc3RSZXN1bHQuZGF0YSAmJiBwb3N0UmVzdWx0LmRhdGEub2sgPT09IHRydWUpIHtcblx0XHRcdFx0bG9nZ2VyLmNsYXNzLmRlYnVnKCdNZXNzYWdlIHVwZGF0ZWQgb24gU2xhY2snKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwcm9jZXNzUm9ja2V0TWVzc2FnZUNoYW5nZWQocm9ja2V0TWVzc2FnZSkge1xuXHRcdGlmIChyb2NrZXRNZXNzYWdlKSB7XG5cdFx0XHRpZiAocm9ja2V0TWVzc2FnZS51cGRhdGVkQnlTbGFjaykge1xuXHRcdFx0XHQvL1dlIGhhdmUgYWxyZWFkeSBwcm9jZXNzZWQgdGhpc1xuXHRcdFx0XHRkZWxldGUgcm9ja2V0TWVzc2FnZS51cGRhdGVkQnlTbGFjaztcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL1RoaXMgd2FzIGEgY2hhbmdlIGZyb20gUm9ja2V0LkNoYXRcblx0XHRcdGNvbnN0IHNsYWNrQ2hhbm5lbCA9IHRoaXMuc2xhY2tDaGFubmVsTWFwW3JvY2tldE1lc3NhZ2UucmlkXTtcblx0XHRcdHRoaXMucG9zdE1lc3NhZ2VVcGRhdGVUb1NsYWNrKHNsYWNrQ2hhbm5lbCwgcm9ja2V0TWVzc2FnZSk7XG5cdFx0fVxuXHR9XG5cblx0Lypcblx0IGh0dHBzOi8vYXBpLnNsYWNrLmNvbS9ldmVudHMvbWVzc2FnZS9tZXNzYWdlX2RlbGV0ZWRcblx0ICovXG5cdHByb2Nlc3NTbGFja01lc3NhZ2VEZWxldGVkKHNsYWNrTWVzc2FnZSkge1xuXHRcdGlmIChzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZSkge1xuXHRcdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbCA9IHRoaXMuZ2V0Um9ja2V0Q2hhbm5lbChzbGFja01lc3NhZ2UpO1xuXHRcdFx0Y29uc3Qgcm9ja2V0VXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKCdyb2NrZXQuY2F0JywgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfSB9KTtcblxuXHRcdFx0aWYgKHJvY2tldENoYW5uZWwgJiYgcm9ja2V0VXNlcikge1xuXHRcdFx0XHQvL0ZpbmQgdGhlIFJvY2tldCBtZXNzYWdlIHRvIGRlbGV0ZVxuXHRcdFx0XHRsZXQgcm9ja2V0TXNnT2JqID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXNcblx0XHRcdFx0XHQuZmluZE9uZUJ5U2xhY2tCb3RJZEFuZFNsYWNrVHMoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UuYm90X2lkLCBzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS50cyk7XG5cblx0XHRcdFx0aWYgKCFyb2NrZXRNc2dPYmopIHtcblx0XHRcdFx0XHQvL011c3QgaGF2ZSBiZWVuIGEgU2xhY2sgb3JpZ2luYXRlZCBtc2dcblx0XHRcdFx0XHRjb25zdCBfaWQgPSB0aGlzLmNyZWF0ZVJvY2tldElEKHNsYWNrTWVzc2FnZS5jaGFubmVsLCBzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS50cyk7XG5cdFx0XHRcdFx0cm9ja2V0TXNnT2JqID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQoX2lkKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChyb2NrZXRNc2dPYmopIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0LmRlbGV0ZU1lc3NhZ2Uocm9ja2V0TXNnT2JqLCByb2NrZXRVc2VyKTtcblx0XHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1JvY2tldCBtZXNzYWdlIGRlbGV0ZWQgYnkgU2xhY2snKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qXG5cdCBodHRwczovL2FwaS5zbGFjay5jb20vZXZlbnRzL21lc3NhZ2UvbWVzc2FnZV9jaGFuZ2VkXG5cdCAqL1xuXHRwcm9jZXNzU2xhY2tNZXNzYWdlQ2hhbmdlZChzbGFja01lc3NhZ2UpIHtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IGN1cnJlbnRNc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZCh0aGlzLmNyZWF0ZVJvY2tldElEKHNsYWNrTWVzc2FnZS5jaGFubmVsLCBzbGFja01lc3NhZ2UubWVzc2FnZS50cykpO1xuXG5cdFx0XHQvL09ubHkgcHJvY2VzcyB0aGlzIGNoYW5nZSwgaWYgaXRzIGFuIGFjdHVhbCB1cGRhdGUgKG5vdCBqdXN0IFNsYWNrIHJlcGVhdGluZyBiYWNrIG91ciBSb2NrZXQgb3JpZ2luYWwgY2hhbmdlKVxuXHRcdFx0aWYgKGN1cnJlbnRNc2cgJiYgKHNsYWNrTWVzc2FnZS5tZXNzYWdlLnRleHQgIT09IGN1cnJlbnRNc2cubXNnKSkge1xuXHRcdFx0XHRjb25zdCByb2NrZXRDaGFubmVsID0gdGhpcy5nZXRSb2NrZXRDaGFubmVsKHNsYWNrTWVzc2FnZSk7XG5cdFx0XHRcdGNvbnN0IHJvY2tldFVzZXIgPSBzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS51c2VyID8gdGhpcy5maW5kUm9ja2V0VXNlcihzbGFja01lc3NhZ2UucHJldmlvdXNfbWVzc2FnZS51c2VyKSB8fCB0aGlzLmFkZFJvY2tldFVzZXIoc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudXNlcikgOiBudWxsO1xuXG5cdFx0XHRcdGNvbnN0IHJvY2tldE1zZ09iaiA9IHtcblx0XHRcdFx0XHQvL0BUT0RPIF9pZFxuXHRcdFx0XHRcdF9pZDogdGhpcy5jcmVhdGVSb2NrZXRJRChzbGFja01lc3NhZ2UuY2hhbm5lbCwgc2xhY2tNZXNzYWdlLnByZXZpb3VzX21lc3NhZ2UudHMpLFxuXHRcdFx0XHRcdHJpZDogcm9ja2V0Q2hhbm5lbC5faWQsXG5cdFx0XHRcdFx0bXNnOiB0aGlzLmNvbnZlcnRTbGFja01zZ1R4dFRvUm9ja2V0VHh0Rm9ybWF0KHNsYWNrTWVzc2FnZS5tZXNzYWdlLnRleHQpLFxuXHRcdFx0XHRcdHVwZGF0ZWRCeVNsYWNrOiB0cnVlXHQvL1dlIGRvbid0IHdhbnQgdG8gbm90aWZ5IHNsYWNrIGFib3V0IHRoaXMgY2hhbmdlIHNpbmNlIFNsYWNrIGluaXRpYXRlZCBpdFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFJvY2tldENoYXQudXBkYXRlTWVzc2FnZShyb2NrZXRNc2dPYmosIHJvY2tldFVzZXIpO1xuXHRcdFx0XHRsb2dnZXIuY2xhc3MuZGVidWcoJ1JvY2tldCBtZXNzYWdlIHVwZGF0ZWQgYnkgU2xhY2snKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgVGhpcyBtZXRob2Qgd2lsbCBnZXQgcmVmYWN0b3JlZCBhbmQgYnJva2VuIGRvd24gaW50byBzaW5nbGUgcmVzcG9uc2liaWxpdGllc1xuXHQgKi9cblx0cHJvY2Vzc1NsYWNrTmV3TWVzc2FnZShzbGFja01lc3NhZ2UsIGlzSW1wb3J0aW5nKSB7XG5cdFx0Y29uc3Qgcm9ja2V0Q2hhbm5lbCA9IHRoaXMuZ2V0Um9ja2V0Q2hhbm5lbChzbGFja01lc3NhZ2UpO1xuXHRcdGxldCByb2NrZXRVc2VyID0gbnVsbDtcblx0XHRpZiAoc2xhY2tNZXNzYWdlLnN1YnR5cGUgPT09ICdib3RfbWVzc2FnZScpIHtcblx0XHRcdHJvY2tldFVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCgncm9ja2V0LmNhdCcsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH0gfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJvY2tldFVzZXIgPSBzbGFja01lc3NhZ2UudXNlciA/IHRoaXMuZmluZFJvY2tldFVzZXIoc2xhY2tNZXNzYWdlLnVzZXIpIHx8IHRoaXMuYWRkUm9ja2V0VXNlcihzbGFja01lc3NhZ2UudXNlcikgOiBudWxsO1xuXHRcdH1cblx0XHRpZiAocm9ja2V0Q2hhbm5lbCAmJiByb2NrZXRVc2VyKSB7XG5cdFx0XHRjb25zdCBtc2dEYXRhRGVmYXVsdHMgPSB7XG5cdFx0XHRcdF9pZDogdGhpcy5jcmVhdGVSb2NrZXRJRChzbGFja01lc3NhZ2UuY2hhbm5lbCwgc2xhY2tNZXNzYWdlLnRzKSxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKHBhcnNlSW50KHNsYWNrTWVzc2FnZS50cy5zcGxpdCgnLicpWzBdKSAqIDEwMDApXG5cdFx0XHR9O1xuXHRcdFx0aWYgKGlzSW1wb3J0aW5nKSB7XG5cdFx0XHRcdG1zZ0RhdGFEZWZhdWx0c1snaW1wb3J0ZWQnXSA9ICdzbGFja2JyaWRnZSc7XG5cdFx0XHR9XG5cdFx0XHR0cnkge1xuXHRcdFx0XHR0aGlzLmNyZWF0ZUFuZFNhdmVSb2NrZXRNZXNzYWdlKHJvY2tldENoYW5uZWwsIHJvY2tldFVzZXIsIHNsYWNrTWVzc2FnZSwgbXNnRGF0YURlZmF1bHRzLCBpc0ltcG9ydGluZyk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdC8vIGh0dHA6Ly93d3cubW9uZ29kYi5vcmcvYWJvdXQvY29udHJpYnV0b3JzL2Vycm9yLWNvZGVzL1xuXHRcdFx0XHQvLyAxMTAwMCA9PSBkdXBsaWNhdGUga2V5IGVycm9yXG5cdFx0XHRcdGlmIChlLm5hbWUgPT09ICdNb25nb0Vycm9yJyAmJiBlLmNvZGUgPT09IDExMDAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBTbGFjayBUUyBmcm9tIGEgUm9ja2V0IG1zZyB0aGF0IG9yaWdpbmF0ZWQgZnJvbSBTbGFja1xuXHQgKiBAcGFyYW0gcm9ja2V0TXNnXG5cdCAqIEByZXR1cm5zIFNsYWNrIFRTIG9yIHVuZGVmaW5lZCBpZiBub3QgYSBtZXNzYWdlIHRoYXQgb3JpZ2luYXRlZCBmcm9tIHNsYWNrXG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRnZXRTbGFja1RTKHJvY2tldE1zZykge1xuXHRcdC8vc2xhY2stRzNLSkdHRTE1LTE0ODMwODEwNjEtMDAwMTY5XG5cdFx0bGV0IHNsYWNrVFM7XG5cdFx0bGV0IGluZGV4ID0gcm9ja2V0TXNnLl9pZC5pbmRleE9mKCdzbGFjay0nKTtcblx0XHRpZiAoaW5kZXggPT09IDApIHtcblx0XHRcdC8vVGhpcyBpcyBhIG1zZyB0aGF0IG9yaWdpbmF0ZWQgZnJvbSBTbGFja1xuXHRcdFx0c2xhY2tUUyA9IHJvY2tldE1zZy5faWQuc3Vic3RyKDYsIHJvY2tldE1zZy5faWQubGVuZ3RoKTtcblx0XHRcdGluZGV4ID0gc2xhY2tUUy5pbmRleE9mKCctJyk7XG5cdFx0XHRzbGFja1RTID0gc2xhY2tUUy5zdWJzdHIoaW5kZXgrMSwgc2xhY2tUUy5sZW5ndGgpO1xuXHRcdFx0c2xhY2tUUyA9IHNsYWNrVFMucmVwbGFjZSgnLScsICcuJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vVGhpcyBwcm9iYWJseSBvcmlnaW5hdGVkIGFzIGEgUm9ja2V0IG1zZywgYnV0IGhhcyBiZWVuIHNlbnQgdG8gU2xhY2tcblx0XHRcdHNsYWNrVFMgPSByb2NrZXRNc2cuc2xhY2tUcztcblx0XHR9XG5cblx0XHRyZXR1cm4gc2xhY2tUUztcblx0fVxuXG5cdGdldFJvY2tldENoYW5uZWwoc2xhY2tNZXNzYWdlKSB7XG5cdFx0cmV0dXJuIHNsYWNrTWVzc2FnZS5jaGFubmVsID8gdGhpcy5maW5kUm9ja2V0Q2hhbm5lbChzbGFja01lc3NhZ2UuY2hhbm5lbCkgfHwgdGhpcy5hZGRSb2NrZXRDaGFubmVsKHNsYWNrTWVzc2FnZS5jaGFubmVsKSA6IG51bGw7XG5cdH1cblxuXHRnZXRSb2NrZXRVc2VyKHNsYWNrVXNlcikge1xuXHRcdHJldHVybiBzbGFja1VzZXIgPyB0aGlzLmZpbmRSb2NrZXRVc2VyKHNsYWNrVXNlcikgfHwgdGhpcy5hZGRSb2NrZXRVc2VyKHNsYWNrVXNlcikgOiBudWxsO1xuXHR9XG5cblx0Y3JlYXRlUm9ja2V0SUQoc2xhY2tDaGFubmVsLCB0cykge1xuXHRcdHJldHVybiBgc2xhY2stJHsgc2xhY2tDaGFubmVsIH0tJHsgdHMucmVwbGFjZSgvXFwuL2csICctJykgfWA7XG5cdH1cblxufVxuXG5Sb2NrZXRDaGF0LlNsYWNrQnJpZGdlID0gbmV3IFNsYWNrQnJpZGdlO1xuIiwiLyogZ2xvYmFscyBtc2dTdHJlYW0gKi9cbmZ1bmN0aW9uIFNsYWNrQnJpZGdlSW1wb3J0KGNvbW1hbmQsIHBhcmFtcywgaXRlbSkge1xuXHRpZiAoY29tbWFuZCAhPT0gJ3NsYWNrYnJpZGdlLWltcG9ydCcgfHwgIU1hdGNoLnRlc3QocGFyYW1zLCBTdHJpbmcpKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGl0ZW0ucmlkKTtcblx0Y29uc3QgY2hhbm5lbCA9IHJvb20ubmFtZTtcblx0Y29uc3QgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKE1ldGVvci51c2VySWQoKSk7XG5cblx0bXNnU3RyZWFtLmVtaXQoaXRlbS5yaWQsIHtcblx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0dTogeyB1c2VybmFtZTogJ3JvY2tldC5jYXQnIH0sXG5cdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0bXNnOiBUQVBpMThuLl9fKCdTbGFja0JyaWRnZV9zdGFydCcsIHtcblx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRzcHJpbnRmOiBbdXNlci51c2VybmFtZSwgY2hhbm5lbF1cblx0XHR9LCB1c2VyLmxhbmd1YWdlKVxuXHR9KTtcblxuXHR0cnkge1xuXHRcdFJvY2tldENoYXQuU2xhY2tCcmlkZ2UuaW1wb3J0TWVzc2FnZXMoaXRlbS5yaWQsIGVycm9yID0+IHtcblx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRtc2dTdHJlYW0uZW1pdChpdGVtLnJpZCwge1xuXHRcdFx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRcdFx0cmlkOiBpdGVtLnJpZCxcblx0XHRcdFx0XHR1OiB7IHVzZXJuYW1lOiAncm9ja2V0LmNhdCcgfSxcblx0XHRcdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdFx0XHRtc2c6IFRBUGkxOG4uX18oJ1NsYWNrQnJpZGdlX2Vycm9yJywge1xuXHRcdFx0XHRcdFx0cG9zdFByb2Nlc3M6ICdzcHJpbnRmJyxcblx0XHRcdFx0XHRcdHNwcmludGY6IFtjaGFubmVsLCBlcnJvci5tZXNzYWdlXVxuXHRcdFx0XHRcdH0sIHVzZXIubGFuZ3VhZ2UpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bXNnU3RyZWFtLmVtaXQoaXRlbS5yaWQsIHtcblx0XHRcdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHRcdHJpZDogaXRlbS5yaWQsXG5cdFx0XHRcdFx0dTogeyB1c2VybmFtZTogJ3JvY2tldC5jYXQnIH0sXG5cdFx0XHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRcdFx0bXNnOiBUQVBpMThuLl9fKCdTbGFja0JyaWRnZV9maW5pc2gnLCB7XG5cdFx0XHRcdFx0XHRwb3N0UHJvY2VzczogJ3NwcmludGYnLFxuXHRcdFx0XHRcdFx0c3ByaW50ZjogW2NoYW5uZWxdXG5cdFx0XHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0bXNnU3RyZWFtLmVtaXQoaXRlbS5yaWQsIHtcblx0XHRcdF9pZDogUmFuZG9tLmlkKCksXG5cdFx0XHRyaWQ6IGl0ZW0ucmlkLFxuXHRcdFx0dTogeyB1c2VybmFtZTogJ3JvY2tldC5jYXQnIH0sXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdG1zZzogVEFQaTE4bi5fXygnU2xhY2tCcmlkZ2VfZXJyb3InLCB7XG5cdFx0XHRcdHBvc3RQcm9jZXNzOiAnc3ByaW50ZicsXG5cdFx0XHRcdHNwcmludGY6IFtjaGFubmVsLCBlcnJvci5tZXNzYWdlXVxuXHRcdFx0fSwgdXNlci5sYW5ndWFnZSlcblx0XHR9KTtcblx0XHR0aHJvdyBlcnJvcjtcblx0fVxuXHRyZXR1cm4gU2xhY2tCcmlkZ2VJbXBvcnQ7XG59XG5cblJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5hZGQoJ3NsYWNrYnJpZGdlLWltcG9ydCcsIFNsYWNrQnJpZGdlSW1wb3J0KTtcbiJdfQ==
