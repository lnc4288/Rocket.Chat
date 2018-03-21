(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var roles;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:authorization":{"lib":{"rocketchat.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/lib/rocketchat.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz = {};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"models":{"Permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Permissions.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelPermissions extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
  } // FIND


  findByRole(role, options) {
    const query = {
      roles: role
    };
    return this.find(query, options);
  }

  findOneById(_id) {
    return this.findOne(_id);
  }

  createOrUpdate(name, roles) {
    this.upsert({
      _id: name
    }, {
      $set: {
        roles
      }
    });
  }

  addRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $addToSet: {
        roles: role
      }
    });
  }

  removeRole(permission, role) {
    this.update({
      _id: permission
    }, {
      $pull: {
        roles: role
      }
    });
  }

}

RocketChat.models.Permissions = new ModelPermissions('permissions', true);
RocketChat.models.Permissions.cache.load();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Roles.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
class ModelRoles extends RocketChat.models._Base {
  constructor() {
    super(...arguments);
    this.tryEnsureIndex({
      'name': 1
    });
    this.tryEnsureIndex({
      'scope': 1
    });
  }

  findUsersInRole(name, scope, options) {
    const role = this.findOne(name);
    const roleScope = role && role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
  }

  isUserInRoles(userId, roles, scope) {
    roles = [].concat(roles);
    return roles.some(roleName => {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
    });
  }

  createOrUpdate(name, scope = 'Users', description, protectedRole) {
    const updateData = {};
    updateData.name = name;
    updateData.scope = scope;

    if (description != null) {
      updateData.description = description;
    }

    if (protectedRole) {
      updateData.protected = protectedRole;
    }

    this.upsert({
      _id: name
    }, {
      $set: updateData
    });
  }

  addUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.addRolesByUserId && model.addRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

  removeUserRoles(userId, roles, scope) {
    roles = [].concat(roles);

    for (const roleName of roles) {
      const role = this.findOne(roleName);
      const roleScope = role && role.scope || 'Users';
      const model = RocketChat.models[roleScope];
      model && model.removeRolesByUserId && model.removeRolesByUserId(userId, roleName, scope);
    }

    return true;
  }

}

RocketChat.models.Roles = new ModelRoles('roles', true);
RocketChat.models.Roles.cache.load();
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Base.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Base.js                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models._Base.prototype.roleBaseQuery = function ()
/*userId, scope*/
{
  return;
};

RocketChat.models._Base.prototype.findRolesByUserId = function (userId
/*, options*/
) {
  const query = this.roleBaseQuery(userId);
  return this.find(query, {
    fields: {
      roles: 1
    }
  });
};

RocketChat.models._Base.prototype.isUserInRole = function (userId, roleName, scope) {
  const query = this.roleBaseQuery(userId, scope);

  if (query == null) {
    return false;
  }

  query.roles = roleName;
  return !_.isUndefined(this.findOne(query));
};

RocketChat.models._Base.prototype.addRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $addToSet: {
      roles: {
        $each: roles
      }
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.removeRolesByUserId = function (userId, roles, scope) {
  roles = [].concat(roles);
  const query = this.roleBaseQuery(userId, scope);
  const update = {
    $pullAll: {
      roles
    }
  };
  return this.update(query, update);
};

RocketChat.models._Base.prototype.findUsersInRoles = function () {
  throw new Meteor.Error('overwrite-function', 'You must overwrite this function in the extended classes');
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Users.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Users.js                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.models.Users.roleBaseQuery = function (userId) {
  return {
    _id: userId
  };
};

RocketChat.models.Users.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };
  return this.find(query, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Subscriptions.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/models/Subscriptions.js                                             //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.models.Subscriptions.roleBaseQuery = function (userId, scope) {
  if (scope == null) {
    return;
  }

  const query = {
    'u._id': userId
  };

  if (!_.isUndefined(scope)) {
    query.rid = scope;
  }

  return query;
};

RocketChat.models.Subscriptions.findUsersInRoles = function (roles, scope, options) {
  roles = [].concat(roles);
  const query = {
    roles: {
      $in: roles
    }
  };

  if (scope) {
    query.rid = scope;
  }

  const subscriptions = this.find(query).fetch();

  const users = _.compact(_.map(subscriptions, function (subscription) {
    if ('undefined' !== typeof subscription.u && 'undefined' !== typeof subscription.u._id) {
      return subscription.u._id;
    }
  }));

  return RocketChat.models.Users.find({
    _id: {
      $in: users
    }
  }, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"functions":{"addUserRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/addUserRoles.js                                           //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.addUserRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.db.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.addUserRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    for (const role of invalidRoleNames) {
      RocketChat.models.Roles.createOrUpdate(role);
    }
  }

  RocketChat.models.Roles.addUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"canAccessRoom.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/canAccessRoom.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* globals RocketChat */
RocketChat.authz.roomAccessValidators = [function (room, user = {}) {
  if (room.t === 'c') {
    if (!user._id && RocketChat.settings.get('Accounts_AllowAnonymousRead') === true) {
      return true;
    }

    return RocketChat.authz.hasPermission(user._id, 'view-c-room');
  }
}, function (room, user = {}) {
  const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, user._id);

  if (subscription) {
    return subscription._room;
  }
}];

RocketChat.authz.canAccessRoom = function (room, user, extraData) {
  return RocketChat.authz.roomAccessValidators.some(validator => {
    return validator.call(this, room, user, extraData);
  });
};

RocketChat.authz.addRoomAccessValidator = function (validator) {
  RocketChat.authz.roomAccessValidators.push(validator);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getRoles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getRoles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getRoles = function () {
  return RocketChat.models.Roles.find().fetch();
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getUsersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/getUsersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.getUsersInRole = function (roleName, scope, options) {
  return RocketChat.models.Roles.findUsersInRole(roleName, scope, options);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasPermission.js                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
function atLeastOne(userId, permissions = [], scope) {
  return permissions.some(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function all(userId, permissions = [], scope) {
  return permissions.every(permissionId => {
    const permission = RocketChat.models.Permissions.findOne(permissionId);
    return RocketChat.models.Roles.isUserInRoles(userId, permission.roles, scope);
  });
}

function hasPermission(userId, permissions, scope, strategy) {
  if (!userId) {
    return false;
  }

  permissions = [].concat(permissions);
  return strategy(userId, permissions, scope);
}

RocketChat.authz.hasAllPermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, all);
};

RocketChat.authz.hasPermission = RocketChat.authz.hasAllPermission;

RocketChat.authz.hasAtLeastOnePermission = function (userId, permissions, scope) {
  return hasPermission(userId, permissions, scope, atLeastOne);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hasRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/hasRole.js                                                //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.authz.hasRole = function (userId, roleNames, scope) {
  roleNames = [].concat(roleNames);
  return RocketChat.models.Roles.isUserInRoles(userId, roleNames, scope);
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRoles.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/functions/removeUserFromRoles.js                                    //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

RocketChat.authz.removeUserFromRoles = function (userId, roleNames, scope) {
  if (!userId || !roleNames) {
    return false;
  }

  const user = RocketChat.models.Users.findOneById(userId);

  if (!user) {
    throw new Meteor.Error('error-invalid-user', 'Invalid user', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  roleNames = [].concat(roleNames);

  const existingRoleNames = _.pluck(RocketChat.authz.getRoles(), '_id');

  const invalidRoleNames = _.difference(roleNames, existingRoleNames);

  if (!_.isEmpty(invalidRoleNames)) {
    throw new Meteor.Error('error-invalid-role', 'Invalid role', {
      function: 'RocketChat.authz.removeUserFromRoles'
    });
  }

  RocketChat.models.Roles.removeUserRoles(userId, roleNames, scope);
  return true;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"permissions.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/permissions.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'permissions/get'(updatedAt) {
    this.unblock();
    const records = RocketChat.models.Permissions.find().fetch();

    if (updatedAt instanceof Date) {
      return {
        update: records.filter(record => {
          return record._updatedAt > updatedAt;
        }),
        remove: RocketChat.models.Permissions.trashFindDeletedAfter(updatedAt, {}, {
          fields: {
            _id: 1,
            _deletedAt: 1
          }
        }).fetch()
      };
    }

    return records;
  }

});
RocketChat.models.Permissions.on('changed', (type, permission) => {
  RocketChat.Notifications.notifyLoggedInThisInstance('permissions-changed', type, permission);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"roles.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/roles.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('roles', function () {
  if (!this.userId) {
    return this.ready();
  }

  return RocketChat.models.Roles.find();
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"usersInRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/publications/usersInRole.js                                         //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.publish('usersInRole', function (roleName, scope, limit = 50) {
  if (!this.userId) {
    return this.ready();
  }

  if (!RocketChat.authz.hasPermission(this.userId, 'access-permissions')) {
    return this.error(new Meteor.Error('error-not-allowed', 'Not allowed', {
      publish: 'usersInRole'
    }));
  }

  const options = {
    limit,
    sort: {
      name: 1
    }
  };
  return RocketChat.authz.getUsersInRole(roleName, scope, options);
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"addUserToRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addUserToRole.js                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:addUserToRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:addUserToRole'
      });
    }

    if (roleName === 'admin' && !RocketChat.authz.hasPermission(Meteor.userId(), 'assign-admin-role')) {
      throw new Meteor.Error('error-action-not-allowed', 'Assigning admin is not allowed', {
        method: 'authorization:addUserToRole',
        action: 'Assign_admin'
      });
    }

    const user = RocketChat.models.Users.findOneByUsername(username, {
      fields: {
        _id: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:addUserToRole'
      });
    }

    const add = RocketChat.models.Roles.addUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'added',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return add;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/deleteRole.js                                               //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:deleteRole'(roleName) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:deleteRole',
        action: 'Accessing_permissions'
      });
    }

    const role = RocketChat.models.Roles.findOne(roleName);

    if (!role) {
      throw new Meteor.Error('error-invalid-role', 'Invalid role', {
        method: 'authorization:deleteRole'
      });
    }

    if (role.protected) {
      throw new Meteor.Error('error-delete-protected-role', 'Cannot delete a protected role', {
        method: 'authorization:deleteRole'
      });
    }

    const roleScope = role.scope || 'Users';
    const model = RocketChat.models[roleScope];
    const existingUsers = model && model.findUsersInRoles && model.findUsersInRoles(roleName);

    if (existingUsers && existingUsers.count() > 0) {
      throw new Meteor.Error('error-role-in-use', 'Cannot delete role because it\'s in use', {
        method: 'authorization:deleteRole'
      });
    }

    return RocketChat.models.Roles.remove(role.name);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeUserFromRole.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeUserFromRole.js                                       //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
Meteor.methods({
  'authorization:removeUserFromRole'(roleName, username, scope) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Access permissions is not allowed', {
        method: 'authorization:removeUserFromRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleName || !_.isString(roleName) || !username || !_.isString(username)) {
      throw new Meteor.Error('error-invalid-arguments', 'Invalid arguments', {
        method: 'authorization:removeUserFromRole'
      });
    }

    const user = Meteor.users.findOne({
      username
    }, {
      fields: {
        _id: 1,
        roles: 1
      }
    });

    if (!user || !user._id) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'authorization:removeUserFromRole'
      });
    } // prevent removing last user from admin role


    if (roleName === 'admin') {
      const adminCount = Meteor.users.find({
        roles: {
          $in: ['admin']
        }
      }).count();
      const userIsAdmin = user.roles.indexOf('admin') > -1;

      if (adminCount === 1 && userIsAdmin) {
        throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
          method: 'removeUserFromRole',
          action: 'Remove_last_admin'
        });
      }
    }

    const remove = RocketChat.models.Roles.removeUserRoles(user._id, roleName, scope);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'removed',
        _id: roleName,
        u: {
          _id: user._id,
          username
        },
        scope
      });
    }

    return remove;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"saveRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/saveRole.js                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:saveRole'(roleData) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:saveRole',
        action: 'Accessing_permissions'
      });
    }

    if (!roleData.name) {
      throw new Meteor.Error('error-role-name-required', 'Role name is required', {
        method: 'authorization:saveRole'
      });
    }

    if (['Users', 'Subscriptions'].includes(roleData.scope) === false) {
      roleData.scope = 'Users';
    }

    const update = RocketChat.models.Roles.createOrUpdate(roleData.name, roleData.scope, roleData.description);

    if (RocketChat.settings.get('UI_DisplayRoles')) {
      RocketChat.Notifications.notifyLogged('roles-change', {
        type: 'changed',
        _id: roleData.name
      });
    }

    return update;
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addPermissionToRole.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/addPermissionToRole.js                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:addPermissionToRole'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Adding permission is not allowed', {
        method: 'authorization:addPermissionToRole',
        action: 'Adding_permission'
      });
    }

    return RocketChat.models.Permissions.addRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"removeRoleFromPermission.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/methods/removeRoleFromPermission.js                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
Meteor.methods({
  'authorization:removeRoleFromPermission'(permission, role) {
    if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'access-permissions')) {
      throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
        method: 'authorization:removeRoleFromPermission',
        action: 'Accessing_permissions'
      });
    }

    return RocketChat.models.Permissions.removeRole(permission, role);
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_authorization/server/startup.js                                                          //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
/* eslint no-multi-spaces: 0 */
Meteor.startup(function () {
  // Note:
  // 1.if we need to create a role that can only edit channel message, but not edit group message
  // then we can define edit-<type>-message instead of edit-message
  // 2. admin, moderator, and user roles should not be deleted as they are referened in the code.
  const permissions = [{
    _id: 'access-permissions',
    roles: ['admin']
  }, {
    _id: 'add-oauth-service',
    roles: ['admin']
  }, {
    _id: 'add-user-to-joined-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'add-user-to-any-c-room',
    roles: ['admin']
  }, {
    _id: 'add-user-to-any-p-room',
    roles: []
  }, {
    _id: 'archive-room',
    roles: ['admin', 'owner']
  }, {
    _id: 'assign-admin-role',
    roles: ['admin']
  }, {
    _id: 'ban-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'bulk-create-c',
    roles: ['admin']
  }, {
    _id: 'bulk-register-user',
    roles: ['admin']
  }, {
    _id: 'create-c',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-d',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-p',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'create-user',
    roles: ['admin']
  }, {
    _id: 'clean-channel-history',
    roles: ['admin']
  }, // special permission to bulk delete a channel's mesages
  {
    _id: 'delete-c',
    roles: ['admin']
  }, {
    _id: 'delete-d',
    roles: ['admin']
  }, {
    _id: 'delete-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'delete-p',
    roles: ['admin']
  }, {
    _id: 'delete-user',
    roles: ['admin']
  }, {
    _id: 'edit-message',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'edit-other-user-active-status',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-info',
    roles: ['admin']
  }, {
    _id: 'edit-other-user-password',
    roles: ['admin']
  }, {
    _id: 'edit-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'edit-room',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'force-delete-message',
    roles: ['admin', 'owner']
  }, {
    _id: 'join-without-join-code',
    roles: ['admin', 'bot']
  }, {
    _id: 'manage-assets',
    roles: ['admin']
  }, {
    _id: 'manage-emoji',
    roles: ['admin']
  }, {
    _id: 'manage-integrations',
    roles: ['admin']
  }, {
    _id: 'manage-own-integrations',
    roles: ['admin', 'bot']
  }, {
    _id: 'manage-oauth-apps',
    roles: ['admin']
  }, {
    _id: 'mention-all',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mention-here',
    roles: ['admin', 'owner', 'moderator', 'user']
  }, {
    _id: 'mute-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'remove-user',
    roles: ['admin', 'owner', 'moderator']
  }, {
    _id: 'run-import',
    roles: ['admin']
  }, {
    _id: 'run-migration',
    roles: ['admin']
  }, {
    _id: 'set-moderator',
    roles: ['admin', 'owner']
  }, {
    _id: 'set-owner',
    roles: ['admin', 'owner']
  }, {
    _id: 'send-many-messages',
    roles: ['admin', 'bot']
  }, {
    _id: 'set-leader',
    roles: ['admin', 'owner']
  }, {
    _id: 'unarchive-room',
    roles: ['admin']
  }, {
    _id: 'view-c-room',
    roles: ['admin', 'user', 'bot', 'anonymous']
  }, {
    _id: 'user-generate-access-token',
    roles: ['admin']
  }, {
    _id: 'view-d-room',
    roles: ['admin', 'user', 'bot']
  }, {
    _id: 'view-full-other-user-info',
    roles: ['admin']
  }, {
    _id: 'view-history',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-joined-room',
    roles: ['guest', 'bot', 'anonymous']
  }, {
    _id: 'view-join-code',
    roles: ['admin']
  }, {
    _id: 'view-logs',
    roles: ['admin']
  }, {
    _id: 'view-other-user-channels',
    roles: ['admin']
  }, {
    _id: 'view-p-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-privileged-setting',
    roles: ['admin']
  }, {
    _id: 'view-room-administration',
    roles: ['admin']
  }, {
    _id: 'view-statistics',
    roles: ['admin']
  }, {
    _id: 'view-user-administration',
    roles: ['admin']
  }, {
    _id: 'preview-c-room',
    roles: ['admin', 'user', 'anonymous']
  }, {
    _id: 'view-outside-room',
    roles: ['admin', 'owner', 'moderator', 'user']
  }];

  for (const permission of permissions) {
    if (!RocketChat.models.Permissions.findOneById(permission._id)) {
      RocketChat.models.Permissions.upsert(permission._id, {
        $set: permission
      });
    }
  }

  const defaultRoles = [{
    name: 'admin',
    scope: 'Users',
    description: 'Admin'
  }, {
    name: 'moderator',
    scope: 'Subscriptions',
    description: 'Moderator'
  }, {
    name: 'leader',
    scope: 'Subscriptions',
    description: 'Leader'
  }, {
    name: 'owner',
    scope: 'Subscriptions',
    description: 'Owner'
  }, {
    name: 'user',
    scope: 'Users',
    description: ''
  }, {
    name: 'bot',
    scope: 'Users',
    description: ''
  }, {
    name: 'guest',
    scope: 'Users',
    description: ''
  }, {
    name: 'anonymous',
    scope: 'Users',
    description: ''
  }];

  for (const role of defaultRoles) {
    RocketChat.models.Roles.upsert({
      _id: role.name
    }, {
      $setOnInsert: {
        scope: role.scope,
        description: role.description || '',
        protected: true
      }
    });
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:authorization/lib/rocketchat.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Base.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Users.js");
require("/node_modules/meteor/rocketchat:authorization/server/models/Subscriptions.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/addUserRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/canAccessRoom.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/getUsersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/hasRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/functions/removeUserFromRoles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/permissions.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/roles.js");
require("/node_modules/meteor/rocketchat:authorization/server/publications/usersInRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addUserToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/deleteRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeUserFromRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/saveRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/addPermissionToRole.js");
require("/node_modules/meteor/rocketchat:authorization/server/methods/removeRoleFromPermission.js");
require("/node_modules/meteor/rocketchat:authorization/server/startup.js");

/* Exports */
Package._define("rocketchat:authorization");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_authorization.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL2xpYi9yb2NrZXRjaGF0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9QZXJtaXNzaW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tb2RlbHMvUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL0Jhc2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbW9kZWxzL1VzZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21vZGVscy9TdWJzY3JpcHRpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9hZGRVc2VyUm9sZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2NhbkFjY2Vzc1Jvb20uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvZnVuY3Rpb25zL2dldFJvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL2Z1bmN0aW9ucy9nZXRVc2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUGVybWlzc2lvbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvaGFzUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9mdW5jdGlvbnMvcmVtb3ZlVXNlckZyb21Sb2xlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9wdWJsaWNhdGlvbnMvcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvcHVibGljYXRpb25zL3JvbGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3B1YmxpY2F0aW9ucy91c2Vyc0luUm9sZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphdXRob3JpemF0aW9uL3NlcnZlci9tZXRob2RzL2FkZFVzZXJUb1JvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9kZWxldGVSb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlVXNlckZyb21Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvc2F2ZVJvbGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6YXV0aG9yaXphdGlvbi9zZXJ2ZXIvbWV0aG9kcy9hZGRQZXJtaXNzaW9uVG9Sb2xlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL21ldGhvZHMvcmVtb3ZlUm9sZUZyb21QZXJtaXNzaW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmF1dGhvcml6YXRpb24vc2VydmVyL3N0YXJ0dXAuanMiXSwibmFtZXMiOlsiUm9ja2V0Q2hhdCIsImF1dGh6IiwiTW9kZWxQZXJtaXNzaW9ucyIsIm1vZGVscyIsIl9CYXNlIiwiY29uc3RydWN0b3IiLCJhcmd1bWVudHMiLCJmaW5kQnlSb2xlIiwicm9sZSIsIm9wdGlvbnMiLCJxdWVyeSIsInJvbGVzIiwiZmluZCIsImZpbmRPbmVCeUlkIiwiX2lkIiwiZmluZE9uZSIsImNyZWF0ZU9yVXBkYXRlIiwibmFtZSIsInVwc2VydCIsIiRzZXQiLCJhZGRSb2xlIiwicGVybWlzc2lvbiIsInVwZGF0ZSIsIiRhZGRUb1NldCIsInJlbW92ZVJvbGUiLCIkcHVsbCIsIlBlcm1pc3Npb25zIiwiY2FjaGUiLCJsb2FkIiwiTW9kZWxSb2xlcyIsInRyeUVuc3VyZUluZGV4IiwiZmluZFVzZXJzSW5Sb2xlIiwic2NvcGUiLCJyb2xlU2NvcGUiLCJtb2RlbCIsImZpbmRVc2Vyc0luUm9sZXMiLCJpc1VzZXJJblJvbGVzIiwidXNlcklkIiwiY29uY2F0Iiwic29tZSIsInJvbGVOYW1lIiwiaXNVc2VySW5Sb2xlIiwiZGVzY3JpcHRpb24iLCJwcm90ZWN0ZWRSb2xlIiwidXBkYXRlRGF0YSIsInByb3RlY3RlZCIsImFkZFVzZXJSb2xlcyIsImFkZFJvbGVzQnlVc2VySWQiLCJyZW1vdmVVc2VyUm9sZXMiLCJyZW1vdmVSb2xlc0J5VXNlcklkIiwiUm9sZXMiLCJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJwcm90b3R5cGUiLCJyb2xlQmFzZVF1ZXJ5IiwiZmluZFJvbGVzQnlVc2VySWQiLCJmaWVsZHMiLCJpc1VuZGVmaW5lZCIsIiRlYWNoIiwiJHB1bGxBbGwiLCJNZXRlb3IiLCJFcnJvciIsIlVzZXJzIiwiJGluIiwiU3Vic2NyaXB0aW9ucyIsInJpZCIsInN1YnNjcmlwdGlvbnMiLCJmZXRjaCIsInVzZXJzIiwiY29tcGFjdCIsIm1hcCIsInN1YnNjcmlwdGlvbiIsInUiLCJyb2xlTmFtZXMiLCJ1c2VyIiwiZGIiLCJmdW5jdGlvbiIsImV4aXN0aW5nUm9sZU5hbWVzIiwicGx1Y2siLCJnZXRSb2xlcyIsImludmFsaWRSb2xlTmFtZXMiLCJkaWZmZXJlbmNlIiwiaXNFbXB0eSIsInJvb21BY2Nlc3NWYWxpZGF0b3JzIiwicm9vbSIsInQiLCJzZXR0aW5ncyIsImdldCIsImhhc1Blcm1pc3Npb24iLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJfcm9vbSIsImNhbkFjY2Vzc1Jvb20iLCJleHRyYURhdGEiLCJ2YWxpZGF0b3IiLCJjYWxsIiwiYWRkUm9vbUFjY2Vzc1ZhbGlkYXRvciIsInB1c2giLCJnZXRVc2Vyc0luUm9sZSIsImF0TGVhc3RPbmUiLCJwZXJtaXNzaW9ucyIsInBlcm1pc3Npb25JZCIsImFsbCIsImV2ZXJ5Iiwic3RyYXRlZ3kiLCJoYXNBbGxQZXJtaXNzaW9uIiwiaGFzQXRMZWFzdE9uZVBlcm1pc3Npb24iLCJoYXNSb2xlIiwicmVtb3ZlVXNlckZyb21Sb2xlcyIsIm1ldGhvZHMiLCJ1cGRhdGVkQXQiLCJ1bmJsb2NrIiwicmVjb3JkcyIsIkRhdGUiLCJmaWx0ZXIiLCJyZWNvcmQiLCJfdXBkYXRlZEF0IiwicmVtb3ZlIiwidHJhc2hGaW5kRGVsZXRlZEFmdGVyIiwiX2RlbGV0ZWRBdCIsIm9uIiwidHlwZSIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlMb2dnZWRJblRoaXNJbnN0YW5jZSIsInB1Ymxpc2giLCJyZWFkeSIsImxpbWl0IiwiZXJyb3IiLCJzb3J0IiwidXNlcm5hbWUiLCJtZXRob2QiLCJhY3Rpb24iLCJpc1N0cmluZyIsImZpbmRPbmVCeVVzZXJuYW1lIiwiYWRkIiwibm90aWZ5TG9nZ2VkIiwiZXhpc3RpbmdVc2VycyIsImNvdW50IiwiYWRtaW5Db3VudCIsInVzZXJJc0FkbWluIiwiaW5kZXhPZiIsInJvbGVEYXRhIiwiaW5jbHVkZXMiLCJzdGFydHVwIiwiZGVmYXVsdFJvbGVzIiwiJHNldE9uSW5zZXJ0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsV0FBV0MsS0FBWCxHQUFtQixFQUFuQixDOzs7Ozs7Ozs7OztBQ0FBLE1BQU1DLGdCQUFOLFNBQStCRixXQUFXRyxNQUFYLENBQWtCQyxLQUFqRCxDQUF1RDtBQUN0REMsZ0JBQWM7QUFDYixVQUFNLEdBQUdDLFNBQVQ7QUFDQSxHQUhxRCxDQUt0RDs7O0FBQ0FDLGFBQVdDLElBQVgsRUFBaUJDLE9BQWpCLEVBQTBCO0FBQ3pCLFVBQU1DLFFBQVE7QUFDYkMsYUFBT0g7QUFETSxLQUFkO0FBSUEsV0FBTyxLQUFLSSxJQUFMLENBQVVGLEtBQVYsRUFBaUJELE9BQWpCLENBQVA7QUFDQTs7QUFFREksY0FBWUMsR0FBWixFQUFpQjtBQUNoQixXQUFPLEtBQUtDLE9BQUwsQ0FBYUQsR0FBYixDQUFQO0FBQ0E7O0FBRURFLGlCQUFlQyxJQUFmLEVBQXFCTixLQUFyQixFQUE0QjtBQUMzQixTQUFLTyxNQUFMLENBQVk7QUFBRUosV0FBS0c7QUFBUCxLQUFaLEVBQTJCO0FBQUVFLFlBQU07QUFBRVI7QUFBRjtBQUFSLEtBQTNCO0FBQ0E7O0FBRURTLFVBQVFDLFVBQVIsRUFBb0JiLElBQXBCLEVBQTBCO0FBQ3pCLFNBQUtjLE1BQUwsQ0FBWTtBQUFFUixXQUFLTztBQUFQLEtBQVosRUFBaUM7QUFBRUUsaUJBQVc7QUFBRVosZUFBT0g7QUFBVDtBQUFiLEtBQWpDO0FBQ0E7O0FBRURnQixhQUFXSCxVQUFYLEVBQXVCYixJQUF2QixFQUE2QjtBQUM1QixTQUFLYyxNQUFMLENBQVk7QUFBRVIsV0FBS087QUFBUCxLQUFaLEVBQWlDO0FBQUVJLGFBQU87QUFBRWQsZUFBT0g7QUFBVDtBQUFULEtBQWpDO0FBQ0E7O0FBNUJxRDs7QUErQnZEUixXQUFXRyxNQUFYLENB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QixFQUFpQztBQUNoQ25KLGVBQVdHLE1BQVgsQ0FBa0IrQyxLQUFsQixDQUF3QmhDLE1BQXhCLENBQStCO0FBQUVKLFdBQUtOLEtBQUtTO0FBQVosS0FBL0IsRUFBbUQ7QUFBRW1JLG9CQUFjO0FBQUVwSCxlQUFPeEIsS0FBS3dCLEtBQWQ7QUFBcUJVLHFCQUFhbEMsS0FBS2tDLFdBQUwsSUFBb0IsRUFBdEQ7QUFBMERHLG1CQUFXO0FBQXJFO0FBQWhCLEtBQW5EO0FBQ0E7QUFDRCxDQXhGRCxFIiwiZmlsZSI6Ii9wYWNrYWdlcy9yb2NrZXRjaGF0X2F1dGhvcml6YXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJSb2NrZXRDaGF0LmF1dGh6ID0ge307XG4iLCJjbGFzcyBNb2RlbFBlcm1pc3Npb25zIGV4dGVuZHMgUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2Uge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlciguLi5hcmd1bWVudHMpO1xuXHR9XG5cblx0Ly8gRklORFxuXHRmaW5kQnlSb2xlKHJvbGUsIG9wdGlvbnMpIHtcblx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdHJvbGVzOiByb2xlXG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmZpbmQocXVlcnksIG9wdGlvbnMpO1xuXHR9XG5cblx0ZmluZE9uZUJ5SWQoX2lkKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmluZE9uZShfaWQpO1xuXHR9XG5cblx0Y3JlYXRlT3JVcGRhdGUobmFtZSwgcm9sZXMpIHtcblx0XHR0aGlzLnVwc2VydCh7IF9pZDogbmFtZSB9LCB7ICRzZXQ6IHsgcm9sZXMgfSB9KTtcblx0fVxuXG5cdGFkZFJvbGUocGVybWlzc2lvbiwgcm9sZSkge1xuXHRcdHRoaXMudXBkYXRlKHsgX2lkOiBwZXJtaXNzaW9uIH0sIHsgJGFkZFRvU2V0OiB7IHJvbGVzOiByb2xlIH0gfSk7XG5cdH1cblxuXHRyZW1vdmVSb2xlKHBlcm1pc3Npb24sIHJvbGUpIHtcblx0XHR0aGlzLnVwZGF0ZSh7IF9pZDogcGVybWlzc2lvbiB9LCB7ICRwdWxsOiB7IHJvbGVzOiByb2xlIH0gfSk7XG5cdH1cbn1cblxuUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMgPSBuZXcgTW9kZWxQZXJtaXNzaW9ucygncGVybWlzc2lvbnMnLCB0cnVlKTtcblJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmNhY2hlLmxvYWQoKTtcbiIsImNsYXNzIE1vZGVsUm9sZXMgZXh0ZW5kcyBSb2NrZXRDaGF0Lm1vZGVscy5fQmFzZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKC4uLmFyZ3VtZW50cyk7XG5cdFx0dGhpcy50cnlFbnN1cmVJbmRleCh7ICduYW1lJzogMSB9KTtcblx0XHR0aGlzLnRyeUVuc3VyZUluZGV4KHsgJ3Njb3BlJzogMSB9KTtcblx0fVxuXG5cdGZpbmRVc2Vyc0luUm9sZShuYW1lLCBzY29wZSwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHJvbGUgPSB0aGlzLmZpbmRPbmUobmFtZSk7XG5cdFx0Y29uc3Qgcm9sZVNjb3BlID0gKHJvbGUgJiYgcm9sZS5zY29wZSkgfHwgJ1VzZXJzJztcblx0XHRjb25zdCBtb2RlbCA9IFJvY2tldENoYXQubW9kZWxzW3JvbGVTY29wZV07XG5cblx0XHRyZXR1cm4gbW9kZWwgJiYgbW9kZWwuZmluZFVzZXJzSW5Sb2xlcyAmJiBtb2RlbC5maW5kVXNlcnNJblJvbGVzKG5hbWUsIHNjb3BlLCBvcHRpb25zKTtcblx0fVxuXG5cdGlzVXNlckluUm9sZXModXNlcklkLCByb2xlcywgc2NvcGUpIHtcblx0XHRyb2xlcyA9IFtdLmNvbmNhdChyb2xlcyk7XG5cdFx0cmV0dXJuIHJvbGVzLnNvbWUoKHJvbGVOYW1lKSA9PiB7XG5cdFx0XHRjb25zdCByb2xlID0gdGhpcy5maW5kT25lKHJvbGVOYW1lKTtcblx0XHRcdGNvbnN0IHJvbGVTY29wZSA9IChyb2xlICYmIHJvbGUuc2NvcGUpIHx8ICdVc2Vycyc7XG5cdFx0XHRjb25zdCBtb2RlbCA9IFJvY2tldENoYXQubW9kZWxzW3JvbGVTY29wZV07XG5cblx0XHRcdHJldHVybiBtb2RlbCAmJiBtb2RlbC5pc1VzZXJJblJvbGUgJiYgbW9kZWwuaXNVc2VySW5Sb2xlKHVzZXJJZCwgcm9sZU5hbWUsIHNjb3BlKTtcblx0XHR9KTtcblx0fVxuXG5cdGNyZWF0ZU9yVXBkYXRlKG5hbWUsIHNjb3BlID0gJ1VzZXJzJywgZGVzY3JpcHRpb24sIHByb3RlY3RlZFJvbGUpIHtcblx0XHRjb25zdCB1cGRhdGVEYXRhID0ge307XG5cdFx0dXBkYXRlRGF0YS5uYW1lID0gbmFtZTtcblx0XHR1cGRhdGVEYXRhLnNjb3BlID0gc2NvcGU7XG5cblx0XHRpZiAoZGVzY3JpcHRpb24gIT0gbnVsbCkge1xuXHRcdFx0dXBkYXRlRGF0YS5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuXHRcdH1cblxuXHRcdGlmIChwcm90ZWN0ZWRSb2xlKSB7XG5cdFx0XHR1cGRhdGVEYXRhLnByb3RlY3RlZCA9IHByb3RlY3RlZFJvbGU7XG5cdFx0fVxuXG5cdFx0dGhpcy51cHNlcnQoeyBfaWQ6IG5hbWUgfSwgeyAkc2V0OiB1cGRhdGVEYXRhIH0pO1xuXHR9XG5cblx0YWRkVXNlclJvbGVzKHVzZXJJZCwgcm9sZXMsIHNjb3BlKSB7XG5cdFx0cm9sZXMgPSBbXS5jb25jYXQocm9sZXMpO1xuXHRcdGZvciAoY29uc3Qgcm9sZU5hbWUgb2Ygcm9sZXMpIHtcblx0XHRcdGNvbnN0IHJvbGUgPSB0aGlzLmZpbmRPbmUocm9sZU5hbWUpO1xuXHRcdFx0Y29uc3Qgcm9sZVNjb3BlID0gKHJvbGUgJiYgcm9sZS5zY29wZSkgfHwgJ1VzZXJzJztcblx0XHRcdGNvbnN0IG1vZGVsID0gUm9ja2V0Q2hhdC5tb2RlbHNbcm9sZVNjb3BlXTtcblxuXHRcdFx0bW9kZWwgJiYgbW9kZWwuYWRkUm9sZXNCeVVzZXJJZCAmJiBtb2RlbC5hZGRSb2xlc0J5VXNlcklkKHVzZXJJZCwgcm9sZU5hbWUsIHNjb3BlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRyZW1vdmVVc2VyUm9sZXModXNlcklkLCByb2xlcywgc2NvcGUpIHtcblx0XHRyb2xlcyA9IFtdLmNvbmNhdChyb2xlcyk7XG5cdFx0Zm9yIChjb25zdCByb2xlTmFtZSBvZiByb2xlcykge1xuXHRcdFx0Y29uc3Qgcm9sZSA9IHRoaXMuZmluZE9uZShyb2xlTmFtZSk7XG5cdFx0XHRjb25zdCByb2xlU2NvcGUgPSAocm9sZSAmJiByb2xlLnNjb3BlKSB8fCAnVXNlcnMnO1xuXHRcdFx0Y29uc3QgbW9kZWwgPSBSb2NrZXRDaGF0Lm1vZGVsc1tyb2xlU2NvcGVdO1xuXG5cdFx0XHRtb2RlbCAmJiBtb2RlbC5yZW1vdmVSb2xlc0J5VXNlcklkICYmIG1vZGVsLnJlbW92ZVJvbGVzQnlVc2VySWQodXNlcklkLCByb2xlTmFtZSwgc2NvcGUpO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcyA9IG5ldyBNb2RlbFJvbGVzKCdyb2xlcycsIHRydWUpO1xuUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY2FjaGUubG9hZCgpO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblJvY2tldENoYXQubW9kZWxzLl9CYXNlLnByb3RvdHlwZS5yb2xlQmFzZVF1ZXJ5ID0gZnVuY3Rpb24oLyp1c2VySWQsIHNjb3BlKi8pIHtcblx0cmV0dXJuO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2UucHJvdG90eXBlLmZpbmRSb2xlc0J5VXNlcklkID0gZnVuY3Rpb24odXNlcklkLyosIG9wdGlvbnMqLykge1xuXHRjb25zdCBxdWVyeSA9IHRoaXMucm9sZUJhc2VRdWVyeSh1c2VySWQpO1xuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCB7IGZpZWxkczogeyByb2xlczogMSB9IH0pO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2UucHJvdG90eXBlLmlzVXNlckluUm9sZSA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZU5hbWUsIHNjb3BlKSB7XG5cdGNvbnN0IHF1ZXJ5ID0gdGhpcy5yb2xlQmFzZVF1ZXJ5KHVzZXJJZCwgc2NvcGUpO1xuXG5cdGlmIChxdWVyeSA9PSBudWxsKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cXVlcnkucm9sZXMgPSByb2xlTmFtZTtcblx0cmV0dXJuICFfLmlzVW5kZWZpbmVkKHRoaXMuZmluZE9uZShxdWVyeSkpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2UucHJvdG90eXBlLmFkZFJvbGVzQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVzLCBzY29wZSkge1xuXHRyb2xlcyA9IFtdLmNvbmNhdChyb2xlcyk7XG5cdGNvbnN0IHF1ZXJ5ID0gdGhpcy5yb2xlQmFzZVF1ZXJ5KHVzZXJJZCwgc2NvcGUpO1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JGFkZFRvU2V0OiB7XG5cdFx0XHRyb2xlczogeyAkZWFjaDogcm9sZXMgfVxuXHRcdH1cblx0fTtcblx0cmV0dXJuIHRoaXMudXBkYXRlKHF1ZXJ5LCB1cGRhdGUpO1xufTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuX0Jhc2UucHJvdG90eXBlLnJlbW92ZVJvbGVzQnlVc2VySWQgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVzLCBzY29wZSkge1xuXHRyb2xlcyA9IFtdLmNvbmNhdChyb2xlcyk7XG5cdGNvbnN0IHF1ZXJ5ID0gdGhpcy5yb2xlQmFzZVF1ZXJ5KHVzZXJJZCwgc2NvcGUpO1xuXHRjb25zdCB1cGRhdGUgPSB7XG5cdFx0JHB1bGxBbGw6IHtcblx0XHRcdHJvbGVzXG5cdFx0fVxuXHR9O1xuXHRyZXR1cm4gdGhpcy51cGRhdGUocXVlcnksIHVwZGF0ZSk7XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5fQmFzZS5wcm90b3R5cGUuZmluZFVzZXJzSW5Sb2xlcyA9IGZ1bmN0aW9uKCkge1xuXHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdvdmVyd3JpdGUtZnVuY3Rpb24nLCAnWW91IG11c3Qgb3ZlcndyaXRlIHRoaXMgZnVuY3Rpb24gaW4gdGhlIGV4dGVuZGVkIGNsYXNzZXMnKTtcbn07XG4iLCJSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5yb2xlQmFzZVF1ZXJ5ID0gZnVuY3Rpb24odXNlcklkKSB7XG5cdHJldHVybiB7IF9pZDogdXNlcklkIH07XG59O1xuXG5Sb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kVXNlcnNJblJvbGVzID0gZnVuY3Rpb24ocm9sZXMsIHNjb3BlLCBvcHRpb25zKSB7XG5cdHJvbGVzID0gW10uY29uY2F0KHJvbGVzKTtcblxuXHRjb25zdCBxdWVyeSA9IHtcblx0XHRyb2xlczogeyAkaW46IHJvbGVzIH1cblx0fTtcblxuXHRyZXR1cm4gdGhpcy5maW5kKHF1ZXJ5LCBvcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5yb2xlQmFzZVF1ZXJ5ID0gZnVuY3Rpb24odXNlcklkLCBzY29wZSkge1xuXHRpZiAoc2NvcGUgPT0gbnVsbCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHF1ZXJ5ID0geyAndS5faWQnOiB1c2VySWQgfTtcblx0aWYgKCFfLmlzVW5kZWZpbmVkKHNjb3BlKSkge1xuXHRcdHF1ZXJ5LnJpZCA9IHNjb3BlO1xuXHR9XG5cdHJldHVybiBxdWVyeTtcbn07XG5cblJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZFVzZXJzSW5Sb2xlcyA9IGZ1bmN0aW9uKHJvbGVzLCBzY29wZSwgb3B0aW9ucykge1xuXHRyb2xlcyA9IFtdLmNvbmNhdChyb2xlcyk7XG5cblx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0cm9sZXM6IHsgJGluOiByb2xlcyB9XG5cdH07XG5cblx0aWYgKHNjb3BlKSB7XG5cdFx0cXVlcnkucmlkID0gc2NvcGU7XG5cdH1cblxuXHRjb25zdCBzdWJzY3JpcHRpb25zID0gdGhpcy5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xuXG5cdGNvbnN0IHVzZXJzID0gXy5jb21wYWN0KF8ubWFwKHN1YnNjcmlwdGlvbnMsIGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xuXHRcdGlmICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHN1YnNjcmlwdGlvbi51ICYmICd1bmRlZmluZWQnICE9PSB0eXBlb2Ygc3Vic2NyaXB0aW9uLnUuX2lkKSB7XG5cdFx0XHRyZXR1cm4gc3Vic2NyaXB0aW9uLnUuX2lkO1xuXHRcdH1cblx0fSkpO1xuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHsgX2lkOiB7ICRpbjogdXNlcnMgfSB9LCBvcHRpb25zKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5hdXRoei5hZGRVc2VyUm9sZXMgPSBmdW5jdGlvbih1c2VySWQsIHJvbGVOYW1lcywgc2NvcGUpIHtcblx0aWYgKCF1c2VySWQgfHwgIXJvbGVOYW1lcykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdGNvbnN0IHVzZXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5kYi5maW5kT25lQnlJZCh1c2VySWQpO1xuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LmF1dGh6LmFkZFVzZXJSb2xlcydcblx0XHR9KTtcblx0fVxuXG5cdHJvbGVOYW1lcyA9IFtdLmNvbmNhdChyb2xlTmFtZXMpO1xuXHRjb25zdCBleGlzdGluZ1JvbGVOYW1lcyA9IF8ucGx1Y2soUm9ja2V0Q2hhdC5hdXRoei5nZXRSb2xlcygpLCAnX2lkJyk7XG5cdGNvbnN0IGludmFsaWRSb2xlTmFtZXMgPSBfLmRpZmZlcmVuY2Uocm9sZU5hbWVzLCBleGlzdGluZ1JvbGVOYW1lcyk7XG5cblx0aWYgKCFfLmlzRW1wdHkoaW52YWxpZFJvbGVOYW1lcykpIHtcblx0XHRmb3IgKGNvbnN0IHJvbGUgb2YgaW52YWxpZFJvbGVOYW1lcykge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUocm9sZSk7XG5cdFx0fVxuXHR9XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuYWRkVXNlclJvbGVzKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSk7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiLyogZ2xvYmFscyBSb2NrZXRDaGF0ICovXG5Sb2NrZXRDaGF0LmF1dGh6LnJvb21BY2Nlc3NWYWxpZGF0b3JzID0gW1xuXHRmdW5jdGlvbihyb29tLCB1c2VyID0ge30pIHtcblx0XHRpZiAocm9vbS50ID09PSAnYycpIHtcblx0XHRcdGlmICghdXNlci5faWQgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX0FsbG93QW5vbnltb3VzUmVhZCcpID09PSB0cnVlKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHVzZXIuX2lkLCAndmlldy1jLXJvb20nKTtcblx0XHR9XG5cdH0sXG5cdGZ1bmN0aW9uKHJvb20sIHVzZXIgPSB7fSkge1xuXHRcdGNvbnN0IHN1YnNjcmlwdGlvbiA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb20uX2lkLCB1c2VyLl9pZCk7XG5cdFx0aWYgKHN1YnNjcmlwdGlvbikge1xuXHRcdFx0cmV0dXJuIHN1YnNjcmlwdGlvbi5fcm9vbTtcblx0XHR9XG5cdH1cbl07XG5cblJvY2tldENoYXQuYXV0aHouY2FuQWNjZXNzUm9vbSA9IGZ1bmN0aW9uKHJvb20sIHVzZXIsIGV4dHJhRGF0YSkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5yb29tQWNjZXNzVmFsaWRhdG9ycy5zb21lKCh2YWxpZGF0b3IpID0+IHtcblx0XHRyZXR1cm4gdmFsaWRhdG9yLmNhbGwodGhpcywgcm9vbSwgdXNlciwgZXh0cmFEYXRhKTtcblx0fSk7XG59O1xuXG5Sb2NrZXRDaGF0LmF1dGh6LmFkZFJvb21BY2Nlc3NWYWxpZGF0b3IgPSBmdW5jdGlvbih2YWxpZGF0b3IpIHtcblx0Um9ja2V0Q2hhdC5hdXRoei5yb29tQWNjZXNzVmFsaWRhdG9ycy5wdXNoKHZhbGlkYXRvcik7XG59O1xuIiwiUm9ja2V0Q2hhdC5hdXRoei5nZXRSb2xlcyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZCgpLmZldGNoKCk7XG59O1xuIiwiUm9ja2V0Q2hhdC5hdXRoei5nZXRVc2Vyc0luUm9sZSA9IGZ1bmN0aW9uKHJvbGVOYW1lLCBzY29wZSwgb3B0aW9ucykge1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuZmluZFVzZXJzSW5Sb2xlKHJvbGVOYW1lLCBzY29wZSwgb3B0aW9ucyk7XG59O1xuIiwiZnVuY3Rpb24gYXRMZWFzdE9uZSh1c2VySWQsIHBlcm1pc3Npb25zID0gW10sIHNjb3BlKSB7XG5cdHJldHVybiBwZXJtaXNzaW9ucy5zb21lKChwZXJtaXNzaW9uSWQpID0+IHtcblx0XHRjb25zdCBwZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZShwZXJtaXNzaW9uSWQpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5pc1VzZXJJblJvbGVzKHVzZXJJZCwgcGVybWlzc2lvbi5yb2xlcywgc2NvcGUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gYWxsKHVzZXJJZCwgcGVybWlzc2lvbnMgPSBbXSwgc2NvcGUpIHtcblx0cmV0dXJuIHBlcm1pc3Npb25zLmV2ZXJ5KChwZXJtaXNzaW9uSWQpID0+IHtcblx0XHRjb25zdCBwZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuZmluZE9uZShwZXJtaXNzaW9uSWQpO1xuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5pc1VzZXJJblJvbGVzKHVzZXJJZCwgcGVybWlzc2lvbi5yb2xlcywgc2NvcGUpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gaGFzUGVybWlzc2lvbih1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSwgc3RyYXRlZ3kpIHtcblx0aWYgKCF1c2VySWQpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRwZXJtaXNzaW9ucyA9IFtdLmNvbmNhdChwZXJtaXNzaW9ucyk7XG5cdHJldHVybiBzdHJhdGVneSh1c2VySWQsIHBlcm1pc3Npb25zLCBzY29wZSk7XG59XG5cblJvY2tldENoYXQuYXV0aHouaGFzQWxsUGVybWlzc2lvbiA9IGZ1bmN0aW9uKHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlKSB7XG5cdHJldHVybiBoYXNQZXJtaXNzaW9uKHVzZXJJZCwgcGVybWlzc2lvbnMsIHNjb3BlLCBhbGwpO1xufTtcblxuUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNBbGxQZXJtaXNzaW9uO1xuXG5Sb2NrZXRDaGF0LmF1dGh6Lmhhc0F0TGVhc3RPbmVQZXJtaXNzaW9uID0gZnVuY3Rpb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUpIHtcblx0cmV0dXJuIGhhc1Blcm1pc3Npb24odXNlcklkLCBwZXJtaXNzaW9ucywgc2NvcGUsIGF0TGVhc3RPbmUpO1xufTtcbiIsIlJvY2tldENoYXQuYXV0aHouaGFzUm9sZSA9IGZ1bmN0aW9uKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSkge1xuXHRyb2xlTmFtZXMgPSBbXS5jb25jYXQocm9sZU5hbWVzKTtcblx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmlzVXNlckluUm9sZXModXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKTtcbn07XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzID0gZnVuY3Rpb24odXNlcklkLCByb2xlTmFtZXMsIHNjb3BlKSB7XG5cdGlmICghdXNlcklkIHx8ICFyb2xlTmFtZXMpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRpZiAoIXVzZXIpIHtcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LmF1dGh6LnJlbW92ZVVzZXJGcm9tUm9sZXMnXG5cdFx0fSk7XG5cdH1cblxuXHRyb2xlTmFtZXMgPSBbXS5jb25jYXQocm9sZU5hbWVzKTtcblx0Y29uc3QgZXhpc3RpbmdSb2xlTmFtZXMgPSBfLnBsdWNrKFJvY2tldENoYXQuYXV0aHouZ2V0Um9sZXMoKSwgJ19pZCcpO1xuXHRjb25zdCBpbnZhbGlkUm9sZU5hbWVzID0gXy5kaWZmZXJlbmNlKHJvbGVOYW1lcywgZXhpc3RpbmdSb2xlTmFtZXMpO1xuXG5cdGlmICghXy5pc0VtcHR5KGludmFsaWRSb2xlTmFtZXMpKSB7XG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1yb2xlJywgJ0ludmFsaWQgcm9sZScsIHtcblx0XHRcdGZ1bmN0aW9uOiAnUm9ja2V0Q2hhdC5hdXRoei5yZW1vdmVVc2VyRnJvbVJvbGVzJ1xuXHRcdH0pO1xuXHR9XG5cblx0Um9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMucmVtb3ZlVXNlclJvbGVzKHVzZXJJZCwgcm9sZU5hbWVzLCBzY29wZSk7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQncGVybWlzc2lvbnMvZ2V0Jyh1cGRhdGVkQXQpIHtcblx0XHR0aGlzLnVuYmxvY2soKTtcblxuXHRcdGNvbnN0IHJlY29yZHMgPSBSb2NrZXRDaGF0Lm1vZGVscy5QZXJtaXNzaW9ucy5maW5kKCkuZmV0Y2goKTtcblxuXHRcdGlmICh1cGRhdGVkQXQgaW5zdGFuY2VvZiBEYXRlKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR1cGRhdGU6IHJlY29yZHMuZmlsdGVyKChyZWNvcmQpID0+IHtcblx0XHRcdFx0XHRyZXR1cm4gcmVjb3JkLl91cGRhdGVkQXQgPiB1cGRhdGVkQXQ7XG5cdFx0XHRcdH0pLFxuXHRcdFx0XHRyZW1vdmU6IFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnRyYXNoRmluZERlbGV0ZWRBZnRlcih1cGRhdGVkQXQsIHt9LCB7ZmllbGRzOiB7X2lkOiAxLCBfZGVsZXRlZEF0OiAxfX0pLmZldGNoKClcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlY29yZHM7XG5cdH1cbn0pO1xuXG5cblJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLm9uKCdjaGFuZ2VkJywgKHR5cGUsIHBlcm1pc3Npb24pID0+IHtcblx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZEluVGhpc0luc3RhbmNlKCdwZXJtaXNzaW9ucy1jaGFuZ2VkJywgdHlwZSwgcGVybWlzc2lvbik7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCdyb2xlcycsIGZ1bmN0aW9uKCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5maW5kKCk7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoKCd1c2Vyc0luUm9sZScsIGZ1bmN0aW9uKHJvbGVOYW1lLCBzY29wZSwgbGltaXQgPSA1MCkge1xuXHRpZiAoIXRoaXMudXNlcklkKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVhZHkoKTtcblx0fVxuXG5cdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKHRoaXMudXNlcklkLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRyZXR1cm4gdGhpcy5lcnJvcihuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYWxsb3dlZCcsICdOb3QgYWxsb3dlZCcsIHtcblx0XHRcdHB1Ymxpc2g6ICd1c2Vyc0luUm9sZSdcblx0XHR9KSk7XG5cdH1cblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGxpbWl0LFxuXHRcdHNvcnQ6IHtcblx0XHRcdG5hbWU6IDFcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFJvY2tldENoYXQuYXV0aHouZ2V0VXNlcnNJblJvbGUocm9sZU5hbWUsIHNjb3BlLCBvcHRpb25zKTtcbn0pO1xuIiwiaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246YWRkVXNlclRvUm9sZScocm9sZU5hbWUsIHVzZXJuYW1lLCBzY29wZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBY2Nlc3NpbmcgcGVybWlzc2lvbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246YWRkVXNlclRvUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0FjY2Vzc2luZ19wZXJtaXNzaW9ucydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghcm9sZU5hbWUgfHwgIV8uaXNTdHJpbmcocm9sZU5hbWUpIHx8ICF1c2VybmFtZSB8fCAhXy5pc1N0cmluZyh1c2VybmFtZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtYXJndW1lbnRzJywgJ0ludmFsaWQgYXJndW1lbnRzJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmFkZFVzZXJUb1JvbGUnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRpZiAocm9sZU5hbWUgPT09ICdhZG1pbicgJiYgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhc3NpZ24tYWRtaW4tcm9sZScpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQXNzaWduaW5nIGFkbWluIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOmFkZFVzZXJUb1JvbGUnLFxuXHRcdFx0XHRhY3Rpb246ICdBc3NpZ25fYWRtaW4nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUodXNlcm5hbWUsIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRfaWQ6IDFcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmICghdXNlciB8fCAhdXNlci5faWQpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246YWRkVXNlclRvUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGFkZCA9IFJvY2tldENoYXQubW9kZWxzLlJvbGVzLmFkZFVzZXJSb2xlcyh1c2VyLl9pZCwgcm9sZU5hbWUsIHNjb3BlKTtcblxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnVUlfRGlzcGxheVJvbGVzJykpIHtcblx0XHRcdFJvY2tldENoYXQuTm90aWZpY2F0aW9ucy5ub3RpZnlMb2dnZWQoJ3JvbGVzLWNoYW5nZScsIHtcblx0XHRcdFx0dHlwZTogJ2FkZGVkJyxcblx0XHRcdFx0X2lkOiByb2xlTmFtZSxcblx0XHRcdFx0dToge1xuXHRcdFx0XHRcdF9pZDogdXNlci5faWQsXG5cdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0fSxcblx0XHRcdFx0c2NvcGVcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBhZGQ7XG5cdH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjpkZWxldGVSb2xlJyhyb2xlTmFtZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBY2Nlc3NpbmcgcGVybWlzc2lvbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246ZGVsZXRlUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0FjY2Vzc2luZ19wZXJtaXNzaW9ucydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5maW5kT25lKHJvbGVOYW1lKTtcblx0XHRpZiAoIXJvbGUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtcm9sZScsICdJbnZhbGlkIHJvbGUnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246ZGVsZXRlUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChyb2xlLnByb3RlY3RlZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItZGVsZXRlLXByb3RlY3RlZC1yb2xlJywgJ0Nhbm5vdCBkZWxldGUgYSBwcm90ZWN0ZWQgcm9sZScsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpkZWxldGVSb2xlJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3Qgcm9sZVNjb3BlID0gcm9sZS5zY29wZSB8fCAnVXNlcnMnO1xuXHRcdGNvbnN0IG1vZGVsID0gUm9ja2V0Q2hhdC5tb2RlbHNbcm9sZVNjb3BlXTtcblx0XHRjb25zdCBleGlzdGluZ1VzZXJzID0gbW9kZWwgJiYgbW9kZWwuZmluZFVzZXJzSW5Sb2xlcyAmJiBtb2RlbC5maW5kVXNlcnNJblJvbGVzKHJvbGVOYW1lKTtcblxuXHRcdGlmIChleGlzdGluZ1VzZXJzICYmIGV4aXN0aW5nVXNlcnMuY291bnQoKSA+IDApIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLXJvbGUtaW4tdXNlJywgJ0Nhbm5vdCBkZWxldGUgcm9sZSBiZWNhdXNlIGl0XFwncyBpbiB1c2UnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246ZGVsZXRlUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5yZW1vdmUocm9sZS5uYW1lKTtcblx0fVxufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnYXV0aG9yaXphdGlvbjpyZW1vdmVVc2VyRnJvbVJvbGUnKHJvbGVOYW1lLCB1c2VybmFtZSwgc2NvcGUpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSB8fCAhUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2FjY2Vzcy1wZXJtaXNzaW9ucycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnQWNjZXNzIHBlcm1pc3Npb25zIGlzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnJlbW92ZVVzZXJGcm9tUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0FjY2Vzc2luZ19wZXJtaXNzaW9ucydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghcm9sZU5hbWUgfHwgIV8uaXNTdHJpbmcocm9sZU5hbWUpIHx8ICF1c2VybmFtZSB8fCAhXy5pc1N0cmluZyh1c2VybmFtZSkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtYXJndW1lbnRzJywgJ0ludmFsaWQgYXJndW1lbnRzJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnJlbW92ZVVzZXJGcm9tUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7XG5cdFx0XHR1c2VybmFtZVxuXHRcdH0sIHtcblx0XHRcdGZpZWxkczoge1xuXHRcdFx0XHRfaWQ6IDEsXG5cdFx0XHRcdHJvbGVzOiAxXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRpZiAoIXVzZXIgfHwgIXVzZXIuX2lkKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywge1xuXHRcdFx0XHRtZXRob2Q6ICdhdXRob3JpemF0aW9uOnJlbW92ZVVzZXJGcm9tUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdC8vIHByZXZlbnQgcmVtb3ZpbmcgbGFzdCB1c2VyIGZyb20gYWRtaW4gcm9sZVxuXHRcdGlmIChyb2xlTmFtZSA9PT0gJ2FkbWluJykge1xuXHRcdFx0Y29uc3QgYWRtaW5Db3VudCA9IE1ldGVvci51c2Vycy5maW5kKHtcblx0XHRcdFx0cm9sZXM6IHtcblx0XHRcdFx0XHQkaW46IFsnYWRtaW4nXVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5jb3VudCgpO1xuXG5cdFx0XHRjb25zdCB1c2VySXNBZG1pbiA9IHVzZXIucm9sZXMuaW5kZXhPZignYWRtaW4nKSA+IC0xO1xuXHRcdFx0aWYgKGFkbWluQ291bnQgPT09IDEgJiYgdXNlcklzQWRtaW4pIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0xlYXZpbmcgdGhlIGFwcCB3aXRob3V0IGFkbWlucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdyZW1vdmVVc2VyRnJvbVJvbGUnLFxuXHRcdFx0XHRcdGFjdGlvbjogJ1JlbW92ZV9sYXN0X2FkbWluJ1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCByZW1vdmUgPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb2xlcy5yZW1vdmVVc2VyUm9sZXModXNlci5faWQsIHJvbGVOYW1lLCBzY29wZSk7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVSV9EaXNwbGF5Um9sZXMnKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgncm9sZXMtY2hhbmdlJywge1xuXHRcdFx0XHR0eXBlOiAncmVtb3ZlZCcsXG5cdFx0XHRcdF9pZDogcm9sZU5hbWUsXG5cdFx0XHRcdHU6IHtcblx0XHRcdFx0XHRfaWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNjb3BlXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVtb3ZlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246c2F2ZVJvbGUnKHJvbGVEYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkgfHwgIVJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdhY2Nlc3MtcGVybWlzc2lvbnMnKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdC1hbGxvd2VkJywgJ0FjY2Vzc2luZyBwZXJtaXNzaW9ucyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpzYXZlUm9sZScsXG5cdFx0XHRcdGFjdGlvbjogJ0FjY2Vzc2luZ19wZXJtaXNzaW9ucydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmICghcm9sZURhdGEubmFtZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itcm9sZS1uYW1lLXJlcXVpcmVkJywgJ1JvbGUgbmFtZSBpcyByZXF1aXJlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjpzYXZlUm9sZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGlmIChbJ1VzZXJzJywgJ1N1YnNjcmlwdGlvbnMnXS5pbmNsdWRlcyhyb2xlRGF0YS5zY29wZSkgPT09IGZhbHNlKSB7XG5cdFx0XHRyb2xlRGF0YS5zY29wZSA9ICdVc2Vycyc7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXBkYXRlID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9sZXMuY3JlYXRlT3JVcGRhdGUocm9sZURhdGEubmFtZSwgcm9sZURhdGEuc2NvcGUsIHJvbGVEYXRhLmRlc2NyaXB0aW9uKTtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1VJX0Rpc3BsYXlSb2xlcycpKSB7XG5cdFx0XHRSb2NrZXRDaGF0Lk5vdGlmaWNhdGlvbnMubm90aWZ5TG9nZ2VkKCdyb2xlcy1jaGFuZ2UnLCB7XG5cdFx0XHRcdHR5cGU6ICdjaGFuZ2VkJyxcblx0XHRcdFx0X2lkOiByb2xlRGF0YS5uYW1lXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdXBkYXRlO1xuXHR9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzKHtcblx0J2F1dGhvcml6YXRpb246YWRkUGVybWlzc2lvblRvUm9sZScocGVybWlzc2lvbiwgcm9sZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBZGRpbmcgcGVybWlzc2lvbiBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnYXV0aG9yaXphdGlvbjphZGRQZXJtaXNzaW9uVG9Sb2xlJyxcblx0XHRcdFx0YWN0aW9uOiAnQWRkaW5nX3Blcm1pc3Npb24nXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMuYWRkUm9sZShwZXJtaXNzaW9uLCByb2xlKTtcblx0fVxufSk7XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cdCdhdXRob3JpemF0aW9uOnJlbW92ZVJvbGVGcm9tUGVybWlzc2lvbicocGVybWlzc2lvbiwgcm9sZSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpIHx8ICFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnYWNjZXNzLXBlcm1pc3Npb25zJykpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3QtYWxsb3dlZCcsICdBY2Nlc3NpbmcgcGVybWlzc2lvbnMgaXMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ2F1dGhvcml6YXRpb246cmVtb3ZlUm9sZUZyb21QZXJtaXNzaW9uJyxcblx0XHRcdFx0YWN0aW9uOiAnQWNjZXNzaW5nX3Blcm1pc3Npb25zJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLnJlbW92ZVJvbGUocGVybWlzc2lvbiwgcm9sZSk7XG5cdH1cbn0pO1xuIiwiLyogZXNsaW50IG5vLW11bHRpLXNwYWNlczogMCAqL1xuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Ly8gTm90ZTpcblx0Ly8gMS5pZiB3ZSBuZWVkIHRvIGNyZWF0ZSBhIHJvbGUgdGhhdCBjYW4gb25seSBlZGl0IGNoYW5uZWwgbWVzc2FnZSwgYnV0IG5vdCBlZGl0IGdyb3VwIG1lc3NhZ2Vcblx0Ly8gdGhlbiB3ZSBjYW4gZGVmaW5lIGVkaXQtPHR5cGU+LW1lc3NhZ2UgaW5zdGVhZCBvZiBlZGl0LW1lc3NhZ2Vcblx0Ly8gMi4gYWRtaW4sIG1vZGVyYXRvciwgYW5kIHVzZXIgcm9sZXMgc2hvdWxkIG5vdCBiZSBkZWxldGVkIGFzIHRoZXkgYXJlIHJlZmVyZW5lZCBpbiB0aGUgY29kZS5cblx0Y29uc3QgcGVybWlzc2lvbnMgPSBbXG5cdFx0eyBfaWQ6ICdhY2Nlc3MtcGVybWlzc2lvbnMnLCAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdhZGQtb2F1dGgtc2VydmljZScsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdhZGQtdXNlci10by1qb2luZWQtcm9vbScsICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAnYWRkLXVzZXItdG8tYW55LWMtcm9vbScsICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnYWRkLXVzZXItdG8tYW55LXAtcm9vbScsICAgICAgICByb2xlcyA6IFtdIH0sXG5cdFx0eyBfaWQ6ICdhcmNoaXZlLXJvb20nLCAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICdhc3NpZ24tYWRtaW4tcm9sZScsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdiYW4tdXNlcicsICAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAnYnVsay1jcmVhdGUtYycsICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnYnVsay1yZWdpc3Rlci11c2VyJywgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnY3JlYXRlLWMnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnY3JlYXRlLWQnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnY3JlYXRlLXAnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAnY3JlYXRlLXVzZXInLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnY2xlYW4tY2hhbm5lbC1oaXN0b3J5JywgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LCAvLyBzcGVjaWFsIHBlcm1pc3Npb24gdG8gYnVsayBkZWxldGUgYSBjaGFubmVsJ3MgbWVzYWdlc1xuXHRcdHsgX2lkOiAnZGVsZXRlLWMnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZGVsZXRlLWQnLCAgICAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAnZGVsZXRlLW1lc3NhZ2UnLCAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ2RlbGV0ZS1wJywgICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2RlbGV0ZS11c2VyJywgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ2VkaXQtbWVzc2FnZScsICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJywgJ21vZGVyYXRvciddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LW90aGVyLXVzZXItYWN0aXZlLXN0YXR1cycsIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LW90aGVyLXVzZXItaW5mbycsICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LW90aGVyLXVzZXItcGFzc3dvcmQnLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LXByaXZpbGVnZWQtc2V0dGluZycsICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdlZGl0LXJvb20nLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAnZm9yY2UtZGVsZXRlLW1lc3NhZ2UnLCAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInXSB9LFxuXHRcdHsgX2lkOiAnam9pbi13aXRob3V0LWpvaW4tY29kZScsICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnYm90J10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1hc3NldHMnLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1lbW9qaScsICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1pbnRlZ3JhdGlvbnMnLCAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ21hbmFnZS1vd24taW50ZWdyYXRpb25zJywgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdtYW5hZ2Utb2F1dGgtYXBwcycsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdtZW50aW9uLWFsbCcsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH0sXG5cdFx0eyBfaWQ6ICdtZW50aW9uLWhlcmUnLCAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH0sXG5cdFx0eyBfaWQ6ICdtdXRlLXVzZXInLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InXSB9LFxuXHRcdHsgX2lkOiAncmVtb3ZlLXVzZXInLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAnb3duZXInLCAnbW9kZXJhdG9yJ10gfSxcblx0XHR7IF9pZDogJ3J1bi1pbXBvcnQnLCAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3J1bi1taWdyYXRpb24nLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJ10gfSxcblx0XHR7IF9pZDogJ3NldC1tb2RlcmF0b3InLCAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ3NldC1vd25lcicsICAgICAgICAgICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ293bmVyJ10gfSxcblx0XHR7IF9pZDogJ3NlbmQtbWFueS1tZXNzYWdlcycsICAgICAgICAgICAgcm9sZXMgOiBbJ2FkbWluJywgJ2JvdCddIH0sXG5cdFx0eyBfaWQ6ICdzZXQtbGVhZGVyJywgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lciddIH0sXG5cdFx0eyBfaWQ6ICd1bmFyY2hpdmUtcm9vbScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWMtcm9vbScsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2JvdCcsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndXNlci1nZW5lcmF0ZS1hY2Nlc3MtdG9rZW4nLCAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1kLXJvb20nLCAgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdib3QnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1mdWxsLW90aGVyLXVzZXItaW5mbycsICAgICByb2xlcyA6IFsnYWRtaW4nXSB9LFxuXHRcdHsgX2lkOiAndmlldy1oaXN0b3J5JywgICAgICAgICAgICAgICAgICByb2xlcyA6IFsnYWRtaW4nLCAndXNlcicsICdhbm9ueW1vdXMnXSB9LFxuXHRcdHsgX2lkOiAndmlldy1qb2luZWQtcm9vbScsICAgICAgICAgICAgICByb2xlcyA6IFsnZ3Vlc3QnLCAnYm90JywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWpvaW4tY29kZScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LWxvZ3MnLCAgICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LW90aGVyLXVzZXItY2hhbm5lbHMnLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXAtcm9vbScsICAgICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXByaXZpbGVnZWQtc2V0dGluZycsICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXJvb20tYWRtaW5pc3RyYXRpb24nLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXN0YXRpc3RpY3MnLCAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LXVzZXItYWRtaW5pc3RyYXRpb24nLCAgICAgIHJvbGVzIDogWydhZG1pbiddIH0sXG5cdFx0eyBfaWQ6ICdwcmV2aWV3LWMtcm9vbScsICAgICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICd1c2VyJywgJ2Fub255bW91cyddIH0sXG5cdFx0eyBfaWQ6ICd2aWV3LW91dHNpZGUtcm9vbScsICAgICAgICAgICAgIHJvbGVzIDogWydhZG1pbicsICdvd25lcicsICdtb2RlcmF0b3InLCAndXNlciddIH1cblx0XTtcblxuXHRmb3IgKGNvbnN0IHBlcm1pc3Npb24gb2YgcGVybWlzc2lvbnMpIHtcblx0XHRpZiAoIVJvY2tldENoYXQubW9kZWxzLlBlcm1pc3Npb25zLmZpbmRPbmVCeUlkKHBlcm1pc3Npb24uX2lkKSkge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KHBlcm1pc3Npb24uX2lkLCB7JHNldDogcGVybWlzc2lvbiB9KTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBkZWZhdWx0Um9sZXMgPSBbXG5cdFx0eyBuYW1lOiAnYWRtaW4nLCAgICAgc2NvcGU6ICdVc2VycycsICAgICAgICAgZGVzY3JpcHRpb246ICdBZG1pbicgfSxcblx0XHR7IG5hbWU6ICdtb2RlcmF0b3InLCBzY29wZTogJ1N1YnNjcmlwdGlvbnMnLCBkZXNjcmlwdGlvbjogJ01vZGVyYXRvcicgfSxcblx0XHR7IG5hbWU6ICdsZWFkZXInLCAgICBzY29wZTogJ1N1YnNjcmlwdGlvbnMnLCBkZXNjcmlwdGlvbjogJ0xlYWRlcicgfSxcblx0XHR7IG5hbWU6ICdvd25lcicsICAgICBzY29wZTogJ1N1YnNjcmlwdGlvbnMnLCBkZXNjcmlwdGlvbjogJ093bmVyJyB9LFxuXHRcdHsgbmFtZTogJ3VzZXInLCAgICAgIHNjb3BlOiAnVXNlcnMnLCAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyB9LFxuXHRcdHsgbmFtZTogJ2JvdCcsICAgICAgIHNjb3BlOiAnVXNlcnMnLCAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyB9LFxuXHRcdHsgbmFtZTogJ2d1ZXN0JywgICAgIHNjb3BlOiAnVXNlcnMnLCAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyB9LFxuXHRcdHsgbmFtZTogJ2Fub255bW91cycsIHNjb3BlOiAnVXNlcnMnLCAgICAgICAgIGRlc2NyaXB0aW9uOiAnJyB9XG5cdF07XG5cblx0Zm9yIChjb25zdCByb2xlIG9mIGRlZmF1bHRSb2xlcykge1xuXHRcdFJvY2tldENoYXQubW9kZWxzLlJvbGVzLnVwc2VydCh7IF9pZDogcm9sZS5uYW1lIH0sIHsgJHNldE9uSW5zZXJ0OiB7IHNjb3BlOiByb2xlLnNjb3BlLCBkZXNjcmlwdGlvbjogcm9sZS5kZXNjcmlwdGlvbiB8fCAnJywgcHJvdGVjdGVkOiB0cnVlIH0gfSk7XG5cdH1cbn0pO1xuIl19
