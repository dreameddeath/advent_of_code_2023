use crate::{
    check_result,
    utils::Context,
};

struct Pattern {
    horizontal: Vec<i32>,
    vertical: Vec<i32>,
    all: Vec<Vec<i32>>,
}

fn parse(lines: &Vec<String>) -> Vec<Pattern> {
    return lines
        .iter()
        .as_slice()
        .split(|l| l.trim().len() == 0)
        .map(|pack| {
            let mut pattern = Pattern {
                horizontal: vec![0; pack[0].len()],
                vertical: vec![0; pack.len()],
                all: vec![vec![0; pack[0].len()]; pack.len()],
            };
            pack.iter().enumerate().for_each(|(y, c)| {
                c.chars().enumerate().for_each(|(x, c)| {
                    let value = if c == '#' { 1 } else { 0 };
                    pattern.horizontal[x] += value * 2_i32.pow(y as u32);
                    pattern.vertical[y] += value * 2_i32.pow(x as u32);
                    pattern.all[y][x] = value;
                })
            });
            return pattern;
        })
        .collect();
}

fn find_mirror(values: &Vec<i32>, map: impl Fn(usize) -> usize, to_ignore: &Option<usize>) -> Option<usize> {
    for base_position in 1..values.len() {
        let res = map(base_position);
        if to_ignore.is_some() && res == to_ignore.unwrap() {
            continue;
        }

        let mut offset = base_position.min(values.len() - base_position);
        while offset > 0 {
            if values[base_position - offset] != values[base_position + offset - 1] {
                break;
            }
            offset -= 1;
        }
        if offset == 0 {
            return Some(res);
        }
    }

    return None;
}

fn find_mirror_value(pattern: &Pattern, to_ignore: &Option<usize>) -> Option<usize> {
    if let Some(hres) = find_mirror(&pattern.vertical, |v| v * 100, to_ignore) {
        return Some(hres);
    }
    if let Some(vpos) = find_mirror(&pattern.horizontal, |v| v, to_ignore) {
        return Some(vpos);
    }
    None
}

fn find_all_parts(pattern: &mut Pattern) -> (usize, usize) {
    let standard_result = find_mirror_value(pattern, &None).unwrap();
    let to_ignore = Some(standard_result);
    for x in 0..pattern.horizontal.len() {
        for y in 0..pattern.vertical.len() {
            let curr_value = pattern.all[y][x];
            pattern.horizontal[x] -= curr_value * 2_i32.pow(y as u32);
            pattern.vertical[y] -= curr_value * 2_i32.pow(x as u32);
            if let Some(v) = find_mirror_value(pattern, &to_ignore) {
                return (standard_result, v);
            }
            pattern.horizontal[x] += curr_value * 2_i32.pow(y as u32);
            pattern.vertical[y] += curr_value * 2_i32.pow(x as u32);
        }
    }
    panic!("Not found");
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut values = parse(lines);
    let result: (usize, usize) = values
        .iter_mut()
        .map(|p| find_all_parts(p))
        .fold((0, 0), |v, v1| (v.0 + v1.0, v.1 + v1.1));
    check_result!(context, [result.0, result.1], [405, 33780, 400, 23479]);
}
