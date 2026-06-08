<template>
  <RouterLink :to="to" class="nav-item" :class="{ active: isActive }">
    <i :class="`ti ti-${icon}`" aria-hidden="true" />
    {{ label }}
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to:    { type: String, required: true },
  icon:  { type: String, required: true },
  label: { type: String, required: true },
})

const route = useRoute()
// Active if route starts with this path (handles nested routes)
const isActive = computed(() =>
  route.path === props.to || route.path.startsWith(props.to + '/')
)
</script>

<style scoped>
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 8px; border-radius: var(--radius-md);
  font-size: 13px; color: var(--text-secondary);
  cursor: pointer; margin: 1px 0;
  transition: background 0.1s, color 0.1s;
}
.nav-item:hover { background: var(--bg); color: var(--text-primary); }
.nav-item.active { background: var(--pollen); color: var(--brand-deep); font-weight: 500; }
.nav-item i { font-size: 17px; flex-shrink: 0; }
.nav-item.active i { color: var(--brand); }
</style>
