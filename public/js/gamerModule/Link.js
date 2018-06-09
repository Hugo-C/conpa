const STROKE_WIDTH = "4";
const STROKE_COLOR = "#333333";
const CORNER_DETECTION_MARGIN = 25;

class Link {

    /**
     * Create a new link between two link
     * @param {Rectangle} e1 : first element to link
     * @param {Rectangle} e2 : second element to link
     * @param {SVGSVGElement | SVGGElement} prod : the parent svg Element
     */
    constructor(e1, e2, prod) {
        this.e1 = e1;
        this.e2 = e2;
		    this.prod = prod;

		    this.delta = 19;
        this.dasharray = 0;
        this.navigability = null;
        let pos1 = e1.center();
        let pos2 = e2.center();
        this.line = prod.master.line(pos1.x, pos1.y, pos2.x, pos2.y).stroke({width: STROKE_WIDTH, color: STROKE_COLOR});
        this.line.back();
        prod.myLinks.push(this);
        this.prod.refreshLegend();
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
        this.prod.refreshLegend();
    }

    /**
     * change the value of width property of the link and the size of his navigability if it has one
     * @param {number} widthValue : new value for the width property
     */
    setWidth(widthValue){
        this.line.stroke({ width: widthValue });
        if (this.navigability != null) {
            this.delta = widthValue*2 + 10;
    	    this.addNavigability();
        }
        this.prod.refreshLegend();
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
        this.prod.refreshLegend();
    }

    /**
	  * change the value of color property of the navigability
    * @param {string} colorValue : color's code ("#??????")
  	*/
  	setNavigabilityColor(colorValue){
        this.navigability.attr({style: "fill:" + colorValue + "; stroke:" + colorValue});
    }

    static distance(x1, y1, x2, y2){
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
        return Math.abs(Link.distance(x1, y1, x, y) + Link.distance(x, y, x2, y2) - Link.distance(x1, y1, x2, y2)) < 1;
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
        this.prod.refreshLegend();
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

      	let navPosition = this.calculNavPosition();

      	let posX = navPosition.x;
      	let posY = navPosition.y;

      	this.navigability = this.prod.master.polygon();

      	this.navigability.attr({ points: "" + (posX - (4 + this.getWidth() * 2)) + "," + (posY - (2 + this.getWidth() * 2)) + " " + (posX + (4 + this.getWidth() * 2)) + "," + (posY) + " " + (posX - (4 + this.getWidth() * 2)) + "," + (posY + (2 + this.getWidth() * 2)) });
      	this.navigability.attr({ transform: "rotate(" + this.angle + " " + posX + " " + posY + ")" });
      	this.setNavigabilityColor(this.line.attr('stroke'));
      	this.navigability.back();

      	this.line.plot(pos1.x, pos1.y, posX, posY);
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
    reverseNavigability() {
        let tempE = this.e1;
        this.e1 = this.e2;
        this.e2 = tempE;
    }

	 /**
  	* Remove the navigability of the link
  	*/
  	removeNavigability(){
        if(this.navigability != null){
            this.navigability.remove();
            this.navigability = null;
            this.refreshPosition(); // the line need to go a bit further
        }
  	}


    // Geom functions

  	segement(xA, yA, xB, yB) {
  	    return { xa: xA, ya: yA, xb: xB, yb: yB };
  	}

  	calculLineEquation(xa, ya, xb, yb) {
  	    let alpha = (yb - ya) / (xb - xa);
  	    let beta = ya - alpha * xa;
  	    return { a: alpha, b: beta };
  	}

  	calculPointIntersection(eq1, eq2) {
  	    let pointX = (eq1.b - eq2.b) / (eq2.a - eq1.a);
  	    let pointY = (((eq2.a * eq1.b) - (eq2.a * eq2.b)) / eq2.a - eq1.a) + eq2.b;
  	    return { x: pointX, y: pointY };
  	}

  	isInsideRectangle(rectCenterX, rectCenterY, width, height, x, y) {
  	    return (x >= rectCenterX - width * 0.5 && x <= rectCenterX + width * 0.5 && y >= rectCenterY - height * 0.5 && y <= rectCenterY + height * 0.5);
  	}

  	calculDistance(p1, p2) {
  	    return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
  	}

  	calculNavPosition() {
  	    let pointsIntersection = [];

  	    let segements = [this.segement(this.e2.center().x + (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y - (this.e2.rect.attr('height') + this.delta) * 0.5, this.e2.center().x + (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y + (this.e2.rect.attr('height') + this.delta) * 0.5),
                         this.segement(this.e2.center().x + (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y + (this.e2.rect.attr('height') + this.delta) * 0.5, this.e2.center().x - (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y + (this.e2.rect.attr('height') + this.delta) * 0.5),
      	                 this.segement(this.e2.center().x - (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y + (this.e2.rect.attr('height') + this.delta) * 0.5, this.e2.center().x - (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y - (this.e2.rect.attr('height') + this.delta) * 0.5),
      	                 this.segement(this.e2.center().x - (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y - (this.e2.rect.attr('height') + this.delta) * 0.5, this.e2.center().x + (this.e2.rect.attr('width') + this.delta) * 0.5, this.e2.center().y - (this.e2.rect.attr('height') + this.delta) * 0.5)];
  	    var self = this;

  	    if (this.e1.center().x == this.e2.center().x) {
  	        segements.forEach(function (seg) {
  	            if (seg.ya == seg.yb) {
  	                pointsIntersection.push({ x: self.e1.center().x, y: seg.ya });
  	            }
  	        });
  	    } else if (this.e1.center().y == this.e2.center().y) {
  	        segements.forEach(function (seg) {
  	            if (seg.xa == seg.xb) {
  	                pointsIntersection.push({ x: seg.xa, y: self.e1.center().y });
  	            }
  	        });
  	    } else {
  	        let mainEquation = this.calculLineEquation(this.e2.center().x, this.e2.center().y, this.e1.center().x, this.e1.center().y);
  	        segements.forEach(function (seg) {
  	            if (seg.ya == seg.yb) {
  	                pointsIntersection.push({ x: ((seg.ya - mainEquation.b) / mainEquation.a), y: (seg.ya) });
  	            } else if (seg.xa == seg.xb) {
  	                pointsIntersection.push({ x: (seg.xa), y: (mainEquation.a * seg.xa + mainEquation.b) });
  	            }
  	        });
  	    }
  	    let i = 0;
  	    while (i < pointsIntersection.length) {
  	        if (!this.isInsideRectangle(this.e2.center().x, this.e2.center().y, this.e2.rect.attr('width') + this.delta, this.e2.rect.attr('height') + this.delta, pointsIntersection[i].x, pointsIntersection[i].y)) {
  	            pointsIntersection.splice(i, 1);
  	        } else {
  	            i++;
  	        }
  	    }

  	    let distanceMin = this.calculDistance(this.e1.center(), pointsIntersection[0]);

  	    for (let i = 1; i < pointsIntersection.length; i++) {
  	        let dist = this.calculDistance(this.e1.center(), pointsIntersection[i]);
  	        if (dist < distanceMin) {
  	            distanceMin = dist;
  	        }
  	    }

  	    let bestPoint;

  	    pointsIntersection.forEach(function (pt) {
  	        if (self.calculDistance(self.e1.center(), pt) == distanceMin) {
  	            bestPoint = pt;
  	        }
  	    });

  	    return { x: bestPoint.x, y: bestPoint.y };
  	}
}
