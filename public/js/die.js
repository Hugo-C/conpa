'use strict';
Physijs.scripts.worker = 'js/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
var initScene, render, loader, box_geometry, box, material,
    renderer, scene, camera, selected;

var divDie = document.getElementById('dice');
var vectAngularVelocity;
var diceLoop;  // used to slow down the dice every 0.1 second

initScene = function () {
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(divDie.offsetWidth, divDie.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    divDie.appendChild(renderer.domElement);
    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3(0, 0, 0));  // no gravity in this case
    scene.addEventListener('update', function () {
            scene.simulate(undefined, 1);
        }
    );
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(1, 1, 0);
    camera.lookAt(scene.position);
    scene.add(camera);
    // Loader
    loader = new THREE.TextureLoader();
    box_geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    let color = new THREE.MeshFaceMaterial([
        new THREE.MeshBasicMaterial({map: loader.load("img/die/1.png")}),
        new THREE.MeshBasicMaterial({map: loader.load("img/die/2.png")}),
        new THREE.MeshBasicMaterial({map: loader.load("img/die/3.png")}),
        new THREE.MeshBasicMaterial({map: loader.load("img/die/4.png")}),
        new THREE.MeshBasicMaterial({map: loader.load("img/die/5.png")}),
        new THREE.MeshBasicMaterial({map: loader.load("img/die/6.png")})
    ]);
    material = Physijs.createMaterial(color, 0.6, 0.3);
    box = new Physijs.BoxMesh(box_geometry, material);
    box.collisions = 0;
    box.position.set(0, 0, 0);
    box.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    scene.add(box);
    requestAnimationFrame(render);

    divDie.appendChild(renderer.domElement).addEventListener('mouseup', function () {
        stopDice();
        selected = null;
        vectAngularVelocity = new THREE.Vector3(
            Math.random() * Math.PI * 10,
            Math.random() * Math.PI * 10,
            Math.random() * Math.PI * 10
        );
        box.setAngularVelocity(vectAngularVelocity);
        scene.simulate();
        diceLoop = setInterval(slowDice, 100);
    });
};


function stopDice() {
    box.setAngularVelocity(new THREE.Vector3(0, 0, 0));
    clearInterval(diceLoop);
}

function isRotating(myVect){
    return Math.abs(myVect.x) > 0.1 ||
           Math.abs(myVect.y) > 0.1 ||
           Math.abs(myVect.z) > 0.1;
}


function slowDice() {
    console.log("slowing");
    if(isRotating(vectAngularVelocity)){
        vectAngularVelocity = new THREE.Vector3(vectAngularVelocity.x * 0.9, vectAngularVelocity.y * 0.9, vectAngularVelocity.z * 0.9);
        box.setAngularVelocity(vectAngularVelocity);
    } else {
        stopDice();  // stop the dice properly
        //console.log(box.rotation);  // TODO call display card based on the die rotation
        let res = Math.floor(Math.random() * 7 + 1);
        displayNewCard(res);
    }
}


render = function () {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};
window.onload = initScene;


window.onresize = function(event) {
    renderer.setSize(divDie.offsetWidth, divDie.offsetHeight);
};