const annotation = ['cart', '$http'];

class ProductListController {

    constructor(cart, $http) {
        this.selectedPage = 1;
        this.pageSize = 3;
        //this.data = cart.getProductList();
        this.data = {};
        this.$http = $http;
        this.cart = cart;
        this.selectedCategory = null;
        this.getProducts();
    }

    getProducts() {
        self = this;
        this.$http.get('/UserManagementMaven/api/products')
            .success(function (response) {
                self.data.products = response;
            })
            .error(function (error) {
                self.data.error = error;
            })
    }

    selectItem(item) {
        this.selectedCategory = item;
        this.selectedPage = 1;
    }

    selectPage(newPage) {
        this.selectedPage = newPage;
    }

    productsFilter(item) {
        return this.selectedCategory == null || this.selectedCategory == item.category;
    }

    getCategoryClass(item) {
        return this.selectedPage == item ? 'btn-primary' : null;
    }

    getPageClass(page) {
        return this.selectedPage == page ? 'btn-primary' : null;
    }

    addProduct(item) {
        this.cart.addProduct(item.id, item.name, item.price);
    }


}

ProductListController.$inject = annotation;

export default ProductListController;