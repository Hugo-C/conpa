const STROKE_WIDTH = "5";

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
    text.style.backgroundColor = "transparent";

    htmlCompatibilyTag.appendChild(text);
    group.add(this.rect);
    document.getElementById(group.attr('id')).appendChild(htmlCompatibilyTag);

    this.text = htmlCompatibilyTag;
  }

 /*
  * Display the selection border
  */
  select() {
      this.rect.animate().stroke({'color': 'black', 'width': 2});
  }

 /*
  * Hide the selection border
  */
  unselect() {
      this.rect.animate().stroke({'width': 0});
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
	  link.line.opacity(0.7);
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

        let pos1 = e1.center();
        let pos2 = e2.center();
        this.line = parent.line(pos1.x, pos1.y, pos2.x, pos2.y).stroke({width: STROKE_WIDTH});
        this.line.back();
        myLinks.push(this);
    }

    /**
     * Remove the link
     */
    myRemove() {
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
