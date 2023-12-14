import { cy } from "date-fns/locale";
import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";

enum CellType {
    ROCK = "O",
    EMPTY = ".",
    SOLID = '#'
}

type Map = {
    content: CellType[][],
    nbRocksByRow: number[],
    nbRocksByColumn: number[],
    width: number,
    height: number
}

type Direction = "up" | "down" | "left" | "right";

type Pos = {
    x: number,
    y: number
}

function getNextEmptyBlock(pos: Pos, dir: Direction, map: Map): Pos | undefined {
    let move = { x: 0, y: 0 }
    switch (dir) {
        case "up": move.y = -1; break;
        case "down": move.y = 1; break;
        case "left": move.x = -1; break;
        case "right": move.x = 1; break;
        default:
            throw new Error("Cannot move");
    }

    let { x, y } = pos;
    while (x >= 0 && x < map.width && y >= 0 && y < map.height) {
        if (map.content[y + move.y]?.[x + move.x] !== CellType.EMPTY) {
            return { x, y };
        }
        x += move.x;
        y += move.y;
    }
    return undefined;
}


function parse(lines: string[]): Map {
    const nbRocksByRow: number[] = [...generator(lines.length)].map(_ => 0);
    const nbRocksByColumn: number[] = [...generator(lines[0].length)].map(_ => 0);
    const content = lines.map((l, y) => l.split("").map((c, x) => {
        if (c === CellType.ROCK) {
            nbRocksByRow[y] += 1;
            nbRocksByColumn[x] += 1;
        }
        return c;
    }) as CellType[]);
    return {
        content,
        nbRocksByRow,
        nbRocksByColumn,
        width: content[0].length,
        height: content.length
    };
}

function calcLoad(array: number[]): number {
    return array.reduce((a, b, index) =>
        a + b * (array.length - index)
        , 0);
}

function tilt(x: number, y: number, dir: Direction, map: Map) {
    if (map.content[y][x] !== CellType.ROCK) {
        return;
    }
    const newPos = getNextEmptyBlock({ x, y }, dir, map);
    if (newPos === undefined) {
        return;
    }
    map.nbRocksByRow[y] -= 1;
    map.nbRocksByRow[newPos.y] += 1;
    map.nbRocksByColumn[x] -= 1;
    map.nbRocksByColumn[newPos.x] += 1;
    map.content[y][x] = CellType.EMPTY;
    map.content[newPos.y][newPos.x] = CellType.ROCK;
}

function moveRocks(dir: Direction, map: Map) {
    let y_s = [...generator(map.height)];
    let x_s = [...generator(map.width)];
    switch (dir) {
        case "down": {
            y_s.reverse();
            break;
        }
        case "right": {
            x_s.reverse();
            break;
        }
    }
    if (dir === "left" || dir == "right") {
        for (const x of x_s) {
            if (map.nbRocksByColumn[x] !== 0) {
                for (const y of y_s) {
                    tilt(x, y, dir, map);
                }
            }
        }
    } else {
        for (const y of y_s) {
            if (map.nbRocksByRow[y] !== 0) {
                for (const x of x_s) {
                    tilt(x, y, dir, map);
                }
            }
        }
    }
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const map = parse(lines);


    const xTendedMap: ExtendedMap<string, { count: number, cycle: number, load: number }> = new ExtendedMap();
    
    let updateCache = () => {
        let loadUp = calcLoad(map.nbRocksByRow);
        let loadLeft = calcLoad(map.nbRocksByColumn);
        const key = `${loadLeft}|${loadUp}`
        const found = xTendedMap.get(key);
        if (found === undefined) {
            xTendedMap.set(key, {
                count: 1,
                cycle,
                load: loadUp
            })
        } else {
            found.count++;
        }
        return found
    }
    const moveOrder: [Direction, Direction, Direction, Direction] = ["up", "left", "down", "right"];
    let cycle = 0;
    let resultPart1: number = 0;
    let resultPart2: number = 0;
    let moveNext = () => {
        moveOrder.forEach(dir => {
            moveRocks(dir, map)
            if (cycle === 0 && dir === "up") {
                resultPart1 = calcLoad(map.nbRocksByRow);
            }
        })
        cycle++;
    }
    do {
        moveNext();
        const found = updateCache();
        if (found !== undefined && found.count > 1) {
            let startLoop = found.cycle;
            let loopSize = cycle - found.cycle;
            const expected_cycles = 1_000_000_000;
            let remaining = (expected_cycles-startLoop)%loopSize;
            while(remaining>0){
                moveNext();
                remaining--;
            }
            resultPart2=calcLoad(map.nbRocksByRow);
            break;
        }
    } while (true);
    logger.result([resultPart1, resultPart2], [136, 108955, 64, 106689])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(14, [Type.TEST, Type.RUN], puzzle, [Part.ALL])
