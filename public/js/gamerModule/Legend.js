class Legend{

    constructor(parent){
        this.parent = parent;
        this.overlay = parent.find('.SWA_Overlay');
        this.overlay.draggable({
            cursor: "move"
        });
        this.overlay.resizable({
            autoHide: true
        });
        this.overlayContent = parent.find('.SWA_OverlayContent');
        this.overlayContent.css('margin-right', '-' + getScrollBarWidth() + 'px');
        this.isForceHide = false;
    }

    addRectangles(rectangles){
        //let overlayContent = $(".overlayContent")[0];
        for(let r of rectangles){
            // row
            let row = document.createElement("div");
            row.setAttribute("style", "height: 5vw; padding: 10px; border-bottom: 1px solid grey;");
            row.classList.add("col-lg-12");
            row.classList.add("col-md-12");
            row.classList.add("col-sm-12");
            row.classList.add("SWA_LegendRow");
            row.classList.add("SWA_RowFlexContainer");
            // Svg
            let divTmp = document.createElement("div");
            divTmp.setAttribute("style", "height: 60%; padding: 0");
            divTmp.classList.add("col-lg-2");
            divTmp.classList.add("col-md-2");
            divTmp.classList.add("col-sm-2");
            divTmp.classList.add("SWA_RowFlexContainer");

            let draw = SVG(divTmp).size('100%', "100%");
            draw.rect("100%",  "100%").fill(r.getFillColor()).move(0, 0);
            row.append(divTmp);

            // Label
            let div = document.createElement("div");
            div.setAttribute("style", "height:90%; padding-right:0");
            div.classList.add("col-lg-10");
            div.classList.add("col-md-10");
            div.classList.add("col-sm-10");
            let text = document.createElement("textarea");
            let color = this.colorToText(r.getFillColor());
            text.setAttribute("placeholder", $.i18n(color) + " " + $.i18n("rectangle"));
            //text.setAttribute("class", "legend");
            div.appendChild(text);
            row.append(div);
            this.overlayContent[0].append(row);
        }
    }

    addLinks(links){
        //let overlayContent = $(".overlayContent")[0];
        for(let link of links){
            // row
            let row = document.createElement("div");
            row.setAttribute("style", "height: 5vw; padding: 10px; border-bottom: 1px solid grey;");
            row.classList.add("col-lg-12");
            row.classList.add("col-md-12");
            row.classList.add("col-sm-12");
            row.classList.add("SWA_LegendRow");
            row.classList.add("SWA_RowFlexContainer");
            // Svg
            let divTmp = document.createElement("div");
            divTmp.setAttribute("style", "height: 60%; padding: 0");
            divTmp.classList.add("col-lg-2");
            divTmp.classList.add("col-md-2");
            divTmp.classList.add("col-sm-2");
            divTmp.classList.add("SWA_RowFlexContainer");

            let draw = SVG(divTmp).size('100%', "100%");
            let svgLine = draw.line(0, "50%", "100%", "50%");

            let strokeColor = link.getColor();
            if(strokeColor ===  "#333333")
                strokeColor = "#666666";
            svgLine.stroke({
                width: link.getWidth(),
                color: strokeColor,
                dasharray: link.getDasharray()
            });
            row.append(divTmp);

            // Label
            let div = document.createElement("div");
            div.setAttribute("style", "height:90%");
            div.classList.add("col-lg-10");
            div.classList.add("col-md-10");
            div.classList.add("col-sm-10");
            let text = document.createElement("textarea");
            let color = this.colorToText(link.getColor());
            let placeholder = $.i18n(color) + " " +  $.i18n("link");
            if(link.getDasharray())
                placeholder += " " + $.i18n("withDash");
            text.setAttribute("placeholder", placeholder);
            //text.setAttribute("class", "legend");
            div.appendChild(text);
            row.append(div);
            this.overlayContent[0].append(row);
        }
    }

    /**
     * Refresh the legend by clearing it and adding again all rectangles and links
     * @param {Rectangle []} rectangles : an array of rectangles
     * @param {Link []} links : an array of links
     */
    refresh(rectangles, links){
        let textBackup = this.saveLegend();
        this.clear();
        // Rectangles
        let rectSet = [];  // list of different rectangles
        for(let r1 of rectangles) {
            let keep = true;
            // we check if this kind of rectangle is already to be added
            for(let r2 of rectSet){
                if(r1.getFillColor() === r2.getFillColor()) keep = false;
            }
            if(keep) rectSet.push(r1);
        }
        this.addRectangles(rectSet);

        // Links
        let linksSet = [];  // list of different links
        for(let l1 of links) {
            let keep = true;
            // we check if this kind of rectangle is already to be added
            for(let l2 of linksSet){
                if(l1.getColor() === l2.getColor()
                && l1.getDasharray() === l2.getDasharray()
                && l1.getWidth() === l2.getWidth()){
                    keep = false;
                }
            }
            if(keep) linksSet.push(l1);
        }
        this.addLinks(linksSet);
        this.restoreLegend(textBackup);
    }

    /**
     * Clear all entries in the legend
     */
    clear(){
        //let overlayContent = $(".overlayContent")[0];
        // Remove previous html except hidden div used for resizing
        let nodes = this.overlayContent[0].childNodes;
        for (let i = 0; i < nodes.length;) {
            if(nodes[i].style.display !== "none"){
                this.overlayContent[0].removeChild(nodes[i]);
            } else {
                i++
            }
        }
    }

    /**
     * Checks if an html's container contains a rect tag
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : container in which we want to check if he
     *                               contains a rect tag
     */
    containsRectangle(entry){
        if(entry.find('rect').length == 1){
            return true;
        }else{
            return false;
        }
    }

    /**
     * convert a legend's entry ( for a rectangle ) into an object
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : container in which there are a rect tag
     *                               and a textarea tag
     * @return {object} : { 'fill' : rectangle's color, 'text' : textarea's value }
     */
    rectangleEntryToObject(entry){
        let rect = entry.find('rect');
        let text = entry.find('textarea');
        let data = {};
        data['fill'] = rect.attr('fill');
        data['text'] = text.val();
        return data;
    }

    /**
     * convert a legend's entry ( for a link ) into an object
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : container in which there are a line tag
     *                               and a textarea tag
     * @return {object} : { 'fill' : link's color, 'width' : link's width,
     *                      'dasharray' : link's dasharray, 'text' : textarea's value }
     */
    linkEntryToObject(entry){
        let link = entry.find('line');
        let text = entry.find('textarea');
        let data = {};
        data['fill'] = link.attr('stroke');
        data['width'] = link.attr('stroke-width');
        data['dasharray'] = link.attr('stroke-dasharray');
        data['text'] = text.val();
        return data;
    }

    /**
     * Saves all information required to restore legend's textarea
     * @return {object} : an object which contains the main information
     *
     * object structure : {'rectangles': [ ... ], 'links': [ ... ]}
     * the rectangles's table and links's table contain a list of JS object which describe
     * all the legend's entry ( links and rectangles characteristics with them associated text )
     * - Look at rectangleEntryToObject function to see the form of the rectangles's table's objects
     * - Look at linkEntryToObject function to see the form of the links's table's objects
     */
    saveLegend(){
        let data = {'rectangles': [], 'links': []};
        let entries = $('.SWA_LegendRow');
        for(let index = 0; index < entries.length; index++){
            let entry = $(entries[index]);
            if(this.containsRectangle(entry)){
                data['rectangles'].push(this.rectangleEntryToObject(entry));
            }else{
                data['links'].push(this.linkEntryToObject(entry));
            }
        }
        return data;
    }

    /**
     * Restores for each legend's entries the associated text
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : legend'entry for which we want to restore the
     *                              associated text
     * @param {object} data : all information required to restore legend's textarea
     *
     * - Look at saveLegend function to see the form of data
     */
    restoreRectangleEntry(entry, data){
        let rect = entry.find('rect');
        let text = entry.find('textarea');
        for(let index = 0; index < data.length; index++){
            if(rect.attr('fill') === data[index]['fill']){
                text.val(data[index]['text']);
            }
        }
    }

    /**
     * Restores the textarea of a link's entry
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : legend's entry container
     * @param {object array} data : all information about links's entries
     */
    restoreLinkEntry(entry, data){
        let link = entry.find('line');
        let text = entry.find('textarea');
        for(let index = 0; index < data.length; index++){
            if(link.attr('stroke') === data[index]['fill']
            && link.attr('stroke-width') === data[index]['width']
            && link.attr('stroke-dasharray') === data[index]['dasharray']){
                text.val(data[index]['text']);
            }
        }
    }

    /**
     * Restores the textarea of an entry
     * ( use jquery for the entry param )
     * @param {HTMLElement} entry : legend's entry container
     * @param {object array} data : all information about rectangles's entries
     */
    restoreLegend(data){
        let entries = $('.SWA_LegendRow');
        for(let index = 0; index < entries.length; index++){
            let entry = $(entries[index]);
            if(this.containsRectangle(entry)){
                this.restoreRectangleEntry(entry, data['rectangles']);
            }else{
                this.restoreLinkEntry(entry, data['links']);
            }
        }
    }

    /**
     * Display the legend (if not forceHide)
     */
    show(){
        if(!this.isForceHide){
            this.overlay.css('display', 'block');
        }
    }

    /**
     * Hide the legend
     */
    hide(){
        this.overlay.css('display', 'none');
    }

    /**
     * Display the legend and don't allow the function hide to hide it
     */
    forceShow(){
        this.isForceHide = false;
        this.show();
    }

    /**
     * Hide the legend and don't allow the function show to display it
     */
    forceHide(){
        this.isForceHide = true;
        this.hide();
    }

    /**
     * Convert a hex code color to a human readable color
     * if the conversion failed, the color black is returned and a message is printed
     * @param {string} color : the hex color to transform
     * @return {string}
     */
    colorToText(color){
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
