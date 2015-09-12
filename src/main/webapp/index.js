/**
 * Created by shian_mac on 9/3/15.
 */
import angular from 'angular';
import views from './views';
import components from './components';
import filters from './filters';

export default angular.
    module( 'sportsStore', [ views.name, components.name, filters.name] );