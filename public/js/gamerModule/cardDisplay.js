const ERR_MESSAGE_NO_MORE_CARDS = "ERREUR : il n'y a pas assez de carte, merci de repiocher";
const LOGO_DIRECTORY = "img/gamerModule/cardGameLogos/";

var cards = {};  // all cards from the deck
var cardTextNode = document.createTextNode("");
document.getElementById('cardContent').appendChild(cardTextNode);

/**
 * Init variable cards with cards from the specified cardGame
 * @param cardGame {String} : name of the cardGame
 * @param language {String} : language of the cardGame
 */
function initCards(cardGame, language){
    let client = new HttpClient();
    client.get("/gamerModule/cards?cardGame=" + cardGame + "&language=" + language, function(response) {
        cards = JSON.parse(response);
        console.log(cards);
    });
}

/**
 * Pick a new card from the deck and display it
 * @param family {String} : the family to pick from, if it's not available it'll pick from the closest family available
 * @return {boolean} : true if a card is pick, false if all cards from the family were already picked
 */
function displayNewCard(family){
    if(cards[family] === undefined){  // support for family as a number
        let familiesId = Object.keys(cards);
        family = familiesId[family % familiesId.length];
    }
    if(cards[family] === undefined || cards[family].length === 0){
        cardTextNode.nodeValue = ERR_MESSAGE_NO_MORE_CARDS;
        return false;
    } else {
        let cardPick = cards[family]["cards"][Math.floor(Math.random() * cards[family]["cards"].length)];
        removeFromArray(cards[family]["cards"], cardPick);  // we don't want to pick it again
        displayCard(family, cardPick, cards[family]["logo"]);
        shareMyCard(family, cardPick);
    }
    return true;
}

/**
 * Share a card with all the other member of the server
 * @param family {String} : the family of the card picked
 * @param card {String} : the content of the card picked
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
    displayCard(data['family'], data['cardContent']);
});

/**
 * Display a card and it's family with the specified text content
 * @param family {String} : the family of the card picked
 * @param text {String} : the content of the card picked
 * @param logo {String} : the relative path to the family logo
 */
function displayCard(family, text, logo){
    triggerCssAnimation(cardContent);
    //cardFamilyNode.nodeValue = family;
    cardTextNode.nodeValue = text;
    document.getElementById("cardFamilyLogo").src = LOGO_DIRECTORY + cards[family]["logo"];
}

/**
 * Trigger the css animation applied on the element id
 * @param element {HTMLElement}
 */
function triggerCssAnimation(element){
    let id = element.id;
    element.id = null;
    void element.offsetWidth;
    element.id = id;
}

initCards("conpa", "fr"); //TODO: choose card game at the creation of the game server
