use rustc_hash::FxHashMap;

use crate::{
    check_result,
    map2d::{Direction, Map2D, Pos},
    utils::Context,
};
#[derive(Debug, PartialEq, Eq)]
enum CellType {
    ROCK_,
    EMPTY,
    SOLID,
}

struct World {
    map: Map2D<CellType>,
    nb_rocks_per_row: Vec<u32>,
    nb_rocks_per_column: Vec<u32>,
}

impl World {
    fn next_empty_block(&self, pos: &Pos, dir: &Direction) -> Option<Pos> {
        self.map
            .iter_dir(*pos, *dir,true)
            .skip_while(|curr_pos|  
                self.map.move_pos(curr_pos,dir).filter(|n| 
                    *self.map.get(n) == CellType::EMPTY).is_some()
            )
            .nth(0)
            .filter(|empty_pos| empty_pos!=pos)
    }
    fn tilt_one(&mut self, pos: Pos, dir: &Direction) {
        if *self.map.get(&pos) != CellType::ROCK_ {
            return;
        }
        if let Some(new_pos) = self.next_empty_block(&pos, dir) {
            self.nb_rocks_per_row[pos.y] -= 1;
            self.nb_rocks_per_column[pos.x] -= 1;
            self.map.set(&pos, CellType::EMPTY);

            self.nb_rocks_per_row[new_pos.y] += 1;
            self.nb_rocks_per_column[new_pos.x] += 1;
            self.map.set(&new_pos, CellType::ROCK_);
        }
    }

    fn tilt(&mut self, dir: &Direction) {
        let dirs = match dir {
            Direction::UP => [&Direction::DOWN,&Direction::RIGHT],
            Direction::DOWN => [&Direction::UP,&Direction::RIGHT],
            Direction::LEFT => [&Direction::RIGHT,&Direction::DOWN],
            Direction::RIGHT => [&Direction::LEFT,&Direction::DOWN],
        };
        self.map.iter_all(&dirs).for_each(|pos|self.tilt_one(pos,dir))
    }
    fn calc_load(array: &Vec<u32>) -> u32 {
        return array
            .iter()
            .enumerate()
            .rev()
            .fold(0, |sum, (index, val)| sum + val * (array.len() - index) as u32);
    }
    fn calc_load_up(&self) -> u32 {
        return World::calc_load(&self.nb_rocks_per_row);
    }
    fn calc_load_left(&self) -> u32 {
        return World::calc_load(&self.nb_rocks_per_column);
    }
}

fn parse(lines: &Vec<String>) -> World {
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
                        'O' => CellType::ROCK_,
                        _ => CellType::EMPTY,
                    };
                    if c == CellType::ROCK_ {
                        nb_rocks_per_row[y] += 1;
                        nb_rocks_per_column[x] += 1;
                    }
                    return c;
                })
                .collect::<Vec<CellType>>()
        })
        .collect::<Vec<Vec<CellType>>>();
    return World {
        map:Map2D::new(content),
        nb_rocks_per_column,
        nb_rocks_per_row,
    };
}

fn run_cycle(map: &mut World, cycle: &mut u32, result_part_1: &mut u32) {
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
    let mut history_map: FxHashMap<(u32, u32), u32> = FxHashMap::default();
    loop {
        run_cycle(&mut map, &mut cycle, &mut result_part_1);
        let key = (map.calc_load_left(), map.calc_load_up());
        if let Some(first_cycle) = history_map.get(&key) {
            let loop_size = cycle - first_cycle;
            let remaining = (1_000_000_000 - first_cycle) % loop_size;
            for _ in 0..remaining {
                run_cycle(&mut map, &mut cycle, &mut result_part_1);
            }
            break;
        } else {
            history_map.insert(key, cycle);
        }
    }
    check_result!(context, [result_part_1, map.calc_load_up()], [136, 108955, 64, 106689]);
}
