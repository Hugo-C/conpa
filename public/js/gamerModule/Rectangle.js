class Rectangle {

    /**
     * Constructor of the Rectangle class
     * @param {float} x : x coordinate
     * @param {float} y : y coordinate
     * @param {integer} width : rectangle's width
     * @param {integer} height : rectangle's height
     * @param {String} fill : the hex code of the color that will fill the rectangle
     * @param {Production} prod : the production we want this rectangle into
     */
    constructor(x, y, width, height, fill, prod) {
        this.prod = prod;
        this.rect = this.prod.master.rect(width, height);
        this.rect.attr({
            x: x,
            y: y,
            fill: fill
        });
        this.text = null;
        this.links = [];
        this.prod.myRectangles.push(this);
        this.prod.refreshLegend();
    }

    /**
     * Associate a textarea with the rectangle
     */
    addTextArea(){
        let group = this.prod.master.group(); // use to "bind" the rectangle and the textArea

        // this tag allow to use html tags in the svg
        let htmlCompatibilyTag = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        htmlCompatibilyTag.setAttribute('x', this.rect.attr('x'));
        htmlCompatibilyTag.setAttribute('y', this.rect.attr('y'));
        htmlCompatibilyTag.setAttribute('width', this.rect.attr('width')); // match parent
        htmlCompatibilyTag.setAttribute('height', this.rect.attr('height')); // match parent

        // textarea associated with the rectangle
        let text = document.createElement("textarea");
        text.style.height = "100%"; // match parent
        text.style.width = "100%"; // match parent
        text.style.resize = "none";
        text.style.border = "none";
        text.style.padding = "5px";
	      text.style.color = "#000000";
        text.style.overflow = "hidden";
        text.style.backgroundColor = "transparent";
        text.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        $(text).change(this, Rectangle.onTextareaChange);  // call the function when the element loose focus and is changed

        htmlCompatibilyTag.appendChild(text);
        group.add(this.rect);
        document.getElementById(group.attr('id')).appendChild(htmlCompatibilyTag);

        this.text = htmlCompatibilyTag;
    }

    /**
     * Handle the change of a textarea's value
     */
    static onTextareaChange(event){
        if (typeof sendTrace === "function") {  // sendTrace is defined only in multiplayers and not in historic panel
            let rectangle = event.data;
            let textarea = rectangle.text.firstChild;
            sendTrace("me", "changed text", textarea.value, rectangle.toString());
        }
    }

    /**
     * Return the id of the rectangle (used to identified each elements in the svg)
     * @return {string} : id of the rectangle
     */
    getId(){
        return this.rect.attr('id');
    }

    /**
     * Return the x coordinate of the top left corner
     * @return {float} : x coordinate of the top left corner
     */
    getX(){
        return this.rect.attr('x');
    }

    /**
     * Return the y coordinate of the top left corner
     * @return {float} : y coordinate of the top left corner
     */
    getY(){
        return this.rect.attr('y');
    }

    /**
     * Return the height of the rectangle
     * @return {float} : height of the rectangle
     */
    getHeight(){
        return this.rect.attr('height');
    }

    /**
     * Return the width of the rectangle
     * @return {float} : width of the rectangle
     */
    getWidth(){
        return this.rect.attr('width');
    }

    /**
     * Return the fill color of the rectangle
     * @return {string} : color code
     */
    getFillColor(){
        return this.rect.attr('fill');
    }

    toString(){
        return `rectangle, color : ${this.getFillColor()}, x : ${this.getX()}, y : ${this.getY()}, width : ${this.getWidth()}, height : ${this.getHeight()}`;
    }

    /**
     * Update the x coordinate of the top left corner
     * @param {float} x : x coordinate of the top left corner
     */
    setX(x){
        this.rect.attr('x', x);
        if(this.text != null)
            this.text.setAttribute('x', x);
        this.refreshAttachedLinks();
    }

    /**
     * Update the y coordinate of the top left corner
     * @param {float} y : y coordinate of the top left corner
     */
    setY(y){
        this.rect.attr('y', y);
        if(this.text != null)
            this.text.setAttribute('y', y);
        this.refreshAttachedLinks();
    }

    /**
     * Update the height of the rectangle
     * @param {float} height : height of the rectangle
     */
    setHeight(height){
        this.rect.attr('height', height);
        if(this.text != null)
            this.text.setAttribute('height', this.rect.attr('height'));
        this.refreshAttachedLinks();
    }

    /**
     * Update the width of the rectangle
     * @param {float} width : width of the rectangle
     */
    setWidth(width){
        this.rect.attr('width', width);
        if(this.text != null)
            this.text.setAttribute('width', this.rect.attr('width'));
        this.refreshAttachedLinks();
    }

    /**
     * Update the fill color of the rectangle
     * @param {string} color : color code (example : '#000000')
     */
    setFillColor(color){
        this.rect.attr('fill', color);
        this.prod.refreshLegend();
    }

    /**
     * Display the selection border
     */
    select() {
        this.rect.animate(100).stroke({'color': 'black', 'width': 5});
    }

    /**
     * Hide the selection border
     */
    unselect() {
        this.rect.animate(100).stroke({'width': 0});
    }

    /**
     * Return the element's center by x and y coordinates
     *
     * @return {{x: number, y: number}}
     */
    center() {
        let xCenter = this.rect.attr('x') + this.rect.attr('width') / 2;
        let yCenter = this.rect.attr('y') + this.rect.attr('height') / 2;
        return {x: xCenter, y: yCenter};
    }

    /**
     * Check if a point is inside the rectangle
     *
     * @param {float} x : x coordinate
     * @param {float} y : y coordinate
     * @return {Boolean}
     */
    isInside(x, y){
        return this.rect.inside(x, y);
    }

    /**
     * Check if the coordinate are around the bottom right corner of the rectangle
     * @param x {float} : x coordinate
     * @param y {float} : y coordinate
     * @return {boolean}
     */
    isAroundBottomRightCorner(x, y){
        let x2 = this.getX() + this.getWidth();
        let y2 = this.getY() + this.getHeight();
        return Link.distance(x, y, x2, y2) <= CORNER_DETECTION_MARGIN;
    }

    /**
     * Link two rect with a line
     *
     * @param {Rectangle} e : rectangle with which we want to create a link
     */
    linkRect(e){
        if(!this.isLinkedTo(e)){
            let link = new Link(this, e, this.prod);
            this.addLink(link);
            e.addLink(link);
        }
    }

    /**
     * Check if this rectangle and the 'e' rectangle are linked
     *
     * @param {Rectangle} e : the rectangle to check
     */
    isLinkedTo(e) {
        let res = false;
        if(e === this)
            res = true;
        this.links.forEach(function (link) {
            if (link.hasElement(e)) {
                res = true;
            }
        });
        return res;
    }

    /**
     * Add a link to the element
     *
     * @param {Link} link : the link to add
     */
    addLink(link){
        this.links.push(link);
    }

    refreshAttachedLinks(){
        this.links.forEach(function (link) {
            link.refreshPosition();
        });
    }

    /**
     * Remove the element and all links attached to it
     */
    myRemove(){
        let l;
        this.rect.parent().remove();
        while(this.links.length > 0){
            l = this.links.pop();
            l.myRemove();
        }
        removeFromArray(this.prod.myRectangles, this);
        this.prod.refreshLegend();
    }

    /**
     * Remove the connection between a link and this element
     *
     * @param {Link} link : the link to remove
     */
    removeLink(link){
        removeFromArray(this.links, link);
    }
}
