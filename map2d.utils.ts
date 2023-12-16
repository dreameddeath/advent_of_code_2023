

export namespace World2D {
    export enum Dir { LEFT = "L", RIGHT = "R", UP = "U", DOWN = "D" }
    export type Pos = { x: number, y: number }

    export class Map2d<T>{
        private _cells: T[][];
        private _width: number;
        private _height: number;

        constructor(input: T[][]) {
            this._cells = input;
            this._width = input[0].length;
            this._height = input.length;
        }

        public move_pos(pos: Pos, dir: Dir): Pos | undefined {
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

        public cell(pos: Pos): T {
            const c = this._cells[pos.y]?.[pos.x];
            if (c === undefined) {
                throw new Error(`Bad position (${pos.x}:${pos.y}) against (w:${this._width},h:${this._height})`)
            }
            return c;
        }
        public move_while(pos: Pos, dir: Dir, pred: Predicate<T>): Pos | undefined {
            let curr_pos: Pos | undefined = { ...pos };
            while ((curr_pos = this.move_pos(curr_pos, dir)) !== undefined) {
                if (!pred(this.cell(curr_pos), curr_pos, dir)) {
                    return curr_pos;
                }
            }
            return undefined;
        }

        public map_in_dir<U>(pos: Pos, dir: Dir, fct: MapFct<T,U>): U | undefined {
            const next_pos = this.move_pos(pos, dir);
            if (next_pos === undefined) {
                return undefined;
            }
            return fct(this.cell(next_pos), next_pos, dir)
        }

        public apply_in_dir(pos: Pos, dir: Dir, fct: Apply<T>) {
            this.map_in_dir(pos, dir, fct);
        }

        public is_same_pos(pos1: Pos, pos2: Pos): boolean {
            return pos1.x === pos2.x && pos1.y === pos2.y;
        }

        protected toString(fct:ToString<T>):string{
            return this.toStringArray(fct).join("\n");
        }

        protected toStringArray(fct:ToString<T>):string[]{
            return this._cells.map((l,y)=>l.map((c,x)=>fct(c,{x,y})).join(""));
        }

        public width():number{
            return this._width;
        }

        public height():number{
            return this._height;
        }

        public cells():T[][]{
            return this._cells;
        }

        public cloned_cells(fct:Clone<T>):T[][]{
            return this._cells.map((l,y)=>l.map((c,x)=>fct(c,{x,y})))
        }
    }

    export type Clone<T>=(c:T,pos:Pos)=>T;
    export type ToString<T>=(c:T,pos:Pos)=>string;
    export type Apply<T>=(c: T, pos: Pos, dir: Dir) => void;
    export type MapFct<T,U>=(c: T, pos: Pos, dir: Dir) => U;
    export type Predicate<T>=(c: T, pos: Pos, dir: Dir) => boolean;
}