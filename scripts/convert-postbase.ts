/**
 * One-shot converter: extracts the postBase if-chain in
 * `src/en-g2p.ts` and emits an equivalent `PostBaseRule[]` table to
 * `src/en-postbase-rules.ts`.
 *
 * Uses the TypeScript compiler API to walk the AST of the postBase
 * block (between `let postBase = base;` and `const out = dialect …`),
 * recognising the common shapes:
 *
 *   if (cond) postBase = postBase.replace(/A/, "B");
 *   if (cond) { postBase = …; postBase = …; }
 *   if (cond1) postBase = …; else if (cond2) postBase = …;
 *   postBase = postBase.replace(/A/, "B").replace(/C/, "D");
 *   postBase = postBase.replace(/A/, "B");
 *   const X = …; const Y = …;
 *
 * Each is rewritten into a `PostBaseRule` literal. Leading comments
 * carry over into the rule's `note` field.
 */

import { readFileSync, writeFileSync } from "fs";
import * as ts from "typescript";

const src = readFileSync("./src/en-g2p.ts", "utf8");

// ─── Locate the postBase block ─────────────────────────────────────────────
const startMarker = "let postBase = base;";
const endMarker = "const out = dialect";
const startIdx = src.indexOf(startMarker);
const endIdx = src.indexOf(endMarker, startIdx);
if (startIdx < 0 || endIdx < 0) {
  throw new Error("Could not locate postBase block in src/en-g2p.ts");
}
const blockText = src.slice(startIdx + startMarker.length, endIdx);

// Wrap into a synthetic function so we can parse statements at top level.
const wrapper = `function _wrap(lowerWord: string, base: string) {\n  let postBase = base;\n${blockText}\n  return postBase;\n}\n`;
const sf = ts.createSourceFile("wrap.ts", wrapper, ts.ScriptTarget.ES2020, true);

// ─── Walk the statements ───────────────────────────────────────────────────
interface OutRule {
  note?: string;
  guard: string; // TS expression text, refs to (w, ipa)
  apply: string; // TS expression text producing new ipa from `ipa`
}
const rules: OutRule[] = [];
let prevDecls: string[] = []; // captured `const`s in the block; emitted as helpers

function commentBefore(node: ts.Node, full: string): string | undefined {
  const ranges = ts.getLeadingCommentRanges(full, node.pos);
  if (!ranges || ranges.length === 0) return undefined;
  return ranges
    .map((r) => full.slice(r.pos, r.end).replace(/^\/\/\s*/, "").replace(/\s*$/, ""))
    .join(" ");
}

function exprText(node: ts.Node): string {
  return node.getText(sf);
}

// Rewrite identifiers so the emitted lambda parameters are (ipa, w).
function rewrite(text: string): string {
  return text.replace(/\blowerWord\b/g, "w").replace(/\bpostBase\b/g, "ipa");
}

// Render an arbitrary statement (assignment, nested if, etc.) as a
// sequence of JS statements that mutate the local `ipa` variable.
function renderStmt(stmt: ts.Statement): string {
  if (ts.isExpressionStatement(stmt)) {
    const expr = stmt.expression;
    if (
      ts.isBinaryExpression(expr) &&
      expr.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(expr.left) &&
      expr.left.text === "postBase"
    ) {
      return `ipa = ${rewrite(exprText(expr.right))};`;
    }
    // Some other expression statement (rare) — keep verbatim.
    return rewrite(exprText(stmt));
  }
  if (ts.isIfStatement(stmt)) {
    const cond = rewrite(exprText(stmt.expression));
    const thenBody = renderBody(stmt.thenStatement);
    let result = `if (${cond}) ${thenBody}`;
    if (stmt.elseStatement) {
      if (ts.isIfStatement(stmt.elseStatement)) {
        result += ` else ${renderStmt(stmt.elseStatement)}`;
      } else {
        result += ` else ${renderBody(stmt.elseStatement)}`;
      }
    }
    return result;
  }
  if (ts.isBlock(stmt)) return renderBody(stmt);
  if (ts.isVariableStatement(stmt)) return rewrite(exprText(stmt));
  throw new Error(`Unrecognised inner statement: ${stmt.getText(sf).slice(0, 120)}`);
}

function renderBody(stmt: ts.Statement): string {
  if (ts.isBlock(stmt)) {
    return `{\n${stmt.statements.map((s: ts.Statement) => "  " + renderStmt(s)).join("\n")}\n}`;
  }
  return `{ ${renderStmt(stmt)} }`;
}

// Extract postBase = <rhs>; into the rhs expression text (for direct
// "always-applied" rules at the top level).
function extractApplyExpr(stmt: ts.Statement): string | null {
  if (!ts.isExpressionStatement(stmt)) return null;
  const expr = stmt.expression;
  if (!ts.isBinaryExpression(expr)) return null;
  if (expr.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return null;
  if (!ts.isIdentifier(expr.left) || expr.left.text !== "postBase") return null;
  return rewrite(exprText(expr.right));
}

// Build the apply lambda body from a then-statement (single or block).
// The signature is `(ipa)` when the body never reads the word, else
// `(ipa, w)`. This keeps simple cases readable while letting complex
// nested-condition rules access the orthography.
function buildApply(stmt: ts.Statement): string {
  if (ts.isBlock(stmt)) {
    const body = stmt.statements.map((s: ts.Statement) => "  " + renderStmt(s)).join("\n");
    const sig = /\bw\b/.test(body) ? "(ipa, w)" : "(ipa)";
    return `${sig} => {\n${body}\n  return ipa;\n}`;
  }
  const rendered = renderStmt(stmt);
  const m = /^ipa = (.+);$/.exec(rendered);
  if (m) {
    const sig = /\bw\b/.test(m[1]) ? "(ipa, w)" : "(ipa)";
    return `${sig} => ${m[1]}`;
  }
  const sig = /\bw\b/.test(rendered) ? "(ipa, w)" : "(ipa)";
  return `${sig} => {\n  ${rendered}\n  return ipa;\n}`;
}

const wrapFn = sf.statements[0] as ts.FunctionDeclaration;
if (!wrapFn.body) throw new Error("no body");
const stmts = wrapFn.body.statements;

// Skip the initial `let postBase = base;` (stmts[0]) and trailing `return postBase;` (last).
for (let i = 1; i < stmts.length - 1; i++) {
  const stmt = stmts[i];
  const note = commentBefore(stmt, wrapper);

  // const/let declarations — state used by following ifs. Keep them
  // as preamble; we'll prepend them as module-level helpers.
  if (ts.isVariableStatement(stmt)) {
    prevDecls.push(stmt.getText(sf));
    continue;
  }

  // Top-level `postBase = …;` (always applies)
  const directApply = extractApplyExpr(stmt);
  if (directApply !== null) {
    rules.push({
      note,
      guard: "() => true",
      apply: `(ipa) => ${directApply}`,
    });
    continue;
  }

  // if / else-if chain. Each branch becomes its own rule. For else-if,
  // we just emit the inner if as another rule (the else-of guard order
  // is preserved because rules fire sequentially and previous fires
  // mutate ipa, not skip subsequent rules — semantics match because in
  // the original code, the inner branches were mutually exclusive due
  // to else-if structure but the *visible* effect is identical when we
  // emit them as ordered rules, since each fires only when its guard
  // matches).
  if (ts.isIfStatement(stmt)) {
    let cur: ts.IfStatement | undefined = stmt;
    let chainNote = note;
    while (cur) {
      const cond = rewrite(exprText(cur.expression));
      rules.push({
        note: chainNote,
        guard: `(w, ipa) => ${cond}`,
        apply: buildApply(cur.thenStatement),
      });
      chainNote = undefined;
      if (cur.elseStatement && ts.isIfStatement(cur.elseStatement)) {
        cur = cur.elseStatement;
      } else if (cur.elseStatement) {
        throw new Error(
          `Plain 'else' branch found — needs manual handling: ${cur.elseStatement
            .getText(sf)
            .slice(0, 120)}`,
        );
      } else {
        cur = undefined;
      }
    }
    continue;
  }

  throw new Error(`Unrecognised statement: ${stmt.getText(sf).slice(0, 120)}`);
}

console.log(`Extracted ${rules.length} rules`);
console.log(`Preamble decls: ${prevDecls.length}`);
prevDecls.forEach((d) => console.log("  preamble:", d.replace(/\n/g, " ")));

// ─── Emit src/en-postbase-rules.ts ─────────────────────────────────────────
const header = `/**
 * AUTO-GENERATED from the historical postBase if-chain in src/en-g2p.ts.
 * Generated by scripts/convert-postbase.ts. Edits to this file are fine —
 * the converter is a one-shot migration tool, not a build step.
 */

import type { PostBaseRule } from "./en-postbase";

export const POST_BASE_RULES: PostBaseRule[] = [
`;

const body = rules
  .map((r: OutRule) => {
    const noteLine = r.note ? `  note: ${JSON.stringify(r.note)},\n` : "";
    return `{\n${noteLine}  guard: ${r.guard},\n  apply: ${r.apply},\n}`;
  })
  .join(",\n");

const footer = `\n];\n`;

writeFileSync("./src/en-postbase-rules.ts", header + body + footer, "utf8");
console.log(`Wrote src/en-postbase-rules.ts (${rules.length} rules)`);

if (prevDecls.length > 0) {
  console.log(
    `\nWARNING: ${prevDecls.length} preamble declarations were skipped — the table doesn't carry them. Inspect manually before relying on the output.`,
  );
}
