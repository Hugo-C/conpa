$(document).ready(function() {
    let overlay = $("#overlay");
    overlay.draggable({
        cursor: "move"
    });
    overlay.resizable({
        autoHide: true
    });
});

let overlay =  document.getElementById("overlay");
let isForcedHide = false;

class Legend{  // static class

    static addRectangles(rectangles){
        for(let r of rectangles){
            // Svg
            let divTmp = document.createElement("div");
            divTmp.setAttribute("style", "height: 49px; width: 30%; float:left");
            let height = $(divTmp).height();
            let width = $(divTmp).width();
            let draw = SVG(divTmp).size('100%', "100%");
            draw.viewbox(0, 0, width, height);
            let x = width / 2 - 20;
            let y = height / 4;
            draw.rect(width - x,  height / 2).fill(r.getFillColor()).move(x, y);
            overlay.append(divTmp);

            // Label
            let div = document.createElement("div");
            div.setAttribute("style", "width: 70%; float:right");
            let text = document.createElement("textarea");
            let color = this.colorToText(r.getFillColor());
            text.setAttribute("placeholder", $.i18n(color) + " " + $.i18n("rectangle"));
            text.setAttribute("class", "legend");
            div.appendChild(text);
            overlay.append(div);
        }
    }

    static addLinks(links){
        for(let link of links){
            // Svg
            let divTmp = document.createElement("div");
            divTmp.setAttribute("style", "height: 49px; width: 30%; float:left");
            let height = $(divTmp).height();
            let width = $(divTmp).width();
            let draw = SVG(divTmp).size('100%', "100%");
            draw.viewbox(0, 0, width, height);
            let x = width / 2 - 20;
            let y = height / 2 - link.getWidth() / 2;
            let svgLine = draw.line(x, y, width - x, y);

            let strokeColor = link.getColor();
            // change the color if it's black in order to contrast with the overlay
            if(strokeColor ===  "#333333")
                strokeColor = "#666666";
            svgLine.stroke({
                width: link.getWidth(),
                color: strokeColor,
                dasharray: link.getDasharray()
            });
            overlay.append(divTmp);

            // Label
            let div = document.createElement("div");
            div.setAttribute("style", "width: 70%; float:right");
            let text = document.createElement("textarea");
            let color = this.colorToText(link.getColor());
            let placeholder = $.i18n(color) + " " +  $.i18n("link");
            if(link.getDasharray())
                placeholder += " " + $.i18n("withDash");
            text.setAttribute("placeholder", placeholder);
            text.setAttribute("class", "legend");
            div.appendChild(text);
            overlay.append(div);
        }
    }

    static refresh(rectangles, links){
        this.clear();
        // Rectangles
        let rectSet = [];  // list of different rectangles
        for(let r1 of rectangles) {
            let keep = true;
            // we check if this kind of rectangle is already to be added
            for(let r2 of rectSet){
                if(r1.getFillColor() === r2.getFillColor())
                    keep = false;
            }
            if(keep)
                rectSet.push(r1);
        }
        this.addRectangles(rectSet);

        // Links
        let linksSet = [];  // list of different rectangles
        for(let l1 of links) {
            let keep = true;
            // we check if this kind of rectangle is already to be added
            for(let l2 of linksSet){
                if(l1.getColor() === l2.getColor() && l1.getDasharray() === l2.getDasharray() && l1.getWidth() === l2.getWidth()){
                    keep = false;
                }
            }
            if(keep)
                linksSet.push(l1);
        }
        this.addLinks(linksSet);
    }

    /**
     * Clear all entries in the legend
     */
    static clear(){
        // Remove previous html except hidden div used for resizing
        let nodes = overlay.childNodes;
        for (let i = 0; i < nodes.length;) {
            if(nodes[i].style.display !== "none"){
                overlay.removeChild(nodes[i]);
            } else {
                i++
            }
        }
    }

    static show(){
        if(!isForcedHide)
            overlay.style.display = "block";
    }

    static hide(){
        overlay.style.display = "none";
    }

    static forceShow(){
        isForcedHide = false;
        this.show();
    }

    static forceHide(){
        isForcedHide = true;
        this.hide();
    }

    /**
     * Convert a hex code color to a human readable color
     * if the conversion failed, the color black is returned and a message is printed
     * @param {string} color : the hex color to transform
     * @return {string}
     */
    static colorToText(color){
        let resColor = "blackColor";
        switch (color){
            case "#333333":
            case "#000000":
                resColor = "blackColor";
                break;
            case "#ed1723":
                resColor = "redColor";
                break;
            case "#0fb32d":
                resColor = "greenColor";
                break;
            case "#ffee24":
                resColor = "yellowColor";
                break;
            case "#3344ff":
                resColor = "blueColor";
                break;
            case "#d5d5d5":
                resColor = "whiteColor";
                break;
            case "#a531ff":
                resColor = "purpleColor";
                break;
            case "#8c5b35":
                resColor = "brownColor";
                break;
            default:
                console.log("this color doesn't look like anything to me : " + color);
        }
        return resColor;
    }
}