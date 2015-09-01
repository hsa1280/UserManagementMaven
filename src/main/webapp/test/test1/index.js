/**
 * Created by shian_mac on 8/30/15.
 */

import angular from 'angular';
import TestController1 from './testController1';
import testProvider1 from './testProvider1';

export default angular.
    module('testModule1', []).
    config(testProvider1).
    controller('TestController1', TestController1);