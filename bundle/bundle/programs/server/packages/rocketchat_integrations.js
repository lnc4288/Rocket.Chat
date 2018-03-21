(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var Babel = Package['babel-compiler'].Babel;
var BabelCompiler = Package['babel-compiler'].BabelCompiler;
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
var logger, integration, Api, message;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:integrations":{"lib":{"rocketchat.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/lib/rocketchat.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.integrations = {
  outgoingEvents: {
    sendMessage: {
      label: 'Integrations_Outgoing_Type_SendMessage',
      value: 'sendMessage',
      use: {
        channel: true,
        triggerWords: true,
        targetRoom: false
      }
    },
    fileUploaded: {
      label: 'Integrations_Outgoing_Type_FileUploaded',
      value: 'fileUploaded',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomArchived: {
      label: 'Integrations_Outgoing_Type_RoomArchived',
      value: 'roomArchived',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomCreated: {
      label: 'Integrations_Outgoing_Type_RoomCreated',
      value: 'roomCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomJoined: {
      label: 'Integrations_Outgoing_Type_RoomJoined',
      value: 'roomJoined',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    roomLeft: {
      label: 'Integrations_Outgoing_Type_RoomLeft',
      value: 'roomLeft',
      use: {
        channel: true,
        triggerWords: false,
        targetRoom: false
      }
    },
    userCreated: {
      label: 'Integrations_Outgoing_Type_UserCreated',
      value: 'userCreated',
      use: {
        channel: false,
        triggerWords: false,
        targetRoom: true
      }
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"logger.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/logger.js                                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals logger:true */

/* exported logger */
logger = new Logger('Integrations', {
  sections: {
    incoming: 'Incoming WebHook',
    outgoing: 'Outgoing WebHook'
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"validation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/validation.js                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const scopedChannels = ['all_public_channels', 'all_private_groups', 'all_direct_messages'];
const validChannelChars = ['@', '#'];

function _verifyRequiredFields(integration) {
  if (!integration.event || !Match.test(integration.event, String) || integration.event.trim() === '' || !RocketChat.integrations.outgoingEvents[integration.event]) {
    throw new Meteor.Error('error-invalid-event-type', 'Invalid event type', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!integration.username || !Match.test(integration.username, String) || integration.username.trim() === '') {
    throw new Meteor.Error('error-invalid-username', 'Invalid username', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.targetRoom && !integration.targetRoom) {
    throw new Meteor.Error('error-invalid-targetRoom', 'Invalid Target Room', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  if (!Match.test(integration.urls, [String])) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }

  for (const [index, url] of integration.urls.entries()) {
    if (url.trim() === '') {
      delete integration.urls[index];
    }
  }

  integration.urls = _.without(integration.urls, [undefined]);

  if (integration.urls.length === 0) {
    throw new Meteor.Error('error-invalid-urls', 'Invalid URLs', {
      function: 'validateOutgoing._verifyRequiredFields'
    });
  }
}

function _verifyUserHasPermissionForChannels(integration, userId, channels) {
  for (let channel of channels) {
    if (scopedChannels.includes(channel)) {
      if (channel === 'all_public_channels') {// No special permissions needed to add integration to public channels
      } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    } else {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(userId, 'manage-integrations') && RocketChat.authz.hasPermission(userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          function: 'validateOutgoing._verifyUserHasPermissionForChannels'
        });
      }
    }
  }
}

function _verifyRetryInformation(integration) {
  if (!integration.retryFailedCalls) {
    return;
  } // Don't allow negative retry counts


  integration.retryCount = integration.retryCount && parseInt(integration.retryCount) > 0 ? parseInt(integration.retryCount) : 4;
  integration.retryDelay = !integration.retryDelay || !integration.retryDelay.trim() ? 'powers-of-ten' : integration.retryDelay.toLowerCase();
}

RocketChat.integrations.validateOutgoing = function _validateOutgoing(integration, userId) {
  if (integration.channel && Match.test(integration.channel, String) && integration.channel.trim() === '') {
    delete integration.channel;
  } //Moved to it's own function to statisfy the complexity rule


  _verifyRequiredFields(integration);

  let channels = [];

  if (RocketChat.integrations.outgoingEvents[integration.event].use.channel) {
    if (!Match.test(integration.channel, String)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
        function: 'validateOutgoing'
      });
    } else {
      channels = _.map(integration.channel.split(','), channel => s.trim(channel));

      for (const channel of channels) {
        if (!validChannelChars.includes(channel[0]) && !scopedChannels.includes(channel.toLowerCase())) {
          throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
            function: 'validateOutgoing'
          });
        }
      }
    }
  } else if (!RocketChat.authz.hasPermission(userId, 'manage-integrations')) {
    throw new Meteor.Error('error-invalid-permissions', 'Invalid permission for required Integration creation.', {
      function: 'validateOutgoing'
    });
  }

  if (RocketChat.integrations.outgoingEvents[integration.event].use.triggerWords && integration.triggerWords) {
    if (!Match.test(integration.triggerWords, [String])) {
      throw new Meteor.Error('error-invalid-triggerWords', 'Invalid triggerWords', {
        function: 'validateOutgoing'
      });
    }

    integration.triggerWords.forEach((word, index) => {
      if (!word || word.trim() === '') {
        delete integration.triggerWords[index];
      }
    });
    integration.triggerWords = _.without(integration.triggerWords, [undefined]);
  } else {
    delete integration.triggerWords;
  }

  if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
    try {
      const babelOptions = Object.assign(Babel.getDefaultOptions({
        runtime: false
      }), {
        compact: true,
        minified: true,
        comments: false
      });
      integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
      integration.scriptError = undefined;
    } catch (e) {
      integration.scriptCompiled = undefined;
      integration.scriptError = _.pick(e, 'name', 'message', 'stack');
    }
  }

  if (typeof integration.runOnEdits !== 'undefined') {
    // Verify this value is only true/false
    integration.runOnEdits = integration.runOnEdits === true;
  }

  _verifyUserHasPermissionForChannels(integration, userId, channels);

  _verifyRetryInformation(integration);

  const user = RocketChat.models.Users.findOne({
    username: integration.username
  });

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user (did you delete the `rocket.cat` user?)', {
      function: 'validateOutgoing'
    });
  }

  integration.type = 'webhook-outgoing';
  integration.userId = user._id;
  integration.channel = channels;
  return integration;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"triggerHandler.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/lib/triggerHandler.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 2);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 3);
RocketChat.integrations.triggerHandler = new class RocketChatIntegrationHandler {
  constructor() {
    this.vm = vm;
    this.successResults = [200, 201, 202];
    this.compiledScripts = {};
    this.triggers = {};
    RocketChat.models.Integrations.find({
      type: 'webhook-outgoing'
    }).observe({
      added: record => {
        this.addIntegration(record);
      },
      changed: record => {
        this.removeIntegration(record);
        this.addIntegration(record);
      },
      removed: record => {
        this.removeIntegration(record);
      }
    });
  }

  addIntegration(record) {
    logger.outgoing.debug(`Adding the integration ${record.name} of the event ${record.event}!`);
    let channels;

    if (record.event && !RocketChat.integrations.outgoingEvents[record.event].use.channel) {
      logger.outgoing.debug('The integration doesnt rely on channels.'); //We don't use any channels, so it's special ;)

      channels = ['__any'];
    } else if (_.isEmpty(record.channel)) {
      logger.outgoing.debug('The integration had an empty channel property, so it is going on all the public channels.');
      channels = ['all_public_channels'];
    } else {
      logger.outgoing.debug('The integration is going on these channels:', record.channel);
      channels = [].concat(record.channel);
    }

    for (const channel of channels) {
      if (!this.triggers[channel]) {
        this.triggers[channel] = {};
      }

      this.triggers[channel][record._id] = record;
    }
  }

  removeIntegration(record) {
    for (const trigger of Object.values(this.triggers)) {
      delete trigger[record._id];
    }
  }

  isTriggerEnabled(trigger) {
    for (const trig of Object.values(this.triggers)) {
      if (trig[trigger._id]) {
        return trig[trigger._id].enabled;
      }
    }

    return false;
  }

  updateHistory({
    historyId,
    step,
    integration,
    event,
    data,
    triggerWord,
    ranPrepareScript,
    prepareSentMessage,
    processSentMessage,
    resultMessage,
    finished,
    url,
    httpCallData,
    httpError,
    httpResult,
    error,
    errorStack
  }) {
    const history = {
      type: 'outgoing-webhook',
      step
    }; // Usually is only added on initial insert

    if (integration) {
      history.integration = integration;
    } // Usually is only added on initial insert


    if (event) {
      history.event = event;
    }

    if (data) {
      history.data = data;

      if (data.user) {
        history.data.user = _.omit(data.user, ['meta', '$loki', 'services']);
      }

      if (data.room) {
        history.data.room = _.omit(data.room, ['meta', '$loki', 'usernames']);
        history.data.room.usernames = ['this_will_be_filled_in_with_usernames_when_replayed'];
      }
    }

    if (triggerWord) {
      history.triggerWord = triggerWord;
    }

    if (typeof ranPrepareScript !== 'undefined') {
      history.ranPrepareScript = ranPrepareScript;
    }

    if (prepareSentMessage) {
      history.prepareSentMessage = prepareSentMessage;
    }

    if (processSentMessage) {
      history.processSentMessage = processSentMessage;
    }

    if (resultMessage) {
      history.resultMessage = resultMessage;
    }

    if (typeof finished !== 'undefined') {
      history.finished = finished;
    }

    if (url) {
      history.url = url;
    }

    if (typeof httpCallData !== 'undefined') {
      history.httpCallData = httpCallData;
    }

    if (httpError) {
      history.httpError = httpError;
    }

    if (typeof httpResult !== 'undefined') {
      history.httpResult = JSON.stringify(httpResult, null, 2);
    }

    if (typeof error !== 'undefined') {
      history.error = error;
    }

    if (typeof errorStack !== 'undefined') {
      history.errorStack = errorStack;
    }

    if (historyId) {
      RocketChat.models.IntegrationHistory.update({
        _id: historyId
      }, {
        $set: history
      });
      return historyId;
    } else {
      history._createdAt = new Date();
      return RocketChat.models.IntegrationHistory.insert(Object.assign({
        _id: Random.id()
      }, history));
    }
  } //Trigger is the trigger, nameOrId is a string which is used to try and find a room, room is a room, message is a message, and data contains "user_name" if trigger.impersonateUser is truthful.


  sendMessage({
    trigger,
    nameOrId = '',
    room,
    message,
    data
  }) {
    let user; //Try to find the user who we are impersonating

    if (trigger.impersonateUser) {
      user = RocketChat.models.Users.findOneByUsername(data.user_name);
    } //If they don't exist (aka the trigger didn't contain a user) then we set the user based upon the
    //configured username for the integration since this is required at all times.


    if (!user) {
      user = RocketChat.models.Users.findOneByUsername(trigger.username);
    }

    let tmpRoom;

    if (nameOrId || trigger.targetRoom || message.channel) {
      tmpRoom = RocketChat.getRoomByNameOrIdWithOptionToJoin({
        currentUserId: user._id,
        nameOrId: nameOrId || message.channel || trigger.targetRoom,
        errorOnEmpty: false
      }) || room;
    } else {
      tmpRoom = room;
    } //If no room could be found, we won't be sending any messages but we'll warn in the logs


    if (!tmpRoom) {
      logger.outgoing.warn(`The Integration "${trigger.name}" doesn't have a room configured nor did it provide a room to send the message to.`);
      return;
    }

    logger.outgoing.debug(`Found a room for ${trigger.name} which is: ${tmpRoom.name} with a type of ${tmpRoom.t}`);
    message.bot = {
      i: trigger._id
    };
    const defaultValues = {
      alias: trigger.alias,
      avatar: trigger.avatar,
      emoji: trigger.emoji
    };

    if (tmpRoom.t === 'd') {
      message.channel = `@${tmpRoom._id}`;
    } else {
      message.channel = `#${tmpRoom._id}`;
    }

    message = processWebhookMessage(message, user, defaultValues);
    return message;
  }

  buildSandbox(store = {}) {
    const sandbox = {
      _,
      s,
      console,
      moment,
      Store: {
        set: (key, val) => store[key] = val,
        get: key => store[key]
      },
      HTTP: (method, url, options) => {
        try {
          return {
            result: HTTP.call(method, url, options)
          };
        } catch (error) {
          return {
            error
          };
        }
      }
    };
    Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => {
      sandbox[k] = RocketChat.models[k];
    });
    return {
      store,
      sandbox
    };
  }

  getIntegrationScript(integration) {
    const compiledScript = this.compiledScripts[integration._id];

    if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
      return compiledScript.script;
    }

    const script = integration.scriptCompiled;
    const {
      store,
      sandbox
    } = this.buildSandbox();
    let vmScript;

    try {
      logger.outgoing.info('Will evaluate script of Trigger', integration.name);
      logger.outgoing.debug(script);
      vmScript = this.vm.createScript(script, 'script.js');
      vmScript.runInNewContext(sandbox);

      if (sandbox.Script) {
        this.compiledScripts[integration._id] = {
          script: new sandbox.Script(),
          store,
          _updatedAt: integration._updatedAt
        };
        return this.compiledScripts[integration._id].script;
      }
    } catch (e) {
      logger.outgoing.error(`Error evaluating Script in Trigger ${integration.name}:`);
      logger.outgoing.error(script.replace(/^/gm, '  '));
      logger.outgoing.error('Stack Trace:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      throw new Meteor.Error('error-evaluating-script');
    }

    if (!sandbox.Script) {
      logger.outgoing.error(`Class "Script" not in Trigger ${integration.name}:`);
      throw new Meteor.Error('class-script-not-found');
    }
  }

  hasScriptAndMethod(integration, method) {
    if (integration.scriptEnabled !== true || !integration.scriptCompiled || integration.scriptCompiled.trim() === '') {
      return false;
    }

    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      return false;
    }

    return typeof script[method] !== 'undefined';
  }

  executeScript(integration, method, params, historyId) {
    let script;

    try {
      script = this.getIntegrationScript(integration);
    } catch (e) {
      this.updateHistory({
        historyId,
        step: 'execute-script-getting-script',
        error: true,
        errorStack: e
      });
      return;
    }

    if (!script[method]) {
      logger.outgoing.error(`Method "${method}" no found in the Integration "${integration.name}"`);
      this.updateHistory({
        historyId,
        step: `execute-script-no-method-${method}`
      });
      return;
    }

    try {
      const {
        sandbox
      } = this.buildSandbox(this.compiledScripts[integration._id].store);
      sandbox.script = script;
      sandbox.method = method;
      sandbox.params = params;
      this.updateHistory({
        historyId,
        step: `execute-script-before-running-${method}`
      });
      const result = this.vm.runInNewContext('script[method](params)', sandbox, {
        timeout: 3000
      });
      logger.outgoing.debug(`Script method "${method}" result of the Integration "${integration.name}" is:`);
      logger.outgoing.debug(result);
      return result;
    } catch (e) {
      this.updateHistory({
        historyId,
        step: `execute-script-error-running-${method}`,
        error: true,
        errorStack: e.stack.replace(/^/gm, '  ')
      });
      logger.outgoing.error(`Error running Script in the Integration ${integration.name}:`);
      logger.outgoing.debug(integration.scriptCompiled.replace(/^/gm, '  ')); // Only output the compiled script if debugging is enabled, so the logs don't get spammed.

      logger.outgoing.error('Stack:');
      logger.outgoing.error(e.stack.replace(/^/gm, '  '));
      return;
    }
  }

  eventNameArgumentsToObject() {
    const argObject = {
      event: arguments[0]
    };

    switch (argObject.event) {
      case 'sendMessage':
        if (arguments.length >= 3) {
          argObject.message = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'fileUploaded':
        if (arguments.length >= 2) {
          const arghhh = arguments[1];
          argObject.user = arghhh.user;
          argObject.room = arghhh.room;
          argObject.message = arghhh.message;
        }

        break;

      case 'roomArchived':
        if (arguments.length >= 3) {
          argObject.room = arguments[1];
          argObject.user = arguments[2];
        }

        break;

      case 'roomCreated':
        if (arguments.length >= 3) {
          argObject.owner = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'roomJoined':
      case 'roomLeft':
        if (arguments.length >= 3) {
          argObject.user = arguments[1];
          argObject.room = arguments[2];
        }

        break;

      case 'userCreated':
        if (arguments.length >= 2) {
          argObject.user = arguments[1];
        }

        break;

      default:
        logger.outgoing.warn(`An Unhandled Trigger Event was called: ${argObject.event}`);
        argObject.event = undefined;
        break;
    }

    logger.outgoing.debug(`Got the event arguments for the event: ${argObject.event}`, argObject);
    return argObject;
  }

  mapEventArgsToData(data, {
    event,
    message,
    room,
    owner,
    user
  }) {
    switch (event) {
      case 'sendMessage':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        if (message.editedAt) {
          data.isEdited = true;
        }

        break;

      case 'fileUploaded':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.message_id = message._id;
        data.timestamp = message.ts;
        data.user_id = message.u._id;
        data.user_name = message.u.username;
        data.text = message.msg;
        data.user = user;
        data.room = room;
        data.message = message;

        if (message.alias) {
          data.alias = message.alias;
        }

        if (message.bot) {
          data.bot = message.bot;
        }

        break;

      case 'roomCreated':
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.timestamp = room.ts;
        data.user_id = owner._id;
        data.user_name = owner.username;
        data.owner = owner;
        data.room = room;
        break;

      case 'roomArchived':
      case 'roomJoined':
      case 'roomLeft':
        data.timestamp = new Date();
        data.channel_id = room._id;
        data.channel_name = room.name;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;
        data.room = room;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      case 'userCreated':
        data.timestamp = user.createdAt;
        data.user_id = user._id;
        data.user_name = user.username;
        data.user = user;

        if (user.type === 'bot') {
          data.bot = true;
        }

        break;

      default:
        break;
    }
  }

  executeTriggers() {
    logger.outgoing.debug('Execute Trigger:', arguments[0]);
    const argObject = this.eventNameArgumentsToObject(...arguments);
    const {
      event,
      message,
      room
    } = argObject; //Each type of event should have an event and a room attached, otherwise we
    //wouldn't know how to handle the trigger nor would we have anywhere to send the
    //result of the integration

    if (!event) {
      return;
    }

    const triggersToExecute = [];
    logger.outgoing.debug('Starting search for triggers for the room:', room ? room._id : '__any');

    if (room) {
      switch (room.t) {
        case 'd':
          const id = room._id.replace(message.u._id, '');

          const username = _.without(room.usernames, message.u.username)[0];

          if (this.triggers[`@${id}`]) {
            for (const trigger of Object.values(this.triggers[`@${id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers.all_direct_messages) {
            for (const trigger of Object.values(this.triggers.all_direct_messages)) {
              triggersToExecute.push(trigger);
            }
          }

          if (id !== username && this.triggers[`@${username}`]) {
            for (const trigger of Object.values(this.triggers[`@${username}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        case 'c':
          if (this.triggers.all_public_channels) {
            for (const trigger of Object.values(this.triggers.all_public_channels)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;

        default:
          if (this.triggers.all_private_groups) {
            for (const trigger of Object.values(this.triggers.all_private_groups)) {
              triggersToExecute.push(trigger);
            }
          }

          if (this.triggers[`#${room._id}`]) {
            for (const trigger of Object.values(this.triggers[`#${room._id}`])) {
              triggersToExecute.push(trigger);
            }
          }

          if (room._id !== room.name && this.triggers[`#${room.name}`]) {
            for (const trigger of Object.values(this.triggers[`#${room.name}`])) {
              triggersToExecute.push(trigger);
            }
          }

          break;
      }
    }

    if (this.triggers.__any) {
      //For outgoing integration which don't rely on rooms.
      for (const trigger of Object.values(this.triggers.__any)) {
        triggersToExecute.push(trigger);
      }
    }

    logger.outgoing.debug(`Found ${triggersToExecute.length} to iterate over and see if the match the event.`);

    for (const triggerToExecute of triggersToExecute) {
      logger.outgoing.debug(`Is "${triggerToExecute.name}" enabled, ${triggerToExecute.enabled}, and what is the event? ${triggerToExecute.event}`);

      if (triggerToExecute.enabled === true && triggerToExecute.event === event) {
        this.executeTrigger(triggerToExecute, argObject);
      }
    }
  }

  executeTrigger(trigger, argObject) {
    for (const url of trigger.urls) {
      this.executeTriggerUrl(url, trigger, argObject, 0);
    }
  }

  executeTriggerUrl(url, trigger, {
    event,
    message,
    room,
    owner,
    user
  }, theHistoryId, tries = 0) {
    if (!this.isTriggerEnabled(trigger)) {
      logger.outgoing.warn(`The trigger "${trigger.name}" is no longer enabled, stopping execution of it at try: ${tries}`);
      return;
    }

    logger.outgoing.debug(`Starting to execute trigger: ${trigger.name} (${trigger._id})`);
    let word; //Not all triggers/events support triggerWords

    if (RocketChat.integrations.outgoingEvents[event].use.triggerWords) {
      if (trigger.triggerWords && trigger.triggerWords.length > 0) {
        for (const triggerWord of trigger.triggerWords) {
          if (!trigger.triggerWordAnywhere && message.msg.indexOf(triggerWord) === 0) {
            word = triggerWord;
            break;
          } else if (trigger.triggerWordAnywhere && message.msg.includes(triggerWord)) {
            word = triggerWord;
            break;
          }
        } // Stop if there are triggerWords but none match


        if (!word) {
          logger.outgoing.debug(`The trigger word which "${trigger.name}" was expecting could not be found, not executing.`);
          return;
        }
      }
    }

    if (message && message.editedAt && !trigger.runOnEdits) {
      logger.outgoing.debug(`The trigger "${trigger.name}"'s run on edits is disabled and the message was edited.`);
      return;
    }

    const historyId = this.updateHistory({
      step: 'start-execute-trigger-url',
      integration: trigger,
      event
    });
    const data = {
      token: trigger.token,
      bot: false
    };

    if (word) {
      data.trigger_word = word;
    }

    this.mapEventArgsToData(data, {
      trigger,
      event,
      message,
      room,
      owner,
      user
    });
    this.updateHistory({
      historyId,
      step: 'mapped-args-to-data',
      data,
      triggerWord: word
    });
    logger.outgoing.info(`Will be executing the Integration "${trigger.name}" to the url: ${url}`);
    logger.outgoing.debug(data);
    let opts = {
      params: {},
      method: 'POST',
      url,
      data,
      auth: undefined,
      npmRequestOptions: {
        rejectUnauthorized: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs'),
        strictSSL: !RocketChat.settings.get('Allow_Invalid_SelfSigned_Certs')
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2227.0 Safari/537.36'
      }
    };

    if (this.hasScriptAndMethod(trigger, 'prepare_outgoing_request')) {
      opts = this.executeScript(trigger, 'prepare_outgoing_request', {
        request: opts
      }, historyId);
    }

    this.updateHistory({
      historyId,
      step: 'after-maybe-ran-prepare',
      ranPrepareScript: true
    });

    if (!opts) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-opts',
        finished: true
      });
      return;
    }

    if (opts.message) {
      const prepareMessage = this.sendMessage({
        trigger,
        room,
        message: opts.message,
        data
      });
      this.updateHistory({
        historyId,
        step: 'after-prepare-send-message',
        prepareSentMessage: prepareMessage
      });
    }

    if (!opts.url || !opts.method) {
      this.updateHistory({
        historyId,
        step: 'after-prepare-no-url_or_method',
        finished: true
      });
      return;
    }

    this.updateHistory({
      historyId,
      step: 'pre-http-call',
      url: opts.url,
      httpCallData: opts.data
    });
    HTTP.call(opts.method, opts.url, opts, (error, result) => {
      if (!result) {
        logger.outgoing.warn(`Result for the Integration ${trigger.name} to ${url} is empty`);
      } else {
        logger.outgoing.info(`Status code for the Integration ${trigger.name} to ${url} is ${result.statusCode}`);
      }

      this.updateHistory({
        historyId,
        step: 'after-http-call',
        httpError: error,
        httpResult: result
      });

      if (this.hasScriptAndMethod(trigger, 'process_outgoing_response')) {
        const sandbox = {
          request: opts,
          response: {
            error,
            status_code: result ? result.statusCode : undefined,
            //These values will be undefined to close issues #4175, #5762, and #5896
            content: result ? result.data : undefined,
            content_raw: result ? result.content : undefined,
            headers: result ? result.headers : {}
          }
        };
        const scriptResult = this.executeScript(trigger, 'process_outgoing_response', sandbox, historyId);

        if (scriptResult && scriptResult.content) {
          const resultMessage = this.sendMessage({
            trigger,
            room,
            message: scriptResult.content,
            data
          });
          this.updateHistory({
            historyId,
            step: 'after-process-send-message',
            processSentMessage: resultMessage,
            finished: true
          });
          return;
        }

        if (scriptResult === false) {
          this.updateHistory({
            historyId,
            step: 'after-process-false-result',
            finished: true
          });
          return;
        }
      } // if the result contained nothing or wasn't a successful statusCode


      if (!result || !this.successResults.includes(result.statusCode)) {
        if (error) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(error);
        }

        if (result) {
          logger.outgoing.error(`Error for the Integration "${trigger.name}" to ${url} is:`);
          logger.outgoing.error(result);

          if (result.statusCode === 410) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-410',
              error: true
            });
            logger.outgoing.error(`Disabling the Integration "${trigger.name}" because the status code was 401 (Gone).`);
            RocketChat.models.Integrations.update({
              _id: trigger._id
            }, {
              $set: {
                enabled: false
              }
            });
            return;
          }

          if (result.statusCode === 500) {
            this.updateHistory({
              historyId,
              step: 'after-process-http-status-500',
              error: true
            });
            logger.outgoing.error(`Error "500" for the Integration "${trigger.name}" to ${url}.`);
            logger.outgoing.error(result.content);
            return;
          }
        }

        if (trigger.retryFailedCalls) {
          if (tries < trigger.retryCount && trigger.retryDelay) {
            this.updateHistory({
              historyId,
              error: true,
              step: `going-to-retry-${tries + 1}`
            });
            let waitTime;

            switch (trigger.retryDelay) {
              case 'powers-of-ten':
                // Try again in 0.1s, 1s, 10s, 1m40s, 16m40s, 2h46m40s, 27h46m40s, etc
                waitTime = Math.pow(10, tries + 2);
                break;

              case 'powers-of-two':
                // 2 seconds, 4 seconds, 8 seconds
                waitTime = Math.pow(2, tries + 1) * 1000;
                break;

              case 'increments-of-two':
                // 2 second, 4 seconds, 6 seconds, etc
                waitTime = (tries + 1) * 2 * 1000;
                break;

              default:
                const er = new Error('The integration\'s retryDelay setting is invalid.');
                this.updateHistory({
                  historyId,
                  step: 'failed-and-retry-delay-is-invalid',
                  error: true,
                  errorStack: er.stack
                });
                return;
            }

            logger.outgoing.info(`Trying the Integration ${trigger.name} to ${url} again in ${waitTime} milliseconds.`);
            Meteor.setTimeout(() => {
              this.executeTriggerUrl(url, trigger, {
                event,
                message,
                room,
                owner,
                user
              }, historyId, tries + 1);
            }, waitTime);
          } else {
            this.updateHistory({
              historyId,
              step: 'too-many-retries',
              error: true
            });
          }
        } else {
          this.updateHistory({
            historyId,
            step: 'failed-and-not-configured-to-retry',
            error: true
          });
        }

        return;
      } //process outgoing webhook response as a new message


      if (result && this.successResults.includes(result.statusCode)) {
        if (result && result.data && (result.data.text || result.data.attachments)) {
          const resultMsg = this.sendMessage({
            trigger,
            room,
            message: result.data,
            data
          });
          this.updateHistory({
            historyId,
            step: 'url-response-sent-message',
            resultMessage: resultMsg,
            finished: true
          });
        }
      }
    });
  }

  replay(integration, history) {
    if (!integration || integration.type !== 'webhook-outgoing') {
      throw new Meteor.Error('integration-type-must-be-outgoing', 'The integration type to replay must be an outgoing webhook.');
    }

    if (!history || !history.data) {
      throw new Meteor.Error('history-data-must-be-defined', 'The history data must be defined to replay an integration.');
    }

    const event = history.event;
    const message = RocketChat.models.Messages.findOneById(history.data.message_id);
    const room = RocketChat.models.Rooms.findOneById(history.data.channel_id);
    const user = RocketChat.models.Users.findOneById(history.data.user_id);
    let owner;

    if (history.data.owner && history.data.owner._id) {
      owner = RocketChat.models.Users.findOneById(history.data.owner._id);
    }

    this.executeTriggerUrl(history.url, integration, {
      event,
      message,
      room,
      owner,
      user
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/Integrations.js                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.Integrations = new class Integrations extends RocketChat.models._Base {
  constructor() {
    super('integrations');
  }

  findByType(type, options) {
    if (type !== 'webhook-incoming' && type !== 'webhook-outgoing') {
      throw new Meteor.Error('invalid-type-to-find');
    }

    return this.find({
      type
    }, options);
  }

  disableByUserId(userId) {
    return this.update({
      userId
    }, {
      $set: {
        enabled: false
      }
    }, {
      multi: true
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"IntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/models/IntegrationHistory.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.models.IntegrationHistory = new class IntegrationHistory extends RocketChat.models._Base {
  constructor() {
    super('integration_history');
  }

  findByType(type, options) {
    if (type !== 'outgoing-webhook' || type !== 'incoming-webhook') {
      throw new Meteor.Error('invalid-integration-type');
    }

    return this.find({
      type
    }, options);
  }

  findByIntegrationId(id, options) {
    return this.find({
      'integration._id': id
    }, options);
  }

  findByIntegrationIdAndCreatedBy(id, creatorId, options) {
    return this.find({
      'integration._id': id,
      'integration._createdBy._id': creatorId
    }, options);
  }

  findOneByIntegrationIdAndHistoryId(integrationId, historyId) {
    return this.findOne({
      'integration._id': integrationId,
      _id: historyId
    });
  }

  findByEventName(event, options) {
    return this.find({
      event
    }, options);
  }

  findFailed(options) {
    return this.find({
      error: true
    }, options);
  }

  removeByIntegrationId(integrationId) {
    return this.remove({
      'integration._id': integrationId
    });
  }

}();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"integrations.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrations.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrations', function _integrationPublication() {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.Integrations.find();
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.Integrations.find({
      '_createdBy._id': this.userId
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"integrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/publications/integrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.publish('integrationHistory', function _integrationHistoryPublication(integrationId, limit = 25) {
  if (!this.userId) {
    return this.ready();
  }

  if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationId(integrationId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
    return RocketChat.models.IntegrationHistory.findByIntegrationIdAndCreatedBy(integrationId, this.userId, {
      sort: {
        _updatedAt: -1
      },
      limit
    });
  } else {
    throw new Meteor.Error('not-authorized');
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"incoming":{"addIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/addIncomingIntegration.js                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const validChannelChars = ['@', '#'];
Meteor.methods({
  addIncomingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'addIncomingIntegration'
      });
    }

    if (!_.isString(integration.channel)) {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'addIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    if (!_.isString(integration.username) || integration.username.trim() === '') {
      throw new Meteor.Error('error-invalid-username', 'Invalid username', {
        method: 'addIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      let record;
      const channelType = channel[0];
      channel = channel.substr(1);

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'addIncomingIntegration'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'addIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: integration.username
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'addIncomingIntegration'
      });
    }

    const token = Random.id(48);
    integration.type = 'webhook-incoming';
    integration.token = token;
    integration.channel = channels;
    integration.userId = user._id;
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateIncomingIntegration.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/updateIncomingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
const validChannelChars = ['@', '#'];
Meteor.methods({
  updateIncomingIntegration(integrationId, integration) {
    if (!_.isString(integration.channel) || integration.channel.trim() === '') {
      throw new Meteor.Error('error-invalid-channel', 'Invalid channel', {
        method: 'updateIncomingIntegration'
      });
    }

    const channels = _.map(integration.channel.split(','), channel => s.trim(channel));

    for (const channel of channels) {
      if (!validChannelChars.includes(channel[0])) {
        throw new Meteor.Error('error-invalid-channel-start-with-chars', 'Invalid channel. Start with @ or #', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateIncomingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'updateIncomingIntegration'
      });
    }

    if (integration.scriptEnabled === true && integration.script && integration.script.trim() !== '') {
      try {
        let babelOptions = Babel.getDefaultOptions({
          runtime: false
        });
        babelOptions = _.extend(babelOptions, {
          compact: true,
          minified: true,
          comments: false
        });
        integration.scriptCompiled = Babel.compile(integration.script, babelOptions).code;
        integration.scriptError = undefined;
      } catch (e) {
        integration.scriptCompiled = undefined;
        integration.scriptError = _.pick(e, 'name', 'message', 'stack');
      }
    }

    for (let channel of channels) {
      const channelType = channel[0];
      channel = channel.substr(1);
      let record;

      switch (channelType) {
        case '#':
          record = RocketChat.models.Rooms.findOne({
            $or: [{
              _id: channel
            }, {
              name: channel
            }]
          });
          break;

        case '@':
          record = RocketChat.models.Users.findOne({
            $or: [{
              _id: channel
            }, {
              username: channel
            }]
          });
          break;
      }

      if (!record) {
        throw new Meteor.Error('error-invalid-room', 'Invalid room', {
          method: 'updateIncomingIntegration'
        });
      }

      if (record.usernames && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !record.usernames.includes(Meteor.user().username)) {
        throw new Meteor.Error('error-invalid-channel', 'Invalid Channel', {
          method: 'updateIncomingIntegration'
        });
      }
    }

    const user = RocketChat.models.Users.findOne({
      username: currentIntegration.username
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-post-as-user', 'Invalid Post As User', {
        method: 'updateIncomingIntegration'
      });
    }

    RocketChat.models.Roles.addUserRoles(user._id, 'bot');
    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: channels,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteIncomingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/incoming/deleteIncomingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteIncomingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteIncomingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteIncomingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"outgoing":{"addOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/addOutgoingIntegration.js                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  addOutgoingIntegration(integration) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') && !RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot') && !RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      throw new Meteor.Error('not_authorized');
    }

    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);
    integration._createdAt = new Date();
    integration._createdBy = RocketChat.models.Users.findOne(this.userId, {
      fields: {
        username: 1
      }
    });
    integration._id = RocketChat.models.Integrations.insert(integration);
    return integration;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"updateOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/updateOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  updateOutgoingIntegration(integrationId, integration) {
    integration = RocketChat.integrations.validateOutgoing(integration, this.userId);

    if (!integration.token || integration.token.trim() === '') {
      throw new Meteor.Error('error-invalid-token', 'Invalid token', {
        method: 'updateOutgoingIntegration'
      });
    }

    let currentIntegration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations')) {
      currentIntegration = RocketChat.models.Integrations.findOne({
        _id: integrationId,
        '_createdBy._id': this.userId
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'updateOutgoingIntegration'
      });
    }

    if (!currentIntegration) {
      throw new Meteor.Error('invalid_integration', '[methods] updateOutgoingIntegration -> integration not found');
    }

    RocketChat.models.Integrations.update(integrationId, {
      $set: {
        event: integration.event,
        enabled: integration.enabled,
        name: integration.name,
        avatar: integration.avatar,
        emoji: integration.emoji,
        alias: integration.alias,
        channel: integration.channel,
        targetRoom: integration.targetRoom,
        impersonateUser: integration.impersonateUser,
        username: integration.username,
        userId: integration.userId,
        urls: integration.urls,
        token: integration.token,
        script: integration.script,
        scriptEnabled: integration.scriptEnabled,
        scriptCompiled: integration.scriptCompiled,
        scriptError: integration.scriptError,
        triggerWords: integration.triggerWords,
        retryFailedCalls: integration.retryFailedCalls,
        retryCount: integration.retryCount,
        retryDelay: integration.retryDelay,
        triggerWordAnywhere: integration.triggerWordAnywhere,
        runOnEdits: integration.runOnEdits,
        _updatedAt: new Date(),
        _updatedBy: RocketChat.models.Users.findOne(this.userId, {
          fields: {
            username: 1
          }
        })
      }
    });
    return RocketChat.models.Integrations.findOne(integrationId);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"replayOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/replayOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  replayOutgoingIntegration({
    integrationId,
    historyId
  }) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'replayOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'replayOutgoingIntegration'
      });
    }

    const history = RocketChat.models.IntegrationHistory.findOneByIntegrationIdAndHistoryId(integration._id, historyId);

    if (!history) {
      throw new Meteor.Error('error-invalid-integration-history', 'Invalid Integration History', {
        method: 'replayOutgoingIntegration'
      });
    }

    RocketChat.integrations.triggerHandler.replay(integration, history);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteOutgoingIntegration.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/outgoing/deleteOutgoingIntegration.js                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  deleteOutgoingIntegration(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'deleteOutgoingIntegration'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'deleteOutgoingIntegration'
      });
    }

    RocketChat.models.Integrations.remove({
      _id: integrationId
    });
    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"clearIntegrationHistory.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/methods/clearIntegrationHistory.js                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  clearIntegrationHistory(integrationId) {
    let integration;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId);
    } else if (RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations') || RocketChat.authz.hasPermission(this.userId, 'manage-own-integrations', 'bot')) {
      integration = RocketChat.models.Integrations.findOne(integrationId, {
        fields: {
          '_createdBy._id': this.userId
        }
      });
    } else {
      throw new Meteor.Error('not_authorized', 'Unauthorized', {
        method: 'clearIntegrationHistory'
      });
    }

    if (!integration) {
      throw new Meteor.Error('error-invalid-integration', 'Invalid integration', {
        method: 'clearIntegrationHistory'
      });
    }

    RocketChat.models.IntegrationHistory.removeByIntegrationId(integrationId);
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api":{"api.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/api/api.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);
let vm;
module.watch(require("vm"), {
  default(v) {
    vm = v;
  }

}, 2);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 3);
const compiledScripts = {};

function buildSandbox(store = {}) {
  const sandbox = {
    _,
    s,
    console,
    moment,
    Livechat: RocketChat.Livechat,
    Store: {
      set(key, val) {
        return store[key] = val;
      },

      get(key) {
        return store[key];
      }

    },

    HTTP(method, url, options) {
      try {
        return {
          result: HTTP.call(method, url, options)
        };
      } catch (error) {
        return {
          error
        };
      }
    }

  };
  Object.keys(RocketChat.models).filter(k => !k.startsWith('_')).forEach(k => sandbox[k] = RocketChat.models[k]);
  return {
    store,
    sandbox
  };
}

function getIntegrationScript(integration) {
  const compiledScript = compiledScripts[integration._id];

  if (compiledScript != null && +compiledScript._updatedAt === +integration._updatedAt) {
    return compiledScript.script;
  }

  const script = integration.scriptCompiled;
  const {
    sandbox,
    store
  } = buildSandbox();

  try {
    logger.incoming.info('Will evaluate script of Trigger', integration.name);
    logger.incoming.debug(script);
    const vmScript = vm.createScript(script, 'script.js');
    vmScript.runInNewContext(sandbox);

    if (sandbox.Script != null) {
      compiledScripts[integration._id] = {
        script: new sandbox.Script(),
        store,
        _updatedAt: integration._updatedAt
      };
      return compiledScripts[integration._id].script;
    }
  } catch ({
    stack
  }) {
    logger.incoming.error('[Error evaluating Script in Trigger', integration.name, ':]');
    logger.incoming.error(script.replace(/^/gm, '  '));
    logger.incoming.error('[Stack:]');
    logger.incoming.error(stack.replace(/^/gm, '  '));
    throw RocketChat.API.v1.failure('error-evaluating-script');
  }

  if (sandbox.Script == null) {
    logger.incoming.error('[Class "Script" not in Trigger', integration.name, ']');
    throw RocketChat.API.v1.failure('class-script-not-found');
  }
}

Api = new Restivus({
  enableCors: true,
  apiPath: 'hooks/',
  auth: {
    user() {
      const payloadKeys = Object.keys(this.bodyParams);
      const payloadIsWrapped = this.bodyParams && this.bodyParams.payload && payloadKeys.length === 1;

      if (payloadIsWrapped && this.request.headers['content-type'] === 'application/x-www-form-urlencoded') {
        try {
          this.bodyParams = JSON.parse(this.bodyParams.payload);
        } catch ({
          message
        }) {
          return {
            error: {
              statusCode: 400,
              body: {
                success: false,
                error: message
              }
            }
          };
        }
      }

      this.integration = RocketChat.models.Integrations.findOne({
        _id: this.request.params.integrationId,
        token: decodeURIComponent(this.request.params.token)
      });

      if (this.integration == null) {
        logger.incoming.info('Invalid integration id', this.request.params.integrationId, 'or token', this.request.params.token);
        return;
      }

      const user = RocketChat.models.Users.findOne({
        _id: this.integration.userId
      });
      return {
        user
      };
    }

  }
});

function createIntegration(options, user) {
  logger.incoming.info('Add integration', options.name);
  logger.incoming.debug(options);
  Meteor.runAsUser(user._id, function () {
    switch (options['event']) {
      case 'newMessageOnChannel':
        if (options.data == null) {
          options.data = {};
        }

        if (options.data.channel_name != null && options.data.channel_name.indexOf('#') === -1) {
          options.data.channel_name = `#${options.data.channel_name}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.channel_name,
          triggerWords: options.data.trigger_words
        });

      case 'newMessageToUser':
        if (options.data.username.indexOf('@') === -1) {
          options.data.username = `@${options.data.username}`;
        }

        return Meteor.call('addOutgoingIntegration', {
          username: 'rocket.cat',
          urls: [options.target_url],
          name: options.name,
          channel: options.data.username,
          triggerWords: options.data.trigger_words
        });
    }
  });
  return RocketChat.API.v1.success();
}

function removeIntegration(options, user) {
  logger.incoming.info('Remove integration');
  logger.incoming.debug(options);
  const integrationToRemove = RocketChat.models.Integrations.findOne({
    urls: options.target_url
  });
  Meteor.runAsUser(user._id, () => {
    return Meteor.call('deleteOutgoingIntegration', integrationToRemove._id);
  });
  return RocketChat.API.v1.success();
}

function executeIntegrationRest() {
  logger.incoming.info('Post integration:', this.integration.name);
  logger.incoming.debug('@urlParams:', this.urlParams);
  logger.incoming.debug('@bodyParams:', this.bodyParams);

  if (this.integration.enabled !== true) {
    return {
      statusCode: 503,
      body: 'Service Unavailable'
    };
  }

  const defaultValues = {
    channel: this.integration.channel,
    alias: this.integration.alias,
    avatar: this.integration.avatar,
    emoji: this.integration.emoji
  };

  if (this.integration.scriptEnabled === true && this.integration.scriptCompiled && this.integration.scriptCompiled.trim() !== '') {
    let script;

    try {
      script = getIntegrationScript(this.integration);
    } catch (e) {
      logger.incoming.warn(e);
      return RocketChat.API.v1.failure(e.message);
    }

    const request = {
      url: {
        hash: this.request._parsedUrl.hash,
        search: this.request._parsedUrl.search,
        query: this.queryParams,
        pathname: this.request._parsedUrl.pathname,
        path: this.request._parsedUrl.path
      },
      url_raw: this.request.url,
      url_params: this.urlParams,
      content: this.bodyParams,
      content_raw: this.request._readableState && this.request._readableState.buffer && this.request._readableState.buffer.toString(),
      headers: this.request.headers,
      user: {
        _id: this.user._id,
        name: this.user.name,
        username: this.user.username
      }
    };

    try {
      const {
        sandbox
      } = buildSandbox(compiledScripts[this.integration._id].store);
      sandbox.script = script;
      sandbox.request = request;
      const result = vm.runInNewContext('script.process_incoming_request({ request: request })', sandbox, {
        timeout: 3000
      });

      if (!result) {
        logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':] No data');
        return RocketChat.API.v1.success();
      } else if (result && result.error) {
        return RocketChat.API.v1.failure(result.error);
      }

      this.bodyParams = result && result.content;
      this.scriptResponse = result.response;

      if (result.user) {
        this.user = result.user;
      }

      logger.incoming.debug('[Process Incoming Request result of Trigger', this.integration.name, ':]');
      logger.incoming.debug('result', this.bodyParams);
    } catch ({
      stack
    }) {
      logger.incoming.error('[Error running Script in Trigger', this.integration.name, ':]');
      logger.incoming.error(this.integration.scriptCompiled.replace(/^/gm, '  '));
      logger.incoming.error('[Stack:]');
      logger.incoming.error(stack.replace(/^/gm, '  '));
      return RocketChat.API.v1.failure('error-running-script');
    }
  } // TODO: Turn this into an option on the integrations - no body means a success
  // TODO: Temporary fix for https://github.com/RocketChat/Rocket.Chat/issues/7770 until the above is implemented


  if (!this.bodyParams) {
    // return RocketChat.API.v1.failure('body-empty');
    return RocketChat.API.v1.success();
  }

  this.bodyParams.bot = {
    i: this.integration._id
  };

  try {
    const message = processWebhookMessage(this.bodyParams, this.user, defaultValues);

    if (_.isEmpty(message)) {
      return RocketChat.API.v1.failure('unknown-error');
    }

    if (this.scriptResponse) {
      logger.incoming.debug('response', this.scriptResponse);
    }

    return RocketChat.API.v1.success(this.scriptResponse);
  } catch ({
    error
  }) {
    return RocketChat.API.v1.failure(error);
  }
}

function addIntegrationRest() {
  return createIntegration(this.bodyParams, this.user);
}

function removeIntegrationRest() {
  return removeIntegration(this.bodyParams, this.user);
}

function integrationSampleRest() {
  logger.incoming.info('Sample Integration');
  return {
    statusCode: 200,
    body: [{
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 1',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 2',
      trigger_word: 'Sample'
    }, {
      token: Random.id(24),
      channel_id: Random.id(),
      channel_name: 'general',
      timestamp: new Date(),
      user_id: Random.id(),
      user_name: 'rocket.cat',
      text: 'Sample text 3',
      trigger_word: 'Sample'
    }]
  };
}

function integrationInfoRest() {
  logger.incoming.info('Info integration');
  return {
    statusCode: 200,
    body: {
      success: true
    }
  };
}

Api.addRoute(':integrationId/:userId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute(':integrationId/:token', {
  authRequired: true
}, {
  post: executeIntegrationRest,
  get: executeIntegrationRest
});
Api.addRoute('sample/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('sample/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationSampleRest
});
Api.addRoute('info/:integrationId/:userId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('info/:integrationId/:token', {
  authRequired: true
}, {
  get: integrationInfoRest
});
Api.addRoute('add/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('add/:integrationId/:token', {
  authRequired: true
}, {
  post: addIntegrationRest
});
Api.addRoute('remove/:integrationId/:userId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
Api.addRoute('remove/:integrationId/:token', {
  authRequired: true
}, {
  post: removeIntegrationRest
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"triggers.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/triggers.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
const callbackHandler = function _callbackHandler(eventType) {
  return function _wrapperFunction() {
    return RocketChat.integrations.triggerHandler.executeTriggers(eventType, ...arguments);
  };
};

RocketChat.callbacks.add('afterSaveMessage', callbackHandler('sendMessage'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateChannel', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreatePrivateGroup', callbackHandler('roomCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterCreateUser', callbackHandler('userCreated'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterJoinRoom', callbackHandler('roomJoined'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterLeaveRoom', callbackHandler('roomLeft'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterRoomArchived', callbackHandler('roomArchived'), RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('afterFileUpload', callbackHandler('fileUploaded'), RocketChat.callbacks.priority.LOW);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"processWebhookMessage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_integrations/server/processWebhookMessage.js                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 1);

this.processWebhookMessage = function (messageObj, user, defaultValues = {
  channel: '',
  alias: '',
  avatar: '',
  emoji: ''
}, mustBeJoined = false) {
  const sentData = [];
  const channels = [].concat(messageObj.channel || messageObj.roomId || defaultValues.channel);

  for (const channel of channels) {
    const channelType = channel[0];
    let channelValue = channel.substr(1);
    let room;

    switch (channelType) {
      case '#':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true
        });
        break;

      case '@':
        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd'
        });
        break;

      default:
        channelValue = channelType + channelValue; //Try to find the room by id or name if they didn't include the prefix.

        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          joinChannel: true,
          errorOnEmpty: false
        });

        if (room) {
          break;
        } //We didn't get a room, let's try finding direct messages


        room = RocketChat.getRoomByNameOrIdWithOptionToJoin({
          currentUserId: user._id,
          nameOrId: channelValue,
          type: 'd',
          tryDirectByUserIdOnly: true
        });

        if (room) {
          break;
        } //No room, so throw an error


        throw new Meteor.Error('invalid-channel');
    }

    if (mustBeJoined && !room.usernames.includes(user.username)) {
      // throw new Meteor.Error('invalid-room', 'Invalid room provided to send a message to, must be joined.');
      throw new Meteor.Error('invalid-channel'); // Throwing the generic one so people can't "brute force" find rooms
    }

    if (messageObj.attachments && !_.isArray(messageObj.attachments)) {
      console.log('Attachments should be Array, ignoring value'.red, messageObj.attachments);
      messageObj.attachments = undefined;
    }

    const message = {
      alias: messageObj.username || messageObj.alias || defaultValues.alias,
      msg: s.trim(messageObj.text || messageObj.msg || ''),
      attachments: messageObj.attachments || [],
      parseUrls: messageObj.parseUrls !== undefined ? messageObj.parseUrls : !messageObj.attachments,
      bot: messageObj.bot,
      groupable: messageObj.groupable !== undefined ? messageObj.groupable : false
    };

    if (!_.isEmpty(messageObj.icon_url) || !_.isEmpty(messageObj.avatar)) {
      message.avatar = messageObj.icon_url || messageObj.avatar;
    } else if (!_.isEmpty(messageObj.icon_emoji) || !_.isEmpty(messageObj.emoji)) {
      message.emoji = messageObj.icon_emoji || messageObj.emoji;
    } else if (!_.isEmpty(defaultValues.avatar)) {
      message.avatar = defaultValues.avatar;
    } else if (!_.isEmpty(defaultValues.emoji)) {
      message.emoji = defaultValues.emoji;
    }

    if (_.isArray(message.attachments)) {
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];

        if (attachment.msg) {
          attachment.text = s.trim(attachment.msg);
          delete attachment.msg;
        }
      }
    }

    const messageReturn = RocketChat.sendMessage(user, message, room);
    sentData.push({
      channel,
      message: messageReturn
    });
  }

  return sentData;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:integrations/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:integrations/server/logger.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/validation.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/Integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/models/IntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrations.js");
require("/node_modules/meteor/rocketchat:integrations/server/publications/integrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/addIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/updateIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/incoming/deleteIncomingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/addOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/updateOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/replayOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/outgoing/deleteOutgoingIntegration.js");
require("/node_modules/meteor/rocketchat:integrations/server/methods/clearIntegrationHistory.js");
require("/node_modules/meteor/rocketchat:integrations/server/api/api.js");
require("/node_modules/meteor/rocketchat:integrations/server/lib/triggerHandler.js");
require("/node_modules/meteor/rocketchat:integrations/server/triggers.js");
require("/node_modules/meteor/rocketchat:integrations/server/processWebhookMessage.js");

/* Exports */
Package._define("rocketchat:integrations");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_integrations.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvbGliL3JvY2tldGNoYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9sb2dnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9saWIvdmFsaWRhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL2xpYi90cmlnZ2VySGFuZGxlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL21vZGVscy9JbnRlZ3JhdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tb2RlbHMvSW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHVibGljYXRpb25zL2ludGVncmF0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3B1YmxpY2F0aW9ucy9pbnRlZ3JhdGlvbkhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2FkZEluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2luY29taW5nL2RlbGV0ZUluY29taW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2FkZE91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3VwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL291dGdvaW5nL2RlbGV0ZU91dGdvaW5nSW50ZWdyYXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6aW50ZWdyYXRpb25zL3NlcnZlci9tZXRob2RzL2NsZWFySW50ZWdyYXRpb25IaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvYXBpL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDppbnRlZ3JhdGlvbnMvc2VydmVyL3RyaWdnZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmludGVncmF0aW9ucy9zZXJ2ZXIvcHJvY2Vzc1dlYmhvb2tNZXNzYWdlLmpzIl0sIm5hbWVzIjpbIlJvY2tldENoYXQiLCJpbnRlZ3JhdGlvbnMiLCJvdXRnb2luZ0V2ZW50cyIsInNlbmRNZXNzYWdlIiwibGFiZWwiLCJ2YWx1ZSIsInVzZSIsImNoYW5uZWwiLCJ0cmlnZ2VyV29yZHMiLCJ0YXJnZXRSb29tIiwiZmlsZVVwbG9hZGVkIiwicm9vbUFyY2hpdmVkIiwicm9vbUNyZWF0ZWQiLCJyb29tSm9pbmVkIiwicm9vbUxlZnQiLCJ1c2VyQ3JlYXRlZCIsImxvZ2dlciIsIkxvZ2dlciIsInNlY3Rpb25zIiwiaW5jb21pbmciLCJvdXRnb2luZyIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInMiLCJzY29wZWRDaGFubmVscyIsInZhbGlkQ2hhbm5lbENoYXJzIiwiX3ZlcmlmeVJlcXVpcmVkRmllbGRzIiwiaW50ZWdyYXRpb24iLCJldmVudCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsInRyaW0iLCJNZXRlb3IiLCJFcnJvciIsImZ1bmN0aW9uIiwidXNlcm5hbWUiLCJ1cmxzIiwiaW5kZXgiLCJ1cmwiLCJlbnRyaWVzIiwid2l0aG91dCIsInVuZGVmaW5lZCIsImxlbmd0aCIsIl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzIiwidXNlcklkIiwiY2hhbm5lbHMiLCJpbmNsdWRlcyIsImF1dGh6IiwiaGFzUGVybWlzc2lvbiIsInJlY29yZCIsImNoYW5uZWxUeXBlIiwic3Vic3RyIiwibW9kZWxzIiwiUm9vbXMiLCJmaW5kT25lIiwiJG9yIiwiX2lkIiwibmFtZSIsIlVzZXJzIiwidXNlcm5hbWVzIiwidXNlciIsIl92ZXJpZnlSZXRyeUluZm9ybWF0aW9uIiwicmV0cnlGYWlsZWRDYWxscyIsInJldHJ5Q291bnQiLCJwYXJzZUludCIsInJldHJ5RGVsYXkiLCJ0b0xvd2VyQ2FzZSIsInZhbGlkYXRlT3V0Z29pbmciLCJfdmFsaWRhdGVPdXRnb2luZyIsIm1hcCIsInNwbGl0IiwiZm9yRWFjaCIsIndvcmQiLCJzY3JpcHRFbmFibGVkIiwic2NyaXB0IiwiYmFiZWxPcHRpb25zIiwiT2JqZWN0IiwiYXNzaWduIiwiQmFiZWwiLCJnZXREZWZhdWx0T3B0aW9ucyIsInJ1bnRpbWUiLCJjb21wYWN0IiwibWluaWZpZWQiLCJjb21tZW50cyIsInNjcmlwdENvbXBpbGVkIiwiY29tcGlsZSIsImNvZGUiLCJzY3JpcHRFcnJvciIsImUiLCJwaWNrIiwicnVuT25FZGl0cyIsInR5cGUiLCJtb21lbnQiLCJ2bSIsInRyaWdnZXJIYW5kbGVyIiwiUm9ja2V0Q2hhdEludGVncmF0aW9uSGFuZGxlciIsImNvbnN0cnVjdG9yIiwic3VjY2Vzc1Jlc3VsdHMiLCJjb21waWxlZFNjcmlwdHMiLCJ0cmlnZ2VycyIsIkludGVncmF0aW9ucyIsImZpbmQiLCJvYnNlcnZlIiwiYWRkZWQiLCJhZGRJbnRlZ3JhdGlvbiIsImNoYW5nZWQiLCJyZW1vdmVJbnRlZ3JhdGlvbiIsInJlbW92ZWQiLCJkZWJ1ZyIsImlzRW1wdHkiLCJjb25jYXQiLCJ0cmlnZ2VyIiwidmFsdWVzIiwiaXNUcmlnZ2VyRW5hYmxlZCIsInRyaWciLCJlbmFibGVkIiwidXBkYXRlSGlzdG9yeSIsImhpc3RvcnlJZCIsInN0ZXAiLCJkYXRhIiwidHJpZ2dlcldvcmQiLCJyYW5QcmVwYXJlU2NyaXB0IiwicHJlcGFyZVNlbnRNZXNzYWdlIiwicHJvY2Vzc1NlbnRNZXNzYWdlIiwicmVzdWx0TWVzc2FnZSIsImZpbmlzaGVkIiwiaHR0cENhbGxEYXRhIiwiaHR0cEVycm9yIiwiaHR0cFJlc3VsdCIsImVycm9yIiwiZXJyb3JTdGFjayIsImhpc3RvcnkiLCJvbWl0Iiwicm9vbSIsIkpTT04iLCJzdHJpbmdpZnkiLCJJbnRlZ3JhdGlvbkhpc3RvcnkiLCJ1cGRhdGUiLCIkc2V0IiwiX2NyZWF0ZWRBdCIsIkRhdGUiLCJpbnNlcnQiLCJSYW5kb20iLCJpZCIsIm5hbWVPcklkIiwibWVzc2FnZSIsImltcGVyc29uYXRlVXNlciIsImZpbmRPbmVCeVVzZXJuYW1lIiwidXNlcl9uYW1lIiwidG1wUm9vbSIsImdldFJvb21CeU5hbWVPcklkV2l0aE9wdGlvblRvSm9pbiIsImN1cnJlbnRVc2VySWQiLCJlcnJvck9uRW1wdHkiLCJ3YXJuIiwidCIsImJvdCIsImkiLCJkZWZhdWx0VmFsdWVzIiwiYWxpYXMiLCJhdmF0YXIiLCJlbW9qaSIsInByb2Nlc3NXZWJob29rTWVzc2FnZSIsImJ1aWxkU2FuZGJveCIsInN0b3JlIiwic2FuZGJveCIsImNvbnNvbGUiLCJTdG9yZSIsInNldCIsImtleSIsInZhbCIsImdldCIsIkhUVFAiLCJtZXRob2QiLCJvcHRpb25zIiwicmVzdWx0IiwiY2FsbCIsImtleXMiLCJmaWx0ZXIiLCJrIiwic3RhcnRzV2l0aCIsImdldEludGVncmF0aW9uU2NyaXB0IiwiY29tcGlsZWRTY3JpcHQiLCJfdXBkYXRlZEF0Iiwidm1TY3JpcHQiLCJpbmZvIiwiY3JlYXRlU2NyaXB0IiwicnVuSW5OZXdDb250ZXh0IiwiU2NyaXB0IiwicmVwbGFjZSIsInN0YWNrIiwiaGFzU2NyaXB0QW5kTWV0aG9kIiwiZXhlY3V0ZVNjcmlwdCIsInBhcmFtcyIsInRpbWVvdXQiLCJldmVudE5hbWVBcmd1bWVudHNUb09iamVjdCIsImFyZ09iamVjdCIsImFyZ3VtZW50cyIsImFyZ2hoaCIsIm93bmVyIiwibWFwRXZlbnRBcmdzVG9EYXRhIiwiY2hhbm5lbF9pZCIsImNoYW5uZWxfbmFtZSIsIm1lc3NhZ2VfaWQiLCJ0aW1lc3RhbXAiLCJ0cyIsInVzZXJfaWQiLCJ1IiwidGV4dCIsIm1zZyIsImVkaXRlZEF0IiwiaXNFZGl0ZWQiLCJjcmVhdGVkQXQiLCJleGVjdXRlVHJpZ2dlcnMiLCJ0cmlnZ2Vyc1RvRXhlY3V0ZSIsInB1c2giLCJhbGxfZGlyZWN0X21lc3NhZ2VzIiwiYWxsX3B1YmxpY19jaGFubmVscyIsImFsbF9wcml2YXRlX2dyb3VwcyIsIl9fYW55IiwidHJpZ2dlclRvRXhlY3V0ZSIsImV4ZWN1dGVUcmlnZ2VyIiwiZXhlY3V0ZVRyaWdnZXJVcmwiLCJ0aGVIaXN0b3J5SWQiLCJ0cmllcyIsInRyaWdnZXJXb3JkQW55d2hlcmUiLCJpbmRleE9mIiwidG9rZW4iLCJ0cmlnZ2VyX3dvcmQiLCJvcHRzIiwiYXV0aCIsIm5wbVJlcXVlc3RPcHRpb25zIiwicmVqZWN0VW5hdXRob3JpemVkIiwic2V0dGluZ3MiLCJzdHJpY3RTU0wiLCJoZWFkZXJzIiwicmVxdWVzdCIsInByZXBhcmVNZXNzYWdlIiwic3RhdHVzQ29kZSIsInJlc3BvbnNlIiwic3RhdHVzX2NvZGUiLCJjb250ZW50IiwiY29udGVudF9yYXciLCJzY3JpcHRSZXN1bHQiLCJ3YWl0VGltZSIsIk1hdGgiLCJwb3ciLCJlciIsInNldFRpbWVvdXQiLCJhdHRhY2htZW50cyIsInJlc3VsdE1zZyIsInJlcGxheSIsIk1lc3NhZ2VzIiwiZmluZE9uZUJ5SWQiLCJfQmFzZSIsImZpbmRCeVR5cGUiLCJkaXNhYmxlQnlVc2VySWQiLCJtdWx0aSIsImZpbmRCeUludGVncmF0aW9uSWQiLCJmaW5kQnlJbnRlZ3JhdGlvbklkQW5kQ3JlYXRlZEJ5IiwiY3JlYXRvcklkIiwiZmluZE9uZUJ5SW50ZWdyYXRpb25JZEFuZEhpc3RvcnlJZCIsImludGVncmF0aW9uSWQiLCJmaW5kQnlFdmVudE5hbWUiLCJmaW5kRmFpbGVkIiwicmVtb3ZlQnlJbnRlZ3JhdGlvbklkIiwicmVtb3ZlIiwicHVibGlzaCIsIl9pbnRlZ3JhdGlvblB1YmxpY2F0aW9uIiwicmVhZHkiLCJfaW50ZWdyYXRpb25IaXN0b3J5UHVibGljYXRpb24iLCJsaW1pdCIsInNvcnQiLCJtZXRob2RzIiwiYWRkSW5jb21pbmdJbnRlZ3JhdGlvbiIsImlzU3RyaW5nIiwiZXh0ZW5kIiwiX2NyZWF0ZWRCeSIsImZpZWxkcyIsIlJvbGVzIiwiYWRkVXNlclJvbGVzIiwidXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbiIsImN1cnJlbnRJbnRlZ3JhdGlvbiIsIl91cGRhdGVkQnkiLCJkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uIiwiYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbiIsInVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24iLCJyZXBsYXlPdXRnb2luZ0ludGVncmF0aW9uIiwiZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbiIsImNsZWFySW50ZWdyYXRpb25IaXN0b3J5IiwiTGl2ZWNoYXQiLCJBUEkiLCJ2MSIsImZhaWx1cmUiLCJBcGkiLCJSZXN0aXZ1cyIsImVuYWJsZUNvcnMiLCJhcGlQYXRoIiwicGF5bG9hZEtleXMiLCJib2R5UGFyYW1zIiwicGF5bG9hZElzV3JhcHBlZCIsInBheWxvYWQiLCJwYXJzZSIsImJvZHkiLCJzdWNjZXNzIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiY3JlYXRlSW50ZWdyYXRpb24iLCJydW5Bc1VzZXIiLCJ0YXJnZXRfdXJsIiwidHJpZ2dlcl93b3JkcyIsImludGVncmF0aW9uVG9SZW1vdmUiLCJleGVjdXRlSW50ZWdyYXRpb25SZXN0IiwidXJsUGFyYW1zIiwiaGFzaCIsIl9wYXJzZWRVcmwiLCJzZWFyY2giLCJxdWVyeSIsInF1ZXJ5UGFyYW1zIiwicGF0aG5hbWUiLCJwYXRoIiwidXJsX3JhdyIsInVybF9wYXJhbXMiLCJfcmVhZGFibGVTdGF0ZSIsImJ1ZmZlciIsInRvU3RyaW5nIiwic2NyaXB0UmVzcG9uc2UiLCJhZGRJbnRlZ3JhdGlvblJlc3QiLCJyZW1vdmVJbnRlZ3JhdGlvblJlc3QiLCJpbnRlZ3JhdGlvblNhbXBsZVJlc3QiLCJpbnRlZ3JhdGlvbkluZm9SZXN0IiwiYWRkUm91dGUiLCJhdXRoUmVxdWlyZWQiLCJwb3N0IiwiY2FsbGJhY2tIYW5kbGVyIiwiX2NhbGxiYWNrSGFuZGxlciIsImV2ZW50VHlwZSIsIl93cmFwcGVyRnVuY3Rpb24iLCJjYWxsYmFja3MiLCJhZGQiLCJwcmlvcml0eSIsIkxPVyIsIm1lc3NhZ2VPYmoiLCJtdXN0QmVKb2luZWQiLCJzZW50RGF0YSIsInJvb21JZCIsImNoYW5uZWxWYWx1ZSIsImpvaW5DaGFubmVsIiwidHJ5RGlyZWN0QnlVc2VySWRPbmx5IiwiaXNBcnJheSIsImxvZyIsInJlZCIsInBhcnNlVXJscyIsImdyb3VwYWJsZSIsImljb25fdXJsIiwiaWNvbl9lbW9qaSIsImF0dGFjaG1lbnQiLCJtZXNzYWdlUmV0dXJuIl0sIm1hcHBpbmdz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QyxFQUF1RTtBQUM3RWYsY0FBUWUsS0FBUixHQUFnQm9MLFdBQVdhLFVBQVgsSUFBeUJiLFdBQVdwTCxLQUFwRDtBQUNBLEtBRk0sTUFFQSxJQUFJLENBQUNoSixFQUFFNkYsT0FBRixDQUFVZ0QsY0FBY0UsTUFBeEIsQ0FBTCxFQUFzQztBQUM1Q2QsY0FBUWMsTUFBUixHQUFpQkYsY0FBY0UsTUFBL0I7QUFDQSxLQUZNLE1BRUEsSUFBSSxDQUFDL0ksRUFBRTZGLE9BQUYsQ0FBVWdELGNBQWNHLEtBQXhCLENBQUwsRUFBcUM7QUFDM0NmLGNBQVFlLEtBQVIsR0FBZ0JILGNBQWNHLEtBQTlCO0FBQ0E7O0FBRUQsUUFBSWhKLEVBQUUyVSxPQUFGLENBQVUxTSxRQUFRdUcsV0FBbEIsQ0FBSixFQUFvQztBQUNuQyxXQUFLLElBQUk1RixJQUFJLENBQWIsRUFBZ0JBLElBQUlYLFFBQVF1RyxXQUFSLENBQW9COU0sTUFBeEMsRUFBZ0RrSCxHQUFoRCxFQUFxRDtBQUNwRCxjQUFNc00sYUFBYWpOLFFBQVF1RyxXQUFSLENBQW9CNUYsQ0FBcEIsQ0FBbkI7O0FBQ0EsWUFBSXNNLFdBQVdsSixHQUFmLEVBQW9CO0FBQ25Ca0oscUJBQVduSixJQUFYLEdBQWtCekwsRUFBRVMsSUFBRixDQUFPbVUsV0FBV2xKLEdBQWxCLENBQWxCO0FBQ0EsaUJBQU9rSixXQUFXbEosR0FBbEI7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsVUFBTW1KLGdCQUFnQnhXLFdBQVdHLFdBQVgsQ0FBdUI4RCxJQUF2QixFQUE2QnFGLE9BQTdCLEVBQXNDWixJQUF0QyxDQUF0QjtBQUNBaU4sYUFBU2hJLElBQVQsQ0FBYztBQUFFcE4sYUFBRjtBQUFXK0ksZUFBU2tOO0FBQXBCLEtBQWQ7QUFDQTs7QUFFRCxTQUFPYixRQUFQO0FBQ0EsQ0FoRkQsQyIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9pbnRlZ3JhdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LmludGVncmF0aW9ucyA9IHtcblx0b3V0Z29pbmdFdmVudHM6IHtcblx0XHRzZW5kTWVzc2FnZToge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9TZW5kTWVzc2FnZScsXG5cdFx0XHR2YWx1ZTogJ3NlbmRNZXNzYWdlJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IHRydWUsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRmaWxlVXBsb2FkZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfRmlsZVVwbG9hZGVkJyxcblx0XHRcdHZhbHVlOiAnZmlsZVVwbG9hZGVkJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm9vbUFyY2hpdmVkOiB7XG5cdFx0XHRsYWJlbDogJ0ludGVncmF0aW9uc19PdXRnb2luZ19UeXBlX1Jvb21BcmNoaXZlZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21BcmNoaXZlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogZmFsc2UsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyb29tQ3JlYXRlZDoge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9Sb29tQ3JlYXRlZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21DcmVhdGVkJyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiBmYWxzZSxcblx0XHRcdFx0dHJpZ2dlcldvcmRzOiBmYWxzZSxcblx0XHRcdFx0dGFyZ2V0Um9vbTogZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJvb21Kb2luZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfUm9vbUpvaW5lZCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21Kb2luZWQnLFxuXHRcdFx0dXNlOiB7XG5cdFx0XHRcdGNoYW5uZWw6IHRydWUsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IGZhbHNlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyb29tTGVmdDoge1xuXHRcdFx0bGFiZWw6ICdJbnRlZ3JhdGlvbnNfT3V0Z29pbmdfVHlwZV9Sb29tTGVmdCcsXG5cdFx0XHR2YWx1ZTogJ3Jvb21MZWZ0Jyxcblx0XHRcdHVzZToge1xuXHRcdFx0XHRjaGFubmVsOiB0cnVlLFxuXHRcdFx0XHR0cmlnZ2VyV29yZHM6IGZhbHNlLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dXNlckNyZWF0ZWQ6IHtcblx0XHRcdGxhYmVsOiAnSW50ZWdyYXRpb25zX091dGdvaW5nX1R5cGVfVXNlckNyZWF0ZWQnLFxuXHRcdFx0dmFsdWU6ICd1c2VyQ3JlYXRlZCcsXG5cdFx0XHR1c2U6IHtcblx0XHRcdFx0Y2hhbm5lbDogZmFsc2UsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogZmFsc2UsXG5cdFx0XHRcdHRhcmdldFJvb206IHRydWVcblx0XHRcdH1cblx0XHR9XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIGxvZ2dlcjp0cnVlICovXG4vKiBleHBvcnRlZCBsb2dnZXIgKi9cblxubG9nZ2VyID0gbmV3IExvZ2dlcignSW50ZWdyYXRpb25zJywge1xuXHRzZWN0aW9uczoge1xuXHRcdGluY29taW5nOiAnSW5jb21pbmcgV2ViSG9vaycsXG5cdFx0b3V0Z29pbmc6ICdPdXRnb2luZyBXZWJIb29rJ1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBCYWJlbCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5jb25zdCBzY29wZWRDaGFubmVscyA9IFsnYWxsX3B1YmxpY19jaGFubmVscycsICdhbGxfcHJpdmF0ZV9ncm91cHMnLCAnYWxsX2RpcmVjdF9tZXNzYWdlcyddO1xuY29uc3QgdmFsaWRDaGFubmVsQ2hhcnMgPSBbJ0AnLCAnIyddO1xuXG5mdW5jdGlvbiBfdmVyaWZ5UmVxdWlyZWRGaWVsZHMoaW50ZWdyYXRpb24pIHtcblx0aWYgKCFpbnRlZ3JhdGlvbi5ldmVudCB8fCAhTWF0Y2gudGVzdChpbnRlZ3JhdGlvbi5ldmVudCwgU3RyaW5nKSB8fCBpbnRlZ3JhdGlvbi5ldmVudC50cmltKCkgPT09ICcnIHx8ICFSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tpbnRlZ3JhdGlvbi5ldmVudF0pIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWV2ZW50LXR5cGUnLCAnSW52YWxpZCBldmVudCB0eXBlJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxuXG5cdGlmICghaW50ZWdyYXRpb24udXNlcm5hbWUgfHwgIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24udXNlcm5hbWUsIFN0cmluZykgfHwgaW50ZWdyYXRpb24udXNlcm5hbWUudHJpbSgpID09PSAnJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcm5hbWUnLCAnSW52YWxpZCB1c2VybmFtZScsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlSZXF1aXJlZEZpZWxkcycgfSk7XG5cdH1cblxuXHRpZiAoUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbaW50ZWdyYXRpb24uZXZlbnRdLnVzZS50YXJnZXRSb29tICYmICFpbnRlZ3JhdGlvbi50YXJnZXRSb29tKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC10YXJnZXRSb29tJywgJ0ludmFsaWQgVGFyZ2V0IFJvb20nLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5UmVxdWlyZWRGaWVsZHMnIH0pO1xuXHR9XG5cblx0aWYgKCFNYXRjaC50ZXN0KGludGVncmF0aW9uLnVybHMsIFtTdHJpbmddKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXJscycsICdJbnZhbGlkIFVSTHMnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5UmVxdWlyZWRGaWVsZHMnIH0pO1xuXHR9XG5cblx0Zm9yIChjb25zdCBbaW5kZXgsIHVybF0gb2YgaW50ZWdyYXRpb24udXJscy5lbnRyaWVzKCkpIHtcblx0XHRpZiAodXJsLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdGRlbGV0ZSBpbnRlZ3JhdGlvbi51cmxzW2luZGV4XTtcblx0XHR9XG5cdH1cblxuXHRpbnRlZ3JhdGlvbi51cmxzID0gXy53aXRob3V0KGludGVncmF0aW9uLnVybHMsIFt1bmRlZmluZWRdKTtcblxuXHRpZiAoaW50ZWdyYXRpb24udXJscy5sZW5ndGggPT09IDApIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVybHMnLCAnSW52YWxpZCBVUkxzJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcuX3ZlcmlmeVJlcXVpcmVkRmllbGRzJyB9KTtcblx0fVxufVxuXG5mdW5jdGlvbiBfdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscyhpbnRlZ3JhdGlvbiwgdXNlcklkLCBjaGFubmVscykge1xuXHRmb3IgKGxldCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0aWYgKHNjb3BlZENoYW5uZWxzLmluY2x1ZGVzKGNoYW5uZWwpKSB7XG5cdFx0XHRpZiAoY2hhbm5lbCA9PT0gJ2FsbF9wdWJsaWNfY2hhbm5lbHMnKSB7XG5cdFx0XHRcdC8vIE5vIHNwZWNpYWwgcGVybWlzc2lvbnMgbmVlZGVkIHRvIGFkZCBpbnRlZ3JhdGlvbiB0byBwdWJsaWMgY2hhbm5lbHNcblx0XHRcdH0gZWxzZSBpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nLl92ZXJpZnlVc2VySGFzUGVybWlzc2lvbkZvckNoYW5uZWxzJyB9KTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0bGV0IHJlY29yZDtcblx0XHRcdGNvbnN0IGNoYW5uZWxUeXBlID0gY2hhbm5lbFswXTtcblx0XHRcdGNoYW5uZWwgPSBjaGFubmVsLnN1YnN0cigxKTtcblxuXHRcdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0XHRjYXNlICcjJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e25hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0AnOlxuXHRcdFx0XHRcdHJlY29yZCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRcdFx0JG9yOiBbXG5cdFx0XHRcdFx0XHRcdHtfaWQ6IGNoYW5uZWx9LFxuXHRcdFx0XHRcdFx0XHR7dXNlcm5hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscycgfSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyZWNvcmQudXNlcm5hbWVzICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpICYmICFyZWNvcmQudXNlcm5hbWVzLmluY2x1ZGVzKE1ldGVvci51c2VyKCkudXNlcm5hbWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZy5fdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscycgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIF92ZXJpZnlSZXRyeUluZm9ybWF0aW9uKGludGVncmF0aW9uKSB7XG5cdGlmICghaW50ZWdyYXRpb24ucmV0cnlGYWlsZWRDYWxscykge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdC8vIERvbid0IGFsbG93IG5lZ2F0aXZlIHJldHJ5IGNvdW50c1xuXHRpbnRlZ3JhdGlvbi5yZXRyeUNvdW50ID0gaW50ZWdyYXRpb24ucmV0cnlDb3VudCAmJiBwYXJzZUludChpbnRlZ3JhdGlvbi5yZXRyeUNvdW50KSA+IDAgPyBwYXJzZUludChpbnRlZ3JhdGlvbi5yZXRyeUNvdW50KSA6IDQ7XG5cdGludGVncmF0aW9uLnJldHJ5RGVsYXkgPSAhaW50ZWdyYXRpb24ucmV0cnlEZWxheSB8fCAhaW50ZWdyYXRpb24ucmV0cnlEZWxheS50cmltKCkgPyAncG93ZXJzLW9mLXRlbicgOiBpbnRlZ3JhdGlvbi5yZXRyeURlbGF5LnRvTG93ZXJDYXNlKCk7XG59XG5cblJvY2tldENoYXQuaW50ZWdyYXRpb25zLnZhbGlkYXRlT3V0Z29pbmcgPSBmdW5jdGlvbiBfdmFsaWRhdGVPdXRnb2luZyhpbnRlZ3JhdGlvbiwgdXNlcklkKSB7XG5cdGlmIChpbnRlZ3JhdGlvbi5jaGFubmVsICYmIE1hdGNoLnRlc3QoaW50ZWdyYXRpb24uY2hhbm5lbCwgU3RyaW5nKSAmJiBpbnRlZ3JhdGlvbi5jaGFubmVsLnRyaW0oKSA9PT0gJycpIHtcblx0XHRkZWxldGUgaW50ZWdyYXRpb24uY2hhbm5lbDtcblx0fVxuXG5cdC8vTW92ZWQgdG8gaXQncyBvd24gZnVuY3Rpb24gdG8gc3RhdGlzZnkgdGhlIGNvbXBsZXhpdHkgcnVsZVxuXHRfdmVyaWZ5UmVxdWlyZWRGaWVsZHMoaW50ZWdyYXRpb24pO1xuXG5cdGxldCBjaGFubmVscyA9IFtdO1xuXHRpZiAoUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMub3V0Z29pbmdFdmVudHNbaW50ZWdyYXRpb24uZXZlbnRdLnVzZS5jaGFubmVsKSB7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KGludGVncmF0aW9uLmNoYW5uZWwsIFN0cmluZykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIENoYW5uZWwnLCB7IGZ1bmN0aW9uOiAndmFsaWRhdGVPdXRnb2luZycgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNoYW5uZWxzID0gXy5tYXAoaW50ZWdyYXRpb24uY2hhbm5lbC5zcGxpdCgnLCcpLCAoY2hhbm5lbCkgPT4gcy50cmltKGNoYW5uZWwpKTtcblxuXHRcdFx0Zm9yIChjb25zdCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRcdGlmICghdmFsaWRDaGFubmVsQ2hhcnMuaW5jbHVkZXMoY2hhbm5lbFswXSkgJiYgIXNjb3BlZENoYW5uZWxzLmluY2x1ZGVzKGNoYW5uZWwudG9Mb3dlckNhc2UoKSkpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwtc3RhcnQtd2l0aC1jaGFycycsICdJbnZhbGlkIGNoYW5uZWwuIFN0YXJ0IHdpdGggQCBvciAjJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9IGVsc2UgaWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1wZXJtaXNzaW9ucycsICdJbnZhbGlkIHBlcm1pc3Npb24gZm9yIHJlcXVpcmVkIEludGVncmF0aW9uIGNyZWF0aW9uLicsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nJyB9KTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LmludGVncmF0aW9ucy5vdXRnb2luZ0V2ZW50c1tpbnRlZ3JhdGlvbi5ldmVudF0udXNlLnRyaWdnZXJXb3JkcyAmJiBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHMpIHtcblx0XHRpZiAoIU1hdGNoLnRlc3QoaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzLCBbU3RyaW5nXSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdHJpZ2dlcldvcmRzJywgJ0ludmFsaWQgdHJpZ2dlcldvcmRzJywgeyBmdW5jdGlvbjogJ3ZhbGlkYXRlT3V0Z29pbmcnIH0pO1xuXHRcdH1cblxuXHRcdGludGVncmF0aW9uLnRyaWdnZXJXb3Jkcy5mb3JFYWNoKCh3b3JkLCBpbmRleCkgPT4ge1xuXHRcdFx0aWYgKCF3b3JkIHx8IHdvcmQudHJpbSgpID09PSAnJykge1xuXHRcdFx0XHRkZWxldGUgaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzW2luZGV4XTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGludGVncmF0aW9uLnRyaWdnZXJXb3JkcyA9IF8ud2l0aG91dChpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZHMsIFt1bmRlZmluZWRdKTtcblx0fSBlbHNlIHtcblx0XHRkZWxldGUgaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzO1xuXHR9XG5cblx0aWYgKGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQgPT09IHRydWUgJiYgaW50ZWdyYXRpb24uc2NyaXB0ICYmIGludGVncmF0aW9uLnNjcmlwdC50cmltKCkgIT09ICcnKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IGJhYmVsT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oQmFiZWwuZ2V0RGVmYXVsdE9wdGlvbnMoeyBydW50aW1lOiBmYWxzZSB9KSwgeyBjb21wYWN0OiB0cnVlLCBtaW5pZmllZDogdHJ1ZSwgY29tbWVudHM6IGZhbHNlIH0pO1xuXG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IEJhYmVsLmNvbXBpbGUoaW50ZWdyYXRpb24uc2NyaXB0LCBiYWJlbE9wdGlvbnMpLmNvZGU7XG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvciA9IHVuZGVmaW5lZDtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCA9IHVuZGVmaW5lZDtcblx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gXy5waWNrKGUsICduYW1lJywgJ21lc3NhZ2UnLCAnc3RhY2snKTtcblx0XHR9XG5cdH1cblxuXHRpZiAodHlwZW9mIGludGVncmF0aW9uLnJ1bk9uRWRpdHMgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0Ly8gVmVyaWZ5IHRoaXMgdmFsdWUgaXMgb25seSB0cnVlL2ZhbHNlXG5cdFx0aW50ZWdyYXRpb24ucnVuT25FZGl0cyA9IGludGVncmF0aW9uLnJ1bk9uRWRpdHMgPT09IHRydWU7XG5cdH1cblxuXHRfdmVyaWZ5VXNlckhhc1Blcm1pc3Npb25Gb3JDaGFubmVscyhpbnRlZ3JhdGlvbiwgdXNlcklkLCBjaGFubmVscyk7XG5cdF92ZXJpZnlSZXRyeUluZm9ybWF0aW9uKGludGVncmF0aW9uKTtcblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7IHVzZXJuYW1lOiBpbnRlZ3JhdGlvbi51c2VybmFtZSB9KTtcblxuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyIChkaWQgeW91IGRlbGV0ZSB0aGUgYHJvY2tldC5jYXRgIHVzZXI/KScsIHsgZnVuY3Rpb246ICd2YWxpZGF0ZU91dGdvaW5nJyB9KTtcblx0fVxuXG5cdGludGVncmF0aW9uLnR5cGUgPSAnd2ViaG9vay1vdXRnb2luZyc7XG5cdGludGVncmF0aW9uLnVzZXJJZCA9IHVzZXIuX2lkO1xuXHRpbnRlZ3JhdGlvbi5jaGFubmVsID0gY2hhbm5lbHM7XG5cblx0cmV0dXJuIGludGVncmF0aW9uO1xufTtcbiIsIi8qIGdsb2JhbCBsb2dnZXIsIHByb2Nlc3NXZWJob29rTWVzc2FnZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5pbXBvcnQgdm0gZnJvbSAndm0nO1xuXG5Sb2NrZXRDaGF0LmludGVncmF0aW9ucy50cmlnZ2VySGFuZGxlciA9IG5ldyBjbGFzcyBSb2NrZXRDaGF0SW50ZWdyYXRpb25IYW5kbGVyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy52bSA9IHZtO1xuXHRcdHRoaXMuc3VjY2Vzc1Jlc3VsdHMgPSBbMjAwLCAyMDEsIDIwMl07XG5cdFx0dGhpcy5jb21waWxlZFNjcmlwdHMgPSB7fTtcblx0XHR0aGlzLnRyaWdnZXJzID0ge307XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZCh7dHlwZTogJ3dlYmhvb2stb3V0Z29pbmcnfSkub2JzZXJ2ZSh7XG5cdFx0XHRhZGRlZDogKHJlY29yZCkgPT4ge1xuXHRcdFx0XHR0aGlzLmFkZEludGVncmF0aW9uKHJlY29yZCk7XG5cdFx0XHR9LFxuXG5cdFx0XHRjaGFuZ2VkOiAocmVjb3JkKSA9PiB7XG5cdFx0XHRcdHRoaXMucmVtb3ZlSW50ZWdyYXRpb24ocmVjb3JkKTtcblx0XHRcdFx0dGhpcy5hZGRJbnRlZ3JhdGlvbihyZWNvcmQpO1xuXHRcdFx0fSxcblxuXHRcdFx0cmVtb3ZlZDogKHJlY29yZCkgPT4ge1xuXHRcdFx0XHR0aGlzLnJlbW92ZUludGVncmF0aW9uKHJlY29yZCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRhZGRJbnRlZ3JhdGlvbihyZWNvcmQpIHtcblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEFkZGluZyB0aGUgaW50ZWdyYXRpb24gJHsgcmVjb3JkLm5hbWUgfSBvZiB0aGUgZXZlbnQgJHsgcmVjb3JkLmV2ZW50IH0hYCk7XG5cdFx0bGV0IGNoYW5uZWxzO1xuXHRcdGlmIChyZWNvcmQuZXZlbnQgJiYgIVJvY2tldENoYXQuaW50ZWdyYXRpb25zLm91dGdvaW5nRXZlbnRzW3JlY29yZC5ldmVudF0udXNlLmNoYW5uZWwpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZygnVGhlIGludGVncmF0aW9uIGRvZXNudCByZWx5IG9uIGNoYW5uZWxzLicpO1xuXHRcdFx0Ly9XZSBkb24ndCB1c2UgYW55IGNoYW5uZWxzLCBzbyBpdCdzIHNwZWNpYWwgOylcblx0XHRcdGNoYW5uZWxzID0gWydfX2FueSddO1xuXHRcdH0gZWxzZSBpZiAoXy5pc0VtcHR5KHJlY29yZC5jaGFubmVsKSkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdUaGUgaW50ZWdyYXRpb24gaGFkIGFuIGVtcHR5IGNoYW5uZWwgcHJvcGVydHksIHNvIGl0IGlzIGdvaW5nIG9uIGFsbCB0aGUgcHVibGljIGNoYW5uZWxzLicpO1xuXHRcdFx0Y2hhbm5lbHMgPSBbJ2FsbF9wdWJsaWNfY2hhbm5lbHMnXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdUaGUgaW50ZWdyYXRpb24gaXMgZ29pbmcgb24gdGhlc2UgY2hhbm5lbHM6JywgcmVjb3JkLmNoYW5uZWwpO1xuXHRcdFx0Y2hhbm5lbHMgPSBbXS5jb25jYXQocmVjb3JkLmNoYW5uZWwpO1xuXHRcdH1cblxuXHRcdGZvciAoY29uc3QgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdFx0aWYgKCF0aGlzLnRyaWdnZXJzW2NoYW5uZWxdKSB7XG5cdFx0XHRcdHRoaXMudHJpZ2dlcnNbY2hhbm5lbF0gPSB7fTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy50cmlnZ2Vyc1tjaGFubmVsXVtyZWNvcmQuX2lkXSA9IHJlY29yZDtcblx0XHR9XG5cdH1cblxuXHRyZW1vdmVJbnRlZ3JhdGlvbihyZWNvcmQpIHtcblx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzKSkge1xuXHRcdFx0ZGVsZXRlIHRyaWdnZXJbcmVjb3JkLl9pZF07XG5cdFx0fVxuXHR9XG5cblx0aXNUcmlnZ2VyRW5hYmxlZCh0cmlnZ2VyKSB7XG5cdFx0Zm9yIChjb25zdCB0cmlnIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2VycykpIHtcblx0XHRcdGlmICh0cmlnW3RyaWdnZXIuX2lkXSkge1xuXHRcdFx0XHRyZXR1cm4gdHJpZ1t0cmlnZ2VyLl9pZF0uZW5hYmxlZDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHR1cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwLCBpbnRlZ3JhdGlvbiwgZXZlbnQsIGRhdGEsIHRyaWdnZXJXb3JkLCByYW5QcmVwYXJlU2NyaXB0LCBwcmVwYXJlU2VudE1lc3NhZ2UsIHByb2Nlc3NTZW50TWVzc2FnZSwgcmVzdWx0TWVzc2FnZSwgZmluaXNoZWQsIHVybCwgaHR0cENhbGxEYXRhLCBodHRwRXJyb3IsIGh0dHBSZXN1bHQsIGVycm9yLCBlcnJvclN0YWNrIH0pIHtcblx0XHRjb25zdCBoaXN0b3J5ID0ge1xuXHRcdFx0dHlwZTogJ291dGdvaW5nLXdlYmhvb2snLFxuXHRcdFx0c3RlcFxuXHRcdH07XG5cblx0XHQvLyBVc3VhbGx5IGlzIG9ubHkgYWRkZWQgb24gaW5pdGlhbCBpbnNlcnRcblx0XHRpZiAoaW50ZWdyYXRpb24pIHtcblx0XHRcdGhpc3RvcnkuaW50ZWdyYXRpb24gPSBpbnRlZ3JhdGlvbjtcblx0XHR9XG5cblx0XHQvLyBVc3VhbGx5IGlzIG9ubHkgYWRkZWQgb24gaW5pdGlhbCBpbnNlcnRcblx0XHRpZiAoZXZlbnQpIHtcblx0XHRcdGhpc3RvcnkuZXZlbnQgPSBldmVudDtcblx0XHR9XG5cblx0XHRpZiAoZGF0YSkge1xuXHRcdFx0aGlzdG9yeS5kYXRhID0gZGF0YTtcblxuXHRcdFx0aWYgKGRhdGEudXNlcikge1xuXHRcdFx0XHRoaXN0b3J5LmRhdGEudXNlciA9IF8ub21pdChkYXRhLnVzZXIsIFsnbWV0YScsICckbG9raScsICdzZXJ2aWNlcyddKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRhdGEucm9vbSkge1xuXHRcdFx0XHRoaXN0b3J5LmRhdGEucm9vbSA9IF8ub21pdChkYXRhLnJvb20sIFsnbWV0YScsICckbG9raScsICd1c2VybmFtZXMnXSk7XG5cdFx0XHRcdGhpc3RvcnkuZGF0YS5yb29tLnVzZXJuYW1lcyA9IFsndGhpc193aWxsX2JlX2ZpbGxlZF9pbl93aXRoX3VzZXJuYW1lc193aGVuX3JlcGxheWVkJ107XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRyaWdnZXJXb3JkKSB7XG5cdFx0XHRoaXN0b3J5LnRyaWdnZXJXb3JkID0gdHJpZ2dlcldvcmQ7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiByYW5QcmVwYXJlU2NyaXB0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5yYW5QcmVwYXJlU2NyaXB0ID0gcmFuUHJlcGFyZVNjcmlwdDtcblx0XHR9XG5cblx0XHRpZiAocHJlcGFyZVNlbnRNZXNzYWdlKSB7XG5cdFx0XHRoaXN0b3J5LnByZXBhcmVTZW50TWVzc2FnZSA9IHByZXBhcmVTZW50TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAocHJvY2Vzc1NlbnRNZXNzYWdlKSB7XG5cdFx0XHRoaXN0b3J5LnByb2Nlc3NTZW50TWVzc2FnZSA9IHByb2Nlc3NTZW50TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAocmVzdWx0TWVzc2FnZSkge1xuXHRcdFx0aGlzdG9yeS5yZXN1bHRNZXNzYWdlID0gcmVzdWx0TWVzc2FnZTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGZpbmlzaGVkICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5maW5pc2hlZCA9IGZpbmlzaGVkO1xuXHRcdH1cblxuXHRcdGlmICh1cmwpIHtcblx0XHRcdGhpc3RvcnkudXJsID0gdXJsO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgaHR0cENhbGxEYXRhICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5odHRwQ2FsbERhdGEgPSBodHRwQ2FsbERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKGh0dHBFcnJvcikge1xuXHRcdFx0aGlzdG9yeS5odHRwRXJyb3IgPSBodHRwRXJyb3I7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBodHRwUmVzdWx0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0aGlzdG9yeS5odHRwUmVzdWx0ID0gSlNPTi5zdHJpbmdpZnkoaHR0cFJlc3VsdCwgbnVsbCwgMik7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBlcnJvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGhpc3RvcnkuZXJyb3IgPSBlcnJvcjtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGVycm9yU3RhY2sgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRoaXN0b3J5LmVycm9yU3RhY2sgPSBlcnJvclN0YWNrO1xuXHRcdH1cblxuXHRcdGlmIChoaXN0b3J5SWQpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS51cGRhdGUoeyBfaWQ6IGhpc3RvcnlJZCB9LCB7ICRzZXQ6IGhpc3RvcnkgfSk7XG5cdFx0XHRyZXR1cm4gaGlzdG9yeUlkO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRoaXN0b3J5Ll9jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5pbnNlcnQoT2JqZWN0LmFzc2lnbih7IF9pZDogUmFuZG9tLmlkKCkgfSwgaGlzdG9yeSkpO1xuXHRcdH1cblx0fVxuXG5cdC8vVHJpZ2dlciBpcyB0aGUgdHJpZ2dlciwgbmFtZU9ySWQgaXMgYSBzdHJpbmcgd2hpY2ggaXMgdXNlZCB0byB0cnkgYW5kIGZpbmQgYSByb29tLCByb29tIGlzIGEgcm9vbSwgbWVzc2FnZSBpcyBhIG1lc3NhZ2UsIGFuZCBkYXRhIGNvbnRhaW5zIFwidXNlcl9uYW1lXCIgaWYgdHJpZ2dlci5pbXBlcnNvbmF0ZVVzZXIgaXMgdHJ1dGhmdWwuXG5cdHNlbmRNZXNzYWdlKHsgdHJpZ2dlciwgbmFtZU9ySWQgPSAnJywgcm9vbSwgbWVzc2FnZSwgZGF0YSB9KSB7XG5cdFx0bGV0IHVzZXI7XG5cdFx0Ly9UcnkgdG8gZmluZCB0aGUgdXNlciB3aG8gd2UgYXJlIGltcGVyc29uYXRpbmdcblx0XHRpZiAodHJpZ2dlci5pbXBlcnNvbmF0ZVVzZXIpIHtcblx0XHRcdHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZShkYXRhLnVzZXJfbmFtZSk7XG5cdFx0fVxuXG5cdFx0Ly9JZiB0aGV5IGRvbid0IGV4aXN0IChha2EgdGhlIHRyaWdnZXIgZGlkbid0IGNvbnRhaW4gYSB1c2VyKSB0aGVuIHdlIHNldCB0aGUgdXNlciBiYXNlZCB1cG9uIHRoZVxuXHRcdC8vY29uZmlndXJlZCB1c2VybmFtZSBmb3IgdGhlIGludGVncmF0aW9uIHNpbmNlIHRoaXMgaXMgcmVxdWlyZWQgYXQgYWxsIHRpbWVzLlxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHRyaWdnZXIudXNlcm5hbWUpO1xuXHRcdH1cblxuXHRcdGxldCB0bXBSb29tO1xuXHRcdGlmIChuYW1lT3JJZCB8fCB0cmlnZ2VyLnRhcmdldFJvb20gfHwgbWVzc2FnZS5jaGFubmVsKSB7XG5cdFx0XHR0bXBSb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IG5hbWVPcklkIHx8IG1lc3NhZ2UuY2hhbm5lbCB8fCB0cmlnZ2VyLnRhcmdldFJvb20sIGVycm9yT25FbXB0eTogZmFsc2UgfSkgfHwgcm9vbTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dG1wUm9vbSA9IHJvb207XG5cdFx0fVxuXG5cdFx0Ly9JZiBubyByb29tIGNvdWxkIGJlIGZvdW5kLCB3ZSB3b24ndCBiZSBzZW5kaW5nIGFueSBtZXNzYWdlcyBidXQgd2UnbGwgd2FybiBpbiB0aGUgbG9nc1xuXHRcdGlmICghdG1wUm9vbSkge1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLndhcm4oYFRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgZG9lc24ndCBoYXZlIGEgcm9vbSBjb25maWd1cmVkIG5vciBkaWQgaXQgcHJvdmlkZSBhIHJvb20gdG8gc2VuZCB0aGUgbWVzc2FnZSB0by5gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEZvdW5kIGEgcm9vbSBmb3IgJHsgdHJpZ2dlci5uYW1lIH0gd2hpY2ggaXM6ICR7IHRtcFJvb20ubmFtZSB9IHdpdGggYSB0eXBlIG9mICR7IHRtcFJvb20udCB9YCk7XG5cblx0XHRtZXNzYWdlLmJvdCA9IHsgaTogdHJpZ2dlci5faWQgfTtcblxuXHRcdGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB7XG5cdFx0XHRhbGlhczogdHJpZ2dlci5hbGlhcyxcblx0XHRcdGF2YXRhcjogdHJpZ2dlci5hdmF0YXIsXG5cdFx0XHRlbW9qaTogdHJpZ2dlci5lbW9qaVxuXHRcdH07XG5cblx0XHRpZiAodG1wUm9vbS50ID09PSAnZCcpIHtcblx0XHRcdG1lc3NhZ2UuY2hhbm5lbCA9IGBAJHsgdG1wUm9vbS5faWQgfWA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG1lc3NhZ2UuY2hhbm5lbCA9IGAjJHsgdG1wUm9vbS5faWQgfWA7XG5cdFx0fVxuXG5cdFx0bWVzc2FnZSA9IHByb2Nlc3NXZWJob29rTWVzc2FnZShtZXNzYWdlLCB1c2VyLCBkZWZhdWx0VmFsdWVzKTtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGJ1aWxkU2FuZGJveChzdG9yZSA9IHt9KSB7XG5cdFx0Y29uc3Qgc2FuZGJveCA9IHtcblx0XHRcdF8sIHMsIGNvbnNvbGUsIG1vbWVudCxcblx0XHRcdFN0b3JlOiB7XG5cdFx0XHRcdHNldDogKGtleSwgdmFsKSA9PiBzdG9yZVtrZXldID0gdmFsLFxuXHRcdFx0XHRnZXQ6IChrZXkpID0+IHN0b3JlW2tleV1cblx0XHRcdH0sXG5cdFx0XHRIVFRQOiAobWV0aG9kLCB1cmwsIG9wdGlvbnMpID0+IHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0cmVzdWx0OiBIVFRQLmNhbGwobWV0aG9kLCB1cmwsIG9wdGlvbnMpXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRyZXR1cm4geyBlcnJvciB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdE9iamVjdC5rZXlzKFJvY2tldENoYXQubW9kZWxzKS5maWx0ZXIoayA9PiAhay5zdGFydHNXaXRoKCdfJykpLmZvckVhY2goayA9PiB7XG5cdFx0XHRzYW5kYm94W2tdID0gUm9ja2V0Q2hhdC5tb2RlbHNba107XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4geyBzdG9yZSwgc2FuZGJveCB9O1xuXHR9XG5cblx0Z2V0SW50ZWdyYXRpb25TY3JpcHQoaW50ZWdyYXRpb24pIHtcblx0XHRjb25zdCBjb21waWxlZFNjcmlwdCA9IHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF07XG5cdFx0aWYgKGNvbXBpbGVkU2NyaXB0ICYmICtjb21waWxlZFNjcmlwdC5fdXBkYXRlZEF0ID09PSAraW50ZWdyYXRpb24uX3VwZGF0ZWRBdCkge1xuXHRcdFx0cmV0dXJuIGNvbXBpbGVkU2NyaXB0LnNjcmlwdDtcblx0XHR9XG5cblx0XHRjb25zdCBzY3JpcHQgPSBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZDtcblx0XHRjb25zdCB7IHN0b3JlLCBzYW5kYm94IH0gPSB0aGlzLmJ1aWxkU2FuZGJveCgpO1xuXG5cdFx0bGV0IHZtU2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbygnV2lsbCBldmFsdWF0ZSBzY3JpcHQgb2YgVHJpZ2dlcicsIGludGVncmF0aW9uLm5hbWUpO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKHNjcmlwdCk7XG5cblx0XHRcdHZtU2NyaXB0ID0gdGhpcy52bS5jcmVhdGVTY3JpcHQoc2NyaXB0LCAnc2NyaXB0LmpzJyk7XG5cblx0XHRcdHZtU2NyaXB0LnJ1bkluTmV3Q29udGV4dChzYW5kYm94KTtcblxuXHRcdFx0aWYgKHNhbmRib3guU2NyaXB0KSB7XG5cdFx0XHRcdHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF0gPSB7XG5cdFx0XHRcdFx0c2NyaXB0OiBuZXcgc2FuZGJveC5TY3JpcHQoKSxcblx0XHRcdFx0XHRzdG9yZSxcblx0XHRcdFx0XHRfdXBkYXRlZEF0OiBpbnRlZ3JhdGlvbi5fdXBkYXRlZEF0XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIHRoaXMuY29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF0uc2NyaXB0O1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgZXZhbHVhdGluZyBTY3JpcHQgaW4gVHJpZ2dlciAkeyBpbnRlZ3JhdGlvbi5uYW1lIH06YCk7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3Ioc2NyaXB0LnJlcGxhY2UoL14vZ20sICcgICcpKTtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcignU3RhY2sgVHJhY2U6Jyk7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoZS5zdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ldmFsdWF0aW5nLXNjcmlwdCcpO1xuXHRcdH1cblxuXHRcdGlmICghc2FuZGJveC5TY3JpcHQpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgQ2xhc3MgXCJTY3JpcHRcIiBub3QgaW4gVHJpZ2dlciAkeyBpbnRlZ3JhdGlvbi5uYW1lIH06YCk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdjbGFzcy1zY3JpcHQtbm90LWZvdW5kJyk7XG5cdFx0fVxuXHR9XG5cblx0aGFzU2NyaXB0QW5kTWV0aG9kKGludGVncmF0aW9uLCBtZXRob2QpIHtcblx0XHRpZiAoaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCAhPT0gdHJ1ZSB8fCAhaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQgfHwgaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQudHJpbSgpID09PSAnJykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGxldCBzY3JpcHQ7XG5cdFx0dHJ5IHtcblx0XHRcdHNjcmlwdCA9IHRoaXMuZ2V0SW50ZWdyYXRpb25TY3JpcHQoaW50ZWdyYXRpb24pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHlwZW9mIHNjcmlwdFttZXRob2RdICE9PSAndW5kZWZpbmVkJztcblx0fVxuXG5cdGV4ZWN1dGVTY3JpcHQoaW50ZWdyYXRpb24sIG1ldGhvZCwgcGFyYW1zLCBoaXN0b3J5SWQpIHtcblx0XHRsZXQgc2NyaXB0O1xuXHRcdHRyeSB7XG5cdFx0XHRzY3JpcHQgPSB0aGlzLmdldEludGVncmF0aW9uU2NyaXB0KGludGVncmF0aW9uKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdleGVjdXRlLXNjcmlwdC1nZXR0aW5nLXNjcmlwdCcsIGVycm9yOiB0cnVlLCBlcnJvclN0YWNrOiBlIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghc2NyaXB0W21ldGhvZF0pIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgTWV0aG9kIFwiJHsgbWV0aG9kIH1cIiBubyBmb3VuZCBpbiB0aGUgSW50ZWdyYXRpb24gXCIkeyBpbnRlZ3JhdGlvbi5uYW1lIH1cImApO1xuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiBgZXhlY3V0ZS1zY3JpcHQtbm8tbWV0aG9kLSR7IG1ldGhvZCB9YCB9KTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgeyBzYW5kYm94IH0gPSB0aGlzLmJ1aWxkU2FuZGJveCh0aGlzLmNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdLnN0b3JlKTtcblx0XHRcdHNhbmRib3guc2NyaXB0ID0gc2NyaXB0O1xuXHRcdFx0c2FuZGJveC5tZXRob2QgPSBtZXRob2Q7XG5cdFx0XHRzYW5kYm94LnBhcmFtcyA9IHBhcmFtcztcblxuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiBgZXhlY3V0ZS1zY3JpcHQtYmVmb3JlLXJ1bm5pbmctJHsgbWV0aG9kIH1gIH0pO1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gdGhpcy52bS5ydW5Jbk5ld0NvbnRleHQoJ3NjcmlwdFttZXRob2RdKHBhcmFtcyknLCBzYW5kYm94LCB7IHRpbWVvdXQ6IDMwMDAgfSk7XG5cblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhgU2NyaXB0IG1ldGhvZCBcIiR7IG1ldGhvZCB9XCIgcmVzdWx0IG9mIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IGludGVncmF0aW9uLm5hbWUgfVwiIGlzOmApO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKHJlc3VsdCk7XG5cblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiBgZXhlY3V0ZS1zY3JpcHQtZXJyb3ItcnVubmluZy0keyBtZXRob2QgfWAsIGVycm9yOiB0cnVlLCBlcnJvclN0YWNrOiBlLnN0YWNrLnJlcGxhY2UoL14vZ20sICcgICcpIH0pO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGBFcnJvciBydW5uaW5nIFNjcmlwdCBpbiB0aGUgSW50ZWdyYXRpb24gJHsgaW50ZWdyYXRpb24ubmFtZSB9OmApO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkLnJlcGxhY2UoL14vZ20sICcgICcpKTsgLy8gT25seSBvdXRwdXQgdGhlIGNvbXBpbGVkIHNjcmlwdCBpZiBkZWJ1Z2dpbmcgaXMgZW5hYmxlZCwgc28gdGhlIGxvZ3MgZG9uJ3QgZ2V0IHNwYW1tZWQuXG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoJ1N0YWNrOicpO1xuXHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGUuc3RhY2sucmVwbGFjZSgvXi9nbSwgJyAgJykpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxuXG5cdGV2ZW50TmFtZUFyZ3VtZW50c1RvT2JqZWN0KCkge1xuXHRcdGNvbnN0IGFyZ09iamVjdCA9IHtcblx0XHRcdGV2ZW50OiBhcmd1bWVudHNbMF1cblx0XHR9O1xuXG5cdFx0c3dpdGNoIChhcmdPYmplY3QuZXZlbnQpIHtcblx0XHRcdGNhc2UgJ3NlbmRNZXNzYWdlJzpcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuXHRcdFx0XHRcdGFyZ09iamVjdC5tZXNzYWdlID0gYXJndW1lbnRzWzFdO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5yb29tID0gYXJndW1lbnRzWzJdO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSAnZmlsZVVwbG9hZGVkJzpcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMikge1xuXHRcdFx0XHRcdGNvbnN0IGFyZ2hoaCA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0XHRhcmdPYmplY3QudXNlciA9IGFyZ2hoaC51c2VyO1xuXHRcdFx0XHRcdGFyZ09iamVjdC5yb29tID0gYXJnaGhoLnJvb207XG5cdFx0XHRcdFx0YXJnT2JqZWN0Lm1lc3NhZ2UgPSBhcmdoaGgubWVzc2FnZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Jvb21BcmNoaXZlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0XHRhcmdPYmplY3QudXNlciA9IGFyZ3VtZW50c1syXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Jvb21DcmVhdGVkJzpcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuXHRcdFx0XHRcdGFyZ09iamVjdC5vd25lciA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0XHRhcmdPYmplY3Qucm9vbSA9IGFyZ3VtZW50c1syXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Jvb21Kb2luZWQnOlxuXHRcdFx0Y2FzZSAncm9vbUxlZnQnOlxuXHRcdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSB7XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnVzZXIgPSBhcmd1bWVudHNbMV07XG5cdFx0XHRcdFx0YXJnT2JqZWN0LnJvb20gPSBhcmd1bWVudHNbMl07XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd1c2VyQ3JlYXRlZCc6XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDIpIHtcblx0XHRcdFx0XHRhcmdPYmplY3QudXNlciA9IGFyZ3VtZW50c1sxXTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGxvZ2dlci5vdXRnb2luZy53YXJuKGBBbiBVbmhhbmRsZWQgVHJpZ2dlciBFdmVudCB3YXMgY2FsbGVkOiAkeyBhcmdPYmplY3QuZXZlbnQgfWApO1xuXHRcdFx0XHRhcmdPYmplY3QuZXZlbnQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblxuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhgR290IHRoZSBldmVudCBhcmd1bWVudHMgZm9yIHRoZSBldmVudDogJHsgYXJnT2JqZWN0LmV2ZW50IH1gLCBhcmdPYmplY3QpO1xuXG5cdFx0cmV0dXJuIGFyZ09iamVjdDtcblx0fVxuXG5cdG1hcEV2ZW50QXJnc1RvRGF0YShkYXRhLCB7IGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9KSB7XG5cdFx0c3dpdGNoIChldmVudCkge1xuXHRcdFx0Y2FzZSAnc2VuZE1lc3NhZ2UnOlxuXHRcdFx0XHRkYXRhLmNoYW5uZWxfaWQgPSByb29tLl9pZDtcblx0XHRcdFx0ZGF0YS5jaGFubmVsX25hbWUgPSByb29tLm5hbWU7XG5cdFx0XHRcdGRhdGEubWVzc2FnZV9pZCA9IG1lc3NhZ2UuX2lkO1xuXHRcdFx0XHRkYXRhLnRpbWVzdGFtcCA9IG1lc3NhZ2UudHM7XG5cdFx0XHRcdGRhdGEudXNlcl9pZCA9IG1lc3NhZ2UudS5faWQ7XG5cdFx0XHRcdGRhdGEudXNlcl9uYW1lID0gbWVzc2FnZS51LnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnRleHQgPSBtZXNzYWdlLm1zZztcblxuXHRcdFx0XHRpZiAobWVzc2FnZS5hbGlhcykge1xuXHRcdFx0XHRcdGRhdGEuYWxpYXMgPSBtZXNzYWdlLmFsaWFzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYm90KSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSBtZXNzYWdlLmJvdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0XHRcdFx0ZGF0YS5pc0VkaXRlZCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICdmaWxlVXBsb2FkZWQnOlxuXHRcdFx0XHRkYXRhLmNoYW5uZWxfaWQgPSByb29tLl9pZDtcblx0XHRcdFx0ZGF0YS5jaGFubmVsX25hbWUgPSByb29tLm5hbWU7XG5cdFx0XHRcdGRhdGEubWVzc2FnZV9pZCA9IG1lc3NhZ2UuX2lkO1xuXHRcdFx0XHRkYXRhLnRpbWVzdGFtcCA9IG1lc3NhZ2UudHM7XG5cdFx0XHRcdGRhdGEudXNlcl9pZCA9IG1lc3NhZ2UudS5faWQ7XG5cdFx0XHRcdGRhdGEudXNlcl9uYW1lID0gbWVzc2FnZS51LnVzZXJuYW1lO1xuXHRcdFx0XHRkYXRhLnRleHQgPSBtZXNzYWdlLm1zZztcblx0XHRcdFx0ZGF0YS51c2VyID0gdXNlcjtcblx0XHRcdFx0ZGF0YS5yb29tID0gcm9vbTtcblx0XHRcdFx0ZGF0YS5tZXNzYWdlID0gbWVzc2FnZTtcblxuXHRcdFx0XHRpZiAobWVzc2FnZS5hbGlhcykge1xuXHRcdFx0XHRcdGRhdGEuYWxpYXMgPSBtZXNzYWdlLmFsaWFzO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKG1lc3NhZ2UuYm90KSB7XG5cdFx0XHRcdFx0ZGF0YS5ib3QgPSBtZXNzYWdlLmJvdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Jvb21DcmVhdGVkJzpcblx0XHRcdFx0ZGF0YS5jaGFubmVsX2lkID0gcm9vbS5faWQ7XG5cdFx0XHRcdGRhdGEuY2hhbm5lbF9uYW1lID0gcm9vbS5uYW1lO1xuXHRcdFx0XHRkYXRhLnRpbWVzdGFtcCA9IHJvb20udHM7XG5cdFx0XHRcdGRhdGEudXNlcl9pZCA9IG93bmVyLl9pZDtcblx0XHRcdFx0ZGF0YS51c2VyX25hbWUgPSBvd25lci51c2VybmFtZTtcblx0XHRcdFx0ZGF0YS5vd25lciA9IG93bmVyO1xuXHRcdFx0XHRkYXRhLnJvb20gPSByb29tO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ3Jvb21BcmNoaXZlZCc6XG5cdFx0XHRjYXNlICdyb29tSm9pbmVkJzpcblx0XHRcdGNhc2UgJ3Jvb21MZWZ0Jzpcblx0XHRcdFx0ZGF0YS50aW1lc3RhbXAgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0XHRkYXRhLmNoYW5uZWxfaWQgPSByb29tLl9pZDtcblx0XHRcdFx0ZGF0YS5jaGFubmVsX25hbWUgPSByb29tLm5hbWU7XG5cdFx0XHRcdGRhdGEudXNlcl9pZCA9IHVzZXIuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IHVzZXIudXNlcm5hbWU7XG5cdFx0XHRcdGRhdGEudXNlciA9IHVzZXI7XG5cdFx0XHRcdGRhdGEucm9vbSA9IHJvb207XG5cblx0XHRcdFx0aWYgKHVzZXIudHlwZSA9PT0gJ2JvdCcpIHtcblx0XHRcdFx0XHRkYXRhLmJvdCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlICd1c2VyQ3JlYXRlZCc6XG5cdFx0XHRcdGRhdGEudGltZXN0YW1wID0gdXNlci5jcmVhdGVkQXQ7XG5cdFx0XHRcdGRhdGEudXNlcl9pZCA9IHVzZXIuX2lkO1xuXHRcdFx0XHRkYXRhLnVzZXJfbmFtZSA9IHVzZXIudXNlcm5hbWU7XG5cdFx0XHRcdGRhdGEudXNlciA9IHVzZXI7XG5cblx0XHRcdFx0aWYgKHVzZXIudHlwZSA9PT0gJ2JvdCcpIHtcblx0XHRcdFx0XHRkYXRhLmJvdCA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH1cblxuXHRleGVjdXRlVHJpZ2dlcnMoKSB7XG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdFeGVjdXRlIFRyaWdnZXI6JywgYXJndW1lbnRzWzBdKTtcblxuXHRcdGNvbnN0IGFyZ09iamVjdCA9IHRoaXMuZXZlbnROYW1lQXJndW1lbnRzVG9PYmplY3QoLi4uYXJndW1lbnRzKTtcblx0XHRjb25zdCB7IGV2ZW50LCBtZXNzYWdlLCByb29tIH0gPSBhcmdPYmplY3Q7XG5cblx0XHQvL0VhY2ggdHlwZSBvZiBldmVudCBzaG91bGQgaGF2ZSBhbiBldmVudCBhbmQgYSByb29tIGF0dGFjaGVkLCBvdGhlcndpc2Ugd2Vcblx0XHQvL3dvdWxkbid0IGtub3cgaG93IHRvIGhhbmRsZSB0aGUgdHJpZ2dlciBub3Igd291bGQgd2UgaGF2ZSBhbnl3aGVyZSB0byBzZW5kIHRoZVxuXHRcdC8vcmVzdWx0IG9mIHRoZSBpbnRlZ3JhdGlvblxuXHRcdGlmICghZXZlbnQpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0cmlnZ2Vyc1RvRXhlY3V0ZSA9IFtdO1xuXG5cdFx0bG9nZ2VyLm91dGdvaW5nLmRlYnVnKCdTdGFydGluZyBzZWFyY2ggZm9yIHRyaWdnZXJzIGZvciB0aGUgcm9vbTonLCByb29tID8gcm9vbS5faWQgOiAnX19hbnknKTtcblx0XHRpZiAocm9vbSkge1xuXHRcdFx0c3dpdGNoIChyb29tLnQpIHtcblx0XHRcdFx0Y2FzZSAnZCc6XG5cdFx0XHRcdFx0Y29uc3QgaWQgPSByb29tLl9pZC5yZXBsYWNlKG1lc3NhZ2UudS5faWQsICcnKTtcblx0XHRcdFx0XHRjb25zdCB1c2VybmFtZSA9IF8ud2l0aG91dChyb29tLnVzZXJuYW1lcywgbWVzc2FnZS51LnVzZXJuYW1lKVswXTtcblxuXHRcdFx0XHRcdGlmICh0aGlzLnRyaWdnZXJzW2BAJHsgaWQgfWBdKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzW2BAJHsgaWQgfWBdKSkge1xuXHRcdFx0XHRcdFx0XHR0cmlnZ2Vyc1RvRXhlY3V0ZS5wdXNoKHRyaWdnZXIpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmICh0aGlzLnRyaWdnZXJzLmFsbF9kaXJlY3RfbWVzc2FnZXMpIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnMuYWxsX2RpcmVjdF9tZXNzYWdlcykpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoaWQgIT09IHVzZXJuYW1lICYmIHRoaXMudHJpZ2dlcnNbYEAkeyB1c2VybmFtZSB9YF0pIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnNbYEAkeyB1c2VybmFtZSB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgJ2MnOlxuXHRcdFx0XHRcdGlmICh0aGlzLnRyaWdnZXJzLmFsbF9wdWJsaWNfY2hhbm5lbHMpIHtcblx0XHRcdFx0XHRcdGZvciAoY29uc3QgdHJpZ2dlciBvZiBPYmplY3QudmFsdWVzKHRoaXMudHJpZ2dlcnMuYWxsX3B1YmxpY19jaGFubmVscykpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20uX2lkIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20uX2lkIH1gXSkpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocm9vbS5faWQgIT09IHJvb20ubmFtZSAmJiB0aGlzLnRyaWdnZXJzW2AjJHsgcm9vbS5uYW1lIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0aWYgKHRoaXMudHJpZ2dlcnMuYWxsX3ByaXZhdGVfZ3JvdXBzKSB7XG5cdFx0XHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXIgb2YgT2JqZWN0LnZhbHVlcyh0aGlzLnRyaWdnZXJzLmFsbF9wcml2YXRlX2dyb3VwcykpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAodGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20uX2lkIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20uX2lkIH1gXSkpIHtcblx0XHRcdFx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAocm9vbS5faWQgIT09IHJvb20ubmFtZSAmJiB0aGlzLnRyaWdnZXJzW2AjJHsgcm9vbS5uYW1lIH1gXSkge1xuXHRcdFx0XHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vyc1tgIyR7IHJvb20ubmFtZSB9YF0pKSB7XG5cdFx0XHRcdFx0XHRcdHRyaWdnZXJzVG9FeGVjdXRlLnB1c2godHJpZ2dlcik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLnRyaWdnZXJzLl9fYW55KSB7XG5cdFx0XHQvL0ZvciBvdXRnb2luZyBpbnRlZ3JhdGlvbiB3aGljaCBkb24ndCByZWx5IG9uIHJvb21zLlxuXHRcdFx0Zm9yIChjb25zdCB0cmlnZ2VyIG9mIE9iamVjdC52YWx1ZXModGhpcy50cmlnZ2Vycy5fX2FueSkpIHtcblx0XHRcdFx0dHJpZ2dlcnNUb0V4ZWN1dGUucHVzaCh0cmlnZ2VyKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYEZvdW5kICR7IHRyaWdnZXJzVG9FeGVjdXRlLmxlbmd0aCB9IHRvIGl0ZXJhdGUgb3ZlciBhbmQgc2VlIGlmIHRoZSBtYXRjaCB0aGUgZXZlbnQuYCk7XG5cblx0XHRmb3IgKGNvbnN0IHRyaWdnZXJUb0V4ZWN1dGUgb2YgdHJpZ2dlcnNUb0V4ZWN1dGUpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhgSXMgXCIkeyB0cmlnZ2VyVG9FeGVjdXRlLm5hbWUgfVwiIGVuYWJsZWQsICR7IHRyaWdnZXJUb0V4ZWN1dGUuZW5hYmxlZCB9LCBhbmQgd2hhdCBpcyB0aGUgZXZlbnQ/ICR7IHRyaWdnZXJUb0V4ZWN1dGUuZXZlbnQgfWApO1xuXHRcdFx0aWYgKHRyaWdnZXJUb0V4ZWN1dGUuZW5hYmxlZCA9PT0gdHJ1ZSAmJiB0cmlnZ2VyVG9FeGVjdXRlLmV2ZW50ID09PSBldmVudCkge1xuXHRcdFx0XHR0aGlzLmV4ZWN1dGVUcmlnZ2VyKHRyaWdnZXJUb0V4ZWN1dGUsIGFyZ09iamVjdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZXhlY3V0ZVRyaWdnZXIodHJpZ2dlciwgYXJnT2JqZWN0KSB7XG5cdFx0Zm9yIChjb25zdCB1cmwgb2YgdHJpZ2dlci51cmxzKSB7XG5cdFx0XHR0aGlzLmV4ZWN1dGVUcmlnZ2VyVXJsKHVybCwgdHJpZ2dlciwgYXJnT2JqZWN0LCAwKTtcblx0XHR9XG5cdH1cblxuXHRleGVjdXRlVHJpZ2dlclVybCh1cmwsIHRyaWdnZXIsIHsgZXZlbnQsIG1lc3NhZ2UsIHJvb20sIG93bmVyLCB1c2VyIH0sIHRoZUhpc3RvcnlJZCwgdHJpZXMgPSAwKSB7XG5cdFx0aWYgKCF0aGlzLmlzVHJpZ2dlckVuYWJsZWQodHJpZ2dlcikpIHtcblx0XHRcdGxvZ2dlci5vdXRnb2luZy53YXJuKGBUaGUgdHJpZ2dlciBcIiR7IHRyaWdnZXIubmFtZSB9XCIgaXMgbm8gbG9uZ2VyIGVuYWJsZWQsIHN0b3BwaW5nIGV4ZWN1dGlvbiBvZiBpdCBhdCB0cnk6ICR7IHRyaWVzIH1gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFN0YXJ0aW5nIHRvIGV4ZWN1dGUgdHJpZ2dlcjogJHsgdHJpZ2dlci5uYW1lIH0gKCR7IHRyaWdnZXIuX2lkIH0pYCk7XG5cblx0XHRsZXQgd29yZDtcblx0XHQvL05vdCBhbGwgdHJpZ2dlcnMvZXZlbnRzIHN1cHBvcnQgdHJpZ2dlcldvcmRzXG5cdFx0aWYgKFJvY2tldENoYXQuaW50ZWdyYXRpb25zLm91dGdvaW5nRXZlbnRzW2V2ZW50XS51c2UudHJpZ2dlcldvcmRzKSB7XG5cdFx0XHRpZiAodHJpZ2dlci50cmlnZ2VyV29yZHMgJiYgdHJpZ2dlci50cmlnZ2VyV29yZHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRmb3IgKGNvbnN0IHRyaWdnZXJXb3JkIG9mIHRyaWdnZXIudHJpZ2dlcldvcmRzKSB7XG5cdFx0XHRcdFx0aWYgKCF0cmlnZ2VyLnRyaWdnZXJXb3JkQW55d2hlcmUgJiYgbWVzc2FnZS5tc2cuaW5kZXhPZih0cmlnZ2VyV29yZCkgPT09IDApIHtcblx0XHRcdFx0XHRcdHdvcmQgPSB0cmlnZ2VyV29yZDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAodHJpZ2dlci50cmlnZ2VyV29yZEFueXdoZXJlICYmIG1lc3NhZ2UubXNnLmluY2x1ZGVzKHRyaWdnZXJXb3JkKSkge1xuXHRcdFx0XHRcdFx0d29yZCA9IHRyaWdnZXJXb3JkO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gU3RvcCBpZiB0aGVyZSBhcmUgdHJpZ2dlcldvcmRzIGJ1dCBub25lIG1hdGNoXG5cdFx0XHRcdGlmICghd29yZCkge1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhgVGhlIHRyaWdnZXIgd29yZCB3aGljaCBcIiR7IHRyaWdnZXIubmFtZSB9XCIgd2FzIGV4cGVjdGluZyBjb3VsZCBub3QgYmUgZm91bmQsIG5vdCBleGVjdXRpbmcuYCk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS5lZGl0ZWRBdCAmJiAhdHJpZ2dlci5ydW5PbkVkaXRzKSB7XG5cdFx0XHRsb2dnZXIub3V0Z29pbmcuZGVidWcoYFRoZSB0cmlnZ2VyIFwiJHsgdHJpZ2dlci5uYW1lIH1cIidzIHJ1biBvbiBlZGl0cyBpcyBkaXNhYmxlZCBhbmQgdGhlIG1lc3NhZ2Ugd2FzIGVkaXRlZC5gKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBoaXN0b3J5SWQgPSB0aGlzLnVwZGF0ZUhpc3RvcnkoeyBzdGVwOiAnc3RhcnQtZXhlY3V0ZS10cmlnZ2VyLXVybCcsIGludGVncmF0aW9uOiB0cmlnZ2VyLCBldmVudCB9KTtcblxuXHRcdGNvbnN0IGRhdGEgPSB7XG5cdFx0XHR0b2tlbjogdHJpZ2dlci50b2tlbixcblx0XHRcdGJvdDogZmFsc2Vcblx0XHR9O1xuXG5cdFx0aWYgKHdvcmQpIHtcblx0XHRcdGRhdGEudHJpZ2dlcl93b3JkID0gd29yZDtcblx0XHR9XG5cblx0XHR0aGlzLm1hcEV2ZW50QXJnc1RvRGF0YShkYXRhLCB7IHRyaWdnZXIsIGV2ZW50LCBtZXNzYWdlLCByb29tLCBvd25lciwgdXNlciB9KTtcblx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdtYXBwZWQtYXJncy10by1kYXRhJywgZGF0YSwgdHJpZ2dlcldvcmQ6IHdvcmQgfSk7XG5cblx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbyhgV2lsbCBiZSBleGVjdXRpbmcgdGhlIEludGVncmF0aW9uIFwiJHsgdHJpZ2dlci5uYW1lIH1cIiB0byB0aGUgdXJsOiAkeyB1cmwgfWApO1xuXHRcdGxvZ2dlci5vdXRnb2luZy5kZWJ1ZyhkYXRhKTtcblxuXHRcdGxldCBvcHRzID0ge1xuXHRcdFx0cGFyYW1zOiB7fSxcblx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0dXJsLFxuXHRcdFx0ZGF0YSxcblx0XHRcdGF1dGg6IHVuZGVmaW5lZCxcblx0XHRcdG5wbVJlcXVlc3RPcHRpb25zOiB7XG5cdFx0XHRcdHJlamVjdFVuYXV0aG9yaXplZDogIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBbGxvd19JbnZhbGlkX1NlbGZTaWduZWRfQ2VydHMnKSxcblx0XHRcdFx0c3RyaWN0U1NMOiAhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FsbG93X0ludmFsaWRfU2VsZlNpZ25lZF9DZXJ0cycpXG5cdFx0XHR9LFxuXHRcdFx0aGVhZGVyczoge1xuXHRcdFx0XHQnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoWDExOyBMaW51eCB4ODZfNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS80MS4wLjIyMjcuMCBTYWZhcmkvNTM3LjM2J1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAodGhpcy5oYXNTY3JpcHRBbmRNZXRob2QodHJpZ2dlciwgJ3ByZXBhcmVfb3V0Z29pbmdfcmVxdWVzdCcpKSB7XG5cdFx0XHRvcHRzID0gdGhpcy5leGVjdXRlU2NyaXB0KHRyaWdnZXIsICdwcmVwYXJlX291dGdvaW5nX3JlcXVlc3QnLCB7IHJlcXVlc3Q6IG9wdHMgfSwgaGlzdG9yeUlkKTtcblx0XHR9XG5cblx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1tYXliZS1yYW4tcHJlcGFyZScsIHJhblByZXBhcmVTY3JpcHQ6IHRydWUgfSk7XG5cblx0XHRpZiAoIW9wdHMpIHtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByZXBhcmUtbm8tb3B0cycsIGZpbmlzaGVkOiB0cnVlIH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChvcHRzLm1lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IHByZXBhcmVNZXNzYWdlID0gdGhpcy5zZW5kTWVzc2FnZSh7IHRyaWdnZXIsIHJvb20sIG1lc3NhZ2U6IG9wdHMubWVzc2FnZSwgZGF0YSB9KTtcblx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByZXBhcmUtc2VuZC1tZXNzYWdlJywgcHJlcGFyZVNlbnRNZXNzYWdlOiBwcmVwYXJlTWVzc2FnZSB9KTtcblx0XHR9XG5cblx0XHRpZiAoIW9wdHMudXJsIHx8ICFvcHRzLm1ldGhvZCkge1xuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItcHJlcGFyZS1uby11cmxfb3JfbWV0aG9kJywgZmluaXNoZWQ6IHRydWUgfSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAncHJlLWh0dHAtY2FsbCcsIHVybDogb3B0cy51cmwsIGh0dHBDYWxsRGF0YTogb3B0cy5kYXRhIH0pO1xuXHRcdEhUVFAuY2FsbChvcHRzLm1ldGhvZCwgb3B0cy51cmwsIG9wdHMsIChlcnJvciwgcmVzdWx0KSA9PiB7XG5cdFx0XHRpZiAoIXJlc3VsdCkge1xuXHRcdFx0XHRsb2dnZXIub3V0Z29pbmcud2FybihgUmVzdWx0IGZvciB0aGUgSW50ZWdyYXRpb24gJHsgdHJpZ2dlci5uYW1lIH0gdG8gJHsgdXJsIH0gaXMgZW1wdHlgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5pbmZvKGBTdGF0dXMgY29kZSBmb3IgdGhlIEludGVncmF0aW9uICR7IHRyaWdnZXIubmFtZSB9IHRvICR7IHVybCB9IGlzICR7IHJlc3VsdC5zdGF0dXNDb2RlIH1gKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItaHR0cC1jYWxsJywgaHR0cEVycm9yOiBlcnJvciwgaHR0cFJlc3VsdDogcmVzdWx0IH0pO1xuXG5cdFx0XHRpZiAodGhpcy5oYXNTY3JpcHRBbmRNZXRob2QodHJpZ2dlciwgJ3Byb2Nlc3Nfb3V0Z29pbmdfcmVzcG9uc2UnKSkge1xuXHRcdFx0XHRjb25zdCBzYW5kYm94ID0ge1xuXHRcdFx0XHRcdHJlcXVlc3Q6IG9wdHMsXG5cdFx0XHRcdFx0cmVzcG9uc2U6IHtcblx0XHRcdFx0XHRcdGVycm9yLFxuXHRcdFx0XHRcdFx0c3RhdHVzX2NvZGU6IHJlc3VsdCA/IHJlc3VsdC5zdGF0dXNDb2RlIDogdW5kZWZpbmVkLCAvL1RoZXNlIHZhbHVlcyB3aWxsIGJlIHVuZGVmaW5lZCB0byBjbG9zZSBpc3N1ZXMgIzQxNzUsICM1NzYyLCBhbmQgIzU4OTZcblx0XHRcdFx0XHRcdGNvbnRlbnQ6IHJlc3VsdCA/IHJlc3VsdC5kYXRhIDogdW5kZWZpbmVkLFxuXHRcdFx0XHRcdFx0Y29udGVudF9yYXc6IHJlc3VsdCA/IHJlc3VsdC5jb250ZW50IDogdW5kZWZpbmVkLFxuXHRcdFx0XHRcdFx0aGVhZGVyczogcmVzdWx0ID8gcmVzdWx0LmhlYWRlcnMgOiB7fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb25zdCBzY3JpcHRSZXN1bHQgPSB0aGlzLmV4ZWN1dGVTY3JpcHQodHJpZ2dlciwgJ3Byb2Nlc3Nfb3V0Z29pbmdfcmVzcG9uc2UnLCBzYW5kYm94LCBoaXN0b3J5SWQpO1xuXG5cdFx0XHRcdGlmIChzY3JpcHRSZXN1bHQgJiYgc2NyaXB0UmVzdWx0LmNvbnRlbnQpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHRNZXNzYWdlID0gdGhpcy5zZW5kTWVzc2FnZSh7IHRyaWdnZXIsIHJvb20sIG1lc3NhZ2U6IHNjcmlwdFJlc3VsdC5jb250ZW50LCBkYXRhIH0pO1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByb2Nlc3Mtc2VuZC1tZXNzYWdlJywgcHJvY2Vzc1NlbnRNZXNzYWdlOiByZXN1bHRNZXNzYWdlLCBmaW5pc2hlZDogdHJ1ZSB9KTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoc2NyaXB0UmVzdWx0ID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdHRoaXMudXBkYXRlSGlzdG9yeSh7IGhpc3RvcnlJZCwgc3RlcDogJ2FmdGVyLXByb2Nlc3MtZmFsc2UtcmVzdWx0JywgZmluaXNoZWQ6IHRydWUgfSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIGlmIHRoZSByZXN1bHQgY29udGFpbmVkIG5vdGhpbmcgb3Igd2Fzbid0IGEgc3VjY2Vzc2Z1bCBzdGF0dXNDb2RlXG5cdFx0XHRpZiAoIXJlc3VsdCB8fCAhdGhpcy5zdWNjZXNzUmVzdWx0cy5pbmNsdWRlcyhyZXN1bHQuc3RhdHVzQ29kZSkpIHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGBFcnJvciBmb3IgdGhlIEludGVncmF0aW9uIFwiJHsgdHJpZ2dlci5uYW1lIH1cIiB0byAkeyB1cmwgfSBpczpgKTtcblx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuZXJyb3IoZXJyb3IpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJlc3VsdCkge1xuXHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRXJyb3IgZm9yIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgdG8gJHsgdXJsIH0gaXM6YCk7XG5cdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKHJlc3VsdCk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0LnN0YXR1c0NvZGUgPT09IDQxMCkge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAnYWZ0ZXItcHJvY2Vzcy1odHRwLXN0YXR1cy00MTAnLCBlcnJvcjogdHJ1ZSB9KTtcblx0XHRcdFx0XHRcdGxvZ2dlci5vdXRnb2luZy5lcnJvcihgRGlzYWJsaW5nIHRoZSBJbnRlZ3JhdGlvbiBcIiR7IHRyaWdnZXIubmFtZSB9XCIgYmVjYXVzZSB0aGUgc3RhdHVzIGNvZGUgd2FzIDQwMSAoR29uZSkuYCk7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMudXBkYXRlKHsgX2lkOiB0cmlnZ2VyLl9pZCB9LCB7ICRzZXQ6IHsgZW5hYmxlZDogZmFsc2UgfX0pO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChyZXN1bHQuc3RhdHVzQ29kZSA9PT0gNTAwKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdhZnRlci1wcm9jZXNzLWh0dHAtc3RhdHVzLTUwMCcsIGVycm9yOiB0cnVlIH0pO1xuXHRcdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKGBFcnJvciBcIjUwMFwiIGZvciB0aGUgSW50ZWdyYXRpb24gXCIkeyB0cmlnZ2VyLm5hbWUgfVwiIHRvICR7IHVybCB9LmApO1xuXHRcdFx0XHRcdFx0bG9nZ2VyLm91dGdvaW5nLmVycm9yKHJlc3VsdC5jb250ZW50KTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodHJpZ2dlci5yZXRyeUZhaWxlZENhbGxzKSB7XG5cdFx0XHRcdFx0aWYgKHRyaWVzIDwgdHJpZ2dlci5yZXRyeUNvdW50ICYmIHRyaWdnZXIucmV0cnlEZWxheSkge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBlcnJvcjogdHJ1ZSwgc3RlcDogYGdvaW5nLXRvLXJldHJ5LSR7IHRyaWVzICsgMSB9YCB9KTtcblxuXHRcdFx0XHRcdFx0bGV0IHdhaXRUaW1lO1xuXG5cdFx0XHRcdFx0XHRzd2l0Y2ggKHRyaWdnZXIucmV0cnlEZWxheSkge1xuXHRcdFx0XHRcdFx0XHRjYXNlICdwb3dlcnMtb2YtdGVuJzpcblx0XHRcdFx0XHRcdFx0XHQvLyBUcnkgYWdhaW4gaW4gMC4xcywgMXMsIDEwcywgMW00MHMsIDE2bTQwcywgMmg0Nm00MHMsIDI3aDQ2bTQwcywgZXRjXG5cdFx0XHRcdFx0XHRcdFx0d2FpdFRpbWUgPSBNYXRoLnBvdygxMCwgdHJpZXMgKyAyKTtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0Y2FzZSAncG93ZXJzLW9mLXR3byc6XG5cdFx0XHRcdFx0XHRcdFx0Ly8gMiBzZWNvbmRzLCA0IHNlY29uZHMsIDggc2Vjb25kc1xuXHRcdFx0XHRcdFx0XHRcdHdhaXRUaW1lID0gTWF0aC5wb3coMiwgdHJpZXMgKyAxKSAqIDEwMDA7XG5cdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHRcdGNhc2UgJ2luY3JlbWVudHMtb2YtdHdvJzpcblx0XHRcdFx0XHRcdFx0XHQvLyAyIHNlY29uZCwgNCBzZWNvbmRzLCA2IHNlY29uZHMsIGV0Y1xuXHRcdFx0XHRcdFx0XHRcdHdhaXRUaW1lID0gKHRyaWVzICsgMSkgKiAyICogMTAwMDtcblx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRjb25zdCBlciA9IG5ldyBFcnJvcignVGhlIGludGVncmF0aW9uXFwncyByZXRyeURlbGF5IHNldHRpbmcgaXMgaW52YWxpZC4nKTtcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdmYWlsZWQtYW5kLXJldHJ5LWRlbGF5LWlzLWludmFsaWQnLCBlcnJvcjogdHJ1ZSwgZXJyb3JTdGFjazogZXIuc3RhY2sgfSk7XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRsb2dnZXIub3V0Z29pbmcuaW5mbyhgVHJ5aW5nIHRoZSBJbnRlZ3JhdGlvbiAkeyB0cmlnZ2VyLm5hbWUgfSB0byAkeyB1cmwgfSBhZ2FpbiBpbiAkeyB3YWl0VGltZSB9IG1pbGxpc2Vjb25kcy5gKTtcblx0XHRcdFx0XHRcdE1ldGVvci5zZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRcdFx0dGhpcy5leGVjdXRlVHJpZ2dlclVybCh1cmwsIHRyaWdnZXIsIHsgZXZlbnQsIG1lc3NhZ2UsIHJvb20sIG93bmVyLCB1c2VyIH0sIGhpc3RvcnlJZCwgdHJpZXMgKyAxKTtcblx0XHRcdFx0XHRcdH0sIHdhaXRUaW1lKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAndG9vLW1hbnktcmV0cmllcycsIGVycm9yOiB0cnVlIH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLnVwZGF0ZUhpc3RvcnkoeyBoaXN0b3J5SWQsIHN0ZXA6ICdmYWlsZWQtYW5kLW5vdC1jb25maWd1cmVkLXRvLXJldHJ5JywgZXJyb3I6IHRydWUgfSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vcHJvY2VzcyBvdXRnb2luZyB3ZWJob29rIHJlc3BvbnNlIGFzIGEgbmV3IG1lc3NhZ2Vcblx0XHRcdGlmIChyZXN1bHQgJiYgdGhpcy5zdWNjZXNzUmVzdWx0cy5pbmNsdWRlcyhyZXN1bHQuc3RhdHVzQ29kZSkpIHtcblx0XHRcdFx0aWYgKHJlc3VsdCAmJiByZXN1bHQuZGF0YSAmJiAocmVzdWx0LmRhdGEudGV4dCB8fCByZXN1bHQuZGF0YS5hdHRhY2htZW50cykpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHRNc2cgPSB0aGlzLnNlbmRNZXNzYWdlKHsgdHJpZ2dlciwgcm9vbSwgbWVzc2FnZTogcmVzdWx0LmRhdGEsIGRhdGEgfSk7XG5cdFx0XHRcdFx0dGhpcy51cGRhdGVIaXN0b3J5KHsgaGlzdG9yeUlkLCBzdGVwOiAndXJsLXJlc3BvbnNlLXNlbnQtbWVzc2FnZScsIHJlc3VsdE1lc3NhZ2U6IHJlc3VsdE1zZywgZmluaXNoZWQ6IHRydWUgfSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdHJlcGxheShpbnRlZ3JhdGlvbiwgaGlzdG9yeSkge1xuXHRcdGlmICghaW50ZWdyYXRpb24gfHwgaW50ZWdyYXRpb24udHlwZSAhPT0gJ3dlYmhvb2stb3V0Z29pbmcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnRlZ3JhdGlvbi10eXBlLW11c3QtYmUtb3V0Z29pbmcnLCAnVGhlIGludGVncmF0aW9uIHR5cGUgdG8gcmVwbGF5IG11c3QgYmUgYW4gb3V0Z29pbmcgd2ViaG9vay4nKTtcblx0XHR9XG5cblx0XHRpZiAoIWhpc3RvcnkgfHwgIWhpc3RvcnkuZGF0YSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaGlzdG9yeS1kYXRhLW11c3QtYmUtZGVmaW5lZCcsICdUaGUgaGlzdG9yeSBkYXRhIG11c3QgYmUgZGVmaW5lZCB0byByZXBsYXkgYW4gaW50ZWdyYXRpb24uJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXZlbnQgPSBoaXN0b3J5LmV2ZW50O1xuXHRcdGNvbnN0IG1lc3NhZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChoaXN0b3J5LmRhdGEubWVzc2FnZV9pZCk7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGhpc3RvcnkuZGF0YS5jaGFubmVsX2lkKTtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQoaGlzdG9yeS5kYXRhLnVzZXJfaWQpO1xuXHRcdGxldCBvd25lcjtcblxuXHRcdGlmIChoaXN0b3J5LmRhdGEub3duZXIgJiYgaGlzdG9yeS5kYXRhLm93bmVyLl9pZCkge1xuXHRcdFx0b3duZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChoaXN0b3J5LmRhdGEub3duZXIuX2lkKTtcblx0XHR9XG5cblx0XHR0aGlzLmV4ZWN1dGVUcmlnZ2VyVXJsKGhpc3RvcnkudXJsLCBpbnRlZ3JhdGlvbiwgeyBldmVudCwgbWVzc2FnZSwgcm9vbSwgb3duZXIsIHVzZXIgfSk7XG5cdH1cbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMgPSBuZXcgY2xhc3MgSW50ZWdyYXRpb25zIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignaW50ZWdyYXRpb25zJyk7XG5cdH1cblxuXHRmaW5kQnlUeXBlKHR5cGUsIG9wdGlvbnMpIHtcblx0XHRpZiAodHlwZSAhPT0gJ3dlYmhvb2staW5jb21pbmcnICYmIHR5cGUgIT09ICd3ZWJob29rLW91dGdvaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC10eXBlLXRvLWZpbmQnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgdHlwZSB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGRpc2FibGVCeVVzZXJJZCh1c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyB1c2VySWQgfSwgeyAkc2V0OiB7IGVuYWJsZWQ6IGZhbHNlIH19LCB7IG11bHRpOiB0cnVlIH0pO1xuXHR9XG59O1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5ID0gbmV3IGNsYXNzIEludGVncmF0aW9uSGlzdG9yeSBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2ludGVncmF0aW9uX2hpc3RvcnknKTtcblx0fVxuXG5cdGZpbmRCeVR5cGUodHlwZSwgb3B0aW9ucykge1xuXHRcdGlmICh0eXBlICE9PSAnb3V0Z29pbmctd2ViaG9vaycgfHwgdHlwZSAhPT0gJ2luY29taW5nLXdlYmhvb2snKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLWludGVncmF0aW9uLXR5cGUnKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgdHlwZSB9LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeUludGVncmF0aW9uSWQoaWQsIG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgJ2ludGVncmF0aW9uLl9pZCc6IGlkIH0sIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZEJ5SW50ZWdyYXRpb25JZEFuZENyZWF0ZWRCeShpZCwgY3JlYXRvcklkLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7ICdpbnRlZ3JhdGlvbi5faWQnOiBpZCwgJ2ludGVncmF0aW9uLl9jcmVhdGVkQnkuX2lkJzogY3JlYXRvcklkIH0sIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZE9uZUJ5SW50ZWdyYXRpb25JZEFuZEhpc3RvcnlJZChpbnRlZ3JhdGlvbklkLCBoaXN0b3J5SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHsgJ2ludGVncmF0aW9uLl9pZCc6IGludGVncmF0aW9uSWQsIF9pZDogaGlzdG9yeUlkIH0pO1xuXHR9XG5cblx0ZmluZEJ5RXZlbnROYW1lKGV2ZW50LCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IGV2ZW50IH0sIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZEZhaWxlZChvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IGVycm9yOiB0cnVlIH0sIG9wdGlvbnMpO1xuXHR9XG5cblx0cmVtb3ZlQnlJbnRlZ3JhdGlvbklkKGludGVncmF0aW9uSWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoeyAnaW50ZWdyYXRpb24uX2lkJzogaW50ZWdyYXRpb25JZCB9KTtcblx0fVxufTtcbiIsIk1ldGVvci5wdWJsaXNoKCdpbnRlZ3JhdGlvbnMnLCBmdW5jdGlvbiBfaW50ZWdyYXRpb25QdWJsaWNhdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kKCk7XG5cdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZCh7ICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH0pO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hdXRob3JpemVkJyk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2ludGVncmF0aW9uSGlzdG9yeScsIGZ1bmN0aW9uIF9pbnRlZ3JhdGlvbkhpc3RvcnlQdWJsaWNhdGlvbihpbnRlZ3JhdGlvbklkLCBsaW1pdCA9IDI1KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZEJ5SW50ZWdyYXRpb25JZChpbnRlZ3JhdGlvbklkLCB7IHNvcnQ6IHsgX3VwZGF0ZWRBdDogLTEgfSwgbGltaXQgfSk7XG5cdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbkhpc3RvcnkuZmluZEJ5SW50ZWdyYXRpb25JZEFuZENyZWF0ZWRCeShpbnRlZ3JhdGlvbklkLCB0aGlzLnVzZXJJZCwgeyBzb3J0OiB7IF91cGRhdGVkQXQ6IC0xIH0sIGxpbWl0IH0pO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdC1hdXRob3JpemVkJyk7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFsIEJhYmVsICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcbmNvbnN0IHZhbGlkQ2hhbm5lbENoYXJzID0gWydAJywgJyMnXTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRhZGRJbmNvbWluZ0ludGVncmF0aW9uKGludGVncmF0aW9uKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzU3RyaW5nKGludGVncmF0aW9uLmNoYW5uZWwpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBjaGFubmVsJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoaW50ZWdyYXRpb24uY2hhbm5lbC50cmltKCkgPT09ICcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBjaGFubmVsJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBjaGFubmVscyA9IF8ubWFwKGludGVncmF0aW9uLmNoYW5uZWwuc3BsaXQoJywnKSwgKGNoYW5uZWwpID0+IHMudHJpbShjaGFubmVsKSk7XG5cblx0XHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRcdGlmICghdmFsaWRDaGFubmVsQ2hhcnMuaW5jbHVkZXMoY2hhbm5lbFswXSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsLXN0YXJ0LXdpdGgtY2hhcnMnLCAnSW52YWxpZCBjaGFubmVsLiBTdGFydCB3aXRoIEAgb3IgIycsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzU3RyaW5nKGludGVncmF0aW9uLnVzZXJuYW1lKSB8fCBpbnRlZ3JhdGlvbi51c2VybmFtZS50cmltKCkgPT09ICcnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXJuYW1lJywgJ0ludmFsaWQgdXNlcm5hbWUnLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmIChpbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkID09PSB0cnVlICYmIGludGVncmF0aW9uLnNjcmlwdCAmJiBpbnRlZ3JhdGlvbi5zY3JpcHQudHJpbSgpICE9PSAnJykge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0bGV0IGJhYmVsT3B0aW9ucyA9IEJhYmVsLmdldERlZmF1bHRPcHRpb25zKHsgcnVudGltZTogZmFsc2UgfSk7XG5cdFx0XHRcdGJhYmVsT3B0aW9ucyA9IF8uZXh0ZW5kKGJhYmVsT3B0aW9ucywgeyBjb21wYWN0OiB0cnVlLCBtaW5pZmllZDogdHJ1ZSwgY29tbWVudHM6IGZhbHNlIH0pO1xuXG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gQmFiZWwuY29tcGlsZShpbnRlZ3JhdGlvbi5zY3JpcHQsIGJhYmVsT3B0aW9ucykuY29kZTtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0RXJyb3IgPSB1bmRlZmluZWQ7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvciA9IF8ucGljayhlLCAnbmFtZScsICdtZXNzYWdlJywgJ3N0YWNrJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yIChsZXQgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdFx0bGV0IHJlY29yZDtcblx0XHRcdGNvbnN0IGNoYW5uZWxUeXBlID0gY2hhbm5lbFswXTtcblx0XHRcdGNoYW5uZWwgPSBjaGFubmVsLnN1YnN0cigxKTtcblxuXHRcdFx0c3dpdGNoIChjaGFubmVsVHlwZSkge1xuXHRcdFx0XHRjYXNlICcjJzpcblx0XHRcdFx0XHRyZWNvcmQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdFx0XHRcdCRvcjogW1xuXHRcdFx0XHRcdFx0XHR7X2lkOiBjaGFubmVsfSxcblx0XHRcdFx0XHRcdFx0e25hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ0AnOlxuXHRcdFx0XHRcdHJlY29yZCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe1xuXHRcdFx0XHRcdFx0JG9yOiBbXG5cdFx0XHRcdFx0XHRcdHtfaWQ6IGNoYW5uZWx9LFxuXHRcdFx0XHRcdFx0XHR7dXNlcm5hbWU6IGNoYW5uZWx9XG5cdFx0XHRcdFx0XHRdXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IG1ldGhvZDogJ2FkZEluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVjb3JkLnVzZXJuYW1lcyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpICYmIFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgJiYgIXJlY29yZC51c2VybmFtZXMuaW5jbHVkZXMoTWV0ZW9yLnVzZXIoKS51c2VybmFtZSkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jaGFubmVsJywgJ0ludmFsaWQgQ2hhbm5lbCcsIHsgbWV0aG9kOiAnYWRkSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUoe3VzZXJuYW1lOiBpbnRlZ3JhdGlvbi51c2VybmFtZX0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdhZGRJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB0b2tlbiA9IFJhbmRvbS5pZCg0OCk7XG5cblx0XHRpbnRlZ3JhdGlvbi50eXBlID0gJ3dlYmhvb2staW5jb21pbmcnO1xuXHRcdGludGVncmF0aW9uLnRva2VuID0gdG9rZW47XG5cdFx0aW50ZWdyYXRpb24uY2hhbm5lbCA9IGNoYW5uZWxzO1xuXHRcdGludGVncmF0aW9uLnVzZXJJZCA9IHVzZXIuX2lkO1xuXHRcdGludGVncmF0aW9uLl9jcmVhdGVkQXQgPSBuZXcgRGF0ZSgpO1xuXHRcdGludGVncmF0aW9uLl9jcmVhdGVkQnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5hZGRVc2VyUm9sZXModXNlci5faWQsICdib3QnKTtcblxuXHRcdGludGVncmF0aW9uLl9pZCA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5pbnNlcnQoaW50ZWdyYXRpb24pO1xuXG5cdFx0cmV0dXJuIGludGVncmF0aW9uO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbCBCYWJlbCAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5jb25zdCB2YWxpZENoYW5uZWxDaGFycyA9IFsnQCcsICcjJ107XG5cbk1ldGVvci5tZXRob2RzKHtcblx0dXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbklkLCBpbnRlZ3JhdGlvbikge1xuXHRcdGlmICghXy5pc1N0cmluZyhpbnRlZ3JhdGlvbi5jaGFubmVsKSB8fCBpbnRlZ3JhdGlvbi5jaGFubmVsLnRyaW0oKSA9PT0gJycpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY2hhbm5lbCcsICdJbnZhbGlkIGNoYW5uZWwnLCB7IG1ldGhvZDogJ3VwZGF0ZUluY29taW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNoYW5uZWxzID0gXy5tYXAoaW50ZWdyYXRpb24uY2hhbm5lbC5zcGxpdCgnLCcpLCAoY2hhbm5lbCkgPT4gcy50cmltKGNoYW5uZWwpKTtcblxuXHRcdGZvciAoY29uc3QgY2hhbm5lbCBvZiBjaGFubmVscykge1xuXHRcdFx0aWYgKCF2YWxpZENoYW5uZWxDaGFycy5pbmNsdWRlcyhjaGFubmVsWzBdKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwtc3RhcnQtd2l0aC1jaGFycycsICdJbnZhbGlkIGNoYW5uZWwuIFN0YXJ0IHdpdGggQCBvciAjJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsZXQgY3VycmVudEludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0Y3VycmVudEludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRjdXJyZW50SW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogaW50ZWdyYXRpb25JZCwgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFjdXJyZW50SW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQgPT09IHRydWUgJiYgaW50ZWdyYXRpb24uc2NyaXB0ICYmIGludGVncmF0aW9uLnNjcmlwdC50cmltKCkgIT09ICcnKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRsZXQgYmFiZWxPcHRpb25zID0gQmFiZWwuZ2V0RGVmYXVsdE9wdGlvbnMoeyBydW50aW1lOiBmYWxzZSB9KTtcblx0XHRcdFx0YmFiZWxPcHRpb25zID0gXy5leHRlbmQoYmFiZWxPcHRpb25zLCB7IGNvbXBhY3Q6IHRydWUsIG1pbmlmaWVkOiB0cnVlLCBjb21tZW50czogZmFsc2UgfSk7XG5cblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQgPSBCYWJlbC5jb21waWxlKGludGVncmF0aW9uLnNjcmlwdCwgYmFiZWxPcHRpb25zKS5jb2RlO1xuXHRcdFx0XHRpbnRlZ3JhdGlvbi5zY3JpcHRFcnJvciA9IHVuZGVmaW5lZDtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQgPSB1bmRlZmluZWQ7XG5cdFx0XHRcdGludGVncmF0aW9uLnNjcmlwdEVycm9yID0gXy5waWNrKGUsICduYW1lJywgJ21lc3NhZ2UnLCAnc3RhY2snKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKGxldCBjaGFubmVsIG9mIGNoYW5uZWxzKSB7XG5cdFx0XHRjb25zdCBjaGFubmVsVHlwZSA9IGNoYW5uZWxbMF07XG5cdFx0XHRjaGFubmVsID0gY2hhbm5lbC5zdWJzdHIoMSk7XG5cdFx0XHRsZXQgcmVjb3JkO1xuXG5cdFx0XHRzd2l0Y2ggKGNoYW5uZWxUeXBlKSB7XG5cdFx0XHRcdGNhc2UgJyMnOlxuXHRcdFx0XHRcdHJlY29yZCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUoe1xuXHRcdFx0XHRcdFx0JG9yOiBbXG5cdFx0XHRcdFx0XHRcdHtfaWQ6IGNoYW5uZWx9LFxuXHRcdFx0XHRcdFx0XHR7bmFtZTogY2hhbm5lbH1cblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnQCc6XG5cdFx0XHRcdFx0cmVjb3JkID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHRcdFx0XHQkb3I6IFtcblx0XHRcdFx0XHRcdFx0e19pZDogY2hhbm5lbH0sXG5cdFx0XHRcdFx0XHRcdHt1c2VybmFtZTogY2hhbm5lbH1cblx0XHRcdFx0XHRcdF1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFyZWNvcmQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChyZWNvcmQudXNlcm5hbWVzICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSAmJiAhcmVjb3JkLnVzZXJuYW1lcy5pbmNsdWRlcyhNZXRlb3IudXNlcigpLnVzZXJuYW1lKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWNoYW5uZWwnLCAnSW52YWxpZCBDaGFubmVsJywgeyBtZXRob2Q6ICd1cGRhdGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7IHVzZXJuYW1lOiBjdXJyZW50SW50ZWdyYXRpb24udXNlcm5hbWUgfSk7XG5cblx0XHRpZiAoIXVzZXIgfHwgIXVzZXIuX2lkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXBvc3QtYXMtdXNlcicsICdJbnZhbGlkIFBvc3QgQXMgVXNlcicsIHsgbWV0aG9kOiAndXBkYXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnYm90Jyk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMudXBkYXRlKGludGVncmF0aW9uSWQsIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0ZW5hYmxlZDogaW50ZWdyYXRpb24uZW5hYmxlZCxcblx0XHRcdFx0bmFtZTogaW50ZWdyYXRpb24ubmFtZSxcblx0XHRcdFx0YXZhdGFyOiBpbnRlZ3JhdGlvbi5hdmF0YXIsXG5cdFx0XHRcdGVtb2ppOiBpbnRlZ3JhdGlvbi5lbW9qaSxcblx0XHRcdFx0YWxpYXM6IGludGVncmF0aW9uLmFsaWFzLFxuXHRcdFx0XHRjaGFubmVsOiBjaGFubmVscyxcblx0XHRcdFx0c2NyaXB0OiBpbnRlZ3JhdGlvbi5zY3JpcHQsXG5cdFx0XHRcdHNjcmlwdEVuYWJsZWQ6IGludGVncmF0aW9uLnNjcmlwdEVuYWJsZWQsXG5cdFx0XHRcdHNjcmlwdENvbXBpbGVkOiBpbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZCxcblx0XHRcdFx0c2NyaXB0RXJyb3I6IGludGVncmF0aW9uLnNjcmlwdEVycm9yLFxuXHRcdFx0XHRfdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRfdXBkYXRlZEJ5OiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSlcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGRlbGV0ZUluY29taW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCkge1xuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQsIHsgZmllbGRzIDogeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnZGVsZXRlSW5jb21pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdkZWxldGVJbmNvbWluZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMucmVtb3ZlKHsgX2lkOiBpbnRlZ3JhdGlvbklkIH0pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRhZGRPdXRnb2luZ0ludGVncmF0aW9uKGludGVncmF0aW9uKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJylcblx0XHRcdCYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpXG5cdFx0XHQmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycsICdib3QnKVxuXHRcdFx0JiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudmFsaWRhdGVPdXRnb2luZyhpbnRlZ3JhdGlvbiwgdGhpcy51c2VySWQpO1xuXG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cdFx0aW50ZWdyYXRpb24uX2NyZWF0ZWRCeSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtmaWVsZHM6IHt1c2VybmFtZTogMX19KTtcblx0XHRpbnRlZ3JhdGlvbi5faWQgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuaW5zZXJ0KGludGVncmF0aW9uKTtcblxuXHRcdHJldHVybiBpbnRlZ3JhdGlvbjtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdHVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24oaW50ZWdyYXRpb25JZCwgaW50ZWdyYXRpb24pIHtcblx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQuaW50ZWdyYXRpb25zLnZhbGlkYXRlT3V0Z29pbmcoaW50ZWdyYXRpb24sIHRoaXMudXNlcklkKTtcblxuXHRcdGlmICghaW50ZWdyYXRpb24udG9rZW4gfHwgaW50ZWdyYXRpb24udG9rZW4udHJpbSgpID09PSAnJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC10b2tlbicsICdJbnZhbGlkIHRva2VuJywgeyBtZXRob2Q6ICd1cGRhdGVPdXRnb2luZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRsZXQgY3VycmVudEludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSkge1xuXHRcdFx0Y3VycmVudEludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpKSB7XG5cdFx0XHRjdXJyZW50SW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7IF9pZDogaW50ZWdyYXRpb25JZCwgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAndXBkYXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFjdXJyZW50SW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWRfaW50ZWdyYXRpb24nLCAnW21ldGhvZHNdIHVwZGF0ZU91dGdvaW5nSW50ZWdyYXRpb24gLT4gaW50ZWdyYXRpb24gbm90IGZvdW5kJyk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLnVwZGF0ZShpbnRlZ3JhdGlvbklkLCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGV2ZW50OiBpbnRlZ3JhdGlvbi5ldmVudCxcblx0XHRcdFx0ZW5hYmxlZDogaW50ZWdyYXRpb24uZW5hYmxlZCxcblx0XHRcdFx0bmFtZTogaW50ZWdyYXRpb24ubmFtZSxcblx0XHRcdFx0YXZhdGFyOiBpbnRlZ3JhdGlvbi5hdmF0YXIsXG5cdFx0XHRcdGVtb2ppOiBpbnRlZ3JhdGlvbi5lbW9qaSxcblx0XHRcdFx0YWxpYXM6IGludGVncmF0aW9uLmFsaWFzLFxuXHRcdFx0XHRjaGFubmVsOiBpbnRlZ3JhdGlvbi5jaGFubmVsLFxuXHRcdFx0XHR0YXJnZXRSb29tOiBpbnRlZ3JhdGlvbi50YXJnZXRSb29tLFxuXHRcdFx0XHRpbXBlcnNvbmF0ZVVzZXI6IGludGVncmF0aW9uLmltcGVyc29uYXRlVXNlcixcblx0XHRcdFx0dXNlcm5hbWU6IGludGVncmF0aW9uLnVzZXJuYW1lLFxuXHRcdFx0XHR1c2VySWQ6IGludGVncmF0aW9uLnVzZXJJZCxcblx0XHRcdFx0dXJsczogaW50ZWdyYXRpb24udXJscyxcblx0XHRcdFx0dG9rZW46IGludGVncmF0aW9uLnRva2VuLFxuXHRcdFx0XHRzY3JpcHQ6IGludGVncmF0aW9uLnNjcmlwdCxcblx0XHRcdFx0c2NyaXB0RW5hYmxlZDogaW50ZWdyYXRpb24uc2NyaXB0RW5hYmxlZCxcblx0XHRcdFx0c2NyaXB0Q29tcGlsZWQ6IGludGVncmF0aW9uLnNjcmlwdENvbXBpbGVkLFxuXHRcdFx0XHRzY3JpcHRFcnJvcjogaW50ZWdyYXRpb24uc2NyaXB0RXJyb3IsXG5cdFx0XHRcdHRyaWdnZXJXb3JkczogaW50ZWdyYXRpb24udHJpZ2dlcldvcmRzLFxuXHRcdFx0XHRyZXRyeUZhaWxlZENhbGxzOiBpbnRlZ3JhdGlvbi5yZXRyeUZhaWxlZENhbGxzLFxuXHRcdFx0XHRyZXRyeUNvdW50OiBpbnRlZ3JhdGlvbi5yZXRyeUNvdW50LFxuXHRcdFx0XHRyZXRyeURlbGF5OiBpbnRlZ3JhdGlvbi5yZXRyeURlbGF5LFxuXHRcdFx0XHR0cmlnZ2VyV29yZEFueXdoZXJlOiBpbnRlZ3JhdGlvbi50cmlnZ2VyV29yZEFueXdoZXJlLFxuXHRcdFx0XHRydW5PbkVkaXRzOiBpbnRlZ3JhdGlvbi5ydW5PbkVkaXRzLFxuXHRcdFx0XHRfdXBkYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0XHRfdXBkYXRlZEJ5OiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lKHRoaXMudXNlcklkLCB7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSlcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdHJlcGxheU91dGdvaW5nSW50ZWdyYXRpb24oeyBpbnRlZ3JhdGlvbklkLCBoaXN0b3J5SWQgfSkge1xuXHRcdGxldCBpbnRlZ3JhdGlvbjtcblxuXHRcdGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkKTtcblx0XHR9IGVsc2UgaWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJykgfHwgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCwgeyBmaWVsZHM6IHsgJ19jcmVhdGVkQnkuX2lkJzogdGhpcy51c2VySWQgfX0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcsICdVbmF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ3JlcGxheU91dGdvaW5nSW50ZWdyYXRpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmICghaW50ZWdyYXRpb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtaW50ZWdyYXRpb24nLCAnSW52YWxpZCBpbnRlZ3JhdGlvbicsIHsgbWV0aG9kOiAncmVwbGF5T3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGlzdG9yeSA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5maW5kT25lQnlJbnRlZ3JhdGlvbklkQW5kSGlzdG9yeUlkKGludGVncmF0aW9uLl9pZCwgaGlzdG9yeUlkKTtcblxuXHRcdGlmICghaGlzdG9yeSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbi1oaXN0b3J5JywgJ0ludmFsaWQgSW50ZWdyYXRpb24gSGlzdG9yeScsIHsgbWV0aG9kOiAncmVwbGF5T3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5pbnRlZ3JhdGlvbnMudHJpZ2dlckhhbmRsZXIucmVwbGF5KGludGVncmF0aW9uLCBoaXN0b3J5KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0ZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbihpbnRlZ3JhdGlvbklkKSB7XG5cdFx0bGV0IGludGVncmF0aW9uO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2UtaW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLW93bi1pbnRlZ3JhdGlvbnMnKSB8fCBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycsICdib3QnKSkge1xuXHRcdFx0aW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZShpbnRlZ3JhdGlvbklkLCB7IGZpZWxkczogeyAnX2NyZWF0ZWRCeS5faWQnOiB0aGlzLnVzZXJJZCB9fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJywgJ1VuYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnZGVsZXRlT3V0Z29pbmdJbnRlZ3JhdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMucmVtb3ZlKHsgX2lkOiBpbnRlZ3JhdGlvbklkIH0pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9uSGlzdG9yeS5yZW1vdmVCeUludGVncmF0aW9uSWQoaW50ZWdyYXRpb25JZCk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdGNsZWFySW50ZWdyYXRpb25IaXN0b3J5KGludGVncmF0aW9uSWQpIHtcblx0XHRsZXQgaW50ZWdyYXRpb247XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAnYm90JykpIHtcblx0XHRcdGludGVncmF0aW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25zLmZpbmRPbmUoaW50ZWdyYXRpb25JZCk7XG5cdFx0fSBlbHNlIGlmIChSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICdtYW5hZ2Utb3duLWludGVncmF0aW9ucycpIHx8IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgJ2JvdCcpKSB7XG5cdFx0XHRpbnRlZ3JhdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLkludGVncmF0aW9ucy5maW5kT25lKGludGVncmF0aW9uSWQsIHsgZmllbGRzOiB7ICdfY3JlYXRlZEJ5Ll9pZCc6IHRoaXMudXNlcklkIH19KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbm90X2F1dGhvcml6ZWQnLCAnVW5hdXRob3JpemVkJywgeyBtZXRob2Q6ICdjbGVhckludGVncmF0aW9uSGlzdG9yeScgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFpbnRlZ3JhdGlvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1pbnRlZ3JhdGlvbicsICdJbnZhbGlkIGludGVncmF0aW9uJywgeyBtZXRob2Q6ICdjbGVhckludGVncmF0aW9uSGlzdG9yeScgfSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuSW50ZWdyYXRpb25IaXN0b3J5LnJlbW92ZUJ5SW50ZWdyYXRpb25JZChpbnRlZ3JhdGlvbklkKTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgQXBpIE1ldGVvciBSZXN0aXZ1cyBsb2dnZXIgcHJvY2Vzc1dlYmhvb2tNZXNzYWdlKi9cbi8vIFRPRE86IHJlbW92ZSBnbG9iYWxzXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IHZtIGZyb20gJ3ZtJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcblxuY29uc3QgY29tcGlsZWRTY3JpcHRzID0ge307XG5mdW5jdGlvbiBidWlsZFNhbmRib3goc3RvcmUgPSB7fSkge1xuXHRjb25zdCBzYW5kYm94ID0ge1xuXHRcdF8sXG5cdFx0cyxcblx0XHRjb25zb2xlLFxuXHRcdG1vbWVudCxcblx0XHRMaXZlY2hhdDogUm9ja2V0Q2hhdC5MaXZlY2hhdCxcblx0XHRTdG9yZToge1xuXHRcdFx0c2V0KGtleSwgdmFsKSB7XG5cdFx0XHRcdHJldHVybiBzdG9yZVtrZXldID0gdmFsO1xuXHRcdFx0fSxcblx0XHRcdGdldChrZXkpIHtcblx0XHRcdFx0cmV0dXJuIHN0b3JlW2tleV07XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRIVFRQKG1ldGhvZCwgdXJsLCBvcHRpb25zKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHJlc3VsdDogSFRUUC5jYWxsKG1ldGhvZCwgdXJsLCBvcHRpb25zKVxuXHRcdFx0XHR9O1xuXHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRlcnJvclxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHRPYmplY3Qua2V5cyhSb2NrZXRDaGF0Lm1vZGVscykuZmlsdGVyKChrKSA9PiAhay5zdGFydHNXaXRoKCdfJykpLmZvckVhY2goKGspID0+IHNhbmRib3hba10gPSBSb2NrZXRDaGF0Lm1vZGVsc1trXSk7XG5cdHJldHVybiB7IHN0b3JlLCBzYW5kYm94XHR9O1xufVxuXG5mdW5jdGlvbiBnZXRJbnRlZ3JhdGlvblNjcmlwdChpbnRlZ3JhdGlvbikge1xuXHRjb25zdCBjb21waWxlZFNjcmlwdCA9IGNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdO1xuXHRpZiAoKGNvbXBpbGVkU2NyaXB0ICE9IG51bGwpICYmICtjb21waWxlZFNjcmlwdC5fdXBkYXRlZEF0ID09PSAraW50ZWdyYXRpb24uX3VwZGF0ZWRBdCkge1xuXHRcdHJldHVybiBjb21waWxlZFNjcmlwdC5zY3JpcHQ7XG5cdH1cblx0Y29uc3Qgc2NyaXB0ID0gaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQ7XG5cdGNvbnN0IHtzYW5kYm94LCBzdG9yZX0gPSBidWlsZFNhbmRib3goKTtcblx0dHJ5IHtcblx0XHRsb2dnZXIuaW5jb21pbmcuaW5mbygnV2lsbCBldmFsdWF0ZSBzY3JpcHQgb2YgVHJpZ2dlcicsIGludGVncmF0aW9uLm5hbWUpO1xuXHRcdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZyhzY3JpcHQpO1xuXHRcdGNvbnN0IHZtU2NyaXB0ID0gdm0uY3JlYXRlU2NyaXB0KHNjcmlwdCwgJ3NjcmlwdC5qcycpO1xuXHRcdHZtU2NyaXB0LnJ1bkluTmV3Q29udGV4dChzYW5kYm94KTtcblx0XHRpZiAoc2FuZGJveC5TY3JpcHQgIT0gbnVsbCkge1xuXHRcdFx0Y29tcGlsZWRTY3JpcHRzW2ludGVncmF0aW9uLl9pZF0gPSB7XG5cdFx0XHRcdHNjcmlwdDogbmV3IHNhbmRib3guU2NyaXB0KCksXG5cdFx0XHRcdHN0b3JlLFxuXHRcdFx0XHRfdXBkYXRlZEF0OiBpbnRlZ3JhdGlvbi5fdXBkYXRlZEF0XG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIGNvbXBpbGVkU2NyaXB0c1tpbnRlZ3JhdGlvbi5faWRdLnNjcmlwdDtcblx0XHR9XG5cdH0gY2F0Y2ggKHtzdGFja30pIHtcblx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IoJ1tFcnJvciBldmFsdWF0aW5nIFNjcmlwdCBpbiBUcmlnZ2VyJywgaW50ZWdyYXRpb24ubmFtZSwgJzpdJyk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKHNjcmlwdC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKCdbU3RhY2s6XScpO1xuXHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcihzdGFjay5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0dGhyb3cgUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnZXJyb3ItZXZhbHVhdGluZy1zY3JpcHQnKTtcblx0fVxuXHRpZiAoc2FuZGJveC5TY3JpcHQgPT0gbnVsbCkge1xuXHRcdGxvZ2dlci5pbmNvbWluZy5lcnJvcignW0NsYXNzIFwiU2NyaXB0XCIgbm90IGluIFRyaWdnZXInLCBpbnRlZ3JhdGlvbi5uYW1lLCAnXScpO1xuXHRcdHRocm93IFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ2NsYXNzLXNjcmlwdC1ub3QtZm91bmQnKTtcblx0fVxufVxuXG5BcGkgPSBuZXcgUmVzdGl2dXMoe1xuXHRlbmFibGVDb3JzOiB0cnVlLFxuXHRhcGlQYXRoOiAnaG9va3MvJyxcblx0YXV0aDoge1xuXHRcdHVzZXIoKSB7XG5cdFx0XHRjb25zdCBwYXlsb2FkS2V5cyA9IE9iamVjdC5rZXlzKHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0XHRjb25zdCBwYXlsb2FkSXNXcmFwcGVkID0gKHRoaXMuYm9keVBhcmFtcyAmJiB0aGlzLmJvZHlQYXJhbXMucGF5bG9hZCkgJiYgcGF5bG9hZEtleXMubGVuZ3RoID09PSAxO1xuXHRcdFx0aWYgKHBheWxvYWRJc1dyYXBwZWQgJiYgdGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddID09PSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJykge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdHRoaXMuYm9keVBhcmFtcyA9IEpTT04ucGFyc2UodGhpcy5ib2R5UGFyYW1zLnBheWxvYWQpO1xuXHRcdFx0XHR9IGNhdGNoICh7bWVzc2FnZX0pIHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZXJyb3I6IHtcblx0XHRcdFx0XHRcdFx0c3RhdHVzQ29kZTogNDAwLFxuXHRcdFx0XHRcdFx0XHRib2R5OiB7XG5cdFx0XHRcdFx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IG1lc3NhZ2Vcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHRoaXMuaW50ZWdyYXRpb24gPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogdGhpcy5yZXF1ZXN0LnBhcmFtcy5pbnRlZ3JhdGlvbklkLFxuXHRcdFx0XHR0b2tlbjogZGVjb2RlVVJJQ29tcG9uZW50KHRoaXMucmVxdWVzdC5wYXJhbXMudG9rZW4pXG5cdFx0XHR9KTtcblx0XHRcdGlmICh0aGlzLmludGVncmF0aW9uID09IG51bGwpIHtcblx0XHRcdFx0bG9nZ2VyLmluY29taW5nLmluZm8oJ0ludmFsaWQgaW50ZWdyYXRpb24gaWQnLCB0aGlzLnJlcXVlc3QucGFyYW1zLmludGVncmF0aW9uSWQsICdvciB0b2tlbicsIHRoaXMucmVxdWVzdC5wYXJhbXMudG9rZW4pO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogdGhpcy5pbnRlZ3JhdGlvbi51c2VySWRcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIHt1c2VyfTtcblx0XHR9XG5cdH1cbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVJbnRlZ3JhdGlvbihvcHRpb25zLCB1c2VyKSB7XG5cdGxvZ2dlci5pbmNvbWluZy5pbmZvKCdBZGQgaW50ZWdyYXRpb24nLCBvcHRpb25zLm5hbWUpO1xuXHRsb2dnZXIuaW5jb21pbmcuZGVidWcob3B0aW9ucyk7XG5cdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsIGZ1bmN0aW9uKCkge1xuXHRcdHN3aXRjaCAob3B0aW9uc1snZXZlbnQnXSkge1xuXHRcdFx0Y2FzZSAnbmV3TWVzc2FnZU9uQ2hhbm5lbCc6XG5cdFx0XHRcdGlmIChvcHRpb25zLmRhdGEgPT0gbnVsbCkge1xuXHRcdFx0XHRcdG9wdGlvbnMuZGF0YSA9IHt9O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgob3B0aW9ucy5kYXRhLmNoYW5uZWxfbmFtZSAhPSBudWxsKSAmJiBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lLmluZGV4T2YoJyMnKSA9PT0gLTEpIHtcblx0XHRcdFx0XHRvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lID0gYCMkeyBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lIH1gO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBNZXRlb3IuY2FsbCgnYWRkT3V0Z29pbmdJbnRlZ3JhdGlvbicsIHtcblx0XHRcdFx0XHR1c2VybmFtZTogJ3JvY2tldC5jYXQnLFxuXHRcdFx0XHRcdHVybHM6IFtvcHRpb25zLnRhcmdldF91cmxdLFxuXHRcdFx0XHRcdG5hbWU6IG9wdGlvbnMubmFtZSxcblx0XHRcdFx0XHRjaGFubmVsOiBvcHRpb25zLmRhdGEuY2hhbm5lbF9uYW1lLFxuXHRcdFx0XHRcdHRyaWdnZXJXb3Jkczogb3B0aW9ucy5kYXRhLnRyaWdnZXJfd29yZHNcblx0XHRcdFx0fSk7XG5cdFx0XHRjYXNlICduZXdNZXNzYWdlVG9Vc2VyJzpcblx0XHRcdFx0aWYgKG9wdGlvbnMuZGF0YS51c2VybmFtZS5pbmRleE9mKCdAJykgPT09IC0xKSB7XG5cdFx0XHRcdFx0b3B0aW9ucy5kYXRhLnVzZXJuYW1lID0gYEAkeyBvcHRpb25zLmRhdGEudXNlcm5hbWUgfWA7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdhZGRPdXRnb2luZ0ludGVncmF0aW9uJywge1xuXHRcdFx0XHRcdHVzZXJuYW1lOiAncm9ja2V0LmNhdCcsXG5cdFx0XHRcdFx0dXJsczogW29wdGlvbnMudGFyZ2V0X3VybF0sXG5cdFx0XHRcdFx0bmFtZTogb3B0aW9ucy5uYW1lLFxuXHRcdFx0XHRcdGNoYW5uZWw6IG9wdGlvbnMuZGF0YS51c2VybmFtZSxcblx0XHRcdFx0XHR0cmlnZ2VyV29yZHM6IG9wdGlvbnMuZGF0YS50cmlnZ2VyX3dvcmRzXG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUludGVncmF0aW9uKG9wdGlvbnMsIHVzZXIpIHtcblx0bG9nZ2VyLmluY29taW5nLmluZm8oJ1JlbW92ZSBpbnRlZ3JhdGlvbicpO1xuXHRsb2dnZXIuaW5jb21pbmcuZGVidWcob3B0aW9ucyk7XG5cdGNvbnN0IGludGVncmF0aW9uVG9SZW1vdmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5JbnRlZ3JhdGlvbnMuZmluZE9uZSh7XG5cdFx0dXJsczogb3B0aW9ucy50YXJnZXRfdXJsXG5cdH0pO1xuXHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0cmV0dXJuIE1ldGVvci5jYWxsKCdkZWxldGVPdXRnb2luZ0ludGVncmF0aW9uJywgaW50ZWdyYXRpb25Ub1JlbW92ZS5faWQpO1xuXHR9KTtcblx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcbn1cblxuZnVuY3Rpb24gZXhlY3V0ZUludGVncmF0aW9uUmVzdCgpIHtcblx0bG9nZ2VyLmluY29taW5nLmluZm8oJ1Bvc3QgaW50ZWdyYXRpb246JywgdGhpcy5pbnRlZ3JhdGlvbi5uYW1lKTtcblx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdAdXJsUGFyYW1zOicsIHRoaXMudXJsUGFyYW1zKTtcblx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdAYm9keVBhcmFtczonLCB0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdGlmICh0aGlzLmludGVncmF0aW9uLmVuYWJsZWQgIT09IHRydWUpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3RhdHVzQ29kZTogNTAzLFxuXHRcdFx0Ym9keTogJ1NlcnZpY2UgVW5hdmFpbGFibGUnXG5cdFx0fTtcblx0fVxuXG5cdGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB7XG5cdFx0Y2hhbm5lbDogdGhpcy5pbnRlZ3JhdGlvbi5jaGFubmVsLFxuXHRcdGFsaWFzOiB0aGlzLmludGVncmF0aW9uLmFsaWFzLFxuXHRcdGF2YXRhcjogdGhpcy5pbnRlZ3JhdGlvbi5hdmF0YXIsXG5cdFx0ZW1vamk6IHRoaXMuaW50ZWdyYXRpb24uZW1vamlcblx0fTtcblxuXHRpZiAodGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRFbmFibGVkID09PSB0cnVlICYmIHRoaXMuaW50ZWdyYXRpb24uc2NyaXB0Q29tcGlsZWQgJiYgdGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZC50cmltKCkgIT09ICcnKSB7XG5cdFx0bGV0IHNjcmlwdDtcblx0XHR0cnkge1xuXHRcdFx0c2NyaXB0ID0gZ2V0SW50ZWdyYXRpb25TY3JpcHQodGhpcy5pbnRlZ3JhdGlvbik7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLndhcm4oZSk7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLm1lc3NhZ2UpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlcXVlc3QgPSB7XG5cdFx0XHR1cmw6IHtcblx0XHRcdFx0aGFzaDogdGhpcy5yZXF1ZXN0Ll9wYXJzZWRVcmwuaGFzaCxcblx0XHRcdFx0c2VhcmNoOiB0aGlzLnJlcXVlc3QuX3BhcnNlZFVybC5zZWFyY2gsXG5cdFx0XHRcdHF1ZXJ5OiB0aGlzLnF1ZXJ5UGFyYW1zLFxuXHRcdFx0XHRwYXRobmFtZTogdGhpcy5yZXF1ZXN0Ll9wYXJzZWRVcmwucGF0aG5hbWUsXG5cdFx0XHRcdHBhdGg6IHRoaXMucmVxdWVzdC5fcGFyc2VkVXJsLnBhdGhcblx0XHRcdH0sXG5cdFx0XHR1cmxfcmF3OiB0aGlzLnJlcXVlc3QudXJsLFxuXHRcdFx0dXJsX3BhcmFtczogdGhpcy51cmxQYXJhbXMsXG5cdFx0XHRjb250ZW50OiB0aGlzLmJvZHlQYXJhbXMsXG5cdFx0XHRjb250ZW50X3JhdzogdGhpcy5yZXF1ZXN0Ll9yZWFkYWJsZVN0YXRlICYmIHRoaXMucmVxdWVzdC5fcmVhZGFibGVTdGF0ZS5idWZmZXIgJiYgdGhpcy5yZXF1ZXN0Ll9yZWFkYWJsZVN0YXRlLmJ1ZmZlci50b1N0cmluZygpLFxuXHRcdFx0aGVhZGVyczogdGhpcy5yZXF1ZXN0LmhlYWRlcnMsXG5cdFx0XHR1c2VyOiB7XG5cdFx0XHRcdF9pZDogdGhpcy51c2VyLl9pZCxcblx0XHRcdFx0bmFtZTogdGhpcy51c2VyLm5hbWUsXG5cdFx0XHRcdHVzZXJuYW1lOiB0aGlzLnVzZXIudXNlcm5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IHsgc2FuZGJveCB9ID0gYnVpbGRTYW5kYm94KGNvbXBpbGVkU2NyaXB0c1t0aGlzLmludGVncmF0aW9uLl9pZF0uc3RvcmUpO1xuXHRcdFx0c2FuZGJveC5zY3JpcHQgPSBzY3JpcHQ7XG5cdFx0XHRzYW5kYm94LnJlcXVlc3QgPSByZXF1ZXN0O1xuXG5cdFx0XHRjb25zdCByZXN1bHQgPSB2bS5ydW5Jbk5ld0NvbnRleHQoJ3NjcmlwdC5wcm9jZXNzX2luY29taW5nX3JlcXVlc3QoeyByZXF1ZXN0OiByZXF1ZXN0IH0pJywgc2FuZGJveCwge1xuXHRcdFx0XHR0aW1lb3V0OiAzMDAwXG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKCFyZXN1bHQpIHtcblx0XHRcdFx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdbUHJvY2VzcyBJbmNvbWluZyBSZXF1ZXN0IHJlc3VsdCBvZiBUcmlnZ2VyJywgdGhpcy5pbnRlZ3JhdGlvbi5uYW1lLCAnOl0gTm8gZGF0YScpO1xuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0fSBlbHNlIGlmIChyZXN1bHQgJiYgcmVzdWx0LmVycm9yKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKHJlc3VsdC5lcnJvcik7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuYm9keVBhcmFtcyA9IHJlc3VsdCAmJiByZXN1bHQuY29udGVudDtcblx0XHRcdHRoaXMuc2NyaXB0UmVzcG9uc2UgPSByZXN1bHQucmVzcG9uc2U7XG5cdFx0XHRpZiAocmVzdWx0LnVzZXIpIHtcblx0XHRcdFx0dGhpcy51c2VyID0gcmVzdWx0LnVzZXI7XG5cdFx0XHR9XG5cblx0XHRcdGxvZ2dlci5pbmNvbWluZy5kZWJ1ZygnW1Byb2Nlc3MgSW5jb21pbmcgUmVxdWVzdCByZXN1bHQgb2YgVHJpZ2dlcicsIHRoaXMuaW50ZWdyYXRpb24ubmFtZSwgJzpdJyk7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZGVidWcoJ3Jlc3VsdCcsIHRoaXMuYm9keVBhcmFtcyk7XG5cdFx0fSBjYXRjaCAoe3N0YWNrfSkge1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmVycm9yKCdbRXJyb3IgcnVubmluZyBTY3JpcHQgaW4gVHJpZ2dlcicsIHRoaXMuaW50ZWdyYXRpb24ubmFtZSwgJzpdJyk7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IodGhpcy5pbnRlZ3JhdGlvbi5zY3JpcHRDb21waWxlZC5yZXBsYWNlKC9eL2dtLCAnICAnKSk7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3IoJ1tTdGFjazpdJyk7XG5cdFx0XHRsb2dnZXIuaW5jb21pbmcuZXJyb3Ioc3RhY2sucmVwbGFjZSgvXi9nbSwgJyAgJykpO1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ2Vycm9yLXJ1bm5pbmctc2NyaXB0Jyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gVE9ETzogVHVybiB0aGlzIGludG8gYW4gb3B0aW9uIG9uIHRoZSBpbnRlZ3JhdGlvbnMgLSBubyBib2R5IG1lYW5zIGEgc3VjY2Vzc1xuXHQvLyBUT0RPOiBUZW1wb3JhcnkgZml4IGZvciBodHRwczovL2dpdGh1Yi5jb20vUm9ja2V0Q2hhdC9Sb2NrZXQuQ2hhdC9pc3N1ZXMvNzc3MCB1bnRpbCB0aGUgYWJvdmUgaXMgaW1wbGVtZW50ZWRcblx0aWYgKCF0aGlzLmJvZHlQYXJhbXMpIHtcblx0XHQvLyByZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnYm9keS1lbXB0eScpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKCk7XG5cdH1cblxuXHR0aGlzLmJvZHlQYXJhbXMuYm90ID0geyBpOiB0aGlzLmludGVncmF0aW9uLl9pZCB9O1xuXG5cdHRyeSB7XG5cdFx0Y29uc3QgbWVzc2FnZSA9IHByb2Nlc3NXZWJob29rTWVzc2FnZSh0aGlzLmJvZHlQYXJhbXMsIHRoaXMudXNlciwgZGVmYXVsdFZhbHVlcyk7XG5cdFx0aWYgKF8uaXNFbXB0eShtZXNzYWdlKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ3Vua25vd24tZXJyb3InKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5zY3JpcHRSZXNwb25zZSkge1xuXHRcdFx0bG9nZ2VyLmluY29taW5nLmRlYnVnKCdyZXNwb25zZScsIHRoaXMuc2NyaXB0UmVzcG9uc2UpO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHRoaXMuc2NyaXB0UmVzcG9uc2UpO1xuXHR9IGNhdGNoICh7IGVycm9yIH0pIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlcnJvcik7XG5cdH1cbn1cblxuZnVuY3Rpb24gYWRkSW50ZWdyYXRpb25SZXN0KCkge1xuXHRyZXR1cm4gY3JlYXRlSW50ZWdyYXRpb24odGhpcy5ib2R5UGFyYW1zLCB0aGlzLnVzZXIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVJbnRlZ3JhdGlvblJlc3QoKSB7XG5cdHJldHVybiByZW1vdmVJbnRlZ3JhdGlvbih0aGlzLmJvZHlQYXJhbXMsIHRoaXMudXNlcik7XG59XG5cbmZ1bmN0aW9uIGludGVncmF0aW9uU2FtcGxlUmVzdCgpIHtcblx0bG9nZ2VyLmluY29taW5nLmluZm8oJ1NhbXBsZSBJbnRlZ3JhdGlvbicpO1xuXHRyZXR1cm4ge1xuXHRcdHN0YXR1c0NvZGU6IDIwMCxcblx0XHRib2R5OiBbXG5cdFx0XHR7XG5cdFx0XHRcdHRva2VuOiBSYW5kb20uaWQoMjQpLFxuXHRcdFx0XHRjaGFubmVsX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0Y2hhbm5lbF9uYW1lOiAnZ2VuZXJhbCcsXG5cdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUsXG5cdFx0XHRcdHVzZXJfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHR1c2VyX25hbWU6ICdyb2NrZXQuY2F0Jyxcblx0XHRcdFx0dGV4dDogJ1NhbXBsZSB0ZXh0IDEnLFxuXHRcdFx0XHR0cmlnZ2VyX3dvcmQ6ICdTYW1wbGUnXG5cdFx0XHR9LCB7XG5cdFx0XHRcdHRva2VuOiBSYW5kb20uaWQoMjQpLFxuXHRcdFx0XHRjaGFubmVsX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0Y2hhbm5lbF9uYW1lOiAnZ2VuZXJhbCcsXG5cdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUsXG5cdFx0XHRcdHVzZXJfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHR1c2VyX25hbWU6ICdyb2NrZXQuY2F0Jyxcblx0XHRcdFx0dGV4dDogJ1NhbXBsZSB0ZXh0IDInLFxuXHRcdFx0XHR0cmlnZ2VyX3dvcmQ6ICdTYW1wbGUnXG5cdFx0XHR9LCB7XG5cdFx0XHRcdHRva2VuOiBSYW5kb20uaWQoMjQpLFxuXHRcdFx0XHRjaGFubmVsX2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdFx0Y2hhbm5lbF9uYW1lOiAnZ2VuZXJhbCcsXG5cdFx0XHRcdHRpbWVzdGFtcDogbmV3IERhdGUsXG5cdFx0XHRcdHVzZXJfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0XHR1c2VyX25hbWU6ICdyb2NrZXQuY2F0Jyxcblx0XHRcdFx0dGV4dDogJ1NhbXBsZSB0ZXh0IDMnLFxuXHRcdFx0XHR0cmlnZ2VyX3dvcmQ6ICdTYW1wbGUnXG5cdFx0XHR9XG5cdFx0XVxuXHR9O1xufVxuXG5mdW5jdGlvbiBpbnRlZ3JhdGlvbkluZm9SZXN0KCkge1xuXHRsb2dnZXIuaW5jb21pbmcuaW5mbygnSW5mbyBpbnRlZ3JhdGlvbicpO1xuXHRyZXR1cm4ge1xuXHRcdHN0YXR1c0NvZGU6IDIwMCxcblx0XHRib2R5OiB7XG5cdFx0XHRzdWNjZXNzOiB0cnVlXG5cdFx0fVxuXHR9O1xufVxuXG5BcGkuYWRkUm91dGUoJzppbnRlZ3JhdGlvbklkLzp1c2VySWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRwb3N0OiBleGVjdXRlSW50ZWdyYXRpb25SZXN0LFxuXHRnZXQ6IGV4ZWN1dGVJbnRlZ3JhdGlvblJlc3Rcbn0pO1xuXG5BcGkuYWRkUm91dGUoJzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdDogZXhlY3V0ZUludGVncmF0aW9uUmVzdCxcblx0Z2V0OiBleGVjdXRlSW50ZWdyYXRpb25SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCdzYW1wbGUvOmludGVncmF0aW9uSWQvOnVzZXJJZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldDogaW50ZWdyYXRpb25TYW1wbGVSZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCdzYW1wbGUvOmludGVncmF0aW9uSWQvOnRva2VuJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQ6IGludGVncmF0aW9uU2FtcGxlUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnaW5mby86aW50ZWdyYXRpb25JZC86dXNlcklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0OiBpbnRlZ3JhdGlvbkluZm9SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCdpbmZvLzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0Z2V0OiBpbnRlZ3JhdGlvbkluZm9SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCdhZGQvOmludGVncmF0aW9uSWQvOnVzZXJJZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IGFkZEludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgnYWRkLzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdDogYWRkSW50ZWdyYXRpb25SZXN0XG59KTtcblxuQXBpLmFkZFJvdXRlKCdyZW1vdmUvOmludGVncmF0aW9uSWQvOnVzZXJJZC86dG9rZW4nLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdHBvc3Q6IHJlbW92ZUludGVncmF0aW9uUmVzdFxufSk7XG5cbkFwaS5hZGRSb3V0ZSgncmVtb3ZlLzppbnRlZ3JhdGlvbklkLzp0b2tlbicsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0cG9zdDogcmVtb3ZlSW50ZWdyYXRpb25SZXN0XG59KTtcbiIsImNvbnN0IGNhbGxiYWNrSGFuZGxlciA9IGZ1bmN0aW9uIF9jYWxsYmFja0hhbmRsZXIoZXZlbnRUeXBlKSB7XG5cdHJldHVybiBmdW5jdGlvbiBfd3JhcHBlckZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LmludGVncmF0aW9ucy50cmlnZ2VySGFuZGxlci5leGVjdXRlVHJpZ2dlcnMoZXZlbnRUeXBlLCAuLi5hcmd1bWVudHMpO1xuXHR9O1xufTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgY2FsbGJhY2tIYW5kbGVyKCdzZW5kTWVzc2FnZScpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckNyZWF0ZUNoYW5uZWwnLCBjYWxsYmFja0hhbmRsZXIoJ3Jvb21DcmVhdGVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyQ3JlYXRlUHJpdmF0ZUdyb3VwJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tQ3JlYXRlZCcpLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1cpO1xuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlckNyZWF0ZVVzZXInLCBjYWxsYmFja0hhbmRsZXIoJ3VzZXJDcmVhdGVkJyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVySm9pblJvb20nLCBjYWxsYmFja0hhbmRsZXIoJ3Jvb21Kb2luZWQnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJMZWF2ZVJvb20nLCBjYWxsYmFja0hhbmRsZXIoJ3Jvb21MZWZ0JyksIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVyk7XG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2FmdGVyUm9vbUFyY2hpdmVkJywgY2FsbGJhY2tIYW5kbGVyKCdyb29tQXJjaGl2ZWQnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJGaWxlVXBsb2FkJywgY2FsbGJhY2tIYW5kbGVyKCdmaWxlVXBsb2FkZWQnKSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG50aGlzLnByb2Nlc3NXZWJob29rTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2VPYmosIHVzZXIsIGRlZmF1bHRWYWx1ZXMgPSB7IGNoYW5uZWw6ICcnLCBhbGlhczogJycsIGF2YXRhcjogJycsIGVtb2ppOiAnJyB9LCBtdXN0QmVKb2luZWQgPSBmYWxzZSkge1xuXHRjb25zdCBzZW50RGF0YSA9IFtdO1xuXHRjb25zdCBjaGFubmVscyA9IFtdLmNvbmNhdChtZXNzYWdlT2JqLmNoYW5uZWwgfHwgbWVzc2FnZU9iai5yb29tSWQgfHwgZGVmYXVsdFZhbHVlcy5jaGFubmVsKTtcblxuXHRmb3IgKGNvbnN0IGNoYW5uZWwgb2YgY2hhbm5lbHMpIHtcblx0XHRjb25zdCBjaGFubmVsVHlwZSA9IGNoYW5uZWxbMF07XG5cblx0XHRsZXQgY2hhbm5lbFZhbHVlID0gY2hhbm5lbC5zdWJzdHIoMSk7XG5cdFx0bGV0IHJvb207XG5cblx0XHRzd2l0Y2ggKGNoYW5uZWxUeXBlKSB7XG5cdFx0XHRjYXNlICcjJzpcblx0XHRcdFx0cm9vbSA9IFJvY2tldENoYXQuZ2V0Um9vbUJ5TmFtZU9ySWRXaXRoT3B0aW9uVG9Kb2luKHsgY3VycmVudFVzZXJJZDogdXNlci5faWQsIG5hbWVPcklkOiBjaGFubmVsVmFsdWUsIGpvaW5DaGFubmVsOiB0cnVlIH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgJ0AnOlxuXHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IGNoYW5uZWxWYWx1ZSwgdHlwZTogJ2QnIH0pO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdGNoYW5uZWxWYWx1ZSA9IGNoYW5uZWxUeXBlICsgY2hhbm5lbFZhbHVlO1xuXG5cdFx0XHRcdC8vVHJ5IHRvIGZpbmQgdGhlIHJvb20gYnkgaWQgb3IgbmFtZSBpZiB0aGV5IGRpZG4ndCBpbmNsdWRlIHRoZSBwcmVmaXguXG5cdFx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LmdldFJvb21CeU5hbWVPcklkV2l0aE9wdGlvblRvSm9pbih7IGN1cnJlbnRVc2VySWQ6IHVzZXIuX2lkLCBuYW1lT3JJZDogY2hhbm5lbFZhbHVlLCBqb2luQ2hhbm5lbDogdHJ1ZSwgZXJyb3JPbkVtcHR5OiBmYWxzZSB9KTtcblx0XHRcdFx0aWYgKHJvb20pIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vV2UgZGlkbid0IGdldCBhIHJvb20sIGxldCdzIHRyeSBmaW5kaW5nIGRpcmVjdCBtZXNzYWdlc1xuXHRcdFx0XHRyb29tID0gUm9ja2V0Q2hhdC5nZXRSb29tQnlOYW1lT3JJZFdpdGhPcHRpb25Ub0pvaW4oeyBjdXJyZW50VXNlcklkOiB1c2VyLl9pZCwgbmFtZU9ySWQ6IGNoYW5uZWxWYWx1ZSwgdHlwZTogJ2QnLCB0cnlEaXJlY3RCeVVzZXJJZE9ubHk6IHRydWUgfSk7XG5cdFx0XHRcdGlmIChyb29tKSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL05vIHJvb20sIHNvIHRocm93IGFuIGVycm9yXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtY2hhbm5lbCcpO1xuXHRcdH1cblxuXHRcdGlmIChtdXN0QmVKb2luZWQgJiYgIXJvb20udXNlcm5hbWVzLmluY2x1ZGVzKHVzZXIudXNlcm5hbWUpKSB7XG5cdFx0XHQvLyB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tIHByb3ZpZGVkIHRvIHNlbmQgYSBtZXNzYWdlIHRvLCBtdXN0IGJlIGpvaW5lZC4nKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtY2hhbm5lbCcpOyAvLyBUaHJvd2luZyB0aGUgZ2VuZXJpYyBvbmUgc28gcGVvcGxlIGNhbid0IFwiYnJ1dGUgZm9yY2VcIiBmaW5kIHJvb21zXG5cdFx0fVxuXG5cdFx0aWYgKG1lc3NhZ2VPYmouYXR0YWNobWVudHMgJiYgIV8uaXNBcnJheShtZXNzYWdlT2JqLmF0dGFjaG1lbnRzKSkge1xuXHRcdFx0Y29uc29sZS5sb2coJ0F0dGFjaG1lbnRzIHNob3VsZCBiZSBBcnJheSwgaWdub3JpbmcgdmFsdWUnLnJlZCwgbWVzc2FnZU9iai5hdHRhY2htZW50cyk7XG5cdFx0XHRtZXNzYWdlT2JqLmF0dGFjaG1lbnRzID0gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHRhbGlhczogbWVzc2FnZU9iai51c2VybmFtZSB8fCBtZXNzYWdlT2JqLmFsaWFzIHx8IGRlZmF1bHRWYWx1ZXMuYWxpYXMsXG5cdFx0XHRtc2c6IHMudHJpbShtZXNzYWdlT2JqLnRleHQgfHwgbWVzc2FnZU9iai5tc2cgfHwgJycpLFxuXHRcdFx0YXR0YWNobWVudHM6IG1lc3NhZ2VPYmouYXR0YWNobWVudHMgfHwgW10sXG5cdFx0XHRwYXJzZVVybHM6IG1lc3NhZ2VPYmoucGFyc2VVcmxzICE9PSB1bmRlZmluZWQgPyBtZXNzYWdlT2JqLnBhcnNlVXJscyA6ICFtZXNzYWdlT2JqLmF0dGFjaG1lbnRzLFxuXHRcdFx0Ym90OiBtZXNzYWdlT2JqLmJvdCxcblx0XHRcdGdyb3VwYWJsZTogKG1lc3NhZ2VPYmouZ3JvdXBhYmxlICE9PSB1bmRlZmluZWQpID8gbWVzc2FnZU9iai5ncm91cGFibGUgOiBmYWxzZVxuXHRcdH07XG5cblx0XHRpZiAoIV8uaXNFbXB0eShtZXNzYWdlT2JqLmljb25fdXJsKSB8fCAhXy5pc0VtcHR5KG1lc3NhZ2VPYmouYXZhdGFyKSkge1xuXHRcdFx0bWVzc2FnZS5hdmF0YXIgPSBtZXNzYWdlT2JqLmljb25fdXJsIHx8IG1lc3NhZ2VPYmouYXZhdGFyO1xuXHRcdH0gZWxzZSBpZiAoIV8uaXNFbXB0eShtZXNzYWdlT2JqLmljb25fZW1vamkpIHx8ICFfLmlzRW1wdHkobWVzc2FnZU9iai5lbW9qaSkpIHtcblx0XHRcdG1lc3NhZ2UuZW1vamkgPSBtZXNzYWdlT2JqLmljb25fZW1vamkgfHwgbWVzc2FnZU9iai5lbW9qaTtcblx0XHR9IGVsc2UgaWYgKCFfLmlzRW1wdHkoZGVmYXVsdFZhbHVlcy5hdmF0YXIpKSB7XG5cdFx0XHRtZXNzYWdlLmF2YXRhciA9IGRlZmF1bHRWYWx1ZXMuYXZhdGFyO1xuXHRcdH0gZWxzZSBpZiAoIV8uaXNFbXB0eShkZWZhdWx0VmFsdWVzLmVtb2ppKSkge1xuXHRcdFx0bWVzc2FnZS5lbW9qaSA9IGRlZmF1bHRWYWx1ZXMuZW1vamk7XG5cdFx0fVxuXG5cdFx0aWYgKF8uaXNBcnJheShtZXNzYWdlLmF0dGFjaG1lbnRzKSkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBtZXNzYWdlLmF0dGFjaG1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGF0dGFjaG1lbnQgPSBtZXNzYWdlLmF0dGFjaG1lbnRzW2ldO1xuXHRcdFx0XHRpZiAoYXR0YWNobWVudC5tc2cpIHtcblx0XHRcdFx0XHRhdHRhY2htZW50LnRleHQgPSBzLnRyaW0oYXR0YWNobWVudC5tc2cpO1xuXHRcdFx0XHRcdGRlbGV0ZSBhdHRhY2htZW50Lm1zZztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2VSZXR1cm4gPSBSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHVzZXIsIG1lc3NhZ2UsIHJvb20pO1xuXHRcdHNlbnREYXRhLnB1c2goeyBjaGFubmVsLCBtZXNzYWdlOiBtZXNzYWdlUmV0dXJuIH0pO1xuXHR9XG5cblx0cmV0dXJuIHNlbnREYXRhO1xufTtcbiJdfQ==
