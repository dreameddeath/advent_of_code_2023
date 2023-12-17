#![allow(unused)]

use std::ops::{Add, RangeInclusive, Sub};

#[derive(Debug, PartialEq, Eq, Clone, Copy, Hash)]
pub struct Pos {
    pub x: usize,
    pub y: usize,
}

impl Pos {
    pub fn move_pos(&self, dir: &Direction, height: usize, width: usize) -> Option<Pos> {
        match dir {
            Direction::DOWN => {
                if self.y < (height - 1) {
                    Some(Pos { x: self.x, y: self.y + 1 })
                } else {
                    None
                }
            }
            Direction::UP => {
                if self.y > 0 {
                    Some(Pos { x: self.x, y: self.y - 1 })
                } else {
                    None
                }
            }
            Direction::LEFT => {
                if self.x > 0 {
                    Some(Pos { x: self.x - 1, y: self.y })
                } else {
                    None
                }
            }
            Direction::RIGHT => {
                if self.x < (width - 1) {
                    Some(Pos { x: self.x + 1, y: self.y })
                } else {
                    None
                }
            }
        }
    }

    pub fn move_multiple_pos(&self, dirs: &[Direction], height: usize, width: usize) -> Option<Pos> {
        let mut curr_pos = Pos { x: self.x, y: self.y };
        for dir in dirs {
            if let Some(new_pos) = self.move_pos(dir, height, width) {
                curr_pos.x = new_pos.x;
                curr_pos.y = new_pos.y;
            } else {
                return None;
            }
        }
        return None;
    }

    pub fn move_pos_anydir(&self, dir_any: &DirectionAny, height: usize, width: usize) -> Option<Pos> {
        match dir_any {
            DirectionAny::Simple(dir) => self.move_pos(dir, height, width),
            DirectionAny::Diagonal(dirs) => self.move_multiple_pos(dirs, height, width),
        }
    }

    pub fn calc_turn_type(&self, before: &Pos, after: &Pos) -> TurnType {
        Vec2D::new(before, self).calc_turn_type(&Vec2D::new(self, after))
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy, Hash)]
pub enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

impl Direction {
    pub fn opposite(&self) -> &Direction {
        match self {
            Direction::UP => &Direction::DOWN,
            Direction::DOWN => &Direction::UP,
            Direction::LEFT => &Direction::RIGHT,
            Direction::RIGHT => &Direction::LEFT,
        }
    }

    pub const ALL_DIRECTIONS_CLOCKWISE: [Direction; 4] = [Direction::UP, Direction::RIGHT, Direction::DOWN, Direction::LEFT];
    pub const ALL_DIRECTIONS_COUNTER_CLOCKWISE: [Direction; 4] = [Direction::UP, Direction::LEFT, Direction::DOWN, Direction::RIGHT];

    pub fn turn_clockwise(&self) -> &Direction {
        match self {
            Direction::UP => &Direction::RIGHT,
            Direction::DOWN => &Direction::LEFT,
            Direction::LEFT => &Direction::UP,
            Direction::RIGHT => &Direction::DOWN,
        }
    }

    pub fn turn_counterclockwise(&self) -> &Direction {
        match self {
            Direction::UP => &Direction::LEFT,
            Direction::DOWN => &Direction::RIGHT,
            Direction::LEFT => &Direction::DOWN,
            Direction::RIGHT => &Direction::UP,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
pub enum DirectionAny {
    Simple(Direction),
    Diagonal([Direction; 2]),
}

impl DirectionAny {
    pub const UP_LEFT: DirectionAny = DirectionAny::Diagonal([Direction::LEFT, Direction::UP]);
    pub const UP_RIGHT: DirectionAny = DirectionAny::Diagonal([Direction::RIGHT, Direction::UP]);
    pub const DOWN_LEFT: DirectionAny = DirectionAny::Diagonal([Direction::LEFT, Direction::DOWN]);
    pub const DOWN_RIGHT: DirectionAny = DirectionAny::Diagonal([Direction::RIGHT, Direction::DOWN]);

    pub const UP: DirectionAny = DirectionAny::Simple(Direction::UP);
    pub const LEFT: DirectionAny = DirectionAny::Simple(Direction::LEFT);
    pub const DOWN: DirectionAny = DirectionAny::Simple(Direction::DOWN);
    pub const RIGHT: DirectionAny = DirectionAny::Simple(Direction::RIGHT);

    pub const ALL_DIRECTIONS_CLOCKWISE: [DirectionAny; 8] = [
        DirectionAny::UP,
        DirectionAny::UP_RIGHT,
        DirectionAny::RIGHT,
        DirectionAny::DOWN_RIGHT,
        DirectionAny::DOWN,
        DirectionAny::DOWN_LEFT,
        DirectionAny::LEFT,
        DirectionAny::UP_LEFT,
    ];
    pub const ALL_DIRECTIONS_COUNTER_CLOCKWISE: [DirectionAny; 8] = [
        DirectionAny::UP,
        DirectionAny::UP_LEFT,
        DirectionAny::LEFT,
        DirectionAny::DOWN_LEFT,
        DirectionAny::DOWN,
        DirectionAny::DOWN_RIGHT,
        DirectionAny::RIGHT,
        DirectionAny::UP_RIGHT,
    ];
}

#[derive(Debug, PartialEq, Eq)]
pub struct Vec2D {
    pub x: isize,
    pub y: isize,
}

pub enum TurnType {
    Strait,
    Opposite,
    ClockWise(isize),
    CounterClockWise(isize),
}

impl Vec2D {
    pub fn new(start: &Pos, end: &Pos) -> Vec2D {
        return Vec2D {
            x: (end.x as isize) - (start.x as isize),
            y: (end.y as isize) - (start.y as isize),
        };
    }

    fn vect_prod(&self, other: &Vec2D) -> isize {
        (self.x) * (-other.y) - (-self.y) * (other.x)
    }

    fn scalar_prod(&self, other: &Vec2D) -> isize {
        self.x * other.x + self.y * other.y
    }

    pub fn calc_turn_type(&self, other: &Vec2D) -> TurnType {
        let vect_prod = self.vect_prod(other);
        if vect_prod == 0 {
            if self.scalar_prod(other) > 0 {
                TurnType::Strait
            } else {
                TurnType::Opposite
            }
        } else if vect_prod > 0 {
            TurnType::CounterClockWise(vect_prod)
        } else {
            TurnType::ClockWise(vect_prod)
        }
    }
}

#[derive(Debug)]
pub struct Map2D<T> {
    content: Vec<Vec<T>>,
    width: usize,
    height: usize,
}

impl<T> Map2D<T> {
    pub fn new(content: Vec<Vec<T>>) -> Map2D<T> {
        return Map2D {
            height: content.len(),
            width: content[0].len(),
            content: content,
        };
    }

    pub fn get_content(&self)->&Vec<Vec<T>>{
        return &self.content;
    }

    pub fn height(&self)->usize{
        return self.height;
    }

    pub fn width(&self)->usize{
        return self.width;
    }

    pub fn move_pos(&self, pos: &Pos, dir: &Direction) -> Option<Pos> {
        pos.move_pos(dir, self.height, self.width)
    }

    pub fn move_pos_anydir(&self, pos: &Pos, dir: &DirectionAny) -> Option<Pos> {
        pos.move_pos_anydir(dir, self.height, self.width)
    }

    pub fn move_multiple_pos(&self, pos: &Pos, dir: &[Direction]) -> Option<Pos> {
        pos.move_multiple_pos(dir, self.height, self.width)
    }

    pub fn is_valid_pos(&self, pos: &Pos) -> bool {
        pos.x < self.width && pos.y < self.width
    }

    pub fn is_border(&self, pos: &Pos) -> bool {
        self.is_left_border(pos) || self.is_right_border(pos) || self.is_down_border(pos) || self.is_up_border(pos)
    }

    pub fn is_left_border(&self, pos: &Pos) -> bool {
        pos.x == 0
    }

    pub fn is_right_border(&self, pos: &Pos) -> bool {
        pos.x == self.width - 1
    }

    pub fn is_up_border(&self, pos: &Pos) -> bool {
        pos.y == 0
    }

    pub fn is_down_border(&self, pos: &Pos) -> bool {
        pos.y == self.height - 1
    }

    pub fn get_opt(&self, pos: &Pos) -> Option<&T> {
        if self.is_valid_pos(pos) {
            Some(self.get(pos))
        } else {
            None
        }
    }

    pub fn get_mut_opt(&mut self, pos: &Pos) -> Option<&mut T> {
        if self.is_valid_pos(pos) {
            Some(self.get_mut(pos))
        } else {
            None
        }
    }

    pub fn get(&self, pos: &Pos) -> &T {
        return &self.content[pos.y][pos.x];
    }

    pub fn get_mut(&mut self, pos: &Pos) -> &mut T {
        return &mut self.content[pos.y][pos.x];
    }

    pub fn set(&mut self, pos: &Pos, new_v: T) {
        self.content[pos.y][pos.x] = new_v;
    }

    pub fn iter_dir(&self, pos: Pos, dir: Direction, start_at_current: bool) -> IterDir {
        IterDir::new(self, pos, dir, start_at_current)
    }
    pub fn iter_all_fast(&self)->IterAll{
        self.iter_all(&[&Direction::RIGHT,&Direction::DOWN]) 
    }

    pub fn iter_all(&self, dirs: &[&Direction; 2]) -> IterAll {
        match dirs[0] {
            Direction::LEFT => match dirs[1] {
                Direction::DOWN => IterAll::new(self, false, true, true),
                Direction::UP => IterAll::new(self, false, false, true),
                _ => panic!("Cannot manage {:?}", dirs),
            },
            Direction::RIGHT => match dirs[1] {
                Direction::DOWN => IterAll::new(self, true, true, true),
                Direction::UP => IterAll::new(self, true, false, true),
                _ => panic!("Cannot manage {:?}", dirs),
            },
            Direction::DOWN => match dirs[1] {
                Direction::LEFT => IterAll::new(self, false, true, false),
                Direction::RIGHT => IterAll::new(self, true, true, false),
                _ => panic!("Cannot manage {:?}", dirs),
            },
            Direction::UP => match dirs[1] {
                Direction::LEFT => IterAll::new(self, false, false, false),
                Direction::RIGHT => IterAll::new(self, true, false, false),
                _ => panic!("Cannot manage {:?}", dirs),
            },
        }
    }

    pub(crate) fn move_to_border(&self, pos: &Pos, dir: &Direction) -> Pos {
        match dir {
            Direction::DOWN => Pos {
                x: pos.x,
                y: self.height - 1,
            },
            Direction::UP => Pos { x: pos.x, y: 0 },
            Direction::LEFT => Pos { x: 0, y: pos.y },
            Direction::RIGHT => Pos { x: self.width - 1, y: pos.y },
        }
    }
}

pub struct IterDir {
    start_at_current: bool,
    pos: Pos,
    dir: Direction,
    width: usize,
    height: usize,
}

impl IterDir {
    fn new<T>(map: &Map2D<T>, pos: Pos, dir: Direction, start_at_current: bool) -> IterDir {
        IterDir {
            start_at_current,
            pos,
            dir,
            width: map.width,
            height: map.height,
        }
    }
}

impl Iterator for IterDir {
    type Item = Pos;

    fn next(&mut self) -> Option<Self::Item> {
        if self.start_at_current {
            self.start_at_current = false;
            return Some(Pos {
                x: self.pos.x,
                y: self.pos.y,
            });
        }
        if let Some(result_pos) = self.pos.move_pos(&self.dir, self.height, self.width) {
            self.pos.x = result_pos.x;
            self.pos.y = result_pos.y;
            Some(result_pos)
        } else {
            None
        }
    }
}

pub struct IterAll {
    pos: Pos,
    is_first: bool,
    delta_x: isize,
    delta_y: isize,
    x_then_y: bool,
    width: usize,
    height: usize,
}

impl IterAll {
    pub fn new<T>(map: &Map2D<T>, is_left_right: bool, is_top_down: bool, x_then_y: bool) -> IterAll {
        let x = if is_left_right { 0 } else { map.width - 1 };
        let y = if is_top_down { 0 } else { map.height - 1 };
        return IterAll {
            delta_x: if is_left_right { 1 } else { -1 },
            delta_y: if is_top_down { 1 } else { -1 },
            is_first: true,
            height: map.height,
            width: map.width,
            pos: Pos { x, y },
            x_then_y,
        };
    }

    fn next_x(&self) -> Option<usize> {
        if let Some(new_x) = self.pos.x.checked_add_signed(self.delta_x) {
            if (new_x < self.width) {
                return Some(new_x);
            }
        }
        None
    }

    fn first_x(&self) -> usize {
        if self.delta_x < 0 {
            self.width - 1
        } else {
            0
        }
    }

    fn first_y(&self) -> usize {
        if self.delta_y < 0 {
            self.height - 1
        } else {
            0
        }
    }

    fn next_y(&self) -> Option<usize> {
        if let Some(new_y) = self.pos.y.checked_add_signed(self.delta_y) {
            if (new_y < self.width) {
                return Some(new_y);
            }
        }
        None
    }

    fn next_pos(&self) -> Option<Pos> {
        if (self.x_then_y) {
            self.next_x()
                .map(|new_x| Pos { x: new_x, y: self.pos.y })
                .or(self.next_y().map(|y| Pos { x: self.first_x(), y }))
        } else {
            self.next_y()
                .map(|new_y| Pos { x: self.pos.x, y: new_y })
                .or(self.next_x().map(|x| Pos { x, y: self.first_y() }))
        }
    }
}

impl Iterator for IterAll {
    type Item = Pos;

    fn next(&mut self) -> Option<Self::Item> {
        if self.is_first {
            self.is_first = false;
            return Some(Pos {
                x: self.pos.x,
                y: self.pos.y,
            });
        }

        if let Some(new_pos) = self.next_pos() {
            self.pos.x = new_pos.x;
            self.pos.y = new_pos.y;
            return Some(new_pos);
        } else {
            None
        }
    }
}
