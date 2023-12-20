import { af, be, ru } from "date-fns/locale";
import { Logger, Part, run, Type } from "../day_utils"
import { PackMatchAction } from "../utils";

type Prop = "a" | "x" | "m" | "s";
const ALL_PROPS: Prop[] = ["a", "x", "m", "s"];
type Op = "<" | ">";
interface Cond {
    prop: Prop,
    op: Op,
    v: number,
}
interface Rule {
    cond: Cond,
    target: string,
}
interface Workflow {
    defaultTarget: string,
    rules: Rule[]
}

type Item = Record<Prop, number>

type WorkflowInfo = {
    workflows: Map<string, Workflow>,
    firstName: string
}


function parse(lines: string[]): { workflowInfo: WorkflowInfo, items: Item[] } {
    const [rulesDefStr, itemsStr] = lines.packIf(l => l.trim().length === 0, PackMatchAction.SKIP_AND_CHANGE);
    const mapWorkflow = new Map<string, Workflow>();
    let first = "";
    rulesDefStr.forEach((rDefStr, index) => {
        const [name, ...others] = rDefStr.split(/[{},]/).filter(p => p.trim().length > 0);
        const defaultTarget = others.pop()!;
        if (index == 0) {
            first = name;
        }
        mapWorkflow.set(name, parseWorkflow(defaultTarget, others))
    });
    const items = itemsStr.map(item => parseItem(item))
    return {
        workflowInfo: {
            workflows: mapWorkflow,
            firstName: first
        },
        items: items
    };
}


function parseWorkflow(defaultTarget: string, others: string[]): Workflow {
    return {
        defaultTarget,
        rules: others.map(p => {
            const [condStr, target] = p.split(":");
            const rule: Rule = {
                cond: {
                    prop: condStr[0] as Prop,
                    op: condStr[1] as Op,
                    v: parseInt(condStr.substring(2), 10)
                },
                target
            };
            return rule;
        })
    };
}

function parseItem(itemStr: string): Item {
    const item: Record<string, number> = {};
    itemStr.slice(1, -1).split(",").forEach(prop => {
        const [pName, pValue] = prop.split("=");
        item[pName] = parseInt(pValue, 10);
    });
    return item as Item;
}

function applyWorkFlow(item: Item, workflowInfo: WorkflowInfo): Item | undefined {
    let currName = "in";
    while (currName !== "A" && currName !== "R") {
        const currWorkflow = workflowInfo.workflows.get(currName)!;
        const foundRule = currWorkflow.rules.find(r => {
            const p = item[r.cond.prop];
            return r.cond.op === ">" ? (p > r.cond.v) : (p < r.cond.v)
        })
        const target = foundRule ? foundRule.target : currWorkflow.defaultTarget;
        currName = target;
    }
    return currName === "A" ? item : undefined
}

type Range = { min: number, max: number };
type ItemRange = Record<Prop, Range> & { workflows: string[] };

class ItemRangesToProcess extends Map<string, ItemRange[]>{
    public accepted: ItemRange[] = [];

    public takeNext(): { name: string, ranges: ItemRange[] } | undefined {
        const nextKey = [...this.keys()][0];
        if (nextKey === undefined) {
            return undefined;
        }
        const items = this.get(nextKey)!;
        this.delete(nextKey)
        return { ranges: items, name: nextKey };
    }

    public putItemRange(target: string, range: ItemRange) {
        if (target === "R") {
            return;
        }
        if (target === "A") {
            this.accepted.push(range);
            return;
        }
        const list = this.get(target)
        if (list === undefined) {
            this.set(target, [range]);
        } else {
            list.push(range);
        }
    }
}

function match_rule(input: Range, value: number, op: Op): { before?: Range, after?: Range } {
    if (input.max < value) {
        return { before: input };
    }
    if (input.min > value) {
        return { after: input };
    }
    return {
        before: {
            min: input.min,
            max: value + ((op === "<") ? - 1 : 0),
        },
        after: {
            min: value + ((op === "<") ? 0 : 1),
            max: input.max
        }
    }
}

function build_match_range(itemRange: ItemRange, p: Prop, v: number, op: Op): { before?: ItemRange, after?: ItemRange } {
    const { before: beforeRange, after: afterRange } = match_rule(itemRange[p], v, op);
    let before = undefined;
    let after = undefined;
    if (beforeRange) {
        before = { ...itemRange };
        before[p] = beforeRange;
    }
    if (afterRange) {
        after = { ...itemRange };
        after[p] = afterRange;
    }

    return { before, after };
}

function apply_ranges(itemRanges: ItemRange[], currWorkflow: Workflow, map: ItemRangesToProcess) {
    for (const itemRange of itemRanges) {
        let currRange: ItemRange | undefined = { ...itemRange }
        for (const rule of currWorkflow.rules) {
            if (currRange === undefined) {
                break;
            }

            const { before, after } = build_match_range(currRange, rule.cond.prop, rule.cond.v, rule.cond.op);
            if (rule.cond.op === "<") {
                if (before !== undefined) {
                    before.workflows = currRange.workflows.concat([rule.target]);
                    map.putItemRange(rule.target, before)
                }
                currRange = after
            } else {
                if (after !== undefined) {
                    after.workflows = currRange.workflows.concat([rule.target]);
                    map.putItemRange(rule.target, after)
                }
                currRange = before
            }
        }
        if (currRange !== undefined) {
            map.putItemRange(currWorkflow.defaultTarget, currRange)
        }
    }

}
function find_ranges(workflowInfo: WorkflowInfo): ItemRange[] {
    const context = new ItemRangesToProcess();
    context.putItemRange("in", {
        a: { min: 1, max: 4000 },
        m: { min: 1, max: 4000 },
        s: { min: 1, max: 4000 },
        x: { min: 1, max: 4000 },
        workflows: ["in"]
    });
    let curr;
    while (curr = context.takeNext()) {
        apply_ranges(curr.ranges, workflowInfo.workflows.get(curr.name)!, context)
    }
    return context.accepted
}

function size(range: Range): bigint {
    return BigInt(range.max - range.min + 1);
}

function calc_range_item_contrib(range: ItemRange): bigint {
    const total_per_prop: Record<Prop, bigint> = {
        a: size(range.a),
        m: size(range.m),
        s: size(range.s),
        x: size(range.x)
    }
    //const contrib = ALL_PROPS.map(k => sum(range[k]) * count_nb(total_per_prop, k)).reduce((a, b) => a + b)
    return ALL_PROPS.map(k => size(range[k])).reduce((a, b) => a * b, 1n)
}
function puzzle(lines: string[], part: Part, type: Type, logger: Logger): void {
    const data = parse(lines);
    if (part === Part.PART_1) {
        const result = data.items
            .mapNonNull(i => applyWorkFlow(i, data.workflowInfo))
            .reduce((t, item) =>
                t + Object.values(item).reduce((tot_item, value) => tot_item + value, 0)
                , 0);
        logger.result(result, [19114, 532551])
    }
    else {
        const found = find_ranges(data.workflowInfo);
        const result = found.map(r => calc_range_item_contrib(r)).reduce((a, b) => a + b)
        logger.result(result, [167409079868000n, 134343280273968n])
    }
}

/**
 * Update the date number after copy
 * Adapt types list to your needs and parts also 
 */
run(19, [Type.TEST, Type.RUN], puzzle, [Part.PART_1, Part.PART_2])


