import { Logger, Part, run, Type } from "../day_utils"


interface Node {
    avg_distance: number;
    name: string,
    links: Node[],
    shortestDistance: Map<string, number>,
    max_distance: number,
}

function getOrInitNode(name: string, mapNodes: Map<string, Node>): Node {
    const node = mapNodes.get(name);
    if (node !== undefined) {
        return node;
    }
    const newNode: Node = {
        name,
        links: [],
        shortestDistance: new Map(),
        max_distance: 0,
        avg_distance: 0,
    };
    newNode.shortestDistance.set(name, 0);
    mapNodes.set(name, newNode);
    return newNode;
}

function post_process(nodes: Map<string, Node>) {
    let nb_loop = 0;
    let finished = new Set<string>()
    while (finished.size !== nodes.size) {
        nb_loop++;
        for (const node of nodes.values()) {
            if (finished.has(node.name)) {
                continue;
            }
            for (const link of node.links) {
                for (const linkedShortest of link.shortestDistance.entries()) {
                    const distance = Math.min(node.shortestDistance.get(linkedShortest[0]) ?? Number.MAX_SAFE_INTEGER, linkedShortest[1] + 1);
                    node.shortestDistance.set(linkedShortest[0], distance);
                    nodes.get(linkedShortest[0])!.shortestDistance.set(node.name, distance);
                }
            }
            if (node.shortestDistance.size === nodes.size) {
                finished.add(node.name);
            }
        }
    }

    for (const node of nodes.values()) {

        const [max, total] = [...node.shortestDistance.values()].reduce(([max, total], dist) => [Math.max(max, dist), total + dist], [0, 0]);
        node.max_distance = max;
        node.avg_distance = total / nodes.size;
    }

}

function parse(lines: string[]): Node[] {
    const mapNodes = new Map<string, Node>();
    const links_node: string[] = ["links:"];
    lines.
        forEach(l => {
            const [name, linked] = l.split(": ");
            const links = linked.split(/\s+/);
            const curr = getOrInitNode(name, mapNodes);
            links.map(link => getOrInitNode(link, mapNodes)).forEach(link => {
                links_node.push(`${name} ${link.name}`)
                curr.links.push(link);
                link.links.push(curr);
                curr.shortestDistance.set(link.name, 1);
                link.shortestDistance.set(curr.name, 1);
            });
        });
    post_process(mapNodes);
    return [...mapNodes.values()];
}


function sort_node(a: Node, b: Node): number {
    const diff_max = a.max_distance - b.max_distance;
    if (diff_max !== 0) {
        return diff_max;
    }
    return a.avg_distance - b.avg_distance;

}


class Partitionner {
    private counter: number = 0;
    private readonly discardedLinks = new Set<string>();
    private readonly map = new Map<string, Set<string>>();
    private readonly mapNameToPartitions = new Map<string, string>();

    constructor(discardedLinks: (readonly [string, string])[]) {
        for (const pair of discardedLinks) {
            this.discardedLinks.add(`${pair[0]}|${pair[1]}`);
            this.discardedLinks.add(`${pair[1]}|${pair[0]}`);
        }
    }

    public addNodes(nodes: Node[]) {
        nodes.forEach(n => this.addNode(n));
    }

    private addNode(srcNode: Node) {
        const pToMerge = srcNode.links.map(l => l.name)
            .filter(n => !this.discardedLinks.has(`${n}|${srcNode.name}`))
            .concat([srcNode.name])
            .mapNonNull(mname => this.mapNameToPartitions.get(mname))
            .reduce((s, pname) => {
                s.add(pname)
                return s;
            }, new Set<string>());

        const [pname, pset] = this.mergePartitions(pToMerge);
        this.mapNameToPartitions.set(srcNode.name, pname);
        pset.add(srcNode.name);

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

    public getValue(): number | undefined {
        if (this.map.size === 2) {
            const sizes = [...this.map.values()].map(s => s.size);
            return sizes[0] * sizes[1];
        }
        return undefined;
    }
}

function* build_pairs(orig_nodes: Node[], nb_pairs: number, ...parents: (readonly [string, string])[]): Generator<(readonly [string, string])[]> {
    let curr_node_list = orig_nodes;
    while (curr_node_list.length >= 2 * nb_pairs) {
        const [firstNode, ...others] = curr_node_list;
        const compatiblesNodes = others.filter(o => firstNode.links.find(l => l.name === o.name) !== undefined);
        const curr_pairs = compatiblesNodes.map(n => [firstNode.name, n.name] as const);
        for (const pair of curr_pairs) {
            if (nb_pairs === 1) {
                yield [...parents, pair];
            }
            else {

                for (const other_pairs of build_pairs(others.filter(o => o.name !== pair[1]), nb_pairs - 1, ...parents, pair)) {
                    yield other_pairs;
                }
            }
        }
        curr_node_list = others;
    }
}


function solve(nodes: Node[]): number {
    const min_max_dist = nodes[0].max_distance;
    let nb_explored = 0; let nb_dups = 0;
    let map_explored = new Set<string>();
    for (let max_dist_delta = 0; ; ++max_dist_delta) {
        const potentialNodes = nodes.filter(n => n.max_distance <= min_max_dist + max_dist_delta);
        for (const pairs of build_pairs(potentialNodes, 3)) {
            const key = pairs.map(p => `${p[0]}|${p[1]}`).join(";");
            if (map_explored.has(key)) {
                nb_dups++;
                continue;
            }
            map_explored.add(key);
            nb_explored++;
            const p = new Partitionner(pairs);
            p.addNodes(nodes);
            const value = p.getValue();
            if (value !== undefined) {
                return value;
            }
        }
    }
    throw new Error(`Shouldn't occurs after ${nb_explored}`);
}




function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const nodes = parse(lines);
    nodes.sort(sort_node);

    const result = solve(nodes);
    logger.result(result, [54, 559143]);
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(25, [Type.TEST, Type.RUN], puzzle, [Part.PART_1])