
const PLAYER_ROLE = 1;
const ANIMATOR_ROLE = 2;

module.exports = class Player {

  constructor(pseudo, role){
      this.pseudo = pseudo;
      this.role = role;
      this.question = '';
  }

  /**
   * Return the pseudo of a player
   * @return {string} : player's pseudo
   */
  getPseudo(){
      return this.pseudo;
  }

  /**
   * Return the role of a player
   * @return {integer} : player's role flag
   */
  getRole(){
      return this.role;
  }

  /**
   * Tests if a pseudo corresponding to his own pseudo
   * @return {boolean} : true if pseudos are equals, false in the other case
   */
  pseudoEquals(pseudo){
      return this.pseudo == pseudo;
  }

  /**
   * Return the question of a player
   * @return {string} : player's question
   */
  getQuestion(){
      return this.question;
  }

  getStatus(){
      return this.status;
  }

  /**
   * Update the question of a player
   * @param {string} newQuestion : new version of the player's question
   */
  setQuestion(newQuestion){
      this.question = newQuestion;
  }

  /**
   * Tests if a player is ready
   * (a player is considered as ready if his question is different than the empty string)
   */
  isReady(){
      return this.question != ''; // player is ready when he has defined his question
  }

  /**
   * Tests if a player is an animator
   * @return {boolean} : true if the player is an animator, false in the other case
   */
  isAnimator(){
      return this.role == ANIMATOR_ROLE;
  }

  recordPlayer(database, party){
      database.linkPlayerAndParty(this.pseudo, party, this.question, function(err){
          if(err) console.log(err);
      });
  }
}
