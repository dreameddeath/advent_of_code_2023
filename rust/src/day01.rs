use crate::{
    check_result, log,
    utils::{Context, Part},
};


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


const BASE: &'static [&'static str] = &["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const FULL: &'static [&'static str] = &[
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine",
];

#[allow(dead_code)]
fn parse(lines: &Vec<String>, context: &Context) -> Vec<i32> {
    let is_part_two = context.is_part(Part::Part2);
    let chars = if is_part_two { FULL } else { BASE };
    return lines
        .into_iter()
        .map(|l| {
            let first_digit = chars
                .iter()
                .map(|str| {
                    (
                        str,
                        l.find(str)
                            .map(|found| found as i32)
                            .unwrap_or(std::i32::MAX),
                    )
                })
                .min_by(|a, b| a.1.cmp(&(b.1)))
                .map(|a| to_number(a.0))
                .unwrap_or(std::i32::MAX);
            let second = chars
                .iter()
                .map(|str| (str, l.rfind(str).map(|found| found as i32).unwrap_or(-1)))
                .max_by(|a, b| a.1.cmp(&(b.1)))
                .map(|a| to_number(a.0))
                .unwrap_or(0);

            log!(
                debug,
                context,
                "{} ==> Found {}{}",
                l,
                &first_digit,
                &second
            );
            return first_digit * 10 + second;
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context);
    let result = values.into_iter().sum();
    if context.is_part(Part::Part1) {
        check_result!(context, result, [142, 55607]);
    } else {
        check_result!(context, result, [281, 55291]);
    }
}
