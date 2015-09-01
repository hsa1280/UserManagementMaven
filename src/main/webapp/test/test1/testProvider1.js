/**
 * Created by shian_mac on 8/30/15.
 */

const annotation = ['$stateProvider'];

function testProvider1($stateProvider) {
    $stateProvider.
        state('test1', {
            url: '/test1',
            views: {
                'content@': {
                    templateUrl: 'test1.html',
                    controller: 'TestController1 as testController1'
                }
            }
        });
}

testProvider1.$inject = annotation;
export default testProvider1;
