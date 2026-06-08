<template>
  <div :class="['loader', { 'loader--page': page }]">
    <div class="loader__ring" />
  </div>
</template>

<script setup>
defineProps({ page: { type: Boolean, default: false } })
</script>

<style scoped>
.loader {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.loader--page {
  min-height: 60vh;
}
.loader__ring {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--border);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
