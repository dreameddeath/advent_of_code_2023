use std::{cell::RefCell, rc::Rc};

use crate::{check_result, utils::Context};
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
    fn dir_to_explore(&self) -> [&DirectionInfo; 2] {
        match self {
            CellType::Horizontal => [&LEFT, &RIGHT],
            CellType::Vertical => [&BOTTOM, &TOP],
            CellType::CornerBottomLeft => [&RIGHT, &TOP],
            CellType::CornerBottomRight => [&LEFT, &TOP],
            CellType::CornerTopLeft => [&RIGHT, &BOTTOM],
            CellType::CornerTopRight => [&LEFT, &BOTTOM],
            _ => panic!("Nothing to explore from {:?}", *self),
        }
    }

    fn inner_dir(&self) -> DirectionInfo {
        match self {
            CellType::CornerBottomLeft => TOP_RIGHT,
            CellType::CornerBottomRight => TOP_LEFT,
            CellType::CornerTopLeft => BOTTOM_RIGHT,
            CellType::CornerTopRight => BOTTOM_LEFT,
            _ => panic!("Should not be called"),
        }
    }

    fn outer_directions(&self) -> [DirectionInfo; 3] {
        match self {
            CellType::CornerBottomLeft => [LEFT, BOTTOM_LEFT, BOTTOM],
            CellType::CornerBottomRight => [RIGHT, BOTTOM_RIGHT, BOTTOM],
            CellType::CornerTopLeft => [LEFT, TOP_LEFT, TOP],
            CellType::CornerTopRight => [RIGHT, TOP_RIGHT, TOP],
            _ => panic!("Should not be called"),
        }
    }

    fn side_dir(&self, vec: (&Pos, &Pos), is_globally_clock_wise: bool) -> DirectionInfo {
        let delta_x = vec.1.x as isize - vec.0.x as isize;
        let delta_y = vec.1.y as isize - vec.0.y as isize;
        match self {
            CellType::Vertical => match is_globally_clock_wise {
                true if delta_y >= 0 => LEFT,
                true => RIGHT,
                false if delta_y >= 0 => RIGHT,
                false => LEFT,
            },
            CellType::Horizontal => match is_globally_clock_wise {
                true if delta_x >= 0 => BOTTOM,
                true => TOP,
                false if delta_x >= 0 => TOP,
                false => BOTTOM,
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
            _ => panic!("Unknown cell {}", c),
        }
    }

    fn map_to_c(&self) -> char {
        match self {
            CellType::Vertical => '|',
            CellType::Horizontal => '-',
            CellType::CornerBottomLeft => 'L',
            CellType::CornerBottomRight => 'J',
            CellType::CornerTopRight => '7',
            CellType::CornerTopLeft => 'F',
            CellType::Empty => '.',
            CellType::Start => 'S',
        }
    }

    fn can_come_from_start(&self, map: &Map, pos: &Pos) -> bool {
        for orig_dir in self.dir_to_explore(){
            if let Some(orig_pos) = pos.move_by(orig_dir) {
                if let Some(orig_cell) = map.get(&orig_pos) {
                    if orig_cell.c_type==CellType::Start {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum CellFillType {
    None,
    Filled,
    Border,
}

#[derive(Clone, Copy)]
struct Cell {
    c_type: CellType,
    fill_type: CellFillType,
}

struct Map {
    width: usize,
    height: usize,
    content: Vec<Cell>,
    start: Pos,
}

impl Map {
    fn get(&self, pos: &Pos) -> Option<&Cell> {
        self.get_index(pos).map(|i| &self.content[i])
    }

    fn get_index(&self, pos: &Pos) -> Option<usize> {
        if pos.x >= self.width || pos.y >= self.height {
            return None;
        }
        return Some(pos.y * self.width + pos.x);
    }

    fn mark_as_border(&mut self, pos: &Pos) {
        let pos = self.get_index(pos).unwrap();
        self.content[pos].fill_type = CellFillType::Border;
    }

    fn fill(&mut self, pos: &Pos) -> bool {
        self.get_index(pos)
            .map(|pos| &mut self.content[pos])
            .filter(|c| c.fill_type == CellFillType::None)
            .map(|c| {
                c.fill_type = CellFillType::Filled;
                return c;
            })
            .is_some()
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
struct Pos {
    x: usize,
    y: usize,
}

enum TurnType {
    Strait,
    Positive,
    Negative,
}

impl Pos {
    fn move_by(&self, dir: &DirectionInfo) -> Option<Pos> {
        self.x
            .checked_add_signed(dir.0)
            .and_then(|x| self.y.checked_add_signed(dir.1).map(|y| Pos { x, y }))
    }

    fn turn_type(&self, before: &Pos, next: &Pos) -> TurnType {
        let vect_prod = (self.x as isize - before.x as isize)
            * ((next.y as isize - self.y as isize) * -1)
            - ((self.y as isize - before.y as isize) * -1) * (next.x as isize - self.x as isize);

        if vect_prod == 0 {
            TurnType::Strait
        } else if vect_prod > 0 {
            TurnType::Negative
        } else {
            TurnType::Positive
        }
    }
}

type DirectionInfo = (isize, isize);

const TOP: DirectionInfo = (0, -1);
const BOTTOM: DirectionInfo = (0, 1);
const LEFT: DirectionInfo = (-1, 0);
const RIGHT: DirectionInfo = (1, 0);
const BOTTOM_LEFT: DirectionInfo = (LEFT.0, BOTTOM.1);
const BOTTOM_RIGHT: DirectionInfo = (RIGHT.0, BOTTOM.1);
const TOP_LEFT: DirectionInfo = (LEFT.0, TOP.1);
const TOP_RIGHT: DirectionInfo = (RIGHT.0, TOP.1);

fn parse(lines: &Vec<String>) -> Map {
    let width = lines[0].len();
    let height = lines.len();
    let mut start = Pos { x: 0, y: 0 };
    let content = lines
        .iter()
        .enumerate()
        .flat_map(|(y, l)| {
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
    return Map {
        width,
        height,
        content,
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

fn explore_one_more_for_loop<'a>(map: &Map, curr_loop: &mut LoopInfo) -> Option<LoopInfo> {
    let curr_pos = curr_loop.all_cells.borrow()[curr_loop.all_cells.borrow().len() - 1].clone();
    let previous_pos = curr_loop.all_cells.borrow()[curr_loop.all_cells.borrow().len() - 2].clone();
    let curr_cell = map.get(&curr_pos).unwrap();
    let next_opt = curr_cell
        .c_type
        .dir_to_explore()
        .iter()
        .filter_map(|dir| {
            curr_pos.move_by(dir).filter(|next_pos| {
                !next_pos.eq(&previous_pos)
                    && map
                        .get(&next_pos)
                        .filter(|cell| cell.c_type.is_to_explore())
                        .is_some()
            })
        })
        .last();
    if let Some(next) = next_opt {
        curr_loop.all_cells.borrow_mut().push(next);
    
        Some(LoopInfo {
            all_cells: curr_loop.all_cells.clone(),
            total_positive_turns: curr_loop.total_positive_turns
                + match curr_pos.turn_type(&previous_pos, &next) {
                    TurnType::Positive => 1,
                    TurnType::Negative => -1,
                    TurnType::Strait => 0,
                },
        })
    } else {
        None
    }
}

fn debug_print_map(prefix: &str, orig_map: &Map, possible_loop: &LoopInfo) {
    let mut map = Map {
        content: orig_map.content.iter().map(|c| c.clone()).collect(),
        height: orig_map.height,
        width: orig_map.width,
        start: orig_map.start,
    };

    mark_borders(&mut map, possible_loop);
    println!("{}\n{}", prefix, to_string(&map));
}

fn debug_print(orig_map: &Map, possibles_loop: &Vec<LoopInfo>) {
    debug_print_map("Prop [1]", orig_map, &possibles_loop[0]);
    debug_print_map("Prop [2]", orig_map, &possibles_loop[1]);
}

fn explore_one_more(map: &Map, possible_loops: &mut Vec<LoopInfo>) -> FindLoopRes {
    let next_loop_infos = possible_loops
        .iter_mut()
        .filter_map(|loop_info| explore_one_more_for_loop(map, loop_info))
        .collect::<Vec<LoopInfo>>();
    if next_loop_infos.len() <= 1 {
        debug_print(map, possible_loops);
        panic!("Not enough loops")
    }
    let mut found_results = None;
    'outer_loop:for (index, loop_info) in next_loop_infos.iter().enumerate() {
        let last_curr = loop_info.all_cells.borrow().last().unwrap().clone();
        
        for (other_i,other_loop) in next_loop_infos.iter().enumerate().skip(index+1) {
            let other_last = other_loop.all_cells.borrow().last().unwrap().clone();
            if last_curr.eq(&other_last) {
                found_results = Some((index,other_i));
                break 'outer_loop;
            }
        }
    }
    if let Some((i1,i2)) = found_results {
        let first = &next_loop_infos[i1];
        let second = &next_loop_infos[i2];
        let mut all_cells:Vec<Pos> =  Vec::with_capacity(first.all_cells.borrow().capacity()+second.all_cells.borrow().capacity());
        all_cells.extend(first.all_cells.borrow().iter());
        all_cells.extend(second.all_cells.borrow().iter().skip(1).rev().skip(1));
        let nb_positive_turn = first.total_positive_turns - second.total_positive_turns;
        
        return FindLoopRes::Found(LoopInfo {
            all_cells: Rc::new(RefCell::new(all_cells)),
            total_positive_turns: nb_positive_turn,
        })
    } else {
        return FindLoopRes::ToExplore(next_loop_infos);
    }

    
    
}

fn find_loop(map: &Map) -> LoopInfo {
    let mut curr_loops = [BOTTOM, TOP, LEFT, RIGHT]
        .iter()
        .filter_map(|dir| {
            map.start
                .move_by(dir)
                .filter(|pos| map.get(&pos).filter(|c| 
                        c.c_type.is_to_explore() && 
                        c.c_type.can_come_from_start(map,&pos)).is_some()
                    )
                .map(|pos| LoopInfo {
                    total_positive_turns: 0,
                    all_cells: Rc::new(RefCell::new(vec![
                        Pos {
                            x: map.start.x,
                            y: map.start.y,
                        },
                        pos,
                    ])),
                })
        })
        .collect::<Vec<LoopInfo>>();

    loop {
        match explore_one_more(map, &mut curr_loops) {
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
    let turn_type = window[1].turn_type(&window[0], &window[2]);
    match turn_type {
        TurnType::Strait => PartToFill::Side,
        TurnType::Positive if is_globally_clock_wise => PartToFill::InnerCorner,
        TurnType::Negative if !is_globally_clock_wise => PartToFill::InnerCorner,
        _ => PartToFill::OuterCorner,
    }
}

fn fill_direction(map: &mut Map, pos: &Pos, direction: &DirectionInfo) -> u32 {
    if let Some(next_pos) = &pos.move_by(&direction) {
        let done = map.fill(next_pos);
        if !done {
            return 0;
        }
        return 1
            + fill_direction(map, next_pos, &TOP)
            + fill_direction(map, next_pos, &BOTTOM)
            + fill_direction(map, next_pos, &LEFT)
            + fill_direction(map, next_pos, &RIGHT);
    }
    return 0;
}

fn fill(map: &mut Map, window: &[Pos], is_globally_clock_wise: bool) -> u32 {
    let curr = &window[1];
    let curr_type = map.get(curr).unwrap();
    let to_fill = get_to_fill(window, is_globally_clock_wise);
    match to_fill {
        PartToFill::Side => fill_direction(
            map,
            curr,
            &curr_type
                .c_type
                .side_dir((&window[0], &window[2]), is_globally_clock_wise),
        ),
        PartToFill::InnerCorner => fill_direction(map, curr, &curr_type.c_type.inner_dir()),
        PartToFill::OuterCorner => curr_type
            .c_type
            .outer_directions()
            .iter()
            .map(|dir| fill_direction(map, curr, &dir))
            .sum(),
    }
}

fn to_string(map: &Map) -> String {
    map.content
        .chunks(map.width)
        .map(|cells| {
            cells
                .iter()
                .map(|c| match c.fill_type {
                    CellFillType::Border => c.c_type.map_to_c(),
                    CellFillType::Filled => '#',
                    CellFillType::None => '.',
                })
                .collect::<String>()
        })
        .collect::<Vec<String>>()
        .join("\n")
}

fn print_map(context: &Context, map: &Map) {
    if !context.is_debug() {
        return;
    }

    println!("Map:\n{}", to_string(map));
}

fn mark_borders(map: &mut Map, loop_info: &LoopInfo) {
    loop_info
        .all_cells
        .borrow()
        .iter()
        .for_each(|p| map.mark_as_border(p));
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut map = parse(lines);
    let loop_info = find_loop(&map);

    mark_borders(&mut map, &loop_info);

    print_map(context, &map);
    let filled = loop_info
        .all_cells
        .borrow()
        .windows(3)
        .map(|window| fill(&mut map, window, loop_info.total_positive_turns > 0))
        .sum();
    print_map(context, &map);

    check_result!(
        context,
        [
            (loop_info.all_cells.borrow().len() as u32).div_euclid(2),
            filled
        ],
        [80, 6909, 10, 461]
    );
}
