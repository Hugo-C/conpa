const ERR_MESSAGE_NO_MORE_CARDS = "ERREUR : il n'y a pas assez de carte, merci de repiocher";

var cards = {};  // all cards from the deck
var familyId = [];
var cardContent = document.getElementById('cardContent');
var cardTextNode = document.createTextNode("");
cardContent.appendChild(cardTextNode);

/**
 * init variable cards with the deck
 *
 * @param {string} cardGame : cardGame's name
 * @param {string} language : cardGame's language
 */
function initCards(cardGame, language){
    let client = new HttpClient();
    client.get("/gamerModule/cards?cardGame=" + cardGame + "&language=" + language, function(response) {
        cards = JSON.parse(response);
        console.log(cards);
        familyId = Object.keys(cards);
    });
}

/**
 * Pick a new card from the deck and display it
 * @param {Integer} family : the family to pick from, if it's not available it'll pick from the closest family available
 * @return {boolean} : true if a card is pick, false if all cards from the family were already picked
 */
function displayNewCard(family){
    family = familyId[family % familyId.length];
    if(cards[family] === undefined || cards[family].length === 0){
        cardTextNode.nodeValue = ERR_MESSAGE_NO_MORE_CARDS;
        return false;
    } else {
        let cardPick = cards[family][Math.floor(Math.random() * cards[family].length)];
        removeFromArray(cards[family], cardPick);  // we don't want to pick it again
        triggerCssAnimation();
        cardTextNode.nodeValue = cardPick; // display the card
        shareMyCard(family, cardPick);
    }
    return true;
}

/**
 * Sends the card you picked to the server
 *
 * @param {string} family : card's family
 * @param {string} card : card's content
 */
function shareMyCard(family, card){
  socket.emit('cardPicked', {'family': family, 'cardContent': card});
}

/**
 * Process "cardPicked" message
 * This message is send by the server when a player have picked a new card
 * When this message is received, we display the card on the game bar
 *
 * form of received data : {'family': picked card's family, 'cardContent': picked card's content}
 */
socket.on('cardPicked', function(data){
    displayCard(data['cardContent']);
});

/**
 * display a card picked by another player
 * @param {String} text : the text of the card picked
 */
function displayCard(text){
    triggerCssAnimation();
    cardTextNode.nodeValue = text;
}

/**
 * Play an animation when we display a new card
 */
function triggerCssAnimation(){
    cardContent.id = "fakeId";
    void cardContent.offsetWidth;
    cardContent.id = "cardContent";
}


initCards("conpa", "fr"); //TODO: choose card game at the creation of the game server
