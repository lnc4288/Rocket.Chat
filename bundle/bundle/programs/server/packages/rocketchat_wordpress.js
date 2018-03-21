(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var RocketChat = Package['rocketchat:lib'].RocketChat;
var CustomOAuth = Package['rocketchat:custom-oauth'].CustomOAuth;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

var require = meteorInstall({"node_modules":{"meteor":{"rocketchat:wordpress":{"common.js":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/rocketchat_wordpress/common.js                                         //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
/* globals CustomOAuth */
const config = {
  serverURL: '',
  identityPath: '/oauth/me',
  addAutopublishFields: {
    forLoggedInUser: ['services.wordpress'],
    forOtherUsers: ['services.wordpress.user_login']
  }
};
const WordPress = new CustomOAuth('wordpress', config);

if (Meteor.isServer) {
  Meteor.startup(function () {
    return RocketChat.settings.get('API_Wordpress_URL', function (key, value) {
      config.serverURL = value;
      return WordPress.configure(config);
    });
  });
} else {
  Meteor.startup(function () {
    return Tracker.autorun(function () {
      if (RocketChat.settings.get('API_Wordpress_URL')) {
        config.serverURL = RocketChat.settings.get('API_Wordpress_URL');
        return WordPress.configure(config);
      }
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////

},"startup.js":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/rocketchat_wordpress/startup.js                                        //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
RocketChat.settings.addGroup('OAuth', function () {
  return this.section('WordPress', function () {
    const enableQuery = {
      _id: 'Accounts_OAuth_Wordpress',
      value: true
    };
    this.add('Accounts_OAuth_Wordpress', false, {
      type: 'boolean',
      'public': true
    });
    this.add('API_Wordpress_URL', '', {
      type: 'string',
      enableQuery,
      'public': true
    });
    this.add('Accounts_OAuth_Wordpress_id', '', {
      type: 'string',
      enableQuery
    });
    this.add('Accounts_OAuth_Wordpress_secret', '', {
      type: 'string',
      enableQuery
    });
    return this.add('Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', {
      type: 'relativeUrl',
      readonly: true,
      force: true,
      enableQuery
    });
  });
});
/////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/rocketchat:wordpress/common.js");
require("/node_modules/meteor/rocketchat:wordpress/startup.js");

/* Exports */
Package._define("rocketchat:wordpress");

})();

//# sourceURL=meteor://💻app/packages/rocketchat_wordpress.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvcm9ja2V0Y2hhdDp3b3JkcHJlc3MvY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9yb2NrZXRjaGF0OndvcmRwcmVzcy9zdGFydHVwLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsInNlcnZlclVSTCIsImlkZW50aXR5UGF0aCIsImFkZEF1dG9wdWJsaXNoRmllbGRzIiwiZm9yTG9nZ2VkSW5Vc2VyIiwiZm9yT3RoZXJVc2VycyIsIldvcmRQcmVzcyIsIkN1c3RvbU9BdXRoIiwiTWV0ZW9yIiwiaXNTZXJ2ZXIiLCJzdGFydHVwIiwiUm9ja2V0Q2hhdCIsInNldHRpbmdzIiwiZ2V0Iiwia2V5IiwidmFsdWUiLCJjb25maWd1cmUiLCJUcmFja2VyIiwiYXV0b3J1biIsImFkZEdyb3VwIiwic2VjdGlvbiIsImVuYWJsZVF1ZXJ5IiwiX2lkIiwiYWRkIiwidHlwZSIsInJlYWRvbmx5IiwiZm9yY2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFFQSxNQUFNQSxTQUFTO0FBQ2RDLGFBQVcsRUFERztBQUVkQyxnQkFBYyxXQUZBO0FBR2RDLHdCQUFzQjtBQUNyQkMscUJBQWlCLENBQUMsb0JBQUQsQ0FESTtBQUVyQkMsbUJBQWUsQ0FBQywrQkFBRDtBQUZNO0FBSFIsQ0FBZjtBQVNBLE1BQU1DLFlBQVksSUFBSUMsV0FBSixDQUFnQixXQUFoQixFQUE2QlAsTUFBN0IsQ0FBbEI7O0FBRUEsSUFBSVEsT0FBT0MsUUFBWCxFQUFxQjtBQUNwQkQsU0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekIsV0FBT0MsV0FBV0MsUUFBWCxDQUFvQkMsR0FBcEIsQ0FBd0IsbUJBQXhCLEVBQTZDLFVBQVNDLEdBQVQsRUFBY0MsS0FBZCxFQUFxQjtBQUN4RWYsYUFBT0MsU0FBUCxHQUFtQmMsS0FBbkI7QUFDQSxhQUFPVCxVQUFVVSxTQUFWLENBQW9CaEIsTUFBcEIsQ0FBUDtBQUNBLEtBSE0sQ0FBUDtBQUlBLEdBTEQ7QUFNQSxDQVBELE1BT087QUFDTlEsU0FBT0UsT0FBUCxDQUFlLFlBQVc7QUFDekIsV0FBT08sUUFBUUMsT0FBUixDQUFnQixZQUFXO0FBQ2pDLFVBQUlQLFdBQVdDLFFBQVgsQ0FBb0JDLEdBQXBCLENBQXdCLG1CQUF4QixDQUFKLEVBQWtEO0FBQ2pEYixlQUFPQyxTQUFQLEdBQW1CVSxXQUFXQyxRQUFYLENBQW9CQyxHQUFwQixDQUF3QixtQkFBeEIsQ0FBbkI7QUFDQSxlQUFPUCxVQUFVVSxTQUFWLENBQW9CaEIsTUFBcEIsQ0FBUDtBQUNBO0FBQ0QsS0FMTSxDQUFQO0FBTUEsR0FQRDtBQVFBLEM7Ozs7Ozs7Ozs7O0FDN0JEVyxXQUFXQyxRQUFYLENBQW9CTyxRQUFwQixDQUE2QixPQUE3QixFQUFzQyxZQUFXO0FBQ2hELFNBQU8sS0FBS0MsT0FBTCxDQUFhLFdBQWIsRUFBMEIsWUFBVztBQUUzQyxVQUFNQyxjQUFjO0FBQ25CQyxXQUFLLDBCQURjO0FBRW5CUCxhQUFPO0FBRlksS0FBcEI7QUFJQSxTQUFLUSxHQUFMLENBQVMsMEJBQVQsRUFBcUMsS0FBckMsRUFBNEM7QUFDM0NDLFlBQU0sU0FEcUM7QUFFM0MsZ0JBQVU7QUFGaUMsS0FBNUM7QUFJQSxTQUFLRCxHQUFMLENBQVMsbUJBQVQsRUFBOEIsRUFBOUIsRUFBa0M7QUFDakNDLFlBQU0sUUFEMkI7QUFFakNILGlCQUZpQztBQUdqQyxnQkFBVTtBQUh1QixLQUFsQztBQUtBLFNBQUtFLEdBQUwsQ0FBUyw2QkFBVCxFQUF3QyxFQUF4QyxFQUE0QztBQUMzQ0MsWUFBTSxRQURxQztBQUUzQ0g7QUFGMkMsS0FBNUM7QUFJQSxTQUFLRSxHQUFMLENBQVMsaUNBQVQsRUFBNEMsRUFBNUMsRUFBZ0Q7QUFDL0NDLFlBQU0sUUFEeUM7QUFFL0NIO0FBRitDLEtBQWhEO0FBSUEsV0FBTyxLQUFLRSxHQUFMLENBQVMsdUNBQVQsRUFBa0Qsa0JBQWxELEVBQXNFO0FBQzVFQyxZQUFNLGFBRHNFO0FBRTVFQyxnQkFBVSxJQUZrRTtBQUc1RUMsYUFBTyxJQUhxRTtBQUk1RUw7QUFKNEUsS0FBdEUsQ0FBUDtBQU1BLEdBN0JNLENBQVA7QUE4QkEsQ0EvQkQsRSIsImZpbGUiOiIvcGFja2FnZXMvcm9ja2V0Y2hhdF93b3JkcHJlc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIEN1c3RvbU9BdXRoICovXG5cbmNvbnN0IGNvbmZpZyA9IHtcblx0c2VydmVyVVJMOiAnJyxcblx0aWRlbnRpdHlQYXRoOiAnL29hdXRoL21lJyxcblx0YWRkQXV0b3B1Ymxpc2hGaWVsZHM6IHtcblx0XHRmb3JMb2dnZWRJblVzZXI6IFsnc2VydmljZXMud29yZHByZXNzJ10sXG5cdFx0Zm9yT3RoZXJVc2VyczogWydzZXJ2aWNlcy53b3JkcHJlc3MudXNlcl9sb2dpbiddXG5cdH1cbn07XG5cbmNvbnN0IFdvcmRQcmVzcyA9IG5ldyBDdXN0b21PQXV0aCgnd29yZHByZXNzJywgY29uZmlnKTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUm9ja2V0Q2hhdC5zZXR0aW5ncy5nZXQoJ0FQSV9Xb3JkcHJlc3NfVVJMJywgZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuXHRcdFx0Y29uZmlnLnNlcnZlclVSTCA9IHZhbHVlO1xuXHRcdFx0cmV0dXJuIFdvcmRQcmVzcy5jb25maWd1cmUoY29uZmlnKTtcblx0XHR9KTtcblx0fSk7XG59IGVsc2Uge1xuXHRNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gVHJhY2tlci5hdXRvcnVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKFJvY2tldENoYXQuc2V0dGluZ3MuZ2V0KCdBUElfV29yZHByZXNzX1VSTCcpKSB7XG5cdFx0XHRcdGNvbmZpZy5zZXJ2ZXJVUkwgPSBSb2NrZXRDaGF0LnNldHRpbmdzLmdldCgnQVBJX1dvcmRwcmVzc19VUkwnKTtcblx0XHRcdFx0cmV0dXJuIFdvcmRQcmVzcy5jb25maWd1cmUoY29uZmlnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG59XG4iLCJSb2NrZXRDaGF0LnNldHRpbmdzLmFkZEdyb3VwKCdPQXV0aCcsIGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdGhpcy5zZWN0aW9uKCdXb3JkUHJlc3MnLCBmdW5jdGlvbigpIHtcblxuXHRcdGNvbnN0IGVuYWJsZVF1ZXJ5ID0ge1xuXHRcdFx0X2lkOiAnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJyxcblx0XHRcdHZhbHVlOiB0cnVlXG5cdFx0fTtcblx0XHR0aGlzLmFkZCgnQWNjb3VudHNfT0F1dGhfV29yZHByZXNzJywgZmFsc2UsIHtcblx0XHRcdHR5cGU6ICdib29sZWFuJyxcblx0XHRcdCdwdWJsaWMnOiB0cnVlXG5cdFx0fSk7XG5cdFx0dGhpcy5hZGQoJ0FQSV9Xb3JkcHJlc3NfVVJMJywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnksXG5cdFx0XHQncHVibGljJzogdHJ1ZVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3NfaWQnLCAnJywge1xuXHRcdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0XHRlbmFibGVRdWVyeVxuXHRcdH0pO1xuXHRcdHRoaXMuYWRkKCdBY2NvdW50c19PQXV0aF9Xb3JkcHJlc3Nfc2VjcmV0JywgJycsIHtcblx0XHRcdHR5cGU6ICdzdHJpbmcnLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcy5hZGQoJ0FjY291bnRzX09BdXRoX1dvcmRwcmVzc19jYWxsYmFja191cmwnLCAnX29hdXRoL3dvcmRwcmVzcycsIHtcblx0XHRcdHR5cGU6ICdyZWxhdGl2ZVVybCcsXG5cdFx0XHRyZWFkb25seTogdHJ1ZSxcblx0XHRcdGZvcmNlOiB0cnVlLFxuXHRcdFx0ZW5hYmxlUXVlcnlcblx0XHR9KTtcblx0fSk7XG59KTtcbiJdfQ==
