'use strict';
Physijs.scripts.worker = 'js/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

const DIR_IMG = "img/die/";
const NO_LOGO_IMG = "noLogo.png";

var divDie;
var render, req, loader, box_geometry, box, material,
    renderer, scene, ground_material, ground, camera, selected, vectAngularVelocity, diceLoop;
let sidePictures = [];

let zGravity;

function initScene() {
    divDie = $('#scene')[0];
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(divDie.offsetWidth, divDie.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    divDie.appendChild(renderer.domElement);

    // Scene
    if (scene == null) {
        scene = new Physijs.Scene;
    }
    scene.addEventListener('update', updateScene);

    // Camera
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set( 70, 70, 70 );
    camera.lookAt( scene.position );
    scene.add( camera );

    // Loader
    loader = new THREE.TextureLoader();

    // Ground
    let mesh = new THREE.MeshBasicMaterial({ transparent: true });
    ground_material = Physijs.createMaterial( mesh, 0.8, 0.3);
    ground = new Physijs.BoxMesh(new THREE.BoxGeometry(1000, 0.5, 1000), ground_material, 0 );
    ground.depthWrite = false;
    scene.add(ground);
    doDispose(mesh);

    // Die
    box_geometry = new THREE.BoxGeometry( 12, 12, 12 );
    let color = new THREE.MeshFaceMaterial([
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[0])}),
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[1])}),
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[2])}),
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[3])}),
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[4])}),
        new THREE.MeshBasicMaterial({map:loader.load(sidePictures[5])}),
    ]);
    material = Physijs.createMaterial(color, 0.6, 0.3);
    doDispose(color);
    box = new Physijs.BoxMesh(box_geometry, material);
    box.position.set(8, 55, -70);
    box.collisions = 0;
    scene.add(box);

    // Update
    req = requestAnimationFrame( render );
    scene.simulate();
}

render = function () {
    req = requestAnimationFrame(render);
    renderer.render(scene, camera);
    if (zGravity > 0) {
        zGravity -= 0.25;
        scene.setGravity(new THREE.Vector3(0, -30, zGravity));
    }
};

function updateScene() {
    scene.simulate(undefined, 1);
}

// clear all the obj's ressources
function doDispose(obj) {
    if (obj !== null) {
        if (obj.children != null) {
            for (let i = 0; i < obj.children.length; i++) {
                doDispose(obj.children[i]);
            }
        }

        if (obj.geometry) {
            obj.geometry.dispose();
            obj.geometry = undefined;
        }
        if (obj.material) {
            if (obj.material.map) {
                obj.material.map.dispose();
                obj.material.map = undefined;
            }
            obj.material.dispose();
            obj.material = undefined;
        }
    }
    obj = undefined;
}

// Returns the number of the face of the die according to the vertices colliding with the ground
function numeroFace(arrayV){
    let i = 0;
    let cpt;
    let foundV = false;
    let listV = [[4,5,6,7], [0,1,2,3], [2,3,6,7], [0,1,4,5], [1,3,4,6], [0,2,5,7]];
    while (i < 6 && !foundV){
        cpt = 0;
        for (let j = 0; j < 4; j++){
            if (listV[i][j] === arrayV[j]) cpt++;
        }
        if (cpt === 4) foundV = true;
        i++;
    }
    let keys = Object.keys(cards);
    return keys[i-1];
}

function initLogoForDie(cards){
    sidePictures = [];
    let hasLogo = false;
    // try to fetch custom logo
    let families = Object.keys(cards);
    for(let i = 0; i < 6; i++){
        if(i >= families.length){
            sidePictures.push(DIR_IMG + NO_LOGO_IMG);
        } else {
            let family = cards[families[i]];
            if(family["logo"] !== undefined) {
                hasLogo = true;
                sidePictures.push(DIR_IMG + family["logo"]);
            } else {
                sidePictures.push(DIR_IMG + NO_LOGO_IMG);
            }
        }
    }

    // if the deck has no logo at all, we use the default die
    if (!hasLogo) {
        sidePictures = [];
        for(let i = 1; i <= 6; i++){
            sidePictures.push(DIR_IMG + i + ".png");
        }
    }
}

// Display the card and delete the scene of the die
function deleteScene() {

    // Research the vertices colliding with the ground
    let verticesList = [];
    for (let vertexIndex = 0; vertexIndex < box.geometry.vertices.length; vertexIndex++){

        let localVertex = box.geometry.vertices[vertexIndex].clone();
        let globalVertex = localVertex.applyMatrix4(box.matrix);
        let directionVector = globalVertex.sub(box.position);

        let ray = new THREE.Raycaster(box.position, directionVector.clone().normalize());
        let collisionResults = ray.intersectObject(ground);
        if ( collisionResults.length > 0)
        {
            verticesList.push(vertexIndex);
        }
    }
    displayNewCard(numeroFace(verticesList));
    cancelAnimationFrame(req);

    scene.removeEventListener('update', updateScene, false);

    doDispose(renderer);
    doDispose(loader);
    scene.remove(ground);
    scene.remove(box);
    scene.remove(camera);

    divDie.removeChild(divDie.lastChild);
    $('#divProduction').css('display', 'flex');
    $('#scene').remove();
    Legend.show();
}

function handleDie() {
    if(box.position.y < 6.3) {
        clearInterval(diceLoop);
        setTimeout(deleteScene, 2500);
    }
}

function throwDie() {
    box.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    scene.add(box);
    Legend.hide();

    vectAngularVelocity = new THREE.Vector3(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    box.setAngularVelocity(vectAngularVelocity);

    zGravity = 42;
    scene.setGravity(new THREE.Vector3( 0, -30, zGravity ));
    scene.simulate();
    diceLoop = setInterval(handleDie, 100);
}
