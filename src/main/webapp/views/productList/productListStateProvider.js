/**
 * Created by shian_mac on 9/2/15.
 */

const annotation = ['$stateProvider'];

function productListStateProvider($stateProvider) {
    $stateProvider.
        state('productList', {
            url: '/productList',
            views: {
                'content@': {
                    templateUrl: 'productList/productList.html',
                    controller: 'ProductListController as productListController'
                }
            }
        });
}

productListStateProvider.$inject = annotation;
export default productListStateProvider;