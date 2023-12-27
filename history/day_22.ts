import { assert } from "console";
import { Logger, Part, run, Type } from "../day_utils"
import { generator } from "../utils";
import { World2D } from "../map2d.utils";

interface Coord3D {
    x: number,
    y: number,
    z: number
}

interface Brick {
    index: number,
    start: Coord3D,
    end: Coord3D,
    z_fall_offset: number,
    above_bricks: Set<Brick>,
    below_bricks: Set<Brick>,
    touching_above: Set<Brick>,
    touching_below: Set<Brick>,
    safe_discard: boolean,
    nb_above_chained: number,
}

interface Cell {
    curr_max_z: number;
    bricks: Brick[]
}


class World extends World2D.Map2d<Cell>{
    constructor(c: World2D.Content<Cell>, private readonly bricks: Brick[]) {
        super(c);
        bricks.sort((a, b) => a.start.z - b.start.z);
        bricks.forEach(b => {
            for (let x = b.start.x; x <= b.end.x; ++x) {
                for (let y = b.start.y; y <= b.end.y; ++y) {
                    const cell = this.cell({ x, y });
                    if (cell.bricks.length > 0) {
                        const last_top_brick = cell.bricks[cell.bricks.length - 1];
                        last_top_brick.above_bricks.add(b);
                        b.below_bricks.add(last_top_brick);
                    }
                    cell.bricks.push(b);
                }
            }
        });
    }

    public fall(): [number, number] {
        for (const brick of this.bricks) {
            const [max_height_below, touching_bricks_below] = [...brick.below_bricks]
                .reduce((max, below) => {
                    const below_height = below.end.z - below.z_fall_offset;
                    if (below_height > max[0]) {
                        return [below_height, [below]];
                    } else if (below_height === max[0]) {
                        max[1].push(below);
                    }
                    return max;
                },
                    [0, [] as Brick[]]
                );
            brick.z_fall_offset = brick.start.z - max_height_below - 1;
            touching_bricks_below.forEach(b => {
                b.touching_above.add(brick);
                brick.touching_below.add(b);
            })
        }


        let nb_discardable = 0;
        let total_falling = 0;
        for (const brick of this.bricks.reverseCopy()) {
            const fallings = new Set<number>();
            fallings.add(brick.index)
            check_fallings(brick, fallings);
            if (fallings.size === 1) {
                nb_discardable++;
            } else {
                total_falling += fallings.size - 1;
            }
        }
        return [nb_discardable, total_falling];
    }
}

function check_fallings(brick: Brick, failings: Set<number>) {
    let to_check = [...brick.touching_above];
    let next_above_to_check: Brick | undefined;
    while (next_above_to_check = to_check.shift()) {
        const has_no_supporting_block = [...next_above_to_check.touching_below].filter(below => !failings.has(below.index)).length === 0;
        if (has_no_supporting_block) {
            next_above_to_check.touching_above.forEach(above => to_check.push(above));
            failings.add(next_above_to_check.index);
        }
    }
}


function parse(lines: string[]): World {
    let [x_min, x_max] = [0, 0];
    let [y_min, y_max] = [0, 0];

    const bricks = lines
        .map((l, index) => {
            const [startStr, endStr] = l.split("~");
            const [x_s, y_s, z_s] = startStr.split(",").map(n => parseInt(n, 10));
            const [x_e, y_e, z_e] = endStr.split(",").map(n => parseInt(n, 10));
            y_min = Math.min(Math.min(y_min, y_s), y_e);
            x_min = Math.min(Math.min(x_min, x_s), x_e);

            y_max = Math.max(Math.max(y_max, y_s), y_e);
            x_max = Math.max(Math.max(x_max, x_s), x_e);
            assert(x_s <= x_e);
            assert(y_s <= y_e);
            assert(z_s <= z_e);
            const b: Brick = {
                index,
                start: {
                    x: x_s,
                    y: y_s,
                    z: z_s,
                },
                end: {
                    x: x_e,
                    y: y_e,
                    z: z_e,
                },
                z_fall_offset: -1,
                above_bricks: new Set(),
                below_bricks: new Set(),
                touching_above: new Set(),
                touching_below: new Set(),
                safe_discard: false,
                nb_above_chained: 0
            }
            return b;
        });

    const width = x_max + 1;
    const height = y_max + 1;
    assert(x_min >= 0);
    assert(y_min >= 0);

    const cells = [...generator(height)]
        .map(y => [...generator(width)].map(x => {
            const cell: Cell = {
                bricks: [],
                curr_max_z: 0
            }
            return cell;
        }));

    return new World(cells, bricks);
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const [discarded, cumul_falling] = data.fall();

    logger.result([discarded, cumul_falling], [5, 451, 7, 66530]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(22, [Type.TEST, Type.RUN], puzzle, [Part.ALL])