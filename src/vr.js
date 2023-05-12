import * as THREE from 'three';

import ThreeMeshUI from 'three-mesh-ui'
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

export const vr = (function () {
    return {
         VrManager: class {

        constructor(params) {
            this._Init(params);
            this._raycaster = new THREE.Raycaster;
            this._controllers = {}
            this._controllerGrips = {}
        }

        _Init(params) {
            console.log(params);
            params.render.xr.enabled = true;
            document.body.appendChild(VRButton.createButton(params.render));
            // controllers


            this._controllers.push(controller1 = params.render.xr.getController(0));
            this._controllers[0].addEventListener('selectstart', onSelectStart);
            this._controllers[0].addEventListener('selectend', onSelectEnd);
            this._controllers[0].addEventListener('connected', function (event) {

                this.add(buildController(event.data));

            });
            this._controllers[0].addEventListener('disconnected', function () {

                this.remove(this.children[0]);

            });
            params.scene.add(this._controllers[0]);

            this._controllers.push(controller2 = params.render.xr.getController(1));
            this._controllers[1].addEventListener('selectstart', onSelectStart);
            this._controllers[1].addEventListener('selectend', onSelectEnd);
            this._controllers[1].addEventListener('connected', function (event) {

                this.add(buildController(event.data));

            });
            this._controllers[1].addEventListener('disconnected', function () {

                this.remove(this.children[0]);

            });
            params.scene.add(_controllers[1]);

            const controllerModelFactory = new XRControllerModelFactory();

            this._controllers[0] = params.render.xr.getControllerGrip(0);
            this._controllers[0].add(controllerModelFactory.createControllerModel(this._controllers[0]));
            params.scene.add(this._controllers[0]);

            this._controllers[1] = params.render.xr.getControllerGrip(1);
            this._controllers[1].add(controllerModelFactory.createControllerModel(this._controllers[1]));
            params.scene.add(this._controllers[1]);


            let positionAfterRelease = new THREE.Vector3();
            let positionBeforePress = new THREE.Vector3();
            // Function to handle selectstart event
            function onSelectStart(event) {

                //console.log(event);
                this.userData.isSelecting = true;
                const controller = event.data;
                const buttonIndex = 0; // Index of the button you want to track

                if (controller.gamepad.buttons[buttonIndex].pressed) {
                    // The button was pressed on this controller
                    // Save the position before the button press
                    positionBeforePress.copy(this.position);
                    console.log(this.position)
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
                    //room.add(convert2postobox(positionBeforePress, positionAfterRelease));
                    getRoom().add((convert2postobox(positionBeforePress, positionAfterRelease)));

                    positionAfterRelease = new THREE.Vector3();
                }
            }

        }

        _Convert2postobox(point1, point2) {

            var midpoint = new THREE.Vector3().addVectors(point1, point2).multiplyScalar(0.5);
            var distance = point1.distanceTo(point2);
            var geometry = new THREE.BoxGeometry(distance, distance, distance);
            var material = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.BackSide });
            var cube = new THREE.Mesh(geometry, material);
            cube.position.copy(midpoint);
            getRoom().add(cube);
            return cube;
        }

        buildController(data) {

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

        handleControllers() {

            checkforcollisions(controller1);
            checkforcollisions(controller2);


        }

        checkforcollisions(controller) {

            let INTERSECTED;

            tempMatrix.identity().extractRotation(controller.matrixWorld);

            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObjects(getRoom().children, false);

            if (intersects.length > 0) {

                if (INTERSECTED != intersects[0].object) {


                    if (INTERSECTED) INTERSECTED.material.color.set(INTERSECTED.currentHex);

                    INTERSECTED = intersects[0].object;
                    INTERSECTED.currentHex = INTERSECTED.material.color.getHex();
                    INTERSECTED.material.color.set(0xff0000);

                    var buttonIndex = 1; //second button

                    /*   if(controller.data.gamepad.buttons[buttonIndex].pressed){
                           room.remove(INTERSECTED);
                       }
                   */
                }

            } else {

                if (INTERSECTED) INTERSECTED.material.color.set(INTERSECTED.currentHex);

                INTERSECTED = undefined;

            }

        }

    }
};

})();
