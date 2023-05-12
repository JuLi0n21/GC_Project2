import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeMeshUI from 'three-mesh-ui'
import { initXR, handleControllers } from './vr';

let camera, scene, renderer, loader, stats, controls;

let room;



const clock = new THREE.Clock();

init();
animate();

async function init() {


const canvas = document.getElementById('canvas');
    stats = new Stats();
    document.body.appendChild(stats.dom);

    loader = new FontLoader();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x505050);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);

    room = new THREE.LineSegments(
        new BoxLineGeometry(6, 6, 6, 10, 10, 10),
        new THREE.LineBasicMaterial({ color: 0x808080 })
    );
    room.geometry.translate(0, 3, 0);
    scene.add(room);

    scene.add(new THREE.HemisphereLight(0x606060, 0x404040));

    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);
    //

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.xr.enabled = true;
    try {
         initXR(renderer, scene, room);
      } catch (error) {
       console.log(error);   
      } 
      

    window.addEventListener('resize', onWindowResize);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1, -1.8);


    /*
       scene.add(convert2postobox(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)));
       var point1 = new THREE.Vector3(1, 1, 1);
       var point2 = new THREE.Vector3(2, 2, 2);
   
       var midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
   
       var distance = point1.distanceTo(point2);
   
       var geometry = new THREE.BoxGeometry(distance, distance, distance);
   
       var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
   
       var cube = new THREE.Mesh(geometry, material);
       cube.position.set(midpoint.x, midpoint.y, midpoint.z);
       room.add(cube);
   */
}

export function getRoom(){
    return room;
}

export function getRenderer(){
    return renderer;
}

export function getScene(){
    return scene;
}
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    renderer.setAnimationLoop(render);

}

function render() {

    const delta = clock.getDelta() * 60;
    ThreeMeshUI.update();

     handleControllers(room);

    renderer.render(scene, camera);

    stats.update();

}

