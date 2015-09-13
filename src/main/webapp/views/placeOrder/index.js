/**
 * Created by shian_mac on 9/13/15.
 */
import angular from 'angular';
import PlaceOrderController from './placeOrderController';
import placeOrderStateProvider from './placeOrderStateProvider';

export default angular.
    module('placeOrderModule', []).
    config(placeOrderStateProvider).
    controller('PlaceOrderController', PlaceOrderController);