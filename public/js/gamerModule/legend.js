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
        // Remove previous html except hidden div used for resizing
        let nodes = overlay.childNodes;
        for (let i = 0; i < nodes.length;) {
            if(nodes[i].style.display !== "none"){
                overlay.removeChild(nodes[i]);
            } else {
                i++
            }
        }

        for(let r of rectangles){
            // Svg
            let divTmp = document.createElement("div");
            divTmp.setAttribute("style", "height: 49px; width: 50%; float:left");
            let height = $(divTmp).height();
            let width = $(divTmp).width();
            let draw = SVG(divTmp).size('100%', "100%");
            draw.viewbox(0, 0, width, height);
            draw.rect(width / 2, height / 2).fill(r.rect.attr('fill')).move(width / 2, height / 4);
            overlay.append(divTmp);

            // Label
            let div = document.createElement("div");
            div.setAttribute("style", "width: 50%; float:right");
            let text = document.createElement("textarea");
            let color = "#ffffff";
            switch (r.rect.attr('fill')){  // TODO make a dedicated function / enum
                case "#ed1723":
                    color = "red";
                    break;
                case "#0fb32d":
                    color = "green";
                    break;
                case "#ffee24":
                    color = "yellow";
                    break;
                case "#3344ff":
                    color = "blue";
                    break;
                case "#d5d5d5":
                    color = "gray";
                    break;
                case "#a531ff":
                    color = "purple";
                    break;
                case "#8c5b35":
                    color = "brown";
                    break;
                default:
                    console.log("this color doesn't look like anything to me : " + r.rect.attr('fill'));

            }
            text.setAttribute("placeholder", color + " rectangle" );
            text.setAttribute("class", "legend");
            div.appendChild(text);
            overlay.append(div);
        }
    }

    static refresh(rectangles, links){  // TODO refresh only rectangles or links
        let rectSet = [];  // list of different rectangles
        for(let r1 of rectangles) {
            let keep = true;
            // we check if this kind of rectangle is already to be added
            for(let r2 of rectSet){
                if(r1.rect.attr('fill') === r2.rect.attr('fill'))
                    keep = false;
            }
            if(keep)
                rectSet.push(r1);
        }
        Legend.addRectangles(rectSet);
    }
}
