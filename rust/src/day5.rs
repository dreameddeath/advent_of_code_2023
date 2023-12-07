use lazy_static::lazy_static;
use regex::Regex;
use std::collections::BTreeMap;

use crate::{
    check_result,
    utils::{Context, Part},
};

type Int = i64;


type RangeDef = (Int, Int);

#[derive(Debug)]
struct MapRule {
    range: RangeDef,
    offset: Int,
}

#[derive(Debug)]
struct MapDef {
    source: String,
    target: String,
    rules: Vec<MapRule>,
}

#[derive(Debug)]
struct Input {
    seeds: Vec<RangeDef>,
    map: Vec<MapDef>,
}

fn parse(lines: &Vec<String>, is_part_two: bool) -> Input {
    let seed_ranges = parse_seeds(lines, is_part_two);
    let rules = parse_mapping_rules(lines);
    return Input {
        seeds: seed_ranges,
        map: rules,
    };
}

fn parse_seeds(lines: &Vec<String>, is_part_two: bool) -> Vec<(Int, Int)> {
    let seeds_num = lines[0]
        .split_once(":")
        .unwrap()
        .1
        .split_ascii_whitespace()
        .map(|str| str.parse::<Int>().unwrap())
        .collect::<Vec<Int>>();
    return if is_part_two {
        seeds_num
            .as_slice()
            .chunks_exact(2)
            .map(|c| (c[0], c[1] + c[0] - 1))
            .collect()
    } else {
        seeds_num.iter().map(|n| (*n, *n)).collect()
    };
}

fn parse_mapping_rules(lines: &Vec<String>) -> Vec<MapDef> {
    let rules: Vec<MapDef> = lines
        .as_slice()
        .split(|line| line.trim().is_empty())
        .skip(1)
        .map(|pack| parse_map_def(pack))
        .collect();
    rules
}

fn parse_map_def(pack: &[String]) -> MapDef {
    lazy_static! {
        static ref FIRST_LINE_REGEX: Regex = Regex::new(r"([a-z]+)-to-([a-z]+)\s+map:").unwrap();
    }
    let matching = FIRST_LINE_REGEX.captures(pack[0].as_str()).unwrap();
    let from = matching.get(1).unwrap().as_str();
    let to = matching.get(2).unwrap().as_str();
    let mut rules = pack
        .iter()
        .skip(1)
        .map(|rule_str| {
            let ranges_def_str: Vec<&str> = rule_str.split_ascii_whitespace().collect();
            let ranges_def = ranges_def_str
                .iter()
                .map(|n| n.parse::<Int>().unwrap())
                .collect::<Vec<Int>>();
            return MapRule {
                range: (ranges_def[1], ranges_def[2] + ranges_def[1] - 1),
                offset: ranges_def[0] - ranges_def[1],
            };
        })
        .collect::<Vec<MapRule>>();
    rules.sort_unstable_by(|a, b| a.range.0.cmp(&b.range.0));
    return MapDef {
        source: from.to_string(),
        target: to.to_string(),
        rules,
    };
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context.is_part(Part::Part2));
    if context.is_part(Part::Part1) {
        check_result!(context, 0, [0, 0]);
    } else {
        check_result!(context, 0, [0, 0]);
    }
}
