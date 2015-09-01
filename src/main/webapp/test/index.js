/**
 * Created by shian_mac on 8/30/15.
 */

import angular from 'angular';
import 'angular-ui-router';
import testProvider from './testProvider';
import test1 from './test1';
import test2 from './test2';

export default angular.
    module('sportsStore', ['ui.router', test1.name, test2.name]).
    config(testProvider);