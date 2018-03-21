(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var WebAppHashing = Package['webapp-hashing'].WebAppHashing;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:assets":{"server":{"assets.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                              //
// packages/rocketchat_assets/server/assets.js                                                                  //
//                                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let sizeOf;
module.watch(require("image-size"), {
  default(v) {
    sizeOf = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let crypto;
module.watch(require("crypto"), {
  default(v) {
    crypto = v;
  }

}, 3);
mime.extensions['image/vnd.microsoft.icon'] = ['ico'];
const RocketChatAssetsInstance = new RocketChatFile.GridFS({
  name: 'assets'
});
this.RocketChatAssetsInstance = RocketChatAssetsInstance;
const assets = {
  logo: {
    label: 'logo (svg, png, jpg)',
    defaultUrl: 'images/logo/logo.svg',
    constraints: {
      type: 'image',
      extensions: ['svg', 'png', 'jpg', 'jpeg'],
      width: undefined,
      height: undefined
    }
  },
  favicon_ico: {
    label: 'favicon (ico)',
    defaultUrl: 'favicon.ico',
    constraints: {
      type: 'image',
      extensions: ['ico'],
      width: undefined,
      height: undefined
    }
  },
  favicon: {
    label: 'favicon (svg)',
    defaultUrl: 'images/logo/icon.svg',
    constraints: {
      type: 'image',
      extensions: ['svg'],
      width: undefined,
      height: undefined
    }
  },
  favicon_16: {
    label: 'favicon 16x16 (png)',
    defaultUrl: 'images/logo/favicon-16x16.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 16,
      height: 16
    }
  },
  favicon_32: {
    label: 'favicon 32x32 (png)',
    defaultUrl: 'images/logo/favicon-32x32.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 32,
      height: 32
    }
  },
  favicon_192: {
    label: 'android-chrome 192x192 (png)',
    defaultUrl: 'images/logo/android-chrome-192x192.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 192,
      height: 192
    }
  },
  favicon_512: {
    label: 'android-chrome 512x512 (png)',
    defaultUrl: 'images/logo/512x512.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 512,
      height: 512
    }
  },
  touchicon_180: {
    label: 'apple-touch-icon 180x180 (png)',
    defaultUrl: 'images/logo/apple-touch-icon.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 180,
      height: 180
    }
  },
  touchicon_180_pre: {
    label: 'apple-touch-icon-precomposed 180x180 (png)',
    defaultUrl: 'images/logo/apple-touch-icon-precomposed.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 180,
      height: 180
    }
  },
  tile_144: {
    label: 'mstile 144x144 (png)',
    defaultUrl: 'images/logo/mstile-144x144.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 144,
      height: 144
    }
  },
  tile_150: {
    label: 'mstile 150x150 (png)',
    defaultUrl: 'images/logo/mstile-150x150.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 150,
      height: 150
    }
  },
  tile_310_square: {
    label: 'mstile 310x310 (png)',
    defaultUrl: 'images/logo/mstile-310x310.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 310,
      height: 310
    }
  },
  tile_310_wide: {
    label: 'mstile 310x150 (png)',
    defaultUrl: 'images/logo/mstile-310x150.png',
    constraints: {
      type: 'image',
      extensions: ['png'],
      width: 310,
      height: 150
    }
  },
  safari_pinned: {
    label: 'safari pinned tab (svg)',
    defaultUrl: 'images/logo/safari-pinned-tab.svg',
    constraints: {
      type: 'image',
      extensions: ['svg'],
      width: undefined,
      height: undefined
    }
  }
};
RocketChat.Assets = new class {
  get mime() {
    return mime;
  }

  get assets() {
    return assets;
  }

  setAsset(binaryContent, contentType, asset) {
    if (!assets[asset]) {
      throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
        function: 'RocketChat.Assets.setAsset'
      });
    }

    const extension = mime.extension(contentType);

    if (assets[asset].constraints.extensions.includes(extension) === false) {
      throw new Meteor.Error(contentType, `Invalid file type: ${contentType}`, {
        function: 'RocketChat.Assets.setAsset',
        errorTitle: 'error-invalid-file-type'
      });
    }

    const file = new Buffer(binaryContent, 'binary');

    if (assets[asset].constraints.width || assets[asset].constraints.height) {
      const dimensions = sizeOf(file);

      if (assets[asset].constraints.width && assets[asset].constraints.width !== dimensions.width) {
        throw new Meteor.Error('error-invalid-file-width', 'Invalid file width', {
          function: 'Invalid file width'
        });
      }

      if (assets[asset].constraints.height && assets[asset].constraints.height !== dimensions.height) {
        throw new Meteor.Error('error-invalid-file-height');
      }
    }

    const rs = RocketChatFile.bufferToStream(file);
    RocketChatAssetsInstance.deleteFile(asset);
    const ws = RocketChatAssetsInstance.createWriteStream(asset, contentType);
    ws.on('end', Meteor.bindEnvironment(function () {
      return Meteor.setTimeout(function () {
        const key = `Assets_${asset}`;
        const value = {
          url: `assets/${asset}.${extension}`,
          defaultUrl: assets[asset].defaultUrl
        };
        RocketChat.settings.updateById(key, value);
        return RocketChat.Assets.processAsset(key, value);
      }, 200);
    }));
    rs.pipe(ws);
  }

  unsetAsset(asset) {
    if (!assets[asset]) {
      throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
        function: 'RocketChat.Assets.unsetAsset'
      });
    }

    RocketChatAssetsInstance.deleteFile(asset);
    const key = `Assets_${asset}`;
    const value = {
      defaultUrl: assets[asset].defaultUrl
    };
    RocketChat.settings.updateById(key, value);
    RocketChat.Assets.processAsset(key, value);
  }

  refreshClients() {
    return process.emit('message', {
      refresh: 'client'
    });
  }

  processAsset(settingKey, settingValue) {
    if (settingKey.indexOf('Assets_') !== 0) {
      return;
    }

    const assetKey = settingKey.replace(/^Assets_/, '');
    const assetValue = assets[assetKey];

    if (!assetValue) {
      return;
    }

    if (!settingValue || !settingValue.url) {
      assetValue.cache = undefined;
      return;
    }

    const file = RocketChatAssetsInstance.getFileSync(assetKey);

    if (!file) {
      assetValue.cache = undefined;
      return;
    }

    const hash = crypto.createHash('sha1').update(file.buffer).digest('hex');
    const extension = settingValue.url.split('.').pop();
    return assetValue.cache = {
      path: `assets/${assetKey}.${extension}`,
      cacheable: false,
      sourceMapUrl: undefined,
      where: 'client',
      type: 'asset',
      content: file.buffer,
      extension,
      url: `/assets/${assetKey}.${extension}?${hash}`,
      size: file.length,
      uploadDate: file.uploadDate,
      contentType: file.contentType,
      hash
    };
  }

}();
RocketChat.settings.addGroup('Assets');
RocketChat.settings.add('Assets_SvgFavicon_Enable', true, {
  type: 'boolean',
  group: 'Assets',
  i18nLabel: 'Enable_Svg_Favicon'
});

function addAssetToSetting(key, value) {
  return RocketChat.settings.add(`Assets_${key}`, {
    defaultUrl: value.defaultUrl
  }, {
    type: 'asset',
    group: 'Assets',
    fileConstraints: value.constraints,
    i18nLabel: value.label,
    asset: key,
    public: true
  });
}

for (const key of Object.keys(assets)) {
  const value = assets[key];
  addAssetToSetting(key, value);
}

RocketChat.models.Settings.find().observe({
  added(record) {
    return RocketChat.Assets.processAsset(record._id, record.value);
  },

  changed(record) {
    return RocketChat.Assets.processAsset(record._id, record.value);
  },

  removed(record) {
    return RocketChat.Assets.processAsset(record._id, undefined);
  }

});
Meteor.startup(function () {
  return Meteor.setTimeout(function () {
    return process.emit('message', {
      refresh: 'client'
    });
  }, 200);
});
const calculateClientHash = WebAppHashing.calculateClientHash;

WebAppHashing.calculateClientHash = function (manifest, includeFilter, runtimeConfigOverride) {
  for (const key of Object.keys(assets)) {
    const value = assets[key];

    if (!value.cache && !value.defaultUrl) {
      continue;
    }

    let cache = {};

    if (value.cache) {
      cache = {
        path: value.cache.path,
        cacheable: value.cache.cacheable,
        sourceMapUrl: value.cache.sourceMapUrl,
        where: value.cache.where,
        type: value.cache.type,
        url: value.cache.url,
        size: value.cache.size,
        hash: value.cache.hash
      };
      WebAppInternals.staticFiles[`/__cordova/assets/${key}`] = value.cache;
      WebAppInternals.staticFiles[`/__cordova/assets/${key}.${value.cache.extension}`] = value.cache;
    } else {
      const extension = value.defaultUrl.split('.').pop();
      cache = {
        path: `assets/${key}.${extension}`,
        cacheable: false,
        sourceMapUrl: undefined,
        where: 'client',
        type: 'asset',
        url: `/assets/${key}.${extension}?v3`,
        hash: 'v3'
      };
      WebAppInternals.staticFiles[`/__cordova/assets/${key}`] = WebAppInternals.staticFiles[`/__cordova/${value.defaultUrl}`];
      WebAppInternals.staticFiles[`/__cordova/assets/${key}.${extension}`] = WebAppInternals.staticFiles[`/__cordova/${value.defaultUrl}`];
    }

    const manifestItem = _.findWhere(manifest, {
      path: key
    });

    if (manifestItem) {
      const index = manifest.indexOf(manifestItem);
      manifest[index] = cache;
    } else {
      manifest.push(cache);
    }
  }

  return calculateClientHash.call(this, manifest, includeFilter, runtimeConfigOverride);
};

Meteor.methods({
  refreshClients() {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'refreshClients'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-now-allowed', 'Managing assets not allowed', {
        method: 'refreshClients',
        action: 'Managing_assets'
      });
    }

    return RocketChat.Assets.refreshClients();
  },

  unsetAsset(asset) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'unsetAsset'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-now-allowed', 'Managing assets not allowed', {
        method: 'unsetAsset',
        action: 'Managing_assets'
      });
    }

    return RocketChat.Assets.unsetAsset(asset);
  },

  setAsset(binaryContent, contentType, asset) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'setAsset'
      });
    }

    const hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'manage-assets');

    if (!hasPermission) {
      throw new Meteor.Error('error-action-now-allowed', 'Managing assets not allowed', {
        method: 'setAsset',
        action: 'Managing_assets'
      });
    }

    RocketChat.Assets.setAsset(binaryContent, contentType, asset);
  }

});
WebApp.connectHandlers.use('/assets/', Meteor.bindEnvironment(function (req, res, next) {
  const params = {
    asset: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')).replace(/\.[^.]*$/, '')
  };
  const file = assets[params.asset] && assets[params.asset].cache;

  if (!file) {
    if (assets[params.asset] && assets[params.asset].defaultUrl) {
      req.url = `/${assets[params.asset].defaultUrl}`;
      WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFiles, req, res, next);
    } else {
      res.writeHead(404);
      res.end();
    }

    return;
  }

  const reqModifiedHeader = req.headers['if-modified-since'];

  if (reqModifiedHeader) {
    if (reqModifiedHeader === (file.uploadDate && file.uploadDate.toUTCString())) {
      res.setHeader('Last-Modified', reqModifiedHeader);
      res.writeHead(304);
      res.end();
      return;
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=0');
  res.setHeader('Expires', '-1');
  res.setHeader('Last-Modified', file.uploadDate && file.uploadDate.toUTCString() || new Date().toUTCString());
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Length', file.size);
  res.writeHead(200);
  res.end(file.content);
}));
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:assets/server/assets.js");

/* Exports */
Package._define("rocketchat:assets");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_assets.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDphc3NldHMvc2VydmVyL2Fzc2V0cy5qcyJdLCJuYW1lcyI6WyJfIiwibW9kdWxlIiwid2F0Y2giLCJyZXF1aXJlIiwiZGVmYXVsdCIsInYiLCJzaXplT2YiLCJtaW1lIiwiY3J5cHRvIiwiZXh0ZW5zaW9ucyIsIlJvY2tldENoYXRBc3NldHNJbnN0YW5jZSIsIlJvY2tldENoYXRGaWxlIiwiR3JpZEZTIiwibmFtZSIsImFzc2V0cyIsImxvZ28iLCJsYWJlbCIsImRlZmF1bHRVcmwiLCJjb25zdHJhaW50cyIsInR5cGUiLCJ3aWR0aCIsInVuZGVmaW5lZCIsImhlaWdodCIsImZhdmljb25faWNvIiwiZmF2aWNvbiIsImZhdmljb25fMTYiLCJmYXZpY29uXzMyIiwiZmF2aWNvbl8xOTIiLCJmYXZpY29uXzUxMiIsInRvdWNoaWNvbl8xODAiLCJ0b3VjaGljb25fMTgwX3ByZSIsInRpbGVfMTQ0IiwidGlsZV8xNTAiLCJ0aWxlXzMxMF9zcXVhcmUiLCJ0aWxlXzMxMF93aWRlIiwic2FmYXJpX3Bpbm5lZCIsIlJvY2tldENoYXQiLCJBc3NldHMiLCJzZXRBc3NldCIsImJpbmFyeUNvbnRlbnQiLCJjb250ZW50VHlwZSIsImFzc2V0IiwiTWV0ZW9yIiwiRXJyb3IiLCJmdW5jdGlvbiIsImV4dGVuc2lvbiIsImluY2x1ZGVzIiwiZXJyb3JUaXRsZSIsImZpbGUiLCJCdWZmZXIiLCJkaW1lbnNpb25zIiwicnMiLCJidWZmZXJUb1N0cmVhbSIsImRlbGV0ZUZpbGUiLCJ3cyIsImNyZWF0ZVdyaXRlU3RyZWFtIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJzZXRUaW1lb3V0Iiwia2V5IiwidmFsdWUiLCJ1cmwiLCJzZXR0aW5ncyIsInVwZGF0ZUJ5SWQiLCJwcm9jZXNzQXNzZXQiLCJwaXBlIiwidW5zZXRBc3NldCIsInJlZnJlc2hDbGllbnRzIiwicHJvY2VzcyIsImVtaXQiLCJyZWZyZXNoIiwic2V0dGluZ0tleSIsInNldHRpbmdWYWx1ZSIsImluZGV4T2YiLCJhc3NldEtleSIsInJlcGxhY2UiLCJhc3NldFZhbHVlIiwiY2FjaGUiLCJnZXRGaWxlU3luYyIsImhhc2giLCJjcmVhdGVIYXNoIiwidXBkYXRlIiwiYnVmZmVyIiwiZGlnZXN0Iiwic3BsaXQiLCJwb3AiLCJwYXRoIiwiY2FjaGVhYmxlIiwic291cmNlTWFwVXJsIiwid2hlcmUiLCJjb250ZW50Iiwic2l6ZSIsImxlbmd0aCIsInVwbG9hZERhdGUiLCJhZGRHcm91cCIsImFkZCIsImdyb3VwIiwiaTE4bkxhYmVsIiwiYWRkQXNzZXRUb1NldHRpbmciLCJmaWxlQ29uc3RyYWludHMiLCJwdWJsaWMiLCJPYmplY3QiLCJrZXlzIiwibW9kZWxzIiwiU2V0dGluZ3MiLCJmaW5kIiwib2JzZXJ2ZSIsImFkZGVkIiwicmVjb3JkIiwiX2lkIiwiY2hhbmdlZCIsInJlbW92ZWQiLCJzdGFydHVwIiwiY2FsY3VsYXRlQ2xpZW50SGFzaCIsIldlYkFwcEhhc2hpbmciLCJtYW5pZmVzdCIsImluY2x1ZGVGaWx0ZXIiLCJydW50aW1lQ29uZmlnT3ZlcnJpZGUiLCJXZWJBcHBJbnRlcm5hbHMiLCJzdGF0aWNGaWxlcyIsIm1hbmlmZXN0SXRlbSIsImZpbmRXaGVyZSIsImluZGV4IiwicHVzaCIsImNhbGwiLCJtZXRob2RzIiwidXNlcklkIiwibWV0aG9kIiwiaGFzUGVybWlzc2lvbiIsImF1dGh6IiwiYWN0aW9uIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicmVxIiwicmVzIiwibmV4dCIsInBhcmFtcyIsImRlY29kZVVSSUNvbXBvbmVudCIsInN0YXRpY0ZpbGVzTWlkZGxld2FyZSIsIndyaXRlSGVhZCIsImVuZCIsInJlcU1vZGlmaWVkSGVhZGVyIiwiaGVhZGVycyIsInRvVVRDU3RyaW5nIiwic2V0SGVhZGVyIiwiRGF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxNQUFKO0FBQVdMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxZQUFSLENBQWIsRUFBbUM7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLGFBQU9ELENBQVA7QUFBUzs7QUFBckIsQ0FBbkMsRUFBMEQsQ0FBMUQ7QUFBNkQsSUFBSUUsSUFBSjtBQUFTTixPQUFPQyxLQUFQLENBQWFDLFFBQVEsbUJBQVIsQ0FBYixFQUEwQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0UsV0FBS0YsQ0FBTDtBQUFPOztBQUFuQixDQUExQyxFQUErRCxDQUEvRDtBQUFrRSxJQUFJRyxNQUFKO0FBQVdQLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNHLGFBQU9ILENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFPNU5FLEtBQUtFLFVBQUwsQ0FBZ0IsMEJBQWhCLElBQThDLENBQUMsS0FBRCxDQUE5QztBQUVBLE1BQU1DLDJCQUEyQixJQUFJQyxlQUFlQyxNQUFuQixDQUEwQjtBQUMxREMsUUFBTTtBQURvRCxDQUExQixDQUFqQztBQUlBLEtBQUtILHdCQUFMLEdBQWdDQSx3QkFBaEM7QUFFQSxNQUFNSSxTQUFTO0FBQ2RDLFFBQU07QUFDTEMsV0FBTyxzQkFERjtBQUVMQyxnQkFBWSxzQkFGUDtBQUdMQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsTUFBdEIsQ0FGQTtBQUdaVyxhQUFPQyxTQUhLO0FBSVpDLGNBQVFEO0FBSkk7QUFIUixHQURRO0FBV2RFLGVBQWE7QUFDWlAsV0FBTyxlQURLO0FBRVpDLGdCQUFZLGFBRkE7QUFHWkMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU9DLFNBSEs7QUFJWkMsY0FBUUQ7QUFKSTtBQUhELEdBWEM7QUFxQmRHLFdBQVM7QUFDUlIsV0FBTyxlQURDO0FBRVJDLGdCQUFZLHNCQUZKO0FBR1JDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPQyxTQUhLO0FBSVpDLGNBQVFEO0FBSkk7QUFITCxHQXJCSztBQStCZEksY0FBWTtBQUNYVCxXQUFPLHFCQURJO0FBRVhDLGdCQUFZLCtCQUZEO0FBR1hDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEVBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEYsR0EvQkU7QUF5Q2RJLGNBQVk7QUFDWFYsV0FBTyxxQkFESTtBQUVYQyxnQkFBWSwrQkFGRDtBQUdYQyxpQkFBYTtBQUNaQyxZQUFNLE9BRE07QUFFWlYsa0JBQVksQ0FBQyxLQUFELENBRkE7QUFHWlcsYUFBTyxFQUhLO0FBSVpFLGNBQVE7QUFKSTtBQUhGLEdBekNFO0FBbURkSyxlQUFhO0FBQ1pYLFdBQU8sOEJBREs7QUFFWkMsZ0JBQVksd0NBRkE7QUFHWkMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFIRCxHQW5EQztBQTZEZE0sZUFBYTtBQUNaWixXQUFPLDhCQURLO0FBRVpDLGdCQUFZLHlCQUZBO0FBR1pDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEdBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEQsR0E3REM7QUF1RWRPLGlCQUFlO0FBQ2RiLFdBQU8sZ0NBRE87QUFFZEMsZ0JBQVksa0NBRkU7QUFHZEMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFIQyxHQXZFRDtBQWlGZFEscUJBQW1CO0FBQ2xCZCxXQUFPLDRDQURXO0FBRWxCQyxnQkFBWSw4Q0FGTTtBQUdsQkMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFISyxHQWpGTDtBQTJGZFMsWUFBVTtBQUNUZixXQUFPLHNCQURFO0FBRVRDLGdCQUFZLGdDQUZIO0FBR1RDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEdBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEosR0EzRkk7QUFxR2RVLFlBQVU7QUFDVGhCLFdBQU8sc0JBREU7QUFFVEMsZ0JBQVksZ0NBRkg7QUFHVEMsaUJBQWE7QUFDWkMsWUFBTSxPQURNO0FBRVpWLGtCQUFZLENBQUMsS0FBRCxDQUZBO0FBR1pXLGFBQU8sR0FISztBQUlaRSxjQUFRO0FBSkk7QUFISixHQXJHSTtBQStHZFcsbUJBQWlCO0FBQ2hCakIsV0FBTyxzQkFEUztBQUVoQkMsZ0JBQVksZ0NBRkk7QUFHaEJDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEdBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEcsR0EvR0g7QUF5SGRZLGlCQUFlO0FBQ2RsQixXQUFPLHNCQURPO0FBRWRDLGdCQUFZLGdDQUZFO0FBR2RDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPLEdBSEs7QUFJWkUsY0FBUTtBQUpJO0FBSEMsR0F6SEQ7QUFtSWRhLGlCQUFlO0FBQ2RuQixXQUFPLHlCQURPO0FBRWRDLGdCQUFZLG1DQUZFO0FBR2RDLGlCQUFhO0FBQ1pDLFlBQU0sT0FETTtBQUVaVixrQkFBWSxDQUFDLEtBQUQsQ0FGQTtBQUdaVyxhQUFPQyxTQUhLO0FBSVpDLGNBQVFEO0FBSkk7QUFIQztBQW5JRCxDQUFmO0FBK0lBZSxXQUFXQyxNQUFYLEdBQW9CLElBQUssTUFBTTtBQUM5QixNQUFJOUIsSUFBSixHQUFXO0FBQ1YsV0FBT0EsSUFBUDtBQUNBOztBQUVELE1BQUlPLE1BQUosR0FBYTtBQUNaLFdBQU9BLE1BQVA7QUFDQTs7QUFFRHdCLFdBQVNDLGFBQVQsRUFBd0JDLFdBQXhCLEVBQXFDQyxLQUFyQyxFQUE0QztBQUMzQyxRQUFJLENBQUMzQixPQUFPMkIsS0FBUCxDQUFMLEVBQW9CO0FBQ25CLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixxQkFBakIsRUFBd0MsZUFBeEMsRUFBeUQ7QUFDOURDLGtCQUFVO0FBRG9ELE9BQXpELENBQU47QUFHQTs7QUFFRCxVQUFNQyxZQUFZdEMsS0FBS3NDLFNBQUwsQ0FBZUwsV0FBZixDQUFsQjs7QUFDQSxRQUFJMUIsT0FBTzJCLEtBQVAsRUFBY3ZCLFdBQWQsQ0FBMEJULFVBQTFCLENBQXFDcUMsUUFBckMsQ0FBOENELFNBQTlDLE1BQTZELEtBQWpFLEVBQXdFO0FBQ3ZFLFlBQU0sSUFBSUgsT0FBT0MsS0FBWCxDQUFpQkgsV0FBakIsRUFBK0Isc0JBQXNCQSxXQUFhLEVBQWxFLEVBQXFFO0FBQzFFSSxrQkFBVSw0QkFEZ0U7QUFFMUVHLG9CQUFZO0FBRjhELE9BQXJFLENBQU47QUFJQTs7QUFFRCxVQUFNQyxPQUFPLElBQUlDLE1BQUosQ0FBV1YsYUFBWCxFQUEwQixRQUExQixDQUFiOztBQUNBLFFBQUl6QixPQUFPMkIsS0FBUCxFQUFjdkIsV0FBZCxDQUEwQkUsS0FBMUIsSUFBbUNOLE9BQU8yQixLQUFQLEVBQWN2QixXQUFkLENBQTBCSSxNQUFqRSxFQUF5RTtBQUN4RSxZQUFNNEIsYUFBYTVDLE9BQU8wQyxJQUFQLENBQW5COztBQUNBLFVBQUlsQyxPQUFPMkIsS0FBUCxFQUFjdkIsV0FBZCxDQUEwQkUsS0FBMUIsSUFBbUNOLE9BQU8yQixLQUFQLEVBQWN2QixXQUFkLENBQTBCRSxLQUExQixLQUFvQzhCLFdBQVc5QixLQUF0RixFQUE2RjtBQUM1RixjQUFNLElBQUlzQixPQUFPQyxLQUFYLENBQWlCLDBCQUFqQixFQUE2QyxvQkFBN0MsRUFBbUU7QUFDeEVDLG9CQUFVO0FBRDhELFNBQW5FLENBQU47QUFHQTs7QUFDRCxVQUFJOUIsT0FBTzJCLEtBQVAsRUFBY3ZCLFdBQWQsQ0FBMEJJLE1BQTFCLElBQW9DUixPQUFPMkIsS0FBUCxFQUFjdkIsV0FBZCxDQUEwQkksTUFBMUIsS0FBcUM0QixXQUFXNUIsTUFBeEYsRUFBZ0c7QUFDL0YsY0FBTSxJQUFJb0IsT0FBT0MsS0FBWCxDQUFpQiwyQkFBakIsQ0FBTjtBQUNBO0FBQ0Q7O0FBRUQsVUFBTVEsS0FBS3hDLGVBQWV5QyxjQUFmLENBQThCSixJQUE5QixDQUFYO0FBQ0F0Qyw2QkFBeUIyQyxVQUF6QixDQUFvQ1osS0FBcEM7QUFFQSxVQUFNYSxLQUFLNUMseUJBQXlCNkMsaUJBQXpCLENBQTJDZCxLQUEzQyxFQUFrREQsV0FBbEQsQ0FBWDtBQUNBYyxPQUFHRSxFQUFILENBQU0sS0FBTixFQUFhZCxPQUFPZSxlQUFQLENBQXVCLFlBQVc7QUFDOUMsYUFBT2YsT0FBT2dCLFVBQVAsQ0FBa0IsWUFBVztBQUNuQyxjQUFNQyxNQUFPLFVBQVVsQixLQUFPLEVBQTlCO0FBQ0EsY0FBTW1CLFFBQVE7QUFDYkMsZUFBTSxVQUFVcEIsS0FBTyxJQUFJSSxTQUFXLEVBRHpCO0FBRWI1QixzQkFBWUgsT0FBTzJCLEtBQVAsRUFBY3hCO0FBRmIsU0FBZDtBQUtBbUIsbUJBQVcwQixRQUFYLENBQW9CQyxVQUFwQixDQUErQkosR0FBL0IsRUFBb0NDLEtBQXBDO0FBQ0EsZUFBT3hCLFdBQVdDLE1BQVgsQ0FBa0IyQixZQUFsQixDQUErQkwsR0FBL0IsRUFBb0NDLEtBQXBDLENBQVA7QUFDQSxPQVRNLEVBU0osR0FUSSxDQUFQO0FBVUEsS0FYWSxDQUFiO0FBYUFULE9BQUdjLElBQUgsQ0FBUVgsRUFBUjtBQUNBOztBQUVEWSxhQUFXekIsS0FBWCxFQUFrQjtBQUNqQixRQUFJLENBQUMzQixPQUFPMkIsS0FBUCxDQUFMLEVBQW9CO0FBQ25CLFlBQU0sSUFBSUMsT0FBT0MsS0FBWCxDQUFpQixxQkFBakIsRUFBd0MsZUFBeEMsRUFBeUQ7QUFDOURDLGtCQUFVO0FBRG9ELE9BQXpELENBQU47QUFHQTs7QUFFRGxDLDZCQUF5QjJDLFVBQXpCLENBQW9DWixLQUFwQztBQUNBLFVBQU1rQixNQUFPLFVBQVVsQixLQUFPLEVBQTlCO0FBQ0EsVUFBTW1CLFFBQVE7QUFDYjNDLGtCQUFZSCxPQUFPMkIsS0FBUCxFQUFjeEI7QUFEYixLQUFkO0FBSUFtQixlQUFXMEIsUUFBWCxDQUFvQkMsVUFBcEIsQ0FBK0JKLEdBQS9CLEVBQW9DQyxLQUFwQztBQUNBeEIsZUFBV0MsTUFBWCxDQUFrQjJCLFlBQWxCLENBQStCTCxHQUEvQixFQUFvQ0MsS0FBcEM7QUFDQTs7QUFFRE8sbUJBQWlCO0FBQ2hCLFdBQU9DLFFBQVFDLElBQVIsQ0FBYSxTQUFiLEVBQXdCO0FBQzlCQyxlQUFTO0FBRHFCLEtBQXhCLENBQVA7QUFHQTs7QUFFRE4sZUFBYU8sVUFBYixFQUF5QkMsWUFBekIsRUFBdUM7QUFDdEMsUUFBSUQsV0FBV0UsT0FBWCxDQUFtQixTQUFuQixNQUFrQyxDQUF0QyxFQUF5QztBQUN4QztBQUNBOztBQUVELFVBQU1DLFdBQVdILFdBQVdJLE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsRUFBL0IsQ0FBakI7QUFDQSxVQUFNQyxhQUFhOUQsT0FBTzRELFFBQVAsQ0FBbkI7O0FBRUEsUUFBSSxDQUFDRSxVQUFMLEVBQWlCO0FBQ2hCO0FBQ0E7O0FBRUQsUUFBSSxDQUFDSixZQUFELElBQWlCLENBQUNBLGFBQWFYLEdBQW5DLEVBQXdDO0FBQ3ZDZSxpQkFBV0MsS0FBWCxHQUFtQnhELFNBQW5CO0FBQ0E7QUFDQTs7QUFFRCxVQUFNMkIsT0FBT3RDLHlCQUF5Qm9FLFdBQXpCLENBQXFDSixRQUFyQyxDQUFiOztBQUNBLFFBQUksQ0FBQzFCLElBQUwsRUFBVztBQUNWNEIsaUJBQVdDLEtBQVgsR0FBbUJ4RCxTQUFuQjtBQUNBO0FBQ0E7O0FBRUQsVUFBTTBELE9BQU92RSxPQUFPd0UsVUFBUCxDQUFrQixNQUFsQixFQUEwQkMsTUFBMUIsQ0FBaUNqQyxLQUFLa0MsTUFBdEMsRUFBOENDLE1BQTlDLENBQXFELEtBQXJELENBQWI7QUFDQSxVQUFNdEMsWUFBWTJCLGFBQWFYLEdBQWIsQ0FBaUJ1QixLQUFqQixDQUF1QixHQUF2QixFQUE0QkMsR0FBNUIsRUFBbEI7QUFFQSxXQUFPVCxXQUFXQyxLQUFYLEdBQW1CO0FBQ3pCUyxZQUFPLFVBQVVaLFFBQVUsSUFBSTdCLFNBQVcsRUFEakI7QUFFekIwQyxpQkFBVyxLQUZjO0FBR3pCQyxvQkFBY25FLFNBSFc7QUFJekJvRSxhQUFPLFFBSmtCO0FBS3pCdEUsWUFBTSxPQUxtQjtBQU16QnVFLGVBQVMxQyxLQUFLa0MsTUFOVztBQU96QnJDLGVBUHlCO0FBUXpCZ0IsV0FBTSxXQUFXYSxRQUFVLElBQUk3QixTQUFXLElBQUlrQyxJQUFNLEVBUjNCO0FBU3pCWSxZQUFNM0MsS0FBSzRDLE1BVGM7QUFVekJDLGtCQUFZN0MsS0FBSzZDLFVBVlE7QUFXekJyRCxtQkFBYVEsS0FBS1IsV0FYTztBQVl6QnVDO0FBWnlCLEtBQTFCO0FBY0E7O0FBeEg2QixDQUFYLEVBQXBCO0FBMkhBM0MsV0FBVzBCLFFBQVgsQ0FBb0JnQyxRQUFwQixDQUE2QixRQUE3QjtBQUVBMUQsV0FBVzBCLFFBQVgsQ0FBb0JpQyxHQUFwQixDQUF3QiwwQkFBeEIsRUFBb0QsSUFBcEQsRUFBMEQ7QUFDekQ1RSxRQUFNLFNBRG1EO0FBRXpENkUsU0FBTyxRQUZrRDtBQUd6REMsYUFBVztBQUg4QyxDQUExRDs7QUFNQSxTQUFTQyxpQkFBVCxDQUEyQnZDLEdBQTNCLEVBQWdDQyxLQUFoQyxFQUF1QztBQUN0QyxTQUFPeEIsV0FBVzBCLFFBQVgsQ0FBb0JpQyxHQUFwQixDQUF5QixVQUFVcEMsR0FBSyxFQUF4QyxFQUEyQztBQUNqRDFDLGdCQUFZMkMsTUFBTTNDO0FBRCtCLEdBQTNDLEVBRUo7QUFDRkUsVUFBTSxPQURKO0FBRUY2RSxXQUFPLFFBRkw7QUFHRkcscUJBQWlCdkMsTUFBTTFDLFdBSHJCO0FBSUYrRSxlQUFXckMsTUFBTTVDLEtBSmY7QUFLRnlCLFdBQU9rQixHQUxMO0FBTUZ5QyxZQUFRO0FBTk4sR0FGSSxDQUFQO0FBVUE7O0FBRUQsS0FBSyxNQUFNekMsR0FBWCxJQUFrQjBDLE9BQU9DLElBQVAsQ0FBWXhGLE1BQVosQ0FBbEIsRUFBdUM7QUFDdEMsUUFBTThDLFFBQVE5QyxPQUFPNkMsR0FBUCxDQUFkO0FBQ0F1QyxvQkFBa0J2QyxHQUFsQixFQUF1QkMsS0FBdkI7QUFDQTs7QUFFRHhCLFdBQVdtRSxNQUFYLENBQWtCQyxRQUFsQixDQUEyQkMsSUFBM0IsR0FBa0NDLE9BQWxDLENBQTBDO0FBQ3pDQyxRQUFNQyxNQUFOLEVBQWM7QUFDYixXQUFPeEUsV0FBV0MsTUFBWCxDQUFrQjJCLFlBQWxCLENBQStCNEMsT0FBT0MsR0FBdEMsRUFBMkNELE9BQU9oRCxLQUFsRCxDQUFQO0FBQ0EsR0FId0M7O0FBS3pDa0QsVUFBUUYsTUFBUixFQUFnQjtBQUNmLFdBQU94RSxXQUFXQyxNQUFYLENBQWtCMkIsWUFBbEIsQ0FBK0I0QyxPQUFPQyxHQUF0QyxFQUEyQ0QsT0FBT2hELEtBQWxELENBQVA7QUFDQSxHQVB3Qzs7QUFTekNtRCxVQUFRSCxNQUFSLEVBQWdCO0FBQ2YsV0FBT3hFLFdBQVdDLE1BQVgsQ0FBa0IyQixZQUFsQixDQUErQjRDLE9BQU9DLEdBQXRDLEVBQTJDeEYsU0FBM0MsQ0FBUDtBQUNBOztBQVh3QyxDQUExQztBQWNBcUIsT0FBT3NFLE9BQVAsQ0FBZSxZQUFXO0FBQ3pCLFNBQU90RSxPQUFPZ0IsVUFBUCxDQUFrQixZQUFXO0FBQ25DLFdBQU9VLFFBQVFDLElBQVIsQ0FBYSxTQUFiLEVBQXdCO0FBQzlCQyxlQUFTO0FBRHFCLEtBQXhCLENBQVA7QUFHQSxHQUpNLEVBSUosR0FKSSxDQUFQO0FBS0EsQ0FORDtBQVFBLE1BQU0yQyxzQkFBc0JDLGNBQWNELG1CQUExQzs7QUFFQUMsY0FBY0QsbUJBQWQsR0FBb0MsVUFBU0UsUUFBVCxFQUFtQkMsYUFBbkIsRUFBa0NDLHFCQUFsQyxFQUF5RDtBQUM1RixPQUFLLE1BQU0xRCxHQUFYLElBQWtCMEMsT0FBT0MsSUFBUCxDQUFZeEYsTUFBWixDQUFsQixFQUF1QztBQUN0QyxVQUFNOEMsUUFBUTlDLE9BQU82QyxHQUFQLENBQWQ7O0FBQ0EsUUFBSSxDQUFDQyxNQUFNaUIsS0FBUCxJQUFnQixDQUFDakIsTUFBTTNDLFVBQTNCLEVBQXVDO0FBQ3RDO0FBQ0E7O0FBRUQsUUFBSTRELFFBQVEsRUFBWjs7QUFDQSxRQUFJakIsTUFBTWlCLEtBQVYsRUFBaUI7QUFDaEJBLGNBQVE7QUFDUFMsY0FBTTFCLE1BQU1pQixLQUFOLENBQVlTLElBRFg7QUFFUEMsbUJBQVczQixNQUFNaUIsS0FBTixDQUFZVSxTQUZoQjtBQUdQQyxzQkFBYzVCLE1BQU1pQixLQUFOLENBQVlXLFlBSG5CO0FBSVBDLGVBQU83QixNQUFNaUIsS0FBTixDQUFZWSxLQUpaO0FBS1B0RSxjQUFNeUMsTUFBTWlCLEtBQU4sQ0FBWTFELElBTFg7QUFNUDBDLGFBQUtELE1BQU1pQixLQUFOLENBQVloQixHQU5WO0FBT1A4QixjQUFNL0IsTUFBTWlCLEtBQU4sQ0FBWWMsSUFQWDtBQVFQWixjQUFNbkIsTUFBTWlCLEtBQU4sQ0FBWUU7QUFSWCxPQUFSO0FBVUF1QyxzQkFBZ0JDLFdBQWhCLENBQTZCLHFCQUFxQjVELEdBQUssRUFBdkQsSUFBNERDLE1BQU1pQixLQUFsRTtBQUNBeUMsc0JBQWdCQyxXQUFoQixDQUE2QixxQkFBcUI1RCxHQUFLLElBQUlDLE1BQU1pQixLQUFOLENBQVloQyxTQUFXLEVBQWxGLElBQXVGZSxNQUFNaUIsS0FBN0Y7QUFDQSxLQWJELE1BYU87QUFDTixZQUFNaEMsWUFBWWUsTUFBTTNDLFVBQU4sQ0FBaUJtRSxLQUFqQixDQUF1QixHQUF2QixFQUE0QkMsR0FBNUIsRUFBbEI7QUFDQVIsY0FBUTtBQUNQUyxjQUFPLFVBQVUzQixHQUFLLElBQUlkLFNBQVcsRUFEOUI7QUFFUDBDLG1CQUFXLEtBRko7QUFHUEMsc0JBQWNuRSxTQUhQO0FBSVBvRSxlQUFPLFFBSkE7QUFLUHRFLGNBQU0sT0FMQztBQU1QMEMsYUFBTSxXQUFXRixHQUFLLElBQUlkLFNBQVcsS0FOOUI7QUFPUGtDLGNBQU07QUFQQyxPQUFSO0FBVUF1QyxzQkFBZ0JDLFdBQWhCLENBQTZCLHFCQUFxQjVELEdBQUssRUFBdkQsSUFBNEQyRCxnQkFBZ0JDLFdBQWhCLENBQTZCLGNBQWMzRCxNQUFNM0MsVUFBWSxFQUE3RCxDQUE1RDtBQUNBcUcsc0JBQWdCQyxXQUFoQixDQUE2QixxQkFBcUI1RCxHQUFLLElBQUlkLFNBQVcsRUFBdEUsSUFBMkV5RSxnQkFBZ0JDLFdBQWhCLENBQTZCLGNBQWMzRCxNQUFNM0MsVUFBWSxFQUE3RCxDQUEzRTtBQUNBOztBQUVELFVBQU11RyxlQUFleEgsRUFBRXlILFNBQUYsQ0FBWU4sUUFBWixFQUFzQjtBQUMxQzdCLFlBQU0zQjtBQURvQyxLQUF0QixDQUFyQjs7QUFJQSxRQUFJNkQsWUFBSixFQUFrQjtBQUNqQixZQUFNRSxRQUFRUCxTQUFTMUMsT0FBVCxDQUFpQitDLFlBQWpCLENBQWQ7QUFDQUwsZUFBU08sS0FBVCxJQUFrQjdDLEtBQWxCO0FBQ0EsS0FIRCxNQUdPO0FBQ05zQyxlQUFTUSxJQUFULENBQWM5QyxLQUFkO0FBQ0E7QUFDRDs7QUFFRCxTQUFPb0Msb0JBQW9CVyxJQUFwQixDQUF5QixJQUF6QixFQUErQlQsUUFBL0IsRUFBeUNDLGFBQXpDLEVBQXdEQyxxQkFBeEQsQ0FBUDtBQUNBLENBbEREOztBQW9EQTNFLE9BQU9tRixPQUFQLENBQWU7QUFDZDFELG1CQUFpQjtBQUNoQixRQUFJLENBQUN6QixPQUFPb0YsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSXBGLE9BQU9DLEtBQVgsQ0FBaUIsb0JBQWpCLEVBQXVDLGNBQXZDLEVBQXVEO0FBQzVEb0YsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUVELFVBQU1DLGdCQUFnQjVGLFdBQVc2RixLQUFYLENBQWlCRCxhQUFqQixDQUErQnRGLE9BQU9vRixNQUFQLEVBQS9CLEVBQWdELGVBQWhELENBQXRCOztBQUNBLFFBQUksQ0FBQ0UsYUFBTCxFQUFvQjtBQUNuQixZQUFNLElBQUl0RixPQUFPQyxLQUFYLENBQWlCLDBCQUFqQixFQUE2Qyw2QkFBN0MsRUFBNEU7QUFDakZvRixnQkFBUSxnQkFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRCxXQUFPOUYsV0FBV0MsTUFBWCxDQUFrQjhCLGNBQWxCLEVBQVA7QUFDQSxHQWpCYTs7QUFtQmRELGFBQVd6QixLQUFYLEVBQWtCO0FBQ2pCLFFBQUksQ0FBQ0MsT0FBT29GLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlwRixPQUFPQyxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1RG9GLGdCQUFRO0FBRG9ELE9BQXZELENBQU47QUFHQTs7QUFFRCxVQUFNQyxnQkFBZ0I1RixXQUFXNkYsS0FBWCxDQUFpQkQsYUFBakIsQ0FBK0J0RixPQUFPb0YsTUFBUCxFQUEvQixFQUFnRCxlQUFoRCxDQUF0Qjs7QUFDQSxRQUFJLENBQUNFLGFBQUwsRUFBb0I7QUFDbkIsWUFBTSxJQUFJdEYsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkJBQTdDLEVBQTRFO0FBQ2pGb0YsZ0JBQVEsWUFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRCxXQUFPOUYsV0FBV0MsTUFBWCxDQUFrQjZCLFVBQWxCLENBQTZCekIsS0FBN0IsQ0FBUDtBQUNBLEdBbkNhOztBQXFDZEgsV0FBU0MsYUFBVCxFQUF3QkMsV0FBeEIsRUFBcUNDLEtBQXJDLEVBQTRDO0FBQzNDLFFBQUksQ0FBQ0MsT0FBT29GLE1BQVAsRUFBTCxFQUFzQjtBQUNyQixZQUFNLElBQUlwRixPQUFPQyxLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1RG9GLGdCQUFRO0FBRG9ELE9BQXZELENBQU47QUFHQTs7QUFFRCxVQUFNQyxnQkFBZ0I1RixXQUFXNkYsS0FBWCxDQUFpQkQsYUFBakIsQ0FBK0J0RixPQUFPb0YsTUFBUCxFQUEvQixFQUFnRCxlQUFoRCxDQUF0Qjs7QUFDQSxRQUFJLENBQUNFLGFBQUwsRUFBb0I7QUFDbkIsWUFBTSxJQUFJdEYsT0FBT0MsS0FBWCxDQUFpQiwwQkFBakIsRUFBNkMsNkJBQTdDLEVBQTRFO0FBQ2pGb0YsZ0JBQVEsVUFEeUU7QUFFakZHLGdCQUFRO0FBRnlFLE9BQTVFLENBQU47QUFJQTs7QUFFRDlGLGVBQVdDLE1BQVgsQ0FBa0JDLFFBQWxCLENBQTJCQyxhQUEzQixFQUEwQ0MsV0FBMUMsRUFBdURDLEtBQXZEO0FBQ0E7O0FBckRhLENBQWY7QUF3REEwRixPQUFPQyxlQUFQLENBQXVCQyxHQUF2QixDQUEyQixVQUEzQixFQUF1QzNGLE9BQU9lLGVBQVAsQ0FBdUIsVUFBUzZFLEdBQVQsRUFBY0MsR0FBZCxFQUFtQkMsSUFBbkIsRUFBeUI7QUFDdEYsUUFBTUMsU0FBUztBQUNkaEcsV0FBT2lHLG1CQUFtQkosSUFBSXpFLEdBQUosQ0FBUWMsT0FBUixDQUFnQixLQUFoQixFQUF1QixFQUF2QixFQUEyQkEsT0FBM0IsQ0FBbUMsT0FBbkMsRUFBNEMsRUFBNUMsQ0FBbkIsRUFBb0VBLE9BQXBFLENBQTRFLFVBQTVFLEVBQXdGLEVBQXhGO0FBRE8sR0FBZjtBQUlBLFFBQU0zQixPQUFPbEMsT0FBTzJILE9BQU9oRyxLQUFkLEtBQXdCM0IsT0FBTzJILE9BQU9oRyxLQUFkLEVBQXFCb0MsS0FBMUQ7O0FBRUEsTUFBSSxDQUFDN0IsSUFBTCxFQUFXO0FBQ1YsUUFBSWxDLE9BQU8ySCxPQUFPaEcsS0FBZCxLQUF3QjNCLE9BQU8ySCxPQUFPaEcsS0FBZCxFQUFxQnhCLFVBQWpELEVBQTZEO0FBQzVEcUgsVUFBSXpFLEdBQUosR0FBVyxJQUFJL0MsT0FBTzJILE9BQU9oRyxLQUFkLEVBQXFCeEIsVUFBWSxFQUFoRDtBQUNBcUcsc0JBQWdCcUIscUJBQWhCLENBQXNDckIsZ0JBQWdCQyxXQUF0RCxFQUFtRWUsR0FBbkUsRUFBd0VDLEdBQXhFLEVBQTZFQyxJQUE3RTtBQUNBLEtBSEQsTUFHTztBQUNORCxVQUFJSyxTQUFKLENBQWMsR0FBZDtBQUNBTCxVQUFJTSxHQUFKO0FBQ0E7O0FBRUQ7QUFDQTs7QUFFRCxRQUFNQyxvQkFBb0JSLElBQUlTLE9BQUosQ0FBWSxtQkFBWixDQUExQjs7QUFDQSxNQUFJRCxpQkFBSixFQUF1QjtBQUN0QixRQUFJQSx1QkFBdUI5RixLQUFLNkMsVUFBTCxJQUFtQjdDLEtBQUs2QyxVQUFMLENBQWdCbUQsV0FBaEIsRUFBMUMsQ0FBSixFQUE4RTtBQUM3RVQsVUFBSVUsU0FBSixDQUFjLGVBQWQsRUFBK0JILGlCQUEvQjtBQUNBUCxVQUFJSyxTQUFKLENBQWMsR0FBZDtBQUNBTCxVQUFJTSxHQUFKO0FBQ0E7QUFDQTtBQUNEOztBQUVETixNQUFJVSxTQUFKLENBQWMsZUFBZCxFQUErQixtQkFBL0I7QUFDQVYsTUFBSVUsU0FBSixDQUFjLFNBQWQsRUFBeUIsSUFBekI7QUFDQVYsTUFBSVUsU0FBSixDQUFjLGVBQWQsRUFBZ0NqRyxLQUFLNkMsVUFBTCxJQUFtQjdDLEtBQUs2QyxVQUFMLENBQWdCbUQsV0FBaEIsRUFBcEIsSUFBc0QsSUFBSUUsSUFBSixHQUFXRixXQUFYLEVBQXJGO0FBQ0FULE1BQUlVLFNBQUosQ0FBYyxjQUFkLEVBQThCakcsS0FBS1IsV0FBbkM7QUFDQStGLE1BQUlVLFNBQUosQ0FBYyxnQkFBZCxFQUFnQ2pHLEtBQUsyQyxJQUFyQztBQUNBNEMsTUFBSUssU0FBSixDQUFjLEdBQWQ7QUFDQUwsTUFBSU0sR0FBSixDQUFRN0YsS0FBSzBDLE9BQWI7QUFDQSxDQXBDc0MsQ0FBdkMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9hc3NldHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgV2ViQXBwSGFzaGluZywgV2ViQXBwSW50ZXJuYWxzICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuaW1wb3J0IHNpemVPZiBmcm9tICdpbWFnZS1zaXplJztcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUtdHlwZS93aXRoLWRiJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcblxubWltZS5leHRlbnNpb25zWydpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nXSA9IFsnaWNvJ107XG5cbmNvbnN0IFJvY2tldENoYXRBc3NldHNJbnN0YW5jZSA9IG5ldyBSb2NrZXRDaGF0RmlsZS5HcmlkRlMoe1xuXHRuYW1lOiAnYXNzZXRzJ1xufSk7XG5cbnRoaXMuUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlID0gUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlO1xuXG5jb25zdCBhc3NldHMgPSB7XG5cdGxvZ286IHtcblx0XHRsYWJlbDogJ2xvZ28gKHN2ZywgcG5nLCBqcGcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vbG9nby5zdmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydzdmcnLCAncG5nJywgJ2pwZycsICdqcGVnJ10sXG5cdFx0XHR3aWR0aDogdW5kZWZpbmVkLFxuXHRcdFx0aGVpZ2h0OiB1bmRlZmluZWRcblx0XHR9XG5cdH0sXG5cdGZhdmljb25faWNvOiB7XG5cdFx0bGFiZWw6ICdmYXZpY29uIChpY28pJyxcblx0XHRkZWZhdWx0VXJsOiAnZmF2aWNvbi5pY28nLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydpY28nXSxcblx0XHRcdHdpZHRoOiB1bmRlZmluZWQsXG5cdFx0XHRoZWlnaHQ6IHVuZGVmaW5lZFxuXHRcdH1cblx0fSxcblx0ZmF2aWNvbjoge1xuXHRcdGxhYmVsOiAnZmF2aWNvbiAoc3ZnKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2ljb24uc3ZnJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsnc3ZnJ10sXG5cdFx0XHR3aWR0aDogdW5kZWZpbmVkLFxuXHRcdFx0aGVpZ2h0OiB1bmRlZmluZWRcblx0XHR9XG5cdH0sXG5cdGZhdmljb25fMTY6IHtcblx0XHRsYWJlbDogJ2Zhdmljb24gMTZ4MTYgKHBuZyknLFxuXHRcdGRlZmF1bHRVcmw6ICdpbWFnZXMvbG9nby9mYXZpY29uLTE2eDE2LnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDE2LFxuXHRcdFx0aGVpZ2h0OiAxNlxuXHRcdH1cblx0fSxcblx0ZmF2aWNvbl8zMjoge1xuXHRcdGxhYmVsOiAnZmF2aWNvbiAzMngzMiAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2Zhdmljb24tMzJ4MzIucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMzIsXG5cdFx0XHRoZWlnaHQ6IDMyXG5cdFx0fVxuXHR9LFxuXHRmYXZpY29uXzE5Mjoge1xuXHRcdGxhYmVsOiAnYW5kcm9pZC1jaHJvbWUgMTkyeDE5MiAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMTkyLFxuXHRcdFx0aGVpZ2h0OiAxOTJcblx0XHR9XG5cdH0sXG5cdGZhdmljb25fNTEyOiB7XG5cdFx0bGFiZWw6ICdhbmRyb2lkLWNocm9tZSA1MTJ4NTEyIChwbmcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vNTEyeDUxMi5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiA1MTIsXG5cdFx0XHRoZWlnaHQ6IDUxMlxuXHRcdH1cblx0fSxcblx0dG91Y2hpY29uXzE4MDoge1xuXHRcdGxhYmVsOiAnYXBwbGUtdG91Y2gtaWNvbiAxODB4MTgwIChwbmcpJyxcblx0XHRkZWZhdWx0VXJsOiAnaW1hZ2VzL2xvZ28vYXBwbGUtdG91Y2gtaWNvbi5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiAxODAsXG5cdFx0XHRoZWlnaHQ6IDE4MFxuXHRcdH1cblx0fSxcblx0dG91Y2hpY29uXzE4MF9wcmU6IHtcblx0XHRsYWJlbDogJ2FwcGxlLXRvdWNoLWljb24tcHJlY29tcG9zZWQgMTgweDE4MCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL2FwcGxlLXRvdWNoLWljb24tcHJlY29tcG9zZWQucG5nJyxcblx0XHRjb25zdHJhaW50czoge1xuXHRcdFx0dHlwZTogJ2ltYWdlJyxcblx0XHRcdGV4dGVuc2lvbnM6IFsncG5nJ10sXG5cdFx0XHR3aWR0aDogMTgwLFxuXHRcdFx0aGVpZ2h0OiAxODBcblx0XHR9XG5cdH0sXG5cdHRpbGVfMTQ0OiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMTQ0eDE0NCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0xNDR4MTQ0LnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDE0NCxcblx0XHRcdGhlaWdodDogMTQ0XG5cdFx0fVxuXHR9LFxuXHR0aWxlXzE1MDoge1xuXHRcdGxhYmVsOiAnbXN0aWxlIDE1MHgxNTAgKHBuZyknLFxuXHRcdGRlZmF1bHRVcmw6ICdpbWFnZXMvbG9nby9tc3RpbGUtMTUweDE1MC5wbmcnLFxuXHRcdGNvbnN0cmFpbnRzOiB7XG5cdFx0XHR0eXBlOiAnaW1hZ2UnLFxuXHRcdFx0ZXh0ZW5zaW9uczogWydwbmcnXSxcblx0XHRcdHdpZHRoOiAxNTAsXG5cdFx0XHRoZWlnaHQ6IDE1MFxuXHRcdH1cblx0fSxcblx0dGlsZV8zMTBfc3F1YXJlOiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMzEweDMxMCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0zMTB4MzEwLnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDMxMCxcblx0XHRcdGhlaWdodDogMzEwXG5cdFx0fVxuXHR9LFxuXHR0aWxlXzMxMF93aWRlOiB7XG5cdFx0bGFiZWw6ICdtc3RpbGUgMzEweDE1MCAocG5nKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL21zdGlsZS0zMTB4MTUwLnBuZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3BuZyddLFxuXHRcdFx0d2lkdGg6IDMxMCxcblx0XHRcdGhlaWdodDogMTUwXG5cdFx0fVxuXHR9LFxuXHRzYWZhcmlfcGlubmVkOiB7XG5cdFx0bGFiZWw6ICdzYWZhcmkgcGlubmVkIHRhYiAoc3ZnKScsXG5cdFx0ZGVmYXVsdFVybDogJ2ltYWdlcy9sb2dvL3NhZmFyaS1waW5uZWQtdGFiLnN2ZycsXG5cdFx0Y29uc3RyYWludHM6IHtcblx0XHRcdHR5cGU6ICdpbWFnZScsXG5cdFx0XHRleHRlbnNpb25zOiBbJ3N2ZyddLFxuXHRcdFx0d2lkdGg6IHVuZGVmaW5lZCxcblx0XHRcdGhlaWdodDogdW5kZWZpbmVkXG5cdFx0fVxuXHR9XG59O1xuXG5Sb2NrZXRDaGF0LkFzc2V0cyA9IG5ldyAoY2xhc3Mge1xuXHRnZXQgbWltZSgpIHtcblx0XHRyZXR1cm4gbWltZTtcblx0fVxuXG5cdGdldCBhc3NldHMoKSB7XG5cdFx0cmV0dXJuIGFzc2V0cztcblx0fVxuXG5cdHNldEFzc2V0KGJpbmFyeUNvbnRlbnQsIGNvbnRlbnRUeXBlLCBhc3NldCkge1xuXHRcdGlmICghYXNzZXRzW2Fzc2V0XSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hc3NldCcsICdJbnZhbGlkIGFzc2V0Jywge1xuXHRcdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuQXNzZXRzLnNldEFzc2V0J1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXh0ZW5zaW9uID0gbWltZS5leHRlbnNpb24oY29udGVudFR5cGUpO1xuXHRcdGlmIChhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLmV4dGVuc2lvbnMuaW5jbHVkZXMoZXh0ZW5zaW9uKSA9PT0gZmFsc2UpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoY29udGVudFR5cGUsIGBJbnZhbGlkIGZpbGUgdHlwZTogJHsgY29udGVudFR5cGUgfWAsIHtcblx0XHRcdFx0ZnVuY3Rpb246ICdSb2NrZXRDaGF0LkFzc2V0cy5zZXRBc3NldCcsXG5cdFx0XHRcdGVycm9yVGl0bGU6ICdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZSdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGUgPSBuZXcgQnVmZmVyKGJpbmFyeUNvbnRlbnQsICdiaW5hcnknKTtcblx0XHRpZiAoYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy53aWR0aCB8fCBhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLmhlaWdodCkge1xuXHRcdFx0Y29uc3QgZGltZW5zaW9ucyA9IHNpemVPZihmaWxlKTtcblx0XHRcdGlmIChhc3NldHNbYXNzZXRdLmNvbnN0cmFpbnRzLndpZHRoICYmIGFzc2V0c1thc3NldF0uY29uc3RyYWludHMud2lkdGggIT09IGRpbWVuc2lvbnMud2lkdGgpIHtcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1maWxlLXdpZHRoJywgJ0ludmFsaWQgZmlsZSB3aWR0aCcsIHtcblx0XHRcdFx0XHRmdW5jdGlvbjogJ0ludmFsaWQgZmlsZSB3aWR0aCdcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy5oZWlnaHQgJiYgYXNzZXRzW2Fzc2V0XS5jb25zdHJhaW50cy5oZWlnaHQgIT09IGRpbWVuc2lvbnMuaGVpZ2h0KSB7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtZmlsZS1oZWlnaHQnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBycyA9IFJvY2tldENoYXRGaWxlLmJ1ZmZlclRvU3RyZWFtKGZpbGUpO1xuXHRcdFJvY2tldENoYXRBc3NldHNJbnN0YW5jZS5kZWxldGVGaWxlKGFzc2V0KTtcblxuXHRcdGNvbnN0IHdzID0gUm9ja2V0Q2hhdEFzc2V0c0luc3RhbmNlLmNyZWF0ZVdyaXRlU3RyZWFtKGFzc2V0LCBjb250ZW50VHlwZSk7XG5cdFx0d3Mub24oJ2VuZCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGNvbnN0IGtleSA9IGBBc3NldHNfJHsgYXNzZXQgfWA7XG5cdFx0XHRcdGNvbnN0IHZhbHVlID0ge1xuXHRcdFx0XHRcdHVybDogYGFzc2V0cy8keyBhc3NldCB9LiR7IGV4dGVuc2lvbiB9YCxcblx0XHRcdFx0XHRkZWZhdWx0VXJsOiBhc3NldHNbYXNzZXRdLmRlZmF1bHRVcmxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQoa2V5LCB2YWx1ZSk7XG5cdFx0XHR9LCAyMDApO1xuXHRcdH0pKTtcblxuXHRcdHJzLnBpcGUod3MpO1xuXHR9XG5cblx0dW5zZXRBc3NldChhc3NldCkge1xuXHRcdGlmICghYXNzZXRzW2Fzc2V0XSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC1hc3NldCcsICdJbnZhbGlkIGFzc2V0Jywge1xuXHRcdFx0XHRmdW5jdGlvbjogJ1JvY2tldENoYXQuQXNzZXRzLnVuc2V0QXNzZXQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRSb2NrZXRDaGF0QXNzZXRzSW5zdGFuY2UuZGVsZXRlRmlsZShhc3NldCk7XG5cdFx0Y29uc3Qga2V5ID0gYEFzc2V0c18keyBhc3NldCB9YDtcblx0XHRjb25zdCB2YWx1ZSA9IHtcblx0XHRcdGRlZmF1bHRVcmw6IGFzc2V0c1thc3NldF0uZGVmYXVsdFVybFxuXHRcdH07XG5cblx0XHRSb2NrZXRDaGF0LnNldHRpbmdzLnVwZGF0ZUJ5SWQoa2V5LCB2YWx1ZSk7XG5cdFx0Um9ja2V0Q2hhdC5Bc3NldHMucHJvY2Vzc0Fzc2V0KGtleSwgdmFsdWUpO1xuXHR9XG5cblx0cmVmcmVzaENsaWVudHMoKSB7XG5cdFx0cmV0dXJuIHByb2Nlc3MuZW1pdCgnbWVzc2FnZScsIHtcblx0XHRcdHJlZnJlc2g6ICdjbGllbnQnXG5cdFx0fSk7XG5cdH1cblxuXHRwcm9jZXNzQXNzZXQoc2V0dGluZ0tleSwgc2V0dGluZ1ZhbHVlKSB7XG5cdFx0aWYgKHNldHRpbmdLZXkuaW5kZXhPZignQXNzZXRzXycpICE9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgYXNzZXRLZXkgPSBzZXR0aW5nS2V5LnJlcGxhY2UoL15Bc3NldHNfLywgJycpO1xuXHRcdGNvbnN0IGFzc2V0VmFsdWUgPSBhc3NldHNbYXNzZXRLZXldO1xuXG5cdFx0aWYgKCFhc3NldFZhbHVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCFzZXR0aW5nVmFsdWUgfHwgIXNldHRpbmdWYWx1ZS51cmwpIHtcblx0XHRcdGFzc2V0VmFsdWUuY2FjaGUgPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXRBc3NldHNJbnN0YW5jZS5nZXRGaWxlU3luYyhhc3NldEtleSk7XG5cdFx0aWYgKCFmaWxlKSB7XG5cdFx0XHRhc3NldFZhbHVlLmNhY2hlID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpLnVwZGF0ZShmaWxlLmJ1ZmZlcikuZGlnZXN0KCdoZXgnKTtcblx0XHRjb25zdCBleHRlbnNpb24gPSBzZXR0aW5nVmFsdWUudXJsLnNwbGl0KCcuJykucG9wKCk7XG5cblx0XHRyZXR1cm4gYXNzZXRWYWx1ZS5jYWNoZSA9IHtcblx0XHRcdHBhdGg6IGBhc3NldHMvJHsgYXNzZXRLZXkgfS4keyBleHRlbnNpb24gfWAsXG5cdFx0XHRjYWNoZWFibGU6IGZhbHNlLFxuXHRcdFx0c291cmNlTWFwVXJsOiB1bmRlZmluZWQsXG5cdFx0XHR3aGVyZTogJ2NsaWVudCcsXG5cdFx0XHR0eXBlOiAnYXNzZXQnLFxuXHRcdFx0Y29udGVudDogZmlsZS5idWZmZXIsXG5cdFx0XHRleHRlbnNpb24sXG5cdFx0XHR1cmw6IGAvYXNzZXRzLyR7IGFzc2V0S2V5IH0uJHsgZXh0ZW5zaW9uIH0/JHsgaGFzaCB9YCxcblx0XHRcdHNpemU6IGZpbGUubGVuZ3RoLFxuXHRcdFx0dXBsb2FkRGF0ZTogZmlsZS51cGxvYWREYXRlLFxuXHRcdFx0Y29udGVudFR5cGU6IGZpbGUuY29udGVudFR5cGUsXG5cdFx0XHRoYXNoXG5cdFx0fTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuYWRkR3JvdXAoJ0Fzc2V0cycpO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmFkZCgnQXNzZXRzX1N2Z0Zhdmljb25fRW5hYmxlJywgdHJ1ZSwge1xuXHR0eXBlOiAnYm9vbGVhbicsXG5cdGdyb3VwOiAnQXNzZXRzJyxcblx0aTE4bkxhYmVsOiAnRW5hYmxlX1N2Z19GYXZpY29uJ1xufSk7XG5cbmZ1bmN0aW9uIGFkZEFzc2V0VG9TZXR0aW5nKGtleSwgdmFsdWUpIHtcblx0cmV0dXJuIFJvY2tldENoYXQuc2V0dGluZ3MuYWRkKGBBc3NldHNfJHsga2V5IH1gLCB7XG5cdFx0ZGVmYXVsdFVybDogdmFsdWUuZGVmYXVsdFVybFxuXHR9LCB7XG5cdFx0dHlwZTogJ2Fzc2V0Jyxcblx0XHRncm91cDogJ0Fzc2V0cycsXG5cdFx0ZmlsZUNvbnN0cmFpbnRzOiB2YWx1ZS5jb25zdHJhaW50cyxcblx0XHRpMThuTGFiZWw6IHZhbHVlLmxhYmVsLFxuXHRcdGFzc2V0OiBrZXksXG5cdFx0cHVibGljOiB0cnVlXG5cdH0pO1xufVxuXG5mb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhc3NldHMpKSB7XG5cdGNvbnN0IHZhbHVlID0gYXNzZXRzW2tleV07XG5cdGFkZEFzc2V0VG9TZXR0aW5nKGtleSwgdmFsdWUpO1xufVxuXG5Sb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKCkub2JzZXJ2ZSh7XG5cdGFkZGVkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgcmVjb3JkLnZhbHVlKTtcblx0fSxcblxuXHRjaGFuZ2VkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgcmVjb3JkLnZhbHVlKTtcblx0fSxcblxuXHRyZW1vdmVkKHJlY29yZCkge1xuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5wcm9jZXNzQXNzZXQocmVjb3JkLl9pZCwgdW5kZWZpbmVkKTtcblx0fVxufSk7XG5cbk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gTWV0ZW9yLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHByb2Nlc3MuZW1pdCgnbWVzc2FnZScsIHtcblx0XHRcdHJlZnJlc2g6ICdjbGllbnQnXG5cdFx0fSk7XG5cdH0sIDIwMCk7XG59KTtcblxuY29uc3QgY2FsY3VsYXRlQ2xpZW50SGFzaCA9IFdlYkFwcEhhc2hpbmcuY2FsY3VsYXRlQ2xpZW50SGFzaDtcblxuV2ViQXBwSGFzaGluZy5jYWxjdWxhdGVDbGllbnRIYXNoID0gZnVuY3Rpb24obWFuaWZlc3QsIGluY2x1ZGVGaWx0ZXIsIHJ1bnRpbWVDb25maWdPdmVycmlkZSkge1xuXHRmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhhc3NldHMpKSB7XG5cdFx0Y29uc3QgdmFsdWUgPSBhc3NldHNba2V5XTtcblx0XHRpZiAoIXZhbHVlLmNhY2hlICYmICF2YWx1ZS5kZWZhdWx0VXJsKSB7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRsZXQgY2FjaGUgPSB7fTtcblx0XHRpZiAodmFsdWUuY2FjaGUpIHtcblx0XHRcdGNhY2hlID0ge1xuXHRcdFx0XHRwYXRoOiB2YWx1ZS5jYWNoZS5wYXRoLFxuXHRcdFx0XHRjYWNoZWFibGU6IHZhbHVlLmNhY2hlLmNhY2hlYWJsZSxcblx0XHRcdFx0c291cmNlTWFwVXJsOiB2YWx1ZS5jYWNoZS5zb3VyY2VNYXBVcmwsXG5cdFx0XHRcdHdoZXJlOiB2YWx1ZS5jYWNoZS53aGVyZSxcblx0XHRcdFx0dHlwZTogdmFsdWUuY2FjaGUudHlwZSxcblx0XHRcdFx0dXJsOiB2YWx1ZS5jYWNoZS51cmwsXG5cdFx0XHRcdHNpemU6IHZhbHVlLmNhY2hlLnNpemUsXG5cdFx0XHRcdGhhc2g6IHZhbHVlLmNhY2hlLmhhc2hcblx0XHRcdH07XG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9YF0gPSB2YWx1ZS5jYWNoZTtcblx0XHRcdFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc1tgL19fY29yZG92YS9hc3NldHMvJHsga2V5IH0uJHsgdmFsdWUuY2FjaGUuZXh0ZW5zaW9uIH1gXSA9IHZhbHVlLmNhY2hlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBleHRlbnNpb24gPSB2YWx1ZS5kZWZhdWx0VXJsLnNwbGl0KCcuJykucG9wKCk7XG5cdFx0XHRjYWNoZSA9IHtcblx0XHRcdFx0cGF0aDogYGFzc2V0cy8keyBrZXkgfS4keyBleHRlbnNpb24gfWAsXG5cdFx0XHRcdGNhY2hlYWJsZTogZmFsc2UsXG5cdFx0XHRcdHNvdXJjZU1hcFVybDogdW5kZWZpbmVkLFxuXHRcdFx0XHR3aGVyZTogJ2NsaWVudCcsXG5cdFx0XHRcdHR5cGU6ICdhc3NldCcsXG5cdFx0XHRcdHVybDogYC9hc3NldHMvJHsga2V5IH0uJHsgZXh0ZW5zaW9uIH0/djNgLFxuXHRcdFx0XHRoYXNoOiAndjMnXG5cdFx0XHR9O1xuXG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9YF0gPSBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvJHsgdmFsdWUuZGVmYXVsdFVybCB9YF07XG5cdFx0XHRXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvYXNzZXRzLyR7IGtleSB9LiR7IGV4dGVuc2lvbiB9YF0gPSBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNbYC9fX2NvcmRvdmEvJHsgdmFsdWUuZGVmYXVsdFVybCB9YF07XG5cdFx0fVxuXG5cdFx0Y29uc3QgbWFuaWZlc3RJdGVtID0gXy5maW5kV2hlcmUobWFuaWZlc3QsIHtcblx0XHRcdHBhdGg6IGtleVxuXHRcdH0pO1xuXG5cdFx0aWYgKG1hbmlmZXN0SXRlbSkge1xuXHRcdFx0Y29uc3QgaW5kZXggPSBtYW5pZmVzdC5pbmRleE9mKG1hbmlmZXN0SXRlbSk7XG5cdFx0XHRtYW5pZmVzdFtpbmRleF0gPSBjYWNoZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bWFuaWZlc3QucHVzaChjYWNoZSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNhbGN1bGF0ZUNsaWVudEhhc2guY2FsbCh0aGlzLCBtYW5pZmVzdCwgaW5jbHVkZUZpbHRlciwgcnVudGltZUNvbmZpZ092ZXJyaWRlKTtcbn07XG5cbk1ldGVvci5tZXRob2RzKHtcblx0cmVmcmVzaENsaWVudHMoKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3JlZnJlc2hDbGllbnRzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Y29uc3QgaGFzUGVybWlzc2lvbiA9IFJvY2tldENoYXQuYXV0aHouaGFzUGVybWlzc2lvbihNZXRlb3IudXNlcklkKCksICdtYW5hZ2UtYXNzZXRzJyk7XG5cdFx0aWYgKCFoYXNQZXJtaXNzaW9uKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm93LWFsbG93ZWQnLCAnTWFuYWdpbmcgYXNzZXRzIG5vdCBhbGxvd2VkJywge1xuXHRcdFx0XHRtZXRob2Q6ICdyZWZyZXNoQ2xpZW50cycsXG5cdFx0XHRcdGFjdGlvbjogJ01hbmFnaW5nX2Fzc2V0cydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy5yZWZyZXNoQ2xpZW50cygpO1xuXHR9LFxuXG5cdHVuc2V0QXNzZXQoYXNzZXQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5zZXRBc3NldCdcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IGhhc1Blcm1pc3Npb24gPSBSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnbWFuYWdlLWFzc2V0cycpO1xuXHRcdGlmICghaGFzUGVybWlzc2lvbikge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItYWN0aW9uLW5vdy1hbGxvd2VkJywgJ01hbmFnaW5nIGFzc2V0cyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAndW5zZXRBc3NldCcsXG5cdFx0XHRcdGFjdGlvbjogJ01hbmFnaW5nX2Fzc2V0cydcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBSb2NrZXRDaGF0LkFzc2V0cy51bnNldEFzc2V0KGFzc2V0KTtcblx0fSxcblxuXHRzZXRBc3NldChiaW5hcnlDb250ZW50LCBjb250ZW50VHlwZSwgYXNzZXQpIHtcblx0XHRpZiAoIU1ldGVvci51c2VySWQoKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3ItaW52YWxpZC11c2VyJywgJ0ludmFsaWQgdXNlcicsIHtcblx0XHRcdFx0bWV0aG9kOiAnc2V0QXNzZXQnXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRjb25zdCBoYXNQZXJtaXNzaW9uID0gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ21hbmFnZS1hc3NldHMnKTtcblx0XHRpZiAoIWhhc1Blcm1pc3Npb24pIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWFjdGlvbi1ub3ctYWxsb3dlZCcsICdNYW5hZ2luZyBhc3NldHMgbm90IGFsbG93ZWQnLCB7XG5cdFx0XHRcdG1ldGhvZDogJ3NldEFzc2V0Jyxcblx0XHRcdFx0YWN0aW9uOiAnTWFuYWdpbmdfYXNzZXRzJ1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Um9ja2V0Q2hhdC5Bc3NldHMuc2V0QXNzZXQoYmluYXJ5Q29udGVudCwgY29udGVudFR5cGUsIGFzc2V0KTtcblx0fVxufSk7XG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKCcvYXNzZXRzLycsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcblx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdGFzc2V0OiBkZWNvZGVVUklDb21wb25lbnQocmVxLnVybC5yZXBsYWNlKC9eXFwvLywgJycpLnJlcGxhY2UoL1xcPy4qJC8sICcnKSkucmVwbGFjZSgvXFwuW14uXSokLywgJycpXG5cdH07XG5cblx0Y29uc3QgZmlsZSA9IGFzc2V0c1twYXJhbXMuYXNzZXRdICYmIGFzc2V0c1twYXJhbXMuYXNzZXRdLmNhY2hlO1xuXG5cdGlmICghZmlsZSkge1xuXHRcdGlmIChhc3NldHNbcGFyYW1zLmFzc2V0XSAmJiBhc3NldHNbcGFyYW1zLmFzc2V0XS5kZWZhdWx0VXJsKSB7XG5cdFx0XHRyZXEudXJsID0gYC8keyBhc3NldHNbcGFyYW1zLmFzc2V0XS5kZWZhdWx0VXJsIH1gO1xuXHRcdFx0V2ViQXBwSW50ZXJuYWxzLnN0YXRpY0ZpbGVzTWlkZGxld2FyZShXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXMsIHJlcSwgcmVzLCBuZXh0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdH1cblxuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IHJlcU1vZGlmaWVkSGVhZGVyID0gcmVxLmhlYWRlcnNbJ2lmLW1vZGlmaWVkLXNpbmNlJ107XG5cdGlmIChyZXFNb2RpZmllZEhlYWRlcikge1xuXHRcdGlmIChyZXFNb2RpZmllZEhlYWRlciA9PT0gKGZpbGUudXBsb2FkRGF0ZSAmJiBmaWxlLnVwbG9hZERhdGUudG9VVENTdHJpbmcoKSkpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCByZXFNb2RpZmllZEhlYWRlcik7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDMwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG5cblx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICdwdWJsaWMsIG1heC1hZ2U9MCcpO1xuXHRyZXMuc2V0SGVhZGVyKCdFeHBpcmVzJywgJy0xJyk7XG5cdHJlcy5zZXRIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnLCAoZmlsZS51cGxvYWREYXRlICYmIGZpbGUudXBsb2FkRGF0ZS50b1VUQ1N0cmluZygpKSB8fCBuZXcgRGF0ZSgpLnRvVVRDU3RyaW5nKCkpO1xuXHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLmNvbnRlbnRUeXBlKTtcblx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBmaWxlLnNpemUpO1xuXHRyZXMud3JpdGVIZWFkKDIwMCk7XG5cdHJlcy5lbmQoZmlsZS5jb250ZW50KTtcbn0pKTtcbiJdfQ==
