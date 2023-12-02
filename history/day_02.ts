import { Logger, Part, run, Type } from "../day_utils"

interface Pick {
    nb: number,
    color: "red" | "green" | "blue"
}

type Set = Pick[];
type Game = {
    index: number,
    sets: Set[];
}
function parse(lines: string[]): Game[] {
    return lines.map(
        (l, line_number) => {
            return {
                index: line_number + 1,
                sets:
                    l.split(/(?::|;)\s*/)
                        .filter((_, index) => index !== 0)
                        .map(set =>
                            set.split(/,\s*/)
                                .map(pick => {
                                    const parts = pick.split(/\s+/);
                                    return { nb: parseInt(parts[0]), color: parts[1] } as Pick
                                })
                        )
            }
        }
    );
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const expected_max = {
            "red": 12,
            "green": 13,
            "blue": 14
        }
        const result = data.filter(g => {
            const badSets = g.sets.filter(s => {
                const badPicks = s.filter(p => p.nb > expected_max[p.color]);
                return badPicks.length > 0
            });
            return badSets.length === 0;
        })
            .reduce((sum, g) => sum + g.index, 0);
        logger.result(result, [8, 2679]);
    }
    else {
        const result = data.map(g => {
            const minBag = g.sets.reduce(
                (min, set) => {
                    set.forEach(pick => min[pick.color] = Math.max(pick.nb, min[pick.color]));
                    return min;
                }
                ,
                { "red": 0, "green": 0, "blue": 0 }
            );
            return minBag.red * minBag.green * minBag.blue;
        })
        .reduce((sum,g)=>sum+g,0);


        logger.result(result, [2286, 77607]);
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(2, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])