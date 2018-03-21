(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var settings;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings":{"server":{"functions":{"saveReactWhenReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveReactWhenReadOnly.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveReactWhenReadOnly = function (rid, allowReact) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveReactWhenReadOnly'
    });
  }

  return RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById(rid, allowReact);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomType.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomType.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomType = function (rid, roomType, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  if (roomType !== 'c' && roomType !== 'p') {
    throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
      'function': 'RocketChat.saveRoomType',
      type: roomType
    });
  }

  const room = RocketChat.models.Rooms.findOneById(rid);

  if (room == null) {
    throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
      'function': 'RocketChat.saveRoomType',
      _id: rid
    });
  }

  if (room.t === 'd') {
    throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
      'function': 'RocketChat.saveRoomType'
    });
  }

  const result = RocketChat.models.Rooms.setTypeById(rid, roomType) && RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType);

  if (result && sendMessage) {
    let message;

    if (roomType === 'c') {
      message = TAPi18n.__('Channel', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    } else {
      message = TAPi18n.__('Private_Group', {
        lng: user && user.language || RocketChat.settings.get('language') || 'en'
      });
    }

    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_privacy', rid, message, user);
  }

  return result;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomTopic.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomTopic.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomTopic = function (rid, roomTopic, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomTopic'
    });
  }

  roomTopic = s.escapeHTML(roomTopic);
  const update = RocketChat.models.Rooms.setTopicById(rid, roomTopic);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_topic', rid, roomTopic, user);
  }

  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomAnnouncement.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomAnnouncement.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomAnnouncement = function (rid, roomAnnouncement, user, sendMessage = true) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      function: 'RocketChat.saveRoomAnnouncement'
    });
  }

  roomAnnouncement = s.escapeHTML(roomAnnouncement);
  const updated = RocketChat.models.Rooms.setAnnouncementById(rid, roomAnnouncement);

  if (updated && sendMessage) {
    RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_announcement', rid, roomAnnouncement, user);
  }

  return updated;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomName.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomName.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomName = function (rid, displayName, user, sendMessage = true) {
  const room = RocketChat.models.Rooms.findOneById(rid);

  if (RocketChat.roomTypes.roomTypes[room.t].preventRenaming()) {
    throw new Meteor.Error('error-not-allowed', 'Not allowed', {
      'function': 'RocketChat.saveRoomdisplayName'
    });
  }

  if (displayName === room.name) {
    return;
  }

  const slugifiedRoomName = RocketChat.getValidRoomName(displayName, rid);
  const update = RocketChat.models.Rooms.setNameById(rid, slugifiedRoomName, displayName) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

  if (update && sendMessage) {
    RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, displayName, user);
  }

  return displayName;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomReadOnly.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomReadOnly.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomReadOnly = function (rid, readOnly) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomReadOnly'
    });
  }

  return RocketChat.models.Rooms.setReadOnlyById(rid, readOnly);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomDescription.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomDescription.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let s;
module.watch(require("underscore.string"), {
  default(v) {
    s = v;
  }

}, 0);

RocketChat.saveRoomDescription = function (rid, roomDescription, user) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomDescription'
    });
  }

  const escapedRoomDescription = s.escapeHTML(roomDescription);
  const update = RocketChat.models.Rooms.setDescriptionById(rid, escapedRoomDescription);
  RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_description', rid, escapedRoomDescription, user);
  return update;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRoomSystemMessages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/functions/saveRoomSystemMessages.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.saveRoomSystemMessages = function (rid, systemMessages) {
  if (!Match.test(rid, String)) {
    throw new Meteor.Error('invalid-room', 'Invalid room', {
      'function': 'RocketChat.saveRoomSystemMessages'
    });
  }

  return RocketChat.models.Rooms.setSystemMessagesById(rid, systemMessages);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"saveRoomSettings.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/methods/saveRoomSettings.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions'];
Meteor.methods({
  saveRoomSettings(rid, settings, value) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        'function': 'RocketChat.saveRoomName'
      });
    }

    if (!Match.test(rid, String)) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    if (typeof settings !== 'object') {
      settings = {
        [settings]: value
      };
    }

    if (!Object.keys(settings).every(key => fields.includes(key))) {
      throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
        method: 'saveRoomSettings'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)) {
      throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
        method: 'saveRoomSettings',
        action: 'Editing_room'
      });
    }

    const room = RocketChat.models.Rooms.findOneById(rid);

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'saveRoomSettings'
      });
    }

    const user = Meteor.user();
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      if (settings === 'default' && !RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
        throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
          method: 'saveRoomSettings',
          action: 'Viewing_room_administration'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(this.userId, 'create-c')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }

      if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(this.userId, 'create-p')) {
        throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
          method: 'saveRoomSettings',
          action: 'Change_Room_Type'
        });
      }
    });
    Object.keys(settings).forEach(setting => {
      const value = settings[setting];

      switch (setting) {
        case 'roomName':
          RocketChat.saveRoomName(rid, value, user);
          break;

        case 'roomTopic':
          if (value !== room.topic) {
            RocketChat.saveRoomTopic(rid, value, user);
          }

          break;

        case 'roomAnnouncement':
          if (value !== room.announcement) {
            RocketChat.saveRoomAnnouncement(rid, value, user);
          }

          break;

        case 'roomDescription':
          if (value !== room.description) {
            RocketChat.saveRoomDescription(rid, value, user);
          }

          break;

        case 'roomType':
          if (value !== room.t) {
            RocketChat.saveRoomType(rid, value, user);
          }

          break;

        case 'tokenpass':
          check(value, {
            require: String,
            tokens: [{
              token: String,
              balance: String
            }]
          });
          RocketChat.saveRoomTokenpass(rid, value);
          break;

        case 'streamingOptions':
          RocketChat.saveStreamingOptions(rid, value);
          break;

        case 'readOnly':
          if (value !== room.ro) {
            RocketChat.saveRoomReadOnly(rid, value, user);
          }

          break;

        case 'reactWhenReadOnly':
          if (value !== room.reactWhenReadOnly) {
            RocketChat.saveReactWhenReadOnly(rid, value, user);
          }

          break;

        case 'systemMessages':
          if (value !== room.sysMes) {
            RocketChat.saveRoomSystemMessages(rid, value, user);
          }

          break;

        case 'joinCode':
          RocketChat.models.Rooms.setJoinCodeById(rid, String(value));
          break;

        case 'default':
          RocketChat.models.Rooms.saveDefaultById(rid, value);
      }
    });
    return {
      result: true,
      rid: room._id
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"Messages.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Messages.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser = function (type, roomId, message, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser(type, roomId, message, user, extraData);
};

RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser = function (roomId, roomName, user, extraData) {
  return this.createWithTypeRoomIdMessageAndUser('r', roomId, roomName, user, extraData);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Rooms.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/models/Rooms.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.models.Rooms.setDescriptionById = function (_id, description) {
  const query = {
    _id
  };
  const update = {
    $set: {
      description
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setReadOnlyById = function (_id, readOnly) {
  const query = {
    _id
  };
  const update = {
    $set: {
      ro: readOnly
    }
  };

  if (readOnly) {
    RocketChat.models.Subscriptions.findByRoomId(_id).forEach(function (subscription) {
      if (subscription._user == null) {
        return;
      }

      const user = subscription._user;

      if (RocketChat.authz.hasPermission(user._id, 'post-readonly') === false) {
        if (!update.$set.muted) {
          update.$set.muted = [];
        }

        return update.$set.muted.push(user.username);
      }
    });
  } else {
    update.$unset = {
      muted: ''
    };
  }

  return this.update(query, update);
};

RocketChat.models.Rooms.setAllowReactingWhenReadOnlyById = function (_id, allowReacting) {
  const query = {
    _id
  };
  const update = {
    $set: {
      reactWhenReadOnly: allowReacting
    }
  };
  return this.update(query, update);
};

RocketChat.models.Rooms.setSystemMessagesById = function (_id, systemMessages) {
  const query = {
    _id
  };
  const update = {
    $set: {
      sysMes: systemMessages
    }
  };
  return this.update(query, update);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_channel-settings/server/startup.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
Meteor.startup(function () {
  RocketChat.models.Permissions.upsert('post-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner', 'moderator']
    }
  });
  RocketChat.models.Permissions.upsert('set-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
  RocketChat.models.Permissions.upsert('set-react-when-readonly', {
    $setOnInsert: {
      roles: ['admin', 'owner']
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveReactWhenReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomType.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomTopic.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomAnnouncement.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomName.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomReadOnly.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomDescription.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/functions/saveRoomSystemMessages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/methods/saveRoomSettings.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Messages.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/models/Rooms.js");
require("/node_modules/meteor/rocketchat:channel-settings/server/startup.js");

/* Exports */
Package._define("rocketchat:channel-settings");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9mdW5jdGlvbnMvc2F2ZVJlYWN0V2hlblJlYWRPbmx5LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbVR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tVG9waWMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tQW5ub3VuY2VtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL2Z1bmN0aW9ucy9zYXZlUm9vbU5hbWUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tUmVhZE9ubHkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tRGVzY3JpcHRpb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvZnVuY3Rpb25zL3NhdmVSb29tU3lzdGVtTWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvbWV0aG9kcy9zYXZlUm9vbVNldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3Mvc2VydmVyL21vZGVscy9NZXNzYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzL3NlcnZlci9tb2RlbHMvUm9vbXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Y2hhbm5lbC1zZXR0aW5ncy9zZXJ2ZXIvc3RhcnR1cC5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2F2ZVJlYWN0V2hlblJlYWRPbmx5IiwicmlkIiwiYWxsb3dSZWFjdCIsIk1hdGNoIiwidGVzdCIsIlN0cmluZyIsIk1ldGVvciIsIkVycm9yIiwiZnVuY3Rpb24iLCJtb2RlbHMiLCJSb29tcyIsInNldEFsbG93UmVhY3RpbmdXaGVuUmVhZE9ubHlCeUlkIiwic2F2ZVJvb21UeXBlIiwicm9vbVR5cGUiLCJ1c2VyIiwic2VuZE1lc3NhZ2UiLCJ0eXBlIiwicm9vbSIsImZpbmRPbmVCeUlkIiwiX2lkIiwidCIsInJlc3VsdCIsInNldFR5cGVCeUlkIiwiU3Vic2NyaXB0aW9ucyIsInVwZGF0ZVR5cGVCeVJvb21JZCIsIm1lc3NhZ2UiLCJUQVBpMThuIiwiX18iLCJsbmciLCJsYW5ndWFnZSIsInNldHRpbmdzIiwiZ2V0IiwiTWVzc2FnZXMiLCJjcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsInMiLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInNhdmVSb29tVG9waWMiLCJyb29tVG9waWMiLCJlc2NhcGVIVE1MIiwidXBkYXRlIiwic2V0VG9waWNCeUlkIiwic2F2ZVJvb21Bbm5vdW5jZW1lbnQiLCJyb29tQW5ub3VuY2VtZW50IiwidXBkYXRlZCIsInNldEFubm91bmNlbWVudEJ5SWQiLCJzYXZlUm9vbU5hbWUiLCJkaXNwbGF5TmFtZSIsInJvb21UeXBlcyIsInByZXZlbnRSZW5hbWluZyIsIm5hbWUiLCJzbHVnaWZpZWRSb29tTmFtZSIsImdldFZhbGlkUm9vbU5hbWUiLCJzZXROYW1lQnlJZCIsInVwZGF0ZU5hbWVBbmRBbGVydEJ5Um9vbUlkIiwiY3JlYXRlUm9vbVJlbmFtZWRXaXRoUm9vbUlkUm9vbU5hbWVBbmRVc2VyIiwic2F2ZVJvb21SZWFkT25seSIsInJlYWRPbmx5Iiwic2V0UmVhZE9ubHlCeUlkIiwic2F2ZVJvb21EZXNjcmlwdGlvbiIsInJvb21EZXNjcmlwdGlvbiIsImVzY2FwZWRSb29tRGVzY3JpcHRpb24iLCJzZXREZXNjcmlwdGlvbkJ5SWQiLCJzYXZlUm9vbVN5c3RlbU1lc3NhZ2VzIiwic3lzdGVtTWVzc2FnZXMiLCJzZXRTeXN0ZW1NZXNzYWdlc0J5SWQiLCJmaWVsZHMiLCJtZXRob2RzIiwic2F2ZVJvb21TZXR0aW5ncyIsInZhbHVlIiwidXNlcklkIiwibWV0aG9kIiwiT2JqZWN0Iiwia2V5cyIsImV2ZXJ5Iiwia2V5IiwiaW5jbHVkZXMiLCJhdXRoeiIsImhhc1Blcm1pc3Npb24iLCJhY3Rpb24iLCJmb3JFYWNoIiwic2V0dGluZyIsInRvcGljIiwiYW5ub3VuY2VtZW50IiwiZGVzY3JpcHRpb24iLCJjaGVjayIsInRva2VucyIsInRva2VuIiwiYmFsYW5jZSIsInNhdmVSb29tVG9rZW5wYXNzIiwic2F2ZVN0cmVhbWluZ09wdGlvbnMiLCJybyIsInJlYWN0V2hlblJlYWRPbmx5Iiwic3lzTWVzIiwic2V0Sm9pbkNvZGVCeUlkIiwic2F2ZURlZmF1bHRCeUlkIiwicm9vbUlkIiwiZXh0cmFEYXRhIiwiY3JlYXRlV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlciIsInJvb21OYW1lIiwicXVlcnkiLCIkc2V0IiwiZmluZEJ5Um9vbUlkIiwic3Vic2NyaXB0aW9uIiwiX3VzZXIiLCJtdXRlZCIsInB1c2giLCJ1c2VybmFtZSIsIiR1bnNldCIsImFsbG93UmVhY3RpbmciLCJzdGFydHVwIiwiUGVybWlzc2lvbnMiLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJyb2xlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxXQUFXQyxxQkFBWCxHQUFtQyxVQUFTQyxHQUFULEVBQWNDLFVBQWQsRUFBMEI7QUFDNUQsTUFBSSxDQUFDQyxNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQUVDLGdCQUFVO0FBQVosS0FBakQsQ0FBTjtBQUNBOztBQUVELFNBQU9ULFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCQyxnQ0FBeEIsQ0FBeURWLEdBQXpELEVBQThEQyxVQUE5RCxDQUFQO0FBQ0EsQ0FORCxDOzs7Ozs7Ozs7OztBQ0NBSCxXQUFXYSxZQUFYLEdBQTBCLFVBQVNYLEdBQVQsRUFBY1ksUUFBZCxFQUF3QkMsSUFBeEIsRUFBOEJDLGNBQWMsSUFBNUMsRUFBa0Q7QUFDM0UsTUFBSSxDQUFDWixNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQ3RELGtCQUFZO0FBRDBDLEtBQWpELENBQU47QUFHQTs7QUFDRCxNQUFJTSxhQUFhLEdBQWIsSUFBb0JBLGFBQWEsR0FBckMsRUFBMEM7QUFDekMsVUFBTSxJQUFJUCxPQUFPQyxLQUFYLENBQWlCLHlCQUFqQixFQUE0Qyx5QkFBNUMsRUFBdUU7QUFDNUUsa0JBQVkseUJBRGdFO0FBRTVFUyxZQUFNSDtBQUZzRSxLQUF2RSxDQUFOO0FBSUE7O0FBQ0QsUUFBTUksT0FBT2xCLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCUSxXQUF4QixDQUFvQ2pCLEdBQXBDLENBQWI7O0FBQ0EsTUFBSWdCLFFBQVEsSUFBWixFQUFrQjtBQUNqQixVQUFNLElBQUlYLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLG9CQUF2QyxFQUE2RDtBQUNsRSxrQkFBWSx5QkFEc0Q7QUFFbEVZLFdBQUtsQjtBQUY2RCxLQUE3RCxDQUFOO0FBSUE7O0FBQ0QsTUFBSWdCLEtBQUtHLENBQUwsS0FBVyxHQUFmLEVBQW9CO0FBQ25CLFVBQU0sSUFBSWQsT0FBT0MsS0FBWCxDQUFpQixtQkFBakIsRUFBc0Msb0NBQXRDLEVBQTRFO0FBQ2pGLGtCQUFZO0FBRHFFLEtBQTVFLENBQU47QUFHQTs7QUFDRCxRQUFNYyxTQUFTdEIsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JZLFdBQXhCLENBQW9DckIsR0FBcEMsRUFBeUNZLFFBQXpDLEtBQXNEZCxXQUFXVSxNQUFYLENBQWtCYyxhQUFsQixDQUFnQ0Msa0JBQWhDLENBQW1EdkIsR0FBbkQsRUFBd0RZLFFBQXhELENBQXJFOztBQUNBLE1BQUlRLFVBQVVOLFdBQWQsRUFBMkI7QUFDMUIsUUFBSVUsT0FBSjs7QUFDQSxRQUFJWixhQUFhLEdBQWpCLEVBQXNCO0FBQ3JCWSxnQkFBVUMsUUFBUUMsRUFBUixDQUFXLFNBQVgsRUFBc0I7QUFDL0JDLGFBQUtkLFFBQVFBLEtBQUtlLFFBQWIsSUFBeUI5QixXQUFXK0IsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBekIsSUFBZ0U7QUFEdEMsT0FBdEIsQ0FBVjtBQUdBLEtBSkQsTUFJTztBQUNOTixnQkFBVUMsUUFBUUMsRUFBUixDQUFXLGVBQVgsRUFBNEI7QUFDckNDLGFBQUtkLFFBQVFBLEtBQUtlLFFBQWIsSUFBeUI5QixXQUFXK0IsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsVUFBeEIsQ0FBekIsSUFBZ0U7QUFEaEMsT0FBNUIsQ0FBVjtBQUdBOztBQUNEaEMsZUFBV1UsTUFBWCxDQUFrQnVCLFFBQWxCLENBQTJCQyxxREFBM0IsQ0FBaUYsc0JBQWpGLEVBQXlHaEMsR0FBekcsRUFBOEd3QixPQUE5RyxFQUF1SFgsSUFBdkg7QUFDQTs7QUFDRCxTQUFPTyxNQUFQO0FBQ0EsQ0F2Q0QsQzs7Ozs7Ozs7Ozs7QUNEQSxJQUFJYSxDQUFKO0FBQU1DLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxtQkFBUixDQUFiLEVBQTBDO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQTFDLEVBQTRELENBQTVEOztBQUVOeEMsV0FBV3lDLGFBQVgsR0FBMkIsVUFBU3ZDLEdBQVQsRUFBY3dDLFNBQWQsRUFBeUIzQixJQUF6QixFQUErQkMsY0FBYyxJQUE3QyxFQUFtRDtBQUM3RSxNQUFJLENBQUNaLE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUNEa0MsY0FBWVAsRUFBRVEsVUFBRixDQUFhRCxTQUFiLENBQVo7QUFDQSxRQUFNRSxTQUFTNUMsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JrQyxZQUF4QixDQUFxQzNDLEdBQXJDLEVBQTBDd0MsU0FBMUMsQ0FBZjs7QUFDQSxNQUFJRSxVQUFVNUIsV0FBZCxFQUEyQjtBQUMxQmhCLGVBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQkMscURBQTNCLENBQWlGLG9CQUFqRixFQUF1R2hDLEdBQXZHLEVBQTRHd0MsU0FBNUcsRUFBdUgzQixJQUF2SDtBQUNBOztBQUNELFNBQU82QixNQUFQO0FBQ0EsQ0FaRCxDOzs7Ozs7Ozs7OztBQ0ZBLElBQUlULENBQUo7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7O0FBRU54QyxXQUFXOEMsb0JBQVgsR0FBa0MsVUFBUzVDLEdBQVQsRUFBYzZDLGdCQUFkLEVBQWdDaEMsSUFBaEMsRUFBc0NDLGNBQVksSUFBbEQsRUFBd0Q7QUFDekYsTUFBSSxDQUFDWixNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQUVDLGdCQUFVO0FBQVosS0FBakQsQ0FBTjtBQUNBOztBQUVEc0MscUJBQW1CWixFQUFFUSxVQUFGLENBQWFJLGdCQUFiLENBQW5CO0FBQ0EsUUFBTUMsVUFBVWhELFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCc0MsbUJBQXhCLENBQTRDL0MsR0FBNUMsRUFBaUQ2QyxnQkFBakQsQ0FBaEI7O0FBQ0EsTUFBSUMsV0FBV2hDLFdBQWYsRUFBNEI7QUFDM0JoQixlQUFXVSxNQUFYLENBQWtCdUIsUUFBbEIsQ0FBMkJDLHFEQUEzQixDQUFpRiwyQkFBakYsRUFBOEdoQyxHQUE5RyxFQUFtSDZDLGdCQUFuSCxFQUFxSWhDLElBQXJJO0FBQ0E7O0FBRUQsU0FBT2lDLE9BQVA7QUFDQSxDQVpELEM7Ozs7Ozs7Ozs7O0FDREFoRCxXQUFXa0QsWUFBWCxHQUEwQixVQUFTaEQsR0FBVCxFQUFjaUQsV0FBZCxFQUEyQnBDLElBQTNCLEVBQWlDQyxjQUFjLElBQS9DLEVBQXFEO0FBQzlFLFFBQU1FLE9BQU9sQixXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QlEsV0FBeEIsQ0FBb0NqQixHQUFwQyxDQUFiOztBQUNBLE1BQUlGLFdBQVdvRCxTQUFYLENBQXFCQSxTQUFyQixDQUErQmxDLEtBQUtHLENBQXBDLEVBQXVDZ0MsZUFBdkMsRUFBSixFQUE4RDtBQUM3RCxVQUFNLElBQUk5QyxPQUFPQyxLQUFYLENBQWlCLG1CQUFqQixFQUFzQyxhQUF0QyxFQUFxRDtBQUMxRCxrQkFBWTtBQUQ4QyxLQUFyRCxDQUFOO0FBR0E7O0FBQ0QsTUFBSTJDLGdCQUFnQmpDLEtBQUtvQyxJQUF6QixFQUErQjtBQUM5QjtBQUNBOztBQUVELFFBQU1DLG9CQUFvQnZELFdBQVd3RCxnQkFBWCxDQUE0QkwsV0FBNUIsRUFBeUNqRCxHQUF6QyxDQUExQjtBQUVBLFFBQU0wQyxTQUFTNUMsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0I4QyxXQUF4QixDQUFvQ3ZELEdBQXBDLEVBQXlDcUQsaUJBQXpDLEVBQTRESixXQUE1RCxLQUE0RW5ELFdBQVdVLE1BQVgsQ0FBa0JjLGFBQWxCLENBQWdDa0MsMEJBQWhDLENBQTJEeEQsR0FBM0QsRUFBZ0VxRCxpQkFBaEUsRUFBbUZKLFdBQW5GLENBQTNGOztBQUVBLE1BQUlQLFVBQVU1QixXQUFkLEVBQTJCO0FBQzFCaEIsZUFBV1UsTUFBWCxDQUFrQnVCLFFBQWxCLENBQTJCMEIsMENBQTNCLENBQXNFekQsR0FBdEUsRUFBMkVpRCxXQUEzRSxFQUF3RnBDLElBQXhGO0FBQ0E7O0FBQ0QsU0FBT29DLFdBQVA7QUFDQSxDQW5CRCxDOzs7Ozs7Ozs7OztBQ0RBbkQsV0FBVzRELGdCQUFYLEdBQThCLFVBQVMxRCxHQUFULEVBQWMyRCxRQUFkLEVBQXdCO0FBQ3JELE1BQUksQ0FBQ3pELE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUNELFNBQU9SLFdBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCbUQsZUFBeEIsQ0FBd0M1RCxHQUF4QyxFQUE2QzJELFFBQTdDLENBQVA7QUFDQSxDQVBELEM7Ozs7Ozs7Ozs7O0FDQUEsSUFBSTFCLENBQUo7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLG1CQUFSLENBQWIsRUFBMEM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLFFBQUVLLENBQUY7QUFBSTs7QUFBaEIsQ0FBMUMsRUFBNEQsQ0FBNUQ7O0FBRU54QyxXQUFXK0QsbUJBQVgsR0FBaUMsVUFBUzdELEdBQVQsRUFBYzhELGVBQWQsRUFBK0JqRCxJQUEvQixFQUFxQztBQUVyRSxNQUFJLENBQUNYLE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixVQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsY0FBakIsRUFBaUMsY0FBakMsRUFBaUQ7QUFDdEQsa0JBQVk7QUFEMEMsS0FBakQsQ0FBTjtBQUdBOztBQUNELFFBQU15RCx5QkFBeUI5QixFQUFFUSxVQUFGLENBQWFxQixlQUFiLENBQS9CO0FBQ0EsUUFBTXBCLFNBQVM1QyxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QnVELGtCQUF4QixDQUEyQ2hFLEdBQTNDLEVBQWdEK0Qsc0JBQWhELENBQWY7QUFDQWpFLGFBQVdVLE1BQVgsQ0FBa0J1QixRQUFsQixDQUEyQkMscURBQTNCLENBQWlGLDBCQUFqRixFQUE2R2hDLEdBQTdHLEVBQWtIK0Qsc0JBQWxILEVBQTBJbEQsSUFBMUk7QUFDQSxTQUFPNkIsTUFBUDtBQUNBLENBWEQsQzs7Ozs7Ozs7Ozs7QUNGQTVDLFdBQVdtRSxzQkFBWCxHQUFvQyxVQUFTakUsR0FBVCxFQUFja0UsY0FBZCxFQUE4QjtBQUNqRSxNQUFJLENBQUNoRSxNQUFNQyxJQUFOLENBQVdILEdBQVgsRUFBZ0JJLE1BQWhCLENBQUwsRUFBOEI7QUFDN0IsVUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGNBQWpCLEVBQWlDLGNBQWpDLEVBQWlEO0FBQ3RELGtCQUFZO0FBRDBDLEtBQWpELENBQU47QUFHQTs7QUFDRCxTQUFPUixXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QjBELHFCQUF4QixDQUE4Q25FLEdBQTlDLEVBQW1Ea0UsY0FBbkQsQ0FBUDtBQUNBLENBUEQsQzs7Ozs7Ozs7Ozs7QUNBQSxNQUFNRSxTQUFTLENBQUMsVUFBRCxFQUFhLFdBQWIsRUFBMEIsa0JBQTFCLEVBQThDLGlCQUE5QyxFQUFpRSxVQUFqRSxFQUE2RSxVQUE3RSxFQUF5RixtQkFBekYsRUFBOEcsZ0JBQTlHLEVBQWdJLFNBQWhJLEVBQTJJLFVBQTNJLEVBQXVKLFdBQXZKLEVBQW9LLGtCQUFwSyxDQUFmO0FBQ0EvRCxPQUFPZ0UsT0FBUCxDQUFlO0FBQ2RDLG1CQUFpQnRFLEdBQWpCLEVBQXNCNkIsUUFBdEIsRUFBZ0MwQyxLQUFoQyxFQUF1QztBQUN0QyxRQUFJLENBQUNsRSxPQUFPbUUsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSW5FLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVELG9CQUFZO0FBRGdELE9BQXZELENBQU47QUFHQTs7QUFDRCxRQUFJLENBQUNKLE1BQU1DLElBQU4sQ0FBV0gsR0FBWCxFQUFnQkksTUFBaEIsQ0FBTCxFQUE4QjtBQUM3QixZQUFNLElBQUlDLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEbUUsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUVELFFBQUksT0FBTzVDLFFBQVAsS0FBb0IsUUFBeEIsRUFBa0M7QUFDakNBLGlCQUFXO0FBQ1YsU0FBQ0EsUUFBRCxHQUFhMEM7QUFESCxPQUFYO0FBR0E7O0FBRUQsUUFBSSxDQUFDRyxPQUFPQyxJQUFQLENBQVk5QyxRQUFaLEVBQXNCK0MsS0FBdEIsQ0FBNEJDLE9BQU9ULE9BQU9VLFFBQVAsQ0FBZ0JELEdBQWhCLENBQW5DLENBQUwsRUFBK0Q7QUFDOUQsWUFBTSxJQUFJeEUsT0FBT0MsS0FBWCxDQUFpQix3QkFBakIsRUFBMkMsMkJBQTNDLEVBQXdFO0FBQzdFbUUsZ0JBQVE7QUFEcUUsT0FBeEUsQ0FBTjtBQUdBOztBQUVELFFBQUksQ0FBQzNFLFdBQVdpRixLQUFYLENBQWlCQyxhQUFqQixDQUErQjNFLE9BQU9tRSxNQUFQLEVBQS9CLEVBQWdELFdBQWhELEVBQTZEeEUsR0FBN0QsQ0FBTCxFQUF3RTtBQUN2RSxZQUFNLElBQUlLLE9BQU9DLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLDZCQUE3QyxFQUE0RTtBQUNqRm1FLGdCQUFRLGtCQUR5RTtBQUVqRlEsZ0JBQVE7QUFGeUUsT0FBNUUsQ0FBTjtBQUlBOztBQUdELFVBQU1qRSxPQUFPbEIsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JRLFdBQXhCLENBQW9DakIsR0FBcEMsQ0FBYjs7QUFDQSxRQUFJLENBQUNnQixJQUFMLEVBQVc7QUFDVixZQUFNLElBQUlYLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEbUUsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUVELFVBQU01RCxPQUFPUixPQUFPUSxJQUFQLEVBQWI7QUFFQTZELFdBQU9DLElBQVAsQ0FBWTlDLFFBQVosRUFBc0JxRCxPQUF0QixDQUE4QkMsV0FBVztBQUN4QyxZQUFNWixRQUFRMUMsU0FBU3NELE9BQVQsQ0FBZDs7QUFDQSxVQUFJdEQsYUFBYSxTQUFiLElBQTBCLENBQUMvQixXQUFXaUYsS0FBWCxDQUFpQkMsYUFBakIsQ0FBK0IsS0FBS1IsTUFBcEMsRUFBNEMsMEJBQTVDLENBQS9CLEVBQXdHO0FBQ3ZHLGNBQU0sSUFBSW5FLE9BQU9DLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLDRDQUE3QyxFQUEyRjtBQUNoR21FLGtCQUFRLGtCQUR3RjtBQUVoR1Esa0JBQVE7QUFGd0YsU0FBM0YsQ0FBTjtBQUlBOztBQUNELFVBQUlFLFlBQVksVUFBWixJQUEwQlosVUFBVXZELEtBQUtHLENBQXpDLElBQThDb0QsVUFBVSxHQUF4RCxJQUErRCxDQUFDekUsV0FBV2lGLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCLEtBQUtSLE1BQXBDLEVBQTRDLFVBQTVDLENBQXBFLEVBQTZIO0FBQzVILGNBQU0sSUFBSW5FLE9BQU9DLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLDZEQUE3QyxFQUE0RztBQUNqSG1FLGtCQUFRLGtCQUR5RztBQUVqSFEsa0JBQVE7QUFGeUcsU0FBNUcsQ0FBTjtBQUlBOztBQUNELFVBQUlFLFlBQVksVUFBWixJQUEwQlosVUFBVXZELEtBQUtHLENBQXpDLElBQThDb0QsVUFBVSxHQUF4RCxJQUErRCxDQUFDekUsV0FBV2lGLEtBQVgsQ0FBaUJDLGFBQWpCLENBQStCLEtBQUtSLE1BQXBDLEVBQTRDLFVBQTVDLENBQXBFLEVBQTZIO0FBQzVILGNBQU0sSUFBSW5FLE9BQU9DLEtBQVgsQ0FBaUIsMEJBQWpCLEVBQTZDLDREQUE3QyxFQUEyRztBQUNoSG1FLGtCQUFRLGtCQUR3RztBQUVoSFEsa0JBQVE7QUFGd0csU0FBM0csQ0FBTjtBQUlBO0FBQ0QsS0FwQkQ7QUFzQkFQLFdBQU9DLElBQVAsQ0FBWTlDLFFBQVosRUFBc0JxRCxPQUF0QixDQUE4QkMsV0FBVztBQUN4QyxZQUFNWixRQUFRMUMsU0FBU3NELE9BQVQsQ0FBZDs7QUFDQSxjQUFRQSxPQUFSO0FBQ0MsYUFBSyxVQUFMO0FBQ0NyRixxQkFBV2tELFlBQVgsQ0FBd0JoRCxHQUF4QixFQUE2QnVFLEtBQTdCLEVBQW9DMUQsSUFBcEM7QUFDQTs7QUFDRCxhQUFLLFdBQUw7QUFDQyxjQUFJMEQsVUFBVXZELEtBQUtvRSxLQUFuQixFQUEwQjtBQUN6QnRGLHVCQUFXeUMsYUFBWCxDQUF5QnZDLEdBQXpCLEVBQThCdUUsS0FBOUIsRUFBcUMxRCxJQUFyQztBQUNBOztBQUNEOztBQUNELGFBQUssa0JBQUw7QUFDQyxjQUFJMEQsVUFBVXZELEtBQUtxRSxZQUFuQixFQUFpQztBQUNoQ3ZGLHVCQUFXOEMsb0JBQVgsQ0FBZ0M1QyxHQUFoQyxFQUFxQ3VFLEtBQXJDLEVBQTRDMUQsSUFBNUM7QUFDQTs7QUFDRDs7QUFDRCxhQUFLLGlCQUFMO0FBQ0MsY0FBSTBELFVBQVV2RCxLQUFLc0UsV0FBbkIsRUFBZ0M7QUFDL0J4Rix1QkFBVytELG1CQUFYLENBQStCN0QsR0FBL0IsRUFBb0N1RSxLQUFwQyxFQUEyQzFELElBQTNDO0FBQ0E7O0FBQ0Q7O0FBQ0QsYUFBSyxVQUFMO0FBQ0MsY0FBSTBELFVBQVV2RCxLQUFLRyxDQUFuQixFQUFzQjtBQUNyQnJCLHVCQUFXYSxZQUFYLENBQXdCWCxHQUF4QixFQUE2QnVFLEtBQTdCLEVBQW9DMUQsSUFBcEM7QUFDQTs7QUFDRDs7QUFDRCxhQUFLLFdBQUw7QUFDQzBFLGdCQUFNaEIsS0FBTixFQUFhO0FBQ1puQyxxQkFBU2hDLE1BREc7QUFFWm9GLG9CQUFRLENBQUM7QUFDUkMscUJBQU9yRixNQURDO0FBRVJzRix1QkFBU3RGO0FBRkQsYUFBRDtBQUZJLFdBQWI7QUFPQU4scUJBQVc2RixpQkFBWCxDQUE2QjNGLEdBQTdCLEVBQWtDdUUsS0FBbEM7QUFDQTs7QUFDRCxhQUFLLGtCQUFMO0FBQ0N6RSxxQkFBVzhGLG9CQUFYLENBQWdDNUYsR0FBaEMsRUFBcUN1RSxLQUFyQztBQUNBOztBQUNELGFBQUssVUFBTDtBQUNDLGNBQUlBLFVBQVV2RCxLQUFLNkUsRUFBbkIsRUFBdUI7QUFDdEIvRix1QkFBVzRELGdCQUFYLENBQTRCMUQsR0FBNUIsRUFBaUN1RSxLQUFqQyxFQUF3QzFELElBQXhDO0FBQ0E7O0FBQ0Q7O0FBQ0QsYUFBSyxtQkFBTDtBQUNDLGNBQUkwRCxVQUFVdkQsS0FBSzhFLGlCQUFuQixFQUFzQztBQUNyQ2hHLHVCQUFXQyxxQkFBWCxDQUFpQ0MsR0FBakMsRUFBc0N1RSxLQUF0QyxFQUE2QzFELElBQTdDO0FBQ0E7O0FBQ0Q7O0FBQ0QsYUFBSyxnQkFBTDtBQUNDLGNBQUkwRCxVQUFVdkQsS0FBSytFLE1BQW5CLEVBQTJCO0FBQzFCakcsdUJBQVdtRSxzQkFBWCxDQUFrQ2pFLEdBQWxDLEVBQXVDdUUsS0FBdkMsRUFBOEMxRCxJQUE5QztBQUNBOztBQUNEOztBQUNELGFBQUssVUFBTDtBQUNDZixxQkFBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0J1RixlQUF4QixDQUF3Q2hHLEdBQXhDLEVBQTZDSSxPQUFPbUUsS0FBUCxDQUE3QztBQUNBOztBQUNELGFBQUssU0FBTDtBQUNDekUscUJBQVdVLE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCd0YsZUFBeEIsQ0FBd0NqRyxHQUF4QyxFQUE2Q3VFLEtBQTdDO0FBeERGO0FBMERBLEtBNUREO0FBOERBLFdBQU87QUFDTm5ELGNBQVEsSUFERjtBQUVOcEIsV0FBS2dCLEtBQUtFO0FBRkosS0FBUDtBQUlBOztBQWxJYSxDQUFmLEU7Ozs7Ozs7Ozs7O0FDREFwQixXQUFXVSxNQUFYLENBQWtCdUIsUUFBbEIsQ0FBMkJDLHFEQUEzQixHQUFtRixVQUFTakIsSUFBVCxFQUFlbUYsTUFBZixFQUF1QjFFLE9BQXZCLEVBQWdDWCxJQUFoQyxFQUFzQ3NGLFNBQXRDLEVBQWlEO0FBQ25JLFNBQU8sS0FBS0Msa0NBQUwsQ0FBd0NyRixJQUF4QyxFQUE4Q21GLE1BQTlDLEVBQXNEMUUsT0FBdEQsRUFBK0RYLElBQS9ELEVBQXFFc0YsU0FBckUsQ0FBUDtBQUNBLENBRkQ7O0FBSUFyRyxXQUFXVSxNQUFYLENBQWtCdUIsUUFBbEIsQ0FBMkIwQiwwQ0FBM0IsR0FBd0UsVUFBU3lDLE1BQVQsRUFBaUJHLFFBQWpCLEVBQTJCeEYsSUFBM0IsRUFBaUNzRixTQUFqQyxFQUE0QztBQUNuSCxTQUFPLEtBQUtDLGtDQUFMLENBQXdDLEdBQXhDLEVBQTZDRixNQUE3QyxFQUFxREcsUUFBckQsRUFBK0R4RixJQUEvRCxFQUFxRXNGLFNBQXJFLENBQVA7QUFDQSxDQUZELEM7Ozs7Ozs7Ozs7O0FDSkFyRyxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QnVELGtCQUF4QixHQUE2QyxVQUFTOUMsR0FBVCxFQUFjb0UsV0FBZCxFQUEyQjtBQUN2RSxRQUFNZ0IsUUFBUTtBQUNicEY7QUFEYSxHQUFkO0FBR0EsUUFBTXdCLFNBQVM7QUFDZDZELFVBQU07QUFDTGpCO0FBREs7QUFEUSxHQUFmO0FBS0EsU0FBTyxLQUFLNUMsTUFBTCxDQUFZNEQsS0FBWixFQUFtQjVELE1BQW5CLENBQVA7QUFDQSxDQVZEOztBQVlBNUMsV0FBV1UsTUFBWCxDQUFrQkMsS0FBbEIsQ0FBd0JtRCxlQUF4QixHQUEwQyxVQUFTMUMsR0FBVCxFQUFjeUMsUUFBZCxFQUF3QjtBQUNqRSxRQUFNMkMsUUFBUTtBQUNicEY7QUFEYSxHQUFkO0FBR0EsUUFBTXdCLFNBQVM7QUFDZDZELFVBQU07QUFDTFYsVUFBSWxDO0FBREM7QUFEUSxHQUFmOztBQUtBLE1BQUlBLFFBQUosRUFBYztBQUNiN0QsZUFBV1UsTUFBWCxDQUFrQmMsYUFBbEIsQ0FBZ0NrRixZQUFoQyxDQUE2Q3RGLEdBQTdDLEVBQWtEZ0UsT0FBbEQsQ0FBMEQsVUFBU3VCLFlBQVQsRUFBdUI7QUFDaEYsVUFBSUEsYUFBYUMsS0FBYixJQUFzQixJQUExQixFQUFnQztBQUMvQjtBQUNBOztBQUNELFlBQU03RixPQUFPNEYsYUFBYUMsS0FBMUI7O0FBQ0EsVUFBSTVHLFdBQVdpRixLQUFYLENBQWlCQyxhQUFqQixDQUErQm5FLEtBQUtLLEdBQXBDLEVBQXlDLGVBQXpDLE1BQThELEtBQWxFLEVBQXlFO0FBQ3hFLFlBQUksQ0FBQ3dCLE9BQU82RCxJQUFQLENBQVlJLEtBQWpCLEVBQXdCO0FBQ3ZCakUsaUJBQU82RCxJQUFQLENBQVlJLEtBQVosR0FBb0IsRUFBcEI7QUFDQTs7QUFDRCxlQUFPakUsT0FBTzZELElBQVAsQ0FBWUksS0FBWixDQUFrQkMsSUFBbEIsQ0FBdUIvRixLQUFLZ0csUUFBNUIsQ0FBUDtBQUNBO0FBQ0QsS0FYRDtBQVlBLEdBYkQsTUFhTztBQUNObkUsV0FBT29FLE1BQVAsR0FBZ0I7QUFDZkgsYUFBTztBQURRLEtBQWhCO0FBR0E7O0FBQ0QsU0FBTyxLQUFLakUsTUFBTCxDQUFZNEQsS0FBWixFQUFtQjVELE1BQW5CLENBQVA7QUFDQSxDQTVCRDs7QUE4QkE1QyxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QkMsZ0NBQXhCLEdBQTJELFVBQVNRLEdBQVQsRUFBYzZGLGFBQWQsRUFBNkI7QUFDdkYsUUFBTVQsUUFBUTtBQUNicEY7QUFEYSxHQUFkO0FBR0EsUUFBTXdCLFNBQVM7QUFDZDZELFVBQU07QUFDTFQseUJBQW1CaUI7QUFEZDtBQURRLEdBQWY7QUFLQSxTQUFPLEtBQUtyRSxNQUFMLENBQVk0RCxLQUFaLEVBQW1CNUQsTUFBbkIsQ0FBUDtBQUNBLENBVkQ7O0FBWUE1QyxXQUFXVSxNQUFYLENBQWtCQyxLQUFsQixDQUF3QjBELHFCQUF4QixHQUFnRCxVQUFTakQsR0FBVCxFQUFjZ0QsY0FBZCxFQUE4QjtBQUM3RSxRQUFNb0MsUUFBUTtBQUNicEY7QUFEYSxHQUFkO0FBR0EsUUFBTXdCLFNBQVM7QUFDZDZELFVBQU07QUFDTFIsY0FBUTdCO0FBREg7QUFEUSxHQUFmO0FBS0EsU0FBTyxLQUFLeEIsTUFBTCxDQUFZNEQsS0FBWixFQUFtQjVELE1BQW5CLENBQVA7QUFDQSxDQVZELEM7Ozs7Ozs7Ozs7O0FDdERBckMsT0FBTzJHLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCbEgsYUFBV1UsTUFBWCxDQUFrQnlHLFdBQWxCLENBQThCQyxNQUE5QixDQUFxQyxlQUFyQyxFQUFzRDtBQUFDQyxrQkFBYztBQUFFQyxhQUFPLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsV0FBbkI7QUFBVDtBQUFmLEdBQXREO0FBQ0F0SCxhQUFXVSxNQUFYLENBQWtCeUcsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDLGNBQXJDLEVBQXFEO0FBQUNDLGtCQUFjO0FBQUVDLGFBQU8sQ0FBQyxPQUFELEVBQVUsT0FBVjtBQUFUO0FBQWYsR0FBckQ7QUFDQXRILGFBQVdVLE1BQVgsQ0FBa0J5RyxXQUFsQixDQUE4QkMsTUFBOUIsQ0FBcUMseUJBQXJDLEVBQWdFO0FBQUNDLGtCQUFjO0FBQUVDLGFBQU8sQ0FBQyxPQUFELEVBQVUsT0FBVjtBQUFUO0FBQWYsR0FBaEU7QUFDQSxDQUpELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfY2hhbm5lbC1zZXR0aW5ncy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2F2ZVJlYWN0V2hlblJlYWRPbmx5ID0gZnVuY3Rpb24ocmlkLCBhbGxvd1JlYWN0KSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywgeyBmdW5jdGlvbjogJ1JvY2tldENoYXQuc2F2ZVJlYWN0V2hlblJlYWRPbmx5JyB9KTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRBbGxvd1JlYWN0aW5nV2hlblJlYWRPbmx5QnlJZChyaWQsIGFsbG93UmVhY3QpO1xufTtcbiIsIlxuUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUgPSBmdW5jdGlvbihyaWQsIHJvb21UeXBlLCB1c2VyLCBzZW5kTWVzc2FnZSA9IHRydWUpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnXG5cdFx0fSk7XG5cdH1cblx0aWYgKHJvb21UeXBlICE9PSAnYycgJiYgcm9vbVR5cGUgIT09ICdwJykge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9vbS10eXBlJywgJ2Vycm9yLWludmFsaWQtcm9vbS10eXBlJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21UeXBlJyxcblx0XHRcdHR5cGU6IHJvb21UeXBlXG5cdFx0fSk7XG5cdH1cblx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKHJpZCk7XG5cdGlmIChyb29tID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnZXJyb3ItaW52YWxpZC1yb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21UeXBlJyxcblx0XHRcdF9pZDogcmlkXG5cdFx0fSk7XG5cdH1cblx0aWYgKHJvb20udCA9PT0gJ2QnKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZGlyZWN0LXJvb20nLCAnQ2FuXFwndCBjaGFuZ2UgdHlwZSBvZiBkaXJlY3Qgcm9vbXMnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVR5cGUnXG5cdFx0fSk7XG5cdH1cblx0Y29uc3QgcmVzdWx0ID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0VHlwZUJ5SWQocmlkLCByb29tVHlwZSkgJiYgUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy51cGRhdGVUeXBlQnlSb29tSWQocmlkLCByb29tVHlwZSk7XG5cdGlmIChyZXN1bHQgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRsZXQgbWVzc2FnZTtcblx0XHRpZiAocm9vbVR5cGUgPT09ICdjJykge1xuXHRcdFx0bWVzc2FnZSA9IFRBUGkxOG4uX18oJ0NoYW5uZWwnLCB7XG5cdFx0XHRcdGxuZzogdXNlciAmJiB1c2VyLmxhbmd1YWdlIHx8IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdsYW5ndWFnZScpIHx8ICdlbidcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRtZXNzYWdlID0gVEFQaTE4bi5fXygnUHJpdmF0ZV9Hcm91cCcsIHtcblx0XHRcdFx0bG5nOiB1c2VyICYmIHVzZXIubGFuZ3VhZ2UgfHwgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ2xhbmd1YWdlJykgfHwgJ2VuJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21TZXR0aW5nc0NoYW5nZWRXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyb29tX2NoYW5nZWRfcHJpdmFjeScsIHJpZCwgbWVzc2FnZSwgdXNlcik7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn07XG4iLCJpbXBvcnQgcyBmcm9tICd1bmRlcnNjb3JlLnN0cmluZyc7XG5cblJvY2tldENoYXQuc2F2ZVJvb21Ub3BpYyA9IGZ1bmN0aW9uKHJpZCwgcm9vbVRvcGljLCB1c2VyLCBzZW5kTWVzc2FnZSA9IHRydWUpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljJ1xuXHRcdH0pO1xuXHR9XG5cdHJvb21Ub3BpYyA9IHMuZXNjYXBlSFRNTChyb29tVG9waWMpO1xuXHRjb25zdCB1cGRhdGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRUb3BpY0J5SWQocmlkLCByb29tVG9waWMpO1xuXHRpZiAodXBkYXRlICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF90b3BpYycsIHJpZCwgcm9vbVRvcGljLCB1c2VyKTtcblx0fVxuXHRyZXR1cm4gdXBkYXRlO1xufTtcbiIsImltcG9ydCBzIGZyb20gJ3VuZGVyc2NvcmUuc3RyaW5nJztcblxuUm9ja2V0Q2hhdC5zYXZlUm9vbUFubm91bmNlbWVudCA9IGZ1bmN0aW9uKHJpZCwgcm9vbUFubm91bmNlbWVudCwgdXNlciwgc2VuZE1lc3NhZ2U9dHJ1ZSkge1xuXHRpZiAoIU1hdGNoLnRlc3QocmlkLCBTdHJpbmcpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHsgZnVuY3Rpb246ICdSb2NrZXRDaGF0LnNhdmVSb29tQW5ub3VuY2VtZW50JyB9KTtcblx0fVxuXG5cdHJvb21Bbm5vdW5jZW1lbnQgPSBzLmVzY2FwZUhUTUwocm9vbUFubm91bmNlbWVudCk7XG5cdGNvbnN0IHVwZGF0ZWQgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRBbm5vdW5jZW1lbnRCeUlkKHJpZCwgcm9vbUFubm91bmNlbWVudCk7XG5cdGlmICh1cGRhdGVkICYmIHNlbmRNZXNzYWdlKSB7XG5cdFx0Um9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIoJ3Jvb21fY2hhbmdlZF9hbm5vdW5jZW1lbnQnLCByaWQsIHJvb21Bbm5vdW5jZW1lbnQsIHVzZXIpO1xuXHR9XG5cblx0cmV0dXJuIHVwZGF0ZWQ7XG59O1xuIiwiXG5Sb2NrZXRDaGF0LnNhdmVSb29tTmFtZSA9IGZ1bmN0aW9uKHJpZCwgZGlzcGxheU5hbWUsIHVzZXIsIHNlbmRNZXNzYWdlID0gdHJ1ZSkge1xuXHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZUJ5SWQocmlkKTtcblx0aWYgKFJvY2tldENoYXQucm9vbVR5cGVzLnJvb21UeXBlc1tyb29tLnRdLnByZXZlbnRSZW5hbWluZygpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWFsbG93ZWQnLCAnTm90IGFsbG93ZWQnLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbWRpc3BsYXlOYW1lJ1xuXHRcdH0pO1xuXHR9XG5cdGlmIChkaXNwbGF5TmFtZSA9PT0gcm9vbS5uYW1lKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3Qgc2x1Z2lmaWVkUm9vbU5hbWUgPSBSb2NrZXRDaGF0LmdldFZhbGlkUm9vbU5hbWUoZGlzcGxheU5hbWUsIHJpZCk7XG5cblx0Y29uc3QgdXBkYXRlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0TmFtZUJ5SWQocmlkLCBzbHVnaWZpZWRSb29tTmFtZSwgZGlzcGxheU5hbWUpICYmIFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMudXBkYXRlTmFtZUFuZEFsZXJ0QnlSb29tSWQocmlkLCBzbHVnaWZpZWRSb29tTmFtZSwgZGlzcGxheU5hbWUpO1xuXG5cdGlmICh1cGRhdGUgJiYgc2VuZE1lc3NhZ2UpIHtcblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tUmVuYW1lZFdpdGhSb29tSWRSb29tTmFtZUFuZFVzZXIocmlkLCBkaXNwbGF5TmFtZSwgdXNlcik7XG5cdH1cblx0cmV0dXJuIGRpc3BsYXlOYW1lO1xufTtcbiIsIlJvY2tldENoYXQuc2F2ZVJvb21SZWFkT25seSA9IGZ1bmN0aW9uKHJpZCwgcmVhZE9ubHkpIHtcblx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtcm9vbScsICdJbnZhbGlkIHJvb20nLCB7XG5cdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbVJlYWRPbmx5J1xuXHRcdH0pO1xuXHR9XG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXRSZWFkT25seUJ5SWQocmlkLCByZWFkT25seSk7XG59O1xuIiwiaW1wb3J0IHMgZnJvbSAndW5kZXJzY29yZS5zdHJpbmcnO1xuXG5Sb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24gPSBmdW5jdGlvbihyaWQsIHJvb21EZXNjcmlwdGlvbiwgdXNlcikge1xuXG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21EZXNjcmlwdGlvbidcblx0XHR9KTtcblx0fVxuXHRjb25zdCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uID0gcy5lc2NhcGVIVE1MKHJvb21EZXNjcmlwdGlvbik7XG5cdGNvbnN0IHVwZGF0ZSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldERlc2NyaXB0aW9uQnlJZChyaWQsIGVzY2FwZWRSb29tRGVzY3JpcHRpb24pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5jcmVhdGVSb29tU2V0dGluZ3NDaGFuZ2VkV2l0aFR5cGVSb29tSWRNZXNzYWdlQW5kVXNlcigncm9vbV9jaGFuZ2VkX2Rlc2NyaXB0aW9uJywgcmlkLCBlc2NhcGVkUm9vbURlc2NyaXB0aW9uLCB1c2VyKTtcblx0cmV0dXJuIHVwZGF0ZTtcbn07XG4iLCJSb2NrZXRDaGF0LnNhdmVSb29tU3lzdGVtTWVzc2FnZXMgPSBmdW5jdGlvbihyaWQsIHN5c3RlbU1lc3NhZ2VzKSB7XG5cdGlmICghTWF0Y2gudGVzdChyaWQsIFN0cmluZykpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0J2Z1bmN0aW9uJzogJ1JvY2tldENoYXQuc2F2ZVJvb21TeXN0ZW1NZXNzYWdlcydcblx0XHR9KTtcblx0fVxuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3lzdGVtTWVzc2FnZXNCeUlkKHJpZCwgc3lzdGVtTWVzc2FnZXMpO1xufTtcbiIsImNvbnN0IGZpZWxkcyA9IFsncm9vbU5hbWUnLCAncm9vbVRvcGljJywgJ3Jvb21Bbm5vdW5jZW1lbnQnLCAncm9vbURlc2NyaXB0aW9uJywgJ3Jvb21UeXBlJywgJ3JlYWRPbmx5JywgJ3JlYWN0V2hlblJlYWRPbmx5JywgJ3N5c3RlbU1lc3NhZ2VzJywgJ2RlZmF1bHQnLCAnam9pbkNvZGUnLCAndG9rZW5wYXNzJywgJ3N0cmVhbWluZ09wdGlvbnMnXTtcbk1ldGVvci5tZXRob2RzKHtcblx0c2F2ZVJvb21TZXR0aW5ncyhyaWQsIHNldHRpbmdzLCB2YWx1ZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHQnZnVuY3Rpb24nOiAnUm9ja2V0Q2hhdC5zYXZlUm9vbU5hbWUnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKCFNYXRjaC50ZXN0KHJpZCwgU3RyaW5nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2Ygc2V0dGluZ3MgIT09ICdvYmplY3QnKSB7XG5cdFx0XHRzZXR0aW5ncyA9IHtcblx0XHRcdFx0W3NldHRpbmdzXSA6IHZhbHVlXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghT2JqZWN0LmtleXMoc2V0dGluZ3MpLmV2ZXJ5KGtleSA9PiBmaWVsZHMuaW5jbHVkZXMoa2V5KSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtc2V0dGluZ3MnLCAnSW52YWxpZCBzZXR0aW5ncyBwcm92aWRlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2VkaXQtcm9vbScsIHJpZCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdFZGl0aW5nIHJvb20gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NhdmVSb29tU2V0dGluZ3MnLFxuXHRcdFx0XHRhY3Rpb246ICdFZGl0aW5nX3Jvb20nXG5cdFx0XHR9KTtcblx0XHR9XG5cblxuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lQnlJZChyaWQpO1xuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb29tJywgJ0ludmFsaWQgcm9vbScsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXG5cdFx0T2JqZWN0LmtleXMoc2V0dGluZ3MpLmZvckVhY2goc2V0dGluZyA9PiB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IHNldHRpbmdzW3NldHRpbmddO1xuXHRcdFx0aWYgKHNldHRpbmdzID09PSAnZGVmYXVsdCcgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ3ZpZXctcm9vbS1hZG1pbmlzdHJhdGlvbicpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdWaWV3aW5nIHJvb20gYWRtaW5pc3RyYXRpb24gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnVmlld2luZ19yb29tX2FkbWluaXN0cmF0aW9uJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXR0aW5nID09PSAncm9vbVR5cGUnICYmIHZhbHVlICE9PSByb29tLnQgJiYgdmFsdWUgPT09ICdjJyAmJiAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnY3JlYXRlLWMnKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQ2hhbmdpbmcgYSBwcml2YXRlIGdyb3VwIHRvIGEgcHVibGljIGNoYW5uZWwgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnQ2hhbmdlX1Jvb21fVHlwZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoc2V0dGluZyA9PT0gJ3Jvb21UeXBlJyAmJiB2YWx1ZSAhPT0gcm9vbS50ICYmIHZhbHVlID09PSAncCcgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih0aGlzLnVzZXJJZCwgJ2NyZWF0ZS1wJykpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0NoYW5naW5nIGEgcHVibGljIGNoYW5uZWwgdG8gYSBwcml2YXRlIHJvb20gaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdFx0bWV0aG9kOiAnc2F2ZVJvb21TZXR0aW5ncycsXG5cdFx0XHRcdFx0YWN0aW9uOiAnQ2hhbmdlX1Jvb21fVHlwZSdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRPYmplY3Qua2V5cyhzZXR0aW5ncykuZm9yRWFjaChzZXR0aW5nID0+IHtcblx0XHRcdGNvbnN0IHZhbHVlID0gc2V0dGluZ3Nbc2V0dGluZ107XG5cdFx0XHRzd2l0Y2ggKHNldHRpbmcpIHtcblx0XHRcdFx0Y2FzZSAncm9vbU5hbWUnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21OYW1lKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tVG9waWMnOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS50b3BpYykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRvcGljKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncm9vbUFubm91bmNlbWVudCc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLmFubm91bmNlbWVudCkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbUFubm91bmNlbWVudChyaWQsIHZhbHVlLCB1c2VyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3Jvb21EZXNjcmlwdGlvbic6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLmRlc2NyaXB0aW9uKSB7XG5cdFx0XHRcdFx0XHRSb2NrZXRDaGF0LnNhdmVSb29tRGVzY3JpcHRpb24ocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdyb29tVHlwZSc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLnQpIHtcblx0XHRcdFx0XHRcdFJvY2tldENoYXQuc2F2ZVJvb21UeXBlKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndG9rZW5wYXNzJzpcblx0XHRcdFx0XHRjaGVjayh2YWx1ZSwge1xuXHRcdFx0XHRcdFx0cmVxdWlyZTogU3RyaW5nLFxuXHRcdFx0XHRcdFx0dG9rZW5zOiBbe1xuXHRcdFx0XHRcdFx0XHR0b2tlbjogU3RyaW5nLFxuXHRcdFx0XHRcdFx0XHRiYWxhbmNlOiBTdHJpbmdcblx0XHRcdFx0XHRcdH1dXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVRva2VucGFzcyhyaWQsIHZhbHVlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnc3RyZWFtaW5nT3B0aW9ucyc6XG5cdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlU3RyZWFtaW5nT3B0aW9ucyhyaWQsIHZhbHVlKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncmVhZE9ubHknOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5ybykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVJlYWRPbmx5KHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncmVhY3RXaGVuUmVhZE9ubHknOlxuXHRcdFx0XHRcdGlmICh2YWx1ZSAhPT0gcm9vbS5yZWFjdFdoZW5SZWFkT25seSkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUmVhY3RXaGVuUmVhZE9ubHkocmlkLCB2YWx1ZSwgdXNlcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdzeXN0ZW1NZXNzYWdlcyc6XG5cdFx0XHRcdFx0aWYgKHZhbHVlICE9PSByb29tLnN5c01lcykge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5zYXZlUm9vbVN5c3RlbU1lc3NhZ2VzKHJpZCwgdmFsdWUsIHVzZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnam9pbkNvZGUnOlxuXHRcdFx0XHRcdFJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldEpvaW5Db2RlQnlJZChyaWQsIFN0cmluZyh2YWx1ZSkpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdkZWZhdWx0Jzpcblx0XHRcdFx0XHRSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zYXZlRGVmYXVsdEJ5SWQocmlkLCB2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVzdWx0OiB0cnVlLFxuXHRcdFx0cmlkOiByb29tLl9pZFxuXHRcdH07XG5cdH1cbn0pO1xuIiwiUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuY3JlYXRlUm9vbVNldHRpbmdzQ2hhbmdlZFdpdGhUeXBlUm9vbUlkTWVzc2FnZUFuZFVzZXIgPSBmdW5jdGlvbih0eXBlLCByb29tSWQsIG1lc3NhZ2UsIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gdGhpcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKHR5cGUsIHJvb21JZCwgbWVzc2FnZSwgdXNlciwgZXh0cmFEYXRhKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmNyZWF0ZVJvb21SZW5hbWVkV2l0aFJvb21JZFJvb21OYW1lQW5kVXNlciA9IGZ1bmN0aW9uKHJvb21JZCwgcm9vbU5hbWUsIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gdGhpcy5jcmVhdGVXaXRoVHlwZVJvb21JZE1lc3NhZ2VBbmRVc2VyKCdyJywgcm9vbUlkLCByb29tTmFtZSwgdXNlciwgZXh0cmFEYXRhKTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5zZXREZXNjcmlwdGlvbkJ5SWQgPSBmdW5jdGlvbihfaWQsIGRlc2NyaXB0aW9uKSB7XG5cdGNvbnN0IHF1ZXJ5ID0ge1xuXHRcdF9pZFxuXHR9O1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHNldDoge1xuXHRcdFx0ZGVzY3JpcHRpb25cblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlJvb21zLnNldFJlYWRPbmx5QnlJZCA9IGZ1bmN0aW9uKF9pZCwgcmVhZE9ubHkpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRybzogcmVhZE9ubHlcblx0XHR9XG5cdH07XG5cdGlmIChyZWFkT25seSkge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZEJ5Um9vbUlkKF9pZCkuZm9yRWFjaChmdW5jdGlvbihzdWJzY3JpcHRpb24pIHtcblx0XHRcdGlmIChzdWJzY3JpcHRpb24uX3VzZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCB1c2VyID0gc3Vic2NyaXB0aW9uLl91c2VyO1xuXHRcdFx0aWYgKFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbih1c2VyLl9pZCwgJ3Bvc3QtcmVhZG9ubHknKSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0aWYgKCF1cGRhdGUuJHNldC5tdXRlZCkge1xuXHRcdFx0XHRcdHVwZGF0ZS4kc2V0Lm11dGVkID0gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIHVwZGF0ZS4kc2V0Lm11dGVkLnB1c2godXNlci51c2VybmFtZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0dXBkYXRlLiR1bnNldCA9IHtcblx0XHRcdG11dGVkOiAnJ1xuXHRcdH07XG5cdH1cblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0QWxsb3dSZWFjdGluZ1doZW5SZWFkT25seUJ5SWQgPSBmdW5jdGlvbihfaWQsIGFsbG93UmVhY3RpbmcpIHtcblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0X2lkXG5cdH07XG5cdGNvbnN0IHVwZGF0ZSA9IHtcblx0XHQkc2V0OiB7XG5cdFx0XHRyZWFjdFdoZW5SZWFkT25seTogYWxsb3dSZWFjdGluZ1xuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuc2V0U3lzdGVtTWVzc2FnZXNCeUlkID0gZnVuY3Rpb24oX2lkLCBzeXN0ZW1NZXNzYWdlcykge1xuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRfaWRcblx0fTtcblx0Y29uc3QgdXBkYXRlID0ge1xuXHRcdCRzZXQ6IHtcblx0XHRcdHN5c01lczogc3lzdGVtTWVzc2FnZXNcblx0XHR9XG5cdH07XG5cdHJldHVybiB0aGlzLnVwZGF0ZShxdWVyeSwgdXBkYXRlKTtcbn07XG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KCdwb3N0LXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFkb25seScsIHskc2V0T25JbnNlcnQ6IHsgcm9sZXM6IFsnYWRtaW4nLCAnb3duZXInXSB9IH0pO1xuXHRSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy51cHNlcnQoJ3NldC1yZWFjdC13aGVuLXJlYWRvbmx5JywgeyRzZXRPbkluc2VydDogeyByb2xlczogWydhZG1pbicsICdvd25lciddIH19KTtcbn0pO1xuIl19
