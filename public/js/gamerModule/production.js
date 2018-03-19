var dimHeight = $('div#production').height();
var dimWidth = $('div#production').width();

var draw = SVG('production').size('200%', '200%');
var svg = document.querySelector('svg');
var pt = svg.createSVGPoint();

var colors = {'red': '#B9121B', 'green': 'green', 'yellow': 'yellow', 'blue': 'blue', 'white': 'white', 'purple': 'purple', 'brown': 'brown'};
var selectedColor = colors['red'];

var rectCreate = false;
var creatingRect = null;
var lastSelectedItem = null;
var selectedItem = null;
var move = false;
var dx = null;
var dy = null;

// Get point in global SVG space
function cursorPoint(evt){
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function onMouseDown(evt){
  var coord = cursorPoint(evt);
  if($('#bouton').is(":focus")) {
    rectCreate = true;
    creatingRect = new Rectangle(coord.x, coord.y, 1, 1, selectedColor, draw);
  }else if(selectedItem != null){
    move = true;
    dx = coord.x - selectedItem.rect.attr('x');
    dy = coord.y - selectedItem.rect.attr('y');
    console.log("start moving");
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
  }
}

function onClick(evt){

  var coord = cursorPoint(evt);
  var item = getElementAtCoordinates(coord.x, coord.y);

  if(item != null){
    lastSelectedItem = selectedItem;
    selectedItem = item;
  }else{
    lastSelectedItem = selectedItem;
    selectedItem = null;
  }

  if(lastSelectedItem != null && selectedItem != null){
    selectedItem.linkRect(lastSelectedItem);
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

function onKeydown(event){
  if(event.keyCode === 46 && selectedItem !== null){
    selectedItem.myRemove();
    selectedItem = null;
  }
}

$("#colorMenu button").on("click", function(){
  var color = $(this).val();
  selectedColor = colors[color];
  if(selectedItem != null){
    selectedItem.rect.attr('fill', colors[color]);
  }
});

draw.on('mousedown', onMouseDown);
draw.on('mousemove', onMouseMove);
draw.on('mouseup', onMouseUp);
draw.on('click', onClick);
draw.on('keydown', onKeydown);
