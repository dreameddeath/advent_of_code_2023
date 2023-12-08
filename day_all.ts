
const start = new Date().getTime();
import { failures,disableTests } from "./day_utils";
//disableTests();
import "./history/day_01";
import "./history/day_02";
import "./history/day_03";
import "./history/day_04";
import "./history/day_05";
import "./history/day_06";
import "./history/day_07";
import "./history/day_08";
// import "./history/day_9";
// import "./history/day_10";
// import "./history/day_11";
// import "./history/day_12";
// import "./history/day_13";
// import "./history/day_14";
// import "./history/day_15";
// import "./history/day_16";
// import "./history/day_17";
// import "./history/day_18";
// import "./history/day_19";
// import "./history/day_20";
// import "./history/day_21";
// import "./history/day_22";
// import "./history/day_23";
// import "./history/day_24";
// import "./history/day_25";

const duration = new Date().getTime() - start;

console.log(`\n[Global] All run in ${duration} ms`);
let totalFailures = 0;
for (let domain in failures) {
    const domainFailures = failures[domain as keyof typeof failures];
    if (domainFailures.count > 0) {
        totalFailures += domainFailures.count;
        console.error(`[Global] ${domain} Failure(s) : ${domainFailures.count} / ${domainFailures.parts}`);
    }
}
if (totalFailures === 0) {
    console.log(`\n[Global] No errors`);
}