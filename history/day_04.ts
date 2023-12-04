import { Logger, Part, run, Type } from "../day_utils"

type Card = {
    number: number,
    nbCopies: number;
    winining: Set<number>,
    owned: number[]
}

function parse(lines: string[]): Card[] {
    return lines.map(
        l => {
            const parts = l.split(/\s*[:\|]\s*/);
            const cardNumber = parseInt(parts[0].split(/\s+/)[1], 10);
            const wSet = new Set<number>();
            parts[1].split(/\s+/).map(s => parseInt(s, 10)).forEach(n => wSet.add(n));
            const ownedNumber = parts[2].split(/\s+/).map(s => parseInt(s, 10));
            return {
                number: cardNumber,
                nbCopies: 1,
                winining: wSet,
                owned: ownedNumber
            }
        }

    );
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const cards = parse(lines);
    if (part === Part.PART_1) {
        const result = cards
            .map(c => {
                const nbWining = c.owned.filter(n => c.winining.has(n)).length;
                return (nbWining === 0) ? 0 : 2 ** (nbWining - 1);
            })
            .reduce((sum, b) => sum + b, 0);
        logger.result(result, [13, 26346])
    }
    else {

        const result = cards
            .map((c, idx) => {
                const nbWining = c.owned.filter(n => c.winining.has(n)).length;
                const lastPos = Math.min(cards.length - 1, idx + nbWining);
                for (let pos = idx + 1; pos <= lastPos; pos++) {
                    cards[pos].nbCopies += c.nbCopies;
                }
                return c;
            })
            .reduce((sum, c) => sum + c.nbCopies, 0);


        logger.result(result, [30, 8467762])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(4, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])