<template>
  <div v-if="loading"><AppLoader :page="true" /></div>

  <div v-else-if="!campaign">
    <EmptyState icon="alert-circle" title="Campaign not found" message="This campaign doesn't exist or was removed." />
  </div>

  <div v-else>
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <RouterLink to="/campaigns">Campaigns</RouterLink>
      <i class="ti ti-chevron-right" />
      <span>{{ campaign.name }}</span>
    </div>

    <!-- Page header -->
    <div class="page-header">
      <div class="title-block">
        <div class="title-row">
          <h1 class="page-title">{{ campaign.name }}</h1>
          <span class="badge" :class="fmt.campaignStatus(campaign.status).cls">
            <span class="badge-dot" />{{ fmt.campaignStatus(campaign.status).label }}
          </span>
        </div>
        <div class="page-meta">
          Created {{ fmt.date(campaign.created_at) }}
          <template v-if="campaign.ends_at"> · Ends {{ fmt.date(campaign.ends_at) }}</template>
          · {{ affiliates.length }} affiliates
        </div>
      </div>
      <div class="actions">
        <button v-if="canEdit" class="btn" @click="$router.push(`/campaigns/${campaign.id}/edit`)">
          <i class="ti ti-edit" /> Edit
        </button>
        <button v-if="canTransition('start')" class="btn btn--primary" :disabled="transitioning" @click="transition('start')">
          <i class="ti ti-player-play" /> Start
        </button>
        <button v-if="canTransition('end')" class="btn" :disabled="transitioning" @click="transition('end')">
          <i class="ti ti-flag" /> End campaign
        </button>
        <button v-if="canTransition('cancel')" class="btn btn--danger" :disabled="transitioning" @click="confirmCancel = true">
          <i class="ti ti-ban" /> Cancel campaign
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total sales</div>
        <div class="stat-value">{{ fmt.naira(analytics.total_sales) }}</div>
        <div class="stat-sub">{{ analytics.conversion_count ?? 0 }} subscriptions</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Commissions</div>
        <div class="stat-value">{{ fmt.naira(analytics.total_commissions) }}</div>
        <div class="stat-sub">All affiliates</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-label">ROI</div>
        <div class="stat-value stat-value--green">{{ analytics.roi != null ? analytics.roi + '%' : '—' }}</div>
        <div class="stat-sub">Campaign return</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-label">Conversion rate</div>
        <div class="stat-value stat-value--green">{{ analytics.conversion_rate != null ? analytics.conversion_rate + '%' : '—' }}</div>
        <div class="stat-sub">Of all referrals</div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-label">Days remaining</div>
        <div class="stat-value">{{ daysRemaining }}</div>
        <div class="stat-sub">{{ campaign.ends_at ? 'Ends ' + fmt.date(campaign.ends_at) : 'No end date' }}</div>
      </div>
    </div>

    <!-- Detail + description row -->
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Campaign details</div>
        <div class="detail-row"><span class="detail-label">Commission type</span><span class="detail-value">{{ commissionTypeLabel }}</span></div>
        <div class="detail-row"><span class="detail-label">Amount per sale</span><span class="detail-value" style="color:var(--green-text)">{{ fmt.commissionDisplay(campaign) }}</span></div>
        <div class="detail-row"><span class="detail-label">Commission trigger</span><span class="detail-value">{{ commissionTriggerLabel }}</span></div>
        <div class="detail-row"><span class="detail-label">Start date</span><span class="detail-value">{{ fmt.date(campaign.starts_at) }}</span></div>
        <div class="detail-row"><span class="detail-label">End condition</span><span class="detail-value">{{ endCondition }}</span></div>
        <div class="detail-row"><span class="detail-label">Eligible tier</span><span class="tag">{{ campaign.tier ?? 'All tiers' }}</span></div>
        <div class="detail-row"><span class="detail-label">T&amp;Cs required</span><span class="detail-value" :style="campaign.require_tc ? 'color:var(--green-text)' : ''">{{ campaign.require_tc ? 'Yes' : 'No' }}</span></div>
      </div>
      <div class="card">
        <div class="card-title">Description</div>
        <p class="description">{{ campaign.description || 'No description provided.' }}</p>
        <div class="card-title" style="margin-top:18px">Link &amp; code format</div>
        <div class="detail-row"><span class="detail-label">Link prefix</span><span class="code-pill">leyyow.com/ref/</span></div>
        <div class="detail-row"><span class="detail-label">Code format</span><span class="detail-value">Auto + customisable</span></div>
      </div>
    </div>

    <!-- Affiliates / Merchants tab table -->
    <div class="full-card">
      <div class="full-card-header">
        <div class="toggle-wrap">
          <button class="toggle-btn" :class="{ on: activeTab === 'affiliates' }" @click="activeTab = 'affiliates'">
            Affiliates <span class="tab-count">({{ affiliates.length }})</span>
          </button>
          <button class="toggle-btn" :class="{ on: activeTab === 'merchants' }" @click="activeTab = 'merchants'">
            Merchants <span class="tab-count">({{ merchants.length ?? 0 }})</span>
          </button>
        </div>
        <div class="header-actions">
          <button
            v-if="activeTab === 'affiliates' && ['draft', 'scheduled', 'active'].includes(campaign.status)"
            class="btn-sm"
            @click="showAddAffiliate = true"
          >
            <i class="ti ti-plus" /> Add affiliate
          </button>
        </div>
      </div>

      <!-- Affiliates tab -->
      <div v-if="activeTab === 'affiliates'">
        <table v-if="affiliates.length">
          <thead>
            <tr>
              <th style="width:22%">Affiliate</th>
              <th style="width:16%">Affiliate code</th>
              <th style="width:10%">Clicks</th>
              <th style="width:10%">Conv.</th>
              <th style="width:12%">Earned</th>
              <th style="width:10%">ROI</th>
              <th style="width:20%"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in affiliates" :key="a.id" class="table-row" @click="$router.push(`/affiliates/${a.id}`)">
              <td>
                <div class="aff-name-cell">{{ a.full_name }}</div>
                <div class="muted" style="font-size:11px">{{ a.email }}</div>
              </td>
              <td><span class="code-pill">{{ a.affiliate_code ?? '—' }}</span></td>
              <td>{{ a.click_count ?? 0 }}</td>
              <td>{{ a.conversion_count ?? 0 }}</td>
              <td style="font-weight:500">{{ fmt.naira(a.total_earned) }}</td>
              <td :class="a.roi > 10 ? 'metric-positive' : 'muted'">{{ a.roi ? a.roi + '%' : '—' }}</td>
              <td style="text-align:right" @click.stop>
                <button v-if="['draft', 'scheduled', 'active'].includes(campaign.status)" class="btn-sm btn-sm--danger" @click="removeAffiliate(a.id)">
                  Remove
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else icon="users" title="No affiliates assigned" message="Add affiliates to this campaign to start tracking referrals." />
      </div>

      <!-- Merchants tab -->
      <div v-if="activeTab === 'merchants'">
        <AppLoader v-if="loadingMerchants" />
        <table v-else-if="merchants.length">
          <thead>
            <tr>
              <th style="width:24%">Merchant</th>
              <th style="width:18%">Referred by</th>
              <th style="width:14%">Signed up</th>
              <th style="width:14%">Subscribed</th>
              <th style="width:14%">Attribution</th>
              <th style="width:16%">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in merchants" :key="m.merchant_id" class="table-row">
              <td>
                <div class="aff-name-cell">{{ m.merchant_name }}</div>
                <div class="muted" style="font-size:11px">{{ m.merchant_id }}</div>
              </td>
              <td class="muted">{{ m.affiliate_name }}</td>
              <td class="muted">{{ fmt.shortDate(m.signed_up_at) }}</td>
              <td class="muted">{{ m.subscription_start ? fmt.shortDate(m.subscription_start) : '—' }}</td>
              <td><span class="tag">{{ m.attribution_source === 'affiliate_code' ? 'Code' : 'Link' }}</span></td>
              <td>
                <span class="badge" :class="m.status === 'subscribed' ? 'badge--green' : 'badge--gray'">
                  {{ m.status === 'subscribed' ? 'Subscribed' : 'Signed up only' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-else icon="building-store" title="No merchants yet" message="Merchants referred through this campaign will appear here." />
      </div>
    </div>

    <!-- Cancel confirm modal -->
    <ConfirmModal
      :visible="confirmCancel"
      title="Cancel campaign?"
      message="This campaign will be closed immediately and will no longer track new signups or referrals. Affiliates will be notified. Commissions already in progress will continue to be paid according to the campaign settings — existing conversions are not affected."
      confirm-label="Yes, cancel campaign"
      variant="danger"
      :loading="transitioning"
      @confirm="transition('cancel')"
      @cancel="confirmCancel = false"
    />

    <!-- Add affiliate modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAddAffiliate" class="overlay" @click.self="showAddAffiliate = false">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-title">Add affiliate to campaign</div>
              <button class="modal-close" @click="showAddAffiliate = false"><i class="ti ti-x" /></button>
            </div>
            <AppLoader v-if="loadingAddList" />
            <div v-else style="position:relative">
              <input
                v-model="addAffiliateSearch"
                type="text"
                placeholder="Search affiliates…"
                @focus="addDropdownOpen = true"
                @blur="() => window.setTimeout(() => addDropdownOpen = false, 150)"
              />
              <div v-if="addDropdownOpen && filteredAddResults.length" class="dropdown">
                <div v-for="a in filteredAddResults" :key="a.id" class="dropdown-item" @mousedown.prevent="doAddAffiliate(a)">
                  <div class="mini-avatar">{{ initials(a.full_name) }}</div>
                  <div>
                    <div style="font-size:13px;font-weight:500">{{ a.full_name }}</div>
                    <div style="font-size:11px;color:var(--text-tertiary)">{{ a.email }}</div>
                  </div>
                </div>
              </div>
              <div v-else-if="addDropdownOpen && !filteredAddResults.length" class="dropdown-empty">No affiliates found</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const fmt = useFormat()
const toast = useToastStore()

const loading = ref(true)
const loadingMerchants = ref(false)
const loadingAddList = ref(false)
const campaign = ref(null)
const analytics = ref({})
const affiliates = ref([])
const merchants = ref([])
const activeTab = ref('affiliates')
const transitioning = ref(false)
const confirmCancel = ref(false)
const showAddAffiliate = ref(false)
const addAffiliateSearch = ref('')
const allAddAffiliates = ref([])
const addDropdownOpen = ref(false)

// ── Computed ──────────────────────────────────────────────────────────────────
const daysRemaining = computed(() => {
  if (!campaign.value?.ends_at) return '—'
  const diff = Math.ceil((new Date(campaign.value.ends_at) - new Date()) / 86400000)
  return diff > 0 ? diff : 0
})

const commissionTypeLabel = computed(() => ({
  flat_fee: 'Flat fee',
  percentage: 'Percentage',
  percentage_capped: 'Percentage + cap',
}[campaign.value?.commission_type] ?? '—'))

const commissionTriggerLabel = computed(() => ({
  first_subscription_only: 'First subscription only',
  all_subscriptions: 'All subscriptions',
  subscriptions_within_period: `Within ${campaign.value?.commission_period_days ?? '?'} days of signup`,
}[campaign.value?.commission_trigger] ?? '—'))

const endCondition = computed(() => {
  const c = campaign.value
  if (!c) return '—'
  const parts = []
  if (c.ends_at) parts.push(fmt.date(c.ends_at))
  if (c.conversion_limit) parts.push(`${c.conversion_limit} conversions`)
  return parts.join(' or ') || 'Until cancelled'
})

const canEdit = computed(() =>
  campaign.value?.status === 'draft'
)

const filteredAddResults = computed(() => {
  const current = affiliates.value.map(a => a.id)
  const q = addAffiliateSearch.value.toLowerCase().trim()
  return allAddAffiliates.value
    .filter(a => !current.includes(a.id))
    .filter(a => !q || a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    .slice(0, 8)
})

function canTransition(action) {
  const s = campaign.value?.status
  if (action === 'start')  return s === 'draft'
  if (action === 'end')    return s === 'active'
  if (action === 'cancel') return ['draft', 'scheduled', 'active'].includes(s)
  return false
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const [camRes, analyticsRes, merchantRes] = await Promise.all([
      api.get(`/admin/campaigns/${route.params.id}/`),
      api.get(`/admin/analytics/campaigns/${route.params.id}/`),
      api.get('/admin/tracking/merchant-leads/', { params: { campaign: route.params.id } }),
    ])
    campaign.value  = camRes.data
    analytics.value = analyticsRes.data.overview ?? analyticsRes.data
    merchants.value = merchantRes.data.results ?? merchantRes.data

    const breakdown = analyticsRes.data.affiliate_breakdown ?? []
    affiliates.value = (camRes.data.affiliates ?? []).map(a => {
      const stats = breakdown.find(b => b.affiliate_id === a.id) ?? {}
      return { ...a, ...stats }
    })
  } catch { campaign.value = null }
  finally { loading.value = false }
}

watch(showAddAffiliate, async (val) => {
  if (!val) { addAffiliateSearch.value = ''; return }
  if (allAddAffiliates.value.length) return
  loadingAddList.value = true
  try {
    const { data } = await api.get('/admin/affiliates/', { params: { assignable: 'true' } })
    allAddAffiliates.value = data.results ?? data
  } finally { loadingAddList.value = false }
})

// ── Campaign transitions ──────────────────────────────────────────────────────
async function transition(action) {
  transitioning.value = true
  try {
    const { data } = await api.post(`/admin/campaigns/${route.params.id}/transition/`, { action })
    campaign.value = data
    confirmCancel.value = false
    const labels = { schedule: 'start', end: 'ended', cancel: 'cancelled' }
    toast.show(`Campaign ${labels[action]}.`, 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Action failed.', 'error')
  } finally { transitioning.value = false }
}

// ── Affiliate management ──────────────────────────────────────────────────────
async function removeAffiliate(affiliateId) {
  try {
    await api.delete(`/admin/campaigns/${route.params.id}/affiliates/`, {
      data: { affiliate_id: affiliateId }
    })
    affiliates.value = affiliates.value.filter(a => a.id !== affiliateId)
    toast.show('Affiliate removed.', 'success')
  } catch { toast.show('Failed to remove affiliate.', 'error') }
}

async function doAddAffiliate(a) {
  try {
    await api.post(`/admin/campaigns/${route.params.id}/affiliates/`, { action: 'add', affiliate_id: a.id })
    showAddAffiliate.value   = false
    addAffiliateSearch.value = ''
    const { data } = await api.get(`/admin/campaigns/${route.params.id}/`)
    affiliates.value = data.affiliates ?? []
    toast.show(`${a.full_name} added to campaign.`, 'success')
  } catch (err) { toast.show(err.response?.data?.detail ?? 'Failed to add affiliate.', 'error') }
}

function initials(name) { return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }

onMounted(load)
</script>

<style scoped>
.stats-grid { grid-template-columns:repeat(5,1fr) }
.title-block { display:flex;flex-direction:column;gap:5px }
.title-row   { display:flex;align-items:center;gap:10px;flex-wrap:wrap }
.page-meta   { font-size:12px;color:var(--text-tertiary) }
.actions     { display:flex;gap:8px;flex-shrink:0 }
.grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px }
.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px }
.card-title { font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px }
.detail-row { display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px }
.detail-row:last-child { border-bottom:none }
.detail-label { color:var(--text-secondary) }
.detail-value { font-weight:500;text-align:right }
.description { font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:18px }
.tag { display:inline-block;padding:2px 9px;border-radius:99px;font-size:11px;background:var(--bg);color:var(--text-secondary);border:1px solid var(--border) }
.code-pill { font-family:monospace;font-size:12px;background:var(--bg);padding:3px 9px;border-radius:5px;color:var(--text-secondary);border:1px solid var(--border) }
.full-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;margin-bottom:16px }
.full-card-header { display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border) }
.header-actions { display:flex;gap:8px }
.toggle-wrap { display:flex;background:var(--bg);border-radius:var(--radius-md);padding:3px;gap:2px }
.toggle-btn { padding:7px 20px;border-radius:7px;border:none;background:transparent;font-size:13px;font-weight:400;color:var(--text-secondary);cursor:pointer;font-family:var(--font);transition:all 0.15s }
.toggle-btn.on { background:var(--surface);color:var(--text-primary);font-weight:600;border:1px solid var(--border) }
.tab-count { font-size:11px;opacity:0.6 }
.btn-sm { padding:7px 14px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--surface);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:var(--font);transition:background 0.1s }
.btn-sm:hover { background:var(--bg) }
.btn-sm--danger { border-color:#F0C0C0;color:var(--red-text) }
.btn-sm--danger:hover { background:var(--red-bg) }
table { table-layout:fixed }
th { padding:11px 18px }
td { padding:14px 18px }
.aff-name-cell { font-weight:500 }
.metric-positive { color:var(--green-text);font-weight:500 }
.dropdown { position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:100;overflow:hidden }
.dropdown-item { display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;transition:background 0.1s }
.dropdown-item:hover { background:var(--bg) }
.mini-avatar { width:28px;height:28px;border-radius:50%;background:var(--pollen);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--amber-text);flex-shrink:0 }
</style>