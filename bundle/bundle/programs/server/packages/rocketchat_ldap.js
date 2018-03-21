(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Logger = Package['rocketchat:logger'].Logger;
var SystemLogger = Package['rocketchat:logger'].SystemLogger;
var LoggerManager = Package['rocketchat:logger'].LoggerManager;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var slugify = Package['yasaricli:slugify'].slugify;
var ECMAScript = Package.ecmascript.ECMAScript;
var _ = Package.underscore._;
var SHA256 = Package.sha.SHA256;
var Accounts = Package['accounts-base'].Accounts;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ldap":{"server":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/index.js                                                                     //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.watch(require("./loginHandler"));
module.watch(require("./settings"));
module.watch(require("./testConnection"));
module.watch(require("./syncUsers"));
module.watch(require("./sync"));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ldap.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/ldap.js                                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.export({
  default: () => LDAP
});
let ldapjs;
module.watch(require("ldapjs"), {
  default(v) {
    ldapjs = v;
  }

}, 0);
let Bunyan;
module.watch(require("bunyan"), {
  default(v) {
    Bunyan = v;
  }

}, 1);
const logger = new Logger('LDAP', {
  sections: {
    connection: 'Connection',
    bind: 'Bind',
    search: 'Search',
    auth: 'Auth'
  }
});

class LDAP {
  constructor() {
    this.ldapjs = ldapjs;
    this.connected = false;
    this.options = {
      host: RocketChat.settings.get('LDAP_Host'),
      port: RocketChat.settings.get('LDAP_Port'),
      Reconnect: RocketChat.settings.get('LDAP_Reconnect'),
      Internal_Log_Level: RocketChat.settings.get('LDAP_Internal_Log_Level'),
      timeout: RocketChat.settings.get('LDAP_Timeout'),
      connect_timeout: RocketChat.settings.get('LDAP_Connect_Timeout'),
      idle_timeout: RocketChat.settings.get('LDAP_Idle_Timeout'),
      encryption: RocketChat.settings.get('LDAP_Encryption'),
      ca_cert: RocketChat.settings.get('LDAP_CA_Cert'),
      reject_unauthorized: RocketChat.settings.get('LDAP_Reject_Unauthorized') || false,
      Authentication: RocketChat.settings.get('LDAP_Authentication'),
      Authentication_UserDN: RocketChat.settings.get('LDAP_Authentication_UserDN'),
      Authentication_Password: RocketChat.settings.get('LDAP_Authentication_Password'),
      BaseDN: RocketChat.settings.get('LDAP_BaseDN'),
      User_Search_Filter: RocketChat.settings.get('LDAP_User_Search_Filter'),
      User_Search_Scope: RocketChat.settings.get('LDAP_User_Search_Scope'),
      User_Search_Field: RocketChat.settings.get('LDAP_User_Search_Field'),
      Search_Page_Size: RocketChat.settings.get('LDAP_Search_Page_Size'),
      Search_Size_Limit: RocketChat.settings.get('LDAP_Search_Size_Limit'),
      group_filter_enabled: RocketChat.settings.get('LDAP_Group_Filter_Enable'),
      group_filter_object_class: RocketChat.settings.get('LDAP_Group_Filter_ObjectClass'),
      group_filter_group_id_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Id_Attribute'),
      group_filter_group_member_attribute: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Attribute'),
      group_filter_group_member_format: RocketChat.settings.get('LDAP_Group_Filter_Group_Member_Format'),
      group_filter_group_name: RocketChat.settings.get('LDAP_Group_Filter_Group_Name')
    };
  }

  connectSync(...args) {
    if (!this._connectSync) {
      this._connectSync = Meteor.wrapAsync(this.connectAsync, this);
    }

    return this._connectSync(...args);
  }

  searchAllSync(...args) {
    if (!this._searchAllSync) {
      this._searchAllSync = Meteor.wrapAsync(this.searchAllAsync, this);
    }

    return this._searchAllSync(...args);
  }

  connectAsync(callback) {
    logger.connection.info('Init setup');
    let replied = false;
    const connectionOptions = {
      url: `${this.options.host}:${this.options.port}`,
      timeout: this.options.timeout,
      connectTimeout: this.options.connect_timeout,
      idleTimeout: this.options.idle_timeout,
      reconnect: this.options.Reconnect
    };

    if (this.options.Internal_Log_Level !== 'disabled') {
      connectionOptions.log = new Bunyan({
        name: 'ldapjs',
        component: 'client',
        stream: process.stderr,
        level: this.options.Internal_Log_Level
      });
    }

    const tlsOptions = {
      rejectUnauthorized: this.options.reject_unauthorized
    };

    if (this.options.ca_cert && this.options.ca_cert !== '') {
      // Split CA cert into array of strings
      const chainLines = RocketChat.settings.get('LDAP_CA_Cert').split('\n');
      let cert = [];
      const ca = [];
      chainLines.forEach(line => {
        cert.push(line);

        if (line.match(/-END CERTIFICATE-/)) {
          ca.push(cert.join('\n'));
          cert = [];
        }
      });
      tlsOptions.ca = ca;
    }

    if (this.options.encryption === 'ssl') {
      connectionOptions.url = `ldaps://${connectionOptions.url}`;
      connectionOptions.tlsOptions = tlsOptions;
    } else {
      connectionOptions.url = `ldap://${connectionOptions.url}`;
    }

    logger.connection.info('Connecting', connectionOptions.url);
    logger.connection.debug('connectionOptions', connectionOptions);
    this.client = ldapjs.createClient(connectionOptions);
    this.bindSync = Meteor.wrapAsync(this.client.bind, this.client);
    this.client.on('error', error => {
      logger.connection.error('connection', error);

      if (replied === false) {
        replied = true;
        callback(error, null);
      }
    });
    this.client.on('idle', () => {
      logger.search.info('Idle');
      this.disconnect();
    });
    this.client.on('close', () => {
      logger.search.info('Closed');
    });

    if (this.options.encryption === 'tls') {
      // Set host parameter for tls.connect which is used by ldapjs starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
      // https://github.com/RocketChat/Rocket.Chat/issues/2035
      // https://github.com/mcavage/node-ldapjs/issues/349
      tlsOptions.host = this.options.host;
      logger.connection.info('Starting TLS');
      logger.connection.debug('tlsOptions', tlsOptions);
      this.client.starttls(tlsOptions, null, (error, response) => {
        if (error) {
          logger.connection.error('TLS connection', error);

          if (replied === false) {
            replied = true;
            callback(error, null);
          }

          return;
        }

        logger.connection.info('TLS connected');
        this.connected = true;

        if (replied === false) {
          replied = true;
          callback(null, response);
        }
      });
    } else {
      this.client.on('connect', response => {
        logger.connection.info('LDAP connected');
        this.connected = true;

        if (replied === false) {
          replied = true;
          callback(null, response);
        }
      });
    }

    setTimeout(() => {
      if (replied === false) {
        logger.connection.error('connection time out', connectionOptions.connectTimeout);
        replied = true;
        callback(new Error('Timeout'));
      }
    }, connectionOptions.connectTimeout);
  }

  getUserFilter(username) {
    const filter = [];

    if (this.options.User_Search_Filter !== '') {
      if (this.options.User_Search_Filter[0] === '(') {
        filter.push(`${this.options.User_Search_Filter}`);
      } else {
        filter.push(`(${this.options.User_Search_Filter})`);
      }
    }

    const usernameFilter = this.options.User_Search_Field.split(',').map(item => `(${item}=${username})`);

    if (usernameFilter.length === 0) {
      logger.error('LDAP_LDAP_User_Search_Field not defined');
    } else if (usernameFilter.length === 1) {
      filter.push(`${usernameFilter[0]}`);
    } else {
      filter.push(`(|${usernameFilter.join('')})`);
    }

    return `(&${filter.join('')})`;
  }

  bindIfNecessary() {
    if (this.domainBinded === true) {
      return;
    }

    if (this.options.Authentication !== true) {
      return;
    }

    logger.bind.info('Binding UserDN', this.options.Authentication_UserDN);
    this.bindSync(this.options.Authentication_UserDN, this.options.Authentication_Password);
    this.domainBinded = true;
  }

  searchUsersSync(username, page) {
    this.bindIfNecessary();
    const searchOptions = {
      filter: this.getUserFilter(username),
      scope: this.options.User_Search_Scope || 'sub',
      sizeLimit: this.options.Search_Size_Limit
    };

    if (this.options.Search_Page_Size > 0) {
      searchOptions.paged = {
        pageSize: this.options.Search_Page_Size,
        pagePause: !!page
      };
    }

    logger.search.info('Searching user', username);
    logger.search.debug('searchOptions', searchOptions);
    logger.search.debug('BaseDN', this.options.BaseDN);

    if (page) {
      return this.searchAllPaged(this.options.BaseDN, searchOptions, page);
    }

    return this.searchAllSync(this.options.BaseDN, searchOptions);
  }

  getUserByIdSync(id, attribute) {
    this.bindIfNecessary();
    const Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field').split(',');
    let filter;

    if (attribute) {
      filter = new this.ldapjs.filters.EqualityFilter({
        attribute,
        value: new Buffer(id, 'hex')
      });
    } else {
      const filters = [];
      Unique_Identifier_Field.forEach(item => {
        filters.push(new this.ldapjs.filters.EqualityFilter({
          attribute: item,
          value: new Buffer(id, 'hex')
        }));
      });
      filter = new this.ldapjs.filters.OrFilter({
        filters
      });
    }

    const searchOptions = {
      filter,
      scope: 'sub'
    };
    logger.search.info('Searching by id', id);
    logger.search.debug('search filter', searchOptions.filter.toString());
    logger.search.debug('BaseDN', this.options.BaseDN);
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return;
    }

    if (result.length > 1) {
      logger.search.error('Search by id', id, 'returned', result.length, 'records');
    }

    return result[0];
  }

  getUserByUsernameSync(username) {
    this.bindIfNecessary();
    const searchOptions = {
      filter: this.getUserFilter(username),
      scope: this.options.User_Search_Scope || 'sub'
    };
    logger.search.info('Searching user', username);
    logger.search.debug('searchOptions', searchOptions);
    logger.search.debug('BaseDN', this.options.BaseDN);
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return;
    }

    if (result.length > 1) {
      logger.search.error('Search by username', username, 'returned', result.length, 'records');
    }

    return result[0];
  }

  isUserInGroup(username) {
    if (!this.options.group_filter_enabled) {
      return true;
    }

    const filter = ['(&'];

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`);
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      filter.push(`(${this.options.group_filter_group_member_attribute}=${this.options.group_filter_group_member_format})`);
    }

    if (this.options.group_filter_group_id_attribute !== '') {
      filter.push(`(${this.options.group_filter_group_id_attribute}=${this.options.group_filter_group_name})`);
    }

    filter.push(')');
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, username),
      scope: 'sub'
    };
    logger.search.debug('Group filter LDAP:', searchOptions.filter);
    const result = this.searchAllSync(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return false;
    }

    return true;
  }

  extractLdapEntryData(entry) {
    const values = {
      _raw: entry.raw
    };
    Object.keys(values._raw).forEach(key => {
      const value = values._raw[key];

      if (!['thumbnailPhoto', 'jpegPhoto'].includes(key)) {
        if (value instanceof Buffer) {
          values[key] = value.toString();
        } else {
          values[key] = value;
        }
      }
    });
    return values;
  }

  searchAllPaged(BaseDN, options, page) {
    this.bindIfNecessary();

    const processPage = ({
      entries,
      title,
      end,
      next
    }) => {
      logger.search.info(title); // Force LDAP idle to wait the record processing

      this.client._updateIdle(true);

      page(null, entries, {
        end,
        next: () => {
          // Reset idle timer
          this.client._updateIdle();

          next && next();
        }
      });
    };

    this.client.search(BaseDN, options, (error, res) => {
      if (error) {
        logger.search.error(error);
        page(error);
        return;
      }

      res.on('error', error => {
        logger.search.error(error);
        page(error);
        return;
      });
      let entries = [];
      const internalPageSize = options.paged && options.paged.pageSize > 0 ? options.paged.pageSize * 2 : 500;
      res.on('searchEntry', entry => {
        entries.push(this.extractLdapEntryData(entry));

        if (entries.length >= internalPageSize) {
          processPage({
            entries,
            title: 'Internal Page',
            end: false
          });
          entries = [];
        }
      });
      res.on('page', (result, next) => {
        if (!next) {
          this.client._updateIdle(true);

          processPage({
            entries,
            title: 'Final Page',
            end: true
          });
        } else if (entries.length) {
          logger.search.info('Page');
          processPage({
            entries,
            title: 'Page',
            end: false,
            next
          });
          entries = [];
        }
      });
      res.on('end', () => {
        if (entries.length) {
          processPage({
            entries,
            title: 'Final Page',
            end: true
          });
          entries = [];
        }
      });
    });
  }

  searchAllAsync(BaseDN, options, callback) {
    this.bindIfNecessary();
    this.client.search(BaseDN, options, (error, res) => {
      if (error) {
        logger.search.error(error);
        callback(error);
        return;
      }

      res.on('error', error => {
        logger.search.error(error);
        callback(error);
        return;
      });
      const entries = [];
      res.on('searchEntry', entry => {
        entries.push(this.extractLdapEntryData(entry));
      });
      res.on('end', () => {
        logger.search.info('Search result count', entries.length);
        callback(null, entries);
      });
    });
  }

  authSync(dn, password) {
    logger.auth.info('Authenticating', dn);

    try {
      this.bindSync(dn, password);
      logger.auth.info('Authenticated', dn);
      return true;
    } catch (error) {
      logger.auth.info('Not authenticated', dn);
      logger.auth.debug('error', error);
      return false;
    }
  }

  disconnect() {
    this.connected = false;
    this.domainBinded = false;
    logger.connection.info('Disconecting');
    this.client.unbind();
  }

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"loginHandler.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/loginHandler.js                                                              //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let slug, getLdapUsername, getLdapUserUniqueID, syncUserData, addLdapUser;
module.watch(require("./sync"), {
  slug(v) {
    slug = v;
  },

  getLdapUsername(v) {
    getLdapUsername = v;
  },

  getLdapUserUniqueID(v) {
    getLdapUserUniqueID = v;
  },

  syncUserData(v) {
    syncUserData = v;
  },

  addLdapUser(v) {
    addLdapUser = v;
  }

}, 0);
let LDAP;
module.watch(require("./ldap"), {
  default(v) {
    LDAP = v;
  }

}, 1);
const logger = new Logger('LDAPHandler', {});

function fallbackDefaultAccountSystem(bind, username, password) {
  if (typeof username === 'string') {
    if (username.indexOf('@') === -1) {
      username = {
        username
      };
    } else {
      username = {
        email: username
      };
    }
  }

  logger.info('Fallback to default account system', username);
  const loginRequest = {
    user: username,
    password: {
      digest: SHA256(password),
      algorithm: 'sha-256'
    }
  };
  return Accounts._runLoginHandlers(bind, loginRequest);
}

Accounts.registerLoginHandler('ldap', function (loginRequest) {
  if (!loginRequest.ldap || !loginRequest.ldapOptions) {
    return undefined;
  }

  logger.info('Init LDAP login', loginRequest.username);

  if (RocketChat.settings.get('LDAP_Enable') !== true) {
    return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.ldapPass);
  }

  const self = this;
  const ldap = new LDAP();
  let ldapUser;

  try {
    ldap.connectSync();
    const users = ldap.searchUsersSync(loginRequest.username);

    if (users.length !== 1) {
      logger.info('Search returned', users.length, 'record(s) for', loginRequest.username);
      throw new Error('User not Found');
    }

    if (ldap.authSync(users[0].dn, loginRequest.ldapPass) === true) {
      if (ldap.isUserInGroup(loginRequest.username)) {
        ldapUser = users[0];
      } else {
        throw new Error('User not in a valid group');
      }
    } else {
      logger.info('Wrong password for', loginRequest.username);
    }
  } catch (error) {
    logger.error(error);
  }

  if (ldapUser === undefined) {
    if (RocketChat.settings.get('LDAP_Login_Fallback') === true) {
      return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
    }

    throw new Meteor.Error('LDAP-login-error', `LDAP Authentication failed with provided username [${loginRequest.username}]`);
  } // Look to see if user already exists


  let userQuery;
  const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
  let user;

  if (Unique_Identifier_Field) {
    userQuery = {
      'services.ldap.id': Unique_Identifier_Field.value
    };
    logger.info('Querying user');
    logger.debug('userQuery', userQuery);
    user = Meteor.users.findOne(userQuery);
  }

  let username;

  if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
    username = slug(getLdapUsername(ldapUser));
  } else {
    username = slug(loginRequest.username);
  }

  if (!user) {
    userQuery = {
      username
    };
    logger.debug('userQuery', userQuery);
    user = Meteor.users.findOne(userQuery);
  } // Login user if they exist


  if (user) {
    if (user.ldap !== true && RocketChat.settings.get('LDAP_Merge_Existing_Users') !== true) {
      logger.info('User exists without "ldap: true"');
      throw new Meteor.Error('LDAP-login-error', `LDAP Authentication succeded, but there's already an existing user with provided username [${username}] in Mongo.`);
    }

    logger.info('Logging user');

    const stampedToken = Accounts._generateStampedLoginToken();

    Meteor.users.update(user._id, {
      $push: {
        'services.resume.loginTokens': Accounts._hashStampedToken(stampedToken)
      }
    });
    syncUserData(user, ldapUser);

    if (RocketChat.settings.get('LDAP_Login_Fallback') === true) {
      Accounts.setPassword(user._id, loginRequest.ldapPass, {
        logout: false
      });
    }

    return {
      userId: user._id,
      token: stampedToken.token
    };
  }

  logger.info('User does not exist, creating', username);

  if (RocketChat.settings.get('LDAP_Username_Field') === '') {
    username = undefined;
  }

  if (RocketChat.settings.get('LDAP_Login_Fallback') !== true) {
    loginRequest.ldapPass = undefined;
  } // Create new user


  const result = addLdapUser(ldapUser, username, loginRequest.ldapPass);

  if (result instanceof Error) {
    throw result;
  }

  return result;
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/settings.js                                                                  //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
RocketChat.settings.addGroup('LDAP', function () {
  const enableQuery = {
    _id: 'LDAP_Enable',
    value: true
  };
  const enableAuthentication = [enableQuery, {
    _id: 'LDAP_Authentication',
    value: true
  }];
  const enableTLSQuery = [enableQuery, {
    _id: 'LDAP_Encryption',
    value: {
      $in: ['tls', 'ssl']
    }
  }];
  const syncDataQuery = [enableQuery, {
    _id: 'LDAP_Sync_User_Data',
    value: true
  }];
  const groupFilterQuery = [enableQuery, {
    _id: 'LDAP_Group_Filter_Enable',
    value: true
  }];
  const backgroundSyncQuery = [enableQuery, {
    _id: 'LDAP_Background_Sync',
    value: true
  }];
  this.add('LDAP_Enable', false, {
    type: 'boolean',
    public: true
  });
  this.add('LDAP_Login_Fallback', true, {
    type: 'boolean',
    enableQuery
  });
  this.add('LDAP_Host', '', {
    type: 'string',
    enableQuery
  });
  this.add('LDAP_Port', '389', {
    type: 'string',
    enableQuery
  });
  this.add('LDAP_Reconnect', false, {
    type: 'boolean',
    enableQuery
  });
  this.add('LDAP_Encryption', 'plain', {
    type: 'select',
    values: [{
      key: 'plain',
      i18nLabel: 'No_Encryption'
    }, {
      key: 'tls',
      i18nLabel: 'StartTLS'
    }, {
      key: 'ssl',
      i18nLabel: 'SSL/LDAPS'
    }],
    enableQuery
  });
  this.add('LDAP_CA_Cert', '', {
    type: 'string',
    multiline: true,
    enableQuery: enableTLSQuery
  });
  this.add('LDAP_Reject_Unauthorized', true, {
    type: 'boolean',
    enableQuery: enableTLSQuery
  });
  this.add('LDAP_BaseDN', '', {
    type: 'string',
    enableQuery
  });
  this.add('LDAP_Internal_Log_Level', 'disabled', {
    type: 'select',
    values: [{
      key: 'disabled',
      i18nLabel: 'Disabled'
    }, {
      key: 'error',
      i18nLabel: 'Error'
    }, {
      key: 'warn',
      i18nLabel: 'Warn'
    }, {
      key: 'info',
      i18nLabel: 'Info'
    }, {
      key: 'debug',
      i18nLabel: 'Debug'
    }, {
      key: 'trace',
      i18nLabel: 'Trace'
    }],
    enableQuery
  });
  this.add('LDAP_Test_Connection', 'ldap_test_connection', {
    type: 'action',
    actionText: 'Test_Connection'
  });
  this.section('Authentication', function () {
    this.add('LDAP_Authentication', false, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Authentication_UserDN', '', {
      type: 'string',
      enableQuery: enableAuthentication
    });
    this.add('LDAP_Authentication_Password', '', {
      type: 'password',
      enableQuery: enableAuthentication
    });
  });
  this.section('Timeouts', function () {
    this.add('LDAP_Timeout', 60000, {
      type: 'int',
      enableQuery
    });
    this.add('LDAP_Connect_Timeout', 1000, {
      type: 'int',
      enableQuery
    });
    this.add('LDAP_Idle_Timeout', 1000, {
      type: 'int',
      enableQuery
    });
  });
  this.section('User Search', function () {
    this.add('LDAP_User_Search_Filter', '(objectclass=*)', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_User_Search_Scope', 'sub', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_User_Search_Field', 'sAMAccountName', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_Search_Page_Size', 250, {
      type: 'int',
      enableQuery
    });
    this.add('LDAP_Search_Size_Limit', 1000, {
      type: 'int',
      enableQuery
    });
  });
  this.section('User Search (Group Validation)', function () {
    this.add('LDAP_Group_Filter_Enable', false, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Group_Filter_ObjectClass', 'groupOfUniqueNames', {
      type: 'string',
      enableQuery: groupFilterQuery
    });
    this.add('LDAP_Group_Filter_Group_Id_Attribute', 'cn', {
      type: 'string',
      enableQuery: groupFilterQuery
    });
    this.add('LDAP_Group_Filter_Group_Member_Attribute', 'uniqueMember', {
      type: 'string',
      enableQuery: groupFilterQuery
    });
    this.add('LDAP_Group_Filter_Group_Member_Format', 'uniqueMember', {
      type: 'string',
      enableQuery: groupFilterQuery
    });
    this.add('LDAP_Group_Filter_Group_Name', 'ROCKET_CHAT', {
      type: 'string',
      enableQuery: groupFilterQuery
    });
  });
  this.section('Sync / Import', function () {
    this.add('LDAP_Username_Field', 'sAMAccountName', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_Unique_Identifier_Field', 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_Default_Domain', '', {
      type: 'string',
      enableQuery
    });
    this.add('LDAP_Merge_Existing_Users', false, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Sync_User_Data', false, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Sync_User_Data_FieldMap', '{"cn":"name", "mail":"email"}', {
      type: 'string',
      enableQuery: syncDataQuery
    });
    this.add('LDAP_Sync_User_Avatar', true, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Background_Sync', false, {
      type: 'boolean',
      enableQuery
    });
    this.add('LDAP_Background_Sync_Interval', 'Every 24 hours', {
      type: 'string',
      enableQuery: backgroundSyncQuery
    });
    this.add('LDAP_Background_Sync_Import_New_Users', true, {
      type: 'boolean',
      enableQuery: backgroundSyncQuery
    });
    this.add('LDAP_Background_Sync_Keep_Existant_Users_Updated', true, {
      type: 'boolean',
      enableQuery: backgroundSyncQuery
    });
    this.add('LDAP_Sync_Now', 'ldap_sync_now', {
      type: 'action',
      actionText: 'Execute_Synchronization_Now'
    });
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sync.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/sync.js                                                                      //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
module.export({
  slug: () => slug,
  getPropertyValue: () => getPropertyValue,
  getLdapUsername: () => getLdapUsername,
  getLdapUserUniqueID: () => getLdapUserUniqueID,
  getDataToSyncUserData: () => getDataToSyncUserData,
  syncUserData: () => syncUserData,
  addLdapUser: () => addLdapUser,
  importNewUsers: () => importNewUsers
});

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let LDAP;
module.watch(require("./ldap"), {
  default(v) {
    LDAP = v;
  }

}, 1);
const logger = new Logger('LDAPSync', {});

function slug(text) {
  if (RocketChat.settings.get('UTF8_Names_Slugify') !== true) {
    return text;
  }

  text = slugify(text, '.');
  return text.replace(/[^0-9a-z-_.]/g, '');
}

function getPropertyValue(obj, key) {
  try {
    return _.reduce(key.split('.'), (acc, el) => acc[el], obj);
  } catch (err) {
    return undefined;
  }
}

function getLdapUsername(ldapUser) {
  const usernameField = RocketChat.settings.get('LDAP_Username_Field');

  if (usernameField.indexOf('#{') > -1) {
    return usernameField.replace(/#{(.+?)}/g, function (match, field) {
      return ldapUser[field];
    });
  }

  return ldapUser[usernameField];
}

function getLdapUserUniqueID(ldapUser) {
  let Unique_Identifier_Field = RocketChat.settings.get('LDAP_Unique_Identifier_Field');

  if (Unique_Identifier_Field !== '') {
    Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
  } else {
    Unique_Identifier_Field = [];
  }

  let User_Search_Field = RocketChat.settings.get('LDAP_User_Search_Field');

  if (User_Search_Field !== '') {
    User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',');
  } else {
    User_Search_Field = [];
  }

  Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field);

  if (Unique_Identifier_Field.length > 0) {
    Unique_Identifier_Field = Unique_Identifier_Field.find(field => {
      return !_.isEmpty(ldapUser._raw[field]);
    });

    if (Unique_Identifier_Field) {
      Unique_Identifier_Field = {
        attribute: Unique_Identifier_Field,
        value: ldapUser._raw[Unique_Identifier_Field].toString('hex')
      };
    }

    return Unique_Identifier_Field;
  }
}

function getDataToSyncUserData(ldapUser, user) {
  const syncUserData = RocketChat.settings.get('LDAP_Sync_User_Data');
  const syncUserDataFieldMap = RocketChat.settings.get('LDAP_Sync_User_Data_FieldMap').trim();
  const userData = {};

  if (syncUserData && syncUserDataFieldMap) {
    const whitelistedUserFields = ['email', 'name', 'customFields'];
    const fieldMap = JSON.parse(syncUserDataFieldMap);
    const emailList = [];

    _.map(fieldMap, function (userField, ldapField) {
      switch (userField) {
        case 'email':
          if (!ldapUser.hasOwnProperty(ldapField)) {
            logger.debug(`user does not have attribute: ${ldapField}`);
            return;
          }

          if (_.isObject(ldapUser[ldapField])) {
            _.map(ldapUser[ldapField], function (item) {
              emailList.push({
                address: item,
                verified: true
              });
            });
          } else {
            emailList.push({
              address: ldapUser[ldapField],
              verified: true
            });
          }

          break;

        default:
          const [outerKey, innerKeys] = userField.split(/\.(.+)/);

          if (!_.find(whitelistedUserFields, el => el === outerKey)) {
            logger.debug(`user attribute not whitelisted: ${userField}`);
            return;
          }

          if (outerKey === 'customFields') {
            let customFieldsMeta;

            try {
              customFieldsMeta = JSON.parse(RocketChat.settings.get('Accounts_CustomFields'));
            } catch (e) {
              logger.debug('Invalid JSON for Custom Fields');
              return;
            }

            if (!getPropertyValue(customFieldsMeta, innerKeys)) {
              logger.debug(`user attribute does not exist: ${userField}`);
              return;
            }
          }

          const tmpUserField = getPropertyValue(user, userField);
          const tmpLdapField = RocketChat.templateVarHandler(ldapField, ldapUser);

          if (tmpLdapField && tmpUserField !== tmpLdapField) {
            // creates the object structure instead of just assigning 'tmpLdapField' to
            // 'userData[userField]' in order to avoid the "cannot use the part (...)
            // to traverse the element" (MongoDB) error that can happen. Do not handle
            // arrays.
            // TODO: Find a better solution.
            const dKeys = userField.split('.');

            const lastKey = _.last(dKeys);

            _.reduce(dKeys, (obj, currKey) => currKey === lastKey ? obj[currKey] = tmpLdapField : obj[currKey] = obj[currKey] || {}, userData);

            logger.debug(`user.${userField} changed to: ${tmpLdapField}`);
          }

      }
    });

    if (emailList.length > 0) {
      if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
        userData.emails = emailList;
      }
    }
  }

  const uniqueId = getLdapUserUniqueID(ldapUser);

  if (uniqueId && (!user.services || !user.services.ldap || user.services.ldap.id !== uniqueId.value || user.services.ldap.idAttribute !== uniqueId.attribute)) {
    userData['services.ldap.id'] = uniqueId.value;
    userData['services.ldap.idAttribute'] = uniqueId.attribute;
  }

  if (user.ldap !== true) {
    userData.ldap = true;
  }

  if (_.size(userData)) {
    return userData;
  }
}

function syncUserData(user, ldapUser) {
  logger.info('Syncing user data');
  logger.debug('user', {
    'email': user.email,
    '_id': user._id
  });
  logger.debug('ldapUser', ldapUser.object);
  const userData = getDataToSyncUserData(ldapUser, user);

  if (user && user._id && userData) {
    logger.debug('setting', JSON.stringify(userData, null, 2));

    if (userData.name) {
      RocketChat._setRealName(user._id, userData.name);

      delete userData.name;
    }

    Meteor.users.update(user._id, {
      $set: userData
    });
    user = Meteor.users.findOne({
      _id: user._id
    });
  }

  if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
    const username = slug(getLdapUsername(ldapUser));

    if (user && user._id && username !== user.username) {
      logger.info('Syncing user username', user.username, '->', username);

      RocketChat._setUsername(user._id, username);
    }
  }

  if (user && user._id && RocketChat.settings.get('LDAP_Sync_User_Avatar') === true) {
    const avatar = ldapUser._raw.thumbnailPhoto || ldapUser._raw.jpegPhoto;

    if (avatar) {
      logger.info('Syncing user avatar');
      const rs = RocketChatFile.bufferToStream(avatar);
      const fileStore = FileUpload.getStore('Avatars');
      fileStore.deleteByName(user.username);
      const file = {
        userId: user._id,
        type: 'image/jpeg'
      };
      Meteor.runAsUser(user._id, () => {
        fileStore.insert(file, rs, () => {
          Meteor.setTimeout(function () {
            RocketChat.models.Users.setAvatarOrigin(user._id, 'ldap');
            RocketChat.Notifications.notifyLogged('updateAvatar', {
              username: user.username
            });
          }, 500);
        });
      });
    }
  }
}

function addLdapUser(ldapUser, username, password) {
  const uniqueId = getLdapUserUniqueID(ldapUser);
  const userObject = {};

  if (username) {
    userObject.username = username;
  }

  const userData = getDataToSyncUserData(ldapUser, {});

  if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
    if (Array.isArray(userData.emails[0].address)) {
      userObject.email = userData.emails[0].address[0];
    } else {
      userObject.email = userData.emails[0].address;
    }
  } else if (ldapUser.mail && ldapUser.mail.indexOf('@') > -1) {
    userObject.email = ldapUser.mail;
  } else if (RocketChat.settings.get('LDAP_Default_Domain') !== '') {
    userObject.email = `${username || uniqueId.value}@${RocketChat.settings.get('LDAP_Default_Domain')}`;
  } else {
    const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?');
    logger.error(error);
    throw error;
  }

  logger.debug('New user data', userObject);

  if (password) {
    userObject.password = password;
  }

  try {
    userObject._id = Accounts.createUser(userObject);
  } catch (error) {
    logger.error('Error creating user', error);
    return error;
  }

  syncUserData(userObject, ldapUser);
  return {
    userId: userObject._id
  };
}

function importNewUsers(ldap) {
  if (RocketChat.settings.get('LDAP_Enable') !== true) {
    logger.error('Can\'t run LDAP Import, LDAP is disabled');
    return;
  }

  if (!ldap) {
    ldap = new LDAP();
    ldap.connectSync();
  }

  let count = 0;
  ldap.searchUsersSync('*', Meteor.bindEnvironment((error, ldapUsers, {
    next,
    end
  } = {}) => {
    if (error) {
      throw error;
    }

    ldapUsers.forEach(ldapUser => {
      count++;
      const uniqueId = getLdapUserUniqueID(ldapUser); // Look to see if user already exists

      const userQuery = {
        'services.ldap.id': uniqueId.value
      };
      logger.debug('userQuery', userQuery);
      let username;

      if (RocketChat.settings.get('LDAP_Username_Field') !== '') {
        username = slug(getLdapUsername(ldapUser));
      } // Add user if it was not added before


      let user = Meteor.users.findOne(userQuery);

      if (!user && username && RocketChat.settings.get('LDAP_Merge_Existing_Users') === true) {
        const userQuery = {
          username
        };
        logger.debug('userQuery merge', userQuery);
        user = Meteor.users.findOne(userQuery);

        if (user) {
          syncUserData(user, ldapUser);
        }
      }

      if (!user) {
        addLdapUser(ldapUser, username);
      }

      if (count % 100 === 0) {
        logger.info('Import running. Users imported until now:', count);
      }
    });

    if (end) {
      logger.info('Import finished. Users imported:', count);
    }

    next(count);
  }));
}

function sync() {
  if (RocketChat.settings.get('LDAP_Enable') !== true) {
    return;
  }

  const ldap = new LDAP();

  try {
    ldap.connectSync();
    let users;

    if (RocketChat.settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
      users = RocketChat.models.Users.findLDAPUsers();
    }

    if (RocketChat.settings.get('LDAP_Background_Sync_Import_New_Users') === true) {
      importNewUsers(ldap);
    }

    if (RocketChat.settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated') === true) {
      users.forEach(function (user) {
        let ldapUser;

        if (user.services && user.services.ldap && user.services.ldap.id) {
          ldapUser = ldap.getUserByIdSync(user.services.ldap.id, user.services.ldap.idAttribute);
        } else {
          ldapUser = ldap.getUserByUsernameSync(user.username);
        }

        if (ldapUser) {
          syncUserData(user, ldapUser);
        } else {
          logger.info('Can\'t sync user', user.username);
        }
      });
    }
  } catch (error) {
    logger.error(error);
    return error;
  }

  return true;
}

const jobName = 'LDAP_Sync';

const addCronJob = _.debounce(Meteor.bindEnvironment(function addCronJobDebounced() {
  if (RocketChat.settings.get('LDAP_Background_Sync') !== true) {
    logger.info('Disabling LDAP Background Sync');

    if (SyncedCron.nextScheduledAtDate(jobName)) {
      SyncedCron.remove(jobName);
    }

    return;
  }

  if (RocketChat.settings.get('LDAP_Background_Sync_Interval')) {
    logger.info('Enabling LDAP Background Sync');
    SyncedCron.add({
      name: jobName,
      schedule: parser => parser.text(RocketChat.settings.get('LDAP_Background_Sync_Interval')),

      job() {
        sync();
      }

    });
    SyncedCron.start();
  }
}), 500);

Meteor.startup(() => {
  Meteor.defer(() => {
    RocketChat.settings.get('LDAP_Background_Sync', addCronJob);
    RocketChat.settings.get('LDAP_Background_Sync_Interval', addCronJob);
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"syncUsers.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/syncUsers.js                                                                 //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let importNewUsers;
module.watch(require("./sync"), {
  importNewUsers(v) {
    importNewUsers = v;
  }

}, 0);
Meteor.methods({
  ldap_sync_now() {
    const user = Meteor.user();

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'ldap_sync_users'
      });
    }

    if (!RocketChat.authz.hasRole(user._id, 'admin')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'ldap_sync_users'
      });
    }

    if (RocketChat.settings.get('LDAP_Enable') !== true) {
      throw new Meteor.Error('LDAP_disabled');
    }

    this.unblock();
    importNewUsers();
    return {
      message: 'Sync_in_progress',
      params: []
    };
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"testConnection.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_ldap/server/testConnection.js                                                            //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let LDAP;
module.watch(require("./ldap"), {
  default(v) {
    LDAP = v;
  }

}, 0);
Meteor.methods({
  ldap_test_connection() {
    const user = Meteor.user();

    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'ldap_test_connection'
      });
    }

    if (!RocketChat.authz.hasRole(user._id, 'admin')) {
      throw new Meteor.Error('error-not-authorized', 'Not authorized', {
        method: 'ldap_test_connection'
      });
    }

    if (RocketChat.settings.get('LDAP_Enable') !== true) {
      throw new Meteor.Error('LDAP_disabled');
    }

    let ldap;

    try {
      ldap = new LDAP();
      ldap.connectSync();
    } catch (error) {
      console.log(error);
      throw new Meteor.Error(error.message);
    }

    try {
      ldap.bindIfNecessary();
    } catch (error) {
      throw new Meteor.Error(error.name || error.message);
    }

    return {
      message: 'Connection_success',
      params: []
    };
  }

});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/rocketchat:ldap/server/index.js");

/* Exports */
Package._define("rocketchat:ldap", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ldap.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsZGFwL3NlcnZlci9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsZGFwL3NlcnZlci9sZGFwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxkYXAvc2VydmVyL2xvZ2luSGFuZGxlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsZGFwL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsZGFwL3NlcnZlci9zeW5jLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmxkYXAvc2VydmVyL3N5bmNVc2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpsZGFwL3NlcnZlci90ZXN0Q29ubmVjdGlvbi5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJleHBvcnQiLCJkZWZhdWx0IiwiTERBUCIsImxkYXBqcyIsInYiLCJCdW55YW4iLCJsb2dnZXIiLCJMb2dnZXIiLCJzZWN0aW9ucyIsImNvbm5lY3Rpb24iLCJiaW5kIiwic2VhcmNoIiwiYXV0aCIsImNvbnN0cnVjdG9yIiwiY29ubmVjdGVkIiwib3B0aW9ucyIsImhvc3QiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJnZXQiLCJwb3J0IiwiUmVjb25uZWN0IiwiSW50ZXJuYWxfTG9nX0xldmVsIiwidGltZW91dCIsImNvbm5lY3RfdGltZW91dCIsImlkbGVfdGltZW91dCIsImVuY3J5cHRpb24iLCJjYV9jZXJ0IiwicmVqZWN0X3VuYXV0aG9yaXplZCIsIkF1dGhlbnRpY2F0aW9uIiwiQXV0aGVudGljYXRpb25fVXNlckROIiwiQXV0aGVudGljYXRpb25fUGFzc3dvcmQiLCJCYXNlRE4iLCJVc2VyX1NlYXJjaF9GaWx0ZXIiLCJVc2VyX1NlYXJjaF9TY29wZSIsIlVzZXJfU2VhcmNoX0ZpZWxkIiwiU2VhcmNoX1BhZ2VfU2l6ZSIsIlNlYXJjaF9TaXplX0xpbWl0IiwiZ3JvdXBfZmlsdGVyX2VuYWJsZWQiLCJncm91cF9maWx0ZXJfb2JqZWN0X2NsYXNzIiwiZ3JvdXBfZmlsdGVyX2dyb3VwX2lkX2F0dHJpYnV0ZSIsImdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlIiwiZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXQiLCJncm91cF9maWx0ZXJfZ3JvdXBfbmFtZSIsImNvbm5lY3RTeW5jIiwiYXJncyIsIl9jb25uZWN0U3luYyIsIk1ldGVvciIsIndyYXBBc3luYyIsImNvbm5lY3RBc3luYyIsInNlYXJjaEFsbFN5bmMiLCJfc2VhcmNoQWxsU3luYyIsInNlYXJjaEFsbEFzeW5jIiwiY2FsbGJhY2siLCJpbmZvIiwicmVwbGllZCIsImNvbm5lY3Rpb25PcHRpb25zIiwidXJsIiwiY29ubmVjdFRpbWVvdXQiLCJpZGxlVGltZW91dCIsInJlY29ubmVjdCIsImxvZyIsIm5hbWUiLCJjb21wb25lbnQiLCJzdHJlYW0iLCJwcm9jZXNzIiwic3RkZXJyIiwibGV2ZWwiLCJ0bHNPcHRpb25zIiwicmVqZWN0VW5hdXRob3JpemVkIiwiY2hhaW5MaW5lcyIsInNwbGl0IiwiY2VydCIsImNhIiwiZm9yRWFjaCIsImxpbmUiLCJwdXNoIiwibWF0Y2giLCJqb2luIiwiZGVidWciLCJjbGllbnQiLCJjcmVhdGVDbGllbnQiLCJiaW5kU3luYyIsIm9uIiwiZXJyb3IiLCJkaXNjb25uZWN0Iiwic3RhcnR0bHMiLCJyZXNwb25zZSIsInNldFRpbWVvdXQiLCJFcnJvciIsImdldFVzZXJGaWx0ZXIiLCJ1c2VybmFtZSIsImZpbHRlciIsInVzZXJuYW1lRmlsdGVyIiwibWFwIiwiaXRlbSIsImxlbmd0aCIsImJpbmRJZk5lY2Vzc2FyeSIsImRvbWFpbkJpbmRlZCIsInNlYXJjaFVzZXJzU3luYyIsInBhZ2UiLCJzZWFyY2hPcHRpb25zIiwic2NvcGUiLCJzaXplTGltaXQiLCJwYWdlZCIsInBhZ2VTaXplIiwicGFnZVBhdXNlIiwic2VhcmNoQWxsUGFnZWQiLCJnZXRVc2VyQnlJZFN5bmMiLCJpZCIsImF0dHJpYnV0ZSIsIlVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkIiwiZmlsdGVycyIsIkVxdWFsaXR5RmlsdGVyIiwidmFsdWUiLCJCdWZmZXIiLCJPckZpbHRlciIsInRvU3RyaW5nIiwicmVzdWx0IiwiQXJyYXkiLCJpc0FycmF5IiwiZ2V0VXNlckJ5VXNlcm5hbWVTeW5jIiwiaXNVc2VySW5Hcm91cCIsInJlcGxhY2UiLCJleHRyYWN0TGRhcEVudHJ5RGF0YSIsImVudHJ5IiwidmFsdWVzIiwiX3JhdyIsInJhdyIsIk9iamVjdCIsImtleXMiLCJrZXkiLCJpbmNsdWRlcyIsInByb2Nlc3NQYWdlIiwiZW50cmllcyIsInRpdGxlIiwiZW5kIiwibmV4dCIsIl91cGRhdGVJZGxlIiwicmVzIiwiaW50ZXJuYWxQYWdlU2l6ZSIsImF1dGhTeW5jIiwiZG4iLCJwYXNzd29yZCIsInVuYmluZCIsInNsdWciLCJnZXRMZGFwVXNlcm5hbWUiLCJnZXRMZGFwVXNlclVuaXF1ZUlEIiwic3luY1VzZXJEYXRhIiwiYWRkTGRhcFVzZXIiLCJmYWxsYmFja0RlZmF1bHRBY2NvdW50U3lzdGVtIiwiaW5kZXhPZiIsImVtYWlsIiwibG9naW5SZXF1ZXN0IiwidXNlciIsImRpZ2VzdCIsIlNIQTI1NiIsImFsZ29yaXRobSIsIkFjY291bnRzIiwiX3J1bkxvZ2luSGFuZGxlcnMiLCJyZWdpc3RlckxvZ2luSGFuZGxlciIsImxkYXAiLCJsZGFwT3B0aW9ucyIsInVuZGVmaW5lZCIsImxkYXBQYXNzIiwic2VsZiIsImxkYXBVc2VyIiwidXNlcnMiLCJ1c2VyUXVlcnkiLCJmaW5kT25lIiwic3RhbXBlZFRva2VuIiwiX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4iLCJ1cGRhdGUiLCJfaWQiLCIkcHVzaCIsIl9oYXNoU3RhbXBlZFRva2VuIiwic2V0UGFzc3dvcmQiLCJsb2dvdXQiLCJ1c2VySWQiLCJ0b2tlbiIsImFkZEdyb3VwIiwiZW5hYmxlUXVlcnkiLCJlbmFibGVBdXRoZW50aWNhdGlvbiIsImVuYWJsZVRMU1F1ZXJ5IiwiJGluIiwic3luY0RhdGFRdWVyeSIsImdyb3VwRmlsdGVyUXVlcnkiLCJiYWNrZ3JvdW5kU3luY1F1ZXJ5IiwiYWRkIiwidHlwZSIsInB1YmxpYyIsImkxOG5MYWJlbCIsIm11bHRpbGluZSIsImFjdGlvblRleHQiLCJzZWN0aW9uIiwiZ2V0UHJvcGVydHlWYWx1ZSIsImdldERhdGFUb1N5bmNVc2VyRGF0YSIsImltcG9ydE5ld1VzZXJzIiwiXyIsInRleHQiLCJzbHVnaWZ5Iiwib2JqIiwicmVkdWNlIiwiYWNjIiwiZWwiLCJlcnIiLCJ1c2VybmFtZUZpZWxkIiwiZmllbGQiLCJjb25jYXQiLCJmaW5kIiwiaXNFbXB0eSIsInN5bmNVc2VyRGF0YUZpZWxkTWFwIiwidHJpbSIsInVzZXJEYXRhIiwid2hpdGVsaXN0ZWRVc2VyRmllbGRzIiwiZmllbGRNYXAiLCJKU09OIiwicGFyc2UiLCJlbWFpbExpc3QiLCJ1c2VyRmllbGQiLCJsZGFwRmllbGQiLCJoYXNPd25Qcm9wZXJ0eSIsImlzT2JqZWN0IiwiYWRkcmVzcyIsInZlcmlmaWVkIiwib3V0ZXJLZXkiLCJpbm5lcktleXMiLCJjdXN0b21GaWVsZHNNZXRhIiwiZSIsInRtcFVzZXJGaWVsZCIsInRtcExkYXBGaWVsZCIsInRlbXBsYXRlVmFySGFuZGxlciIsImRLZXlzIiwibGFzdEtleSIsImxhc3QiLCJjdXJyS2V5Iiwic3RyaW5naWZ5IiwiZW1haWxzIiwidW5pcXVlSWQiLCJzZXJ2aWNlcyIsImlkQXR0cmlidXRlIiwic2l6ZSIsIm9iamVjdCIsIl9zZXRSZWFsTmFtZSIsIiRzZXQiLCJfc2V0VXNlcm5hbWUiLCJhdmF0YXIiLCJ0aHVtYm5haWxQaG90byIsImpwZWdQaG90byIsInJzIiwiUm9ja2V0Q2hhdEZpbGUiLCJidWZmZXJUb1N0cmVhbSIsImZpbGVTdG9yZSIsIkZpbGVVcGxvYWQiLCJnZXRTdG9yZSIsImRlbGV0ZUJ5TmFtZSIsImZpbGUiLCJydW5Bc1VzZXIiLCJpbnNlcnQiLCJtb2RlbHMiLCJVc2VycyIsInNldEF2YXRhck9yaWdpbiIsIk5vdGlmaWNhdGlvbnMiLCJub3RpZnlMb2dnZWQiLCJ1c2VyT2JqZWN0IiwibWFpbCIsImNyZWF0ZVVzZXIiLCJjb3VudCIsImJpbmRFbnZpcm9ubWVudCIsImxkYXBVc2VycyIsInN5bmMiLCJmaW5kTERBUFVzZXJzIiwiam9iTmFtZSIsImFkZENyb25Kb2IiLCJkZWJvdW5jZSIsImFkZENyb25Kb2JEZWJvdW5jZWQiLCJTeW5jZWRDcm9uIiwibmV4dFNjaGVkdWxlZEF0RGF0ZSIsInJlbW92ZSIsInNjaGVkdWxlIiwicGFyc2VyIiwiam9iIiwic3RhcnQiLCJzdGFydHVwIiwiZGVmZXIiLCJtZXRob2RzIiwibGRhcF9zeW5jX25vdyIsIm1ldGhvZCIsImF1dGh6IiwiaGFzUm9sZSIsInVuYmxvY2siLCJtZXNzYWdlIiwicGFyYW1zIiwibGRhcF90ZXN0X2Nvbm5lY3Rpb24iLCJjb25zb2xlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxLQUFQLENBQWFDLFFBQVEsZ0JBQVIsQ0FBYjtBQUF3Q0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYjtBQUFvQ0YsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLGtCQUFSLENBQWI7QUFBMENGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxhQUFSLENBQWI7QUFBcUNGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRTs7Ozs7Ozs7Ozs7QUNBM0pGLE9BQU9HLE1BQVAsQ0FBYztBQUFDQyxXQUFRLE1BQUlDO0FBQWIsQ0FBZDtBQUFrQyxJQUFJQyxNQUFKO0FBQVdOLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0UsVUFBUUcsQ0FBUixFQUFVO0FBQUNE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LEtBQVo7QUFDQSxZQUFNLElBQUlyQyxPQUFPMEMsS0FBWCxDQUFpQkwsTUFBTStNLE9BQXZCLENBQU47QUFDQTs7QUFFRCxRQUFJO0FBQ0hsSSxXQUFLaEUsZUFBTDtBQUNBLEtBRkQsQ0FFRSxPQUFPYixLQUFQLEVBQWM7QUFDZixZQUFNLElBQUlyQyxPQUFPMEMsS0FBWCxDQUFpQkwsTUFBTXRCLElBQU4sSUFBY3NCLE1BQU0rTSxPQUFyQyxDQUFOO0FBQ0E7O0FBRUQsV0FBTztBQUNOQSxlQUFTLG9CQURIO0FBRU5DLGNBQVE7QUFGRixLQUFQO0FBSUE7O0FBbENhLENBQWYsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9sZGFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICcuL2xvZ2luSGFuZGxlcic7XG5pbXBvcnQgJy4vc2V0dGluZ3MnO1xuaW1wb3J0ICcuL3Rlc3RDb25uZWN0aW9uJztcbmltcG9ydCAnLi9zeW5jVXNlcnMnO1xuaW1wb3J0ICcuL3N5bmMnO1xuIiwiaW1wb3J0IGxkYXBqcyBmcm9tICdsZGFwanMnO1xuaW1wb3J0IEJ1bnlhbiBmcm9tICdidW55YW4nO1xuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdMREFQJywge1xuXHRzZWN0aW9uczoge1xuXHRcdGNvbm5lY3Rpb246ICdDb25uZWN0aW9uJyxcblx0XHRiaW5kOiAnQmluZCcsXG5cdFx0c2VhcmNoOiAnU2VhcmNoJyxcblx0XHRhdXRoOiAnQXV0aCdcblx0fVxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExEQVAge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmxkYXBqcyA9IGxkYXBqcztcblxuXHRcdHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XG5cblx0XHR0aGlzLm9wdGlvbnMgPSB7XG5cdFx0XHRob3N0OiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Ib3N0JyksXG5cdFx0XHRwb3J0OiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Qb3J0JyksXG5cdFx0XHRSZWNvbm5lY3Q6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX1JlY29ubmVjdCcpLFxuXHRcdFx0SW50ZXJuYWxfTG9nX0xldmVsOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9JbnRlcm5hbF9Mb2dfTGV2ZWwnKSxcblx0XHRcdHRpbWVvdXQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX1RpbWVvdXQnKSxcblx0XHRcdGNvbm5lY3RfdGltZW91dDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQ29ubmVjdF9UaW1lb3V0JyksXG5cdFx0XHRpZGxlX3RpbWVvdXQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0lkbGVfVGltZW91dCcpLFxuXHRcdFx0ZW5jcnlwdGlvbjogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfRW5jcnlwdGlvbicpLFxuXHRcdFx0Y2FfY2VydDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQ0FfQ2VydCcpLFxuXHRcdFx0cmVqZWN0X3VuYXV0aG9yaXplZDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfUmVqZWN0X1VuYXV0aG9yaXplZCcpIHx8IGZhbHNlLFxuXHRcdFx0QXV0aGVudGljYXRpb246IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0F1dGhlbnRpY2F0aW9uJyksXG5cdFx0XHRBdXRoZW50aWNhdGlvbl9Vc2VyRE46IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0F1dGhlbnRpY2F0aW9uX1VzZXJETicpLFxuXHRcdFx0QXV0aGVudGljYXRpb25fUGFzc3dvcmQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0F1dGhlbnRpY2F0aW9uX1Bhc3N3b3JkJyksXG5cdFx0XHRCYXNlRE46IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0Jhc2VETicpLFxuXHRcdFx0VXNlcl9TZWFyY2hfRmlsdGVyOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Vc2VyX1NlYXJjaF9GaWx0ZXInKSxcblx0XHRcdFVzZXJfU2VhcmNoX1Njb3BlOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Vc2VyX1NlYXJjaF9TY29wZScpLFxuXHRcdFx0VXNlcl9TZWFyY2hfRmllbGQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX1VzZXJfU2VhcmNoX0ZpZWxkJyksXG5cdFx0XHRTZWFyY2hfUGFnZV9TaXplOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9TZWFyY2hfUGFnZV9TaXplJyksXG5cdFx0XHRTZWFyY2hfU2l6ZV9MaW1pdDogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfU2VhcmNoX1NpemVfTGltaXQnKSxcblx0XHRcdGdyb3VwX2ZpbHRlcl9lbmFibGVkOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Hcm91cF9GaWx0ZXJfRW5hYmxlJyksXG5cdFx0XHRncm91cF9maWx0ZXJfb2JqZWN0X2NsYXNzOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Hcm91cF9GaWx0ZXJfT2JqZWN0Q2xhc3MnKSxcblx0XHRcdGdyb3VwX2ZpbHRlcl9ncm91cF9pZF9hdHRyaWJ1dGU6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0dyb3VwX0ZpbHRlcl9Hcm91cF9JZF9BdHRyaWJ1dGUnKSxcblx0XHRcdGdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Hcm91cF9GaWx0ZXJfR3JvdXBfTWVtYmVyX0F0dHJpYnV0ZScpLFxuXHRcdFx0Z3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXQ6IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0dyb3VwX0ZpbHRlcl9Hcm91cF9NZW1iZXJfRm9ybWF0JyksXG5cdFx0XHRncm91cF9maWx0ZXJfZ3JvdXBfbmFtZTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfR3JvdXBfRmlsdGVyX0dyb3VwX05hbWUnKVxuXHRcdH07XG5cdH1cblxuXHRjb25uZWN0U3luYyguLi5hcmdzKSB7XG5cdFx0aWYgKCF0aGlzLl9jb25uZWN0U3luYykge1xuXHRcdFx0dGhpcy5fY29ubmVjdFN5bmMgPSBNZXRlb3Iud3JhcEFzeW5jKHRoaXMuY29ubmVjdEFzeW5jLCB0aGlzKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuX2Nvbm5lY3RTeW5jKC4uLmFyZ3MpO1xuXHR9XG5cblx0c2VhcmNoQWxsU3luYyguLi5hcmdzKSB7XG5cdFx0aWYgKCF0aGlzLl9zZWFyY2hBbGxTeW5jKSB7XG5cdFx0XHR0aGlzLl9zZWFyY2hBbGxTeW5jID0gTWV0ZW9yLndyYXBBc3luYyh0aGlzLnNlYXJjaEFsbEFzeW5jLCB0aGlzKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuX3NlYXJjaEFsbFN5bmMoLi4uYXJncyk7XG5cdH1cblxuXHRjb25uZWN0QXN5bmMoY2FsbGJhY2spIHtcblx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdJbml0IHNldHVwJyk7XG5cblx0XHRsZXQgcmVwbGllZCA9IGZhbHNlO1xuXG5cdFx0Y29uc3QgY29ubmVjdGlvbk9wdGlvbnMgPSB7XG5cdFx0XHR1cmw6IGAkeyB0aGlzLm9wdGlvbnMuaG9zdCB9OiR7IHRoaXMub3B0aW9ucy5wb3J0IH1gLFxuXHRcdFx0dGltZW91dDogdGhpcy5vcHRpb25zLnRpbWVvdXQsXG5cdFx0XHRjb25uZWN0VGltZW91dDogdGhpcy5vcHRpb25zLmNvbm5lY3RfdGltZW91dCxcblx0XHRcdGlkbGVUaW1lb3V0OiB0aGlzLm9wdGlvbnMuaWRsZV90aW1lb3V0LFxuXHRcdFx0cmVjb25uZWN0OiB0aGlzLm9wdGlvbnMuUmVjb25uZWN0XG5cdFx0fTtcblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuSW50ZXJuYWxfTG9nX0xldmVsICE9PSAnZGlzYWJsZWQnKSB7XG5cdFx0XHRjb25uZWN0aW9uT3B0aW9ucy5sb2cgPSBuZXcgQnVueWFuKHtcblx0XHRcdFx0bmFtZTogJ2xkYXBqcycsXG5cdFx0XHRcdGNvbXBvbmVudDogJ2NsaWVudCcsXG5cdFx0XHRcdHN0cmVhbTogcHJvY2Vzcy5zdGRlcnIsXG5cdFx0XHRcdGxldmVsOiB0aGlzLm9wdGlvbnMuSW50ZXJuYWxfTG9nX0xldmVsXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCB0bHNPcHRpb25zID0ge1xuXHRcdFx0cmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLm9wdGlvbnMucmVqZWN0X3VuYXV0aG9yaXplZFxuXHRcdH07XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmNhX2NlcnQgJiYgdGhpcy5vcHRpb25zLmNhX2NlcnQgIT09ICcnKSB7XG5cdFx0XHQvLyBTcGxpdCBDQSBjZXJ0IGludG8gYXJyYXkgb2Ygc3RyaW5nc1xuXHRcdFx0Y29uc3QgY2hhaW5MaW5lcyA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0NBX0NlcnQnKS5zcGxpdCgnXFxuJyk7XG5cdFx0XHRsZXQgY2VydCA9IFtdO1xuXHRcdFx0Y29uc3QgY2EgPSBbXTtcblx0XHRcdGNoYWluTGluZXMuZm9yRWFjaCgobGluZSkgPT4ge1xuXHRcdFx0XHRjZXJ0LnB1c2gobGluZSk7XG5cdFx0XHRcdGlmIChsaW5lLm1hdGNoKC8tRU5EIENFUlRJRklDQVRFLS8pKSB7XG5cdFx0XHRcdFx0Y2EucHVzaChjZXJ0LmpvaW4oJ1xcbicpKTtcblx0XHRcdFx0XHRjZXJ0ID0gW107XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0dGxzT3B0aW9ucy5jYSA9IGNhO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuZW5jcnlwdGlvbiA9PT0gJ3NzbCcpIHtcblx0XHRcdGNvbm5lY3Rpb25PcHRpb25zLnVybCA9IGBsZGFwczovLyR7IGNvbm5lY3Rpb25PcHRpb25zLnVybCB9YDtcblx0XHRcdGNvbm5lY3Rpb25PcHRpb25zLnRsc09wdGlvbnMgPSB0bHNPcHRpb25zO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25uZWN0aW9uT3B0aW9ucy51cmwgPSBgbGRhcDovLyR7IGNvbm5lY3Rpb25PcHRpb25zLnVybCB9YDtcblx0XHR9XG5cblx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdDb25uZWN0aW5nJywgY29ubmVjdGlvbk9wdGlvbnMudXJsKTtcblx0XHRsb2dnZXIuY29ubmVjdGlvbi5kZWJ1ZygnY29ubmVjdGlvbk9wdGlvbnMnLCBjb25uZWN0aW9uT3B0aW9ucyk7XG5cblx0XHR0aGlzLmNsaWVudCA9IGxkYXBqcy5jcmVhdGVDbGllbnQoY29ubmVjdGlvbk9wdGlvbnMpO1xuXG5cdFx0dGhpcy5iaW5kU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5jbGllbnQuYmluZCwgdGhpcy5jbGllbnQpO1xuXG5cdFx0dGhpcy5jbGllbnQub24oJ2Vycm9yJywgKGVycm9yKSA9PiB7XG5cdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5lcnJvcignY29ubmVjdGlvbicsIGVycm9yKTtcblx0XHRcdGlmIChyZXBsaWVkID09PSBmYWxzZSkge1xuXHRcdFx0XHRyZXBsaWVkID0gdHJ1ZTtcblx0XHRcdFx0Y2FsbGJhY2soZXJyb3IsIG51bGwpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5jbGllbnQub24oJ2lkbGUnLCAoKSA9PiB7XG5cdFx0XHRsb2dnZXIuc2VhcmNoLmluZm8oJ0lkbGUnKTtcblx0XHRcdHRoaXMuZGlzY29ubmVjdCgpO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jbGllbnQub24oJ2Nsb3NlJywgKCkgPT4ge1xuXHRcdFx0bG9nZ2VyLnNlYXJjaC5pbmZvKCdDbG9zZWQnKTtcblx0XHR9KTtcblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuZW5jcnlwdGlvbiA9PT0gJ3RscycpIHtcblx0XHRcdC8vIFNldCBob3N0IHBhcmFtZXRlciBmb3IgdGxzLmNvbm5lY3Qgd2hpY2ggaXMgdXNlZCBieSBsZGFwanMgc3RhcnR0bHMuIFRoaXMgc2hvdWxkbid0IGJlIG5lZWRlZCBpbiBuZXdlciBub2RlanMgdmVyc2lvbnMgKGUuZyB2NS42LjApLlxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL1JvY2tldENoYXQvUm9ja2V0LkNoYXQvaXNzdWVzLzIwMzVcblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tY2F2YWdlL25vZGUtbGRhcGpzL2lzc3Vlcy8zNDlcblx0XHRcdHRsc09wdGlvbnMuaG9zdCA9IHRoaXMub3B0aW9ucy5ob3N0O1xuXG5cdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdTdGFydGluZyBUTFMnKTtcblx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmRlYnVnKCd0bHNPcHRpb25zJywgdGxzT3B0aW9ucyk7XG5cblx0XHRcdHRoaXMuY2xpZW50LnN0YXJ0dGxzKHRsc09wdGlvbnMsIG51bGwsIChlcnJvciwgcmVzcG9uc2UpID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmNvbm5lY3Rpb24uZXJyb3IoJ1RMUyBjb25uZWN0aW9uJywgZXJyb3IpO1xuXHRcdFx0XHRcdGlmIChyZXBsaWVkID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0cmVwbGllZCA9IHRydWU7XG5cdFx0XHRcdFx0XHRjYWxsYmFjayhlcnJvciwgbnVsbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ1RMUyBjb25uZWN0ZWQnKTtcblx0XHRcdFx0dGhpcy5jb25uZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRpZiAocmVwbGllZCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRyZXBsaWVkID0gdHJ1ZTtcblx0XHRcdFx0XHRjYWxsYmFjayhudWxsLCByZXNwb25zZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmNsaWVudC5vbignY29ubmVjdCcsIChyZXNwb25zZSkgPT4ge1xuXHRcdFx0XHRsb2dnZXIuY29ubmVjdGlvbi5pbmZvKCdMREFQIGNvbm5lY3RlZCcpO1xuXHRcdFx0XHR0aGlzLmNvbm5lY3RlZCA9IHRydWU7XG5cdFx0XHRcdGlmIChyZXBsaWVkID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdHJlcGxpZWQgPSB0cnVlO1xuXHRcdFx0XHRcdGNhbGxiYWNrKG51bGwsIHJlc3BvbnNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0c2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRpZiAocmVwbGllZCA9PT0gZmFsc2UpIHtcblx0XHRcdFx0bG9nZ2VyLmNvbm5lY3Rpb24uZXJyb3IoJ2Nvbm5lY3Rpb24gdGltZSBvdXQnLCBjb25uZWN0aW9uT3B0aW9ucy5jb25uZWN0VGltZW91dCk7XG5cdFx0XHRcdHJlcGxpZWQgPSB0cnVlO1xuXHRcdFx0XHRjYWxsYmFjayhuZXcgRXJyb3IoJ1RpbWVvdXQnKSk7XG5cdFx0XHR9XG5cdFx0fSwgY29ubmVjdGlvbk9wdGlvbnMuY29ubmVjdFRpbWVvdXQpO1xuXHR9XG5cblx0Z2V0VXNlckZpbHRlcih1c2VybmFtZSkge1xuXHRcdGNvbnN0IGZpbHRlciA9IFtdO1xuXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5Vc2VyX1NlYXJjaF9GaWx0ZXIgIT09ICcnKSB7XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX0ZpbHRlclswXSA9PT0gJygnKSB7XG5cdFx0XHRcdGZpbHRlci5wdXNoKGAkeyB0aGlzLm9wdGlvbnMuVXNlcl9TZWFyY2hfRmlsdGVyIH1gKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZpbHRlci5wdXNoKGAoJHsgdGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX0ZpbHRlciB9KWApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IHVzZXJuYW1lRmlsdGVyID0gdGhpcy5vcHRpb25zLlVzZXJfU2VhcmNoX0ZpZWxkLnNwbGl0KCcsJykubWFwKGl0ZW0gPT4gYCgkeyBpdGVtIH09JHsgdXNlcm5hbWUgfSlgKTtcblxuXHRcdGlmICh1c2VybmFtZUZpbHRlci5sZW5ndGggPT09IDApIHtcblx0XHRcdGxvZ2dlci5lcnJvcignTERBUF9MREFQX1VzZXJfU2VhcmNoX0ZpZWxkIG5vdCBkZWZpbmVkJyk7XG5cdFx0fSBlbHNlIGlmICh1c2VybmFtZUZpbHRlci5sZW5ndGggPT09IDEpIHtcblx0XHRcdGZpbHRlci5wdXNoKGAkeyB1c2VybmFtZUZpbHRlclswXSB9YCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZpbHRlci5wdXNoKGAofCR7IHVzZXJuYW1lRmlsdGVyLmpvaW4oJycpIH0pYCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGAoJiR7IGZpbHRlci5qb2luKCcnKSB9KWA7XG5cdH1cblxuXHRiaW5kSWZOZWNlc3NhcnkoKSB7XG5cdFx0aWYgKHRoaXMuZG9tYWluQmluZGVkID09PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMub3B0aW9ucy5BdXRoZW50aWNhdGlvbiAhPT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxvZ2dlci5iaW5kLmluZm8oJ0JpbmRpbmcgVXNlckROJywgdGhpcy5vcHRpb25zLkF1dGhlbnRpY2F0aW9uX1VzZXJETik7XG5cdFx0dGhpcy5iaW5kU3luYyh0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb25fVXNlckROLCB0aGlzLm9wdGlvbnMuQXV0aGVudGljYXRpb25fUGFzc3dvcmQpO1xuXHRcdHRoaXMuZG9tYWluQmluZGVkID0gdHJ1ZTtcblx0fVxuXG5cdHNlYXJjaFVzZXJzU3luYyh1c2VybmFtZSwgcGFnZSkge1xuXHRcdHRoaXMuYmluZElmTmVjZXNzYXJ5KCk7XG5cblx0XHRjb25zdCBzZWFyY2hPcHRpb25zID0ge1xuXHRcdFx0ZmlsdGVyOiB0aGlzLmdldFVzZXJGaWx0ZXIodXNlcm5hbWUpLFxuXHRcdFx0c2NvcGU6IHRoaXMub3B0aW9ucy5Vc2VyX1NlYXJjaF9TY29wZSB8fCAnc3ViJyxcblx0XHRcdHNpemVMaW1pdDogdGhpcy5vcHRpb25zLlNlYXJjaF9TaXplX0xpbWl0XG5cdFx0fTtcblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuU2VhcmNoX1BhZ2VfU2l6ZSA+IDApIHtcblx0XHRcdHNlYXJjaE9wdGlvbnMucGFnZWQgPSB7XG5cdFx0XHRcdHBhZ2VTaXplOiB0aGlzLm9wdGlvbnMuU2VhcmNoX1BhZ2VfU2l6ZSxcblx0XHRcdFx0cGFnZVBhdXNlOiAhIXBhZ2Vcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLnNlYXJjaC5pbmZvKCdTZWFyY2hpbmcgdXNlcicsIHVzZXJuYW1lKTtcblx0XHRsb2dnZXIuc2VhcmNoLmRlYnVnKCdzZWFyY2hPcHRpb25zJywgc2VhcmNoT3B0aW9ucyk7XG5cdFx0bG9nZ2VyLnNlYXJjaC5kZWJ1ZygnQmFzZUROJywgdGhpcy5vcHRpb25zLkJhc2VETik7XG5cblx0XHRpZiAocGFnZSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc2VhcmNoQWxsUGFnZWQodGhpcy5vcHRpb25zLkJhc2VETiwgc2VhcmNoT3B0aW9ucywgcGFnZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblx0fVxuXG5cdGdldFVzZXJCeUlkU3luYyhpZCwgYXR0cmlidXRlKSB7XG5cdFx0dGhpcy5iaW5kSWZOZWNlc3NhcnkoKTtcblxuXHRcdGNvbnN0IFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfVW5pcXVlX0lkZW50aWZpZXJfRmllbGQnKS5zcGxpdCgnLCcpO1xuXG5cdFx0bGV0IGZpbHRlcjtcblxuXHRcdGlmIChhdHRyaWJ1dGUpIHtcblx0XHRcdGZpbHRlciA9IG5ldyB0aGlzLmxkYXBqcy5maWx0ZXJzLkVxdWFsaXR5RmlsdGVyKHtcblx0XHRcdFx0YXR0cmlidXRlLFxuXHRcdFx0XHR2YWx1ZTogbmV3IEJ1ZmZlcihpZCwgJ2hleCcpXG5cdFx0XHR9KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgZmlsdGVycyA9IFtdO1xuXHRcdFx0VW5pcXVlX0lkZW50aWZpZXJfRmllbGQuZm9yRWFjaCgoaXRlbSkgPT4ge1xuXHRcdFx0XHRmaWx0ZXJzLnB1c2gobmV3IHRoaXMubGRhcGpzLmZpbHRlcnMuRXF1YWxpdHlGaWx0ZXIoe1xuXHRcdFx0XHRcdGF0dHJpYnV0ZTogaXRlbSxcblx0XHRcdFx0XHR2YWx1ZTogbmV3IEJ1ZmZlcihpZCwgJ2hleCcpXG5cdFx0XHRcdH0pKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRmaWx0ZXIgPSBuZXcgdGhpcy5sZGFwanMuZmlsdGVycy5PckZpbHRlcih7ZmlsdGVyc30pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHNlYXJjaE9wdGlvbnMgPSB7XG5cdFx0XHRmaWx0ZXIsXG5cdFx0XHRzY29wZTogJ3N1Yidcblx0XHR9O1xuXG5cdFx0bG9nZ2VyLnNlYXJjaC5pbmZvKCdTZWFyY2hpbmcgYnkgaWQnLCBpZCk7XG5cdFx0bG9nZ2VyLnNlYXJjaC5kZWJ1Zygnc2VhcmNoIGZpbHRlcicsIHNlYXJjaE9wdGlvbnMuZmlsdGVyLnRvU3RyaW5nKCkpO1xuXHRcdGxvZ2dlci5zZWFyY2guZGVidWcoJ0Jhc2VETicsIHRoaXMub3B0aW9ucy5CYXNlRE4pO1xuXG5cdFx0Y29uc3QgcmVzdWx0ID0gdGhpcy5zZWFyY2hBbGxTeW5jKHRoaXMub3B0aW9ucy5CYXNlRE4sIHNlYXJjaE9wdGlvbnMpO1xuXG5cdFx0aWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdCkgfHwgcmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChyZXN1bHQubGVuZ3RoID4gMSkge1xuXHRcdFx0bG9nZ2VyLnNlYXJjaC5lcnJvcignU2VhcmNoIGJ5IGlkJywgaWQsICdyZXR1cm5lZCcsIHJlc3VsdC5sZW5ndGgsICdyZWNvcmRzJyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdFswXTtcblx0fVxuXG5cdGdldFVzZXJCeVVzZXJuYW1lU3luYyh1c2VybmFtZSkge1xuXHRcdHRoaXMuYmluZElmTmVjZXNzYXJ5KCk7XG5cblx0XHRjb25zdCBzZWFyY2hPcHRpb25zID0ge1xuXHRcdFx0ZmlsdGVyOiB0aGlzLmdldFVzZXJGaWx0ZXIodXNlcm5hbWUpLFxuXHRcdFx0c2NvcGU6IHRoaXMub3B0aW9ucy5Vc2VyX1NlYXJjaF9TY29wZSB8fCAnc3ViJ1xuXHRcdH07XG5cblx0XHRsb2dnZXIuc2VhcmNoLmluZm8oJ1NlYXJjaGluZyB1c2VyJywgdXNlcm5hbWUpO1xuXHRcdGxvZ2dlci5zZWFyY2guZGVidWcoJ3NlYXJjaE9wdGlvbnMnLCBzZWFyY2hPcHRpb25zKTtcblx0XHRsb2dnZXIuc2VhcmNoLmRlYnVnKCdCYXNlRE4nLCB0aGlzLm9wdGlvbnMuQmFzZUROKTtcblxuXHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAocmVzdWx0Lmxlbmd0aCA+IDEpIHtcblx0XHRcdGxvZ2dlci5zZWFyY2guZXJyb3IoJ1NlYXJjaCBieSB1c2VybmFtZScsIHVzZXJuYW1lLCAncmV0dXJuZWQnLCByZXN1bHQubGVuZ3RoLCAncmVjb3JkcycpO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHRbMF07XG5cdH1cblxuXHRpc1VzZXJJbkdyb3VwKHVzZXJuYW1lKSB7XG5cdFx0aWYgKCF0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2VuYWJsZWQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbHRlciA9IFsnKCYnXTtcblxuXHRcdGlmICh0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX29iamVjdF9jbGFzcyAhPT0gJycpIHtcblx0XHRcdGZpbHRlci5wdXNoKGAob2JqZWN0Y2xhc3M9JHsgdGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9vYmplY3RfY2xhc3MgfSlgKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9tZW1iZXJfYXR0cmlidXRlICE9PSAnJykge1xuXHRcdFx0ZmlsdGVyLnB1c2goYCgkeyB0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9hdHRyaWJ1dGUgfT0keyB0aGlzLm9wdGlvbnMuZ3JvdXBfZmlsdGVyX2dyb3VwX21lbWJlcl9mb3JtYXQgfSlgKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9pZF9hdHRyaWJ1dGUgIT09ICcnKSB7XG5cdFx0XHRmaWx0ZXIucHVzaChgKCR7IHRoaXMub3B0aW9ucy5ncm91cF9maWx0ZXJfZ3JvdXBfaWRfYXR0cmlidXRlIH09JHsgdGhpcy5vcHRpb25zLmdyb3VwX2ZpbHRlcl9ncm91cF9uYW1lIH0pYCk7XG5cdFx0fVxuXHRcdGZpbHRlci5wdXNoKCcpJyk7XG5cblx0XHRjb25zdCBzZWFyY2hPcHRpb25zID0ge1xuXHRcdFx0ZmlsdGVyOiBmaWx0ZXIuam9pbignJykucmVwbGFjZSgvI3t1c2VybmFtZX0vZywgdXNlcm5hbWUpLFxuXHRcdFx0c2NvcGU6ICdzdWInXG5cdFx0fTtcblxuXHRcdGxvZ2dlci5zZWFyY2guZGVidWcoJ0dyb3VwIGZpbHRlciBMREFQOicsIHNlYXJjaE9wdGlvbnMuZmlsdGVyKTtcblxuXHRcdGNvbnN0IHJlc3VsdCA9IHRoaXMuc2VhcmNoQWxsU3luYyh0aGlzLm9wdGlvbnMuQmFzZUROLCBzZWFyY2hPcHRpb25zKTtcblxuXHRcdGlmICghQXJyYXkuaXNBcnJheShyZXN1bHQpIHx8IHJlc3VsdC5sZW5ndGggPT09IDApIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRleHRyYWN0TGRhcEVudHJ5RGF0YShlbnRyeSkge1xuXHRcdGNvbnN0IHZhbHVlcyA9IHtcblx0XHRcdF9yYXc6IGVudHJ5LnJhd1xuXHRcdH07XG5cblx0XHRPYmplY3Qua2V5cyh2YWx1ZXMuX3JhdykuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IHZhbHVlcy5fcmF3W2tleV07XG5cblx0XHRcdGlmICghWyd0aHVtYm5haWxQaG90bycsICdqcGVnUGhvdG8nXS5pbmNsdWRlcyhrZXkpKSB7XG5cdFx0XHRcdGlmICh2YWx1ZSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXHRcdFx0XHRcdHZhbHVlc1trZXldID0gdmFsdWUudG9TdHJpbmcoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR2YWx1ZXNba2V5XSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdmFsdWVzO1xuXHR9XG5cblx0c2VhcmNoQWxsUGFnZWQoQmFzZUROLCBvcHRpb25zLCBwYWdlKSB7XG5cdFx0dGhpcy5iaW5kSWZOZWNlc3NhcnkoKTtcblxuXHRcdGNvbnN0IHByb2Nlc3NQYWdlID0gKHtlbnRyaWVzLCB0aXRsZSwgZW5kLCBuZXh0fSkgPT4ge1xuXHRcdFx0bG9nZ2VyLnNlYXJjaC5pbmZvKHRpdGxlKTtcblx0XHRcdC8vIEZvcmNlIExEQVAgaWRsZSB0byB3YWl0IHRoZSByZWNvcmQgcHJvY2Vzc2luZ1xuXHRcdFx0dGhpcy5jbGllbnQuX3VwZGF0ZUlkbGUodHJ1ZSk7XG5cdFx0XHRwYWdlKG51bGwsIGVudHJpZXMsIHtlbmQsIG5leHQ6ICgpID0+IHtcblx0XHRcdFx0Ly8gUmVzZXQgaWRsZSB0aW1lclxuXHRcdFx0XHR0aGlzLmNsaWVudC5fdXBkYXRlSWRsZSgpO1xuXHRcdFx0XHRuZXh0ICYmIG5leHQoKTtcblx0XHRcdH19KTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jbGllbnQuc2VhcmNoKEJhc2VETiwgb3B0aW9ucywgKGVycm9yLCByZXMpID0+IHtcblx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRsb2dnZXIuc2VhcmNoLmVycm9yKGVycm9yKTtcblx0XHRcdFx0cGFnZShlcnJvcik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0cmVzLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuXHRcdFx0XHRsb2dnZXIuc2VhcmNoLmVycm9yKGVycm9yKTtcblx0XHRcdFx0cGFnZShlcnJvcik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgZW50cmllcyA9IFtdO1xuXG5cdFx0XHRjb25zdCBpbnRlcm5hbFBhZ2VTaXplID0gb3B0aW9ucy5wYWdlZCAmJiBvcHRpb25zLnBhZ2VkLnBhZ2VTaXplID4gMCA/IG9wdGlvbnMucGFnZWQucGFnZVNpemUgKiAyIDogNTAwO1xuXG5cdFx0XHRyZXMub24oJ3NlYXJjaEVudHJ5JywgKGVudHJ5KSA9PiB7XG5cdFx0XHRcdGVudHJpZXMucHVzaCh0aGlzLmV4dHJhY3RMZGFwRW50cnlEYXRhKGVudHJ5KSk7XG5cblx0XHRcdFx0aWYgKGVudHJpZXMubGVuZ3RoID49IGludGVybmFsUGFnZVNpemUpIHtcblx0XHRcdFx0XHRwcm9jZXNzUGFnZSh7XG5cdFx0XHRcdFx0XHRlbnRyaWVzLFxuXHRcdFx0XHRcdFx0dGl0bGU6ICdJbnRlcm5hbCBQYWdlJyxcblx0XHRcdFx0XHRcdGVuZDogZmFsc2Vcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRlbnRyaWVzID0gW107XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXMub24oJ3BhZ2UnLCAocmVzdWx0LCBuZXh0KSA9PiB7XG5cdFx0XHRcdGlmICghbmV4dCkge1xuXHRcdFx0XHRcdHRoaXMuY2xpZW50Ll91cGRhdGVJZGxlKHRydWUpO1xuXHRcdFx0XHRcdHByb2Nlc3NQYWdlKHtcblx0XHRcdFx0XHRcdGVudHJpZXMsXG5cdFx0XHRcdFx0XHR0aXRsZTogJ0ZpbmFsIFBhZ2UnLFxuXHRcdFx0XHRcdFx0ZW5kOiB0cnVlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoZW50cmllcy5sZW5ndGgpIHtcblx0XHRcdFx0XHRsb2dnZXIuc2VhcmNoLmluZm8oJ1BhZ2UnKTtcblx0XHRcdFx0XHRwcm9jZXNzUGFnZSh7XG5cdFx0XHRcdFx0XHRlbnRyaWVzLFxuXHRcdFx0XHRcdFx0dGl0bGU6ICdQYWdlJyxcblx0XHRcdFx0XHRcdGVuZDogZmFsc2UsXG5cdFx0XHRcdFx0XHRuZXh0XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0ZW50cmllcyA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0cmVzLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHRcdGlmIChlbnRyaWVzLmxlbmd0aCkge1xuXHRcdFx0XHRcdHByb2Nlc3NQYWdlKHtcblx0XHRcdFx0XHRcdGVudHJpZXMsXG5cdFx0XHRcdFx0XHR0aXRsZTogJ0ZpbmFsIFBhZ2UnLFxuXHRcdFx0XHRcdFx0ZW5kOiB0cnVlXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0ZW50cmllcyA9IFtdO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fVxuXG5cdHNlYXJjaEFsbEFzeW5jKEJhc2VETiwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0XHR0aGlzLmJpbmRJZk5lY2Vzc2FyeSgpO1xuXG5cdFx0dGhpcy5jbGllbnQuc2VhcmNoKEJhc2VETiwgb3B0aW9ucywgKGVycm9yLCByZXMpID0+IHtcblx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRsb2dnZXIuc2VhcmNoLmVycm9yKGVycm9yKTtcblx0XHRcdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJlcy5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcblx0XHRcdFx0bG9nZ2VyLnNlYXJjaC5lcnJvcihlcnJvcik7XG5cdFx0XHRcdGNhbGxiYWNrKGVycm9yKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGVudHJpZXMgPSBbXTtcblxuXHRcdFx0cmVzLm9uKCdzZWFyY2hFbnRyeScsIChlbnRyeSkgPT4ge1xuXHRcdFx0XHRlbnRyaWVzLnB1c2godGhpcy5leHRyYWN0TGRhcEVudHJ5RGF0YShlbnRyeSkpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJlcy5vbignZW5kJywgKCkgPT4ge1xuXHRcdFx0XHRsb2dnZXIuc2VhcmNoLmluZm8oJ1NlYXJjaCByZXN1bHQgY291bnQnLCBlbnRyaWVzLmxlbmd0aCk7XG5cdFx0XHRcdGNhbGxiYWNrKG51bGwsIGVudHJpZXMpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRhdXRoU3luYyhkbiwgcGFzc3dvcmQpIHtcblx0XHRsb2dnZXIuYXV0aC5pbmZvKCdBdXRoZW50aWNhdGluZycsIGRuKTtcblxuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLmJpbmRTeW5jKGRuLCBwYXNzd29yZCk7XG5cdFx0XHRsb2dnZXIuYXV0aC5pbmZvKCdBdXRoZW50aWNhdGVkJywgZG4pO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGxvZ2dlci5hdXRoLmluZm8oJ05vdCBhdXRoZW50aWNhdGVkJywgZG4pO1xuXHRcdFx0bG9nZ2VyLmF1dGguZGVidWcoJ2Vycm9yJywgZXJyb3IpO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdGRpc2Nvbm5lY3QoKSB7XG5cdFx0dGhpcy5jb25uZWN0ZWQgPSBmYWxzZTtcblx0XHR0aGlzLmRvbWFpbkJpbmRlZCA9IGZhbHNlO1xuXHRcdGxvZ2dlci5jb25uZWN0aW9uLmluZm8oJ0Rpc2NvbmVjdGluZycpO1xuXHRcdHRoaXMuY2xpZW50LnVuYmluZCgpO1xuXHR9XG59XG4iLCIvKiBlc2xpbnQgbmV3LWNhcDogWzIsIHtcImNhcElzTmV3RXhjZXB0aW9uc1wiOiBbXCJTSEEyNTZcIl19XSAqL1xuXG5pbXBvcnQge3NsdWcsIGdldExkYXBVc2VybmFtZSwgZ2V0TGRhcFVzZXJVbmlxdWVJRCwgc3luY1VzZXJEYXRhLCBhZGRMZGFwVXNlcn0gZnJvbSAnLi9zeW5jJztcbmltcG9ydCBMREFQIGZyb20gJy4vbGRhcCc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0xEQVBIYW5kbGVyJywge30pO1xuXG5mdW5jdGlvbiBmYWxsYmFja0RlZmF1bHRBY2NvdW50U3lzdGVtKGJpbmQsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xuXHRpZiAodHlwZW9mIHVzZXJuYW1lID09PSAnc3RyaW5nJykge1xuXHRcdGlmICh1c2VybmFtZS5pbmRleE9mKCdAJykgPT09IC0xKSB7XG5cdFx0XHR1c2VybmFtZSA9IHt1c2VybmFtZX07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHVzZXJuYW1lID0ge2VtYWlsOiB1c2VybmFtZX07XG5cdFx0fVxuXHR9XG5cblx0bG9nZ2VyLmluZm8oJ0ZhbGxiYWNrIHRvIGRlZmF1bHQgYWNjb3VudCBzeXN0ZW0nLCB1c2VybmFtZSk7XG5cblx0Y29uc3QgbG9naW5SZXF1ZXN0ID0ge1xuXHRcdHVzZXI6IHVzZXJuYW1lLFxuXHRcdHBhc3N3b3JkOiB7XG5cdFx0XHRkaWdlc3Q6IFNIQTI1NihwYXNzd29yZCksXG5cdFx0XHRhbGdvcml0aG06ICdzaGEtMjU2J1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gQWNjb3VudHMuX3J1bkxvZ2luSGFuZGxlcnMoYmluZCwgbG9naW5SZXF1ZXN0KTtcbn1cblxuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoJ2xkYXAnLCBmdW5jdGlvbihsb2dpblJlcXVlc3QpIHtcblx0aWYgKCFsb2dpblJlcXVlc3QubGRhcCB8fCAhbG9naW5SZXF1ZXN0LmxkYXBPcHRpb25zKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGxvZ2dlci5pbmZvKCdJbml0IExEQVAgbG9naW4nLCBsb2dpblJlcXVlc3QudXNlcm5hbWUpO1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9FbmFibGUnKSAhPT0gdHJ1ZSkge1xuXHRcdHJldHVybiBmYWxsYmFja0RlZmF1bHRBY2NvdW50U3lzdGVtKHRoaXMsIGxvZ2luUmVxdWVzdC51c2VybmFtZSwgbG9naW5SZXF1ZXN0LmxkYXBQYXNzKTtcblx0fVxuXG5cdGNvbnN0IHNlbGYgPSB0aGlzO1xuXHRjb25zdCBsZGFwID0gbmV3IExEQVAoKTtcblx0bGV0IGxkYXBVc2VyO1xuXG5cdHRyeSB7XG5cdFx0bGRhcC5jb25uZWN0U3luYygpO1xuXHRcdGNvbnN0IHVzZXJzID0gbGRhcC5zZWFyY2hVc2Vyc1N5bmMobG9naW5SZXF1ZXN0LnVzZXJuYW1lKTtcblxuXHRcdGlmICh1c2Vycy5sZW5ndGggIT09IDEpIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdTZWFyY2ggcmV0dXJuZWQnLCB1c2Vycy5sZW5ndGgsICdyZWNvcmQocykgZm9yJywgbG9naW5SZXF1ZXN0LnVzZXJuYW1lKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcignVXNlciBub3QgRm91bmQnKTtcblx0XHR9XG5cblx0XHRpZiAobGRhcC5hdXRoU3luYyh1c2Vyc1swXS5kbiwgbG9naW5SZXF1ZXN0LmxkYXBQYXNzKSA9PT0gdHJ1ZSkge1xuXHRcdFx0aWYgKGxkYXAuaXNVc2VySW5Hcm91cCAobG9naW5SZXF1ZXN0LnVzZXJuYW1lKSkge1xuXHRcdFx0XHRsZGFwVXNlciA9IHVzZXJzWzBdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVc2VyIG5vdCBpbiBhIHZhbGlkIGdyb3VwJyk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdXcm9uZyBwYXNzd29yZCBmb3InLCBsb2dpblJlcXVlc3QudXNlcm5hbWUpO1xuXHRcdH1cblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRsb2dnZXIuZXJyb3IoZXJyb3IpO1xuXHR9XG5cblx0aWYgKGxkYXBVc2VyID09PSB1bmRlZmluZWQpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfTG9naW5fRmFsbGJhY2snKSA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbGxiYWNrRGVmYXVsdEFjY291bnRTeXN0ZW0oc2VsZiwgbG9naW5SZXF1ZXN0LnVzZXJuYW1lLCBsb2dpblJlcXVlc3QubGRhcFBhc3MpO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0xEQVAtbG9naW4tZXJyb3InLCBgTERBUCBBdXRoZW50aWNhdGlvbiBmYWlsZWQgd2l0aCBwcm92aWRlZCB1c2VybmFtZSBbJHsgbG9naW5SZXF1ZXN0LnVzZXJuYW1lIH1dYCk7XG5cdH1cblxuXHQvLyBMb29rIHRvIHNlZSBpZiB1c2VyIGFscmVhZHkgZXhpc3RzXG5cdGxldCB1c2VyUXVlcnk7XG5cblx0Y29uc3QgVW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSBnZXRMZGFwVXNlclVuaXF1ZUlEKGxkYXBVc2VyKTtcblx0bGV0IHVzZXI7XG5cblx0aWYgKFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkKSB7XG5cdFx0dXNlclF1ZXJ5ID0ge1xuXHRcdFx0J3NlcnZpY2VzLmxkYXAuaWQnOiBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZC52YWx1ZVxuXHRcdH07XG5cblx0XHRsb2dnZXIuaW5mbygnUXVlcnlpbmcgdXNlcicpO1xuXHRcdGxvZ2dlci5kZWJ1ZygndXNlclF1ZXJ5JywgdXNlclF1ZXJ5KTtcblxuXHRcdHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VyUXVlcnkpO1xuXHR9XG5cblx0bGV0IHVzZXJuYW1lO1xuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Vc2VybmFtZV9GaWVsZCcpICE9PSAnJykge1xuXHRcdHVzZXJuYW1lID0gc2x1ZyhnZXRMZGFwVXNlcm5hbWUobGRhcFVzZXIpKTtcblx0fSBlbHNlIHtcblx0XHR1c2VybmFtZSA9IHNsdWcobG9naW5SZXF1ZXN0LnVzZXJuYW1lKTtcblx0fVxuXG5cdGlmICghdXNlcikge1xuXHRcdHVzZXJRdWVyeSA9IHtcblx0XHRcdHVzZXJuYW1lXG5cdFx0fTtcblxuXHRcdGxvZ2dlci5kZWJ1ZygndXNlclF1ZXJ5JywgdXNlclF1ZXJ5KTtcblxuXHRcdHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VyUXVlcnkpO1xuXHR9XG5cblx0Ly8gTG9naW4gdXNlciBpZiB0aGV5IGV4aXN0XG5cdGlmICh1c2VyKSB7XG5cdFx0aWYgKHVzZXIubGRhcCAhPT0gdHJ1ZSAmJiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9NZXJnZV9FeGlzdGluZ19Vc2VycycpICE9PSB0cnVlKSB7XG5cdFx0XHRsb2dnZXIuaW5mbygnVXNlciBleGlzdHMgd2l0aG91dCBcImxkYXA6IHRydWVcIicpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignTERBUC1sb2dpbi1lcnJvcicsIGBMREFQIEF1dGhlbnRpY2F0aW9uIHN1Y2NlZGVkLCBidXQgdGhlcmUncyBhbHJlYWR5IGFuIGV4aXN0aW5nIHVzZXIgd2l0aCBwcm92aWRlZCB1c2VybmFtZSBbJHsgdXNlcm5hbWUgfV0gaW4gTW9uZ28uYCk7XG5cdFx0fVxuXG5cdFx0bG9nZ2VyLmluZm8oJ0xvZ2dpbmcgdXNlcicpO1xuXG5cdFx0Y29uc3Qgc3RhbXBlZFRva2VuID0gQWNjb3VudHMuX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4oKTtcblxuXHRcdE1ldGVvci51c2Vycy51cGRhdGUodXNlci5faWQsIHtcblx0XHRcdCRwdXNoOiB7XG5cdFx0XHRcdCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMnOiBBY2NvdW50cy5faGFzaFN0YW1wZWRUb2tlbihzdGFtcGVkVG9rZW4pXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRzeW5jVXNlckRhdGEodXNlciwgbGRhcFVzZXIpO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0xvZ2luX0ZhbGxiYWNrJykgPT09IHRydWUpIHtcblx0XHRcdEFjY291bnRzLnNldFBhc3N3b3JkKHVzZXIuX2lkLCBsb2dpblJlcXVlc3QubGRhcFBhc3MsIHtsb2dvdXQ6IGZhbHNlfSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHVzZXJJZDogdXNlci5faWQsXG5cdFx0XHR0b2tlbjogc3RhbXBlZFRva2VuLnRva2VuXG5cdFx0fTtcblx0fVxuXG5cdGxvZ2dlci5pbmZvKCdVc2VyIGRvZXMgbm90IGV4aXN0LCBjcmVhdGluZycsIHVzZXJuYW1lKTtcblxuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfVXNlcm5hbWVfRmllbGQnKSA9PT0gJycpIHtcblx0XHR1c2VybmFtZSA9IHVuZGVmaW5lZDtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Mb2dpbl9GYWxsYmFjaycpICE9PSB0cnVlKSB7XG5cdFx0bG9naW5SZXF1ZXN0LmxkYXBQYXNzID0gdW5kZWZpbmVkO1xuXHR9XG5cblx0Ly8gQ3JlYXRlIG5ldyB1c2VyXG5cdGNvbnN0IHJlc3VsdCA9IGFkZExkYXBVc2VyKGxkYXBVc2VyLCB1c2VybmFtZSwgbG9naW5SZXF1ZXN0LmxkYXBQYXNzKTtcblxuXHRpZiAocmVzdWx0IGluc3RhbmNlb2YgRXJyb3IpIHtcblx0XHR0aHJvdyByZXN1bHQ7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdMREFQJywgZnVuY3Rpb24oKSB7XG5cdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge19pZDogJ0xEQVBfRW5hYmxlJywgdmFsdWU6IHRydWV9O1xuXHRjb25zdCBlbmFibGVBdXRoZW50aWNhdGlvbiA9IFtcblx0XHRlbmFibGVRdWVyeSxcblx0XHR7X2lkOiAnTERBUF9BdXRoZW50aWNhdGlvbicsIHZhbHVlOiB0cnVlfVxuXHRdO1xuXHRjb25zdCBlbmFibGVUTFNRdWVyeSA9IFtcblx0XHRlbmFibGVRdWVyeSxcblx0XHR7X2lkOiAnTERBUF9FbmNyeXB0aW9uJywgdmFsdWU6IHskaW46IFsndGxzJywgJ3NzbCddfX1cblx0XTtcblx0Y29uc3Qgc3luY0RhdGFRdWVyeSA9IFtcblx0XHRlbmFibGVRdWVyeSxcblx0XHR7X2lkOiAnTERBUF9TeW5jX1VzZXJfRGF0YScsIHZhbHVlOiB0cnVlfVxuXHRdO1xuXHRjb25zdCBncm91cEZpbHRlclF1ZXJ5ID0gW1xuXHRcdGVuYWJsZVF1ZXJ5LFxuXHRcdHtfaWQ6ICdMREFQX0dyb3VwX0ZpbHRlcl9FbmFibGUnLCB2YWx1ZTogdHJ1ZX1cblx0XTtcblx0Y29uc3QgYmFja2dyb3VuZFN5bmNRdWVyeSA9IFtcblx0XHRlbmFibGVRdWVyeSxcblx0XHR7X2lkOiAnTERBUF9CYWNrZ3JvdW5kX1N5bmMnLCB2YWx1ZTogdHJ1ZX1cblx0XTtcblxuXHR0aGlzLmFkZCgnTERBUF9FbmFibGUnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIHB1YmxpYzogdHJ1ZSB9KTtcblx0dGhpcy5hZGQoJ0xEQVBfTG9naW5fRmFsbGJhY2snLCB0cnVlLCB7IHR5cGU6ICdib29sZWFuJywgZW5hYmxlUXVlcnkgfSk7XG5cdHRoaXMuYWRkKCdMREFQX0hvc3QnLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdHRoaXMuYWRkKCdMREFQX1BvcnQnLCAnMzg5JywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdHRoaXMuYWRkKCdMREFQX1JlY29ubmVjdCcsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZW5hYmxlUXVlcnkgfSk7XG5cdHRoaXMuYWRkKCdMREFQX0VuY3J5cHRpb24nLCAncGxhaW4nLCB7IHR5cGU6ICdzZWxlY3QnLCB2YWx1ZXM6IFsgeyBrZXk6ICdwbGFpbicsIGkxOG5MYWJlbDogJ05vX0VuY3J5cHRpb24nIH0sIHsga2V5OiAndGxzJywgaTE4bkxhYmVsOiAnU3RhcnRUTFMnIH0sIHsga2V5OiAnc3NsJywgaTE4bkxhYmVsOiAnU1NML0xEQVBTJyB9IF0sIGVuYWJsZVF1ZXJ5IH0pO1xuXHR0aGlzLmFkZCgnTERBUF9DQV9DZXJ0JywgJycsIHsgdHlwZTogJ3N0cmluZycsIG11bHRpbGluZTogdHJ1ZSwgZW5hYmxlUXVlcnk6IGVuYWJsZVRMU1F1ZXJ5IH0pO1xuXHR0aGlzLmFkZCgnTERBUF9SZWplY3RfVW5hdXRob3JpemVkJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5OiBlbmFibGVUTFNRdWVyeSB9KTtcblx0dGhpcy5hZGQoJ0xEQVBfQmFzZUROJywgJycsIHsgdHlwZTogJ3N0cmluZycsIGVuYWJsZVF1ZXJ5IH0pO1xuXHR0aGlzLmFkZCgnTERBUF9JbnRlcm5hbF9Mb2dfTGV2ZWwnLCAnZGlzYWJsZWQnLCB7XG5cdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0dmFsdWVzOiBbXG5cdFx0XHR7IGtleTogJ2Rpc2FibGVkJywgaTE4bkxhYmVsOiAnRGlzYWJsZWQnIH0sXG5cdFx0XHR7IGtleTogJ2Vycm9yJywgaTE4bkxhYmVsOiAnRXJyb3InIH0sXG5cdFx0XHR7IGtleTogJ3dhcm4nLCBpMThuTGFiZWw6ICdXYXJuJyB9LFxuXHRcdFx0eyBrZXk6ICdpbmZvJywgaTE4bkxhYmVsOiAnSW5mbycgfSxcblx0XHRcdHsga2V5OiAnZGVidWcnLCBpMThuTGFiZWw6ICdEZWJ1ZycgfSxcblx0XHRcdHsga2V5OiAndHJhY2UnLCBpMThuTGFiZWw6ICdUcmFjZScgfVxuXHRcdF0sXG5cdFx0ZW5hYmxlUXVlcnlcblx0fSk7XG5cdHRoaXMuYWRkKCdMREFQX1Rlc3RfQ29ubmVjdGlvbicsICdsZGFwX3Rlc3RfY29ubmVjdGlvbicsIHsgdHlwZTogJ2FjdGlvbicsIGFjdGlvblRleHQ6ICdUZXN0X0Nvbm5lY3Rpb24nIH0pO1xuXG5cdHRoaXMuc2VjdGlvbignQXV0aGVudGljYXRpb24nLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnTERBUF9BdXRoZW50aWNhdGlvbicsIGZhbHNlLCB7IHR5cGU6ICdib29sZWFuJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfQXV0aGVudGljYXRpb25fVXNlckROJywgJycsIHsgdHlwZTogJ3N0cmluZycsIGVuYWJsZVF1ZXJ5OiBlbmFibGVBdXRoZW50aWNhdGlvbiB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9BdXRoZW50aWNhdGlvbl9QYXNzd29yZCcsICcnLCB7IHR5cGU6ICdwYXNzd29yZCcsIGVuYWJsZVF1ZXJ5OiBlbmFibGVBdXRoZW50aWNhdGlvbiB9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdUaW1lb3V0cycsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdMREFQX1RpbWVvdXQnLCA2MDAwMCwge3R5cGU6ICdpbnQnLCBlbmFibGVRdWVyeX0pO1xuXHRcdHRoaXMuYWRkKCdMREFQX0Nvbm5lY3RfVGltZW91dCcsIDEwMDAsIHt0eXBlOiAnaW50JywgZW5hYmxlUXVlcnl9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9JZGxlX1RpbWVvdXQnLCAxMDAwLCB7dHlwZTogJ2ludCcsIGVuYWJsZVF1ZXJ5fSk7XG5cdH0pO1xuXG5cdHRoaXMuc2VjdGlvbignVXNlciBTZWFyY2gnLCBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFkZCgnTERBUF9Vc2VyX1NlYXJjaF9GaWx0ZXInLCAnKG9iamVjdGNsYXNzPSopJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfVXNlcl9TZWFyY2hfU2NvcGUnLCAnc3ViJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfVXNlcl9TZWFyY2hfRmllbGQnLCAnc0FNQWNjb3VudE5hbWUnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9TZWFyY2hfUGFnZV9TaXplJywgMjUwLCB7IHR5cGU6ICdpbnQnLCBlbmFibGVRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9TZWFyY2hfU2l6ZV9MaW1pdCcsIDEwMDAsIHsgdHlwZTogJ2ludCcsIGVuYWJsZVF1ZXJ5IH0pO1xuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ1VzZXIgU2VhcmNoIChHcm91cCBWYWxpZGF0aW9uKScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdMREFQX0dyb3VwX0ZpbHRlcl9FbmFibGUnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5IH0pO1xuXHRcdHRoaXMuYWRkKCdMREFQX0dyb3VwX0ZpbHRlcl9PYmplY3RDbGFzcycsICdncm91cE9mVW5pcXVlTmFtZXMnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeTogZ3JvdXBGaWx0ZXJRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9Hcm91cF9GaWx0ZXJfR3JvdXBfSWRfQXR0cmlidXRlJywgJ2NuJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnk6IGdyb3VwRmlsdGVyUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfR3JvdXBfRmlsdGVyX0dyb3VwX01lbWJlcl9BdHRyaWJ1dGUnLCAndW5pcXVlTWVtYmVyJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnk6IGdyb3VwRmlsdGVyUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfR3JvdXBfRmlsdGVyX0dyb3VwX01lbWJlcl9Gb3JtYXQnLCAndW5pcXVlTWVtYmVyJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnk6IGdyb3VwRmlsdGVyUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfR3JvdXBfRmlsdGVyX0dyb3VwX05hbWUnLCAnUk9DS0VUX0NIQVQnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeTogZ3JvdXBGaWx0ZXJRdWVyeSB9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdTeW5jIC8gSW1wb3J0JywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfVXNlcm5hbWVfRmllbGQnLCAnc0FNQWNjb3VudE5hbWUnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9VbmlxdWVfSWRlbnRpZmllcl9GaWVsZCcsICdvYmplY3RHVUlELGlibS1lbnRyeVVVSUQsR1VJRCxkb21pbm9VTklELG5zdW5pcXVlSWQsdWlkTnVtYmVyJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfRGVmYXVsdF9Eb21haW4nLCAnJywgeyB0eXBlOiAnc3RyaW5nJywgZW5hYmxlUXVlcnkgfSk7XG5cdFx0dGhpcy5hZGQoJ0xEQVBfTWVyZ2VfRXhpc3RpbmdfVXNlcnMnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5IH0pO1xuXG5cdFx0dGhpcy5hZGQoJ0xEQVBfU3luY19Vc2VyX0RhdGEnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5IH0pO1xuXHRcdHRoaXMuYWRkKCdMREFQX1N5bmNfVXNlcl9EYXRhX0ZpZWxkTWFwJywgJ3tcImNuXCI6XCJuYW1lXCIsIFwibWFpbFwiOlwiZW1haWxcIn0nLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeTogc3luY0RhdGFRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9TeW5jX1VzZXJfQXZhdGFyJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5IH0pO1xuXG5cdFx0dGhpcy5hZGQoJ0xEQVBfQmFja2dyb3VuZF9TeW5jJywgZmFsc2UsIHsgdHlwZTogJ2Jvb2xlYW4nLCBlbmFibGVRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9CYWNrZ3JvdW5kX1N5bmNfSW50ZXJ2YWwnLCAnRXZlcnkgMjQgaG91cnMnLCB7IHR5cGU6ICdzdHJpbmcnLCBlbmFibGVRdWVyeTogYmFja2dyb3VuZFN5bmNRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9CYWNrZ3JvdW5kX1N5bmNfSW1wb3J0X05ld19Vc2VycycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBlbmFibGVRdWVyeTogYmFja2dyb3VuZFN5bmNRdWVyeSB9KTtcblx0XHR0aGlzLmFkZCgnTERBUF9CYWNrZ3JvdW5kX1N5bmNfS2VlcF9FeGlzdGFudF9Vc2Vyc19VcGRhdGVkJywgdHJ1ZSwgeyB0eXBlOiAnYm9vbGVhbicsIGVuYWJsZVF1ZXJ5OiBiYWNrZ3JvdW5kU3luY1F1ZXJ5IH0pO1xuXG5cdFx0dGhpcy5hZGQoJ0xEQVBfU3luY19Ob3cnLCAnbGRhcF9zeW5jX25vdycsIHsgdHlwZTogJ2FjdGlvbicsIGFjdGlvblRleHQ6ICdFeGVjdXRlX1N5bmNocm9uaXphdGlvbl9Ob3cnIH0pO1xuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBzbHVnaWZ5LCBTeW5jZWRDcm9uICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IExEQVAgZnJvbSAnLi9sZGFwJztcblxuY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcignTERBUFN5bmMnLCB7fSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzbHVnKHRleHQpIHtcblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdVVEY4X05hbWVzX1NsdWdpZnknKSAhPT0gdHJ1ZSkge1xuXHRcdHJldHVybiB0ZXh0O1xuXHR9XG5cdHRleHQgPSBzbHVnaWZ5KHRleHQsICcuJyk7XG5cdHJldHVybiB0ZXh0LnJlcGxhY2UoL1teMC05YS16LV8uXS9nLCAnJyk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BlcnR5VmFsdWUob2JqLCBrZXkpIHtcblx0dHJ5IHtcblx0XHRyZXR1cm4gXy5yZWR1Y2Uoa2V5LnNwbGl0KCcuJyksIChhY2MsIGVsKSA9PiBhY2NbZWxdLCBvYmopO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExkYXBVc2VybmFtZShsZGFwVXNlcikge1xuXHRjb25zdCB1c2VybmFtZUZpZWxkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfVXNlcm5hbWVfRmllbGQnKTtcblxuXHRpZiAodXNlcm5hbWVGaWVsZC5pbmRleE9mKCcjeycpID4gLTEpIHtcblx0XHRyZXR1cm4gdXNlcm5hbWVGaWVsZC5yZXBsYWNlKC8jeyguKz8pfS9nLCBmdW5jdGlvbihtYXRjaCwgZmllbGQpIHtcblx0XHRcdHJldHVybiBsZGFwVXNlcltmaWVsZF07XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gbGRhcFVzZXJbdXNlcm5hbWVGaWVsZF07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExkYXBVc2VyVW5pcXVlSUQobGRhcFVzZXIpIHtcblx0bGV0IFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfVW5pcXVlX0lkZW50aWZpZXJfRmllbGQnKTtcblxuXHRpZiAoVW5pcXVlX0lkZW50aWZpZXJfRmllbGQgIT09ICcnKSB7XG5cdFx0VW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZC5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG5cdH0gZWxzZSB7XG5cdFx0VW5pcXVlX0lkZW50aWZpZXJfRmllbGQgPSBbXTtcblx0fVxuXG5cdGxldCBVc2VyX1NlYXJjaF9GaWVsZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX1VzZXJfU2VhcmNoX0ZpZWxkJyk7XG5cblx0aWYgKFVzZXJfU2VhcmNoX0ZpZWxkICE9PSAnJykge1xuXHRcdFVzZXJfU2VhcmNoX0ZpZWxkID0gVXNlcl9TZWFyY2hfRmllbGQucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuXHR9IGVsc2Uge1xuXHRcdFVzZXJfU2VhcmNoX0ZpZWxkID0gW107XG5cdH1cblxuXHRVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkLmNvbmNhdChVc2VyX1NlYXJjaF9GaWVsZCk7XG5cblx0aWYgKFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkLmxlbmd0aCA+IDApIHtcblx0XHRVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkLmZpbmQoKGZpZWxkKSA9PiB7XG5cdFx0XHRyZXR1cm4gIV8uaXNFbXB0eShsZGFwVXNlci5fcmF3W2ZpZWxkXSk7XG5cdFx0fSk7XG5cdFx0aWYgKFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkKSB7XG5cdFx0XHRVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCA9IHtcblx0XHRcdFx0YXR0cmlidXRlOiBVbmlxdWVfSWRlbnRpZmllcl9GaWVsZCxcblx0XHRcdFx0dmFsdWU6IGxkYXBVc2VyLl9yYXdbVW5pcXVlX0lkZW50aWZpZXJfRmllbGRdLnRvU3RyaW5nKCdoZXgnKVxuXHRcdFx0fTtcblx0XHR9XG5cdFx0cmV0dXJuIFVuaXF1ZV9JZGVudGlmaWVyX0ZpZWxkO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREYXRhVG9TeW5jVXNlckRhdGEobGRhcFVzZXIsIHVzZXIpIHtcblx0Y29uc3Qgc3luY1VzZXJEYXRhID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfU3luY19Vc2VyX0RhdGEnKTtcblx0Y29uc3Qgc3luY1VzZXJEYXRhRmllbGRNYXAgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9TeW5jX1VzZXJfRGF0YV9GaWVsZE1hcCcpLnRyaW0oKTtcblxuXHRjb25zdCB1c2VyRGF0YSA9IHt9O1xuXG5cdGlmIChzeW5jVXNlckRhdGEgJiYgc3luY1VzZXJEYXRhRmllbGRNYXApIHtcblx0XHRjb25zdCB3aGl0ZWxpc3RlZFVzZXJGaWVsZHMgPSBbJ2VtYWlsJywgJ25hbWUnLCAnY3VzdG9tRmllbGRzJ107XG5cdFx0Y29uc3QgZmllbGRNYXAgPSBKU09OLnBhcnNlKHN5bmNVc2VyRGF0YUZpZWxkTWFwKTtcblx0XHRjb25zdCBlbWFpbExpc3QgPSBbXTtcblx0XHRfLm1hcChmaWVsZE1hcCwgZnVuY3Rpb24odXNlckZpZWxkLCBsZGFwRmllbGQpIHtcblx0XHRcdHN3aXRjaCAodXNlckZpZWxkKSB7XG5cdFx0XHRcdGNhc2UgJ2VtYWlsJzpcblx0XHRcdFx0XHRpZiAoIWxkYXBVc2VyLmhhc093blByb3BlcnR5KGxkYXBGaWVsZCkpIHtcblx0XHRcdFx0XHRcdGxvZ2dlci5kZWJ1ZyhgdXNlciBkb2VzIG5vdCBoYXZlIGF0dHJpYnV0ZTogJHsgbGRhcEZpZWxkIH1gKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoXy5pc09iamVjdChsZGFwVXNlcltsZGFwRmllbGRdKSkge1xuXHRcdFx0XHRcdFx0Xy5tYXAobGRhcFVzZXJbbGRhcEZpZWxkXSwgZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0XHRcdFx0XHRlbWFpbExpc3QucHVzaCh7IGFkZHJlc3M6IGl0ZW0sIHZlcmlmaWVkOiB0cnVlIH0pO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGVtYWlsTGlzdC5wdXNoKHsgYWRkcmVzczogbGRhcFVzZXJbbGRhcEZpZWxkXSwgdmVyaWZpZWQ6IHRydWUgfSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0Y29uc3QgW291dGVyS2V5LCBpbm5lcktleXNdID0gdXNlckZpZWxkLnNwbGl0KC9cXC4oLispLyk7XG5cblx0XHRcdFx0XHRpZiAoIV8uZmluZCh3aGl0ZWxpc3RlZFVzZXJGaWVsZHMsIChlbCkgPT4gZWwgPT09IG91dGVyS2V5KSkge1xuXHRcdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKGB1c2VyIGF0dHJpYnV0ZSBub3Qgd2hpdGVsaXN0ZWQ6ICR7IHVzZXJGaWVsZCB9YCk7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKG91dGVyS2V5ID09PSAnY3VzdG9tRmllbGRzJykge1xuXHRcdFx0XHRcdFx0bGV0IGN1c3RvbUZpZWxkc01ldGE7XG5cblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdGN1c3RvbUZpZWxkc01ldGEgPSBKU09OLnBhcnNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19DdXN0b21GaWVsZHMnKSk7XG5cdFx0XHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0XHRcdGxvZ2dlci5kZWJ1ZygnSW52YWxpZCBKU09OIGZvciBDdXN0b20gRmllbGRzJyk7XG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFnZXRQcm9wZXJ0eVZhbHVlKGN1c3RvbUZpZWxkc01ldGEsIGlubmVyS2V5cykpIHtcblx0XHRcdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKGB1c2VyIGF0dHJpYnV0ZSBkb2VzIG5vdCBleGlzdDogJHsgdXNlckZpZWxkIH1gKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnN0IHRtcFVzZXJGaWVsZCA9IGdldFByb3BlcnR5VmFsdWUodXNlciwgdXNlckZpZWxkKTtcblx0XHRcdFx0XHRjb25zdCB0bXBMZGFwRmllbGQgPSBSb2NrZXRDaGF0LnRlbXBsYXRlVmFySGFuZGxlcihsZGFwRmllbGQsIGxkYXBVc2VyKTtcblxuXHRcdFx0XHRcdGlmICh0bXBMZGFwRmllbGQgJiYgdG1wVXNlckZpZWxkICE9PSB0bXBMZGFwRmllbGQpIHtcblx0XHRcdFx0XHRcdC8vIGNyZWF0ZXMgdGhlIG9iamVjdCBzdHJ1Y3R1cmUgaW5zdGVhZCBvZiBqdXN0IGFzc2lnbmluZyAndG1wTGRhcEZpZWxkJyB0b1xuXHRcdFx0XHRcdFx0Ly8gJ3VzZXJEYXRhW3VzZXJGaWVsZF0nIGluIG9yZGVyIHRvIGF2b2lkIHRoZSBcImNhbm5vdCB1c2UgdGhlIHBhcnQgKC4uLilcblx0XHRcdFx0XHRcdC8vIHRvIHRyYXZlcnNlIHRoZSBlbGVtZW50XCIgKE1vbmdvREIpIGVycm9yIHRoYXQgY2FuIGhhcHBlbi4gRG8gbm90IGhhbmRsZVxuXHRcdFx0XHRcdFx0Ly8gYXJyYXlzLlxuXHRcdFx0XHRcdFx0Ly8gVE9ETzogRmluZCBhIGJldHRlciBzb2x1dGlvbi5cblx0XHRcdFx0XHRcdGNvbnN0IGRLZXlzID0gdXNlckZpZWxkLnNwbGl0KCcuJyk7XG5cdFx0XHRcdFx0XHRjb25zdCBsYXN0S2V5ID0gXy5sYXN0KGRLZXlzKTtcblx0XHRcdFx0XHRcdF8ucmVkdWNlKGRLZXlzLCAob2JqLCBjdXJyS2V5KSA9PlxuXHRcdFx0XHRcdFx0XHQoY3VycktleSA9PT0gbGFzdEtleSlcblx0XHRcdFx0XHRcdFx0XHQ/IG9ialtjdXJyS2V5XSA9IHRtcExkYXBGaWVsZFxuXHRcdFx0XHRcdFx0XHRcdDogb2JqW2N1cnJLZXldID0gb2JqW2N1cnJLZXldIHx8IHt9XG5cdFx0XHRcdFx0XHRcdCwgdXNlckRhdGEpO1xuXHRcdFx0XHRcdFx0bG9nZ2VyLmRlYnVnKGB1c2VyLiR7IHVzZXJGaWVsZCB9IGNoYW5nZWQgdG86ICR7IHRtcExkYXBGaWVsZCB9YCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0aWYgKGVtYWlsTGlzdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRpZiAoSlNPTi5zdHJpbmdpZnkodXNlci5lbWFpbHMpICE9PSBKU09OLnN0cmluZ2lmeShlbWFpbExpc3QpKSB7XG5cdFx0XHRcdHVzZXJEYXRhLmVtYWlscyA9IGVtYWlsTGlzdDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCB1bmlxdWVJZCA9IGdldExkYXBVc2VyVW5pcXVlSUQobGRhcFVzZXIpO1xuXG5cdGlmICh1bmlxdWVJZCAmJiAoIXVzZXIuc2VydmljZXMgfHwgIXVzZXIuc2VydmljZXMubGRhcCB8fCB1c2VyLnNlcnZpY2VzLmxkYXAuaWQgIT09IHVuaXF1ZUlkLnZhbHVlIHx8IHVzZXIuc2VydmljZXMubGRhcC5pZEF0dHJpYnV0ZSAhPT0gdW5pcXVlSWQuYXR0cmlidXRlKSkge1xuXHRcdHVzZXJEYXRhWydzZXJ2aWNlcy5sZGFwLmlkJ10gPSB1bmlxdWVJZC52YWx1ZTtcblx0XHR1c2VyRGF0YVsnc2VydmljZXMubGRhcC5pZEF0dHJpYnV0ZSddID0gdW5pcXVlSWQuYXR0cmlidXRlO1xuXHR9XG5cblx0aWYgKHVzZXIubGRhcCAhPT0gdHJ1ZSkge1xuXHRcdHVzZXJEYXRhLmxkYXAgPSB0cnVlO1xuXHR9XG5cblx0aWYgKF8uc2l6ZSh1c2VyRGF0YSkpIHtcblx0XHRyZXR1cm4gdXNlckRhdGE7XG5cdH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc3luY1VzZXJEYXRhKHVzZXIsIGxkYXBVc2VyKSB7XG5cdGxvZ2dlci5pbmZvKCdTeW5jaW5nIHVzZXIgZGF0YScpO1xuXHRsb2dnZXIuZGVidWcoJ3VzZXInLCB7J2VtYWlsJzogdXNlci5lbWFpbCwgJ19pZCc6IHVzZXIuX2lkfSk7XG5cdGxvZ2dlci5kZWJ1ZygnbGRhcFVzZXInLCBsZGFwVXNlci5vYmplY3QpO1xuXG5cdGNvbnN0IHVzZXJEYXRhID0gZ2V0RGF0YVRvU3luY1VzZXJEYXRhKGxkYXBVc2VyLCB1c2VyKTtcblx0aWYgKHVzZXIgJiYgdXNlci5faWQgJiYgdXNlckRhdGEpIHtcblx0XHRsb2dnZXIuZGVidWcoJ3NldHRpbmcnLCBKU09OLnN0cmluZ2lmeSh1c2VyRGF0YSwgbnVsbCwgMikpO1xuXHRcdGlmICh1c2VyRGF0YS5uYW1lKSB7XG5cdFx0XHRSb2NrZXRDaGF0Ll9zZXRSZWFsTmFtZSh1c2VyLl9pZCwgdXNlckRhdGEubmFtZSk7XG5cdFx0XHRkZWxldGUgdXNlckRhdGEubmFtZTtcblx0XHR9XG5cdFx0TWV0ZW9yLnVzZXJzLnVwZGF0ZSh1c2VyLl9pZCwgeyAkc2V0OiB1c2VyRGF0YSB9KTtcblx0XHR1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe19pZDogdXNlci5faWR9KTtcblx0fVxuXG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9Vc2VybmFtZV9GaWVsZCcpICE9PSAnJykge1xuXHRcdGNvbnN0IHVzZXJuYW1lID0gc2x1ZyhnZXRMZGFwVXNlcm5hbWUobGRhcFVzZXIpKTtcblx0XHRpZiAodXNlciAmJiB1c2VyLl9pZCAmJiB1c2VybmFtZSAhPT0gdXNlci51c2VybmFtZSkge1xuXHRcdFx0bG9nZ2VyLmluZm8oJ1N5bmNpbmcgdXNlciB1c2VybmFtZScsIHVzZXIudXNlcm5hbWUsICctPicsIHVzZXJuYW1lKTtcblx0XHRcdFJvY2tldENoYXQuX3NldFVzZXJuYW1lKHVzZXIuX2lkLCB1c2VybmFtZSk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKHVzZXIgJiYgdXNlci5faWQgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfU3luY19Vc2VyX0F2YXRhcicpID09PSB0cnVlKSB7XG5cdFx0Y29uc3QgYXZhdGFyID0gbGRhcFVzZXIuX3Jhdy50aHVtYm5haWxQaG90byB8fCBsZGFwVXNlci5fcmF3LmpwZWdQaG90bztcblx0XHRpZiAoYXZhdGFyKSB7XG5cdFx0XHRsb2dnZXIuaW5mbygnU3luY2luZyB1c2VyIGF2YXRhcicpO1xuXG5cdFx0XHRjb25zdCBycyA9IFJvY2tldENoYXRGaWxlLmJ1ZmZlclRvU3RyZWFtKGF2YXRhcik7XG5cdFx0XHRjb25zdCBmaWxlU3RvcmUgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdBdmF0YXJzJyk7XG5cdFx0XHRmaWxlU3RvcmUuZGVsZXRlQnlOYW1lKHVzZXIudXNlcm5hbWUpO1xuXG5cdFx0XHRjb25zdCBmaWxlID0ge1xuXHRcdFx0XHR1c2VySWQ6IHVzZXIuX2lkLFxuXHRcdFx0XHR0eXBlOiAnaW1hZ2UvanBlZydcblx0XHRcdH07XG5cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0ZmlsZVN0b3JlLmluc2VydChmaWxlLCBycywgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuc2V0QXZhdGFyT3JpZ2luKHVzZXIuX2lkLCAnbGRhcCcpO1xuXHRcdFx0XHRcdFx0Um9ja2V0Q2hhdC5Ob3RpZmljYXRpb25zLm5vdGlmeUxvZ2dlZCgndXBkYXRlQXZhdGFyJywge3VzZXJuYW1lOiB1c2VyLnVzZXJuYW1lfSk7XG5cdFx0XHRcdFx0fSwgNTAwKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZExkYXBVc2VyKGxkYXBVc2VyLCB1c2VybmFtZSwgcGFzc3dvcmQpIHtcblx0Y29uc3QgdW5pcXVlSWQgPSBnZXRMZGFwVXNlclVuaXF1ZUlEKGxkYXBVc2VyKTtcblxuXHRjb25zdCB1c2VyT2JqZWN0ID0ge307XG5cblx0aWYgKHVzZXJuYW1lKSB7XG5cdFx0dXNlck9iamVjdC51c2VybmFtZSA9IHVzZXJuYW1lO1xuXHR9XG5cblx0Y29uc3QgdXNlckRhdGEgPSBnZXREYXRhVG9TeW5jVXNlckRhdGEobGRhcFVzZXIsIHt9KTtcblxuXHRpZiAodXNlckRhdGEgJiYgdXNlckRhdGEuZW1haWxzICYmIHVzZXJEYXRhLmVtYWlsc1swXSAmJiB1c2VyRGF0YS5lbWFpbHNbMF0uYWRkcmVzcykge1xuXHRcdGlmIChBcnJheS5pc0FycmF5KHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzKSkge1xuXHRcdFx0dXNlck9iamVjdC5lbWFpbCA9IHVzZXJEYXRhLmVtYWlsc1swXS5hZGRyZXNzWzBdO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR1c2VyT2JqZWN0LmVtYWlsID0gdXNlckRhdGEuZW1haWxzWzBdLmFkZHJlc3M7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKGxkYXBVc2VyLm1haWwgJiYgbGRhcFVzZXIubWFpbC5pbmRleE9mKCdAJykgPiAtMSkge1xuXHRcdHVzZXJPYmplY3QuZW1haWwgPSBsZGFwVXNlci5tYWlsO1xuXHR9IGVsc2UgaWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0RlZmF1bHRfRG9tYWluJykgIT09ICcnKSB7XG5cdFx0dXNlck9iamVjdC5lbWFpbCA9IGAkeyB1c2VybmFtZSB8fCB1bmlxdWVJZC52YWx1ZSB9QCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0RlZmF1bHRfRG9tYWluJykgfWA7XG5cdH0gZWxzZSB7XG5cdFx0Y29uc3QgZXJyb3IgPSBuZXcgTWV0ZW9yLkVycm9yKCdMREFQLWxvZ2luLWVycm9yJywgJ0xEQVAgQXV0aGVudGljYXRpb24gc3VjY2VkZWQsIHRoZXJlIGlzIG5vIGVtYWlsIHRvIGNyZWF0ZSBhbiBhY2NvdW50LiBIYXZlIHlvdSB0cmllZCBzZXR0aW5nIHlvdXIgRGVmYXVsdCBEb21haW4gaW4gTERBUCBTZXR0aW5ncz8nKTtcblx0XHRsb2dnZXIuZXJyb3IoZXJyb3IpO1xuXHRcdHRocm93IGVycm9yO1xuXHR9XG5cblx0bG9nZ2VyLmRlYnVnKCdOZXcgdXNlciBkYXRhJywgdXNlck9iamVjdCk7XG5cblx0aWYgKHBhc3N3b3JkKSB7XG5cdFx0dXNlck9iamVjdC5wYXNzd29yZCA9IHBhc3N3b3JkO1xuXHR9XG5cblx0dHJ5IHtcblx0XHR1c2VyT2JqZWN0Ll9pZCA9IEFjY291bnRzLmNyZWF0ZVVzZXIodXNlck9iamVjdCk7XG5cdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0bG9nZ2VyLmVycm9yKCdFcnJvciBjcmVhdGluZyB1c2VyJywgZXJyb3IpO1xuXHRcdHJldHVybiBlcnJvcjtcblx0fVxuXG5cdHN5bmNVc2VyRGF0YSh1c2VyT2JqZWN0LCBsZGFwVXNlcik7XG5cblx0cmV0dXJuIHtcblx0XHR1c2VySWQ6IHVzZXJPYmplY3QuX2lkXG5cdH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbXBvcnROZXdVc2VycyhsZGFwKSB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9FbmFibGUnKSAhPT0gdHJ1ZSkge1xuXHRcdGxvZ2dlci5lcnJvcignQ2FuXFwndCBydW4gTERBUCBJbXBvcnQsIExEQVAgaXMgZGlzYWJsZWQnKTtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRpZiAoIWxkYXApIHtcblx0XHRsZGFwID0gbmV3IExEQVAoKTtcblx0XHRsZGFwLmNvbm5lY3RTeW5jKCk7XG5cdH1cblxuXHRsZXQgY291bnQgPSAwO1xuXHRsZGFwLnNlYXJjaFVzZXJzU3luYygnKicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVycm9yLCBsZGFwVXNlcnMsIHtuZXh0LCBlbmR9ID0ge30pID0+IHtcblx0XHRpZiAoZXJyb3IpIHtcblx0XHRcdHRocm93IGVycm9yO1xuXHRcdH1cblxuXHRcdGxkYXBVc2Vycy5mb3JFYWNoKChsZGFwVXNlcikgPT4ge1xuXHRcdFx0Y291bnQrKztcblxuXHRcdFx0Y29uc3QgdW5pcXVlSWQgPSBnZXRMZGFwVXNlclVuaXF1ZUlEKGxkYXBVc2VyKTtcblx0XHRcdC8vIExvb2sgdG8gc2VlIGlmIHVzZXIgYWxyZWFkeSBleGlzdHNcblx0XHRcdGNvbnN0IHVzZXJRdWVyeSA9IHtcblx0XHRcdFx0J3NlcnZpY2VzLmxkYXAuaWQnOiB1bmlxdWVJZC52YWx1ZVxuXHRcdFx0fTtcblxuXHRcdFx0bG9nZ2VyLmRlYnVnKCd1c2VyUXVlcnknLCB1c2VyUXVlcnkpO1xuXG5cdFx0XHRsZXQgdXNlcm5hbWU7XG5cdFx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfVXNlcm5hbWVfRmllbGQnKSAhPT0gJycpIHtcblx0XHRcdFx0dXNlcm5hbWUgPSBzbHVnKGdldExkYXBVc2VybmFtZShsZGFwVXNlcikpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBBZGQgdXNlciBpZiBpdCB3YXMgbm90IGFkZGVkIGJlZm9yZVxuXHRcdFx0bGV0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VyUXVlcnkpO1xuXG5cdFx0XHRpZiAoIXVzZXIgJiYgdXNlcm5hbWUgJiYgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfTWVyZ2VfRXhpc3RpbmdfVXNlcnMnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRjb25zdCB1c2VyUXVlcnkgPSB7XG5cdFx0XHRcdFx0dXNlcm5hbWVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsb2dnZXIuZGVidWcoJ3VzZXJRdWVyeSBtZXJnZScsIHVzZXJRdWVyeSk7XG5cblx0XHRcdFx0dXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHVzZXJRdWVyeSk7XG5cdFx0XHRcdGlmICh1c2VyKSB7XG5cdFx0XHRcdFx0c3luY1VzZXJEYXRhKHVzZXIsIGxkYXBVc2VyKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXVzZXIpIHtcblx0XHRcdFx0YWRkTGRhcFVzZXIobGRhcFVzZXIsIHVzZXJuYW1lKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGNvdW50ICUgMTAwID09PSAwKSB7XG5cdFx0XHRcdGxvZ2dlci5pbmZvKCdJbXBvcnQgcnVubmluZy4gVXNlcnMgaW1wb3J0ZWQgdW50aWwgbm93OicsIGNvdW50KTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdGlmIChlbmQpIHtcblx0XHRcdGxvZ2dlci5pbmZvKCdJbXBvcnQgZmluaXNoZWQuIFVzZXJzIGltcG9ydGVkOicsIGNvdW50KTtcblx0XHR9XG5cblx0XHRuZXh0KGNvdW50KTtcblx0fSkpO1xufVxuXG5mdW5jdGlvbiBzeW5jKCkge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfRW5hYmxlJykgIT09IHRydWUpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBsZGFwID0gbmV3IExEQVAoKTtcblxuXHR0cnkge1xuXHRcdGxkYXAuY29ubmVjdFN5bmMoKTtcblxuXHRcdGxldCB1c2Vycztcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQmFja2dyb3VuZF9TeW5jX0tlZXBfRXhpc3RhbnRfVXNlcnNfVXBkYXRlZCcpID09PSB0cnVlKSB7XG5cdFx0XHR1c2VycyA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRMREFQVXNlcnMoKTtcblx0XHR9XG5cblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQmFja2dyb3VuZF9TeW5jX0ltcG9ydF9OZXdfVXNlcnMnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0aW1wb3J0TmV3VXNlcnMobGRhcCk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0JhY2tncm91bmRfU3luY19LZWVwX0V4aXN0YW50X1VzZXJzX1VwZGF0ZWQnKSA9PT0gdHJ1ZSkge1xuXHRcdFx0dXNlcnMuZm9yRWFjaChmdW5jdGlvbih1c2VyKSB7XG5cdFx0XHRcdGxldCBsZGFwVXNlcjtcblxuXHRcdFx0XHRpZiAodXNlci5zZXJ2aWNlcyAmJiB1c2VyLnNlcnZpY2VzLmxkYXAgJiYgdXNlci5zZXJ2aWNlcy5sZGFwLmlkKSB7XG5cdFx0XHRcdFx0bGRhcFVzZXIgPSBsZGFwLmdldFVzZXJCeUlkU3luYyh1c2VyLnNlcnZpY2VzLmxkYXAuaWQsIHVzZXIuc2VydmljZXMubGRhcC5pZEF0dHJpYnV0ZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bGRhcFVzZXIgPSBsZGFwLmdldFVzZXJCeVVzZXJuYW1lU3luYyh1c2VyLnVzZXJuYW1lKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChsZGFwVXNlcikge1xuXHRcdFx0XHRcdHN5bmNVc2VyRGF0YSh1c2VyLCBsZGFwVXNlcik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0bG9nZ2VyLmluZm8oJ0NhblxcJ3Qgc3luYyB1c2VyJywgdXNlci51c2VybmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRsb2dnZXIuZXJyb3IoZXJyb3IpO1xuXHRcdHJldHVybiBlcnJvcjtcblx0fVxuXHRyZXR1cm4gdHJ1ZTtcbn1cblxuY29uc3Qgam9iTmFtZSA9ICdMREFQX1N5bmMnO1xuXG5jb25zdCBhZGRDcm9uSm9iID0gXy5kZWJvdW5jZShNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIGFkZENyb25Kb2JEZWJvdW5jZWQoKSB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9CYWNrZ3JvdW5kX1N5bmMnKSAhPT0gdHJ1ZSkge1xuXHRcdGxvZ2dlci5pbmZvKCdEaXNhYmxpbmcgTERBUCBCYWNrZ3JvdW5kIFN5bmMnKTtcblx0XHRpZiAoU3luY2VkQ3Jvbi5uZXh0U2NoZWR1bGVkQXREYXRlKGpvYk5hbWUpKSB7XG5cdFx0XHRTeW5jZWRDcm9uLnJlbW92ZShqb2JOYW1lKTtcblx0XHR9XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0JhY2tncm91bmRfU3luY19JbnRlcnZhbCcpKSB7XG5cdFx0bG9nZ2VyLmluZm8oJ0VuYWJsaW5nIExEQVAgQmFja2dyb3VuZCBTeW5jJyk7XG5cdFx0U3luY2VkQ3Jvbi5hZGQoe1xuXHRcdFx0bmFtZTogam9iTmFtZSxcblx0XHRcdHNjaGVkdWxlOiAocGFyc2VyKSA9PiBwYXJzZXIudGV4dChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9CYWNrZ3JvdW5kX1N5bmNfSW50ZXJ2YWwnKSksXG5cdFx0XHRqb2IoKSB7XG5cdFx0XHRcdHN5bmMoKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRTeW5jZWRDcm9uLnN0YXJ0KCk7XG5cdH1cbn0pLCA1MDApO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG5cdE1ldGVvci5kZWZlcigoKSA9PiB7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQmFja2dyb3VuZF9TeW5jJywgYWRkQ3JvbkpvYik7XG5cdFx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0xEQVBfQmFja2dyb3VuZF9TeW5jX0ludGVydmFsJywgYWRkQ3JvbkpvYik7XG5cdH0pO1xufSk7XG4iLCJpbXBvcnQge2ltcG9ydE5ld1VzZXJzfSBmcm9tICcuL3N5bmMnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGxkYXBfc3luY19ub3coKSB7XG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsZGFwX3N5bmNfdXNlcnMnIH0pO1xuXHRcdH1cblxuXHRcdGlmICghUm9ja2V0Q2hhdC5hdXRoei5oYXNSb2xlKHVzZXIuX2lkLCAnYWRtaW4nKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3Itbm90LWF1dGhvcml6ZWQnLCAnTm90IGF1dGhvcml6ZWQnLCB7IG1ldGhvZDogJ2xkYXBfc3luY191c2VycycgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdMREFQX0VuYWJsZScpICE9PSB0cnVlKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdMREFQX2Rpc2FibGVkJyk7XG5cdFx0fVxuXG5cdFx0dGhpcy51bmJsb2NrKCk7XG5cblx0XHRpbXBvcnROZXdVc2VycygpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdG1lc3NhZ2U6ICdTeW5jX2luX3Byb2dyZXNzJyxcblx0XHRcdHBhcmFtczogW11cblx0XHR9O1xuXHR9XG59KTtcbiIsImltcG9ydCBMREFQIGZyb20gJy4vbGRhcCc7XG5cbk1ldGVvci5tZXRob2RzKHtcblx0bGRhcF90ZXN0X2Nvbm5lY3Rpb24oKSB7XG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdsZGFwX3Rlc3RfY29ubmVjdGlvbicgfSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1JvbGUodXNlci5faWQsICdhZG1pbicpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1ub3QtYXV0aG9yaXplZCcsICdOb3QgYXV0aG9yaXplZCcsIHsgbWV0aG9kOiAnbGRhcF90ZXN0X2Nvbm5lY3Rpb24nIH0pO1xuXHRcdH1cblxuXHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTERBUF9FbmFibGUnKSAhPT0gdHJ1ZSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignTERBUF9kaXNhYmxlZCcpO1xuXHRcdH1cblxuXHRcdGxldCBsZGFwO1xuXHRcdHRyeSB7XG5cdFx0XHRsZGFwID0gbmV3IExEQVAoKTtcblx0XHRcdGxkYXAuY29ubmVjdFN5bmMoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5tZXNzYWdlKTtcblx0XHR9XG5cblx0XHR0cnkge1xuXHRcdFx0bGRhcC5iaW5kSWZOZWNlc3NhcnkoKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihlcnJvci5uYW1lIHx8IGVycm9yLm1lc3NhZ2UpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRtZXNzYWdlOiAnQ29ubmVjdGlvbl9zdWNjZXNzJyxcblx0XHRcdHBhcmFtczogW11cblx0XHR9O1xuXHR9XG59KTtcbiJdfQ==
