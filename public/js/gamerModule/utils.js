/**
 * Remove the element e from the array
 * @param array {array}
 * @param e {*} : the element to remove
 * @return {array} the array without the first occurrence of e
 */
function removeFromArray(array, e){
    let index = array.indexOf(e);
    if (index > -1) {
        array = array.splice(index, 1);
    }
    return array;
}

/**
 * Handle http request
 */
const HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        let anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() {
            if (anHttpRequest.readyState === 4 && anHttpRequest.status === 200)
                aCallback(anHttpRequest.responseText);
        };

        anHttpRequest.open( "GET", aUrl, true );
        anHttpRequest.send( null );
    }
};

function getScrollBarWidth () {
    let $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
}
