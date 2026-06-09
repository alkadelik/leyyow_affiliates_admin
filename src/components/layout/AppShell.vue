<template>
  <div class="shell">
    <!-- ── Sidebar ── -->
    <aside class="sidebar">
      <div class="sidebar__top">
        <!-- Logo -->
        <RouterLink to="/campaigns" class="logo">
          <div class="logo__icon"><i class="ti ti-leaf" aria-hidden="true" /></div>
          <div class="logo__text">ley<span>yow</span></div>
        </RouterLink>

        <!-- Nav -->
        <div class="nav-section">
          <div class="nav-label">Main</div>
          <NavItem to="/campaigns" icon="speakerphone"    label="Campaigns" />
          <NavItem to="/affiliates" icon="users"          label="Affiliates" />
          <NavItem to="/merchants" icon="building-store"  label="Merchants" />
        </div>

        <div class="nav-section" style="margin-top: 8px;">
          <div class="nav-label">Finance</div>
          <NavItem to="/wallet"  icon="wallet" label="Wallet" />
          <NavItem to="/payouts" icon="cash"   label="Payouts" />
        </div>
      </div>

      <!-- Bottom: Settings + user row -->
      <div class="sidebar__bottom">
        <NavItem to="/settings" icon="settings" label="Settings" />
        <div class="user-row" style="margin-top: 12px">
          <div class="user-avatar">{{ initials }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.full_name }}</div>
            <div class="user-role">{{ auth.user?.role === 'super_admin' ? 'Super admin' : 'Administrator' }}</div>
          </div>
          <button class="logout-btn" title="Sign out" @click="handleLogout">
            <i class="ti ti-logout" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Main content ── -->
    <main class="main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.fullPath" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavItem from './NavItem.vue'

const auth   = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  if (!auth.user?.full_name) return 'LA'
  return auth.user.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.sidebar__top    { padding: 24px 12px 16px; flex: 1; }
.sidebar__bottom { padding: 16px 12px; border-top: 1px solid var(--border); }

/* Logo */
.logo {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 32px; padding: 0 4px;
}
.logo__icon {
  width: 32px; height: 32px;
  background: var(--brand); border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.logo__icon i { font-size: 17px; color: var(--brand-deep); }
.logo__text {
  font-size: 17px; font-weight: 600;
  color: var(--brand-deep); letter-spacing: -0.5px;
}
.logo__text span { color: var(--brand); }

/* Nav sections */
.nav-section  { margin-bottom: 4px; }
.nav-label {
  font-size: 10px; font-weight: 600;
  color: var(--text-tertiary); text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 8px; margin-bottom: 4px; margin-top: 8px;
}

/* User row */
.user-row {
  display: flex; align-items: center; gap: 10px;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: var(--brand-deep);
  flex-shrink: 0;
}
.user-info  { flex: 1; min-width: 0; }
.user-name  { font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role  { font-size: 11px; color: var(--text-tertiary); margin-top: 1px; }
.logout-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 4px;
  border-radius: var(--radius-sm); transition: color 0.1s;
}
.logout-btn:hover { color: var(--red-text); }
.logout-btn i { font-size: 16px; display: block; }

/* ── Main ── */
.main {
  flex: 1;
  min-width: 0;
  padding: 32px 36px;
  overflow-y: auto;
}
</style>
