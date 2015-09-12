const annotation = ['$http'];

function cart( $http ) {

	var cartData = [];
	var data = {
		products: [],
		error: {}
	};

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
		},

		getProductList: function() {
			$http.get('/UserManagementMaven/api/products')
				.success(function (response) {
					data.products = response;
					console.log();
				})
				.error(function (error) {
					data.error = error;
				})

			return data;
		}
	}
}

cart.$inject = annotation;

export default cart;
