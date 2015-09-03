/**
 * Created by shian_mac on 9/2/15.
 */

const annotation = ['$stateProvider'];

function checckoutSummaryStateProvider($stateProvider) {
    $stateProvider.
        state('checkoutSummary', {
            url: '/checkout',
            views: {
                'content@': {
                    templateUrl: 'checkoutSummary/checkoutSummary.html',
                    controller: 'CheckoutController as checkoutController'
                }
            }
        });
}

checckoutSummaryStateProvider.$inject = annotation;
export default checckoutSummaryStateProvider;