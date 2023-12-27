import { Logger, Part, run, Type } from "../day_utils"

function parseLine(line: string, part: Part): number[] {
    const numbers = line.split(/:\s+/)[1];
    if (part === Part.PART_1) {
        return numbers.split(/\s+/).map(part => parseInt(part, 10));
    }
    return [parseInt(numbers.replaceAll(/\s+/g, ""), 10)];
}
interface Race { time: number, distance: number };


function parse(lines: string[], part: Part): Race[] {
    const times = parseLine(lines[0], part)
    const distances = parseLine(lines[1], part);
    return times.map((time, i) => {
        return {
            time,
            distance: distances[i]
        };
    });
}

function calculateRoots(race: Race): [number, number] {
    const delta = Math.sqrt(race.time ** 2 - 4 * race.distance);
    return [(race.time - delta) / 2, (race.time + delta) / 2 - Number.MIN_VALUE];
}

function solve(race: Race): number {
    const roots = calculateRoots(race);
    const roundedRoots = [Math.ceil(roots[0]), Math.floor(roots[1])];
    const maxTime = Math.min(race.time, (roundedRoots[1] === roots[1]) ? roundedRoots[1] - 1 : roundedRoots[1]);
    const minTime = (roundedRoots[0] === roots[0]) ? roundedRoots[0] + 1 : roundedRoots[0];
    const solution = maxTime - minTime + 1;
    return solution;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part);
    const result = data.map(race => solve(race)).reduce((a, b) => a * b, 1);;
        
    if (part === Part.PART_1) {
        logger.result(result, [288, 4403592])
    }
    else {
        logger.result(result, [71503, 38017587])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(6, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])