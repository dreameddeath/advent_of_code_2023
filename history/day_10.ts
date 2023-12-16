import { Logger, Part, run, Type } from "../day_utils"
import { World2D } from "../map2d.utils"

enum CellType {
    VERTICAL = '|',
    HORIZONTAL = '-',
    CORNER_BOTTOM_LEFT = 'L',
    CORNER_BOTTOM_RIGHT = 'J',
    CORNER_TOP_RIGHT = '7',
    CORNER_TOP_LEFT = 'F',
    NONE = '.',
    START = 'S',
    EDGE = 'E',
    FILLED = "#"
}


class World extends World2D.Map2d<CellType>{
    constructor(public readonly start: Readonly<World2D.Pos>, c: World2D.Content<CellType>) {
        super(c);
    }

    public toString():string{
        return super.toString((c)=>c);
    }
}

interface CurrState {
    nb_step: number,
    nb_clock_wise_turns: number
    allPos: World2D.Pos[],
}


interface LoopInfo {
    loop: Readonly<World2D.Pos>[],
    nb_step: number,
    is_clock_wise: boolean
};



function moveDiagonals(world: World, pos: World2D.Pos | undefined, directions: [World2D.Dir, World2D.Dir]): (World2D.Pos | undefined)[] {
    return [
        world.move_pos(pos, directions[0]),
        world.move_pos(pos, directions[1]),
        world.move_pos_many(pos, directions),
    ];
}


function getNextPossiblePosInfo(world: World, pos: Readonly<World2D.Pos>, dir: World2D.Dir): World2D.PosAndCell<CellType> | undefined {
    const nextPosInfo = world.move_pos_with_cell(pos, dir);
    if (nextPosInfo === undefined) {
        return undefined;
    }
    if (nextPosInfo.cell === CellType.NONE || nextPosInfo.cell === CellType.START) {
        return undefined;
    }
    return nextPosInfo;
}


function getNextPossibleDirs(type: CellType): [World2D.Dir, World2D.Dir] {
    switch (type) {
        case CellType.HORIZONTAL:
            return [World2D.Dir.LEFT, World2D.Dir.RIGHT];
        case CellType.VERTICAL:
            return [World2D.Dir.DOWN, World2D.Dir.UP];
        case CellType.CORNER_BOTTOM_LEFT:
            return [World2D.Dir.RIGHT, World2D.Dir.UP];
        case CellType.CORNER_BOTTOM_RIGHT:
            return [World2D.Dir.LEFT, World2D.Dir.UP];
        case CellType.CORNER_TOP_LEFT:
            return [World2D.Dir.RIGHT, World2D.Dir.DOWN];
        case CellType.CORNER_TOP_RIGHT:
            return [World2D.Dir.LEFT, World2D.Dir.DOWN];
        default:
            throw new Error("Cannot move from " + type);
    }
}



function moveNextState(world: World, state: CurrState): CurrState | undefined {
    const currPos = state.allPos[state.allPos.length - 1];
    const currType = world.cell(currPos);
    const previousPos = state.allPos[state.allPos.length - 2];
    const [dir1, dir2] = getNextPossibleDirs(currType);
    const [nextPosInfo1, nextPosInfo2] = [getNextPossiblePosInfo(world, currPos, dir1), getNextPossiblePosInfo(world, currPos, dir2)];
    const isDir1Applicable = nextPosInfo1 !== undefined && !world.is_same_pos(nextPosInfo1.pos, previousPos);
    const isDir2Applicable = nextPosInfo2 !== undefined && !world.is_same_pos(nextPosInfo2.pos, previousPos);
    const nextPos = isDir1Applicable ? nextPosInfo1 : (isDir2Applicable ? nextPosInfo2 : undefined);
    if (nextPos === undefined) {
        return undefined;
    }
    state.allPos.push(nextPos.pos);
    let newState: CurrState = {
        nb_step: state.nb_step + 1,
        allPos: state.allPos,
        nb_clock_wise_turns: state.nb_clock_wise_turns
    };
    const vect_prod = (currPos.x - previousPos.x) * (nextPos.pos.y - currPos.y) - (currPos.y - previousPos.y) * (nextPos.pos.x - currPos.x);
    if (vect_prod < 0) {
        newState.nb_clock_wise_turns--;
    } else if (vect_prod > 0) {
        newState.nb_clock_wise_turns++;
    }
    return newState;
}
function moveNext(world: World, states: CurrState[]): CurrState[] | LoopInfo {
    const nextStates = states.mapNonNull(state => moveNextState(world, state));
    nextStates.sort((a, b) => {
        const aCurrPos = a.allPos[a.allPos.length - 1];
        const bCurrPos = b.allPos[b.allPos.length - 1];
        let y_delta = aCurrPos.y - bCurrPos.y;
        if (y_delta !== 0) {
            return y_delta;
        }
        return aCurrPos.x - aCurrPos.x;
    });
    for (let pos = 1; pos < nextStates.length; ++pos) {
        const prev = nextStates[pos - 1];
        const curr = nextStates[pos];
        if (world.is_same_pos(prev.allPos[prev.allPos.length - 1], curr.allPos[curr.allPos.length - 1])) {
            if (prev.nb_step !== curr.nb_step) {
                throw new Error("Strange loop found");
            }
            const loop = prev.allPos.slice(0, -1).concat(curr.allPos.slice(1).reverse());
            const nb_clock_wise_turns = prev.nb_clock_wise_turns - curr.nb_clock_wise_turns;
            return {
                nb_step: prev.nb_step,
                loop,
                is_clock_wise: nb_clock_wise_turns > 0
            }
        }
    }
    return nextStates;
}

function getPossibleStartInfo(world: World, dir: World2D.Dir): World2D.PosAndCell<CellType> | undefined {
    const nextPosInfo = getNextPossiblePosInfo(world, world.start, dir);
    if (nextPosInfo === undefined) {
        return undefined;
    }
    const [dir1, dir2] = getNextPossibleDirs(nextPosInfo.cell);
    const [posDir1, posDir2] = [world.move_pos(nextPosInfo.pos, dir1), world.move_pos(nextPosInfo.pos, dir2)];
    if (posDir1 !== undefined && world.is_same_pos(posDir1, world.start)) {
        return nextPosInfo;
    } else if (posDir2 !== undefined && world.is_same_pos(posDir2, world.start)) {
        return nextPosInfo;
    }
    return undefined;
}

function getLoopInfo(world: World): LoopInfo {
    let currStates: CurrState[] = ALL_DIR.mapNonNull(dir => getPossibleStartInfo(world, dir))
        .map(next => {
            return {
                currType: next.cell,
                currPos: next.pos,
                previousPos: world.start,
                nb_step: 1,
                allPos: [world.start, next.pos],
                nb_clock_wise_turns: 0,
                nb_counter_clock_wise_turns: 0,
            }
        })
    while (true) {
        let next = moveNext(world, currStates);
        if ("nb_step" in next) {
            return next;

        }
        currStates = next;
    }
}

const ALL_DIR = [World2D.Dir.DOWN, World2D.Dir.UP, World2D.Dir.RIGHT, World2D.Dir.LEFT];

function fillIfPossible(pos: World2D.Pos | undefined, world: World): number {
    if (pos === undefined) {
        return 0;
    }
    const type = world.cell(pos);
    if (type === CellType.EDGE || type === CellType.FILLED) {
        return 0;
    }
    world.set_cell(pos, CellType.FILLED);

    return ALL_DIR.map(dir => fillIfPossible(world.move_pos(pos, dir), world)).reduce((a, b) => a + b, 1);
}

enum TurnPartToFill {
    INNER = 'I',
    OUTER = 'O'
}

function turn_part_to_fill(vect_prod: number, is_clock_wise_loop: boolean): TurnPartToFill {
    if (vect_prod > 0 && is_clock_wise_loop) {
        return TurnPartToFill.INNER
    } else if (vect_prod < 0 && !is_clock_wise_loop) {
        return TurnPartToFill.INNER;
    }
    return TurnPartToFill.OUTER
}

function getToFill(edges: readonly [World2D.Pos, World2D.Pos, World2D.Pos], world: World, is_clock_wise_loop: boolean, origWorld: World): (World2D.Pos | undefined)[] {
    const vect_prod = (edges[1].x - edges[0].x) * (edges[2].y - edges[1].y) - (edges[1].y - edges[0].y) * (edges[2].x - edges[1].x);
    if (vect_prod === 0) {
        const isVertical = edges[0].x === edges[2].x;
        if (isVertical) {
            const isTopToBottom = edges[0].y < edges[2].y;
            if (isTopToBottom) {
                return [world.move_pos(edges[1], is_clock_wise_loop ? World2D.Dir.LEFT : World2D.Dir.RIGHT)]
            } else {
                return [world.move_pos(edges[1], is_clock_wise_loop ? World2D.Dir.RIGHT : World2D.Dir.LEFT)]
            }
        } else {
            const isLeftToRight = edges[0].x < edges[2].x
            if (isLeftToRight) {
                return [world.move_pos(edges[1], is_clock_wise_loop ? World2D.Dir.DOWN : World2D.Dir.UP)]
            } else {
                return [world.move_pos(edges[1], is_clock_wise_loop ? World2D.Dir.UP : World2D.Dir.DOWN)]
            }
        }
    } else {
        const type = origWorld.cell(edges[1]);
        const zone = turn_part_to_fill(vect_prod, is_clock_wise_loop);
        switch (zone) {
            case TurnPartToFill.INNER: {
                switch (type) {
                    case CellType.CORNER_BOTTOM_LEFT: return [world.move_pos_many(edges[1], [World2D.Dir.UP, World2D.Dir.RIGHT])];
                    case CellType.CORNER_BOTTOM_RIGHT: return [world.move_pos_many(edges[1], [World2D.Dir.UP, World2D.Dir.LEFT])];
                    case CellType.CORNER_TOP_LEFT: return [world.move_pos_many(edges[1], [World2D.Dir.DOWN, World2D.Dir.RIGHT])];
                    case CellType.CORNER_TOP_RIGHT: return [world.move_pos_many(edges[1], [World2D.Dir.DOWN, World2D.Dir.LEFT])];
                }
                break;
            }
            case TurnPartToFill.OUTER: {
                switch (type) {
                    case CellType.CORNER_BOTTOM_LEFT: return moveDiagonals(world, edges[1], [World2D.Dir.DOWN, World2D.Dir.LEFT]);
                    case CellType.CORNER_BOTTOM_RIGHT: return moveDiagonals(world, edges[1], [World2D.Dir.DOWN, World2D.Dir.RIGHT]);
                    case CellType.CORNER_TOP_LEFT: return moveDiagonals(world, edges[1], [World2D.Dir.UP, World2D.Dir.LEFT]);
                    case CellType.CORNER_TOP_RIGHT: return moveDiagonals(world, edges[1], [World2D.Dir.UP, World2D.Dir.RIGHT]);
                }
                break;
            }
        }
        throw new Error("Shouldn't occurs");
    }

}


function tryFill(edges: readonly [World2D.Pos, World2D.Pos, World2D.Pos], world: World, is_clock_wise_loop: boolean, origWorld: World): number {
    const cellsToFill = getToFill(edges, world, is_clock_wise_loop, origWorld);
    return cellsToFill.reduce((count, cell) => count + fillIfPossible(cell, world), 0);
}

function parse(lines: string[]): World {
    let start_index: World2D.Pos = { x: 0, y: 0 };
    const map = lines
        .map((l, y) => l.split("").map((t, x) => {
            if (t === CellType.START) {
                start_index = { x, y };
            }
            return t
        }) as CellType[]);
    return new World(start_index, map)
}


function puzzle(lines: string[], _part: Part, _type: Type, logger: Logger): void {
    const world = parse(lines);
    const loopInfo = getLoopInfo(world);

    const origWorld = new World(world.start,world.cloned_cells((c)=>c))


    loopInfo.loop.forEach(pos => world.set_cell(pos,CellType.EDGE));

    logger.debug(() => "\n" + world.toString())

    let count = loopInfo.loop.reduce((count, pos, index, loop) => {
        if (index === 0 || index === loop.length - 1) {
            return count;
        }
        const edges = [loop[index - 1], pos, loop[index + 1]] as const;
        return count + tryFill(edges, world, loopInfo.is_clock_wise, origWorld);
    }, 0)
    logger.debug(() => "\n" + world.toString());


    logger.result([loopInfo.nb_step, count], [80, 6909, 10, 461])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(10, [Type.TEST, Type.RUN], puzzle, [Part.ALL])