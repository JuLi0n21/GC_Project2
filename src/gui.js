
function createGrid() {
    //forloop from -4 to +4 for x and z
    const size = 1;
    const black = 0x000000;
    const white = 0xffffff;
    for (let x = -4; x < 4; x++) {
        for (let z = -4; z < 4; z++) {
            //make planes

            const geometry = new THREE.PlaneGeometry(1, 1);
            const blackmaterial = new THREE.MeshBasicMaterial({ color: black, side: THREE.DoubleSide });
            const whitematerial = new THREE.MeshBasicMaterial({ color: white, side: THREE.DoubleSide });
            var plane = null;
            //black planes 
            if (Math.abs(z % 2) == 1 && x % 2 == 0) {

                plane = new THREE.Mesh(geometry, blackmaterial);

            } else if (Math.abs(z % 2) == 0 && Math.abs(x % 2) == 1) {

                plane = new THREE.Mesh(geometry, blackmaterial);

            } else {    //white planes

                plane = new THREE.Mesh(geometry, whitematerial);
            }

            //face the camera and set correct position
            plane.position.set(x, 0, z);
            plane.rotation.set(Math.PI / 2, 0, 0)
            scene.add(plane);

            //add text 

            loader.load('/assests/fonts/helvetiker_regular.typeface.json', function (font) {

                const color = 0x006699;

                const matLite = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide
                });

                //refactor pls
                const message = 'a   b   c   d   e   f   g   h';

                const shapes = font.generateShapes(message, 0.5);
                const textgeometry = new THREE.ShapeGeometry(shapes);

                const bottom = new THREE.Mesh(textgeometry, matLite);
                bottom.position.set(-4, 0, 4)
                bottom.rotation.set(Math.PI / 2, Math.PI, Math.PI)
                scene.add(bottom);

                const top = new THREE.Mesh(textgeometry, matLite);
                top.position.set(-4, 0, -4.6)
                top.rotation.set(Math.PI / 2, Math.PI, Math.PI)
                scene.add(top);

                const sidetext = "1   2   3   4   5   6   7   8";
                const sides = font.generateShapes(sidetext, 0.5);
                const sidegeometry = new THREE.ShapeGeometry(sides);

                const left = new THREE.Mesh(sidegeometry, matLite);
                left.position.set(-4.6, 0, 3)
                left.rotation.set(Math.PI / 2, Math.PI, 1.5 * Math.PI)
                scene.add(left);

                const rigth = new THREE.Mesh(sidegeometry, matLite);
                rigth.position.set(4.1, 0, 3)
                rigth.rotation.set(Math.PI / 2, Math.PI, 1.5 * Math.PI)
                scene.add(rigth);

            });
        }

    }
}


const boxfunctions = {

    addbox: function () {
        const range = 5;
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        const material = new THREE.MeshBasicMaterial({ color: boxcolors[boxfunctions.box_color] });
        const cube = new THREE.Mesh(geometry, material);

        const pos = new THREE.Vector3(range * Math.random() - range / 2, range * Math.random(), range * Math.random() - range / 2);

        cube.castShadow = true;
        cube.position.set(pos.x, pos.y, pos.z);
        boxes.push(cube);
        console.log(cube)
        console.log(cube.material.color)
        room.add(cube);
    },
    removebox: function () {
        scene.remove(boxes.pop())
    },

    box_color: Object.keys(boxcolors)[0],

}

const params = {
    clear: function () {
        points = [];
        scene.clear();
        creategrid();
        init();
    },

    resetcam: function () {
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        controls.reset();
    },

    newdots: function () {
        for (let i = 0; i < this.pointcount; i++) {
            points.push(gendots(range, pointcolors[params.point_color]));
        }
    },

    connectdots: function () {
        scene.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            // new THREE.LineBasicMaterial(linecolors[ params.line_color ])
            new THREE.LineBasicMaterial({ color: linecolors[params.line_color] })
        ));
    },

    point_color: Object.keys(pointcolors)[1],

    line_color: Object.keys(linecolors)[0],

    pointcount: 5,

}