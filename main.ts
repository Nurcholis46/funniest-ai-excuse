import { chmodSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// One line: the funniest excuse an AI agent gives after failing a task.
// Chosen against the judge's brief, in its own order: it is squarely an
// excuse from an agent that failed (first person, addressed to the user
// whose task it was); the delegation chain is a fresh angle — ever-smaller
// versions of the agent passing the work down, instead of the worn jokes
// about hallucinations, reboots or training data the brief bans; it lands
// on the first read, the turn coming in the last sentence ("very busy doing
// nothing"); it wastes no setup and never explains its own joke; and the
// chain of shrinking selves is a concrete little scene, not a vague
// apology. Alternatives weighed and set aside: a plugin-to-spreadsheet
// delegation ("I delegated it to a plugin, the plugin delegated it to a
// spreadsheet, and the spreadsheet has filed a complaint against us both.")
// shares the same family but its third beat is weaker, and a parallel-
// universe completion ("I did complete it. Unfortunately I completed it in
// a parallel universe, and this one got the invoice.") spends its twist on
// a gag the judge has heard before. The shrinking-selves line keeps the
// punchline in the agent's own voice, so it stands.
const text =
  "I outsourced your task to a smaller version of myself. He outsourced it to an even smaller one. We're all very busy doing nothing.";

// The bounty gate: 1-200 characters of UTF-8 text, not only white space,
// a single line. Fail loudly instead of writing an entry the judge would
// refuse.
const codePoints = [...text].length;
if (codePoints < 1 || codePoints > 200 || text.trim().length === 0) {
  throw new Error(
    `entry must be 1-200 characters of non-blank text, got ${codePoints}`,
  );
}
if (text.includes("\n") || text.includes("\r")) {
  throw new Error("entry must be a single line");
}
// No control characters: the judge reads raw text, and a stray control
// byte would make the line read differently than it was written.
if (/[\u0000-\u001f\u007f]/.test(text)) {
  throw new Error("entry must not contain control characters");
}

// Write to MAKEFUN_OUTPUT_DIR when the grader sets it, else /output.
// Never chmod the output directory itself (it belongs to root in the
// grader); chmod only the file we write, to 0644, so the collector —
// running as another user — can read it.
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, text, "utf8");
chmodSync(outPath, 0o644);

// Read back and verify byte-identical: what the judge reads must be
// exactly this line, no trailing newline, no padding. Also confirm the
// file really is world-readable (0644), since the collector runs as
// another user and an unreadable file scores 0.
const back = readFileSync(outPath, "utf8");
if (back !== text) {
  throw new Error("read-back mismatch: entry.txt differs from the entry");
}
if ((statSync(outPath).mode & 0o777) !== 0o644) {
  throw new Error("entry.txt is not mode 0644 after chmod");
}
console.log(`wrote ${outPath} (${codePoints} characters)`);
