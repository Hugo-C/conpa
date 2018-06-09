var editedProduction = null;

function openProductionEditor(parent, production){
    displayPanel(parent, parent.find('.productionEditor'), '100%', '100%');

    editedProduction = new Production(parent.find('.productionEditor'), false);
    if(production['production'] == ''){
        editedProduction.restoreProduction(production['production']);
    }else{
        editedProduction.restoreProduction(JSON.parse(production['production']));
        if(production['legend'] !== ''){
            editedProduction.restoreLegend(JSON.parse(production['legend']));
        }
    }
    editedProduction.selectTools(['createRect', 'color', 'moveElement', 'centerSVG', 'legend']);
    editedProduction.initToolsListeners();
}

function disposeProductionEditor(parent){
    editedProduction.dispose();
    editedProduction = null;
}
