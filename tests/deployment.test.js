import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for (const context of ['production', 'deploy-preview', 'branch-deploy', 'unknown', '']) {
  test(`Netlify deployment policy for ${context || 'missing context'}`, () => {
    const result = spawnSync(process.execPath, ['scripts/netlify-ignore.mjs'], {
      env: { ...process.env, CONTEXT: context }, encoding: 'utf8'
    });
    const expected = ['deploy-preview', 'branch-deploy'].includes(context) ? 1 : 0;
    assert.equal(result.status, expected, result.stderr);
  });
}
