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
var Apps;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:apps":{"lib":{"Apps.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/lib/Apps.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Please see both server and client's repsective "orchestrator" file for the contents
Apps = {};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"storage":{"apps-logs-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-logs-model.js                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel
});

class AppsLogsModel extends RocketChat.models._Base {
  constructor() {
    super('apps_logs');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-model.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsModel: () => AppsModel
});

class AppsModel extends RocketChat.models._Base {
  constructor() {
    super('apps');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"apps-persistence-model.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/apps-persistence-model.js                                                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsPersistenceModel: () => AppsPersistenceModel
});

class AppsPersistenceModel extends RocketChat.models._Base {
  constructor() {
    super('apps_persistence');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/storage.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealStorage: () => AppRealStorage
});
let AppStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppStorage(v) {
    AppStorage = v;
  }

}, 0);

class AppRealStorage extends AppStorage {
  constructor(data) {
    super('mongodb');
    this.db = data;
  }

  create(item) {
    return new Promise((resolve, reject) => {
      item.createdAt = new Date();
      item.updatedAt = new Date();
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            id: item.id
          }, {
            'info.nameSlug': item.info.nameSlug
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        return reject(new Error('App already exists.'));
      }

      try {
        const id = this.db.insert(item);
        item._id = id;
        resolve(item);
      } catch (e) {
        reject(e);
      }
    });
  }

  retrieveOne(id) {
    return new Promise((resolve, reject) => {
      let doc;

      try {
        doc = this.db.findOne({
          $or: [{
            _id: id
          }, {
            id
          }]
        });
      } catch (e) {
        return reject(e);
      }

      if (doc) {
        resolve(doc);
      } else {
        reject(new Error(`No App found by the id: ${id}`));
      }
    });
  }

  retrieveAll() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({}).fetch();
      } catch (e) {
        return reject(e);
      }

      const items = new Map();
      docs.forEach(i => items.set(i.id, i));
      resolve(items);
    });
  }

  update(item) {
    return new Promise((resolve, reject) => {
      try {
        this.db.update({
          id: item.id
        }, item);
      } catch (e) {
        return reject(e);
      }

      this.retrieveOne(item.id).then(updated => resolve(updated)).catch(err => reject(err));
    });
  }

  remove(id) {
    return new Promise((resolve, reject) => {
      try {
        this.db.remove({
          id
        });
      } catch (e) {
        return reject(e);
      }

      resolve({
        success: true
      });
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsLogsModel: () => AppsLogsModel,
  AppsModel: () => AppsModel,
  AppsPersistenceModel: () => AppsPersistenceModel,
  AppRealLogsStorage: () => AppRealLogsStorage,
  AppRealStorage: () => AppRealStorage
});
let AppsLogsModel;
module.watch(require("./apps-logs-model"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  }

}, 0);
let AppsModel;
module.watch(require("./apps-model"), {
  AppsModel(v) {
    AppsModel = v;
  }

}, 1);
let AppsPersistenceModel;
module.watch(require("./apps-persistence-model"), {
  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  }

}, 2);
let AppRealLogsStorage;
module.watch(require("./logs-storage"), {
  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppRealStorage;
module.watch(require("./storage"), {
  AppRealStorage(v) {
    AppRealStorage = v;
  }

}, 4);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"logs-storage.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/storage/logs-storage.js                                                            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRealLogsStorage: () => AppRealLogsStorage
});
let AppConsole;
module.watch(require("@rocket.chat/apps-engine/server/logging"), {
  AppConsole(v) {
    AppConsole = v;
  }

}, 0);
let AppLogStorage;
module.watch(require("@rocket.chat/apps-engine/server/storage"), {
  AppLogStorage(v) {
    AppLogStorage = v;
  }

}, 1);

class AppRealLogsStorage extends AppLogStorage {
  constructor(model) {
    super('mongodb');
    this.db = model;
  }

  find() {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find(...arguments).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

  storeEntries(appId, logger) {
    return new Promise((resolve, reject) => {
      const item = AppConsole.toStorageEntry(appId, logger);

      try {
        const id = this.db.insert(item);
        resolve(this.db.findOneById(id));
      } catch (e) {
        reject(e);
      }
    });
  }

  getEntriesFor(appId) {
    return new Promise((resolve, reject) => {
      let docs;

      try {
        docs = this.db.find({
          appId
        }).fetch();
      } catch (e) {
        return reject(e);
      }

      resolve(docs);
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"activation.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/activation.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppActivationBridge: () => AppActivationBridge
});

class AppActivationBridge {
  constructor(orch) {
    this.orch = orch;
  }

  appAdded(app) {
    this.orch.getNotifier().appAdded(app.getID());
  }

  appUpdated(app) {
    this.orch.getNotifier().appUpdated(app.getID());
  }

  appRemoved(app) {
    this.orch.getNotifier().appRemoved(app.getID());
  }

  appStatusChanged(app, status) {
    this.orch.getNotifier().appStatusUpdated(app.getID(), status);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bridges.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/bridges.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges
});
let AppBridges;
module.watch(require("@rocket.chat/apps-engine/server/bridges"), {
  AppBridges(v) {
    AppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppDetailChangesBridge;
module.watch(require("./details"), {
  AppDetailChangesBridge(v) {
    AppDetailChangesBridge = v;
  }

}, 2);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 3);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 4);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 5);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 6);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 7);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 8);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 9);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 10);

class RealAppBridges extends AppBridges {
  constructor(orch) {
    super();
    this._actBridge = new AppActivationBridge(orch);
    this._cmdBridge = new AppCommandsBridge(orch);
    this._detBridge = new AppDetailChangesBridge(orch);
    this._envBridge = new AppEnvironmentalVariableBridge(orch);
    this._httpBridge = new AppHttpBridge();
    this._msgBridge = new AppMessageBridge(orch);
    this._persistBridge = new AppPersistenceBridge(orch);
    this._roomBridge = new AppRoomBridge(orch);
    this._setsBridge = new AppSettingBridge(orch);
    this._userBridge = new AppUserBridge(orch);
  }

  getCommandBridge() {
    return this._cmdBridge;
  }

  getEnvironmentalVariableBridge() {
    return this._envBridge;
  }

  getHttpBridge() {
    return this._httpBridge;
  }

  getMessageBridge() {
    return this._msgBridge;
  }

  getPersistenceBridge() {
    return this._persistBridge;
  }

  getAppActivationBridge() {
    return this._actBridge;
  }

  getAppDetailChangesBridge() {
    return this._detBridge;
  }

  getRoomBridge() {
    return this._roomBridge;
  }

  getServerSettingBridge() {
    return this._setsBridge;
  }

  getUserBridge() {
    return this._userBridge;
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"commands.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/commands.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppCommandsBridge: () => AppCommandsBridge
});
let SlashCommandContext;
module.watch(require("@rocket.chat/apps-ts-definition/slashcommands"), {
  SlashCommandContext(v) {
    SlashCommandContext = v;
  }

}, 0);

class AppCommandsBridge {
  constructor(orch) {
    this.orch = orch;
    this.disabledCommands = new Map();
  }

  doesCommandExist(command, appId) {
    console.log(`The App ${appId} is checking if "${command}" command exists.`);

    if (typeof command !== 'string' || command.length === 0) {
      return false;
    }

    const cmd = command.toLowerCase();
    return typeof RocketChat.slashCommands.commands[cmd] === 'object' || this.disabledCommands.has(cmd);
  }

  enableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to enable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (!this.disabledCommands.has(cmd)) {
      throw new Error(`The command is not currently disabled: "${cmd}"`);
    }

    RocketChat.slashCommands.commands[cmd] = this.disabledCommands.get(cmd);
    this.disabledCommands.delete(cmd);
    this.orch.getNotifier().commandUpdated(cmd);
  }

  disableCommand(command, appId) {
    console.log(`The App ${appId} is attempting to disable the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();

    if (this.disabledCommands.has(cmd)) {
      // The command is already disabled, no need to disable it yet again
      return;
    }

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently: "${cmd}"`);
    }

    this.disabledCommands.set(cmd, RocketChat.slashCommands.commands[cmd]);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandDisabled(cmd);
  } // command: { command, paramsExample, i18nDescription, executor: function }


  modifyCommand(command, appId) {
    console.log(`The App ${appId} is attempting to modify the command: "${command}"`);

    this._verifyCommand(command);

    const cmd = command.toLowerCase();

    if (typeof RocketChat.slashCommands.commands[cmd] === 'undefined') {
      throw new Error(`Command does not exist in the system currently (or it is disabled): "${cmd}"`);
    }

    const item = RocketChat.slashCommands.commands[cmd];
    item.params = command.paramsExample ? command.paramsExample : item.params;
    item.description = command.i18nDescription ? command.i18nDescription : item.params;
    item.callback = this._appCommandExecutor.bind(this);
    RocketChat.slashCommands.commands[cmd] = item;
    this.orch.getNotifier().commandUpdated(cmd);
  }

  registerCommand(command, appId) {
    console.log(`The App ${appId} is registering the command: "${command.command}"`);

    this._verifyCommand(command);

    const item = {
      command: command.command.toLowerCase(),
      params: command.paramsExample,
      description: command.i18nDescription,
      callback: this._appCommandExecutor.bind(this)
    };
    RocketChat.slashCommands.commands[command.command.toLowerCase()] = item;
    this.orch.getNotifier().commandAdded(command.command.toLowerCase());
  }

  unregisterCommand(command, appId) {
    console.log(`The App ${appId} is unregistering the command: "${command}"`);

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error('Invalid command parameter provided, must be a string.');
    }

    const cmd = command.toLowerCase();
    this.disabledCommands.delete(cmd);
    delete RocketChat.slashCommands.commands[cmd];
    this.orch.getNotifier().commandRemoved(cmd);
  }

  _verifyCommand(command) {
    if (typeof command !== 'object') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.command !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.paramsExample && typeof command.paramsExample !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (command.i18nDescription && typeof command.i18nDescription !== 'string') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }

    if (typeof command.executor !== 'function') {
      throw new Error('Invalid Slash Command parameter provided, it must be a valid ISlashCommand object.');
    }
  }

  _appCommandExecutor(command, parameters, message) {
    const user = this.orch.getConverters().get('users').convertById(Meteor.userId());
    const room = this.orch.getConverters().get('rooms').convertById(message.rid);
    const params = parameters.length === 0 || parameters === ' ' ? [] : parameters.split(' ');
    const context = new SlashCommandContext(Object.freeze(user), Object.freeze(room), Object.freeze(params));
    this.orch.getManager().getCommandManager().executeCommand(command, context);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"environmental.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/environmental.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge
});

class AppEnvironmentalVariableBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
  }

  getValueByName(envVarName, appId) {
    console.log(`The App ${appId} is getting the environmental variable value ${envVarName}.`);

    if (this.isReadable(envVarName, appId)) {
      return process.env[envVarName];
    }

    throw new Error(`The environmental variable "${envVarName}" is not readable.`);
  }

  isReadable(envVarName, appId) {
    console.log(`The App ${appId} is checking if the environmental variable is readable ${envVarName}.`);
    return this.allowed.includes(envVarName.toUpperCase());
  }

  isSet(envVarName, appId) {
    console.log(`The App ${appId} is checking if the environmental variable is set ${envVarName}.`);

    if (this.isReadable(envVarName, appId)) {
      return typeof process.env[envVarName] !== 'undefined';
    }

    throw new Error(`The environmental variable "${envVarName}" is not readable.`);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/messages.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessageBridge: () => AppMessageBridge
});

class AppMessageBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(message, appId) {
    console.log(`The App ${appId} is creating a new message.`);
    let msg = this.orch.getConverters().get('messages').convertAppMessage(message);
    Meteor.runAsUser(msg.u._id, () => {
      msg = Meteor.call('sendMessage', msg);
    });
    return msg._id;
  }

  getById(messageId, appId) {
    console.log(`The App ${appId} is getting the message: "${messageId}"`);
    return this.orch.getConverters().get('messages').convertById(messageId);
  }

  update(message, appId) {
    console.log(`The App ${appId} is updating a message.`);

    if (!message.editor) {
      throw new Error('Invalid editor assigned to the message for the update.');
    }

    if (!message.id || !RocketChat.models.Messages.findOneById(message.id)) {
      throw new Error('A message must exist to update.');
    }

    const msg = this.orch.getConverters().get('messages').convertAppMessage(message);
    const editor = RocketChat.models.Users.findOneById(message.editor.id);
    RocketChat.updateMessage(msg, editor);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"persistence.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/persistence.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppPersistenceBridge: () => AppPersistenceBridge
});

class AppPersistenceBridge {
  constructor(orch) {
    this.orch = orch;
  }

  purge(appId) {
    console.log(`The App's persistent storage is being purged: ${appId}`);
    this.orch.getPersistenceModel().remove({
      appId
    });
  }

  create(data, appId) {
    console.log(`The App ${appId} is storing a new object in their persistence.`, data);

    if (typeof data !== 'object') {
      throw new Error('Attempted to store an invalid data type, it must be an object.');
    }

    return this.orch.getPersistenceModel().insert({
      appId,
      data
    });
  }

  createWithAssociations(data, associations, appId) {
    console.log(`The App ${appId} is storing a new object in their persistence that is associated with some models.`, data, associations);

    if (typeof data !== 'object') {
      throw new Error('Attempted to store an invalid data type, it must be an object.');
    }

    return this.orch.getPersistenceModel().insert({
      appId,
      associations,
      data
    });
  }

  readById(id, appId) {
    console.log(`The App ${appId} is reading their data in their persistence with the id: "${id}"`);
    const record = this.orch.getPersistenceModel().findOneById(id);
    return record.data;
  }

  readByAssociations(associations, appId) {
    console.log(`The App ${appId} is searching for records that are associated with the following:`, associations);
    throw new Error('Not implemented.');
  }

  remove(id, appId) {
    console.log(`The App ${appId} is removing one of their records by the id: "${id}"`);
    const record = this.orch.getPersistenceModel().findOneById(id);

    if (!record) {
      return undefined;
    }

    this.orch.getPersistenceModel().remove({
      _id: id
    });
    return record.data;
  }

  removeByAssociations(associations, appId) {
    console.log(`The App ${appId} is removing records with the following associations:`, associations);
    throw new Error('Not implemented.');
  }

  update(id, data, upsert, appId) {
    console.log(`The App ${appId} is updating the record "${id}" to:`, data);

    if (typeof data !== 'object') {
      throw new Error('Attempted to store an invalid data type, it must be an object.');
    }

    throw new Error('Not implemented.');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/rooms.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomBridge: () => AppRoomBridge
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomBridge {
  constructor(orch) {
    this.orch = orch;
  }

  create(room, appId) {
    console.log(`The App ${appId} is creating a new room.`, room);
    const rcRoom = this.orch.getConverters().get('rooms').convertAppRoom(room);
    let method;

    switch (room.type) {
      case RoomType.CHANNEL:
        method = 'createChannel';
        break;

      case RoomType.PRIVATE_GROUP:
        method = 'createPrivateGroup';
        break;

      default:
        throw new Error('Only channels and private groups can be created.');
    }

    let rid;
    Meteor.runAsUser(room.creator.id, () => {
      const info = Meteor.call(method, rcRoom.usernames);
      rid = info.rid;
    });
    return rid;
  }

  getById(roomId, appId) {
    console.log(`The App ${appId} is getting the roomById: "${roomId}"`);
    return this.orch.getConverters().get('rooms').convertById(roomId);
  }

  getByName(roomName, appId) {
    console.log(`The App ${appId} is getting the roomByName: "${roomName}"`);
    return this.orch.getConverters().get('rooms').convertByName(roomName);
  }

  update(room, appId) {
    console.log(`The App ${appId} is updating a room.`);

    if (!room.id || RocketChat.models.Rooms.findOneById(room.id)) {
      throw new Error('A room must exist to update.');
    }

    const rm = this.orch.getConverters().get('rooms').convertAppRoom(room);
    RocketChat.models.Rooms.update(rm._id, rm);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/settings.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingBridge: () => AppSettingBridge
});

class AppSettingBridge {
  constructor(orch) {
    this.orch = orch;
    this.allowedGroups = [];
    this.disallowedSettings = ['Accounts_RegistrationForm_SecretURL', 'CROWD_APP_USERNAME', 'CROWD_APP_PASSWORD', 'Direct_Reply_Username', 'Direct_Reply_Password', 'SMTP_Username', 'SMTP_Password', 'FileUpload_S3_AWSAccessKeyId', 'FileUpload_S3_AWSSecretAccessKey', 'FileUpload_S3_BucketURL', 'FileUpload_GoogleStorage_Bucket', 'FileUpload_GoogleStorage_AccessId', 'FileUpload_GoogleStorage_Secret', 'GoogleVision_ServiceAccount', 'Allow_Invalid_SelfSigned_Certs', 'GoogleTagManager_id', 'Bugsnag_api_key', 'LDAP_CA_Cert', 'LDAP_Reject_Unauthorized', 'LDAP_Domain_Search_User', 'LDAP_Domain_Search_Password', 'Livechat_secret_token', 'Livechat_Knowledge_Apiai_Key', 'AutoTranslate_GoogleAPIKey', 'MapView_GMapsAPIKey', 'Meta_fb_app_id', 'Meta_google-site-verification', 'Meta_msvalidate01', 'Accounts_OAuth_Dolphin_secret', 'Accounts_OAuth_Drupal_secret', 'Accounts_OAuth_Facebook_secret', 'Accounts_OAuth_Github_secret', 'API_GitHub_Enterprise_URL', 'Accounts_OAuth_GitHub_Enterprise_secret', 'API_Gitlab_URL', 'Accounts_OAuth_Gitlab_secret', 'Accounts_OAuth_Google_secret', 'Accounts_OAuth_Linkedin_secret', 'Accounts_OAuth_Meteor_secret', 'Accounts_OAuth_Twitter_secret', 'API_Wordpress_URL', 'Accounts_OAuth_Wordpress_secret', 'Push_apn_passphrase', 'Push_apn_key', 'Push_apn_cert', 'Push_apn_dev_passphrase', 'Push_apn_dev_key', 'Push_apn_dev_cert', 'Push_gcm_api_key', 'Push_gcm_project_number', 'SAML_Custom_Default_cert', 'SAML_Custom_Default_private_key', 'SlackBridge_APIToken', 'Smarsh_Email', 'SMS_Twilio_Account_SID', 'SMS_Twilio_authToken'];
  }

  getAll(appId) {
    console.log(`The App ${appId} is getting all the settings.`);
    return RocketChat.models.Settings.find({
      _id: {
        $nin: this.disallowedSettings
      }
    }).fetch().map(s => {
      this.orch.getConverters().get('settings').convertToApp(s);
    });
  }

  getOneById(id, appId) {
    console.log(`The App ${appId} is getting the setting by id ${id}.`);

    if (!this.isReadableById(id, appId)) {
      throw new Error(`The setting "${id}" is not readable.`);
    }

    return this.orch.getConverters().get('settings').convertById(id);
  }

  hideGroup(name, appId) {
    console.log(`The App ${appId} is hidding the group ${name}.`);
    throw new Error('Method not implemented.');
  }

  hideSetting(id, appId) {
    console.log(`The App ${appId} is hidding the setting ${id}.`);

    if (!this.isReadableById(id, appId)) {
      throw new Error(`The setting "${id}" is not readable.`);
    }

    throw new Error('Method not implemented.');
  }

  isReadableById(id, appId) {
    console.log(`The App ${appId} is checking if they can read the setting ${id}.`);
    return !this.disallowedSettings.includes(id);
  }

  updateOne(setting, appId) {
    console.log(`The App ${appId} is updating the setting ${setting.id} .`);

    if (!this.isReadableById(setting.id, appId)) {
      throw new Error(`The setting "${setting.id}" is not readable.`);
    }

    throw new Error('Method not implemented.');
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/users.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUserBridge: () => AppUserBridge
});

class AppUserBridge {
  constructor(orch) {
    this.orch = orch;
  }

  getById(userId, appId) {
    console.log(`The App ${appId} is getting the userId: "${userId}"`);
    return this.orch.getConverters().get('users').convertById(userId);
  }

  getByUsername(username, appId) {
    console.log(`The App ${appId} is getting the username: "${username}"`);
    return this.orch.getConverters().get('users').convertByUsername(username);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/index.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  RealAppBridges: () => RealAppBridges,
  AppActivationBridge: () => AppActivationBridge,
  AppCommandsBridge: () => AppCommandsBridge,
  AppEnvironmentalVariableBridge: () => AppEnvironmentalVariableBridge,
  AppHttpBridge: () => AppHttpBridge,
  AppMessageBridge: () => AppMessageBridge,
  AppPersistenceBridge: () => AppPersistenceBridge,
  AppRoomBridge: () => AppRoomBridge,
  AppSettingBridge: () => AppSettingBridge,
  AppUserBridge: () => AppUserBridge
});
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppActivationBridge;
module.watch(require("./activation"), {
  AppActivationBridge(v) {
    AppActivationBridge = v;
  }

}, 1);
let AppCommandsBridge;
module.watch(require("./commands"), {
  AppCommandsBridge(v) {
    AppCommandsBridge = v;
  }

}, 2);
let AppEnvironmentalVariableBridge;
module.watch(require("./environmental"), {
  AppEnvironmentalVariableBridge(v) {
    AppEnvironmentalVariableBridge = v;
  }

}, 3);
let AppHttpBridge;
module.watch(require("./http"), {
  AppHttpBridge(v) {
    AppHttpBridge = v;
  }

}, 4);
let AppMessageBridge;
module.watch(require("./messages"), {
  AppMessageBridge(v) {
    AppMessageBridge = v;
  }

}, 5);
let AppPersistenceBridge;
module.watch(require("./persistence"), {
  AppPersistenceBridge(v) {
    AppPersistenceBridge = v;
  }

}, 6);
let AppRoomBridge;
module.watch(require("./rooms"), {
  AppRoomBridge(v) {
    AppRoomBridge = v;
  }

}, 7);
let AppSettingBridge;
module.watch(require("./settings"), {
  AppSettingBridge(v) {
    AppSettingBridge = v;
  }

}, 8);
let AppUserBridge;
module.watch(require("./users"), {
  AppUserBridge(v) {
    AppUserBridge = v;
  }

}, 9);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"details.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/details.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppDetailChangesBridge: () => AppDetailChangesBridge
});

class AppDetailChangesBridge {
  constructor(orch) {
    this.orch = orch;
  }

  onAppSettingsChange(appId, setting) {
    try {
      this.orch.getNotifier().appSettingsChange(appId, setting);
    } catch (e) {
      console.warn('failed to notify about the setting change.', appId);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/bridges/http.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppHttpBridge: () => AppHttpBridge
});

class AppHttpBridge {
  call(info) {
    if (!info.request.content && typeof info.request.data === 'object') {
      info.request.content = JSON.stringify(info.request.data);
    }

    console.log(`The App ${info.appId} is requesting from the outter webs:`, info);

    try {
      return HTTP.call(info.method, info.url, info.request);
    } catch (e) {
      return e.response;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"communication":{"methods.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/methods.js                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods
});

class AppMethods {
  constructor(manager) {
    this._manager = manager;

    this._addMethods();
  }

  _addMethods() {
    const manager = this._manager;
    Meteor.methods({
      'apps/is-enabled'() {
        return typeof manager !== 'undefined';
      },

      'apps/is-loaded'() {
        return typeof manager !== 'undefined' || manager.areAppsLoaded();
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rest.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/rest.js                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppsRestApi: () => AppsRestApi
});

class AppsRestApi {
  constructor(orch, manager) {
    this._orch = orch;
    this._manager = manager;
    this.api = new RocketChat.API.ApiClass({
      version: 'apps',
      useDefaultAuth: true,
      prettyJson: false,
      enableCors: false,
      auth: RocketChat.API.getUserAuth()
    });
    this.addManagementRoutes();
  }

  _handleFile(request, fileField) {
    const Busboy = Npm.require('busboy');

    const busboy = new Busboy({
      headers: request.headers
    });
    return Meteor.wrapAsync(callback => {
      busboy.on('file', Meteor.bindEnvironment((fieldname, file) => {
        if (fieldname !== fileField) {
          return callback(new Meteor.Error('invalid-field', `Expected the field "${fileField}" but got "${fieldname}" instead.`));
        }

        const fileData = [];
        file.on('data', Meteor.bindEnvironment(data => {
          fileData.push(data);
        }));
        file.on('end', Meteor.bindEnvironment(() => callback(undefined, Buffer.concat(fileData))));
      }));
      request.pipe(busboy);
    })();
  }

  addManagementRoutes() {
    const orchestrator = this._orch;
    const manager = this._manager;
    const fileHandler = this._handleFile;
    this.api.addRoute('', {
      authRequired: true
    }, {
      get() {
        const apps = manager.get().map(prl => {
          const info = prl.getInfo();
          info.languages = prl.getStorageItem().languageContent;
          info.status = prl.getStatus();
          return info;
        });
        return RocketChat.API.v1.success({
          apps
        });
      },

      post() {
        let buff;

        if (this.bodyParams.url) {
          const result = HTTP.call('GET', this.bodyParams.url, {
            npmRequestOptions: {
              encoding: 'base64'
            }
          });

          if (result.statusCode !== 200 || !result.headers['content-type'] || result.headers['content-type'] !== 'application/zip') {
            return RocketChat.API.v1.failure({
              error: 'Invalid url. It doesn\'t exist or is not "application/zip".'
            });
          }

          buff = Buffer.from(result.content, 'base64');
        } else {
          buff = fileHandler(this.request, 'app');
        }

        if (!buff) {
          return RocketChat.API.v1.failure({
            error: 'Failed to get a file to install for the App. '
          });
        }

        const item = Meteor.wrapAsync(callback => {
          manager.add(buff.toString('base64'), false).then(rl => callback(undefined, rl)).catch(e => {
            console.warn('Error!', e);
            callback(e);
          });
        })();
        const info = item.getInfo();
        info.status = item.getStatus();
        return RocketChat.API.v1.success({
          app: info
        });
      }

    });
    this.api.addRoute('languages', {
      authRequired: false
    }, {
      get() {
        const apps = manager.get().map(prl => {
          return {
            id: prl.getID(),
            languages: prl.getStorageItem().languageContent
          };
        });
        return RocketChat.API.v1.success({
          apps
        });
      }

    });
    this.api.addRoute(':id', {
      authRequired: true
    }, {
      get() {
        console.log('Getting:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log('Updating:', this.urlParams.id); // TODO: Verify permissions

        const buff = fileHandler(this.request, 'app');
        const item = Meteor.wrapAsync(callback => {
          manager.update(buff.toString('base64')).then(rl => callback(rl)).catch(e => callback(e));
        });
        const info = item.getInfo();
        info.status = item.getStatus();
        return RocketChat.API.v1.success({
          app: info
        });
      },

      delete() {
        console.log('Uninstalling:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          Promise.await(manager.remove(prl.getID()));
          const info = prl.getInfo();
          info.status = prl.getStatus();
          return RocketChat.API.v1.success({
            app: info
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/icon', {
      authRequired: true
    }, {
      get() {
        console.log('Getting the App\'s Icon:', this.urlParams.id);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const info = prl.getInfo();
          return RocketChat.API.v1.success({
            iconFileContent: info.iconFileContent
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/languages', {
      authRequired: false
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s languages..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const languages = prl.getStorageItem().languageContent || {};
          return RocketChat.API.v1.success({
            languages
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/logs', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s logs..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const {
            offset,
            count
          } = this.getPaginationItems();
          const {
            sort,
            fields,
            query
          } = this.parseJsonQuery();
          const ourQuery = Object.assign({}, query, {
            appId: prl.getID()
          });
          const options = {
            sort: sort ? sort : {
              _updatedAt: -1
            },
            skip: offset,
            limit: count,
            fields
          };
          const logs = Promise.await(orchestrator.getLogStorage().find(ourQuery, options));
          return RocketChat.API.v1.success({
            logs
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
    this.api.addRoute(':id/settings', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s settings..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const settings = Object.assign({}, prl.getStorageItem().settings);
          Object.keys(settings).forEach(k => {
            if (settings[k].hidden) {
              delete settings[k];
            }
          });
          return RocketChat.API.v1.success({
            settings
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        console.log(`Updating ${this.urlParams.id}'s settings..`);

        if (!this.bodyParams || !this.bodyParams.settings) {
          return RocketChat.API.v1.failure('The settings to update must be present.');
        }

        const prl = manager.getOneById(this.urlParams.id);

        if (!prl) {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }

        const settings = prl.getStorageItem().settings;
        const updated = [];
        this.bodyParams.settings.forEach(s => {
          if (settings[s.id]) {
            Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, s)); // Updating?

            updated.push(s);
          }
        });
        return RocketChat.API.v1.success({
          updated
        });
      }

    });
    this.api.addRoute(':id/settings/:settingId', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        try {
          const setting = manager.getSettingsManager().getAppSetting(this.urlParams.id, this.urlParams.settingId);
          RocketChat.API.v1.success({
            setting
          });
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      },

      post() {
        console.log(`Updating the App ${this.urlParams.id}'s setting ${this.urlParams.settingId}`);

        if (!this.bodyParams.setting) {
          return RocketChat.API.v1.failure('Setting to update to must be present on the posted body.');
        }

        try {
          Promise.await(manager.getSettingsManager().updateAppSetting(this.urlParams.id, this.bodyParams.setting));
          return RocketChat.API.v1.success();
        } catch (e) {
          if (e.message.includes('No setting found')) {
            return RocketChat.API.v1.notFound(`No Setting found on the App by the id of: "${this.urlParams.settingId}"`);
          } else if (e.message.includes('No App found')) {
            return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
          } else {
            return RocketChat.API.v1.failure(e.message);
          }
        }
      }

    });
    this.api.addRoute(':id/status', {
      authRequired: true
    }, {
      get() {
        console.log(`Getting ${this.urlParams.id}'s status..`);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          return RocketChat.API.v1.success({
            status: prl.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      },

      post() {
        if (!this.bodyParams.status || typeof this.bodyParams.status !== 'string') {
          return RocketChat.API.v1.failure('Invalid status provided, it must be "status" field and a string.');
        }

        console.log(`Updating ${this.urlParams.id}'s status...`, this.bodyParams.status);
        const prl = manager.getOneById(this.urlParams.id);

        if (prl) {
          const result = Promise.await(manager.changeStatus(prl.getID(), this.bodyParams.status));
          return RocketChat.API.v1.success({
            status: result.getStatus()
          });
        } else {
          return RocketChat.API.v1.notFound(`No App found by the id of: ${this.urlParams.id}`);
        }
      }

    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"websockets.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/websockets.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppEvents: () => AppEvents,
  AppServerListener: () => AppServerListener,
  AppServerNotifier: () => AppServerNotifier
});
let AppStatus, AppStatusUtils;
module.watch(require("@rocket.chat/apps-ts-definition/AppStatus"), {
  AppStatus(v) {
    AppStatus = v;
  },

  AppStatusUtils(v) {
    AppStatusUtils = v;
  }

}, 0);
const AppEvents = Object.freeze({
  APP_ADDED: 'app/added',
  APP_REMOVED: 'app/removed',
  APP_UPDATED: 'app/updated',
  APP_STATUS_CHANGE: 'app/statusUpdate',
  APP_SETTING_UPDATED: 'app/settingUpdated',
  COMMAND_ADDED: 'command/added',
  COMMAND_DISABLED: 'command/disabled',
  COMMAND_UPDATED: 'command/updated',
  COMMAND_REMOVED: 'command/removed'
});

class AppServerListener {
  constructor(orch, engineStreamer, clientStreamer, recieved) {
    this.orch = orch;
    this.engineStreamer = engineStreamer;
    this.clientStreamer = clientStreamer;
    this.recieved = recieved;
    this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
    this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
    this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
    this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
  }

  onAppAdded(appId) {
    this.orch.getManager().loadOne(appId).then(() => this.clientStreamer.emit(AppEvents.APP_ADDED, appId));
  }

  onAppStatusUpdated({
    appId,
    status
  }) {
    this.recieved.set(`${AppEvents.APP_STATUS_CHANGE}_${appId}`, {
      appId,
      status,
      when: new Date()
    });

    if (AppStatusUtils.isEnabled(status)) {
      this.orch.getManager().enable(appId).then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      }));
    } else if (AppStatusUtils.isDisabled(status)) {
      this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status).then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
        appId,
        status
      }));
    }
  }

  onAppSettingUpdated({
    appId,
    setting
  }) {
    this.recieved.set(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`, {
      appId,
      setting,
      when: new Date()
    });
    this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting).then(() => this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
      appId
    }));
  }

  onAppRemoved(appId) {
    this.orch.getManager().remove(appId).then(() => this.clientStreamer.emit(AppEvents.APP_REMOVED, appId));
  }

  onCommandAdded(command) {
    this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
  }

  onCommandDisabled(command) {
    this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
  }

  onCommandUpdated(command) {
    this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
  }

  onCommandRemoved(command) {
    this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
  }

}

class AppServerNotifier {
  constructor(orch) {
    this.engineStreamer = new Meteor.Streamer('apps-engine', {
      retransmit: false
    });
    this.engineStreamer.serverOnly = true;
    this.engineStreamer.allowRead('none');
    this.engineStreamer.allowEmit('all');
    this.engineStreamer.allowWrite('none'); // This is used to broadcast to the web clients

    this.clientStreamer = new Meteor.Streamer('apps', {
      retransmit: false
    });
    this.clientStreamer.serverOnly = true;
    this.clientStreamer.allowRead('all');
    this.clientStreamer.allowEmit('all');
    this.clientStreamer.allowWrite('none');
    this.recieved = new Map();
    this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.recieved);
  }

  appAdded(appId) {
    this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
    this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
  }

  appRemoved(appId) {
    this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
    this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
  }

  appUpdated(appId) {
    this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
    this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
  }

  appStatusUpdated(appId, status) {
    if (this.recieved.has(`${AppEvents.APP_STATUS_CHANGE}_${appId}`)) {
      const details = this.recieved.get(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);

      if (details.status === status) {
        this.recieved.delete(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
        return;
      }
    }

    this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
      appId,
      status
    });
    this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, {
      appId,
      status
    });
  }

  appSettingsChange(appId, setting) {
    if (this.recieved.has(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`)) {
      this.recieved.delete(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting.id}`);
      return;
    }

    this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
      appId,
      setting
    });
    this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, {
      appId
    });
  }

  commandAdded(command) {
    this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
    this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
  }

  commandDisabled(command) {
    this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
    this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
  }

  commandUpdated(command) {
    this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
    this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
  }

  commandRemoved(command) {
    this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
    this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/communication/index.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMethods: () => AppMethods,
  AppsRestApi: () => AppsRestApi,
  AppEvents: () => AppEvents,
  AppServerNotifier: () => AppServerNotifier,
  AppServerListener: () => AppServerListener
});
let AppMethods;
module.watch(require("./methods"), {
  AppMethods(v) {
    AppMethods = v;
  }

}, 0);
let AppsRestApi;
module.watch(require("./rest"), {
  AppsRestApi(v) {
    AppsRestApi = v;
  }

}, 1);
let AppEvents, AppServerNotifier, AppServerListener;
module.watch(require("./websockets"), {
  AppEvents(v) {
    AppEvents = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  },

  AppServerListener(v) {
    AppServerListener = v;
  }

}, 2);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"converters":{"messages.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/messages.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter
});

class AppMessagesConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(msgId) {
    const msg = RocketChat.models.Messages.getOneById(msgId);
    return this.convertMessage(msg);
  }

  convertMessage(msgObj) {
    if (!msgObj) {
      return undefined;
    }

    const room = this.orch.getConverters().get('rooms').convertById(msgObj.rid);
    const sender = this.orch.getConverters().get('users').convertById(msgObj.u._id);
    let editor;

    if (msgObj.editedBy) {
      editor = this.orch.getConverters().get('users').convertById(msgObj.editedBy._id);
    }

    const attachments = this._convertAttachmentsToApp(msgObj.attachments);

    return {
      id: msgObj._id,
      room,
      sender,
      text: msgObj.msg,
      createdAt: msgObj.ts,
      updatedAt: msgObj._updatedAt,
      editor,
      editedAt: msgObj.editedAt,
      emoji: msgObj.emoji,
      avatarUrl: msgObj.avatar,
      alias: msgObj.alias,
      customFields: msgObj.customFields,
      attachments
    };
  }

  convertAppMessage(message) {
    if (!message) {
      return undefined;
    }

    const room = RocketChat.models.Rooms.findOneById(message.room.id);
    const user = RocketChat.models.Users.findOneById(message.sender.id);

    if (!room || !user) {
      throw new Error('Invalid user or room provided on the message.');
    }

    let editedBy;

    if (message.editor) {
      const editor = RocketChat.models.Users.findOneById(message.editor.id);
      editedBy = {
        _id: editor._id,
        username: editor.username
      };
    }

    const attachments = this._convertAppAttachments(message.attachments);

    return {
      _id: message.id || Random.id(),
      rid: room._id,
      u: {
        _id: user._id,
        username: user.username
      },
      msg: message.text,
      ts: message.createdAt || new Date(),
      _updatedAt: message.updatedAt || new Date(),
      editedBy,
      editedAt: message.editedAt,
      emoji: message.emoji,
      avatar: message.avatarUrl,
      alias: message.alias,
      customFields: message.customFields,
      attachments
    };
  }

  _convertAppAttachments(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        ts: attachment.timestamp,
        message_link: attachment.timestampLink,
        thumb_url: attachment.thumbnailUrl,
        author_name: attachment.author ? attachment.author.name : undefined,
        author_link: attachment.author ? attachment.author.link : undefined,
        author_icon: attachment.author ? attachment.author.icon : undefined,
        title: attachment.title ? attachment.title.value : undefined,
        title_link: attachment.title ? attachment.title.link : undefined,
        title_link_download: attachment.title ? attachment.title.downloadLink : undefined,
        image_url: attachment.imageUrl,
        audio_url: attachment.audioUrl,
        video_url: attachment.videoUrl,
        fields: attachment.fields
      };
    });
  }

  _convertAttachmentsToApp(attachments) {
    if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
      return undefined;
    }

    return attachments.map(attachment => {
      let author;

      if (attachment.author_name || attachment.author_link || attachment.author_icon) {
        author = {
          name: attachment.author_name,
          link: attachment.author_link,
          icon: attachment.author_icon
        };
      }

      let title;

      if (attachment.title || attachment.title_link || attachment.title_link_download) {
        title = {
          value: attachment.title,
          link: attachment.title_link,
          downloadLink: attachment.title_link_download
        };
      }

      return {
        collapsed: attachment.collapsed,
        color: attachment.color,
        text: attachment.text,
        timestamp: attachment.ts,
        timestampLink: attachment.message_link,
        thumbnailUrl: attachment.thumb_url,
        author,
        title,
        imageUrl: attachment.image_url,
        audioUrl: attachment.audio_url,
        videoUrl: attachment.video_url,
        fields: attachment.fields
      };
    });
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"rooms.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/rooms.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppRoomsConverter: () => AppRoomsConverter
});
let RoomType;
module.watch(require("@rocket.chat/apps-ts-definition/rooms"), {
  RoomType(v) {
    RoomType = v;
  }

}, 0);

class AppRoomsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(roomId) {
    const room = RocketChat.models.Rooms.findOneById(roomId);
    return this._convertToApp(room);
  }

  convertByName(roomName) {
    const room = RocketChat.models.Rooms.findOneByName(roomName);
    return this._convertToApp(room);
  }

  convertAppRoom(room) {
    if (!room) {
      return undefined;
    }

    const creator = RocketChat.models.Users.findOneById(room.creator.id);
    return {
      _id: room.id,
      u: {
        _id: creator._id,
        username: creator.username
      },
      ts: room.createdAt,
      t: room.type,
      name: room.name,
      msgs: room.messageCount || 0,
      default: typeof room.isDefault === 'undefined' ? false : room.isDefault,
      _updatedAt: room.updatedAt,
      lm: room.lastModifiedAt,
      usernames: room.usernames
    };
  }

  _convertToApp(room) {
    if (!room) {
      return undefined;
    }

    let creator;

    if (room.u) {
      creator = this.orch.getConverters().get('users').convertById(room.u._id);
    }

    return {
      id: room._id,
      name: room.name,
      type: this._convertTypeToApp(room.t),
      creator,
      usernames: room.usernames,
      isDefault: typeof room.default === 'undefined' ? false : room.default,
      messageCount: room.msgs,
      createdAt: room.ts,
      updatedAt: room._updatedAt,
      lastModifiedAt: room.lm
    };
  }

  _convertTypeToApp(typeChar) {
    switch (typeChar) {
      case 'c':
        return RoomType.CHANNEL;

      case 'p':
        return RoomType.PRIVATE_GROUP;

      case 'd':
        return RoomType.DIRECT_MESSAGE;

      case 'lc':
        return RoomType.LIVE_CHAT;

      default:
        throw new Error(`Unknown room type of: "${typeChar}"`);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/settings.js                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppSettingsConverter: () => AppSettingsConverter
});
let SettingType;
module.watch(require("@rocket.chat/apps-ts-definition/settings"), {
  SettingType(v) {
    SettingType = v;
  }

}, 0);

class AppSettingsConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(settingId) {
    const setting = RocketChat.models.Settings.findOneById(settingId);
    return this.convertToApp(setting);
  }

  convertToApp(setting) {
    return {
      id: setting._id,
      type: this._convertTypeToApp(setting.type),
      packageValue: setting.packageValue,
      values: setting.values,
      value: setting.value,
      public: setting.public,
      hidden: setting.hidden,
      group: setting.group,
      i18nLabel: setting.i18nLabel,
      i18nDescription: setting.i18nDescription,
      createdAt: setting.ts,
      updatedAt: setting._updatedAt
    };
  }

  _convertTypeToApp(type) {
    switch (type) {
      case 'boolean':
        return SettingType.BOOLEAN;

      case 'code':
        return SettingType.CODE;

      case 'color':
        return SettingType.COLOR;

      case 'font':
        return SettingType.FONT;

      case 'int':
        return SettingType.NUMBER;

      case 'select':
        return SettingType.SELECT;

      case 'string':
        return SettingType.STRING;

      default:
        return type;
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/users.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppUsersConverter: () => AppUsersConverter
});
let UserStatusConnection, UserType;
module.watch(require("@rocket.chat/apps-ts-definition/users"), {
  UserStatusConnection(v) {
    UserStatusConnection = v;
  },

  UserType(v) {
    UserType = v;
  }

}, 0);

class AppUsersConverter {
  constructor(orch) {
    this.orch = orch;
  }

  convertById(userId) {
    const user = RocketChat.models.Users.findOneById(userId);
    return this._convertToApp(user);
  }

  convertByUsername(username) {
    const user = RocketChat.models.Users.findOneByUsername(username);
    return this._convertToApp(user);
  }

  _convertToApp(user) {
    if (!user) {
      return undefined;
    }

    const type = this._convertUserTypeToEnum(user.type);

    const status = this._convertStatusConnectionToEnum(user.status);

    const statusConnection = this._convertStatusConnectionToEnum(user.statusConnection);

    return {
      id: user._id,
      username: user.username,
      emails: user.emails,
      type,
      isEnabled: user.active,
      name: user.name,
      roles: user.roles,
      status,
      statusConnection,
      utcOffset: user.utcOffset,
      createdAt: user.createdAt,
      updatedAt: user._updatedAt,
      lastLoginAt: user.lastLogin
    };
  }

  _convertUserTypeToEnum(type) {
    switch (type) {
      case 'user':
        return UserType.USER;

      case 'bot':
        return UserType.BOT;

      default:
        throw new Error('Unknown user type of:', type);
    }
  }

  _convertStatusConnectionToEnum(status) {
    switch (status) {
      case 'offline':
        return UserStatusConnection.OFFLINE;

      case 'online':
        return UserStatusConnection.ONLINE;

      case 'away':
        return UserStatusConnection.AWAY;

      case 'busy':
        return UserStatusConnection.BUSY;

      default:
        throw new Error('Unknown status type of:', status);
    }
  }

}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/converters/index.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  AppMessagesConverter: () => AppMessagesConverter,
  AppRoomsConverter: () => AppRoomsConverter,
  AppSettingsConverter: () => AppSettingsConverter,
  AppUsersConverter: () => AppUsersConverter
});
let AppMessagesConverter;
module.watch(require("./messages"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  }

}, 0);
let AppRoomsConverter;
module.watch(require("./rooms"), {
  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  }

}, 1);
let AppSettingsConverter;
module.watch(require("./settings"), {
  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  }

}, 2);
let AppUsersConverter;
module.watch(require("./users"), {
  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 3);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"orchestrator.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_apps/server/orchestrator.js                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let RealAppBridges;
module.watch(require("./bridges"), {
  RealAppBridges(v) {
    RealAppBridges = v;
  }

}, 0);
let AppMethods, AppsRestApi, AppServerNotifier;
module.watch(require("./communication"), {
  AppMethods(v) {
    AppMethods = v;
  },

  AppsRestApi(v) {
    AppsRestApi = v;
  },

  AppServerNotifier(v) {
    AppServerNotifier = v;
  }

}, 1);
let AppMessagesConverter, AppRoomsConverter, AppSettingsConverter, AppUsersConverter;
module.watch(require("./converters"), {
  AppMessagesConverter(v) {
    AppMessagesConverter = v;
  },

  AppRoomsConverter(v) {
    AppRoomsConverter = v;
  },

  AppSettingsConverter(v) {
    AppSettingsConverter = v;
  },

  AppUsersConverter(v) {
    AppUsersConverter = v;
  }

}, 2);
let AppsLogsModel, AppsModel, AppsPersistenceModel, AppRealStorage, AppRealLogsStorage;
module.watch(require("./storage"), {
  AppsLogsModel(v) {
    AppsLogsModel = v;
  },

  AppsModel(v) {
    AppsModel = v;
  },

  AppsPersistenceModel(v) {
    AppsPersistenceModel = v;
  },

  AppRealStorage(v) {
    AppRealStorage = v;
  },

  AppRealLogsStorage(v) {
    AppRealLogsStorage = v;
  }

}, 3);
let AppManager;
module.watch(require("@rocket.chat/apps-engine/server/AppManager"), {
  AppManager(v) {
    AppManager = v;
  }

}, 4);

class AppServerOrchestrator {
  constructor() {
    if (RocketChat.models && RocketChat.models.Permissions) {
      RocketChat.models.Permissions.createOrUpdate('manage-apps', ['admin']);
    }

    this._model = new AppsModel();
    this._logModel = new AppsLogsModel();
    this._persistModel = new AppsPersistenceModel();
    this._storage = new AppRealStorage(this._model);
    this._logStorage = new AppRealLogsStorage(this._persistModel);
    this._converters = new Map();

    this._converters.set('messages', new AppMessagesConverter(this));

    this._converters.set('rooms', new AppRoomsConverter(this));

    this._converters.set('settings', new AppSettingsConverter(this));

    this._converters.set('users', new AppUsersConverter(this));

    this._bridges = new RealAppBridges(this);
    this._manager = new AppManager(this._storage, this._logStorage, this._bridges);
    this._communicators = new Map();

    this._communicators.set('methods', new AppMethods(this._manager));

    this._communicators.set('notifier', new AppServerNotifier(this));

    this._communicators.set('restapi', new AppsRestApi(this, this._manager));
  }

  getModel() {
    return this._model;
  }

  getPersistenceModel() {
    return this._persistModel;
  }

  getStorage() {
    return this._storage;
  }

  getLogStorage() {
    return this._logStorage;
  }

  getConverters() {
    return this._converters;
  }

  getBridges() {
    return this._bridges;
  }

  getNotifier() {
    return this._communicators.get('notifier');
  }

  getManager() {
    return this._manager;
  }

}

Meteor.startup(function _appServerOrchestrator() {
  // Ensure that everything is setup
  if (process.env[AppManager.ENV_VAR_NAME_FOR_ENABLING] !== 'true' && process.env[AppManager.SUPER_FUN_ENV_ENABLEMENT_NAME] !== 'true') {
    return new AppMethods();
  }

  console.log('Orchestrating the app piece...');
  global.Apps = new AppServerOrchestrator();
  global.Apps.getManager().load().then(() => console.log('...done! ;)')).catch(err => console.warn('...failed!', err));
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"@rocket.chat":{"apps-engine":{"server":{"storage":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/storage/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppLogStorage_1 = require("./AppLogStorage");
exports.AppLogStorage = AppLogStorage_1.AppLogStorage;
var AppStorage_1 = require("./AppStorage");
exports.AppStorage = AppStorage_1.AppStorage;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"logging":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/logging/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppConsole_1 = require("./AppConsole");
exports.AppConsole = AppConsole_1.AppConsole;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"bridges":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/bridges/index.js                  //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppBridges_1 = require("./AppBridges");
exports.AppBridges = AppBridges_1.AppBridges;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppManager.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-engine/server/AppManager.js                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var bridges_1 = require("./bridges");
var compiler_1 = require("./compiler");
var managers_1 = require("./managers");
var storage_1 = require("./storage");
var AppStatus_1 = require("@rocket.chat/apps-ts-definition/AppStatus");
var metadata_1 = require("@rocket.chat/apps-ts-definition/metadata");
var AppManager = (function () {
    function AppManager(rlStorage, logStorage, rlBridges) {
        console.log('Constructed the AppManager.');
        if (rlStorage instanceof storage_1.AppStorage) {
            this.storage = rlStorage;
        }
        else {
            throw new Error('Invalid instance of the AppStorage.');
        }
        if (logStorage instanceof storage_1.AppLogStorage) {
            this.logStorage = logStorage;
        }
        else {
            throw new Error('Invalid instance of the AppLogStorage.');
        }
        if (rlBridges instanceof bridges_1.AppBridges) {
            this.bridges = rlBridges;
        }
        else {
            throw new Error('Invalid instance of the AppBridges');
        }
        this.apps = new Map();
        this.parser = new compiler_1.AppPackageParser(this);
        this.compiler = new compiler_1.AppCompiler(this);
        this.accessorManager = new managers_1.AppAccessorManager(this);
        this.listenerManager = new managers_1.AppListenerManger(this);
        this.commandManager = new managers_1.AppSlashCommandManager(this);
        this.settingsManager = new managers_1.AppSettingsManager(this);
        this.isLoaded = false;
    }
    /** Gets the instance of the storage connector. */
    AppManager.prototype.getStorage = function () {
        return this.storage;
    };
    /** Gets the instance of the log storage connector. */
    AppManager.prototype.getLogStorage = function () {
        return this.logStorage;
    };
    /** Gets the instance of the App package parser. */
    AppManager.prototype.getParser = function () {
        return this.parser;
    };
    /** Gets the compiler instance. */
    AppManager.prototype.getCompiler = function () {
        return this.compiler;
    };
    /** Gets the accessor manager instance. */
    AppManager.prototype.getAccessorManager = function () {
        return this.accessorManager;
    };
    /** Gets the instance of the Bridge manager. */
    AppManager.prototype.getBridges = function () {
        return this.bridges;
    };
    /** Gets the instance of the listener manager. */
    AppManager.prototype.getListenerManager = function () {
        return this.listenerManager;
    };
    /** Gets the command manager's instance. */
    AppManager.prototype.getCommandManager = function () {
        return this.commandManager;
    };
    /** Gets the manager of the settings, updates and getting. */
    AppManager.prototype.getSettingsManager = function () {
        return this.settingsManager;
    };
    /** Gets whether the Apps have been loaded or not. */
    AppManager.prototype.areAppsLoaded = function () {
        return this.isLoaded;
    };
    /**
     * Goes through the entire loading up process.
     * Expect this to take some time, as it goes through a very
     * long process of loading all the Apps up.
     */
    AppManager.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var items;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.retrieveAll()];
                    case 1:
                        items = _a.sent();
                        items.forEach(function (item) {
                            try {
                                _this.apps.set(item.id, _this.getCompiler().toSandBox(item));
                            }
                            catch (e) {
                                // TODO: Handle this better. Create a way to show that it is disabled due to an
                                // unrecoverable error and they need to either update or remove it. #7
                                console.warn("Error while compiling the Rocketlet \"" + item.info.name + " (" + item.id + ")\":", e);
                            }
                        });
                        // Let's initialize them
                        this.apps.forEach(function (rl) { return _this.initializeApp(items.get(rl.getID()), rl, true); });
                        // Now let's enable the apps which were once enabled
                        this.apps.forEach(function (rl) {
                            if (AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                                _this.enableApp(items.get(rl.getID()), rl, true, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
                            }
                        });
                        // TODO: Register all of the listeners
                        this.isLoaded = true;
                        return [2 /*return*/, Array.from(this.apps.values())];
                }
            });
        });
    };
    /** Gets the Apps which match the filter passed in. */
    AppManager.prototype.get = function (filter) {
        var rls = new Array();
        if (typeof filter === 'undefined') {
            this.apps.forEach(function (rl) { return rls.push(rl); });
            return rls;
        }
        var nothing = true;
        if (typeof filter.enabled === 'boolean' && filter.enabled) {
            this.apps.forEach(function (rl) {
                if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (typeof filter.disabled === 'boolean' && filter.disabled) {
            this.apps.forEach(function (rl) {
                if (AppStatus_1.AppStatusUtils.isDisabled(rl.getStatus())) {
                    rls.push(rl);
                }
            });
            nothing = false;
        }
        if (nothing) {
            this.apps.forEach(function (rl) { return rls.push(rl); });
        }
        if (typeof filter.ids !== 'undefined') {
            rls = rls.filter(function (rl) { return filter.ids.includes(rl.getID()); });
        }
        if (typeof filter.name === 'string') {
            rls = rls.filter(function (rl) { return rl.getName() === filter.name; });
        }
        else if (filter.name instanceof RegExp) {
            rls = rls.filter(function (rl) { return filter.name.test(rl.getName()); });
        }
        return rls;
    };
    /** Gets a single App by the id passed in. */
    AppManager.prototype.getOneById = function (appId) {
        return this.apps.get(appId);
    };
    AppManager.prototype.enable = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var rl, storageItem, isSetup;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rl = this.apps.get(id);
                        if (!rl) {
                            throw new Error("No App by the id \"" + id + "\" exists.");
                        }
                        if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                            throw new Error("The App with the id \"" + id + "\" is already enabled.");
                        }
                        return [4 /*yield*/, this.storage.retrieveOne(id)];
                    case 1:
                        storageItem = _a.sent();
                        if (!storageItem) {
                            throw new Error("Could not enable an App with the id of \"" + id + "\" as it doesn't exist.");
                        }
                        isSetup = this.runStartUpProcess(storageItem, rl, true);
                        if (isSetup) {
                            // This is async, but we don't care since it only updates in the database
                            // and it should not mutate any properties we care about
                            storageItem.status = rl.getStatus();
                            this.storage.update(storageItem);
                        }
                        return [2 /*return*/, isSetup];
                }
            });
        });
    };
    AppManager.prototype.disable = function (id, isManual) {
        if (isManual === void 0) { isManual = false; }
        return __awaiter(this, void 0, void 0, function () {
            var rl, storageItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        rl = this.apps.get(id);
                        if (!rl) {
                            throw new Error("No App by the id \"" + id + "\" exists.");
                        }
                        if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                            throw new Error("No App by the id of \"" + id + "\" is enabled.\"");
                        }
                        return [4 /*yield*/, this.storage.retrieveOne(id)];
                    case 1:
                        storageItem = _a.sent();
                        if (!storageItem) {
                            throw new Error("Could not disable an App with the id of \"" + id + "\" as it doesn't exist.");
                        }
                        try {
                            rl.call(metadata_1.AppMethod.ONDISABLE, this.accessorManager.getConfigurationModify(storageItem.id));
                        }
                        catch (e) {
                            console.warn('Error while disabling:', e);
                        }
                        this.commandManager.unregisterCommands(storageItem.id);
                        this.accessorManager.purifyApp(storageItem.id);
                        if (isManual) {
                            rl.setStatus(AppStatus_1.AppStatus.MANUALLY_DISABLED);
                        }
                        // This is async, but we don't care since it only updates in the database
                        // and it should not mutate any properties we care about
                        storageItem.status = rl.getStatus();
                        this.storage.update(storageItem);
                        return [2 /*return*/, true];
                }
            });
        });
    };
    AppManager.prototype.add = function (zipContentsBase64d, enable) {
        if (enable === void 0) { enable = true; }
        return __awaiter(this, void 0, void 0, function () {
            var result, created, app;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getParser().parseZip(zipContentsBase64d)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.storage.create({
                                id: result.info.id,
                                info: result.info,
                                status: AppStatus_1.AppStatus.UNKNOWN,
                                zip: zipContentsBase64d,
                                compiled: result.compiledFiles,
                                languageContent: result.languageContent,
                                settings: {},
                            })];
                    case 2:
                        created = _a.sent();
                        if (!created) {
                            throw new Error('Failed to create the App, the storage did not return it.');
                        }
                        app = this.getCompiler().toSandBox(created);
                        this.apps.set(app.getID(), app);
                        // Let everyone know that the App has been added
                        try {
                            this.bridges.getAppActivationBridge().appAdded(app);
                        }
                        catch (e) {
                            // If an error occurs during this, oh well.
                        }
                        // Should enable === true, then we go through the entire start up process
                        // Otherwise, we only initialize it.
                        if (enable) {
                            // Start up the app
                            this.runStartUpProcess(created, app, false);
                        }
                        else {
                            this.initializeApp(created, app, true);
                        }
                        return [2 /*return*/, app];
                }
            });
        });
    };
    AppManager.prototype.remove = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var app;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app = this.apps.get(id);
                        if (!AppStatus_1.AppStatusUtils.isEnabled(app.getStatus())) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.disable(id)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.bridges.getPersistenceBridge().purge(app.getID());
                        return [4 /*yield*/, this.storage.remove(app.getID())];
                    case 3:
                        _a.sent();
                        // Let everyone know that the App has been removed
                        try {
                            this.bridges.getAppActivationBridge().appRemoved(app);
                        }
                        catch (e) {
                            // If an error occurs during this, oh well.
                        }
                        this.apps.delete(app.getID());
                        return [2 /*return*/, app];
                }
            });
        });
    };
    AppManager.prototype.update = function (zipContentsBase64d) {
        return __awaiter(this, void 0, void 0, function () {
            var result, old, e_1, stored, app;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getParser().parseZip(zipContentsBase64d)];
                    case 1:
                        result = _a.sent();
                        return [4 /*yield*/, this.storage.retrieveOne(result.info.id)];
                    case 2:
                        old = _a.sent();
                        if (!old) {
                            throw new Error('Can not update an App that does not currently exist.');
                        }
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.disable(old.id)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        return [3 /*break*/, 6];
                    case 6: return [4 /*yield*/, this.storage.update({
                            createdAt: old.createdAt,
                            id: result.info.id,
                            info: result.info,
                            status: this.apps.get(old.id).getStatus(),
                            zip: zipContentsBase64d,
                            compiled: result.compiledFiles,
                            languageContent: result.languageContent,
                            settings: old.settings,
                        })];
                    case 7:
                        stored = _a.sent();
                        app = this.getCompiler().toSandBox(stored);
                        // Store it temporarily so we can access it else where
                        this.apps.set(app.getID(), app);
                        // Start up the app
                        this.runStartUpProcess(stored, app, false);
                        // Let everyone know that the App has been updated
                        try {
                            this.bridges.getAppActivationBridge().appUpdated(app);
                        }
                        catch (e) {
                            // If an error occurs during this, oh well.
                        }
                        return [2 /*return*/, app];
                }
            });
        });
    };
    AppManager.prototype.getLanguageContent = function () {
        var langs = {};
        this.apps.forEach(function (rl) {
            var content = rl.getStorageItem().languageContent;
            Object.keys(content).forEach(function (key) {
                langs[key] = Object.assign(langs[key] || {}, content[key]);
            });
        });
        return langs;
    };
    AppManager.prototype.changeStatus = function (appId, status) {
        return __awaiter(this, void 0, void 0, function () {
            var rl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        switch (status) {
                            case AppStatus_1.AppStatus.MANUALLY_DISABLED:
                            case AppStatus_1.AppStatus.MANUALLY_ENABLED:
                                break;
                            default:
                                throw new Error('Invalid status to change an App to, must be manually disabled or enabled.');
                        }
                        rl = this.apps.get(appId);
                        if (!rl) {
                            throw new Error('Can not change the status of an App which does not currently exist.');
                        }
                        if (!AppStatus_1.AppStatusUtils.isEnabled(status)) return [3 /*break*/, 2];
                        // Then enable it
                        if (AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                            throw new Error('Can not enable an App which is already enabled.');
                        }
                        return [4 /*yield*/, this.enable(rl.getID())];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        if (!AppStatus_1.AppStatusUtils.isEnabled(rl.getStatus())) {
                            throw new Error('Can not disable an App which is not enabled.');
                        }
                        return [4 /*yield*/, this.disable(rl.getID(), true)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, rl];
                }
            });
        });
    };
    /**
     * Goes through the entire loading up process. WARNING: Do not use. ;)
     *
     * @param appId the id of the application to load
     */
    AppManager.prototype.loadOne = function (appId) {
        return __awaiter(this, void 0, void 0, function () {
            var item, rl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.storage.retrieveOne(appId)];
                    case 1:
                        item = _a.sent();
                        if (!item) {
                            throw new Error("No App found by the id of: \"" + appId + "\"");
                        }
                        this.apps.set(item.id, this.getCompiler().toSandBox(item));
                        rl = this.apps.get(item.id);
                        this.initializeApp(item, rl, false);
                        if (AppStatus_1.AppStatusUtils.isEnabled(rl.getPreviousStatus())) {
                            this.enableApp(item, rl, false, rl.getPreviousStatus() === AppStatus_1.AppStatus.MANUALLY_ENABLED);
                        }
                        return [2 /*return*/, this.apps.get(item.id)];
                }
            });
        });
    };
    AppManager.prototype.runStartUpProcess = function (storageItem, app, isManual) {
        if (app.getStatus() !== AppStatus_1.AppStatus.INITIALIZED) {
            var isInitialized = this.initializeApp(storageItem, app, true);
            if (!isInitialized) {
                return false;
            }
        }
        var isEnabled = this.enableApp(storageItem, app, true, isManual);
        if (!isEnabled) {
            return false;
        }
        // TODO: Register all of the listeners
        return true;
    };
    AppManager.prototype.initializeApp = function (storageItem, app, saveToDb) {
        if (saveToDb === void 0) { saveToDb = true; }
        var result;
        var configExtend = this.getAccessorManager().getConfigurationExtend(storageItem.id);
        var envRead = this.getAccessorManager().getEnvironmentRead(storageItem.id);
        try {
            app.call(metadata_1.AppMethod.INITIALIZE, configExtend, envRead);
            result = true;
            app.setStatus(AppStatus_1.AppStatus.INITIALIZED);
        }
        catch (e) {
            if (e.name === 'NotEnoughMethodArgumentsError') {
                console.warn('Please report the following error:');
            }
            console.error(e);
            this.commandManager.unregisterCommands(storageItem.id);
            result = false;
            app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED);
        }
        if (saveToDb) {
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            storageItem.status = app.getStatus();
            this.storage.update(storageItem);
        }
        return result;
    };
    AppManager.prototype.enableApp = function (storageItem, app, saveToDb, isManual) {
        if (saveToDb === void 0) { saveToDb = true; }
        var enable;
        try {
            enable = app.call(metadata_1.AppMethod.ONENABLE, this.getAccessorManager().getEnvironmentRead(storageItem.id), this.getAccessorManager().getConfigurationModify(storageItem.id));
            app.setStatus(isManual ? AppStatus_1.AppStatus.MANUALLY_ENABLED : AppStatus_1.AppStatus.AUTO_ENABLED);
        }
        catch (e) {
            enable = false;
            if (e.name === 'NotEnoughMethodArgumentsError') {
                console.warn('Please report the following error:');
            }
            console.error(e);
            app.setStatus(AppStatus_1.AppStatus.ERROR_DISABLED);
        }
        if (enable) {
            this.commandManager.registerCommands(app.getID());
        }
        else {
            this.commandManager.unregisterCommands(app.getID());
        }
        if (saveToDb) {
            // This is async, but we don't care since it only updates in the database
            // and it should not mutate any properties we care about
            storageItem.status = app.getStatus();
            this.storage.update(storageItem);
        }
        return enable;
    };
    AppManager.ENV_VAR_NAME_FOR_ENABLING = 'USE_UNRELEASED_ROCKETAPPS_FRAMEWORK';
    AppManager.SUPER_FUN_ENV_ENABLEMENT_NAME = 'LET_ME_HAVE_FUN_WITH_ROCKETS_NOW';
    return AppManager;
}());
exports.AppManager = AppManager;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"apps-ts-definition":{"slashcommands":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/slashcommands/index.js            //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SlashCommandContext_1 = require("./SlashCommandContext");
exports.SlashCommandContext = SlashCommandContext_1.SlashCommandContext;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"rooms":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/rooms/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoomType_1 = require("./RoomType");
exports.RoomType = RoomType_1.RoomType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"AppStatus.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/AppStatus.js                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AppStatus;
(function (AppStatus) {
    /** The status is known, aka not been constructed the proper way. */
    AppStatus["UNKNOWN"] = "unknown";
    /** The App has been constructed but that's it. */
    AppStatus["CONSTRUCTED"] = "constructed";
    /** The App's `initialize()` was called and returned true. */
    AppStatus["INITIALIZED"] = "initialized";
    /** The App's `onEnable()` was called, returned true, and this was done automatically (system start up). */
    AppStatus["AUTO_ENABLED"] = "auto_enabled";
    /** The App's `onEnable()` was called, returned true, and this was done by the user such as installing a new one. */
    AppStatus["MANUALLY_ENABLED"] = "manually_enabled";
    /** The App was disabled due to an unrecoverable error being thrown. */
    AppStatus["ERROR_DISABLED"] = "error_disabled";
    /** The App was manually disabled by a user. */
    AppStatus["MANUALLY_DISABLED"] = "manually_disabled";
    /** The App was disabled due to other circumstances. */
    AppStatus["DISABLED"] = "disabled";
})(AppStatus = exports.AppStatus || (exports.AppStatus = {}));
class AppStatusUtilsDef {
    isEnabled(status) {
        switch (status) {
            case AppStatus.AUTO_ENABLED:
            case AppStatus.MANUALLY_ENABLED:
                return true;
            default:
                return false;
        }
    }
    isDisabled(status) {
        switch (status) {
            case AppStatus.ERROR_DISABLED:
            case AppStatus.MANUALLY_DISABLED:
            case AppStatus.DISABLED:
                return true;
            default:
                return false;
        }
    }
}
exports.AppStatusUtilsDef = AppStatusUtilsDef;
exports.AppStatusUtils = new AppStatusUtilsDef();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/settings/index.js                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SettingType_1 = require("./SettingType");
exports.SettingType = SettingType_1.SettingType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"index.js":function(require,exports){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// node_modules/meteor/rocketchat_apps/node_modules/@rocket.chat/apps-ts-definition/users/index.js                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserStatusConnection_1 = require("./UserStatusConnection");
exports.UserStatusConnection = UserStatusConnection_1.UserStatusConnection;
const UserType_1 = require("./UserType");
exports.UserType = UserType_1.UserType;



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:apps/lib/Apps.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-logs-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/apps-persistence-model.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/storage.js");
require("/node_modules/meteor/rocketchat:apps/server/storage/index.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/activation.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/bridges.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/commands.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/environmental.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/persistence.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/users.js");
require("/node_modules/meteor/rocketchat:apps/server/bridges/index.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/methods.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/rest.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/websockets.js");
require("/node_modules/meteor/rocketchat:apps/server/communication/index.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/messages.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/rooms.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/settings.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/users.js");
require("/node_modules/meteor/rocketchat:apps/server/converters/index.js");
require("/node_modules/meteor/rocketchat:apps/server/orchestrator.js");

/* Exports */
Package._define("rocketchat:apps", {
  Apps: Apps
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_apps.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL2xpYi9BcHBzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1sb2dzLW1vZGVsLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvYXBwcy1tb2RlbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9zdG9yYWdlL2FwcHMtcGVyc2lzdGVuY2UtbW9kZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9zdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL3N0b3JhZ2UvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvc3RvcmFnZS9sb2dzLXN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9hY3RpdmF0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvYnJpZGdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2NvbW1hbmRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvZW52aXJvbm1lbnRhbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL21lc3NhZ2VzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvcGVyc2lzdGVuY2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9yb29tcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2JyaWRnZXMvdXNlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9icmlkZ2VzL2RldGFpbHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvYnJpZGdlcy9odHRwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vbWV0aG9kcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb21tdW5pY2F0aW9uL3Jlc3QuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29tbXVuaWNhdGlvbi93ZWJzb2NrZXRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbW11bmljYXRpb24vaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy9tZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL3Jvb21zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL2NvbnZlcnRlcnMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXBwcy9zZXJ2ZXIvY29udmVydGVycy91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphcHBzL3NlcnZlci9jb252ZXJ0ZXJzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmFwcHMvc2VydmVyL29yY2hlc3RyYXRvci5qcyJdLCJuYW1lcyI6WyJBcHBzIiwibW9kdWxlIiwiZXhwb3J0IiwiQXBwc0xvZ3NNb2RlbCIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwiQXBwc01vZGVsIiwiQXBwc1BlcnNpc3RlbmNlTW9kZWwiLCJBcHBSZWFsU3RvcmFnZSIsIkFwcFN0b3JhZ2UiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiZGF0YSIsImRiIiwiY3JlYXRlIiwiaXRlbSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY3JlYXRlZEF0IiwiRGF0ZSIsInVwZGF0ZWRBdCIsImRvYyIsImZpbmRPbmUiLCIkb3IiLCJpZCIsImluZm8iLCJuYW1lU2x1ZyIsImUiLCJFcnJvciIsImluc2VydCIsIl9pZCIsInJldHJpZXZlT25lIiwicmV0cmlldmVBbGwiLCJkb2NzIiwiZmluZCIsImZldGNoIiwiaXRlbXMiLCJNYXAiLCJmb3JFYWNoIiwiaSIsInNldCIsInVwZGF0ZSIsInRoZW4iLCJ1cGRhdGVkIiwiY2F0Y2giLCJlcnIiLCJyZW1vdmUiLCJzdWNjZXNzIiwiQXBwUmVhbExvZ3NTdG9yYWdlIiwiQXBwQ29uc29sZSIsIkFwcExvZ1N0b3JhZ2UiLCJtb2RlbCIsImFyZ3VtZW50cyIsInN0b3JlRW50cmllcyIsImFwcElkIiwibG9nZ2VyIiwidG9TdG9yYWdlRW50cnkiLCJmaW5kT25lQnlJZCIsImdldEVudHJpZXNGb3IiLCJBcHBBY3RpdmF0aW9uQnJpZGdlIiwib3JjaCIsImFwcEFkZGVkIiwiYXBwIiwiZ2V0Tm90aWZpZXIiLCJnZXRJRCIsImFwcFVwZGF0ZWQiLCJhcHBSZW1vdmVkIiwiYXBwU3RhdHVzQ2hhbmdlZCIsInN0YXR1cyIsImFwcFN0YXR1c1VwZGF0ZWQiLCJSZWFsQXBwQnJpZGdlcyIsIkFwcEJyaWRnZXMiLCJBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlIiwiQXBwQ29tbWFuZHNCcmlkZ2UiLCJBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2UiLCJBcHBIdHRwQnJpZGdlIiwiQXBwTWVzc2FnZUJyaWRnZSIsIkFwcFBlcnNpc3RlbmNlQnJpZGdlIiwiQXBwUm9vbUJyaWRnZSIsIkFwcFNldHRpbmdCcmlkZ2UiLCJBcHBVc2VyQnJpZGdlIiwiX2FjdEJyaWRnZSIsIl9jbWRCcmlkZ2UiLCJfZGV0QnJpZGdlIiwiX2VudkJyaWRnZSIsIl9odHRwQnJpZGdlIiwiX21zZ0JyaWRnZSIsIl9wZXJzaXN0QnJpZGdlIiwiX3Jvb21CcmlkZ2UiLCJfc2V0c0JyaWRnZSIsIl91c2VyQnJpZGdlIiwiZ2V0Q29tbWFuZEJyaWRnZSIsImdldEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSIsImdldEh0dHBCcmlkZ2UiLCJnZXRNZXNzYWdlQnJpZGdlIiwiZ2V0UGVyc2lzdGVuY2VCcmlkZ2UiLCJnZXRBcHBBY3RpdmF0aW9uQnJpZGdlIiwiZ2V0QXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSIsImdldFJvb21CcmlkZ2UiLCJnZXRTZXJ2ZXJTZXR0aW5nQnJpZGdlIiwiZ2V0VXNlckJyaWRnZSIsIlNsYXNoQ29tbWFuZENvbnRleHQiLCJkaXNhYmxlZENvbW1hbmRzIiwiZG9lc0NvbW1hbmRFeGlzdCIsImNvbW1hbmQiLCJjb25zb2xlIiwibG9nIiwibGVuZ3RoIiwiY21kIiwidG9Mb3dlckNhc2UiLCJzbGFzaENvbW1hbmRzIiwiY29tbWFuZHMiLCJoYXMiLCJlbmFibGVDb21tYW5kIiwidHJpbSIsImdldCIsImRlbGV0ZSIsImNvbW1hbmRVcGRhdGVkIiwiZGlzYWJsZUNvbW1hbmQiLCJjb21tYW5kRGlzYWJsZWQiLCJtb2RpZnlDb21tYW5kIiwiX3ZlcmlmeUNvbW1hbmQiLCJwYXJhbXMiLCJwYXJhbXNFeGFtcGxlIiwiZGVzY3JpcHRpb24iLCJpMThuRGVzY3JpcHRpb24iLCJjYWxsYmFjayIsIl9hcHBDb21tYW5kRXhlY3V0b3IiLCJiaW5kIiwicmVnaXN0ZXJDb21tYW5kIiwiY29tbWFuZEFkZGVkIiwidW5yZWdpc3RlckNvbW1hbmQiLCJjb21tYW5kUmVtb3ZlZCIsImV4ZWN1dG9yIiwicGFyYW1ldGVycyIsIm1lc3NhZ2UiLCJ1c2VyIiwiZ2V0Q29udmVydGVycyIsImNvbnZlcnRCeUlkIiwiTWV0ZW9yIiwidXNlcklkIiwicm9vbSIsInJpZCIsInNwbGl0IiwiY29udGV4dCIsIk9iamVjdCIsImZyZWV6ZSIsImdldE1hbmFnZXIiLCJnZXRDb21tYW5kTWFuYWdlciIsImV4ZWN1dGVDb21tYW5kIiwiYWxsb3dlZCIsImdldFZhbHVlQnlOYW1lIiwiZW52VmFyTmFtZSIsImlzUmVhZGFibGUiLCJwcm9jZXNzIiwiZW52IiwiaW5jbHVkZXMiLCJ0b1VwcGVyQ2FzZSIsImlzU2V0IiwibXNnIiwiY29udmVydEFwcE1lc3NhZ2UiLCJydW5Bc1VzZXIiLCJ1IiwiY2FsbCIsImdldEJ5SWQiLCJtZXNzYWdlSWQiLCJlZGl0b3IiLCJNZXNzYWdlcyIsIlVzZXJzIiwidXBkYXRlTWVzc2FnZSIsInB1cmdlIiwiZ2V0UGVyc2lzdGVuY2VNb2RlbCIsImNyZWF0ZVdpdGhBc3NvY2lhdGlvbnMiLCJhc3NvY2lhdGlvbnMiLCJyZWFkQnlJZCIsInJlY29yZCIsInJlYWRCeUFzc29jaWF0aW9ucyIsInVuZGVmaW5lZCIsInJlbW92ZUJ5QXNzb2NpYXRpb25zIiwidXBzZXJ0IiwiUm9vbVR5cGUiLCJyY1Jvb20iLCJjb252ZXJ0QXBwUm9vbSIsIm1ldGhvZCIsInR5cGUiLCJDSEFOTkVMIiwiUFJJVkFURV9HUk9VUCIsImNyZWF0b3IiLCJ1c2VybmFtZXMiLCJyb29tSWQiLCJnZXRCeU5hbWUiLCJyb29tTmFtZSIsImNvbnZlcnRCeU5hbWUiLCJSb29tcyIsInJtIiwiYWxsb3dlZEdyb3VwcyIsImRpc2FsbG93ZWRTZXR0aW5ncyIsImdldEFsbCIsIlNldHRpbmdzIiwiJG5pbiIsIm1hcCIsInMiLCJjb252ZXJ0VG9BcHAiLCJnZXRPbmVCeUlkIiwiaXNSZWFkYWJsZUJ5SWQiLCJoaWRlR3JvdXAiLCJuYW1lIiwiaGlkZVNldHRpbmciLCJ1cGRhdGVPbmUiLCJzZXR0aW5nIiwiZ2V0QnlVc2VybmFtZSIsInVzZXJuYW1lIiwiY29udmVydEJ5VXNlcm5hbWUiLCJvbkFwcFNldHRpbmdzQ2hhbmdlIiwiYXBwU2V0dGluZ3NDaGFuZ2UiLCJ3YXJuIiwicmVxdWVzdCIsImNvbnRlbnQiLCJKU09OIiwic3RyaW5naWZ5IiwiSFRUUCIsInVybCIsInJlc3BvbnNlIiwiQXBwTWV0aG9kcyIsIm1hbmFnZXIiLCJfbWFuYWdlciIsIl9hZGRNZXRob2RzIiwibWV0aG9kcyIsImFyZUFwcHNMb2FkZWQiLCJBcHBzUmVzdEFwaSIsIl9vcmNoIiwiYXBpIiwiQVBJIiwiQXBpQ2xhc3MiLCJ2ZXJzaW9uIiwidXNlRGVmYXVsdEF1dGgiLCJwcmV0dHlKc29uIiwiZW5hYmxlQ29ycyIsImF1dGgiLCJnZXRVc2VyQXV0aCIsImFkZE1hbmFnZW1lbnRSb3V0ZXMiLCJfaGFuZGxlRmlsZSIsImZpbGVGaWVsZCIsIkJ1c2JveSIsIk5wbSIsImJ1c2JveSIsImhlYWRlcnMiLCJ3cmFwQXN5bmMiLCJvbiIsImJpbmRFbnZpcm9ubWVudCIsImZpZWxkbmFtZSIsImZpbGUiLCJmaWxlRGF0YSIsInB1c2giLCJCdWZmZXIiLCJjb25jYXQiLCJwaXBlIiwib3JjaGVzdHJhdG9yIiwiZmlsZUhhbmRsZXIiLCJhZGRSb3V0ZSIsImF1dGhSZXF1aXJlZCIsImFwcHMiLCJwcmwiLCJnZXRJbmZvIiwibGFuZ3VhZ2VzIiwiZ2V0U3RvcmFnZUl0ZW0iLCJsYW5ndWFnZUNvbnRlbnQiLCJnZXRTdGF0dXMiLCJ2MSIsInBvc3QiLCJidWZmIiwiYm9keVBhcmFtcyIsInJlc3VsdCIsIm5wbVJlcXVlc3RPcHRpb25zIiwiZW5jb2RpbmciLCJzdGF0dXNDb2RlIiwiZmFpbHVyZSIsImVycm9yIiwiZnJvbSIsImFkZCIsInRvU3RyaW5nIiwicmwiLCJ1cmxQYXJhbXMiLCJub3RGb3VuZCIsImF3YWl0IiwiaWNvbkZpbGVDb250ZW50Iiwib2Zmc2V0IiwiY291bnQiLCJnZXRQYWdpbmF0aW9uSXRlbXMiLCJzb3J0IiwiZmllbGRzIiwicXVlcnkiLCJwYXJzZUpzb25RdWVyeSIsIm91clF1ZXJ5IiwiYXNzaWduIiwib3B0aW9ucyIsIl91cGRhdGVkQXQiLCJza2lwIiwibGltaXQiLCJsb2dzIiwiZ2V0TG9nU3RvcmFnZSIsInNldHRpbmdzIiwia2V5cyIsImsiLCJoaWRkZW4iLCJnZXRTZXR0aW5nc01hbmFnZXIiLCJ1cGRhdGVBcHBTZXR0aW5nIiwic2V0dGluZ0lkIiwiZ2V0QXBwU2V0dGluZyIsImNoYW5nZVN0YXR1cyIsIkFwcEV2ZW50cyIsIkFwcFNlcnZlckxpc3RlbmVyIiwiQXBwU2VydmVyTm90aWZpZXIiLCJBcHBTdGF0dXMiLCJBcHBTdGF0dXNVdGlscyIsIkFQUF9BRERFRCIsIkFQUF9SRU1PVkVEIiwiQVBQX1VQREFURUQiLCJBUFBfU1RBVFVTX0NIQU5HRSIsIkFQUF9TRVRUSU5HX1VQREFURUQiLCJDT01NQU5EX0FEREVEIiwiQ09NTUFORF9ESVNBQkxFRCIsIkNPTU1BTkRfVVBEQVRFRCIsIkNPTU1BTkRfUkVNT1ZFRCIsImVuZ2luZVN0cmVhbWVyIiwiY2xpZW50U3RyZWFtZXIiLCJyZWNpZXZlZCIsIm9uQXBwQWRkZWQiLCJvbkFwcFN0YXR1c1VwZGF0ZWQiLCJvbkFwcFNldHRpbmdVcGRhdGVkIiwib25BcHBSZW1vdmVkIiwib25Db21tYW5kQWRkZWQiLCJvbkNvbW1hbmREaXNhYmxlZCIsIm9uQ29tbWFuZFVwZGF0ZWQiLCJvbkNvbW1hbmRSZW1vdmVkIiwibG9hZE9uZSIsImVtaXQiLCJ3aGVuIiwiaXNFbmFibGVkIiwiZW5hYmxlIiwiaXNEaXNhYmxlZCIsImRpc2FibGUiLCJNQU5VQUxMWV9ESVNBQkxFRCIsIlN0cmVhbWVyIiwicmV0cmFuc21pdCIsInNlcnZlck9ubHkiLCJhbGxvd1JlYWQiLCJhbGxvd0VtaXQiLCJhbGxvd1dyaXRlIiwibGlzdGVuZXIiLCJkZXRhaWxzIiwiQXBwTWVzc2FnZXNDb252ZXJ0ZXIiLCJtc2dJZCIsImNvbnZlcnRNZXNzYWdlIiwibXNnT2JqIiwic2VuZGVyIiwiZWRpdGVkQnkiLCJhdHRhY2htZW50cyIsIl9jb252ZXJ0QXR0YWNobWVudHNUb0FwcCIsInRleHQiLCJ0cyIsImVkaXRlZEF0IiwiZW1vamkiLCJhdmF0YXJVcmwiLCJhdmF0YXIiLCJhbGlhcyIsImN1c3RvbUZpZWxkcyIsIl9jb252ZXJ0QXBwQXR0YWNobWVudHMiLCJSYW5kb20iLCJBcnJheSIsImlzQXJyYXkiLCJhdHRhY2htZW50IiwiY29sbGFwc2VkIiwiY29sb3IiLCJ0aW1lc3RhbXAiLCJtZXNzYWdlX2xpbmsiLCJ0aW1lc3RhbXBMaW5rIiwidGh1bWJfdXJsIiwidGh1bWJuYWlsVXJsIiwiYXV0aG9yX25hbWUiLCJhdXRob3IiLCJhdXRob3JfbGluayIsImxpbmsiLCJhdXRob3JfaWNvbiIsImljb24iLCJ0aXRsZSIsInZhbHVlIiwidGl0bGVfbGluayIsInRpdGxlX2xpbmtfZG93bmxvYWQiLCJkb3dubG9hZExpbmsiLCJpbWFnZV91cmwiLCJpbWFnZVVybCIsImF1ZGlvX3VybCIsImF1ZGlvVXJsIiwidmlkZW9fdXJsIiwidmlkZW9VcmwiLCJBcHBSb29tc0NvbnZlcnRlciIsIl9jb252ZXJ0VG9BcHAiLCJmaW5kT25lQnlOYW1lIiwidCIsIm1zZ3MiLCJtZXNzYWdlQ291bnQiLCJkZWZhdWx0IiwiaXNEZWZhdWx0IiwibG0iLCJsYXN0TW9kaWZpZWRBdCIsIl9jb252ZXJ0VHlwZVRvQXBwIiwidHlwZUNoYXIiLCJESVJFQ1RfTUVTU0FHRSIsIkxJVkVfQ0hBVCIsIkFwcFNldHRpbmdzQ29udmVydGVyIiwiU2V0dGluZ1R5cGUiLCJwYWNrYWdlVmFsdWUiLCJ2YWx1ZXMiLCJwdWJsaWMiLCJncm91cCIsImkxOG5MYWJlbCIsIkJPT0xFQU4iLCJDT0RFIiwiQ09MT1IiLCJGT05UIiwiTlVNQkVSIiwiU0VMRUNUIiwiU1RSSU5HIiwiQXBwVXNlcnNDb252ZXJ0ZXIiLCJVc2VyU3RhdHVzQ29ubmVjdGlvbiIsIlVzZXJUeXBlIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJfY29udmVydFVzZXJUeXBlVG9FbnVtIiwiX2NvbnZlcnRTdGF0dXNDb25uZWN0aW9uVG9FbnVtIiwic3RhdHVzQ29ubmVjdGlvbiIsImVtYWlscyIsImFjdGl2ZSIsInJvbGVzIiwidXRjT2Zmc2V0IiwibGFzdExvZ2luQXQiLCJsYXN0TG9naW4iLCJVU0VSIiwiQk9UIiwiT0ZGTElORSIsIk9OTElORSIsIkFXQVkiLCJCVVNZIiwiQXBwTWFuYWdlciIsIkFwcFNlcnZlck9yY2hlc3RyYXRvciIsIlBlcm1pc3Npb25zIiwiY3JlYXRlT3JVcGRhdGUiLCJfbW9kZWwiLCJfbG9nTW9kZWwiLCJfcGVyc2lzdE1vZGVsIiwiX3N0b3JhZ2UiLCJfbG9nU3RvcmFnZSIsIl9jb252ZXJ0ZXJzIiwiX2JyaWRnZXMiLCJfY29tbXVuaWNhdG9ycyIsImdldE1vZGVsIiwiZ2V0U3RvcmFnZSIsImdldEJyaWRnZXMiLCJzdGFydHVwIiwiX2FwcFNlcnZlck9yY2hlc3RyYXRvciIsIkVOVl9WQVJfTkFNRV9GT1JfRU5BQkxJTkciLCJTVVBFUl9GVU5fRU5WX0VOQUJMRU1FTlRfTkFNRSIsImdsb2JhbCIsImxvYWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBQSxPQUFPLEVBQVAsQzs7Ozs7Ozs7Ozs7QUNEQUMsT0FBT0MsTUFBUCxDQUFjO0FBQUNDLGlCQUFjLE1BQUlBO0FBQW5CLENB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QVksYUFBWixDQURiLEVBRUU5RCxLQUZGLENBRVNDLEdBQUQsSUFBUzRELFFBQVE4RyxJQUFSLENBQWEsWUFBYixFQUEyQjFLLEdBQTNCLENBRmpCO0FBR0EsQ0FaRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2FwcHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQbGVhc2Ugc2VlIGJvdGggc2VydmVyIGFuZCBjbGllbnQncyByZXBzZWN0aXZlIFwib3JjaGVzdHJhdG9yXCIgZmlsZSBmb3IgdGhlIGNvbnRlbnRzXG5BcHBzID0ge307XG4iLCJleHBvcnQgY2xhc3MgQXBwc0xvZ3NNb2RlbCBleHRlbmRzIFJvY2tldENoYXQubW9kZWxzLl9CYXNlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoJ2FwcHNfbG9ncycpO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc01vZGVsIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignYXBwcycpO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwc1BlcnNpc3RlbmNlTW9kZWwgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCdhcHBzX3BlcnNpc3RlbmNlJyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IEFwcFN0b3JhZ2UgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL3N0b3JhZ2UnO1xuXG5leHBvcnQgY2xhc3MgQXBwUmVhbFN0b3JhZ2UgZXh0ZW5kcyBBcHBTdG9yYWdlIHtcblx0Y29uc3RydWN0b3IoZGF0YSkge1xuXHRcdHN1cGVyKCdtb25nb2RiJyk7XG5cdFx0dGhpcy5kYiA9IGRhdGE7XG5cdH1cblxuXHRjcmVhdGUoaXRlbSkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRpdGVtLmNyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cdFx0XHRpdGVtLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCk7XG5cblx0XHRcdGxldCBkb2M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvYyA9IHRoaXMuZGIuZmluZE9uZSh7ICRvcjogW3sgaWQ6IGl0ZW0uaWQgfSwgeyAnaW5mby5uYW1lU2x1Zyc6IGl0ZW0uaW5mby5uYW1lU2x1ZyB9XSB9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRvYykge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KG5ldyBFcnJvcignQXBwIGFscmVhZHkgZXhpc3RzLicpKTtcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0Y29uc3QgaWQgPSB0aGlzLmRiLmluc2VydChpdGVtKTtcblx0XHRcdFx0aXRlbS5faWQgPSBpZDtcblxuXHRcdFx0XHRyZXNvbHZlKGl0ZW0pO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZWplY3QoZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXRyaWV2ZU9uZShpZCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRsZXQgZG9jO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2MgPSB0aGlzLmRiLmZpbmRPbmUoeyAkb3I6IFsge19pZDogaWQgfSwgeyBpZCB9IF19KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0cmV0dXJuIHJlamVjdChlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGRvYykge1xuXHRcdFx0XHRyZXNvbHZlKGRvYyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZWplY3QobmV3IEVycm9yKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkOiAkeyBpZCB9YCkpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG5cblx0cmV0cmlldmVBbGwoKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdGxldCBkb2NzO1xuXG5cdFx0XHR0cnkge1xuXHRcdFx0XHRkb2NzID0gdGhpcy5kYi5maW5kKHt9KS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpdGVtcyA9IG5ldyBNYXAoKTtcblxuXHRcdFx0ZG9jcy5mb3JFYWNoKChpKSA9PiBpdGVtcy5zZXQoaS5pZCwgaSkpO1xuXG5cdFx0XHRyZXNvbHZlKGl0ZW1zKTtcblx0XHR9KTtcblx0fVxuXG5cdHVwZGF0ZShpdGVtKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuZGIudXBkYXRlKHsgaWQ6IGl0ZW0uaWQgfSwgaXRlbSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucmV0cmlldmVPbmUoaXRlbS5pZCkudGhlbigodXBkYXRlZCkgPT4gcmVzb2x2ZSh1cGRhdGVkKSkuY2F0Y2goKGVycikgPT4gcmVqZWN0KGVycikpO1xuXHRcdH0pO1xuXHR9XG5cblx0cmVtb3ZlKGlkKSB7XG5cdFx0cmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHRoaXMuZGIucmVtb3ZlKHsgaWQgfSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJldHVybiByZWplY3QoZSk7XG5cdFx0XHR9XG5cblx0XHRcdHJlc29sdmUoeyBzdWNjZXNzOiB0cnVlIH0pO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBzTG9nc01vZGVsIH0gZnJvbSAnLi9hcHBzLWxvZ3MtbW9kZWwnO1xuaW1wb3J0IHsgQXBwc01vZGVsIH0gZnJvbSAnLi9hcHBzLW1vZGVsJztcbmltcG9ydCB7IEFwcHNQZXJzaXN0ZW5jZU1vZGVsIH0gZnJvbSAnLi9hcHBzLXBlcnNpc3RlbmNlLW1vZGVsJztcbmltcG9ydCB7IEFwcFJlYWxMb2dzU3RvcmFnZSB9IGZyb20gJy4vbG9ncy1zdG9yYWdlJztcbmltcG9ydCB7IEFwcFJlYWxTdG9yYWdlIH0gZnJvbSAnLi9zdG9yYWdlJztcblxuZXhwb3J0IHsgQXBwc0xvZ3NNb2RlbCwgQXBwc01vZGVsLCBBcHBzUGVyc2lzdGVuY2VNb2RlbCwgQXBwUmVhbExvZ3NTdG9yYWdlLCBBcHBSZWFsU3RvcmFnZSB9O1xuIiwiaW1wb3J0IHsgQXBwQ29uc29sZSB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvbG9nZ2luZyc7XG5pbXBvcnQgeyBBcHBMb2dTdG9yYWdlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtZW5naW5lL3NlcnZlci9zdG9yYWdlJztcblxuZXhwb3J0IGNsYXNzIEFwcFJlYWxMb2dzU3RvcmFnZSBleHRlbmRzIEFwcExvZ1N0b3JhZ2Uge1xuXHRjb25zdHJ1Y3Rvcihtb2RlbCkge1xuXHRcdHN1cGVyKCdtb25nb2RiJyk7XG5cdFx0dGhpcy5kYiA9IG1vZGVsO1xuXHR9XG5cblx0ZmluZCgpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvY3M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvY3MgPSB0aGlzLmRiLmZpbmQoLi4uYXJndW1lbnRzKS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKGRvY3MpO1xuXHRcdH0pO1xuXHR9XG5cblx0c3RvcmVFbnRyaWVzKGFwcElkLCBsb2dnZXIpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0Y29uc3QgaXRlbSA9IEFwcENvbnNvbGUudG9TdG9yYWdlRW50cnkoYXBwSWQsIGxvZ2dlcik7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gdGhpcy5kYi5pbnNlcnQoaXRlbSk7XG5cblx0XHRcdFx0cmVzb2x2ZSh0aGlzLmRiLmZpbmRPbmVCeUlkKGlkKSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHJlamVjdChlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGdldEVudHJpZXNGb3IoYXBwSWQpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0bGV0IGRvY3M7XG5cblx0XHRcdHRyeSB7XG5cdFx0XHRcdGRvY3MgPSB0aGlzLmRiLmZpbmQoeyBhcHBJZCB9KS5mZXRjaCgpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRyZXR1cm4gcmVqZWN0KGUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXNvbHZlKGRvY3MpO1xuXHRcdH0pO1xuXHR9XG59XG4iLCJleHBvcnQgY2xhc3MgQXBwQWN0aXZhdGlvbkJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0YXBwQWRkZWQoYXBwKSB7XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwQWRkZWQoYXBwLmdldElEKCkpO1xuXHR9XG5cblx0YXBwVXBkYXRlZChhcHApIHtcblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5hcHBVcGRhdGVkKGFwcC5nZXRJRCgpKTtcblx0fVxuXG5cdGFwcFJlbW92ZWQoYXBwKSB7XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwUmVtb3ZlZChhcHAuZ2V0SUQoKSk7XG5cdH1cblxuXHRhcHBTdGF0dXNDaGFuZ2VkKGFwcCwgc3RhdHVzKSB7XG5cdFx0dGhpcy5vcmNoLmdldE5vdGlmaWVyKCkuYXBwU3RhdHVzVXBkYXRlZChhcHAuZ2V0SUQoKSwgc3RhdHVzKTtcblx0fVxufVxuIiwiaW1wb3J0IHsgQXBwQnJpZGdlcyB9IGZyb20gJ0Byb2NrZXQuY2hhdC9hcHBzLWVuZ2luZS9zZXJ2ZXIvYnJpZGdlcyc7XG5cbmltcG9ydCB7IEFwcEFjdGl2YXRpb25CcmlkZ2UgfSBmcm9tICcuL2FjdGl2YXRpb24nO1xuaW1wb3J0IHsgQXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSB9IGZyb20gJy4vZGV0YWlscyc7XG5pbXBvcnQgeyBBcHBDb21tYW5kc0JyaWRnZSB9IGZyb20gJy4vY29tbWFuZHMnO1xuaW1wb3J0IHsgQXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlIH0gZnJvbSAnLi9lbnZpcm9ubWVudGFsJztcbmltcG9ydCB7IEFwcEh0dHBCcmlkZ2UgfSBmcm9tICcuL2h0dHAnO1xuaW1wb3J0IHsgQXBwTWVzc2FnZUJyaWRnZSB9IGZyb20gJy4vbWVzc2FnZXMnO1xuaW1wb3J0IHsgQXBwUGVyc2lzdGVuY2VCcmlkZ2UgfSBmcm9tICcuL3BlcnNpc3RlbmNlJztcbmltcG9ydCB7IEFwcFJvb21CcmlkZ2UgfSBmcm9tICcuL3Jvb21zJztcbmltcG9ydCB7IEFwcFNldHRpbmdCcmlkZ2UgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEFwcFVzZXJCcmlkZ2UgfSBmcm9tICcuL3VzZXJzJztcblxuZXhwb3J0IGNsYXNzIFJlYWxBcHBCcmlkZ2VzIGV4dGVuZHMgQXBwQnJpZGdlcyB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fYWN0QnJpZGdlID0gbmV3IEFwcEFjdGl2YXRpb25CcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fY21kQnJpZGdlID0gbmV3IEFwcENvbW1hbmRzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2RldEJyaWRnZSA9IG5ldyBBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX2VudkJyaWRnZSA9IG5ldyBBcHBFbnZpcm9ubWVudGFsVmFyaWFibGVCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5faHR0cEJyaWRnZSA9IG5ldyBBcHBIdHRwQnJpZGdlKCk7XG5cdFx0dGhpcy5fbXNnQnJpZGdlID0gbmV3IEFwcE1lc3NhZ2VCcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fcGVyc2lzdEJyaWRnZSA9IG5ldyBBcHBQZXJzaXN0ZW5jZUJyaWRnZShvcmNoKTtcblx0XHR0aGlzLl9yb29tQnJpZGdlID0gbmV3IEFwcFJvb21CcmlkZ2Uob3JjaCk7XG5cdFx0dGhpcy5fc2V0c0JyaWRnZSA9IG5ldyBBcHBTZXR0aW5nQnJpZGdlKG9yY2gpO1xuXHRcdHRoaXMuX3VzZXJCcmlkZ2UgPSBuZXcgQXBwVXNlckJyaWRnZShvcmNoKTtcblx0fVxuXG5cdGdldENvbW1hbmRCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2NtZEJyaWRnZTtcblx0fVxuXG5cdGdldEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZW52QnJpZGdlO1xuXHR9XG5cblx0Z2V0SHR0cEJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5faHR0cEJyaWRnZTtcblx0fVxuXG5cdGdldE1lc3NhZ2VCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX21zZ0JyaWRnZTtcblx0fVxuXG5cdGdldFBlcnNpc3RlbmNlQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9wZXJzaXN0QnJpZGdlO1xuXHR9XG5cblx0Z2V0QXBwQWN0aXZhdGlvbkJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fYWN0QnJpZGdlO1xuXHR9XG5cblx0Z2V0QXBwRGV0YWlsQ2hhbmdlc0JyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fZGV0QnJpZGdlO1xuXHR9XG5cblx0Z2V0Um9vbUJyaWRnZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5fcm9vbUJyaWRnZTtcblx0fVxuXG5cdGdldFNlcnZlclNldHRpbmdCcmlkZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3NldHNCcmlkZ2U7XG5cdH1cblxuXHRnZXRVc2VyQnJpZGdlKCkge1xuXHRcdHJldHVybiB0aGlzLl91c2VyQnJpZGdlO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBTbGFzaENvbW1hbmRDb250ZXh0IH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9zbGFzaGNvbW1hbmRzJztcblxuZXhwb3J0IGNsYXNzIEFwcENvbW1hbmRzQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdFx0dGhpcy5kaXNhYmxlZENvbW1hbmRzID0gbmV3IE1hcCgpO1xuXHR9XG5cblx0ZG9lc0NvbW1hbmRFeGlzdChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgY2hlY2tpbmcgaWYgXCIkeyBjb21tYW5kIH1cIiBjb21tYW5kIGV4aXN0cy5gKTtcblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRjb25zdCBjbWQgPSBjb21tYW5kLnRvTG93ZXJDYXNlKCk7XG5cdFx0cmV0dXJuIHR5cGVvZiBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9PT0gJ29iamVjdCcgfHwgdGhpcy5kaXNhYmxlZENvbW1hbmRzLmhhcyhjbWQpO1xuXHR9XG5cblx0ZW5hYmxlQ29tbWFuZChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgYXR0ZW1wdGluZyB0byBlbmFibGUgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIG11c3QgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICghdGhpcy5kaXNhYmxlZENvbW1hbmRzLmhhcyhjbWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBjb21tYW5kIGlzIG5vdCBjdXJyZW50bHkgZGlzYWJsZWQ6IFwiJHsgY21kIH1cImApO1xuXHRcdH1cblxuXHRcdFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdID0gdGhpcy5kaXNhYmxlZENvbW1hbmRzLmdldChjbWQpO1xuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcy5kZWxldGUoY21kKTtcblxuXHRcdHRoaXMub3JjaC5nZXROb3RpZmllcigpLmNvbW1hbmRVcGRhdGVkKGNtZCk7XG5cdH1cblxuXHRkaXNhYmxlQ29tbWFuZChjb21tYW5kLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgYXR0ZW1wdGluZyB0byBkaXNhYmxlIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQgfVwiYCk7XG5cblx0XHRpZiAodHlwZW9mIGNvbW1hbmQgIT09ICdzdHJpbmcnIHx8IGNvbW1hbmQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBtdXN0IGJlIGEgc3RyaW5nLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAodGhpcy5kaXNhYmxlZENvbW1hbmRzLmhhcyhjbWQpKSB7XG5cdFx0XHQvLyBUaGUgY29tbWFuZCBpcyBhbHJlYWR5IGRpc2FibGVkLCBubyBuZWVkIHRvIGRpc2FibGUgaXQgeWV0IGFnYWluXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgQ29tbWFuZCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgc3lzdGVtIGN1cnJlbnRseTogXCIkeyBjbWQgfVwiYCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5kaXNhYmxlZENvbW1hbmRzLnNldChjbWQsIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdKTtcblx0XHRkZWxldGUgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF07XG5cblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kRGlzYWJsZWQoY21kKTtcblx0fVxuXG5cdC8vIGNvbW1hbmQ6IHsgY29tbWFuZCwgcGFyYW1zRXhhbXBsZSwgaTE4bkRlc2NyaXB0aW9uLCBleGVjdXRvcjogZnVuY3Rpb24gfVxuXHRtb2RpZnlDb21tYW5kKGNvbW1hbmQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBhdHRlbXB0aW5nIHRvIG1vZGlmeSB0aGUgY29tbWFuZDogXCIkeyBjb21tYW5kIH1cImApO1xuXG5cdFx0dGhpcy5fdmVyaWZ5Q29tbWFuZChjb21tYW5kKTtcblxuXHRcdGNvbnN0IGNtZCA9IGNvbW1hbmQudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAodHlwZW9mIFJvY2tldENoYXQuc2xhc2hDb21tYW5kcy5jb21tYW5kc1tjbWRdID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBDb21tYW5kIGRvZXMgbm90IGV4aXN0IGluIHRoZSBzeXN0ZW0gY3VycmVudGx5IChvciBpdCBpcyBkaXNhYmxlZCk6IFwiJHsgY21kIH1cImApO1xuXHRcdH1cblxuXHRcdGNvbnN0IGl0ZW0gPSBSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY21kXTtcblx0XHRpdGVtLnBhcmFtcyA9IGNvbW1hbmQucGFyYW1zRXhhbXBsZSA/IGNvbW1hbmQucGFyYW1zRXhhbXBsZSA6IGl0ZW0ucGFyYW1zO1xuXHRcdGl0ZW0uZGVzY3JpcHRpb24gPSBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiA/IGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uIDogaXRlbS5wYXJhbXM7XG5cdFx0aXRlbS5jYWxsYmFjayA9IHRoaXMuX2FwcENvbW1hbmRFeGVjdXRvci5iaW5kKHRoaXMpO1xuXG5cdFx0Um9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF0gPSBpdGVtO1xuXHRcdHRoaXMub3JjaC5nZXROb3RpZmllcigpLmNvbW1hbmRVcGRhdGVkKGNtZCk7XG5cdH1cblxuXHRyZWdpc3RlckNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlZ2lzdGVyaW5nIHRoZSBjb21tYW5kOiBcIiR7IGNvbW1hbmQuY29tbWFuZCB9XCJgKTtcblxuXHRcdHRoaXMuX3ZlcmlmeUNvbW1hbmQoY29tbWFuZCk7XG5cblx0XHRjb25zdCBpdGVtID0ge1xuXHRcdFx0Y29tbWFuZDogY29tbWFuZC5jb21tYW5kLnRvTG93ZXJDYXNlKCksXG5cdFx0XHRwYXJhbXM6IGNvbW1hbmQucGFyYW1zRXhhbXBsZSxcblx0XHRcdGRlc2NyaXB0aW9uOiBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbixcblx0XHRcdGNhbGxiYWNrOiB0aGlzLl9hcHBDb21tYW5kRXhlY3V0b3IuYmluZCh0aGlzKVxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNsYXNoQ29tbWFuZHMuY29tbWFuZHNbY29tbWFuZC5jb21tYW5kLnRvTG93ZXJDYXNlKCldID0gaXRlbTtcblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kQWRkZWQoY29tbWFuZC5jb21tYW5kLnRvTG93ZXJDYXNlKCkpO1xuXHR9XG5cblx0dW5yZWdpc3RlckNvbW1hbmQoY29tbWFuZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVucmVnaXN0ZXJpbmcgdGhlIGNvbW1hbmQ6IFwiJHsgY29tbWFuZCB9XCJgKTtcblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tbWFuZCBwYXJhbWV0ZXIgcHJvdmlkZWQsIG11c3QgYmUgYSBzdHJpbmcuJyk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgY21kID0gY29tbWFuZC50b0xvd2VyQ2FzZSgpO1xuXHRcdHRoaXMuZGlzYWJsZWRDb21tYW5kcy5kZWxldGUoY21kKTtcblx0XHRkZWxldGUgUm9ja2V0Q2hhdC5zbGFzaENvbW1hbmRzLmNvbW1hbmRzW2NtZF07XG5cblx0XHR0aGlzLm9yY2guZ2V0Tm90aWZpZXIoKS5jb21tYW5kUmVtb3ZlZChjbWQpO1xuXHR9XG5cblx0X3ZlcmlmeUNvbW1hbmQoY29tbWFuZCkge1xuXHRcdGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ29iamVjdCcpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZC5jb21tYW5kICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1hbmQucGFyYW1zRXhhbXBsZSAmJiB0eXBlb2YgY29tbWFuZC5wYXJhbXNFeGFtcGxlICE9PSAnc3RyaW5nJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGNvbW1hbmQuaTE4bkRlc2NyaXB0aW9uICYmIHR5cGVvZiBjb21tYW5kLmkxOG5EZXNjcmlwdGlvbiAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBTbGFzaCBDb21tYW5kIHBhcmFtZXRlciBwcm92aWRlZCwgaXQgbXVzdCBiZSBhIHZhbGlkIElTbGFzaENvbW1hbmQgb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgY29tbWFuZC5leGVjdXRvciAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIFNsYXNoIENvbW1hbmQgcGFyYW1ldGVyIHByb3ZpZGVkLCBpdCBtdXN0IGJlIGEgdmFsaWQgSVNsYXNoQ29tbWFuZCBvYmplY3QuJyk7XG5cdFx0fVxuXHR9XG5cblx0X2FwcENvbW1hbmRFeGVjdXRvcihjb21tYW5kLCBwYXJhbWV0ZXJzLCBtZXNzYWdlKSB7XG5cdFx0Y29uc3QgdXNlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKE1ldGVvci51c2VySWQoKSk7XG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1lc3NhZ2UucmlkKTtcblx0XHRjb25zdCBwYXJhbXMgPSBwYXJhbWV0ZXJzLmxlbmd0aCA9PT0gMCB8fCBwYXJhbWV0ZXJzID09PSAnICcgPyBbXSA6IHBhcmFtZXRlcnMuc3BsaXQoJyAnKTtcblxuXHRcdGNvbnN0IGNvbnRleHQgPSBuZXcgU2xhc2hDb21tYW5kQ29udGV4dChPYmplY3QuZnJlZXplKHVzZXIpLCBPYmplY3QuZnJlZXplKHJvb20pLCBPYmplY3QuZnJlZXplKHBhcmFtcykpO1xuXHRcdHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZ2V0Q29tbWFuZE1hbmFnZXIoKS5leGVjdXRlQ29tbWFuZChjb21tYW5kLCBjb250ZXh0KTtcblx0fVxufVxuIiwiZXhwb3J0IGNsYXNzIEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHRcdHRoaXMuYWxsb3dlZCA9IFsnTk9ERV9FTlYnLCAnUk9PVF9VUkwnLCAnSU5TVEFOQ0VfSVAnXTtcblx0fVxuXG5cdGdldFZhbHVlQnlOYW1lKGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIHZhbHVlICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdGlmICh0aGlzLmlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpKSB7XG5cdFx0XHRyZXR1cm4gcHJvY2Vzcy5lbnZbZW52VmFyTmFtZV07XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBcIiR7IGVudlZhck5hbWUgfVwiIGlzIG5vdCByZWFkYWJsZS5gKTtcblx0fVxuXG5cdGlzUmVhZGFibGUoZW52VmFyTmFtZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNoZWNraW5nIGlmIHRoZSBlbnZpcm9ubWVudGFsIHZhcmlhYmxlIGlzIHJlYWRhYmxlICR7IGVudlZhck5hbWUgfS5gKTtcblxuXHRcdHJldHVybiB0aGlzLmFsbG93ZWQuaW5jbHVkZXMoZW52VmFyTmFtZS50b1VwcGVyQ2FzZSgpKTtcblx0fVxuXG5cdGlzU2V0KGVudlZhck5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBjaGVja2luZyBpZiB0aGUgZW52aXJvbm1lbnRhbCB2YXJpYWJsZSBpcyBzZXQgJHsgZW52VmFyTmFtZSB9LmApO1xuXG5cdFx0aWYgKHRoaXMuaXNSZWFkYWJsZShlbnZWYXJOYW1lLCBhcHBJZCkpIHtcblx0XHRcdHJldHVybiB0eXBlb2YgcHJvY2Vzcy5lbnZbZW52VmFyTmFtZV0gIT09ICd1bmRlZmluZWQnO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBFcnJvcihgVGhlIGVudmlyb25tZW50YWwgdmFyaWFibGUgXCIkeyBlbnZWYXJOYW1lIH1cIiBpcyBub3QgcmVhZGFibGUuYCk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBNZXNzYWdlQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjcmVhdGUobWVzc2FnZSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNyZWF0aW5nIGEgbmV3IG1lc3NhZ2UuYCk7XG5cblx0XHRsZXQgbXNnID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ21lc3NhZ2VzJykuY29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSk7XG5cblx0XHRNZXRlb3IucnVuQXNVc2VyKG1zZy51Ll9pZCwgKCkgPT4ge1xuXHRcdFx0bXNnID0gTWV0ZW9yLmNhbGwoJ3NlbmRNZXNzYWdlJywgbXNnKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBtc2cuX2lkO1xuXHR9XG5cblx0Z2V0QnlJZChtZXNzYWdlSWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSBtZXNzYWdlOiBcIiR7IG1lc3NhZ2VJZCB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgnbWVzc2FnZXMnKS5jb252ZXJ0QnlJZChtZXNzYWdlSWQpO1xuXHR9XG5cblx0dXBkYXRlKG1lc3NhZ2UsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyBhIG1lc3NhZ2UuYCk7XG5cblx0XHRpZiAoIW1lc3NhZ2UuZWRpdG9yKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZWRpdG9yIGFzc2lnbmVkIHRvIHRoZSBtZXNzYWdlIGZvciB0aGUgdXBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGlmICghbWVzc2FnZS5pZCB8fCAhUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZE9uZUJ5SWQobWVzc2FnZS5pZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQSBtZXNzYWdlIG11c3QgZXhpc3QgdG8gdXBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IG1zZyA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdtZXNzYWdlcycpLmNvbnZlcnRBcHBNZXNzYWdlKG1lc3NhZ2UpO1xuXHRcdGNvbnN0IGVkaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuZWRpdG9yLmlkKTtcblxuXHRcdFJvY2tldENoYXQudXBkYXRlTWVzc2FnZShtc2csIGVkaXRvcik7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBQZXJzaXN0ZW5jZUJyaWRnZSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0cHVyZ2UoYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCdzIHBlcnNpc3RlbnQgc3RvcmFnZSBpcyBiZWluZyBwdXJnZWQ6ICR7IGFwcElkIH1gKTtcblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgYXBwSWQgfSk7XG5cdH1cblxuXHRjcmVhdGUoZGF0YSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHN0b3JpbmcgYSBuZXcgb2JqZWN0IGluIHRoZWlyIHBlcnNpc3RlbmNlLmAsIGRhdGEpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBkYXRhIH0pO1xuXHR9XG5cblx0Y3JlYXRlV2l0aEFzc29jaWF0aW9ucyhkYXRhLCBhc3NvY2lhdGlvbnMsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBzdG9yaW5nIGEgbmV3IG9iamVjdCBpbiB0aGVpciBwZXJzaXN0ZW5jZSB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCBzb21lIG1vZGVscy5gLCBkYXRhLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0aWYgKHR5cGVvZiBkYXRhICE9PSAnb2JqZWN0Jykge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdBdHRlbXB0ZWQgdG8gc3RvcmUgYW4gaW52YWxpZCBkYXRhIHR5cGUsIGl0IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmluc2VydCh7IGFwcElkLCBhc3NvY2lhdGlvbnMsIGRhdGEgfSk7XG5cdH1cblxuXHRyZWFkQnlJZChpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlYWRpbmcgdGhlaXIgZGF0YSBpbiB0aGVpciBwZXJzaXN0ZW5jZSB3aXRoIHRoZSBpZDogXCIkeyBpZCB9XCJgKTtcblxuXHRcdGNvbnN0IHJlY29yZCA9IHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkuZmluZE9uZUJ5SWQoaWQpO1xuXG5cdFx0cmV0dXJuIHJlY29yZC5kYXRhO1xuXHR9XG5cblx0cmVhZEJ5QXNzb2NpYXRpb25zKGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHNlYXJjaGluZyBmb3IgcmVjb3JkcyB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIGZvbGxvd2luZzpgLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cblxuXHRyZW1vdmUoaWQsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyByZW1vdmluZyBvbmUgb2YgdGhlaXIgcmVjb3JkcyBieSB0aGUgaWQ6IFwiJHsgaWQgfVwiYCk7XG5cblx0XHRjb25zdCByZWNvcmQgPSB0aGlzLm9yY2guZ2V0UGVyc2lzdGVuY2VNb2RlbCgpLmZpbmRPbmVCeUlkKGlkKTtcblxuXHRcdGlmICghcmVjb3JkKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHRoaXMub3JjaC5nZXRQZXJzaXN0ZW5jZU1vZGVsKCkucmVtb3ZlKHsgX2lkOiBpZCB9KTtcblxuXHRcdHJldHVybiByZWNvcmQuZGF0YTtcblx0fVxuXG5cdHJlbW92ZUJ5QXNzb2NpYXRpb25zKGFzc29jaWF0aW9ucywgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHJlbW92aW5nIHJlY29yZHMgd2l0aCB0aGUgZm9sbG93aW5nIGFzc29jaWF0aW9uczpgLCBhc3NvY2lhdGlvbnMpO1xuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cblxuXHR1cGRhdGUoaWQsIGRhdGEsIHVwc2VydCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIHVwZGF0aW5nIHRoZSByZWNvcmQgXCIkeyBpZCB9XCIgdG86YCwgZGF0YSk7XG5cblx0XHRpZiAodHlwZW9mIGRhdGEgIT09ICdvYmplY3QnKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0F0dGVtcHRlZCB0byBzdG9yZSBhbiBpbnZhbGlkIGRhdGEgdHlwZSwgaXQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvb21UeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9yb29tcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSb29tQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjcmVhdGUocm9vbSwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNyZWF0aW5nIGEgbmV3IHJvb20uYCwgcm9vbSk7XG5cblx0XHRjb25zdCByY1Jvb20gPSB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgncm9vbXMnKS5jb252ZXJ0QXBwUm9vbShyb29tKTtcblx0XHRsZXQgbWV0aG9kO1xuXG5cdFx0c3dpdGNoIChyb29tLnR5cGUpIHtcblx0XHRcdGNhc2UgUm9vbVR5cGUuQ0hBTk5FTDpcblx0XHRcdFx0bWV0aG9kID0gJ2NyZWF0ZUNoYW5uZWwnO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgUm9vbVR5cGUuUFJJVkFURV9HUk9VUDpcblx0XHRcdFx0bWV0aG9kID0gJ2NyZWF0ZVByaXZhdGVHcm91cCc7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdPbmx5IGNoYW5uZWxzIGFuZCBwcml2YXRlIGdyb3VwcyBjYW4gYmUgY3JlYXRlZC4nKTtcblx0XHR9XG5cblx0XHRsZXQgcmlkO1xuXHRcdE1ldGVvci5ydW5Bc1VzZXIocm9vbS5jcmVhdG9yLmlkLCAoKSA9PiB7XG5cdFx0XHRjb25zdCBpbmZvID0gTWV0ZW9yLmNhbGwobWV0aG9kLCByY1Jvb20udXNlcm5hbWVzKTtcblx0XHRcdHJpZCA9IGluZm8ucmlkO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHJpZDtcblx0fVxuXG5cdGdldEJ5SWQocm9vbUlkLCBhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyB0aGUgcm9vbUJ5SWQ6IFwiJHsgcm9vbUlkIH1cImApO1xuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKHJvb21JZCk7XG5cdH1cblxuXHRnZXRCeU5hbWUocm9vbU5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSByb29tQnlOYW1lOiBcIiR7IHJvb21OYW1lIH1cImApO1xuXG5cdFx0cmV0dXJuIHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeU5hbWUocm9vbU5hbWUpO1xuXHR9XG5cblx0dXBkYXRlKHJvb20sIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyBhIHJvb20uYCk7XG5cblx0XHRpZiAoIXJvb20uaWQgfHwgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocm9vbS5pZCkpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcignQSByb29tIG11c3QgZXhpc3QgdG8gdXBkYXRlLicpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJtID0gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3Jvb21zJykuY29udmVydEFwcFJvb20ocm9vbSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy51cGRhdGUocm0uX2lkLCBybSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBTZXR0aW5nQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdFx0dGhpcy5hbGxvd2VkR3JvdXBzID0gW107XG5cdFx0dGhpcy5kaXNhbGxvd2VkU2V0dGluZ3MgPSBbXG5cdFx0XHQnQWNjb3VudHNfUmVnaXN0cmF0aW9uRm9ybV9TZWNyZXRVUkwnLCAnQ1JPV0RfQVBQX1VTRVJOQU1FJywgJ0NST1dEX0FQUF9QQVNTV09SRCcsICdEaXJlY3RfUmVwbHlfVXNlcm5hbWUnLFxuXHRcdFx0J0RpcmVjdF9SZXBseV9QYXNzd29yZCcsICdTTVRQX1VzZXJuYW1lJywgJ1NNVFBfUGFzc3dvcmQnLCAnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcsICdGaWxlVXBsb2FkX1MzX0FXU1NlY3JldEFjY2Vzc0tleScsXG5cdFx0XHQnRmlsZVVwbG9hZF9TM19CdWNrZXRVUkwnLCAnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcsICdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnLFxuXHRcdFx0J0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9TZWNyZXQnLCAnR29vZ2xlVmlzaW9uX1NlcnZpY2VBY2NvdW50JywgJ0FsbG93X0ludmFsaWRfU2VsZlNpZ25lZF9DZXJ0cycsICdHb29nbGVUYWdNYW5hZ2VyX2lkJyxcblx0XHRcdCdCdWdzbmFnX2FwaV9rZXknLCAnTERBUF9DQV9DZXJ0JywgJ0xEQVBfUmVqZWN0X1VuYXV0aG9yaXplZCcsICdMREFQX0RvbWFpbl9TZWFyY2hfVXNlcicsICdMREFQX0RvbWFpbl9TZWFyY2hfUGFzc3dvcmQnLFxuXHRcdFx0J0xpdmVjaGF0X3NlY3JldF90b2tlbicsICdMaXZlY2hhdF9Lbm93bGVkZ2VfQXBpYWlfS2V5JywgJ0F1dG9UcmFuc2xhdGVfR29vZ2xlQVBJS2V5JywgJ01hcFZpZXdfR01hcHNBUElLZXknLFxuXHRcdFx0J01ldGFfZmJfYXBwX2lkJywgJ01ldGFfZ29vZ2xlLXNpdGUtdmVyaWZpY2F0aW9uJywgJ01ldGFfbXN2YWxpZGF0ZTAxJywgJ0FjY291bnRzX09BdXRoX0RvbHBoaW5fc2VjcmV0Jyxcblx0XHRcdCdBY2NvdW50c19PQXV0aF9EcnVwYWxfc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX0ZhY2Vib29rX3NlY3JldCcsICdBY2NvdW50c19PQXV0aF9HaXRodWJfc2VjcmV0JywgJ0FQSV9HaXRIdWJfRW50ZXJwcmlzZV9VUkwnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX0dpdEh1Yl9FbnRlcnByaXNlX3NlY3JldCcsICdBUElfR2l0bGFiX1VSTCcsICdBY2NvdW50c19PQXV0aF9HaXRsYWJfc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX0dvb2dsZV9zZWNyZXQnLFxuXHRcdFx0J0FjY291bnRzX09BdXRoX0xpbmtlZGluX3NlY3JldCcsICdBY2NvdW50c19PQXV0aF9NZXRlb3Jfc2VjcmV0JywgJ0FjY291bnRzX09BdXRoX1R3aXR0ZXJfc2VjcmV0JywgJ0FQSV9Xb3JkcHJlc3NfVVJMJyxcblx0XHRcdCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2VjcmV0JywgJ1B1c2hfYXBuX3Bhc3NwaHJhc2UnLCAnUHVzaF9hcG5fa2V5JywgJ1B1c2hfYXBuX2NlcnQnLCAnUHVzaF9hcG5fZGV2X3Bhc3NwaHJhc2UnLFxuXHRcdFx0J1B1c2hfYXBuX2Rldl9rZXknLCAnUHVzaF9hcG5fZGV2X2NlcnQnLCAnUHVzaF9nY21fYXBpX2tleScsICdQdXNoX2djbV9wcm9qZWN0X251bWJlcicsICdTQU1MX0N1c3RvbV9EZWZhdWx0X2NlcnQnLFxuXHRcdFx0J1NBTUxfQ3VzdG9tX0RlZmF1bHRfcHJpdmF0ZV9rZXknLCAnU2xhY2tCcmlkZ2VfQVBJVG9rZW4nLCAnU21hcnNoX0VtYWlsJywgJ1NNU19Ud2lsaW9fQWNjb3VudF9TSUQnLCAnU01TX1R3aWxpb19hdXRoVG9rZW4nXG5cdFx0XTtcblx0fVxuXG5cdGdldEFsbChhcHBJZCkge1xuXHRcdGNvbnNvbGUubG9nKGBUaGUgQXBwICR7IGFwcElkIH0gaXMgZ2V0dGluZyBhbGwgdGhlIHNldHRpbmdzLmApO1xuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmQoeyBfaWQ6IHsgJG5pbjogdGhpcy5kaXNhbGxvd2VkU2V0dGluZ3MgfSB9KS5mZXRjaCgpLm1hcCgocykgPT4ge1xuXHRcdFx0dGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3NldHRpbmdzJykuY29udmVydFRvQXBwKHMpO1xuXHRcdH0pO1xuXHR9XG5cblx0Z2V0T25lQnlJZChpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHNldHRpbmcgYnkgaWQgJHsgaWQgfS5gKTtcblxuXHRcdGlmICghdGhpcy5pc1JlYWRhYmxlQnlJZChpZCwgYXBwSWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBzZXR0aW5nIFwiJHsgaWQgfVwiIGlzIG5vdCByZWFkYWJsZS5gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3NldHRpbmdzJykuY29udmVydEJ5SWQoaWQpO1xuXHR9XG5cblx0aGlkZUdyb3VwKG5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBoaWRkaW5nIHRoZSBncm91cCAkeyBuYW1lIH0uYCk7XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cblxuXHRoaWRlU2V0dGluZyhpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGhpZGRpbmcgdGhlIHNldHRpbmcgJHsgaWQgfS5gKTtcblxuXHRcdGlmICghdGhpcy5pc1JlYWRhYmxlQnlJZChpZCwgYXBwSWQpKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBzZXR0aW5nIFwiJHsgaWQgfVwiIGlzIG5vdCByZWFkYWJsZS5gKTtcblx0XHR9XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cblxuXHRpc1JlYWRhYmxlQnlJZChpZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGNoZWNraW5nIGlmIHRoZXkgY2FuIHJlYWQgdGhlIHNldHRpbmcgJHsgaWQgfS5gKTtcblxuXHRcdHJldHVybiAhdGhpcy5kaXNhbGxvd2VkU2V0dGluZ3MuaW5jbHVkZXMoaWQpO1xuXHR9XG5cblx0dXBkYXRlT25lKHNldHRpbmcsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyB1cGRhdGluZyB0aGUgc2V0dGluZyAkeyBzZXR0aW5nLmlkIH0gLmApO1xuXG5cdFx0aWYgKCF0aGlzLmlzUmVhZGFibGVCeUlkKHNldHRpbmcuaWQsIGFwcElkKSkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBUaGUgc2V0dGluZyBcIiR7IHNldHRpbmcuaWQgfVwiIGlzIG5vdCByZWFkYWJsZS5gKTtcblx0XHR9XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IoJ01ldGhvZCBub3QgaW1wbGVtZW50ZWQuJyk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBVc2VyQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRnZXRCeUlkKHVzZXJJZCwgYXBwSWQpIHtcblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBhcHBJZCB9IGlzIGdldHRpbmcgdGhlIHVzZXJJZDogXCIkeyB1c2VySWQgfVwiYCk7XG5cblx0XHRyZXR1cm4gdGhpcy5vcmNoLmdldENvbnZlcnRlcnMoKS5nZXQoJ3VzZXJzJykuY29udmVydEJ5SWQodXNlcklkKTtcblx0fVxuXG5cdGdldEJ5VXNlcm5hbWUodXNlcm5hbWUsIGFwcElkKSB7XG5cdFx0Y29uc29sZS5sb2coYFRoZSBBcHAgJHsgYXBwSWQgfSBpcyBnZXR0aW5nIHRoZSB1c2VybmFtZTogXCIkeyB1c2VybmFtZSB9XCJgKTtcblxuXHRcdHJldHVybiB0aGlzLm9yY2guZ2V0Q29udmVydGVycygpLmdldCgndXNlcnMnKS5jb252ZXJ0QnlVc2VybmFtZSh1c2VybmFtZSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJlYWxBcHBCcmlkZ2VzIH0gZnJvbSAnLi9icmlkZ2VzJztcbmltcG9ydCB7IEFwcEFjdGl2YXRpb25CcmlkZ2UgfSBmcm9tICcuL2FjdGl2YXRpb24nO1xuaW1wb3J0IHsgQXBwQ29tbWFuZHNCcmlkZ2UgfSBmcm9tICcuL2NvbW1hbmRzJztcbmltcG9ydCB7IEFwcEVudmlyb25tZW50YWxWYXJpYWJsZUJyaWRnZSB9IGZyb20gJy4vZW52aXJvbm1lbnRhbCc7XG5pbXBvcnQgeyBBcHBIdHRwQnJpZGdlIH0gZnJvbSAnLi9odHRwJztcbmltcG9ydCB7IEFwcE1lc3NhZ2VCcmlkZ2UgfSBmcm9tICcuL21lc3NhZ2VzJztcbmltcG9ydCB7IEFwcFBlcnNpc3RlbmNlQnJpZGdlIH0gZnJvbSAnLi9wZXJzaXN0ZW5jZSc7XG5pbXBvcnQgeyBBcHBSb29tQnJpZGdlIH0gZnJvbSAnLi9yb29tcyc7XG5pbXBvcnQgeyBBcHBTZXR0aW5nQnJpZGdlIH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5pbXBvcnQgeyBBcHBVc2VyQnJpZGdlIH0gZnJvbSAnLi91c2Vycyc7XG5cbmV4cG9ydCB7XG5cdFJlYWxBcHBCcmlkZ2VzLFxuXHRBcHBBY3RpdmF0aW9uQnJpZGdlLFxuXHRBcHBDb21tYW5kc0JyaWRnZSxcblx0QXBwRW52aXJvbm1lbnRhbFZhcmlhYmxlQnJpZGdlLFxuXHRBcHBIdHRwQnJpZGdlLFxuXHRBcHBNZXNzYWdlQnJpZGdlLFxuXHRBcHBQZXJzaXN0ZW5jZUJyaWRnZSxcblx0QXBwUm9vbUJyaWRnZSxcblx0QXBwU2V0dGluZ0JyaWRnZSxcblx0QXBwVXNlckJyaWRnZVxufTtcbiIsImV4cG9ydCBjbGFzcyBBcHBEZXRhaWxDaGFuZ2VzQnJpZGdlIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRvbkFwcFNldHRpbmdzQ2hhbmdlKGFwcElkLCBzZXR0aW5nKSB7XG5cdFx0dHJ5IHtcblx0XHRcdHRoaXMub3JjaC5nZXROb3RpZmllcigpLmFwcFNldHRpbmdzQ2hhbmdlKGFwcElkLCBzZXR0aW5nKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oJ2ZhaWxlZCB0byBub3RpZnkgYWJvdXQgdGhlIHNldHRpbmcgY2hhbmdlLicsIGFwcElkKTtcblx0XHR9XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBIdHRwQnJpZGdlIHtcblx0Y2FsbChpbmZvKSB7XG5cdFx0aWYgKCFpbmZvLnJlcXVlc3QuY29udGVudCAmJiB0eXBlb2YgaW5mby5yZXF1ZXN0LmRhdGEgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRpbmZvLnJlcXVlc3QuY29udGVudCA9IEpTT04uc3RyaW5naWZ5KGluZm8ucmVxdWVzdC5kYXRhKTtcblx0XHR9XG5cblx0XHRjb25zb2xlLmxvZyhgVGhlIEFwcCAkeyBpbmZvLmFwcElkIH0gaXMgcmVxdWVzdGluZyBmcm9tIHRoZSBvdXR0ZXIgd2ViczpgLCBpbmZvKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRyZXR1cm4gSFRUUC5jYWxsKGluZm8ubWV0aG9kLCBpbmZvLnVybCwgaW5mby5yZXF1ZXN0KTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRyZXR1cm4gZS5yZXNwb25zZTtcblx0XHR9XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBNZXRob2RzIHtcblx0Y29uc3RydWN0b3IobWFuYWdlcikge1xuXHRcdHRoaXMuX21hbmFnZXIgPSBtYW5hZ2VyO1xuXG5cdFx0dGhpcy5fYWRkTWV0aG9kcygpO1xuXHR9XG5cblx0X2FkZE1ldGhvZHMoKSB7XG5cdFx0Y29uc3QgbWFuYWdlciA9IHRoaXMuX21hbmFnZXI7XG5cblx0XHRNZXRlb3IubWV0aG9kcyh7XG5cdFx0XHQnYXBwcy9pcy1lbmFibGVkJygpIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBtYW5hZ2VyICE9PSAndW5kZWZpbmVkJztcblx0XHRcdH0sXG5cblx0XHRcdCdhcHBzL2lzLWxvYWRlZCcoKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgbWFuYWdlciAhPT0gJ3VuZGVmaW5lZCcgfHwgbWFuYWdlci5hcmVBcHBzTG9hZGVkKCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn1cbiIsImV4cG9ydCBjbGFzcyBBcHBzUmVzdEFwaSB7XG5cdGNvbnN0cnVjdG9yKG9yY2gsIG1hbmFnZXIpIHtcblx0XHR0aGlzLl9vcmNoID0gb3JjaDtcblx0XHR0aGlzLl9tYW5hZ2VyID0gbWFuYWdlcjtcblx0XHR0aGlzLmFwaSA9IG5ldyBSb2NrZXRDaGF0LkFQSS5BcGlDbGFzcyh7XG5cdFx0XHR2ZXJzaW9uOiAnYXBwcycsXG5cdFx0XHR1c2VEZWZhdWx0QXV0aDogdHJ1ZSxcblx0XHRcdHByZXR0eUpzb246IGZhbHNlLFxuXHRcdFx0ZW5hYmxlQ29yczogZmFsc2UsXG5cdFx0XHRhdXRoOiBSb2NrZXRDaGF0LkFQSS5nZXRVc2VyQXV0aCgpXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZE1hbmFnZW1lbnRSb3V0ZXMoKTtcblx0fVxuXG5cdF9oYW5kbGVGaWxlKHJlcXVlc3QsIGZpbGVGaWVsZCkge1xuXHRcdGNvbnN0IEJ1c2JveSA9IE5wbS5yZXF1aXJlKCdidXNib3knKTtcblx0XHRjb25zdCBidXNib3kgPSBuZXcgQnVzYm95KHsgaGVhZGVyczogcmVxdWVzdC5oZWFkZXJzIH0pO1xuXG5cdFx0cmV0dXJuIE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRidXNib3kub24oJ2ZpbGUnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChmaWVsZG5hbWUsIGZpbGUpID0+IHtcblx0XHRcdFx0aWYgKGZpZWxkbmFtZSAhPT0gZmlsZUZpZWxkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmllbGQnLCBgRXhwZWN0ZWQgdGhlIGZpZWxkIFwiJHsgZmlsZUZpZWxkIH1cIiBidXQgZ290IFwiJHsgZmllbGRuYW1lIH1cIiBpbnN0ZWFkLmApKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IGZpbGVEYXRhID0gW107XG5cdFx0XHRcdGZpbGUub24oJ2RhdGEnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChkYXRhKSA9PiB7XG5cdFx0XHRcdFx0ZmlsZURhdGEucHVzaChkYXRhKTtcblx0XHRcdFx0fSkpO1xuXG5cdFx0XHRcdGZpbGUub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT4gY2FsbGJhY2sodW5kZWZpbmVkLCBCdWZmZXIuY29uY2F0KGZpbGVEYXRhKSkpKTtcblx0XHRcdH0pKTtcblxuXHRcdFx0cmVxdWVzdC5waXBlKGJ1c2JveSk7XG5cdFx0fSkoKTtcblx0fVxuXG5cdGFkZE1hbmFnZW1lbnRSb3V0ZXMoKSB7XG5cdFx0Y29uc3Qgb3JjaGVzdHJhdG9yID0gdGhpcy5fb3JjaDtcblx0XHRjb25zdCBtYW5hZ2VyID0gdGhpcy5fbWFuYWdlcjtcblx0XHRjb25zdCBmaWxlSGFuZGxlciA9IHRoaXMuX2hhbmRsZUZpbGU7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zdCBhcHBzID0gbWFuYWdlci5nZXQoKS5tYXAocHJsID0+IHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLmxhbmd1YWdlcyA9IHBybC5nZXRTdG9yYWdlSXRlbSgpLmxhbmd1YWdlQ29udGVudDtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBpbmZvO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGFwcHMgfSk7XG5cdFx0XHR9LFxuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0bGV0IGJ1ZmY7XG5cblx0XHRcdFx0aWYgKHRoaXMuYm9keVBhcmFtcy51cmwpIHtcblx0XHRcdFx0XHRjb25zdCByZXN1bHQgPSBIVFRQLmNhbGwoJ0dFVCcsIHRoaXMuYm9keVBhcmFtcy51cmwsIHsgbnBtUmVxdWVzdE9wdGlvbnM6IHsgZW5jb2Rpbmc6ICdiYXNlNjQnIH19KTtcblxuXHRcdFx0XHRcdGlmIChyZXN1bHQuc3RhdHVzQ29kZSAhPT0gMjAwIHx8ICFyZXN1bHQuaGVhZGVyc1snY29udGVudC10eXBlJ10gfHwgcmVzdWx0LmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddICE9PSAnYXBwbGljYXRpb24vemlwJykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoeyBlcnJvcjogJ0ludmFsaWQgdXJsLiBJdCBkb2VzblxcJ3QgZXhpc3Qgb3IgaXMgbm90IFwiYXBwbGljYXRpb24vemlwXCIuJyB9KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRidWZmID0gQnVmZmVyLmZyb20ocmVzdWx0LmNvbnRlbnQsICdiYXNlNjQnKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRidWZmID0gZmlsZUhhbmRsZXIodGhpcy5yZXF1ZXN0LCAnYXBwJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIWJ1ZmYpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSh7IGVycm9yOiAnRmFpbGVkIHRvIGdldCBhIGZpbGUgdG8gaW5zdGFsbCBmb3IgdGhlIEFwcC4gJ30pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc3QgaXRlbSA9IE1ldGVvci53cmFwQXN5bmMoKGNhbGxiYWNrKSA9PiB7XG5cdFx0XHRcdFx0bWFuYWdlci5hZGQoYnVmZi50b1N0cmluZygnYmFzZTY0JyksIGZhbHNlKS50aGVuKChybCkgPT4gY2FsbGJhY2sodW5kZWZpbmVkLCBybCkpLmNhdGNoKChlKSA9PiB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ0Vycm9yIScsIGUpO1xuXHRcdFx0XHRcdFx0Y2FsbGJhY2soZSk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pKCk7XG5cblx0XHRcdFx0Y29uc3QgaW5mbyA9IGl0ZW0uZ2V0SW5mbygpO1xuXHRcdFx0XHRpbmZvLnN0YXR1cyA9IGl0ZW0uZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHA6IGluZm8gfSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnbGFuZ3VhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc3QgYXBwcyA9IG1hbmFnZXIuZ2V0KCkubWFwKHBybCA9PiB7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGlkOiBwcmwuZ2V0SUQoKSxcblx0XHRcdFx0XHRcdGxhbmd1YWdlczogcHJsLmdldFN0b3JhZ2VJdGVtKCkubGFuZ3VhZ2VDb250ZW50XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHBzIH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZCcsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ0dldHRpbmc6JywgdGhpcy51cmxQYXJhbXMuaWQpO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBpbmZvID0gcHJsLmdldEluZm8oKTtcblx0XHRcdFx0XHRpbmZvLnN0YXR1cyA9IHBybC5nZXRTdGF0dXMoKTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgYXBwOiBpbmZvIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0cG9zdCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1VwZGF0aW5nOicsIHRoaXMudXJsUGFyYW1zLmlkKTtcblx0XHRcdFx0Ly8gVE9ETzogVmVyaWZ5IHBlcm1pc3Npb25zXG5cblx0XHRcdFx0Y29uc3QgYnVmZiA9IGZpbGVIYW5kbGVyKHRoaXMucmVxdWVzdCwgJ2FwcCcpO1xuXHRcdFx0XHRjb25zdCBpdGVtID0gTWV0ZW9yLndyYXBBc3luYygoY2FsbGJhY2spID0+IHtcblx0XHRcdFx0XHRtYW5hZ2VyLnVwZGF0ZShidWZmLnRvU3RyaW5nKCdiYXNlNjQnKSkudGhlbigocmwpID0+IGNhbGxiYWNrKHJsKSkuY2F0Y2goKGUpID0+IGNhbGxiYWNrKGUpKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc3QgaW5mbyA9IGl0ZW0uZ2V0SW5mbygpO1xuXHRcdFx0XHRpbmZvLnN0YXR1cyA9IGl0ZW0uZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBhcHA6IGluZm8gfSk7XG5cdFx0XHR9LFxuXHRcdFx0ZGVsZXRlKCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnVW5pbnN0YWxsaW5nOicsIHRoaXMudXJsUGFyYW1zLmlkKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0UHJvbWlzZS5hd2FpdChtYW5hZ2VyLnJlbW92ZShwcmwuZ2V0SUQoKSkpO1xuXG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IHBybC5nZXRJbmZvKCk7XG5cdFx0XHRcdFx0aW5mby5zdGF0dXMgPSBwcmwuZ2V0U3RhdHVzKCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGFwcDogaW5mbyB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZC9pY29uJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnR2V0dGluZyB0aGUgQXBwXFwncyBJY29uOicsIHRoaXMudXJsUGFyYW1zLmlkKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgaW5mbyA9IHBybC5nZXRJbmZvKCk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IGljb25GaWxlQ29udGVudDogaW5mby5pY29uRmlsZUNvbnRlbnQgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHRoaXMuYXBpLmFkZFJvdXRlKCc6aWQvbGFuZ3VhZ2VzJywgeyBhdXRoUmVxdWlyZWQ6IGZhbHNlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEdldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIGxhbmd1YWdlcy4uYCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdGNvbnN0IGxhbmd1YWdlcyA9IHBybC5nZXRTdG9yYWdlSXRlbSgpLmxhbmd1YWdlQ29udGVudCB8fCB7fTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgbGFuZ3VhZ2VzIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL2xvZ3MnLCB7IGF1dGhSZXF1aXJlZDogdHJ1ZSB9LCB7XG5cdFx0XHRnZXQoKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGBHZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBsb2dzLi5gKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgeyBvZmZzZXQsIGNvdW50IH0gPSB0aGlzLmdldFBhZ2luYXRpb25JdGVtcygpO1xuXHRcdFx0XHRcdGNvbnN0IHsgc29ydCwgZmllbGRzLCBxdWVyeSB9ID0gdGhpcy5wYXJzZUpzb25RdWVyeSgpO1xuXG5cdFx0XHRcdFx0Y29uc3Qgb3VyUXVlcnkgPSBPYmplY3QuYXNzaWduKHt9LCBxdWVyeSwgeyBhcHBJZDogcHJsLmdldElEKCkgfSk7XG5cdFx0XHRcdFx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRcdFx0XHRcdHNvcnQ6IHNvcnQgPyBzb3J0IDogeyBfdXBkYXRlZEF0OiAtMSB9LFxuXHRcdFx0XHRcdFx0c2tpcDogb2Zmc2V0LFxuXHRcdFx0XHRcdFx0bGltaXQ6IGNvdW50LFxuXHRcdFx0XHRcdFx0ZmllbGRzXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdGNvbnN0IGxvZ3MgPSBQcm9taXNlLmF3YWl0KG9yY2hlc3RyYXRvci5nZXRMb2dTdG9yYWdlKCkuZmluZChvdXJRdWVyeSwgb3B0aW9ucykpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBsb2dzIH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gQXBwIGZvdW5kIGJ5IHRoZSBpZCBvZjogJHsgdGhpcy51cmxQYXJhbXMuaWQgfWApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL3NldHRpbmdzJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc2V0dGluZ3MuLmApO1xuXHRcdFx0XHRjb25zdCBwcmwgPSBtYW5hZ2VyLmdldE9uZUJ5SWQodGhpcy51cmxQYXJhbXMuaWQpO1xuXG5cdFx0XHRcdGlmIChwcmwpIHtcblx0XHRcdFx0XHRjb25zdCBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIHBybC5nZXRTdG9yYWdlSXRlbSgpLnNldHRpbmdzKTtcblxuXHRcdFx0XHRcdE9iamVjdC5rZXlzKHNldHRpbmdzKS5mb3JFYWNoKChrKSA9PiB7XG5cdFx0XHRcdFx0XHRpZiAoc2V0dGluZ3Nba10uaGlkZGVuKSB7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBzZXR0aW5nc1trXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgc2V0dGluZ3MgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgVXBkYXRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHNldHRpbmdzLi5gKTtcblx0XHRcdFx0aWYgKCF0aGlzLmJvZHlQYXJhbXMgfHwgIXRoaXMuYm9keVBhcmFtcy5zZXR0aW5ncykge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKCdUaGUgc2V0dGluZ3MgdG8gdXBkYXRlIG11c3QgYmUgcHJlc2VudC4nKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKCFwcmwpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnN0IHNldHRpbmdzID0gcHJsLmdldFN0b3JhZ2VJdGVtKCkuc2V0dGluZ3M7XG5cblx0XHRcdFx0Y29uc3QgdXBkYXRlZCA9IFtdO1xuXHRcdFx0XHR0aGlzLmJvZHlQYXJhbXMuc2V0dGluZ3MuZm9yRWFjaCgocykgPT4ge1xuXHRcdFx0XHRcdGlmIChzZXR0aW5nc1tzLmlkXSkge1xuXHRcdFx0XHRcdFx0UHJvbWlzZS5hd2FpdChtYW5hZ2VyLmdldFNldHRpbmdzTWFuYWdlcigpLnVwZGF0ZUFwcFNldHRpbmcodGhpcy51cmxQYXJhbXMuaWQsIHMpKTtcblx0XHRcdFx0XHRcdC8vIFVwZGF0aW5nP1xuXHRcdFx0XHRcdFx0dXBkYXRlZC5wdXNoKHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyB1cGRhdGVkIH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5hcGkuYWRkUm91dGUoJzppZC9zZXR0aW5ncy86c2V0dGluZ0lkJywgeyBhdXRoUmVxdWlyZWQ6IHRydWUgfSwge1xuXHRcdFx0Z2V0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgR2V0dGluZyB0aGUgQXBwICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzZXR0aW5nICR7IHRoaXMudXJsUGFyYW1zLnNldHRpbmdJZCB9YCk7XG5cblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRjb25zdCBzZXR0aW5nID0gbWFuYWdlci5nZXRTZXR0aW5nc01hbmFnZXIoKS5nZXRBcHBTZXR0aW5nKHRoaXMudXJsUGFyYW1zLmlkLCB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQpO1xuXG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5BUEkudjEuc3VjY2Vzcyh7IHNldHRpbmcgfSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdObyBzZXR0aW5nIGZvdW5kJykpIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5ub3RGb3VuZChgTm8gU2V0dGluZyBmb3VuZCBvbiB0aGUgQXBwIGJ5IHRoZSBpZCBvZjogXCIkeyB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQgfVwiYCk7XG5cdFx0XHRcdFx0fSBlbHNlIGlmIChlLm1lc3NhZ2UuaW5jbHVkZXMoJ05vIEFwcCBmb3VuZCcpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoZS5tZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgVXBkYXRpbmcgdGhlIEFwcCAkeyB0aGlzLnVybFBhcmFtcy5pZCB9J3Mgc2V0dGluZyAkeyB0aGlzLnVybFBhcmFtcy5zZXR0aW5nSWQgfWApO1xuXG5cdFx0XHRcdGlmICghdGhpcy5ib2R5UGFyYW1zLnNldHRpbmcpIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuZmFpbHVyZSgnU2V0dGluZyB0byB1cGRhdGUgdG8gbXVzdCBiZSBwcmVzZW50IG9uIHRoZSBwb3N0ZWQgYm9keS4nKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0UHJvbWlzZS5hd2FpdChtYW5hZ2VyLmdldFNldHRpbmdzTWFuYWdlcigpLnVwZGF0ZUFwcFNldHRpbmcodGhpcy51cmxQYXJhbXMuaWQsIHRoaXMuYm9keVBhcmFtcy5zZXR0aW5nKSk7XG5cblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEuc3VjY2VzcygpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0aWYgKGUubWVzc2FnZS5pbmNsdWRlcygnTm8gc2V0dGluZyBmb3VuZCcpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIFNldHRpbmcgZm91bmQgb24gdGhlIEFwcCBieSB0aGUgaWQgb2Y6IFwiJHsgdGhpcy51cmxQYXJhbXMuc2V0dGluZ0lkIH1cImApO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoZS5tZXNzYWdlLmluY2x1ZGVzKCdObyBBcHAgZm91bmQnKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5mYWlsdXJlKGUubWVzc2FnZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmFwaS5hZGRSb3V0ZSgnOmlkL3N0YXR1cycsIHsgYXV0aFJlcXVpcmVkOiB0cnVlIH0sIHtcblx0XHRcdGdldCgpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEdldHRpbmcgJHsgdGhpcy51cmxQYXJhbXMuaWQgfSdzIHN0YXR1cy4uYCk7XG5cdFx0XHRcdGNvbnN0IHBybCA9IG1hbmFnZXIuZ2V0T25lQnlJZCh0aGlzLnVybFBhcmFtcy5pZCk7XG5cblx0XHRcdFx0aWYgKHBybCkge1xuXHRcdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFQSS52MS5zdWNjZXNzKHsgc3RhdHVzOiBwcmwuZ2V0U3RhdHVzKCkgfSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLm5vdEZvdW5kKGBObyBBcHAgZm91bmQgYnkgdGhlIGlkIG9mOiAkeyB0aGlzLnVybFBhcmFtcy5pZCB9YCk7XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRwb3N0KCkge1xuXHRcdFx0XHRpZiAoIXRoaXMuYm9keVBhcmFtcy5zdGF0dXMgfHwgdHlwZW9mIHRoaXMuYm9keVBhcmFtcy5zdGF0dXMgIT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLmZhaWx1cmUoJ0ludmFsaWQgc3RhdHVzIHByb3ZpZGVkLCBpdCBtdXN0IGJlIFwic3RhdHVzXCIgZmllbGQgYW5kIGEgc3RyaW5nLicpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5sb2coYFVwZGF0aW5nICR7IHRoaXMudXJsUGFyYW1zLmlkIH0ncyBzdGF0dXMuLi5gLCB0aGlzLmJvZHlQYXJhbXMuc3RhdHVzKTtcblx0XHRcdFx0Y29uc3QgcHJsID0gbWFuYWdlci5nZXRPbmVCeUlkKHRoaXMudXJsUGFyYW1zLmlkKTtcblxuXHRcdFx0XHRpZiAocHJsKSB7XG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gUHJvbWlzZS5hd2FpdChtYW5hZ2VyLmNoYW5nZVN0YXR1cyhwcmwuZ2V0SUQoKSwgdGhpcy5ib2R5UGFyYW1zLnN0YXR1cykpO1xuXG5cdFx0XHRcdFx0cmV0dXJuIFJvY2tldENoYXQuQVBJLnYxLnN1Y2Nlc3MoeyBzdGF0dXM6IHJlc3VsdC5nZXRTdGF0dXMoKSB9KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5BUEkudjEubm90Rm91bmQoYE5vIEFwcCBmb3VuZCBieSB0aGUgaWQgb2Y6ICR7IHRoaXMudXJsUGFyYW1zLmlkIH1gKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBTdGF0dXMsIEFwcFN0YXR1c1V0aWxzIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9BcHBTdGF0dXMnO1xuXG5leHBvcnQgY29uc3QgQXBwRXZlbnRzID0gT2JqZWN0LmZyZWV6ZSh7XG5cdEFQUF9BRERFRDogJ2FwcC9hZGRlZCcsXG5cdEFQUF9SRU1PVkVEOiAnYXBwL3JlbW92ZWQnLFxuXHRBUFBfVVBEQVRFRDogJ2FwcC91cGRhdGVkJyxcblx0QVBQX1NUQVRVU19DSEFOR0U6ICdhcHAvc3RhdHVzVXBkYXRlJyxcblx0QVBQX1NFVFRJTkdfVVBEQVRFRDogJ2FwcC9zZXR0aW5nVXBkYXRlZCcsXG5cdENPTU1BTkRfQURERUQ6ICdjb21tYW5kL2FkZGVkJyxcblx0Q09NTUFORF9ESVNBQkxFRDogJ2NvbW1hbmQvZGlzYWJsZWQnLFxuXHRDT01NQU5EX1VQREFURUQ6ICdjb21tYW5kL3VwZGF0ZWQnLFxuXHRDT01NQU5EX1JFTU9WRUQ6ICdjb21tYW5kL3JlbW92ZWQnXG59KTtcblxuZXhwb3J0IGNsYXNzIEFwcFNlcnZlckxpc3RlbmVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCwgZW5naW5lU3RyZWFtZXIsIGNsaWVudFN0cmVhbWVyLCByZWNpZXZlZCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lciA9IGVuZ2luZVN0cmVhbWVyO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIgPSBjbGllbnRTdHJlYW1lcjtcblx0XHR0aGlzLnJlY2lldmVkID0gcmVjaWV2ZWQ7XG5cblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5BUFBfQURERUQsIHRoaXMub25BcHBBZGRlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgdGhpcy5vbkFwcFN0YXR1c1VwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgdGhpcy5vbkFwcFNldHRpbmdVcGRhdGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkFQUF9SRU1PVkVELCB0aGlzLm9uQXBwUmVtb3ZlZC5iaW5kKHRoaXMpKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLm9uKEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCB0aGlzLm9uQ29tbWFuZEFkZGVkLmJpbmQodGhpcykpO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIub24oQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIHRoaXMub25Db21tYW5kRGlzYWJsZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCB0aGlzLm9uQ29tbWFuZFVwZGF0ZWQuYmluZCh0aGlzKSk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5vbihBcHBFdmVudHMuQ09NTUFORF9SRU1PVkVELCB0aGlzLm9uQ29tbWFuZFJlbW92ZWQuYmluZCh0aGlzKSk7XG5cdH1cblxuXHRvbkFwcEFkZGVkKGFwcElkKSB7XG5cdFx0dGhpcy5vcmNoLmdldE1hbmFnZXIoKS5sb2FkT25lKGFwcElkKS50aGVuKCgpID0+IHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX0FEREVELCBhcHBJZCkpO1xuXHR9XG5cblx0b25BcHBTdGF0dXNVcGRhdGVkKHsgYXBwSWQsIHN0YXR1cyB9KSB7XG5cdFx0dGhpcy5yZWNpZXZlZC5zZXQoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gLCB7IGFwcElkLCBzdGF0dXMsIHdoZW46IG5ldyBEYXRlKCkgfSk7XG5cblx0XHRpZiAoQXBwU3RhdHVzVXRpbHMuaXNFbmFibGVkKHN0YXR1cykpIHtcblx0XHRcdHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkuZW5hYmxlKGFwcElkKVxuXHRcdFx0XHQudGhlbigoKSA9PiB0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB7IGFwcElkLCBzdGF0dXMgfSkpO1xuXHRcdH0gZWxzZSBpZiAoQXBwU3RhdHVzVXRpbHMuaXNEaXNhYmxlZChzdGF0dXMpKSB7XG5cdFx0XHR0aGlzLm9yY2guZ2V0TWFuYWdlcigpLmRpc2FibGUoYXBwSWQsIEFwcFN0YXR1cy5NQU5VQUxMWV9ESVNBQkxFRCA9PT0gc3RhdHVzKVxuXHRcdFx0XHQudGhlbigoKSA9PiB0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFLCB7IGFwcElkLCBzdGF0dXMgfSkpO1xuXHRcdH1cblx0fVxuXG5cdG9uQXBwU2V0dGluZ1VwZGF0ZWQoeyBhcHBJZCwgc2V0dGluZyB9KSB7XG5cdFx0dGhpcy5yZWNpZXZlZC5zZXQoYCR7IEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVEIH1fJHsgYXBwSWQgfV8keyBzZXR0aW5nLmlkIH1gLCB7IGFwcElkLCBzZXR0aW5nLCB3aGVuOiBuZXcgRGF0ZSgpIH0pO1xuXG5cdFx0dGhpcy5vcmNoLmdldE1hbmFnZXIoKS5nZXRTZXR0aW5nc01hbmFnZXIoKS51cGRhdGVBcHBTZXR0aW5nKGFwcElkLCBzZXR0aW5nKVxuXHRcdFx0LnRoZW4oKCkgPT4gdGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkIH0pKTtcblx0fVxuXG5cdG9uQXBwUmVtb3ZlZChhcHBJZCkge1xuXHRcdHRoaXMub3JjaC5nZXRNYW5hZ2VyKCkucmVtb3ZlKGFwcElkKS50aGVuKCgpID0+IHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1JFTU9WRUQsIGFwcElkKSk7XG5cdH1cblxuXHRvbkNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0fVxuXG5cdG9uQ29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0b25Db21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0b25Db21tYW5kUmVtb3ZlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBTZXJ2ZXJOb3RpZmllciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyID0gbmV3IE1ldGVvci5TdHJlYW1lcignYXBwcy1lbmdpbmUnLCB7IHJldHJhbnNtaXQ6IGZhbHNlIH0pO1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuc2VydmVyT25seSA9IHRydWU7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1JlYWQoJ25vbmUnKTtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHQvLyBUaGlzIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHRvIHRoZSB3ZWIgY2xpZW50c1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIgPSBuZXcgTWV0ZW9yLlN0cmVhbWVyKCdhcHBzJywgeyByZXRyYW5zbWl0OiBmYWxzZSB9KTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLnNlcnZlck9ubHkgPSB0cnVlO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuYWxsb3dSZWFkKCdhbGwnKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmFsbG93RW1pdCgnYWxsJyk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5hbGxvd1dyaXRlKCdub25lJyk7XG5cblx0XHR0aGlzLnJlY2lldmVkID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMubGlzdGVuZXIgPSBuZXcgQXBwU2VydmVyTGlzdGVuZXIob3JjaCwgdGhpcy5lbmdpbmVTdHJlYW1lciwgdGhpcy5jbGllbnRTdHJlYW1lciwgdGhpcy5yZWNpZXZlZCk7XG5cdH1cblxuXHRhcHBBZGRlZChhcHBJZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX0FEREVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfQURERUQsIGFwcElkKTtcblx0fVxuXG5cdGFwcFJlbW92ZWQoYXBwSWQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9SRU1PVkVELCBhcHBJZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfUkVNT1ZFRCwgYXBwSWQpO1xuXHR9XG5cblx0YXBwVXBkYXRlZChhcHBJZCkge1xuXHRcdHRoaXMuZW5naW5lU3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1VQREFURUQsIGFwcElkKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkFQUF9VUERBVEVELCBhcHBJZCk7XG5cdH1cblxuXHRhcHBTdGF0dXNVcGRhdGVkKGFwcElkLCBzdGF0dXMpIHtcblx0XHRpZiAodGhpcy5yZWNpZXZlZC5oYXMoYCR7IEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSB9XyR7IGFwcElkIH1gKSkge1xuXHRcdFx0Y29uc3QgZGV0YWlscyA9IHRoaXMucmVjaWV2ZWQuZ2V0KGAkeyBBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UgfV8keyBhcHBJZCB9YCk7XG5cdFx0XHRpZiAoZGV0YWlscy5zdGF0dXMgPT09IHN0YXR1cykge1xuXHRcdFx0XHR0aGlzLnJlY2lldmVkLmRlbGV0ZShgJHsgQXBwRXZlbnRzLkFQUF9TVEFUVVNfQ0hBTkdFIH1fJHsgYXBwSWQgfWApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU1RBVFVTX0NIQU5HRSwgeyBhcHBJZCwgc3RhdHVzIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NUQVRVU19DSEFOR0UsIHsgYXBwSWQsIHN0YXR1cyB9KTtcblx0fVxuXG5cdGFwcFNldHRpbmdzQ2hhbmdlKGFwcElkLCBzZXR0aW5nKSB7XG5cdFx0aWYgKHRoaXMucmVjaWV2ZWQuaGFzKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCkpIHtcblx0XHRcdHRoaXMucmVjaWV2ZWQuZGVsZXRlKGAkeyBBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCB9XyR7IGFwcElkIH1fJHsgc2V0dGluZy5pZCB9YCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5BUFBfU0VUVElOR19VUERBVEVELCB7IGFwcElkLCBzZXR0aW5nIH0pO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQVBQX1NFVFRJTkdfVVBEQVRFRCwgeyBhcHBJZCB9KTtcblx0fVxuXG5cdGNvbW1hbmRBZGRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX0FEREVELCBjb21tYW5kKTtcblx0XHR0aGlzLmNsaWVudFN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfQURERUQsIGNvbW1hbmQpO1xuXHR9XG5cblx0Y29tbWFuZERpc2FibGVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfRElTQUJMRUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9ESVNBQkxFRCwgY29tbWFuZCk7XG5cdH1cblxuXHRjb21tYW5kVXBkYXRlZChjb21tYW5kKSB7XG5cdFx0dGhpcy5lbmdpbmVTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1VQREFURUQsIGNvbW1hbmQpO1xuXHRcdHRoaXMuY2xpZW50U3RyZWFtZXIuZW1pdChBcHBFdmVudHMuQ09NTUFORF9VUERBVEVELCBjb21tYW5kKTtcblx0fVxuXG5cdGNvbW1hbmRSZW1vdmVkKGNvbW1hbmQpIHtcblx0XHR0aGlzLmVuZ2luZVN0cmVhbWVyLmVtaXQoQXBwRXZlbnRzLkNPTU1BTkRfUkVNT1ZFRCwgY29tbWFuZCk7XG5cdFx0dGhpcy5jbGllbnRTdHJlYW1lci5lbWl0KEFwcEV2ZW50cy5DT01NQU5EX1JFTU9WRUQsIGNvbW1hbmQpO1xuXHR9XG59XG4iLCJpbXBvcnQgeyBBcHBNZXRob2RzfSBmcm9tICcuL21ldGhvZHMnO1xuaW1wb3J0IHsgQXBwc1Jlc3RBcGkgfSBmcm9tICcuL3Jlc3QnO1xuaW1wb3J0IHsgQXBwRXZlbnRzLCBBcHBTZXJ2ZXJOb3RpZmllciwgQXBwU2VydmVyTGlzdGVuZXIgfSBmcm9tICcuL3dlYnNvY2tldHMnO1xuXG5leHBvcnQge1xuXHRBcHBNZXRob2RzLFxuXHRBcHBzUmVzdEFwaSxcblx0QXBwRXZlbnRzLFxuXHRBcHBTZXJ2ZXJOb3RpZmllcixcblx0QXBwU2VydmVyTGlzdGVuZXJcbn07XG4iLCJleHBvcnQgY2xhc3MgQXBwTWVzc2FnZXNDb252ZXJ0ZXIge1xuXHRjb25zdHJ1Y3RvcihvcmNoKSB7XG5cdFx0dGhpcy5vcmNoID0gb3JjaDtcblx0fVxuXG5cdGNvbnZlcnRCeUlkKG1zZ0lkKSB7XG5cdFx0Y29uc3QgbXNnID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZ2V0T25lQnlJZChtc2dJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5jb252ZXJ0TWVzc2FnZShtc2cpO1xuXHR9XG5cblx0Y29udmVydE1lc3NhZ2UobXNnT2JqKSB7XG5cdFx0aWYgKCFtc2dPYmopIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9vbSA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCdyb29tcycpLmNvbnZlcnRCeUlkKG1zZ09iai5yaWQpO1xuXHRcdGNvbnN0IHNlbmRlciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKG1zZ09iai51Ll9pZCk7XG5cblx0XHRsZXQgZWRpdG9yO1xuXHRcdGlmIChtc2dPYmouZWRpdGVkQnkpIHtcblx0XHRcdGVkaXRvciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKG1zZ09iai5lZGl0ZWRCeS5faWQpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGF0dGFjaG1lbnRzID0gdGhpcy5fY29udmVydEF0dGFjaG1lbnRzVG9BcHAobXNnT2JqLmF0dGFjaG1lbnRzKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogbXNnT2JqLl9pZCxcblx0XHRcdHJvb20sXG5cdFx0XHRzZW5kZXIsXG5cdFx0XHR0ZXh0OiBtc2dPYmoubXNnLFxuXHRcdFx0Y3JlYXRlZEF0OiBtc2dPYmoudHMsXG5cdFx0XHR1cGRhdGVkQXQ6IG1zZ09iai5fdXBkYXRlZEF0LFxuXHRcdFx0ZWRpdG9yLFxuXHRcdFx0ZWRpdGVkQXQ6IG1zZ09iai5lZGl0ZWRBdCxcblx0XHRcdGVtb2ppOiBtc2dPYmouZW1vamksXG5cdFx0XHRhdmF0YXJVcmw6IG1zZ09iai5hdmF0YXIsXG5cdFx0XHRhbGlhczogbXNnT2JqLmFsaWFzLFxuXHRcdFx0Y3VzdG9tRmllbGRzOiBtc2dPYmouY3VzdG9tRmllbGRzLFxuXHRcdFx0YXR0YWNobWVudHNcblx0XHR9O1xuXHR9XG5cblx0Y29udmVydEFwcE1lc3NhZ2UobWVzc2FnZSkge1xuXHRcdGlmICghbWVzc2FnZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQobWVzc2FnZS5yb29tLmlkKTtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQobWVzc2FnZS5zZW5kZXIuaWQpO1xuXG5cdFx0aWYgKCFyb29tIHx8ICF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdXNlciBvciByb29tIHByb3ZpZGVkIG9uIHRoZSBtZXNzYWdlLicpO1xuXHRcdH1cblxuXHRcdGxldCBlZGl0ZWRCeTtcblx0XHRpZiAobWVzc2FnZS5lZGl0b3IpIHtcblx0XHRcdGNvbnN0IGVkaXRvciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKG1lc3NhZ2UuZWRpdG9yLmlkKTtcblx0XHRcdGVkaXRlZEJ5ID0ge1xuXHRcdFx0XHRfaWQ6IGVkaXRvci5faWQsXG5cdFx0XHRcdHVzZXJuYW1lOiBlZGl0b3IudXNlcm5hbWVcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXR0YWNobWVudHMgPSB0aGlzLl9jb252ZXJ0QXBwQXR0YWNobWVudHMobWVzc2FnZS5hdHRhY2htZW50cyk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0X2lkOiBtZXNzYWdlLmlkIHx8IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiByb29tLl9pZCxcblx0XHRcdHU6IHtcblx0XHRcdFx0X2lkOiB1c2VyLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IHVzZXIudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHRtc2c6IG1lc3NhZ2UudGV4dCxcblx0XHRcdHRzOiBtZXNzYWdlLmNyZWF0ZWRBdCB8fCBuZXcgRGF0ZSgpLFxuXHRcdFx0X3VwZGF0ZWRBdDogbWVzc2FnZS51cGRhdGVkQXQgfHwgbmV3IERhdGUoKSxcblx0XHRcdGVkaXRlZEJ5LFxuXHRcdFx0ZWRpdGVkQXQ6IG1lc3NhZ2UuZWRpdGVkQXQsXG5cdFx0XHRlbW9qaTogbWVzc2FnZS5lbW9qaSxcblx0XHRcdGF2YXRhcjogbWVzc2FnZS5hdmF0YXJVcmwsXG5cdFx0XHRhbGlhczogbWVzc2FnZS5hbGlhcyxcblx0XHRcdGN1c3RvbUZpZWxkczogbWVzc2FnZS5jdXN0b21GaWVsZHMsXG5cdFx0XHRhdHRhY2htZW50c1xuXHRcdH07XG5cdH1cblxuXHRfY29udmVydEFwcEF0dGFjaG1lbnRzKGF0dGFjaG1lbnRzKSB7XG5cdFx0aWYgKHR5cGVvZiBhdHRhY2htZW50cyA9PT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoYXR0YWNobWVudHMpKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRhY2htZW50cy5tYXAoKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRzOiBhdHRhY2htZW50LnRpbWVzdGFtcCxcblx0XHRcdFx0bWVzc2FnZV9saW5rOiBhdHRhY2htZW50LnRpbWVzdGFtcExpbmssXG5cdFx0XHRcdHRodW1iX3VybDogYXR0YWNobWVudC50aHVtYm5haWxVcmwsXG5cdFx0XHRcdGF1dGhvcl9uYW1lOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLm5hbWUgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9saW5rOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmxpbmsgOiB1bmRlZmluZWQsXG5cdFx0XHRcdGF1dGhvcl9pY29uOiBhdHRhY2htZW50LmF1dGhvciA/IGF0dGFjaG1lbnQuYXV0aG9yLmljb24gOiB1bmRlZmluZWQsXG5cdFx0XHRcdHRpdGxlOiBhdHRhY2htZW50LnRpdGxlID8gYXR0YWNobWVudC50aXRsZS52YWx1ZSA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGluazogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUubGluayA6IHVuZGVmaW5lZCxcblx0XHRcdFx0dGl0bGVfbGlua19kb3dubG9hZDogYXR0YWNobWVudC50aXRsZSA/IGF0dGFjaG1lbnQudGl0bGUuZG93bmxvYWRMaW5rIDogdW5kZWZpbmVkLFxuXHRcdFx0XHRpbWFnZV91cmw6IGF0dGFjaG1lbnQuaW1hZ2VVcmwsXG5cdFx0XHRcdGF1ZGlvX3VybDogYXR0YWNobWVudC5hdWRpb1VybCxcblx0XHRcdFx0dmlkZW9fdXJsOiBhdHRhY2htZW50LnZpZGVvVXJsLFxuXHRcdFx0XHRmaWVsZHM6IGF0dGFjaG1lbnQuZmllbGRzXG5cdFx0XHR9O1xuXHRcdH0pO1xuXHR9XG5cblx0X2NvbnZlcnRBdHRhY2htZW50c1RvQXBwKGF0dGFjaG1lbnRzKSB7XG5cdFx0aWYgKHR5cGVvZiBhdHRhY2htZW50cyA9PT0gJ3VuZGVmaW5lZCcgfHwgIUFycmF5LmlzQXJyYXkoYXR0YWNobWVudHMpKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRhY2htZW50cy5tYXAoKGF0dGFjaG1lbnQpID0+IHtcblx0XHRcdGxldCBhdXRob3I7XG5cdFx0XHRpZiAoYXR0YWNobWVudC5hdXRob3JfbmFtZSB8fCBhdHRhY2htZW50LmF1dGhvcl9saW5rIHx8IGF0dGFjaG1lbnQuYXV0aG9yX2ljb24pIHtcblx0XHRcdFx0YXV0aG9yID0ge1xuXHRcdFx0XHRcdG5hbWU6IGF0dGFjaG1lbnQuYXV0aG9yX25hbWUsXG5cdFx0XHRcdFx0bGluazogYXR0YWNobWVudC5hdXRob3JfbGluayxcblx0XHRcdFx0XHRpY29uOiBhdHRhY2htZW50LmF1dGhvcl9pY29uXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0aXRsZTtcblx0XHRcdGlmIChhdHRhY2htZW50LnRpdGxlIHx8IGF0dGFjaG1lbnQudGl0bGVfbGluayB8fCBhdHRhY2htZW50LnRpdGxlX2xpbmtfZG93bmxvYWQpIHtcblx0XHRcdFx0dGl0bGUgPSB7XG5cdFx0XHRcdFx0dmFsdWU6IGF0dGFjaG1lbnQudGl0bGUsXG5cdFx0XHRcdFx0bGluazogYXR0YWNobWVudC50aXRsZV9saW5rLFxuXHRcdFx0XHRcdGRvd25sb2FkTGluazogYXR0YWNobWVudC50aXRsZV9saW5rX2Rvd25sb2FkXG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGNvbGxhcHNlZDogYXR0YWNobWVudC5jb2xsYXBzZWQsXG5cdFx0XHRcdGNvbG9yOiBhdHRhY2htZW50LmNvbG9yLFxuXHRcdFx0XHR0ZXh0OiBhdHRhY2htZW50LnRleHQsXG5cdFx0XHRcdHRpbWVzdGFtcDogYXR0YWNobWVudC50cyxcblx0XHRcdFx0dGltZXN0YW1wTGluazogYXR0YWNobWVudC5tZXNzYWdlX2xpbmssXG5cdFx0XHRcdHRodW1ibmFpbFVybDogYXR0YWNobWVudC50aHVtYl91cmwsXG5cdFx0XHRcdGF1dGhvcixcblx0XHRcdFx0dGl0bGUsXG5cdFx0XHRcdGltYWdlVXJsOiBhdHRhY2htZW50LmltYWdlX3VybCxcblx0XHRcdFx0YXVkaW9Vcmw6IGF0dGFjaG1lbnQuYXVkaW9fdXJsLFxuXHRcdFx0XHR2aWRlb1VybDogYXR0YWNobWVudC52aWRlb191cmwsXG5cdFx0XHRcdGZpZWxkczogYXR0YWNobWVudC5maWVsZHNcblx0XHRcdH07XG5cdFx0fSk7XG5cdH1cbn1cbiIsImltcG9ydCB7IFJvb21UeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi9yb29tcyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBSb29tc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQocm9vbUlkKSB7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJvb21JZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5fY29udmVydFRvQXBwKHJvb20pO1xuXHR9XG5cblx0Y29udmVydEJ5TmFtZShyb29tTmFtZSkge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlOYW1lKHJvb21OYW1lKTtcblxuXHRcdHJldHVybiB0aGlzLl9jb252ZXJ0VG9BcHAocm9vbSk7XG5cdH1cblxuXHRjb252ZXJ0QXBwUm9vbShyb29tKSB7XG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGNvbnN0IGNyZWF0b3IgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZChyb29tLmNyZWF0b3IuaWQpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdF9pZDogcm9vbS5pZCxcblx0XHRcdHU6IHtcblx0XHRcdFx0X2lkOiBjcmVhdG9yLl9pZCxcblx0XHRcdFx0dXNlcm5hbWU6IGNyZWF0b3IudXNlcm5hbWVcblx0XHRcdH0sXG5cdFx0XHR0czogcm9vbS5jcmVhdGVkQXQsXG5cdFx0XHR0OiByb29tLnR5cGUsXG5cdFx0XHRuYW1lOiByb29tLm5hbWUsXG5cdFx0XHRtc2dzOiByb29tLm1lc3NhZ2VDb3VudCB8fCAwLFxuXHRcdFx0ZGVmYXVsdDogdHlwZW9mIHJvb20uaXNEZWZhdWx0ID09PSAndW5kZWZpbmVkJyA/IGZhbHNlIDogcm9vbS5pc0RlZmF1bHQsXG5cdFx0XHRfdXBkYXRlZEF0OiByb29tLnVwZGF0ZWRBdCxcblx0XHRcdGxtOiByb29tLmxhc3RNb2RpZmllZEF0LFxuXHRcdFx0dXNlcm5hbWVzOiByb29tLnVzZXJuYW1lc1xuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFRvQXBwKHJvb20pIHtcblx0XHRpZiAoIXJvb20pIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0bGV0IGNyZWF0b3I7XG5cdFx0aWYgKHJvb20udSkge1xuXHRcdFx0Y3JlYXRvciA9IHRoaXMub3JjaC5nZXRDb252ZXJ0ZXJzKCkuZ2V0KCd1c2VycycpLmNvbnZlcnRCeUlkKHJvb20udS5faWQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogcm9vbS5faWQsXG5cdFx0XHRuYW1lOiByb29tLm5hbWUsXG5cdFx0XHR0eXBlOiB0aGlzLl9jb252ZXJ0VHlwZVRvQXBwKHJvb20udCksXG5cdFx0XHRjcmVhdG9yLFxuXHRcdFx0dXNlcm5hbWVzOiByb29tLnVzZXJuYW1lcyxcblx0XHRcdGlzRGVmYXVsdDogdHlwZW9mIHJvb20uZGVmYXVsdCA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IHJvb20uZGVmYXVsdCxcblx0XHRcdG1lc3NhZ2VDb3VudDogcm9vbS5tc2dzLFxuXHRcdFx0Y3JlYXRlZEF0OiByb29tLnRzLFxuXHRcdFx0dXBkYXRlZEF0OiByb29tLl91cGRhdGVkQXQsXG5cdFx0XHRsYXN0TW9kaWZpZWRBdDogcm9vbS5sbVxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFR5cGVUb0FwcCh0eXBlQ2hhcikge1xuXHRcdHN3aXRjaCAodHlwZUNoYXIpIHtcblx0XHRcdGNhc2UgJ2MnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuQ0hBTk5FTDtcblx0XHRcdGNhc2UgJ3AnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuUFJJVkFURV9HUk9VUDtcblx0XHRcdGNhc2UgJ2QnOlxuXHRcdFx0XHRyZXR1cm4gUm9vbVR5cGUuRElSRUNUX01FU1NBR0U7XG5cdFx0XHRjYXNlICdsYyc6XG5cdFx0XHRcdHJldHVybiBSb29tVHlwZS5MSVZFX0NIQVQ7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gcm9vbSB0eXBlIG9mOiBcIiR7IHR5cGVDaGFyIH1cImApO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgU2V0dGluZ1R5cGUgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy10cy1kZWZpbml0aW9uL3NldHRpbmdzJztcblxuZXhwb3J0IGNsYXNzIEFwcFNldHRpbmdzQ29udmVydGVyIHtcblx0Y29uc3RydWN0b3Iob3JjaCkge1xuXHRcdHRoaXMub3JjaCA9IG9yY2g7XG5cdH1cblxuXHRjb252ZXJ0QnlJZChzZXR0aW5nSWQpIHtcblx0XHRjb25zdCBzZXR0aW5nID0gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZE9uZUJ5SWQoc2V0dGluZ0lkKTtcblxuXHRcdHJldHVybiB0aGlzLmNvbnZlcnRUb0FwcChzZXR0aW5nKTtcblx0fVxuXG5cdGNvbnZlcnRUb0FwcChzZXR0aW5nKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiBzZXR0aW5nLl9pZCxcblx0XHRcdHR5cGU6IHRoaXMuX2NvbnZlcnRUeXBlVG9BcHAoc2V0dGluZy50eXBlKSxcblx0XHRcdHBhY2thZ2VWYWx1ZTogc2V0dGluZy5wYWNrYWdlVmFsdWUsXG5cdFx0XHR2YWx1ZXM6IHNldHRpbmcudmFsdWVzLFxuXHRcdFx0dmFsdWU6IHNldHRpbmcudmFsdWUsXG5cdFx0XHRwdWJsaWM6IHNldHRpbmcucHVibGljLFxuXHRcdFx0aGlkZGVuOiBzZXR0aW5nLmhpZGRlbixcblx0XHRcdGdyb3VwOiBzZXR0aW5nLmdyb3VwLFxuXHRcdFx0aTE4bkxhYmVsOiBzZXR0aW5nLmkxOG5MYWJlbCxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogc2V0dGluZy5pMThuRGVzY3JpcHRpb24sXG5cdFx0XHRjcmVhdGVkQXQ6IHNldHRpbmcudHMsXG5cdFx0XHR1cGRhdGVkQXQ6IHNldHRpbmcuX3VwZGF0ZWRBdFxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFR5cGVUb0FwcCh0eXBlKSB7XG5cdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRjYXNlICdib29sZWFuJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkJPT0xFQU47XG5cdFx0XHRjYXNlICdjb2RlJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLkNPREU7XG5cdFx0XHRjYXNlICdjb2xvcic6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5DT0xPUjtcblx0XHRcdGNhc2UgJ2ZvbnQnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuRk9OVDtcblx0XHRcdGNhc2UgJ2ludCc6XG5cdFx0XHRcdHJldHVybiBTZXR0aW5nVHlwZS5OVU1CRVI7XG5cdFx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdFx0XHRyZXR1cm4gU2V0dGluZ1R5cGUuU0VMRUNUO1xuXHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0cmV0dXJuIFNldHRpbmdUeXBlLlNUUklORztcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHJldHVybiB0eXBlO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgVXNlclN0YXR1c0Nvbm5lY3Rpb24sIFVzZXJUeXBlIH0gZnJvbSAnQHJvY2tldC5jaGF0L2FwcHMtdHMtZGVmaW5pdGlvbi91c2Vycyc7XG5cbmV4cG9ydCBjbGFzcyBBcHBVc2Vyc0NvbnZlcnRlciB7XG5cdGNvbnN0cnVjdG9yKG9yY2gpIHtcblx0XHR0aGlzLm9yY2ggPSBvcmNoO1xuXHR9XG5cblx0Y29udmVydEJ5SWQodXNlcklkKSB7XG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKHVzZXJJZCk7XG5cblx0XHRyZXR1cm4gdGhpcy5fY29udmVydFRvQXBwKHVzZXIpO1xuXHR9XG5cblx0Y29udmVydEJ5VXNlcm5hbWUodXNlcm5hbWUpIHtcblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUpO1xuXG5cdFx0cmV0dXJuIHRoaXMuX2NvbnZlcnRUb0FwcCh1c2VyKTtcblx0fVxuXG5cdF9jb252ZXJ0VG9BcHAodXNlcikge1xuXHRcdGlmICghdXNlcikge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRjb25zdCB0eXBlID0gdGhpcy5fY29udmVydFVzZXJUeXBlVG9FbnVtKHVzZXIudHlwZSk7XG5cdFx0Y29uc3Qgc3RhdHVzID0gdGhpcy5fY29udmVydFN0YXR1c0Nvbm5lY3Rpb25Ub0VudW0odXNlci5zdGF0dXMpO1xuXHRcdGNvbnN0IHN0YXR1c0Nvbm5lY3Rpb24gPSB0aGlzLl9jb252ZXJ0U3RhdHVzQ29ubmVjdGlvblRvRW51bSh1c2VyLnN0YXR1c0Nvbm5lY3Rpb24pO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGlkOiB1c2VyLl9pZCxcblx0XHRcdHVzZXJuYW1lOiB1c2VyLnVzZXJuYW1lLFxuXHRcdFx0ZW1haWxzOiB1c2VyLmVtYWlscyxcblx0XHRcdHR5cGUsXG5cdFx0XHRpc0VuYWJsZWQ6IHVzZXIuYWN0aXZlLFxuXHRcdFx0bmFtZTogdXNlci5uYW1lLFxuXHRcdFx0cm9sZXM6IHVzZXIucm9sZXMsXG5cdFx0XHRzdGF0dXMsXG5cdFx0XHRzdGF0dXNDb25uZWN0aW9uLFxuXHRcdFx0dXRjT2Zmc2V0OiB1c2VyLnV0Y09mZnNldCxcblx0XHRcdGNyZWF0ZWRBdDogdXNlci5jcmVhdGVkQXQsXG5cdFx0XHR1cGRhdGVkQXQ6IHVzZXIuX3VwZGF0ZWRBdCxcblx0XHRcdGxhc3RMb2dpbkF0OiB1c2VyLmxhc3RMb2dpblxuXHRcdH07XG5cdH1cblxuXHRfY29udmVydFVzZXJUeXBlVG9FbnVtKHR5cGUpIHtcblx0XHRzd2l0Y2ggKHR5cGUpIHtcblx0XHRcdGNhc2UgJ3VzZXInOlxuXHRcdFx0XHRyZXR1cm4gVXNlclR5cGUuVVNFUjtcblx0XHRcdGNhc2UgJ2JvdCc6XG5cdFx0XHRcdHJldHVybiBVc2VyVHlwZS5CT1Q7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdXNlciB0eXBlIG9mOicsIHR5cGUpO1xuXHRcdH1cblx0fVxuXG5cdF9jb252ZXJ0U3RhdHVzQ29ubmVjdGlvblRvRW51bShzdGF0dXMpIHtcblx0XHRzd2l0Y2ggKHN0YXR1cykge1xuXHRcdFx0Y2FzZSAnb2ZmbGluZSc6XG5cdFx0XHRcdHJldHVybiBVc2VyU3RhdHVzQ29ubmVjdGlvbi5PRkZMSU5FO1xuXHRcdFx0Y2FzZSAnb25saW5lJzpcblx0XHRcdFx0cmV0dXJuIFVzZXJTdGF0dXNDb25uZWN0aW9uLk9OTElORTtcblx0XHRcdGNhc2UgJ2F3YXknOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uQVdBWTtcblx0XHRcdGNhc2UgJ2J1c3knOlxuXHRcdFx0XHRyZXR1cm4gVXNlclN0YXR1c0Nvbm5lY3Rpb24uQlVTWTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVW5rbm93biBzdGF0dXMgdHlwZSBvZjonLCBzdGF0dXMpO1xuXHRcdH1cblx0fVxufVxuIiwiaW1wb3J0IHsgQXBwTWVzc2FnZXNDb252ZXJ0ZXIgfSBmcm9tICcuL21lc3NhZ2VzJztcbmltcG9ydCB7IEFwcFJvb21zQ29udmVydGVyIH0gZnJvbSAnLi9yb29tcyc7XG5pbXBvcnQgeyBBcHBTZXR0aW5nc0NvbnZlcnRlciB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgQXBwVXNlcnNDb252ZXJ0ZXIgfSBmcm9tICcuL3VzZXJzJztcblxuZXhwb3J0IHtcblx0QXBwTWVzc2FnZXNDb252ZXJ0ZXIsXG5cdEFwcFJvb21zQ29udmVydGVyLFxuXHRBcHBTZXR0aW5nc0NvbnZlcnRlcixcblx0QXBwVXNlcnNDb252ZXJ0ZXJcbn07XG4iLCJpbXBvcnQgeyBSZWFsQXBwQnJpZGdlcyB9IGZyb20gJy4vYnJpZGdlcyc7XG5pbXBvcnQgeyBBcHBNZXRob2RzLCBBcHBzUmVzdEFwaSwgQXBwU2VydmVyTm90aWZpZXIgfSBmcm9tICcuL2NvbW11bmljYXRpb24nO1xuaW1wb3J0IHsgQXBwTWVzc2FnZXNDb252ZXJ0ZXIsIEFwcFJvb21zQ29udmVydGVyLCBBcHBTZXR0aW5nc0NvbnZlcnRlciwgQXBwVXNlcnNDb252ZXJ0ZXIgfSBmcm9tICcuL2NvbnZlcnRlcnMnO1xuaW1wb3J0IHsgQXBwc0xvZ3NNb2RlbCwgQXBwc01vZGVsLCBBcHBzUGVyc2lzdGVuY2VNb2RlbCwgQXBwUmVhbFN0b3JhZ2UsIEFwcFJlYWxMb2dzU3RvcmFnZSB9IGZyb20gJy4vc3RvcmFnZSc7XG5cbmltcG9ydCB7IEFwcE1hbmFnZXIgfSBmcm9tICdAcm9ja2V0LmNoYXQvYXBwcy1lbmdpbmUvc2VydmVyL0FwcE1hbmFnZXInO1xuXG5jbGFzcyBBcHBTZXJ2ZXJPcmNoZXN0cmF0b3Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5tb2RlbHMgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMpIHtcblx0XHRcdFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNyZWF0ZU9yVXBkYXRlKCdtYW5hZ2UtYXBwcycsIFsnYWRtaW4nXSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fbW9kZWwgPSBuZXcgQXBwc01vZGVsKCk7XG5cdFx0dGhpcy5fbG9nTW9kZWwgPSBuZXcgQXBwc0xvZ3NNb2RlbCgpO1xuXHRcdHRoaXMuX3BlcnNpc3RNb2RlbCA9IG5ldyBBcHBzUGVyc2lzdGVuY2VNb2RlbCgpO1xuXHRcdHRoaXMuX3N0b3JhZ2UgPSBuZXcgQXBwUmVhbFN0b3JhZ2UodGhpcy5fbW9kZWwpO1xuXHRcdHRoaXMuX2xvZ1N0b3JhZ2UgPSBuZXcgQXBwUmVhbExvZ3NTdG9yYWdlKHRoaXMuX3BlcnNpc3RNb2RlbCk7XG5cblx0XHR0aGlzLl9jb252ZXJ0ZXJzID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCdtZXNzYWdlcycsIG5ldyBBcHBNZXNzYWdlc0NvbnZlcnRlcih0aGlzKSk7XG5cdFx0dGhpcy5fY29udmVydGVycy5zZXQoJ3Jvb21zJywgbmV3IEFwcFJvb21zQ29udmVydGVyKHRoaXMpKTtcblx0XHR0aGlzLl9jb252ZXJ0ZXJzLnNldCgnc2V0dGluZ3MnLCBuZXcgQXBwU2V0dGluZ3NDb252ZXJ0ZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbnZlcnRlcnMuc2V0KCd1c2VycycsIG5ldyBBcHBVc2Vyc0NvbnZlcnRlcih0aGlzKSk7XG5cblx0XHR0aGlzLl9icmlkZ2VzID0gbmV3IFJlYWxBcHBCcmlkZ2VzKHRoaXMpO1xuXG5cdFx0dGhpcy5fbWFuYWdlciA9IG5ldyBBcHBNYW5hZ2VyKHRoaXMuX3N0b3JhZ2UsIHRoaXMuX2xvZ1N0b3JhZ2UsIHRoaXMuX2JyaWRnZXMpO1xuXG5cdFx0dGhpcy5fY29tbXVuaWNhdG9ycyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzLnNldCgnbWV0aG9kcycsIG5ldyBBcHBNZXRob2RzKHRoaXMuX21hbmFnZXIpKTtcblx0XHR0aGlzLl9jb21tdW5pY2F0b3JzLnNldCgnbm90aWZpZXInLCBuZXcgQXBwU2VydmVyTm90aWZpZXIodGhpcykpO1xuXHRcdHRoaXMuX2NvbW11bmljYXRvcnMuc2V0KCdyZXN0YXBpJywgbmV3IEFwcHNSZXN0QXBpKHRoaXMsIHRoaXMuX21hbmFnZXIpKTtcblx0fVxuXG5cdGdldE1vZGVsKCkge1xuXHRcdHJldHVybiB0aGlzLl9tb2RlbDtcblx0fVxuXG5cdGdldFBlcnNpc3RlbmNlTW9kZWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3BlcnNpc3RNb2RlbDtcblx0fVxuXG5cdGdldFN0b3JhZ2UoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3N0b3JhZ2U7XG5cdH1cblxuXHRnZXRMb2dTdG9yYWdlKCkge1xuXHRcdHJldHVybiB0aGlzLl9sb2dTdG9yYWdlO1xuXHR9XG5cblx0Z2V0Q29udmVydGVycygpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29udmVydGVycztcblx0fVxuXG5cdGdldEJyaWRnZXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2JyaWRnZXM7XG5cdH1cblxuXHRnZXROb3RpZmllcigpIHtcblx0XHRyZXR1cm4gdGhpcy5fY29tbXVuaWNhdG9ycy5nZXQoJ25vdGlmaWVyJyk7XG5cdH1cblxuXHRnZXRNYW5hZ2VyKCkge1xuXHRcdHJldHVybiB0aGlzLl9tYW5hZ2VyO1xuXHR9XG59XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uIF9hcHBTZXJ2ZXJPcmNoZXN0cmF0b3IoKSB7XG5cdC8vIEVuc3VyZSB0aGF0IGV2ZXJ5dGhpbmcgaXMgc2V0dXBcblx0aWYgKHByb2Nlc3MuZW52W0FwcE1hbmFnZXIuRU5WX1ZBUl9OQU1FX0ZPUl9FTkFCTElOR10gIT09ICd0cnVlJyAmJiBwcm9jZXNzLmVudltBcHBNYW5hZ2VyLlNVUEVSX0ZVTl9FTlZfRU5BQkxFTUVOVF9OQU1FXSAhPT0gJ3RydWUnKSB7XG5cdFx0cmV0dXJuIG5ldyBBcHBNZXRob2RzKCk7XG5cdH1cblxuXHRjb25zb2xlLmxvZygnT3JjaGVzdHJhdGluZyB0aGUgYXBwIHBpZWNlLi4uJyk7XG5cdGdsb2JhbC5BcHBzID0gbmV3IEFwcFNlcnZlck9yY2hlc3RyYXRvcigpO1xuXG5cdGdsb2JhbC5BcHBzLmdldE1hbmFnZXIoKS5sb2FkKClcblx0XHQudGhlbigoKSA9PiBjb25zb2xlLmxvZygnLi4uZG9uZSEgOyknKSlcblx0XHQuY2F0Y2goKGVycikgPT4gY29uc29sZS53YXJuKCcuLi5mYWlsZWQhJywgZXJyKSk7XG59KTtcbiJdfQ==
