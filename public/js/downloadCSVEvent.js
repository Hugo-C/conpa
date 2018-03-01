var lastFocusedElement = null;

/**
 * Send a request to the server thanks to "<a ... download> html tag"
 *
 * @param {url} request : request to send
 */
function sendRequest(request){
    var downloaderTag = document.createElement("a"); // create 'a' html tag
    downloaderTag.href = request; // add request as href param
    document.body.appendChild(downloaderTag);
    downloaderTag.click(); // send request
    document.body.removeChild(downloaderTag);
    delete downloaderTag;
}

$("#exportToCSV").on("click", function(){
    var openSelectorRequest = "/editor?selector=yes";
    sendRequest(openSelectorRequest);
});

$(".cardGame").on("focus", function(){
    lastFocusedElement = this;
});

$("#validateButton").on("click", function(){
    if(lastFocusedElement != null){
        var name = document.getElementById(lastFocusedElement.id).childNodes[1].innerHTML;
        var infos = name.match(/(.*)\ \(([a-z]+)\)/);
        var downloadRequest = "/editor/exportCSV?cardGame=" + infos[1] + "&language=" + infos[2];
        sendRequest(downloadRequest);
    }
});

$("#cancelButton").on("click", function(){
    var exitSelectorRequest = "/editor?selector=no";
    sendRequest(exitSelectorRequest);
});
