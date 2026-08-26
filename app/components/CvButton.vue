<script setup lang="ts">
/**
 * CV download. Renders nothing until the CMS has a file for either language.
 *
 * @remarks
 * The asset is served from the Sanity CDN, so `download` is advisory —
 * cross-origin responses open in a tab instead of saving.
 */
const { t } = useI18n()
const cvUrl = await useCvUrl()
</script>

<template>
  <a
    v-if="cvUrl"
    :href="cvUrl"
    download
    class="pill-button bg-fill-strong text-text-inverse hover:bg-accent-strong-hover active:bg-accent-default"
  >
    <span class="flex justify-center items-center size-4">
      <svg class="h-2.75 w-2.5" viewBox="0 0 10 11" fill="currentColor" aria-hidden="true">
        <path
          d="M9.456 9.91a.544.544 0 0 1 0 1.09H.544a.544.544 0 0 1 0-1.09zm-5-9.365a.544.544 0 1 1 1.088 0V7.06l2.919-2.524a.545.545 0 0 1 .712.825l-3.82 3.304a.544.544 0 0 1-.71 0L.824 5.362a.545.545 0 0 1 .712-.825l2.919 2.524z"
        />
      </svg>
    </span>
    <span>{{ t('nav.cv') }}</span>
  </a>
</template>
