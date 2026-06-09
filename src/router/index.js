/**
 * src/router/index.js
 *
 * All routes for the admin portal.
 * Auth guard: unauthenticated users → /login
 * Already-logged-in users hitting /login → /campaigns
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ── Lazy-loaded views ────────────────────────────────────────────────────────
const LoginView            = () => import('@/views/auth/LoginView.vue')
const ForgotPasswordView   = () => import('@/views/auth/ForgotPasswordView.vue')
const ResetPasswordView    = () => import('@/views/auth/ResetPasswordView.vue')

const AppShell             = () => import('@/components/layout/AppShell.vue')

const CampaignsListView    = () => import('@/views/campaigns/CampaignsListView.vue')
const CampaignDetailView   = () => import('@/views/campaigns/CampaignDetailView.vue')
const CampaignCreateView   = () => import('@/views/campaigns/CampaignCreateView.vue')
const CampaignEditView   = () => import('@/views/campaigns/CampaignEditView.vue')

const AffiliatesListView   = () => import('@/views/affiliates/AffiliatesListView.vue')
const AffiliateDetailView  = () => import('@/views/affiliates/AffiliateDetailView.vue')

const PayoutsView          = () => import('@/views/payouts/PayoutsView.vue')
const WalletView           = () => import('@/views/wallet/WalletView.vue')

const MerchantsListView    = () => import('@/views/merchants/MerchantsListView.vue')
const MerchantDetailView   = () => import('@/views/merchants/MerchantDetailView.vue')

const SettingsView         = () => import('@/views/settings/SettingsView.vue')

const routes = [
  // ── Auth (no shell) ──────────────────────────────────────────────────────
  { path: '/login',          component: LoginView,          meta: { public: true } },
  { path: '/forgot-password', component: ForgotPasswordView, meta: { public: true } },
  { path: '/reset-password', component: ResetPasswordView,  meta: { public: true } },

  // ── Authenticated (inside AppShell) ──────────────────────────────────────
  {
    path: '/',
    component: AppShell,
    redirect: '/campaigns',
    children: [
      { path: 'campaigns', name: 'campaigns', component: CampaignsListView },
      { path: 'campaigns/new', name: 'campaign-create', component: CampaignCreateView },
      { path: 'campaigns/:id/edit', name: 'campaign-edit', component: CampaignEditView},
      { path: 'campaigns/:id', name: 'campaign-detail', component: CampaignDetailView },
      { path: 'affiliates', name: 'affiliates', component: AffiliatesListView },
      { path: 'affiliates/:id', name: 'affiliate-detail', component: AffiliateDetailView },
      { path: 'payouts', name: 'payouts', component: PayoutsView },
      { path: 'wallet', name: 'wallet', component: WalletView },
      { path: 'merchants', name: 'merchants', component: MerchantsListView },
      { path: 'merchants/:merchant_id', name: 'merchant-detail', component: MerchantDetailView },
      { path: 'settings', name: 'settings', component: SettingsView },
    ],
  },

  // ── Catch-all ────────────────────────────────────────────────────────────
  { path: '/:pathMatch(.*)*', redirect: '/campaigns' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ── Navigation guard ─────────────────────────────────────────────────────────
router.beforeEach(async to => {
  const auth = useAuthStore()

  // Initialise auth from stored token on first navigation
  if (!auth.isAuthenticated && localStorage.getItem('access_token')) {
    await auth.init()
  }

  if (to.meta.public) {
    // Redirect already-logged-in users away from auth pages
    if (auth.isAuthenticated) return '/campaigns'
    return true
  }

  if (!auth.isAuthenticated) return '/login'
  return true
})

export default router
