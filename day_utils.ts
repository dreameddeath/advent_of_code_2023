import "./utils";
import * as fs from 'fs';


export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export enum Type {
    TEST = "TEST",
    RUN = "RUN"
}

export enum Part {
    ALL = "BOTH",
    PART_1 = "PART 1",
    PART_2 = "PART 2"
}

export const failures = {
    test: { count: 0, parts: [] as string[] },
    run: { count: 0, parts: [] as string[] },
}

export function buildAcceptableFileNames(day: number, type: Type, part: Part): string[] {
    const testDataSuffix = type === Type.TEST ? "_test" : "";

    const results: string[] = [];
    const per_day_prefix = `./data/day_${day}`;
    const per_part_root = `${per_day_prefix}_${part === Part.PART_2 ? 2 : 1}${testDataSuffix}`;
    const for_any_part_root = `${per_day_prefix}${testDataSuffix}`;

    results.push(`${per_part_root}.dat`, `${per_part_root}.txt`);
    results.push(`${for_any_part_root}.dat`, `${for_any_part_root}.txt`);
    return results;
}

export function getRawData(day: number, type: Type, part: Part, logger: Logger): string {
    const filenames = buildAcceptableFileNames(day, type, part);
    for (const filename of filenames) {
        if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, 'utf-8');
        }
    }
    logger.error("No data file found");
    throw new Error(`No data found for day ${day}`)
}

export function getData(day: number, type: Type, part: Part, logger: Logger): string[] {
    return getRawData(day, type, part, logger).split(/\r?\n/);
}

export interface Logger {
    isdebug(): boolean,
    debug(message: string | (() => string)): void,
    log(message: string | (() => string)): void,
    error(message: string): void,
    result<T>(value: T | [T, T], testResult?: T | [T, T] | [T, T, T, T]): void,
}

const emptyLogger: Logger = {
    isdebug: () => false,
    debug: () => { },
    log: () => { },
    error: () => { },
    result: () => { }
}

function calcSuccessMessage<T>(part: Part, type: Type, value: T | [T, T], expectedResult: T | [T, T] | [T, T, T, T] | undefined): "OK" | "KO" | "" {
    const isValueArray = Array.isArray(value);
    if ((isValueArray && part !== Part.ALL) || (!isValueArray && part === Part.ALL)) {
        throw new Error("Iconsistent value result with part type");
    }
    if (expectedResult === undefined) {
        return "";
    }
    if (Array.isArray(expectedResult)) {
        if (part === Part.ALL) {
            const effectiveValue = (value as [T, T]);
            if (expectedResult.length === 2) {
                if (type !== Type.TEST) {
                    return "";
                }
                return effectiveValue[0] === expectedResult[0] && effectiveValue[1] === expectedResult[1] ? "OK" : "KO";
            } else {
                const effectiveValue = (value as [T, T, T, T]);
                const effectiveExpected = type === Type.TEST ? [expectedResult[0], expectedResult[2]] : [expectedResult[1], expectedResult[3]];
                return effectiveValue[0] === effectiveExpected[0] && effectiveValue[1] === effectiveExpected[1] ? "OK" : "KO";
            }
        } else {
            const expectedResultValue = type === Type.TEST ? expectedResult[0] : expectedResult[1];
            return value === expectedResultValue ? "OK" : "KO";
        }

    } else if (type === Type.TEST) {
        return value === expectedResult ? "OK" : "KO";
    } else {
        return "";
    }
}

/**
 * Callback method to be run for a given puzzle
 * Params :
 * - lines = the parsed lines
 * - part : the current part being run
 * - logger : the logger to be used
 * - benchTag : when running in bench mode, provide a tag to change implementation behavior
 */
export type Solver<BTAG> = (lines: string[], part: Part, type: Type, logger: Logger, benchTag?: BTAG) => void;

export function doRun<BTAG>(fct: Solver<BTAG>, data: string[], part: Part, type: Type, logger: Logger, benchTag?: BTAG): number {
    const start = new Date();
    fct(data, part, type, logger, benchTag);
    return (new Date()).getTime() - start.getTime();
}


let _disableTests = false;

export function disableTests() {
    _disableTests = true;
}

/**
 * Run function for unitary run
 * @param day the day to run (from 1 to 25)
 * @param types the array of types to run
 * @param fct the function to run
 * @param parts the parts to run (use [Part.ALL] to run both parts in the same call)
 * @param opt options 
 *          debug(boolean): si vrai active le level debug du logger 
 *          bench(boolean): si vrai mode bench (execution 10 fois puis moyenne en enlevant le résultat le plus rapide et le résultat le plus lent)
 *          benchTags(array): tags à passer à la fonction pour "tunner" le comportement
 */
export function run<BTAG>(day: number, types: Type[], fct: Solver<BTAG>, parts: Part[] = [Part.ALL], opt?: { bench?: boolean, debug?: boolean, benchTags?: BTAG[] }): void {
    console.log(`[STARTING] Day ${day}`);
    const start = new Date();
    parts.forEach(part => {
        types.forEach(type => {
            if (_disableTests && type == Type.TEST) {
                return;
            }
            const logger: Logger = buildLogger(day, opt?.debug, part, type)

            logger.log("Running")
            const data = getData(day, type, part, logger);
            if (opt?.bench) {
                for (const benchTag of opt?.benchTags ?? [undefined]) {
                    const benchedResult = [];
                    for (let count = 0; count < 10; count++) {
                        benchedResult.push(doRun(fct, data, part, type, emptyLogger, benchTag));
                    }
                    const duration = benchedResult.sortIntuitiveCopy().slice(1, -1).reduce((a, b) => a + b) / (benchedResult.length - 2);
                    const benchTypeLabel = benchTag ?? "";
                    logger.log(`Bench ${benchTypeLabel} done in agv ${duration} ms`)
                }
            } else {
                const duration = doRun(fct, data, part, type, logger);
                logger.log(`Done in ${duration} ms`)
            }
        })
    });

    console.log(`[DONE] Day ${day} done in ${(new Date()).getTime() - start.getTime()} ms`);

}

function buildLogger(day: number, debugMode: boolean | undefined, part: Part, type: Type): Logger {
    const name = Type[type];
    return {
        isdebug: debugMode ? (() => true) : (() => false),
        debug: debugMode ? ((message: string | (() => string)) => console.log(`[${name}][${part}] ${typeof message === "function" ? message() : message}`)) : (() => { }),
        log: (message: string) => console.log(`[${name}][${part}] ${message}`),
        error: (message: string) => console.error(`[${name}][${part}] ${message}`),
        result: <T>(value: T | [T, T], result?: T | [T, T] | [T, T, T, T]) => {
            const result_value = calcSuccessMessage(part, type, value, result);
            const finalMessage = `[${name}][${part}] RESULT ${result_value} ====>${value}<====`;
            if (result_value === "KO") {
                const target = type === Type.RUN ? failures.run : failures.test;
                target.count++;
                target.parts.push(`[DAY ${day} ${part}]`)
                console.error(finalMessage);
            } else {
                console.log(finalMessage);
            }

        }
    };
}
