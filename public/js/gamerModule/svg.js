var clicking = false; //Boolean to test if mousemove to size a rect
var prevRecSelect = null;
var rectSelect;  // an Element which has an svg rect
var rectCreate;  // the latest Element added
var x, y; //Coordinates of mouse in svg
var clickX, clickY;
var deplace = false;

// Find your root SVG element
var svg = document.querySelector('#production');

// Create an SVGPoint for future math
var pt = svg.createSVGPoint();

// Get point in global SVG space
function cursorPoint(evt){
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener('mousemove',function(evt){
    let loc = cursorPoint(evt);
    x = loc.x;
    y = loc.y;
},false);

//------------------------------------------------------------
//Block select text (Bidouille provisoire)
/*function noselection(target) {
    if (typeof target.onselectstart !== "undefined") {
        target.onselectstart = function () {
            return false;
        }
    }
    else if (typeof target.style.MozUserSelect !== "undefined") target.style.MozUserSelect = "none";
    else {
        target.onmousedown = function () {
            return false;
        }
    }
}
noselection(document.body);*/
//------------------------------------------------------------

//Select a rect with mouse
function selectRect(){
    if (rectSelect != null) {
        prevRecSelect = rectSelect;
        rectSelect = null;
    }

    let e = Element.getElementIn(x, y);
    if (e != null) {
        rectSelect = e;
        rectSelect.select = true;
    }

    if (prevRecSelect != null && rectSelect != null){  // link both selected elements
        Element.linkRect(rectSelect, prevRecSelect);
        rectSelect.select = false;
        rectSelect = null;

    }
    if (prevRecSelect != null) {
        prevRecSelect.select = false;
        prevRecSelect = null;
    }
}

let bodyJQ = $('body');
bodyJQ.on('click', function(){
    selectRect();
});

let svgJQ = $('svg');
svgJQ.on('mousedown', function(){
    //Create a rect
    if($('#bouton').is(":focus")) {
        rectCreate = new Element(x, y);
        clicking = true;
    }
    //Move a rect
    else if (rectSelect != null && this.style.cursor === 'move'){
        clickX = x;
        clickY = y;
        deplace = true;
    }
});

bodyJQ.on('mouseup', function(){
    if (rectCreate != null && (rectCreate.height <= 30 || rectCreate.width <= 70)){
        rectCreate.myRemove();
    }
    deplace = false;
    clicking = false;
    rectCreate = null;
});

svgJQ.on('mousemove', function(){
    if(rectSelect == null) this.style.cursor = 'default';
    //Size a rect
    if (clicking) {
        if (x >= rectCreate.x && y >= rectCreate.y){
            rectCreate.width  = x - rectCreate.x;
            rectCreate.height = y - rectCreate.y;
        }
        //if (rectCreate.getAttribute("height") > 30 && rectCreate.getAttribute("width") > 70 && textCreate.getAttribute("text") == null) textCreate.textContent = "Texte...";
        //else textCreate.textContent = null;
    }
    if (rectSelect != null){
        var rx = parseInt(rectSelect.x);
        var ry = parseInt(rectSelect.y);
        var rw = parseInt(rectSelect.width);
        var rh = parseInt(rectSelect.height);
        if ((x > rx-3 && x < rx+3 && y > ry-3 && y < rh+ry+3)
            || (x > rw+rx-3 && x < rx+rw+3 && y > ry-3 && y < rh+ry+3)
            || (y > ry-3 && y < ry+3 && x > rx-3 && x < rx+rw+3)
            || (y > ry+rh-3 && y < ry+rh+3 && x > rx-3 && x < rx+rw+3)){
            this.style.cursor = 'move';
        }
        else this.style.cursor = 'default';
    }
    //Move a rect
    if(deplace){
        let stepX = parseInt(rectSelect.x) + x - clickX;
        let stepY = parseInt(rectSelect.y) + y - clickY;
        //var stepTX = parseInt(textSelect.getAttribute("x")) + x - clickX;
        //var stepTY = parseInt(textSelect.getAttribute("y")) + y - clickY;
        //if (stepX < 10) rectSelect.setAttribute("x", 10); textSelect.setAttribute("x", 20);
        //if (stepY < 10) rectSelect.setAttribute("y", 10); textSelect.setAttribute("y", 35);
        if (stepX >= 10) {
            rectSelect.x = stepX;
            //textSelect.setAttribute("x", stepTX);
        }
        if (stepY >= 10){
            rectSelect.y = stepY;
            //textSelect.setAttribute("y", stepTY);
        }
        clickX = x;
        clickY = y;
        if (x < 10 || y < 10) deplace = false;
    }
});

document.addEventListener('paste', function (evt) {
    pasteAsElement(x, y, evt.clipboardData.getData('text/plain'));
});

bodyJQ.keydown(function(event){
    if(event.keyCode === 46 && rectSelect !== null){
        rectSelect.myRemove();
        rectSelect = null;
    }
});
