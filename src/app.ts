/// <reference path="util/phaser.ts" />
/// <reference path="util/three.ts" />
/// <reference path="util/p2.ts" />

interface Wheel extends Phaser.Sprite { }
function setWheel(ship, ox) {
    var wheel = <Wheel>U.chain([
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

interface Ship extends Phaser.Sprite, U.HasMesh {
    fireCnt: number;
}
function setShip() {
    var ship = <Ship>U.chain([
        U.Position.set(256, 360),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares
            (15, ['00100', '02120', '22222'], [0xff8888, 0xffffff]),
        U.Mesh.set,
        (o: Ship) => {
            o.fireCnt = 0;
        },
        U.Body.setCollisionGroup(),
        U.Body.collides([shotCollidingCg]),
        U.Sprite.setUpdate((o: Ship) => {
            if (o.fireCnt > 0) {
                o.fireCnt--;
            } else {
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
    U.Sprite.setUpdate((o) => {
        if (U.Key.cursors.left.isDown) {
            o.body.moveLeft(200);
        }
        U.PositionMesh.update(o);
        U.BodyMesh.update(o);
    })(leftWheel);
    var rightWheel = setWheel(ship, 15);
    U.Sprite.setUpdate((o) => {
        if (U.Key.cursors.right.isDown) {
            o.body.moveRight(200);
        }
        U.PositionMesh.update(o);
        U.BodyMesh.update(o);
    })(rightWheel);
    return ship;
}

interface Shot extends Phaser.Sprite, U.HasMesh, U.HasName { }
function setShot(ship: Ship) {
    U.chain([
        U.Name.set('Shot'),
        U.Position.set(
            ship.position.x - Math.sin(-ship.body.angle * Math.PI / 180) * 30,
            ship.position.y - Math.cos(-ship.body.angle * Math.PI / 180) * 30),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares(15, ['1', '1'], [0xeeaaaa]),
        U.Mesh.set,
        U.Body.setGravityScale(0),
        U.Body.addContactListener((o, body, shapeA, shapeB, equation) => {
            var s = body.sprite;
            U.Sprite.remove(o);
        }),
        (o: Shot) => {
            o.body.angle = ship.body.angle;
            o.body.thrust(20000);
        },
        U.Body.setCollisionGroup(shotCg),
        U.Body.collides([shotCollidingCg], false),
        U.Body.setNotCollidingWorldBounds,
        U.Sprite.removeWhenOutOfWorldBounds(15, 30),
        U.Sprite.setUpdate((o) => {
            U.PositionMesh.update(o);
            U.BodyMesh.update(o);
        }),
    ], U.Sprite.get());
}

interface Baloon extends Phaser.Sprite, U.HasMesh, U.HasName { }
function setBaloon() {
    var x, y;
    var baloon = <Baloon> U.chain([
        U.Name.set('Baloon'),
        U.Position.set(
            x = (Math.random() * .8 + .1) * 512,
            y = -.1 * 512),
        U.Body.set,
        U.GeomertyMaterialBody.addSquares
            (15, ['0110', '1111', '1111', '0110'], [0xeeeeaa]),
        U.Mesh.set,
        U.Sprite.removeWhenOutOfWorldBounds(60, 60, true),
        U.Body.setCollisionGroup(shotCollidingCg),
        U.Body.collides([shotCg, shotCollidingCg]),
        U.Body.setNotCollidingWorldBounds,
        U.Sprite.setUpdate((o: Baloon) => {
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
    _.times(512 / 16, (n) => {
        setGround(n * 16 + 8, 450);
    });
    setShip();
    U.game.time.events.loop(Phaser.Timer.SECOND, setBaloon, this);
}

function update() {
    U.Three.render();
}

window.onload = () => {
    U.initGame(512, 512, {
        preload: preload, create: create, update: update
    });
};
