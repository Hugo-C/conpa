const STROKE_WIDTH = "4";

var myElements = []; // list all elements in the svg
var myLinks = []; // list all links in the svg

class Rectangle {

  /**
   * Constructor of the Rectangle class
   * @param {float} x : x coordinate
   * @param {float} y : y coordinate
   * @param {integer} width : rectangle's width
   * @param {integer} height : rectangle's height
   * @param parent {SVGSVGElement | SVGGElement} : the parent svg Element
   */
  constructor(x, y, width, height, fill, prod){
      this.prod = prod;
      this.rect = this.prod.master.rect(width, height);
      this.rect.attr({
        x: x,
        y: y,
        fill: fill
      });
      this.text = null;
      this.links = [];
      this.prod.myElements.push(this);
  }

  /**
   * Associate a textarea with the rectangle
   */
  addTextArea(){
      var group = this.prod.master.group(); // use to "bind" the rectangle and the textArea

      // this tag allow to use html tags in the svg
      var htmlCompatibilyTag = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      htmlCompatibilyTag.setAttribute('x', this.rect.attr('x'));
      htmlCompatibilyTag.setAttribute('y', this.rect.attr('y'));
      htmlCompatibilyTag.setAttribute('width', this.rect.attr('width')); // match parent
      htmlCompatibilyTag.setAttribute('height', this.rect.attr('height')); // match parent

      // textarea associated with the rectangle
      var text = document.createElement("textarea");
      text.style.height = "100%"; // match parent
      text.style.width = "100%"; // match parent
      text.style.resize = "none";
      text.style.border = "none";
      text.style.padding = "5px";
	    text.style.color = "#000000";
      text.style.overflow = "hidden";
      text.style.backgroundColor = "transparent";
      text.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

      htmlCompatibilyTag.appendChild(text);
      group.add(this.rect);
      document.getElementById(group.attr('id')).appendChild(htmlCompatibilyTag);

      this.text = htmlCompatibilyTag;
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

  /**
   * Update the x coordinate of the top left corner
   * @param {float} x : x coordinate of the top left corner
   */
  setX(x){
      this.rect.attr('x', x);
      if(this.text != null)
          this.text.setAttribute('x', x);
  }

  /**
   * Update the y coordinate of the top left corner
   * @param {float} y : y coordinate of the top left corner
   */
  setY(y){
      this.rect.attr('y', y);
      if(this.text != null)
          this.text.setAttribute('y', y);
  }

  /**
   * Update the height of the rectangle
   * @param {float} height : height of the rectangle
   */
  setHeight(height){
      this.rect.attr('height', height);
  }

  /**
   * Update the width of the rectangle
   * @param {float} width : width of the rectangle
   */
  setWidth(width){
      this.rect.attr('width', width);
  }

  /**
   * Update the fill color of the rectangle
   * @param {string} color : color code (example : '#000000')
   */
  setFillColor(color){
      this.rect.attr('fill', color);
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
   * Link two rect with a line
   *
   * @param {Rectangle} e : rectangle with which we want to create a link
   */
  linkRect(e){
      if(!this.isLinkedTo(e)){
          var link = new Link(this, e, this.prod);
  	      link.line.stroke({color:"#333333"});
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
      var l;
      this.rect.parent().remove();
      while(this.links.length > 0){
          l = this.links.pop();
          l.myRemove();
      }
      removeFromArray(this.prod.myElements, this);
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

class Link {

    /**
     * Create a new link between two link
     * @param {Rectangle} e1 : first element to link
     * @param {Rectangle} e2 : second element to link
     * @param {SVGSVGElement | SVGGElement} parent : the parent svg Element
     */
    constructor(e1, e2, prod) {
        this.e1 = e1;
        this.e2 = e2;
		    this.prod = prod;

        this.dasharray = 0;
    		this.navigability = null;
    		this.angle = null;
        this.reversed = false;
        let pos1 = e1.center();
        let pos2 = e2.center();
        this.line = prod.master.line(pos1.x, pos1.y, pos2.x, pos2.y).stroke({width: STROKE_WIDTH});
        this.line.back();
        prod.myLinks.push(this);
    }

    /**
     * Return the value of width property
     * @return {number} : the value of width property
     */
    getWidth(){
        return this.line.attr('stroke-width');
    }

    /**
     * Return dasharray value of the link
     * @return {float} : value of dasharray property of the link
     */
    getDasharray(){
        return this.dasharray;
    }

    /**
     * Return the link's color
     * @return {string} : color code
     */
    getColor(){
       return this.line.attr('stroke');
    }

    /**
     * Return the id of the first rectangle with which we are linked
     * @return {float} : id of a rectangle
     */
    getFirstRectId(){
        return this.e1.getId();
    }

    /**
     * Return the id of the second rectangle with which we are linked
     * @return {float} : id of a rectangle
     */
    getSecondRectId(){
        return this.e2.getId();
    }

    /**
     * Return the navigability angle (used to know the navigability sense)
     * @return {float} : navigability's angle
     */
    getNavigabilityAngle(){
        return this.angle;
    }

    /**
     * change the value of dasharray property of the link
     * @param {float} dasharrayValue : new value for the dasharray property
     */
    setDasharray(dasharrayValue){
        this.dasharray = dasharrayValue;
        this.line.stroke({dasharray: dasharrayValue});
    }

    /**
     * change the value of width property of the link and the size of his navigability if it has one
     * @param {number} widthValue : new value for the width property
     */
    setWidth(widthValue){
        this.line.stroke({width: widthValue});
    		if(this.navigability != null){
            this.addNavigability(false);
        }
    }

    /**
     * change the value of color property of the link and of his navigability if it has one
     * @param {string} colorValue : color's code ("#????"")
     */
    setColor(colorValue){
        this.line.stroke({color: colorValue});
    		if(this.navigability != null){
    			   this.setNavigabilityColor(colorValue);
        }
    }

   /**
	  * change the value of color property of the navigability
    * @param {string} colorValue : color's code ("#??????")
  	*/
  	setNavigabilityColor(colorValue){
        this.navigability.attr({style: "fill:" + colorValue + "; stroke:" + colorValue});
    }

    distance(x1, y1, x2, y2){
        return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
    }

    /** Check if a point is on the line
      *
      * @param {float} x : x coordinate
      * @param {float} y : y coordinate
      * @return {Boolean}
      */
    isInside(x, y){
        let x1 = parseInt(this.line.attr("x1"));
        let y1 = parseInt(this.line.attr("y1"));
        let x2 = parseInt(this.line.attr("x2"));
        let y2 = parseInt(this.line.attr("y2"));
        return Math.abs(this.distance(x1, y1, x, y) + this.distance(x, y, x2, y2) - this.distance(x1, y1, x2, y2)) < 1;
    }

    /**
     * Remove the link
     */
    myRemove() {
		    this.removeNavigability();
        this.line.remove();
        this.e1.removeLink(this);
        this.e2.removeLink(this);
        removeFromArray(this.prod.myLinks, this);
    }

    /**
     * Reposition a link
     */
    refreshPosition(){
        let c1 = this.e1.center();
        let c2 = this.e2.center();
        this.line.plot(c1.x, c1.y, c2.x, c2.y);

        if(this.navigability != null){
            this.addNavigability();
        }
    }

    /**
     * Check if the element 'e' is used by this link
     * @param {Element} e
     * @returns {boolean}
     */
    hasElement(e) {
        return (e === this.e1 || e === this.e2);
    }

    // Geom functions

    calculEquationDroite(xa, ya, xb, yb) {
        console.log("xa : " + xa + " ya : " + ya + " xb : " + xb + " yb : " + yb);
        let alpha = (xb - xa) / (yb - ya);
        let beta = ya - alpha * xa;
        console.log("alpha : " + alpha + " beta : " + beta);
        return { a: alpha, b: beta };
    }

    calculPointIntersection(eq1, eq2) {
        let pointX = (eq1.b - eq2.b) / (eq2.a - eq1.a);
        let pointY = (((eq2.a * eq1.b) - (eq2.a * eq2.b)) / eq2.a - eq1.a) + eq2.b;
        console.log("pointX : " + pointX + " pointY : " + pointY);
        return { x: pointX, y: pointY };
    }

    calculDistance(p1, p2) {
        console.log("x1 : " + p1.x + " y1 : " + p1.y + " x2 : " + p2.x + " y2 : " + p2.y);
        return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
    }

  	/**
  	* Associate a navigability to the link
  	*/
    addNavigability(){
      	if(this.navigability != null){
      		  this.navigability.remove();
      	}

      	let pos1 = this.e1.center();
      	let pos2 = this.e2.center();
      	this.angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;

        // ORIGINAL //

        /*let posX = 0.5 * (this.line.attr('x2') + this.line.attr('x1'));
      	let posY = 0.5 * (this.line.attr('y2') + this.line.attr('y1'));*/

        // TEST 1 //

        /*let posX = this.e2.center().x;
		let posXSupp = (Math.abs(((this.e1.center().x) - (this.e2.center().x - this.e2.rect.attr('width')*0.5)) - this.e2.rect.attr('width')*0.25) - this.line.width());
		posX += posXSupp;
		let posY = this.e2.center().y;
		let posYSupp = (Math.abs(((this.e1.center().y) - (this.e2.center().y - this.e2.rect.attr('height')*0.5)) - this.e2.rect.attr('height')*0.25) - this.line.height());
		posY += posYSupp;
		posY += (Math.abs(this.e1.center().y - (this.e2.center().y - this.e2.rect.attr('height')*0.5)) - this.line.height());
		console.log("posXSupp: " + posXSupp);*/

        // TEST 2 //

      	let mainEquation = this.calculEquationDroite(this.e2.center().x, this.e2.center().y, this.e1.center().x, this.e1.center().y);
      	let equation1 = this.calculEquationDroite(this.e1.center().x + this.e1.rect.attr('width') * 0.5, this.e1.center().y - this.e1.rect.attr('height') * 0.5, this.e1.center().x + this.e1.rect.attr('width') * 0.5, this.e1.center().y + this.e1.rect.attr('height') * 0.5);
      	let equation2 = this.calculEquationDroite(this.e1.center().x + this.e1.rect.attr('width') * 0.5, this.e1.center().y + this.e1.rect.attr('height') * 0.5, this.e1.center().x - this.e1.rect.attr('width') * 0.5, this.e1.center().y + this.e1.rect.attr('height') * 0.5);
      	let equation3 = this.calculEquationDroite(this.e1.center().x - this.e1.rect.attr('width') * 0.5, this.e1.center().y + this.e1.rect.attr('height') * 0.5, this.e1.center().x - this.e1.rect.attr('width') * 0.5, this.e1.center().y - this.e1.rect.attr('height') * 0.5);
      	let equation4 = this.calculEquationDroite(this.e1.center().x - this.e1.rect.attr('width') * 0.5, this.e1.center().y - this.e1.rect.attr('height') * 0.5, this.e1.center().x + this.e1.rect.attr('width') * 0.5, this.e1.center().y - this.e1.rect.attr('height') * 0.5);

      	let intersection1 = this.calculPointIntersection(mainEquation, equation1);
      	let intersection2 = this.calculPointIntersection(mainEquation, equation2);
      	let intersection3 = this.calculPointIntersection(mainEquation, equation3);
      	let intersection4 = this.calculPointIntersection(mainEquation, equation4);

      	console.log("Intersection1.x : " + intersection1.x);

      	let distance1 = this.calculDistance(this.e2.center(), intersection1);
      	let distance2 = this.calculDistance(this.e2.center(), intersection2);
      	let distance3 = this.calculDistance(this.e2.center(), intersection3);
      	let distance4 = this.calculDistance(this.e2.center(), intersection4);

      	console.log("distance1 : " + distance1);
      	console.log("distance2 : " + distance2);
      	console.log("distance3 : " + distance3);
      	console.log("distance4 : " + distance4);

      	let distanceMin = Math.min(distance1, distance2, distance3, distance4);

      	console.log("Distance min : " + distanceMin);

      	let meilleurPoint;
      	switch (distanceMin) {
      	    case distance1:
      	        meilleurPoint = intersection1;
      	        break;
      	    case distance2:
      	        meilleurPoint = intersection2;
      	        break;
      	    case distance3:
      	        meilleurPoint = intersection3;
      	        break;
      	    case distance4:
      	        meilleurPoint = intersection4;
      	        break;
      	}

      	let posX = meilleurPoint.x;
      	let posY = meilleurPoint.y;


      	console.log(meilleurPoint);



      	this.navigability = this.parent.polygon();
      	if(this.reversed){
			       this.angle += 180;
        }

      	this.navigability.attr({points: "" + (xCenter - (4 + this.getWidth()*2)) + "," + (yCenter - (2 + this.getWidth()*2)) + " " + (xCenter + (4 + this.getWidth()*2)) + "," + (yCenter) + " " + (xCenter - (4 + this.getWidth()*2)) + "," + (yCenter + (2 + this.getWidth()*2))});
      	this.navigability.attr({transform: "rotate(" + this.angle + " " + xCenter + " " + yCenter + ")"});
    		this.setNavigabilityColor(this.line.attr('stroke'));
    		this.navigability.back();
    }

    /**
     * Check of the link has a navigability
     * @return {Boolean}
     */
    hasNavigability(){
        return this.navigability != null;
    }

    /**
   	* reverse the navigability of the link
   	*/
   	reverseNavigability(){
 		    this.reversed = !this.reversed;
     }

	 /**
  	* Remove the navigability of the link
  	*/
  	removeNavigability(){
        if(this.navigability != null){
            this.navigability.remove();
			      this.navigability = null;
            this.angle = null;
			      this.reversed = false;
        }
    }
}
