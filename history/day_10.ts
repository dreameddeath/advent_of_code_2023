import { Logger, Part, run, Type } from "../day_utils"

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

type Pos = {
    x: number,
    y: number,
}

type World = {
    content: CellType[][],
    height: number,
    width: number,
}

interface CurrState {
    nb_step: number,
    nb_clock_wise_turns: number
    allPos: Pos[],
}

enum Direction {
    TOP = 'T',
    BOTTOM = 'B',
    LEFT = 'L',
    RIGHT = 'R'
}

interface LoopInfo {
    loop: Pos[],
    nb_step: number,
    is_clock_wise: boolean
};


function movePos(world: World, pos: Pos | undefined, dir: Direction): Pos | undefined {
    if (pos === undefined) {
        return undefined;
    }
    switch (dir) {
        case Direction.TOP:
            return pos.y === 0 ? undefined : { x: pos.x, y: pos.y - 1 };
        case Direction.BOTTOM:
            return (pos.y + 1) === world.height ? undefined : { x: pos.x, y: pos.y + 1 };
        case Direction.LEFT:
            return (pos.x) === 0 ? undefined : { x: pos.x - 1, y: pos.y };
        case Direction.RIGHT:
            return (pos.x + 1) === world.width ? undefined : { x: pos.x + 1, y: pos.y };
    }
}

function movePositions(world: World, pos: Pos | undefined, directions: Direction[]): Pos | undefined {
    return directions.reduce((curr_pos, dir) => movePos(world, curr_pos, dir), pos);
}

function moveDiagonals(world: World, pos: Pos | undefined, directions: [Direction, Direction]): (Pos | undefined)[] {
    return [
        movePos(world, pos, directions[0]),
        movePos(world, pos, directions[1]),
        movePositions(world, pos, directions),
    ];
}


function getMovedPosInfo(world: World, pos: Pos, dir: Direction): { pos: Pos, type: CellType } | undefined {
    const nextPos = movePos(world, pos, dir);
    if (nextPos === undefined) {
        return undefined;
    }
    return { pos: nextPos, type: world.content[nextPos.y][nextPos.x] };

}


function getNextPossiblePosInfo(world: World, pos: Pos, dir: Direction): { pos: Pos, type: CellType } | undefined {
    const nextPosInfo = getMovedPosInfo(world, pos, dir);
    if (nextPosInfo === undefined) {
        return undefined;
    }
    if (nextPosInfo.type === CellType.NONE || nextPosInfo.type === CellType.START) {
        return undefined;
    }
    return nextPosInfo;
}

function isSamePos(a: Pos, b: Pos): boolean {
    return a.x === b.x && a.y === b.y;
}

function getNextPossibleDirs(type: CellType): [Direction, Direction] {
    switch (type) {
        case CellType.HORIZONTAL:
            return [Direction.LEFT, Direction.RIGHT];
        case CellType.VERTICAL:
            return [Direction.BOTTOM, Direction.TOP];
        case CellType.CORNER_BOTTOM_LEFT:
            return [Direction.RIGHT, Direction.TOP];
        case CellType.CORNER_BOTTOM_RIGHT:
            return [Direction.LEFT, Direction.TOP];
        case CellType.CORNER_TOP_LEFT:
            return [Direction.RIGHT, Direction.BOTTOM];
        case CellType.CORNER_TOP_RIGHT:
            return [Direction.LEFT, Direction.BOTTOM];
        default:
            throw new Error("Cannot move from " + type);
    }
}



function moveNextState(world: World, state: CurrState): CurrState | undefined {
    const currPos = state.allPos[state.allPos.length - 1];
    const currType = world.content[currPos.y][currPos.x];
    const previousPos = state.allPos[state.allPos.length - 2];
    const [dir1, dir2] = getNextPossibleDirs(currType);
    const [nextPosInfo1, nextPosInfo2] = [getNextPossiblePosInfo(world, currPos, dir1), getNextPossiblePosInfo(world, currPos, dir2)];
    const isDir1Applicable = nextPosInfo1 !== undefined && !isSamePos(nextPosInfo1.pos, previousPos);
    const isDir2Applicable = nextPosInfo2 !== undefined && !isSamePos(nextPosInfo2.pos, previousPos);
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
    const vect_prod = (currPos.x - previousPos.x) * (nextPos.pos.y - currPos.y) - (currPos.y - currPos.y) * (nextPos.pos.x - currPos.x);
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
        return aCurrPos.x - aCurrPos.y;
    });
    for (let pos = 1; pos < nextStates.length; ++pos) {
        const prev = nextStates[pos - 1];
        const curr = nextStates[pos];
        if (isSamePos(prev.allPos[prev.allPos.length - 1], curr.allPos[curr.allPos.length - 1])) {
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

function getPossibleStartInfo(world: World, start: Pos, dir: Direction): { pos: Pos, type: CellType } | undefined {
    const nextPosInfo = getNextPossiblePosInfo(world, start, dir);
    if (nextPosInfo === undefined) {
        return undefined;
    }
    const [dir1, dir2] = getNextPossibleDirs(nextPosInfo.type);
    const [posDir1, posDir2] = [movePos(world, nextPosInfo.pos, dir1), movePos(world, nextPosInfo.pos, dir2)];
    if (posDir1 !== undefined && isSamePos(posDir1, start)) {
        return nextPosInfo;
    } else if (posDir2 !== undefined && isSamePos(posDir2, start)) {
        return nextPosInfo;
    }
    return undefined;
}

function getLoopInfo(world: World, start: Pos): LoopInfo {
    let currStates: CurrState[] = ALL_DIR.mapNonNull(dir => getPossibleStartInfo(world, start, dir))
        .map(next => {
            return {
                currType: next.type,
                currPos: next.pos,
                previousPos: start,
                nb_step: 1,
                allPos: [start, next.pos],
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

const ALL_DIR = [Direction.BOTTOM, Direction.TOP, Direction.RIGHT, Direction.LEFT];

function fillIfPossible(pos: Pos | undefined, world: World): number {
    if (pos === undefined) {
        return 0;
    }
    const type = world.content[pos.y][pos.x]
    if (type === CellType.EDGE || type === CellType.FILLED) {
        return 0;
    }
    world.content[pos.y][pos.x] = CellType.FILLED;

    return ALL_DIR.map(dir => fillIfPossible(movePos(world, pos, dir), world)).reduce((a, b) => a + b, 1);
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

function getToFill(edges: readonly [Pos, Pos, Pos], world: World, is_clock_wise_loop: boolean, origWorld: World): (Pos | undefined)[] {
    const vect_prod = (edges[1].x - edges[0].x) * (edges[2].y - edges[1].y) - (edges[1].y - edges[0].y) * (edges[2].x - edges[1].x);
    if (vect_prod === 0) {
        const isVertical = edges[0].x === edges[2].x;
        if (isVertical) {
            const isTopToBottom = edges[0].y < edges[2].y;
            if (isTopToBottom) {
                return [movePos(world, edges[1], is_clock_wise_loop ? Direction.LEFT : Direction.RIGHT)]
            } else {
                return [movePos(world, edges[1], is_clock_wise_loop ? Direction.RIGHT : Direction.LEFT)]
            }
        } else {
            const isLeftToRight = edges[0].x < edges[2].x
            if (isLeftToRight) {
                return [movePos(world, edges[1], is_clock_wise_loop ? Direction.BOTTOM : Direction.TOP)]
            } else {
                return [movePos(world, edges[1], is_clock_wise_loop ? Direction.TOP : Direction.BOTTOM)]
            }
        }
    } else {
        const type = origWorld.content[edges[1].y][edges[1].x];
        const zone = turn_part_to_fill(vect_prod, is_clock_wise_loop);
        switch (zone) {
            case TurnPartToFill.INNER: {
                switch (type) {
                    case CellType.CORNER_BOTTOM_LEFT: return [movePositions(world, edges[1], [Direction.TOP, Direction.RIGHT])];
                    case CellType.CORNER_BOTTOM_RIGHT: return [movePositions(world, edges[1], [Direction.TOP, Direction.LEFT])];
                    case CellType.CORNER_TOP_LEFT: return [movePositions(world, edges[1], [Direction.BOTTOM, Direction.RIGHT])];
                    case CellType.CORNER_TOP_RIGHT: return [movePositions(world, edges[1], [Direction.BOTTOM, Direction.LEFT])];
                }
                break;
            }
            case TurnPartToFill.OUTER: {
                switch (type) {
                    case CellType.CORNER_BOTTOM_LEFT: return moveDiagonals(world, edges[1], [Direction.BOTTOM, Direction.LEFT]);
                    case CellType.CORNER_BOTTOM_RIGHT: return moveDiagonals(world, edges[1], [Direction.BOTTOM, Direction.RIGHT]);
                    case CellType.CORNER_TOP_LEFT: return moveDiagonals(world, edges[1], [Direction.TOP, Direction.LEFT]);
                    case CellType.CORNER_TOP_RIGHT: return moveDiagonals(world, edges[1], [Direction.TOP, Direction.RIGHT]);
                }
                break;
            }
        }
        throw new Error("Shouldn't occurs");
    }

}


function tryFill(edges: readonly [Pos, Pos, Pos], world: World, is_clock_wise_loop: boolean, origWorld: World): number {
    const cellsToFill = getToFill(edges, world, is_clock_wise_loop, origWorld);
    return cellsToFill.reduce((count, cell) => count + fillIfPossible(cell, world), 0);
}

function parse(lines: string[]): { start: Pos, world: World } {
    let start_index: Pos = { x: 0, y: 0 };
    const map = lines
        .map((l, y) => l.split("").map((t, x) => {
            if (t === CellType.START) {
                start_index = { x, y };
            }
            return t
        }) as CellType[]);
    return {
        start: start_index,
        world: {
            content: map,
            height: map.length,
            width: map[0].length,
        }
    }
}


function puzzle(lines: string[], _part: Part, _type: Type, logger: Logger): void {
    const data = parse(lines);
    const loopInfo = getLoopInfo(data.world, data.start);

    const origWorld: World = {
        content: data.world.content.map(l => [...l]),
        height: data.world.height,
        width: data.world.width
    };


    loopInfo.loop.forEach(pos => data.world.content[pos.y][pos.x] = CellType.EDGE);

    logger.debug(() => "\n" + data.world.content.map(l => l.join("")).join("\n"))

    let count = loopInfo.loop.reduce((count, pos, index, loop) => {
        if (index === 0 || index === loop.length - 1) {
            return count;
        }
        const edges = [loop[index - 1], pos, loop[index + 1]] as const;
        return count + tryFill(edges, data.world, loopInfo.is_clock_wise, origWorld);
    }, 0)
    logger.debug(() => "\n" + data.world.content.map(l => l.join("")).join("\n"));


    logger.result([loopInfo.nb_step, count], [80, 6909, 10, 461])

}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(10, [Type.TEST, Type.RUN], puzzle, [Part.ALL])