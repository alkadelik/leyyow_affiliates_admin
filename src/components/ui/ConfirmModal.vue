<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="$emit('cancel')">
        <div class="modal" role="dialog" :aria-label="title">
          <div class="modal__head">
            <div class="modal__icon" :class="`modal__icon--${variant}`">
              <i :class="iconClass" aria-hidden="true" />
            </div>
            <div>
              <div class="modal__title">{{ title }}</div>
              <div class="modal__body">{{ message }}</div>
            </div>
          </div>
          <div class="modal__actions">
            <button class="btn" @click="$emit('cancel')">Cancel</button>
            <button class="btn" :class="`btn--${variant}`" :disabled="loading" @click="$emit('confirm')">
              <i v-if="loading" class="ti ti-loader-2 spin" aria-hidden="true" />
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible:      { type: Boolean, default: false },
  title:        { type: String,  default: 'Are you sure?' },
  message:      { type: String,  default: '' },
  confirmLabel: { type: String,  default: 'Confirm' },
  variant:      { type: String,  default: 'danger' },  // 'danger' | 'warning' | 'primary'
  loading:      { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])

const iconClass = computed(() => ({
  danger:  'ti ti-alert-triangle',
  warning: 'ti ti-alert-circle',
  primary: 'ti ti-help-circle',
}[props.variant] ?? 'ti ti-help-circle'))
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(20,17,14,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 24px;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  width: 100%; max-width: 400px;
  box-shadow: var(--shadow-md);
}
.modal__head { display: flex; gap: 14px; margin-bottom: 20px; }
.modal__icon {
  width: 40px; height: 40px; border-radius: var(--radius-lg);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.modal__icon i { font-size: 20px; }
.modal__icon--danger  { background: var(--red-bg);    color: var(--red-text);  }
.modal__icon--warning { background: var(--amber-bg);  color: var(--amber-text);}
.modal__icon--primary { background: var(--pollen);    color: var(--brand-deep);}
.modal__title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.modal__body  { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.modal__actions { display: flex; justify-content: flex-end; gap: 8px; }

.btn {
  padding: 9px 18px; border-radius: var(--radius-md);
  border: 1px solid var(--border); background: var(--surface);
  font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: var(--font);
  display: flex; align-items: center; gap: 6px;
  transition: background 0.1s;
}
.btn:hover { background: var(--bg); }
.btn--danger  { background: var(--red-bg);   color: var(--red-text);  border-color: #F0C0C0; }
.btn--danger:hover  { background: #fbd6d6; }
.btn--primary { background: var(--brand);    color: var(--brand-deep); border-color: var(--brand); }
.btn--primary:hover { background: var(--brand-dark); }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(0.96); }
</style>
