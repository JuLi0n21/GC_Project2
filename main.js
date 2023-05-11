import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeMeshUI from 'three-mesh-ui'

let camera, scene, renderer, loader, stats, statsMesh, raycaster, controls;

let prevpos;

let INTERSECTED;
const tempMatrix = new THREE.Matrix4();
let room;

// Initialize gamepad variables
let gamepad;
let gamepadAxes;
let controller1, controller2;
let controllerGrip1, controllerGrip2;

const clock = new THREE.Clock();

init();
animate();

function init() {

    raycaster = new THREE.Raycaster();

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

    window.addEventListener('resize', onWindowResize);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1, -1.8);

    document.body.appendChild(VRButton.createButton(renderer));



    // controllers

    let positionAfterRelease = new THREE.Vector3();
    let positionBeforePress = new THREE.Vector3();
    // Function to handle selectstart event
    function onSelectStart(event) {

        console.log(event);
        this.userData.isSelecting = true;
        const controller = event.data;
        const buttonIndex = 0; // Index of the button you want to track

        console.log(this);

        if (controller.gamepad.buttons[buttonIndex].pressed) {
            // The button was pressed on this controller
            // Save the position before the button press
            positionBeforePress.copy(this.position);
        }
    }

    function onSelectEnd(event) {
        this.userData.isSelecting = false;
        const controller = event.data;
        const buttonIndex = 0; // Index of the button you want to track

        if (!controller.gamepad.buttons[buttonIndex].pressed) {
            positionAfterRelease.copy(this.position);

            console.log('Position before button press:', positionBeforePress);
            console.log('Position after button release:', positionAfterRelease);
            room.add(convert2postobox(positionBeforePress, positionAfterRelease));

            positionAfterRelease = new THREE.Vector3();
        }
    }

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    controller1.addEventListener('connected', function (event) {

        this.add(buildController(event.data));

    });
    controller1.addEventListener('disconnected', function () {

        this.remove(this.children[0]);

    });
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    controller2.addEventListener('connected', function (event) {

        this.add(buildController(event.data));

    });
    controller2.addEventListener('disconnected', function () {

        this.remove(this.children[0]);

    });
    scene.add(controller2);

    const controllerModelFactory = new XRControllerModelFactory();

    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    scene.add(convert2postobox(new THREE.Vector3(1, 1, 1), new THREE.Vector3(2, 2, 2)));
    var point1 = new THREE.Vector3(1, 1, 1);
    var point2 = new THREE.Vector3(2, 2, 2);

    var midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);

    var distance = point1.distanceTo(point2);

    var geometry = new THREE.BoxGeometry(distance, distance, distance);

    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    var cube = new THREE.Mesh(geometry, material);
    cube.position.set(midpoint.x, midpoint.y, midpoint.z);
    room.add(cube);


}
function handleController(controller) {

    checkforcollisions(controller);

    if (controller.userData.isSelecting) {


    }


}

function buildController(data) {

    let geometry, material;

    switch (data.targetRayMode) {

        case 'tracked-pointer':

            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, - 1], 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

            material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });

            return new THREE.Line(geometry, material);

        case 'gaze':

            geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, - 1);
            material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
            return new THREE.Mesh(geometry, material);

    }

}


function convert2postobox(point1, point2) {

    var midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);

    var distance = point1.distanceTo(point2);

    var geometry = new THREE.BoxGeometry(distance, distance, distance);

    var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    var cube = new THREE.Mesh(geometry, material);

    cube.position.set(midpoint.x, midpoint.y, midpoint.z);
    console.log(cube);
    return cube;

}

function checkforcollisions(controller) {

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects(room.children, false);

    if (intersects.length > 0) {

        if (INTERSECTED != intersects[0].object) {


            if (INTERSECTED) INTERSECTED.material.color.set(INTERSECTED.currentHex);

            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
            INTERSECTED.material.color.set(0xff0000);

            var buttonIndex = 1; //second button

            if(controller.data.gamepad.buttons[buttonIndex].pressed){
                room.remove(INTERSECTED);
            }

        }

    } else {

        if (INTERSECTED) INTERSECTED.material.color.set(INTERSECTED.currentHex);

        INTERSECTED = undefined;

    }

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

    handleController(controller1);
    handleController(controller2);
    renderer.render(scene, camera);

    stats.update();

}