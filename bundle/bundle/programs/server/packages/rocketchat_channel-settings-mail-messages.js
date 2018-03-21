(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:channel-settings-mail-messages":{"server":{"lib":{"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_channel-settings-mail-messages/server/lib/startup.js                        //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
Meteor.startup(function () {
  const permission = {
    _id: 'mail-messages',
    roles: ['admin']
  };
  return RocketChat.models.Permissions.upsert(permission._id, {
    $setOnInsert: permission
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"mailMessages.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/rocketchat_channel-settings-mail-messages/server/methods/mailMessages.js               //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
let _;

module.watch(require("underscore"), {
  default(v) {
    _ = v;
  }

}, 0);
let moment;
module.watch(require("moment"), {
  default(v) {
    moment = v;
  }

}, 1);
Meteor.methods({
  'mailMessages'(data) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', {
        method: 'mailMessages'
      });
    }

    check(data, Match.ObjectIncluding({
      rid: String,
      to_users: [String],
      to_emails: String,
      subject: String,
      messages: [String],
      language: String
    }));
    const room = Meteor.call('canAccessRoom', data.rid, Meteor.userId());

    if (!room) {
      throw new Meteor.Error('error-invalid-room', 'Invalid room', {
        method: 'mailMessages'
      });
    }

    if (!RocketChat.authz.hasPermission(Meteor.userId(), 'mail-messages')) {
      throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed', {
        method: 'mailMessages',
        action: 'Mailing'
      });
    }

    const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

    const emails = _.compact(data.to_emails.trim().split(','));

    const missing = [];

    if (data.to_users.length > 0) {
      _.each(data.to_users, username => {
        const user = RocketChat.models.Users.findOneByUsername(username);

        if (user && user.emails && user.emails[0] && user.emails[0].address) {
          emails.push(user.emails[0].address);
        } else {
          missing.push(username);
        }
      });
    }

    console.log('Sending messages to e-mails: ', emails);

    _.each(emails, email => {
      if (!rfcMailPatternWithName.test(email.trim())) {
        throw new Meteor.Error('error-invalid-email', `Invalid email ${email}`, {
          method: 'mailMessages',
          email
        });
      }
    });

    const user = Meteor.user();
    const email = user.emails && user.emails[0] && user.emails[0].address;
    data.language = data.language.split('-').shift().toLowerCase();

    if (data.language !== 'en') {
      const localeFn = Meteor.call('loadLocale', data.language);

      if (localeFn) {
        Function(localeFn).call({
          moment
        });
        moment.locale(data.language);
      }
    }

    const header = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Header') || '');
    const footer = RocketChat.placeholders.replace(RocketChat.settings.get('Email_Footer') || '');
    const html = RocketChat.models.Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
      sort: {
        ts: 1
      }
    }).map(function (message) {
      const dateTime = moment(message.ts).locale(data.language).format('L LT');
      return `<p style='margin-bottom: 5px'><b>${message.u.username}</b> <span style='color: #aaa; font-size: 12px'>${dateTime}</span><br />${RocketChat.Message.parse(message, data.language)}</p>`;
    }).join('');
    Meteor.defer(function () {
      Email.send({
        to: emails,
        from: RocketChat.settings.get('From_Email'),
        replyTo: email,
        subject: data.subject,
        html: header + html + footer
      });
      return console.log(`Sending email to ${emails.join(', ')}`);
    });
    return {
      success: true,
      missing
    };
  }

});
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:channel-settings-mail-messages/server/lib/startup.js");
require("/node_modules/meteor/rocketchat:channel-settings-mail-messages/server/methods/mailMessages.js");

/* Exports */
Package._define("rocketchat:channel-settings-mail-messages");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_channel-settings-mail-messages.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpjaGFubmVsLXNldHRpbmdzLW1haWwtbWVzc2FnZXMvc2VydmVyL2xpYi9zdGFydHVwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OmNoYW5uZWwtc2V0dGluZ3MtbWFpbC1tZXNzYWdlcy9zZXJ2ZXIvbWV0aG9kcy9tYWlsTWVzc2FnZXMuanMiXSwibmFtZXMiOlsiTWV0ZW9yIiwic3RhcnR1cCIsInBlcm1pc3Npb24iLCJfaWQiLCJyb2xlcyIsIlJvY2tldENoYXQiLCJtb2RlbHMiLCJQZXJtaXNzaW9ucyIsInVwc2VydCIsIiRzZXRPbkluc2VydCIsIl8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIm1vbWVudCIsIm1ldGhvZHMiLCJkYXRhIiwidXNlcklkIiwiRXJyb3IiLCJtZXRob2QiLCJjaGVjayIsIk1hdGNoIiwiT2JqZWN0SW5jbHVkaW5nIiwicmlkIiwiU3RyaW5nIiwidG9fdXNlcnMiLCJ0b19lbWFpbHMiLCJzdWJqZWN0IiwibWVzc2FnZXMiLCJsYW5ndWFnZSIsInJvb20iLCJjYWxsIiwiYXV0aHoiLCJoYXNQZXJtaXNzaW9uIiwiYWN0aW9uIiwicmZjTWFpbFBhdHRlcm5XaXRoTmFtZSIsImVtYWlscyIsImNvbXBhY3QiLCJ0cmltIiwic3BsaXQiLCJtaXNzaW5nIiwibGVuZ3RoIiwiZWFjaCIsInVzZXJuYW1lIiwidXNlciIsIlVzZXJzIiwiZmluZE9uZUJ5VXNlcm5hbWUiLCJhZGRyZXNzIiwicHVzaCIsImNvbnNvbGUiLCJsb2ciLCJlbWFpbCIsInRlc3QiLCJzaGlmdCIsInRvTG93ZXJDYXNlIiwibG9jYWxlRm4iLCJGdW5jdGlvbiIsImxvY2FsZSIsImhlYWRlciIsInBsYWNlaG9sZGVycyIsInJlcGxhY2UiLCJzZXR0aW5ncyIsImdldCIsImZvb3RlciIsImh0bWwiLCJNZXNzYWdlcyIsImZpbmRCeVJvb21JZEFuZE1lc3NhZ2VJZHMiLCJzb3J0IiwidHMiLCJtYXAiLCJtZXNzYWdlIiwiZGF0ZVRpbWUiLCJmb3JtYXQiLCJ1IiwiTWVzc2FnZSIsInBhcnNlIiwiam9pbiIsImRlZmVyIiwiRW1haWwiLCJzZW5kIiwidG8iLCJmcm9tIiwicmVwbHlUbyIsInN1Y2Nlc3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsT0FBT0MsT0FBUCxDQUFlLFlBQVc7QUFDekIsUUFBTUMsYUFBYTtBQUNsQkMsU0FBSyxlQURhO0FBRWxCQyxXQUFPLENBQUMsT0FBRDtBQUZXLEdBQW5CO0FBSUEsU0FBT0MsV0FBV0MsTUFBWCxDQUFrQkMsV0FBbEIsQ0FBOEJDLE1BQTlCLENBQXFDTixXQUFXQyxHQUFoRCxFQUFxRDtBQUMzRE0sa0JBQWNQO0FBRDZDLEdBQXJELENBQVA7QUFHQSxDQVJELEU7Ozs7Ozs7Ozs7O0FDQUEsSUFBSVEsQ0FBSjs7QUFBTUMsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLFlBQVIsQ0FBYixFQUFtQztBQUFDQyxVQUFRQyxDQUFSLEVBQVU7QUFBQ0wsUUFBRUssQ0FBRjtBQUFJOztBQUFoQixDQUFuQyxFQUFxRCxDQUFyRDtBQUF3RCxJQUFJQyxNQUFKO0FBQVdMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNDLGFBQU9ELENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7QUFHekVmLE9BQU9pQixPQUFQLENBQWU7QUFDZCxpQkFBZUMsSUFBZixFQUFxQjtBQUNwQixRQUFJLENBQUNsQixPQUFPbUIsTUFBUCxFQUFMLEVBQXNCO0FBQ3JCLFlBQU0sSUFBSW5CLE9BQU9vQixLQUFYLENBQWlCLG9CQUFqQixFQUF1QyxjQUF2QyxFQUF1RDtBQUM1REMsZ0JBQVE7QUFEb0QsT0FBdkQsQ0FBTjtBQUdBOztBQUNEQyxVQUFNSixJQUFOLEVBQVlLLE1BQU1DLGVBQU4sQ0FBc0I7QUFDakND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S0FBS1csT0FKSjtBQUtWcUMsY0FBTU4sU0FBU00sSUFBVCxHQUFnQkQ7QUFMWixPQUFYO0FBT0EsYUFBT2QsUUFBUUMsR0FBUixDQUFhLG9CQUFvQmQsT0FBT3dDLElBQVAsQ0FBWSxJQUFaLENBQW1CLEVBQXBELENBQVA7QUFDQSxLQVREO0FBVUEsV0FBTztBQUNOTyxlQUFTLElBREg7QUFFTjNDO0FBRk0sS0FBUDtBQUlBOztBQW5GYSxDQUFmLEUiLCJmaWxlIjoiL3BhY2thZ2VzL3JvY2tldGNoYXRfY2hhbm5lbC1zZXR0aW5ncy1tYWlsLW1lc3NhZ2VzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG5cdGNvbnN0IHBlcm1pc3Npb24gPSB7XG5cdFx0X2lkOiAnbWFpbC1tZXNzYWdlcycsXG5cdFx0cm9sZXM6IFsnYWRtaW4nXVxuXHR9O1xuXHRyZXR1cm4gUm9ja2V0Q2hhdC5tb2RlbHMuUGVybWlzc2lvbnMudXBzZXJ0KHBlcm1pc3Npb24uX2lkLCB7XG5cdFx0JHNldE9uSW5zZXJ0OiBwZXJtaXNzaW9uXG5cdH0pO1xufSk7XG4iLCJpbXBvcnQgXyBmcm9tICd1bmRlcnNjb3JlJztcbmltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcblxuTWV0ZW9yLm1ldGhvZHMoe1xuXHQnbWFpbE1lc3NhZ2VzJyhkYXRhKSB7XG5cdFx0aWYgKCFNZXRlb3IudXNlcklkKCkpIHtcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yLWludmFsaWQtdXNlcicsICdJbnZhbGlkIHVzZXInLCB7XG5cdFx0XHRcdG1ldGhvZDogJ21haWxNZXNzYWdlcydcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjaGVjayhkYXRhLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe1xuXHRcdFx0cmlkOiBTdHJpbmcsXG5cdFx0XHR0b191c2VyczogW1N0cmluZ10sXG5cdFx0XHR0b19lbWFpbHM6IFN0cmluZyxcblx0XHRcdHN1YmplY3Q6IFN0cmluZyxcblx0XHRcdG1lc3NhZ2VzOiBbU3RyaW5nXSxcblx0XHRcdGxhbmd1YWdlOiBTdHJpbmdcblx0XHR9KSk7XG5cdFx0Y29uc3Qgcm9vbSA9IE1ldGVvci5jYWxsKCdjYW5BY2Nlc3NSb29tJywgZGF0YS5yaWQsIE1ldGVvci51c2VySWQoKSk7XG5cdFx0aWYgKCFyb29tKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLXJvb20nLCAnSW52YWxpZCByb29tJywge1xuXHRcdFx0XHRtZXRob2Q6ICdtYWlsTWVzc2FnZXMnXG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0aWYgKCFSb2NrZXRDaGF0LmF1dGh6Lmhhc1Blcm1pc3Npb24oTWV0ZW9yLnVzZXJJZCgpLCAnbWFpbC1tZXNzYWdlcycpKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1hY3Rpb24tbm90LWFsbG93ZWQnLCAnTWFpbGluZyBpcyBub3QgYWxsb3dlZCcsIHtcblx0XHRcdFx0bWV0aG9kOiAnbWFpbE1lc3NhZ2VzJyxcblx0XHRcdFx0YWN0aW9uOiAnTWFpbGluZydcblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjb25zdCByZmNNYWlsUGF0dGVybldpdGhOYW1lID0gL14oPzouKjwpPyhbYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqKSg/Oj4/KSQvO1xuXHRcdGNvbnN0IGVtYWlscyA9IF8uY29tcGFjdChkYXRhLnRvX2VtYWlscy50cmltKCkuc3BsaXQoJywnKSk7XG5cdFx0Y29uc3QgbWlzc2luZyA9IFtdO1xuXHRcdGlmIChkYXRhLnRvX3VzZXJzLmxlbmd0aCA+IDApIHtcblx0XHRcdF8uZWFjaChkYXRhLnRvX3VzZXJzLCAodXNlcm5hbWUpID0+IHtcblx0XHRcdFx0Y29uc3QgdXNlciA9IFJvY2tldENoYXQubW9kZWxzLlVzZXJzLmZpbmRPbmVCeVVzZXJuYW1lKHVzZXJuYW1lKTtcblx0XHRcdFx0aWYgKHVzZXIgJiYgdXNlci5lbWFpbHMgJiYgdXNlci5lbWFpbHNbMF0gJiYgdXNlci5lbWFpbHNbMF0uYWRkcmVzcykge1xuXHRcdFx0XHRcdGVtYWlscy5wdXNoKHVzZXIuZW1haWxzWzBdLmFkZHJlc3MpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG1pc3NpbmcucHVzaCh1c2VybmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0XHRjb25zb2xlLmxvZygnU2VuZGluZyBtZXNzYWdlcyB0byBlLW1haWxzOiAnLCBlbWFpbHMpO1xuXHRcdF8uZWFjaChlbWFpbHMsIChlbWFpbCkgPT4ge1xuXHRcdFx0aWYgKCFyZmNNYWlsUGF0dGVybldpdGhOYW1lLnRlc3QoZW1haWwudHJpbSgpKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1pbnZhbGlkLWVtYWlsJywgYEludmFsaWQgZW1haWwgJHsgZW1haWwgfWAsIHtcblx0XHRcdFx0XHRtZXRob2Q6ICdtYWlsTWVzc2FnZXMnLFxuXHRcdFx0XHRcdGVtYWlsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuXHRcdGNvbnN0IGVtYWlsID0gdXNlci5lbWFpbHMgJiYgdXNlci5lbWFpbHNbMF0gJiYgdXNlci5lbWFpbHNbMF0uYWRkcmVzcztcblx0XHRkYXRhLmxhbmd1YWdlID0gZGF0YS5sYW5ndWFnZS5zcGxpdCgnLScpLnNoaWZ0KCkudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAoZGF0YS5sYW5ndWFnZSAhPT0gJ2VuJykge1xuXHRcdFx0Y29uc3QgbG9jYWxlRm4gPSBNZXRlb3IuY2FsbCgnbG9hZExvY2FsZScsIGRhdGEubGFuZ3VhZ2UpO1xuXHRcdFx0aWYgKGxvY2FsZUZuKSB7XG5cdFx0XHRcdEZ1bmN0aW9uKGxvY2FsZUZuKS5jYWxsKHttb21lbnR9KTtcblx0XHRcdFx0bW9tZW50LmxvY2FsZShkYXRhLmxhbmd1YWdlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjb25zdCBoZWFkZXIgPSBSb2NrZXRDaGF0LnBsYWNlaG9sZGVycy5yZXBsYWNlKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdFbWFpbF9IZWFkZXInKSB8fCAnJyk7XG5cdFx0Y29uc3QgZm9vdGVyID0gUm9ja2V0Q2hhdC5wbGFjZWhvbGRlcnMucmVwbGFjZShSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnRW1haWxfRm9vdGVyJykgfHwgJycpO1xuXHRcdGNvbnN0IGh0bWwgPSBSb2NrZXRDaGF0Lm1vZGVscy5NZXNzYWdlcy5maW5kQnlSb29tSWRBbmRNZXNzYWdlSWRzKGRhdGEucmlkLCBkYXRhLm1lc3NhZ2VzLCB7XG5cdFx0XHRzb3J0OiB7XHR0czogMSB9XG5cdFx0fSkubWFwKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdGNvbnN0IGRhdGVUaW1lID0gbW9tZW50KG1lc3NhZ2UudHMpLmxvY2FsZShkYXRhLmxhbmd1YWdlKS5mb3JtYXQoJ0wgTFQnKTtcblx0XHRcdHJldHVybiBgPHAgc3R5bGU9J21hcmdpbi1ib3R0b206IDVweCc+PGI+JHsgbWVzc2FnZS51LnVzZXJuYW1lIH08L2I+IDxzcGFuIHN0eWxlPSdjb2xvcjogI2FhYTsgZm9udC1zaXplOiAxMnB4Jz4keyBkYXRlVGltZSB9PC9zcGFuPjxiciAvPiR7IFJvY2tldENoYXQuTWVzc2FnZS5wYXJzZShtZXNzYWdlLCBkYXRhLmxhbmd1YWdlKSB9PC9wPmA7XG5cdFx0fSkuam9pbignJyk7XG5cblx0XHRNZXRlb3IuZGVmZXIoZnVuY3Rpb24oKSB7XG5cdFx0XHRFbWFpbC5zZW5kKHtcblx0XHRcdFx0dG86IGVtYWlscyxcblx0XHRcdFx0ZnJvbTogUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0Zyb21fRW1haWwnKSxcblx0XHRcdFx0cmVwbHlUbzogZW1haWwsXG5cdFx0XHRcdHN1YmplY3Q6IGRhdGEuc3ViamVjdCxcblx0XHRcdFx0aHRtbDogaGVhZGVyICsgaHRtbCArIGZvb3RlclxuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coYFNlbmRpbmcgZW1haWwgdG8gJHsgZW1haWxzLmpvaW4oJywgJykgfWApO1xuXHRcdH0pO1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdWNjZXNzOiB0cnVlLFxuXHRcdFx0bWlzc2luZ1xuXHRcdH07XG5cdH1cbn0pO1xuIl19
