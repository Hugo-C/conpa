const fs = require('fs');
const logger = require("../js/logger");

module.exports = class Trace {
    constructor(){
        this.data = {trace: []};
    }

    /**
     * Add a new trace
     * @param {String} actor : the actor of the action
     * @param {String} action : the action to be traced
     * @param {String} value : the value associate to the action
     * @param {String} target : the action's target
     */
    add(actor, action, value, target){  // FIXME add the possibility to overide default timestamp
        let myTrace = {"timestamp": new Date(), "actor": actor, "action": action,"value": value, "target": target};
        this.data.trace.push(myTrace);
        logger.debug("add a trace : " + JSON.stringify(myTrace));
    }

    /**
     * Save the trace inside a json file
     * if no filename is set, use test.json
     * @param {String} filename : the name of the file to save
     */
    save(filename){
        if(filename == null){
            filename = "test.json";
        }
        filename = "./../traces/" + filename;
        if(!filename.endsWith(".json")){
            filename += ".json";
        }
        fs.writeFile(filename, JSON.stringify(this.data), function(err) {
                if (err){
                    logger.error(err);
                }
                logger.verbose("saved a trace file : " + filename);
            }
        );
    }
};
