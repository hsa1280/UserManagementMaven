//require('angular/angular');
//require('angular-resource/angular-resource');
//require('angular-route/angular-route');

angular.module("sportsStore")
.constant('hightLightClass', "btn-primary")
.constant("productListPageCount", 3)
.controller('productListCtrl', function( $scope, $filter, hightLightClass, productListPageCount, cart){
	
	var selectedCategory = null;

    $scope.selectedPage = 1;
    $scope.pageSize = productListPageCount;

	$scope.selectItem = function( item ) {
        selectedCategory = item;
        $scope.selectedPage = 1;
	}


    $scope.selectPage = function( newPage ) {
        $scope.selectedPage = newPage;
    }

    $scope.productsFilter = function( item ) {
        return selectedCategory == null || selectedCategory == item.category;
    } 

    $scope.getCategoryClass = function( item ) {
    	return selectedCategory == item ? hightLightClass : null;
	}

	$scope.getPageClass = function( page ) {
    	return $scope.selectedPage == page? hightLightClass : null;
	}

    $scope.addProduct = function(item) {
        cart.addProduct(item.id, item.name, item.price);
    }
})