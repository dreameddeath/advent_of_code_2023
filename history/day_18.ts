import { assert } from "console";
import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { generator } from "../utils";


interface Rule {
    dir: World2D.Dir,
    dist: number
}

function toDir(s: string): World2D.Dir {
    switch (s) {
        case "L": return World2D.Dir.LEFT;
        case "R": return World2D.Dir.RIGHT;
        case "U": return World2D.Dir.UP;
        case "D": return World2D.Dir.DOWN;
        default: throw new Error("Unknown " + s);
    }
}

function toDirPart2(s: string): World2D.Dir {
    switch (s) {
        case "0": return World2D.Dir.RIGHT;
        case "1": return World2D.Dir.DOWN;
        case "2": return World2D.Dir.LEFT;
        case "3": return World2D.Dir.UP;
        default: throw new Error("Unknown " + s);
    }
}



function parse(lines: string[], isPart2: boolean): Rule[] {
    return lines
        .map(l => {
            const [dirStr, distStr, colorStr] = l.split(/\s+/);
            const rule: Rule = isPart2 ? {
                dir: toDirPart2(colorStr.slice(-2, -1)),
                dist: parseInt(colorStr.slice(2, -2), 16)
            } : {
                dir: toDir(dirStr),
                dist: parseInt(distStr, 10),
            }
            return rule
        });
}

interface Coords {
    upperLeft: World2D.Pos,
    downRight: World2D.Pos,
    possible_x: Set<number>,
    possible_y: Set<number>,
}

function calc_coord_partial(currPos: World2D.Pos, rule: Rule, currCoords: Coords): World2D.Pos {
    currPos = World2D.move_pos(currPos, rule.dir, rule.dist);
    currCoords.possible_x.add(currPos.x);
    currCoords.possible_y.add(currPos.y);
    currCoords.upperLeft.x = Math.min(currPos.x, currCoords.upperLeft.x);
    currCoords.upperLeft.y = Math.min(currPos.y, currCoords.upperLeft.y);
    currCoords.downRight.x = Math.max(currPos.x, currCoords.downRight.x);
    currCoords.downRight.y = Math.max(currPos.y, currCoords.downRight.y);
    return currPos;
}
function calc_coord(rules: Rule[]): Coords {
    let currPos: World2D.Pos = { x: 0, y: 0 };
    const currCoords: Coords = {
        upperLeft: { x: 0, y: 0 },
        downRight: { x: 0, y: 0 },
        possible_x: new Set(),
        possible_y: new Set()
    };
    for (const rule of rules) {
        currPos = calc_coord_partial(currPos, rule, currCoords);
    }
    return currCoords;
}

enum CellType {
    BORDER = 'B',
    EMPTY = '.',
    FILLED = '#'
}

interface Cell {
    type: CellType,
    is_start: boolean,
    size: {
        x: number,
        y: number,
        total: bigint
    },
    realPos: World2D.Pos
}

class World extends World2D.Map2d<Cell>{

    constructor(possible_x: number[], possible_y: number[]) {
        super(World.build_map(possible_x, possible_y));
    }

    public mapPosition(normal: World2D.Pos): World2D.Pos {
        return this.cells().flatMap((l, y) => l.mapNonNull((c, x) => {
            if (c.realPos.x === normal.x && c.realPos.y === normal.y) {
                return { x, y }
            } else { return undefined }
        }))[0];
    }

    private static build_map(possible_x: number[], possible_y: number[]): Cell[][] {
        const x_sizes = World.calc_size_map(possible_x);
        const y_sizes = World.calc_size_map(possible_y);
        assert(x_sizes.reduce((a, b) => a + b.size, 0) == possible_x[possible_x.length - 1] - possible_x[0] + 1, "Bad x calc");
        assert(y_sizes.reduce((a, b) => a + b.size, 0) == possible_y[possible_y.length - 1] - possible_y[0] + 1, "Bad x calc");

        return [...generator(y_sizes.length)].map(y => [...generator(x_sizes.length)].map(x => {
            return {
                type: CellType.EMPTY,
                realPos: {
                    x: x_sizes[x].coord,
                    y: y_sizes[y].coord,
                },
                is_start: false,
                size: {
                    x: x_sizes[x].size,
                    y: y_sizes[y].size,
                    total: BigInt(x_sizes[x].size) * BigInt(y_sizes[y].size)
                }
            } as Cell
        }))
    }

    private static calc_size_map(possible_v: number[]): { coord: number, size: number }[] {
        return possible_v.flatMap((v, index, array) => {
            if (index === 0) {
                return [{ coord: v, size: 1 }]
            } else {
                const previous = array[index - 1];
                const size = v - array[index - 1];
                if (size === 1) {
                    return [{ coord: v, size: 1 }];
                } else {
                    return [{ coord: previous + 1, size: size - 1 }, { coord: v, size: 1 }]
                }
            }
        });
    }


    public view(): string[] {
        return this.cells().flatMap(l => {
            let repeat_y = l[0].size.y;
            let single_line = l.map(c => (c.is_start ? "S" : c.type).repeat(c.size.x)).join("");
            let result: string[] = [];
            while (repeat_y > 0) {
                result.push(single_line);
                repeat_y--;
            }
            return result;
        })
    }
}

function applyRules(rules: Rule[], startPos: World2D.Pos, world: World, logger: Logger, is_part1: boolean): bigint {
    const { is_globally_clockwise, nb_border } = drawBorder(startPos, world, rules);
    if (is_part1) {
        logger.debug(() => ["Result"].concat(world.view()));
    }
    const filled = fill_world(startPos, world, rules, is_globally_clockwise);
    if (is_part1) {
        logger.debug(() => ["Result Filled " + filled].concat(world.view()));
    }



    return nb_border + filled;
}

function fill_one(pos: World2D.Pos, world: World): bigint {
    const cell = world.cell_opt(pos);
    if (cell == undefined || cell.type !== CellType.EMPTY) {
        return 0n;
    }
    cell.type = CellType.FILLED;
    return cell.size.total;
}
function fill(pos: World2D.Pos, world: World): bigint {
    const to_fill_array: World2D.Pos[] = [pos];
    let to_fill: World2D.Pos | undefined = undefined;
    let nb_filled = 0n;
    while (to_fill = to_fill_array.shift()) {
        let curr_pos = to_fill;
        let nb_filled_one = fill_one(curr_pos, world)
        if (nb_filled_one > 0n) {
            nb_filled += nb_filled_one;
            World2D.allDirections().forEach(dir => to_fill_array.push(World2D.move_pos(curr_pos, dir)))
        }
    }
    return nb_filled;
}

const IS_SIMPLE_SHAPE = true;

function fill_world(startPos: World2D.Pos, world: World, rules: Rule[], is_globally_clockwise: boolean): bigint {
    let currPos = { ...startPos };
    let last_dir: World2D.Dir | undefined = undefined;
    let nb_filled = 0n;
    for (const rule of rules) {
        if (last_dir !== undefined) {
            let pos_to_fill = World2D.Fill.pos_to_fill(currPos, last_dir, rule.dir, is_globally_clockwise);
            if (Array.isArray(pos_to_fill)) {
                nb_filled += fill(pos_to_fill[0], world)
                nb_filled += fill(pos_to_fill[1], world)
                nb_filled += fill(pos_to_fill[2], world)
            } else {
                nb_filled += fill(pos_to_fill, world)
            }
            if (IS_SIMPLE_SHAPE) {
                return nb_filled;
            }
        }
        last_dir = rule.dir
        let remaining_dist = rule.dist;
        let last_cell = world.cell(currPos);
        while (remaining_dist > 0) {
            const move_in_dir = [World2D.Dir.LEFT, World2D.Dir.RIGHT].includes(rule.dir) ? last_cell.size.x : last_cell.size.y;
            remaining_dist -= move_in_dir;
            currPos = World2D.move_pos(currPos, rule.dir);
            last_cell = world.cell(currPos);

        }

    }
    return nb_filled;
}

function drawBorder(startPos: World2D.Pos, world: World, rules: Rule[]): { is_globally_clockwise: boolean, nb_border: bigint } {
    let currPos = { ...startPos };
    let start_cell = world.cell(currPos);
    start_cell.type = CellType.BORDER;
    start_cell.is_start = true;
    let nb_border = start_cell.size.total;
    let clockwise_sum = 0;
    let last_dir: World2D.Dir | undefined = undefined;
    for (const rule of rules) {
        if (last_dir !== undefined) {
            switch (World2D.turn_type(last_dir, rule.dir)) {
                case World2D.TurnType.CLOCKWISE: clockwise_sum++; break;
                case World2D.TurnType.COUNTERCLOCK_WISE: clockwise_sum--; break;
                default: throw new Error("Shouldn't occcurs");
            }
        }
        last_dir = rule.dir;
        let remaining_dist = rule.dist;
        let last_cell = world.cell(currPos);
        while (remaining_dist > 0) {
            const move_in_dir = [World2D.Dir.LEFT, World2D.Dir.RIGHT].includes(rule.dir) ? last_cell.size.x : last_cell.size.y;
            remaining_dist -= move_in_dir;
            currPos = World2D.move_pos(currPos, rule.dir);
            last_cell = world.cell(currPos);

            if (last_cell.type !== CellType.BORDER) {
                last_cell.type = CellType.BORDER;
                nb_border += last_cell.size.total;
            }

        }

    }

    return { is_globally_clockwise: clockwise_sum > 0, nb_border };
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const rules = parse(lines, part === Part.PART_2);
    const currCoords = calc_coord(rules);
    const possible_x = [...currCoords.possible_x].sortIntuitive();
    const possible_y = [...currCoords.possible_y].sortIntuitive();
    const map = new World(possible_x, possible_y);
    const result = applyRules(rules, map.mapPosition({ x: 0, y: 0 }), map, logger, part === Part.PART_1);

    if (part === Part.PART_1) {
        logger.result(result, [62n, 50746n])
    }
    else {
        logger.result(result, [952408144115n, 70086216556038n])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(18, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })

