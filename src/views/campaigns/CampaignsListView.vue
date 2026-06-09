<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Campaigns</h1>
        <p class="page-sub">Manage and monitor all affiliate campaigns.</p>
      </div>
      <RouterLink to="/campaigns/new" class="btn-primary">
        <i class="ti ti-plus" aria-hidden="true" /> New campaign
      </RouterLink>
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-label">Total campaigns</div>
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-sub">All time</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active now</div>
        <div class="stat-value" style="color: var(--green-text)">{{ stats.active }}</div>
        <div class="stat-sub">Running today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total conversions</div>
        <div class="stat-value">{{ stats.conversions }}</div>
        <div class="stat-sub">All campaigns</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total commissions paid</div>
        <div class="stat-value">{{ fmt.naira(stats.commissions_paid) }}</div>
        <div class="stat-sub">All time</div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="filter-pills">
        <button
          v-for="f in filters"
          :key="f.value"
          class="pill"
          :class="{ 'pill--active': activeFilter === f.value }"
          @click="activeFilter = f.value"
        >{{ f.label }}</button>
      </div>
      <div class="search-wrap">
        <i class="ti ti-search" aria-hidden="true" />
        <input v-model="search" type="text" placeholder="Search campaigns…" />
      </div>
    </div>

    <!-- Table -->
    <AppLoader v-if="loading" />

    <template v-else>
      <div class="table-card" v-if="filtered.length">
        <table>
          <thead>
            <tr>
              <th style="width:28%">Campaign</th>
              <th style="width:11%">Status</th>
              <th style="width:16%">Dates</th>
              <th style="width:10%">Affiliates</th>
              <th style="width:10%">Conv.</th>
              <th style="width:14%">Commission</th>
              <th style="width:11%"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in filtered"
              :key="c.id"
              class="table-row"
              @click="$router.push(`/campaigns/${c.id}`)"
            >
              <td>
                <div class="campaign-name">{{ c.name }}</div>
              </td>
              <td>
                <span class="badge" :class="fmt.campaignStatus(c.status).cls">
                  {{ fmt.campaignStatus(c.status).label }}
                </span>
              </td>
              <td class="td-muted">
                {{ fmt.date(c.starts_at) }}<br>
                <span v-if="c.ends_at">→ {{ fmt.date(c.ends_at) }}</span>
                <span v-else>No end date</span>
              </td>
              <td class="td-center">{{ c.affiliate_count ?? 0 }}</td>
              <td class="td-center">{{ c.conversion_count ?? 0 }}</td>
              <td>{{ fmt.commissionDisplay(c) }}</td>
              <td class="td-action">
                <i class="ti ti-chevron-right" aria-hidden="true" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <EmptyState
        v-else
        icon="speakerphone"
        title="No campaigns yet"
        message="Create your first campaign to start tracking affiliate referrals."
      >
        <RouterLink to="/campaigns/new" class="btn-primary" style="margin-top:16px">
          <i class="ti ti-plus" aria-hidden="true" /> New campaign
        </RouterLink>
      </EmptyState>
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
const campaigns = ref([])
const stats     = ref({ total: 0, active: 0, conversions: 0, commissions_paid: 0 })
const search      = ref('')
const activeFilter = ref('all')

const filters = [
  { label: 'All',       value: 'all' },
  { label: 'Active',    value: 'active' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Draft',     value: 'draft' },
  { label: 'Ended',     value: 'ended' },
  { label: 'Cancelled', value: 'cancelled' },
]

const filtered = computed(() => {
  let list = campaigns.value
  if (activeFilter.value !== 'all') list = list.filter(c => c.status === activeFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(c => c.name.toLowerCase().includes(q))
  }
  return list
})

onMounted(async () => {
  try {
    const [camRes, analyticsRes] = await Promise.all([
      api.get('/admin/campaigns/'),
      api.get('/admin/analytics/'),
    ])
    campaigns.value = camRes.data.results ?? camRes.data
    const a = analyticsRes.data.overview
    stats.value = {
      total:            a.total_campaigns    ?? 0,
      active:           a.active_campaigns   ?? 0,
      conversions:      a.total_conversions  ?? 0,
      commissions_paid: a.total_commissions  ?? 0,
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-title { margin-bottom:3px }
.campaign-name { font-size:13px;font-weight:500;color:var(--text-primary) }
.campaign-desc { font-size:11px;color:var(--text-tertiary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px }
.td-muted  { font-size:12px;color:var(--text-secondary);line-height:1.6 }
.td-center { text-align:center;font-size:13px }
.td-action { text-align:right;color:var(--text-tertiary) }
.td-action i { font-size:16px }
</style>
