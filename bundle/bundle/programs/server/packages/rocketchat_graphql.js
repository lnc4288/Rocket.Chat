(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ECMAScript = Package.ecmascript.ECMAScript;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var exports;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:graphql":{"server":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/settings.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('General', function () {
  this.section('GraphQL API', function () {
    this.add('Graphql_Enabled', false, {
      type: 'boolean',
      public: false
    });
    this.add('Graphql_CORS', true, {
      type: 'boolean',
      public: false,
      enableQuery: {
        _id: 'Graphql_Enabled',
        value: true
      }
    });
    this.add('Graphql_Subscription_Port', 3100, {
      type: 'int',
      public: false,
      enableQuery: {
        _id: 'Graphql_Enabled',
        value: true
      }
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/api.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let graphqlExpress, graphiqlExpress;
module.watch(require("apollo-server-express"), {
  graphqlExpress(v) {
    graphqlExpress = v;
  },

  graphiqlExpress(v) {
    graphiqlExpress = v;
  }

}, 0);
let jsAccountsContext;
module.watch(require("@accounts/graphql-api"), {
  JSAccountsContext(v) {
    jsAccountsContext = v;
  }

}, 1);
let SubscriptionServer;
module.watch(require("subscriptions-transport-ws"), {
  SubscriptionServer(v) {
    SubscriptionServer = v;
  }

}, 2);
let execute, subscribe;
module.watch(require("graphql"), {
  execute(v) {
    execute = v;
  },

  subscribe(v) {
    subscribe = v;
  }

}, 3);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 4);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 5);
let bodyParser;
module.watch(require("body-parser"), {
  default(v) {
    bodyParser = v;
  }

}, 6);
let express;
module.watch(require("express"), {
  default(v) {
    express = v;
  }

}, 7);
let cors;
module.watch(require("cors"), {
  default(v) {
    cors = v;
  }

}, 8);
let executableSchema;
module.watch(require("./schema"), {
  executableSchema(v) {
    executableSchema = v;
  }

}, 9);
const subscriptionPort = RocketChat.settings.get('Graphql_Subscription_Port') || 3100; // the Meteor GraphQL server is an Express server

const graphQLServer = express();

if (RocketChat.settings.get('Graphql_CORS')) {
  graphQLServer.use(cors());
}

graphQLServer.use('/api/graphql', (req, res, next) => {
  if (RocketChat.settings.get('Graphql_Enabled')) {
    next();
  } else {
    res.status(400).send('Graphql is not enabled in this server');
  }
});
graphQLServer.use('/api/graphql', bodyParser.json(), graphqlExpress(request => {
  return {
    schema: executableSchema,
    context: jsAccountsContext(request),
    formatError: e => ({
      message: e.message,
      locations: e.locations,
      path: e.path
    }),
    debug: Meteor.isDevelopment
  };
}));
graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/api/graphql',
  subscriptionsEndpoint: `ws://localhost:${subscriptionPort}`
}));

const startSubscriptionServer = () => {
  if (RocketChat.settings.get('Graphql_Enabled')) {
    SubscriptionServer.create({
      schema: executableSchema,
      execute,
      subscribe,
      onConnect: connectionParams => ({
        authToken: connectionParams.Authorization
      })
    }, {
      port: subscriptionPort,
      host: process.env.BIND_IP || '0.0.0.0'
    });
    console.log('GraphQL Subscription server runs on port:', subscriptionPort);
  }
};

WebApp.onListening(() => {
  startSubscriptionServer();
}); // this binds the specified paths to the Express server running Apollo + GraphiQL

WebApp.connectHandlers.use(graphQLServer);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"schema.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schema.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  executableSchema: () => executableSchema
});
let makeExecutableSchema;
module.watch(require("graphql-tools"), {
  makeExecutableSchema(v) {
    makeExecutableSchema = v;
  }

}, 0);
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 1);
let channels;
module.watch(require("./resolvers/channels"), {
  "*"(v) {
    channels = v;
  }

}, 2);
let messages;
module.watch(require("./resolvers/messages"), {
  "*"(v) {
    messages = v;
  }

}, 3);
let accounts;
module.watch(require("./resolvers/accounts"), {
  "*"(v) {
    accounts = v;
  }

}, 4);
let users;
module.watch(require("./resolvers/users"), {
  "*"(v) {
    users = v;
  }

}, 5);
const schema = mergeTypes([channels.schema, messages.schema, accounts.schema, users.schema]);
const resolvers = mergeResolvers([channels.resolvers, messages.resolvers, accounts.resolvers, users.resolvers]);
const executableSchema = makeExecutableSchema({
  typeDefs: [schema],
  resolvers,
  logger: {
    log: e => console.log(e)
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"subscriptions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/subscriptions.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  pubsub: () => pubsub
});
let PubSub;
module.watch(require("graphql-subscriptions"), {
  PubSub(v) {
    PubSub = v;
  }

}, 0);
const pubsub = new PubSub();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"authenticated.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/helpers/authenticated.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  authenticated: () => authenticated
});
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 0);

let _authenticated;

module.watch(require("../mocks/accounts/graphql-api"), {
  authenticated(v) {
    _authenticated = v;
  }

}, 1);

const authenticated = resolver => {
  return _authenticated(AccountsServer, resolver);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dateToFloat.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/helpers/dateToFloat.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  dateToFloat: () => dateToFloat
});

function dateToFloat(date) {
  if (date) {
    return new Date(date).getTime();
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"mocks":{"accounts":{"graphql-api.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/mocks/accounts/graphql-api.js                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  authenticated: () => authenticated
});

const authenticated = (Accounts, func) => (root, args, context, info) => Promise.asyncApply(() => {
  const authToken = context.authToken;

  if (!authToken || authToken === '' || authToken === null) {
    throw new Error('Unable to find authorization token in request');
  }

  const userObject = Promise.await(Accounts.resumeSession(authToken));

  if (userObject === null) {
    throw new Error('Invalid or expired token!');
  }

  return Promise.await(func(root, args, Object.assign(context, {
    user: userObject
  }), info));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"resolvers":{"accounts":{"OauthProvider-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/OauthProvider-type.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/accounts/OauthProvider-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let createJSAccountsGraphQL;
module.watch(require("@accounts/graphql-api"), {
  createJSAccountsGraphQL(v) {
    createJSAccountsGraphQL = v;
  }

}, 0);
let AccountsServer;
module.watch(require("meteor/rocketchat:accounts"), {
  AccountsServer(v) {
    AccountsServer = v;
  }

}, 1);
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 2);
let oauthProviders;
module.watch(require("./oauthProviders"), {
  "*"(v) {
    oauthProviders = v;
  }

}, 3);
let OauthProviderType;
module.watch(require("./OauthProvider-type"), {
  "*"(v) {
    OauthProviderType = v;
  }

}, 4);
const accountsGraphQL = createJSAccountsGraphQL(AccountsServer);
const schema = mergeTypes([accountsGraphQL.schema, oauthProviders.schema, OauthProviderType.schema]);
const resolvers = mergeResolvers([accountsGraphQL.extendWithResolvers({}), oauthProviders.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/accounts/oauthProviders.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let HTTP;
module.watch(require("meteor/http"), {
  HTTP(v) {
    HTTP = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/accounts/oauthProviders.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);

function isJSON(obj) {
  try {
    JSON.parse(obj);
    return true;
  } catch (e) {
    return false;
  }
}

const resolver = {
  Query: {
    oauthProviders: () => Promise.asyncApply(() => {
      // depends on rocketchat:grant package
      try {
        const result = HTTP.get(Meteor.absoluteUrl('_oauth_apps/providers')).content;

        if (isJSON(result)) {
          const providers = JSON.parse(result).data;
          return providers.map(name => ({
            name
          }));
        } else {
          throw new Error('Could not parse the result');
        }
      } catch (e) {
        throw new Error('rocketchat:grant not installed');
      }
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"channels":{"Channel-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/Channel-type.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/channels/Channel-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Channel: {
    id: property('_id'),
    name: (root, args, {
      user
    }) => {
      if (root.t === 'd') {
        return root.usernames.find(u => u !== user.username);
      }

      return root.name;
    },
    members: root => {
      return root.usernames.map(username => RocketChat.models.Users.findOneByUsername(username));
    },
    owners: root => {
      // there might be no owner
      if (!root.u) {
        return;
      }

      return [RocketChat.models.Users.findOneByUsername(root.u.username)];
    },
    numberOfMembers: root => (root.usernames || []).length,
    numberOfMessages: property('msgs'),
    readOnly: root => root.ro === true,
    direct: root => root.t === 'd',
    privateChannel: root => root.t === 'p',
    favourite: (root, args, {
      user
    }) => {
      const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);
      return room && room.f === true;
    },
    unseenMessages: (root, args, {
      user
    }) => {
      const room = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(root._id, user._id);
      return (room || {}).unread;
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelFilter-input.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelFilter-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelNameAndDirect-input.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelNameAndDirect-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/ChannelSort-enum.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/ChannelSort-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/Privacy-enum.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/channels/Privacy-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channelByName.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channelByName.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channelByName: authenticated((root, {
      name
    }) => {
      const query = {
        name,
        t: 'c'
      };
      return RocketChat.models.Rooms.findOne(query, {
        fields: roomPublicFields
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channels.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channels.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channels: authenticated((root, args) => {
      const query = {};
      const options = {
        sort: {
          name: 1
        },
        fields: roomPublicFields
      }; // Filter

      if (typeof args.filter !== 'undefined') {
        // nameFilter
        if (typeof args.filter.nameFilter !== undefined) {
          query.name = {
            $regex: new RegExp(args.filter.nameFilter, 'i')
          };
        } // sortBy


        if (args.filter.sortBy === 'NUMBER_OF_MESSAGES') {
          options.sort = {
            msgs: -1
          };
        } // privacy


        switch (args.filter.privacy) {
          case 'PRIVATE':
            query.t = 'p';
            break;

          case 'PUBLIC':
            query.t = {
              $ne: 'p'
            };
            break;
        }
      }

      return RocketChat.models.Rooms.find(query, options).fetch();
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/channelsByUser.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/channelsByUser.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    channelsByUser: authenticated((root, {
      userId
    }) => {
      const user = RocketChat.models.Users.findOneById(userId);

      if (!user) {
        throw new Error('No user');
      }

      const rooms = RocketChat.models.Rooms.findByContainingUsername(user.username, {
        sort: {
          name: 1
        },
        fields: roomPublicFields
      }).fetch();
      return rooms;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/createChannel.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/channels/createChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Mutation: {
    createChannel: authenticated((root, args, {
      user
    }) => {
      try {
        RocketChat.API.channels.create.validate({
          user: {
            value: user._id
          },
          name: {
            value: args.name,
            key: 'name'
          },
          members: {
            value: args.membersId,
            key: 'membersId'
          }
        });
      } catch (e) {
        throw e;
      }

      const {
        channel
      } = RocketChat.API.channels.create.execute(user._id, {
        name: args.name,
        members: args.membersId
      });
      return channel;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/directChannel.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let roomPublicFields;
module.watch(require("./settings"), {
  roomPublicFields(v) {
    roomPublicFields = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/directChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Query: {
    directChannel: authenticated((root, {
      username,
      channelId
    }, {
      user
    }) => {
      const query = {
        t: 'd',
        usernames: user.username
      };

      if (typeof username !== 'undefined') {
        if (username === user.username) {
          throw new Error('You cannot specify your username');
        }

        query.usernames = {
          $all: [user.username, username]
        };
      } else if (typeof channelId !== 'undefined') {
        query.id = channelId;
      } else {
        throw new Error('Use one of those fields: username, channelId');
      }

      return RocketChat.models.Rooms.findOne(query, {
        fields: roomPublicFields
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/hideChannel.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/hideChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    hideChannel: authenticated((root, args, {
      user
    }) => {
      const channel = RocketChat.models.Rooms.findOne({
        _id: args.channelId,
        t: 'c'
      });

      if (!channel) {
        throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
      }

      const sub = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(channel._id, user._id);

      if (!sub) {
        throw new Error(`The user/callee is not in the channel "${channel.name}.`);
      }

      if (!sub.open) {
        throw new Error(`The channel, ${channel.name}, is already closed to the sender`);
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('hideRoom', channel._id);
      });
      return true;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let channels;
module.watch(require("./channels"), {
  "*"(v) {
    channels = v;
  }

}, 1);
let channelByName;
module.watch(require("./channelByName"), {
  "*"(v) {
    channelByName = v;
  }

}, 2);
let directChannel;
module.watch(require("./directChannel"), {
  "*"(v) {
    directChannel = v;
  }

}, 3);
let channelsByUser;
module.watch(require("./channelsByUser"), {
  "*"(v) {
    channelsByUser = v;
  }

}, 4);
let createChannel;
module.watch(require("./createChannel"), {
  "*"(v) {
    createChannel = v;
  }

}, 5);
let leaveChannel;
module.watch(require("./leaveChannel"), {
  "*"(v) {
    leaveChannel = v;
  }

}, 6);
let hideChannel;
module.watch(require("./hideChannel"), {
  "*"(v) {
    hideChannel = v;
  }

}, 7);
let ChannelType;
module.watch(require("./Channel-type"), {
  "*"(v) {
    ChannelType = v;
  }

}, 8);
let ChannelSort;
module.watch(require("./ChannelSort-enum"), {
  "*"(v) {
    ChannelSort = v;
  }

}, 9);
let ChannelFilter;
module.watch(require("./ChannelFilter-input"), {
  "*"(v) {
    ChannelFilter = v;
  }

}, 10);
let Privacy;
module.watch(require("./Privacy-enum"), {
  "*"(v) {
    Privacy = v;
  }

}, 11);
let ChannelNameAndDirect;
module.watch(require("./ChannelNameAndDirect-input"), {
  "*"(v) {
    ChannelNameAndDirect = v;
  }

}, 12);
const schema = mergeTypes([// queries
channels.schema, channelByName.schema, directChannel.schema, channelsByUser.schema, // mutations
createChannel.schema, leaveChannel.schema, hideChannel.schema, // types
ChannelType.schema, ChannelSort.schema, ChannelFilter.schema, Privacy.schema, ChannelNameAndDirect.schema]);
const resolvers = mergeResolvers([// queries
channels.resolver, channelByName.resolver, directChannel.resolver, channelsByUser.resolver, // mutations
createChannel.resolver, leaveChannel.resolver, hideChannel.resolver, // types
ChannelType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/leaveChannel.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/channels/leaveChannel.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    leaveChannel: authenticated((root, args, {
      user
    }) => {
      const channel = RocketChat.models.Rooms.findOne({
        _id: args.channelId,
        t: 'c'
      });

      if (!channel) {
        throw new Error('error-room-not-found', 'The required "channelId" param provided does not match any channel');
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('leaveRoom', channel._id);
      });
      return true;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"settings.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/channels/settings.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  roomPublicFields: () => roomPublicFields
});
const roomPublicFields = {
  t: 1,
  name: 1,
  description: 1,
  announcement: 1,
  topic: 1,
  usernames: 1,
  msgs: 1,
  ro: 1,
  u: 1,
  archived: 1
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"messages":{"Message-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/Message-type.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let dateToFloat;
module.watch(require("../../helpers/dateToFloat"), {
  dateToFloat(v) {
    dateToFloat = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/Message-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Message: {
    id: property('_id'),
    content: property('msg'),
    creationTime: root => dateToFloat(root.ts),
    author: root => {
      const user = RocketChat.models.Users.findOne(root.u._id);
      return user || root.u;
    },
    channel: root => {
      return RocketChat.models.Rooms.findOne(root.rid);
    },
    fromServer: root => typeof root.t !== 'undefined',
    // on a message sent by user `true` otherwise `false`
    type: property('t'),
    channelRef: root => {
      if (!root.channels) {
        return;
      }

      return RocketChat.models.Rooms.find({
        _id: {
          $in: root.channels.map(c => c._id)
        }
      }, {
        sort: {
          name: 1
        }
      }).fetch();
    },
    userRef: root => {
      if (!root.mentions) {
        return;
      }

      return RocketChat.models.Users.find({
        _id: {
          $in: root.mentions.map(c => c._id)
        }
      }, {
        sort: {
          username: 1
        }
      }).fetch();
    },
    reactions: root => {
      if (!root.reactions || Object.keys(root.reactions).length === 0) {
        return;
      }

      const reactions = [];
      Object.keys(root.reactions).forEach(icon => {
        root.reactions[icon].usernames.forEach(username => {
          reactions.push({
            icon,
            username
          });
        });
      });
      return reactions;
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/MessageIdentifier-input.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/MessageIdentifier-input.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/MessagesWithCursor-type.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/MessagesWithCursor-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/Reaction-type.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/messages/Reaction-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/addReactionToMessage.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/addReactionToMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    addReactionToMessage: authenticated((root, {
      id,
      icon
    }, {
      user
    }) => {
      return new Promise(resolve => {
        Meteor.runAsUser(user._id, () => {
          Meteor.call('setReaction', id.messageId, icon, () => {
            resolve(RocketChat.models.Messages.findOne(id.messageId));
          });
        });
      });
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/chatMessageAdded.js                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  CHAT_MESSAGE_SUBSCRIPTION_TOPIC: () => CHAT_MESSAGE_SUBSCRIPTION_TOPIC,
  publishMessage: () => publishMessage,
  schema: () => schema,
  resolver: () => resolver
});
let withFilter;
module.watch(require("graphql-subscriptions"), {
  withFilter(v) {
    withFilter = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let pubsub;
module.watch(require("../../subscriptions"), {
  pubsub(v) {
    pubsub = v;
  }

}, 2);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 3);
let schema;
module.watch(require("../../schemas/messages/chatMessageAdded.graphqls"), {
  default(v) {
    schema = v;
  }

}, 4);
const CHAT_MESSAGE_SUBSCRIPTION_TOPIC = 'CHAT_MESSAGE_ADDED';

function publishMessage(message) {
  pubsub.publish(CHAT_MESSAGE_SUBSCRIPTION_TOPIC, {
    chatMessageAdded: message
  });
}

function shouldPublish(message, {
  id,
  directTo
}, username) {
  if (id) {
    return message.rid === id;
  } else if (directTo) {
    const room = RocketChat.models.Rooms.findOne({
      usernames: {
        $all: [directTo, username]
      },
      t: 'd'
    });
    return room && room._id === message.rid;
  }

  return false;
}

const resolver = {
  Subscription: {
    chatMessageAdded: {
      subscribe: withFilter(() => pubsub.asyncIterator(CHAT_MESSAGE_SUBSCRIPTION_TOPIC), authenticated((payload, args, {
        user
      }) => {
        const channel = {
          id: args.channelId,
          directTo: args.directTo
        };
        return shouldPublish(payload.chatMessageAdded, channel, user.username);
      }))
    }
  }
};
RocketChat.callbacks.add('afterSaveMessage', message => {
  publishMessage(message);
}, null, 'chatMessageAddedSubscription');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/deleteMessage.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/deleteMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    deleteMessage: authenticated((root, {
      id
    }, {
      user
    }) => {
      const msg = RocketChat.models.Messages.findOneById(id.messageId, {
        fields: {
          u: 1,
          rid: 1
        }
      });

      if (!msg) {
        throw new Error(`No message found with the id of "${id.messageId}".`);
      }

      if (id.channelId !== msg.rid) {
        throw new Error('The room id provided does not match where the message is from.');
      }

      Meteor.runAsUser(user._id, () => {
        Meteor.call('deleteMessage', {
          _id: msg._id
        });
      });
      return msg;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/editMessage.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 1);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 2);
let schema;
module.watch(require("../../schemas/messages/editMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 3);
const resolver = {
  Mutation: {
    editMessage: authenticated((root, {
      id,
      content
    }, {
      user
    }) => {
      const msg = RocketChat.models.Messages.findOneById(id.messageId); //Ensure the message exists

      if (!msg) {
        throw new Error(`No message found with the id of "${id.messageId}".`);
      }

      if (id.channelId !== msg.rid) {
        throw new Error('The channel id provided does not match where the message is from.');
      } //Permission checks are already done in the updateMessage method, so no need to duplicate them


      Meteor.runAsUser(user._id, () => {
        Meteor.call('updateMessage', {
          _id: msg._id,
          msg: content,
          rid: msg.rid
        });
      });
      return RocketChat.models.Messages.findOneById(msg._id);
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/index.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let messages;
module.watch(require("./messages"), {
  "*"(v) {
    messages = v;
  }

}, 1);
let sendMessage;
module.watch(require("./sendMessage"), {
  "*"(v) {
    sendMessage = v;
  }

}, 2);
let editMessage;
module.watch(require("./editMessage"), {
  "*"(v) {
    editMessage = v;
  }

}, 3);
let deleteMessage;
module.watch(require("./deleteMessage"), {
  "*"(v) {
    deleteMessage = v;
  }

}, 4);
let addReactionToMessage;
module.watch(require("./addReactionToMessage"), {
  "*"(v) {
    addReactionToMessage = v;
  }

}, 5);
let chatMessageAdded;
module.watch(require("./chatMessageAdded"), {
  "*"(v) {
    chatMessageAdded = v;
  }

}, 6);
let MessageType;
module.watch(require("./Message-type"), {
  "*"(v) {
    MessageType = v;
  }

}, 7);
let MessagesWithCursorType;
module.watch(require("./MessagesWithCursor-type"), {
  "*"(v) {
    MessagesWithCursorType = v;
  }

}, 8);
let MessageIdentifier;
module.watch(require("./MessageIdentifier-input"), {
  "*"(v) {
    MessageIdentifier = v;
  }

}, 9);
let ReactionType;
module.watch(require("./Reaction-type"), {
  "*"(v) {
    ReactionType = v;
  }

}, 10);
const schema = mergeTypes([// queries
messages.schema, // mutations
sendMessage.schema, editMessage.schema, deleteMessage.schema, addReactionToMessage.schema, // subscriptions
chatMessageAdded.schema, // types
MessageType.schema, MessagesWithCursorType.schema, MessageIdentifier.schema, ReactionType.schema]);
const resolvers = mergeResolvers([// queries
messages.resolver, // mutations
sendMessage.resolver, editMessage.resolver, deleteMessage.resolver, addReactionToMessage.resolver, // subscriptions
chatMessageAdded.resolver, // types
MessageType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/messages.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/messages/messages.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Query: {
    messages: authenticated((root, args, {
      user
    }) => {
      const messagesQuery = {};
      const messagesOptions = {
        sort: {
          ts: -1
        }
      };
      const channelQuery = {};
      const isPagination = !!args.cursor || args.count > 0;
      let cursor;

      if (args.channelId) {
        // channelId
        channelQuery._id = args.channelId;
      } else if (args.directTo) {
        // direct message where directTo is a user id
        channelQuery.t = 'd';
        channelQuery.usernames = {
          $all: [args.directTo, user.username]
        };
      } else if (args.channelName) {
        // non-direct channel
        channelQuery.t = {
          $ne: 'd'
        };
        channelQuery.name = args.channelName;
      } else {
        console.error('messages query must be called with channelId or directTo');
        return null;
      }

      const channel = RocketChat.models.Rooms.findOne(channelQuery);
      let messagesArray = [];

      if (channel) {
        // cursor
        if (isPagination && args.cursor) {
          const cursorMsg = RocketChat.models.Messages.findOne(args.cursor, {
            fields: {
              ts: 1
            }
          });
          messagesQuery.ts = {
            $lt: cursorMsg.ts
          };
        } // search


        if (typeof args.searchRegex === 'string') {
          messagesQuery.msg = {
            $regex: new RegExp(args.searchRegex, 'i')
          };
        } // count


        if (isPagination && args.count) {
          messagesOptions.limit = args.count;
        } // exclude messages generated by server


        if (args.excludeServer === true) {
          messagesQuery.t = {
            $exists: false
          };
        } // look for messages that belongs to specific channel


        messagesQuery.rid = channel._id;
        const messages = RocketChat.models.Messages.find(messagesQuery, messagesOptions);
        messagesArray = messages.fetch();

        if (isPagination) {
          // oldest first (because of findOne)
          messagesOptions.sort.ts = 1;
          const firstMessage = RocketChat.models.Messages.findOne(messagesQuery, messagesOptions);
          const lastId = (messagesArray[messagesArray.length - 1] || {})._id;
          cursor = !lastId || lastId === firstMessage._id ? null : lastId;
        }
      }

      return {
        cursor,
        channel,
        messagesArray
      };
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/messages/sendMessage.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 0);
let schema;
module.watch(require("../../schemas/messages/sendMessage.graphqls"), {
  default(v) {
    schema = v;
  }

}, 1);
const resolver = {
  Mutation: {
    sendMessage: authenticated((root, {
      channelId,
      directTo,
      content
    }, {
      user
    }) => {
      const options = {
        text: content,
        channel: channelId || directTo
      };
      const messageReturn = processWebhookMessage(options, user)[0];

      if (!messageReturn) {
        throw new Error('Unknown error');
      }

      return messageReturn.message;
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"User-type.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/User-type.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let property;
module.watch(require("lodash.property"), {
  default(v) {
    property = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/users/User-type.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  User: {
    id: property('_id'),
    status: ({
      status
    }) => status.toUpperCase(),
    avatar: ({
      _id
    }) => Promise.asyncApply(() => {
      // XXX js-accounts/graphql#16
      const avatar = Promise.await(RocketChat.models.Avatars.model.rawCollection().findOne({
        userId: _id
      }, {
        fields: {
          url: 1
        }
      }));

      if (avatar) {
        return avatar.url;
      }
    }),
    channels: Meteor.bindEnvironment(({
      _id
    }) => Promise.asyncApply(() => {
      return Promise.await(RocketChat.models.Rooms.findBySubscriptionUserId(_id).fetch());
    })),
    directMessages: ({
      username
    }) => {
      return RocketChat.models.Rooms.findByTypeContainingUsername('d', username).fetch();
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/UserStatus-enum.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema
});
let schema;
module.watch(require("../../schemas/users/UserStatus-enum.graphqls"), {
  default(v) {
    schema = v;
  }

}, 0);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/index.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolvers: () => resolvers
});
let mergeTypes, mergeResolvers;
module.watch(require("merge-graphql-schemas"), {
  mergeTypes(v) {
    mergeTypes = v;
  },

  mergeResolvers(v) {
    mergeResolvers = v;
  }

}, 0);
let setStatus;
module.watch(require("./setStatus"), {
  "*"(v) {
    setStatus = v;
  }

}, 1);
let UserType;
module.watch(require("./User-type"), {
  "*"(v) {
    UserType = v;
  }

}, 2);
let UserStatus;
module.watch(require("./UserStatus-enum"), {
  "*"(v) {
    UserStatus = v;
  }

}, 3);
const schema = mergeTypes([// mutations
setStatus.schema, // types
UserType.schema, UserStatus.schema]);
const resolvers = mergeResolvers([// mutations
setStatus.resolver, // types
UserType.resolver]);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/resolvers/users/setStatus.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  schema: () => schema,
  resolver: () => resolver
});
let RocketChat;
module.watch(require("meteor/rocketchat:lib"), {
  RocketChat(v) {
    RocketChat = v;
  }

}, 0);
let authenticated;
module.watch(require("../../helpers/authenticated"), {
  authenticated(v) {
    authenticated = v;
  }

}, 1);
let schema;
module.watch(require("../../schemas/users/setStatus.graphqls"), {
  default(v) {
    schema = v;
  }

}, 2);
const resolver = {
  Mutation: {
    setStatus: authenticated((root, {
      status
    }, {
      user
    }) => {
      RocketChat.models.Users.update(user._id, {
        $set: {
          status: status.toLowerCase()
        }
      });
      return RocketChat.models.Users.findOne(user._id);
    })
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"schemas":{"accounts":{"OauthProvider-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/accounts/OauthProvider-type.graphqls                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./OauthProvider-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"OauthProvider-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/accounts/OauthProvider-type.graphqls.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"OauthProvider"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]}]}],"loc":{"start":0,"end":39}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/accounts/oauthProviders.graphqls                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./oauthProviders.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oauthProviders.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/accounts/oauthProviders.graphqls.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"oauthProviders"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OauthProvider"}}},"directives":[]}]}],"loc":{"start":0,"end":49}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"channels":{"Channel-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/Channel-type.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Channel-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Channel-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/Channel-type.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Channel"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"id"},"arguments":[],"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"description"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"announcement"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"topic"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"members"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"owners"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"numberOfMembers"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"numberOfMessages"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"readOnly"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"direct"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"privateChannel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"favourite"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"unseenMessages"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}]}],"loc":{"start":0,"end":283}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelFilter-input.graphqls                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelFilter-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelFilter-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelFilter-input.graphqls.js                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"ChannelFilter"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"nameFilter"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"privacy"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Privacy"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"joinedChannels"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"sortBy"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelSort"}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":108}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelNameAndDirect-input.graphqls                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelNameAndDirect-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelNameAndDirect-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelNameAndDirect-input.graphqls.js                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"ChannelNameAndDirect"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"direct"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":64}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/ChannelSort-enum.graphqls                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./ChannelSort-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ChannelSort-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/ChannelSort-enum.graphqls.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"ChannelSort"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"NAME"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"NUMBER_OF_MESSAGES"},"directives":[]}]}],"loc":{"start":0,"end":47}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/Privacy-enum.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Privacy-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Privacy-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/Privacy-enum.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"Privacy"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"PRIVATE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"PUBLIC"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"ALL"},"directives":[]}]}],"loc":{"start":0,"end":39}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channelByName.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channelByName.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelByName.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channelByName.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelByName"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":54}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channels.graphqls                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channels.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channels.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channels.graphqls.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channels"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"filter"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChannelFilter"}},"defaultValue":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"privacy"},"value":{"kind":"EnumValue","value":"ALL"}},{"kind":"ObjectField","name":{"kind":"Name","value":"joinedChannels"},"value":{"kind":"BooleanValue","value":false}},{"kind":"ObjectField","name":{"kind":"Name","value":"sortBy"},"value":{"kind":"EnumValue","value":"NAME"}}]},"directives":[]}],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}],"loc":{"start":0,"end":122}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/channelsByUser.graphqls                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./channelsByUser.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"channelsByUser.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/channelsByUser.graphqls.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelsByUser"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"userId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}],"loc":{"start":0,"end":59}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/createChannel.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./createChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"createChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/createChannel.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"createChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"private"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false},"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"readOnly"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":{"kind":"BooleanValue","value":false},"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"membersId"},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":143}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/directChannel.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./directChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"directChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/directChannel.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"directChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"username"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]}]}],"loc":{"start":0,"end":76}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/hideChannel.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./hideChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hideChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/hideChannel.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"hideChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}]}],"loc":{"start":0,"end":60}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/channels/leaveChannel.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./leaveChannel.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"leaveChannel.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/channels/leaveChannel.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"leaveChannel"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]}]}],"loc":{"start":0,"end":61}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"messages":{"Message-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/Message-type.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Message-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Message-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/Message-type.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Message"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"id"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"author"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"content"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"creationTime"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"fromServer"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"type"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"userRef"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channelRef"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"reactions"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Reaction"}}},"directives":[]}]}],"loc":{"start":0,"end":305}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/MessageIdentifier-input.graphqls                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./MessageIdentifier-input.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessageIdentifier-input.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/MessageIdentifier-input.graphqls.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"InputObjectTypeDefinition","name":{"kind":"Name","value":"MessageIdentifier"},"directives":[],"fields":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"messageId"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}]}],"loc":{"start":0,"end":68}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/MessagesWithCursor-type.graphqls                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./MessagesWithCursor-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"MessagesWithCursor-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/MessagesWithCursor-type.graphqls.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"MessagesWithCursor"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"cursor"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channel"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"messagesArray"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}}},"directives":[]}]}],"loc":{"start":0,"end":88}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/Reaction-type.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./Reaction-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Reaction-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/Reaction-type.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Reaction"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"username"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"icon"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}]}],"loc":{"start":0,"end":50}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/addReactionToMessage.graphqls                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./addReactionToMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"addReactionToMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/addReactionToMessage.graphqls.js                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"addReactionToMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"icon"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":88}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/chatMessageAdded.graphqls                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./chatMessageAdded.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"chatMessageAdded.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/chatMessageAdded.graphqls.js                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Subscription"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"chatMessageAdded"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":87}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/deleteMessage.graphqls                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./deleteMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deleteMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/deleteMessage.graphqls.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"deleteMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":66}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/editMessage.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./editMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"editMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/editMessage.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"editMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"id"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MessageIdentifier"}}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"content"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":82}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/messages.graphqls                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./messages.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"messages.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/messages.graphqls.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"messages"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelName"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"cursor"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"count"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"searchRegex"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"excludeServer"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"MessagesWithCursor"}},"directives":[]}]}],"loc":{"start":0,"end":193}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/messages/sendMessage.graphqls                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./sendMessage.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sendMessage.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/messages/sendMessage.graphqls.js                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"sendMessage"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"channelId"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"directTo"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"defaultValue":null,"directives":[]},{"kind":"InputValueDefinition","name":{"kind":"Name","value":"content"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"Message"}},"directives":[]}]}],"loc":{"start":0,"end":95}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"users":{"User-type.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/User-type.graphqls                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./User-type.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"User-type.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/User-type.graphqls.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"TypeExtensionDefinition","definition":{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"User"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"status"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserStatus"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"avatar"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"lastLogin"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"channels"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]},{"kind":"FieldDefinition","name":{"kind":"Name","value":"directMessages"},"arguments":[],"type":{"kind":"ListType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Channel"}}},"directives":[]}]}}],"loc":{"start":0,"end":138}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/UserStatus-enum.graphqls                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./UserStatus-enum.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"UserStatus-enum.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/UserStatus-enum.graphqls.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"EnumTypeDefinition","name":{"kind":"Name","value":"UserStatus"},"directives":[],"values":[{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"ONLINE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"AWAY"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"BUSY"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"INVISIBLE"},"directives":[]},{"kind":"EnumValueDefinition","name":{"kind":"Name","value":"OFFLINE"},"directives":[]}]}],"loc":{"start":0,"end":60}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.graphqls":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/server/schemas/users/setStatus.graphqls                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.watch(require("./setStatus.graphqls.js"), {
  "*": module.makeNsSetter(true)
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setStatus.graphqls.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_graphql/server/schemas/users/setStatus.graphqls.js                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = {"kind":"Document","definitions":[{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"setStatus"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"status"},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserStatus"}}},"defaultValue":null,"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]}]}],"loc":{"start":0,"end":56}};

module.exports = doc;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"node_modules":{"apollo-server-express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/apollo-server-express/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "apollo-server-express";
exports.version = "1.1.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/apollo-server-express/dist/index.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var expressApollo_1 = require("./expressApollo");
exports.graphqlExpress = expressApollo_1.graphqlExpress;
exports.graphiqlExpress = expressApollo_1.graphiqlExpress;
var connectApollo_1 = require("./connectApollo");
exports.graphqlConnect = connectApollo_1.graphqlConnect;
exports.graphiqlConnect = connectApollo_1.graphiqlConnect;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"@accounts":{"graphql-api":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/@accounts/graphql-api/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "@accounts/graphql-api";
exports.version = "0.1.1";
exports.main = "lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/@accounts/graphql-api/lib/index.js                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("babel-runtime/helpers/asyncToGenerator"),require("babel-runtime/regenerator"),require("babel-runtime/core-js/object/assign"),require("babel-runtime/helpers/defineProperty"),require("babel-runtime/helpers/extends")):"function"==typeof define&&define.amd?define(["babel-runtime/helpers/asyncToGenerator","babel-runtime/regenerator","babel-runtime/core-js/object/assign","babel-runtime/helpers/defineProperty","babel-runtime/helpers/extends"],t):"object"==typeof exports?exports["@accounts/graphql-api"]=t(require("babel-runtime/helpers/asyncToGenerator"),require("babel-runtime/regenerator"),require("babel-runtime/core-js/object/assign"),require("babel-runtime/helpers/defineProperty"),require("babel-runtime/helpers/extends")):e["@accounts/graphql-api"]=t(e["babel-runtime/helpers/asyncToGenerator"],e["babel-runtime/regenerator"],e["babel-runtime/core-js/object/assign"],e["babel-runtime/helpers/defineProperty"],e["babel-runtime/helpers/extends"])}(this,function(e,t,r,n,u){return function(e){function t(n){if(r[n])return r[n].exports;var u=r[n]={exports:{},id:n,loaded:!1};return e[n].call(u.exports,u,u.exports,t),u.loaded=!0,u.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.JSAccountsContext=t.authenticated=t.createJSAccountsGraphQL=void 0;var n=r(19),u=r(3),o=r(20);t.createJSAccountsGraphQL=n.createJSAccountsGraphQL,t.authenticated=u.authenticated,t.JSAccountsContext=o.JSAccountsContext},function(e,t){e.exports=require("babel-runtime/helpers/asyncToGenerator")},function(e,t){e.exports=require("babel-runtime/regenerator")},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.authenticated=void 0;var u=r(2),o=n(u),a=r(4),s=n(a),i=r(1),c=n(i);t.authenticated=function(e,t){return function(){var r=(0,c.default)(o.default.mark(function r(n,u,a,i){var c,d;return o.default.wrap(function(r){for(;;)switch(r.prev=r.next){case 0:if(c=a.authToken,c&&""!==c&&null!==c){r.next=3;break}throw new Error("Unable to find authorization token in request");case 3:return r.next=5,e.resumeSession(c);case 5:if(d=r.sent,null!==d){r.next=8;break}throw new Error("Invalid or expired token!");case 8:return r.next=10,t(n,u,(0,s.default)(a,{user:d}),i);case 10:return r.abrupt("return",r.sent);case 11:case"end":return r.stop()}},r,void 0)}));return function(e,t,n,u){return r.apply(this,arguments)}}()}},function(e,t){e.exports=require("babel-runtime/core-js/object/assign")},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.mutations="\n  loginWithPassword(user: UserInput!, password: String!): LoginReturn\n  refreshTokens(accessToken: String!, refreshToken: String!): LoginReturn\n  logout(accessToken: String!): Boolean\n  impersonate(accessToken: String! username: String!): ImpersonateReturn\n  createUser(user: CreateUserInput!): Boolean\n  verifyEmail(token: String!): Boolean\n  resetPassword(token: String!, newPassword: PasswordInput!): Boolean\n  sendVerificationEmail(email: String!): Boolean\n  sendResetPasswordEmail(email: String!): Boolean\n"},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.queries="\n  me: User\n"},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.typeDefs="\n  type Tokens {\n    refreshToken: String\n    accessToken: String\n  }\n  \n  type LoginReturn {\n    sessionId: String\n    user: User\n    tokens: Tokens\n  }\n  \n  type ImpersonateReturn {\n    authorized: Boolean\n    tokens: Tokens\n    user: User\n  }\n\n  type User {\n    id: ID!\n    email: String\n    username: String\n  }\n  \n  input UserInput {\n    id: ID\n    email: String\n    username: String\n  }\n  \n  input CreateUserInput {\n    username: String\n    email: String\n    password: String\n    profile: CreateUserProfileInput\n  }\n  \n  type PasswordType {\n    digest: String\n    algorithm: String\n  }\n  \n  input PasswordInput {\n    digest: String\n    algorithm: String\n  }\n  \n  input CreateUserProfileInput {\n    name: String\n    firstName: String\n    lastName: String\n  }\n"},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.createUser=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.createUser=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.user;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.createUser(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.impersonate=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.impersonate=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken,a=n.username;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.impersonate(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.loginWithPassword=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.loginWithPassword=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.user,a=n.password;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.loginWithPassword(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.logout=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.logout=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.logout(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.me=void 0;var n=r(3);t.me=function(e){return(0,n.authenticated)(e,function(e,t,r){var n=r.user;return n})}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.refreshTokens=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.refreshTokens=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.accessToken,a=n.refreshToken;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.refreshTokens(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.resetPassword=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.resetPassword=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.token,a=n.newPassword;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.resetPassword(u,a);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.sendResetPasswordEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.sendResetPasswordEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.email;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.sendResetPasswordEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.sendVerificationEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.sendVerificationEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.email;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.sendVerificationEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.User={id:function(e){return e.id||e._id},email:function(e){return e.emails[0].address}}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.verifyEmail=void 0;var u=r(2),o=n(u),a=r(1),s=n(a);t.verifyEmail=function(e){return function(){var t=(0,s.default)(o.default.mark(function t(r,n){var u=n.token;return o.default.wrap(function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.verifyEmail(u);case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}},t,void 0)}));return function(e,r){return t.apply(this,arguments)}}()}},function(e,t,r){"use strict";function n(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.createJSAccountsGraphQL=void 0;var u=r(4),o=n(u),a=r(22),s=n(a),i=r(21),c=n(i),d=r(10),f=r(13),l=r(9),p=r(12),m=r(17),v=r(5),b=r(7),h=r(6),y=r(11),g=r(8),_=r(14),w=r(15),x=r(16),P=r(18);t.createJSAccountsGraphQL=function(e){var t,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{rootQueryName:"Query",rootMutationName:"Mutation",extend:!0,withSchemaDefinition:!1},n="\n  "+b.typeDefs+"\n\n  "+(r.extend?"extend ":"")+"type "+r.rootQueryName+" {\n    "+h.queries+"\n  }\n\n  "+(r.extend?"extend ":"")+"type "+r.rootMutationName+" {\n    "+v.mutations+"\n  }\n\n  "+(r.withSchemaDefinition?"schema {\n    query: "+r.rootMutationName+"\n    mutation: "+r.rootQueryName+"\n  }":"")+"\n  ",u=(t={User:m.User},(0,c.default)(t,r.rootMutationName,{loginWithPassword:(0,d.loginWithPassword)(e),refreshTokens:(0,f.refreshTokens)(e),logout:(0,y.logout)(e),impersonate:(0,l.impersonate)(e),createUser:(0,g.createUser)(e),resetPassword:(0,_.resetPassword)(e),sendResetPasswordEmail:(0,w.sendResetPasswordEmail)(e),sendVerificationEmail:(0,x.sendVerificationEmail)(e),verifyEmail:(0,P.verifyEmail)(e)}),(0,c.default)(t,r.rootQueryName,{me:(0,p.me)(e)}),t);return{schema:n,extendWithResolvers:function(e){var t;return(0,s.default)({},e,(t={},(0,c.default)(t,r.rootMutationName,(0,o.default)(e[r.rootMutationName]||{},u[r.rootMutationName])),(0,c.default)(t,r.rootQueryName,(0,o.default)(e[r.rootQueryName]||{},u[r.rootQueryName])),(0,c.default)(t,"User",(0,o.default)(e.User||{},u.User)),t))}}}},function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.JSAccountsContext=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"Authorization";return{authToken:e.headers[t]||e.headers[t.toLowerCase()]}}},function(e,t){e.exports=require("babel-runtime/helpers/defineProperty")},function(e,t){e.exports=require("babel-runtime/helpers/extends")}])});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"subscriptions-transport-ws":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/subscriptions-transport-ws/package.json                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "subscriptions-transport-ws";
exports.version = "0.8.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/subscriptions-transport-ws/dist/index.js                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./client"));
__export(require("./server"));
__export(require("./helpers"));
__export(require("./message-types"));
__export(require("./protocol"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"graphql":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql";
exports.version = "0.10.3";
exports.main = "index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('./graphql');

Object.defineProperty(exports, 'graphql', {
  enumerable: true,
  get: function get() {
    return _graphql.graphql;
  }
});

var _type = require('./type');

Object.defineProperty(exports, 'GraphQLSchema', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLSchema;
  }
});
Object.defineProperty(exports, 'GraphQLScalarType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLScalarType;
  }
});
Object.defineProperty(exports, 'GraphQLObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLInterfaceType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInterfaceType;
  }
});
Object.defineProperty(exports, 'GraphQLUnionType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLUnionType;
  }
});
Object.defineProperty(exports, 'GraphQLEnumType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLEnumType;
  }
});
Object.defineProperty(exports, 'GraphQLInputObjectType', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInputObjectType;
  }
});
Object.defineProperty(exports, 'GraphQLList', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLList;
  }
});
Object.defineProperty(exports, 'GraphQLNonNull', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLNonNull;
  }
});
Object.defineProperty(exports, 'GraphQLDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLDirective;
  }
});
Object.defineProperty(exports, 'TypeKind', {
  enumerable: true,
  get: function get() {
    return _type.TypeKind;
  }
});
Object.defineProperty(exports, 'DirectiveLocation', {
  enumerable: true,
  get: function get() {
    return _type.DirectiveLocation;
  }
});
Object.defineProperty(exports, 'GraphQLInt', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLInt;
  }
});
Object.defineProperty(exports, 'GraphQLFloat', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLFloat;
  }
});
Object.defineProperty(exports, 'GraphQLString', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLString;
  }
});
Object.defineProperty(exports, 'GraphQLBoolean', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLBoolean;
  }
});
Object.defineProperty(exports, 'GraphQLID', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLID;
  }
});
Object.defineProperty(exports, 'specifiedDirectives', {
  enumerable: true,
  get: function get() {
    return _type.specifiedDirectives;
  }
});
Object.defineProperty(exports, 'GraphQLIncludeDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLIncludeDirective;
  }
});
Object.defineProperty(exports, 'GraphQLSkipDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLSkipDirective;
  }
});
Object.defineProperty(exports, 'GraphQLDeprecatedDirective', {
  enumerable: true,
  get: function get() {
    return _type.GraphQLDeprecatedDirective;
  }
});
Object.defineProperty(exports, 'DEFAULT_DEPRECATION_REASON', {
  enumerable: true,
  get: function get() {
    return _type.DEFAULT_DEPRECATION_REASON;
  }
});
Object.defineProperty(exports, 'SchemaMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.SchemaMetaFieldDef;
  }
});
Object.defineProperty(exports, 'TypeMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.TypeMetaFieldDef;
  }
});
Object.defineProperty(exports, 'TypeNameMetaFieldDef', {
  enumerable: true,
  get: function get() {
    return _type.TypeNameMetaFieldDef;
  }
});
Object.defineProperty(exports, '__Schema', {
  enumerable: true,
  get: function get() {
    return _type.__Schema;
  }
});
Object.defineProperty(exports, '__Directive', {
  enumerable: true,
  get: function get() {
    return _type.__Directive;
  }
});
Object.defineProperty(exports, '__DirectiveLocation', {
  enumerable: true,
  get: function get() {
    return _type.__DirectiveLocation;
  }
});
Object.defineProperty(exports, '__Type', {
  enumerable: true,
  get: function get() {
    return _type.__Type;
  }
});
Object.defineProperty(exports, '__Field', {
  enumerable: true,
  get: function get() {
    return _type.__Field;
  }
});
Object.defineProperty(exports, '__InputValue', {
  enumerable: true,
  get: function get() {
    return _type.__InputValue;
  }
});
Object.defineProperty(exports, '__EnumValue', {
  enumerable: true,
  get: function get() {
    return _type.__EnumValue;
  }
});
Object.defineProperty(exports, '__TypeKind', {
  enumerable: true,
  get: function get() {
    return _type.__TypeKind;
  }
});
Object.defineProperty(exports, 'isType', {
  enumerable: true,
  get: function get() {
    return _type.isType;
  }
});
Object.defineProperty(exports, 'isInputType', {
  enumerable: true,
  get: function get() {
    return _type.isInputType;
  }
});
Object.defineProperty(exports, 'isOutputType', {
  enumerable: true,
  get: function get() {
    return _type.isOutputType;
  }
});
Object.defineProperty(exports, 'isLeafType', {
  enumerable: true,
  get: function get() {
    return _type.isLeafType;
  }
});
Object.defineProperty(exports, 'isCompositeType', {
  enumerable: true,
  get: function get() {
    return _type.isCompositeType;
  }
});
Object.defineProperty(exports, 'isAbstractType', {
  enumerable: true,
  get: function get() {
    return _type.isAbstractType;
  }
});
Object.defineProperty(exports, 'isNamedType', {
  enumerable: true,
  get: function get() {
    return _type.isNamedType;
  }
});
Object.defineProperty(exports, 'assertType', {
  enumerable: true,
  get: function get() {
    return _type.assertType;
  }
});
Object.defineProperty(exports, 'assertInputType', {
  enumerable: true,
  get: function get() {
    return _type.assertInputType;
  }
});
Object.defineProperty(exports, 'assertOutputType', {
  enumerable: true,
  get: function get() {
    return _type.assertOutputType;
  }
});
Object.defineProperty(exports, 'assertLeafType', {
  enumerable: true,
  get: function get() {
    return _type.assertLeafType;
  }
});
Object.defineProperty(exports, 'assertCompositeType', {
  enumerable: true,
  get: function get() {
    return _type.assertCompositeType;
  }
});
Object.defineProperty(exports, 'assertAbstractType', {
  enumerable: true,
  get: function get() {
    return _type.assertAbstractType;
  }
});
Object.defineProperty(exports, 'assertNamedType', {
  enumerable: true,
  get: function get() {
    return _type.assertNamedType;
  }
});
Object.defineProperty(exports, 'getNullableType', {
  enumerable: true,
  get: function get() {
    return _type.getNullableType;
  }
});
Object.defineProperty(exports, 'getNamedType', {
  enumerable: true,
  get: function get() {
    return _type.getNamedType;
  }
});

var _language = require('./language');

Object.defineProperty(exports, 'Source', {
  enumerable: true,
  get: function get() {
    return _language.Source;
  }
});
Object.defineProperty(exports, 'getLocation', {
  enumerable: true,
  get: function get() {
    return _language.getLocation;
  }
});
Object.defineProperty(exports, 'parse', {
  enumerable: true,
  get: function get() {
    return _language.parse;
  }
});
Object.defineProperty(exports, 'parseValue', {
  enumerable: true,
  get: function get() {
    return _language.parseValue;
  }
});
Object.defineProperty(exports, 'parseType', {
  enumerable: true,
  get: function get() {
    return _language.parseType;
  }
});
Object.defineProperty(exports, 'print', {
  enumerable: true,
  get: function get() {
    return _language.print;
  }
});
Object.defineProperty(exports, 'visit', {
  enumerable: true,
  get: function get() {
    return _language.visit;
  }
});
Object.defineProperty(exports, 'visitInParallel', {
  enumerable: true,
  get: function get() {
    return _language.visitInParallel;
  }
});
Object.defineProperty(exports, 'visitWithTypeInfo', {
  enumerable: true,
  get: function get() {
    return _language.visitWithTypeInfo;
  }
});
Object.defineProperty(exports, 'getVisitFn', {
  enumerable: true,
  get: function get() {
    return _language.getVisitFn;
  }
});
Object.defineProperty(exports, 'Kind', {
  enumerable: true,
  get: function get() {
    return _language.Kind;
  }
});
Object.defineProperty(exports, 'TokenKind', {
  enumerable: true,
  get: function get() {
    return _language.TokenKind;
  }
});
Object.defineProperty(exports, 'BREAK', {
  enumerable: true,
  get: function get() {
    return _language.BREAK;
  }
});

var _execution = require('./execution');

Object.defineProperty(exports, 'execute', {
  enumerable: true,
  get: function get() {
    return _execution.execute;
  }
});
Object.defineProperty(exports, 'defaultFieldResolver', {
  enumerable: true,
  get: function get() {
    return _execution.defaultFieldResolver;
  }
});
Object.defineProperty(exports, 'responsePathAsArray', {
  enumerable: true,
  get: function get() {
    return _execution.responsePathAsArray;
  }
});
Object.defineProperty(exports, 'getDirectiveValues', {
  enumerable: true,
  get: function get() {
    return _execution.getDirectiveValues;
  }
});

var _subscription = require('./subscription');

Object.defineProperty(exports, 'subscribe', {
  enumerable: true,
  get: function get() {
    return _subscription.subscribe;
  }
});
Object.defineProperty(exports, 'createSourceEventStream', {
  enumerable: true,
  get: function get() {
    return _subscription.createSourceEventStream;
  }
});

var _validation = require('./validation');

Object.defineProperty(exports, 'validate', {
  enumerable: true,
  get: function get() {
    return _validation.validate;
  }
});
Object.defineProperty(exports, 'ValidationContext', {
  enumerable: true,
  get: function get() {
    return _validation.ValidationContext;
  }
});
Object.defineProperty(exports, 'specifiedRules', {
  enumerable: true,
  get: function get() {
    return _validation.specifiedRules;
  }
});
Object.defineProperty(exports, 'ArgumentsOfCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.ArgumentsOfCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'DefaultValuesOfCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.DefaultValuesOfCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'FieldsOnCorrectTypeRule', {
  enumerable: true,
  get: function get() {
    return _validation.FieldsOnCorrectTypeRule;
  }
});
Object.defineProperty(exports, 'FragmentsOnCompositeTypesRule', {
  enumerable: true,
  get: function get() {
    return _validation.FragmentsOnCompositeTypesRule;
  }
});
Object.defineProperty(exports, 'KnownArgumentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownArgumentNamesRule;
  }
});
Object.defineProperty(exports, 'KnownDirectivesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownDirectivesRule;
  }
});
Object.defineProperty(exports, 'KnownFragmentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownFragmentNamesRule;
  }
});
Object.defineProperty(exports, 'KnownTypeNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.KnownTypeNamesRule;
  }
});
Object.defineProperty(exports, 'LoneAnonymousOperationRule', {
  enumerable: true,
  get: function get() {
    return _validation.LoneAnonymousOperationRule;
  }
});
Object.defineProperty(exports, 'NoFragmentCyclesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoFragmentCyclesRule;
  }
});
Object.defineProperty(exports, 'NoUndefinedVariablesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUndefinedVariablesRule;
  }
});
Object.defineProperty(exports, 'NoUnusedFragmentsRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUnusedFragmentsRule;
  }
});
Object.defineProperty(exports, 'NoUnusedVariablesRule', {
  enumerable: true,
  get: function get() {
    return _validation.NoUnusedVariablesRule;
  }
});
Object.defineProperty(exports, 'OverlappingFieldsCanBeMergedRule', {
  enumerable: true,
  get: function get() {
    return _validation.OverlappingFieldsCanBeMergedRule;
  }
});
Object.defineProperty(exports, 'PossibleFragmentSpreadsRule', {
  enumerable: true,
  get: function get() {
    return _validation.PossibleFragmentSpreadsRule;
  }
});
Object.defineProperty(exports, 'ProvidedNonNullArgumentsRule', {
  enumerable: true,
  get: function get() {
    return _validation.ProvidedNonNullArgumentsRule;
  }
});
Object.defineProperty(exports, 'ScalarLeafsRule', {
  enumerable: true,
  get: function get() {
    return _validation.ScalarLeafsRule;
  }
});
Object.defineProperty(exports, 'SingleFieldSubscriptionsRule', {
  enumerable: true,
  get: function get() {
    return _validation.SingleFieldSubscriptionsRule;
  }
});
Object.defineProperty(exports, 'UniqueArgumentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueArgumentNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueDirectivesPerLocationRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueDirectivesPerLocationRule;
  }
});
Object.defineProperty(exports, 'UniqueFragmentNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueFragmentNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueInputFieldNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueInputFieldNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueOperationNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueOperationNamesRule;
  }
});
Object.defineProperty(exports, 'UniqueVariableNamesRule', {
  enumerable: true,
  get: function get() {
    return _validation.UniqueVariableNamesRule;
  }
});
Object.defineProperty(exports, 'VariablesAreInputTypesRule', {
  enumerable: true,
  get: function get() {
    return _validation.VariablesAreInputTypesRule;
  }
});
Object.defineProperty(exports, 'VariablesInAllowedPositionRule', {
  enumerable: true,
  get: function get() {
    return _validation.VariablesInAllowedPositionRule;
  }
});

var _error = require('./error');

Object.defineProperty(exports, 'GraphQLError', {
  enumerable: true,
  get: function get() {
    return _error.GraphQLError;
  }
});
Object.defineProperty(exports, 'formatError', {
  enumerable: true,
  get: function get() {
    return _error.formatError;
  }
});

var _utilities = require('./utilities');

Object.defineProperty(exports, 'introspectionQuery', {
  enumerable: true,
  get: function get() {
    return _utilities.introspectionQuery;
  }
});
Object.defineProperty(exports, 'getOperationAST', {
  enumerable: true,
  get: function get() {
    return _utilities.getOperationAST;
  }
});
Object.defineProperty(exports, 'buildClientSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildClientSchema;
  }
});
Object.defineProperty(exports, 'buildASTSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildASTSchema;
  }
});
Object.defineProperty(exports, 'buildSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.buildSchema;
  }
});
Object.defineProperty(exports, 'extendSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.extendSchema;
  }
});
Object.defineProperty(exports, 'printSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.printSchema;
  }
});
Object.defineProperty(exports, 'printIntrospectionSchema', {
  enumerable: true,
  get: function get() {
    return _utilities.printIntrospectionSchema;
  }
});
Object.defineProperty(exports, 'printType', {
  enumerable: true,
  get: function get() {
    return _utilities.printType;
  }
});
Object.defineProperty(exports, 'typeFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.typeFromAST;
  }
});
Object.defineProperty(exports, 'valueFromAST', {
  enumerable: true,
  get: function get() {
    return _utilities.valueFromAST;
  }
});
Object.defineProperty(exports, 'astFromValue', {
  enumerable: true,
  get: function get() {
    return _utilities.astFromValue;
  }
});
Object.defineProperty(exports, 'TypeInfo', {
  enumerable: true,
  get: function get() {
    return _utilities.TypeInfo;
  }
});
Object.defineProperty(exports, 'isValidJSValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidJSValue;
  }
});
Object.defineProperty(exports, 'isValidLiteralValue', {
  enumerable: true,
  get: function get() {
    return _utilities.isValidLiteralValue;
  }
});
Object.defineProperty(exports, 'concatAST', {
  enumerable: true,
  get: function get() {
    return _utilities.concatAST;
  }
});
Object.defineProperty(exports, 'separateOperations', {
  enumerable: true,
  get: function get() {
    return _utilities.separateOperations;
  }
});
Object.defineProperty(exports, 'isEqualType', {
  enumerable: true,
  get: function get() {
    return _utilities.isEqualType;
  }
});
Object.defineProperty(exports, 'isTypeSubTypeOf', {
  enumerable: true,
  get: function get() {
    return _utilities.isTypeSubTypeOf;
  }
});
Object.defineProperty(exports, 'doTypesOverlap', {
  enumerable: true,
  get: function get() {
    return _utilities.doTypesOverlap;
  }
});
Object.defineProperty(exports, 'assertValidName', {
  enumerable: true,
  get: function get() {
    return _utilities.assertValidName;
  }
});
Object.defineProperty(exports, 'findBreakingChanges', {
  enumerable: true,
  get: function get() {
    return _utilities.findBreakingChanges;
  }
});
Object.defineProperty(exports, 'BreakingChangeType', {
  enumerable: true,
  get: function get() {
    return _utilities.BreakingChangeType;
  }
});
Object.defineProperty(exports, 'DangerousChangeType', {
  enumerable: true,
  get: function get() {
    return _utilities.DangerousChangeType;
  }
});
Object.defineProperty(exports, 'findDeprecatedUsages', {
  enumerable: true,
  get: function get() {
    return _utilities.findDeprecatedUsages;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"body-parser":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/body-parser/package.json                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "body-parser";
exports.version = "1.17.2";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/body-parser/index.js                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*!
 * body-parser
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var deprecate = require('depd')('body-parser')

/**
 * Cache of loaded parsers.
 * @private
 */

var parsers = Object.create(null)

/**
 * @typedef Parsers
 * @type {function}
 * @property {function} json
 * @property {function} raw
 * @property {function} text
 * @property {function} urlencoded
 */

/**
 * Module exports.
 * @type {Parsers}
 */

exports = module.exports = deprecate.function(bodyParser,
  'bodyParser: use individual json/urlencoded middlewares')

/**
 * JSON parser.
 * @public
 */

Object.defineProperty(exports, 'json', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('json')
})

/**
 * Raw parser.
 * @public
 */

Object.defineProperty(exports, 'raw', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('raw')
})

/**
 * Text parser.
 * @public
 */

Object.defineProperty(exports, 'text', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('text')
})

/**
 * URL-encoded parser.
 * @public
 */

Object.defineProperty(exports, 'urlencoded', {
  configurable: true,
  enumerable: true,
  get: createParserGetter('urlencoded')
})

/**
 * Create a middleware to parse json and urlencoded bodies.
 *
 * @param {object} [options]
 * @return {function}
 * @deprecated
 * @public
 */

function bodyParser (options) {
  var opts = {}

  // exclude type option
  if (options) {
    for (var prop in options) {
      if (prop !== 'type') {
        opts[prop] = options[prop]
      }
    }
  }

  var _urlencoded = exports.urlencoded(opts)
  var _json = exports.json(opts)

  return function bodyParser (req, res, next) {
    _json(req, res, function (err) {
      if (err) return next(err)
      _urlencoded(req, res, next)
    })
  }
}

/**
 * Create a getter for loading a parser.
 * @private
 */

function createParserGetter (name) {
  return function get () {
    return loadParser(name)
  }
}

/**
 * Load a parser module.
 * @private
 */

function loadParser (parserName) {
  var parser = parsers[parserName]

  if (parser !== undefined) {
    return parser
  }

  // this uses a switch for static require analysis
  switch (parserName) {
    case 'json':
      parser = require('./lib/types/json')
      break
    case 'raw':
      parser = require('./lib/types/raw')
      break
    case 'text':
      parser = require('./lib/types/text')
      break
    case 'urlencoded':
      parser = require('./lib/types/urlencoded')
      break
  }

  // store to prevent invoking require()
  return (parsers[parserName] = parser)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"express":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/express/package.json                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "express";
exports.version = "4.15.4";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/express/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/*!
 * express
 * Copyright(c) 2009-2013 TJ Holowaychuk
 * Copyright(c) 2013 Roman Shtylman
 * Copyright(c) 2014-2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict';

module.exports = require('./lib/express');

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"cors":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/cors/package.json                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "cors";
exports.version = "2.8.4";
exports.main = "./lib/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/cors/lib/index.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
(function () {

  'use strict';

  var assign = require('object-assign');
  var vary = require('vary');

  var defaults = {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204
    };

  function isString(s) {
    return typeof s === 'string' || s instanceof String;
  }

  function isOriginAllowed(origin, allowedOrigin) {
    if (Array.isArray(allowedOrigin)) {
      for (var i = 0; i < allowedOrigin.length; ++i) {
        if (isOriginAllowed(origin, allowedOrigin[i])) {
          return true;
        }
      }
      return false;
    } else if (isString(allowedOrigin)) {
      return origin === allowedOrigin;
    } else if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    } else {
      return !!allowedOrigin;
    }
  }

  function configureOrigin(options, req) {
    var requestOrigin = req.headers.origin,
      headers = [],
      isAllowed;

    if (!options.origin || options.origin === '*') {
      // allow any origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: '*'
      }]);
    } else if (isString(options.origin)) {
      // fixed origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: options.origin
      }]);
      headers.push([{
        key: 'Vary',
        value: 'Origin'
      }]);
    } else {
      isAllowed = isOriginAllowed(requestOrigin, options.origin);
      // reflect origin
      headers.push([{
        key: 'Access-Control-Allow-Origin',
        value: isAllowed ? requestOrigin : false
      }]);
      headers.push([{
        key: 'Vary',
        value: 'Origin'
      }]);
    }

    return headers;
  }

  function configureMethods(options) {
    var methods = options.methods;
    if (methods.join) {
      methods = options.methods.join(','); // .methods is an array, so turn it into a string
    }
    return {
      key: 'Access-Control-Allow-Methods',
      value: methods
    };
  }

  function configureCredentials(options) {
    if (options.credentials === true) {
      return {
        key: 'Access-Control-Allow-Credentials',
        value: 'true'
      };
    }
    return null;
  }

  function configureAllowedHeaders(options, req) {
    var allowedHeaders = options.allowedHeaders || options.headers;
    var headers = [];

    if (!allowedHeaders) {
      allowedHeaders = req.headers['access-control-request-headers']; // .headers wasn't specified, so reflect the request headers
      headers.push([{
        key: 'Vary',
        value: 'Access-Control-Request-Headers'
      }]);
    } else if (allowedHeaders.join) {
      allowedHeaders = allowedHeaders.join(','); // .headers is an array, so turn it into a string
    }
    if (allowedHeaders && allowedHeaders.length) {
      headers.push([{
        key: 'Access-Control-Allow-Headers',
        value: allowedHeaders
      }]);
    }

    return headers;
  }

  function configureExposedHeaders(options) {
    var headers = options.exposedHeaders;
    if (!headers) {
      return null;
    } else if (headers.join) {
      headers = headers.join(','); // .headers is an array, so turn it into a string
    }
    if (headers && headers.length) {
      return {
        key: 'Access-Control-Expose-Headers',
        value: headers
      };
    }
    return null;
  }

  function configureMaxAge(options) {
    var maxAge = options.maxAge && options.maxAge.toString();
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Max-Age',
        value: maxAge
      };
    }
    return null;
  }

  function applyHeaders(headers, res) {
    for (var i = 0, n = headers.length; i < n; i++) {
      var header = headers[i];
      if (header) {
        if (Array.isArray(header)) {
          applyHeaders(header, res);
        } else if (header.key === 'Vary' && header.value) {
          vary(res, header.value);
        } else if (header.value) {
          res.setHeader(header.key, header.value);
        }
      }
    }
  }

  function cors(options, req, res, next) {
    var headers = [],
      method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
      // preflight
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureMethods(options, req));
      headers.push(configureAllowedHeaders(options, req));
      headers.push(configureMaxAge(options, req));
      headers.push(configureExposedHeaders(options, req));
      applyHeaders(headers, res);

      if (options.preflightContinue ) {
        next();
      } else {
        // Safari (and potentially other browsers) need content-length 0,
        //   for 204 or they just hang waiting for a body
        res.statusCode = options.optionsSuccessStatus || defaults.optionsSuccessStatus;
        res.setHeader('Content-Length', '0');
        res.end();
      }
    } else {
      // actual response
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureExposedHeaders(options, req));
      applyHeaders(headers, res);
      next();
    }
  }

  function middlewareWrapper(o) {
    // if options are static (either via defaults or custom options passed in), wrap in a function
    var optionsCallback = null;
    if (typeof o === 'function') {
      optionsCallback = o;
    } else {
      optionsCallback = function (req, cb) {
        cb(null, o);
      };
    }

    return function corsMiddleware(req, res, next) {
      optionsCallback(req, function (err, options) {
        if (err) {
          next(err);
        } else {
          var corsOptions = assign({}, defaults, options);
          var originCallback = null;
          if (corsOptions.origin && typeof corsOptions.origin === 'function') {
            originCallback = corsOptions.origin;
          } else if (corsOptions.origin) {
            originCallback = function (origin, cb) {
              cb(null, corsOptions.origin);
            };
          }

          if (originCallback) {
            originCallback(req.headers.origin, function (err2, origin) {
              if (err2 || !origin) {
                next(err2);
              } else {
                corsOptions.origin = origin;
                cors(corsOptions, req, res, next);
              }
            });
          } else {
            next();
          }
        }
      });
    };
  }

  // can pass either an options hash, an options delegate, or nothing
  module.exports = middlewareWrapper;

}());

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"graphql-tools":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-tools/package.json                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql-tools";
exports.version = "1.2.2";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-tools/dist/index.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./schemaGenerator"));
__export(require("./mock"));
__export(require("./autopublish"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"merge-graphql-schemas":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/merge-graphql-schemas/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "merge-graphql-schemas";
exports.version = "1.1.3";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/merge-graphql-schemas/index.js                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = require('./dist/index');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lodash.property":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/lodash.property/package.json                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "lodash.property";
exports.version = "4.4.2";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/lodash.property/index.js                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"graphql-subscriptions":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-subscriptions/package.json                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
exports.name = "graphql-subscriptions";
exports.version = "0.4.4";
exports.main = "dist/index.js";

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"index.js":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/rocketchat_graphql/node_modules/graphql-subscriptions/dist/index.js                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pubsub_1 = require("./pubsub");
exports.PubSub = pubsub_1.PubSub;
var with_filter_1 = require("./with-filter");
exports.withFilter = with_filter_1.withFilter;
var subscriptions_manager_1 = require("./subscriptions-manager");
exports.SubscriptionManager = subscriptions_manager_1.SubscriptionManager;
exports.ValidationError = subscriptions_manager_1.ValidationError;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".graphqls"
  ]
});
require("/node_modules/meteor/rocketchat:graphql/server/settings.js");
var exports = require("/node_modules/meteor/rocketchat:graphql/server/api.js");

/* Exports */
Package._define("rocketchat:graphql", exports);

})();

//# sourceURL=meteor://💻app/packages/rocketchat_graphql.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvc2NoZW1hLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3N1YnNjcmlwdGlvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvaGVscGVycy9hdXRoZW50aWNhdGVkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL2hlbHBlcnMvZGF0ZVRvRmxvYXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvbW9ja3MvYWNjb3VudHMvZ3JhcGhxbC1hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2FjY291bnRzL09hdXRoUHJvdmlkZXItdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvYWNjb3VudHMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2FjY291bnRzL29hdXRoUHJvdmlkZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9DaGFubmVsLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL0NoYW5uZWxGaWx0ZXItaW5wdXQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL0NoYW5uZWxOYW1lQW5kRGlyZWN0LWlucHV0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9DaGFubmVsU29ydC1lbnVtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9Qcml2YWN5LWVudW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2NoYW5uZWxCeU5hbWUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2NoYW5uZWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9jaGFubmVsc0J5VXNlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvY3JlYXRlQ2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvZGlyZWN0Q2hhbm5lbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvY2hhbm5lbHMvaGlkZUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL2luZGV4LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9jaGFubmVscy9sZWF2ZUNoYW5uZWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL2NoYW5uZWxzL3NldHRpbmdzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9NZXNzYWdlLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL01lc3NhZ2VJZGVudGlmaWVyLWlucHV0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9NZXNzYWdlc1dpdGhDdXJzb3ItdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvUmVhY3Rpb24tdHlwZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvYWRkUmVhY3Rpb25Ub01lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2NoYXRNZXNzYWdlQWRkZWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2RlbGV0ZU1lc3NhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL2VkaXRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy9tZXNzYWdlcy9pbmRleC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvbWVzc2FnZXMvbWVzc2FnZXMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL21lc3NhZ2VzL3NlbmRNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmdyYXBocWwvc2VydmVyL3Jlc29sdmVycy91c2Vycy9Vc2VyLXR5cGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL3VzZXJzL1VzZXJTdGF0dXMtZW51bS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpncmFwaHFsL3NlcnZlci9yZXNvbHZlcnMvdXNlcnMvaW5kZXguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6Z3JhcGhxbC9zZXJ2ZXIvcmVzb2x2ZXJzL3VzZXJzL3NldFN0YXR1cy5qcyJdLCJuYW1lcyI6WyJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsInNlY3Rpb24iLCJhZGQiLCJ0eXBlIiwicHVibGljIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsImdyYXBocWxFeHByZXNzIiwiZ3JhcGhpcWxFeHByZXNzIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwidiIsImpzQWNjb3VudHNDb250ZXh0IiwiSlNBY2NvdW50c0NvbnRleHQiLCJTdWJzY3JpcHRpb25TZXJ2ZXIiLCJleGVjdXRlIiwic3Vic2NyaWJlIiwiTWV0ZW9yIiwiV2ViQXBwIiwiYm9keVBhcnNlciIsImRlZmF1bHQiLCJleHByZXNzIiwiY29ycyIsImV4ZWN1dGFibGVTY2hlbWEiLCJzdWJzY3JpcHRpb25Qb3J0IiwiZ2V0IiwiZ3JhcGhRTFNlcnZlciIsInVzZSIsInJlcSIsInJlcyIsIm5leHQiLCJzdGF0dXMiLCJzZW5kIiwianNvbiIsInJlcXVlc3QiLCJzY2hlbWEiLCJjb250ZXh0IiwiZm9ybWF0RXJyb3IiLCJlIiwibWVzc2FnZSIsImxvY2F0aW9ucyIsInBhdGgiLCJkZWJ1ZyIsImlzRGV2ZWxvcG1lbnQiLCJlbmRwb2ludFVSTCIsInN1YnNjcmlwdGlvbnNFbmRwb2ludCIsInN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyIiwiY3JlYXRlIiwib25Db25uZWN0IiwiY29ubmVjdGlvblBhcmFtcyIsImF1dGhUb2tlbiIsIkF1dGhvcml6YXRpb24iLCJwb3J0IiwiaG9zdCIsInByb2Nlc3MiLCJlbnYiLCJCSU5EX0lQIiwiY29uc29sZSIsImxvZyIsIm9uTGlzdGVuaW5nIiwiY29ubmVjdEhhbmRsZXJzIiwiZXhwb3J0IiwibWFrZUV4ZWN1dGFibGVTY2hlbWEiLCJtZXJnZVR5cGVzIiwibWVyZ2VSZXNvbHZlcnMiLCJjaGFubmVscyIsIm1lc3NhZ2VzIiwiYWNjb3VudHMiLCJ1c2VycyIsInJlc29sdmVycyIsInR5cGVEZWZzIiwibG9nZ2VyIiwicHVic3ViIiwiUHViU3ViIiwiYXV0aGVudGljYXRlZCIsIkFjY291bnRzU2VydmVyIiwiX2F1dGhlbnRpY2F0ZWQiLCJyZXNvbHZlciIsImRhdGVUb0Zsb2F0IiwiZGF0ZSIsIkRhdGUiLCJnZXRUaW1lIiwiQWNjb3VudHMiLCJmdW5jIiwicm9vdCIsImFyZ3MiLCJpbmZvIiwiRXJyb3IiLCJ1c2VyT2JqZWN0IiwicmVzdW1lU2Vzc2lvbiIsIk9iamVjdCIsImFzc2lnbiIsInVzZXIiLCJjcmVhdGVKU0FjY291bnRzR3JhcGhRTCIsIm9hdXRoUHJvdmlkZXJzIiwiT2F1dGhQcm92aWRlclR5cGUiLCJhY2NvdW50c0dyYXBoUUwiLCJleHRlbmRXaXRoUmVzb2x2ZXJzIiwiSFRUUCIsImlzSlNPTiIsIm9iaiIsIkpTT04iLCJwYXJzZSIsIlF1ZXJ5IiwicmVzdWx0IiwiYWJzb2x1dGVVcmwiLCJjb250ZW50IiwicHJvdmlkZXJzIiwiZGF0YSIsIm1hcCIsIm5hbWUiLCJwcm9wZXJ0eSIsIkNoYW5uZWwiLCJpZCIsInQiLCJ1c2VybmFtZXMiLCJmaW5kIiwidSIsInVzZXJuYW1lIiwibWVtYmVycyIsIm1vZGVscyIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJvd25lcnMiLCJudW1iZXJPZk1lbWJlcnMiLCJsZW5ndGgiLCJudW1iZXJPZk1lc3NhZ2VzIiwicmVhZE9ubHkiLCJybyIsImRpcmVjdCIsInByaXZhdGVDaGFubmVsIiwiZmF2b3VyaXRlIiwicm9vbSIsIlN1YnNjcmlwdGlvbnMiLCJmaW5kT25lQnlSb29tSWRBbmRVc2VySWQiLCJmIiwidW5zZWVuTWVzc2FnZXMiLCJ1bnJlYWQiLCJyb29tUHVibGljRmllbGRzIiwiY2hhbm5lbEJ5TmFtZSIsInF1ZXJ5IiwiUm9vbXMiLCJmaW5kT25lIiwiZmllbGRzIiwib3B0aW9ucyIsInNvcnQiLCJmaWx0ZXIiLCJuYW1lRmlsdGVyIiwidW5kZWZpbmVkIiwiJHJlZ2V4IiwiUmVnRXhwIiwic29ydEJ5IiwibXNncyIsInByaXZhY3kiLCIkbmUiLCJmZXRjaCIsImNoYW5uZWxzQnlVc2VyIiwidXNlcklkIiwiZmluZE9uZUJ5SWQiLCJyb29tcyIsImZpbmRCeUNvbnRhaW5pbmdVc2VybmFtZSIsIk11dGF0aW9uIiwiY3JlYXRlQ2hhbm5lbCIsIkFQSSIsInZhbGlkYXRlIiwia2V5IiwibWVtYmVyc0lkIiwiY2hhbm5lbCIsImRpcmVjdENoYW5uZWwiLCJjaGFubmVsSWQiLCIkYWxsIiwiaGlkZUNoYW5uZWwiLCJzdWIiLCJvcGVuIiwicnVuQXNVc2VyIiwiY2FsbCIsImxlYXZlQ2hhbm5lbCIsIkNoYW5uZWxUeXBlIiwiQ2hhbm5lbFNvcnQiLCJDaGFubmVsRmlsdGVyIiwiUHJpdmFjeSIsIkNoYW5uZWxOYW1lQW5kRGlyZWN0IiwiZGVzY3JpcHRpb24iLCJhbm5vdW5jZW1lbnQiLCJ0b3BpYyIsImFyY2hpdmVkIiwiTWVzc2FnZSIsImNyZWF0aW9uVGltZSIsInRzIiwiYXV0aG9yIiwicmlkIiwiZnJvbVNlcnZlciIsImNoYW5uZWxSZWYiLCIkaW4iLCJjIiwidXNlclJlZiIsIm1lbnRpb25zIiwicmVhY3Rpb25zIiwia2V5cyIsImZvckVhY2giLCJpY29uIiwicHVzaCIsImFkZFJlYWN0aW9uVG9NZXNzYWdlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJtZXNzYWdlSWQiLCJNZXNzYWdlcyIsIkNIQVRfTUVTU0FHRV9TVUJTQ1JJUFRJT05fVE9QSUMiLCJwdWJsaXNoTWVzc2FnZSIsIndpdGhGaWx0ZXIiLCJwdWJsaXNoIiwiY2hhdE1lc3NhZ2VBZGRlZCIsInNob3VsZFB1Ymxpc2giLCJkaXJlY3RUbyIsIlN1YnNjcmlwdGlvbiIsImFzeW5jSXRlcmF0b3IiLCJwYXlsb2FkIiwiY2FsbGJhY2tzIiwiZGVsZXRlTWVzc2FnZSIsIm1zZyIsImVkaXRNZXNzYWdlIiwic2VuZE1lc3NhZ2UiLCJNZXNzYWdlVHlwZSIsIk1lc3NhZ2VzV2l0aEN1cnNvclR5cGUiLCJNZXNzYWdlSWRlbnRpZmllciIsIlJlYWN0aW9uVHlwZSIsIm1lc3NhZ2VzUXVlcnkiLCJtZXNzYWdlc09wdGlvbnMiLCJjaGFubmVsUXVlcnkiLCJpc1BhZ2luYXRpb24iLCJjdXJzb3IiLCJjb3VudCIsImNoYW5uZWxOYW1lIiwiZXJyb3IiLCJtZXNzYWdlc0FycmF5IiwiY3Vyc29yTXNnIiwiJGx0Iiwic2VhcmNoUmVnZXgiLCJsaW1pdCIsImV4Y2x1ZGVTZXJ2ZXIiLCIkZXhpc3RzIiwiZmlyc3RNZXNzYWdlIiwibGFzdElkIiwidGV4dCIsIm1lc3NhZ2VSZXR1cm4iLCJwcm9jZXNzV2ViaG9va01lc3NhZ2UiLCJVc2VyIiwidG9VcHBlckNhc2UiLCJhdmF0YXIiLCJBdmF0YXJzIiwibW9kZWwiLCJyYXdDb2xsZWN0aW9uIiwidXJsIiwiYmluZEVudmlyb25tZW50IiwiZmluZEJ5U3Vic2NyaXB0aW9uVXNlcklkIiwiZGlyZWN0TWVzc2FnZXMiLCJmaW5kQnlUeXBlQ29udGFpbmluZ1VzZXJuYW1lIiwic2V0U3RhdHVzIiwiVXNlclR5cGUiLCJVc2VyU3RhdHVzIiwidXBkYXRlIiwiJHNldCIsInRvTG93ZXJDYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFdBQVdDLFFBQVgsQ0FBb0JDLFFBQXBCLENBQTZCLFNBQTdCLEVBQXdDLFlBQVc7QUFDbEQsT0FBS0MsT0FBTCxDQUFhLGFBQWIsRUFBNEIsWUFBVztBQUN0QyxTQUFLQyxHQUFMLENBQVMsaUJBQVQsRUFBNEIsS0FBNUIsRUFBbUM7QUFBRUMsWUFBTSxTQUFSO0FBQW1CQyxjQUFRO0FBQTNCLEtBQW5DO0FBQ0EsU0FBS0YsR0FBTCxDQUFTLGNBQVQsRUFBeUIsSUFBekIsRUFBK0I7QUFBRUMsWUFBTSxTQUFSO0FBQW1CQyxjQUFRLEtBQTNCO0FBQWtDQyxtQkFBYTtBQUFFQyxhQUFLLGlCQUFQO0FBQTBCQyxlQUFPO0FBQWpDO0FBQS9DLEtBQS9CO0FBQ0EsU0FBS0wsR0FBTCxDQUFTLDJCQUFULEVBQXNDLElBQXRDLEVBQTRDO0FBQUVDLFlBQU0sS0FBUjtBQUFlQyxjQUFRLEtBQXZCO0FBQThCQyxtQkFBYTtBQUFFQyxhQUFLLGlCQUFQO0FBQTBCQyxlQUFPO0FBQWpDO0FBQTNDLEtBQTVDO0FBQ0EsR0FKRDtBQUtBLENBTkQsRTs7Ozs7Ozs7Ozs7QUNBQSxJQUFJQyxjQUFKLEVBQW1CQyxlQUFuQjtBQUFtQ0MsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWIsRUFBOEM7QUFBQ0osaUJBQWVLLENBQWYsRUFBaUI7QUFBQ0wscUJBQWVLLENBQWY7QUFBaUIsR0FBcEM7O0FBQXFDSixr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QWIsRUFBb0Q7QUFBQ2dFLGdCQUFjL0QsQ0FBZCxFQUFnQjtBQUFDK0Qsb0JBQWMvRCxDQUFkO0FBQWdCOztBQUFsQyxDQUFwRCxFQUF3RixDQUF4RjtBQUEyRixJQUFJd0IsTUFBSjtBQUFXM0IsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHdDQUFSLENBQWIsRUFBK0Q7QUFBQ1UsVUFBUVQsQ0FBUixFQUFVO0FBQUN3QixhQUFPeEIsQ0FBUDtBQUFTOztBQUFyQixDQUEvRCxFQUFzRixDQUF0RjtBQUsvUSxNQUFNa0UsV0FBVztBQUNoQm9GLFlBQVU7QUFDVGdHLGVBQVd2TCxjQUFjLENBQUNVLElBQUQsRUFBTztBQUFFckQ7QUFBRixLQUFQLEVBQW1CO0FBQUU2RDtBQUFGLEtBQW5CLEtBQWdDO0FBQ3hEaEcsaUJBQVc0SCxNQUFYLENBQWtCQyxLQUFsQixDQUF3QjJJLE1BQXhCLENBQStCeEssS0FBS3hGLEdBQXBDLEVBQXlDO0FBQ3hDaVEsY0FBTTtBQUNMdE8sa0JBQVFBLE9BQU91TyxXQUFQO0FBREg7QUFEa0MsT0FBekM7QUFNQSxhQUFPMVEsV0FBVzRILE1BQVgsQ0FBa0JDLEtBQWxCLENBQXdCcUIsT0FBeEIsQ0FBZ0NsRCxLQUFLeEYsR0FBckMsQ0FBUDtBQUNBLEtBUlU7QUFERjtBQURNLENBQWpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZ3JhcGhxbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0dlbmVyYWwnLCBmdW5jdGlvbigpIHtcblx0dGhpcy5zZWN0aW9uKCdHcmFwaFFMIEFQSScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdHcmFwaHFsX0VuYWJsZWQnLCBmYWxzZSwgeyB0eXBlOiAnYm9vbGVhbicsIHB1YmxpYzogZmFsc2UgfSk7XG5cdFx0dGhpcy5hZGQoJ0dyYXBocWxfQ09SUycsIHRydWUsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwdWJsaWM6IGZhbHNlLCBlbmFibGVRdWVyeTogeyBfaWQ6ICdHcmFwaHFsX0VuYWJsZWQnLCB2YWx1ZTogdHJ1ZSB9IH0pO1xuXHRcdHRoaXMuYWRkKCdHcmFwaHFsX1N1YnNjcmlwdGlvbl9Qb3J0JywgMzEwMCwgeyB0eXBlOiAnaW50JywgcHVibGljOiBmYWxzZSwgZW5hYmxlUXVlcnk6IHsgX2lkOiAnR3JhcGhxbF9FbmFibGVkJywgdmFsdWU6IHRydWUgfSB9KTtcblx0fSk7XG59KTtcbiIsImltcG9ydCB7IGdyYXBocWxFeHByZXNzLCBncmFwaGlxbEV4cHJlc3MgfSBmcm9tICdhcG9sbG8tc2VydmVyLWV4cHJlc3MnO1xuaW1wb3J0IHsgSlNBY2NvdW50c0NvbnRleHQgYXMganNBY2NvdW50c0NvbnRleHQgfSBmcm9tICdAYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uU2VydmVyIH0gZnJvbSAnc3Vic2NyaXB0aW9ucy10cmFuc3BvcnQtd3MnO1xuaW1wb3J0IHsgZXhlY3V0ZSwgc3Vic2NyaWJlIH0gZnJvbSAnZ3JhcGhxbCc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFdlYkFwcCB9IGZyb20gJ21ldGVvci93ZWJhcHAnO1xuaW1wb3J0IGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgY29ycyBmcm9tICdjb3JzJztcblxuaW1wb3J0IHsgZXhlY3V0YWJsZVNjaGVtYSB9IGZyb20gJy4vc2NoZW1hJztcblxuY29uc3Qgc3Vic2NyaXB0aW9uUG9ydCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHcmFwaHFsX1N1YnNjcmlwdGlvbl9Qb3J0JykgfHwgMzEwMDtcblxuLy8gdGhlIE1ldGVvciBHcmFwaFFMIHNlcnZlciBpcyBhbiBFeHByZXNzIHNlcnZlclxuY29uc3QgZ3JhcGhRTFNlcnZlciA9IGV4cHJlc3MoKTtcblxuaWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdHcmFwaHFsX0NPUlMnKSkge1xuXHRncmFwaFFMU2VydmVyLnVzZShjb3JzKCkpO1xufVxuXG5ncmFwaFFMU2VydmVyLnVzZSgnL2FwaS9ncmFwaHFsJywgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XG5cdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnR3JhcGhxbF9FbmFibGVkJykpIHtcblx0XHRuZXh0KCk7XG5cdH0gZWxzZSB7XG5cdFx0cmVzLnN0YXR1cyg0MDApLnNlbmQoJ0dyYXBocWwgaXMgbm90IGVuYWJsZWQgaW4gdGhpcyBzZXJ2ZXInKTtcblx0fVxufSk7XG5cbmdyYXBoUUxTZXJ2ZXIudXNlKFxuXHQnL2FwaS9ncmFwaHFsJyxcblx0Ym9keVBhcnNlci5qc29uKCksXG5cdGdyYXBocWxFeHByZXNzKHJlcXVlc3QgPT4ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzY2hlbWE6IGV4ZWN1dGFibGVTY2hlbWEsXG5cdFx0XHRjb250ZXh0OiBqc0FjY291bnRzQ29udGV4dChyZXF1ZXN0KSxcblx0XHRcdGZvcm1hdEVycm9yOiBlID0+ICh7XG5cdFx0XHRcdG1lc3NhZ2U6IGUubWVzc2FnZSxcblx0XHRcdFx0bG9jYXRpb25zOiBlLmxvY2F0aW9ucyxcblx0XHRcdFx0cGF0aDogZS5wYXRoXG5cdFx0XHR9KSxcblx0XHRcdGRlYnVnOiBNZXRlb3IuaXNEZXZlbG9wbWVudFxuXHRcdH07XG5cdH0pXG4pO1xuXG5ncmFwaFFMU2VydmVyLnVzZShcblx0Jy9ncmFwaGlxbCcsXG5cdGdyYXBoaXFsRXhwcmVzcyh7XG5cdFx0ZW5kcG9pbnRVUkw6ICcvYXBpL2dyYXBocWwnLFxuXHRcdHN1YnNjcmlwdGlvbnNFbmRwb2ludDogYHdzOi8vbG9jYWxob3N0OiR7IHN1YnNjcmlwdGlvblBvcnQgfWBcblx0fSlcbik7XG5cbmNvbnN0IHN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyID0gKCkgPT4ge1xuXHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0dyYXBocWxfRW5hYmxlZCcpKSB7XG5cdFx0U3Vic2NyaXB0aW9uU2VydmVyLmNyZWF0ZSh7XG5cdFx0XHRzY2hlbWE6IGV4ZWN1dGFibGVTY2hlbWEsXG5cdFx0XHRleGVjdXRlLFxuXHRcdFx0c3Vic2NyaWJlLFxuXHRcdFx0b25Db25uZWN0OiAoY29ubmVjdGlvblBhcmFtcykgPT4gKHsgYXV0aFRva2VuOiBjb25uZWN0aW9uUGFyYW1zLkF1dGhvcml6YXRpb24gfSlcblx0XHR9LFxuXHRcdHtcblx0XHRcdHBvcnQ6IHN1YnNjcmlwdGlvblBvcnQsXG5cdFx0XHRob3N0OiBwcm9jZXNzLmVudi5CSU5EX0lQIHx8ICcwLjAuMC4wJ1xuXHRcdH0pO1xuXG5cdFx0Y29uc29sZS5sb2coJ0dyYXBoUUwgU3Vic2NyaXB0aW9uIHNlcnZlciBydW5zIG9uIHBvcnQ6Jywgc3Vic2NyaXB0aW9uUG9ydCk7XG5cdH1cbn07XG5cbldlYkFwcC5vbkxpc3RlbmluZygoKSA9PiB7XG5cdHN0YXJ0U3Vic2NyaXB0aW9uU2VydmVyKCk7XG59KTtcblxuLy8gdGhpcyBiaW5kcyB0aGUgc3BlY2lmaWVkIHBhdGhzIHRvIHRoZSBFeHByZXNzIHNlcnZlciBydW5uaW5nIEFwb2xsbyArIEdyYXBoaVFMXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShncmFwaFFMU2VydmVyKTtcbiIsImltcG9ydCB7IG1ha2VFeGVjdXRhYmxlU2NoZW1hIH0gZnJvbSAnZ3JhcGhxbC10b29scyc7XG5pbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbmltcG9ydCAqIGFzIGNoYW5uZWxzIGZyb20gJy4vcmVzb2x2ZXJzL2NoYW5uZWxzJztcbmltcG9ydCAqIGFzIG1lc3NhZ2VzIGZyb20gJy4vcmVzb2x2ZXJzL21lc3NhZ2VzJztcbmltcG9ydCAqIGFzIGFjY291bnRzIGZyb20gJy4vcmVzb2x2ZXJzL2FjY291bnRzJztcbmltcG9ydCAqIGFzIHVzZXJzIGZyb20gJy4vcmVzb2x2ZXJzL3VzZXJzJztcblxuY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdGNoYW5uZWxzLnNjaGVtYSxcblx0bWVzc2FnZXMuc2NoZW1hLFxuXHRhY2NvdW50cy5zY2hlbWEsXG5cdHVzZXJzLnNjaGVtYVxuXSk7XG5cbmNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0Y2hhbm5lbHMucmVzb2x2ZXJzLFxuXHRtZXNzYWdlcy5yZXNvbHZlcnMsXG5cdGFjY291bnRzLnJlc29sdmVycyxcblx0dXNlcnMucmVzb2x2ZXJzXG5dKTtcblxuZXhwb3J0IGNvbnN0IGV4ZWN1dGFibGVTY2hlbWEgPSBtYWtlRXhlY3V0YWJsZVNjaGVtYSh7XG5cdHR5cGVEZWZzOiBbc2NoZW1hXSxcblx0cmVzb2x2ZXJzLFxuXHRsb2dnZXI6IHtcblx0XHRsb2c6IChlKSA9PiBjb25zb2xlLmxvZyhlKVxuXHR9XG59KTtcbiIsImltcG9ydCB7IFB1YlN1YiB9IGZyb20gJ2dyYXBocWwtc3Vic2NyaXB0aW9ucyc7XG5cbmV4cG9ydCBjb25zdCBwdWJzdWIgPSBuZXcgUHViU3ViKCk7XG4iLCJpbXBvcnQgeyBBY2NvdW50c1NlcnZlciB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmFjY291bnRzJztcbi8vaW1wb3J0IHsgYXV0aGVudGljYXRlZCBhcyBfYXV0aGVudGljYXRlZCB9IGZyb20gJ0BhY2NvdW50cy9ncmFwaHFsLWFwaSc7XG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIGFzIF9hdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vbW9ja3MvYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuXG5leHBvcnQgY29uc3QgYXV0aGVudGljYXRlZCA9IChyZXNvbHZlcikgPT4ge1xuXHRyZXR1cm4gX2F1dGhlbnRpY2F0ZWQoQWNjb3VudHNTZXJ2ZXIsIHJlc29sdmVyKTtcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gZGF0ZVRvRmxvYXQoZGF0ZSkge1xuXHRpZiAoZGF0ZSkge1xuXHRcdHJldHVybiBuZXcgRGF0ZShkYXRlKS5nZXRUaW1lKCk7XG5cdH1cbn1cbiIsIi8vIFNhbWUgYXMgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL2pzLWFjY291bnRzL2dyYXBocWwvYmxvYi9tYXN0ZXIvcGFja2FnZXMvZ3JhcGhxbC1hcGkvc3JjL3V0aWxzL2F1dGhlbnRpY2F0ZWQtcmVzb2x2ZXIuanNcbi8vIGV4Y2VwdCBjb2RlIGJlbG93IHdvcmtzXG4vLyBJdCBtaWdodCBiZSBsaWtlIHRoYXQgYmVjYXVzZSBvZiBhc3luYy9hd2FpdCxcbi8vIG1heWJlIFByb21pc2UgaXMgbm90IHdyYXBwZWQgd2l0aCBGaWJlclxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vbWV0ZW9yL21ldGVvci9ibG9iL2EzNjJlMjBhMzc1NDczNjJiNTgxZmVkNTJmNzE3MWQwMjJlODNiNjIvcGFja2FnZXMvcHJvbWlzZS9zZXJ2ZXIuanNcbi8vIE9wZW5lZCBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2pzLWFjY291bnRzL2dyYXBocWwvaXNzdWVzLzE2XG5leHBvcnQgY29uc3QgYXV0aGVudGljYXRlZCA9IChBY2NvdW50cywgZnVuYykgPT4gKGFzeW5jKHJvb3QsIGFyZ3MsIGNvbnRleHQsIGluZm8pID0+IHtcblx0Y29uc3QgYXV0aFRva2VuID0gY29udGV4dC5hdXRoVG9rZW47XG5cblx0aWYgKCFhdXRoVG9rZW4gfHwgYXV0aFRva2VuID09PSAnJyB8fCBhdXRoVG9rZW4gPT09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBmaW5kIGF1dGhvcml6YXRpb24gdG9rZW4gaW4gcmVxdWVzdCcpO1xuXHR9XG5cblx0Y29uc3QgdXNlck9iamVjdCA9IGF3YWl0IEFjY291bnRzLnJlc3VtZVNlc3Npb24oYXV0aFRva2VuKTtcblxuXHRpZiAodXNlck9iamVjdCA9PT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBvciBleHBpcmVkIHRva2VuIScpO1xuXHR9XG5cblx0cmV0dXJuIGF3YWl0IGZ1bmMocm9vdCwgYXJncywgT2JqZWN0LmFzc2lnbihjb250ZXh0LCB7IHVzZXI6IHVzZXJPYmplY3QgfSksIGluZm8pO1xufSk7XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvYWNjb3VudHMvT2F1dGhQcm92aWRlci10eXBlLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHsgY3JlYXRlSlNBY2NvdW50c0dyYXBoUUwgfSBmcm9tICdAYWNjb3VudHMvZ3JhcGhxbC1hcGknO1xuaW1wb3J0IHsgQWNjb3VudHNTZXJ2ZXIgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDphY2NvdW50cyc7XG5pbXBvcnQgeyBtZXJnZVR5cGVzLCBtZXJnZVJlc29sdmVycyB9IGZyb20gJ21lcmdlLWdyYXBocWwtc2NoZW1hcyc7XG5cbi8vIHF1ZXJpZXNcbmltcG9ydCAqIGFzIG9hdXRoUHJvdmlkZXJzIGZyb20gJy4vb2F1dGhQcm92aWRlcnMnO1xuLy8gdHlwZXNcbmltcG9ydCAqIGFzIE9hdXRoUHJvdmlkZXJUeXBlIGZyb20gJy4vT2F1dGhQcm92aWRlci10eXBlJztcblxuY29uc3QgYWNjb3VudHNHcmFwaFFMID0gY3JlYXRlSlNBY2NvdW50c0dyYXBoUUwoQWNjb3VudHNTZXJ2ZXIpO1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdGFjY291bnRzR3JhcGhRTC5zY2hlbWEsXG5cdG9hdXRoUHJvdmlkZXJzLnNjaGVtYSxcblx0T2F1dGhQcm92aWRlclR5cGUuc2NoZW1hXG5dKTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0YWNjb3VudHNHcmFwaFFMLmV4dGVuZFdpdGhSZXNvbHZlcnMoe30pLFxuXHRvYXV0aFByb3ZpZGVycy5yZXNvbHZlclxuXSk7XG4iLCJpbXBvcnQgeyBIVFRQIH0gZnJvbSAnbWV0ZW9yL2h0dHAnO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9hY2NvdW50cy9vYXV0aFByb3ZpZGVycy5ncmFwaHFscyc7XG5cbmZ1bmN0aW9uIGlzSlNPTihvYmopIHtcblx0dHJ5IHtcblx0XHRKU09OLnBhcnNlKG9iaik7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0b2F1dGhQcm92aWRlcnM6IGFzeW5jKCkgPT4ge1xuXHRcdFx0Ly8gZGVwZW5kcyBvbiByb2NrZXRjaGF0OmdyYW50IHBhY2thZ2Vcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGNvbnN0IHJlc3VsdCA9IEhUVFAuZ2V0KE1ldGVvci5hYnNvbHV0ZVVybCgnX29hdXRoX2FwcHMvcHJvdmlkZXJzJykpLmNvbnRlbnQ7XG5cblx0XHRcdFx0aWYgKGlzSlNPTihyZXN1bHQpKSB7XG5cdFx0XHRcdFx0Y29uc3QgcHJvdmlkZXJzID0gSlNPTi5wYXJzZShyZXN1bHQpLmRhdGE7XG5cblx0XHRcdFx0XHRyZXR1cm4gcHJvdmlkZXJzLm1hcCgobmFtZSkgPT4gKHsgbmFtZSB9KSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdDb3VsZCBub3QgcGFyc2UgdGhlIHJlc3VsdCcpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcigncm9ja2V0Y2hhdDpncmFudCBub3QgaW5zdGFsbGVkJyk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5pbXBvcnQgcHJvcGVydHkgZnJvbSAnbG9kYXNoLnByb3BlcnR5JztcblxuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWwtdHlwZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRDaGFubmVsOiB7XG5cdFx0aWQ6IHByb3BlcnR5KCdfaWQnKSxcblx0XHRuYW1lOiAocm9vdCwgYXJncywgeyB1c2VyIH0pID0+IHtcblx0XHRcdGlmIChyb290LnQgPT09ICdkJykge1xuXHRcdFx0XHRyZXR1cm4gcm9vdC51c2VybmFtZXMuZmluZCh1ID0+IHUgIT09IHVzZXIudXNlcm5hbWUpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcm9vdC5uYW1lO1xuXHRcdH0sXG5cdFx0bWVtYmVyczogKHJvb3QpID0+IHtcblx0XHRcdHJldHVybiByb290LnVzZXJuYW1lcy5tYXAoXG5cdFx0XHRcdHVzZXJuYW1lID0+IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKVxuXHRcdFx0KTtcblx0XHR9LFxuXHRcdG93bmVyczogKHJvb3QpID0+IHtcblx0XHRcdC8vIHRoZXJlIG1pZ2h0IGJlIG5vIG93bmVyXG5cdFx0XHRpZiAoIXJvb3QudSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBbUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5VXNlcm5hbWUocm9vdC51LnVzZXJuYW1lKV07XG5cdFx0fSxcblx0XHRudW1iZXJPZk1lbWJlcnM6IChyb290KSA9PiAocm9vdC51c2VybmFtZXMgfHwgW10pLmxlbmd0aCxcblx0XHRudW1iZXJPZk1lc3NhZ2VzOiBwcm9wZXJ0eSgnbXNncycpLFxuXHRcdHJlYWRPbmx5OiAocm9vdCkgPT4gcm9vdC5ybyA9PT0gdHJ1ZSxcblx0XHRkaXJlY3Q6IChyb290KSA9PiByb290LnQgPT09ICdkJyxcblx0XHRwcml2YXRlQ2hhbm5lbDogKHJvb3QpID0+IHJvb3QudCA9PT0gJ3AnLFxuXHRcdGZhdm91cml0ZTogKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCByb29tID0gUm9ja2V0Q2hhdC5tb2RlbHMuU3Vic2NyaXB0aW9ucy5maW5kT25lQnlSb29tSWRBbmRVc2VySWQocm9vdC5faWQsIHVzZXIuX2lkKTtcblxuXHRcdFx0cmV0dXJuIHJvb20gJiYgcm9vbS5mID09PSB0cnVlO1xuXHRcdH0sXG5cdFx0dW5zZWVuTWVzc2FnZXM6IChyb290LCBhcmdzLCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlN1YnNjcmlwdGlvbnMuZmluZE9uZUJ5Um9vbUlkQW5kVXNlcklkKHJvb3QuX2lkLCB1c2VyLl9pZCk7XG5cblx0XHRcdHJldHVybiAocm9vbSB8fCB7fSkudW5yZWFkO1xuXHRcdH1cblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9DaGFubmVsRmlsdGVyLWlucHV0LmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWxOYW1lQW5kRGlyZWN0LWlucHV0LmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL0NoYW5uZWxTb3J0LWVudW0uZ3JhcGhxbHMnO1xuXG5leHBvcnQge1xuXHRzY2hlbWFcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvY2hhbm5lbHMvUHJpdmFjeS1lbnVtLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHsgcm9vbVB1YmxpY0ZpZWxkcyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2NoYW5uZWxCeU5hbWUuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0UXVlcnk6IHtcblx0XHRjaGFubmVsQnlOYW1lOiBhdXRoZW50aWNhdGVkKChyb290LCB7IG5hbWUgfSkgPT4ge1xuXHRcdFx0Y29uc3QgcXVlcnkgPSB7XG5cdFx0XHRcdG5hbWUsXG5cdFx0XHRcdHQ6ICdjJ1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUocXVlcnksIHtcblx0XHRcdFx0ZmllbGRzOiByb29tUHVibGljRmllbGRzXG5cdFx0XHR9KTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgUm9ja2V0Q2hhdCB9IGZyb20gJ21ldGVvci9yb2NrZXRjaGF0OmxpYic7XG5cbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHsgcm9vbVB1YmxpY0ZpZWxkcyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL2NoYW5uZWxzL2NoYW5uZWxzLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0Y2hhbm5lbHM6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MpID0+IHtcblx0XHRcdGNvbnN0IHF1ZXJ5ID0ge307XG5cdFx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0XHRzb3J0OiB7XG5cdFx0XHRcdFx0bmFtZTogMVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRmaWVsZHM6IHJvb21QdWJsaWNGaWVsZHNcblx0XHRcdH07XG5cblx0XHRcdC8vIEZpbHRlclxuXHRcdFx0aWYgKHR5cGVvZiBhcmdzLmZpbHRlciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Ly8gbmFtZUZpbHRlclxuXHRcdFx0XHRpZiAodHlwZW9mIGFyZ3MuZmlsdGVyLm5hbWVGaWx0ZXIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdHF1ZXJ5Lm5hbWUgPSB7XG5cdFx0XHRcdFx0XHQkcmVnZXg6IG5ldyBSZWdFeHAoYXJncy5maWx0ZXIubmFtZUZpbHRlciwgJ2knKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBzb3J0Qnlcblx0XHRcdFx0aWYgKGFyZ3MuZmlsdGVyLnNvcnRCeSA9PT0gJ05VTUJFUl9PRl9NRVNTQUdFUycpIHtcblx0XHRcdFx0XHRvcHRpb25zLnNvcnQgPSB7XG5cdFx0XHRcdFx0XHRtc2dzOiAtMVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBwcml2YWN5XG5cdFx0XHRcdHN3aXRjaCAoYXJncy5maWx0ZXIucHJpdmFjeSkge1xuXHRcdFx0XHRcdGNhc2UgJ1BSSVZBVEUnOlxuXHRcdFx0XHRcdFx0cXVlcnkudCA9ICdwJztcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ1BVQkxJQyc6XG5cdFx0XHRcdFx0XHRxdWVyeS50ID0ge1xuXHRcdFx0XHRcdFx0XHQkbmU6ICdwJ1xuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kKHF1ZXJ5LCBvcHRpb25zKS5mZXRjaCgpO1xuXHRcdH0pXG5cdH1cbn07XG5cblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCB7IHJvb21QdWJsaWNGaWVsZHMgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9jaGFubmVsc0J5VXNlci5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRRdWVyeToge1xuXHRcdGNoYW5uZWxzQnlVc2VyOiBhdXRoZW50aWNhdGVkKChyb290LCB7IHVzZXJJZCB9KSA9PiB7XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZUJ5SWQodXNlcklkKTtcblxuXHRcdFx0aWYgKCF1c2VyKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignTm8gdXNlcicpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCByb29tcyA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeUNvbnRhaW5pbmdVc2VybmFtZSh1c2VyLnVzZXJuYW1lLCB7XG5cdFx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0XHRuYW1lOiAxXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGZpZWxkczogcm9vbVB1YmxpY0ZpZWxkc1xuXHRcdFx0fSkuZmV0Y2goKTtcblxuXHRcdFx0cmV0dXJuIHJvb21zO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuaW1wb3J0IHsgYXV0aGVudGljYXRlZCB9IGZyb20gJy4uLy4uL2hlbHBlcnMvYXV0aGVudGljYXRlZCc7XG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvY2hhbm5lbHMvY3JlYXRlQ2hhbm5lbC5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGNyZWF0ZUNoYW5uZWw6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRSb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUudmFsaWRhdGUoe1xuXHRcdFx0XHRcdHVzZXI6IHtcblx0XHRcdFx0XHRcdHZhbHVlOiB1c2VyLl9pZFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0bmFtZToge1xuXHRcdFx0XHRcdFx0dmFsdWU6IGFyZ3MubmFtZSxcblx0XHRcdFx0XHRcdGtleTogJ25hbWUnXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRtZW1iZXJzOiB7XG5cdFx0XHRcdFx0XHR2YWx1ZTogYXJncy5tZW1iZXJzSWQsXG5cdFx0XHRcdFx0XHRrZXk6ICdtZW1iZXJzSWQnXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgeyBjaGFubmVsIH0gPSBSb2NrZXRDaGF0LkFQSS5jaGFubmVscy5jcmVhdGUuZXhlY3V0ZSh1c2VyLl9pZCwge1xuXHRcdFx0XHRuYW1lOiBhcmdzLm5hbWUsXG5cdFx0XHRcdG1lbWJlcnM6IGFyZ3MubWVtYmVyc0lkXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIGNoYW5uZWw7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCB7IHJvb21QdWJsaWNGaWVsZHMgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9kaXJlY3RDaGFubmVsLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFF1ZXJ5OiB7XG5cdFx0ZGlyZWN0Q2hhbm5lbDogYXV0aGVudGljYXRlZCgocm9vdCwgeyB1c2VybmFtZSwgY2hhbm5lbElkIH0sIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCBxdWVyeSA9IHtcblx0XHRcdFx0dDogJ2QnLFxuXHRcdFx0XHR1c2VybmFtZXM6IHVzZXIudXNlcm5hbWVcblx0XHRcdH07XG5cblx0XHRcdGlmICh0eXBlb2YgdXNlcm5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGlmICh1c2VybmFtZSA9PT0gdXNlci51c2VybmFtZSkge1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBzcGVjaWZ5IHlvdXIgdXNlcm5hbWUnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHF1ZXJ5LnVzZXJuYW1lcyA9IHsgJGFsbDogWyB1c2VyLnVzZXJuYW1lLCB1c2VybmFtZSBdIH07XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjaGFubmVsSWQgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdHF1ZXJ5LmlkID0gY2hhbm5lbElkO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdVc2Ugb25lIG9mIHRob3NlIGZpZWxkczogdXNlcm5hbWUsIGNoYW5uZWxJZCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShxdWVyeSwge1xuXHRcdFx0XHRmaWVsZHM6IHJvb21QdWJsaWNGaWVsZHNcblx0XHRcdH0pO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9oaWRlQ2hhbm5lbC5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGhpZGVDaGFubmVsOiBhdXRoZW50aWNhdGVkKChyb290LCBhcmdzLCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3QgY2hhbm5lbCA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmUoe1xuXHRcdFx0XHRfaWQ6IGFyZ3MuY2hhbm5lbElkLFxuXHRcdFx0XHR0OiAnYydcblx0XHRcdH0pO1xuXG5cdFx0XHRpZiAoIWNoYW5uZWwpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdlcnJvci1yb29tLW5vdC1mb3VuZCcsICdUaGUgcmVxdWlyZWQgXCJjaGFubmVsSWRcIiBwYXJhbSBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCBhbnkgY2hhbm5lbCcpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBzdWIgPSBSb2NrZXRDaGF0Lm1vZGVscy5TdWJzY3JpcHRpb25zLmZpbmRPbmVCeVJvb21JZEFuZFVzZXJJZChjaGFubmVsLl9pZCwgdXNlci5faWQpO1xuXG5cdFx0XHRpZiAoIXN1Yikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSB1c2VyL2NhbGxlZSBpcyBub3QgaW4gdGhlIGNoYW5uZWwgXCIkeyBjaGFubmVsLm5hbWUgfS5gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFzdWIub3Blbikge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoYFRoZSBjaGFubmVsLCAkeyBjaGFubmVsLm5hbWUgfSwgaXMgYWxyZWFkeSBjbG9zZWQgdG8gdGhlIHNlbmRlcmApO1xuXHRcdFx0fVxuXG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCdoaWRlUm9vbScsIGNoYW5uZWwuX2lkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgbWVyZ2VUeXBlcywgbWVyZ2VSZXNvbHZlcnMgfSBmcm9tICdtZXJnZS1ncmFwaHFsLXNjaGVtYXMnO1xuXG4vLyBxdWVyaWVzXG5pbXBvcnQgKiBhcyBjaGFubmVscyBmcm9tICcuL2NoYW5uZWxzJztcbmltcG9ydCAqIGFzIGNoYW5uZWxCeU5hbWUgZnJvbSAnLi9jaGFubmVsQnlOYW1lJztcbmltcG9ydCAqIGFzIGRpcmVjdENoYW5uZWwgZnJvbSAnLi9kaXJlY3RDaGFubmVsJztcbmltcG9ydCAqIGFzIGNoYW5uZWxzQnlVc2VyIGZyb20gJy4vY2hhbm5lbHNCeVVzZXInO1xuLy8gbXV0YXRpb25zXG5pbXBvcnQgKiBhcyBjcmVhdGVDaGFubmVsIGZyb20gJy4vY3JlYXRlQ2hhbm5lbCc7XG5pbXBvcnQgKiBhcyBsZWF2ZUNoYW5uZWwgZnJvbSAnLi9sZWF2ZUNoYW5uZWwnO1xuaW1wb3J0ICogYXMgaGlkZUNoYW5uZWwgZnJvbSAnLi9oaWRlQ2hhbm5lbCc7XG4vLyB0eXBlc1xuaW1wb3J0ICogYXMgQ2hhbm5lbFR5cGUgZnJvbSAnLi9DaGFubmVsLXR5cGUnO1xuaW1wb3J0ICogYXMgQ2hhbm5lbFNvcnQgZnJvbSAnLi9DaGFubmVsU29ydC1lbnVtJztcbmltcG9ydCAqIGFzIENoYW5uZWxGaWx0ZXIgZnJvbSAnLi9DaGFubmVsRmlsdGVyLWlucHV0JztcbmltcG9ydCAqIGFzIFByaXZhY3kgZnJvbSAnLi9Qcml2YWN5LWVudW0nO1xuaW1wb3J0ICogYXMgQ2hhbm5lbE5hbWVBbmREaXJlY3QgZnJvbSAnLi9DaGFubmVsTmFtZUFuZERpcmVjdC1pbnB1dCc7XG5cbmV4cG9ydCBjb25zdCBzY2hlbWEgPSBtZXJnZVR5cGVzKFtcblx0Ly8gcXVlcmllc1xuXHRjaGFubmVscy5zY2hlbWEsXG5cdGNoYW5uZWxCeU5hbWUuc2NoZW1hLFxuXHRkaXJlY3RDaGFubmVsLnNjaGVtYSxcblx0Y2hhbm5lbHNCeVVzZXIuc2NoZW1hLFxuXHQvLyBtdXRhdGlvbnNcblx0Y3JlYXRlQ2hhbm5lbC5zY2hlbWEsXG5cdGxlYXZlQ2hhbm5lbC5zY2hlbWEsXG5cdGhpZGVDaGFubmVsLnNjaGVtYSxcblx0Ly8gdHlwZXNcblx0Q2hhbm5lbFR5cGUuc2NoZW1hLFxuXHRDaGFubmVsU29ydC5zY2hlbWEsXG5cdENoYW5uZWxGaWx0ZXIuc2NoZW1hLFxuXHRQcml2YWN5LnNjaGVtYSxcblx0Q2hhbm5lbE5hbWVBbmREaXJlY3Quc2NoZW1hXG5dKTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVycyA9IG1lcmdlUmVzb2x2ZXJzKFtcblx0Ly8gcXVlcmllc1xuXHRjaGFubmVscy5yZXNvbHZlcixcblx0Y2hhbm5lbEJ5TmFtZS5yZXNvbHZlcixcblx0ZGlyZWN0Q2hhbm5lbC5yZXNvbHZlcixcblx0Y2hhbm5lbHNCeVVzZXIucmVzb2x2ZXIsXG5cdC8vIG11dGF0aW9uc1xuXHRjcmVhdGVDaGFubmVsLnJlc29sdmVyLFxuXHRsZWF2ZUNoYW5uZWwucmVzb2x2ZXIsXG5cdGhpZGVDaGFubmVsLnJlc29sdmVyLFxuXHQvLyB0eXBlc1xuXHRDaGFubmVsVHlwZS5yZXNvbHZlclxuXSk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9jaGFubmVscy9sZWF2ZUNoYW5uZWwuZ3JhcGhxbHMnO1xuXG5jb25zdCByZXNvbHZlciA9IHtcblx0TXV0YXRpb246IHtcblx0XHRsZWF2ZUNoYW5uZWw6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCBjaGFubmVsID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZSh7XG5cdFx0XHRcdF9pZDogYXJncy5jaGFubmVsSWQsXG5cdFx0XHRcdHQ6ICdjJ1xuXHRcdFx0fSk7XG5cblx0XHRcdGlmICghY2hhbm5lbCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ2Vycm9yLXJvb20tbm90LWZvdW5kJywgJ1RoZSByZXF1aXJlZCBcImNoYW5uZWxJZFwiIHBhcmFtIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIGFueSBjaGFubmVsJyk7XG5cdFx0XHR9XG5cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2xlYXZlUm9vbScsIGNoYW5uZWwuX2lkKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiZXhwb3J0IGNvbnN0IHJvb21QdWJsaWNGaWVsZHMgPSB7XG5cdHQ6IDEsXG5cdG5hbWU6IDEsXG5cdGRlc2NyaXB0aW9uOiAxLFxuXHRhbm5vdW5jZW1lbnQ6IDEsXG5cdHRvcGljOiAxLFxuXHR1c2VybmFtZXM6IDEsXG5cdG1zZ3M6IDEsXG5cdHJvOiAxLFxuXHR1OiAxLFxuXHRhcmNoaXZlZDogMVxufTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuaW1wb3J0IHByb3BlcnR5IGZyb20gJ2xvZGFzaC5wcm9wZXJ0eSc7XG5cbmltcG9ydCB7IGRhdGVUb0Zsb2F0IH0gZnJvbSAnLi4vLi4vaGVscGVycy9kYXRlVG9GbG9hdCc7XG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvTWVzc2FnZS10eXBlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE1lc3NhZ2U6IHtcblx0XHRpZDogcHJvcGVydHkoJ19pZCcpLFxuXHRcdGNvbnRlbnQ6IHByb3BlcnR5KCdtc2cnKSxcblx0XHRjcmVhdGlvblRpbWU6IChyb290KSA9PiBkYXRlVG9GbG9hdChyb290LnRzKSxcblx0XHRhdXRob3I6IChyb290KSA9PiB7XG5cdFx0XHRjb25zdCB1c2VyID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZShyb290LnUuX2lkKTtcblxuXHRcdFx0cmV0dXJuIHVzZXIgfHwgcm9vdC51O1xuXHRcdH0sXG5cdFx0Y2hhbm5lbDogKHJvb3QpID0+IHtcblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHJvb3QucmlkKTtcblx0XHR9LFxuXHRcdGZyb21TZXJ2ZXI6IChyb290KSA9PiB0eXBlb2Ygcm9vdC50ICE9PSAndW5kZWZpbmVkJywgLy8gb24gYSBtZXNzYWdlIHNlbnQgYnkgdXNlciBgdHJ1ZWAgb3RoZXJ3aXNlIGBmYWxzZWBcblx0XHR0eXBlOiBwcm9wZXJ0eSgndCcpLFxuXHRcdGNoYW5uZWxSZWY6IChyb290KSA9PiB7XG5cdFx0XHRpZiAoIXJvb3QuY2hhbm5lbHMpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZCh7XG5cdFx0XHRcdF9pZDoge1xuXHRcdFx0XHRcdCRpbjogcm9vdC5jaGFubmVscy5tYXAoYyA9PiBjLl9pZClcblx0XHRcdFx0fVxuXHRcdFx0fSwge1xuXHRcdFx0XHRzb3J0OiB7XG5cdFx0XHRcdFx0bmFtZTogMVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5mZXRjaCgpO1xuXHRcdH0sXG5cdFx0dXNlclJlZjogKHJvb3QpID0+IHtcblx0XHRcdGlmICghcm9vdC5tZW50aW9ucykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kKHtcblx0XHRcdFx0X2lkOiB7XG5cdFx0XHRcdFx0JGluOiByb290Lm1lbnRpb25zLm1hcChjID0+IGMuX2lkKVxuXHRcdFx0XHR9XG5cdFx0XHR9LCB7XG5cdFx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0XHR1c2VybmFtZTogMVxuXHRcdFx0XHR9XG5cdFx0XHR9KS5mZXRjaCgpO1xuXHRcdH0sXG5cdFx0cmVhY3Rpb25zOiAocm9vdCkgPT4ge1xuXHRcdFx0aWYgKCFyb290LnJlYWN0aW9ucyB8fCBPYmplY3Qua2V5cyhyb290LnJlYWN0aW9ucykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgcmVhY3Rpb25zID0gW107XG5cblx0XHRcdE9iamVjdC5rZXlzKHJvb3QucmVhY3Rpb25zKS5mb3JFYWNoKGljb24gPT4ge1xuXHRcdFx0XHRyb290LnJlYWN0aW9uc1tpY29uXS51c2VybmFtZXMuZm9yRWFjaCh1c2VybmFtZSA9PiB7XG5cdFx0XHRcdFx0cmVhY3Rpb25zLnB1c2goe1xuXHRcdFx0XHRcdFx0aWNvbixcblx0XHRcdFx0XHRcdHVzZXJuYW1lXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiByZWFjdGlvbnM7XG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL01lc3NhZ2VJZGVudGlmaWVyLWlucHV0LmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL01lc3NhZ2VzV2l0aEN1cnNvci10eXBlLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL1JlYWN0aW9uLXR5cGUuZ3JhcGhxbHMnO1xuXG5leHBvcnQge1xuXHRzY2hlbWFcbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9hZGRSZWFjdGlvblRvTWVzc2FnZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGFkZFJlYWN0aW9uVG9NZXNzYWdlOiBhdXRoZW50aWNhdGVkKChyb290LCB7IGlkLCBpY29uIH0sIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRyZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcblx0XHRcdFx0TWV0ZW9yLnJ1bkFzVXNlcih1c2VyLl9pZCwgKCkgPT4ge1xuXHRcdFx0XHRcdE1ldGVvci5jYWxsKCdzZXRSZWFjdGlvbicsIGlkLm1lc3NhZ2VJZCwgaWNvbiwgKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmVzb2x2ZShSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lKGlkLm1lc3NhZ2VJZCkpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyB3aXRoRmlsdGVyIH0gZnJvbSAnZ3JhcGhxbC1zdWJzY3JpcHRpb25zJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBwdWJzdWIgfSBmcm9tICcuLi8uLi9zdWJzY3JpcHRpb25zJztcbmltcG9ydCB7IGF1dGhlbnRpY2F0ZWQgfSBmcm9tICcuLi8uLi9oZWxwZXJzL2F1dGhlbnRpY2F0ZWQnO1xuaW1wb3J0IHNjaGVtYSBmcm9tICcuLi8uLi9zY2hlbWFzL21lc3NhZ2VzL2NoYXRNZXNzYWdlQWRkZWQuZ3JhcGhxbHMnO1xuXG5leHBvcnQgY29uc3QgQ0hBVF9NRVNTQUdFX1NVQlNDUklQVElPTl9UT1BJQyA9ICdDSEFUX01FU1NBR0VfQURERUQnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHVibGlzaE1lc3NhZ2UobWVzc2FnZSkge1xuXHRwdWJzdWIucHVibGlzaChDSEFUX01FU1NBR0VfU1VCU0NSSVBUSU9OX1RPUElDLCB7IGNoYXRNZXNzYWdlQWRkZWQ6IG1lc3NhZ2UgfSk7XG59XG5cbmZ1bmN0aW9uIHNob3VsZFB1Ymxpc2gobWVzc2FnZSwgeyBpZCwgZGlyZWN0VG8gfSwgdXNlcm5hbWUpIHtcblx0aWYgKGlkKSB7XG5cdFx0cmV0dXJuIG1lc3NhZ2UucmlkID09PSBpZDtcblx0fSBlbHNlIGlmIChkaXJlY3RUbykge1xuXHRcdGNvbnN0IHJvb20gPSBSb2NrZXRDaGF0Lm1vZGVscy5Sb29tcy5maW5kT25lKHtcblx0XHRcdHVzZXJuYW1lczogeyAkYWxsOiBbZGlyZWN0VG8sIHVzZXJuYW1lXSB9LFxuXHRcdFx0dDogJ2QnXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcm9vbSAmJiByb29tLl9pZCA9PT0gbWVzc2FnZS5yaWQ7XG5cdH1cblxuXHRyZXR1cm4gZmFsc2U7XG59XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRTdWJzY3JpcHRpb246IHtcblx0XHRjaGF0TWVzc2FnZUFkZGVkOiB7XG5cdFx0XHRzdWJzY3JpYmU6IHdpdGhGaWx0ZXIoKCkgPT4gcHVic3ViLmFzeW5jSXRlcmF0b3IoQ0hBVF9NRVNTQUdFX1NVQlNDUklQVElPTl9UT1BJQyksIGF1dGhlbnRpY2F0ZWQoKHBheWxvYWQsIGFyZ3MsIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRcdGNvbnN0IGNoYW5uZWwgPSB7XG5cdFx0XHRcdFx0aWQ6IGFyZ3MuY2hhbm5lbElkLFxuXHRcdFx0XHRcdGRpcmVjdFRvOiBhcmdzLmRpcmVjdFRvXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIHNob3VsZFB1Ymxpc2gocGF5bG9hZC5jaGF0TWVzc2FnZUFkZGVkLCBjaGFubmVsLCB1c2VyLnVzZXJuYW1lKTtcblx0XHRcdH0pKVxuXHRcdH1cblx0fVxufTtcblxuUm9ja2V0Q2hhdC5jYWxsYmFja3MuYWRkKCdhZnRlclNhdmVNZXNzYWdlJywgKG1lc3NhZ2UpID0+IHtcblx0cHVibGlzaE1lc3NhZ2UobWVzc2FnZSk7XG59LCBudWxsLCAnY2hhdE1lc3NhZ2VBZGRlZFN1YnNjcmlwdGlvbicpO1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuaW1wb3J0IHsgYXV0aGVudGljYXRlZCB9IGZyb20gJy4uLy4uL2hlbHBlcnMvYXV0aGVudGljYXRlZCc7XG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvbWVzc2FnZXMvZGVsZXRlTWVzc2FnZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGRlbGV0ZU1lc3NhZ2U6IGF1dGhlbnRpY2F0ZWQoKHJvb3QsIHsgaWQgfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdGNvbnN0IG1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmVCeUlkKGlkLm1lc3NhZ2VJZCwgeyBmaWVsZHM6IHsgdTogMSwgcmlkOiAxIH19KTtcblxuXHRcdFx0aWYgKCFtc2cpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKGBObyBtZXNzYWdlIGZvdW5kIHdpdGggdGhlIGlkIG9mIFwiJHsgaWQubWVzc2FnZUlkIH1cIi5gKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGlkLmNoYW5uZWxJZCAhPT0gbXNnLnJpZCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RoZSByb29tIGlkIHByb3ZpZGVkIGRvZXMgbm90IG1hdGNoIHdoZXJlIHRoZSBtZXNzYWdlIGlzIGZyb20uJyk7XG5cdFx0XHR9XG5cblx0XHRcdE1ldGVvci5ydW5Bc1VzZXIodXNlci5faWQsICgpID0+IHtcblx0XHRcdFx0TWV0ZW9yLmNhbGwoJ2RlbGV0ZU1lc3NhZ2UnLCB7IF9pZDogbXNnLl9pZCB9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbXNnO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9lZGl0TWVzc2FnZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdGVkaXRNZXNzYWdlOiBhdXRoZW50aWNhdGVkKChyb290LCB7IGlkLCBjb250ZW50IH0sIHsgdXNlciB9KSA9PiB7XG5cdFx0XHRjb25zdCBtc2cgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChpZC5tZXNzYWdlSWQpO1xuXG5cdFx0XHQvL0Vuc3VyZSB0aGUgbWVzc2FnZSBleGlzdHNcblx0XHRcdGlmICghbXNnKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihgTm8gbWVzc2FnZSBmb3VuZCB3aXRoIHRoZSBpZCBvZiBcIiR7IGlkLm1lc3NhZ2VJZCB9XCIuYCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpZC5jaGFubmVsSWQgIT09IG1zZy5yaWQpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUaGUgY2hhbm5lbCBpZCBwcm92aWRlZCBkb2VzIG5vdCBtYXRjaCB3aGVyZSB0aGUgbWVzc2FnZSBpcyBmcm9tLicpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL1Blcm1pc3Npb24gY2hlY2tzIGFyZSBhbHJlYWR5IGRvbmUgaW4gdGhlIHVwZGF0ZU1lc3NhZ2UgbWV0aG9kLCBzbyBubyBuZWVkIHRvIGR1cGxpY2F0ZSB0aGVtXG5cdFx0XHRNZXRlb3IucnVuQXNVc2VyKHVzZXIuX2lkLCAoKSA9PiB7XG5cdFx0XHRcdE1ldGVvci5jYWxsKCd1cGRhdGVNZXNzYWdlJywgeyBfaWQ6IG1zZy5faWQsIG1zZzogY29udGVudCwgcmlkOiBtc2cucmlkIH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lQnlJZChtc2cuX2lkKTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiaW1wb3J0IHsgbWVyZ2VUeXBlcywgbWVyZ2VSZXNvbHZlcnMgfSBmcm9tICdtZXJnZS1ncmFwaHFsLXNjaGVtYXMnO1xuXG4vLyBxdWVyaWVzXG5pbXBvcnQgKiBhcyBtZXNzYWdlcyBmcm9tICcuL21lc3NhZ2VzJztcbi8vIG11dGF0aW9uc1xuaW1wb3J0ICogYXMgc2VuZE1lc3NhZ2UgZnJvbSAnLi9zZW5kTWVzc2FnZSc7XG5pbXBvcnQgKiBhcyBlZGl0TWVzc2FnZSBmcm9tICcuL2VkaXRNZXNzYWdlJztcbmltcG9ydCAqIGFzIGRlbGV0ZU1lc3NhZ2UgZnJvbSAnLi9kZWxldGVNZXNzYWdlJztcbmltcG9ydCAqIGFzIGFkZFJlYWN0aW9uVG9NZXNzYWdlIGZyb20gJy4vYWRkUmVhY3Rpb25Ub01lc3NhZ2UnO1xuLy8gc3Vic2NyaXB0aW9uc1xuaW1wb3J0ICogYXMgY2hhdE1lc3NhZ2VBZGRlZCBmcm9tICcuL2NoYXRNZXNzYWdlQWRkZWQnO1xuLy8gdHlwZXNcbmltcG9ydCAqIGFzIE1lc3NhZ2VUeXBlIGZyb20gJy4vTWVzc2FnZS10eXBlJztcbmltcG9ydCAqIGFzIE1lc3NhZ2VzV2l0aEN1cnNvclR5cGUgZnJvbSAnLi9NZXNzYWdlc1dpdGhDdXJzb3ItdHlwZSc7XG5pbXBvcnQgKiBhcyBNZXNzYWdlSWRlbnRpZmllciBmcm9tICcuL01lc3NhZ2VJZGVudGlmaWVyLWlucHV0JztcbmltcG9ydCAqIGFzIFJlYWN0aW9uVHlwZSBmcm9tICcuL1JlYWN0aW9uLXR5cGUnO1xuXG5leHBvcnQgY29uc3Qgc2NoZW1hID0gbWVyZ2VUeXBlcyhbXG5cdC8vIHF1ZXJpZXNcblx0bWVzc2FnZXMuc2NoZW1hLFxuXHQvLyBtdXRhdGlvbnNcblx0c2VuZE1lc3NhZ2Uuc2NoZW1hLFxuXHRlZGl0TWVzc2FnZS5zY2hlbWEsXG5cdGRlbGV0ZU1lc3NhZ2Uuc2NoZW1hLFxuXHRhZGRSZWFjdGlvblRvTWVzc2FnZS5zY2hlbWEsXG5cdC8vIHN1YnNjcmlwdGlvbnNcblx0Y2hhdE1lc3NhZ2VBZGRlZC5zY2hlbWEsXG5cdC8vIHR5cGVzXG5cdE1lc3NhZ2VUeXBlLnNjaGVtYSxcblx0TWVzc2FnZXNXaXRoQ3Vyc29yVHlwZS5zY2hlbWEsXG5cdE1lc3NhZ2VJZGVudGlmaWVyLnNjaGVtYSxcblx0UmVhY3Rpb25UeXBlLnNjaGVtYVxuXSk7XG5cbmV4cG9ydCBjb25zdCByZXNvbHZlcnMgPSBtZXJnZVJlc29sdmVycyhbXG5cdC8vIHF1ZXJpZXNcblx0bWVzc2FnZXMucmVzb2x2ZXIsXG5cdC8vIG11dGF0aW9uc1xuXHRzZW5kTWVzc2FnZS5yZXNvbHZlcixcblx0ZWRpdE1lc3NhZ2UucmVzb2x2ZXIsXG5cdGRlbGV0ZU1lc3NhZ2UucmVzb2x2ZXIsXG5cdGFkZFJlYWN0aW9uVG9NZXNzYWdlLnJlc29sdmVyLFxuXHQvLyBzdWJzY3JpcHRpb25zXG5cdGNoYXRNZXNzYWdlQWRkZWQucmVzb2x2ZXIsXG5cdC8vIHR5cGVzXG5cdE1lc3NhZ2VUeXBlLnJlc29sdmVyXG5dKTtcbiIsImltcG9ydCB7IFJvY2tldENoYXQgfSBmcm9tICdtZXRlb3Ivcm9ja2V0Y2hhdDpsaWInO1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9tZXNzYWdlcy5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRRdWVyeToge1xuXHRcdG1lc3NhZ2VzOiBhdXRoZW50aWNhdGVkKChyb290LCBhcmdzLCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Y29uc3QgbWVzc2FnZXNRdWVyeSA9IHt9O1xuXHRcdFx0Y29uc3QgbWVzc2FnZXNPcHRpb25zID0ge1xuXHRcdFx0XHRzb3J0OiB7IHRzOiAtMSB9XG5cdFx0XHR9O1xuXHRcdFx0Y29uc3QgY2hhbm5lbFF1ZXJ5ID0ge307XG5cdFx0XHRjb25zdCBpc1BhZ2luYXRpb24gPSAhIWFyZ3MuY3Vyc29yIHx8IGFyZ3MuY291bnQgPiAwO1xuXHRcdFx0bGV0IGN1cnNvcjtcblxuXHRcdFx0aWYgKGFyZ3MuY2hhbm5lbElkKSB7XG5cdFx0XHRcdC8vIGNoYW5uZWxJZFxuXHRcdFx0XHRjaGFubmVsUXVlcnkuX2lkID0gYXJncy5jaGFubmVsSWQ7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ3MuZGlyZWN0VG8pIHtcblx0XHRcdFx0Ly8gZGlyZWN0IG1lc3NhZ2Ugd2hlcmUgZGlyZWN0VG8gaXMgYSB1c2VyIGlkXG5cdFx0XHRcdGNoYW5uZWxRdWVyeS50ID0gJ2QnO1xuXHRcdFx0XHRjaGFubmVsUXVlcnkudXNlcm5hbWVzID0geyAkYWxsOiBbYXJncy5kaXJlY3RUbywgdXNlci51c2VybmFtZV0gfTtcblx0XHRcdH0gZWxzZSBpZiAoYXJncy5jaGFubmVsTmFtZSkge1xuXHRcdFx0XHQvLyBub24tZGlyZWN0IGNoYW5uZWxcblx0XHRcdFx0Y2hhbm5lbFF1ZXJ5LnQgPSB7ICRuZTogJ2QnIH07XG5cdFx0XHRcdGNoYW5uZWxRdWVyeS5uYW1lID0gYXJncy5jaGFubmVsTmFtZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ21lc3NhZ2VzIHF1ZXJ5IG11c3QgYmUgY2FsbGVkIHdpdGggY2hhbm5lbElkIG9yIGRpcmVjdFRvJyk7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBjaGFubmVsID0gUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZE9uZShjaGFubmVsUXVlcnkpO1xuXG5cdFx0XHRsZXQgbWVzc2FnZXNBcnJheSA9IFtdO1xuXG5cdFx0XHRpZiAoY2hhbm5lbCkge1xuXHRcdFx0XHQvLyBjdXJzb3Jcblx0XHRcdFx0aWYgKGlzUGFnaW5hdGlvbiAmJiBhcmdzLmN1cnNvcikge1xuXHRcdFx0XHRcdGNvbnN0IGN1cnNvck1zZyA9IFJvY2tldENoYXQubW9kZWxzLk1lc3NhZ2VzLmZpbmRPbmUoYXJncy5jdXJzb3IsIHsgZmllbGRzOiB7IHRzOiAxIH0gfSk7XG5cdFx0XHRcdFx0bWVzc2FnZXNRdWVyeS50cyA9IHsgJGx0OiBjdXJzb3JNc2cudHMgfTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIHNlYXJjaFxuXHRcdFx0XHRpZiAodHlwZW9mIGFyZ3Muc2VhcmNoUmVnZXggPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0bWVzc2FnZXNRdWVyeS5tc2cgPSB7XG5cdFx0XHRcdFx0XHQkcmVnZXg6IG5ldyBSZWdFeHAoYXJncy5zZWFyY2hSZWdleCwgJ2knKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBjb3VudFxuXHRcdFx0XHRpZiAoaXNQYWdpbmF0aW9uICYmIGFyZ3MuY291bnQpIHtcblx0XHRcdFx0XHRtZXNzYWdlc09wdGlvbnMubGltaXQgPSBhcmdzLmNvdW50O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gZXhjbHVkZSBtZXNzYWdlcyBnZW5lcmF0ZWQgYnkgc2VydmVyXG5cdFx0XHRcdGlmIChhcmdzLmV4Y2x1ZGVTZXJ2ZXIgPT09IHRydWUpIHtcblx0XHRcdFx0XHRtZXNzYWdlc1F1ZXJ5LnQgPSB7ICRleGlzdHM6IGZhbHNlIH07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBsb29rIGZvciBtZXNzYWdlcyB0aGF0IGJlbG9uZ3MgdG8gc3BlY2lmaWMgY2hhbm5lbFxuXHRcdFx0XHRtZXNzYWdlc1F1ZXJ5LnJpZCA9IGNoYW5uZWwuX2lkO1xuXG5cdFx0XHRcdGNvbnN0IG1lc3NhZ2VzID0gUm9ja2V0Q2hhdC5tb2RlbHMuTWVzc2FnZXMuZmluZChtZXNzYWdlc1F1ZXJ5LCBtZXNzYWdlc09wdGlvbnMpO1xuXG5cdFx0XHRcdG1lc3NhZ2VzQXJyYXkgPSBtZXNzYWdlcy5mZXRjaCgpO1xuXG5cdFx0XHRcdGlmIChpc1BhZ2luYXRpb24pIHtcblx0XHRcdFx0XHQvLyBvbGRlc3QgZmlyc3QgKGJlY2F1c2Ugb2YgZmluZE9uZSlcblx0XHRcdFx0XHRtZXNzYWdlc09wdGlvbnMuc29ydC50cyA9IDE7XG5cblx0XHRcdFx0XHRjb25zdCBmaXJzdE1lc3NhZ2UgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kT25lKG1lc3NhZ2VzUXVlcnksIG1lc3NhZ2VzT3B0aW9ucyk7XG5cdFx0XHRcdFx0Y29uc3QgbGFzdElkID0gKG1lc3NhZ2VzQXJyYXlbbWVzc2FnZXNBcnJheS5sZW5ndGggLSAxXSB8fCB7fSkuX2lkO1xuXG5cdFx0XHRcdFx0Y3Vyc29yID0gIWxhc3RJZCB8fCBsYXN0SWQgPT09IGZpcnN0TWVzc2FnZS5faWQgPyBudWxsIDogbGFzdElkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGN1cnNvcixcblx0XHRcdFx0Y2hhbm5lbCxcblx0XHRcdFx0bWVzc2FnZXNBcnJheVxuXHRcdFx0fTtcblx0XHR9KVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHRzY2hlbWEsXG5cdHJlc29sdmVyXG59O1xuIiwiLyogZ2xvYmFsIHByb2Nlc3NXZWJob29rTWVzc2FnZSAqL1xuXG5pbXBvcnQgeyBhdXRoZW50aWNhdGVkIH0gZnJvbSAnLi4vLi4vaGVscGVycy9hdXRoZW50aWNhdGVkJztcbmltcG9ydCBzY2hlbWEgZnJvbSAnLi4vLi4vc2NoZW1hcy9tZXNzYWdlcy9zZW5kTWVzc2FnZS5ncmFwaHFscyc7XG5cbmNvbnN0IHJlc29sdmVyID0ge1xuXHRNdXRhdGlvbjoge1xuXHRcdHNlbmRNZXNzYWdlOiBhdXRoZW50aWNhdGVkKChyb290LCB7IGNoYW5uZWxJZCwgZGlyZWN0VG8sIGNvbnRlbnQgfSwgeyB1c2VyIH0pID0+IHtcblx0XHRcdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0XHRcdHRleHQ6IGNvbnRlbnQsXG5cdFx0XHRcdGNoYW5uZWw6IGNoYW5uZWxJZCB8fCBkaXJlY3RUb1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3QgbWVzc2FnZVJldHVybiA9IHByb2Nlc3NXZWJob29rTWVzc2FnZShvcHRpb25zLCB1c2VyKVswXTtcblxuXHRcdFx0aWYgKCFtZXNzYWdlUmV0dXJuKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVW5rbm93biBlcnJvcicpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbWVzc2FnZVJldHVybi5tZXNzYWdlO1xuXHRcdH0pXG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcbmltcG9ydCBwcm9wZXJ0eSBmcm9tICdsb2Rhc2gucHJvcGVydHknO1xuXG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvdXNlcnMvVXNlci10eXBlLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdFVzZXI6IHtcblx0XHRpZDogcHJvcGVydHkoJ19pZCcpLFxuXHRcdHN0YXR1czogKHtzdGF0dXN9KSA9PiBzdGF0dXMudG9VcHBlckNhc2UoKSxcblx0XHRhdmF0YXI6IGFzeW5jKHsgX2lkIH0pID0+IHtcblx0XHRcdC8vIFhYWCBqcy1hY2NvdW50cy9ncmFwaHFsIzE2XG5cdFx0XHRjb25zdCBhdmF0YXIgPSBhd2FpdCBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLm1vZGVsLnJhd0NvbGxlY3Rpb24oKS5maW5kT25lKHtcblx0XHRcdFx0dXNlcklkOiBfaWRcblx0XHRcdH0sIHsgZmllbGRzOiB7IHVybDogMSB9fSk7XG5cblx0XHRcdGlmIChhdmF0YXIpIHtcblx0XHRcdFx0cmV0dXJuIGF2YXRhci51cmw7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjaGFubmVsczogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChhc3luYyh7IF9pZCB9KSA9PiB7XG5cdFx0XHRyZXR1cm4gYXdhaXQgUm9ja2V0Q2hhdC5tb2RlbHMuUm9vbXMuZmluZEJ5U3Vic2NyaXB0aW9uVXNlcklkKF9pZCkuZmV0Y2goKTtcblx0XHR9KSxcblx0XHRkaXJlY3RNZXNzYWdlczogKHsgdXNlcm5hbWUgfSkgPT4ge1xuXHRcdFx0cmV0dXJuIFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRCeVR5cGVDb250YWluaW5nVXNlcm5hbWUoJ2QnLCB1c2VybmFtZSkuZmV0Y2goKTtcblx0XHR9XG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHNjaGVtYSxcblx0cmVzb2x2ZXJcbn07XG4iLCJpbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvdXNlcnMvVXNlclN0YXR1cy1lbnVtLmdyYXBocWxzJztcblxuZXhwb3J0IHtcblx0c2NoZW1hXG59O1xuIiwiaW1wb3J0IHsgbWVyZ2VUeXBlcywgbWVyZ2VSZXNvbHZlcnMgfSBmcm9tICdtZXJnZS1ncmFwaHFsLXNjaGVtYXMnO1xuXG4vLyBtdXRhdGlvbnNcbmltcG9ydCAqIGFzIHNldFN0YXR1cyBmcm9tICcuL3NldFN0YXR1cyc7XG4vLyB0eXBlc1xuaW1wb3J0ICogYXMgVXNlclR5cGUgZnJvbSAnLi9Vc2VyLXR5cGUnO1xuaW1wb3J0ICogYXMgVXNlclN0YXR1cyBmcm9tICcuL1VzZXJTdGF0dXMtZW51bSc7XG5cbmV4cG9ydCBjb25zdCBzY2hlbWEgPSBtZXJnZVR5cGVzKFtcblx0Ly8gbXV0YXRpb25zXG5cdHNldFN0YXR1cy5zY2hlbWEsXG5cdC8vIHR5cGVzXG5cdFVzZXJUeXBlLnNjaGVtYSxcblx0VXNlclN0YXR1cy5zY2hlbWFcbl0pO1xuXG5leHBvcnQgY29uc3QgcmVzb2x2ZXJzID0gbWVyZ2VSZXNvbHZlcnMoW1xuXHQvLyBtdXRhdGlvbnNcblx0c2V0U3RhdHVzLnJlc29sdmVyLFxuXHQvLyB0eXBlc1xuXHRVc2VyVHlwZS5yZXNvbHZlclxuXSk7XG4iLCJpbXBvcnQgeyBSb2NrZXRDaGF0IH0gZnJvbSAnbWV0ZW9yL3JvY2tldGNoYXQ6bGliJztcblxuaW1wb3J0IHsgYXV0aGVudGljYXRlZCB9IGZyb20gJy4uLy4uL2hlbHBlcnMvYXV0aGVudGljYXRlZCc7XG5pbXBvcnQgc2NoZW1hIGZyb20gJy4uLy4uL3NjaGVtYXMvdXNlcnMvc2V0U3RhdHVzLmdyYXBocWxzJztcblxuY29uc3QgcmVzb2x2ZXIgPSB7XG5cdE11dGF0aW9uOiB7XG5cdFx0c2V0U3RhdHVzOiBhdXRoZW50aWNhdGVkKChyb290LCB7IHN0YXR1cyB9LCB7IHVzZXIgfSkgPT4ge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMudXBkYXRlKHVzZXIuX2lkLCB7XG5cdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRzdGF0dXM6IHN0YXR1cy50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuVXNlcnMuZmluZE9uZSh1c2VyLl9pZCk7XG5cdFx0fSlcblx0fVxufTtcblxuZXhwb3J0IHtcblx0c2NoZW1hLFxuXHRyZXNvbHZlclxufTtcbiJdfQ==
