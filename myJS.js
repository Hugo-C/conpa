function boutonClique(){
    if(document.getElementById("bouton").src.indexOf("text.png") > -1) document.getElementById("bouton").src = "textC.png";
    else document.getElementById("bouton").src = "text.png";
}