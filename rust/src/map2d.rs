use core::slice;

#[derive(Debug)]
pub struct Map2D<T> {
    content: Vec<Vec<T>>,
    width: usize,
    height: usize,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Pos {
    x: usize,
    y: usize,
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT,
}

impl Direction {
    fn opposite(&self) -> &Direction {
        match self {
            Direction::UP => &Direction::DOWN,
            Direction::DOWN => &Direction::UP,
            Direction::LEFT => &Direction::RIGHT,
            Direction::RIGHT => &Direction::LEFT,
        }
    }
}

impl<T> Map2D<T> {
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

    fn get(&self, pos: &Pos) -> &T {
        return &self.content[pos.y][pos.x];
    }

    fn get_mut(&mut self, pos: &Pos) -> &mut T {
        return &mut self.content[pos.y][pos.x];
    }

    fn set(&mut self, pos: &Pos, new_v: T) {
        self.content[pos.y][pos.x] = new_v;
    }

    fn iter_dir<'a>(&'a self, pos: &Pos, dir: Direction) -> std::iter::Map<IterPos, (&Pos,&'a T)> {
        IterPos::new(self, pos, dir).map(|pos|(&pos,&self.get(&pos)))
    }

    fn iter_mut_dir<'a>(&'a mut self, pos: &Pos, dir: &Direction) -> slice::IterMut<'a, T> {
        todo!()
    }
}

struct IterPos {
    pos: Pos,
    dir: Direction,
    width: usize,
    height: usize,
}

impl IterPos {
    pub fn new<T>(map: &Map2D<T>, pos: &Pos, dir: Direction)->IterPos {
        IterPos {
            pos: Pos { x: pos.x, y: pos.y },
            dir,
            width: map.width,
            height: map.height,
        }
    }
}

impl Iterator for IterPos {
    type Item = Pos;

    fn next(&mut self) -> Option<Self::Item> {
        let pos = self.pos;
        let result = match self.dir {
            Direction::DOWN => {
                if self.pos.y < (self.height - 1) {
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
        };
        if result.is_some() {
            self.pos.x = result.unwrap().x;
            self.pos.y = result.unwrap().y;
        }
        return result;
    }
}
