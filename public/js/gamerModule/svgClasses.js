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
  constructor(x, y, width, height, fill, parent){
      this.parent = parent;
      this.rect = parent.rect(width, height);
      this.rect.attr({
        x: x,
        y: y,
        fill: fill
      });
      this.text = null;
      this.links = [];
      myElements.push(this);
  }

  /**
   * Associate a textarea with the rectangle
   */
  addTextArea(){
      var group = this.parent.group(); // use to "bind" the rectangle and the textArea

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

 /*
  * Display the selection border
  */
  select() {
      this.rect.animate(100).stroke({'color': 'black', 'width': 5});
  }

 /*
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
   * Link two rect with a line
   *
   * @param {Rectangle} e : rectangle with which we want to create a link
   */
  linkRect(e){
      if(!this.isLinkedTo(e)){
          var link = new Link(this, e, this.parent);
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
      removeFromArray(myElements, this);
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
    constructor(e1, e2, parent) {
        this.e1 = e1;
        this.e2 = e2;
		    this.parent = parent;

    		this.navigability = null;
    		this.angle = null;
        this.reversed = false;
        let pos1 = e1.center();
        let pos2 = e2.center();
        this.line = parent.line(pos1.x, pos1.y, pos2.x, pos2.y).stroke({width: STROKE_WIDTH});
        this.line.back();
        myLinks.push(this);
    }

    /**
     * change the value of dasharray property of the link
     * @param {float} dasharrayValue : new value for the dasharray property
     */
    setDasharray(dasharrayValue){
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
     * Return the value of width property
     * @return {number} : the value of width property
     */
    getWidth(){
        return this.line.attr('stroke-width');
    }

    /**
     * Remove the link
     */
    myRemove() {
		    this.removeNavigability();
        this.line.remove();
        this.e1.removeLink(this);
        this.e2.removeLink(this);
        removeFromArray(myLinks, this);
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

      	let xCenter = 0.5 * (this.line.attr('x2') + this.line.attr('x1'));
      	let yCenter = 0.5 * (this.line.attr('y2') + this.line.attr('y1'));
      	this.navigability = this.parent.polygon();

       	let pos1 = this.e1.center();
       	let pos2 = this.e2.center();
        this.angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) * 180 / Math.PI;
      	if(this.reversed){
			       this.angle += 180;
        }

      	this.navigability.attr({points: "" + (xCenter - (4 + this.getWidth()*2)) + "," + (yCenter - (2 + this.getWidth()*2)) + " " + (xCenter + (4 + this.getWidth()*2)) + "," + (yCenter) + " " + (xCenter - (4 + this.getWidth()*2)) + "," + (yCenter + (2 + this.getWidth()*2))});
      	this.navigability.attr({transform: "rotate(" + this.angle + " " + xCenter + " " + yCenter + ")"});
    		this.setNavigabilityColor(this.line.attr('stroke'));
    		this.navigability.back();
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

	 /**
  	* reverse the navigability of the link
  	*/
  	reverseNavigability(){
		    this.reversed = !this.reversed;
    }

	 /**
	  * change the value of color property of the navigability
    * @param {string} colorValue : color's code ("#??????")
  	*/
  	setNavigabilityColor(colorValue){
        this.navigability.attr({style: "fill:" + colorValue + ";stroke:" + colorValue});
    }
}
