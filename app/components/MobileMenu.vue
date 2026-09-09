<script setup lang="ts">
/**
 * Phone menu: a panel under the header covering the rest of the viewport.
 *
 * @remarks
 * Not a `<dialog>` — that lives in the top layer and would cover the header,
 * while the burger has to stay pressable. Isolation of the page behind it is
 * therefore the shell's job, through `inert`.
 */
defineProps<{ links: { label: string; to: string }[] }>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
</script>

<template>
  <div
    id="mobile-menu"
    class="mobile-menu wrapper gap-6 py-8 flex flex-col justify-between bg-surface-header"
    :data-open="open || undefined"
  >
    <nav class="w-full" :aria-label="t('nav.mobile_nav')">
      <ul class="w-full flex flex-col gap-1">
        <li v-for="link in links" :key="link.to">
          <NuxtLink :to="link.to" class="menu-link type-nav" @click="open = false">
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="flex flex-row gap-1 px-page-padding-x">
      <LangButton />
      <CvButton />
    </div>
  </div>
</template>

<style scoped>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  .mobile-menu {
    position: fixed;
    inset: var(--spacing-header-height) 0 0 0;
    z-index: 1;
    background-color: var(--color-surface-page);

    /* closed: parked above the viewport and out of focus order */
    translate: 0 -100%;
    visibility: hidden;
    transition: translate var(--duration-menu) var(--ease-out),
                visibility var(--duration-menu) var(--ease-out);
  }

  .mobile-menu[data-open] {
    translate: 0 0;
    visibility: visible;
  }

  @media (width >= 64rem) {
    .mobile-menu {
      display: none;
    }
  }

  .menu-link {
    display: inline-flex;
    align-items: center;
    width: 100%;
    height: calc(var(--spacing) * 24);
    padding-inline: var(--spacing-page-padding-x);
    color: var(--color-text-primary);
    transition: background-color var(--duration-hover) var(--ease-out),
                color var(--duration-hover) var(--ease-out);
  }

  .menu-link:hover { background-color: var(--color-surface-hover); }

  .menu-link:active {
    background-color: var(--color-fill-strong);
    color: var(--color-text-inverse);
    transition-duration: var(--duration-press);
  }
}
</style>

<style>
/* In the components layer, so utility classes in the markup still win. */
@layer components {
  /* Global on purpose: the page behind an open menu must not scroll. */
  html:has(.mobile-menu[data-open]) {
    overflow: hidden;
  }
}
</style>
