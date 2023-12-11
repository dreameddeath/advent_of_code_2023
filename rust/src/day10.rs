use crate::{
    check_result,
    utils::Context,
};

fn parse(lines: &Vec<String>) -> Vec<&String> {
    return lines.iter().collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines);
    check_result!(context, [values.len(), values.len()], [0, 0, 0, 0]);
}
