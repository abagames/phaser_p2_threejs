/// <reference path="../../typings/lodash/lodash.d.ts" />
/// <reference path="../../typings/phaser/phaser.d.ts" />
/// <reference path="three.ts" />

module U {
    export var game: Phaser.Game;
    export function initGame(width: number, height: number, state) {
        game = new Phaser.Game(width, height, Phaser.WEBGL, null, state);
    }

    export module Key {
        export var cursors: Phaser.CursorKeys;
        export var button: Phaser.Key;
        export function init() {
            cursors = game.input.keyboard.createCursorKeys();
            button = game.input.keyboard.addKey(Phaser.Keyboard.Z);
        }
    }

    export module Sprite {
        export function get(group: Phaser.Group = null) {
            var sprite;
            if (group) {
                sprite = group.create(0, 0, null);
            } else {
                sprite = new Phaser.Sprite(game, 0, 0);
            }
            sprite.width = sprite.height = 0;
            game.add.existing(sprite);
            return sprite;
        }

        export function setUpdate(func: Function) {
            return (obj: Phaser.Sprite) => {
                obj.update = () => {
                    func(obj)
                }
            }
        }

        export function removeWhenOutOfWorldBounds(width: number, height: number,
            isAfterEntering: boolean = false) {
            return (obj: Phaser.Sprite) => {
                obj.width = width;
                obj.height = height;
                obj.checkWorldBounds = true;
                if (isAfterEntering) {
                    obj.events.onEnterBounds.add(markEntering, this);
                    obj.events.onOutOfBounds.add(removeIfAfterEntering, this);
                } else {
                    obj.events.onOutOfBounds.add(remove, this);
                }
            }
        }

        export function remove(obj) {
            if (obj.hasOwnProperty('mesh')) {
                U.Mesh.remove(obj);
            }
            obj.kill();
        }

        export function removeIfAfterEntering(obj) {
            if (obj.isEntering) {
                remove(obj);
            }
        }

        export function markEntering(obj) {
            obj.isEntering = true;
        }
    }

    export interface HasName {
        name: string;
    }
    export module Name {
        export function set(name: string) {
            return (obj) => {
                obj.name = name;
            }
        }

        export function is(name: string) {
            return (obj): boolean => {
                return (obj.name === name);
            }
        }
    }

    export interface HasPosition {
        position: Phaser.Point;
    }
    export module Position {
        export function set(x: number, y: number) {
            return (obj: HasPosition) => {
                obj.position.x = x;
                obj.position.y = y;
            }
        }
    }

    export function chain(funcs: Function[], obj = {}) {
        _.forEach(funcs, (f) => f(obj));
        return obj;
    }
}
