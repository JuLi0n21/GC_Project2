import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


export const controls = (function () {
    return {
        Orbitcontrols: class {
            constructor(params) {
                this._cells = params.cells;
                this._Init(params);
            }

            _Init(params) {

            this._controls = new OrbitControls(params.camera, params.render.domElement);
            this._controls.update()
            }
        }
    };
})();