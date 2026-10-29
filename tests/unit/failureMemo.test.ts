import { describe, it, expect } from 'vitest'
import { createFailureMemo } from '../../server/utils/failureMemo'

describe('createFailureMemo', () => {
  function setup() {
    let t = 1_000
    const memo = createFailureMemo(60_000, () => t)
    const advance = (ms: number) => {
      t += ms
    }
    return { memo, advance }
  }

  it('blocks a key after a failure, for the window only', () => {
    const { memo, advance } = setup()
    expect(memo.isBlocked('a/b')).toBe(false)

    memo.record('a/b')
    expect(memo.isBlocked('a/b')).toBe(true)

    advance(59_999)
    expect(memo.isBlocked('a/b')).toBe(true)
    advance(1)
    expect(memo.isBlocked('a/b')).toBe(false)
  })

  it('holds a bounded number of keys, dropping the oldest', () => {
    const memo = createFailureMemo(60_000, () => 1_000, 3)
    for (const key of ['a', 'b', 'c', 'd']) memo.record(key)

    expect(memo.isBlocked('a')).toBe(false) // pushed out
    expect(['b', 'c', 'd'].every(k => memo.isBlocked(k))).toBe(true)
  })

  it('keeps keys apart', () => {
    const { memo } = setup()
    memo.record('a/b')
    expect(memo.isBlocked('a/c')).toBe(false)
  })

  it('lets a key go as soon as it is cleared, and a new failure starts a fresh window', () => {
    const { memo, advance } = setup()
    memo.record('a/b')
    memo.clear('a/b')
    expect(memo.isBlocked('a/b')).toBe(false)

    memo.record('a/b')
    advance(30_000)
    memo.record('a/b') // a second failure restarts the clock
    advance(45_000)
    expect(memo.isBlocked('a/b')).toBe(true)
  })
})
