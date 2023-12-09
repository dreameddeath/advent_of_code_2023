import { Logger, Part, run, Type } from "../day_utils"

function parse(lines: string[]): number[][] {
    return lines.map(l => l.split(/\s+/).map(n => parseInt(n, 10)));
}



function predictNext(h: number[]): [number,number] {
    
    const {nbZeros,newH}=calcNextArray(h);
    const [currFirst,currLast] = [h[0],h[h.length-1]];
    if(nbZeros===newH.length){
        return [currFirst,currLast];
    }
    const [before,after]=predictNext(newH);
    return [currFirst-before,currLast+after];
}

function calcNextArray(h:number[]):{newH:number[],nbZeros:number}{
    let nbZeros = 0;
    const newH = h.map(((v, index, array) => {
        const newV = (array[index + 1] ?? 0)-v;
        if(newV===0 && index!=array.length-1){
            nbZeros++;
        }
        return newV
    })).slice(0, -1);
    return {nbZeros,newH};
}


function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    const [part2,part1] = data.map(history => predictNext(history)).reduce((a, b) => [a[0]+b[0], a[1]+b[1]], [0,0]);
    logger.result([part1,part2], [114, 1921197370,2,1124]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(9, [Type.TEST, Type.RUN], puzzle, [Part.ALL])