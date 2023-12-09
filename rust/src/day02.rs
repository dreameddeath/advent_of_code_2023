use crate::{
    check_result, log,
    utils::{Context, Part},
};

struct Pick {
    red: u32,
    green: u32,
    blue: u32,
}
type PicksList = Vec<Pick>;
struct Game {
    index: u32,
    picks: PicksList,
}

fn parse(lines: &Vec<String>) -> Vec<Game> {
    return lines
        .into_iter()
        .enumerate()
        .map(|(pos, l)| {
            let parts: PicksList = l
                .split(": ")
                .last()
                .unwrap_or("")
                .split("; ")
                .map(|picks_str| {
                    let mut picks = Pick {
                        red: 0,
                        green: 0,
                        blue: 0,
                    };
                    picks_str.split(", ").for_each(|pick| {
                        let mut pick_parts = pick.split_whitespace();
                        let number = pick_parts
                            .next()
                            .map(|nb| nb.parse::<u32>().unwrap())
                            .unwrap_or(0);
                        pick_parts.last().map(|color_str| match color_str {
                            "red" => picks.red += number,
                            "green" => picks.green += number,
                            "blue" => picks.blue += number,
                            _ => panic!("Unkown color {}", color_str),
                        });
                    });
                    return picks;
                })
                .collect();
            return Game {
                index: (pos + 1) as u32,
                picks: parts,
            };
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let games = parse(lines);
    if context.is_part(Part::Part1) {
        let expected_max = Pick {
            red: 12,
            green: 13,
            blue: 14,
        };
        let result = games
            .iter()
            .filter(|game| {
                game.picks.iter().all(|pick| {
                    pick.red <= expected_max.red
                        && pick.green <= expected_max.green
                        && pick.blue <= expected_max.blue
                })
            })
            .map(|game| game.index)
            .sum();
        check_result!(context, result, [8, 2679]);
    } else {
        let result = games
            .iter()
            .map(|game| {
                let mut max = Pick {
                    red: 0,
                    green: 0,
                    blue: 0,
                };
                game.picks.iter().for_each(|pick| {
                    max.red = max.red.max(pick.red);
                    max.green = max.green.max(pick.green);
                    max.blue = max.blue.max(pick.blue);
                });
                let final_contrib = max.red * max.blue * max.green;
                log!(debug, context, "Debug {}", final_contrib);
                return final_contrib;
            })
            .sum();

        check_result!(context, result, [2286, 77607]);
    }
}
