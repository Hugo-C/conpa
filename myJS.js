const STROKE_WIDTH = "10";

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
        this.textNode = document.createTextNode("Click to edit");
        this.textDiv.appendChild(this.textNode);
        this.textDiv.setAttribute("contentEditable", "true");
        this.textDiv.setAttribute("width", "auto");
        this.text.setAttribute("width", "100%");
        this.text.setAttribute("height", "100%");
        this.text.classList.add("foreign"); //to make div fit text
        this.textDiv.classList.add("insideforeign"); //to make div fit text
        //this.textDiv.addEventListener("mousedown", elementMousedown, false);
        this.text.setAttributeNS(null, "transform", "translate(" + (this.x + 5) + " " + (this.y + 10) + ")");
        svg.appendChild(this.text);
        this.text.appendChild(this.textDiv);
        svg.append(this.text);
        myElements.push(this);

        this.myLinks = [];
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
     * Check if this element and the 'e' element are linked
     * @param e {Element} : the element to check
     */
    isLinkedTo(e) {
        this.myLinks.forEach(function (link) {
            if (link.hasElement(e)) {
                return true;
            }
        });
        return false;
    }

    /**
     * Put the Element on front of the svg
     */
    putFront() {
        svg.appendChild(this.rect);
        svg.appendChild(this.text);
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
     * Get the rect's x value
     * @return {number}
     */
    get x() {
        return this.rect.x.baseVal.value;
    }
	
	/**
     * Set the rect's x value
     * 
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
     * 
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
     * Get the rect's height value
     * @return {number}
     */
    get height() {
        return this.rect.height.baseVal.value;
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
            rectSelect.textDiv.focus();
        } else {
            this.rect.style.strokeDasharray = '0';
        }
    }

    /**
     * Add a link to the element
     * @param link {Link} : the link to add
     */
    addLink(link){
        this.myLinks.push(link);
    }

    refreshPosition() {
        this.text.setAttributeNS(null, "transform", "translate(" + (this.x + 5) + " " + (this.y + 10) + ")");
        this.myLinks.forEach(function (link) {
           link.refreshPosition();
        });
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
        return e === this.e1 || e === this.e2;
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
}

function boutonClique(){
    if(document.getElementById("bouton").src.indexOf("text.png") > -1) document.getElementById("bouton").src = "textC.png";
    else document.getElementById("bouton").src = "text.png";
}
