import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.112.1/build/three.module.js';
import Stats from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/libs/stats.module.js';
import { WEBGL } from 'https://cdn.jsdelivr.net/npm/three@0.112.1/examples/jsm/WebGL.js';

export const graphics = (function () {
    return {
        Graphics: class {
            constructor(game) {
            }

            Initialize() {
                if (!WEBGL.isWebGL2Available()) {
                    return false;
                }

                this._render = new THREE.WebGLRenderer({
                    antialias: true,
                });
                this._render.setPixelRatio(window.devicePixelRatio);
                this._render.setSize(window.innerWidth, window.innerHeight);

                console.log(this._render);
                const target = document.getElementById('target');
                target.appendChild(this._render.domElement);

                this._stats = new Stats();
                target.appendChild(this._stats.dom);

                window.addEventListener('resize', () => {
                    this._OnWindowResize();
                }, false);

                const fov = 60;
                const aspect = 1920 / 1080;
                const near = 0.1;
                const far = 10000.0;
                this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

                this._scene = new THREE.Scene();
                this._scene.background = new THREE.Color(0xaaaaaa);

                return true;
            }

            _OnWindowResize() {
                this._camera.aspect = window.innerWidth / window.innerHeight;
                this._camera.updateProjectionMatrix();
                this._render.setSize(window.innerWidth, window.innerHeight);
            }

            get Scene() {
                return this._scene;
            }

            get Camera() {
                return this._camera;
            }

            get render() {
                console.log(this._render);
                return this._render;
            }

            Render(timeInSeconds) {
                this._render.render(this._scene, this._camera);
                this._stats.update();
            }
        }
    };
})();