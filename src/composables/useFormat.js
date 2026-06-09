/**
 * src/composables/useFormat.js
 *
 * Shared formatting helpers used across views.
 * Money is always stored in kobo (integers). Display in naira.
 */

export function useFormat() {

  /** Kobo integer → "₦15,000" */
  function naira(kobo) {
    if (kobo == null) return '₦0'
    const n = Math.floor(kobo / 100)
    return '₦' + n.toLocaleString('en-NG')
  }

  /** ISO date string or Date → "12 Jul 2025" */
  function date(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  /** ISO date string → "12 Jul" (no year) */
  function shortDate(value) {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    })
  }

  /** Campaign status → { label, class } */
  function campaignStatus(status) {
    return {
      draft:     { label: 'Draft',     cls: 'badge--gray'  },
      scheduled: { label: 'Scheduled', cls: 'badge--amber' },
      active:    { label: 'Active',    cls: 'badge--green' },
      ended:     { label: 'Ended',     cls: 'badge--gray'  },
      cancelled: { label: 'Cancelled', cls: 'badge--red'   },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  /** Payout status → { label, class } */
  function payoutStatus(status) {
    return {
      pending:  { label: 'Pending',  cls: 'badge--amber' },
      approved: { label: 'Approved', cls: 'badge--blue'  },
      paid:     { label: 'Paid',     cls: 'badge--green' },
      cancelled:{ label: 'Cancelled',cls: 'badge--red'   },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  /** Affiliate status → { label, class } */
  function affiliateStatus(status) {
    return {
      active:      { label: 'Active',      cls: 'badge--green' },
      inactive:    { label: 'Inactive',    cls: 'badge--gray'  },
      invited:     { label: 'Invited',     cls: 'badge--amber' },
      deactivated: { label: 'Deactivated', cls: 'badge--red'   },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  /** Commission type display */
  function commissionDisplay(campaign) {
    if (!campaign) return '—'
    const v = campaign.commission_value ?? 0
    const type = campaign.commission_type
    if (type === 'flat_fee') return `₦${(v / 100).toLocaleString('en-NG')} flat`
    if (type === 'percentage') return `${v / 100}%`
    if (type === 'percentage_capped') {
      const cap = campaign.commission_cap ?? 0
      return `${v / 100}% (cap ₦${(cap / 100).toLocaleString('en-NG')})`
    }
    return '—'
  }

  /** Merchant lead status → { label, class } */
  function merchantStatus(status) {
    return {
      trial:      { label: 'Trial',      cls: 'badge--amber' },
      signed_up:  { label: 'Signed up',  cls: 'badge--gray'  },
      subscribed: { label: 'Subscribed', cls: 'badge--green' },
      expired:    { label: 'Expired',    cls: 'badge--red'   },
      cancelled:  { label: 'Cancelled',  cls: 'badge--red'   },
    }[status] ?? { label: status, cls: 'badge--gray' }
  }

  return { naira, date, shortDate, campaignStatus, payoutStatus, affiliateStatus, commissionDisplay, merchantStatus }
}
