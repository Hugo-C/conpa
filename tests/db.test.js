const db = require('../js/db.js');
const keys = require('../js/dbConstants.js');

// Tools

function contains(elt, array){
    for(let index = 0; index < array.length; index++){
        if(array[index] === elt){
            return true;
        }
    }
    return false;
}

function indexOf(elt, array){
    for(let index = 0; index < array.length; index++){
        if(array[index] === elt){
            return index;
        }
    }
    return -1;
}

function getArrayFromResult(result, key){
    let res = [];
    for(let index = 0; index < result.length; index++){
        res.push(result[index][key]);
    }
    return res;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Tests
// /!\ Tests must be run with the option --runInBand ( -i ) !
// Tests must be run sequentially

test('Database is reachable', async () => {
    expect.assertions(1);
    db.connect(db.MODE_TEST, function(err){
        expect(err).toBeNull();
    });
});

describe("Tests : card games", () => {
    test("When a player imports a card game, then it must be added in the database", async (done) => {
        // when we add a card game into the database
        await db.addCardGame('test1', 'Français', 'julien', cardgameAdded);
        function cardgameAdded(err, result){
            expect(err).toBeNull();
            db.cardGameExists('test1', 'Français', checkIfCardGameExists);
        }
        // then the card game has been well added in the database
        function checkIfCardGameExists(err, result){
            expect(err).toBeNull();
            expect(result).toBeTruthy();
            done();
        }
    });

    test("When a player updates a card game's description, then the old description must be replaced by the new one", async (done) => {
        // when we set the description of a card game
        await db.updateCardgameDescription('test1', 'Français', 'une petite description', descriptionHasBeenUpdated);
        function descriptionHasBeenUpdated(err){
            expect(err).toBeNull();
            db.getCardGameDescription('test1', 'Français', checkDescription);
        }
        // then the description has been well updated
        function checkDescription(err, description){
            expect(err).toBeNull();
            expect(description).toBe('une petite description');
            done();
        }
    });

    test("When a player removes a card game, then it must be removed from the database", async (done) => {
        // when a card game is removed from the database
        await db.removeCardGame('test1', 'Français', cardGameHasBeenRemoved);
        function cardGameHasBeenRemoved(err){
            expect(err).toBeNull();
            db.cardGameExists('test1', 'Français', checkIfCardGameExists);
        }
        // then card game no more exists in the database
        function checkIfCardGameExists(err, result){
            expect(err).toBeNull();
            expect(result).toBeFalsy();
            done();
        }
    });
});

describe("Tests : card games' families", () => {
    let cardGameId;

    beforeAll( async (done) => {
        await db.addCardGame('test', 'Français', 'julien', function(err, result){
            expect(err).toBeNull();
            cardGameId = result.insertId;
            done();
        });
    });

    afterAll( async (done) => {
        await db.removeCardGame('test', 'Français', function(err){
            expect(err).toBeNull();
            done();
        });
    });

    test("When a player adds a family to a card game, then the family must be well added to the database", async (done) => {
        // when wa add a family to a card game
        await db.addCardFamilyWithoutLogo('familyTest', cardGameId, familyHasBeenAdded);
        function familyHasBeenAdded(err, result){
            expect(err).toBeNull();
            db.getFamilies(cardGameId, checksCardGameFamily);
        }
        // then the family has been well added in the database
        function checksCardGameFamily(err, result){
            let families = getArrayFromResult(result, keys.CFT_KEY_NAME);
            expect(err).toBeNull();
            expect(contains('familyTest', families)).toBe(true);
            done();
        }
    });

    test("When a player removes card game's families, then the families must be removed from the database", async (done) => {
        // when we removed a family from a card game
        await db.removeCardGameFamilies('test', 'Français', familiesHasBeenRemoved);
        function familiesHasBeenRemoved(err){
            expect(err).toBeNull();
            db.getFamilies(cardGameId, checksCardGameFamily);
        }
        // then the family no more exists in the database
        function checksCardGameFamily(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(0);
            done();
        }
    });
});

describe("Tests : card games' families' cards", () => {
    let cardGameId;
    let familyId;

    beforeAll( async (done) => {
        await db.addCardGame('test', 'Français', 'julien', function(err, result){
            expect(err).toBeNull();
            cardGameId = result.insertId;
            db.addCardFamilyWithoutLogo('familyTest', cardGameId, function(err, result){
                expect(err).toBeNull();
                familyId = result.insertId;
                done();
            });
        });
    });

    afterAll( async (done) => {
        await db.removeCardGame('test', 'Français', function(err){
            expect(err).toBeNull();
            db.removeCardGameFamilies('test', 'Français', function(err){
                expect(err).toBeNull();
                done();
            });
        });
    });

    test("When a player adds a card, then it must be added and associated to the selected family", async (done) => {
        // when we add a card to a card game's family
        await db.addCard('contentTest', 'descriptionTest', familyId, cardHasBeenAdded);
        function cardHasBeenAdded(err, result){
            expect(err).toBeNull();
            db.getFamilyCards(familyId, checksFamilyCards);
        }
        // then the card exists in this family (in the database)
        function checksFamilyCards(err, result){
            expect(err).toBeNull();
            let cardsContent = getArrayFromResult(result, keys.CT_KEY_CONTENT);
            let cardsDescription = getArrayFromResult(result, keys.CT_KEY_INFORMATION);
            expect(contains('contentTest', cardsContent)).toBe(true);
            expect(contains('descriptionTest', cardsDescription)).toBe(true);
            done();
        }
    });

    test("When a player removes a card game's family, then the family's cards must be removed", async (done) => {
        // when a family is removed from a card game
        await db.removeCardGameFamilies('test', 'Français', familiesHasBeenRemoved);
        function familiesHasBeenRemoved(err){
            expect(err).toBeNull();
            db.getFamilyCards(familyId, checksFamilyCards);
        }
        // then no more cards exists in this family (in the database)
        function checksFamilyCards(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(0);
            done();
        }
    });
});

describe("Tests : tags", () => {
    test("When a player adds a tag, then the tag must be added to the database", async (done) => {
        // when we add a tag into the database
        await db.addANewTag('tagTest1', tagHasBeenAdded);
        function tagHasBeenAdded(err){
            expect(err).toBeNull();
            db.existsTag('tagTest1', tagExists);
        }
        // then the tag exists in the database
        function tagExists(err, result){
            expect(err).toBeNull();
            expect(result).toBeTruthy();
            done();
        }
    });

    test("When a player removes a tag, then the tag must be removed from the database", async (done) => {
        // when we remove a tag from the database
        await db.removeATag('tagTest1', tagHasBeenRemoved);
        function tagHasBeenRemoved(err){
            expect(err).toBeNull();
            db.existsTag('tagTest1', tagExists);
        }
        // then the tag no more exists in the database
        function tagExists(err, result){
            expect(err).toBeNull();
            expect(result).toBeFalsy();
            done();
        }
    });
});

describe("Tests : card games' tags", () => {
    let cardGameId;
    let myTags = [];
    let sampleSizeMax = 5;

    beforeAll( async (done) => {
        function addTags(nb){
            let tag = 'tagTest' + nb;
            myTags.push(tag);
            db.addANewTag(tag, function(err){
                expect(err).toBeNull();
                if(nb > 1){
                    addTags(--nb);
                }else{
                    done();
                }
            });
        }
        await db.addCardGame('test', 'Français', 'julien', function(err, result){
            expect(err).toBeNull();
            cardGameId = result.insertId;
            addTags(sampleSizeMax);
        });
    });

    afterAll((done) => {
        // Removes the tags used for these tests
        function removeUsedTags(){
            for(let index = 0; index < myTags.length; index++){
                db.removeATag(myTags[index], function(err){
                    expect(err).toBeNull();
                    if(index == myTags.length - 1){
                        done();
                    }
                });
            }
        }
        db.removeCardGame('test', 'Français', function(err){
            expect(err).toBeNull();
            removeUsedTags();
        });
    });

    test("When a player wants to retrieve all tags, all tags which are present in the database must be retrieved", async (done) => {
        // when we retrieve all tags
        await db.getAllTags(checkRetrievedTags);
        // then we are sure that all tags are well retrieved
        function checkRetrievedTags(err, result){
            let cardGameTags = getArrayFromResult(result, keys.TT_KEY_TAG);
            expect(err).toBeNull();
            expect(result.length).toEqual(myTags.length);
            for(let i = 0; i < sampleSizeMax; i++){
                expect(contains(myTags[i], cardGameTags)).toBe(true);
            }
            done();
        }
    });

    test("When a player adds a tag to a card game, then the tag must be associated to it", async (done) => {
        // we add as many tags as the sample's size
        // for each new tag, we check if the old tags are always a card game's tags
        // and the new one is a card game's tag
        function doTheTestOnSample(index){
            // when we add a tag to a card game
            db.addANewTagToCardgame(cardGameId, myTags[index], tagHasBeenAddedToCardGame);
            function tagHasBeenAddedToCardGame(err){
                expect(err).toBeNull();
                db.getCardGameTags('test', 'Français', checksCardGameTags);
            }
            // then card game's tags include the old tags plus the new one
            function checksCardGameTags(err, result){
                let tags = getArrayFromResult(result, keys.HTT_KEY_TAG);
                expect(err).toBeNull();
                expect(result.length).toEqual(index + 1);
                for(let i = 0; i <= index; i++){
                    expect(contains(myTags[i], tags)).toBe(true);
                }
                index < sampleSizeMax - 1 ? doTheTestOnSample(++index) : done();
            }
        }
        doTheTestOnSample(0);
    });

    test("When a player removes a tag from a card game, then the tag must be unassociated from it", async (done) => {
        // we remove each tag that has been add while the previous test
        // for each removed tag, we check if the old tags are always a card game's
        // tags and if the removed tag is no more a card game's tag
        function doTheTestOnSample(index){
            // when we add a tag to a card game
            db.removeATagFromCardgame(cardGameId, myTags[index], tagHasBeenRemovedFromCardGame);
            function tagHasBeenRemovedFromCardGame(err){
                expect(err).toBeNull();
                db.getCardGameTags('test', 'Français', checksCardGameTags);
            }
            // then card game's tags include the old tags minus the removed one
            function checksCardGameTags(err, result){
                let tags = getArrayFromResult(result, keys.HTT_KEY_TAG);
                expect(err).toBeNull();
                expect(tags.length).toEqual(index);
                expect(contains(myTags[index], tags)).toBe(false);
                for(let i = 0; i < index; i++){
                    expect(contains(myTags[i], tags)).toBe(true);
                }
                index > 0 ? doTheTestOnSample(--index) : done();
            }
        }
        doTheTestOnSample(sampleSizeMax - 1);
    });
});

describe("Tests : users", () => {
    test("When a user creates an account, then it must be added to database", async (done) => {
        // when a new user creates an account
        await db.registerUser('MrTest', 'MrTestPassword', 'MrTest@gmail.com', userHasBeenAdded);
        function userHasBeenAdded(err, result){
            expect(err).toBeNull();
            // then the user is added to the database (exists in the database)
            db.userExists('MrTest', function(exists){
                expect(exists).toBe(true);
                done();
            });
        }
    });

    test("When a user changes his password, then the old password must be replaced by the new one", async (done) => {
        // when a user changes his password
        await db.setPassword('MrTest', 'MrTestPasswordBis', passwordHasBeenChanged);
        function passwordHasBeenChanged(err, result){
            expect(err).toBeNull();
            // then the password is well updated
            db.getPassword('MrTest', function(err, password){
                expect(err).toBeNull();
                expect(password).toEqual('MrTestPasswordBis');
                done();
            });
        }
    });

    test("When a user deletes his account, then it must be removed from the database", async (done) => {
        // when a user removes his account
        await db.removeUser('MrTest', userHasBeenRemoved);
        function userHasBeenRemoved(err){
            expect(err).toBeNull();
            // then the user is removed from the database (no more exists in the database)
            db.userExists('MrTest', function(exists){
                expect(exists).toBe(false);
                done();
            });
        }
    });
});

describe("Tests : players' production", () => {
    let prodID;
    test("When a player saves his production, then the production must be well added in the database", async (done) => {
        // when we add a production
        await db.addNewProduction('data of the production', 'data of the legend', productionHasBeenAdded);
        function productionHasBeenAdded(err, result){
            expect(err).toBeNull();
            prodID = result;
            db.getProduction(prodID, checksProductionData);
        }
        // then the production is well added into the database
        function checksProductionData(err, productionData, legendData){
            expect(err).toBeNull();
            expect(productionData).toEqual('data of the production');
            expect(legendData).toEqual('data of the legend');
            done();
        }
    });

    test("When a player updates his production, then the old data must be replaced by the news one", async (done) => {
        // when a player updates his production
        await db.updateProduction(prodID,
          'new data of the production',
          'new data of the legend',
          productionHasBeenUpdated);
        function productionHasBeenUpdated(err){
            expect(err).toBeNull();
            db.getProduction(prodID, checksIfProductionHasBeenUpdated);
        }
        // then database's data has been updated
        function checksIfProductionHasBeenUpdated(err, productionData, legendData){
            expect(err).toBeNull();
            expect(productionData).toEqual('new data of the production');
            expect(legendData).toEqual('new data of the legend');
            done();
        }
    });

    test("When a player removes his production, then the production must be removed from the database", async (done) => {
        // when a player removes his production
        await db.removeProduction(prodID, productionHasBeenRemoved);
        function productionHasBeenRemoved(err){
            expect(err).toBeNull();
            db.getProduction(prodID, checksIfProductionAlreadyExists);
        }
        // then production no more exists in the database
        function checksIfProductionAlreadyExists(err, productionData, legendData){
            expect(err).toBeNull();
            expect(productionData).toBeNull();
            expect(legendData).toBeNull();
            done();
        }
    });
});

describe("Tests : historic and games' archive", async () => {

    beforeAll( async (done) => {
        await db.registerUser('MrSomeone', 'MrSomeonePassword', 'MrSomeone@gmail.com', function(err, result){
            expect(err).toBeNull();
            db.registerUser('MrNobody', 'MrNobodyPassword', 'MrNobody@gmail.com', function(err, result){
                expect(err).toBeNull();
                done();
            });
        });
    });

    afterAll( async (done) => {
        await db.removeUser('MrSomeone', function(err){
            expect(err).toBeNull();
            db.removeUser('MrNobody', function(err){
                expect(err).toBeNull();
                db.removeProduction(firstPlayerProdID, function(err){
                    expect(err).toBeNull();
                    db.removeProduction(secondPlayerProdID, function(err){
                        expect(err).toBeNull();
                        db.removeGameRecord(globalGameName, globalGameDate, function(err){
                            expect(err).toBeNull();
                            done();
                        });
                    });
                });
            });
        });
    });

    // used to work on the added game's record in the next tests
    // /!\ This test need to be the first one !
    let globalGameID; // id of the game used to do our tests
    let globalGameName; // name of the game used to do our tests
    let globalGameDate; // date of the game used to do our tests
    test("When a game is recorded, then a new entry must be created in the historic", async (done) => {
        // when a game is recorded into the database
        await db.recordNewGame('serverTest', 'MrTest', gameHasBeenRecorded);
        function gameHasBeenRecorded(err, gameId){
            expect(err).toBeNull();
            globalGameID = gameId;
            db.linkPlayerAndGame('MrSomeone', gameId, 'AQuestion', playerEntryHasBeenAdded);
        }
        // and a player entry added
        function playerEntryHasBeenAdded(err){
            expect(err).toBeNull();
            db.getGamesRecord('MrSomeone', checksIfHistoricContainsGameRecord);
        }
        // then the game's record can be retrieve from the database
        function checksIfHistoricContainsGameRecord(err, result){
            expect(err).toBeNull();
            let ids = getArrayFromResult(result, keys.PT_KEY_ID);
            let gameIndex = indexOf(globalGameID, ids);
            expect(gameIndex).toBeGreaterThanOrEqual(0);
            globalGameName = result[gameIndex][keys.PT_KEY_NAME];
            globalGameDate = result[gameIndex][keys.PT_KEY_DATE];
            expect(result[gameIndex][keys.PT_KEY_NAME]).toEqual('serverTest');
            expect(result[gameIndex][keys.PT_KEY_ANIMATOR]).toEqual('MrTest');
            expect(result[gameIndex][keys.HPT_KEY_QUESTION]).toEqual('AQuestion');
            done();
        }
    });

    let firstPlayerProdID; //MrSomeone's production's id
    test("When productions are saved at the end of a game, then they must be associated to the game during which they have been made", async (done) => {
        // knowing that a player has a production
        await db.addNewProduction('data of the production', 'data of the legend', productionHasBeenAdded);
        function productionHasBeenAdded(err, prodID){
            expect(err).toBeNull();
            firstPlayerProdID = prodID;
            db.recordPlayerProductionWithGameId('MrSomeone', globalGameID, firstPlayerProdID, productionHasBeenSaved);
        }
        // when a player leave a game
        function productionHasBeenSaved(err){
            expect(err).toBeNull();
            db.getProductionIDFromPlayerHistoricWithGameId('MrSomeone', globalGameID, checksIfProductionHasBeenAssociatedToTheGame);
        }
        // then the production is saved into the database and associated to the
        // game during which the production has been created
        function checksIfProductionHasBeenAssociatedToTheGame(err, prodID){
            expect(err).toBeNull();
            expect(prodID).not.toBeNull();
            db.getProduction(prodID, function(err, productionData, legendData){
                expect(err).toBeNull();
                expect(productionData).toEqual('data of the production');
                expect(legendData).toEqual('data of the legend');
                done();
            });
        }
    });

    let secondPlayerProdID; // MrNobody's productions's id
    test("When a player wants to retrieve the list of players who have played in a game, then all players who have played must be present", async (done) => {
        // knowing that we have another player in the game who made a production
        await db.linkPlayerAndGame('MrNobody', globalGameID, 'MrNobodyQuestion', playerEntryHasBeenAdded);
        function playerEntryHasBeenAdded(err){
            expect(err).toBeNull();
            db.addNewProduction('data of the production', 'data of the legend', function(err, prodID){
                expect(err).toBeNull();
                secondPlayerProdID = prodID;
                db.recordPlayerProductionWithGameId('MrNobody', globalGameID, prodID, productionHasBeenSaved);
            });
        }
        // and that his production is associated to the game
        function productionHasBeenSaved(err){
            expect(err).toBeNull();
            // when we want to retrieve the players who have played in the game
            db.getPlayersInGame(globalGameName, globalGameDate, checksGamePlayers);
        }
        // then all players who have not removed their production need to be retrieved
        function checksGamePlayers(err, result){
            expect(err).toBeNull();
            let players = getArrayFromResult(result, keys.HPT_KEY_PSEUDO);
            expect(contains('MrSomeone', players)).toBe(true);
            expect(contains('MrNobody', players)).toBe(true);
            done();
        }
    });

    test("When a player removes a production associated to a game, then this game must be no more retrievable", async (done) => {
        // when a player removes one of his production in the historic
        await db.removeProduction(firstPlayerProdID, productionHasBeenRemoved); // MrSomeone removes his production
        function productionHasBeenRemoved(err){
            expect(err).toBeNull();
            db.getHistoricEntries('MrSomeone', checksIfTheEntryIsRetrieved);
        }
        // then the game with which the removed production was associated need to be no more retrieved
        function checksIfTheEntryIsRetrieved(err, result){
            expect(err).toBeNull();
            let ids = getArrayFromResult(result, keys.PT_KEY_ID);
            expect(contains(globalGameID, ids)).toBe(false);
            done();
        }
    });

    test("When a player archives a production, then it's associated to the same game as in the historic", async (done) => {
        // when a player archives a production (knowing that it's the first one to be archived for this game)
        await db.addNewProduction('my prod data 1', 'my legend data 1', function(err, prodID){
            expect(err).toBeNull();
            db.archivePlayerProduction('MrNobody', globalGameID, prodID, productionHasBeenArchived);
        });
        function productionHasBeenArchived(err){
            expect(err).toBeNull();
            db.getArchiveEntries('MrNobody', checksArchiveEntries);
        }
        // then a new entry is created and this entry is associated to the game during which the original production has been made
        function checksArchiveEntries(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(1); // new entry has been created
            expect(result[0][keys.PT_KEY_ID]).toEqual(globalGameID);
            expect(result[0][keys.PT_KEY_NAME]).toEqual('serverTest');
            expect(result[0][keys.PT_KEY_ANIMATOR]).toEqual('MrTest');
            expect(result[0][keys.HPT_KEY_QUESTION]).toEqual('MrNobodyQuestion');
            done();
        }
    });

    test("When a player archives more than one production associated to the same game, then their are associated to the same game's archive", async (done) => {
        await sleep(1000); // because we can't have two archives at the same date (in the website it's impossible because of the page animation)
        // when a player archives a production (knowing that it's the first one to be archived for this game)
        await db.addNewProduction('my prod data 2', 'my legend data 2', function(err, prodID){
            expect(err).toBeNull();
            db.archivePlayerProduction('MrNobody', globalGameID, prodID, productionHasBeenArchived);
        });
        function productionHasBeenArchived(err){
            expect(err).toBeNull();
            db.getArchiveEntries('MrNobody', checksArchiveEntries);
        }
        // then no other entry is created, in fact it can have many archived productions associated to the same game
        function checksArchiveEntries(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(1); // only one entry for the two productions
            expect(result[0][keys.PT_KEY_ID]).toEqual(globalGameID);
            expect(result[0][keys.PT_KEY_NAME]).toEqual('serverTest');
            expect(result[0][keys.PT_KEY_ANIMATOR]).toEqual('MrTest');
            expect(result[0][keys.HPT_KEY_QUESTION]).toEqual('MrNobodyQuestion');
            done();
        }
    });

    test("When a player opens a game's archive, then all productions associated to it are retrieved", async (done) => {
        // knowing that the player has archived more than one production (associated to the same game) : previous tests !
        // when he retrieves the archived productions for this game
        await db.getProductionsFromArchive('MrNobody', globalGameName, globalGameDate, productionsHasBeenRetrieved);
        // then all archived productions associated to this game are retrieved
        function productionsHasBeenRetrieved(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(2); // in the previous test, MrNobody has archived two productions
            done();
        }
    });

    test("When a player removes all productions associated to a game's archive, then the archive is removed", async (done) => {
        // when all productions of a game's archive are removed
        await db.removeProductionsFromArchive(globalGameName, globalGameDate, 'MrNobody', productionsHasBeenRemoved);
        function productionsHasBeenRemoved(err){
            expect(err).toBeNull();
            db.getArchiveEntries('MrNobody', checksArchiveEntries);
        }
        // then the game's archive is removed from the archive table
        function checksArchiveEntries(err, result){
            expect(err).toBeNull();
            expect(result.length).toEqual(0); // we had only one game's archive
            done();
        }
    });
});
