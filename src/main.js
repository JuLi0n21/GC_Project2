import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";
import { BoxLineGeometry } from "three/addons/geometries/BoxLineGeometry.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { HTMLMesh } from "three/addons/interactive/HTMLMesh.js";
import { InteractiveGroup } from "three/addons/interactive/InteractiveGroup.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import ThreeMeshUI, { Block } from "three-mesh-ui";
import { algoGUI, updateButtons } from "./threegui";
import VRControl from "./utils/VRControl.js";
import { RRT } from "./rrt";

let camera, scene, renderer, loader, stats, statsMesh, raycaster, controls, dolly;

let INTERSECTED;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let room;

// Initialize gamepad variables
let gamepad;
let gamepadAxes;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let obsticals, vrControl;

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

  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

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
  renderer.xr.setReferenceSpaceType("local");
  document.body.appendChild(renderer.domElement);

  //

  document.body.appendChild(VRButton.createButton(renderer));

  dolly = new THREE.Object3D();
  dolly.position.set(0,1.6,0);
  dolly.add ( camera)
  scene.add( dolly )

  const dummyCam = new THREE.Object3D( dolly )
  camera.add ( dummyCam );
  
  // Orbit controls for no-vr

  controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(2, 2, 8);
  controls.target = new THREE.Vector3(2,2,0);


  let positionBeforePress = new THREE.Vector3();

  vrControl = VRControl(renderer);

  //handle controller 1

  dolly.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

  //select button
  vrControl.controllers[0].addEventListener("select", (event) => {
    console.log(event);
  });
  vrControl.controllers[0].addEventListener("selectstart", (event) => {
    vrControl.controllers[0].userData.selected = true;
  });
  vrControl.controllers[0].addEventListener("selectend", (event) => {
    vrControl.controllers[0].userData.selected = false;
  });

  //squezze button
  vrControl.controllers[0].addEventListener("squeezestart", (event) => {
    console.log(event);
  });

  vrControl.controllers[0].addEventListener("squeeze", (event) => {
    console.log(event);
  });
  vrControl.controllers[0].addEventListener("squeezeend", (event) => {
    console.log(event);
  });
  //else
  vrControl.controllerGrips[0].addEventListener("connected", (event) => {
    console.log(event.data.gamepad);
  });

  //handle controller 2
  dolly.add(vrControl.controllerGrips[1], vrControl.controllers[1]);
  //dolly.attach(vrControl.controllerGrips[1], vrControl.controllers[1]);

  //select button
  vrControl.controllers[1].addEventListener("select", (event) => {
    console.log(event);
  });
  vrControl.controllers[1].addEventListener("selectstart", (event) => {
    vrControl.controllers[1].userData.selected = true;
    let pos = new THREE.Vector3;
    pos.copy(vrControl.controllers[1].position);
    pos.y += dolly.position.y;
    positionBeforePress.copy(pos)
  });
  vrControl.controllers[1].addEventListener("selectend", () => {
    vrControl.controllers[1].userData.selected = false;
    let pos = new THREE.Vector3;
    pos.copy(vrControl.controllers[1].position);
    pos.y += dolly.position.y;
    Convert2postobox(positionBeforePress, pos);
  });
  //squezze button
  vrControl.controllers[1].addEventListener("squeezestart", (event) => {});

  vrControl.controllers[1].addEventListener("squeeze", (event) => {
    const obj = getIntersections(vrControl.controllers[1]);
    if (obj[0]!= null) {
      obsticals.remove(obj[0].object);
    }
  });
  vrControl.controllers[1].addEventListener("squeezeend", (event) => {});
  //else
  vrControl.controllerGrips[1].addEventListener("connected", (event) => {
    console.log(event.data.gamepad);
  });

  window.addEventListener("resize", onWindowResize);

  obsticals = new THREE.Group();

  const obst = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  obst.position.set(2,0,2);
  obst.rotateX(Math.PI/2)
  obsticals.add(obst)

  const obst2 = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  obst2.position.set(-2,0,-2);
  obst2.rotateX(Math.PI/2)
  obsticals.add(obst2)
  const obst3 = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  obst3.position.set(-2,0,2);
  obst3.rotateX(Math.PI/2)
  obsticals.add(obst3)

  const box = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide }))
  box.position.set(3,3,-0.5);

  obsticals.add(obst)
  //obsticals.add(box)
  
  scene.add(obsticals)
  algoGUI(scene, obsticals);


  let rrtcanvas = new THREE.Group;

  const start = [1, 1];
  const goal = [2, -2];
  const maxStepSize = 0.1;
  const maxStepCount = 10000;
  const range = 6;
 
  const rrt = new RRT(start, goal, obsticals, maxStepSize, maxStepCount, range, rrtcanvas);
  
  rrt.visulize();
  console.log("Startign RRT")
  
  scene.add(rrtcanvas);
 
}

function UpdateVrControl(controller) {
   if(controller.gamepad){
     if (controller.gamepad.buttons[0].pressed) {
       console.log("button 0");
     }
     if (controller.gamepad.buttons[1].pressed) {
       console.log("button 1");
     }
     if (controller.gamepad.buttons[2].pressed) {
       console.log("button 2");
     }
     if (controller.gamepad.buttons[3].pressed) {
       console.log("button 3");
     }
     if (controller.gamepad.buttons[4].pressed) {
       console.log("button 4");
     }
   }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function intersectObjects(controller) {
  if (controller.userData.targetRayMode === "screen") return;

  if (controller.userData.selected !== false) return;

  const line = controller.getObjectByName("line");

  const intersections = getIntersections(controller);
  //console.log(intersections)

  if (intersections.length > 0) {
    //console.log(intersections)
    const intersection = intersections[0];

    
    const object = intersection.object;
    console.log(object);
    object.material.emissive.r = 1;
    intersected.push(object);
  } else {
  }
}

function getIntersections(controller) {
  controller.updateMatrixWorld();
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  //console.log(tempMatrix);
  //console.log(controller);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  return raycaster.intersectObjects(obsticals.children, false);
}

function cleanIntersected() {
  while (intersected.length) {
    const object = intersected.pop();
    object.material.emissive.r = 0;
  }
}

function Convert2postobox(startingPoint, endPoint) {
  const midpoint = new THREE.Vector3()
    .addVectors(startingPoint, endPoint)
    .multiplyScalar(0.5);
  const distance = startingPoint.distanceTo(endPoint);

  const geometries = [
    new THREE.BoxGeometry(distance, distance, distance),
    new THREE.CircleGeometry(distance, 32),
    new THREE.ConeGeometry(0.2, 0.2, 64),
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 64),
    new THREE.IcosahedronGeometry(0.2, 8),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32),
  ];

   //const geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
  const geometry = geometries[1];

  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
    roughness: 0.7,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  const object = new THREE.Mesh(geometry, material);
  object.castShadow = true;
  object.receiveShadow = true;

  object.position.set(midpoint.x,0,midpoint.z);
  


  object.rotateX(Math.PI/2)
  console.log(object)
  obsticals.add(object)

}

function animate() {
  renderer.setAnimationLoop(render);
}

function render() {
  const delta = clock.getDelta() * 60;
  ThreeMeshUI.update();
  cleanIntersected();
  updateButtons(renderer, vrControl, 0);
  updateButtons(renderer, vrControl, 1);
  intersectObjects(vrControl.controllers[0]);
  intersectObjects(vrControl.controllers[1]);
 // UpdateVrControl(vrControl.controllers[1])
 controls.update();
  renderer.render(scene, camera);

  stats.update();
}