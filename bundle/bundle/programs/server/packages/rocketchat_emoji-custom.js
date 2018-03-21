(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var renderEmoji = Package['rocketchat:emoji'].renderEmoji;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var isSet, isSetNotNull;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:emoji-custom":{"function-isSet.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/function-isSet.js                                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals isSet:true, isSetNotNull:true */
//http://stackoverflow.com/a/26990347 function isSet() from Gajus
isSet = function (fn) {
  let value;

  try {
    value = fn();
  } catch (e) {
    value = undefined;
  } finally {
    return value !== undefined;
  }
};

isSetNotNull = function (fn) {
  let value;

  try {
    value = fn();
  } catch (e) {
    value = null;
  } finally {
    return value !== null && value !== undefined;
  }
};
/* exported isSet, isSetNotNull */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"startup":{"emoji-custom.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/startup/emoji-custom.js                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.startup(function () {
  let storeType = 'GridFS';

  if (RocketChat.settings.get('EmojiUpload_Storage_Type')) {
    storeType = RocketChat.settings.get('EmojiUpload_Storage_Type');
  }

  const RocketChatStore = RocketChatFile[storeType];

  if (RocketChatStore == null) {
    throw new Error(`Invalid RocketChatStore type [${storeType}]`);
  }

  console.log(`Using ${storeType} for custom emoji storage`.green);
  let path = '~/uploads';

  if (RocketChat.settings.get('EmojiUpload_FileSystemPath') != null) {
    if (RocketChat.settings.get('EmojiUpload_FileSystemPath').trim() !== '') {
      path = RocketChat.settings.get('EmojiUpload_FileSystemPath');
    }
  }

  this.RocketChatFileEmojiCustomInstance = new RocketChatStore({
    name: 'custom_emoji',
    absolutePath: path
  });
  return WebApp.connectHandlers.use('/emoji-custom/', Meteor.bindEnvironment(function (req, res
  /*, next*/
  ) {
    const params = {
      emoji: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, ''))
    };

    if (_.isEmpty(params.emoji)) {
      res.writeHead(403);
      res.write('Forbidden');
      res.end();
      return;
    }

    const file = RocketChatFileEmojiCustomInstance.getFileWithReadStream(encodeURIComponent(params.emoji));
    res.setHeader('Content-Disposition', 'inline');

    if (file == null) {
      //use code from username initials renderer until file upload is complete
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=0');
      res.setHeader('Expires', '-1');
      res.setHeader('Last-Modified', 'Thu, 01 Jan 2015 00:00:00 GMT');
      const reqModifiedHeader = req.headers['if-modified-since'];

      if (reqModifiedHeader != null) {
        if (reqModifiedHeader === 'Thu, 01 Jan 2015 00:00:00 GMT') {
          res.writeHead(304);
          res.end();
          return;
        }
      }

      const color = '#000';
      const initials = '?';
      const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" pointer-events="none" width="50" height="50" style="width: 50px; height: 50px; background-color: ${color};">
	<text text-anchor="middle" y="50%" x="50%" dy="0.36em" pointer-events="auto" fill="#ffffff" font-family="Helvetica, Arial, Lucida Grande, sans-serif" style="font-weight: 400; font-size: 28px;">
		${initials}
	</text>
</svg>`;
      res.write(svg);
      res.end();
      return;
    }

    let fileUploadDate = undefined;

    if (file.uploadDate != null) {
      fileUploadDate = file.uploadDate.toUTCString();
    }

    const reqModifiedHeader = req.headers['if-modified-since'];

    if (reqModifiedHeader != null) {
      if (reqModifiedHeader === fileUploadDate) {
        res.setHeader('Last-Modified', reqModifiedHeader);
        res.writeHead(304);
        res.end();
        return;
      }
    }

    res.setHeader('Cache-Control', 'public, max-age=0');
    res.setHeader('Expires', '-1');

    if (fileUploadDate != null) {
      res.setHeader('Last-Modified', fileUploadDate);
    } else {
      res.setHeader('Last-Modified', new Date().toUTCString());
    }

    if (/^svg$/i.test(params.emoji.split('.').pop())) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    res.setHeader('Content-Length', file.length);
    file.readStream.pipe(res);
  }));
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/startup/settings.js                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
RocketChat.settings.addGroup('EmojiCustomFilesystem', function () {
  this.add('EmojiUpload_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    i18nLabel: 'FileUpload_Storage_Type'
  });
  this.add('EmojiUpload_FileSystemPath', '', {
    type: 'string',
    enableQuery: {
      _id: 'EmojiUpload_Storage_Type',
      value: 'FileSystem'
    },
    i18nLabel: 'FileUpload_FileSystemPath'
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"EmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/models/EmojiCustom.js                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
class EmojiCustom extends RocketChat.models._Base {
  constructor() {
    super('custom_emoji');
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'aliases': 1
    });
    this.tryEnsureIndex({
      'extension': 1
    });
  } //find one


  findOneByID(_id, options) {
    return this.findOne(_id, options);
  } //find


  findByNameOrAlias(name, options) {
    const query = {
      $or: [{
        name
      }, {
        aliases: name
      }]
    };
    return this.find(query, options);
  }

  findByNameOrAliasExceptID(name, except, options) {
    const query = {
      _id: {
        $nin: [except]
      },
      $or: [{
        name
      }, {
        aliases: name
      }]
    };
    return this.find(query, options);
  } //update


  setName(_id, name) {
    const update = {
      $set: {
        name
      }
    };
    return this.update({
      _id
    }, update);
  }

  setAliases(_id, aliases) {
    const update = {
      $set: {
        aliases
      }
    };
    return this.update({
      _id
    }, update);
  }

  setExtension(_id, extension) {
    const update = {
      $set: {
        extension
      }
    };
    return this.update({
      _id
    }, update);
  } // INSERT


  create(data) {
    return this.insert(data);
  } // REMOVE


  removeByID(_id) {
    return this.remove(_id);
  }

}

RocketChat.models.EmojiCustom = new EmojiCustom();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"fullEmojiData.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/publications/fullEmojiData.js                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);
Meteor.publish('fullEmojiData', function (filter, limit) {
  if (!this.userId) {
    return this.ready();
  }

  const fields = {
    name: 1,
    aliases: 1,
    extension: 1
  };
  filter = s.trim(filter);
  const options = {
    fields,
    limit,
    sort: {
      name: 1
    }
  };

  if (filter) {
    const filterReg = new RegExp(s.escapeRegExp(filter), 'i');
    return RocketChat.models.EmojiCustom.findByNameOrAlias(filterReg, options);
  }

  return RocketChat.models.EmojiCustom.find({}, options);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"listEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/listEmojiCustom.js                                                 //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Meteor.methods({
  listEmojiCustom() {
    return RocketChat.models.EmojiCustom.find({}).fetch();
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/deleteEmojiCustom.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals RocketChatFileEmojiCustomInstance */
Meteor.methods({
  deleteEmojiCustom(emojiID) {
    let emoji = null;

    if (RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      emoji = RocketChat.models.EmojiCustom.findOneByID(emojiID);
    } else {
      throw new Meteor.Error('not_authorized');
    }

    if (emoji == null) {
      throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', {
        method: 'deleteEmojiCustom'
      });
    }

    RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emoji.name}.${emoji.extension}`));
    RocketChat.models.EmojiCustom.removeByID(emojiID);
    RocketChat.Notifications.notifyLogged('deleteEmojiCustom', {
      emojiData: emoji
    });
    return true;
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"insertOrUpdateEmoji.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/insertOrUpdateEmoji.js                                             //
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
Meteor.methods({
  insertOrUpdateEmoji(emojiData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      throw new Meteor.Error('not_authorized');
    }

    if (!s.trim(emojiData.name)) {
      throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
        method: 'insertOrUpdateEmoji',
        field: 'Name'
      });
    } //allow all characters except colon, whitespace, comma, >, <, &, ", ', /, \, (, )
    //more practical than allowing specific sets of characters; also allows foreign languages


    const nameValidation = /[\s,:><&"'\/\\\(\)]/;
    const aliasValidation = /[:><&\|"'\/\\\(\)]/; //silently strip colon; this allows for uploading :emojiname: as emojiname

    emojiData.name = emojiData.name.replace(/:/g, '');
    emojiData.aliases = emojiData.aliases.replace(/:/g, '');

    if (nameValidation.test(emojiData.name)) {
      throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.name} is not a valid name`, {
        method: 'insertOrUpdateEmoji',
        input: emojiData.name,
        field: 'Name'
      });
    }

    if (emojiData.aliases) {
      if (aliasValidation.test(emojiData.aliases)) {
        throw new Meteor.Error('error-input-is-not-a-valid-field', `${emojiData.aliases} is not a valid alias set`, {
          method: 'insertOrUpdateEmoji',
          input: emojiData.aliases,
          field: 'Alias_Set'
        });
      }

      emojiData.aliases = emojiData.aliases.split(/[\s,]/);
      emojiData.aliases = emojiData.aliases.filter(Boolean);
      emojiData.aliases = _.without(emojiData.aliases, emojiData.name);
    } else {
      emojiData.aliases = [];
    }

    let matchingResults = [];

    if (emojiData._id) {
      matchingResults = RocketChat.models.EmojiCustom.findByNameOrAliasExceptID(emojiData.name, emojiData._id).fetch();

      for (const alias of emojiData.aliases) {
        matchingResults = matchingResults.concat(RocketChat.models.EmojiCustom.findByNameOrAliasExceptID(alias, emojiData._id).fetch());
      }
    } else {
      matchingResults = RocketChat.models.EmojiCustom.findByNameOrAlias(emojiData.name).fetch();

      for (const alias of emojiData.aliases) {
        matchingResults = matchingResults.concat(RocketChat.models.EmojiCustom.findByNameOrAlias(alias).fetch());
      }
    }

    if (matchingResults.length > 0) {
      throw new Meteor.Error('Custom_Emoji_Error_Name_Or_Alias_Already_In_Use', 'The custom emoji or one of its aliases is already in use', {
        method: 'insertOrUpdateEmoji'
      });
    }

    if (!emojiData._id) {
      //insert emoji
      const createEmoji = {
        name: emojiData.name,
        aliases: emojiData.aliases,
        extension: emojiData.extension
      };

      const _id = RocketChat.models.EmojiCustom.create(createEmoji);

      RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
        emojiData: createEmoji
      });
      return _id;
    } else {
      //update emoji
      if (emojiData.newFile) {
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.extension}`));
        RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));
        RocketChat.models.EmojiCustom.setExtension(emojiData._id, emojiData.extension);
      } else if (emojiData.name !== emojiData.previousName) {
        const rs = RocketChatFileEmojiCustomInstance.getFileWithReadStream(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`));

        if (rs !== null) {
          RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
          const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${emojiData.name}.${emojiData.previousExtension}`), rs.contentType);
          ws.on('end', Meteor.bindEnvironment(() => RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.previousName}.${emojiData.previousExtension}`))));
          rs.readStream.pipe(ws);
        }
      }

      if (emojiData.name !== emojiData.previousName) {
        RocketChat.models.EmojiCustom.setName(emojiData._id, emojiData.name);
      }

      if (emojiData.aliases) {
        RocketChat.models.EmojiCustom.setAliases(emojiData._id, emojiData.aliases);
      } else {
        RocketChat.models.EmojiCustom.setAliases(emojiData._id, []);
      }

      RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
        emojiData
      });
      return true;
    }
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"uploadEmojiCustom.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_emoji-custom/server/methods/uploadEmojiCustom.js                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* globals RocketChatFileEmojiCustomInstance */
Meteor.methods({
  uploadEmojiCustom(binaryContent, contentType, emojiData) {
    if (!RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
      throw new Meteor.Error('not_authorized');
    } //delete aliases for notification purposes. here, it is a string rather than an array


    delete emojiData.aliases;
    const file = new Buffer(binaryContent, 'binary');
    const rs = RocketChatFile.bufferToStream(file);
    RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
    const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`), contentType);
    ws.on('end', Meteor.bindEnvironment(() => Meteor.setTimeout(() => RocketChat.Notifications.notifyLogged('updateEmojiCustom', {
      emojiData
    }), 500)));
    rs.pipe(ws);
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:emoji-custom/function-isSet.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/startup/emoji-custom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/startup/settings.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/models/EmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/publications/fullEmojiData.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/listEmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/deleteEmojiCustom.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/insertOrUpdateEmoji.js");
require("/node_modules/meteor/rocketchat:emoji-custom/server/methods/uploadEmojiCustom.js");

/* Exports */
Package._define("rocketchat:emoji-custom");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_emoji-custom.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vZnVuY3Rpb24taXNTZXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9zdGFydHVwL2Vtb2ppLWN1c3RvbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL3N0YXJ0dXAvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9tb2RlbHMvRW1vamlDdXN0b20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZW1vamktY3VzdG9tL3NlcnZlci9wdWJsaWNhdGlvbnMvZnVsbEVtb2ppRGF0YS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvbGlzdEVtb2ppQ3VzdG9tLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmVtb2ppLWN1c3RvbS9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVFbW9qaUN1c3RvbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvaW5zZXJ0T3JVcGRhdGVFbW9qaS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDplbW9qaS1jdXN0b20vc2VydmVyL21ldGhvZHMvdXBsb2FkRW1vamlDdXN0b20uanMiXSwibmFtZXMiOlsiaXNTZXQiLCJmbiIsInZhbHVlIiwiZSIsInVuZGVmaW5lZCIsImlzU2V0Tm90TnVsbCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIk1ldGVvciIsInN0YXJ0dXAiLCJzdG9yZVR5cGUiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJSb2NrZXRDaGF0U3RvcmUiLCJSb2NrZXRDaGF0RmlsZSIsIkVycm9yIiwiY29uc29sZSIsImxvZyIsImdyZWVuIiwicGF0aCIsInRyaW0iLCJSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UiLCJuYW1lIiwiYWJzb2x1dGVQYXRoIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwiYmluZEVudmlyb25tZW50IiwicmVxIiwicmVzIiwicGFyYW1zIiwiZW1vamkiLCJkZWNvZGVVUklDb21wb25lbnQiLCJ1cmwiLCJyZXBsYWNlIiwiaXNFbXB0eSIsIndyaXRlSGVhZCIsIndyaXRlIiwiZW5kIiwiZmlsZSIsImdldEZpbGVXaXRoUmVhZFN0cmVhbSIsImVuY29kZVVSSUNvbXBvbmVudCIsInNldEhlYWRlciIsInJlcU1vZGlmaWVkSGVhZGVyIiwiaGVhZGVycyIsImNvbG9yIiwiaW5pdGlhbHMiLCJzdmciLCJmaWxlVXBsb2FkRGF0ZSIsInVwbG9hZERhdGUiLCJ0b1VUQ1N0cmluZyIsIkRhdGUiLCJ0ZXN0Iiwic3BsaXQiLCJwb3AiLCJsZW5ndGgiLCJyZWFkU3RyZWFtIiwicGlwZSIsImFkZEdyb3VwIiwiYWRkIiwidHlwZSIsInZhbHVlcyIsImtleSIsImkxOG5MYWJlbCIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwiRW1vamlDdXN0b20iLCJtb2RlbHMiLCJfQmFzZSIsImNvbnN0cnVjdG9yIiwidHJ5RW5zdXJlSW5kZXgiLCJmaW5kT25lQnlJRCIsIm9wdGlvbnMiLCJmaW5kT25lIiwiZmluZEJ5TmFtZU9yQWxpYXMiLCJxdWVyeSIsIiRvciIsImFsaWFzZXMiLCJmaW5kIiwiZmluZEJ5TmFtZU9yQWxpYXNFeGNlcHRJRCIsImV4Y2VwdCIsIiRuaW4iLCJzZXROYW1lIiwidXBkYXRlIiwiJHNldCIsInNldEFsaWFzZXMiLCJzZXRFeHRlbnNpb24iLCJleHRlbnNpb24iLCJjcmVhdGUiLCJkYXRhIiwiaW5zZXJ0IiwicmVtb3ZlQnlJRCIsInJlbW92ZSIsInMiLCJwdWJsaXNoIiwiZmlsdGVyIiwibGltaXQiLCJ1c2VySWQiLCJyZWFkeSIsImZpZWxkcyIsInNvcnQiLCJmaWx0ZXJSZWciLCJSZWdFeHAiLCJlc2NhcGVSZWdFeHAiLCJtZXRob2RzIiwibGlzdEVtb2ppQ3VzdG9tIiwiZmV0Y2giLCJkZWxldGVFbW9qaUN1c3RvbSIsImVtb2ppSUQiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJtZXRob2QiLCJkZWxldGVGaWxlIiwiTm90aWZpY2F0aW9ucyIsIm5vdGlmeUxvZ2dlZCIsImVtb2ppRGF0YSIsImluc2VydE9yVXBkYXRlRW1vamkiLCJmaWVsZCIsIm5hbWVWYWxpZGF0aW9uIiwiYWxpYXNWYWxpZGF0aW9uIiwiaW5wdXQiLCJCb29sZWFuIiwid2l0aG91dCIsIm1hdGNoaW5nUmVzdWx0cyIsImFsaWFzIiwiY29uY2F0IiwiY3JlYXRlRW1vamkiLCJuZXdGaWxlIiwicHJldmlvdXNFeHRlbnNpb24iLCJwcmV2aW91c05hbWUiLCJycyIsIndzIiwiY3JlYXRlV3JpdGVTdHJlYW0iLCJjb250ZW50VHlwZSIsIm9uIiwidXBsb2FkRW1vamlDdXN0b20iLCJiaW5hcnlDb250ZW50IiwiQnVmZmVyIiwiYnVmZmVyVG9TdHJlYW0iLCJzZXRUaW1lb3V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0FBLFFBQVEsVUFBU0MsRUFBVCxFQUFhO0FBQ3BCLE1BQUlDLEtBQUo7O0FBQ0EsTUFBSTtBQUNIQSxZQUFRRCxJQUFSO0FBQ0EsR0FGRCxDQUVFLE9BQU9FLENBQVAsRUFBVTtBQUNYRCxZQUFRRSxTQUFSO0FBQ0EsR0FKRCxTQUlVO0FBQ1QsV0FBT0YsVUFBVUUsU0FBakI7QUFDQTtBQUNELENBVEQ7O0FBV0FDLGVBQWUsVUFBU0osRUFBVCxFQUFhO0FBQzNCLE1BQUlDLEtBQUo7O0FBQ0EsTUFBSTtBQUNIQSxZQUFRRCxJQUFSO0FB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RUFBa0U7QUFDakUsWUFBTSxJQUFJMUYsT0FBT1EsS0FBWCxDQUFpQixnQkFBakIsQ0FBTjtBQUNBLEtBSHVELENBS3hEOzs7QUFDQSxXQUFPb0csVUFBVXRDLE9BQWpCO0FBQ0EsVUFBTXRDLE9BQU8sSUFBSWtHLE1BQUosQ0FBV0QsYUFBWCxFQUEwQixRQUExQixDQUFiO0FBRUEsVUFBTU4sS0FBS3BILGVBQWU0SCxjQUFmLENBQThCbkcsSUFBOUIsQ0FBWDtBQUNBbEIsc0NBQWtDMkYsVUFBbEMsQ0FBNkN2RSxtQkFBb0IsR0FBRzBFLFVBQVU3RixJQUFNLElBQUk2RixVQUFVNUIsU0FBVyxFQUFoRSxDQUE3QztBQUNBLFVBQU00QyxLQUFLOUcsa0NBQWtDK0csaUJBQWxDLENBQW9EM0YsbUJBQW9CLEdBQUcwRSxVQUFVN0YsSUFBTSxJQUFJNkYsVUFBVTVCLFNBQVcsRUFBaEUsQ0FBcEQsRUFBd0g4QyxXQUF4SCxDQUFYO0FBQ0FGLE9BQUdHLEVBQUgsQ0FBTSxLQUFOLEVBQWEvSCxPQUFPb0IsZUFBUCxDQUF1QixNQUNuQ3BCLE9BQU9vSSxVQUFQLENBQWtCLE1BQU1qSSxXQUFXdUcsYUFBWCxDQUF5QkMsWUFBekIsQ0FBc0MsbUJBQXRDLEVBQTJEO0FBQUNDO0FBQUQsS0FBM0QsQ0FBeEIsRUFBaUcsR0FBakcsQ0FEWSxDQUFiO0FBSUFlLE9BQUd6RSxJQUFILENBQVEwRSxFQUFSO0FBQ0E7O0FBbEJhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9lbW9qaS1jdXN0b20uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIGlzU2V0OnRydWUsIGlzU2V0Tm90TnVsbDp0cnVlICovXG4vL2h0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI2OTkwMzQ3IGZ1bmN0aW9uIGlzU2V0KCkgZnJvbSBHYWp1c1xuaXNTZXQgPSBmdW5jdGlvbihmbikge1xuXHRsZXQgdmFsdWU7XG5cdHRyeSB7XG5cdFx0dmFsdWUgPSBmbigpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0dmFsdWUgPSB1bmRlZmluZWQ7XG5cdH0gZmluYWxseSB7XG5cdFx0cmV0dXJuIHZhbHVlICE9PSB1bmRlZmluZWQ7XG5cdH1cbn07XG5cbmlzU2V0Tm90TnVsbCA9IGZ1bmN0aW9uKGZuKSB7XG5cdGxldCB2YWx1ZTtcblx0dHJ5IHtcblx0XHR2YWx1ZSA9IGZuKCk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHR2YWx1ZSA9IG51bGw7XG5cdH0gZmluYWxseSB7XG5cdFx0cmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQ7XG5cdH1cbn07XG5cbi8qIGV4cG9ydGVkIGlzU2V0LCBpc1NldE5vdE51bGwgKi9cbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdGxldCBzdG9yZVR5cGUgPSAnR3JpZEZTJztcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Vtb2ppVXBsb2FkX1N0b3JhZ2VfVHlwZScpKSB7XG5cdFx0c3RvcmVUeXBlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Vtb2ppVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHR9XG5cblx0Y29uc3QgUm9ja2V0Q2hhdFN0b3JlID0gUm9ja2V0Q2hhdEZpbGVbc3RvcmVUeXBlXTtcblxuXHRpZiAoUm9ja2V0Q2hhdFN0b3JlID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgUm9ja2V0Q2hhdFN0b3JlIHR5cGUgWyR7IHN0b3JlVHlwZSB9XWApO1xuXHR9XG5cblx0Y29uc29sZS5sb2coYFVzaW5nICR7IHN0b3JlVHlwZSB9IGZvciBjdXN0b20gZW1vamkgc3RvcmFnZWAuZ3JlZW4pO1xuXG5cdGxldCBwYXRoID0gJ34vdXBsb2Fkcyc7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1vamlVcGxvYWRfRmlsZVN5c3RlbVBhdGgnKSAhPSBudWxsKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbW9qaVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpLnRyaW0oKSAhPT0gJycpIHtcblx0XHRcdHBhdGggPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1vamlVcGxvYWRfRmlsZVN5c3RlbVBhdGgnKTtcblx0XHR9XG5cdH1cblxuXHR0aGlzLlJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZSA9IG5ldyBSb2NrZXRDaGF0U3RvcmUoe1xuXHRcdG5hbWU6ICdjdXN0b21fZW1vamknLFxuXHRcdGFic29sdXRlUGF0aDogcGF0aFxuXHR9KTtcblxuXHRyZXR1cm4gV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoJy9lbW9qaS1jdXN0b20vJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihyZXEsIHJlcy8qLCBuZXh0Ki8pIHtcblx0XHRjb25zdCBwYXJhbXMgPVxuXHRcdFx0e2Vtb2ppOiBkZWNvZGVVUklDb21wb25lbnQocmVxLnVybC5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcPy4qJC8sICcnKSl9O1xuXG5cdFx0aWYgKF8uaXNFbXB0eShwYXJhbXMuZW1vamkpKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRyZXMud3JpdGUoJ0ZvcmJpZGRlbicpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZ2V0RmlsZVdpdGhSZWFkU3RyZWFtKGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXMuZW1vamkpKTtcblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nLCAnaW5saW5lJyk7XG5cblx0XHRpZiAoZmlsZSA9PSBudWxsKSB7XG5cdFx0XHQvL3VzZSBjb2RlIGZyb20gdXNlcm5hbWUgaW5pdGlhbHMgcmVuZGVyZXIgdW50aWwgZmlsZSB1cGxvYWQgaXMgY29tcGxldGVcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdpbWFnZS9zdmcreG1sJyk7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ3B1YmxpYywgbWF4LWFnZT0wJyk7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdFeHBpcmVzJywgJy0xJyk7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgJ1RodSwgMDEgSmFuIDIwMTUgMDA6MDA6MDAgR01UJyk7XG5cblx0XHRcdGNvbnN0IHJlcU1vZGlmaWVkSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2lmLW1vZGlmaWVkLXNpbmNlJ107XG5cdFx0XHRpZiAocmVxTW9kaWZpZWRIZWFkZXIgIT0gbnVsbCkge1xuXHRcdFx0XHRpZiAocmVxTW9kaWZpZWRIZWFkZXIgPT09ICdUaHUsIDAxIEphbiAyMDE1IDAwOjAwOjAwIEdNVCcpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDMwNCk7XG5cdFx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjb2xvciA9ICcjMDAwJztcblx0XHRcdGNvbnN0IGluaXRpYWxzID0gJz8nO1xuXG5cdFx0XHRjb25zdCBzdmcgPSBgPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIiBzdGFuZGFsb25lPVwibm9cIj8+XG48c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBwb2ludGVyLWV2ZW50cz1cIm5vbmVcIiB3aWR0aD1cIjUwXCIgaGVpZ2h0PVwiNTBcIiBzdHlsZT1cIndpZHRoOiA1MHB4OyBoZWlnaHQ6IDUwcHg7IGJhY2tncm91bmQtY29sb3I6ICR7IGNvbG9yIH07XCI+XG5cdDx0ZXh0IHRleHQtYW5jaG9yPVwibWlkZGxlXCIgeT1cIjUwJVwiIHg9XCI1MCVcIiBkeT1cIjAuMzZlbVwiIHBvaW50ZXItZXZlbnRzPVwiYXV0b1wiIGZpbGw9XCIjZmZmZmZmXCIgZm9udC1mYW1pbHk9XCJIZWx2ZXRpY2EsIEFyaWFsLCBMdWNpZGEgR3JhbmRlLCBzYW5zLXNlcmlmXCIgc3R5bGU9XCJmb250LXdlaWdodDogNDAwOyBmb250LXNpemU6IDI4cHg7XCI+XG5cdFx0JHsgaW5pdGlhbHMgfVxuXHQ8L3RleHQ+XG48L3N2Zz5gO1xuXG5cdFx0XHRyZXMud3JpdGUoc3ZnKTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRsZXQgZmlsZVVwbG9hZERhdGUgPSB1bmRlZmluZWQ7XG5cdFx0aWYgKGZpbGUudXBsb2FkRGF0ZSAhPSBudWxsKSB7XG5cdFx0XHRmaWxlVXBsb2FkRGF0ZSA9IGZpbGUudXBsb2FkRGF0ZS50b1VUQ1N0cmluZygpO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJlcU1vZGlmaWVkSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2lmLW1vZGlmaWVkLXNpbmNlJ107XG5cdFx0aWYgKHJlcU1vZGlmaWVkSGVhZGVyICE9IG51bGwpIHtcblx0XHRcdGlmIChyZXFNb2RpZmllZEhlYWRlciA9PT0gZmlsZVVwbG9hZERhdGUpIHtcblx0XHRcdFx0cmVzLnNldEhlYWRlcignTGFzdC1Nb2RpZmllZCcsIHJlcU1vZGlmaWVkSGVhZGVyKTtcblx0XHRcdFx0cmVzLndyaXRlSGVhZCgzMDQpO1xuXHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ3B1YmxpYywgbWF4LWFnZT0wJyk7XG5cdFx0cmVzLnNldEhlYWRlcignRXhwaXJlcycsICctMScpO1xuXHRcdGlmIChmaWxlVXBsb2FkRGF0ZSAhPSBudWxsKSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgZmlsZVVwbG9hZERhdGUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgbmV3IERhdGUoKS50b1VUQ1N0cmluZygpKTtcblx0XHR9XG5cdFx0aWYgKC9ec3ZnJC9pLnRlc3QocGFyYW1zLmVtb2ppLnNwbGl0KCcuJykucG9wKCkpKSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnaW1hZ2Uvc3ZnK3htbCcpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnaW1hZ2UvanBlZycpO1xuXHRcdH1cblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUubGVuZ3RoKTtcblxuXHRcdGZpbGUucmVhZFN0cmVhbS5waXBlKHJlcyk7XG5cdH0pKTtcbn0pO1xuIiwiUm9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnRW1vamlDdXN0b21GaWxlc3lzdGVtJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdFbW9qaVVwbG9hZF9TdG9yYWdlX1R5cGUnLCAnR3JpZEZTJywge1xuXHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdHZhbHVlczogW3tcblx0XHRcdGtleTogJ0dyaWRGUycsXG5cdFx0XHRpMThuTGFiZWw6ICdHcmlkRlMnXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnRmlsZVN5c3RlbScsXG5cdFx0XHRpMThuTGFiZWw6ICdGaWxlU3lzdGVtJ1xuXHRcdH1dLFxuXHRcdGkxOG5MYWJlbDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJ1xuXHR9KTtcblxuXHR0aGlzLmFkZCgnRW1vamlVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCAnJywge1xuXHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRfaWQ6ICdFbW9qaVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0dmFsdWU6ICdGaWxlU3lzdGVtJ1xuXHRcdH0sXG5cdFx0aTE4bkxhYmVsOiAnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCdcblx0fSk7XG59KTtcbiIsImNsYXNzIEVtb2ppQ3VzdG9tIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcignY3VzdG9tX2Vtb2ppJyk7XG5cblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ25hbWUnOiAxIH0pO1xuXHRcdHRoaXMudHJ5RW5zdXJlSW5kZXgoeyAnYWxpYXNlcyc6IDEgfSk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICdleHRlbnNpb24nOiAxfSk7XG5cdH1cblxuXHQvL2ZpbmQgb25lXG5cdGZpbmRPbmVCeUlEKF9pZCwgb3B0aW9ucykge1xuXHRcdHJldHVybiB0aGlzLmZpbmRPbmUoX2lkLCBvcHRpb25zKTtcblx0fVxuXG5cdC8vZmluZFxuXHRmaW5kQnlOYW1lT3JBbGlhcyhuYW1lLCBvcHRpb25zKSB7XG5cdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHQkb3I6IFtcblx0XHRcdFx0e25hbWV9LFxuXHRcdFx0XHR7YWxpYXNlczogbmFtZX1cblx0XHRcdF1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMuZmluZChxdWVyeSwgb3B0aW9ucyk7XG5cdH1cblxuXHRmaW5kQnlOYW1lT3JBbGlhc0V4Y2VwdElEKG5hbWUsIGV4Y2VwdCwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdFx0X2lkOiB7ICRuaW46IFsgZXhjZXB0IF0gfSxcblx0XHRcdCRvcjogW1xuXHRcdFx0XHR7bmFtZX0sXG5cdFx0XHRcdHthbGlhc2VzOiBuYW1lfVxuXHRcdFx0XVxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcblx0fVxuXG5cblx0Ly91cGRhdGVcblx0c2V0TmFtZShfaWQsIG5hbWUpIHtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdG5hbWVcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtfaWR9LCB1cGRhdGUpO1xuXHR9XG5cblx0c2V0QWxpYXNlcyhfaWQsIGFsaWFzZXMpIHtcblx0XHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0XHQkc2V0OiB7XG5cdFx0XHRcdGFsaWFzZXNcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtfaWR9LCB1cGRhdGUpO1xuXHR9XG5cblx0c2V0RXh0ZW5zaW9uKF9pZCwgZXh0ZW5zaW9uKSB7XG5cdFx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdFx0JHNldDoge1xuXHRcdFx0XHRleHRlbnNpb25cblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXMudXBkYXRlKHtfaWR9LCB1cGRhdGUpO1xuXHR9XG5cblx0Ly8gSU5TRVJUXG5cdGNyZWF0ZShkYXRhKSB7XG5cdFx0cmV0dXJuIHRoaXMuaW5zZXJ0KGRhdGEpO1xuXHR9XG5cblxuXHQvLyBSRU1PVkVcblx0cmVtb3ZlQnlJRChfaWQpIHtcblx0XHRyZXR1cm4gdGhpcy5yZW1vdmUoX2lkKTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbSA9IG5ldyBFbW9qaUN1c3RvbSgpO1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5NZXRlb3IucHVibGlzaCgnZnVsbEVtb2ppRGF0YScsIGZ1bmN0aW9uKGZpbHRlciwgbGltaXQpIHtcblx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdHJldHVybiB0aGlzLnJlYWR5KCk7XG5cdH1cblxuXHRjb25zdCBmaWVsZHMgPSB7XG5cdFx0bmFtZTogMSxcblx0XHRhbGlhc2VzOiAxLFxuXHRcdGV4dGVuc2lvbjogMVxuXHR9O1xuXG5cdGZpbHRlciA9IHMudHJpbShmaWx0ZXIpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0ZmllbGRzLFxuXHRcdGxpbWl0LFxuXHRcdHNvcnQ6IHsgbmFtZTogMSB9XG5cdH07XG5cblx0aWYgKGZpbHRlcikge1xuXHRcdGNvbnN0IGZpbHRlclJlZyA9IG5ldyBSZWdFeHAocy5lc2NhcGVSZWdFeHAoZmlsdGVyKSwgJ2knKTtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZEJ5TmFtZU9yQWxpYXMoZmlsdGVyUmVnLCBvcHRpb25zKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kKHt9LCBvcHRpb25zKTtcbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHRsaXN0RW1vamlDdXN0b20oKSB7XG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLmZpbmQoe30pLmZldGNoKCk7XG5cdH1cbn0pO1xuIiwiLyogZ2xvYmFscyBSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UgKi9cbk1ldGVvci5tZXRob2RzKHtcblx0ZGVsZXRlRW1vamlDdXN0b20oZW1vamlJRCkge1xuXHRcdGxldCBlbW9qaSA9IG51bGw7XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWVtb2ppJykpIHtcblx0XHRcdGVtb2ppID0gUm9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uZmluZE9uZUJ5SUQoZW1vamlJRCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKGVtb2ppID09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0N1c3RvbV9FbW9qaV9FcnJvcl9JbnZhbGlkX0Vtb2ppJywgJ0ludmFsaWQgZW1vamknLCB7IG1ldGhvZDogJ2RlbGV0ZUVtb2ppQ3VzdG9tJyB9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppLm5hbWUgfS4keyBlbW9qaS5leHRlbnNpb24gfWApKTtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5yZW1vdmVCeUlEKGVtb2ppSUQpO1xuXHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlMb2dnZWQoJ2RlbGV0ZUVtb2ppQ3VzdG9tJywge2Vtb2ppRGF0YTogZW1vaml9KTtcblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRpbnNlcnRPclVwZGF0ZUVtb2ppKGVtb2ppRGF0YSkge1xuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnbWFuYWdlLWVtb2ppJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ25vdF9hdXRob3JpemVkJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFzLnRyaW0oZW1vamlEYXRhLm5hbWUpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci10aGUtZmllbGQtaXMtcmVxdWlyZWQnLCAnVGhlIGZpZWxkIE5hbWUgaXMgcmVxdWlyZWQnLCB7IG1ldGhvZDogJ2luc2VydE9yVXBkYXRlRW1vamknLCBmaWVsZDogJ05hbWUnIH0pO1xuXHRcdH1cblxuXHRcdC8vYWxsb3cgYWxsIGNoYXJhY3RlcnMgZXhjZXB0IGNvbG9uLCB3aGl0ZXNwYWNlLCBjb21tYSwgPiwgPCwgJiwgXCIsICcsIC8sIFxcLCAoLCApXG5cdFx0Ly9tb3JlIHByYWN0aWNhbCB0aGFuIGFsbG93aW5nIHNwZWNpZmljIHNldHMgb2YgY2hhcmFjdGVyczsgYWxzbyBhbGxvd3MgZm9yZWlnbiBsYW5ndWFnZXNcblx0XHRjb25zdCBuYW1lVmFsaWRhdGlvbiA9IC9bXFxzLDo+PCZcIidcXC9cXFxcXFwoXFwpXS87XG5cdFx0Y29uc3QgYWxpYXNWYWxpZGF0aW9uID0gL1s6PjwmXFx8XCInXFwvXFxcXFxcKFxcKV0vO1xuXG5cdFx0Ly9zaWxlbnRseSBzdHJpcCBjb2xvbjsgdGhpcyBhbGxvd3MgZm9yIHVwbG9hZGluZyA6ZW1vamluYW1lOiBhcyBlbW9qaW5hbWVcblx0XHRlbW9qaURhdGEubmFtZSA9IGVtb2ppRGF0YS5uYW1lLnJlcGxhY2UoLzovZywgJycpO1xuXHRcdGVtb2ppRGF0YS5hbGlhc2VzID0gZW1vamlEYXRhLmFsaWFzZXMucmVwbGFjZSgvOi9nLCAnJyk7XG5cblx0XHRpZiAobmFtZVZhbGlkYXRpb24udGVzdChlbW9qaURhdGEubmFtZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWlucHV0LWlzLW5vdC1hLXZhbGlkLWZpZWxkJywgYCR7IGVtb2ppRGF0YS5uYW1lIH0gaXMgbm90IGEgdmFsaWQgbmFtZWAsIHsgbWV0aG9kOiAnaW5zZXJ0T3JVcGRhdGVFbW9qaScsIGlucHV0OiBlbW9qaURhdGEubmFtZSwgZmllbGQ6ICdOYW1lJyB9KTtcblx0XHR9XG5cblx0XHRpZiAoZW1vamlEYXRhLmFsaWFzZXMpIHtcblx0XHRcdGlmIChhbGlhc1ZhbGlkYXRpb24udGVzdChlbW9qaURhdGEuYWxpYXNlcykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW5wdXQtaXMtbm90LWEtdmFsaWQtZmllbGQnLCBgJHsgZW1vamlEYXRhLmFsaWFzZXMgfSBpcyBub3QgYSB2YWxpZCBhbGlhcyBzZXRgLCB7IG1ldGhvZDogJ2luc2VydE9yVXBkYXRlRW1vamknLCBpbnB1dDogZW1vamlEYXRhLmFsaWFzZXMsIGZpZWxkOiAnQWxpYXNfU2V0JyB9KTtcblx0XHRcdH1cblx0XHRcdGVtb2ppRGF0YS5hbGlhc2VzID0gZW1vamlEYXRhLmFsaWFzZXMuc3BsaXQoL1tcXHMsXS8pO1xuXHRcdFx0ZW1vamlEYXRhLmFsaWFzZXMgPSBlbW9qaURhdGEuYWxpYXNlcy5maWx0ZXIoQm9vbGVhbik7XG5cdFx0XHRlbW9qaURhdGEuYWxpYXNlcyA9IF8ud2l0aG91dChlbW9qaURhdGEuYWxpYXNlcywgZW1vamlEYXRhLm5hbWUpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRlbW9qaURhdGEuYWxpYXNlcyA9IFtdO1xuXHRcdH1cblxuXHRcdGxldCBtYXRjaGluZ1Jlc3VsdHMgPSBbXTtcblxuXHRcdGlmIChlbW9qaURhdGEuX2lkKSB7XG5cdFx0XHRtYXRjaGluZ1Jlc3VsdHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kQnlOYW1lT3JBbGlhc0V4Y2VwdElEKGVtb2ppRGF0YS5uYW1lLCBlbW9qaURhdGEuX2lkKS5mZXRjaCgpO1xuXHRcdFx0Zm9yIChjb25zdCBhbGlhcyBvZiBlbW9qaURhdGEuYWxpYXNlcykge1xuXHRcdFx0XHRtYXRjaGluZ1Jlc3VsdHMgPSBtYXRjaGluZ1Jlc3VsdHMuY29uY2F0KFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLmZpbmRCeU5hbWVPckFsaWFzRXhjZXB0SUQoYWxpYXMsIGVtb2ppRGF0YS5faWQpLmZldGNoKCkpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRtYXRjaGluZ1Jlc3VsdHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kQnlOYW1lT3JBbGlhcyhlbW9qaURhdGEubmFtZSkuZmV0Y2goKTtcblx0XHRcdGZvciAoY29uc3QgYWxpYXMgb2YgZW1vamlEYXRhLmFsaWFzZXMpIHtcblx0XHRcdFx0bWF0Y2hpbmdSZXN1bHRzID0gbWF0Y2hpbmdSZXN1bHRzLmNvbmNhdChSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5maW5kQnlOYW1lT3JBbGlhcyhhbGlhcykuZmV0Y2goKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG1hdGNoaW5nUmVzdWx0cy5sZW5ndGggPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdDdXN0b21fRW1vamlfRXJyb3JfTmFtZV9Pcl9BbGlhc19BbHJlYWR5X0luX1VzZScsICdUaGUgY3VzdG9tIGVtb2ppIG9yIG9uZSBvZiBpdHMgYWxpYXNlcyBpcyBhbHJlYWR5IGluIHVzZScsIHsgbWV0aG9kOiAnaW5zZXJ0T3JVcGRhdGVFbW9qaScgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFlbW9qaURhdGEuX2lkKSB7XG5cdFx0XHQvL2luc2VydCBlbW9qaVxuXHRcdFx0Y29uc3QgY3JlYXRlRW1vamkgPSB7XG5cdFx0XHRcdG5hbWU6IGVtb2ppRGF0YS5uYW1lLFxuXHRcdFx0XHRhbGlhc2VzOiBlbW9qaURhdGEuYWxpYXNlcyxcblx0XHRcdFx0ZXh0ZW5zaW9uOiBlbW9qaURhdGEuZXh0ZW5zaW9uXG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBfaWQgPSBSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5jcmVhdGUoY3JlYXRlRW1vamkpO1xuXG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCd1cGRhdGVFbW9qaUN1c3RvbScsIHtlbW9qaURhdGE6IGNyZWF0ZUVtb2ppfSk7XG5cblx0XHRcdHJldHVybiBfaWQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vdXBkYXRlIGVtb2ppXG5cdFx0XHRpZiAoZW1vamlEYXRhLm5ld0ZpbGUpIHtcblx0XHRcdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaURhdGEubmFtZSB9LiR7IGVtb2ppRGF0YS5leHRlbnNpb24gfWApKTtcblx0XHRcdFx0Um9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmRlbGV0ZUZpbGUoZW5jb2RlVVJJQ29tcG9uZW50KGAkeyBlbW9qaURhdGEubmFtZSB9LiR7IGVtb2ppRGF0YS5wcmV2aW91c0V4dGVuc2lvbiB9YCkpO1xuXHRcdFx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5wcmV2aW91c05hbWUgfS4keyBlbW9qaURhdGEuZXh0ZW5zaW9uIH1gKSk7XG5cdFx0XHRcdFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5kZWxldGVGaWxlKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLnByZXZpb3VzTmFtZSB9LiR7IGVtb2ppRGF0YS5wcmV2aW91c0V4dGVuc2lvbiB9YCkpO1xuXG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLnNldEV4dGVuc2lvbihlbW9qaURhdGEuX2lkLCBlbW9qaURhdGEuZXh0ZW5zaW9uKTtcblx0XHRcdH0gZWxzZSBpZiAoZW1vamlEYXRhLm5hbWUgIT09IGVtb2ppRGF0YS5wcmV2aW91c05hbWUpIHtcblx0XHRcdFx0Y29uc3QgcnMgPSBSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZ2V0RmlsZVdpdGhSZWFkU3RyZWFtKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLnByZXZpb3VzTmFtZSB9LiR7IGVtb2ppRGF0YS5wcmV2aW91c0V4dGVuc2lvbiB9YCkpO1xuXHRcdFx0XHRpZiAocnMgIT09IG51bGwpIHtcblx0XHRcdFx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5uYW1lIH0uJHsgZW1vamlEYXRhLmV4dGVuc2lvbiB9YCkpO1xuXHRcdFx0XHRcdGNvbnN0IHdzID0gUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmNyZWF0ZVdyaXRlU3RyZWFtKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLm5hbWUgfS4keyBlbW9qaURhdGEucHJldmlvdXNFeHRlbnNpb24gfWApLCBycy5jb250ZW50VHlwZSk7XG5cdFx0XHRcdFx0d3Mub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKCkgPT5cblx0XHRcdFx0XHRcdFJvY2tldENoYXRGaWxlRW1vamlDdXN0b21JbnN0YW5jZS5kZWxldGVGaWxlKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLnByZXZpb3VzTmFtZSB9LiR7IGVtb2ppRGF0YS5wcmV2aW91c0V4dGVuc2lvbiB9YCkpXG5cdFx0XHRcdFx0KSk7XG5cdFx0XHRcdFx0cnMucmVhZFN0cmVhbS5waXBlKHdzKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZW1vamlEYXRhLm5hbWUgIT09IGVtb2ppRGF0YS5wcmV2aW91c05hbWUpIHtcblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuRW1vamlDdXN0b20uc2V0TmFtZShlbW9qaURhdGEuX2lkLCBlbW9qaURhdGEubmFtZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChlbW9qaURhdGEuYWxpYXNlcykge1xuXHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5FbW9qaUN1c3RvbS5zZXRBbGlhc2VzKGVtb2ppRGF0YS5faWQsIGVtb2ppRGF0YS5hbGlhc2VzKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLkVtb2ppQ3VzdG9tLnNldEFsaWFzZXMoZW1vamlEYXRhLl9pZCwgW10pO1xuXHRcdFx0fVxuXG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCd1cGRhdGVFbW9qaUN1c3RvbScsIHtlbW9qaURhdGF9KTtcblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlICovXG5NZXRlb3IubWV0aG9kcyh7XG5cdHVwbG9hZEVtb2ppQ3VzdG9tKGJpbmFyeUNvbnRlbnQsIGNvbnRlbnRUeXBlLCBlbW9qaURhdGEpIHtcblx0XHRpZiAoIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ21hbmFnZS1lbW9qaScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdub3RfYXV0aG9yaXplZCcpO1xuXHRcdH1cblxuXHRcdC8vZGVsZXRlIGFsaWFzZXMgZm9yIG5vdGlmaWNhdGlvbiBwdXJwb3Nlcy4gaGVyZSwgaXQgaXMgYSBzdHJpbmcgcmF0aGVyIHRoYW4gYW4gYXJyYXlcblx0XHRkZWxldGUgZW1vamlEYXRhLmFsaWFzZXM7XG5cdFx0Y29uc3QgZmlsZSA9IG5ldyBCdWZmZXIoYmluYXJ5Q29udGVudCwgJ2JpbmFyeScpO1xuXG5cdFx0Y29uc3QgcnMgPSBSb2NrZXRDaGF0RmlsZS5idWZmZXJUb1N0cmVhbShmaWxlKTtcblx0XHRSb2NrZXRDaGF0RmlsZUVtb2ppQ3VzdG9tSW5zdGFuY2UuZGVsZXRlRmlsZShlbmNvZGVVUklDb21wb25lbnQoYCR7IGVtb2ppRGF0YS5uYW1lIH0uJHsgZW1vamlEYXRhLmV4dGVuc2lvbiB9YCkpO1xuXHRcdGNvbnN0IHdzID0gUm9ja2V0Q2hhdEZpbGVFbW9qaUN1c3RvbUluc3RhbmNlLmNyZWF0ZVdyaXRlU3RyZWFtKGVuY29kZVVSSUNvbXBvbmVudChgJHsgZW1vamlEYXRhLm5hbWUgfS4keyBlbW9qaURhdGEuZXh0ZW5zaW9uIH1gKSwgY29udGVudFR5cGUpO1xuXHRcdHdzLm9uKCdlbmQnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+XG5cdFx0XHRNZXRlb3Iuc2V0VGltZW91dCgoKSA9PiBSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCd1cGRhdGVFbW9qaUN1c3RvbScsIHtlbW9qaURhdGF9KSwgNTAwKVxuXHRcdCkpO1xuXG5cdFx0cnMucGlwZSh3cyk7XG5cdH1cbn0pO1xuIl19
