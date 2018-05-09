var lastFocusedElement = null;

/**
 * Send a request to the server thanks to "<a ... download> html tag"
 *
 * @param {url} request : request to send
 */
function sendRequest(request){
    let downloaderTag = document.createElement("a"); // create 'a' html tag
    downloaderTag.href = request; // add request as href param
    document.body.appendChild(downloaderTag);
    downloaderTag.click(); // send request
    document.body.removeChild(downloaderTag);
    delete downloaderTag;
}

$("#exportToCSV").on("click", function(){
    let openSelectorRequest = "/editor?selector=yes";
    sendRequest(openSelectorRequest);
});

$(".cardGame").on("focus", function(){
    lastFocusedElement = this;
});

$("#validateButton").on("click", function(){
    if(lastFocusedElement != null){
        let name = document.getElementById(lastFocusedElement.id).childNodes[1].innerHTML;
        let infos = name.match(/(.*) \(([a-z]+)\)/);
        let downloadRequest = "/editor/exportCSV?cardGame=" + infos[1] + "&language=" + infos[2];
        sendRequest(downloadRequest);
    }
});

$("#cancelButton").on("click", function(){
    let exitSelectorRequest = "/editor?selector=no";
    sendRequest(exitSelectorRequest);
});
