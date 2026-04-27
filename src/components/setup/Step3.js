'use client'
import { useState } from 'react'

const PRICES = {
  cyber: [
    { key: 'print_bw',    label: 'Print B&W (per page)',   default: '2'  },
    { key: 'print_color', label: 'Print Color (per page)', default: '10' },
    { key: 'scan',        label: 'Scan (per page)',         default: '5'  },
    { key: 'lamination',  label: 'Lamination (per page)',  default: '15' },
    { key: 'photocopy',   label: 'Photocopy (per page)',   default: '1'  },
    { key: 'internet',    label: 'Internet (per hour)',     default: '30' },
    { key: 'typing',      label: 'Typing work (per page)', default: '20' },
    { key: 'passport_photo', label: 'Passport photo',      default: '50' },
  ],
  retail: [
    { key: 'product_sale',   label: 'Product sale (per item)',    default: '100' },
    { key: 'home_delivery',  label: 'Home delivery charge',       default: '50'  },
    { key: 'gift_wrap',      label: 'Gift wrapping',              default: '30'  },
    { key: 'bulk_discount',  label: 'Bulk order discount (%)',    default: '10'  },
    { key: 'packaging',      label: 'Special packaging',          default: '20'  },
    { key: 'installation',   label: 'Installation charge',        default: '200' },
  ],
  medical: [
    { key: 'consultation',   label: 'General consultation',       default: '200' },
    { key: 'followup',       label: 'Follow-up visit',            default: '100' },
    { key: 'blood_test',     label: 'Blood test',                 default: '300' },
    { key: 'xray',           label: 'X-Ray',                      default: '500' },
    { key: 'dressing',       label: 'Dressing / bandage',         default: '150' },
    { key: 'medicine',       label: 'Medicine dispensing',        default: '50'  },
    { key: 'injection',      label: 'Injection charge',           default: '100' },
    { key: 'ecg',            label: 'ECG',                        default: '400' },
  ],
}

export default function Step3({ form, onBack, onSubmit }) {
  const fields = PRICES[form.type] || []

  const initPrices = () => {
    let p = {}
    fields.forEach(f => p[f.key] = f.default)
    return p
  }

  const [prices, setPrices] = useState(initPrices)
  const [loading, setLoading] = useState(false)

  const handleChange = (key, value) => {
    setPrices(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit({ prices })
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-medium">Set service prices</h2>
        <p className="text-sm text-gray-500 mt-1">
          Prices for your {form.type} business — change anytime later
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-gray-600">{f.label}</label>
            <div className="flex items-center border border-gray-300 rounded-lg mt-1 overflow-hidden focus-within:border-green-500">
              <span className="px-2 py-2 text-xs text-gray-400 bg-gray-50 border-r border-gray-200">₹</span>
              <input
                type="number"
                min="0"
                value={prices[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                className="flex-1 px-2 py-2 text-sm outline-none bg-white"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Launch Dashboard →'}
        </button>
      </div>
    </div>
  )
}