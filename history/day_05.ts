import { Logger, Part, run, Type } from "../day_utils"

type int = number

type RangeDef = {
    min: int,
    max: int
}

type MapRule = {
    range: RangeDef,
    offset: int
}

type Input = {
    seeds: RangeDef[];
    map: {
        [key: string]: {
            target: string,
            rules: MapRule[]
        }
    }
}


function parse(lines: string[], part: Part): Input {
    const [seedsStr, _empty, ...rules] = lines;
    const seeds = seedsStr
        .split(/:\s+/)[1]
        .split(/\s+/)
        .map(n => parseInt(n, 10))
        .flatMap(n => part === Part.PART_1 ? [n, 1] : [n])
        .packStrict(2)
        .map(def => {
            return <RangeDef>{
                min: def[0],
                max: def[1] + def[0] - 1
            }
        });

    const input: Input = {
        seeds,
        map: {}
    }
    let currRules: MapRule[] = [];
    for (const line of rules) {
        const firstLine = line.match(/([a-z]+)-to-([a-z]+)\s+map:/);
        if (firstLine && firstLine.length > 0) {
            currRules = [];
            input.map[firstLine[1]] = {
                target: firstLine[2],
                rules: currRules
            }
        }
        else if (!line.match(/^\s*$/)) {
            const parts = line.split(/\s+/).map(n => parseInt(n, 10));
            currRules.push({
                range: {
                    min: parts[1],
                    max: parts[2] + parts[1] - 1,
                },
                offset: parts[0] - parts[1]
            })
        }
    }
    Object.values(input.map).forEach(rule => rule.rules.sort((a, b) => a.range.min - b.range.min));
    return input;
}
type SplitResult = { matching?: RangeDef, before?: RangeDef, after?: RangeDef };
function splitMatching(seedDef: RangeDef, rule: MapRule): SplitResult {
    const result: SplitResult = {};
    if (seedDef.min < rule.range.min) {
        result.before = {
            min: seedDef.min,
            max: Math.min(seedDef.max, rule.range.min - 1)
        }
    }

    if (seedDef.max >= rule.range.min && seedDef.min <= rule.range.max) {
        result.matching = {
            min: (seedDef.min < rule.range.min) ? rule.range.min : seedDef.min,
            max: seedDef.max > rule.range.max ? rule.range.max : seedDef.max,
        }
    }

    if (seedDef.max > rule.range.max) {
        result.after = {
            min: Math.max(seedDef.min, rule.range.max + 1),
            max: seedDef.max
        }
    }


    return result;
}

function applyMap(input: Input, orig: RangeDef[], curr: string): RangeDef[] {
    const rules = input.map[curr];
    if (rules === undefined) {
        return orig;
    }

    const result: RangeDef[] = [];

    for (const seed of orig) {
        const toMap = [seed];
        for (const rule of rules.rules) {
            let src: RangeDef | undefined;
            const afterRanges: RangeDef[] = [];
            while (src = toMap.shift()) {
                const split = splitMatching(src, rule);
                if (split.before !== undefined) result.push(split.before);
                if (split.after !== undefined) afterRanges.push(split.after);
                if (split.matching) {
                    result.push({
                        min: split.matching.min + rule.offset,
                        max: split.matching.max + rule.offset,
                    })
                }
            }
            afterRanges.forEach(s => toMap.push(s));
        }
        toMap.forEach(s => result.push(s))
    }

    return applyMap(input, result, rules.target);
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part);
    const result = applyMap(data, data.seeds, "seed").map(s => s.min).sortIntuitive()[0];
    if (part === Part.PART_1) {
        logger.result(result, [35, 993500720])
    }
    else {
        logger.result(result, [46, 4917124])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(5, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])