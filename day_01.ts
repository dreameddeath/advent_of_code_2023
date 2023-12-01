import { Logger, Part, run, Type } from "./day_utils"
const MAP: { [key: string]: string } = {
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
}

const result_add_digit = Object.values(MAP).forEach(v => MAP[v] = v);


const MAX_LEN_TEXTUAL_TOKEN = Object.keys(MAP).map(k => k.length).reverseSortIntuitive()[0];

function replaceOne(l: string, isFirst: boolean): string {
    let minIndex = isFirst ? Number.MAX_SAFE_INTEGER : -1;
    let minKey = "";
    for (const key of Object.keys(MAP)) {
        const pos = isFirst ? l.indexOf(key) : l.lastIndexOf(key);
        if (pos >= 0) {
            if ((isFirst && minIndex > pos) || (!isFirst && minIndex < pos)) {
                minIndex = pos;
                minKey = key;
            }
        }
    }
    if (minIndex >= 0) {
        return l.substring(0, minIndex) + MAP[minKey] + l.substring(minIndex + minKey.length);
    }
    return l;
}

function replaceTextualNumber(l: string, logger: Logger): string {
    let res = l;

    res = replaceOne(res, true);
    res = replaceOne(res, false);
    logger.debug(() => `${l} to ${res}`);
    return res;
}

function findDigit(l: string, isFirst: boolean, part: Part): number {
    const takeN = (pos: number, size: number) => isFirst ? l.slice(pos, pos + size) : l.slice(l.length - pos - 1, l.length - pos - 1 + size);
    for (let pos = 0; pos < l.length; pos++) {
        const currChar = takeN(pos, 1);
        if (currChar >= "0" && currChar <= "9") {
            return parseInt(currChar, 10);
        }
        if (part === Part.PART_2) {
            const part = takeN(pos, MAX_LEN_TEXTUAL_TOKEN);
            for (const key of Object.keys(MAP)) {
                if (part.startsWith(key)) {
                    return parseInt(MAP[key], 10);
                }
            }
        }
    }

    throw Error(`No digit found in ${l}`)
}

function parse(lines: string[], part: Part, logger: Logger): number[][] {
    return lines
        .map(l => part === Part.PART_1 ? l : replaceTextualNumber(l, logger))
        .map(l =>
            l.split("")
                .filter(c => c >= "0" && c <= "9")
                .map(c => parseInt(c, 10))
        );
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part, logger);
    const alternative = lines.map(l => findDigit(l, true, part) * 10 + findDigit(l, false, part)).reduce((a, b) => a + b, 0);
    const result = data.map(l => l[0] * 10 + l.slice(-1)[0]).reduce((a, b) => a + b, 0);
    if (part === Part.PART_1) {
        logger.result(alternative, [142, 55607]);
        logger.result(result, [142, 55607]);
    }
    else {
        logger.result(alternative, [281, 55291])
        logger.result(result, [281, 55291])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(1, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })