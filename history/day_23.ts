import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";

enum CellType {
    ROCK = "#",
    EMPTY = ".",
    SLOPE_DOWN = "v",
    SLOPE_UP = "^",
    SLOPE_LEFT = "<",
    SLOPE_RIGHT = ">"
}

interface Edge {
    dir: World2D.Dir,
    linked_cell: Cell,
    distance: number,
    allowed_part1: boolean,
    is_link_to_terminal: boolean;
}

interface Cell {
    id: number,
    mask: [number, number],
    type: CellType,
    is_node_cell: boolean,
    linked_to: Edge[]
}

type World = World2D.Map2d<Cell>;

function has_more_than_three_non_rock_siblings(pos: World2D.Pos, lines: string[]): any {
    const l = lines[pos.y];
    let count =
        (l[pos.x - 1] === CellType.ROCK ? 0 : 1) +
        (l[pos.x + 1] === CellType.ROCK ? 0 : 1) +
        (lines[pos.y - 1][pos.x] === CellType.ROCK ? 0 : 1) +
        (lines[pos.y + 1][pos.x] === CellType.ROCK ? 0 : 1)
    return count >= 3;
}


function parse(lines: string[]): World {
    const forking_pos: World2D.Pos[] = [];
    const manage_node_cell_fct = (type: CellType, pos: World2D.Pos) => {
        if (pos.y === 0 || pos.y === lines.length - 1) {
            return [true, -1] as const;
        }
        const is_node_cell: boolean = type !== CellType.ROCK && has_more_than_three_non_rock_siblings(pos, lines);
        if (!is_node_cell) {
            return [false, -1] as const;
        }
        forking_pos.push(pos);
        return [is_node_cell, forking_pos.length - 1] as const;
    }
    const world = new World2D.Map2d(lines
        .map((l, y) => l.split("")
            .map((c, x) => buildCell(c, manage_node_cell_fct, { x, y }))
        ));

    build_links(world, forking_pos)
    return world;
}

function buildCell(c: string, manage_node_cell_fct: (type: CellType, pos: World2D.Pos) => readonly [boolean, number], pos: World2D.Pos): Cell {
    const type = c as CellType;
    const [is_node_cell, id] = manage_node_cell_fct(type, pos);
    return {
        id,
        type,
        mask: id < 0 ? [0, 0] : (id > 30 ? [1 << (id - 30), 0] : [0, (1 << id)]),
        is_node_cell,
        linked_to: [] as Edge[]
    };
}

function build_link(orig_pos: World2D.Pos, world: World, orig_dir: World2D.Dir, next_pos: World2D.Pos) {
    const start_cell = world.cell(orig_pos);
    let curr_pos = next_pos;
    let curr_dir = orig_dir;
    let is_blocked: [boolean, boolean] = [false, false];
    let dist = 0;
    while (true) {
        dist++;
        const curr_cell = world.cell(curr_pos);
        if (curr_cell.is_node_cell) {
            //console.log(`Link ${start_cell.id} ${curr_cell.id}`)
            if (curr_pos.y !== 0) {
                start_cell.linked_to.push({
                    allowed_part1: !is_blocked[0],
                    dir: orig_dir,
                    distance: dist,
                    linked_cell: curr_cell,
                    is_link_to_terminal: curr_pos.y === 0 || curr_pos.y === world.height() - 1
                });
            }
            if (orig_pos.y !== 0) {
                curr_cell.linked_to.push({
                    allowed_part1: !is_blocked[1],
                    dir: World2D.oppositeDir(curr_dir),
                    distance: dist,
                    linked_cell: start_cell,
                    is_link_to_terminal: orig_pos.y === 0 || orig_pos.y === world.height() - 1
                });
            }

            return;
        }

        if (curr_cell.type !== CellType.EMPTY) {
            switch (curr_cell.type) {
                case CellType.SLOPE_DOWN: is_blocked[curr_dir === World2D.Dir.DOWN ? 1 : 0] = true; break;
                case CellType.SLOPE_UP: is_blocked[curr_dir === World2D.Dir.UP ? 1 : 0] = true; break;
                case CellType.SLOPE_LEFT: is_blocked[curr_dir === World2D.Dir.LEFT ? 1 : 0] = true; break;
                case CellType.SLOPE_RIGHT: is_blocked[curr_dir === World2D.Dir.RIGHT ? 1 : 0] = true; break;
            }
        }

        const next_dirs = [World2D.TurnType.CLOCKWISE, World2D.TurnType.COUNTERCLOCK_WISE, World2D.TurnType.STRAIT]
            .map(turn => World2D.turn_dir(curr_dir, turn));
        for (const next_dir of next_dirs) {
            const next = world.move_pos_with_cell(curr_pos, next_dir);
            if (next !== undefined && next.cell.type !== CellType.ROCK) {
                curr_pos = next.pos;
                curr_dir = next_dir;
                break;
            }
        }
    }
}

function build_links(world: World, node_cell_positions: World2D.Pos[]) {
    for (const node_cell_pos of node_cell_positions) {
        const node_cell = world.cell(node_cell_pos);
        World2D.allDirections()
            .filter(dir => node_cell.linked_to.filter(link => link.dir === dir).length === 0)
            .forEach(dir => {
                const next = world.move_pos_with_cell(node_cell_pos, dir);
                if (next === undefined || next.cell.type === CellType.ROCK) {
                    return undefined;
                }
                build_link(node_cell_pos, world, dir, next.pos);
            })
    }
}

interface State {
    curr_cell: Cell
    nb_step: number;
    explored_nodes: [number, number]
}


function build_next_states(state: State, is_part2: boolean): State[] {
    let next_states: State[] = [];
    for (const next_link of state.curr_cell.linked_to) {
        if (next_link.is_link_to_terminal) {
            return [build_next_state(state, next_link)];
        }
        if ((is_part2 || next_link.allowed_part1) &&
            ((state.explored_nodes[0] & next_link.linked_cell.mask[0]) === 0 && (state.explored_nodes[1] & next_link.linked_cell.mask[1]) === 0)
        ) {
            next_states.push(build_next_state(state, next_link));
        }
    }
    return next_states;
}


function build_next_state(state: State, next_link: Edge): State {
    return {
        nb_step: state.nb_step + next_link.distance,
        explored_nodes: [state.explored_nodes[0] | next_link.linked_cell.mask[0], state.explored_nodes[1] | next_link.linked_cell.mask[1]],
        curr_cell: next_link.linked_cell
    };
}

function find_path(world: World, logger: Logger, is_part2: boolean): number {
    const queued_pos: State[] = [];
    const start_cell = world.cell({ x: 1, y: 0 });

    const ending_cell = world.cell({ x: world.width() - 2, y: world.height() - 1 })
    queued_pos.push({ curr_cell: start_cell, nb_step: 0, explored_nodes: [0, 0] });
    let next_queued_state: State | undefined;
    let nb_pop = 0;
    let max_dist = 0;
    while (next_queued_state = queued_pos.pop()) {
        nb_pop++;
        const curr_state = next_queued_state;
        if (curr_state.curr_cell === ending_cell) {
            max_dist = Math.max(curr_state.nb_step, max_dist);
            continue;
        }
        for (const next_state of build_next_states(curr_state, is_part2)) {
            queued_pos.push(next_state);
        }
    }
    logger.log(`Nb put ${nb_pop} `)
    return max_dist
}

function display(world: World, logger: Logger) {
    logger.debug(() => ["Result:"].concat(world.cells().map(l =>
        l.map(c => {
            if (c.is_node_cell) return "C";
            if (c.type === CellType.ROCK) { return " " }
            return c.type;
        }).join("")
    )))
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const world = parse(lines);
    display(world, logger);
    const resultPart1 = find_path(world, logger, false);
    const resultPart2 = find_path(world, logger, true);
    logger.result([resultPart1, resultPart2], [94, 2230, 154, 6542])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(23, [Type.TEST, Type.RUN], puzzle, [Part.ALL], { debug: false })

