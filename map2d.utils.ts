import { generator } from "./utils";


export namespace World2D {
    export enum Dir { LEFT = "LEFT", RIGHT = "RIGHT", UP = "UP", DOWN = "DOWN" }
    export type Pos = { x: number, y: number }

    export class Map2d<T>{
        private _cells: Content<T>;
        private _width: number;
        private _height: number;

        constructor(input: Content<T>) {
            this._cells = input;
            this._width = input[0].length;
            this._height = input.length;
        }

        public move_pos(pos: Readonly<Pos> | undefined, dir: Dir): Pos | undefined {
            if (pos === undefined) {
                return undefined;
            }
            switch (dir) {
                case Dir.DOWN:
                    if (pos.y < (this._height - 1)) {
                        return { x: pos.x, y: pos.y + 1 }
                    } else {
                        return undefined
                    }

                case Dir.UP:
                    if (pos.y > 0) {
                        return { x: pos.x, y: pos.y - 1 }
                    } else {
                        return undefined
                    }

                case Dir.LEFT: {
                    if (pos.x > 0) {
                        return { x: pos.x - 1, y: pos.y }
                    } else {
                        return undefined;
                    }
                }
                case Dir.RIGHT: {
                    if (pos.x < (this._width - 1)) {
                        return { x: pos.x + 1, y: pos.y }
                    } else {
                        return undefined;
                    }
                }
            }
        }
        public opposite(dir: Dir): Dir {
            return oppositeDir(dir);
        }
        public apply_to_all(x_dir: Dir, y_dir: Dir, fct: (pos: Pos) => void) {
            const all_y = [...generator(this._height)];
            const all_x = [...generator(this._width)];
            if (x_dir == Dir.LEFT) {
                all_x.reverse();
            }
            if (y_dir == Dir.UP) {
                all_y.reverse();
            }
            all_y.forEach(y => all_x.forEach(x => fct({ x, y })))
        }

        public move_pos_with_cell(pos: Readonly<Pos>, dir: Dir): PosAndCell<T> | undefined {
            const nextPos = this.move_pos(pos, dir);
            if (nextPos === undefined) {
                return undefined;
            }
            return { pos: nextPos, cell: this.cell(nextPos) };
        }

        public move_pos_many(pos: Readonly<Pos> | undefined, directions: Dir[]): Pos | undefined {
            return directions.reduce((curr_pos, dir) => this.move_pos(curr_pos, dir), pos);
        }

        public cell(pos: Readonly<Pos>): T {
            const c = this._cells[pos.y]?.[pos.x];
            if (c === undefined) {
                throw new Error(`Bad position (${pos.x}:${pos.y}) against (w:${this._width},h:${this._height})`)
            }
            return c;
        }

        public set_cell(pos: Readonly<Pos>, new_value: T): T {
            const line = this._cells[pos.y];
            if ((line === undefined) || pos.x < 0 || pos.x >= this._width) {
                throw new Error(`Bad position (${pos.x}:${pos.y}) against (w:${this._width},h:${this._height})`)
            }
            const old = line[pos.x];
            line[pos.x] = new_value;
            return old;
        }


        public move_while(pos: Readonly<Pos>, dir: Dir, pred: Predicate<T>): Pos | undefined {
            let curr_pos: Pos | undefined = { ...pos };
            while ((curr_pos = this.move_pos(curr_pos, dir)) !== undefined) {
                if (!pred(this.cell(curr_pos), curr_pos, dir)) {
                    return curr_pos;
                }
            }
            return undefined;
        }

        public move_while_next(pos: Readonly<Pos>, dir: Dir, pred: Predicate<T>, must_move?: boolean): Pos | undefined {
            let curr_pos: Pos | undefined = { ...pos };
            let next_pos: Pos | undefined;
            while ((next_pos = this.move_pos(curr_pos, dir)) !== undefined) {
                if (!pred(this.cell(next_pos), next_pos, dir)) {
                    break;
                }
                curr_pos = next_pos;
            }
            if (must_move && this.is_same_pos(pos, curr_pos)) {
                return undefined;
            }
            return curr_pos;
        }


        public map_in_dir<U>(pos: Readonly<Pos>, dir: Dir, fct: MapFct<T, U>): U | undefined {
            const next_pos = this.move_pos(pos, dir);
            if (next_pos === undefined) {
                return undefined;
            }
            return fct(this.cell(next_pos), next_pos, dir)
        }

        public apply_in_dir(pos: Pos, dir: Dir, fct: Apply<T>) {
            this.map_in_dir(pos, dir, fct);
        }

        public is_same_pos(pos1: Readonly<Pos>, pos2: Readonly<Pos>): boolean {
            return is_same_pos(pos1, pos2);
        }

        protected toString(fct: ToString<T>): string {
            return this.toStringArray(fct).join("\n");
        }

        protected toStringArray(fct: ToString<T>): string[] {
            return this._cells.map((l, y) => l.map((c, x) => fct(c, { x, y })).join(""));
        }

        public width(): number {
            return this._width;
        }

        public height(): number {
            return this._height;
        }

        public cells(): Content<T> {
            return this._cells;
        }

        public cloned_cells(fct: Clone<T>): Content<T> {
            return this._cells.map((l, y) => l.map((c, x) => fct(c, { x, y })))
        }


    }

    export function allDirections(): [Dir, Dir, Dir, Dir] {
        return [Dir.UP, Dir.DOWN, Dir.LEFT, Dir.RIGHT];
    }
    export function oppositeDir(dir: Dir): Dir {
        switch (dir) {
            case Dir.UP: return Dir.DOWN;
            case Dir.DOWN: return Dir.UP;
            case Dir.LEFT: return Dir.RIGHT;
            case Dir.RIGHT: return Dir.LEFT;
        }
    }

    export function array_contains_pos(array: Readonly<Pos>[], pos: Readonly<Pos>) {
        return array.findIndex(ap => is_same_pos(pos, ap)) >= 0
    }

    export function is_same_pos(pos1: Readonly<Pos>, pos2: Readonly<Pos>): boolean {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    export type Content<T> = T[][];
    export type Clone<T> = (c: T, pos: Readonly<Pos>) => T;
    export type ToString<T> = (c: T, pos: Readonly<Pos>) => string;
    export type Apply<T> = (c: T, pos: Readonly<Pos>, dir: Dir) => void;
    export type MapFct<T, U> = (c: T, pos: Readonly<Pos>, dir: Dir) => U;
    export type Predicate<T> = (c: T, pos: Readonly<Pos>, dir: Dir) => boolean;
    export type PosAndCell<T> = { pos: Pos, cell: T }
}