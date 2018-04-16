'use strict';

/* eslint strict: [2, "global"] */
/* global angular:false */

/**
 * @ngdoc directive
 * @name acctMgmtWwwApp:UsersView
 * @description
 * # UsersView
 * Component that displays a list of users and their details
 *
 */
angular.module('acctMgmtWwwApp')
	.controller('UsersViewCtrl', function() {
		this.title = 'Manage Users';
	})
	.directive('usersView', function() {
		var init = function(scope, element, attributes) {
			if (attributes.title) {
				scope.view.title = attributes.title;
			}
		};

		return {
			controller: 'UsersViewCtrl',
			controllerAs: 'view',
			replace: true,
			templateUrl: 'views/directives/usersView.html',
			link: init
		};
	});
