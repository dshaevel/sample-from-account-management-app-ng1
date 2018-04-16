'use strict';

/* eslint strict: [2, "global"] */
/* global angular:false */

/**
 * @ngdoc overview
 * @name acctMgmtWwwApp
 * @description
 * # acctMgmtWwwApp
 *
 * Main module of the application.
 */
angular
	.module('acctMgmtWwwApp', [
		'ngRoute',
		'ngResource',
		'ui.bootstrap'
	])
	.config(['$routeProvider', function ($routeProvider) {
		var pathname = window.location.pathname;

		$routeProvider
			.when('/accounts/:accountId', {
				templateUrl: 'views/index.html',
				controller: 'AccountProductUsersCtrl',
				controllerAs: 'accountProductUsers',
				resolve: {
					factory: function (checkAuthentication) {
						return checkAuthentication();
					}
				}
			})
			.otherwise({
				redirectTo: '/home/:accountId'
			});
	}])
	.run(function ($rootScope) {
		$rootScope.isOlarkStarted = false;
	});
