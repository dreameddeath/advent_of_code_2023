import { on } from "cluster";
import { Logger, Part, run, Type } from "../day_utils"
type Pos = {
    x: number;
    y: number;
}

type NumberCell = {
    type: "digit",
    digit: number;
    value: number;
    pos: Pos;
    next?: NumberCell;
    previous?: NumberCell;
    first?: NumberCell;
}


type SymbolCell = {
    type: "symbol",
    isGear: boolean,
    pos: Pos
}

type EmptyCell = {
    type: "empty"
}

type Cell = SymbolCell | EmptyCell | NumberCell;


type Schematics = {
    width: number;
    height: number;
    def: readonly Cell[][];
}

function parse(lines: string[]): Schematics {
    return {
        width: lines[0].length,
        height: lines.length,
        def: lines.map((l, y) => {
            let lastDigitCell: NumberCell | undefined = undefined;
            return l.split("").map((c, x) => {
                if (c >= "0" && c <= "9") {
                    const digit = parseInt(c, 10);
                    const newCell: NumberCell = {
                        type: "digit",
                        digit,
                        value: digit,
                        pos: { x, y },
                    };
                    if (lastDigitCell !== undefined) {
                        lastDigitCell.next = newCell;
                        newCell.previous = lastDigitCell;
                        newCell.first = lastDigitCell.first ?? lastDigitCell;
                        newCell.first.value = newCell.first.value * 10 + newCell.digit;
                    }
                    lastDigitCell = newCell;
                    return newCell;
                } else {
                    lastDigitCell = undefined;
                    return (c === ".") ? {
                        type: "empty"
                    } : {
                        type: "symbol",
                        isGear: c === "*",
                        pos: { x, y }
                    }

                }
            })
        })
    };
}

const OFFSETS: Pos[] = [-1, 0, 1]
    .flatMap(offsetX => [-1, 0, 1]
        .map(offsetY => { return { x: offsetX, y: offsetY } })
    )
    .filter(pos => !(pos.x === 0 && pos.y === 0))

const ONLY_RIGHT_OFFSETS: Pos[] = [-1, 0, 1]
        .map(offsetY => { return { x: 1, y: offsetY } });


function findCell(s: Schematics, pos: Pos): Cell | undefined {
    if (pos.x < 0 || pos.x >= s.width) {
        return undefined;
    }
    if (pos.y < 0 || pos.y >= s.height) {
        return undefined;
    }
    return s.def[pos.y][pos.x];
}

function isValidSymbol(c: Cell | undefined, onlyGears: boolean) {
    if (c === undefined || c.type !== "symbol") {
        return false;
    }
    if (!onlyGears) {
        return true;
    }
    return c.isGear;
}

function adjacentValidSymbolCells(s: Schematics, c: NumberCell, onlyGears: boolean): SymbolCell[] {
    const applicableOffsets = (c.previous===undefined?OFFSETS:ONLY_RIGHT_OFFSETS);
    const adjacentCells = applicableOffsets
        .map(offset => findCell(s, { x: c.pos.x + offset.x, y: c.pos.y + offset.y }))
        .filterTyped<SymbolCell>(cell => isValidSymbol(cell, onlyGears));
    const nextAdjacentCells = (c.next !== undefined) ? adjacentValidSymbolCells(s, c.next, onlyGears) : [];
    return adjacentCells.concat(...nextAdjacentCells);
}



function getAdjacentSymbols(s: Schematics, c: Cell, onlyGears: boolean): SymbolCell[] {
    if (c.type !== "digit" || c.previous !== undefined) {
        return [];
    }

    return adjacentValidSymbolCells(s, c, onlyGears);
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.def
            .flatMap(cells => cells.filterTyped<NumberCell>(c => getAdjacentSymbols(data, c, false).length > 0))
            .reduce((a, b) => a + b.value, 0)
            ;
        logger.result(result, [4361, 550934])
    }
    else {
        const mapSymbols = new Map<SymbolCell, NumberCell[]>();
        data.def
            .forEach(cells => cells
                .forEach(c => {
                    getAdjacentSymbols(data, c, true)
                        .forEach(
                            s => {
                                const found = mapSymbols.get(s) ?? [];
                                found.push(c as NumberCell);
                                mapSymbols.set(s, found);
                            }
                        )
                })
            )
            ;
        const result = [...mapSymbols.entries()]
            .filter(i => i[1].length > 1)
            .reduce((sum, i) =>
                sum +
                i[1].reduce((ratio, c) => ratio * c.value, 1), 0
            );
        logger.result(result, [467835, 81997870])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(3, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2],{bench:200})