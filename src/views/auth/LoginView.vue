<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- Logo -->
      <div class="auth-logo">
        <div class="auth-logo__icon"><i class="ti ti-leaf" aria-hidden="true" /></div>
        <div class="auth-logo__text">ley<span>yow</span></div>
      </div>

      <h1 class="auth-title">Welcome back</h1>
      <p class="auth-sub">Sign in to the Leyyow admin portal.</p>

      <!-- Error banner -->
      <Transition name="fade">
        <div v-if="error" class="error-banner">
          <i class="ti ti-alert-circle" aria-hidden="true" />
          {{ error }}
        </div>
      </Transition>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">Email address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="admin@leyyow.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <div class="field-labelrow">
            <label for="password">Password</label>
            <RouterLink to="/forgot-password" class="forgot-link">Forgot password?</RouterLink>
          </div>
          <div class="input-wrap">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
          <i v-else class="ti ti-login" aria-hidden="true" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const error        = ref('')
const loading      = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  const result = await auth.login(form.value.email, form.value.password)
  loading.value = false
  if (result.ok) {
    router.push('/campaigns')
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.auth-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 40px;
  width: 100%; max-width: 420px;
  box-shadow: var(--shadow-md);
}

/* Logo */
.auth-logo {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 32px;
}
.auth-logo__icon {
  width: 36px; height: 36px;
  background: var(--brand); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
.auth-logo__icon i { font-size: 18px; color: var(--brand-deep); }
.auth-logo__text {
  font-size: 20px; font-weight: 700;
  color: var(--brand-deep); letter-spacing: -0.5px;
}
.auth-logo__text span { color: var(--brand); }

.auth-title { font-size: 22px; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 4px; }
.auth-sub   { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

/* Error */
.error-banner {
  display: flex; align-items: center; gap: 8px;
  background: var(--red-bg); color: var(--red-text);
  border-radius: var(--radius-md);
  padding: 10px 14px; font-size: 13px;
  margin-bottom: 16px;
}
.error-banner i { font-size: 15px; flex-shrink: 0; }

/* Form */
.auth-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field-labelrow { display: flex; align-items: center; justify-content: space-between; }

label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
input {
  width: 100%; padding: 9px 11px;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  font-size: 13px; color: var(--text-primary);
  background: var(--surface); font-family: var(--font);
  transition: border-color 0.15s;
}
input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(254,170,0,0.12); }

.input-wrap { position: relative; }
.input-wrap input { padding-right: 40px; }
.eye-btn {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 2px;
}
.eye-btn i { font-size: 16px; display: block; }

.forgot-link { font-size: 12px; color: var(--brand-dark); font-weight: 500; }
.forgot-link:hover { color: var(--brand); }

.btn-primary {
  width: 100%; padding: 11px;
  background: var(--brand); border: none; border-radius: var(--radius-md);
  font-size: 13px; font-weight: 600; color: var(--brand-deep);
  cursor: pointer; font-family: var(--font);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.15s;
  margin-top: 4px;
}
.btn-primary:hover:not(:disabled) { background: var(--brand-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
