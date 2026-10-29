<script setup lang="ts">
import type { ProjectItem } from '../../server/api/project.get'

/** The action row of a project: download first (the accent action), then the
 *  docs when the project has them, the repository and the website. Shared by
 *  the listing showcase and the landing page so the two can't drift apart.
 *
 *  Download is a plain link to the repo's latest-release page, where the
 *  assets are — no API call of ours, and nothing to keep in step with how the
 *  releases are packaged. */
const props = defineProps<{ item: Pick<ProjectItem, 'slug' | 'hasDocs' | 'repoUrl' | 'demoUrl'> }>()

const { t } = useI18n()
const localePath = useLocalePath()

const docsTo = computed(() => localePath(`/projects/${props.item.slug}/docs`))
const downloadUrl = computed(() => `${props.item.repoUrl.replace(/\/$/, '')}/releases/latest`)
</script>

<template>
  <!-- The same buttons as the contact section and the header: `pill-button`
       with the system's hover and press states. Download is the filled one. -->
  <div class="project-links flex flex-wrap items-center gap-1">
    <a
      :href="downloadUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="pill-button mr-2 bg-fill-strong text-text-inverse hover:bg-accent-strong-hover active:bg-accent-default"
    >
      <span>{{ t('projects.download_link') }}</span>
      <span aria-hidden="true">↓</span>
    </a>
    <NuxtLink v-if="item.hasDocs" :to="docsTo" class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse">
      <span>{{ t('projects.docs_link') }}</span>
      <span aria-hidden="true">→</span>
    </NuxtLink>
    <a
      :href="item.repoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse"
    >
      <span class="h-4 w-4 flex items-center justify-center">
        <svg class="size-2.75" viewBox="0 0 11 11" fill="currentColor" aria-hidden="true">
          <path
            d="M4.65136 8.0403C3.23339 7.86286 2.23438 6.8093 2.23438 5.44522C2.23438 4.89072 2.42773 4.29186 2.75 3.89262C2.61035 3.52664 2.63183 2.75033 2.79297 2.42873C3.22266 2.37327 3.80273 2.60617 4.14648 2.92778C4.55469 2.79469 4.98438 2.72815 5.51074 2.72815C6.03711 2.72815 6.4668 2.79469 6.85352 2.91669C7.18652 2.60617 7.77734 2.37327 8.20703 2.42873C8.35742 2.72815 8.37891 3.50446 8.23925 3.88152C8.583 4.30294 8.76562 4.86854 8.76562 5.44522C8.76562 6.8093 7.7666 7.84068 6.32714 8.0292C6.69238 8.27318 6.93945 8.80551 6.93945 9.41547V10.5689C6.93945 10.9015 7.208 11.0901 7.53027 10.957C9.47461 10.1917 11 8.18446 11 5.70029C11 2.56181 8.5293 0 5.48925 0C2.44922 0 0 2.5618 0 5.70029C0 8.16228 1.51464 10.2029 3.55566 10.9681C3.8457 11.0789 4.125 10.8794 4.125 10.58V9.69271C3.97461 9.75925 3.78125 9.80361 3.60938 9.80361C2.90039 9.80361 2.48144 9.40437 2.18066 8.66134C2.0625 8.36191 1.93359 8.18446 1.68652 8.1512C1.55761 8.1401 1.51464 8.08466 1.51464 8.01812C1.51464 7.88504 1.72949 7.78522 1.94433 7.78522C2.25586 7.78522 2.52441 7.98484 2.80371 8.39518C3.01855 8.71679 3.24414 8.86096 3.51269 8.86096C3.78125 8.86096 3.95313 8.76115 4.20019 8.50608C4.38281 8.31754 4.52246 8.1512 4.65136 8.0403Z"
          />
        </svg>
      </span>
      <span>{{ t('projects.repo_link') }}</span>
    </a>
    <a
      v-if="item.demoUrl"
      :href="item.demoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="pill-button text-text-primary hover:bg-surface-hover active:bg-fill-strong active:text-text-inverse"
    >
      <span>{{ t('projects.demo_link') }}</span>
      <span aria-hidden="true">↗</span>
    </a>
  </div>
</template>
