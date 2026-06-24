<template>
  <div class="grain" aria-hidden="true" />
</template>

<style scoped>
.grain {
  position: fixed;
  inset: -20px;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.085;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 190px;
  animation: grain 0.5s steps(1) infinite;
  will-change: transform;
}

@keyframes grain {
  0%   { transform: translate(0,    0) }
  10%  { transform: translate(-4px, 3px) }
  20%  { transform: translate(5px, -4px) }
  30%  { transform: translate(-3px, 5px) }
  40%  { transform: translate(4px, -3px) }
  50%  { transform: translate(-5px, 4px) }
  60%  { transform: translate(3px, -5px) }
  70%  { transform: translate(-4px, 3px) }
  80%  { transform: translate(5px,  4px) }
  90%  { transform: translate(-3px, -4px) }
  100% { transform: translate(0,    0) }
}
</style>
