use std::collections::BTreeSet;

use crate::{
    check_result,
    utils::{Context, Part},
};

#[derive(Debug, PartialEq, Eq)]
enum Cell {
    Number(u8),
    Gear,
    Symbol,
    Empty,
}

#[derive(Debug)]
struct Map {
    height: usize,
    width: usize,
    map: Vec<Cell>,
}

#[derive(Debug, PartialEq, Eq, Clone)]
enum Relative {
    Before,
    Same,
    After,
}

impl Relative {
    fn is_valid(&self, curr_pos: usize, max_pos: usize) -> bool {
        match self {
            Self::Same => true,
            Self::Before => curr_pos > 0,
            Self::After => curr_pos < max_pos,
        }
    }

    fn apply(&self, curr_pos: usize, step_size: usize) -> usize {
        match self {
            Self::Same => curr_pos,
            Self::Before => curr_pos - step_size,
            Self::After => curr_pos + step_size,
        }
    }
}

impl Map {
    fn get_x_pos(&self, pos: usize) -> usize {
        return pos % self.width;
    }

    fn get_x_cell_relative(&self, pos: usize, rel: &Relative) -> Option<(&Cell, usize)> {
        let x_pos = self.get_x_pos(pos);
        if !rel.is_valid(x_pos, self.width) {
            return None;
        }

        let next_pos = rel.apply(pos, 1);
        return  Some((&self.map[next_pos], next_pos));
    }

    fn is_symbol(&self, pos: usize, x: &Relative, y: &Relative) -> bool {
        let cell = self.get(pos, x, y);
        let result = cell
            .filter(|(c,_)| match *c {
                Cell::Symbol => true,
                _ => false,
            })
            .is_some();
        return result;
    }

    fn get(&self, pos: usize, x: &Relative, y: &Relative) -> Option<(&Cell,usize)> {
        if !x.is_valid(self.get_x_pos(pos), self.width)
            || !y.is_valid(pos / self.height, self.height)
        {
            return None;
        }
        let new_pos = y.apply(x.apply(pos, 1), self.width);
        return self.map.get(new_pos).map(|c|(c,new_pos));
    }

    fn has_symbol_adjacent(&self, pos: usize, x_relative: &Relative, check_curr: bool) -> bool {
        if check_curr {
            [Relative::Before, Relative::Same, Relative::After]
                .iter()
                .any(|y_rel| self.is_symbol(pos, x_relative, y_rel))
        } else {
            [Relative::Before, Relative::After]
                .iter()
                .any(|y_rel| self.is_symbol(pos, x_relative, y_rel))
        }
    }

    fn has_number_before(&self, pos: usize) -> bool {
        match self.get_x_cell_relative(pos, &Relative::Before) {
            Some((Cell::Number(_), _)) => true,
            _ => false,
        }
    }

    fn get_number_with_adjacent(&self, pos: usize) -> Option<u32> {
        let mut curr_pos = pos;
        let mut curr_number: u32 = self
            .get_x_cell_relative(pos, &Relative::Same)
            .map(|it| {
                if let Cell::Number(num) = it.0 {
                    return *num as u32;
                } else {
                    0
                }
            })
            .unwrap_or(0);
        let mut has_symbol_adjacent = self.has_symbol_adjacent(curr_pos, &Relative::Before, true)
            || self.has_symbol_adjacent(curr_pos, &Relative::Same, false);
        while let Some((Cell::Number(value), pos_after)) =
            self.get_x_cell_relative(curr_pos, &Relative::After)
        {
            curr_number = curr_number * 10 + (*value) as u32;
            curr_pos = pos_after;
            has_symbol_adjacent |= self.has_symbol_adjacent(curr_pos, &Relative::Same, false);
        }
        has_symbol_adjacent |= self.has_symbol_adjacent(curr_pos, &Relative::After, true);
        return if curr_number == 0 || !has_symbol_adjacent {
            None
        } else {
            Some(curr_number)
        };
    }

    fn get_number(&self, pos: usize) -> Option<u32> {
        let mut curr_pos = pos;
        let mut curr_number: u32 = self
            .get_x_cell_relative(pos, &Relative::Same)
            .map(|it| {
                if let Cell::Number(num) = it.0 {
                    return *num as u32;
                } else {
                    0
                }
            })
            .unwrap_or(0);
        while let Some((Cell::Number(value), pos_after)) =
            self.get_x_cell_relative(curr_pos, &Relative::After)
        {
            curr_number = curr_number * 10 + (*value) as u32;
            curr_pos = pos_after;
        }
        return if curr_number == 0  {
            None
        } else {
            Some(curr_number)
        };
    }


    fn get_number_start(&self, pos: usize) -> usize {
        let mut curr_pos = pos;
        while self.has_number_before(curr_pos) {
            curr_pos -= 1;
        }
        return curr_pos;
    }
}

fn parse(lines: &Vec<String>, is_part_two: bool) -> Map {
    let map = lines
        .into_iter()
        .flat_map(|line| {
            line.chars().map(|c| match c {
                '.' => Cell::Empty,
                '0'..='9' => Cell::Number(c.to_digit(10).unwrap() as u8),
                '*' => {
                    if is_part_two {
                        Cell::Gear
                    } else {
                        Cell::Symbol
                    }
                }
                _ => Cell::Symbol,
            })
        })
        .collect();
    return Map {
        height: lines.len(),
        width: lines.get(0).unwrap().len(),
        map,
    };
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let values = parse(lines, context.is_part(Part::Part2));
    if context.is_part(Part::Part1) {
        let result: u32 = values
            .map
            .iter()
            .enumerate()
            .filter(|(pos, item)| match item {
                Cell::Number(_) if !values.has_number_before(*pos) => true,
                _ => false,
            })
            .filter_map(|(pos, _)| values.get_number_with_adjacent(pos))
            .sum();

        check_result!(context, result, [4361, 550934]);
    } else {
        let all_tuples:Vec<(Relative,Relative)> = [Relative::Before,Relative::After,Relative::Same].iter()
        .flat_map(|x_rel| [Relative::Before,Relative::After,Relative::Same].iter().map(|y_iter| (x_rel.clone(),y_iter.clone())))
        .filter(|(x_rel,y_rel)| !(*x_rel==Relative::Same && *y_rel==Relative::Same))
        .collect();

        let result: u32 = values
            .map
            .iter()
            .enumerate()
            .filter(|(_, item)| match item {
                Cell::Gear => true,
                _ => false,
            })
            .filter_map(|(pos, _)| {
                let start_numbers: BTreeSet<usize> = all_tuples.iter()
                    .filter_map(|(x_rel,y_rel)| {
                        let matching = values.get(pos,x_rel,y_rel).and_then(|(cell,new_pos)|
                         match *cell {Cell::Number(_)=> Some(values.get_number_start(new_pos)),_=>None });
                        matching
                    }).collect();
                if start_numbers.len()>1 {
                    let gear = start_numbers.iter().filter_map(|start_pos| values.get_number(*start_pos)).fold(1 as u32, |cumul,curr|cumul*curr);
                    Some(gear)
                } else {None}
            })
            .sum();


        check_result!(context, result, [467835, 81997870]);
    }
}
