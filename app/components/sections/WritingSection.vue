<script setup lang="ts">
import type { PostItem } from '../../../server/api/posts.get'

const { t } = useI18n()
const localePath = useLocalePath()
const plural = usePlural()

const { data: posts } = await useFetch<PostItem[]>('/api/posts', {
  query: { limit: 0 },
  key: 'posts-all',
  default: () => [] as PostItem[],
})

const CARDS = 3

const shown = computed(() => posts.value.slice(0, CARDS))
const total = computed(() => posts.value.length)
</script>

<template>
  <section
    id="writing"
    class="flex flex-col gap-y-section-header-gap py-section-padding-y"
    aria-labelledby="writing-title"
  >
    <div class="section-header">
      <h2 id="writing-title" class="section-header__title type-display-xl text-text-primary">
        {{ t('writing.title') }}
      </h2>
      <span class="section-header__count type-ui text-text-secondary">
        {{ t(`writing.count_${plural(total)}`, { n: total }) }}
      </span>
      <NuxtLink
        :to="localePath('/writing')"
        class="section-header__action h-10 w-40 inline-flex justify-center items-center rounded-full type-ui text-text-inverse bg-fill-strong hover:bg-accent-strong-hover active:bg-accent-default"
      >
        {{ t('writing.see_all') }}
      </NuxtLink>
    </div>

    <!--
      Three cards, so the layout differs from work: two columns for a while,
      with the third taking the bottom row whole, and all three in a row from
      1280. Heights are levelled by auto-rows-fr, the floor lives in the card.
    -->
    <div class="layout-grid gap-grid-gap auto-rows-fr">
      <PostCard
        v-for="(post, i) in shown"
        :key="post._id"
        :item="post"
        :class="i === CARDS - 1 ? 'col-span-4 md:col-span-8 xl:col-span-4' : 'col-span-4'"
      />
    </div>
  </section>
</template>
