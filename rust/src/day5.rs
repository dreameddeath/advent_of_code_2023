use std::collections::BTreeMap;

use regex::Regex;

use crate::{
    check_result,
    utils::{Context, Part},
};

type Int = u16;

type RangeDef = (Int, Int);
struct MapRule {
    range: RangeDef,
    offset: Int,
}

struct MapDef {
    source: String,
    target: String,
    rules: Vec<MapRule>,
}

struct Input {
    seeds: Vec<RangeDef>,
    map: Vec<MapDef>,
}

fn parse(lines: &Vec<String>, is_part_two: bool) -> Input {
    let seeds_num = lines[0]
        .split_once(":")
        .unwrap()
        .1
        .split_ascii_whitespace()
        .map(|str| str.parse::<Int>().unwrap())
        .collect::<Vec<Int>>();
    let seed_ranges: Vec<RangeDef> = if is_part_two {
        seeds_num
            .as_slice()
            .chunks_exact(2)
            .map(|c| (c[0], c[1] + c[0] - 1))
            .collect()
    } else {
        seeds_num.iter().map(|n| (*n, *n)).collect()
    };
    let first_line_regex = Regex::new(r"([a-z]+)-to-([a-z]+)\s+map:").unwrap();
    let rules:Vec<MapDef> = lines
        .as_slice()
        .split(|line| line.trim().is_empty())
        .skip(1)
        .map(|pack| {
            let matching = first_line_regex.captures(pack[0].as_str()).unwrap();
            let from = matching.get(1).unwrap().as_str();
            let to = matching.get(2).unwrap().as_str();

            let mut rules = pack.iter().skip(1).map(|rule_str| {
                let ranges_def = rule_str
                    .split_ascii_whitespace()
                    .map(|n| n.parse::<Int>().unwrap())
                    .collect::<Vec<Int>>();
                return MapRule {
                    range: (ranges_def[1], ranges_def[2] + ranges_def[1] - 1),
                    offset: ranges_def[0] - ranges_def[1],
                };
            }).collect::<Vec<MapRule>>();
            rules.sort_unstable_by(|a,b| a.range.0.cmp(&b.range.0));

            return MapDef{
                source:from.to_string(),
                target:to.to_string(),
                rules
            }
        })
        .collect();
    return Input{
        seeds:seed_ranges,
        map:rules
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
