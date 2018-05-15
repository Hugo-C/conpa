$.i18n().load( {
    'en': '/i18n/en.json',
    'fr': '/i18n/fr.json'
}).done( function() {
    $('#gamePanel').i18n();
    $('#gameBar').i18n();
    $('#productionPanel').i18n();
    $('#questionPanel').i18n();
});
