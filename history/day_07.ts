import { sub } from "date-fns";
import { Logger, Part, run, Type } from "../day_utils"

enum TYPE {
    UNKNOWN = 0,
    HIGH_CARD = 1,
    ONE_PAIR = 2,
    TWO_PAIR = 3,
    THREE_OF_A_KIND = 4,
    FULL_HOUSE = 5,
    FOUR_OF_A_KIND = 6,
    FIVE_OF_A_KIND = 7,
}

const MAP_HEADS_RANKS: { [key: string]: number } = {
    "T": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
    "A": 14
}

type Hand = {
    bid: number,
    orig: string,
    effective: string,
    cards: { [key: string]: number },
    type: TYPE,
    value: number
}
const START_NUMBER_ORDINAL = '0'.charCodeAt(0);
function cardRank(c: string, part: Part): number {
    if (c === 'J' && part === Part.PART_2) { return 0 }
    const headValue = MAP_HEADS_RANKS[c];
    if (headValue !== undefined) {
        return headValue;
    }
    return c.charCodeAt(0) - START_NUMBER_ORDINAL;
}
const OFFSET_SIZE = 100;
const VALUE_OFFSET = OFFSET_SIZE ** 5;



function calcHandCardValue(cardStr: string, part: Part): number {
    let result = 0;
    let currOffset = 1;
    for (let pos = 4; pos >= 0; pos--) {
        result += cardRank(cardStr[pos] ?? '0', part) * currOffset;
        currOffset *= OFFSET_SIZE;
    }
    return result;
}

function calcHand(handStr: string, bid: number, orig: string, part: Part): Hand {
    const hand: Hand = {
        bid: bid,
        cards: {},
        effective: handStr,
        orig: orig,
        type: TYPE.UNKNOWN,
        value: 0
    };
    handStr.split("").forEach((c) => {
        if (hand.cards[c] === undefined) {
            hand.cards[c] = 0
        }
        hand.cards[c] += 1;
    });
    const sorted = Object.entries(hand.cards).reverseSort((e1, e2) => {
        const diff = e1[1] - e2[1];
        if (diff !== 0) {
            return diff;
        }
        return cardRank(e1[0], part) - cardRank(e2[0], part);
    });
    switch (sorted[0][1]) {
        case 5: {
            hand.type = TYPE.FIVE_OF_A_KIND;
            break;
        }
        case 4: {
            hand.type = TYPE.FOUR_OF_A_KIND;
            break;
        }
        case 3: {
            hand.type = sorted[1][1] === 2 ? TYPE.FULL_HOUSE : TYPE.THREE_OF_A_KIND
            break;
        }
        case 2: {
            hand.type = sorted[1][1] === 2 ? TYPE.TWO_PAIR : TYPE.ONE_PAIR
            break;
        }
        case 1: {
            hand.type = TYPE.HIGH_CARD;
            break;
        }
    }
    hand.value = hand.type * VALUE_OFFSET + calcHandCardValue(orig,part);
    return hand;
}

const ALL_CARDS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function parse(lines: string[], part: Part): Hand[] {
    return lines.map(l => {
        const [handStr, bidStr] = l.split(/\s+/);
        const bid = parseInt(bidStr, 10);
        if (part === Part.PART_1 || handStr.indexOf('J') < 0) {
            return calcHand(handStr, bid, handStr, part);
        }
        else {
            const allPossibles = ALL_CARDS.map(subst => calcHand(handStr.replaceAll('J', subst), bid, handStr, part)).reverseSort((h1, h2) => h1.value - h2.value);
            return allPossibles[0];
        }
    });
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines, part);
    const sortedRank = data.sort((h1, h2) => h1.value - h2.value);
    logger.debug(() => `Sorted hand\n${sortedRank.map(h => h.orig).join("\n")}`)
    const result = sortedRank.map((h, index) => h.bid * (index + 1)).reduce((a, b) => a + (b), 0);

    if (part === Part.PART_1) {
        logger.result(result, [6440, 253954294])
    }
    else {
        logger.result(result, [5905, 254837398])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(7, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })