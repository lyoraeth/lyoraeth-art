<script setup lang="ts">
const { t } = useI18n()

const note = ref('')

function onSubmit() {
  note.value = t('contact.note_demo')
}

/* ── Glow card ── */
const cardEl = ref<HTMLElement | null>(null)
useGlowCard(cardEl)

/* ── Scroll reveal ── */
const { observe } = useReveal()
onMounted(() => observe(cardEl.value))
</script>

<template>
  <section id="contact" class="section-contact">
    <div
      class="contact-card glass-card reveal rv-d1"
      ref="cardEl"
    >
      <div class="card-glare">
        <div class="glare-mb">
          <div class="glare-blob"></div>
          <div class="glare-blob-2"></div>
        </div>
      </div>

      <!-- Left: heading + CTA + channels -->
      <div class="contact-left">
        <h2 class="contact-heading">
          {{ t('contact.heading') }}<br>
          {{ t('contact.heading_before_acc') }}<span class="contact-acc">{{ t('contact.heading_acc') }}</span>
        </h2>
        <p class="contact-lead">{{ t('contact.lead') }}</p>

        <a href="#" class="contact-cta">
          {{ t('contact.cta') }} <span class="cta-arrow">→</span>
        </a>

        <div class="contact-channels">
          <a href="https://github.com/lyoraeth" class="channel-link" target="_blank" rel="noopener">
            <span>{{ t('contact.github') }}</span>
            <span class="channel-handle mono">{{ t('contact.github_handle') }}</span>
          </a>
          <a href="#" class="channel-link">
            <span>{{ t('contact.cv') }}</span>
            <span class="channel-handle mono">{{ t('contact.cv_note') }}</span>
          </a>
        </div>
      </div>

      <!-- Right: form -->
      <form class="contact-form" @submit.prevent="onSubmit">
        <span class="eyebrow form-label">{{ t('contact.form_label') }}</span>
        <input
          type="text"
          name="contact"
          :placeholder="t('contact.contact_placeholder')"
          autocomplete="off"
          required
        >
        <textarea
          name="msg"
          rows="3"
          :placeholder="t('contact.message_placeholder')"
          required
        ></textarea>
        <button type="submit">{{ t('contact.submit') }}</button>
        <p class="form-note mono" aria-live="polite">{{ note }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.section-contact {
  padding: clamp(4.375rem, 9vw, 8.75rem) 0;
}

.contact-card {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: clamp(1.875rem, 4vw, 3.5rem);
  align-items: start;
  border-radius: var(--radius-contact);
  padding: clamp(1.875rem, 4vw, 3.5rem);
}

/* ── Left column ────────────────────────────────────────────────────────────── */
.contact-left {
  position: relative;
  z-index: 2;
}

.contact-heading {
  font-family: 'Golos Text', 'Onest', sans-serif;
  font-size: clamp(1.75rem, 1rem + 2vw, 3.125rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.02;
  margin-bottom: 1.125rem;
}
.contact-acc {
  color: var(--ember);
}

.contact-lead {
  color: var(--mist);
  font-size: 0.9375rem;
  max-width: 34ch;
  margin-bottom: 1.625rem;
  line-height: 1.55;
}

.contact-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  background: var(--ember);
  color: #1a120b;
  font-weight: 600;
  font-size: 0.9375rem;
  padding: 0.875rem 1.375rem;
  border-radius: 0.6875rem;
  text-decoration: none;
  transition:
    transform 0.2s var(--ease-out-expo),
    box-shadow 0.25s var(--ease-silk),
    background 0.2s var(--ease-silk);
  box-shadow: 0 0.75rem 1.875rem -0.75rem oklch(72% 0.1 58 / 50%);
}
.contact-cta:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 1rem 2.25rem -0.75rem oklch(72% 0.1 58 / 65%);
  background: oklch(76% 0.1 58);
}
.contact-cta:active {
  transform: translateY(0.0625rem) scale(0.98);
  box-shadow: 0 0.5rem 1.25rem -0.75rem oklch(72% 0.1 58 / 40%);
}
.cta-arrow {
  display: inline-block;
  transition: transform 0.25s var(--ease-out-expo);
}
.contact-cta:hover .cta-arrow { transform: translateX(0.25rem); }
.contact-cta:active .cta-arrow { transform: translateX(0.125rem); }

.contact-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.125rem;
}
.channel-link {
  display: inline-flex;
  gap: 0.4375rem;
  align-items: center;
  padding: 0.5rem 0.8125rem;
  border: 1px solid var(--line-soft);
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--mist);
  font-size: 0.84375rem;
  transition:
    color       0.25s var(--ease-silk),
    border-color 0.25s var(--ease-silk),
    background   0.25s var(--ease-silk),
    transform    0.2s  var(--ease-out-expo);
}
.channel-link:hover {
  color: var(--ink);
  border-color: var(--line);
  background: oklch(100% 0 0 / 4%);
  transform: translateY(-0.0625rem);
}
.channel-link:active {
  transform: scale(0.97);
  background: oklch(100% 0 0 / 6%);
}
.channel-handle {
  color: var(--faint);
  font-size: 0.6875rem;
  transition: color 0.25s var(--ease-silk);
}
.channel-link:hover .channel-handle {
  color: var(--mist);
}

/* ── Form ───────────────────────────────────────────────────────────────────── */
.contact-form {
  position: relative;
  z-index: 2;
  border-left: 1px solid var(--line-soft);
  padding-left: clamp(0px, 2.5vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: 0;
}
.form-label {
  display: block;
  margin-bottom: 0.875rem;
  color: var(--faint);
}

.contact-form input,
.contact-form textarea {
  width: 100%;
  background: oklch(100% 0 0 / 3%);
  border: 1px solid var(--line-soft);
  border-radius: 0.625rem;
  padding: 0.75rem 0.875rem;
  color: var(--ink);
  font-family: 'Onest', sans-serif;
  font-size: 0.875rem;
  transition: border-color 0.25s var(--ease-silk);
  resize: vertical;
  margin-bottom: 0.625rem;
}
.contact-form input::placeholder,
.contact-form textarea::placeholder {
  color: var(--faint);
}
.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: oklch(72% 0.1 58 / 45%);
}

.contact-form button {
  width: 100%;
  background: oklch(100% 0 0 / 4%);
  border: 1px solid var(--line);
  border-radius: 0.625rem;
  color: var(--ink);
  font-family: 'Onest', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.75rem;
  cursor: pointer;
  transition:
    border-color 0.25s var(--ease-silk),
    background   0.25s var(--ease-silk),
    color        0.25s var(--ease-silk),
    transform    0.2s  var(--ease-out-expo);
}
.contact-form button:hover {
  border-color: var(--ember-border);
  background: var(--ember-bg);
  color: var(--ember);
}
.contact-form button:active {
  transform: scale(0.98);
  background: oklch(100% 0 0 / 6%);
  border-color: var(--line);
  color: var(--ink);
}

.form-note {
  font-size: 0.65625rem;
  color: var(--faint);
  min-height: 0.875rem;
  margin-top: 0.5rem;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 45em) {
  .contact-card {
    grid-template-columns: 1fr;
  }
  .contact-form {
    border-left: none;
    padding-left: 0;
    border-top: 1px solid var(--line-soft);
    padding-top: 1.625rem;
  }
}
</style>
