class Mosaic {

    constructor(parent){
        this.parent = parent;
        this.channels = {};
        this.parent.find('.SWA_MosaicContainer').empty();
    }

    /**
     * Replace old productions by the new ones
     */
    refreshMosaic(channelsData){
        for(let channelID in channelsData){
            if(this.channels[channelID] != null){
                this.channels[channelID].clearSVG();
                if(channelsData[channelID]['production'] == ''){
                    this.channels[channelID].productionPrivate();
                }else{
                    this.channels[channelID].productionPublic();
                    this.channels[channelID].restoreProduction(channelsData[channelID]['production']);
                }
            }
        }
    }

    activateNavigation(){
        let navButton = this.parent.find('button[name="moveElement"]');
        if(!navButton.hasClass("selected")){
            navButton.click();
        }
    }

    deactivateNavigation(){
        let navButton = this.parent.find('button[name="moveElement"]');
        if(navButton.hasClass("selected")){
            navButton.click();
        }
    }

    centerMosaicChannels(){
        for(let channel in this.channels){
            this.channels[channel].centerSVGToDefaultPosition();
        }
    }

    /**
     * Display the mosaic panel and hide the panel used to display only one production
     */
    displayMosaic(){
        this.parent.find('.SWA_Mosaic').css('display', 'block');
        this.parent.find('.SWA_Production').css('display', 'none');
        this.parent.find('.SWA_Menu').css('display', 'none');
        this.refreshMosaic();
        this.centerMosaicChannels();
        this.activateNavigation(); // allow to navigate in players production
    }

    /**
     * Display the panel used to display only one production and hide the mosaic panel
     */
    hideMosaic(){
        this.parent.find('.SWA_Mosaic').css('display', 'none');
        this.parent.find('.SWA_Production').css('display', 'block');
        this.parent.find('.SWA_Tools').css('display', 'block');
        this.deactivateNavigation(); // default state of the navigation button
    }

    /**
     * Check if the mosaic panel is displayed
     * @return {Boolean}
     */
    isMosaicDisplayed(){
        return this.parent.find('.SWA_Mosaic').css('display') === 'block';
    }

    addCenterButtonToToolBar(toolBar, channelID){
        // button used to center the view on the modified production's area
        let centerButton = document.createElement('button');
        centerButton.setAttribute('onclick', 'centerMosaicChannel("' + channelID + '")');
        centerButton.setAttribute('style', 'background-image: url("/img/gamerModule/Centrer2.png");');
        centerButton.classList.add('col-lg-offset-1', 'col-lg-10',
                                   'col-md-offset-1', 'col-md-10',
                                   'col-sm-offset-1', 'col-sm-10',
                                   'col-xs-offset-1', 'col-xs-10',
                                   'SWA_ImageButton');
        centerButton.style.height = '15%';
        centerButton.style.padding = '0';

        toolBar.appendChild(centerButton);
    }

    addPseudoDisplayerToToolBar(toolBar, channelID){
        // create a container to center the label for the pseudo
        let textContainer = document.createElement('div');
        textContainer.classList.add('rotated-text', 'channelLabel');
        textContainer.style.height = '70%';
        // create a label to display the player's pseudo
        let channelLabel = document.createElement('span');
        channelLabel.classList.add('rotated-text__inner');
        channelLabel.classList.add('SWA_MyTitle');
        channelLabel.innerHTML = channelID;
        textContainer.appendChild(channelLabel);

        toolBar.appendChild(textContainer);
    }

    addZoomIndicatorToToolBar(toolBar, channelID){
        // used to center the label
        let zoomLevelContainer = document.createElement('div');
        zoomLevelContainer.classList.add('SWA_RowFlexContainer');
        zoomLevelContainer.setAttribute('style', 'height: 15%; padding: 0;');
        // label used to display the zoom level
        let zoomLevel = document.createElement('label');
        zoomLevel.id = channelID + '_zoomLevel';
        zoomLevel.innerHTML = 'Zoom x1.00';
        zoomLevel.classList.add('SWA_RowFlexContainer', 'SWA_MyIndicator',
                                'col-lg-10', 'col-md-10',
                                'col-sm-10', 'col-xs-10',
                                'SWA_ZoomIndicator');
        zoomLevel.setAttribute('style', 'height: 90%; font-size: 0.6vw; ' +
                               'font-family: "Georgia", "Helvetica", "Times New Roman"; ' +
                               'padding: 0; text-align: center;');
        zoomLevelContainer.appendChild(zoomLevel);
        toolBar.appendChild(zoomLevelContainer);
    }

    createChannelToolBar(channel, channelID){
        // create a tool bar for channel tools
        let bar = document.createElement('div');
        bar.classList.add('channelBar');
        bar.style.paddingTop = '5px';
        bar.style.paddingBottom = '5px';
        // Add tools to the bar
        this.addCenterButtonToToolBar(bar, channelID);
        this.addPseudoDisplayerToToolBar(bar, channelID);
        this.addZoomIndicatorToToolBar(bar, channelID);

        channel.appendChild(bar);
    }

    createSVGContainer(channel){
        let svgc = document.createElement('div');
        svgc.classList.add('SWA_SVGContainer', 'SWA_CenteredImageBackground');
        channel.appendChild(svgc);
    }

    /**
     * Add a new "channel" to the mosaic
     * A "channel" is equivalent to a player's production and his pseudo
     *
     * @param {DOM element} parent : The place in the mosaic in which we add the new channel
     * @param {player} channelID : used to create the id of the channel
     */
    addChannelToRow(parent, channelID){
        // create the main container of the channel
        let prod = document.createElement('div');
        prod.setAttribute('id', channelID + '_production');
        prod.setAttribute('style', 'width: 50%; height: 100%;');
        parent.appendChild(prod);
        this.createChannelToolBar(prod, channelID);
        this.createSVGContainer(prod);
        this.channels[channelID] = new Production($('#' + channelID + '_production'), true);
        this.channels[channelID].productionPrivate();
    }

    /**
     * Add a new row to the mosaic
     */
    createNewRow(){
        let mosaic = this.parent.find('.SWA_MosaicContainer');
        let newRow = document.createElement('div');
        newRow.setAttribute('style', 'width: 100%; height: 50%;');
        newRow.classList.add('row');
        mosaic.get(0).appendChild(newRow);
    }

    /**
     * Add a new "channel" to the mosaic's last row
     * A "channel" is equivalent to a player's production and his pseudo
     * If the mosaic's last row is full, we create a new one
     *
     * @param {string} channelID : used to create the id of the channel
     */
    addNewChannel(channelID){
        let mosaic = this.parent.find('.SWA_MosaicContainer');
        let lastRow = $('.SWA_MosaicContainer > div.row:last-child')
        if(lastRow.length == 0 || lastRow.children().length === 2){
            this.createNewRow();
            lastRow = $('.SWA_MosaicContainer > div.row:last-child');
        }
        this.addChannelToRow(lastRow[0], channelID);
    }

    /**
     * Create the animator's mosaic
     * This function creates the mosaic and add a channel per players
     *
     * @param {string list} channelsID : list of all channel's id
     */
    initMosaic(channelsID){
        for(let index in channelsID){
            this.addNewChannel(channelsID[index]);
        }
        this.activateNavigation();
    }

    getMosaicChannels(){
        return this.channels;
    }

    restoreMosaicChannelsProduction(channelsProduction){
        for(let channel in this.channels){
            this.channels[channel].restoreProduction(channelsProduction[channel]);
            this.channels[channel].centerSVGToDefaultPosition();
        }
    }

    saveMosaicChannelsProduction(){
        let channelsProduction = {};
        for(let channel in this.channels){
            channelsProduction[channel] = this.channels[channel].saveProduction();
        }
        return channelsProduction;
    }

    deleteMosaicChannel(channel){
        delete this.channels[channel];
    }

    deleteAllChannels(){
        this.channels = {};
    }
}
