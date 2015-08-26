/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/threejs/three-effectcomposer.d.ts" />
/// <reference path="../../typings/threejs/three-shaderpass.d.ts" />
/// <reference path="../../typings/threejs/three-renderpass.d.ts" />
/// <reference path="phaser.ts" />

module U {
    export module Three {
        var renderer: THREE.WebGLRenderer;
        var baseTexture: PIXI.BaseTexture;
        var camera: THREE.Camera;
        var composer: THREE.EffectComposer;
        export var scene: THREE.Scene;

        export function init() {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(game.width, game.height);
            var canvas: HTMLCanvasElement = renderer.domElement;
            baseTexture = new PIXI.BaseTexture(canvas, PIXI.scaleModes.DEFAULT);
            var texture = new PIXI.Texture(baseTexture);
            var textureFrame = new Phaser.Frame(
                0, 0, 0, game.width, game.height,
                'texture', game.rnd.uuid().toString());
            var sprite = game.add.sprite(0, 0, texture, textureFrame);
            sprite.fixedToCamera = true;
            var fov = 45;
            camera = new THREE.PerspectiveCamera
                (fov, game.width / game.height, 1, 10000);
            var dist = game.height / 2 / Math.tan(Math.PI * fov / 360);
            camera.position.z = dist;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            renderer.shadowMapCullFace = THREE.CullFaceBack;
            renderer.shadowMapEnabled = true;
            renderer.shadowMapType = THREE.PCFShadowMap;
            scene = new THREE.Scene();

            var ambientlight = new THREE.AmbientLight(0x444444);
            scene.add(ambientlight);
            addDirectionalLight(-game.width * 0.6, game.height * 0.6,
                game.width * 0.6, 0xffffff, 0.5);

            var renderTargetParameters = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                stencilBuffer: false
            };
            var effectSave = new (<any>THREE).SavePass(new THREE.WebGLRenderTarget(
                game.width, game.height, renderTargetParameters));
            var effectBlend = new THREE.ShaderPass
                ((<any>THREE).BlendShader, "tDiffuse1");
            effectBlend.uniforms['tDiffuse2'].value = effectSave.renderTarget;
            effectBlend.uniforms['mixRatio'].value = 0.65;
            var toScreen = new THREE.ShaderPass(THREE.CopyShader);
            toScreen.renderToScreen = true;
            composer = new THREE.EffectComposer(renderer);
            composer.addPass(new THREE.RenderPass(scene, camera));
            composer.addPass(effectBlend);
            composer.addPass(effectSave);
            composer.addPass(toScreen);
        }

        export function addDirectionalLight(x, y, z, color, darkness) {
            var light = new THREE.DirectionalLight(color);
            light.position.set(x, y, z);
            light.castShadow = true;
            light.shadowDarkness = darkness;
            light.shadowCameraRight = game.width * 0.8;
            light.shadowCameraLeft = -game.width * 0.8;
            light.shadowCameraTop = game.height * 0.8;
            light.shadowCameraBottom = -game.height * 0.8;
            scene.add(light);
        }

        export function render() {
            composer.render();
            (<any>game.renderer).updateTexture(baseTexture);
        }
    }

    export interface HasGeometry {
        geometry: THREE.Geometry | THREE.BufferGeometry;
    }
    export module Geometry {
        export function setSingleSquare(size: number) {
            return (obj) => {
                obj.geometry = new THREE.PlaneBufferGeometry(size, size);
            }
        }
        export function addSquare(size: number, x: number, y: number) {
            return (obj) => {
                var square = new THREE.PlaneGeometry(size, size);
                square.applyMatrix(new THREE.Matrix4().makeTranslation(x, -y, 0));
                if (!obj.geometry) {
                    obj.geometry = square;
                } else {
                    obj.geometry.merge(square);
                }
            }
        }
        export function setMaterialIndex(faceIndex: number, materialIndex: number) {
            return (obj: HasGeometry) => {
                (<any>obj.geometry).faces[faceIndex * 2].materialIndex =
                materialIndex;
                (<any>obj.geometry).faces[faceIndex * 2 + 1].materialIndex =
                materialIndex;
            }
        }
    }

    export interface HasMaterial {
        material: THREE.Material;
    }
    export module Material {
        export function set(color: number) {
            return (obj) => {
                obj.material = new THREE.MeshLambertMaterial({ color: color });
            }
        }

        export function setFromMeshFaceMaterial(obj) {
            obj.material = new THREE.MeshFaceMaterial(obj.materials);
        }
    }

    export module GeomertyMaterial {
        export function addSquares(size: number, squares: string[], colors: number[]) {
            return U.addSquaresWithFunc
                (size, squares, colors, Geometry.addSquare, Geometry.setSingleSquare);
        }
    }

    export function addSquaresWithFunc
        (size: number, squares: string[], colors: number[],
        addSqFunc: Function, addSingleSqFunc: Function) {
        return (obj) => {
            var width = squares[0].length;
            var height = squares.length;
            if (width == 1 && height == 1) {
                Material.set(colors[0])(obj);
                addSingleSqFunc(size * 0.9)(obj);
                return;
            }
            MeshFaceMaterial.set(obj);
            _.forEach(colors, (c) => {
                MeshFaceMaterial.add(c)(obj);
            });
            Material.setFromMeshFaceMaterial(obj);
            var i = 0;
            _.times(height, (y) => {
                var sy = (y - (height - 1) / 2) * size;
                _.times(width, (x) => {
                    var sx = (x - (width - 1) / 2) * size;
                    var s = squares[y].charCodeAt(x) - '0'.charCodeAt(0);
                    if (s > 0) {
                        chain([
                            addSqFunc(size * 0.9, sx, sy),
                            Geometry.setMaterialIndex(i, s - 1)
                        ], obj);
                        i++;
                    }
                });
            });
        }
    }

    export interface HasMeshFaceMaterial {
        materials: THREE.Material[];
    }
    export module MeshFaceMaterial {
        export function set(obj) {
            obj.materials = new Array<THREE.Material>();
        }

        export function add(color: number) {
            return (obj: HasMeshFaceMaterial) => {
                obj.materials.push(new THREE.MeshLambertMaterial({ color: color }));
            }
        }
    }

    export interface HasMesh {
        mesh: THREE.Mesh;
    }
    export module Mesh {
        export function set(obj) {
            obj.mesh = new THREE.Mesh(obj.geometry, obj.material);
            obj.mesh.castShadow = true;
            if (obj.hasOwnProperty('position')) {
                PositionMesh.update(obj);
            }
            Three.scene.add(obj.mesh);
        }

        export function setReceiveShadow(obj: HasMesh) {
            obj.mesh.castShadow = false;
            obj.mesh.receiveShadow = true;
        }

        export function setZ(z: number) {
            return (obj: HasMesh) => {
                obj.mesh.position.z = z;
            }
        }

        export function remove(obj: HasMesh) {
            Three.scene.remove(obj.mesh);
        }
    }

    export interface HasPositionMesh extends HasPosition, HasMesh { }
    export module PositionMesh {
        export function update(obj: HasPositionMesh) {
            obj.mesh.position.x = (obj.position.x - game.width / 2);
            obj.mesh.position.y = -(obj.position.y - game.height / 2);
        }
    }
}
