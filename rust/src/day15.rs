use crate::{
    check_result,
    utils::{Context, Part},
};

fn parse(lines: &Vec<String>) -> Vec<&String> {
    return lines
        .iter()
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines);
    if context.is_part(Part::Part1) {
        check_result!(context, 0, [0, 0]);
    } else {
        check_result!(context, 0, [0, 0]);
    }
}
