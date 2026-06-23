<script setup lang="ts">
const { t } = useI18n()

const { data: items } = await useFetch('/api/work', { default: () => [] })

const headRef = ref<HTMLElement | null>(null)
const { observe } = useReveal()
onMounted(() => observe(headRef.value))

const reversed = [false, true, false]
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
        :reverse="reversed[i] ?? false"
      />
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
</style>
