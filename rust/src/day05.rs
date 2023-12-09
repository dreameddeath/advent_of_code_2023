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
    rules: Vec<MapRule>,
}

type Input = (Vec<RangeDef>, Vec<MapDef>);

fn parse(lines: &Vec<String>, is_part_two: bool) -> Input {
    let seed_ranges = parse_seeds(lines, is_part_two);
    let rules = parse_mapping_rules(lines);
    return (seed_ranges, rules);
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
    return MapDef { rules };
}

struct SplitResult {
    before: Option<RangeDef>,
    intersection: Option<RangeDef>,
    after: Option<RangeDef>,
}

fn intersect(seed_def: &RangeDef, rule: &MapRule) -> SplitResult {
    let mut result = SplitResult {
        before: None,
        intersection: None,
        after: None,
    };

    if seed_def.0 < rule.range.0 {
        result.before = Some((seed_def.0, seed_def.1.min(rule.range.0 - 1)))
    }

    if seed_def.1 >= rule.range.0 && seed_def.0 <= rule.range.1 {
        let min = if seed_def.0 < rule.range.0 {
            rule.range.0
        } else {
            seed_def.0
        };
        let max = if seed_def.1 > rule.range.1 {
            rule.range.1
        } else {
            seed_def.1
        };
        result.intersection = Some((min, max));
    }

    if seed_def.1 > rule.range.1 {
        result.after = Some((seed_def.0.max(rule.range.1 + 1), seed_def.1));
    }

    return result;
}

fn apply_map(orig_ranges: Vec<RangeDef>, map_def: &MapDef) -> Vec<RangeDef> {
    let mut result: Vec<RangeDef> = Vec::with_capacity(orig_ranges.len() * 2);

    for orig_range in orig_ranges {
        let mut to_map = Some(orig_range);
        for rule in &map_def.rules {
            if let Some(src) = to_map {
                let matching_result = intersect(&src, &rule);
                if let Some(before) = matching_result.before {
                    result.push(before)
                }
                if let Some(intersection) = matching_result.intersection {
                    result.push((intersection.0 + rule.offset, intersection.1 + rule.offset))
                }

                to_map = matching_result.after;
            } else {
                break;
            }
        }
        if let Some(no_match) = to_map {
            result.push(no_match);
        }
    }
    return result;
}

fn apply_maps(input: &Vec<MapDef>, orig: Vec<RangeDef>) -> Vec<RangeDef> {
    return input
        .iter()
        .fold(orig, |ranges, map_def| apply_map(ranges, map_def));
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let (seeds, map_defs) = parse(lines, context.is_part(Part::Part2));
    let mut result = apply_maps(&map_defs, seeds);
    result.sort_unstable_by(|a, b| a.0.cmp(&b.0));

    if context.is_part(Part::Part1) {
        check_result!(context, result[0].0, [35, 993500720]);
    } else {
        check_result!(context, result[0].0, [46, 4917124]);
    }
}
