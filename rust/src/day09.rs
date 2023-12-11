use crate::{
    check_result,
    utils::Context
};

fn parse(lines: &Vec<String>) -> Vec<Vec<i32>> {
    return lines
        .iter()
        .map(|l| {
            l.split_ascii_whitespace()
                .map(|n| n.parse::<i32>().unwrap())
                .collect::<Vec<i32>>()
        })
        .collect();
}

struct NextHistory {
    array: Vec<i32>,
    zeros: u16,
}

fn next_array(h: &Vec<i32>) -> NextHistory {
    let mut zeros = 0;
    let array = h
        .iter()
        .take(h.len() - 1)
        .enumerate()
        .map(|(index, v)| {
            let new_value = h[index + 1] - *v;
            if new_value == 0 {
                zeros += 1;
            }
            return new_value;
        })
        .collect();
    return NextHistory { zeros, array };
}

fn predict(h: &Vec<i32>) -> (i32, i32) {
    let next_array_info = next_array(h);
    let (curr_first, curr_last) = (h[0], h[h.len() - 1]);
    if next_array_info.zeros == next_array_info.array.len() as u16 {
        return (curr_first, curr_last);
    }
    let (before, after) = predict(&next_array_info.array);
    return (curr_first - before, curr_last + after);
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines);
    let (part2_res, part1_res) = values
        .iter()
        .map(|h| predict(h))
        .fold((0, 0), |s, p| (s.0 + p.0, s.1 + p.1));
    check_result!(context, [part1_res, part2_res], [114, 1921197370, 2, 1124]);
}
