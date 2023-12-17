import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";
import { World2D } from "../map2d.utils";

enum CellType {
    ROCK = "O",
    EMPTY = ".",
    SOLID = '#'
}

class Map extends World2D.Map2d<CellType>{
    constructor(content: World2D.Content<CellType>,
        public readonly nbRocksByRow: number[],
        public readonly nbRocksByColumn: number[]
    ) {
        super(content);
    }

    public nextEmptyBlock(pos: World2D.Pos, dir: World2D.Dir): World2D.Pos | undefined {
        return this.move_while_next(pos, dir, (c) => c === CellType.EMPTY, true);
    }

    private tilt_cell(pos: World2D.Pos, dir: World2D.Dir) {
        if (this.cell(pos) !== CellType.ROCK) {
            return;
        }
        const newPos = this.nextEmptyBlock(pos, dir);
        if (newPos === undefined) {
            return;
        }
        this.nbRocksByRow[pos.y] -= 1;
        this.nbRocksByRow[newPos.y] += 1;
        this.nbRocksByColumn[pos.x] -= 1;
        this.nbRocksByColumn[newPos.x] += 1;
        this.set_cell(pos, CellType.EMPTY);
        this.set_cell(newPos, CellType.ROCK);
    }

    public tilt(dir: World2D.Dir) {
        switch (dir) {
            case World2D.Dir.DOWN:
            case World2D.Dir.UP:
                this.apply_to_all(World2D.Dir.RIGHT, this.opposite(dir), (pos) => this.tilt_cell(pos, dir));
                break;
            case World2D.Dir.LEFT:
            case World2D.Dir.RIGHT:
                this.apply_to_all(this.opposite(dir), World2D.Dir.DOWN, (pos) => this.tilt_cell(pos, dir));
                break;
        }
    }

    public toString(): string {
        return super.toString(c => c);
    }
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
    return new Map(content, nbRocksByRow, nbRocksByColumn);
}

function calcLoad(array: number[]): number {
    return array.reduce((a, b, index) =>
        a + b * (array.length - index)
        , 0);
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const map = parse(lines);
    if (type === Type.TEST) {
        logger.debug(() => "Starting Point :\n" + map.toString())
    }
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
    const moveOrder: [World2D.Dir, World2D.Dir, World2D.Dir, World2D.Dir] = [World2D.Dir.UP, World2D.Dir.LEFT, World2D.Dir.DOWN, World2D.Dir.RIGHT];
    let cycle = 0;
    let resultPart1: number = 0;
    let resultPart2: number = 0;
    let tilt_next = () => {
        moveOrder.forEach(dir => {
            map.tilt(dir);
            if (cycle === 0 && dir == World2D.Dir.UP) {
                resultPart1 = calcLoad(map.nbRocksByRow);
            }
            if (type === Type.TEST && cycle === 0) {
                logger.debug(() => `First tilt ${dir}:\n${map.toString()}`)
            }

        })
        if (type === Type.TEST && cycle < 3) {
            logger.debug(() => `After ${cycle}:\n${map.toString()}`)
        }
        cycle++;
    }
    do {
        tilt_next();
        const found = updateCache();
        if (found !== undefined && found.count > 1) {
            let startLoop = found.cycle;
            let loopSize = cycle - found.cycle;
            const expected_cycles = 1_000_000_000;
            let remaining = (expected_cycles - startLoop) % loopSize;
            while (remaining > 0) {
                tilt_next();
                remaining--;
            }
            resultPart2 = calcLoad(map.nbRocksByRow);
            break;
        }
    } while (true);
    logger.result([resultPart1, resultPart2], [136, 108955, 64, 106689])
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(14, [Type.TEST, Type.RUN], puzzle, [Part.ALL], { debug: false })
