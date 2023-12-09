use std::time::Instant;

use crate::utils::{RunOption, DaysRestriction};

mod day01;
mod day02;
mod day03;
mod day04;
mod day05;
mod day06;
/*mod day11;
mod day12;
mod day14;
mod day16;
mod day19;
mod day20;
mod day23;
mod day24;*/
mod utils;
mod priority_queue;

fn main() {
    let start = Instant::now();
    //let days_restriction:DaysRestriction = &Some(vec![5]);
    let days_restriction:DaysRestriction = &None;
    utils::run_all(&1, &day01::puzzle, RunOption::default(days_restriction));
    utils::run_all(&2, &day02::puzzle, RunOption::default(days_restriction));
    utils::run_all(&3, &day03::puzzle, RunOption::default(days_restriction));
    utils::run_all(&4, &day04::puzzle, RunOption::default(days_restriction));
    utils::run_all(&5, &day05::puzzle, RunOption::default(days_restriction));
    utils::run_all(&6, &day06::puzzle, RunOption::default(days_restriction));
    
    let duration = start.elapsed().as_millis() as u64;
    println!("");
    println!("[ALL] Overall finished in {} ms",duration);
}