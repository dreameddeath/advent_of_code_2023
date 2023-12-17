use std::{cell::RefCell, rc::Rc};

use crate::{
    check_result,
    map2d::{Direction, DirectionAny, Map2D, Pos, TurnType, Vec2D},
    utils::Context,
};
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum CellType {
    Vertical,
    Horizontal,
    CornerBottomLeft,
    CornerBottomRight,
    CornerTopRight,
    CornerTopLeft,
    Empty,
    Start,
}

impl CellType {
    fn dir_to_explore(&self) -> [&Direction; 2] {
        match self {
            CellType::Horizontal => [&Direction::LEFT, &Direction::RIGHT],
            CellType::Vertical => [&Direction::DOWN, &Direction::UP],
            CellType::CornerBottomLeft => [&Direction::RIGHT, &Direction::UP],
            CellType::CornerBottomRight => [&Direction::LEFT, &Direction::UP],
            CellType::CornerTopLeft => [&Direction::RIGHT, &Direction::DOWN],
            CellType::CornerTopRight => [&Direction::LEFT, &Direction::DOWN],
            _ => panic!("Nothing to explore from {:?}", *self),
        }
    }

    fn inner_dir(&self) -> &DirectionAny {
        match self {
            CellType::CornerBottomLeft => &DirectionAny::UP_RIGHT,
            CellType::CornerBottomRight => &DirectionAny::UP_LEFT,
            CellType::CornerTopLeft => &DirectionAny::DOWN_RIGHT,
            CellType::CornerTopRight => &DirectionAny::DOWN_LEFT,
            _ => panic!("Should not be called"),
        }
    }

    fn outer_directions(&self) -> [&DirectionAny; 3] {
        match self {
            CellType::CornerBottomLeft => [&DirectionAny::DOWN_LEFT, &DirectionAny::LEFT, &DirectionAny::DOWN],
            CellType::CornerBottomRight => [&DirectionAny::DOWN_RIGHT, &DirectionAny::RIGHT, &DirectionAny::DOWN],
            CellType::CornerTopLeft => [&DirectionAny::UP_LEFT, &DirectionAny::LEFT, &DirectionAny::UP],
            CellType::CornerTopRight => [&DirectionAny::UP_RIGHT, &DirectionAny::RIGHT, &DirectionAny::UP],
            _ => panic!("Should not be called"),
        }
    }

    fn side_dir(&self, vec: Vec2D, is_globally_clock_wise: bool) -> &DirectionAny {
        match self {
            CellType::Vertical => match is_globally_clock_wise {
                true if vec.y >= 0 => &DirectionAny::LEFT,
                true => &DirectionAny::RIGHT,
                false if vec.y >= 0 => &DirectionAny::RIGHT,
                false => &DirectionAny::LEFT,
            },
            CellType::Horizontal => match is_globally_clock_wise {
                true if vec.x >= 0 => &DirectionAny::DOWN,
                true => &DirectionAny::UP,
                false if vec.x >= 0 => &DirectionAny::UP,
                false => &DirectionAny::DOWN,
            },
            _ => panic!("Should not be called"),
        }
    }

    fn is_to_explore(&self) -> bool {
        !(*self == CellType::Empty || *self == CellType::Start)
    }

    fn map(c: char) -> CellType {
        match c {
            '|' => CellType::Vertical,
            '-' => CellType::Horizontal,
            'L' => CellType::CornerBottomLeft,
            'J' => CellType::CornerBottomRight,
            '7' => CellType::CornerTopRight,
            'F' => CellType::CornerTopLeft,
            '.' => CellType::Empty,
            'S' => CellType::Start,
            _ => panic!("Unknown cell type {}", c),
        }
    }

    fn can_come_from_start(&self, world: &World, pos: &Pos) -> bool {
        self.dir_to_explore()
            .iter()
            .filter_map(|dir| world.map.move_pos(pos, dir))
            .any(|pos| world.map.get(&pos).c_type == CellType::Start)
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum CellFillType {
    None,
    Filled,
    Border,
}

struct Cell {
    c_type: CellType,
    fill_type: CellFillType,
}

struct World {
    map: Map2D<Cell>,
    start: Pos,
}

impl World {
    fn mark_as_border(&mut self, pos: &Pos) {
        self.map.get_mut(pos).fill_type = CellFillType::Border
    }


    fn flood_fill(&mut self, pos: &Pos) -> u32 {
        if let Some(cell) = self.map.get_mut_opt(pos) {
            if cell.fill_type != CellFillType::None {
                return 0;
            }
            cell.fill_type=CellFillType::Filled;
        } else {
            return 0
        }
        let mut sum = 0;
        let next_positions:Vec<Pos> = Direction::ALL_DIRECTIONS_CLOCKWISE.iter()
            .filter_map(|dir| self.map.move_pos(pos, &dir))
            .collect();
        for next_pos in next_positions.iter() {
            sum += self.flood_fill(&next_pos);
        }
        return sum + 1;
    }
}

fn parse(lines: &Vec<String>) -> World {
    let mut start = Pos { x: 0, y: 0 };
    let content = lines
        .iter()
        .enumerate()
        .map(|(y, l)| {
            l.chars()
                .enumerate()
                .map(|(x, c)| {
                    let cell_type = CellType::map(c);
                    if cell_type == CellType::Start {
                        start.x = x;
                        start.y = y;
                    }
                    Cell {
                        c_type: cell_type,
                        fill_type: CellFillType::None,
                    }
                })
                .collect::<Vec<Cell>>()
        })
        .collect();
    return World {
        map: Map2D::new(content),
        start,
    };
}

struct LoopInfo {
    all_cells: Rc<RefCell<Vec<Pos>>>,
    total_positive_turns: i32,
}

enum FindLoopRes {
    Found(LoopInfo),
    ToExplore(Vec<LoopInfo>),
}

fn explore_one_more_for_loop<'a>(world: &World, curr_loop: &mut LoopInfo) -> Option<LoopInfo> {
    let curr_pos = curr_loop.all_cells.borrow()[curr_loop.all_cells.borrow().len() - 1].clone();
    let previous_pos = curr_loop.all_cells.borrow()[curr_loop.all_cells.borrow().len() - 2].clone();
    let curr_cell = world.map.get(&curr_pos);
    let next_opt = curr_cell
        .c_type
        .dir_to_explore()
        .iter()
        .filter_map(|dir| {
            world
                .map
                .move_pos(&curr_pos, dir)
                .filter(|next_pos| !next_pos.eq(&previous_pos) && world.map.get_opt(&next_pos).filter(|cell| cell.c_type.is_to_explore()).is_some())
        })
        .last();
    if let Some(next) = next_opt {
        curr_loop.all_cells.borrow_mut().push(next);

        Some(LoopInfo {
            all_cells: curr_loop.all_cells.clone(),
            total_positive_turns: curr_loop.total_positive_turns
                + match curr_pos.calc_turn_type(&previous_pos, &next) {
                    TurnType::ClockWise(_) => 1,
                    TurnType::CounterClockWise(_) => -1,
                    TurnType::Strait | TurnType::Opposite => 0,
                },
        })
    } else {
        None
    }
}

fn explore_one_more(map: &World, possible_loops: &mut Vec<LoopInfo>) -> FindLoopRes {
    let next_loop_infos = possible_loops
        .iter_mut()
        .filter_map(|loop_info| explore_one_more_for_loop(map, loop_info))
        .collect::<Vec<LoopInfo>>();
    if next_loop_infos.len() <= 1 {
        panic!("Not enough loops")
    }

    let mut found_results = None;

    'outer_loop: for (index, loop_info) in next_loop_infos.iter().enumerate() {
        let last_curr = loop_info.all_cells.borrow().last().unwrap().clone();

        for (other_i, other_loop) in next_loop_infos.iter().enumerate().skip(index + 1) {
            let other_last = other_loop.all_cells.borrow().last().unwrap().clone();
            if last_curr.eq(&other_last) {
                found_results = Some((index, other_i));
                break 'outer_loop;
            }
        }
    }
    if let Some((i1, i2)) = found_results {
        let first = &next_loop_infos[i1];
        let second = &next_loop_infos[i2];
        let mut all_cells: Vec<Pos> = Vec::with_capacity(first.all_cells.borrow().capacity() + second.all_cells.borrow().capacity());
        all_cells.extend(first.all_cells.borrow().iter());
        all_cells.extend(second.all_cells.borrow().iter().skip(1).rev().skip(1));
        let nb_positive_turn = first.total_positive_turns - second.total_positive_turns;

        return FindLoopRes::Found(LoopInfo {
            all_cells: Rc::new(RefCell::new(all_cells)),
            total_positive_turns: nb_positive_turn,
        });
    } else {
        return FindLoopRes::ToExplore(next_loop_infos);
    }
}

fn find_loop(world: &World) -> LoopInfo {
    let mut curr_loops = Direction::ALL_DIRECTIONS_CLOCKWISE
        .iter()
        .filter_map(|dir| {
            world
                .map
                .move_pos(&world.start, dir)
                .filter(|pos| {
                    world
                        .map
                        .get_opt(&pos)
                        .filter(|c| c.c_type.is_to_explore() && c.c_type.can_come_from_start(world, &pos))
                        .is_some()
                })
                .map(|pos| LoopInfo {
                    total_positive_turns: 0,
                    all_cells: Rc::new(RefCell::new(vec![
                        Pos {
                            x: world.start.x,
                            y: world.start.y,
                        },
                        pos,
                    ])),
                })
        })
        .collect::<Vec<LoopInfo>>();

    loop {
        match explore_one_more(world, &mut curr_loops) {
            FindLoopRes::ToExplore(next_loops) => {
                curr_loops = next_loops;
            }
            FindLoopRes::Found(result) => return result,
        }
    }
}

#[derive(Debug, PartialEq, Eq)]
enum PartToFill {
    InnerCorner,
    OuterCorner,
    Side,
}

fn get_to_fill(window: &[Pos], is_globally_clock_wise: bool) -> PartToFill {
    let turn_type = window[1].calc_turn_type(&window[0], &window[2]);
    match turn_type {
        TurnType::Strait | TurnType::Opposite => PartToFill::Side,
        TurnType::ClockWise(_) if is_globally_clock_wise => PartToFill::InnerCorner,
        TurnType::CounterClockWise(_) if !is_globally_clock_wise => PartToFill::InnerCorner,
        _ => PartToFill::OuterCorner,
    }
}

fn fill_direction(world: &mut World, pos: &Pos, direction: &DirectionAny) -> u32 {
    if let Some(next_pos) = world.map.move_pos_anydir(pos, &direction) {
        world.flood_fill(&next_pos)
    } else {
        0
    }
}

fn fill(world: &mut World, window: &[Pos], is_globally_clock_wise: bool) -> u32 {
    let curr = &window[1];
    let curr_type = world.map.get(curr).c_type;
    let to_fill = get_to_fill(window, is_globally_clock_wise);
    match to_fill {
        PartToFill::Side => fill_direction(
            world,
            curr,
            curr_type.side_dir(Vec2D::new(&window[0], &window[1]), is_globally_clock_wise),
        ),
        PartToFill::InnerCorner => fill_direction(world, curr, curr_type.inner_dir()),
        PartToFill::OuterCorner => curr_type
            .outer_directions()
            .iter()
            .map(|dir| fill_direction(world, curr, &dir))
            .sum(),
    }
}

fn mark_borders(map: &mut World, loop_info: &LoopInfo) {
    loop_info.all_cells.borrow().iter().for_each(|p| map.mark_as_border(p));
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut map = parse(lines);
    let loop_info = find_loop(&map);
    let distance_end_loop = (loop_info.all_cells.borrow().len() as u32).div_euclid(2);

    mark_borders(&mut map, &loop_info);
    let filled = loop_info
        .all_cells
        .borrow()
        .windows(3)
        .map(|window| fill(&mut map, window, loop_info.total_positive_turns > 0))
        .sum();
    check_result!(context, [distance_end_loop, filled], [80, 6909, 10, 461]);
}
