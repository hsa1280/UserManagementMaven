/**
 * Created by shian_mac on 9/10/15.
 */
const annotation = [ '$filter' ];

function unique() {
    return function( data, propertyName ) {
        var tempArr = [];
        var uniqueCategory = [];
        if (data != null) {
            for( var i = 0; i < data.length; i++) {
                if( !tempArr[data[i][propertyName]] ) {
                    tempArr[data[i][propertyName]] = true;
                    uniqueCategory.push(data[i][propertyName]);
                }
            }
        }

        return uniqueCategory;
    }
}

unique.$inject = annotation;

export default unique;