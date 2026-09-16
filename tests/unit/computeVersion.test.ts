import { describe, it, expect } from 'vitest'
import { computeVersion } from '../../scripts/computeVersion.mjs'

const ANCHORS = [{ sha: 'anchor-sha', major: 1 }]

/** Builds a commit list ending at the given messages, with a synthetic sha per entry. */
function history(messages: string[]) {
  return messages.map((message, i) => ({ sha: `c${i}`, message }))
}

describe('computeVersion', () => {
  it('bumps minor on feat, resetting patch and the build tail', () => {
    expect(computeVersion(history(['feat: a']), ANCHORS)).toBe('0.1.0')
    expect(computeVersion(history(['fix: a', 'feat: b']), ANCHORS)).toBe('0.1.0')
  })

  it('bumps patch on fix without touching minor', () => {
    expect(computeVersion(history(['feat: a', 'fix: b', 'fix: c']), ANCHORS)).toBe('0.1.2')
  })

  it('is case-insensitive and ignores an optional (scope)', () => {
    expect(computeVersion(history(['Feat: a']), ANCHORS)).toBe('0.1.0')
    expect(computeVersion(history(['feat(nav): a']), ANCHORS)).toBe('0.1.0')
    expect(computeVersion(history(['Fix(docker): a']), ANCHORS)).toBe('0.0.1')
  })

  it('everything else only advances the trailing build counter', () => {
    expect(computeVersion(history(['chore: a', 'docs: b', 'ux(writing): c', 'Content: d']), ANCHORS))
      .toBe('0.0.0+4')
  })

  it('omits the build suffix once it is back to zero', () => {
    expect(computeVersion(history(['chore: a', 'feat: b']), ANCHORS)).toBe('0.1.0')
  })

  it('a feat/fix resets the build tail accumulated since the last bump', () => {
    expect(computeVersion(history(['feat: a', 'chore: b', 'chore: c', 'fix: d']), ANCHORS))
      .toBe('0.1.1')
    expect(computeVersion(history(['feat: a', 'chore: b', 'chore: c']), ANCHORS))
      .toBe('0.1.0+2')
  })

  it('a breaking-change marker bumps major and resets everything below it', () => {
    expect(computeVersion(history(['feat: a', 'fix: b', 'feat!: c']), ANCHORS)).toBe('1.0.0')
    expect(computeVersion(history(['feat: a', 'feat(nav)!: b']), ANCHORS)).toBe('1.0.0')
  })

  it('a BREAKING CHANGE footer bumps major the same way a header "!" does', () => {
    const commits = [
      { sha: 'c0', message: 'feat: a' },
      { sha: 'c1', message: 'refactor: b\n\nBREAKING CHANGE: drops the old API' },
    ]
    expect(computeVersion(commits, ANCHORS)).toBe('1.0.0')
  })

  it('an anchor commit forces its configured major regardless of its own message, then counting continues from there', () => {
    const commits = [
      { sha: 'c0', message: 'feat: pre-launch work' },
      { sha: 'c0b', message: 'fix: pre-launch fix' },
      { sha: 'anchor-sha', message: 'ci: trigger first deploy' },
      { sha: 'c1', message: 'feat: post-launch feature' },
    ]
    expect(computeVersion(commits, ANCHORS)).toBe('1.1.0')
  })

  it('a later anchor overrides an earlier one, resetting again on top of it', () => {
    const anchors = [
      { sha: 'launch', major: 1 },
      { sha: 'redesign', major: 2 },
    ]
    const commits = [
      { sha: 'c0', message: 'feat: pre-launch work' },
      { sha: 'launch', message: 'ci: trigger first deploy' },
      { sha: 'c1', message: 'feat: a feature that no longer exists' },
      { sha: 'c2', message: 'fix: a fix that no longer applies' },
      { sha: 'redesign', message: 'merge: full rewrite, no backward compatibility' },
      { sha: 'c3', message: 'feat: first feature on the new base' },
    ]
    expect(computeVersion(commits, anchors)).toBe('2.1.0')
  })
})
