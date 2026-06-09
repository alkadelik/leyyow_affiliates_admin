<template>
  <div>
    <h1 class="page-title">Wallet</h1>

    <AppLoader v-if="loading" :page="true" />

    <template v-else>
      <!-- Balance card -->
      <div class="balance-card">
        <div class="balance-left">
          <div class="balance-eyebrow">Current wallet balance</div>
          <div class="balance-amount">{{ fmt.naira(wallet.balance) }}</div>
          <div class="balance-sub">
            Auto-funded from subscription commissions
            <template v-if="wallet.last_updated"> · Last updated {{ fmt.date(wallet.last_updated) }}</template>
          </div>
        </div>
        <div class="balance-right">
          <div class="balance-meta">
            <div class="balance-meta-value" style="color:#7DEBA8">{{ fmt.naira(wallet.credited_this_month) }}</div>
            <div class="balance-meta-label">Credited this month</div>
          </div>
          <div class="balance-meta">
            <div class="balance-meta-value" style="color:var(--brand)">{{ fmt.naira(wallet.pending_disbursement) }}</div>
            <div class="balance-meta-label">Pending disbursement</div>
          </div>
          <div class="balance-meta">
            <div class="balance-meta-value">{{ fmt.naira(wallet.total_disbursed) }}</div>
            <div class="balance-meta-label">Total disbursed</div>
          </div>
        </div>
      </div>

      <!-- Info box -->
      <div class="info-box">
        <i class="ti ti-info-circle" />
        <div>This wallet is automatically funded whenever a subscription payment is confirmed and an affiliate commission is earned. No manual top-up is required.</div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div class="stat-card stat-card--green">
          <div class="stat-label">Total credited</div>
          <div class="stat-value stat-value--green">{{ fmt.naira(wallet.total_credited) }}</div>
          <div class="stat-sub">All time inflows</div>
        </div>
        <div class="stat-card stat-card--red">
          <div class="stat-label">Total disbursed</div>
          <div class="stat-value stat-value--red">{{ fmt.naira(wallet.total_disbursed) }}</div>
          <div class="stat-sub">All time outflows</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Transfer fees collected</div>
          <div class="stat-value">{{ fmt.naira(wallet.total_fees) }}</div>
          <div class="stat-sub">All time</div>
        </div>
        <div class="stat-card stat-card--amber">
          <div class="stat-label">Commissions reversed</div>
          <div class="stat-value stat-value--amber">{{ fmt.naira(wallet.total_reversed) }}</div>
          <div class="stat-sub">Due to refunds</div>
        </div>
      </div>

      <!-- Ledger -->
      <div class="ledger-head">Transaction ledger</div>

      <div class="toolbar">
        <div class="filter-pills">
          <button v-for="f in filters" :key="f.value" class="pill" :class="{ 'pill--active': activeFilter === f.value }" @click="activeFilter = f.value">{{ f.label }}</button>
        </div>
        <div class="search-wrap">
          <i class="ti ti-search" />
          <input v-model="search" type="text" placeholder="Search by affiliate or campaign…" />
        </div>
      </div>

      <div class="table-card" v-if="filteredEvents.length">
        <table>
          <thead>
            <tr>
              <th style="width:12%">Date</th>
              <th style="width:12%">Type</th>
              <th style="width:26%">Description</th>
              <th style="width:16%">Affiliate</th>
              <th style="width:13%">Amount</th>
              <th style="width:12%">Balance</th>
              <th style="width:9%">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in filteredEvents" :key="e.id">
              <td class="muted">{{ fmt.shortDate(e.created_at) }}</td>
              <td>
                <span class="type-badge" :class="`type-badge--${eventTypeClass(e.event_type)}`">
                  <i :class="`ti ti-${eventTypeIcon(e.event_type)}`" />
                  {{ eventTypeLabel(e.event_type) }}
                </span>
              </td>
              <td>{{ e.description }}</td>
              <td style="font-weight:500">{{ e.affiliate_name || '—' }}</td>
              <td :class="e.amount >= 0 ? 'amount-positive' : 'amount-negative'" style="font-weight:600">
                {{ e.amount >= 0 ? '+' : '' }}{{ fmt.naira(Math.abs(e.amount)) }}
              </td>
              <td class="muted">{{ fmt.naira(e.balance_after) }}</td>
              <td>
                <span class="badge" :class="e.status === 'done' ? 'badge--green' : 'badge--amber'">
                  {{ e.status === 'done' ? 'Done' : 'Pending' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else icon="wallet" title="No transactions yet" message="Wallet activity will appear here as commissions are earned and payouts are made." />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import AppLoader  from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const fmt     = useFormat()
const loading = ref(true)

const wallet = ref({
  balance: 0, credited_this_month: 0, pending_disbursement: 0,
  total_credited: 0, total_disbursed: 0, total_fees: 0, total_reversed: 0,
  last_updated: null,
})

const events       = ref([])
const activeFilter = ref('all')
const search       = ref('')

const filters = [
  { label: 'All',       value: 'all'      },
  { label: 'Credits',   value: 'credit'   },
  { label: 'Payouts',   value: 'payout'   },
  { label: 'Reversals', value: 'reversal' },
  { label: 'Fees',      value: 'fee'      },
]

const filteredEvents = computed(() => {
  let list = events.value
  if (activeFilter.value !== 'all') list = list.filter(e => e.event_type === activeFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      e.affiliate_name?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    )
  }
  return list
})

function eventTypeLabel(type) {
  return { credit: 'Credit', payout: 'Payout', reversal: 'Reversal', fee: 'Fee' }[type] ?? type
}
function eventTypeIcon(type) {
  return { credit: 'arrow-down-left', payout: 'arrow-up-right', reversal: 'refresh', fee: 'receipt' }[type] ?? 'circle'
}
function eventTypeClass(type) {
  return { credit: 'green', payout: 'gray', reversal: 'amber', fee: 'blue' }[type] ?? 'gray'
}

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/wallet/management/')
    wallet.value = {
      balance:              data.balance              ?? 0,
      credited_this_month:  data.credited_this_month  ?? 0,
      pending_disbursement: data.pending_disbursement ?? 0,
      total_credited:       data.total_credited       ?? 0,
      total_disbursed:      data.total_disbursed      ?? 0,
      total_fees:           data.total_fees           ?? 0,
      total_reversed:       data.total_reversed       ?? 0,
      last_updated:         data.last_updated         ?? null,
    }
    events.value = data.events ?? []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-title { margin-bottom:24px }
.balance-card { background:var(--brand-deep);border-radius:var(--radius-xl);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:24px }
.balance-left  { flex:1 }
.balance-eyebrow { font-size:11px;font-weight:500;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px }
.balance-amount  { font-size:36px;font-weight:700;color:#fff;letter-spacing:-1px;line-height:1 }
.balance-sub     { font-size:12px;color:rgba(255,255,255,0.45);margin-top:8px }
.balance-right   { display:flex;gap:32px;flex-shrink:0 }
.balance-meta    { text-align:right }
.balance-meta-value { font-size:18px;font-weight:600;color:#fff;letter-spacing:-0.4px }
.balance-meta-label { font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px }
.info-box { background:var(--pollen-light);border:1px solid #F0D890;border-radius:var(--radius-md);padding:12px 14px;font-size:12px;color:var(--amber-text);display:flex;gap:10px;margin-bottom:20px;line-height:1.5 }
.info-box i { font-size:15px;flex-shrink:0;margin-top:1px }
.ledger-head { font-size:14px;font-weight:600;margin-bottom:14px }
.amount-positive { color:var(--green-text) }
.amount-negative { color:var(--red-text) }
.type-badge { display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:99px;font-size:10px;font-weight:600 }
.type-badge i { font-size:10px }
.type-badge--green { background:var(--green-bg);color:var(--green-text) }
.type-badge--gray  { background:var(--gray-bg);color:var(--gray-text) }
.type-badge--amber { background:var(--amber-bg);color:var(--amber-text) }
.type-badge--blue  { background:var(--blue-bg);color:var(--blue-text) }
</style>
