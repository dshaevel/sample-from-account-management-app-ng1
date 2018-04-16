'use strict';

angular
	.module('acctMgmtWwwApp')
	.factory('Account', ['$resource', 'getApiUrl', function($resource, getApiUrl) {
		return $resource(getApiUrl('/v1/accounts/:accountId'),
			{ accountId: '@accountId' });
	}]);
