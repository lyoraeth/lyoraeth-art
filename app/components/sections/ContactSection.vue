<script setup lang="ts">
import type { SiteSettings } from '../../../server/api/settings.get'

const { t, tm, rt } = useI18n()
const localePath = useLocalePath()
const { public: { turnstileContactSiteKey } } = useRuntimeConfig()
const track = useTrack()

const { data: settings } = await useFetch<SiteSettings>('/api/settings', { key: 'site-settings' })
const cvUrl = await useCvUrl()

const telegramUrl = computed(() =>
  settings.value?.telegramHandle ? `https://t.me/${settings.value.telegramHandle}` : undefined,
)
const githubUrl = computed(() =>
  settings.value?.githubHandle ? `https://github.com/${settings.value.githubHandle}` : undefined,
)

// tm()'s generic return type collapses to Record<string, any> without a
// locale-message schema declared — line's real shape isn't recoverable here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lead = computed(() => (tm('contact.lead') as unknown[]).map((line: any) => rt(line)))

/* ── Form ─────────────────────────────────────────────────────────────────── */

const from = ref('')
const message = ref('')
const consent = ref(false)
const token = ref('')

type Field = 'from' | 'message' | 'consent'
const errors = reactive<Record<Field, string>>({ from: '', message: '', consent: '' })

type Status = { text: string; failed: boolean } | null
const status = ref<Status>(null)
const sending = ref(false)

const fromField = ref<HTMLInputElement | null>(null)
const messageField = ref<HTMLTextAreaElement | null>(null)
const consentField = ref<HTMLInputElement | null>(null)
const turnstile = ref<{ reset: () => void } | null>(null)

/** An @handle, or something with an at-sign and a dotted domain — no more can
 *  be guessed about a contact than that. */
const looksLikeContact = (value: string) =>
  /^@[\w\d_]{3,}$/.test(value) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)

/**
 * Validates the form and focuses the first field that fails.
 *
 * @remarks
 * The messages explain the reason rather than label the field: no "error", no
 * "invalid". The contact format is checked loosely — "looks incomplete" —
 * because every spelling of a handle or an address can't be anticipated.
 */
function validate(): boolean {
  const value = from.value.trim()
  errors.from = !value
    ? t('contact.errors.from_empty')
    : looksLikeContact(value) ? '' : t('contact.errors.from_malformed')
  errors.message = message.value.trim() ? '' : t('contact.errors.message_empty')
  errors.consent = consent.value ? '' : t('contact.errors.consent_empty')

  const firstInvalid = (['from', 'message', 'consent'] as Field[]).find(field => errors[field])
  if (!firstInvalid) return true

  const control = { from: fromField, message: messageField, consent: consentField }[firstInvalid]
  control.value?.focus()
  return false
}

async function onSubmit() {
  status.value = null
  if (!validate()) return

  sending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { token: token.value, contact: from.value, message: message.value },
    })
    status.value = { text: t('contact.sent'), failed: false }
    from.value = message.value = ''
    consent.value = false
  }
  catch (e) {
    // $fetch errors don't have a single, documented shape — a narrow local
    // cast is the pragmatic middle ground between `any` and writing out
    // ofetch's internal error types by hand.
    const error = e as { statusCode?: number; data?: { message?: string } }
    // a rejected token is worth its own line: the fix is a refresh, not a retype
    const captcha = error?.statusCode === 400 && /captcha/i.test(error?.data?.message ?? '')
    status.value = { text: captcha ? t('contact.captcha_failed') : t('contact.failed'), failed: true }
  }
  finally {
    sending.value = false
    // A token is single-use: whatever the outcome, the next send needs a new
    // one. Clearing token alone leaves the widget itself showing a stale
    // "verified" checkmark — reset() re-renders it too, so the token it holds
    // actually matches what the checkmark claims.
    token.value = ''
    turnstile.value?.reset()
  }
}

/* ── Analytics ────────────────────────────────────────────────────────────── */

let started = false
function onFormStart() {
  if (started) return
  started = true
  track(EV.contactStart)
}
</script>

<template>
  <section
    id="contact"
    class="layout-grid gap-y-grid-gap py-section-padding-y"
    aria-labelledby="contact-title"
  >
    <div
      class="col-span-4 md:col-span-8 lg:col-span-3 xl:col-span-5 2xl:col-span-7 gap-6 flex flex-col pt-contact-intro-padding-y"
    >
      <h2 id="contact-title" class="type-display-2xl text-text-primary">{{ t('contact.title') }}</h2>

      <p class="type-body-lg text-text-primary">
        <template v-for="(line, i) in lead" :key="i">
          <br v-if="i">{{ line }}
        </template>
      </p>

      <div class="flex flex-row gap-3 pt-4">
        <a
          v-if="telegramUrl"
          :href="telegramUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="py-4 px-9 inline-flex items-center justify-center bg-accent-strong hover:bg-accent-strong-hover active:bg-accent-default gap-1.5 type-cta text-text-inverse rounded-full"
          @click="track(EV.ctaClick)"
        >
          <span class="h-5 w-5 flex items-center justify-center">
            <svg class="w-4 h-3.5" viewBox="0 0 16 14" fill="currentColor" aria-hidden="true">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M1.09992 6.02691C5.39488 4.05119 8.25885 2.74867 9.69185 2.11936C13.7834 0.322542 14.6335 0.0104165 15.1877 0.000109891C15.3095 -0.00215693 15.5821 0.0297341 15.7586 0.180964C15.9076 0.30866 15.9486 0.481158 15.9683 0.602228C15.9879 0.723297 16.0123 0.999097 15.9929 1.2146C15.7712 3.6743 14.8118 9.64335 14.3237 12.3983C14.1172 13.564 13.7105 13.9548 13.3169 13.9931C12.4613 14.0762 11.8116 13.3961 10.9829 12.8225C9.68624 11.9251 8.9537 11.3664 7.69503 10.4907C6.24043 9.47859 7.18338 8.92233 8.01236 8.01324C8.22931 7.77533 11.999 4.15509 12.0719 3.82668C12.0811 3.7856 12.0895 3.6325 12.0034 3.55166C11.9172 3.47081 11.7901 3.49846 11.6983 3.52045C11.5683 3.55161 9.4968 4.99723 5.48389 7.8573C4.89591 8.2836 4.36333 8.49131 3.88616 8.48042C3.36012 8.46842 2.34822 8.16638 1.59598 7.90821C0.673328 7.59154 -0.0599784 7.42412 0.00387615 6.88633C0.0371355 6.60621 0.402482 6.31974 1.09992 6.02691Z"
              />
            </svg>
          </span>
          <span>{{ t('contact.telegram') }}</span>
        </a>

        <div class="flex flex-row items-center gap-1">
          <a
            v-if="cvUrl"
            :href="cvUrl"
            download
            class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse"
          >
            <span class="h-4 w-4 flex items-center justify-center">
              <svg class="h-2.75 w-2.5" viewBox="0 0 10 11" fill="currentColor" aria-hidden="true">
                <path
                  d="M9.456 9.91a.544.544 0 0 1 0 1.09H.544a.544.544 0 0 1 0-1.09zm-5-9.365a.544.544 0 1 1 1.088 0V7.06l2.919-2.524a.545.545 0 0 1 .712.825l-3.82 3.304a.544.544 0 0 1-.71 0L.824 5.362a.545.545 0 0 1 .712-.825l2.919 2.524z"
                />
              </svg>
            </span>
            <span>{{ t('contact.cv') }}</span>
          </a>

          <a
            v-if="githubUrl"
            :href="githubUrl"
            rel="me noopener"
            target="_blank"
            class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse"
          >
            <span class="h-4 w-4 flex items-center justify-center">
              <svg class="size-2.75" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true">
                <path
                  d="M4.65136 8.0403C3.23339 7.86286 2.23438 6.8093 2.23438 5.44522C2.23438 4.89072 2.42773 4.29186 2.75 3.89262C2.61035 3.52664 2.63183 2.75033 2.79297 2.42873C3.22266 2.37327 3.80273 2.60617 4.14648 2.92778C4.55469 2.79469 4.98438 2.72815 5.51074 2.72815C6.03711 2.72815 6.4668 2.79469 6.85352 2.91669C7.18652 2.60617 7.77734 2.37327 8.20703 2.42873C8.35742 2.72815 8.37891 3.50446 8.23925 3.88152C8.583 4.30294 8.76562 4.86854 8.76562 5.44522C8.76562 6.8093 7.7666 7.84068 6.32714 8.0292C6.69238 8.27318 6.93945 8.80551 6.93945 9.41547V10.5689C6.93945 10.9015 7.208 11.0901 7.53027 10.957C9.47461 10.1917 11 8.18446 11 5.70029C11 2.56181 8.5293 0 5.48925 0C2.44922 0 0 2.5618 0 5.70029C0 8.16228 1.51464 10.2029 3.55566 10.9681C3.8457 11.0789 4.125 10.8794 4.125 10.58V9.69271C3.97461 9.75925 3.78125 9.80361 3.60938 9.80361C2.90039 9.80361 2.48144 9.40437 2.18066 8.66134C2.0625 8.36191 1.93359 8.18446 1.68652 8.1512C1.55761 8.1401 1.51464 8.08466 1.51464 8.01812C1.51464 7.88504 1.72949 7.78522 1.94433 7.78522C2.25586 7.78522 2.52441 7.98484 2.80371 8.39518C3.01855 8.71679 3.24414 8.86096 3.51269 8.86096C3.78125 8.86096 3.95313 8.76115 4.20019 8.50608C4.38281 8.31754 4.52246 8.1512 4.65136 8.0403Z"
                />
              </svg>
            </span>
            <span>{{ t('contact.github') }}</span>
          </a>
        </div>
      </div>
    </div>

    <!--
      Validation is ours rather than the browser's: native tooltips can't be
      styled, say "Please fill in this field", and vanish on their own.
    -->
    <form
      class="col-span-4 md:col-span-8 lg:col-start-5 lg:col-span-4 xl:col-start-7 xl:col-span-6 2xl:col-start-8 2xl:col-span-5 gap-4 flex flex-col"
      novalidate
      @submit.prevent="onSubmit"
      @focusin="onFormStart"
    >
      <p class="text-text-decorative type-ui">{{ t('contact.form_note') }}</p>

      <div class="contact-field flex flex-col gap-2 pt-3" :data-invalid="errors.from || undefined">
        <label for="contact-from" class="type-ui text-text-primary">{{ t('contact.from_label') }}</label>
        <input
          id="contact-from"
          ref="fromField"
          v-model="from"
          name="from"
          type="text"
          :placeholder="t('contact.from_placeholder')"
          :aria-invalid="Boolean(errors.from)"
          aria-describedby="contact-from-error"
          class="contact-input"
          @input="errors.from = ''"
        >
        <p id="contact-from-error" class="contact-error"><span>{{ errors.from }}</span></p>
      </div>

      <div class="contact-field flex flex-col gap-2 pt-3" :data-invalid="errors.message || undefined">
        <label for="contact-message" class="type-ui text-text-primary">{{ t('contact.message_label') }}</label>
        <textarea
          id="contact-message"
          ref="messageField"
          v-model="message"
          name="message"
          rows="4"
          :placeholder="t('contact.message_placeholder')"
          :aria-invalid="Boolean(errors.message)"
          aria-describedby="contact-message-error"
          class="contact-input contact-input--message"
          @input="errors.message = ''"
        />
        <p id="contact-message-error" class="contact-error"><span>{{ errors.message }}</span></p>
      </div>

      <div class="pt-4 gap-4 flex flex-col">
        <!-- the captcha's space is taken up front, so the form doesn't jump
             when the widget resolves -->
        <div class="contact-captcha">
          <NuxtTurnstile
            ref="turnstile"
            v-model="token"
            :site-key="turnstileContactSiteKey || undefined"
            :options="{ theme: 'light' }"
          />
        </div>

        <div class="contact-field contact-field--consent flex flex-col gap-2" :data-invalid="errors.consent || undefined">
          <div class="contact-consent">
            <input
              id="contact-consent"
              ref="consentField"
              v-model="consent"
              name="consent"
              type="checkbox"
              :aria-invalid="Boolean(errors.consent)"
              aria-describedby="contact-consent-error"
              class="contact-consent__box"
              @change="errors.consent = ''"
            >
            <label for="contact-consent" class="type-ui text-text-secondary">
              <i18n-t keypath="contact.consent" tag="span" scope="global">
                <template #consent>
                  <NuxtLink :to="localePath('/personal-data')" target="_blank" class="contact-consent__link">
                    {{ t('contact.consent_link') }}
                  </NuxtLink>
                </template>
                <template #policy>
                  <NuxtLink :to="localePath('/privacy')" target="_blank" class="contact-consent__link">
                    {{ t('contact.policy_link') }}
                  </NuxtLink>
                </template>
              </i18n-t>
            </label>
          </div>
          <p id="contact-consent-error" class="contact-error"><span>{{ errors.consent }}</span></p>
        </div>

        <button
          type="submit"
          class="contact-submit h-12 px-8 rounded-full bg-fill-strong hover:bg-accent-strong-hover active:bg-accent-default text-text-inverse type-cta text-nowrap w-fit"
          :aria-disabled="sending"
        >
          {{ sending ? t('contact.sending') : t('contact.submit') }}
        </button>

        <!-- role="status": the text is announced where it appears, without
             pulling focus out of the form -->
        <p class="contact-status" :data-state="status?.failed ? 'error' : undefined" role="status" aria-live="polite">
          {{ status?.text }}
        </p>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /*
   * Real inputs behind the mock's styling: highlighted on :focus rather than
   * :active, which on a field lasts only while the button is held.
   */
  .contact-input {
    width: 100%;
    padding-inline: var(--spacing-contact-field-padding-x);
    padding-block: calc(var(--spacing) * 3);
    border-radius: var(--radius-2xl);
    outline: 1px solid var(--color-border-default);
    background-color: var(--color-surface-field);
    color: var(--color-text-primary);
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
    transition: outline-color var(--duration-hover) var(--ease-out);

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &:focus {
      outline-color: var(--color-border-input);
    }
  }

  .contact-input--message {
    min-height: calc(var(--spacing) * 40);
    resize: vertical;
  }

  .contact-consent {
    display: flex;
    flex-direction: row;
    gap: calc(var(--spacing) * 2);
  }

  /*
   * Drawn by hand: the native control ignores the palette and brings its own
   * proportions. Centred against the first line of the label, not the block —
   * a wrapped second line goes below it, as it should.
   */
  .contact-consent__box {
    appearance: none;
    flex: none;
    width: calc(var(--spacing) * 4);
    height: calc(var(--spacing) * 4);
    /* takes the label's type so that 1lh below is the label's line, not the
       one inherited from the page */
    font-size: var(--text-ui);
    line-height: var(--text-ui--line-height);
    margin-top: calc((1lh - var(--spacing) * 4) / 2);
    border: 1px solid var(--color-border-input);
    border-radius: calc(var(--spacing) * 1);
    background-color: var(--color-surface-field);
    cursor: pointer;
    transition: background-color var(--duration-hover) var(--ease-out),
                border-color var(--duration-hover) var(--ease-out);
  }

  .contact-consent__box:hover {
    border-color: var(--color-text-secondary);
  }

  .contact-consent__box:checked {
    border-color: var(--color-fill-strong);
    background-color: var(--color-fill-strong);
    /* the tick is a mask, so it takes the colour of the surface underneath */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 6.2l2.4 2.4L9.5 4' fill='none' stroke='%23fff' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }

  .contact-field[data-invalid] .contact-consent__box {
    border-color: var(--color-text-critical);
  }

  .contact-consent__link {
    color: var(--color-accent-strong);
    transition: color var(--duration-hover) var(--ease-out);

    &:hover { color: var(--color-accent-strong-hover); }
    &:active {
      color: var(--color-accent-default);
      transition-duration: var(--duration-press);
    }
  }

  .contact-captcha {
    display: flex;
    align-items: center;
    width: calc(var(--spacing) * 75);
    max-width: 100%;
    min-height: calc(var(--spacing) * 16);
  }

  /*
   * Hints unfold rather than blink into place: a grid row animates from 0fr to
   * 1fr, which is the one way height goes from nothing to content smoothly.
   * The child clips itself, so the text doesn't spill while the row is short.
   */
  .contact-error {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    color: var(--color-text-critical);
    font-size: var(--text-ui);
    line-height: var(--text-ui--line-height);
    font-weight: var(--text-ui--font-weight);
    transition: grid-template-rows var(--duration-hover) var(--ease-out),
                opacity var(--duration-hover) var(--ease-out);
  }

  .contact-error > span {
    overflow: hidden;
    min-height: 0;
  }

  .contact-field[data-invalid] .contact-error {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  /* under the label's text rather than under the checkbox, and with a line of
     air above it — otherwise it reads as a third link in the sentence */
  .contact-field--consent .contact-error > span {
    display: block;
    padding-top: calc(var(--spacing) * 1.5);
    padding-left: calc(var(--spacing) * 6);
  }

  .contact-field[data-invalid] .contact-input {
    outline-color: var(--color-text-critical);
  }

  /* an empty outcome takes no space: no padding, no border, nothing */
  .contact-status {
    color: var(--color-text-primary);
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
  }

  .contact-status:empty {
    display: none;
  }

  .contact-status[data-state='error'] {
    color: var(--color-text-critical);
  }

  /* while it's sending, pressing again would only queue a duplicate */
  .contact-submit[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.7;
  }
}
</style>
