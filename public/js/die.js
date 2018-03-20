'use strict';
Physijs.scripts.worker = 'js/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
var initScene, render, loader, box_geometry, box, material,
    renderer, scene, camera, selected;

var divDie = document.getElementById('productionArea');
var initScene, render, loader, box_geometry, box, material,
    renderer, scene, ground_material, ground, camera, selected;
var vectAngularVelocity;
var diceLoop;

function initScene(){
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
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set( 60, 50, 60 );
    camera.lookAt( scene.position );
    scene.add( camera );
    // Loader
    loader = new THREE.TextureLoader();
    ground_material = Physijs.createMaterial(new THREE.MeshBasicMaterial({transparent: true}), 0.8, 0.3);
    ground = new Physijs.BoxMesh(new THREE.BoxGeometry(1000, 0.5, 1000), ground_material, 0 );
    ground.depthWrite = false;
    scene.add( ground );
    box_geometry = new THREE.BoxGeometry( 12, 12, 12 );
    var color = new THREE.MeshFaceMaterial([
        new THREE.MeshBasicMaterial({map:loader.load("img/die/1.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/2.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/3.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/4.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/5.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/6.png")})
    ]);
    material = Physijs.createMaterial( color, 0.6, 0.3 );
    box = new Physijs.BoxMesh( box_geometry, material);
    box.collisions = 0;
    box.position.set(8, 55, 8);
    box.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    scene.add( box );
    requestAnimationFrame( render );
    scene.simulate();
}

render = function () {
    requestAnimationFrame(render);
    renderer.render(scene, camera);
};

function deleteScene(){
    divDie.removeChild(divDie.lastChild);
}

function handleDie() {
    if(box.position.y < 6.3) {
        let res = Math.floor(Math.random() * 7 + 1);
        displayNewCard(res);
        clearInterval(diceLoop);
        setTimeout(deleteScene, 2000);
    }
}

function lancer() {
    box.position.set(8, 55, 8);
    box.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    scene.add(box);
    vectAngularVelocity = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    box.setAngularVelocity(vectAngularVelocity);

    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.simulate();
    diceLoop = setInterval(handleDie, 100);
}

//window.onload = initScene;
//initScene();