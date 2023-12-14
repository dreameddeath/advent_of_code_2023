use rustc_hash::FxHashMap;

use crate::{
    check_result,
    utils::Context,
};

#[derive(Debug, PartialEq, Eq)]
enum CellType {
    ROCK,
    EMPTY,
    SOLID,
}

struct Map {
    content: Vec<Vec<CellType>>,
    nb_rocks_per_row: Vec<u32>,
    nb_rocks_per_column: Vec<u32>,
    width: usize,
    height: usize,
}

struct Pos {
    x: usize,
    y: usize,
}

#[derive(Debug, PartialEq, Eq)]
enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

impl Map {
    fn move_pos(&self, pos: &Pos, dir: &Direction) -> Option<Pos> {
        match dir {
            Direction::DOWN => {
                if pos.y < (self.height - 1) {
                    Some(Pos { x: pos.x, y: pos.y + 1 })
                } else {
                    None
                }
            }
            Direction::UP => {
                if pos.y > 0 {
                    Some(Pos { x: pos.x, y: pos.y - 1 })
                } else {
                    None
                }
            }
            Direction::LEFT => {
                if pos.x > 0 {
                    Some(Pos { x: pos.x - 1, y: pos.y })
                } else {
                    None
                }
            }
            Direction::RIGHT => {
                if pos.x < (self.width - 1) {
                    Some(Pos { x: pos.x + 1, y: pos.y })
                } else {
                    None
                }
            }
        }
    }
    fn next_empty_block(&self, pos: &Pos, dir: &Direction) -> Option<Pos> {
        let mut curr_pos = Pos { x: pos.x, y: pos.y };
        while let Some(new_pos) = self.move_pos(&curr_pos, dir) {
            if self.content[new_pos.y][new_pos.x] != CellType::EMPTY {
                break;
            }
            curr_pos = new_pos;
        }
        return if curr_pos.x == pos.x && curr_pos.y == pos.y {
            None
        } else {
            Some(curr_pos)
        };
    }
    fn tilt_one(&mut self, pos: Pos, dir: &Direction) {
        if self.content[pos.y][pos.x] != CellType::ROCK {
            return;
        }
        if let Some(new_pos) = self.next_empty_block(&pos, dir) {
            self.nb_rocks_per_row[pos.y] -= 1;
            self.nb_rocks_per_column[pos.x] -= 1;
            self.content[pos.y][pos.x] = CellType::EMPTY;

            self.nb_rocks_per_row[new_pos.y] += 1;
            self.nb_rocks_per_column[new_pos.x] += 1;
            self.content[new_pos.y][new_pos.x] = CellType::ROCK;
        }
    }

    fn tilt(&mut self, dir: &Direction) {
        match dir {
            Direction::UP => (0..self.height).for_each(|y| (0..self.width).for_each(|x| self.tilt_one(Pos { x, y }, dir))),
            Direction::DOWN => (0..self.height).rev().for_each(|y| (0..self.width).for_each(|x| self.tilt_one(Pos { x, y }, dir))),
            Direction::LEFT => (0..self.width).for_each(|x| (0..self.height).for_each(|y| self.tilt_one(Pos { x, y }, dir))),
            Direction::RIGHT => (0..self.width).rev().for_each(|x| (0..self.height).for_each(|y| self.tilt_one(Pos { x, y }, dir))),
        }
    }
    fn calc_load(array: &Vec<u32>) -> u32 {
        return array
            .iter()
            .enumerate()
            .rev()
            .fold(0, |sum, (index, val)| sum + val * (array.len() - index) as u32);
    }
    fn calc_load_up(&self) -> u32 {
        return Map::calc_load(&self.nb_rocks_per_row);
    }
    fn calc_load_left(&self) -> u32 {
        return Map::calc_load(&self.nb_rocks_per_column);
    }
}

fn parse(lines: &Vec<String>) -> Map {
    let mut nb_rocks_per_row: Vec<u32> = vec![0; lines.len()];
    let mut nb_rocks_per_column: Vec<u32> = vec![0; lines[0].len()];
    let content = lines
        .iter()
        .enumerate()
        .map(|(y, l)| {
            l.chars()
                .enumerate()
                .map(|(x, c_str)| {
                    let c: CellType = match c_str {
                        '#' => CellType::SOLID,
                        'O' => CellType::ROCK,
                        _ => CellType::EMPTY,
                    };
                    if c == CellType::ROCK {
                        nb_rocks_per_row[y] += 1;
                        nb_rocks_per_column[x] += 1;
                    }
                    return c;
                })
                .collect::<Vec<CellType>>()
        })
        .collect::<Vec<Vec<CellType>>>();
    return Map {
        content,
        height: nb_rocks_per_row.len(),
        width: nb_rocks_per_column.len(),
        nb_rocks_per_column,
        nb_rocks_per_row,
    };
}

fn run_cycle(map: &mut Map, cycle: &mut u32, result_part_1: &mut u32) {
    for dir in [Direction::UP, Direction::LEFT, Direction::DOWN, Direction::RIGHT] {
        map.tilt(&dir);
        if *cycle == 0 && dir == Direction::UP {
            *result_part_1 = map.calc_load_up()
        }
    }
    *cycle += 1;
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut map = parse(lines);
    let mut cycle = 0;
    let mut result_part_1 = 0;
    let mut history_map:FxHashMap<(u32,u32),u32> = FxHashMap::default();
    loop{
        run_cycle(&mut map,&mut cycle,&mut result_part_1);
        let key = (map.calc_load_left(),map.calc_load_up());
        if let Some(first_cycle) = history_map.get(&key){
            let loop_size = cycle - first_cycle;
            let remaining = (1_000_000_000-first_cycle)%loop_size;
            for _ in 0..remaining{
                run_cycle(&mut map, &mut cycle, &mut result_part_1);
            }
            break;
        } else {
            history_map.insert(key, cycle);
        }
    }
    check_result!(context,[result_part_1,map.calc_load_up()],[136, 108955, 64, 106689]);
}
