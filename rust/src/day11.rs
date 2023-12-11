use std::collections::{BTreeSet, BTreeMap};

use crate::{
    check_result,
    utils::{Context, Part},
};

struct Star{
    x:usize,
    y:usize,
}

fn build_offset_map(max: usize, non_empty: &BTreeSet<usize>, context:&Context)-> BTreeMap<usize,usize> {
    let mut result = BTreeMap::new();
    let mut offset = 0;
    for  pos in 0..=max {
        result.insert(pos, offset);
        if !non_empty.contains(&pos) {
            if context.is_part(Part::Part1) {
                offset+=1;
            } else {
                offset += if context.is_test() { 100 } else { 1_000_000 } - 1;
            }
        }
    }
    return result;
}

fn solve(lines: &Vec<String>,context: &Context) -> usize {
    let mut used:(BTreeSet<usize>,BTreeSet<usize>) = (BTreeSet::new(),BTreeSet::new());
    let mut max:(usize,usize) = (0,0);
    let stars= lines
        .iter()
        .enumerate()
        .flat_map(|(y,l)|{
            l.chars().enumerate().filter_map(|(x,c)|
                if c=='.' {
                    None
                } else {
                    used.0.insert(x);
                    used.1.insert(y);
                    max.0=max.0.max(x);
                    max.1=max.1.max(y);
                    Some(Star{x,y})
                }
            ).collect::<Vec<Star>>()
        })
        .collect::<Vec<Star>>();
    let offset_x_map = build_offset_map(max.0, &used.0,  context);
    let offset_y_map = build_offset_map(max.1, &used.1,  context);

    let corrected_stars = stars.iter().map(|s| {
        return Star{ x: s.x + offset_x_map.get(&s.x).unwrap(), y: s.y + offset_y_map.get(&s.y).unwrap() }
    }).collect::<Vec<Star>>();

    return corrected_stars.iter().enumerate().fold(0,
        |total, (index,s1)| {
            total + corrected_stars.iter().skip(index).map(|s2| s2.x.abs_diff(s1.x) + s2.y.abs_diff(s1.y)).sum::<usize>()
        })
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let result = solve(lines,context);
    if context.is_part(Part::Part1) {
        check_result!(context, result, [374, 9693756]);
    } else {
        check_result!(context, result, [8410, 717878258016]);
    }
}
