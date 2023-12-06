use crate::{
    check_result,
    utils::{Context, Part},
};
use regex::Regex;

fn to_number(input: &str) -> i32 {
    return match input {
        "one" => 1,
        "two" => 2,
        "three" => 3,
        "four" => 4,
        "five" => 5,
        "six" => 6,
        "seven" => 7,
        "eight" => 8,
        "nine" => 9,
        _ => input.parse::<i32>().unwrap(),
    };
}

pub fn parse(lines: &Vec<String>, is_part_two: bool) -> Vec<i32> {
    let regexp = if is_part_two {
        Regex::new(r"^.*?(\d+|one|two|three|four|five|six|seven|eight|nine).*(\d+|one|two|three|four|five|six|seven|eight|nine).*?$").unwrap()
    } else {
        Regex::new(r"^.*?(\d+).*(\d+).*$").unwrap()
    };
    return lines
        .into_iter()
        .map(|l| {
            let matching = regexp.captures(l.as_str()).unwrap();
            let first_digit = matching.get(0).map_or(0, |n| to_number(n.as_str()));
            let second = matching.get(1).map_or(0, |n| to_number(n.as_str()));
            return first_digit * 10 + second;
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context.is_part(Part::Part2));
    let result = values.into_iter().sum();
    if context.is_part(Part::Part1) {
        check_result!(context, result , [142, 55607]);
    } else {
        check_result!(context, result, [281, 55291]);
    }
}
