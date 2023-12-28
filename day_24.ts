import { connect } from "http2";
import { Logger, Part, run, Type } from "./day_utils";
type Base = number
type Coord = [Base, Base, Base]
type Hailstone = {
    start_pos: Coord,
    speed: Coord,
    line2D_a: Base,
    line2D_b: Base
}
function parse(lines: string[]): Hailstone[] {
    return lines.map(l => {
        const [positionStr, speedStr] = l.split(" @ ");
        const positions = positionStr.split(", ").map(n => parseInt(n, 10)) as Coord;
        const speeds = speedStr.split(", ").map(n => parseInt(n, 10)) as Coord;
        const a = speeds[1] / speeds[0];
        return {
            start_pos: positions,
            speed: speeds,
            line2D_a: a,
            line2D_b: positions[1] - a * positions[0]
        }
    });
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const min = type === Type.TEST ? 7 : 200000000000000;
        const max = type === Type.TEST ? 27 : 400000000000000;
        const result = data.reduce((nb_intersect, h1, index) => {
            for (let pos = index + 1; pos < data.length; ++pos) {
                const h2 = data[pos];
                if (h1.line2D_a === h2.line2D_a) {
                    continue;
                }
                const x = (h2.line2D_b - h1.line2D_b) / (h1.line2D_a - h2.line2D_a);
                const y = h1.line2D_a * x + h1.line2D_b;
                const possible_for_h1 = Math.sign(x - h1.start_pos[0]) === Math.sign(h1.speed[0]);
                const possible_for_h2 = Math.sign(x - h2.start_pos[0]) === Math.sign(h2.speed[0]);
                if (possible_for_h1 && possible_for_h2 && x >= min && x <= max && y >= min && y <= max) {
                    nb_intersect++;
                }
            }
            return nb_intersect;
        }, 0);
        logger.result(result, [2, 15558]);
    }
    else {
        const [h1, h2, h3] = data.slice(0, 3);
        
        logger.result(0, [47, undefined]);
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(24, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])