
function saveCurrentState(){

    sessionStorage.unload = 'true';
    sessionStorage.players = JSON.stringify(playersList);
    sessionStorage.tchat = $('#messages')[0].outerHTML;
    sessionStorage.productionData = JSON.stringify(saveProduction());
}

function restoreCurrentState(){

    playersList = JSON.parse(sessionStorage.players);
    $('#messages')[0].outerHTML = sessionStorage.tchat;
    restoreProduction(JSON.parse(sessionStorage.productionData));

    delete sessionStorage.players;
    delete sessionStorage.tchat;
    delete sessionStorage.productionData;
}

$(window).on('unload', function(evt){
    saveCurrentState();
});

$(window).on('load', function(evt){
    if(sessionStorage.unload != null && sessionStorage.unload == 'true'){
        restoreCurrentState();
    }
    delete sessionStorage.unload;
});

// These two functions stay here for the moment because they can change again !
// (Maybe replace them by similar functions that work with svg ids)

function saveProduction(){
    var production = {'rectangles' : [], 'links': []};
    for(var index in myElements){
        var data = {};
        data['id'] = myElements[index].rect.attr('id');
        data['x'] = myElements[index].rect.attr('x');
        data['y'] = myElements[index].rect.attr('y');
        data['width'] = myElements[index].rect.attr('width');
        data['height'] = myElements[index].rect.attr('height');
        data['fill'] = myElements[index].rect.attr('fill');
        data['text'] = $(myElements[index].text).children().val();
        production['rectangles'].push(data);
    }

    for(var index in myLinks){
        var data = {};
        data['idRect1'] = myLinks[index].e1.rect.attr('id');
        data['idRect2'] = myLinks[index].e2.rect.attr('id');
        data['strokeWidth'] = myLinks[index].line.attr('stroke-width');
        data['strokeDasharray'] = myLinks[index].line.attr('stroke-dasharray');
        data['fill'] = myLinks[index].line.attr('stroke');
        data['navigability'] = myLinks[index].navigability != null;
        data['navAngle'] = myLinks[index].angle;
        production['links'].push(data);
    }
    return production;
}

function restoreProduction(data){
    var buffer = {};

    var rectangles = data['rectangles'];
    for(var index in rectangles){
        var rect = new Rectangle(rectangles[index]['x'],
                                 rectangles[index]['y'],
                                 rectangles[index]['width'],
                                 rectangles[index]['height'],
                                 rectangles[index]['fill'],
                                 master);
        rect.addTextArea();
        $(myElements[index].text).children().val(rectangles[index]['text']);
        buffer[rectangles[index]['id']] = rect;
    }

    var links = data['links'];
    for(var index in links){
        buffer[links[index]['idRect1']].linkRect(buffer[links[index]['idRect2']]);
        myLinks[index].line.attr({'stroke-width': links[index]['strokeWidth']});
        myLinks[index].line.attr({'stroke-dasharray': links[index]['strokeDasharray']});
        myLinks[index].line.attr({'stroke': links[index]['fill']});
        if(links[index]['navigability']){
            myLinks[index].addNavigability(false);
            if(myLinks[index].angle != links[index]['navAngle']){
                myLinks[index].addNavigability(true);
            }
        }
    }

}
