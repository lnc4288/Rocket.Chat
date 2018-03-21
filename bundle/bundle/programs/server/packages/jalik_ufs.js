(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var _ = Package.underscore._;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var extension, options, path;

var require = meteorInstall({"node_modules":{"meteor":{"jalik:ufs":{"ufs.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs.js                                                                                     //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
const module1 = module;
module1.export({
  UploadFS: () => UploadFS
});

let _;

module1.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module1.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Mongo;
module1.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 2);
let MIME;
module1.watch(require("./ufs-mime"), {
  MIME(v) {
    MIME = v;
  }

}, 3);
let Random;
module1.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 4);
let Tokens;
module1.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 5);
let Config;
module1.watch(require("./ufs-config"), {
  Config(v) {
    Config = v;
  }

}, 6);
let Filter;
module1.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 7);
let Store;
module1.watch(require("./ufs-store"), {
  Store(v) {
    Store = v;
  }

}, 8);
let StorePermissions;
module1.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 9);
let Uploader;
module1.watch(require("./ufs-uploader"), {
  Uploader(v) {
    Uploader = v;
  }

}, 10);
let stores = {};
const UploadFS = {
  /**
   * Contains all stores
   */
  store: {},

  /**
   * Collection of tokens
   */
  tokens: Tokens,

  /**
   * Adds the "etag" attribute to files
   * @param where
   */
  addETagAttributeToFiles(where) {
    _.each(this.getStores(), store => {
      const files = store.getCollection(); // By default update only files with no path set

      files.find(where || {
        etag: null
      }, {
        fields: {
          _id: 1
        }
      }).forEach(file => {
        files.direct.update(file._id, {
          $set: {
            etag: this.generateEtag()
          }
        });
      });
    });
  },

  /**
   * Adds the MIME type for an extension
   * @param extension
   * @param mime
   */
  addMimeType(extension, mime) {
    MIME[extension.toLowerCase()] = mime;
  },

  /**
   * Adds the "path" attribute to files
   * @param where
   */
  addPathAttributeToFiles(where) {
    _.each(this.getStores(), store => {
      const files = store.getCollection(); // By default update only files with no path set

      files.find(where || {
        path: null
      }, {
        fields: {
          _id: 1
        }
      }).forEach(file => {
        files.direct.update(file._id, {
          $set: {
            path: store.getFileRelativeURL(file._id)
          }
        });
      });
    });
  },

  /**
   * Registers the store
   * @param store
   */
  addStore(store) {
    if (!(store instanceof Store)) {
      throw new TypeError(`ufs: store is not an instance of UploadFS.Store.`);
    }

    stores[store.getName()] = store;
  },

  /**
   * Generates a unique ETag
   * @return {string}
   */
  generateEtag() {
    return Random.id();
  },

  /**
   * Returns the MIME type of the extension
   * @param extension
   * @returns {*}
   */
  getMimeType(extension) {
    extension = extension.toLowerCase();
    return MIME[extension];
  },

  /**
   * Returns all MIME types
   */
  getMimeTypes() {
    return MIME;
  },

  /**
   * Returns the store by its name
   * @param name
   * @return {UploadFS.Store}
   */
  getStore(name) {
    return stores[name];
  },

  /**
   * Returns all stores
   * @return {object}
   */
  getStores() {
    return stores;
  },

  /**
   * Returns the temporary file path
   * @param fileId
   * @return {string}
   */
  getTempFilePath(fileId) {
    return `${this.config.tmpDir}/${fileId}`;
  },

  /**
   * Imports a file from a URL
   * @param url
   * @param file
   * @param store
   * @param callback
   */
  importFromURL(url, file, store, callback) {
    if (typeof store === 'string') {
      Meteor.call('ufsImportURL', url, file, store, callback);
    } else if (typeof store === 'object') {
      store.importFromURL(url, file, callback);
    }
  },

  /**
   * Returns file and data as ArrayBuffer for each files in the event
   * @deprecated
   * @param event
   * @param callback
   */
  readAsArrayBuffer(event, callback) {
    console.error('UploadFS.readAsArrayBuffer is deprecated, see https://github.com/jalik/jalik-ufs#uploading-from-a-file');
  },

  /**
   * Opens a dialog to select a single file
   * @param callback
   */
  selectFile(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;

    input.onchange = ev => {
      let files = ev.target.files;
      callback.call(UploadFS, files[0]);
    }; // Fix for iOS/Safari


    const div = document.createElement('div');
    div.className = 'ufs-file-selector';
    div.style = 'display:none; height:0; width:0; overflow: hidden;';
    div.appendChild(input);
    document.body.appendChild(div); // Trigger file selection

    input.click();
  },

  /**
   * Opens a dialog to select multiple files
   * @param callback
   */
  selectFiles(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = ev => {
      const files = ev.target.files;

      for (let i = 0; i < files.length; i += 1) {
        callback.call(UploadFS, files[i]);
      }
    }; // Fix for iOS/Safari


    const div = document.createElement('div');
    div.className = 'ufs-file-selector';
    div.style = 'display:none; height:0; width:0; overflow: hidden;';
    div.appendChild(input);
    document.body.appendChild(div); // Trigger file selection

    input.click();
  }

};

if (Meteor.isClient) {
  require('./ufs-template-helpers');
}

if (Meteor.isServer) {
  require('./ufs-methods');

  require('./ufs-server');
}
/**
 * UploadFS Configuration
 * @type {Config}
 */


UploadFS.config = new Config(); // Add classes to global namespace

UploadFS.Config = Config;
UploadFS.Filter = Filter;
UploadFS.Store = Store;
UploadFS.StorePermissions = StorePermissions;
UploadFS.Uploader = Uploader;

if (Meteor.isServer) {
  // Expose the module globally
  if (typeof global !== 'undefined') {
    global['UploadFS'] = UploadFS;
  }
} else if (Meteor.isClient) {
  // Expose the module globally
  if (typeof window !== 'undefined') {
    window.UploadFS = UploadFS;
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-config.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-config.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Config: () => Config
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let StorePermissions;
module.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 2);

class Config {
  constructor(options) {
    // Default options
    options = _.extend({
      defaultStorePermissions: null,
      https: false,
      simulateReadDelay: 0,
      simulateUploadSpeed: 0,
      simulateWriteDelay: 0,
      storesPath: 'ufs',
      tmpDir: '/tmp/ufs',
      tmpDirPermissions: '0700'
    }, options); // Check options

    if (options.defaultStorePermissions && !(options.defaultStorePermissions instanceof StorePermissions)) {
      throw new TypeError('Config: defaultStorePermissions is not an instance of StorePermissions');
    }

    if (typeof options.https !== 'boolean') {
      throw new TypeError('Config: https is not a function');
    }

    if (typeof options.simulateReadDelay !== 'number') {
      throw new TypeError('Config: simulateReadDelay is not a number');
    }

    if (typeof options.simulateUploadSpeed !== 'number') {
      throw new TypeError('Config: simulateUploadSpeed is not a number');
    }

    if (typeof options.simulateWriteDelay !== 'number') {
      throw new TypeError('Config: simulateWriteDelay is not a number');
    }

    if (typeof options.storesPath !== 'string') {
      throw new TypeError('Config: storesPath is not a string');
    }

    if (typeof options.tmpDir !== 'string') {
      throw new TypeError('Config: tmpDir is not a string');
    }

    if (typeof options.tmpDirPermissions !== 'string') {
      throw new TypeError('Config: tmpDirPermissions is not a string');
    }
    /**
     * Default store permissions
     * @type {UploadFS.StorePermissions}
     */


    this.defaultStorePermissions = options.defaultStorePermissions;
    /**
     * Use or not secured protocol in URLS
     * @type {boolean}
     */

    this.https = options.https;
    /**
     * The simulation read delay
     * @type {Number}
     */

    this.simulateReadDelay = parseInt(options.simulateReadDelay);
    /**
     * The simulation upload speed
     * @type {Number}
     */

    this.simulateUploadSpeed = parseInt(options.simulateUploadSpeed);
    /**
     * The simulation write delay
     * @type {Number}
     */

    this.simulateWriteDelay = parseInt(options.simulateWriteDelay);
    /**
     * The URL root path of stores
     * @type {string}
     */

    this.storesPath = options.storesPath;
    /**
     * The temporary directory of uploading files
     * @type {string}
     */

    this.tmpDir = options.tmpDir;
    /**
     * The permissions of the temporary directory
     * @type {string}
     */

    this.tmpDirPermissions = options.tmpDirPermissions;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-filter.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-filter.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Filter: () => Filter
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);

class Filter {
  constructor(options) {
    const self = this; // Default options

    options = _.extend({
      contentTypes: null,
      extensions: null,
      minSize: 1,
      maxSize: 0,
      onCheck: this.onCheck
    }, options); // Check options

    if (options.contentTypes && !(options.contentTypes instanceof Array)) {
      throw new TypeError("Filter: contentTypes is not an Array");
    }

    if (options.extensions && !(options.extensions instanceof Array)) {
      throw new TypeError("Filter: extensions is not an Array");
    }

    if (typeof options.minSize !== "number") {
      throw new TypeError("Filter: minSize is not a number");
    }

    if (typeof options.maxSize !== "number") {
      throw new TypeError("Filter: maxSize is not a number");
    }

    if (options.onCheck && typeof options.onCheck !== "function") {
      throw new TypeError("Filter: onCheck is not a function");
    } // Public attributes


    self.options = options;

    _.each(['onCheck'], method => {
      if (typeof options[method] === 'function') {
        self[method] = options[method];
      }
    });
  }
  /**
   * Checks the file
   * @param file
   */


  check(file) {
    if (typeof file !== "object" || !file) {
      throw new Meteor.Error('invalid-file', "File is not valid");
    } // Check size


    if (file.size <= 0 || file.size < this.getMinSize()) {
      throw new Meteor.Error('file-too-small', `File size is too small (min = ${this.getMinSize()})`);
    }

    if (this.getMaxSize() > 0 && file.size > this.getMaxSize()) {
      throw new Meteor.Error('file-too-large', `File size is too large (max = ${this.getMaxSize()})`);
    } // Check extension


    if (this.getExtensions() && !_.contains(this.getExtensions(), file.extension)) {
      throw new Meteor.Error('invalid-file-extension', `File extension "${file.extension}" is not accepted`);
    } // Check content type


    if (this.getContentTypes() && !this.isContentTypeInList(file.type, this.getContentTypes())) {
      throw new Meteor.Error('invalid-file-type', `File type "${file.type}" is not accepted`);
    } // Apply custom check


    if (typeof this.onCheck === 'function' && !this.onCheck(file)) {
      throw new Meteor.Error('invalid-file', "File does not match filter");
    }
  }
  /**
   * Returns the allowed content types
   * @return {Array}
   */


  getContentTypes() {
    return this.options.contentTypes;
  }
  /**
   * Returns the allowed extensions
   * @return {Array}
   */


  getExtensions() {
    return this.options.extensions;
  }
  /**
   * Returns the maximum file size
   * @return {Number}
   */


  getMaxSize() {
    return this.options.maxSize;
  }
  /**
   * Returns the minimum file size
   * @return {Number}
   */


  getMinSize() {
    return this.options.minSize;
  }
  /**
   * Checks if content type is in the given list
   * @param type
   * @param list
   * @return {boolean}
   */


  isContentTypeInList(type, list) {
    if (typeof type === 'string' && list instanceof Array) {
      if (_.contains(list, type)) {
        return true;
      } else {
        let wildCardGlob = '/*';

        let wildcards = _.filter(list, item => {
          return item.indexOf(wildCardGlob) > 0;
        });

        if (_.contains(wildcards, type.replace(/(\/.*)$/, wildCardGlob))) {
          return true;
        }
      }
    }

    return false;
  }
  /**
   * Checks if the file matches filter
   * @param file
   * @return {boolean}
   */


  isValid(file) {
    let result = true;

    try {
      this.check(file);
    } catch (err) {
      result = false;
    }

    return result;
  }
  /**
   * Executes custom checks
   * @param file
   * @return {boolean}
   */


  onCheck(file) {
    return true;
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-methods.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-methods.js                                                                             //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 3);
let Filter;
module.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 4);
let Tokens;
module.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 5);

const fs = Npm.require('fs');

const http = Npm.require('http');

const https = Npm.require('https');

const Future = Npm.require('fibers/future');

if (Meteor.isServer) {
  Meteor.methods({
    /**
     * Completes the file transfer
     * @param fileId
     * @param storeName
     * @param token
     */
    ufsComplete(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Get store

      let store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      let fut = new Future();
      let tmpFile = UploadFS.getTempFilePath(fileId);

      const removeTempFile = function () {
        fs.unlink(tmpFile, function (err) {
          err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
        });
      };

      try {
        // todo check if temp file exists
        // Get file
        let file = store.getCollection().findOne({
          _id: fileId
        }); // Validate file before moving to the store

        store.validate(file); // Get the temp file

        let rs = fs.createReadStream(tmpFile, {
          flags: 'r',
          encoding: null,
          autoClose: true
        }); // Clean upload if error occurs

        rs.on('error', Meteor.bindEnvironment(function (err) {
          console.error(err);
          store.getCollection().remove({
            _id: fileId
          });
          fut.throw(err);
        })); // Save file in the store

        store.write(rs, fileId, Meteor.bindEnvironment(function (err, file) {
          removeTempFile();

          if (err) {
            fut.throw(err);
          } else {
            // File has been fully uploaded
            // so we don't need to keep the token anymore.
            // Also this ensure that the file cannot be modified with extra chunks later.
            Tokens.remove({
              fileId: fileId
            });
            fut.return(file);
          }
        }));
      } catch (err) {
        // If write failed, remove the file
        store.getCollection().remove({
          _id: fileId
        }); // removeTempFile();

        fut.throw(err);
      }

      return fut.wait();
    },

    /**
     * Creates the file and returns the file upload token
     * @param file
     * @return {{fileId: string, token: *, url: *}}
     */
    ufsCreate(file) {
      check(file, Object);

      if (typeof file.name !== 'string' || !file.name.length) {
        throw new Meteor.Error('invalid-file-name', "file name is not valid");
      }

      if (typeof file.store !== 'string' || !file.store.length) {
        throw new Meteor.Error('invalid-store', "store is not valid");
      } // Get store


      let store = UploadFS.getStore(file.store);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Set default info


      file.complete = false;
      file.uploading = false;
      file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase(); // Assign file MIME type based on the extension

      if (file.extension && !file.type) {
        file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
      }

      file.progress = 0;
      file.size = parseInt(file.size) || 0;
      file.userId = file.userId || this.userId; // Check if the file matches store filter

      let filter = store.getFilter();

      if (filter instanceof Filter) {
        filter.check(file);
      } // Create the file


      let fileId = store.create(file);
      let token = store.createToken(fileId);
      let uploadUrl = store.getURL(`${fileId}?token=${token}`);
      return {
        fileId: fileId,
        token: token,
        url: uploadUrl
      };
    },

    /**
     * Deletes a file
     * @param fileId
     * @param storeName
     * @param token
     * @returns {*}
     */
    ufsDelete(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Check store

      let store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Ignore files that does not exist


      if (store.getCollection().find({
        _id: fileId
      }).count() === 0) {
        return 1;
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      return store.getCollection().remove({
        _id: fileId
      });
    },

    /**
     * Imports a file from the URL
     * @param url
     * @param file
     * @param storeName
     * @return {*}
     */
    ufsImportURL(url, file, storeName) {
      check(url, String);
      check(file, Object);
      check(storeName, String); // Check URL

      if (typeof url !== 'string' || url.length <= 0) {
        throw new Meteor.Error('invalid-url', "The url is not valid");
      } // Check file


      if (typeof file !== 'object' || file === null) {
        throw new Meteor.Error('invalid-file', "The file is not valid");
      } // Check store


      const store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', 'The store does not exist');
      } // Extract file info


      if (!file.name) {
        file.name = url.replace(/\?.*$/, '').split('/').pop();
      }

      if (file.name && !file.extension) {
        file.extension = file.name && file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2).toLowerCase();
      }

      if (file.extension && !file.type) {
        // Assign file MIME type based on the extension
        file.type = UploadFS.getMimeType(file.extension) || 'application/octet-stream';
      } // Check if file is valid


      if (store.getFilter() instanceof Filter) {
        store.getFilter().check(file);
      }

      if (file.originalUrl) {
        console.warn(`ufs: The "originalUrl" attribute is automatically set when importing a file from a URL`);
      } // Add original URL


      file.originalUrl = url; // Create the file

      file.complete = false;
      file.uploading = true;
      file.progress = 0;
      file._id = store.create(file);
      let fut = new Future();
      let proto; // Detect protocol to use

      if (/http:\/\//i.test(url)) {
        proto = http;
      } else if (/https:\/\//i.test(url)) {
        proto = https;
      }

      this.unblock(); // Download file

      proto.get(url, Meteor.bindEnvironment(function (res) {
        // Save the file in the store
        store.write(res, file._id, function (err, file) {
          if (err) {
            fut.throw(err);
          } else {
            fut.return(file);
          }
        });
      })).on('error', function (err) {
        fut.throw(err);
      });
      return fut.wait();
    },

    /**
     * Marks the file uploading as stopped
     * @param fileId
     * @param storeName
     * @param token
     * @returns {*}
     */
    ufsStop(fileId, storeName, token) {
      check(fileId, String);
      check(storeName, String);
      check(token, String); // Check store

      const store = UploadFS.getStore(storeName);

      if (!store) {
        throw new Meteor.Error('invalid-store', "Store not found");
      } // Check file


      const file = store.getCollection().find({
        _id: fileId
      }, {
        fields: {
          userId: 1
        }
      });

      if (!file) {
        throw new Meteor.Error('invalid-file', "File not found");
      } // Check token


      if (!store.checkToken(token, fileId)) {
        throw new Meteor.Error('invalid-token', "Token is not valid");
      }

      return store.getCollection().update({
        _id: fileId
      }, {
        $set: {
          uploading: false
        }
      });
    }

  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-mime.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-mime.js                                                                                //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  MIME: () => MIME
});
const MIME = {
  // application
  '7z': 'application/x-7z-compressed',
  'arc': 'application/octet-stream',
  'ai': 'application/postscript',
  'bin': 'application/octet-stream',
  'bz': 'application/x-bzip',
  'bz2': 'application/x-bzip2',
  'eps': 'application/postscript',
  'exe': 'application/octet-stream',
  'gz': 'application/x-gzip',
  'gzip': 'application/x-gzip',
  'js': 'application/javascript',
  'json': 'application/json',
  'ogx': 'application/ogg',
  'pdf': 'application/pdf',
  'ps': 'application/postscript',
  'psd': 'application/octet-stream',
  'rar': 'application/x-rar-compressed',
  'rev': 'application/x-rar-compressed',
  'swf': 'application/x-shockwave-flash',
  'tar': 'application/x-tar',
  'xhtml': 'application/xhtml+xml',
  'xml': 'application/xml',
  'zip': 'application/zip',
  // audio
  'aif': 'audio/aiff',
  'aifc': 'audio/aiff',
  'aiff': 'audio/aiff',
  'au': 'audio/basic',
  'flac': 'audio/flac',
  'midi': 'audio/midi',
  'mp2': 'audio/mpeg',
  'mp3': 'audio/mpeg',
  'mpa': 'audio/mpeg',
  'oga': 'audio/ogg',
  'ogg': 'audio/ogg',
  'opus': 'audio/ogg',
  'ra': 'audio/vnd.rn-realaudio',
  'spx': 'audio/ogg',
  'wav': 'audio/x-wav',
  'weba': 'audio/webm',
  'wma': 'audio/x-ms-wma',
  // image
  'avs': 'image/avs-video',
  'bmp': 'image/x-windows-bmp',
  'gif': 'image/gif',
  'ico': 'image/vnd.microsoft.icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpg',
  'mjpg': 'image/x-motion-jpeg',
  'pic': 'image/pic',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  // text
  'css': 'text/css',
  'csv': 'text/csv',
  'html': 'text/html',
  'txt': 'text/plain',
  // video
  'avi': 'video/avi',
  'dv': 'video/x-dv',
  'flv': 'video/x-flv',
  'mov': 'video/quicktime',
  'mp4': 'video/mp4',
  'mpeg': 'video/mpeg',
  'mpg': 'video/mpg',
  'ogv': 'video/ogg',
  'vdo': 'video/vdo',
  'webm': 'video/webm',
  'wmv': 'video/x-ms-wmv',
  // specific to vendors
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'odb': 'application/vnd.oasis.opendocument.database',
  'odc': 'application/vnd.oasis.opendocument.chart',
  'odf': 'application/vnd.oasis.opendocument.formula',
  'odg': 'application/vnd.oasis.opendocument.graphics',
  'odi': 'application/vnd.oasis.opendocument.image',
  'odm': 'application/vnd.oasis.opendocument.text-master',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odt': 'application/vnd.oasis.opendocument.text',
  'otg': 'application/vnd.oasis.opendocument.graphics-template',
  'otp': 'application/vnd.oasis.opendocument.presentation-template',
  'ots': 'application/vnd.oasis.opendocument.spreadsheet-template',
  'ott': 'application/vnd.oasis.opendocument.text-template',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-server.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-server.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let WebApp;
module.watch(require("meteor/webapp"), {
  WebApp(v) {
    WebApp = v;
  }

}, 2);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 3);

if (Meteor.isServer) {
  const domain = Npm.require('domain');

  const fs = Npm.require('fs');

  const http = Npm.require('http');

  const https = Npm.require('https');

  const mkdirp = Npm.require('mkdirp');

  const stream = Npm.require('stream');

  const URL = Npm.require('url');

  const zlib = Npm.require('zlib');

  Meteor.startup(() => {
    let path = UploadFS.config.tmpDir;
    let mode = UploadFS.config.tmpDirPermissions;
    fs.stat(path, err => {
      if (err) {
        // Create the temp directory
        mkdirp(path, {
          mode: mode
        }, err => {
          if (err) {
            console.error(`ufs: cannot create temp directory at "${path}" (${err.message})`);
          } else {
            console.log(`ufs: temp directory created at "${path}"`);
          }
        });
      } else {
        // Set directory permissions
        fs.chmod(path, mode, err => {
          err && console.error(`ufs: cannot set temp directory permissions ${mode} (${err.message})`);
        });
      }
    });
  }); // Create domain to handle errors
  // and possibly avoid server crashes.

  let d = domain.create();
  d.on('error', err => {
    console.error('ufs: ' + err.message);
  }); // Listen HTTP requests to serve files

  WebApp.connectHandlers.use((req, res, next) => {
    // Quick check to see if request should be catch
    if (req.url.indexOf(UploadFS.config.storesPath) === -1) {
      next();
      return;
    } // Remove store path


    let parsedUrl = URL.parse(req.url);
    let path = parsedUrl.pathname.substr(UploadFS.config.storesPath.length + 1);

    let allowCORS = () => {
      // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader("Access-Control-Allow-Methods", "POST");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    };

    if (req.method === "OPTIONS") {
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
      let match = regExp.exec(path); // Request is not valid

      if (match === null) {
        res.writeHead(400);
        res.end();
        return;
      } // Get store


      let store = UploadFS.getStore(match[1]);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      } // If a store is found, go ahead and allow the origin


      allowCORS();
      next();
    } else if (req.method === 'POST') {
      // Get store
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)$');
      let match = regExp.exec(path); // Request is not valid

      if (match === null) {
        res.writeHead(400);
        res.end();
        return;
      } // Get store


      let store = UploadFS.getStore(match[1]);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      } // If a store is found, go ahead and allow the origin


      allowCORS(); // Get file

      let fileId = match[2];

      if (store.getCollection().find({
        _id: fileId
      }).count() === 0) {
        res.writeHead(404);
        res.end();
        return;
      } // Check upload token


      if (!store.checkToken(req.query.token, fileId)) {
        res.writeHead(403);
        res.end();
        return;
      }

      let tmpFile = UploadFS.getTempFilePath(fileId);
      let ws = fs.createWriteStream(tmpFile, {
        flags: 'a'
      });
      let fields = {
        uploading: true
      };
      let progress = parseFloat(req.query.progress);

      if (!isNaN(progress) && progress > 0) {
        fields.progress = Math.min(progress, 1);
      }

      req.on('data', chunk => {
        ws.write(chunk);
      });
      req.on('error', err => {
        res.writeHead(500);
        res.end();
      });
      req.on('end', Meteor.bindEnvironment(() => {
        // Update completed state without triggering hooks
        store.getCollection().direct.update({
          _id: fileId
        }, {
          $set: fields
        });
        ws.end();
      }));
      ws.on('error', err => {
        console.error(`ufs: cannot write chunk of file "${fileId}" (${err.message})`);
        fs.unlink(tmpFile, err => {
          err && console.error(`ufs: cannot delete temp file "${tmpFile}" (${err.message})`);
        });
        res.writeHead(500);
        res.end();
      });
      ws.on('finish', () => {
        res.writeHead(204, {
          "Content-Type": 'text/plain'
        });
        res.end();
      });
    } else if (req.method == 'GET') {
      // Get store, file Id and file name
      let regExp = new RegExp('^\/([^\/\?]+)\/([^\/\?]+)(?:\/([^\/\?]+))?$');
      let match = regExp.exec(path); // Avoid 504 Gateway timeout error
      // if file is not handled by UploadFS.

      if (match === null) {
        next();
        return;
      } // Get store


      const storeName = match[1];
      const store = UploadFS.getStore(storeName);

      if (!store) {
        res.writeHead(404);
        res.end();
        return;
      }

      if (store.onRead !== null && store.onRead !== undefined && typeof store.onRead !== 'function') {
        console.error(`ufs: Store.onRead is not a function in store "${storeName}"`);
        res.writeHead(500);
        res.end();
        return;
      } // Remove file extension from file Id


      let index = match[2].indexOf('.');
      let fileId = index !== -1 ? match[2].substr(0, index) : match[2]; // Get file from database

      const file = store.getCollection().findOne({
        _id: fileId
      });

      if (!file) {
        res.writeHead(404);
        res.end();
        return;
      } // Simulate read speed


      if (UploadFS.config.simulateReadDelay) {
        Meteor._sleepForMs(UploadFS.config.simulateReadDelay);
      }

      d.run(() => {
        // Check if the file can be accessed
        if (store.onRead.call(store, fileId, file, req, res) !== false) {
          let options = {};
          let status = 200; // Prepare response headers

          let headers = {
            'Content-Type': file.type,
            'Content-Length': file.size
          }; // Add ETag header

          if (typeof file.etag === 'string') {
            headers['ETag'] = file.etag;
          } // Add Last-Modified header


          if (file.modifiedAt instanceof Date) {
            headers['Last-Modified'] = file.modifiedAt.toUTCString();
          } else if (file.uploadedAt instanceof Date) {
            headers['Last-Modified'] = file.uploadedAt.toUTCString();
          } // Parse request headers


          if (typeof req.headers === 'object') {
            // Compare ETag
            if (req.headers['if-none-match']) {
              if (file.etag === req.headers['if-none-match']) {
                res.writeHead(304); // Not Modified

                res.end();
                return;
              }
            } // Compare file modification date


            if (req.headers['if-modified-since']) {
              const modifiedSince = new Date(req.headers['if-modified-since']);

              if (file.modifiedAt instanceof Date && file.modifiedAt > modifiedSince || file.uploadedAt instanceof Date && file.uploadedAt > modifiedSince) {
                res.writeHead(304); // Not Modified

                res.end();
                return;
              }
            } // Send data in range


            if (typeof req.headers.range === 'string') {
              let range = req.headers.range; // Range is not valid

              if (!range) {
                res.writeHead(416);
                res.end();
                return;
              }

              let positions = range.replace(/bytes=/, '').split('-');
              let start = parseInt(positions[0], 10);
              let total = file.size;
              let end = positions[1] ? parseInt(positions[1], 10) : total - 1; // Update headers

              headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
              headers['Accept-Ranges'] = `bytes`;
              headers['Content-Length'] = end - start + 1;
              status = 206; // partial content

              options.start = start;
              options.end = end;
            }
          } // Open the file stream


          let rs = store.getReadStream(fileId, file, options);
          let ws = new stream.PassThrough();
          rs.on('error', Meteor.bindEnvironment(err => {
            store.onReadError.call(store, err, fileId, file);
            res.end();
          }));
          ws.on('error', Meteor.bindEnvironment(err => {
            store.onReadError.call(store, err, fileId, file);
            res.end();
          }));
          ws.on('close', () => {
            // Close output stream at the end
            ws.emit('end');
          }); // Transform stream

          store.transformRead(rs, ws, fileId, file, req, headers); // Parse request headers

          if (typeof req.headers === 'object') {
            // Compress data using if needed (ignore audio/video as they are already compressed)
            if (typeof req.headers['accept-encoding'] === 'string' && !/^(audio|video)/.test(file.type)) {
              let accept = req.headers['accept-encoding']; // Compress with gzip

              if (accept.match(/\bgzip\b/)) {
                headers['Content-Encoding'] = 'gzip';
                delete headers['Content-Length'];
                res.writeHead(status, headers);
                ws.pipe(zlib.createGzip()).pipe(res);
                return;
              } // Compress with deflate
              else if (accept.match(/\bdeflate\b/)) {
                  headers['Content-Encoding'] = 'deflate';
                  delete headers['Content-Length'];
                  res.writeHead(status, headers);
                  ws.pipe(zlib.createDeflate()).pipe(res);
                  return;
                }
            }
          } // Send raw data


          if (!headers['Content-Encoding']) {
            res.writeHead(status, headers);
            ws.pipe(res);
          }
        } else {
          res.end();
        }
      });
    } else {
      next();
    }
  });
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-store-permissions.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-store-permissions.js                                                                   //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  StorePermissions: () => StorePermissions
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);

class StorePermissions {
  constructor(options) {
    // Default options
    options = _.extend({
      insert: null,
      remove: null,
      update: null
    }, options); // Check options

    if (options.insert && typeof options.insert !== 'function') {
      throw new TypeError("StorePermissions: insert is not a function");
    }

    if (options.remove && typeof options.remove !== 'function') {
      throw new TypeError("StorePermissions: remove is not a function");
    }

    if (options.update && typeof options.update !== 'function') {
      throw new TypeError("StorePermissions: update is not a function");
    } // Public attributes


    this.actions = {
      insert: options.insert,
      remove: options.remove,
      update: options.update
    };
  }
  /**
   * Checks the permission for the action
   * @param action
   * @param userId
   * @param file
   * @param fields
   * @param modifiers
   * @return {*}
   */


  check(action, userId, file, fields, modifiers) {
    if (typeof this.actions[action] === 'function') {
      return this.actions[action](userId, file, fields, modifiers);
    }

    return true; // by default allow all
  }
  /**
   * Checks the insert permission
   * @param userId
   * @param file
   * @returns {*}
   */


  checkInsert(userId, file) {
    return this.check('insert', userId, file);
  }
  /**
   * Checks the remove permission
   * @param userId
   * @param file
   * @returns {*}
   */


  checkRemove(userId, file) {
    return this.check('remove', userId, file);
  }
  /**
   * Checks the update permission
   * @param userId
   * @param file
   * @param fields
   * @param modifiers
   * @returns {*}
   */


  checkUpdate(userId, file, fields, modifiers) {
    return this.check('update', userId, file, fields, modifiers);
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-store.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-store.js                                                                               //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Store: () => Store
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let check;
module.watch(require("meteor/check"), {
  check(v) {
    check = v;
  }

}, 1);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 2);
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 3);
let UploadFS;
module.watch(require("./ufs"), {
  UploadFS(v) {
    UploadFS = v;
  }

}, 4);
let Filter;
module.watch(require("./ufs-filter"), {
  Filter(v) {
    Filter = v;
  }

}, 5);
let StorePermissions;
module.watch(require("./ufs-store-permissions"), {
  StorePermissions(v) {
    StorePermissions = v;
  }

}, 6);
let Tokens;
module.watch(require("./ufs-tokens"), {
  Tokens(v) {
    Tokens = v;
  }

}, 7);

class Store {
  constructor(options) {
    let self = this; // Default options

    options = _.extend({
      collection: null,
      filter: null,
      name: null,
      onCopyError: this.onCopyError,
      onFinishUpload: this.onFinishUpload,
      onRead: this.onRead,
      onReadError: this.onReadError,
      onValidate: this.onValidate,
      onWriteError: this.onWriteError,
      permissions: null,
      transformRead: null,
      transformWrite: null
    }, options); // Check options

    if (!(options.collection instanceof Mongo.Collection)) {
      throw new TypeError('Store: collection is not a Mongo.Collection');
    }

    if (options.filter && !(options.filter instanceof Filter)) {
      throw new TypeError('Store: filter is not a UploadFS.Filter');
    }

    if (typeof options.name !== 'string') {
      throw new TypeError('Store: name is not a string');
    }

    if (UploadFS.getStore(options.name)) {
      throw new TypeError('Store: name already exists');
    }

    if (options.onCopyError && typeof options.onCopyError !== 'function') {
      throw new TypeError('Store: onCopyError is not a function');
    }

    if (options.onFinishUpload && typeof options.onFinishUpload !== 'function') {
      throw new TypeError('Store: onFinishUpload is not a function');
    }

    if (options.onRead && typeof options.onRead !== 'function') {
      throw new TypeError('Store: onRead is not a function');
    }

    if (options.onReadError && typeof options.onReadError !== 'function') {
      throw new TypeError('Store: onReadError is not a function');
    }

    if (options.onWriteError && typeof options.onWriteError !== 'function') {
      throw new TypeError('Store: onWriteError is not a function');
    }

    if (options.permissions && !(options.permissions instanceof StorePermissions)) {
      throw new TypeError('Store: permissions is not a UploadFS.StorePermissions');
    }

    if (options.transformRead && typeof options.transformRead !== 'function') {
      throw new TypeError('Store: transformRead is not a function');
    }

    if (options.transformWrite && typeof options.transformWrite !== 'function') {
      throw new TypeError('Store: transformWrite is not a function');
    }

    if (options.onValidate && typeof options.onValidate !== 'function') {
      throw new TypeError('Store: onValidate is not a function');
    } // Public attributes


    self.options = options;
    self.permissions = options.permissions;

    _.each(['onCopyError', 'onFinishUpload', 'onRead', 'onReadError', 'onWriteError', 'onValidate'], method => {
      if (typeof options[method] === 'function') {
        self[method] = options[method];
      }
    }); // Add the store to the list


    UploadFS.addStore(self); // Set default permissions

    if (!(self.permissions instanceof StorePermissions)) {
      // Uses custom default permissions or UFS default permissions
      if (UploadFS.config.defaultStorePermissions instanceof StorePermissions) {
        self.permissions = UploadFS.config.defaultStorePermissions;
      } else {
        self.permissions = new StorePermissions();
        console.warn(`ufs: permissions are not defined for store "${options.name}"`);
      }
    }

    if (Meteor.isServer) {
      /**
       * Checks token validity
       * @param token
       * @param fileId
       * @returns {boolean}
       */
      self.checkToken = function (token, fileId) {
        check(token, String);
        check(fileId, String);
        return Tokens.find({
          value: token,
          fileId: fileId
        }).count() === 1;
      };
      /**
       * Copies the file to a store
       * @param fileId
       * @param store
       * @param callback
       */


      self.copy = function (fileId, store, callback) {
        check(fileId, String);

        if (!(store instanceof Store)) {
          throw new TypeError('store is not an instance of UploadFS.Store');
        } // Get original file


        let file = self.getCollection().findOne({
          _id: fileId
        });

        if (!file) {
          throw new Meteor.Error('file-not-found', 'File not found');
        } // Silently ignore the file if it does not match filter


        const filter = store.getFilter();

        if (filter instanceof Filter && !filter.isValid(file)) {
          return;
        } // Prepare copy


        let copy = _.omit(file, '_id', 'url');

        copy.originalStore = self.getName();
        copy.originalId = fileId; // Create the copy

        let copyId = store.create(copy); // Get original stream

        let rs = self.getReadStream(fileId, file); // Catch errors to avoid app crashing

        rs.on('error', Meteor.bindEnvironment(function (err) {
          callback.call(self, err, null);
        })); // Copy file data

        store.write(rs, copyId, Meteor.bindEnvironment(function (err) {
          if (err) {
            self.getCollection().remove({
              _id: copyId
            });
            self.onCopyError.call(self, err, fileId, file);
          }

          if (typeof callback === 'function') {
            callback.call(self, err, copyId, copy, store);
          }
        }));
      };
      /**
       * Creates the file in the collection
       * @param file
       * @param callback
       * @return {string}
       */


      self.create = function (file, callback) {
        check(file, Object);
        file.store = self.options.name; // assign store to file

        return self.getCollection().insert(file, callback);
      };
      /**
       * Creates a token for the file (only needed for client side upload)
       * @param fileId
       * @returns {*}
       */


      self.createToken = function (fileId) {
        let token = self.generateToken(); // Check if token exists

        if (Tokens.find({
          fileId: fileId
        }).count()) {
          Tokens.update({
            fileId: fileId
          }, {
            $set: {
              createdAt: new Date(),
              value: token
            }
          });
        } else {
          Tokens.insert({
            createdAt: new Date(),
            fileId: fileId,
            value: token
          });
        }

        return token;
      };
      /**
       * Writes the file to the store
       * @param rs
       * @param fileId
       * @param callback
       */


      self.write = function (rs, fileId, callback) {
        let file = self.getCollection().findOne({
          _id: fileId
        });
        let ws = self.getWriteStream(fileId, file);
        let errorHandler = Meteor.bindEnvironment(function (err) {
          self.getCollection().remove({
            _id: fileId
          });
          self.onWriteError.call(self, err, fileId, file);
          callback.call(self, err);
        });
        ws.on('error', errorHandler);
        ws.on('finish', Meteor.bindEnvironment(function () {
          let size = 0;
          let readStream = self.getReadStream(fileId, file);
          readStream.on('error', Meteor.bindEnvironment(function (error) {
            callback.call(self, error, null);
          }));
          readStream.on('data', Meteor.bindEnvironment(function (data) {
            size += data.length;
          }));
          readStream.on('end', Meteor.bindEnvironment(function () {
            // Set file attribute
            file.complete = true;
            file.etag = UploadFS.generateEtag();
            file.path = self.getFileRelativeURL(fileId);
            file.progress = 1;
            file.size = size;
            file.token = self.generateToken();
            file.uploading = false;
            file.uploadedAt = new Date();
            file.url = self.getFileURL(fileId); // Sets the file URL when file transfer is complete,
            // this way, the image will loads entirely.

            self.getCollection().direct.update({
              _id: fileId
            }, {
              $set: {
                complete: file.complete,
                etag: file.etag,
                path: file.path,
                progress: file.progress,
                size: file.size,
                token: file.token,
                uploading: file.uploading,
                uploadedAt: file.uploadedAt,
                url: file.url
              }
            }); // Return file info

            callback.call(self, null, file); // Execute callback

            if (typeof self.onFinishUpload == 'function') {
              self.onFinishUpload.call(self, file);
            } // Simulate write speed


            if (UploadFS.config.simulateWriteDelay) {
              Meteor._sleepForMs(UploadFS.config.simulateWriteDelay);
            } // Copy file to other stores


            if (self.options.copyTo instanceof Array) {
              for (let i = 0; i < self.options.copyTo.length; i += 1) {
                let store = self.options.copyTo[i];

                if (!store.getFilter() || store.getFilter().isValid(file)) {
                  self.copy(fileId, store);
                }
              }
            }
          }));
        })); // Execute transformation

        self.transformWrite(rs, ws, fileId, file);
      };
    }

    if (Meteor.isServer) {
      const fs = Npm.require('fs');

      const collection = self.getCollection(); // Code executed after removing file

      collection.after.remove(function (userId, file) {
        // Remove associated tokens
        Tokens.remove({
          fileId: file._id
        });

        if (self.options.copyTo instanceof Array) {
          for (let i = 0; i < self.options.copyTo.length; i += 1) {
            // Remove copies in stores
            self.options.copyTo[i].getCollection().remove({
              originalId: file._id
            });
          }
        }
      }); // Code executed before inserting file

      collection.before.insert(function (userId, file) {
        if (!self.permissions.checkInsert(userId, file)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        }
      }); // Code executed before updating file

      collection.before.update(function (userId, file, fields, modifiers) {
        if (!self.permissions.checkUpdate(userId, file, fields, modifiers)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        }
      }); // Code executed before removing file

      collection.before.remove(function (userId, file) {
        if (!self.permissions.checkRemove(userId, file)) {
          throw new Meteor.Error('forbidden', "Forbidden");
        } // Delete the physical file in the store


        self.delete(file._id);
        let tmpFile = UploadFS.getTempFilePath(file._id); // Delete the temp file

        fs.stat(tmpFile, function (err) {
          !err && fs.unlink(tmpFile, function (err) {
            err && console.error(`ufs: cannot delete temp file at ${tmpFile} (${err.message})`);
          });
        });
      });
    }
  }
  /**
   * Deletes a file async
   * @param fileId
   * @param callback
   */


  delete(fileId, callback) {
    throw new Error('delete is not implemented');
  }
  /**
   * Generates a random token
   * @param pattern
   * @return {string}
   */


  generateToken(pattern) {
    return (pattern || 'xyxyxyxyxy').replace(/[xy]/g, c => {
      let r = Math.random() * 16 | 0,
          v = c == 'x' ? r : r & 0x3 | 0x8;
      let s = v.toString(16);
      return Math.round(Math.random()) ? s.toUpperCase() : s;
    });
  }
  /**
   * Returns the collection
   * @return {Mongo.Collection}
   */


  getCollection() {
    return this.options.collection;
  }
  /**
   * Returns the file URL
   * @param fileId
   * @return {string|null}
   */


  getFileRelativeURL(fileId) {
    let file = this.getCollection().findOne(fileId, {
      fields: {
        name: 1
      }
    });
    return file ? this.getRelativeURL(`${fileId}/${file.name}`) : null;
  }
  /**
   * Returns the file URL
   * @param fileId
   * @return {string|null}
   */


  getFileURL(fileId) {
    let file = this.getCollection().findOne(fileId, {
      fields: {
        name: 1
      }
    });
    return file ? this.getURL(`${fileId}/${file.name}`) : null;
  }
  /**
   * Returns the file filter
   * @return {UploadFS.Filter}
   */


  getFilter() {
    return this.options.filter;
  }
  /**
   * Returns the store name
   * @return {string}
   */


  getName() {
    return this.options.name;
  }
  /**
   * Returns the file read stream
   * @param fileId
   * @param file
   */


  getReadStream(fileId, file) {
    throw new Error('Store.getReadStream is not implemented');
  }
  /**
   * Returns the store relative URL
   * @param path
   * @return {string}
   */


  getRelativeURL(path) {
    const rootUrl = Meteor.absoluteUrl().replace(/\/+$/, '');
    const rootPath = rootUrl.replace(/^[a-z]+:\/\/[^/]+\/*/gi, '');
    const storeName = this.getName();
    path = String(path).replace(/\/$/, '').trim();
    return encodeURI(`${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}`);
  }
  /**
   * Returns the store absolute URL
   * @param path
   * @return {string}
   */


  getURL(path) {
    const rootUrl = Meteor.absoluteUrl().replace(/\/+$/, '');
    const storeName = this.getName();
    path = String(path).replace(/\/$/, '').trim();
    return encodeURI(`${rootUrl}/${UploadFS.config.storesPath}/${storeName}/${path}`);
  }
  /**
   * Returns the file write stream
   * @param fileId
   * @param file
   */


  getWriteStream(fileId, file) {
    throw new Error('getWriteStream is not implemented');
  }
  /**
   * Completes the file upload
   * @param url
   * @param file
   * @param callback
   */


  importFromURL(url, file, callback) {
    Meteor.call('ufsImportURL', url, file, this.getName(), callback);
  }
  /**
   * Called when a copy error happened
   * @param err
   * @param fileId
   * @param file
   */


  onCopyError(err, fileId, file) {
    console.error(`ufs: cannot copy file "${fileId}" (${err.message})`, err);
  }
  /**
   * Called when a file has been uploaded
   * @param file
   */


  onFinishUpload(file) {}
  /**
   * Called when a file is read from the store
   * @param fileId
   * @param file
   * @param request
   * @param response
   * @return boolean
   */


  onRead(fileId, file, request, response) {
    return true;
  }
  /**
   * Called when a read error happened
   * @param err
   * @param fileId
   * @param file
   * @return boolean
   */


  onReadError(err, fileId, file) {
    console.error(`ufs: cannot read file "${fileId}" (${err.message})`, err);
  }
  /**
   * Called when file is being validated
   * @param file
   */


  onValidate(file) {}
  /**
   * Called when a write error happened
   * @param err
   * @param fileId
   * @param file
   * @return boolean
   */


  onWriteError(err, fileId, file) {
    console.error(`ufs: cannot write file "${fileId}" (${err.message})`, err);
  }
  /**
   * Sets the store permissions
   * @param permissions
   */


  setPermissions(permissions) {
    if (!(permissions instanceof StorePermissions)) {
      throw new TypeError("Permissions is not an instance of UploadFS.StorePermissions");
    }

    this.permissions = permissions;
  }
  /**
   * Transforms the file on reading
   * @param readStream
   * @param writeStream
   * @param fileId
   * @param file
   * @param request
   * @param headers
   */


  transformRead(readStream, writeStream, fileId, file, request, headers) {
    if (typeof this.options.transformRead === 'function') {
      this.options.transformRead.call(this, readStream, writeStream, fileId, file, request, headers);
    } else {
      readStream.pipe(writeStream);
    }
  }
  /**
   * Transforms the file on writing
   * @param readStream
   * @param writeStream
   * @param fileId
   * @param file
   */


  transformWrite(readStream, writeStream, fileId, file) {
    if (typeof this.options.transformWrite === 'function') {
      this.options.transformWrite.call(this, readStream, writeStream, fileId, file);
    } else {
      readStream.pipe(writeStream);
    }
  }
  /**
   * Validates the file
   * @param file
   */


  validate(file) {
    if (typeof this.onValidate === 'function') {
      this.onValidate(file);
    }
  }

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-template-helpers.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-template-helpers.js                                                                    //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
let Template;
module.watch(require("meteor/templating"), {
  Template(v) {
    Template = v;
  }

}, 0);

let isMIME = function (type, mime) {
  return typeof type === 'string' && typeof mime === 'string' && mime.indexOf(type + '/') === 0;
};

Template.registerHelper('isApplication', function (type) {
  return isMIME('application', this.type || type);
});
Template.registerHelper('isAudio', function (type) {
  return isMIME('audio', this.type || type);
});
Template.registerHelper('isImage', function (type) {
  return isMIME('image', this.type || type);
});
Template.registerHelper('isText', function (type) {
  return isMIME('text', this.type || type);
});
Template.registerHelper('isVideo', function (type) {
  return isMIME('video', this.type || type);
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-tokens.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-tokens.js                                                                              //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Tokens: () => Tokens
});
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
const Tokens = new Mongo.Collection('ufsTokens');
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ufs-uploader.js":function(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                               //
// packages/jalik_ufs/ufs-uploader.js                                                                            //
//                                                                                                               //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                 //
module.export({
  Uploader: () => Uploader
});

let _;

module.watch(require("meteor/underscore"), {
  _(v) {
    _ = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Store;
module.watch(require("./ufs-store"), {
  Store(v) {
    Store = v;
  }

}, 2);

class Uploader {
  constructor(options) {
    let self = this; // Set default options

    options = _.extend({
      adaptive: true,
      capacity: 0.9,
      chunkSize: 16 * 1024,
      data: null,
      file: null,
      maxChunkSize: 4 * 1024 * 1000,
      maxTries: 5,
      onAbort: this.onAbort,
      onComplete: this.onComplete,
      onCreate: this.onCreate,
      onError: this.onError,
      onProgress: this.onProgress,
      onStart: this.onStart,
      onStop: this.onStop,
      retryDelay: 2000,
      store: null,
      transferDelay: 100
    }, options); // Check options

    if (typeof options.adaptive !== 'boolean') {
      throw new TypeError('adaptive is not a number');
    }

    if (typeof options.capacity !== 'number') {
      throw new TypeError('capacity is not a number');
    }

    if (options.capacity <= 0 || options.capacity > 1) {
      throw new RangeError('capacity must be a float between 0.1 and 1.0');
    }

    if (typeof options.chunkSize !== 'number') {
      throw new TypeError('chunkSize is not a number');
    }

    if (!(options.data instanceof Blob) && !(options.data instanceof File)) {
      throw new TypeError('data is not an Blob or File');
    }

    if (options.file === null || typeof options.file !== 'object') {
      throw new TypeError('file is not an object');
    }

    if (typeof options.maxChunkSize !== 'number') {
      throw new TypeError('maxChunkSize is not a number');
    }

    if (typeof options.maxTries !== 'number') {
      throw new TypeError('maxTries is not a number');
    }

    if (typeof options.retryDelay !== 'number') {
      throw new TypeError('retryDelay is not a number');
    }

    if (typeof options.transferDelay !== 'number') {
      throw new TypeError('transferDelay is not a number');
    }

    if (typeof options.onAbort !== 'function') {
      throw new TypeError('onAbort is not a function');
    }

    if (typeof options.onComplete !== 'function') {
      throw new TypeError('onComplete is not a function');
    }

    if (typeof options.onCreate !== 'function') {
      throw new TypeError('onCreate is not a function');
    }

    if (typeof options.onError !== 'function') {
      throw new TypeError('onError is not a function');
    }

    if (typeof options.onProgress !== 'function') {
      throw new TypeError('onProgress is not a function');
    }

    if (typeof options.onStart !== 'function') {
      throw new TypeError('onStart is not a function');
    }

    if (typeof options.onStop !== 'function') {
      throw new TypeError('onStop is not a function');
    }

    if (typeof options.store !== 'string' && !(options.store instanceof Store)) {
      throw new TypeError('store must be the name of the store or an instance of UploadFS.Store');
    } // Public attributes


    self.adaptive = options.adaptive;
    self.capacity = parseFloat(options.capacity);
    self.chunkSize = parseInt(options.chunkSize);
    self.maxChunkSize = parseInt(options.maxChunkSize);
    self.maxTries = parseInt(options.maxTries);
    self.retryDelay = parseInt(options.retryDelay);
    self.transferDelay = parseInt(options.transferDelay);
    self.onAbort = options.onAbort;
    self.onComplete = options.onComplete;
    self.onCreate = options.onCreate;
    self.onError = options.onError;
    self.onProgress = options.onProgress;
    self.onStart = options.onStart;
    self.onStop = options.onStop; // Private attributes

    let store = options.store;
    let data = options.data;
    let capacityMargin = 0.1;
    let file = options.file;
    let fileId = null;
    let offset = 0;
    let loaded = 0;
    let total = data.size;
    let tries = 0;
    let postUrl = null;
    let token = null;
    let complete = false;
    let uploading = false;
    let timeA = null;
    let timeB = null;
    let elapsedTime = 0;
    let startTime = 0; // Keep only the name of the store

    if (store instanceof Store) {
      store = store.getName();
    } // Assign file to store


    file.store = store;

    function finish() {
      // Finish the upload by telling the store the upload is complete
      Meteor.call('ufsComplete', fileId, store, token, function (err, uploadedFile) {
        if (err) {
          self.onError(err, file);
          self.abort();
        } else if (uploadedFile) {
          uploading = false;
          complete = true;
          file = uploadedFile;
          self.onComplete(uploadedFile);
        }
      });
    }
    /**
     * Aborts the current transfer
     */


    self.abort = function () {
      // Remove the file from database
      Meteor.call('ufsDelete', fileId, store, token, function (err, result) {
        if (err) {
          self.onError(err, file);
        }
      }); // Reset uploader status

      uploading = false;
      fileId = null;
      offset = 0;
      tries = 0;
      loaded = 0;
      complete = false;
      startTime = null;
      self.onAbort(file);
    };
    /**
     * Returns the average speed in bytes per second
     * @returns {number}
     */


    self.getAverageSpeed = function () {
      let seconds = self.getElapsedTime() / 1000;
      return self.getLoaded() / seconds;
    };
    /**
     * Returns the elapsed time in milliseconds
     * @returns {number}
     */


    self.getElapsedTime = function () {
      if (startTime && self.isUploading()) {
        return elapsedTime + (Date.now() - startTime);
      }

      return elapsedTime;
    };
    /**
     * Returns the file
     * @return {object}
     */


    self.getFile = function () {
      return file;
    };
    /**
     * Returns the loaded bytes
     * @return {number}
     */


    self.getLoaded = function () {
      return loaded;
    };
    /**
     * Returns current progress
     * @return {number}
     */


    self.getProgress = function () {
      return Math.min(loaded / total * 100 / 100, 1.0);
    };
    /**
     * Returns the remaining time in milliseconds
     * @returns {number}
     */


    self.getRemainingTime = function () {
      let averageSpeed = self.getAverageSpeed();
      let remainingBytes = total - self.getLoaded();
      return averageSpeed && remainingBytes ? Math.max(remainingBytes / averageSpeed, 0) : 0;
    };
    /**
     * Returns the upload speed in bytes per second
     * @returns {number}
     */


    self.getSpeed = function () {
      if (timeA && timeB && self.isUploading()) {
        let seconds = (timeB - timeA) / 1000;
        return self.chunkSize / seconds;
      }

      return 0;
    };
    /**
     * Returns the total bytes
     * @return {number}
     */


    self.getTotal = function () {
      return total;
    };
    /**
     * Checks if the transfer is complete
     * @return {boolean}
     */


    self.isComplete = function () {
      return complete;
    };
    /**
     * Checks if the transfer is active
     * @return {boolean}
     */


    self.isUploading = function () {
      return uploading;
    };
    /**
     * Reads a portion of file
     * @param start
     * @param length
     * @param callback
     * @returns {Blob}
     */


    self.readChunk = function (start, length, callback) {
      if (typeof callback != 'function') {
        throw new Error('readChunk is missing callback');
      }

      try {
        let end; // Calculate the chunk size

        if (length && start + length > total) {
          end = total;
        } else {
          end = start + length;
        } // Get chunk


        let chunk = data.slice(start, end); // Pass chunk to callback

        callback.call(self, null, chunk);
      } catch (err) {
        console.error('read error', err); // Retry to read chunk

        Meteor.setTimeout(function () {
          if (tries < self.maxTries) {
            tries += 1;
            self.readChunk(start, length, callback);
          }
        }, self.retryDelay);
      }
    };
    /**
     * Sends a file chunk to the store
     */


    self.sendChunk = function () {
      if (!complete && startTime !== null) {
        if (offset < total) {
          let chunkSize = self.chunkSize; // Use adaptive length

          if (self.adaptive && timeA && timeB && timeB > timeA) {
            let duration = (timeB - timeA) / 1000;
            let max = self.capacity * (1 + capacityMargin);
            let min = self.capacity * (1 - capacityMargin);

            if (duration >= max) {
              chunkSize = Math.abs(Math.round(chunkSize * (max - duration)));
            } else if (duration < min) {
              chunkSize = Math.round(chunkSize * (min / duration));
            } // Limit to max chunk size


            if (self.maxChunkSize > 0 && chunkSize > self.maxChunkSize) {
              chunkSize = self.maxChunkSize;
            }
          } // Limit to max chunk size


          if (self.maxChunkSize > 0 && chunkSize > self.maxChunkSize) {
            chunkSize = self.maxChunkSize;
          } // Reduce chunk size to fit total


          if (offset + chunkSize > total) {
            chunkSize = total - offset;
          } // Prepare the chunk


          self.readChunk(offset, chunkSize, function (err, chunk) {
            if (err) {
              self.onError(err, file);
              return;
            }

            let xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4) {
                if (_.contains([200, 201, 202, 204], xhr.status)) {
                  timeB = Date.now();
                  offset += chunkSize;
                  loaded += chunkSize; // Send next chunk

                  self.onProgress(file, self.getProgress()); // Finish upload

                  if (loaded >= total) {
                    elapsedTime = Date.now() - startTime;
                    finish();
                  } else {
                    Meteor.setTimeout(self.sendChunk, self.transferDelay);
                  }
                } else if (!_.contains([402, 403, 404, 500], xhr.status)) {
                  // Retry until max tries is reach
                  // But don't retry if these errors occur
                  if (tries <= self.maxTries) {
                    tries += 1; // Wait before retrying

                    Meteor.setTimeout(self.sendChunk, self.retryDelay);
                  } else {
                    self.abort();
                  }
                } else {
                  self.abort();
                }
              }
            }; // Calculate upload progress


            let progress = (offset + chunkSize) / total; // let formData = new FormData();
            // formData.append('progress', progress);
            // formData.append('chunk', chunk);

            let url = `${postUrl}&progress=${progress}`;
            timeA = Date.now();
            timeB = null;
            uploading = true; // Send chunk to the store

            xhr.open('POST', url, true);
            xhr.send(chunk);
          });
        }
      }
    };
    /**
     * Starts or resumes the transfer
     */


    self.start = function () {
      if (!fileId) {
        // Create the file document and get the token
        // that allows the user to send chunks to the store.
        Meteor.call('ufsCreate', _.extend({}, file), function (err, result) {
          if (err) {
            self.onError(err, file);
          } else if (result) {
            token = result.token;
            postUrl = result.url;
            fileId = result.fileId;
            file._id = result.fileId;
            self.onCreate(file);
            tries = 0;
            startTime = Date.now();
            self.onStart(file);
            self.sendChunk();
          }
        });
      } else if (!uploading && !complete) {
        // Resume uploading
        tries = 0;
        startTime = Date.now();
        self.onStart(file);
        self.sendChunk();
      }
    };
    /**
     * Stops the transfer
     */


    self.stop = function () {
      if (uploading) {
        // Update elapsed time
        elapsedTime = Date.now() - startTime;
        startTime = null;
        uploading = false;
        self.onStop(file);
        Meteor.call('ufsStop', fileId, store, token, function (err, result) {
          if (err) {
            self.onError(err, file);
          }
        });
      }
    };
  }
  /**
   * Called when the file upload is aborted
   * @param file
   */


  onAbort(file) {}
  /**
   * Called when the file upload is complete
   * @param file
   */


  onComplete(file) {}
  /**
   * Called when the file is created in the collection
   * @param file
   */


  onCreate(file) {}
  /**
   * Called when an error occurs during file upload
   * @param err
   * @param file
   */


  onError(err, file) {
    console.error(`ufs: ${err.message}`);
  }
  /**
   * Called when a file chunk has been sent
   * @param file
   * @param progress is a float from 0.0 to 1.0
   */


  onProgress(file, progress) {}
  /**
   * Called when the file upload starts
   * @param file
   */


  onStart(file) {}
  /**
   * Called when the file upload stops
   * @param file
   */


  onStop(file) {}

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/jalik:ufs/ufs.js");

/* Exports */
Package._define("jalik:ufs", exports);

})();

//# sourceURL=meteor://💻app/packages/jalik_ufs.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy1jb25maWcuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtZmlsdGVyLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9qYWxpazp1ZnMvdWZzLW1ldGhvZHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtbWltZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy1zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtc3RvcmUtcGVybWlzc2lvbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtc3RvcmUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtdGVtcGxhdGUtaGVscGVycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvamFsaWs6dWZzL3Vmcy10b2tlbnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2phbGlrOnVmcy91ZnMtdXBsb2FkZXIuanMiXSwibmFtZXMiOlsibW9kdWxlMSIsIm1vZHVsZSIsImV4cG9ydCIsIlVwbG9hZEZTIiwiXyIsIndhdGNoIiwicmVxdWlyZSIsInYiLCJNZXRlb3IiLCJNb25nbyIsIk1JTUUiLCJSYW5kb20iLCJUb2tlbnMiLCJDb25maWciLCJGaWx0ZXIiLCJTdG9yZSIsIlN0b3JlUGVybWlzc2lvbnMiLCJVcGxvYWRlciIsInN0b3JlcyIsInN0b3JlIiwidG9rZW5zIiwiYWRkRVRhZ0F0dHJpYnV0ZVRvRmlsZXMiLCJ3aGVyZSIsImVhY2giLCJnZXRTdG9yZXMiLCJmaWxlcyIsImdldENvbGxlY3Rpb24iLCJmaW5kIiwiZXRhZyIsImZpZWxkcyIsIl9pZCIsImZvckVhY2giLCJmaWxlIiwiZGlyZWN0IiwidXBkYXRlIiwiJHNldCIsImdlbmVyYXRlRXRhZyIsImFkZE1pbWVUeXBlIiwiZXh0ZW5zaW9uIiwibWltZSIsInRvTG93ZXJDYXNlIiwiYWRkUGF0aEF0dHJpYnV0ZVRvRmlsZXMiLCJwYXRoIiwiZ2V0RmlsZVJlbGF0aXZlVVJMIiwiYWRkU3RvcmUiLCJUeXBlRXJyb3IiLCJnZXROYW1lIiwiaWQiLCJnZXRNaW1lVHlwZSIsImdldE1pbWVUeXBlcyIsImdldFN0b3JlIiwibmFtZSIsImdldFRlbXBGaWxlUGF0aCIsImZpbGVJZCIsImNvbmZpZyIsInRtcERpciIsImltcG9ydEZyb21VUkwiLCJ1cmwiLCJjYWxsYmFjayIsImNhbGwiLCJyZWFkQXNBcnJheUJ1ZmZlciIsImV2ZW50IiwiY29uc29sZSIsImVycm9yIiwic2VsZWN0RmlsZSIsImlucHV0IiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwidHlwZSIsIm11bHRpcGxlIiwib25jaGFuZ2UiLCJldiIsInRhcmdldCIsImRpdiIsImNsYXNzTmFtZSIsInN0eWxlIiwiYXBwZW5kQ2hpbGQiLCJib2R5IiwiY2xpY2siLCJzZWxlY3RGaWxlcyIsImkiLCJsZW5ndGgiLCJpc0NsaWVudCIsImlzU2VydmVyIiwiZ2xvYmFsIiwid2luZG93IiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiZXh0ZW5kIiwiZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMiLCJodHRwcyIsInNpbXVsYXRlUmVhZERlbGF5Iiwic2ltdWxhdGVVcGxvYWRTcGVlZCIsInNpbXVsYXRlV3JpdGVEZWxheSIsInN0b3Jlc1BhdGgiLCJ0bXBEaXJQZXJtaXNzaW9ucyIsInBhcnNlSW50Iiwic2VsZiIsImNvbnRlbnRUeXBlcyIsImV4dGVuc2lvbnMiLCJtaW5TaXplIiwibWF4U2l6ZSIsIm9uQ2hlY2siLCJBcnJheSIsIm1ldGhvZCIsImNoZWNrIiwiRXJyb3IiLCJzaXplIiwiZ2V0TWluU2l6ZSIsImdldE1heFNpemUiLCJnZXRFeHRlbnNpb25zIiwiY29udGFpbnMiLCJnZXRDb250ZW50VHlwZXMiLCJpc0NvbnRlbnRUeXBlSW5MaXN0IiwibGlzdCIsIndpbGRDYXJkR2xvYiIsIndpbGRjYXJkcyIsImZpbHRlciIsIml0ZW0iLCJpbmRleE9mIiwicmVwbGFjZSIsImlzVmFsaWQiLCJyZXN1bHQiLCJlcnIiLCJmcyIsIk5wbSIsImh0dHAiLCJGdXR1cmUiLCJtZXRob2RzIiwidWZzQ29tcGxldGUiLCJzdG9yZU5hbWUiLCJ0b2tlbiIsIlN0cmluZyIsImNoZWNrVG9rZW4iLCJmdXQiLCJ0bXBGaWxlIiwicmVtb3ZlVGVtcEZpbGUiLCJ1bmxpbmsiLCJtZXNzYWdlIiwiZmluZE9uZSIsInZhbGlkYXRlIiwicnMiLCJjcmVhdGVSZWFkU3RyZWFtIiwiZmxhZ3MiLCJlbmNvZGluZyIsImF1dG9DbG9zZSIsIm9uIiwiYmluZEVudmlyb25tZW50IiwicmVtb3ZlIiwidGhyb3ciLCJ3cml0ZSIsInJldHVybiIsIndhaXQiLCJ1ZnNDcmVhdGUiLCJPYmplY3QiLCJjb21wbGV0ZSIsInVwbG9hZGluZyIsInN1YnN0ciIsImxhc3RJbmRleE9mIiwicHJvZ3Jlc3MiLCJ1c2VySWQiLCJnZXRGaWx0ZXIiLCJjcmVhdGUiLCJjcmVhdGVUb2tlbiIsInVwbG9hZFVybCIsImdldFVSTCIsInVmc0RlbGV0ZSIsImNvdW50IiwidWZzSW1wb3J0VVJMIiwic3BsaXQiLCJwb3AiLCJvcmlnaW5hbFVybCIsIndhcm4iLCJwcm90byIsInRlc3QiLCJ1bmJsb2NrIiwiZ2V0IiwicmVzIiwidWZzU3RvcCIsIldlYkFwcCIsImRvbWFpbiIsIm1rZGlycCIsInN0cmVhbSIsIlVSTCIsInpsaWIiLCJzdGFydHVwIiwibW9kZSIsInN0YXQiLCJsb2ciLCJjaG1vZCIsImQiLCJjb25uZWN0SGFuZGxlcnMiLCJ1c2UiLCJyZXEiLCJuZXh0IiwicGFyc2VkVXJsIiwicGFyc2UiLCJwYXRobmFtZSIsImFsbG93Q09SUyIsInNldEhlYWRlciIsInJlZ0V4cCIsIlJlZ0V4cCIsIm1hdGNoIiwiZXhlYyIsIndyaXRlSGVhZCIsImVuZCIsInF1ZXJ5Iiwid3MiLCJjcmVhdGVXcml0ZVN0cmVhbSIsInBhcnNlRmxvYXQiLCJpc05hTiIsIk1hdGgiLCJtaW4iLCJjaHVuayIsIm9uUmVhZCIsInVuZGVmaW5lZCIsImluZGV4IiwiX3NsZWVwRm9yTXMiLCJydW4iLCJzdGF0dXMiLCJoZWFkZXJzIiwibW9kaWZpZWRBdCIsIkRhdGUiLCJ0b1VUQ1N0cmluZyIsInVwbG9hZGVkQXQiLCJtb2RpZmllZFNpbmNlIiwicmFuZ2UiLCJwb3NpdGlvbnMiLCJzdGFydCIsInRvdGFsIiwiZ2V0UmVhZFN0cmVhbSIsIlBhc3NUaHJvdWdoIiwib25SZWFkRXJyb3IiLCJlbWl0IiwidHJhbnNmb3JtUmVhZCIsImFjY2VwdCIsInBpcGUiLCJjcmVhdGVHemlwIiwiY3JlYXRlRGVmbGF0ZSIsImluc2VydCIsImFjdGlvbnMiLCJhY3Rpb24iLCJtb2RpZmllcnMiLCJjaGVja0luc2VydCIsImNoZWNrUmVtb3ZlIiwiY2hlY2tVcGRhdGUiLCJjb2xsZWN0aW9uIiwib25Db3B5RXJyb3IiLCJvbkZpbmlzaFVwbG9hZCIsIm9uVmFsaWRhdGUiLCJvbldyaXRlRXJyb3IiLCJwZXJtaXNzaW9ucyIsInRyYW5zZm9ybVdyaXRlIiwiQ29sbGVjdGlvbiIsInZhbHVlIiwiY29weSIsIm9taXQiLCJvcmlnaW5hbFN0b3JlIiwib3JpZ2luYWxJZCIsImNvcHlJZCIsImdlbmVyYXRlVG9rZW4iLCJjcmVhdGVkQXQiLCJnZXRXcml0ZVN0cmVhbSIsImVycm9ySGFuZGxlciIsInJlYWRTdHJlYW0iLCJkYXRhIiwiZ2V0RmlsZVVSTCIsImNvcHlUbyIsImFmdGVyIiwiYmVmb3JlIiwiZGVsZXRlIiwicGF0dGVybiIsImMiLCJyIiwicmFuZG9tIiwicyIsInRvU3RyaW5nIiwicm91bmQiLCJ0b1VwcGVyQ2FzZSIsImdldFJlbGF0aXZlVVJMIiwicm9vdFVybCIsImFic29sdXRlVXJsIiwicm9vdFBhdGgiLCJ0cmltIiwiZW5jb2RlVVJJIiwicmVxdWVzdCIsInJlc3BvbnNlIiwic2V0UGVybWlzc2lvbnMiLCJ3cml0ZVN0cmVhbSIsIlRlbXBsYXRlIiwiaXNNSU1FIiwicmVnaXN0ZXJIZWxwZXIiLCJhZGFwdGl2ZSIsImNhcGFjaXR5IiwiY2h1bmtTaXplIiwibWF4Q2h1bmtTaXplIiwibWF4VHJpZXMiLCJvbkFib3J0Iiwib25Db21wbGV0ZSIsIm9uQ3JlYXRlIiwib25FcnJvciIsIm9uUHJvZ3Jlc3MiLCJvblN0YXJ0Iiwib25TdG9wIiwicmV0cnlEZWxheSIsInRyYW5zZmVyRGVsYXkiLCJSYW5nZUVycm9yIiwiQmxvYiIsIkZpbGUiLCJjYXBhY2l0eU1hcmdpbiIsIm9mZnNldCIsImxvYWRlZCIsInRyaWVzIiwicG9zdFVybCIsInRpbWVBIiwidGltZUIiLCJlbGFwc2VkVGltZSIsInN0YXJ0VGltZSIsImZpbmlzaCIsInVwbG9hZGVkRmlsZSIsImFib3J0IiwiZ2V0QXZlcmFnZVNwZWVkIiwic2Vjb25kcyIsImdldEVsYXBzZWRUaW1lIiwiZ2V0TG9hZGVkIiwiaXNVcGxvYWRpbmciLCJub3ciLCJnZXRGaWxlIiwiZ2V0UHJvZ3Jlc3MiLCJnZXRSZW1haW5pbmdUaW1lIiwiYXZlcmFnZVNwZWVkIiwicmVtYWluaW5nQnl0ZXMiLCJtYXgiLCJnZXRTcGVlZCIsImdldFRvdGFsIiwiaXNDb21wbGV0ZSIsInJlYWRDaHVuayIsInNsaWNlIiwic2V0VGltZW91dCIsInNlbmRDaHVuayIsImR1cmF0aW9uIiwiYWJzIiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJvbnJlYWR5c3RhdGVjaGFuZ2UiLCJyZWFkeVN0YXRlIiwib3BlbiIsInNlbmQiLCJzdG9wIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsTUFBTUEsVUFBUUMsTUFBZDtBQUFxQkQsUUFBUUUsTUFBUixDQUFlO0FBQUNDLFlBQVMsTUFBSUE7QUFBZCxDQUFmOztBQUF3QyxJQUFJQyxDQUFKOztB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QUFqQixFQUEyQixDQUMxQjtBQUVEOzs7Ozs7QUFJQStJLFVBQVE5USxJQUFSLEVBQWMsQ0FDYjtBQUVEOzs7Ozs7QUFJQStRLFNBQU8vUSxJQUFQLEVBQWEsQ0FDWjs7QUEzZWlCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2phbGlrX3Vmcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgS2FybCBTVEVJTlxyXG4gKlxyXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XHJcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcclxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xyXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXHJcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xyXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxyXG4gKlxyXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcclxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cclxuICpcclxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxyXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcclxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXHJcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcclxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcclxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcclxuICogU09GVFdBUkUuXHJcbiAqXHJcbiAqL1xyXG5pbXBvcnQge199IGZyb20gXCJtZXRlb3IvdW5kZXJzY29yZVwiO1xyXG5pbXBvcnQge01ldGVvcn0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcclxuaW1wb3J0IHtNb25nb30gZnJvbSBcIm1ldGVvci9tb25nb1wiO1xyXG5pbXBvcnQge01JTUV9IGZyb20gXCIuL3Vmcy1taW1lXCI7XHJcbmltcG9ydCB7UmFuZG9tfSBmcm9tIFwibWV0ZW9yL3JhbmRvbVwiO1xyXG5pbXBvcnQge1Rva2Vuc30gZnJvbSBcIi4vdWZzLXRva2Vuc1wiO1xyXG5pbXBvcnQge0NvbmZpZ30gZnJvbSBcIi4vdWZzLWNvbmZpZ1wiO1xyXG5pbXBvcnQge0ZpbHRlcn0gZnJvbSBcIi4vdWZzLWZpbHRlclwiO1xyXG5pbXBvcnQge1N0b3JlfSBmcm9tIFwiLi91ZnMtc3RvcmVcIjtcclxuaW1wb3J0IHtTdG9yZVBlcm1pc3Npb25zfSBmcm9tIFwiLi91ZnMtc3RvcmUtcGVybWlzc2lvbnNcIjtcclxuaW1wb3J0IHtVcGxvYWRlcn0gZnJvbSBcIi4vdWZzLXVwbG9hZGVyXCI7XHJcblxyXG5cclxubGV0IHN0b3JlcyA9IHt9O1xyXG5cclxuZXhwb3J0IGNvbnN0IFVwbG9hZEZTID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udGFpbnMgYWxsIHN0b3Jlc1xyXG4gICAgICovXHJcbiAgICBzdG9yZToge30sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb2xsZWN0aW9uIG9mIHRva2Vuc1xyXG4gICAgICovXHJcbiAgICB0b2tlbnM6IFRva2VucyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgdGhlIFwiZXRhZ1wiIGF0dHJpYnV0ZSB0byBmaWxlc1xyXG4gICAgICogQHBhcmFtIHdoZXJlXHJcbiAgICAgKi9cclxuICAgIGFkZEVUYWdBdHRyaWJ1dGVUb0ZpbGVzKHdoZXJlKSB7XHJcbiAgICAgICAgXy5lYWNoKHRoaXMuZ2V0U3RvcmVzKCksIChzdG9yZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IHN0b3JlLmdldENvbGxlY3Rpb24oKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQgdXBkYXRlIG9ubHkgZmlsZXMgd2l0aCBubyBwYXRoIHNldFxyXG4gICAgICAgICAgICBmaWxlcy5maW5kKHdoZXJlIHx8IHtldGFnOiBudWxsfSwge2ZpZWxkczoge19pZDogMX19KS5mb3JFYWNoKChmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmaWxlcy5kaXJlY3QudXBkYXRlKGZpbGUuX2lkLCB7JHNldDoge2V0YWc6IHRoaXMuZ2VuZXJhdGVFdGFnKCl9fSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFkZHMgdGhlIE1JTUUgdHlwZSBmb3IgYW4gZXh0ZW5zaW9uXHJcbiAgICAgKiBAcGFyYW0gZXh0ZW5zaW9uXHJcbiAgICAgKiBAcGFyYW0gbWltZVxyXG4gICAgICovXHJcbiAgICBhZGRNaW1lVHlwZShleHRlbnNpb24sIG1pbWUpIHtcclxuICAgICAgICBNSU1FW2V4dGVuc2lvbi50b0xvd2VyQ2FzZSgpXSA9IG1pbWU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyB0aGUgXCJwYXRoXCIgYXR0cmlidXRlIHRvIGZpbGVzXHJcbiAgICAgKiBAcGFyYW0gd2hlcmVcclxuICAgICAqL1xyXG4gICAgYWRkUGF0aEF0dHJpYnV0ZVRvRmlsZXMod2hlcmUpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5nZXRTdG9yZXMoKSwgKHN0b3JlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gc3RvcmUuZ2V0Q29sbGVjdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgLy8gQnkgZGVmYXVsdCB1cGRhdGUgb25seSBmaWxlcyB3aXRoIG5vIHBhdGggc2V0XHJcbiAgICAgICAgICAgIGZpbGVzLmZpbmQod2hlcmUgfHwge3BhdGg6IG51bGx9LCB7ZmllbGRzOiB7X2lkOiAxfX0pLmZvckVhY2goKGZpbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGZpbGVzLmRpcmVjdC51cGRhdGUoZmlsZS5faWQsIHskc2V0OiB7cGF0aDogc3RvcmUuZ2V0RmlsZVJlbGF0aXZlVVJMKGZpbGUuX2lkKX19KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVnaXN0ZXJzIHRoZSBzdG9yZVxyXG4gICAgICogQHBhcmFtIHN0b3JlXHJcbiAgICAgKi9cclxuICAgIGFkZFN0b3JlKHN0b3JlKSB7XHJcbiAgICAgICAgaWYgKCEoc3RvcmUgaW5zdGFuY2VvZiBTdG9yZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgdWZzOiBzdG9yZSBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgVXBsb2FkRlMuU3RvcmUuYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0b3Jlc1tzdG9yZS5nZXROYW1lKCldID0gc3RvcmU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGVzIGEgdW5pcXVlIEVUYWdcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2VuZXJhdGVFdGFnKCkge1xyXG4gICAgICAgIHJldHVybiBSYW5kb20uaWQoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBNSU1FIHR5cGUgb2YgdGhlIGV4dGVuc2lvblxyXG4gICAgICogQHBhcmFtIGV4dGVuc2lvblxyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKi9cclxuICAgIGdldE1pbWVUeXBlKGV4dGVuc2lvbikge1xyXG4gICAgICAgIGV4dGVuc2lvbiA9IGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIHJldHVybiBNSU1FW2V4dGVuc2lvbl07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbGwgTUlNRSB0eXBlc1xyXG4gICAgICovXHJcbiAgICBnZXRNaW1lVHlwZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIE1JTUU7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3RvcmUgYnkgaXRzIG5hbWVcclxuICAgICAqIEBwYXJhbSBuYW1lXHJcbiAgICAgKiBAcmV0dXJuIHtVcGxvYWRGUy5TdG9yZX1cclxuICAgICAqL1xyXG4gICAgZ2V0U3RvcmUobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBzdG9yZXNbbmFtZV07XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyBhbGwgc3RvcmVzXHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIGdldFN0b3JlcygpIHtcclxuICAgICAgICByZXR1cm4gc3RvcmVzO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIHRlbXBvcmFyeSBmaWxlIHBhdGhcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0VGVtcEZpbGVQYXRoKGZpbGVJZCkge1xyXG4gICAgICAgIHJldHVybiBgJHt0aGlzLmNvbmZpZy50bXBEaXJ9LyR7ZmlsZUlkfWA7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW1wb3J0cyBhIGZpbGUgZnJvbSBhIFVSTFxyXG4gICAgICogQHBhcmFtIHVybFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSBzdG9yZVxyXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIGltcG9ydEZyb21VUkwodXJsLCBmaWxlLCBzdG9yZSwgY2FsbGJhY2spIHtcclxuICAgICAgICBpZiAodHlwZW9mIHN0b3JlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBNZXRlb3IuY2FsbCgndWZzSW1wb3J0VVJMJywgdXJsLCBmaWxlLCBzdG9yZSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc3RvcmUgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgIHN0b3JlLmltcG9ydEZyb21VUkwodXJsLCBmaWxlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgZmlsZSBhbmQgZGF0YSBhcyBBcnJheUJ1ZmZlciBmb3IgZWFjaCBmaWxlcyBpbiB0aGUgZXZlbnRcclxuICAgICAqIEBkZXByZWNhdGVkXHJcbiAgICAgKiBAcGFyYW0gZXZlbnRcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICByZWFkQXNBcnJheUJ1ZmZlciAoZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignVXBsb2FkRlMucmVhZEFzQXJyYXlCdWZmZXIgaXMgZGVwcmVjYXRlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qYWxpay9qYWxpay11ZnMjdXBsb2FkaW5nLWZyb20tYS1maWxlJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbnMgYSBkaWFsb2cgdG8gc2VsZWN0IGEgc2luZ2xlIGZpbGVcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICBzZWxlY3RGaWxlKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgY29uc3QgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xyXG4gICAgICAgIGlucHV0LnR5cGUgPSAnZmlsZSc7XHJcbiAgICAgICAgaW5wdXQubXVsdGlwbGUgPSBmYWxzZTtcclxuICAgICAgICBpbnB1dC5vbmNoYW5nZSA9IChldikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZmlsZXMgPSBldi50YXJnZXQuZmlsZXM7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoVXBsb2FkRlMsIGZpbGVzWzBdKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEZpeCBmb3IgaU9TL1NhZmFyaVxyXG4gICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSAndWZzLWZpbGUtc2VsZWN0b3InO1xyXG4gICAgICAgIGRpdi5zdHlsZSA9ICdkaXNwbGF5Om5vbmU7IGhlaWdodDowOyB3aWR0aDowOyBvdmVyZmxvdzogaGlkZGVuOyc7XHJcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICAgICAgLy8gVHJpZ2dlciBmaWxlIHNlbGVjdGlvblxyXG4gICAgICAgIGlucHV0LmNsaWNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3BlbnMgYSBkaWFsb2cgdG8gc2VsZWN0IG11bHRpcGxlIGZpbGVzXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgc2VsZWN0RmlsZXMoY2FsbGJhY2spIHtcclxuICAgICAgICBjb25zdCBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XHJcbiAgICAgICAgaW5wdXQudHlwZSA9ICdmaWxlJztcclxuICAgICAgICBpbnB1dC5tdWx0aXBsZSA9IHRydWU7XHJcbiAgICAgICAgaW5wdXQub25jaGFuZ2UgPSAoZXYpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSBldi50YXJnZXQuZmlsZXM7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKFVwbG9hZEZTLCBmaWxlc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIC8vIEZpeCBmb3IgaU9TL1NhZmFyaVxyXG4gICAgICAgIGNvbnN0IGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGRpdi5jbGFzc05hbWUgPSAndWZzLWZpbGUtc2VsZWN0b3InO1xyXG4gICAgICAgIGRpdi5zdHlsZSA9ICdkaXNwbGF5Om5vbmU7IGhlaWdodDowOyB3aWR0aDowOyBvdmVyZmxvdzogaGlkZGVuOyc7XHJcbiAgICAgICAgZGl2LmFwcGVuZENoaWxkKGlucHV0KTtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGRpdik7XHJcbiAgICAgICAgLy8gVHJpZ2dlciBmaWxlIHNlbGVjdGlvblxyXG4gICAgICAgIGlucHV0LmNsaWNrKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5cclxuaWYgKE1ldGVvci5pc0NsaWVudCkge1xyXG4gICAgcmVxdWlyZSgnLi91ZnMtdGVtcGxhdGUtaGVscGVycycpO1xyXG59XHJcbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgIHJlcXVpcmUoJy4vdWZzLW1ldGhvZHMnKTtcclxuICAgIHJlcXVpcmUoJy4vdWZzLXNlcnZlcicpO1xyXG59XHJcblxyXG4vKipcclxuICogVXBsb2FkRlMgQ29uZmlndXJhdGlvblxyXG4gKiBAdHlwZSB7Q29uZmlnfVxyXG4gKi9cclxuVXBsb2FkRlMuY29uZmlnID0gbmV3IENvbmZpZygpO1xyXG5cclxuLy8gQWRkIGNsYXNzZXMgdG8gZ2xvYmFsIG5hbWVzcGFjZVxyXG5VcGxvYWRGUy5Db25maWcgPSBDb25maWc7XHJcblVwbG9hZEZTLkZpbHRlciA9IEZpbHRlcjtcclxuVXBsb2FkRlMuU3RvcmUgPSBTdG9yZTtcclxuVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9ucyA9IFN0b3JlUGVybWlzc2lvbnM7XHJcblVwbG9hZEZTLlVwbG9hZGVyID0gVXBsb2FkZXI7XHJcblxyXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XHJcbiAgICAvLyBFeHBvc2UgdGhlIG1vZHVsZSBnbG9iYWxseVxyXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgZ2xvYmFsWydVcGxvYWRGUyddID0gVXBsb2FkRlM7XHJcbiAgICB9XHJcbn1cclxuZWxzZSBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XHJcbiAgICAvLyBFeHBvc2UgdGhlIG1vZHVsZSBnbG9iYWxseVxyXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgd2luZG93LlVwbG9hZEZTID0gVXBsb2FkRlM7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xyXG5pbXBvcnQge1N0b3JlUGVybWlzc2lvbnN9IGZyb20gJy4vdWZzLXN0b3JlLXBlcm1pc3Npb25zJztcclxuXHJcblxyXG4vKipcclxuICogVXBsb2FkRlMgY29uZmlndXJhdGlvblxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENvbmZpZyB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIC8vIERlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGRlZmF1bHRTdG9yZVBlcm1pc3Npb25zOiBudWxsLFxyXG4gICAgICAgICAgICBodHRwczogZmFsc2UsXHJcbiAgICAgICAgICAgIHNpbXVsYXRlUmVhZERlbGF5OiAwLFxyXG4gICAgICAgICAgICBzaW11bGF0ZVVwbG9hZFNwZWVkOiAwLFxyXG4gICAgICAgICAgICBzaW11bGF0ZVdyaXRlRGVsYXk6IDAsXHJcbiAgICAgICAgICAgIHN0b3Jlc1BhdGg6ICd1ZnMnLFxyXG4gICAgICAgICAgICB0bXBEaXI6ICcvdG1wL3VmcycsXHJcbiAgICAgICAgICAgIHRtcERpclBlcm1pc3Npb25zOiAnMDcwMCdcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zICYmICEob3B0aW9ucy5kZWZhdWx0U3RvcmVQZXJtaXNzaW9ucyBpbnN0YW5jZW9mIFN0b3JlUGVybWlzc2lvbnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgaXMgbm90IGFuIGluc3RhbmNlIG9mIFN0b3JlUGVybWlzc2lvbnMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmh0dHBzICE9PSAnYm9vbGVhbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29uZmlnOiBodHRwcyBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc2ltdWxhdGVSZWFkRGVsYXkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogc2ltdWxhdGVSZWFkRGVsYXkgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zaW11bGF0ZVVwbG9hZFNwZWVkICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHNpbXVsYXRlVXBsb2FkU3BlZWQgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zaW11bGF0ZVdyaXRlRGVsYXkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0NvbmZpZzogc2ltdWxhdGVXcml0ZURlbGF5IGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3RvcmVzUGF0aCAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ29uZmlnOiBzdG9yZXNQYXRoIGlzIG5vdCBhIHN0cmluZycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudG1wRGlyICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHRtcERpciBpcyBub3QgYSBzdHJpbmcnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRtcERpclBlcm1pc3Npb25zICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25maWc6IHRtcERpclBlcm1pc3Npb25zIGlzIG5vdCBhIHN0cmluZycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRGVmYXVsdCBzdG9yZSBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAqIEB0eXBlIHtVcGxvYWRGUy5TdG9yZVBlcm1pc3Npb25zfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgPSBvcHRpb25zLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFVzZSBvciBub3Qgc2VjdXJlZCBwcm90b2NvbCBpbiBVUkxTXHJcbiAgICAgICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5odHRwcyA9IG9wdGlvbnMuaHR0cHM7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHNpbXVsYXRpb24gcmVhZCBkZWxheVxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVJlYWREZWxheSA9IHBhcnNlSW50KG9wdGlvbnMuc2ltdWxhdGVSZWFkRGVsYXkpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBzaW11bGF0aW9uIHVwbG9hZCBzcGVlZFxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVVwbG9hZFNwZWVkID0gcGFyc2VJbnQob3B0aW9ucy5zaW11bGF0ZVVwbG9hZFNwZWVkKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGUgc2ltdWxhdGlvbiB3cml0ZSBkZWxheVxyXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zaW11bGF0ZVdyaXRlRGVsYXkgPSBwYXJzZUludChvcHRpb25zLnNpbXVsYXRlV3JpdGVEZWxheSk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIFVSTCByb290IHBhdGggb2Ygc3RvcmVzXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0b3Jlc1BhdGggPSBvcHRpb25zLnN0b3Jlc1BhdGg7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhlIHRlbXBvcmFyeSBkaXJlY3Rvcnkgb2YgdXBsb2FkaW5nIGZpbGVzXHJcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRtcERpciA9IG9wdGlvbnMudG1wRGlyO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoZSBwZXJtaXNzaW9ucyBvZiB0aGUgdGVtcG9yYXJ5IGRpcmVjdG9yeVxyXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50bXBEaXJQZXJtaXNzaW9ucyA9IG9wdGlvbnMudG1wRGlyUGVybWlzc2lvbnM7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcbmltcG9ydCB7X30gZnJvbSBcIm1ldGVvci91bmRlcnNjb3JlXCI7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBGaWxlIGZpbHRlclxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZpbHRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBEZWZhdWx0IG9wdGlvbnNcclxuICAgICAgICBvcHRpb25zID0gXy5leHRlbmQoe1xyXG4gICAgICAgICAgICBjb250ZW50VHlwZXM6IG51bGwsXHJcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IG51bGwsXHJcbiAgICAgICAgICAgIG1pblNpemU6IDEsXHJcbiAgICAgICAgICAgIG1heFNpemU6IDAsXHJcbiAgICAgICAgICAgIG9uQ2hlY2s6IHRoaXMub25DaGVja1xyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBvcHRpb25zXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY29udGVudFR5cGVzICYmICEob3B0aW9ucy5jb250ZW50VHlwZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZpbHRlcjogY29udGVudFR5cGVzIGlzIG5vdCBhbiBBcnJheVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZXh0ZW5zaW9ucyAmJiAhKG9wdGlvbnMuZXh0ZW5zaW9ucyBpbnN0YW5jZW9mIEFycmF5KSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmlsdGVyOiBleHRlbnNpb25zIGlzIG5vdCBhbiBBcnJheVwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1pblNpemUgIT09IFwibnVtYmVyXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZpbHRlcjogbWluU2l6ZSBpcyBub3QgYSBudW1iZXJcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tYXhTaXplICE9PSBcIm51bWJlclwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGaWx0ZXI6IG1heFNpemUgaXMgbm90IGEgbnVtYmVyXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5vbkNoZWNrICYmIHR5cGVvZiBvcHRpb25zLm9uQ2hlY2sgIT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmlsdGVyOiBvbkNoZWNrIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHVibGljIGF0dHJpYnV0ZXNcclxuICAgICAgICBzZWxmLm9wdGlvbnMgPSBvcHRpb25zO1xyXG4gICAgICAgIF8uZWFjaChbXHJcbiAgICAgICAgICAgICdvbkNoZWNrJ1xyXG4gICAgICAgIF0sIChtZXRob2QpID0+IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zW21ldGhvZF0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHNlbGZbbWV0aG9kXSA9IG9wdGlvbnNbbWV0aG9kXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBjaGVjayhmaWxlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBmaWxlICE9PSBcIm9iamVjdFwiIHx8ICFmaWxlKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZScsIFwiRmlsZSBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIHNpemVcclxuICAgICAgICBpZiAoZmlsZS5zaXplIDw9IDAgfHwgZmlsZS5zaXplIDwgdGhpcy5nZXRNaW5TaXplKCkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZmlsZS10b28tc21hbGwnLCBgRmlsZSBzaXplIGlzIHRvbyBzbWFsbCAobWluID0gJHt0aGlzLmdldE1pblNpemUoKX0pYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmdldE1heFNpemUoKSA+IDAgJiYgZmlsZS5zaXplID4gdGhpcy5nZXRNYXhTaXplKCkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZmlsZS10b28tbGFyZ2UnLCBgRmlsZSBzaXplIGlzIHRvbyBsYXJnZSAobWF4ID0gJHt0aGlzLmdldE1heFNpemUoKX0pYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIENoZWNrIGV4dGVuc2lvblxyXG4gICAgICAgIGlmICh0aGlzLmdldEV4dGVuc2lvbnMoKSAmJiAhXy5jb250YWlucyh0aGlzLmdldEV4dGVuc2lvbnMoKSwgZmlsZS5leHRlbnNpb24pKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZS1leHRlbnNpb24nLCBgRmlsZSBleHRlbnNpb24gXCIke2ZpbGUuZXh0ZW5zaW9ufVwiIGlzIG5vdCBhY2NlcHRlZGApO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBDaGVjayBjb250ZW50IHR5cGVcclxuICAgICAgICBpZiAodGhpcy5nZXRDb250ZW50VHlwZXMoKSAmJiAhdGhpcy5pc0NvbnRlbnRUeXBlSW5MaXN0KGZpbGUudHlwZSwgdGhpcy5nZXRDb250ZW50VHlwZXMoKSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlLXR5cGUnLCBgRmlsZSB0eXBlIFwiJHtmaWxlLnR5cGV9XCIgaXMgbm90IGFjY2VwdGVkYCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEFwcGx5IGN1c3RvbSBjaGVja1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vbkNoZWNrID09PSAnZnVuY3Rpb24nICYmICF0aGlzLm9uQ2hlY2soZmlsZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlJywgXCJGaWxlIGRvZXMgbm90IG1hdGNoIGZpbHRlclwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBhbGxvd2VkIGNvbnRlbnQgdHlwZXNcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRDb250ZW50VHlwZXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb250ZW50VHlwZXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBhbGxvd2VkIGV4dGVuc2lvbnNcclxuICAgICAqIEByZXR1cm4ge0FycmF5fVxyXG4gICAgICovXHJcbiAgICBnZXRFeHRlbnNpb25zKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZXh0ZW5zaW9ucztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIG1heGltdW0gZmlsZSBzaXplXHJcbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldE1heFNpemUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5tYXhTaXplO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgbWluaW11bSBmaWxlIHNpemVcclxuICAgICAqIEByZXR1cm4ge051bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0TWluU2l6ZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLm1pblNpemU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgaWYgY29udGVudCB0eXBlIGlzIGluIHRoZSBnaXZlbiBsaXN0XHJcbiAgICAgKiBAcGFyYW0gdHlwZVxyXG4gICAgICogQHBhcmFtIGxpc3RcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGlzQ29udGVudFR5cGVJbkxpc3QodHlwZSwgbGlzdCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgJiYgbGlzdCBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKGxpc3QsIHR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB3aWxkQ2FyZEdsb2IgPSAnLyonO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdpbGRjYXJkcyA9IF8uZmlsdGVyKGxpc3QsIChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uaW5kZXhPZih3aWxkQ2FyZEdsb2IpID4gMDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKHdpbGRjYXJkcywgdHlwZS5yZXBsYWNlKC8oXFwvLiopJC8sIHdpbGRDYXJkR2xvYikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIGlmIHRoZSBmaWxlIG1hdGNoZXMgZmlsdGVyXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgaXNWYWxpZChmaWxlKSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5jaGVjayhmaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFeGVjdXRlcyBjdXN0b20gY2hlY2tzXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgb25DaGVjayhmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuaW1wb3J0IHtjaGVja30gZnJvbSAnbWV0ZW9yL2NoZWNrJztcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xyXG5pbXBvcnQge1VwbG9hZEZTfSBmcm9tICcuL3Vmcyc7XHJcbmltcG9ydCB7RmlsdGVyfSBmcm9tICcuL3Vmcy1maWx0ZXInO1xyXG5pbXBvcnQge1Rva2Vuc30gZnJvbSAnLi91ZnMtdG9rZW5zJztcclxuXHJcbmNvbnN0IGZzID0gTnBtLnJlcXVpcmUoJ2ZzJyk7XHJcbmNvbnN0IGh0dHAgPSBOcG0ucmVxdWlyZSgnaHR0cCcpO1xyXG5jb25zdCBodHRwcyA9IE5wbS5yZXF1aXJlKCdodHRwcycpO1xyXG5jb25zdCBGdXR1cmUgPSBOcG0ucmVxdWlyZSgnZmliZXJzL2Z1dHVyZScpO1xyXG5cclxuXHJcbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgIE1ldGVvci5tZXRob2RzKHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ29tcGxldGVzIHRoZSBmaWxlIHRyYW5zZmVyXHJcbiAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAqIEBwYXJhbSBzdG9yZU5hbWVcclxuICAgICAgICAgKiBAcGFyYW0gdG9rZW5cclxuICAgICAgICAgKi9cclxuICAgICAgICB1ZnNDb21wbGV0ZShmaWxlSWQsIHN0b3JlTmFtZSwgdG9rZW4pIHtcclxuICAgICAgICAgICAgY2hlY2soZmlsZUlkLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICBjaGVjayhzdG9yZU5hbWUsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKHRva2VuLCBTdHJpbmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc3RvcmUnLCBcIlN0b3JlIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDaGVjayB0b2tlblxyXG4gICAgICAgICAgICBpZiAoIXN0b3JlLmNoZWNrVG9rZW4odG9rZW4sIGZpbGVJZCkpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdG9rZW4nLCBcIlRva2VuIGlzIG5vdCB2YWxpZFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcclxuICAgICAgICAgICAgbGV0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZUlkKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHJlbW92ZVRlbXBGaWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZnMudW5saW5rKHRtcEZpbGUsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlcnIgJiYgY29uc29sZS5lcnJvcihgdWZzOiBjYW5ub3QgZGVsZXRlIHRlbXAgZmlsZSBcIiR7dG1wRmlsZX1cIiAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyB0b2RvIGNoZWNrIGlmIHRlbXAgZmlsZSBleGlzdHNcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgZmlsZVxyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBzdG9yZS5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZSh7X2lkOiBmaWxlSWR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBWYWxpZGF0ZSBmaWxlIGJlZm9yZSBtb3ZpbmcgdG8gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAgICBzdG9yZS52YWxpZGF0ZShmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIHRlbXAgZmlsZVxyXG4gICAgICAgICAgICAgICAgbGV0IHJzID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0bXBGaWxlLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmxhZ3M6ICdyJyxcclxuICAgICAgICAgICAgICAgICAgICBlbmNvZGluZzogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBhdXRvQ2xvc2U6IHRydWVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwbG9hZCBpZiBlcnJvciBvY2N1cnNcclxuICAgICAgICAgICAgICAgIHJzLm9uKCdlcnJvcicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICBzdG9yZS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1dC50aHJvdyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgZmlsZSBpbiB0aGUgc3RvcmVcclxuICAgICAgICAgICAgICAgIHN0b3JlLndyaXRlKHJzLCBmaWxlSWQsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVyciwgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZVRlbXBGaWxlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnV0LnRocm93KGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlsZSBoYXMgYmVlbiBmdWxseSB1cGxvYWRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdGhlIHRva2VuIGFueW1vcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsc28gdGhpcyBlbnN1cmUgdGhhdCB0aGUgZmlsZSBjYW5ub3QgYmUgbW9kaWZpZWQgd2l0aCBleHRyYSBjaHVua3MgbGF0ZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFRva2Vucy5yZW1vdmUoe2ZpbGVJZDogZmlsZUlkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1dC5yZXR1cm4oZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHdyaXRlIGZhaWxlZCwgcmVtb3ZlIHRoZSBmaWxlXHJcbiAgICAgICAgICAgICAgICBzdG9yZS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlVGVtcEZpbGUoKTtcclxuICAgICAgICAgICAgICAgIGZ1dC50aHJvdyhlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBmdXQud2FpdCgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIENyZWF0ZXMgdGhlIGZpbGUgYW5kIHJldHVybnMgdGhlIGZpbGUgdXBsb2FkIHRva2VuXHJcbiAgICAgICAgICogQHBhcmFtIGZpbGVcclxuICAgICAgICAgKiBAcmV0dXJuIHt7ZmlsZUlkOiBzdHJpbmcsIHRva2VuOiAqLCB1cmw6ICp9fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHVmc0NyZWF0ZShmaWxlKSB7XHJcbiAgICAgICAgICAgIGNoZWNrKGZpbGUsIE9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpbGUubmFtZSAhPT0gJ3N0cmluZycgfHwgIWZpbGUubmFtZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZS1uYW1lJywgXCJmaWxlIG5hbWUgaXMgbm90IHZhbGlkXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmlsZS5zdG9yZSAhPT0gJ3N0cmluZycgfHwgIWZpbGUuc3RvcmUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXN0b3JlJywgXCJzdG9yZSBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKGZpbGUuc3RvcmUpO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXN0b3JlJywgXCJTdG9yZSBub3QgZm91bmRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBkZWZhdWx0IGluZm9cclxuICAgICAgICAgICAgZmlsZS5jb21wbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmaWxlLnVwbG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmaWxlLmV4dGVuc2lvbiA9IGZpbGUubmFtZSAmJiBmaWxlLm5hbWUuc3Vic3RyKCh+LWZpbGUubmFtZS5sYXN0SW5kZXhPZignLicpID4+PiAwKSArIDIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIC8vIEFzc2lnbiBmaWxlIE1JTUUgdHlwZSBiYXNlZCBvbiB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgIGlmIChmaWxlLmV4dGVuc2lvbiAmJiAhZmlsZS50eXBlKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlLnR5cGUgPSBVcGxvYWRGUy5nZXRNaW1lVHlwZShmaWxlLmV4dGVuc2lvbikgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IDA7XHJcbiAgICAgICAgICAgIGZpbGUuc2l6ZSA9IHBhcnNlSW50KGZpbGUuc2l6ZSkgfHwgMDtcclxuICAgICAgICAgICAgZmlsZS51c2VySWQgPSBmaWxlLnVzZXJJZCB8fCB0aGlzLnVzZXJJZDtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBmaWxlIG1hdGNoZXMgc3RvcmUgZmlsdGVyXHJcbiAgICAgICAgICAgIGxldCBmaWx0ZXIgPSBzdG9yZS5nZXRGaWx0ZXIoKTtcclxuICAgICAgICAgICAgaWYgKGZpbHRlciBpbnN0YW5jZW9mIEZpbHRlcikge1xyXG4gICAgICAgICAgICAgICAgZmlsdGVyLmNoZWNrKGZpbGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGZpbGVcclxuICAgICAgICAgICAgbGV0IGZpbGVJZCA9IHN0b3JlLmNyZWF0ZShmaWxlKTtcclxuICAgICAgICAgICAgbGV0IHRva2VuID0gc3RvcmUuY3JlYXRlVG9rZW4oZmlsZUlkKTtcclxuICAgICAgICAgICAgbGV0IHVwbG9hZFVybCA9IHN0b3JlLmdldFVSTChgJHtmaWxlSWR9P3Rva2VuPSR7dG9rZW59YCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgZmlsZUlkOiBmaWxlSWQsXHJcbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXHJcbiAgICAgICAgICAgICAgICB1cmw6IHVwbG9hZFVybFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIERlbGV0ZXMgYSBmaWxlXHJcbiAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAqIEBwYXJhbSBzdG9yZU5hbWVcclxuICAgICAgICAgKiBAcGFyYW0gdG9rZW5cclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB1ZnNEZWxldGUoZmlsZUlkLCBzdG9yZU5hbWUsIHRva2VuKSB7XHJcbiAgICAgICAgICAgIGNoZWNrKGZpbGVJZCwgU3RyaW5nKTtcclxuICAgICAgICAgICAgY2hlY2soc3RvcmVOYW1lLCBTdHJpbmcpO1xyXG4gICAgICAgICAgICBjaGVjayh0b2tlbiwgU3RyaW5nKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHN0b3JlXHJcbiAgICAgICAgICAgIGxldCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc3RvcmUnLCBcIlN0b3JlIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBJZ25vcmUgZmlsZXMgdGhhdCBkb2VzIG5vdCBleGlzdFxyXG4gICAgICAgICAgICBpZiAoc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmZpbmQoe19pZDogZmlsZUlkfSkuY291bnQoKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgdG9rZW5cclxuICAgICAgICAgICAgaWYgKCFzdG9yZS5jaGVja1Rva2VuKHRva2VuLCBmaWxlSWQpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRva2VuJywgXCJUb2tlbiBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHN0b3JlLmdldENvbGxlY3Rpb24oKS5yZW1vdmUoe19pZDogZmlsZUlkfSk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSW1wb3J0cyBhIGZpbGUgZnJvbSB0aGUgVVJMXHJcbiAgICAgICAgICogQHBhcmFtIHVybFxyXG4gICAgICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgICAgICogQHBhcmFtIHN0b3JlTmFtZVxyXG4gICAgICAgICAqIEByZXR1cm4geyp9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdWZzSW1wb3J0VVJMKHVybCwgZmlsZSwgc3RvcmVOYW1lKSB7XHJcbiAgICAgICAgICAgIGNoZWNrKHVybCwgU3RyaW5nKTtcclxuICAgICAgICAgICAgY2hlY2soZmlsZSwgT2JqZWN0KTtcclxuICAgICAgICAgICAgY2hlY2soc3RvcmVOYW1lLCBTdHJpbmcpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgVVJMXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXJsICE9PSAnc3RyaW5nJyB8fCB1cmwubGVuZ3RoIDw9IDApIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtdXJsJywgXCJUaGUgdXJsIGlzIG5vdCB2YWxpZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDaGVjayBmaWxlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmlsZSAhPT0gJ29iamVjdCcgfHwgZmlsZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignaW52YWxpZC1maWxlJywgXCJUaGUgZmlsZSBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgc3RvcmVcclxuICAgICAgICAgICAgY29uc3Qgc3RvcmUgPSBVcGxvYWRGUy5nZXRTdG9yZShzdG9yZU5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXN0b3JlJywgJ1RoZSBzdG9yZSBkb2VzIG5vdCBleGlzdCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBFeHRyYWN0IGZpbGUgaW5mb1xyXG4gICAgICAgICAgICBpZiAoIWZpbGUubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgZmlsZS5uYW1lID0gdXJsLnJlcGxhY2UoL1xcPy4qJC8sICcnKS5zcGxpdCgnLycpLnBvcCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChmaWxlLm5hbWUgJiYgIWZpbGUuZXh0ZW5zaW9uKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlLmV4dGVuc2lvbiA9IGZpbGUubmFtZSAmJiBmaWxlLm5hbWUuc3Vic3RyKCh+LWZpbGUubmFtZS5sYXN0SW5kZXhPZignLicpID4+PiAwKSArIDIpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGZpbGUuZXh0ZW5zaW9uICYmICFmaWxlLnR5cGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFzc2lnbiBmaWxlIE1JTUUgdHlwZSBiYXNlZCBvbiB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgICAgICBmaWxlLnR5cGUgPSBVcGxvYWRGUy5nZXRNaW1lVHlwZShmaWxlLmV4dGVuc2lvbikgfHwgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgZmlsZSBpcyB2YWxpZFxyXG4gICAgICAgICAgICBpZiAoc3RvcmUuZ2V0RmlsdGVyKCkgaW5zdGFuY2VvZiBGaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIHN0b3JlLmdldEZpbHRlcigpLmNoZWNrKGZpbGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsZS5vcmlnaW5hbFVybCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGB1ZnM6IFRoZSBcIm9yaWdpbmFsVXJsXCIgYXR0cmlidXRlIGlzIGF1dG9tYXRpY2FsbHkgc2V0IHdoZW4gaW1wb3J0aW5nIGEgZmlsZSBmcm9tIGEgVVJMYCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBvcmlnaW5hbCBVUkxcclxuICAgICAgICAgICAgZmlsZS5vcmlnaW5hbFVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgZmlsZVxyXG4gICAgICAgICAgICBmaWxlLmNvbXBsZXRlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZpbGUudXBsb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgZmlsZS5wcm9ncmVzcyA9IDA7XHJcbiAgICAgICAgICAgIGZpbGUuX2lkID0gc3RvcmUuY3JlYXRlKGZpbGUpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZ1dCA9IG5ldyBGdXR1cmUoKTtcclxuICAgICAgICAgICAgbGV0IHByb3RvO1xyXG5cclxuICAgICAgICAgICAgLy8gRGV0ZWN0IHByb3RvY29sIHRvIHVzZVxyXG4gICAgICAgICAgICBpZiAoL2h0dHA6XFwvXFwvL2kudGVzdCh1cmwpKSB7XHJcbiAgICAgICAgICAgICAgICBwcm90byA9IGh0dHA7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoL2h0dHBzOlxcL1xcLy9pLnRlc3QodXJsKSkge1xyXG4gICAgICAgICAgICAgICAgcHJvdG8gPSBodHRwcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy51bmJsb2NrKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBEb3dubG9hZCBmaWxlXHJcbiAgICAgICAgICAgIHByb3RvLmdldCh1cmwsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKHJlcykge1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgZmlsZSBpbiB0aGUgc3RvcmVcclxuICAgICAgICAgICAgICAgIHN0b3JlLndyaXRlKHJlcywgZmlsZS5faWQsIGZ1bmN0aW9uIChlcnIsIGZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1dC50aHJvdyhlcnIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1dC5yZXR1cm4oZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pKS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBmdXQudGhyb3coZXJyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmdXQud2FpdCgpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIE1hcmtzIHRoZSBmaWxlIHVwbG9hZGluZyBhcyBzdG9wcGVkXHJcbiAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAqIEBwYXJhbSBzdG9yZU5hbWVcclxuICAgICAgICAgKiBAcGFyYW0gdG9rZW5cclxuICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB1ZnNTdG9wKGZpbGVJZCwgc3RvcmVOYW1lLCB0b2tlbikge1xyXG4gICAgICAgICAgICBjaGVjayhmaWxlSWQsIFN0cmluZyk7XHJcbiAgICAgICAgICAgIGNoZWNrKHN0b3JlTmFtZSwgU3RyaW5nKTtcclxuICAgICAgICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayBzdG9yZVxyXG4gICAgICAgICAgICBjb25zdCBzdG9yZSA9IFVwbG9hZEZTLmdldFN0b3JlKHN0b3JlTmFtZSk7XHJcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtc3RvcmUnLCBcIlN0b3JlIG5vdCBmb3VuZFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBDaGVjayBmaWxlXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSBzdG9yZS5nZXRDb2xsZWN0aW9uKCkuZmluZCh7X2lkOiBmaWxlSWR9LCB7ZmllbGRzOiB7dXNlcklkOiAxfX0pO1xyXG4gICAgICAgICAgICBpZiAoIWZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2ludmFsaWQtZmlsZScsIFwiRmlsZSBub3QgZm91bmRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gQ2hlY2sgdG9rZW5cclxuICAgICAgICAgICAgaWYgKCFzdG9yZS5jaGVja1Rva2VuKHRva2VuLCBmaWxlSWQpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdpbnZhbGlkLXRva2VuJywgXCJUb2tlbiBpcyBub3QgdmFsaWRcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBzdG9yZS5nZXRDb2xsZWN0aW9uKCkudXBkYXRlKHtfaWQ6IGZpbGVJZH0sIHtcclxuICAgICAgICAgICAgICAgICRzZXQ6IHt1cGxvYWRpbmc6IGZhbHNlfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iLCIvKlxyXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE3IEthcmwgU1RFSU5cclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxyXG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcclxuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXHJcbiAqIFNPRlRXQVJFLlxyXG4gKlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBNSU1FIHR5cGVzIGFuZCBleHRlbnNpb25zXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgTUlNRSA9IHtcclxuXHJcbiAgICAvLyBhcHBsaWNhdGlvblxyXG4gICAgJzd6JzogJ2FwcGxpY2F0aW9uL3gtN3otY29tcHJlc3NlZCcsXHJcbiAgICAnYXJjJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgICAnYWknOiAnYXBwbGljYXRpb24vcG9zdHNjcmlwdCcsXHJcbiAgICAnYmluJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgICAnYnonOiAnYXBwbGljYXRpb24veC1iemlwJyxcclxuICAgICdiejInOiAnYXBwbGljYXRpb24veC1iemlwMicsXHJcbiAgICAnZXBzJzogJ2FwcGxpY2F0aW9uL3Bvc3RzY3JpcHQnLFxyXG4gICAgJ2V4ZSc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxyXG4gICAgJ2d6JzogJ2FwcGxpY2F0aW9uL3gtZ3ppcCcsXHJcbiAgICAnZ3ppcCc6ICdhcHBsaWNhdGlvbi94LWd6aXAnLFxyXG4gICAgJ2pzJzogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnLFxyXG4gICAgJ2pzb24nOiAnYXBwbGljYXRpb24vanNvbicsXHJcbiAgICAnb2d4JzogJ2FwcGxpY2F0aW9uL29nZycsXHJcbiAgICAncGRmJzogJ2FwcGxpY2F0aW9uL3BkZicsXHJcbiAgICAncHMnOiAnYXBwbGljYXRpb24vcG9zdHNjcmlwdCcsXHJcbiAgICAncHNkJzogJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScsXHJcbiAgICAncmFyJzogJ2FwcGxpY2F0aW9uL3gtcmFyLWNvbXByZXNzZWQnLFxyXG4gICAgJ3Jldic6ICdhcHBsaWNhdGlvbi94LXJhci1jb21wcmVzc2VkJyxcclxuICAgICdzd2YnOiAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxyXG4gICAgJ3Rhcic6ICdhcHBsaWNhdGlvbi94LXRhcicsXHJcbiAgICAneGh0bWwnOiAnYXBwbGljYXRpb24veGh0bWwreG1sJyxcclxuICAgICd4bWwnOiAnYXBwbGljYXRpb24veG1sJyxcclxuICAgICd6aXAnOiAnYXBwbGljYXRpb24vemlwJyxcclxuXHJcbiAgICAvLyBhdWRpb1xyXG4gICAgJ2FpZic6ICdhdWRpby9haWZmJyxcclxuICAgICdhaWZjJzogJ2F1ZGlvL2FpZmYnLFxyXG4gICAgJ2FpZmYnOiAnYXVkaW8vYWlmZicsXHJcbiAgICAnYXUnOiAnYXVkaW8vYmFzaWMnLFxyXG4gICAgJ2ZsYWMnOiAnYXVkaW8vZmxhYycsXHJcbiAgICAnbWlkaSc6ICdhdWRpby9taWRpJyxcclxuICAgICdtcDInOiAnYXVkaW8vbXBlZycsXHJcbiAgICAnbXAzJzogJ2F1ZGlvL21wZWcnLFxyXG4gICAgJ21wYSc6ICdhdWRpby9tcGVnJyxcclxuICAgICdvZ2EnOiAnYXVkaW8vb2dnJyxcclxuICAgICdvZ2cnOiAnYXVkaW8vb2dnJyxcclxuICAgICdvcHVzJzogJ2F1ZGlvL29nZycsXHJcbiAgICAncmEnOiAnYXVkaW8vdm5kLnJuLXJlYWxhdWRpbycsXHJcbiAgICAnc3B4JzogJ2F1ZGlvL29nZycsXHJcbiAgICAnd2F2JzogJ2F1ZGlvL3gtd2F2JyxcclxuICAgICd3ZWJhJzogJ2F1ZGlvL3dlYm0nLFxyXG4gICAgJ3dtYSc6ICdhdWRpby94LW1zLXdtYScsXHJcblxyXG4gICAgLy8gaW1hZ2VcclxuICAgICdhdnMnOiAnaW1hZ2UvYXZzLXZpZGVvJyxcclxuICAgICdibXAnOiAnaW1hZ2UveC13aW5kb3dzLWJtcCcsXHJcbiAgICAnZ2lmJzogJ2ltYWdlL2dpZicsXHJcbiAgICAnaWNvJzogJ2ltYWdlL3ZuZC5taWNyb3NvZnQuaWNvbicsXHJcbiAgICAnanBlZyc6ICdpbWFnZS9qcGVnJyxcclxuICAgICdqcGcnOiAnaW1hZ2UvanBnJyxcclxuICAgICdtanBnJzogJ2ltYWdlL3gtbW90aW9uLWpwZWcnLFxyXG4gICAgJ3BpYyc6ICdpbWFnZS9waWMnLFxyXG4gICAgJ3BuZyc6ICdpbWFnZS9wbmcnLFxyXG4gICAgJ3N2Zyc6ICdpbWFnZS9zdmcreG1sJyxcclxuICAgICd0aWYnOiAnaW1hZ2UvdGlmZicsXHJcbiAgICAndGlmZic6ICdpbWFnZS90aWZmJyxcclxuXHJcbiAgICAvLyB0ZXh0XHJcbiAgICAnY3NzJzogJ3RleHQvY3NzJyxcclxuICAgICdjc3YnOiAndGV4dC9jc3YnLFxyXG4gICAgJ2h0bWwnOiAndGV4dC9odG1sJyxcclxuICAgICd0eHQnOiAndGV4dC9wbGFpbicsXHJcblxyXG4gICAgLy8gdmlkZW9cclxuICAgICdhdmknOiAndmlkZW8vYXZpJyxcclxuICAgICdkdic6ICd2aWRlby94LWR2JyxcclxuICAgICdmbHYnOiAndmlkZW8veC1mbHYnLFxyXG4gICAgJ21vdic6ICd2aWRlby9xdWlja3RpbWUnLFxyXG4gICAgJ21wNCc6ICd2aWRlby9tcDQnLFxyXG4gICAgJ21wZWcnOiAndmlkZW8vbXBlZycsXHJcbiAgICAnbXBnJzogJ3ZpZGVvL21wZycsXHJcbiAgICAnb2d2JzogJ3ZpZGVvL29nZycsXHJcbiAgICAndmRvJzogJ3ZpZGVvL3ZkbycsXHJcbiAgICAnd2VibSc6ICd2aWRlby93ZWJtJyxcclxuICAgICd3bXYnOiAndmlkZW8veC1tcy13bXYnLFxyXG5cclxuICAgIC8vIHNwZWNpZmljIHRvIHZlbmRvcnNcclxuICAgICdkb2MnOiAnYXBwbGljYXRpb24vbXN3b3JkJyxcclxuICAgICdkb2N4JzogJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JyxcclxuICAgICdvZGInOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5kYXRhYmFzZScsXHJcbiAgICAnb2RjJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuY2hhcnQnLFxyXG4gICAgJ29kZic6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmZvcm11bGEnLFxyXG4gICAgJ29kZyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzJyxcclxuICAgICdvZGknOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5pbWFnZScsXHJcbiAgICAnb2RtJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQudGV4dC1tYXN0ZXInLFxyXG4gICAgJ29kcCc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbicsXHJcbiAgICAnb2RzJzogJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXQnLFxyXG4gICAgJ29kdCc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQnLFxyXG4gICAgJ290Zyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LmdyYXBoaWNzLXRlbXBsYXRlJyxcclxuICAgICdvdHAnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC5wcmVzZW50YXRpb24tdGVtcGxhdGUnLFxyXG4gICAgJ290cyc6ICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnNwcmVhZHNoZWV0LXRlbXBsYXRlJyxcclxuICAgICdvdHQnOiAnYXBwbGljYXRpb24vdm5kLm9hc2lzLm9wZW5kb2N1bWVudC50ZXh0LXRlbXBsYXRlJyxcclxuICAgICdwcHQnOiAnYXBwbGljYXRpb24vdm5kLm1zLXBvd2VycG9pbnQnLFxyXG4gICAgJ3BwdHgnOiAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnByZXNlbnRhdGlvbm1sLnByZXNlbnRhdGlvbicsXHJcbiAgICAneGxzJzogJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCcsXHJcbiAgICAneGxzeCc6ICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCdcclxufTtcclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcbmltcG9ydCB7X30gZnJvbSBcIm1ldGVvci91bmRlcnNjb3JlXCI7XHJcbmltcG9ydCB7TWV0ZW9yfSBmcm9tIFwibWV0ZW9yL21ldGVvclwiO1xyXG5pbXBvcnQge1dlYkFwcH0gZnJvbSBcIm1ldGVvci93ZWJhcHBcIjtcclxuaW1wb3J0IHtVcGxvYWRGU30gZnJvbSBcIi4vdWZzXCI7XHJcblxyXG5cclxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xyXG5cclxuICAgIGNvbnN0IGRvbWFpbiA9IE5wbS5yZXF1aXJlKCdkb21haW4nKTtcclxuICAgIGNvbnN0IGZzID0gTnBtLnJlcXVpcmUoJ2ZzJyk7XHJcbiAgICBjb25zdCBodHRwID0gTnBtLnJlcXVpcmUoJ2h0dHAnKTtcclxuICAgIGNvbnN0IGh0dHBzID0gTnBtLnJlcXVpcmUoJ2h0dHBzJyk7XHJcbiAgICBjb25zdCBta2RpcnAgPSBOcG0ucmVxdWlyZSgnbWtkaXJwJyk7XHJcbiAgICBjb25zdCBzdHJlYW0gPSBOcG0ucmVxdWlyZSgnc3RyZWFtJyk7XHJcbiAgICBjb25zdCBVUkwgPSBOcG0ucmVxdWlyZSgndXJsJyk7XHJcbiAgICBjb25zdCB6bGliID0gTnBtLnJlcXVpcmUoJ3psaWInKTtcclxuXHJcblxyXG4gICAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xyXG4gICAgICAgIGxldCBwYXRoID0gVXBsb2FkRlMuY29uZmlnLnRtcERpcjtcclxuICAgICAgICBsZXQgbW9kZSA9IFVwbG9hZEZTLmNvbmZpZy50bXBEaXJQZXJtaXNzaW9ucztcclxuXHJcbiAgICAgICAgZnMuc3RhdChwYXRoLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgdGVtcCBkaXJlY3RvcnlcclxuICAgICAgICAgICAgICAgIG1rZGlycChwYXRoLCB7bW9kZTogbW9kZX0sIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IGNyZWF0ZSB0ZW1wIGRpcmVjdG9yeSBhdCBcIiR7cGF0aH1cIiAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYHVmczogdGVtcCBkaXJlY3RvcnkgY3JlYXRlZCBhdCBcIiR7cGF0aH1cImApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gU2V0IGRpcmVjdG9yeSBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICAgICAgZnMuY2htb2QocGF0aCwgbW9kZSwgKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCBzZXQgdGVtcCBkaXJlY3RvcnkgcGVybWlzc2lvbnMgJHttb2RlfSAoJHtlcnIubWVzc2FnZX0pYCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGRvbWFpbiB0byBoYW5kbGUgZXJyb3JzXHJcbiAgICAvLyBhbmQgcG9zc2libHkgYXZvaWQgc2VydmVyIGNyYXNoZXMuXHJcbiAgICBsZXQgZCA9IGRvbWFpbi5jcmVhdGUoKTtcclxuXHJcbiAgICBkLm9uKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCd1ZnM6ICcgKyBlcnIubWVzc2FnZSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMaXN0ZW4gSFRUUCByZXF1ZXN0cyB0byBzZXJ2ZSBmaWxlc1xyXG4gICAgV2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UoKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgLy8gUXVpY2sgY2hlY2sgdG8gc2VlIGlmIHJlcXVlc3Qgc2hvdWxkIGJlIGNhdGNoXHJcbiAgICAgICAgaWYgKHJlcS51cmwuaW5kZXhPZihVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aCkgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIHN0b3JlIHBhdGhcclxuICAgICAgICBsZXQgcGFyc2VkVXJsID0gVVJMLnBhcnNlKHJlcS51cmwpO1xyXG4gICAgICAgIGxldCBwYXRoID0gcGFyc2VkVXJsLnBhdGhuYW1lLnN1YnN0cihVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aC5sZW5ndGggKyAxKTtcclxuXHJcbiAgICAgICAgbGV0IGFsbG93Q09SUyA9ICgpID0+IHtcclxuICAgICAgICAgICAgLy8gcmVzLnNldEhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJywgcmVxLmhlYWRlcnMub3JpZ2luKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIiwgXCJQT1NUXCIpO1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCIsIFwiKlwiKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcihcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIiwgXCJDb250ZW50LVR5cGVcIik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XHJcbiAgICAgICAgICAgIGxldCByZWdFeHAgPSBuZXcgUmVnRXhwKCdeXFwvKFteXFwvXFw/XSspXFwvKFteXFwvXFw/XSspJCcpO1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlcXVlc3QgaXMgbm90IHZhbGlkXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDApO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgc3RvcmVcclxuICAgICAgICAgICAgbGV0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUobWF0Y2hbMV0pO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIGEgc3RvcmUgaXMgZm91bmQsIGdvIGFoZWFkIGFuZCBhbGxvdyB0aGUgb3JpZ2luXHJcbiAgICAgICAgICAgIGFsbG93Q09SUygpO1xyXG5cclxuICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChyZXEubWV0aG9kID09PSAnUE9TVCcpIHtcclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlXHJcbiAgICAgICAgICAgIGxldCByZWdFeHAgPSBuZXcgUmVnRXhwKCdeXFwvKFteXFwvXFw/XSspXFwvKFteXFwvXFw/XSspJCcpO1xyXG4gICAgICAgICAgICBsZXQgbWF0Y2ggPSByZWdFeHAuZXhlYyhwYXRoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlcXVlc3QgaXMgbm90IHZhbGlkXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDApO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgc3RvcmVcclxuICAgICAgICAgICAgbGV0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUobWF0Y2hbMV0pO1xyXG4gICAgICAgICAgICBpZiAoIXN0b3JlKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwNCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIElmIGEgc3RvcmUgaXMgZm91bmQsIGdvIGFoZWFkIGFuZCBhbGxvdyB0aGUgb3JpZ2luXHJcbiAgICAgICAgICAgIGFsbG93Q09SUygpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGZpbGVcclxuICAgICAgICAgICAgbGV0IGZpbGVJZCA9IG1hdGNoWzJdO1xyXG4gICAgICAgICAgICBpZiAoc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmZpbmQoe19pZDogZmlsZUlkfSkuY291bnQoKSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDaGVjayB1cGxvYWQgdG9rZW5cclxuICAgICAgICAgICAgaWYgKCFzdG9yZS5jaGVja1Rva2VuKHJlcS5xdWVyeS50b2tlbiwgZmlsZUlkKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDMpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgdG1wRmlsZSA9IFVwbG9hZEZTLmdldFRlbXBGaWxlUGF0aChmaWxlSWQpO1xyXG4gICAgICAgICAgICBsZXQgd3MgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0bXBGaWxlLCB7ZmxhZ3M6ICdhJ30pO1xyXG4gICAgICAgICAgICBsZXQgZmllbGRzID0ge3VwbG9hZGluZzogdHJ1ZX07XHJcbiAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlRmxvYXQocmVxLnF1ZXJ5LnByb2dyZXNzKTtcclxuICAgICAgICAgICAgaWYgKCFpc05hTihwcm9ncmVzcykgJiYgcHJvZ3Jlc3MgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZHMucHJvZ3Jlc3MgPSBNYXRoLm1pbihwcm9ncmVzcywgMSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuaykgPT4ge1xyXG4gICAgICAgICAgICAgICAgd3Mud3JpdGUoY2h1bmspO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwKTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlcS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBVcGRhdGUgY29tcGxldGVkIHN0YXRlIHdpdGhvdXQgdHJpZ2dlcmluZyBob29rc1xyXG4gICAgICAgICAgICAgICAgc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmRpcmVjdC51cGRhdGUoe19pZDogZmlsZUlkfSwgeyRzZXQ6IGZpZWxkc30pO1xyXG4gICAgICAgICAgICAgICAgd3MuZW5kKCk7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgd3Mub24oJ2Vycm9yJywgKGVycikgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdWZzOiBjYW5ub3Qgd3JpdGUgY2h1bmsgb2YgZmlsZSBcIiR7ZmlsZUlkfVwiICgke2Vyci5tZXNzYWdlfSlgKTtcclxuICAgICAgICAgICAgICAgIGZzLnVubGluayh0bXBGaWxlLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyICYmIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IGRlbGV0ZSB0ZW1wIGZpbGUgXCIke3RtcEZpbGV9XCIgKCR7ZXJyLm1lc3NhZ2V9KWApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB3cy5vbignZmluaXNoJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDQsIHtcIkNvbnRlbnQtVHlwZVwiOiAndGV4dC9wbGFpbid9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHJlcS5tZXRob2QgPT0gJ0dFVCcpIHtcclxuICAgICAgICAgICAgLy8gR2V0IHN0b3JlLCBmaWxlIElkIGFuZCBmaWxlIG5hbWVcclxuICAgICAgICAgICAgbGV0IHJlZ0V4cCA9IG5ldyBSZWdFeHAoJ15cXC8oW15cXC9cXD9dKylcXC8oW15cXC9cXD9dKykoPzpcXC8oW15cXC9cXD9dKykpPyQnKTtcclxuICAgICAgICAgICAgbGV0IG1hdGNoID0gcmVnRXhwLmV4ZWMocGF0aCk7XHJcblxyXG4gICAgICAgICAgICAvLyBBdm9pZCA1MDQgR2F0ZXdheSB0aW1lb3V0IGVycm9yXHJcbiAgICAgICAgICAgIC8vIGlmIGZpbGUgaXMgbm90IGhhbmRsZWQgYnkgVXBsb2FkRlMuXHJcbiAgICAgICAgICAgIGlmIChtYXRjaCA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBHZXQgc3RvcmVcclxuICAgICAgICAgICAgY29uc3Qgc3RvcmVOYW1lID0gbWF0Y2hbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IHN0b3JlID0gVXBsb2FkRlMuZ2V0U3RvcmUoc3RvcmVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc3RvcmUpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA0KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHN0b3JlLm9uUmVhZCAhPT0gbnVsbCAmJiBzdG9yZS5vblJlYWQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc3RvcmUub25SZWFkICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGB1ZnM6IFN0b3JlLm9uUmVhZCBpcyBub3QgYSBmdW5jdGlvbiBpbiBzdG9yZSBcIiR7c3RvcmVOYW1lfVwiYCk7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmaWxlIGV4dGVuc2lvbiBmcm9tIGZpbGUgSWRcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gbWF0Y2hbMl0uaW5kZXhPZignLicpO1xyXG4gICAgICAgICAgICBsZXQgZmlsZUlkID0gaW5kZXggIT09IC0xID8gbWF0Y2hbMl0uc3Vic3RyKDAsIGluZGV4KSA6IG1hdGNoWzJdO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGZpbGUgZnJvbSBkYXRhYmFzZVxyXG4gICAgICAgICAgICBjb25zdCBmaWxlID0gc3RvcmUuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XHJcbiAgICAgICAgICAgIGlmICghZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDQpO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTaW11bGF0ZSByZWFkIHNwZWVkXHJcbiAgICAgICAgICAgIGlmIChVcGxvYWRGUy5jb25maWcuc2ltdWxhdGVSZWFkRGVsYXkpIHtcclxuICAgICAgICAgICAgICAgIE1ldGVvci5fc2xlZXBGb3JNcyhVcGxvYWRGUy5jb25maWcuc2ltdWxhdGVSZWFkRGVsYXkpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkLnJ1bigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgZmlsZSBjYW4gYmUgYWNjZXNzZWRcclxuICAgICAgICAgICAgICAgIGlmIChzdG9yZS5vblJlYWQuY2FsbChzdG9yZSwgZmlsZUlkLCBmaWxlLCByZXEsIHJlcykgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9wdGlvbnMgPSB7fTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3RhdHVzID0gMjAwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBQcmVwYXJlIHJlc3BvbnNlIGhlYWRlcnNcclxuICAgICAgICAgICAgICAgICAgICBsZXQgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6IGZpbGUudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogZmlsZS5zaXplXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIEVUYWcgaGVhZGVyXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWxlLmV0YWcgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0VUYWcnXSA9IGZpbGUuZXRhZztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFkZCBMYXN0LU1vZGlmaWVkIGhlYWRlclxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlLm1vZGlmaWVkQXQgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0xhc3QtTW9kaWZpZWQnXSA9IGZpbGUubW9kaWZpZWRBdC50b1VUQ1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChmaWxlLnVwbG9hZGVkQXQgaW5zdGFuY2VvZiBEYXRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0xhc3QtTW9kaWZpZWQnXSA9IGZpbGUudXBsb2FkZWRBdC50b1VUQ1N0cmluZygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgcmVxdWVzdCBoZWFkZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXEuaGVhZGVycyA9PT0gJ29iamVjdCcpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbXBhcmUgRVRhZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVxLmhlYWRlcnNbJ2lmLW5vbmUtbWF0Y2gnXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGUuZXRhZyA9PT0gcmVxLmhlYWRlcnNbJ2lmLW5vbmUtbWF0Y2gnXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoMzA0KTsgLy8gTm90IE1vZGlmaWVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcGFyZSBmaWxlIG1vZGlmaWNhdGlvbiBkYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXEuaGVhZGVyc1snaWYtbW9kaWZpZWQtc2luY2UnXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW9kaWZpZWRTaW5jZSA9IG5ldyBEYXRlKHJlcS5oZWFkZXJzWydpZi1tb2RpZmllZC1zaW5jZSddKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKGZpbGUubW9kaWZpZWRBdCBpbnN0YW5jZW9mIERhdGUgJiYgZmlsZS5tb2RpZmllZEF0ID4gbW9kaWZpZWRTaW5jZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCBmaWxlLnVwbG9hZGVkQXQgaW5zdGFuY2VvZiBEYXRlICYmIGZpbGUudXBsb2FkZWRBdCA+IG1vZGlmaWVkU2luY2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDMwNCk7IC8vIE5vdCBNb2RpZmllZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNlbmQgZGF0YSBpbiByYW5nZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJlcS5oZWFkZXJzLnJhbmdlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJhbmdlID0gcmVxLmhlYWRlcnMucmFuZ2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmFuZ2UgaXMgbm90IHZhbGlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJhbmdlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MTYpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5lbmQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9ucyA9IHJhbmdlLnJlcGxhY2UoL2J5dGVzPS8sICcnKS5zcGxpdCgnLScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN0YXJ0ID0gcGFyc2VJbnQocG9zaXRpb25zWzBdLCAxMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG90YWwgPSBmaWxlLnNpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZW5kID0gcG9zaXRpb25zWzFdID8gcGFyc2VJbnQocG9zaXRpb25zWzFdLCAxMCkgOiB0b3RhbCAtIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIGhlYWRlcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtUmFuZ2UnXSA9IGBieXRlcyAke3N0YXJ0fS0ke2VuZH0vJHt0b3RhbH1gO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snQWNjZXB0LVJhbmdlcyddID0gYGJ5dGVzYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSAoZW5kIC0gc3RhcnQpICsgMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXMgPSAyMDY7IC8vIHBhcnRpYWwgY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdGFydCA9IHN0YXJ0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lbmQgPSBlbmQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE9wZW4gdGhlIGZpbGUgc3RyZWFtXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJzID0gc3RvcmUuZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3cyA9IG5ldyBzdHJlYW0uUGFzc1Rocm91Z2goKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcnMub24oJ2Vycm9yJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JlLm9uUmVhZEVycm9yLmNhbGwoc3RvcmUsIGVyciwgZmlsZUlkLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgICAgICB3cy5vbignZXJyb3InLCBNZXRlb3IuYmluZEVudmlyb25tZW50KChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmUub25SZWFkRXJyb3IuY2FsbChzdG9yZSwgZXJyLCBmaWxlSWQsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXMuZW5kKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdzLm9uKCdjbG9zZScsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xvc2Ugb3V0cHV0IHN0cmVhbSBhdCB0aGUgZW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLmVtaXQoJ2VuZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBUcmFuc2Zvcm0gc3RyZWFtXHJcbiAgICAgICAgICAgICAgICAgICAgc3RvcmUudHJhbnNmb3JtUmVhZChycywgd3MsIGZpbGVJZCwgZmlsZSwgcmVxLCBoZWFkZXJzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGFyc2UgcmVxdWVzdCBoZWFkZXJzXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXEuaGVhZGVycyA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHJlc3MgZGF0YSB1c2luZyBpZiBuZWVkZWQgKGlnbm9yZSBhdWRpby92aWRlbyBhcyB0aGV5IGFyZSBhbHJlYWR5IGNvbXByZXNzZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcmVxLmhlYWRlcnNbJ2FjY2VwdC1lbmNvZGluZyddID09PSAnc3RyaW5nJyAmJiAhL14oYXVkaW98dmlkZW8pLy50ZXN0KGZpbGUudHlwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBhY2NlcHQgPSByZXEuaGVhZGVyc1snYWNjZXB0LWVuY29kaW5nJ107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHJlc3Mgd2l0aCBnemlwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWNjZXB0Lm1hdGNoKC9cXGJnemlwXFxiLykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzWydDb250ZW50LUVuY29kaW5nJ10gPSAnZ3ppcCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdzLnBpcGUoemxpYi5jcmVhdGVHemlwKCkpLnBpcGUocmVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDb21wcmVzcyB3aXRoIGRlZmxhdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGFjY2VwdC5tYXRjaCgvXFxiZGVmbGF0ZVxcYi8pKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyc1snQ29udGVudC1FbmNvZGluZyddID0gJ2RlZmxhdGUnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBoZWFkZXJzWydDb250ZW50LUxlbmd0aCddO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoc3RhdHVzLCBoZWFkZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cy5waXBlKHpsaWIuY3JlYXRlRGVmbGF0ZSgpKS5waXBlKHJlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIHJhdyBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoZWFkZXJzWydDb250ZW50LUVuY29kaW5nJ10pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZChzdGF0dXMsIGhlYWRlcnMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5waXBlKHJlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcbmltcG9ydCB7X30gZnJvbSBcIm1ldGVvci91bmRlcnNjb3JlXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFN0b3JlIHBlcm1pc3Npb25zXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3RvcmVQZXJtaXNzaW9ucyB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIC8vIERlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGluc2VydDogbnVsbCxcclxuICAgICAgICAgICAgcmVtb3ZlOiBudWxsLFxyXG4gICAgICAgICAgICB1cGRhdGU6IG51bGxcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmIChvcHRpb25zLmluc2VydCAmJiB0eXBlb2Ygb3B0aW9ucy5pbnNlcnQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN0b3JlUGVybWlzc2lvbnM6IGluc2VydCBpcyBub3QgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMucmVtb3ZlICYmIHR5cGVvZiBvcHRpb25zLnJlbW92ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3RvcmVQZXJtaXNzaW9uczogcmVtb3ZlIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy51cGRhdGUgJiYgdHlwZW9mIG9wdGlvbnMudXBkYXRlICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTdG9yZVBlcm1pc3Npb25zOiB1cGRhdGUgaXMgbm90IGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQdWJsaWMgYXR0cmlidXRlc1xyXG4gICAgICAgIHRoaXMuYWN0aW9ucyA9IHtcclxuICAgICAgICAgICAgaW5zZXJ0OiBvcHRpb25zLmluc2VydCxcclxuICAgICAgICAgICAgcmVtb3ZlOiBvcHRpb25zLnJlbW92ZSxcclxuICAgICAgICAgICAgdXBkYXRlOiBvcHRpb25zLnVwZGF0ZSxcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSBwZXJtaXNzaW9uIGZvciB0aGUgYWN0aW9uXHJcbiAgICAgKiBAcGFyYW0gYWN0aW9uXHJcbiAgICAgKiBAcGFyYW0gdXNlcklkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHBhcmFtIGZpZWxkc1xyXG4gICAgICogQHBhcmFtIG1vZGlmaWVyc1xyXG4gICAgICogQHJldHVybiB7Kn1cclxuICAgICAqL1xyXG4gICAgY2hlY2soYWN0aW9uLCB1c2VySWQsIGZpbGUsIGZpZWxkcywgbW9kaWZpZXJzKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmFjdGlvbnNbYWN0aW9uXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3Rpb25zW2FjdGlvbl0odXNlcklkLCBmaWxlLCBmaWVsZHMsIG1vZGlmaWVycyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBieSBkZWZhdWx0IGFsbG93IGFsbFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2hlY2tzIHRoZSBpbnNlcnQgcGVybWlzc2lvblxyXG4gICAgICogQHBhcmFtIHVzZXJJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEByZXR1cm5zIHsqfVxyXG4gICAgICovXHJcbiAgICBjaGVja0luc2VydCh1c2VySWQsIGZpbGUpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGVjaygnaW5zZXJ0JywgdXNlcklkLCBmaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENoZWNrcyB0aGUgcmVtb3ZlIHBlcm1pc3Npb25cclxuICAgICAqIEBwYXJhbSB1c2VySWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAqL1xyXG4gICAgY2hlY2tSZW1vdmUodXNlcklkLCBmaWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hlY2soJ3JlbW92ZScsIHVzZXJJZCwgZmlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVja3MgdGhlIHVwZGF0ZSBwZXJtaXNzaW9uXHJcbiAgICAgKiBAcGFyYW0gdXNlcklkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHBhcmFtIGZpZWxkc1xyXG4gICAgICogQHBhcmFtIG1vZGlmaWVyc1xyXG4gICAgICogQHJldHVybnMgeyp9XHJcbiAgICAgKi9cclxuICAgIGNoZWNrVXBkYXRlKHVzZXJJZCwgZmlsZSwgZmllbGRzLCBtb2RpZmllcnMpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jaGVjaygndXBkYXRlJywgdXNlcklkLCBmaWxlLCBmaWVsZHMsIG1vZGlmaWVycyk7XHJcbiAgICB9XHJcbn1cclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcbmltcG9ydCB7X30gZnJvbSBcIm1ldGVvci91bmRlcnNjb3JlXCI7XHJcbmltcG9ydCB7Y2hlY2t9IGZyb20gXCJtZXRlb3IvY2hlY2tcIjtcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gXCJtZXRlb3IvbWV0ZW9yXCI7XHJcbmltcG9ydCB7TW9uZ299IGZyb20gXCJtZXRlb3IvbW9uZ29cIjtcclxuaW1wb3J0IHtVcGxvYWRGU30gZnJvbSBcIi4vdWZzXCI7XHJcbmltcG9ydCB7RmlsdGVyfSBmcm9tIFwiLi91ZnMtZmlsdGVyXCI7XHJcbmltcG9ydCB7U3RvcmVQZXJtaXNzaW9uc30gZnJvbSBcIi4vdWZzLXN0b3JlLXBlcm1pc3Npb25zXCI7XHJcbmltcG9ydCB7VG9rZW5zfSBmcm9tIFwiLi91ZnMtdG9rZW5zXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZpbGUgc3RvcmVcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTdG9yZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gRGVmYXVsdCBvcHRpb25zXHJcbiAgICAgICAgb3B0aW9ucyA9IF8uZXh0ZW5kKHtcclxuICAgICAgICAgICAgY29sbGVjdGlvbjogbnVsbCxcclxuICAgICAgICAgICAgZmlsdGVyOiBudWxsLFxyXG4gICAgICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgICAgICBvbkNvcHlFcnJvcjogdGhpcy5vbkNvcHlFcnJvcixcclxuICAgICAgICAgICAgb25GaW5pc2hVcGxvYWQ6IHRoaXMub25GaW5pc2hVcGxvYWQsXHJcbiAgICAgICAgICAgIG9uUmVhZDogdGhpcy5vblJlYWQsXHJcbiAgICAgICAgICAgIG9uUmVhZEVycm9yOiB0aGlzLm9uUmVhZEVycm9yLFxyXG4gICAgICAgICAgICBvblZhbGlkYXRlOiB0aGlzLm9uVmFsaWRhdGUsXHJcbiAgICAgICAgICAgIG9uV3JpdGVFcnJvcjogdGhpcy5vbldyaXRlRXJyb3IsXHJcbiAgICAgICAgICAgIHBlcm1pc3Npb25zOiBudWxsLFxyXG4gICAgICAgICAgICB0cmFuc2Zvcm1SZWFkOiBudWxsLFxyXG4gICAgICAgICAgICB0cmFuc2Zvcm1Xcml0ZTogbnVsbFxyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBvcHRpb25zXHJcbiAgICAgICAgaWYgKCEob3B0aW9ucy5jb2xsZWN0aW9uIGluc3RhbmNlb2YgTW9uZ28uQ29sbGVjdGlvbikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IGNvbGxlY3Rpb24gaXMgbm90IGEgTW9uZ28uQ29sbGVjdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXIgJiYgIShvcHRpb25zLmZpbHRlciBpbnN0YW5jZW9mIEZpbHRlcikpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IGZpbHRlciBpcyBub3QgYSBVcGxvYWRGUy5GaWx0ZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm5hbWUgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBuYW1lIGlzIG5vdCBhIHN0cmluZycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoVXBsb2FkRlMuZ2V0U3RvcmUob3B0aW9ucy5uYW1lKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogbmFtZSBhbHJlYWR5IGV4aXN0cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5vbkNvcHlFcnJvciAmJiB0eXBlb2Ygb3B0aW9ucy5vbkNvcHlFcnJvciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogb25Db3B5RXJyb3IgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25GaW5pc2hVcGxvYWQgJiYgdHlwZW9mIG9wdGlvbnMub25GaW5pc2hVcGxvYWQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG9uRmluaXNoVXBsb2FkIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm9uUmVhZCAmJiB0eXBlb2Ygb3B0aW9ucy5vblJlYWQgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignU3RvcmU6IG9uUmVhZCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5vblJlYWRFcnJvciAmJiB0eXBlb2Ygb3B0aW9ucy5vblJlYWRFcnJvciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogb25SZWFkRXJyb3IgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25Xcml0ZUVycm9yICYmIHR5cGVvZiBvcHRpb25zLm9uV3JpdGVFcnJvciAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogb25Xcml0ZUVycm9yIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLnBlcm1pc3Npb25zICYmICEob3B0aW9ucy5wZXJtaXNzaW9ucyBpbnN0YW5jZW9mIFN0b3JlUGVybWlzc2lvbnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBwZXJtaXNzaW9ucyBpcyBub3QgYSBVcGxvYWRGUy5TdG9yZVBlcm1pc3Npb25zJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLnRyYW5zZm9ybVJlYWQgJiYgdHlwZW9mIG9wdGlvbnMudHJhbnNmb3JtUmVhZCAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogdHJhbnNmb3JtUmVhZCBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy50cmFuc2Zvcm1Xcml0ZSAmJiB0eXBlb2Ygb3B0aW9ucy50cmFuc2Zvcm1Xcml0ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdG9yZTogdHJhbnNmb3JtV3JpdGUgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMub25WYWxpZGF0ZSAmJiB0eXBlb2Ygb3B0aW9ucy5vblZhbGlkYXRlICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1N0b3JlOiBvblZhbGlkYXRlIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQdWJsaWMgYXR0cmlidXRlc1xyXG4gICAgICAgIHNlbGYub3B0aW9ucyA9IG9wdGlvbnM7XHJcbiAgICAgICAgc2VsZi5wZXJtaXNzaW9ucyA9IG9wdGlvbnMucGVybWlzc2lvbnM7XHJcbiAgICAgICAgXy5lYWNoKFtcclxuICAgICAgICAgICAgJ29uQ29weUVycm9yJyxcclxuICAgICAgICAgICAgJ29uRmluaXNoVXBsb2FkJyxcclxuICAgICAgICAgICAgJ29uUmVhZCcsXHJcbiAgICAgICAgICAgICdvblJlYWRFcnJvcicsXHJcbiAgICAgICAgICAgICdvbldyaXRlRXJyb3InLFxyXG4gICAgICAgICAgICAnb25WYWxpZGF0ZSdcclxuICAgICAgICBdLCAobWV0aG9kKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9uc1ttZXRob2RdID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmW21ldGhvZF0gPSBvcHRpb25zW21ldGhvZF07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQWRkIHRoZSBzdG9yZSB0byB0aGUgbGlzdFxyXG4gICAgICAgIFVwbG9hZEZTLmFkZFN0b3JlKHNlbGYpO1xyXG5cclxuICAgICAgICAvLyBTZXQgZGVmYXVsdCBwZXJtaXNzaW9uc1xyXG4gICAgICAgIGlmICghKHNlbGYucGVybWlzc2lvbnMgaW5zdGFuY2VvZiBTdG9yZVBlcm1pc3Npb25zKSkge1xyXG4gICAgICAgICAgICAvLyBVc2VzIGN1c3RvbSBkZWZhdWx0IHBlcm1pc3Npb25zIG9yIFVGUyBkZWZhdWx0IHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGlmIChVcGxvYWRGUy5jb25maWcuZGVmYXVsdFN0b3JlUGVybWlzc2lvbnMgaW5zdGFuY2VvZiBTdG9yZVBlcm1pc3Npb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnBlcm1pc3Npb25zID0gVXBsb2FkRlMuY29uZmlnLmRlZmF1bHRTdG9yZVBlcm1pc3Npb25zO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5wZXJtaXNzaW9ucyA9IG5ldyBTdG9yZVBlcm1pc3Npb25zKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYHVmczogcGVybWlzc2lvbnMgYXJlIG5vdCBkZWZpbmVkIGZvciBzdG9yZSBcIiR7b3B0aW9ucy5uYW1lfVwiYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBDaGVja3MgdG9rZW4gdmFsaWRpdHlcclxuICAgICAgICAgICAgICogQHBhcmFtIHRva2VuXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgICAgICogQHJldHVybnMge2Jvb2xlYW59XHJcbiAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICBzZWxmLmNoZWNrVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4sIGZpbGVJZCkge1xyXG4gICAgICAgICAgICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICBjaGVjayhmaWxlSWQsIFN0cmluZyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5zLmZpbmQoe3ZhbHVlOiB0b2tlbiwgZmlsZUlkOiBmaWxlSWR9KS5jb3VudCgpID09PSAxO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENvcGllcyB0aGUgZmlsZSB0byBhIHN0b3JlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAgICAgICAgICogQHBhcmFtIHN0b3JlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc2VsZi5jb3B5ID0gZnVuY3Rpb24gKGZpbGVJZCwgc3RvcmUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjayhmaWxlSWQsIFN0cmluZyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEoc3RvcmUgaW5zdGFuY2VvZiBTdG9yZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdzdG9yZSBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgVXBsb2FkRlMuU3RvcmUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEdldCBvcmlnaW5hbCBmaWxlXHJcbiAgICAgICAgICAgICAgICBsZXQgZmlsZSA9IHNlbGYuZ2V0Q29sbGVjdGlvbigpLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmaWxlLW5vdC1mb3VuZCcsICdGaWxlIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gU2lsZW50bHkgaWdub3JlIHRoZSBmaWxlIGlmIGl0IGRvZXMgbm90IG1hdGNoIGZpbHRlclxyXG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gc3RvcmUuZ2V0RmlsdGVyKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlsdGVyIGluc3RhbmNlb2YgRmlsdGVyICYmICFmaWx0ZXIuaXNWYWxpZChmaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcmVwYXJlIGNvcHlcclxuICAgICAgICAgICAgICAgIGxldCBjb3B5ID0gXy5vbWl0KGZpbGUsICdfaWQnLCAndXJsJyk7XHJcbiAgICAgICAgICAgICAgICBjb3B5Lm9yaWdpbmFsU3RvcmUgPSBzZWxmLmdldE5hbWUoKTtcclxuICAgICAgICAgICAgICAgIGNvcHkub3JpZ2luYWxJZCA9IGZpbGVJZDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGNvcHlcclxuICAgICAgICAgICAgICAgIGxldCBjb3B5SWQgPSBzdG9yZS5jcmVhdGUoY29weSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IG9yaWdpbmFsIHN0cmVhbVxyXG4gICAgICAgICAgICAgICAgbGV0IHJzID0gc2VsZi5nZXRSZWFkU3RyZWFtKGZpbGVJZCwgZmlsZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2F0Y2ggZXJyb3JzIHRvIGF2b2lkIGFwcCBjcmFzaGluZ1xyXG4gICAgICAgICAgICAgICAgcnMub24oJ2Vycm9yJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBlcnIsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIENvcHkgZmlsZSBkYXRhXHJcbiAgICAgICAgICAgICAgICBzdG9yZS53cml0ZShycywgY29weUlkLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZ2V0Q29sbGVjdGlvbigpLnJlbW92ZSh7X2lkOiBjb3B5SWR9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkNvcHlFcnJvci5jYWxsKHNlbGYsIGVyciwgZmlsZUlkLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYsIGVyciwgY29weUlkLCBjb3B5LCBzdG9yZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAqIENyZWF0ZXMgdGhlIGZpbGUgaW4gdGhlIGNvbGxlY3Rpb25cclxuICAgICAgICAgICAgICogQHBhcmFtIGZpbGVcclxuICAgICAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYuY3JlYXRlID0gZnVuY3Rpb24gKGZpbGUsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVjayhmaWxlLCBPYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgZmlsZS5zdG9yZSA9IHNlbGYub3B0aW9ucy5uYW1lOyAvLyBhc3NpZ24gc3RvcmUgdG8gZmlsZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0Q29sbGVjdGlvbigpLmluc2VydChmaWxlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogQ3JlYXRlcyBhIHRva2VuIGZvciB0aGUgZmlsZSAob25seSBuZWVkZWQgZm9yIGNsaWVudCBzaWRlIHVwbG9hZClcclxuICAgICAgICAgICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cclxuICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgIHNlbGYuY3JlYXRlVG9rZW4gPSBmdW5jdGlvbiAoZmlsZUlkKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdG9rZW4gPSBzZWxmLmdlbmVyYXRlVG9rZW4oKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0b2tlbiBleGlzdHNcclxuICAgICAgICAgICAgICAgIGlmIChUb2tlbnMuZmluZCh7ZmlsZUlkOiBmaWxlSWR9KS5jb3VudCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgVG9rZW5zLnVwZGF0ZSh7ZmlsZUlkOiBmaWxlSWR9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzZXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0b2tlblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIFRva2Vucy5pbnNlcnQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJZDogZmlsZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdG9rZW5cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0b2tlbjtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgKiBXcml0ZXMgdGhlIGZpbGUgdG8gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSByc1xyXG4gICAgICAgICAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgICAgICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICAgICAgICAgKi9cclxuICAgICAgICAgICAgc2VsZi53cml0ZSA9IGZ1bmN0aW9uIChycywgZmlsZUlkLCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBzZWxmLmdldENvbGxlY3Rpb24oKS5maW5kT25lKHtfaWQ6IGZpbGVJZH0pO1xyXG4gICAgICAgICAgICAgICAgbGV0IHdzID0gc2VsZi5nZXRXcml0ZVN0cmVhbShmaWxlSWQsIGZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBlcnJvckhhbmRsZXIgPSBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmdldENvbGxlY3Rpb24oKS5yZW1vdmUoe19pZDogZmlsZUlkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbldyaXRlRXJyb3IuY2FsbChzZWxmLCBlcnIsIGZpbGVJZCwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBlcnIpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgd3Mub24oJ2Vycm9yJywgZXJyb3JIYW5kbGVyKTtcclxuICAgICAgICAgICAgICAgIHdzLm9uKCdmaW5pc2gnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2l6ZSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlYWRTdHJlYW0gPSBzZWxmLmdldFJlYWRTdHJlYW0oZmlsZUlkLCBmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5vbignZXJyb3InLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYsIGVycm9yLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5vbignZGF0YScsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZSArPSBkYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5vbignZW5kJywgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBmaWxlIGF0dHJpYnV0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbXBsZXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5ldGFnID0gVXBsb2FkRlMuZ2VuZXJhdGVFdGFnKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUucGF0aCA9IHNlbGYuZ2V0RmlsZVJlbGF0aXZlVVJMKGZpbGVJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUucHJvZ3Jlc3MgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnNpemUgPSBzaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnRva2VuID0gc2VsZi5nZW5lcmF0ZVRva2VuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUudXBsb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUudXBsb2FkZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUudXJsID0gc2VsZi5nZXRGaWxlVVJMKGZpbGVJZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXRzIHRoZSBmaWxlIFVSTCB3aGVuIGZpbGUgdHJhbnNmZXIgaXMgY29tcGxldGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgd2F5LCB0aGUgaW1hZ2Ugd2lsbCBsb2FkcyBlbnRpcmVseS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5nZXRDb2xsZWN0aW9uKCkuZGlyZWN0LnVwZGF0ZSh7X2lkOiBmaWxlSWR9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2V0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZpbGUuY29tcGxldGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXRhZzogZmlsZS5ldGFnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGZpbGUucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogZmlsZS5wcm9ncmVzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW46IGZpbGUudG9rZW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBsb2FkaW5nOiBmaWxlLnVwbG9hZGluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRlZEF0OiBmaWxlLnVwbG9hZGVkQXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBmaWxlLnVybFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBmaWxlIGluZm9cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChzZWxmLCBudWxsLCBmaWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgY2FsbGJhY2tcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLm9uRmluaXNoVXBsb2FkID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25GaW5pc2hVcGxvYWQuY2FsbChzZWxmLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2ltdWxhdGUgd3JpdGUgc3BlZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFVwbG9hZEZTLmNvbmZpZy5zaW11bGF0ZVdyaXRlRGVsYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1ldGVvci5fc2xlZXBGb3JNcyhVcGxvYWRGUy5jb25maWcuc2ltdWxhdGVXcml0ZURlbGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29weSBmaWxlIHRvIG90aGVyIHN0b3Jlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5vcHRpb25zLmNvcHlUbyBpbnN0YW5jZW9mIEFycmF5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYub3B0aW9ucy5jb3B5VG8ubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc3RvcmUgPSBzZWxmLm9wdGlvbnMuY29weVRvW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXN0b3JlLmdldEZpbHRlcigpIHx8IHN0b3JlLmdldEZpbHRlcigpLmlzVmFsaWQoZmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb3B5KGZpbGVJZCwgc3RvcmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIHRyYW5zZm9ybWF0aW9uXHJcbiAgICAgICAgICAgICAgICBzZWxmLnRyYW5zZm9ybVdyaXRlKHJzLCB3cywgZmlsZUlkLCBmaWxlKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgZnMgPSBOcG0ucmVxdWlyZSgnZnMnKTtcclxuICAgICAgICAgICAgY29uc3QgY29sbGVjdGlvbiA9IHNlbGYuZ2V0Q29sbGVjdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29kZSBleGVjdXRlZCBhZnRlciByZW1vdmluZyBmaWxlXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYWZ0ZXIucmVtb3ZlKGZ1bmN0aW9uICh1c2VySWQsIGZpbGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhc3NvY2lhdGVkIHRva2Vuc1xyXG4gICAgICAgICAgICAgICAgVG9rZW5zLnJlbW92ZSh7ZmlsZUlkOiBmaWxlLl9pZH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzZWxmLm9wdGlvbnMuY29weVRvIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYub3B0aW9ucy5jb3B5VG8ubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGNvcGllcyBpbiBzdG9yZXNcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vcHRpb25zLmNvcHlUb1tpXS5nZXRDb2xsZWN0aW9uKCkucmVtb3ZlKHtvcmlnaW5hbElkOiBmaWxlLl9pZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2RlIGV4ZWN1dGVkIGJlZm9yZSBpbnNlcnRpbmcgZmlsZVxyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLmJlZm9yZS5pbnNlcnQoZnVuY3Rpb24gKHVzZXJJZCwgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLnBlcm1pc3Npb25zLmNoZWNrSW5zZXJ0KHVzZXJJZCwgZmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmb3JiaWRkZW4nLCBcIkZvcmJpZGRlblwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDb2RlIGV4ZWN1dGVkIGJlZm9yZSB1cGRhdGluZyBmaWxlXHJcbiAgICAgICAgICAgIGNvbGxlY3Rpb24uYmVmb3JlLnVwZGF0ZShmdW5jdGlvbiAodXNlcklkLCBmaWxlLCBmaWVsZHMsIG1vZGlmaWVycykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLnBlcm1pc3Npb25zLmNoZWNrVXBkYXRlKHVzZXJJZCwgZmlsZSwgZmllbGRzLCBtb2RpZmllcnMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZm9yYmlkZGVuJywgXCJGb3JiaWRkZW5cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ29kZSBleGVjdXRlZCBiZWZvcmUgcmVtb3ZpbmcgZmlsZVxyXG4gICAgICAgICAgICBjb2xsZWN0aW9uLmJlZm9yZS5yZW1vdmUoZnVuY3Rpb24gKHVzZXJJZCwgZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLnBlcm1pc3Npb25zLmNoZWNrUmVtb3ZlKHVzZXJJZCwgZmlsZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdmb3JiaWRkZW4nLCBcIkZvcmJpZGRlblwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEZWxldGUgdGhlIHBoeXNpY2FsIGZpbGUgaW4gdGhlIHN0b3JlXHJcbiAgICAgICAgICAgICAgICBzZWxmLmRlbGV0ZShmaWxlLl9pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHRtcEZpbGUgPSBVcGxvYWRGUy5nZXRUZW1wRmlsZVBhdGgoZmlsZS5faWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERlbGV0ZSB0aGUgdGVtcCBmaWxlXHJcbiAgICAgICAgICAgICAgICBmcy5zdGF0KHRtcEZpbGUsIGZ1bmN0aW9uIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAhZXJyICYmIGZzLnVubGluayh0bXBGaWxlLCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVyciAmJiBjb25zb2xlLmVycm9yKGB1ZnM6IGNhbm5vdCBkZWxldGUgdGVtcCBmaWxlIGF0ICR7dG1wRmlsZX0gKCR7ZXJyLm1lc3NhZ2V9KWApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIERlbGV0ZXMgYSBmaWxlIGFzeW5jXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAqL1xyXG4gICAgZGVsZXRlKGZpbGVJZCwgY2FsbGJhY2spIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2RlbGV0ZSBpcyBub3QgaW1wbGVtZW50ZWQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlcyBhIHJhbmRvbSB0b2tlblxyXG4gICAgICogQHBhcmFtIHBhdHRlcm5cclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2VuZXJhdGVUb2tlbihwYXR0ZXJuKSB7XHJcbiAgICAgICAgcmV0dXJuIChwYXR0ZXJuIHx8ICd4eXh5eHl4eXh5JykucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xyXG4gICAgICAgICAgICBsZXQgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIGxldCBzID0gdi50b1N0cmluZygxNik7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkpID8gcy50b1VwcGVyQ2FzZSgpIDogcztcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGNvbGxlY3Rpb25cclxuICAgICAqIEByZXR1cm4ge01vbmdvLkNvbGxlY3Rpb259XHJcbiAgICAgKi9cclxuICAgIGdldENvbGxlY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jb2xsZWN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSBVUkxcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWxlUmVsYXRpdmVVUkwoZmlsZUlkKSB7XHJcbiAgICAgICAgbGV0IGZpbGUgPSB0aGlzLmdldENvbGxlY3Rpb24oKS5maW5kT25lKGZpbGVJZCwge2ZpZWxkczoge25hbWU6IDF9fSk7XHJcbiAgICAgICAgcmV0dXJuIGZpbGUgPyB0aGlzLmdldFJlbGF0aXZlVVJMKGAke2ZpbGVJZH0vJHtmaWxlLm5hbWV9YCkgOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSBVUkxcclxuICAgICAqIEBwYXJhbSBmaWxlSWRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ3xudWxsfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWxlVVJMKGZpbGVJZCkge1xyXG4gICAgICAgIGxldCBmaWxlID0gdGhpcy5nZXRDb2xsZWN0aW9uKCkuZmluZE9uZShmaWxlSWQsIHtmaWVsZHM6IHtuYW1lOiAxfX0pO1xyXG4gICAgICAgIHJldHVybiBmaWxlID8gdGhpcy5nZXRVUkwoYCR7ZmlsZUlkfS8ke2ZpbGUubmFtZX1gKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBmaWxlIGZpbHRlclxyXG4gICAgICogQHJldHVybiB7VXBsb2FkRlMuRmlsdGVyfVxyXG4gICAgICovXHJcbiAgICBnZXRGaWx0ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5maWx0ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBzdG9yZSBuYW1lXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldE5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgZmlsZSByZWFkIHN0cmVhbVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgZ2V0UmVhZFN0cmVhbShmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0b3JlLmdldFJlYWRTdHJlYW0gaXMgbm90IGltcGxlbWVudGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm5zIHRoZSBzdG9yZSByZWxhdGl2ZSBVUkxcclxuICAgICAqIEBwYXJhbSBwYXRoXHJcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldFJlbGF0aXZlVVJMKHBhdGgpIHtcclxuICAgICAgICBjb25zdCByb290VXJsID0gTWV0ZW9yLmFic29sdXRlVXJsKCkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XHJcbiAgICAgICAgY29uc3Qgcm9vdFBhdGggPSByb290VXJsLnJlcGxhY2UoL15bYS16XSs6XFwvXFwvW14vXStcXC8qL2dpLCAnJyk7XHJcbiAgICAgICAgY29uc3Qgc3RvcmVOYW1lID0gdGhpcy5nZXROYW1lKCk7XHJcbiAgICAgICAgcGF0aCA9IFN0cmluZyhwYXRoKS5yZXBsYWNlKC9cXC8kLywgJycpLnRyaW0oKTtcclxuICAgICAgICByZXR1cm4gZW5jb2RlVVJJKGAke3Jvb3RQYXRofS8ke1VwbG9hZEZTLmNvbmZpZy5zdG9yZXNQYXRofS8ke3N0b3JlTmFtZX0vJHtwYXRofWApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJucyB0aGUgc3RvcmUgYWJzb2x1dGUgVVJMXHJcbiAgICAgKiBAcGFyYW0gcGF0aFxyXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRVUkwocGF0aCkge1xyXG4gICAgICAgIGNvbnN0IHJvb3RVcmwgPSBNZXRlb3IuYWJzb2x1dGVVcmwoKS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcclxuICAgICAgICBjb25zdCBzdG9yZU5hbWUgPSB0aGlzLmdldE5hbWUoKTtcclxuICAgICAgICBwYXRoID0gU3RyaW5nKHBhdGgpLnJlcGxhY2UoL1xcLyQvLCAnJykudHJpbSgpO1xyXG4gICAgICAgIHJldHVybiBlbmNvZGVVUkkoYCR7cm9vdFVybH0vJHtVcGxvYWRGUy5jb25maWcuc3RvcmVzUGF0aH0vJHtzdG9yZU5hbWV9LyR7cGF0aH1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIGZpbGUgd3JpdGUgc3RyZWFtXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBnZXRXcml0ZVN0cmVhbShmaWxlSWQsIGZpbGUpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFdyaXRlU3RyZWFtIGlzIG5vdCBpbXBsZW1lbnRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29tcGxldGVzIHRoZSBmaWxlIHVwbG9hZFxyXG4gICAgICogQHBhcmFtIHVybFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgICBpbXBvcnRGcm9tVVJMKHVybCwgZmlsZSwgY2FsbGJhY2spIHtcclxuICAgICAgICBNZXRlb3IuY2FsbCgndWZzSW1wb3J0VVJMJywgdXJsLCBmaWxlLCB0aGlzLmdldE5hbWUoKSwgY2FsbGJhY2spO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSBjb3B5IGVycm9yIGhhcHBlbmVkXHJcbiAgICAgKiBAcGFyYW0gZXJyXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkNvcHlFcnJvcihlcnIsIGZpbGVJZCwgZmlsZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IGNvcHkgZmlsZSBcIiR7ZmlsZUlkfVwiICgke2Vyci5tZXNzYWdlfSlgLCBlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSBmaWxlIGhhcyBiZWVuIHVwbG9hZGVkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkZpbmlzaFVwbG9hZChmaWxlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiBhIGZpbGUgaXMgcmVhZCBmcm9tIHRoZSBzdG9yZVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqIEBwYXJhbSByZXF1ZXN0XHJcbiAgICAgKiBAcGFyYW0gcmVzcG9uc2VcclxuICAgICAqIEByZXR1cm4gYm9vbGVhblxyXG4gICAgICovXHJcbiAgICBvblJlYWQoZmlsZUlkLCBmaWxlLCByZXF1ZXN0LCByZXNwb25zZSkge1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSByZWFkIGVycm9yIGhhcHBlbmVkXHJcbiAgICAgKiBAcGFyYW0gZXJyXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiBib29sZWFuXHJcbiAgICAgKi9cclxuICAgIG9uUmVhZEVycm9yKGVyciwgZmlsZUlkLCBmaWxlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgdWZzOiBjYW5ub3QgcmVhZCBmaWxlIFwiJHtmaWxlSWR9XCIgKCR7ZXJyLm1lc3NhZ2V9KWAsIGVycik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiBmaWxlIGlzIGJlaW5nIHZhbGlkYXRlZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgb25WYWxpZGF0ZShmaWxlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiBhIHdyaXRlIGVycm9yIGhhcHBlbmVkXHJcbiAgICAgKiBAcGFyYW0gZXJyXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHJldHVybiBib29sZWFuXHJcbiAgICAgKi9cclxuICAgIG9uV3JpdGVFcnJvcihlcnIsIGZpbGVJZCwgZmlsZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYHVmczogY2Fubm90IHdyaXRlIGZpbGUgXCIke2ZpbGVJZH1cIiAoJHtlcnIubWVzc2FnZX0pYCwgZXJyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIHN0b3JlIHBlcm1pc3Npb25zXHJcbiAgICAgKiBAcGFyYW0gcGVybWlzc2lvbnNcclxuICAgICAqL1xyXG4gICAgc2V0UGVybWlzc2lvbnMocGVybWlzc2lvbnMpIHtcclxuICAgICAgICBpZiAoIShwZXJtaXNzaW9ucyBpbnN0YW5jZW9mIFN0b3JlUGVybWlzc2lvbnMpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQZXJtaXNzaW9ucyBpcyBub3QgYW4gaW5zdGFuY2Ugb2YgVXBsb2FkRlMuU3RvcmVQZXJtaXNzaW9uc1wiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wZXJtaXNzaW9ucyA9IHBlcm1pc3Npb25zO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhbnNmb3JtcyB0aGUgZmlsZSBvbiByZWFkaW5nXHJcbiAgICAgKiBAcGFyYW0gcmVhZFN0cmVhbVxyXG4gICAgICogQHBhcmFtIHdyaXRlU3RyZWFtXHJcbiAgICAgKiBAcGFyYW0gZmlsZUlkXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICogQHBhcmFtIHJlcXVlc3RcclxuICAgICAqIEBwYXJhbSBoZWFkZXJzXHJcbiAgICAgKi9cclxuICAgIHRyYW5zZm9ybVJlYWQocmVhZFN0cmVhbSwgd3JpdGVTdHJlYW0sIGZpbGVJZCwgZmlsZSwgcmVxdWVzdCwgaGVhZGVycykge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnRyYW5zZm9ybVJlYWQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRyYW5zZm9ybVJlYWQuY2FsbCh0aGlzLCByZWFkU3RyZWFtLCB3cml0ZVN0cmVhbSwgZmlsZUlkLCBmaWxlLCByZXF1ZXN0LCBoZWFkZXJzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZWFkU3RyZWFtLnBpcGUod3JpdGVTdHJlYW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYW5zZm9ybXMgdGhlIGZpbGUgb24gd3JpdGluZ1xyXG4gICAgICogQHBhcmFtIHJlYWRTdHJlYW1cclxuICAgICAqIEBwYXJhbSB3cml0ZVN0cmVhbVxyXG4gICAgICogQHBhcmFtIGZpbGVJZFxyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgdHJhbnNmb3JtV3JpdGUocmVhZFN0cmVhbSwgd3JpdGVTdHJlYW0sIGZpbGVJZCwgZmlsZSkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnRyYW5zZm9ybVdyaXRlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy50cmFuc2Zvcm1Xcml0ZS5jYWxsKHRoaXMsIHJlYWRTdHJlYW0sIHdyaXRlU3RyZWFtLCBmaWxlSWQsIGZpbGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmFsaWRhdGVzIHRoZSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICB2YWxpZGF0ZShmaWxlKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9uVmFsaWRhdGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhpcy5vblZhbGlkYXRlKGZpbGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCIvKlxyXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE3IEthcmwgU1RFSU5cclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxyXG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcclxuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXHJcbiAqIFNPRlRXQVJFLlxyXG4gKlxyXG4gKi9cclxuXHJcbmltcG9ydCB7VGVtcGxhdGV9IGZyb20gJ21ldGVvci90ZW1wbGF0aW5nJztcclxuXHJcblxyXG5sZXQgaXNNSU1FID0gZnVuY3Rpb24gKHR5cGUsIG1pbWUpIHtcclxuICAgIHJldHVybiB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZydcclxuICAgICAgICAmJiB0eXBlb2YgbWltZSA9PT0gJ3N0cmluZydcclxuICAgICAgICAmJiBtaW1lLmluZGV4T2YodHlwZSArICcvJykgPT09IDA7XHJcbn07XHJcblxyXG5UZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignaXNBcHBsaWNhdGlvbicsIGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICByZXR1cm4gaXNNSU1FKCdhcHBsaWNhdGlvbicsIHRoaXMudHlwZSB8fCB0eXBlKTtcclxufSk7XHJcblxyXG5UZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignaXNBdWRpbycsIGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICByZXR1cm4gaXNNSU1FKCdhdWRpbycsIHRoaXMudHlwZSB8fCB0eXBlKTtcclxufSk7XHJcblxyXG5UZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignaXNJbWFnZScsIGZ1bmN0aW9uICh0eXBlKSB7XHJcbiAgICByZXR1cm4gaXNNSU1FKCdpbWFnZScsIHRoaXMudHlwZSB8fCB0eXBlKTtcclxufSk7XHJcblxyXG5UZW1wbGF0ZS5yZWdpc3RlckhlbHBlcignaXNUZXh0JywgZnVuY3Rpb24gKHR5cGUpIHtcclxuICAgIHJldHVybiBpc01JTUUoJ3RleHQnLCB0aGlzLnR5cGUgfHwgdHlwZSk7XHJcbn0pO1xyXG5cclxuVGVtcGxhdGUucmVnaXN0ZXJIZWxwZXIoJ2lzVmlkZW8nLCBmdW5jdGlvbiAodHlwZSkge1xyXG4gICAgcmV0dXJuIGlzTUlNRSgndmlkZW8nLCB0aGlzLnR5cGUgfHwgdHlwZSk7XHJcbn0pO1xyXG4iLCIvKlxyXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcclxuICpcclxuICogQ29weXJpZ2h0IChjKSAyMDE3IEthcmwgU1RFSU5cclxuICpcclxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxyXG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXHJcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcclxuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxyXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcclxuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuICpcclxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXHJcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbiAqXHJcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcclxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXHJcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxyXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXHJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXHJcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXHJcbiAqIFNPRlRXQVJFLlxyXG4gKlxyXG4gKi9cclxuXHJcbmltcG9ydCB7TW9uZ299IGZyb20gJ21ldGVvci9tb25nbyc7XHJcblxyXG4vKipcclxuICogQ29sbGVjdGlvbiBvZiB1cGxvYWQgdG9rZW5zXHJcbiAqIEB0eXBlIHtNb25nby5Db2xsZWN0aW9ufVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IFRva2VucyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCd1ZnNUb2tlbnMnKTtcclxuIiwiLypcclxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxNyBLYXJsIFNURUlOXHJcbiAqXHJcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcclxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxyXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXHJcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcclxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXHJcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XHJcbiAqXHJcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxyXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxyXG4gKlxyXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXHJcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxyXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcclxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxyXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxyXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxyXG4gKiBTT0ZUV0FSRS5cclxuICpcclxuICovXHJcblxyXG5pbXBvcnQge199IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcclxuaW1wb3J0IHtNZXRlb3J9IGZyb20gJ21ldGVvci9tZXRlb3InO1xyXG5pbXBvcnQge1N0b3JlfSBmcm9tICcuL3Vmcy1zdG9yZSc7XHJcblxyXG5cclxuLyoqXHJcbiAqIEZpbGUgdXBsb2FkZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBVcGxvYWRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xyXG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgb3B0aW9uc1xyXG4gICAgICAgIG9wdGlvbnMgPSBfLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIGFkYXB0aXZlOiB0cnVlLFxyXG4gICAgICAgICAgICBjYXBhY2l0eTogMC45LFxyXG4gICAgICAgICAgICBjaHVua1NpemU6IDE2ICogMTAyNCxcclxuICAgICAgICAgICAgZGF0YTogbnVsbCxcclxuICAgICAgICAgICAgZmlsZTogbnVsbCxcclxuICAgICAgICAgICAgbWF4Q2h1bmtTaXplOiA0ICogMTAyNCAqIDEwMDAsXHJcbiAgICAgICAgICAgIG1heFRyaWVzOiA1LFxyXG4gICAgICAgICAgICBvbkFib3J0OiB0aGlzLm9uQWJvcnQsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6IHRoaXMub25Db21wbGV0ZSxcclxuICAgICAgICAgICAgb25DcmVhdGU6IHRoaXMub25DcmVhdGUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRoaXMub25FcnJvcixcclxuICAgICAgICAgICAgb25Qcm9ncmVzczogdGhpcy5vblByb2dyZXNzLFxyXG4gICAgICAgICAgICBvblN0YXJ0OiB0aGlzLm9uU3RhcnQsXHJcbiAgICAgICAgICAgIG9uU3RvcDogdGhpcy5vblN0b3AsXHJcbiAgICAgICAgICAgIHJldHJ5RGVsYXk6IDIwMDAsXHJcbiAgICAgICAgICAgIHN0b3JlOiBudWxsLFxyXG4gICAgICAgICAgICB0cmFuc2ZlckRlbGF5OiAxMDBcclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgb3B0aW9uc1xyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5hZGFwdGl2ZSAhPT0gJ2Jvb2xlYW4nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FkYXB0aXZlIGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2FwYWNpdHkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2NhcGFjaXR5IGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5jYXBhY2l0eSA8PSAwIHx8IG9wdGlvbnMuY2FwYWNpdHkgPiAxKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdjYXBhY2l0eSBtdXN0IGJlIGEgZmxvYXQgYmV0d2VlbiAwLjEgYW5kIDEuMCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuY2h1bmtTaXplICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdjaHVua1NpemUgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG9wdGlvbnMuZGF0YSBpbnN0YW5jZW9mIEJsb2IpICYmICEob3B0aW9ucy5kYXRhIGluc3RhbmNlb2YgRmlsZSkpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZGF0YSBpcyBub3QgYW4gQmxvYiBvciBGaWxlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmZpbGUgPT09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnMuZmlsZSAhPT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZmlsZSBpcyBub3QgYW4gb2JqZWN0Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5tYXhDaHVua1NpemUgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ21heENodW5rU2l6ZSBpcyBub3QgYSBudW1iZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm1heFRyaWVzICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtYXhUcmllcyBpcyBub3QgYSBudW1iZXInKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnJldHJ5RGVsYXkgIT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JldHJ5RGVsYXkgaXMgbm90IGEgbnVtYmVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50cmFuc2ZlckRlbGF5ICE9PSAnbnVtYmVyJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCd0cmFuc2ZlckRlbGF5IGlzIG5vdCBhIG51bWJlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25BYm9ydCAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvbkFib3J0IGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbkNvbXBsZXRlICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uQ29tcGxldGUgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uQ3JlYXRlICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uQ3JlYXRlIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vbkVycm9yICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ29uRXJyb3IgaXMgbm90IGEgZnVuY3Rpb24nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLm9uUHJvZ3Jlc3MgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb25Qcm9ncmVzcyBpcyBub3QgYSBmdW5jdGlvbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMub25TdGFydCAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdvblN0YXJ0IGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5vblN0b3AgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignb25TdG9wIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdG9yZSAhPT0gJ3N0cmluZycgJiYgIShvcHRpb25zLnN0b3JlIGluc3RhbmNlb2YgU3RvcmUpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3N0b3JlIG11c3QgYmUgdGhlIG5hbWUgb2YgdGhlIHN0b3JlIG9yIGFuIGluc3RhbmNlIG9mIFVwbG9hZEZTLlN0b3JlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBQdWJsaWMgYXR0cmlidXRlc1xyXG4gICAgICAgIHNlbGYuYWRhcHRpdmUgPSBvcHRpb25zLmFkYXB0aXZlO1xyXG4gICAgICAgIHNlbGYuY2FwYWNpdHkgPSBwYXJzZUZsb2F0KG9wdGlvbnMuY2FwYWNpdHkpO1xyXG4gICAgICAgIHNlbGYuY2h1bmtTaXplID0gcGFyc2VJbnQob3B0aW9ucy5jaHVua1NpemUpO1xyXG4gICAgICAgIHNlbGYubWF4Q2h1bmtTaXplID0gcGFyc2VJbnQob3B0aW9ucy5tYXhDaHVua1NpemUpO1xyXG4gICAgICAgIHNlbGYubWF4VHJpZXMgPSBwYXJzZUludChvcHRpb25zLm1heFRyaWVzKTtcclxuICAgICAgICBzZWxmLnJldHJ5RGVsYXkgPSBwYXJzZUludChvcHRpb25zLnJldHJ5RGVsYXkpO1xyXG4gICAgICAgIHNlbGYudHJhbnNmZXJEZWxheSA9IHBhcnNlSW50KG9wdGlvbnMudHJhbnNmZXJEZWxheSk7XHJcbiAgICAgICAgc2VsZi5vbkFib3J0ID0gb3B0aW9ucy5vbkFib3J0O1xyXG4gICAgICAgIHNlbGYub25Db21wbGV0ZSA9IG9wdGlvbnMub25Db21wbGV0ZTtcclxuICAgICAgICBzZWxmLm9uQ3JlYXRlID0gb3B0aW9ucy5vbkNyZWF0ZTtcclxuICAgICAgICBzZWxmLm9uRXJyb3IgPSBvcHRpb25zLm9uRXJyb3I7XHJcbiAgICAgICAgc2VsZi5vblByb2dyZXNzID0gb3B0aW9ucy5vblByb2dyZXNzO1xyXG4gICAgICAgIHNlbGYub25TdGFydCA9IG9wdGlvbnMub25TdGFydDtcclxuICAgICAgICBzZWxmLm9uU3RvcCA9IG9wdGlvbnMub25TdG9wO1xyXG5cclxuICAgICAgICAvLyBQcml2YXRlIGF0dHJpYnV0ZXNcclxuICAgICAgICBsZXQgc3RvcmUgPSBvcHRpb25zLnN0b3JlO1xyXG4gICAgICAgIGxldCBkYXRhID0gb3B0aW9ucy5kYXRhO1xyXG4gICAgICAgIGxldCBjYXBhY2l0eU1hcmdpbiA9IDAuMTtcclxuICAgICAgICBsZXQgZmlsZSA9IG9wdGlvbnMuZmlsZTtcclxuICAgICAgICBsZXQgZmlsZUlkID0gbnVsbDtcclxuICAgICAgICBsZXQgb2Zmc2V0ID0gMDtcclxuICAgICAgICBsZXQgbG9hZGVkID0gMDtcclxuICAgICAgICBsZXQgdG90YWwgPSBkYXRhLnNpemU7XHJcbiAgICAgICAgbGV0IHRyaWVzID0gMDtcclxuICAgICAgICBsZXQgcG9zdFVybCA9IG51bGw7XHJcbiAgICAgICAgbGV0IHRva2VuID0gbnVsbDtcclxuICAgICAgICBsZXQgY29tcGxldGUgPSBmYWxzZTtcclxuICAgICAgICBsZXQgdXBsb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCB0aW1lQSA9IG51bGw7XHJcbiAgICAgICAgbGV0IHRpbWVCID0gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IGVsYXBzZWRUaW1lID0gMDtcclxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gMDtcclxuXHJcbiAgICAgICAgLy8gS2VlcCBvbmx5IHRoZSBuYW1lIG9mIHRoZSBzdG9yZVxyXG4gICAgICAgIGlmIChzdG9yZSBpbnN0YW5jZW9mIFN0b3JlKSB7XHJcbiAgICAgICAgICAgIHN0b3JlID0gc3RvcmUuZ2V0TmFtZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXNzaWduIGZpbGUgdG8gc3RvcmVcclxuICAgICAgICBmaWxlLnN0b3JlID0gc3RvcmU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaCgpIHtcclxuICAgICAgICAgICAgLy8gRmluaXNoIHRoZSB1cGxvYWQgYnkgdGVsbGluZyB0aGUgc3RvcmUgdGhlIHVwbG9hZCBpcyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBNZXRlb3IuY2FsbCgndWZzQ29tcGxldGUnLCBmaWxlSWQsIHN0b3JlLCB0b2tlbiwgZnVuY3Rpb24gKGVyciwgdXBsb2FkZWRGaWxlKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkVycm9yKGVyciwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodXBsb2FkZWRGaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXBsb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUgPSB1cGxvYWRlZEZpbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkNvbXBsZXRlKHVwbG9hZGVkRmlsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQWJvcnRzIHRoZSBjdXJyZW50IHRyYW5zZmVyXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5hYm9ydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBmaWxlIGZyb20gZGF0YWJhc2VcclxuICAgICAgICAgICAgTWV0ZW9yLmNhbGwoJ3Vmc0RlbGV0ZScsIGZpbGVJZCwgc3RvcmUsIHRva2VuLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm9uRXJyb3IoZXJyLCBmaWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZXNldCB1cGxvYWRlciBzdGF0dXNcclxuICAgICAgICAgICAgdXBsb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZpbGVJZCA9IG51bGw7XHJcbiAgICAgICAgICAgIG9mZnNldCA9IDA7XHJcbiAgICAgICAgICAgIHRyaWVzID0gMDtcclxuICAgICAgICAgICAgbG9hZGVkID0gMDtcclxuICAgICAgICAgICAgY29tcGxldGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgc3RhcnRUaW1lID0gbnVsbDtcclxuICAgICAgICAgICAgc2VsZi5vbkFib3J0KGZpbGUpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIGF2ZXJhZ2Ugc3BlZWQgaW4gYnl0ZXMgcGVyIHNlY29uZFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRBdmVyYWdlU3BlZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGxldCBzZWNvbmRzID0gc2VsZi5nZXRFbGFwc2VkVGltZSgpIC8gMTAwMDtcclxuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZ2V0TG9hZGVkKCkgLyBzZWNvbmRzO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIGVsYXBzZWQgdGltZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0RWxhcHNlZFRpbWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChzdGFydFRpbWUgJiYgc2VsZi5pc1VwbG9hZGluZygpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxhcHNlZFRpbWUgKyAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGVsYXBzZWRUaW1lO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIGZpbGVcclxuICAgICAgICAgKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRGaWxlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBsb2FkZWQgYnl0ZXNcclxuICAgICAgICAgKiBAcmV0dXJuIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRMb2FkZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBsb2FkZWQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmV0dXJucyBjdXJyZW50IHByb2dyZXNzXHJcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuZ2V0UHJvZ3Jlc3MgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1pbigobG9hZGVkIC8gdG90YWwpICogMTAwIC8gMTAwLCAxLjApO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFJldHVybnMgdGhlIHJlbWFpbmluZyB0aW1lIGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRSZW1haW5pbmdUaW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBsZXQgYXZlcmFnZVNwZWVkID0gc2VsZi5nZXRBdmVyYWdlU3BlZWQoKTtcclxuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ0J5dGVzID0gdG90YWwgLSBzZWxmLmdldExvYWRlZCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gYXZlcmFnZVNwZWVkICYmIHJlbWFpbmluZ0J5dGVzID8gTWF0aC5tYXgocmVtYWluaW5nQnl0ZXMgLyBhdmVyYWdlU3BlZWQsIDApIDogMDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSB1cGxvYWQgc3BlZWQgaW4gYnl0ZXMgcGVyIHNlY29uZFxyXG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5nZXRTcGVlZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKHRpbWVBICYmIHRpbWVCICYmIHNlbGYuaXNVcGxvYWRpbmcoKSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNlY29uZHMgPSAodGltZUIgLSB0aW1lQSkgLyAxMDAwO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuY2h1bmtTaXplIC8gc2Vjb25kcztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBSZXR1cm5zIHRoZSB0b3RhbCBieXRlc1xyXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLmdldFRvdGFsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdG90YWw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ2hlY2tzIGlmIHRoZSB0cmFuc2ZlciBpcyBjb21wbGV0ZVxyXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5pc0NvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY29tcGxldGU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQ2hlY2tzIGlmIHRoZSB0cmFuc2ZlciBpcyBhY3RpdmVcclxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHNlbGYuaXNVcGxvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWRpbmc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogUmVhZHMgYSBwb3J0aW9uIG9mIGZpbGVcclxuICAgICAgICAgKiBAcGFyYW0gc3RhcnRcclxuICAgICAgICAgKiBAcGFyYW0gbGVuZ3RoXHJcbiAgICAgICAgICogQHBhcmFtIGNhbGxiYWNrXHJcbiAgICAgICAgICogQHJldHVybnMge0Jsb2J9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgc2VsZi5yZWFkQ2h1bmsgPSBmdW5jdGlvbiAoc3RhcnQsIGxlbmd0aCwgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlYWRDaHVuayBpcyBtaXNzaW5nIGNhbGxiYWNrJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGxldCBlbmQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjaHVuayBzaXplXHJcbiAgICAgICAgICAgICAgICBpZiAobGVuZ3RoICYmIHN0YXJ0ICsgbGVuZ3RoID4gdG90YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbmQgPSB0b3RhbDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5kID0gc3RhcnQgKyBsZW5ndGg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgY2h1bmtcclxuICAgICAgICAgICAgICAgIGxldCBjaHVuayA9IGRhdGEuc2xpY2Uoc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgICAgICAgICAvLyBQYXNzIGNodW5rIHRvIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHNlbGYsIG51bGwsIGNodW5rKTtcclxuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcigncmVhZCBlcnJvcicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAvLyBSZXRyeSB0byByZWFkIGNodW5rXHJcbiAgICAgICAgICAgICAgICBNZXRlb3Iuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyaWVzIDwgc2VsZi5tYXhUcmllcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmllcyArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlYWRDaHVuayhzdGFydCwgbGVuZ3RoLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgc2VsZi5yZXRyeURlbGF5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFNlbmRzIGEgZmlsZSBjaHVuayB0byB0aGUgc3RvcmVcclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLnNlbmRDaHVuayA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCFjb21wbGV0ZSAmJiBzdGFydFRpbWUgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmIChvZmZzZXQgPCB0b3RhbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjaHVua1NpemUgPSBzZWxmLmNodW5rU2l6ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGFkYXB0aXZlIGxlbmd0aFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmFkYXB0aXZlICYmIHRpbWVBICYmIHRpbWVCICYmIHRpbWVCID4gdGltZUEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGR1cmF0aW9uID0gKHRpbWVCIC0gdGltZUEpIC8gMTAwMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1heCA9IHNlbGYuY2FwYWNpdHkgKiAoMSArIGNhcGFjaXR5TWFyZ2luKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1pbiA9IHNlbGYuY2FwYWNpdHkgKiAoMSAtIGNhcGFjaXR5TWFyZ2luKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkdXJhdGlvbiA+PSBtYXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rU2l6ZSA9IE1hdGguYWJzKE1hdGgucm91bmQoY2h1bmtTaXplICogKG1heCAtIGR1cmF0aW9uKSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChkdXJhdGlvbiA8IG1pbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2h1bmtTaXplID0gTWF0aC5yb3VuZChjaHVua1NpemUgKiAobWluIC8gZHVyYXRpb24pKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW1pdCB0byBtYXggY2h1bmsgc2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5tYXhDaHVua1NpemUgPiAwICYmIGNodW5rU2l6ZSA+IHNlbGYubWF4Q2h1bmtTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHVua1NpemUgPSBzZWxmLm1heENodW5rU2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTGltaXQgdG8gbWF4IGNodW5rIHNpemVcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5tYXhDaHVua1NpemUgPiAwICYmIGNodW5rU2l6ZSA+IHNlbGYubWF4Q2h1bmtTaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rU2l6ZSA9IHNlbGYubWF4Q2h1bmtTaXplO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVkdWNlIGNodW5rIHNpemUgdG8gZml0IHRvdGFsXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9mZnNldCArIGNodW5rU2l6ZSA+IHRvdGFsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNodW5rU2l6ZSA9IHRvdGFsIC0gb2Zmc2V0O1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJlcGFyZSB0aGUgY2h1bmtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlYWRDaHVuayhvZmZzZXQsIGNodW5rU2l6ZSwgZnVuY3Rpb24gKGVyciwgY2h1bmspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkVycm9yKGVyciwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfLmNvbnRhaW5zKFsyMDAsIDIwMSwgMjAyLCAyMDRdLCB4aHIuc3RhdHVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lQiA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBjaHVua1NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArPSBjaHVua1NpemU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZW5kIG5leHQgY2h1bmtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vblByb2dyZXNzKGZpbGUsIHNlbGYuZ2V0UHJvZ3Jlc3MoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaW5pc2ggdXBsb2FkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWQgPj0gdG90YWwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsYXBzZWRUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbmlzaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWV0ZW9yLnNldFRpbWVvdXQoc2VsZi5zZW5kQ2h1bmssIHNlbGYudHJhbnNmZXJEZWxheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIV8uY29udGFpbnMoWzQwMiwgNDAzLCA0MDQsIDUwMF0sIHhoci5zdGF0dXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJldHJ5IHVudGlsIG1heCB0cmllcyBpcyByZWFjaFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCdXQgZG9uJ3QgcmV0cnkgaWYgdGhlc2UgZXJyb3JzIG9jY3VyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0cmllcyA8PSBzZWxmLm1heFRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmllcyArPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2FpdCBiZWZvcmUgcmV0cnlpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1ldGVvci5zZXRUaW1lb3V0KHNlbGYuc2VuZENodW5rLCBzZWxmLnJldHJ5RGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHVwbG9hZCBwcm9ncmVzc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSAob2Zmc2V0ICsgY2h1bmtTaXplKSAvIHRvdGFsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsZXQgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9ybURhdGEuYXBwZW5kKCdwcm9ncmVzcycsIHByb2dyZXNzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9ybURhdGEuYXBwZW5kKCdjaHVuaycsIGNodW5rKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHVybCA9IGAke3Bvc3RVcmx9JnByb2dyZXNzPSR7cHJvZ3Jlc3N9YDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVBID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZUIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGxvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCBjaHVuayB0byB0aGUgc3RvcmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2VuZChjaHVuayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTdGFydHMgb3IgcmVzdW1lcyB0aGUgdHJhbnNmZXJcclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIWZpbGVJZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBmaWxlIGRvY3VtZW50IGFuZCBnZXQgdGhlIHRva2VuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGFsbG93cyB0aGUgdXNlciB0byBzZW5kIGNodW5rcyB0byB0aGUgc3RvcmUuXHJcbiAgICAgICAgICAgICAgICBNZXRlb3IuY2FsbCgndWZzQ3JlYXRlJywgXy5leHRlbmQoe30sIGZpbGUpLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25FcnJvcihlcnIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRva2VuID0gcmVzdWx0LnRva2VuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3N0VXJsID0gcmVzdWx0LnVybDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUlkID0gcmVzdWx0LmZpbGVJZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5faWQgPSByZXN1bHQuZmlsZUlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9uQ3JlYXRlKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmllcyA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYub25TdGFydChmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZW5kQ2h1bmsoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICghdXBsb2FkaW5nICYmICFjb21wbGV0ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVzdW1lIHVwbG9hZGluZ1xyXG4gICAgICAgICAgICAgICAgdHJpZXMgPSAwO1xyXG4gICAgICAgICAgICAgICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgICAgIHNlbGYub25TdGFydChmaWxlKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2VuZENodW5rKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTdG9wcyB0aGUgdHJhbnNmZXJcclxuICAgICAgICAgKi9cclxuICAgICAgICBzZWxmLnN0b3AgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICh1cGxvYWRpbmcpIHtcclxuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBlbGFwc2VkIHRpbWVcclxuICAgICAgICAgICAgICAgIGVsYXBzZWRUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcclxuICAgICAgICAgICAgICAgIHN0YXJ0VGltZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB1cGxvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHNlbGYub25TdG9wKGZpbGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIE1ldGVvci5jYWxsKCd1ZnNTdG9wJywgZmlsZUlkLCBzdG9yZSwgdG9rZW4sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5vbkVycm9yKGVyciwgZmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGZpbGUgdXBsb2FkIGlzIGFib3J0ZWRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uQWJvcnQoZmlsZSkge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGZpbGUgdXBsb2FkIGlzIGNvbXBsZXRlXHJcbiAgICAgKiBAcGFyYW0gZmlsZVxyXG4gICAgICovXHJcbiAgICBvbkNvbXBsZXRlKGZpbGUpIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIHRoZSBmaWxlIGlzIGNyZWF0ZWQgaW4gdGhlIGNvbGxlY3Rpb25cclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uQ3JlYXRlKGZpbGUpIHtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENhbGxlZCB3aGVuIGFuIGVycm9yIG9jY3VycyBkdXJpbmcgZmlsZSB1cGxvYWRcclxuICAgICAqIEBwYXJhbSBlcnJcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uRXJyb3IoZXJyLCBmaWxlKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihgdWZzOiAke2Vyci5tZXNzYWdlfWApO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gYSBmaWxlIGNodW5rIGhhcyBiZWVuIHNlbnRcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKiBAcGFyYW0gcHJvZ3Jlc3MgaXMgYSBmbG9hdCBmcm9tIDAuMCB0byAxLjBcclxuICAgICAqL1xyXG4gICAgb25Qcm9ncmVzcyhmaWxlLCBwcm9ncmVzcykge1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbGVkIHdoZW4gdGhlIGZpbGUgdXBsb2FkIHN0YXJ0c1xyXG4gICAgICogQHBhcmFtIGZpbGVcclxuICAgICAqL1xyXG4gICAgb25TdGFydChmaWxlKSB7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsZWQgd2hlbiB0aGUgZmlsZSB1cGxvYWQgc3RvcHNcclxuICAgICAqIEBwYXJhbSBmaWxlXHJcbiAgICAgKi9cclxuICAgIG9uU3RvcChmaWxlKSB7XHJcbiAgICB9XHJcbn1cclxuIl19
