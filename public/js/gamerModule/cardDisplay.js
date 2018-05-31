const LOGO_DIRECTORY = "img/gamerModule/cardGameLogos/";
const DEFAULT_LOGO = "noLogo.svg";  // all credit to anbileru adaleru

var cards = {};  // all cards from the deck
var cardTextNode = document.createTextNode("");
document.getElementById('cardContent').appendChild(cardTextNode);

/**
 * Init variable cards with cards from the specified cardGame
 * @param cardGame {String} : name of the cardGame
 * @param language {String} : language of the cardGame
 */
function initCards(cardGame, language){
    if(sessionStorage.unload === 'false'){ // we retrieve card only the fist time, not at each reload of the page
        let client = new HttpClient();
        client.get("/gamerModule/cards?cardGame=" + cardGame + "&language=" + language, function(response) {
            cards = JSON.parse(response);
            initLogoForDie(cards);
        });
    }
    else {
        initLogoForDie(cards);
    }
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
    if(cards[family] === undefined){
        displaySelectCardPanel();
        return true;
    }else if(cards[family]['cards'].length === 0){
        cardTextNode.nodeValue = $.i18n("noMoreCards");
        return false;
    }else{
        let cardPick = cards[family]["cards"][Math.floor(Math.random() * cards[family]["cards"].length)];
        displayCard(family, cardPick);
        removeFromArray(cards[family]["cards"], cardPick);  // we don't want to pick it again
        shareMyCard(family, cardPick);
        return true;
    }
}

/**
 * Share a card with all the other member of the server
 * @param family {String} : the family of the card picked
 * @param card {String} : the content of the card picked
 */
function shareMyCard(family, card) {
    let question = $('#question').text();
    socket.emit('cardPicked', {
        'family': family,
        'cardContent': card,
        'question': question,
        'pseudo': sessionStorage.pseudo
    });
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
    $('#playerQuestion span').text(data['question']);
    $('#playerTurn > span').text(data['pseudo']);
});

socket.on('downloadCardGame', function(data){
    initCards(data['cardGameName'], data['cardGameLanguage']);
});

/**
 * Display a card and it's family with the specified text content
 * @param family {String} : the family of the card picked
 * @param text {String} : the content of the card picked
 */
function displayCard(family, text){
    let cardContent = document.getElementById("cardContent");
    triggerCssAnimation(cardContent);
    cardTextNode.nodeValue = text;
    if(cards[family]["logo"] != null){
        document.getElementById("cardFamilyLogo").style.display = "block";
        document.getElementById("cardFamilyLogo").src = LOGO_DIRECTORY + cards[family]["logo"];
    }else{
        document.getElementById("cardFamilyLogo").style.display = "block";
        document.getElementById("cardFamilyLogo").src = LOGO_DIRECTORY + DEFAULT_LOGO;
    }
    document.getElementById("familyLogoDiv").style.display = "inline-block";
    document.getElementById("familyLogoText").textContent = family;
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

/**
 * Display each card's family to allow the user to pick a new card
 * @param {String} family : card's family to display
 */
function displayFamily(family){
    // container in which there are an image to represent a cardgame and a button
    // to pick a card
    let parent = document.createElement('div');
    parent.classList.add('familyDisplayer', 'col-lg-2', 'col-md-2',
                         'col-sm-2', 'col-xs-2');

    let imageContainer = document.createElement('div');
    imageContainer.classList.add('row');
    let image = document.createElement('img');
    image.classList.add('col-lg-12', 'col-md-12',
                        'col-sm-12', 'col-xs-12',
                        'imageBackground');
    image.setAttribute('style', 'height: 100%; padding: 0px;');
    imageContainer.appendChild(image);
    image.src = '/img/gamerModule/family.png';
    parent.appendChild(imageContainer);

    let selector = document.createElement('button');
    selector.classList.add('col-lg-12', 'col-md-12',
                           'col-sm-12', 'col-xs-12',
                           'myCustomButton');
    selector.setAttribute('style', 'padding: 0px; font-weight: normal;');
    selector.setAttribute('onclick', 'selectNewCard("' + family + '")');
    selector.innerHTML = family;
    parent.appendChild(selector);

    $('#selectCardPanel .gamePanelBody > div')[0].appendChild(parent);
}

/**
 * Display and refresh the card's selector
 */
function displaySelectCardPanel(){
    $('#selectCardPanel').css('display', 'block');
    $('#productionPanel').css('display', 'none');
    // we need to clear the container because some cardgames can have been
    // already displayed
    $('#selectCardPanel .gamePanelBody > div').empty();
    for(let family in cards){
        if(cards[family]['cards'].length > 0){
            displayFamily(family);
        }
    }
}

/**
 * This function is called when a player clicks on the buttons used to
 * pick a new card
 * @param {String} family : card's family in which the player has picked a card
 */
function selectNewCard(family){
    displayNewCard(family);
    $('#selectCardPanel').css('display', 'none');
    $('#productionPanel').css('display', 'block');
}
