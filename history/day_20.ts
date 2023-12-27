import { Logger, Part, run, Type } from "../day_utils"
import { generator } from "../utils";

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
    src: Module[],
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

function parse(lines: string[]): { max_state_pos: number, map: ModuleMap } {
    const moduleMap = new Map<string, Module>();

    lines.forEach(l => {
        const [src, dests] = l.split(" -> ");
        const [type, name] = parseModuleName(src);
        const module: Module = getModule(moduleMap, name, type);
        dests.split(", ").forEach(dest_name => {
            const destModule = getModule(moduleMap, dest_name)
            module.dest.push(destModule);
            destModule.src.push(module);
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
    return { map: new ModuleMap(moduleMap), max_state_pos: curr_state_pos };
}
const BIT_MAP_SIZE = 30;


class State {
    private readonly internal: number[];
    private outputSignals: (Signal & {tickCount:number})[] = [];
    private tickCount:number=0;
    constructor(size: number,private readonly realOutputNodes:Set<string>=new Set<string>()) {
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

    private get_internal(pos: number): boolean {
        const effective_pos = pos;
        const [part, indexInPart] = this.get_pos_info(effective_pos);
        return (this.internal[part] & (1 << indexInPart)) !== 0;
    }

    public printState(modMap: ModuleMap): string[] {
        let strings = [];
        let nb_flip_flop_up = 0;
        for (const mod of modMap.values()) {
            if (mod.type === ModType.FLIP_FLOP) {
                const is_up = this.get_internal(mod.target_state_pos);
                if (is_up) { nb_flip_flop_up++ }
                //stringRes += this.get_internal(mod.target_state_pos) ? "on" : "off";
            } else {
                let stringRes = mod.name + " : " + mod.src.reduce((total, src, index) => total + (1 << index) * (this.get_internal(mod.target_state_pos + index) ? 1 : 0), 0);
                strings.push(stringRes)
                //stringRes += mod.src.map((src, index) => src + ":" + (this.get_internal(mod.target_state_pos + index) ? "on" : "off")).join(", ");
            }
            //strings.push(stringRes)
        }
        if (nb_flip_flop_up === 0) {
            strings.push("!!!!!No flip flops!!!");
        }
        return strings;
    }

    public tick(){
        this.tickCount++;
    }

    public getSynthesis(modMap: ModuleMap): { is_cycle: boolean, other_states: string[] } {
        let strings = [];
        let nb_flip_flop_up = 0;
        for (const mod of modMap.values()) {
            if (mod.type === ModType.FLIP_FLOP) {
                const is_up = this.get_internal(mod.target_state_pos);
                if (is_up) { nb_flip_flop_up++ }
                //stringRes += this.get_internal(mod.target_state_pos) ? "on" : "off";
            } else {
                let stringRes = mod.name + " : " + mod.src.reduce((total, src, index) => total + (1 << index) * (this.get_internal(mod.target_state_pos + index) ? 1 : 0), 0);
                strings.push(stringRes)
                //stringRes += mod.src.map((src, index) => src + ":" + (this.get_internal(mod.target_state_pos + index) ? "on" : "off")).join(", ");
            }
            //strings.push(stringRes)
        }

        return { is_cycle: nb_flip_flop_up === 0, other_states: strings };
    }

    public graph_view(modMap: ModuleMap): string[] {
        const list_nodes = [...modMap.keys()];
        for (const node of modMap.values()) {
            for (const dest of node.dest) {
                list_nodes.push(`${node.name} ${dest.name}`)
            }
        }

        return list_nodes;
    }

    public manageProducedSignal(mod: Module, sig_type: SignalType): Signal[] {
        if (mod.dest.length === 0) {
            this.outputSignals.push(
                { from: mod.name, type: sig_type, target: "!!!!!NEXT!!!!!",tickCount:this.tickCount }
            )
            return []
        }
        if(this.realOutputNodes.has(mod.name)){
            this.outputSignals.push(
                { from: mod.name, type: sig_type, target: "!!!!!NEXT!!!!!",tickCount:this.tickCount }
            );
        }
        return mod.dest.map(d => {
            return { from: mod.name, type: sig_type, target: d.name }
        })
    }

    public getOutputs(): [SignalType,number][] {
        const result = this.outputSignals.map(s=>[s.type,s.tickCount] as [SignalType,number]);
        this.outputSignals.splice(0, this.outputSignals.length);
        return result;
    }

}


class ModuleMap {
    protected _map: Map<string, Module>;
    constructor(map: Map<string, Module>) {
        this._map = map;
    }

    public values(): Iterable<Module> {
        return this._map.values()
    }


    public keys(): Iterable<string> {
        return this._map.keys()
    }


    public get(name: string) {
        return this._map.get(name)!
    }

    public getBaseMap(): Map<string, Module> {
        return this._map;
    }
}

class ModuleMapView extends ModuleMap {
    private readonly realSourceNodes: Set<string> = new Set();
    private readonly realOutputNodes: Set<string> = new Set();
    constructor(origmap: ModuleMap, to_include: Set<string>, potentialExtremities: Map<string, Module>) {
        super(ModuleMapView.buildModuleMap(origmap, to_include));
        if (origmap instanceof ModuleMapView) {
            [...origmap.getRealSources()]
                .filter(origSource => to_include.has(origSource))
                .forEach(name => this.realSourceNodes.add(name));

            [...origmap.getRealOutputNodes()]
                .filter(origSource => to_include.has(origSource))
                .forEach(name => this.realSourceNodes.add(name))
        }
        for (const name of to_include.values()) {
            const mod = origmap.get(name)!;
            if (mod.src.find(src_mod => potentialExtremities.has(src_mod.name))) {
                this.realSourceNodes.add(mod.name);
            }

            if (mod.dest.find(dst_mod => potentialExtremities.has(dst_mod.name))) {
                this.realOutputNodes.add(mod.name);
            }
        }
    }

    public getRealSources(): Set<string> {
        return this.realSourceNodes;
    }

    public getRealOutputNodes(): Set<string> {
        return this.realOutputNodes;
    }

    private static buildModuleMap(origmap: ModuleMap, to_include: Set<String>): Map<string, ModuleView> {
        const origmapRaw = origmap.getBaseMap();
        const modules = [...origmap.values()].filter(mod => to_include.has(mod.name)).map(mod => new ModuleView(mod));
        const newMap = new Map<string, ModuleView>();
        modules.forEach(mod => {
            newMap.set(mod.name, mod);
        });

        modules.forEach(mod => {
            mod.updateWithModules(newMap);
        })
        return newMap;
    }
}

class ModulePartition {
    private readonly input_extremities: Module[];
    private readonly output_extremities: Module[];
    constructor(extermities: Map<string, Module>, public readonly childPartitions: ModulePartition[], public readonly map?: ModuleMapView) {
        this.input_extremities = [...extermities.values()].filter(m => m.src.length === 0);
        this.output_extremities = [...extermities.values()].filter(m => m.dest.length === 0);
    }

    public isLeaf(): boolean {
        return this.childPartitions.length === 0;
    }

    public getLeaves(): ModuleMapView[] {
        if (this.map !== undefined) {
            return [this.map];
        }
        else {
            return this.childPartitions.flatMap(c => c.getLeaves());
        }
    }
}

class ModuleView implements Module {
    //name: string;
    private _dest: ModuleView[] = [];
    private _src: ModuleView[] = [];
    private _module: Module;
    constructor(module: Module) {
        if (module instanceof ModuleView) {
            this._module = module.getOrig();
        } else {
            this._module = module;
        }
    }

    public updateWithModules(moduleViews: Map<string, ModuleView>) {
        this._dest = this._module.dest.mapNonNull(mod => moduleViews.get(mod.name));
        this._src = this._module.src.mapNonNull(mod => moduleViews.get(mod.name));
    }

    public get name() {
        return this._module.name;
    }

    public get type() {
        return this._module.type;
    }

    public get target_state_pos() {
        return this._module.target_state_pos
    }

    public get dest() {
        return this._dest;
    }

    public get src() {
        return this._src;
    }

    public getOrig(): Module {
        return this._module;
    }
}

type SignalType = "high" | "low"
type Signal = {
    target: string,
    type: SignalType,
    from: string;
}

class Partitionner {
    private counter: number = 0;
    private readonly map = new Map<string, Set<string>>();
    private readonly mapNameToPartitions = new Map<string, string>();

    constructor(private readonly extremities: Map<string, Module>) {

    }
    public addModule(srcModule: Module) {
        if (this.extremities.has(srcModule.name)) {
            return;
        }

        const pToMerge = srcModule.dest.concat(srcModule.src).map(m => m.name)
            .mapNonNull(mname => this.mapNameToPartitions.get(mname))
            .reduce((s, pname) => {
                s.add(pname)
                return s;
            }, new Set<string>());

        const [pname, pset] = this.mergePartitions(pToMerge);
        this.mapNameToPartitions.set(srcModule.name, pname);
        pset.add(srcModule.name);

    }

    private mergePartitions(pnames: Set<string>): [string, Set<string>] {
        if (pnames.size === 1) {
            const name = [...pnames.values()][0];
            return [name, this.map.get(name)!]
        }
        pnames.forEach(pname => this.map.delete(pname));
        const new_part = "p" + (this.counter++);
        const newSet = new Set<string>();
        this.map.set(new_part, newSet);
        const namesToRemap = [...this.mapNameToPartitions.entries()].filter(entry => pnames.has(entry[1])).map(entry => entry[0]);
        namesToRemap.forEach(n => {
            this.mapNameToPartitions.set(n, new_part)
            newSet.add(n)
        });
        return [new_part, newSet];
    }

    public getPartitions(): Set<string>[] {
        return [...this.map.values()]
    }
}


function partition_graphs(initialMap: ModuleMap): ModulePartition {
    const list_of_endings = new Map<string, Module>();
    [...initialMap.values()].filter(mod => mod.src.length === 0 || mod.dest.length === 0).forEach(mod => list_of_endings.set(mod.name, mod))
    if (list_of_endings.size === 0) {
        if (initialMap instanceof ModuleMapView) {
            return new ModulePartition(list_of_endings, [], initialMap);
        } else {
            const view = new ModuleMapView(initialMap, [...initialMap.keys()].reduce((s, name) => {
                s.add(name);
                return s
            }, new Set<string>()), list_of_endings);
            return new ModulePartition(list_of_endings, [], view);
        }
    }
    const partitionner = new Partitionner(list_of_endings);
    for (const mod of initialMap.values()) {
        partitionner.addModule(mod);
    }
    const partitions = partitionner.getPartitions();
    const children = partitions.map(subsets => new ModuleMapView(initialMap, subsets, list_of_endings)).flatMap(new_map => partition_graphs(new_map));
    return new ModulePartition(list_of_endings, children)
}


function manage_signal_flip_flop(mod: Module, state: State, signal: Signal): Signal[] {
    if (signal.type === "high") {
        return [];
    }
    const is_on = state.get(mod);
    state.set(mod, !is_on);
    const sig_type = is_on ? "low" : "high";
    return state.manageProducedSignal(mod, sig_type);
}

function manage_signal_conjunction(mod: Module, state: State, signal: Signal): Signal[] {
    const index_src = mod.src.findIndex(src_mod => src_mod.name === signal.from);
    state.set(mod, signal.type === "high", index_src);
    const is_all_high = state.get(mod);
    const sig_type = is_all_high ? "low" : "high";
    return state.manageProducedSignal(mod, sig_type);
}

function manage_sigs(mod: Module, state: State, sig: Signal): Signal[] {
    switch (mod.type) {
        case ModType.FLIP_FLOP: return manage_signal_flip_flop(mod, state, sig);
        case ModType.CONJUCTION: return manage_signal_conjunction(mod, state, sig);
        case ModType.BROADCASTER: return state.manageProducedSignal(mod, sig.type)
        default: return [];
    }
}

function manage_signal(initSig: Signal[], map: ModuleMap, state: State): [number, number] {
    const signals: Signal[] = [...initSig];
    let nb_low_sigs = 0;
    let nb_high_sigs = 0;
    let signal: Signal | undefined;
    while (signal = signals.shift()) {
        state.tick()
        if (signal.type === "high") {
            nb_high_sigs++;
        } else {
            nb_low_sigs++;
        }
        const target = map.get(signal.target)!;
        const new_sigs = manage_sigs(target, state, signal);
        new_sigs.forEach(s => signals.push(s));
    }
    return [nb_low_sigs, nb_high_sigs];
}


function press_button(map: ModuleMap, state: State): [number, number] {
    return manage_signal([{ from: "button", target: "broadcaster", type: "low" }], map, state);
}

function send_signal(map: ModuleMapView, state: State, sig_type: SignalType): [number, number] {
    const sigs: Signal[] = [...map.getRealSources()].map(n => { return { from: "FAKE_BEFORE", target: n, type: sig_type } });
    return manage_signal(sigs, map, state);
}



const TARGET_CYCLES = 1000;
function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const { max_state_pos, map } = parse(lines);
    if (part === Part.PART_1) {
        const state = new State(max_state_pos);
        let nb_press = 0;
        let nb_lows = 0;
        let nb_highs = 0;
        while (nb_press < TARGET_CYCLES) {
            nb_press++;
            const [low, high] = press_button(map, state);
            nb_lows += low;
            nb_highs += high;
        }
        logger.result(BigInt(nb_highs) * BigInt(nb_lows), [11687500n, 869395600n])
    }
    else {
        if (type !== Type.RUN) {
            return;
        }

        const subgraphs = partition_graphs(map);
        const leaves = subgraphs.getLeaves();
        const loops: [number,{tick:number,nb_press:number}[]][] = [];
        for (const leaf of leaves) {
            const state = new State(max_state_pos,leaf.getRealOutputNodes());
            let nb_press = 0;
            let nb_lows = 0;
            let nb_highs = 0;
            let ticks:{tick:number,nb_press:number}[]=[]
            let last_tick =0;
            let last_nb_press=0;
            let nb_low = 0;
            while (nb_low<=2) {
                nb_press++;
                const [low, high] = send_signal(leaf, state, "low");
                nb_lows += low;
                nb_highs += high;
                state.getOutputs().forEach(t=>{
                    if(t[0]==="low"){
                        nb_low++;
                      ticks.push({tick:t[1] - last_tick,nb_press:nb_press-last_nb_press});  
                      last_tick = t[1];
                      last_nb_press=nb_press;
                    }
                });

            }
            loops.push([nb_press,ticks])
        }
        const primes = loops.map(l=>l[1][1].nb_press).map(l=>decomposePrime(l));
        const ppmc_parts = primes.reduce((parts,p)=>{
            p.forEach((pi,index)=>{
                parts[index]=Math.max(pi,parts[index]??0)
            })
            return parts
        },[] as number[]);
        const ppmc = BigInt(ppmc_parts.reduce((a,b,index)=>BigInt(PRIMES[index]**(b))*a,1n));

        logger.result(ppmc, [0n, 232605773145467n])
    }
}


const PRIMES = [2, 3, 5, 7];

function addNextPrime(): number {
    let currNumber = PRIMES[PRIMES.length - 1];
    while (true) {
        currNumber++;
        if (PRIMES.filter(n => currNumber % n === 0).length === 0) {
            PRIMES.push(currNumber);
            return currNumber;
        }
    }
    throw new Error("Cannot find prime");
}

function getNextPrime(pos: number): number {
    const p = PRIMES[pos];
    if (p) {
        return p;
    }
    return addNextPrime();
}

function decomposePrime(input: number): number[] {
    const result: number[] = [];
    let reminder = input;
    let pos_prime = 0;
    while (reminder !== 1) {
        const p = getNextPrime(pos_prime);
        let nb = 0;
        while (reminder % p === 0) {
            reminder = reminder / p;
            nb++;
        }
        result.push(nb);
        pos_prime++;
    }
    return result;
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(20, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2], { debug: false })