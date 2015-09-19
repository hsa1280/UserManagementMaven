/**
 * Created by shian_mac on 9/19/15.
 */

require( 'angular-mocks' );

describe('placeOrderController', function() {

    beforeEach(angular.mock.module('sportsStore'));

    var cart, http, controller;

    function initialize(callback) {
        inject(function(_cart_, $http, $controller) {
            cart = _cart_;
            http = $http;

            if (callback) {
                callback();
            }

            controller = $controller('ProductListController', {
                cart: cart,
                $http: http
            });
        })
    }

    describe('Default values', function() {
        it('constructor', function() {
            initialize();
            expect(controller.selectedPage).toEqual(1);
            expect(controller.pageSize).toEqual(3);
            expect(controller.data).toEqual({});
            expect(controller.selectedCategory).toBeNull();
            expect(controller.hightLightClass).toEqual('btn-primary');
        });
    })
})