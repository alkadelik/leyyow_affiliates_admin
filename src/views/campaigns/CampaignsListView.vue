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
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; gap: 16px;
}
.page-title { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 3px; }
.page-sub   { font-size: 13px; color: var(--text-secondary); }

/* Stats */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 18px 20px;
}
.stat-label { font-size: 11px; font-weight: 500; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
.stat-value { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; line-height: 1; }
.stat-sub   { font-size: 11px; color: var(--text-tertiary); margin-top: 5px; }

/* Toolbar */
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 14px;
}
.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; }
.pill {
  padding: 5px 13px; border-radius: 99px;
  border: 1px solid var(--border); background: var(--surface);
  font-size: 12px; color: var(--text-secondary); cursor: pointer;
  font-family: var(--font); transition: all 0.1s;
}
.pill:hover { background: var(--bg); }
.pill--active { background: var(--brand); border-color: var(--brand); color: var(--brand-deep); font-weight: 600; }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 7px 11px; min-width: 220px;
}
.search-wrap i { font-size: 15px; color: var(--text-tertiary); flex-shrink: 0; }
.search-wrap input {
  border: none; background: none; font-size: 13px; color: var(--text-primary);
  font-family: var(--font); width: 100%;
}
.search-wrap input:focus { outline: none; }

/* Table */
.table-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--surface-warm); border-bottom: 1px solid var(--border); }
th {
  padding: 10px 14px; text-align: left;
  font-size: 11px; font-weight: 600; color: var(--text-tertiary);
  text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.table-row { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: var(--surface-warm); }
td { padding: 12px 14px; vertical-align: middle; }
.campaign-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.campaign-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
.td-muted  { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }
.td-center { text-align: center; font-size: 13px; }
.td-action { text-align: right; color: var(--text-tertiary); }
.td-action i { font-size: 16px; }

/* Badges */
.badge {
  display: inline-block; padding: 3px 9px; border-radius: 99px;
  font-size: 11px; font-weight: 600; white-space: nowrap;
}
.badge--green { background: var(--green-bg); color: var(--green-text); }
.badge--amber { background: var(--amber-bg); color: var(--amber-text); }
.badge--gray  { background: var(--gray-bg);  color: var(--gray-text);  }
.badge--red   { background: var(--red-bg);   color: var(--red-text);   }
.badge--blue  { background: var(--blue-bg);  color: var(--blue-text);  }

.btn-primary {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--brand); border: none; border-radius: var(--radius-md);
  padding: 10px 18px; font-size: 13px; font-weight: 600;
  color: var(--brand-deep); cursor: pointer; font-family: var(--font);
  transition: background 0.15s; text-decoration: none;
}
.btn-primary:hover { background: var(--brand-dark); }
</style>
