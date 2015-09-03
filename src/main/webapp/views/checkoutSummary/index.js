/**
 * Created by shian_mac on 9/2/15.
 */
import angular from 'angular';
import CheckoutControoler from './checkoutController';
import checkoutSummaryStateProvider from './checckoutSummaryStateProvider';

export default angular.
    module('checkoutModule', []).
    config(checkoutSummaryStateProvider).
    controller('CheckoutController', CheckoutController);