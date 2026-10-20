import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, cpSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const source = fileURLToPath(new URL('../../', import.meta.url));
test('release builds fail closed, support explicit local offline mode and protect immutable tags', () => {
  const root = mkdtempSync(join(tmpdir(), 'design-release-test-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  const env = { ...process.env, CI: '', CF_PAGES: '', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' };
  const build = (args, extraEnv = {}) => spawnSync(process.execPath, ['scripts/build.mjs', ...args], {
    cwd: root, env: { ...env, ...extraEnv }, encoding: 'utf8',
  });
  try {
    cpSync(join(source, 'src'), join(root, 'src'), { recursive: true });
    mkdirSync(join(root, 'scripts'));
    cpSync(join(source, 'scripts/build.mjs'), join(root, 'scripts/build.mjs'));
    const pkg = JSON.parse(readFileSync(join(source, 'package.json')));
    writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'Fixture');
    git('tag', `v${pkg.version}`);
    mkdirSync(join(root, 'dist'));
    writeFileSync(join(root, 'dist/keep.txt'), 'previous output');
    // No origin: fetch fails deterministically without using the network.
    const failed = build(['--releases']);
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /release tag fetch failed/);
    assert.equal(readFileSync(join(root, 'dist/keep.txt'), 'utf8'), 'previous output');
    for (const flag of ['CI', 'CF_PAGES']) {
      const blocked = build(['--releases', '--offline-releases'], { [flag]: 'true' });
      assert.equal(blocked.status, 1);
      assert.match(blocked.stderr, /forbidden in CI\/Pages/);
    }
    const offline = build(['--releases', '--offline-releases']);
    assert.equal(offline.status, 0, offline.stderr);
    assert.match(offline.stderr, /not deployable/);
    const manifest = JSON.parse(readFileSync(join(root, 'dist/manifest.json')));
    assert.ok(manifest.channels[pkg.version]);
    git('remote', 'add', 'origin', root);
    const fetched = build(['--releases'], { CI: 'true' });
    assert.equal(fetched.status, 0, fetched.stderr);
    assert.doesNotMatch(fetched.stderr, /offline/);
    const previousManifest = readFileSync(join(root, 'dist/manifest.json'), 'utf8');
    writeFileSync(join(root, 'src/theme.js'), '// changed source');
    const changed = build(['--releases', '--offline-releases']);
    assert.equal(changed.status, 1);
    assert.match(changed.stderr, /already released/);
    assert.equal(readFileSync(join(root, 'dist/manifest.json'), 'utf8'), previousManifest);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
