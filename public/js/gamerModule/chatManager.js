
function actualizeChatPlayersList(players){
    console.log(players);
    let playerSelector = $('#chatPlayers');
    playerSelector.children().remove();
    playerSelector.append('<option value="all">general</option>');
    for(let index in players){
        if(players[index] !== sessionStorage.pseudo){ // we not displays the pseudo of the current player
            playerSelector.append($('<option>', {
                value: players[index],
                text : players[index]
            }));
        }
    }
}

function scrollAtBottom(container){
    container[0].scrollTop = container[0].scrollHeight - container[0].clientHeight;
}

/**
 * Displays a message in the player tchat area
 *
 * @param {string} msg : message to display
 * @param {string} sender : pseudo of the sender
 * @param {string} color : color of the text
 */
function insertTextInChat(msg, sender, color){
    let chat = $("#messages");
    let isScrollAtBottom = chat[0].scrollHeight - chat[0].scrollTop <= chat[0].clientHeight
    let senderTag = '<span style="font-size: 0.9vw; font-weight:bold; color:' + color + '">' + sender + ' : </span>';
    let msgTag = '<span style="font-size: 0.9vw; font-family: sans-serif, arial; color:' + color + '">' + msg + '</span>';
    chat.append('<p style="margin:0;">' + senderTag + msgTag + '</p>');

    if(isScrollAtBottom) scrollAtBottom(chat);
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
    let dest = $("#chatPlayers").val();
    let msg = $("#inputBox").val();
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
    if (e.keyCode === 13) sendInputText();
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
