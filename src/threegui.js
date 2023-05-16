
const gui = new GUI({ width: 300 });
//camera controls
const gui_camera = gui.addFolder("CameraControls");
gui_camera.add(camera.rotation, 'x', 0, Math.PI * 2);
gui_camera.add(camera.rotation, 'y', 0, Math.PI * 2);
gui_camera.add(camera.rotation, 'z', 0, Math.PI * 2);
const gui_camera_pos = gui.addFolder("CameraPos");
gui_camera_pos.add(camera.position, "x", -100, 100);
gui_camera_pos.add(camera.position, "y", -100, 100);
gui_camera_pos.add(camera.position, "z", -0, 1000);
gui_camera.open();
gui_camera_pos.open();
const gui_interactions = gui.addFolder("Actions")

gui_interactions.add(params, "newdots")
gui_interactions.add(params, "point_color", Object.keys(pointcolors));

gui_interactions.add(params, "connectdots");
gui_interactions.add(params, "line_color", Object.keys(linecolors));


gui_interactions.add(params, "pointcount", 0, 100)
gui_interactions.open();

//boxes 

const gui_interactions_boxes = gui_interactions.addFolder("Boxes");

gui_interactions_boxes.add(boxfunctions, "addbox");
gui_interactions_boxes.add(boxfunctions, "removebox");
gui_interactions_boxes.add(boxfunctions, "box_color", Object.keys(boxcolors));


gui.add(params, "resetcam");
gui.add(params, "clear");
gui.domElement.style.visibility = 'hidden';

const group = new InteractiveGroup(renderer, camera);
scene.add(group);

const mesh = new HTMLMesh(gui.domElement);
mesh.position.x = - 0.75;
mesh.position.y = 1.5;
mesh.position.z = - 0.5;
mesh.rotation.y = Math.PI / 4;
mesh.scale.setScalar(2);
group.add(mesh);

stats = new Stats();
stats.dom.style.width = '80px';
stats.dom.style.height = '48px';
document.body.appendChild(stats.dom);

statsMesh = new HTMLMesh(stats.dom);
statsMesh.position.x = - 0.75;
statsMesh.position.y = 2.1;
statsMesh.position.z = - 0.6;
statsMesh.rotation.y = Math.PI / 4;
statsMesh.scale.setScalar(2.5);
group.add(statsMesh);

const container = new ThreeMeshUI.Block({
    height: 1.5,
    width: 1
});

container.position.set(0, 1, -1.8);
container.rotation.x = -0.55;
scene.add(container);

const imageBlock = new ThreeMeshUI.Block({
    height: 1,
    width: 1,
    offset: 0.01 // distance separating the inner block from its parent
});

const textBlock = new ThreeMeshUI.Block({
    height: 0.4,
    width: 0.8,
    margin: 0.05, // like in CSS, horizontal and vertical distance from neighbour
    offset: 0.01 // distance separating the inner block from its parent
});

container.add(imageBlock, textBlock);

container.set({
    fontFamily: '../assests/Roboto-msdf.json',
    fontTexture: '../assests/Roboto-msdf.png',
});

const text = new ThreeMeshUI.Text({
    content: 'The spiny bush viper is known for its extremely keeled dorsal scales.'
});

textBlock.add(text);

text.set({
    fontColor: new THREE.Color(0xd2ffbd),
    fontSize: 0.04
});

textBlock.set({
    // alignContent: 'right', // could be 'center' or 'left'
    // alignContent has been deprecated, rely on alignItems or textAlign
    textAlign: 'right',
    justifyContent: 'end', // could be 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'  
    padding: 0.03
});