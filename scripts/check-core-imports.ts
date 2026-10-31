// Fails when the built core entry, or any chunk it imports, imports a Node
// built-in: the core must run on edge runtimes and in browsers.
// Usage: pnpm check:core  (after pnpm build)
import { readFile } from "node:fs/promises";
import { builtinModules } from "node:module";

const ENTRY = new URL("../dist/index.js", import.meta.url);
// A heuristic over bundler output, not a parser: good enough for the plain
// import/export statements tsdown emits.
const IMPORT_SPECIFIER_PATTERN =
  /\b(?:import|export)\b[^"']*?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g;
const NODE_BUILTINS = new Set(builtinModules);

const isNodeBuiltin = (specifier: string) =>
  specifier.startsWith("node:") ||
  NODE_BUILTINS.has(specifier.split("/")[0] ?? "");

const visited = new Set<string>();
const offenders: string[] = [];

async function visit(file: URL): Promise<void> {
  if (visited.has(file.href)) return;
  visited.add(file.href);
  const source = await readFile(file, "utf8");
  for (const [, staticSpecifier, dynamicSpecifier] of source.matchAll(
    IMPORT_SPECIFIER_PATTERN,
  )) {
    const specifier = staticSpecifier ?? dynamicSpecifier ?? "";
    if (isNodeBuiltin(specifier)) {
      offenders.push(`${file.pathname} imports ${specifier}`);
    } else if (specifier.startsWith(".")) {
      await visit(new URL(specifier, file));
    }
  }
}

await visit(ENTRY);
if (offenders.length > 0) {
  console.error(
    `The core must not depend on Node built-ins:\n${offenders.join("\n")}`,
  );
  process.exit(1);
}
console.log(`Core is free of Node built-ins (${visited.size} files checked).`);
