import { assert } from "console";
import { Logger, Part, run, Type } from "./day_utils"
import { generator } from "./utils";

enum ModType {
    FLIP_FLOP = "%",
    CONJUCTION = "&",
    BROADCASTER = "b",
    UNKNOWN = "x"
}

interface Module {
    name: string,
    type: ModType,
    dest: Module[],
    src: string[],
    target_state_pos: number;
}

function parseModuleName(fullName: string): [ModType, string] {
    if (fullName.startsWith(ModType.FLIP_FLOP)) {
        return [ModType.FLIP_FLOP, fullName.substring(1)];
    }
    if (fullName.startsWith(ModType.CONJUCTION)) {
        return [ModType.CONJUCTION, fullName.substring(1)];
    }

    return [ModType.BROADCASTER, fullName]
}

function getModule(map: Map<string, Module>, name: string, type?: ModType) {
    const found = map.get(name)
    if (found) {
        if (type) {
            found.type = type;
        }
        return found;
    }
    const new_module: Module = { type: type ?? ModType.UNKNOWN, name, src: [], dest: [], target_state_pos: -1 };
    map.set(name, new_module);
    return new_module;
}

function parse(lines: string[]): { max_state_pos: number, map: Map<string, Module> } {
    const moduleMap = new Map<string, Module>();

    lines.forEach(l => {
        const [src, dests] = l.split(" -> ");
        const [type, name] = parseModuleName(src);
        const module: Module = getModule(moduleMap, name, type);
        dests.split(", ").forEach(dest_name => {
            const destModule = getModule(moduleMap, dest_name)
            module.dest.push(destModule);
            destModule.src.push(name);
        })
        return module;
    });
    let curr_state_pos = 0;

    for (const module of moduleMap.values()) {
        if (module.type === ModType.BROADCASTER) {
            continue;
        }
        module.target_state_pos = curr_state_pos;
        curr_state_pos += module.type === ModType.CONJUCTION ? module.src.length : 1
    }
    return { map: moduleMap, max_state_pos: curr_state_pos };
}
const BIT_MAP_SIZE = 30;
class State {
    private readonly internal: number[];
    constructor(size: number) {
        this.internal = [...generator(Math.ceil(size / BIT_MAP_SIZE))].map(n => 0);
    }

    public is_init_state() {
        return this.internal.filter(p => p !== 0).length === 0;
    }

    private get_pos_info(pos: number): [number, number] {
        const indexInPart = pos % BIT_MAP_SIZE;
        const part = (pos - indexInPart) / BIT_MAP_SIZE;
        return [part, indexInPart]
    }
    public set(module: Module, active: boolean, srcPos?: number) {
        const effective_pos = module.target_state_pos + (srcPos ?? 0);
        const [part, indexInPart] = this.get_pos_info(effective_pos);
        if (active) {
            this.internal[part] |= 1 << indexInPart;
        } else {
            this.internal[part] &= ~(1 << indexInPart);
        }
    }

    public get(module: Module): boolean {
        let [part, indexInPart] = this.get_pos_info(module.target_state_pos);

        let nb = module.type === ModType.FLIP_FLOP ? 1 : module.src.length;
        let isActive = true;
        while (nb > 0) {
            const currPartNb = Math.min(BIT_MAP_SIZE - indexInPart, nb);
            const isActiveMask = ((1 << currPartNb) - 1);
            const mask = (isActiveMask) << indexInPart;
            const partMasked = ((this.internal[part] & mask) >> indexInPart);

            isActive &&= (partMasked === isActiveMask);
            nb -= currPartNb;
            part++;
            indexInPart = 0
        }
        return isActive;
    }

    private get_internal(pos:number):boolean{
        const effective_pos = pos;
        const [part, indexInPart] = this.get_pos_info(effective_pos);
        return (this.internal[part] & (1 << indexInPart))!==0;
    }

    public printState(modMap:ModuleMap):string[]{
        let strings=[];
        for( const mod of modMap.values()){
            let stringRes = mod.name+" :";
            if(mod.type===ModType.FLIP_FLOP){
                stringRes+=this.get_internal(mod.target_state_pos)?"on":"off";
            }else {
                stringRes+=mod.src.map((src,index)=>src+":"+(this.get_internal(mod.target_state_pos+index)?"on":"off")).join(", "); 
            }
            strings.push(stringRes)
        }
        return strings;
    }
}


function test_flip_flop_state(){
    const state = new State(35);
    const mod:Module={
        name:"toto",
        target_state_pos:BIT_MAP_SIZE-1,
        type:ModType.FLIP_FLOP,
        dest:[],
        src:[]
    }
    const otherMod:Module={...mod,target_state_pos:BIT_MAP_SIZE-2};

    assert(state.get(mod)===false);
    assert(state.get(otherMod)===false);
    state.set(mod,true);
    assert(state.get(mod)===true);
    assert(state.get(otherMod)===false);
}

function test_conjuction_state(){
    const state = new State(35);
    const mod:Module={
        name:"toto",
        target_state_pos:BIT_MAP_SIZE-1,
        type:ModType.CONJUCTION,
        dest:[],
        src:["a","b"]
    }
    const otherMod:Module={...mod,target_state_pos:BIT_MAP_SIZE-3};

    assert(state.get(mod)===false);
    assert(state.get(otherMod)===false);
    state.set(mod,true,0);
    assert(state.get(mod)===false);
    assert(state.get(otherMod)===false);

    state.set(mod,true,1);
    assert(state.get(mod)===true);
    assert(state.get(otherMod)===false);

    state.set(mod,false,0);
    assert(state.get(mod)===false);
    assert(state.get(otherMod)===false);

}



function run_all_tests(){
    test_flip_flop_state();
    test_conjuction_state();
}


run_all_tests();


type ModuleMap = Map<string, Module>;
type Signal = {
    target: string,
    type: "high" | "low",
    from: string;
}

function manage_signal_flip_flop(mod: Module, state: State, signal: Signal): Signal[] {
    if (signal.type === "high") {
        return [];
    }
    const is_on = state.get(mod);
    state.set(mod, !is_on);
    const sig_type = is_on ? "low" : "high";
    return mod.dest.map(d => {
        return { from: mod.name, type: sig_type, target: d.name }
    })
}

function manage_signal_conjunction(mod: Module, state: State, signal: Signal): Signal[] {
    const index_src = mod.src.findIndex(name => name === signal.from);
    state.set(mod, signal.type === "high", index_src);
    const is_all_high = state.get(mod);
    const sig_type = is_all_high ? "low" : "high";
    return mod.dest.map(d => {
        return { from: mod.name, type: sig_type, target: d.name }
    })
}

function manage_sigs(mod:Module,state:State,sig:Signal):Signal[]{
    switch(mod.type){
        case ModType.FLIP_FLOP:return manage_signal_flip_flop(mod,state,sig);
        case ModType.CONJUCTION:return manage_signal_conjunction(mod,state,sig);
        default:return [];
    }
}


function press_button(map: ModuleMap, state: State): [number,number] {
    const signals: Signal[] = [];
    map.get("broadcaster")!.dest.forEach(n => signals.push({ from: "broadcaster", type: "low", target: n.name }));
    let nb_low_sigs = 1;
    let nb_high_sigs = 0;
    let signal: Signal | undefined;
    let all_sigs = [];

    while (signal = signals.shift()) {
        if(signal.type==="high"){
            nb_high_sigs++;
        } else {
            nb_low_sigs++;
        }
        all_sigs.push(signal);
        const target = map.get(signal.target)!;
        const new_sigs = manage_sigs(target,state,signal);
        new_sigs.forEach(s => signals.push(s));
    }
    return [nb_low_sigs,nb_high_sigs];
}

const TARGET_CYCLES = 1000;
function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const { max_state_pos, map } = parse(lines);
    if (part === Part.PART_1) {
        const state = new State(max_state_pos);
        let nb_press = 0;
        let nb_lows = 0;
        let nb_highs = 0;
        while(nb_press<TARGET_CYCLES) {
            nb_press++;
            const [low,high]= press_button(map, state);
            nb_lows+=low;
            nb_highs+=high;
            /*if(state.is_init_state()){
                let nb_loops = Math.floor(TARGET_CYCLES/nb_press);
                nb_lows=nb_loops*nb_lows;
                nb_highs=nb_loops*nb_highs;
                nb_press=TARGET_CYCLES-(TARGET_CYCLES%nb_press);
            }*/
        }//while (!state.is_init_state())
        logger.result(BigInt(nb_highs)*BigInt(nb_lows), [11687500n, undefined])
    }
    else {
        const state = new State(max_state_pos);
        /*while(true) {
           const [low,high]= press_button(map, state);
            
        }*/
        
        const result = map.size;
        logger.result(result, [undefined, undefined])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(20, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])