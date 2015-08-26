/**
 * Created by shian on 8/20/15.
 */
/**
 * Created by shian_mac on 8/16/15.
 */
'use strict';
require('angular/angular');


var AngularSpringApp = {};

var App = angular.module('AngularUserManagementApp', []);

App.controller('GreetingController', ['$scope', '$http', function($scope, $http) {
    $http.get('/facility').success(function(response) {
        $scope.data = response;
    }).error(function(response) {
        $scope.error = response;
    });

}]);


