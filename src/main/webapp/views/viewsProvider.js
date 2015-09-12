/**
 * Created by shian_mac on 8/30/15.
 */

const annotation = ['$stateProvider'];

function viewsProvider($stateProvider) {
    $stateProvider.
        state('views', {
            abstract: true
        })
}

viewsProvider.$inject = annotation;
export default viewsProvider;
