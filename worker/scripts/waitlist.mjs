// Erken erişim listesinin özeti: npm run waitlist
import { execFileSync } from "node:child_process";

const raw = execFileSync("npx", ["wrangler", "kv", "key", "list", "--binding", "WAITLIST", "--remote"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const keys = JSON.parse(raw);
const byRole = {};
let students = 0;
for (const k of keys) {
  const m = k.metadata || {};
  byRole[m.role || "?"] = (byRole[m.role || "?"] || 0) + 1;
  students += m.students || 0;
}
console.log(`Toplam kayıt: ${keys.length}`);
console.log("Rollere göre:", byRole);
console.log(`Beyan edilen toplam öğrenci: ${students}`);
for (const k of keys) {
  const m = k.metadata || {};
  console.log(`- ${k.name.replace(/^email:/, "")} · ${m.role} · ${m.students || 0} öğrenci · ${m.createdAt}`);
}
