
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
