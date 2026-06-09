<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Affiliates</h1>
        <p class="page-sub">Manage and monitor all affiliate partners.</p>
      </div>
      <button class="btn-primary" @click="showInviteModal = true">
        <i class="ti ti-plus" /> Add affiliate
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-label">Total affiliates</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-label">Active affiliates</div>
        <div class="stat-value stat-value--green">{{ stats.active }}</div>
        <div class="stat-sub">On live campaigns</div>
      </div>
      <!-- <div class="stat-card">
        <div class="stat-label">Total subscriptions</div>
        <div class="stat-value">{{ stats.total_conversions }}</div>
        <div class="stat-sub">All campaigns</div>
      </div> -->
      <div class="stat-card stat-card--green">
        <div class="stat-label">Conversion rate</div>
        <div class="stat-value stat-value--green">{{ stats.conversion_rate || '—' }}</div>
        <div class="stat-sub">Signups to subscriptions</div>
      </div>
      <!-- <div class="stat-card stat-card--amber">
        <div class="stat-label">Pending payouts</div>
        <div class="stat-value">{{ fmt.naira(stats.pending_payout_amount) }}</div>
        <div class="stat-sub">{{ stats.pending_payout_count }} requests pending</div>
      </div> -->
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="filter-pills">
        <button v-for="f in filters" :key="f.value" class="pill" :class="{ 'pill--active': activeFilter === f.value }" @click="activeFilter = f.value">
          {{ f.label }}
        </button>
      </div>
      <div class="search-wrap">
        <i class="ti ti-search" />
        <input v-model="search" type="text" placeholder="Search affiliates…" />
      </div>
    </div>

    <!-- Table -->
    <AppLoader v-if="loading" />

    <template v-else>
      <div class="table-card" v-if="filtered.length">
        <table>
          <thead>
            <tr>
              <th style="width:22%">Affiliate</th>
              <th style="width:11%">Status</th>
              <th style="width:12%">Live campaigns</th>
              <!-- <th style="width:12%">Total earned</th> -->
              <!-- <th style="width:11%">Total sales</th> -->
              <th style="width:10%">Conv. rate</th>
              <!-- <th style="width:9%">ROI</th> -->
              <th style="width:13%">Last referral</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in filtered" :key="a.id" class="table-row" @click="$router.push(`/affiliates/${a.id}`)">
              <td>
                <div class="aff-cell">
                  <div class="avatar">{{ initials(a.full_name) }}</div>
                  <div>
                    <div class="aff-name">{{ a.full_name }}</div>
                    <div class="muted" style="font-size:11px">{{ a.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="fmt.affiliateStatus(a.status).cls">
                  <span class="badge-dot" />{{ fmt.affiliateStatus(a.status).label }}
                </span>
              </td>
              <td>{{ a.live_campaign_count ? a.live_campaign_count + ' campaign' + (a.live_campaign_count > 1 ? 's' : '') : '—' }}</td>
              <!-- <td style="font-weight:500">{{ a.wallet_balance ? fmt.naira(a.wallet_balance) : '—' }}</td> -->
              <!-- <td>—</td> -->
              <td>—</td>
              <!-- <td>—</td> -->
              <td class="muted">{{ a.last_referral_at ? fmt.date(a.last_referral_at) : 'Never' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState v-else icon="users" title="No affiliates yet" message="Invite your first affiliate to get started.">
        <button class="btn-primary" style="margin-top:16px" @click="showInviteModal = true">
          <i class="ti ti-plus" /> Add affiliate
        </button>
      </EmptyState>
    </template>

    <!-- Invite modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showInviteModal" class="overlay" @click.self="showInviteModal = false">
          <div class="modal">
            <div class="modal-head">
              <div class="modal-title">Add affiliate</div>
              <button class="modal-close" @click="showInviteModal = false"><i class="ti ti-x" /></button>
            </div>
            <p class="modal-sub">An invitation email will be sent. The affiliate sets their own password to activate their account.</p>

            <Transition name="fade">
              <div v-if="inviteError" class="error-banner">
                <i class="ti ti-alert-circle" /> {{ inviteError }}
              </div>
            </Transition>

            <div class="field">
              <label>Full name <span class="req">*</span></label>
              <input v-model="inviteForm.full_name" type="text" placeholder="e.g. Amara Okafor" />
            </div>
            <div class="field" style="margin-top:12px">
              <label>Email address <span class="req">*</span></label>
              <input v-model="inviteForm.email" type="email" placeholder="affiliate@email.com" />
            </div>

            <div class="modal-actions">
              <button class="btn" @click="showInviteModal = false">Cancel</button>
              <button class="btn btn--primary" :disabled="inviting" @click="sendInvite">
                <i v-if="inviting" class="ti ti-loader-2 spin" />
                <i v-else class="ti ti-send" />
                {{ inviting ? 'Sending…' : 'Send invite' }}
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
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const fmt   = useFormat()
const toast = useToastStore()

const loading      = ref(true)
const affiliates   = ref([])
const stats        = ref({
  total: 0, active: 0, total_conversions: 0,
  conversion_rate: '', pending_payout_amount: 0, pending_payout_count: 0,
})
const search          = ref('')
const activeFilter    = ref('all')
const showInviteModal = ref(false)
const inviting        = ref(false)
const inviteError     = ref('')
const inviteForm      = ref({ full_name: '', email: '' })

const filters = [
  { label: 'All',      value: 'all'      },
  { label: 'Active',   value: 'active'   },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Invited',  value: 'invited'  },
]

const filtered = computed(() => {
  let list = affiliates.value
  if (activeFilter.value !== 'all') {
    list = list.filter(a => a.status === activeFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(a =>
      a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    )
  }
  return list
})

function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  try {
    const [affRes, analyticsRes, payoutRes] = await Promise.all([
      api.get('/admin/affiliates/'),
      api.get('/admin/analytics/'),
      api.get('/admin/payouts/', { params: { status: 'pending' } }),
    ])

    affiliates.value = affRes.data.results ?? affRes.data

    const a = analyticsRes.data.overview
    const pendingPayouts = payoutRes.data.results ?? payoutRes.data

    stats.value = {
      total:                 affRes.data.count ?? affiliates.value.length,
      active:                affiliates.value.filter(x => x.status === 'active').length,
      total_conversions:     a.total_conversions ?? 0,
      conversion_rate:       a.conversion_rate ? a.conversion_rate + '%' : '—',
      pending_payout_amount: pendingPayouts.reduce((sum, p) => sum + (p.requested_amount ?? 0), 0),
      pending_payout_count:  pendingPayouts.length,
    }
  } finally {
    loading.value = false
  }
})

async function sendInvite() {
  inviteError.value = ''
  if (!inviteForm.value.full_name.trim()) { inviteError.value = 'Full name is required.'; return }
  if (!inviteForm.value.email.trim())     { inviteError.value = 'Email address is required.'; return }
  inviting.value = true
  try {
    const { data } = await api.post('/admin/affiliates/create/', {
      full_name: inviteForm.value.full_name.trim(),
      email:     inviteForm.value.email.trim(),
    })
    affiliates.value.unshift(data)
    showInviteModal.value = false
    inviteForm.value = { full_name: '', email: '' }
    toast.show('Invite sent successfully.', 'success')
  } catch (err) {
    inviteError.value = err.response?.data?.email?.[0]
      || err.response?.data?.detail
      || 'Failed to send invite. Please try again.'
  } finally {
    inviting.value = false
  }
}
</script>

<style scoped>
.page-title { margin-bottom:3px }
.stats-grid { grid-template-columns:repeat(3,1fr) }
.aff-cell  { display:flex;align-items:center;gap:10px }
.avatar    { width:34px;height:34px;border-radius:50%;background:var(--pollen);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--amber-text);flex-shrink:0 }
.aff-name  { font-size:13px;font-weight:500 }
.metric-positive { color:var(--green-text);font-weight:500 }
.modal-head { margin-bottom:8px }
.modal-sub   { font-size:13px;color:var(--text-secondary);margin-bottom:20px;line-height:1.6 }
.error-banner { display:flex;align-items:center;gap:8px;background:var(--red-bg);color:var(--red-text);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;margin-bottom:14px }
</style>
