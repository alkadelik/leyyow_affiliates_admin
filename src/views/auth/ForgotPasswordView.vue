<template>
  <div class="auth-page">
    <div class="auth-card">

      <RouterLink to="/login" class="back-link">
        <i class="ti ti-arrow-left" aria-hidden="true" /> Back to sign in
      </RouterLink>

      <div class="auth-logo">
        <div class="auth-logo__icon"><i class="ti ti-lock-question" aria-hidden="true" /></div>
        <h1 class="auth-title">Forgot password?</h1>
      </div>

      <p class="auth-sub">Enter the email address for your admin account and we'll send a reset link.</p>

      <Transition name="fade">
        <div v-if="sent" class="success-banner">
          <i class="ti ti-circle-check" aria-hidden="true" />
          If that email is registered, a reset link is on its way.
        </div>
      </Transition>

      <form v-if="!sent" class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@leyyow.com"
            autocomplete="email"
            required
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
          <i v-else class="ti ti-send" aria-hidden="true" />
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/api/axios'

const email   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await api.post('/admin/auth/forgot-password/', { email: email.value })
  } catch { /* silently succeed — don't reveal if email exists */ }
  loading.value = false
  sent.value = true
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; background: var(--bg);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.auth-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-xl); padding: 40px;
  width: 100%; max-width: 420px; box-shadow: var(--shadow-md);
}
.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-secondary); margin-bottom: 24px;
}
.back-link:hover { color: var(--text-primary); }
.back-link i { font-size: 14px; }
.auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.auth-logo__icon {
  width: 40px; height: 40px; background: var(--pollen);
  border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
}
.auth-logo__icon i { font-size: 20px; color: var(--brand-deep); }
.auth-title { font-size: 20px; font-weight: 600; letter-spacing: -0.4px; }
.auth-sub   { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6; }
.success-banner {
  display: flex; align-items: center; gap: 8px;
  background: var(--green-bg); color: var(--green-text);
  border-radius: var(--radius-md); padding: 12px 14px; font-size: 13px;
}
.success-banner i { font-size: 16px; flex-shrink: 0; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
input {
  width: 100%; padding: 9px 11px; border: 1px solid var(--border);
  border-radius: var(--radius-md); font-size: 13px; color: var(--text-primary);
  background: var(--surface); font-family: var(--font); transition: border-color 0.15s;
}
input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(254,170,0,0.12); }
.btn-primary {
  width: 100%; padding: 11px; background: var(--brand); border: none;
  border-radius: var(--radius-md); font-size: 13px; font-weight: 600;
  color: var(--brand-deep); cursor: pointer; font-family: var(--font);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--brand-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
