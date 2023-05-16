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

let INTERSECTED;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let room;

// Initialize gamepad variables
let gamepad;
let gamepadAxes;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let group;

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
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType( 'local' );
    document.body.appendChild(renderer.domElement);

    //

    document.body.appendChild(VRButton.createButton(renderer));

    // Orbit controls for no-vr

    controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 1.6, 0);
    controls.target = new THREE.Vector3(0, 1, -1.8);

    // controllers
    let positionBeforePress = new THREE.Vector3;
    let positionAfterRelease = new THREE.Vector3;

    function onSelectStart(event) {

        this.userData.isSelecting = true;
        const controller = event.data;
        const buttonIndex = 0;

        if(controller.gamepad.buttons[buttonIndex].pressed){
          positionBeforePress.copy(this.position);
        }
    }

    function onSelectEnd(event) {

      const controller = event.data;
      const buttonIndex = 0;

      if(!controller.gamepad.buttons[buttonIndex].pressed){
        positionAfterRelease.copy(this.position);
        
        Convert2postobox(positionBeforePress,positionAfterRelease);
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

    
    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    line.scale.z = 5;

    controller1.add( line.clone() );
    controller2.add( line.clone() );

    window.addEventListener('resize', onWindowResize);

    group = new THREE.Group();
    scene.add( group );

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

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function handleController(controller) {

   //  checkforcollisions(controller);
    if (controller.userData.isSelecting) {

    }

}
function intersectObjects( controller ) {

  // Do not highlight in mobile-ar

  if ( controller.userData.targetRayMode === 'screen' ) return;

  // Do not highlight when already selected

  if ( controller.userData.selected !== undefined ) return;

  

  const line = controller.getObjectByName( 'line' );

  const intersections = getIntersections( controller );
  console.log(intersections)

  if ( intersections.length > 0 ) {

    const intersection = intersections[ 0 ];

    const object = intersection.object;
    object.material.emissive.r = 1;
    intersected.push( object );

  } else {

  }

}

function getIntersections( controller ) {

  controller.updateMatrixWorld();

  tempMatrix.identity().extractRotation( controller.matrixWorld );

  raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
  raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix );

  return raycaster.intersectObjects( group.children, false );

}

function cleanIntersected() {

  while ( intersected.length ) {

    const object = intersected.pop();
    object.material.emissive.r = 0;

  }

}

function Convert2postobox(point1, point2) {

  var midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
  var distance = point1.distanceTo(point2);

  const geometries = [
    new THREE.BoxGeometry( distance, distance, distance ),
    new THREE.ConeGeometry( 0.2, 0.2, 64 ),
    new THREE.CylinderGeometry( 0.2, 0.2, 0.2, 64 ),
    new THREE.IcosahedronGeometry( 0.2, 8 ),
    new THREE.TorusGeometry( 0.2, 0.04, 64, 32 )
  ];

 // const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
 const geometry = geometries[0]

  const material = new THREE.MeshStandardMaterial( {
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.0
  } );

  const object = new THREE.Mesh( geometry, material );

  object.scale.setScalar( Math.random() + 0.5 );

  object.castShadow = true;
  object.receiveShadow = true;

  group.add( object );


  object.position.copy(midpoint);
  group.attach(object);
}


function animate() {

    renderer.setAnimationLoop(render);

}

function render() {

    const delta = clock.getDelta() * 60;
    ThreeMeshUI.update();

    
    cleanIntersected();

    intersectObjects( controller1 );
    intersectObjects( controller2 );

    renderer.render(scene, camera);

    stats.update();

}