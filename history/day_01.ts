import { Logger, Part, run, Type } from '../day_utils';

const DIGITS = [
    ["0"],
    ["1", "one"],
    ["2", "two"],
    ["3", "three"],
    ["4", "four"],
    ["5", "five"],
    ["6", "six"],
    ["7", "seven"],
    ["8", "eight"],
    ["9", "nine"]
] as const;

type DigitMatchingResult = {
    digit: number,
    pos: number
}

function matchingDigit(line: string, part: Part, isFirst: boolean): number {
    const pos_fct = isFirst ?
        (expected: readonly string[]) => expected.map(str => line.indexOf(str)) :
        (expected: readonly string[]) => expected.map(str => line.lastIndexOf(str));
    const found = DIGITS.map(
        digit_def => {
            const expected = part === Part.PART_1 ? [digit_def[0]] : digit_def;
            const matchingPos = pos_fct(expected).filter(pos => pos >= 0).sortIntuitive();
            if (matchingPos.length === 0) {
                return isFirst ? Number.MAX_VALUE : -1;
            } else {
                return isFirst ? matchingPos[0] : matchingPos[matchingPos.length - 1];
            }
        })
        .map((pos, index) => { return { digit: index, pos: pos } as DigitMatchingResult })
        .sort((d1, d2) => isFirst ? (d1.pos - d2.pos) : (d2.pos - d1.pos));

    return found[0].digit;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const result = lines
        .map(l => {
            const first = matchingDigit(l, part, true);
            const last = matchingDigit(l, part, false);
            return first * 10 + last;
        })
        .reduce((a, b) => a + b, 0);
    if (part === Part.PART_1) {
        logger.result(result, [142, 55607]);
    }
    else {
        logger.result(result, [281, 55291])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(1, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })