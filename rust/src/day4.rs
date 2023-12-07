use std::collections::BTreeSet;

use crate::{
    check_result,
    utils::{Context, Part},
};

struct Card {
    nb_copies: u32,
    winining: BTreeSet<u8>,
    owned: Vec<u8>,
}

fn parse(lines: &Vec<String>) -> Vec<Card> {
    return lines
        .iter()
        .map(|card_str| {
            let (_, numbers) = card_str.split_once(":").unwrap();
            let (winning_numbers_str, owned_numbers_str) = numbers.split_once("|").unwrap();
            let winning_numbers: BTreeSet<u8> = winning_numbers_str
                .split_ascii_whitespace()
                .map(|n| n.parse::<u8>().unwrap())
                .collect();
            let owned_numbers: Vec<u8> = owned_numbers_str
                .split_ascii_whitespace()
                .map(|n| n.parse::<u8>().unwrap())
                .collect();
            return Card {
                nb_copies: 1,
                winining: winning_numbers,
                owned: owned_numbers,
            };
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut cards = parse(lines);
    if context.is_part(Part::Part1) {
        let result: u32 = cards
            .iter()
            .map(|c| {
                let nb_wining = c.owned.iter().filter(|n| c.winining.contains(n)).count() as u32;
                return if nb_wining == 0 {
                    0
                } else {
                    (2 as u32).pow(nb_wining - 1)
                };
            })
            .sum();

        check_result!(context, result, [13, 26346]);
    } else {
        let max_id = cards.len() - 1;
        let mut total = 0;
        for pos in 0..=max_id {
            let nb_wining = cards[pos]
                .owned
                .iter()
                .filter(|n| cards[pos].winining.contains(n))
                .count();
            let last_pos = max_id.min(pos + nb_wining);
            let curr_card_count = cards[pos].nb_copies;
            total += curr_card_count as u32;
            for to_update_pos in (pos + 1)..=last_pos {
                cards[to_update_pos].nb_copies += curr_card_count;
            }
        }

        check_result!(context, total, [30, 8467762]);
    }
}
