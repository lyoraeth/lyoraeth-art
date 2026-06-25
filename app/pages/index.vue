<script setup lang="ts">
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Danil Klimov',
      url: 'https://lyoraeth.art',
      jobTitle: 'Frontend Developer',
      sameAs: [
        'https://github.com/lyoraeth',
        'https://t.me/lyoraeth',
      ],
    }),
  }],
})
</script>

<template>
  <main class="wrap">
    <HeroSection />
    <WorkSection />
    <StackSection />
    <ApproachSection />
    <WritingSection />
    <ContactSection />
  </main>
</template>
