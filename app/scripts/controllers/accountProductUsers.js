'use strict';

/* eslint strict: [2, "global"] */
/* global angular:false */
/* global _:false */

/**
 * @ngdoc function
 * @name acctMgmtWwwApp.controller:AccountProductUsersCtrl
 * @description
 * # AccountProductUsersCtrl
 * Controller of the My Account view
 */
angular.module('acctMgmtWwwApp')
	.controller('AccountProductUsersCtrl', [
		'$scope',
		'$q',
		'Account',
		'AccountAudits',
		'AccountTenants',
		'FeatureAccountTenant',
		'currentUserAccount',
		'currentAccountTenant',
		'currentAccountTenantProduct',
		'AccountTenantProductInvites',
		'UserAccounts',
		'UsersService',
		'ProductsService',
		'UserDefaults',
		'utils',
		function(
			$scope,
			$q,
			Account,
			AccountAudits,
			AccountTenants,
			FeatureAccountTenant,
			currentUserAccount,
			currentAccountTenant,
			currentAccountTenantProduct,
			AccountTenantProductInvites,
			UserAccounts,
			UsersService,
			ProductsService,
			UserDefaults,
			utils
		) {
			function clearErrors() {
				$scope.inviteUserStatus = undefined;
				$scope.editRoleStatus = undefined;
				$scope.getAccountTenantProductInviteStatus = undefined;

				$scope.getCurrentAccountStatus = undefined;
				$scope.getAccountUsersStatus = undefined;
				$scope.getCurrentAccountTenantStatus = undefined;
				$scope.getCurrentAccountTenantProductStatus = undefined;
				$scope.getCurrentAccountTenantProductUsersStatus = undefined;
			}

			function inviteUser(event, inviteInfo) {
				var invite = _.clone(inviteInfo);
				invite.tenantId = $scope.tenantId;
				invite.productId = $scope.product.productId;

				AccountTenantProductInvites.save({
					accountId: $scope.accountId,
					tenantId: $scope.tenantId,
					productId: $scope.product.productId
				}, invite).$promise.then(
					function inviteUserSuccess(response) {
						clearErrors();
						$scope.inviteUserStatus = { status: 'SUCCESS' };
						$scope.$broadcast('user-invited', inviteInfo);
						$scope.invites.unshift(inviteInfo);
					},
					function inviteUserError(error) {
						var inviteUserStatus = {
							status: 'ERROR',
							message: 'An error occurred inviting the user.'
						};
						if (error.status === 409) {
							inviteUserStatus.message = error.data.message;
						} else if (error.status === 422) {
							inviteUserStatus.message = 'Invalid email.';
						}
						$scope.inviteUserStatus = inviteUserStatus;
					}
				);
			}

			function isAdmin(user) {
				return !!user && !!user.roles && _.includes(user.roles, 'admin');
			}

			function selectedRolesChanged(user) {
				var userCopy;
				userCopy = _.clone(user);
				userCopy.roles = [user.selectedRoles];
				delete userCopy.selectedRoles;

				UsersService.update({
					accountId: $scope.accountId,
					tenantId: $scope.tenantId,
					productId: $scope.product.productId
				}, userCopy).$promise.then(
					function updateUserRoleSuccess(response) {
						clearErrors();
						$scope.editRoleStatus = 'SUCCESS';
						user.roles = [user.selectedRoles];
					},
					function updateUserRoleError(error) {
						$scope.editRoleStatus = 'ERROR';
						user.selectedRoles = user.roles[0];
						fetchProductUsers(); // eslint-disable-line no-use-before-define
					}
				);
			}

			// =========================================================================

			function getUserAccounts(userAccount) {
				return UserAccounts.getUserAccounts({ userId: userAccount.userId })
					.then(function setAccounts(accounts) {
						$scope.accounts = accounts;
						return $q.resolve([accounts, userAccount]);
					});
			}

			function populateFavorite(userAccountData) {
				// var accounts = userAccountData[0];
				var userAccount = userAccountData[1];
				// console.log('populateFavorite()::accounts ==>' + JSON.stringify(accounts, null, 2) + '<==');
				// console.log('populateFavorite()::userAccount ==>' + JSON.stringify(userAccount, null, 2) + '<==');

				return ProductsService.get()
					.then(function(products) {
						// console.log('products ==>' + JSON.stringify(products, null, 2) + '<==');
						var product = _.find(products, { shortName: 'cerberus' });
						// console.log('product ==>' + JSON.stringify(product, null, 2) + '<==');
						var cerberusId = product.productId;
						return UserDefaults.get({ userId: userAccount.userId, productId: cerberusId }).$promise
							.then(function(userDefault) {
								// console.log('userDefault ==>' + JSON.stringify(userDefault, null, 2) + '<==');
								return $q.resolve(userAccount);
							});
					});
			}

			function getAccountDetails(userAccount) {
				var deferred = $q.defer();
				Account.get({ accountId: userAccount.accountId }).$promise.then(
					function getAccountSuccess(account) {
						var accountDetails = _.merge(userAccount, account);
						deferred.resolve(accountDetails);
					},
					function getAccountError() {
						deferred.resolve(userAccount);
					}
				);
				return deferred.promise;
			}

			function getAccountUsers(account) {
				$scope.getCurrentAccountStatus = 'SUCCESS';
				$scope.currentUserAccount = account;
				$scope.accountId = account.accountId;

				var deferred = $q.defer();

				UsersService.query(
					{ accountId: $scope.accountId }
				).$promise.then(
					function getAccountUsersSuccess(accountUsers) {
						$scope.getAccountUsersStatus = 'SUCCESS';
						var disabledAccountUserIds = [];
						_.forEach(accountUsers, function(user) {
							if (user.status === 'disabled') {
								disabledAccountUserIds.push(user.userId);
							}
						});
						$scope.disabledAccountUserIds = disabledAccountUserIds;
						deferred.resolve(account);
					},
					function getAccountUsersError(error) {
						$scope.getAccountUsersStatus = 'ERROR';
						deferred.reject(error);
					}
				);

				return deferred.promise;
			}

			function getCurrentAccountError(error) {
				$scope.getCurrentAccountStatus = 'ERROR';
				return $q.reject(error);
			}

			function getCurrentAccountTenant(account) {
				return currentAccountTenant.getOrFetchCurrent();
			}

			function getCurrentAccountTenantProduct(tenant) {
				$scope.getCurrentAccountTenantStatus = 'SUCCESS';
				$scope.tenantId = tenant.tenantId;
				return currentAccountTenantProduct.getOrFetchCurrent();
			}

			function getCurrentAccountTenantError(error) {
				if ((!$scope.getCurrentAccountStatus || $scope.getCurrentAccountStatus !== 'ERROR') &&
					(!$scope.getAccountUsersStatus || $scope.getAccountUsersStatus !== 'ERROR')) {
					$scope.getCurrentAccountTenantStatus = 'ERROR';
				}
				return $q.reject(error);
			}

			function updateInvitations(product) {
				var deferred = $q.defer();

				AccountTenantProductInvites.query({
					accountId: product.accountId,
					tenantId: product.tenantId,
					productId: product.productId
				}).$promise.then(
					function getAccountTenantProductInviteSuccess(invites) {
						$scope.getAccountTenantProductInviteStatus = 'SUCCESS';
						$scope.invites = invites;
						deferred.resolve(product);
					},
					function getAccountTenantProductInviteError(error) {
						$scope.getAccountTenantProductInviteStatus = 'ERROR';
						deferred.resolve(product);
					}
				);

				return deferred.promise;
			}

			function getCurrentAccountTenantProductUsers(product) {
				$scope.getCurrentAccountTenantProductStatus = 'SUCCESS';
				$scope.view.title = product.name + ' Users';
				$scope.product = product;

				return UsersService.query({
					accountId: product.accountId,
					tenantId: product.tenantId,
					productId: product.productId
				}).$promise;
			}

			function getCurrentAccountTenantProductError(error) {
				if ((!$scope.getCurrentAccountStatus || $scope.getCurrentAccountStatus !== 'ERROR') &&
					(!$scope.getAccountUsersStatus || $scope.getAccountUsersStatus !== 'ERROR') &&
					(!$scope.getCurrentAccountTenantStatus || $scope.getCurrentAccountTenantStatus !== 'ERROR')) {
					$scope.getCurrentAccountTenantProductStatus = 'ERROR';
				}
				return $q.reject(error);
			}

			function populateProductUsers(users) {
				$scope.getCurrentAccountTenantProductUsersStatus = 'SUCCESS';
				var filteredUsers = _.filter(users, function(productUser) {
					return _.indexOf($scope.disabledAccountUserIds, productUser.userId) === -1;
				});
				$scope.users = filteredUsers;
				return filteredUsers;
			}

			function getCurrentAccountTenantProductUsersError(error) {
				if ((!$scope.getCurrentAccountStatus || $scope.getCurrentAccountStatus !== 'ERROR') &&
					(!$scope.getAccountUsersStatus || $scope.getAccountUsersStatus !== 'ERROR') &&
					(!$scope.getCurrentAccountTenantStatus || $scope.getCurrentAccountTenantStatus !== 'ERROR') &&
					(!$scope.getCurrentAccountTenantProductStatus || $scope.getCurrentAccountTenantProductStatus !== 'ERROR')) {
					$scope.getCurrentAccountTenantProductUsersStatus = 'ERROR';
				}
				return $q.reject(error);
			}

			function populateImpersonationAudit(usersList) {
				return AccountTenants.query({ accountId: $scope.accountId }).$promise.then(function(accountTenants) {
					return FeatureAccountTenant.get({ featureId: 'impersonationAudit', accountId: $scope.accountId, tenantId: accountTenants[0].tenantId }).$promise
						.then(function(featureAccountTenant) {
							$scope.impersonationAuditEnabled = featureAccountTenant.enabled;
							return !!featureAccountTenant.enabled
								? AccountAudits.query({ accountId: $scope.accountId }).$promise.then(function(accountAudits) {
									$scope.accountAudits = accountAudits;
									return [usersList, accountAudits];
								})
								: [usersList, []];
						});
				});
			}

			function fetchProductUsers() {
				return currentUserAccount.getOrFetchCurrent()
					.then(getUserAccounts)
					.then(populateFavorite)
					.then(getAccountDetails)
					.then(getAccountUsers, getCurrentAccountError)
					.then(getCurrentAccountTenant)
					.then(getCurrentAccountTenantProduct, getCurrentAccountTenantError)
					.then(updateInvitations)
					.then(getCurrentAccountTenantProductUsers, getCurrentAccountTenantProductError)
					.then(populateProductUsers, getCurrentAccountTenantProductUsersError)
					.then(populateImpersonationAudit);
			}

			// =========================================================================

			$scope.isDisabledActionHidden = true;
			$scope.isInviteHidden = false;
			$scope.invites = [];
			$scope.view = {};

			$scope.isAdmin = isAdmin;
			$scope.fetchProductUsers = fetchProductUsers;
			$scope.selectedRolesChanged = selectedRolesChanged;
			$scope.toDate = utils.toDate;
			$scope.tab = 'users';

			$scope.$on('invite-user', inviteUser);

			clearErrors();
			fetchProductUsers();
			/*
			.then(function logProductUsers(result) {
				console.log('productUsers ==>' + JSON.stringify(result[0], null, 2) + '<=='); // eslint-disable-line no-console
			});
			*/
		}
	]);
