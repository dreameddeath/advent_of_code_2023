use crate::{
    check_result,
    utils::{Context, Part},
};
pub fn parse(lines: &Vec<String>) -> Vec<i32> {
    return lines
        .into_iter()
        .map(|l| {
            if l.len() == 0 {
                -1
            } else {
                l.parse::<i32>().ok().unwrap_or(-1)
            }
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines);

    let mut grouped_sum: Vec<i32> = values
        .split(|v| *v < 0)
        .map(|group| group.iter().filter(|v| **v >= 0).sum())
        .collect();

    grouped_sum.sort_by(|a, b| b.cmp(a));
    if context.is_part(Part::Part1) {
        check_result!(context, grouped_sum[0], [24000, 74394]);
    } else {
        let total: i32 = grouped_sum.into_iter().take(3).sum();
        check_result!(context, total, [45000, 212836]);
    }
}
