<template>
  <div class="stage" aria-hidden="true" />
</template>

<style scoped>
/* Static background — a dark base plus a faint cool→warm→cool tint drift down
   the page. Every tinted layer is deliberately LARGER than the viewport: at
   that scale an ellipse reads as shading, not a shape, which avoids the
   "frozen blob" look. Alphas stay in single digits / low teens — barely
   visible; the grain overlay carries the texture. Non-black so the
   header/dropdown glass has something to blur. */
.stage {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  user-select: none;
  contain: layout style paint;
  background:
    /* darkened side edges */
    linear-gradient(90deg, oklch(0% 0 0 / 14%), transparent 15%, transparent 85%, oklch(0% 0 0 / 14%)),
    /* cool tint up top */
    radial-gradient(ellipse 130vw 90vh at 20% -10vh, color-mix(in srgb, var(--teal) 12%, transparent), transparent 60%),
    radial-gradient(ellipse 130vw 100vh at 85% 120vh, color-mix(in srgb, var(--indigo) 10%, transparent), transparent 60%),
    /* warm tint mid-page */
    radial-gradient(ellipse 120vw 90vh at 40% 210vh, color-mix(in srgb, var(--warm-haze) 10%, transparent), transparent 62%),
    /* cool tint further down */
    radial-gradient(ellipse 130vw 110vh at 70% 330vh, color-mix(in srgb, var(--teal) 8%, transparent), transparent 60%),
    /* overhead gradient + base */
    radial-gradient(120% 90% at 50% -10%, var(--deep) 0%, var(--void) 58%);
}
</style>
