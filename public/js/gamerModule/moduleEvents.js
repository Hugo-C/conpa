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

// Displays or hides productions selector bar
$("#displayList").on("click", function(){
    var productionList = $("#gamePanel > :nth-child(2) > :first-child");
    var productionArea = $("#gamePanel > :nth-child(2) > :last-child");
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

$("#setPrivacy").on("click", function(){
    var button = $("button#setPrivacy");
    if(button.css('background-image').match(/.*\/img\/gamerModule\/private\.svg.*/)){
        button.css('background-image', 'url("/img/gamerModule/public.svg")');
    }else{
        button.css('background-image', 'url("/img/gamerModule/private.svg")');
    }
});

// remove default text when user wants to enter text
$("#notesArea").on("focus", function(){
    var value = $("textarea#notesArea").val();
    if(value.match(/^Write your notes here !/)){
        execNotesAreaCommand("delete");
    }
});

// displays default text if the area is empty and has not the focus
$("#notesArea").focusout(function(){
    var value = $("textarea#notesArea").val();
    var value = $.trim(value);
    if(value == ""){
        $("textarea#notesArea").val("Write your notes here !");
    }
});

// remove default text when user wants to enter text
$("#inputBox").on("focus", function(){
    var value = $("input#inputBox").val();
    if(value.match(/^Write your message here !/)){
        $("input#inputBox").val("");
    }
});

// displays default text if the area is empty and has not the focus
$("#inputBox").focusout(function(){
    var value = $("input#inputBox").val();
    var value = $.trim(value);
    if(value === ""){
        $("input#inputBox").val("Write your message here !");
    }
});

$("#color").on("click", function(){
    $("#svgMenu").css('display', 'none');
    $("#colorMenu").css('display', 'block');
});

$("#colorMenu button").on("click", function(){
    var selectedColor = $(this).val();
    $("#colorMenu").css('display', 'none');
    $("#svgMenu").css('display', 'block');
    $("#color").val(selectedColor);
    $("#color").css('background-color', 'url("/img/gamerModule/' + selectedColor + '.jpg")');
});

$("#startDice").on("click", function(){
    initScene();
    throwDie();
});
