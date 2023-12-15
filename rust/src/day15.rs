use std::collections::BTreeMap;

use crate::{
    check_result,
    utils::{Context, Part},
};

fn calc_hash(str: &str) -> u8 {
    str.chars().fold(0 as u16, |h, c| ((h + c as u16) * 17) % 256) as u8
}

type BoxesMap<'a> = BTreeMap<u8, Vec<(&'a str, u8)>>;

fn update_box<'a>(part:&'a str,boxes :&mut BoxesMap<'a>){
    let op_pos = part.find(|c| c == '=' || c == '-').unwrap();
            let op = part.chars().nth(op_pos).unwrap();
            let lens = &part[0..op_pos];
            let box_id = calc_hash(lens);
            if !boxes.contains_key(&box_id) {
                let new_value = vec![];
                boxes.insert(box_id, new_value);
            }
            let box_found = boxes.get_mut(&box_id).unwrap();

            match op {
                '=' => {
                    let value = part[op_pos + 1..].parse::<u8>().unwrap();
                    let found = box_found.iter_mut().enumerate().find(|existing_lens| existing_lens.1 .0 == lens);
                    if let Some(existing) = found {
                        existing.1 .1 = value;
                    } else {
                        box_found.push((lens, value))
                    }
                }
                _ => box_found.retain(|curr| curr.0 != lens),
            }
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let items = lines[0].split(",");
    if context.is_part(Part::Part1) {
        let result = items.map(|part| calc_hash(part) as u32).sum();
        check_result!(context, result, [1320, 511215]);
    } else {
        let mut boxes: BoxesMap = BTreeMap::new();
        items.for_each(|part| {
            update_box(part, &mut boxes)
        });

        let result: u32 = boxes
            .iter()
            .map(|(box_id, lenses)| {
                lenses
                    .iter()
                    .enumerate()
                    .map(|(index, v)| (*box_id as u32 + 1) * (index as u32 + 1) * (v.1 as u32))
                    .sum::<u32>()
            })
            .sum();
        check_result!(context, result, [145, 236057]);
    }
}
