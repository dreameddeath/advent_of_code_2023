use crate::{
    check_result, log,
    map2d::{Direction, Map2D, Pos},
    priority_queue::{Cost, Key, PriorityQueue},
    utils::{Context, Part},
};

type Input = Map2D<u8>;
fn parse(lines: &Vec<String>) -> Input {
    return Map2D::new(
        lines
            .iter()
            .map(|l| l.chars().map(|c| c.to_digit(10).unwrap() as u8).collect())
            .collect::<Vec<Vec<u8>>>(),
    );
}

#[derive(Hash, PartialEq, Eq, Clone, Copy)]
struct StateKey {
    last_pos: Pos,
    dir: Direction,
}
#[derive(Debug)]
struct StateGlobalInfo {
    width: u16,
    height: u16,
    is_part_two: bool,
}

#[derive(Debug)]
struct State<'a> {
    dir: Direction,
    last_pos: Pos,
    heat_loss: u16,
    history: Option<Vec<Pos>>,
    state_global_info: &'a StateGlobalInfo,
}

impl<'a> Cost<u16> for State<'a> {
    fn cost(&self) -> u16 {
        let last_pos = &self.last_pos;
        let direction_correction = match self.dir {
            Direction::UP | Direction::LEFT => {
                if self.state_global_info.is_part_two {
                    4 * 2
                } else {
                    1 * 2
                }
            }
            _ => 0,
        };
        return self.heat_loss
            + direction_correction
            + (self.state_global_info.height - last_pos.y as u16 - 1)
            + (self.state_global_info.width - last_pos.x as u16 - 1);
    }
}

impl<'a> Key<StateKey> for State<'a> {
    fn key(&self) -> StateKey {
        StateKey {
            last_pos: self.last_pos,
            dir: self.dir,
        }
    }
}

fn calc_new_state_v2<'a>(orig_state: &State<'a>, cumul_heat_loss: u16, pos: &Pos, dir: &Direction) -> State<'a> {
    return State {
        dir: *dir,
        last_pos: *pos,
        heat_loss: orig_state.heat_loss + cumul_heat_loss,
        state_global_info: orig_state.state_global_info,
        history: if let Some(vec) = orig_state.history.as_ref() {
            let mut new_vec = vec.clone();
            new_vec.push(pos.clone());
            Some(new_vec)
        } else {
            None
        },
    };
}

fn next_possible_states<'a>(state: &State<'a>, map: &Input, min_step: usize, max_step: usize) -> Vec<State<'a>> {
    return map
        .iter_dir(state.last_pos, state.dir, false)
        .scan(0 as u16, |cumul, pos| {
            *cumul += *map.get(&pos) as u16;
            Some((cumul.clone(), pos))
        })
        .take(max_step)
        .skip(min_step - 1)
        .flat_map(|(cumul, pos)| {
            vec![
                calc_new_state_v2(state, cumul, &pos, state.dir.turn_counterclockwise()),
                calc_new_state_v2(state, cumul, &pos, state.dir.turn_clockwise()),
            ]
        })
        .collect();
}

fn find_path<'a>(map: &Input, global: &'a StateGlobalInfo, is_part2: bool, is_debug: bool) -> State<'a> {
    let min_step = if is_part2 { 4 } else { 1 };
    let max_step = if is_part2 { 10 } else { 3 };

    let mut p_queue: PriorityQueue<u16, StateKey, State> = PriorityQueue::new();
    let top_left = Pos { x: 0, y: 0 };
    let last_pos = Pos {
        x: map.width() - 1,
        y: map.height() - 1,
    };
    p_queue.push(State {
        heat_loss: 0,
        last_pos: top_left,
        dir: Direction::DOWN,
        state_global_info: global,
        history: if is_debug { Some(vec![top_left.clone()]) } else { None },
    });
    p_queue.push(State {
        heat_loss: 0,
        last_pos: top_left,
        dir: Direction::RIGHT,
        state_global_info: global,
        history: if is_debug { Some(vec![top_left.clone()]) } else { None },
    });

    while let Some(curr_state) = p_queue.pop() {
        if curr_state.last_pos == last_pos {
            return curr_state;
        }

        for s in next_possible_states(&curr_state, map, min_step, max_step) {
            p_queue.push(s)
        }
    }

    panic!("Not found path");
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let map = parse(lines);
    let global = StateGlobalInfo {
        width: map.width() as u16,
        height: map.height() as u16,
        is_part_two: context.is_part(Part::Part2),
    };

    let found_state = find_path(&map, &global, context.is_part(Part::Part2), context.is_debug());
    if context.is_part(Part::Part1) {
        check_result!(context, found_state.heat_loss, [102, 1044]);
    } else {
        log!(debug, context, "Found path \n{:?}", found_state.history);
        check_result!(context, found_state.heat_loss, [94, 1227]);
    }
}
