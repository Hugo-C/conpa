var dimHeight = $('div#production').height();
var dimWidth = $('div#production').width();

var draw = SVG('production').size('100%', '100%');
var master = draw.group();
var svg = document.querySelector('svg');
var pt = svg.createSVGPoint();

var colors = {'red': '#B9121B', 'green': 'green', 'yellow': 'yellow', 'blue': 'blue', 'white': '#DDDDDD', 'purple': 'purple', 'brown': '#5A3A22'};
var selectedColor = colors['red'];

// Rectangle manipulation variables
var rectCreate = false;
var creatingRect = null;
var lastSelectedItem = null;
var selectedItem = null;
var selectedLink = null;
var move = false;
var dx = null;
var dy = null;

// Panning variables
var panning = false;
var xTranslate = 0;
var yTranslate = 0;
let xTranslateTmp = xTranslate;
let yTranslateTmp = yTranslate;
var clickX, clickY;

// Contextual menu variables
var menu = $('#linkContextMenu');
var menuState = 0;
var active = "contextMenu--active";

// resize the svg when page is resized
window.onresize = function(evt){
  var dimHeight = $('div#production').height();
  var dimWidth = $('div#production').width();
  draw.attr({'height': dimHeight, 'width': dimWidth});
}

// Get point in global SVG space
function cursorPoint(evt){
    pt.x = evt.clientX - xTranslate;
    pt.y = evt.clientY - yTranslate;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function onMouseDown(evt){
  var coord = cursorPoint(evt);
  if($('#bouton').is(":focus")) {
    rectCreate = true;
    creatingRect = new Rectangle(coord.x, coord.y, 1, 1, selectedColor, master);
  }else if($('#moveElement').hasClass('selected')){

    if(selectedItem != null){
      move = true;
      dx = coord.x - selectedItem.rect.attr('x');
      dy = coord.y - selectedItem.rect.attr('y');
    }else if(!rectCreate){
      panning = true;
      clickX = coord.x;
      clickY = coord.y;
    }
  }
}

function onMouseMove(evt){
  var coord = cursorPoint(evt);
  if(rectCreate && creatingRect != null){
    var rectX = creatingRect.rect.attr('x');
    var rectY = creatingRect.rect.attr('y');
    if(coord.x >= rectX && coord.y >= rectY){
      creatingRect.rect.attr('width', coord.x - rectX);
      creatingRect.rect.attr('height', coord.y - rectY);
    }
  }else if(move){
    selectedItem.rect.attr('x', coord.x - dx);
    selectedItem.rect.attr('y', coord.y - dy);
    if(selectedItem.text != null){
      selectedItem.text.setAttribute('x', coord.x - dx);
      selectedItem.text.setAttribute('y', coord.y - dy);
    }
    selectedItem.refreshAttachedLinks();
  }else if(panning){
    xTranslateTmp += coord.x - clickX;
    yTranslateTmp += coord.y - clickY;
    clickX = coord.x;
    clickY = coord.y;
    master.attr("transform", "translate(" + xTranslateTmp + "," + yTranslateTmp + ")");
  }
}

function onMouseUp(evt){
  if(rectCreate && creatingRect != null){
    creatingRect.addTextArea();
    rectCreate = false;
    creatingRect = null;
  }else if(move){
    move = false;
    dx = null;
    dy = null;
  }else if(panning){
    // we store the translation done by panning
    xTranslate = xTranslateTmp;
    yTranslate = yTranslateTmp;
    panning = false;
  }
}

function onClick(evt){
  var coord = cursorPoint(evt);
  var item = getElementAtCoordinates(coord.x, coord.y);

  if(item != null){
    lastSelectedItem = selectedItem;
    if(lastSelectedItem != null) lastSelectedItem.unselect(); // hide the selection border to don't have two rectangle with it
    selectedItem = item;
    selectedItem.select(); // display the selection border
  }else if(selectedItem != null){
    lastSelectedItem = selectedItem;
    selectedItem.unselect();
    selectedItem = null;
  }

  if(lastSelectedItem != null && selectedItem != null){
    selectedItem.linkRect(lastSelectedItem);
  }

  if(selectedLink != null){
    selectedLink.line.opacity(1);
    //selectedLink.line.attr({"stroke-width": STROKE_WIDTH});
    selectedLink = null;
  }
}

function getElementAtCoordinates(x, y){
  var res = null;
  for(var index in myElements){
    if(myElements[index].rect.inside(x, y)){
      res = myElements[index];
    }
  }
  return res;
}

/*
function onDblClick(evt){
  var coord = cursorPoint(evt);
  selectedLink = getLinkAtCoordinates(coord.x, coord.y);
  if(selectedLink != null){
    selectedLink.line.opacity(0.7);
    //selectedLink.line.attr({"stroke-width": STROKE_WIDTH * 2});
  }
}
*/
function getLinkAtCoordinates(x, y){
  var res = null;
  var x1, y1, x2, y2, xpt, ypt;
  for(var index in myLinks){
  	x1 = parseInt(myLinks[index].line.attr("x1"));
  	y1 = parseInt(myLinks[index].line.attr("y1"));
  	x2 = parseInt(myLinks[index].line.attr("x2"));
  	y2 = parseInt(myLinks[index].line.attr("y2"));
  	xpt = parseInt(x);
  	ypt = parseInt(y);
    if(isInside(x1, y1, x2, y2, xpt, ypt)){
      res = myLinks[index];
    }
  }
  return res;
}

/*  functions used for getLinkAtCoordinates  */

function distance(x1, y1, x2, y2){
	return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

function isInside(x1, y1, x2, y2, x, y){
	return Math.abs(distance(x1, y1, x, y) + distance(x, y, x2, y2) - distance(x1, y1, x2, y2)) < 1;
}

/*    */

// -----------------------------------------------------------------------------
// --------------------- CONTEXTUAL MENU ---------------------------------------
// -----------------------------------------------------------------------------

function clickInsideElement( e ) {
  var el = e.srcElement || e.target;

    if ($('#production')[0].contains(el)){
        return el;
    }else{
        return false;
    }
}

function toggleMenuOn() {
    if(menuState !== 1){
      menuState = 1;
      menu.addClass(active);
    }
}

function toggleMenuOff() {
    if(menuState !== 0){
      menuState = 0;
      menu.removeClass(active);
    }
}

function positionMenu(e) {

    var menuWidth = menu.get(0).offsetWidth + 4;
    var menuHeight = menu.get(0).offsetHeight + 4;

    var productionWidth = $('#production').get(0).offsetWidth;
    var productionHeight = $('#production').get(0).offsetHeight;

    var menuPositionX = e.clientX;
    var menuPositionY = e.clientY;

    menuPositionX -= (2 * menuWidth) / 3;
    menuPositionY -= menuHeight / 5;

    if((menuPositionX + menuWidth) > productionWidth){
        menu.css('left', (menuPositionX - menuWidth) + "px");
    }else{
        menu.css('left', menuPositionX + "px");
    }

    if((menuPositionY + menuHeight) > productionHeight){
        menu.css('top', (menuPositionY - menuHeight) + "px");
    }else{
        menu.css('top', menuPositionY + "px");
    }
}

window.onresize = function(e) {
    toggleMenuOff();
};

function documentClick(evt){
    var button = evt.which || evt.button;
    var inside = clickInsideElement(evt);
    if ( button === 1 ) {
        if(inside && selectedLink == null)
            toggleMenuOff();
        else if(!inside)
            toggleMenuOff();
    }
}

function openContextMenu(evt){

    var coord = cursorPoint(evt);
    selectedLink = getLinkAtCoordinates(coord.x, coord.y);

    if(clickInsideElement(evt) && selectedLink != null){
        evt.preventDefault();
        toggleMenuOn();
        positionMenu(evt);
    }else{
        toggleMenuOff();
    }
}

// -----------------------------------------------------------------------------
// ----------- CONTEXTUAL MENU BUTTONS EVENTS ----------------------------------
// -----------------------------------------------------------------------------

$('#removeLink').on('click', function(){
    if(selectedLink != null){
        selectedLink.myRemove();
        selectedLink = null;
    }
});

$('#dashLink').on('click', function(){
    if(selectedLink != null){
        selectedLink.line.stroke({dasharray: 10.10});
    }
});

$('#linearLink').on('click', function(){
    if(selectedLink != null){
        selectedLink.line.stroke({dasharray: 0});
    }
});

$('#increaseWidth').on('click', function(){
    if(selectedLink != null){
        var strokeWidth = selectedLink.line.attr('stroke-width');
        strokeWidth += 2;
        if(strokeWidth <= 20){
            selectedLink.line.stroke({width: strokeWidth});
        }
    }
});

$('#decreaseWidth').on('click', function(){
    if(selectedLink != null){
        var strokeWidth = selectedLink.line.attr('stroke-width');
        strokeWidth -= 2;
        if(strokeWidth > 0){
            selectedLink.line.stroke({width: strokeWidth});
        }
    }
});

$('#navigability').on('click', function(){
    if(selectedLink != null){
		selectedLink.addNavigability(false);
    }
});

$('#reverseNavigability').on('click', function(){
    if(selectedLink != null){
		selectedLink.addNavigability(true);
    }
});

$('#removeNavigability').on('click', function(){
    if(selectedLink != null){
		selectedLink.removeNavigability();
    }
});

$('#linkColor').on('click', function(){
    $('.colorTool').css('display', 'block');
    $('.mainTool').css('display', 'none');
});

$('button.colorTool').on('click', function(){
    if(selectedLink != null){
        selectedLink.line.stroke({color: colors[$(this).val()]});
    }
    $('.colorTool').css('display', 'none');
    $('.mainTool').css('display', 'block');
});

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

function onKeydown(event){
  if(event.keyCode === 46){
	  if(selectedItem !== null){
  		selectedItem.myRemove();
  		selectedItem = null;
	  }else if(selectedLink !== null){
  		selectedLink.myRemove();
  		selectedLink = null;
	  }
  }
}

$("#colorMenu button").on("click", function(){
  var color = $(this).val();
  selectedColor = colors[color];
  if(selectedItem != null){
    selectedItem.rect.attr('fill', colors[color]);
  }
});

/**
 * Extract the value of all textArea inside the parent element and put it inside the textArea tags
 * @param parent {HTMLElement} : the parent of textareas to explicit
 */
function explicitTextAreaValues(parent){
    for(let elt of parent.childNodes){
        if (elt.nodeName === "TEXTAREA"){
            // we remove precedent textNode
            for(let old_text of elt.childNodes){
                elt.removeChild(old_text);
            }
            // explicitly add the text inside itself
            let text = document.createTextNode(elt.value);
            elt.appendChild(text);
        } else {
            explicitTextAreaValues(elt);
        }
    }
}

/**
 * Return the svg of the player's production including texts
 * @return {string}
 */
function getInlineSvg(){
    const regexForeignObject = /<foreignObject([\s\S]*?)<\/foreignObject>/mgi;
    const regexTextArea = /<textarea[^>]+?>([\s\S]*?)<\/textarea>/mgi;
    const regexText = /<text x="([0-9]+)[.]?[0-9]*" y="([0-9]+)[.]?[0-9]*"([\s\S]*?)<\/text>/mgi;

    function handleReplaceString(match, p1) {
        let res = p1.replace(regexTextArea, "$1");
        return "<text" + res + "</text>";
    }

    function moveText(match, p1, p2, p3){
        let x = parseInt(p1, 10) + 5;
        let y= parseInt(p2, 10) + 15;
        return '<text x="' + x + '" y="' + y + '"' + p3 + '</text>';
    }

    let mySvg = $('#production > svg').get(0);
    explicitTextAreaValues(mySvg);
    let svgSave = mySvg.outerHTML;

    // save all textarea values by replacing foreignObject by native text svg
    svgSave = svgSave.replace(regexForeignObject, handleReplaceString);
    svgSave = svgSave.replace(regexText, moveText);
    return svgSave;
}

draw.on('mousedown', onMouseDown);
draw.on('mousemove', onMouseMove);
draw.on('mouseup', onMouseUp);
draw.on('click', onClick);
//draw.on('dblclick', onDblClick);
draw.on('keydown', onKeydown);
document.addEventListener('contextmenu', openContextMenu);
document.addEventListener('click', documentClick);
