import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { generator } from "../utils";
enum CellType {
    MIRROR_SLASH = '/',
    MIRROR_BACKSLASH = "\\",
    SPLITTER_HORIZONTAL = "-",
    SPLITTER_VERTICAL = "|",
    EMPTY = "."
}

interface Cell {
    type: CellType,
    is_empowered: boolean,
    casted_rays: Ray[]
}

interface Ray {
    startPos: World2D.Pos,
    dir: World2D.Dir
}

class Day16Map extends World2D.Map2d<Cell>{
    private nb_empowered: number = 0;
    constructor(cells: Cell[][]) {
        super(cells)
    }

    private manage_empower(c: Cell) {
        if (!c.is_empowered) {
            c.is_empowered = true;
            this.nb_empowered++;
        }
    }

    public get_next_ray(new_pos: World2D.Pos, dir: World2D.Dir): Ray[] {
        let potential_rays: Ray[] = [];
        const c = this.cell(new_pos);
        if (c.type === CellType.SPLITTER_HORIZONTAL) {
            this.apply_in_dir(new_pos, World2D.Dir.LEFT, (c, p, d) => {
                potential_rays.push({ dir: d, startPos: p });
            });
            this.apply_in_dir(new_pos, World2D.Dir.RIGHT, (c, p, d) => {
                potential_rays.push({ dir: d, startPos: p });
            });
        } else if (c.type === CellType.SPLITTER_VERTICAL) {
            this.apply_in_dir(new_pos, World2D.Dir.UP, (c, p, d) => {
                potential_rays.push({ dir: d, startPos: p });
            });
            this.apply_in_dir(new_pos, World2D.Dir.DOWN, (c, p, d) => {
                potential_rays.push({ dir: d, startPos: p });
            });
        } else if (c.type === CellType.MIRROR_BACKSLASH) {
            switch (dir) {
                case World2D.Dir.LEFT: this.apply_in_dir(new_pos, World2D.Dir.UP, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.RIGHT: this.apply_in_dir(new_pos, World2D.Dir.DOWN, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.UP: this.apply_in_dir(new_pos, World2D.Dir.LEFT, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.DOWN: this.apply_in_dir(new_pos, World2D.Dir.RIGHT, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
            }
        } else if (c.type === CellType.MIRROR_SLASH) {
            switch (dir) {
                case World2D.Dir.RIGHT: this.apply_in_dir(new_pos, World2D.Dir.UP, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.LEFT: this.apply_in_dir(new_pos, World2D.Dir.DOWN, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.UP: this.apply_in_dir(new_pos, World2D.Dir.RIGHT, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
                case World2D.Dir.DOWN: this.apply_in_dir(new_pos, World2D.Dir.LEFT, (c, p, d) => {
                    potential_rays.push({ dir: d, startPos: p });
                }); break
            }
        }
        const to_cast = potential_rays.filter(r => c.casted_rays.find(cr => this.is_same_pos(r.startPos, cr.startPos)) === undefined);
        to_cast.forEach(tc => c.casted_rays.push(tc));

        return to_cast
    }

    public empoweredView(): string[] {
        return this.toStringArray((c) => c.is_empowered ? "#" : ".");
    }

    public shoot_ray(ray: Ray): Ray[] {
        const start_cell = this.cell(ray.startPos);
        this.manage_empower(start_cell);
        if (start_cell.type !== CellType.EMPTY) {
            return this.get_next_ray(ray.startPos, ray.dir);
        }

        const next_pos = this.move_while(ray.startPos, ray.dir, (c) => {
            this.manage_empower(c);
            return c.type === CellType.EMPTY;
        })
        if (next_pos === undefined) {
            return [];
        }

        return this.get_next_ray(next_pos, ray.dir);
    }

    public empower(start: Ray): number {
        let rays: Ray[] = [start];
        while (rays.length > 0) {
            rays = rays.flatMap(ray => this.shoot_ray(ray));
        }
        return this.nb_empowered;
    }
}

function parse(lines: string[]): Day16Map {
    const map = lines.map(l => l.split('').map(t => {
        let cell: Cell = { type: t as CellType, is_empowered: false, casted_rays: [] };
        return cell;
    }));
    return new Day16Map(map);
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.empower({ startPos: { x: 0, y: 0 }, dir: World2D.Dir.RIGHT });
        logger.debug(() => ["Result :\n"].concat(data.empoweredView()));
        logger.result(result, [46, 7951])
    }
    else {
        let max = -1;
        const clone_cell: World2D.Clone<Cell> = (c) => { return { ...c, casted_rays: [] } };
        max = Math.max(new Day16Map(data.cloned_cells(clone_cell)).empower({ startPos: { x: 0, y: 0 }, dir: World2D.Dir.RIGHT }), max);
        [...generator(data.height())].forEach((y: number) => {
            max = Math.max(new Day16Map(data.cloned_cells(clone_cell)).empower({ startPos: { x: 0, y }, dir: World2D.Dir.RIGHT }), max);
            max = Math.max(new Day16Map(data.cloned_cells(clone_cell)).empower({ startPos: { x: data.width() - 1, y }, dir: World2D.Dir.LEFT }), max);
        });

        [...generator(data.width())].forEach((x) => {
            max = Math.max(new Day16Map(data.cloned_cells(clone_cell)).empower({ startPos: { x: x, y: 0 }, dir: World2D.Dir.DOWN }), max);
            max = Math.max(new Day16Map(data.cloned_cells(clone_cell)).empower({ startPos: { x: x, y: data.height() - 1 }, dir: World2D.Dir.UP }), max);
        });
        logger.result(max, [51, 8148])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(16, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])