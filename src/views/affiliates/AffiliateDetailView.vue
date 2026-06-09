<template>
  <div v-if="loading"><AppLoader :page="true" /></div>

  <div v-else-if="!affiliate">
    <EmptyState icon="alert-circle" title="Affiliate not found" message="This affiliate doesn't exist or was removed." />
  </div>

  <div v-else>
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <RouterLink to="/affiliates">Affiliates</RouterLink>
      <i class="ti ti-chevron-right" />
      <span>{{ affiliate.full_name }}</span>
    </div>

    <!-- Page header -->
    <div class="page-header">
      <div>
        <div class="page-title">{{ affiliate.full_name }}</div>
        <div class="page-meta">Joined {{ fmt.date(affiliate.created_at) }}<template v-if="affiliate.last_login_at"> · Last login {{ fmt.date(affiliate.last_login_at) }}</template></div>
      </div>
      <div class="actions">
        <button class="btn" @click="showEditModal = true"><i class="ti ti-edit" /> Edit details</button>
        <button v-if="affiliate.status === 'invited'" class="btn btn--primary" :disabled="resendingInvite" @click="resendInvite"><i class="ti ti-mail-forward" /> {{ resendingInvite ? 'Sending…' : 'Resend invite' }}</button>
        <button v-if="affiliate.status === 'active' || affiliate.status === 'inactive'" class="btn btn--danger" @click="confirmDeactivate = true"><i class="ti ti-user-off" /> Deactivate</button>
        <button v-if="affiliate.status === 'deactivated'" class="btn btn--primary" :disabled="togglingStatus" @click="toggleStatus(true)"><i class="ti ti-user-check" /> {{ togglingStatus ? 'Reactivating…' : 'Reactivate' }}</button>
      </div>
    </div>

    <!-- 2-col layout -->
    <div class="layout-2col">

      <!-- LEFT: profile cards -->
      <div class="left-col">

        <!-- Profile card -->
        <div class="card">
          <div class="profile-head">
            <div class="avatar-lg">{{ initials(affiliate.full_name) }}</div>
            <div>
              <div class="profile-name">{{ affiliate.full_name }}</div>
              <!-- <span class="badge" :class="affiliate.is_active ? 'badge--green' : 'badge--gray'" style="margin-top:6px;display:inline-flex">
                <span class="badge-dot" />{{ affiliate.is_active ? 'Active' : 'Inactive' }}
              </span> -->
              <span class="badge" :class="fmt.affiliateStatus(affiliate.status).cls">
                <span class="badge-dot" />{{ fmt.affiliateStatus(affiliate.status).label }}
              </span>
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-mail" /> Email</span>
            <span class="detail-value" style="font-size:12px">{{ affiliate.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-phone" /> Phone</span>
            <span class="detail-value">{{ affiliate.phone || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-clock" /> Last referral</span>
            <span class="detail-value">{{ affiliate.last_referral_at ? fmt.date(affiliate.last_referral_at) : 'Never' }}</span>
          </div>
        </div>

        <!-- Bank details -->
        <div class="card">
          <div class="card-title">Bank details</div>
          <template v-if="bankAccount">
            <div class="detail-row"><span class="detail-label">Bank</span><span class="detail-value">{{ bankAccount.bank_name }}</span></div>
            <div class="detail-row"><span class="detail-label">Account name</span><span class="detail-value">{{ bankAccount.account_name }}</span></div>
            <div class="detail-row"><span class="detail-label">Account number</span><span class="detail-value mono">••••••{{ bankAccount.account_number?.slice(-4) }}</span></div>
          </template>
          <div v-else class="empty-inline">No bank account added yet</div>
        </div>

        <!-- Wallet & payouts -->
        <div class="card">
          <div class="card-title">Wallet &amp; payouts</div>
          <div class="detail-row">
            <span class="detail-label">Current balance</span>
            <span class="detail-value" style="font-size:15px;color:var(--green-text)">{{ fmt.naira(wallet.balance) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total paid out</span>
            <span class="detail-value">{{ fmt.naira(wallet.total_paid_out) }}</span>
          </div>
          <div class="detail-row" v-if="pendingPayout">
            <span class="detail-label">Payout status</span>
            <span class="badge badge--amber">Pending request</span>
          </div>
        </div>

      </div>

      <!-- RIGHT: stats + tables -->
      <div class="right-col">

        <!-- Stats grid -->
        <div class="stats-grid-3">
          <div class="stat-sm">
            <div class="stat-sm-label">Total earned</div>
            <div class="stat-sm-value">{{ fmt.naira(analytics.total_earned) }}</div>
            <div class="stat-sm-sub">All campaigns</div>
          </div>
          <div class="stat-sm">
            <div class="stat-sm-label">Total sales</div>
            <div class="stat-sm-value">{{ analytics.total_sales ? fmt.naira(analytics.total_sales) : '—' }}</div>
            <div class="stat-sm-sub">All campaigns</div>
          </div>
          <div class="stat-sm stat-sm--green">
            <div class="stat-sm-label">Conversion rate</div>
            <div class="stat-sm-value stat-sm-value--green">{{ analytics.conversion_rate || '—' }}</div>
            <div class="stat-sm-sub">Signups to subs</div>
          </div>
          <div class="stat-sm stat-sm--green">
            <div class="stat-sm-label">Overall ROI</div>
            <div class="stat-sm-value stat-sm-value--green">{{ analytics.roi || '—' }}</div>
            <div class="stat-sm-sub">All campaigns</div>
          </div>
          <div class="stat-sm">
            <div class="stat-sm-label">Total campaigns</div>
            <div class="stat-sm-value">{{ analytics.total_campaigns ?? 0 }}</div>
            <div class="stat-sm-sub">{{ analytics.live_campaigns ?? 0 }} live, {{ analytics.ended_campaigns ?? 0 }} ended</div>
          </div>
          <div class="stat-sm">
            <div class="stat-sm-label">Subscriptions</div>
            <div class="stat-sm-value">{{ analytics.total_conversions ?? 0 }}</div>
            <div class="stat-sm-sub">All campaigns</div>
          </div>
        </div>

        <!-- Campaign history -->
        <div class="full-card">
          <div class="full-card-header"><div class="section-label">Campaign history</div></div>
          <AppLoader v-if="loadingCampaigns" />
          <table v-else-if="campaigns.length">
            <thead>
              <tr>
                <th style="width:28%">Campaign</th>
                <th style="width:13%">Status</th>
                <th style="width:13%">Earned</th>
                <th style="width:12%">Sales</th>
                <th style="width:12%">Conv. rate</th>
                <th style="width:9%">ROI</th>
                <th style="width:13%">Dates</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in campaigns" :key="c.campaign_id" class="table-row" @click="$router.push(`/campaigns/${c.campaign_id}`)">
                <td style="font-weight:500">{{ c.campaign_name }}</td>
                <td><span class="badge" :class="fmt.campaignStatus(c.status).cls">{{ fmt.campaignStatus(c.status).label }}</span></td>
                <td style="font-weight:500">{{ fmt.naira(c.total_earned) }}</td>
                <td>{{ c.total_sales ? fmt.naira(c.total_sales) : '—' }}</td>
                <td :class="c.conversion_rate > 50 ? 'metric-positive' : ''">{{ c.conversion_rate != null ? c.conversion_rate + '%' : '—' }}</td>
                <td :class="c.roi > 10 ? 'metric-positive' : ''">{{ c.roi != null ? c.roi + '%' : '—' }}</td>
                
                <td class="muted" style="font-size:11px">{{ fmt.shortDate(c.start_date) }}<template v-if="c.end_date">–{{ fmt.shortDate(c.end_date) }}</template></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-inline">No campaigns yet</div>
        </div>

        <!-- Payout history -->
        <div class="full-card">
          <div class="full-card-header"><div class="section-label">Payout history</div></div>
          <AppLoader v-if="loadingPayouts" />
          <table v-else-if="payouts.length">
            <thead>
              <tr>
                <th style="width:18%">Date</th>
                <th style="width:18%">Amount</th>
                <th style="width:34%">Account details</th>
                <th style="width:15%">Balance after</th>
                <th style="width:15%">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payouts" :key="p.id">
                <td class="muted">{{ fmt.date(p.requested_at) }}</td>
                <td style="font-weight:500">{{ fmt.naira(p.amount) }}</td>
                <td>Bank and account #</td>
                <td class="muted">{{ p.balance_after ? fmt.naira(p.balance_after) : '—' }}</td>
                <td>
                  <span class="badge" :class="fmt.payoutStatus(p.status).cls">{{ fmt.payoutStatus(p.status).label }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-inline">No payout history yet</div>
        </div>

      </div>
    </div>

    <!-- Merchants referred -->
    <div class="full-card" style="margin-top:4px">
      <div class="full-card-header">
        <div class="section-label">
          Merchants referred
          <span class="count-label">({{ merchants.length }} total)</span>
        </div>
        <div class="filter-pills">
          <button v-for="f in merchantFilters" :key="f.value" class="pill-sm" :class="{ 'pill-sm--active': merchantFilter === f.value }" @click="merchantFilter = f.value">{{ f.label }}</button>
        </div>
      </div>
      <AppLoader v-if="loadingMerchants" />
      <table v-else-if="filteredMerchants.length">
        <thead>
          <tr>
            <th style="width:22%">Merchant</th>
            <th style="width:20%">Campaign</th>
            <th style="width:13%">Attribution</th>
            <th style="width:15%">Signed up</th>
            <th style="width:15%">Subscribed</th>
            <th style="width:15%">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in filteredMerchants" :key="m.merchant_id">
            <td>
              <div style="font-weight:500">{{ m.merchant_name }}</div>
              <div class="muted" style="font-size:11px">{{ m.merchant_id }}</div>
            </td>
            <td class="muted" style="font-size:12px">{{ m.campaign_name }}</td>
            <td><span class="tag">{{ m.attribution_source === 'affiliate_code' ? 'Code' : 'Link' }}</span></td>
            <td class="muted">{{ fmt.date(m.signed_up_at) }}</td>
            <td class="muted">{{ m.subscription_start ? fmt.date(m.subscription_start) : '—' }}</td>
            <td>
              <span class="badge" :class="m.status === 'subscribed' ? 'badge--green' : 'badge--gray'">{{ m.status === 'subscribed' ? 'Subscribed' : 'Signed up only' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-inline">No merchants referred yet</div>
    </div>

    <!-- Confirm deactivate -->
    <ConfirmModal
      :visible="confirmDeactivate"
      title="Deactivate affiliate?"
      message="This affiliate will lose access to the portal and will not appear in future campaign assignments."
      confirm-label="Deactivate"
      variant="danger"
      :loading="togglingStatus"
      @confirm="toggleStatus(false)"
      @cancel="confirmDeactivate = false"
    />

    <!-- Edit modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showEditModal" class="overlay" @click.self="showEditModal = false">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-title">Edit affiliate details</div>
              <button class="modal-close" @click="showEditModal = false"><i class="ti ti-x" /></button>
            </div>
            <div class="field">
              <label>Full name</label>
              <input v-model="editForm.full_name" type="text" />
            </div>
            <div class="modal-actions">
              <button class="btn" @click="showEditModal = false">Cancel</button>
              <button class="btn btn--primary" :disabled="saving" @click="saveEdit">
                <i v-if="saving" class="ti ti-loader-2 spin" /> {{ saving ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader   from '@/components/ui/AppLoader.vue'
import EmptyState  from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const fmt   = useFormat()
const toast = useToastStore()

const loading          = ref(true)
const loadingCampaigns = ref(false)
const loadingPayouts   = ref(false)
const loadingMerchants = ref(false)
const affiliate        = ref(null)
const analytics        = ref({})
const wallet           = ref({ balance: 0, total_paid_out: 0 })
const bankAccount      = ref(null)
const pendingPayout    = ref(false)
const campaigns        = ref([])
const payouts          = ref([])
const merchants        = ref([])
const merchantFilter   = ref('all')
const confirmDeactivate = ref(false)
const togglingStatus   = ref(false)
const resendingInvite  = ref(false)
const showEditModal    = ref(false)
const editForm         = ref({ full_name: '' })
const saving           = ref(false)

const merchantFilters = [
  { label: 'All',            value: 'all'        },
  { label: 'Subscribed',     value: 'subscribed' },
  { label: 'Signed up only', value: 'signup'     },
]

const filteredMerchants = computed(() => {
  if (merchantFilter.value === 'subscribed') return merchants.value.filter(m => m.status === 'subscribed')
  if (merchantFilter.value === 'signup')     return merchants.value.filter(m => m.status !== 'subscribed')
  return merchants.value
})

function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  const id = route.params.id
  try {
    const { data } = await api.get(`/admin/affiliates/${id}/`)
    affiliate.value      = data
    editForm.value.full_name = data.full_name
    // wallet_balance comes directly on the affiliate response
    wallet.value = {
      balance:       data.wallet_balance ?? 0,
      total_paid_out: data.total_paid_out ?? 0,
    }
    bankAccount.value   = data.default_bank_account ?? null
    pendingPayout.value = data.has_pending_payout   ?? false
  } catch { affiliate.value = null }
  finally { loading.value = false }

  loadAnalytics()
  loadCampaigns()
  loadPayouts()
  loadMerchants()
})

async function loadAnalytics() {
  try {
    const { data } = await api.get(`/admin/analytics/affiliates/${route.params.id}/`)
    analytics.value = data
  } catch { analytics.value = {} }
}

async function loadCampaigns() {
  loadingCampaigns.value = true
  try {
    const { data } = await api.get(`/admin/affiliates/${route.params.id}/campaigns/`)
    campaigns.value = data.results ?? data
  } catch { campaigns.value = [] }
  finally { loadingCampaigns.value = false }
}

async function loadPayouts() {
  loadingPayouts.value = true
  try {
    const { data } = await api.get('/admin/payouts/', { params: { affiliate: route.params.id } })
    payouts.value = data.results ?? data
  } catch { payouts.value = [] }
  finally { loadingPayouts.value = false }
}

async function loadMerchants() {
  loadingMerchants.value = true
  try {
    const { data } = await api.get('/admin/tracking/merchant-leads/', { params: { affiliate: route.params.id } })
    merchants.value = data.results ?? data
  } catch { merchants.value = [] }
  finally { loadingMerchants.value = false }
}

async function toggleStatus(activate) {
  togglingStatus.value = true
  try {
    const { data } = await api.patch(`/admin/affiliates/${route.params.id}/status/`, { is_active: activate })
    affiliate.value.status = data.status
    confirmDeactivate.value = false
    toast.show(activate ? 'Affiliate activated.' : 'Affiliate deactivated.', 'success')
  } catch { toast.show('Failed to update status.', 'error') }
  finally { togglingStatus.value = false }
}

async function resendInvite() {
  resendingInvite.value = true
  try {
    await api.post(`/admin/affiliates/${route.params.id}/resend-invite/`)
    toast.show('Invite resent.', 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to resend invite.', 'error')
  } finally {
    resendingInvite.value = false
  }
}

async function saveEdit() {
  saving.value = true
  try {
    const { data } = await api.patch(`/admin/affiliates/${route.params.id}/`, { full_name: editForm.value.full_name })
    affiliate.value.full_name = data.full_name
    showEditModal.value = false
    toast.show('Details updated.', 'success')
  } catch { toast.show('Failed to save changes.', 'error') }
  finally { saving.value = false }
}
</script>

<style scoped>
.page-meta   { font-size:12px;color:var(--text-tertiary);margin-top:4px }
.actions     { display:flex;gap:8px;flex-shrink:0 }
.layout-2col { display:grid;grid-template-columns:268px 1fr;gap:16px;align-items:start;margin-bottom:16px }
.left-col,.right-col { display:flex;flex-direction:column;gap:14px }
.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px }
.card-title { font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px }
.profile-head { display:flex;align-items:center;gap:12px;margin-bottom:16px }
.avatar-lg  { width:52px;height:52px;border-radius:50%;background:var(--pollen);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:600;color:var(--amber-text);flex-shrink:0 }
.profile-name { font-size:15px;font-weight:600 }
.detail-row  { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px }
.detail-row:last-child { border-bottom:none }
.detail-label { color:var(--text-secondary);display:flex;align-items:center;gap:6px }
.detail-label i { font-size:14px;color:var(--text-tertiary) }
.detail-value { font-weight:500;text-align:right }
.mono { font-family:monospace;font-size:12px }
.empty-inline { padding:20px;font-size:13px;color:var(--text-tertiary);text-align:center }
.stats-grid-3 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px }
.stat-sm      { background:var(--surface-warm);border-radius:var(--radius-md);padding:12px 14px;border:1px solid var(--border) }
.stat-sm--green { background:#F0FBF5;border-color:#B8E8D0 }
.stat-sm-label { font-size:10px;font-weight:500;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px }
.stat-sm-value { font-size:18px;font-weight:600;letter-spacing:-0.4px;line-height:1 }
.stat-sm-value--green { color:var(--green-text) }
.stat-sm-sub  { font-size:11px;color:var(--text-tertiary);margin-top:3px }
.full-card    { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;margin-bottom:14px }
.full-card-header { display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border) }
.section-label { font-size:14px;font-weight:600;letter-spacing:-0.2px }
.count-label   { font-size:12px;font-weight:400;color:var(--text-tertiary) }
.metric-positive { color:var(--green-text);font-weight:500 }
.tag { display:inline-block;padding:2px 9px;border-radius:99px;font-size:11px;background:var(--bg);color:var(--text-secondary);border:1px solid var(--border) }
.filter-pills { display:flex;gap:6px }
.pill-sm { padding:4px 11px;border-radius:99px;border:1px solid var(--border);background:var(--surface);font-size:11px;color:var(--text-secondary);cursor:pointer;font-family:var(--font);transition:all 0.1s }
.pill-sm--active { background:var(--brand);border-color:var(--brand);color:var(--brand-deep);font-weight:600 }
th { padding:10px 18px }
td { padding:12px 18px }
</style>
