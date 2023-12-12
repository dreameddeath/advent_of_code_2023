import { Logger, Part, run, Type } from "../day_utils"
import { ExtendedMap } from "../mapUtils";
import { generator } from "../utils";

interface LineInfo {
    index: number,
    groups: number[],
    pattern: string,
}


function parse(lines: string[], is_part_2: boolean): LineInfo[] {
    return lines.map((l, index) => {
        let [origPattern, rules_str] = l.split(/\s+/);
        let pattern = origPattern;
        if (is_part_2) {
            pattern = [...generator(5)].map(_ => pattern).join("?");
            rules_str = [...generator(5)].map(_ => rules_str).join(",");
        }
        const groups = rules_str.split(/,/).map(n => parseInt(n, 10));

        const result: LineInfo = {
            index,
            groups,
            pattern
        }
        return result;
    });
}


interface State {
    currPos: number,
    currGroupPos: number,
}

function find_end_position(currStartingPos: number, grpSize: number, pattern: string, isLastGroup: boolean): number | undefined {
    let currPos = currStartingPos;
    for (; currPos < currStartingPos + grpSize; ++currPos) {
        const currChar = pattern[currPos]
        if (currChar !== "?" && currChar !== "#") {
            return undefined
        }
    }
    if (!isLastGroup) {
        const currChar = pattern[currPos];
        if (currChar !== "?" && currChar !== ".") {
            return undefined;
        }
        currPos++;
    }
    return currPos;
}

type Solution = number;

interface Caches {
    memoization: ExtendedMap<string, number>
}



function find_solutions(lineInfo: LineInfo, state: State, caches: Caches): Solution {
    const currGrpSize = lineInfo.groups[state.currGroupPos];
    
    if(currGrpSize===undefined){
        return lineInfo.pattern.slice(state.currPos).indexOf("#")<0?1:0
    }
    const pattern = lineInfo.pattern;
    const is_ending_group = state.currGroupPos + 1 === lineInfo.groups.length;
    let currStartingPos=state.currPos;
    let total=0
    do {
        const currEndPos =find_end_position(currStartingPos,currGrpSize,pattern,is_ending_group)

        if (currEndPos!==undefined) {
            let nextStartPos = currEndPos;
            while (pattern[nextStartPos] === ".") {nextStartPos++}
            if(nextStartPos===pattern.length){
                total+=is_ending_group?1:0;
                break;
            }else{
                const newState: State = {
                    currGroupPos: state.currGroupPos + 1,
                    currPos: nextStartPos
                }
                total+=caches.memoization.cache(`${newState.currGroupPos}|${newState.currPos}`, () => find_solutions(lineInfo, newState, caches))    
            }
        }
        if (pattern[currStartingPos] === "#") {
            break;
        }
        if(pattern[currStartingPos]!== "?" && pattern[currStartingPos] !== "."){
            break;
        }
        currStartingPos++
    } while (currStartingPos!==pattern.length)
    return total;
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part === Part.PART_2);
    const result = data.map((lineInfo, index) => {
        const memoization = new ExtendedMap<string, number>();
        const result = find_solutions(lineInfo, {
            currGroupPos: 0,
            currPos: 0
        }, { memoization });
        logger.debug(() => `Result of ${lineInfo.pattern} : ${result}`);
        return result;
    }).reduce((a, b) => a + b, 0);
    if (part === Part.PART_1) {
        logger.result(result, [21, 7118])
    }
    else {
        logger.result(result, [525152, 7030194981795])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(12, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false });
