import { spawn } from "node:child_process";

test("repeated prefixes finish when the ending does not match", async () => {
  const source = require.resolve("../src/en/syllabify");
  const check = `const { syllabify, assignStress } = require(${JSON.stringify(source)});
    for (const word of ["ab".repeat(32) + "x", "ab".repeat(32) + "mend"]) {
      const syllables = syllabify(word), stress = assignStress(syllables, word);
      if (!Number.isInteger(stress) || stress < 0 || stress >= syllables.length) process.exit(1);
    }`;
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["--require", "tsx/cjs", "-e", check], { stdio: "ignore" });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("prefix stress worker exceeded its completion bound"));
    }, 5000);
    child.once("error", error => { clearTimeout(timer); reject(error); });
    child.once("exit", code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`prefix stress worker exited ${code}`));
    });
  });
}, 10000);
