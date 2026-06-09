<template>
  <div v-if="loading"><AppLoader :page="true" /></div>

  <div v-else-if="!merchant">
    <EmptyState icon="alert-circle" title="Merchant not found" message="This merchant doesn't exist or was removed." />
  </div>

  <div v-else>
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <RouterLink to="/merchants">Merchants</RouterLink>
      <i class="ti ti-chevron-right" />
      <span>{{ merchant.merchant_name }}</span>
    </div>

    <!-- Page header -->
    <div class="page-header">
      <div>
        <div class="page-title">{{ merchant.merchant_name }}</div>
        <div class="page-meta">Signed up {{ fmt.date(merchant.signed_up_at) }}</div>
      </div>
      <span class="badge" :class="fmt.merchantStatus(merchant.status).cls">
        <span class="badge-dot" />{{ fmt.merchantStatus(merchant.status).label }}
      </span>
    </div>

    <div class="layout-2col">

      <!-- LEFT col -->
      <div>
        <!-- Merchant info -->
        <div class="card">
          <div class="card-title">Merchant</div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-id" /> Merchant ID</span>
            <span class="detail-value code-pill">{{ merchant.merchant_id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-user" /> Affiliate</span>
            <RouterLink :to="`/affiliates/${merchant.affiliate_id}`" class="detail-link">
              {{ merchant.affiliate_name }}
            </RouterLink>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-speakerphone" /> Campaign</span>
            <RouterLink :to="`/campaigns/${merchant.campaign_id}`" class="detail-link">
              {{ merchant.campaign_name }}
            </RouterLink>
          </div>
          <div class="detail-row">
            <span class="detail-label"><i class="ti ti-tag" /> Coupon code</span>
            <span class="detail-value code-pill">{{ merchant.affiliate_code || '—' }}</span>
          </div>
        </div>

        <!-- Subscription -->
        <div class="card">
          <div class="card-title">Subscription</div>
          <div class="detail-row">
            <span class="detail-label">Tier</span>
            <span class="detail-value">{{ merchant.subscription_tier || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Start date</span>
            <span class="detail-value">{{ fmt.date(merchant.subscription_start) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">End date</span>
            <span class="detail-value">{{ fmt.date(merchant.subscription_end) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Last payment</span>
            <span class="detail-value" style="font-weight:500">
              {{ merchant.amount_paid_kobo ? fmt.naira(merchant.amount_paid_kobo) : '—' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Total paid</span>
            <span class="detail-value" style="font-weight:600;color:var(--green-text)">
              {{ fmt.naira(merchant.total_amount_paid_kobo) }}
            </span>
          </div>
        </div>

        <!-- First subscription -->
        <div class="card" v-if="merchant.first_subscribed_at">
          <div class="card-title">First subscription</div>
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ fmt.date(merchant.first_subscribed_at) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Tier</span>
            <span class="detail-value">{{ merchant.first_subscription_tier || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- RIGHT col -->
      <div>
        <!-- Summary stats -->
        <div class="stats-grid-3">
          <div class="stat-sm">
            <div class="stat-sm-label">Total paid</div>
            <div class="stat-sm-value">{{ fmt.naira(merchant.total_amount_paid_kobo) }}</div>
            <div class="stat-sm-sub">All subscriptions</div>
          </div>
          <div class="stat-sm" :class="merchant.commissions?.length ? 'stat-sm--green' : ''">
            <div class="stat-sm-label">Commissions</div>
            <div class="stat-sm-value" :style="merchant.commissions?.length ? 'color:var(--green-text)' : ''">
              {{ merchant.commissions?.length ?? 0 }}
            </div>
            <div class="stat-sm-sub">Earned by affiliate</div>
          </div>
          <div class="stat-sm">
            <div class="stat-sm-label">Affiliate earned</div>
            <div class="stat-sm-value">{{ fmt.naira(totalCommission) }}</div>
            <div class="stat-sm-sub">All time</div>
          </div>
        </div>

        <!-- Commission history -->
        <div class="full-card">
          <div class="full-card-header">
            <div>
              <div class="section-label">Commission history</div>
              <div class="section-sub">Commissions earned by the affiliate for this merchant</div>
            </div>
          </div>

          <template v-if="merchant.commissions?.length">
            <table>
              <thead>
                <tr>
                  <th style="width:35%">Date</th>
                  <th style="width:35%">Amount</th>
                  <th style="width:30%">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in merchant.commissions" :key="c.id">
                  <td class="muted">{{ fmt.date(c.earned_at) }}</td>
                  <td style="font-weight:500">{{ fmt.naira(c.amount) }}</td>
                  <td>
                    <span class="badge" :class="commissionCls(c.status)">
                      <span class="badge-dot" />{{ c.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>

          <div v-else class="empty-inline">No commissions recorded for this merchant yet.</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'
import { useFormat } from '@/composables/useFormat'
import AppLoader from '@/components/ui/AppLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const route    = useRoute()
const fmt      = useFormat()
const loading  = ref(true)
const merchant = ref(null)

const totalCommission = computed(() =>
  (merchant.value?.commissions ?? []).reduce((sum, c) => sum + (c.amount ?? 0), 0)
)

function commissionCls(s) {
  return { earned: 'badge--green', reversed: 'badge--red' }[s] ?? 'badge--gray'
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/admin/merchants/${route.params.merchant_id}/`)
    merchant.value = data
  } catch {
    merchant.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* Page meta */
.page-meta { font-size: 12px; color: var(--text-tertiary); margin-top: 4px }

/* 2-col layout */
.layout-2col { display: grid; grid-template-columns: 268px 1fr; gap: 16px; align-items: start }

/* Cards */
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px 20px; margin-bottom: 14px }
.card-title { font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px }

/* Detail rows */
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px }
.detail-row:last-child { border-bottom: none }
.detail-label { color: var(--text-secondary); display: flex; align-items: center; gap: 6px; font-size: 12px }
.detail-label i { font-size: 14px; color: var(--text-tertiary) }
.detail-value { font-weight: 500; text-align: right }
.detail-link { font-size: 13px; color: var(--brand-deep); font-weight: 500 }
.detail-link:hover { text-decoration: underline }
.code-pill { font-family: monospace; font-size: 12px; background: var(--bg); padding: 3px 9px; border-radius: 5px; color: var(--text-secondary); border: 1px solid var(--border) }

/* Stat mini-cards */
.stats-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px }
.stat-sm { background: var(--surface-warm); border-radius: var(--radius-md); padding: 12px 14px; border: 1px solid var(--border) }
.stat-sm--green { background: var(--green-bg); border-color: #B8E8D0 }
.stat-sm-label { font-size: 10px; font-weight: 500; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px }
.stat-sm-value { font-size: 18px; font-weight: 600; letter-spacing: -0.4px; line-height: 1 }
.stat-sm-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 3px }

/* Full-width card with header */
.full-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 16px }
.full-card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between }
.section-label { font-size: 14px; font-weight: 600; letter-spacing: -0.2px }
.section-sub { font-size: 12px; color: var(--text-tertiary); margin-top: 2px }

/* Table inside full-card */
table { width: 100%; border-collapse: collapse }
thead { background: var(--surface-warm); border-bottom: 1px solid var(--border) }
th { padding: 11px 18px; font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-align: left; text-transform: uppercase; letter-spacing: 0.07em }
td { padding: 13px 18px; font-size: 13px; border-bottom: 1px solid var(--border) }
tr:last-child td { border-bottom: none }

.muted { color: var(--text-tertiary) }
.empty-inline { padding: 20px 20px; font-size: 13px; color: var(--text-tertiary); text-align: center }
</style>
