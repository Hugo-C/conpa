document.addEventListener('paste', function (evt) {
    pasteAsElement(x, y, evt.clipboardData.getData('text/plain'));
});

bodyJQ.keydown(function(event){
    if(event.keyCode === 46 && rectSelect !== null){
        rectSelect.myRemove();
        rectSelect = null;
    }
});

/**
 * Paste a string as a new Element
 * @param x {String} : x location of the new element
 * @param y {String} : y location of the new element
 * @param s {String} : string to be pasted as a new element
 * @return {Element} : element created in the process
 */
function pasteAsElement(x, y, s) {
    let pasteElement = new Element(x, y);
    pasteElement.textContent = s;
    pasteElement.width = s.length * 10 + 10;
    pasteElement.height = 50;
    return pasteElement;
}

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
