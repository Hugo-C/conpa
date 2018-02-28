var clicking = false; //Boolean to test if mousemove to size a rect
var select = false; //Boolean to test if a rect is select
var rectSelect, textSelect;
var rectCreate, textCreate;
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
    var loc = cursorPoint(evt);
    x = loc.x;
    y = loc.y;
},false);

//------------------------------------------------------------
//Block select text (Bidouille provisoire)
function noselection(target) {
    if (typeof target.onselectstart != "undefined") {
        target.onselectstart = function () {
            return false;
        }
    }
    else if (typeof target.style.MozUserSelect != "undefined") target.style.MozUserSelect = "none";
    else {
        target.onmousedown = function () {
            return false;
        }
    }
    //target.style.cursor = "default"
}
noselection(document.body);
//------------------------------------------------------------

//Select a rect with mouse
function selectRect(){
    rectSelect = null;
    textSelect = null;
    select = false;
    var arrayRects = document.body.getElementsByTagName("rect");
    var arrayTexts = document.body.getElementsByTagName("text");

    for(var i=0; i < arrayRects.length; i++) {

        arrayRects[i].style.strokeDasharray = '0';
        //Select rect
        if( parseInt(arrayRects[i].getAttribute("x")) + parseInt(arrayRects[i].getAttribute("width")) > x
            && arrayRects[i].getAttribute("x") < x
            && parseInt(arrayRects[i].getAttribute("y")) + parseInt(arrayRects[i].getAttribute("height")) > y
            && arrayRects[i].getAttribute("y") < y){

            rectSelect = arrayRects[i];

            //Select text
            for(var j=0; j < arrayTexts.length; j++) {
                if(arrayTexts[j].getAttribute("x")-10 < x
                    && x < parseInt(arrayTexts[j].getAttribute("x")) + parseInt(arrayTexts[j].getAttribute("width")) + 10
                    && arrayTexts[j].getAttribute("y")-25 < y
                    && y < parseInt(arrayTexts[j].getAttribute("y")) + parseInt(arrayTexts[j].getAttribute("height")) + 25){

                    textSelect = arrayTexts[j];
                }
            }
            console.log(rectSelect.getAttribute("x"));

            //Test if a text is select by the mouse
            /*function getSelectedText(){
                if (window.getSelection){
                    return window.getSelection().toString();
                }
                else if (document.getSelection){
                    return document.getSelection();
                }
                else if (document.selection){
                    return document.selection.createRange().text;
                }
            }*/

            if (rectSelect != null && textSelect != null) {
                rectSelect.style.strokeDasharray = '10';
                select = true;
            }
        }
    }
}

$('body').on('click', function(){
    selectRect();
});

$('svg').on('mousedown', function(){
    //Create a rect
    console.log("before rect");
    if($('#bouton').is(":focus")) {
        console.log("focused");
        var c = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        c.style.fill = 'red';
        c.style.stroke = 'black';
        c.style.strokeWidth = '2';
        c.setAttribute("x", x);
        c.setAttribute("y", y);
        document.querySelector('#production').append(c);
        rectCreate = c;

        var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", x + 10);
        t.setAttribute("y", y + 25);
        t.style.fill = 'black';
        document.querySelector('#production').append(t);
        textCreate = t;

        clicking = true;
    }
    //Move a rect
    else if (select && this.style.cursor === 'move'){
        clickX = x;
        clickY = y;
        deplace = true;
    }
});

$('svg').on('mouseup', function(){
    if (rectCreate != null && textCreate != null && (rectCreate.getAttribute("height") <= 30 || rectCreate.getAttribute("width") <= 70)){
        rectCreate.remove();
        textCreate.remove();
    }
    deplace = false;
    clicking = false;
    rectCreate = null;
    textCreate = null;
    //$('#bouton').css('background-image', 'url("/img/gamerModule/text.png")');
});

$('svg').on('mousemove', function(){
    if(!select) this.style.cursor = 'default';
    //Size a rect
    if (clicking) {
        if (x >= rectCreate.getAttribute("x") && y >= rectCreate.getAttribute("y")){
            rectCreate.setAttribute("height", y - rectCreate.getAttribute("y"));
            rectCreate.setAttribute("width", x - rectCreate.getAttribute("x"));
            textCreate.setAttribute("height", y - 25 - textCreate.getAttribute("y"));
            textCreate.setAttribute("width", x - 10 - textCreate.getAttribute("x"));
        }
        if (rectCreate.getAttribute("height") > 30 && rectCreate.getAttribute("width") > 70 && textCreate.getAttribute("text") == null) textCreate.textContent = "Texte...";
        else textCreate.textContent = null;
    }
    if (select){
        var rx = parseInt(rectSelect.getAttribute("x"));
        var ry = parseInt(rectSelect.getAttribute("y"));
        var rw = parseInt(rectSelect.getAttribute("width"));
        var rh = parseInt(rectSelect.getAttribute("height"));
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
        var stepX = parseInt(rectSelect.getAttribute("x")) + x - clickX;
        var stepY = parseInt(rectSelect.getAttribute("y")) + y - clickY;
        var stepTX = parseInt(textSelect.getAttribute("x")) + x - clickX;
        var stepTY = parseInt(textSelect.getAttribute("y")) + y - clickY;
        if (stepX > 0) {
            rectSelect.setAttribute("x", stepX);
            textSelect.setAttribute("x", stepTX);
        }
        if (stepY > 0){
            rectSelect.setAttribute("y", stepY);
            textSelect.setAttribute("y", stepTY);
        }
        clickX = x;
        clickY = y;
    }
});
