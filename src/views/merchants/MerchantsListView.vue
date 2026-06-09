<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Merchants</h1>
        <p class="page-sub">Track all merchant leads referred by affiliates.</p>
      </div>
    </div>

    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-label">Total merchants</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-label">Subscribed</div>
        <div class="stat-value stat-value--green">{{ stats.subscribed }}</div>
        <div class="stat-sub">Active paying merchants</div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-label">In trial</div>
        <div class="stat-value stat-value--amber">{{ stats.trial }}</div>
        <div class="stat-sub">Yet to subscribe</div>
      </div>
      <div class="stat-card stat-card--red">
        <div class="stat-label">Cancelled</div>
        <div class="stat-value stat-value--red">{{ stats.cancelled }}</div>
        <div class="stat-sub">Subscription cancelled</div>
      </div>
      <div class="stat-card stat-card--red">
        <div class="stat-label">Expired</div>
        <div class="stat-value stat-value--red">{{ stats.expired }}</div>
        <div class="stat-sub">Subscription lapsed</div>
      </div>
    </div>

    <div class="toolbar">
      <div class="filter-pills">
        <button
          v-for="f in filters"
          :key="f.value"
          class="pill"
          :class="{ 'pill--active': activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="search-wrap">
        <i class="ti ti-search" />
        <input v-model="search" type="text" placeholder="Search merchants…" />
      </div>
    </div>

    <AppLoader v-if="loading" />

    <template v-else>
      <div class="table-card" v-if="filtered.length">
        <table>
          <thead>
            <tr>
              <th style="width:28%">Merchant</th>
              <th style="width:12%">Status</th>
              <th style="width:22%">Affiliate</th>
              <th style="width:14%">Subscriptions</th>
              <th style="width:14%">Signed up</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in filtered"
              :key="m.id"
              class="table-row"
              @click="$router.push(`/merchants/${m.merchant_id}`)"
            >
              <td>
                <div class="merchant-name">{{ m.merchant_name }}</div>
                <div class="muted" style="font-size:11px">{{ m.merchant_id }}</div>
              </td>
              <td>
                <span class="badge" :class="fmt.merchantStatus(m.status).cls">
                  <span class="badge-dot" />{{ fmt.merchantStatus(m.status).label }}
                </span>
              </td>
              <td class="muted">{{ m.affiliate_name }}</td>
              <td>{{ m.subscription_count ?? '—' }}</td>
              <td class="muted">{{ fmt.date(m.signed_up_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState v-else icon="building-store" title="No merchants yet" message="Merchants will appear here once affiliates refer them." />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import AppLoader from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const fmt     = useFormat()
const loading = ref(true)
const merchants = ref([])
const search    = ref('')
const activeFilter = ref('all')

const filters = [
  { label: 'All',        value: 'all'        },
  { label: 'Trial',      value: 'trial'      },
  { label: 'Subscribed', value: 'subscribed' },
  { label: 'Signed up',  value: 'signed_up'  },
  { label: 'Expired',    value: 'expired'    },
  { label: 'Cancelled',  value: 'cancelled'  },
]

const stats = computed(() => ({
  total:      merchants.value.length,
  subscribed: merchants.value.filter(m => m.status === 'subscribed').length,
  trial:      merchants.value.filter(m => m.status === 'trial').length,
  cancelled:  merchants.value.filter(m => m.status === 'cancelled').length,
  expired:    merchants.value.filter(m => m.status === 'expired').length,
}))

const filtered = computed(() => {
  let list = merchants.value
  if (activeFilter.value !== 'all') {
    list = list.filter(m => m.status === activeFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(m =>
      m.merchant_name.toLowerCase().includes(q) ||
      m.merchant_id.toLowerCase().includes(q) ||
      m.affiliate_name.toLowerCase().includes(q)
    )
  }
  return list
})

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/merchants/')
    merchants.value = data.results ?? data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stats-grid        { grid-template-columns: repeat(5, 1fr) }
.merchant-name     { font-size: 13px; font-weight: 500 }
.stat-value--amber { color: var(--amber-text) }
.stat-value--red   { color: var(--red-text) }
</style>
