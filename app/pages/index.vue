<script setup lang="ts">
const track = useTrack()
let sectionIo: IntersectionObserver | null = null

onMounted(() => {
  // One observer over the homepage sections — fire section-view once each
  sectionIo = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const el = e.target as HTMLElement
      const name = el.id || (el.classList.contains('hero') ? 'hero' : el.tagName.toLowerCase())
      track(EV.sectionView, { section: name })
      sectionIo?.unobserve(el)
    }
  }, { threshold: 0.3 })
  document.querySelectorAll<HTMLElement>('.wrap > *').forEach(s => sectionIo!.observe(s))
})
onUnmounted(() => sectionIo?.disconnect())

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
