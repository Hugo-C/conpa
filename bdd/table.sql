DROP TABLE IF EXISTS Card;
DROP TABLE IF EXISTS Family;
DROP TABLE IF EXISTS CardGame;
DROP TABLE IF EXISTS Users;

CREATE TABLE IF NOT EXISTS CardGame(
  id INT UNSIGNED AUTO_INCREMENT,
  name VARCHAR(20),
  language VARCHAR(5),
  PRIMARY KEY(id),
  UNIQUE INDEX uniq_cardgame (name, language));

CREATE TABLE IF NOT EXISTS Family(
  id INT UNSIGNED AUTO_INCREMENT,
  name VARCHAR(20) NOT NULL,
  logo VARCHAR(20) DEFAULT NULL,
  cardGame INT UNSIGNED NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY (cardGame) REFERENCES CardGame(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS Card(
  id INT UNSIGNED AUTO_INCREMENT,
  content TEXT NOT NULL,
  description TEXT,
  family INT UNSIGNED NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY (family) REFERENCES Family(id) ON DELETE CASCADE);

CREATE TABLE IF NOT EXISTS Users(
  pseudo VARCHAR(20),
  password CHAR(32) NOT NULL,
  email VARCHAR(255) NOT NULL,
  token CHAR(32),
  tokenExpiration DATETIME,
  status CHAR(1) DEFAULT 0,
  PRIMARY KEY(pseudo),
  UNIQUE INDEX uniq_email (email(190)));

CREATE TABLE IF NOT EXISTS Party(
  id INT UNSIGNED AUTO_INCREMENT,
  server VARCHAR(30),
  animator VARCHAR(30),
  gameDate DATETIME,
  PRIMARY KEY(id));

CREATE TABLE IF NOT EXISTS HasPlayedIn(
  pseudo VARCHAR(20) NOT NULL,
  idParty INT UNSIGNED NOT NULL,
  question VARCHAR(255),
  production TEXT,
  FOREIGN KEY (pseudo) REFERENCES Users(pseudo),
  FOREIGN KEY (idParty) REFERENCES Party(id));

DELETE TRIGGER IF NOT EXISTS AfterDeleteHistoricEntry;

DELIMITER |
CREATE TRIGGER AfterDeleteHistoricEntry AFTER DELETE
ON HasPlayedIn FOR EACH ROW
BEGIN
  DECLARE cpt INTEGER;

  SELECT COUNT(*) INTO cpt
  FROM HasPlayedIn
  WHERE idParty = OLD.idParty;

  IF cpt = 0 THEN
    DELETE FROM Party
    WHERE id = OLD.idParty;
  END IF;
END|
DELIMITER ;
