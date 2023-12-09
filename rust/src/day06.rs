use std::ops::Div;

use crate::{
    check_result,
    utils::{Context, Part},
};

struct Race {
    time: f64,
    distance: f64,
}
fn parse(lines: &Vec<String>, is_part_two: bool) -> Vec<Race> {
    let times_str = lines[0].split_once(":").unwrap().1.split_ascii_whitespace();
    let distances_str = lines[1].split_once(":").unwrap().1.split_ascii_whitespace();

    if is_part_two {
        let time = times_str
            .collect::<Vec<&str>>()
            .join("")
            .parse::<f64>()
            .unwrap();
        let distance = distances_str
            .collect::<Vec<&str>>()
            .join("")
            .parse::<f64>()
            .unwrap();
        return vec![Race { time, distance }];
    }

    let times = times_str.map(|n| n.parse::<f64>().unwrap());
    let distances = distances_str.map(|n| n.parse::<f64>().unwrap());

    return times
        .zip(distances)
        .map(|(time, distance)| Race { time, distance })
        .collect();
}

fn calculate_roots(race: &Race)-> (f64,f64) {
    let delta = (race.time.powi(2) - race.distance*4.0).sqrt();
    let min = (race.time - delta).div(2.0); 
    let max = (race.time + delta).div(2.0);
    return (min, max );
}

const PRECISION:f64 = 0.000001;
fn solve(race: &Race)-> u32 {
    let (x1,x2) = calculate_roots(race);
    let (x1_rounded,x2_rounded) = (x1.ceil(), x2.floor());
    let min_time:u32 = (x1_rounded + if (x1_rounded-x1).abs()<PRECISION {1.0} else { 0.0 }) as u32;
    let max_time:u32 = (race.time.min(x2_rounded - if (x2_rounded-x2).abs() <PRECISION { 1.0} else { 0.0 })) as u32;
    let solution = max_time - min_time + 1;
    return solution;
}


pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context.is_part(Part::Part2));

    let result = values.iter().map(solve).fold(1,|a, b| a * b);
    
    if context.is_part(Part::Part1) {
        check_result!(context, result, [288, 4403592]);
    } else {
        check_result!(context, result, [71503, 38017587]);
    }
}
