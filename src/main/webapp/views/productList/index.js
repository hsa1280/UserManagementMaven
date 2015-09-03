/**
 * Created by shian_mac on 9/2/15.
 */
import anglar from 'angular';
import ProductListController from './productListStateProvider';
import productListStateProvider from './productListStateProvider';

export default angular.
    module('productListModule', []).
    config(productListStateProvider).
    controller('ProductListController', ProductListController);