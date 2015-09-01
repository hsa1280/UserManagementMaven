/**
 * Created by shian_mac on 8/30/15.
 */

const annotation = ['$stateProvider'];

function testProvider2($stateProvider) {
    $stateProvider.
        state('test2', {
            url: '/test2',
            views: {
                'content@': {
                    templateUrl: 'test2.html',
                    controller: 'TestController2 as testController2'
                }
            }
        });
}

testProvider2.$inject = annotation;
export default testProvider2;
