use rustc_hash::FxHashMap;

use crate::{
    check_result, log,
    utils::{Context, Part},
};

type Input = (String, Vec<u8>);

struct ToSolve<'a> {
    str: &'a [u8],
    groups: &'a Vec<u8>,
}

const TO_REPEAT: [u8; 5] = [1, 2, 3, 4, 5];
fn parse(lines: &Vec<String>, is_part_two: bool) -> Vec<Input> {
    return lines
        .iter()
        .map(|l| {
            let (base_pattern, groups_str) = l.split_once(" ").unwrap();
            let base_group = groups_str.split(",").map(|n| n.parse::<u8>().unwrap()).collect::<Vec<u8>>();
            let pattern = if is_part_two {
                TO_REPEAT.iter().map(|_| base_pattern).collect::<Vec<&str>>().join("?")
            } else {
                base_pattern.to_string()
            };
            let groups = if is_part_two {
                TO_REPEAT.iter().flat_map(|_| base_group.clone()).collect::<Vec<u8>>()
            } else {
                base_group
            };
            return (pattern, groups);
        })
        .collect();
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
struct State {
    curr_group_idx: u8,
    curr_str_idx: u8,
}

struct Caches {
    memoized: FxHashMap<State, u64>,
}
const DOT: u8 = '.' as u8;
const HASH: u8 = '#' as u8;
const QMARK: u8 = '?' as u8;

fn skip_dots(orig_idx: u8, str: &[u8]) -> Option<u8> {
    let mut idx = orig_idx;
    if (idx as usize) >= str.len() {
        return None;
    }
    while str[idx as usize] == DOT {
        idx += 1;
        if (idx as usize) >= str.len() {
            return None;
        }
    }
    return Some(idx);
}

fn find_matching_end(curr_str_start_idx: &usize, grp_size: &usize, str: &[u8], is_last_group: bool) -> Option<usize> {
    let mut curr_pos = *curr_str_start_idx;
    while curr_pos < *curr_str_start_idx + *grp_size {
        if let Some(c) = str.get(curr_pos as usize) {
            if *c != QMARK && *c != HASH {
                return None;
            }
        } else {
            return None;
        }
        curr_pos += 1;
    }
    if !is_last_group {
        if let Some(c) = str.get(curr_pos as usize) {
            if *c != QMARK && *c != DOT {
                return None;
            }
        } else {
            return None;
        }
        curr_pos += 1
    }
    return Some(curr_pos);
}

fn explore_next_solution(to_solve: &ToSolve, next_group_idx: u8, next_pos: u8, caches: &mut Caches) -> u64 {
    let new_state = State {
        curr_group_idx: next_group_idx,
        curr_str_idx: next_pos,
    };
    if let Some(res) = caches.memoized.get(&new_state) {
        return *res;
    } else {
        let result = find_solutions(to_solve, &new_state, caches);
        caches.memoized.insert(new_state, result);
        return result;
    }
}

fn check_end_of_string(curr_str_start_idx: &u8, str: &[u8])->u64 {
    let mut curr_pos = *curr_str_start_idx as usize;
    while curr_pos < str.len() {
        if str[curr_pos] == HASH {
            return 0;
        }
        curr_pos += 1
    }
    return 1;
}
fn find_solutions(to_solve: &ToSolve, state: &State, caches: &mut Caches) -> u64 {
    if to_solve.groups.len() as u8 == state.curr_group_idx {
        return check_end_of_string(&state.curr_str_idx, to_solve.str);
    }

    let mut curr_str_start_idx = state.curr_str_idx as usize;
    let grp_size = to_solve.groups[state.curr_group_idx as usize] as usize;
    let is_last_group = (state.curr_group_idx + 1) == to_solve.groups.len() as u8;
    let mut total: u64 = 0;
    loop {
        if let Some(end_pos) = find_matching_end(&curr_str_start_idx, &grp_size, to_solve.str, is_last_group) {
            if let Some(next_pos) = skip_dots(end_pos as u8, to_solve.str) {
                total += explore_next_solution(to_solve, state.curr_group_idx + 1, next_pos, caches)
            } else {
                total += if is_last_group { 1 } else { 0 };
                break;
            }
        }
        let curr_start_char = to_solve.str[curr_str_start_idx];
        if curr_start_char == HASH {
            break;
        }
        if (curr_start_char != DOT && curr_start_char != QMARK) || (curr_str_start_idx + 1) >= to_solve.str.len() {
            break;
        }
        curr_str_start_idx += 1
    }

    return total;
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context.is_part(Part::Part2));
    let result: u64 = values
        .iter()
        .map(|input| {
            let mut caches = Caches {
                memoized: FxHashMap::default(),
            };
            let result = find_solutions(
                &ToSolve {
                    str: input.0.as_bytes(),
                    groups: &input.1,
                },
                &State {
                    curr_group_idx: 0,
                    curr_str_idx: 0,
                },
                &mut caches,
            );
            log!(debug, context, "Result of {} : {}", input.0, result);
            return result;
        })
        .sum();
    if context.is_part(Part::Part1) {
        check_result!(context, result, [21, 7118]);
    } else {
        check_result!(context, result, [525152, 7030194981795]);
    }
}
