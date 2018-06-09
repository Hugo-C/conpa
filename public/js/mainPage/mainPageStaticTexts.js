$.i18n().load( {
    'en': '/i18n/en.json',
    'fr': '/i18n/fr.json'
}).done( function() {
    // Page header
    $('#pseudoLabel').i18n();
    $('.header4 section').i18n();
    // Contextual menu texts
    $('#linkContextMenu').i18n();
    // Editor tab texts
    $('#editorTab').i18n();
    // Game tab texts
    $('#gameTab').i18n();
    // Historic tab texts
    $('#historicTab').i18n();
    // Account tab texts
    $('#accountTab').i18n();
});
