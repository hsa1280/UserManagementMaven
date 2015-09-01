/**
 * Created by shian_mac on 8/30/15.
 */

import angular from 'angular';
import TestController2 from './testController2';
import testProvider2 from './testProvider2';

export default angular.
    module('testModule2', []).
    config(testProvider2).
    controller('TestController2', TestController2);