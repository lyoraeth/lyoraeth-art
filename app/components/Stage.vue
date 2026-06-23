<script setup lang="ts">
const stage = ref<HTMLElement | null>(null)

let rafId: number
let targetX = 0, targetY = 0
let currentX = 0, currentY = 0

const onMouseMove = (e: MouseEvent) => {
  targetX = (e.clientX / window.innerWidth  - 0.5)
  targetY = (e.clientY / window.innerHeight - 0.5)
}

const tick = () => {
  currentX += (targetX - currentX) * 0.04
  currentY += (targetY - currentY) * 0.04
  stage.value?.style.setProperty('--mx', currentX.toFixed(4))
  stage.value?.style.setProperty('--my', currentY.toFixed(4))
  rafId = requestAnimationFrame(tick)
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  rafId = requestAnimationFrame(tick)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="stage" aria-hidden="true" ref="stage">
    <div class="blob b1" />
    <div class="blob b2" />
    <div class="blob b3" />
    <div class="blob b4" />
  </div>
</template>

<style scoped>
.stage {
  --mx: 0;
  --my: 0;
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
  background: radial-gradient(120% 90% at 50% -10%, var(--deep) 0%, var(--void) 55%);
}

.blob {
  position: absolute;
  filter: blur(90px) blur(0.5px);
  will-change: transform, border-radius;
}

@keyframes morph1 {
  0%, 100% { border-radius: 70% 30% 35% 65% / 65% 40% 60% 35% }
  25%       { border-radius: 35% 65% 65% 35% / 40% 70% 30% 60% }
  50%       { border-radius: 55% 45% 70% 30% / 30% 65% 45% 70% }
  75%       { border-radius: 45% 55% 30% 70% / 60% 30% 70% 40% }
}

@keyframes morph2 {
  0%, 100% { border-radius: 40% 60% 65% 35% / 60% 35% 65% 40% }
  30%       { border-radius: 65% 35% 35% 65% / 35% 65% 40% 60% }
  60%       { border-radius: 30% 70% 60% 40% / 65% 30% 60% 40% }
  85%       { border-radius: 55% 45% 40% 60% / 40% 55% 35% 65% }
}

@keyframes morph3 {
  0%, 100% { border-radius: 65% 35% 40% 60% / 40% 65% 35% 60% }
  35%       { border-radius: 35% 65% 60% 40% / 65% 35% 60% 40% }
  70%       { border-radius: 50% 50% 35% 65% / 35% 60% 65% 40% }
}

@keyframes morph4 {
  0%, 100% { border-radius: 35% 65% 60% 40% / 65% 35% 60% 40% }
  40%       { border-radius: 65% 35% 35% 65% / 35% 65% 40% 60% }
  70%       { border-radius: 45% 55% 65% 35% / 55% 45% 35% 65% }
}

.b1 {
  width: 48vw;
  height: 48vw;
  left: -8vw;
  top: -6vw;
  background: var(--teal);
  opacity: 0.55;
  animation: morph1 16s ease-in-out infinite;
  animation-delay: 0s;
  /* against mouse — feels near */
  transform: translate(
    calc(var(--mx) * -48px),
    calc(var(--my) * -32px)
  );
}

.b2 {
  width: 42vw;
  height: 42vw;
  right: -10vw;
  top: 24vh;
  background: var(--indigo);
  opacity: 0.5;
  animation: morph2 21s ease-in-out infinite;
  animation-delay: -7s;
  /* with mouse, more X than Y — different axis emphasis */
  transform: translate(
    calc(var(--mx) * 56px),
    calc(var(--my) * 18px)
  );
}

.b3 {
  width: 30vw;
  height: 30vw;
  left: 28vw;
  top: 130vh;
  background: var(--warm-haze);
  opacity: 0.42;
  animation: morph3 26s ease-in-out infinite;
  animation-delay: -13s;
  /* cross-axis: left with mouse X, down with mouse Y */
  transform: translate(
    calc(var(--mx) * -22px),
    calc(var(--my) * 44px)
  );
}

.b4 {
  width: 26vw;
  height: 26vw;
  right: 6vw;
  top: 230vh;
  background: var(--teal);
  opacity: 0.3;
  animation: morph4 19s ease-in-out infinite;
  animation-delay: -4s;
  /* with mouse X, against mouse Y — diagonal cross */
  transform: translate(
    calc(var(--mx) * 38px),
    calc(var(--my) * -28px)
  );
}
</style>
