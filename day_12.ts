import { Logger, Part, run, Type } from "./day_utils"
import { ExtendedMap } from "./mapUtils";
import { generator } from "./utils";

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


interface StateV3 {
    currPos: number,
    currGroupPos: number,
}

function find_matching_end_positions(pattern: string, startingPos: number, grpSize: number, isLastGroup: boolean): number[] {
    const need_ending_dot = !isLastGroup;

    let currStartingPos = startingPos;
    while (pattern[currStartingPos] === ".") {
        currStartingPos++
    }
    const result: number[] = [];
    currStartingPos--;
    do {
        currStartingPos++;
        let currPos = currStartingPos;
        let matching = true;
        for (; currPos < currStartingPos + grpSize; ++currPos) {
            const currChar = pattern[currPos]
            if (currChar !== "?" && currChar !== "#") {
                matching = false;
                break;
            }
        }
        if (matching && need_ending_dot) {
            const currChar = pattern[currPos];
            if (currChar !== "?" && currChar !== ".") {
                matching = false;
            }
            currPos++;
        }

        if (matching) {
            while (pattern[currPos] === ".") currPos++
            result.push(currPos);
        }
        if (pattern[currStartingPos] === "#") {
            break;
        }
    } while (pattern[currStartingPos] === "?" || pattern[currStartingPos] === ".")

    return result;
}
type Solution = number;

interface RemainingGroupInfo { nb_failures: number, min_string_length: number }

interface Caches {
    memoization: ExtendedMap<string, number>,
    possible_failures_in_remaining_string: ExtendedMap<number, number>,
    remaining_group_info: ExtendedMap<number, RemainingGroupInfo>
}

function calcPotentialFailures(pattern: string): number {
    return pattern.split("").filter(c => c === "?" || c === "#").length
}

function calcRemainingFailures(groups: number[]): RemainingGroupInfo {
    return {
        nb_failures: groups.reduce((a, b) => a + b, 0),
        min_string_length: groups.reduce((a, b) => a + b, 0) + groups.length - 1
    }
}


function find_solutions_v3(lineInfo: LineInfo, state: StateV3, caches: Caches): Solution {
    const nb_possible_failures = caches.possible_failures_in_remaining_string.cache(state.currPos, (pos) => calcPotentialFailures(lineInfo.pattern.slice(pos)))
    const remaining_grp_info = caches.remaining_group_info.cache(state.currGroupPos, (pos) => calcRemainingFailures(lineInfo.groups.slice(pos)))

    if (remaining_grp_info.nb_failures > nb_possible_failures) {
        return 0;
    }
    if (remaining_grp_info.min_string_length > lineInfo.pattern.slice(state.currPos).length) {
        return 0;
    }

    const currGroup = lineInfo.groups[state.currGroupPos];
    const is_ending_group = state.currGroupPos + 1 === lineInfo.groups.length;
    const matching_ends = find_matching_end_positions(lineInfo.pattern, state.currPos, currGroup, is_ending_group);
    if (matching_ends.length === 0) {
        return 0;
    }
    if (is_ending_group) {
        return matching_ends.filter(pos => lineInfo.pattern.indexOf("#", pos) < 0).length;
    }
    else {
        return matching_ends.map(pos => {
            const newState: StateV3 = {
                currGroupPos: state.currGroupPos + 1,
                currPos: pos
            }
            return caches.memoization.cache(JSON.stringify(newState), () => find_solutions_v3(lineInfo, newState, caches))
        }).reduce((a, b) => a + b, 0)
    }
}

function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part === Part.PART_2);
    const result = data.map((lineInfo, index) => {
        const memoization = new ExtendedMap<string, number>();
        const possible_failures_in_remaining_string = new ExtendedMap<number, number>();
        const remaining_group_info = new ExtendedMap<number, RemainingGroupInfo>();
        const result = find_solutions_v3(lineInfo, {
            currGroupPos: 0,
            currPos: 0
        }, { memoization, possible_failures_in_remaining_string, remaining_group_info });
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
