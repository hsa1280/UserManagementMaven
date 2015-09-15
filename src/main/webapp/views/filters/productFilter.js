/**
 * Created by shian_mac on 9/14/15.
 */

function productFilter() {

    return function(data, selectedCategory) {
        let filteredData = [];
        if (Array.isArray(data)) {
            data.forEach(function (item) {
                if (item.category == selectedCategory || selectedCategory == null) {
                    filteredData.push(item);
                }
            });
        }

        return filteredData;
    }
}

export default productFilter;