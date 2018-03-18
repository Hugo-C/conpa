const ERR_MESSAGE_NO_MORE_CARDS = "ERREUR : il n'y a pas assez de carte, merci de repiocher";

var cards = {};  // all cards from the deck
var familyId = [];
var cardContent = document.getElementById('cardContent');
var cardTextNode = document.createTextNode("");
cardContent.appendChild(cardTextNode);

/**
 * init variable cards with the deck
 * @param cardGame
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
 * @param family {Number} : the family to pick from, if it's not available it'll pick from the closest family available
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
        cardTextNode.nodeValue = cardPick; // display the card
        shareMyCard(family, cardPick);
    }
    return true;
}

function shareMyCard(family, card){
  socket.emit('cardPicked', {'family': family, 'cardContent': card});
}

socket.on('cardPicked', function(data){
  cardTextNode.nodeValue = data['cardContent'];
})

/**
 * display a card picked by another player
 * @param text {String} : the text of the card picked
 */
function displayCard(text){
    cardTextNode.nodeValue = text;
}


initCards("conpa", "fr");
