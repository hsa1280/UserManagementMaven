/**
 * Created by shian_mac on 8/30/15.
 */

const annotation = ['$stateProvider'];

function testProvider($stateProvider) {
    $stateProvider.
        state('test', {
            abstract: true
        })
}

testProvider.$inject = annotation;
export default testProvider;
