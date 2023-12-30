import { Logger, Part, run, Type } from "../day_utils";
import { Arith, Context, init, IntNum, RatNum } from 'z3-solver';

type Base = number
type Coord = [Base, Base, Base]
type CoordBig = [bigint, bigint, bigint]
type Hailstone = {
    id: number,
    start_pos: Coord,
    start_pos_bigint: CoordBig,
    speed: Coord,
    line2D_a: Base,
    line2D_b: Base
}
function parse(lines: string[]): Hailstone[] {
    return lines.map((l, id) => {
        const [positionStr, speedStr] = l.split(" @ ");
        const positions = positionStr.split(", ").map(n => parseInt(n, 10)) as Coord;
        const speeds = speedStr.split(", ").map(n => parseInt(n, 10)) as Coord;
        const a = speeds[1] / speeds[0];
        return {
            id,
            start_pos: positions,
            start_pos_bigint: positions.map(p => BigInt(p)) as CoordBig,
            speed: speeds,
            line2D_a: a,
            line2D_b: positions[1] - a * positions[0]
        }
    });
}


async function puzzle(lines: string[], part: Part, type: Type, logger: Logger): Promise<void> {
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
        const z3 = await init();
        const context = z3.Context('main');

        const s = [context.Real.const("px"), context.Real.const("py"), context.Real.const("pz")];
        const v = [context.Real.const("vx"), context.Real.const("vy"), context.Real.const("vz")];
        const solver = new context.Solver();
        const zero = context.Real.val(0);
        for (const h of data) {
            const t = context.Real.const(`t${h.id}`);
            solver.add(context.GT(t, zero));
            ["x", "y", "z"].forEach((_axis, i) => {
                solver.add(
                    context.Eq(context.Sum(context.Real.val(h.start_pos[i]), context.Product(context.Real.val(h.speed[i]), t)),
                        context.Sum(s[i], context.Product(v[i], t))
                    )
                )
            });
        }
        const solver_res = await solver.check();
        if (solver_res !== "sat") {
            throw new Error("Cannot find solution");
        }
        const model = solver.model();
        const x = (model.get(s[0]) as RatNum).numerator().value();
        const y = (model.get(s[1]) as RatNum).numerator().value();
        const z = (model.get(s[2]) as RatNum).numerator().value();
        logger.result(x + y + z, [47n, 765636044333842n]);
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(24, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])
