const STROKE_WIDTH = "10";
const TEXTAREA_MARGIN = 10;
const TEXTAREA_MESSAGE = "taper votre texte ici";

let myElements = [];  // list all elements in the svg


class Element {  // warning : Element need svg to be declared

    /**
     * Constructor of the Element class
     * @param x {String} : x coordinate
     * @param y {String} : y coordinate
     */
    constructor(x, y) {
        this.rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.rect.style.fill = 'red';
        this.rect.style.stroke = 'black';
        this.rect.style.strokeWidth = '2';
        this.rect.setAttribute("x", x);
        this.rect.setAttribute("y", y);
        svg.append(this.rect);

        this.text = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        this.textDiv = document.createElement("div");
		
        this.textDiv.setAttribute("width", "auto");
        this.textDiv.setAttribute("height", "auto");
        this.textDiv.setAttribute("border", "none");
        this.textDiv.classList.add("insideforeign");
        this.text.appendChild(this.textDiv);
        this.textArea = document.createElement("textarea");

        this.textArea.setAttribute("spellcheck", "true");
        this.textArea.setAttribute("placeholder", TEXTAREA_MESSAGE);


        this.textArea.setAttribute("width", "auto");
        this.textArea.setAttribute("height", "auto");
        this.textDiv.appendChild(this.textArea);

        this.text.setAttribute("width", "100%");
        this.text.setAttribute("height", "100%");
        this.text.classList.add("foreign"); //to make div fit text
        this.textArea.classList.add("insideforeign"); //to make div fit text
        this.textArea.classList.add("myTextArea"); //to make div fit text
		
        this.text.setAttributeNS(null, "transform", "translate(" + (this.x + 5) + " " + (this.y + 10) + ")");
        svg.appendChild(this.text);
        //svg.append(this.text);
        myElements.push(this);
		
        this.myLinks = [];
    }

    /**
     * Get the rect's x value
     * @return {number}
     */
    get x() {
        return this.rect.x.baseVal.value;
    }

    /**
     * Set the rect's x value
     * @param value {number}
     */
    set x(value) {
        this.rect.setAttribute("x", value);
        this.refreshPosition();
    }

    /**
     * Get the rect's y value
     * @return {number}
     */
    get y() {
        return this.rect.y.baseVal.value;
    }

    /**
     * Set the rect's y value
     * @param value {number}
     */
    set y(value) {
        this.rect.setAttribute("y", value);
        this.refreshPosition();
    }

    /**
     * Get the rect's width value
     * @return {number}
     */
    get width() {
        return this.rect.width.baseVal.value;
    }

    /**
     * Set the rect's width value
     * @param value {number}
     */
    set width(value) {
        this.rect.setAttribute("width", value);
        if (Number(value) > TEXTAREA_MARGIN * 2){
            this.text.setAttribute("width", String(Number(value) - TEXTAREA_MARGIN));
        } else {
            this.text.setAttribute("width", String(value));
        }
    }

    /**
     * Get the rect's height value
     * @return {number}
     */
    get height() {
        return this.rect.height.baseVal.value;
    }

    /**
     * Set the rect's height value
     * @param value {number}
     */
    set height(value) {
        this.rect.setAttribute("height", String(value));
        if (Number(value) > TEXTAREA_MARGIN * 2){
            this.text.setAttribute("height", String(Number(value) - TEXTAREA_MARGIN));
        } else {
            this.text.setAttribute("height", String(value));
        }
    }

    /**
     * Return the element's center by x and y coordinates
     * @return {{x: number, y: number}}
     */
    get center() {
        let xCenter = this.x + this.width / 2;
        let yCenter = this.y + this.height / 2;
        return {x: xCenter, y: yCenter};
    }

    /**
     * Set the element as selected
     * @param isSelect {boolean}
     */
    set select(isSelect) {
        if (isSelect) {
            this.rect.style.strokeDasharray = '10';
            rectSelect.textArea.focus();
        } else {
            this.rect.style.strokeDasharray = '0';
        }
    }

    /**
     * Get the text content of the element
     * @return {String}
     */
    get textContent(){
        return this.textNode.date;
    }

    /**
     * Set the text content of the element
     * @param text {String}
     */
    set textContent(text) {
        this.textNode.data = text;
    }

    /**
     * Link two rect with a line
     * @param e1 {Element} : first element to link
     * @param e2 {Element} : second element to link
     */
    static linkRect(e1, e2) {
        if(!e1.isLinkedTo(e2)){
            let link = new Link(e1, e2);
            e1.addLink(link);
            e2.addLink(link);
            // put elements in front
            e1.putFront();
            e2.putFront();
        }
    }

    /**
     * Try to find an element at the coordinate
     * if no element is found at the coordinate return null
     * @param x {int} : x coordinate
     * @param y {int} : y coordinate
     * @return {Element} : an element at the coordinate
     */
    static getElementIn(x, y) {
        let res = null;
        myElements.forEach(function(element) {
            if(element.isIn(x, y)){
                res = element;
            }
        });
        return res;
    }

    /**
     * Check if this element and the 'e' element are linked
     * @param e {Element} : the element to check
     */
    isLinkedTo(e) {
        let res = false;
        if(e === this)
            res = true;

        this.myLinks.forEach(function (link) {
            if (link.hasElement(e)) {
                res = true;
            }
        });
        return res;
    }

    /**
     * Put the Element on front of the svg
     */
    putFront() {
        svg.appendChild(this.rect);
        svg.appendChild(this.text);
    }
	
	/**
     * Change the color of the rectangle
     */
    changeColor(c) {
        this.rect.style.fill(c);
    }

    /**
     * Check if the coordinate are in the element (more specifically the rect)
     * @param x {int} : x coordinate
     * @param y {int} : y coordinate
     * @return {boolean} : true if the coordinate is in the element's rect
     */
    isIn(x, y) {
        return x <= (this.x + this.width) && y < (this.y + this.height) && x >= this.x && y >= this.y;
    }

    /**
     * Add a link to the element
     * @param link {Link} : the link to add
     */
    addLink(link){
        this.myLinks.push(link);
    }

    /**
     * Refresh the position of the element inside the svg
     */
    refreshPosition() {
        this.text.setAttributeNS(null, "transform", "translate(" + (this.x + 5) + " " + (this.y + 10) + ")");
        this.myLinks.forEach(function (link) {
            link.refreshPosition();
        });
    }

    /**
     * Remove the element and all links attached to it
     */
    myRemove(){
        let l;
        this.rect.remove();
        this.text.remove();
        while(this.myLinks.length > 0){
            l = this.myLinks.pop();
            l.myRemove();
        }
        removeFromArray(myElements, this);
    }

    /**
     * Remove the connection between a link and this element
     * @param link {Link} : the link to remove
     */
    removeLink(link){
        removeFromArray(this.myLinks, link);
    }
}

class Link {

    /**
     * Create a new link between two link
     * @param e1 {Element} : first element to link
     * @param e2 {Element} : second element to link
     */
    constructor(e1, e2) {
        let pos1 = e1.center;
        let pos2 = e2.center;
        this.line = Link.createLine(pos1.x, pos1.y, pos2.x, pos2.y);
        this.e1 = e1;
        this.e2 = e2;
    }

    /**
     * Create a new line between two points
     * @param x1 {String} : x coordinate of the first point
     * @param y1 {String} : y coordinate of the first point
     * @param x2 {String} : x coordinate of the second point
     * @param y2 {String} : y coordinate of the second point
     * @return {SVGAElement} the svg line created
     */
    static createLine(x1, y1, x2, y2) {
        let l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x1);
        l.setAttribute("y1", y1);
        l.setAttribute("x2", x2);
        l.setAttribute("y2", y2);
        l.setAttribute("stroke", "black");
        l.setAttribute("stroke-width", STROKE_WIDTH);
        svg.appendChild(l);
        return l;
    }

    /**
     * Remove the link
     */
    myRemove() {
        this.line.remove();
        this.e1.removeLink(this);
        this.e2.removeLink(this);
    }

    /**
     * Reposition a link
     */
    refreshPosition(){
        let c1 = this.e1.center;
        let c2 = this.e2.center;
        this.line.setAttribute("x1", c1.x);
        this.line.setAttribute("y1", c1.y);
        this.line.setAttribute("x2", c2.x);
        this.line.setAttribute("y2", c2.y);
    }

    /**
     * Check if the element 'e' is used by this link
     * @param e {Element}
     * @returns {boolean}
     */
    hasElement(e) {
        return (e === this.e1 || e === this.e2);
    }
}