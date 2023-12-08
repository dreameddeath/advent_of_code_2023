import { Logger, Part, run, Type } from "../day_utils"

enum Dir {
    LEFT = 0,
    RIGHT = 1
}

interface Input {
    instructions: Dir[],
    starting_nodes: string[],
    world: Map<string, [string, string]>;
}

function parse(lines: string[]): Input {
    const [insts_str, empty, ...map_str] = lines;
    const directions = insts_str.split('').map(dir => dir === "L" ? Dir.LEFT : Dir.RIGHT);

    const map: Map<string, [string, string]> = new Map();
    const starting_nodes: string[] = [];
    map_str.forEach(line => {
        const [src, target] = line.split(/\s+=\s+/);
        const [left, right] = target.substring(1, target.length - 1).split(/,\s+/);
        if (src.endsWith("A")) {
            starting_nodes.push(src)
        }
        map.set(src, [left, right]);
    })
    return {
        instructions: directions,
        starting_nodes: starting_nodes,
        world: map
    };
}

interface LoopInfo {
    init?: number,
    loop?: number,
}

const PRIMES = [2, 3, 5, 7];

function addNextPrime(): number {
    let currNumber = PRIMES[PRIMES.length - 1];
    while (true) {
        currNumber++;
        if (PRIMES.filter(n => currNumber % n === 0).length === 0) {
            PRIMES.push(currNumber);
            return currNumber;
        }
    }
    throw new Error("Cannot find prime");
}

function getNextPrime(pos: number): number {
    const p = PRIMES[pos];
    if (p) {
        return p;
    }
    return addNextPrime();
}

function decomposePrime(input: number): number[] {
    const result: number[] = [];
    let reminder = input;
    let pos_prime = 0;
    while (reminder !== 1) {
        const p = getNextPrime(pos_prime);
        let nb = 0;
        while (reminder % p === 0) {
            reminder = reminder / p;
            nb++;
        }
        result.push(nb);
        pos_prime++;
    }
    return result;
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const input = parse(lines);
    if (part === Part.PART_1) {
        let curr_pos = "AAA";
        let nb_step = 0;
        while (curr_pos !== "ZZZ") {
            nb_step++;
            const dir = input.instructions[(nb_step - 1) % input.instructions.length];
            curr_pos = input.world.get(curr_pos)![dir]
        }
        logger.result(nb_step, [6, 18827])
    }
    else {
        const loopsInfo: LoopInfo[] = input.starting_nodes.map(_ => { return {} });
        let nb_loop_info_finished = 0;
        let curr_pos = [...input.starting_nodes];
        let nb_step = 0;
        let last_loop_index = -1;
        while (nb_loop_info_finished !== curr_pos.length) {
            nb_step++;
            const dir = input.instructions[(nb_step - 1) % input.instructions.length];
            curr_pos = curr_pos.map(pos => input.world.get(pos)![dir]);
            curr_pos.forEach((pos, index) => {
                if (pos.endsWith("Z")) {
                    if (loopsInfo[index].init === undefined) {
                        loopsInfo[index].init = nb_step;
                    } else if (loopsInfo[index].loop === undefined) {
                        loopsInfo[index].loop = nb_step - loopsInfo[index].init!;
                        nb_loop_info_finished++;
                        last_loop_index = index;
                    }
                }
            })
        }
        const primes = loopsInfo.map(l=>decomposePrime(l.loop!));
        const ppmc_parts = primes.reduce((parts,p)=>{
            p.forEach((pi,index)=>{
                parts[index]=Math.max(pi,parts[index]??0)
            })
            return parts
        },[] as number[]);
        const ppmc = BigInt(ppmc_parts.reduce((a,b,index)=>BigInt(PRIMES[index]**(b))*a,1n));
        
        logger.result(ppmc, [6n, 20220305520997n])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(8, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])