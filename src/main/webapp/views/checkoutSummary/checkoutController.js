//require('angular/angular');
//require('angular-resource/angular-resource');
//require('angular-route/angular-route');

//angular.module("sportsStore")
//.controller("checkoutCtrl", function($scope, cart) {
//	$scope.cartData = cart.getProducts();
//
//	$scope.getSubtotal = function(product) {
//		var total = 0;
//		total += product.price * product.count;
//		return total;
//	}
//
//	$scope.getTotal = function() {
//		var total = 0;
//		for( var i = 0; i < $scope.cartData.length; i++) {
//			total += $scope.cartData[i].price * $scope.cartData[i].count;
//		}
//
//		return total;
//	}
//
//	$scope.removeProduct = function(product) {
//		cart.removeProduct(product.id);
//	}
//})

const annotation = ['cart', '$state'];

class CheckoutController {

	constructor(cart, $state) {
		this.cart = cart;
		this.$state = $state;
		this.cartData = cart.getProducts();
	}

	getTotal() {
		let total = 0;
		for( var i = 0; i < this.cartData.length; i++) {
			total += this.cartData[i].price * this.cartData[i].count;
		}

		return total;
	}

	getSubtotal(product) {
		let total = 0;
		total += product.price * product.count;

		return total;
	}

	removeProduct(product) {
		this.cart.removeProduct(product.id);
	}

	continueToShopping() {
		this.$state.go('productList');
	}

	goToPlaceOrder() {
		this.$state.go('placeOrder');
	}
}

CheckoutController.$inject = annotation;

export default CheckoutController;
