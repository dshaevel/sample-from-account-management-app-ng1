'use strict';

/* eslint strict: [2, "global"] */
/* global beforeEach:false */
/* global afterEach: false */
/* global describe:false */
/* global expect:false */
/* global inject:false */
/* global spyOn: false */
/* global it:false */

var apiServer = 'http://localhost:8666';

var mockAccount1 = window.__fixtures__['mock/accounts1'];
var mockCurrentUserAccount1 = window.__fixtures__['mock/userAccounts1'];
var mockAccountUsers1a = window.__fixtures__['mock/accountUsers1a'];
var mockCurrentAccountTenant1 = window.__fixtures__['mock/accountTenants1a'];
var mockImpersonationAuditFeature = window.__fixtures__['mock/features1a'];
var mockAudits = window.__fixtures__['mock/audits1'];
var mockCurrentAccountTenantProducts1 = window.__fixtures__['mock/accountTenantProducts1a'];
var mockCurrentAccountTenantProductUsers1a = window.__fixtures__['mock/accountTenantProductUsers1a'];
var mockCurrentAccountTenantProductUsers1b = window.__fixtures__['mock/accountTenantProductUsers1b'];
var mockCurrentAccountTenantProductInvites1 = window.__fixtures__['mock/accountTenantProductInvites1'];
var mockCurrentAccountTenantProductInvites2 = window.__fixtures__['mock/accountTenantProductInvites2'];
var mockProduct1 = window.__fixtures__['mock/products1'];
var mockProduct2 = window.__fixtures__['mock/products2'];
var mockProduct3 = window.__fixtures__['mock/products3'];
// var mockUserDefaults1a = window.__fixtures__['mock/userDefaults1a'];
// var mockUserDefaults1b = window.__fixtures__['mock/userDefaults1b'];
var mockUserDefaults1c = window.__fixtures__['mock/userDefaults1c'];

var mockAccountTenantProductResponse = [];
mockAccountTenantProductResponse.push(mockCurrentAccountTenantProducts1);

var mockAccountTenantProductUsersResponse = [];
mockAccountTenantProductUsersResponse.push(mockCurrentAccountTenantProductUsers1a);

var mockAccountTenantProductInviteResponse1 = [];
mockAccountTenantProductInviteResponse1.push(mockCurrentAccountTenantProductInvites1);

var mockAccountTenantProductInviteResponse2 = [];
mockAccountTenantProductInviteResponse2.push(mockCurrentAccountTenantProductInvites2);
mockAccountTenantProductInviteResponse2.push(mockCurrentAccountTenantProductInvites1);

describe('Controller: AccountProductUsersCtrl', function() {
	var $scope;
	var $controller;
	var $httpBackend;
	var createController;
	var deferredUserAccount;
	var deferredAccountTenant;

	// load the controller's module
	beforeEach(module('acctMgmtWwwApp'));

	// Initialize the controller and a mock scope
	beforeEach(inject(function($injector, $q, currentUserAccount, currentAccountTenant) {
		$scope = $injector.get('$rootScope');
		$controller = $injector.get('$controller');
		$httpBackend = $injector.get('$httpBackend');

		deferredUserAccount = $q.defer();
		deferredAccountTenant = $q.defer();
		spyOn(currentUserAccount, 'getOrFetchCurrent').and.returnValue(deferredUserAccount.promise);
		spyOn(currentAccountTenant, 'getOrFetchCurrent').and.returnValue(deferredAccountTenant.promise);

		createController = function() {
			return $controller('AccountProductUsersCtrl', {
				$scope: $scope,
				currentUserAccount: currentUserAccount,
				currentAccountTenant: currentAccountTenant
			});
		};
	}));

	afterEach(function() {
		$httpBackend.verifyNoOutstandingExpectation();
		$httpBackend.verifyNoOutstandingRequest();
	});

	it('should properly handle an error from the current user account API', function(done) {
		deferredUserAccount.reject({ status: 502, statusText: 'Bad Gateway' });
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 502
		// -------------------------------------------------------------------------
		createController();
		$scope.$digest();

		expect($scope.getCurrentAccountStatus).toBe('ERROR');
		expect($scope.getAccountUsersStatus_Product).toBe(undefined);
		expect($scope.getCurrentAccountTenantStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductStatus).toBe(undefined);
		expect($scope.getAccountTenantProductInviteStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe(undefined);
		done();
	});

	it('should properly handle an error from the account users API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(function(method, url, data, headers, params) {
				return [502, { status: 502, statusText: 'Bad Gateway' }];
			});
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 502
		// -------------------------------------------------------------------------
		createController();
		$httpBackend.flush();

		expect($scope.getCurrentAccountStatus).toBe('SUCCESS');
		expect($scope.getAccountUsersStatus).toBe('ERROR');
		expect($scope.getCurrentAccountTenantStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductStatus).toBe(undefined);
		expect($scope.getAccountTenantProductInviteStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe(undefined);
		done();
	});

	it('should properly handle an error from the current account tenant API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.reject({ status: 502, statusText: 'Bad Gateway' });
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 502
		// -------------------------------------------------------------------------
		createController();
		$httpBackend.flush();

		expect($scope.getCurrentAccountStatus).toBe('SUCCESS');
		expect($scope.getAccountUsersStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantStatus).toBe('ERROR');
		expect($scope.getCurrentAccountTenantProductStatus).toBe(undefined);
		expect($scope.getAccountTenantProductInviteStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe(undefined);
		done();
	});

	it('should properly handle an error from the current account tenant product API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(function(method, url, data, headers, params) {
				return [502, { status: 502, statusText: 'Bad Gateway' }];
			});
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 502
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect($scope.getCurrentAccountStatus).toBe('SUCCESS');
		expect($scope.getAccountUsersStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantProductStatus).toBe('ERROR');
		expect($scope.getAccountTenantProductInviteStatus).toBe(undefined);
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe(undefined);
		done();
	});

	it('should properly handle an error from the update invitations API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(function(method, url, data, headers, params) {
				return [502, { status: 502, statusText: 'Bad Gateway' }];
			});
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 502
		// - GET current account tenant product users API responds 200
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect($scope.getCurrentAccountStatus).toBe('SUCCESS');
		expect($scope.getAccountUsersStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantProductStatus).toBe('SUCCESS');
		expect($scope.getAccountTenantProductInviteStatus).toBe('ERROR');
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe('SUCCESS');
		done();
	});

	it('should properly handle an error from the current account tenant product users API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(function(method, url, data, headers, params) {
				return [502, { status: 502, statusText: 'Bad Gateway' }];
			});
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 502
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect($scope.getCurrentAccountStatus).toBe('SUCCESS');
		expect($scope.getAccountUsersStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantProductStatus).toBe('SUCCESS');
		expect($scope.getAccountTenantProductInviteStatus).toBe('SUCCESS');
		expect($scope.getCurrentAccountTenantProductUsersStatus).toBe('ERROR');
		done();
	});

	it('should set the $scope.users property', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 200
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect(JSON.stringify($scope.users)).toBe(JSON.stringify(mockAccountTenantProductUsersResponse));
		expect($scope.isAdmin($scope.users[0])).toBe(true);
		done();
	});

	it('should properly handle an error from the account tenant product users API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('PATCH', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users/' + mockCurrentAccountTenantProductUsers1a.userId)
			.respond(function(method, url, data, headers, params) {
				return [502, { status: 502, statusText: 'Bad Gateway' }];
			});
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 200
		// - PATCH account tenant product users API responds 502 (update roles)
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect(JSON.stringify($scope.users)).toBe(JSON.stringify(mockAccountTenantProductUsersResponse));
		expect($scope.isAdmin($scope.users[0])).toBe(true);

		mockCurrentAccountTenantProductUsers1a.selectedRoles = 'user';
		$scope.selectedRolesChanged(mockCurrentAccountTenantProductUsers1a);
		$httpBackend.flush();

		expect($scope.editRoleStatus).toBe('ERROR');
		expect($scope.isAdmin($scope.users[0])).toBe(true);
		done();
	});

	it('should update the account tenant product user role', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('PATCH', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users/' + mockCurrentAccountTenantProductUsers1a.userId)
			.respond(mockCurrentAccountTenantProductUsers1b);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 200
		// - PATCH account tenant product users API responds 200 (update roles)
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect(JSON.stringify($scope.users)).toBe(JSON.stringify(mockAccountTenantProductUsersResponse));
		expect($scope.isAdmin($scope.users[0])).toBe(true);

		mockCurrentAccountTenantProductUsers1a.selectedRoles = 'user';
		$scope.selectedRolesChanged(mockCurrentAccountTenantProductUsers1a);
		$scope.fetchProductUsers();
		$httpBackend.flush();

		expect($scope.editRoleStatus).toBe('SUCCESS');
		expect($scope.isAdmin($scope.users[0])).toBe(false);
		done();
	});

	it('should properly handle an error from the account tenant product invite API', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('POST', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(function(method, url, data, headers, params) {
				var errorData = {
					code: 'ConflictError',
					message: 'A user with this email is already part of this account'
				};
				return [409, { status: 409, data: errorData }];
			});
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 200
		// - POST account tenant product invites API responds 409
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect(JSON.stringify($scope.invites)).toBe(JSON.stringify(mockAccountTenantProductInviteResponse1));

		$scope.$emit('invite-user', mockCurrentAccountTenantProductInvites2);
		$httpBackend.flush();

		expect($scope.inviteUserStatus.status).toBe('ERROR');
		expect(JSON.stringify($scope.invites)).toBe(JSON.stringify(mockAccountTenantProductInviteResponse1));
		done();
	});

	it('should update the invites list when a product user is invited', function(done) {
		deferredUserAccount.resolve(mockCurrentUserAccount1);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/accounts')
			.respond([mockCurrentUserAccount1]);
		$httpBackend.when('GET', apiServer + '/v1/products')
			.respond([mockProduct1, mockProduct2, mockProduct3]);
		$httpBackend.when('GET', apiServer + '/v1/users/' + mockCurrentUserAccount1.userId + '/defaults/' + mockProduct3.productId)
			.respond(mockUserDefaults1c);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId)
			.respond(mockAccount1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/users')
			.respond(mockAccountUsers1a);
		deferredAccountTenant.resolve(mockCurrentAccountTenant1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products')
			.respond(mockAccountTenantProductResponse);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockAccountTenantProductInviteResponse1);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/users')
			.respond(mockAccountTenantProductUsersResponse);
		$httpBackend.when('POST', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId + '/products/' + mockCurrentAccountTenantProducts1.productId + '/invites')
			.respond(mockCurrentAccountTenantProductInvites2);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/tenants')
			.respond([mockCurrentAccountTenant1]);
		$httpBackend.when('GET', apiServer + '/v1/features/impersonationAudit/accounts/' + mockCurrentUserAccount1.accountId + '/tenants/' + mockCurrentAccountTenant1.tenantId)
			.respond(mockImpersonationAuditFeature);
		$httpBackend.when('GET', apiServer + '/v1/accounts/' + mockCurrentUserAccount1.accountId + '/audits')
			.respond(mockAudits);
		$scope.$digest();

		// =========================================================================
		// - GET current account API responds 200
		// - GET account users API responds 200
		// - GET current account tenant API responds 200
		// - GET current account tenant product API responds 200
		// - GET current account tenant product invites API responds 200
		// - GET current account tenant product users API responds 200
		// - POST account tenant product invites API responds 200
		// -------------------------------------------------------------------------

		createController();
		$httpBackend.flush();

		expect(JSON.stringify($scope.invites)).toBe(JSON.stringify(mockAccountTenantProductInviteResponse1));

		$scope.$emit('invite-user', mockCurrentAccountTenantProductInvites2);
		$httpBackend.flush();

		expect(JSON.stringify($scope.invites)).toBe(JSON.stringify(mockAccountTenantProductInviteResponse2));
		done();
	});
});
