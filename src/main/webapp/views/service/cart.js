const annotation = ['$http'];

function cart( $http ) {

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
		},

		getProductList: function() {
			return $http.get('/UserManagementMaven/api/products').then(response => response.data);
		}
	}
}

cart.$inject = annotation;

export default cart;
