# Privacy Policy

**Last updated:** June 2026
**Site:** https://lyoraeth.art

## 1. Who is responsible

The data controller for this site is **Danil Klimov**, an independent (self-employed) developer based in Russia, reachable at **lyoraeth@gmail.com** (project alias: lyoraeth).

For visitors in the EU/EEA and the UK, personal data is handled in line with the GDPR. Because the controller is based in Russia and some processors are located in the US, using certain features involves a transfer of data outside the EEA — see section 5.

## 2. Principles

This site is a personal portfolio. Data collection is kept to an absolute minimum: no advertising trackers, no profiling, no data sold or shared with ad networks. Only what a given feature technically needs is processed, and only for as long as needed.

## 3. What is processed, why, and on what legal basis

### 3.1. Contact form

- **Data:** the contact handle you enter yourself (Telegram, email, or other) and your message.
- **Purpose:** to receive your enquiry and reply to it.
- **Legal basis:** your consent, and/or steps taken at your request prior to a possible engagement (Art. 6(1)(a)/(b) GDPR).
- **Storage:** the message is delivered to the owner by email (via Resend) and is **not stored anywhere on the site**. It remains in the owner's mailbox only as long as needed for the correspondence and is deleted on request.

### 3.2. Comments

- **Data:** the handle ("@handle") you choose and your comment text. **No name and no email address are requested or stored.**
- **Purpose:** to publish and moderate comments under blog posts.
- **Legal basis:** your consent (Art. 6(1)(a) GDPR).
- **Storage:** in Sanity (CMS) until you or the owner remove the comment. Comments are pre-moderated and may be rejected or removed at the owner's discretion.

### 3.3. Post ratings (up / down)

- **Data:** your vote and a **SHA-256 hash** of your IP address combined with the post ID. The **raw IP is never stored** — only the irreversible hash is kept.
- **Purpose:** to prevent duplicate voting from the same device (deduplication).
- **Legal basis:** the owner's legitimate interest in protecting site functionality (Art. 6(1)(f) GDPR); the data is processed in pseudonymised form.
- **Also:** a `lyoraeth_vote_<post-id>` entry with the value `up`/`down` is kept in your browser's `localStorage` so the interface remembers your choice. It never leaves your browser.

### 3.4. Analytics

Page views are counted with **Umami**, a self-hosted, open-source analytics tool running on the owner's own server.

- Umami uses **no cookies** and no fingerprinting.
- Only anonymous aggregates are collected: page URL, referrer, browser language, screen resolution, country.
- Data is **never shared with third parties** — it stays on the owner's server and is used only to understand which content is useful.
- **Legal basis:** legitimate interest in understanding site usage (Art. 6(1)(f) GDPR).

### 3.5. Anti-spam (CAPTCHA)

The contact and comment forms are protected by **Cloudflare Turnstile**. To run its check, Cloudflare may process your IP address and browser metadata on its servers. Turnstile is used solely for spam protection, never for advertising, and does not store your IP on the site side. See https://www.cloudflare.com/privacypolicy/

### 3.6. Fonts

Golos Text, Onest and JetBrains Mono are served from `lyoraeth.art`. **No requests are made to Google** and no data is shared with font providers.

## 4. Cookies and local storage

| Key | Type | Purpose | Lifetime |
|---|---|---|---|
| `i18n_locale` | Cookie (Secure) | Remembers your language choice (ru/en) | Until cleared |
| Turnstile technical cookie | Cookie | Completing the CAPTCHA check | Short-lived, cleared after the check |
| `lyoraeth_vote_<slug>` | localStorage | Remembers your vote on a post | Until cleared |

No advertising or tracking cookies are used.

## 5. Third parties and international transfers

Some processors sit outside the EEA, so using the relevant features transfers data internationally:

| Service | Role | What is transferred | Location |
|---|---|---|---|
| Sanity | CMS (comments, votes) | Handle, comment text, IP hash | EU / US |
| Resend | Delivery of the contact-form email | The handle and text you provide | US |
| Cloudflare Turnstile | Anti-spam check | IP address, browser metadata | US / global |
| Umami (self-hosted) | Analytics | Anonymous aggregates only | Owner's server, no third party |

Where data is transferred outside the EEA, it is done on the basis of your consent and/or the safeguards offered by the respective providers. You can avoid the contact-form transfer entirely by reaching out via the Telegram/GitHub links instead.

## 6. Retention

Contact messages are kept only as long as needed to handle the correspondence. Comments are kept until removed by you or the owner. Rating hashes are kept while deduplication remains relevant. Analytics aggregates are not tied to an identifiable person.

## 7. Your rights

For visitors covered by the GDPR, you have the right to:

- access the personal data held about you;
- have it rectified or erased;
- restrict or object to its processing;
- **withdraw consent** at any time (without affecting prior lawful processing);
- **lodge a complaint with your local supervisory authority** (data protection authority).

To exercise any of these, email **lyoraeth@gmail.com**. The owner will respond within 30 days.

## 8. Security

Appropriate technical and organisational measures are applied in proportion to the data: minimisation, pseudonymisation (IP hashing), HTTPS-only transmission, and moderation of user-generated content.

## 9. Changes

If this policy changes materially, the date at the top of this page is updated and the new version is published at the same address.
