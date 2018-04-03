var dimHeight = $('div#production').height();
var dimWidth = $('div#production').width();

var draw = SVG('production').size('100%', '100%');
var master = draw.group();
var svg = document.querySelector('svg');
var pt = svg.createSVGPoint();

var colors = {'red': '#B9121B', 'green': 'green', 'yellow': 'yellow', 'blue': 'blue', 'white': '#DDDDDD', 'purple': 'purple', 'brown': '#5A3A22'};
var selectedColor = colors['red'];

var rectCreate = false;
var creatingRect = null;
var lastSelectedItem = null;
var selectedItem = null;
var selectedLink = null;
var move = false;
var dx = null;
var dy = null;

var panning = false;
var xTranslate = 0;
var yTranslate = 0;
let xTranslateTmp = xTranslate;
let yTranslateTmp = yTranslate;
var clickX, clickY;

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
  }else if(selectedItem != null){
    move = true;
    dx = coord.x - selectedItem.rect.attr('x');
    dy = coord.y - selectedItem.rect.attr('y');
  }else if(!rectCreate){
    panning = true;
    clickX = coord.x;
    clickY = coord.y;
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
    selectedLink.line.opacity(0.7);
    selectedLink.line.attr({"stroke-width": STROKE_WIDTH});
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

function onDblClick(evt){
  var coord = cursorPoint(evt);
  selectedLink = getLinkAtCoordinates(coord.x, coord.y);
  if(selectedLink != null && selectedItem == null){
    selectedLink.line.opacity(1);
    selectedLink.line.attr({"stroke-width": STROKE_WIDTH * 1.5});
  }
}

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
  }else if(selectedLink != null){
	  selectedLink.line.stroke({color:colors[color]});
  }
});

function saveSvg(){
    let save = document.getElementById("production").innerHTML;
    console.log(save);
    socket.emit('saveSvg', {"svg" : save});
}

draw.on('mousedown', onMouseDown);
draw.on('mousemove', onMouseMove);
draw.on('mouseup', onMouseUp);
draw.on('click', onClick);
draw.on('dblclick', onDblClick);
draw.on('keydown', onKeydown);
