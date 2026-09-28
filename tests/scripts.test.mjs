import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const scripts = ["linear-stats.mjs", "whats-next.mjs"].map((name) =>
  resolve(import.meta.dirname, "..", "scripts", name),
);

const run = (script, { cwd, env }) =>
  spawnSync(process.execPath, [script], {
    cwd,
    env: { PATH: process.env.PATH, ...env },
    encoding: "utf8",
  });

const hostWithManifest = () => {
  const dir = mkdtempSync(join(tmpdir(), "klein-sdlc-host-"));
  mkdirSync(join(dir, ".claude"));
  writeFileSync(
    join(dir, ".claude", "sdlc.json"),
    JSON.stringify({ tracker: { project: "Fixture Build" } }),
  );
  return dir;
};

for (const script of scripts) {
  test(`${script} refuses to run without the host manifest`, () => {
    const cwd = mkdtempSync(join(tmpdir(), "klein-sdlc-empty-"));
    const result = run(script, { cwd, env: { LINEAR_API_KEY: "lin_api_test" } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /\.claude\/sdlc\.json/);
  });

  test(`${script} names LINEAR_API_KEY when it is missing`, () => {
    const result = run(script, { cwd: hostWithManifest(), env: {} });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LINEAR_API_KEY/);
    assert.doesNotMatch(result.stderr, /sdlc\.json/, "the manifest was readable; only the key is missing");
  });
}
