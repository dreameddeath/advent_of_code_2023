import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";

enum TypeCell {
    EMPTY = ".",
    START = "S",
    ROCK = "#"
}

interface Cell {
    type: TypeCell,
    is_reached: boolean
    is_reached_per_tile: Set<string>
}

class World extends World2D.Map2d<Cell>{
    public readonly nb_possible_per_tile: number;
    public readonly tiles_reached: Set<string> = new Set();

    constructor(_orig: World2D.Content<Cell>, public readonly start: World2D.Pos) {
        super(_orig);
        this.nb_possible_per_tile = _orig.flatMap(l => l.filter(c => c.type !== TypeCell.ROCK)).length;
        this.tiles_reached.add("0|0");
    }

    public calc_normalized_pos(src: World2D.Pos): { tile: World2D.Pos, pos: World2D.Pos } {
        const x_mod = (src.x % this.width());
        const new_x = Math.abs(x_mod < 0 ? x_mod + this.width() : x_mod);

        const y_mod = (src.y % this.height());
        const new_y = Math.abs(y_mod < 0 ? y_mod + this.width() : y_mod);
        const tile: World2D.Pos = { x: Math.floor(src.x / this.width()), y: Math.floor(src.y / this.height()) };
        return {
            tile,
            pos: {
                x: new_x,
                y: new_y
            }
        }
    }

    public is_newly_reached_and_mark(orig_pos: World2D.Pos, is_part2: boolean): [boolean, boolean] {
        if (!is_part2) {
            const cell = this.cell(orig_pos);
            if (cell.type === TypeCell.ROCK) {
                return [false, false];
            }
            if (cell.is_reached) {
                return [false, false];
            }
            cell.is_reached = true;
            return [true, false];
        }
        const { tile, pos } = this.calc_normalized_pos(orig_pos);
        const tile_id = `${tile.x}|${tile.y}`;
        const cell = this.cell(pos);
        if (cell.type === TypeCell.ROCK) {
            return [false, false];
        }
        if (cell.is_reached_per_tile.has(tile_id)) {
            return [false, false];
        }
        else {
            cell.is_reached_per_tile.add(tile_id);
            let border_of_tile_reached: World2D.Pos[] = [];
            if (pos.x === 0) {
                border_of_tile_reached.push({ x: tile.x - 1, y: tile.y })
            }
            if ((pos.x + 1) === this.width()) {
                border_of_tile_reached.push({ x: tile.x + 1, y: tile.y })
            }
            if (pos.y === 0) {
                border_of_tile_reached.push({ x: tile.x, y: tile.y - 1 })
            }
            if ((pos.y + 1) === this.height()) {
                border_of_tile_reached.push({ x: tile.x, y: tile.y + 1 })
            }
            const new_tiles_reached = border_of_tile_reached.filter(t => t.x === 0 || t.y === 0).map(next_tile => `${next_tile.x}|${next_tile.y}`).filter(next_tid => !this.tiles_reached.has(next_tid));
            new_tiles_reached.forEach(next_tid => this.tiles_reached.add(next_tid));
            return [true, new_tiles_reached.length > 0];
        }
    }

    public move_pos_effective(pos: World2D.Pos, dir: World2D.Dir, is_part2: boolean): any {
        if (!is_part2) {
            return this.move_pos(pos, dir)
        } else {
            return World2D.move_pos(pos, dir);
        }
    }

}

function parse(lines: string[]): World {
    const start: World2D.Pos = { x: 0, y: 0 };
    return new World(lines.map((l, y) => l.split("").map((c, x) => {
        const cell: Cell = {
            type: c as TypeCell,
            is_reached: false,
            is_reached_per_tile: new Set<string>()
        };
        if (cell.type === TypeCell.START) {
            start.x = x;
            start.y = y;
        }
        return cell;
    })), start);
}

type InfoBorderReached = { dist: number, total_cell: number, delta_dist?: number, delta_cells?: number, delta_cell_growth?: number };
function count_possible_places(target_dist: number, world: World, is_part2: boolean): number {
    let currDist = 0;
    world.is_newly_reached_and_mark(world.start, is_part2)
    const cycle_nodes = [1, 0];
    let pos_to_explore: World2D.Pos[] = [{ x: world.start.x, y: world.start.y }];
    let border_reached_at_dists: InfoBorderReached[] = [];
    while (currDist < target_dist) {
        currDist++;
        const next_pos_to_explore: World2D.Pos[] = [];
        let is_border_reached = false;
        for (const pos of pos_to_explore) {
            const next_pos_to_check = World2D.allDirections().mapNonNull(dir => world.move_pos_effective(pos, dir, is_part2));
            for (const next_pos of next_pos_to_check) {
                const [is_newly_reached, is_border] = world.is_newly_reached_and_mark(next_pos, is_part2)
                if (is_newly_reached) {
                    if (is_border) {
                        is_border_reached = true
                    }
                    cycle_nodes[currDist % 2]++;
                    next_pos_to_explore.push(next_pos)
                }
            }
        }
        if (is_border_reached) {
            const new_value: InfoBorderReached = { dist: currDist, total_cell: cycle_nodes[currDist % 2] };
            if (border_reached_at_dists.length > 0) {
                const last = border_reached_at_dists[border_reached_at_dists.length - 1];
                new_value.delta_cells = new_value.total_cell - last.total_cell;
                new_value.delta_dist = new_value.dist - last.dist;
                new_value.delta_cell_growth = new_value.delta_cells - (last.delta_cells ?? 0);
                if (new_value.delta_cell_growth === last.delta_cell_growth && new_value.delta_dist === last.delta_dist) {
                    if ((target_dist - currDist) % new_value.delta_dist !== 0) {
                        throw new Error("Strange");
                    }
                    const nb_missing_loops = (target_dist - currDist) / new_value.delta_dist;
                    const next_step = new_value.delta_cells + new_value.delta_cell_growth;
                    const last_step = new_value.delta_cells + new_value.delta_cell_growth * nb_missing_loops;
                    return new_value.total_cell + (next_step + last_step) * nb_missing_loops / 2
                }
            }
            border_reached_at_dists.push(new_value)
        }
        pos_to_explore = next_pos_to_explore;
    }

    return cycle_nodes[currDist % 2];
}





function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const resultv2 = count_possible_places(type === Type.TEST ? 6 : 64, data, false);
        logger.result(resultv2, [16, 3830])
    }
    else {
        const target_steps = (type === Type.TEST) ? 98 : 26501365;
        const result = count_possible_places(target_steps, data, true);
        //Part 2 , init 65 mod 131
        logger.result(result, [6301, 637087163925555])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(21, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])