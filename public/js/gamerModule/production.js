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

class Production {

    constructor(parent, panning){
        this.parent = parent;
        this.draw = SVG(parent).size('100%', '100%').panZoom({
            doPanning: panning,
            zoomFactor: 0.5,
            zoomMin: 0.25,
            zoomMax: 4,
        });
        this.master = this.draw.group();

        this.pt = this.draw['node'].createSVGPoint();

        this.myElements = []; // list all elements in the svg
        this.myLinks = []; // list all links in the svg

        this.colors = {'red': '#ED1723', 'green': '#0FB32D', 'yellow': '#FFEE24', 'blue': '#3344FF', 'white': '#D5D5D5', 'purple': '#A531FF', 'brown': '#8C5B35'};
        this.selectedColor = this.colors['red'];

        // Rectangle manipulation variables
        this.rectCreate = false;
        this.creatingRect = null;
        this.lastSelectedItem = null;
        this.selectedItem = null;
        this.selectedLink = null;
        this.move = false;
        this.dx = null;
        this.dy = null;

        // Contextual menu variables
        this.menu = $('#linkContextMenu');
        this.menuState = 0;
        this.active = "contextMenu--active";

        var self = this;

        // Get point in global SVG space
        this.cursorPoint = function(evt){
            self.pt.x = evt.clientX;
            self.pt.y = evt.clientY;
            return self.pt.matrixTransform(self.draw['node'].getScreenCTM().inverse());
        }

        this.getElementAtCoordinates = function(x, y){
            var res = null;
            for(var index in self.myElements){
                if(self.myElements[index].isInside(x, y)){
                    res = self.myElements[index];
                }
            }
            return res;
        }

        this.getLinkAtCoordinates = function(x, y){
            x = parseInt(x);
            y = parseInt(y);
            for(var index in self.myLinks){
                if(self.myLinks[index].isInside(x, y)){
                    return self.myLinks[index];
                }
            }
            return null;
        }

        // ---------------------------------------------------------------------
        // --------------------- CONTEXTUAL MENU -------------------------------
        // ---------------------------------------------------------------------

        this.clickInsideElement = function(e) {
            var el = e.srcElement || e.target;

            if ($(self.parent)[0].contains(el)){
                return el;
            }else{
                return false;
            }
        }

        this.toggleMenuOn = function() {
            if(self.menuState !== 1){
                self.menuState = 1;
                self.menu.addClass(self.active);
            }
        }

        this.toggleMenuOff = function() {
            if(self.menuState !== 0){
                self.menuState = 0;
                self.menu.removeClass(self.active);
            }
        }

        this.positionMenu = function(e) {

            var menuWidth = self.menu.get(0).offsetWidth + 4;
            var menuHeight = self.menu.get(0).offsetHeight + 4;

            var productionWidth = $(self.parent).get(0).offsetWidth;
            var productionHeight = $(self.parent).get(0).offsetHeight;

            var menuPositionX = e.clientX;
            var menuPositionY = e.clientY;

            menuPositionX -= (2 * menuWidth) / 3;
            menuPositionY -= menuHeight / 5;

            if((menuPositionX + menuWidth) > productionWidth){
                self.menu.css('left', (menuPositionX - menuWidth) + "px");
            }else{
                self.menu.css('left', menuPositionX + "px");
            }

            if((menuPositionY + menuHeight) > productionHeight){
                self.menu.css('top', (menuPositionY - menuHeight) + "px");
            }else{
                self.menu.css('top', menuPositionY + "px");
            }
        }

        // ---------------------------------------------------------------------
        // --------------------- DRAW LISTENERS --------------------------------
        // ---------------------------------------------------------------------

        this.onMouseDown = function(evt){
            var coord = self.cursorPoint(evt);
            if($('#bouton').is(":focus")) {
                self.rectCreate = true;
                doPanning = false;
                let panningButton = $("#moveElement");  // to visualy indicate the panning state we change the button
                panningButton.removeClass("selected");  // TODO make it consistent with gameManager.js
                panningButton.css('background-image', 'url("/img/gamerModule/move.png")');
                self.creatingRect = new Rectangle(coord.x, coord.y, 1, 1, self.selectedColor, self);
            }else if($('#moveElement').hasClass('selected')){
                if(self.selectedItem != null){
                    self.move = true;
                    doPanning = false;  // temporally disable the panning until the element is moved
                    self.dx = coord.x - self.selectedItem.getX();
                    self.dy = coord.y - self.selectedItem.getY();
                }
            }
        }

        this.onMouseMove = function(evt){
            var coord = self.cursorPoint(evt);
            if(self.rectCreate && self.creatingRect != null){
                var rectX = self.creatingRect.getX();
                var rectY = self.creatingRect.getY();
                if(coord.x >= rectX && coord.y >= rectY){
                    self.creatingRect.setWidth(coord.x - rectX);
                    self.creatingRect.setHeight(coord.y - rectY);
                }
            }else if(self.move){
                self.selectedItem.setX(coord.x - self.dx);
                self.selectedItem.setY(coord.y - self.dy);
                self.selectedItem.refreshAttachedLinks();
            }
        }

        this.onMouseUp = function(evt){
            if(self.rectCreate && self.creatingRect != null){
                self.creatingRect.addTextArea();
                self.rectCreate = false;
                self.creatingRect = null;
            }else if(self.move){
                self.move = false;
                doPanning = true;  // the panning is reestablished
                self.dx = null;
                self.dy = null;
            }
        }

        this.onClick = function(evt){
            var coord = self.cursorPoint(evt);
            var item = self.getElementAtCoordinates(coord.x, coord.y);

            if(item != null){
                self.lastSelectedItem = self.selectedItem;
                if (self.lastSelectedItem != null && self.lastSelectedItem !== item){
                    self.lastSelectedItem.unselect(); // hide the selection border to don't have two rectangle with it
                }
                self.selectedItem = item;
                self.selectedItem.select(); // display the selection border
            }else if(self.selectedItem != null){
                self.lastSelectedItem = self.selectedItem;
                self.selectedItem.unselect();
                self.selectedItem = null;
            }

            if(self.lastSelectedItem != null && self.selectedItem != null){
                self.selectedItem.linkRect(self.lastSelectedItem);
            }

            if(self.selectedLink != null){
                self.selectedLink = null;
            }
        }

        this.onKeydown = function(event){
            if(event.keyCode === 46){
                if(self.selectedItem !== null){
                    self.selectedItem.myRemove();
                    self.selectedItem = null;
                }else if(self.selectedLink !== null){
                    self.selectedLink.myRemove();
                    self.selectedLink = null;
                }
            }
        }

        // ---------------------------------------------------------------------
        // ------------------- TOOLS LISTENERS ---------------------------------
        // ---------------------------------------------------------------------

        $("#colorMenu button").on("click", function(){
            console.log('new color');
            var color = $(this).val();
            self.selectedColor = self.colors[color];
            if(self.selectedItem != null){
                self.selectedItem.setFillColor(self.colors[color]);
            }
        });

        // ---------------------------------------------------------------------
        // ---------------- CONTEXTUAL MENU LISTENERS --------------------------
        // ---------------------------------------------------------------------

        $('#removeLink').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.myRemove();
                self.selectedLink = null;
            }
        });

        $('#dashLink').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.setDasharray(10.10);
            }
        });

        $('#linearLink').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.setDasharray(0);
            }
        });

        $('#increaseWidth').on('click', function(){
            if(self.selectedLink != null){
                var strokeWidth = self.selectedLink.getWidth();
                strokeWidth += 2;
                if(strokeWidth <= 20){
                    self.selectedLink.setWidth(strokeWidth);
                }
            }
        });

        $('#decreaseWidth').on('click', function(){
            if(self.selectedLink != null){
                var strokeWidth = self.selectedLink.getWidth();
                strokeWidth -= 2;
                if(strokeWidth > 0){
                    self.selectedLink.setWidth(strokeWidth);
                }
            }
        });

        $('#navigability').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.addNavigability();
            }
        });

        $('#reverseNavigability').on('click', function(){
            if(self.selectedLink != null && self.selectedLink.navigability != null){
                self.selectedLink.reverseNavigability();
        		    self.selectedLink.addNavigability();
            }
        });

        $('#removeNavigability').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.removeNavigability();
            }
        });

        $('#linkColor').on('click', function(){
            $('.colorTool').css('display', 'block');
            $('.mainTool').css('display', 'none');
        });

        $('button.colorTool').on('click', function(){
            if(self.selectedLink != null){
                self.selectedLink.setColor(self.colors[$(this).val()]);
            }
            $('.colorTool').css('display', 'none');
            $('.mainTool').css('display', 'block');
        });

        // ---------------------------------------------------------------------
        // --------------------- OTHERS LISTENERS ------------------------------
        // ---------------------------------------------------------------------

        // resize the svg when page is resized
        window.onresize = function(evt){
            self.toggleMenuOff();
            var dimHeight = $('div#production').height();
            var dimWidth = $('div#production').width();
            self.draw.attr({'height': dimHeight, 'width': dimWidth});
        }

        this.documentClick = function(evt){
            var button = evt.which || evt.button;
            var inside = self.clickInsideElement(evt);
            if ( button === 1 ) {
                if(inside && self.selectedLink == null)
                    self.toggleMenuOff();
                else if(!inside)
                    self.toggleMenuOff();
            }
        }

        this.openContextMenu = function(evt){
            var coord = self.cursorPoint(evt);
            self.selectedLink = self.getLinkAtCoordinates(coord.x, coord.y);

            if(self.clickInsideElement(evt) && self.selectedLink != null){
                evt.preventDefault();
                self.toggleMenuOn();
                self.positionMenu(evt);
            }else{
                self.toggleMenuOff();
            }
        }

        this.draw.on('mousedown', this.onMouseDown);
        this.draw.on('mousemove', this.onMouseMove);
        this.draw.on('mouseup', this.onMouseUp);
        this.draw.on('click', this.onClick);
        this.draw.on('keydown', this.onKeydown);
        document.addEventListener('contextmenu', this.openContextMenu);
        document.addEventListener('click', this.documentClick);
    }

    // -------------------------------------------------------------------------
    // ----------------- Convert SVG to a string -------------------------------
    // -------------------------------------------------------------------------
    // We convert the svg to a string to display it as an image (later)
    // To display it as an image, we need to replace HTML and foreignObject tags
    // by SVG tags
    // -------------------------------------------------------------------------

    /**
     * Extract the value of all textArea inside the parent element and put it inside the textArea tags
     * @param {HTMLElement} parent : the parent of textareas to explicit
     */
    explicitTextAreaValues(parent){
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
                this.explicitTextAreaValues(elt);
            }
        }
    }

    cutTextIntoLines(text, textWidth){
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

    extractParam(param, paramsList){
        var result = paramsList.match(param + '=\"([-+]?[0-9.]+)\"'); // <-- repère
        return parseInt(result[1]);
    }

    textareaToSVGText(params, text){
        var x = this.extractParam('x', params);
        var y = this.extractParam('y', params);
        var height = this.extractParam('height', params);
        var width = this.extractParam('width', params);
        var lines = this.cutTextIntoLines(text, width - 10);
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
    getInlineSvg(){
        const regexForeignObject = /<foreignObject([\s\S]*?)<\/foreignObject>/mgi;
        const regexTextArea = /<textarea[^>]+?>([\s\S]*?)<\/textarea>/mgi;
        const regexText = /<text x="([0-9]+)[.]?[0-9]*" y="([0-9]+)[.]?[0-9]*"([\s\S]*?)<\/text>/mgi;
        let self = this; // used to have access at class functions inside the getInlineSvg's functions

        function handleReplaceString(match, p1) {
            let res = p1.replace(regexTextArea, "$1");
            let tagContent = res.split('>', 2);
            return self.textareaToSVGText(tagContent[0], tagContent[1]);
        }

        function moveText(match, p1, p2, p3){
            let x = parseInt(p1, 10) + 5;
            let y = parseInt(p2, 10) + 15;
            return '<text x="' + x + '" y="' + y + '"' + p3 + '</text>';
        }

        let mySvg = this.draw['node'];
        this.explicitTextAreaValues(mySvg);
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

    saveProduction(){
        var production = {'rectangles' : [], 'links': []};
        for(var index in this.myElements){
            var data = {};
            data['id'] = this.myElements[index].getId();
            data['x'] = this.myElements[index].getX();
            data['y'] = this.myElements[index].getY();
            data['width'] = this.myElements[index].getWidth();
            data['height'] = this.myElements[index].getHeight();
            data['fill'] = this.myElements[index].getFillColor();
            data['text'] = $(this.myElements[index].text).children().val();
            production['rectangles'].push(data);
        }

        for(var index in this.myLinks){
            var data = {};
            data['idRect1'] = this.myLinks[index].getFirstRectId();
            data['idRect2'] = this.myLinks[index].getSecondRectId();
            data['strokeWidth'] = this.myLinks[index].getWidth();
            console.log(this.myLinks[index].getDasharray());
            data['strokeDasharray'] = this.myLinks[index].getDasharray();
            data['fill'] = this.myLinks[index].getColor();
            data['navigability'] = this.myLinks[index].hasNavigability();
            data['navAngle'] = this.myLinks[index].getNavigabilityAngle();
            production['links'].push(data);
        }
        return production;
    }

    restoreProduction(data){
        var buffer = {}; // keep a link between old ids and new objects (used to links rectangles)
        var rectangles = data['rectangles'];
        for(var index in rectangles){
            var rect = new Rectangle(rectangles[index]['x'],
                                     rectangles[index]['y'],
                                     rectangles[index]['width'],
                                     rectangles[index]['height'],
                                     rectangles[index]['fill'],
                                     this);
            rect.addTextArea();
            $(this.myElements[index].text).children().val(rectangles[index]['text']);
            buffer[rectangles[index]['id']] = rect;
        }

        var links = data['links'];
        for(var index in links){
            buffer[links[index]['idRect1']].linkRect(buffer[links[index]['idRect2']]);
            this.myLinks[index].setWidth(links[index]['strokeWidth']);
            console.log(links[index]['strokeDasharray']);
            this.myLinks[index].setDasharray(links[index]['strokeDasharray']);
            this.myLinks[index].setColor(links[index]['fill']);
            if(links[index]['navigability']){
                this.myLinks[index].addNavigability(false);
                if(this.myLinks[index].getNavigabilityAngle() != links[index]['navAngle']){
                    this.myLinks[index].addNavigability(true);
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // ------------------------ Utils functions --------------------------------
    // -------------------------------------------------------------------------

    centerSVGToDefaultPosition(){
        var clientWidth = this.draw['node'].clientWidth;
        var clientHeight = this.draw['node'].clientHeight;
        var masterCoord = this.draw['node'].childNodes[1].getBBox();
        var viewboxParam = "" + masterCoord.x + " " + masterCoord.y + " " + clientWidth + " " + clientHeight;
        this.draw['node'].setAttribute("viewBox", viewboxParam)
    }

    clearSVG(){
        this.myElements = [];
        this.myLinks = [];
        this.master['node'].innerHTML = "";
    }
}
