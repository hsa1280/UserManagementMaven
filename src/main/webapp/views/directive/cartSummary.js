/**
 * Created by shian_mac on 9/12/15.
 */
const annotation = ['cart', '$state'];

function cartSummary( cart, $state ) {
	return {
		restrict: 'E',
		templateUrl: 'directive/cartSummary.html',
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

			$scope.goToCheckout = function() {
				$state.go('checkoutSummary');
			}
		}
	}
}

cartSummary.$inject = annotation;

export default cartSummary;