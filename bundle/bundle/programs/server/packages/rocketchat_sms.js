(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:sms":{"settings.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/settings.js                                                //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
Meteor.startup(function () {
  RocketChat.settings.addGroup('SMS', function () {
    this.add('SMS_Enabled', false, {
      type: 'boolean',
      i18nLabel: 'Enabled'
    });
    this.add('SMS_Service', 'twilio', {
      type: 'select',
      values: [{
        key: 'twilio',
        i18nLabel: 'Twilio'
      }],
      i18nLabel: 'Service'
    });
    this.section('Twilio', function () {
      this.add('SMS_Twilio_Account_SID', '', {
        type: 'string',
        enableQuery: {
          _id: 'SMS_Service',
          value: 'twilio'
        },
        i18nLabel: 'Account_SID'
      });
      this.add('SMS_Twilio_authToken', '', {
        type: 'string',
        enableQuery: {
          _id: 'SMS_Service',
          value: 'twilio'
        },
        i18nLabel: 'Auth_Token'
      });
    });
  });
});
////////////////////////////////////////////////////////////////////////////////////////

},"SMS.js":function(){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/SMS.js                                                     //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
/* globals RocketChat */
RocketChat.SMS = {
  enabled: false,
  services: {},
  accountSid: null,
  authToken: null,
  fromNumber: null,

  registerService(name, service) {
    this.services[name] = service;
  },

  getService(name) {
    if (!this.services[name]) {
      throw new Meteor.Error('error-sms-service-not-configured');
    }

    return new this.services[name](this.accountSid, this.authToken, this.fromNumber);
  }

};
RocketChat.settings.get('SMS_Enabled', function (key, value) {
  RocketChat.SMS.enabled = value;
});
////////////////////////////////////////////////////////////////////////////////////////

},"services":{"twilio.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/rocketchat_sms/services/twilio.js                                         //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
let twilio;
module.watch(require("twilio"), {
  default(v) {
    twilio = v;
  }

}, 0);

class Twilio {
  constructor() {
    this.accountSid = RocketChat.settings.get('SMS_Twilio_Account_SID');
    this.authToken = RocketChat.settings.get('SMS_Twilio_authToken');
  }

  parse(data) {
    return {
      from: data.From,
      to: data.To,
      body: data.Body,
      extra: {
        toCountry: data.ToCountry,
        toState: data.ToState,
        toCity: data.ToCity,
        toZip: data.ToZip,
        fromCountry: data.FromCountry,
        fromState: data.FromState,
        fromCity: data.FromCity,
        fromZip: data.FromZip
      }
    };
  }

  send(fromNumber, toNumber, message) {
    const client = twilio(this.accountSid, this.authToken);
    client.messages.create({
      to: toNumber,
      from: fromNumber,
      body: message
    });
  }

  response()
  /* message */
  {
    return {
      headers: {
        'Content-Type': 'text/xml'
      },
      body: '<Response></Response>'
    };
  }

  error(error) {
    let message = '';

    if (error.reason) {
      message = `<Message>${error.reason}</Message>`;
    }

    return {
      headers: {
        'Content-Type': 'text/xml'
      },
      body: `<Response>${message}</Response>`
    };
  }

}

RocketChat.SMS.registerService('twilio', Twilio);
////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:sms/settings.js");
require("/node_modules/meteor/rocketchat:sms/SMS.js");
require("/node_modules/meteor/rocketchat:sms/services/twilio.js");

/* Exports */
Package._define("rocketchat:sms");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_sms.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbXMvc2V0dGluZ3MuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3JvY2tldGNoYXQ6c21zL1NNUy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDpzbXMvc2VydmljZXMvdHdpbGlvLmpzIl0sIm5hbWVzIjpbIk1ldGVvciIsInN0YXJ0dXAiLCJSb2NrZXRDaGF0Iiwic2V0dGluZ3MiLCJhZGRHcm91cCIsImFkZCIsInR5cGUiLCJpMThuTGFiZWwiLCJ2YWx1ZXMiLCJrZXkiLCJzZWN0aW9uIiwiZW5hYmxlUXVlcnkiLCJfaWQiLCJ2YWx1ZSIsIlNNUyIsImVuYWJsZWQiLCJzZXJ2aWNlcyIsImFjY291bnRTaWQiLCJhdXRoVG9rZW4iLCJmcm9tTnVtYmVyIiwicmVnaXN0ZXJTZXJ2aWNlIiwibmFtZSIsInNlcnZpY2UiLCJnZXRTZXJ2aWNlIiwiRXJyb3IiLCJnZXQiLCJ0d2lsaW8iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJkZWZhdWx0IiwidiIsIlR3aWxpbyIsImNvbnN0cnVjdG9yIiwicGFyc2UiLCJkYXRhIiwiZnJvbSIsIkZyb20iLCJ0byIsIlRvIiwiYm9keSIsIkJvZHkiLCJleHRyYSIsInRvQ291bnRyeSIsIlRvQ291bnRyeSIsInRvU3RhdGUiLCJUb1N0YXRlIiwidG9DaXR5IiwiVG9DaXR5IiwidG9aaXAiLCJUb1ppcCIsImZyb21Db3VudHJ5IiwiRnJvbUNvdW50cnkiLCJmcm9tU3RhdGUiLCJGcm9tU3RhdGUiLCJmcm9tQ2l0eSIsIkZyb21DaXR5IiwiZnJvbVppcCIsIkZyb21aaXAiLCJzZW5kIiwidG9OdW1iZXIiLCJtZXNzYWdlIiwiY2xpZW50IiwibWVzc2FnZXMiLCJjcmVhdGUiLCJyZXNwb25zZSIsImhlYWRlcnMiLCJlcnJvciIsInJlYXNvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsWUFBVztBQUN6QkMsYUFBV0MsUUFBWCxDQUFvQkMsUUFBcEIsQ0FBNkIsS0FBN0IsRUFBb0MsWUFBVztBQUM5QyxTQUFLQyxHQUFMLENBQVMsYUFBVCxFQUF3QixLQUF4QixFQUErQjtBQUM5QkMsWUFBTSxTQUR3QjtBQUU5QkMsaUJBQVc7QUFGbUIsS0FBL0I7QUFLQSxTQUFLRixHQUFMLENBQVMsYUFBVCxFQUF3QixRQUF4QixFQUFrQztBQUNqQ0MsWUFBTSxRQUQyQjtBQUVqQ0UsY0FBUSxDQUFDO0FBQ1JDLGFBQUssUUFERztBQUVSRixtQkFBVztBQUZILE9BQUQsQ0FGeUI7QUFNakNBLGlCQUFXO0FBTnNCLEtBQWxDO0FBU0EsU0FBS0csT0FBTCxDQUFhLFFBQWIsRUFBdUIsWUFBVztBQUNqQyxXQUFLTCxHQUFMLENBQVMsd0JBQVQsRUFBbUMsRUFBbkMsRUFBdUM7QUFDdENDLGNBQU0sUUFEZ0M7QUFFdENLLHFCQUFhO0FBQ1pDLGVBQUssYUFETztBQUVaQyxpQkFBTztBQUZLLFNBRnlCO0FBTXRDTixtQkFBVztBQU4yQixPQUF2QztBQVFBLFdBQUtGLEdBQUwsQ0FBUyxzQkFBVCxFQUFpQyxFQUFqQyxFQUFxQztBQUNwQ0MsY0FBTSxRQUQ4QjtBQUVwQ0sscUJBQWE7QUFDWkMsZUFBSyxhQURPO0FBRVpDLGlCQUFPO0FBRkssU0FGdUI7QUFNcENOLG1CQUFXO0FBTnlCLE9BQXJDO0FBUUEsS0FqQkQ7QUFrQkEsR0FqQ0Q7QUFrQ0EsQ0FuQ0QsRTs7Ozs7Ozs7Ozs7QUNBQTtBQUNBTCxXQUFXWSxHQUFYLEdBQWlCO0FBQ2hCQyxXQUFTLEtBRE87QUFFaEJDLFlBQVUsRUFGTTtBQUdoQkMsY0FBWSxJQUhJO0FBSWhCQyxhQUFXLElBSks7QUFLaEJDLGNBQVksSUFMSTs7QUFPaEJDLGtCQUFnQkMsSUFBaEIsRUFBc0JDLE9BQXRCLEVBQStCO0FBQzlCLFNBQUtOLFFBQUwsQ0FBY0ssSUFBZCxJQUFzQkMsT0FBdEI7QUFDQSxHQVRlOztBQVdoQkMsYUFBV0YsSUFBWCxFQUFpQjtBQUNoQixRQUFJLENBQUMsS0FBS0wsUUFBTCxDQUFjSyxJQUFkLENBQUwsRUFBMEI7QUFDekIsWUFBTSxJQUFJckIsT0FBT3dCLEtBQVgsQ0FBaUIsa0NBQWpCLENBQU47QUFDQTs7QUFDRCxXQUFPLElBQUksS0FBS1IsUUFBTCxDQUFjSyxJQUFkLENBQUosQ0FBd0IsS0FBS0osVUFBN0IsRUFBeUMsS0FBS0MsU0FBOUMsRUFBeUQsS0FBS0MsVUFBOUQsQ0FBUDtBQUNBOztBQWhCZSxDQUFqQjtBQW1CQWpCLFdBQVdDLFFBQVgsQ0FBb0JzQixHQUFwQixDQUF3QixhQUF4QixFQUF1QyxVQUFTaEIsR0FBVCxFQUFjSSxLQUFkLEVBQXFCO0FBQzNEWCxhQUFXWSxHQUFYLENBQWVDLE9BQWYsR0FBeUJGLEtBQXpCO0FBQ0EsQ0FGRCxFOzs7Ozs7Ozs7OztBQ3BCQSxJQUFJYSxNQUFKO0FBQVdDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxRQUFSLENBQWIsRUFBK0I7QUFBQ0MsVUFBUUMsQ0FBUixFQUFVO0FBQUNMLGFBQU9LLENBQVA7QUFBUzs7QUFBckIsQ0FBL0IsRUFBc0QsQ0FBdEQ7O0FBR1gsTUFBTUMsTUFBTixDQUFhO0FBQ1pDLGdCQUFjO0FBQ2IsU0FBS2hCLFVBQUwsR0FBa0JmLFdBQVdDLFFBQVgsQ0FBb0JzQixHQUFwQixDQUF3Qix3QkFBeEIsQ0FBbEI7QUFDQSxTQUFLUCxTQUFMLEdBQWlCaEIsV0FBV0MsUUFBWCxDQUFvQnNCLEdBQXBCLENBQXdCLHNCQUF4QixDQUFqQjtBQUNBOztBQUNEUyxRQUFNQyxJQUFOLEVBQVk7QUFDWCxXQUFPO0FBQ05DLFlBQU1ELEtBQUtFLElBREw7QUFFTkMsVUFBSUgsS0FBS0ksRUFGSDtBQUdOQyxZQUFNTCxLQUFLTSxJQUhMO0FBS05DLGFBQU87QUFDTkMsbUJBQVdSLEtBQUtTLFNBRFY7QUFFTkMsaUJBQVNWLEtBQUtXLE9BRlI7QUFHTkMsZ0JBQVFaLEtBQUthLE1BSFA7QUFJTkMsZUFBT2QsS0FBS2UsS0FKTjtBQUtOQyxxQkFBYWhCLEtBQUtpQixXQUxaO0FBTU5DLG1CQUFXbEIsS0FBS21CLFNBTlY7QUFPTkMsa0JBQVVwQixLQUFLcUIsUUFQVDtBQVFOQyxpQkFBU3RCLEtBQUt1QjtBQVJSO0FBTEQsS0FBUDtBQWdCQTs7QUFDREMsT0FBS3hDLFVBQUwsRUFBaUJ5QyxRQUFqQixFQUEyQkMsT0FBM0IsRUFBb0M7QUFDbkMsVUFBTUMsU0FBU3BDLE9BQU8sS0FBS1QsVUFBWixFQUF3QixLQUFLQyxTQUE3QixDQUFmO0FBRUE0QyxXQUFPQyxRQUFQLENBQWdCQyxNQUFoQixDQUF1QjtBQUN0QjFCLFVBQUlzQixRQURrQjtBQUV0QnhCLFlBQU1qQixVQUZnQjtBQUd0QnFCLFlBQU1xQjtBQUhnQixLQUF2QjtBQUtBOztBQUNESTtBQUFTO0FBQWU7QUFDdkIsV0FBTztBQUNOQyxlQUFTO0FBQ1Isd0JBQWdCO0FBRFIsT0FESDtBQUlOMUIsWUFBTTtBQUpBLEtBQVA7QUFNQTs7QUFDRDJCLFFBQU1BLEtBQU4sRUFBYTtBQUNaLFFBQUlOLFVBQVUsRUFBZDs7QUFDQSxRQUFJTSxNQUFNQyxNQUFWLEVBQWtCO0FBQ2pCUCxnQkFBVyxZQUFZTSxNQUFNQyxNQUFRLFlBQXJDO0FBQ0E7O0FBQ0QsV0FBTztBQUNORixlQUFTO0FBQ1Isd0JBQWdCO0FBRFIsT0FESDtBQUlOMUIsWUFBTyxhQUFhcUIsT0FBUztBQUp2QixLQUFQO0FBTUE7O0FBbkRXOztBQXNEYjNELFdBQVdZLEdBQVgsQ0FBZU0sZUFBZixDQUErQixRQUEvQixFQUF5Q1ksTUFBekMsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF9zbXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0Um9ja2V0Q2hhdC5zZXR0aW5ncy5hZGRHcm91cCgnU01TJywgZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hZGQoJ1NNU19FbmFibGVkJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdGkxOG5MYWJlbDogJ0VuYWJsZWQnXG5cdFx0fSk7XG5cblx0XHR0aGlzLmFkZCgnU01TX1NlcnZpY2UnLCAndHdpbGlvJywge1xuXHRcdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0XHR2YWx1ZXM6IFt7XG5cdFx0XHRcdGtleTogJ3R3aWxpbycsXG5cdFx0XHRcdGkxOG5MYWJlbDogJ1R3aWxpbydcblx0XHRcdH1dLFxuXHRcdFx0aTE4bkxhYmVsOiAnU2VydmljZSdcblx0XHR9KTtcblxuXHRcdHRoaXMuc2VjdGlvbignVHdpbGlvJywgZnVuY3Rpb24oKSB7XG5cdFx0XHR0aGlzLmFkZCgnU01TX1R3aWxpb19BY2NvdW50X1NJRCcsICcnLCB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRcdF9pZDogJ1NNU19TZXJ2aWNlJyxcblx0XHRcdFx0XHR2YWx1ZTogJ3R3aWxpbydcblx0XHRcdFx0fSxcblx0XHRcdFx0aTE4bkxhYmVsOiAnQWNjb3VudF9TSUQnXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuYWRkKCdTTVNfVHdpbGlvX2F1dGhUb2tlbicsICcnLCB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0XHRlbmFibGVRdWVyeToge1xuXHRcdFx0XHRcdF9pZDogJ1NNU19TZXJ2aWNlJyxcblx0XHRcdFx0XHR2YWx1ZTogJ3R3aWxpbydcblx0XHRcdFx0fSxcblx0XHRcdFx0aTE4bkxhYmVsOiAnQXV0aF9Ub2tlbidcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9KTtcbn0pO1xuIiwiLyogZ2xvYmFscyBSb2NrZXRDaGF0ICovXG5Sb2NrZXRDaGF0LlNNUyA9IHtcblx0ZW5hYmxlZDogZmFsc2UsXG5cdHNlcnZpY2VzOiB7fSxcblx0YWNjb3VudFNpZDogbnVsbCxcblx0YXV0aFRva2VuOiBudWxsLFxuXHRmcm9tTnVtYmVyOiBudWxsLFxuXG5cdHJlZ2lzdGVyU2VydmljZShuYW1lLCBzZXJ2aWNlKSB7XG5cdFx0dGhpcy5zZXJ2aWNlc1tuYW1lXSA9IHNlcnZpY2U7XG5cdH0sXG5cblx0Z2V0U2VydmljZShuYW1lKSB7XG5cdFx0aWYgKCF0aGlzLnNlcnZpY2VzW25hbWVdKSB7XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvci1zbXMtc2VydmljZS1ub3QtY29uZmlndXJlZCcpO1xuXHRcdH1cblx0XHRyZXR1cm4gbmV3IHRoaXMuc2VydmljZXNbbmFtZV0odGhpcy5hY2NvdW50U2lkLCB0aGlzLmF1dGhUb2tlbiwgdGhpcy5mcm9tTnVtYmVyKTtcblx0fVxufTtcblxuUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NNU19FbmFibGVkJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRSb2NrZXRDaGF0LlNNUy5lbmFibGVkID0gdmFsdWU7XG59KTtcbiIsIi8qIGdsb2JhbHMgUm9ja2V0Q2hhdCAqL1xuaW1wb3J0IHR3aWxpbyBmcm9tICd0d2lsaW8nO1xuXG5jbGFzcyBUd2lsaW8ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmFjY291bnRTaWQgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnU01TX1R3aWxpb19BY2NvdW50X1NJRCcpO1xuXHRcdHRoaXMuYXV0aFRva2VuID0gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ1NNU19Ud2lsaW9fYXV0aFRva2VuJyk7XG5cdH1cblx0cGFyc2UoZGF0YSkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRmcm9tOiBkYXRhLkZyb20sXG5cdFx0XHR0bzogZGF0YS5Ubyxcblx0XHRcdGJvZHk6IGRhdGEuQm9keSxcblxuXHRcdFx0ZXh0cmE6IHtcblx0XHRcdFx0dG9Db3VudHJ5OiBkYXRhLlRvQ291bnRyeSxcblx0XHRcdFx0dG9TdGF0ZTogZGF0YS5Ub1N0YXRlLFxuXHRcdFx0XHR0b0NpdHk6IGRhdGEuVG9DaXR5LFxuXHRcdFx0XHR0b1ppcDogZGF0YS5Ub1ppcCxcblx0XHRcdFx0ZnJvbUNvdW50cnk6IGRhdGEuRnJvbUNvdW50cnksXG5cdFx0XHRcdGZyb21TdGF0ZTogZGF0YS5Gcm9tU3RhdGUsXG5cdFx0XHRcdGZyb21DaXR5OiBkYXRhLkZyb21DaXR5LFxuXHRcdFx0XHRmcm9tWmlwOiBkYXRhLkZyb21aaXBcblx0XHRcdH1cblx0XHR9O1xuXHR9XG5cdHNlbmQoZnJvbU51bWJlciwgdG9OdW1iZXIsIG1lc3NhZ2UpIHtcblx0XHRjb25zdCBjbGllbnQgPSB0d2lsaW8odGhpcy5hY2NvdW50U2lkLCB0aGlzLmF1dGhUb2tlbik7XG5cblx0XHRjbGllbnQubWVzc2FnZXMuY3JlYXRlKHtcblx0XHRcdHRvOiB0b051bWJlcixcblx0XHRcdGZyb206IGZyb21OdW1iZXIsXG5cdFx0XHRib2R5OiBtZXNzYWdlXG5cdFx0fSk7XG5cdH1cblx0cmVzcG9uc2UoLyogbWVzc2FnZSAqLykge1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdDb250ZW50LVR5cGUnOiAndGV4dC94bWwnXG5cdFx0XHR9LFxuXHRcdFx0Ym9keTogJzxSZXNwb25zZT48L1Jlc3BvbnNlPidcblx0XHR9O1xuXHR9XG5cdGVycm9yKGVycm9yKSB7XG5cdFx0bGV0IG1lc3NhZ2UgPSAnJztcblx0XHRpZiAoZXJyb3IucmVhc29uKSB7XG5cdFx0XHRtZXNzYWdlID0gYDxNZXNzYWdlPiR7IGVycm9yLnJlYXNvbiB9PC9NZXNzYWdlPmA7XG5cdFx0fVxuXHRcdHJldHVybiB7XG5cdFx0XHRoZWFkZXJzOiB7XG5cdFx0XHRcdCdDb250ZW50LVR5cGUnOiAndGV4dC94bWwnXG5cdFx0XHR9LFxuXHRcdFx0Ym9keTogYDxSZXNwb25zZT4keyBtZXNzYWdlIH08L1Jlc3BvbnNlPmBcblx0XHR9O1xuXHR9XG59XG5cblJvY2tldENoYXQuU01TLnJlZ2lzdGVyU2VydmljZSgndHdpbGlvJywgVHdpbGlvKTtcbiJdfQ==
