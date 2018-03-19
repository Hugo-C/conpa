
/**
 * Displays a message in the player tchat area
 *
 * @param {string} msg : message to display
 * @param {string} sender : pseudo of the sender
 * @param {boolean} whisper : boolean which indicates if message is public or private
 */
function insertTextInChat(msg, sender, whisper){
    var tchat = $("#messages");
    var color = whisper ? "brown" : "black";
    var senderTag = '<span style="font-weight:bold; color:' + color + '">' + sender + ' : </span>';
    var msgTag = '<span style="font-weight:bold; color:' + color + '">' + msg + '</span>';
    tchat.append('<p style="margin:0;">' + senderTag + msgTag + '</p>');
}

/* sends our message to the server */
function sendInputText(){
    var dest = $("#chatPlayers").val();
    var inputText = $("#inputBox").val();
    var msg = inputText.match(/^Write your message here !/) ? "" : inputText;
    var whisper = dest != "all";
    socket.emit('message', {'dest': dest, 'msg': msg});
    insertTextInChat(msg, sessionStorage.pseudo, whisper);
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
 * form of accepted data :
 * {'sender': [sender's pseudo], 'msg': [message body],
 *  'whisper': [boolean which indicates if message is public or private]}
 */
socket.on('message', function(data){
    insertTextInChat(data["msg"], data["sender"], data["whisper"]);
});
