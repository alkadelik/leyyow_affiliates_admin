<template>
  <div class="auth-page">
    <div class="auth-card">

      <div class="auth-logo">
        <div class="auth-logo__icon"><i class="ti ti-lock-open" aria-hidden="true" /></div>
        <h1 class="auth-title">Set new password</h1>
      </div>

      <p class="auth-sub">Choose a strong password for your admin account.</p>

      <Transition name="fade">
        <div v-if="error" class="error-banner">
          <i class="ti ti-alert-circle" aria-hidden="true" /> {{ error }}
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="done" class="success-banner">
          <i class="ti ti-circle-check" aria-hidden="true" />
          Password updated. <RouterLink to="/login" class="link">Sign in →</RouterLink>
        </div>
      </Transition>

      <form v-if="!done" class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="password">New password</label>
          <div class="input-wrap">
            <input
              id="password"
              v-model="form.password"
              :type="show1 ? 'text' : 'password'"
              placeholder="At least 8 characters"
              required minlength="8"
            />
            <button type="button" class="eye-btn" @click="show1 = !show1">
              <i :class="show1 ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="field">
          <label for="confirm">Confirm password</label>
          <div class="input-wrap">
            <input
              id="confirm"
              v-model="form.confirm"
              :type="show2 ? 'text' : 'password'"
              placeholder="Repeat your password"
              required
            />
            <button type="button" class="eye-btn" @click="show2 = !show2">
              <i :class="show2 ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true" />
            </button>
          </div>
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
          {{ loading ? 'Saving…' : 'Set new password' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const form    = ref({ password: '', confirm: '' })
const error   = ref('')
const loading = ref(false)
const done    = ref(false)
const show1   = ref(false)
const show2   = ref(false)

async function handleSubmit() {
  error.value = ''
  if (form.value.password !== form.value.confirm) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await api.post('/admin/auth/reset-password/', {
      token:    route.query.token,
      password: form.value.password,
    })
    done.value = true
  } catch (err) {
    error.value = err.response?.data?.detail || 'This link is invalid or has expired.'
  } finally {
    loading.value = false
  }
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
.auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.auth-logo__icon {
  width: 40px; height: 40px; background: var(--pollen);
  border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center;
}
.auth-logo__icon i { font-size: 20px; color: var(--brand-deep); }
.auth-title { font-size: 20px; font-weight: 600; letter-spacing: -0.4px; }
.auth-sub   { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6; }
.error-banner {
  display: flex; align-items: center; gap: 8px; background: var(--red-bg);
  color: var(--red-text); border-radius: var(--radius-md);
  padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
}
.success-banner {
  display: flex; align-items: center; gap: 8px; background: var(--green-bg);
  color: var(--green-text); border-radius: var(--radius-md);
  padding: 12px 14px; font-size: 13px;
}
.success-banner i { font-size: 16px; flex-shrink: 0; }
.link { color: var(--green-text); font-weight: 600; text-decoration: underline; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.input-wrap { position: relative; }
input {
  width: 100%; padding: 9px 40px 9px 11px; border: 1px solid var(--border);
  border-radius: var(--radius-md); font-size: 13px; color: var(--text-primary);
  background: var(--surface); font-family: var(--font); transition: border-color 0.15s;
}
input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(254,170,0,0.12); }
.eye-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 2px;
}
.eye-btn i { font-size: 16px; display: block; }
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
