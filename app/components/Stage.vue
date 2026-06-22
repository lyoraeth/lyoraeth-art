<template>
  <div class="stage" aria-hidden="true">
    <div class="blob b1" />
    <div class="blob b2" />
    <div class="blob b3" />
    <div class="blob b4" />
  </div>
</template>

<style scoped>
.stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: radial-gradient(120% 90% at 50% -10%, var(--deep) 0%, var(--void) 55%);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.b1 {
  width: 48vw;
  height: 48vw;
  left: -8vw;
  top: -6vw;
  background: var(--teal);
  opacity: 0.55;
}

.b2 {
  width: 42vw;
  height: 42vw;
  right: -10vw;
  top: 24vh;
  background: var(--indigo);
  opacity: 0.5;
}

.b3 {
  width: 30vw;
  height: 30vw;
  left: 28vw;
  top: 130vh;
  background: var(--warm-haze);
  opacity: 0.42;
}

.b4 {
  width: 26vw;
  height: 26vw;
  right: 6vw;
  top: 230vh;
  background: var(--teal);
  opacity: 0.3;
}
</style>
