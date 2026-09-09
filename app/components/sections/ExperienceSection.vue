<script setup lang="ts">
interface Spec { label: string; value: string }
interface Job { period: string; title: string; description: string[] }

const { t, tm, rt } = useI18n()

// tm()'s generic return type collapses to Record<string, any> without a
// locale-message schema declared — item's real shape isn't recoverable here.
const specs = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tm('experience.specs') as unknown[]).map((item: any): Spec => ({
    label: rt(item.label),
    value: rt(item.value),
  })),
)

const jobs = computed(() =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (tm('experience.jobs') as unknown[]).map((item: any): Job => ({
    period: rt(item.period),
    title: rt(item.title),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description: (item.description as unknown[]).map((p: any) => rt(p)),
  })),
)
</script>

<template>
  <section
    id="experience"
    class="flex flex-col gap-y-section-header-gap py-section-padding-y"
    aria-labelledby="experience-title"
  >
    <h2 id="experience-title" class="type-display-xl text-text-primary">{{ t('experience.title') }}</h2>

    <!-- On a phone the jobs come first and the spec list follows; from 1024 they
         sit side by side, spec list on the left. -->
    <div class="grid grid-cols-1 grid-rows-2 lg:grid-cols-2 lg:grid-rows-1 gap-x-grid-gap gap-y-12">
      <dl class="flex flex-col gap-8 row-start-2 lg:row-start-1">
        <div v-for="spec in specs" :key="spec.label" class="spec-row">
          <dt>{{ spec.label }}</dt>
          <dd>{{ spec.value }}</dd>
        </div>
      </dl>

      <div class="flex flex-col items-end gap-12 row-start-1">
        <article v-for="job in jobs" :key="job.title" class="job">
          <p class="text-text-secondary type-ui">{{ job.period }}</p>
          <h3 class="text-text-primary type-display-md">{{ job.title }}</h3>
          <!-- One paragraph with breaks rather than several: the indent belongs
               to the opening line only. -->
          <p class="text-text-secondary type-body-lg indent-2">
            <template v-for="(para, i) in job.description" :key="i">
              <br v-if="i">{{ para }}
            </template>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Label left, value right, both aligned on the bottom edge — that is what
     lines the values up into an even column. */
  .spec-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-grid-gap);
    align-items: end;
  }

  .spec-row dt {
    font-size: var(--text-text);
    line-height: var(--text-text--line-height);
    font-weight: var(--text-text--font-weight);
    color: var(--color-text-secondary);
  }

  .spec-row dd {
    font-size: var(--text-body-lg);
    line-height: var(--text-body-lg--line-height);
    font-weight: var(--text-body-lg--font-weight);
    color: var(--color-text-primary);
  }

  .job {
    display: flex;
    flex-direction: column;
    gap: calc(var(--spacing) * 2.5);
  }

  @media (width >= 64rem) {
    .job {
      max-width: 38rem;
    }
  }
}
</style>
