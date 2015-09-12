/**
 * Created by shian_mac on 9/10/15.
 */
import angular from 'angular';
import pageCount from './pageCount';
import range from './range';
import unique from './unique';

export default angular.
    module( 'customerFilters', [] ).
        filter( 'pageCount', pageCount ).
        filter( 'range', range ).
        filter( 'unique', unique );