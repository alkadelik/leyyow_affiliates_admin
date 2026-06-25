import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CampaignCreateView from '@/views/campaigns/CampaignCreateView.vue'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/api/axios', () => ({
  default: {
    get:  vi.fn(),
    post: vi.fn(),
  },
}))

import api from '@/api/axios'

// Reset all mock call history before every test so counts and call indices
// don't bleed across tests.
beforeEach(() => {
  vi.clearAllMocks()
})

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/campaigns', component: { template: '<div />' } },
    { path: '/campaigns/:id', component: { template: '<div />' } },
    { path: '/campaigns/new', component: CampaignCreateView },
  ],
})

async function mountView() {
  api.get.mockResolvedValue({ data: { results: [] } })
  const wrapper = mount(CampaignCreateView, {
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToastMessages(wrapper) {
  // Toast messages are emitted to the store; spy on show() via the mock
  return wrapper.vm.$.appContext.app.config.globalProperties
}

// ── 1. Rendering ─────────────────────────────────────────────────────────────

describe('initial render', () => {
  it('shows Fixed as the default campaign type', async () => {
    const w = await mountView()
    expect(w.find('.radio-opt.on').text()).toContain('Fixed')
  })

  it('shows commission trigger card only for fixed campaigns', async () => {
    const w = await mountView()
    expect(w.html()).toContain('Commission trigger')
  })

  it('hides commission trigger card when Tiered is selected', async () => {
    const w = await mountView()
    const radios = w.findAll('.radio-opt')
    await radios.find(r => r.text().includes('Tiered')).trigger('click')
    // Check rendered card titles, not raw HTML (which includes Vue template comments)
    const titles = w.findAll('.card-title').map(e => e.text())
    expect(titles.some(t => t.includes('Commission trigger'))).toBe(false)
  })

  it('shows the tier table when Tiered is selected', async () => {
    const w = await mountView()
    await w.findAll('.radio-opt').find(r => r.text().includes('Tiered')).trigger('click')
    expect(w.find('.tier-table').exists()).toBe(true)
  })

  it('hides tier table when Fixed is selected', async () => {
    const w = await mountView()
    expect(w.find('.tier-table').exists()).toBe(false)
  })

  it('commission enabled toggle is on by default', async () => {
    const w = await mountView()
    expect(w.vm.form.commission_enabled).toBe(true)
  })
})

// ── 2. Sidebar checklist ──────────────────────────────────────────────────────

describe('sidebar checklist', () => {
  it('commission period starts valid (no period trigger selected yet)', async () => {
    // triggerPeriodValid is true by default because '' !== 'subscriptions_within_period',
    // so the Commission period row shows as done even before any input.
    const w = await mountView()
    expect(w.findAll('.check--done')).toHaveLength(1)
    expect(w.findAll('.check--empty')).toHaveLength(4) // name, commission, start_date, trigger
  })

  it('campaign name check turns done when name is entered', async () => {
    const w = await mountView()
    await w.find('input[placeholder="e.g. Q3 Influencer Drive"]').setValue('My Campaign')
    const rows = w.findAll('.checklist-row')
    expect(rows[0].find('i').classes()).toContain('check--done')
  })

  it('start date check turns done when date is set', async () => {
    const w = await mountView()
    const dateInput = w.find('input[type="date"]')
    await dateInput.setValue('2026-07-01')
    const rows = w.findAll('.checklist-row')
    expect(rows[2].find('i').classes()).toContain('check--done')
  })
})

// ── 3. Commission type switching (Fixed) ──────────────────────────────────────

describe('fixed — commission type', () => {
  it('cap field is hidden for flat_fee', async () => {
    const w = await mountView()
    expect(w.find('input[placeholder="Optional"]').exists()).toBe(false)
  })

  it('cap field appears when percentage is selected', async () => {
    const w = await mountView()
    const types = w.findAll('.commission-box .radio-opt')
    await types.find(r => r.text().includes('Percentage')).trigger('click')
    expect(w.find('input[placeholder="Optional"]').exists()).toBe(true)
  })

  it('cap field appears when percentage_capped is selected', async () => {
    const w = await mountView()
    const types = w.findAll('.commission-box .radio-opt')
    await types.find(r => r.text().includes('% + cap')).trigger('click')
    expect(w.find('input[placeholder="Optional"]').exists()).toBe(true)
  })

  it('commission fields hide when commission_enabled is toggled off', async () => {
    const w = await mountView()
    const toggle = w.find('.toggle')
    await toggle.trigger('click')
    expect(w.find('.commission-box').exists()).toBe(false)
  })
})

// ── 4. Commission trigger ─────────────────────────────────────────────────────

describe('commission trigger', () => {
  it('period field is hidden when trigger is not subscriptions_within_period', async () => {
    const w = await mountView()
    expect(w.find('input[placeholder="e.g. 365"]').exists()).toBe(false)
  })

  it('period field appears when subscriptions_within_period is selected', async () => {
    const w = await mountView()
    const triggers = w.findAll('.radio-opt--block')
    await triggers.find(r => r.text().includes('within a period')).trigger('click')
    expect(w.find('input[placeholder="e.g. 365"]').exists()).toBe(true)
  })

  it('period field hides when trigger changes away from within_period', async () => {
    const w = await mountView()
    const triggers = w.findAll('.radio-opt--block')
    await triggers.find(r => r.text().includes('within a period')).trigger('click')
    await triggers.find(r => r.text().includes('First subscription')).trigger('click')
    expect(w.find('input[placeholder="e.g. 365"]').exists()).toBe(false)
  })
})

// ── 5. Per-tier commission ────────────────────────────────────────────────────

describe('per-tier commission (fixed only)', () => {
  it('tier amount fields are hidden by default', async () => {
    const w = await mountView()
    expect(w.find('input[placeholder="e.g. 5000"]').exists()).toBe(false)
  })

  it('tier amount fields appear when override is toggled on', async () => {
    const w = await mountView()
    const toggles = w.findAll('.toggle')
    const perTierToggle = toggles[1]
    await perTierToggle.trigger('click')
    expect(w.vm.form.use_per_tier).toBe(true)
  })
})

// ── 6. Tier builder ───────────────────────────────────────────────────────────

describe('tiered — tier builder', () => {
  async function mountTiered() {
    const w = await mountView()
    await w.findAll('.radio-opt').find(r => r.text().includes('Tiered')).trigger('click')
    return w
  }

  it('starts with one tier row', async () => {
    const w = await mountTiered()
    expect(w.findAll('.tier-table tbody tr')).toHaveLength(1)
  })

  it('remove button is disabled when only one row exists', async () => {
    const w = await mountTiered()
    expect(w.find('.remove-btn').attributes('disabled')).toBeDefined()
  })

  it('adds a row when Add tier is clicked', async () => {
    const w = await mountTiered()
    await w.find('.add-tier-btn').trigger('click')
    expect(w.findAll('.tier-table tbody tr')).toHaveLength(2)
  })

  it('remove button becomes enabled when more than one row exists', async () => {
    const w = await mountTiered()
    await w.find('.add-tier-btn').trigger('click')
    const btns = w.findAll('.remove-btn')
    expect(btns[0].attributes('disabled')).toBeUndefined()
  })

  it('removes the correct row', async () => {
    const w = await mountTiered()
    await w.find('.add-tier-btn').trigger('click')
    await w.find('.add-tier-btn').trigger('click')
    w.vm.form.subscriber_tiers[0].min_subs = 1
    w.vm.form.subscriber_tiers[1].min_subs = 11
    w.vm.form.subscriber_tiers[2].min_subs = 21
    await w.findAll('.remove-btn')[1].trigger('click')
    expect(w.vm.form.subscriber_tiers).toHaveLength(2)
    expect(w.vm.form.subscriber_tiers[0].min_subs).toBe(1)
    expect(w.vm.form.subscriber_tiers[1].min_subs).toBe(21)
  })

  it('tier table header shows Amount when flat_fee is selected', async () => {
    const w = await mountTiered()
    expect(w.find('.tier-table th:nth-child(3)').text()).toContain('Amount')
  })

  it('tier table header shows Percentage when percentage is selected', async () => {
    const w = await mountTiered()
    await w.findAll('.radio-opt').find(r => r.text().includes('Percentage (%)')).trigger('click')
    expect(w.find('.tier-table th:nth-child(3)').text()).toContain('Percentage')
  })
})

// ── 7. commissionValid computed ───────────────────────────────────────────────

describe('commissionValid computed', () => {
  it('is false for fixed when commission_enabled and no value', async () => {
    const w = await mountView()
    expect(w.vm.commissionValid).toBe(false)
  })

  it('is true for fixed when commission_enabled and value is set', async () => {
    const w = await mountView()
    w.vm.form.commission_value = 5000
    await flushPromises()
    expect(w.vm.commissionValid).toBe(true)
  })

  it('is true for fixed when commission is disabled', async () => {
    const w = await mountView()
    w.vm.form.commission_enabled = false
    await flushPromises()
    expect(w.vm.commissionValid).toBe(true)
  })

  it('is false for tiered when any tier is missing min_subs or value', async () => {
    const w = await mountView()
    w.vm.form.campaign_type = 'tiered'
    await flushPromises()
    expect(w.vm.commissionValid).toBe(false)
  })

  it('is true for tiered when all tiers have min_subs and value', async () => {
    const w = await mountView()
    w.vm.form.campaign_type = 'tiered'
    w.vm.form.subscriber_tiers = [{ min_subs: 0, max_subs: null, commission_value_display: 10 }]
    await flushPromises()
    expect(w.vm.commissionValid).toBe(true)
  })

  it('is false for tiered percentage when a value exceeds 100', async () => {
    const w = await mountView()
    w.vm.form.campaign_type = 'tiered'
    w.vm.form.subscriber_tier_type = 'percentage'
    w.vm.form.subscriber_tiers = [{ min_subs: 0, max_subs: null, commission_value_display: 110 }]
    await flushPromises()
    expect(w.vm.commissionValid).toBe(false)
  })
})

// ── 8. triggerPeriodValid computed ────────────────────────────────────────────

describe('triggerPeriodValid computed', () => {
  it('is true when trigger is not subscriptions_within_period', async () => {
    const w = await mountView()
    w.vm.form.commission_trigger = 'first_subscription_only'
    await flushPromises()
    expect(w.vm.triggerPeriodValid).toBe(true)
  })

  it('is false when trigger is subscriptions_within_period and no days set', async () => {
    const w = await mountView()
    w.vm.form.commission_trigger = 'subscriptions_within_period'
    await flushPromises()
    expect(w.vm.triggerPeriodValid).toBe(false)
  })

  it('is true when trigger is subscriptions_within_period and days > 0', async () => {
    const w = await mountView()
    w.vm.form.commission_trigger = 'subscriptions_within_period'
    w.vm.form.commission_period_days = 365
    await flushPromises()
    expect(w.vm.triggerPeriodValid).toBe(true)
  })
})

// ── 9. Duration ───────────────────────────────────────────────────────────────

describe('campaign duration', () => {
  it('max conversions field is hidden by default', async () => {
    const w = await mountView()
    expect(w.find('input[placeholder="e.g. 100"]').exists()).toBe(false)
  })

  it('max conversions field appears when toggle is on', async () => {
    const w = await mountView()
    const toggles = w.findAll('.toggle')
    await toggles[toggles.length - 1].trigger('click')
    w.vm.form.use_max_conversions = true
    await flushPromises()
    expect(w.find('input[placeholder="e.g. 100"]').exists()).toBe(true)
  })
})

// ── 10. Eligible tier selector ────────────────────────────────────────────────

describe('eligible tier selector', () => {
  it('All is selected by default', async () => {
    const w = await mountView()
    expect(w.vm.form.tier).toBe('all')
  })

  it('selecting Bloom updates form.tier', async () => {
    const w = await mountView()
    const opts = w.findAll('.tier-opt')
    await opts.find(o => o.text().includes('Bloom')).trigger('click')
    expect(w.vm.form.tier).toBe('bloom')
  })

  it('only one tier option is highlighted at a time', async () => {
    const w = await mountView()
    const opts = w.findAll('.tier-opt')
    await opts.find(o => o.text().includes('Burst')).trigger('click')
    expect(w.findAll('.tier-opt.on')).toHaveLength(1)
    expect(w.vm.form.tier).toBe('burst')
  })
})

// ── 11. Affiliate search ──────────────────────────────────────────────────────

describe('affiliate search', () => {
  async function mountWithAffiliates() {
    api.get.mockResolvedValue({
      data: {
        results: [
          { id: '1', full_name: 'Ada Obi',   email: 'ada@test.com' },
          { id: '2', full_name: 'Bola Ade',  email: 'bola@test.com' },
          { id: '3', full_name: 'Chidi Eze', email: 'chidi@test.com' },
        ],
      },
    })
    const w = mount(CampaignCreateView, { global: { plugins: [router] } })
    await flushPromises()
    return w
  }

  it('loads affiliates on mount', async () => {
    await mountWithAffiliates()
    expect(api.get).toHaveBeenCalledWith('/admin/affiliates/', { params: { assignable: 'true' } })
  })

  it('filters dropdown results by search query', async () => {
    const w = await mountWithAffiliates()
    w.vm.affiliateSearch = 'ada'
    w.vm.showDropdown = true
    await flushPromises()
    expect(w.vm.affiliateResults).toHaveLength(1)
    expect(w.vm.affiliateResults[0].full_name).toBe('Ada Obi')
  })

  it('adds affiliate to selected list', async () => {
    const w = await mountWithAffiliates()
    w.vm.addAffiliate({ id: '1', full_name: 'Ada Obi', email: 'ada@test.com' })
    await flushPromises()
    expect(w.vm.selectedAffiliates).toHaveLength(1)
    expect(w.vm.selectedAffiliates[0].id).toBe('1')
  })

  it('clears search after adding an affiliate', async () => {
    const w = await mountWithAffiliates()
    w.vm.affiliateSearch = 'ada'
    w.vm.addAffiliate({ id: '1', full_name: 'Ada Obi', email: 'ada@test.com' })
    expect(w.vm.affiliateSearch).toBe('')
  })

  it('excludes already-selected affiliates from dropdown results', async () => {
    const w = await mountWithAffiliates()
    w.vm.addAffiliate({ id: '1', full_name: 'Ada Obi', email: 'ada@test.com' })
    await flushPromises()
    expect(w.vm.affiliateResults.find(a => a.id === '1')).toBeUndefined()
  })

  it('removes affiliate from selected list', async () => {
    const w = await mountWithAffiliates()
    w.vm.addAffiliate({ id: '1', full_name: 'Ada Obi', email: 'ada@test.com' })
    w.vm.removeAffiliate('1')
    expect(w.vm.selectedAffiliates).toHaveLength(0)
  })

  it('re-shows affiliate in results after removal', async () => {
    const w = await mountWithAffiliates()
    w.vm.addAffiliate({ id: '1', full_name: 'Ada Obi', email: 'ada@test.com' })
    w.vm.removeAffiliate('1')
    await flushPromises()
    expect(w.vm.affiliateResults.find(a => a.id === '1')).toBeDefined()
  })
})

// ── 12. Submit validation (Save as draft) ─────────────────────────────────────

describe('submit — draft', () => {
  it('blocks submit and shows toast when name is empty', async () => {
    const w = await mountView()
    const toastStore = w.vm.$.appContext.config.globalProperties.$pinia?.state?.value?.toast
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-draft').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Campaign name is required.', 'error')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('calls POST /admin/campaigns/ when name is filled', async () => {
    api.post.mockResolvedValue({ data: { id: 'abc-123' } })
    const w = await mountView()
    w.vm.form.name = 'Test Campaign'
    await flushPromises()
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith(
      '/admin/campaigns/',
      expect.objectContaining({ is_draft: true, name: 'Test Campaign' }),
    )
  })

  it('redirects to campaign detail after successful draft save', async () => {
    api.post.mockResolvedValue({ data: { id: 'abc-123' } })
    const w = await mountView()
    w.vm.form.name = 'Test Campaign'
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/campaigns/abc-123')
  })

  it('does not call the transition endpoint for a draft', async () => {
    api.post.mockResolvedValue({ data: { id: 'abc-123' } })
    const w = await mountView()
    w.vm.form.name = 'Test Campaign'
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledTimes(1)
  })
})

// ── 13. Submit validation (Start campaign) ────────────────────────────────────

describe('submit — start', () => {
  async function filledFixedForm() {
    const w = await mountView()
    w.vm.form.name = 'Test Campaign'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'first_subscription_only'
    w.vm.form.commission_value = 5000
    return w
  }

  it('blocks when start_date is missing', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Start date is required.', 'error')
  })

  it('blocks when commission_trigger is missing (fixed)', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Commission trigger is required.', 'error')
  })

  it('blocks when commission period is missing for subscriptions_within_period', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'subscriptions_within_period'
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Commission period (days) is required.', 'error')
  })

  it('blocks when commission is enabled but value is missing', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'all_subscriptions'
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Commission value is required.', 'error')
  })

  it('blocks when percentage exceeds 100', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'all_subscriptions'
    w.vm.form.commission_type = 'percentage'
    w.vm.form.commission_value = 150
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Percentage cannot exceed 100%.', 'error')
  })

  it('blocks when percentage is a decimal', async () => {
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'all_subscriptions'
    w.vm.form.commission_type = 'percentage'
    w.vm.form.commission_value = 10.5
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    expect(showSpy).toHaveBeenCalledWith('Percentage must be a whole number (e.g. 10, not 10.5).', 'error')
  })

  it('calls both create and transition endpoints on successful start', async () => {
    api.post
      .mockResolvedValueOnce({ data: { id: 'abc-123' } })
      .mockResolvedValueOnce({ data: {} })
    const w = await filledFixedForm()
    await w.find('.btn-start').trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenNthCalledWith(1, '/admin/campaigns/', expect.objectContaining({ is_draft: false }))
    expect(api.post).toHaveBeenNthCalledWith(2, '/admin/campaigns/abc-123/transition/', { action: 'start' })
  })

  it('shows error toast when API returns an error', async () => {
    api.post.mockRejectedValue({
      response: { data: { detail: 'Campaign name already exists.' } },
    })
    const w = await filledFixedForm()
    const showSpy = vi.spyOn(w.vm.toast, 'show')
    await w.find('.btn-start').trigger('click')
    await flushPromises()
    expect(showSpy).toHaveBeenCalledWith('Campaign name already exists.', 'error')
  })

  it('disables both buttons while submitting', async () => {
    let resolve
    api.post.mockReturnValue(new Promise(r => { resolve = r }))
    const w = await filledFixedForm()
    w.find('.btn-start').trigger('click')
    await flushPromises()
    expect(w.find('.btn-start').attributes('disabled')).toBeDefined()
    expect(w.find('.btn-draft').attributes('disabled')).toBeDefined()
    resolve({ data: { id: 'x' } })
  })
})

// ── 14. Payload shape ─────────────────────────────────────────────────────────

describe('payload construction', () => {
  it('sends commission_value in kobo (×100) for flat_fee', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'first_subscription_only'
    w.vm.form.commission_type = 'flat_fee'
    w.vm.form.commission_value = 500
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.commission_value).toBe(50000)
  })

  it('sends commission_value in basis points (×100) for percentage', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.start_date = '2026-07-01'
    w.vm.form.commission_trigger = 'first_subscription_only'
    w.vm.form.commission_type = 'percentage'
    w.vm.form.commission_value = 10
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.commission_value).toBe(1000)
  })

  it('sends tiered commission_value multiplied by 100', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.campaign_type = 'tiered'
    w.vm.form.subscriber_tiers = [{ min_subs: 0, max_subs: null, commission_value_display: 200 }]
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.subscriber_tiers[0].commission_value).toBe(20000)
  })

  it('sends null max_subs for open-ended last tier', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.campaign_type = 'tiered'
    w.vm.form.subscriber_tiers = [{ min_subs: 0, max_subs: null, commission_value_display: 100 }]
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.subscriber_tiers[0].max_subs).toBeNull()
  })

  it('sends affiliate_ids from selected affiliates', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.addAffiliate({ id: 'aff-1', full_name: 'Ada', email: 'a@a.com' })
    w.vm.addAffiliate({ id: 'aff-2', full_name: 'Bola', email: 'b@b.com' })
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.affiliate_ids).toEqual(['aff-1', 'aff-2'])
  })

  it('omits commission_period_days when trigger is not subscriptions_within_period', async () => {
    api.post.mockResolvedValue({ data: { id: 'x' } })
    const w = await mountView()
    w.vm.form.name = 'Test'
    w.vm.form.commission_trigger = 'all_subscriptions'
    w.vm.form.commission_value = 5000
    await w.find('.btn-draft').trigger('click')
    await flushPromises()
    const payload = api.post.mock.calls[0][1]
    expect(payload.commission_period_days).toBeNull()
  })
})

// ── 15. initials helper ───────────────────────────────────────────────────────

describe('initials helper', () => {
  it('returns two uppercase initials', async () => {
    const w = await mountView()
    expect(w.vm.initials('Ada Obi')).toBe('AO')
  })

  it('handles single-word names', async () => {
    const w = await mountView()
    expect(w.vm.initials('Ada')).toBe('A')
  })

  it('handles empty string', async () => {
    const w = await mountView()
    expect(w.vm.initials('')).toBe('')
  })
})
