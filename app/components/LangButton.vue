<script setup lang="ts">
/**
 * Language toggle. Shows the language currently in use and leads to the other
 * one — a link rather than a button, because switching is navigation.
 */
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const track = useTrack()

const other = computed(() => (locale.value === 'ru' ? 'en' : 'ru') as 'en' | 'ru')

// drop the hash: the target section may not exist on the other locale's page
const target = computed(() => switchLocalePath(other.value).split('#')[0] || '/')
</script>

<template>
  <NuxtLink
    :to="target"
    :aria-label="t('nav.lang_switch')"
    class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse"
    @click="track(EV.langSwitch, { from: locale, to: other })"
  >
    <span class="flex justify-center items-center size-4">
      <!-- on currentColor, so it goes white along with the label on press -->
      <svg class="size-2.75" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true">
        <path
          d="M5.5 0a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11M1.125 6.045a4.41 4.41 0 0 0 3.104 3.678 7.7 7.7 0 0 1-1.235-3.678zm6.88 0A7.7 7.7 0 0 1 6.77 9.723a4.41 4.41 0 0 0 3.105-3.678zm-3.918 0A6.64 6.64 0 0 0 5.5 9.623a6.64 6.64 0 0 0 1.413-3.578zm2.683-4.77a7.7 7.7 0 0 1 1.236 3.68h1.87a4.41 4.41 0 0 0-3.106-3.68m-1.27.101a6.64 6.64 0 0 0-1.413 3.58h2.826A6.64 6.64 0 0 0 5.5 1.375m-1.27-.1a4.41 4.41 0 0 0-3.105 3.68h1.87a7.7 7.7 0 0 1 1.234-3.68"
        />
      </svg>
    </span>
    <span>{{ locale.toUpperCase() }}</span>
  </NuxtLink>
</template>
