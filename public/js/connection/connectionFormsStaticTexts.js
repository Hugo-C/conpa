$.i18n().load( {
    'en': '/i18n/en.json',
    'fr': '/i18n/fr.json'
}).done( function() {
    $('#form_wrapper').i18n();
});
