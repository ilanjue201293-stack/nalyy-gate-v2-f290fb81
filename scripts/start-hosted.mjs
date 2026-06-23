import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const port = process.env.PORT || "8080";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: isWindows,
      env: process.env,
      ...options,
    });

    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
    child.on("error", reject);
  });
}

function start(command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code !== 0) process.exit(code ?? 1);
  });

  return child;
}

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

await run("pnpm", ["exec", "prisma", "generate"]);
await run("pnpm", ["exec", "prisma", "db", "push", "--skip-generate"]);

start("pnpm", ["preview", "--", "--host", "0.0.0.0", "--port", port]);
start("pnpm", ["bot"]);
