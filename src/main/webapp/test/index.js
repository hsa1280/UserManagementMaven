/**
 * Created by shian_mac on 8/30/15.
 */

import angular from 'angular';
import 'angular-ui-router';
import testController from './testController';
import testProvider from './testProvider';

export default angular.
    module('sportsStore', []).
    config(testProvider).
    controller('testController', testController);