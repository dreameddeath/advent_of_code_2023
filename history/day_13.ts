import { off } from "process";
import { Logger, Part, run, Type } from "../day_utils"
import { generator, PackMatchAction } from "../utils";

type PatternLine = { items: number[] }

type Pattern = { index: number, orig: string[], lines: PatternLine[], linesValues: number[], width: number }
function parse(lines: string[]): Pattern[] {

    return lines
        .packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE)
        .map(patternStrs => {
            return {
                orig: patternStrs,
                parsed:
                    patternStrs.map(p => {
                        const items = p.split("").map(c => ((c === "#") ? 1 : 0) as number);
                        return { items }
                    })
            }
        }
        ).map((linesInfo, index) => {
            return {
                index,
                orig: linesInfo.orig,
                lines: linesInfo.parsed,
                linesValues: linesInfo.parsed.map(l => l.items.reduce((a, b) => a * 2 + b, 0)),
                width: linesInfo.parsed[0].items.length
            } as Pattern
        });
}


function find_mirrors(values: number[], possible_pos: number[]): number[] {
    let result = [];
    for (const currMiddlePos of possible_pos) {
        let offset = Math.min(currMiddlePos, values.length - currMiddlePos);
        while (offset > 0) {
            if (values[currMiddlePos - offset] !== values[currMiddlePos + offset - 1]) {
                break;
            }
            offset--;
        }
        if (offset === 0) {
            result.push(currMiddlePos)
        }
    }
    return result;
}

function find_optional_pattern_mirrors(pattern: Pattern, possible_horizontal: number[], possible_vertical: number[],to_ignore?:number): number | undefined {
    const horizontal_mirrors = find_mirrors(pattern.linesValues, possible_horizontal).map(i=>i*100).filter(n=>to_ignore===undefined||n!==to_ignore);
    if(horizontal_mirrors.length === 1){
        return horizontal_mirrors[0];
    }
    if(horizontal_mirrors.length>1){
        return undefined;
    }
    
    const verticalMatches = pattern.lines.reduce((possibles, line) => find_mirrors(line.items, possibles), possible_vertical).filter(n=>to_ignore===undefined||n!==to_ignore);
    if (verticalMatches.length === 1) {
        return verticalMatches[0]
    }
}
    


function calc_possible_horizontal(pattern: Pattern): number[] {
    return [...generator(pattern.linesValues.length, 1)]
}

function calc_possible_vertical(pattern: Pattern): number[] {
    return [...generator(pattern.width, 1)]
}


function find_pattern_mirrors_part1(pattern: Pattern): number {
    const result = find_optional_pattern_mirrors(pattern, calc_possible_horizontal(pattern), calc_possible_vertical(pattern));
    if (result === undefined) {
        throw new Error("Strange");
    }
    return result;
}

function find_pattern_mirrors_part2(pattern: Pattern): number {
    const possible_x = [...generator(pattern.width)];
    const possible_horizontal = calc_possible_horizontal(pattern);
    const possible_vertical = calc_possible_vertical(pattern);
    const base_result = find_optional_pattern_mirrors(pattern, possible_horizontal, possible_vertical);
    for (const y of generator(pattern.lines.length)) {
        for (const x of possible_x) {
            const curr = pattern.lines[y].items[x];
            const delta = curr === 0 ? 1 : -1;
            const delta_total = delta * (2 ** (pattern.width - x - 1));
            pattern.lines[y].items[x] += delta;
            pattern.linesValues[y] += delta_total;
            const result = find_optional_pattern_mirrors(pattern, possible_horizontal, possible_vertical,base_result)
            if (result !== undefined) {
                return result;
            }
            pattern.lines[y].items[x] -= delta;
            pattern.linesValues[y] -= delta_total;
        }
    }
    throw new Error("Strange");
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.map(p => find_pattern_mirrors_part1(p)).reduce((a, b) => a + b, 0);
        logger.result(result, [405, 33780])
    }
    else {
        const result = data.map(p => find_pattern_mirrors_part2(p)).reduce((a, b) => a + b, 0);
        logger.result(result, [400, 23479])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(13, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])