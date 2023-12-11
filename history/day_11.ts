import { Logger, Part, run, Type } from "../day_utils"

interface StarPos {
    orig_index: number,
    x: number,
    y: number
}

function parse(lines: string[]): StarPos[] {
    let count = 1;
    return lines.flatMap((l, y) => l.split("")
        .mapNonNull((c, x) => {
            if (c !== "#") {
                return undefined;
            }
            const star: StarPos = { x, y, orig_index: count };
            count++;
            return star;
        })
    )
}

function buildOffsetMap(max: number, non_empty: Set<number>, part: Part, type: Type): Map<number, number> {
    const result = new Map<number, number>();
    let offset = 0;
    for (let pos = 0; pos <= max; ++pos) {
        result.set(pos, offset);
        if (!non_empty.has(pos)) {
            if (part === Part.PART_1) {
                offset++;
            } else {
                offset += (type === Type.TEST ? 100 : 1_000_000) - 1;
            }
        }
    }
    return result;
}

function solve(stars: StarPos[], part: Part, type: Type): bigint {
    const non_empty_x = new Set<number>();
    const non_empty_y = new Set<number>();
    const { maxX, maxY } = stars.reduce((maxInfo, star) => {
        non_empty_x.add(star.x);
        non_empty_y.add(star.y);
        return {
            maxX: Math.max(star.x, maxInfo.maxX),
            maxY: Math.max(star.y, maxInfo.maxY)
        }
    }, { maxX: 0, maxY: 0 });

    const offsetXMap = buildOffsetMap(maxX, non_empty_x, part, type);
    const offsetYMap = buildOffsetMap(maxY, non_empty_y, part, type);

    const correctedStars = stars.map(s => {
        return { x: s.x + offsetXMap.get(s.x)!, y: s.y + offsetYMap.get(s.y)! }
    });
    return correctedStars.reduce(
        (total, s1, index) => {
            return correctedStars.slice(index + 1).map(s2 => {
                return Math.abs(s2.x - s1.x) + Math.abs(s2.y - s1.y);
            }).reduce((total_pair, d_pair) => total_pair + BigInt(d_pair), total)
        }
        , 0n)
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const result = solve(data, part, type);
    if (part === Part.PART_1) {
        logger.result(result, [374n, 9693756n])
    }
    else {
        logger.result(result, [8410n, 717878258016n])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(11, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])