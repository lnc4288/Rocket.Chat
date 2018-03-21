(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var Inject = Package['meteorhacks:inject-initial'].Inject;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var DynamicCss;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:ui-master":{"server":{"inject.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_ui-master/server/inject.js                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);

const renderDynamicCssList = _.debounce(Meteor.bindEnvironment(() => {
  // const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
  const colors = RocketChat.models.Settings.find({
    _id: /theme-color-rc/i
  }, {
    fields: {
      value: 1,
      editor: 1
    }
  }).fetch().filter(color => color && color.value);

  if (!colors) {
    return;
  }

  const css = colors.map(({
    _id,
    value,
    editor
  }) => {
    if (editor === 'expression') {
      return `--${_id.replace('theme-color-', '')}: var(--${value});`;
    }

    return `--${_id.replace('theme-color-', '')}: ${value};`;
  }).join('\n');
  Inject.rawBody('dynamic-variables', `<style id='css-variables'> :root {${css}}</style>`);
}), 500);

renderDynamicCssList(); // RocketChat.models.Settings.find({_id:'theme-custom-variables'}, {fields: { value: 1}}).observe({
// 	changed: renderDynamicCssList
// });

RocketChat.models.Settings.find({
  _id: /theme-color-rc/i
}, {
  fields: {
    value: 1
  }
}).observe({
  changed: renderDynamicCssList
});
Inject.rawHead('dynamic', `<script>(${require('./dynamic-css.js').default.toString().replace(/\/\/.*?\n/g, '')})()</script>`);
Inject.rawBody('icons', Assets.getText('public/icons.svg'));
Inject.rawBody('page-loading-div', `
<div id="initial-page-loading" class="page-loading">
	<div class="loading-animation">
		<div class="bounce bounce1"></div>
		<div class="bounce bounce2"></div>
		<div class="bounce bounce3"></div>
	</div>
</div>`);

if (process.env.DISABLE_ANIMATION || process.env.TEST_MODE === 'true') {
  Inject.rawHead('disable-animation', `
	<style>
		body, body * {
			animation: none !important;
			transition: none !important;
		}
	</style>
	<script>
		window.DISABLE_ANIMATION = true;
	</script>
	`);
}

RocketChat.settings.get('Assets_SvgFavicon_Enable', (key, value) => {
  const standardFavicons = `
		<link rel="icon" sizes="16x16" type="image/png" href="assets/favicon_16.png" />
		<link rel="icon" sizes="32x32" type="image/png" href="assets/favicon_32.png" />`;

  if (value) {
    Inject.rawHead(key, `${standardFavicons}
			<link rel="icon" sizes="any" type="image/svg+xml" href="assets/favicon.svg" />`);
  } else {
    Inject.rawHead(key, standardFavicons);
  }
});
RocketChat.settings.get('theme-color-sidebar-background', (key, value) => {
  Inject.rawHead(key, `<meta name="msapplication-TileColor" content="${value}" />` + `<meta name="theme-color" content="${value}" />`);
});
RocketChat.settings.get('Accounts_ForgetUserSessionOnWindowClose', (key, value) => {
  if (value) {
    Inject.rawModHtml(key, html => {
      const script = `
				<script>
					if (Meteor._localStorage._data === undefined && window.sessionStorage) {
						Meteor._localStorage = window.sessionStorage;
					}
				</script>
			`;
      return html.replace(/<\/body>/, `${script}\n</body>`);
    });
  } else {
    Inject.rawModHtml(key, html => {
      return html;
    });
  }
});
RocketChat.settings.get('Site_Name', (key, value = 'Rocket.Chat') => {
  Inject.rawHead(key, `<title>${value}</title>` + `<meta name="application-name" content="${value}">` + `<meta name="apple-mobile-web-app-title" content="${value}">`);
});
RocketChat.settings.get('Meta_language', (key, value = '') => {
  Inject.rawHead(key, `<meta http-equiv="content-language" content="${value}">` + `<meta name="language" content="${value}">`);
});
RocketChat.settings.get('Meta_robots', (key, value = '') => {
  Inject.rawHead(key, `<meta name="robots" content="${value}">`);
});
RocketChat.settings.get('Meta_msvalidate01', (key, value = '') => {
  Inject.rawHead(key, `<meta name="msvalidate.01" content="${value}">`);
});
RocketChat.settings.get('Meta_google-site-verification', (key, value = '') => {
  Inject.rawHead(key, `<meta name="google-site-verification" content="${value}" />`);
});
RocketChat.settings.get('Meta_fb_app_id', (key, value = '') => {
  Inject.rawHead(key, `<meta property="fb:app_id" content="${value}">`);
});
RocketChat.settings.get('Meta_custom', (key, value = '') => {
  Inject.rawHead(key, value);
});
Meteor.defer(() => {
  let baseUrl;

  if (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.trim() !== '') {
    baseUrl = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
  } else {
    baseUrl = '/';
  }

  if (/\/$/.test(baseUrl) === false) {
    baseUrl += '/';
  }

  Inject.rawHead('base', `<base href="${baseUrl}">`);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dynamic-css.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/rocketchat_ui-master/server/dynamic-css.js                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/* global DynamicCss */
'use strict';

module.exportDefault(() => {
  const debounce = (func, wait, immediate) => {
    let timeout;
    return function (...args) {
      const later = () => {
        timeout = null;
        !immediate && func.apply(this, args);
      };

      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      callNow && func.apply(this, args);
    };
  };

  const cssVarPoly = {
    test() {
      return window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');
    },

    init() {
      if (this.test()) {
        return;
      }

      console.time('cssVarPoly');
      cssVarPoly.ratifiedVars = {};
      cssVarPoly.varsByBlock = [];
      cssVarPoly.oldCSS = [];
      cssVarPoly.findCSS();
      cssVarPoly.updateCSS();
      console.timeEnd('cssVarPoly');
    },

    findCSS() {
      const styleBlocks = Array.prototype.concat.apply([], document.querySelectorAll('#css-variables, link[type="text/css"].__meteor-css__')); // we need to track the order of the style/link elements when we save off the CSS, set a counter

      let counter = 1; // loop through all CSS blocks looking for CSS variables being set

      styleBlocks.map(block => {
        // console.log(block.nodeName);
        if (block.nodeName === 'STYLE') {
          const theCSS = block.innerHTML;
          cssVarPoly.findSetters(theCSS, counter);
          cssVarPoly.oldCSS[counter++] = theCSS;
        } else if (block.nodeName === 'LINK') {
          const url = block.getAttribute('href');
          cssVarPoly.oldCSS[counter] = '';
          cssVarPoly.getLink(url, counter, function (counter, request) {
            cssVarPoly.findSetters(request.responseText, counter);
            cssVarPoly.oldCSS[counter++] = request.responseText;
            cssVarPoly.updateCSS();
          });
        }
      });
    },

    // find all the "--variable: value" matches in a provided block of CSS and add them to the master list
    findSetters(theCSS, counter) {
      // console.log(theCSS);
      cssVarPoly.varsByBlock[counter] = theCSS.match(/(--[^:; ]+:..*?;)/g);
    },

    // run through all the CSS blocks to update the variables and then inject on the page
    updateCSS: debounce(() => {
      // first lets loop through all the variables to make sure later vars trump earlier vars
      cssVarPoly.ratifySetters(cssVarPoly.varsByBlock); // loop through the css blocks (styles and links)

      cssVarPoly.oldCSS.filter(e => e).forEach((css, id) => {
        const newCSS = cssVarPoly.replaceGetters(css, cssVarPoly.ratifiedVars);
        const el = document.querySelector(`#inserted${id}`);

        if (el) {
          // console.log("updating")
          el.innerHTML = newCSS;
        } else {
          // console.log("adding");
          const style = document.createElement('style');
          style.type = 'text/css';
          style.innerHTML = newCSS;
          style.classList.add('inserted');
          style.id = `inserted${id}`;
          document.getElementsByTagName('head')[0].appendChild(style);
        }
      });
    }, 100),

    // parse a provided block of CSS looking for a provided list of variables and replace the --var-name with the correct value
    replaceGetters(oldCSS, varList) {
      return oldCSS.replace(/var\((--.*?)\)/gm, (all, variable) => varList[variable]);
    },

    // determine the css variable name value pair and track the latest
    ratifySetters(varList) {
      // loop through each block in order, to maintain order specificity
      varList.filter(curVars => curVars).forEach(curVars => {
        // const curVars = varList[curBlock] || [];
        curVars.forEach(function (theVar) {
          // console.log(theVar);
          // split on the name value pair separator
          const matches = theVar.split(/:\s*/); // console.log(matches);
          // put it in an object based on the varName. Each time we do this it will override a previous use and so will always have the last set be the winner
          // 0 = the name, 1 = the value, strip off the ; if it is there

          cssVarPoly.ratifiedVars[matches[0]] = matches[1].replace(/;/, '');
        });
      });
      Object.keys(cssVarPoly.ratifiedVars).filter(key => {
        return cssVarPoly.ratifiedVars[key].indexOf('var') > -1;
      }).forEach(key => {
        cssVarPoly.ratifiedVars[key] = cssVarPoly.ratifiedVars[key].replace(/var\((--.*?)\)/gm, function (all, variable) {
          return cssVarPoly.ratifiedVars[variable];
        });
      });
    },

    // get the CSS file (same domain for now)
    getLink(url, counter, success) {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.overrideMimeType('text/css;');

      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          // Success!
          // console.log(request.responseText);
          if (typeof success === 'function') {
            success(counter, request);
          }
        } else {
          // We reached our target server, but it returned an error
          console.warn('an error was returned from:', url);
        }
      };

      request.onerror = function () {
        // There was a connection error of some sort
        console.warn('we could not get anything from:', url);
      };

      request.send();
    }

  };
  const stateCheck = setInterval(() => {
    if (document.readyState === 'complete' && typeof Meteor !== 'undefined') {
      clearInterval(stateCheck); // document ready

      cssVarPoly.init();
    }
  }, 100);
  DynamicCss = typeof DynamicCss !== 'undefined' ? DynamicCss : {};

  DynamicCss.test = () => window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');

  DynamicCss.run = debounce((replace = false) => {
    if (replace) {
      // const variables = RocketChat.models.Settings.findOne({_id:'theme-custom-variables'}, {fields: { value: 1}});
      const colors = RocketChat.settings.collection.find({
        _id: /theme-color-rc/i
      }, {
        fields: {
          value: 1,
          editor: 1
        }
      }).fetch().filter(color => color && color.value);

      if (!colors) {
        return;
      }

      const css = colors.map(({
        _id,
        value,
        editor
      }) => {
        if (editor === 'expression') {
          return `--${_id.replace('theme-color-', '')}: var(--${value});`;
        }

        return `--${_id.replace('theme-color-', '')}: ${value};`;
      }).join('\n');
      document.querySelector('#css-variables').innerHTML = `:root {${css}}`;
    }

    cssVarPoly.init();
  }, 1000);
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:ui-master/server/inject.js");

/* Exports */
Package._define("rocketchat:ui-master");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_ui-master.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS1tYXN0ZXIvc2VydmVyL2luamVjdC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp1aS1tYXN0ZXIvc2VydmVyL2R5bmFtaWMtY3NzLmpzIl0sIm5hbWVzIjpbIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsInJlbmRlckR5bmFtaWNDc3NMaXN0IiwiZGVib3VuY2UiLCJNZXRlb3IiLCJiaW5kRW52aXJvbm1lbnQiLCJjb2xvcnMiLCJSb2NrZXRDaGF0IiwibW9kZWxzIiwiU2V0dGluZ3MiLCJmaW5kIiwiX2lkIiwiZmllbGRzIiwidmFsdWUiLCJlZGl0b3IiLCJmZXRjaCIsImZpbHRlciIsImNvbG9yIiwiY3NzIiwibWFwIiwicmVwbGFjZSIsImpvaW4iLCJJbmplY3QiLCJyYXdCb2R5Iiwib2JzZXJ2ZSIsImNoYW5nZWQiLCJyYXdIZWFkIiwidG9TdHJpbmciLCJBc3NldHMiLCJnZXRUZXh0IiwicHJvY2VzcyIsImVudiIsIkRJU0FCTEVfQU5JTUFUSU9OIiwiVEVTVF9NT0RFIiwic2V0dGluZ3MiLCJnZXQiLCJrZXkiLCJzdGFuZGFyZEZhdmljb25zIiwicmF3TW9kSHRtbCIsImh0bWwiLCJzY3JpcHQiLCJkZWZlciIsImJhc2VVcmwiLCJfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fIiwiUk9PVF9VUkxfUEFUSF9QUkVGSVgiLCJ0cmltIiwidGVzdCIsImV4cG9ydERlZmF1bHQiLCJmdW5jIiwid2FpdCIsImltbWVkaWF0ZSIsInRpbWVvdXQiLCJhcmdzIiwibGF0ZXIiLCJhcHBseSIsImNhbGxOb3ciLCJjbGVhclRpbWVvdXQiLCJzZXRUaW1lb3V0IiwiY3NzVmFyUG9seSIsIndpbmRvdyIsIkNTUyIsInN1cHBvcnRzIiwiaW5pdCIsImNvbnNvbGUiLCJ0aW1lIiwicmF0aWZpZWRWYXJzIiwidmFyc0J5QmxvY2siLCJvbGRDU1MiLCJmaW5kQ1NTIiwidXBkYXRlQ1NTIiwidGltZUVuZCIsInN0eWxlQmxvY2tzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjb25jYXQiLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJjb3VudGVyIiwiYmxvY2siLCJub2RlTmFtZSIsInRoZUNTUyIsImlubmVySFRNTCIsImZpbmRTZXR0ZXJzIiwidXJsIiwiZ2V0QXR0cmlidXRlIiwiZ2V0TGluayIsInJlcXVlc3QiLCJyZXNwb25zZVRleHQiLCJtYXRjaCIsInJhdGlmeVNldHRlcnMiLCJlIiwiZm9yRWFjaCIsImlkIiwibmV3Q1NTIiwicmVwbGFjZUdldHRlcnMiLCJlbCIsInF1ZXJ5U2VsZWN0b3IiLCJzdHlsZSIsImNyZWF0ZUVsZW1lbnQiLCJ0eXBlIiwiY2xhc3NMaXN0IiwiYWRkIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJhcHBlbmRDaGlsZCIsInZhckxpc3QiLCJhbGwiLCJ2YXJpYWJsZSIsImN1clZhcnMiLCJ0aGVWYXIiLCJtYXRjaGVzIiwic3BsaXQiLCJPYmplY3QiLCJrZXlzIiwiaW5kZXhPZiIsInN1Y2Nlc3MiLCJYTUxIdHRwUmVxdWVzdCIsIm9wZW4iLCJvdmVycmlkZU1pbWVUeXBlIiwib25sb2FkIiwic3RhdHVzIiwid2FybiIsIm9uZXJyb3IiLCJzZW5kIiwic3RhdGVDaGVjayIsInNldEludGVydmFsIiwicmVhZHlTdGF0ZSIsImNsZWFySW50ZXJ2YWwiLCJEeW5hbWljQ3NzIiwicnVuIiwiY29sbGVjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxDQUFKOztBQUFNQyxPQUFPQyxLQUFQLENBQWFDLFFBQVEsWUFBUixDQUFiLEVBQW1DO0FBQUNDLFVBQVFDLENBQVIsRUFBVTtBQUFDTCxRQUFFSyxDQUFGO0FBQUk7O0FBQWhCLENBQW5DLEVBQXFELENBQXJEOztBQUdOLE1BQU1DLHVCQUF1Qk4sRUFBRU8sUUFBRixDQUFXQyxPQUFPQyxlQUFQ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ZixFQUE2QjtBQUM1QixpQkFBUSxLQUFLSCxJQUFJUyxPQUFKLENBQVksY0FBWixFQUE0QixFQUE1QixDQUFpQyxXQUFXUCxLQUFPLElBQWhFO0FBQ0E7O0FBQ0QsZUFBUSxLQUFLRixJQUFJUyxPQUFKLENBQVksY0FBWixFQUE0QixFQUE1QixDQUFpQyxLQUFLUCxLQUFPLEdBQTFEO0FBQ0EsT0FMVyxFQUtUUSxJQUxTLENBS0osSUFMSSxDQUFaO0FBTUFzRCxlQUFTcUIsYUFBVCxDQUF1QixnQkFBdkIsRUFBeUNmLFNBQXpDLEdBQXNELFVBQVUvRCxHQUFLLEdBQXJFO0FBQ0E7O0FBQ0R3QyxlQUFXSSxJQUFYO0FBQ0EsR0FqQmdCLEVBaUJkLElBakJjLENBQWpCO0FBa0JBLENBM0tELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfdWktbWFzdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBJbmplY3QgKi9cbmltcG9ydCBfIGZyb20gJ3VuZGVyc2NvcmUnO1xuXG5jb25zdCByZW5kZXJEeW5hbWljQ3NzTGlzdCA9IF8uZGVib3VuY2UoTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCgoKSA9PiB7XG5cdC8vIGNvbnN0IHZhcmlhYmxlcyA9IFJvY2tldENoYXQubW9kZWxzLlNldHRpbmdzLmZpbmRPbmUoe19pZDondGhlbWUtY3VzdG9tLXZhcmlhYmxlcyd9LCB7ZmllbGRzOiB7IHZhbHVlOiAxfX0pO1xuXHRjb25zdCBjb2xvcnMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kKHtfaWQ6L3RoZW1lLWNvbG9yLXJjL2l9LCB7ZmllbGRzOiB7IHZhbHVlOiAxLCBlZGl0b3I6IDF9fSkuZmV0Y2goKS5maWx0ZXIoY29sb3IgPT4gY29sb3IgJiYgY29sb3IudmFsdWUpO1xuXG5cdGlmICghY29sb3JzKSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGNvbnN0IGNzcyA9IGNvbG9ycy5tYXAoKHtfaWQsIHZhbHVlLCBlZGl0b3J9KSA9PiB7XG5cdFx0aWYgKGVkaXRvciA9PT0gJ2V4cHJlc3Npb24nKSB7XG5cdFx0XHRyZXR1cm4gYC0tJHsgX2lkLnJlcGxhY2UoJ3RoZW1lLWNvbG9yLScsICcnKSB9OiB2YXIoLS0keyB2YWx1ZSB9KTtgO1xuXHRcdH1cblx0XHRyZXR1cm4gYC0tJHsgX2lkLnJlcGxhY2UoJ3RoZW1lLWNvbG9yLScsICcnKSB9OiAkeyB2YWx1ZSB9O2A7XG5cdH0pLmpvaW4oJ1xcbicpO1xuXHRJbmplY3QucmF3Qm9keSgnZHluYW1pYy12YXJpYWJsZXMnLCBgPHN0eWxlIGlkPSdjc3MtdmFyaWFibGVzJz4gOnJvb3QgeyR7IGNzcyB9fTwvc3R5bGU+YCk7XG59KSwgNTAwKTtcblxucmVuZGVyRHluYW1pY0Nzc0xpc3QoKTtcblxuLy8gUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZCh7X2lkOid0aGVtZS1jdXN0b20tdmFyaWFibGVzJ30sIHtmaWVsZHM6IHsgdmFsdWU6IDF9fSkub2JzZXJ2ZSh7XG4vLyBcdGNoYW5nZWQ6IHJlbmRlckR5bmFtaWNDc3NMaXN0XG4vLyB9KTtcblxuUm9ja2V0Q2hhdC5tb2RlbHMuU2V0dGluZ3MuZmluZCh7X2lkOi90aGVtZS1jb2xvci1yYy9pfSwge2ZpZWxkczogeyB2YWx1ZTogMX19KS5vYnNlcnZlKHtcblx0Y2hhbmdlZDogcmVuZGVyRHluYW1pY0Nzc0xpc3Rcbn0pO1xuXG5JbmplY3QucmF3SGVhZCgnZHluYW1pYycsIGA8c2NyaXB0PigkeyByZXF1aXJlKCcuL2R5bmFtaWMtY3NzLmpzJykuZGVmYXVsdC50b1N0cmluZygpLnJlcGxhY2UoL1xcL1xcLy4qP1xcbi9nLCAnJykgfSkoKTwvc2NyaXB0PmApO1xuXG5JbmplY3QucmF3Qm9keSgnaWNvbnMnLCBBc3NldHMuZ2V0VGV4dCgncHVibGljL2ljb25zLnN2ZycpKTtcblxuSW5qZWN0LnJhd0JvZHkoJ3BhZ2UtbG9hZGluZy1kaXYnLCBgXG48ZGl2IGlkPVwiaW5pdGlhbC1wYWdlLWxvYWRpbmdcIiBjbGFzcz1cInBhZ2UtbG9hZGluZ1wiPlxuXHQ8ZGl2IGNsYXNzPVwibG9hZGluZy1hbmltYXRpb25cIj5cblx0XHQ8ZGl2IGNsYXNzPVwiYm91bmNlIGJvdW5jZTFcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiYm91bmNlIGJvdW5jZTJcIj48L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwiYm91bmNlIGJvdW5jZTNcIj48L2Rpdj5cblx0PC9kaXY+XG48L2Rpdj5gKTtcblxuaWYgKHByb2Nlc3MuZW52LkRJU0FCTEVfQU5JTUFUSU9OIHx8IHByb2Nlc3MuZW52LlRFU1RfTU9ERSA9PT0gJ3RydWUnKSB7XG5cdEluamVjdC5yYXdIZWFkKCdkaXNhYmxlLWFuaW1hdGlvbicsIGBcblx0PHN0eWxlPlxuXHRcdGJvZHksIGJvZHkgKiB7XG5cdFx0XHRhbmltYXRpb246IG5vbmUgIWltcG9ydGFudDtcblx0XHRcdHRyYW5zaXRpb246IG5vbmUgIWltcG9ydGFudDtcblx0XHR9XG5cdDwvc3R5bGU+XG5cdDxzY3JpcHQ+XG5cdFx0d2luZG93LkRJU0FCTEVfQU5JTUFUSU9OID0gdHJ1ZTtcblx0PC9zY3JpcHQ+XG5cdGApO1xufVxuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQXNzZXRzX1N2Z0Zhdmljb25fRW5hYmxlJywgKGtleSwgdmFsdWUpID0+IHtcblx0Y29uc3Qgc3RhbmRhcmRGYXZpY29ucyA9IGBcblx0XHQ8bGluayByZWw9XCJpY29uXCIgc2l6ZXM9XCIxNngxNlwiIHR5cGU9XCJpbWFnZS9wbmdcIiBocmVmPVwiYXNzZXRzL2Zhdmljb25fMTYucG5nXCIgLz5cblx0XHQ8bGluayByZWw9XCJpY29uXCIgc2l6ZXM9XCIzMngzMlwiIHR5cGU9XCJpbWFnZS9wbmdcIiBocmVmPVwiYXNzZXRzL2Zhdmljb25fMzIucG5nXCIgLz5gO1xuXG5cdGlmICh2YWx1ZSkge1xuXHRcdEluamVjdC5yYXdIZWFkKGtleSxcblx0XHRcdGAkeyBzdGFuZGFyZEZhdmljb25zIH1cblx0XHRcdDxsaW5rIHJlbD1cImljb25cIiBzaXplcz1cImFueVwiIHR5cGU9XCJpbWFnZS9zdmcreG1sXCIgaHJlZj1cImFzc2V0cy9mYXZpY29uLnN2Z1wiIC8+YCk7XG5cdH0gZWxzZSB7XG5cdFx0SW5qZWN0LnJhd0hlYWQoa2V5LCBzdGFuZGFyZEZhdmljb25zKTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCd0aGVtZS1jb2xvci1zaWRlYmFyLWJhY2tncm91bmQnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksIGA8bWV0YSBuYW1lPVwibXNhcHBsaWNhdGlvbi1UaWxlQ29sb3JcIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiIC8+YCArXG5cdFx0XHRcdFx0XHRgPG1ldGEgbmFtZT1cInRoZW1lLWNvbG9yXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIiAvPmApO1xufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBY2NvdW50c19Gb3JnZXRVc2VyU2Vzc2lvbk9uV2luZG93Q2xvc2UnLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRpZiAodmFsdWUpIHtcblx0XHRJbmplY3QucmF3TW9kSHRtbChrZXksIChodG1sKSA9PiB7XG5cdFx0XHRjb25zdCBzY3JpcHQgPSBgXG5cdFx0XHRcdDxzY3JpcHQ+XG5cdFx0XHRcdFx0aWYgKE1ldGVvci5fbG9jYWxTdG9yYWdlLl9kYXRhID09PSB1bmRlZmluZWQgJiYgd2luZG93LnNlc3Npb25TdG9yYWdlKSB7XG5cdFx0XHRcdFx0XHRNZXRlb3IuX2xvY2FsU3RvcmFnZSA9IHdpbmRvdy5zZXNzaW9uU3RvcmFnZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdDwvc2NyaXB0PlxuXHRcdFx0YDtcblx0XHRcdHJldHVybiBodG1sLnJlcGxhY2UoLzxcXC9ib2R5Pi8sIGAkeyBzY3JpcHQgfVxcbjwvYm9keT5gKTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRJbmplY3QucmF3TW9kSHRtbChrZXksIChodG1sKSA9PiB7XG5cdFx0XHRyZXR1cm4gaHRtbDtcblx0XHR9KTtcblx0fVxufSk7XG5cblJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdTaXRlX05hbWUnLCAoa2V5LCB2YWx1ZSA9ICdSb2NrZXQuQ2hhdCcpID0+IHtcblx0SW5qZWN0LnJhd0hlYWQoa2V5LFxuXHRcdGA8dGl0bGU+JHsgdmFsdWUgfTwvdGl0bGU+YCArXG5cdFx0YDxtZXRhIG5hbWU9XCJhcHBsaWNhdGlvbi1uYW1lXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gICtcblx0XHRgPG1ldGEgbmFtZT1cImFwcGxlLW1vYmlsZS13ZWItYXBwLXRpdGxlXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9sYW5ndWFnZScsIChrZXksIHZhbHVlID0gJycpID0+IHtcblx0SW5qZWN0LnJhd0hlYWQoa2V5LFxuXHRcdGA8bWV0YSBodHRwLWVxdWl2PVwiY29udGVudC1sYW5ndWFnZVwiIGNvbnRlbnQ9XCIkeyB2YWx1ZSB9XCI+YCArXG5cdFx0YDxtZXRhIG5hbWU9XCJsYW5ndWFnZVwiIGNvbnRlbnQ9XCIkeyB2YWx1ZSB9XCI+YCk7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01ldGFfcm9ib3RzJywgKGtleSwgdmFsdWUgPSAnJykgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksIGA8bWV0YSBuYW1lPVwicm9ib3RzXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9tc3ZhbGlkYXRlMDEnLCAoa2V5LCB2YWx1ZSA9ICcnKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgYDxtZXRhIG5hbWU9XCJtc3ZhbGlkYXRlLjAxXCIgY29udGVudD1cIiR7IHZhbHVlIH1cIj5gKTtcbn0pO1xuXG5Sb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnTWV0YV9nb29nbGUtc2l0ZS12ZXJpZmljYXRpb24nLCAoa2V5LCB2YWx1ZSA9ICcnKSA9PiB7XG5cdEluamVjdC5yYXdIZWFkKGtleSwgYDxtZXRhIG5hbWU9XCJnb29nbGUtc2l0ZS12ZXJpZmljYXRpb25cIiBjb250ZW50PVwiJHsgdmFsdWUgfVwiIC8+YCk7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01ldGFfZmJfYXBwX2lkJywgKGtleSwgdmFsdWUgPSAnJykgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksIGA8bWV0YSBwcm9wZXJ0eT1cImZiOmFwcF9pZFwiIGNvbnRlbnQ9XCIkeyB2YWx1ZSB9XCI+YCk7XG59KTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ01ldGFfY3VzdG9tJywgKGtleSwgdmFsdWUgPSAnJykgPT4ge1xuXHRJbmplY3QucmF3SGVhZChrZXksIHZhbHVlKTtcbn0pO1xuXG5NZXRlb3IuZGVmZXIoKCkgPT4ge1xuXHRsZXQgYmFzZVVybDtcblx0aWYgKF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVggJiYgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5ST09UX1VSTF9QQVRIX1BSRUZJWC50cmltKCkgIT09ICcnKSB7XG5cdFx0YmFzZVVybCA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uUk9PVF9VUkxfUEFUSF9QUkVGSVg7XG5cdH0gZWxzZSB7XG5cdFx0YmFzZVVybCA9ICcvJztcblx0fVxuXHRpZiAoL1xcLyQvLnRlc3QoYmFzZVVybCkgPT09IGZhbHNlKSB7XG5cdFx0YmFzZVVybCArPSAnLyc7XG5cdH1cblx0SW5qZWN0LnJhd0hlYWQoJ2Jhc2UnLCBgPGJhc2UgaHJlZj1cIiR7IGJhc2VVcmwgfVwiPmApO1xufSk7XG4iLCIvKiBnbG9iYWwgRHluYW1pY0NzcyAqL1xuXG4ndXNlIHN0cmljdCc7XG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG5cblx0Y29uc3QgZGVib3VuY2UgPSAoZnVuYywgd2FpdCwgaW1tZWRpYXRlKSA9PiB7XG5cdFx0bGV0IHRpbWVvdXQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0XHRcdGNvbnN0IGxhdGVyID0gKCkgPT4ge1xuXHRcdFx0XHR0aW1lb3V0ID0gbnVsbDtcblx0XHRcdFx0IWltbWVkaWF0ZSAmJiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXHRcdFx0fTtcblx0XHRcdGNvbnN0IGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG5cdFx0XHRjYWxsTm93ICYmIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG5cdFx0fTtcblx0fTtcblx0Y29uc3QgY3NzVmFyUG9seSA9IHtcblx0XHR0ZXN0KCkgeyByZXR1cm4gd2luZG93LkNTUyAmJiB3aW5kb3cuQ1NTLnN1cHBvcnRzICYmIHdpbmRvdy5DU1Muc3VwcG9ydHMoJygtLWZvbzogcmVkKScpOyB9LFxuXHRcdGluaXQoKSB7XG5cdFx0XHRpZiAodGhpcy50ZXN0KCkpIHtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y29uc29sZS50aW1lKCdjc3NWYXJQb2x5Jyk7XG5cdFx0XHRjc3NWYXJQb2x5LnJhdGlmaWVkVmFycyA9IHt9O1xuXHRcdFx0Y3NzVmFyUG9seS52YXJzQnlCbG9jayA9IFtdO1xuXHRcdFx0Y3NzVmFyUG9seS5vbGRDU1MgPSBbXTtcblxuXHRcdFx0Y3NzVmFyUG9seS5maW5kQ1NTKCk7XG5cdFx0XHRjc3NWYXJQb2x5LnVwZGF0ZUNTUygpO1xuXHRcdFx0Y29uc29sZS50aW1lRW5kKCdjc3NWYXJQb2x5Jyk7XG5cdFx0fSxcblx0XHRmaW5kQ1NTKCkge1xuXHRcdFx0Y29uc3Qgc3R5bGVCbG9ja3MgPSBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcjY3NzLXZhcmlhYmxlcywgbGlua1t0eXBlPVwidGV4dC9jc3NcIl0uX19tZXRlb3ItY3NzX18nKSk7XG5cblx0XHRcdC8vIHdlIG5lZWQgdG8gdHJhY2sgdGhlIG9yZGVyIG9mIHRoZSBzdHlsZS9saW5rIGVsZW1lbnRzIHdoZW4gd2Ugc2F2ZSBvZmYgdGhlIENTUywgc2V0IGEgY291bnRlclxuXHRcdFx0bGV0IGNvdW50ZXIgPSAxO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggYWxsIENTUyBibG9ja3MgbG9va2luZyBmb3IgQ1NTIHZhcmlhYmxlcyBiZWluZyBzZXRcblx0XHRcdHN0eWxlQmxvY2tzLm1hcChibG9jayA9PiB7XG5cdFx0XHRcdC8vIGNvbnNvbGUubG9nKGJsb2NrLm5vZGVOYW1lKTtcblx0XHRcdFx0aWYgKGJsb2NrLm5vZGVOYW1lID09PSAnU1RZTEUnKSB7XG5cdFx0XHRcdFx0Y29uc3QgdGhlQ1NTID0gYmxvY2suaW5uZXJIVE1MO1xuXHRcdFx0XHRcdGNzc1ZhclBvbHkuZmluZFNldHRlcnModGhlQ1NTLCBjb3VudGVyKTtcblx0XHRcdFx0XHRjc3NWYXJQb2x5Lm9sZENTU1tjb3VudGVyKytdID0gdGhlQ1NTO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGJsb2NrLm5vZGVOYW1lID09PSAnTElOSycpIHtcblx0XHRcdFx0XHRjb25zdCB1cmwgPSBibG9jay5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblx0XHRcdFx0XHRjc3NWYXJQb2x5Lm9sZENTU1tjb3VudGVyXSA9ICcnO1xuXHRcdFx0XHRcdGNzc1ZhclBvbHkuZ2V0TGluayh1cmwsIGNvdW50ZXIsIGZ1bmN0aW9uKGNvdW50ZXIsIHJlcXVlc3QpIHtcblx0XHRcdFx0XHRcdGNzc1ZhclBvbHkuZmluZFNldHRlcnMocmVxdWVzdC5yZXNwb25zZVRleHQsIGNvdW50ZXIpO1xuXHRcdFx0XHRcdFx0Y3NzVmFyUG9seS5vbGRDU1NbY291bnRlcisrXSA9IHJlcXVlc3QucmVzcG9uc2VUZXh0O1xuXHRcdFx0XHRcdFx0Y3NzVmFyUG9seS51cGRhdGVDU1MoKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdC8vIGZpbmQgYWxsIHRoZSBcIi0tdmFyaWFibGU6IHZhbHVlXCIgbWF0Y2hlcyBpbiBhIHByb3ZpZGVkIGJsb2NrIG9mIENTUyBhbmQgYWRkIHRoZW0gdG8gdGhlIG1hc3RlciBsaXN0XG5cdFx0ZmluZFNldHRlcnModGhlQ1NTLCBjb3VudGVyKSB7XG5cdFx0XHQvLyBjb25zb2xlLmxvZyh0aGVDU1MpO1xuXHRcdFx0Y3NzVmFyUG9seS52YXJzQnlCbG9ja1tjb3VudGVyXSA9IHRoZUNTUy5tYXRjaCgvKC0tW146OyBdKzouLio/OykvZyk7XG5cdFx0fSxcblxuXHRcdC8vIHJ1biB0aHJvdWdoIGFsbCB0aGUgQ1NTIGJsb2NrcyB0byB1cGRhdGUgdGhlIHZhcmlhYmxlcyBhbmQgdGhlbiBpbmplY3Qgb24gdGhlIHBhZ2Vcblx0XHR1cGRhdGVDU1M6IGRlYm91bmNlKCgpID0+IHtcblx0XHRcdC8vIGZpcnN0IGxldHMgbG9vcCB0aHJvdWdoIGFsbCB0aGUgdmFyaWFibGVzIHRvIG1ha2Ugc3VyZSBsYXRlciB2YXJzIHRydW1wIGVhcmxpZXIgdmFyc1xuXHRcdFx0Y3NzVmFyUG9seS5yYXRpZnlTZXR0ZXJzKGNzc1ZhclBvbHkudmFyc0J5QmxvY2spO1xuXG5cdFx0XHQvLyBsb29wIHRocm91Z2ggdGhlIGNzcyBibG9ja3MgKHN0eWxlcyBhbmQgbGlua3MpXG5cdFx0XHRjc3NWYXJQb2x5Lm9sZENTUy5maWx0ZXIoZSA9PiBlKS5mb3JFYWNoKChjc3MsIGlkKSA9PiB7XG5cdFx0XHRcdGNvbnN0IG5ld0NTUyA9IGNzc1ZhclBvbHkucmVwbGFjZUdldHRlcnMoY3NzLCBjc3NWYXJQb2x5LnJhdGlmaWVkVmFycyk7XG5cdFx0XHRcdGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2luc2VydGVkJHsgaWQgfWApO1xuXHRcdFx0XHRpZiAoZWwpIHtcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhcInVwZGF0aW5nXCIpXG5cdFx0XHRcdFx0ZWwuaW5uZXJIVE1MID0gbmV3Q1NTO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKFwiYWRkaW5nXCIpO1xuXHRcdFx0XHRcdGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblx0XHRcdFx0XHRzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcblx0XHRcdFx0XHRzdHlsZS5pbm5lckhUTUwgPSBuZXdDU1M7XG5cdFx0XHRcdFx0c3R5bGUuY2xhc3NMaXN0LmFkZCgnaW5zZXJ0ZWQnKTtcblx0XHRcdFx0XHRzdHlsZS5pZCA9IGBpbnNlcnRlZCR7IGlkIH1gO1xuXHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LCAxMDApLFxuXG5cdFx0Ly8gcGFyc2UgYSBwcm92aWRlZCBibG9jayBvZiBDU1MgbG9va2luZyBmb3IgYSBwcm92aWRlZCBsaXN0IG9mIHZhcmlhYmxlcyBhbmQgcmVwbGFjZSB0aGUgLS12YXItbmFtZSB3aXRoIHRoZSBjb3JyZWN0IHZhbHVlXG5cdFx0cmVwbGFjZUdldHRlcnMob2xkQ1NTLCB2YXJMaXN0KSB7XG5cdFx0XHRyZXR1cm4gb2xkQ1NTLnJlcGxhY2UoL3ZhclxcKCgtLS4qPylcXCkvZ20sIChhbGwsIHZhcmlhYmxlKSA9PiB2YXJMaXN0W3ZhcmlhYmxlXSk7XG5cdFx0fSxcblxuXHRcdC8vIGRldGVybWluZSB0aGUgY3NzIHZhcmlhYmxlIG5hbWUgdmFsdWUgcGFpciBhbmQgdHJhY2sgdGhlIGxhdGVzdFxuXHRcdHJhdGlmeVNldHRlcnModmFyTGlzdCkge1xuXHRcdFx0Ly8gbG9vcCB0aHJvdWdoIGVhY2ggYmxvY2sgaW4gb3JkZXIsIHRvIG1haW50YWluIG9yZGVyIHNwZWNpZmljaXR5XG5cdFx0XHR2YXJMaXN0LmZpbHRlcihjdXJWYXJzID0+IGN1clZhcnMpLmZvckVhY2goY3VyVmFycyA9PiB7XG5cdFx0XHRcdC8vIGNvbnN0IGN1clZhcnMgPSB2YXJMaXN0W2N1ckJsb2NrXSB8fCBbXTtcblx0XHRcdFx0Y3VyVmFycy5mb3JFYWNoKGZ1bmN0aW9uKHRoZVZhcikge1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKHRoZVZhcik7XG5cdFx0XHRcdFx0Ly8gc3BsaXQgb24gdGhlIG5hbWUgdmFsdWUgcGFpciBzZXBhcmF0b3Jcblx0XHRcdFx0XHRjb25zdCBtYXRjaGVzID0gdGhlVmFyLnNwbGl0KC86XFxzKi8pO1xuXHRcdFx0XHRcdC8vIGNvbnNvbGUubG9nKG1hdGNoZXMpO1xuXHRcdFx0XHRcdC8vIHB1dCBpdCBpbiBhbiBvYmplY3QgYmFzZWQgb24gdGhlIHZhck5hbWUuIEVhY2ggdGltZSB3ZSBkbyB0aGlzIGl0IHdpbGwgb3ZlcnJpZGUgYSBwcmV2aW91cyB1c2UgYW5kIHNvIHdpbGwgYWx3YXlzIGhhdmUgdGhlIGxhc3Qgc2V0IGJlIHRoZSB3aW5uZXJcblx0XHRcdFx0XHQvLyAwID0gdGhlIG5hbWUsIDEgPSB0aGUgdmFsdWUsIHN0cmlwIG9mZiB0aGUgOyBpZiBpdCBpcyB0aGVyZVxuXHRcdFx0XHRcdGNzc1ZhclBvbHkucmF0aWZpZWRWYXJzW21hdGNoZXNbMF1dID0gbWF0Y2hlc1sxXS5yZXBsYWNlKC87LywgJycpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0T2JqZWN0LmtleXMoY3NzVmFyUG9seS5yYXRpZmllZFZhcnMpLmZpbHRlcihrZXkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gY3NzVmFyUG9seS5yYXRpZmllZFZhcnNba2V5XS5pbmRleE9mKCd2YXInKSA+IC0xO1xuXHRcdFx0fSkuZm9yRWFjaChrZXkgPT4ge1xuXHRcdFx0XHRjc3NWYXJQb2x5LnJhdGlmaWVkVmFyc1trZXldID0gY3NzVmFyUG9seS5yYXRpZmllZFZhcnNba2V5XS5yZXBsYWNlKC92YXJcXCgoLS0uKj8pXFwpL2dtLCBmdW5jdGlvbihhbGwsIHZhcmlhYmxlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNzc1ZhclBvbHkucmF0aWZpZWRWYXJzW3ZhcmlhYmxlXTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdC8vIGdldCB0aGUgQ1NTIGZpbGUgKHNhbWUgZG9tYWluIGZvciBub3cpXG5cdFx0Z2V0TGluayh1cmwsIGNvdW50ZXIsIHN1Y2Nlc3MpIHtcblx0XHRcdGNvbnN0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRcdHJlcXVlc3Qub3BlbignR0VUJywgdXJsLCB0cnVlKTtcblx0XHRcdHJlcXVlc3Qub3ZlcnJpZGVNaW1lVHlwZSgndGV4dC9jc3M7Jyk7XG5cdFx0XHRyZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRpZiAocmVxdWVzdC5zdGF0dXMgPj0gMjAwICYmIHJlcXVlc3Quc3RhdHVzIDwgNDAwKSB7XG5cdFx0XHRcdFx0Ly8gU3VjY2VzcyFcblx0XHRcdFx0XHQvLyBjb25zb2xlLmxvZyhyZXF1ZXN0LnJlc3BvbnNlVGV4dCk7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBzdWNjZXNzID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzdWNjZXNzKGNvdW50ZXIsIHJlcXVlc3QpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBXZSByZWFjaGVkIG91ciB0YXJnZXQgc2VydmVyLCBidXQgaXQgcmV0dXJuZWQgYW4gZXJyb3Jcblx0XHRcdFx0XHRjb25zb2xlLndhcm4oJ2FuIGVycm9yIHdhcyByZXR1cm5lZCBmcm9tOicsIHVybCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdHJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvLyBUaGVyZSB3YXMgYSBjb25uZWN0aW9uIGVycm9yIG9mIHNvbWUgc29ydFxuXHRcdFx0XHRjb25zb2xlLndhcm4oJ3dlIGNvdWxkIG5vdCBnZXQgYW55dGhpbmcgZnJvbTonLCB1cmwpO1xuXHRcdFx0fTtcblxuXHRcdFx0cmVxdWVzdC5zZW5kKCk7XG5cdFx0fVxuXG5cdH07XG5cdGNvbnN0IHN0YXRlQ2hlY2sgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0aWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScgJiYgdHlwZW9mIE1ldGVvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdGNsZWFySW50ZXJ2YWwoc3RhdGVDaGVjayk7XG5cdFx0XHQvLyBkb2N1bWVudCByZWFkeVxuXHRcdFx0Y3NzVmFyUG9seS5pbml0KCk7XG5cdFx0fVxuXHR9LCAxMDApO1xuXG5cdER5bmFtaWNDc3MgPSB0eXBlb2YgRHluYW1pY0NzcyAhPT0ndW5kZWZpbmVkJz8gRHluYW1pY0NzcyA6IHt9O1xuXHREeW5hbWljQ3NzLnRlc3QgPSAoKSA9PiB3aW5kb3cuQ1NTICYmIHdpbmRvdy5DU1Muc3VwcG9ydHMgJiYgd2luZG93LkNTUy5zdXBwb3J0cygnKC0tZm9vOiByZWQpJyk7XG5cdER5bmFtaWNDc3MucnVuID0gZGVib3VuY2UoKHJlcGxhY2UgPSBmYWxzZSkgPT4ge1xuXHRcdGlmIChyZXBsYWNlKSB7XG5cdFx0XHQvLyBjb25zdCB2YXJpYWJsZXMgPSBSb2NrZXRDaGF0Lm1vZGVscy5TZXR0aW5ncy5maW5kT25lKHtfaWQ6J3RoZW1lLWN1c3RvbS12YXJpYWJsZXMnfSwge2ZpZWxkczogeyB2YWx1ZTogMX19KTtcblx0XHRcdGNvbnN0IGNvbG9ycyA9IFJvY2tldENoYXQuc2V0dGluZ3MuY29sbGVjdGlvbi5maW5kKHtfaWQ6L3RoZW1lLWNvbG9yLXJjL2l9LCB7ZmllbGRzOiB7IHZhbHVlOiAxLCBlZGl0b3I6IDF9fSkuZmV0Y2goKS5maWx0ZXIoY29sb3IgPT4gY29sb3IgJiYgY29sb3IudmFsdWUpO1xuXG5cdFx0XHRpZiAoIWNvbG9ycykge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBjc3MgPSBjb2xvcnMubWFwKCh7X2lkLCB2YWx1ZSwgZWRpdG9yfSkgPT4ge1xuXHRcdFx0XHRpZiAoZWRpdG9yID09PSAnZXhwcmVzc2lvbicpIHtcblx0XHRcdFx0XHRyZXR1cm4gYC0tJHsgX2lkLnJlcGxhY2UoJ3RoZW1lLWNvbG9yLScsICcnKSB9OiB2YXIoLS0keyB2YWx1ZSB9KTtgO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBgLS0keyBfaWQucmVwbGFjZSgndGhlbWUtY29sb3ItJywgJycpIH06ICR7IHZhbHVlIH07YDtcblx0XHRcdH0pLmpvaW4oJ1xcbicpO1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Nzcy12YXJpYWJsZXMnKS5pbm5lckhUTUwgPSBgOnJvb3QgeyR7IGNzcyB9fWA7XG5cdFx0fVxuXHRcdGNzc1ZhclBvbHkuaW5pdCgpO1xuXHR9LCAxMDAwKTtcbn07XG4iXX0=
