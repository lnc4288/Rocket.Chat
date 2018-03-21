(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChatFile = Package['rocketchat:file'].RocketChatFile;
var Slingshot = Package['edgee:slingshot'].Slingshot;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Random = Package.random.Random;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var FileUpload, FileUploadBase, file, options, fileUploadHandler;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:file-upload":{"globalFileRestrictions.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/globalFileRestrictions.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
const slingShotConfig = {
  authorize(file
  /*, metaContext*/
  ) {
    //Deny uploads if user is not logged in.
    if (!this.userId) {
      throw new Meteor.Error('login-required', 'Please login before posting files');
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      throw new Meteor.Error(TAPi18n.__('error-invalid-file-type'));
    }

    const maxFileSize = RocketChat.settings.get('FileUpload_MaxFileSize');

    if (maxFileSize >= -1 && maxFileSize < file.size) {
      throw new Meteor.Error(TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }));
    }

    return true;
  },

  maxSize: 0,
  allowedFileTypes: null
};
Slingshot.fileRestrictions('rocketchat-uploads', slingShotConfig);
Slingshot.fileRestrictions('rocketchat-uploads-gs', slingShotConfig);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUpload.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let filesize;
module.watch(require("filesize"), {
  default(v) {
    filesize = v;
  }

}, 0);
let maxFileSize = 0;
FileUpload = {
  validateFileUpload(file) {
    if (!Match.test(file.rid, String)) {
      return false;
    }

    const user = Meteor.user();
    const room = RocketChat.models.Rooms.findOneById(file.rid);
    const directMessageAllow = RocketChat.settings.get('FileUpload_Enabled_Direct');
    const fileUploadAllowed = RocketChat.settings.get('FileUpload_Enabled');

    if (RocketChat.authz.canAccessRoom(room, user) !== true) {
      return false;
    }

    if (!fileUploadAllowed) {
      const reason = TAPi18n.__('FileUpload_Disabled', user.language);

      throw new Meteor.Error('error-file-upload-disabled', reason);
    }

    if (!directMessageAllow && room.t === 'd') {
      const reason = TAPi18n.__('File_not_allowed_direct_messages', user.language);

      throw new Meteor.Error('error-direct-message-file-upload-not-allowed', reason);
    } // -1 maxFileSize means there is no limit


    if (maxFileSize >= -1 && file.size > maxFileSize) {
      const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
        size: filesize(maxFileSize)
      }, user.language);

      throw new Meteor.Error('error-file-too-large', reason);
    }

    if (maxFileSize > 0) {
      if (file.size > maxFileSize) {
        const reason = TAPi18n.__('File_exceeds_allowed_size_of_bytes', {
          size: filesize(maxFileSize)
        }, user.language);

        throw new Meteor.Error('error-file-too-large', reason);
      }
    }

    if (!RocketChat.fileUploadIsValidContentType(file.type)) {
      const reason = TAPi18n.__('File_type_is_not_accepted', user.language);

      throw new Meteor.Error('error-invalid-file-type', reason);
    }

    return true;
  }

};
RocketChat.settings.get('FileUpload_MaxFileSize', function (key, value) {
  try {
    maxFileSize = parseInt(value);
  } catch (e) {
    maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileUploadBase.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/lib/FileUploadBase.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
UploadFS.config.defaultStorePermissions = new UploadFS.StorePermissions({
  insert(userId, doc) {
    return userId || doc && doc.message_id && doc.message_id.indexOf('slack-') === 0; // allow inserts from slackbridge (message_id = slack-timestamp-milli)
  },

  update(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  },

  remove(userId, doc) {
    return RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', doc.rid) || RocketChat.settings.get('Message_AllowDeleting') && userId === doc.userId;
  }

});
FileUploadBase = class FileUploadBase {
  constructor(store, meta, file) {
    this.id = Random.id();
    this.meta = meta;
    this.file = file;
    this.store = store;
  }

  getProgress() {}

  getFileName() {
    return this.meta.name;
  }

  start(callback) {
    this.handler = new UploadFS.Uploader({
      store: this.store,
      data: this.file,
      file: this.meta,
      onError: err => {
        return callback(err);
      },
      onComplete: fileData => {
        const file = _.pick(fileData, '_id', 'type', 'size', 'name', 'identify', 'description');

        file.url = fileData.url.replace(Meteor.absoluteUrl(), '/');
        return callback(null, file, this.store.options.name);
      }
    });

    this.handler.onProgress = (file, progress) => {
      this.onProgress(progress);
    };

    return this.handler.start();
  }

  onProgress() {}

  stop() {
    return this.handler.stop();
  }

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"lib":{"FileUpload.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/FileUpload.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  FileUploadClass: () => FileUploadClass
});
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 0);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 1);
let mime;
module.watch(require("mime-type/with-db"), {
  default(v) {
    mime = v;
  }

}, 2);
let Future;
module.watch(require("fibers/future"), {
  default(v) {
    Future = v;
  }

}, 3);
let sharp;
module.watch(require("sharp"), {
  default(v) {
    sharp = v;
  }

}, 4);
let Cookies;
module.watch(require("meteor/ostrio:cookies"), {
  Cookies(v) {
    Cookies = v;
  }

}, 5);
const cookie = new Cookies();
Object.assign(FileUpload, {
  handlers: {},

  configureUploadsStore(store, name, options) {
    const type = name.split(':').pop();
    const stores = UploadFS.getStores();
    delete stores[name];
    return new UploadFS.store[store](Object.assign({
      name
    }, options, FileUpload[`default${type}`]()));
  },

  defaultUploads() {
    return {
      collection: RocketChat.models.Uploads.model,
      filter: new UploadFS.Filter({
        onCheck: FileUpload.validateFileUpload
      }),

      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/uploads/${file.rid}/${file.userId}/${file._id}`;
      },

      onValidate: FileUpload.uploadsOnValidate,

      onRead(fileId, file, req, res) {
        if (!FileUpload.requestCanAccessFiles(req)) {
          res.writeHead(403);
          return false;
        }

        res.setHeader('content-disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        return true;
      }

    };
  },

  defaultAvatars() {
    return {
      collection: RocketChat.models.Avatars.model,

      // filter: new UploadFS.Filter({
      // 	onCheck: FileUpload.validateFileUpload
      // }),
      getPath(file) {
        return `${RocketChat.settings.get('uniqueID')}/avatars/${file.userId}`;
      },

      onValidate: FileUpload.avatarsOnValidate,
      onFinishUpload: FileUpload.avatarsOnFinishUpload
    };
  },

  avatarsOnValidate(file) {
    if (RocketChat.settings.get('Accounts_AvatarResize') !== true) {
      return;
    }

    const tempFilePath = UploadFS.getTempFilePath(file._id);
    const height = RocketChat.settings.get('Accounts_AvatarSize');
    const future = new Future();
    const s = sharp(tempFilePath);
    s.rotate(); // Get metadata to resize the image the first time to keep "inside" the dimensions
    // then resize again to create the canvas around

    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      s.toFormat(sharp.format.jpeg).resize(Math.min(height, metadata.width), Math.min(height, metadata.height)).pipe(sharp().resize(height, height).background('#FFFFFF').embed()) // Use buffer to get the result in memory then replace the existing file
      // There is no option to override a file using this library
      .toBuffer().then(Meteor.bindEnvironment(outputBuffer => {
        fs.writeFile(tempFilePath, outputBuffer, Meteor.bindEnvironment(err => {
          if (err != null) {
            console.error(err);
          }

          const size = fs.lstatSync(tempFilePath).size;
          this.getCollection().direct.update({
            _id: file._id
          }, {
            $set: {
              size
            }
          });
          future.return();
        }));
      }));
    }));
    return future.wait();
  },

  resizeImagePreview(file) {
    file = RocketChat.models.Uploads.findOneById(file._id);
    file = FileUpload.addExtensionTo(file);

    const image = FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);

    const transformer = sharp().resize(32, 32).max().jpeg().blur();
    const result = transformer.toBuffer().then(out => out.toString('base64'));
    image.pipe(transformer);
    return result;
  },

  uploadsOnValidate(file) {
    if (!/^image\/((x-windows-)?bmp|p?jpeg|png)$/.test(file.type)) {
      return;
    }

    const tmpFile = UploadFS.getTempFilePath(file._id);
    const fut = new Future();
    const s = sharp(tmpFile);
    s.metadata(Meteor.bindEnvironment((err, metadata) => {
      if (err != null) {
        console.error(err);
        return fut.return();
      }

      const identify = {
        format: metadata.format,
        size: {
          width: metadata.width,
          height: metadata.height
        }
      };

      if (metadata.orientation == null) {
        return fut.return();
      }

      s.rotate().toFile(`${tmpFile}.tmp`).then(Meteor.bindEnvironment(() => {
        fs.unlink(tmpFile, Meteor.bindEnvironment(() => {
          fs.rename(`${tmpFile}.tmp`, tmpFile, Meteor.bindEnvironment(() => {
            const size = fs.lstatSync(tmpFile).size;
            this.getCollection().direct.update({
              _id: file._id
            }, {
              $set: {
                size,
                identify
              }
            });
            fut.return();
          }));
        }));
      })).catch(err => {
        console.error(err);
        fut.return();
      });
    }));
    return fut.wait();
  },

  avatarsOnFinishUpload(file) {
    // update file record to match user's username
    const user = RocketChat.models.Users.findOneById(file.userId);
    const oldAvatar = RocketChat.models.Avatars.findOneByName(user.username);

    if (oldAvatar) {
      RocketChat.models.Avatars.deleteFile(oldAvatar._id);
    }

    RocketChat.models.Avatars.updateFileNameById(file._id, user.username); // console.log('upload finished ->', file);
  },

  requestCanAccessFiles({
    headers = {},
    query = {}
  }) {
    if (!RocketChat.settings.get('FileUpload_ProtectFiles')) {
      return true;
    }

    let {
      rc_uid,
      rc_token
    } = query;

    if (!rc_uid && headers.cookie) {
      rc_uid = cookie.get('rc_uid', headers.cookie);
      rc_token = cookie.get('rc_token', headers.cookie);
    }

    if (!rc_uid || !rc_token || !RocketChat.models.Users.findOneByIdAndLoginToken(rc_uid, rc_token)) {
      return false;
    }

    return true;
  },

  addExtensionTo(file) {
    if (mime.lookup(file.name) === file.type) {
      return file;
    }

    const ext = mime.extension(file.type);

    if (ext && false === new RegExp(`\.${ext}$`, 'i').test(file.name)) {
      file.name = `${file.name}.${ext}`;
    }

    return file;
  },

  getStore(modelName) {
    const storageType = RocketChat.settings.get('FileUpload_Storage_Type');
    const handlerName = `${storageType}:${modelName}`;
    return this.getStoreByName(handlerName);
  },

  getStoreByName(handlerName) {
    if (this.handlers[handlerName] == null) {
      console.error(`Upload handler "${handlerName}" does not exists`);
    }

    return this.handlers[handlerName];
  },

  get(file, req, res, next) {
    const store = this.getStoreByName(file.store);

    if (store && store.get) {
      return store.get(file, req, res, next);
    }

    res.writeHead(404);
    res.end();
  }

});

class FileUploadClass {
  constructor({
    name,
    model,
    store,
    get,
    insert,
    getStore
  }) {
    this.name = name;
    this.model = model || this.getModelFromName();
    this._store = store || UploadFS.getStore(name);
    this.get = get;

    if (insert) {
      this.insert = insert;
    }

    if (getStore) {
      this.getStore = getStore;
    }

    FileUpload.handlers[name] = this;
  }

  getStore() {
    return this._store;
  }

  get store() {
    return this.getStore();
  }

  set store(store) {
    this._store = store;
  }

  getModelFromName() {
    return RocketChat.models[this.name.split(':')[1]];
  }

  delete(fileId) {
    if (this.store && this.store.delete) {
      this.store.delete(fileId);
    }

    return this.model.deleteFile(fileId);
  }

  deleteById(fileId) {
    const file = this.model.findOneById(fileId);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  deleteByName(fileName) {
    const file = this.model.findOneByName(fileName);

    if (!file) {
      return;
    }

    const store = FileUpload.getStoreByName(file.store);
    return store.delete(file._id);
  }

  insert(fileData, streamOrBuffer, cb) {
    fileData.size = parseInt(fileData.size) || 0; // Check if the fileData matches store filter

    const filter = this.store.getFilter();

    if (filter && filter.check) {
      filter.check(fileData);
    }

    const fileId = this.store.create(fileData);
    const token = this.store.createToken(fileId);
    const tmpFile = UploadFS.getTempFilePath(fileId);

    try {
      if (streamOrBuffer instanceof stream) {
        streamOrBuffer.pipe(fs.createWriteStream(tmpFile));
      } else if (streamOrBuffer instanceof Buffer) {
        fs.writeFileSync(tmpFile, streamOrBuffer);
      } else {
        throw new Error('Invalid file type');
      }

      const file = Meteor.call('ufsComplete', fileId, this.name, token);

      if (cb) {
        cb(null, file);
      }

      return file;
    } catch (e) {
      if (cb) {
        cb(e);
      } else {
        throw e;
      }
    }
  }

}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"proxy.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/proxy.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 0);
let URL;
module.watch(require("url"), {
  default(v) {
    URL = v;
  }

}, 1);
const logger = new Logger('UploadProxy');
WebApp.connectHandlers.stack.unshift({
  route: '',
  handle: Meteor.bindEnvironment(function (req, res, next) {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      return next();
    }

    logger.debug('Upload URL:', req.url);

    if (req.method !== 'POST') {
      return next();
    } // Remove store path


    const parsedUrl = URL.parse(req.url);
    const path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1); // Get store

    const regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
    const match = regExp.exec(path); // Request is not valid

    if (match === null) {
      res.writeHead(400);
      res.end();
      return;
    } // Get store


    const store = UploadFS.getStore(match[1]);

    if (!store) {
      res.writeHead(404);
      res.end();
      return;
    } // Get file


    const fileId = match[2];
    const file = store.getCollection().findOne({
      _id: fileId
    });

    if (file === undefined) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (file.instanceId === InstanceStatus.id()) {
      logger.debug('Correct instance');
      return next();
    } // Proxy to other instance


    const instance = InstanceStatus.getCollection().findOne({
      _id: file.instanceId
    });

    if (instance == null) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (instance.extraInformation.host === process.env.INSTANCE_IP && RocketChat.isDocker() === false) {
      instance.extraInformation.host = 'localhost';
    }

    logger.debug('Wrong instance, proxing to:', `${instance.extraInformation.host}:${instance.extraInformation.port}`);
    const options = {
      hostname: instance.extraInformation.host,
      port: instance.extraInformation.port,
      path: req.originalUrl,
      method: 'POST'
    };
    const proxy = http.request(options, function (proxy_res) {
      proxy_res.pipe(res, {
        end: true
      });
    });
    req.pipe(proxy, {
      end: true
    });
  })
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requests.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/lib/requests.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals FileUpload, WebApp */
WebApp.connectHandlers.use('/file-upload/', function (req, res, next) {
  const match = /^\/([^\/]+)\/(.*)/.exec(req.url);

  if (match[1]) {
    const file = RocketChat.models.Uploads.findOneById(match[1]);

    if (file) {
      if (!Meteor.settings.public.sandstorm && !FileUpload.requestCanAccessFiles(req)) {
        res.writeHead(403);
        return res.end();
      }

      res.setHeader('Content-Security-Policy', 'default-src \'none\'');
      return FileUpload.get(file, req, res, next);
    }
  }

  res.writeHead(404);
  res.end();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"config":{"_configUploadStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/_configUploadStorage.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
module.watch(require("./AmazonS3.js"));
module.watch(require("./FileSystem.js"));
module.watch(require("./GoogleStorage.js"));
module.watch(require("./GridFS.js"));
module.watch(require("./Slingshot_DEPRECATED.js"));

const configStore = _.debounce(() => {
  const store = RocketChat.settings.get('FileUpload_Storage_Type');

  if (store) {
    console.log('Setting default file store to', store);
    UploadFS.getStores().Avatars = UploadFS.getStore(`${store}:Avatars`);
    UploadFS.getStores().Uploads = UploadFS.getStore(`${store}:Uploads`);
  }
}, 1000);

RocketChat.settings.get(/^FileUpload_/, configStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"AmazonS3.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/AmazonS3.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/AmazonS3/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  const fileUrl = this.store.getRedirectURL(file);

  if (fileUrl) {
    if (RocketChat.settings.get('FileUpload_S3_Proxy')) {
      const request = /^https:/.test(fileUrl) ? https : http;
      request.get(fileUrl, fileRes => fileRes.pipe(res));
    } else {
      res.setHeader('Location', fileUrl);
      res.writeHead(302);
      res.end();
    }
  } else {
    res.end();
  }
};

const AmazonS3Uploads = new FileUploadClass({
  name: 'AmazonS3:Uploads',
  get // store setted bellow

});
const AmazonS3Avatars = new FileUploadClass({
  name: 'AmazonS3:Avatars',
  get // store setted bellow

});

const configure = _.debounce(function () {
  const Bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const Acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const AWSAccessKeyId = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const AWSSecretAccessKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');
  const Region = RocketChat.settings.get('FileUpload_S3_Region');
  const SignatureVersion = RocketChat.settings.get('FileUpload_S3_SignatureVersion');
  const ForcePathStyle = RocketChat.settings.get('FileUpload_S3_ForcePathStyle'); // const CDN = RocketChat.settings.get('FileUpload_S3_CDN');

  const BucketURL = RocketChat.settings.get('FileUpload_S3_BucketURL');

  if (!Bucket || !AWSAccessKeyId || !AWSSecretAccessKey) {
    return;
  }

  const config = {
    connection: {
      accessKeyId: AWSAccessKeyId,
      secretAccessKey: AWSSecretAccessKey,
      signatureVersion: SignatureVersion,
      s3ForcePathStyle: ForcePathStyle,
      params: {
        Bucket,
        ACL: Acl
      },
      region: Region
    },
    URLExpiryTimeSpan
  };

  if (BucketURL) {
    config.connection.endpoint = BucketURL;
  }

  AmazonS3Uploads.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Uploads.name, config);
  AmazonS3Avatars.store = FileUpload.configureUploadsStore('AmazonS3', AmazonS3Avatars.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_S3_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"FileSystem.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/FileSystem.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let fs;
module.watch(require("fs"), {
  default(v) {
    fs = v;
  }

}, 1);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 2);
const FileSystemUploads = new FileUploadClass({
  name: 'FileSystem:Uploads',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
        res.setHeader('Content-Type', file.type);
        res.setHeader('Content-Length', file.size);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});
const FileSystemAvatars = new FileUploadClass({
  name: 'FileSystem:Avatars',

  // store setted bellow
  get(file, req, res) {
    const filePath = this.store.getFilePath(file._id, file);

    try {
      const stat = Meteor.wrapAsync(fs.stat)(filePath);

      if (stat && stat.isFile()) {
        file = FileUpload.addExtensionTo(file);
        this.store.getReadStream(file._id, file).pipe(res);
      }
    } catch (e) {
      res.writeHead(404);
      res.end();
      return;
    }
  }

});

const createFileSystemStore = _.debounce(function () {
  const options = {
    path: RocketChat.settings.get('FileUpload_FileSystemPath') //'/tmp/uploads/photos',

  };
  FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
  FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options); // DEPRECATED backwards compatibililty (remove)

  UploadFS.getStores()['fileSystem'] = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

RocketChat.settings.get('FileUpload_FileSystemPath', createFileSystemStore);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GoogleStorage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GoogleStorage.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 1);
module.watch(require("../../ufs/GoogleStorage/server.js"));
let http;
module.watch(require("http"), {
  default(v) {
    http = v;
  }

}, 2);
let https;
module.watch(require("https"), {
  default(v) {
    https = v;
  }

}, 3);

const get = function (file, req, res) {
  this.store.getRedirectURL(file, (err, fileUrl) => {
    if (err) {
      console.error(err);
    }

    if (fileUrl) {
      if (RocketChat.settings.get('FileUpload_GoogleStorage_Proxy')) {
        const request = /^https:/.test(fileUrl) ? https : http;
        request.get(fileUrl, fileRes => fileRes.pipe(res));
      } else {
        res.setHeader('Location', fileUrl);
        res.writeHead(302);
        res.end();
      }
    } else {
      res.end();
    }
  });
};

const GoogleCloudStorageUploads = new FileUploadClass({
  name: 'GoogleCloudStorage:Uploads',
  get // store setted bellow

});
const GoogleCloudStorageAvatars = new FileUploadClass({
  name: 'GoogleCloudStorage:Avatars',
  get // store setted bellow

});

const configure = _.debounce(function () {
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  const URLExpiryTimeSpan = RocketChat.settings.get('FileUpload_S3_URLExpiryTimeSpan');

  if (!bucket || !accessId || !secret) {
    return;
  }

  const config = {
    connection: {
      credentials: {
        client_email: accessId,
        private_key: secret
      }
    },
    bucket,
    URLExpiryTimeSpan
  };
  GoogleCloudStorageUploads.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageUploads.name, config);
  GoogleCloudStorageAvatars.store = FileUpload.configureUploadsStore('GoogleStorage', GoogleCloudStorageAvatars.name, config);
}, 500);

RocketChat.settings.get(/^FileUpload_GoogleStorage_/, configure);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"GridFS.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/GridFS.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 0);
let zlib;
module.watch(require("zlib"), {
  default(v) {
    zlib = v;
  }

}, 1);
let util;
module.watch(require("util"), {
  default(v) {
    util = v;
  }

}, 2);
let FileUploadClass;
module.watch(require("../lib/FileUpload"), {
  FileUploadClass(v) {
    FileUploadClass = v;
  }

}, 3);
const logger = new Logger('FileUpload');

function ExtractRange(options) {
  if (!(this instanceof ExtractRange)) {
    return new ExtractRange(options);
  }

  this.start = options.start;
  this.stop = options.stop;
  this.bytes_read = 0;
  stream.Transform.call(this, options);
}

util.inherits(ExtractRange, stream.Transform);

ExtractRange.prototype._transform = function (chunk, enc, cb) {
  if (this.bytes_read > this.stop) {
    // done reading
    this.end();
  } else if (this.bytes_read + chunk.length < this.start) {// this chunk is still before the start byte
  } else {
    let start;
    let stop;

    if (this.start <= this.bytes_read) {
      start = 0;
    } else {
      start = this.start - this.bytes_read;
    }

    if (this.stop - this.bytes_read + 1 < chunk.length) {
      stop = this.stop - this.bytes_read + 1;
    } else {
      stop = chunk.length;
    }

    const newchunk = chunk.slice(start, stop);
    this.push(newchunk);
  }

  this.bytes_read += chunk.length;
  cb();
};

const getByteRange = function (header) {
  if (header) {
    const matches = header.match(/(\d+)-(\d+)/);

    if (matches) {
      return {
        start: parseInt(matches[1], 10),
        stop: parseInt(matches[2], 10)
      };
    }
  }

  return null;
}; // code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310


const readFromGridFS = function (storeName, fileId, file, req, res) {
  const store = UploadFS.getStore(storeName);
  const rs = store.getReadStream(fileId, file);
  const ws = new stream.PassThrough();
  [rs, ws].forEach(stream => stream.on('error', function (err) {
    store.onReadError.call(store, err, fileId, file);
    res.end();
  }));
  ws.on('close', function () {
    // Close output stream at the end
    ws.emit('end');
  });
  const accept = req.headers['accept-encoding'] || ''; // Transform stream

  store.transformRead(rs, ws, fileId, file, req);
  const range = getByteRange(req.headers.range);
  let out_of_range = false;

  if (range) {
    out_of_range = range.start > file.size || range.stop <= range.start || range.stop > file.size;
  } // Compress data using gzip


  if (accept.match(/\bgzip\b/) && range === null) {
    res.setHeader('Content-Encoding', 'gzip');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createGzip()).pipe(res);
  } else if (accept.match(/\bdeflate\b/) && range === null) {
    // Compress data using deflate
    res.setHeader('Content-Encoding', 'deflate');
    res.removeHeader('Content-Length');
    res.writeHead(200);
    ws.pipe(zlib.createDeflate()).pipe(res);
  } else if (range && out_of_range) {
    // out of range request, return 416
    res.removeHeader('Content-Length');
    res.removeHeader('Content-Type');
    res.removeHeader('Content-Disposition');
    res.removeHeader('Last-Modified');
    res.setHeader('Content-Range', `bytes */${file.size}`);
    res.writeHead(416);
    res.end();
  } else if (range) {
    res.setHeader('Content-Range', `bytes ${range.start}-${range.stop}/${file.size}`);
    res.removeHeader('Content-Length');
    res.setHeader('Content-Length', range.stop - range.start + 1);
    res.writeHead(206);
    logger.debug('File upload extracting range');
    ws.pipe(new ExtractRange({
      start: range.start,
      stop: range.stop
    })).pipe(res);
  } else {
    res.writeHead(200);
    ws.pipe(res);
  }
};

FileUpload.configureUploadsStore('GridFS', 'GridFS:Uploads', {
  collectionName: 'rocketchat_uploads'
}); // DEPRECATED: backwards compatibility (remove)

UploadFS.getStores()['rocketchat_uploads'] = UploadFS.getStores()['GridFS:Uploads'];
FileUpload.configureUploadsStore('GridFS', 'GridFS:Avatars', {
  collectionName: 'rocketchat_avatars'
});
new FileUploadClass({
  name: 'GridFS:Uploads',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Length', file.size);
    return readFromGridFS(file.store, file._id, file, req, res);
  }

});
new FileUploadClass({
  name: 'GridFS:Avatars',

  get(file, req, res) {
    file = FileUpload.addExtensionTo(file);
    return readFromGridFS(file.store, file._id, file, req, res);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Slingshot_DEPRECATED.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/config/Slingshot_DEPRECATED.js                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const configureSlingshot = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_S3_Bucket');
  const acl = RocketChat.settings.get('FileUpload_S3_Acl');
  const accessKey = RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId');
  const secretKey = RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey');
  const cdn = RocketChat.settings.get('FileUpload_S3_CDN');
  const region = RocketChat.settings.get('FileUpload_S3_Region');
  const bucketUrl = RocketChat.settings.get('FileUpload_S3_BucketURL');
  delete Slingshot._directives['rocketchat-uploads'];

  if (type === 'AmazonS3' && !_.isEmpty(bucket) && !_.isEmpty(accessKey) && !_.isEmpty(secretKey)) {
    if (Slingshot._directives['rocketchat-uploads']) {
      delete Slingshot._directives['rocketchat-uploads'];
    }

    const config = {
      bucket,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          AmazonS3: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'AmazonS3:Uploads', file, upload);
        return path;
      },

      AWSAccessKeyId: accessKey,
      AWSSecretAccessKey: secretKey
    };

    if (!_.isEmpty(acl)) {
      config.acl = acl;
    }

    if (!_.isEmpty(cdn)) {
      config.cdn = cdn;
    }

    if (!_.isEmpty(region)) {
      config.region = region;
    }

    if (!_.isEmpty(bucketUrl)) {
      config.bucketUrl = bucketUrl;
    }

    try {
      Slingshot.createDirective('rocketchat-uploads', Slingshot.S3Storage, config);
    } catch (e) {
      console.error('Error configuring S3 ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', configureSlingshot);
RocketChat.settings.get(/^FileUpload_S3_/, configureSlingshot);

const createGoogleStorageDirective = _.debounce(() => {
  const type = RocketChat.settings.get('FileUpload_Storage_Type');
  const bucket = RocketChat.settings.get('FileUpload_GoogleStorage_Bucket');
  const accessId = RocketChat.settings.get('FileUpload_GoogleStorage_AccessId');
  const secret = RocketChat.settings.get('FileUpload_GoogleStorage_Secret');
  delete Slingshot._directives['rocketchat-uploads-gs'];

  if (type === 'GoogleCloudStorage' && !_.isEmpty(secret) && !_.isEmpty(accessId) && !_.isEmpty(bucket)) {
    if (Slingshot._directives['rocketchat-uploads-gs']) {
      delete Slingshot._directives['rocketchat-uploads-gs'];
    }

    const config = {
      bucket,
      GoogleAccessId: accessId,
      GoogleSecretKey: secret,

      key(file, metaContext) {
        const id = Random.id();
        const path = `${RocketChat.settings.get('uniqueID')}/uploads/${metaContext.rid}/${this.userId}/${id}`;
        const upload = {
          _id: id,
          rid: metaContext.rid,
          GoogleStorage: {
            path
          }
        };
        RocketChat.models.Uploads.insertFileInit(this.userId, 'GoogleCloudStorage:Uploads', file, upload);
        return path;
      }

    };

    try {
      Slingshot.createDirective('rocketchat-uploads-gs', Slingshot.GoogleCloud, config);
    } catch (e) {
      console.error('Error configuring GoogleCloudStorage ->', e.message);
    }
  }
}, 500);

RocketChat.settings.get('FileUpload_Storage_Type', createGoogleStorageDirective);
RocketChat.settings.get(/^FileUpload_GoogleStorage_/, createGoogleStorageDirective);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"sendFileMessage.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/sendFileMessage.js                                                   //
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
  'sendFileMessage'(roomId, store, file, msgData = {}) {
    return Promise.asyncApply(() => {
      if (!Meteor.userId()) {
        throw new Meteor.Error('error-invalid-user', 'Invalid user', {
          method: 'sendFileMessage'
        });
      }

      const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());

      if (!room) {
        return false;
      }

      check(msgData, {
        avatar: Match.Optional(String),
        emoji: Match.Optional(String),
        alias: Match.Optional(String),
        groupable: Match.Optional(Boolean),
        msg: Match.Optional(String)
      });
      RocketChat.models.Uploads.updateFileComplete(file._id, Meteor.userId(), _.omit(file, '_id'));
      const fileUrl = `/file-upload/${file._id}/${encodeURI(file.name)}`;
      const attachment = {
        title: file.name,
        type: 'file',
        description: file.description,
        title_link: fileUrl,
        title_link_download: true
      };

      if (/^image\/.+/.test(file.type)) {
        attachment.image_url = fileUrl;
        attachment.image_type = file.type;
        attachment.image_size = file.size;

        if (file.identify && file.identify.size) {
          attachment.image_dimensions = file.identify.size;
        }

        attachment.image_preview = Promise.await(FileUpload.resizeImagePreview(file));
      } else if (/^audio\/.+/.test(file.type)) {
        attachment.audio_url = fileUrl;
        attachment.audio_type = file.type;
        attachment.audio_size = file.size;
      } else if (/^video\/.+/.test(file.type)) {
        attachment.video_url = fileUrl;
        attachment.video_type = file.type;
        attachment.video_size = file.size;
      }

      const user = Meteor.user();
      let msg = Object.assign({
        _id: Random.id(),
        rid: roomId,
        ts: new Date(),
        msg: '',
        file: {
          _id: file._id,
          name: file.name,
          type: file.type
        },
        groupable: false,
        attachments: [attachment]
      }, msgData);
      msg = Meteor.call('sendMessage', msg);
      Meteor.defer(() => RocketChat.callbacks.run('afterFileUpload', {
        user,
        room,
        message: msg
      }));
      return msg;
    });
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getS3FileUrl.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/methods/getS3FileUrl.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* globals UploadFS */
let protectedFiles;
RocketChat.settings.get('FileUpload_ProtectFiles', function (key, value) {
  protectedFiles = value;
});
Meteor.methods({
  getS3FileUrl(fileId) {
    if (protectedFiles && !Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'sendFileMessage'
      });
    }

    const file = RocketChat.models.Uploads.findOneById(fileId);
    return UploadFS.getStore('AmazonS3:Uploads').getRedirectURL(file);
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"startup":{"settings.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/server/startup/settings.js                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
RocketChat.settings.addGroup('FileUpload', function () {
  this.add('FileUpload_Enabled', true, {
    type: 'boolean',
    public: true
  });
  this.add('FileUpload_MaxFileSize', 2097152, {
    type: 'int',
    public: true
  });
  this.add('FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,application/zip,application/x-rar-compressed,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document', {
    type: 'string',
    public: true,
    i18nDescription: 'FileUpload_MediaTypeWhiteListDescription'
  });
  this.add('FileUpload_ProtectFiles', true, {
    type: 'boolean',
    public: true,
    i18nDescription: 'FileUpload_ProtectFilesDescription'
  });
  this.add('FileUpload_Storage_Type', 'GridFS', {
    type: 'select',
    values: [{
      key: 'GridFS',
      i18nLabel: 'GridFS'
    }, {
      key: 'AmazonS3',
      i18nLabel: 'AmazonS3'
    }, {
      key: 'GoogleCloudStorage',
      i18nLabel: 'GoogleCloudStorage'
    }, {
      key: 'FileSystem',
      i18nLabel: 'FileSystem'
    }],
    public: true
  });
  this.section('Amazon S3', function () {
    this.add('FileUpload_S3_Bucket', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Acl', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSAccessKeyId', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_AWSSecretAccessKey', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_CDN', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_Region', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_BucketURL', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'Override_URL_to_which_files_are_uploaded_This_url_also_used_for_downloads_unless_a_CDN_is_given.'
    });
    this.add('FileUpload_S3_SignatureVersion', 'v4', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_ForcePathStyle', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
    this.add('FileUpload_S3_URLExpiryTimeSpan', 120, {
      type: 'int',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      },
      i18nDescription: 'FileUpload_S3_URLExpiryTimeSpan_Description'
    });
    this.add('FileUpload_S3_Proxy', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'AmazonS3'
      }
    });
  });
  this.section('Google Cloud Storage', function () {
    this.add('FileUpload_GoogleStorage_Bucket', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_AccessId', '', {
      type: 'string',
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Secret', '', {
      type: 'string',
      multiline: true,
      private: true,
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
    this.add('FileUpload_GoogleStorage_Proxy', false, {
      type: 'boolean',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'GoogleCloudStorage'
      }
    });
  });
  this.section('File System', function () {
    this.add('FileUpload_FileSystemPath', '', {
      type: 'string',
      enableQuery: {
        _id: 'FileUpload_Storage_Type',
        value: 'FileSystem'
      }
    });
  });
  this.add('FileUpload_Enabled_Direct', true, {
    type: 'boolean',
    public: true
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"ufs":{"AmazonS3":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/AmazonS3/server.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  AmazonS3Store: () => AmazonS3Store
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);

let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 1);
let S3;
module.watch(require("aws-sdk/clients/s3"), {
  default(v) {
    S3 = v;
  }

}, 2);
let stream;
module.watch(require("stream"), {
  default(v) {
    stream = v;
  }

}, 3);

class AmazonS3Store extends UploadFS.Store {
  constructor(options) {
    // Default options
    // options.secretAccessKey,
    // options.accessKeyId,
    // options.region,
    // options.sslEnabled // optional
    options = _.extend({
      httpOptions: {
        timeout: 6000,
        agent: false
      }
    }, options);
    super(options);
    const classOptions = options;
    const s3 = new S3(options.connection);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.AmazonS3) {
        return file.AmazonS3.path;
      } // Compatibility
      // TODO: Migration


      if (file.s3) {
        return file.s3.path + file._id;
      }
    };

    this.getRedirectURL = function (file) {
      const params = {
        Key: this.getPath(file),
        Expires: classOptions.URLExpiryTimeSpan
      };
      return s3.getSignedUrl('getObject', params);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.AmazonS3 = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      const params = {
        Key: this.getPath(file)
      };
      s3.deleteObject(params, (err, data) => {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const params = {
        Key: this.getPath(file)
      };

      if (options.start && options.end) {
        params.Range = `${options.start} - ${options.end}`;
      }

      return s3.getObject(params).createReadStream();
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      const writeStream = new stream.PassThrough();
      writeStream.length = file.size;
      writeStream.on('newListener', (event, listener) => {
        if (event === 'finish') {
          process.nextTick(() => {
            writeStream.removeListener(event, listener);
            writeStream.on('real_finish', listener);
          });
        }
      });
      s3.putObject({
        Key: this.getPath(file),
        Body: writeStream,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${encodeURI(file.name)}"`
      }, error => {
        if (error) {
          console.error(error);
        }

        writeStream.emit('real_finish');
      });
      return writeStream;
    };
  }

}

// Add store to UFS namespace
UploadFS.store.AmazonS3 = AmazonS3Store;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"GoogleStorage":{"server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/rocketchat_file-upload/ufs/GoogleStorage/server.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  GoogleStorageStore: () => GoogleStorageStore
});
let UploadFS;
module.watch(require("meteor/jalik:ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 0);
let gcStorage;
module.watch(require("@google-cloud/storage"), {
  default(v) {
    gcStorage = v;
  }

}, 1);

class GoogleStorageStore extends UploadFS.Store {
  constructor(options) {
    super(options);
    const gcs = gcStorage(options.connection);
    this.bucket = gcs.bucket(options.bucket);

    options.getPath = options.getPath || function (file) {
      return file._id;
    };

    this.getPath = function (file) {
      if (file.GoogleStorage) {
        return file.GoogleStorage.path;
      } // Compatibility
      // TODO: Migration


      if (file.googleCloudStorage) {
        return file.googleCloudStorage.path + file._id;
      }
    };

    this.getRedirectURL = function (file, callback) {
      const params = {
        action: 'read',
        responseDisposition: 'inline',
        expires: Date.now() + this.options.URLExpiryTimeSpan * 1000
      };
      this.bucket.file(this.getPath(file)).getSignedUrl(params, callback);
    };
    /**
     * Creates the file in the collection
     * @param file
     * @param callback
     * @return {string}
     */


    this.create = function (file, callback) {
      check(file, Object);

      if (file._id == null) {
        file._id = Random.id();
      }

      file.GoogleStorage = {
        path: this.options.getPath(file)
      };
      file.store = this.options.name; // assign store to file

      return this.getCollection().insert(file, callback);
    };
    /**
     * Removes the file
     * @param fileId
     * @param callback
     */


    this.delete = function (fileId, callback) {
      const file = this.getCollection().findOne({
        _id: fileId
      });
      this.bucket.file(this.getPath(file)).delete(function (err, data) {
        if (err) {
          console.error(err);
        }

        callback && callback(err, data);
      });
    };
    /**
     * Returns the file read stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getReadStream = function (fileId, file, options = {}) {
      const config = {};

      if (options.start != null) {
        config.start = options.start;
      }

      if (options.end != null) {
        config.end = options.end;
      }

      return this.bucket.file(this.getPath(file)).createReadStream(config);
    };
    /**
     * Returns the file write stream
     * @param fileId
     * @param file
     * @param options
     * @return {*}
     */


    this.getWriteStream = function (fileId, file
    /*, options*/
    ) {
      return this.bucket.file(this.getPath(file)).createWriteStream({
        gzip: false,
        metadata: {
          contentType: file.type,
          contentDisposition: `inline; filename=${file.name}` // metadata: {
          // 	custom: 'metadata'
          // }

        }
      });
    };
  }

}

// Add store to UFS namespace
UploadFS.store.GoogleStorage = GoogleStorageStore;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:file-upload/globalFileRestrictions.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/lib/FileUploadBase.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/FileUpload.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/proxy.js");
require("/node_modules/meteor/rocketchat:file-upload/server/lib/requests.js");
require("/node_modules/meteor/rocketchat:file-upload/server/config/_configUploadStorage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/sendFileMessage.js");
require("/node_modules/meteor/rocketchat:file-upload/server/methods/getS3FileUrl.js");
require("/node_modules/meteor/rocketchat:file-upload/server/startup/settings.js");

/* Exports */
Package._define("rocketchat:file-upload", {
  fileUploadHandler: fileUploadHandler,
  FileUpload: FileUpload
});

})();

//# sourceURL=meteor://💻app/packages/rocketchat_file-upload.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9nbG9iYWxGaWxlUmVzdHJpY3Rpb25zLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL2xpYi9GaWxlVXBsb2FkQmFzZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL0ZpbGVVcGxvYWQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2xpYi9wcm94eS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvbGliL3JlcXVlc3RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvX2NvbmZpZ1VwbG9hZFN0b3JhZ2UuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9BbWF6b25TMy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvY29uZmlnL0ZpbGVTeXN0ZW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL2NvbmZpZy9Hb29nbGVTdG9yYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvR3JpZEZTLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9jb25maWcvU2xpbmdzaG90X0RFUFJFQ0FURUQuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6ZmlsZS11cGxvYWQvc2VydmVyL21ldGhvZHMvc2VuZEZpbGVNZXNzYWdlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3NlcnZlci9tZXRob2RzL2dldFMzRmlsZVVybC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC9zZXJ2ZXIvc3RhcnR1cC9zZXR0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpmaWxlLXVwbG9hZC91ZnMvQW1hem9uUzMvc2VydmVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmZpbGUtdXBsb2FkL3Vmcy9Hb29nbGVTdG9yYWdlL3NlcnZlci5qcyJdLCJuYW1lcyI6WyJmaWxlc2l6ZSIsIm1vZHVsZSIsIndhdGNoIiwicmVxdWlyZSIsImRlZmF1bHQiLCJ2Iiwic2xpbmdTaG90Q29uZmlnIiwiYXV0aG9yaXplIiwiZmlsZSIsInVzZXJJZCIsIk1ldGVvciIsIkVycm9yIiwiUm9ja2V0Q2hhdCIsImZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUiLCJ0eXBlIiwiVEFQaTE4biIsIl9fIiwibWF4RmlsZVNpemUiLCJzZXR0aW5ncyIsImdldCIsInNpemUiLCJtYXhTaXplIiwiYWxsb3dlZEZpbGVUeXBlcyIsIlNsaW5nc2hvdCIsImZpbGVSZXN0cmljdGlvbnMiLCJGaWxlVXBsb2FkIiwidmFsaWRhdGVGaWxlVXBsb2FkIiwiTWF0Y2giLCJ0ZXN0IiwicmlkIiwiU3RyaW5nIiwidXNlciIsInJvb20iLCJtb2RlbHMiLCJSb29tcyIsImZpbmRPbmVCeUlkIiwiZGlyZWN0TWVzc2FnZUFsbG93IiwiZmlsZVVwbG9hZEFsbG93ZWQiLCJhdXRoeiIsImNhbkFjY2Vzc1Jvb20iLCJyZWFzb24iLCJsYW5ndWFnZSIsInQiLCJrZXkiLCJ2YWx1ZSIsInBhcnNlSW50IiwiZSIsIlNldHRpbmdzIiwicGFja2FnZVZhbHVlIiwiXyIsIlVwbG9hZEZTIiwiY29uZmlnIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJTdG9yZVBlcm1pc3Npb25zIiwiaW5zZXJ0IiwiZG9jIiwibWVzc2FnZV9pZCIsImluZGV4T2YiLCJ1cGRhdGUiLCJoYXNQZXJtaXNzaW9uIiwicmVtb3ZlIiwiRmlsZVVwbG9hZEJhc2UiLCJjb25zdHJ1Y3RvciIsInN0b3JlIiwibWV0YSIsImlkIiwiUmFuZG9tIiwiZ2V0UHJvZ3Jlc3MiLCJnZXRGaWxlTmFtZSIsIm5hbWUiLCJzdGFydCIsImNhbGxiYWNrIiwiaGFuZGxlciIsIlVwbG9hZGVyIiwiZGF0YSIsIm9uRXJyb3IiLCJlcnIiLCJvbkNvbXBsZXRlIiwiZmlsZURhdGEiLCJwaWNrIiwidXJsIiwicmVwbGFjZSIsImFic29sdXRlVXJsIiwib3B0aW9ucyIsIm9uUHJvZ3Jlc3MiLCJwcm9ncmVzcyIsInN0b3AiLCJleHBvcnQiLCJGaWxlVXBsb2FkQ2xhc3MiLCJmcyIsInN0cmVhbSIsIm1pbWUiLCJGdXR1cmUiLCJzaGFycCIsIkNvb2tpZXMiLCJjb29raWUiLCJPYmplY3QiLCJhc3NpZ24iLCJoYW5kbGVycyIsImNvbmZpZ3VyZVVwbG9hZHNTdG9yZSIsInNwbGl0IiwicG9wIiwic3RvcmVzIiwiZ2V0U3RvcmVzIiwiZGVmYXVsdFVwbG9hZHMiLCJjb2xsZWN0aW9uIiwiVXBsb2FkcyIsIm1vZGVsIiwiZmlsdGVyIiwiRmlsdGVyIiwib25DaGVjayIsImdldFBhdGgiLCJfaWQiLCJvblZhbGlkYXRlIiwidXBsb2Fkc09uVmFsaWRhdGUiLCJvblJlYWQiLCJmaWxlSWQiLCJyZXEiLCJyZXMiLCJyZXF1ZXN0Q2FuQWNjZXNzRmlsZXMiLCJ3cml0ZUhlYWQiLCJzZXRIZWFkZXIiLCJlbmNvZGVVUklDb21wb25lbnQiLCJkZWZhdWx0QXZhdGFycyIsIkF2YXRhcnMiLCJhdmF0YXJzT25WYWxpZGF0ZSIsIm9uRmluaXNoVXBsb2FkIiwiYXZhdGFyc09uRmluaXNoVXBsb2FkIiwidGVtcEZpbGVQYXRoIiwiZ2V0VGVtcEZpbGVQYXRoIiwiaGVpZ2h0IiwiZnV0dXJlIiwicyIsInJvdGF0ZSIsIm1ldGFkYXRhIiwiYmluZEVudmlyb25tZW50IiwidG9Gb3JtYXQiLCJmb3JtYXQiLCJqcGVnIiwicmVzaXplIiwiTWF0aCIsIm1pbiIsIndpZHRoIiwicGlwZSIsImJhY2tncm91bmQiLCJlbWJlZCIsInRvQnVmZmVyIiwidGhlbiIsIm91dHB1dEJ1ZmZlciIsIndyaXRlRmlsZSIsImNvbnNvbGUiLCJlcnJvciIsImxzdGF0U3luYyIsImdldENvbGxlY3Rpb24iLCJkaXJlY3QiLCIkc2V0IiwicmV0dXJuIiwid2FpdCIsInJlc2l6ZUltYWdlUHJldmlldyIsImFkZEV4dGVuc2lvblRvIiwiaW1hZ2UiLCJnZXRTdG9yZSIsIl9zdG9yZSIsImdldFJlYWRTdHJlYW0iLCJ0cmFuc2Zvcm1lciIsIm1heCIsImJsdXIiLCJyZXN1bHQiLCJvdXQiLCJ0b1N0cmluZyIsInRtcEZpbGUiLCJmdXQiLCJpZGVudGlmeSIsIm9yaWVudGF0aW9uIiwidG9GaWxlIiwidW5saW5rIiwicmVuYW1lIiwiY2F0Y2giLCJVc2VycyIsIm9sZEF2YXRhciIsImZpbmRPbmVCeU5hbWUiLCJ1c2VybmFtZSIsImRlbGV0ZUZpbGUiLCJ1cGRhdGVGaWxlTmFtZUJ5SWQiLCJoZWFkZXJzIiwicXVlcnkiLCJyY191aWQiLCJyY190b2tlbiIsImZpbmRPbmVCeUlkQW5kTG9naW5Ub2tlbiIsImxvb2t1cCIsImV4dCIsImV4dGVuc2lvbiIsIlJlZ0V4cCIsIm1vZGVsTmFtZSIsInN0b3JhZ2VUeXBlIiwiaGFuZGxlck5hbWUiLCJnZXRTdG9yZUJ5TmFtZSIsIm5leHQiLCJlbmQiLCJnZXRNb2RlbEZyb21OYW1lIiwiZGVsZXRlIiwiZGVsZXRlQnlJZCIsImRlbGV0ZUJ5TmFtZSIsImZpbGVOYW1lIiwic3RyZWFtT3JCdWZmZXIiLCJjYiIsImdldEZpbHRlciIsImNoZWNrIiwiY3JlYXRlIiwidG9rZW4iLCJjcmVhdGVUb2tlbiIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiQnVmZmVyIiwid3JpdGVGaWxlU3luYyIsImNhbGwiLCJodHRwIiwiVVJMIiwibG9nZ2VyIiwiTG9nZ2VyIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwic3RhY2siLCJ1bnNoaWZ0Iiwicm91dGUiLCJoYW5kbGUiLCJzdG9yZXNQYXRoIiwiZGVidWciLCJtZXRob2QiLCJwYXJzZWRVcmwiLCJwYXJzZSIsInBhdGgiLCJwYXRobmFtZSIsInN1YnN0ciIsImxlbmd0aCIsInJlZ0V4cCIsIm1hdGNoIiwiZXhlYyIsImZpbmRPbmUiLCJ1bmRlZmluZWQiLCJpbnN0YW5jZUlkIiwiSW5zdGFuY2VTdGF0dXMiLCJpbnN0YW5jZSIsImV4dHJhSW5mb3JtYXRpb24iLCJob3N0IiwicHJvY2VzcyIsImVudiIsIklOU1RBTkNFX0lQIiwiaXNEb2NrZXIiLCJwb3J0IiwiaG9zdG5hbWUiLCJvcmlnaW5hbFVybCIsInByb3h5IiwicmVxdWVzdCIsInByb3h5X3JlcyIsInVzZSIsInB1YmxpYyIsInNhbmRzdG9ybSIsImNvbmZpZ1N0b3JlIiwiZGVib3VuY2UiLCJsb2ciLCJodHRwcyIsImZpbGVVcmwiLCJnZXRSZWRpcmVjdFVSTCIsImZpbGVSZXMiLCJBbWF6b25TM1VwbG9hZHMiLCJBbWF6b25TM0F2YXRhcnMiLCJjb25maWd1cmUiLCJCdWNrZXQiLCJBY2wiLCJBV1NBY2Nlc3NLZXlJZCIsIkFXU1NlY3JldEFjY2Vzc0tleSIsIlVSTEV4cGlyeVRpbWVTcGFuIiwiUmVnaW9uIiwiU2lnbmF0dXJlVmVyc2lvbiIsIkZvcmNlUGF0aFN0eWxlIiwiQnVja2V0VVJMIiwiY29ubmVjdGlvbiIsImFjY2Vzc0tleUlkIiwic2VjcmV0QWNjZXNzS2V5Iiwic2lnbmF0dXJlVmVyc2lvbiIsInMzRm9yY2VQYXRoU3R5bGUiLCJwYXJhbXMiLCJBQ0wiLCJyZWdpb24iLCJlbmRwb2ludCIsIkZpbGVTeXN0ZW1VcGxvYWRzIiwiZmlsZVBhdGgiLCJnZXRGaWxlUGF0aCIsInN0YXQiLCJ3cmFwQXN5bmMiLCJpc0ZpbGUiLCJ1cGxvYWRlZEF0IiwidG9VVENTdHJpbmciLCJGaWxlU3lzdGVtQXZhdGFycyIsImNyZWF0ZUZpbGVTeXN0ZW1TdG9yZSIsIkdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMiLCJHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzIiwiYnVja2V0IiwiYWNjZXNzSWQiLCJzZWNyZXQiLCJjcmVkZW50aWFscyIsImNsaWVudF9lbWFpbCIsInByaXZhdGVfa2V5IiwiemxpYiIsInV0aWwiLCJFeHRyYWN0UmFuZ2UiLCJieXRlc19yZWFkIiwiVHJhbnNmb3JtIiwiaW5oZXJpdHMiLCJwcm90b3R5cGUiLCJfdHJhbnNmb3JtIiwiY2h1bmsiLCJlbmMiLCJuZXdjaHVuayIsInNsaWNlIiwicHVzaCIsImdldEJ5dGVSYW5nZSIsImhlYWRlciIsIm1hdGNoZXMiLCJyZWFkRnJvbUdyaWRGUyIsInN0b3JlTmFtZSIsInJzIiwid3MiLCJQYXNzVGhyb3VnaCIsImZvckVhY2giLCJvbiIsIm9uUmVhZEVycm9yIiwiZW1pdCIsImFjY2VwdCIsInRyYW5zZm9ybVJlYWQiLCJyYW5nZSIsIm91dF9vZl9yYW5nZSIsInJlbW92ZUhlYWRlciIsImNyZWF0ZUd6aXAiLCJjcmVhdGVEZWZsYXRlIiwiY29sbGVjdGlvbk5hbWUiLCJjb25maWd1cmVTbGluZ3Nob3QiLCJhY2wiLCJhY2Nlc3NLZXkiLCJzZWNyZXRLZXkiLCJjZG4iLCJidWNrZXRVcmwiLCJfZGlyZWN0aXZlcyIsImlzRW1wdHkiLCJtZXRhQ29udGV4dCIsInVwbG9hZCIsIkFtYXpvblMzIiwiaW5zZXJ0RmlsZUluaXQiLCJjcmVhdGVEaXJlY3RpdmUiLCJTM1N0b3JhZ2UiLCJtZXNzYWdlIiwiY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSIsIkdvb2dsZUFjY2Vzc0lkIiwiR29vZ2xlU2VjcmV0S2V5IiwiR29vZ2xlU3RvcmFnZSIsIkdvb2dsZUNsb3VkIiwibWV0aG9kcyIsInJvb21JZCIsIm1zZ0RhdGEiLCJhdmF0YXIiLCJPcHRpb25hbCIsImVtb2ppIiwiYWxpYXMiLCJncm91cGFibGUiLCJCb29sZWFuIiwibXNnIiwidXBkYXRlRmlsZUNvbXBsZXRlIiwib21pdCIsImVuY29kZVVSSSIsImF0dGFjaG1lbnQiLCJ0aXRsZSIsImRlc2NyaXB0aW9uIiwidGl0bGVfbGluayIsInRpdGxlX2xpbmtfZG93bmxvYWQiLCJpbWFnZV91cmwiLCJpbWFnZV90eXBlIiwiaW1hZ2Vfc2l6ZSIsImltYWdlX2RpbWVuc2lvbnMiLCJpbWFnZV9wcmV2aWV3IiwiYXVkaW9fdXJsIiwiYXVkaW9fdHlwZSIsImF1ZGlvX3NpemUiLCJ2aWRlb191cmwiLCJ2aWRlb190eXBlIiwidmlkZW9fc2l6ZSIsInRzIiwiRGF0ZSIsImF0dGFjaG1lbnRzIiwiZGVmZXIiLCJjYWxsYmFja3MiLCJydW4iLCJwcm90ZWN0ZWRGaWxlcyIsImdldFMzRmlsZVVybCIsImFkZEdyb3VwIiwiYWRkIiwiaTE4bkRlc2NyaXB0aW9uIiwidmFsdWVzIiwiaTE4bkxhYmVsIiwic2VjdGlvbiIsImVuYWJsZVF1ZXJ5IiwicHJpdmF0ZSIsIm11bHRpbGluZSIsIkFtYXpvblMzU3RvcmUiLCJTMyIsIlN0b3JlIiwiZXh0ZW5kIiwiaHR0cE9wdGlvbnMiLCJ0aW1lb3V0IiwiYWdlbnQiLCJjbGFzc09wdGlvbnMiLCJzMyIsIktleSIsIkV4cGlyZXMiLCJnZXRTaWduZWRVcmwiLCJkZWxldGVPYmplY3QiLCJSYW5nZSIsImdldE9iamVjdCIsImNyZWF0ZVJlYWRTdHJlYW0iLCJnZXRXcml0ZVN0cmVhbSIsIndyaXRlU3RyZWFtIiwiZXZlbnQiLCJsaXN0ZW5lciIsIm5leHRUaWNrIiwicmVtb3ZlTGlzdGVuZXIiLCJwdXRPYmplY3QiLCJCb2R5IiwiQ29udGVudFR5cGUiLCJDb250ZW50RGlzcG9zaXRpb24iLCJHb29nbGVTdG9yYWdlU3RvcmUiLCJnY1N0b3JhZ2UiLCJnY3MiLCJnb29nbGVDbG91ZFN0b3JhZ2UiLCJhY3Rpb24iLCJyZXNwb25zZURpc3Bvc2l0aW9uIiwiZXhwaXJlcyIsIm5vdyIsImd6aXAiLCJjb250ZW50VHlwZSIsImNvbnRlbnREaXNwb3NpdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLFFBQUo7QUFBYUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFVBQVIsQ0FBYixFQUFpQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsZUFBU0ssQ0FBVDtBQUFXOztBQUF2QixDQUFqQyxFQUEwRCxDQUExRDtBQUliLE1BQU1DLGtCQUFrQjtBQUN2QkMsWUFBVUM7QUFBSTtBQUFkLElBQWlDO0FBQ2hDO0FBQ0EsUUFBSSxDQUFDLEtBQUtDLE1BQVYsRUFBa0I7QUFDakIsWUFBTSxJQUFJQyxPQUFPQyxLQUFYLENBQWlCLGdCQUFqQixFQUFtQyxtQ0FBbkMsQ0FBTjtBQUNBOztBQUVELFFBQUksQ0FBQ0MsV0FBV0MsNEJBQVgsQ0FBd0NMLEtBQUtNLElBQTdDLENBQUwsRUFBeUQ7QUFDeEQsWUFBTSxJQUFJSixPQUFPQyxLQUFYLENBQWlCSSxRQUFRQyxFQUFSLENBQVcseUJBQVgsQ0FBakIsQ0FBTjtBQUNBOztBQUVELFVBQU1DLGNBQWNMLFdBQVdNLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLHdCQUF4QixDQUFwQjs7QUFFQSxRQUFJRixlQUFlLENBQUMsQ0FBaEIsSUFBcUJBLGNBQWNULEtBQUtZLElBQTVDLEVBQWtEO0FBQ2pELFlBQU0sSUFBSVYsT0FBT0MsS0FBWCxDQUFpQkksUUFBUUMsRUFBUixDQUFXLG9DQUFYLEVBQWlEO0FBQUVJLGNBQU1wQixTQUFTaUIsV0FBVDtBQUFSLE9BQWpELENBQWpCLENBQU47QUFDQTs7QUFFRCxXQUFPLElBQVA7QUFDQSxHQWxCc0I7O0FBbUJ2QkksV0FBUyxDQW5CYztBQW9CdkJDLG9CQUFrQjtBQXBCSyxD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SUFEVDtBQUVUd2EsOEJBQXFCLG9CQUFvQjlhLEtBQUs2RCxJQUFNLEVBRjNDLENBR1Q7QUFDQTtBQUNBOztBQUxTO0FBRm1ELE9BQXZELENBQVA7QUFVQSxLQVhEO0FBWUE7O0FBOUdxRDs7QUFpSHZEO0FBQ0FuQixTQUFTYSxLQUFULENBQWVtUyxhQUFmLEdBQStCMEUsa0JBQS9CLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfZmlsZS11cGxvYWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIFNsaW5nc2hvdCAqL1xuXG5pbXBvcnQgZmlsZXNpemUgZnJvbSAnZmlsZXNpemUnO1xuXG5jb25zdCBzbGluZ1Nob3RDb25maWcgPSB7XG5cdGF1dGhvcml6ZShmaWxlLyosIG1ldGFDb250ZXh0Ki8pIHtcblx0XHQvL0RlbnkgdXBsb2FkcyBpZiB1c2VyIGlzIG5vdCBsb2dnZWQgaW4uXG5cdFx0aWYgKCF0aGlzLnVzZXJJZCkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignbG9naW4tcmVxdWlyZWQnLCAnUGxlYXNlIGxvZ2luIGJlZm9yZSBwb3N0aW5nIGZpbGVzJyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFSb2NrZXRDaGF0LmZpbGVVcGxvYWRJc1ZhbGlkQ29udGVudFR5cGUoZmlsZS50eXBlKSkge1xuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihUQVBpMThuLl9fKCdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZScpKTtcblx0XHR9XG5cblx0XHRjb25zdCBtYXhGaWxlU2l6ZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX01heEZpbGVTaXplJyk7XG5cblx0XHRpZiAobWF4RmlsZVNpemUgPj0gLTEgJiYgbWF4RmlsZVNpemUgPCBmaWxlLnNpemUpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoVEFQaTE4bi5fXygnRmlsZV9leGNlZWRzX2FsbG93ZWRfc2l6ZV9vZl9ieXRlcycsIHsgc2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpIH0pKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0bWF4U2l6ZTogMCxcblx0YWxsb3dlZEZpbGVUeXBlczogbnVsbFxufTtcblxuU2xpbmdzaG90LmZpbGVSZXN0cmljdGlvbnMoJ3JvY2tldGNoYXQtdXBsb2FkcycsIHNsaW5nU2hvdENvbmZpZyk7XG5TbGluZ3Nob3QuZmlsZVJlc3RyaWN0aW9ucygncm9ja2V0Y2hhdC11cGxvYWRzLWdzJywgc2xpbmdTaG90Q29uZmlnKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZDp0cnVlICovXG4vKiBleHBvcnRlZCBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBmaWxlc2l6ZSBmcm9tICdmaWxlc2l6ZSc7XG5cbmxldCBtYXhGaWxlU2l6ZSA9IDA7XG5cbkZpbGVVcGxvYWQgPSB7XG5cdHZhbGlkYXRlRmlsZVVwbG9hZChmaWxlKSB7XG5cdFx0aWYgKCFNYXRjaC50ZXN0KGZpbGUucmlkLCBTdHJpbmcpKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Y29uc3QgdXNlciA9IE1ldGVvci51c2VyKCk7XG5cdFx0Y29uc3Qgcm9vbSA9IFJvY2tldENoYXQubW9kZWxzLlJvb21zLmZpbmRPbmVCeUlkKGZpbGUucmlkKTtcblx0XHRjb25zdCBkaXJlY3RNZXNzYWdlQWxsb3cgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9FbmFibGVkX0RpcmVjdCcpO1xuXHRcdGNvbnN0IGZpbGVVcGxvYWRBbGxvd2VkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRW5hYmxlZCcpO1xuXG5cdFx0aWYgKFJvY2tldENoYXQuYXV0aHouY2FuQWNjZXNzUm9vbShyb29tLCB1c2VyKSAhPT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmICghZmlsZVVwbG9hZEFsbG93ZWQpIHtcblx0XHRcdGNvbnN0IHJlYXNvbiA9IFRBUGkxOG4uX18oJ0ZpbGVVcGxvYWRfRGlzYWJsZWQnLCB1c2VyLmxhbmd1YWdlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWZpbGUtdXBsb2FkLWRpc2FibGVkJywgcmVhc29uKTtcblx0XHR9XG5cblx0XHRpZiAoIWRpcmVjdE1lc3NhZ2VBbGxvdyAmJiByb29tLnQgPT09ICdkJykge1xuXHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV9ub3RfYWxsb3dlZF9kaXJlY3RfbWVzc2FnZXMnLCB1c2VyLmxhbmd1YWdlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWRpcmVjdC1tZXNzYWdlLWZpbGUtdXBsb2FkLW5vdC1hbGxvd2VkJywgcmVhc29uKTtcblx0XHR9XG5cblx0XHQvLyAtMSBtYXhGaWxlU2l6ZSBtZWFucyB0aGVyZSBpcyBubyBsaW1pdFxuXHRcdGlmIChtYXhGaWxlU2l6ZSA+PSAtMSAmJiBmaWxlLnNpemUgPiBtYXhGaWxlU2l6ZSkge1xuXHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV9leGNlZWRzX2FsbG93ZWRfc2l6ZV9vZl9ieXRlcycsIHtcblx0XHRcdFx0c2l6ZTogZmlsZXNpemUobWF4RmlsZVNpemUpXG5cdFx0XHR9LCB1c2VyLmxhbmd1YWdlKTtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWZpbGUtdG9vLWxhcmdlJywgcmVhc29uKTtcblx0XHR9XG5cblx0XHRpZiAobWF4RmlsZVNpemUgPiAwKSB7XG5cdFx0XHRpZiAoZmlsZS5zaXplID4gbWF4RmlsZVNpemUpIHtcblx0XHRcdFx0Y29uc3QgcmVhc29uID0gVEFQaTE4bi5fXygnRmlsZV9leGNlZWRzX2FsbG93ZWRfc2l6ZV9vZl9ieXRlcycsIHtcblx0XHRcdFx0XHRzaXplOiBmaWxlc2l6ZShtYXhGaWxlU2l6ZSlcblx0XHRcdFx0fSwgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWZpbGUtdG9vLWxhcmdlJywgcmVhc29uKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoIVJvY2tldENoYXQuZmlsZVVwbG9hZElzVmFsaWRDb250ZW50VHlwZShmaWxlLnR5cGUpKSB7XG5cdFx0XHRjb25zdCByZWFzb24gPSBUQVBpMThuLl9fKCdGaWxlX3R5cGVfaXNfbm90X2FjY2VwdGVkJywgdXNlci5sYW5ndWFnZSk7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWZpbGUtdHlwZScsIHJlYXNvbik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cbn07XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX01heEZpbGVTaXplJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHR0cnkge1xuXHRcdG1heEZpbGVTaXplID0gcGFyc2VJbnQodmFsdWUpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0bWF4RmlsZVNpemUgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lQnlJZCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScpLnBhY2thZ2VWYWx1ZTtcblx0fVxufSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWRCYXNlOnRydWUsIFVwbG9hZEZTICovXG4vKiBleHBvcnRlZCBGaWxlVXBsb2FkQmFzZSAqL1xuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5cblVwbG9hZEZTLmNvbmZpZy5kZWZhdWx0U3RvcmVQZXJtaXNzaW9ucyA9IG5ldyBVcGxvYWRGUy5TdG9yZVBlcm1pc3Npb25zKHtcblx0aW5zZXJ0KHVzZXJJZCwgZG9jKSB7XG5cdFx0cmV0dXJuIHVzZXJJZCB8fCAoZG9jICYmIGRvYy5tZXNzYWdlX2lkICYmIGRvYy5tZXNzYWdlX2lkLmluZGV4T2YoJ3NsYWNrLScpID09PSAwKTsgLy8gYWxsb3cgaW5zZXJ0cyBmcm9tIHNsYWNrYnJpZGdlIChtZXNzYWdlX2lkID0gc2xhY2stdGltZXN0YW1wLW1pbGxpKVxuXHR9LFxuXHR1cGRhdGUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9LFxuXHRyZW1vdmUodXNlcklkLCBkb2MpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5hdXRoei5oYXNQZXJtaXNzaW9uKE1ldGVvci51c2VySWQoKSwgJ2RlbGV0ZS1tZXNzYWdlJywgZG9jLnJpZCkgfHwgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdNZXNzYWdlX0FsbG93RGVsZXRpbmcnKSAmJiB1c2VySWQgPT09IGRvYy51c2VySWQpO1xuXHR9XG59KTtcblxuXG5GaWxlVXBsb2FkQmFzZSA9IGNsYXNzIEZpbGVVcGxvYWRCYXNlIHtcblx0Y29uc3RydWN0b3Ioc3RvcmUsIG1ldGEsIGZpbGUpIHtcblx0XHR0aGlzLmlkID0gUmFuZG9tLmlkKCk7XG5cdFx0dGhpcy5tZXRhID0gbWV0YTtcblx0XHR0aGlzLmZpbGUgPSBmaWxlO1xuXHRcdHRoaXMuc3RvcmUgPSBzdG9yZTtcblx0fVxuXG5cdGdldFByb2dyZXNzKCkge1xuXG5cdH1cblxuXHRnZXRGaWxlTmFtZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5tZXRhLm5hbWU7XG5cdH1cblxuXHRzdGFydChjYWxsYmFjaykge1xuXHRcdHRoaXMuaGFuZGxlciA9IG5ldyBVcGxvYWRGUy5VcGxvYWRlcih7XG5cdFx0XHRzdG9yZTogdGhpcy5zdG9yZSxcblx0XHRcdGRhdGE6IHRoaXMuZmlsZSxcblx0XHRcdGZpbGU6IHRoaXMubWV0YSxcblx0XHRcdG9uRXJyb3I6IChlcnIpID0+IHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9LFxuXHRcdFx0b25Db21wbGV0ZTogKGZpbGVEYXRhKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSBfLnBpY2soZmlsZURhdGEsICdfaWQnLCAndHlwZScsICdzaXplJywgJ25hbWUnLCAnaWRlbnRpZnknLCAnZGVzY3JpcHRpb24nKTtcblxuXHRcdFx0XHRmaWxlLnVybCA9IGZpbGVEYXRhLnVybC5yZXBsYWNlKE1ldGVvci5hYnNvbHV0ZVVybCgpLCAnLycpO1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgZmlsZSwgdGhpcy5zdG9yZS5vcHRpb25zLm5hbWUpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0dGhpcy5oYW5kbGVyLm9uUHJvZ3Jlc3MgPSAoZmlsZSwgcHJvZ3Jlc3MpID0+IHtcblx0XHRcdHRoaXMub25Qcm9ncmVzcyhwcm9ncmVzcyk7XG5cdFx0fTtcblxuXHRcdHJldHVybiB0aGlzLmhhbmRsZXIuc3RhcnQoKTtcblx0fVxuXG5cdG9uUHJvZ3Jlc3MoKSB7fVxuXG5cdHN0b3AoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGFuZGxlci5zdG9wKCk7XG5cdH1cbn07XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgbWltZSBmcm9tICdtaW1lLXR5cGUvd2l0aC1kYic7XG5pbXBvcnQgRnV0dXJlIGZyb20gJ2ZpYmVycy9mdXR1cmUnO1xuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCB7IENvb2tpZXMgfSBmcm9tICdtZXRlb3Ivb3N0cmlvOmNvb2tpZXMnO1xuXG5jb25zdCBjb29raWUgPSBuZXcgQ29va2llcygpO1xuXG5PYmplY3QuYXNzaWduKEZpbGVVcGxvYWQsIHtcblx0aGFuZGxlcnM6IHt9LFxuXG5cdGNvbmZpZ3VyZVVwbG9hZHNTdG9yZShzdG9yZSwgbmFtZSwgb3B0aW9ucykge1xuXHRcdGNvbnN0IHR5cGUgPSBuYW1lLnNwbGl0KCc6JykucG9wKCk7XG5cdFx0Y29uc3Qgc3RvcmVzID0gVXBsb2FkRlMuZ2V0U3RvcmVzKCk7XG5cdFx0ZGVsZXRlIHN0b3Jlc1tuYW1lXTtcblxuXHRcdHJldHVybiBuZXcgVXBsb2FkRlMuc3RvcmVbc3RvcmVdKE9iamVjdC5hc3NpZ24oe1xuXHRcdFx0bmFtZVxuXHRcdH0sIG9wdGlvbnMsIEZpbGVVcGxvYWRbYGRlZmF1bHQkeyB0eXBlIH1gXSgpKSk7XG5cdH0sXG5cblx0ZGVmYXVsdFVwbG9hZHMoKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNvbGxlY3Rpb246IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMubW9kZWwsXG5cdFx0XHRmaWx0ZXI6IG5ldyBVcGxvYWRGUy5GaWx0ZXIoe1xuXHRcdFx0XHRvbkNoZWNrOiBGaWxlVXBsb2FkLnZhbGlkYXRlRmlsZVVwbG9hZFxuXHRcdFx0fSksXG5cdFx0XHRnZXRQYXRoKGZpbGUpIHtcblx0XHRcdFx0cmV0dXJuIGAkeyBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgndW5pcXVlSUQnKSB9L3VwbG9hZHMvJHsgZmlsZS5yaWQgfS8keyBmaWxlLnVzZXJJZCB9LyR7IGZpbGUuX2lkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQudXBsb2Fkc09uVmFsaWRhdGUsXG5cdFx0XHRvblJlYWQoZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRcdFx0XHRpZiAoIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0XHRyZXMud3JpdGVIZWFkKDQwMyk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmVzLnNldEhlYWRlcignY29udGVudC1kaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1cImApO1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdGRlZmF1bHRBdmF0YXJzKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb2xsZWN0aW9uOiBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLm1vZGVsLFxuXHRcdFx0Ly8gZmlsdGVyOiBuZXcgVXBsb2FkRlMuRmlsdGVyKHtcblx0XHRcdC8vIFx0b25DaGVjazogRmlsZVVwbG9hZC52YWxpZGF0ZUZpbGVVcGxvYWRcblx0XHRcdC8vIH0pLFxuXHRcdFx0Z2V0UGF0aChmaWxlKSB7XG5cdFx0XHRcdHJldHVybiBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS9hdmF0YXJzLyR7IGZpbGUudXNlcklkIH1gO1xuXHRcdFx0fSxcblx0XHRcdG9uVmFsaWRhdGU6IEZpbGVVcGxvYWQuYXZhdGFyc09uVmFsaWRhdGUsXG5cdFx0XHRvbkZpbmlzaFVwbG9hZDogRmlsZVVwbG9hZC5hdmF0YXJzT25GaW5pc2hVcGxvYWRcblx0XHR9O1xuXHR9LFxuXG5cdGF2YXRhcnNPblZhbGlkYXRlKGZpbGUpIHtcblx0XHRpZiAoUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FjY291bnRzX0F2YXRhclJlc2l6ZScpICE9PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y29uc3QgdGVtcEZpbGVQYXRoID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGhlaWdodCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19BdmF0YXJTaXplJyk7XG5cdFx0Y29uc3QgZnV0dXJlID0gbmV3IEZ1dHVyZSgpO1xuXG5cdFx0Y29uc3QgcyA9IHNoYXJwKHRlbXBGaWxlUGF0aCk7XG5cdFx0cy5yb3RhdGUoKTtcblx0XHQvLyBHZXQgbWV0YWRhdGEgdG8gcmVzaXplIHRoZSBpbWFnZSB0aGUgZmlyc3QgdGltZSB0byBrZWVwIFwiaW5zaWRlXCIgdGhlIGRpbWVuc2lvbnNcblx0XHQvLyB0aGVuIHJlc2l6ZSBhZ2FpbiB0byBjcmVhdGUgdGhlIGNhbnZhcyBhcm91bmRcblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdHMudG9Gb3JtYXQoc2hhcnAuZm9ybWF0LmpwZWcpXG5cdFx0XHRcdC5yZXNpemUoTWF0aC5taW4oaGVpZ2h0LCBtZXRhZGF0YS53aWR0aCksIE1hdGgubWluKGhlaWdodCwgbWV0YWRhdGEuaGVpZ2h0KSlcblx0XHRcdFx0LnBpcGUoc2hhcnAoKVxuXHRcdFx0XHRcdC5yZXNpemUoaGVpZ2h0LCBoZWlnaHQpXG5cdFx0XHRcdFx0LmJhY2tncm91bmQoJyNGRkZGRkYnKVxuXHRcdFx0XHRcdC5lbWJlZCgpXG5cdFx0XHRcdClcblx0XHRcdFx0Ly8gVXNlIGJ1ZmZlciB0byBnZXQgdGhlIHJlc3VsdCBpbiBtZW1vcnkgdGhlbiByZXBsYWNlIHRoZSBleGlzdGluZyBmaWxlXG5cdFx0XHRcdC8vIFRoZXJlIGlzIG5vIG9wdGlvbiB0byBvdmVycmlkZSBhIGZpbGUgdXNpbmcgdGhpcyBsaWJyYXJ5XG5cdFx0XHRcdC50b0J1ZmZlcigpXG5cdFx0XHRcdC50aGVuKE1ldGVvci5iaW5kRW52aXJvbm1lbnQob3V0cHV0QnVmZmVyID0+IHtcblx0XHRcdFx0XHRmcy53cml0ZUZpbGUodGVtcEZpbGVQYXRoLCBvdXRwdXRCdWZmZXIsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZXJyID0+IHtcblx0XHRcdFx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRjb25zdCBzaXplID0gZnMubHN0YXRTeW5jKHRlbXBGaWxlUGF0aCkuc2l6ZTtcblx0XHRcdFx0XHRcdHRoaXMuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZS5faWR9LCB7JHNldDoge3NpemV9fSk7XG5cdFx0XHRcdFx0XHRmdXR1cmUucmV0dXJuKCk7XG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9KSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dHVyZS53YWl0KCk7XG5cdH0sXG5cblx0cmVzaXplSW1hZ2VQcmV2aWV3KGZpbGUpIHtcblx0XHRmaWxlID0gUm9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5maW5kT25lQnlJZChmaWxlLl9pZCk7XG5cdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cdFx0Y29uc3QgaW1hZ2UgPSBGaWxlVXBsb2FkLmdldFN0b3JlKCdVcGxvYWRzJykuX3N0b3JlLmdldFJlYWRTdHJlYW0oZmlsZS5faWQsIGZpbGUpO1xuXG5cdFx0Y29uc3QgdHJhbnNmb3JtZXIgPSBzaGFycCgpXG5cdFx0XHQucmVzaXplKDMyLCAzMilcblx0XHRcdC5tYXgoKVxuXHRcdFx0LmpwZWcoKVxuXHRcdFx0LmJsdXIoKTtcblx0XHRjb25zdCByZXN1bHQgPSB0cmFuc2Zvcm1lci50b0J1ZmZlcigpLnRoZW4oKG91dCkgPT4gb3V0LnRvU3RyaW5nKCdiYXNlNjQnKSk7XG5cdFx0aW1hZ2UucGlwZSh0cmFuc2Zvcm1lcik7XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXHR1cGxvYWRzT25WYWxpZGF0ZShmaWxlKSB7XG5cdFx0aWYgKCEvXmltYWdlXFwvKCh4LXdpbmRvd3MtKT9ibXB8cD9qcGVnfHBuZykkLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB0bXBGaWxlID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGUuX2lkKTtcblxuXHRcdGNvbnN0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcblxuXHRcdGNvbnN0IHMgPSBzaGFycCh0bXBGaWxlKTtcblx0XHRzLm1ldGFkYXRhKE1ldGVvci5iaW5kRW52aXJvbm1lbnQoKGVyciwgbWV0YWRhdGEpID0+IHtcblx0XHRcdGlmIChlcnIgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdHJldHVybiBmdXQucmV0dXJuKCk7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnN0IGlkZW50aWZ5ID0ge1xuXHRcdFx0XHRmb3JtYXQ6IG1ldGFkYXRhLmZvcm1hdCxcblx0XHRcdFx0c2l6ZToge1xuXHRcdFx0XHRcdHdpZHRoOiBtZXRhZGF0YS53aWR0aCxcblx0XHRcdFx0XHRoZWlnaHQ6IG1ldGFkYXRhLmhlaWdodFxuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAobWV0YWRhdGEub3JpZW50YXRpb24gPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gZnV0LnJldHVybigpO1xuXHRcdFx0fVxuXG5cdFx0XHRzLnJvdGF0ZSgpXG5cdFx0XHRcdC50b0ZpbGUoYCR7IHRtcEZpbGUgfS50bXBgKVxuXHRcdFx0XHQudGhlbihNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRmcy51bmxpbmsodG1wRmlsZSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdFx0XHRcdFx0XHRmcy5yZW5hbWUoYCR7IHRtcEZpbGUgfS50bXBgLCB0bXBGaWxlLCBNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc2l6ZSA9IGZzLmxzdGF0U3luYyh0bXBGaWxlKS5zaXplO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmdldENvbGxlY3Rpb24oKS5kaXJlY3QudXBkYXRlKHtfaWQ6IGZpbGUuX2lkfSwge1xuXHRcdFx0XHRcdFx0XHRcdCRzZXQ6IHtcblx0XHRcdFx0XHRcdFx0XHRcdHNpemUsXG5cdFx0XHRcdFx0XHRcdFx0XHRpZGVudGlmeVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0pKS5jYXRjaCgoZXJyKSA9PiB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHRcdGZ1dC5yZXR1cm4oKTtcblx0XHRcdFx0fSk7XG5cdFx0fSkpO1xuXG5cdFx0cmV0dXJuIGZ1dC53YWl0KCk7XG5cdH0sXG5cblx0YXZhdGFyc09uRmluaXNoVXBsb2FkKGZpbGUpIHtcblx0XHQvLyB1cGRhdGUgZmlsZSByZWNvcmQgdG8gbWF0Y2ggdXNlcidzIHVzZXJuYW1lXG5cdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeUlkKGZpbGUudXNlcklkKTtcblx0XHRjb25zdCBvbGRBdmF0YXIgPSBSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLmZpbmRPbmVCeU5hbWUodXNlci51c2VybmFtZSk7XG5cdFx0aWYgKG9sZEF2YXRhcikge1xuXHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuQXZhdGFycy5kZWxldGVGaWxlKG9sZEF2YXRhci5faWQpO1xuXHRcdH1cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5BdmF0YXJzLnVwZGF0ZUZpbGVOYW1lQnlJZChmaWxlLl9pZCwgdXNlci51c2VybmFtZSk7XG5cdFx0Ly8gY29uc29sZS5sb2coJ3VwbG9hZCBmaW5pc2hlZCAtPicsIGZpbGUpO1xuXHR9LFxuXG5cdHJlcXVlc3RDYW5BY2Nlc3NGaWxlcyh7IGhlYWRlcnMgPSB7fSwgcXVlcnkgPSB7fSB9KSB7XG5cdFx0aWYgKCFSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0bGV0IHsgcmNfdWlkLCByY190b2tlbiB9ID0gcXVlcnk7XG5cblx0XHRpZiAoIXJjX3VpZCAmJiBoZWFkZXJzLmNvb2tpZSkge1xuXHRcdFx0cmNfdWlkID0gY29va2llLmdldCgncmNfdWlkJywgaGVhZGVycy5jb29raWUpIDtcblx0XHRcdHJjX3Rva2VuID0gY29va2llLmdldCgncmNfdG9rZW4nLCBoZWFkZXJzLmNvb2tpZSk7XG5cdFx0fVxuXG5cdFx0aWYgKCFyY191aWQgfHwgIXJjX3Rva2VuIHx8ICFSb2NrZXRDaGF0Lm1vZGVscy5Vc2Vycy5maW5kT25lQnlJZEFuZExvZ2luVG9rZW4ocmNfdWlkLCByY190b2tlbikpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXHRhZGRFeHRlbnNpb25UbyhmaWxlKSB7XG5cdFx0aWYgKG1pbWUubG9va3VwKGZpbGUubmFtZSkgPT09IGZpbGUudHlwZSkge1xuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fVxuXG5cdFx0Y29uc3QgZXh0ID0gbWltZS5leHRlbnNpb24oZmlsZS50eXBlKTtcblx0XHRpZiAoZXh0ICYmIGZhbHNlID09PSBuZXcgUmVnRXhwKGBcXC4keyBleHQgfSRgLCAnaScpLnRlc3QoZmlsZS5uYW1lKSkge1xuXHRcdFx0ZmlsZS5uYW1lID0gYCR7IGZpbGUubmFtZSB9LiR7IGV4dCB9YDtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmlsZTtcblx0fSxcblxuXHRnZXRTdG9yZShtb2RlbE5hbWUpIHtcblx0XHRjb25zdCBzdG9yYWdlVHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHRcdGNvbnN0IGhhbmRsZXJOYW1lID0gYCR7IHN0b3JhZ2VUeXBlIH06JHsgbW9kZWxOYW1lIH1gO1xuXG5cdFx0cmV0dXJuIHRoaXMuZ2V0U3RvcmVCeU5hbWUoaGFuZGxlck5hbWUpO1xuXHR9LFxuXG5cdGdldFN0b3JlQnlOYW1lKGhhbmRsZXJOYW1lKSB7XG5cdFx0aWYgKHRoaXMuaGFuZGxlcnNbaGFuZGxlck5hbWVdID09IG51bGwpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoYFVwbG9hZCBoYW5kbGVyIFwiJHsgaGFuZGxlck5hbWUgfVwiIGRvZXMgbm90IGV4aXN0c2ApO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5oYW5kbGVyc1toYW5kbGVyTmFtZV07XG5cdH0sXG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzLCBuZXh0KSB7XG5cdFx0Y29uc3Qgc3RvcmUgPSB0aGlzLmdldFN0b3JlQnlOYW1lKGZpbGUuc3RvcmUpO1xuXHRcdGlmIChzdG9yZSAmJiBzdG9yZS5nZXQpIHtcblx0XHRcdHJldHVybiBzdG9yZS5nZXQoZmlsZSwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0cmVzLmVuZCgpO1xuXHR9XG59KTtcblxuXG5leHBvcnQgY2xhc3MgRmlsZVVwbG9hZENsYXNzIHtcblx0Y29uc3RydWN0b3IoeyBuYW1lLCBtb2RlbCwgc3RvcmUsIGdldCwgaW5zZXJ0LCBnZXRTdG9yZSB9KSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHR0aGlzLm1vZGVsID0gbW9kZWwgfHwgdGhpcy5nZXRNb2RlbEZyb21OYW1lKCk7XG5cdFx0dGhpcy5fc3RvcmUgPSBzdG9yZSB8fCBVcGxvYWRGUy5nZXRTdG9yZShuYW1lKTtcblx0XHR0aGlzLmdldCA9IGdldDtcblxuXHRcdGlmIChpbnNlcnQpIHtcblx0XHRcdHRoaXMuaW5zZXJ0ID0gaW5zZXJ0O1xuXHRcdH1cblxuXHRcdGlmIChnZXRTdG9yZSkge1xuXHRcdFx0dGhpcy5nZXRTdG9yZSA9IGdldFN0b3JlO1xuXHRcdH1cblxuXHRcdEZpbGVVcGxvYWQuaGFuZGxlcnNbbmFtZV0gPSB0aGlzO1xuXHR9XG5cblx0Z2V0U3RvcmUoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX3N0b3JlO1xuXHR9XG5cblx0Z2V0IHN0b3JlKCkge1xuXHRcdHJldHVybiB0aGlzLmdldFN0b3JlKCk7XG5cdH1cblxuXHRzZXQgc3RvcmUoc3RvcmUpIHtcblx0XHR0aGlzLl9zdG9yZSA9IHN0b3JlO1xuXHR9XG5cblx0Z2V0TW9kZWxGcm9tTmFtZSgpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHNbdGhpcy5uYW1lLnNwbGl0KCc6JylbMV1dO1xuXHR9XG5cblx0ZGVsZXRlKGZpbGVJZCkge1xuXHRcdGlmICh0aGlzLnN0b3JlICYmIHRoaXMuc3RvcmUuZGVsZXRlKSB7XG5cdFx0XHR0aGlzLnN0b3JlLmRlbGV0ZShmaWxlSWQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzLm1vZGVsLmRlbGV0ZUZpbGUoZmlsZUlkKTtcblx0fVxuXG5cdGRlbGV0ZUJ5SWQoZmlsZUlkKSB7XG5cdFx0Y29uc3QgZmlsZSA9IHRoaXMubW9kZWwuZmluZE9uZUJ5SWQoZmlsZUlkKTtcblxuXHRcdGlmICghZmlsZSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IHN0b3JlID0gRmlsZVVwbG9hZC5nZXRTdG9yZUJ5TmFtZShmaWxlLnN0b3JlKTtcblxuXHRcdHJldHVybiBzdG9yZS5kZWxldGUoZmlsZS5faWQpO1xuXHR9XG5cblx0ZGVsZXRlQnlOYW1lKGZpbGVOYW1lKSB7XG5cdFx0Y29uc3QgZmlsZSA9IHRoaXMubW9kZWwuZmluZE9uZUJ5TmFtZShmaWxlTmFtZSk7XG5cblx0XHRpZiAoIWZpbGUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBzdG9yZSA9IEZpbGVVcGxvYWQuZ2V0U3RvcmVCeU5hbWUoZmlsZS5zdG9yZSk7XG5cblx0XHRyZXR1cm4gc3RvcmUuZGVsZXRlKGZpbGUuX2lkKTtcblx0fVxuXG5cdGluc2VydChmaWxlRGF0YSwgc3RyZWFtT3JCdWZmZXIsIGNiKSB7XG5cdFx0ZmlsZURhdGEuc2l6ZSA9IHBhcnNlSW50KGZpbGVEYXRhLnNpemUpIHx8IDA7XG5cblx0XHQvLyBDaGVjayBpZiB0aGUgZmlsZURhdGEgbWF0Y2hlcyBzdG9yZSBmaWx0ZXJcblx0XHRjb25zdCBmaWx0ZXIgPSB0aGlzLnN0b3JlLmdldEZpbHRlcigpO1xuXHRcdGlmIChmaWx0ZXIgJiYgZmlsdGVyLmNoZWNrKSB7XG5cdFx0XHRmaWx0ZXIuY2hlY2soZmlsZURhdGEpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGZpbGVJZCA9IHRoaXMuc3RvcmUuY3JlYXRlKGZpbGVEYXRhKTtcblx0XHRjb25zdCB0b2tlbiA9IHRoaXMuc3RvcmUuY3JlYXRlVG9rZW4oZmlsZUlkKTtcblx0XHRjb25zdCB0bXBGaWxlID0gVXBsb2FkRlMuZ2V0VGVtcEZpbGVQYXRoKGZpbGVJZCk7XG5cblx0XHR0cnkge1xuXHRcdFx0aWYgKHN0cmVhbU9yQnVmZmVyIGluc3RhbmNlb2Ygc3RyZWFtKSB7XG5cdFx0XHRcdHN0cmVhbU9yQnVmZmVyLnBpcGUoZnMuY3JlYXRlV3JpdGVTdHJlYW0odG1wRmlsZSkpO1xuXHRcdFx0fSBlbHNlIGlmIChzdHJlYW1PckJ1ZmZlciBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXHRcdFx0XHRmcy53cml0ZUZpbGVTeW5jKHRtcEZpbGUsIHN0cmVhbU9yQnVmZmVyKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignSW52YWxpZCBmaWxlIHR5cGUnKTtcblx0XHRcdH1cblxuXHRcdFx0Y29uc3QgZmlsZSA9IE1ldGVvci5jYWxsKCd1ZnNDb21wbGV0ZScsIGZpbGVJZCwgdGhpcy5uYW1lLCB0b2tlbik7XG5cblx0XHRcdGlmIChjYikge1xuXHRcdFx0XHRjYihudWxsLCBmaWxlKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGNiKSB7XG5cdFx0XHRcdGNiKGUpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZTtcblx0XHRcdH1cblx0XHR9XG5cdH1cbn1cbiIsIi8qIGdsb2JhbHMgVXBsb2FkRlMsIEluc3RhbmNlU3RhdHVzICovXG5cbmltcG9ydCBodHRwIGZyb20gJ2h0dHAnO1xuaW1wb3J0IFVSTCBmcm9tICd1cmwnO1xuXG5jb25zdCBsb2dnZXIgPSBuZXcgTG9nZ2VyKCdVcGxvYWRQcm94eScpO1xuXG5XZWJBcHAuY29ubmVjdEhhbmRsZXJzLnN0YWNrLnVuc2hpZnQoe1xuXHRyb3V0ZTogJycsXG5cdGhhbmRsZTogTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuXHRcdC8vIFF1aWNrIGNoZWNrIHRvIHNlZSBpZiByZXF1ZXN0IHNob3VsZCBiZSBjYXRjaFxuXHRcdGlmIChyZXEudXJsLmluZGV4T2YoVXBsb2FkRlMuY29uZmlnLnN0b3Jlc1BhdGgpID09PSAtMSkge1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHRsb2dnZXIuZGVidWcoJ1VwbG9hZCBVUkw6JywgcmVxLnVybCk7XG5cblx0XHRpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG5cdFx0XHRyZXR1cm4gbmV4dCgpO1xuXHRcdH1cblxuXHRcdC8vIFJlbW92ZSBzdG9yZSBwYXRoXG5cdFx0Y29uc3QgcGFyc2VkVXJsID0gVVJMLnBhcnNlKHJlcS51cmwpO1xuXHRcdGNvbnN0IHBhdGggPSBwYXJzZWRVcmwucGF0aG5hbWUuc3Vic3RyKFVwbG9hZEZTLmNvbmZpZy5zdG9yZXNQYXRoLmxlbmd0aCArIDEpO1xuXG5cdFx0Ly8gR2V0IHN0b3JlXG5cdFx0Y29uc3QgcmVnRXhwID0gbmV3IFJlZ0V4cCgnXlxcLyhbXlxcL1xcP10rKVxcLyhbXlxcL1xcP10rKSQnKTtcblx0XHRjb25zdCBtYXRjaCA9IHJlZ0V4cC5leGVjKHBhdGgpO1xuXG5cdFx0Ly8gUmVxdWVzdCBpcyBub3QgdmFsaWRcblx0XHRpZiAobWF0Y2ggPT09IG51bGwpIHtcblx0XHRcdHJlcy53cml0ZUhlYWQoNDAwKTtcblx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBHZXQgc3RvcmVcblx0XHRjb25zdCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKG1hdGNoWzFdKTtcblx0XHRpZiAoIXN0b3JlKSB7XG5cdFx0XHRyZXMud3JpdGVIZWFkKDQwNCk7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gR2V0IGZpbGVcblx0XHRjb25zdCBmaWxlSWQgPSBtYXRjaFsyXTtcblx0XHRjb25zdCBmaWxlID0gc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0aWYgKGZpbGUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChmaWxlLmluc3RhbmNlSWQgPT09IEluc3RhbmNlU3RhdHVzLmlkKCkpIHtcblx0XHRcdGxvZ2dlci5kZWJ1ZygnQ29ycmVjdCBpbnN0YW5jZScpO1xuXHRcdFx0cmV0dXJuIG5leHQoKTtcblx0XHR9XG5cblx0XHQvLyBQcm94eSB0byBvdGhlciBpbnN0YW5jZVxuXHRcdGNvbnN0IGluc3RhbmNlID0gSW5zdGFuY2VTdGF0dXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZS5pbnN0YW5jZUlkfSk7XG5cblx0XHRpZiAoaW5zdGFuY2UgPT0gbnVsbCkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmIChpbnN0YW5jZS5leHRyYUluZm9ybWF0aW9uLmhvc3QgPT09IHByb2Nlc3MuZW52LklOU1RBTkNFX0lQICYmIFJvY2tldENoYXQuaXNEb2NrZXIoKSA9PT0gZmFsc2UpIHtcblx0XHRcdGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24uaG9zdCA9ICdsb2NhbGhvc3QnO1xuXHRcdH1cblxuXHRcdGxvZ2dlci5kZWJ1ZygnV3JvbmcgaW5zdGFuY2UsIHByb3hpbmcgdG86JywgYCR7IGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24uaG9zdCB9OiR7IGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24ucG9ydCB9YCk7XG5cblx0XHRjb25zdCBvcHRpb25zID0ge1xuXHRcdFx0aG9zdG5hbWU6IGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24uaG9zdCxcblx0XHRcdHBvcnQ6IGluc3RhbmNlLmV4dHJhSW5mb3JtYXRpb24ucG9ydCxcblx0XHRcdHBhdGg6IHJlcS5vcmlnaW5hbFVybCxcblx0XHRcdG1ldGhvZDogJ1BPU1QnXG5cdFx0fTtcblxuXHRcdGNvbnN0IHByb3h5ID0gaHR0cC5yZXF1ZXN0KG9wdGlvbnMsIGZ1bmN0aW9uKHByb3h5X3Jlcykge1xuXHRcdFx0cHJveHlfcmVzLnBpcGUocmVzLCB7XG5cdFx0XHRcdGVuZDogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRyZXEucGlwZShwcm94eSwge1xuXHRcdFx0ZW5kOiB0cnVlXG5cdFx0fSk7XG5cdH0pXG59KTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCwgV2ViQXBwICovXG5cbldlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKCcvZmlsZS11cGxvYWQvJyxcdGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG5cblx0Y29uc3QgbWF0Y2ggPSAvXlxcLyhbXlxcL10rKVxcLyguKikvLmV4ZWMocmVxLnVybCk7XG5cblx0aWYgKG1hdGNoWzFdKSB7XG5cdFx0Y29uc3QgZmlsZSA9IFJvY2tldENoYXQubW9kZWxzLlVwbG9hZHMuZmluZE9uZUJ5SWQobWF0Y2hbMV0pO1xuXG5cdFx0aWYgKGZpbGUpIHtcblx0XHRcdGlmICghTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5zYW5kc3Rvcm0gJiYgIUZpbGVVcGxvYWQucmVxdWVzdENhbkFjY2Vzc0ZpbGVzKHJlcSkpIHtcblx0XHRcdFx0cmVzLndyaXRlSGVhZCg0MDMpO1xuXHRcdFx0XHRyZXR1cm4gcmVzLmVuZCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVNlY3VyaXR5LVBvbGljeScsICdkZWZhdWx0LXNyYyBcXCdub25lXFwnJyk7XG5cdFx0XHRyZXR1cm4gRmlsZVVwbG9hZC5nZXQoZmlsZSwgcmVxLCByZXMsIG5leHQpO1xuXHRcdH1cblx0fVxuXG5cdHJlcy53cml0ZUhlYWQoNDA0KTtcblx0cmVzLmVuZCgpO1xufSk7XG4iLCIvKiBnbG9iYWxzIFVwbG9hZEZTICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0ICcuL0FtYXpvblMzLmpzJztcbmltcG9ydCAnLi9GaWxlU3lzdGVtLmpzJztcbmltcG9ydCAnLi9Hb29nbGVTdG9yYWdlLmpzJztcbmltcG9ydCAnLi9HcmlkRlMuanMnO1xuaW1wb3J0ICcuL1NsaW5nc2hvdF9ERVBSRUNBVEVELmpzJztcblxuY29uc3QgY29uZmlnU3RvcmUgPSBfLmRlYm91bmNlKCgpID0+IHtcblx0Y29uc3Qgc3RvcmUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblxuXHRpZiAoc3RvcmUpIHtcblx0XHRjb25zb2xlLmxvZygnU2V0dGluZyBkZWZhdWx0IGZpbGUgc3RvcmUgdG8nLCBzdG9yZSk7XG5cdFx0VXBsb2FkRlMuZ2V0U3RvcmVzKCkuQXZhdGFycyA9IFVwbG9hZEZTLmdldFN0b3JlKGAkeyBzdG9yZSB9OkF2YXRhcnNgKTtcblx0XHRVcGxvYWRGUy5nZXRTdG9yZXMoKS5VcGxvYWRzID0gVXBsb2FkRlMuZ2V0U3RvcmUoYCR7IHN0b3JlIH06VXBsb2Fkc2ApO1xuXHR9XG59LCAxMDAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoL15GaWxlVXBsb2FkXy8sIGNvbmZpZ1N0b3JlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCAqL1xuXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCB7IEZpbGVVcGxvYWRDbGFzcyB9IGZyb20gJy4uL2xpYi9GaWxlVXBsb2FkJztcbmltcG9ydCAnLi4vLi4vdWZzL0FtYXpvblMzL3NlcnZlci5qcyc7XG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5cbmNvbnN0IGdldCA9IGZ1bmN0aW9uKGZpbGUsIHJlcSwgcmVzKSB7XG5cdGNvbnN0IGZpbGVVcmwgPSB0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUpO1xuXG5cdGlmIChmaWxlVXJsKSB7XG5cdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1Byb3h5JykpIHtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSAvXmh0dHBzOi8udGVzdChmaWxlVXJsKSA/IGh0dHBzIDogaHR0cDtcblx0XHRcdHJlcXVlc3QuZ2V0KGZpbGVVcmwsIGZpbGVSZXMgPT4gZmlsZVJlcy5waXBlKHJlcykpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdMb2NhdGlvbicsIGZpbGVVcmwpO1xuXHRcdFx0cmVzLndyaXRlSGVhZCgzMDIpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXMuZW5kKCk7XG5cdH1cbn07XG5cbmNvbnN0IEFtYXpvblMzVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnQW1hem9uUzM6VXBsb2FkcycsXG5cdGdldFxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgQW1hem9uUzNBdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdBbWF6b25TMzpBdmF0YXJzJyxcblx0Z2V0XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBjb25maWd1cmUgPSBfLmRlYm91bmNlKGZ1bmN0aW9uKCkge1xuXHRjb25zdCBCdWNrZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19CdWNrZXQnKTtcblx0Y29uc3QgQWNsID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQWNsJyk7XG5cdGNvbnN0IEFXU0FjY2Vzc0tleUlkID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTQWNjZXNzS2V5SWQnKTtcblx0Y29uc3QgQVdTU2VjcmV0QWNjZXNzS2V5ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5Jyk7XG5cdGNvbnN0IFVSTEV4cGlyeVRpbWVTcGFuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfVVJMRXhwaXJ5VGltZVNwYW4nKTtcblx0Y29uc3QgUmVnaW9uID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfUmVnaW9uJyk7XG5cdGNvbnN0IFNpZ25hdHVyZVZlcnNpb24gPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19TaWduYXR1cmVWZXJzaW9uJyk7XG5cdGNvbnN0IEZvcmNlUGF0aFN0eWxlID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfRm9yY2VQYXRoU3R5bGUnKTtcblx0Ly8gY29uc3QgQ0ROID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQ0ROJyk7XG5cdGNvbnN0IEJ1Y2tldFVSTCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0J1Y2tldFVSTCcpO1xuXG5cdGlmICghQnVja2V0IHx8ICFBV1NBY2Nlc3NLZXlJZCB8fCAhQVdTU2VjcmV0QWNjZXNzS2V5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0Y29uc3QgY29uZmlnID0ge1xuXHRcdGNvbm5lY3Rpb246IHtcblx0XHRcdGFjY2Vzc0tleUlkOiBBV1NBY2Nlc3NLZXlJZCxcblx0XHRcdHNlY3JldEFjY2Vzc0tleTogQVdTU2VjcmV0QWNjZXNzS2V5LFxuXHRcdFx0c2lnbmF0dXJlVmVyc2lvbjogU2lnbmF0dXJlVmVyc2lvbixcblx0XHRcdHMzRm9yY2VQYXRoU3R5bGU6IEZvcmNlUGF0aFN0eWxlLFxuXHRcdFx0cGFyYW1zOiB7XG5cdFx0XHRcdEJ1Y2tldCxcblx0XHRcdFx0QUNMOiBBY2xcblx0XHRcdH0sXG5cdFx0XHRyZWdpb246IFJlZ2lvblxuXHRcdH0sXG5cdFx0VVJMRXhwaXJ5VGltZVNwYW5cblx0fTtcblxuXHRpZiAoQnVja2V0VVJMKSB7XG5cdFx0Y29uZmlnLmNvbm5lY3Rpb24uZW5kcG9pbnQgPSBCdWNrZXRVUkw7XG5cdH1cblxuXHRBbWF6b25TM1VwbG9hZHMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnQW1hem9uUzMnLCBBbWF6b25TM1VwbG9hZHMubmFtZSwgY29uZmlnKTtcblx0QW1hem9uUzNBdmF0YXJzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0FtYXpvblMzJywgQW1hem9uUzNBdmF0YXJzLm5hbWUsIGNvbmZpZyk7XG59LCA1MDApO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfUzNfLywgY29uZmlndXJlKTtcbiIsIi8qIGdsb2JhbHMgRmlsZVVwbG9hZCwgVXBsb2FkRlMgKi9cblxuaW1wb3J0IF8gZnJvbSAndW5kZXJzY29yZSc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuXG5jb25zdCBGaWxlU3lzdGVtVXBsb2FkcyA9IG5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnRmlsZVN5c3RlbTpVcGxvYWRzJyxcblx0Ly8gc3RvcmUgc2V0dGVkIGJlbGxvd1xuXG5cdGdldChmaWxlLCByZXEsIHJlcykge1xuXHRcdGNvbnN0IGZpbGVQYXRoID0gdGhpcy5zdG9yZS5nZXRGaWxlUGF0aChmaWxlLl9pZCwgZmlsZSk7XG5cblx0XHR0cnkge1xuXHRcdFx0Y29uc3Qgc3RhdCA9IE1ldGVvci53cmFwQXN5bmMoZnMuc3RhdCkoZmlsZVBhdGgpO1xuXG5cdFx0XHRpZiAoc3RhdCAmJiBzdGF0LmlzRmlsZSgpKSB7XG5cdFx0XHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lKj1VVEYtOCcnJHsgZW5jb2RlVVJJQ29tcG9uZW50KGZpbGUubmFtZSkgfWApO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgZmlsZS51cGxvYWRlZEF0LnRvVVRDU3RyaW5nKCkpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCBmaWxlLnR5cGUpO1xuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIGZpbGUuc2l6ZSk7XG5cblx0XHRcdFx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKHJlcyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxufSk7XG5cbmNvbnN0IEZpbGVTeXN0ZW1BdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdGaWxlU3lzdGVtOkF2YXRhcnMnLFxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG5cblx0Z2V0KGZpbGUsIHJlcSwgcmVzKSB7XG5cdFx0Y29uc3QgZmlsZVBhdGggPSB0aGlzLnN0b3JlLmdldEZpbGVQYXRoKGZpbGUuX2lkLCBmaWxlKTtcblxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBzdGF0ID0gTWV0ZW9yLndyYXBBc3luYyhmcy5zdGF0KShmaWxlUGF0aCk7XG5cblx0XHRcdGlmIChzdGF0ICYmIHN0YXQuaXNGaWxlKCkpIHtcblx0XHRcdFx0ZmlsZSA9IEZpbGVVcGxvYWQuYWRkRXh0ZW5zaW9uVG8oZmlsZSk7XG5cblx0XHRcdFx0dGhpcy5zdG9yZS5nZXRSZWFkU3RyZWFtKGZpbGUuX2lkLCBmaWxlKS5waXBlKHJlcyk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmVzLndyaXRlSGVhZCg0MDQpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxufSk7XG5cblxuY29uc3QgY3JlYXRlRmlsZVN5c3RlbVN0b3JlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRwYXRoOiBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9GaWxlU3lzdGVtUGF0aCcpIC8vJy90bXAvdXBsb2Fkcy9waG90b3MnLFxuXHR9O1xuXG5cdEZpbGVTeXN0ZW1VcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbVVwbG9hZHMubmFtZSwgb3B0aW9ucyk7XG5cdEZpbGVTeXN0ZW1BdmF0YXJzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0xvY2FsJywgRmlsZVN5c3RlbUF2YXRhcnMubmFtZSwgb3B0aW9ucyk7XG5cblx0Ly8gREVQUkVDQVRFRCBiYWNrd2FyZHMgY29tcGF0aWJpbGlsdHkgKHJlbW92ZSlcblx0VXBsb2FkRlMuZ2V0U3RvcmVzKClbJ2ZpbGVTeXN0ZW0nXSA9IFVwbG9hZEZTLmdldFN0b3JlcygpW0ZpbGVTeXN0ZW1VcGxvYWRzLm5hbWVdO1xufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCBjcmVhdGVGaWxlU3lzdGVtU3RvcmUpO1xuIiwiLyogZ2xvYmFscyBGaWxlVXBsb2FkICovXG5cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgRmlsZVVwbG9hZENsYXNzIH0gZnJvbSAnLi4vbGliL0ZpbGVVcGxvYWQnO1xuaW1wb3J0ICcuLi8uLi91ZnMvR29vZ2xlU3RvcmFnZS9zZXJ2ZXIuanMnO1xuaW1wb3J0IGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xuXG5jb25zdCBnZXQgPSBmdW5jdGlvbihmaWxlLCByZXEsIHJlcykge1xuXHR0aGlzLnN0b3JlLmdldFJlZGlyZWN0VVJMKGZpbGUsIChlcnIsIGZpbGVVcmwpID0+IHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVVcmwpIHtcblx0XHRcdGlmIChSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX1Byb3h5JykpIHtcblx0XHRcdFx0Y29uc3QgcmVxdWVzdCA9IC9eaHR0cHM6Ly50ZXN0KGZpbGVVcmwpID8gaHR0cHMgOiBodHRwO1xuXHRcdFx0XHRyZXF1ZXN0LmdldChmaWxlVXJsLCBmaWxlUmVzID0+IGZpbGVSZXMucGlwZShyZXMpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgZmlsZVVybCk7XG5cdFx0XHRcdHJlcy53cml0ZUhlYWQoMzAyKTtcblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmNvbnN0IEdvb2dsZUNsb3VkU3RvcmFnZVVwbG9hZHMgPSBuZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dvb2dsZUNsb3VkU3RvcmFnZTpVcGxvYWRzJyxcblx0Z2V0XG5cdC8vIHN0b3JlIHNldHRlZCBiZWxsb3dcbn0pO1xuXG5jb25zdCBHb29nbGVDbG91ZFN0b3JhZ2VBdmF0YXJzID0gbmV3IEZpbGVVcGxvYWRDbGFzcyh7XG5cdG5hbWU6ICdHb29nbGVDbG91ZFN0b3JhZ2U6QXZhdGFycycsXG5cdGdldFxuXHQvLyBzdG9yZSBzZXR0ZWQgYmVsbG93XG59KTtcblxuY29uc3QgY29uZmlndXJlID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0Y29uc3QgYnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9CdWNrZXQnKTtcblx0Y29uc3QgYWNjZXNzSWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0FjY2Vzc0lkJyk7XG5cdGNvbnN0IHNlY3JldCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0Jyk7XG5cdGNvbnN0IFVSTEV4cGlyeVRpbWVTcGFuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfVVJMRXhwaXJ5VGltZVNwYW4nKTtcblxuXHRpZiAoIWJ1Y2tldCB8fCAhYWNjZXNzSWQgfHwgIXNlY3JldCkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGNvbnN0IGNvbmZpZyA9IHtcblx0XHRjb25uZWN0aW9uOiB7XG5cdFx0XHRjcmVkZW50aWFsczoge1xuXHRcdFx0XHRjbGllbnRfZW1haWw6IGFjY2Vzc0lkLFxuXHRcdFx0XHRwcml2YXRlX2tleTogc2VjcmV0XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRidWNrZXQsXG5cdFx0VVJMRXhwaXJ5VGltZVNwYW5cblx0fTtcblxuXHRHb29nbGVDbG91ZFN0b3JhZ2VVcGxvYWRzLnN0b3JlID0gRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dvb2dsZVN0b3JhZ2UnLCBHb29nbGVDbG91ZFN0b3JhZ2VVcGxvYWRzLm5hbWUsIGNvbmZpZyk7XG5cdEdvb2dsZUNsb3VkU3RvcmFnZUF2YXRhcnMuc3RvcmUgPSBGaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR29vZ2xlU3RvcmFnZScsIEdvb2dsZUNsb3VkU3RvcmFnZUF2YXRhcnMubmFtZSwgY29uZmlnKTtcbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KC9eRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlXy8sIGNvbmZpZ3VyZSk7XG4iLCIvKiBnbG9iYWxzIEZpbGVVcGxvYWQsIFVwbG9hZEZTICovXG5pbXBvcnQgc3RyZWFtIGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgemxpYiBmcm9tICd6bGliJztcbmltcG9ydCB1dGlsIGZyb20gJ3V0aWwnO1xuXG5pbXBvcnQgeyBGaWxlVXBsb2FkQ2xhc3MgfSBmcm9tICcuLi9saWIvRmlsZVVwbG9hZCc7XG5cbmNvbnN0IGxvZ2dlciA9IG5ldyBMb2dnZXIoJ0ZpbGVVcGxvYWQnKTtcblxuZnVuY3Rpb24gRXh0cmFjdFJhbmdlKG9wdGlvbnMpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEV4dHJhY3RSYW5nZSkpIHtcblx0XHRyZXR1cm4gbmV3IEV4dHJhY3RSYW5nZShvcHRpb25zKTtcblx0fVxuXG5cdHRoaXMuc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHR0aGlzLnN0b3AgPSBvcHRpb25zLnN0b3A7XG5cdHRoaXMuYnl0ZXNfcmVhZCA9IDA7XG5cblx0c3RyZWFtLlRyYW5zZm9ybS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xufVxudXRpbC5pbmhlcml0cyhFeHRyYWN0UmFuZ2UsIHN0cmVhbS5UcmFuc2Zvcm0pO1xuXG5cbkV4dHJhY3RSYW5nZS5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uKGNodW5rLCBlbmMsIGNiKSB7XG5cdGlmICh0aGlzLmJ5dGVzX3JlYWQgPiB0aGlzLnN0b3ApIHtcblx0XHQvLyBkb25lIHJlYWRpbmdcblx0XHR0aGlzLmVuZCgpO1xuXHR9IGVsc2UgaWYgKHRoaXMuYnl0ZXNfcmVhZCArIGNodW5rLmxlbmd0aCA8IHRoaXMuc3RhcnQpIHtcblx0XHQvLyB0aGlzIGNodW5rIGlzIHN0aWxsIGJlZm9yZSB0aGUgc3RhcnQgYnl0ZVxuXHR9IGVsc2Uge1xuXHRcdGxldCBzdGFydDtcblx0XHRsZXQgc3RvcDtcblxuXHRcdGlmICh0aGlzLnN0YXJ0IDw9IHRoaXMuYnl0ZXNfcmVhZCkge1xuXHRcdFx0c3RhcnQgPSAwO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdGFydCA9IHRoaXMuc3RhcnQgLSB0aGlzLmJ5dGVzX3JlYWQ7XG5cdFx0fVxuXHRcdGlmICgodGhpcy5zdG9wIC0gdGhpcy5ieXRlc19yZWFkICsgMSkgPCBjaHVuay5sZW5ndGgpIHtcblx0XHRcdHN0b3AgPSB0aGlzLnN0b3AgLSB0aGlzLmJ5dGVzX3JlYWQgKyAxO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdG9wID0gY2h1bmsubGVuZ3RoO1xuXHRcdH1cblx0XHRjb25zdCBuZXdjaHVuayA9IGNodW5rLnNsaWNlKHN0YXJ0LCBzdG9wKTtcblx0XHR0aGlzLnB1c2gobmV3Y2h1bmspO1xuXHR9XG5cdHRoaXMuYnl0ZXNfcmVhZCArPSBjaHVuay5sZW5ndGg7XG5cdGNiKCk7XG59O1xuXG5cbmNvbnN0IGdldEJ5dGVSYW5nZSA9IGZ1bmN0aW9uKGhlYWRlcikge1xuXHRpZiAoaGVhZGVyKSB7XG5cdFx0Y29uc3QgbWF0Y2hlcyA9IGhlYWRlci5tYXRjaCgvKFxcZCspLShcXGQrKS8pO1xuXHRcdGlmIChtYXRjaGVzKSB7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdGFydDogcGFyc2VJbnQobWF0Y2hlc1sxXSwgMTApLFxuXHRcdFx0XHRzdG9wOiBwYXJzZUludChtYXRjaGVzWzJdLCAxMClcblx0XHRcdH07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuXG4vLyBjb2RlIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qYWxpay9qYWxpay11ZnMvYmxvYi9tYXN0ZXIvdWZzLXNlcnZlci5qcyNMMzEwXG5jb25zdCByZWFkRnJvbUdyaWRGUyA9IGZ1bmN0aW9uKHN0b3JlTmFtZSwgZmlsZUlkLCBmaWxlLCByZXEsIHJlcykge1xuXHRjb25zdCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XG5cdGNvbnN0IHJzID0gc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUpO1xuXHRjb25zdCB3cyA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcblxuXHRbcnMsIHdzXS5mb3JFYWNoKHN0cmVhbSA9PiBzdHJlYW0ub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKSB7XG5cdFx0c3RvcmUub25SZWFkRXJyb3IuY2FsbChzdG9yZSwgZXJyLCBmaWxlSWQsIGZpbGUpO1xuXHRcdHJlcy5lbmQoKTtcblx0fSkpO1xuXG5cdHdzLm9uKCdjbG9zZScsIGZ1bmN0aW9uKCkge1xuXHRcdC8vIENsb3NlIG91dHB1dCBzdHJlYW0gYXQgdGhlIGVuZFxuXHRcdHdzLmVtaXQoJ2VuZCcpO1xuXHR9KTtcblxuXHRjb25zdCBhY2NlcHQgPSByZXEuaGVhZGVyc1snYWNjZXB0LWVuY29kaW5nJ10gfHwgJyc7XG5cblx0Ly8gVHJhbnNmb3JtIHN0cmVhbVxuXHRzdG9yZS50cmFuc2Zvcm1SZWFkKHJzLCB3cywgZmlsZUlkLCBmaWxlLCByZXEpO1xuXHRjb25zdCByYW5nZSA9IGdldEJ5dGVSYW5nZShyZXEuaGVhZGVycy5yYW5nZSk7XG5cdGxldCBvdXRfb2ZfcmFuZ2UgPSBmYWxzZTtcblx0aWYgKHJhbmdlKSB7XG5cdFx0b3V0X29mX3JhbmdlID0gKHJhbmdlLnN0YXJ0ID4gZmlsZS5zaXplKSB8fCAocmFuZ2Uuc3RvcCA8PSByYW5nZS5zdGFydCkgfHwgKHJhbmdlLnN0b3AgPiBmaWxlLnNpemUpO1xuXHR9XG5cblx0Ly8gQ29tcHJlc3MgZGF0YSB1c2luZyBnemlwXG5cdGlmIChhY2NlcHQubWF0Y2goL1xcYmd6aXBcXGIvKSAmJiByYW5nZSA9PT0gbnVsbCkge1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRW5jb2RpbmcnLCAnZ3ppcCcpO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0cmVzLndyaXRlSGVhZCgyMDApO1xuXHRcdHdzLnBpcGUoemxpYi5jcmVhdGVHemlwKCkpLnBpcGUocmVzKTtcblx0fSBlbHNlIGlmIChhY2NlcHQubWF0Y2goL1xcYmRlZmxhdGVcXGIvKSAmJiByYW5nZSA9PT0gbnVsbCkge1xuXHRcdC8vIENvbXByZXNzIGRhdGEgdXNpbmcgZGVmbGF0ZVxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtRW5jb2RpbmcnLCAnZGVmbGF0ZScpO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0cmVzLndyaXRlSGVhZCgyMDApO1xuXHRcdHdzLnBpcGUoemxpYi5jcmVhdGVEZWZsYXRlKCkpLnBpcGUocmVzKTtcblx0fSBlbHNlIGlmIChyYW5nZSAmJiBvdXRfb2ZfcmFuZ2UpIHtcblx0XHQvLyBvdXQgb2YgcmFuZ2UgcmVxdWVzdCwgcmV0dXJuIDQxNlxuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1UeXBlJyk7XG5cdFx0cmVzLnJlbW92ZUhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicpO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0xhc3QtTW9kaWZpZWQnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LVJhbmdlJywgYGJ5dGVzICovJHsgZmlsZS5zaXplIH1gKTtcblx0XHRyZXMud3JpdGVIZWFkKDQxNik7XG5cdFx0cmVzLmVuZCgpO1xuXHR9IGVsc2UgaWYgKHJhbmdlKSB7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1SYW5nZScsIGBieXRlcyAkeyByYW5nZS5zdGFydCB9LSR7IHJhbmdlLnN0b3AgfS8keyBmaWxlLnNpemUgfWApO1xuXHRcdHJlcy5yZW1vdmVIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJyk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCByYW5nZS5zdG9wIC0gcmFuZ2Uuc3RhcnQgKyAxKTtcblx0XHRyZXMud3JpdGVIZWFkKDIwNik7XG5cdFx0bG9nZ2VyLmRlYnVnKCdGaWxlIHVwbG9hZCBleHRyYWN0aW5nIHJhbmdlJyk7XG5cdFx0d3MucGlwZShuZXcgRXh0cmFjdFJhbmdlKHsgc3RhcnQ6IHJhbmdlLnN0YXJ0LCBzdG9wOiByYW5nZS5zdG9wIH0pKS5waXBlKHJlcyk7XG5cdH0gZWxzZSB7XG5cdFx0cmVzLndyaXRlSGVhZCgyMDApO1xuXHRcdHdzLnBpcGUocmVzKTtcblx0fVxufTtcblxuRmlsZVVwbG9hZC5jb25maWd1cmVVcGxvYWRzU3RvcmUoJ0dyaWRGUycsICdHcmlkRlM6VXBsb2FkcycsIHtcblx0Y29sbGVjdGlvbk5hbWU6ICdyb2NrZXRjaGF0X3VwbG9hZHMnXG59KTtcblxuLy8gREVQUkVDQVRFRDogYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgKHJlbW92ZSlcblVwbG9hZEZTLmdldFN0b3JlcygpWydyb2NrZXRjaGF0X3VwbG9hZHMnXSA9IFVwbG9hZEZTLmdldFN0b3JlcygpWydHcmlkRlM6VXBsb2FkcyddO1xuXG5GaWxlVXBsb2FkLmNvbmZpZ3VyZVVwbG9hZHNTdG9yZSgnR3JpZEZTJywgJ0dyaWRGUzpBdmF0YXJzJywge1xuXHRjb2xsZWN0aW9uTmFtZTogJ3JvY2tldGNoYXRfYXZhdGFycydcbn0pO1xuXG5cbm5ldyBGaWxlVXBsb2FkQ2xhc3Moe1xuXHRuYW1lOiAnR3JpZEZTOlVwbG9hZHMnLFxuXG5cdGdldChmaWxlLCByZXEsIHJlcykge1xuXHRcdGZpbGUgPSBGaWxlVXBsb2FkLmFkZEV4dGVuc2lvblRvKGZpbGUpO1xuXG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZSo9VVRGLTgnJyR7IGVuY29kZVVSSUNvbXBvbmVudChmaWxlLm5hbWUpIH1gKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdMYXN0LU1vZGlmaWVkJywgZmlsZS51cGxvYWRlZEF0LnRvVVRDU3RyaW5nKCkpO1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsIGZpbGUudHlwZSk7XG5cdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1MZW5ndGgnLCBmaWxlLnNpemUpO1xuXG5cdFx0cmV0dXJuIHJlYWRGcm9tR3JpZEZTKGZpbGUuc3RvcmUsIGZpbGUuX2lkLCBmaWxlLCByZXEsIHJlcyk7XG5cdH1cbn0pO1xuXG5uZXcgRmlsZVVwbG9hZENsYXNzKHtcblx0bmFtZTogJ0dyaWRGUzpBdmF0YXJzJyxcblxuXHRnZXQoZmlsZSwgcmVxLCByZXMpIHtcblx0XHRmaWxlID0gRmlsZVVwbG9hZC5hZGRFeHRlbnNpb25UbyhmaWxlKTtcblxuXHRcdHJldHVybiByZWFkRnJvbUdyaWRGUyhmaWxlLnN0b3JlLCBmaWxlLl9pZCwgZmlsZSwgcmVxLCByZXMpO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgU2xpbmdzaG90LCBGaWxlVXBsb2FkICovXG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcblxuY29uc3QgY29uZmlndXJlU2xpbmdzaG90ID0gXy5kZWJvdW5jZSgoKSA9PiB7XG5cdGNvbnN0IHR5cGUgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnKTtcblx0Y29uc3QgYnVja2V0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0Jyk7XG5cdGNvbnN0IGFjbCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX0FjbCcpO1xuXHRjb25zdCBhY2Nlc3NLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NBY2Nlc3NLZXlJZCcpO1xuXHRjb25zdCBzZWNyZXRLZXkgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19BV1NTZWNyZXRBY2Nlc3NLZXknKTtcblx0Y29uc3QgY2RuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfUzNfQ0ROJyk7XG5cdGNvbnN0IHJlZ2lvbiA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1MzX1JlZ2lvbicpO1xuXHRjb25zdCBidWNrZXRVcmwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9TM19CdWNrZXRVUkwnKTtcblxuXHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXTtcblxuXHRpZiAodHlwZSA9PT0gJ0FtYXpvblMzJyAmJiAhXy5pc0VtcHR5KGJ1Y2tldCkgJiYgIV8uaXNFbXB0eShhY2Nlc3NLZXkpICYmICFfLmlzRW1wdHkoc2VjcmV0S2V5KSkge1xuXHRcdGlmIChTbGluZ3Nob3QuX2RpcmVjdGl2ZXNbJ3JvY2tldGNoYXQtdXBsb2FkcyddKSB7XG5cdFx0XHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMnXTtcblx0XHR9XG5cdFx0Y29uc3QgY29uZmlnID0ge1xuXHRcdFx0YnVja2V0LFxuXHRcdFx0a2V5KGZpbGUsIG1ldGFDb250ZXh0KSB7XG5cdFx0XHRcdGNvbnN0IGlkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHRcdGNvbnN0IHBhdGggPSBgJHsgUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ3VuaXF1ZUlEJykgfS91cGxvYWRzLyR7IG1ldGFDb250ZXh0LnJpZCB9LyR7IHRoaXMudXNlcklkIH0vJHsgaWQgfWA7XG5cblx0XHRcdFx0Y29uc3QgdXBsb2FkID0ge1xuXHRcdFx0XHRcdF9pZDogaWQsXG5cdFx0XHRcdFx0cmlkOiBtZXRhQ29udGV4dC5yaWQsXG5cdFx0XHRcdFx0QW1hem9uUzM6IHtcblx0XHRcdFx0XHRcdHBhdGhcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5pbnNlcnRGaWxlSW5pdCh0aGlzLnVzZXJJZCwgJ0FtYXpvblMzOlVwbG9hZHMnLCBmaWxlLCB1cGxvYWQpO1xuXG5cdFx0XHRcdHJldHVybiBwYXRoO1xuXHRcdFx0fSxcblx0XHRcdEFXU0FjY2Vzc0tleUlkOiBhY2Nlc3NLZXksXG5cdFx0XHRBV1NTZWNyZXRBY2Nlc3NLZXk6IHNlY3JldEtleVxuXHRcdH07XG5cblx0XHRpZiAoIV8uaXNFbXB0eShhY2wpKSB7XG5cdFx0XHRjb25maWcuYWNsID0gYWNsO1xuXHRcdH1cblxuXHRcdGlmICghXy5pc0VtcHR5KGNkbikpIHtcblx0XHRcdGNvbmZpZy5jZG4gPSBjZG47XG5cdFx0fVxuXG5cdFx0aWYgKCFfLmlzRW1wdHkocmVnaW9uKSkge1xuXHRcdFx0Y29uZmlnLnJlZ2lvbiA9IHJlZ2lvbjtcblx0XHR9XG5cblx0XHRpZiAoIV8uaXNFbXB0eShidWNrZXRVcmwpKSB7XG5cdFx0XHRjb25maWcuYnVja2V0VXJsID0gYnVja2V0VXJsO1xuXHRcdH1cblxuXHRcdHRyeSB7XG5cdFx0XHRTbGluZ3Nob3QuY3JlYXRlRGlyZWN0aXZlKCdyb2NrZXRjaGF0LXVwbG9hZHMnLCBTbGluZ3Nob3QuUzNTdG9yYWdlLCBjb25maWcpO1xuXHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNvbmZpZ3VyaW5nIFMzIC0+JywgZS5tZXNzYWdlKTtcblx0XHR9XG5cdH1cbn0sIDUwMCk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsIGNvbmZpZ3VyZVNsaW5nc2hvdCk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfUzNfLywgY29uZmlndXJlU2xpbmdzaG90KTtcblxuXG5cbmNvbnN0IGNyZWF0ZUdvb2dsZVN0b3JhZ2VEaXJlY3RpdmUgPSBfLmRlYm91bmNlKCgpID0+IHtcblx0Y29uc3QgdHlwZSA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScpO1xuXHRjb25zdCBidWNrZXQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Hb29nbGVTdG9yYWdlX0J1Y2tldCcpO1xuXHRjb25zdCBhY2Nlc3NJZCA9IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQWNjZXNzSWQnKTtcblx0Y29uc3Qgc2VjcmV0ID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9TZWNyZXQnKTtcblxuXHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXTtcblxuXHRpZiAodHlwZSA9PT0gJ0dvb2dsZUNsb3VkU3RvcmFnZScgJiYgIV8uaXNFbXB0eShzZWNyZXQpICYmICFfLmlzRW1wdHkoYWNjZXNzSWQpICYmICFfLmlzRW1wdHkoYnVja2V0KSkge1xuXHRcdGlmIChTbGluZ3Nob3QuX2RpcmVjdGl2ZXNbJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncyddKSB7XG5cdFx0XHRkZWxldGUgU2xpbmdzaG90Ll9kaXJlY3RpdmVzWydyb2NrZXRjaGF0LXVwbG9hZHMtZ3MnXTtcblx0XHR9XG5cblx0XHRjb25zdCBjb25maWcgPSB7XG5cdFx0XHRidWNrZXQsXG5cdFx0XHRHb29nbGVBY2Nlc3NJZDogYWNjZXNzSWQsXG5cdFx0XHRHb29nbGVTZWNyZXRLZXk6IHNlY3JldCxcblx0XHRcdGtleShmaWxlLCBtZXRhQ29udGV4dCkge1xuXHRcdFx0XHRjb25zdCBpZCA9IFJhbmRvbS5pZCgpO1xuXHRcdFx0XHRjb25zdCBwYXRoID0gYCR7IFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd1bmlxdWVJRCcpIH0vdXBsb2Fkcy8keyBtZXRhQ29udGV4dC5yaWQgfS8keyB0aGlzLnVzZXJJZCB9LyR7IGlkIH1gO1xuXG5cdFx0XHRcdGNvbnN0IHVwbG9hZCA9IHtcblx0XHRcdFx0XHRfaWQ6IGlkLFxuXHRcdFx0XHRcdHJpZDogbWV0YUNvbnRleHQucmlkLFxuXHRcdFx0XHRcdEdvb2dsZVN0b3JhZ2U6IHtcblx0XHRcdFx0XHRcdHBhdGhcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Um9ja2V0Q2hhdC5tb2RlbHMuVXBsb2Fkcy5pbnNlcnRGaWxlSW5pdCh0aGlzLnVzZXJJZCwgJ0dvb2dsZUNsb3VkU3RvcmFnZTpVcGxvYWRzJywgZmlsZSwgdXBsb2FkKTtcblxuXHRcdFx0XHRyZXR1cm4gcGF0aDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dHJ5IHtcblx0XHRcdFNsaW5nc2hvdC5jcmVhdGVEaXJlY3RpdmUoJ3JvY2tldGNoYXQtdXBsb2Fkcy1ncycsIFNsaW5nc2hvdC5Hb29nbGVDbG91ZCwgY29uZmlnKTtcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdFcnJvciBjb25maWd1cmluZyBHb29nbGVDbG91ZFN0b3JhZ2UgLT4nLCBlLm1lc3NhZ2UpO1xuXHRcdH1cblx0fVxufSwgNTAwKTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJywgY3JlYXRlR29vZ2xlU3RvcmFnZURpcmVjdGl2ZSk7XG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgvXkZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV8vLCBjcmVhdGVHb29nbGVTdG9yYWdlRGlyZWN0aXZlKTtcbiIsImltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5NZXRlb3IubWV0aG9kcyh7XG5cdGFzeW5jICdzZW5kRmlsZU1lc3NhZ2UnKHJvb21JZCwgc3RvcmUsIGZpbGUsIG1zZ0RhdGEgPSB7fSkge1xuXHRcdGlmICghTWV0ZW9yLnVzZXJJZCgpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXVzZXInLCAnSW52YWxpZCB1c2VyJywgeyBtZXRob2Q6ICdzZW5kRmlsZU1lc3NhZ2UnIH0pO1xuXHRcdH1cblxuXHRcdGNvbnN0IHJvb20gPSBNZXRlb3IuY2FsbCgnY2FuQWNjZXNzUm9vbScsIHJvb21JZCwgTWV0ZW9yLnVzZXJJZCgpKTtcblxuXHRcdGlmICghcm9vbSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGNoZWNrKG1zZ0RhdGEsIHtcblx0XHRcdGF2YXRhcjogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcblx0XHRcdGVtb2ppOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpLFxuXHRcdFx0YWxpYXM6IE1hdGNoLk9wdGlvbmFsKFN0cmluZyksXG5cdFx0XHRncm91cGFibGU6IE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pLFxuXHRcdFx0bXNnOiBNYXRjaC5PcHRpb25hbChTdHJpbmcpXG5cdFx0fSk7XG5cblx0XHRSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLnVwZGF0ZUZpbGVDb21wbGV0ZShmaWxlLl9pZCwgTWV0ZW9yLnVzZXJJZCgpLCBfLm9taXQoZmlsZSwgJ19pZCcpKTtcblxuXHRcdGNvbnN0IGZpbGVVcmwgPSBgL2ZpbGUtdXBsb2FkLyR7IGZpbGUuX2lkIH0vJHsgZW5jb2RlVVJJKGZpbGUubmFtZSkgfWA7XG5cblx0XHRjb25zdCBhdHRhY2htZW50ID0ge1xuXHRcdFx0dGl0bGU6IGZpbGUubmFtZSxcblx0XHRcdHR5cGU6ICdmaWxlJyxcblx0XHRcdGRlc2NyaXB0aW9uOiBmaWxlLmRlc2NyaXB0aW9uLFxuXHRcdFx0dGl0bGVfbGluazogZmlsZVVybCxcblx0XHRcdHRpdGxlX2xpbmtfZG93bmxvYWQ6IHRydWVcblx0XHR9O1xuXG5cdFx0aWYgKC9eaW1hZ2VcXC8uKy8udGVzdChmaWxlLnR5cGUpKSB7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3VybCA9IGZpbGVVcmw7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3R5cGUgPSBmaWxlLnR5cGU7XG5cdFx0XHRhdHRhY2htZW50LmltYWdlX3NpemUgPSBmaWxlLnNpemU7XG5cdFx0XHRpZiAoZmlsZS5pZGVudGlmeSAmJiBmaWxlLmlkZW50aWZ5LnNpemUpIHtcblx0XHRcdFx0YXR0YWNobWVudC5pbWFnZV9kaW1lbnNpb25zID0gZmlsZS5pZGVudGlmeS5zaXplO1xuXHRcdFx0fVxuXHRcdFx0YXR0YWNobWVudC5pbWFnZV9wcmV2aWV3ID0gYXdhaXQgRmlsZVVwbG9hZC5yZXNpemVJbWFnZVByZXZpZXcoZmlsZSk7XG5cdFx0fSBlbHNlIGlmICgvXmF1ZGlvXFwvLisvLnRlc3QoZmlsZS50eXBlKSkge1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb191cmwgPSBmaWxlVXJsO1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb190eXBlID0gZmlsZS50eXBlO1xuXHRcdFx0YXR0YWNobWVudC5hdWRpb19zaXplID0gZmlsZS5zaXplO1xuXHRcdH0gZWxzZSBpZiAoL152aWRlb1xcLy4rLy50ZXN0KGZpbGUudHlwZSkpIHtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdXJsID0gZmlsZVVybDtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fdHlwZSA9IGZpbGUudHlwZTtcblx0XHRcdGF0dGFjaG1lbnQudmlkZW9fc2l6ZSA9IGZpbGUuc2l6ZTtcblx0XHR9XG5cblx0XHRjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcblx0XHRsZXQgbXNnID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0XHRfaWQ6IFJhbmRvbS5pZCgpLFxuXHRcdFx0cmlkOiByb29tSWQsXG5cdFx0XHR0czogbmV3IERhdGUoKSxcblx0XHRcdG1zZzogJycsXG5cdFx0XHRmaWxlOiB7XG5cdFx0XHRcdF9pZDogZmlsZS5faWQsXG5cdFx0XHRcdG5hbWU6IGZpbGUubmFtZSxcblx0XHRcdFx0dHlwZTogZmlsZS50eXBlXG5cdFx0XHR9LFxuXHRcdFx0Z3JvdXBhYmxlOiBmYWxzZSxcblx0XHRcdGF0dGFjaG1lbnRzOiBbYXR0YWNobWVudF1cblx0XHR9LCBtc2dEYXRhKTtcblxuXHRcdG1zZyA9IE1ldGVvci5jYWxsKCdzZW5kTWVzc2FnZScsIG1zZyk7XG5cblx0XHRNZXRlb3IuZGVmZXIoKCkgPT4gUm9ja2V0Q2hhdC5jYWxsYmFja3MucnVuKCdhZnRlckZpbGVVcGxvYWQnLCB7IHVzZXIsIHJvb20sIG1lc3NhZ2U6IG1zZyB9KSk7XG5cblx0XHRyZXR1cm4gbXNnO1xuXHR9XG59KTtcbiIsIi8qIGdsb2JhbHMgVXBsb2FkRlMgKi9cblxubGV0IHByb3RlY3RlZEZpbGVzO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXMnLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG5cdHByb3RlY3RlZEZpbGVzID0gdmFsdWU7XG59KTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHRnZXRTM0ZpbGVVcmwoZmlsZUlkKSB7XG5cdFx0aWYgKHByb3RlY3RlZEZpbGVzICYmICFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7IG1ldGhvZDogJ3NlbmRGaWxlTWVzc2FnZScgfSk7XG5cdFx0fVxuXHRcdGNvbnN0IGZpbGUgPSBSb2NrZXRDaGF0Lm1vZGVscy5VcGxvYWRzLmZpbmRPbmVCeUlkKGZpbGVJZCk7XG5cblx0XHRyZXR1cm4gVXBsb2FkRlMuZ2V0U3RvcmUoJ0FtYXpvblMzOlVwbG9hZHMnKS5nZXRSZWRpcmVjdFVSTChmaWxlKTtcblx0fVxufSk7XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdGaWxlVXBsb2FkJywgZnVuY3Rpb24oKSB7XG5cdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0VuYWJsZWQnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9NYXhGaWxlU2l6ZScsIDIwOTcxNTIsIHtcblx0XHR0eXBlOiAnaW50Jyxcblx0XHRwdWJsaWM6IHRydWVcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfTWVkaWFUeXBlV2hpdGVMaXN0JywgJ2ltYWdlLyosYXVkaW8vKix2aWRlby8qLGFwcGxpY2F0aW9uL3ppcCxhcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkLGFwcGxpY2F0aW9uL3BkZix0ZXh0L3BsYWluLGFwcGxpY2F0aW9uL21zd29yZCxhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQud29yZHByb2Nlc3NpbmdtbC5kb2N1bWVudCcsIHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9NZWRpYVR5cGVXaGl0ZUxpc3REZXNjcmlwdGlvbidcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUHJvdGVjdEZpbGVzJywgdHJ1ZSwge1xuXHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRwdWJsaWM6IHRydWUsXG5cdFx0aTE4bkRlc2NyaXB0aW9uOiAnRmlsZVVwbG9hZF9Qcm90ZWN0RmlsZXNEZXNjcmlwdGlvbidcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJywgJ0dyaWRGUycsIHtcblx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRrZXk6ICdHcmlkRlMnLFxuXHRcdFx0aTE4bkxhYmVsOiAnR3JpZEZTJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0FtYXpvblMzJyxcblx0XHRcdGkxOG5MYWJlbDogJ0FtYXpvblMzJ1xuXHRcdH0sIHtcblx0XHRcdGtleTogJ0dvb2dsZUNsb3VkU3RvcmFnZScsXG5cdFx0XHRpMThuTGFiZWw6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0fSwge1xuXHRcdFx0a2V5OiAnRmlsZVN5c3RlbScsXG5cdFx0XHRpMThuTGFiZWw6ICdGaWxlU3lzdGVtJ1xuXHRcdH1dLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ0FtYXpvbiBTMycsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0J1Y2tldCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19BY2wnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQVdTQWNjZXNzS2V5SWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQVdTU2VjcmV0QWNjZXNzS2V5JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX0NETicsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19SZWdpb24nLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfQnVja2V0VVJMJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fSxcblx0XHRcdGkxOG5EZXNjcmlwdGlvbjogJ092ZXJyaWRlX1VSTF90b193aGljaF9maWxlc19hcmVfdXBsb2FkZWRfVGhpc191cmxfYWxzb191c2VkX2Zvcl9kb3dubG9hZHNfdW5sZXNzX2FfQ0ROX2lzX2dpdmVuLidcblx0XHR9KTtcblx0XHR0aGlzLmFkZCgnRmlsZVVwbG9hZF9TM19TaWduYXR1cmVWZXJzaW9uJywgJ3Y0Jywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnQW1hem9uUzMnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfUzNfRm9yY2VQYXRoU3R5bGUnLCBmYWxzZSwge1xuXHRcdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdFx0ZW5hYmxlUXVlcnk6IHtcblx0XHRcdFx0X2lkOiAnRmlsZVVwbG9hZF9TdG9yYWdlX1R5cGUnLFxuXHRcdFx0XHR2YWx1ZTogJ0FtYXpvblMzJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX1VSTEV4cGlyeVRpbWVTcGFuJywgMTIwLCB7XG5cdFx0XHR0eXBlOiAnaW50Jyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH0sXG5cdFx0XHRpMThuRGVzY3JpcHRpb246ICdGaWxlVXBsb2FkX1MzX1VSTEV4cGlyeVRpbWVTcGFuX0Rlc2NyaXB0aW9uJ1xuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX1MzX1Byb3h5JywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdBbWF6b25TMydcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5zZWN0aW9uKCdHb29nbGUgQ2xvdWQgU3RvcmFnZScsIGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfQnVja2V0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9BY2Nlc3NJZCcsICcnLCB7XG5cdFx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHRcdHByaXZhdGU6IHRydWUsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdGaWxlVXBsb2FkX0dvb2dsZVN0b3JhZ2VfU2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0bXVsdGlsaW5lOiB0cnVlLFxuXHRcdFx0cHJpdmF0ZTogdHJ1ZSxcblx0XHRcdGVuYWJsZVF1ZXJ5OiB7XG5cdFx0XHRcdF9pZDogJ0ZpbGVVcGxvYWRfU3RvcmFnZV9UeXBlJyxcblx0XHRcdFx0dmFsdWU6ICdHb29nbGVDbG91ZFN0b3JhZ2UnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfR29vZ2xlU3RvcmFnZV9Qcm94eScsIGZhbHNlLCB7XG5cdFx0XHR0eXBlOiAnYm9vbGVhbicsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnR29vZ2xlQ2xvdWRTdG9yYWdlJ1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHR0aGlzLnNlY3Rpb24oJ0ZpbGUgU3lzdGVtJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfRmlsZVN5c3RlbVBhdGgnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRfaWQ6ICdGaWxlVXBsb2FkX1N0b3JhZ2VfVHlwZScsXG5cdFx0XHRcdHZhbHVlOiAnRmlsZVN5c3RlbSdcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0dGhpcy5hZGQoJ0ZpbGVVcGxvYWRfRW5hYmxlZF9EaXJlY3QnLCB0cnVlLCB7XG5cdFx0dHlwZTogJ2Jvb2xlYW4nLFxuXHRcdHB1YmxpYzogdHJ1ZVxuXHR9KTtcbn0pO1xuIiwiaW1wb3J0IHtVcGxvYWRGU30gZnJvbSAnbWV0ZW9yL2phbGlrOnVmcyc7XG5pbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBTMyBmcm9tICdhd3Mtc2RrL2NsaWVudHMvczMnO1xuaW1wb3J0IHN0cmVhbSBmcm9tICdzdHJlYW0nO1xuXG4vKipcbiAqIEFtYXpvblMzIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBBbWF6b25TM1N0b3JlIGV4dGVuZHMgVXBsb2FkRlMuU3RvcmUge1xuXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcblx0XHQvLyBEZWZhdWx0IG9wdGlvbnNcblx0XHQvLyBvcHRpb25zLnNlY3JldEFjY2Vzc0tleSxcblx0XHQvLyBvcHRpb25zLmFjY2Vzc0tleUlkLFxuXHRcdC8vIG9wdGlvbnMucmVnaW9uLFxuXHRcdC8vIG9wdGlvbnMuc3NsRW5hYmxlZCAvLyBvcHRpb25hbFxuXG5cdFx0b3B0aW9ucyA9IF8uZXh0ZW5kKHtcblx0XHRcdGh0dHBPcHRpb25zOiB7XG5cdFx0XHRcdHRpbWVvdXQ6IDYwMDAsXG5cdFx0XHRcdGFnZW50OiBmYWxzZVxuXHRcdFx0fVxuXHRcdH0sIG9wdGlvbnMpO1xuXG5cdFx0c3VwZXIob3B0aW9ucyk7XG5cblx0XHRjb25zdCBjbGFzc09wdGlvbnMgPSBvcHRpb25zO1xuXG5cdFx0Y29uc3QgczMgPSBuZXcgUzMob3B0aW9ucy5jb25uZWN0aW9uKTtcblxuXHRcdG9wdGlvbnMuZ2V0UGF0aCA9IG9wdGlvbnMuZ2V0UGF0aCB8fCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4gZmlsZS5faWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChmaWxlLkFtYXpvblMzKSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLkFtYXpvblMzLnBhdGg7XG5cdFx0XHR9XG5cdFx0XHQvLyBDb21wYXRpYmlsaXR5XG5cdFx0XHQvLyBUT0RPOiBNaWdyYXRpb25cblx0XHRcdGlmIChmaWxlLnMzKSB7XG5cdFx0XHRcdHJldHVybiBmaWxlLnMzLnBhdGggKyBmaWxlLl9pZDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRSZWRpcmVjdFVSTCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGNvbnN0IHBhcmFtcyA9IHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSksXG5cdFx0XHRcdEV4cGlyZXM6IGNsYXNzT3B0aW9ucy5VUkxFeHBpcnlUaW1lU3BhblxuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIHMzLmdldFNpZ25lZFVybCgnZ2V0T2JqZWN0JywgcGFyYW1zKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlcyB0aGUgZmlsZSBpbiB0aGUgY29sbGVjdGlvblxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNoZWNrKGZpbGUsIE9iamVjdCk7XG5cblx0XHRcdGlmIChmaWxlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHRcdGZpbGUuX2lkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuQW1hem9uUzMgPSB7XG5cdFx0XHRcdHBhdGg6IHRoaXMub3B0aW9ucy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRmaWxlLnN0b3JlID0gdGhpcy5vcHRpb25zLm5hbWU7IC8vIGFzc2lnbiBzdG9yZSB0byBmaWxlXG5cdFx0XHRyZXR1cm4gdGhpcy5nZXRDb2xsZWN0aW9uKCkuaW5zZXJ0KGZpbGUsIGNhbGxiYWNrKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogUmVtb3ZlcyB0aGUgZmlsZVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gY2FsbGJhY2tcblx0XHQgKi9cblx0XHR0aGlzLmRlbGV0ZSA9IGZ1bmN0aW9uKGZpbGVJZCwgY2FsbGJhY2spIHtcblx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xuXHRcdFx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdFx0XHRLZXk6IHRoaXMuZ2V0UGF0aChmaWxlKVxuXHRcdFx0fTtcblxuXHRcdFx0czMuZGVsZXRlT2JqZWN0KHBhcmFtcywgKGVyciwgZGF0YSkgPT4ge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHJlYWQgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdEtleTogdGhpcy5nZXRQYXRoKGZpbGUpXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAob3B0aW9ucy5zdGFydCAmJiBvcHRpb25zLmVuZCkge1xuXHRcdFx0XHRwYXJhbXMuUmFuZ2UgPSBgJHsgb3B0aW9ucy5zdGFydCB9IC0gJHsgb3B0aW9ucy5lbmQgfWA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBzMy5nZXRPYmplY3QocGFyYW1zKS5jcmVhdGVSZWFkU3RyZWFtKCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlSWQsIGZpbGUvKiwgb3B0aW9ucyovKSB7XG5cdFx0XHRjb25zdCB3cml0ZVN0cmVhbSA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcblx0XHRcdHdyaXRlU3RyZWFtLmxlbmd0aCA9IGZpbGUuc2l6ZTtcblxuXHRcdFx0d3JpdGVTdHJlYW0ub24oJ25ld0xpc3RlbmVyJywgKGV2ZW50LCBsaXN0ZW5lcikgPT4ge1xuXHRcdFx0XHRpZiAoZXZlbnQgPT09ICdmaW5pc2gnKSB7XG5cdFx0XHRcdFx0cHJvY2Vzcy5uZXh0VGljaygoKSA9PiB7XG5cdFx0XHRcdFx0XHR3cml0ZVN0cmVhbS5yZW1vdmVMaXN0ZW5lcihldmVudCwgbGlzdGVuZXIpO1xuXHRcdFx0XHRcdFx0d3JpdGVTdHJlYW0ub24oJ3JlYWxfZmluaXNoJywgbGlzdGVuZXIpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0czMucHV0T2JqZWN0KHtcblx0XHRcdFx0S2V5OiB0aGlzLmdldFBhdGgoZmlsZSksXG5cdFx0XHRcdEJvZHk6IHdyaXRlU3RyZWFtLFxuXHRcdFx0XHRDb250ZW50VHlwZTogZmlsZS50eXBlLFxuXHRcdFx0XHRDb250ZW50RGlzcG9zaXRpb246IGBpbmxpbmU7IGZpbGVuYW1lPVwiJHsgZW5jb2RlVVJJKGZpbGUubmFtZSkgfVwiYFxuXG5cdFx0XHR9LCAoZXJyb3IpID0+IHtcblx0XHRcdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3cml0ZVN0cmVhbS5lbWl0KCdyZWFsX2ZpbmlzaCcpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB3cml0ZVN0cmVhbTtcblx0XHR9O1xuXHR9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5BbWF6b25TMyA9IEFtYXpvblMzU3RvcmU7XG4iLCJpbXBvcnQge1VwbG9hZEZTfSBmcm9tICdtZXRlb3IvamFsaWs6dWZzJztcbmltcG9ydCBnY1N0b3JhZ2UgZnJvbSAnQGdvb2dsZS1jbG91ZC9zdG9yYWdlJztcblxuLyoqXG4gKiBHb29nbGVTdG9yYWdlIHN0b3JlXG4gKiBAcGFyYW0gb3B0aW9uc1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBHb29nbGVTdG9yYWdlU3RvcmUgZXh0ZW5kcyBVcGxvYWRGUy5TdG9yZSB7XG5cblx0Y29uc3RydWN0b3Iob3B0aW9ucykge1xuXHRcdHN1cGVyKG9wdGlvbnMpO1xuXG5cdFx0Y29uc3QgZ2NzID0gZ2NTdG9yYWdlKG9wdGlvbnMuY29ubmVjdGlvbik7XG5cdFx0dGhpcy5idWNrZXQgPSBnY3MuYnVja2V0KG9wdGlvbnMuYnVja2V0KTtcblxuXHRcdG9wdGlvbnMuZ2V0UGF0aCA9IG9wdGlvbnMuZ2V0UGF0aCB8fCBmdW5jdGlvbihmaWxlKSB7XG5cdFx0XHRyZXR1cm4gZmlsZS5faWQ7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0UGF0aCA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRcdGlmIChmaWxlLkdvb2dsZVN0b3JhZ2UpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuR29vZ2xlU3RvcmFnZS5wYXRoO1xuXHRcdFx0fVxuXHRcdFx0Ly8gQ29tcGF0aWJpbGl0eVxuXHRcdFx0Ly8gVE9ETzogTWlncmF0aW9uXG5cdFx0XHRpZiAoZmlsZS5nb29nbGVDbG91ZFN0b3JhZ2UpIHtcblx0XHRcdFx0cmV0dXJuIGZpbGUuZ29vZ2xlQ2xvdWRTdG9yYWdlLnBhdGggKyBmaWxlLl9pZDtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRSZWRpcmVjdFVSTCA9IGZ1bmN0aW9uKGZpbGUsIGNhbGxiYWNrKSB7XG5cdFx0XHRjb25zdCBwYXJhbXMgPSB7XG5cdFx0XHRcdGFjdGlvbjogJ3JlYWQnLFxuXHRcdFx0XHRyZXNwb25zZURpc3Bvc2l0aW9uOiAnaW5saW5lJyxcblx0XHRcdFx0ZXhwaXJlczogRGF0ZS5ub3coKSt0aGlzLm9wdGlvbnMuVVJMRXhwaXJ5VGltZVNwYW4qMTAwMFxuXHRcdFx0fTtcblxuXHRcdFx0dGhpcy5idWNrZXQuZmlsZSh0aGlzLmdldFBhdGgoZmlsZSkpLmdldFNpZ25lZFVybChwYXJhbXMsIGNhbGxiYWNrKTtcblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogQ3JlYXRlcyB0aGUgZmlsZSBpbiB0aGUgY29sbGVjdGlvblxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIGNhbGxiYWNrXG5cdFx0ICogQHJldHVybiB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oZmlsZSwgY2FsbGJhY2spIHtcblx0XHRcdGNoZWNrKGZpbGUsIE9iamVjdCk7XG5cblx0XHRcdGlmIChmaWxlLl9pZCA9PSBudWxsKSB7XG5cdFx0XHRcdGZpbGUuX2lkID0gUmFuZG9tLmlkKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuR29vZ2xlU3RvcmFnZSA9IHtcblx0XHRcdFx0cGF0aDogdGhpcy5vcHRpb25zLmdldFBhdGgoZmlsZSlcblx0XHRcdH07XG5cblx0XHRcdGZpbGUuc3RvcmUgPSB0aGlzLm9wdGlvbnMubmFtZTsgLy8gYXNzaWduIHN0b3JlIHRvIGZpbGVcblx0XHRcdHJldHVybiB0aGlzLmdldENvbGxlY3Rpb24oKS5pbnNlcnQoZmlsZSwgY2FsbGJhY2spO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZW1vdmVzIHRoZSBmaWxlXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBjYWxsYmFja1xuXHRcdCAqL1xuXHRcdHRoaXMuZGVsZXRlID0gZnVuY3Rpb24oZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdFx0Y29uc3QgZmlsZSA9IHRoaXMuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XG5cdFx0XHR0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuZGVsZXRlKGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyLCBkYXRhKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHJlYWQgc3RyZWFtXG5cdFx0ICogQHBhcmFtIGZpbGVJZFxuXHRcdCAqIEBwYXJhbSBmaWxlXG5cdFx0ICogQHBhcmFtIG9wdGlvbnNcblx0XHQgKiBAcmV0dXJuIHsqfVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVJZCwgZmlsZSwgb3B0aW9ucyA9IHt9KSB7XG5cdFx0XHRjb25zdCBjb25maWcgPSB7fTtcblxuXHRcdFx0aWYgKG9wdGlvbnMuc3RhcnQgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25maWcuc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAob3B0aW9ucy5lbmQgIT0gbnVsbCkge1xuXHRcdFx0XHRjb25maWcuZW5kID0gb3B0aW9ucy5lbmQ7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0aGlzLmJ1Y2tldC5maWxlKHRoaXMuZ2V0UGF0aChmaWxlKSkuY3JlYXRlUmVhZFN0cmVhbShjb25maWcpO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHRoZSBmaWxlIHdyaXRlIHN0cmVhbVxuXHRcdCAqIEBwYXJhbSBmaWxlSWRcblx0XHQgKiBAcGFyYW0gZmlsZVxuXHRcdCAqIEBwYXJhbSBvcHRpb25zXG5cdFx0ICogQHJldHVybiB7Kn1cblx0XHQgKi9cblx0XHR0aGlzLmdldFdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZUlkLCBmaWxlLyosIG9wdGlvbnMqLykge1xuXHRcdFx0cmV0dXJuIHRoaXMuYnVja2V0LmZpbGUodGhpcy5nZXRQYXRoKGZpbGUpKS5jcmVhdGVXcml0ZVN0cmVhbSh7XG5cdFx0XHRcdGd6aXA6IGZhbHNlLFxuXHRcdFx0XHRtZXRhZGF0YToge1xuXHRcdFx0XHRcdGNvbnRlbnRUeXBlOiBmaWxlLnR5cGUsXG5cdFx0XHRcdFx0Y29udGVudERpc3Bvc2l0aW9uOiBgaW5saW5lOyBmaWxlbmFtZT0keyBmaWxlLm5hbWUgfWBcblx0XHRcdFx0XHQvLyBtZXRhZGF0YToge1xuXHRcdFx0XHRcdC8vIFx0Y3VzdG9tOiAnbWV0YWRhdGEnXG5cdFx0XHRcdFx0Ly8gfVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHR9XG59XG5cbi8vIEFkZCBzdG9yZSB0byBVRlMgbmFtZXNwYWNlXG5VcGxvYWRGUy5zdG9yZS5Hb29nbGVTdG9yYWdlID0gR29vZ2xlU3RvcmFnZVN0b3JlO1xuIl19
