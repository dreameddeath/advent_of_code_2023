use std::time::Instant;

use crate::utils::{RunOption, DaysRestriction,Context};
#[allow(unused_imports)]
use crate::utils::Part::{Part2,Part1};

mod utils;
mod priority_queue;
mod map2d;


mod day01;
mod day02;
mod day03;
mod day04;
mod day05;
mod day06;
mod day07;
mod day08;
mod day09;
mod day10;
mod day11;
mod day12;
mod day13;
mod day14;
mod day15;
mod day16;
mod day17;
/*mod day14;
mod day16;
mod day19;
mod day20;
mod day23;
mod day24;*/

fn main() {
    let start = Instant::now();
    //let days_restriction:DaysRestriction = &Some(vec![17]);
    let days_restriction:DaysRestriction = &None;
    
    utils::run_all(&1, &day01::puzzle, RunOption::default(days_restriction));
    utils::run_all(&2, &day02::puzzle, RunOption::default(days_restriction));
    utils::run_all(&3, &day03::puzzle, RunOption::default(days_restriction));
    utils::run_all(&4, &day04::puzzle, RunOption::default(days_restriction));
    utils::run_all(&5, &day05::puzzle, RunOption::default(days_restriction));
    utils::run_all(&6, &day06::puzzle, RunOption::default(days_restriction));
    utils::run_all(&7, &day07::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&8, &day08::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&9, &day09::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&10, &day10::puzzle, RunOption::default(days_restriction));
    utils::run_all(&11, &day11::puzzle, RunOption::default(days_restriction));
    utils::run_all(&12, &day12::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&13, &day13::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&14, &day14::puzzle, RunOption::default(days_restriction));
    utils::run_all(&15, &day15::puzzle, RunOption::default(days_restriction));
    utils::run_all_simult(&16, &day16::puzzle, RunOption::default(days_restriction));
    utils::run_all(&17, &day17::puzzle, RunOption::default(days_restriction));
    let duration = start.elapsed().as_millis() as u64;
    println!("");
    println!("[ALL] Overall finished in {} ms with {} errors",duration,Context::get_errors());
}