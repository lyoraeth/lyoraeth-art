import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Commits that manually force a major version, in place of a `!:`/`BREAKING
 * CHANGE:` marker. Both predate this versioning scheme, so there's no
 * Conventional Commits trailer to detect a major bump from — recording them
 * here is a one-time override, cheaper and safer than rewriting
 * already-pushed history to add one.
 */
export const MAJOR_ANCHORS = [
  // first real production deploy (see `4327775 feat(deploy): ...` right
  // before it, which wired up Docker/compose/CI in the first place)
  { sha: '2fde7b8c42deaa4dc34d70ef43da78eae2a601f2', major: 1 },
  // the light-catalogue redesign merge — no backward compatibility with what
  // came before (Sanity schema rebuilt from scratch), a real breaking change
  { sha: '8d0d3c8b1e90ed57dd5340516f7a25753967ce9b', major: 2 },
]

const BREAKING_HEADER = /^feat(\([a-zA-Z0-9_-]+\))?!:/i
const FEAT = /^feat(\([a-zA-Z0-9_-]+\))?:/i
const FIX = /^fix(\([a-zA-Z0-9_-]+\))?:/i
const BREAKING_FOOTER = /BREAKING CHANGE:/i

/**
 * Replays commit history (oldest → newest, ending at HEAD) into a version
 * string of the form `major.minor.patch` or `major.minor.patch+build`.
 *
 * `feat` bumps minor, `fix` bumps patch, a breaking-change marker (`!:` or
 * a `BREAKING CHANGE:` footer) bumps major — each resets everything below
 * it. A commit listed in `anchors` forces major to that value instead,
 * regardless of its own message. Anything else (chore/docs/refactor/ux/...
 * or an unrecognised prefix) only bumps the trailing build counter, which is
 * omitted once it's back to zero. Case and the optional `(scope)` are
 * ignored; only the type word and an optional `!` before the colon matter.
 *
 * The build counter is appended with `+`, not `-`: per semver.org, a
 * hyphen marks a pre-release (sorts BELOW the plain version — "not out
 * yet"), while `+build` is metadata that's ignored for precedence. These
 * extra commits are already live, just without semantic weight of their
 * own — build metadata is what that actually means.
 */
export function computeVersion(commits, anchors = MAJOR_ANCHORS) {
  const anchorBySha = new Map(anchors.map(a => [a.sha, a.major]))
  let major = 0
  let minor = 0
  let patch = 0
  let build = 0

  for (const { sha, message } of commits) {
    if (anchorBySha.has(sha)) {
      major = anchorBySha.get(sha)
      minor = 0
      patch = 0
      build = 0
      continue
    }
    if (BREAKING_HEADER.test(message) || BREAKING_FOOTER.test(message)) {
      major++
      minor = 0
      patch = 0
      build = 0
    }
    else if (FEAT.test(message)) {
      minor++
      patch = 0
      build = 0
    }
    else if (FIX.test(message)) {
      patch++
      build = 0
    }
    else {
      build++
    }
  }

  const core = `${major}.${minor}.${patch}`
  return build ? `${core}+${build}` : core
}

function isMain() {
  return process.argv[1] === fileURLToPath(import.meta.url)
}

if (isMain()) {
  const log = execSync('git log --reverse --pretty=%H%x09%s').toString().trim()
  const commits = log.split('\n').filter(Boolean).map(line => {
    const [sha, ...rest] = line.split('\t')
    return { sha, message: rest.join('\t') }
  })

  const version = computeVersion(commits)
  const sha = commits.at(-1)?.sha.slice(0, 7) ?? ''

  console.log(`version=${version}`)
  console.log(`sha=${sha}`)
}
