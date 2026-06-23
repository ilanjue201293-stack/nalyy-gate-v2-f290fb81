import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { obfuscateLua } from "../src/lib/server/access";

const source = 'print("NALYY_OBF_TEST")';
const first = obfuscateLua(source);
const second = obfuscateLua(source);
const strong = obfuscateLua(source, "strong");

if (first === second) {
  throw new Error("Obfuscator output must be different for the same input.");
}

for (const forbidden of ["loadstring", "table.concat"]) {
  if (first.includes(forbidden) || second.includes(forbidden) || strong.includes(forbidden)) {
    throw new Error(`Generated output must not contain ${forbidden}.`);
  }
}

const runtime = findLuaRuntime();
if (!runtime) {
  console.log("Obfuscator structure checks passed. Lua/Luau runtime not found, execution comparison skipped.");
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "nalyy-obf-"));
try {
  const originalPath = join(dir, "original.lua");
  const obfuscatedPath = join(dir, "obfuscated.lua");
  const compat = `
_G = _G or _ENV
unpack = unpack or table.unpack
if not _G.loadstring then _G.loadstring = load end
if not bit32 then
  bit32 = {}
  function bit32.bxor(...)
    local args={...}
    local result=0
    local bit=1
    for _=1,32 do
      local count=0
      for i=1,#args do
        if args[i] % 2 == 1 then count=count+1 end
        args[i]=math.floor(args[i]/2)
      end
      if count % 2 == 1 then result=result+bit end
      bit=bit*2
    end
    return result
  end
end
`;
  writeFileSync(originalPath, `${source}\n`, "utf8");
  writeFileSync(obfuscatedPath, `${compat}\n${first}\n`, "utf8");

  const original = spawnSync(runtime, [originalPath], { encoding: "utf8" });
  const obfuscated = spawnSync(runtime, [obfuscatedPath], { encoding: "utf8", maxBuffer: 5_000_000 });
  if (original.status !== 0) throw new Error(original.stderr || "Original script failed.");
  if (obfuscated.status !== 0) throw new Error(obfuscated.stderr || "Obfuscated script failed.");
  if (original.stdout !== obfuscated.stdout) {
    throw new Error(`Output mismatch. Original=${JSON.stringify(original.stdout)} Obfuscated=${JSON.stringify(obfuscated.stdout)}`);
  }
  console.log("Obfuscator execution test passed.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

function findLuaRuntime() {
  const candidates = [
    process.env.LUA_BIN,
    process.env.LUAU_BIN,
    "luau",
    "lua",
    "lua5.4",
    "lua5.3",
    "lua5.2",
    "lua5.1",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-v"], { encoding: "utf8" });
    if (!result.error) return candidate;
  }
  return null;
}
