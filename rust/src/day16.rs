use std::hash::Hasher;

use rustc_hash::FxHashSet;

use crate::{
    check_result, log,
    map2d::{Direction, Map2D, Pos},
    utils::Context,
};

#[derive(Debug, PartialEq, Eq)]
enum CellType {
    MirrorSlash,
    MirrorBackslash,
    SplitterHorizontal,
    SplitterVertical,
    Empty,
}

impl CellType {
    fn from_char(c: char) -> CellType {
        match c {
            '/' => CellType::MirrorSlash,
            '\\' => CellType::MirrorBackslash,
            '-' => CellType::SplitterHorizontal,
            '|' => CellType::SplitterVertical,
            '.' => CellType::Empty,
            _ => panic!("Cannot map {}", c),
        }
    }

    fn next_dirs(&self, orig_dir: &Direction) -> Vec<Direction> {
        match self {
            CellType::SplitterVertical => match orig_dir {
                Direction::DOWN => vec![Direction::DOWN],
                Direction::UP => vec![Direction::UP],
                Direction::LEFT | Direction::RIGHT => vec![Direction::DOWN, Direction::UP],
            },
            CellType::SplitterHorizontal => match orig_dir {
                Direction::DOWN | Direction::UP => vec![Direction::LEFT, Direction::RIGHT],
                Direction::LEFT => vec![Direction::LEFT],
                Direction::RIGHT => vec![Direction::RIGHT],
            },
            CellType::MirrorBackslash => match orig_dir {
                Direction::DOWN => vec![Direction::RIGHT],
                Direction::LEFT => vec![Direction::UP],
                Direction::RIGHT => vec![Direction::DOWN],
                Direction::UP => vec![Direction::LEFT],
            },
            CellType::MirrorSlash => match orig_dir {
                Direction::DOWN => vec![Direction::LEFT],
                Direction::LEFT => vec![Direction::DOWN],
                Direction::RIGHT => vec![Direction::UP],
                Direction::UP => vec![Direction::RIGHT],
            },
            CellType::Empty => panic!("Should not occurs"),
        }
    }
}

#[derive(Debug)]
struct Cell {
    c_type: CellType,
    potential_rays: [Option<Ray>; 4], //To Directions UP, DOWN, LEFT, RIGHT
}

impl Cell {
    fn get_potential_ray_pos(dir: &Direction) -> usize {
        match dir {
            Direction::UP => 0,
            Direction::DOWN => 1,
            Direction::LEFT => 2,
            Direction::RIGHT => 3,
        }
    }

    fn get_potential_ray<'a>(&'a self, dir: &Direction) -> Option<&'a Ray> {
        self.potential_rays[Cell::get_potential_ray_pos(dir)].as_ref()
    }

    fn build_applicable_rays(&self, map: &Map2D<Cell>, pos: &Pos) -> [Option<Ray>; 4] {
        match self.c_type {
            CellType::Empty => [
                if map.is_down_border(pos) {
                    Ray::new_ray(map, pos, &Direction::UP)
                } else {
                    None
                },
                if map.is_up_border(pos) {
                    Ray::new_ray(map, pos, &Direction::DOWN)
                } else {
                    None
                },
                if map.is_right_border(pos) {
                    Ray::new_ray(map, pos, &Direction::LEFT)
                } else {
                    None
                },
                if map.is_left_border(pos) {
                    Ray::new_ray(map, pos, &Direction::RIGHT)
                } else {
                    None
                },
            ],
            CellType::MirrorBackslash | CellType::MirrorSlash => [
                Ray::new_ray(map, pos, &Direction::UP),
                Ray::new_ray(map, pos, &Direction::DOWN),
                Ray::new_ray(map, pos, &Direction::LEFT),
                Ray::new_ray(map, pos, &Direction::RIGHT),
            ],
            CellType::SplitterVertical => [
                Ray::new_ray(map, pos, &Direction::UP),
                Ray::new_ray(map, pos, &Direction::DOWN),
                None,
                None,
            ],
            CellType::SplitterHorizontal => [
                None,
                None,
                Ray::new_ray(map, pos, &Direction::LEFT),
                Ray::new_ray(map, pos, &Direction::RIGHT),
            ],
        }
    }
}

#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
enum ToMark {
    Vertical(Pos, usize),
    Horizontal(Pos, usize),
}

impl ToMark {
    fn new(pos_a: &Pos, pos_b: &Pos) -> ToMark {
        if pos_a.x == pos_b.x {
            let delta_y = pos_a.y.abs_diff(pos_b.y) + 1;
            if pos_a.y < pos_b.y {
                ToMark::Vertical(pos_a.clone(), delta_y)
            } else {
                ToMark::Vertical(pos_b.clone(), delta_y)
            }
        } else {
            let delta_x = pos_a.x.abs_diff(pos_b.x) + 1;
            if pos_a.x < pos_b.x {
                ToMark::Horizontal(pos_a.clone(), delta_x)
            } else {
                ToMark::Horizontal(pos_b.clone(), delta_x)
            }
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
struct Ray {
    start_pos: Pos,
    dir: Direction,
    end_pos: Pos,
    is_outgoing: bool,
    to_mark: ToMark,
}

impl std::hash::Hash for Ray {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.start_pos.hash(state);
        self.dir.hash(state);
    }
}

impl Ray {
    fn new_ray(map: &Map2D<Cell>, pos: &Pos, dir: &Direction) -> Option<Ray> {
        let target_pos = map
            .iter_dir(*pos, *dir, false)
            .skip_while(|curr_pos| map.get(curr_pos).c_type == CellType::Empty)
            .nth(0)
            .unwrap_or_else(|| map.move_to_border(pos, dir));

        if target_pos == *pos {
            return None;
        } else {
            return Some(Ray {
                to_mark: ToMark::new(&pos, &target_pos),
                dir: *dir,
                start_pos: *pos,
                end_pos: target_pos,
                is_outgoing: map.get(&target_pos).c_type == CellType::Empty,
            });
        }
    }
}

type InputMap = Map2D<Cell>;

fn parse(lines: &Vec<String>) -> InputMap {
    let content = lines
        .iter()
        .map(|l| {
            l.chars()
                .map(|c| Cell {
                    c_type: CellType::from_char(c),
                    potential_rays: [None; 4],
                })
                .collect::<Vec<Cell>>()
        })
        .collect::<Vec<Vec<Cell>>>();

    let mut map = Map2D::new(content);
    for any_pos in map.iter_all_fast() {
        let rays = map.get(&any_pos).build_applicable_rays(&map, &any_pos);
        map.get_mut(&any_pos).potential_rays = rays;
    }
    return map;
}

struct Solution<'a> {
    casted_rays: FxHashSet<&'a Ray>,
    marks: FxHashSet<&'a ToMark>,
}

fn non_empty_cell_next_dirs<'a>(cell: &'a Cell, orig_dir: &Direction) -> Vec<&'a Ray> {
    cell.c_type
        .next_dirs(orig_dir)
        .iter()
        .filter_map(|dir| cell.get_potential_ray(dir))
        .collect()
}

fn manage_ray_cast<'a>(map: &'a InputMap, ray: &'a Ray, sol: &mut Solution<'a>) -> Vec<&'a Ray> {
    if sol.casted_rays.contains(&ray) {
        return vec![];
    }
    sol.marks.insert(&ray.to_mark);
    sol.casted_rays.insert(&ray);
    if ray.is_outgoing {
        return vec![];
    }
    let cell = map.get(&ray.end_pos);

    return non_empty_cell_next_dirs(cell, &ray.dir);
}

fn to_string(resulting: &Map2D<u32>) -> String {
    resulting
        .get_content()
        .iter()
        .map(|l| l.iter().map(|v| if *v > 0 { '#' } else { '.' }).collect::<String>())
        .collect::<Vec<String>>()
        .join("\n")
}

fn solve(map: &InputMap, start_pos: Pos, dir: &Direction, context: &Context) -> usize {
    let mut solution = Solution {
        casted_rays: FxHashSet::default(),
        marks: FxHashSet::default(),
    };

    let mut next_to_process: Vec<&Ray> = vec![];
    let start_cell = map.get(&start_pos);
    match start_cell.c_type {
        CellType::Empty => next_to_process.push(start_cell.get_potential_ray(dir).unwrap()),
        _ => next_to_process.append(&mut non_empty_cell_next_dirs(start_cell, dir)),
    }

    while let Some(ray) = next_to_process.pop() {
        let mut new_rays = manage_ray_cast(map, ray, &mut solution);
        next_to_process.append(&mut new_rays);
    }

    let mut resulting_marked = Map2D::new(vec![vec![0; map.width()]; map.height()]);
    for to_mark in solution.marks {
        match to_mark {
            ToMark::Horizontal(pos, size) => resulting_marked
                .iter_dir(*pos, Direction::RIGHT, true)
                .take(*size)
                .for_each(|pos_to_mark| *resulting_marked.get_mut(&pos_to_mark) += 1),
            ToMark::Vertical(pos, size) => resulting_marked
                .iter_dir(*pos, Direction::DOWN, true)
                .take(*size)
                .for_each(|pos_to_mark| *resulting_marked.get_mut(&pos_to_mark) += 1),
        }
    }
    if context.is_debug() {
        log!(debug, context, "Result Map\n{}", to_string(&resulting_marked))
    }
    return resulting_marked.iter_all_fast().filter(|pos| *resulting_marked.get(pos) > 0).count();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let map = parse(lines);
    let result_part1 = solve(&map, Pos { x: 0, y: 0 }, &Direction::RIGHT, context);
    let mut max_result = result_part1;

    for x in 0..map.width() {
        if x != 0 {
            max_result = max_result.max(solve(&map, Pos { x, y: 0 }, &Direction::DOWN, context));
        }
        max_result = max_result.max(solve(&map, Pos { x, y: map.height()-1 }, &Direction::UP, context));
    }

    for y in 1..map.height()-1 {    
        max_result = max_result.max(solve(&map, Pos { x:0, y }, &Direction::RIGHT, context));
        max_result = max_result.max(solve(&map, Pos { x:map.width()-1, y }, &Direction::LEFT, context));
    }


    check_result!(context, [result_part1, max_result], [46, 7951, 51, 8148]);
}
