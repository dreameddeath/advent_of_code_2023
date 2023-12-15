import { Logger, Part, run, Type } from "../day_utils"
import { generator } from "../utils";

function parse(lines: string[]): string[] {
    return lines[0].split(/,/);
}

function calc_hash(c: string) {
    return c.split("")
        .map(c => c.charCodeAt(0))
        .reduce((h, ascii) => ((h + ascii) * 17)% 256,0)
}
function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const HASH = calc_hash("HASH");
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.map(part => calc_hash(part)).reduce((a, b) => a + b);
        logger.result(result, [1320, 511215])
    }
    else {
        const boxes:([string,string][])[]=[...generator(256)].map(pos=>[]);
        data.forEach(part => {
            const [lens,op,value]=part.split(/(-|=)/);;
            const boxId = calc_hash(lens);
            const box = boxes[boxId];
            const existingPos = box.findIndex(l=>l[0]===lens);
            switch(op){
                case "=":{
                    if (existingPos>=0) {
                        box[existingPos][1]=value
                    } else {
                        box.push([lens,value])
                    }
                    break;
                }
                case "-":{
                    if(existingPos>=0){
                        box.splice(existingPos,1);
                    }
                }
            }
        });
        const result = boxes.flatMap((box,boxNum)=> box.map((lens,lensPos)=>[boxNum+1,lensPos+1,parseInt(lens[1],0)])).reduce((a,b)=>a+b[0]*b[1]*b[2],0);
        logger.result(result, [145, 236057])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(15, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])