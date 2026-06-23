  <script setup lang="ts">
  const { t } = useI18n()

  const { data: items } = await useFetch('/api/work', { default: () => [] })

  const headRef = ref<HTMLElement | null>(null)
  const { observe } = useReveal()
  onMounted(() => observe(headRef.value))


  </script>

  <template>
    <section id="work" class="section-work">
      <div class="sec-head reveal" ref="headRef">
        <h2>{{ t('work.title') }}</h2>
        <span class="eyebrow">{{ t('work.subtitle') }}</span>
      </div>

      <div class="work-list">
        <WorkCard
          v-for="(item, i) in items"
          :key="item._id"
          :item="item"
          :index="i"
          :reverse="i % 2 === 1"
        />
      </div>

      <div class="view-all-wrap">
        <NuxtLink to="/work" class="view-all">{{ t('work.see_all') }} <span class="va-arrow">→</span></NuxtLink>
      </div>
    </section>
  </template>

  <style scoped>
  .section-work {
    padding: clamp(4.375rem, 9vw, 8.75rem) 0;
  }
  .work-list {
    display: flex;
    flex-direction: column;
    gap: 1.375rem;
  }
  .view-all-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
  .view-all {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--ember);
    font-size: 0.9375rem;
    text-decoration: none;
  }
  .va-arrow {
    display: inline-block;
    transition: transform 0.3s var(--ease-out-expo);
  }
  .view-all:hover .va-arrow { transform: translateX(0.25rem); }
  </style>
