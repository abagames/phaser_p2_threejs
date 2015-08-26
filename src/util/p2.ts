/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="phaser.ts" />
/// <reference path="three.ts" />

module U {
    export module Physics {
        export function init() {
            game.physics.startSystem(Phaser.Physics.P2JS);
        }

        export var defalutCollisionGroup;
        export function initCollisionGroup() {
            U.game.physics.p2.updateBoundsCollisionGroup();
            defalutCollisionGroup = U.CollisionGroup.create();
        }

        export function setGravity(y: number) {
            game.physics.p2.gravity.y = y;
        }

        export function setPostBroadphaseCallback(callback: Function) {
            game.physics.p2.setPostBroadphaseCallback(callback, this);
        }
    }

    export interface HasBody {
        body: Phaser.Physics.P2.Body;
    }
    export module Body {
        export function set(obj) {
            game.physics.p2.enableBody(obj, false);
        }

        export function setStatic(obj: HasBody) {
            obj.body.dynamic = false;
        }

        export function setGravityScale(scale: number) {
            return (obj: HasBody) => {
                obj.body.data.gravityScale = scale;
            }
        }

        export function addSquare(size: number, x: number, y: number) {
            return (obj: HasBody) => {
                obj.body.addRectangle(size, size, x, y);
            }
        }

        export function setCollisionGroup(group: Phaser.Physics.P2.CollisionGroup = null) {
            return (obj: HasBody) => {
                if (!group) {
                    group = Physics.defalutCollisionGroup;
                }
                obj.body.setCollisionGroup(group);
            }
        }

        export function collides(
            collidingTo: Phaser.Physics.P2.CollisionGroup[] = [],
            isCollidingDefault: boolean = true) {
            if (isCollidingDefault) {
                collidingTo.push(Physics.defalutCollisionGroup);
            }
            return (obj: HasBody) => {
                obj.body.collides(collidingTo);
            }
        }

        export function addContactListener(listener: Function) {
            return (obj: HasBody) => {
                obj.body.onBeginContact.add((body, shapeA, shapeB, equation) => {
                    listener(obj, body, shapeA, shapeB, equation);
                });
            }
        }

        export function setNotCollidingWorldBounds(obj: HasBody) {
            obj.body.collideWorldBounds = false;
        }
    }

    export module CollisionGroup {
        export function create(): Phaser.Physics.P2.CollisionGroup {
            return game.physics.p2.createCollisionGroup();
        }
    }

    export module GeometryBody {
        export function addSquare(size: number, x: number, y: number) {
            return (obj) => {
                chain([
                    Geometry.addSquare(size, x, y),
                    Body.addSquare(size, x, y)
                ], obj);
            }
        }

        export function setSingleSquare(size: number) {
            return (obj) => {
                chain([
                    Geometry.setSingleSquare(size),
                    Body.addSquare(size, 0, 0)
                ], obj);
            }
        }
    }

    export module GeomertyMaterialBody {
        export function addSquares(size: number, squares: string[], colors: number[]) {
            return U.addSquaresWithFunc
                (size, squares, colors,
                GeometryBody.addSquare, GeometryBody.setSingleSquare);
        }
    }

    export interface HasBodyMesh extends HasBody, HasMesh { }
    export module BodyMesh {
        export function update(obj: HasBodyMesh) {
            obj.mesh.rotation.z = -obj.body.angle * Math.PI / 180;
        }
    }

    export module Spring {
        export function create(
            obj1: HasBody, obj2: HasBody, offset1: number[], offset2: number[],
            restLength: number = 1, stiffness: number = 100, damping: number = 1):
            Phaser.Physics.P2.Spring {
            return game.physics.p2.createSpring(
                obj1.body, obj2.body, restLength, stiffness, damping,
                null, null, [-offset1[0], -offset1[1]], [-offset2[0], -offset2[1]]);
        }

        export function remove(spring: Phaser.Physics.P2.Spring) {
            game.physics.p2.removeSpring(spring);
        }
    }
}