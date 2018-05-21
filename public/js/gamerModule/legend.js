$(document).ready(function() {
    let overlay = $("#overlay");
    overlay.draggable({
        cursor: "move"
    });
    overlay.resizable({
        autoHide: true
    });
});

class Legend{  // static class

    static addRectangles(rectangles){
        let overlay =  document.getElementById("overlay");
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
            let color = Legend.colorToText(r.getFillColor());
            text.setAttribute("placeholder", color + " rectangle" );
            text.setAttribute("class", "legend");
            div.appendChild(text);
            overlay.append(div);
        }
    }

    static addLinks(links){
        let overlay =  document.getElementById("overlay");
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
            console.log("COULEUR : " + strokeColor);
            if(strokeColor ===  "#333333")
                strokeColor ="#acacac";
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
            let color = Legend.colorToText(link.getColor());
            let placeholder = color + " link";
            if(link.getDasharray())
                placeholder += " with dash";
            text.setAttribute("placeholder", placeholder);
            text.setAttribute("class", "legend");
            div.appendChild(text);
            overlay.append(div);
        }
    }

    static refresh(rectangles, links){
        Legend.clear();
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
        Legend.addRectangles(rectSet);

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
        Legend.addLinks(linksSet);
    }

    /**
     * Clear all entries in the legend
     */
    static clear(){
        let overlay =  document.getElementById("overlay");
        // Remove previous html except hidden div used for resizing
        let nodes = overlay.childNodes;
        for (let i = 0; i < nodes.length;) {
            if(nodes[i].style.display !== "none"){
                overlay.removeChild(nodes[i]);
            } else {
                i++
            }
        }
        console.log("legend cleared");
    }

    /**
     * Convert a hex code color to a human readable color
     * if the conversion failed, the color black is returned and a message is printed
     * @param {string} color : the hex color to transform
     * @return {string}
     */
    static colorToText(color){
        let resColor = "black";
        switch (color){
            case "#333333":
            case "#000000":
                resColor = "black";
                break;
            case "#ed1723":
                resColor = "red";
                break;
            case "#0fb32d":
                resColor = "green";
                break;
            case "#ffee24":
                resColor = "yellow";
                break;
            case "#3344ff":
                resColor = "blue";
                break;
            case "#d5d5d5":
                resColor = "white";
                break;
            case "#a531ff":
                resColor = "purple";
                break;
            case "#8c5b35":
                resColor = "brown";
                break;
            default:
                console.log("this color doesn't look like anything to me : " + color);
        }
        return resColor;
    }
}
