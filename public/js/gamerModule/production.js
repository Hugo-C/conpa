var dimHeight = $('div#production').height();
var dimWidth = $('div#production').width();

var draw = SVG('production').size('100%', '100%').panZoom({
    doPanning: false,
    zoomFactor: 0.5,
    zoomMin: 0.25,
    zoomMax: 4,
});

var master = draw.group();
var svg = document.querySelector('svg');
var pt = svg.createSVGPoint();

var colors = {'red': '#ED1723', 'green': '#0FB32D', 'yellow': '#FFEE24', 'blue': '#3344FF', 'white': '#D5D5D5', 'purple': '#A531FF', 'brown': '#8C5B35'};
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

// Contextual menu variables
var menu = $('#linkContextMenu');
var menuState = 0;
var active = "contextMenu--active";

// resize the svg when page is resized
window.onresize = function(evt){
    var dimHeight = $('div#production').height();
    var dimWidth = $('div#production').width();
    draw.attr({'height': dimHeight, 'width': dimWidth});
};

// Get point in global SVG space
function cursorPoint(evt){
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function onMouseDown(evt){
    var coord = cursorPoint(evt);
    if($('#bouton').is(":focus")) {
        rectCreate = true;
        doPanning = false;
        let panningButton = $("#moveElement");  // to visualy indicate the panning state we change the button
        panningButton.removeClass("selected");  // TODO make it consistent with gameManager.js
        panningButton.css('background-image', 'url("/img/gamerModule/move.png")');
        creatingRect = new Rectangle(coord.x, coord.y, 1, 1, selectedColor, master);
    }else if($('#moveElement').hasClass('selected')){
        if(selectedItem != null){
            move = true;
            doPanning = false;  // temporally disable the panning until the element is moved
            dx = coord.x - selectedItem.rect.attr('x');
            dy = coord.y - selectedItem.rect.attr('y');
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
    }
}

function onMouseUp(evt){
    if(rectCreate && creatingRect != null){
        creatingRect.addTextArea();
        rectCreate = false;
        creatingRect = null;
    }else if(move){
        move = false;
        doPanning = true;  // the panning is reestablished
        dx = null;
        dy = null;
    }
}

function onClick(evt){
    var coord = cursorPoint(evt);
    var item = getElementAtCoordinates(coord.x, coord.y);

    if(item != null){
        lastSelectedItem = selectedItem;
        if (lastSelectedItem != null && lastSelectedItem !== item){
            lastSelectedItem.unselect(); // hide the selection border to don't have two rectangle with it
        }
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
        selectedLink.setDasharray(10.10);
    }
});

$('#linearLink').on('click', function(){
    if(selectedLink != null){
        selectedLink.setDasharray(0);
    }
});

$('#increaseWidth').on('click', function(){
    if(selectedLink != null){
        var strokeWidth = selectedLink.getWidth();
        strokeWidth += 2;
        if(strokeWidth <= 20){
            selectedLink.setWidth(strokeWidth);
        }
    }
});

$('#decreaseWidth').on('click', function(){
    if(selectedLink != null){
        var strokeWidth = selectedLink.getWidth();
        strokeWidth -= 2;
        if(strokeWidth > 0){
            selectedLink.setWidth(strokeWidth);
        }
    }
});

$('#navigability').on('click', function(){
    if(selectedLink != null){
        selectedLink.addNavigability();
    }
});

$('#reverseNavigability').on('click', function(){
    if(selectedLink != null && selectedLink.navigability != null){
        selectedLink.reverseNavigability();
		selectedLink.addNavigability();
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
        selectedLink.setColor(colors[$(this).val()]);
    }
    $('.colorTool').css('display', 'none');
    $('.mainTool').css('display', 'block');
});

// -----------------------------------------------------------------------------
// ------------------------- SVG LISTENERS -------------------------------------
// -----------------------------------------------------------------------------

draw.on('mousedown', onMouseDown);
draw.on('mousemove', onMouseMove);
draw.on('mouseup', onMouseUp);
draw.on('click', onClick);
draw.on('keydown', onKeydown);
document.addEventListener('contextmenu', openContextMenu);
document.addEventListener('click', documentClick);

// -----------------------------------------------------------------------------
// ----------------- Convert SVG to a string -----------------------------------
// -----------------------------------------------------------------------------
// We convert the svg to a string to display it as an image (later)
// To display it as an image, we need to replace HTML and foreignObject tags
// by SVG tags
// -----------------------------------------------------------------------------

/**
 * Extract the value of all textArea inside the parent element and put it inside the textArea tags
 * @param {HTMLElement} parent : the parent of textareas to explicit
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

String.prototype.visualLength = function(){
    var ruler = $("#ruler")[0];
    ruler.innerHTML = this;
    return ruler.offsetWidth;
};

String.prototype.visualFontSize = function(){
    var ruler = $("#ruler")[0];
    ruler.innerHTML = this;
    return ruler.offsetHeight;
};

function cutTextIntoLines(text, textWidth){
    var words = text.split(/(\W+|\n)/);
    var lines = [];
    var currentLine = [];
    var currentLineWidth = 0;

    for(var index in words){
        var word = words[index];

        if((currentLineWidth + word.visualLength()) < textWidth){
            if(word.includes('\n')){
                var wordCut = word.split('\n', 2);
                currentLine.push(wordCut[0]);
                lines.push(currentLine);
                currentLine = [wordCut[1]];
                currentLineWidth = wordCut[1].visualLength();
            }else{
                currentLine.push(word);
                currentLineWidth += word.visualLength();
            }
        }else{
            lines.push(currentLine);
            if(word.includes('\n')){
                var wordCut = word.split('\n', 2);
                currentLine = [wordCut[0]];
                lines.push(currentLine);
                currentLine = [wordCut[1]];
                currentLineWidth = wordCut[1].visualLength();
            }else{
                currentLine = [word];
                currentLineWidth = word.visualLength();
            }
        }
    }

    if(currentLine.length > 0){
        lines.push(currentLine);
    }

    return lines;
}

function extractParam(param, paramsList){
    var result = paramsList.match(param + '=\"([-+]?[0-9.]+)\"'); // <-- repère
    return parseInt(result[1]);
}

function textareaToSVGText(params, text){
    var x = extractParam('x', params);
    var y = extractParam('y', params);
    var height = extractParam('height', params);
    var width = extractParam('width', params);
    var lines = cutTextIntoLines(text, width - 10);
    var lineHeight = 'd'.visualFontSize();
    var result = "";
    var index = 0;

    while(index < lines.length && height > 0){
        result += '<text x="' + x + '" y="' + y + '">';
        for(var i = 0; i < lines[index].length; i++){
            result += lines[index][i];
        }
        result += "</text>";
        height -= lineHeight;
        y += lineHeight;
        index++;
    }
    return result;
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
        let tagContent = res.split('>', 2);
        return textareaToSVGText(tagContent[0], tagContent[1]);
    }

    function moveText(match, p1, p2, p3){
        let x = parseInt(p1, 10) + 5;
        let y = parseInt(p2, 10) + 15;
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

// -----------------------------------------------------------------------------
// ----- Retrieve data which are require to make a usable copy of the SVG ------
// -----------------------------------------------------------------------------
// These two functions stay here for the moment because they can change again !
// (Maybe replace them by similar functions that work with svg ids)
// If we don't find a better solution : TODO
// ==> create functions inside Rectange and Link classes to convert
//     a class object to a js object
// -----------------------------------------------------------------------------

function saveProduction(){
    var production = {'rectangles' : [], 'links': []};
    for(var index in myElements){
        var data = {};
        data['id'] = myElements[index].rect.attr('id');
        data['x'] = myElements[index].rect.attr('x');
        data['y'] = myElements[index].rect.attr('y');
        data['width'] = myElements[index].rect.attr('width');
        data['height'] = myElements[index].rect.attr('height');
        data['fill'] = myElements[index].rect.attr('fill');
        data['text'] = $(myElements[index].text).children().val();
        production['rectangles'].push(data);
    }

    for(var index in myLinks){
        var data = {};
        data['idRect1'] = myLinks[index].e1.rect.attr('id');
        data['idRect2'] = myLinks[index].e2.rect.attr('id');
        data['strokeWidth'] = myLinks[index].line.attr('stroke-width');
        data['strokeDasharray'] = myLinks[index].line.attr('stroke-dasharray');
        data['fill'] = myLinks[index].line.attr('stroke');
        data['navigability'] = myLinks[index].navigability != null;
        data['navAngle'] = myLinks[index].angle;
        production['links'].push(data);
    }
    return production;
}

function restoreProduction(data){
    var buffer = {}; // keep a link between old ids and new objects (used to links rectangles)
    var rectangles = data['rectangles'];
    for(var index in rectangles){
        var rect = new Rectangle(rectangles[index]['x'],
                                 rectangles[index]['y'],
                                 rectangles[index]['width'],
                                 rectangles[index]['height'],
                                 rectangles[index]['fill'],
                                 master);
        rect.addTextArea();
        $(myElements[index].text).children().val(rectangles[index]['text']);
        buffer[rectangles[index]['id']] = rect;
    }

    var links = data['links'];
    for(var index in links){
        buffer[links[index]['idRect1']].linkRect(buffer[links[index]['idRect2']]);
        myLinks[index].line.attr({'stroke-width': links[index]['strokeWidth']});
        myLinks[index].line.attr({'stroke-dasharray': links[index]['strokeDasharray']});
        myLinks[index].line.attr({'stroke': links[index]['fill']});
        if(links[index]['navigability']){
            myLinks[index].addNavigability(false);
            if(myLinks[index].angle != links[index]['navAngle']){
                myLinks[index].addNavigability(true);
            }
        }
    }
}

function clearSVG(){
    myElements = [];
    myLinks = [];
    master['node'].innerHTML = "";
}
