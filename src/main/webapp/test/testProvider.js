/**
 * Created by shian_mac on 8/30/15.
 */

const annotation = ['$stateProvider'];

function testProvider($stateProvider) {
    $stateProvider.
        state('shian.test', {
            url: '/test',
            views: {
                'content@': {
                    templateUrl: 'test.html',
                    controller: 'TestController as testController'
                }
            }
        });
}

testProvider.$inject = annotation;
export default testProvider;
