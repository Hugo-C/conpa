exports.CARD_GAME_TABLE = "CardGame";
exports.CGT_KEY_ID = 'id';
exports.CGT_KEY_NAME = "name";
exports.CGT_KEY_LANGUAGE = "language";
exports.CGT_KEY_AUTHOR = "author";
exports.CGT_KEY_DESCRIPTION = "description";

exports.TAGS_TABLE = "Tags";
exports.TT_KEY_TAG = "tag";

exports.HAS_TAGS_TABLE = "HasTags";
exports.HTT_KEY_CARDGAME_ID = "cardGame";
exports.HTT_KEY_TAG = "tag";

exports.CARD_FAMILY_TABLE = "Family";
exports.CFT_KEY_ID = "id";
exports.CFT_KEY_NAME = "name";
exports.CFT_KEY_LOGO = "logo";
exports.CFT_KEY_CARD_GAME = "cardGame";

exports.CARD_TABLE = "Card";
exports.CT_KEY_ID = "id";
exports.CT_KEY_CONTENT = "content";
exports.CT_KEY_INFORMATION = "description";
exports.CT_KEY_CARD_FAMILY = "family";

exports.USER_TABLE = "Users";
exports.UT_KEY_PSEUDO = "pseudo";
exports.UT_KEY_EMAIL = "email";
exports.UT_KEY_TOKEN = "token";
exports.UT_KEY_TOKEN_EXPIRATION = "tokenExpiration";
exports.UT_KEY_PASSWORD = "password";
exports.UT_CONNECT = "status";

exports.PARTY_TABLE = "Party";
exports.PT_KEY_ID = "id";
exports.PT_KEY_SERVER = "server";
exports.PT_KEY_ANIMATOR = "animator";
exports.PT_KEY_DATE = "gameDate";

exports.HAS_PLAYED_IN_TABLE = "HasPlayedIn";
exports.HPT_KEY_PSEUDO = "pseudo";
exports.HPT_KEY_PARTY = "idParty";
exports.HPT_KEY_QUESTION = "question";
exports.HPT_KEY_PRODUCTION = "production";
exports.HPT_KEY_LEGEND = "legend";
