/**
 * Created by shian_mac on 9/13/15.
 */

require( 'angular-mocks' );
//require( 'angular' );

//import angular from 'angular';

describe('version', function() {
    //beforeEach(angular.module('myApp.services'));

    beforeEach(angular.mock.module('myApp.services'));

    it('should return current version', function(version) {
        expect(version).toEqual('0.1');
    });
});