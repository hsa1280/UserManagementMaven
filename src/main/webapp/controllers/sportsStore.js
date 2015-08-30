//require('angular/angular');
//require('angular-resource/angular-resource');
//require('angular-route/angular-route');

angular.module("sportsStore")
    .constant("dataUrl", "/UserManagementMaven/api/products")
    .controller("sportsStoreCtrl", function ($scope, $http, $location, 
        dataUrl, cart) {

        $scope.data = {
        };

        $http.get(dataUrl)
            .success(function (data) {
                $scope.data.products = data;
            })
            .error(function (error) {
                $scope.data.error = error;
            });
    });
