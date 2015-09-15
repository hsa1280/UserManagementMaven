/**
 * Created by shian_mac on 9/10/15.
 */
const annotation = [ '$filter' ];

function range( $filter ) {
    return function( data, page, size ) {
        if( angular.isArray(data) && angular.isNumber(page) && angular.isNumber(size) ) {
            var start_index = ( page - 1 ) * size;
            if( data.length < start_index ) {
                return [];
            }
            else {
                return $filter("limitTo")( data.slice( start_index ), size);
            }
        }
        else {
            return data;
        }
    }
}

range.$inject = annotation;

export default range;