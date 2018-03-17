const MOVE_SELECT_MARGIN = 10;

var x, y; //Coordinates of mouse in svg
var xTranslate = 0;
var yTranslate = 0;
let xTranslateTmp = xTranslate;
let yTranslateTmp = yTranslate;
var clickX, clickY;  // save previous mouse location

var deplace = false;
var panning = false;
var creatingRect = false; //Boolean to test if mousemove to size a rect

var prevRecSelect = null;
var rectSelect;  // an Element which has an svg rect
var rectCreate;  // the latest Element added

// Find your root SVG element
var svg = document.querySelector('#production');
var g = document.querySelector('#svgElements');  // g is the parent of all element in this svg

// Create an SVGPoint for future math
var pt = svg.createSVGPoint();

// Get point in global SVG space
function cursorPoint(evt){
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener('mousemove',function(evt){
    let loc = cursorPoint(evt);
    x = loc.x - xTranslate;
    y = loc.y - yTranslate;
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
        Element.linkRect(rectSelect, prevRecSelect, g);
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
	//Color a rect
	var colorButton = $('selectedColor');
	if(colorButton.is(":focus" && prevRecSelect != null)){
		prevRecSelect.changeColor(colorButton.getAttribute('color'));	// To update!
	}
	else if (!panning){
		selectRect();
	}
});

let svgJQ = $('svg');
svgJQ.on('mousedown', function(){
    //Create a rect
    if($('#bouton').is(":focus")) {
        rectCreate = new Element(x, y, g);
        creatingRect = true;
    }
    //Move a rect
    else if (rectSelect != null && this.style.cursor === 'move'){
        clickX = x;
        clickY = y;
        deplace = true;
    } else if (!creatingRect) {  // we move the svg
        panning = true;
        clickX = x;
        clickY = y;
    }
});

bodyJQ.on('mouseup', function(){
    if(panning){
        // we store the translation done by panning
        xTranslate = xTranslateTmp;
        yTranslate = yTranslateTmp;
        panning = false;
    }
    if (rectCreate != null && (rectCreate.height <= 30 || rectCreate.width <= 70)){
        rectCreate.myRemove();
    }
    deplace = false;
    creatingRect = false;
    rectCreate = null;
});

svgJQ.on('mousemove', function(){
    if(rectSelect == null) this.style.cursor = 'default';
    //Size a rect
    if (creatingRect) {
        if (x >= rectCreate.x && y >= rectCreate.y){
            rectCreate.width  = x - rectCreate.x;
            rectCreate.height = y - rectCreate.y;
        }
        //if (rectCreate.getAttribute("height") > 30 && rectCreate.getAttribute("width") > 70 && textCreate.getAttribute("text") == null) textCreate.textContent = "Texte...";
        //else textCreate.textContent = null;
    } else if (panning) {
            xTranslateTmp += x - clickX;
            yTranslateTmp += y - clickY;
            clickX = x;
            clickY = y;
            g.setAttribute("transform", "translate(" + xTranslateTmp + "," + yTranslateTmp + ")");
        this.style.cursor = 'grab';
    } else {
        this.style.cursor = 'default';
    }
    if (rectSelect != null){
        var rx = parseInt(rectSelect.x);
        var ry = parseInt(rectSelect.y);
        var rw = parseInt(rectSelect.width);
        var rh = parseInt(rectSelect.height);
        let m = MOVE_SELECT_MARGIN;  // margin
        if ((x > rx-m && x < rx+m && y > ry-m && y < rh+ry+m)
            || (x > rw+rx-m && x < rx+rw+m && y > ry-m && y < rh+ry+m)
            || (y > ry-m && y < ry+m && x > rx-m && x < rx+rw+m)
            || (y > ry+rh-m && y < ry+rh+m && x > rx-m && x < rx+rw+m)){
            this.style.cursor = 'move';
        }
        else this.style.cursor = 'default';
    }
    //Move a rect
    if(deplace){
        rectSelect.x += x - clickX;
        rectSelect.y += y - clickY;
        clickX = x;
        clickY = y;
    }
});

document.addEventListener('paste', function (evt) {
    pasteAsElement(x, y, evt.clipboardData.getData('text/plain'), g);
});

bodyJQ.keydown(function(event){
    if(event.keyCode === 46 && rectSelect !== null){
        rectSelect.myRemove();
        rectSelect = null;
    }
});
