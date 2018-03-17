const PLAYER_ROLE = 1;
const ANIMATOR_ROLE = 2;

const PROD_AREA_PUBLIC = 10;

module.exports = class Player {
  constructor(pseudo, role){
    this.pseudo = pseudo;
    this.role = role;
    this.prodStatus = PROD_AREA_PUBLIC;
  }

  getPseudo(){
    return this.pseudo;
  }

  getRole(){
    return this.role;
  }

  pseudoEquals(pseudo){
    return this.pseudo == pseudo;
  }
}
