function execNotesAreaCommand(cmd){
    document.getElementById("notesArea").select();
    document.execCommand(cmd);
}

$("#clear").on("click", function(){
    execNotesAreaCommand("delete");
});

$("#copy").on("click", function(){
    execNotesAreaCommand("copy");
});

$("#undo").on("click", function(){
    execNotesAreaCommand("undo");
});

$("#displayList").on("click", function(){
    var productionList = $("#productionList");
    var productionArea = $("#productionArea");
    var displayButton = $("#displayList");
    if(productionList.css('display') == 'none'){
        productionList.css('display', 'block');
        productionArea.css('width', '');
        displayButton.css('background-image', 'url("/img/gamerModule/hide.svg")');
    }else{
        productionList.css('display', 'none');
        productionArea.css('width', '100%');
        displayButton.css('background-image', 'url("/img/gamerModule/display.svg")');
    }
});

$("#privacy").on("click", function(){
    var button = $("button#privacy");
    if(button.css('background-image').match(/.*\/img\/gamerModule\/private\.svg.*/)){
        button.css('background-image', 'url("/img/gamerModule/public.svg")');
    }else{
        button.css('background-image', 'url("/img/gamerModule/private.svg")');
    }
});

$("#notesArea").on("focus", function(){
    var value = $("textarea#notesArea").val();
    if(value.match(/^Write your notes here !/)){
        execNotesAreaCommand("delete");
    }
});

$("#notesArea").focusout(function(){
    var value = $("textarea#notesArea").val();
    var value = $.trim(value);
    if(value == ""){
        $("textarea#notesArea").val("Write your notes here !");
    }
});

$("#inputField").on("focus", function(){
    var value = $("input#inputField").val();
    if(value.match(/^Write your message here !/)){
        $("input#inputField").val("");
    }
});

$("#inputField").focusout(function(){
    var value = $("input#inputField").val();
    var value = $.trim(value);
    if(value === ""){
        $("input#inputField").val("Write your message here !");
    }
});
