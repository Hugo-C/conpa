
function insertTextInChat(msg, sender, whisper){
    var tchat = $("#messages");
    var color = whisper ? "brown" : "black";
    var senderTag = '<span style="font-weight:bold; color:' + color + '">' + sender + ' : </span>';
    var msgTag = '<span style="font-weight:bold; color:' + color + '">' + msg + '</span>';
    tchat.append('<p style="margin:0;">' + senderTag + msgTag + '</p>');
}

function sendInputText(){
    var dest = $("#chatPlayers").val();
    var msg = $("#inputBox").val();
    var whisper = dest != "all";
    socket.emit('message', {'dest': dest, 'msg': msg});
    insertTextInChat(msg, sessionStorage.pseudo, whisper);
    $("#inputBox").val("");
}

$("#sendButton").on("click", function(){
    sendInputText();
});

$("#inputBox").on('keyup', function (e) {
    if (e.keyCode == 13) sendInputText();
});

socket.on('message', function(data){
    insertTextInChat(data["msg"], data["sender"], data["whisper"]);
});
