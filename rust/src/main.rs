use std::time::Instant;

use crate::utils::{RunOption, DaysRestriction};

mod day1;
mod day2;
mod day11;
mod day12;
mod day14;
mod day16;
mod day19;
mod day20;
mod day23;
mod day24;
mod utils;
mod priority_queue;

fn main() {
    let start = Instant::now();
    //let days_restriction:DaysRestriction = &Some(vec![14]);
    let days_restriction:DaysRestriction = &None;
    utils::run_all(&1, &day1::puzzle, RunOption::default(days_restriction));
    let duration = start.elapsed().as_millis() as u64;
    println!("");
    println!("[ALL] Overall finished in {} ms",duration);
}