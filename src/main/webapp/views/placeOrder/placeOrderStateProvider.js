/**
 * Created by shian_mac on 9/13/15.
 */

const annotation = ['$stateProvider'];

function placeOrderStateProvider($stateProvider) {
    $stateProvider.
        state('placeOrder', {
            url: '/placeOrder',
            views: {
                'content@': {
                    templateUrl: 'placeOrder/placeOrder.html',
                    controller: 'PlaceOrderController as placeOrderController'
                }
            }
        });
}

placeOrderStateProvider.$inject = annotation;
export default placeOrderStateProvider;