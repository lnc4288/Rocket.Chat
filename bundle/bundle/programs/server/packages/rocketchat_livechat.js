(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Autoupdate = Package.autoupdate.Autoupdate;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var Streamer = Package['rocketchat:streamer'].Streamer;
var UserPresence = Package['konecty:user-presence'].UserPresence;
var UserPresenceMonitor = Package['konecty:user-presence'].UserPresenceMonitor;
var UserPresenceEvents = Package['konecty:user-presence'].UserPresenceEvents;
var fileUpload = Package['rocketchat:ui'].fileUpload;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var check = Package.check.check;
var Match = Package.check.Match;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var department, emailSettings, self, _id, agents, username, agent, exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:livechat":{"livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/livechat.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let url;
module.watch(require("url"), {
  default(v) {
    url = v;
  }

}, 1);
WebApp = Package.webapp.WebApp;
const Autoupdate = Package.autoupdate.Autoupdate;
WebApp.connectHandlers.use('/livechat', Meteor.bindEnvironment((req, res, next) => {
  const reqUrl = url.parse(req.url);

  if (reqUrl.pathname !== '/') {
    return next();
  }

  res.setHeader('content-type', 'text/html; charset=utf-8');
  let domainWhiteList = RocketChat.settings.get('Livechat_AllowedDomainsList');

  if (req.headers.referer && !_.isEmpty(domainWhiteList.trim())) {
    domainWhiteList = _.map(domainWhiteList.split(','), function (domain) {
      return domain.trim();
    });
    const referer = url.parse(req.headers.referer);

    if (!_.contains(domainWhiteList, referer.host)) {
      res.setHeader('X-FRAME-OPTIONS', 'DENY');
      return next();
    }

    res.setHeader('X-FRAME-OPTIONS', `ALLOW-FROM ${referer.protocol}//${referer.host}`);
  }

  const head = Assets.getText('public/head.html');
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  const html = `<html>
		<head>
			<link rel="stylesheet" type="text/css" class="__meteor-css__" href="${baseUrl}livechat/livechat.css?_dc=${Autoupdate.autoupdateVersion}">
			<script type="text/javascript">
				__meteor_runtime_config__ = ${JSON.stringify(__meteor_runtime_config__)};
			</script>

			<base href="${baseUrl}">

			${head}
		</head>
		<body>
			<script type="text/javascript" src="${baseUrl}livechat/livechat.js?_dc=${Autoupdate.autoupdateVersion}"></script>
		</body>
	</html>`;
  res.write(html);
  res.end();
}));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/startup.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(() => {
  RocketChat.roomTypes.setRoomFind('l', code => {
    return RocketChat.models.Rooms.findLivechatByCode(code);
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user) {
    return room.t === 'l' && user && RocketChat.authz.hasPermission(user._id, 'view-livechat-rooms');
  });
  RocketChat.authz.addRoomAccessValidator(function (room, user, extraData) {
    return room.t === 'l' && extraData && extraData.token && room.v && room.v.token === extraData.token;
  });
  RocketChat.callbacks.add('beforeLeaveRoom', function (user, room) {
    if (room.t !== 'l') {
      return user;
    }

    throw new Meteor.Error(TAPi18n.__('You_cant_leave_a_livechat_room_Please_use_the_close_button', {
      lng: user.language || RocketChat.settings.get('language') || 'en'
    }));
  }, RocketChat.callbacks.priority.LOW, 'cant-leave-room');
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/visitorStatus.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceEvents */
Meteor.startup(() => {
  UserPresenceEvents.on('setStatus', (session, status, metadata) => {
    if (metadata && metadata.visitor) {
      RocketChat.models.LivechatInquiry.updateVisitorStatus(metadata.visitor, status);
      RocketChat.models.Rooms.updateVisitorStatus(metadata.visitor, status);
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hooks":{"externalMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/externalMessage.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let knowledgeEnabled = false;
let apiaiKey = '';
let apiaiLanguage = 'en';
RocketChat.settings.get('Livechat_Knowledge_Enabled', function (key, value) {
  knowledgeEnabled = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Key', function (key, value) {
  apiaiKey = value;
});
RocketChat.settings.get('Livechat_Knowledge_Apiai_Language', function (key, value) {
  apiaiLanguage = value;
});
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  }

  if (!knowledgeEnabled) {
    return message;
  }

  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return message;
  } // if the message hasn't a token, it was not sent by the visitor, so ignore it


  if (!message.token) {
    return message;
  }

  Meteor.defer(() => {
    try {
      const response = HTTP.post('https://api.api.ai/api/query?v=20150910', {
        data: {
          query: message.msg,
          lang: apiaiLanguage,
          sessionId: room._id
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${apiaiKey}`
        }
      });

      if (response.data && response.data.status.code === 200 && !_.isEmpty(response.data.result.fulfillment.speech)) {
        RocketChat.models.LivechatExternalMessage.insert({
          rid: message.rid,
          msg: response.data.result.fulfillment.speech,
          orig: message._id,
          ts: new Date()
        });
      }
    } catch (e) {
      SystemLogger.error('Error using Api.ai ->', e);
    }
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'externalWebHook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leadCapture.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/leadCapture.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

function validateMessage(message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return false;
  } // message valid only if it is a livechat room


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.v && room.v.token)) {
    return false;
  } // if the message hasn't a token, it was NOT sent from the visitor, so ignore it


  if (!message.token) {
    return false;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return false;
  }

  return true;
}

RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  if (!validateMessage(message, room)) {
    return message;
  }

  const phoneRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_phone_regex'), 'g');
  const msgPhones = message.msg.match(phoneRegexp);
  const emailRegexp = new RegExp(RocketChat.settings.get('Livechat_lead_email_regex'), 'gi');
  const msgEmails = message.msg.match(emailRegexp);

  if (msgEmails || msgPhones) {
    LivechatVisitors.saveGuestEmailPhoneById(room.v._id, msgEmails, msgPhones);
    RocketChat.callbacks.run('livechat.leadCapture', room);
  }

  return message;
}, RocketChat.callbacks.priority.LOW, 'leadCapture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"markRoomResponded.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/markRoomResponded.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (!message || message.editedAt) {
    return message;
  } // check if room is yet awaiting for response


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.waitingResponse)) {
    return message;
  } // if the message has a token, it was sent by the visitor, so ignore it


  if (message.token) {
    return message;
  }

  Meteor.defer(() => {
    const now = new Date();
    RocketChat.models.Rooms.setResponseByRoomId(room._id, {
      user: {
        _id: message.u._id,
        username: message.u.username
      },
      responseDate: now,
      responseTime: (now.getTime() - room.ts) / 1000
    });
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'markRoomResponded');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"offlineMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/offlineMessage.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.callbacks.add('livechat.offlineMessage', data => {
  if (!RocketChat.settings.get('Livechat_webhook_on_offline_msg')) {
    return data;
  }

  const postData = {
    type: 'LivechatOfflineMessage',
    sentAt: new Date(),
    visitor: {
      name: data.name,
      email: data.email
    },
    message: data.message
  };
  RocketChat.Livechat.sendRequest(postData);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-email-offline-message');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"RDStation.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/RDStation.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToRDStation(room) {
  if (!RocketChat.settings.get('Livechat_RDStation_Token')) {
    return room;
  }

  const livechatData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);

  if (!livechatData.visitor.email) {
    return room;
  }

  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      token_rdstation: RocketChat.settings.get('Livechat_RDStation_Token'),
      identificador: 'rocketchat-livechat',
      client_id: livechatData.visitor._id,
      email: livechatData.visitor.email
    }
  };
  options.data.nome = livechatData.visitor.name || livechatData.visitor.username;

  if (livechatData.visitor.phone) {
    options.data.telefone = livechatData.visitor.phone;
  }

  if (livechatData.tags) {
    options.data.tags = livechatData.tags;
  }

  Object.keys(livechatData.customFields || {}).forEach(field => {
    options.data[field] = livechatData.customFields[field];
  });
  Object.keys(livechatData.visitor.customFields || {}).forEach(field => {
    options.data[field] = livechatData.visitor.customFields[field];
  });

  try {
    HTTP.call('POST', 'https://www.rdstation.com.br/api/1.3/conversions', options);
  } catch (e) {
    console.error('Error sending lead to RD Station ->', e);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-close-room');
RocketChat.callbacks.add('livechat.saveInfo', sendToRDStation, RocketChat.callbacks.priority.MEDIUM, 'livechat-rd-station-save-info');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToCRM.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToCRM.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function sendToCRM(type, room, includeMessages = true) {
  const postData = RocketChat.Livechat.getLivechatRoomGuestInfo(room);
  postData.type = type;
  postData.messages = [];

  if (includeMessages) {
    RocketChat.models.Messages.findVisibleByRoomId(room._id, {
      sort: {
        ts: 1
      }
    }).forEach(message => {
      if (message.t) {
        return;
      }

      const msg = {
        username: message.u.username,
        msg: message.msg,
        ts: message.ts
      };

      if (message.u.username !== postData.visitor.username) {
        msg.agentId = message.u._id;
      }

      postData.messages.push(msg);
    });
  }

  const response = RocketChat.Livechat.sendRequest(postData);

  if (response && response.data && response.data.data) {
    RocketChat.models.Rooms.saveCRMDataByRoomId(room._id, response.data.data);
  }

  return room;
}

RocketChat.callbacks.add('livechat.closeRoom', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_close')) {
    return room;
  }

  return sendToCRM('LivechatSession', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-close-room');
RocketChat.callbacks.add('livechat.saveInfo', room => {
  // Do not send to CRM if the chat is still open
  if (room.open) {
    return room;
  }

  return sendToCRM('LivechatEdit', room);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-save-info');
RocketChat.callbacks.add('livechat.leadCapture', room => {
  if (!RocketChat.settings.get('Livechat_webhook_on_capture')) {
    return room;
  }

  return sendToCRM('LeadCapture', room, false);
}, RocketChat.callbacks.priority.MEDIUM, 'livechat-send-crm-lead-capture');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendToFacebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/hooks/sendToFacebook.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.settings.get('Livechat_Facebook_Enabled') || !RocketChat.settings.get('Livechat_Facebook_API_Key')) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.facebook && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  OmniChannel.reply({
    page: room.facebook.page.id,
    token: room.v.token,
    text: message.msg
  });
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageToFacebook');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addAgent.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    return RocketChat.Livechat.addAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/addManager.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:addManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addManager'
      });
    }

    return RocketChat.Livechat.addManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"changeLivechatStatus.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/changeLivechatStatus.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:changeLivechatStatus'() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:changeLivechatStatus'
      });
    }

    const user = Meteor.user();
    const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
    return RocketChat.models.Users.setLivechatStatus(user._id, newStatus);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeByVisitor.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeByVisitor.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:closeByVisitor'({
    roomId,
    token
  }) {
    const room = RocketChat.models.Rooms.findOneOpenByVisitorToken(token, roomId);

    if (!room || !room.open) {
      return false;
    }

    const visitor = LivechatVisitors.getVisitorByToken(token);
    const language = visitor && visitor.language || RocketChat.settings.get('language') || 'en';
    return RocketChat.Livechat.closeRoom({
      visitor,
      room,
      comment: TAPi18n.__('Closed_by_visitor', {
        lng: language
      })
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"closeRoom.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/closeRoom.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:closeRoom'(roomId, comment) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'close-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(roomId);

    if (!room || room.t !== 'l') {
      throw new Meteor.Error('room-not-found', 'Room not found', {
        method: 'livechat:closeRoom'
      });
    }

    const user = Meteor.user();

    if ((!room.usernames || room.usernames.indexOf(user.username) === -1) && !RocketChat.authz.hasPermission(Meteor.userId(), 'close-others-livechat-room')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeRoom'
      });
    }

    return RocketChat.Livechat.closeRoom({
      user,
      room,
      comment
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/facebook.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let OmniChannel;
module.watch(require("../lib/OmniChannel"), {
  default(v) {
    OmniChannel = v;
  }

}, 0);
Meteor.methods({
  'livechat:facebook'(options) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:addAgent'
      });
    }

    try {
      switch (options.action) {
        case 'initialState':
          {
            return {
              enabled: RocketChat.settings.get('Livechat_Facebook_Enabled'),
              hasToken: !!RocketChat.settings.get('Livechat_Facebook_API_Key')
            };
          }

        case 'enable':
          {
            const result = OmniChannel.enable();

            if (!result.success) {
              return result;
            }

            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', true);
          }

        case 'disable':
          {
            OmniChannel.disable();
            return RocketChat.settings.updateById('Livechat_Facebook_Enabled', false);
          }

        case 'list-pages':
          {
            return OmniChannel.listPages();
          }

        case 'subscribe':
          {
            return OmniChannel.subscribe(options.page);
          }

        case 'unsubscribe':
          {
            return OmniChannel.unsubscribe(options.page);
          }
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        if (e.response.data.error.error) {
          throw new Meteor.Error(e.response.data.error.error, e.response.data.error.message);
        }

        if (e.response.data.error.response) {
          throw new Meteor.Error('integration-error', e.response.data.error.response.error.message);
        }

        if (e.response.data.error.message) {
          throw new Meteor.Error('integration-error', e.response.data.error.message);
        }
      }

      console.error('Error contacting omni.rocket.chat:', e);
      throw new Meteor.Error('integration-error', e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getCustomFields.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getCustomFields.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getCustomFields'() {
    return RocketChat.models.LivechatCustomField.find().fetch();
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getAgentData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getAgentData.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:getAgentData'({
    roomId,
    token
  }) {
    check(roomId, String);
    check(token, String);
    const room = RocketChat.models.Rooms.findOneById(roomId);
    const visitor = LivechatVisitors.getVisitorByToken(token); // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    if (!room.servedBy) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(room.servedBy._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getInitialData.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getInitialData.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:getInitialData'(visitorToken) {
    const info = {
      enabled: null,
      title: null,
      color: null,
      registrationForm: null,
      room: null,
      visitor: null,
      triggers: [],
      departments: [],
      allowSwitchingDepartments: null,
      online: true,
      offlineColor: null,
      offlineMessage: null,
      offlineSuccessMessage: null,
      offlineUnavailableMessage: null,
      displayOfflineForm: null,
      videoCall: null
    };
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
      fields: {
        name: 1,
        t: 1,
        cl: 1,
        u: 1,
        usernames: 1,
        v: 1,
        servedBy: 1
      }
    }).fetch();

    if (room && room.length > 0) {
      info.room = room[0];
    }

    const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
      fields: {
        name: 1,
        username: 1,
        visitorEmails: 1
      }
    });

    if (room) {
      info.visitor = visitor;
    }

    const initSettings = RocketChat.Livechat.getInitSettings();
    info.title = initSettings.Livechat_title;
    info.color = initSettings.Livechat_title_color;
    info.enabled = initSettings.Livechat_enabled;
    info.registrationForm = initSettings.Livechat_registration_form;
    info.offlineTitle = initSettings.Livechat_offline_title;
    info.offlineColor = initSettings.Livechat_offline_title_color;
    info.offlineMessage = initSettings.Livechat_offline_message;
    info.offlineSuccessMessage = initSettings.Livechat_offline_success_message;
    info.offlineUnavailableMessage = initSettings.Livechat_offline_form_unavailable;
    info.displayOfflineForm = initSettings.Livechat_display_offline_form;
    info.language = initSettings.Language;
    info.videoCall = initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true;
    info.transcript = initSettings.Livechat_enable_transcript;
    info.transcriptMessage = initSettings.Livechat_transcript_message;
    info.agentData = room && room[0] && room[0].servedBy && RocketChat.models.Users.getAgentInfo(room[0].servedBy._id);
    RocketChat.models.LivechatTrigger.findEnabled().forEach(trigger => {
      info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions'));
    });
    RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach(department => {
      info.departments.push(department);
    });
    info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;
    info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;
    return info;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getNextAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/getNextAgent.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:getNextAgent'({
    token,
    department
  }) {
    check(token, String);
    const room = RocketChat.models.Rooms.findOpenByVisitorToken(token).fetch();

    if (room && room.length > 0) {
      return;
    }

    if (!department) {
      const requireDeparment = RocketChat.Livechat.getRequiredDepartment();

      if (requireDeparment) {
        department = requireDeparment._id;
      }
    }

    const agent = RocketChat.Livechat.getNextAgent(department);

    if (!agent) {
      return;
    }

    return RocketChat.models.Users.getAgentInfo(agent.agentId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loadHistory.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loadHistory.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loadHistory'({
    token,
    rid,
    end,
    limit = 20,
    ls
  }) {
    const visitor = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!visitor) {
      return;
    }

    return RocketChat.loadMessageHistory({
      userId: visitor._id,
      rid,
      end,
      limit,
      ls
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginByToken.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/loginByToken.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:loginByToken'(token) {
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      return;
    }

    return {
      _id: user._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/pageVisited.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:pageVisited'(token, pageInfo) {
    return RocketChat.Livechat.savePageHistory(token, pageInfo);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"registerGuest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/registerGuest.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:registerGuest'({
    token,
    name,
    email,
    department
  } = {}) {
    const userId = RocketChat.Livechat.registerGuest.call(this, {
      token,
      name,
      email,
      department
    }); // update visited page history to not expire

    RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);
    return {
      userId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeAgent.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeAgent'
      });
    }

    return RocketChat.Livechat.removeAgent(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeCustomField.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeCustomField'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeCustomField'
      });
    }

    check(_id, String);
    const customField = RocketChat.models.LivechatCustomField.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!customField) {
      throw new Meteor.Error('error-invalid-custom-field', 'Custom field not found', {
        method: 'livechat:removeCustomField'
      });
    }

    return RocketChat.models.LivechatCustomField.removeById(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeDepartment.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeDepartment'(_id) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.Livechat.removeDepartment(_id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeManager.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeManager.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeManager'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.Livechat.removeManager(username);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/removeTrigger.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:removeTrigger'(triggerId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:removeTrigger'
      });
    }

    check(triggerId, String);
    return RocketChat.models.LivechatTrigger.removeById(triggerId);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveAppearance.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveAppearance'(settings) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveAppearance'
      });
    }

    const validSettings = ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email'];
    const valid = settings.every(setting => {
      return validSettings.indexOf(setting._id) !== -1;
    });

    if (!valid) {
      throw new Meteor.Error('invalid-setting');
    }

    settings.forEach(setting => {
      RocketChat.settings.updateById(setting._id, setting.value);
    });
    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveCustomField.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveCustomField.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveCustomField'(_id, customFieldData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      check(_id, String);
    }

    check(customFieldData, Match.ObjectIncluding({
      field: String,
      label: String,
      scope: String,
      visibility: String
    }));

    if (!/^[0-9a-zA-Z-_]+$/.test(customFieldData.field)) {
      throw new Meteor.Error('error-invalid-custom-field-nmae', 'Invalid custom field name. Use only letters, numbers, hyphens and underscores.', {
        method: 'livechat:saveCustomField'
      });
    }

    if (_id) {
      const customField = RocketChat.models.LivechatCustomField.findOneById(_id);

      if (!customField) {
        throw new Meteor.Error('error-invalid-custom-field', 'Custom Field Not found', {
          method: 'livechat:saveCustomField'
        });
      }
    }

    return RocketChat.models.LivechatCustomField.createOrUpdateCustomField(_id, customFieldData.field, customFieldData.label, customFieldData.scope, customFieldData.visibility);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveDepartment.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveDepartment.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    }

    return RocketChat.Livechat.saveDepartment(_id, departmentData, departmentAgents);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveInfo.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveInfo.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.ObjectIncluding", "Match.Optional"]}] */
Meteor.methods({
  'livechat:saveInfo'(guestData, roomData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    check(guestData, Match.ObjectIncluding({
      _id: String,
      name: Match.Optional(String),
      email: Match.Optional(String),
      phone: Match.Optional(String)
    }));
    check(roomData, Match.ObjectIncluding({
      _id: String,
      topic: Match.Optional(String),
      tags: Match.Optional(String)
    }));
    const room = RocketChat.models.Rooms.findOneById(roomData._id, {
      fields: {
        t: 1,
        servedBy: 1
      }
    });

    if (room == null || room.t !== 'l') {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'livechat:saveInfo'
      });
    }

    if ((!room.servedBy || room.servedBy._id !== Meteor.userId()) && !RocketChat.authz.hasPermission(Meteor.userId(), 'save-others-livechat-room-info')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveInfo'
      });
    }

    const ret = RocketChat.Livechat.saveGuest(guestData) && RocketChat.Livechat.saveRoomInfo(roomData, guestData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveInfo', RocketChat.models.Rooms.findOneById(roomData._id));
    });
    return ret;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveIntegration.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveIntegration.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.methods({
  'livechat:saveIntegration'(values) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveIntegration'
      });
    }

    if (typeof values['Livechat_webhookUrl'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhookUrl', s.trim(values['Livechat_webhookUrl']));
    }

    if (typeof values['Livechat_secret_token'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_secret_token', s.trim(values['Livechat_secret_token']));
    }

    if (typeof values['Livechat_webhook_on_close'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_close', !!values['Livechat_webhook_on_close']);
    }

    if (typeof values['Livechat_webhook_on_offline_msg'] !== 'undefined') {
      RocketChat.settings.updateById('Livechat_webhook_on_offline_msg', !!values['Livechat_webhook_on_offline_msg']);
    }

    return;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveSurveyFeedback.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveSurveyFeedback.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
Meteor.methods({
  'livechat:saveSurveyFeedback'(visitorToken, visitorRoom, formData) {
    check(visitorToken, String);
    check(visitorRoom, String);
    check(formData, [Match.ObjectIncluding({
      name: String,
      value: String
    })]);
    const visitor = LivechatVisitors.getVisitorByToken(visitorToken);
    const room = RocketChat.models.Rooms.findOneById(visitorRoom);

    if (visitor !== undefined && room !== undefined && room.v !== undefined && room.v.token === visitor.token) {
      const updateData = {};

      for (const item of formData) {
        if (_.contains(['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'], item.name) && _.contains(['1', '2', '3', '4', '5'], item.value)) {
          updateData[item.name] = item.value;
        } else if (item.name === 'additionalFeedback') {
          updateData[item.name] = item.value;
        }
      }

      if (!_.isEmpty(updateData)) {
        return RocketChat.models.Rooms.updateSurveyFeedbackById(room._id, updateData);
      }
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveTrigger.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveTrigger'(trigger) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveTrigger'
      });
    }

    check(trigger, {
      _id: Match.Maybe(String),
      name: String,
      description: String,
      enabled: Boolean,
      conditions: Array,
      actions: Array
    });

    if (trigger._id) {
      return RocketChat.models.LivechatTrigger.updateById(trigger._id, trigger);
    } else {
      return RocketChat.models.LivechatTrigger.insert(trigger);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"searchAgent.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/searchAgent.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'livechat:searchAgent'(username) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-livechat-manager')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:searchAgent'
      });
    }

    if (!username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'livechat:searchAgent'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:searchAgent'
      });
    }

    return user;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessageLivechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendMessageLivechat.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  sendMessageLivechat({
    token,
    _id,
    rid,
    msg
  }, agent) {
    check(token, String);
    check(_id, String);
    check(rid, String);
    check(msg, String);
    check(agent, Match.Maybe({
      agentId: String,
      username: String
    }));
    const guest = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        name: 1,
        username: 1,
        department: 1,
        token: 1
      }
    });

    if (!guest) {
      throw new Meteor.Error('invalid-token');
    }

    return RocketChat.Livechat.sendMessage({
      guest,
      message: {
        _id,
        rid,
        msg,
        token
      },
      agent
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendOfflineMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendOfflineMessage.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let dns;
module.watch(require("dns"), {
  default(v) {
    dns = v;
  }

}, 0);
Meteor.methods({
  'livechat:sendOfflineMessage'(data) {
    check(data, {
      name: String,
      email: String,
      message: String
    });

    if (!RocketChat.settings.get('Livechat_display_offline_form')) {
      return false;
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const message = `${data.message}`.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
    const html = `
			<h1>New livechat message</h1>
			<p><strong>Visitor name:</strong> ${data.name}</p>
			<p><strong>Visitor email:</strong> ${data.email}</p>
			<p><strong>Message:</strong><br>${message}</p>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    if (RocketChat.settings.get('Livechat_validate_offline_email')) {
      const emailDomain = data.email.substr(data.email.lastIndexOf('@') + 1);

      try {
        Meteor.wrapAsync(dns.resolveMx)(emailDomain);
      } catch (e) {
        throw new Meteor.Error('error-invalid-email-address', 'Invalid email address', {
          method: 'livechat:sendOfflineMessage'
        });
      }
    }

    Meteor.defer(() => {
      Email.send({
        to: RocketChat.settings.get('Livechat_offline_email'),
        from: `${data.name} - ${data.email} <${fromEmail}>`,
        replyTo: `${data.name} <${data.email}>`,
        subject: `Livechat offline message from ${data.name}: ${`${data.message}`.substring(0, 20)}`,
        html: header + html + footer
      });
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.offlineMessage', data);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendOfflineMessage',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setCustomField.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:setCustomField'(token, key, value, overwrite = true) {
    const customField = RocketChat.models.LivechatCustomField.findOneById(key);

    if (customField) {
      if (customField.scope === 'room') {
        return RocketChat.models.Rooms.updateLivechatDataByToken(token, key, value, overwrite);
      } else {
        // Save in user
        return LivechatVisitors.updateLivechatDataByToken(token, key, value, overwrite);
      }
    }

    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setDepartmentForVisitor.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/setDepartmentForVisitor.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:setDepartmentForVisitor'({
    token,
    department
  } = {}) {
    RocketChat.Livechat.setDepartmentForGuest.call(this, {
      token,
      department
    }); // update visited page history to not expire

    RocketChat.models.LivechatPageVisited.keepHistoryForToken(token);
    return true;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"startVideoCall.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/startVideoCall.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* eslint new-cap: [2, {"capIsNewExceptions": ["MD5"]}] */
Meteor.methods({
  'livechat:startVideoCall'(roomId) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:closeByVisitor'
      });
    }

    const guest = Meteor.user();
    const message = {
      _id: Random.id(),
      rid: roomId || Random.id(),
      msg: '',
      ts: new Date()
    };
    const {
      room
    } = RocketChat.Livechat.getRoom(guest, message, {
      jitsiTimeout: new Date(Date.now() + 3600 * 1000)
    });
    message.rid = room._id;
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('livechat_video_call', room._id, '', guest, {
      actionLinks: [{
        icon: 'icon-videocam',
        i18nLabel: 'Accept',
        method_id: 'createLivechatCall',
        params: ''
      }, {
        icon: 'icon-cancel',
        i18nLabel: 'Decline',
        method_id: 'denyLivechatCall',
        params: ''
      }]
    });
    return {
      roomId: room._id,
      domain: RocketChat.settings.get('Jitsi_Domain'),
      jitsiRoom: RocketChat.settings.get('Jitsi_URL_Room_Prefix') + RocketChat.settings.get('uniqueID') + roomId
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"transfer.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/transfer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.methods({
  'livechat:transfer'(transferData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:transfer'
      });
    }

    check(transferData, {
      roomId: String,
      userId: Match.Optional(String),
      departmentId: Match.Optional(String)
    });
    const room = RocketChat.models.Rooms.findOneById(transferData.roomId);
    const guest = LivechatVisitors.findOneById(room.v._id);
    const user = Meteor.user();

    if (room.usernames.indexOf(user.username) === -1 && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'livechat:transfer'
      });
    }

    return RocketChat.Livechat.transfer(room, guest, transferData);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"webhookTest.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/webhookTest.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals HTTP */
const postCatchError = Meteor.wrapAsync(function (url, options, resolve) {
  HTTP.post(url, options, function (err, res) {
    if (err) {
      resolve(null, err.response);
    } else {
      resolve(null, res);
    }
  });
});
Meteor.methods({
  'livechat:webhookTest'() {
    this.unblock();
    const sampleData = {
      type: 'LivechatSession',
      _id: 'fasd6f5a4sd6f8a4sdf',
      label: 'title',
      topic: 'asiodojf',
      code: 123123,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      tags: ['tag1', 'tag2', 'tag3'],
      customFields: {
        productId: '123456'
      },
      visitor: {
        _id: '',
        name: 'visitor name',
        username: 'visitor-username',
        department: 'department',
        email: 'email@address.com',
        phone: '192873192873',
        ip: '123.456.7.89',
        browser: 'Chrome',
        os: 'Linux',
        customFields: {
          customerId: '123456'
        }
      },
      agent: {
        _id: 'asdf89as6df8',
        username: 'agent.username',
        name: 'Agent Name',
        email: 'agent@email.com'
      },
      messages: [{
        username: 'visitor-username',
        msg: 'message content',
        ts: new Date()
      }, {
        username: 'agent.username',
        agentId: 'asdf89as6df8',
        msg: 'message content from agent',
        ts: new Date()
      }]
    };
    const options = {
      headers: {
        'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
      },
      data: sampleData
    };
    const response = postCatchError(RocketChat.settings.get('Livechat_webhookUrl'), options);
    console.log('response ->', response);

    if (response && response.statusCode && response.statusCode === 200) {
      return true;
    } else {
      throw new Meteor.Error('error-invalid-webhook-response');
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"takeInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/takeInquiry.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:takeInquiry'(inquiryId) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:takeInquiry'
      });
    }

    const inquiry = RocketChat.models.LivechatInquiry.findOneById(inquiryId);

    if (!inquiry || inquiry.status === 'taken') {
      throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', {
        method: 'livechat:takeInquiry'
      });
    }

    const user = RocketChat.models.Users.findOneById(Meteor.userId());
    const agent = {
      agentId: user._id,
      username: user.username
    }; // add subscription

    const subscriptionData = {
      rid: inquiry.rid,
      name: inquiry.name,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      code: inquiry.code,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Subscriptions.insert(subscriptionData); // update room

    const room = RocketChat.models.Rooms.findOneById(inquiry.rid);
    RocketChat.models.Rooms.changeAgentByRoomId(inquiry.rid, agent);
    room.servedBy = {
      _id: agent.agentId,
      username: agent.username
    }; // mark inquiry as taken

    RocketChat.models.LivechatInquiry.takeInquiry(inquiry._id); // remove sending message from guest widget
    // dont check if setting is true, because if settingwas switched off inbetween  guest entered pool,
    // and inquiry being taken, message would not be switched off.

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('connected', room._id, user);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    }); // return room corresponding to inquiry (for redirecting agent to the room route)

    return room;
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"returnAsInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/returnAsInquiry.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:returnAsInquiry'(rid) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', {
        method: 'livechat:saveDepartment'
      });
    } // //delete agent and room subscription


    RocketChat.models.Subscriptions.removeByRoomId(rid); // remove user from room

    const username = Meteor.user().username;
    RocketChat.models.Rooms.removeUsernameById(rid, username); // find inquiry corresponding to room

    const inquiry = RocketChat.models.LivechatInquiry.findOne({
      rid
    }); // mark inquiry as open

    return RocketChat.models.LivechatInquiry.openInquiry(inquiry._id);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/saveOfficeHours.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.methods({
  'livechat:saveOfficeHours'(day, start, finish, open) {
    RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendTranscript.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/methods/sendTranscript.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);
Meteor.methods({
  'livechat:sendTranscript'(token, rid, email) {
    check(rid, String);
    check(email, String);
    const room = RocketChat.models.Rooms.findOneById(rid);
    const visitor = LivechatVisitors.getVisitorByToken(token);
    const userLanguage = visitor && visitor.language || RocketChat.settings.get('language') || 'en'; // allow to only user to send transcripts from their own chats

    if (!room || room.t !== 'l' || !room.v || room.v.token !== token) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room');
    }

    const messages = RocketChat.models.Messages.findVisibleByRoomId(rid, {
      sort: {
        'ts': 1
      }
    });
    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    let html = '<div> <hr>';
    messages.forEach(message => {
      if (message.t && ['command', 'livechat-close', 'livechat_video_call'].indexOf(message.t) !== -1) {
        return;
      }

      let author;

      if (message.u._id === visitor._id) {
        author = TAPi18n.__('You', {
          lng: userLanguage
        });
      } else {
        author = message.u.username;
      }

      const datetime = moment(message.ts).locale(userLanguage).format('LLL');
      const singleMessage = `
				<p><strong>${author}</strong>  <em>${datetime}</em></p>
				<p>${message.msg}</p>
			`;
      html = html + singleMessage;
    });
    html = `${html}</div>`;
    let fromEmail = RocketChat.settings.get('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);

    if (fromEmail) {
      fromEmail = fromEmail[0];
    } else {
      fromEmail = RocketChat.settings.get('From_Email');
    }

    emailSettings = {
      to: email,
      from: fromEmail,
      replyTo: fromEmail,
      subject: TAPi18n.__('Transcript_of_your_livechat_conversation', {
        lng: userLanguage
      }),
      html: header + html + footer
    };
    Meteor.defer(() => {
      Email.send(emailSettings);
    });
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.sendTranscript', messages, email);
    });
    return true;
  }

});
DDPRateLimiter.addRule({
  type: 'method',
  name: 'livechat:sendTranscript',

  connectionId() {
    return true;
  }

}, 1, 5000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Users.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Users.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Sets an user as (non)operator
 * @param {string} _id - User's _id
 * @param {boolean} operator - Flag to set as operator or not
 */
RocketChat.models.Users.setOperator = function (_id, operator) {
  const update = {
    $set: {
      operator
    }
  };
  return this.update(_id, update);
};
/**
 * Gets all online agents
 * @return
 */


RocketChat.models.Users.findOnlineAgents = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find an online agent by his username
 * @return
 */


RocketChat.models.Users.findOneOnlineAgentByUsername = function (username) {
  const query = {
    username,
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  return this.findOne(query);
};
/**
 * Gets all agents
 * @return
 */


RocketChat.models.Users.findAgents = function () {
  const query = {
    roles: 'livechat-agent'
  };
  return this.find(query);
};
/**
 * Find online users from a list
 * @param {array} userList - array of usernames
 * @return
 */


RocketChat.models.Users.findOnlineUserFromList = function (userList) {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent',
    username: {
      $in: [].concat(userList)
    }
  };
  return this.find(query);
};
/**
 * Get next user agent in order
 * @return {object} User from db
 */


RocketChat.models.Users.getNextAgent = function () {
  const query = {
    status: {
      $exists: true,
      $ne: 'offline'
    },
    statusLivechat: 'available',
    roles: 'livechat-agent'
  };
  const collectionObj = this.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
  const sort = {
    livechatCount: 1,
    username: 1
  };
  const update = {
    $inc: {
      livechatCount: 1
    }
  };
  const user = findAndModify(query, sort, update);

  if (user && user.value) {
    return {
      agentId: user.value._id,
      username: user.value.username
    };
  } else {
    return null;
  }
};
/**
 * Change user's livechat status
 * @param {string} token - Visitor token
 */


RocketChat.models.Users.setLivechatStatus = function (userId, status) {
  const query = {
    '_id': userId
  };
  const update = {
    $set: {
      'statusLivechat': status
    }
  };
  return this.update(query, update);
};
/**
 * change all livechat agents livechat status to "not-available"
 */


RocketChat.models.Users.closeOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'not-available');
  });
};
/**
 * change all livechat agents livechat status to "available"
 */


RocketChat.models.Users.openOffice = function () {
  self = this;
  self.findAgents().forEach(function (agent) {
    self.setLivechatStatus(agent._id, 'available');
  });
};

RocketChat.models.Users.getAgentInfo = function (agentId) {
  const query = {
    _id: agentId
  };
  const options = {
    fields: {
      name: 1,
      username: 1,
      customFields: 1
    }
  };

  if (RocketChat.settings.get('Livechat_show_agent_email')) {
    options.fields.emails = 1;
  }

  return this.findOne(query, options);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/Rooms.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Gets visitor by token
 * @param {string} token - Visitor token
 */
RocketChat.models.Rooms.updateSurveyFeedbackById = function (_id, surveyFeedback) {
  const query = {
    _id
  };
  const update = {
    $set: {
      surveyFeedback
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateLivechatDataByToken = function (token, key, value, overwrite = true) {
  const query = {
    'v.token': token,
    open: true
  };

  if (!overwrite) {
    const room = this.findOne(query, {
      fields: {
        livechatData: 1
      }
    });

    if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
      return true;
    }
  }

  const update = {
    $set: {
      [`livechatData.${key}`]: value
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.findLivechat = function (filter = {}, offset = 0, limit = 20) {
  const query = _.extend(filter, {
    t: 'l'
  });

  return this.find(query, {
    sort: {
      ts: -1
    },
    offset,
    limit
  });
};

RocketChat.models.Rooms.findLivechatByCode = function (code, fields) {
  code = parseInt(code);
  const options = {};

  if (fields) {
    options.fields = fields;
  } // if (this.useCache) {
  // 	return this.cache.findByIndex('t,code', ['l', code], options).fetch();
  // }


  const query = {
    t: 'l',
    code
  };
  return this.findOne(query, options);
};
/**
 * Get the next visitor name
 * @return {string} The next visitor name
 */


RocketChat.models.Rooms.getNextLivechatRoomCode = function () {
  const settingsRaw = RocketChat.models.Settings.model.rawCollection();
  const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
  const query = {
    _id: 'Livechat_Room_Count'
  };
  const update = {
    $inc: {
      value: 1
    }
  };
  const livechatCount = findAndModify(query, null, update);
  return livechatCount.value.value;
};

RocketChat.models.Rooms.findOpenByVisitorToken = function (visitorToken, options) {
  const query = {
    open: true,
    'v.token': visitorToken
  };
  return this.find(query, options);
};

RocketChat.models.Rooms.findByVisitorToken = function (visitorToken) {
  const query = {
    'v.token': visitorToken
  };
  return this.find(query);
};

RocketChat.models.Rooms.findByVisitorId = function (visitorId) {
  const query = {
    'v._id': visitorId
  };
  return this.find(query);
};

RocketChat.models.Rooms.findOneOpenByVisitorToken = function (token, roomId) {
  const query = {
    _id: roomId,
    open: true,
    'v.token': token
  };
  return this.findOne(query);
};

RocketChat.models.Rooms.setResponseByRoomId = function (roomId, response) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      responseBy: {
        _id: response.user._id,
        username: response.user.username
      },
      responseDate: response.responseDate,
      responseTime: response.responseTime
    },
    $unset: {
      waitingResponse: 1
    }
  });
};

RocketChat.models.Rooms.closeByRoomId = function (roomId, closeInfo) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      closer: closeInfo.closer,
      closedBy: closeInfo.closedBy,
      closedAt: closeInfo.closedAt,
      chatDuration: closeInfo.chatDuration,
      'v.status': 'offline'
    },
    $unset: {
      open: 1
    }
  });
};

RocketChat.models.Rooms.setLabelByRoomId = function (roomId, label) {
  return this.update({
    _id: roomId
  }, {
    $set: {
      label
    }
  });
};

RocketChat.models.Rooms.findOpenByAgent = function (userId) {
  const query = {
    open: true,
    'servedBy._id': userId
  };
  return this.find(query);
};

RocketChat.models.Rooms.changeAgentByRoomId = function (roomId, newAgent) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      servedBy: {
        _id: newAgent.agentId,
        username: newAgent.username
      }
    }
  };
  this.update(query, update);
};

RocketChat.models.Rooms.saveCRMDataByRoomId = function (roomId, crmData) {
  const query = {
    _id: roomId
  };
  const update = {
    $set: {
      crmData
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.updateVisitorStatus = function (token, status) {
  const query = {
    'v.token': token,
    open: true
  };
  const update = {
    $set: {
      'v.status': status
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatExternalMessage.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatExternalMessage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatExternalMessage extends RocketChat.models._Base {
  constructor() {
    super('livechat_external_message');

    if (Meteor.isClient) {
      this._initModel('livechat_external_message');
    }
  } // FIND


  findByRoomId(roomId, sort = {
    ts: -1
  }) {
    const query = {
      rid: roomId
    };
    return this.find(query, {
      sort
    });
  }

}

RocketChat.models.LivechatExternalMessage = new LivechatExternalMessage();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatCustomField.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatCustomField.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
  constructor() {
    super('livechat_custom_field');
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  createOrUpdateCustomField(_id, field, label, scope, visibility, extraData) {
    const record = {
      label,
      scope,
      visibility
    };

    _.extend(record, extraData);

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      record._id = field;
      _id = this.insert(record);
    }

    return record;
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartment.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartment.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartment extends RocketChat.models._Base {
  constructor() {
    super('livechat_department');
    this.tryEnsureIndex({
      numAgents: 1,
      enabled: 1
    });
  } // FIND


  findOneById(_id, options) {
    const query = {
      _id
    };
    return this.findOne(query, options);
  }

  findByDepartmentId(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }

  createOrUpdateDepartment(_id, {
    enabled,
    name,
    description,
    showOnRegistration
  }, agents) {
    agents = [].concat(agents);
    const record = {
      enabled,
      name,
      description,
      numAgents: agents.length,
      showOnRegistration
    };

    if (_id) {
      this.update({
        _id
      }, {
        $set: record
      });
    } else {
      _id = this.insert(record);
    }

    const savedAgents = _.pluck(RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(_id).fetch(), 'agentId');

    const agentsToSave = _.pluck(agents, 'agentId'); // remove other agents


    _.difference(savedAgents, agentsToSave).forEach(agentId => {
      RocketChat.models.LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(_id, agentId);
    });

    agents.forEach(agent => {
      RocketChat.models.LivechatDepartmentAgents.saveAgent({
        agentId: agent.agentId,
        departmentId: _id,
        username: agent.username,
        count: agent.count ? parseInt(agent.count) : 0,
        order: agent.order ? parseInt(agent.order) : 0
      });
    });
    return _.extend(record, {
      _id
    });
  } // REMOVE


  removeById(_id) {
    const query = {
      _id
    };
    return this.remove(query);
  }

  findEnabledWithAgents() {
    const query = {
      numAgents: {
        $gt: 0
      },
      enabled: true
    };
    return this.find(query);
  }

}

RocketChat.models.LivechatDepartment = new LivechatDepartment();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatDepartmentAgents.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatDepartmentAgents.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

/**
 * Livechat Department model
 */
class LivechatDepartmentAgents extends RocketChat.models._Base {
  constructor() {
    super('livechat_department_agents');
  }

  findByDepartmentId(departmentId) {
    return this.find({
      departmentId
    });
  }

  saveAgent(agent) {
    return this.upsert({
      agentId: agent.agentId,
      departmentId: agent.departmentId
    }, {
      $set: {
        username: agent.username,
        count: parseInt(agent.count),
        order: parseInt(agent.order)
      }
    });
  }

  removeByDepartmentIdAndAgentId(departmentId, agentId) {
    this.remove({
      departmentId,
      agentId
    });
  }

  getNextAgentForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return;
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const sort = {
      count: 1,
      order: 1,
      username: 1
    };
    const update = {
      $inc: {
        count: 1
      }
    };
    const collectionObj = this.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(collectionObj.findAndModify, collectionObj);
    const agent = findAndModify(query, sort, update);

    if (agent && agent.value) {
      return {
        agentId: agent.value.agentId,
        username: agent.value.username
      };
    } else {
      return null;
    }
  }

  getOnlineForDepartment(departmentId) {
    const agents = this.findByDepartmentId(departmentId).fetch();

    if (agents.length === 0) {
      return [];
    }

    const onlineUsers = RocketChat.models.Users.findOnlineUserFromList(_.pluck(agents, 'username'));

    const onlineUsernames = _.pluck(onlineUsers.fetch(), 'username');

    const query = {
      departmentId,
      username: {
        $in: onlineUsernames
      }
    };
    const depAgents = this.find(query);

    if (depAgents) {
      return depAgents;
    } else {
      return [];
    }
  }

  findUsersInQueue(usersList) {
    const query = {};

    if (!_.isEmpty(usersList)) {
      query.username = {
        $in: usersList
      };
    }

    const options = {
      sort: {
        departmentId: 1,
        count: 1,
        order: 1,
        username: 1
      }
    };
    return this.find(query, options);
  }

}

RocketChat.models.LivechatDepartmentAgents = new LivechatDepartmentAgents();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatPageVisited.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Page Visited model
 */
class LivechatPageVisited extends RocketChat.models._Base {
  constructor() {
    super('livechat_page_visited');
    this.tryEnsureIndex({
      'token': 1
    });
    this.tryEnsureIndex({
      'ts': 1
    }); // keep history for 1 month if the visitor does not register

    this.tryEnsureIndex({
      'expireAt': 1
    }, {
      sparse: 1,
      expireAfterSeconds: 0
    });
  }

  saveByToken(token, pageInfo) {
    // keep history of unregistered visitors for 1 month
    const keepHistoryMiliseconds = 2592000000;
    return this.insert({
      token,
      page: pageInfo,
      ts: new Date(),
      expireAt: new Date().getTime() + keepHistoryMiliseconds
    });
  }

  findByToken(token) {
    return this.find({
      token
    }, {
      sort: {
        ts: -1
      },
      limit: 20
    });
  }

  keepHistoryForToken(token) {
    return this.update({
      token,
      expireAt: {
        $exists: true
      }
    }, {
      $unset: {
        expireAt: 1
      }
    }, {
      multi: true
    });
  }

}

RocketChat.models.LivechatPageVisited = new LivechatPageVisited();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatTrigger.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatTrigger.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
  constructor() {
    super('livechat_trigger');
  }

  updateById(_id, data) {
    return this.update({
      _id
    }, {
      $set: data
    });
  }

  removeAll() {
    return this.remove({});
  }

  findById(_id) {
    return this.find({
      _id
    });
  }

  removeById(_id) {
    return this.remove({
      _id
    });
  }

  findEnabled() {
    return this.find({
      enabled: true
    });
  }

}

RocketChat.models.LivechatTrigger = new LivechatTrigger();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"indexes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/indexes.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Rooms.tryEnsureIndex({
    code: 1
  });
  RocketChat.models.Rooms.tryEnsureIndex({
    open: 1
  }, {
    sparse: 1
  });
  RocketChat.models.Users.tryEnsureIndex({
    'visitorEmails.address': 1
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatInquiry.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatInquiry.js                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
class LivechatInquiry extends RocketChat.models._Base {
  constructor() {
    super('livechat_inquiry');
    this.tryEnsureIndex({
      'rid': 1
    }); // room id corresponding to this inquiry

    this.tryEnsureIndex({
      'name': 1
    }); // name of the inquiry (client name for now)

    this.tryEnsureIndex({
      'message': 1
    }); // message sent by the client

    this.tryEnsureIndex({
      'ts': 1
    }); // timestamp

    this.tryEnsureIndex({
      'code': 1
    }); // (for routing)

    this.tryEnsureIndex({
      'agents': 1
    }); // Id's of the agents who can see the inquiry (handle departments)

    this.tryEnsureIndex({
      'status': 1
    }); // 'open', 'taken'
  }

  findOneById(inquiryId) {
    return this.findOne({
      _id: inquiryId
    });
  }
  /*
   * mark the inquiry as taken
   */


  takeInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'taken'
      }
    });
  }
  /*
   * mark the inquiry as closed
   */


  closeByRoomId(roomId, closeInfo) {
    return this.update({
      rid: roomId
    }, {
      $set: {
        status: 'closed',
        closer: closeInfo.closer,
        closedBy: closeInfo.closedBy,
        closedAt: closeInfo.closedAt,
        chatDuration: closeInfo.chatDuration
      }
    });
  }
  /*
   * mark inquiry as open
   */


  openInquiry(inquiryId) {
    this.update({
      '_id': inquiryId
    }, {
      $set: {
        status: 'open'
      }
    });
  }
  /*
   * return the status of the inquiry (open or taken)
   */


  getStatus(inquiryId) {
    return this.findOne({
      '_id': inquiryId
    }).status;
  }

  updateVisitorStatus(token, status) {
    const query = {
      'v.token': token,
      status: 'open'
    };
    const update = {
      $set: {
        'v.status': status
      }
    };
    return this.update(query, update);
  }

}

RocketChat.models.LivechatInquiry = new LivechatInquiry();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatOfficeHour.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatOfficeHour.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 0);

class LivechatOfficeHour extends RocketChat.models._Base {
  constructor() {
    super('livechat_office_hour');
    this.tryEnsureIndex({
      'day': 1
    }); // the day of the week monday - sunday

    this.tryEnsureIndex({
      'start': 1
    }); // the opening hours of the office

    this.tryEnsureIndex({
      'finish': 1
    }); // the closing hours of the office

    this.tryEnsureIndex({
      'open': 1
    }); // whether or not the offices are open on this day
    // if there is nothing in the collection, add defaults

    if (this.find().count() === 0) {
      this.insert({
        'day': 'Monday',
        'start': '08:00',
        'finish': '20:00',
        'code': 1,
        'open': true
      });
      this.insert({
        'day': 'Tuesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 2,
        'open': true
      });
      this.insert({
        'day': 'Wednesday',
        'start': '08:00',
        'finish': '20:00',
        'code': 3,
        'open': true
      });
      this.insert({
        'day': 'Thursday',
        'start': '08:00',
        'finish': '20:00',
        'code': 4,
        'open': true
      });
      this.insert({
        'day': 'Friday',
        'start': '08:00',
        'finish': '20:00',
        'code': 5,
        'open': true
      });
      this.insert({
        'day': 'Saturday',
        'start': '08:00',
        'finish': '20:00',
        'code': 6,
        'open': false
      });
      this.insert({
        'day': 'Sunday',
        'start': '08:00',
        'finish': '20:00',
        'code': 0,
        'open': false
      });
    }
  }
  /*
   * update the given days start and finish times and whether the office is open on that day
   */


  updateHours(day, newStart, newFinish, newOpen) {
    this.update({
      day
    }, {
      $set: {
        start: newStart,
        finish: newFinish,
        open: newOpen
      }
    });
  }
  /*
   * Check if the current server time (utc) is within the office hours of that day
   * returns true or false
   */


  isNowWithinHours() {
    // get current time on server in utc
    // var ct = moment().utc();
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm'); // console.log(finish.isBefore(start));

    if (finish.isBefore(start)) {
      // finish.day(finish.day()+1);
      finish.add(1, 'days');
    }

    const result = currentTime.isBetween(start, finish); // inBetween  check

    return result;
  }

  isOpeningTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    } // check if offices are open today


    if (todaysOfficeHours.open === false) {
      return false;
    }

    const start = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.start}`, 'dddd:HH:mm');
    return start.isSame(currentTime, 'minute');
  }

  isClosingTime() {
    // get current time on server in utc
    const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm'); // get todays office hours from db

    const todaysOfficeHours = this.findOne({
      day: currentTime.format('dddd')
    });

    if (!todaysOfficeHours) {
      return false;
    }

    const finish = moment.utc(`${todaysOfficeHours.day}:${todaysOfficeHours.finish}`, 'dddd:HH:mm');
    return finish.isSame(currentTime, 'minute');
  }

}

RocketChat.models.LivechatOfficeHour = new LivechatOfficeHour();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"LivechatVisitors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/models/LivechatVisitors.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

class LivechatVisitors extends RocketChat.models._Base {
  constructor() {
    super('livechat_visitor');
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  getVisitorByToken(token, options) {
    const query = {
      token
    };
    return this.findOne(query, options);
  }
  /**
   * Find visitors by _id
   * @param {string} token - Visitor token
   */


  findById(_id, options) {
    const query = {
      _id
    };
    return this.find(query, options);
  }
  /**
   * Gets visitor by token
   * @param {string} token - Visitor token
   */


  findVisitorByToken(token) {
    const query = {
      token
    };
    return this.find(query);
  }

  updateLivechatDataByToken(token, key, value, overwrite = true) {
    const query = {
      token
    };

    if (!overwrite) {
      const user = this.findOne(query, {
        fields: {
          livechatData: 1
        }
      });

      if (user.livechatData && typeof user.livechatData[key] !== 'undefined') {
        return true;
      }
    }

    const update = {
      $set: {
        [`livechatData.${key}`]: value
      }
    };
    return this.update(query, update);
  }
  /**
   * Find a visitor by their phone number
   * @return {object} User from db
   */


  findOneVisitorByPhone(phone) {
    const query = {
      'phone.phoneNumber': phone
    };
    return this.findOne(query);
  }
  /**
   * Get the next visitor name
   * @return {string} The next visitor name
   */


  getNextVisitorUsername() {
    const settingsRaw = RocketChat.models.Settings.model.rawCollection();
    const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);
    const query = {
      _id: 'Livechat_guest_count'
    };
    const update = {
      $inc: {
        value: 1
      }
    };
    const livechatCount = findAndModify(query, null, update);
    return `guest-${livechatCount.value.value + 1}`;
  }

  updateById(_id, update) {
    return this.update({
      _id
    }, update);
  }

  saveGuestById(_id, data) {
    const setData = {};
    const unsetData = {};

    if (data.name) {
      if (!_.isEmpty(s.trim(data.name))) {
        setData.name = s.trim(data.name);
      } else {
        unsetData.name = 1;
      }
    }

    if (data.email) {
      if (!_.isEmpty(s.trim(data.email))) {
        setData.visitorEmails = [{
          address: s.trim(data.email)
        }];
      } else {
        unsetData.visitorEmails = 1;
      }
    }

    if (data.phone) {
      if (!_.isEmpty(s.trim(data.phone))) {
        setData.phone = [{
          phoneNumber: s.trim(data.phone)
        }];
      } else {
        unsetData.phone = 1;
      }
    }

    const update = {};

    if (!_.isEmpty(setData)) {
      update.$set = setData;
    }

    if (!_.isEmpty(unsetData)) {
      update.$unset = unsetData;
    }

    if (_.isEmpty(update)) {
      return true;
    }

    return this.update({
      _id
    }, update);
  }

  findOneGuestByEmailAddress(emailAddress) {
    const query = {
      'visitorEmails.address': new RegExp(`^${s.escapeRegExp(emailAddress)}$`, 'i')
    };
    return this.findOne(query);
  }

  saveGuestEmailPhoneById(_id, emails, phones) {
    const update = {
      $addToSet: {}
    };
    const saveEmail = [].concat(emails).filter(email => email && email.trim()).map(email => {
      return {
        address: email
      };
    });

    if (saveEmail.length > 0) {
      update.$addToSet.visitorEmails = {
        $each: saveEmail
      };
    }

    const savePhone = [].concat(phones).filter(phone => phone && phone.trim().replace(/[^\d]/g, '')).map(phone => {
      return {
        phoneNumber: phone
      };
    });

    if (savePhone.length > 0) {
      update.$addToSet.phone = {
        $each: savePhone
      };
    }

    if (!update.$addToSet.visitorEmails && !update.$addToSet.phone) {
      return;
    }

    return this.update({
      _id
    }, update);
  }

}

module.exportDefault(new LivechatVisitors());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"Livechat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/Livechat.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
let UAParser;
module.watch(require("ua-parser-js"), {
  default(v) {
    UAParser = v;
  }

}, 2);
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 3);
RocketChat.Livechat = {
  historyMonitorType: 'url',
  logger: new Logger('Livechat', {
    sections: {
      webhook: 'Webhook'
    }
  }),

  getNextAgent(department) {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'External') {
      for (let i = 0; i < 10; i++) {
        try {
          const queryString = department ? `?departmentId=${department}` : '';
          const result = HTTP.call('GET', `${RocketChat.settings.get('Livechat_External_Queue_URL')}${queryString}`, {
            headers: {
              'User-Agent': 'RocketChat Server',
              'Accept': 'application/json',
              'X-RocketChat-Secret-Token': RocketChat.settings.get('Livechat_External_Queue_Token')
            }
          });

          if (result && result.data && result.data.username) {
            const agent = RocketChat.models.Users.findOneOnlineAgentByUsername(result.data.username);

            if (agent) {
              return {
                agentId: agent._id,
                username: agent.username
              };
            }
          }
        } catch (e) {
          console.error('Error requesting agent from external queue.', e);
          break;
        }
      }

      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    } else if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getNextAgentForDepartment(department);
    }

    return RocketChat.models.Users.getNextAgent();
  },

  getAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.findByDepartmentId(department);
    } else {
      return RocketChat.models.Users.findAgents();
    }
  },

  getOnlineAgents(department) {
    if (department) {
      return RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(department);
    } else {
      return RocketChat.models.Users.findOnlineAgents();
    }
  },

  getRequiredDepartment(onlineRequired = true) {
    const departments = RocketChat.models.LivechatDepartment.findEnabledWithAgents();
    return departments.fetch().find(dept => {
      if (!dept.showOnRegistration) {
        return false;
      }

      if (!onlineRequired) {
        return true;
      }

      const onlineAgents = RocketChat.models.LivechatDepartmentAgents.getOnlineForDepartment(dept._id);
      return onlineAgents.count() > 0;
    });
  },

  getRoom(guest, message, roomInfo, agent) {
    let room = RocketChat.models.Rooms.findOneById(message.rid);
    let newRoom = false;

    if (room && !room.open) {
      message.rid = Random.id();
      room = null;
    }

    if (room == null) {
      // if no department selected verify if there is at least one active and pick the first
      if (!agent && !guest.department) {
        const department = this.getRequiredDepartment();

        if (department) {
          guest.department = department._id;
        }
      } // delegate room creation to QueueMethods


      const routingMethod = RocketChat.settings.get('Livechat_Routing_Method');
      room = RocketChat.QueueMethods[routingMethod](guest, message, roomInfo, agent);
      newRoom = true;
    }

    if (!room || room.v.token !== guest.token) {
      throw new Meteor.Error('cannot-access-room');
    }

    return {
      room,
      newRoom
    };
  },

  sendMessage({
    guest,
    message,
    roomInfo,
    agent
  }) {
    const {
      room,
      newRoom
    } = this.getRoom(guest, message, roomInfo, agent);

    if (guest.name) {
      message.alias = guest.name;
    } // return messages;


    return _.extend(RocketChat.sendMessage(guest, message, room), {
      newRoom,
      showConnecting: this.showConnecting()
    });
  },

  registerGuest({
    token,
    name,
    email,
    department,
    phone,
    username
  } = {}) {
    check(token, String);
    let userId;
    const updateUser = {
      $set: {
        token
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      userId = user._id;
    } else {
      if (!username) {
        username = LivechatVisitors.getNextVisitorUsername();
      }

      let existingUser = null;

      if (s.trim(email) !== '' && (existingUser = LivechatVisitors.findOneGuestByEmailAddress(email))) {
        userId = existingUser._id;
      } else {
        const userData = {
          username,
          department
        };

        if (this.connection) {
          userData.userAgent = this.connection.httpHeaders['user-agent'];
          userData.ip = this.connection.httpHeaders['x-real-ip'] || this.connection.httpHeaders['x-forwarded-for'] || this.connection.clientAddress;
          userData.host = this.connection.httpHeaders.host;
        }

        userId = LivechatVisitors.insert(userData);
      }
    }

    if (phone) {
      updateUser.$set.phone = [{
        phoneNumber: phone.number
      }];
    }

    if (email && email.trim() !== '') {
      updateUser.$set.visitorEmails = [{
        address: email
      }];
    }

    if (name) {
      updateUser.$set.name = name;
    }

    LivechatVisitors.updateById(userId, updateUser);
    return userId;
  },

  setDepartmentForGuest({
    token,
    department
  } = {}) {
    check(token, String);
    const updateUser = {
      $set: {
        department
      }
    };
    const user = LivechatVisitors.getVisitorByToken(token, {
      fields: {
        _id: 1
      }
    });

    if (user) {
      return Meteor.users.update(user._id, updateUser);
    }

    return false;
  },

  saveGuest({
    _id,
    name,
    email,
    phone
  }) {
    const updateData = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (phone) {
      updateData.phone = phone;
    }

    const ret = LivechatVisitors.saveGuestById(_id, updateData);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveGuest', updateData);
    });
    return ret;
  },

  closeRoom({
    user,
    visitor,
    room,
    comment
  }) {
    const now = new Date();
    const closeData = {
      closedAt: now,
      chatDuration: (now.getTime() - room.ts) / 1000
    };

    if (user) {
      closeData.closer = 'user';
      closeData.closedBy = {
        _id: user._id,
        username: user.username
      };
    } else if (visitor) {
      closeData.closer = 'visitor';
      closeData.closedBy = {
        _id: visitor._id,
        username: visitor.username
      };
    }

    RocketChat.models.Rooms.closeByRoomId(room._id, closeData);
    RocketChat.models.LivechatInquiry.closeByRoomId(room._id, closeData);
    const message = {
      t: 'livechat-close',
      msg: comment,
      groupable: false
    };
    RocketChat.sendMessage(user, message, room);

    if (room.servedBy) {
      RocketChat.models.Subscriptions.hideByRoomIdAndUserId(room._id, room.servedBy._id);
    }

    RocketChat.models.Messages.createCommandWithRoomIdAndUser('promptTranscript', room._id, closeData.closedBy);
    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.closeRoom', room);
    });
    return true;
  },

  getInitSettings() {
    const settings = {};
    RocketChat.models.Settings.findNotHiddenPublic(['Livechat_title', 'Livechat_title_color', 'Livechat_enabled', 'Livechat_registration_form', 'Livechat_allow_switching_departments', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_form_unavailable', 'Livechat_display_offline_form', 'Livechat_videocall_enabled', 'Jitsi_Enabled', 'Language', 'Livechat_enable_transcript', 'Livechat_transcript_message']).forEach(setting => {
      settings[setting._id] = setting.value;
    });
    return settings;
  },

  saveRoomInfo(roomData, guestData) {
    if ((roomData.topic != null || roomData.tags != null) && !RocketChat.models.Rooms.setTopicAndTagsById(roomData._id, roomData.topic, roomData.tags)) {
      return false;
    }

    Meteor.defer(() => {
      RocketChat.callbacks.run('livechat.saveRoom', roomData);
    });

    if (!_.isEmpty(guestData.name)) {
      return RocketChat.models.Rooms.setLabelByRoomId(roomData._id, guestData.name) && RocketChat.models.Subscriptions.updateNameByRoomId(roomData._id, guestData.name);
    }
  },

  closeOpenChats(userId, comment) {
    const user = RocketChat.models.Users.findOneById(userId);
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      this.closeRoom({
        user,
        room,
        comment
      });
    });
  },

  forwardOpenChats(userId) {
    RocketChat.models.Rooms.findOpenByAgent(userId).forEach(room => {
      const guest = RocketChat.models.Users.findOneById(room.v._id);
      this.transfer(room, guest, {
        departmentId: guest.department
      });
    });
  },

  savePageHistory(token, pageInfo) {
    if (pageInfo.change === RocketChat.Livechat.historyMonitorType) {
      return RocketChat.models.LivechatPageVisited.saveByToken(token, pageInfo);
    }

    return;
  },

  transfer(room, guest, transferData) {
    let agent;

    if (transferData.userId) {
      const user = RocketChat.models.Users.findOneById(transferData.userId);
      agent = {
        agentId: user._id,
        username: user.username
      };
    } else {
      agent = RocketChat.Livechat.getNextAgent(transferData.departmentId);
    }

    const servedBy = room.servedBy;

    if (agent && agent.agentId !== servedBy._id) {
      room.usernames = _.without(room.usernames, servedBy.username).concat(agent.username);
      RocketChat.models.Rooms.changeAgentByRoomId(room._id, agent);
      const subscriptionData = {
        rid: room._id,
        name: guest.name || guest.username,
        alert: true,
        open: true,
        unread: 1,
        userMentions: 1,
        groupMentions: 0,
        code: room.code,
        u: {
          _id: agent.agentId,
          username: agent.username
        },
        t: 'l',
        desktopNotifications: 'all',
        mobilePushNotifications: 'all',
        emailNotifications: 'all'
      };
      RocketChat.models.Subscriptions.removeByRoomIdAndUserId(room._id, servedBy._id);
      RocketChat.models.Subscriptions.insert(subscriptionData);
      RocketChat.models.Messages.createUserLeaveWithRoomIdAndUser(room._id, {
        _id: servedBy._id,
        username: servedBy.username
      });
      RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(room._id, {
        _id: agent.agentId,
        username: agent.username
      });
      RocketChat.Livechat.stream.emit(room._id, {
        type: 'agentData',
        data: RocketChat.models.Users.getAgentInfo(agent.agentId)
      });
      return true;
    }

    return false;
  },

  sendRequest(postData, callback, trying = 1) {
    try {
      const options = {
        headers: {
          'X-RocketChat-Livechat-Token': RocketChat.settings.get('Livechat_secret_token')
        },
        data: postData
      };
      return HTTP.post(RocketChat.settings.get('Livechat_webhookUrl'), options);
    } catch (e) {
      RocketChat.Livechat.logger.webhook.error(`Response error on ${trying} try ->`, e); // try 10 times after 10 seconds each

      if (trying < 10) {
        RocketChat.Livechat.logger.webhook.warn('Will try again in 10 seconds ...');
        trying++;
        setTimeout(Meteor.bindEnvironment(() => {
          RocketChat.Livechat.sendRequest(postData, callback, trying);
        }), 10000);
      }
    }
  },

  getLivechatRoomGuestInfo(room) {
    const visitor = LivechatVisitors.findOneById(room.v._id);
    const agent = RocketChat.models.Users.findOneById(room.servedBy && room.servedBy._id);
    const ua = new UAParser();
    ua.setUA(visitor.userAgent);
    const postData = {
      _id: room._id,
      label: room.label,
      topic: room.topic,
      code: room.code,
      createdAt: room.ts,
      lastMessageAt: room.lm,
      tags: room.tags,
      customFields: room.livechatData,
      visitor: {
        _id: visitor._id,
        name: visitor.name,
        username: visitor.username,
        email: null,
        phone: null,
        department: visitor.department,
        ip: visitor.ip,
        os: ua.getOS().name && `${ua.getOS().name} ${ua.getOS().version}`,
        browser: ua.getBrowser().name && `${ua.getBrowser().name} ${ua.getBrowser().version}`,
        customFields: visitor.livechatData
      }
    };

    if (agent) {
      postData.agent = {
        _id: agent._id,
        username: agent.username,
        name: agent.name,
        email: null
      };

      if (agent.emails && agent.emails.length > 0) {
        postData.agent.email = agent.emails[0].address;
      }
    }

    if (room.crmData) {
      postData.crmData = room.crmData;
    }

    if (visitor.visitorEmails && visitor.visitorEmails.length > 0) {
      postData.visitor.email = visitor.visitorEmails;
    }

    if (visitor.phone && visitor.phone.length > 0) {
      postData.visitor.phone = visitor.phone;
    }

    return postData;
  },

  addAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addAgent'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, true);
      RocketChat.models.Users.setLivechatStatus(user._id, 'available');
      return user;
    }

    return false;
  },

  addManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1,
        username: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:addManager'
      });
    }

    if (RocketChat.authz.addUserRoles(user._id, 'livechat-manager')) {
      return user;
    }

    return false;
  },

  removeAgent(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeAgent'
      });
    }

    if (RocketChat.authz.removeUserFromRoles(user._id, 'livechat-agent')) {
      RocketChat.models.Users.setOperator(user._id, false);
      RocketChat.models.Users.setLivechatStatus(user._id, 'not-available');
      return true;
    }

    return false;
  },

  removeManager(username) {
    check(username, String);
    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'livechat:removeManager'
      });
    }

    return RocketChat.authz.removeUserFromRoles(user._id, 'livechat-manager');
  },

  saveDepartment(_id, departmentData, departmentAgents) {
    check(_id, Match.Maybe(String));
    check(departmentData, {
      enabled: Boolean,
      name: String,
      description: Match.Optional(String),
      showOnRegistration: Boolean
    });
    check(departmentAgents, [Match.ObjectIncluding({
      agentId: String,
      username: String
    })]);

    if (_id) {
      const department = RocketChat.models.LivechatDepartment.findOneById(_id);

      if (!department) {
        throw new Meteor.Error('error-department-not-found', 'Department not found', {
          method: 'livechat:saveDepartment'
        });
      }
    }

    return RocketChat.models.LivechatDepartment.createOrUpdateDepartment(_id, departmentData, departmentAgents);
  },

  removeDepartment(_id) {
    check(_id, String);
    const department = RocketChat.models.LivechatDepartment.findOneById(_id, {
      fields: {
        _id: 1
      }
    });

    if (!department) {
      throw new Meteor.Error('department-not-found', 'Department not found', {
        method: 'livechat:removeDepartment'
      });
    }

    return RocketChat.models.LivechatDepartment.removeById(_id);
  },

  showConnecting() {
    if (RocketChat.settings.get('Livechat_Routing_Method') === 'Guest_Pool') {
      return RocketChat.settings.get('Livechat_open_inquiery_show_connecting');
    } else {
      return false;
    }
  }

};
RocketChat.Livechat.stream = new Meteor.Streamer('livechat-room');
RocketChat.Livechat.stream.allowRead((roomId, extraData) => {
  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (!room) {
    console.warn(`Invalid eventName: "${roomId}"`);
    return false;
  }

  if (room.t === 'l' && extraData && extraData.token && room.v.token === extraData.token) {
    return true;
  }

  return false;
});
RocketChat.settings.get('Livechat_history_monitor_type', (key, value) => {
  RocketChat.Livechat.historyMonitorType = value;
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"QueueMethods.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/QueueMethods.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.QueueMethods = {
  /* Least Amount Queuing method:
   *
   * default method where the agent with the least number
   * of open chats is paired with the incoming livechat
   */
  'Least_Amount'(guest, message, roomInfo, agent) {
    if (!agent) {
      agent = RocketChat.Livechat.getNextAgent(guest.department);

      if (!agent) {
        throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
      }
    }

    const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      code: roomCode,
      label: guest.name || guest.username,
      // usernames: [agent.username, guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      servedBy: {
        _id: agent.agentId,
        username: agent.username
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    const subscriptionData = {
      rid: message.rid,
      name: guest.name || guest.username,
      alert: true,
      open: true,
      unread: 1,
      userMentions: 1,
      groupMentions: 0,
      code: roomCode,
      u: {
        _id: agent.agentId,
        username: agent.username
      },
      t: 'l',
      desktopNotifications: 'all',
      mobilePushNotifications: 'all',
      emailNotifications: 'all'
    };
    RocketChat.models.Rooms.insert(room);
    RocketChat.models.Subscriptions.insert(subscriptionData);
    RocketChat.Livechat.stream.emit(room._id, {
      type: 'agentData',
      data: RocketChat.models.Users.getAgentInfo(agent.agentId)
    });
    return room;
  },

  /* Guest Pool Queuing Method:
   *
   * An incomming livechat is created as an Inquiry
   * which is picked up from an agent.
   * An Inquiry is visible to all agents (TODO: in the correct department)
      *
   * A room is still created with the initial message, but it is occupied by
   * only the client until paired with an agent
   */
  'Guest_Pool'(guest, message, roomInfo) {
    let agents = RocketChat.Livechat.getOnlineAgents(guest.department);

    if (agents.count() === 0 && RocketChat.settings.get('Livechat_guest_pool_with_no_agents')) {
      agents = RocketChat.Livechat.getAgents(guest.department);
    }

    if (agents.count() === 0) {
      throw new Meteor.Error('no-agent-online', 'Sorry, no online agents');
    }

    const roomCode = RocketChat.models.Rooms.getNextLivechatRoomCode();
    const agentIds = [];
    agents.forEach(agent => {
      if (guest.department) {
        agentIds.push(agent.agentId);
      } else {
        agentIds.push(agent._id);
      }
    });
    const inquiry = {
      rid: message.rid,
      message: message.msg,
      name: guest.name || guest.username,
      ts: new Date(),
      code: roomCode,
      department: guest.department,
      agents: agentIds,
      status: 'open',
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status || 'online'
      },
      t: 'l'
    };

    const room = _.extend({
      _id: message.rid,
      msgs: 1,
      lm: new Date(),
      code: roomCode,
      label: guest.name || guest.username,
      // usernames: [guest.username],
      t: 'l',
      ts: new Date(),
      v: {
        _id: guest._id,
        username: guest.username,
        token: message.token,
        status: guest.status
      },
      cl: false,
      open: true,
      waitingResponse: true
    }, roomInfo);

    RocketChat.models.LivechatInquiry.insert(inquiry);
    RocketChat.models.Rooms.insert(room);
    return room;
  },

  'External'(guest, message, roomInfo, agent) {
    return this['Least_Amount'](guest, message, roomInfo, agent); // eslint-disable-line
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OfficeClock.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OfficeClock.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// Every minute check if office closed
Meteor.setInterval(function () {
  if (RocketChat.settings.get('Livechat_enable_office_hours')) {
    if (RocketChat.models.LivechatOfficeHour.isOpeningTime()) {
      RocketChat.models.Users.openOffice();
    } else if (RocketChat.models.LivechatOfficeHour.isClosingTime()) {
      RocketChat.models.Users.closeOffice();
    }
  }
}, 60000);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OmniChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/lib/OmniChannel.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const gatewayURL = 'https://omni.rocket.chat';
module.exportDefault({
  enable() {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      },
      data: {
        url: RocketChat.settings.get('Site_Url')
      }
    });
    return result.data;
  },

  disable() {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/enable`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`,
        'content-type': 'application/json'
      }
    });
    return result.data;
  },

  listPages() {
    const result = HTTP.call('GET', `${gatewayURL}/facebook/pages`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  subscribe(pageId) {
    const result = HTTP.call('POST', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  unsubscribe(pageId) {
    const result = HTTP.call('DELETE', `${gatewayURL}/facebook/page/${pageId}/subscribe`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      }
    });
    return result.data;
  },

  reply({
    page,
    token,
    text
  }) {
    return HTTP.call('POST', `${gatewayURL}/facebook/reply`, {
      headers: {
        'authorization': `Bearer ${RocketChat.settings.get('Livechat_Facebook_API_Key')}`
      },
      data: {
        page,
        token,
        text
      }
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"sendMessageBySMS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/sendMessageBySMS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("./models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.callbacks.add('afterSaveMessage', function (message, room) {
  // skips this callback if the message was edited
  if (message.editedAt) {
    return message;
  }

  if (!RocketChat.SMS.enabled) {
    return message;
  } // only send the sms by SMS if it is a livechat room with SMS set to true


  if (!(typeof room.t !== 'undefined' && room.t === 'l' && room.sms && room.v && room.v.token)) {
    return message;
  } // if the message has a token, it was sent from the visitor, so ignore it


  if (message.token) {
    return message;
  } // if the message has a type means it is a special message (like the closing comment), so skips


  if (message.t) {
    return message;
  }

  const SMSService = RocketChat.SMS.getService(RocketChat.settings.get('SMS_Service'));

  if (!SMSService) {
    return message;
  }

  const visitor = LivechatVisitors.getVisitorByToken(room.v.token);

  if (!visitor || !visitor.phone || visitor.phone.length === 0) {
    return message;
  }

  SMSService.send(room.sms.from, visitor.phone[0].phoneNumber, message.msg);
  return message;
}, RocketChat.callbacks.priority.LOW, 'sendMessageBySms');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unclosedLivechats.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/unclosedLivechats.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UserPresenceMonitor */
let agentsHandler;
let monitorAgents = false;
let actionTimeout = 60000;
const onlineAgents = {
  users: {},
  queue: {},

  add(userId) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
      delete this.queue[userId];
    }

    this.users[userId] = 1;
  },

  remove(userId, callback) {
    if (this.queue[userId]) {
      clearTimeout(this.queue[userId]);
    }

    this.queue[userId] = setTimeout(Meteor.bindEnvironment(() => {
      callback();
      delete this.users[userId];
      delete this.queue[userId];
    }), actionTimeout);
  },

  exists(userId) {
    return !!this.users[userId];
  }

};

function runAgentLeaveAction(userId) {
  const action = RocketChat.settings.get('Livechat_agent_leave_action');

  if (action === 'close') {
    return RocketChat.Livechat.closeOpenChats(userId, RocketChat.settings.get('Livechat_agent_leave_comment'));
  } else if (action === 'forward') {
    return RocketChat.Livechat.forwardOpenChats(userId);
  }
}

RocketChat.settings.get('Livechat_agent_leave_action_timeout', function (key, value) {
  actionTimeout = value * 1000;
});
RocketChat.settings.get('Livechat_agent_leave_action', function (key, value) {
  monitorAgents = value;

  if (value !== 'none') {
    if (!agentsHandler) {
      agentsHandler = RocketChat.models.Users.findOnlineAgents().observeChanges({
        added(id) {
          onlineAgents.add(id);
        },

        changed(id, fields) {
          if (fields.statusLivechat && fields.statusLivechat === 'not-available') {
            onlineAgents.remove(id, () => {
              runAgentLeaveAction(id);
            });
          } else {
            onlineAgents.add(id);
          }
        },

        removed(id) {
          onlineAgents.remove(id, () => {
            runAgentLeaveAction(id);
          });
        }

      });
    }
  } else if (agentsHandler) {
    agentsHandler.stop();
    agentsHandler = null;
  }
});
UserPresenceMonitor.onSetUserStatus((user, status
/*, statusConnection*/
) => {
  if (!monitorAgents) {
    return;
  }

  if (onlineAgents.exists(user._id)) {
    if (status === 'offline' || user.statusLivechat === 'not-available') {
      onlineAgents.remove(user._id, () => {
        runAgentLeaveAction(user._id);
      });
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"publications":{"customFields.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/customFields.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('livechat:customFields', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:customFields'
    }));
  }

  if (s.trim(_id)) {
    return RocketChat.models.LivechatCustomField.find({
      _id
    });
  }

  return RocketChat.models.LivechatCustomField.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"departmentAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/departmentAgents.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departmentAgents', function (departmentId) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:departmentAgents'
    }));
  }

  return RocketChat.models.LivechatDepartmentAgents.find({
    departmentId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"externalMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/externalMessages.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:externalMessages', function (roomId) {
  return RocketChat.models.LivechatExternalMessage.findByRoomId(roomId);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAgents.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAgents.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:agents', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-agent').observeChanges({
    added(id, fields) {
      self.added('agentUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('agentUsers', id, fields);
    },

    removed(id) {
      self.removed('agentUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatAppearance.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatAppearance.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:appearance', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:appearance'
    }));
  }

  const query = {
    _id: {
      $in: ['Livechat_title', 'Livechat_title_color', 'Livechat_show_agent_email', 'Livechat_display_offline_form', 'Livechat_offline_form_unavailable', 'Livechat_offline_message', 'Livechat_offline_success_message', 'Livechat_offline_title', 'Livechat_offline_title_color', 'Livechat_offline_email']
    }
  };
  const self = this;
  const handle = RocketChat.models.Settings.find(query).observeChanges({
    added(id, fields) {
      self.added('livechatAppearance', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatAppearance', id, fields);
    },

    removed(id) {
      self.removed('livechatAppearance', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatDepartments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatDepartments.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:departments', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatDepartment.findByDepartmentId(_id);
  } else {
    return RocketChat.models.LivechatDepartment.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatIntegration.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatIntegration.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:integration', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:integration'
    }));
  }

  const self = this;
  const handle = RocketChat.models.Settings.findByIds(['Livechat_webhookUrl', 'Livechat_secret_token', 'Livechat_webhook_on_close', 'Livechat_webhook_on_offline_msg']).observeChanges({
    added(id, fields) {
      self.added('livechatIntegration', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatIntegration', id, fields);
    },

    removed(id) {
      self.removed('livechatIntegration', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatManagers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatManagers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:managers', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:managers'
    }));
  }

  const self = this;
  const handle = RocketChat.authz.getUsersInRole('livechat-manager').observeChanges({
    added(id, fields) {
      self.added('managerUsers', id, fields);
    },

    changed(id, fields) {
      self.changed('managerUsers', id, fields);
    },

    removed(id) {
      self.removed('managerUsers', id);
    }

  });
  self.ready();
  self.onStop(function () {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatRooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatRooms.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:rooms', function (filter = {}, offset = 0, limit = 20) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:rooms'
    }));
  }

  check(filter, {
    name: Match.Maybe(String),
    // room name to filter
    agent: Match.Maybe(String),
    // agent _id who is serving
    status: Match.Maybe(String),
    // either 'opened' or 'closed'
    from: Match.Maybe(Date),
    to: Match.Maybe(Date)
  });
  const query = {};

  if (filter.name) {
    query.label = new RegExp(filter.name, 'i');
  }

  if (filter.agent) {
    query['servedBy._id'] = filter.agent;
  }

  if (filter.status) {
    if (filter.status === 'opened') {
      query.open = true;
    } else {
      query.open = {
        $exists: false
      };
    }
  }

  if (filter.from) {
    query.ts = {
      $gte: filter.from
    };
  }

  if (filter.to) {
    filter.to.setDate(filter.to.getDate() + 1);
    filter.to.setSeconds(filter.to.getSeconds() - 1);

    if (!query.ts) {
      query.ts = {};
    }

    query.ts.$lte = filter.to;
  }

  const self = this;
  const handle = RocketChat.models.Rooms.findLivechat(query, offset, limit).observeChanges({
    added(id, fields) {
      self.added('livechatRoom', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatRoom', id, fields);
    },

    removed(id) {
      self.removed('livechatRoom', id);
    }

  });
  this.ready();
  this.onStop(() => {
    handle.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatQueue.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatQueue.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:queue', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:queue'
    }));
  } // let sort = { count: 1, sort: 1, username: 1 };
  // let onlineUsers = {};
  // let handleUsers = RocketChat.models.Users.findOnlineAgents().observeChanges({
  // 	added(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.added('livechatQueueUser', id, fields);
  // 	},
  // 	changed(id, fields) {
  // 		onlineUsers[fields.username] = 1;
  // 		// this.changed('livechatQueueUser', id, fields);
  // 	},
  // 	removed(id) {
  // 		this.removed('livechatQueueUser', id);
  // 	}
  // });


  const self = this;
  const handleDepts = RocketChat.models.LivechatDepartmentAgents.findUsersInQueue().observeChanges({
    added(id, fields) {
      self.added('livechatQueueUser', id, fields);
    },

    changed(id, fields) {
      self.changed('livechatQueueUser', id, fields);
    },

    removed(id) {
      self.removed('livechatQueueUser', id);
    }

  });
  this.ready();
  this.onStop(() => {
    // handleUsers.stop();
    handleDepts.stop();
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatTriggers.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatTriggers.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:triggers', function (_id) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:triggers'
    }));
  }

  if (_id !== undefined) {
    return RocketChat.models.LivechatTrigger.findById(_id);
  } else {
    return RocketChat.models.LivechatTrigger.find();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorHistory.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorHistory.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorHistory', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);
  const user = RocketChat.models.Users.findOneById(this.userId);

  if (room.usernames.indexOf(user.username) === -1) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorHistory'
    }));
  }

  if (room && room.v && room.v._id) {
    // CACHE: can we stop using publications here?
    return RocketChat.models.Rooms.findByVisitorId(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorInfo.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorInfo.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
Meteor.publish('livechat:visitorInfo', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorInfo'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v._id) {
    return LivechatVisitors.findById(room.v._id);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"visitorPageVisited.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/visitorPageVisited.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:visitorPageVisited', function ({
  rid: roomId
}) {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:visitorPageVisited'
    }));
  }

  const room = RocketChat.models.Rooms.findOneById(roomId);

  if (room && room.v && room.v.token) {
    return RocketChat.models.LivechatPageVisited.findByToken(room.v.token);
  } else {
    return this.ready();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatInquiries.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatInquiries.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:inquiry', function () {
  if (!this.userId) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:inquiry'
    }));
  }

  const query = {
    agents: this.userId,
    status: 'open'
  };
  return RocketChat.models.LivechatInquiry.find(query);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"livechatOfficeHours.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/publications/livechatOfficeHours.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.publish('livechat:officeHour', function () {
  if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
    return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {
      publish: 'livechat:agents'
    }));
  }

  return RocketChat.models.LivechatOfficeHour.find();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/server/api.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("../imports/server/rest/departments.js"));
module.watch(require("../imports/server/rest/facebook.js"));
module.watch(require("../imports/server/rest/sms.js"));
module.watch(require("../imports/server/rest/users.js"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"permissions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/permissions.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(() => {
  const roles = _.pluck(RocketChat.models.Roles.find().fetch(), 'name');

  if (roles.indexOf('livechat-agent') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-agent');
  }

  if (roles.indexOf('livechat-manager') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-manager');
  }

  if (roles.indexOf('livechat-guest') === -1) {
    RocketChat.models.Roles.createOrUpdate('livechat-guest');
  }

  if (RocketChat.models && RocketChat.models.Permissions) {
    RocketChat.models.Permissions.createOrUpdate('view-l-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-manager', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('view-livechat-rooms', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-livechat-room', ['livechat-agent', 'livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('close-others-livechat-room', ['livechat-manager', 'admin']);
    RocketChat.models.Permissions.createOrUpdate('save-others-livechat-room-info', ['livechat-manager']);
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messageTypes.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/messageTypes.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.MessageTypes.registerType({
  id: 'livechat_video_call',
  system: true,
  message: 'New_videocall_request'
});
RocketChat.actionLinks.register('createLivechatCall', function (message, params, instance) {
  if (Meteor.isClient) {
    instance.tabBar.open('video');
  }
});
RocketChat.actionLinks.register('denyLivechatCall', function (message
/*, params*/
) {
  if (Meteor.isServer) {
    const user = Meteor.user();
    RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser('command', message.rid, 'endCall', user);
    RocketChat.Notifications.notifyRoom(message.rid, 'deleteMessage', {
      _id: message._id
    });
    const language = user.language || RocketChat.settings.get('language') || 'en';
    RocketChat.Livechat.closeRoom({
      user,
      room: RocketChat.models.Rooms.findOneById(message.rid),
      comment: TAPi18n.__('Videocall_declined', {
        lng: language
      })
    });
    Meteor.defer(() => {
      RocketChat.models.Messages.setHiddenById(message._id);
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roomType.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/roomType.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let RoomSettingsEnum, RoomTypeConfig, RoomTypeRouteConfig, UiTextContext;
module.watch(require("meteor/rocketchat:lib"), {
  RoomSettingsEnum(v) {
    RoomSettingsEnum = v;
  },

  RoomTypeConfig(v) {
    RoomTypeConfig = v;
  },

  RoomTypeRouteConfig(v) {
    RoomTypeRouteConfig = v;
  },

  UiTextContext(v) {
    UiTextContext = v;
  }

}, 0);

class LivechatRoomRoute extends RoomTypeRouteConfig {
  constructor() {
    super({
      name: 'live',
      path: '/live/:code(\\d+)'
    });
  }

  action(params) {
    openRoom('l', params.code);
  }

  link(sub) {
    return {
      code: sub.code
    };
  }

}

class LivechatRoomType extends RoomTypeConfig {
  constructor() {
    super({
      identifier: 'l',
      order: 5,
      // icon: 'livechat',
      label: 'Livechat',
      route: new LivechatRoomRoute()
    });
    this.notSubscribedTpl = {
      template: 'livechatNotSubscribed'
    };
  }

  findRoom(identifier) {
    return ChatRoom.findOne({
      code: parseInt(identifier)
    });
  }

  roomName(roomData) {
    if (!roomData.name) {
      return roomData.label;
    } else {
      return roomData.name;
    }
  }

  condition() {
    return RocketChat.settings.get('Livechat_enabled') && RocketChat.authz.hasAllPermission('view-l-room');
  }

  canSendMessage(roomId) {
    const room = ChatRoom.findOne({
      _id: roomId
    }, {
      fields: {
        open: 1
      }
    });
    return room && room.open === true;
  }

  getUserStatus(roomId) {
    const room = Session.get(`roomData${roomId}`);

    if (room) {
      return room.v && room.v.status;
    }

    const inquiry = LivechatInquiry.findOne({
      rid: roomId
    });
    return inquiry && inquiry.v && inquiry.v.status;
  }

  allowRoomSettingChange(room, setting) {
    switch (setting) {
      case RoomSettingsEnum.JOIN_CODE:
        return false;

      default:
        return true;
    }
  }

  getUiText(context) {
    switch (context) {
      case UiTextContext.HIDE_WARNING:
        return 'Hide_Livechat_Warning';

      case UiTextContext.LEAVE_WARNING:
        return 'Hide_Livechat_Warning';

      default:
        return '';
    }
  }

}

RocketChat.roomTypes.add(new LivechatRoomType());
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"config.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/config.js                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.settings.addGroup('Livechat');
  RocketChat.settings.add('Livechat_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title', 'Rocket.Chat', {
    type: 'string',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_title_color', '#C1272D', {
    type: 'color',
    group: 'Livechat',
    public: true
  });
  RocketChat.settings.add('Livechat_display_offline_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Display_offline_form'
  });
  RocketChat.settings.add('Livechat_validate_offline_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Validate_email_address'
  });
  RocketChat.settings.add('Livechat_offline_form_unavailable', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_form_unavailable_message'
  });
  RocketChat.settings.add('Livechat_offline_title', 'Leave a message', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Title'
  });
  RocketChat.settings.add('Livechat_offline_title_color', '#666666', {
    type: 'color',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Color'
  });
  RocketChat.settings.add('Livechat_offline_message', 'We are not online right now. Please leave us a message:', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Instructions',
    i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message'
  });
  RocketChat.settings.add('Livechat_offline_email', '', {
    type: 'string',
    group: 'Livechat',
    i18nLabel: 'Email_address_to_send_offline_messages',
    section: 'Offline'
  });
  RocketChat.settings.add('Livechat_offline_success_message', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    section: 'Offline',
    i18nLabel: 'Offline_success_message'
  });
  RocketChat.settings.add('Livechat_registration_form', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_preregistration_form'
  });
  RocketChat.settings.add('Livechat_allow_switching_departments', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Allow_switching_departments'
  });
  RocketChat.settings.add('Livechat_show_agent_email', true, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Show_agent_email'
  });
  RocketChat.settings.add('Livechat_guest_count', 1, {
    type: 'int',
    group: 'Livechat'
  });
  RocketChat.settings.add('Livechat_Room_Count', 1, {
    type: 'int',
    group: 'Livechat',
    i18nLabel: 'Livechat_room_count'
  });
  RocketChat.settings.add('Livechat_agent_leave_action', 'none', {
    type: 'select',
    group: 'Livechat',
    values: [{
      key: 'none',
      i18nLabel: 'None'
    }, {
      key: 'forward',
      i18nLabel: 'Forward'
    }, {
      key: 'close',
      i18nLabel: 'Close'
    }],
    i18nLabel: 'How_to_handle_open_sessions_when_agent_goes_offline'
  });
  RocketChat.settings.add('Livechat_agent_leave_action_timeout', 60, {
    type: 'int',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: {
        $ne: 'none'
      }
    },
    i18nLabel: 'How_long_to_wait_after_agent_goes_offline',
    i18nDescription: 'Time_in_seconds'
  });
  RocketChat.settings.add('Livechat_agent_leave_comment', '', {
    type: 'string',
    group: 'Livechat',
    enableQuery: {
      _id: 'Livechat_agent_leave_action',
      value: 'close'
    },
    i18nLabel: 'Comment_to_leave_on_closing_session'
  });
  RocketChat.settings.add('Livechat_webhookUrl', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Webhook_URL'
  });
  RocketChat.settings.add('Livechat_secret_token', false, {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Secret_token'
  });
  RocketChat.settings.add('Livechat_webhook_on_close', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_chat_close'
  });
  RocketChat.settings.add('Livechat_webhook_on_offline_msg', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_offline_messages'
  });
  RocketChat.settings.add('Livechat_webhook_on_capture', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Send_request_on_lead_capture'
  });
  RocketChat.settings.add('Livechat_lead_email_regex', '\\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)+[A-Z]{2,4}\\b', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_email_regex'
  });
  RocketChat.settings.add('Livechat_lead_phone_regex', '((?:\\([0-9]{1,3}\\)|[0-9]{2})[ \\-]*?[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$)|[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$))', {
    type: 'string',
    group: 'Livechat',
    section: 'CRM_Integration',
    i18nLabel: 'Lead_capture_phone_regex'
  });
  RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Enabled'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Key'
  });
  RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
    type: 'string',
    group: 'Livechat',
    section: 'Knowledge_Base',
    public: true,
    i18nLabel: 'Apiai_Language'
  });
  RocketChat.settings.add('Livechat_history_monitor_type', 'url', {
    type: 'select',
    group: 'Livechat',
    i18nLabel: 'Monitor_history_for_changes_on',
    values: [{
      key: 'url',
      i18nLabel: 'Page_URL'
    }, {
      key: 'title',
      i18nLabel: 'Page_title'
    }]
  });
  RocketChat.settings.add('Livechat_enable_office_hours', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Office_hours_enabled'
  });
  RocketChat.settings.add('Livechat_videocall_enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Videocall_enabled',
    i18nDescription: 'Beta_feature_Depends_on_Video_Conference_to_be_enabled',
    enableQuery: {
      _id: 'Jitsi_Enabled',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_enable_transcript', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_Enabled'
  });
  RocketChat.settings.add('Livechat_transcript_message', 'Would you like a copy of this chat emailed?', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Transcript_message',
    enableQuery: {
      _id: 'Livechat_enable_transcript',
      value: true
    }
  });
  RocketChat.settings.add('Livechat_open_inquiery_show_connecting', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_open_inquiery_show_connecting',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_AllowedDomainsList', '', {
    type: 'string',
    group: 'Livechat',
    public: true,
    i18nLabel: 'Livechat_AllowedDomainsList',
    i18nDescription: 'Domains_allowed_to_embed_the_livechat_widget'
  });
  RocketChat.settings.add('Livechat_Facebook_Enabled', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Facebook'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Key', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_Facebook_API_Secret', '', {
    type: 'string',
    group: 'Livechat',
    section: 'Facebook',
    i18nDescription: 'If_you_dont_have_one_send_an_email_to_omni_rocketchat_to_get_yours'
  });
  RocketChat.settings.add('Livechat_RDStation_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'RD Station',
    i18nLabel: 'RDStation_Token'
  });
  RocketChat.settings.add('Livechat_Routing_Method', 'Least_Amount', {
    type: 'select',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    values: [{
      key: 'External',
      i18nLabel: 'External_Service'
    }, {
      key: 'Least_Amount',
      i18nLabel: 'Least_Amount'
    }, {
      key: 'Guest_Pool',
      i18nLabel: 'Guest_Pool'
    }]
  });
  RocketChat.settings.add('Livechat_guest_pool_with_no_agents', false, {
    type: 'boolean',
    group: 'Livechat',
    section: 'Routing',
    i18nLabel: 'Accept_with_no_online_agents',
    i18nDescription: 'Accept_incoming_livechat_requests_even_if_there_are_no_online_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'Guest_Pool'
    }
  });
  RocketChat.settings.add('Livechat_show_queue_list_link', false, {
    type: 'boolean',
    group: 'Livechat',
    public: true,
    section: 'Routing',
    i18nLabel: 'Show_queue_list_to_all_agents',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: {
        $ne: 'External'
      }
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_URL', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'External_Queue_Service_URL',
    i18nDescription: 'For_more_details_please_check_our_docs',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
  RocketChat.settings.add('Livechat_External_Queue_Token', '', {
    type: 'string',
    group: 'Livechat',
    public: false,
    section: 'Routing',
    i18nLabel: 'Secret_token',
    enableQuery: {
      _id: 'Livechat_Routing_Method',
      value: 'External'
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"imports":{"server":{"rest":{"departments.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/departments.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.API.v1.addRoute('livechat/department', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    return RocketChat.API.v1.success({
      departments: RocketChat.models.LivechatDepartment.find().fetch()
    });
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });
      const department = RocketChat.Livechat.saveDepartment(null, this.bodyParams.department, this.bodyParams.agents);

      if (department) {
        return RocketChat.API.v1.success({
          department,
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: department._id
          }).fetch()
        });
      }

      RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/department/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      return RocketChat.API.v1.success({
        department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
        agents: RocketChat.models.LivechatDepartmentAgents.find({
          departmentId: this.urlParams._id
        }).fetch()
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  put() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });
      check(this.bodyParams, {
        department: Object,
        agents: Array
      });

      if (RocketChat.Livechat.saveDepartment(this.urlParams._id, this.bodyParams.department, this.bodyParams.agents)) {
        return RocketChat.API.v1.success({
          department: RocketChat.models.LivechatDepartment.findOneById(this.urlParams._id),
          agents: RocketChat.models.LivechatDepartmentAgents.find({
            departmentId: this.urlParams._id
          }).fetch()
        });
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        _id: String
      });

      if (RocketChat.Livechat.removeDepartment(this.urlParams._id)) {
        return RocketChat.API.v1.success();
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"facebook.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/facebook.js                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 0);
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 1);

/**
 * @api {post} /livechat/facebook Send Facebook message
 * @apiName Facebook
 * @apiGroup Livechat
 *
 * @apiParam {String} mid Facebook message id
 * @apiParam {String} page Facebook pages id
 * @apiParam {String} token Facebook user's token
 * @apiParam {String} first_name Facebook user's first name
 * @apiParam {String} last_name Facebook user's last name
 * @apiParam {String} [text] Facebook message text
 * @apiParam {String} [attachments] Facebook message attachments
 */
RocketChat.API.v1.addRoute('livechat/facebook', {
  post() {
    if (!this.bodyParams.text && !this.bodyParams.attachments) {
      return {
        success: false
      };
    }

    if (!this.request.headers['x-hub-signature']) {
      return {
        success: false
      };
    }

    if (!RocketChat.settings.get('Livechat_Facebook_Enabled')) {
      return {
        success: false,
        error: 'Integration disabled'
      };
    } // validate if request come from omni


    const signature = crypto.createHmac('sha1', RocketChat.settings.get('Livechat_Facebook_API_Secret')).update(JSON.stringify(this.request.body)).digest('hex');

    if (this.request.headers['x-hub-signature'] !== `sha1=${signature}`) {
      return {
        success: false,
        error: 'Invalid signature'
      };
    }

    const sendMessage = {
      message: {
        _id: this.bodyParams.mid
      },
      roomInfo: {
        facebook: {
          page: this.bodyParams.page
        }
      }
    };
    let visitor = LivechatVisitors.getVisitorByToken(this.bodyParams.token);

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = this.bodyParams.token;
      const userId = RocketChat.Livechat.registerGuest({
        token: sendMessage.message.token,
        name: `${this.bodyParams.first_name} ${this.bodyParams.last_name}`
      });
      visitor = RocketChat.models.Users.findOneById(userId);
    }

    sendMessage.message.msg = this.bodyParams.text;
    sendMessage.guest = visitor;

    try {
      return {
        sucess: true,
        message: RocketChat.Livechat.sendMessage(sendMessage)
      };
    } catch (e) {
      console.error('Error using Facebook ->', e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sms.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/sms.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let LivechatVisitors;
module.watch(require("../../../server/models/LivechatVisitors"), {
  default(v) {
    LivechatVisitors = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/sms-incoming/:service', {
  post() {
    const SMSService = RocketChat.SMS.getService(this.urlParams.service);
    const sms = SMSService.parse(this.bodyParams);
    let visitor = LivechatVisitors.findOneVisitorByPhone(sms.from);
    const sendMessage = {
      message: {
        _id: Random.id()
      },
      roomInfo: {
        sms: {
          from: sms.to
        }
      }
    };

    if (visitor) {
      const rooms = RocketChat.models.Rooms.findOpenByVisitorToken(visitor.token).fetch();

      if (rooms && rooms.length > 0) {
        sendMessage.message.rid = rooms[0]._id;
      } else {
        sendMessage.message.rid = Random.id();
      }

      sendMessage.message.token = visitor.token;
    } else {
      sendMessage.message.rid = Random.id();
      sendMessage.message.token = Random.id();
      const visitorId = RocketChat.Livechat.registerGuest({
        username: sms.from.replace(/[^0-9]/g, ''),
        token: sendMessage.message.token,
        phone: {
          number: sms.from
        }
      });
      visitor = LivechatVisitors.findOneById(visitorId);
    }

    sendMessage.message.msg = sms.body;
    sendMessage.guest = visitor;

    try {
      const message = SMSService.response.call(this, RocketChat.Livechat.sendMessage(sendMessage));
      Meteor.defer(() => {
        if (sms.extra) {
          if (sms.extra.fromCountry) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'country', sms.extra.fromCountry);
          }

          if (sms.extra.fromState) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'state', sms.extra.fromState);
          }

          if (sms.extra.fromCity) {
            Meteor.call('livechat:setCustomField', sendMessage.message.token, 'city', sms.extra.fromCity);
          }
        }
      });
      return message;
    } catch (e) {
      return SMSService.error.call(this, e);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_livechat/imports/server/rest/users.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
RocketChat.API.v1.addRoute('livechat/users/:type', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      const users = RocketChat.authz.getUsersInRole(role);
      return RocketChat.API.v1.success({
        users: users.fetch().map(user => ({
          _id: user._id,
          username: user.username
        }))
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  post() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String
      });
      check(this.bodyParams, {
        username: String
      });

      if (this.urlParams.type === 'agent') {
        const user = RocketChat.Livechat.addAgent(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else if (this.urlParams.type === 'manager') {
        const user = RocketChat.Livechat.addManager(this.bodyParams.username);

        if (user) {
          return RocketChat.API.v1.success({
            user
          });
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
RocketChat.API.v1.addRoute('livechat/users/:type/:_id', {
  authRequired: true
}, {
  get() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure('User not found');
      }

      let role;

      if (this.urlParams.type === 'agent') {
        role = 'livechat-agent';
      } else if (this.urlParams.type === 'manager') {
        role = 'livechat-manager';
      } else {
        throw 'Invalid type';
      }

      if (user.roles.indexOf(role) !== -1) {
        return RocketChat.API.v1.success({
          user: _.pick(user, '_id', 'username')
        });
      }

      return RocketChat.API.v1.success({
        user: null
      });
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  },

  delete() {
    if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
      return RocketChat.API.v1.unauthorized();
    }

    try {
      check(this.urlParams, {
        type: String,
        _id: String
      });
      const user = RocketChat.models.Users.findOneById(this.urlParams._id);

      if (!user) {
        return RocketChat.API.v1.failure();
      }

      if (this.urlParams.type === 'agent') {
        if (RocketChat.Livechat.removeAgent(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else if (this.urlParams.type === 'manager') {
        if (RocketChat.Livechat.removeManager(user.username)) {
          return RocketChat.API.v1.success();
        }
      } else {
        throw 'Invalid type';
      }

      return RocketChat.API.v1.failure();
    } catch (e) {
      return RocketChat.API.v1.failure(e.error);
    }
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"ua-parser-js":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "ua-parser-js";
exports.version = "0.7.17";
exports.main = "src/ua-parser.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"src":{"ua-parser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_livechat/node_modules/ua-parser-js/src/ua-parser.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * UAParser.js v0.7.17
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2016 Faisal Salman <fyzlman@gmail.com>
 * Dual licensed under GPLv2 & MIT
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.17',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var margedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    margedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    margedRegexes[i] = regexes[i];
                }
            }
            return margedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            //var result = {},
            var i = 0, j, k, p, q, matches, match;//, args = arguments;

            /*// construct object barebones
            for (p = 0; p < args[1].length; p++) {
                q = args[1][p];
                result[typeof q === OBJ_TYPE ? q[0] : q] = undefined;
            }*/

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
            // console.log(this);
            //return this;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]+)*/i,                                            // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser
            ], [NAME, VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
            ], [NAME, VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i
                                                                                // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/([\w\.]+)/i,                                          // Konqueror
            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/([\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]+)*/i,                                        // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+;))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)\sbuild\//i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p)/i                                                      // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w+)*/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w+)*/i                                                       // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w;-]{10}(a\d{3})/i                                 // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w+)*/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google']], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)\s/i                                          // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel xl|pixel)\s/i                                   // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+(\w+)\s+build\/hm\1/i,                                    // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:one|one[\s_]plus|note lte)?[\s_]*(?:\d\w)?)\s+build/i,    // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]*[\w\s]+)?)\s+build/i      // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)?(?:[\s_]*[\w\s]+)?)\s+build/i          // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu Tablet
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, TABLET]], [

            /android.+a000(1)\s+build/i                                         // OnePlus
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Venue[\d\s]*)\s+build/i                          // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(zte)?.+(k\d{2})\s+build/i                        // ZTE K Series Tablet
            ], [[VENDOR, 'ZTE'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2}x?.*)\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(.+)\s+build/i          // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?.+)\s+build/i                                // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?.+)\s+build/i                         // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_?)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-?)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(.*\b)\s+build/i             // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q.+)\s+build/i                           // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /(android.+)[;\/].+build/i                                          // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]


        /*//////////////////////////
            // TODO: move to string map
            ////////////////////////////

            /(C6603)/i                                                          // Sony Xperia Z C6603
            ], [[MODEL, 'Xperia Z C6603'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [
            /(C6903)/i                                                          // Sony Xperia Z 1
            ], [[MODEL, 'Xperia Z 1'], [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /(SM-G900[F|H])/i                                                   // Samsung Galaxy S5
            ], [[MODEL, 'Galaxy S5'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G7102)/i                                                       // Samsung Galaxy Grand 2
            ], [[MODEL, 'Galaxy Grand 2'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G530H)/i                                                       // Samsung Galaxy Grand Prime
            ], [[MODEL, 'Galaxy Grand Prime'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-G313HZ)/i                                                      // Samsung Galaxy V
            ], [[MODEL, 'Galaxy V'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T805)/i                                                        // Samsung Galaxy Tab S 10.5
            ], [[MODEL, 'Galaxy Tab S 10.5'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [
            /(SM-G800F)/i                                                       // Samsung Galaxy S5 Mini
            ], [[MODEL, 'Galaxy S5 Mini'], [VENDOR, 'Samsung'], [TYPE, MOBILE]], [
            /(SM-T311)/i                                                        // Samsung Galaxy Tab 3 8.0
            ], [[MODEL, 'Galaxy Tab 3 8.0'], [VENDOR, 'Samsung'], [TYPE, TABLET]], [

            /(T3C)/i                                                            // Advan Vandroid T3C
            ], [MODEL, [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN T1J\+)/i                                                    // Advan Vandroid T1J+
            ], [[MODEL, 'Vandroid T1J+'], [VENDOR, 'Advan'], [TYPE, TABLET]], [
            /(ADVAN S4A)/i                                                      // Advan Vandroid S4A
            ], [[MODEL, 'Vandroid S4A'], [VENDOR, 'Advan'], [TYPE, MOBILE]], [

            /(V972M)/i                                                          // ZTE V972M
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [

            /(i-mobile)\s(IQ\s[\d\.]+)/i                                        // i-mobile IQ
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(IQ6.3)/i                                                          // i-mobile IQ IQ 6.3
            ], [[MODEL, 'IQ 6.3'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [
            /(i-mobile)\s(i-style\s[\d\.]+)/i                                   // i-mobile i-STYLE
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /(i-STYLE2.1)/i                                                     // i-mobile i-STYLE 2.1
            ], [[MODEL, 'i-STYLE 2.1'], [VENDOR, 'i-mobile'], [TYPE, MOBILE]], [

            /(mobiistar touch LAI 512)/i                                        // mobiistar touch LAI 512
            ], [[MODEL, 'Touch LAI 512'], [VENDOR, 'mobiistar'], [TYPE, MOBILE]], [

            /////////////
            // END TODO
            ///////////*/

        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s]+\w)*/i,                  // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)[\/\s]([\w\.]+)/i,                                          // Tizen
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|contiki)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                  // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]+(?:.*os\s([\w]+)\slike\smac|;\sopera)/i                 // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]+)*/i,                            // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    /*
    var Browser = function (name, version) {
        this[NAME] = name;
        this[VERSION] = version;
    };
    var CPU = function (arch) {
        this[ARCHITECTURE] = arch;
    };
    var Device = function (vendor, model, type) {
        this[VENDOR] = vendor;
        this[MODEL] = model;
        this[TYPE] = type;
    };
    var Engine = Browser;
    var OS = Browser;
    */
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;
        //var browser = new Browser();
        //var cpu = new CPU();
        //var device = new Device();
        //var engine = new Engine();
        //var os = new OS();

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            //browser = new Browser();
            //cpu = new CPU();
            //device = new Device();
            //engine = new Engine();
            //os = new OS();
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };
    //UAParser.Utils = util;

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        // TODO: test!!!!!!!!
        /*
        if (require && require.main === module && process) {
            // cli
            var jsonize = function (arr) {
                var res = [];
                for (var i in arr) {
                    res.push(new UAParser(arr[i]).getResult());
                }
                process.stdout.write(JSON.stringify(res, null, 2) + '\n');
            };
            if (process.stdin.isTTY) {
                // via args
                jsonize(process.argv.slice(2));
            } else {
                // via pipe
                var str = '';
                process.stdin.on('readable', function() {
                    var read = process.stdin.read();
                    if (read !== null) {
                        str += read;
                    }
                });
                process.stdin.on('end', function () {
                    jsonize(str.replace(/\n$/, '').split('\n'));
                });
            }
        }
        */
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if (typeof $ !== UNDEF_TYPE) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:livechat/livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/startup.js");
require("/node_modules/meteor/rocketchat:livechat/server/visitorStatus.js");
require("/node_modules/meteor/rocketchat:livechat/permissions.js");
require("/node_modules/meteor/rocketchat:livechat/messageTypes.js");
require("/node_modules/meteor/rocketchat:livechat/roomType.js");
require("/node_modules/meteor/rocketchat:livechat/config.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/externalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/leadCapture.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/markRoomResponded.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/offlineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/RDStation.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToCRM.js");
require("/node_modules/meteor/rocketchat:livechat/server/hooks/sendToFacebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/addManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/changeLivechatStatus.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeByVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/closeRoom.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/facebook.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getCustomFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getAgentData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getInitialData.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/getNextAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loadHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/loginByToken.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/pageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/registerGuest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeManager.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/removeTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveSurveyFeedback.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/searchAgent.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendMessageLivechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendOfflineMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/setDepartmentForVisitor.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/startVideoCall.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/transfer.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/webhookTest.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/takeInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/returnAsInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/saveOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/methods/sendTranscript.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Users.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatExternalMessage.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatCustomField.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartment.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatDepartmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatTrigger.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/indexes.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatInquiry.js");
require("/node_modules/meteor/rocketchat:livechat/server/models/LivechatOfficeHour.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/Livechat.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/QueueMethods.js");
require("/node_modules/meteor/rocketchat:livechat/server/lib/OfficeClock.js");
require("/node_modules/meteor/rocketchat:livechat/server/sendMessageBySMS.js");
require("/node_modules/meteor/rocketchat:livechat/server/unclosedLivechats.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/customFields.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/departmentAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/externalMessages.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAgents.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatAppearance.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatDepartments.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatIntegration.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatManagers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatRooms.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatQueue.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatTriggers.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorHistory.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorInfo.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/visitorPageVisited.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatInquiries.js");
require("/node_modules/meteor/rocketchat:livechat/server/publications/livechatOfficeHours.js");
require("/node_modules/meteor/rocketchat:livechat/server/api.js");

/* Exports */
Package._define("rocketchat:livechat");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_livechat.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9saXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvc3RhcnR1cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvdmlzaXRvclN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvZXh0ZXJuYWxNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9sZWFkQ2FwdHVyZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3MvbWFya1Jvb21SZXNwb25kZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL29mZmxpbmVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9ob29rcy9SRFN0YXRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2hvb2tzL3NlbmRUb0NSTS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvaG9va3Mvc2VuZFRvRmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvYWRkTWFuYWdlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jaGFuZ2VMaXZlY2hhdFN0YXR1cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZUJ5VmlzaXRvci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9jbG9zZVJvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZmFjZWJvb2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvZ2V0Q3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL2dldEFnZW50RGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXRJbml0aWFsRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9nZXROZXh0QWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9hZEhpc3RvcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvbG9naW5CeVRva2VuLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3BhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlZ2lzdGVyR3Vlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlQ3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmVtb3ZlRGVwYXJ0bWVudC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9yZW1vdmVNYW5hZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3JlbW92ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUFwcGVhcmFuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZUN1c3RvbUZpZWxkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVEZXBhcnRtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbmZvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVJbnRlZ3JhdGlvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zYXZlU3VydmV5RmVlZGJhY2suanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2F2ZVRyaWdnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VhcmNoQWdlbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2VuZE1lc3NhZ2VMaXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kT2ZmbGluZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0Q3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc2V0RGVwYXJ0bWVudEZvclZpc2l0b3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvc3RhcnRWaWRlb0NhbGwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvdHJhbnNmZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvd2ViaG9va1Rlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvdGFrZUlucXVpcnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21ldGhvZHMvcmV0dXJuQXNJbnF1aXJ5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tZXRob2RzL3NhdmVPZmZpY2VIb3Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbWV0aG9kcy9zZW5kVHJhbnNjcmlwdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL1VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdEV4dGVybmFsTWVzc2FnZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0Q3VzdG9tRmllbGQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdERlcGFydG1lbnQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL21vZGVscy9MaXZlY2hhdFBhZ2VWaXNpdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvTGl2ZWNoYXRUcmlnZ2VyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9tb2RlbHMvaW5kZXhlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0SW5xdWlyeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0T2ZmaWNlSG91ci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2xpYi9MaXZlY2hhdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL1F1ZXVlTWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvbGliL09mZmljZUNsb2NrLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9saWIvT21uaUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3NlbmRNZXNzYWdlQnlTTVMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3VuY2xvc2VkTGl2ZWNoYXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvY3VzdG9tRmllbGRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvZGVwYXJ0bWVudEFnZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2V4dGVybmFsTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEFnZW50cy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0QXBwZWFyYW5jZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0RGVwYXJ0bWVudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdEludGVncmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRNYW5hZ2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0Um9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdFF1ZXVlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvbGl2ZWNoYXRUcmlnZ2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL3Zpc2l0b3JIaXN0b3J5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L3NlcnZlci9wdWJsaWNhdGlvbnMvdmlzaXRvckluZm8uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy92aXNpdG9yUGFnZVZpc2l0ZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL3B1YmxpY2F0aW9ucy9saXZlY2hhdElucXVpcmllcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9zZXJ2ZXIvcHVibGljYXRpb25zL2xpdmVjaGF0T2ZmaWNlSG91cnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvc2VydmVyL2FwaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9wZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9tZXNzYWdlVHlwZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvcm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvY29uZmlnLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxpdmVjaGF0L2ltcG9ydHMvc2VydmVyL3Jlc3QvZGVwYXJ0bWVudHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6bGl2ZWNoYXQvaW1wb3J0cy9zZXJ2ZXIvcmVzdC9mYWNlYm9vay5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L3Ntcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsaXZlY2hhdC9pbXBvcnRzL3NlcnZlci9yZXN0L3VzZXJzLmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInVybCIsIldlYkFwcCIsIlBhY2thZ2UiLCJ3ZWJhcHAiLCJBdXRvdXBkYXRlIiwiYXV0b3VwZGF0ZSIsImNvbm5lY3RIYW5kbGVycyIsInVzZSIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsInJlcSIsInJlcyIsIm5leHQiLCJyZXFVcmwiLCJwYXJzZSIsInBhdGhuYW1lIiwic2V0SGVhZGVyIiwiZG9tYWluV2hpdGVMaXN0IiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0IiwiaGVhZGVycyIsInJlZmVyZXIiLCJpc0VtcHR5IiwidHJpbSIsIm1hcCIsInNwbGl0IiwiZG9tYWluIiwiY29udGFpbnMiLCJob3N0IiwicHJvdG9jb2wiLCJoZWFkIiwiQXNzZXRzIiwiZ2V0VGV4dCIsImJhc2VVcmwiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiUk9PVF9VUkxfUEFUSF9QUkVGSVgiLCJ0ZXN0IiwiaHRtbCIsImF1dG91cGRhdGVWZXJzaW9uIiwiSlNPTiIsInN0cmluZ2lmeSIsIndyaXRlIiwiZW5kIiwic3RhcnR1cCIsInJvb21UeXBlcyIsInNldFJvb21GaW5kIiwiY29kZSIsIm1vZGVscyIsIlJvb21zIiwiZmluZExpdmVjaGF0QnlDb2RlIiwiYXV0aHoiLCJhZGRSb29tQWNjZXNzVmFsaWRhdG9yIiwicm9vbSIsInVzZXIiLCJ0IiwiaGFzUGVybWlzc2lvbiIsIl9pZCIsImV4dHJhRGF0YSIsInRva2VuIiwiY2FsbGJhY2tzIiwiYWRkIiwiRXJyb3IiLCJUQVBpMThuIiwiX18iLCJsbmciLCJsYW5ndWFnZSIsInByaW9yaXR5IiwiTE9XIiwiVXNlclByZXNlbmNlRXZlbnRzIiwib24iLCJzZXNzaW9uIiwic3RhdHVzIiwibWV0YWRhdGEiLCJ2aXNpdG9yIiwiTGl2ZWNoYXRJbnF1aXJ5IiwidXBkYXRlVmlzaXRvclN0YXR1cyIsImtub3dsZWRnZUVuYWJsZWQiLCJhcGlhaUtleSIsImFwaWFpTGFuZ3VhZ2UiLCJrZXkiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlZGl0ZWRBdCIsImRlZmVyIiwicmVzcG9uc2UiLCJIVFRQIiwicG9zdCIsImRhdGEiLCJxdWVyeSIsIm1zZyIsImxhbmciLCJzZXNzaW9uSWQiLCJyZXN1bHQiLCJmdWxmaWxsbWVudCIsInNwZWVjaCIsIkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIiwiaW5zZXJ0IiwicmlkIiwib3JpZyIsInRzIiwiRGF0ZSIsImUiLCJTeXN0ZW1Mb2dnZXIiLCJlcnJvciIsIkxpdmVjaGF0VmlzaXRvcnMiLCJ2YWxpZGF0ZU1lc3NhZ2UiLCJwaG9uZVJlZ2V4cCIsIlJlZ0V4cCIsIm1zZ1Bob25lcyIsIm1hdGNoIiwiZW1haWxSZWdleHAiLCJtc2dFbWFpbHMiLCJzYXZlR3Vlc3RFbWFpbFBob25lQnlJZCIsInJ1biIsIndhaXRpbmdSZXNwb25zZSIsIm5vdyIsInNldFJlc3BvbnNlQnlSb29tSWQiLCJ1IiwidXNlcm5hbWUiLCJyZXNwb25zZURhdGUiLCJyZXNwb25zZVRpbWUiLCJnZXRUaW1lIiwicG9zdERhdGEiLCJ0eXBlIiwic2VudEF0IiwibmFtZSIsImVtYWlsIiwiTGl2ZWNoYXQiLCJzZW5kUmVxdWVzdCIsIk1FRElVTSIsInNlbmRUb1JEU3RhdGlvbiIsImxpdmVjaGF0RGF0YSIsImdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyIsIm9wdGlvbnMiLCJ0b2tlbl9yZHN0YXRpb24iLCJpZGVudGlmaWNhZG9yIiwiY2xpZW50X2lkIiwibm9tZSIsInBob25lIiwidGVsZWZvbmUiLCJ0YWdzIiwiT2JqZWN0Iiwia2V5cyIsImN1c3RvbUZpZWxkcyIsImZvckVhY2giLCJmaWVsZCIsImNhbGwiLCJjb25zb2xlIiwic2VuZFRvQ1JNIiwiaW5jbHVkZU1lc3NhZ2VzIiwibWVzc2FnZXMiLCJNZXNzYWdlcyIsImZpbmRWaXNpYmxlQnlSb29tSWQiLCJzb3J0IiwiYWdlbnRJZCIsInB1c2giLCJzYXZlQ1JNRGF0YUJ5Um9vbUlkIiwib3BlbiIsIk9tbmlDaGFubmVsIiwiZmFjZWJvb2siLCJyZXBseSIsInBhZ2UiLCJpZCIsInRleHQiLCJtZXRob2RzIiwidXNlcklkIiwibWV0aG9kIiwiYWRkQWdlbnQiLCJhZGRNYW5hZ2VyIiwibmV3U3RhdHVzIiwic3RhdHVzTGl2ZWNoYXQiLCJVc2VycyIsInNldExpdmVjaGF0U3RhdHVzIiwicm9vbUlkIiwiZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbiIsImdldFZpc2l0b3JCeVRva2VuIiwiY2xvc2VSb29tIiwiY29tbWVudCIsImZpbmRPbmVCeUlkIiwidXNlcm5hbWVzIiwiaW5kZXhPZiIsImFjdGlvbiIsImVuYWJsZWQiLCJoYXNUb2tlbiIsImVuYWJsZSIsInN1Y2Nlc3MiLCJ1cGRhdGVCeUlkIiwiZGlzYWJsZSIsImxpc3RQYWdlcyIsInN1YnNjcmliZSIsInVuc3Vic2NyaWJlIiwiTGl2ZWNoYXRDdXN0b21GaWVsZCIsImZpbmQiLCJmZXRjaCIsImNoZWNrIiwiU3RyaW5nIiwic2VydmVkQnkiLCJnZXRBZ2VudEluZm8iLCJ2aXNpdG9yVG9rZW4iLCJpbmZvIiwidGl0bGUiLCJjb2xvciIsInJlZ2lzdHJhdGlvbkZvcm0iLCJ0cmlnZ2VycyIsImRlcGFydG1lbnRzIiwiYWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50cyIsIm9ubGluZSIsIm9mZmxpbmVDb2xvciIsIm9mZmxpbmVNZXNzYWdlIiwib2ZmbGluZVN1Y2Nlc3NNZXNzYWdlIiwib2ZmbGluZVVuYXZhaWxhYmxlTWVzc2FnZSIsImRpc3BsYXlPZmZsaW5lRm9ybSIsInZpZGVvQ2FsbCIsImZpbmRPcGVuQnlWaXNpdG9yVG9rZW4iLCJmaWVsZHMiLCJjbCIsImxlbmd0aCIsInZpc2l0b3JFbWFpbHMiLCJpbml0U2V0dGluZ3MiLCJnZXRJbml0U2V0dGluZ3MiLCJMaXZlY2hhdF90aXRsZSIsIkxpdmVjaGF0X3RpdGxlX2NvbG9yIiwiTGl2ZWNoYXRfZW5hYmxlZCIsIkxpdmVjaGF0X3JlZ2lzdHJhdGlvbl9mb3JtIiwib2ZmbGluZVRpdGxlIiwiTGl2ZWNoYXRfb2ZmbGluZV90aXRsZSIsIkxpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3IiLCJMaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2UiLCJMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZSIsIkxpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZSIsIkxpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtIiwiTGFuZ3VhZ2UiLCJMaXZlY2hhdF92aWRlb2NhbGxfZW5hYmxlZCIsIkppdHNpX0VuYWJsZWQiLCJ0cmFuc2NyaXB0IiwiTGl2ZWNoYXRfZW5hYmxlX3RyYW5zY3JpcHQiLCJ0cmFuc2NyaXB0TWVzc2FnZSIsIkxpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZSIsImFnZW50RGF0YSIsIkxpdmVjaGF0VHJpZ2dlciIsImZpbmRFbmFibGVkIiwidHJpZ2dlciIsInBpY2siLCJMaXZlY2hhdERlcGFydG1lbnQiLCJmaW5kRW5hYmxlZFdpdGhBZ2VudHMiLCJkZXBhcnRtZW50IiwiTGl2ZWNoYXRfYWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzIiwiZmluZE9ubGluZUFnZW50cyIsImNvdW50IiwicmVxdWlyZURlcGFybWVudCIsImdldFJlcXVpcmVkRGVwYXJ0bWVudCIsImFnZW50IiwiZ2V0TmV4dEFnZW50IiwibGltaXQiLCJscyIsImxvYWRNZXNzYWdlSGlzdG9yeSIsInBhZ2VJbmZvIiwic2F2ZVBhZ2VIaXN0b3J5IiwicmVnaXN0ZXJHdWVzdCIsIkxpdmVjaGF0UGFnZVZpc2l0ZWQiLCJrZWVwSGlzdG9yeUZvclRva2VuIiwicmVtb3ZlQWdlbnQiLCJjdXN0b21GaWVsZCIsInJlbW92ZUJ5SWQiLCJyZW1vdmVEZXBhcnRtZW50IiwicmVtb3ZlTWFuYWdlciIsInRyaWdnZXJJZCIsInZhbGlkU2V0dGluZ3MiLCJ2YWxpZCIsImV2ZXJ5Iiwic2V0dGluZyIsImN1c3RvbUZpZWxkRGF0YSIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwibGFiZWwiLCJzY29wZSIsInZpc2liaWxpdHkiLCJjcmVhdGVPclVwZGF0ZUN1c3RvbUZpZWxkIiwiZGVwYXJ0bWVudERhdGEiLCJkZXBhcnRtZW50QWdlbnRzIiwic2F2ZURlcGFydG1lbnQiLCJndWVzdERhdGEiLCJyb29tRGF0YSIsIk9wdGlvbmFsIiwidG9waWMiLCJyZXQiLCJzYXZlR3Vlc3QiLCJzYXZlUm9vbUluZm8iLCJzIiwidmFsdWVzIiwidmlzaXRvclJvb20iLCJmb3JtRGF0YSIsInVuZGVmaW5lZCIsInVwZGF0ZURhdGEiLCJpdGVtIiwidXBkYXRlU3VydmV5RmVlZGJhY2tCeUlkIiwiTWF5YmUiLCJkZXNjcmlwdGlvbiIsIkJvb2xlYW4iLCJjb25kaXRpb25zIiwiQXJyYXkiLCJhY3Rpb25zIiwiaXNTdHJpbmciLCJmaW5kT25lQnlVc2VybmFtZSIsInNlbmRNZXNzYWdlTGl2ZWNoYXQiLCJndWVzdCIsInNlbmRNZXNzYWdlIiwiZG5zIiwiaGVhZGVyIiwicGxhY2Vob2xkZXJzIiwicmVwbGFjZSIsImZvb3RlciIsImZyb21FbWFpbCIsImVtYWlsRG9tYWluIiwic3Vic3RyIiwibGFzdEluZGV4T2YiLCJ3cmFwQXN5bmMiLCJyZXNvbHZlTXgiLCJFbWFpbCIsInNlbmQiLCJ0byIsImZyb20iLCJyZXBseVRvIiwic3ViamVjdCIsInN1YnN0cmluZyIsIkREUFJhdGVMaW1pdGVyIiwiYWRkUnVsZSIsImNvbm5lY3Rpb25JZCIsIm92ZXJ3cml0ZSIsInVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4iLCJzZXREZXBhcnRtZW50Rm9yR3Vlc3QiLCJSYW5kb20iLCJnZXRSb29tIiwiaml0c2lUaW1lb3V0IiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsImFjdGlvbkxpbmtzIiwiaWNvbiIsImkxOG5MYWJlbCIsIm1ldGhvZF9pZCIsInBhcmFtcyIsImppdHNpUm9vbSIsInRyYW5zZmVyRGF0YSIsImRlcGFydG1lbnRJZCIsImhhc1JvbGUiLCJ0cmFuc2ZlciIsInBvc3RDYXRjaEVycm9yIiwicmVzb2x2ZSIsImVyciIsInVuYmxvY2siLCJzYW1wbGVEYXRhIiwiY3JlYXRlZEF0IiwibGFzdE1lc3NhZ2VBdCIsInByb2R1Y3RJZCIsImlwIiwiYnJvd3NlciIsIm9zIiwiY3VzdG9tZXJJZCIsImxvZyIsInN0YXR1c0NvZGUiLCJpbnF1aXJ5SWQiLCJpbnF1aXJ5Iiwic3Vic2NyaXB0aW9uRGF0YSIsImFsZXJ0IiwidW5yZWFkIiwidXNlck1lbnRpb25zIiwiZ3JvdXBNZW50aW9ucyIsImRlc2t0b3BOb3RpZmljYXRpb25zIiwibW9iaWxlUHVzaE5vdGlmaWNhdGlvbnMiLCJlbWFpbE5vdGlmaWNhdGlvbnMiLCJTdWJzY3JpcHRpb25zIiwiY2hhbmdlQWdlbnRCeVJvb21JZCIsInRha2VJbnF1aXJ5IiwiY3JlYXRlQ29tbWFuZFdpdGhSb29tSWRBbmRVc2VyIiwic3RyZWFtIiwiZW1pdCIsInJlbW92ZUJ5Um9vbUlkIiwicmVtb3ZlVXNlcm5hbWVCeUlkIiwiZmluZE9uZSIsIm9wZW5JbnF1aXJ5IiwiZGF5Iiwic3RhcnQiLCJmaW5pc2giLCJMaXZlY2hhdE9mZmljZUhvdXIiLCJ1cGRhdGVIb3VycyIsIm1vbWVudCIsInVzZXJMYW5ndWFnZSIsImF1dGhvciIsImRhdGV0aW1lIiwibG9jYWxlIiwiZm9ybWF0Iiwic2luZ2xlTWVzc2FnZSIsImVtYWlsU2V0dGluZ3MiLCJzZXRPcGVyYXRvciIsIm9wZXJhdG9yIiwidXBkYXRlIiwiJHNldCIsIiRleGlzdHMiLCIkbmUiLCJyb2xlcyIsImZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUiLCJmaW5kQWdlbnRzIiwiZmluZE9ubGluZVVzZXJGcm9tTGlzdCIsInVzZXJMaXN0IiwiJGluIiwiY29uY2F0IiwiY29sbGVjdGlvbk9iaiIsIm1vZGVsIiwicmF3Q29sbGVjdGlvbiIsImZpbmRBbmRNb2RpZnkiLCJsaXZlY2hhdENvdW50IiwiJGluYyIsImNsb3NlT2ZmaWNlIiwic2VsZiIsIm9wZW5PZmZpY2UiLCJlbWFpbHMiLCJzdXJ2ZXlGZWVkYmFjayIsImZpbmRMaXZlY2hhdCIsImZpbHRlciIsIm9mZnNldCIsImV4dGVuZCIsInBhcnNlSW50IiwiZ2V0TmV4dExpdmVjaGF0Um9vbUNvZGUiLCJzZXR0aW5nc1JhdyIsIlNldHRpbmdzIiwiZmluZEJ5VmlzaXRvclRva2VuIiwiZmluZEJ5VmlzaXRvcklkIiwidmlzaXRvcklkIiwicmVzcG9uc2VCeSIsIiR1bnNldCIsImNsb3NlQnlSb29tSWQiLCJjbG9zZUluZm8iLCJjbG9zZXIiLCJjbG9zZWRCeSIsImNsb3NlZEF0IiwiY2hhdER1cmF0aW9uIiwic2V0TGFiZWxCeVJvb21JZCIsImZpbmRPcGVuQnlBZ2VudCIsIm5ld0FnZW50IiwiY3JtRGF0YSIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJpc0NsaWVudCIsIl9pbml0TW9kZWwiLCJmaW5kQnlSb29tSWQiLCJyZWNvcmQiLCJyZW1vdmUiLCJ0cnlFbnN1cmVJbmRleCIsIm51bUFnZW50cyIsImZpbmRCeURlcGFydG1lbnRJZCIsImNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudCIsInNob3dPblJlZ2lzdHJhdGlvbiIsImFnZW50cyIsInNhdmVkQWdlbnRzIiwicGx1Y2siLCJMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMiLCJhZ2VudHNUb1NhdmUiLCJkaWZmZXJlbmNlIiwicmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkIiwic2F2ZUFnZW50Iiwib3JkZXIiLCIkZ3QiLCJ1cHNlcnQiLCJnZXROZXh0QWdlbnRGb3JEZXBhcnRtZW50Iiwib25saW5lVXNlcnMiLCJvbmxpbmVVc2VybmFtZXMiLCJnZXRPbmxpbmVGb3JEZXBhcnRtZW50IiwiZGVwQWdlbnRzIiwiZmluZFVzZXJzSW5RdWV1ZSIsInVzZXJzTGlzdCIsInNwYXJzZSIsImV4cGlyZUFmdGVyU2Vjb25kcyIsInNhdmVCeVRva2VuIiwia2VlcEhpc3RvcnlNaWxpc2Vjb25kcyIsImV4cGlyZUF0IiwiZmluZEJ5VG9rZW4iLCJtdWx0aSIsInJlbW92ZUFsbCIsImZpbmRCeUlkIiwiZ2V0U3RhdHVzIiwibmV3U3RhcnQiLCJuZXdGaW5pc2giLCJuZXdPcGVuIiwiaXNOb3dXaXRoaW5Ib3VycyIsImN1cnJlbnRUaW1lIiwidXRjIiwidG9kYXlzT2ZmaWNlSG91cnMiLCJpc0JlZm9yZSIsImlzQmV0d2VlbiIsImlzT3BlbmluZ1RpbWUiLCJpc1NhbWUiLCJpc0Nsb3NpbmdUaW1lIiwiZmluZFZpc2l0b3JCeVRva2VuIiwiZmluZE9uZVZpc2l0b3JCeVBob25lIiwiZ2V0TmV4dFZpc2l0b3JVc2VybmFtZSIsInNhdmVHdWVzdEJ5SWQiLCJzZXREYXRhIiwidW5zZXREYXRhIiwiYWRkcmVzcyIsInBob25lTnVtYmVyIiwiZmluZE9uZUd1ZXN0QnlFbWFpbEFkZHJlc3MiLCJlbWFpbEFkZHJlc3MiLCJlc2NhcGVSZWdFeHAiLCJwaG9uZXMiLCIkYWRkVG9TZXQiLCJzYXZlRW1haWwiLCIkZWFjaCIsInNhdmVQaG9uZSIsImV4cG9ydERlZmF1bHQiLCJVQVBhcnNlciIsImhpc3RvcnlNb25pdG9yVHlwZSIsImxvZ2dlciIsIkxvZ2dlciIsInNlY3Rpb25zIiwid2ViaG9vayIsImkiLCJxdWVyeVN0cmluZyIsImdldEFnZW50cyIsImdldE9ubGluZUFnZW50cyIsIm9ubGluZVJlcXVpcmVkIiwiZGVwdCIsIm9ubGluZUFnZW50cyIsInJvb21JbmZvIiwibmV3Um9vbSIsInJvdXRpbmdNZXRob2QiLCJRdWV1ZU1ldGhvZHMiLCJhbGlhcyIsInNob3dDb25uZWN0aW5nIiwidXBkYXRlVXNlciIsImV4aXN0aW5nVXNlciIsInVzZXJEYXRhIiwiY29ubmVjdGlvbiIsInVzZXJBZ2VudCIsImh0dHBIZWFkZXJzIiwiY2xpZW50QWRkcmVzcyIsIm51bWJlciIsInVzZXJzIiwiY2xvc2VEYXRhIiwiZ3JvdXBhYmxlIiwiaGlkZUJ5Um9vbUlkQW5kVXNlcklkIiwiZmluZE5vdEhpZGRlblB1YmxpYyIsInNldFRvcGljQW5kVGFnc0J5SWQiLCJ1cGRhdGVOYW1lQnlSb29tSWQiLCJjbG9zZU9wZW5DaGF0cyIsImZvcndhcmRPcGVuQ2hhdHMiLCJjaGFuZ2UiLCJ3aXRob3V0IiwicmVtb3ZlQnlSb29tSWRBbmRVc2VySWQiLCJjcmVhdGVVc2VyTGVhdmVXaXRoUm9vbUlkQW5kVXNlciIsImNyZWF0ZVVzZXJKb2luV2l0aFJvb21JZEFuZFVzZXIiLCJjYWxsYmFjayIsInRyeWluZyIsIndhcm4iLCJzZXRUaW1lb3V0IiwidWEiLCJzZXRVQSIsImxtIiwiZ2V0T1MiLCJ2ZXJzaW9uIiwiZ2V0QnJvd3NlciIsImFkZFVzZXJSb2xlcyIsInJlbW92ZVVzZXJGcm9tUm9sZXMiLCJTdHJlYW1lciIsImFsbG93UmVhZCIsInJvb21Db2RlIiwibXNncyIsImFnZW50SWRzIiwic2V0SW50ZXJ2YWwiLCJnYXRld2F5VVJMIiwicGFnZUlkIiwiU01TIiwic21zIiwiU01TU2VydmljZSIsImdldFNlcnZpY2UiLCJhZ2VudHNIYW5kbGVyIiwibW9uaXRvckFnZW50cyIsImFjdGlvblRpbWVvdXQiLCJxdWV1ZSIsImNsZWFyVGltZW91dCIsImV4aXN0cyIsInJ1bkFnZW50TGVhdmVBY3Rpb24iLCJvYnNlcnZlQ2hhbmdlcyIsImFkZGVkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJzdG9wIiwiVXNlclByZXNlbmNlTW9uaXRvciIsIm9uU2V0VXNlclN0YXR1cyIsInB1Ymxpc2giLCJoYW5kbGUiLCJnZXRVc2Vyc0luUm9sZSIsInJlYWR5Iiwib25TdG9wIiwiZmluZEJ5SWRzIiwiJGd0ZSIsInNldERhdGUiLCJnZXREYXRlIiwic2V0U2Vjb25kcyIsImdldFNlY29uZHMiLCIkbHRlIiwiaGFuZGxlRGVwdHMiLCJSb2xlcyIsImNyZWF0ZU9yVXBkYXRlIiwiUGVybWlzc2lvbnMiLCJNZXNzYWdlVHlwZXMiLCJyZWdpc3RlclR5cGUiLCJzeXN0ZW0iLCJyZWdpc3RlciIsImluc3RhbmNlIiwidGFiQmFyIiwiaXNTZXJ2ZXIiLCJOb3RpZmljYXRpb25zIiwibm90aWZ5Um9vbSIsInNldEhpZGRlbkJ5SWQiLCJSb29tU2V0dGluZ3NFbnVtIiwiUm9vbVR5cGVDb25maWciLCJSb29tVHlwZVJvdXRlQ29uZmlnIiwiVWlUZXh0Q29udGV4dCIsIkxpdmVjaGF0Um9vbVJvdXRlIiwicGF0aCIsIm9wZW5Sb29tIiwibGluayIsInN1YiIsIkxpdmVjaGF0Um9vbVR5cGUiLCJpZGVudGlmaWVyIiwicm91dGUiLCJub3RTdWJzY3JpYmVkVHBsIiwidGVtcGxhdGUiLCJmaW5kUm9vbSIsIkNoYXRSb29tIiwicm9vbU5hbWUiLCJjb25kaXRpb24iLCJoYXNBbGxQZXJtaXNzaW9uIiwiY2FuU2VuZE1lc3NhZ2UiLCJnZXRVc2VyU3RhdHVzIiwiU2Vzc2lvbiIsImFsbG93Um9vbVNldHRpbmdDaGFuZ2UiLCJKT0lOX0NPREUiLCJnZXRVaVRleHQiLCJjb250ZXh0IiwiSElERV9XQVJOSU5HIiwiTEVBVkVfV0FSTklORyIsImFkZEdyb3VwIiwiZ3JvdXAiLCJwdWJsaWMiLCJzZWN0aW9uIiwiaTE4bkRlc2NyaXB0aW9uIiwiZW5hYmxlUXVlcnkiLCJBUEkiLCJ2MSIsImFkZFJvdXRlIiwiYXV0aFJlcXVpcmVkIiwidW5hdXRob3JpemVkIiwiYm9keVBhcmFtcyIsImZhaWx1cmUiLCJ1cmxQYXJhbXMiLCJwdXQiLCJkZWxldGUiLCJjcnlwdG8iLCJhdHRhY2htZW50cyIsInJlcXVlc3QiLCJzaWduYXR1cmUiLCJjcmVhdGVIbWFjIiwiYm9keSIsImRpZ2VzdCIsIm1pZCIsInJvb21zIiwiZmlyc3RfbmFtZSIsImxhc3RfbmFtZSIsInN1Y2VzcyIsInNlcnZpY2UiLCJleHRyYSIsImZyb21Db3VudHJ5IiwiZnJvbVN0YXRlIiwiZnJvbUNpdHkiLCJyb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxHQUFKO0FBQVFMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxLQUFSLENBQWIsRUFBNEI7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLFVBQUlELENBQUo7QUFBTTs7QUFBbEIsQ0FBNUIsRUFBZ0QsQ0FBaEQ7QUFJdEVFLFNBQVNDLFFBQVFDLE1BQVIsQ0FBZUYsTUFBeEI7QUFDQSxNQUFNRyxhQUFhRixRQUFRRyxVQUFSLENBQW1CRCxVQUF0QztBQUVBSCxPQUFPSyxlQUFQLENBQXVCQyxHQUF2QixDQUEyQixXQUEzQixFQUF3Q0MsT0FBT0MsZUFBUCxDQUF1QixDQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWCxLQUFvQjtBQUNsRixRQUFNQyxTQUFTYixJQUFJYyxLQUFKLENBQVVKLElBQUlWLEdBQWQsQ0FBZjs7QUFDQSxNQUFJYSxPQUFPRSxRQUFQLEtBQW9CLEdBQXhCLEVBQTZCO0FBQzVCLFdBQU9ILE1BQVA7QUFDQTs7QUFDREQsTUFBSUssU0FBSixDQUFjLGNBQWQsRUFBOEIsMEJBQTlCO0FBRUEsTUFBSUMsa0JBQWtCQyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qiw2QkFBeEIsQ0FBdEI7O0FBQ0EsTUFBSVYsSUFBSVcsT0FBSixDQUFZQyxPQUFaLElBQXVCLENBQUM1QixFQUFFNkIsT0FBRixDQUFVTixnQkFBZ0JPLElBQWhCLEVBQVYsQ0FBNUIsRUFBK0Q7QUFDOURQLHNCQUFrQnZCLEVBQUUrQixHQUFGLENBQU1SLGdCQUFnQlMsS0FBaEIsQ0FBc0IsR0FBdEIsQ0FBTixFQUFrQyxVQUFTQyxNQUFULEVBQWlCO0FBQ3BFLGFBQU9BLE9BQU9ILElBQVAsRUFBUDtBQUNBLEtBRmlCLENBQWxCO0FBSUEsVUFBTUYsVUFBVXRCLElBQUljLEtBQUosQ0FBVUosSUFBSVcsT0FBSixDQUFZQyxPQUF0QixDQUFoQjs7QUFDQSxRQUFJLENBQUM1QixFQUFFa0MsUUFBRixDQUFXWCxlQUFYLEVBQTRCSyxRQUFRTyxJQUFwQyxDQUFMLEVBQWdEO0FBQy9DbEIsVUFBSUssU0FBSixDQUFjLGlCQUFkLEVBQWlDLE1BQWpDO0FBQ0EsYUFBT0osTUFBUDtBQUNBOztBQUVERCxRQUFJSyxTQUFKLENBQWMsaUJBQWQsRUFBa0MsY0FBY00sUUFBUVEsUUFBVSxLQUFLUixRQUFRTyxJQUFNLEVBQXJGO0FBQ0E7O0FBRUQsUUFBTUUsT0FBT0MsT0FBT0MsT0FBUCxDQUFlLGtCQUFmLENBQWI7QUFFQSxNQUFJQyxPQUFKOztBQUNBLE1BQUlDLDBCQUEwQkMsb0JBQTFCLElBQWtERCwwQkFBMEJDLG9CQUExQixDQUErQ1osSUFBL0MsT0FBMEQsRUFBaEgsRUFBb0g7QUFDbkhVLGNBQVVDLDBCQUEwQkMsb0JBQXBDO0FBQ0EsR0FGRCxNQUVPO0FBQ05GLGNBQVUsR0FBVjtBQUNBOztBQUNELE1BQUksTUFBTUcsSUFBTixDQUFXSCxPQUFYLE1BQXdCLEtBQTVCLEVBQW1DO0FBQ2xDQSxlQUFXLEdBQVg7QUFDQTs7QUFFRCxRQUFNSSxPQUFROzt5RUFFMkRKLE9BQVMsNkJBQTZCOUIsV0FBV21DLGlCQUFtQjs7a0NBRTNHQyxLQUFLQyxTQUFMLENBQWVOLHlCQUFmLENBQTJDOzs7aUJBRzVERCxPQUFTOztLQUVyQkgsSUFBTTs7O3lDQUc4QkcsT0FBUyw0QkFBNEI5QixXQUFXbUMsaUJBQW1COztTQVo1RztBQWdCQTVCLE1BQUkrQixLQUFKLENBQVVKLElBQVY7QUFDQTNCLE1BQUlnQyxHQUFKO0FBQ0EsQ0FwRHVDLENBQXhDLEU7Ozs7Ozs7Ozs7O0FDUEFuQyxPQUFPb0MsT0FBUCxDQUFlLE1BQU07QUFDcEIxQixhQUFXMkIsU0FBWCxDQUFxQkMsV0FBckIsQ0FBaUMsR0FBakMsRUFBdUNDLElBQUQsSUFBVTtBQUMvQyxXQUFPN0IsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxrQkFBeEIsQ0FBMkNILElBQTNDLENBQVA7QUFDQSxHQUZEO0FBSUE3QixhQUFXaUMsS0FBWCxDQUFpQkMsc0JBQWpCLENBQXdDLFVBQVNDLElBQVQsRUFBZUMsSUFBZixFQUFxQjtBQUM1RCxXQUFPRCxLQUFLRSxDQUFMLEtBQVcsR0FBWCxJQUFrQkQsSUFBbEIsSUFBMEJwQyxXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JGLEtBQUtHLEdBQXBDLEVBQXlDLHFCQUF6QyxDQUFqQztBQUNBLEdBRkQ7QUFJQXZDLGFBQVdpQyxLQUFYLENBQWlCQyxzQkFBakIsQ0FBd0MsVUFBU0MsSUFBVCxFQUFlQyxJQUFmLEVBQXFCSSxTQUFyQixFQUFnQztBQUN2RSxXQUFPTCxLQUFLRSxDQUFMLEtBQVcsR0FBWCxJQUFrQkcsU0FBbEIsSUFBK0JBLFVBQVVDLEtBQXpDLElBQWtETixLQUFLdEQsQ0FBdkQsSUFBNERzRCxLQUFLdEQsQ0FBTCxDQUFPNEQsS0FBUCxLQUFpQkQsVUFBVUMsS0FBOUY7QUFDQSxHQUZEO0FBSUF6QyxhQUFXMEMsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsaUJBQXpCLEVBQTRDLFVBQVNQLElBQVQsRUFBZUQsSUFBZixFQUFxQjtBQUNoRSxRQUFJQSxLQUFLRSxDQUFMLEtBQVcsR0FBZixFQUFvQjtBQUNuQixhQUFPRCxJQUFQO0FBQ0E7O0FBQ0QsVUFBTSxJQUFJOUMsT0FBT3NELEtBQVgsQ0FBaUJDLFFBQVFDLEVBQVIsQ0FBVyw0REFBWCxFQUF5RTtBQUMvRkMsV0FBS1gsS0FBS1ksUUFBTCxJQUFpQmhELFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBQWpCLElBQXdEO0FBRGtDLEtBQXpFLENBQWpCLENBQU47QUFHQSxHQVBELEVBT0dGLFdBQVcwQyxTQUFYLENBQXFCTyxRQUFyQixDQUE4QkMsR0FQakMsRUFPc0MsaUJBUHRDO0FBUUEsQ0FyQkQsRTs7Ozs7Ozs7Ozs7QUNBQTtBQUNBNUQsT0FBT29DLE9BQVAsQ0FBZSxNQUFNO0FBQ3BCeUIscUJBQW1CQyxFQUFuQixDQUFzQixXQUF0QixFQUFtQyxDQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBa0JDLFFBQWxCLEtBQStCO0FBQ2pFLFFBQUlBLFlBQVlBLFNBQVNDLE9BQXpCLEVBQWtDO0FBQ2pDeEQsaUJBQVc4QixNQUFYLENBQWtCMkIsZUFBbEIsQ0FBa0NDLG1CQUFsQyxDQUFzREgsU0FBU0MsT0FBL0QsRUFBd0VGLE1BQXhFO0FBQ0F0RCxpQkFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCMkIsbUJBQXhCLENBQTRDSCxTQUFTQyxPQUFyRCxFQUE4REYsTUFBOUQ7QUFDQTtBQUNELEdBTEQ7QUFNQSxDQVBELEU7Ozs7Ozs7Ozs7O0FDREEsSUFBSTlFLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFHTixJQUFJOEUsbUJBQW1CLEtBQXZCO0FBQ0EsSUFBSUMsV0FBVyxFQUFmO0FBQ0EsSUFBSUMsZ0JBQWdCLElBQXBCO0FBQ0E3RCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qiw0QkFBeEIsRUFBc0QsVUFBUzRELEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUMxRUoscUJBQW1CSSxLQUFuQjtBQUNBLENBRkQ7QUFHQS9ELFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDhCQUF4QixFQUF3RCxVQUFTNEQsR0FBVCxFQUFjQyxLQUFkLEVBQXFCO0FBQzVFSCxhQUFXRyxLQUFYO0FBQ0EsQ0FGRDtBQUdBL0QsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsbUNBQXhCLEVBQTZELFVBQVM0RCxHQUFULEVBQWNDLEtBQWQsRUFBcUI7QUFDakZGLGtCQUFnQkUsS0FBaEI7QUFDQSxDQUZEO0FBSUEvRCxXQUFXMEMsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsa0JBQXpCLEVBQTZDLFVBQVNxQixPQUFULEVBQWtCN0IsSUFBbEIsRUFBd0I7QUFDcEU7QUFDQSxNQUFJLENBQUM2QixPQUFELElBQVlBLFFBQVFDLFFBQXhCLEVBQWtDO0FBQ2pDLFdBQU9ELE9BQVA7QUFDQTs7QUFFRCxNQUFJLENBQUNMLGdCQUFMLEVBQXVCO0FBQ3RCLFdBQU9LLE9BQVA7QUFDQTs7QUFFRCxNQUFJLEVBQUUsT0FBTzdCLEtBQUtFLENBQVosS0FBa0IsV0FBbEIsSUFBaUNGLEtBQUtFLENBQUwsS0FBVyxHQUE1QyxJQUFtREYsS0FBS3RELENBQXhELElBQTZEc0QsS0FBS3RELENBQUwsQ0FBTzRELEtBQXRFLENBQUosRUFBa0Y7QUFDakYsV0FBT3VCLE9BQVA7QUFDQSxHQVptRSxDQWNwRTs7O0FBQ0EsTUFBSSxDQUFDQSxRQUFRdkIsS0FBYixFQUFvQjtBQUNuQixXQUFPdUIsT0FBUDtBQUNBOztBQUVEMUUsU0FBTzRFLEtBQVAsQ0FBYSxNQUFNO0FBQ2xCLFFBQUk7QUFDSCxZQUFNQyxXQUFXQyxLQUFLQyxJQUFMLENBQVUseUNBQVYsRUFBcUQ7QUFDckVDLGNBQU07QUFDTEMsaUJBQU9QLFFBQVFRLEdBRFY7QUFFTEMsZ0JBQU1aLGFBRkQ7QUFHTGEscUJBQVd2QyxLQUFLSTtBQUhYLFNBRCtEO0FBTXJFcEMsaUJBQVM7QUFDUiwwQkFBZ0IsaUNBRFI7QUFFUiwyQkFBa0IsVUFBVXlELFFBQVU7QUFGOUI7QUFONEQsT0FBckQsQ0FBakI7O0FBWUEsVUFBSU8sU0FBU0csSUFBVCxJQUFpQkgsU0FBU0csSUFBVCxDQUFjaEIsTUFBZCxDQUFxQnpCLElBQXJCLEtBQThCLEdBQS9DLElBQXNELENBQUNyRCxFQUFFNkIsT0FBRixDQUFVOEQsU0FBU0csSUFBVCxDQUFjSyxNQUFkLENBQXFCQyxXQUFyQixDQUFpQ0MsTUFBM0MsQ0FBM0QsRUFBK0c7QUFDOUc3RSxtQkFBVzhCLE1BQVgsQ0FBa0JnRCx1QkFBbEIsQ0FBMENDLE1BQTFDLENBQWlEO0FBQ2hEQyxlQUFLaEIsUUFBUWdCLEdBRG1DO0FBRWhEUixlQUFLTCxTQUFTRyxJQUFULENBQWNLLE1BQWQsQ0FBcUJDLFdBQXJCLENBQWlDQyxNQUZVO0FBR2hESSxnQkFBTWpCLFFBQVF6QixHQUhrQztBQUloRDJDLGNBQUksSUFBSUMsSUFBSjtBQUo0QyxTQUFqRDtBQU1BO0FBQ0QsS0FyQkQsQ0FxQkUsT0FBT0MsQ0FBUCxFQUFVO0FBQ1hDLG1CQUFhQyxLQUFiLENBQW1CLHVCQUFuQixFQUE0Q0YsQ0FBNUM7QUFDQTtBQUNELEdBekJEO0FBMkJBLFNBQU9wQixPQUFQO0FBQ0EsQ0EvQ0QsRUErQ0doRSxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEJDLEdBL0NqQyxFQStDc0MsaUJBL0N0QyxFOzs7Ozs7Ozs7OztBQ2hCQSxJQUFJcUMsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsc0NBQVIsQ0FBYixFQUE2RDtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUE3RCxFQUE4RixDQUE5Rjs7QUFFckIsU0FBUzJHLGVBQVQsQ0FBeUJ4QixPQUF6QixFQUFrQzdCLElBQWxDLEVBQXdDO0FBQ3ZDO0FBQ0EsTUFBSTZCLFFBQVFDLFFBQVosRUFBc0I7QUFDckIsV0FBTyxLQUFQO0FBQ0EsR0FKc0MsQ0FNdkM7OztBQUNBLE1BQUksRUFBRSxPQUFPOUIsS0FBS0UsQ0FBWixLQUFrQixXQUFsQixJQUFpQ0YsS0FBS0UsQ0FBTCxLQUFXLEdBQTVDLElBQW1ERixLQUFLdEQsQ0FBeEQsSUFBNkRzRCxLQUFLdEQsQ0FBTCxDQUFPNEQsS0FBdEUsQ0FBSixFQUFrRjtBQUNqRixXQUFPLEtBQVA7QUFDQSxHQVRzQyxDQVd2Qzs7O0FBQ0EsTUFBSSxDQUFDdUIsUUFBUXZCLEtBQWIsRUFBb0I7QUFDbkIsV0FBTyxLQUFQO0FBQ0EsR0Fkc0MsQ0FnQnZDOzs7QUFDQSxNQUFJdUIsUUFBUTNCLENBQVosRUFBZTtBQUNkLFdBQU8sS0FBUDtBQUNBOztBQUVELFNBQU8sSUFBUDtBQUNBOztBQUVEckMsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGtCQUF6QixFQUE2QyxVQUFTcUIsT0FBVCxFQUFrQjdCLElBQWxCLEVBQXdCO0FBQ3BFLE1BQUksQ0FBQ3FELGdCQUFnQnhCLE9BQWhCLEVBQXlCN0IsSUFBekIsQ0FBTCxFQUFxQztBQUNwQyxXQUFPNkIsT0FBUDtBQUNBOztBQUVELFFBQU15QixjQUFjLElBQUlDLE1BQUosQ0FBVzFGLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQUFYLEVBQWlFLEdBQWpFLENBQXBCO0FBQ0EsUUFBTXlGLFlBQVkzQixRQUFRUSxHQUFSLENBQVlvQixLQUFaLENBQWtCSCxXQUFsQixDQUFsQjtBQUVBLFFBQU1JLGNBQWMsSUFBSUgsTUFBSixDQUFXMUYsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsMkJBQXhCLENBQVgsRUFBaUUsSUFBakUsQ0FBcEI7QUFDQSxRQUFNNEYsWUFBWTlCLFFBQVFRLEdBQVIsQ0FBWW9CLEtBQVosQ0FBa0JDLFdBQWxCLENBQWxCOztBQUVBLE1BQUlDLGFBQWFILFNBQWpCLEVBQTRCO0FBQzNCSixxQkFBaUJRLHVCQUFqQixDQUF5QzVELEtBQUt0RCxDQUFMLENBQU8wRCxHQUFoRCxFQUFxRHVELFNBQXJELEVBQWdFSCxTQUFoRTtBQUVBM0YsZUFBVzBDLFNBQVgsQ0FBcUJzRCxHQUFyQixDQUF5QixzQkFBekIsRUFBaUQ3RCxJQUFqRDtBQUNBOztBQUVELFNBQU82QixPQUFQO0FBQ0EsQ0FsQkQsRUFrQkdoRSxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEJDLEdBbEJqQyxFQWtCc0MsYUFsQnRDLEU7Ozs7Ozs7Ozs7O0FDMUJBbEQsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGtCQUF6QixFQUE2QyxVQUFTcUIsT0FBVCxFQUFrQjdCLElBQWxCLEVBQXdCO0FBQ3BFO0FBQ0EsTUFBSSxDQUFDNkIsT0FBRCxJQUFZQSxRQUFRQyxRQUF4QixFQUFrQztBQUNqQyxXQUFPRCxPQUFQO0FBQ0EsR0FKbUUsQ0FNcEU7OztBQUNBLE1BQUksRUFBRSxPQUFPN0IsS0FBS0UsQ0FBWixLQUFrQixXQUFsQixJQUFpQ0YsS0FBS0UsQ0FBTCxLQUFXLEdBQTVDLElBQW1ERixLQUFLOEQsZUFBMUQsQ0FBSixFQUFnRjtBQUMvRSxXQUFPakMsT0FBUDtBQUNBLEdBVG1FLENBV3BFOzs7QUFDQSxNQUFJQSxRQUFRdkIsS0FBWixFQUFtQjtBQUNsQixXQUFPdUIsT0FBUDtBQUNBOztBQUVEMUUsU0FBTzRFLEtBQVAsQ0FBYSxNQUFNO0FBQ2xCLFVBQU1nQyxNQUFNLElBQUlmLElBQUosRUFBWjtBQUNBbkYsZUFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCb0UsbUJBQXhCLENBQTRDaEUsS0FBS0ksR0FBakQsRUFBc0Q7QUFDckRILFlBQU07QUFDTEcsYUFBS3lCLFFBQVFvQyxDQUFSLENBQVU3RCxHQURWO0FBRUw4RCxrQkFBVXJDLFFBQVFvQyxDQUFSLENBQVVDO0FBRmYsT0FEK0M7QUFLckRDLG9CQUFjSixHQUx1QztBQU1yREssb0JBQWMsQ0FBQ0wsSUFBSU0sT0FBSixLQUFnQnJFLEtBQUsrQyxFQUF0QixJQUE0QjtBQU5XLEtBQXREO0FBUUEsR0FWRDtBQVlBLFNBQU9sQixPQUFQO0FBQ0EsQ0E3QkQsRUE2QkdoRSxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEJDLEdBN0JqQyxFQTZCc0MsbUJBN0J0QyxFOzs7Ozs7Ozs7OztBQ0FBbEQsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLHlCQUF6QixFQUFxRDJCLElBQUQsSUFBVTtBQUM3RCxNQUFJLENBQUN0RSxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixpQ0FBeEIsQ0FBTCxFQUFpRTtBQUNoRSxXQUFPb0UsSUFBUDtBQUNBOztBQUVELFFBQU1tQyxXQUFXO0FBQ2hCQyxVQUFNLHdCQURVO0FBRWhCQyxZQUFRLElBQUl4QixJQUFKLEVBRlE7QUFHaEIzQixhQUFTO0FBQ1JvRCxZQUFNdEMsS0FBS3NDLElBREg7QUFFUkMsYUFBT3ZDLEtBQUt1QztBQUZKLEtBSE87QUFPaEI3QyxhQUFTTSxLQUFLTjtBQVBFLEdBQWpCO0FBVUFoRSxhQUFXOEcsUUFBWCxDQUFvQkMsV0FBcEIsQ0FBZ0NOLFFBQWhDO0FBQ0EsQ0FoQkQsRUFnQkd6RyxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEIrRCxNQWhCakMsRUFnQnlDLHFDQWhCekMsRTs7Ozs7Ozs7Ozs7QUNBQSxTQUFTQyxlQUFULENBQXlCOUUsSUFBekIsRUFBK0I7QUFDOUIsTUFBSSxDQUFDbkMsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsMEJBQXhCLENBQUwsRUFBMEQ7QUFDekQsV0FBT2lDLElBQVA7QUFDQTs7QUFFRCxRQUFNK0UsZUFBZWxILFdBQVc4RyxRQUFYLENBQW9CSyx3QkFBcEIsQ0FBNkNoRixJQUE3QyxDQUFyQjs7QUFFQSxNQUFJLENBQUMrRSxhQUFhMUQsT0FBYixDQUFxQnFELEtBQTFCLEVBQWlDO0FBQ2hDLFdBQU8xRSxJQUFQO0FBQ0E7O0FBRUQsUUFBTWlGLFVBQVU7QUFDZmpILGFBQVM7QUFDUixzQkFBZ0I7QUFEUixLQURNO0FBSWZtRSxVQUFNO0FBQ0wrQyx1QkFBaUJySCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwwQkFBeEIsQ0FEWjtBQUVMb0gscUJBQWUscUJBRlY7QUFHTEMsaUJBQVdMLGFBQWExRCxPQUFiLENBQXFCakIsR0FIM0I7QUFJTHNFLGFBQU9LLGFBQWExRCxPQUFiLENBQXFCcUQ7QUFKdkI7QUFKUyxHQUFoQjtBQVlBTyxVQUFROUMsSUFBUixDQUFha0QsSUFBYixHQUFvQk4sYUFBYTFELE9BQWIsQ0FBcUJvRCxJQUFyQixJQUE2Qk0sYUFBYTFELE9BQWIsQ0FBcUI2QyxRQUF0RTs7QUFFQSxNQUFJYSxhQUFhMUQsT0FBYixDQUFxQmlFLEtBQXpCLEVBQWdDO0FBQy9CTCxZQUFROUMsSUFBUixDQUFhb0QsUUFBYixHQUF3QlIsYUFBYTFELE9BQWIsQ0FBcUJpRSxLQUE3QztBQUNBOztBQUVELE1BQUlQLGFBQWFTLElBQWpCLEVBQXVCO0FBQ3RCUCxZQUFROUMsSUFBUixDQUFhcUQsSUFBYixHQUFvQlQsYUFBYVMsSUFBakM7QUFDQTs7QUFFREMsU0FBT0MsSUFBUCxDQUFZWCxhQUFhWSxZQUFiLElBQTZCLEVBQXpDLEVBQTZDQyxPQUE3QyxDQUFxREMsU0FBUztBQUM3RFosWUFBUTlDLElBQVIsQ0FBYTBELEtBQWIsSUFBc0JkLGFBQWFZLFlBQWIsQ0FBMEJFLEtBQTFCLENBQXRCO0FBQ0EsR0FGRDtBQUlBSixTQUFPQyxJQUFQLENBQVlYLGFBQWExRCxPQUFiLENBQXFCc0UsWUFBckIsSUFBcUMsRUFBakQsRUFBcURDLE9BQXJELENBQTZEQyxTQUFTO0FBQ3JFWixZQUFROUMsSUFBUixDQUFhMEQsS0FBYixJQUFzQmQsYUFBYTFELE9BQWIsQ0FBcUJzRSxZQUFyQixDQUFrQ0UsS0FBbEMsQ0FBdEI7QUFDQSxHQUZEOztBQUlBLE1BQUk7QUFDSDVELFNBQUs2RCxJQUFMLENBQVUsTUFBVixFQUFrQixrREFBbEIsRUFBc0ViLE9BQXRFO0FBQ0EsR0FGRCxDQUVFLE9BQU9oQyxDQUFQLEVBQVU7QUFDWDhDLFlBQVE1QyxLQUFSLENBQWMscUNBQWQsRUFBcURGLENBQXJEO0FBQ0E7O0FBRUQsU0FBT2pELElBQVA7QUFDQTs7QUFFRG5DLFdBQVcwQyxTQUFYLENBQXFCQyxHQUFyQixDQUF5QixvQkFBekIsRUFBK0NzRSxlQUEvQyxFQUFnRWpILFdBQVcwQyxTQUFYLENBQXFCTyxRQUFyQixDQUE4QitELE1BQTlGLEVBQXNHLGdDQUF0RztBQUVBaEgsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLG1CQUF6QixFQUE4Q3NFLGVBQTlDLEVBQStEakgsV0FBVzBDLFNBQVgsQ0FBcUJPLFFBQXJCLENBQThCK0QsTUFBN0YsRUFBcUcsK0JBQXJHLEU7Ozs7Ozs7Ozs7O0FDcERBLFNBQVNtQixTQUFULENBQW1CekIsSUFBbkIsRUFBeUJ2RSxJQUF6QixFQUErQmlHLGtCQUFrQixJQUFqRCxFQUF1RDtBQUN0RCxRQUFNM0IsV0FBV3pHLFdBQVc4RyxRQUFYLENBQW9CSyx3QkFBcEIsQ0FBNkNoRixJQUE3QyxDQUFqQjtBQUVBc0UsV0FBU0MsSUFBVCxHQUFnQkEsSUFBaEI7QUFFQUQsV0FBUzRCLFFBQVQsR0FBb0IsRUFBcEI7O0FBRUEsTUFBSUQsZUFBSixFQUFxQjtBQUNwQnBJLGVBQVc4QixNQUFYLENBQWtCd0csUUFBbEIsQ0FBMkJDLG1CQUEzQixDQUErQ3BHLEtBQUtJLEdBQXBELEVBQXlEO0FBQUVpRyxZQUFNO0FBQUV0RCxZQUFJO0FBQU47QUFBUixLQUF6RCxFQUE4RTZDLE9BQTlFLENBQXVGL0QsT0FBRCxJQUFhO0FBQ2xHLFVBQUlBLFFBQVEzQixDQUFaLEVBQWU7QUFDZDtBQUNBOztBQUNELFlBQU1tQyxNQUFNO0FBQ1g2QixrQkFBVXJDLFFBQVFvQyxDQUFSLENBQVVDLFFBRFQ7QUFFWDdCLGFBQUtSLFFBQVFRLEdBRkY7QUFHWFUsWUFBSWxCLFFBQVFrQjtBQUhELE9BQVo7O0FBTUEsVUFBSWxCLFFBQVFvQyxDQUFSLENBQVVDLFFBQVYsS0FBdUJJLFNBQVNqRCxPQUFULENBQWlCNkMsUUFBNUMsRUFBc0Q7QUFDckQ3QixZQUFJaUUsT0FBSixHQUFjekUsUUFBUW9DLENBQVIsQ0FBVTdELEdBQXhCO0FBQ0E7O0FBQ0RrRSxlQUFTNEIsUUFBVCxDQUFrQkssSUFBbEIsQ0FBdUJsRSxHQUF2QjtBQUNBLEtBZEQ7QUFlQTs7QUFFRCxRQUFNTCxXQUFXbkUsV0FBVzhHLFFBQVgsQ0FBb0JDLFdBQXBCLENBQWdDTixRQUFoQyxDQUFqQjs7QUFFQSxNQUFJdEMsWUFBWUEsU0FBU0csSUFBckIsSUFBNkJILFNBQVNHLElBQVQsQ0FBY0EsSUFBL0MsRUFBcUQ7QUFDcER0RSxlQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0I0RyxtQkFBeEIsQ0FBNEN4RyxLQUFLSSxHQUFqRCxFQUFzRDRCLFNBQVNHLElBQVQsQ0FBY0EsSUFBcEU7QUFDQTs7QUFFRCxTQUFPbkMsSUFBUDtBQUNBOztBQUVEbkMsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLG9CQUF6QixFQUFnRFIsSUFBRCxJQUFVO0FBQ3hELE1BQUksQ0FBQ25DLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQUFMLEVBQTJEO0FBQzFELFdBQU9pQyxJQUFQO0FBQ0E7O0FBRUQsU0FBT2dHLFVBQVUsaUJBQVYsRUFBNkJoRyxJQUE3QixDQUFQO0FBQ0EsQ0FORCxFQU1HbkMsV0FBVzBDLFNBQVgsQ0FBcUJPLFFBQXJCLENBQThCK0QsTUFOakMsRUFNeUMsOEJBTnpDO0FBUUFoSCxXQUFXMEMsU0FBWCxDQUFxQkMsR0FBckIsQ0FBeUIsbUJBQXpCLEVBQStDUixJQUFELElBQVU7QUFDdkQ7QUFDQSxNQUFJQSxLQUFLeUcsSUFBVCxFQUFlO0FBQ2QsV0FBT3pHLElBQVA7QUFDQTs7QUFFRCxTQUFPZ0csVUFBVSxjQUFWLEVBQTBCaEcsSUFBMUIsQ0FBUDtBQUNBLENBUEQsRUFPR25DLFdBQVcwQyxTQUFYLENBQXFCTyxRQUFyQixDQUE4QitELE1BUGpDLEVBT3lDLDZCQVB6QztBQVNBaEgsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLHNCQUF6QixFQUFrRFIsSUFBRCxJQUFVO0FBQzFELE1BQUksQ0FBQ25DLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDZCQUF4QixDQUFMLEVBQTZEO0FBQzVELFdBQU9pQyxJQUFQO0FBQ0E7O0FBQ0QsU0FBT2dHLFVBQVUsYUFBVixFQUF5QmhHLElBQXpCLEVBQStCLEtBQS9CLENBQVA7QUFDQSxDQUxELEVBS0duQyxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEIrRCxNQUxqQyxFQUt5QyxnQ0FMekMsRTs7Ozs7Ozs7Ozs7QUNuREEsSUFBSTZCLFdBQUo7QUFBZ0JwSyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsb0JBQVIsQ0FBYixFQUEyQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2dLLGtCQUFZaEssQ0FBWjtBQUFjOztBQUExQixDQUEzQyxFQUF1RSxDQUF2RTtBQUVoQm1CLFdBQVcwQyxTQUFYLENBQXFCQyxHQUFyQixDQUF5QixrQkFBekIsRUFBNkMsVUFBU3FCLE9BQVQsRUFBa0I3QixJQUFsQixFQUF3QjtBQUNwRTtBQUNBLE1BQUk2QixRQUFRQyxRQUFaLEVBQXNCO0FBQ3JCLFdBQU9ELE9BQVA7QUFDQTs7QUFFRCxNQUFJLENBQUNoRSxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBRCxJQUF5RCxDQUFDRixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBOUQsRUFBb0g7QUFDbkgsV0FBTzhELE9BQVA7QUFDQSxHQVJtRSxDQVVwRTs7O0FBQ0EsTUFBSSxFQUFFLE9BQU83QixLQUFLRSxDQUFaLEtBQWtCLFdBQWxCLElBQWlDRixLQUFLRSxDQUFMLEtBQVcsR0FBNUMsSUFBbURGLEtBQUsyRyxRQUF4RCxJQUFvRTNHLEtBQUt0RCxDQUF6RSxJQUE4RXNELEtBQUt0RCxDQUFMLENBQU80RCxLQUF2RixDQUFKLEVBQW1HO0FBQ2xHLFdBQU91QixPQUFQO0FBQ0EsR0FibUUsQ0FlcEU7OztBQUNBLE1BQUlBLFFBQVF2QixLQUFaLEVBQW1CO0FBQ2xCLFdBQU91QixPQUFQO0FBQ0EsR0FsQm1FLENBb0JwRTs7O0FBQ0EsTUFBSUEsUUFBUTNCLENBQVosRUFBZTtBQUNkLFdBQU8yQixPQUFQO0FBQ0E7O0FBRUQ2RSxjQUFZRSxLQUFaLENBQWtCO0FBQ2pCQyxVQUFNN0csS0FBSzJHLFFBQUwsQ0FBY0UsSUFBZCxDQUFtQkMsRUFEUjtBQUVqQnhHLFdBQU9OLEtBQUt0RCxDQUFMLENBQU80RCxLQUZHO0FBR2pCeUcsVUFBTWxGLFFBQVFRO0FBSEcsR0FBbEI7QUFNQSxTQUFPUixPQUFQO0FBRUEsQ0FqQ0QsRUFpQ0doRSxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEJDLEdBakNqQyxFQWlDc0MsdUJBakN0QyxFOzs7Ozs7Ozs7OztBQ0ZBNUQsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLHNCQUFvQjlDLFFBQXBCLEVBQThCO0FBQzdCLFFBQUksQ0FBQy9HLE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELHVCQUFoRCxDQUF6QixFQUFtRztBQUNsRyxZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVELFdBQU9ySixXQUFXOEcsUUFBWCxDQUFvQndDLFFBQXBCLENBQTZCakQsUUFBN0IsQ0FBUDtBQUNBOztBQVBhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQS9HLE9BQU82SixPQUFQLENBQWU7QUFDZCx3QkFBc0I5QyxRQUF0QixFQUFnQztBQUMvQixRQUFJLENBQUMvRyxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxXQUFPckosV0FBVzhHLFFBQVgsQ0FBb0J5QyxVQUFwQixDQUErQmxELFFBQS9CLENBQVA7QUFDQTs7QUFQYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDQUEvRyxPQUFPNkosT0FBUCxDQUFlO0FBQ2Qsb0NBQWtDO0FBQ2pDLFFBQUksQ0FBQzdKLE9BQU84SixNQUFQLEVBQUwsRUFBc0I7QUFDckIsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxVQUFNakgsT0FBTzlDLE9BQU84QyxJQUFQLEVBQWI7QUFFQSxVQUFNb0gsWUFBWXBILEtBQUtxSCxjQUFMLEtBQXdCLFdBQXhCLEdBQXNDLGVBQXRDLEdBQXdELFdBQTFFO0FBRUEsV0FBT3pKLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JDLGlCQUF4QixDQUEwQ3ZILEtBQUtHLEdBQS9DLEVBQW9EaUgsU0FBcEQsQ0FBUDtBQUNBOztBQVhhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQSxJQUFJakUsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUFuRCxFQUFvRixDQUFwRjtBQUVyQlMsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDRCQUEwQjtBQUFFUyxVQUFGO0FBQVVuSDtBQUFWLEdBQTFCLEVBQTZDO0FBQzVDLFVBQU1OLE9BQU9uQyxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0I4SCx5QkFBeEIsQ0FBa0RwSCxLQUFsRCxFQUF5RG1ILE1BQXpELENBQWI7O0FBRUEsUUFBSSxDQUFDekgsSUFBRCxJQUFTLENBQUNBLEtBQUt5RyxJQUFuQixFQUF5QjtBQUN4QixhQUFPLEtBQVA7QUFDQTs7QUFFRCxVQUFNcEYsVUFBVStCLGlCQUFpQnVFLGlCQUFqQixDQUFtQ3JILEtBQW5DLENBQWhCO0FBRUEsVUFBTU8sV0FBWVEsV0FBV0EsUUFBUVIsUUFBcEIsSUFBaUNoRCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUFqQyxJQUF3RSxJQUF6RjtBQUVBLFdBQU9GLFdBQVc4RyxRQUFYLENBQW9CaUQsU0FBcEIsQ0FBOEI7QUFDcEN2RyxhQURvQztBQUVwQ3JCLFVBRm9DO0FBR3BDNkgsZUFBU25ILFFBQVFDLEVBQVIsQ0FBVyxtQkFBWCxFQUFnQztBQUFFQyxhQUFLQztBQUFQLE9BQWhDO0FBSDJCLEtBQTlCLENBQVA7QUFLQTs7QUFqQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBMUQsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLHVCQUFxQlMsTUFBckIsRUFBNkJJLE9BQTdCLEVBQXNDO0FBQ3JDLFFBQUksQ0FBQzFLLE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELHFCQUFoRCxDQUF6QixFQUFpRztBQUNoRyxZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQTNELENBQU47QUFDQTs7QUFFRCxVQUFNbEgsT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DTCxNQUFwQyxDQUFiOztBQUVBLFFBQUksQ0FBQ3pILElBQUQsSUFBU0EsS0FBS0UsQ0FBTCxLQUFXLEdBQXhCLEVBQTZCO0FBQzVCLFlBQU0sSUFBSS9DLE9BQU9zRCxLQUFYLENBQWlCLGdCQUFqQixFQUFtQyxnQkFBbkMsRUFBcUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVELFVBQU1qSCxPQUFPOUMsT0FBTzhDLElBQVAsRUFBYjs7QUFFQSxRQUFJLENBQUMsQ0FBQ0QsS0FBSytILFNBQU4sSUFBbUIvSCxLQUFLK0gsU0FBTCxDQUFlQyxPQUFmLENBQXVCL0gsS0FBS2lFLFFBQTVCLE1BQTBDLENBQUMsQ0FBL0QsS0FBcUUsQ0FBQ3JHLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELDRCQUFoRCxDQUExRSxFQUF5SjtBQUN4SixZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQTNELENBQU47QUFDQTs7QUFFRCxXQUFPckosV0FBVzhHLFFBQVgsQ0FBb0JpRCxTQUFwQixDQUE4QjtBQUNwQzNILFVBRG9DO0FBRXBDRCxVQUZvQztBQUdwQzZIO0FBSG9DLEtBQTlCLENBQVA7QUFLQTs7QUF2QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUluQixXQUFKO0FBQWdCcEssT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG9CQUFSLENBQWIsRUFBMkM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNnSyxrQkFBWWhLLENBQVo7QUFBYzs7QUFBMUIsQ0FBM0MsRUFBdUUsQ0FBdkU7QUFFaEJTLE9BQU82SixPQUFQLENBQWU7QUFDZCxzQkFBb0IvQixPQUFwQixFQUE2QjtBQUM1QixRQUFJLENBQUM5SCxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxRQUFJO0FBQ0gsY0FBUWpDLFFBQVFnRCxNQUFoQjtBQUNDLGFBQUssY0FBTDtBQUFxQjtBQUNwQixtQkFBTztBQUNOQyx1QkFBU3JLLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQURIO0FBRU5vSyx3QkFBVSxDQUFDLENBQUN0SyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEI7QUFGTixhQUFQO0FBSUE7O0FBRUQsYUFBSyxRQUFMO0FBQWU7QUFDZCxrQkFBTXlFLFNBQVNrRSxZQUFZMEIsTUFBWixFQUFmOztBQUVBLGdCQUFJLENBQUM1RixPQUFPNkYsT0FBWixFQUFxQjtBQUNwQixxQkFBTzdGLE1BQVA7QUFDQTs7QUFFRCxtQkFBTzNFLFdBQVdDLFFBQVgsQ0FBb0J3SyxVQUFwQixDQUErQiwyQkFBL0IsRUFBNEQsSUFBNUQsQ0FBUDtBQUNBOztBQUVELGFBQUssU0FBTDtBQUFnQjtBQUNmNUIsd0JBQVk2QixPQUFaO0FBRUEsbUJBQU8xSyxXQUFXQyxRQUFYLENBQW9Cd0ssVUFBcEIsQ0FBK0IsMkJBQS9CLEVBQTRELEtBQTVELENBQVA7QUFDQTs7QUFFRCxhQUFLLFlBQUw7QUFBbUI7QUFDbEIsbUJBQU81QixZQUFZOEIsU0FBWixFQUFQO0FBQ0E7O0FBRUQsYUFBSyxXQUFMO0FBQWtCO0FBQ2pCLG1CQUFPOUIsWUFBWStCLFNBQVosQ0FBc0J4RCxRQUFRNEIsSUFBOUIsQ0FBUDtBQUNBOztBQUVELGFBQUssYUFBTDtBQUFvQjtBQUNuQixtQkFBT0gsWUFBWWdDLFdBQVosQ0FBd0J6RCxRQUFRNEIsSUFBaEMsQ0FBUDtBQUNBO0FBbENGO0FBb0NBLEtBckNELENBcUNFLE9BQU81RCxDQUFQLEVBQVU7QUFDWCxVQUFJQSxFQUFFakIsUUFBRixJQUFjaUIsRUFBRWpCLFFBQUYsQ0FBV0csSUFBekIsSUFBaUNjLEVBQUVqQixRQUFGLENBQVdHLElBQVgsQ0FBZ0JnQixLQUFyRCxFQUE0RDtBQUMzRCxZQUFJRixFQUFFakIsUUFBRixDQUFXRyxJQUFYLENBQWdCZ0IsS0FBaEIsQ0FBc0JBLEtBQTFCLEVBQWlDO0FBQ2hDLGdCQUFNLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQndDLEVBQUVqQixRQUFGLENBQVdHLElBQVgsQ0FBZ0JnQixLQUFoQixDQUFzQkEsS0FBdkMsRUFBOENGLEVBQUVqQixRQUFGLENBQVdHLElBQVgsQ0FBZ0JnQixLQUFoQixDQUFzQnRCLE9BQXBFLENBQU47QUFDQTs7QUFDRCxZQUFJb0IsRUFBRWpCLFFBQUYsQ0FBV0csSUFBWCxDQUFnQmdCLEtBQWhCLENBQXNCbkIsUUFBMUIsRUFBb0M7QUFDbkMsZ0JBQU0sSUFBSTdFLE9BQU9zRCxLQUFYLENBQWlCLG1CQUFqQixFQUFzQ3dDLEVBQUVqQixRQUFGLENBQVdHLElBQVgsQ0FBZ0JnQixLQUFoQixDQUFzQm5CLFFBQXRCLENBQStCbUIsS0FBL0IsQ0FBcUN0QixPQUEzRSxDQUFOO0FBQ0E7O0FBQ0QsWUFBSW9CLEVBQUVqQixRQUFGLENBQVdHLElBQVgsQ0FBZ0JnQixLQUFoQixDQUFzQnRCLE9BQTFCLEVBQW1DO0FBQ2xDLGdCQUFNLElBQUkxRSxPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0N3QyxFQUFFakIsUUFBRixDQUFXRyxJQUFYLENBQWdCZ0IsS0FBaEIsQ0FBc0J0QixPQUE1RCxDQUFOO0FBQ0E7QUFDRDs7QUFDRGtFLGNBQVE1QyxLQUFSLENBQWMsb0NBQWQsRUFBb0RGLENBQXBEO0FBQ0EsWUFBTSxJQUFJOUYsT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDd0MsRUFBRUUsS0FBeEMsQ0FBTjtBQUNBO0FBQ0Q7O0FBMURhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNGQWhHLE9BQU82SixPQUFQLENBQWU7QUFDZCwrQkFBNkI7QUFDNUIsV0FBT25KLFdBQVc4QixNQUFYLENBQWtCZ0osbUJBQWxCLENBQXNDQyxJQUF0QyxHQUE2Q0MsS0FBN0MsRUFBUDtBQUNBOztBQUhhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQSxJQUFJekYsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUFuRCxFQUFvRixDQUFwRjtBQUVyQlMsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDBCQUF3QjtBQUFFUyxVQUFGO0FBQVVuSDtBQUFWLEdBQXhCLEVBQTJDO0FBQzFDd0ksVUFBTXJCLE1BQU4sRUFBY3NCLE1BQWQ7QUFDQUQsVUFBTXhJLEtBQU4sRUFBYXlJLE1BQWI7QUFFQSxVQUFNL0ksT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DTCxNQUFwQyxDQUFiO0FBQ0EsVUFBTXBHLFVBQVUrQixpQkFBaUJ1RSxpQkFBakIsQ0FBbUNySCxLQUFuQyxDQUFoQixDQUwwQyxDQU8xQzs7QUFDQSxRQUFJLENBQUNOLElBQUQsSUFBU0EsS0FBS0UsQ0FBTCxLQUFXLEdBQXBCLElBQTJCLENBQUNGLEtBQUt0RCxDQUFqQyxJQUFzQ3NELEtBQUt0RCxDQUFMLENBQU80RCxLQUFQLEtBQWlCZSxRQUFRZixLQUFuRSxFQUEwRTtBQUN6RSxZQUFNLElBQUluRCxPQUFPc0QsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsQ0FBTjtBQUNBOztBQUVELFFBQUksQ0FBQ1QsS0FBS2dKLFFBQVYsRUFBb0I7QUFDbkI7QUFDQTs7QUFFRCxXQUFPbkwsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QjBCLFlBQXhCLENBQXFDakosS0FBS2dKLFFBQUwsQ0FBYzVJLEdBQW5ELENBQVA7QUFDQTs7QUFsQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBLElBQUkvRCxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUkwRyxnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQW5ELEVBQW9GLENBQXBGO0FBSW5GUyxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsNEJBQTBCa0MsWUFBMUIsRUFBd0M7QUFDdkMsVUFBTUMsT0FBTztBQUNaakIsZUFBUyxJQURHO0FBRVprQixhQUFPLElBRks7QUFHWkMsYUFBTyxJQUhLO0FBSVpDLHdCQUFrQixJQUpOO0FBS1p0SixZQUFNLElBTE07QUFNWnFCLGVBQVMsSUFORztBQU9aa0ksZ0JBQVUsRUFQRTtBQVFaQyxtQkFBYSxFQVJEO0FBU1pDLGlDQUEyQixJQVRmO0FBVVpDLGNBQVEsSUFWSTtBQVdaQyxvQkFBYyxJQVhGO0FBWVpDLHNCQUFnQixJQVpKO0FBYVpDLDZCQUF1QixJQWJYO0FBY1pDLGlDQUEyQixJQWRmO0FBZVpDLDBCQUFvQixJQWZSO0FBZ0JaQyxpQkFBVztBQWhCQyxLQUFiO0FBbUJBLFVBQU1oSyxPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcUssc0JBQXhCLENBQStDZixZQUEvQyxFQUE2RDtBQUN6RWdCLGNBQVE7QUFDUHpGLGNBQU0sQ0FEQztBQUVQdkUsV0FBRyxDQUZJO0FBR1BpSyxZQUFJLENBSEc7QUFJUGxHLFdBQUcsQ0FKSTtBQUtQOEQsbUJBQVcsQ0FMSjtBQU1QckwsV0FBRyxDQU5JO0FBT1BzTSxrQkFBVTtBQVBIO0FBRGlFLEtBQTdELEVBVVZILEtBVlUsRUFBYjs7QUFZQSxRQUFJN0ksUUFBUUEsS0FBS29LLE1BQUwsR0FBYyxDQUExQixFQUE2QjtBQUM1QmpCLFdBQUtuSixJQUFMLEdBQVlBLEtBQUssQ0FBTCxDQUFaO0FBQ0E7O0FBRUQsVUFBTXFCLFVBQVUrQixpQkFBaUJ1RSxpQkFBakIsQ0FBbUN1QixZQUFuQyxFQUFpRDtBQUNoRWdCLGNBQVE7QUFDUHpGLGNBQU0sQ0FEQztBQUVQUCxrQkFBVSxDQUZIO0FBR1BtRyx1QkFBZTtBQUhSO0FBRHdELEtBQWpELENBQWhCOztBQVFBLFFBQUlySyxJQUFKLEVBQVU7QUFDVG1KLFdBQUs5SCxPQUFMLEdBQWVBLE9BQWY7QUFDQTs7QUFFRCxVQUFNaUosZUFBZXpNLFdBQVc4RyxRQUFYLENBQW9CNEYsZUFBcEIsRUFBckI7QUFFQXBCLFNBQUtDLEtBQUwsR0FBYWtCLGFBQWFFLGNBQTFCO0FBQ0FyQixTQUFLRSxLQUFMLEdBQWFpQixhQUFhRyxvQkFBMUI7QUFDQXRCLFNBQUtqQixPQUFMLEdBQWVvQyxhQUFhSSxnQkFBNUI7QUFDQXZCLFNBQUtHLGdCQUFMLEdBQXdCZ0IsYUFBYUssMEJBQXJDO0FBQ0F4QixTQUFLeUIsWUFBTCxHQUFvQk4sYUFBYU8sc0JBQWpDO0FBQ0ExQixTQUFLUSxZQUFMLEdBQW9CVyxhQUFhUSw0QkFBakM7QUFDQTNCLFNBQUtTLGNBQUwsR0FBc0JVLGFBQWFTLHdCQUFuQztBQUNBNUIsU0FBS1UscUJBQUwsR0FBNkJTLGFBQWFVLGdDQUExQztBQUNBN0IsU0FBS1cseUJBQUwsR0FBaUNRLGFBQWFXLGlDQUE5QztBQUNBOUIsU0FBS1ksa0JBQUwsR0FBMEJPLGFBQWFZLDZCQUF2QztBQUNBL0IsU0FBS3RJLFFBQUwsR0FBZ0J5SixhQUFhYSxRQUE3QjtBQUNBaEMsU0FBS2EsU0FBTCxHQUFpQk0sYUFBYWMsMEJBQWIsS0FBNEMsSUFBNUMsSUFBb0RkLGFBQWFlLGFBQWIsS0FBK0IsSUFBcEc7QUFDQWxDLFNBQUttQyxVQUFMLEdBQWtCaEIsYUFBYWlCLDBCQUEvQjtBQUNBcEMsU0FBS3FDLGlCQUFMLEdBQXlCbEIsYUFBYW1CLDJCQUF0QztBQUVBdEMsU0FBS3VDLFNBQUwsR0FBaUIxTCxRQUFRQSxLQUFLLENBQUwsQ0FBUixJQUFtQkEsS0FBSyxDQUFMLEVBQVFnSixRQUEzQixJQUF1Q25MLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0IwQixZQUF4QixDQUFxQ2pKLEtBQUssQ0FBTCxFQUFRZ0osUUFBUixDQUFpQjVJLEdBQXRELENBQXhEO0FBRUF2QyxlQUFXOEIsTUFBWCxDQUFrQmdNLGVBQWxCLENBQWtDQyxXQUFsQyxHQUFnRGhHLE9BQWhELENBQXlEaUcsT0FBRCxJQUFhO0FBQ3BFMUMsV0FBS0ksUUFBTCxDQUFjaEQsSUFBZCxDQUFtQmxLLEVBQUV5UCxJQUFGLENBQU9ELE9BQVAsRUFBZ0IsS0FBaEIsRUFBdUIsU0FBdkIsRUFBa0MsWUFBbEMsQ0FBbkI7QUFDQSxLQUZEO0FBSUFoTyxlQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ0MscUJBQXJDLEdBQTZEcEcsT0FBN0QsQ0FBc0VxRyxVQUFELElBQWdCO0FBQ3BGOUMsV0FBS0ssV0FBTCxDQUFpQmpELElBQWpCLENBQXNCMEYsVUFBdEI7QUFDQSxLQUZEO0FBR0E5QyxTQUFLTSx5QkFBTCxHQUFpQ2EsYUFBYTRCLG9DQUE5QztBQUVBL0MsU0FBS08sTUFBTCxHQUFjN0wsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QjRFLGdCQUF4QixHQUEyQ0MsS0FBM0MsS0FBcUQsQ0FBbkU7QUFFQSxXQUFPakQsSUFBUDtBQUNBOztBQWhGYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDSkFoTSxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsMEJBQXdCO0FBQUUxRyxTQUFGO0FBQVMyTDtBQUFULEdBQXhCLEVBQStDO0FBQzlDbkQsVUFBTXhJLEtBQU4sRUFBYXlJLE1BQWI7QUFFQSxVQUFNL0ksT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QnFLLHNCQUF4QixDQUErQzNKLEtBQS9DLEVBQXNEdUksS0FBdEQsRUFBYjs7QUFFQSxRQUFJN0ksUUFBUUEsS0FBS29LLE1BQUwsR0FBYyxDQUExQixFQUE2QjtBQUM1QjtBQUNBOztBQUVELFFBQUksQ0FBQzZCLFVBQUwsRUFBaUI7QUFDaEIsWUFBTUksbUJBQW1CeE8sV0FBVzhHLFFBQVgsQ0FBb0IySCxxQkFBcEIsRUFBekI7O0FBQ0EsVUFBSUQsZ0JBQUosRUFBc0I7QUFDckJKLHFCQUFhSSxpQkFBaUJqTSxHQUE5QjtBQUNBO0FBQ0Q7O0FBRUQsVUFBTW1NLFFBQVExTyxXQUFXOEcsUUFBWCxDQUFvQjZILFlBQXBCLENBQWlDUCxVQUFqQyxDQUFkOztBQUNBLFFBQUksQ0FBQ00sS0FBTCxFQUFZO0FBQ1g7QUFDQTs7QUFFRCxXQUFPMU8sV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QjBCLFlBQXhCLENBQXFDc0QsTUFBTWpHLE9BQTNDLENBQVA7QUFDQTs7QUF2QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUlsRCxnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQW5ELEVBQW9GLENBQXBGO0FBRXJCUyxPQUFPNkosT0FBUCxDQUFlO0FBQ2QseUJBQXVCO0FBQUUxRyxTQUFGO0FBQVN1QyxPQUFUO0FBQWN2RCxPQUFkO0FBQW1CbU4sWUFBUSxFQUEzQjtBQUErQkM7QUFBL0IsR0FBdkIsRUFBMkQ7QUFDMUQsVUFBTXJMLFVBQVUrQixpQkFBaUJ1RSxpQkFBakIsQ0FBbUNySCxLQUFuQyxFQUEwQztBQUFFNEosY0FBUTtBQUFFOUosYUFBSztBQUFQO0FBQVYsS0FBMUMsQ0FBaEI7O0FBRUEsUUFBSSxDQUFDaUIsT0FBTCxFQUFjO0FBQ2I7QUFDQTs7QUFFRCxXQUFPeEQsV0FBVzhPLGtCQUFYLENBQThCO0FBQUUxRixjQUFRNUYsUUFBUWpCLEdBQWxCO0FBQXVCeUMsU0FBdkI7QUFBNEJ2RCxTQUE1QjtBQUFpQ21OLFdBQWpDO0FBQXdDQztBQUF4QyxLQUE5QixDQUFQO0FBQ0E7O0FBVGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBLElBQUl0SixnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQW5ELEVBQW9GLENBQXBGO0FBRXJCUyxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsMEJBQXdCMUcsS0FBeEIsRUFBK0I7QUFDOUIsVUFBTUwsT0FBT21ELGlCQUFpQnVFLGlCQUFqQixDQUFtQ3JILEtBQW5DLEVBQTBDO0FBQUU0SixjQUFRO0FBQUU5SixhQUFLO0FBQVA7QUFBVixLQUExQyxDQUFiOztBQUVBLFFBQUksQ0FBQ0gsSUFBTCxFQUFXO0FBQ1Y7QUFDQTs7QUFFRCxXQUFPO0FBQ05HLFdBQUtILEtBQUtHO0FBREosS0FBUDtBQUdBOztBQVhhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNGQWpELE9BQU82SixPQUFQLENBQWU7QUFDZCx5QkFBdUIxRyxLQUF2QixFQUE4QnNNLFFBQTlCLEVBQXdDO0FBQ3ZDLFdBQU8vTyxXQUFXOEcsUUFBWCxDQUFvQmtJLGVBQXBCLENBQW9Ddk0sS0FBcEMsRUFBMkNzTSxRQUEzQyxDQUFQO0FBQ0E7O0FBSGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBelAsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDJCQUF5QjtBQUFFMUcsU0FBRjtBQUFTbUUsUUFBVDtBQUFlQyxTQUFmO0FBQXNCdUg7QUFBdEIsTUFBcUMsRUFBOUQsRUFBa0U7QUFDakUsVUFBTWhGLFNBQVNwSixXQUFXOEcsUUFBWCxDQUFvQm1JLGFBQXBCLENBQWtDaEgsSUFBbEMsQ0FBdUMsSUFBdkMsRUFBNkM7QUFDM0R4RixXQUQyRDtBQUUzRG1FLFVBRjJEO0FBRzNEQyxXQUgyRDtBQUkzRHVIO0FBSjJELEtBQTdDLENBQWYsQ0FEaUUsQ0FRakU7O0FBQ0FwTyxlQUFXOEIsTUFBWCxDQUFrQm9OLG1CQUFsQixDQUFzQ0MsbUJBQXRDLENBQTBEMU0sS0FBMUQ7QUFFQSxXQUFPO0FBQ04yRztBQURNLEtBQVA7QUFHQTs7QUFmYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDQUE5SixPQUFPNkosT0FBUCxDQUFlO0FBQ2QseUJBQXVCOUMsUUFBdkIsRUFBaUM7QUFDaEMsUUFBSSxDQUFDL0csT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsdUJBQWhELENBQXpCLEVBQW1HO0FBQ2xHLFlBQU0sSUFBSTlKLE9BQU9zRCxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUFFeUcsZ0JBQVE7QUFBVixPQUFyRCxDQUFOO0FBQ0E7O0FBRUQsV0FBT3JKLFdBQVc4RyxRQUFYLENBQW9Cc0ksV0FBcEIsQ0FBZ0MvSSxRQUFoQyxDQUFQO0FBQ0E7O0FBUGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBL0csT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLCtCQUE2QjVHLEdBQTdCLEVBQWtDO0FBQ2pDLFFBQUksQ0FBQ2pELE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELHVCQUFoRCxDQUF6QixFQUFtRztBQUNsRyxZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVENEIsVUFBTTFJLEdBQU4sRUFBVzJJLE1BQVg7QUFFQSxVQUFNbUUsY0FBY3JQLFdBQVc4QixNQUFYLENBQWtCZ0osbUJBQWxCLENBQXNDYixXQUF0QyxDQUFrRDFILEdBQWxELEVBQXVEO0FBQUU4SixjQUFRO0FBQUU5SixhQUFLO0FBQVA7QUFBVixLQUF2RCxDQUFwQjs7QUFFQSxRQUFJLENBQUM4TSxXQUFMLEVBQWtCO0FBQ2pCLFlBQU0sSUFBSS9QLE9BQU9zRCxLQUFYLENBQWlCLDRCQUFqQixFQUErQyx3QkFBL0MsRUFBeUU7QUFBRXlHLGdCQUFRO0FBQVYsT0FBekUsQ0FBTjtBQUNBOztBQUVELFdBQU9ySixXQUFXOEIsTUFBWCxDQUFrQmdKLG1CQUFsQixDQUFzQ3dFLFVBQXRDLENBQWlEL00sR0FBakQsQ0FBUDtBQUNBOztBQWZhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQWpELE9BQU82SixPQUFQLENBQWU7QUFDZCw4QkFBNEI1RyxHQUE1QixFQUFpQztBQUNoQyxRQUFJLENBQUNqRCxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxXQUFPckosV0FBVzhHLFFBQVgsQ0FBb0J5SSxnQkFBcEIsQ0FBcUNoTixHQUFyQyxDQUFQO0FBQ0E7O0FBUGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBakQsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDJCQUF5QjlDLFFBQXpCLEVBQW1DO0FBQ2xDLFFBQUksQ0FBQy9HLE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELHVCQUFoRCxDQUF6QixFQUFtRztBQUNsRyxZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVELFdBQU9ySixXQUFXOEcsUUFBWCxDQUFvQjBJLGFBQXBCLENBQWtDbkosUUFBbEMsQ0FBUDtBQUNBOztBQVBhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQS9HLE9BQU82SixPQUFQLENBQWU7QUFDZCwyQkFBeUJzRyxTQUF6QixFQUFvQztBQUNuQyxRQUFJLENBQUNuUSxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRDRCLFVBQU13RSxTQUFOLEVBQWlCdkUsTUFBakI7QUFFQSxXQUFPbEwsV0FBVzhCLE1BQVgsQ0FBa0JnTSxlQUFsQixDQUFrQ3dCLFVBQWxDLENBQTZDRyxTQUE3QyxDQUFQO0FBQ0E7O0FBVGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBblEsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDRCQUEwQmxKLFFBQTFCLEVBQW9DO0FBQ25DLFFBQUksQ0FBQ1gsT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsdUJBQWhELENBQXpCLEVBQW1HO0FBQ2xHLFlBQU0sSUFBSTlKLE9BQU9zRCxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUFFeUcsZ0JBQVE7QUFBVixPQUFyRCxDQUFOO0FBQ0E7O0FBRUQsVUFBTXFHLGdCQUFnQixDQUNyQixnQkFEcUIsRUFFckIsc0JBRnFCLEVBR3JCLDJCQUhxQixFQUlyQiwrQkFKcUIsRUFLckIsbUNBTHFCLEVBTXJCLDBCQU5xQixFQU9yQixrQ0FQcUIsRUFRckIsd0JBUnFCLEVBU3JCLDhCQVRxQixFQVVyQix3QkFWcUIsQ0FBdEI7QUFhQSxVQUFNQyxRQUFRMVAsU0FBUzJQLEtBQVQsQ0FBZ0JDLE9BQUQsSUFBYTtBQUN6QyxhQUFPSCxjQUFjdkYsT0FBZCxDQUFzQjBGLFFBQVF0TixHQUE5QixNQUF1QyxDQUFDLENBQS9DO0FBQ0EsS0FGYSxDQUFkOztBQUlBLFFBQUksQ0FBQ29OLEtBQUwsRUFBWTtBQUNYLFlBQU0sSUFBSXJRLE9BQU9zRCxLQUFYLENBQWlCLGlCQUFqQixDQUFOO0FBQ0E7O0FBRUQzQyxhQUFTOEgsT0FBVCxDQUFrQjhILE9BQUQsSUFBYTtBQUM3QjdQLGlCQUFXQyxRQUFYLENBQW9Cd0ssVUFBcEIsQ0FBK0JvRixRQUFRdE4sR0FBdkMsRUFBNENzTixRQUFROUwsS0FBcEQ7QUFDQSxLQUZEO0FBSUE7QUFDQTs7QUFoQ2EsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBO0FBRUF6RSxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsNkJBQTJCNUcsR0FBM0IsRUFBZ0N1TixlQUFoQyxFQUFpRDtBQUNoRCxRQUFJLENBQUN4USxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxRQUFJOUcsR0FBSixFQUFTO0FBQ1IwSSxZQUFNMUksR0FBTixFQUFXMkksTUFBWDtBQUNBOztBQUVERCxVQUFNNkUsZUFBTixFQUF1QkMsTUFBTUMsZUFBTixDQUFzQjtBQUFFaEksYUFBT2tELE1BQVQ7QUFBaUIrRSxhQUFPL0UsTUFBeEI7QUFBZ0NnRixhQUFPaEYsTUFBdkM7QUFBK0NpRixrQkFBWWpGO0FBQTNELEtBQXRCLENBQXZCOztBQUVBLFFBQUksQ0FBQyxtQkFBbUIvSixJQUFuQixDQUF3QjJPLGdCQUFnQjlILEtBQXhDLENBQUwsRUFBcUQ7QUFDcEQsWUFBTSxJQUFJMUksT0FBT3NELEtBQVgsQ0FBaUIsaUNBQWpCLEVBQW9ELGdGQUFwRCxFQUFzSTtBQUFFeUcsZ0JBQVE7QUFBVixPQUF0SSxDQUFOO0FBQ0E7O0FBRUQsUUFBSTlHLEdBQUosRUFBUztBQUNSLFlBQU04TSxjQUFjclAsV0FBVzhCLE1BQVgsQ0FBa0JnSixtQkFBbEIsQ0FBc0NiLFdBQXRDLENBQWtEMUgsR0FBbEQsQ0FBcEI7O0FBQ0EsVUFBSSxDQUFDOE0sV0FBTCxFQUFrQjtBQUNqQixjQUFNLElBQUkvUCxPQUFPc0QsS0FBWCxDQUFpQiw0QkFBakIsRUFBK0Msd0JBQS9DLEVBQXlFO0FBQUV5RyxrQkFBUTtBQUFWLFNBQXpFLENBQU47QUFDQTtBQUNEOztBQUVELFdBQU9ySixXQUFXOEIsTUFBWCxDQUFrQmdKLG1CQUFsQixDQUFzQ3NGLHlCQUF0QyxDQUFnRTdOLEdBQWhFLEVBQXFFdU4sZ0JBQWdCOUgsS0FBckYsRUFBNEY4SCxnQkFBZ0JHLEtBQTVHLEVBQW1ISCxnQkFBZ0JJLEtBQW5JLEVBQTBJSixnQkFBZ0JLLFVBQTFKLENBQVA7QUFDQTs7QUF4QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBN1EsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDRCQUEwQjVHLEdBQTFCLEVBQStCOE4sY0FBL0IsRUFBK0NDLGdCQUEvQyxFQUFpRTtBQUNoRSxRQUFJLENBQUNoUixPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxXQUFPckosV0FBVzhHLFFBQVgsQ0FBb0J5SixjQUFwQixDQUFtQ2hPLEdBQW5DLEVBQXdDOE4sY0FBeEMsRUFBd0RDLGdCQUF4RCxDQUFQO0FBQ0E7O0FBUGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBO0FBRUFoUixPQUFPNkosT0FBUCxDQUFlO0FBQ2Qsc0JBQW9CcUgsU0FBcEIsRUFBK0JDLFFBQS9CLEVBQXlDO0FBQ3hDLFFBQUksQ0FBQ25SLE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELGFBQWhELENBQXpCLEVBQXlGO0FBQ3hGLFlBQU0sSUFBSTlKLE9BQU9zRCxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUFFeUcsZ0JBQVE7QUFBVixPQUFyRCxDQUFOO0FBQ0E7O0FBRUQ0QixVQUFNdUYsU0FBTixFQUFpQlQsTUFBTUMsZUFBTixDQUFzQjtBQUN0Q3pOLFdBQUsySSxNQURpQztBQUV0Q3RFLFlBQU1tSixNQUFNVyxRQUFOLENBQWV4RixNQUFmLENBRmdDO0FBR3RDckUsYUFBT2tKLE1BQU1XLFFBQU4sQ0FBZXhGLE1BQWYsQ0FIK0I7QUFJdEN6RCxhQUFPc0ksTUFBTVcsUUFBTixDQUFleEYsTUFBZjtBQUorQixLQUF0QixDQUFqQjtBQU9BRCxVQUFNd0YsUUFBTixFQUFnQlYsTUFBTUMsZUFBTixDQUFzQjtBQUNyQ3pOLFdBQUsySSxNQURnQztBQUVyQ3lGLGFBQU9aLE1BQU1XLFFBQU4sQ0FBZXhGLE1BQWYsQ0FGOEI7QUFHckN2RCxZQUFNb0ksTUFBTVcsUUFBTixDQUFleEYsTUFBZjtBQUgrQixLQUF0QixDQUFoQjtBQU1BLFVBQU0vSSxPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa0ksV0FBeEIsQ0FBb0N3RyxTQUFTbE8sR0FBN0MsRUFBa0Q7QUFBQzhKLGNBQVE7QUFBQ2hLLFdBQUcsQ0FBSjtBQUFPOEksa0JBQVU7QUFBakI7QUFBVCxLQUFsRCxDQUFiOztBQUVBLFFBQUloSixRQUFRLElBQVIsSUFBZ0JBLEtBQUtFLENBQUwsS0FBVyxHQUEvQixFQUFvQztBQUNuQyxZQUFNLElBQUkvQyxPQUFPc0QsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUVELFFBQUksQ0FBQyxDQUFDbEgsS0FBS2dKLFFBQU4sSUFBa0JoSixLQUFLZ0osUUFBTCxDQUFjNUksR0FBZCxLQUFzQmpELE9BQU84SixNQUFQLEVBQXpDLEtBQTZELENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCxnQ0FBaEQsQ0FBbEUsRUFBcUo7QUFDcEosWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxVQUFNdUgsTUFBTTVRLFdBQVc4RyxRQUFYLENBQW9CK0osU0FBcEIsQ0FBOEJMLFNBQTlCLEtBQTRDeFEsV0FBVzhHLFFBQVgsQ0FBb0JnSyxZQUFwQixDQUFpQ0wsUUFBakMsRUFBMkNELFNBQTNDLENBQXhEO0FBRUFsUixXQUFPNEUsS0FBUCxDQUFhLE1BQU07QUFDbEJsRSxpQkFBVzBDLFNBQVgsQ0FBcUJzRCxHQUFyQixDQUF5QixtQkFBekIsRUFBOENoRyxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrSSxXQUF4QixDQUFvQ3dHLFNBQVNsTyxHQUE3QyxDQUE5QztBQUNBLEtBRkQ7QUFJQSxXQUFPcU8sR0FBUDtBQUNBOztBQXBDYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDRkEsSUFBSUcsQ0FBSjtBQUFNdFMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNrUyxRQUFFbFMsQ0FBRjtBQUFJOztBQUFoQixDQUExQyxFQUE0RCxDQUE1RDtBQUVOUyxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsNkJBQTJCNkgsTUFBM0IsRUFBbUM7QUFDbEMsUUFBSSxDQUFDMVIsT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsdUJBQWhELENBQXpCLEVBQW1HO0FBQ2xHLFlBQU0sSUFBSTlKLE9BQU9zRCxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUFFeUcsZ0JBQVE7QUFBVixPQUFyRCxDQUFOO0FBQ0E7O0FBRUQsUUFBSSxPQUFPMkgsT0FBTyxxQkFBUCxDQUFQLEtBQXlDLFdBQTdDLEVBQTBEO0FBQ3pEaFIsaUJBQVdDLFFBQVgsQ0FBb0J3SyxVQUFwQixDQUErQixxQkFBL0IsRUFBc0RzRyxFQUFFelEsSUFBRixDQUFPMFEsT0FBTyxxQkFBUCxDQUFQLENBQXREO0FBQ0E7O0FBRUQsUUFBSSxPQUFPQSxPQUFPLHVCQUFQLENBQVAsS0FBMkMsV0FBL0MsRUFBNEQ7QUFDM0RoUixpQkFBV0MsUUFBWCxDQUFvQndLLFVBQXBCLENBQStCLHVCQUEvQixFQUF3RHNHLEVBQUV6USxJQUFGLENBQU8wUSxPQUFPLHVCQUFQLENBQVAsQ0FBeEQ7QUFDQTs7QUFFRCxRQUFJLE9BQU9BLE9BQU8sMkJBQVAsQ0FBUCxLQUErQyxXQUFuRCxFQUFnRTtBQUMvRGhSLGlCQUFXQyxRQUFYLENBQW9Cd0ssVUFBcEIsQ0FBK0IsMkJBQS9CLEVBQTRELENBQUMsQ0FBQ3VHLE9BQU8sMkJBQVAsQ0FBOUQ7QUFDQTs7QUFFRCxRQUFJLE9BQU9BLE9BQU8saUNBQVAsQ0FBUCxLQUFxRCxXQUF6RCxFQUFzRTtBQUNyRWhSLGlCQUFXQyxRQUFYLENBQW9Cd0ssVUFBcEIsQ0FBK0IsaUNBQS9CLEVBQWtFLENBQUMsQ0FBQ3VHLE9BQU8saUNBQVAsQ0FBcEU7QUFDQTs7QUFFRDtBQUNBOztBQXZCYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDRkEsSUFBSXpMLGdCQUFKO0FBQXFCOUcsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUMwRyx1QkFBaUIxRyxDQUFqQjtBQUFtQjs7QUFBL0IsQ0FBbkQsRUFBb0YsQ0FBcEY7O0FBQXVGLElBQUlMLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFJbEhTLE9BQU82SixPQUFQLENBQWU7QUFDZCxnQ0FBOEJrQyxZQUE5QixFQUE0QzRGLFdBQTVDLEVBQXlEQyxRQUF6RCxFQUFtRTtBQUNsRWpHLFVBQU1JLFlBQU4sRUFBb0JILE1BQXBCO0FBQ0FELFVBQU1nRyxXQUFOLEVBQW1CL0YsTUFBbkI7QUFDQUQsVUFBTWlHLFFBQU4sRUFBZ0IsQ0FBQ25CLE1BQU1DLGVBQU4sQ0FBc0I7QUFBRXBKLFlBQU1zRSxNQUFSO0FBQWdCbkgsYUFBT21IO0FBQXZCLEtBQXRCLENBQUQsQ0FBaEI7QUFFQSxVQUFNMUgsVUFBVStCLGlCQUFpQnVFLGlCQUFqQixDQUFtQ3VCLFlBQW5DLENBQWhCO0FBQ0EsVUFBTWxKLE9BQU9uQyxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrSSxXQUF4QixDQUFvQ2dILFdBQXBDLENBQWI7O0FBRUEsUUFBSXpOLFlBQVkyTixTQUFaLElBQXlCaFAsU0FBU2dQLFNBQWxDLElBQStDaFAsS0FBS3RELENBQUwsS0FBV3NTLFNBQTFELElBQXVFaFAsS0FBS3RELENBQUwsQ0FBTzRELEtBQVAsS0FBaUJlLFFBQVFmLEtBQXBHLEVBQTJHO0FBQzFHLFlBQU0yTyxhQUFhLEVBQW5COztBQUNBLFdBQUssTUFBTUMsSUFBWCxJQUFtQkgsUUFBbkIsRUFBNkI7QUFDNUIsWUFBSTFTLEVBQUVrQyxRQUFGLENBQVcsQ0FBQyxjQUFELEVBQWlCLGdCQUFqQixFQUFtQyxvQkFBbkMsRUFBeUQsbUJBQXpELENBQVgsRUFBMEYyUSxLQUFLekssSUFBL0YsS0FBd0dwSSxFQUFFa0MsUUFBRixDQUFXLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLENBQVgsRUFBc0MyUSxLQUFLdE4sS0FBM0MsQ0FBNUcsRUFBK0o7QUFDOUpxTixxQkFBV0MsS0FBS3pLLElBQWhCLElBQXdCeUssS0FBS3ROLEtBQTdCO0FBQ0EsU0FGRCxNQUVPLElBQUlzTixLQUFLekssSUFBTCxLQUFjLG9CQUFsQixFQUF3QztBQUM5Q3dLLHFCQUFXQyxLQUFLekssSUFBaEIsSUFBd0J5SyxLQUFLdE4sS0FBN0I7QUFDQTtBQUNEOztBQUNELFVBQUksQ0FBQ3ZGLEVBQUU2QixPQUFGLENBQVUrUSxVQUFWLENBQUwsRUFBNEI7QUFDM0IsZUFBT3BSLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QnVQLHdCQUF4QixDQUFpRG5QLEtBQUtJLEdBQXRELEVBQTJENk8sVUFBM0QsQ0FBUDtBQUNBO0FBQ0Q7QUFDRDs7QUF0QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0pBOVIsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLHlCQUF1QjZFLE9BQXZCLEVBQWdDO0FBQy9CLFFBQUksQ0FBQzFPLE9BQU84SixNQUFQLEVBQUQsSUFBb0IsQ0FBQ3BKLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQmhELE9BQU84SixNQUFQLEVBQS9CLEVBQWdELHVCQUFoRCxDQUF6QixFQUFtRztBQUNsRyxZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsYUFBdEMsRUFBcUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBckQsQ0FBTjtBQUNBOztBQUVENEIsVUFBTStDLE9BQU4sRUFBZTtBQUNkekwsV0FBS3dOLE1BQU13QixLQUFOLENBQVlyRyxNQUFaLENBRFM7QUFFZHRFLFlBQU1zRSxNQUZRO0FBR2RzRyxtQkFBYXRHLE1BSEM7QUFJZGIsZUFBU29ILE9BSks7QUFLZEMsa0JBQVlDLEtBTEU7QUFNZEMsZUFBU0Q7QUFOSyxLQUFmOztBQVNBLFFBQUkzRCxRQUFRekwsR0FBWixFQUFpQjtBQUNoQixhQUFPdkMsV0FBVzhCLE1BQVgsQ0FBa0JnTSxlQUFsQixDQUFrQ3JELFVBQWxDLENBQTZDdUQsUUFBUXpMLEdBQXJELEVBQTBEeUwsT0FBMUQsQ0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLGFBQU9oTyxXQUFXOEIsTUFBWCxDQUFrQmdNLGVBQWxCLENBQWtDL0ksTUFBbEMsQ0FBeUNpSixPQUF6QyxDQUFQO0FBQ0E7QUFDRDs7QUFwQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUl4UCxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBRU5TLE9BQU82SixPQUFQLENBQWU7QUFDZCx5QkFBdUI5QyxRQUF2QixFQUFpQztBQUNoQyxRQUFJLENBQUMvRyxPQUFPOEosTUFBUCxFQUFELElBQW9CLENBQUNwSixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0JoRCxPQUFPOEosTUFBUCxFQUEvQixFQUFnRCx1QkFBaEQsQ0FBekIsRUFBbUc7QUFDbEcsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxRQUFJLENBQUNoRCxRQUFELElBQWEsQ0FBQzdILEVBQUVxVCxRQUFGLENBQVd4TCxRQUFYLENBQWxCLEVBQXdDO0FBQ3ZDLFlBQU0sSUFBSS9HLE9BQU9zRCxLQUFYLENBQWlCLHlCQUFqQixFQUE0QyxtQkFBNUMsRUFBaUU7QUFBRXlHLGdCQUFRO0FBQVYsT0FBakUsQ0FBTjtBQUNBOztBQUVELFVBQU1qSCxPQUFPcEMsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3Qm9JLGlCQUF4QixDQUEwQ3pMLFFBQTFDLEVBQW9EO0FBQUVnRyxjQUFRO0FBQUU5SixhQUFLLENBQVA7QUFBVThELGtCQUFVO0FBQXBCO0FBQVYsS0FBcEQsQ0FBYjs7QUFFQSxRQUFJLENBQUNqRSxJQUFMLEVBQVc7QUFDVixZQUFNLElBQUk5QyxPQUFPc0QsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUVELFdBQU9qSCxJQUFQO0FBQ0E7O0FBakJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNGQSxJQUFJbUQsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUFuRCxFQUFvRixDQUFwRjtBQUVyQlMsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkNEksc0JBQW9CO0FBQUV0UCxTQUFGO0FBQVNGLE9BQVQ7QUFBY3lDLE9BQWQ7QUFBbUJSO0FBQW5CLEdBQXBCLEVBQThDa0ssS0FBOUMsRUFBcUQ7QUFDcER6RCxVQUFNeEksS0FBTixFQUFheUksTUFBYjtBQUNBRCxVQUFNMUksR0FBTixFQUFXMkksTUFBWDtBQUNBRCxVQUFNakcsR0FBTixFQUFXa0csTUFBWDtBQUNBRCxVQUFNekcsR0FBTixFQUFXMEcsTUFBWDtBQUVBRCxVQUFNeUQsS0FBTixFQUFhcUIsTUFBTXdCLEtBQU4sQ0FBWTtBQUN4QjlJLGVBQVN5QyxNQURlO0FBRXhCN0UsZ0JBQVU2RTtBQUZjLEtBQVosQ0FBYjtBQUtBLFVBQU04RyxRQUFRek0saUJBQWlCdUUsaUJBQWpCLENBQW1DckgsS0FBbkMsRUFBMEM7QUFDdkQ0SixjQUFRO0FBQ1B6RixjQUFNLENBREM7QUFFUFAsa0JBQVUsQ0FGSDtBQUdQK0gsb0JBQVksQ0FITDtBQUlQM0wsZUFBTztBQUpBO0FBRCtDLEtBQTFDLENBQWQ7O0FBU0EsUUFBSSxDQUFDdVAsS0FBTCxFQUFZO0FBQ1gsWUFBTSxJQUFJMVMsT0FBT3NELEtBQVgsQ0FBaUIsZUFBakIsQ0FBTjtBQUNBOztBQUVELFdBQU81QyxXQUFXOEcsUUFBWCxDQUFvQm1MLFdBQXBCLENBQWdDO0FBQ3RDRCxXQURzQztBQUV0Q2hPLGVBQVM7QUFDUnpCLFdBRFE7QUFFUnlDLFdBRlE7QUFHUlIsV0FIUTtBQUlSL0I7QUFKUSxPQUY2QjtBQVF0Q2lNO0FBUnNDLEtBQWhDLENBQVA7QUFVQTs7QUFuQ2EsQ0FBZixFOzs7Ozs7Ozs7OztBQ0ZBLElBQUl3RCxHQUFKO0FBQVF6VCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsS0FBUixDQUFiLEVBQTRCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDcVQsVUFBSXJULENBQUo7QUFBTTs7QUFBbEIsQ0FBNUIsRUFBZ0QsQ0FBaEQ7QUFHUlMsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLGdDQUE4QjdFLElBQTlCLEVBQW9DO0FBQ25DMkcsVUFBTTNHLElBQU4sRUFBWTtBQUNYc0MsWUFBTXNFLE1BREs7QUFFWHJFLGFBQU9xRSxNQUZJO0FBR1hsSCxlQUFTa0g7QUFIRSxLQUFaOztBQU1BLFFBQUksQ0FBQ2xMLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLCtCQUF4QixDQUFMLEVBQStEO0FBQzlELGFBQU8sS0FBUDtBQUNBOztBQUVELFVBQU1pUyxTQUFTblMsV0FBV29TLFlBQVgsQ0FBd0JDLE9BQXhCLENBQWdDclMsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsY0FBeEIsS0FBMkMsRUFBM0UsQ0FBZjtBQUNBLFVBQU1vUyxTQUFTdFMsV0FBV29TLFlBQVgsQ0FBd0JDLE9BQXhCLENBQWdDclMsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsY0FBeEIsS0FBMkMsRUFBM0UsQ0FBZjtBQUVBLFVBQU04RCxVQUFZLEdBQUdNLEtBQUtOLE9BQVMsRUFBbkIsQ0FBc0JxTyxPQUF0QixDQUE4QiwrQkFBOUIsRUFBK0QsT0FBTyxNQUFQLEdBQWdCLElBQS9FLENBQWhCO0FBRUEsVUFBTWpSLE9BQVE7O3VDQUV3QmtELEtBQUtzQyxJQUFNO3dDQUNWdEMsS0FBS3VDLEtBQU87cUNBQ2Y3QyxPQUFTLE1BSjdDO0FBTUEsUUFBSXVPLFlBQVl2UyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixZQUF4QixFQUFzQzBGLEtBQXRDLENBQTRDLGlEQUE1QyxDQUFoQjs7QUFFQSxRQUFJMk0sU0FBSixFQUFlO0FBQ2RBLGtCQUFZQSxVQUFVLENBQVYsQ0FBWjtBQUNBLEtBRkQsTUFFTztBQUNOQSxrQkFBWXZTLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFlBQXhCLENBQVo7QUFDQTs7QUFFRCxRQUFJRixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixpQ0FBeEIsQ0FBSixFQUFnRTtBQUMvRCxZQUFNc1MsY0FBY2xPLEtBQUt1QyxLQUFMLENBQVc0TCxNQUFYLENBQWtCbk8sS0FBS3VDLEtBQUwsQ0FBVzZMLFdBQVgsQ0FBdUIsR0FBdkIsSUFBOEIsQ0FBaEQsQ0FBcEI7O0FBRUEsVUFBSTtBQUNIcFQsZUFBT3FULFNBQVAsQ0FBaUJULElBQUlVLFNBQXJCLEVBQWdDSixXQUFoQztBQUNBLE9BRkQsQ0FFRSxPQUFPcE4sQ0FBUCxFQUFVO0FBQ1gsY0FBTSxJQUFJOUYsT0FBT3NELEtBQVgsQ0FBaUIsNkJBQWpCLEVBQWdELHVCQUFoRCxFQUF5RTtBQUFFeUcsa0JBQVE7QUFBVixTQUF6RSxDQUFOO0FBQ0E7QUFDRDs7QUFFRC9KLFdBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQjJPLFlBQU1DLElBQU4sQ0FBVztBQUNWQyxZQUFJL1MsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isd0JBQXhCLENBRE07QUFFVjhTLGNBQU8sR0FBRzFPLEtBQUtzQyxJQUFNLE1BQU10QyxLQUFLdUMsS0FBTyxLQUFLMEwsU0FBVyxHQUY3QztBQUdWVSxpQkFBVSxHQUFHM08sS0FBS3NDLElBQU0sS0FBS3RDLEtBQUt1QyxLQUFPLEdBSC9CO0FBSVZxTSxpQkFBVSxpQ0FBaUM1TyxLQUFLc0MsSUFBTSxLQUFPLEdBQUd0QyxLQUFLTixPQUFTLEVBQW5CLENBQXNCbVAsU0FBdEIsQ0FBZ0MsQ0FBaEMsRUFBbUMsRUFBbkMsQ0FBd0MsRUFKekY7QUFLVi9SLGNBQU0rUSxTQUFTL1EsSUFBVCxHQUFnQmtSO0FBTFosT0FBWDtBQU9BLEtBUkQ7QUFVQWhULFdBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQmxFLGlCQUFXMEMsU0FBWCxDQUFxQnNELEdBQXJCLENBQXlCLHlCQUF6QixFQUFvRDFCLElBQXBEO0FBQ0EsS0FGRDtBQUlBLFdBQU8sSUFBUDtBQUNBOztBQXhEYSxDQUFmO0FBMkRBOE8sZUFBZUMsT0FBZixDQUF1QjtBQUN0QjNNLFFBQU0sUUFEZ0I7QUFFdEJFLFFBQU0sNkJBRmdCOztBQUd0QjBNLGlCQUFlO0FBQ2QsV0FBTyxJQUFQO0FBQ0E7O0FBTHFCLENBQXZCLEVBTUcsQ0FOSCxFQU1NLElBTk4sRTs7Ozs7Ozs7Ozs7QUM5REEsSUFBSS9OLGdCQUFKO0FBQXFCOUcsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUMwRyx1QkFBaUIxRyxDQUFqQjtBQUFtQjs7QUFBL0IsQ0FBbkQsRUFBb0YsQ0FBcEY7QUFFckJTLE9BQU82SixPQUFQLENBQWU7QUFDZCw0QkFBMEIxRyxLQUExQixFQUFpQ3FCLEdBQWpDLEVBQXNDQyxLQUF0QyxFQUE2Q3dQLFlBQVksSUFBekQsRUFBK0Q7QUFDOUQsVUFBTWxFLGNBQWNyUCxXQUFXOEIsTUFBWCxDQUFrQmdKLG1CQUFsQixDQUFzQ2IsV0FBdEMsQ0FBa0RuRyxHQUFsRCxDQUFwQjs7QUFDQSxRQUFJdUwsV0FBSixFQUFpQjtBQUNoQixVQUFJQSxZQUFZYSxLQUFaLEtBQXNCLE1BQTFCLEVBQWtDO0FBQ2pDLGVBQU9sUSxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J5Uix5QkFBeEIsQ0FBa0QvUSxLQUFsRCxFQUF5RHFCLEdBQXpELEVBQThEQyxLQUE5RCxFQUFxRXdQLFNBQXJFLENBQVA7QUFDQSxPQUZELE1BRU87QUFDTjtBQUNBLGVBQU9oTyxpQkFBaUJpTyx5QkFBakIsQ0FBMkMvUSxLQUEzQyxFQUFrRHFCLEdBQWxELEVBQXVEQyxLQUF2RCxFQUE4RHdQLFNBQTlELENBQVA7QUFDQTtBQUNEOztBQUVELFdBQU8sSUFBUDtBQUNBOztBQWJhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNGQWpVLE9BQU82SixPQUFQLENBQWU7QUFDZCxxQ0FBbUM7QUFBRTFHLFNBQUY7QUFBUzJMO0FBQVQsTUFBd0IsRUFBM0QsRUFBK0Q7QUFDOURwTyxlQUFXOEcsUUFBWCxDQUFvQjJNLHFCQUFwQixDQUEwQ3hMLElBQTFDLENBQStDLElBQS9DLEVBQXFEO0FBQ3BEeEYsV0FEb0Q7QUFFcEQyTDtBQUZvRCxLQUFyRCxFQUQ4RCxDQU05RDs7QUFDQXBPLGVBQVc4QixNQUFYLENBQWtCb04sbUJBQWxCLENBQXNDQyxtQkFBdEMsQ0FBMEQxTSxLQUExRDtBQUVBLFdBQU8sSUFBUDtBQUNBOztBQVhhLENBQWYsRTs7Ozs7Ozs7Ozs7QUNBQTtBQUNBbkQsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDRCQUEwQlMsTUFBMUIsRUFBa0M7QUFDakMsUUFBSSxDQUFDdEssT0FBTzhKLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUk5SixPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQTNELENBQU47QUFDQTs7QUFFRCxVQUFNMkksUUFBUTFTLE9BQU84QyxJQUFQLEVBQWQ7QUFFQSxVQUFNNEIsVUFBVTtBQUNmekIsV0FBS21SLE9BQU96SyxFQUFQLEVBRFU7QUFFZmpFLFdBQUs0RSxVQUFVOEosT0FBT3pLLEVBQVAsRUFGQTtBQUdmekUsV0FBSyxFQUhVO0FBSWZVLFVBQUksSUFBSUMsSUFBSjtBQUpXLEtBQWhCO0FBT0EsVUFBTTtBQUFFaEQ7QUFBRixRQUFXbkMsV0FBVzhHLFFBQVgsQ0FBb0I2TSxPQUFwQixDQUE0QjNCLEtBQTVCLEVBQW1DaE8sT0FBbkMsRUFBNEM7QUFBRTRQLG9CQUFjLElBQUl6TyxJQUFKLENBQVNBLEtBQUtlLEdBQUwsS0FBYSxPQUFPLElBQTdCO0FBQWhCLEtBQTVDLENBQWpCO0FBQ0FsQyxZQUFRZ0IsR0FBUixHQUFjN0MsS0FBS0ksR0FBbkI7QUFFQXZDLGVBQVc4QixNQUFYLENBQWtCd0csUUFBbEIsQ0FBMkJ1TCxrQ0FBM0IsQ0FBOEQscUJBQTlELEVBQXFGMVIsS0FBS0ksR0FBMUYsRUFBK0YsRUFBL0YsRUFBbUd5UCxLQUFuRyxFQUEwRztBQUN6RzhCLG1CQUFhLENBQ1o7QUFBRUMsY0FBTSxlQUFSO0FBQXlCQyxtQkFBVyxRQUFwQztBQUE4Q0MsbUJBQVcsb0JBQXpEO0FBQStFQyxnQkFBUTtBQUF2RixPQURZLEVBRVo7QUFBRUgsY0FBTSxhQUFSO0FBQXVCQyxtQkFBVyxTQUFsQztBQUE2Q0MsbUJBQVcsa0JBQXhEO0FBQTRFQyxnQkFBUTtBQUFwRixPQUZZO0FBRDRGLEtBQTFHO0FBT0EsV0FBTztBQUNOdEssY0FBUXpILEtBQUtJLEdBRFA7QUFFTjlCLGNBQVFULFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLGNBQXhCLENBRkY7QUFHTmlVLGlCQUFXblUsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsdUJBQXhCLElBQW1ERixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QixDQUFuRCxHQUF5RjBKO0FBSDlGLEtBQVA7QUFLQTs7QUE5QmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0RBLElBQUlyRSxnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQW5ELEVBQW9GLENBQXBGO0FBSXJCUyxPQUFPNkosT0FBUCxDQUFlO0FBQ2Qsc0JBQW9CaUwsWUFBcEIsRUFBa0M7QUFDakMsUUFBSSxDQUFDOVUsT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsYUFBaEQsQ0FBekIsRUFBeUY7QUFDeEYsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRDRCLFVBQU1tSixZQUFOLEVBQW9CO0FBQ25CeEssY0FBUXNCLE1BRFc7QUFFbkI5QixjQUFRMkcsTUFBTVcsUUFBTixDQUFleEYsTUFBZixDQUZXO0FBR25CbUosb0JBQWN0RSxNQUFNVyxRQUFOLENBQWV4RixNQUFmO0FBSEssS0FBcEI7QUFNQSxVQUFNL0ksT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DbUssYUFBYXhLLE1BQWpELENBQWI7QUFFQSxVQUFNb0ksUUFBUXpNLGlCQUFpQjBFLFdBQWpCLENBQTZCOUgsS0FBS3RELENBQUwsQ0FBTzBELEdBQXBDLENBQWQ7QUFFQSxVQUFNSCxPQUFPOUMsT0FBTzhDLElBQVAsRUFBYjs7QUFFQSxRQUFJRCxLQUFLK0gsU0FBTCxDQUFlQyxPQUFmLENBQXVCL0gsS0FBS2lFLFFBQTVCLE1BQTBDLENBQUMsQ0FBM0MsSUFBZ0QsQ0FBQ3JHLFdBQVdpQyxLQUFYLENBQWlCcVMsT0FBakIsQ0FBeUJoVixPQUFPOEosTUFBUCxFQUF6QixFQUEwQyxrQkFBMUMsQ0FBckQsRUFBb0g7QUFDbkgsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFeUcsZ0JBQVE7QUFBVixPQUEzRCxDQUFOO0FBQ0E7O0FBRUQsV0FBT3JKLFdBQVc4RyxRQUFYLENBQW9CeU4sUUFBcEIsQ0FBNkJwUyxJQUE3QixFQUFtQzZQLEtBQW5DLEVBQTBDb0MsWUFBMUMsQ0FBUDtBQUNBOztBQXZCYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDSkE7QUFDQSxNQUFNSSxpQkFBaUJsVixPQUFPcVQsU0FBUCxDQUFpQixVQUFTN1QsR0FBVCxFQUFjc0ksT0FBZCxFQUF1QnFOLE9BQXZCLEVBQWdDO0FBQ3ZFclEsT0FBS0MsSUFBTCxDQUFVdkYsR0FBVixFQUFlc0ksT0FBZixFQUF3QixVQUFTc04sR0FBVCxFQUFjalYsR0FBZCxFQUFtQjtBQUMxQyxRQUFJaVYsR0FBSixFQUFTO0FBQ1JELGNBQVEsSUFBUixFQUFjQyxJQUFJdlEsUUFBbEI7QUFDQSxLQUZELE1BRU87QUFDTnNRLGNBQVEsSUFBUixFQUFjaFYsR0FBZDtBQUNBO0FBQ0QsR0FORDtBQU9BLENBUnNCLENBQXZCO0FBVUFILE9BQU82SixPQUFQLENBQWU7QUFDZCwyQkFBeUI7QUFDeEIsU0FBS3dMLE9BQUw7QUFFQSxVQUFNQyxhQUFhO0FBQ2xCbE8sWUFBTSxpQkFEWTtBQUVsQm5FLFdBQUsscUJBRmE7QUFHbEIwTixhQUFPLE9BSFc7QUFJbEJVLGFBQU8sVUFKVztBQUtsQjlPLFlBQU0sTUFMWTtBQU1sQmdULGlCQUFXLElBQUkxUCxJQUFKLEVBTk87QUFPbEIyUCxxQkFBZSxJQUFJM1AsSUFBSixFQVBHO0FBUWxCd0MsWUFBTSxDQUNMLE1BREssRUFFTCxNQUZLLEVBR0wsTUFISyxDQVJZO0FBYWxCRyxvQkFBYztBQUNiaU4sbUJBQVc7QUFERSxPQWJJO0FBZ0JsQnZSLGVBQVM7QUFDUmpCLGFBQUssRUFERztBQUVScUUsY0FBTSxjQUZFO0FBR1JQLGtCQUFVLGtCQUhGO0FBSVIrSCxvQkFBWSxZQUpKO0FBS1J2SCxlQUFPLG1CQUxDO0FBTVJZLGVBQU8sY0FOQztBQU9SdU4sWUFBSSxjQVBJO0FBUVJDLGlCQUFTLFFBUkQ7QUFTUkMsWUFBSSxPQVRJO0FBVVJwTixzQkFBYztBQUNicU4sc0JBQVk7QUFEQztBQVZOLE9BaEJTO0FBOEJsQnpHLGFBQU87QUFDTm5NLGFBQUssY0FEQztBQUVOOEQsa0JBQVUsZ0JBRko7QUFHTk8sY0FBTSxZQUhBO0FBSU5DLGVBQU87QUFKRCxPQTlCVztBQW9DbEJ3QixnQkFBVSxDQUFDO0FBQ1ZoQyxrQkFBVSxrQkFEQTtBQUVWN0IsYUFBSyxpQkFGSztBQUdWVSxZQUFJLElBQUlDLElBQUo7QUFITSxPQUFELEVBSVA7QUFDRmtCLGtCQUFVLGdCQURSO0FBRUZvQyxpQkFBUyxjQUZQO0FBR0ZqRSxhQUFLLDRCQUhIO0FBSUZVLFlBQUksSUFBSUMsSUFBSjtBQUpGLE9BSk87QUFwQ1EsS0FBbkI7QUFnREEsVUFBTWlDLFVBQVU7QUFDZmpILGVBQVM7QUFDUix1Q0FBK0JILFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHVCQUF4QjtBQUR2QixPQURNO0FBSWZvRSxZQUFNc1E7QUFKUyxLQUFoQjtBQU9BLFVBQU16USxXQUFXcVEsZUFBZXhVLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHFCQUF4QixDQUFmLEVBQStEa0gsT0FBL0QsQ0FBakI7QUFFQWMsWUFBUWtOLEdBQVIsQ0FBWSxhQUFaLEVBQTJCalIsUUFBM0I7O0FBRUEsUUFBSUEsWUFBWUEsU0FBU2tSLFVBQXJCLElBQW1DbFIsU0FBU2tSLFVBQVQsS0FBd0IsR0FBL0QsRUFBb0U7QUFDbkUsYUFBTyxJQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTSxJQUFJL1YsT0FBT3NELEtBQVgsQ0FBaUIsZ0NBQWpCLENBQU47QUFDQTtBQUNEOztBQXBFYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDWEF0RCxPQUFPNkosT0FBUCxDQUFlO0FBQ2QseUJBQXVCbU0sU0FBdkIsRUFBa0M7QUFDakMsUUFBSSxDQUFDaFcsT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsYUFBaEQsQ0FBekIsRUFBeUY7QUFDeEYsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQTs7QUFFRCxVQUFNa00sVUFBVXZWLFdBQVc4QixNQUFYLENBQWtCMkIsZUFBbEIsQ0FBa0N3RyxXQUFsQyxDQUE4Q3FMLFNBQTlDLENBQWhCOztBQUVBLFFBQUksQ0FBQ0MsT0FBRCxJQUFZQSxRQUFRalMsTUFBUixLQUFtQixPQUFuQyxFQUE0QztBQUMzQyxZQUFNLElBQUloRSxPQUFPc0QsS0FBWCxDQUFpQixtQkFBakIsRUFBc0MsdUJBQXRDLEVBQStEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQS9ELENBQU47QUFDQTs7QUFFRCxVQUFNakgsT0FBT3BDLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JPLFdBQXhCLENBQW9DM0ssT0FBTzhKLE1BQVAsRUFBcEMsQ0FBYjtBQUVBLFVBQU1zRixRQUFRO0FBQ2JqRyxlQUFTckcsS0FBS0csR0FERDtBQUViOEQsZ0JBQVVqRSxLQUFLaUU7QUFGRixLQUFkLENBYmlDLENBa0JqQzs7QUFDQSxVQUFNbVAsbUJBQW1CO0FBQ3hCeFEsV0FBS3VRLFFBQVF2USxHQURXO0FBRXhCNEIsWUFBTTJPLFFBQVEzTyxJQUZVO0FBR3hCNk8sYUFBTyxJQUhpQjtBQUl4QjdNLFlBQU0sSUFKa0I7QUFLeEI4TSxjQUFRLENBTGdCO0FBTXhCQyxvQkFBYyxDQU5VO0FBT3hCQyxxQkFBZSxDQVBTO0FBUXhCL1QsWUFBTTBULFFBQVExVCxJQVJVO0FBU3hCdUUsU0FBRztBQUNGN0QsYUFBS21NLE1BQU1qRyxPQURUO0FBRUZwQyxrQkFBVXFJLE1BQU1ySTtBQUZkLE9BVHFCO0FBYXhCaEUsU0FBRyxHQWJxQjtBQWN4QndULDRCQUFzQixLQWRFO0FBZXhCQywrQkFBeUIsS0FmRDtBQWdCeEJDLDBCQUFvQjtBQWhCSSxLQUF6QjtBQWtCQS9WLGVBQVc4QixNQUFYLENBQWtCa1UsYUFBbEIsQ0FBZ0NqUixNQUFoQyxDQUF1Q3lRLGdCQUF2QyxFQXJDaUMsQ0F1Q2pDOztBQUNBLFVBQU1yVCxPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa0ksV0FBeEIsQ0FBb0NzTCxRQUFRdlEsR0FBNUMsQ0FBYjtBQUVBaEYsZUFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa1UsbUJBQXhCLENBQTRDVixRQUFRdlEsR0FBcEQsRUFBeUQwSixLQUF6RDtBQUVBdk0sU0FBS2dKLFFBQUwsR0FBZ0I7QUFDZjVJLFdBQUttTSxNQUFNakcsT0FESTtBQUVmcEMsZ0JBQVVxSSxNQUFNckk7QUFGRCxLQUFoQixDQTVDaUMsQ0FpRGpDOztBQUNBckcsZUFBVzhCLE1BQVgsQ0FBa0IyQixlQUFsQixDQUFrQ3lTLFdBQWxDLENBQThDWCxRQUFRaFQsR0FBdEQsRUFsRGlDLENBb0RqQztBQUNBO0FBQ0E7O0FBQ0F2QyxlQUFXOEIsTUFBWCxDQUFrQndHLFFBQWxCLENBQTJCNk4sOEJBQTNCLENBQTBELFdBQTFELEVBQXVFaFUsS0FBS0ksR0FBNUUsRUFBaUZILElBQWpGO0FBRUFwQyxlQUFXOEcsUUFBWCxDQUFvQnNQLE1BQXBCLENBQTJCQyxJQUEzQixDQUFnQ2xVLEtBQUtJLEdBQXJDLEVBQTBDO0FBQ3pDbUUsWUFBTSxXQURtQztBQUV6Q3BDLFlBQU10RSxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCMEIsWUFBeEIsQ0FBcUNzRCxNQUFNakcsT0FBM0M7QUFGbUMsS0FBMUMsRUF6RGlDLENBOERqQzs7QUFDQSxXQUFPdEcsSUFBUDtBQUNBOztBQWpFYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDQUE3QyxPQUFPNkosT0FBUCxDQUFlO0FBQ2QsNkJBQTJCbkUsR0FBM0IsRUFBZ0M7QUFDL0IsUUFBSSxDQUFDMUYsT0FBTzhKLE1BQVAsRUFBRCxJQUFvQixDQUFDcEosV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCaEQsT0FBTzhKLE1BQVAsRUFBL0IsRUFBZ0QsYUFBaEQsQ0FBekIsRUFBeUY7QUFDeEYsWUFBTSxJQUFJOUosT0FBT3NELEtBQVgsQ0FBaUIsbUJBQWpCLEVBQXNDLGFBQXRDLEVBQXFEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXJELENBQU47QUFDQSxLQUg4QixDQUsvQjs7O0FBQ0FySixlQUFXOEIsTUFBWCxDQUFrQmtVLGFBQWxCLENBQWdDTSxjQUFoQyxDQUErQ3RSLEdBQS9DLEVBTitCLENBUS9COztBQUNBLFVBQU1xQixXQUFXL0csT0FBTzhDLElBQVAsR0FBY2lFLFFBQS9CO0FBRUFyRyxlQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J3VSxrQkFBeEIsQ0FBMkN2UixHQUEzQyxFQUFnRHFCLFFBQWhELEVBWCtCLENBYS9COztBQUNBLFVBQU1rUCxVQUFVdlYsV0FBVzhCLE1BQVgsQ0FBa0IyQixlQUFsQixDQUFrQytTLE9BQWxDLENBQTBDO0FBQUN4UjtBQUFELEtBQTFDLENBQWhCLENBZCtCLENBZ0IvQjs7QUFDQSxXQUFPaEYsV0FBVzhCLE1BQVgsQ0FBa0IyQixlQUFsQixDQUFrQ2dULFdBQWxDLENBQThDbEIsUUFBUWhULEdBQXRELENBQVA7QUFDQTs7QUFuQmEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBakQsT0FBTzZKLE9BQVAsQ0FBZTtBQUNkLDZCQUEyQnVOLEdBQTNCLEVBQWdDQyxLQUFoQyxFQUF1Q0MsTUFBdkMsRUFBK0NoTyxJQUEvQyxFQUFxRDtBQUNwRDVJLGVBQVc4QixNQUFYLENBQWtCK1Usa0JBQWxCLENBQXFDQyxXQUFyQyxDQUFpREosR0FBakQsRUFBc0RDLEtBQXRELEVBQTZEQyxNQUE3RCxFQUFxRWhPLElBQXJFO0FBQ0E7O0FBSGEsQ0FBZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUltTyxNQUFKO0FBQVd0WSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsUUFBUixDQUFiLEVBQStCO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDa1ksYUFBT2xZLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSTBHLGdCQUFKO0FBQXFCOUcsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDRCQUFSLENBQWIsRUFBbUQ7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUMwRyx1QkFBaUIxRyxDQUFqQjtBQUFtQjs7QUFBL0IsQ0FBbkQsRUFBb0YsQ0FBcEY7QUFNekZTLE9BQU82SixPQUFQLENBQWU7QUFDZCw0QkFBMEIxRyxLQUExQixFQUFpQ3VDLEdBQWpDLEVBQXNDNkIsS0FBdEMsRUFBNkM7QUFDNUNvRSxVQUFNakcsR0FBTixFQUFXa0csTUFBWDtBQUNBRCxVQUFNcEUsS0FBTixFQUFhcUUsTUFBYjtBQUVBLFVBQU0vSSxPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa0ksV0FBeEIsQ0FBb0NqRixHQUFwQyxDQUFiO0FBRUEsVUFBTXhCLFVBQVUrQixpQkFBaUJ1RSxpQkFBakIsQ0FBbUNySCxLQUFuQyxDQUFoQjtBQUNBLFVBQU11VSxlQUFnQnhULFdBQVdBLFFBQVFSLFFBQXBCLElBQWlDaEQsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBakMsSUFBd0UsSUFBN0YsQ0FQNEMsQ0FTNUM7O0FBQ0EsUUFBSSxDQUFDaUMsSUFBRCxJQUFTQSxLQUFLRSxDQUFMLEtBQVcsR0FBcEIsSUFBMkIsQ0FBQ0YsS0FBS3RELENBQWpDLElBQXNDc0QsS0FBS3RELENBQUwsQ0FBTzRELEtBQVAsS0FBaUJBLEtBQTNELEVBQWtFO0FBQ2pFLFlBQU0sSUFBSW5ELE9BQU9zRCxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxDQUFOO0FBQ0E7O0FBRUQsVUFBTXlGLFdBQVdySSxXQUFXOEIsTUFBWCxDQUFrQndHLFFBQWxCLENBQTJCQyxtQkFBM0IsQ0FBK0N2RCxHQUEvQyxFQUFvRDtBQUFFd0QsWUFBTTtBQUFFLGNBQU87QUFBVDtBQUFSLEtBQXBELENBQWpCO0FBQ0EsVUFBTTJKLFNBQVNuUyxXQUFXb1MsWUFBWCxDQUF3QkMsT0FBeEIsQ0FBZ0NyUyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixjQUF4QixLQUEyQyxFQUEzRSxDQUFmO0FBQ0EsVUFBTW9TLFNBQVN0UyxXQUFXb1MsWUFBWCxDQUF3QkMsT0FBeEIsQ0FBZ0NyUyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixjQUF4QixLQUEyQyxFQUEzRSxDQUFmO0FBRUEsUUFBSWtCLE9BQU8sWUFBWDtBQUNBaUgsYUFBU04sT0FBVCxDQUFpQi9ELFdBQVc7QUFDM0IsVUFBSUEsUUFBUTNCLENBQVIsSUFBYSxDQUFDLFNBQUQsRUFBWSxnQkFBWixFQUE4QixxQkFBOUIsRUFBcUQ4SCxPQUFyRCxDQUE2RG5HLFFBQVEzQixDQUFyRSxNQUE0RSxDQUFDLENBQTlGLEVBQWlHO0FBQ2hHO0FBQ0E7O0FBRUQsVUFBSTRVLE1BQUo7O0FBQ0EsVUFBSWpULFFBQVFvQyxDQUFSLENBQVU3RCxHQUFWLEtBQWtCaUIsUUFBUWpCLEdBQTlCLEVBQW1DO0FBQ2xDMFUsaUJBQVNwVSxRQUFRQyxFQUFSLENBQVcsS0FBWCxFQUFrQjtBQUFFQyxlQUFLaVU7QUFBUCxTQUFsQixDQUFUO0FBQ0EsT0FGRCxNQUVPO0FBQ05DLGlCQUFTalQsUUFBUW9DLENBQVIsQ0FBVUMsUUFBbkI7QUFDQTs7QUFFRCxZQUFNNlEsV0FBV0gsT0FBTy9TLFFBQVFrQixFQUFmLEVBQW1CaVMsTUFBbkIsQ0FBMEJILFlBQTFCLEVBQXdDSSxNQUF4QyxDQUErQyxLQUEvQyxDQUFqQjtBQUNBLFlBQU1DLGdCQUFpQjtpQkFDUkosTUFBUSxrQkFBa0JDLFFBQVU7U0FDNUNsVCxRQUFRUSxHQUFLO0lBRnBCO0FBSUFwRCxhQUFPQSxPQUFPaVcsYUFBZDtBQUNBLEtBbEJEO0FBb0JBalcsV0FBUSxHQUFHQSxJQUFNLFFBQWpCO0FBRUEsUUFBSW1SLFlBQVl2UyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixZQUF4QixFQUFzQzBGLEtBQXRDLENBQTRDLGlEQUE1QyxDQUFoQjs7QUFFQSxRQUFJMk0sU0FBSixFQUFlO0FBQ2RBLGtCQUFZQSxVQUFVLENBQVYsQ0FBWjtBQUNBLEtBRkQsTUFFTztBQUNOQSxrQkFBWXZTLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFlBQXhCLENBQVo7QUFDQTs7QUFFRG9YLG9CQUFnQjtBQUNmdkUsVUFBSWxNLEtBRFc7QUFFZm1NLFlBQU1ULFNBRlM7QUFHZlUsZUFBU1YsU0FITTtBQUlmVyxlQUFTclEsUUFBUUMsRUFBUixDQUFXLDBDQUFYLEVBQXVEO0FBQUVDLGFBQUtpVTtBQUFQLE9BQXZELENBSk07QUFLZjVWLFlBQU0rUSxTQUFTL1EsSUFBVCxHQUFnQmtSO0FBTFAsS0FBaEI7QUFRQWhULFdBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQjJPLFlBQU1DLElBQU4sQ0FBV3dFLGFBQVg7QUFDQSxLQUZEO0FBSUFoWSxXQUFPNEUsS0FBUCxDQUFhLE1BQU07QUFDbEJsRSxpQkFBVzBDLFNBQVgsQ0FBcUJzRCxHQUFyQixDQUF5Qix5QkFBekIsRUFBb0RxQyxRQUFwRCxFQUE4RHhCLEtBQTlEO0FBQ0EsS0FGRDtBQUlBLFdBQU8sSUFBUDtBQUNBOztBQW5FYSxDQUFmO0FBc0VBdU0sZUFBZUMsT0FBZixDQUF1QjtBQUN0QjNNLFFBQU0sUUFEZ0I7QUFFdEJFLFFBQU0seUJBRmdCOztBQUd0QjBNLGlCQUFlO0FBQ2QsV0FBTyxJQUFQO0FBQ0E7O0FBTHFCLENBQXZCLEVBTUcsQ0FOSCxFQU1NLElBTk4sRTs7Ozs7Ozs7Ozs7QUM1RUE7Ozs7O0FBS0F0VCxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCNk4sV0FBeEIsR0FBc0MsVUFBU2hWLEdBQVQsRUFBY2lWLFFBQWQsRUFBd0I7QUFDN0QsUUFBTUMsU0FBUztBQUNkQyxVQUFNO0FBQ0xGO0FBREs7QUFEUSxHQUFmO0FBTUEsU0FBTyxLQUFLQyxNQUFMLENBQVlsVixHQUFaLEVBQWlCa1YsTUFBakIsQ0FBUDtBQUNBLENBUkQ7QUFVQTs7Ozs7O0FBSUF6WCxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCNEUsZ0JBQXhCLEdBQTJDLFlBQVc7QUFDckQsUUFBTS9KLFFBQVE7QUFDYmpCLFlBQVE7QUFDUHFVLGVBQVMsSUFERjtBQUVQQyxXQUFLO0FBRkUsS0FESztBQUtibk8sb0JBQWdCLFdBTEg7QUFNYm9PLFdBQU87QUFOTSxHQUFkO0FBU0EsU0FBTyxLQUFLOU0sSUFBTCxDQUFVeEcsS0FBVixDQUFQO0FBQ0EsQ0FYRDtBQWFBOzs7Ozs7QUFJQXZFLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JvTyw0QkFBeEIsR0FBdUQsVUFBU3pSLFFBQVQsRUFBbUI7QUFDekUsUUFBTTlCLFFBQVE7QUFDYjhCLFlBRGE7QUFFYi9DLFlBQVE7QUFDUHFVLGVBQVMsSUFERjtBQUVQQyxXQUFLO0FBRkUsS0FGSztBQU1ibk8sb0JBQWdCLFdBTkg7QUFPYm9PLFdBQU87QUFQTSxHQUFkO0FBVUEsU0FBTyxLQUFLckIsT0FBTCxDQUFhalMsS0FBYixDQUFQO0FBQ0EsQ0FaRDtBQWNBOzs7Ozs7QUFJQXZFLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JxTyxVQUF4QixHQUFxQyxZQUFXO0FBQy9DLFFBQU14VCxRQUFRO0FBQ2JzVCxXQUFPO0FBRE0sR0FBZDtBQUlBLFNBQU8sS0FBSzlNLElBQUwsQ0FBVXhHLEtBQVYsQ0FBUDtBQUNBLENBTkQ7QUFRQTs7Ozs7OztBQUtBdkUsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QnNPLHNCQUF4QixHQUFpRCxVQUFTQyxRQUFULEVBQW1CO0FBQ25FLFFBQU0xVCxRQUFRO0FBQ2JqQixZQUFRO0FBQ1BxVSxlQUFTLElBREY7QUFFUEMsV0FBSztBQUZFLEtBREs7QUFLYm5PLG9CQUFnQixXQUxIO0FBTWJvTyxXQUFPLGdCQU5NO0FBT2J4UixjQUFVO0FBQ1Q2UixXQUFLLEdBQUdDLE1BQUgsQ0FBVUYsUUFBVjtBQURJO0FBUEcsR0FBZDtBQVlBLFNBQU8sS0FBS2xOLElBQUwsQ0FBVXhHLEtBQVYsQ0FBUDtBQUNBLENBZEQ7QUFnQkE7Ozs7OztBQUlBdkUsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QmlGLFlBQXhCLEdBQXVDLFlBQVc7QUFDakQsUUFBTXBLLFFBQVE7QUFDYmpCLFlBQVE7QUFDUHFVLGVBQVMsSUFERjtBQUVQQyxXQUFLO0FBRkUsS0FESztBQUtibk8sb0JBQWdCLFdBTEg7QUFNYm9PLFdBQU87QUFOTSxHQUFkO0FBU0EsUUFBTU8sZ0JBQWdCLEtBQUtDLEtBQUwsQ0FBV0MsYUFBWCxFQUF0QjtBQUNBLFFBQU1DLGdCQUFnQmpaLE9BQU9xVCxTQUFQLENBQWlCeUYsY0FBY0csYUFBL0IsRUFBOENILGFBQTlDLENBQXRCO0FBRUEsUUFBTTVQLE9BQU87QUFDWmdRLG1CQUFlLENBREg7QUFFWm5TLGNBQVU7QUFGRSxHQUFiO0FBS0EsUUFBTW9SLFNBQVM7QUFDZGdCLFVBQU07QUFDTEQscUJBQWU7QUFEVjtBQURRLEdBQWY7QUFNQSxRQUFNcFcsT0FBT21XLGNBQWNoVSxLQUFkLEVBQXFCaUUsSUFBckIsRUFBMkJpUCxNQUEzQixDQUFiOztBQUNBLE1BQUlyVixRQUFRQSxLQUFLMkIsS0FBakIsRUFBd0I7QUFDdkIsV0FBTztBQUNOMEUsZUFBU3JHLEtBQUsyQixLQUFMLENBQVd4QixHQURkO0FBRU44RCxnQkFBVWpFLEtBQUsyQixLQUFMLENBQVdzQztBQUZmLEtBQVA7QUFJQSxHQUxELE1BS087QUFDTixXQUFPLElBQVA7QUFDQTtBQUNELENBakNEO0FBbUNBOzs7Ozs7QUFJQXJHLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JDLGlCQUF4QixHQUE0QyxVQUFTUCxNQUFULEVBQWlCOUYsTUFBakIsRUFBeUI7QUFDcEUsUUFBTWlCLFFBQVE7QUFDYixXQUFPNkU7QUFETSxHQUFkO0FBSUEsUUFBTXFPLFNBQVM7QUFDZEMsVUFBTTtBQUNMLHdCQUFrQnBVO0FBRGI7QUFEUSxHQUFmO0FBTUEsU0FBTyxLQUFLbVUsTUFBTCxDQUFZbFQsS0FBWixFQUFtQmtULE1BQW5CLENBQVA7QUFDQSxDQVpEO0FBY0E7Ozs7O0FBR0F6WCxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCZ1AsV0FBeEIsR0FBc0MsWUFBVztBQUNoREMsU0FBTyxJQUFQO0FBQ0FBLE9BQUtaLFVBQUwsR0FBa0JoUSxPQUFsQixDQUEwQixVQUFTMkcsS0FBVCxFQUFnQjtBQUN6Q2lLLFNBQUtoUCxpQkFBTCxDQUF1QitFLE1BQU1uTSxHQUE3QixFQUFrQyxlQUFsQztBQUNBLEdBRkQ7QUFHQSxDQUxEO0FBT0E7Ozs7O0FBR0F2QyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCa1AsVUFBeEIsR0FBcUMsWUFBVztBQUMvQ0QsU0FBTyxJQUFQO0FBQ0FBLE9BQUtaLFVBQUwsR0FBa0JoUSxPQUFsQixDQUEwQixVQUFTMkcsS0FBVCxFQUFnQjtBQUN6Q2lLLFNBQUtoUCxpQkFBTCxDQUF1QitFLE1BQU1uTSxHQUE3QixFQUFrQyxXQUFsQztBQUNBLEdBRkQ7QUFHQSxDQUxEOztBQU9BdkMsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QjBCLFlBQXhCLEdBQXVDLFVBQVMzQyxPQUFULEVBQWtCO0FBQ3hELFFBQU1sRSxRQUFRO0FBQ2JoQyxTQUFLa0c7QUFEUSxHQUFkO0FBSUEsUUFBTXJCLFVBQVU7QUFDZmlGLFlBQVE7QUFDUHpGLFlBQU0sQ0FEQztBQUVQUCxnQkFBVSxDQUZIO0FBR1B5QixvQkFBYztBQUhQO0FBRE8sR0FBaEI7O0FBUUEsTUFBSTlILFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDJCQUF4QixDQUFKLEVBQTBEO0FBQ3pEa0gsWUFBUWlGLE1BQVIsQ0FBZXdNLE1BQWYsR0FBd0IsQ0FBeEI7QUFDQTs7QUFFRCxTQUFPLEtBQUtyQyxPQUFMLENBQWFqUyxLQUFiLEVBQW9CNkMsT0FBcEIsQ0FBUDtBQUNBLENBbEJELEM7Ozs7Ozs7Ozs7O0FDaEtBLElBQUk1SSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEOztBQUVOOzs7O0FBSUFtQixXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J1UCx3QkFBeEIsR0FBbUQsVUFBUy9PLEdBQVQsRUFBY3VXLGNBQWQsRUFBOEI7QUFDaEYsUUFBTXZVLFFBQVE7QUFDYmhDO0FBRGEsR0FBZDtBQUlBLFFBQU1rVixTQUFTO0FBQ2RDLFVBQU07QUFDTG9CO0FBREs7QUFEUSxHQUFmO0FBTUEsU0FBTyxLQUFLckIsTUFBTCxDQUFZbFQsS0FBWixFQUFtQmtULE1BQW5CLENBQVA7QUFDQSxDQVpEOztBQWNBelgsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCeVIseUJBQXhCLEdBQW9ELFVBQVMvUSxLQUFULEVBQWdCcUIsR0FBaEIsRUFBcUJDLEtBQXJCLEVBQTRCd1AsWUFBWSxJQUF4QyxFQUE4QztBQUNqRyxRQUFNaFAsUUFBUTtBQUNiLGVBQVc5QixLQURFO0FBRWJtRyxVQUFNO0FBRk8sR0FBZDs7QUFLQSxNQUFJLENBQUMySyxTQUFMLEVBQWdCO0FBQ2YsVUFBTXBSLE9BQU8sS0FBS3FVLE9BQUwsQ0FBYWpTLEtBQWIsRUFBb0I7QUFBRThILGNBQVE7QUFBRW5GLHNCQUFjO0FBQWhCO0FBQVYsS0FBcEIsQ0FBYjs7QUFDQSxRQUFJL0UsS0FBSytFLFlBQUwsSUFBcUIsT0FBTy9FLEtBQUsrRSxZQUFMLENBQWtCcEQsR0FBbEIsQ0FBUCxLQUFrQyxXQUEzRCxFQUF3RTtBQUN2RSxhQUFPLElBQVA7QUFDQTtBQUNEOztBQUVELFFBQU0yVCxTQUFTO0FBQ2RDLFVBQU07QUFDTCxPQUFFLGdCQUFnQjVULEdBQUssRUFBdkIsR0FBMkJDO0FBRHRCO0FBRFEsR0FBZjtBQU1BLFNBQU8sS0FBSzBULE1BQUwsQ0FBWWxULEtBQVosRUFBbUJrVCxNQUFuQixDQUFQO0FBQ0EsQ0FwQkQ7O0FBc0JBelgsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCZ1gsWUFBeEIsR0FBdUMsVUFBU0MsU0FBUyxFQUFsQixFQUFzQkMsU0FBUyxDQUEvQixFQUFrQ3JLLFFBQVEsRUFBMUMsRUFBOEM7QUFDcEYsUUFBTXJLLFFBQVEvRixFQUFFMGEsTUFBRixDQUFTRixNQUFULEVBQWlCO0FBQzlCM1csT0FBRztBQUQyQixHQUFqQixDQUFkOztBQUlBLFNBQU8sS0FBSzBJLElBQUwsQ0FBVXhHLEtBQVYsRUFBaUI7QUFBRWlFLFVBQU07QUFBRXRELFVBQUksQ0FBRTtBQUFSLEtBQVI7QUFBcUIrVCxVQUFyQjtBQUE2QnJLO0FBQTdCLEdBQWpCLENBQVA7QUFDQSxDQU5EOztBQVFBNU8sV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxrQkFBeEIsR0FBNkMsVUFBU0gsSUFBVCxFQUFld0ssTUFBZixFQUF1QjtBQUNuRXhLLFNBQU9zWCxTQUFTdFgsSUFBVCxDQUFQO0FBRUEsUUFBTXVGLFVBQVUsRUFBaEI7O0FBRUEsTUFBSWlGLE1BQUosRUFBWTtBQUNYakYsWUFBUWlGLE1BQVIsR0FBaUJBLE1BQWpCO0FBQ0EsR0FQa0UsQ0FTbkU7QUFDQTtBQUNBOzs7QUFFQSxRQUFNOUgsUUFBUTtBQUNibEMsT0FBRyxHQURVO0FBRWJSO0FBRmEsR0FBZDtBQUtBLFNBQU8sS0FBSzJVLE9BQUwsQ0FBYWpTLEtBQWIsRUFBb0I2QyxPQUFwQixDQUFQO0FBQ0EsQ0FuQkQ7QUFxQkE7Ozs7OztBQUlBcEgsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcVgsdUJBQXhCLEdBQWtELFlBQVc7QUFDNUQsUUFBTUMsY0FBY3JaLFdBQVc4QixNQUFYLENBQWtCd1gsUUFBbEIsQ0FBMkJqQixLQUEzQixDQUFpQ0MsYUFBakMsRUFBcEI7QUFDQSxRQUFNQyxnQkFBZ0JqWixPQUFPcVQsU0FBUCxDQUFpQjBHLFlBQVlkLGFBQTdCLEVBQTRDYyxXQUE1QyxDQUF0QjtBQUVBLFFBQU05VSxRQUFRO0FBQ2JoQyxTQUFLO0FBRFEsR0FBZDtBQUlBLFFBQU1rVixTQUFTO0FBQ2RnQixVQUFNO0FBQ0wxVSxhQUFPO0FBREY7QUFEUSxHQUFmO0FBTUEsUUFBTXlVLGdCQUFnQkQsY0FBY2hVLEtBQWQsRUFBcUIsSUFBckIsRUFBMkJrVCxNQUEzQixDQUF0QjtBQUVBLFNBQU9lLGNBQWN6VSxLQUFkLENBQW9CQSxLQUEzQjtBQUNBLENBakJEOztBQW1CQS9ELFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QnFLLHNCQUF4QixHQUFpRCxVQUFTZixZQUFULEVBQXVCakUsT0FBdkIsRUFBZ0M7QUFDaEYsUUFBTTdDLFFBQVE7QUFDYnFFLFVBQU0sSUFETztBQUViLGVBQVd5QztBQUZFLEdBQWQ7QUFLQSxTQUFPLEtBQUtOLElBQUwsQ0FBVXhHLEtBQVYsRUFBaUI2QyxPQUFqQixDQUFQO0FBQ0EsQ0FQRDs7QUFTQXBILFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QndYLGtCQUF4QixHQUE2QyxVQUFTbE8sWUFBVCxFQUF1QjtBQUNuRSxRQUFNOUcsUUFBUTtBQUNiLGVBQVc4RztBQURFLEdBQWQ7QUFJQSxTQUFPLEtBQUtOLElBQUwsQ0FBVXhHLEtBQVYsQ0FBUDtBQUNBLENBTkQ7O0FBUUF2RSxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J5WCxlQUF4QixHQUEwQyxVQUFTQyxTQUFULEVBQW9CO0FBQzdELFFBQU1sVixRQUFRO0FBQ2IsYUFBU2tWO0FBREksR0FBZDtBQUlBLFNBQU8sS0FBSzFPLElBQUwsQ0FBVXhHLEtBQVYsQ0FBUDtBQUNBLENBTkQ7O0FBUUF2RSxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0I4SCx5QkFBeEIsR0FBb0QsVUFBU3BILEtBQVQsRUFBZ0JtSCxNQUFoQixFQUF3QjtBQUMzRSxRQUFNckYsUUFBUTtBQUNiaEMsU0FBS3FILE1BRFE7QUFFYmhCLFVBQU0sSUFGTztBQUdiLGVBQVduRztBQUhFLEdBQWQ7QUFNQSxTQUFPLEtBQUsrVCxPQUFMLENBQWFqUyxLQUFiLENBQVA7QUFDQSxDQVJEOztBQVVBdkUsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCb0UsbUJBQXhCLEdBQThDLFVBQVN5RCxNQUFULEVBQWlCekYsUUFBakIsRUFBMkI7QUFDeEUsU0FBTyxLQUFLc1QsTUFBTCxDQUFZO0FBQ2xCbFYsU0FBS3FIO0FBRGEsR0FBWixFQUVKO0FBQ0Y4TixVQUFNO0FBQ0xnQyxrQkFBWTtBQUNYblgsYUFBSzRCLFNBQVMvQixJQUFULENBQWNHLEdBRFI7QUFFWDhELGtCQUFVbEMsU0FBUy9CLElBQVQsQ0FBY2lFO0FBRmIsT0FEUDtBQUtMQyxvQkFBY25DLFNBQVNtQyxZQUxsQjtBQU1MQyxvQkFBY3BDLFNBQVNvQztBQU5sQixLQURKO0FBU0ZvVCxZQUFRO0FBQ1AxVCx1QkFBaUI7QUFEVjtBQVROLEdBRkksQ0FBUDtBQWVBLENBaEJEOztBQWtCQWpHLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjZYLGFBQXhCLEdBQXdDLFVBQVNoUSxNQUFULEVBQWlCaVEsU0FBakIsRUFBNEI7QUFDbkUsU0FBTyxLQUFLcEMsTUFBTCxDQUFZO0FBQ2xCbFYsU0FBS3FIO0FBRGEsR0FBWixFQUVKO0FBQ0Y4TixVQUFNO0FBQ0xvQyxjQUFRRCxVQUFVQyxNQURiO0FBRUxDLGdCQUFVRixVQUFVRSxRQUZmO0FBR0xDLGdCQUFVSCxVQUFVRyxRQUhmO0FBSUxDLG9CQUFjSixVQUFVSSxZQUpuQjtBQUtMLGtCQUFZO0FBTFAsS0FESjtBQVFGTixZQUFRO0FBQ1AvUSxZQUFNO0FBREM7QUFSTixHQUZJLENBQVA7QUFjQSxDQWZEOztBQWlCQTVJLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3Qm1ZLGdCQUF4QixHQUEyQyxVQUFTdFEsTUFBVCxFQUFpQnFHLEtBQWpCLEVBQXdCO0FBQ2xFLFNBQU8sS0FBS3dILE1BQUwsQ0FBWTtBQUFFbFYsU0FBS3FIO0FBQVAsR0FBWixFQUE2QjtBQUFFOE4sVUFBTTtBQUFFekg7QUFBRjtBQUFSLEdBQTdCLENBQVA7QUFDQSxDQUZEOztBQUlBalEsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCb1ksZUFBeEIsR0FBMEMsVUFBUy9RLE1BQVQsRUFBaUI7QUFDMUQsUUFBTTdFLFFBQVE7QUFDYnFFLFVBQU0sSUFETztBQUViLG9CQUFnQlE7QUFGSCxHQUFkO0FBS0EsU0FBTyxLQUFLMkIsSUFBTCxDQUFVeEcsS0FBVixDQUFQO0FBQ0EsQ0FQRDs7QUFTQXZFLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtVLG1CQUF4QixHQUE4QyxVQUFTck0sTUFBVCxFQUFpQndRLFFBQWpCLEVBQTJCO0FBQ3hFLFFBQU03VixRQUFRO0FBQ2JoQyxTQUFLcUg7QUFEUSxHQUFkO0FBR0EsUUFBTTZOLFNBQVM7QUFDZEMsVUFBTTtBQUNMdk0sZ0JBQVU7QUFDVDVJLGFBQUs2WCxTQUFTM1IsT0FETDtBQUVUcEMsa0JBQVUrVCxTQUFTL1Q7QUFGVjtBQURMO0FBRFEsR0FBZjtBQVNBLE9BQUtvUixNQUFMLENBQVlsVCxLQUFaLEVBQW1Ca1QsTUFBbkI7QUFDQSxDQWREOztBQWdCQXpYLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjRHLG1CQUF4QixHQUE4QyxVQUFTaUIsTUFBVCxFQUFpQnlRLE9BQWpCLEVBQTBCO0FBQ3ZFLFFBQU05VixRQUFRO0FBQ2JoQyxTQUFLcUg7QUFEUSxHQUFkO0FBR0EsUUFBTTZOLFNBQVM7QUFDZEMsVUFBTTtBQUNMMkM7QUFESztBQURRLEdBQWY7QUFNQSxTQUFPLEtBQUs1QyxNQUFMLENBQVlsVCxLQUFaLEVBQW1Ca1QsTUFBbkIsQ0FBUDtBQUNBLENBWEQ7O0FBYUF6WCxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0IyQixtQkFBeEIsR0FBOEMsVUFBU2pCLEtBQVQsRUFBZ0JhLE1BQWhCLEVBQXdCO0FBQ3JFLFFBQU1pQixRQUFRO0FBQ2IsZUFBVzlCLEtBREU7QUFFYm1HLFVBQU07QUFGTyxHQUFkO0FBS0EsUUFBTTZPLFNBQVM7QUFDZEMsVUFBTTtBQUNMLGtCQUFZcFU7QUFEUDtBQURRLEdBQWY7QUFNQSxTQUFPLEtBQUttVSxNQUFMLENBQVlsVCxLQUFaLEVBQW1Ca1QsTUFBbkIsQ0FBUDtBQUNBLENBYkQsQzs7Ozs7Ozs7Ozs7QUM5TUEsTUFBTTNTLHVCQUFOLFNBQXNDOUUsV0FBVzhCLE1BQVgsQ0FBa0J3WSxLQUF4RCxDQUE4RDtBQUM3REMsZ0JBQWM7QUFDYixVQUFNLDJCQUFOOztBQUVBLFFBQUlqYixPQUFPa2IsUUFBWCxFQUFxQjtBQUNwQixXQUFLQyxVQUFMLENBQWdCLDJCQUFoQjtBQUNBO0FBQ0QsR0FQNEQsQ0FTN0Q7OztBQUNBQyxlQUFhOVEsTUFBYixFQUFxQnBCLE9BQU87QUFBRXRELFFBQUksQ0FBQztBQUFQLEdBQTVCLEVBQXdDO0FBQ3ZDLFVBQU1YLFFBQVE7QUFBRVMsV0FBSzRFO0FBQVAsS0FBZDtBQUVBLFdBQU8sS0FBS21CLElBQUwsQ0FBVXhHLEtBQVYsRUFBaUI7QUFBRWlFO0FBQUYsS0FBakIsQ0FBUDtBQUNBOztBQWQ0RDs7QUFpQjlEeEksV0FBVzhCLE1BQVgsQ0FBa0JnRCx1QkFBbEIsR0FBNEMsSUFBSUEsdUJBQUosRUFBNUMsQzs7Ozs7Ozs7Ozs7QUNqQkEsSUFBSXRHLENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7O0FBRU47OztBQUdBLE1BQU1pTSxtQkFBTixTQUFrQzlLLFdBQVc4QixNQUFYLENBQWtCd1ksS0FBcEQsQ0FBMEQ7QUFDekRDLGdCQUFjO0FBQ2IsVUFBTSx1QkFBTjtBQUNBLEdBSHdELENBS3pEOzs7QUFDQXRRLGNBQVkxSCxHQUFaLEVBQWlCNkUsT0FBakIsRUFBMEI7QUFDekIsVUFBTTdDLFFBQVE7QUFBRWhDO0FBQUYsS0FBZDtBQUVBLFdBQU8sS0FBS2lVLE9BQUwsQ0FBYWpTLEtBQWIsRUFBb0I2QyxPQUFwQixDQUFQO0FBQ0E7O0FBRURnSiw0QkFBMEI3TixHQUExQixFQUErQnlGLEtBQS9CLEVBQXNDaUksS0FBdEMsRUFBNkNDLEtBQTdDLEVBQW9EQyxVQUFwRCxFQUFnRTNOLFNBQWhFLEVBQTJFO0FBQzFFLFVBQU1tWSxTQUFTO0FBQ2QxSyxXQURjO0FBRWRDLFdBRmM7QUFHZEM7QUFIYyxLQUFmOztBQU1BM1IsTUFBRTBhLE1BQUYsQ0FBU3lCLE1BQVQsRUFBaUJuWSxTQUFqQjs7QUFFQSxRQUFJRCxHQUFKLEVBQVM7QUFDUixXQUFLa1YsTUFBTCxDQUFZO0FBQUVsVjtBQUFGLE9BQVosRUFBcUI7QUFBRW1WLGNBQU1pRDtBQUFSLE9BQXJCO0FBQ0EsS0FGRCxNQUVPO0FBQ05BLGFBQU9wWSxHQUFQLEdBQWF5RixLQUFiO0FBQ0F6RixZQUFNLEtBQUt3QyxNQUFMLENBQVk0VixNQUFaLENBQU47QUFDQTs7QUFFRCxXQUFPQSxNQUFQO0FBQ0EsR0E3QndELENBK0J6RDs7O0FBQ0FyTCxhQUFXL00sR0FBWCxFQUFnQjtBQUNmLFVBQU1nQyxRQUFRO0FBQUVoQztBQUFGLEtBQWQ7QUFFQSxXQUFPLEtBQUtxWSxNQUFMLENBQVlyVyxLQUFaLENBQVA7QUFDQTs7QUFwQ3dEOztBQXVDMUR2RSxXQUFXOEIsTUFBWCxDQUFrQmdKLG1CQUFsQixHQUF3QyxJQUFJQSxtQkFBSixFQUF4QyxDOzs7Ozs7Ozs7OztBQzVDQSxJQUFJdE0sQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDs7QUFFTjs7O0FBR0EsTUFBTXFQLGtCQUFOLFNBQWlDbE8sV0FBVzhCLE1BQVgsQ0FBa0J3WSxLQUFuRCxDQUF5RDtBQUN4REMsZ0JBQWM7QUFDYixVQUFNLHFCQUFOO0FBRUEsU0FBS00sY0FBTCxDQUFvQjtBQUNuQkMsaUJBQVcsQ0FEUTtBQUVuQnpRLGVBQVM7QUFGVSxLQUFwQjtBQUlBLEdBUnVELENBVXhEOzs7QUFDQUosY0FBWTFILEdBQVosRUFBaUI2RSxPQUFqQixFQUEwQjtBQUN6QixVQUFNN0MsUUFBUTtBQUFFaEM7QUFBRixLQUFkO0FBRUEsV0FBTyxLQUFLaVUsT0FBTCxDQUFhalMsS0FBYixFQUFvQjZDLE9BQXBCLENBQVA7QUFDQTs7QUFFRDJULHFCQUFtQnhZLEdBQW5CLEVBQXdCNkUsT0FBeEIsRUFBaUM7QUFDaEMsVUFBTTdDLFFBQVE7QUFBRWhDO0FBQUYsS0FBZDtBQUVBLFdBQU8sS0FBS3dJLElBQUwsQ0FBVXhHLEtBQVYsRUFBaUI2QyxPQUFqQixDQUFQO0FBQ0E7O0FBRUQ0VCwyQkFBeUJ6WSxHQUF6QixFQUE4QjtBQUFFOEgsV0FBRjtBQUFXekQsUUFBWDtBQUFpQjRLLGVBQWpCO0FBQThCeUo7QUFBOUIsR0FBOUIsRUFBa0ZDLE1BQWxGLEVBQTBGO0FBQ3pGQSxhQUFTLEdBQUcvQyxNQUFILENBQVUrQyxNQUFWLENBQVQ7QUFFQSxVQUFNUCxTQUFTO0FBQ2R0USxhQURjO0FBRWR6RCxVQUZjO0FBR2Q0SyxpQkFIYztBQUlkc0osaUJBQVdJLE9BQU8zTyxNQUpKO0FBS2QwTztBQUxjLEtBQWY7O0FBUUEsUUFBSTFZLEdBQUosRUFBUztBQUNSLFdBQUtrVixNQUFMLENBQVk7QUFBRWxWO0FBQUYsT0FBWixFQUFxQjtBQUFFbVYsY0FBTWlEO0FBQVIsT0FBckI7QUFDQSxLQUZELE1BRU87QUFDTnBZLFlBQU0sS0FBS3dDLE1BQUwsQ0FBWTRWLE1BQVosQ0FBTjtBQUNBOztBQUVELFVBQU1RLGNBQWMzYyxFQUFFNGMsS0FBRixDQUFRcGIsV0FBVzhCLE1BQVgsQ0FBa0J1Wix3QkFBbEIsQ0FBMkNOLGtCQUEzQyxDQUE4RHhZLEdBQTlELEVBQW1FeUksS0FBbkUsRUFBUixFQUFvRixTQUFwRixDQUFwQjs7QUFDQSxVQUFNc1EsZUFBZTljLEVBQUU0YyxLQUFGLENBQVFGLE1BQVIsRUFBZ0IsU0FBaEIsQ0FBckIsQ0FsQnlGLENBb0J6Rjs7O0FBQ0ExYyxNQUFFK2MsVUFBRixDQUFhSixXQUFiLEVBQTBCRyxZQUExQixFQUF3Q3ZULE9BQXhDLENBQWlEVSxPQUFELElBQWE7QUFDNUR6SSxpQkFBVzhCLE1BQVgsQ0FBa0J1Wix3QkFBbEIsQ0FBMkNHLDhCQUEzQyxDQUEwRWpaLEdBQTFFLEVBQStFa0csT0FBL0U7QUFDQSxLQUZEOztBQUlBeVMsV0FBT25ULE9BQVAsQ0FBZ0IyRyxLQUFELElBQVc7QUFDekIxTyxpQkFBVzhCLE1BQVgsQ0FBa0J1Wix3QkFBbEIsQ0FBMkNJLFNBQTNDLENBQXFEO0FBQ3BEaFQsaUJBQVNpRyxNQUFNakcsT0FEcUM7QUFFcEQ0TCxzQkFBYzlSLEdBRnNDO0FBR3BEOEQsa0JBQVVxSSxNQUFNckksUUFIb0M7QUFJcERrSSxlQUFPRyxNQUFNSCxLQUFOLEdBQWM0SyxTQUFTekssTUFBTUgsS0FBZixDQUFkLEdBQXNDLENBSk87QUFLcERtTixlQUFPaE4sTUFBTWdOLEtBQU4sR0FBY3ZDLFNBQVN6SyxNQUFNZ04sS0FBZixDQUFkLEdBQXNDO0FBTE8sT0FBckQ7QUFPQSxLQVJEO0FBVUEsV0FBT2xkLEVBQUUwYSxNQUFGLENBQVN5QixNQUFULEVBQWlCO0FBQUVwWTtBQUFGLEtBQWpCLENBQVA7QUFDQSxHQTNEdUQsQ0E2RHhEOzs7QUFDQStNLGFBQVcvTSxHQUFYLEVBQWdCO0FBQ2YsVUFBTWdDLFFBQVE7QUFBRWhDO0FBQUYsS0FBZDtBQUVBLFdBQU8sS0FBS3FZLE1BQUwsQ0FBWXJXLEtBQVosQ0FBUDtBQUNBOztBQUVENEosMEJBQXdCO0FBQ3ZCLFVBQU01SixRQUFRO0FBQ2J1VyxpQkFBVztBQUFFYSxhQUFLO0FBQVAsT0FERTtBQUVidFIsZUFBUztBQUZJLEtBQWQ7QUFJQSxXQUFPLEtBQUtVLElBQUwsQ0FBVXhHLEtBQVYsQ0FBUDtBQUNBOztBQTFFdUQ7O0FBNkV6RHZFLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLEdBQXVDLElBQUlBLGtCQUFKLEVBQXZDLEM7Ozs7Ozs7Ozs7O0FDbEZBLElBQUkxUCxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEOztBQUNOOzs7QUFHQSxNQUFNd2Msd0JBQU4sU0FBdUNyYixXQUFXOEIsTUFBWCxDQUFrQndZLEtBQXpELENBQStEO0FBQzlEQyxnQkFBYztBQUNiLFVBQU0sNEJBQU47QUFDQTs7QUFFRFEscUJBQW1CMUcsWUFBbkIsRUFBaUM7QUFDaEMsV0FBTyxLQUFLdEosSUFBTCxDQUFVO0FBQUVzSjtBQUFGLEtBQVYsQ0FBUDtBQUNBOztBQUVEb0gsWUFBVS9NLEtBQVYsRUFBaUI7QUFDaEIsV0FBTyxLQUFLa04sTUFBTCxDQUFZO0FBQ2xCblQsZUFBU2lHLE1BQU1qRyxPQURHO0FBRWxCNEwsb0JBQWMzRixNQUFNMkY7QUFGRixLQUFaLEVBR0o7QUFDRnFELFlBQU07QUFDTHJSLGtCQUFVcUksTUFBTXJJLFFBRFg7QUFFTGtJLGVBQU80SyxTQUFTekssTUFBTUgsS0FBZixDQUZGO0FBR0xtTixlQUFPdkMsU0FBU3pLLE1BQU1nTixLQUFmO0FBSEY7QUFESixLQUhJLENBQVA7QUFVQTs7QUFFREYsaUNBQStCbkgsWUFBL0IsRUFBNkM1TCxPQUE3QyxFQUFzRDtBQUNyRCxTQUFLbVMsTUFBTCxDQUFZO0FBQUV2RyxrQkFBRjtBQUFnQjVMO0FBQWhCLEtBQVo7QUFDQTs7QUFFRG9ULDRCQUEwQnhILFlBQTFCLEVBQXdDO0FBQ3ZDLFVBQU02RyxTQUFTLEtBQUtILGtCQUFMLENBQXdCMUcsWUFBeEIsRUFBc0NySixLQUF0QyxFQUFmOztBQUVBLFFBQUlrUSxPQUFPM08sTUFBUCxLQUFrQixDQUF0QixFQUF5QjtBQUN4QjtBQUNBOztBQUVELFVBQU11UCxjQUFjOWIsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QnNPLHNCQUF4QixDQUErQ3haLEVBQUU0YyxLQUFGLENBQVFGLE1BQVIsRUFBZ0IsVUFBaEIsQ0FBL0MsQ0FBcEI7O0FBRUEsVUFBTWEsa0JBQWtCdmQsRUFBRTRjLEtBQUYsQ0FBUVUsWUFBWTlRLEtBQVosRUFBUixFQUE2QixVQUE3QixDQUF4Qjs7QUFFQSxVQUFNekcsUUFBUTtBQUNiOFAsa0JBRGE7QUFFYmhPLGdCQUFVO0FBQ1Q2UixhQUFLNkQ7QUFESTtBQUZHLEtBQWQ7QUFPQSxVQUFNdlQsT0FBTztBQUNaK0YsYUFBTyxDQURLO0FBRVptTixhQUFPLENBRks7QUFHWnJWLGdCQUFVO0FBSEUsS0FBYjtBQUtBLFVBQU1vUixTQUFTO0FBQ2RnQixZQUFNO0FBQ0xsSyxlQUFPO0FBREY7QUFEUSxLQUFmO0FBTUEsVUFBTTZKLGdCQUFnQixLQUFLQyxLQUFMLENBQVdDLGFBQVgsRUFBdEI7QUFDQSxVQUFNQyxnQkFBZ0JqWixPQUFPcVQsU0FBUCxDQUFpQnlGLGNBQWNHLGFBQS9CLEVBQThDSCxhQUE5QyxDQUF0QjtBQUVBLFVBQU0xSixRQUFRNkosY0FBY2hVLEtBQWQsRUFBcUJpRSxJQUFyQixFQUEyQmlQLE1BQTNCLENBQWQ7O0FBQ0EsUUFBSS9JLFNBQVNBLE1BQU0zSyxLQUFuQixFQUEwQjtBQUN6QixhQUFPO0FBQ04wRSxpQkFBU2lHLE1BQU0zSyxLQUFOLENBQVkwRSxPQURmO0FBRU5wQyxrQkFBVXFJLE1BQU0zSyxLQUFOLENBQVlzQztBQUZoQixPQUFQO0FBSUEsS0FMRCxNQUtPO0FBQ04sYUFBTyxJQUFQO0FBQ0E7QUFDRDs7QUFFRDJWLHlCQUF1QjNILFlBQXZCLEVBQXFDO0FBQ3BDLFVBQU02RyxTQUFTLEtBQUtILGtCQUFMLENBQXdCMUcsWUFBeEIsRUFBc0NySixLQUF0QyxFQUFmOztBQUVBLFFBQUlrUSxPQUFPM08sTUFBUCxLQUFrQixDQUF0QixFQUF5QjtBQUN4QixhQUFPLEVBQVA7QUFDQTs7QUFFRCxVQUFNdVAsY0FBYzliLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JzTyxzQkFBeEIsQ0FBK0N4WixFQUFFNGMsS0FBRixDQUFRRixNQUFSLEVBQWdCLFVBQWhCLENBQS9DLENBQXBCOztBQUVBLFVBQU1hLGtCQUFrQnZkLEVBQUU0YyxLQUFGLENBQVFVLFlBQVk5USxLQUFaLEVBQVIsRUFBNkIsVUFBN0IsQ0FBeEI7O0FBRUEsVUFBTXpHLFFBQVE7QUFDYjhQLGtCQURhO0FBRWJoTyxnQkFBVTtBQUNUNlIsYUFBSzZEO0FBREk7QUFGRyxLQUFkO0FBT0EsVUFBTUUsWUFBWSxLQUFLbFIsSUFBTCxDQUFVeEcsS0FBVixDQUFsQjs7QUFFQSxRQUFJMFgsU0FBSixFQUFlO0FBQ2QsYUFBT0EsU0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLGFBQU8sRUFBUDtBQUNBO0FBQ0Q7O0FBRURDLG1CQUFpQkMsU0FBakIsRUFBNEI7QUFDM0IsVUFBTTVYLFFBQVEsRUFBZDs7QUFFQSxRQUFJLENBQUMvRixFQUFFNkIsT0FBRixDQUFVOGIsU0FBVixDQUFMLEVBQTJCO0FBQzFCNVgsWUFBTThCLFFBQU4sR0FBaUI7QUFDaEI2UixhQUFLaUU7QUFEVyxPQUFqQjtBQUdBOztBQUVELFVBQU0vVSxVQUFVO0FBQ2ZvQixZQUFNO0FBQ0w2TCxzQkFBYyxDQURUO0FBRUw5RixlQUFPLENBRkY7QUFHTG1OLGVBQU8sQ0FIRjtBQUlMclYsa0JBQVU7QUFKTDtBQURTLEtBQWhCO0FBU0EsV0FBTyxLQUFLMEUsSUFBTCxDQUFVeEcsS0FBVixFQUFpQjZDLE9BQWpCLENBQVA7QUFDQTs7QUFuSDZEOztBQXNIL0RwSCxXQUFXOEIsTUFBWCxDQUFrQnVaLHdCQUFsQixHQUE2QyxJQUFJQSx3QkFBSixFQUE3QyxDOzs7Ozs7Ozs7OztBQzFIQTs7O0FBR0EsTUFBTW5NLG1CQUFOLFNBQWtDbFAsV0FBVzhCLE1BQVgsQ0FBa0J3WSxLQUFwRCxDQUEwRDtBQUN6REMsZ0JBQWM7QUFDYixVQUFNLHVCQUFOO0FBRUEsU0FBS00sY0FBTCxDQUFvQjtBQUFFLGVBQVM7QUFBWCxLQUFwQjtBQUNBLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxZQUFNO0FBQVIsS0FBcEIsRUFKYSxDQU1iOztBQUNBLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxrQkFBWTtBQUFkLEtBQXBCLEVBQXVDO0FBQUV1QixjQUFRLENBQVY7QUFBYUMsMEJBQW9CO0FBQWpDLEtBQXZDO0FBQ0E7O0FBRURDLGNBQVk3WixLQUFaLEVBQW1Cc00sUUFBbkIsRUFBNkI7QUFDNUI7QUFDQSxVQUFNd04seUJBQXlCLFVBQS9CO0FBRUEsV0FBTyxLQUFLeFgsTUFBTCxDQUFZO0FBQ2xCdEMsV0FEa0I7QUFFbEJ1RyxZQUFNK0YsUUFGWTtBQUdsQjdKLFVBQUksSUFBSUMsSUFBSixFQUhjO0FBSWxCcVgsZ0JBQVUsSUFBSXJYLElBQUosR0FBV3FCLE9BQVgsS0FBdUIrVjtBQUpmLEtBQVosQ0FBUDtBQU1BOztBQUVERSxjQUFZaGEsS0FBWixFQUFtQjtBQUNsQixXQUFPLEtBQUtzSSxJQUFMLENBQVU7QUFBRXRJO0FBQUYsS0FBVixFQUFxQjtBQUFFK0YsWUFBTztBQUFFdEQsWUFBSSxDQUFDO0FBQVAsT0FBVDtBQUFxQjBKLGFBQU87QUFBNUIsS0FBckIsQ0FBUDtBQUNBOztBQUVETyxzQkFBb0IxTSxLQUFwQixFQUEyQjtBQUMxQixXQUFPLEtBQUtnVixNQUFMLENBQVk7QUFDbEJoVixXQURrQjtBQUVsQitaLGdCQUFVO0FBQ1Q3RSxpQkFBUztBQURBO0FBRlEsS0FBWixFQUtKO0FBQ0ZnQyxjQUFRO0FBQ1A2QyxrQkFBVTtBQURIO0FBRE4sS0FMSSxFQVNKO0FBQ0ZFLGFBQU87QUFETCxLQVRJLENBQVA7QUFZQTs7QUF4Q3dEOztBQTJDMUQxYyxXQUFXOEIsTUFBWCxDQUFrQm9OLG1CQUFsQixHQUF3QyxJQUFJQSxtQkFBSixFQUF4QyxDOzs7Ozs7Ozs7OztBQzlDQTs7O0FBR0EsTUFBTXBCLGVBQU4sU0FBOEI5TixXQUFXOEIsTUFBWCxDQUFrQndZLEtBQWhELENBQXNEO0FBQ3JEQyxnQkFBYztBQUNiLFVBQU0sa0JBQU47QUFDQTs7QUFFRDlQLGFBQVdsSSxHQUFYLEVBQWdCK0IsSUFBaEIsRUFBc0I7QUFDckIsV0FBTyxLQUFLbVQsTUFBTCxDQUFZO0FBQUVsVjtBQUFGLEtBQVosRUFBcUI7QUFBRW1WLFlBQU1wVDtBQUFSLEtBQXJCLENBQVA7QUFDQTs7QUFFRHFZLGNBQVk7QUFDWCxXQUFPLEtBQUsvQixNQUFMLENBQVksRUFBWixDQUFQO0FBQ0E7O0FBRURnQyxXQUFTcmEsR0FBVCxFQUFjO0FBQ2IsV0FBTyxLQUFLd0ksSUFBTCxDQUFVO0FBQUV4STtBQUFGLEtBQVYsQ0FBUDtBQUNBOztBQUVEK00sYUFBVy9NLEdBQVgsRUFBZ0I7QUFDZixXQUFPLEtBQUtxWSxNQUFMLENBQVk7QUFBRXJZO0FBQUYsS0FBWixDQUFQO0FBQ0E7O0FBRUR3TCxnQkFBYztBQUNiLFdBQU8sS0FBS2hELElBQUwsQ0FBVTtBQUFFVixlQUFTO0FBQVgsS0FBVixDQUFQO0FBQ0E7O0FBdkJvRDs7QUEwQnREckssV0FBVzhCLE1BQVgsQ0FBa0JnTSxlQUFsQixHQUFvQyxJQUFJQSxlQUFKLEVBQXBDLEM7Ozs7Ozs7Ozs7O0FDN0JBeE8sT0FBT29DLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCMUIsYUFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCOFksY0FBeEIsQ0FBdUM7QUFBRWhaLFVBQU07QUFBUixHQUF2QztBQUNBN0IsYUFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCOFksY0FBeEIsQ0FBdUM7QUFBRWpTLFVBQU07QUFBUixHQUF2QyxFQUFvRDtBQUFFd1QsWUFBUTtBQUFWLEdBQXBEO0FBQ0FwYyxhQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCbVIsY0FBeEIsQ0FBdUM7QUFBRSw2QkFBeUI7QUFBM0IsR0FBdkM7QUFDQSxDQUpELEU7Ozs7Ozs7Ozs7O0FDQUEsTUFBTXBYLGVBQU4sU0FBOEJ6RCxXQUFXOEIsTUFBWCxDQUFrQndZLEtBQWhELENBQXNEO0FBQ3JEQyxnQkFBYztBQUNiLFVBQU0sa0JBQU47QUFFQSxTQUFLTSxjQUFMLENBQW9CO0FBQUUsYUFBTztBQUFULEtBQXBCLEVBSGEsQ0FHc0I7O0FBQ25DLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxjQUFRO0FBQVYsS0FBcEIsRUFKYSxDQUl1Qjs7QUFDcEMsU0FBS0EsY0FBTCxDQUFvQjtBQUFFLGlCQUFXO0FBQWIsS0FBcEIsRUFMYSxDQUswQjs7QUFDdkMsU0FBS0EsY0FBTCxDQUFvQjtBQUFFLFlBQU07QUFBUixLQUFwQixFQU5hLENBTXFCOztBQUNsQyxTQUFLQSxjQUFMLENBQW9CO0FBQUUsY0FBUTtBQUFWLEtBQXBCLEVBUGEsQ0FPdUI7O0FBQ3BDLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxnQkFBVTtBQUFaLEtBQXBCLEVBUmEsQ0FRd0I7O0FBQ3JDLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxnQkFBVTtBQUFaLEtBQXBCLEVBVGEsQ0FTd0I7QUFDckM7O0FBRUQ1USxjQUFZcUwsU0FBWixFQUF1QjtBQUN0QixXQUFPLEtBQUtrQixPQUFMLENBQWE7QUFBRWpVLFdBQUsrUztBQUFQLEtBQWIsQ0FBUDtBQUNBO0FBRUQ7Ozs7O0FBR0FZLGNBQVlaLFNBQVosRUFBdUI7QUFDdEIsU0FBS21DLE1BQUwsQ0FBWTtBQUNYLGFBQU9uQztBQURJLEtBQVosRUFFRztBQUNGb0MsWUFBTTtBQUFFcFUsZ0JBQVE7QUFBVjtBQURKLEtBRkg7QUFLQTtBQUVEOzs7OztBQUdBc1csZ0JBQWNoUSxNQUFkLEVBQXNCaVEsU0FBdEIsRUFBaUM7QUFDaEMsV0FBTyxLQUFLcEMsTUFBTCxDQUFZO0FBQ2xCelMsV0FBSzRFO0FBRGEsS0FBWixFQUVKO0FBQ0Y4TixZQUFNO0FBQ0xwVSxnQkFBUSxRQURIO0FBRUx3VyxnQkFBUUQsVUFBVUMsTUFGYjtBQUdMQyxrQkFBVUYsVUFBVUUsUUFIZjtBQUlMQyxrQkFBVUgsVUFBVUcsUUFKZjtBQUtMQyxzQkFBY0osVUFBVUk7QUFMbkI7QUFESixLQUZJLENBQVA7QUFXQTtBQUVEOzs7OztBQUdBeEQsY0FBWW5CLFNBQVosRUFBdUI7QUFDdEIsU0FBS21DLE1BQUwsQ0FBWTtBQUNYLGFBQU9uQztBQURJLEtBQVosRUFFRztBQUNGb0MsWUFBTTtBQUFFcFUsZ0JBQVE7QUFBVjtBQURKLEtBRkg7QUFLQTtBQUVEOzs7OztBQUdBdVosWUFBVXZILFNBQVYsRUFBcUI7QUFDcEIsV0FBTyxLQUFLa0IsT0FBTCxDQUFhO0FBQUMsYUFBT2xCO0FBQVIsS0FBYixFQUFpQ2hTLE1BQXhDO0FBQ0E7O0FBRURJLHNCQUFvQmpCLEtBQXBCLEVBQTJCYSxNQUEzQixFQUFtQztBQUNsQyxVQUFNaUIsUUFBUTtBQUNiLGlCQUFXOUIsS0FERTtBQUViYSxjQUFRO0FBRkssS0FBZDtBQUtBLFVBQU1tVSxTQUFTO0FBQ2RDLFlBQU07QUFDTCxvQkFBWXBVO0FBRFA7QUFEUSxLQUFmO0FBTUEsV0FBTyxLQUFLbVUsTUFBTCxDQUFZbFQsS0FBWixFQUFtQmtULE1BQW5CLENBQVA7QUFDQTs7QUE1RW9EOztBQStFdER6WCxXQUFXOEIsTUFBWCxDQUFrQjJCLGVBQWxCLEdBQW9DLElBQUlBLGVBQUosRUFBcEMsQzs7Ozs7Ozs7Ozs7QUMvRUEsSUFBSXNULE1BQUo7QUFBV3RZLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNrWSxhQUFPbFksQ0FBUDtBQUFTOztBQUFyQixDQUEvQixFQUFzRCxDQUF0RDs7QUFFWCxNQUFNZ1ksa0JBQU4sU0FBaUM3VyxXQUFXOEIsTUFBWCxDQUFrQndZLEtBQW5ELENBQXlEO0FBQ3hEQyxnQkFBYztBQUNiLFVBQU0sc0JBQU47QUFFQSxTQUFLTSxjQUFMLENBQW9CO0FBQUUsYUFBTztBQUFULEtBQXBCLEVBSGEsQ0FHc0I7O0FBQ25DLFNBQUtBLGNBQUwsQ0FBb0I7QUFBRSxlQUFTO0FBQVgsS0FBcEIsRUFKYSxDQUl3Qjs7QUFDckMsU0FBS0EsY0FBTCxDQUFvQjtBQUFFLGdCQUFVO0FBQVosS0FBcEIsRUFMYSxDQUt5Qjs7QUFDdEMsU0FBS0EsY0FBTCxDQUFvQjtBQUFFLGNBQVE7QUFBVixLQUFwQixFQU5hLENBTXVCO0FBRXBDOztBQUNBLFFBQUksS0FBSzlQLElBQUwsR0FBWXdELEtBQVosT0FBd0IsQ0FBNUIsRUFBK0I7QUFDOUIsV0FBS3hKLE1BQUwsQ0FBWTtBQUFDLGVBQVEsUUFBVDtBQUFtQixpQkFBVSxPQUE3QjtBQUFzQyxrQkFBVyxPQUFqRDtBQUEwRCxnQkFBUyxDQUFuRTtBQUFzRSxnQkFBUztBQUEvRSxPQUFaO0FBQ0EsV0FBS0EsTUFBTCxDQUFZO0FBQUMsZUFBUSxTQUFUO0FBQW9CLGlCQUFVLE9BQTlCO0FBQXVDLGtCQUFXLE9BQWxEO0FBQTJELGdCQUFTLENBQXBFO0FBQXVFLGdCQUFTO0FBQWhGLE9BQVo7QUFDQSxXQUFLQSxNQUFMLENBQVk7QUFBQyxlQUFRLFdBQVQ7QUFBc0IsaUJBQVUsT0FBaEM7QUFBeUMsa0JBQVcsT0FBcEQ7QUFBNkQsZ0JBQVMsQ0FBdEU7QUFBeUUsZ0JBQVM7QUFBbEYsT0FBWjtBQUNBLFdBQUtBLE1BQUwsQ0FBWTtBQUFDLGVBQVEsVUFBVDtBQUFxQixpQkFBVSxPQUEvQjtBQUF3QyxrQkFBVyxPQUFuRDtBQUE0RCxnQkFBUyxDQUFyRTtBQUF3RSxnQkFBUztBQUFqRixPQUFaO0FBQ0EsV0FBS0EsTUFBTCxDQUFZO0FBQUMsZUFBUSxRQUFUO0FBQW1CLGlCQUFVLE9BQTdCO0FBQXNDLGtCQUFXLE9BQWpEO0FBQTBELGdCQUFTLENBQW5FO0FBQXNFLGdCQUFTO0FBQS9FLE9BQVo7QUFDQSxXQUFLQSxNQUFMLENBQVk7QUFBQyxlQUFRLFVBQVQ7QUFBcUIsaUJBQVUsT0FBL0I7QUFBd0Msa0JBQVcsT0FBbkQ7QUFBNEQsZ0JBQVMsQ0FBckU7QUFBd0UsZ0JBQVM7QUFBakYsT0FBWjtBQUNBLFdBQUtBLE1BQUwsQ0FBWTtBQUFDLGVBQVEsUUFBVDtBQUFtQixpQkFBVSxPQUE3QjtBQUFzQyxrQkFBVyxPQUFqRDtBQUEwRCxnQkFBUyxDQUFuRTtBQUFzRSxnQkFBUztBQUEvRSxPQUFaO0FBQ0E7QUFDRDtBQUVEOzs7OztBQUdBK1IsY0FBWUosR0FBWixFQUFpQm9HLFFBQWpCLEVBQTJCQyxTQUEzQixFQUFzQ0MsT0FBdEMsRUFBK0M7QUFDOUMsU0FBS3ZGLE1BQUwsQ0FBWTtBQUNYZjtBQURXLEtBQVosRUFFRztBQUNGZ0IsWUFBTTtBQUNMZixlQUFPbUcsUUFERjtBQUVMbEcsZ0JBQVFtRyxTQUZIO0FBR0xuVSxjQUFNb1U7QUFIRDtBQURKLEtBRkg7QUFTQTtBQUVEOzs7Ozs7QUFJQUMscUJBQW1CO0FBQ2xCO0FBQ0E7QUFDQSxVQUFNQyxjQUFjbkcsT0FBT29HLEdBQVAsQ0FBV3BHLFNBQVNvRyxHQUFULEdBQWUvRixNQUFmLENBQXNCLFlBQXRCLENBQVgsRUFBZ0QsWUFBaEQsQ0FBcEIsQ0FIa0IsQ0FLbEI7O0FBQ0EsVUFBTWdHLG9CQUFvQixLQUFLNUcsT0FBTCxDQUFhO0FBQUNFLFdBQUt3RyxZQUFZOUYsTUFBWixDQUFtQixNQUFuQjtBQUFOLEtBQWIsQ0FBMUI7O0FBQ0EsUUFBSSxDQUFDZ0csaUJBQUwsRUFBd0I7QUFDdkIsYUFBTyxLQUFQO0FBQ0EsS0FUaUIsQ0FXbEI7OztBQUNBLFFBQUlBLGtCQUFrQnhVLElBQWxCLEtBQTJCLEtBQS9CLEVBQXNDO0FBQ3JDLGFBQU8sS0FBUDtBQUNBOztBQUVELFVBQU0rTixRQUFRSSxPQUFPb0csR0FBUCxDQUFZLEdBQUdDLGtCQUFrQjFHLEdBQUssSUFBSTBHLGtCQUFrQnpHLEtBQU8sRUFBbkUsRUFBc0UsWUFBdEUsQ0FBZDtBQUNBLFVBQU1DLFNBQVNHLE9BQU9vRyxHQUFQLENBQVksR0FBR0Msa0JBQWtCMUcsR0FBSyxJQUFJMEcsa0JBQWtCeEcsTUFBUSxFQUFwRSxFQUF1RSxZQUF2RSxDQUFmLENBakJrQixDQW1CbEI7O0FBQ0EsUUFBSUEsT0FBT3lHLFFBQVAsQ0FBZ0IxRyxLQUFoQixDQUFKLEVBQTRCO0FBQzNCO0FBQ0FDLGFBQU9qVSxHQUFQLENBQVcsQ0FBWCxFQUFjLE1BQWQ7QUFDQTs7QUFFRCxVQUFNZ0MsU0FBU3VZLFlBQVlJLFNBQVosQ0FBc0IzRyxLQUF0QixFQUE2QkMsTUFBN0IsQ0FBZixDQXpCa0IsQ0EyQmxCOztBQUNBLFdBQU9qUyxNQUFQO0FBQ0E7O0FBRUQ0WSxrQkFBZ0I7QUFDZjtBQUNBLFVBQU1MLGNBQWNuRyxPQUFPb0csR0FBUCxDQUFXcEcsU0FBU29HLEdBQVQsR0FBZS9GLE1BQWYsQ0FBc0IsWUFBdEIsQ0FBWCxFQUFnRCxZQUFoRCxDQUFwQixDQUZlLENBSWY7O0FBQ0EsVUFBTWdHLG9CQUFvQixLQUFLNUcsT0FBTCxDQUFhO0FBQUNFLFdBQUt3RyxZQUFZOUYsTUFBWixDQUFtQixNQUFuQjtBQUFOLEtBQWIsQ0FBMUI7O0FBQ0EsUUFBSSxDQUFDZ0csaUJBQUwsRUFBd0I7QUFDdkIsYUFBTyxLQUFQO0FBQ0EsS0FSYyxDQVVmOzs7QUFDQSxRQUFJQSxrQkFBa0J4VSxJQUFsQixLQUEyQixLQUEvQixFQUFzQztBQUNyQyxhQUFPLEtBQVA7QUFDQTs7QUFFRCxVQUFNK04sUUFBUUksT0FBT29HLEdBQVAsQ0FBWSxHQUFHQyxrQkFBa0IxRyxHQUFLLElBQUkwRyxrQkFBa0J6RyxLQUFPLEVBQW5FLEVBQXNFLFlBQXRFLENBQWQ7QUFFQSxXQUFPQSxNQUFNNkcsTUFBTixDQUFhTixXQUFiLEVBQTBCLFFBQTFCLENBQVA7QUFDQTs7QUFFRE8sa0JBQWdCO0FBQ2Y7QUFDQSxVQUFNUCxjQUFjbkcsT0FBT29HLEdBQVAsQ0FBV3BHLFNBQVNvRyxHQUFULEdBQWUvRixNQUFmLENBQXNCLFlBQXRCLENBQVgsRUFBZ0QsWUFBaEQsQ0FBcEIsQ0FGZSxDQUlmOztBQUNBLFVBQU1nRyxvQkFBb0IsS0FBSzVHLE9BQUwsQ0FBYTtBQUFDRSxXQUFLd0csWUFBWTlGLE1BQVosQ0FBbUIsTUFBbkI7QUFBTixLQUFiLENBQTFCOztBQUNBLFFBQUksQ0FBQ2dHLGlCQUFMLEVBQXdCO0FBQ3ZCLGFBQU8sS0FBUDtBQUNBOztBQUVELFVBQU14RyxTQUFTRyxPQUFPb0csR0FBUCxDQUFZLEdBQUdDLGtCQUFrQjFHLEdBQUssSUFBSTBHLGtCQUFrQnhHLE1BQVEsRUFBcEUsRUFBdUUsWUFBdkUsQ0FBZjtBQUVBLFdBQU9BLE9BQU80RyxNQUFQLENBQWNOLFdBQWQsRUFBMkIsUUFBM0IsQ0FBUDtBQUNBOztBQXhHdUQ7O0FBMkd6RGxkLFdBQVc4QixNQUFYLENBQWtCK1Usa0JBQWxCLEdBQXVDLElBQUlBLGtCQUFKLEVBQXZDLEM7Ozs7Ozs7Ozs7O0FDN0dBLElBQUlyWSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlrUyxDQUFKO0FBQU10UyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2tTLFFBQUVsUyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEOztBQUdwRSxNQUFNMEcsZ0JBQU4sU0FBK0J2RixXQUFXOEIsTUFBWCxDQUFrQndZLEtBQWpELENBQXVEO0FBQ3REQyxnQkFBYztBQUNiLFVBQU0sa0JBQU47QUFDQTtBQUVEOzs7Ozs7QUFJQXpRLG9CQUFrQnJILEtBQWxCLEVBQXlCMkUsT0FBekIsRUFBa0M7QUFDakMsVUFBTTdDLFFBQVE7QUFDYjlCO0FBRGEsS0FBZDtBQUlBLFdBQU8sS0FBSytULE9BQUwsQ0FBYWpTLEtBQWIsRUFBb0I2QyxPQUFwQixDQUFQO0FBQ0E7QUFFRDs7Ozs7O0FBSUF3VixXQUFTcmEsR0FBVCxFQUFjNkUsT0FBZCxFQUF1QjtBQUN0QixVQUFNN0MsUUFBUTtBQUNiaEM7QUFEYSxLQUFkO0FBSUEsV0FBTyxLQUFLd0ksSUFBTCxDQUFVeEcsS0FBVixFQUFpQjZDLE9BQWpCLENBQVA7QUFDQTtBQUVEOzs7Ozs7QUFJQXNXLHFCQUFtQmpiLEtBQW5CLEVBQTBCO0FBQ3pCLFVBQU04QixRQUFRO0FBQ2I5QjtBQURhLEtBQWQ7QUFJQSxXQUFPLEtBQUtzSSxJQUFMLENBQVV4RyxLQUFWLENBQVA7QUFDQTs7QUFFRGlQLDRCQUEwQi9RLEtBQTFCLEVBQWlDcUIsR0FBakMsRUFBc0NDLEtBQXRDLEVBQTZDd1AsWUFBWSxJQUF6RCxFQUErRDtBQUM5RCxVQUFNaFAsUUFBUTtBQUNiOUI7QUFEYSxLQUFkOztBQUlBLFFBQUksQ0FBQzhRLFNBQUwsRUFBZ0I7QUFDZixZQUFNblIsT0FBTyxLQUFLb1UsT0FBTCxDQUFhalMsS0FBYixFQUFvQjtBQUFFOEgsZ0JBQVE7QUFBRW5GLHdCQUFjO0FBQWhCO0FBQVYsT0FBcEIsQ0FBYjs7QUFDQSxVQUFJOUUsS0FBSzhFLFlBQUwsSUFBcUIsT0FBTzlFLEtBQUs4RSxZQUFMLENBQWtCcEQsR0FBbEIsQ0FBUCxLQUFrQyxXQUEzRCxFQUF3RTtBQUN2RSxlQUFPLElBQVA7QUFDQTtBQUNEOztBQUVELFVBQU0yVCxTQUFTO0FBQ2RDLFlBQU07QUFDTCxTQUFFLGdCQUFnQjVULEdBQUssRUFBdkIsR0FBMkJDO0FBRHRCO0FBRFEsS0FBZjtBQU1BLFdBQU8sS0FBSzBULE1BQUwsQ0FBWWxULEtBQVosRUFBbUJrVCxNQUFuQixDQUFQO0FBQ0E7QUFFRDs7Ozs7O0FBSUFrRyx3QkFBc0JsVyxLQUF0QixFQUE2QjtBQUM1QixVQUFNbEQsUUFBUTtBQUNiLDJCQUFxQmtEO0FBRFIsS0FBZDtBQUlBLFdBQU8sS0FBSytPLE9BQUwsQ0FBYWpTLEtBQWIsQ0FBUDtBQUNBO0FBRUQ7Ozs7OztBQUlBcVosMkJBQXlCO0FBQ3hCLFVBQU12RSxjQUFjclosV0FBVzhCLE1BQVgsQ0FBa0J3WCxRQUFsQixDQUEyQmpCLEtBQTNCLENBQWlDQyxhQUFqQyxFQUFwQjtBQUNBLFVBQU1DLGdCQUFnQmpaLE9BQU9xVCxTQUFQLENBQWlCMEcsWUFBWWQsYUFBN0IsRUFBNENjLFdBQTVDLENBQXRCO0FBRUEsVUFBTTlVLFFBQVE7QUFDYmhDLFdBQUs7QUFEUSxLQUFkO0FBSUEsVUFBTWtWLFNBQVM7QUFDZGdCLFlBQU07QUFDTDFVLGVBQU87QUFERjtBQURRLEtBQWY7QUFNQSxVQUFNeVUsZ0JBQWdCRCxjQUFjaFUsS0FBZCxFQUFxQixJQUFyQixFQUEyQmtULE1BQTNCLENBQXRCO0FBRUEsV0FBUSxTQUFTZSxjQUFjelUsS0FBZCxDQUFvQkEsS0FBcEIsR0FBNEIsQ0FBRyxFQUFoRDtBQUNBOztBQUVEMEcsYUFBV2xJLEdBQVgsRUFBZ0JrVixNQUFoQixFQUF3QjtBQUN2QixXQUFPLEtBQUtBLE1BQUwsQ0FBWTtBQUFFbFY7QUFBRixLQUFaLEVBQXFCa1YsTUFBckIsQ0FBUDtBQUNBOztBQUVEb0csZ0JBQWN0YixHQUFkLEVBQW1CK0IsSUFBbkIsRUFBeUI7QUFDeEIsVUFBTXdaLFVBQVUsRUFBaEI7QUFDQSxVQUFNQyxZQUFZLEVBQWxCOztBQUVBLFFBQUl6WixLQUFLc0MsSUFBVCxFQUFlO0FBQ2QsVUFBSSxDQUFDcEksRUFBRTZCLE9BQUYsQ0FBVTBRLEVBQUV6USxJQUFGLENBQU9nRSxLQUFLc0MsSUFBWixDQUFWLENBQUwsRUFBbUM7QUFDbENrWCxnQkFBUWxYLElBQVIsR0FBZW1LLEVBQUV6USxJQUFGLENBQU9nRSxLQUFLc0MsSUFBWixDQUFmO0FBQ0EsT0FGRCxNQUVPO0FBQ05tWCxrQkFBVW5YLElBQVYsR0FBaUIsQ0FBakI7QUFDQTtBQUNEOztBQUVELFFBQUl0QyxLQUFLdUMsS0FBVCxFQUFnQjtBQUNmLFVBQUksQ0FBQ3JJLEVBQUU2QixPQUFGLENBQVUwUSxFQUFFelEsSUFBRixDQUFPZ0UsS0FBS3VDLEtBQVosQ0FBVixDQUFMLEVBQW9DO0FBQ25DaVgsZ0JBQVF0UixhQUFSLEdBQXdCLENBQ3ZCO0FBQUV3UixtQkFBU2pOLEVBQUV6USxJQUFGLENBQU9nRSxLQUFLdUMsS0FBWjtBQUFYLFNBRHVCLENBQXhCO0FBR0EsT0FKRCxNQUlPO0FBQ05rWCxrQkFBVXZSLGFBQVYsR0FBMEIsQ0FBMUI7QUFDQTtBQUNEOztBQUVELFFBQUlsSSxLQUFLbUQsS0FBVCxFQUFnQjtBQUNmLFVBQUksQ0FBQ2pKLEVBQUU2QixPQUFGLENBQVUwUSxFQUFFelEsSUFBRixDQUFPZ0UsS0FBS21ELEtBQVosQ0FBVixDQUFMLEVBQW9DO0FBQ25DcVcsZ0JBQVFyVyxLQUFSLEdBQWdCLENBQ2Y7QUFBRXdXLHVCQUFhbE4sRUFBRXpRLElBQUYsQ0FBT2dFLEtBQUttRCxLQUFaO0FBQWYsU0FEZSxDQUFoQjtBQUdBLE9BSkQsTUFJTztBQUNOc1csa0JBQVV0VyxLQUFWLEdBQWtCLENBQWxCO0FBQ0E7QUFDRDs7QUFFRCxVQUFNZ1EsU0FBUyxFQUFmOztBQUVBLFFBQUksQ0FBQ2paLEVBQUU2QixPQUFGLENBQVV5ZCxPQUFWLENBQUwsRUFBeUI7QUFDeEJyRyxhQUFPQyxJQUFQLEdBQWNvRyxPQUFkO0FBQ0E7O0FBRUQsUUFBSSxDQUFDdGYsRUFBRTZCLE9BQUYsQ0FBVTBkLFNBQVYsQ0FBTCxFQUEyQjtBQUMxQnRHLGFBQU9rQyxNQUFQLEdBQWdCb0UsU0FBaEI7QUFDQTs7QUFFRCxRQUFJdmYsRUFBRTZCLE9BQUYsQ0FBVW9YLE1BQVYsQ0FBSixFQUF1QjtBQUN0QixhQUFPLElBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQUtBLE1BQUwsQ0FBWTtBQUFFbFY7QUFBRixLQUFaLEVBQXFCa1YsTUFBckIsQ0FBUDtBQUNBOztBQUVEeUcsNkJBQTJCQyxZQUEzQixFQUF5QztBQUN4QyxVQUFNNVosUUFBUTtBQUNiLCtCQUF5QixJQUFJbUIsTUFBSixDQUFZLElBQUlxTCxFQUFFcU4sWUFBRixDQUFlRCxZQUFmLENBQThCLEdBQTlDLEVBQWtELEdBQWxEO0FBRFosS0FBZDtBQUlBLFdBQU8sS0FBSzNILE9BQUwsQ0FBYWpTLEtBQWIsQ0FBUDtBQUNBOztBQUVEd0IsMEJBQXdCeEQsR0FBeEIsRUFBNkJzVyxNQUE3QixFQUFxQ3dGLE1BQXJDLEVBQTZDO0FBQzVDLFVBQU01RyxTQUFTO0FBQ2Q2RyxpQkFBVztBQURHLEtBQWY7QUFJQSxVQUFNQyxZQUFZLEdBQUdwRyxNQUFILENBQVVVLE1BQVYsRUFDaEJHLE1BRGdCLENBQ1RuUyxTQUFTQSxTQUFTQSxNQUFNdkcsSUFBTixFQURULEVBRWhCQyxHQUZnQixDQUVac0csU0FBUztBQUNiLGFBQU87QUFBRW1YLGlCQUFTblg7QUFBWCxPQUFQO0FBQ0EsS0FKZ0IsQ0FBbEI7O0FBTUEsUUFBSTBYLFVBQVVoUyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3pCa0wsYUFBTzZHLFNBQVAsQ0FBaUI5UixhQUFqQixHQUFpQztBQUFFZ1MsZUFBT0Q7QUFBVCxPQUFqQztBQUNBOztBQUVELFVBQU1FLFlBQVksR0FBR3RHLE1BQUgsQ0FBVWtHLE1BQVYsRUFDaEJyRixNQURnQixDQUNUdlIsU0FBU0EsU0FBU0EsTUFBTW5ILElBQU4sR0FBYStSLE9BQWIsQ0FBcUIsUUFBckIsRUFBK0IsRUFBL0IsQ0FEVCxFQUVoQjlSLEdBRmdCLENBRVprSCxTQUFTO0FBQ2IsYUFBTztBQUFFd1cscUJBQWF4VztBQUFmLE9BQVA7QUFDQSxLQUpnQixDQUFsQjs7QUFNQSxRQUFJZ1gsVUFBVWxTLE1BQVYsR0FBbUIsQ0FBdkIsRUFBMEI7QUFDekJrTCxhQUFPNkcsU0FBUCxDQUFpQjdXLEtBQWpCLEdBQXlCO0FBQUUrVyxlQUFPQztBQUFULE9BQXpCO0FBQ0E7O0FBRUQsUUFBSSxDQUFDaEgsT0FBTzZHLFNBQVAsQ0FBaUI5UixhQUFsQixJQUFtQyxDQUFDaUwsT0FBTzZHLFNBQVAsQ0FBaUI3VyxLQUF6RCxFQUFnRTtBQUMvRDtBQUNBOztBQUVELFdBQU8sS0FBS2dRLE1BQUwsQ0FBWTtBQUFFbFY7QUFBRixLQUFaLEVBQXFCa1YsTUFBckIsQ0FBUDtBQUNBOztBQTVMcUQ7O0FBSHZEaFosT0FBT2lnQixhQUFQLENBa01lLElBQUluWixnQkFBSixFQWxNZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUkvRyxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBQXdELElBQUlrUyxDQUFKO0FBQU10UyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2tTLFFBQUVsUyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEO0FBQStELElBQUk4ZixRQUFKO0FBQWFsZ0IsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGNBQVIsQ0FBYixFQUFxQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzhmLGVBQVM5ZixDQUFUO0FBQVc7O0FBQXZCLENBQXJDLEVBQThELENBQTlEO0FBQWlFLElBQUkwRyxnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSw0QkFBUixDQUFiLEVBQW1EO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQW5ELEVBQW9GLENBQXBGO0FBTXRPbUIsV0FBVzhHLFFBQVgsR0FBc0I7QUFDckI4WCxzQkFBb0IsS0FEQztBQUdyQkMsVUFBUSxJQUFJQyxNQUFKLENBQVcsVUFBWCxFQUF1QjtBQUM5QkMsY0FBVTtBQUNUQyxlQUFTO0FBREE7QUFEb0IsR0FBdkIsQ0FIYTs7QUFTckJyUSxlQUFhUCxVQUFiLEVBQXlCO0FBQ3hCLFFBQUlwTyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix5QkFBeEIsTUFBdUQsVUFBM0QsRUFBdUU7QUFDdEUsV0FBSyxJQUFJK2UsSUFBSSxDQUFiLEVBQWdCQSxJQUFJLEVBQXBCLEVBQXdCQSxHQUF4QixFQUE2QjtBQUM1QixZQUFJO0FBQ0gsZ0JBQU1DLGNBQWM5USxhQUFjLGlCQUFpQkEsVUFBWSxFQUEzQyxHQUErQyxFQUFuRTtBQUNBLGdCQUFNekosU0FBU1AsS0FBSzZELElBQUwsQ0FBVSxLQUFWLEVBQWtCLEdBQUdqSSxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qiw2QkFBeEIsQ0FBd0QsR0FBR2dmLFdBQWEsRUFBN0YsRUFBZ0c7QUFDOUcvZSxxQkFBUztBQUNSLDRCQUFjLG1CQUROO0FBRVIsd0JBQVUsa0JBRkY7QUFHUiwyQ0FBNkJILFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLCtCQUF4QjtBQUhyQjtBQURxRyxXQUFoRyxDQUFmOztBQVFBLGNBQUl5RSxVQUFVQSxPQUFPTCxJQUFqQixJQUF5QkssT0FBT0wsSUFBUCxDQUFZK0IsUUFBekMsRUFBbUQ7QUFDbEQsa0JBQU1xSSxRQUFRMU8sV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3Qm9PLDRCQUF4QixDQUFxRG5ULE9BQU9MLElBQVAsQ0FBWStCLFFBQWpFLENBQWQ7O0FBRUEsZ0JBQUlxSSxLQUFKLEVBQVc7QUFDVixxQkFBTztBQUNOakcseUJBQVNpRyxNQUFNbk0sR0FEVDtBQUVOOEQsMEJBQVVxSSxNQUFNckk7QUFGVixlQUFQO0FBSUE7QUFDRDtBQUNELFNBcEJELENBb0JFLE9BQU9qQixDQUFQLEVBQVU7QUFDWDhDLGtCQUFRNUMsS0FBUixDQUFjLDZDQUFkLEVBQTZERixDQUE3RDtBQUNBO0FBQ0E7QUFDRDs7QUFDRCxZQUFNLElBQUk5RixPQUFPc0QsS0FBWCxDQUFpQixpQkFBakIsRUFBb0MseUJBQXBDLENBQU47QUFDQSxLQTVCRCxNQTRCTyxJQUFJd0wsVUFBSixFQUFnQjtBQUN0QixhQUFPcE8sV0FBVzhCLE1BQVgsQ0FBa0J1Wix3QkFBbEIsQ0FBMkNRLHlCQUEzQyxDQUFxRXpOLFVBQXJFLENBQVA7QUFDQTs7QUFDRCxXQUFPcE8sV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QmlGLFlBQXhCLEVBQVA7QUFDQSxHQTFDb0I7O0FBMkNyQndRLFlBQVUvUSxVQUFWLEVBQXNCO0FBQ3JCLFFBQUlBLFVBQUosRUFBZ0I7QUFDZixhQUFPcE8sV0FBVzhCLE1BQVgsQ0FBa0J1Wix3QkFBbEIsQ0FBMkNOLGtCQUEzQyxDQUE4RDNNLFVBQTlELENBQVA7QUFDQSxLQUZELE1BRU87QUFDTixhQUFPcE8sV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QnFPLFVBQXhCLEVBQVA7QUFDQTtBQUNELEdBakRvQjs7QUFrRHJCcUgsa0JBQWdCaFIsVUFBaEIsRUFBNEI7QUFDM0IsUUFBSUEsVUFBSixFQUFnQjtBQUNmLGFBQU9wTyxXQUFXOEIsTUFBWCxDQUFrQnVaLHdCQUFsQixDQUEyQ1csc0JBQTNDLENBQWtFNU4sVUFBbEUsQ0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLGFBQU9wTyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCNEUsZ0JBQXhCLEVBQVA7QUFDQTtBQUNELEdBeERvQjs7QUF5RHJCRyx3QkFBc0I0USxpQkFBaUIsSUFBdkMsRUFBNkM7QUFDNUMsVUFBTTFULGNBQWMzTCxXQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ0MscUJBQXJDLEVBQXBCO0FBRUEsV0FBT3hDLFlBQVlYLEtBQVosR0FBb0JELElBQXBCLENBQTBCdVUsSUFBRCxJQUFVO0FBQ3pDLFVBQUksQ0FBQ0EsS0FBS3JFLGtCQUFWLEVBQThCO0FBQzdCLGVBQU8sS0FBUDtBQUNBOztBQUNELFVBQUksQ0FBQ29FLGNBQUwsRUFBcUI7QUFDcEIsZUFBTyxJQUFQO0FBQ0E7O0FBQ0QsWUFBTUUsZUFBZXZmLFdBQVc4QixNQUFYLENBQWtCdVosd0JBQWxCLENBQTJDVyxzQkFBM0MsQ0FBa0VzRCxLQUFLL2MsR0FBdkUsQ0FBckI7QUFDQSxhQUFPZ2QsYUFBYWhSLEtBQWIsS0FBdUIsQ0FBOUI7QUFDQSxLQVRNLENBQVA7QUFVQSxHQXRFb0I7O0FBdUVyQm9GLFVBQVEzQixLQUFSLEVBQWVoTyxPQUFmLEVBQXdCd2IsUUFBeEIsRUFBa0M5USxLQUFsQyxFQUF5QztBQUN4QyxRQUFJdk0sT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DakcsUUFBUWdCLEdBQTVDLENBQVg7QUFDQSxRQUFJeWEsVUFBVSxLQUFkOztBQUVBLFFBQUl0ZCxRQUFRLENBQUNBLEtBQUt5RyxJQUFsQixFQUF3QjtBQUN2QjVFLGNBQVFnQixHQUFSLEdBQWMwTyxPQUFPekssRUFBUCxFQUFkO0FBQ0E5RyxhQUFPLElBQVA7QUFDQTs7QUFFRCxRQUFJQSxRQUFRLElBQVosRUFBa0I7QUFDakI7QUFDQSxVQUFJLENBQUN1TSxLQUFELElBQVUsQ0FBQ3NELE1BQU01RCxVQUFyQixFQUFpQztBQUNoQyxjQUFNQSxhQUFhLEtBQUtLLHFCQUFMLEVBQW5COztBQUVBLFlBQUlMLFVBQUosRUFBZ0I7QUFDZjRELGdCQUFNNUQsVUFBTixHQUFtQkEsV0FBVzdMLEdBQTlCO0FBQ0E7QUFDRCxPQVJnQixDQVVqQjs7O0FBQ0EsWUFBTW1kLGdCQUFnQjFmLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHlCQUF4QixDQUF0QjtBQUNBaUMsYUFBT25DLFdBQVcyZixZQUFYLENBQXdCRCxhQUF4QixFQUF1QzFOLEtBQXZDLEVBQThDaE8sT0FBOUMsRUFBdUR3YixRQUF2RCxFQUFpRTlRLEtBQWpFLENBQVA7QUFFQStRLGdCQUFVLElBQVY7QUFDQTs7QUFFRCxRQUFJLENBQUN0ZCxJQUFELElBQVNBLEtBQUt0RCxDQUFMLENBQU80RCxLQUFQLEtBQWlCdVAsTUFBTXZQLEtBQXBDLEVBQTJDO0FBQzFDLFlBQU0sSUFBSW5ELE9BQU9zRCxLQUFYLENBQWlCLG9CQUFqQixDQUFOO0FBQ0E7O0FBRUQsV0FBTztBQUFFVCxVQUFGO0FBQVFzZDtBQUFSLEtBQVA7QUFDQSxHQXRHb0I7O0FBdUdyQnhOLGNBQVk7QUFBRUQsU0FBRjtBQUFTaE8sV0FBVDtBQUFrQndiLFlBQWxCO0FBQTRCOVE7QUFBNUIsR0FBWixFQUFpRDtBQUNoRCxVQUFNO0FBQUV2TSxVQUFGO0FBQVFzZDtBQUFSLFFBQW9CLEtBQUs5TCxPQUFMLENBQWEzQixLQUFiLEVBQW9CaE8sT0FBcEIsRUFBNkJ3YixRQUE3QixFQUF1QzlRLEtBQXZDLENBQTFCOztBQUNBLFFBQUlzRCxNQUFNcEwsSUFBVixFQUFnQjtBQUNmNUMsY0FBUTRiLEtBQVIsR0FBZ0I1TixNQUFNcEwsSUFBdEI7QUFDQSxLQUorQyxDQU1oRDs7O0FBQ0EsV0FBT3BJLEVBQUUwYSxNQUFGLENBQVNsWixXQUFXaVMsV0FBWCxDQUF1QkQsS0FBdkIsRUFBOEJoTyxPQUE5QixFQUF1QzdCLElBQXZDLENBQVQsRUFBdUQ7QUFBRXNkLGFBQUY7QUFBV0ksc0JBQWdCLEtBQUtBLGNBQUw7QUFBM0IsS0FBdkQsQ0FBUDtBQUNBLEdBL0dvQjs7QUFnSHJCNVEsZ0JBQWM7QUFBRXhNLFNBQUY7QUFBU21FLFFBQVQ7QUFBZUMsU0FBZjtBQUFzQnVILGNBQXRCO0FBQWtDM0csU0FBbEM7QUFBeUNwQjtBQUF6QyxNQUFzRCxFQUFwRSxFQUF3RTtBQUN2RTRFLFVBQU14SSxLQUFOLEVBQWF5SSxNQUFiO0FBRUEsUUFBSTlCLE1BQUo7QUFDQSxVQUFNMFcsYUFBYTtBQUNsQnBJLFlBQU07QUFDTGpWO0FBREs7QUFEWSxLQUFuQjtBQU1BLFVBQU1MLE9BQU9tRCxpQkFBaUJ1RSxpQkFBakIsQ0FBbUNySCxLQUFuQyxFQUEwQztBQUFFNEosY0FBUTtBQUFFOUosYUFBSztBQUFQO0FBQVYsS0FBMUMsQ0FBYjs7QUFFQSxRQUFJSCxJQUFKLEVBQVU7QUFDVGdILGVBQVNoSCxLQUFLRyxHQUFkO0FBQ0EsS0FGRCxNQUVPO0FBQ04sVUFBSSxDQUFDOEQsUUFBTCxFQUFlO0FBQ2RBLG1CQUFXZCxpQkFBaUJxWSxzQkFBakIsRUFBWDtBQUNBOztBQUVELFVBQUltQyxlQUFlLElBQW5COztBQUVBLFVBQUloUCxFQUFFelEsSUFBRixDQUFPdUcsS0FBUCxNQUFrQixFQUFsQixLQUF5QmtaLGVBQWV4YSxpQkFBaUIyWSwwQkFBakIsQ0FBNENyWCxLQUE1QyxDQUF4QyxDQUFKLEVBQWlHO0FBQ2hHdUMsaUJBQVMyVyxhQUFheGQsR0FBdEI7QUFDQSxPQUZELE1BRU87QUFDTixjQUFNeWQsV0FBVztBQUNoQjNaLGtCQURnQjtBQUVoQitIO0FBRmdCLFNBQWpCOztBQUtBLFlBQUksS0FBSzZSLFVBQVQsRUFBcUI7QUFDcEJELG1CQUFTRSxTQUFULEdBQXFCLEtBQUtELFVBQUwsQ0FBZ0JFLFdBQWhCLENBQTRCLFlBQTVCLENBQXJCO0FBQ0FILG1CQUFTaEwsRUFBVCxHQUFjLEtBQUtpTCxVQUFMLENBQWdCRSxXQUFoQixDQUE0QixXQUE1QixLQUE0QyxLQUFLRixVQUFMLENBQWdCRSxXQUFoQixDQUE0QixpQkFBNUIsQ0FBNUMsSUFBOEYsS0FBS0YsVUFBTCxDQUFnQkcsYUFBNUg7QUFDQUosbUJBQVNyZixJQUFULEdBQWdCLEtBQUtzZixVQUFMLENBQWdCRSxXQUFoQixDQUE0QnhmLElBQTVDO0FBQ0E7O0FBRUR5SSxpQkFBUzdELGlCQUFpQlIsTUFBakIsQ0FBd0JpYixRQUF4QixDQUFUO0FBQ0E7QUFDRDs7QUFFRCxRQUFJdlksS0FBSixFQUFXO0FBQ1ZxWSxpQkFBV3BJLElBQVgsQ0FBZ0JqUSxLQUFoQixHQUF3QixDQUN2QjtBQUFFd1cscUJBQWF4VyxNQUFNNFk7QUFBckIsT0FEdUIsQ0FBeEI7QUFHQTs7QUFFRCxRQUFJeFosU0FBU0EsTUFBTXZHLElBQU4sT0FBaUIsRUFBOUIsRUFBa0M7QUFDakN3ZixpQkFBV3BJLElBQVgsQ0FBZ0JsTCxhQUFoQixHQUFnQyxDQUMvQjtBQUFFd1IsaUJBQVNuWDtBQUFYLE9BRCtCLENBQWhDO0FBR0E7O0FBRUQsUUFBSUQsSUFBSixFQUFVO0FBQ1RrWixpQkFBV3BJLElBQVgsQ0FBZ0I5USxJQUFoQixHQUF1QkEsSUFBdkI7QUFDQTs7QUFFRHJCLHFCQUFpQmtGLFVBQWpCLENBQTRCckIsTUFBNUIsRUFBb0MwVyxVQUFwQztBQUVBLFdBQU8xVyxNQUFQO0FBQ0EsR0ExS29COztBQTJLckJxSyx3QkFBc0I7QUFBRWhSLFNBQUY7QUFBUzJMO0FBQVQsTUFBd0IsRUFBOUMsRUFBa0Q7QUFDakRuRCxVQUFNeEksS0FBTixFQUFheUksTUFBYjtBQUVBLFVBQU00VSxhQUFhO0FBQ2xCcEksWUFBTTtBQUNMdEo7QUFESztBQURZLEtBQW5CO0FBTUEsVUFBTWhNLE9BQU9tRCxpQkFBaUJ1RSxpQkFBakIsQ0FBbUNySCxLQUFuQyxFQUEwQztBQUFFNEosY0FBUTtBQUFFOUosYUFBSztBQUFQO0FBQVYsS0FBMUMsQ0FBYjs7QUFDQSxRQUFJSCxJQUFKLEVBQVU7QUFDVCxhQUFPOUMsT0FBT2doQixLQUFQLENBQWE3SSxNQUFiLENBQW9CclYsS0FBS0csR0FBekIsRUFBOEJ1ZCxVQUE5QixDQUFQO0FBQ0E7O0FBQ0QsV0FBTyxLQUFQO0FBQ0EsR0F6TG9COztBQTBMckJqUCxZQUFVO0FBQUV0TyxPQUFGO0FBQU9xRSxRQUFQO0FBQWFDLFNBQWI7QUFBb0JZO0FBQXBCLEdBQVYsRUFBdUM7QUFDdEMsVUFBTTJKLGFBQWEsRUFBbkI7O0FBRUEsUUFBSXhLLElBQUosRUFBVTtBQUNUd0ssaUJBQVd4SyxJQUFYLEdBQWtCQSxJQUFsQjtBQUNBOztBQUNELFFBQUlDLEtBQUosRUFBVztBQUNWdUssaUJBQVd2SyxLQUFYLEdBQW1CQSxLQUFuQjtBQUNBOztBQUNELFFBQUlZLEtBQUosRUFBVztBQUNWMkosaUJBQVczSixLQUFYLEdBQW1CQSxLQUFuQjtBQUNBOztBQUNELFVBQU1tSixNQUFNckwsaUJBQWlCc1ksYUFBakIsQ0FBK0J0YixHQUEvQixFQUFvQzZPLFVBQXBDLENBQVo7QUFFQTlSLFdBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQmxFLGlCQUFXMEMsU0FBWCxDQUFxQnNELEdBQXJCLENBQXlCLG9CQUF6QixFQUErQ29MLFVBQS9DO0FBQ0EsS0FGRDtBQUlBLFdBQU9SLEdBQVA7QUFDQSxHQTdNb0I7O0FBK01yQjdHLFlBQVU7QUFBRTNILFFBQUY7QUFBUW9CLFdBQVI7QUFBaUJyQixRQUFqQjtBQUF1QjZIO0FBQXZCLEdBQVYsRUFBNEM7QUFDM0MsVUFBTTlELE1BQU0sSUFBSWYsSUFBSixFQUFaO0FBRUEsVUFBTW9iLFlBQVk7QUFDakJ2RyxnQkFBVTlULEdBRE87QUFFakIrVCxvQkFBYyxDQUFDL1QsSUFBSU0sT0FBSixLQUFnQnJFLEtBQUsrQyxFQUF0QixJQUE0QjtBQUZ6QixLQUFsQjs7QUFLQSxRQUFJOUMsSUFBSixFQUFVO0FBQ1RtZSxnQkFBVXpHLE1BQVYsR0FBbUIsTUFBbkI7QUFDQXlHLGdCQUFVeEcsUUFBVixHQUFxQjtBQUNwQnhYLGFBQUtILEtBQUtHLEdBRFU7QUFFcEI4RCxrQkFBVWpFLEtBQUtpRTtBQUZLLE9BQXJCO0FBSUEsS0FORCxNQU1PLElBQUk3QyxPQUFKLEVBQWE7QUFDbkIrYyxnQkFBVXpHLE1BQVYsR0FBbUIsU0FBbkI7QUFDQXlHLGdCQUFVeEcsUUFBVixHQUFxQjtBQUNwQnhYLGFBQUtpQixRQUFRakIsR0FETztBQUVwQjhELGtCQUFVN0MsUUFBUTZDO0FBRkUsT0FBckI7QUFJQTs7QUFFRHJHLGVBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QjZYLGFBQXhCLENBQXNDelgsS0FBS0ksR0FBM0MsRUFBZ0RnZSxTQUFoRDtBQUNBdmdCLGVBQVc4QixNQUFYLENBQWtCMkIsZUFBbEIsQ0FBa0NtVyxhQUFsQyxDQUFnRHpYLEtBQUtJLEdBQXJELEVBQTBEZ2UsU0FBMUQ7QUFFQSxVQUFNdmMsVUFBVTtBQUNmM0IsU0FBRyxnQkFEWTtBQUVmbUMsV0FBS3dGLE9BRlU7QUFHZndXLGlCQUFXO0FBSEksS0FBaEI7QUFNQXhnQixlQUFXaVMsV0FBWCxDQUF1QjdQLElBQXZCLEVBQTZCNEIsT0FBN0IsRUFBc0M3QixJQUF0Qzs7QUFFQSxRQUFJQSxLQUFLZ0osUUFBVCxFQUFtQjtBQUNsQm5MLGlCQUFXOEIsTUFBWCxDQUFrQmtVLGFBQWxCLENBQWdDeUsscUJBQWhDLENBQXNEdGUsS0FBS0ksR0FBM0QsRUFBZ0VKLEtBQUtnSixRQUFMLENBQWM1SSxHQUE5RTtBQUNBOztBQUNEdkMsZUFBVzhCLE1BQVgsQ0FBa0J3RyxRQUFsQixDQUEyQjZOLDhCQUEzQixDQUEwRCxrQkFBMUQsRUFBOEVoVSxLQUFLSSxHQUFuRixFQUF3RmdlLFVBQVV4RyxRQUFsRztBQUVBemEsV0FBTzRFLEtBQVAsQ0FBYSxNQUFNO0FBQ2xCbEUsaUJBQVcwQyxTQUFYLENBQXFCc0QsR0FBckIsQ0FBeUIsb0JBQXpCLEVBQStDN0QsSUFBL0M7QUFDQSxLQUZEO0FBSUEsV0FBTyxJQUFQO0FBQ0EsR0ExUG9COztBQTRQckJ1SyxvQkFBa0I7QUFDakIsVUFBTXpNLFdBQVcsRUFBakI7QUFFQUQsZUFBVzhCLE1BQVgsQ0FBa0J3WCxRQUFsQixDQUEyQm9ILG1CQUEzQixDQUErQyxDQUM5QyxnQkFEOEMsRUFFOUMsc0JBRjhDLEVBRzlDLGtCQUg4QyxFQUk5Qyw0QkFKOEMsRUFLOUMsc0NBTDhDLEVBTTlDLHdCQU44QyxFQU85Qyw4QkFQOEMsRUFROUMsMEJBUjhDLEVBUzlDLGtDQVQ4QyxFQVU5QyxtQ0FWOEMsRUFXOUMsK0JBWDhDLEVBWTlDLDRCQVo4QyxFQWE5QyxlQWI4QyxFQWM5QyxVQWQ4QyxFQWU5Qyw0QkFmOEMsRUFnQjlDLDZCQWhCOEMsQ0FBL0MsRUFpQkczWSxPQWpCSCxDQWlCWThILE9BQUQsSUFBYTtBQUN2QjVQLGVBQVM0UCxRQUFRdE4sR0FBakIsSUFBd0JzTixRQUFROUwsS0FBaEM7QUFDQSxLQW5CRDtBQXFCQSxXQUFPOUQsUUFBUDtBQUNBLEdBclJvQjs7QUF1UnJCNlEsZUFBYUwsUUFBYixFQUF1QkQsU0FBdkIsRUFBa0M7QUFDakMsUUFBSSxDQUFDQyxTQUFTRSxLQUFULElBQWtCLElBQWxCLElBQTBCRixTQUFTOUksSUFBVCxJQUFpQixJQUE1QyxLQUFxRCxDQUFDM0gsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCNGUsbUJBQXhCLENBQTRDbFEsU0FBU2xPLEdBQXJELEVBQTBEa08sU0FBU0UsS0FBbkUsRUFBMEVGLFNBQVM5SSxJQUFuRixDQUExRCxFQUFvSjtBQUNuSixhQUFPLEtBQVA7QUFDQTs7QUFFRHJJLFdBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQmxFLGlCQUFXMEMsU0FBWCxDQUFxQnNELEdBQXJCLENBQXlCLG1CQUF6QixFQUE4Q3lLLFFBQTlDO0FBQ0EsS0FGRDs7QUFJQSxRQUFJLENBQUNqUyxFQUFFNkIsT0FBRixDQUFVbVEsVUFBVTVKLElBQXBCLENBQUwsRUFBZ0M7QUFDL0IsYUFBTzVHLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3Qm1ZLGdCQUF4QixDQUF5Q3pKLFNBQVNsTyxHQUFsRCxFQUF1RGlPLFVBQVU1SixJQUFqRSxLQUEwRTVHLFdBQVc4QixNQUFYLENBQWtCa1UsYUFBbEIsQ0FBZ0M0SyxrQkFBaEMsQ0FBbURuUSxTQUFTbE8sR0FBNUQsRUFBaUVpTyxVQUFVNUosSUFBM0UsQ0FBakY7QUFDQTtBQUNELEdBblNvQjs7QUFxU3JCaWEsaUJBQWV6WCxNQUFmLEVBQXVCWSxPQUF2QixFQUFnQztBQUMvQixVQUFNNUgsT0FBT3BDLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JPLFdBQXhCLENBQW9DYixNQUFwQyxDQUFiO0FBQ0FwSixlQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JvWSxlQUF4QixDQUF3Qy9RLE1BQXhDLEVBQWdEckIsT0FBaEQsQ0FBeUQ1RixJQUFELElBQVU7QUFDakUsV0FBSzRILFNBQUwsQ0FBZTtBQUFFM0gsWUFBRjtBQUFRRCxZQUFSO0FBQWM2SDtBQUFkLE9BQWY7QUFDQSxLQUZEO0FBR0EsR0ExU29COztBQTRTckI4VyxtQkFBaUIxWCxNQUFqQixFQUF5QjtBQUN4QnBKLGVBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3Qm9ZLGVBQXhCLENBQXdDL1EsTUFBeEMsRUFBZ0RyQixPQUFoRCxDQUF5RDVGLElBQUQsSUFBVTtBQUNqRSxZQUFNNlAsUUFBUWhTLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JPLFdBQXhCLENBQW9DOUgsS0FBS3RELENBQUwsQ0FBTzBELEdBQTNDLENBQWQ7QUFDQSxXQUFLZ1MsUUFBTCxDQUFjcFMsSUFBZCxFQUFvQjZQLEtBQXBCLEVBQTJCO0FBQUVxQyxzQkFBY3JDLE1BQU01RDtBQUF0QixPQUEzQjtBQUNBLEtBSEQ7QUFJQSxHQWpUb0I7O0FBbVRyQlksa0JBQWdCdk0sS0FBaEIsRUFBdUJzTSxRQUF2QixFQUFpQztBQUNoQyxRQUFJQSxTQUFTZ1MsTUFBVCxLQUFvQi9nQixXQUFXOEcsUUFBWCxDQUFvQjhYLGtCQUE1QyxFQUFnRTtBQUMvRCxhQUFPNWUsV0FBVzhCLE1BQVgsQ0FBa0JvTixtQkFBbEIsQ0FBc0NvTixXQUF0QyxDQUFrRDdaLEtBQWxELEVBQXlEc00sUUFBekQsQ0FBUDtBQUNBOztBQUVEO0FBQ0EsR0F6VG9COztBQTJUckJ3RixXQUFTcFMsSUFBVCxFQUFlNlAsS0FBZixFQUFzQm9DLFlBQXRCLEVBQW9DO0FBQ25DLFFBQUkxRixLQUFKOztBQUVBLFFBQUkwRixhQUFhaEwsTUFBakIsRUFBeUI7QUFDeEIsWUFBTWhILE9BQU9wQyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCTyxXQUF4QixDQUFvQ21LLGFBQWFoTCxNQUFqRCxDQUFiO0FBQ0FzRixjQUFRO0FBQ1BqRyxpQkFBU3JHLEtBQUtHLEdBRFA7QUFFUDhELGtCQUFVakUsS0FBS2lFO0FBRlIsT0FBUjtBQUlBLEtBTkQsTUFNTztBQUNOcUksY0FBUTFPLFdBQVc4RyxRQUFYLENBQW9CNkgsWUFBcEIsQ0FBaUN5RixhQUFhQyxZQUE5QyxDQUFSO0FBQ0E7O0FBRUQsVUFBTWxKLFdBQVdoSixLQUFLZ0osUUFBdEI7O0FBRUEsUUFBSXVELFNBQVNBLE1BQU1qRyxPQUFOLEtBQWtCMEMsU0FBUzVJLEdBQXhDLEVBQTZDO0FBQzVDSixXQUFLK0gsU0FBTCxHQUFpQjFMLEVBQUV3aUIsT0FBRixDQUFVN2UsS0FBSytILFNBQWYsRUFBMEJpQixTQUFTOUUsUUFBbkMsRUFBNkM4UixNQUE3QyxDQUFvRHpKLE1BQU1ySSxRQUExRCxDQUFqQjtBQUVBckcsaUJBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtVLG1CQUF4QixDQUE0QzlULEtBQUtJLEdBQWpELEVBQXNEbU0sS0FBdEQ7QUFFQSxZQUFNOEcsbUJBQW1CO0FBQ3hCeFEsYUFBSzdDLEtBQUtJLEdBRGM7QUFFeEJxRSxjQUFNb0wsTUFBTXBMLElBQU4sSUFBY29MLE1BQU0zTCxRQUZGO0FBR3hCb1AsZUFBTyxJQUhpQjtBQUl4QjdNLGNBQU0sSUFKa0I7QUFLeEI4TSxnQkFBUSxDQUxnQjtBQU14QkMsc0JBQWMsQ0FOVTtBQU94QkMsdUJBQWUsQ0FQUztBQVF4Qi9ULGNBQU1NLEtBQUtOLElBUmE7QUFTeEJ1RSxXQUFHO0FBQ0Y3RCxlQUFLbU0sTUFBTWpHLE9BRFQ7QUFFRnBDLG9CQUFVcUksTUFBTXJJO0FBRmQsU0FUcUI7QUFheEJoRSxXQUFHLEdBYnFCO0FBY3hCd1QsOEJBQXNCLEtBZEU7QUFleEJDLGlDQUF5QixLQWZEO0FBZ0J4QkMsNEJBQW9CO0FBaEJJLE9BQXpCO0FBa0JBL1YsaUJBQVc4QixNQUFYLENBQWtCa1UsYUFBbEIsQ0FBZ0NpTCx1QkFBaEMsQ0FBd0Q5ZSxLQUFLSSxHQUE3RCxFQUFrRTRJLFNBQVM1SSxHQUEzRTtBQUVBdkMsaUJBQVc4QixNQUFYLENBQWtCa1UsYUFBbEIsQ0FBZ0NqUixNQUFoQyxDQUF1Q3lRLGdCQUF2QztBQUVBeFYsaUJBQVc4QixNQUFYLENBQWtCd0csUUFBbEIsQ0FBMkI0WSxnQ0FBM0IsQ0FBNEQvZSxLQUFLSSxHQUFqRSxFQUFzRTtBQUFFQSxhQUFLNEksU0FBUzVJLEdBQWhCO0FBQXFCOEQsa0JBQVU4RSxTQUFTOUU7QUFBeEMsT0FBdEU7QUFDQXJHLGlCQUFXOEIsTUFBWCxDQUFrQndHLFFBQWxCLENBQTJCNlksK0JBQTNCLENBQTJEaGYsS0FBS0ksR0FBaEUsRUFBcUU7QUFBRUEsYUFBS21NLE1BQU1qRyxPQUFiO0FBQXNCcEMsa0JBQVVxSSxNQUFNckk7QUFBdEMsT0FBckU7QUFFQXJHLGlCQUFXOEcsUUFBWCxDQUFvQnNQLE1BQXBCLENBQTJCQyxJQUEzQixDQUFnQ2xVLEtBQUtJLEdBQXJDLEVBQTBDO0FBQ3pDbUUsY0FBTSxXQURtQztBQUV6Q3BDLGNBQU10RSxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCMEIsWUFBeEIsQ0FBcUNzRCxNQUFNakcsT0FBM0M7QUFGbUMsT0FBMUM7QUFLQSxhQUFPLElBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQWpYb0I7O0FBbVhyQjFCLGNBQVlOLFFBQVosRUFBc0IyYSxRQUF0QixFQUFnQ0MsU0FBUyxDQUF6QyxFQUE0QztBQUMzQyxRQUFJO0FBQ0gsWUFBTWphLFVBQVU7QUFDZmpILGlCQUFTO0FBQ1IseUNBQStCSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qix1QkFBeEI7QUFEdkIsU0FETTtBQUlmb0UsY0FBTW1DO0FBSlMsT0FBaEI7QUFNQSxhQUFPckMsS0FBS0MsSUFBTCxDQUFVckUsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IscUJBQXhCLENBQVYsRUFBMERrSCxPQUExRCxDQUFQO0FBQ0EsS0FSRCxDQVFFLE9BQU9oQyxDQUFQLEVBQVU7QUFDWHBGLGlCQUFXOEcsUUFBWCxDQUFvQitYLE1BQXBCLENBQTJCRyxPQUEzQixDQUFtQzFaLEtBQW5DLENBQTBDLHFCQUFxQitiLE1BQVEsU0FBdkUsRUFBaUZqYyxDQUFqRixFQURXLENBRVg7O0FBQ0EsVUFBSWljLFNBQVMsRUFBYixFQUFpQjtBQUNoQnJoQixtQkFBVzhHLFFBQVgsQ0FBb0IrWCxNQUFwQixDQUEyQkcsT0FBM0IsQ0FBbUNzQyxJQUFuQyxDQUF3QyxrQ0FBeEM7QUFDQUQ7QUFDQUUsbUJBQVdqaUIsT0FBT0MsZUFBUCxDQUF1QixNQUFNO0FBQ3ZDUyxxQkFBVzhHLFFBQVgsQ0FBb0JDLFdBQXBCLENBQWdDTixRQUFoQyxFQUEwQzJhLFFBQTFDLEVBQW9EQyxNQUFwRDtBQUNBLFNBRlUsQ0FBWCxFQUVJLEtBRko7QUFHQTtBQUNEO0FBQ0QsR0F2WW9COztBQXlZckJsYSwyQkFBeUJoRixJQUF6QixFQUErQjtBQUM5QixVQUFNcUIsVUFBVStCLGlCQUFpQjBFLFdBQWpCLENBQTZCOUgsS0FBS3RELENBQUwsQ0FBTzBELEdBQXBDLENBQWhCO0FBQ0EsVUFBTW1NLFFBQVExTyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCTyxXQUF4QixDQUFvQzlILEtBQUtnSixRQUFMLElBQWlCaEosS0FBS2dKLFFBQUwsQ0FBYzVJLEdBQW5FLENBQWQ7QUFFQSxVQUFNaWYsS0FBSyxJQUFJN0MsUUFBSixFQUFYO0FBQ0E2QyxPQUFHQyxLQUFILENBQVNqZSxRQUFRMGMsU0FBakI7QUFFQSxVQUFNelosV0FBVztBQUNoQmxFLFdBQUtKLEtBQUtJLEdBRE07QUFFaEIwTixhQUFPOU4sS0FBSzhOLEtBRkk7QUFHaEJVLGFBQU94TyxLQUFLd08sS0FISTtBQUloQjlPLFlBQU1NLEtBQUtOLElBSks7QUFLaEJnVCxpQkFBVzFTLEtBQUsrQyxFQUxBO0FBTWhCNFAscUJBQWUzUyxLQUFLdWYsRUFOSjtBQU9oQi9aLFlBQU14RixLQUFLd0YsSUFQSztBQVFoQkcsb0JBQWMzRixLQUFLK0UsWUFSSDtBQVNoQjFELGVBQVM7QUFDUmpCLGFBQUtpQixRQUFRakIsR0FETDtBQUVScUUsY0FBTXBELFFBQVFvRCxJQUZOO0FBR1JQLGtCQUFVN0MsUUFBUTZDLFFBSFY7QUFJUlEsZUFBTyxJQUpDO0FBS1JZLGVBQU8sSUFMQztBQU1SMkcsb0JBQVk1SyxRQUFRNEssVUFOWjtBQU9SNEcsWUFBSXhSLFFBQVF3UixFQVBKO0FBUVJFLFlBQUlzTSxHQUFHRyxLQUFILEdBQVcvYSxJQUFYLElBQXFCLEdBQUc0YSxHQUFHRyxLQUFILEdBQVcvYSxJQUFNLElBQUk0YSxHQUFHRyxLQUFILEdBQVdDLE9BQVMsRUFSN0Q7QUFTUjNNLGlCQUFTdU0sR0FBR0ssVUFBSCxHQUFnQmpiLElBQWhCLElBQTBCLEdBQUc0YSxHQUFHSyxVQUFILEdBQWdCamIsSUFBTSxJQUFJNGEsR0FBR0ssVUFBSCxHQUFnQkQsT0FBUyxFQVRqRjtBQVVSOVosc0JBQWN0RSxRQUFRMEQ7QUFWZDtBQVRPLEtBQWpCOztBQXVCQSxRQUFJd0gsS0FBSixFQUFXO0FBQ1ZqSSxlQUFTaUksS0FBVCxHQUFpQjtBQUNoQm5NLGFBQUttTSxNQUFNbk0sR0FESztBQUVoQjhELGtCQUFVcUksTUFBTXJJLFFBRkE7QUFHaEJPLGNBQU04SCxNQUFNOUgsSUFISTtBQUloQkMsZUFBTztBQUpTLE9BQWpCOztBQU9BLFVBQUk2SCxNQUFNbUssTUFBTixJQUFnQm5LLE1BQU1tSyxNQUFOLENBQWF0TSxNQUFiLEdBQXNCLENBQTFDLEVBQTZDO0FBQzVDOUYsaUJBQVNpSSxLQUFULENBQWU3SCxLQUFmLEdBQXVCNkgsTUFBTW1LLE1BQU4sQ0FBYSxDQUFiLEVBQWdCbUYsT0FBdkM7QUFDQTtBQUNEOztBQUVELFFBQUk3YixLQUFLa1ksT0FBVCxFQUFrQjtBQUNqQjVULGVBQVM0VCxPQUFULEdBQW1CbFksS0FBS2tZLE9BQXhCO0FBQ0E7O0FBRUQsUUFBSTdXLFFBQVFnSixhQUFSLElBQXlCaEosUUFBUWdKLGFBQVIsQ0FBc0JELE1BQXRCLEdBQStCLENBQTVELEVBQStEO0FBQzlEOUYsZUFBU2pELE9BQVQsQ0FBaUJxRCxLQUFqQixHQUF5QnJELFFBQVFnSixhQUFqQztBQUNBOztBQUNELFFBQUloSixRQUFRaUUsS0FBUixJQUFpQmpFLFFBQVFpRSxLQUFSLENBQWM4RSxNQUFkLEdBQXVCLENBQTVDLEVBQStDO0FBQzlDOUYsZUFBU2pELE9BQVQsQ0FBaUJpRSxLQUFqQixHQUF5QmpFLFFBQVFpRSxLQUFqQztBQUNBOztBQUVELFdBQU9oQixRQUFQO0FBQ0EsR0FoY29COztBQWtjckI2QyxXQUFTakQsUUFBVCxFQUFtQjtBQUNsQjRFLFVBQU01RSxRQUFOLEVBQWdCNkUsTUFBaEI7QUFFQSxVQUFNOUksT0FBT3BDLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JvSSxpQkFBeEIsQ0FBMEN6TCxRQUExQyxFQUFvRDtBQUFFZ0csY0FBUTtBQUFFOUosYUFBSyxDQUFQO0FBQVU4RCxrQkFBVTtBQUFwQjtBQUFWLEtBQXBELENBQWI7O0FBRUEsUUFBSSxDQUFDakUsSUFBTCxFQUFXO0FBQ1YsWUFBTSxJQUFJOUMsT0FBT3NELEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXZELENBQU47QUFDQTs7QUFFRCxRQUFJckosV0FBV2lDLEtBQVgsQ0FBaUI2ZixZQUFqQixDQUE4QjFmLEtBQUtHLEdBQW5DLEVBQXdDLGdCQUF4QyxDQUFKLEVBQStEO0FBQzlEdkMsaUJBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0I2TixXQUF4QixDQUFvQ25WLEtBQUtHLEdBQXpDLEVBQThDLElBQTlDO0FBQ0F2QyxpQkFBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QkMsaUJBQXhCLENBQTBDdkgsS0FBS0csR0FBL0MsRUFBb0QsV0FBcEQ7QUFDQSxhQUFPSCxJQUFQO0FBQ0E7O0FBRUQsV0FBTyxLQUFQO0FBQ0EsR0FsZG9COztBQW9kckJtSCxhQUFXbEQsUUFBWCxFQUFxQjtBQUNwQjRFLFVBQU01RSxRQUFOLEVBQWdCNkUsTUFBaEI7QUFFQSxVQUFNOUksT0FBT3BDLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JvSSxpQkFBeEIsQ0FBMEN6TCxRQUExQyxFQUFvRDtBQUFFZ0csY0FBUTtBQUFFOUosYUFBSyxDQUFQO0FBQVU4RCxrQkFBVTtBQUFwQjtBQUFWLEtBQXBELENBQWI7O0FBRUEsUUFBSSxDQUFDakUsSUFBTCxFQUFXO0FBQ1YsWUFBTSxJQUFJOUMsT0FBT3NELEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXZELENBQU47QUFDQTs7QUFFRCxRQUFJckosV0FBV2lDLEtBQVgsQ0FBaUI2ZixZQUFqQixDQUE4QjFmLEtBQUtHLEdBQW5DLEVBQXdDLGtCQUF4QyxDQUFKLEVBQWlFO0FBQ2hFLGFBQU9ILElBQVA7QUFDQTs7QUFFRCxXQUFPLEtBQVA7QUFDQSxHQWxlb0I7O0FBb2VyQmdOLGNBQVkvSSxRQUFaLEVBQXNCO0FBQ3JCNEUsVUFBTTVFLFFBQU4sRUFBZ0I2RSxNQUFoQjtBQUVBLFVBQU05SSxPQUFPcEMsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3Qm9JLGlCQUF4QixDQUEwQ3pMLFFBQTFDLEVBQW9EO0FBQUVnRyxjQUFRO0FBQUU5SixhQUFLO0FBQVA7QUFBVixLQUFwRCxDQUFiOztBQUVBLFFBQUksQ0FBQ0gsSUFBTCxFQUFXO0FBQ1YsWUFBTSxJQUFJOUMsT0FBT3NELEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQUV5RyxnQkFBUTtBQUFWLE9BQXZELENBQU47QUFDQTs7QUFFRCxRQUFJckosV0FBV2lDLEtBQVgsQ0FBaUI4ZixtQkFBakIsQ0FBcUMzZixLQUFLRyxHQUExQyxFQUErQyxnQkFBL0MsQ0FBSixFQUFzRTtBQUNyRXZDLGlCQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCNk4sV0FBeEIsQ0FBb0NuVixLQUFLRyxHQUF6QyxFQUE4QyxLQUE5QztBQUNBdkMsaUJBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JDLGlCQUF4QixDQUEwQ3ZILEtBQUtHLEdBQS9DLEVBQW9ELGVBQXBEO0FBQ0EsYUFBTyxJQUFQO0FBQ0E7O0FBRUQsV0FBTyxLQUFQO0FBQ0EsR0FwZm9COztBQXNmckJpTixnQkFBY25KLFFBQWQsRUFBd0I7QUFDdkI0RSxVQUFNNUUsUUFBTixFQUFnQjZFLE1BQWhCO0FBRUEsVUFBTTlJLE9BQU9wQyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCb0ksaUJBQXhCLENBQTBDekwsUUFBMUMsRUFBb0Q7QUFBRWdHLGNBQVE7QUFBRTlKLGFBQUs7QUFBUDtBQUFWLEtBQXBELENBQWI7O0FBRUEsUUFBSSxDQUFDSCxJQUFMLEVBQVc7QUFDVixZQUFNLElBQUk5QyxPQUFPc0QsS0FBWCxDQUFpQixvQkFBakIsRUFBdUMsY0FBdkMsRUFBdUQ7QUFBRXlHLGdCQUFRO0FBQVYsT0FBdkQsQ0FBTjtBQUNBOztBQUVELFdBQU9ySixXQUFXaUMsS0FBWCxDQUFpQjhmLG1CQUFqQixDQUFxQzNmLEtBQUtHLEdBQTFDLEVBQStDLGtCQUEvQyxDQUFQO0FBQ0EsR0FoZ0JvQjs7QUFrZ0JyQmdPLGlCQUFlaE8sR0FBZixFQUFvQjhOLGNBQXBCLEVBQW9DQyxnQkFBcEMsRUFBc0Q7QUFDckRyRixVQUFNMUksR0FBTixFQUFXd04sTUFBTXdCLEtBQU4sQ0FBWXJHLE1BQVosQ0FBWDtBQUVBRCxVQUFNb0YsY0FBTixFQUFzQjtBQUNyQmhHLGVBQVNvSCxPQURZO0FBRXJCN0ssWUFBTXNFLE1BRmU7QUFHckJzRyxtQkFBYXpCLE1BQU1XLFFBQU4sQ0FBZXhGLE1BQWYsQ0FIUTtBQUlyQitQLDBCQUFvQnhKO0FBSkMsS0FBdEI7QUFPQXhHLFVBQU1xRixnQkFBTixFQUF3QixDQUN2QlAsTUFBTUMsZUFBTixDQUFzQjtBQUNyQnZILGVBQVN5QyxNQURZO0FBRXJCN0UsZ0JBQVU2RTtBQUZXLEtBQXRCLENBRHVCLENBQXhCOztBQU9BLFFBQUkzSSxHQUFKLEVBQVM7QUFDUixZQUFNNkwsYUFBYXBPLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLENBQXFDakUsV0FBckMsQ0FBaUQxSCxHQUFqRCxDQUFuQjs7QUFDQSxVQUFJLENBQUM2TCxVQUFMLEVBQWlCO0FBQ2hCLGNBQU0sSUFBSTlPLE9BQU9zRCxLQUFYLENBQWlCLDRCQUFqQixFQUErQyxzQkFBL0MsRUFBdUU7QUFBRXlHLGtCQUFRO0FBQVYsU0FBdkUsQ0FBTjtBQUNBO0FBQ0Q7O0FBRUQsV0FBT3JKLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLENBQXFDOE0sd0JBQXJDLENBQThEelksR0FBOUQsRUFBbUU4TixjQUFuRSxFQUFtRkMsZ0JBQW5GLENBQVA7QUFDQSxHQTNoQm9COztBQTZoQnJCZixtQkFBaUJoTixHQUFqQixFQUFzQjtBQUNyQjBJLFVBQU0xSSxHQUFOLEVBQVcySSxNQUFYO0FBRUEsVUFBTWtELGFBQWFwTyxXQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ2pFLFdBQXJDLENBQWlEMUgsR0FBakQsRUFBc0Q7QUFBRThKLGNBQVE7QUFBRTlKLGFBQUs7QUFBUDtBQUFWLEtBQXRELENBQW5COztBQUVBLFFBQUksQ0FBQzZMLFVBQUwsRUFBaUI7QUFDaEIsWUFBTSxJQUFJOU8sT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLHNCQUF6QyxFQUFpRTtBQUFFeUcsZ0JBQVE7QUFBVixPQUFqRSxDQUFOO0FBQ0E7O0FBRUQsV0FBT3JKLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLENBQXFDb0IsVUFBckMsQ0FBZ0QvTSxHQUFoRCxDQUFQO0FBQ0EsR0F2aUJvQjs7QUF5aUJyQnNkLG1CQUFpQjtBQUNoQixRQUFJN2YsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IseUJBQXhCLE1BQXVELFlBQTNELEVBQXlFO0FBQ3hFLGFBQU9GLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHdDQUF4QixDQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sYUFBTyxLQUFQO0FBQ0E7QUFDRDs7QUEvaUJvQixDQUF0QjtBQWtqQkFGLFdBQVc4RyxRQUFYLENBQW9Cc1AsTUFBcEIsR0FBNkIsSUFBSTlXLE9BQU8waUIsUUFBWCxDQUFvQixlQUFwQixDQUE3QjtBQUVBaGlCLFdBQVc4RyxRQUFYLENBQW9Cc1AsTUFBcEIsQ0FBMkI2TCxTQUEzQixDQUFxQyxDQUFDclksTUFBRCxFQUFTcEgsU0FBVCxLQUF1QjtBQUMzRCxRQUFNTCxPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa0ksV0FBeEIsQ0FBb0NMLE1BQXBDLENBQWI7O0FBQ0EsTUFBSSxDQUFDekgsSUFBTCxFQUFXO0FBQ1YrRixZQUFRb1osSUFBUixDQUFjLHVCQUF1QjFYLE1BQVEsR0FBN0M7QUFDQSxXQUFPLEtBQVA7QUFDQTs7QUFDRCxNQUFJekgsS0FBS0UsQ0FBTCxLQUFXLEdBQVgsSUFBa0JHLFNBQWxCLElBQStCQSxVQUFVQyxLQUF6QyxJQUFrRE4sS0FBS3RELENBQUwsQ0FBTzRELEtBQVAsS0FBaUJELFVBQVVDLEtBQWpGLEVBQXdGO0FBQ3ZGLFdBQU8sSUFBUDtBQUNBOztBQUNELFNBQU8sS0FBUDtBQUNBLENBVkQ7QUFZQXpDLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLCtCQUF4QixFQUF5RCxDQUFDNEQsR0FBRCxFQUFNQyxLQUFOLEtBQWdCO0FBQ3hFL0QsYUFBVzhHLFFBQVgsQ0FBb0I4WCxrQkFBcEIsR0FBeUM3YSxLQUF6QztBQUNBLENBRkQsRTs7Ozs7Ozs7Ozs7QUN0a0JBLElBQUl2RixDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBRU5tQixXQUFXMmYsWUFBWCxHQUEwQjtBQUN6Qjs7Ozs7QUFLQSxpQkFBZTNOLEtBQWYsRUFBc0JoTyxPQUF0QixFQUErQndiLFFBQS9CLEVBQXlDOVEsS0FBekMsRUFBZ0Q7QUFDL0MsUUFBSSxDQUFDQSxLQUFMLEVBQVk7QUFDWEEsY0FBUTFPLFdBQVc4RyxRQUFYLENBQW9CNkgsWUFBcEIsQ0FBaUNxRCxNQUFNNUQsVUFBdkMsQ0FBUjs7QUFDQSxVQUFJLENBQUNNLEtBQUwsRUFBWTtBQUNYLGNBQU0sSUFBSXBQLE9BQU9zRCxLQUFYLENBQWlCLGlCQUFqQixFQUFvQyx5QkFBcEMsQ0FBTjtBQUNBO0FBQ0Q7O0FBRUQsVUFBTXNmLFdBQVdsaUIsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcVgsdUJBQXhCLEVBQWpCOztBQUVBLFVBQU1qWCxPQUFPM0QsRUFBRTBhLE1BQUYsQ0FBUztBQUNyQjNXLFdBQUt5QixRQUFRZ0IsR0FEUTtBQUVyQm1kLFlBQU0sQ0FGZTtBQUdyQlQsVUFBSSxJQUFJdmMsSUFBSixFQUhpQjtBQUlyQnRELFlBQU1xZ0IsUUFKZTtBQUtyQmpTLGFBQU8rQixNQUFNcEwsSUFBTixJQUFjb0wsTUFBTTNMLFFBTE47QUFNckI7QUFDQWhFLFNBQUcsR0FQa0I7QUFRckI2QyxVQUFJLElBQUlDLElBQUosRUFSaUI7QUFTckJ0RyxTQUFHO0FBQ0YwRCxhQUFLeVAsTUFBTXpQLEdBRFQ7QUFFRjhELGtCQUFVMkwsTUFBTTNMLFFBRmQ7QUFHRjVELGVBQU91QixRQUFRdkIsS0FIYjtBQUlGYSxnQkFBUTBPLE1BQU0xTyxNQUFOLElBQWdCO0FBSnRCLE9BVGtCO0FBZXJCNkgsZ0JBQVU7QUFDVDVJLGFBQUttTSxNQUFNakcsT0FERjtBQUVUcEMsa0JBQVVxSSxNQUFNckk7QUFGUCxPQWZXO0FBbUJyQmlHLFVBQUksS0FuQmlCO0FBb0JyQjFELFlBQU0sSUFwQmU7QUFxQnJCM0MsdUJBQWlCO0FBckJJLEtBQVQsRUFzQlZ1WixRQXRCVSxDQUFiOztBQXVCQSxVQUFNaEssbUJBQW1CO0FBQ3hCeFEsV0FBS2hCLFFBQVFnQixHQURXO0FBRXhCNEIsWUFBTW9MLE1BQU1wTCxJQUFOLElBQWNvTCxNQUFNM0wsUUFGRjtBQUd4Qm9QLGFBQU8sSUFIaUI7QUFJeEI3TSxZQUFNLElBSmtCO0FBS3hCOE0sY0FBUSxDQUxnQjtBQU14QkMsb0JBQWMsQ0FOVTtBQU94QkMscUJBQWUsQ0FQUztBQVF4Qi9ULFlBQU1xZ0IsUUFSa0I7QUFTeEI5YixTQUFHO0FBQ0Y3RCxhQUFLbU0sTUFBTWpHLE9BRFQ7QUFFRnBDLGtCQUFVcUksTUFBTXJJO0FBRmQsT0FUcUI7QUFheEJoRSxTQUFHLEdBYnFCO0FBY3hCd1QsNEJBQXNCLEtBZEU7QUFleEJDLCtCQUF5QixLQWZEO0FBZ0J4QkMsMEJBQW9CO0FBaEJJLEtBQXpCO0FBbUJBL1YsZUFBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCZ0QsTUFBeEIsQ0FBK0I1QyxJQUEvQjtBQUNBbkMsZUFBVzhCLE1BQVgsQ0FBa0JrVSxhQUFsQixDQUFnQ2pSLE1BQWhDLENBQXVDeVEsZ0JBQXZDO0FBRUF4VixlQUFXOEcsUUFBWCxDQUFvQnNQLE1BQXBCLENBQTJCQyxJQUEzQixDQUFnQ2xVLEtBQUtJLEdBQXJDLEVBQTBDO0FBQ3pDbUUsWUFBTSxXQURtQztBQUV6Q3BDLFlBQU10RSxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCMEIsWUFBeEIsQ0FBcUNzRCxNQUFNakcsT0FBM0M7QUFGbUMsS0FBMUM7QUFLQSxXQUFPdEcsSUFBUDtBQUNBLEdBbkV3Qjs7QUFvRXpCOzs7Ozs7Ozs7QUFTQSxlQUFhNlAsS0FBYixFQUFvQmhPLE9BQXBCLEVBQTZCd2IsUUFBN0IsRUFBdUM7QUFDdEMsUUFBSXRFLFNBQVNsYixXQUFXOEcsUUFBWCxDQUFvQnNZLGVBQXBCLENBQW9DcE4sTUFBTTVELFVBQTFDLENBQWI7O0FBRUEsUUFBSThNLE9BQU8zTSxLQUFQLE9BQW1CLENBQW5CLElBQXdCdk8sV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isb0NBQXhCLENBQTVCLEVBQTJGO0FBQzFGZ2IsZUFBU2xiLFdBQVc4RyxRQUFYLENBQW9CcVksU0FBcEIsQ0FBOEJuTixNQUFNNUQsVUFBcEMsQ0FBVDtBQUNBOztBQUVELFFBQUk4TSxPQUFPM00sS0FBUCxPQUFtQixDQUF2QixFQUEwQjtBQUN6QixZQUFNLElBQUlqUCxPQUFPc0QsS0FBWCxDQUFpQixpQkFBakIsRUFBb0MseUJBQXBDLENBQU47QUFDQTs7QUFFRCxVQUFNc2YsV0FBV2xpQixXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JxWCx1QkFBeEIsRUFBakI7QUFFQSxVQUFNZ0osV0FBVyxFQUFqQjtBQUVBbEgsV0FBT25ULE9BQVAsQ0FBZ0IyRyxLQUFELElBQVc7QUFDekIsVUFBSXNELE1BQU01RCxVQUFWLEVBQXNCO0FBQ3JCZ1UsaUJBQVMxWixJQUFULENBQWNnRyxNQUFNakcsT0FBcEI7QUFDQSxPQUZELE1BRU87QUFDTjJaLGlCQUFTMVosSUFBVCxDQUFjZ0csTUFBTW5NLEdBQXBCO0FBQ0E7QUFDRCxLQU5EO0FBUUEsVUFBTWdULFVBQVU7QUFDZnZRLFdBQUtoQixRQUFRZ0IsR0FERTtBQUVmaEIsZUFBU0EsUUFBUVEsR0FGRjtBQUdmb0MsWUFBTW9MLE1BQU1wTCxJQUFOLElBQWNvTCxNQUFNM0wsUUFIWDtBQUlmbkIsVUFBSSxJQUFJQyxJQUFKLEVBSlc7QUFLZnRELFlBQU1xZ0IsUUFMUztBQU1mOVQsa0JBQVk0RCxNQUFNNUQsVUFOSDtBQU9mOE0sY0FBUWtILFFBUE87QUFRZjllLGNBQVEsTUFSTztBQVNmekUsU0FBRztBQUNGMEQsYUFBS3lQLE1BQU16UCxHQURUO0FBRUY4RCxrQkFBVTJMLE1BQU0zTCxRQUZkO0FBR0Y1RCxlQUFPdUIsUUFBUXZCLEtBSGI7QUFJRmEsZ0JBQVEwTyxNQUFNMU8sTUFBTixJQUFnQjtBQUp0QixPQVRZO0FBZWZqQixTQUFHO0FBZlksS0FBaEI7O0FBaUJBLFVBQU1GLE9BQU8zRCxFQUFFMGEsTUFBRixDQUFTO0FBQ3JCM1csV0FBS3lCLFFBQVFnQixHQURRO0FBRXJCbWQsWUFBTSxDQUZlO0FBR3JCVCxVQUFJLElBQUl2YyxJQUFKLEVBSGlCO0FBSXJCdEQsWUFBTXFnQixRQUplO0FBS3JCalMsYUFBTytCLE1BQU1wTCxJQUFOLElBQWNvTCxNQUFNM0wsUUFMTjtBQU1yQjtBQUNBaEUsU0FBRyxHQVBrQjtBQVFyQjZDLFVBQUksSUFBSUMsSUFBSixFQVJpQjtBQVNyQnRHLFNBQUc7QUFDRjBELGFBQUt5UCxNQUFNelAsR0FEVDtBQUVGOEQsa0JBQVUyTCxNQUFNM0wsUUFGZDtBQUdGNUQsZUFBT3VCLFFBQVF2QixLQUhiO0FBSUZhLGdCQUFRME8sTUFBTTFPO0FBSlosT0FUa0I7QUFlckJnSixVQUFJLEtBZmlCO0FBZ0JyQjFELFlBQU0sSUFoQmU7QUFpQnJCM0MsdUJBQWlCO0FBakJJLEtBQVQsRUFrQlZ1WixRQWxCVSxDQUFiOztBQW1CQXhmLGVBQVc4QixNQUFYLENBQWtCMkIsZUFBbEIsQ0FBa0NzQixNQUFsQyxDQUF5Q3dRLE9BQXpDO0FBQ0F2VixlQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JnRCxNQUF4QixDQUErQjVDLElBQS9CO0FBRUEsV0FBT0EsSUFBUDtBQUNBLEdBNUl3Qjs7QUE2SXpCLGFBQVc2UCxLQUFYLEVBQWtCaE8sT0FBbEIsRUFBMkJ3YixRQUEzQixFQUFxQzlRLEtBQXJDLEVBQTRDO0FBQzNDLFdBQU8sS0FBSyxjQUFMLEVBQXFCc0QsS0FBckIsRUFBNEJoTyxPQUE1QixFQUFxQ3diLFFBQXJDLEVBQStDOVEsS0FBL0MsQ0FBUCxDQUQyQyxDQUNtQjtBQUM5RDs7QUEvSXdCLENBQTFCLEM7Ozs7Ozs7Ozs7O0FDRkE7QUFDQXBQLE9BQU8raUIsV0FBUCxDQUFtQixZQUFXO0FBQzdCLE1BQUlyaUIsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsOEJBQXhCLENBQUosRUFBNkQ7QUFDNUQsUUFBSUYsV0FBVzhCLE1BQVgsQ0FBa0IrVSxrQkFBbEIsQ0FBcUMwRyxhQUFyQyxFQUFKLEVBQTBEO0FBQ3pEdmQsaUJBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JrUCxVQUF4QjtBQUNBLEtBRkQsTUFFTyxJQUFJNVksV0FBVzhCLE1BQVgsQ0FBa0IrVSxrQkFBbEIsQ0FBcUM0RyxhQUFyQyxFQUFKLEVBQTBEO0FBQ2hFemQsaUJBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JnUCxXQUF4QjtBQUNBO0FBQ0Q7QUFDRCxDQVJELEVBUUcsS0FSSCxFOzs7Ozs7Ozs7OztBQ0RBLE1BQU00SixhQUFhLDBCQUFuQjtBQUFBN2pCLE9BQU9pZ0IsYUFBUCxDQUVlO0FBQ2RuVSxXQUFTO0FBQ1IsVUFBTTVGLFNBQVNQLEtBQUs2RCxJQUFMLENBQVUsTUFBVixFQUFtQixHQUFHcWEsVUFBWSxrQkFBbEMsRUFBcUQ7QUFDbkVuaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0QsRUFEMUU7QUFFUix3QkFBZ0I7QUFGUixPQUQwRDtBQUtuRW9FLFlBQU07QUFDTHhGLGFBQUtrQixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixVQUF4QjtBQURBO0FBTDZELEtBQXJELENBQWY7QUFTQSxXQUFPeUUsT0FBT0wsSUFBZDtBQUNBLEdBWmE7O0FBY2RvRyxZQUFVO0FBQ1QsVUFBTS9GLFNBQVNQLEtBQUs2RCxJQUFMLENBQVUsUUFBVixFQUFxQixHQUFHcWEsVUFBWSxrQkFBcEMsRUFBdUQ7QUFDckVuaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0QsRUFEMUU7QUFFUix3QkFBZ0I7QUFGUjtBQUQ0RCxLQUF2RCxDQUFmO0FBTUEsV0FBT3lFLE9BQU9MLElBQWQ7QUFDQSxHQXRCYTs7QUF3QmRxRyxjQUFZO0FBQ1gsVUFBTWhHLFNBQVNQLEtBQUs2RCxJQUFMLENBQVUsS0FBVixFQUFrQixHQUFHcWEsVUFBWSxpQkFBakMsRUFBbUQ7QUFDakVuaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0Q7QUFEMUU7QUFEd0QsS0FBbkQsQ0FBZjtBQUtBLFdBQU95RSxPQUFPTCxJQUFkO0FBQ0EsR0EvQmE7O0FBaUNkc0csWUFBVTJYLE1BQVYsRUFBa0I7QUFDakIsVUFBTTVkLFNBQVNQLEtBQUs2RCxJQUFMLENBQVUsTUFBVixFQUFtQixHQUFHcWEsVUFBWSxrQkFBa0JDLE1BQVEsWUFBNUQsRUFBeUU7QUFDdkZwaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0Q7QUFEMUU7QUFEOEUsS0FBekUsQ0FBZjtBQUtBLFdBQU95RSxPQUFPTCxJQUFkO0FBQ0EsR0F4Q2E7O0FBMENkdUcsY0FBWTBYLE1BQVosRUFBb0I7QUFDbkIsVUFBTTVkLFNBQVNQLEtBQUs2RCxJQUFMLENBQVUsUUFBVixFQUFxQixHQUFHcWEsVUFBWSxrQkFBa0JDLE1BQVEsWUFBOUQsRUFBMkU7QUFDekZwaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0Q7QUFEMUU7QUFEZ0YsS0FBM0UsQ0FBZjtBQUtBLFdBQU95RSxPQUFPTCxJQUFkO0FBQ0EsR0FqRGE7O0FBbURkeUUsUUFBTTtBQUFFQyxRQUFGO0FBQVF2RyxTQUFSO0FBQWV5RztBQUFmLEdBQU4sRUFBNkI7QUFDNUIsV0FBTzlFLEtBQUs2RCxJQUFMLENBQVUsTUFBVixFQUFtQixHQUFHcWEsVUFBWSxpQkFBbEMsRUFBb0Q7QUFDMURuaUIsZUFBUztBQUNSLHlCQUFrQixVQUFVSCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBc0Q7QUFEMUUsT0FEaUQ7QUFJMURvRSxZQUFNO0FBQ0wwRSxZQURLO0FBRUx2RyxhQUZLO0FBR0x5RztBQUhLO0FBSm9ELEtBQXBELENBQVA7QUFVQTs7QUE5RGEsQ0FGZixFOzs7Ozs7Ozs7OztBQ0FBLElBQUkzRCxnQkFBSjtBQUFxQjlHLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSwyQkFBUixDQUFiLEVBQWtEO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDMEcsdUJBQWlCMUcsQ0FBakI7QUFBbUI7O0FBQS9CLENBQWxELEVBQW1GLENBQW5GO0FBRXJCbUIsV0FBVzBDLFNBQVgsQ0FBcUJDLEdBQXJCLENBQXlCLGtCQUF6QixFQUE2QyxVQUFTcUIsT0FBVCxFQUFrQjdCLElBQWxCLEVBQXdCO0FBQ3BFO0FBQ0EsTUFBSTZCLFFBQVFDLFFBQVosRUFBc0I7QUFDckIsV0FBT0QsT0FBUDtBQUNBOztBQUVELE1BQUksQ0FBQ2hFLFdBQVd3aUIsR0FBWCxDQUFlblksT0FBcEIsRUFBNkI7QUFDNUIsV0FBT3JHLE9BQVA7QUFDQSxHQVJtRSxDQVVwRTs7O0FBQ0EsTUFBSSxFQUFFLE9BQU83QixLQUFLRSxDQUFaLEtBQWtCLFdBQWxCLElBQWlDRixLQUFLRSxDQUFMLEtBQVcsR0FBNUMsSUFBbURGLEtBQUtzZ0IsR0FBeEQsSUFBK0R0Z0IsS0FBS3RELENBQXBFLElBQXlFc0QsS0FBS3RELENBQUwsQ0FBTzRELEtBQWxGLENBQUosRUFBOEY7QUFDN0YsV0FBT3VCLE9BQVA7QUFDQSxHQWJtRSxDQWVwRTs7O0FBQ0EsTUFBSUEsUUFBUXZCLEtBQVosRUFBbUI7QUFDbEIsV0FBT3VCLE9BQVA7QUFDQSxHQWxCbUUsQ0FvQnBFOzs7QUFDQSxNQUFJQSxRQUFRM0IsQ0FBWixFQUFlO0FBQ2QsV0FBTzJCLE9BQVA7QUFDQTs7QUFFRCxRQUFNMGUsYUFBYTFpQixXQUFXd2lCLEdBQVgsQ0FBZUcsVUFBZixDQUEwQjNpQixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixhQUF4QixDQUExQixDQUFuQjs7QUFFQSxNQUFJLENBQUN3aUIsVUFBTCxFQUFpQjtBQUNoQixXQUFPMWUsT0FBUDtBQUNBOztBQUVELFFBQU1SLFVBQVUrQixpQkFBaUJ1RSxpQkFBakIsQ0FBbUMzSCxLQUFLdEQsQ0FBTCxDQUFPNEQsS0FBMUMsQ0FBaEI7O0FBRUEsTUFBSSxDQUFDZSxPQUFELElBQVksQ0FBQ0EsUUFBUWlFLEtBQXJCLElBQThCakUsUUFBUWlFLEtBQVIsQ0FBYzhFLE1BQWQsS0FBeUIsQ0FBM0QsRUFBOEQ7QUFDN0QsV0FBT3ZJLE9BQVA7QUFDQTs7QUFFRDBlLGFBQVc1UCxJQUFYLENBQWdCM1EsS0FBS3NnQixHQUFMLENBQVN6UCxJQUF6QixFQUErQnhQLFFBQVFpRSxLQUFSLENBQWMsQ0FBZCxFQUFpQndXLFdBQWhELEVBQTZEamEsUUFBUVEsR0FBckU7QUFFQSxTQUFPUixPQUFQO0FBRUEsQ0F6Q0QsRUF5Q0doRSxXQUFXMEMsU0FBWCxDQUFxQk8sUUFBckIsQ0FBOEJDLEdBekNqQyxFQXlDc0Msa0JBekN0QyxFOzs7Ozs7Ozs7OztBQ0ZBO0FBRUEsSUFBSTBmLGFBQUo7QUFDQSxJQUFJQyxnQkFBZ0IsS0FBcEI7QUFDQSxJQUFJQyxnQkFBZ0IsS0FBcEI7QUFFQSxNQUFNdkQsZUFBZTtBQUNwQmUsU0FBTyxFQURhO0FBRXBCeUMsU0FBTyxFQUZhOztBQUlwQnBnQixNQUFJeUcsTUFBSixFQUFZO0FBQ1gsUUFBSSxLQUFLMlosS0FBTCxDQUFXM1osTUFBWCxDQUFKLEVBQXdCO0FBQ3ZCNFosbUJBQWEsS0FBS0QsS0FBTCxDQUFXM1osTUFBWCxDQUFiO0FBQ0EsYUFBTyxLQUFLMlosS0FBTCxDQUFXM1osTUFBWCxDQUFQO0FBQ0E7O0FBQ0QsU0FBS2tYLEtBQUwsQ0FBV2xYLE1BQVgsSUFBcUIsQ0FBckI7QUFDQSxHQVZtQjs7QUFZcEJ3UixTQUFPeFIsTUFBUCxFQUFlZ1ksUUFBZixFQUF5QjtBQUN4QixRQUFJLEtBQUsyQixLQUFMLENBQVczWixNQUFYLENBQUosRUFBd0I7QUFDdkI0WixtQkFBYSxLQUFLRCxLQUFMLENBQVczWixNQUFYLENBQWI7QUFDQTs7QUFDRCxTQUFLMlosS0FBTCxDQUFXM1osTUFBWCxJQUFxQm1ZLFdBQVdqaUIsT0FBT0MsZUFBUCxDQUF1QixNQUFNO0FBQzVENmhCO0FBRUEsYUFBTyxLQUFLZCxLQUFMLENBQVdsWCxNQUFYLENBQVA7QUFDQSxhQUFPLEtBQUsyWixLQUFMLENBQVczWixNQUFYLENBQVA7QUFDQSxLQUwrQixDQUFYLEVBS2pCMFosYUFMaUIsQ0FBckI7QUFNQSxHQXRCbUI7O0FBd0JwQkcsU0FBTzdaLE1BQVAsRUFBZTtBQUNkLFdBQU8sQ0FBQyxDQUFDLEtBQUtrWCxLQUFMLENBQVdsWCxNQUFYLENBQVQ7QUFDQTs7QUExQm1CLENBQXJCOztBQTZCQSxTQUFTOFosbUJBQVQsQ0FBNkI5WixNQUE3QixFQUFxQztBQUNwQyxRQUFNZ0IsU0FBU3BLLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDZCQUF4QixDQUFmOztBQUNBLE1BQUlrSyxXQUFXLE9BQWYsRUFBd0I7QUFDdkIsV0FBT3BLLFdBQVc4RyxRQUFYLENBQW9CK1osY0FBcEIsQ0FBbUN6WCxNQUFuQyxFQUEyQ3BKLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLDhCQUF4QixDQUEzQyxDQUFQO0FBQ0EsR0FGRCxNQUVPLElBQUlrSyxXQUFXLFNBQWYsRUFBMEI7QUFDaEMsV0FBT3BLLFdBQVc4RyxRQUFYLENBQW9CZ2EsZ0JBQXBCLENBQXFDMVgsTUFBckMsQ0FBUDtBQUNBO0FBQ0Q7O0FBRURwSixXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixxQ0FBeEIsRUFBK0QsVUFBUzRELEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUNuRitlLGtCQUFnQi9lLFFBQVEsSUFBeEI7QUFDQSxDQUZEO0FBSUEvRCxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3Qiw2QkFBeEIsRUFBdUQsVUFBUzRELEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUMzRThlLGtCQUFnQjllLEtBQWhCOztBQUNBLE1BQUlBLFVBQVUsTUFBZCxFQUFzQjtBQUNyQixRQUFJLENBQUM2ZSxhQUFMLEVBQW9CO0FBQ25CQSxzQkFBZ0I1aUIsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3QjRFLGdCQUF4QixHQUEyQzZVLGNBQTNDLENBQTBEO0FBQ3pFQyxjQUFNbmEsRUFBTixFQUFVO0FBQ1RzVyx1QkFBYTVjLEdBQWIsQ0FBaUJzRyxFQUFqQjtBQUNBLFNBSHdFOztBQUl6RW9hLGdCQUFRcGEsRUFBUixFQUFZb0QsTUFBWixFQUFvQjtBQUNuQixjQUFJQSxPQUFPNUMsY0FBUCxJQUF5QjRDLE9BQU81QyxjQUFQLEtBQTBCLGVBQXZELEVBQXdFO0FBQ3ZFOFYseUJBQWEzRSxNQUFiLENBQW9CM1IsRUFBcEIsRUFBd0IsTUFBTTtBQUM3QmlhLGtDQUFvQmphLEVBQXBCO0FBQ0EsYUFGRDtBQUdBLFdBSkQsTUFJTztBQUNOc1cseUJBQWE1YyxHQUFiLENBQWlCc0csRUFBakI7QUFDQTtBQUNELFNBWndFOztBQWF6RXFhLGdCQUFRcmEsRUFBUixFQUFZO0FBQ1hzVyx1QkFBYTNFLE1BQWIsQ0FBb0IzUixFQUFwQixFQUF3QixNQUFNO0FBQzdCaWEsZ0NBQW9CamEsRUFBcEI7QUFDQSxXQUZEO0FBR0E7O0FBakJ3RSxPQUExRCxDQUFoQjtBQW1CQTtBQUNELEdBdEJELE1Bc0JPLElBQUkyWixhQUFKLEVBQW1CO0FBQ3pCQSxrQkFBY1csSUFBZDtBQUNBWCxvQkFBZ0IsSUFBaEI7QUFDQTtBQUNELENBNUJEO0FBOEJBWSxvQkFBb0JDLGVBQXBCLENBQW9DLENBQUNyaEIsSUFBRCxFQUFPa0I7QUFBTTtBQUFiLEtBQXdDO0FBQzNFLE1BQUksQ0FBQ3VmLGFBQUwsRUFBb0I7QUFDbkI7QUFDQTs7QUFDRCxNQUFJdEQsYUFBYTBELE1BQWIsQ0FBb0I3Z0IsS0FBS0csR0FBekIsQ0FBSixFQUFtQztBQUNsQyxRQUFJZSxXQUFXLFNBQVgsSUFBd0JsQixLQUFLcUgsY0FBTCxLQUF3QixlQUFwRCxFQUFxRTtBQUNwRThWLG1CQUFhM0UsTUFBYixDQUFvQnhZLEtBQUtHLEdBQXpCLEVBQThCLE1BQU07QUFDbkMyZ0IsNEJBQW9COWdCLEtBQUtHLEdBQXpCO0FBQ0EsT0FGRDtBQUdBO0FBQ0Q7QUFDRCxDQVhELEU7Ozs7Ozs7Ozs7O0FDOUVBLElBQUl3TyxDQUFKO0FBQU10UyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ2tTLFFBQUVsUyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEO0FBRU5TLE9BQU9va0IsT0FBUCxDQUFlLHVCQUFmLEVBQXdDLFVBQVNuaEIsR0FBVCxFQUFjO0FBQ3JELE1BQUksQ0FBQyxLQUFLNkcsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSSxDQUFDMWpCLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsYUFBNUMsQ0FBTCxFQUFpRTtBQUNoRSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSTNTLEVBQUV6USxJQUFGLENBQU9pQyxHQUFQLENBQUosRUFBaUI7QUFDaEIsV0FBT3ZDLFdBQVc4QixNQUFYLENBQWtCZ0osbUJBQWxCLENBQXNDQyxJQUF0QyxDQUEyQztBQUFFeEk7QUFBRixLQUEzQyxDQUFQO0FBQ0E7O0FBRUQsU0FBT3ZDLFdBQVc4QixNQUFYLENBQWtCZ0osbUJBQWxCLENBQXNDQyxJQUF0QyxFQUFQO0FBRUEsQ0FmRCxFOzs7Ozs7Ozs7OztBQ0ZBekwsT0FBT29rQixPQUFQLENBQWUsMkJBQWYsRUFBNEMsVUFBU3JQLFlBQVQsRUFBdUI7QUFDbEUsTUFBSSxDQUFDLEtBQUtqTCxNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxxQkFBNUMsQ0FBTCxFQUF5RTtBQUN4RSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsU0FBTzFqQixXQUFXOEIsTUFBWCxDQUFrQnVaLHdCQUFsQixDQUEyQ3RRLElBQTNDLENBQWdEO0FBQUVzSjtBQUFGLEdBQWhELENBQVA7QUFDQSxDQVZELEU7Ozs7Ozs7Ozs7O0FDQUEvVSxPQUFPb2tCLE9BQVAsQ0FBZSwyQkFBZixFQUE0QyxVQUFTOVosTUFBVCxFQUFpQjtBQUM1RCxTQUFPNUosV0FBVzhCLE1BQVgsQ0FBa0JnRCx1QkFBbEIsQ0FBMEM0VixZQUExQyxDQUF1RDlRLE1BQXZELENBQVA7QUFDQSxDQUZELEU7Ozs7Ozs7Ozs7O0FDQUF0SyxPQUFPb2tCLE9BQVAsQ0FBZSxpQkFBZixFQUFrQyxZQUFXO0FBQzVDLE1BQUksQ0FBQyxLQUFLdGEsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSSxDQUFDMWpCLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsYUFBNUMsQ0FBTCxFQUFpRTtBQUNoRSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsUUFBTS9LLE9BQU8sSUFBYjtBQUVBLFFBQU1nTCxTQUFTM2pCLFdBQVdpQyxLQUFYLENBQWlCMmhCLGNBQWpCLENBQWdDLGdCQUFoQyxFQUFrRFQsY0FBbEQsQ0FBaUU7QUFDL0VDLFVBQU1uYSxFQUFOLEVBQVVvRCxNQUFWLEVBQWtCO0FBQ2pCc00sV0FBS3lLLEtBQUwsQ0FBVyxZQUFYLEVBQXlCbmEsRUFBekIsRUFBNkJvRCxNQUE3QjtBQUNBLEtBSDhFOztBQUkvRWdYLFlBQVFwYSxFQUFSLEVBQVlvRCxNQUFaLEVBQW9CO0FBQ25Cc00sV0FBSzBLLE9BQUwsQ0FBYSxZQUFiLEVBQTJCcGEsRUFBM0IsRUFBK0JvRCxNQUEvQjtBQUNBLEtBTjhFOztBQU8vRWlYLFlBQVFyYSxFQUFSLEVBQVk7QUFDWDBQLFdBQUsySyxPQUFMLENBQWEsWUFBYixFQUEyQnJhLEVBQTNCO0FBQ0E7O0FBVDhFLEdBQWpFLENBQWY7QUFZQTBQLE9BQUtrTCxLQUFMO0FBRUFsTCxPQUFLbUwsTUFBTCxDQUFZLFlBQVc7QUFDdEJILFdBQU9KLElBQVA7QUFDQSxHQUZEO0FBR0EsQ0E1QkQsRTs7Ozs7Ozs7Ozs7QUNBQWprQixPQUFPb2tCLE9BQVAsQ0FBZSxxQkFBZixFQUFzQyxZQUFXO0FBQ2hELE1BQUksQ0FBQyxLQUFLdGEsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSSxDQUFDMWpCLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsdUJBQTVDLENBQUwsRUFBMkU7QUFDMUUsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELFFBQU1uZixRQUFRO0FBQ2JoQyxTQUFLO0FBQ0oyVixXQUFLLENBQ0osZ0JBREksRUFFSixzQkFGSSxFQUdKLDJCQUhJLEVBSUosK0JBSkksRUFLSixtQ0FMSSxFQU1KLDBCQU5JLEVBT0osa0NBUEksRUFRSix3QkFSSSxFQVNKLDhCQVRJLEVBVUosd0JBVkk7QUFERDtBQURRLEdBQWQ7QUFpQkEsUUFBTVMsT0FBTyxJQUFiO0FBRUEsUUFBTWdMLFNBQVMzakIsV0FBVzhCLE1BQVgsQ0FBa0J3WCxRQUFsQixDQUEyQnZPLElBQTNCLENBQWdDeEcsS0FBaEMsRUFBdUM0ZSxjQUF2QyxDQUFzRDtBQUNwRUMsVUFBTW5hLEVBQU4sRUFBVW9ELE1BQVYsRUFBa0I7QUFDakJzTSxXQUFLeUssS0FBTCxDQUFXLG9CQUFYLEVBQWlDbmEsRUFBakMsRUFBcUNvRCxNQUFyQztBQUNBLEtBSG1FOztBQUlwRWdYLFlBQVFwYSxFQUFSLEVBQVlvRCxNQUFaLEVBQW9CO0FBQ25Cc00sV0FBSzBLLE9BQUwsQ0FBYSxvQkFBYixFQUFtQ3BhLEVBQW5DLEVBQXVDb0QsTUFBdkM7QUFDQSxLQU5tRTs7QUFPcEVpWCxZQUFRcmEsRUFBUixFQUFZO0FBQ1gwUCxXQUFLMkssT0FBTCxDQUFhLG9CQUFiLEVBQW1DcmEsRUFBbkM7QUFDQTs7QUFUbUUsR0FBdEQsQ0FBZjtBQVlBLE9BQUs0YSxLQUFMO0FBRUEsT0FBS0MsTUFBTCxDQUFZLE1BQU07QUFDakJILFdBQU9KLElBQVA7QUFDQSxHQUZEO0FBR0EsQ0E3Q0QsRTs7Ozs7Ozs7Ozs7QUNBQWprQixPQUFPb2tCLE9BQVAsQ0FBZSxzQkFBZixFQUF1QyxVQUFTbmhCLEdBQVQsRUFBYztBQUNwRCxNQUFJLENBQUMsS0FBSzZHLE1BQVYsRUFBa0I7QUFDakIsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELE1BQUksQ0FBQzFqQixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0IsS0FBSzhHLE1BQXBDLEVBQTRDLGFBQTVDLENBQUwsRUFBaUU7QUFDaEUsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELE1BQUluaEIsUUFBUTRPLFNBQVosRUFBdUI7QUFDdEIsV0FBT25SLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLENBQXFDNk0sa0JBQXJDLENBQXdEeFksR0FBeEQsQ0FBUDtBQUNBLEdBRkQsTUFFTztBQUNOLFdBQU92QyxXQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ25ELElBQXJDLEVBQVA7QUFDQTtBQUVELENBZkQsRTs7Ozs7Ozs7Ozs7QUNBQXpMLE9BQU9va0IsT0FBUCxDQUFlLHNCQUFmLEVBQXVDLFlBQVc7QUFDakQsTUFBSSxDQUFDLEtBQUt0YSxNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsUUFBTS9LLE9BQU8sSUFBYjtBQUVBLFFBQU1nTCxTQUFTM2pCLFdBQVc4QixNQUFYLENBQWtCd1gsUUFBbEIsQ0FBMkJ5SyxTQUEzQixDQUFxQyxDQUFDLHFCQUFELEVBQXdCLHVCQUF4QixFQUFpRCwyQkFBakQsRUFBOEUsaUNBQTlFLENBQXJDLEVBQXVKWixjQUF2SixDQUFzSztBQUNwTEMsVUFBTW5hLEVBQU4sRUFBVW9ELE1BQVYsRUFBa0I7QUFDakJzTSxXQUFLeUssS0FBTCxDQUFXLHFCQUFYLEVBQWtDbmEsRUFBbEMsRUFBc0NvRCxNQUF0QztBQUNBLEtBSG1MOztBQUlwTGdYLFlBQVFwYSxFQUFSLEVBQVlvRCxNQUFaLEVBQW9CO0FBQ25Cc00sV0FBSzBLLE9BQUwsQ0FBYSxxQkFBYixFQUFvQ3BhLEVBQXBDLEVBQXdDb0QsTUFBeEM7QUFDQSxLQU5tTDs7QUFPcExpWCxZQUFRcmEsRUFBUixFQUFZO0FBQ1gwUCxXQUFLMkssT0FBTCxDQUFhLHFCQUFiLEVBQW9DcmEsRUFBcEM7QUFDQTs7QUFUbUwsR0FBdEssQ0FBZjtBQVlBMFAsT0FBS2tMLEtBQUw7QUFFQWxMLE9BQUttTCxNQUFMLENBQVksWUFBVztBQUN0QkgsV0FBT0osSUFBUDtBQUNBLEdBRkQ7QUFHQSxDQTVCRCxFOzs7Ozs7Ozs7OztBQ0FBamtCLE9BQU9va0IsT0FBUCxDQUFlLG1CQUFmLEVBQW9DLFlBQVc7QUFDOUMsTUFBSSxDQUFDLEtBQUt0YSxNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxxQkFBNUMsQ0FBTCxFQUF5RTtBQUN4RSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsUUFBTS9LLE9BQU8sSUFBYjtBQUVBLFFBQU1nTCxTQUFTM2pCLFdBQVdpQyxLQUFYLENBQWlCMmhCLGNBQWpCLENBQWdDLGtCQUFoQyxFQUFvRFQsY0FBcEQsQ0FBbUU7QUFDakZDLFVBQU1uYSxFQUFOLEVBQVVvRCxNQUFWLEVBQWtCO0FBQ2pCc00sV0FBS3lLLEtBQUwsQ0FBVyxjQUFYLEVBQTJCbmEsRUFBM0IsRUFBK0JvRCxNQUEvQjtBQUNBLEtBSGdGOztBQUlqRmdYLFlBQVFwYSxFQUFSLEVBQVlvRCxNQUFaLEVBQW9CO0FBQ25Cc00sV0FBSzBLLE9BQUwsQ0FBYSxjQUFiLEVBQTZCcGEsRUFBN0IsRUFBaUNvRCxNQUFqQztBQUNBLEtBTmdGOztBQU9qRmlYLFlBQVFyYSxFQUFSLEVBQVk7QUFDWDBQLFdBQUsySyxPQUFMLENBQWEsY0FBYixFQUE2QnJhLEVBQTdCO0FBQ0E7O0FBVGdGLEdBQW5FLENBQWY7QUFZQTBQLE9BQUtrTCxLQUFMO0FBRUFsTCxPQUFLbUwsTUFBTCxDQUFZLFlBQVc7QUFDdEJILFdBQU9KLElBQVA7QUFDQSxHQUZEO0FBR0EsQ0E1QkQsRTs7Ozs7Ozs7Ozs7QUNBQWprQixPQUFPb2tCLE9BQVAsQ0FBZSxnQkFBZixFQUFpQyxVQUFTMUssU0FBUyxFQUFsQixFQUFzQkMsU0FBUyxDQUEvQixFQUFrQ3JLLFFBQVEsRUFBMUMsRUFBOEM7QUFDOUUsTUFBSSxDQUFDLEtBQUt4RixNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxxQkFBNUMsQ0FBTCxFQUF5RTtBQUN4RSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUR6WSxRQUFNK04sTUFBTixFQUFjO0FBQ2JwUyxVQUFNbUosTUFBTXdCLEtBQU4sQ0FBWXJHLE1BQVosQ0FETztBQUNjO0FBQzNCd0QsV0FBT3FCLE1BQU13QixLQUFOLENBQVlyRyxNQUFaLENBRk07QUFFZTtBQUM1QjVILFlBQVF5TSxNQUFNd0IsS0FBTixDQUFZckcsTUFBWixDQUhLO0FBR2dCO0FBQzdCOEgsVUFBTWpELE1BQU13QixLQUFOLENBQVlwTSxJQUFaLENBSk87QUFLYjROLFFBQUloRCxNQUFNd0IsS0FBTixDQUFZcE0sSUFBWjtBQUxTLEdBQWQ7QUFRQSxRQUFNWixRQUFRLEVBQWQ7O0FBQ0EsTUFBSXlVLE9BQU9wUyxJQUFYLEVBQWlCO0FBQ2hCckMsVUFBTTBMLEtBQU4sR0FBYyxJQUFJdkssTUFBSixDQUFXc1QsT0FBT3BTLElBQWxCLEVBQXdCLEdBQXhCLENBQWQ7QUFDQTs7QUFDRCxNQUFJb1MsT0FBT3RLLEtBQVgsRUFBa0I7QUFDakJuSyxVQUFNLGNBQU4sSUFBd0J5VSxPQUFPdEssS0FBL0I7QUFDQTs7QUFDRCxNQUFJc0ssT0FBTzFWLE1BQVgsRUFBbUI7QUFDbEIsUUFBSTBWLE9BQU8xVixNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQy9CaUIsWUFBTXFFLElBQU4sR0FBYSxJQUFiO0FBQ0EsS0FGRCxNQUVPO0FBQ05yRSxZQUFNcUUsSUFBTixHQUFhO0FBQUUrTyxpQkFBUztBQUFYLE9BQWI7QUFDQTtBQUNEOztBQUNELE1BQUlxQixPQUFPaEcsSUFBWCxFQUFpQjtBQUNoQnpPLFVBQU1XLEVBQU4sR0FBVztBQUNWOGUsWUFBTWhMLE9BQU9oRztBQURILEtBQVg7QUFHQTs7QUFDRCxNQUFJZ0csT0FBT2pHLEVBQVgsRUFBZTtBQUNkaUcsV0FBT2pHLEVBQVAsQ0FBVWtSLE9BQVYsQ0FBa0JqTCxPQUFPakcsRUFBUCxDQUFVbVIsT0FBVixLQUFzQixDQUF4QztBQUNBbEwsV0FBT2pHLEVBQVAsQ0FBVW9SLFVBQVYsQ0FBcUJuTCxPQUFPakcsRUFBUCxDQUFVcVIsVUFBVixLQUF5QixDQUE5Qzs7QUFFQSxRQUFJLENBQUM3ZixNQUFNVyxFQUFYLEVBQWU7QUFDZFgsWUFBTVcsRUFBTixHQUFXLEVBQVg7QUFDQTs7QUFDRFgsVUFBTVcsRUFBTixDQUFTbWYsSUFBVCxHQUFnQnJMLE9BQU9qRyxFQUF2QjtBQUNBOztBQUVELFFBQU00RixPQUFPLElBQWI7QUFFQSxRQUFNZ0wsU0FBUzNqQixXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JnWCxZQUF4QixDQUFxQ3hVLEtBQXJDLEVBQTRDMFUsTUFBNUMsRUFBb0RySyxLQUFwRCxFQUEyRHVVLGNBQTNELENBQTBFO0FBQ3hGQyxVQUFNbmEsRUFBTixFQUFVb0QsTUFBVixFQUFrQjtBQUNqQnNNLFdBQUt5SyxLQUFMLENBQVcsY0FBWCxFQUEyQm5hLEVBQTNCLEVBQStCb0QsTUFBL0I7QUFDQSxLQUh1Rjs7QUFJeEZnWCxZQUFRcGEsRUFBUixFQUFZb0QsTUFBWixFQUFvQjtBQUNuQnNNLFdBQUswSyxPQUFMLENBQWEsY0FBYixFQUE2QnBhLEVBQTdCLEVBQWlDb0QsTUFBakM7QUFDQSxLQU51Rjs7QUFPeEZpWCxZQUFRcmEsRUFBUixFQUFZO0FBQ1gwUCxXQUFLMkssT0FBTCxDQUFhLGNBQWIsRUFBNkJyYSxFQUE3QjtBQUNBOztBQVR1RixHQUExRSxDQUFmO0FBWUEsT0FBSzRhLEtBQUw7QUFFQSxPQUFLQyxNQUFMLENBQVksTUFBTTtBQUNqQkgsV0FBT0osSUFBUDtBQUNBLEdBRkQ7QUFHQSxDQWpFRCxFOzs7Ozs7Ozs7OztBQ0FBamtCLE9BQU9va0IsT0FBUCxDQUFlLGdCQUFmLEVBQWlDLFlBQVc7QUFDM0MsTUFBSSxDQUFDLEtBQUt0YSxNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxhQUE1QyxDQUFMLEVBQWlFO0FBQ2hFLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQSxHQVAwQyxDQVMzQztBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUVBLFFBQU0vSyxPQUFPLElBQWI7QUFFQSxRQUFNMkwsY0FBY3RrQixXQUFXOEIsTUFBWCxDQUFrQnVaLHdCQUFsQixDQUEyQ2EsZ0JBQTNDLEdBQThEaUgsY0FBOUQsQ0FBNkU7QUFDaEdDLFVBQU1uYSxFQUFOLEVBQVVvRCxNQUFWLEVBQWtCO0FBQ2pCc00sV0FBS3lLLEtBQUwsQ0FBVyxtQkFBWCxFQUFnQ25hLEVBQWhDLEVBQW9Db0QsTUFBcEM7QUFDQSxLQUgrRjs7QUFJaEdnWCxZQUFRcGEsRUFBUixFQUFZb0QsTUFBWixFQUFvQjtBQUNuQnNNLFdBQUswSyxPQUFMLENBQWEsbUJBQWIsRUFBa0NwYSxFQUFsQyxFQUFzQ29ELE1BQXRDO0FBQ0EsS0FOK0Y7O0FBT2hHaVgsWUFBUXJhLEVBQVIsRUFBWTtBQUNYMFAsV0FBSzJLLE9BQUwsQ0FBYSxtQkFBYixFQUFrQ3JhLEVBQWxDO0FBQ0E7O0FBVCtGLEdBQTdFLENBQXBCO0FBWUEsT0FBSzRhLEtBQUw7QUFFQSxPQUFLQyxNQUFMLENBQVksTUFBTTtBQUNqQjtBQUNBUSxnQkFBWWYsSUFBWjtBQUNBLEdBSEQ7QUFJQSxDQTlDRCxFOzs7Ozs7Ozs7OztBQ0FBamtCLE9BQU9va0IsT0FBUCxDQUFlLG1CQUFmLEVBQW9DLFVBQVNuaEIsR0FBVCxFQUFjO0FBQ2pELE1BQUksQ0FBQyxLQUFLNkcsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSSxDQUFDMWpCLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsdUJBQTVDLENBQUwsRUFBMkU7QUFDMUUsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELE1BQUluaEIsUUFBUTRPLFNBQVosRUFBdUI7QUFDdEIsV0FBT25SLFdBQVc4QixNQUFYLENBQWtCZ00sZUFBbEIsQ0FBa0M4TyxRQUFsQyxDQUEyQ3JhLEdBQTNDLENBQVA7QUFDQSxHQUZELE1BRU87QUFDTixXQUFPdkMsV0FBVzhCLE1BQVgsQ0FBa0JnTSxlQUFsQixDQUFrQy9DLElBQWxDLEVBQVA7QUFDQTtBQUNELENBZEQsRTs7Ozs7Ozs7Ozs7QUNBQXpMLE9BQU9va0IsT0FBUCxDQUFlLHlCQUFmLEVBQTBDLFVBQVM7QUFBRTFlLE9BQUs0RTtBQUFQLENBQVQsRUFBMEI7QUFDbkUsTUFBSSxDQUFDLEtBQUtSLE1BQVYsRUFBa0I7QUFDakIsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELE1BQUksQ0FBQzFqQixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0IsS0FBSzhHLE1BQXBDLEVBQTRDLGFBQTVDLENBQUwsRUFBaUU7QUFDaEUsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELFFBQU12aEIsT0FBT25DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DTCxNQUFwQyxDQUFiO0FBRUEsUUFBTXhILE9BQU9wQyxXQUFXOEIsTUFBWCxDQUFrQjRILEtBQWxCLENBQXdCTyxXQUF4QixDQUFvQyxLQUFLYixNQUF6QyxDQUFiOztBQUVBLE1BQUlqSCxLQUFLK0gsU0FBTCxDQUFlQyxPQUFmLENBQXVCL0gsS0FBS2lFLFFBQTVCLE1BQTBDLENBQUMsQ0FBL0MsRUFBa0Q7QUFDakQsV0FBTyxLQUFLZixLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSXZoQixRQUFRQSxLQUFLdEQsQ0FBYixJQUFrQnNELEtBQUt0RCxDQUFMLENBQU8wRCxHQUE3QixFQUFrQztBQUNqQztBQUNBLFdBQU92QyxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J5WCxlQUF4QixDQUF3Q3JYLEtBQUt0RCxDQUFMLENBQU8wRCxHQUEvQyxDQUFQO0FBQ0EsR0FIRCxNQUdPO0FBQ04sV0FBTyxLQUFLc2hCLEtBQUwsRUFBUDtBQUNBO0FBQ0QsQ0F2QkQsRTs7Ozs7Ozs7Ozs7QUNBQSxJQUFJdGUsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYixFQUFtRDtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUFuRCxFQUFvRixDQUFwRjtBQUVyQlMsT0FBT29rQixPQUFQLENBQWUsc0JBQWYsRUFBdUMsVUFBUztBQUFFMWUsT0FBSzRFO0FBQVAsQ0FBVCxFQUEwQjtBQUNoRSxNQUFJLENBQUMsS0FBS1IsTUFBVixFQUFrQjtBQUNqQixXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsTUFBSSxDQUFDMWpCLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsYUFBNUMsQ0FBTCxFQUFpRTtBQUNoRSxXQUFPLEtBQUs5RCxLQUFMLENBQVcsSUFBSWhHLE9BQU9zRCxLQUFYLENBQWlCLHNCQUFqQixFQUF5QyxnQkFBekMsRUFBMkQ7QUFBRThnQixlQUFTO0FBQVgsS0FBM0QsQ0FBWCxDQUFQO0FBQ0E7O0FBRUQsUUFBTXZoQixPQUFPbkMsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCa0ksV0FBeEIsQ0FBb0NMLE1BQXBDLENBQWI7O0FBRUEsTUFBSXpILFFBQVFBLEtBQUt0RCxDQUFiLElBQWtCc0QsS0FBS3RELENBQUwsQ0FBTzBELEdBQTdCLEVBQWtDO0FBQ2pDLFdBQU9nRCxpQkFBaUJxWCxRQUFqQixDQUEwQnphLEtBQUt0RCxDQUFMLENBQU8wRCxHQUFqQyxDQUFQO0FBQ0EsR0FGRCxNQUVPO0FBQ04sV0FBTyxLQUFLc2hCLEtBQUwsRUFBUDtBQUNBO0FBQ0QsQ0FoQkQsRTs7Ozs7Ozs7Ozs7QUNGQXZrQixPQUFPb2tCLE9BQVAsQ0FBZSw2QkFBZixFQUE4QyxVQUFTO0FBQUUxZSxPQUFLNEU7QUFBUCxDQUFULEVBQTBCO0FBQ3ZFLE1BQUksQ0FBQyxLQUFLUixNQUFWLEVBQWtCO0FBQ2pCLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxhQUE1QyxDQUFMLEVBQWlFO0FBQ2hFLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxRQUFNdmhCLE9BQU9uQyxXQUFXOEIsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrSSxXQUF4QixDQUFvQ0wsTUFBcEMsQ0FBYjs7QUFFQSxNQUFJekgsUUFBUUEsS0FBS3RELENBQWIsSUFBa0JzRCxLQUFLdEQsQ0FBTCxDQUFPNEQsS0FBN0IsRUFBb0M7QUFDbkMsV0FBT3pDLFdBQVc4QixNQUFYLENBQWtCb04sbUJBQWxCLENBQXNDdU4sV0FBdEMsQ0FBa0R0YSxLQUFLdEQsQ0FBTCxDQUFPNEQsS0FBekQsQ0FBUDtBQUNBLEdBRkQsTUFFTztBQUNOLFdBQU8sS0FBS29oQixLQUFMLEVBQVA7QUFDQTtBQUNELENBaEJELEU7Ozs7Ozs7Ozs7O0FDQUF2a0IsT0FBT29rQixPQUFQLENBQWUsa0JBQWYsRUFBbUMsWUFBVztBQUM3QyxNQUFJLENBQUMsS0FBS3RhLE1BQVYsRUFBa0I7QUFDakIsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELE1BQUksQ0FBQzFqQixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0IsS0FBSzhHLE1BQXBDLEVBQTRDLGFBQTVDLENBQUwsRUFBaUU7QUFDaEUsV0FBTyxLQUFLOUQsS0FBTCxDQUFXLElBQUloRyxPQUFPc0QsS0FBWCxDQUFpQixzQkFBakIsRUFBeUMsZ0JBQXpDLEVBQTJEO0FBQUU4Z0IsZUFBUztBQUFYLEtBQTNELENBQVgsQ0FBUDtBQUNBOztBQUVELFFBQU1uZixRQUFRO0FBQ2IyVyxZQUFRLEtBQUs5UixNQURBO0FBRWI5RixZQUFRO0FBRkssR0FBZDtBQUtBLFNBQU90RCxXQUFXOEIsTUFBWCxDQUFrQjJCLGVBQWxCLENBQWtDc0gsSUFBbEMsQ0FBdUN4RyxLQUF2QyxDQUFQO0FBQ0EsQ0FmRCxFOzs7Ozs7Ozs7OztBQ0FBakYsT0FBT29rQixPQUFQLENBQWUscUJBQWYsRUFBc0MsWUFBVztBQUNoRCxNQUFJLENBQUMxakIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0QyxhQUE1QyxDQUFMLEVBQWlFO0FBQ2hFLFdBQU8sS0FBSzlELEtBQUwsQ0FBVyxJQUFJaEcsT0FBT3NELEtBQVgsQ0FBaUIsc0JBQWpCLEVBQXlDLGdCQUF6QyxFQUEyRDtBQUFFOGdCLGVBQVM7QUFBWCxLQUEzRCxDQUFYLENBQVA7QUFDQTs7QUFFRCxTQUFPMWpCLFdBQVc4QixNQUFYLENBQWtCK1Usa0JBQWxCLENBQXFDOUwsSUFBckMsRUFBUDtBQUNBLENBTkQsRTs7Ozs7Ozs7Ozs7QUNBQXRNLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSx1Q0FBUixDQUFiO0FBQStERixPQUFPQyxLQUFQLENBQWFDLFFBQVEsb0NBQVIsQ0FBYjtBQUE0REYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLCtCQUFSLENBQWI7QUFBdURGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxpQ0FBUixDQUFiLEU7Ozs7Ozs7Ozs7O0FDQWxMLElBQUlILENBQUo7O0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBbkMsRUFBcUQsQ0FBckQ7QUFFTlMsT0FBT29DLE9BQVAsQ0FBZSxNQUFNO0FBQ3BCLFFBQU1tVyxRQUFRclosRUFBRTRjLEtBQUYsQ0FBUXBiLFdBQVc4QixNQUFYLENBQWtCeWlCLEtBQWxCLENBQXdCeFosSUFBeEIsR0FBK0JDLEtBQS9CLEVBQVIsRUFBZ0QsTUFBaEQsQ0FBZDs7QUFDQSxNQUFJNk0sTUFBTTFOLE9BQU4sQ0FBYyxnQkFBZCxNQUFvQyxDQUFDLENBQXpDLEVBQTRDO0FBQzNDbkssZUFBVzhCLE1BQVgsQ0FBa0J5aUIsS0FBbEIsQ0FBd0JDLGNBQXhCLENBQXVDLGdCQUF2QztBQUNBOztBQUNELE1BQUkzTSxNQUFNMU4sT0FBTixDQUFjLGtCQUFkLE1BQXNDLENBQUMsQ0FBM0MsRUFBOEM7QUFDN0NuSyxlQUFXOEIsTUFBWCxDQUFrQnlpQixLQUFsQixDQUF3QkMsY0FBeEIsQ0FBdUMsa0JBQXZDO0FBQ0E7O0FBQ0QsTUFBSTNNLE1BQU0xTixPQUFOLENBQWMsZ0JBQWQsTUFBb0MsQ0FBQyxDQUF6QyxFQUE0QztBQUMzQ25LLGVBQVc4QixNQUFYLENBQWtCeWlCLEtBQWxCLENBQXdCQyxjQUF4QixDQUF1QyxnQkFBdkM7QUFDQTs7QUFDRCxNQUFJeGtCLFdBQVc4QixNQUFYLElBQXFCOUIsV0FBVzhCLE1BQVgsQ0FBa0IyaUIsV0FBM0MsRUFBd0Q7QUFDdkR6a0IsZUFBVzhCLE1BQVgsQ0FBa0IyaUIsV0FBbEIsQ0FBOEJELGNBQTlCLENBQTZDLGFBQTdDLEVBQTRELENBQUMsZ0JBQUQsRUFBbUIsa0JBQW5CLEVBQXVDLE9BQXZDLENBQTVEO0FBQ0F4a0IsZUFBVzhCLE1BQVgsQ0FBa0IyaUIsV0FBbEIsQ0FBOEJELGNBQTlCLENBQTZDLHVCQUE3QyxFQUFzRSxDQUFDLGtCQUFELEVBQXFCLE9BQXJCLENBQXRFO0FBQ0F4a0IsZUFBVzhCLE1BQVgsQ0FBa0IyaUIsV0FBbEIsQ0FBOEJELGNBQTlCLENBQTZDLHFCQUE3QyxFQUFvRSxDQUFDLGtCQUFELEVBQXFCLE9BQXJCLENBQXBFO0FBQ0F4a0IsZUFBVzhCLE1BQVgsQ0FBa0IyaUIsV0FBbEIsQ0FBOEJELGNBQTlCLENBQTZDLHFCQUE3QyxFQUFvRSxDQUFDLGdCQUFELEVBQW1CLGtCQUFuQixFQUF1QyxPQUF2QyxDQUFwRTtBQUNBeGtCLGVBQVc4QixNQUFYLENBQWtCMmlCLFdBQWxCLENBQThCRCxjQUE5QixDQUE2Qyw0QkFBN0MsRUFBMkUsQ0FBQyxrQkFBRCxFQUFxQixPQUFyQixDQUEzRTtBQUNBeGtCLGVBQVc4QixNQUFYLENBQWtCMmlCLFdBQWxCLENBQThCRCxjQUE5QixDQUE2QyxnQ0FBN0MsRUFBK0UsQ0FBQyxrQkFBRCxDQUEvRTtBQUNBO0FBQ0QsQ0FuQkQsRTs7Ozs7Ozs7Ozs7QUNGQXhrQixXQUFXMGtCLFlBQVgsQ0FBd0JDLFlBQXhCLENBQXFDO0FBQ3BDMWIsTUFBSSxxQkFEZ0M7QUFFcEMyYixVQUFRLElBRjRCO0FBR3BDNWdCLFdBQVM7QUFIMkIsQ0FBckM7QUFNQWhFLFdBQVc4VCxXQUFYLENBQXVCK1EsUUFBdkIsQ0FBZ0Msb0JBQWhDLEVBQXNELFVBQVM3Z0IsT0FBVCxFQUFrQmtRLE1BQWxCLEVBQTBCNFEsUUFBMUIsRUFBb0M7QUFDekYsTUFBSXhsQixPQUFPa2IsUUFBWCxFQUFxQjtBQUNwQnNLLGFBQVNDLE1BQVQsQ0FBZ0JuYyxJQUFoQixDQUFxQixPQUFyQjtBQUNBO0FBQ0QsQ0FKRDtBQU1BNUksV0FBVzhULFdBQVgsQ0FBdUIrUSxRQUF2QixDQUFnQyxrQkFBaEMsRUFBb0QsVUFBUzdnQjtBQUFPO0FBQWhCLEVBQThCO0FBQ2pGLE1BQUkxRSxPQUFPMGxCLFFBQVgsRUFBcUI7QUFDcEIsVUFBTTVpQixPQUFPOUMsT0FBTzhDLElBQVAsRUFBYjtBQUVBcEMsZUFBVzhCLE1BQVgsQ0FBa0J3RyxRQUFsQixDQUEyQnVMLGtDQUEzQixDQUE4RCxTQUE5RCxFQUF5RTdQLFFBQVFnQixHQUFqRixFQUFzRixTQUF0RixFQUFpRzVDLElBQWpHO0FBQ0FwQyxlQUFXaWxCLGFBQVgsQ0FBeUJDLFVBQXpCLENBQW9DbGhCLFFBQVFnQixHQUE1QyxFQUFpRCxlQUFqRCxFQUFrRTtBQUFFekMsV0FBS3lCLFFBQVF6QjtBQUFmLEtBQWxFO0FBRUEsVUFBTVMsV0FBV1osS0FBS1ksUUFBTCxJQUFpQmhELFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLFVBQXhCLENBQWpCLElBQXdELElBQXpFO0FBRUFGLGVBQVc4RyxRQUFYLENBQW9CaUQsU0FBcEIsQ0FBOEI7QUFDN0IzSCxVQUQ2QjtBQUU3QkQsWUFBTW5DLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QmtJLFdBQXhCLENBQW9DakcsUUFBUWdCLEdBQTVDLENBRnVCO0FBRzdCZ0YsZUFBU25ILFFBQVFDLEVBQVIsQ0FBVyxvQkFBWCxFQUFpQztBQUFFQyxhQUFLQztBQUFQLE9BQWpDO0FBSG9CLEtBQTlCO0FBS0ExRCxXQUFPNEUsS0FBUCxDQUFhLE1BQU07QUFDbEJsRSxpQkFBVzhCLE1BQVgsQ0FBa0J3RyxRQUFsQixDQUEyQjZjLGFBQTNCLENBQXlDbmhCLFFBQVF6QixHQUFqRDtBQUNBLEtBRkQ7QUFHQTtBQUNELENBbEJELEU7Ozs7Ozs7Ozs7O0FDWkEsSUFBSTZpQixnQkFBSixFQUFxQkMsY0FBckIsRUFBb0NDLG1CQUFwQyxFQUF3REMsYUFBeEQ7QUFBc0U5bUIsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWIsRUFBOEM7QUFBQ3ltQixtQkFBaUJ2bUIsQ0FBakIsRUFBbUI7QUFBQ3VtQix1QkFBaUJ2bUIsQ0FBakI7QUFBbUIsR0FBeEM7O0FBQXlDd21CLGlCQUFleG1CLENBQWYsRUFBaUI7QUFBQ3dtQixxQkFBZXhtQixDQUFmO0FBQWlCLEdBQTVFOztBQUE2RXltQixzQkFBb0J6bUIsQ0FBcEIsRUFBc0I7QUFBQ3ltQiwwQkFBb0J6bUIsQ0FBcEI7QUFBc0IsR0FBMUg7O0FBQTJIMG1CLGdCQUFjMW1CLENBQWQsRUFBZ0I7QUFBQzBtQixvQkFBYzFtQixDQUFkO0FBQWdCOztBQUE1SixDQUE5QyxFQUE0TSxDQUE1TTs7QUFHdEUsTUFBTTJtQixpQkFBTixTQUFnQ0YsbUJBQWhDLENBQW9EO0FBQ25EL0ssZ0JBQWM7QUFDYixVQUFNO0FBQ0wzVCxZQUFNLE1BREQ7QUFFTDZlLFlBQU07QUFGRCxLQUFOO0FBSUE7O0FBRURyYixTQUFPOEosTUFBUCxFQUFlO0FBQ2R3UixhQUFTLEdBQVQsRUFBY3hSLE9BQU9yUyxJQUFyQjtBQUNBOztBQUVEOGpCLE9BQUtDLEdBQUwsRUFBVTtBQUNULFdBQU87QUFDTi9qQixZQUFNK2pCLElBQUkvakI7QUFESixLQUFQO0FBR0E7O0FBaEJrRDs7QUFtQnBELE1BQU1na0IsZ0JBQU4sU0FBK0JSLGNBQS9CLENBQThDO0FBQzdDOUssZ0JBQWM7QUFDYixVQUFNO0FBQ0x1TCxrQkFBWSxHQURQO0FBRUxwSyxhQUFPLENBRkY7QUFHTDtBQUNBekwsYUFBTyxVQUpGO0FBS0w4VixhQUFPLElBQUlQLGlCQUFKO0FBTEYsS0FBTjtBQVFBLFNBQUtRLGdCQUFMLEdBQXdCO0FBQ3ZCQyxnQkFBVTtBQURhLEtBQXhCO0FBR0E7O0FBRURDLFdBQVNKLFVBQVQsRUFBcUI7QUFDcEIsV0FBT0ssU0FBUzNQLE9BQVQsQ0FBaUI7QUFBQzNVLFlBQU1zWCxTQUFTMk0sVUFBVDtBQUFQLEtBQWpCLENBQVA7QUFDQTs7QUFFRE0sV0FBUzNWLFFBQVQsRUFBbUI7QUFDbEIsUUFBSSxDQUFDQSxTQUFTN0osSUFBZCxFQUFvQjtBQUNuQixhQUFPNkosU0FBU1IsS0FBaEI7QUFDQSxLQUZELE1BRU87QUFDTixhQUFPUSxTQUFTN0osSUFBaEI7QUFDQTtBQUNEOztBQUVEeWYsY0FBWTtBQUNYLFdBQU9ybUIsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0Isa0JBQXhCLEtBQStDRixXQUFXaUMsS0FBWCxDQUFpQnFrQixnQkFBakIsQ0FBa0MsYUFBbEMsQ0FBdEQ7QUFDQTs7QUFFREMsaUJBQWUzYyxNQUFmLEVBQXVCO0FBQ3RCLFVBQU16SCxPQUFPZ2tCLFNBQVMzUCxPQUFULENBQWlCO0FBQUNqVSxXQUFLcUg7QUFBTixLQUFqQixFQUFnQztBQUFDeUMsY0FBUTtBQUFDekQsY0FBTTtBQUFQO0FBQVQsS0FBaEMsQ0FBYjtBQUNBLFdBQU96RyxRQUFRQSxLQUFLeUcsSUFBTCxLQUFjLElBQTdCO0FBQ0E7O0FBRUQ0ZCxnQkFBYzVjLE1BQWQsRUFBc0I7QUFDckIsVUFBTXpILE9BQU9za0IsUUFBUXZtQixHQUFSLENBQWEsV0FBVzBKLE1BQVEsRUFBaEMsQ0FBYjs7QUFDQSxRQUFJekgsSUFBSixFQUFVO0FBQ1QsYUFBT0EsS0FBS3RELENBQUwsSUFBVXNELEtBQUt0RCxDQUFMLENBQU95RSxNQUF4QjtBQUNBOztBQUVELFVBQU1pUyxVQUFVOVIsZ0JBQWdCK1MsT0FBaEIsQ0FBd0I7QUFBRXhSLFdBQUs0RTtBQUFQLEtBQXhCLENBQWhCO0FBQ0EsV0FBTzJMLFdBQVdBLFFBQVExVyxDQUFuQixJQUF3QjBXLFFBQVExVyxDQUFSLENBQVV5RSxNQUF6QztBQUNBOztBQUVEb2pCLHlCQUF1QnZrQixJQUF2QixFQUE2QjBOLE9BQTdCLEVBQXNDO0FBQ3JDLFlBQVFBLE9BQVI7QUFDQyxXQUFLdVYsaUJBQWlCdUIsU0FBdEI7QUFDQyxlQUFPLEtBQVA7O0FBQ0Q7QUFDQyxlQUFPLElBQVA7QUFKRjtBQU1BOztBQUVEQyxZQUFVQyxPQUFWLEVBQW1CO0FBQ2xCLFlBQVFBLE9BQVI7QUFDQyxXQUFLdEIsY0FBY3VCLFlBQW5CO0FBQ0MsZUFBTyx1QkFBUDs7QUFDRCxXQUFLdkIsY0FBY3dCLGFBQW5CO0FBQ0MsZUFBTyx1QkFBUDs7QUFDRDtBQUNDLGVBQU8sRUFBUDtBQU5GO0FBUUE7O0FBaEU0Qzs7QUFtRTlDL21CLFdBQVcyQixTQUFYLENBQXFCZ0IsR0FBckIsQ0FBeUIsSUFBSWtqQixnQkFBSixFQUF6QixFOzs7Ozs7Ozs7OztBQ3pGQXZtQixPQUFPb0MsT0FBUCxDQUFlLFlBQVc7QUFDekIxQixhQUFXQyxRQUFYLENBQW9CK21CLFFBQXBCLENBQTZCLFVBQTdCO0FBRUFobkIsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLGtCQUF4QixFQUE0QyxLQUE1QyxFQUFtRDtBQUFFK0QsVUFBTSxTQUFSO0FBQW1CdWdCLFdBQU8sVUFBMUI7QUFBc0NDLFlBQVE7QUFBOUMsR0FBbkQ7QUFFQWxuQixhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsZ0JBQXhCLEVBQTBDLGFBQTFDLEVBQXlEO0FBQUUrRCxVQUFNLFFBQVI7QUFBa0J1Z0IsV0FBTyxVQUF6QjtBQUFxQ0MsWUFBUTtBQUE3QyxHQUF6RDtBQUNBbG5CLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixzQkFBeEIsRUFBZ0QsU0FBaEQsRUFBMkQ7QUFBRStELFVBQU0sT0FBUjtBQUFpQnVnQixXQUFPLFVBQXhCO0FBQW9DQyxZQUFRO0FBQTVDLEdBQTNEO0FBRUFsbkIsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLCtCQUF4QixFQUF5RCxJQUF6RCxFQUErRDtBQUM5RCtELFVBQU0sU0FEd0Q7QUFFOUR1Z0IsV0FBTyxVQUZ1RDtBQUc5REMsWUFBUSxJQUhzRDtBQUk5REMsYUFBUyxTQUpxRDtBQUs5RG5ULGVBQVc7QUFMbUQsR0FBL0Q7QUFRQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixpQ0FBeEIsRUFBMkQsSUFBM0QsRUFBaUU7QUFDaEUrRCxVQUFNLFNBRDBEO0FBRWhFdWdCLFdBQU8sVUFGeUQ7QUFHaEVDLFlBQVEsSUFId0Q7QUFJaEVDLGFBQVMsU0FKdUQ7QUFLaEVuVCxlQUFXO0FBTHFELEdBQWpFO0FBUUFoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsbUNBQXhCLEVBQTZELEVBQTdELEVBQWlFO0FBQ2hFK0QsVUFBTSxRQUQwRDtBQUVoRXVnQixXQUFPLFVBRnlEO0FBR2hFQyxZQUFRLElBSHdEO0FBSWhFQyxhQUFTLFNBSnVEO0FBS2hFblQsZUFBVztBQUxxRCxHQUFqRTtBQVFBaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxpQkFBbEQsRUFBcUU7QUFDcEUrRCxVQUFNLFFBRDhEO0FBRXBFdWdCLFdBQU8sVUFGNkQ7QUFHcEVDLFlBQVEsSUFINEQ7QUFJcEVDLGFBQVMsU0FKMkQ7QUFLcEVuVCxlQUFXO0FBTHlELEdBQXJFO0FBT0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsOEJBQXhCLEVBQXdELFNBQXhELEVBQW1FO0FBQ2xFK0QsVUFBTSxPQUQ0RDtBQUVsRXVnQixXQUFPLFVBRjJEO0FBR2xFQyxZQUFRLElBSDBEO0FBSWxFQyxhQUFTLFNBSnlEO0FBS2xFblQsZUFBVztBQUx1RCxHQUFuRTtBQU9BaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDBCQUF4QixFQUFvRCx5REFBcEQsRUFBK0c7QUFDOUcrRCxVQUFNLFFBRHdHO0FBRTlHdWdCLFdBQU8sVUFGdUc7QUFHOUdDLFlBQVEsSUFIc0c7QUFJOUdDLGFBQVMsU0FKcUc7QUFLOUduVCxlQUFXLGNBTG1HO0FBTTlHb1QscUJBQWlCO0FBTjZGLEdBQS9HO0FBUUFwbkIsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLHdCQUF4QixFQUFrRCxFQUFsRCxFQUFzRDtBQUNyRCtELFVBQU0sUUFEK0M7QUFFckR1Z0IsV0FBTyxVQUY4QztBQUdyRGpULGVBQVcsd0NBSDBDO0FBSXJEbVQsYUFBUztBQUo0QyxHQUF0RDtBQU1Bbm5CLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixrQ0FBeEIsRUFBNEQsRUFBNUQsRUFBZ0U7QUFDL0QrRCxVQUFNLFFBRHlEO0FBRS9EdWdCLFdBQU8sVUFGd0Q7QUFHL0RDLFlBQVEsSUFIdUQ7QUFJL0RDLGFBQVMsU0FKc0Q7QUFLL0RuVCxlQUFXO0FBTG9ELEdBQWhFO0FBUUFoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsNEJBQXhCLEVBQXNELElBQXRELEVBQTREO0FBQUUrRCxVQUFNLFNBQVI7QUFBbUJ1Z0IsV0FBTyxVQUExQjtBQUFzQ0MsWUFBUSxJQUE5QztBQUFvRGxULGVBQVc7QUFBL0QsR0FBNUQ7QUFDQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixzQ0FBeEIsRUFBZ0UsSUFBaEUsRUFBc0U7QUFBRStELFVBQU0sU0FBUjtBQUFtQnVnQixXQUFPLFVBQTFCO0FBQXNDQyxZQUFRLElBQTlDO0FBQW9EbFQsZUFBVztBQUEvRCxHQUF0RTtBQUNBaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDJCQUF4QixFQUFxRCxJQUFyRCxFQUEyRDtBQUFFK0QsVUFBTSxTQUFSO0FBQW1CdWdCLFdBQU8sVUFBMUI7QUFBc0NDLFlBQVEsSUFBOUM7QUFBb0RsVCxlQUFXO0FBQS9ELEdBQTNEO0FBQ0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0Isc0JBQXhCLEVBQWdELENBQWhELEVBQW1EO0FBQUUrRCxVQUFNLEtBQVI7QUFBZXVnQixXQUFPO0FBQXRCLEdBQW5EO0FBRUFqbkIsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLHFCQUF4QixFQUErQyxDQUEvQyxFQUFrRDtBQUNqRCtELFVBQU0sS0FEMkM7QUFFakR1Z0IsV0FBTyxVQUYwQztBQUdqRGpULGVBQVc7QUFIc0MsR0FBbEQ7QUFNQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3Qiw2QkFBeEIsRUFBdUQsTUFBdkQsRUFBK0Q7QUFDOUQrRCxVQUFNLFFBRHdEO0FBRTlEdWdCLFdBQU8sVUFGdUQ7QUFHOURqVyxZQUFRLENBQ1A7QUFBRWxOLFdBQUssTUFBUDtBQUFla1EsaUJBQVc7QUFBMUIsS0FETyxFQUVQO0FBQUVsUSxXQUFLLFNBQVA7QUFBa0JrUSxpQkFBVztBQUE3QixLQUZPLEVBR1A7QUFBRWxRLFdBQUssT0FBUDtBQUFnQmtRLGlCQUFXO0FBQTNCLEtBSE8sQ0FIc0Q7QUFROURBLGVBQVc7QUFSbUQsR0FBL0Q7QUFXQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixxQ0FBeEIsRUFBK0QsRUFBL0QsRUFBbUU7QUFDbEUrRCxVQUFNLEtBRDREO0FBRWxFdWdCLFdBQU8sVUFGMkQ7QUFHbEVJLGlCQUFhO0FBQUU5a0IsV0FBSyw2QkFBUDtBQUFzQ3dCLGFBQU87QUFBRTZULGFBQUs7QUFBUDtBQUE3QyxLQUhxRDtBQUlsRTVELGVBQVcsMkNBSnVEO0FBS2xFb1QscUJBQWlCO0FBTGlELEdBQW5FO0FBUUFwbkIsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDhCQUF4QixFQUF3RCxFQUF4RCxFQUE0RDtBQUMzRCtELFVBQU0sUUFEcUQ7QUFFM0R1Z0IsV0FBTyxVQUZvRDtBQUczREksaUJBQWE7QUFBRTlrQixXQUFLLDZCQUFQO0FBQXNDd0IsYUFBTztBQUE3QyxLQUg4QztBQUkzRGlRLGVBQVc7QUFKZ0QsR0FBNUQ7QUFPQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixxQkFBeEIsRUFBK0MsS0FBL0MsRUFBc0Q7QUFDckQrRCxVQUFNLFFBRCtDO0FBRXJEdWdCLFdBQU8sVUFGOEM7QUFHckRFLGFBQVMsaUJBSDRDO0FBSXJEblQsZUFBVztBQUowQyxHQUF0RDtBQU9BaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLHVCQUF4QixFQUFpRCxLQUFqRCxFQUF3RDtBQUN2RCtELFVBQU0sUUFEaUQ7QUFFdkR1Z0IsV0FBTyxVQUZnRDtBQUd2REUsYUFBUyxpQkFIOEM7QUFJdkRuVCxlQUFXO0FBSjRDLEdBQXhEO0FBT0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsMkJBQXhCLEVBQXFELEtBQXJELEVBQTREO0FBQzNEK0QsVUFBTSxTQURxRDtBQUUzRHVnQixXQUFPLFVBRm9EO0FBRzNERSxhQUFTLGlCQUhrRDtBQUkzRG5ULGVBQVc7QUFKZ0QsR0FBNUQ7QUFPQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixpQ0FBeEIsRUFBMkQsS0FBM0QsRUFBa0U7QUFDakUrRCxVQUFNLFNBRDJEO0FBRWpFdWdCLFdBQU8sVUFGMEQ7QUFHakVFLGFBQVMsaUJBSHdEO0FBSWpFblQsZUFBVztBQUpzRCxHQUFsRTtBQU9BaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDZCQUF4QixFQUF1RCxLQUF2RCxFQUE4RDtBQUM3RCtELFVBQU0sU0FEdUQ7QUFFN0R1Z0IsV0FBTyxVQUZzRDtBQUc3REUsYUFBUyxpQkFIb0Q7QUFJN0RuVCxlQUFXO0FBSmtELEdBQTlEO0FBT0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsMkJBQXhCLEVBQXFELG1EQUFyRCxFQUEwRztBQUN6RytELFVBQU0sUUFEbUc7QUFFekd1Z0IsV0FBTyxVQUZrRztBQUd6R0UsYUFBUyxpQkFIZ0c7QUFJekduVCxlQUFXO0FBSjhGLEdBQTFHO0FBT0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsMkJBQXhCLEVBQXFELHdKQUFyRCxFQUErTTtBQUM5TStELFVBQU0sUUFEd007QUFFOU11Z0IsV0FBTyxVQUZ1TTtBQUc5TUUsYUFBUyxpQkFIcU07QUFJOU1uVCxlQUFXO0FBSm1NLEdBQS9NO0FBT0FoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsNEJBQXhCLEVBQXNELEtBQXRELEVBQTZEO0FBQzVEK0QsVUFBTSxTQURzRDtBQUU1RHVnQixXQUFPLFVBRnFEO0FBRzVERSxhQUFTLGdCQUhtRDtBQUk1REQsWUFBUSxJQUpvRDtBQUs1RGxULGVBQVc7QUFMaUQsR0FBN0Q7QUFRQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3Qiw4QkFBeEIsRUFBd0QsRUFBeEQsRUFBNEQ7QUFDM0QrRCxVQUFNLFFBRHFEO0FBRTNEdWdCLFdBQU8sVUFGb0Q7QUFHM0RFLGFBQVMsZ0JBSGtEO0FBSTNERCxZQUFRLElBSm1EO0FBSzNEbFQsZUFBVztBQUxnRCxHQUE1RDtBQVFBaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLG1DQUF4QixFQUE2RCxJQUE3RCxFQUFtRTtBQUNsRStELFVBQU0sUUFENEQ7QUFFbEV1Z0IsV0FBTyxVQUYyRDtBQUdsRUUsYUFBUyxnQkFIeUQ7QUFJbEVELFlBQVEsSUFKMEQ7QUFLbEVsVCxlQUFXO0FBTHVELEdBQW5FO0FBUUFoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsK0JBQXhCLEVBQXlELEtBQXpELEVBQWdFO0FBQy9EK0QsVUFBTSxRQUR5RDtBQUUvRHVnQixXQUFPLFVBRndEO0FBRy9EalQsZUFBVyxnQ0FIb0Q7QUFJL0RoRCxZQUFRLENBQ1A7QUFBRWxOLFdBQUssS0FBUDtBQUFja1EsaUJBQVc7QUFBekIsS0FETyxFQUVQO0FBQUVsUSxXQUFLLE9BQVA7QUFBZ0JrUSxpQkFBVztBQUEzQixLQUZPO0FBSnVELEdBQWhFO0FBVUFoVSxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsOEJBQXhCLEVBQXdELEtBQXhELEVBQStEO0FBQzlEK0QsVUFBTSxTQUR3RDtBQUU5RHVnQixXQUFPLFVBRnVEO0FBRzlEQyxZQUFRLElBSHNEO0FBSTlEbFQsZUFBVztBQUptRCxHQUEvRDtBQU9BaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDRCQUF4QixFQUFzRCxLQUF0RCxFQUE2RDtBQUM1RCtELFVBQU0sU0FEc0Q7QUFFNUR1Z0IsV0FBTyxVQUZxRDtBQUc1REMsWUFBUSxJQUhvRDtBQUk1RGxULGVBQVcsbUJBSmlEO0FBSzVEb1QscUJBQWlCLHdEQUwyQztBQU01REMsaUJBQWE7QUFBRTlrQixXQUFLLGVBQVA7QUFBd0J3QixhQUFPO0FBQS9CO0FBTitDLEdBQTdEO0FBU0EvRCxhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsNEJBQXhCLEVBQXNELEtBQXRELEVBQTZEO0FBQzVEK0QsVUFBTSxTQURzRDtBQUU1RHVnQixXQUFPLFVBRnFEO0FBRzVEQyxZQUFRLElBSG9EO0FBSTVEbFQsZUFBVztBQUppRCxHQUE3RDtBQU9BaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDZCQUF4QixFQUF1RCw2Q0FBdkQsRUFBc0c7QUFDckcrRCxVQUFNLFFBRCtGO0FBRXJHdWdCLFdBQU8sVUFGOEY7QUFHckdDLFlBQVEsSUFINkY7QUFJckdsVCxlQUFXLG9CQUowRjtBQUtyR3FULGlCQUFhO0FBQUU5a0IsV0FBSyw0QkFBUDtBQUFxQ3dCLGFBQU87QUFBNUM7QUFMd0YsR0FBdEc7QUFRQS9ELGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3Qix3Q0FBeEIsRUFBa0UsS0FBbEUsRUFBeUU7QUFDeEUrRCxVQUFNLFNBRGtFO0FBRXhFdWdCLFdBQU8sVUFGaUU7QUFHeEVDLFlBQVEsSUFIZ0U7QUFJeEVsVCxlQUFXLHdDQUo2RDtBQUt4RXFULGlCQUFhO0FBQUU5a0IsV0FBSyx5QkFBUDtBQUFrQ3dCLGFBQU87QUFBekM7QUFMMkQsR0FBekU7QUFRQS9ELGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3Qiw2QkFBeEIsRUFBdUQsRUFBdkQsRUFBMkQ7QUFDMUQrRCxVQUFNLFFBRG9EO0FBRTFEdWdCLFdBQU8sVUFGbUQ7QUFHMURDLFlBQVEsSUFIa0Q7QUFJMURsVCxlQUFXLDZCQUorQztBQUsxRG9ULHFCQUFpQjtBQUx5QyxHQUEzRDtBQVFBcG5CLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QiwyQkFBeEIsRUFBcUQsS0FBckQsRUFBNEQ7QUFDM0QrRCxVQUFNLFNBRHFEO0FBRTNEdWdCLFdBQU8sVUFGb0Q7QUFHM0RFLGFBQVM7QUFIa0QsR0FBNUQ7QUFNQW5uQixhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsMkJBQXhCLEVBQXFELEVBQXJELEVBQXlEO0FBQ3hEK0QsVUFBTSxRQURrRDtBQUV4RHVnQixXQUFPLFVBRmlEO0FBR3hERSxhQUFTLFVBSCtDO0FBSXhEQyxxQkFBaUI7QUFKdUMsR0FBekQ7QUFPQXBuQixhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsOEJBQXhCLEVBQXdELEVBQXhELEVBQTREO0FBQzNEK0QsVUFBTSxRQURxRDtBQUUzRHVnQixXQUFPLFVBRm9EO0FBRzNERSxhQUFTLFVBSGtEO0FBSTNEQyxxQkFBaUI7QUFKMEMsR0FBNUQ7QUFPQXBuQixhQUFXQyxRQUFYLENBQW9CMEMsR0FBcEIsQ0FBd0IsMEJBQXhCLEVBQW9ELEVBQXBELEVBQXdEO0FBQ3ZEK0QsVUFBTSxRQURpRDtBQUV2RHVnQixXQUFPLFVBRmdEO0FBR3ZEQyxZQUFRLEtBSCtDO0FBSXZEQyxhQUFTLFlBSjhDO0FBS3ZEblQsZUFBVztBQUw0QyxHQUF4RDtBQVFBaFUsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLHlCQUF4QixFQUFtRCxjQUFuRCxFQUFtRTtBQUNsRStELFVBQU0sUUFENEQ7QUFFbEV1Z0IsV0FBTyxVQUYyRDtBQUdsRUMsWUFBUSxJQUgwRDtBQUlsRUMsYUFBUyxTQUp5RDtBQUtsRW5XLFlBQVEsQ0FDUDtBQUFDbE4sV0FBSyxVQUFOO0FBQWtCa1EsaUJBQVc7QUFBN0IsS0FETyxFQUVQO0FBQUNsUSxXQUFLLGNBQU47QUFBc0JrUSxpQkFBVztBQUFqQyxLQUZPLEVBR1A7QUFBQ2xRLFdBQUssWUFBTjtBQUFvQmtRLGlCQUFXO0FBQS9CLEtBSE87QUFMMEQsR0FBbkU7QUFZQWhVLGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QixvQ0FBeEIsRUFBOEQsS0FBOUQsRUFBcUU7QUFDcEUrRCxVQUFNLFNBRDhEO0FBRXBFdWdCLFdBQU8sVUFGNkQ7QUFHcEVFLGFBQVMsU0FIMkQ7QUFJcEVuVCxlQUFXLDhCQUp5RDtBQUtwRW9ULHFCQUFpQixzRUFMbUQ7QUFNcEVDLGlCQUFhO0FBQUU5a0IsV0FBSyx5QkFBUDtBQUFrQ3dCLGFBQU87QUFBekM7QUFOdUQsR0FBckU7QUFTQS9ELGFBQVdDLFFBQVgsQ0FBb0IwQyxHQUFwQixDQUF3QiwrQkFBeEIsRUFBeUQsS0FBekQsRUFBZ0U7QUFDL0QrRCxVQUFNLFNBRHlEO0FBRS9EdWdCLFdBQU8sVUFGd0Q7QUFHL0RDLFlBQVEsSUFIdUQ7QUFJL0RDLGFBQVMsU0FKc0Q7QUFLL0RuVCxlQUFXLCtCQUxvRDtBQU0vRHFULGlCQUFhO0FBQUU5a0IsV0FBSyx5QkFBUDtBQUFrQ3dCLGFBQU87QUFBRTZULGFBQUs7QUFBUDtBQUF6QztBQU5rRCxHQUFoRTtBQVNBNVgsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLDZCQUF4QixFQUF1RCxFQUF2RCxFQUEyRDtBQUMxRCtELFVBQU0sUUFEb0Q7QUFFMUR1Z0IsV0FBTyxVQUZtRDtBQUcxREMsWUFBUSxLQUhrRDtBQUkxREMsYUFBUyxTQUppRDtBQUsxRG5ULGVBQVcsNEJBTCtDO0FBTTFEb1QscUJBQWlCLHdDQU55QztBQU8xREMsaUJBQWE7QUFBRTlrQixXQUFLLHlCQUFQO0FBQWtDd0IsYUFBTztBQUF6QztBQVA2QyxHQUEzRDtBQVVBL0QsYUFBV0MsUUFBWCxDQUFvQjBDLEdBQXBCLENBQXdCLCtCQUF4QixFQUF5RCxFQUF6RCxFQUE2RDtBQUM1RCtELFVBQU0sUUFEc0Q7QUFFNUR1Z0IsV0FBTyxVQUZxRDtBQUc1REMsWUFBUSxLQUhvRDtBQUk1REMsYUFBUyxTQUptRDtBQUs1RG5ULGVBQVcsY0FMaUQ7QUFNNURxVCxpQkFBYTtBQUFFOWtCLFdBQUsseUJBQVA7QUFBa0N3QixhQUFPO0FBQXpDO0FBTitDLEdBQTdEO0FBUUEsQ0F2VEQsRTs7Ozs7Ozs7Ozs7QUNBQS9ELFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCQyxRQUFsQixDQUEyQixxQkFBM0IsRUFBa0Q7QUFBRUMsZ0JBQWM7QUFBaEIsQ0FBbEQsRUFBMEU7QUFDekV2bkIsUUFBTTtBQUNMLFFBQUksQ0FBQ0YsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFFRCxXQUFPMW5CLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCL2MsT0FBbEIsQ0FBMEI7QUFDaENtQixtQkFBYTNMLFdBQVc4QixNQUFYLENBQWtCb00sa0JBQWxCLENBQXFDbkQsSUFBckMsR0FBNENDLEtBQTVDO0FBRG1CLEtBQTFCLENBQVA7QUFHQSxHQVR3RTs7QUFVekUzRyxTQUFPO0FBQ04sUUFBSSxDQUFDckUsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFFRCxRQUFJO0FBQ0h6YyxZQUFNLEtBQUswYyxVQUFYLEVBQXVCO0FBQ3RCdlosb0JBQVl4RyxNQURVO0FBRXRCc1QsZ0JBQVF2SjtBQUZjLE9BQXZCO0FBS0EsWUFBTXZELGFBQWFwTyxXQUFXOEcsUUFBWCxDQUFvQnlKLGNBQXBCLENBQW1DLElBQW5DLEVBQXlDLEtBQUtvWCxVQUFMLENBQWdCdlosVUFBekQsRUFBcUUsS0FBS3VaLFVBQUwsQ0FBZ0J6TSxNQUFyRixDQUFuQjs7QUFFQSxVQUFJOU0sVUFBSixFQUFnQjtBQUNmLGVBQU9wTyxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQi9jLE9BQWxCLENBQTBCO0FBQ2hDNEQsb0JBRGdDO0FBRWhDOE0sa0JBQVFsYixXQUFXOEIsTUFBWCxDQUFrQnVaLHdCQUFsQixDQUEyQ3RRLElBQTNDLENBQWdEO0FBQUVzSiwwQkFBY2pHLFdBQVc3TDtBQUEzQixXQUFoRCxFQUFrRnlJLEtBQWxGO0FBRndCLFNBQTFCLENBQVA7QUFJQTs7QUFFRGhMLGlCQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkssT0FBbEI7QUFDQSxLQWhCRCxDQWdCRSxPQUFPeGlCLENBQVAsRUFBVTtBQUNYLGFBQU9wRixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkssT0FBbEIsQ0FBMEJ4aUIsQ0FBMUIsQ0FBUDtBQUNBO0FBQ0Q7O0FBbEN3RSxDQUExRTtBQXFDQXBGLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCQyxRQUFsQixDQUEyQiwwQkFBM0IsRUFBdUQ7QUFBRUMsZ0JBQWM7QUFBaEIsQ0FBdkQsRUFBK0U7QUFDOUV2bkIsUUFBTTtBQUNMLFFBQUksQ0FBQ0YsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFFRCxRQUFJO0FBQ0h6YyxZQUFNLEtBQUs0YyxTQUFYLEVBQXNCO0FBQ3JCdGxCLGFBQUsySTtBQURnQixPQUF0QjtBQUlBLGFBQU9sTCxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQi9jLE9BQWxCLENBQTBCO0FBQ2hDNEQsb0JBQVlwTyxXQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ2pFLFdBQXJDLENBQWlELEtBQUs0ZCxTQUFMLENBQWV0bEIsR0FBaEUsQ0FEb0I7QUFFaEMyWSxnQkFBUWxiLFdBQVc4QixNQUFYLENBQWtCdVosd0JBQWxCLENBQTJDdFEsSUFBM0MsQ0FBZ0Q7QUFBRXNKLHdCQUFjLEtBQUt3VCxTQUFMLENBQWV0bEI7QUFBL0IsU0FBaEQsRUFBc0Z5SSxLQUF0RjtBQUZ3QixPQUExQixDQUFQO0FBSUEsS0FURCxDQVNFLE9BQU81RixDQUFQLEVBQVU7QUFDWCxhQUFPcEYsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JLLE9BQWxCLENBQTBCeGlCLEVBQUVFLEtBQTVCLENBQVA7QUFDQTtBQUNELEdBbEI2RTs7QUFtQjlFd2lCLFFBQU07QUFDTCxRQUFJLENBQUM5bkIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFFRCxRQUFJO0FBQ0h6YyxZQUFNLEtBQUs0YyxTQUFYLEVBQXNCO0FBQ3JCdGxCLGFBQUsySTtBQURnQixPQUF0QjtBQUlBRCxZQUFNLEtBQUswYyxVQUFYLEVBQXVCO0FBQ3RCdlosb0JBQVl4RyxNQURVO0FBRXRCc1QsZ0JBQVF2SjtBQUZjLE9BQXZCOztBQUtBLFVBQUkzUixXQUFXOEcsUUFBWCxDQUFvQnlKLGNBQXBCLENBQW1DLEtBQUtzWCxTQUFMLENBQWV0bEIsR0FBbEQsRUFBdUQsS0FBS29sQixVQUFMLENBQWdCdlosVUFBdkUsRUFBbUYsS0FBS3VaLFVBQUwsQ0FBZ0J6TSxNQUFuRyxDQUFKLEVBQWdIO0FBQy9HLGVBQU9sYixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQi9jLE9BQWxCLENBQTBCO0FBQ2hDNEQsc0JBQVlwTyxXQUFXOEIsTUFBWCxDQUFrQm9NLGtCQUFsQixDQUFxQ2pFLFdBQXJDLENBQWlELEtBQUs0ZCxTQUFMLENBQWV0bEIsR0FBaEUsQ0FEb0I7QUFFaEMyWSxrQkFBUWxiLFdBQVc4QixNQUFYLENBQWtCdVosd0JBQWxCLENBQTJDdFEsSUFBM0MsQ0FBZ0Q7QUFBRXNKLDBCQUFjLEtBQUt3VCxTQUFMLENBQWV0bEI7QUFBL0IsV0FBaEQsRUFBc0Z5SSxLQUF0RjtBQUZ3QixTQUExQixDQUFQO0FBSUE7O0FBRUQsYUFBT2hMLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCSyxPQUFsQixFQUFQO0FBQ0EsS0FsQkQsQ0FrQkUsT0FBT3hpQixDQUFQLEVBQVU7QUFDWCxhQUFPcEYsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JLLE9BQWxCLENBQTBCeGlCLEVBQUVFLEtBQTVCLENBQVA7QUFDQTtBQUNELEdBN0M2RTs7QUE4QzlFeWlCLFdBQVM7QUFDUixRQUFJLENBQUMvbkIsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFFRCxRQUFJO0FBQ0h6YyxZQUFNLEtBQUs0YyxTQUFYLEVBQXNCO0FBQ3JCdGxCLGFBQUsySTtBQURnQixPQUF0Qjs7QUFJQSxVQUFJbEwsV0FBVzhHLFFBQVgsQ0FBb0J5SSxnQkFBcEIsQ0FBcUMsS0FBS3NZLFNBQUwsQ0FBZXRsQixHQUFwRCxDQUFKLEVBQThEO0FBQzdELGVBQU92QyxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQi9jLE9BQWxCLEVBQVA7QUFDQTs7QUFFRCxhQUFPeEssV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JLLE9BQWxCLEVBQVA7QUFDQSxLQVZELENBVUUsT0FBT3hpQixDQUFQLEVBQVU7QUFDWCxhQUFPcEYsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JLLE9BQWxCLENBQTBCeGlCLEVBQUVFLEtBQTVCLENBQVA7QUFDQTtBQUNEOztBQWhFNkUsQ0FBL0UsRTs7Ozs7Ozs7Ozs7QUNyQ0EsSUFBSTBpQixNQUFKO0FBQVd2cEIsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFFBQVIsQ0FBYixFQUErQjtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ21wQixhQUFPbnBCLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFBeUQsSUFBSTBHLGdCQUFKO0FBQXFCOUcsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHlDQUFSLENBQWIsRUFBZ0U7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUMwRyx1QkFBaUIxRyxDQUFqQjtBQUFtQjs7QUFBL0IsQ0FBaEUsRUFBaUcsQ0FBakc7O0FBSXpGOzs7Ozs7Ozs7Ozs7O0FBYUFtQixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkMsUUFBbEIsQ0FBMkIsbUJBQTNCLEVBQWdEO0FBQy9DbmpCLFNBQU87QUFDTixRQUFJLENBQUMsS0FBS3NqQixVQUFMLENBQWdCemUsSUFBakIsSUFBeUIsQ0FBQyxLQUFLeWUsVUFBTCxDQUFnQk0sV0FBOUMsRUFBMkQ7QUFDMUQsYUFBTztBQUNOemQsaUJBQVM7QUFESCxPQUFQO0FBR0E7O0FBRUQsUUFBSSxDQUFDLEtBQUswZCxPQUFMLENBQWEvbkIsT0FBYixDQUFxQixpQkFBckIsQ0FBTCxFQUE4QztBQUM3QyxhQUFPO0FBQ05xSyxpQkFBUztBQURILE9BQVA7QUFHQTs7QUFFRCxRQUFJLENBQUN4SyxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QiwyQkFBeEIsQ0FBTCxFQUEyRDtBQUMxRCxhQUFPO0FBQ05zSyxpQkFBUyxLQURIO0FBRU5sRixlQUFPO0FBRkQsT0FBUDtBQUlBLEtBbEJLLENBb0JOOzs7QUFDQSxVQUFNNmlCLFlBQVlILE9BQU9JLFVBQVAsQ0FBa0IsTUFBbEIsRUFBMEJwb0IsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsOEJBQXhCLENBQTFCLEVBQW1GdVgsTUFBbkYsQ0FBMEZuVyxLQUFLQyxTQUFMLENBQWUsS0FBSzJtQixPQUFMLENBQWFHLElBQTVCLENBQTFGLEVBQTZIQyxNQUE3SCxDQUFvSSxLQUFwSSxDQUFsQjs7QUFDQSxRQUFJLEtBQUtKLE9BQUwsQ0FBYS9uQixPQUFiLENBQXFCLGlCQUFyQixNQUE2QyxRQUFRZ29CLFNBQVcsRUFBcEUsRUFBdUU7QUFDdEUsYUFBTztBQUNOM2QsaUJBQVMsS0FESDtBQUVObEYsZUFBTztBQUZELE9BQVA7QUFJQTs7QUFFRCxVQUFNMk0sY0FBYztBQUNuQmpPLGVBQVM7QUFDUnpCLGFBQUssS0FBS29sQixVQUFMLENBQWdCWTtBQURiLE9BRFU7QUFJbkIvSSxnQkFBVTtBQUNUMVcsa0JBQVU7QUFDVEUsZ0JBQU0sS0FBSzJlLFVBQUwsQ0FBZ0IzZTtBQURiO0FBREQ7QUFKUyxLQUFwQjtBQVVBLFFBQUl4RixVQUFVK0IsaUJBQWlCdUUsaUJBQWpCLENBQW1DLEtBQUs2ZCxVQUFMLENBQWdCbGxCLEtBQW5ELENBQWQ7O0FBQ0EsUUFBSWUsT0FBSixFQUFhO0FBQ1osWUFBTWdsQixRQUFReG9CLFdBQVc4QixNQUFYLENBQWtCQyxLQUFsQixDQUF3QnFLLHNCQUF4QixDQUErQzVJLFFBQVFmLEtBQXZELEVBQThEdUksS0FBOUQsRUFBZDs7QUFDQSxVQUFJd2QsU0FBU0EsTUFBTWpjLE1BQU4sR0FBZSxDQUE1QixFQUErQjtBQUM5QjBGLG9CQUFZak8sT0FBWixDQUFvQmdCLEdBQXBCLEdBQTBCd2pCLE1BQU0sQ0FBTixFQUFTam1CLEdBQW5DO0FBQ0EsT0FGRCxNQUVPO0FBQ04wUCxvQkFBWWpPLE9BQVosQ0FBb0JnQixHQUFwQixHQUEwQjBPLE9BQU96SyxFQUFQLEVBQTFCO0FBQ0E7O0FBQ0RnSixrQkFBWWpPLE9BQVosQ0FBb0J2QixLQUFwQixHQUE0QmUsUUFBUWYsS0FBcEM7QUFDQSxLQVJELE1BUU87QUFDTndQLGtCQUFZak8sT0FBWixDQUFvQmdCLEdBQXBCLEdBQTBCME8sT0FBT3pLLEVBQVAsRUFBMUI7QUFDQWdKLGtCQUFZak8sT0FBWixDQUFvQnZCLEtBQXBCLEdBQTRCLEtBQUtrbEIsVUFBTCxDQUFnQmxsQixLQUE1QztBQUVBLFlBQU0yRyxTQUFTcEosV0FBVzhHLFFBQVgsQ0FBb0JtSSxhQUFwQixDQUFrQztBQUNoRHhNLGVBQU93UCxZQUFZak8sT0FBWixDQUFvQnZCLEtBRHFCO0FBRWhEbUUsY0FBTyxHQUFHLEtBQUsrZ0IsVUFBTCxDQUFnQmMsVUFBWSxJQUFJLEtBQUtkLFVBQUwsQ0FBZ0JlLFNBQVc7QUFGckIsT0FBbEMsQ0FBZjtBQUtBbGxCLGdCQUFVeEQsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3Qk8sV0FBeEIsQ0FBb0NiLE1BQXBDLENBQVY7QUFDQTs7QUFFRDZJLGdCQUFZak8sT0FBWixDQUFvQlEsR0FBcEIsR0FBMEIsS0FBS21qQixVQUFMLENBQWdCemUsSUFBMUM7QUFDQStJLGdCQUFZRCxLQUFaLEdBQW9CeE8sT0FBcEI7O0FBRUEsUUFBSTtBQUNILGFBQU87QUFDTm1sQixnQkFBUSxJQURGO0FBRU4za0IsaUJBQVNoRSxXQUFXOEcsUUFBWCxDQUFvQm1MLFdBQXBCLENBQWdDQSxXQUFoQztBQUZILE9BQVA7QUFJQSxLQUxELENBS0UsT0FBTzdNLENBQVAsRUFBVTtBQUNYOEMsY0FBUTVDLEtBQVIsQ0FBYyx5QkFBZCxFQUF5Q0YsQ0FBekM7QUFDQTtBQUNEOztBQXhFOEMsQ0FBaEQsRTs7Ozs7Ozs7Ozs7QUNqQkEsSUFBSUcsZ0JBQUo7QUFBcUI5RyxPQUFPQyxLQUFQLENBQWFDLFFBQVEseUNBQVIsQ0FBYixFQUFnRTtBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQzBHLHVCQUFpQjFHLENBQWpCO0FBQW1COztBQUEvQixDQUFoRSxFQUFpRyxDQUFqRztBQUVyQm1CLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCQyxRQUFsQixDQUEyQixnQ0FBM0IsRUFBNkQ7QUFDNURuakIsU0FBTztBQUNOLFVBQU1xZSxhQUFhMWlCLFdBQVd3aUIsR0FBWCxDQUFlRyxVQUFmLENBQTBCLEtBQUtrRixTQUFMLENBQWVlLE9BQXpDLENBQW5CO0FBRUEsVUFBTW5HLE1BQU1DLFdBQVc5aUIsS0FBWCxDQUFpQixLQUFLK25CLFVBQXRCLENBQVo7QUFFQSxRQUFJbmtCLFVBQVUrQixpQkFBaUJvWSxxQkFBakIsQ0FBdUM4RSxJQUFJelAsSUFBM0MsQ0FBZDtBQUVBLFVBQU1mLGNBQWM7QUFDbkJqTyxlQUFTO0FBQ1J6QixhQUFLbVIsT0FBT3pLLEVBQVA7QUFERyxPQURVO0FBSW5CdVcsZ0JBQVU7QUFDVGlELGFBQUs7QUFDSnpQLGdCQUFNeVAsSUFBSTFQO0FBRE47QUFESTtBQUpTLEtBQXBCOztBQVdBLFFBQUl2UCxPQUFKLEVBQWE7QUFDWixZQUFNZ2xCLFFBQVF4b0IsV0FBVzhCLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcUssc0JBQXhCLENBQStDNUksUUFBUWYsS0FBdkQsRUFBOER1SSxLQUE5RCxFQUFkOztBQUVBLFVBQUl3ZCxTQUFTQSxNQUFNamMsTUFBTixHQUFlLENBQTVCLEVBQStCO0FBQzlCMEYsb0JBQVlqTyxPQUFaLENBQW9CZ0IsR0FBcEIsR0FBMEJ3akIsTUFBTSxDQUFOLEVBQVNqbUIsR0FBbkM7QUFDQSxPQUZELE1BRU87QUFDTjBQLG9CQUFZak8sT0FBWixDQUFvQmdCLEdBQXBCLEdBQTBCME8sT0FBT3pLLEVBQVAsRUFBMUI7QUFDQTs7QUFDRGdKLGtCQUFZak8sT0FBWixDQUFvQnZCLEtBQXBCLEdBQTRCZSxRQUFRZixLQUFwQztBQUNBLEtBVEQsTUFTTztBQUNOd1Asa0JBQVlqTyxPQUFaLENBQW9CZ0IsR0FBcEIsR0FBMEIwTyxPQUFPekssRUFBUCxFQUExQjtBQUNBZ0osa0JBQVlqTyxPQUFaLENBQW9CdkIsS0FBcEIsR0FBNEJpUixPQUFPekssRUFBUCxFQUE1QjtBQUVBLFlBQU13USxZQUFZelosV0FBVzhHLFFBQVgsQ0FBb0JtSSxhQUFwQixDQUFrQztBQUNuRDVJLGtCQUFVb2MsSUFBSXpQLElBQUosQ0FBU1gsT0FBVCxDQUFpQixTQUFqQixFQUE0QixFQUE1QixDQUR5QztBQUVuRDVQLGVBQU93UCxZQUFZak8sT0FBWixDQUFvQnZCLEtBRndCO0FBR25EZ0YsZUFBTztBQUNONFksa0JBQVFvQyxJQUFJelA7QUFETjtBQUg0QyxPQUFsQyxDQUFsQjtBQVFBeFAsZ0JBQVUrQixpQkFBaUIwRSxXQUFqQixDQUE2QndQLFNBQTdCLENBQVY7QUFDQTs7QUFFRHhILGdCQUFZak8sT0FBWixDQUFvQlEsR0FBcEIsR0FBMEJpZSxJQUFJNEYsSUFBOUI7QUFDQXBXLGdCQUFZRCxLQUFaLEdBQW9CeE8sT0FBcEI7O0FBRUEsUUFBSTtBQUNILFlBQU1RLFVBQVUwZSxXQUFXdmUsUUFBWCxDQUFvQjhELElBQXBCLENBQXlCLElBQXpCLEVBQStCakksV0FBVzhHLFFBQVgsQ0FBb0JtTCxXQUFwQixDQUFnQ0EsV0FBaEMsQ0FBL0IsQ0FBaEI7QUFFQTNTLGFBQU80RSxLQUFQLENBQWEsTUFBTTtBQUNsQixZQUFJdWUsSUFBSW9HLEtBQVIsRUFBZTtBQUNkLGNBQUlwRyxJQUFJb0csS0FBSixDQUFVQyxXQUFkLEVBQTJCO0FBQzFCeHBCLG1CQUFPMkksSUFBUCxDQUFZLHlCQUFaLEVBQXVDZ0ssWUFBWWpPLE9BQVosQ0FBb0J2QixLQUEzRCxFQUFrRSxTQUFsRSxFQUE2RWdnQixJQUFJb0csS0FBSixDQUFVQyxXQUF2RjtBQUNBOztBQUNELGNBQUlyRyxJQUFJb0csS0FBSixDQUFVRSxTQUFkLEVBQXlCO0FBQ3hCenBCLG1CQUFPMkksSUFBUCxDQUFZLHlCQUFaLEVBQXVDZ0ssWUFBWWpPLE9BQVosQ0FBb0J2QixLQUEzRCxFQUFrRSxPQUFsRSxFQUEyRWdnQixJQUFJb0csS0FBSixDQUFVRSxTQUFyRjtBQUNBOztBQUNELGNBQUl0RyxJQUFJb0csS0FBSixDQUFVRyxRQUFkLEVBQXdCO0FBQ3ZCMXBCLG1CQUFPMkksSUFBUCxDQUFZLHlCQUFaLEVBQXVDZ0ssWUFBWWpPLE9BQVosQ0FBb0J2QixLQUEzRCxFQUFrRSxNQUFsRSxFQUEwRWdnQixJQUFJb0csS0FBSixDQUFVRyxRQUFwRjtBQUNBO0FBQ0Q7QUFDRCxPQVpEO0FBY0EsYUFBT2hsQixPQUFQO0FBQ0EsS0FsQkQsQ0FrQkUsT0FBT29CLENBQVAsRUFBVTtBQUNYLGFBQU9zZCxXQUFXcGQsS0FBWCxDQUFpQjJDLElBQWpCLENBQXNCLElBQXRCLEVBQTRCN0MsQ0FBNUIsQ0FBUDtBQUNBO0FBQ0Q7O0FBbkUyRCxDQUE3RCxFOzs7Ozs7Ozs7OztBQ0ZBLElBQUk1RyxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEO0FBRU5tQixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkMsUUFBbEIsQ0FBMkIsc0JBQTNCLEVBQW1EO0FBQUVDLGdCQUFjO0FBQWhCLENBQW5ELEVBQTJFO0FBQzFFdm5CLFFBQU07QUFDTCxRQUFJLENBQUNGLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsdUJBQTVDLENBQUwsRUFBMkU7QUFDMUUsYUFBT3BKLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCRyxZQUFsQixFQUFQO0FBQ0E7O0FBRUQsUUFBSTtBQUNIemMsWUFBTSxLQUFLNGMsU0FBWCxFQUFzQjtBQUNyQm5oQixjQUFNd0U7QUFEZSxPQUF0QjtBQUlBLFVBQUkrZCxJQUFKOztBQUNBLFVBQUksS0FBS3BCLFNBQUwsQ0FBZW5oQixJQUFmLEtBQXdCLE9BQTVCLEVBQXFDO0FBQ3BDdWlCLGVBQU8sZ0JBQVA7QUFDQSxPQUZELE1BRU8sSUFBSSxLQUFLcEIsU0FBTCxDQUFlbmhCLElBQWYsS0FBd0IsU0FBNUIsRUFBdUM7QUFDN0N1aUIsZUFBTyxrQkFBUDtBQUNBLE9BRk0sTUFFQTtBQUNOLGNBQU0sY0FBTjtBQUNBOztBQUVELFlBQU0zSSxRQUFRdGdCLFdBQVdpQyxLQUFYLENBQWlCMmhCLGNBQWpCLENBQWdDcUYsSUFBaEMsQ0FBZDtBQUVBLGFBQU9qcEIsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0IvYyxPQUFsQixDQUEwQjtBQUNoQzhWLGVBQU9BLE1BQU10VixLQUFOLEdBQWN6SyxHQUFkLENBQWtCNkIsU0FBUztBQUFFRyxlQUFLSCxLQUFLRyxHQUFaO0FBQWlCOEQsb0JBQVVqRSxLQUFLaUU7QUFBaEMsU0FBVCxDQUFsQjtBQUR5QixPQUExQixDQUFQO0FBR0EsS0FuQkQsQ0FtQkUsT0FBT2pCLENBQVAsRUFBVTtBQUNYLGFBQU9wRixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkssT0FBbEIsQ0FBMEJ4aUIsRUFBRUUsS0FBNUIsQ0FBUDtBQUNBO0FBQ0QsR0E1QnlFOztBQTZCMUVqQixTQUFPO0FBQ04sUUFBSSxDQUFDckUsV0FBV2lDLEtBQVgsQ0FBaUJLLGFBQWpCLENBQStCLEtBQUs4RyxNQUFwQyxFQUE0Qyx1QkFBNUMsQ0FBTCxFQUEyRTtBQUMxRSxhQUFPcEosV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JHLFlBQWxCLEVBQVA7QUFDQTs7QUFDRCxRQUFJO0FBQ0h6YyxZQUFNLEtBQUs0YyxTQUFYLEVBQXNCO0FBQ3JCbmhCLGNBQU13RTtBQURlLE9BQXRCO0FBSUFELFlBQU0sS0FBSzBjLFVBQVgsRUFBdUI7QUFDdEJ0aEIsa0JBQVU2RTtBQURZLE9BQXZCOztBQUlBLFVBQUksS0FBSzJjLFNBQUwsQ0FBZW5oQixJQUFmLEtBQXdCLE9BQTVCLEVBQXFDO0FBQ3BDLGNBQU10RSxPQUFPcEMsV0FBVzhHLFFBQVgsQ0FBb0J3QyxRQUFwQixDQUE2QixLQUFLcWUsVUFBTCxDQUFnQnRoQixRQUE3QyxDQUFiOztBQUNBLFlBQUlqRSxJQUFKLEVBQVU7QUFDVCxpQkFBT3BDLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCL2MsT0FBbEIsQ0FBMEI7QUFBRXBJO0FBQUYsV0FBMUIsQ0FBUDtBQUNBO0FBQ0QsT0FMRCxNQUtPLElBQUksS0FBS3lsQixTQUFMLENBQWVuaEIsSUFBZixLQUF3QixTQUE1QixFQUF1QztBQUM3QyxjQUFNdEUsT0FBT3BDLFdBQVc4RyxRQUFYLENBQW9CeUMsVUFBcEIsQ0FBK0IsS0FBS29lLFVBQUwsQ0FBZ0J0aEIsUUFBL0MsQ0FBYjs7QUFDQSxZQUFJakUsSUFBSixFQUFVO0FBQ1QsaUJBQU9wQyxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQi9jLE9BQWxCLENBQTBCO0FBQUVwSTtBQUFGLFdBQTFCLENBQVA7QUFDQTtBQUNELE9BTE0sTUFLQTtBQUNOLGNBQU0sY0FBTjtBQUNBOztBQUVELGFBQU9wQyxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkssT0FBbEIsRUFBUDtBQUNBLEtBeEJELENBd0JFLE9BQU94aUIsQ0FBUCxFQUFVO0FBQ1gsYUFBT3BGLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCSyxPQUFsQixDQUEwQnhpQixFQUFFRSxLQUE1QixDQUFQO0FBQ0E7QUFDRDs7QUE1RHlFLENBQTNFO0FBK0RBdEYsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JDLFFBQWxCLENBQTJCLDJCQUEzQixFQUF3RDtBQUFFQyxnQkFBYztBQUFoQixDQUF4RCxFQUFnRjtBQUMvRXZuQixRQUFNO0FBQ0wsUUFBSSxDQUFDRixXQUFXaUMsS0FBWCxDQUFpQkssYUFBakIsQ0FBK0IsS0FBSzhHLE1BQXBDLEVBQTRDLHVCQUE1QyxDQUFMLEVBQTJFO0FBQzFFLGFBQU9wSixXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkcsWUFBbEIsRUFBUDtBQUNBOztBQUVELFFBQUk7QUFDSHpjLFlBQU0sS0FBSzRjLFNBQVgsRUFBc0I7QUFDckJuaEIsY0FBTXdFLE1BRGU7QUFFckIzSSxhQUFLMkk7QUFGZ0IsT0FBdEI7QUFLQSxZQUFNOUksT0FBT3BDLFdBQVc4QixNQUFYLENBQWtCNEgsS0FBbEIsQ0FBd0JPLFdBQXhCLENBQW9DLEtBQUs0ZCxTQUFMLENBQWV0bEIsR0FBbkQsQ0FBYjs7QUFFQSxVQUFJLENBQUNILElBQUwsRUFBVztBQUNWLGVBQU9wQyxXQUFXc25CLEdBQVgsQ0FBZUMsRUFBZixDQUFrQkssT0FBbEIsQ0FBMEIsZ0JBQTFCLENBQVA7QUFDQTs7QUFFRCxVQUFJcUIsSUFBSjs7QUFFQSxVQUFJLEtBQUtwQixTQUFMLENBQWVuaEIsSUFBZixLQUF3QixPQUE1QixFQUFxQztBQUNwQ3VpQixlQUFPLGdCQUFQO0FBQ0EsT0FGRCxNQUVPLElBQUksS0FBS3BCLFNBQUwsQ0FBZW5oQixJQUFmLEtBQXdCLFNBQTVCLEVBQXVDO0FBQzdDdWlCLGVBQU8sa0JBQVA7QUFDQSxPQUZNLE1BRUE7QUFDTixjQUFNLGNBQU47QUFDQTs7QUFFRCxVQUFJN21CLEtBQUt5VixLQUFMLENBQVcxTixPQUFYLENBQW1COGUsSUFBbkIsTUFBNkIsQ0FBQyxDQUFsQyxFQUFxQztBQUNwQyxlQUFPanBCLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCL2MsT0FBbEIsQ0FBMEI7QUFDaENwSSxnQkFBTTVELEVBQUV5UCxJQUFGLENBQU83TCxJQUFQLEVBQWEsS0FBYixFQUFvQixVQUFwQjtBQUQwQixTQUExQixDQUFQO0FBR0E7O0FBRUQsYUFBT3BDLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCL2MsT0FBbEIsQ0FBMEI7QUFDaENwSSxjQUFNO0FBRDBCLE9BQTFCLENBQVA7QUFHQSxLQS9CRCxDQStCRSxPQUFPZ0QsQ0FBUCxFQUFVO0FBQ1gsYUFBT3BGLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCSyxPQUFsQixDQUEwQnhpQixFQUFFRSxLQUE1QixDQUFQO0FBQ0E7QUFDRCxHQXhDOEU7O0FBeUMvRXlpQixXQUFTO0FBQ1IsUUFBSSxDQUFDL25CLFdBQVdpQyxLQUFYLENBQWlCSyxhQUFqQixDQUErQixLQUFLOEcsTUFBcEMsRUFBNEMsdUJBQTVDLENBQUwsRUFBMkU7QUFDMUUsYUFBT3BKLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCRyxZQUFsQixFQUFQO0FBQ0E7O0FBRUQsUUFBSTtBQUNIemMsWUFBTSxLQUFLNGMsU0FBWCxFQUFzQjtBQUNyQm5oQixjQUFNd0UsTUFEZTtBQUVyQjNJLGFBQUsySTtBQUZnQixPQUF0QjtBQUtBLFlBQU05SSxPQUFPcEMsV0FBVzhCLE1BQVgsQ0FBa0I0SCxLQUFsQixDQUF3Qk8sV0FBeEIsQ0FBb0MsS0FBSzRkLFNBQUwsQ0FBZXRsQixHQUFuRCxDQUFiOztBQUVBLFVBQUksQ0FBQ0gsSUFBTCxFQUFXO0FBQ1YsZUFBT3BDLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCSyxPQUFsQixFQUFQO0FBQ0E7O0FBRUQsVUFBSSxLQUFLQyxTQUFMLENBQWVuaEIsSUFBZixLQUF3QixPQUE1QixFQUFxQztBQUNwQyxZQUFJMUcsV0FBVzhHLFFBQVgsQ0FBb0JzSSxXQUFwQixDQUFnQ2hOLEtBQUtpRSxRQUFyQyxDQUFKLEVBQW9EO0FBQ25ELGlCQUFPckcsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0IvYyxPQUFsQixFQUFQO0FBQ0E7QUFDRCxPQUpELE1BSU8sSUFBSSxLQUFLcWQsU0FBTCxDQUFlbmhCLElBQWYsS0FBd0IsU0FBNUIsRUFBdUM7QUFDN0MsWUFBSTFHLFdBQVc4RyxRQUFYLENBQW9CMEksYUFBcEIsQ0FBa0NwTixLQUFLaUUsUUFBdkMsQ0FBSixFQUFzRDtBQUNyRCxpQkFBT3JHLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCL2MsT0FBbEIsRUFBUDtBQUNBO0FBQ0QsT0FKTSxNQUlBO0FBQ04sY0FBTSxjQUFOO0FBQ0E7O0FBRUQsYUFBT3hLLFdBQVdzbkIsR0FBWCxDQUFlQyxFQUFmLENBQWtCSyxPQUFsQixFQUFQO0FBQ0EsS0F6QkQsQ0F5QkUsT0FBT3hpQixDQUFQLEVBQVU7QUFDWCxhQUFPcEYsV0FBV3NuQixHQUFYLENBQWVDLEVBQWYsQ0FBa0JLLE9BQWxCLENBQTBCeGlCLEVBQUVFLEtBQTVCLENBQVA7QUFDQTtBQUNEOztBQTFFOEUsQ0FBaEYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9saXZlY2hhdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgV2ViQXBwOnRydWUgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xuXG5XZWJBcHAgPSBQYWNrYWdlLndlYmFwcC5XZWJBcHA7XG5jb25zdCBBdXRvdXBkYXRlID0gUGFja2FnZS5hdXRvdXBkYXRlLkF1dG91cGRhdGU7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKCcvbGl2ZWNoYXQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChyZXEsIHJlcywgbmV4dCkgPT4ge1xuXHRjb25zdCByZXFVcmwgPSB1cmwucGFyc2UocmVxLnVybCk7XG5cdGlmIChyZXFVcmwucGF0aG5hbWUgIT09ICcvJykge1xuXHRcdHJldHVybiBuZXh0KCk7XG5cdH1cblx0cmVzLnNldEhlYWRlcignY29udGVudC10eXBlJywgJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcpO1xuXG5cdGxldCBkb21haW5XaGl0ZUxpc3QgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfQWxsb3dlZERvbWFpbnNMaXN0Jyk7XG5cdGlmIChyZXEuaGVhZGVycy5yZWZlcmVyICYmICFfLmlzRW1wdHkoZG9tYWluV2hpdGVMaXN0LnRyaW0oKSkpIHtcblx0XHRkb21haW5XaGl0ZUxpc3QgPSBfLm1hcChkb21haW5XaGl0ZUxpc3Quc3BsaXQoJywnKSwgZnVuY3Rpb24oZG9tYWluKSB7XG5cdFx0XHRyZXR1cm4gZG9tYWluLnRyaW0oKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IHJlZmVyZXIgPSB1cmwucGFyc2UocmVxLmhlYWRlcnMucmVmZXJlcik7XG5cdFx0aWYgKCFfLmNvbnRhaW5zKGRvbWFpbldoaXRlTGlzdCwgcmVmZXJlci5ob3N0KSkge1xuXHRcdFx0cmVzLnNldEhlYWRlcignWC1GUkFNRS1PUFRJT05TJywgJ0RFTlknKTtcblx0XHRcdHJldHVybiBuZXh0KCk7XG5cdFx0fVxuXG5cdFx0cmVzLnNldEhlYWRlcignWC1GUkFNRS1PUFRJT05TJywgYEFMTE9XLUZST00gJHsgcmVmZXJlci5wcm90b2NvbCB9Ly8keyByZWZlcmVyLmhvc3QgfWApO1xuXHR9XG5cblx0Y29uc3QgaGVhZCA9IEFzc2V0cy5nZXRUZXh0KCdwdWJsaWMvaGVhZC5odG1sJyk7XG5cblx0bGV0IGJhc2VVcmw7XG5cdGlmIChfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYICYmIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVgudHJpbSgpICE9PSAnJykge1xuXHRcdGJhc2VVcmwgPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlJPT1RfVVJMX1BBVEhfUFJFRklYO1xuXHR9IGVsc2Uge1xuXHRcdGJhc2VVcmwgPSAnLyc7XG5cdH1cblx0aWYgKC9cXC8kLy50ZXN0KGJhc2VVcmwpID09PSBmYWxzZSkge1xuXHRcdGJhc2VVcmwgKz0gJy8nO1xuXHR9XG5cblx0Y29uc3QgaHRtbCA9IGA8aHRtbD5cblx0XHQ8aGVhZD5cblx0XHRcdDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBjbGFzcz1cIl9fbWV0ZW9yLWNzc19fXCIgaHJlZj1cIiR7IGJhc2VVcmwgfWxpdmVjaGF0L2xpdmVjaGF0LmNzcz9fZGM9JHsgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiB9XCI+XG5cdFx0XHQ8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIj5cblx0XHRcdFx0X19tZXRlb3JfcnVudGltZV9jb25maWdfXyA9ICR7IEpTT04uc3RyaW5naWZ5KF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18pIH07XG5cdFx0XHQ8L3NjcmlwdD5cblxuXHRcdFx0PGJhc2UgaHJlZj1cIiR7IGJhc2VVcmwgfVwiPlxuXG5cdFx0XHQkeyBoZWFkIH1cblx0XHQ8L2hlYWQ+XG5cdFx0PGJvZHk+XG5cdFx0XHQ8c2NyaXB0IHR5cGU9XCJ0ZXh0L2phdmFzY3JpcHRcIiBzcmM9XCIkeyBiYXNlVXJsIH1saXZlY2hhdC9saXZlY2hhdC5qcz9fZGM9JHsgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiB9XCI+PC9zY3JpcHQ+XG5cdFx0PC9ib2R5PlxuXHQ8L2h0bWw+YDtcblxuXHRyZXMud3JpdGUoaHRtbCk7XG5cdHJlcy5lbmQoKTtcbn0pKTtcbiIsIk1ldGVvci5zdGFydHVwKCgpID0+IHtcblx0Um9ja2V0Q2hhdC5yb29tVHlwZXMuc2V0Um9vbUZpbmQoJ2wnLCAoY29kZSkgPT4ge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXRCeUNvZGUoY29kZSk7XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuYXV0aHouYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvcihmdW5jdGlvbihyb29tLCB1c2VyKSB7XG5cdFx0cmV0dXJuIHJvb20udCA9PT0gJ2wnICYmIHVzZXIgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHVzZXIuX2lkLCAndmlldy1saXZlY2hhdC1yb29tcycpO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IoZnVuY3Rpb24ocm9vbSwgdXNlciwgZXh0cmFEYXRhKSB7XG5cdFx0cmV0dXJuIHJvb20udCA9PT0gJ2wnICYmIGV4dHJhRGF0YSAmJiBleHRyYURhdGEudG9rZW4gJiYgcm9vbS52ICYmIHJvb20udi50b2tlbiA9PT0gZXh0cmFEYXRhLnRva2VuO1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2JlZm9yZUxlYXZlUm9vbScsIGZ1bmN0aW9uKHVzZXIsIHJvb20pIHtcblx0XHRpZiAocm9vbS50ICE9PSAnbCcpIHtcblx0XHRcdHJldHVybiB1c2VyO1xuXHRcdH1cblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFRBUGkxOG4uX18oJ1lvdV9jYW50X2xlYXZlX2FfbGl2ZWNoYXRfcm9vbV9QbGVhc2VfdXNlX3RoZV9jbG9zZV9idXR0b24nLCB7XG5cdFx0XHRsbmc6IHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJ1xuXHRcdH0pKTtcblx0fSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTE9XLCAnY2FudC1sZWF2ZS1yb29tJyk7XG59KTtcbiIsIi8qIGdsb2JhbHMgVXNlclByZXNlbmNlRXZlbnRzICovXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdFVzZXJQcmVzZW5jZUV2ZW50cy5vbignc2V0U3RhdHVzJywgKHNlc3Npb24sIHN0YXR1cywgbWV0YWRhdGEpID0+IHtcblx0XHRpZiAobWV0YWRhdGEgJiYgbWV0YWRhdGEudmlzaXRvcikge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LnVwZGF0ZVZpc2l0b3JTdGF0dXMobWV0YWRhdGEudmlzaXRvciwgc3RhdHVzKTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZVZpc2l0b3JTdGF0dXMobWV0YWRhdGEudmlzaXRvciwgc3RhdHVzKTtcblx0XHR9XG5cdH0pO1xufSk7XG4iLCIvKiBnbG9iYWxzIEhUVFAsIFN5c3RlbUxvZ2dlciAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmxldCBrbm93bGVkZ2VFbmFibGVkID0gZmFsc2U7XG5sZXQgYXBpYWlLZXkgPSAnJztcbmxldCBhcGlhaUxhbmd1YWdlID0gJ2VuJztcblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9Lbm93bGVkZ2VfRW5hYmxlZCcsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0a25vd2xlZGdlRW5hYmxlZCA9IHZhbHVlO1xufSk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0tleScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0YXBpYWlLZXkgPSB2YWx1ZTtcbn0pO1xuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0tub3dsZWRnZV9BcGlhaV9MYW5ndWFnZScsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0YXBpYWlMYW5ndWFnZSA9IHZhbHVlO1xufSk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmICghbWVzc2FnZSB8fCBtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoIWtub3dsZWRnZUVuYWJsZWQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGlmICghKHR5cGVvZiByb29tLnQgIT09ICd1bmRlZmluZWQnICYmIHJvb20udCA9PT0gJ2wnICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXNuJ3QgYSB0b2tlbiwgaXQgd2FzIG5vdCBzZW50IGJ5IHRoZSB2aXNpdG9yLCBzbyBpZ25vcmUgaXRcblx0aWYgKCFtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IEhUVFAucG9zdCgnaHR0cHM6Ly9hcGkuYXBpLmFpL2FwaS9xdWVyeT92PTIwMTUwOTEwJywge1xuXHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0cXVlcnk6IG1lc3NhZ2UubXNnLFxuXHRcdFx0XHRcdGxhbmc6IGFwaWFpTGFuZ3VhZ2UsXG5cdFx0XHRcdFx0c2Vzc2lvbklkOiByb29tLl9pZFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04Jyxcblx0XHRcdFx0XHQnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHsgYXBpYWlLZXkgfWBcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEuc3RhdHVzLmNvZGUgPT09IDIwMCAmJiAhXy5pc0VtcHR5KHJlc3BvbnNlLmRhdGEucmVzdWx0LmZ1bGZpbGxtZW50LnNwZWVjaCkpIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UuaW5zZXJ0KHtcblx0XHRcdFx0XHRyaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0XHRcdG1zZzogcmVzcG9uc2UuZGF0YS5yZXN1bHQuZnVsZmlsbG1lbnQuc3BlZWNoLFxuXHRcdFx0XHRcdG9yaWc6IG1lc3NhZ2UuX2lkLFxuXHRcdFx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFN5c3RlbUxvZ2dlci5lcnJvcignRXJyb3IgdXNpbmcgQXBpLmFpIC0+JywgZSk7XG5cdFx0fVxuXHR9KTtcblxuXHRyZXR1cm4gbWVzc2FnZTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ2V4dGVybmFsV2ViSG9vaycpO1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vLi4vc2VydmVyL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuZnVuY3Rpb24gdmFsaWRhdGVNZXNzYWdlKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmIChtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gbWVzc2FnZSB2YWxpZCBvbmx5IGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhc24ndCBhIHRva2VuLCBpdCB3YXMgTk9UIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmICghbWVzc2FnZS50b2tlbikge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdGlmIChtZXNzYWdlLnQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHRpZiAoIXZhbGlkYXRlTWVzc2FnZShtZXNzYWdlLCByb29tKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Y29uc3QgcGhvbmVSZWdleHAgPSBuZXcgUmVnRXhwKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9sZWFkX3Bob25lX3JlZ2V4JyksICdnJyk7XG5cdGNvbnN0IG1zZ1Bob25lcyA9IG1lc3NhZ2UubXNnLm1hdGNoKHBob25lUmVnZXhwKTtcblxuXHRjb25zdCBlbWFpbFJlZ2V4cCA9IG5ldyBSZWdFeHAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2xlYWRfZW1haWxfcmVnZXgnKSwgJ2dpJyk7XG5cdGNvbnN0IG1zZ0VtYWlscyA9IG1lc3NhZ2UubXNnLm1hdGNoKGVtYWlsUmVnZXhwKTtcblxuXHRpZiAobXNnRW1haWxzIHx8IG1zZ1Bob25lcykge1xuXHRcdExpdmVjaGF0VmlzaXRvcnMuc2F2ZUd1ZXN0RW1haWxQaG9uZUJ5SWQocm9vbS52Ll9pZCwgbXNnRW1haWxzLCBtc2dQaG9uZXMpO1xuXG5cdFx0Um9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdsaXZlY2hhdC5sZWFkQ2FwdHVyZScsIHJvb20pO1xuXHR9XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdsZWFkQ2FwdHVyZScpO1xuIiwiUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBza2lwcyB0aGlzIGNhbGxiYWNrIGlmIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWRcblx0aWYgKCFtZXNzYWdlIHx8IG1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGNoZWNrIGlmIHJvb20gaXMgeWV0IGF3YWl0aW5nIGZvciByZXNwb25zZVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLndhaXRpbmdSZXNwb25zZSkpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHRva2VuLCBpdCB3YXMgc2VudCBieSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0UmVzcG9uc2VCeVJvb21JZChyb29tLl9pZCwge1xuXHRcdFx0dXNlcjoge1xuXHRcdFx0XHRfaWQ6IG1lc3NhZ2UudS5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBtZXNzYWdlLnUudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRyZXNwb25zZURhdGU6IG5vdyxcblx0XHRcdHJlc3BvbnNlVGltZTogKG5vdy5nZXRUaW1lKCkgLSByb29tLnRzKSAvIDEwMDBcblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdtYXJrUm9vbVJlc3BvbmRlZCcpO1xuIiwiUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5vZmZsaW5lTWVzc2FnZScsIChkYXRhKSA9PiB7XG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnKSkge1xuXHRcdHJldHVybiBkYXRhO1xuXHR9XG5cblx0Y29uc3QgcG9zdERhdGEgPSB7XG5cdFx0dHlwZTogJ0xpdmVjaGF0T2ZmbGluZU1lc3NhZ2UnLFxuXHRcdHNlbnRBdDogbmV3IERhdGUoKSxcblx0XHR2aXNpdG9yOiB7XG5cdFx0XHRuYW1lOiBkYXRhLm5hbWUsXG5cdFx0XHRlbWFpbDogZGF0YS5lbWFpbFxuXHRcdH0sXG5cdFx0bWVzc2FnZTogZGF0YS5tZXNzYWdlXG5cdH07XG5cblx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kUmVxdWVzdChwb3N0RGF0YSk7XG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1zZW5kLWVtYWlsLW9mZmxpbmUtbWVzc2FnZScpO1xuIiwiZnVuY3Rpb24gc2VuZFRvUkRTdGF0aW9uKHJvb20pIHtcblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUkRTdGF0aW9uX1Rva2VuJykpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdGNvbnN0IGxpdmVjaGF0RGF0YSA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TGl2ZWNoYXRSb29tR3Vlc3RJbmZvKHJvb20pO1xuXG5cdGlmICghbGl2ZWNoYXREYXRhLnZpc2l0b3IuZW1haWwpIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdH0sXG5cdFx0ZGF0YToge1xuXHRcdFx0dG9rZW5fcmRzdGF0aW9uOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUkRTdGF0aW9uX1Rva2VuJyksXG5cdFx0XHRpZGVudGlmaWNhZG9yOiAncm9ja2V0Y2hhdC1saXZlY2hhdCcsXG5cdFx0XHRjbGllbnRfaWQ6IGxpdmVjaGF0RGF0YS52aXNpdG9yLl9pZCxcblx0XHRcdGVtYWlsOiBsaXZlY2hhdERhdGEudmlzaXRvci5lbWFpbFxuXHRcdH1cblx0fTtcblxuXHRvcHRpb25zLmRhdGEubm9tZSA9IGxpdmVjaGF0RGF0YS52aXNpdG9yLm5hbWUgfHwgbGl2ZWNoYXREYXRhLnZpc2l0b3IudXNlcm5hbWU7XG5cblx0aWYgKGxpdmVjaGF0RGF0YS52aXNpdG9yLnBob25lKSB7XG5cdFx0b3B0aW9ucy5kYXRhLnRlbGVmb25lID0gbGl2ZWNoYXREYXRhLnZpc2l0b3IucGhvbmU7XG5cdH1cblxuXHRpZiAobGl2ZWNoYXREYXRhLnRhZ3MpIHtcblx0XHRvcHRpb25zLmRhdGEudGFncyA9IGxpdmVjaGF0RGF0YS50YWdzO1xuXHR9XG5cblx0T2JqZWN0LmtleXMobGl2ZWNoYXREYXRhLmN1c3RvbUZpZWxkcyB8fCB7fSkuZm9yRWFjaChmaWVsZCA9PiB7XG5cdFx0b3B0aW9ucy5kYXRhW2ZpZWxkXSA9IGxpdmVjaGF0RGF0YS5jdXN0b21GaWVsZHNbZmllbGRdO1xuXHR9KTtcblxuXHRPYmplY3Qua2V5cyhsaXZlY2hhdERhdGEudmlzaXRvci5jdXN0b21GaWVsZHMgfHwge30pLmZvckVhY2goZmllbGQgPT4ge1xuXHRcdG9wdGlvbnMuZGF0YVtmaWVsZF0gPSBsaXZlY2hhdERhdGEudmlzaXRvci5jdXN0b21GaWVsZHNbZmllbGRdO1xuXHR9KTtcblxuXHR0cnkge1xuXHRcdEhUVFAuY2FsbCgnUE9TVCcsICdodHRwczovL3d3dy5yZHN0YXRpb24uY29tLmJyL2FwaS8xLjMvY29udmVyc2lvbnMnLCBvcHRpb25zKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbGVhZCB0byBSRCBTdGF0aW9uIC0+JywgZSk7XG5cdH1cblxuXHRyZXR1cm4gcm9vbTtcbn1cblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5jbG9zZVJvb20nLCBzZW5kVG9SRFN0YXRpb24sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXJkLXN0YXRpb24tY2xvc2Utcm9vbScpO1xuXG5Sb2NrZXRDaGF0LmNhbGxiYWNrcy5hZGQoJ2xpdmVjaGF0LnNhdmVJbmZvJywgc2VuZFRvUkRTdGF0aW9uLCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5NRURJVU0sICdsaXZlY2hhdC1yZC1zdGF0aW9uLXNhdmUtaW5mbycpO1xuIiwiZnVuY3Rpb24gc2VuZFRvQ1JNKHR5cGUsIHJvb20sIGluY2x1ZGVNZXNzYWdlcyA9IHRydWUpIHtcblx0Y29uc3QgcG9zdERhdGEgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldExpdmVjaGF0Um9vbUd1ZXN0SW5mbyhyb29tKTtcblxuXHRwb3N0RGF0YS50eXBlID0gdHlwZTtcblxuXHRwb3N0RGF0YS5tZXNzYWdlcyA9IFtdO1xuXG5cdGlmIChpbmNsdWRlTWVzc2FnZXMpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kVmlzaWJsZUJ5Um9vbUlkKHJvb20uX2lkLCB7IHNvcnQ6IHsgdHM6IDEgfSB9KS5mb3JFYWNoKChtZXNzYWdlKSA9PiB7XG5cdFx0XHRpZiAobWVzc2FnZS50KSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG1zZyA9IHtcblx0XHRcdFx0dXNlcm5hbWU6IG1lc3NhZ2UudS51c2VybmFtZSxcblx0XHRcdFx0bXNnOiBtZXNzYWdlLm1zZyxcblx0XHRcdFx0dHM6IG1lc3NhZ2UudHNcblx0XHRcdH07XG5cblx0XHRcdGlmIChtZXNzYWdlLnUudXNlcm5hbWUgIT09IHBvc3REYXRhLnZpc2l0b3IudXNlcm5hbWUpIHtcblx0XHRcdFx0bXNnLmFnZW50SWQgPSBtZXNzYWdlLnUuX2lkO1xuXHRcdFx0fVxuXHRcdFx0cG9zdERhdGEubWVzc2FnZXMucHVzaChtc2cpO1xuXHRcdH0pO1xuXHR9XG5cblx0Y29uc3QgcmVzcG9uc2UgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRSZXF1ZXN0KHBvc3REYXRhKTtcblxuXHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLmRhdGEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlQ1JNRGF0YUJ5Um9vbUlkKHJvb20uX2lkLCByZXNwb25zZS5kYXRhLmRhdGEpO1xuXHR9XG5cblx0cmV0dXJuIHJvb207XG59XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQuY2xvc2VSb29tJywgKHJvb20pID0+IHtcblx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZScpKSB7XG5cdFx0cmV0dXJuIHJvb207XG5cdH1cblxuXHRyZXR1cm4gc2VuZFRvQ1JNKCdMaXZlY2hhdFNlc3Npb24nLCByb29tKTtcbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5Lk1FRElVTSwgJ2xpdmVjaGF0LXNlbmQtY3JtLWNsb3NlLXJvb20nKTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdsaXZlY2hhdC5zYXZlSW5mbycsIChyb29tKSA9PiB7XG5cdC8vIERvIG5vdCBzZW5kIHRvIENSTSBpZiB0aGUgY2hhdCBpcyBzdGlsbCBvcGVuXG5cdGlmIChyb29tLm9wZW4pIHtcblx0XHRyZXR1cm4gcm9vbTtcblx0fVxuXG5cdHJldHVybiBzZW5kVG9DUk0oJ0xpdmVjaGF0RWRpdCcsIHJvb20pO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tc2F2ZS1pbmZvJyk7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnbGl2ZWNoYXQubGVhZENhcHR1cmUnLCAocm9vbSkgPT4ge1xuXHRpZiAoIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF93ZWJob29rX29uX2NhcHR1cmUnKSkge1xuXHRcdHJldHVybiByb29tO1xuXHR9XG5cdHJldHVybiBzZW5kVG9DUk0oJ0xlYWRDYXB0dXJlJywgcm9vbSwgZmFsc2UpO1xufSwgUm9ja2V0Q2hhdC5jYWxsYmFja3MucHJpb3JpdHkuTUVESVVNLCAnbGl2ZWNoYXQtc2VuZC1jcm0tbGVhZC1jYXB0dXJlJyk7XG4iLCJpbXBvcnQgT21uaUNoYW5uZWwgZnJvbSAnLi4vbGliL09tbmlDaGFubmVsJztcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgZnVuY3Rpb24obWVzc2FnZSwgcm9vbSkge1xuXHQvLyBza2lwcyB0aGlzIGNhbGxiYWNrIGlmIHRoZSBtZXNzYWdlIHdhcyBlZGl0ZWRcblx0aWYgKG1lc3NhZ2UuZWRpdGVkQXQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnKSB8fCAhUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknKSkge1xuXHRcdHJldHVybiBtZXNzYWdlO1xuXHR9XG5cblx0Ly8gb25seSBzZW5kIHRoZSBzbXMgYnkgU01TIGlmIGl0IGlzIGEgbGl2ZWNoYXQgcm9vbSB3aXRoIFNNUyBzZXQgdG8gdHJ1ZVxuXHRpZiAoISh0eXBlb2Ygcm9vbS50ICE9PSAndW5kZWZpbmVkJyAmJiByb29tLnQgPT09ICdsJyAmJiByb29tLmZhY2Vib29rICYmIHJvb20udiAmJiByb29tLnYudG9rZW4pKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0b2tlbiwgaXQgd2FzIHNlbnQgZnJvbSB0aGUgdmlzaXRvciwgc28gaWdub3JlIGl0XG5cdGlmIChtZXNzYWdlLnRva2VuKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHQvLyBpZiB0aGUgbWVzc2FnZSBoYXMgYSB0eXBlIG1lYW5zIGl0IGlzIGEgc3BlY2lhbCBtZXNzYWdlIChsaWtlIHRoZSBjbG9zaW5nIGNvbW1lbnQpLCBzbyBza2lwc1xuXHRpZiAobWVzc2FnZS50KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRPbW5pQ2hhbm5lbC5yZXBseSh7XG5cdFx0cGFnZTogcm9vbS5mYWNlYm9vay5wYWdlLmlkLFxuXHRcdHRva2VuOiByb29tLnYudG9rZW4sXG5cdFx0dGV4dDogbWVzc2FnZS5tc2dcblx0fSk7XG5cblx0cmV0dXJuIG1lc3NhZ2U7XG5cbn0sIFJvY2tldENoYXQuY2FsbGJhY2tzLnByaW9yaXR5LkxPVywgJ3NlbmRNZXNzYWdlVG9GYWNlYm9vaycpO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6YWRkQWdlbnQnKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmFkZEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5hZGRBZ2VudCh1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6YWRkTWFuYWdlcicodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkTWFuYWdlcih1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Y2hhbmdlTGl2ZWNoYXRTdGF0dXMnKCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2hhbmdlTGl2ZWNoYXRTdGF0dXMnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0Y29uc3QgbmV3U3RhdHVzID0gdXNlci5zdGF0dXNMaXZlY2hhdCA9PT0gJ2F2YWlsYWJsZScgPyAnbm90LWF2YWlsYWJsZScgOiAnYXZhaWxhYmxlJztcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5zZXRMaXZlY2hhdFN0YXR1cyh1c2VyLl9pZCwgbmV3U3RhdHVzKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmNsb3NlQnlWaXNpdG9yJyh7IHJvb21JZCwgdG9rZW4gfSkge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lT3BlbkJ5VmlzaXRvclRva2VuKHRva2VuLCByb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8ICFyb29tLm9wZW4pIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbik7XG5cblx0XHRjb25zdCBsYW5ndWFnZSA9ICh2aXNpdG9yICYmIHZpc2l0b3IubGFuZ3VhZ2UpIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5jbG9zZVJvb20oe1xuXHRcdFx0dmlzaXRvcixcblx0XHRcdHJvb20sXG5cdFx0XHRjb21tZW50OiBUQVBpMThuLl9fKCdDbG9zZWRfYnlfdmlzaXRvcicsIHsgbG5nOiBsYW5ndWFnZSB9KVxuXHRcdH0pO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmNsb3NlUm9vbScocm9vbUlkLCBjb21tZW50KSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdjbG9zZS1saXZlY2hhdC1yb29tJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZVJvb20nIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdyb29tLW5vdC1mb3VuZCcsICdSb29tIG5vdCBmb3VuZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6Y2xvc2VSb29tJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblxuXHRcdGlmICgoIXJvb20udXNlcm5hbWVzIHx8IHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xKSAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2Nsb3NlLW90aGVycy1saXZlY2hhdC1yb29tJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpjbG9zZVJvb20nIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlUm9vbSh7XG5cdFx0XHR1c2VyLFxuXHRcdFx0cm9vbSxcblx0XHRcdGNvbW1lbnRcblx0XHR9KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgT21uaUNoYW5uZWwgZnJvbSAnLi4vbGliL09tbmlDaGFubmVsJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6ZmFjZWJvb2snKG9wdGlvbnMpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRzd2l0Y2ggKG9wdGlvbnMuYWN0aW9uKSB7XG5cdFx0XHRcdGNhc2UgJ2luaXRpYWxTdGF0ZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0ZW5hYmxlZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnKSxcblx0XHRcdFx0XHRcdGhhc1Rva2VuOiAhIVJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5Jylcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FzZSAnZW5hYmxlJzoge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IE9tbmlDaGFubmVsLmVuYWJsZSgpO1xuXG5cdFx0XHRcdFx0aWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9GYWNlYm9va19FbmFibGVkJywgdHJ1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdkaXNhYmxlJzoge1xuXHRcdFx0XHRcdE9tbmlDaGFubmVsLmRpc2FibGUoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X0ZhY2Vib29rX0VuYWJsZWQnLCBmYWxzZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICdsaXN0LXBhZ2VzJzoge1xuXHRcdFx0XHRcdHJldHVybiBPbW5pQ2hhbm5lbC5saXN0UGFnZXMoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhc2UgJ3N1YnNjcmliZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4gT21uaUNoYW5uZWwuc3Vic2NyaWJlKG9wdGlvbnMucGFnZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYXNlICd1bnN1YnNjcmliZSc6IHtcblx0XHRcdFx0XHRyZXR1cm4gT21uaUNoYW5uZWwudW5zdWJzY3JpYmUob3B0aW9ucy5wYWdlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGlmIChlLnJlc3BvbnNlICYmIGUucmVzcG9uc2UuZGF0YSAmJiBlLnJlc3BvbnNlLmRhdGEuZXJyb3IpIHtcblx0XHRcdFx0aWYgKGUucmVzcG9uc2UuZGF0YS5lcnJvci5lcnJvcikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZS5yZXNwb25zZS5kYXRhLmVycm9yLmVycm9yLCBlLnJlc3BvbnNlLmRhdGEuZXJyb3IubWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGUucmVzcG9uc2UuZGF0YS5lcnJvci5yZXNwb25zZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludGVncmF0aW9uLWVycm9yJywgZS5yZXNwb25zZS5kYXRhLmVycm9yLnJlc3BvbnNlLmVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChlLnJlc3BvbnNlLmRhdGEuZXJyb3IubWVzc2FnZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludGVncmF0aW9uLWVycm9yJywgZS5yZXNwb25zZS5kYXRhLmVycm9yLm1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb250YWN0aW5nIG9tbmkucm9ja2V0LmNoYXQ6JywgZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnRlZ3JhdGlvbi1lcnJvcicsIGUuZXJyb3IpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpnZXRDdXN0b21GaWVsZHMnKCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmQoKS5mZXRjaCgpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0QWdlbnREYXRhJyh7IHJvb21JZCwgdG9rZW4gfSkge1xuXHRcdGNoZWNrKHJvb21JZCwgU3RyaW5nKTtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuKTtcblxuXHRcdC8vIGFsbG93IHRvIG9ubHkgdXNlciB0byBzZW5kIHRyYW5zY3JpcHRzIGZyb20gdGhlaXIgb3duIGNoYXRzXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnIHx8ICFyb29tLnYgfHwgcm9vbS52LnRva2VuICE9PSB2aXNpdG9yLnRva2VuKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tLnNlcnZlZEJ5KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhyb29tLnNlcnZlZEJ5Ll9pZCk7XG5cdH1cbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6Z2V0SW5pdGlhbERhdGEnKHZpc2l0b3JUb2tlbikge1xuXHRcdGNvbnN0IGluZm8gPSB7XG5cdFx0XHRlbmFibGVkOiBudWxsLFxuXHRcdFx0dGl0bGU6IG51bGwsXG5cdFx0XHRjb2xvcjogbnVsbCxcblx0XHRcdHJlZ2lzdHJhdGlvbkZvcm06IG51bGwsXG5cdFx0XHRyb29tOiBudWxsLFxuXHRcdFx0dmlzaXRvcjogbnVsbCxcblx0XHRcdHRyaWdnZXJzOiBbXSxcblx0XHRcdGRlcGFydG1lbnRzOiBbXSxcblx0XHRcdGFsbG93U3dpdGNoaW5nRGVwYXJ0bWVudHM6IG51bGwsXG5cdFx0XHRvbmxpbmU6IHRydWUsXG5cdFx0XHRvZmZsaW5lQ29sb3I6IG51bGwsXG5cdFx0XHRvZmZsaW5lTWVzc2FnZTogbnVsbCxcblx0XHRcdG9mZmxpbmVTdWNjZXNzTWVzc2FnZTogbnVsbCxcblx0XHRcdG9mZmxpbmVVbmF2YWlsYWJsZU1lc3NhZ2U6IG51bGwsXG5cdFx0XHRkaXNwbGF5T2ZmbGluZUZvcm06IG51bGwsXG5cdFx0XHR2aWRlb0NhbGw6IG51bGxcblx0XHR9O1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvclRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dDogMSxcblx0XHRcdFx0Y2w6IDEsXG5cdFx0XHRcdHU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lczogMSxcblx0XHRcdFx0djogMSxcblx0XHRcdFx0c2VydmVkQnk6IDFcblx0XHRcdH1cblx0XHR9KS5mZXRjaCgpO1xuXG5cdFx0aWYgKHJvb20gJiYgcm9vbS5sZW5ndGggPiAwKSB7XG5cdFx0XHRpbmZvLnJvb20gPSByb29tWzBdO1xuXHRcdH1cblxuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHZpc2l0b3JUb2tlbiwge1xuXHRcdFx0ZmllbGRzOiB7XG5cdFx0XHRcdG5hbWU6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxLFxuXHRcdFx0XHR2aXNpdG9yRW1haWxzOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAocm9vbSkge1xuXHRcdFx0aW5mby52aXNpdG9yID0gdmlzaXRvcjtcblx0XHR9XG5cblx0XHRjb25zdCBpbml0U2V0dGluZ3MgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldEluaXRTZXR0aW5ncygpO1xuXG5cdFx0aW5mby50aXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF90aXRsZTtcblx0XHRpbmZvLmNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3RpdGxlX2NvbG9yO1xuXHRcdGluZm8uZW5hYmxlZCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbmFibGVkO1xuXHRcdGluZm8ucmVnaXN0cmF0aW9uRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9yZWdpc3RyYXRpb25fZm9ybTtcblx0XHRpbmZvLm9mZmxpbmVUaXRsZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX3RpdGxlO1xuXHRcdGluZm8ub2ZmbGluZUNvbG9yID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3I7XG5cdFx0aW5mby5vZmZsaW5lTWVzc2FnZSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9vZmZsaW5lX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lU3VjY2Vzc01lc3NhZ2UgPSBpbml0U2V0dGluZ3MuTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2U7XG5cdFx0aW5mby5vZmZsaW5lVW5hdmFpbGFibGVNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X29mZmxpbmVfZm9ybV91bmF2YWlsYWJsZTtcblx0XHRpbmZvLmRpc3BsYXlPZmZsaW5lRm9ybSA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybTtcblx0XHRpbmZvLmxhbmd1YWdlID0gaW5pdFNldHRpbmdzLkxhbmd1YWdlO1xuXHRcdGluZm8udmlkZW9DYWxsID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3ZpZGVvY2FsbF9lbmFibGVkID09PSB0cnVlICYmIGluaXRTZXR0aW5ncy5KaXRzaV9FbmFibGVkID09PSB0cnVlO1xuXHRcdGluZm8udHJhbnNjcmlwdCA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9lbmFibGVfdHJhbnNjcmlwdDtcblx0XHRpbmZvLnRyYW5zY3JpcHRNZXNzYWdlID0gaW5pdFNldHRpbmdzLkxpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZTtcblxuXHRcdGluZm8uYWdlbnREYXRhID0gcm9vbSAmJiByb29tWzBdICYmIHJvb21bMF0uc2VydmVkQnkgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZ2V0QWdlbnRJbmZvKHJvb21bMF0uc2VydmVkQnkuX2lkKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0VHJpZ2dlci5maW5kRW5hYmxlZCgpLmZvckVhY2goKHRyaWdnZXIpID0+IHtcblx0XHRcdGluZm8udHJpZ2dlcnMucHVzaChfLnBpY2sodHJpZ2dlciwgJ19pZCcsICdhY3Rpb25zJywgJ2NvbmRpdGlvbnMnKSk7XG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZEVuYWJsZWRXaXRoQWdlbnRzKCkuZm9yRWFjaCgoZGVwYXJ0bWVudCkgPT4ge1xuXHRcdFx0aW5mby5kZXBhcnRtZW50cy5wdXNoKGRlcGFydG1lbnQpO1xuXHRcdH0pO1xuXHRcdGluZm8uYWxsb3dTd2l0Y2hpbmdEZXBhcnRtZW50cyA9IGluaXRTZXR0aW5ncy5MaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHM7XG5cblx0XHRpbmZvLm9ubGluZSA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKS5jb3VudCgpID4gMDtcblxuXHRcdHJldHVybiBpbmZvO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmdldE5leHRBZ2VudCcoeyB0b2tlbiwgZGVwYXJ0bWVudCB9KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeVZpc2l0b3JUb2tlbih0b2tlbikuZmV0Y2goKTtcblxuXHRcdGlmIChyb29tICYmIHJvb20ubGVuZ3RoID4gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICghZGVwYXJ0bWVudCkge1xuXHRcdFx0Y29uc3QgcmVxdWlyZURlcGFybWVudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0UmVxdWlyZWREZXBhcnRtZW50KCk7XG5cdFx0XHRpZiAocmVxdWlyZURlcGFybWVudCkge1xuXHRcdFx0XHRkZXBhcnRtZW50ID0gcmVxdWlyZURlcGFybWVudC5faWQ7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgYWdlbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldE5leHRBZ2VudChkZXBhcnRtZW50KTtcblx0XHRpZiAoIWFnZW50KSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhhZ2VudC5hZ2VudElkKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmxvYWRIaXN0b3J5Jyh7IHRva2VuLCByaWQsIGVuZCwgbGltaXQgPSAyMCwgbHN9KSB7XG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odG9rZW4sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pO1xuXG5cdFx0aWYgKCF2aXNpdG9yKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubG9hZE1lc3NhZ2VIaXN0b3J5KHsgdXNlcklkOiB2aXNpdG9yLl9pZCwgcmlkLCBlbmQsIGxpbWl0LCBscyB9KTtcblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OmxvZ2luQnlUb2tlbicodG9rZW4pIHtcblx0XHRjb25zdCB1c2VyID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbiwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiB1c2VyLl9pZFxuXHRcdH07XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cGFnZVZpc2l0ZWQnKHRva2VuLCBwYWdlSW5mbykge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVQYWdlSGlzdG9yeSh0b2tlbiwgcGFnZUluZm8pO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlZ2lzdGVyR3Vlc3QnKHsgdG9rZW4sIG5hbWUsIGVtYWlsLCBkZXBhcnRtZW50IH0gPSB7fSkge1xuXHRcdGNvbnN0IHVzZXJJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdC5jYWxsKHRoaXMsIHtcblx0XHRcdHRva2VuLFxuXHRcdFx0bmFtZSxcblx0XHRcdGVtYWlsLFxuXHRcdFx0ZGVwYXJ0bWVudFxuXHRcdH0pO1xuXG5cdFx0Ly8gdXBkYXRlIHZpc2l0ZWQgcGFnZSBoaXN0b3J5IHRvIG5vdCBleHBpcmVcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFBhZ2VWaXNpdGVkLmtlZXBIaXN0b3J5Rm9yVG9rZW4odG9rZW4pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVzZXJJZFxuXHRcdH07XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlQWdlbnQnKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVBZ2VudCh1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlQ3VzdG9tRmllbGQnKF9pZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3QgY3VzdG9tRmllbGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmRPbmVCeUlkKF9pZCwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIWN1c3RvbUZpZWxkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWN1c3RvbS1maWVsZCcsICdDdXN0b20gZmllbGQgbm90IGZvdW5kJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQucmVtb3ZlQnlJZChfaWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJlbW92ZURlcGFydG1lbnQnKF9pZCkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpyZW1vdmVEZXBhcnRtZW50JyB9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVEZXBhcnRtZW50KF9pZCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlTWFuYWdlcicodXNlcm5hbWUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6cmVtb3ZlTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlTWFuYWdlcih1c2VybmFtZSk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6cmVtb3ZlVHJpZ2dlcicodHJpZ2dlcklkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZVRyaWdnZXInIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRyaWdnZXJJZCwgU3RyaW5nKTtcblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIucmVtb3ZlQnlJZCh0cmlnZ2VySWQpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNhdmVBcHBlYXJhbmNlJyhzZXR0aW5ncykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlQXBwZWFyYW5jZScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdmFsaWRTZXR0aW5ncyA9IFtcblx0XHRcdCdMaXZlY2hhdF90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLFxuXHRcdFx0J0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX2Zvcm1fdW5hdmFpbGFibGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9zdWNjZXNzX21lc3NhZ2UnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGUnLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLFxuXHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfZW1haWwnXG5cdFx0XTtcblxuXHRcdGNvbnN0IHZhbGlkID0gc2V0dGluZ3MuZXZlcnkoKHNldHRpbmcpID0+IHtcblx0XHRcdHJldHVybiB2YWxpZFNldHRpbmdzLmluZGV4T2Yoc2V0dGluZy5faWQpICE9PSAtMTtcblx0XHR9KTtcblxuXHRcdGlmICghdmFsaWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc2V0dGluZycpO1xuXHRcdH1cblxuXHRcdHNldHRpbmdzLmZvckVhY2goKHNldHRpbmcpID0+IHtcblx0XHRcdFJvY2tldENoYXQuc2V0dGluZ3MudXBkYXRlQnlJZChzZXR0aW5nLl9pZCwgc2V0dGluZy52YWx1ZSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm47XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlQ3VzdG9tRmllbGQnKF9pZCwgY3VzdG9tRmllbGREYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y2hlY2soX2lkLCBTdHJpbmcpO1xuXHRcdH1cblxuXHRcdGNoZWNrKGN1c3RvbUZpZWxkRGF0YSwgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHsgZmllbGQ6IFN0cmluZywgbGFiZWw6IFN0cmluZywgc2NvcGU6IFN0cmluZywgdmlzaWJpbGl0eTogU3RyaW5nIH0pKTtcblxuXHRcdGlmICghL15bMC05YS16QS1aLV9dKyQvLnRlc3QoY3VzdG9tRmllbGREYXRhLmZpZWxkKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1jdXN0b20tZmllbGQtbm1hZScsICdJbnZhbGlkIGN1c3RvbSBmaWVsZCBuYW1lLiBVc2Ugb25seSBsZXR0ZXJzLCBudW1iZXJzLCBoeXBoZW5zIGFuZCB1bmRlcnNjb3Jlcy4nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0Y29uc3QgY3VzdG9tRmllbGQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRpZiAoIWN1c3RvbUZpZWxkKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtY3VzdG9tLWZpZWxkJywgJ0N1c3RvbSBGaWVsZCBOb3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVDdXN0b21GaWVsZCcgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuY3JlYXRlT3JVcGRhdGVDdXN0b21GaWVsZChfaWQsIGN1c3RvbUZpZWxkRGF0YS5maWVsZCwgY3VzdG9tRmllbGREYXRhLmxhYmVsLCBjdXN0b21GaWVsZERhdGEuc2NvcGUsIGN1c3RvbUZpZWxkRGF0YS52aXNpYmlsaXR5KTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cykge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlRGVwYXJ0bWVudCcgfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cyk7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTWF0Y2guT2JqZWN0SW5jbHVkaW5nXCIsIFwiTWF0Y2guT3B0aW9uYWxcIl19XSAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlSW5mbycoZ3Vlc3REYXRhLCByb29tRGF0YSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1sLXJvb20nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRjaGVjayhndWVzdERhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdG5hbWU6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRlbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdHBob25lOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSkpO1xuXG5cdFx0Y2hlY2socm9vbURhdGEsIE1hdGNoLk9iamVjdEluY2x1ZGluZyh7XG5cdFx0XHRfaWQ6IFN0cmluZyxcblx0XHRcdHRvcGljOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0dGFnczogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKVxuXHRcdH0pKTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tRGF0YS5faWQsIHtmaWVsZHM6IHt0OiAxLCBzZXJ2ZWRCeTogMX19KTtcblxuXHRcdGlmIChyb29tID09IG51bGwgfHwgcm9vbS50ICE9PSAnbCcpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVJbmZvJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoKCFyb29tLnNlcnZlZEJ5IHx8IHJvb20uc2VydmVkQnkuX2lkICE9PSBNZXRlb3IudXNlcklkKCkpICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnc2F2ZS1vdGhlcnMtbGl2ZWNoYXQtcm9vbS1pbmZvJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlSW5mbycgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmV0ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5zYXZlR3Vlc3QoZ3Vlc3REYXRhKSAmJiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVSb29tSW5mbyhyb29tRGF0YSwgZ3Vlc3REYXRhKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVJbmZvJywgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbURhdGEuX2lkKSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmV0O1xuXHR9XG59KTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyh2YWx1ZXMpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZUludGVncmF0aW9uJyB9KTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rVXJsJywgcy50cmltKHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va1VybCddKSk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZXNbJ0xpdmVjaGF0X3NlY3JldF90b2tlbiddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCBzLnRyaW0odmFsdWVzWydMaXZlY2hhdF9zZWNyZXRfdG9rZW4nXSkpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgdmFsdWVzWydMaXZlY2hhdF93ZWJob29rX29uX2Nsb3NlJ10gIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAhIXZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9jbG9zZSddKTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHZhbHVlc1snTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZyddICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy51cGRhdGVCeUlkKCdMaXZlY2hhdF93ZWJob29rX29uX29mZmxpbmVfbXNnJywgISF2YWx1ZXNbJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuO1xuXHR9XG59KTtcbiIsIi8qIGVzbGludCBuZXctY2FwOiBbMiwge1wiY2FwSXNOZXdFeGNlcHRpb25zXCI6IFtcIk1hdGNoLk9iamVjdEluY2x1ZGluZ1wiXX1dICovXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2F2ZVN1cnZleUZlZWRiYWNrJyh2aXNpdG9yVG9rZW4sIHZpc2l0b3JSb29tLCBmb3JtRGF0YSkge1xuXHRcdGNoZWNrKHZpc2l0b3JUb2tlbiwgU3RyaW5nKTtcblx0XHRjaGVjayh2aXNpdG9yUm9vbSwgU3RyaW5nKTtcblx0XHRjaGVjayhmb3JtRGF0YSwgW01hdGNoLk9iamVjdEluY2x1ZGluZyh7IG5hbWU6IFN0cmluZywgdmFsdWU6IFN0cmluZyB9KV0pO1xuXG5cdFx0Y29uc3QgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odmlzaXRvclRva2VuKTtcblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQodmlzaXRvclJvb20pO1xuXG5cdFx0aWYgKHZpc2l0b3IgIT09IHVuZGVmaW5lZCAmJiByb29tICE9PSB1bmRlZmluZWQgJiYgcm9vbS52ICE9PSB1bmRlZmluZWQgJiYgcm9vbS52LnRva2VuID09PSB2aXNpdG9yLnRva2VuKSB7XG5cdFx0XHRjb25zdCB1cGRhdGVEYXRhID0ge307XG5cdFx0XHRmb3IgKGNvbnN0IGl0ZW0gb2YgZm9ybURhdGEpIHtcblx0XHRcdFx0aWYgKF8uY29udGFpbnMoWydzYXRpc2ZhY3Rpb24nLCAnYWdlbnRLbm93bGVkZ2UnLCAnYWdlbnRSZXNwb3NpdmVuZXNzJywgJ2FnZW50RnJpZW5kbGluZXNzJ10sIGl0ZW0ubmFtZSkgJiYgXy5jb250YWlucyhbJzEnLCAnMicsICczJywgJzQnLCAnNSddLCBpdGVtLnZhbHVlKSkge1xuXHRcdFx0XHRcdHVwZGF0ZURhdGFbaXRlbS5uYW1lXSA9IGl0ZW0udmFsdWU7XG5cdFx0XHRcdH0gZWxzZSBpZiAoaXRlbS5uYW1lID09PSAnYWRkaXRpb25hbEZlZWRiYWNrJykge1xuXHRcdFx0XHRcdHVwZGF0ZURhdGFbaXRlbS5uYW1lXSA9IGl0ZW0udmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmICghXy5pc0VtcHR5KHVwZGF0ZURhdGEpKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGVTdXJ2ZXlGZWVkYmFja0J5SWQocm9vbS5faWQsIHVwZGF0ZURhdGEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlVHJpZ2dlcicodHJpZ2dlcikge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hbGxvd2VkJywgJ05vdCBhbGxvd2VkJywgeyBtZXRob2Q6ICdsaXZlY2hhdDpzYXZlVHJpZ2dlcicgfSk7XG5cdFx0fVxuXG5cdFx0Y2hlY2sodHJpZ2dlciwge1xuXHRcdFx0X2lkOiBNYXRjaC5NYXliZShTdHJpbmcpLFxuXHRcdFx0bmFtZTogU3RyaW5nLFxuXHRcdFx0ZGVzY3JpcHRpb246IFN0cmluZyxcblx0XHRcdGVuYWJsZWQ6IEJvb2xlYW4sXG5cdFx0XHRjb25kaXRpb25zOiBBcnJheSxcblx0XHRcdGFjdGlvbnM6IEFycmF5XG5cdFx0fSk7XG5cblx0XHRpZiAodHJpZ2dlci5faWQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIudXBkYXRlQnlJZCh0cmlnZ2VyLl9pZCwgdHJpZ2dlcik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIuaW5zZXJ0KHRyaWdnZXIpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNlYXJjaEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoIXVzZXJuYW1lIHx8ICFfLmlzU3RyaW5nKHVzZXJuYW1lKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hcmd1bWVudHMnLCAnSW52YWxpZCBhcmd1bWVudHMnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNlYXJjaEFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2VhcmNoQWdlbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiB1c2VyO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRzZW5kTWVzc2FnZUxpdmVjaGF0KHsgdG9rZW4sIF9pZCwgcmlkLCBtc2cgfSwgYWdlbnQpIHtcblx0XHRjaGVjayh0b2tlbiwgU3RyaW5nKTtcblx0XHRjaGVjayhfaWQsIFN0cmluZyk7XG5cdFx0Y2hlY2socmlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKG1zZywgU3RyaW5nKTtcblxuXHRcdGNoZWNrKGFnZW50LCBNYXRjaC5NYXliZSh7XG5cdFx0XHRhZ2VudElkOiBTdHJpbmcsXG5cdFx0XHR1c2VybmFtZTogU3RyaW5nXG5cdFx0fSkpO1xuXG5cdFx0Y29uc3QgZ3Vlc3QgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7XG5cdFx0XHRmaWVsZHM6IHtcblx0XHRcdFx0bmFtZTogMSxcblx0XHRcdFx0dXNlcm5hbWU6IDEsXG5cdFx0XHRcdGRlcGFydG1lbnQ6IDEsXG5cdFx0XHRcdHRva2VuOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoIWd1ZXN0KSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRva2VuJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZE1lc3NhZ2Uoe1xuXHRcdFx0Z3Vlc3QsXG5cdFx0XHRtZXNzYWdlOiB7XG5cdFx0XHRcdF9pZCxcblx0XHRcdFx0cmlkLFxuXHRcdFx0XHRtc2csXG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9LFxuXHRcdFx0YWdlbnRcblx0XHR9KTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEREUFJhdGVMaW1pdGVyICovXG5pbXBvcnQgZG5zIGZyb20gJ2Rucyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScoZGF0YSkge1xuXHRcdGNoZWNrKGRhdGEsIHtcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdGVtYWlsOiBTdHJpbmcsXG5cdFx0XHRtZXNzYWdlOiBTdHJpbmdcblx0XHR9KTtcblxuXHRcdGlmICghUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJykpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBoZWFkZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9IZWFkZXInKSB8fCAnJyk7XG5cdFx0Y29uc3QgZm9vdGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfRm9vdGVyJykgfHwgJycpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZSA9IChgJHsgZGF0YS5tZXNzYWdlIH1gKS5yZXBsYWNlKC8oW14+XFxyXFxuXT8pKFxcclxcbnxcXG5cXHJ8XFxyfFxcbikvZywgJyQxJyArICc8YnI+JyArICckMicpO1xuXG5cdFx0Y29uc3QgaHRtbCA9IGBcblx0XHRcdDxoMT5OZXcgbGl2ZWNoYXQgbWVzc2FnZTwvaDE+XG5cdFx0XHQ8cD48c3Ryb25nPlZpc2l0b3IgbmFtZTo8L3N0cm9uZz4gJHsgZGF0YS5uYW1lIH08L3A+XG5cdFx0XHQ8cD48c3Ryb25nPlZpc2l0b3IgZW1haWw6PC9zdHJvbmc+ICR7IGRhdGEuZW1haWwgfTwvcD5cblx0XHRcdDxwPjxzdHJvbmc+TWVzc2FnZTo8L3N0cm9uZz48YnI+JHsgbWVzc2FnZSB9PC9wPmA7XG5cblx0XHRsZXQgZnJvbUVtYWlsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKS5tYXRjaCgvXFxiW0EtWjAtOS5fJSstXStAKD86W0EtWjAtOS1dK1xcLikrW0EtWl17Miw0fVxcYi9pKTtcblxuXHRcdGlmIChmcm9tRW1haWwpIHtcblx0XHRcdGZyb21FbWFpbCA9IGZyb21FbWFpbFswXTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZnJvbUVtYWlsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3ZhbGlkYXRlX29mZmxpbmVfZW1haWwnKSkge1xuXHRcdFx0Y29uc3QgZW1haWxEb21haW4gPSBkYXRhLmVtYWlsLnN1YnN0cihkYXRhLmVtYWlsLmxhc3RJbmRleE9mKCdAJykgKyAxKTtcblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0TWV0ZW9yLndyYXBBc3luYyhkbnMucmVzb2x2ZU14KShlbWFpbERvbWFpbik7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZW1haWwtYWRkcmVzcycsICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScgfSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdEVtYWlsLnNlbmQoe1xuXHRcdFx0XHR0bzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X29mZmxpbmVfZW1haWwnKSxcblx0XHRcdFx0ZnJvbTogYCR7IGRhdGEubmFtZSB9IC0gJHsgZGF0YS5lbWFpbCB9IDwkeyBmcm9tRW1haWwgfT5gLFxuXHRcdFx0XHRyZXBseVRvOiBgJHsgZGF0YS5uYW1lIH0gPCR7IGRhdGEuZW1haWwgfT5gLFxuXHRcdFx0XHRzdWJqZWN0OiBgTGl2ZWNoYXQgb2ZmbGluZSBtZXNzYWdlIGZyb20gJHsgZGF0YS5uYW1lIH06ICR7IChgJHsgZGF0YS5tZXNzYWdlIH1gKS5zdWJzdHJpbmcoMCwgMjApIH1gLFxuXHRcdFx0XHRodG1sOiBoZWFkZXIgKyBodG1sICsgZm9vdGVyXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0Lm9mZmxpbmVNZXNzYWdlJywgZGF0YSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG5cbkREUFJhdGVMaW1pdGVyLmFkZFJ1bGUoe1xuXHR0eXBlOiAnbWV0aG9kJyxcblx0bmFtZTogJ2xpdmVjaGF0OnNlbmRPZmZsaW5lTWVzc2FnZScsXG5cdGNvbm5lY3Rpb25JZCgpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSwgMSwgNTAwMCk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJyh0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlID0gdHJ1ZSkge1xuXHRcdGNvbnN0IGN1c3RvbUZpZWxkID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZC5maW5kT25lQnlJZChrZXkpO1xuXHRcdGlmIChjdXN0b21GaWVsZCkge1xuXHRcdFx0aWYgKGN1c3RvbUZpZWxkLnNjb3BlID09PSAncm9vbScpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBTYXZlIGluIHVzZXJcblx0XHRcdFx0cmV0dXJuIExpdmVjaGF0VmlzaXRvcnMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbih0b2tlbiwga2V5LCB2YWx1ZSwgb3ZlcndyaXRlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzZXREZXBhcnRtZW50Rm9yVmlzaXRvcicoeyB0b2tlbiwgZGVwYXJ0bWVudCB9ID0ge30pIHtcblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnNldERlcGFydG1lbnRGb3JHdWVzdC5jYWxsKHRoaXMsIHtcblx0XHRcdHRva2VuLFxuXHRcdFx0ZGVwYXJ0bWVudFxuXHRcdH0pO1xuXG5cdFx0Ly8gdXBkYXRlIHZpc2l0ZWQgcGFnZSBoaXN0b3J5IHRvIG5vdCBleHBpcmVcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFBhZ2VWaXNpdGVkLmtlZXBIaXN0b3J5Rm9yVG9rZW4odG9rZW4pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5ldy1jYXA6IFsyLCB7XCJjYXBJc05ld0V4Y2VwdGlvbnNcIjogW1wiTUQ1XCJdfV0gKi9cbk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnN0YXJ0VmlkZW9DYWxsJyhyb29tSWQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OmNsb3NlQnlWaXNpdG9yJyB9KTtcblx0XHR9XG5cblx0XHRjb25zdCBndWVzdCA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRjb25zdCBtZXNzYWdlID0ge1xuXHRcdFx0X2lkOiBSYW5kb20uaWQoKSxcblx0XHRcdHJpZDogcm9vbUlkIHx8IFJhbmRvbS5pZCgpLFxuXHRcdFx0bXNnOiAnJyxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpXG5cdFx0fTtcblxuXHRcdGNvbnN0IHsgcm9vbSB9ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXRSb29tKGd1ZXN0LCBtZXNzYWdlLCB7IGppdHNpVGltZW91dDogbmV3IERhdGUoRGF0ZS5ub3coKSArIDM2MDAgKiAxMDAwKSB9KTtcblx0XHRtZXNzYWdlLnJpZCA9IHJvb20uX2lkO1xuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcignbGl2ZWNoYXRfdmlkZW9fY2FsbCcsIHJvb20uX2lkLCAnJywgZ3Vlc3QsIHtcblx0XHRcdGFjdGlvbkxpbmtzOiBbXG5cdFx0XHRcdHsgaWNvbjogJ2ljb24tdmlkZW9jYW0nLCBpMThuTGFiZWw6ICdBY2NlcHQnLCBtZXRob2RfaWQ6ICdjcmVhdGVMaXZlY2hhdENhbGwnLCBwYXJhbXM6ICcnIH0sXG5cdFx0XHRcdHsgaWNvbjogJ2ljb24tY2FuY2VsJywgaTE4bkxhYmVsOiAnRGVjbGluZScsIG1ldGhvZF9pZDogJ2RlbnlMaXZlY2hhdENhbGwnLCBwYXJhbXM6ICcnIH1cblx0XHRcdF1cblx0XHR9KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRyb29tSWQ6IHJvb20uX2lkLFxuXHRcdFx0ZG9tYWluOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnSml0c2lfRG9tYWluJyksXG5cdFx0XHRqaXRzaVJvb206IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdKaXRzaV9VUkxfUm9vbV9QcmVmaXgnKSArIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpICsgcm9vbUlkXG5cdFx0fTtcblx0fVxufSk7XG5cbiIsIi8qIGVzbGludCBuZXctY2FwOiBbMiwge1wiY2FwSXNOZXdFeGNlcHRpb25zXCI6IFtcIk1hdGNoLk9wdGlvbmFsXCJdfV0gKi9cblxuaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi4vbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDp0cmFuc2ZlcicodHJhbnNmZXJEYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dHJhbnNmZXInIH0pO1xuXHRcdH1cblxuXHRcdGNoZWNrKHRyYW5zZmVyRGF0YSwge1xuXHRcdFx0cm9vbUlkOiBTdHJpbmcsXG5cdFx0XHR1c2VySWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRkZXBhcnRtZW50SWQ6IE1hdGNoLk9wdGlvbmFsKFN0cmluZylcblx0XHR9KTtcblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZCh0cmFuc2ZlckRhdGEucm9vbUlkKTtcblxuXHRcdGNvbnN0IGd1ZXN0ID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZChyb29tLnYuX2lkKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xICYmICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUoTWV0ZW9yLnVzZXJJZCgpLCAnbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dHJhbnNmZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LnRyYW5zZmVyKHJvb20sIGd1ZXN0LCB0cmFuc2ZlckRhdGEpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgSFRUUCAqL1xuY29uc3QgcG9zdENhdGNoRXJyb3IgPSBNZXRlb3Iud3JhcEFzeW5jKGZ1bmN0aW9uKHVybCwgb3B0aW9ucywgcmVzb2x2ZSkge1xuXHRIVFRQLnBvc3QodXJsLCBvcHRpb25zLCBmdW5jdGlvbihlcnIsIHJlcykge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdHJlc29sdmUobnVsbCwgZXJyLnJlc3BvbnNlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzb2x2ZShudWxsLCByZXMpO1xuXHRcdH1cblx0fSk7XG59KTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6d2ViaG9va1Rlc3QnKCkge1xuXHRcdHRoaXMudW5ibG9jaygpO1xuXG5cdFx0Y29uc3Qgc2FtcGxlRGF0YSA9IHtcblx0XHRcdHR5cGU6ICdMaXZlY2hhdFNlc3Npb24nLFxuXHRcdFx0X2lkOiAnZmFzZDZmNWE0c2Q2ZjhhNHNkZicsXG5cdFx0XHRsYWJlbDogJ3RpdGxlJyxcblx0XHRcdHRvcGljOiAnYXNpb2RvamYnLFxuXHRcdFx0Y29kZTogMTIzMTIzLFxuXHRcdFx0Y3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuXHRcdFx0bGFzdE1lc3NhZ2VBdDogbmV3IERhdGUoKSxcblx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0J3RhZzEnLFxuXHRcdFx0XHQndGFnMicsXG5cdFx0XHRcdCd0YWczJ1xuXHRcdFx0XSxcblx0XHRcdGN1c3RvbUZpZWxkczoge1xuXHRcdFx0XHRwcm9kdWN0SWQ6ICcxMjM0NTYnXG5cdFx0XHR9LFxuXHRcdFx0dmlzaXRvcjoge1xuXHRcdFx0XHRfaWQ6ICcnLFxuXHRcdFx0XHRuYW1lOiAndmlzaXRvciBuYW1lJyxcblx0XHRcdFx0dXNlcm5hbWU6ICd2aXNpdG9yLXVzZXJuYW1lJyxcblx0XHRcdFx0ZGVwYXJ0bWVudDogJ2RlcGFydG1lbnQnLFxuXHRcdFx0XHRlbWFpbDogJ2VtYWlsQGFkZHJlc3MuY29tJyxcblx0XHRcdFx0cGhvbmU6ICcxOTI4NzMxOTI4NzMnLFxuXHRcdFx0XHRpcDogJzEyMy40NTYuNy44OScsXG5cdFx0XHRcdGJyb3dzZXI6ICdDaHJvbWUnLFxuXHRcdFx0XHRvczogJ0xpbnV4Jyxcblx0XHRcdFx0Y3VzdG9tRmllbGRzOiB7XG5cdFx0XHRcdFx0Y3VzdG9tZXJJZDogJzEyMzQ1Nidcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGFnZW50OiB7XG5cdFx0XHRcdF9pZDogJ2FzZGY4OWFzNmRmOCcsXG5cdFx0XHRcdHVzZXJuYW1lOiAnYWdlbnQudXNlcm5hbWUnLFxuXHRcdFx0XHRuYW1lOiAnQWdlbnQgTmFtZScsXG5cdFx0XHRcdGVtYWlsOiAnYWdlbnRAZW1haWwuY29tJ1xuXHRcdFx0fSxcblx0XHRcdG1lc3NhZ2VzOiBbe1xuXHRcdFx0XHR1c2VybmFtZTogJ3Zpc2l0b3ItdXNlcm5hbWUnLFxuXHRcdFx0XHRtc2c6ICdtZXNzYWdlIGNvbnRlbnQnLFxuXHRcdFx0XHR0czogbmV3IERhdGUoKVxuXHRcdFx0fSwge1xuXHRcdFx0XHR1c2VybmFtZTogJ2FnZW50LnVzZXJuYW1lJyxcblx0XHRcdFx0YWdlbnRJZDogJ2FzZGY4OWFzNmRmOCcsXG5cdFx0XHRcdG1zZzogJ21lc3NhZ2UgY29udGVudCBmcm9tIGFnZW50Jyxcblx0XHRcdFx0dHM6IG5ldyBEYXRlKClcblx0XHRcdH1dXG5cdFx0fTtcblxuXHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdYLVJvY2tldENoYXQtTGl2ZWNoYXQtVG9rZW4nOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJylcblx0XHRcdH0sXG5cdFx0XHRkYXRhOiBzYW1wbGVEYXRhXG5cdFx0fTtcblxuXHRcdGNvbnN0IHJlc3BvbnNlID0gcG9zdENhdGNoRXJyb3IoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3dlYmhvb2tVcmwnKSwgb3B0aW9ucyk7XG5cblx0XHRjb25zb2xlLmxvZygncmVzcG9uc2UgLT4nLCByZXNwb25zZSk7XG5cblx0XHRpZiAocmVzcG9uc2UgJiYgcmVzcG9uc2Uuc3RhdHVzQ29kZSAmJiByZXNwb25zZS5zdGF0dXNDb2RlID09PSAyMDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXdlYmhvb2stcmVzcG9uc2UnKTtcblx0XHR9XG5cdH1cbn0pO1xuXG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDp0YWtlSW5xdWlyeScoaW5xdWlyeUlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6dGFrZUlucXVpcnknIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlucXVpcnkgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuZmluZE9uZUJ5SWQoaW5xdWlyeUlkKTtcblxuXHRcdGlmICghaW5xdWlyeSB8fCBpbnF1aXJ5LnN0YXR1cyA9PT0gJ3Rha2VuJykge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnSW5xdWlyeSBhbHJlYWR5IHRha2VuJywgeyBtZXRob2Q6ICdsaXZlY2hhdDp0YWtlSW5xdWlyeScgfSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cblx0XHRjb25zdCBhZ2VudCA9IHtcblx0XHRcdGFnZW50SWQ6IHVzZXIuX2lkLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHR9O1xuXG5cdFx0Ly8gYWRkIHN1YnNjcmlwdGlvblxuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRyaWQ6IGlucXVpcnkucmlkLFxuXHRcdFx0bmFtZTogaW5xdWlyeS5uYW1lLFxuXHRcdFx0YWxlcnQ6IHRydWUsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0dW5yZWFkOiAxLFxuXHRcdFx0dXNlck1lbnRpb25zOiAxLFxuXHRcdFx0Z3JvdXBNZW50aW9uczogMCxcblx0XHRcdGNvZGU6IGlucXVpcnkuY29kZSxcblx0XHRcdHU6IHtcblx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHR0OiAnbCcsXG5cdFx0XHRkZXNrdG9wTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRtb2JpbGVQdXNoTm90aWZpY2F0aW9uczogJ2FsbCcsXG5cdFx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdFx0fTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmluc2VydChzdWJzY3JpcHRpb25EYXRhKTtcblxuXHRcdC8vIHVwZGF0ZSByb29tXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGlucXVpcnkucmlkKTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLmNoYW5nZUFnZW50QnlSb29tSWQoaW5xdWlyeS5yaWQsIGFnZW50KTtcblxuXHRcdHJvb20uc2VydmVkQnkgPSB7XG5cdFx0XHRfaWQ6IGFnZW50LmFnZW50SWQsXG5cdFx0XHR1c2VybmFtZTogYWdlbnQudXNlcm5hbWVcblx0XHR9O1xuXG5cdFx0Ly8gbWFyayBpbnF1aXJ5IGFzIHRha2VuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LnRha2VJbnF1aXJ5KGlucXVpcnkuX2lkKTtcblxuXHRcdC8vIHJlbW92ZSBzZW5kaW5nIG1lc3NhZ2UgZnJvbSBndWVzdCB3aWRnZXRcblx0XHQvLyBkb250IGNoZWNrIGlmIHNldHRpbmcgaXMgdHJ1ZSwgYmVjYXVzZSBpZiBzZXR0aW5nd2FzIHN3aXRjaGVkIG9mZiBpbmJldHdlZW4gIGd1ZXN0IGVudGVyZWQgcG9vbCxcblx0XHQvLyBhbmQgaW5xdWlyeSBiZWluZyB0YWtlbiwgbWVzc2FnZSB3b3VsZCBub3QgYmUgc3dpdGNoZWQgb2ZmLlxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZUNvbW1hbmRXaXRoUm9vbUlkQW5kVXNlcignY29ubmVjdGVkJywgcm9vbS5faWQsIHVzZXIpO1xuXG5cdFx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5zdHJlYW0uZW1pdChyb29tLl9pZCwge1xuXHRcdFx0dHlwZTogJ2FnZW50RGF0YScsXG5cdFx0XHRkYXRhOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZClcblx0XHR9KTtcblxuXHRcdC8vIHJldHVybiByb29tIGNvcnJlc3BvbmRpbmcgdG8gaW5xdWlyeSAoZm9yIHJlZGlyZWN0aW5nIGFnZW50IHRvIHRoZSByb29tIHJvdXRlKVxuXHRcdHJldHVybiByb29tO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2xpdmVjaGF0OnJldHVybkFzSW5xdWlyeScocmlkKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICd2aWV3LWwtcm9vbScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6c2F2ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdC8vIC8vZGVsZXRlIGFnZW50IGFuZCByb29tIHN1YnNjcmlwdGlvblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMucmVtb3ZlQnlSb29tSWQocmlkKTtcblxuXHRcdC8vIHJlbW92ZSB1c2VyIGZyb20gcm9vbVxuXHRcdGNvbnN0IHVzZXJuYW1lID0gTWV0ZW9yLnVzZXIoKS51c2VybmFtZTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnJlbW92ZVVzZXJuYW1lQnlJZChyaWQsIHVzZXJuYW1lKTtcblxuXHRcdC8vIGZpbmQgaW5xdWlyeSBjb3JyZXNwb25kaW5nIHRvIHJvb21cblx0XHRjb25zdCBpbnF1aXJ5ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5LmZpbmRPbmUoe3JpZH0pO1xuXG5cdFx0Ly8gbWFyayBpbnF1aXJ5IGFzIG9wZW5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRJbnF1aXJ5Lm9wZW5JbnF1aXJ5KGlucXVpcnkuX2lkKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdsaXZlY2hhdDpzYXZlT2ZmaWNlSG91cnMnKGRheSwgc3RhcnQsIGZpbmlzaCwgb3Blbikge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0T2ZmaWNlSG91ci51cGRhdGVIb3VycyhkYXksIHN0YXJ0LCBmaW5pc2gsIG9wZW4pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgZW1haWxTZXR0aW5ncywgRERQUmF0ZUxpbWl0ZXIgKi9cbi8qIFNlbmQgYSB0cmFuc2NyaXB0IG9mIHRoZSByb29tIGNvbnZlcnN0YXRpb24gdG8gdGhlIGdpdmVuIGVtYWlsICovXG5pbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbmltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbGl2ZWNoYXQ6c2VuZFRyYW5zY3JpcHQnKHRva2VuLCByaWQsIGVtYWlsKSB7XG5cdFx0Y2hlY2socmlkLCBTdHJpbmcpO1xuXHRcdGNoZWNrKGVtYWlsLCBTdHJpbmcpO1xuXG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cblx0XHRjb25zdCB2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5nZXRWaXNpdG9yQnlUb2tlbih0b2tlbik7XG5cdFx0Y29uc3QgdXNlckxhbmd1YWdlID0gKHZpc2l0b3IgJiYgdmlzaXRvci5sYW5ndWFnZSkgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJztcblxuXHRcdC8vIGFsbG93IHRvIG9ubHkgdXNlciB0byBzZW5kIHRyYW5zY3JpcHRzIGZyb20gdGhlaXIgb3duIGNoYXRzXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udCAhPT0gJ2wnIHx8ICFyb29tLnYgfHwgcm9vbS52LnRva2VuICE9PSB0b2tlbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZFZpc2libGVCeVJvb21JZChyaWQsIHsgc29ydDogeyAndHMnIDogMSB9fSk7XG5cdFx0Y29uc3QgaGVhZGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfSGVhZGVyJykgfHwgJycpO1xuXHRcdGNvbnN0IGZvb3RlciA9IFJvY2tldENoYXQucGxhY2Vob2xkZXJzLnJlcGxhY2UoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0VtYWlsX0Zvb3RlcicpIHx8ICcnKTtcblxuXHRcdGxldCBodG1sID0gJzxkaXY+IDxocj4nO1xuXHRcdG1lc3NhZ2VzLmZvckVhY2gobWVzc2FnZSA9PiB7XG5cdFx0XHRpZiAobWVzc2FnZS50ICYmIFsnY29tbWFuZCcsICdsaXZlY2hhdC1jbG9zZScsICdsaXZlY2hhdF92aWRlb19jYWxsJ10uaW5kZXhPZihtZXNzYWdlLnQpICE9PSAtMSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGxldCBhdXRob3I7XG5cdFx0XHRpZiAobWVzc2FnZS51Ll9pZCA9PT0gdmlzaXRvci5faWQpIHtcblx0XHRcdFx0YXV0aG9yID0gVEFQaTE4bi5fXygnWW91JywgeyBsbmc6IHVzZXJMYW5ndWFnZSB9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGF1dGhvciA9IG1lc3NhZ2UudS51c2VybmFtZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZGF0ZXRpbWUgPSBtb21lbnQobWVzc2FnZS50cykubG9jYWxlKHVzZXJMYW5ndWFnZSkuZm9ybWF0KCdMTEwnKTtcblx0XHRcdGNvbnN0IHNpbmdsZU1lc3NhZ2UgPSBgXG5cdFx0XHRcdDxwPjxzdHJvbmc+JHsgYXV0aG9yIH08L3N0cm9uZz4gIDxlbT4keyBkYXRldGltZSB9PC9lbT48L3A+XG5cdFx0XHRcdDxwPiR7IG1lc3NhZ2UubXNnIH08L3A+XG5cdFx0XHRgO1xuXHRcdFx0aHRtbCA9IGh0bWwgKyBzaW5nbGVNZXNzYWdlO1xuXHRcdH0pO1xuXG5cdFx0aHRtbCA9IGAkeyBodG1sIH08L2Rpdj5gO1xuXG5cdFx0bGV0IGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJykubWF0Y2goL1xcYltBLVowLTkuXyUrLV0rQCg/OltBLVowLTktXStcXC4pK1tBLVpdezIsNH1cXGIvaSk7XG5cblx0XHRpZiAoZnJvbUVtYWlsKSB7XG5cdFx0XHRmcm9tRW1haWwgPSBmcm9tRW1haWxbMF07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZyb21FbWFpbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGcm9tX0VtYWlsJyk7XG5cdFx0fVxuXG5cdFx0ZW1haWxTZXR0aW5ncyA9IHtcblx0XHRcdHRvOiBlbWFpbCxcblx0XHRcdGZyb206IGZyb21FbWFpbCxcblx0XHRcdHJlcGx5VG86IGZyb21FbWFpbCxcblx0XHRcdHN1YmplY3Q6IFRBUGkxOG4uX18oJ1RyYW5zY3JpcHRfb2ZfeW91cl9saXZlY2hhdF9jb252ZXJzYXRpb24nLCB7IGxuZzogdXNlckxhbmd1YWdlIH0pLFxuXHRcdFx0aHRtbDogaGVhZGVyICsgaHRtbCArIGZvb3RlclxuXHRcdH07XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0RW1haWwuc2VuZChlbWFpbFNldHRpbmdzKTtcblx0XHR9KTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNlbmRUcmFuc2NyaXB0JywgbWVzc2FnZXMsIGVtYWlsKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcblxuRERQUmF0ZUxpbWl0ZXIuYWRkUnVsZSh7XG5cdHR5cGU6ICdtZXRob2QnLFxuXHRuYW1lOiAnbGl2ZWNoYXQ6c2VuZFRyYW5zY3JpcHQnLFxuXHRjb25uZWN0aW9uSWQoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn0sIDEsIDUwMDApO1xuIiwiLyoqXG4gKiBTZXRzIGFuIHVzZXIgYXMgKG5vbilvcGVyYXRvclxuICogQHBhcmFtIHtzdHJpbmd9IF9pZCAtIFVzZXIncyBfaWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gb3BlcmF0b3IgLSBGbGFnIHRvIHNldCBhcyBvcGVyYXRvciBvciBub3RcbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IgPSBmdW5jdGlvbihfaWQsIG9wZXJhdG9yKSB7XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRvcGVyYXRvclxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy51cGRhdGUoX2lkLCB1cGRhdGUpO1xufTtcblxuLyoqXG4gKiBHZXRzIGFsbCBvbmxpbmUgYWdlbnRzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0c3RhdHVzOiB7XG5cdFx0XHQkZXhpc3RzOiB0cnVlLFxuXHRcdFx0JG5lOiAnb2ZmbGluZSdcblx0XHR9LFxuXHRcdHN0YXR1c0xpdmVjaGF0OiAnYXZhaWxhYmxlJyxcblx0XHRyb2xlczogJ2xpdmVjaGF0LWFnZW50J1xuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuLyoqXG4gKiBGaW5kIGFuIG9ubGluZSBhZ2VudCBieSBoaXMgdXNlcm5hbWVcbiAqIEByZXR1cm5cbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZU9ubGluZUFnZW50QnlVc2VybmFtZSA9IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHVzZXJuYW1lLFxuXHRcdHN0YXR1czoge1xuXHRcdFx0JGV4aXN0czogdHJ1ZSxcblx0XHRcdCRuZTogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHRzdGF0dXNMaXZlY2hhdDogJ2F2YWlsYWJsZScsXG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogR2V0cyBhbGwgYWdlbnRzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRBZ2VudHMgPSBmdW5jdGlvbigpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cm9sZXM6ICdsaXZlY2hhdC1hZ2VudCdcblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcbn07XG5cbi8qKlxuICogRmluZCBvbmxpbmUgdXNlcnMgZnJvbSBhIGxpc3RcbiAqIEBwYXJhbSB7YXJyYXl9IHVzZXJMaXN0IC0gYXJyYXkgb2YgdXNlcm5hbWVzXG4gKiBAcmV0dXJuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVVc2VyRnJvbUxpc3QgPSBmdW5jdGlvbih1c2VyTGlzdCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnLFxuXHRcdHVzZXJuYW1lOiB7XG5cdFx0XHQkaW46IFtdLmNvbmNhdCh1c2VyTGlzdClcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG4vKipcbiAqIEdldCBuZXh0IHVzZXIgYWdlbnQgaW4gb3JkZXJcbiAqIEByZXR1cm4ge29iamVjdH0gVXNlciBmcm9tIGRiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldE5leHRBZ2VudCA9IGZ1bmN0aW9uKCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRzdGF0dXM6IHtcblx0XHRcdCRleGlzdHM6IHRydWUsXG5cdFx0XHQkbmU6ICdvZmZsaW5lJ1xuXHRcdH0sXG5cdFx0c3RhdHVzTGl2ZWNoYXQ6ICdhdmFpbGFibGUnLFxuXHRcdHJvbGVzOiAnbGl2ZWNoYXQtYWdlbnQnXG5cdH07XG5cblx0Y29uc3QgY29sbGVjdGlvbk9iaiA9IHRoaXMubW9kZWwucmF3Q29sbGVjdGlvbigpO1xuXHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhjb2xsZWN0aW9uT2JqLmZpbmRBbmRNb2RpZnksIGNvbGxlY3Rpb25PYmopO1xuXG5cdGNvbnN0IHNvcnQgPSB7XG5cdFx0bGl2ZWNoYXRDb3VudDogMSxcblx0XHR1c2VybmFtZTogMVxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkaW5jOiB7XG5cdFx0XHRsaXZlY2hhdENvdW50OiAxXG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IHVzZXIgPSBmaW5kQW5kTW9kaWZ5KHF1ZXJ5LCBzb3J0LCB1cGRhdGUpO1xuXHRpZiAodXNlciAmJiB1c2VyLnZhbHVlKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGFnZW50SWQ6IHVzZXIudmFsdWUuX2lkLFxuXHRcdFx0dXNlcm5hbWU6IHVzZXIudmFsdWUudXNlcm5hbWVcblx0XHR9O1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG59O1xuXG4vKipcbiAqIENoYW5nZSB1c2VyJ3MgbGl2ZWNoYXQgc3RhdHVzXG4gKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzID0gZnVuY3Rpb24odXNlcklkLCBzdGF0dXMpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0J19pZCc6IHVzZXJJZFxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHQnc3RhdHVzTGl2ZWNoYXQnOiBzdGF0dXNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuLyoqXG4gKiBjaGFuZ2UgYWxsIGxpdmVjaGF0IGFnZW50cyBsaXZlY2hhdCBzdGF0dXMgdG8gXCJub3QtYXZhaWxhYmxlXCJcbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuY2xvc2VPZmZpY2UgPSBmdW5jdGlvbigpIHtcblx0c2VsZiA9IHRoaXM7XG5cdHNlbGYuZmluZEFnZW50cygpLmZvckVhY2goZnVuY3Rpb24oYWdlbnQpIHtcblx0XHRzZWxmLnNldExpdmVjaGF0U3RhdHVzKGFnZW50Ll9pZCwgJ25vdC1hdmFpbGFibGUnKTtcblx0fSk7XG59O1xuXG4vKipcbiAqIGNoYW5nZSBhbGwgbGl2ZWNoYXQgYWdlbnRzIGxpdmVjaGF0IHN0YXR1cyB0byBcImF2YWlsYWJsZVwiXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLm9wZW5PZmZpY2UgPSBmdW5jdGlvbigpIHtcblx0c2VsZiA9IHRoaXM7XG5cdHNlbGYuZmluZEFnZW50cygpLmZvckVhY2goZnVuY3Rpb24oYWdlbnQpIHtcblx0XHRzZWxmLnNldExpdmVjaGF0U3RhdHVzKGFnZW50Ll9pZCwgJ2F2YWlsYWJsZScpO1xuXHR9KTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyA9IGZ1bmN0aW9uKGFnZW50SWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiBhZ2VudElkXG5cdH07XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRmaWVsZHM6IHtcblx0XHRcdG5hbWU6IDEsXG5cdFx0XHR1c2VybmFtZTogMSxcblx0XHRcdGN1c3RvbUZpZWxkczogMVxuXHRcdH1cblx0fTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnKSkge1xuXHRcdG9wdGlvbnMuZmllbGRzLmVtYWlscyA9IDE7XG5cdH1cblxuXHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cbiAqL1xuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlU3VydmV5RmVlZGJhY2tCeUlkID0gZnVuY3Rpb24oX2lkLCBzdXJ2ZXlGZWVkYmFjaykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c3VydmV5RmVlZGJhY2tcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudXBkYXRlTGl2ZWNoYXREYXRhQnlUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCBrZXksIHZhbHVlLCBvdmVyd3JpdGUgPSB0cnVlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2LnRva2VuJzogdG9rZW4sXG5cdFx0b3BlbjogdHJ1ZVxuXHR9O1xuXG5cdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMuZmluZE9uZShxdWVyeSwgeyBmaWVsZHM6IHsgbGl2ZWNoYXREYXRhOiAxIH0gfSk7XG5cdFx0aWYgKHJvb20ubGl2ZWNoYXREYXRhICYmIHR5cGVvZiByb29tLmxpdmVjaGF0RGF0YVtrZXldICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdFtgbGl2ZWNoYXREYXRhLiR7IGtleSB9YF06IHZhbHVlXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdCA9IGZ1bmN0aW9uKGZpbHRlciA9IHt9LCBvZmZzZXQgPSAwLCBsaW1pdCA9IDIwKSB7XG5cdGNvbnN0IHF1ZXJ5ID0gXy5leHRlbmQoZmlsdGVyLCB7XG5cdFx0dDogJ2wnXG5cdH0pO1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnksIHsgc29ydDogeyB0czogLSAxIH0sIG9mZnNldCwgbGltaXQgfSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kTGl2ZWNoYXRCeUNvZGUgPSBmdW5jdGlvbihjb2RlLCBmaWVsZHMpIHtcblx0Y29kZSA9IHBhcnNlSW50KGNvZGUpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuXHRpZiAoZmllbGRzKSB7XG5cdFx0b3B0aW9ucy5maWVsZHMgPSBmaWVsZHM7XG5cdH1cblxuXHQvLyBpZiAodGhpcy51c2VDYWNoZSkge1xuXHQvLyBcdHJldHVybiB0aGlzLmNhY2hlLmZpbmRCeUluZGV4KCd0LGNvZGUnLCBbJ2wnLCBjb2RlXSwgb3B0aW9ucykuZmV0Y2goKTtcblx0Ly8gfVxuXG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdHQ6ICdsJyxcblx0XHRjb2RlXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcbiAqIEByZXR1cm4ge3N0cmluZ30gVGhlIG5leHQgdmlzaXRvciBuYW1lXG4gKi9cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmdldE5leHRMaXZlY2hhdFJvb21Db2RlID0gZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHNldHRpbmdzUmF3ID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MubW9kZWwucmF3Q29sbGVjdGlvbigpO1xuXHRjb25zdCBmaW5kQW5kTW9kaWZ5ID0gTWV0ZW9yLndyYXBBc3luYyhzZXR0aW5nc1Jhdy5maW5kQW5kTW9kaWZ5LCBzZXR0aW5nc1Jhdyk7XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiAnTGl2ZWNoYXRfUm9vbV9Db3VudCdcblx0fTtcblxuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGluYzoge1xuXHRcdFx0dmFsdWU6IDFcblx0XHR9XG5cdH07XG5cblx0Y29uc3QgbGl2ZWNoYXRDb3VudCA9IGZpbmRBbmRNb2RpZnkocXVlcnksIG51bGwsIHVwZGF0ZSk7XG5cblx0cmV0dXJuIGxpdmVjaGF0Q291bnQudmFsdWUudmFsdWU7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuID0gZnVuY3Rpb24odmlzaXRvclRva2VuLCBvcHRpb25zKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdG9wZW46IHRydWUsXG5cdFx0J3YudG9rZW4nOiB2aXNpdG9yVG9rZW5cblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHZpc2l0b3JUb2tlbikge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHQndi50b2tlbic6IHZpc2l0b3JUb2tlblxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5VmlzaXRvcklkID0gZnVuY3Rpb24odmlzaXRvcklkKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2Ll9pZCc6IHZpc2l0b3JJZFxuXHR9O1xuXG5cdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZU9wZW5CeVZpc2l0b3JUb2tlbiA9IGZ1bmN0aW9uKHRva2VuLCByb29tSWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiByb29tSWQsXG5cdFx0b3BlbjogdHJ1ZSxcblx0XHQndi50b2tlbic6IHRva2VuXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZXNwb25zZUJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCByZXNwb25zZSkge1xuXHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdF9pZDogcm9vbUlkXG5cdH0sIHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZXNwb25zZUJ5OiB7XG5cdFx0XHRcdF9pZDogcmVzcG9uc2UudXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiByZXNwb25zZS51c2VyLnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0cmVzcG9uc2VEYXRlOiByZXNwb25zZS5yZXNwb25zZURhdGUsXG5cdFx0XHRyZXNwb25zZVRpbWU6IHJlc3BvbnNlLnJlc3BvbnNlVGltZVxuXHRcdH0sXG5cdFx0JHVuc2V0OiB7XG5cdFx0XHR3YWl0aW5nUmVzcG9uc2U6IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2xvc2VCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgY2xvc2VJbmZvKSB7XG5cdHJldHVybiB0aGlzLnVwZGF0ZSh7XG5cdFx0X2lkOiByb29tSWRcblx0fSwge1xuXHRcdCRzZXQ6IHtcblx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdGNsb3NlZEJ5OiBjbG9zZUluZm8uY2xvc2VkQnksXG5cdFx0XHRjbG9zZWRBdDogY2xvc2VJbmZvLmNsb3NlZEF0LFxuXHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uLFxuXHRcdFx0J3Yuc3RhdHVzJzogJ29mZmxpbmUnXG5cdFx0fSxcblx0XHQkdW5zZXQ6IHtcblx0XHRcdG9wZW46IDFcblx0XHR9XG5cdH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TGFiZWxCeVJvb21JZCA9IGZ1bmN0aW9uKHJvb21JZCwgbGFiZWwpIHtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkOiByb29tSWQgfSwgeyAkc2V0OiB7IGxhYmVsIH0gfSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5QWdlbnQgPSBmdW5jdGlvbih1c2VySWQpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0b3BlbjogdHJ1ZSxcblx0XHQnc2VydmVkQnkuX2lkJzogdXNlcklkXG5cdH07XG5cblx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCBuZXdBZ2VudCkge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWQ6IHJvb21JZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0c2VydmVkQnk6IHtcblx0XHRcdFx0X2lkOiBuZXdBZ2VudC5hZ2VudElkLFxuXHRcdFx0XHR1c2VybmFtZTogbmV3QWdlbnQudXNlcm5hbWVcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlQ1JNRGF0YUJ5Um9vbUlkID0gZnVuY3Rpb24ocm9vbUlkLCBjcm1EYXRhKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZDogcm9vbUlkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRjcm1EYXRhXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnVwZGF0ZVZpc2l0b3JTdGF0dXMgPSBmdW5jdGlvbih0b2tlbiwgc3RhdHVzKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdCd2LnRva2VuJzogdG9rZW4sXG5cdFx0b3BlbjogdHJ1ZVxuXHR9O1xuXG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHQndi5zdGF0dXMnOiBzdGF0dXNcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcbiIsImNsYXNzIExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfZXh0ZXJuYWxfbWVzc2FnZScpO1xuXG5cdFx0aWYgKE1ldGVvci5pc0NsaWVudCkge1xuXHRcdFx0dGhpcy5faW5pdE1vZGVsKCdsaXZlY2hhdF9leHRlcm5hbF9tZXNzYWdlJyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kQnlSb29tSWQocm9vbUlkLCBzb3J0ID0geyB0czogLTEgfSkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyByaWQ6IHJvb21JZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgeyBzb3J0IH0pO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlID0gbmV3IExpdmVjaGF0RXh0ZXJuYWxNZXNzYWdlKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBDdXN0b20gRmllbGRzIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0Q3VzdG9tRmllbGQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9jdXN0b21fZmllbGQnKTtcblx0fVxuXG5cdC8vIEZJTkRcblx0ZmluZE9uZUJ5SWQoX2lkLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRjcmVhdGVPclVwZGF0ZUN1c3RvbUZpZWxkKF9pZCwgZmllbGQsIGxhYmVsLCBzY29wZSwgdmlzaWJpbGl0eSwgZXh0cmFEYXRhKSB7XG5cdFx0Y29uc3QgcmVjb3JkID0ge1xuXHRcdFx0bGFiZWwsXG5cdFx0XHRzY29wZSxcblx0XHRcdHZpc2liaWxpdHlcblx0XHR9O1xuXG5cdFx0Xy5leHRlbmQocmVjb3JkLCBleHRyYURhdGEpO1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlY29yZC5faWQgPSBmaWVsZDtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlY29yZDtcblx0fVxuXG5cdC8vIFJFTU9WRVxuXHRyZW1vdmVCeUlkKF9pZCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0geyBfaWQgfTtcblxuXHRcdHJldHVybiB0aGlzLnJlbW92ZShxdWVyeSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRDdXN0b21GaWVsZCA9IG5ldyBMaXZlY2hhdEN1c3RvbUZpZWxkKCk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoe1xuXHRcdFx0bnVtQWdlbnRzOiAxLFxuXHRcdFx0ZW5hYmxlZDogMVxuXHRcdH0pO1xuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kT25lQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGZpbmRCeURlcGFydG1lbnRJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHsgX2lkIH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudChfaWQsIHsgZW5hYmxlZCwgbmFtZSwgZGVzY3JpcHRpb24sIHNob3dPblJlZ2lzdHJhdGlvbiB9LCBhZ2VudHMpIHtcblx0XHRhZ2VudHMgPSBbXS5jb25jYXQoYWdlbnRzKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHtcblx0XHRcdGVuYWJsZWQsXG5cdFx0XHRuYW1lLFxuXHRcdFx0ZGVzY3JpcHRpb24sXG5cdFx0XHRudW1BZ2VudHM6IGFnZW50cy5sZW5ndGgsXG5cdFx0XHRzaG93T25SZWdpc3RyYXRpb25cblx0XHR9O1xuXG5cdFx0aWYgKF9pZCkge1xuXHRcdFx0dGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiByZWNvcmQgfSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdF9pZCA9IHRoaXMuaW5zZXJ0KHJlY29yZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2F2ZWRBZ2VudHMgPSBfLnBsdWNrKFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kQnlEZXBhcnRtZW50SWQoX2lkKS5mZXRjaCgpLCAnYWdlbnRJZCcpO1xuXHRcdGNvbnN0IGFnZW50c1RvU2F2ZSA9IF8ucGx1Y2soYWdlbnRzLCAnYWdlbnRJZCcpO1xuXG5cdFx0Ly8gcmVtb3ZlIG90aGVyIGFnZW50c1xuXHRcdF8uZGlmZmVyZW5jZShzYXZlZEFnZW50cywgYWdlbnRzVG9TYXZlKS5mb3JFYWNoKChhZ2VudElkKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMucmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKF9pZCwgYWdlbnRJZCk7XG5cdFx0fSk7XG5cblx0XHRhZ2VudHMuZm9yRWFjaCgoYWdlbnQpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5zYXZlQWdlbnQoe1xuXHRcdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHRkZXBhcnRtZW50SWQ6IF9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRjb3VudDogYWdlbnQuY291bnQgPyBwYXJzZUludChhZ2VudC5jb3VudCkgOiAwLFxuXHRcdFx0XHRvcmRlcjogYWdlbnQub3JkZXIgPyBwYXJzZUludChhZ2VudC5vcmRlcikgOiAwXG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBfLmV4dGVuZChyZWNvcmQsIHsgX2lkIH0pO1xuXHR9XG5cblx0Ly8gUkVNT1ZFXG5cdHJlbW92ZUJ5SWQoX2lkKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7IF9pZCB9O1xuXG5cdFx0cmV0dXJuIHRoaXMucmVtb3ZlKHF1ZXJ5KTtcblx0fVxuXG5cdGZpbmRFbmFibGVkV2l0aEFnZW50cygpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdG51bUFnZW50czogeyAkZ3Q6IDAgfSxcblx0XHRcdGVuYWJsZWQ6IHRydWVcblx0XHR9O1xuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnkpO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudCA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnQoKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuLyoqXG4gKiBMaXZlY2hhdCBEZXBhcnRtZW50IG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2RlcGFydG1lbnRfYWdlbnRzJyk7XG5cdH1cblxuXHRmaW5kQnlEZXBhcnRtZW50SWQoZGVwYXJ0bWVudElkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZCh7IGRlcGFydG1lbnRJZCB9KTtcblx0fVxuXG5cdHNhdmVBZ2VudChhZ2VudCkge1xuXHRcdHJldHVybiB0aGlzLnVwc2VydCh7XG5cdFx0XHRhZ2VudElkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0ZGVwYXJ0bWVudElkOiBhZ2VudC5kZXBhcnRtZW50SWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZSxcblx0XHRcdFx0Y291bnQ6IHBhcnNlSW50KGFnZW50LmNvdW50KSxcblx0XHRcdFx0b3JkZXI6IHBhcnNlSW50KGFnZW50Lm9yZGVyKVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlEZXBhcnRtZW50SWRBbmRBZ2VudElkKGRlcGFydG1lbnRJZCwgYWdlbnRJZCkge1xuXHRcdHRoaXMucmVtb3ZlKHsgZGVwYXJ0bWVudElkLCBhZ2VudElkIH0pO1xuXHR9XG5cblx0Z2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3Qgc29ydCA9IHtcblx0XHRcdGNvdW50OiAxLFxuXHRcdFx0b3JkZXI6IDEsXG5cdFx0XHR1c2VybmFtZTogMVxuXHRcdH07XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHRjb3VudDogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBjb2xsZWN0aW9uT2JqID0gdGhpcy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoY29sbGVjdGlvbk9iai5maW5kQW5kTW9kaWZ5LCBjb2xsZWN0aW9uT2JqKTtcblxuXHRcdGNvbnN0IGFnZW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgc29ydCwgdXBkYXRlKTtcblx0XHRpZiAoYWdlbnQgJiYgYWdlbnQudmFsdWUpIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGFnZW50SWQ6IGFnZW50LnZhbHVlLmFnZW50SWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC52YWx1ZS51c2VybmFtZVxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Z2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50SWQpIHtcblx0XHRjb25zdCBhZ2VudHMgPSB0aGlzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50SWQpLmZldGNoKCk7XG5cblx0XHRpZiAoYWdlbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9ubGluZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZVVzZXJGcm9tTGlzdChfLnBsdWNrKGFnZW50cywgJ3VzZXJuYW1lJykpO1xuXG5cdFx0Y29uc3Qgb25saW5lVXNlcm5hbWVzID0gXy5wbHVjayhvbmxpbmVVc2Vycy5mZXRjaCgpLCAndXNlcm5hbWUnKTtcblxuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0ZGVwYXJ0bWVudElkLFxuXHRcdFx0dXNlcm5hbWU6IHtcblx0XHRcdFx0JGluOiBvbmxpbmVVc2VybmFtZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0Y29uc3QgZGVwQWdlbnRzID0gdGhpcy5maW5kKHF1ZXJ5KTtcblxuXHRcdGlmIChkZXBBZ2VudHMpIHtcblx0XHRcdHJldHVybiBkZXBBZ2VudHM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cdH1cblxuXHRmaW5kVXNlcnNJblF1ZXVlKHVzZXJzTGlzdCkge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eSh1c2Vyc0xpc3QpKSB7XG5cdFx0XHRxdWVyeS51c2VybmFtZSA9IHtcblx0XHRcdFx0JGluOiB1c2Vyc0xpc3Rcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0ZGVwYXJ0bWVudElkOiAxLFxuXHRcdFx0XHRjb3VudDogMSxcblx0XHRcdFx0b3JkZXI6IDEsXG5cdFx0XHRcdHVzZXJuYW1lOiAxXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG59XG5cblJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cyA9IG5ldyBMaXZlY2hhdERlcGFydG1lbnRBZ2VudHMoKTtcbiIsIi8qKlxuICogTGl2ZWNoYXQgUGFnZSBWaXNpdGVkIG1vZGVsXG4gKi9cbmNsYXNzIExpdmVjaGF0UGFnZVZpc2l0ZWQgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF9wYWdlX3Zpc2l0ZWQnKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndG9rZW4nOiAxIH0pO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAndHMnOiAxIH0pO1xuXG5cdFx0Ly8ga2VlcCBoaXN0b3J5IGZvciAxIG1vbnRoIGlmIHRoZSB2aXNpdG9yIGRvZXMgbm90IHJlZ2lzdGVyXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHBpcmVBdCc6IDEgfSwgeyBzcGFyc2U6IDEsIGV4cGlyZUFmdGVyU2Vjb25kczogMCB9KTtcblx0fVxuXG5cdHNhdmVCeVRva2VuKHRva2VuLCBwYWdlSW5mbykge1xuXHRcdC8vIGtlZXAgaGlzdG9yeSBvZiB1bnJlZ2lzdGVyZWQgdmlzaXRvcnMgZm9yIDEgbW9udGhcblx0XHRjb25zdCBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzID0gMjU5MjAwMDAwMDtcblxuXHRcdHJldHVybiB0aGlzLmluc2VydCh7XG5cdFx0XHR0b2tlbixcblx0XHRcdHBhZ2U6IHBhZ2VJbmZvLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHRleHBpcmVBdDogbmV3IERhdGUoKS5nZXRUaW1lKCkgKyBrZWVwSGlzdG9yeU1pbGlzZWNvbmRzXG5cdFx0fSk7XG5cdH1cblxuXHRmaW5kQnlUb2tlbih0b2tlbikge1xuXHRcdHJldHVybiB0aGlzLmZpbmQoeyB0b2tlbiB9LCB7IHNvcnQgOiB7IHRzOiAtMSB9LCBsaW1pdDogMjAgfSk7XG5cdH1cblxuXHRrZWVwSGlzdG9yeUZvclRva2VuKHRva2VuKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtcblx0XHRcdHRva2VuLFxuXHRcdFx0ZXhwaXJlQXQ6IHtcblx0XHRcdFx0JGV4aXN0czogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdCR1bnNldDoge1xuXHRcdFx0XHRleHBpcmVBdDogMVxuXHRcdFx0fVxuXHRcdH0sIHtcblx0XHRcdG11bHRpOiB0cnVlXG5cdFx0fSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZCA9IG5ldyBMaXZlY2hhdFBhZ2VWaXNpdGVkKCk7XG4iLCIvKipcbiAqIExpdmVjaGF0IFRyaWdnZXIgbW9kZWxcbiAqL1xuY2xhc3MgTGl2ZWNoYXRUcmlnZ2VyIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignbGl2ZWNoYXRfdHJpZ2dlcicpO1xuXHR9XG5cblx0dXBkYXRlQnlJZChfaWQsIGRhdGEpIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgeyAkc2V0OiBkYXRhIH0pO1xuXHR9XG5cblx0cmVtb3ZlQWxsKCkge1xuXHRcdHJldHVybiB0aGlzLnJlbW92ZSh7fSk7XG5cdH1cblxuXHRmaW5kQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgX2lkIH0pO1xuXHR9XG5cblx0cmVtb3ZlQnlJZChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoeyBfaWQgfSk7XG5cdH1cblxuXHRmaW5kRW5hYmxlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kKHsgZW5hYmxlZDogdHJ1ZSB9KTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIgPSBuZXcgTGl2ZWNoYXRUcmlnZ2VyKCk7XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMudHJ5RW5zdXJlSW5kZXgoeyBjb2RlOiAxIH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy50cnlFbnN1cmVJbmRleCh7IG9wZW46IDEgfSwgeyBzcGFyc2U6IDEgfSk7XG5cdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnRyeUVuc3VyZUluZGV4KHsgJ3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IDEgfSk7XG59KTtcbiIsImNsYXNzIExpdmVjaGF0SW5xdWlyeSBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X2lucXVpcnknKTtcblxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAncmlkJzogMSB9KTsgLy8gcm9vbSBpZCBjb3JyZXNwb25kaW5nIHRvIHRoaXMgaW5xdWlyeVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnbmFtZSc6IDEgfSk7IC8vIG5hbWUgb2YgdGhlIGlucXVpcnkgKGNsaWVudCBuYW1lIGZvciBub3cpXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdtZXNzYWdlJzogMSB9KTsgLy8gbWVzc2FnZSBzZW50IGJ5IHRoZSBjbGllbnRcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3RzJzogMSB9KTsgLy8gdGltZXN0YW1wXG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdjb2RlJzogMSB9KTsgLy8gKGZvciByb3V0aW5nKVxuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnYWdlbnRzJzogMX0pOyAvLyBJZCdzIG9mIHRoZSBhZ2VudHMgd2hvIGNhbiBzZWUgdGhlIGlucXVpcnkgKGhhbmRsZSBkZXBhcnRtZW50cylcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3N0YXR1cyc6IDF9KTsgLy8gJ29wZW4nLCAndGFrZW4nXG5cdH1cblxuXHRmaW5kT25lQnlJZChpbnF1aXJ5SWQpIHtcblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHsgX2lkOiBpbnF1aXJ5SWQgfSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIHRoZSBpbnF1aXJ5IGFzIHRha2VuXG5cdCAqL1xuXHR0YWtlSW5xdWlyeShpbnF1aXJ5SWQpIHtcblx0XHR0aGlzLnVwZGF0ZSh7XG5cdFx0XHQnX2lkJzogaW5xdWlyeUlkXG5cdFx0fSwge1xuXHRcdFx0JHNldDogeyBzdGF0dXM6ICd0YWtlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogbWFyayB0aGUgaW5xdWlyeSBhcyBjbG9zZWRcblx0ICovXG5cdGNsb3NlQnlSb29tSWQocm9vbUlkLCBjbG9zZUluZm8pIHtcblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoe1xuXHRcdFx0cmlkOiByb29tSWRcblx0XHR9LCB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHN0YXR1czogJ2Nsb3NlZCcsXG5cdFx0XHRcdGNsb3NlcjogY2xvc2VJbmZvLmNsb3Nlcixcblx0XHRcdFx0Y2xvc2VkQnk6IGNsb3NlSW5mby5jbG9zZWRCeSxcblx0XHRcdFx0Y2xvc2VkQXQ6IGNsb3NlSW5mby5jbG9zZWRBdCxcblx0XHRcdFx0Y2hhdER1cmF0aW9uOiBjbG9zZUluZm8uY2hhdER1cmF0aW9uXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHQvKlxuXHQgKiBtYXJrIGlucXVpcnkgYXMgb3BlblxuXHQgKi9cblx0b3BlbklucXVpcnkoaW5xdWlyeUlkKSB7XG5cdFx0dGhpcy51cGRhdGUoe1xuXHRcdFx0J19pZCc6IGlucXVpcnlJZFxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHsgc3RhdHVzOiAnb3BlbicgfVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogcmV0dXJuIHRoZSBzdGF0dXMgb2YgdGhlIGlucXVpcnkgKG9wZW4gb3IgdGFrZW4pXG5cdCAqL1xuXHRnZXRTdGF0dXMoaW5xdWlyeUlkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZSh7J19pZCc6IGlucXVpcnlJZH0pLnN0YXR1cztcblx0fVxuXG5cdHVwZGF0ZVZpc2l0b3JTdGF0dXModG9rZW4sIHN0YXR1cykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3YudG9rZW4nOiB0b2tlbixcblx0XHRcdHN0YXR1czogJ29wZW4nXG5cdFx0fTtcblxuXHRcdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0J3Yuc3RhdHVzJzogc3RhdHVzXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkgPSBuZXcgTGl2ZWNoYXRJbnF1aXJ5KCk7XG4iLCJpbXBvcnQgbW9tZW50IGZyb20gJ21vbWVudCc7XG5cbmNsYXNzIExpdmVjaGF0T2ZmaWNlSG91ciBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2xpdmVjaGF0X29mZmljZV9ob3VyJyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2RheSc6IDEgfSk7IC8vIHRoZSBkYXkgb2YgdGhlIHdlZWsgbW9uZGF5IC0gc3VuZGF5XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdzdGFydCc6IDEgfSk7IC8vIHRoZSBvcGVuaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ2ZpbmlzaCc6IDEgfSk7IC8vIHRoZSBjbG9zaW5nIGhvdXJzIG9mIHRoZSBvZmZpY2Vcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ29wZW4nOiAxIH0pOyAvLyB3aGV0aGVyIG9yIG5vdCB0aGUgb2ZmaWNlcyBhcmUgb3BlbiBvbiB0aGlzIGRheVxuXG5cdFx0Ly8gaWYgdGhlcmUgaXMgbm90aGluZyBpbiB0aGUgY29sbGVjdGlvbiwgYWRkIGRlZmF1bHRzXG5cdFx0aWYgKHRoaXMuZmluZCgpLmNvdW50KCkgPT09IDApIHtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdNb25kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAxLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1R1ZXNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAyLCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ1dlZG5lc2RheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDMsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnVGh1cnNkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA0LCAnb3BlbicgOiB0cnVlIH0pO1xuXHRcdFx0dGhpcy5pbnNlcnQoeydkYXknIDogJ0ZyaWRheScsICdzdGFydCcgOiAnMDg6MDAnLCAnZmluaXNoJyA6ICcyMDowMCcsICdjb2RlJyA6IDUsICdvcGVuJyA6IHRydWUgfSk7XG5cdFx0XHR0aGlzLmluc2VydCh7J2RheScgOiAnU2F0dXJkYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiA2LCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHRcdHRoaXMuaW5zZXJ0KHsnZGF5JyA6ICdTdW5kYXknLCAnc3RhcnQnIDogJzA4OjAwJywgJ2ZpbmlzaCcgOiAnMjA6MDAnLCAnY29kZScgOiAwLCAnb3BlbicgOiBmYWxzZSB9KTtcblx0XHR9XG5cdH1cblxuXHQvKlxuXHQgKiB1cGRhdGUgdGhlIGdpdmVuIGRheXMgc3RhcnQgYW5kIGZpbmlzaCB0aW1lcyBhbmQgd2hldGhlciB0aGUgb2ZmaWNlIGlzIG9wZW4gb24gdGhhdCBkYXlcblx0ICovXG5cdHVwZGF0ZUhvdXJzKGRheSwgbmV3U3RhcnQsIG5ld0ZpbmlzaCwgbmV3T3Blbikge1xuXHRcdHRoaXMudXBkYXRlKHtcblx0XHRcdGRheVxuXHRcdH0sIHtcblx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0c3RhcnQ6IG5ld1N0YXJ0LFxuXHRcdFx0XHRmaW5pc2g6IG5ld0ZpbmlzaCxcblx0XHRcdFx0b3BlbjogbmV3T3BlblxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0Lypcblx0ICogQ2hlY2sgaWYgdGhlIGN1cnJlbnQgc2VydmVyIHRpbWUgKHV0YykgaXMgd2l0aGluIHRoZSBvZmZpY2UgaG91cnMgb2YgdGhhdCBkYXlcblx0ICogcmV0dXJucyB0cnVlIG9yIGZhbHNlXG5cdCAqL1xuXHRpc05vd1dpdGhpbkhvdXJzKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdC8vIHZhciBjdCA9IG1vbWVudCgpLnV0YygpO1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblx0XHRjb25zdCBmaW5pc2ggPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5maW5pc2ggfWAsICdkZGRkOkhIOm1tJyk7XG5cblx0XHQvLyBjb25zb2xlLmxvZyhmaW5pc2guaXNCZWZvcmUoc3RhcnQpKTtcblx0XHRpZiAoZmluaXNoLmlzQmVmb3JlKHN0YXJ0KSkge1xuXHRcdFx0Ly8gZmluaXNoLmRheShmaW5pc2guZGF5KCkrMSk7XG5cdFx0XHRmaW5pc2guYWRkKDEsICdkYXlzJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgcmVzdWx0ID0gY3VycmVudFRpbWUuaXNCZXR3ZWVuKHN0YXJ0LCBmaW5pc2gpO1xuXG5cdFx0Ly8gaW5CZXR3ZWVuICBjaGVja1xuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRpc09wZW5pbmdUaW1lKCkge1xuXHRcdC8vIGdldCBjdXJyZW50IHRpbWUgb24gc2VydmVyIGluIHV0Y1xuXHRcdGNvbnN0IGN1cnJlbnRUaW1lID0gbW9tZW50LnV0Yyhtb21lbnQoKS51dGMoKS5mb3JtYXQoJ2RkZGQ6SEg6bW0nKSwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdC8vIGdldCB0b2RheXMgb2ZmaWNlIGhvdXJzIGZyb20gZGJcblx0XHRjb25zdCB0b2RheXNPZmZpY2VIb3VycyA9IHRoaXMuZmluZE9uZSh7ZGF5OiBjdXJyZW50VGltZS5mb3JtYXQoJ2RkZGQnKX0pO1xuXHRcdGlmICghdG9kYXlzT2ZmaWNlSG91cnMpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayBpZiBvZmZpY2VzIGFyZSBvcGVuIHRvZGF5XG5cdFx0aWYgKHRvZGF5c09mZmljZUhvdXJzLm9wZW4gPT09IGZhbHNlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc3RhcnQgPSBtb21lbnQudXRjKGAkeyB0b2RheXNPZmZpY2VIb3Vycy5kYXkgfTokeyB0b2RheXNPZmZpY2VIb3Vycy5zdGFydCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBzdGFydC5pc1NhbWUoY3VycmVudFRpbWUsICdtaW51dGUnKTtcblx0fVxuXG5cdGlzQ2xvc2luZ1RpbWUoKSB7XG5cdFx0Ly8gZ2V0IGN1cnJlbnQgdGltZSBvbiBzZXJ2ZXIgaW4gdXRjXG5cdFx0Y29uc3QgY3VycmVudFRpbWUgPSBtb21lbnQudXRjKG1vbWVudCgpLnV0YygpLmZvcm1hdCgnZGRkZDpISDptbScpLCAnZGRkZDpISDptbScpO1xuXG5cdFx0Ly8gZ2V0IHRvZGF5cyBvZmZpY2UgaG91cnMgZnJvbSBkYlxuXHRcdGNvbnN0IHRvZGF5c09mZmljZUhvdXJzID0gdGhpcy5maW5kT25lKHtkYXk6IGN1cnJlbnRUaW1lLmZvcm1hdCgnZGRkZCcpfSk7XG5cdFx0aWYgKCF0b2RheXNPZmZpY2VIb3Vycykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbmlzaCA9IG1vbWVudC51dGMoYCR7IHRvZGF5c09mZmljZUhvdXJzLmRheSB9OiR7IHRvZGF5c09mZmljZUhvdXJzLmZpbmlzaCB9YCwgJ2RkZGQ6SEg6bW0nKTtcblxuXHRcdHJldHVybiBmaW5pc2guaXNTYW1lKGN1cnJlbnRUaW1lLCAnbWludXRlJyk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyID0gbmV3IExpdmVjaGF0T2ZmaWNlSG91cigpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbmNsYXNzIExpdmVjaGF0VmlzaXRvcnMgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdsaXZlY2hhdF92aXNpdG9yJyk7XG5cdH1cblxuXHQvKipcblx0ICogR2V0cyB2aXNpdG9yIGJ5IHRva2VuXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiAtIFZpc2l0b3IgdG9rZW5cblx0ICovXG5cdGdldFZpc2l0b3JCeVRva2VuKHRva2VuLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBGaW5kIHZpc2l0b3JzIGJ5IF9pZFxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gLSBWaXNpdG9yIHRva2VuXG5cdCAqL1xuXHRmaW5kQnlJZChfaWQsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdF9pZFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBHZXRzIHZpc2l0b3IgYnkgdG9rZW5cblx0ICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIC0gVmlzaXRvciB0b2tlblxuXHQgKi9cblx0ZmluZFZpc2l0b3JCeVRva2VuKHRva2VuKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHR0b2tlblxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5KTtcblx0fVxuXG5cdHVwZGF0ZUxpdmVjaGF0RGF0YUJ5VG9rZW4odG9rZW4sIGtleSwgdmFsdWUsIG92ZXJ3cml0ZSA9IHRydWUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHRva2VuXG5cdFx0fTtcblxuXHRcdGlmICghb3ZlcndyaXRlKSB7XG5cdFx0XHRjb25zdCB1c2VyID0gdGhpcy5maW5kT25lKHF1ZXJ5LCB7IGZpZWxkczogeyBsaXZlY2hhdERhdGE6IDEgfSB9KTtcblx0XHRcdGlmICh1c2VyLmxpdmVjaGF0RGF0YSAmJiB0eXBlb2YgdXNlci5saXZlY2hhdERhdGFba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRbYGxpdmVjaGF0RGF0YS4keyBrZXkgfWBdOiB2YWx1ZVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG5cdH1cblxuXHQvKipcblx0ICogRmluZCBhIHZpc2l0b3IgYnkgdGhlaXIgcGhvbmUgbnVtYmVyXG5cdCAqIEByZXR1cm4ge29iamVjdH0gVXNlciBmcm9tIGRiXG5cdCAqL1xuXHRmaW5kT25lVmlzaXRvckJ5UGhvbmUocGhvbmUpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdCdwaG9uZS5waG9uZU51bWJlcic6IHBob25lXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUocXVlcnkpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICogQHJldHVybiB7c3RyaW5nfSBUaGUgbmV4dCB2aXNpdG9yIG5hbWVcblx0ICovXG5cdGdldE5leHRWaXNpdG9yVXNlcm5hbWUoKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3NSYXcgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5tb2RlbC5yYXdDb2xsZWN0aW9uKCk7XG5cdFx0Y29uc3QgZmluZEFuZE1vZGlmeSA9IE1ldGVvci53cmFwQXN5bmMoc2V0dGluZ3NSYXcuZmluZEFuZE1vZGlmeSwgc2V0dGluZ3NSYXcpO1xuXG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRfaWQ6ICdMaXZlY2hhdF9ndWVzdF9jb3VudCdcblx0XHR9O1xuXG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JGluYzoge1xuXHRcdFx0XHR2YWx1ZTogMVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRjb25zdCBsaXZlY2hhdENvdW50ID0gZmluZEFuZE1vZGlmeShxdWVyeSwgbnVsbCwgdXBkYXRlKTtcblxuXHRcdHJldHVybiBgZ3Vlc3QtJHsgbGl2ZWNoYXRDb3VudC52YWx1ZS52YWx1ZSArIDEgfWA7XG5cdH1cblxuXHR1cGRhdGVCeUlkKF9pZCwgdXBkYXRlKSB7XG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHsgX2lkIH0sIHVwZGF0ZSk7XG5cdH1cblxuXHRzYXZlR3Vlc3RCeUlkKF9pZCwgZGF0YSkge1xuXHRcdGNvbnN0IHNldERhdGEgPSB7fTtcblx0XHRjb25zdCB1bnNldERhdGEgPSB7fTtcblxuXHRcdGlmIChkYXRhLm5hbWUpIHtcblx0XHRcdGlmICghXy5pc0VtcHR5KHMudHJpbShkYXRhLm5hbWUpKSkge1xuXHRcdFx0XHRzZXREYXRhLm5hbWUgPSBzLnRyaW0oZGF0YS5uYW1lKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5uYW1lID0gMTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGF0YS5lbWFpbCkge1xuXHRcdFx0aWYgKCFfLmlzRW1wdHkocy50cmltKGRhdGEuZW1haWwpKSkge1xuXHRcdFx0XHRzZXREYXRhLnZpc2l0b3JFbWFpbHMgPSBbXG5cdFx0XHRcdFx0eyBhZGRyZXNzOiBzLnRyaW0oZGF0YS5lbWFpbCkgfVxuXHRcdFx0XHRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dW5zZXREYXRhLnZpc2l0b3JFbWFpbHMgPSAxO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkYXRhLnBob25lKSB7XG5cdFx0XHRpZiAoIV8uaXNFbXB0eShzLnRyaW0oZGF0YS5waG9uZSkpKSB7XG5cdFx0XHRcdHNldERhdGEucGhvbmUgPSBbXG5cdFx0XHRcdFx0eyBwaG9uZU51bWJlcjogcy50cmltKGRhdGEucGhvbmUpIH1cblx0XHRcdFx0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHVuc2V0RGF0YS5waG9uZSA9IDE7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0ge307XG5cblx0XHRpZiAoIV8uaXNFbXB0eShzZXREYXRhKSkge1xuXHRcdFx0dXBkYXRlLiRzZXQgPSBzZXREYXRhO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KHVuc2V0RGF0YSkpIHtcblx0XHRcdHVwZGF0ZS4kdW5zZXQgPSB1bnNldERhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKF8uaXNFbXB0eSh1cGRhdGUpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy51cGRhdGUoeyBfaWQgfSwgdXBkYXRlKTtcblx0fVxuXG5cdGZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzKGVtYWlsQWRkcmVzcykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0J3Zpc2l0b3JFbWFpbHMuYWRkcmVzcyc6IG5ldyBSZWdFeHAoYF4keyBzLmVzY2FwZVJlZ0V4cChlbWFpbEFkZHJlc3MpIH0kYCwgJ2knKVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kT25lKHF1ZXJ5KTtcblx0fVxuXG5cdHNhdmVHdWVzdEVtYWlsUGhvbmVCeUlkKF9pZCwgZW1haWxzLCBwaG9uZXMpIHtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkYWRkVG9TZXQ6IHt9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHNhdmVFbWFpbCA9IFtdLmNvbmNhdChlbWFpbHMpXG5cdFx0XHQuZmlsdGVyKGVtYWlsID0+IGVtYWlsICYmIGVtYWlsLnRyaW0oKSlcblx0XHRcdC5tYXAoZW1haWwgPT4ge1xuXHRcdFx0XHRyZXR1cm4geyBhZGRyZXNzOiBlbWFpbCB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZUVtYWlsLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyA9IHsgJGVhY2g6IHNhdmVFbWFpbCB9O1xuXHRcdH1cblxuXHRcdGNvbnN0IHNhdmVQaG9uZSA9IFtdLmNvbmNhdChwaG9uZXMpXG5cdFx0XHQuZmlsdGVyKHBob25lID0+IHBob25lICYmIHBob25lLnRyaW0oKS5yZXBsYWNlKC9bXlxcZF0vZywgJycpKVxuXHRcdFx0Lm1hcChwaG9uZSA9PiB7XG5cdFx0XHRcdHJldHVybiB7IHBob25lTnVtYmVyOiBwaG9uZSB9O1xuXHRcdFx0fSk7XG5cblx0XHRpZiAoc2F2ZVBob25lLmxlbmd0aCA+IDApIHtcblx0XHRcdHVwZGF0ZS4kYWRkVG9TZXQucGhvbmUgPSB7ICRlYWNoOiBzYXZlUGhvbmUgfTtcblx0XHR9XG5cblx0XHRpZiAoIXVwZGF0ZS4kYWRkVG9TZXQudmlzaXRvckVtYWlscyAmJiAhdXBkYXRlLiRhZGRUb1NldC5waG9uZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLnVwZGF0ZSh7IF9pZCB9LCB1cGRhdGUpO1xuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBMaXZlY2hhdFZpc2l0b3JzKCk7XG4iLCIvKiBnbG9iYWxzIEhUVFAgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuaW1wb3J0IFVBUGFyc2VyIGZyb20gJ3VhLXBhcnNlci1qcyc7XG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuTGl2ZWNoYXQgPSB7XG5cdGhpc3RvcnlNb25pdG9yVHlwZTogJ3VybCcsXG5cblx0bG9nZ2VyOiBuZXcgTG9nZ2VyKCdMaXZlY2hhdCcsIHtcblx0XHRzZWN0aW9uczoge1xuXHRcdFx0d2ViaG9vazogJ1dlYmhvb2snXG5cdFx0fVxuXHR9KSxcblxuXHRnZXROZXh0QWdlbnQoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKSA9PT0gJ0V4dGVybmFsJykge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Y29uc3QgcXVlcnlTdHJpbmcgPSBkZXBhcnRtZW50ID8gYD9kZXBhcnRtZW50SWQ9JHsgZGVwYXJ0bWVudCB9YCA6ICcnO1xuXHRcdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9VUkwnKSB9JHsgcXVlcnlTdHJpbmcgfWAsIHtcblx0XHRcdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHRcdFx0J1VzZXItQWdlbnQnOiAnUm9ja2V0Q2hhdCBTZXJ2ZXInLFxuXHRcdFx0XHRcdFx0XHQnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuXHRcdFx0XHRcdFx0XHQnWC1Sb2NrZXRDaGF0LVNlY3JldC1Ub2tlbic6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9FeHRlcm5hbF9RdWV1ZV9Ub2tlbicpXG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRpZiAocmVzdWx0ICYmIHJlc3VsdC5kYXRhICYmIHJlc3VsdC5kYXRhLnVzZXJuYW1lKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBhZ2VudCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVPbmxpbmVBZ2VudEJ5VXNlcm5hbWUocmVzdWx0LmRhdGEudXNlcm5hbWUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoYWdlbnQpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0XHRhZ2VudElkOiBhZ2VudC5faWQsXG5cdFx0XHRcdFx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcignRXJyb3IgcmVxdWVzdGluZyBhZ2VudCBmcm9tIGV4dGVybmFsIHF1ZXVlLicsIGUpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHR9IGVsc2UgaWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0TmV4dEFnZW50Rm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldE5leHRBZ2VudCgpO1xuXHR9LFxuXHRnZXRBZ2VudHMoZGVwYXJ0bWVudCkge1xuXHRcdGlmIChkZXBhcnRtZW50KSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRCeURlcGFydG1lbnRJZChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldE9ubGluZUFnZW50cyhkZXBhcnRtZW50KSB7XG5cdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZ2V0T25saW5lRm9yRGVwYXJ0bWVudChkZXBhcnRtZW50KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKTtcblx0XHR9XG5cdH0sXG5cdGdldFJlcXVpcmVkRGVwYXJ0bWVudChvbmxpbmVSZXF1aXJlZCA9IHRydWUpIHtcblx0XHRjb25zdCBkZXBhcnRtZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kRW5hYmxlZFdpdGhBZ2VudHMoKTtcblxuXHRcdHJldHVybiBkZXBhcnRtZW50cy5mZXRjaCgpLmZpbmQoKGRlcHQpID0+IHtcblx0XHRcdGlmICghZGVwdC5zaG93T25SZWdpc3RyYXRpb24pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCFvbmxpbmVSZXF1aXJlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IG9ubGluZUFnZW50cyA9IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5nZXRPbmxpbmVGb3JEZXBhcnRtZW50KGRlcHQuX2lkKTtcblx0XHRcdHJldHVybiBvbmxpbmVBZ2VudHMuY291bnQoKSA+IDA7XG5cdFx0fSk7XG5cdH0sXG5cdGdldFJvb20oZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCkge1xuXHRcdGxldCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpO1xuXHRcdGxldCBuZXdSb29tID0gZmFsc2U7XG5cblx0XHRpZiAocm9vbSAmJiAhcm9vbS5vcGVuKSB7XG5cdFx0XHRtZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0cm9vbSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHJvb20gPT0gbnVsbCkge1xuXHRcdFx0Ly8gaWYgbm8gZGVwYXJ0bWVudCBzZWxlY3RlZCB2ZXJpZnkgaWYgdGhlcmUgaXMgYXQgbGVhc3Qgb25lIGFjdGl2ZSBhbmQgcGljayB0aGUgZmlyc3Rcblx0XHRcdGlmICghYWdlbnQgJiYgIWd1ZXN0LmRlcGFydG1lbnQpIHtcblx0XHRcdFx0Y29uc3QgZGVwYXJ0bWVudCA9IHRoaXMuZ2V0UmVxdWlyZWREZXBhcnRtZW50KCk7XG5cblx0XHRcdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdFx0XHRndWVzdC5kZXBhcnRtZW50ID0gZGVwYXJ0bWVudC5faWQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gZGVsZWdhdGUgcm9vbSBjcmVhdGlvbiB0byBRdWV1ZU1ldGhvZHNcblx0XHRcdGNvbnN0IHJvdXRpbmdNZXRob2QgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKTtcblx0XHRcdHJvb20gPSBSb2NrZXRDaGF0LlF1ZXVlTWV0aG9kc1tyb3V0aW5nTWV0aG9kXShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTtcblxuXHRcdFx0bmV3Um9vbSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCFyb29tIHx8IHJvb20udi50b2tlbiAhPT0gZ3Vlc3QudG9rZW4pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Nhbm5vdC1hY2Nlc3Mtcm9vbScpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7IHJvb20sIG5ld1Jvb20gfTtcblx0fSxcblx0c2VuZE1lc3NhZ2UoeyBndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50IH0pIHtcblx0XHRjb25zdCB7IHJvb20sIG5ld1Jvb20gfSA9IHRoaXMuZ2V0Um9vbShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTtcblx0XHRpZiAoZ3Vlc3QubmFtZSkge1xuXHRcdFx0bWVzc2FnZS5hbGlhcyA9IGd1ZXN0Lm5hbWU7XG5cdFx0fVxuXG5cdFx0Ly8gcmV0dXJuIG1lc3NhZ2VzO1xuXHRcdHJldHVybiBfLmV4dGVuZChSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKGd1ZXN0LCBtZXNzYWdlLCByb29tKSwgeyBuZXdSb29tLCBzaG93Q29ubmVjdGluZzogdGhpcy5zaG93Q29ubmVjdGluZygpIH0pO1xuXHR9LFxuXHRyZWdpc3Rlckd1ZXN0KHsgdG9rZW4sIG5hbWUsIGVtYWlsLCBkZXBhcnRtZW50LCBwaG9uZSwgdXNlcm5hbWUgfSA9IHt9KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRsZXQgdXNlcklkO1xuXHRcdGNvbnN0IHVwZGF0ZVVzZXIgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdHRva2VuXG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHVzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICh1c2VyKSB7XG5cdFx0XHR1c2VySWQgPSB1c2VyLl9pZDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCF1c2VybmFtZSkge1xuXHRcdFx0XHR1c2VybmFtZSA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0TmV4dFZpc2l0b3JVc2VybmFtZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgZXhpc3RpbmdVc2VyID0gbnVsbDtcblxuXHRcdFx0aWYgKHMudHJpbShlbWFpbCkgIT09ICcnICYmIChleGlzdGluZ1VzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVHdWVzdEJ5RW1haWxBZGRyZXNzKGVtYWlsKSkpIHtcblx0XHRcdFx0dXNlcklkID0gZXhpc3RpbmdVc2VyLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnN0IHVzZXJEYXRhID0ge1xuXHRcdFx0XHRcdHVzZXJuYW1lLFxuXHRcdFx0XHRcdGRlcGFydG1lbnRcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAodGhpcy5jb25uZWN0aW9uKSB7XG5cdFx0XHRcdFx0dXNlckRhdGEudXNlckFnZW50ID0gdGhpcy5jb25uZWN0aW9uLmh0dHBIZWFkZXJzWyd1c2VyLWFnZW50J107XG5cdFx0XHRcdFx0dXNlckRhdGEuaXAgPSB0aGlzLmNvbm5lY3Rpb24uaHR0cEhlYWRlcnNbJ3gtcmVhbC1pcCddIHx8IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVyc1sneC1mb3J3YXJkZWQtZm9yJ10gfHwgdGhpcy5jb25uZWN0aW9uLmNsaWVudEFkZHJlc3M7XG5cdFx0XHRcdFx0dXNlckRhdGEuaG9zdCA9IHRoaXMuY29ubmVjdGlvbi5odHRwSGVhZGVycy5ob3N0O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dXNlcklkID0gTGl2ZWNoYXRWaXNpdG9ycy5pbnNlcnQodXNlckRhdGEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChwaG9uZSkge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0LnBob25lID0gW1xuXHRcdFx0XHR7IHBob25lTnVtYmVyOiBwaG9uZS5udW1iZXIgfVxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAoZW1haWwgJiYgZW1haWwudHJpbSgpICE9PSAnJykge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0LnZpc2l0b3JFbWFpbHMgPSBbXG5cdFx0XHRcdHsgYWRkcmVzczogZW1haWwgfVxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHRpZiAobmFtZSkge1xuXHRcdFx0dXBkYXRlVXNlci4kc2V0Lm5hbWUgPSBuYW1lO1xuXHRcdH1cblxuXHRcdExpdmVjaGF0VmlzaXRvcnMudXBkYXRlQnlJZCh1c2VySWQsIHVwZGF0ZVVzZXIpO1xuXG5cdFx0cmV0dXJuIHVzZXJJZDtcblx0fSxcblx0c2V0RGVwYXJ0bWVudEZvckd1ZXN0KHsgdG9rZW4sIGRlcGFydG1lbnQgfSA9IHt9KSB7XG5cdFx0Y2hlY2sodG9rZW4sIFN0cmluZyk7XG5cblx0XHRjb25zdCB1cGRhdGVVc2VyID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRkZXBhcnRtZW50XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGNvbnN0IHVzZXIgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHRva2VuLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblx0XHRpZiAodXNlcikge1xuXHRcdFx0cmV0dXJuIE1ldGVvci51c2Vycy51cGRhdGUodXNlci5faWQsIHVwZGF0ZVVzZXIpO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cdHNhdmVHdWVzdCh7IF9pZCwgbmFtZSwgZW1haWwsIHBob25lIH0pIHtcblx0XHRjb25zdCB1cGRhdGVEYXRhID0ge307XG5cblx0XHRpZiAobmFtZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5uYW1lID0gbmFtZTtcblx0XHR9XG5cdFx0aWYgKGVtYWlsKSB7XG5cdFx0XHR1cGRhdGVEYXRhLmVtYWlsID0gZW1haWw7XG5cdFx0fVxuXHRcdGlmIChwaG9uZSkge1xuXHRcdFx0dXBkYXRlRGF0YS5waG9uZSA9IHBob25lO1xuXHRcdH1cblx0XHRjb25zdCByZXQgPSBMaXZlY2hhdFZpc2l0b3JzLnNhdmVHdWVzdEJ5SWQoX2lkLCB1cGRhdGVEYXRhKTtcblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVHdWVzdCcsIHVwZGF0ZURhdGEpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHJldDtcblx0fSxcblxuXHRjbG9zZVJvb20oeyB1c2VyLCB2aXNpdG9yLCByb29tLCBjb21tZW50IH0pIHtcblx0XHRjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuXG5cdFx0Y29uc3QgY2xvc2VEYXRhID0ge1xuXHRcdFx0Y2xvc2VkQXQ6IG5vdyxcblx0XHRcdGNoYXREdXJhdGlvbjogKG5vdy5nZXRUaW1lKCkgLSByb29tLnRzKSAvIDEwMDBcblx0XHR9O1xuXG5cdFx0aWYgKHVzZXIpIHtcblx0XHRcdGNsb3NlRGF0YS5jbG9zZXIgPSAndXNlcic7XG5cdFx0XHRjbG9zZURhdGEuY2xvc2VkQnkgPSB7XG5cdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lXG5cdFx0XHR9O1xuXHRcdH0gZWxzZSBpZiAodmlzaXRvcikge1xuXHRcdFx0Y2xvc2VEYXRhLmNsb3NlciA9ICd2aXNpdG9yJztcblx0XHRcdGNsb3NlRGF0YS5jbG9zZWRCeSA9IHtcblx0XHRcdFx0X2lkOiB2aXNpdG9yLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHZpc2l0b3IudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuY2xvc2VCeVJvb21JZChyb29tLl9pZCwgY2xvc2VEYXRhKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuY2xvc2VCeVJvb21JZChyb29tLl9pZCwgY2xvc2VEYXRhKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2UgPSB7XG5cdFx0XHR0OiAnbGl2ZWNoYXQtY2xvc2UnLFxuXHRcdFx0bXNnOiBjb21tZW50LFxuXHRcdFx0Z3JvdXBhYmxlOiBmYWxzZVxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNlbmRNZXNzYWdlKHVzZXIsIG1lc3NhZ2UsIHJvb20pO1xuXG5cdFx0aWYgKHJvb20uc2VydmVkQnkpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuaGlkZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCByb29tLnNlcnZlZEJ5Ll9pZCk7XG5cdFx0fVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZUNvbW1hbmRXaXRoUm9vbUlkQW5kVXNlcigncHJvbXB0VHJhbnNjcmlwdCcsIHJvb20uX2lkLCBjbG9zZURhdGEuY2xvc2VkQnkpO1xuXG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQuY2FsbGJhY2tzLnJ1bignbGl2ZWNoYXQuY2xvc2VSb29tJywgcm9vbSk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRnZXRJbml0U2V0dGluZ3MoKSB7XG5cdFx0Y29uc3Qgc2V0dGluZ3MgPSB7fTtcblxuXHRcdFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmROb3RIaWRkZW5QdWJsaWMoW1xuXHRcdFx0J0xpdmVjaGF0X3RpdGxlJyxcblx0XHRcdCdMaXZlY2hhdF90aXRsZV9jb2xvcicsXG5cdFx0XHQnTGl2ZWNoYXRfZW5hYmxlZCcsXG5cdFx0XHQnTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm0nLFxuXHRcdFx0J0xpdmVjaGF0X2FsbG93X3N3aXRjaGluZ19kZXBhcnRtZW50cycsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZV9jb2xvcicsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9tZXNzYWdlJyxcblx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZScsXG5cdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJyxcblx0XHRcdCdMaXZlY2hhdF9kaXNwbGF5X29mZmxpbmVfZm9ybScsXG5cdFx0XHQnTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQnLFxuXHRcdFx0J0ppdHNpX0VuYWJsZWQnLFxuXHRcdFx0J0xhbmd1YWdlJyxcblx0XHRcdCdMaXZlY2hhdF9lbmFibGVfdHJhbnNjcmlwdCcsXG5cdFx0XHQnTGl2ZWNoYXRfdHJhbnNjcmlwdF9tZXNzYWdlJ1xuXHRcdF0pLmZvckVhY2goKHNldHRpbmcpID0+IHtcblx0XHRcdHNldHRpbmdzW3NldHRpbmcuX2lkXSA9IHNldHRpbmcudmFsdWU7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gc2V0dGluZ3M7XG5cdH0sXG5cblx0c2F2ZVJvb21JbmZvKHJvb21EYXRhLCBndWVzdERhdGEpIHtcblx0XHRpZiAoKHJvb21EYXRhLnRvcGljICE9IG51bGwgfHwgcm9vbURhdGEudGFncyAhPSBudWxsKSAmJiAhUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0VG9waWNBbmRUYWdzQnlJZChyb29tRGF0YS5faWQsIHJvb21EYXRhLnRvcGljLCByb29tRGF0YS50YWdzKSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0XHRSb2NrZXRDaGF0LmNhbGxiYWNrcy5ydW4oJ2xpdmVjaGF0LnNhdmVSb29tJywgcm9vbURhdGEpO1xuXHRcdH0pO1xuXG5cdFx0aWYgKCFfLmlzRW1wdHkoZ3Vlc3REYXRhLm5hbWUpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TGFiZWxCeVJvb21JZChyb29tRGF0YS5faWQsIGd1ZXN0RGF0YS5uYW1lKSAmJiBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLnVwZGF0ZU5hbWVCeVJvb21JZChyb29tRGF0YS5faWQsIGd1ZXN0RGF0YS5uYW1lKTtcblx0XHR9XG5cdH0sXG5cblx0Y2xvc2VPcGVuQ2hhdHModXNlcklkLCBjb21tZW50KSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9wZW5CeUFnZW50KHVzZXJJZCkuZm9yRWFjaCgocm9vbSkgPT4ge1xuXHRcdFx0dGhpcy5jbG9zZVJvb20oeyB1c2VyLCByb29tLCBjb21tZW50fSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0Zm9yd2FyZE9wZW5DaGF0cyh1c2VySWQpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5QWdlbnQodXNlcklkKS5mb3JFYWNoKChyb29tKSA9PiB7XG5cdFx0XHRjb25zdCBndWVzdCA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHJvb20udi5faWQpO1xuXHRcdFx0dGhpcy50cmFuc2Zlcihyb29tLCBndWVzdCwgeyBkZXBhcnRtZW50SWQ6IGd1ZXN0LmRlcGFydG1lbnQgfSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2F2ZVBhZ2VIaXN0b3J5KHRva2VuLCBwYWdlSW5mbykge1xuXHRcdGlmIChwYWdlSW5mby5jaGFuZ2UgPT09IFJvY2tldENoYXQuTGl2ZWNoYXQuaGlzdG9yeU1vbml0b3JUeXBlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRQYWdlVmlzaXRlZC5zYXZlQnlUb2tlbih0b2tlbiwgcGFnZUluZm8pO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fSxcblxuXHR0cmFuc2Zlcihyb29tLCBndWVzdCwgdHJhbnNmZXJEYXRhKSB7XG5cdFx0bGV0IGFnZW50O1xuXG5cdFx0aWYgKHRyYW5zZmVyRGF0YS51c2VySWQpIHtcblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0cmFuc2ZlckRhdGEudXNlcklkKTtcblx0XHRcdGFnZW50ID0ge1xuXHRcdFx0XHRhZ2VudElkOiB1c2VyLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFnZW50ID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5nZXROZXh0QWdlbnQodHJhbnNmZXJEYXRhLmRlcGFydG1lbnRJZCk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgc2VydmVkQnkgPSByb29tLnNlcnZlZEJ5O1xuXG5cdFx0aWYgKGFnZW50ICYmIGFnZW50LmFnZW50SWQgIT09IHNlcnZlZEJ5Ll9pZCkge1xuXHRcdFx0cm9vbS51c2VybmFtZXMgPSBfLndpdGhvdXQocm9vbS51c2VybmFtZXMsIHNlcnZlZEJ5LnVzZXJuYW1lKS5jb25jYXQoYWdlbnQudXNlcm5hbWUpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5jaGFuZ2VBZ2VudEJ5Um9vbUlkKHJvb20uX2lkLCBhZ2VudCk7XG5cblx0XHRcdGNvbnN0IHN1YnNjcmlwdGlvbkRhdGEgPSB7XG5cdFx0XHRcdHJpZDogcm9vbS5faWQsXG5cdFx0XHRcdG5hbWU6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdGFsZXJ0OiB0cnVlLFxuXHRcdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0XHR1bnJlYWQ6IDEsXG5cdFx0XHRcdHVzZXJNZW50aW9uczogMSxcblx0XHRcdFx0Z3JvdXBNZW50aW9uczogMCxcblx0XHRcdFx0Y29kZTogcm9vbS5jb2RlLFxuXHRcdFx0XHR1OiB7XG5cdFx0XHRcdFx0X2lkOiBhZ2VudC5hZ2VudElkLFxuXHRcdFx0XHRcdHVzZXJuYW1lOiBhZ2VudC51c2VybmFtZVxuXHRcdFx0XHR9LFxuXHRcdFx0XHR0OiAnbCcsXG5cdFx0XHRcdGRlc2t0b3BOb3RpZmljYXRpb25zOiAnYWxsJyxcblx0XHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0XHRlbWFpbE5vdGlmaWNhdGlvbnM6ICdhbGwnXG5cdFx0XHR9O1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5yZW1vdmVCeVJvb21JZEFuZFVzZXJJZChyb29tLl9pZCwgc2VydmVkQnkuX2lkKTtcblxuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5pbnNlcnQoc3Vic2NyaXB0aW9uRGF0YSk7XG5cblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVVzZXJMZWF2ZVdpdGhSb29tSWRBbmRVc2VyKHJvb20uX2lkLCB7IF9pZDogc2VydmVkQnkuX2lkLCB1c2VybmFtZTogc2VydmVkQnkudXNlcm5hbWUgfSk7XG5cdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVVc2VySm9pbldpdGhSb29tSWRBbmRVc2VyKHJvb20uX2lkLCB7IF9pZDogYWdlbnQuYWdlbnRJZCwgdXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lIH0pO1xuXG5cdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnN0cmVhbS5lbWl0KHJvb20uX2lkLCB7XG5cdFx0XHRcdHR5cGU6ICdhZ2VudERhdGEnLFxuXHRcdFx0XHRkYXRhOiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5nZXRBZ2VudEluZm8oYWdlbnQuYWdlbnRJZClcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0c2VuZFJlcXVlc3QocG9zdERhdGEsIGNhbGxiYWNrLCB0cnlpbmcgPSAxKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0XHQnWC1Sb2NrZXRDaGF0LUxpdmVjaGF0LVRva2VuJzogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X3NlY3JldF90b2tlbicpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGRhdGE6IHBvc3REYXRhXG5cdFx0XHR9O1xuXHRcdFx0cmV0dXJuIEhUVFAucG9zdChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfd2ViaG9va1VybCcpLCBvcHRpb25zKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LmxvZ2dlci53ZWJob29rLmVycm9yKGBSZXNwb25zZSBlcnJvciBvbiAkeyB0cnlpbmcgfSB0cnkgLT5gLCBlKTtcblx0XHRcdC8vIHRyeSAxMCB0aW1lcyBhZnRlciAxMCBzZWNvbmRzIGVhY2hcblx0XHRcdGlmICh0cnlpbmcgPCAxMCkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LmxvZ2dlci53ZWJob29rLndhcm4oJ1dpbGwgdHJ5IGFnYWluIGluIDEwIHNlY29uZHMgLi4uJyk7XG5cdFx0XHRcdHRyeWluZysrO1xuXHRcdFx0XHRzZXRUaW1lb3V0KE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4ge1xuXHRcdFx0XHRcdFJvY2tldENoYXQuTGl2ZWNoYXQuc2VuZFJlcXVlc3QocG9zdERhdGEsIGNhbGxiYWNrLCB0cnlpbmcpO1xuXHRcdFx0XHR9KSwgMTAwMDApO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHRnZXRMaXZlY2hhdFJvb21HdWVzdEluZm8ocm9vbSkge1xuXHRcdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVCeUlkKHJvb20udi5faWQpO1xuXHRcdGNvbnN0IGFnZW50ID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQocm9vbS5zZXJ2ZWRCeSAmJiByb29tLnNlcnZlZEJ5Ll9pZCk7XG5cblx0XHRjb25zdCB1YSA9IG5ldyBVQVBhcnNlcigpO1xuXHRcdHVhLnNldFVBKHZpc2l0b3IudXNlckFnZW50KTtcblxuXHRcdGNvbnN0IHBvc3REYXRhID0ge1xuXHRcdFx0X2lkOiByb29tLl9pZCxcblx0XHRcdGxhYmVsOiByb29tLmxhYmVsLFxuXHRcdFx0dG9waWM6IHJvb20udG9waWMsXG5cdFx0XHRjb2RlOiByb29tLmNvZGUsXG5cdFx0XHRjcmVhdGVkQXQ6IHJvb20udHMsXG5cdFx0XHRsYXN0TWVzc2FnZUF0OiByb29tLmxtLFxuXHRcdFx0dGFnczogcm9vbS50YWdzLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiByb29tLmxpdmVjaGF0RGF0YSxcblx0XHRcdHZpc2l0b3I6IHtcblx0XHRcdFx0X2lkOiB2aXNpdG9yLl9pZCxcblx0XHRcdFx0bmFtZTogdmlzaXRvci5uYW1lLFxuXHRcdFx0XHR1c2VybmFtZTogdmlzaXRvci51c2VybmFtZSxcblx0XHRcdFx0ZW1haWw6IG51bGwsXG5cdFx0XHRcdHBob25lOiBudWxsLFxuXHRcdFx0XHRkZXBhcnRtZW50OiB2aXNpdG9yLmRlcGFydG1lbnQsXG5cdFx0XHRcdGlwOiB2aXNpdG9yLmlwLFxuXHRcdFx0XHRvczogdWEuZ2V0T1MoKS5uYW1lICYmIChgJHsgdWEuZ2V0T1MoKS5uYW1lIH0gJHsgdWEuZ2V0T1MoKS52ZXJzaW9uIH1gKSxcblx0XHRcdFx0YnJvd3NlcjogdWEuZ2V0QnJvd3NlcigpLm5hbWUgJiYgKGAkeyB1YS5nZXRCcm93c2VyKCkubmFtZSB9ICR7IHVhLmdldEJyb3dzZXIoKS52ZXJzaW9uIH1gKSxcblx0XHRcdFx0Y3VzdG9tRmllbGRzOiB2aXNpdG9yLmxpdmVjaGF0RGF0YVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHRpZiAoYWdlbnQpIHtcblx0XHRcdHBvc3REYXRhLmFnZW50ID0ge1xuXHRcdFx0XHRfaWQ6IGFnZW50Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lLFxuXHRcdFx0XHRuYW1lOiBhZ2VudC5uYW1lLFxuXHRcdFx0XHRlbWFpbDogbnVsbFxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKGFnZW50LmVtYWlscyAmJiBhZ2VudC5lbWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRwb3N0RGF0YS5hZ2VudC5lbWFpbCA9IGFnZW50LmVtYWlsc1swXS5hZGRyZXNzO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChyb29tLmNybURhdGEpIHtcblx0XHRcdHBvc3REYXRhLmNybURhdGEgPSByb29tLmNybURhdGE7XG5cdFx0fVxuXG5cdFx0aWYgKHZpc2l0b3IudmlzaXRvckVtYWlscyAmJiB2aXNpdG9yLnZpc2l0b3JFbWFpbHMubGVuZ3RoID4gMCkge1xuXHRcdFx0cG9zdERhdGEudmlzaXRvci5lbWFpbCA9IHZpc2l0b3IudmlzaXRvckVtYWlscztcblx0XHR9XG5cdFx0aWYgKHZpc2l0b3IucGhvbmUgJiYgdmlzaXRvci5waG9uZS5sZW5ndGggPiAwKSB7XG5cdFx0XHRwb3N0RGF0YS52aXNpdG9yLnBob25lID0gdmlzaXRvci5waG9uZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcG9zdERhdGE7XG5cdH0sXG5cblx0YWRkQWdlbnQodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxLCB1c2VybmFtZTogMSB9IH0pO1xuXG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsaXZlY2hhdDphZGRBZ2VudCcgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtYWdlbnQnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IodXNlci5faWQsIHRydWUpO1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0TGl2ZWNoYXRTdGF0dXModXNlci5faWQsICdhdmFpbGFibGUnKTtcblx0XHRcdHJldHVybiB1c2VyO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXHRhZGRNYW5hZ2VyKHVzZXJuYW1lKSB7XG5cdFx0Y2hlY2sodXNlcm5hbWUsIFN0cmluZyk7XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHsgZmllbGRzOiB7IF9pZDogMSwgdXNlcm5hbWU6IDEgfSB9KTtcblxuXHRcdGlmICghdXNlcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHsgbWV0aG9kOiAnbGl2ZWNoYXQ6YWRkTWFuYWdlcicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouYWRkVXNlclJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gdXNlcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0cmVtb3ZlQWdlbnQodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZUFnZW50JyB9KTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzKHVzZXIuX2lkLCAnbGl2ZWNoYXQtYWdlbnQnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0T3BlcmF0b3IodXNlci5faWQsIGZhbHNlKTtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlVzZXJzLnNldExpdmVjaGF0U3RhdHVzKHVzZXIuX2lkLCAnbm90LWF2YWlsYWJsZScpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cdHJlbW92ZU1hbmFnZXIodXNlcm5hbWUpIHtcblx0XHRjaGVjayh1c2VybmFtZSwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlVc2VybmFtZSh1c2VybmFtZSwgeyBmaWVsZHM6IHsgX2lkOiAxIH0gfSk7XG5cblx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZU1hbmFnZXInIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXModXNlci5faWQsICdsaXZlY2hhdC1tYW5hZ2VyJyk7XG5cdH0sXG5cblx0c2F2ZURlcGFydG1lbnQoX2lkLCBkZXBhcnRtZW50RGF0YSwgZGVwYXJ0bWVudEFnZW50cykge1xuXHRcdGNoZWNrKF9pZCwgTWF0Y2guTWF5YmUoU3RyaW5nKSk7XG5cblx0XHRjaGVjayhkZXBhcnRtZW50RGF0YSwge1xuXHRcdFx0ZW5hYmxlZDogQm9vbGVhbixcblx0XHRcdG5hbWU6IFN0cmluZyxcblx0XHRcdGRlc2NyaXB0aW9uOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0c2hvd09uUmVnaXN0cmF0aW9uOiBCb29sZWFuXG5cdFx0fSk7XG5cblx0XHRjaGVjayhkZXBhcnRtZW50QWdlbnRzLCBbXG5cdFx0XHRNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0XHRhZ2VudElkOiBTdHJpbmcsXG5cdFx0XHRcdHVzZXJuYW1lOiBTdHJpbmdcblx0XHRcdH0pXG5cdFx0XSk7XG5cblx0XHRpZiAoX2lkKSB7XG5cdFx0XHRjb25zdCBkZXBhcnRtZW50ID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmRPbmVCeUlkKF9pZCk7XG5cdFx0XHRpZiAoIWRlcGFydG1lbnQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZGVwYXJ0bWVudC1ub3QtZm91bmQnLCAnRGVwYXJ0bWVudCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnNhdmVEZXBhcnRtZW50JyB9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmNyZWF0ZU9yVXBkYXRlRGVwYXJ0bWVudChfaWQsIGRlcGFydG1lbnREYXRhLCBkZXBhcnRtZW50QWdlbnRzKTtcblx0fSxcblxuXHRyZW1vdmVEZXBhcnRtZW50KF9pZCkge1xuXHRcdGNoZWNrKF9pZCwgU3RyaW5nKTtcblxuXHRcdGNvbnN0IGRlcGFydG1lbnQgPSBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZE9uZUJ5SWQoX2lkLCB7IGZpZWxkczogeyBfaWQ6IDEgfSB9KTtcblxuXHRcdGlmICghZGVwYXJ0bWVudCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZGVwYXJ0bWVudC1ub3QtZm91bmQnLCAnRGVwYXJ0bWVudCBub3QgZm91bmQnLCB7IG1ldGhvZDogJ2xpdmVjaGF0OnJlbW92ZURlcGFydG1lbnQnIH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQucmVtb3ZlQnlJZChfaWQpO1xuXHR9LFxuXG5cdHNob3dDb25uZWN0aW5nKCkge1xuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfUm91dGluZ19NZXRob2QnKSA9PT0gJ0d1ZXN0X1Bvb2wnKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X29wZW5faW5xdWllcnlfc2hvd19jb25uZWN0aW5nJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH1cbn07XG5cblJvY2tldENoYXQuTGl2ZWNoYXQuc3RyZWFtID0gbmV3IE1ldGVvci5TdHJlYW1lcignbGl2ZWNoYXQtcm9vbScpO1xuXG5Sb2NrZXRDaGF0LkxpdmVjaGF0LnN0cmVhbS5hbGxvd1JlYWQoKHJvb21JZCwgZXh0cmFEYXRhKSA9PiB7XG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXHRpZiAoIXJvb20pIHtcblx0XHRjb25zb2xlLndhcm4oYEludmFsaWQgZXZlbnROYW1lOiBcIiR7IHJvb21JZCB9XCJgKTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0aWYgKHJvb20udCA9PT0gJ2wnICYmIGV4dHJhRGF0YSAmJiBleHRyYURhdGEudG9rZW4gJiYgcm9vbS52LnRva2VuID09PSBleHRyYURhdGEudG9rZW4pIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRyZXR1cm4gZmFsc2U7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2hpc3RvcnlfbW9uaXRvcl90eXBlJywgKGtleSwgdmFsdWUpID0+IHtcblx0Um9ja2V0Q2hhdC5MaXZlY2hhdC5oaXN0b3J5TW9uaXRvclR5cGUgPSB2YWx1ZTtcbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQuUXVldWVNZXRob2RzID0ge1xuXHQvKiBMZWFzdCBBbW91bnQgUXVldWluZyBtZXRob2Q6XG5cdCAqXG5cdCAqIGRlZmF1bHQgbWV0aG9kIHdoZXJlIHRoZSBhZ2VudCB3aXRoIHRoZSBsZWFzdCBudW1iZXJcblx0ICogb2Ygb3BlbiBjaGF0cyBpcyBwYWlyZWQgd2l0aCB0aGUgaW5jb21pbmcgbGl2ZWNoYXRcblx0ICovXG5cdCdMZWFzdF9BbW91bnQnKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbywgYWdlbnQpIHtcblx0XHRpZiAoIWFnZW50KSB7XG5cdFx0XHRhZ2VudCA9IFJvY2tldENoYXQuTGl2ZWNoYXQuZ2V0TmV4dEFnZW50KGd1ZXN0LmRlcGFydG1lbnQpO1xuXHRcdFx0aWYgKCFhZ2VudCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCduby1hZ2VudC1vbmxpbmUnLCAnU29ycnksIG5vIG9ubGluZSBhZ2VudHMnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByb29tQ29kZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmdldE5leHRMaXZlY2hhdFJvb21Db2RlKCk7XG5cblx0XHRjb25zdCByb29tID0gXy5leHRlbmQoe1xuXHRcdFx0X2lkOiBtZXNzYWdlLnJpZCxcblx0XHRcdG1zZ3M6IDEsXG5cdFx0XHRsbTogbmV3IERhdGUoKSxcblx0XHRcdGNvZGU6IHJvb21Db2RlLFxuXHRcdFx0bGFiZWw6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHQvLyB1c2VybmFtZXM6IFthZ2VudC51c2VybmFtZSwgZ3Vlc3QudXNlcm5hbWVdLFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0dHM6IG5ldyBEYXRlKCksXG5cdFx0XHR2OiB7XG5cdFx0XHRcdF9pZDogZ3Vlc3QuX2lkLFxuXHRcdFx0XHR1c2VybmFtZTogZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRcdHRva2VuOiBtZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRzdGF0dXM6IGd1ZXN0LnN0YXR1cyB8fCAnb25saW5lJ1xuXHRcdFx0fSxcblx0XHRcdHNlcnZlZEJ5OiB7XG5cdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0Y2w6IGZhbHNlLFxuXHRcdFx0b3BlbjogdHJ1ZSxcblx0XHRcdHdhaXRpbmdSZXNwb25zZTogdHJ1ZVxuXHRcdH0sIHJvb21JbmZvKTtcblx0XHRjb25zdCBzdWJzY3JpcHRpb25EYXRhID0ge1xuXHRcdFx0cmlkOiBtZXNzYWdlLnJpZCxcblx0XHRcdG5hbWU6IGd1ZXN0Lm5hbWUgfHwgZ3Vlc3QudXNlcm5hbWUsXG5cdFx0XHRhbGVydDogdHJ1ZSxcblx0XHRcdG9wZW46IHRydWUsXG5cdFx0XHR1bnJlYWQ6IDEsXG5cdFx0XHR1c2VyTWVudGlvbnM6IDEsXG5cdFx0XHRncm91cE1lbnRpb25zOiAwLFxuXHRcdFx0Y29kZTogcm9vbUNvZGUsXG5cdFx0XHR1OiB7XG5cdFx0XHRcdF9pZDogYWdlbnQuYWdlbnRJZCxcblx0XHRcdFx0dXNlcm5hbWU6IGFnZW50LnVzZXJuYW1lXG5cdFx0XHR9LFxuXHRcdFx0dDogJ2wnLFxuXHRcdFx0ZGVza3RvcE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0bW9iaWxlUHVzaE5vdGlmaWNhdGlvbnM6ICdhbGwnLFxuXHRcdFx0ZW1haWxOb3RpZmljYXRpb25zOiAnYWxsJ1xuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5pbnNlcnQocm9vbSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5pbnNlcnQoc3Vic2NyaXB0aW9uRGF0YSk7XG5cblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LnN0cmVhbS5lbWl0KHJvb20uX2lkLCB7XG5cdFx0XHR0eXBlOiAnYWdlbnREYXRhJyxcblx0XHRcdGRhdGE6IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmdldEFnZW50SW5mbyhhZ2VudC5hZ2VudElkKVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHJvb207XG5cdH0sXG5cdC8qIEd1ZXN0IFBvb2wgUXVldWluZyBNZXRob2Q6XG5cdCAqXG5cdCAqIEFuIGluY29tbWluZyBsaXZlY2hhdCBpcyBjcmVhdGVkIGFzIGFuIElucXVpcnlcblx0ICogd2hpY2ggaXMgcGlja2VkIHVwIGZyb20gYW4gYWdlbnQuXG5cdCAqIEFuIElucXVpcnkgaXMgdmlzaWJsZSB0byBhbGwgYWdlbnRzIChUT0RPOiBpbiB0aGUgY29ycmVjdCBkZXBhcnRtZW50KVxuICAgICAqXG5cdCAqIEEgcm9vbSBpcyBzdGlsbCBjcmVhdGVkIHdpdGggdGhlIGluaXRpYWwgbWVzc2FnZSwgYnV0IGl0IGlzIG9jY3VwaWVkIGJ5XG5cdCAqIG9ubHkgdGhlIGNsaWVudCB1bnRpbCBwYWlyZWQgd2l0aCBhbiBhZ2VudFxuXHQgKi9cblx0J0d1ZXN0X1Bvb2wnKGd1ZXN0LCBtZXNzYWdlLCByb29tSW5mbykge1xuXHRcdGxldCBhZ2VudHMgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldE9ubGluZUFnZW50cyhndWVzdC5kZXBhcnRtZW50KTtcblxuXHRcdGlmIChhZ2VudHMuY291bnQoKSA9PT0gMCAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfZ3Vlc3RfcG9vbF93aXRoX25vX2FnZW50cycpKSB7XG5cdFx0XHRhZ2VudHMgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LmdldEFnZW50cyhndWVzdC5kZXBhcnRtZW50KTtcblx0XHR9XG5cblx0XHRpZiAoYWdlbnRzLmNvdW50KCkgPT09IDApIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vLWFnZW50LW9ubGluZScsICdTb3JyeSwgbm8gb25saW5lIGFnZW50cycpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb21Db2RlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZ2V0TmV4dExpdmVjaGF0Um9vbUNvZGUoKTtcblxuXHRcdGNvbnN0IGFnZW50SWRzID0gW107XG5cblx0XHRhZ2VudHMuZm9yRWFjaCgoYWdlbnQpID0+IHtcblx0XHRcdGlmIChndWVzdC5kZXBhcnRtZW50KSB7XG5cdFx0XHRcdGFnZW50SWRzLnB1c2goYWdlbnQuYWdlbnRJZCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhZ2VudElkcy5wdXNoKGFnZW50Ll9pZCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRjb25zdCBpbnF1aXJ5ID0ge1xuXHRcdFx0cmlkOiBtZXNzYWdlLnJpZCxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UubXNnLFxuXHRcdFx0bmFtZTogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Y29kZTogcm9vbUNvZGUsXG5cdFx0XHRkZXBhcnRtZW50OiBndWVzdC5kZXBhcnRtZW50LFxuXHRcdFx0YWdlbnRzOiBhZ2VudElkcyxcblx0XHRcdHN0YXR1czogJ29wZW4nLFxuXHRcdFx0djoge1xuXHRcdFx0XHRfaWQ6IGd1ZXN0Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0XHR0b2tlbjogbWVzc2FnZS50b2tlbixcblx0XHRcdFx0c3RhdHVzOiBndWVzdC5zdGF0dXMgfHwgJ29ubGluZSdcblx0XHRcdH0sXG5cdFx0XHR0OiAnbCdcblx0XHR9O1xuXHRcdGNvbnN0IHJvb20gPSBfLmV4dGVuZCh7XG5cdFx0XHRfaWQ6IG1lc3NhZ2UucmlkLFxuXHRcdFx0bXNnczogMSxcblx0XHRcdGxtOiBuZXcgRGF0ZSgpLFxuXHRcdFx0Y29kZTogcm9vbUNvZGUsXG5cdFx0XHRsYWJlbDogZ3Vlc3QubmFtZSB8fCBndWVzdC51c2VybmFtZSxcblx0XHRcdC8vIHVzZXJuYW1lczogW2d1ZXN0LnVzZXJuYW1lXSxcblx0XHRcdHQ6ICdsJyxcblx0XHRcdHRzOiBuZXcgRGF0ZSgpLFxuXHRcdFx0djoge1xuXHRcdFx0XHRfaWQ6IGd1ZXN0Ll9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGd1ZXN0LnVzZXJuYW1lLFxuXHRcdFx0XHR0b2tlbjogbWVzc2FnZS50b2tlbixcblx0XHRcdFx0c3RhdHVzOiBndWVzdC5zdGF0dXNcblx0XHRcdH0sXG5cdFx0XHRjbDogZmFsc2UsXG5cdFx0XHRvcGVuOiB0cnVlLFxuXHRcdFx0d2FpdGluZ1Jlc3BvbnNlOiB0cnVlXG5cdFx0fSwgcm9vbUluZm8pO1xuXHRcdFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0SW5xdWlyeS5pbnNlcnQoaW5xdWlyeSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuaW5zZXJ0KHJvb20pO1xuXG5cdFx0cmV0dXJuIHJvb207XG5cdH0sXG5cdCdFeHRlcm5hbCcoZ3Vlc3QsIG1lc3NhZ2UsIHJvb21JbmZvLCBhZ2VudCkge1xuXHRcdHJldHVybiB0aGlzWydMZWFzdF9BbW91bnQnXShndWVzdCwgbWVzc2FnZSwgcm9vbUluZm8sIGFnZW50KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXHR9XG59O1xuIiwiLy8gRXZlcnkgbWludXRlIGNoZWNrIGlmIG9mZmljZSBjbG9zZWRcbk1ldGVvci5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9lbmFibGVfb2ZmaWNlX2hvdXJzJykpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyLmlzT3BlbmluZ1RpbWUoKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMub3Blbk9mZmljZSgpO1xuXHRcdH0gZWxzZSBpZiAoUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyLmlzQ2xvc2luZ1RpbWUoKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuY2xvc2VPZmZpY2UoKTtcblx0XHR9XG5cdH1cbn0sIDYwMDAwKTtcbiIsImNvbnN0IGdhdGV3YXlVUkwgPSAnaHR0cHM6Ly9vbW5pLnJvY2tldC5jaGF0JztcblxuZXhwb3J0IGRlZmF1bHQge1xuXHRlbmFibGUoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdQT1NUJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9lbmFibGVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gLFxuXHRcdFx0XHQnY29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG5cdFx0XHR9LFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHR1cmw6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTaXRlX1VybCcpXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdGRpc2FibGUoKSB7XG5cdFx0Y29uc3QgcmVzdWx0ID0gSFRUUC5jYWxsKCdERUxFVEUnLCBgJHsgZ2F0ZXdheVVSTCB9L2ZhY2Vib29rL2VuYWJsZWAsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWAsXG5cdFx0XHRcdCdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0sXG5cblx0bGlzdFBhZ2VzKCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9wYWdlc2AsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWBcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0sXG5cblx0c3Vic2NyaWJlKHBhZ2VJZCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnUE9TVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcGFnZS8keyBwYWdlSWQgfS9zdWJzY3JpYmVgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHJlc3VsdC5kYXRhO1xuXHR9LFxuXG5cdHVuc3Vic2NyaWJlKHBhZ2VJZCkge1xuXHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuY2FsbCgnREVMRVRFJywgYCR7IGdhdGV3YXlVUkwgfS9mYWNlYm9vay9wYWdlLyR7IHBhZ2VJZCB9L3N1YnNjcmliZWAsIHtcblx0XHRcdGhlYWRlcnM6IHtcblx0XHRcdFx0J2F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9GYWNlYm9va19BUElfS2V5JykgfWBcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcmVzdWx0LmRhdGE7XG5cdH0sXG5cblx0cmVwbHkoeyBwYWdlLCB0b2tlbiwgdGV4dCB9KSB7XG5cdFx0cmV0dXJuIEhUVFAuY2FsbCgnUE9TVCcsIGAkeyBnYXRld2F5VVJMIH0vZmFjZWJvb2svcmVwbHlgLCB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdhdXRob3JpemF0aW9uJzogYEJlYXJlciAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX0tleScpIH1gXG5cdFx0XHR9LFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRwYWdlLFxuXHRcdFx0XHR0b2tlbixcblx0XHRcdFx0dGV4dFxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59O1xuIiwiaW1wb3J0IExpdmVjaGF0VmlzaXRvcnMgZnJvbSAnLi9tb2RlbHMvTGl2ZWNoYXRWaXNpdG9ycyc7XG5cblJvY2tldENoYXQuY2FsbGJhY2tzLmFkZCgnYWZ0ZXJTYXZlTWVzc2FnZScsIGZ1bmN0aW9uKG1lc3NhZ2UsIHJvb20pIHtcblx0Ly8gc2tpcHMgdGhpcyBjYWxsYmFjayBpZiB0aGUgbWVzc2FnZSB3YXMgZWRpdGVkXG5cdGlmIChtZXNzYWdlLmVkaXRlZEF0KSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuU01TLmVuYWJsZWQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIG9ubHkgc2VuZCB0aGUgc21zIGJ5IFNNUyBpZiBpdCBpcyBhIGxpdmVjaGF0IHJvb20gd2l0aCBTTVMgc2V0IHRvIHRydWVcblx0aWYgKCEodHlwZW9mIHJvb20udCAhPT0gJ3VuZGVmaW5lZCcgJiYgcm9vbS50ID09PSAnbCcgJiYgcm9vbS5zbXMgJiYgcm9vbS52ICYmIHJvb20udi50b2tlbikpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHRva2VuLCBpdCB3YXMgc2VudCBmcm9tIHRoZSB2aXNpdG9yLCBzbyBpZ25vcmUgaXRcblx0aWYgKG1lc3NhZ2UudG9rZW4pIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdC8vIGlmIHRoZSBtZXNzYWdlIGhhcyBhIHR5cGUgbWVhbnMgaXQgaXMgYSBzcGVjaWFsIG1lc3NhZ2UgKGxpa2UgdGhlIGNsb3NpbmcgY29tbWVudCksIHNvIHNraXBzXG5cdGlmIChtZXNzYWdlLnQpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGNvbnN0IFNNU1NlcnZpY2UgPSBSb2NrZXRDaGF0LlNNUy5nZXRTZXJ2aWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTTVNfU2VydmljZScpKTtcblxuXHRpZiAoIVNNU1NlcnZpY2UpIHtcblx0XHRyZXR1cm4gbWVzc2FnZTtcblx0fVxuXG5cdGNvbnN0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmdldFZpc2l0b3JCeVRva2VuKHJvb20udi50b2tlbik7XG5cblx0aWYgKCF2aXNpdG9yIHx8ICF2aXNpdG9yLnBob25lIHx8IHZpc2l0b3IucGhvbmUubGVuZ3RoID09PSAwKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2U7XG5cdH1cblxuXHRTTVNTZXJ2aWNlLnNlbmQocm9vbS5zbXMuZnJvbSwgdmlzaXRvci5waG9uZVswXS5waG9uZU51bWJlciwgbWVzc2FnZS5tc2cpO1xuXG5cdHJldHVybiBtZXNzYWdlO1xuXG59LCBSb2NrZXRDaGF0LmNhbGxiYWNrcy5wcmlvcml0eS5MT1csICdzZW5kTWVzc2FnZUJ5U21zJyk7XG4iLCIvKiBnbG9iYWxzIFVzZXJQcmVzZW5jZU1vbml0b3IgKi9cblxubGV0IGFnZW50c0hhbmRsZXI7XG5sZXQgbW9uaXRvckFnZW50cyA9IGZhbHNlO1xubGV0IGFjdGlvblRpbWVvdXQgPSA2MDAwMDtcblxuY29uc3Qgb25saW5lQWdlbnRzID0ge1xuXHR1c2Vyczoge30sXG5cdHF1ZXVlOiB7fSxcblxuXHRhZGQodXNlcklkKSB7XG5cdFx0aWYgKHRoaXMucXVldWVbdXNlcklkXSkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucXVldWVbdXNlcklkXSk7XG5cdFx0XHRkZWxldGUgdGhpcy5xdWV1ZVt1c2VySWRdO1xuXHRcdH1cblx0XHR0aGlzLnVzZXJzW3VzZXJJZF0gPSAxO1xuXHR9LFxuXG5cdHJlbW92ZSh1c2VySWQsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKHRoaXMucXVldWVbdXNlcklkXSkge1xuXHRcdFx0Y2xlYXJUaW1lb3V0KHRoaXMucXVldWVbdXNlcklkXSk7XG5cdFx0fVxuXHRcdHRoaXMucXVldWVbdXNlcklkXSA9IHNldFRpbWVvdXQoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRjYWxsYmFjaygpO1xuXG5cdFx0XHRkZWxldGUgdGhpcy51c2Vyc1t1c2VySWRdO1xuXHRcdFx0ZGVsZXRlIHRoaXMucXVldWVbdXNlcklkXTtcblx0XHR9KSwgYWN0aW9uVGltZW91dCk7XG5cdH0sXG5cblx0ZXhpc3RzKHVzZXJJZCkge1xuXHRcdHJldHVybiAhIXRoaXMudXNlcnNbdXNlcklkXTtcblx0fVxufTtcblxuZnVuY3Rpb24gcnVuQWdlbnRMZWF2ZUFjdGlvbih1c2VySWQpIHtcblx0Y29uc3QgYWN0aW9uID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbicpO1xuXHRpZiAoYWN0aW9uID09PSAnY2xvc2UnKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuTGl2ZWNoYXQuY2xvc2VPcGVuQ2hhdHModXNlcklkLCBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfY29tbWVudCcpKTtcblx0fSBlbHNlIGlmIChhY3Rpb24gPT09ICdmb3J3YXJkJykge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkxpdmVjaGF0LmZvcndhcmRPcGVuQ2hhdHModXNlcklkKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uX3RpbWVvdXQnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdGFjdGlvblRpbWVvdXQgPSB2YWx1ZSAqIDEwMDA7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X2FnZW50X2xlYXZlX2FjdGlvbicsIGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcblx0bW9uaXRvckFnZW50cyA9IHZhbHVlO1xuXHRpZiAodmFsdWUgIT09ICdub25lJykge1xuXHRcdGlmICghYWdlbnRzSGFuZGxlcikge1xuXHRcdFx0YWdlbnRzSGFuZGxlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmxpbmVBZ2VudHMoKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0XHRcdGFkZGVkKGlkKSB7XG5cdFx0XHRcdFx0b25saW5lQWdlbnRzLmFkZChpZCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0XHRcdGlmIChmaWVsZHMuc3RhdHVzTGl2ZWNoYXQgJiYgZmllbGRzLnN0YXR1c0xpdmVjaGF0ID09PSAnbm90LWF2YWlsYWJsZScpIHtcblx0XHRcdFx0XHRcdG9ubGluZUFnZW50cy5yZW1vdmUoaWQsICgpID0+IHtcblx0XHRcdFx0XHRcdFx0cnVuQWdlbnRMZWF2ZUFjdGlvbihpZCk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0b25saW5lQWdlbnRzLmFkZChpZCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRcdFx0b25saW5lQWdlbnRzLnJlbW92ZShpZCwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0cnVuQWdlbnRMZWF2ZUFjdGlvbihpZCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSBlbHNlIGlmIChhZ2VudHNIYW5kbGVyKSB7XG5cdFx0YWdlbnRzSGFuZGxlci5zdG9wKCk7XG5cdFx0YWdlbnRzSGFuZGxlciA9IG51bGw7XG5cdH1cbn0pO1xuXG5Vc2VyUHJlc2VuY2VNb25pdG9yLm9uU2V0VXNlclN0YXR1cygodXNlciwgc3RhdHVzLyosIHN0YXR1c0Nvbm5lY3Rpb24qLykgPT4ge1xuXHRpZiAoIW1vbml0b3JBZ2VudHMpIHtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKG9ubGluZUFnZW50cy5leGlzdHModXNlci5faWQpKSB7XG5cdFx0aWYgKHN0YXR1cyA9PT0gJ29mZmxpbmUnIHx8IHVzZXIuc3RhdHVzTGl2ZWNoYXQgPT09ICdub3QtYXZhaWxhYmxlJykge1xuXHRcdFx0b25saW5lQWdlbnRzLnJlbW92ZSh1c2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRydW5BZ2VudExlYXZlQWN0aW9uKHVzZXIuX2lkKTtcblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cbk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpjdXN0b21GaWVsZHMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6Y3VzdG9tRmllbGRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmN1c3RvbUZpZWxkcycgfSkpO1xuXHR9XG5cblx0aWYgKHMudHJpbShfaWQpKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0Q3VzdG9tRmllbGQuZmluZCh7IF9pZCB9KTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdEN1c3RvbUZpZWxkLmZpbmQoKTtcblxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6ZGVwYXJ0bWVudEFnZW50cycsIGZ1bmN0aW9uKGRlcGFydG1lbnRJZCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpkZXBhcnRtZW50QWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6ZGVwYXJ0bWVudEFnZW50cycgfSkpO1xuXHR9XG5cblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudEFnZW50cy5maW5kKHsgZGVwYXJ0bWVudElkIH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6ZXh0ZXJuYWxNZXNzYWdlcycsIGZ1bmN0aW9uKHJvb21JZCkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRFeHRlcm5hbE1lc3NhZ2UuZmluZEJ5Um9vbUlkKHJvb21JZCk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDphZ2VudHMnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZSgnbGl2ZWNoYXQtYWdlbnQnKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnYWdlbnRVc2VycycsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2FnZW50VXNlcnMnLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnYWdlbnRVc2VycycsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHNlbGYucmVhZHkoKTtcblxuXHRzZWxmLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OmFwcGVhcmFuY2UnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YXBwZWFyYW5jZScgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YXBwZWFyYW5jZScgfSkpO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkOiB7XG5cdFx0XHQkaW46IFtcblx0XHRcdFx0J0xpdmVjaGF0X3RpdGxlJyxcblx0XHRcdFx0J0xpdmVjaGF0X3RpdGxlX2NvbG9yJyxcblx0XHRcdFx0J0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLFxuXHRcdFx0XHQnTGl2ZWNoYXRfZGlzcGxheV9vZmZsaW5lX2Zvcm0nLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3N1Y2Nlc3NfbWVzc2FnZScsXG5cdFx0XHRcdCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlJyxcblx0XHRcdFx0J0xpdmVjaGF0X29mZmxpbmVfdGl0bGVfY29sb3InLFxuXHRcdFx0XHQnTGl2ZWNoYXRfb2ZmbGluZV9lbWFpbCdcblx0XHRcdF1cblx0XHR9XG5cdH07XG5cblx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0Y29uc3QgaGFuZGxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZChxdWVyeSkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0QXBwZWFyYW5jZScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdEFwcGVhcmFuY2UnLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6ZGVwYXJ0bWVudHMnLCBmdW5jdGlvbihfaWQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmFnZW50cycgfSkpO1xuXHR9XG5cblx0aWYgKF9pZCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kQnlEZXBhcnRtZW50SWQoX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50LmZpbmQoKTtcblx0fVxuXG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDppbnRlZ3JhdGlvbicsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDppbnRlZ3JhdGlvbicgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW50ZWdyYXRpb24nIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRCeUlkcyhbJ0xpdmVjaGF0X3dlYmhvb2tVcmwnLCAnTGl2ZWNoYXRfc2VjcmV0X3Rva2VuJywgJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCAnTGl2ZWNoYXRfd2ViaG9va19vbl9vZmZsaW5lX21zZyddKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbGl2ZWNoYXRJbnRlZ3JhdGlvbicsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0SW50ZWdyYXRpb24nLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdHJlbW92ZWQoaWQpIHtcblx0XHRcdHNlbGYucmVtb3ZlZCgnbGl2ZWNoYXRJbnRlZ3JhdGlvbicsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHNlbGYucmVhZHkoKTtcblxuXHRzZWxmLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0Om1hbmFnZXJzJywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0Om1hbmFnZXJzJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtcm9vbXMnKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6bWFuYWdlcnMnIH0pKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUoJ2xpdmVjaGF0LW1hbmFnZXInKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbWFuYWdlclVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuY2hhbmdlZCgnbWFuYWdlclVzZXJzJywgaWQsIGZpZWxkcyk7XG5cdFx0fSxcblx0XHRyZW1vdmVkKGlkKSB7XG5cdFx0XHRzZWxmLnJlbW92ZWQoJ21hbmFnZXJVc2VycycsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHNlbGYucmVhZHkoKTtcblxuXHRzZWxmLm9uU3RvcChmdW5jdGlvbigpIHtcblx0XHRoYW5kbGUuc3RvcCgpO1xuXHR9KTtcbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnJvb21zJywgZnVuY3Rpb24oZmlsdGVyID0ge30sIG9mZnNldCA9IDAsIGxpbWl0ID0gMjApIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cm9vbXMnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1yb29tcycpKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDpyb29tcycgfSkpO1xuXHR9XG5cblx0Y2hlY2soZmlsdGVyLCB7XG5cdFx0bmFtZTogTWF0Y2guTWF5YmUoU3RyaW5nKSwgLy8gcm9vbSBuYW1lIHRvIGZpbHRlclxuXHRcdGFnZW50OiBNYXRjaC5NYXliZShTdHJpbmcpLCAvLyBhZ2VudCBfaWQgd2hvIGlzIHNlcnZpbmdcblx0XHRzdGF0dXM6IE1hdGNoLk1heWJlKFN0cmluZyksIC8vIGVpdGhlciAnb3BlbmVkJyBvciAnY2xvc2VkJ1xuXHRcdGZyb206IE1hdGNoLk1heWJlKERhdGUpLFxuXHRcdHRvOiBNYXRjaC5NYXliZShEYXRlKVxuXHR9KTtcblxuXHRjb25zdCBxdWVyeSA9IHt9O1xuXHRpZiAoZmlsdGVyLm5hbWUpIHtcblx0XHRxdWVyeS5sYWJlbCA9IG5ldyBSZWdFeHAoZmlsdGVyLm5hbWUsICdpJyk7XG5cdH1cblx0aWYgKGZpbHRlci5hZ2VudCkge1xuXHRcdHF1ZXJ5WydzZXJ2ZWRCeS5faWQnXSA9IGZpbHRlci5hZ2VudDtcblx0fVxuXHRpZiAoZmlsdGVyLnN0YXR1cykge1xuXHRcdGlmIChmaWx0ZXIuc3RhdHVzID09PSAnb3BlbmVkJykge1xuXHRcdFx0cXVlcnkub3BlbiA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHF1ZXJ5Lm9wZW4gPSB7ICRleGlzdHM6IGZhbHNlIH07XG5cdFx0fVxuXHR9XG5cdGlmIChmaWx0ZXIuZnJvbSkge1xuXHRcdHF1ZXJ5LnRzID0ge1xuXHRcdFx0JGd0ZTogZmlsdGVyLmZyb21cblx0XHR9O1xuXHR9XG5cdGlmIChmaWx0ZXIudG8pIHtcblx0XHRmaWx0ZXIudG8uc2V0RGF0ZShmaWx0ZXIudG8uZ2V0RGF0ZSgpICsgMSk7XG5cdFx0ZmlsdGVyLnRvLnNldFNlY29uZHMoZmlsdGVyLnRvLmdldFNlY29uZHMoKSAtIDEpO1xuXG5cdFx0aWYgKCFxdWVyeS50cykge1xuXHRcdFx0cXVlcnkudHMgPSB7fTtcblx0XHR9XG5cdFx0cXVlcnkudHMuJGx0ZSA9IGZpbHRlci50bztcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRMaXZlY2hhdChxdWVyeSwgb2Zmc2V0LCBsaW1pdCkub2JzZXJ2ZUNoYW5nZXMoe1xuXHRcdGFkZGVkKGlkLCBmaWVsZHMpIHtcblx0XHRcdHNlbGYuYWRkZWQoJ2xpdmVjaGF0Um9vbScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0Y2hhbmdlZChpZCwgZmllbGRzKSB7XG5cdFx0XHRzZWxmLmNoYW5nZWQoJ2xpdmVjaGF0Um9vbScsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdFJvb20nLCBpZCk7XG5cdFx0fVxuXHR9KTtcblxuXHR0aGlzLnJlYWR5KCk7XG5cblx0dGhpcy5vblN0b3AoKCkgPT4ge1xuXHRcdGhhbmRsZS5zdG9wKCk7XG5cdH0pO1xufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6cXVldWUnLCBmdW5jdGlvbigpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cXVldWUnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6cXVldWUnIH0pKTtcblx0fVxuXG5cdC8vIGxldCBzb3J0ID0geyBjb3VudDogMSwgc29ydDogMSwgdXNlcm5hbWU6IDEgfTtcblx0Ly8gbGV0IG9ubGluZVVzZXJzID0ge307XG5cblx0Ly8gbGV0IGhhbmRsZVVzZXJzID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9ubGluZUFnZW50cygpLm9ic2VydmVDaGFuZ2VzKHtcblx0Ly8gXHRhZGRlZChpZCwgZmllbGRzKSB7XG5cdC8vIFx0XHRvbmxpbmVVc2Vyc1tmaWVsZHMudXNlcm5hbWVdID0gMTtcblx0Ly8gXHRcdC8vIHRoaXMuYWRkZWQoJ2xpdmVjaGF0UXVldWVVc2VyJywgaWQsIGZpZWxkcyk7XG5cdC8vIFx0fSxcblx0Ly8gXHRjaGFuZ2VkKGlkLCBmaWVsZHMpIHtcblx0Ly8gXHRcdG9ubGluZVVzZXJzW2ZpZWxkcy51c2VybmFtZV0gPSAxO1xuXHQvLyBcdFx0Ly8gdGhpcy5jaGFuZ2VkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHQvLyBcdH0sXG5cdC8vIFx0cmVtb3ZlZChpZCkge1xuXHQvLyBcdFx0dGhpcy5yZW1vdmVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkKTtcblx0Ly8gXHR9XG5cdC8vIH0pO1xuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXG5cdGNvbnN0IGhhbmRsZURlcHRzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmRVc2Vyc0luUXVldWUoKS5vYnNlcnZlQ2hhbmdlcyh7XG5cdFx0YWRkZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5hZGRlZCgnbGl2ZWNoYXRRdWV1ZVVzZXInLCBpZCwgZmllbGRzKTtcblx0XHR9LFxuXHRcdGNoYW5nZWQoaWQsIGZpZWxkcykge1xuXHRcdFx0c2VsZi5jaGFuZ2VkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkLCBmaWVsZHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlZChpZCkge1xuXHRcdFx0c2VsZi5yZW1vdmVkKCdsaXZlY2hhdFF1ZXVlVXNlcicsIGlkKTtcblx0XHR9XG5cdH0pO1xuXG5cdHRoaXMucmVhZHkoKTtcblxuXHR0aGlzLm9uU3RvcCgoKSA9PiB7XG5cdFx0Ly8gaGFuZGxlVXNlcnMuc3RvcCgpO1xuXHRcdGhhbmRsZURlcHRzLnN0b3AoKTtcblx0fSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDp0cmlnZ2VycycsIGZ1bmN0aW9uKF9pZCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp0cmlnZ2VycycgfSkpO1xuXHR9XG5cblx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dHJpZ2dlcnMnIH0pKTtcblx0fVxuXG5cdGlmIChfaWQgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdFRyaWdnZXIuZmluZEJ5SWQoX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRUcmlnZ2VyLmZpbmQoKTtcblx0fVxufSk7XG4iLCJNZXRlb3IucHVibGlzaCgnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknLCBmdW5jdGlvbih7IHJpZDogcm9vbUlkIH0pIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvckhpc3RvcnknIH0pKTtcblx0fVxuXG5cdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyb29tSWQpO1xuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVzZXJJZCk7XG5cblx0aWYgKHJvb20udXNlcm5hbWVzLmluZGV4T2YodXNlci51c2VybmFtZSkgPT09IC0xKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp2aXNpdG9ySGlzdG9yeScgfSkpO1xuXHR9XG5cblx0aWYgKHJvb20gJiYgcm9vbS52ICYmIHJvb20udi5faWQpIHtcblx0XHQvLyBDQUNIRTogY2FuIHdlIHN0b3AgdXNpbmcgcHVibGljYXRpb25zIGhlcmU/XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVZpc2l0b3JJZChyb29tLnYuX2lkKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG59KTtcbiIsImltcG9ydCBMaXZlY2hhdFZpc2l0b3JzIGZyb20gJy4uL21vZGVscy9MaXZlY2hhdFZpc2l0b3JzJztcblxuTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJywgZnVuY3Rpb24oeyByaWQ6IHJvb21JZCB9KSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJyB9KSk7XG5cdH1cblxuXHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbC1yb29tJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OnZpc2l0b3JJbmZvJyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRpZiAocm9vbSAmJiByb29tLnYgJiYgcm9vbS52Ll9pZCkge1xuXHRcdHJldHVybiBMaXZlY2hhdFZpc2l0b3JzLmZpbmRCeUlkKHJvb20udi5faWQpO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2goJ2xpdmVjaGF0OnZpc2l0b3JQYWdlVmlzaXRlZCcsIGZ1bmN0aW9uKHsgcmlkOiByb29tSWQgfSkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZXJyb3IobmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IHB1Ymxpc2g6ICdsaXZlY2hhdDp2aXNpdG9yUGFnZVZpc2l0ZWQnIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6dmlzaXRvclBhZ2VWaXNpdGVkJyB9KSk7XG5cdH1cblxuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbUlkKTtcblxuXHRpZiAocm9vbSAmJiByb29tLnYgJiYgcm9vbS52LnRva2VuKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0UGFnZVZpc2l0ZWQuZmluZEJ5VG9rZW4ocm9vbS52LnRva2VuKTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpO1xuXHR9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDppbnF1aXJ5JywgZnVuY3Rpb24oKSB7XG5cdGlmICghdGhpcy51c2VySWQpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgcHVibGlzaDogJ2xpdmVjaGF0OmlucXVpcnknIH0pKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6aW5xdWlyeScgfSkpO1xuXHR9XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0YWdlbnRzOiB0aGlzLnVzZXJJZCxcblx0XHRzdGF0dXM6ICdvcGVuJ1xuXHR9O1xuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdElucXVpcnkuZmluZChxdWVyeSk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdsaXZlY2hhdDpvZmZpY2VIb3VyJywgZnVuY3Rpb24oKSB7XG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1sLXJvb20nKSkge1xuXHRcdHJldHVybiB0aGlzLmVycm9yKG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLW5vdC1hdXRob3JpemVkJywgJ05vdCBhdXRob3JpemVkJywgeyBwdWJsaXNoOiAnbGl2ZWNoYXQ6YWdlbnRzJyB9KSk7XG5cdH1cblxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXRPZmZpY2VIb3VyLmZpbmQoKTtcbn0pO1xuIiwiaW1wb3J0ICcuLi9pbXBvcnRzL3NlcnZlci9yZXN0L2RlcGFydG1lbnRzLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC9mYWNlYm9vay5qcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvc2VydmVyL3Jlc3Qvc21zLmpzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9zZXJ2ZXIvcmVzdC91c2Vycy5qcyc7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuXHRjb25zdCByb2xlcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZCgpLmZldGNoKCksICduYW1lJyk7XG5cdGlmIChyb2xlcy5pbmRleE9mKCdsaXZlY2hhdC1hZ2VudCcpID09PSAtMSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmNyZWF0ZU9yVXBkYXRlKCdsaXZlY2hhdC1hZ2VudCcpO1xuXHR9XG5cdGlmIChyb2xlcy5pbmRleE9mKCdsaXZlY2hhdC1tYW5hZ2VyJykgPT09IC0xKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUoJ2xpdmVjaGF0LW1hbmFnZXInKTtcblx0fVxuXHRpZiAocm9sZXMuaW5kZXhPZignbGl2ZWNoYXQtZ3Vlc3QnKSA9PT0gLTEpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5jcmVhdGVPclVwZGF0ZSgnbGl2ZWNoYXQtZ3Vlc3QnKTtcblx0fVxuXHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgndmlldy1sLXJvb20nLCBbJ2xpdmVjaGF0LWFnZW50JywgJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicsIFsnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgndmlldy1saXZlY2hhdC1yb29tcycsIFsnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnY2xvc2UtbGl2ZWNoYXQtcm9vbScsIFsnbGl2ZWNoYXQtYWdlbnQnLCAnbGl2ZWNoYXQtbWFuYWdlcicsICdhZG1pbiddKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5jcmVhdGVPclVwZGF0ZSgnY2xvc2Utb3RoZXJzLWxpdmVjaGF0LXJvb20nLCBbJ2xpdmVjaGF0LW1hbmFnZXInLCAnYWRtaW4nXSk7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuY3JlYXRlT3JVcGRhdGUoJ3NhdmUtb3RoZXJzLWxpdmVjaGF0LXJvb20taW5mbycsIFsnbGl2ZWNoYXQtbWFuYWdlciddKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0Lk1lc3NhZ2VUeXBlcy5yZWdpc3RlclR5cGUoe1xuXHRpZDogJ2xpdmVjaGF0X3ZpZGVvX2NhbGwnLFxuXHRzeXN0ZW06IHRydWUsXG5cdG1lc3NhZ2U6ICdOZXdfdmlkZW9jYWxsX3JlcXVlc3QnXG59KTtcblxuUm9ja2V0Q2hhdC5hY3Rpb25MaW5rcy5yZWdpc3RlcignY3JlYXRlTGl2ZWNoYXRDYWxsJywgZnVuY3Rpb24obWVzc2FnZSwgcGFyYW1zLCBpbnN0YW5jZSkge1xuXHRpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG5cdFx0aW5zdGFuY2UudGFiQmFyLm9wZW4oJ3ZpZGVvJyk7XG5cdH1cbn0pO1xuXG5Sb2NrZXRDaGF0LmFjdGlvbkxpbmtzLnJlZ2lzdGVyKCdkZW55TGl2ZWNoYXRDYWxsJywgZnVuY3Rpb24obWVzc2FnZS8qLCBwYXJhbXMqLykge1xuXHRpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdjb21tYW5kJywgbWVzc2FnZS5yaWQsICdlbmRDYWxsJywgdXNlcik7XG5cdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeVJvb20obWVzc2FnZS5yaWQsICdkZWxldGVNZXNzYWdlJywgeyBfaWQ6IG1lc3NhZ2UuX2lkIH0pO1xuXG5cdFx0Y29uc3QgbGFuZ3VhZ2UgPSB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbic7XG5cblx0XHRSb2NrZXRDaGF0LkxpdmVjaGF0LmNsb3NlUm9vbSh7XG5cdFx0XHR1c2VyLFxuXHRcdFx0cm9vbTogUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yaWQpLFxuXHRcdFx0Y29tbWVudDogVEFQaTE4bi5fXygnVmlkZW9jYWxsX2RlY2xpbmVkJywgeyBsbmc6IGxhbmd1YWdlIH0pXG5cdFx0fSk7XG5cdFx0TWV0ZW9yLmRlZmVyKCgpID0+IHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLnNldEhpZGRlbkJ5SWQobWVzc2FnZS5faWQpO1xuXHRcdH0pO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgb3BlblJvb20sIExpdmVjaGF0SW5xdWlyeSAqL1xuaW1wb3J0IHtSb29tU2V0dGluZ3NFbnVtLCBSb29tVHlwZUNvbmZpZywgUm9vbVR5cGVSb3V0ZUNvbmZpZywgVWlUZXh0Q29udGV4dH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuY2xhc3MgTGl2ZWNoYXRSb29tUm91dGUgZXh0ZW5kcyBSb29tVHlwZVJvdXRlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0bmFtZTogJ2xpdmUnLFxuXHRcdFx0cGF0aDogJy9saXZlLzpjb2RlKFxcXFxkKyknXG5cdFx0fSk7XG5cdH1cblxuXHRhY3Rpb24ocGFyYW1zKSB7XG5cdFx0b3BlblJvb20oJ2wnLCBwYXJhbXMuY29kZSk7XG5cdH1cblxuXHRsaW5rKHN1Yikge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2RlOiBzdWIuY29kZVxuXHRcdH07XG5cdH1cbn1cblxuY2xhc3MgTGl2ZWNoYXRSb29tVHlwZSBleHRlbmRzIFJvb21UeXBlQ29uZmlnIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoe1xuXHRcdFx0aWRlbnRpZmllcjogJ2wnLFxuXHRcdFx0b3JkZXI6IDUsXG5cdFx0XHQvLyBpY29uOiAnbGl2ZWNoYXQnLFxuXHRcdFx0bGFiZWw6ICdMaXZlY2hhdCcsXG5cdFx0XHRyb3V0ZTogbmV3IExpdmVjaGF0Um9vbVJvdXRlKClcblx0XHR9KTtcblxuXHRcdHRoaXMubm90U3Vic2NyaWJlZFRwbCA9IHtcblx0XHRcdHRlbXBsYXRlOiAnbGl2ZWNoYXROb3RTdWJzY3JpYmVkJ1xuXHRcdH07XG5cdH1cblxuXHRmaW5kUm9vbShpZGVudGlmaWVyKSB7XG5cdFx0cmV0dXJuIENoYXRSb29tLmZpbmRPbmUoe2NvZGU6IHBhcnNlSW50KGlkZW50aWZpZXIpfSk7XG5cdH1cblxuXHRyb29tTmFtZShyb29tRGF0YSkge1xuXHRcdGlmICghcm9vbURhdGEubmFtZSkge1xuXHRcdFx0cmV0dXJuIHJvb21EYXRhLmxhYmVsO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gcm9vbURhdGEubmFtZTtcblx0XHR9XG5cdH1cblxuXHRjb25kaXRpb24oKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMaXZlY2hhdF9lbmFibGVkJykgJiYgUm9ja2V0Q2hhdC5hdXRoei5oYXNBbGxQZXJtaXNzaW9uKCd2aWV3LWwtcm9vbScpO1xuXHR9XG5cblx0Y2FuU2VuZE1lc3NhZ2Uocm9vbUlkKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IENoYXRSb29tLmZpbmRPbmUoe19pZDogcm9vbUlkfSwge2ZpZWxkczoge29wZW46IDF9fSk7XG5cdFx0cmV0dXJuIHJvb20gJiYgcm9vbS5vcGVuID09PSB0cnVlO1xuXHR9XG5cblx0Z2V0VXNlclN0YXR1cyhyb29tSWQpIHtcblx0XHRjb25zdCByb29tID0gU2Vzc2lvbi5nZXQoYHJvb21EYXRhJHsgcm9vbUlkIH1gKTtcblx0XHRpZiAocm9vbSkge1xuXHRcdFx0cmV0dXJuIHJvb20udiAmJiByb29tLnYuc3RhdHVzO1xuXHRcdH1cblxuXHRcdGNvbnN0IGlucXVpcnkgPSBMaXZlY2hhdElucXVpcnkuZmluZE9uZSh7IHJpZDogcm9vbUlkIH0pO1xuXHRcdHJldHVybiBpbnF1aXJ5ICYmIGlucXVpcnkudiAmJiBpbnF1aXJ5LnYuc3RhdHVzO1xuXHR9XG5cblx0YWxsb3dSb29tU2V0dGluZ0NoYW5nZShyb29tLCBzZXR0aW5nKSB7XG5cdFx0c3dpdGNoIChzZXR0aW5nKSB7XG5cdFx0XHRjYXNlIFJvb21TZXR0aW5nc0VudW0uSk9JTl9DT0RFOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH1cblxuXHRnZXRVaVRleHQoY29udGV4dCkge1xuXHRcdHN3aXRjaCAoY29udGV4dCkge1xuXHRcdFx0Y2FzZSBVaVRleHRDb250ZXh0LkhJREVfV0FSTklORzpcblx0XHRcdFx0cmV0dXJuICdIaWRlX0xpdmVjaGF0X1dhcm5pbmcnO1xuXHRcdFx0Y2FzZSBVaVRleHRDb250ZXh0LkxFQVZFX1dBUk5JTkc6XG5cdFx0XHRcdHJldHVybiAnSGlkZV9MaXZlY2hhdF9XYXJuaW5nJztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5yb29tVHlwZXMuYWRkKG5ldyBMaXZlY2hhdFJvb21UeXBlKCkpO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0xpdmVjaGF0Jyk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUgfSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RpdGxlJywgJ1JvY2tldC5DaGF0JywgeyB0eXBlOiAnc3RyaW5nJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSB9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RpdGxlX2NvbG9yJywgJyNDMTI3MkQnLCB7IHR5cGU6ICdjb2xvcicsIGdyb3VwOiAnTGl2ZWNoYXQnLCBwdWJsaWM6IHRydWUgfSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2Rpc3BsYXlfb2ZmbGluZV9mb3JtJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0Rpc3BsYXlfb2ZmbGluZV9mb3JtJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdmFsaWRhdGVfb2ZmbGluZV9lbWFpbCcsIHRydWUsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdWYWxpZGF0ZV9lbWFpbF9hZGRyZXNzJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9mb3JtX3VuYXZhaWxhYmxlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ09mZmxpbmVfZm9ybV91bmF2YWlsYWJsZV9tZXNzYWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV90aXRsZScsICdMZWF2ZSBhIG1lc3NhZ2UnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJyxcblx0XHRpMThuTGFiZWw6ICdUaXRsZSdcblx0fSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9vZmZsaW5lX3RpdGxlX2NvbG9yJywgJyM2NjY2NjYnLCB7XG5cdFx0dHlwZTogJ2NvbG9yJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ0NvbG9yJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfbWVzc2FnZScsICdXZSBhcmUgbm90IG9ubGluZSByaWdodCBub3cuIFBsZWFzZSBsZWF2ZSB1cyBhIG1lc3NhZ2U6Jywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRzZWN0aW9uOiAnT2ZmbGluZScsXG5cdFx0aTE4bkxhYmVsOiAnSW5zdHJ1Y3Rpb25zJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdJbnN0cnVjdGlvbnNfdG9feW91cl92aXNpdG9yX2ZpbGxfdGhlX2Zvcm1fdG9fc2VuZF9hX21lc3NhZ2UnXG5cdH0pO1xuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb2ZmbGluZV9lbWFpbCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0aTE4bkxhYmVsOiAnRW1haWxfYWRkcmVzc190b19zZW5kX29mZmxpbmVfbWVzc2FnZXMnLFxuXHRcdHNlY3Rpb246ICdPZmZsaW5lJ1xuXHR9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X29mZmxpbmVfc3VjY2Vzc19tZXNzYWdlJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ09mZmxpbmUnLFxuXHRcdGkxOG5MYWJlbDogJ09mZmxpbmVfc3VjY2Vzc19tZXNzYWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfcmVnaXN0cmF0aW9uX2Zvcm0nLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnU2hvd19wcmVyZWdpc3RyYXRpb25fZm9ybScgfSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hbGxvd19zd2l0Y2hpbmdfZGVwYXJ0bWVudHMnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnQWxsb3dfc3dpdGNoaW5nX2RlcGFydG1lbnRzJyB9KTtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3Nob3dfYWdlbnRfZW1haWwnLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZ3JvdXA6ICdMaXZlY2hhdCcsIHB1YmxpYzogdHJ1ZSwgaTE4bkxhYmVsOiAnU2hvd19hZ2VudF9lbWFpbCcgfSk7XG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9ndWVzdF9jb3VudCcsIDEsIHsgdHlwZTogJ2ludCcsIGdyb3VwOiAnTGl2ZWNoYXQnIH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9Sb29tX0NvdW50JywgMSwge1xuXHRcdHR5cGU6ICdpbnQnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ0xpdmVjaGF0X3Jvb21fY291bnQnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCAnbm9uZScsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHR2YWx1ZXM6IFtcblx0XHRcdHsga2V5OiAnbm9uZScsIGkxOG5MYWJlbDogJ05vbmUnIH0sXG5cdFx0XHR7IGtleTogJ2ZvcndhcmQnLCBpMThuTGFiZWw6ICdGb3J3YXJkJyB9LFxuXHRcdFx0eyBrZXk6ICdjbG9zZScsIGkxOG5MYWJlbDogJ0Nsb3NlJyB9XG5cdFx0XSxcblx0XHRpMThuTGFiZWw6ICdIb3dfdG9faGFuZGxlX29wZW5fc2Vzc2lvbnNfd2hlbl9hZ2VudF9nb2VzX29mZmxpbmUnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb25fdGltZW91dCcsIDYwLCB7XG5cdFx0dHlwZTogJ2ludCcsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnTGl2ZWNoYXRfYWdlbnRfbGVhdmVfYWN0aW9uJywgdmFsdWU6IHsgJG5lOiAnbm9uZScgfSB9LFxuXHRcdGkxOG5MYWJlbDogJ0hvd19sb25nX3RvX3dhaXRfYWZ0ZXJfYWdlbnRfZ29lc19vZmZsaW5lJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdUaW1lX2luX3NlY29uZHMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9jb21tZW50JywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9hZ2VudF9sZWF2ZV9hY3Rpb24nLCB2YWx1ZTogJ2Nsb3NlJyB9LFxuXHRcdGkxOG5MYWJlbDogJ0NvbW1lbnRfdG9fbGVhdmVfb25fY2xvc2luZ19zZXNzaW9uJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfd2ViaG9va1VybCcsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnV2ViaG9va19VUkwnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9zZWNyZXRfdG9rZW4nLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlY3JldF90b2tlbidcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2xvc2UnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fY2hhdF9jbG9zZSdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fb2ZmbGluZV9tc2cnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnQ1JNX0ludGVncmF0aW9uJyxcblx0XHRpMThuTGFiZWw6ICdTZW5kX3JlcXVlc3Rfb25fb2ZmbGluZV9tZXNzYWdlcydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3dlYmhvb2tfb25fY2FwdHVyZScsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdDUk1fSW50ZWdyYXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1NlbmRfcmVxdWVzdF9vbl9sZWFkX2NhcHR1cmUnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9sZWFkX2VtYWlsX3JlZ2V4JywgJ1xcXFxiW0EtWjAtOS5fJSstXStAKD86W0EtWjAtOS1dK1xcXFwuKStbQS1aXXsyLDR9XFxcXGInLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnTGVhZF9jYXB0dXJlX2VtYWlsX3JlZ2V4J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfbGVhZF9waG9uZV9yZWdleCcsICcoKD86XFxcXChbMC05XXsxLDN9XFxcXCl8WzAtOV17Mn0pWyBcXFxcLV0qP1swLTldezQsNX0oPzpbXFxcXC1cXFxcc1xcXFxfXXsxLDJ9KT9bMC05XXs0fSg/Oig/PVteMC05XSl8JCl8WzAtOV17NCw1fSg/OltcXFxcLVxcXFxzXFxcXF9dezEsMn0pP1swLTldezR9KD86KD89W14wLTldKXwkKSknLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0NSTV9JbnRlZ3JhdGlvbicsXG5cdFx0aTE4bkxhYmVsOiAnTGVhZF9jYXB0dXJlX3Bob25lX3JlZ2V4J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRzZWN0aW9uOiAnS25vd2xlZGdlX0Jhc2UnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdFbmFibGVkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0tleScsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0tub3dsZWRnZV9CYXNlJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnQXBpYWlfS2V5J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfS25vd2xlZGdlX0FwaWFpX0xhbmd1YWdlJywgJ2VuJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdLbm93bGVkZ2VfQmFzZScsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ0FwaWFpX0xhbmd1YWdlJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfaGlzdG9yeV9tb25pdG9yX3R5cGUnLCAndXJsJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdGkxOG5MYWJlbDogJ01vbml0b3JfaGlzdG9yeV9mb3JfY2hhbmdlc19vbicsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7IGtleTogJ3VybCcsIGkxOG5MYWJlbDogJ1BhZ2VfVVJMJyB9LFxuXHRcdFx0eyBrZXk6ICd0aXRsZScsIGkxOG5MYWJlbDogJ1BhZ2VfdGl0bGUnIH1cblx0XHRdXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9lbmFibGVfb2ZmaWNlX2hvdXJzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ09mZmljZV9ob3Vyc19lbmFibGVkJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfdmlkZW9jYWxsX2VuYWJsZWQnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnVmlkZW9jYWxsX2VuYWJsZWQnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0JldGFfZmVhdHVyZV9EZXBlbmRzX29uX1ZpZGVvX0NvbmZlcmVuY2VfdG9fYmVfZW5hYmxlZCcsXG5cdFx0ZW5hYmxlUXVlcnk6IHsgX2lkOiAnSml0c2lfRW5hYmxlZCcsIHZhbHVlOiB0cnVlIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0JywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiB0cnVlLFxuXHRcdGkxOG5MYWJlbDogJ1RyYW5zY3JpcHRfRW5hYmxlZCdcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X3RyYW5zY3JpcHRfbWVzc2FnZScsICdXb3VsZCB5b3UgbGlrZSBhIGNvcHkgb2YgdGhpcyBjaGF0IGVtYWlsZWQ/Jywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdUcmFuc2NyaXB0X21lc3NhZ2UnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X2VuYWJsZV90cmFuc2NyaXB0JywgdmFsdWU6IHRydWUgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfb3Blbl9pbnF1aWVyeV9zaG93X2Nvbm5lY3RpbmcnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkxhYmVsOiAnTGl2ZWNoYXRfb3Blbl9pbnF1aWVyeV9zaG93X2Nvbm5lY3RpbmcnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdHdWVzdF9Qb29sJyB9XG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9BbGxvd2VkRG9tYWluc0xpc3QnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogdHJ1ZSxcblx0XHRpMThuTGFiZWw6ICdMaXZlY2hhdF9BbGxvd2VkRG9tYWluc0xpc3QnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0RvbWFpbnNfYWxsb3dlZF90b19lbWJlZF90aGVfbGl2ZWNoYXRfd2lkZ2V0J1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcsIGZhbHNlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdGYWNlYm9vaydcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9LZXknLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHNlY3Rpb246ICdGYWNlYm9vaycsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnSWZfeW91X2RvbnRfaGF2ZV9vbmVfc2VuZF9hbl9lbWFpbF90b19vbW5pX3JvY2tldGNoYXRfdG9fZ2V0X3lvdXJzJ1xuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfRmFjZWJvb2tfQVBJX1NlY3JldCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ0ZhY2Vib29rJyxcblx0XHRpMThuRGVzY3JpcHRpb246ICdJZl95b3VfZG9udF9oYXZlX29uZV9zZW5kX2FuX2VtYWlsX3RvX29tbmlfcm9ja2V0Y2hhdF90b19nZXRfeW91cnMnXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9SRFN0YXRpb25fVG9rZW4nLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGdyb3VwOiAnTGl2ZWNoYXQnLFxuXHRcdHB1YmxpYzogZmFsc2UsXG5cdFx0c2VjdGlvbjogJ1JEIFN0YXRpb24nLFxuXHRcdGkxOG5MYWJlbDogJ1JEU3RhdGlvbl9Ub2tlbidcblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgJ0xlYXN0X0Ftb3VudCcsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdHZhbHVlczogW1xuXHRcdFx0e2tleTogJ0V4dGVybmFsJywgaTE4bkxhYmVsOiAnRXh0ZXJuYWxfU2VydmljZSd9LFxuXHRcdFx0e2tleTogJ0xlYXN0X0Ftb3VudCcsIGkxOG5MYWJlbDogJ0xlYXN0X0Ftb3VudCd9LFxuXHRcdFx0e2tleTogJ0d1ZXN0X1Bvb2wnLCBpMThuTGFiZWw6ICdHdWVzdF9Qb29sJ31cblx0XHRdXG5cdH0pO1xuXG5cdFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKCdMaXZlY2hhdF9ndWVzdF9wb29sX3dpdGhfbm9fYWdlbnRzJywgZmFsc2UsIHtcblx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ0FjY2VwdF93aXRoX25vX29ubGluZV9hZ2VudHMnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0FjY2VwdF9pbmNvbWluZ19saXZlY2hhdF9yZXF1ZXN0c19ldmVuX2lmX3RoZXJlX2FyZV9ub19vbmxpbmVfYWdlbnRzJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcsIHZhbHVlOiAnR3Vlc3RfUG9vbCcgfVxuXHR9KTtcblxuXHRSb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnTGl2ZWNoYXRfc2hvd19xdWV1ZV9saXN0X2xpbmsnLCBmYWxzZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0c2VjdGlvbjogJ1JvdXRpbmcnLFxuXHRcdGkxOG5MYWJlbDogJ1Nob3dfcXVldWVfbGlzdF90b19hbGxfYWdlbnRzJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcsIHZhbHVlOiB7ICRuZTogJ0V4dGVybmFsJyB9IH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0V4dGVybmFsX1F1ZXVlX1VSTCcsICcnLCB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0Z3JvdXA6ICdMaXZlY2hhdCcsXG5cdFx0cHVibGljOiBmYWxzZSxcblx0XHRzZWN0aW9uOiAnUm91dGluZycsXG5cdFx0aTE4bkxhYmVsOiAnRXh0ZXJuYWxfUXVldWVfU2VydmljZV9VUkwnLFxuXHRcdGkxOG5EZXNjcmlwdGlvbjogJ0Zvcl9tb3JlX2RldGFpbHNfcGxlYXNlX2NoZWNrX291cl9kb2NzJyxcblx0XHRlbmFibGVRdWVyeTogeyBfaWQ6ICdMaXZlY2hhdF9Sb3V0aW5nX01ldGhvZCcsIHZhbHVlOiAnRXh0ZXJuYWwnIH1cblx0fSk7XG5cblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGQoJ0xpdmVjaGF0X0V4dGVybmFsX1F1ZXVlX1Rva2VuJywgJycsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRncm91cDogJ0xpdmVjaGF0Jyxcblx0XHRwdWJsaWM6IGZhbHNlLFxuXHRcdHNlY3Rpb246ICdSb3V0aW5nJyxcblx0XHRpMThuTGFiZWw6ICdTZWNyZXRfdG9rZW4nLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7IF9pZDogJ0xpdmVjaGF0X1JvdXRpbmdfTWV0aG9kJywgdmFsdWU6ICdFeHRlcm5hbCcgfVxuXHR9KTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L2RlcGFydG1lbnQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0ZGVwYXJ0bWVudHM6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kKCkuZmV0Y2goKVxuXHRcdH0pO1xuXHR9LFxuXHRwb3N0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHRcdGRlcGFydG1lbnQ6IE9iamVjdCxcblx0XHRcdFx0YWdlbnRzOiBBcnJheVxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGRlcGFydG1lbnQgPSBSb2NrZXRDaGF0LkxpdmVjaGF0LnNhdmVEZXBhcnRtZW50KG51bGwsIHRoaXMuYm9keVBhcmFtcy5kZXBhcnRtZW50LCB0aGlzLmJvZHlQYXJhbXMuYWdlbnRzKTtcblxuXHRcdFx0aWYgKGRlcGFydG1lbnQpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGRlcGFydG1lbnQsXG5cdFx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogZGVwYXJ0bWVudC5faWQgfSkuZmV0Y2goKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0Um9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUpO1xuXHRcdH1cblx0fVxufSk7XG5cblJvY2tldENoYXQuQVBJLnYxLmFkZFJvdXRlKCdsaXZlY2hhdC9kZXBhcnRtZW50LzpfaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdF9pZDogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRkZXBhcnRtZW50OiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnQuZmluZE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKSxcblx0XHRcdFx0YWdlbnRzOiBSb2NrZXRDaGF0Lm1vZGVscy5MaXZlY2hhdERlcGFydG1lbnRBZ2VudHMuZmluZCh7IGRlcGFydG1lbnRJZDogdGhpcy51cmxQYXJhbXMuX2lkIH0pLmZldGNoKClcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0cHV0KCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjaGVjayh0aGlzLmJvZHlQYXJhbXMsIHtcblx0XHRcdFx0ZGVwYXJ0bWVudDogT2JqZWN0LFxuXHRcdFx0XHRhZ2VudHM6IEFycmF5XG5cdFx0XHR9KTtcblxuXHRcdFx0aWYgKFJvY2tldENoYXQuTGl2ZWNoYXQuc2F2ZURlcGFydG1lbnQodGhpcy51cmxQYXJhbXMuX2lkLCB0aGlzLmJvZHlQYXJhbXMuZGVwYXJ0bWVudCwgdGhpcy5ib2R5UGFyYW1zLmFnZW50cykpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3Moe1xuXHRcdFx0XHRcdGRlcGFydG1lbnQ6IFJvY2tldENoYXQubW9kZWxzLkxpdmVjaGF0RGVwYXJ0bWVudC5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpLFxuXHRcdFx0XHRcdGFnZW50czogUm9ja2V0Q2hhdC5tb2RlbHMuTGl2ZWNoYXREZXBhcnRtZW50QWdlbnRzLmZpbmQoeyBkZXBhcnRtZW50SWQ6IHRoaXMudXJsUGFyYW1zLl9pZCB9KS5mZXRjaCgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0ZGVsZXRlKCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVEZXBhcnRtZW50KHRoaXMudXJsUGFyYW1zLl9pZCkpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiaW1wb3J0IGNyeXB0byBmcm9tICdjcnlwdG8nO1xuXG5pbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG4vKipcbiAqIEBhcGkge3Bvc3R9IC9saXZlY2hhdC9mYWNlYm9vayBTZW5kIEZhY2Vib29rIG1lc3NhZ2VcbiAqIEBhcGlOYW1lIEZhY2Vib29rXG4gKiBAYXBpR3JvdXAgTGl2ZWNoYXRcbiAqXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gbWlkIEZhY2Vib29rIG1lc3NhZ2UgaWRcbiAqIEBhcGlQYXJhbSB7U3RyaW5nfSBwYWdlIEZhY2Vib29rIHBhZ2VzIGlkXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gdG9rZW4gRmFjZWJvb2sgdXNlcidzIHRva2VuXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gZmlyc3RfbmFtZSBGYWNlYm9vayB1c2VyJ3MgZmlyc3QgbmFtZVxuICogQGFwaVBhcmFtIHtTdHJpbmd9IGxhc3RfbmFtZSBGYWNlYm9vayB1c2VyJ3MgbGFzdCBuYW1lXG4gKiBAYXBpUGFyYW0ge1N0cmluZ30gW3RleHRdIEZhY2Vib29rIG1lc3NhZ2UgdGV4dFxuICogQGFwaVBhcmFtIHtTdHJpbmd9IFthdHRhY2htZW50c10gRmFjZWJvb2sgbWVzc2FnZSBhdHRhY2htZW50c1xuICovXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvZmFjZWJvb2snLCB7XG5cdHBvc3QoKSB7XG5cdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMudGV4dCAmJiAhdGhpcy5ib2R5UGFyYW1zLmF0dGFjaG1lbnRzKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMucmVxdWVzdC5oZWFkZXJzWyd4LWh1Yi1zaWduYXR1cmUnXSkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2VzczogZmFsc2Vcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTGl2ZWNoYXRfRmFjZWJvb2tfRW5hYmxlZCcpKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0ZXJyb3I6ICdJbnRlZ3JhdGlvbiBkaXNhYmxlZCdcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gdmFsaWRhdGUgaWYgcmVxdWVzdCBjb21lIGZyb20gb21uaVxuXHRcdGNvbnN0IHNpZ25hdHVyZSA9IGNyeXB0by5jcmVhdGVIbWFjKCdzaGExJywgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xpdmVjaGF0X0ZhY2Vib29rX0FQSV9TZWNyZXQnKSkudXBkYXRlKEpTT04uc3RyaW5naWZ5KHRoaXMucmVxdWVzdC5ib2R5KSkuZGlnZXN0KCdoZXgnKTtcblx0XHRpZiAodGhpcy5yZXF1ZXN0LmhlYWRlcnNbJ3gtaHViLXNpZ25hdHVyZSddICE9PSBgc2hhMT0keyBzaWduYXR1cmUgfWApIHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRlcnJvcjogJ0ludmFsaWQgc2lnbmF0dXJlJ1xuXHRcdFx0fTtcblx0XHR9XG5cblx0XHRjb25zdCBzZW5kTWVzc2FnZSA9IHtcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0X2lkOiB0aGlzLmJvZHlQYXJhbXMubWlkXG5cdFx0XHR9LFxuXHRcdFx0cm9vbUluZm86IHtcblx0XHRcdFx0ZmFjZWJvb2s6IHtcblx0XHRcdFx0XHRwYWdlOiB0aGlzLmJvZHlQYXJhbXMucGFnZVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRsZXQgdmlzaXRvciA9IExpdmVjaGF0VmlzaXRvcnMuZ2V0VmlzaXRvckJ5VG9rZW4odGhpcy5ib2R5UGFyYW1zLnRva2VuKTtcblx0XHRpZiAodmlzaXRvcikge1xuXHRcdFx0Y29uc3Qgcm9vbXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT3BlbkJ5VmlzaXRvclRva2VuKHZpc2l0b3IudG9rZW4pLmZldGNoKCk7XG5cdFx0XHRpZiAocm9vbXMgJiYgcm9vbXMubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IHJvb21zWzBdLl9pZDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gdmlzaXRvci50b2tlbjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSBSYW5kb20uaWQoKTtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4gPSB0aGlzLmJvZHlQYXJhbXMudG9rZW47XG5cblx0XHRcdGNvbnN0IHVzZXJJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh7XG5cdFx0XHRcdHRva2VuOiBzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuLFxuXHRcdFx0XHRuYW1lOiBgJHsgdGhpcy5ib2R5UGFyYW1zLmZpcnN0X25hbWUgfSAkeyB0aGlzLmJvZHlQYXJhbXMubGFzdF9uYW1lIH1gXG5cdFx0XHR9KTtcblxuXHRcdFx0dmlzaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cdFx0fVxuXG5cdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5tc2cgPSB0aGlzLmJvZHlQYXJhbXMudGV4dDtcblx0XHRzZW5kTWVzc2FnZS5ndWVzdCA9IHZpc2l0b3I7XG5cblx0XHR0cnkge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjZXNzOiB0cnVlLFxuXHRcdFx0XHRtZXNzYWdlOiBSb2NrZXRDaGF0LkxpdmVjaGF0LnNlbmRNZXNzYWdlKHNlbmRNZXNzYWdlKVxuXHRcdFx0fTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciB1c2luZyBGYWNlYm9vayAtPicsIGUpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgTGl2ZWNoYXRWaXNpdG9ycyBmcm9tICcuLi8uLi8uLi9zZXJ2ZXIvbW9kZWxzL0xpdmVjaGF0VmlzaXRvcnMnO1xuXG5Sb2NrZXRDaGF0LkFQSS52MS5hZGRSb3V0ZSgnbGl2ZWNoYXQvc21zLWluY29taW5nLzpzZXJ2aWNlJywge1xuXHRwb3N0KCkge1xuXHRcdGNvbnN0IFNNU1NlcnZpY2UgPSBSb2NrZXRDaGF0LlNNUy5nZXRTZXJ2aWNlKHRoaXMudXJsUGFyYW1zLnNlcnZpY2UpO1xuXG5cdFx0Y29uc3Qgc21zID0gU01TU2VydmljZS5wYXJzZSh0aGlzLmJvZHlQYXJhbXMpO1xuXG5cdFx0bGV0IHZpc2l0b3IgPSBMaXZlY2hhdFZpc2l0b3JzLmZpbmRPbmVWaXNpdG9yQnlQaG9uZShzbXMuZnJvbSk7XG5cblx0XHRjb25zdCBzZW5kTWVzc2FnZSA9IHtcblx0XHRcdG1lc3NhZ2U6IHtcblx0XHRcdFx0X2lkOiBSYW5kb20uaWQoKVxuXHRcdFx0fSxcblx0XHRcdHJvb21JbmZvOiB7XG5cdFx0XHRcdHNtczoge1xuXHRcdFx0XHRcdGZyb206IHNtcy50b1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGlmICh2aXNpdG9yKSB7XG5cdFx0XHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPcGVuQnlWaXNpdG9yVG9rZW4odmlzaXRvci50b2tlbikuZmV0Y2goKTtcblxuXHRcdFx0aWYgKHJvb21zICYmIHJvb21zLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS5yaWQgPSByb29tc1swXS5faWQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnJpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0fVxuXHRcdFx0c2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiA9IHZpc2l0b3IudG9rZW47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UucmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRzZW5kTWVzc2FnZS5tZXNzYWdlLnRva2VuID0gUmFuZG9tLmlkKCk7XG5cblx0XHRcdGNvbnN0IHZpc2l0b3JJZCA9IFJvY2tldENoYXQuTGl2ZWNoYXQucmVnaXN0ZXJHdWVzdCh7XG5cdFx0XHRcdHVzZXJuYW1lOiBzbXMuZnJvbS5yZXBsYWNlKC9bXjAtOV0vZywgJycpLFxuXHRcdFx0XHR0b2tlbjogc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbixcblx0XHRcdFx0cGhvbmU6IHtcblx0XHRcdFx0XHRudW1iZXI6IHNtcy5mcm9tXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR2aXNpdG9yID0gTGl2ZWNoYXRWaXNpdG9ycy5maW5kT25lQnlJZCh2aXNpdG9ySWQpO1xuXHRcdH1cblxuXHRcdHNlbmRNZXNzYWdlLm1lc3NhZ2UubXNnID0gc21zLmJvZHk7XG5cdFx0c2VuZE1lc3NhZ2UuZ3Vlc3QgPSB2aXNpdG9yO1xuXG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1lc3NhZ2UgPSBTTVNTZXJ2aWNlLnJlc3BvbnNlLmNhbGwodGhpcywgUm9ja2V0Q2hhdC5MaXZlY2hhdC5zZW5kTWVzc2FnZShzZW5kTWVzc2FnZSkpO1xuXG5cdFx0XHRNZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRcdFx0XHRpZiAoc21zLmV4dHJhKSB7XG5cdFx0XHRcdFx0aWYgKHNtcy5leHRyYS5mcm9tQ291bnRyeSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ2NvdW50cnknLCBzbXMuZXh0cmEuZnJvbUNvdW50cnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoc21zLmV4dHJhLmZyb21TdGF0ZSkge1xuXHRcdFx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xpdmVjaGF0OnNldEN1c3RvbUZpZWxkJywgc2VuZE1lc3NhZ2UubWVzc2FnZS50b2tlbiwgJ3N0YXRlJywgc21zLmV4dHJhLmZyb21TdGF0ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChzbXMuZXh0cmEuZnJvbUNpdHkpIHtcblx0XHRcdFx0XHRcdE1ldGVvci5jYWxsKCdsaXZlY2hhdDpzZXRDdXN0b21GaWVsZCcsIHNlbmRNZXNzYWdlLm1lc3NhZ2UudG9rZW4sICdjaXR5Jywgc21zLmV4dHJhLmZyb21DaXR5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbWVzc2FnZTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gU01TU2VydmljZS5lcnJvci5jYWxsKHRoaXMsIGUpO1xuXHRcdH1cblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3VzZXJzLzp0eXBlJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRnZXQoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRjaGVjayh0aGlzLnVybFBhcmFtcywge1xuXHRcdFx0XHR0eXBlOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgcm9sZTtcblx0XHRcdGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnYWdlbnQnKSB7XG5cdFx0XHRcdHJvbGUgPSAnbGl2ZWNoYXQtYWdlbnQnO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1tYW5hZ2VyJztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93ICdJbnZhbGlkIHR5cGUnO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCB1c2VycyA9IFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUocm9sZSk7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0dXNlcnM6IHVzZXJzLmZldGNoKCkubWFwKHVzZXIgPT4gKHsgX2lkOiB1c2VyLl9pZCwgdXNlcm5hbWU6IHVzZXIudXNlcm5hbWUgfSkpXG5cdFx0XHR9KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZShlLmVycm9yKTtcblx0XHR9XG5cdH0sXG5cdHBvc3QoKSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24odGhpcy51c2VySWQsICd2aWV3LWxpdmVjaGF0LW1hbmFnZXInKSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnVuYXV0aG9yaXplZCgpO1xuXHRcdH1cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0dHlwZTogU3RyaW5nXG5cdFx0XHR9KTtcblxuXHRcdFx0Y2hlY2sodGhpcy5ib2R5UGFyYW1zLCB7XG5cdFx0XHRcdHVzZXJuYW1lOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAodGhpcy51cmxQYXJhbXMudHlwZSA9PT0gJ2FnZW50Jykge1xuXHRcdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5MaXZlY2hhdC5hZGRBZ2VudCh0aGlzLmJvZHlQYXJhbXMudXNlcm5hbWUpO1xuXHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlciB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnVybFBhcmFtcy50eXBlID09PSAnbWFuYWdlcicpIHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQuTGl2ZWNoYXQuYWRkTWFuYWdlcih0aGlzLmJvZHlQYXJhbXMudXNlcm5hbWUpO1xuXHRcdFx0XHRpZiAodXNlcikge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgdXNlciB9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgJ0ludmFsaWQgdHlwZSc7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9XG59KTtcblxuUm9ja2V0Q2hhdC5BUEkudjEuYWRkUm91dGUoJ2xpdmVjaGF0L3VzZXJzLzp0eXBlLzpfaWQnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdGdldCgpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctbGl2ZWNoYXQtbWFuYWdlcicpKSB7XG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEudW5hdXRob3JpemVkKCk7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGNoZWNrKHRoaXMudXJsUGFyYW1zLCB7XG5cdFx0XHRcdHR5cGU6IFN0cmluZyxcblx0XHRcdFx0X2lkOiBTdHJpbmdcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuX2lkKTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdVc2VyIG5vdCBmb3VuZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgcm9sZTtcblxuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0cm9sZSA9ICdsaXZlY2hhdC1hZ2VudCc7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdtYW5hZ2VyJykge1xuXHRcdFx0XHRyb2xlID0gJ2xpdmVjaGF0LW1hbmFnZXInO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgJ0ludmFsaWQgdHlwZSc7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh1c2VyLnJvbGVzLmluZGV4T2Yocm9sZSkgIT09IC0xKSB7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHtcblx0XHRcdFx0XHR1c2VyOiBfLnBpY2sodXNlciwgJ19pZCcsICd1c2VybmFtZScpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7XG5cdFx0XHRcdHVzZXI6IG51bGxcblx0XHRcdH0pO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUuZXJyb3IpO1xuXHRcdH1cblx0fSxcblx0ZGVsZXRlKCkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAndmlldy1saXZlY2hhdC1tYW5hZ2VyJykpIHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS51bmF1dGhvcml6ZWQoKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0Y2hlY2sodGhpcy51cmxQYXJhbXMsIHtcblx0XHRcdFx0dHlwZTogU3RyaW5nLFxuXHRcdFx0XHRfaWQ6IFN0cmluZ1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZCh0aGlzLnVybFBhcmFtcy5faWQpO1xuXG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdhZ2VudCcpIHtcblx0XHRcdFx0aWYgKFJvY2tldENoYXQuTGl2ZWNoYXQucmVtb3ZlQWdlbnQodXNlci51c2VybmFtZSkpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXMudXJsUGFyYW1zLnR5cGUgPT09ICdtYW5hZ2VyJykge1xuXHRcdFx0XHRpZiAoUm9ja2V0Q2hhdC5MaXZlY2hhdC5yZW1vdmVNYW5hZ2VyKHVzZXIudXNlcm5hbWUpKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgJ0ludmFsaWQgdHlwZSc7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5lcnJvcik7XG5cdFx0fVxuXHR9XG59KTtcbiJdfQ==
