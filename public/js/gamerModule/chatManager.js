
function actualizeChatPlayersList(players){
    console.log(players);
    var playerSelector = $('#chatPlayers');
    playerSelector.children().remove();
    playerSelector.append('<option value="all">general</option>');
    for(var index in players){
        if(players[index] != sessionStorage.pseudo){ // we not displays the pseudo of the current player
            playerSelector.append($('<option>', {
                value: players[index],
                text : players[index]
            }));
        }
    }
}

/**
 * Displays a message in the player tchat area
 *
 * @param {string} msg : message to display
 * @param {string} sender : pseudo of the sender
 * @param {string} color : color of the text
 */
function insertTextInChat(msg, sender, color){
    var tchat = $("#messages");
    var senderTag = '<span style="font-weight:bold; color:' + color + '">' + sender + ' : </span>';
    var msgTag = '<span style="font-weight:bold; color:' + color + '">' + msg + '</span>';
    tchat.append('<p style="margin:0;">' + senderTag + msgTag + '</p>');
}

/**
 * Return the color of the message according to the addressee
 *
 * @param {string} dest : the addressee
 * @return {string} : a color
 */
function getColor(dest){
    switch (dest) {
        case "all":
            return "black";
        case "system":
            return "red";
        default:
            return "brown";
    }
}

/** sends our message to the server */
function sendInputText(){
    var dest = $("#chatPlayers").val();
    var inputText = $("#inputBox").val();
    var msg = inputText.match(/^Write your message here !/) ? "" : inputText;
    var whisper = dest != "all";
    socket.emit('message', {'dest': dest, 'msg': msg});
    insertTextInChat(msg, sessionStorage.pseudo, getColor(dest));
    $("#inputBox").val(""); // clean the input field
}

/* sends the entered message when player press to the 'send' button */
$("#sendButton").on("click", function(){
    sendInputText();
});

/* sends the entered message when player press to 'enter' */
$("#inputBox").on('keyup', function (e) {
    if (e.keyCode == 13) sendInputText();
});

/**
 * Process tchat message on client side
 * Displays the received message
 *
 * form of received data :
 * {'sender': [sender's pseudo], 'msg': [message body],
 *  'whisper': [boolean which indicates if message is public or private]}
 */
socket.on('message', function(data){
    insertTextInChat(data["msg"], data["sender"], getColor(data["dest"]));
});
