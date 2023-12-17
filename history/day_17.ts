import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils";
import { PriorityQueue, QueuedItem } from "../priority_queue";

class World extends World2D.Map2d<number>{
    public is_debug: boolean = false;
    public is_test: boolean = false;
    public is_part2: boolean = false;
    public display(positions: Readonly<World2D.Pos>[]): string {
        return super.toString((_c, pos) =>
            World2D.array_contains_pos(positions, pos) ? "#" : "."
        )
    }
}

function parse(lines: string[]): World {
    const content = lines.map(l => l.split("").map(n => parseInt(n, 10)));
    return new World(content);
}

interface State {
    dir: World2D.Dir,
    last_pos: Readonly<World2D.Pos>;
    used_pos?: Readonly<World2D.Pos>[],
    nb_total_steps: number,
    nb_steps_in_dir: number,
    heat_loss: number;
}

function calc_cost(state: State, world: World) {
    const last_pos = state.last_pos;
    return state.heat_loss + ((world.height() - last_pos.y - 1) + (world.width() - last_pos.x - 1));
}

function calc_new_state(orig_state: State, heat_loss: number, pos: World2D.Pos, dir: World2D.Dir, is_debug: boolean): State | undefined {
    if (pos.x < orig_state.last_pos.x && pos.y < orig_state.last_pos.y) {
        return undefined;
    }

    return {
        dir,
        last_pos: pos,
        nb_total_steps: orig_state.nb_total_steps + 1,
        nb_steps_in_dir: (dir === orig_state.dir) ? orig_state.nb_steps_in_dir + 1 : 1,
        heat_loss: orig_state.heat_loss + heat_loss,
        used_pos: is_debug ? orig_state.used_pos?.concat([pos]) : undefined
    }
}

function is_valid_nb_step(state: State, dir: World2D.Dir, is_part2: boolean): boolean {
    if (is_part2) {
        if (dir === state.dir) {
            return state.nb_steps_in_dir < 10;
        } else {
            return state.nb_steps_in_dir >= 4;
        }
    }
    else {
        return state.dir !== dir || state.nb_steps_in_dir < 3;
    }

}

function next_possible_states(state: State, world: World): State[] {
    const opposite = World2D.oppositeDir(state.dir);
    return World2D.allDirections().filter(dir => dir !== opposite)
        .filter(dir => is_valid_nb_step(state, dir, world.is_part2))
        .mapNonNull(dir =>
            world.map_in_dir(state.last_pos, dir, (c, p, d) => calc_new_state(state, c, p, d, world.is_debug))
        )
}

function calc_key(state: State) {
    return [state.last_pos.x, state.last_pos.y/*, state.nb_total_steps*/, state.dir, state.nb_steps_in_dir].join("|");
}

function find_path(world: World, logger: Logger): State {
    const pQueue = new PriorityQueue<State>(s => calc_cost(s, world), true);
    const top_left: World2D.Pos = { x: 0, y: 0 };
    const base_state: State = {
        heat_loss: 0,
        used_pos: world.is_debug ? [top_left] : undefined,
        last_pos: top_left,
        nb_total_steps: 0,
        nb_steps_in_dir: 0,
        dir: World2D.Dir.DOWN,
    };
    const last_pos: Readonly<World2D.Pos> = { x: world.width() - 1, y: world.height() - 1 };
    pQueue.put(base_state, calc_key(base_state));
    const base_state_to_right = { ...base_state, dir: World2D.Dir.RIGHT };
    pQueue.put(base_state_to_right, calc_key(base_state_to_right));

    let curr_state_queued: QueuedItem<State> | undefined;
    while ((curr_state_queued = pQueue.pop()) !== undefined) {
        const curr_state = curr_state_queued.item;
        if (world.is_same_pos(curr_state.last_pos, last_pos)) {
            logger.debug(() => `Result after ${pQueue.explored()} explorations :\n${world.display(curr_state.used_pos ?? [])}`)
            return curr_state;
        }

        -next_possible_states(curr_state, world).forEach(s => {
            if (pQueue.put(s, calc_key(s)) === undefined) {
                const inserted = pQueue.explored();
                if (inserted % 10000 === 0) {
                    logger.debug(() => `Expolored ${inserted} / ${pQueue.putsCount()}`)
                }
            }
        })
    }

    throw new Error("Not found path");
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const world = parse(lines);
    world.is_debug = logger.isdebug();
    world.is_test = type == Type.TEST;
    world.is_part2 = part === Part.PART_2
    const result = find_path(world, logger);

    if (part === Part.PART_1) {
        logger.result(result.heat_loss, [102, 1044])
    }
    else {
        logger.result(result.heat_loss, [94, 1227])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(17, [Type.TEST, Type.RUN], puzzle, [Part.PART_1,Part.PART_2], { debug: false })