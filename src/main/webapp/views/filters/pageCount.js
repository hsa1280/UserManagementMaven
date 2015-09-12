/**
 * Created by shian_mac on 9/10/15.
 */
const annotation = [];

function pageCount() {
    return function( data, size ) {
        if( angular.isArray(data) ) {
            var result = [];
            for( var i = 0; i < Math.ceil(data.length / size); i++ ) {
                result.push(i);
            }
            return result;
        }
        else {
            return data;
        }
    }
}

pageCount.$inject = annotation;

export default pageCount;