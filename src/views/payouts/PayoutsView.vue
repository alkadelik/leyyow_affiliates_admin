<template>
  <div>
    <h1 class="page-title">Payouts</h1>

    <!-- Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card stat-card--amber">
        <div class="stat-label">Pending requests</div>
        <div class="stat-value stat-value--amber">{{ stats.pending_count }}</div>
        <div class="stat-sub">Awaiting approval</div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-label">Pending amount</div>
        <div class="stat-value stat-value--amber">{{ fmt.naira(stats.pending_amount) }}</div>
        <div class="stat-sub">To be disbursed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total paid out</div>
        <div class="stat-value">{{ fmt.naira(stats.total_paid) }}</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-label">Wallet balance</div>
        <div class="stat-value stat-value--green">{{ fmt.naira(stats.wallet_balance) }}</div>
        <div class="stat-sub">Available to disburse</div>
      </div>
    </div>

    <AppLoader v-if="loading" />

    <template v-else>
      <!-- Pending requests -->
      <div v-if="pending.length" class="section-head">
        <div class="section-title">Pending requests</div>
        <span class="count-badge">{{ pending.length }} pending</span>
      </div>

      <div v-for="p in pending" :key="p.id" class="req-card">
        <div class="req-avatar">{{ initials(p.affiliate_name) }}</div>
        <div class="req-info">
          <div class="req-name">{{ p.affiliate_name }}</div>
          <div class="req-meta">
            Requested {{ fmt.date(p.requested_at) }} ·
            {{ p.bank_account_detail?.bank_name }} ••••{{ p.bank_account_detail?.account_number?.slice(-4) }} ·
            Balance after: {{ fmt.naira(p.balance_at_request) }}
          </div>
        </div>
        <div class="req-amount">
          <div class="req-amount-value">{{ fmt.naira(p.requested_amount) }}</div>
          <div class="req-amount-fee">+ ₦100 transfer fee</div>
        </div>
        <div class="req-actions">
          <button class="btn-approve" :disabled="!!actionLoading[p.id]" @click="approve(p)">
            <i v-if="actionLoading[p.id] === 'approve'" class="ti ti-loader-2 spin" />
            <i v-else class="ti ti-check" />
            Approve
          </button>
          <button class="btn-decline" :disabled="!!actionLoading[p.id]" @click="openDecline(p)">
            <i class="ti ti-x" /> Decline
          </button>
        </div>
      </div>

      <div v-if="pending.length" class="divider" />

      <!-- History -->
      <div class="section-title" style="margin-bottom:14px">Payout history</div>

      <div class="toolbar">
        <div class="filter-pills">
          <button v-for="f in filters" :key="f.value" class="pill" :class="{ 'pill--active': activeFilter === f.value }" @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div class="search-wrap">
          <i class="ti ti-search" />
          <input v-model="search" type="text" placeholder="Search by affiliate…" />
        </div>
      </div>

      <div class="table-card" v-if="filteredHistory.length">
        <table>
          <thead>
            <tr>
              <th style="width:14%">Date</th>
              <th style="width:20%">Affiliate</th>
              <th style="width:15%">Amount</th>
              <th style="width:15%">Bank</th>
              <th style="width:12%">Status</th>
              <th style="width:24%"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredHistory" :key="p.id">
              <td class="muted">{{ fmt.date(p.requested_at) }}</td>
              <td style="font-weight:500">{{ p.affiliate_name }}</td>
              <td style="font-weight:500">{{ fmt.naira(p.requested_amount) }}</td>
              <td class="muted">{{ p.bank_account_detail?.bank_name }} ••••{{ p.bank_account_detail?.account_number?.slice(-4) }}</td>
              <td>
                <span class="badge" :class="fmt.payoutStatus(p.status).cls">
                  {{ fmt.payoutStatus(p.status).label }}
                </span>
              </td>
              <td style="text-align:right">
                <button v-if="false" class="btn-sm btn-sm--green" :disabled="!!actionLoading[p.id]" @click="markPaid(p)">
                <!-- Payouts handled by Paystack not manual -->
                <!-- <button v-if="p.status === 'approved'" class="btn-sm btn-sm--green" :disabled="!!actionLoading[p.id]" @click="markPaid(p)"> -->
                  <i v-if="actionLoading[p.id] === 'paid'" class="ti ti-loader-2 spin" />
                  <i v-else class="ti ti-check" /> Mark as paid
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else icon="cash" title="No payouts yet" message="Payout requests from affiliates will appear here." />
    </template>

    <!-- Decline confirm modal -->
    <ConfirmModal
      :visible="!!declineTarget"
      title="Decline payout request?"
      :message="`The ₦${declineTarget ? Math.floor(declineTarget.requested_amount / 100).toLocaleString() : 0} will be returned to ${declineTarget?.affiliate_name}'s wallet balance.`"
      confirm-label="Decline request"
      variant="danger"
      :loading="!!actionLoading[declineTarget?.id]"
      @confirm="decline"
      @cancel="declineTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import { useToastStore } from '@/stores/toast'
import AppLoader   from '@/components/ui/AppLoader.vue'
import EmptyState  from '@/components/ui/EmptyState.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const fmt   = useFormat()
const toast = useToastStore()

const loading      = ref(true)
const payouts      = ref([])
const stats        = ref({ pending_count: 0, pending_amount: 0, total_paid: 0, wallet_balance: 0 })
const activeFilter = ref('all')
const search       = ref('')
const actionLoading = ref({})   // { [payout_id]: 'approve' | 'paid' | 'decline' }
const declineTarget = ref(null)

const filters = [
  { label: 'All',      value: 'all'      },
  { label: 'Pending',  value: 'pending'  },
  { label: 'Approved', value: 'approved' },
  { label: 'Paid',     value: 'paid'     },
  { label: 'Cancelled',value: 'cancelled'},
]

const pending = computed(() => payouts.value.filter(p => p.status === 'pending'))

const filteredHistory = computed(() => {
  let list = payouts.value
  if (activeFilter.value !== 'all') list = list.filter(p => p.status === activeFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.affiliate_name?.toLowerCase().includes(q))
  }
  return list
})

function initials(name) {
  return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  try {
    const [payRes, walletRes] = await Promise.all([
      api.get('/admin/payouts/'),
      api.get('/admin/wallet/management/'),
    ])
    payouts.value = payRes.data.results ?? payRes.data
    const w = walletRes.data.wallet
    const t = walletRes.data.payout_totals
    const pendingList = payouts.value.filter(p => p.status === 'pending')
    // stats.value = {
    //   pending_count:  pendingList.length,
    //   pending_amount: pendingList.reduce((s, p) => s + (p.requested_amount ?? 0), 0),
    //   total_paid:     t.total_paid     ?? 0,
    //   wallet_balance: w.balance        ?? 0,
    // }
    stats.value = {
      pending_count:  t.count_pending  ?? 0,
      pending_amount: t.total_pending  ?? 0,
      total_paid:     t.total_paid     ?? 0,
      wallet_balance: w.balance        ?? 0,
    }
  } finally {
    loading.value = false
  }
})

async function approve(payout) {
  actionLoading.value[payout.id] = 'approve'
  try {
    const { data } = await api.post(`/admin/payouts/${payout.id}/`, { action: 'approve' })
    updatePayout(payout.id, data)
    toast.show(`Payout approved for ${payout.affiliate_name}.`, 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to approve payout.', 'error')
  } finally {
    delete actionLoading.value[payout.id]
  }
}

function openDecline(payout) { declineTarget.value = payout }

async function decline() {
  const payout = declineTarget.value
  actionLoading.value[payout.id] = 'decline'
  try {
    const { data } = await api.post(`/admin/payouts/${payout.id}/`, { action: 'cancel' })
    updatePayout(payout.id, data)
    declineTarget.value = null
    toast.show(`Payout request cancelled. Balance returned to ${payout.affiliate_name}.`, 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to cancel payout.', 'error')
  } finally {
    delete actionLoading.value[payout.id]
  }
}

async function markPaid(payout) {
  actionLoading.value[payout.id] = 'paid'
  try {
    const { data } = await api.patch(`/admin/payouts/${payout.id}/`, { action: 'mark_paid' })
    updatePayout(payout.id, data)
    toast.show(`Payout marked as paid.`, 'success')
  } catch (err) {
    toast.show(err.response?.data?.detail ?? 'Failed to update payout.', 'error')
  } finally {
    delete actionLoading.value[payout.id]
  }
}

function updatePayout(id, updated) {
  const idx = payouts.value.findIndex(p => p.id === id)
  if (idx !== -1) payouts.value[idx] = { ...payouts.value[idx], ...updated }
  // Recalculate pending stats
  const pendingList = payouts.value.filter(p => p.status === 'pending')
  stats.value.pending_count  = pendingList.length
  stats.value.pending_amount = pendingList.reduce((s, p) => s + (p.requested_amount ?? 0), 0)
}
</script>

<style scoped>
.page-title { margin-bottom:24px }
.stats-grid { margin-bottom:28px }
.section-head  { display:flex;align-items:center;gap:10px;margin-bottom:14px }
.section-title { font-size:14px;font-weight:600 }
.count-badge   { background:var(--pollen);color:var(--amber-text);padding:2px 9px;border-radius:99px;font-size:11px;font-weight:600;border:1px solid #F0D890 }
.req-card    { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;display:flex;align-items:center;gap:16px;margin-bottom:10px }
.req-avatar  { width:40px;height:40px;border-radius:50%;background:var(--pollen);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--amber-text);flex-shrink:0 }
.req-info    { flex:1;min-width:0 }
.req-name    { font-size:14px;font-weight:600;letter-spacing:-0.2px }
.req-meta    { font-size:12px;color:var(--text-tertiary);margin-top:3px }
.req-amount  { text-align:right;flex-shrink:0 }
.req-amount-value { font-size:20px;font-weight:600;letter-spacing:-0.4px }
.req-amount-fee   { font-size:11px;color:var(--text-tertiary);margin-top:2px }
.req-actions { display:flex;gap:8px;flex-shrink:0 }
.btn-approve { display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:var(--radius-md);border:none;background:var(--brand);color:var(--brand-deep);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:background 0.15s }
.btn-approve:hover:not(:disabled) { background:var(--brand-dark) }
.btn-approve:disabled { opacity:0.6;cursor:not-allowed }
.btn-decline { display:flex;align-items:center;gap:5px;padding:8px 14px;border-radius:var(--radius-md);border:1px solid #F0C0C0;background:var(--surface);color:var(--red-text);font-size:12px;font-weight:500;cursor:pointer;font-family:var(--font);transition:background 0.1s }
.btn-decline:hover:not(:disabled) { background:var(--red-bg) }
.btn-decline:disabled { opacity:0.6;cursor:not-allowed }
.divider { height:1px;background:var(--border);margin:20px 0 24px }
.btn-sm { padding:6px 12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--surface);font-size:12px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:5px;font-family:var(--font);transition:background 0.1s }
.btn-sm--green { border-color:#B8E8D0;color:var(--green-text) }
.btn-sm--green:hover:not(:disabled) { background:#F0FBF5 }
.btn-sm:disabled { opacity:0.6;cursor:not-allowed }
</style>
