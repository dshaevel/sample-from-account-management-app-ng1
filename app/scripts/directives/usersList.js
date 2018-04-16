'use strict';

/* eslint strict: [2, "global"] */
/* global angular:false */

/**
 * @ngdoc directive
 * @name acctMgmtWwwApp:UsersList
 * @description
 * # UsersList
 * Component that displays a list of users and their details
 *
 */
angular.module('acctMgmtWwwApp')
	.directive('usersList', function() {
		return {
			replace: true,
			templateUrl: 'views/directives/usersList.html'
		};
	});
