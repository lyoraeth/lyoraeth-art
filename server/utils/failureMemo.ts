/**
 * Remembers that something failed, for a short while, so callers can refuse
 * fast instead of trying again.
 *
 * A thrown error is never cached by Nitro, so with GitHub down and nothing
 * stored, every visit to a docs page would wait out the full fetch timeout
 * and add one more request to a service that is already refusing us. The memo
 * turns that into one attempt per `ttlMs` per key.
 *
 * Keys can come from a visitor (a docs page name), so the memo holds at most
 * `maxKeys`: past that the oldest entries go, and an attacker inventing names
 * during an outage can't grow it without bound.
 *
 * @param ttlMs - how long a failure blocks further attempts
 * @param now - the clock, injectable for tests
 * @param maxKeys - the most keys remembered at once
 */
export function createFailureMemo(ttlMs: number, now: () => number = Date.now, maxKeys = 500) {
  const blockedUntil = new Map<string, number>()

  return {
    /** True while a recent failure for `key` is still in force. */
    isBlocked(key: string): boolean {
      const until = blockedUntil.get(key)
      if (until === undefined) return false
      if (now() >= until) {
        blockedUntil.delete(key)
        return false
      }
      return true
    },

    /** Notes a failure for `key`, starting its window. */
    record(key: string): void {
      blockedUntil.delete(key) // a re-recorded key moves to the newest end
      blockedUntil.set(key, now() + ttlMs)
      // Map iterates in insertion order: the first key is the oldest
      while (blockedUntil.size > maxKeys) blockedUntil.delete(blockedUntil.keys().next().value!)
    },

    /** Forgets `key` — it worked, so no window should outlast the recovery. */
    clear(key: string): void {
      blockedUntil.delete(key)
    },
  }
}
