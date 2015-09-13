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
        this.hightLightClass = 'btn-primary';
        this.getProducts();
    }

    getProducts() {
        this.$http.get('/UserManagementMaven/api/products')
            .success( response => {
                this.data.products = response;
            })
            .error( error => {
                this.data.error = error;
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
        return this.selectedCategory == item ? this.hightLightClass : null;
    }

    getPageClass(page) {
        return this.selectedPage == page ? this.hightLightClass : null;
    }

    addProduct(item) {
        this.cart.addProduct(item.id, item.name, item.price);
    }


}

ProductListController.$inject = annotation;

export default ProductListController;