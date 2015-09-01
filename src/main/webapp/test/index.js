/**
 * Created by shian_mac on 8/30/15.
 */

import angular from 'angular';
import 'angular-ui-router';
import TestController from './testController';
import testProvider from './testProvider';

export default angular.
    module('sportsStore', ['ui.router']).
    config(testProvider).
    controller('TestController', TestController);