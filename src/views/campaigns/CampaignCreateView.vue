<template>
  <div>
    <div class="breadcrumb">
      <RouterLink to="/campaigns">Campaigns</RouterLink>
      <i class="ti ti-chevron-right" aria-hidden="true" />
      <span>New campaign</span>
    </div>
    <h1 class="page-title">Create campaign</h1>
    <p class="page-sub">Fill in the details below. Save as a draft or start the campaign immediately.</p>

    <div class="form-layout">
      <!-- LEFT COLUMN -->
      <div class="form-col">
        <!-- Basic details -->
        <div class="card">
          <div class="card-title">Basic details</div>
          <div class="field">
            <label>Campaign name <span class="req">*</span></label>
            <input v-model="form.name" type="text" placeholder="e.g. Q3 Influencer Drive" />
          </div>
          <div class="field" style="margin-top:14px">
            <label>Description</label>
            <textarea v-model="form.description" placeholder="Describe the goal and terms of this campaign…" />
          </div>
        </div>

        <!-- Commission -->
        <div class="card">
          <div class="card-title">Commission structure</div>
          <div class="toggle-row">
            <div>
              <div class="toggle-label">Commission enabled</div>
              <div class="toggle-sub">Affiliates earn a reward per confirmed subscription payment</div>
            </div>
            <div class="toggle" :class="{ on: form.commission_enabled }" @click="form.commission_enabled = !form.commission_enabled" />
          </div>
          <div v-if="form.commission_enabled" class="commission-box">
            <div class="radio-group">
              <div v-for="t in commissionTypes" :key="t.value" class="radio-opt" :class="{ on: form.commission_type === t.value }" @click="form.commission_type = t.value">
                <div class="radio-dot" :class="{ on: form.commission_type === t.value }" />
                {{ t.label }}
              </div>
            </div>
            <div class="field-row">
              <div>
                <label>{{ form.commission_type === 'flat_fee' ? 'Amount per sale (₦)' : 'Percentage (%)' }} <span class="req">*</span></label>
                <input v-model.number="form.commission_value" type="number" min="0" placeholder="e.g. 15000" />
                <div class="hint">{{ form.commission_type === 'flat_fee' ? 'Enter amount in naira' : 'Enter percentage, e.g. 10 for 10%' }}</div>
              </div>
              <div v-if="form.commission_type !== 'flat_fee'">
                <label>Cap amount (₦) <span v-if="form.commission_type === 'percentage_capped'" class="req">*</span></label>
                <input v-model.number="form.commission_cap" type="number" min="0" placeholder="Optional" />
                <div class="hint">Leave blank for no cap</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Commission trigger -->
        <div class="card">
          <div class="card-title">Commission trigger <span class="req">*</span></div>
          <div class="field">
            <div class="radio-group radio-group--col">
              <div
                v-for="t in commissionTriggers" :key="t.value"
                class="radio-opt radio-opt--block"
                :class="{ on: form.commission_trigger === t.value }"
                @click="form.commission_trigger = t.value"
              >
                <div class="radio-dot" :class="{ on: form.commission_trigger === t.value }" />
                <div>
                  <div class="radio-opt-label">{{ t.label }}</div>
                  <div class="radio-opt-sub">{{ t.sub }}</div>
                </div>
              </div>
            </div>
            <div v-if="form.commission_trigger === 'subscriptions_within_period'" class="field" style="margin-top:12px">
              <label>Commission period (days) <span class="req">*</span></label>
              <input v-model.number="form.commission_period_days" type="number" min="1" placeholder="e.g. 365" />
              <div class="hint">Affiliates earn on renewals that occur within this many days of the merchant's signup</div>
            </div>
          </div>
        </div>

        <!-- Per-tier commission -->
        <div class="card">
          <div class="card-title">Per-tier commission <span class="optional-label">— optional</span></div>
          <div class="toggle-row">
            <div>
              <div class="toggle-label">Override commission by tier</div>
              <div class="toggle-sub">Set a different commission amount for each subscription tier</div>
            </div>
            <div class="toggle" :class="{ on: form.use_per_tier }" @click="form.use_per_tier = !form.use_per_tier" />
          </div>
          <div v-if="form.use_per_tier" class="commission-box" style="margin-top:12px">
            <div v-for="t in tiers.filter(t => t.value !== 'all')" :key="t.value" class="field-row" style="margin-bottom:10px">
              <div>
                <label>{{ t.label }} tier amount (₦)</label>
                <input v-model.number="form.commission_per_tier[t.value]" type="number" min="0" :placeholder="`e.g. ${t.placeholder}`" />
              </div>
            </div>
            <div class="hint">Leave a tier blank to use the default commission for that tier</div>
          </div>
        </div>

        <!-- Duration -->
        <div class="card">
          <div class="card-title">Campaign duration</div>
          <div class="field-row" style="margin-bottom:14px">
            <div>
              <label>Start date <span class="req">*</span></label>
              <input v-model="form.start_date" type="date" :min="today" />
            </div>
            <div>
              <label>End date</label>
              <input v-model="form.end_date" type="date" :min="form.start_date || today" />
              <div class="hint">Leave blank if ending by sales volume only</div>
            </div>
          </div>
          <div class="toggle-row">
            <div>
              <div class="toggle-label">End by sales volume</div>
              <div class="toggle-sub">Campaign stops when a total sales target is reached</div>
            </div>
            <div class="toggle" :class="{ on: form.use_max_conversions }" @click="form.use_max_conversions = !form.use_max_conversions" />
          </div>
          <div v-if="form.use_max_conversions" class="field" style="margin-top:14px">
            <label>Maximum conversions <span class="req">*</span></label>
            <input v-model.number="form.max_conversions" type="number" min="1" placeholder="e.g. 100" />
          </div>
        </div>

        <!-- Tier -->
        <div class="card">
          <div class="card-title">Eligible tier</div>
          <div class="tier-grid">
            <div v-for="t in tiers" :key="t.value" class="tier-opt" :class="{ on: form.tier === t.value }" @click="form.tier = t.value">
              {{ t.label }}
              <div class="tier-sub">{{ t.sub }}</div>
            </div>
          </div>
        </div>

        <!-- Affiliates -->
        <div class="card">
          <div class="card-title">Affiliates <span class="optional-label">— optional</span></div>
          <div v-if="selectedAffiliates.length" class="affiliate-list">
            <div v-for="a in selectedAffiliates" :key="a.id" class="aff-row">
              <div class="aff-info">
                <div class="aff-avatar">{{ initials(a.full_name) }}</div>
                <div>
                  <div class="aff-name">{{ a.full_name }}</div>
                  <div class="aff-email">{{ a.email }}</div>
                </div>
              </div>
              <button class="remove-btn" @click="removeAffiliate(a.id)"><i class="ti ti-x" /></button>
            </div>
          </div>
          <div class="add-row">
            <div style="position:relative;flex:1">
              <input v-model="affiliateSearch" type="text" placeholder="Search affiliates to add…" @input="searchAffiliates" @focus="showDropdown = true" @blur="() => setTimeout(() => showDropdown = false, 150)" />
              <div v-if="showDropdown && affiliateResults.length" class="dropdown">
                <div v-for="a in affiliateResults" :key="a.id" class="dropdown-item" @mousedown.prevent="addAffiliate(a)">
                  <div class="aff-avatar aff-avatar--sm">{{ initials(a.full_name) }}</div>
                  <div><div class="aff-name">{{ a.full_name }}</div><div class="aff-email">{{ a.email }}</div></div>
                </div>
              </div>
            </div>
          </div>
          <div class="hint" style="margin-top:6px">Affiliates can also be added after the campaign is created</div>
        </div>

        <!-- T&Cs -->
        <div class="card">
          <div class="card-title">Terms &amp; conditions</div>
          <div class="toggle-row">
            <div>
              <div class="toggle-label">Require T&amp;C sign-off</div>
              <div class="toggle-sub">Affiliates must accept terms before accessing their link or code</div>
            </div>
            <div class="toggle" :class="{ on: form.require_tc }" @click="form.require_tc = !form.require_tc" />
          </div>
        </div>
      </div>

      <!-- RIGHT SIDEBAR -->
      <div class="sidebar-col">
        <div class="sidebar-card">
          <div class="sidebar-card-title">Save or start</div>
          <button class="btn-start" :disabled="submitting" @click="submit('start')">
            <i v-if="submitting && submitAction === 'start'" class="ti ti-loader-2 spin" />
            Start campaign
          </button>
          <button class="btn-draft" :disabled="submitting" @click="submit('draft')">
            <i v-if="submitting && submitAction === 'draft'" class="ti ti-loader-2 spin" />
            Save as draft
          </button>
          <div class="info-box">
            <i class="ti ti-info-circle" />
            <div><strong>Start campaign</strong> saves and schedules this campaign. Emails are sent to assigned affiliates immediately.</div>
          </div>
        </div>

        <div class="sidebar-card">
          <div class="sidebar-card-title">Link &amp; code format</div>
          <div class="info-row"><i class="ti ti-link" /><div>Links use the prefix <strong>leyyow.com/ref/</strong> + unique code per affiliate.</div></div>
          <div class="info-row"><i class="ti ti-ticket" /><div>Coupon codes are auto-generated in NAME-XXXX format. Affiliates can customise theirs.</div></div>
        </div>

        <div class="sidebar-card">
          <div class="sidebar-card-title">Required to start</div>
          <div class="checklist-row">
            <i :class="form.name ? 'ti ti-circle-check check--done' : 'ti ti-circle check--empty'" />
            Campaign name
          </div>
          <div class="checklist-row">
            <i :class="commissionValid ? 'ti ti-circle-check check--done' : 'ti ti-circle check--empty'" />
            Commission configured
          </div>
          <div class="checklist-row">
            <i :class="form.start_date ? 'ti ti-circle-check check--done' : 'ti ti-circle check--empty'" />
            Start date
          </div>
          <div class="checklist-row">
            <i :class="form.commission_trigger ? 'ti ti-circle-check check--done' : 'ti ti-circle check--empty'" />
            Commission trigger
          </div>
          <div class="checklist-row">
            <i :class="triggerPeriodValid ? 'ti ti-circle-check check--done' : 'ti ti-circle check--empty'" />
            Commission period
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast  = useToastStore()
const today  = new Date().toISOString().split('T')[0]

const form = ref({
  name: '', description: '',
  commission_enabled: true, commission_type: 'flat_fee',
  commission_value: null, commission_cap: null,
  commission_trigger: '', commission_period_days: null,
  use_per_tier: false, commission_per_tier: {},
  start_date: '', end_date: '',
  use_max_conversions: false, max_conversions: null,
  tier: 'all', require_tc: true,
})

const selectedAffiliates = ref([])
const allAffiliates      = ref([])
const affiliateSearch    = ref('')
const showDropdown       = ref(false)
const submitting         = ref(false)
const submitAction       = ref('')

const commissionTypes = [
  { value: 'flat_fee',          label: 'Flat fee' },
  { value: 'percentage',        label: 'Percentage' },
  { value: 'percentage_capped', label: '% + cap' },
]

const commissionTriggers = [
  {
    value: 'first_subscription_only',
    label: 'First subscription only',
    sub:   'Affiliate earns once per merchant, on their first paid subscription',
  },
  {
    value: 'all_subscriptions',
    label: 'All subscriptions',
    sub:   'Affiliate earns on every subscription and renewal for this merchant',
  },
  {
    value: 'subscriptions_within_period',
    label: 'Subscriptions within a period',
    sub:   "Affiliate earns on renewals that occur within a set number of days of the merchant's signup",
  },
]

const tiers = [
  { value: 'all',   label: 'All',   sub: 'All merchants',  placeholder: '5000'  },
  { value: 'bloom', label: 'Bloom', sub: 'Bloom tier only', placeholder: '5000'  },
  { value: 'burst', label: 'Burst', sub: 'Burst tier only', placeholder: '10000' },
]

const commissionValid = computed(() =>
  !form.value.commission_enabled || (form.value.commission_type && form.value.commission_value > 0)
)

const triggerPeriodValid = computed(() =>
  form.value.commission_trigger !== 'subscriptions_within_period' ||
  (form.value.commission_period_days > 0)
)

const affiliateResults = computed(() => {
  const ids = selectedAffiliates.value.map(a => a.id)
  const q   = affiliateSearch.value.toLowerCase().trim()
  return allAffiliates.value
    .filter(a => !ids.includes(a.id))
    .filter(a => !q || a.full_name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
    .slice(0, 8)
})

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/affiliates/', { params: { assignable: 'true' } })
    allAffiliates.value = data.results ?? data
  } catch { allAffiliates.value = [] }
})

function addAffiliate(a) {
  selectedAffiliates.value.push(a)
  affiliateSearch.value = ''
  showDropdown.value = false
}
function removeAffiliate(id) { selectedAffiliates.value = selectedAffiliates.value.filter(a => a.id !== id) }
function initials(name) { return (name || '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() }
function searchAffiliates() {}

async function submit(action) {
  if (!form.value.name.trim()) { toast.show('Campaign name is required.', 'error'); return }

  if (action === 'start') {
    if (!form.value.start_date){ toast.show('Start date is required.', 'error'); return }
    if (!form.value.commission_trigger){ toast.show('Commission trigger is required.', 'error'); return }
    if (!triggerPeriodValid.value){ toast.show('Commission period (days) is required.', 'error'); return }
    if (form.value.commission_enabled && !form.value.commission_value) {
      toast.show('Commission value is required.', 'error'); return
    }
  }

  if (form.value.commission_enabled && form.value.commission_type !== 'flat_fee') {
    const pct = form.value.commission_value
    if (pct > 100) {
      toast.show('Percentage cannot exceed 100%.', 'error'); return
    }
    if (pct !== null && !Number.isInteger(pct)) {
      toast.show('Percentage must be a whole number (e.g. 10, not 10.5).', 'error'); return
    }
  }

  submitting.value   = true
  submitAction.value = action

  // Build commission_per_tier — only include tiers with a value entered
  let commission_per_tier = null
  if (form.value.use_per_tier) {
    const entries = Object.entries(form.value.commission_per_tier)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => [k, Math.round(v * 100)])
    if (entries.length) commission_per_tier = Object.fromEntries(entries)
  }

  const payload = {
    is_draft: action === 'draft',
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    commission_type: form.value.commission_enabled ? form.value.commission_type : null,
    // commission_value: form.value.commission_enabled ? Math.round(form.value.commission_value * 100) : 0,
    commission_value: form.value.commission_enabled && form.value.commission_value
    ? Math.round(form.value.commission_value * 100) : null,
    commission_cap: (form.value.commission_cap && form.value.commission_type === 'percentage_capped')
                             ? Math.round(form.value.commission_cap * 100) : null,
    commission_trigger: form.value.commission_trigger,
    commission_period_days: form.value.commission_trigger === 'subscriptions_within_period'
                             ? form.value.commission_period_days : null,
    commission_per_tier,
    starts_at: form.value.start_date || null,
    ends_at: form.value.end_date   || null,
    conversion_limit: form.value.use_max_conversions ? form.value.max_conversions : null,
    tier: form.value.tier,
    require_tc: form.value.require_tc,
    affiliate_ids: selectedAffiliates.value.map(a => a.id),
  }

  try {
    const { data } = await api.post('/admin/campaigns/', payload)
    if (action === 'start') {
      await api.post(`/admin/campaigns/${data.id}/transition/`, { action: 'start' })
      toast.show('Campaign scheduled successfully.', 'success')
    } else {
      toast.show('Campaign saved as draft.', 'success')
    }
    router.push(`/campaigns/${data.id}`)
  } catch (err) {
    const msg = err.response?.data?.detail
      || Object.values(err.response?.data ?? {})[0]?.[0]
      || 'Something went wrong. Please try again.'
    toast.show(msg, 'error')
  } finally {
    submitting.value   = false
    submitAction.value = ''
  }
}
</script>

<style scoped>
.breadcrumb i { font-size:12px }
.page-title { margin-bottom:4px }
.page-sub { margin-bottom:24px }
.form-layout { display:grid;grid-template-columns:1fr 300px;gap:18px;align-items:start }
.form-col { display:flex;flex-direction:column;gap:14px }
.sidebar-col { display:flex;flex-direction:column;gap:12px }
.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px }
.card-title { font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px }
.optional-label { font-size:10px;font-weight:400;color:var(--text-tertiary);text-transform:none;letter-spacing:0 }
.sidebar-card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px }
.sidebar-card-title { font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px }
.field-row { display:grid;grid-template-columns:1fr 1fr;gap:14px }
.toggle-row { display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--border) }
.toggle-row:last-of-type { border-bottom:none }
.toggle-label { font-size:13px;font-weight:500 }
.toggle-sub { font-size:11px;color:var(--text-tertiary);margin-top:3px;line-height:1.4 }
.toggle { width:38px;height:22px;background:var(--border-strong);border-radius:99px;position:relative;cursor:pointer;flex-shrink:0;transition:background 0.2s;margin-top:2px }
.toggle.on { background:var(--brand) }
.toggle::after { content:'';position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;left:3px;transition:left 0.2s }
.toggle.on::after { left:19px }
.commission-box { background:var(--bg);border-radius:var(--radius-md);padding:14px;margin-top:12px;border:1px solid var(--border) }
.radio-group { display:flex;gap:8px;margin-bottom:14px }
.radio-group--col { flex-direction:column;gap:8px;margin-bottom:0 }
.radio-opt { flex:1;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:9px;font-size:13px;background:var(--surface);transition:all 0.1s }
.radio-opt.on { border-color:var(--brand);background:var(--pollen-light);font-weight:500 }
.radio-opt--block { flex:none;align-items:flex-start }
.radio-opt-label { font-size:13px;font-weight:500 }
.radio-opt-sub { font-size:11px;color:var(--text-tertiary);margin-top:2px;line-height:1.4;font-weight:400 }
.radio-dot { width:15px;height:15px;border-radius:50%;border:2px solid var(--border-strong);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px }
.radio-dot.on { border-color:var(--brand) }
.radio-dot.on::after { content:'';width:7px;height:7px;border-radius:50%;background:var(--brand);display:block }
.tier-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:8px }
.tier-opt { border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 8px;cursor:pointer;text-align:center;font-size:12px;font-weight:500;background:var(--surface);transition:all 0.1s }
.tier-opt.on { border-color:var(--brand);background:var(--pollen-light);font-weight:600 }
.tier-sub { font-size:10px;color:var(--text-tertiary);margin-top:3px;font-weight:400 }
.affiliate-list { display:flex;flex-direction:column;gap:6px;margin-bottom:10px }
.aff-row { display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border:1px solid var(--border);border-radius:var(--radius-md);background:var(--surface) }
.aff-info { display:flex;align-items:center;gap:9px }
.aff-avatar { width:28px;height:28px;border-radius:50%;background:var(--pollen);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--amber-text);flex-shrink:0 }
.aff-avatar--sm { width:24px;height:24px;font-size:9px }
.aff-name { font-size:13px;font-weight:500 }
.aff-email { font-size:11px;color:var(--text-tertiary) }
.remove-btn { background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:16px;padding:2px }
.remove-btn:hover { color:var(--red-text) }
.add-row { display:flex;gap:8px }
.dropdown { position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);box-shadow:var(--shadow-md);z-index:100;overflow:hidden }
.dropdown-item { display:flex;align-items:center;gap:9px;padding:9px 12px;cursor:pointer;transition:background 0.1s }
.dropdown-item:hover { background:var(--bg) }
.btn-start { width:100%;padding:12px;border-radius:var(--radius-md);border:none;background:var(--brand);font-size:13px;color:var(--brand-deep);cursor:pointer;font-weight:600;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:7px;transition:background 0.15s }
.btn-start:hover:not(:disabled) { background:var(--brand-dark) }
.btn-draft { width:100%;padding:12px;border-radius:var(--radius-md);border:1px solid var(--border);background:var(--surface);font-size:13px;color:var(--text-primary);cursor:pointer;font-weight:500;font-family:var(--font);margin-top:8px;display:flex;align-items:center;justify-content:center;gap:7px;transition:background 0.1s }
.btn-draft:hover:not(:disabled) { background:var(--bg) }
.btn-start:disabled,.btn-draft:disabled { opacity:0.6;cursor:not-allowed }
.info-box { background:var(--pollen-light);border:1px solid #F0D890;border-radius:var(--radius-md);padding:12px;font-size:12px;color:var(--amber-text);display:flex;gap:8px;align-items:flex-start;margin-top:12px;line-height:1.5 }
.info-box i { font-size:14px;flex-shrink:0;margin-top:1px }
.info-row { display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--text-secondary);margin-bottom:10px;line-height:1.5 }
.info-row:last-child { margin-bottom:0 }
.info-row i { font-size:14px;flex-shrink:0;margin-top:1px;color:var(--text-tertiary) }
.checklist-row { display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);padding:7px 0;border-bottom:1px solid var(--border) }
.checklist-row:last-child { border-bottom:none }
.check--done { font-size:15px;color:var(--green-text) }
.check--empty { font-size:15px;color:var(--text-tertiary) }
</style>