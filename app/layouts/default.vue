<script setup lang="ts">
/**
 * Dark shell — everything the site looked like before the redesign: atmosphere
 * stage, glass navigation, curtain footer. Still serves every page except the
 * home page and retires once they move to the light one.
 */
useHead({ htmlAttrs: { class: 'shell-legacy' } })
</script>

<template>
  <div>
    <!-- SVG glass filter — referenced by url(#glass-caustic) in any component -->
    <svg width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none">
      <defs>
        <filter id="glass-caustic" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="linearRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.38 0.28" numOctaves="2" seed="9" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>

    <Grain />
    <SiteNav />
    <MobileDock />
    <main id="main-content" class="page">
      <Stage />
      <slot />
      <SiteFooter />
    </main>
    <!-- After <main> so it can flow as a plain footer on touch devices;
         on fine pointers it's position:fixed and DOM order doesn't matter. -->
    <SiteCurtain />
  </div>
</template>

<style>
html.shell-legacy {
  overflow-x: hidden;
}

html.shell-legacy body {
  background: var(--void);
  color: var(--ink);
  font-family: 'Onest', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  line-height: 1.5;
}

.page {
  position: relative;
  z-index: 1;
  background: var(--void);
  min-height: 100vh;
  min-height: 100svh;
}
</style>
