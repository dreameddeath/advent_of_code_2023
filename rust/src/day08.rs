use std::collections::BTreeMap;

use crate::{check_result, utils::Context};

#[derive(Debug, PartialEq, Eq)]
enum Direction {
    LEFT = 0,
    RIGHT = 1,
}

fn get_pos<'a>(name: &'a str, map: &mut BTreeMap<&'a str, u16>) -> u16 {
    if let Some(pos) = map.get(name) {
        return *pos;
    }
    let pos = map.len() as u16;
    map.insert(name, pos);
    return pos;
}
struct Input {
    instructions: Vec<Direction>,
    rules: Vec<(u16, u16)>,
    start_pos_part1: u16,
    end_pos_part1: u16,
    start_pos_part2: Vec<u16>,
    end_pos_part2: Vec<u16>,
}
fn parse(lines: &Vec<String>) -> Input {
    let instructions = lines[0]
        .chars()
        .map(|c| {
            if c == 'L' {
                Direction::LEFT
            } else {
                Direction::RIGHT
            }
        })
        .collect::<Vec<Direction>>();
    let mut input = Input {
        instructions,
        rules: vec![(0, 0); lines.len() - 2],
        start_pos_part1: 0,
        end_pos_part1: 0,
        start_pos_part2: vec![],
        end_pos_part2: vec![],
    };
    let mut map: BTreeMap<&str, u16> = BTreeMap::new();

    lines.iter().skip(2).for_each(|l| {
        let (name, targets) = l.split_once(" = ").unwrap();
        let (left, target) = targets[1..=8].split_once(", ").unwrap();
        let name_pos = get_pos(name, &mut map);
        input.rules[name_pos as usize] = (
            get_pos(left, &mut map) as u16,
            get_pos(target, &mut map) as u16,
        );
        if name.eq("AAA") {
            input.start_pos_part1 = name_pos
        }
        if name.eq("ZZZ") {
            input.end_pos_part1 = name_pos
        }

        if name.ends_with('A') {
            input.start_pos_part2.push(name_pos)
        }
        if name.ends_with('Z') {
            input.end_pos_part2.push(name_pos)
        }
    });

    input
}

fn solve_part1(input: &Input) -> u64 {
    let mut nb_steps: u32 = 0;
    let size = input.instructions.len() as usize;
    let mut curr_pos = input.start_pos_part1;
    while curr_pos != input.end_pos_part1 {
        nb_steps += 1;
        let direction = &input.instructions[(nb_steps as usize - 1) % size];
        let rules = input.rules[curr_pos as usize];
        curr_pos = if *direction == Direction::LEFT {
            rules.0
        } else {
            rules.1
        }
    }

    nb_steps as u64
}

fn solve_part2(input: &Input) -> u64 {
    let mut loops_informations: Vec<(u32, u32)> = vec![(0, 0); input.start_pos_part2.len()];
    let mut curr_positions = input.start_pos_part2.clone();
    let mut nb_loops_finished = 0;
    let mut nb_steps: u32 = 0;
    let size = input.instructions.len() as usize;

    while nb_loops_finished != loops_informations.len() {
        nb_steps += 1;
        let direction = &input.instructions[(nb_steps as usize - 1) % size];
        for pos in 0..curr_positions.len() {
            let curr_loop = &mut loops_informations[pos];
            if curr_loop.1 != 0 {
                continue;
            }
            let rules = input.rules[curr_positions[pos] as usize];
            let new_pos = if *direction == Direction::LEFT {
                rules.0
            } else {
                rules.1
            };
            curr_positions[pos] = new_pos;
            if input.end_pos_part2.contains(&new_pos) {
                if curr_loop.0 == 0 {
                    curr_loop.0 = nb_steps
                } else if curr_loop.1 == 0 {
                    curr_loop.1 = nb_steps;
                    nb_loops_finished += 1;
                }
            }
        }
    }
    let mut primes: Vec<u32> = vec![2, 3, 5, 7, 11, 13];
    let primes_decompositions = loops_informations
        .iter()
        .map(|loop_info| decompose_primes(loop_info.0, &mut primes))
        .collect::<Vec<Vec<u8>>>();
    let mut ppcm_parts: Vec<u32> = vec![0; primes.len()];

    primes_decompositions
        .iter()
        .for_each(|primes_decomposition| {
            primes_decomposition
                .iter()
                .enumerate()
                .for_each(|(index, nb)| {
                    ppcm_parts[index] = ppcm_parts[index].max(*nb as u32);
                })
        });

    return primes
        .iter()
        .zip(ppcm_parts)
        .fold(1, |total, (prime, nb)| total * (prime.pow(nb)) as u64);
}

fn decompose_primes(loop_info: u32, primes: &mut Vec<u32>) -> Vec<u8> {
    let mut result: Vec<u8> = Vec::with_capacity(primes.len());
    let mut reminder = loop_info;
    let mut pos_prime = 0;
    while reminder != 1 {
        let p = get_next_prime(primes, pos_prime);
        let mut nb = 0;
        while reminder % p == 0 {
            reminder = reminder / p;
            nb += 1;
        }
        result.push(nb);
        pos_prime += 1;
    }
    return result;
}

fn add_next_prime(primes: &mut Vec<u32>) -> u32 {
    let mut curr_number = primes[primes.len() - 1];
    loop {
        curr_number += 1;
        if primes.iter().filter(|n| curr_number % *n == 0).count() == 0 {
            primes.push(curr_number);
            return curr_number;
        }
    }
}

fn get_next_prime(primes: &mut Vec<u32>, pos_prime: usize) -> u32 {
    if pos_prime == primes.len() {
        return add_next_prime(primes);
    }
    primes[pos_prime]
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let input = parse(lines);

    let result_part1 = solve_part1(&input);
    let result_part2 = solve_part2(&input);
    check_result!(
        context,
        [result_part1, result_part2],
        [6, 18827, 6, 20220305520997]
    );
}
