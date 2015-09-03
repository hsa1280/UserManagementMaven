/**
 * Created by shian_mac on 8/30/15.
 */
require('angular/angular');
require('angular-route/angular-route');

angular.module("sportsStore", ["customFilters", "cart", "ngRoute"])
    .config(function($routeProvider) {

        $routeProvider.when("/checkout", {
            templateUrl: "views/checkoutSummary/checkoutSummary.html"
        });

        $routeProvider.when("/products", {
            templateUrl: "views/productList/productList.html"
        });

        $routeProvider.when("/complete", {
            templateUrl: "views/thankYou.html"
        });

        $routeProvider.when("/placeOrder", {
            templateUrl: "views/placeOrder.html"
        });

        $routeProvider.otherwise({
            templateUrl: "views/productList/productList.html"
        });
    });


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