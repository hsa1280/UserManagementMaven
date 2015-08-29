angular.module("cart", [])
.factory("cart", function() {
	var cartData = [];

	return {
		addProduct: function(id, name, price) {
			var addedToExistedItem = false;
			for(var i = 0; i < cartData.length; i++) {
				if(cartData[i].id == id) {
					cartData[i].count++;
					addedToExistedItem = true;
					break;
				}
			}
			if(!addedToExistedItem) {
				cartData.push({
					count:1, id:id, price:price, name: name
				});
			}
		},

		removeProduct: function(id) {
			for(var i = 0; i < cartData.length; i++) {
				if(cartData[i].id == id) {
					cartData.splice(i,1);
					break;
				}
			}
		},

		getProducts: function() {
			return cartData;
		}
	}
})
.directive("cartSummary", function(cart) {
	return {
		restrict: "E",
		templateUrl: "components/cart/cartSummary.html",
		controller: function($scope) {
			var cartData = cart.getProducts();

			$scope.total = function() {
				var total = 0;
				for(var i = 0; i < cartData.length; i++) {
					total += (cartData[i].price * cartData[i].count);
				}

				return total;
			}

			$scope.getItemNumber = function() {
				var itemNumber = 0;

				for(var i = 0; i < cartData.length; i++) {
					itemNumber += cartData[i].count;
				}
				return itemNumber;
			}
		}
	}
});