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

            controller = $controller('ProductListController', {
                cart: cart,
                $http: http
            });

            if (callback) {
                callback();
            }
        })
    }

    describe('Default values', function() {
        it('constructor', function() {
            initialize(function() {
                spyOn(controller, 'getProducts');
            });
            expect(controller.selectedPage).toEqual(1);
            expect(controller.pageSize).toEqual(3);
            expect(controller.data).toEqual({});
            expect(controller.selectedCategory).toBeNull();
            expect(controller.hightLightClass).toEqual('btn-primary');
            //expect(controller.getProducts).toHaveBeenCalled();
        });
    })
})