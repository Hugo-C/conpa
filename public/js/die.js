'use strict';
Physijs.scripts.worker = 'js/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';
var divDie;
var render, req, loader, box_geometry, box, material,
    renderer, scene, ground_material, ground, camera, selected, vectAngularVelocity, diceLoop;

let zGravity;
let cameraZPosition;

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
    camera.position.set( 80, 70, 80 );
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
        new THREE.MeshBasicMaterial({map:loader.load("img/die/1.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/2.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/3.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/4.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/5.png")}),
        new THREE.MeshBasicMaterial({map:loader.load("img/die/6.png")})
    ]);
    material = Physijs.createMaterial(color, 0.6, 0.3);
    doDispose(color);
    box = new Physijs.BoxMesh( box_geometry, material);
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
            for (var i = 0; i < obj.children.length; i++) {
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
    return i;
}

// Display the card and delete the scene of the die
function deleteScene(callback) {

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

    doDispose(renderer)
    doDispose(loader);
    scene.remove(ground);
    scene.remove(box);
    scene.remove(camera);

    scene.removeEventListener('update', updateScene, false);
    
    //camera = loader = box = material = renderer = ground_material = ground = selected = vectAngularVelocity = diceLoop = null;

    divDie.removeChild(divDie.lastChild);
    callback();
    Legend.show();
}

function handleDie(callback) {
    if(box.position.y < 6.3) {
        clearInterval(diceLoop);
        setTimeout(deleteScene, 2000, callback);
    }
}

function throwDie(callback) {
    box.position.set(8, 55, -80);
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

    cameraZPosition = 80;
    zGravity = 50;
    scene.setGravity(new THREE.Vector3( 0, -30, zGravity ));
    scene.simulate();
    
    diceLoop = setInterval(handleDie, 100, callback);
}
