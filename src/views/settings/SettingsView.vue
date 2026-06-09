<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Settings</h1>
        <p class="page-sub">Configure global settings for the affiliate programme.</p>
      </div>
    </div>

    <AppLoader v-if="loading" />

    <template v-else>
      <div class="settings-layout">

        <!-- Left nav -->
        <div class="settings-nav">
          <div class="settings-nav-item" :class="{ active: section === 'payouts' }" @click="section = 'payouts'">
            <i class="ti ti-cash" /> Payouts
          </div>
          <div class="settings-nav-item" :class="{ active: section === 'tracking' }" @click="section = 'tracking'">
            <i class="ti ti-link" /> Tracking
          </div>
        </div>

        <!-- Right content -->
        <div class="settings-content">

          <!-- Payouts -->
          <template v-if="section === 'payouts'">
            <div class="card">
              <div class="card-section-title">Payout settings</div>
              <div class="card-section-sub">Configure payout thresholds. Changes apply to all future payout requests.</div>

              <div class="field" style="margin-bottom: 20px">
                <label>Minimum payout amount</label>
                <div class="input-prefix">
                  <span class="input-prefix-label">₦</span>
                  <input v-model.number="form.minimum_withdrawal_naira" type="number" min="0" step="500" />
                </div>
                <div class="hint">Affiliates cannot withdraw below this amount.</div>
              </div>

              <div class="toggle-row">
                <div>
                  <div class="toggle-label">Auto-approve payouts</div>
                  <div class="toggle-sub">When on, approved payout requests are disbursed to Paystack automatically without manual review.</div>
                </div>
                <div
                  class="toggle"
                  :class="{ on: form.payout_auto_approve }"
                  @click="form.payout_auto_approve = !form.payout_auto_approve"
                />
              </div>

              <Transition name="fade">
                <div v-if="error" class="error-banner" style="margin-top:14px">
                  <i class="ti ti-alert-circle" /> {{ error }}
                </div>
              </Transition>

              <div class="save-row">
                <button class="btn-cancel" @click="resetForm">Cancel</button>
                <button class="btn-save" :disabled="saving" @click="save">
                  <i v-if="saving" class="ti ti-loader-2 spin" />
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </div>
          </template>

          <!-- Tracking -->
          <template v-if="section === 'tracking'">
            <div class="card">
              <div class="card-section-title">Affiliate link format</div>
              <div class="card-section-sub">Configure the base URL for all affiliate tracking links. The path <code>/r/[slug]</code> is appended automatically. Leave blank to use the default (<code>https://leyyow.com</code>).</div>

              <div class="field">
                <label>Tracking base URL</label>
                <input v-model="form.tracking_base_url" type="url" placeholder="https://leyyow.com" />
                <div class="hint">Affiliate links appear as [base URL]/r/[unique-slug]</div>
              </div>

              <Transition name="fade">
                <div v-if="error" class="error-banner" style="margin-top:14px">
                  <i class="ti ti-alert-circle" /> {{ error }}
                </div>
              </Transition>

              <div class="save-row">
                <button class="btn-cancel" @click="resetForm">Cancel</button>
                <button class="btn-save" :disabled="saving" @click="save">
                  <i v-if="saving" class="ti ti-loader-2 spin" />
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </div>
          </template>

        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'
import { useToastStore } from '@/stores/toast'
import AppLoader from '@/components/ui/AppLoader.vue'

const toast   = useToastStore()
const loading = ref(true)
const saving  = ref(false)
const error   = ref('')
const section = ref('payouts')

const form = ref({
  payout_auto_approve:      true,
  minimum_withdrawal_naira: 50000,
  tracking_base_url:        '',
})

let original = {}

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/settings/')
    form.value.payout_auto_approve      = data.payout_auto_approve
    form.value.minimum_withdrawal_naira = Math.floor(data.minimum_withdrawal_kobo / 100)
    form.value.tracking_base_url        = data.tracking_base_url || ''
    original = { ...form.value }
  } finally {
    loading.value = false
  }
})

function resetForm() {
  form.value = { ...original }
  error.value = ''
}

async function save() {
  error.value  = ''
  saving.value = true
  try {
    const { data } = await api.patch('/admin/settings/', {
      payout_auto_approve:     form.value.payout_auto_approve,
      minimum_withdrawal_kobo: Math.round(form.value.minimum_withdrawal_naira * 100),
      tracking_base_url:       form.value.tracking_base_url.trim(),
    })
    form.value.payout_auto_approve      = data.payout_auto_approve
    form.value.minimum_withdrawal_naira = Math.floor(data.minimum_withdrawal_kobo / 100)
    form.value.tracking_base_url        = data.tracking_base_url || ''
    original = { ...form.value }
    toast.show('Settings saved.', 'success')
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to save settings. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* ── Layout ── */
.settings-layout {
  display: grid;
  grid-template-columns: 196px 1fr;
  gap: 20px;
  align-items: start;
}

/* ── Left nav ── */
.settings-nav {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  border-left: 2px solid transparent;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: all 0.1s;
}
.settings-nav-item:last-child { border-bottom: none }
.settings-nav-item:hover { background: var(--bg) }
.settings-nav-item.active {
  color: var(--brand-deep);
  background: var(--pollen-light);
  border-left: 2px solid var(--brand);
  font-weight: 500;
}
.settings-nav-item i { font-size: 15px }
.settings-nav-item.active i { color: var(--brand) }

/* ── Content ── */
.settings-content { display: flex; flex-direction: column; gap: 14px }

/* ── Card sections ── */
.card-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.card-section-sub {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 20px;
  line-height: 1.5;
}
.card-section-sub code {
  background: var(--bg);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
}

/* ── Fields ── */
.field { margin-bottom: 0 }
label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
input[type="url"],
input[type="number"] {
  width: 100%;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-primary);
  background: var(--surface);
  font-family: var(--font);
  transition: border-color 0.15s;
}
input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(254,170,0,0.12) }
.hint { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; line-height: 1.5 }

/* ── Input with prefix ── */
.input-prefix {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: border-color 0.15s;
}
.input-prefix:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(254,170,0,0.12) }
.input-prefix-label {
  padding: 9px 11px;
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 13px;
  border-right: 1px solid var(--border);
  white-space: nowrap;
  flex-shrink: 0;
}
.input-prefix input {
  border: none;
  border-radius: 0;
  flex: 1;
  box-shadow: none !important;
}
.input-prefix input:focus { outline: none; box-shadow: none }

/* ── Toggle row ── */
.toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 0;
}
.toggle-label { font-size: 13px; font-weight: 500; color: var(--text-primary) }
.toggle-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 3px; line-height: 1.4 }
.toggle {
  width: 38px;
  height: 22px;
  background: var(--border-strong);
  border-radius: 99px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
  margin-top: 2px;
}
.toggle.on { background: var(--brand) }
.toggle::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: left 0.2s;
}
.toggle.on::after { left: 19px }

/* ── Save row ── */
.save-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.btn-save {
  padding: 9px 20px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand);
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-deep);
  cursor: pointer;
  font-family: var(--font);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) { background: var(--brand-dark) }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed }
.btn-cancel {
  padding: 9px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font);
}
.btn-cancel:hover { background: var(--bg) }

/* ── Error ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--red-bg);
  color: var(--red-text);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13px;
}

.spin { animation: spin 0.6s linear infinite }
@keyframes spin { to { transform: rotate(360deg) } }
</style>
