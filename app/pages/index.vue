<script setup lang="ts">
definePageMeta({ layout: 'redesign' })
</script>

<template>
  <div class="flex flex-col gap-y-section-gap">
    <!-- Single root element, and no comment or text as its sibling: <NuxtPage>
         wraps the page in <Transition mode="out-in">, which needs exactly one
         element node to swap. A Fragment root (multiple nodes, or a v-if root)
         leaves the incoming page unmounted on a client-side navigation. -->
    <HeroSection />
    <WorkSection />
    <ExperienceSection />
    <WritingSection />
    <ContactSection />
  </div>
</template>
