/**
 * Created by shian on 8/20/15.
 */
/**
 * Created by shian_mac on 8/16/15.
 */
'use strict';

var AngularSpringApp = {};

var App = angular.module('AngularUserManagementApp', []);

App.controller('GreetingController', ['$scope', '$http', function($scope, $http) {
    $scope.greeting = 'hello';
    $scope.test1 = 'test1';
    $scope.getFacilityList = function() {
        $http.get('/facility').success(function(response) {
            $scope.test2 = 'success';
            $scope.data = response;
        })
            .error(function(response) {
                $scope.error = response;
                $scope.test3 = 'error';
            });
    }

}]);


