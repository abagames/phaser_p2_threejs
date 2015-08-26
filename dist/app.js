/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/threejs/three-effectcomposer.d.ts" />
/// <reference path="../../typings/threejs/three-shaderpass.d.ts" />
/// <reference path="../../typings/threejs/three-renderpass.d.ts" />
/// <reference path="phaser.ts" />
var U;
(function (U) {
    var Three;
    (function (Three) {
        var renderer;
        var baseTexture;
        var camera;
        var composer;
        Three.scene;
        function init() {
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(U.game.width, U.game.height);
            var canvas = renderer.domElement;
            baseTexture = new PIXI.BaseTexture(canvas, PIXI.scaleModes.DEFAULT);
            var texture = new PIXI.Texture(baseTexture);
            var textureFrame = new Phaser.Frame(0, 0, 0, U.game.width, U.game.height, 'texture', U.game.rnd.uuid().toString());
            var sprite = U.game.add.sprite(0, 0, texture, textureFrame);
            sprite.fixedToCamera = true;
            var fov = 45;
            camera = new THREE.PerspectiveCamera(fov, U.game.width / U.game.height, 1, 10000);
            var dist = U.game.height / 2 / Math.tan(Math.PI * fov / 360);
            camera.position.z = dist;
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            renderer.shadowMapCullFace = THREE.CullFaceBack;
            renderer.shadowMapEnabled = true;
            renderer.shadowMapType = THREE.PCFShadowMap;
            Three.scene = new THREE.Scene();
            var ambientlight = new THREE.AmbientLight(0x444444);
            Three.scene.add(ambientlight);
            addDirectionalLight(-U.game.width * 0.6, U.game.height * 0.6, U.game.width * 0.6, 0xffffff, 0.5);
            var renderTargetParameters = {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBFormat,
                stencilBuffer: false
            };
            var effectSave = new THREE.SavePass(new THREE.WebGLRenderTarget(U.game.width, U.game.height, renderTargetParameters));
            var effectBlend = new THREE.ShaderPass(THREE.BlendShader, "tDiffuse1");
            effectBlend.uniforms['tDiffuse2'].value = effectSave.renderTarget;
            effectBlend.uniforms['mixRatio'].value = 0.65;
            var toScreen = new THREE.ShaderPass(THREE.CopyShader);
            toScreen.renderToScreen = true;
            composer = new THREE.EffectComposer(renderer);
            composer.addPass(new THREE.RenderPass(Three.scene, camera));
            composer.addPass(effectBlend);
            composer.addPass(effectSave);
            composer.addPass(toScreen);
        }
        Three.init = init;
        function addDirectionalLight(x, y, z, color, darkness) {
            var light = new THREE.DirectionalLight(color);
            light.position.set(x, y, z);
            light.castShadow = true;
            light.shadowDarkness = darkness;
            light.shadowCameraRight = U.game.width * 0.8;
            light.shadowCameraLeft = -U.game.width * 0.8;
            light.shadowCameraTop = U.game.height * 0.8;
            light.shadowCameraBottom = -U.game.height * 0.8;
            Three.scene.add(light);
        }
        Three.addDirectionalLight = addDirectionalLight;
        function render() {
            composer.render();
            U.game.renderer.updateTexture(baseTexture);
        }
        Three.render = render;
    })(Three = U.Three || (U.Three = {}));
    var Geometry;
    (function (Geometry) {
        function setSingleSquare(size) {
            return function (obj) {
                obj.geometry = new THREE.PlaneBufferGeometry(size, size);
            };
        }
        Geometry.setSingleSquare = setSingleSquare;
        function addSquare(size, x, y) {
            return function (obj) {
                var square = new THREE.PlaneGeometry(size, size);
                square.applyMatrix(new THREE.Matrix4().makeTranslation(x, -y, 0));
                if (!obj.geometry) {
                    obj.geometry = square;
                }
                else {
                    obj.geometry.merge(square);
                }
            };
        }
        Geometry.addSquare = addSquare;
        function setMaterialIndex(faceIndex, materialIndex) {
            return function (obj) {
                obj.geometry.faces[faceIndex * 2].materialIndex =
                    materialIndex;
                obj.geometry.faces[faceIndex * 2 + 1].materialIndex =
                    materialIndex;
            };
        }
        Geometry.setMaterialIndex = setMaterialIndex;
    })(Geometry = U.Geometry || (U.Geometry = {}));
    var Material;
    (function (Material) {
        function set(color) {
            return function (obj) {
                obj.material = new THREE.MeshLambertMaterial({ color: color });
            };
        }
        Material.set = set;
        function setFromMeshFaceMaterial(obj) {
            obj.material = new THREE.MeshFaceMaterial(obj.materials);
        }
        Material.setFromMeshFaceMaterial = setFromMeshFaceMaterial;
    })(Material = U.Material || (U.Material = {}));
    var GeomertyMaterial;
    (function (GeomertyMaterial) {
        function addSquares(size, squares, colors) {
            return U.addSquaresWithFunc(size, squares, colors, Geometry.addSquare, Geometry.setSingleSquare);
        }
        GeomertyMaterial.addSquares = addSquares;
    })(GeomertyMaterial = U.GeomertyMaterial || (U.GeomertyMaterial = {}));
    function addSquaresWithFunc(size, squares, colors, addSqFunc, addSingleSqFunc) {
        return function (obj) {
            var width = squares[0].length;
            var height = squares.length;
            if (width == 1 && height == 1) {
                Material.set(colors[0])(obj);
                addSingleSqFunc(size * 0.9)(obj);
                return;
            }
            MeshFaceMaterial.set(obj);
            _.forEach(colors, function (c) {
                MeshFaceMaterial.add(c)(obj);
            });
            Material.setFromMeshFaceMaterial(obj);
            var i = 0;
            _.times(height, function (y) {
                var sy = (y - (height - 1) / 2) * size;
                _.times(width, function (x) {
                    var sx = (x - (width - 1) / 2) * size;
                    var s = squares[y].charCodeAt(x) - '0'.charCodeAt(0);
                    if (s > 0) {
                        U.chain([
                            addSqFunc(size * 0.9, sx, sy),
                            Geometry.setMaterialIndex(i, s - 1)
                        ], obj);
                        i++;
                    }
                });
            });
        };
    }
    U.addSquaresWithFunc = addSquaresWithFunc;
    var MeshFaceMaterial;
    (function (MeshFaceMaterial) {
        function set(obj) {
            obj.materials = new Array();
        }
        MeshFaceMaterial.set = set;
        function add(color) {
            return function (obj) {
                obj.materials.push(new THREE.MeshLambertMaterial({ color: color }));
            };
        }
        MeshFaceMaterial.add = add;
    })(MeshFaceMaterial = U.MeshFaceMaterial || (U.MeshFaceMaterial = {}));
    var Mesh;
    (function (Mesh) {
        function set(obj) {
            obj.mesh = new THREE.Mesh(obj.geometry, obj.material);
            obj.mesh.castShadow = true;
            if (obj.hasOwnProperty('position')) {
                PositionMesh.update(obj);
            }
            Three.scene.add(obj.mesh);
        }
        Mesh.set = set;
        function setReceiveShadow(obj) {
            obj.mesh.castShadow = false;
            obj.mesh.receiveShadow = true;
        }
        Mesh.setReceiveShadow = setReceiveShadow;
        function setZ(z) {
            return function (obj) {
                obj.mesh.position.z = z;
            };
        }
        Mesh.setZ = setZ;
        function remove(obj) {
            Three.scene.remove(obj.mesh);
        }
        Mesh.remove = remove;
    })(Mesh = U.Mesh || (U.Mesh = {}));
    var PositionMesh;
    (function (PositionMesh) {
        function update(obj) {
            obj.mesh.position.x = (obj.position.x - U.game.width / 2);
            obj.mesh.position.y = -(obj.position.y - U.game.height / 2);
        }
        PositionMesh.update = update;
    })(PositionMesh = U.PositionMesh || (U.PositionMesh = {}));
})(U || (U = {}));
/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="three.ts" />
var U;
(function (U) {
    U.game;
    function initGame(width, height, state) {
        U.game = new Phaser.Game(width, height, Phaser.WEBGL, null, state);
    }
    U.initGame = initGame;
    var Key;
    (function (Key) {
        Key.cursors;
        Key.button;
        function init() {
            Key.cursors = U.game.input.keyboard.createCursorKeys();
            Key.button = U.game.input.keyboard.addKey(Phaser.Keyboard.Z);
        }
        Key.init = init;
    })(Key = U.Key || (U.Key = {}));
    var Sprite;
    (function (Sprite) {
        function get(group) {
            if (group === void 0) { group = null; }
            var sprite;
            if (group) {
                sprite = group.create(0, 0, null);
            }
            else {
                sprite = new Phaser.Sprite(U.game, 0, 0);
            }
            sprite.width = sprite.height = 0;
            U.game.add.existing(sprite);
            return sprite;
        }
        Sprite.get = get;
        function setUpdate(func) {
            return function (obj) {
                obj.update = function () {
                    func(obj);
                };
            };
        }
        Sprite.setUpdate = setUpdate;
        function removeWhenOutOfWorldBounds(width, height, isAfterEntering) {
            var _this = this;
            if (isAfterEntering === void 0) { isAfterEntering = false; }
            return function (obj) {
                obj.width = width;
                obj.height = height;
                obj.checkWorldBounds = true;
                if (isAfterEntering) {
                    obj.events.onEnterBounds.add(markEntering, _this);
                    obj.events.onOutOfBounds.add(removeIfAfterEntering, _this);
                }
                else {
                    obj.events.onOutOfBounds.add(remove, _this);
                }
            };
        }
        Sprite.removeWhenOutOfWorldBounds = removeWhenOutOfWorldBounds;
        function remove(obj) {
            if (obj.hasOwnProperty('mesh')) {
                U.Mesh.remove(obj);
            }
            obj.kill();
        }
        Sprite.remove = remove;
        function removeIfAfterEntering(obj) {
            if (obj.isEntering) {
                remove(obj);
            }
        }
        Sprite.removeIfAfterEntering = removeIfAfterEntering;
        function markEntering(obj) {
            obj.isEntering = true;
        }
        Sprite.markEntering = markEntering;
    })(Sprite = U.Sprite || (U.Sprite = {}));
    var Name;
    (function (Name) {
        function set(name) {
            return function (obj) {
                obj.name = name;
            };
        }
        Name.set = set;
        function is(name) {
            return function (obj) {
                return (obj.name === name);
            };
        }
        Name.is = is;
    })(Name = U.Name || (U.Name = {}));
    var Position;
    (function (Position) {
        function set(x, y) {
            return function (obj) {
                obj.position.x = x;
                obj.position.y = y;
            };
        }
        Position.set = set;
    })(Position = U.Position || (U.Position = {}));
    function chain(funcs, obj) {
        if (obj === void 0) { obj = {}; }
        _.forEach(funcs, function (f) { return f(obj); });
        return obj;
    }
    U.chain = chain;
})(U || (U = {}));
/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="phaser.ts" />
/// <reference path="three.ts" />
var U;
(function (U) {
    var Physics;
    (function (Physics) {
        function init() {
            U.game.physics.startSystem(Phaser.Physics.P2JS);
        }
        Physics.init = init;
        Physics.defalutCollisionGroup;
        function initCollisionGroup() {
            U.game.physics.p2.updateBoundsCollisionGroup();
            Physics.defalutCollisionGroup = U.CollisionGroup.create();
        }
        Physics.initCollisionGroup = initCollisionGroup;
        function setGravity(y) {
            U.game.physics.p2.gravity.y = y;
        }
        Physics.setGravity = setGravity;
        function setPostBroadphaseCallback(callback) {
            U.game.physics.p2.setPostBroadphaseCallback(callback, this);
        }
        Physics.setPostBroadphaseCallback = setPostBroadphaseCallback;
    })(Physics = U.Physics || (U.Physics = {}));
    var Body;
    (function (Body) {
        function set(obj) {
            U.game.physics.p2.enableBody(obj, false);
        }
        Body.set = set;
        function setStatic(obj) {
            obj.body.dynamic = false;
        }
        Body.setStatic = setStatic;
        function setGravityScale(scale) {
            return function (obj) {
                obj.body.data.gravityScale = scale;
            };
        }
        Body.setGravityScale = setGravityScale;
        function addSquare(size, x, y) {
            return function (obj) {
                obj.body.addRectangle(size, size, x, y);
            };
        }
        Body.addSquare = addSquare;
        function setCollisionGroup(group) {
            if (group === void 0) { group = null; }
            return function (obj) {
                if (!group) {
                    group = Physics.defalutCollisionGroup;
                }
                obj.body.setCollisionGroup(group);
            };
        }
        Body.setCollisionGroup = setCollisionGroup;
        function collides(collidingTo, isCollidingDefault) {
            if (collidingTo === void 0) { collidingTo = []; }
            if (isCollidingDefault === void 0) { isCollidingDefault = true; }
            if (isCollidingDefault) {
                collidingTo.push(Physics.defalutCollisionGroup);
            }
            return function (obj) {
                obj.body.collides(collidingTo);
            };
        }
        Body.collides = collides;
        function addContactListener(listener) {
            return function (obj) {
                obj.body.onBeginContact.add(function (body, shapeA, shapeB, equation) {
                    listener(obj, body, shapeA, shapeB, equation);
                });
            };
        }
        Body.addContactListener = addContactListener;
        function setNotCollidingWorldBounds(obj) {
            obj.body.collideWorldBounds = false;
        }
        Body.setNotCollidingWorldBounds = setNotCollidingWorldBounds;
    })(Body = U.Body || (U.Body = {}));
    var CollisionGroup;
    (function (CollisionGroup) {
        function create() {
            return U.game.physics.p2.createCollisionGroup();
        }
        CollisionGroup.create = create;
    })(CollisionGroup = U.CollisionGroup || (U.CollisionGroup = {}));
    var GeometryBody;
    (function (GeometryBody) {
        function addSquare(size, x, y) {
            return function (obj) {
                U.chain([
                    U.Geometry.addSquare(size, x, y),
                    Body.addSquare(size, x, y)
                ], obj);
            };
        }
        GeometryBody.addSquare = addSquare;
        function setSingleSquare(size) {
            return function (obj) {
                U.chain([
                    U.Geometry.setSingleSquare(size),
                    Body.addSquare(size, 0, 0)
                ], obj);
            };
        }
        GeometryBody.setSingleSquare = setSingleSquare;
    })(GeometryBody = U.GeometryBody || (U.GeometryBody = {}));
    var GeomertyMaterialBody;
    (function (GeomertyMaterialBody) {
        function addSquares(size, squares, colors) {
            return U.addSquaresWithFunc(size, squares, colors, GeometryBody.addSquare, GeometryBody.setSingleSquare);
        }
        GeomertyMaterialBody.addSquares = addSquares;
    })(GeomertyMaterialBody = U.GeomertyMaterialBody || (U.GeomertyMaterialBody = {}));
    var BodyMesh;
    (function (BodyMesh) {
        function update(obj) {
            obj.mesh.rotation.z = -obj.body.angle * Math.PI / 180;
        }
        BodyMesh.update = update;
    })(BodyMesh = U.BodyMesh || (U.BodyMesh = {}));
    var Spring;
    (function (Spring) {
        function create(obj1, obj2, offset1, offset2, restLength, stiffness, damping) {
            if (restLength === void 0) { restLength = 1; }
            if (stiffness === void 0) { stiffness = 100; }
            if (damping === void 0) { damping = 1; }
            return U.game.physics.p2.createSpring(obj1.body, obj2.body, restLength, stiffness, damping, null, null, [-offset1[0], -offset1[1]], [-offset2[0], -offset2[1]]);
        }
        Spring.create = create;
        function remove(spring) {
            U.game.physics.p2.removeSpring(spring);
        }
        Spring.remove = remove;
    })(Spring = U.Spring || (U.Spring = {}));
})(U || (U = {}));
/// <reference path="util/phaser.ts" />
/// <reference path="util/three.ts" />
/// <reference path="util/p2.ts" />
function setWheel(ship, ox) {
    var wheel = U.chain([
        U.Position.set(256 + ox, 360 + 30),
        U.Body.set,
        U.Body.setGravityScale(5),
        U.GeometryBody.setSingleSquare(15),
        U.Material.set(0x8888ff),
        U.Mesh.set,
        U.Body.setCollisionGroup(),
        U.Body.collides([shotCollidingCg]),
    ], U.Sprite.get());
    U.Spring.create(ship, wheel, [ox, 15 + 8], [0, -8]);
    return wheel;
}
function setShip() {
    var ship = U.chain([
        U.Position.set(256, 360),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares(15, ['00100', '02120', '22222'], [0xff8888, 0xffffff]),
        U.Mesh.set,
        function (o) {
            o.fireCnt = 0;
        },
        U.Body.setCollisionGroup(),
        U.Body.collides([shotCollidingCg]),
        U.Sprite.setUpdate(function (o) {
            if (o.fireCnt > 0) {
                o.fireCnt--;
            }
            else {
                if (U.Key.button.isDown) {
                    setShot(o);
                    o.fireCnt = 5;
                }
            }
            U.PositionMesh.update(o);
            U.BodyMesh.update(o);
        }),
    ], U.Sprite.get());
    var leftWheel = setWheel(ship, -15);
    U.Sprite.setUpdate(function (o) {
        if (U.Key.cursors.left.isDown) {
            o.body.moveLeft(200);
        }
        U.PositionMesh.update(o);
        U.BodyMesh.update(o);
    })(leftWheel);
    var rightWheel = setWheel(ship, 15);
    U.Sprite.setUpdate(function (o) {
        if (U.Key.cursors.right.isDown) {
            o.body.moveRight(200);
        }
        U.PositionMesh.update(o);
        U.BodyMesh.update(o);
    })(rightWheel);
    return ship;
}
function setShot(ship) {
    U.chain([
        U.Name.set('Shot'),
        U.Position.set(ship.position.x - Math.sin(-ship.body.angle * Math.PI / 180) * 30, ship.position.y - Math.cos(-ship.body.angle * Math.PI / 180) * 30),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares(15, ['1', '1'], [0xeeaaaa]),
        U.Mesh.set,
        U.Body.setGravityScale(0),
        U.Body.addContactListener(function (o, body, shapeA, shapeB, equation) {
            var s = body.sprite;
            U.Sprite.remove(o);
        }),
        function (o) {
            o.body.angle = ship.body.angle;
            o.body.thrust(20000);
        },
        U.Body.setCollisionGroup(shotCg),
        U.Body.collides([shotCollidingCg], false),
        U.Body.setNotCollidingWorldBounds,
        U.Sprite.removeWhenOutOfWorldBounds(15, 30),
        U.Sprite.setUpdate(function (o) {
            U.PositionMesh.update(o);
            U.BodyMesh.update(o);
        }),
    ], U.Sprite.get());
}
function setBaloon() {
    var x, y;
    var baloon = U.chain([
        U.Name.set('Baloon'),
        U.Position.set(x = (Math.random() * .8 + .1) * 512, y = -.1 * 512),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares(15, ['0110', '1111', '1111', '0110'], [0xeeeeaa]),
        U.Mesh.set,
        U.Sprite.removeWhenOutOfWorldBounds(60, 60, true),
        U.Body.setCollisionGroup(shotCollidingCg),
        U.Body.collides([shotCg, shotCollidingCg]),
        U.Body.setNotCollidingWorldBounds,
        U.Sprite.setUpdate(function (o) {
            o.body.thrust(66);
            U.PositionMesh.update(o);
            U.BodyMesh.update(o);
        }),
    ], U.Sprite.get());
}
function setGround(x, y) {
    U.chain([
        U.Name.set('Ground'),
        U.Position.set(x, y),
        U.Body.set,
        U.Body.setStatic,
        U.GeomertyMaterialBody.addSquares(15, ['1'], [0xffbb88]),
        U.Mesh.set,
        U.PositionMesh.update,
        U.Body.setCollisionGroup(shotCollidingCg),
        U.Body.collides([shotCg, shotCollidingCg]),
    ], U.Sprite.get());
}
function setBackPlane() {
    U.chain([
        U.Geometry.setSingleSquare(600),
        U.Material.set(0x333388),
        U.Mesh.set,
        U.Mesh.setReceiveShadow,
        U.Mesh.setZ(-16),
    ]);
}
var shotCollidingCg;
var shotCg;
function preload() {
    U.game.scale.pageAlignHorizontally = true;
    U.game.scale.pageAlignVertically = true;
    U.Key.init();
    U.Three.init();
    U.Physics.init();
    U.Physics.initCollisionGroup();
    U.Physics.setGravity(100);
    shotCollidingCg = U.CollisionGroup.create();
    shotCg = U.CollisionGroup.create();
    setBackPlane();
}
function create() {
    _.times(512 / 16, function (n) {
        setGround(n * 16 + 8, 450);
    });
    setShip();
    U.game.time.events.loop(Phaser.Timer.SECOND, setBaloon, this);
}
function update() {
    U.Three.render();
}
window.onload = function () {
    U.initGame(512, 512, {
        preload: preload, create: create, update: update
    });
};
//# sourceMappingURL=app.js.map