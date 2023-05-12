import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';
import { BoxLineGeometry } from 'three/addons/geometries/BoxLineGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { HTMLMesh } from 'three/addons/interactive/HTMLMesh.js';
import { InteractiveGroup } from 'three/addons/interactive/InteractiveGroup.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ThreeMeshUI from 'three-mesh-ui'
import { game } from './game';
import { vr } from './vr';


// import { Logger } from 'winston';




let _APP = null;

class Algovisulizer extends game.Game {
    constructor() {
        super();
    }

    _OnInitialize() {
        this._entities = {};

        this._LoadBackground();

        this._LoadVr({
            render: this._graphics.render,
            scene: this._graphics.Scene,
            camera: this._graphics.Camera
        });
    }

    _LoadBackground() {
        console.log("loading Background");
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            './resources/posx.jpg',
            './resources/posx.jpg',
            './resources/posy.jpg',
            './resources/negy.jpg',
            './resources/posx.jpg',
            './resources/posx.jpg',
        ]);
        this._graphics.Scene.background = texture;
    }

    _OnStep(timeInSeconds) {
        timeInSeconds = Math.min(timeInSeconds, 1 / 10.0);

        this._StepEntities(timeInSeconds);
    }

    _StepEntities(timeInSeconds) {
        for (let k in this._entities) {
            this._entities[k].Update(timeInSeconds);
        }
    }

    _LoadVr(params){
        this._vr = new vr.VrManager(params)
    }
}


function _Main() {
    console.log("InitingAlog");
    _APP = new Algovisulizer();
}

_Main();