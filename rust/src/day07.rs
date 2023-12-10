use crate::{
    check_result,
    utils::{Context, Part},
};

const J_POS: usize = 10;

fn map_card_pos_or_value(c: char) -> u8 {
    match c {
        '2' => 1,
        '3' => 2,
        '4' => 3,
        '5' => 4,
        '6' => 5,
        '7' => 6,
        '8' => 7,
        '9' => 8,
        'T' => 9,
        'J' => J_POS as u8,
        'Q' => 11,
        'K' => 12,
        'A' => 13,
        _ => panic!("Unknown {}", c),
    }
}

#[derive(Debug, Clone, Copy)]
enum HandType {
    HighCard = 1,
    OnePair = 2,
    TwoPair = 3,
    ThreeOfAKind = 4,
    FullHouse = 5,
    FourOfAKind = 6,
    FiveOfAKind = 7,
}

const CARD_BYTE_SIZE: u8 = 4;
const CARD_TYPE_OFFSET: u8 = CARD_BYTE_SIZE * 5;
fn hand_card_value(hand: &str, is_part_one: bool) -> u32 {
    let mut res: u32 = 0;
    for pos in 0..5 {
        let card = hand.chars().nth(pos).unwrap();
        let card_value = map_card_pos_or_value(card);
        let effective_value = if !is_part_one && card_value == J_POS as u8 {
            0
        } else {
            card_value
        };
        res = (res << CARD_BYTE_SIZE) | effective_value as u32;
    }
    return res;
}

fn hand_value(hand: &str, is_part_one: bool) -> u32 {
    let hand_type = calc_hand_type(hand,is_part_one);
    let hand_value = hand_final_value(hand_type, hand, is_part_one);
    return hand_value;
}

fn hand_final_value(hand_type: HandType, hand: &str, is_part_one: bool) -> u32 {
    let hand_value = ((hand_type as u32) << CARD_TYPE_OFFSET) | hand_card_value(hand, is_part_one);
    hand_value
}

fn calc_hand_type(hand: &str, is_part_one: bool) -> HandType {
    let mut count = vec![0; 14];
    hand.chars()
        .for_each(|c| count[map_card_pos_or_value(c) as usize] += 1);
    let nb_j = count[J_POS];
    if !is_part_one {
        count[J_POS] = 0;
    }
    count.sort_unstable_by(|a, b| b.cmp(&a));
    if !is_part_one {
        count[0] += nb_j;
    }
    return match count[0] {
        5 => HandType::FiveOfAKind,
        4 => HandType::FourOfAKind,
        3 => {
            if count[1] == 2 {
                HandType::FullHouse
            } else {
                HandType::ThreeOfAKind
            }
        }
        2 => {
            if count[1] == 2 {
                HandType::TwoPair
            } else {
                HandType::OnePair
            }
        }
        _ => HandType::HighCard,
    };
}

struct HandInfo {
    value: u32,
    bid: u32,
}

fn parse(lines: &Vec<String>, is_part_one: bool) -> Vec<HandInfo> {
    return lines
        .iter()
        .map(|l| {
            let (hand, bid_str) = l.split_once(" ").unwrap();
            let bid = bid_str.parse::<u32>().unwrap();
            return HandInfo {
                bid,
                value: hand_value(hand, is_part_one),
            };
        })
        .collect();
}

pub fn puzzle(context: &Context, lines: &Vec<String>) {
    let mut hands = parse(lines, context.is_part(Part::Part1));
    hands.sort_unstable_by(|a, b| a.value.cmp(&b.value));

    let result = hands.iter().enumerate().fold(0, |sum, (index, hand_info)| {
        sum + hand_info.bid * (index as u32 + 1)
    });

    if context.is_part(Part::Part1) {
        check_result!(context, result, [6440, 253954294]);
    } else {
        check_result!(context, result, [5905, 254837398]);
    }
}
