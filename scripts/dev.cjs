const { spawn } = require("node:child_process");

// Bound native CSS work and avoid a separate Turbopack PostCSS worker per stylesheet.
const options = process.argv.slice(2);
const bundler = options.some(option => ["--webpack", "--turbopack", "--turbo"].includes(option)) ? [] : ["--webpack"];
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...bundler, ...options], {
  stdio: "inherit",
  env: {
    ...process.env,
    RAYON_NUM_THREADS: process.env.RAYON_NUM_THREADS || "2",
    UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || "2",
  },
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1); });
