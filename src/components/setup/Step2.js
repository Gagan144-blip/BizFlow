'use Client'
import { useState } from 'react'

const BUSINESS_TYPES = [
    {
        id: 'cyber',
        name: 'Cyber/ Print Shop',
        desc: 'Print, scan, certificates',
        icon: '🖥️'
    },
    {
        id: 'retail',
        name: 'Retail/General Store',
        desc: 'Products, stock, orders',
        icon: '🏪'
    },
    {
    id: 'medical',
    name: 'Medical / Clinic',
    desc: 'Patients, appointments',
    icon: '🏥'
  }
]

export default function Step2({ onNext, onBack }){
    const [selectType, setSelectedType] = useState('')
    const [error, setError] = useState('')

    const handleNext = () =>{
        if(!selectType){
            setError('Please select a business type')
            return
        }
        onNext({type: selectType })
    }

    return (
        <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-medium">Select business type</h2>
        <p className="text-sm text-gray-500 mt-1">Your dashboard will adapt based on this</p>
      </div>

      <div className="flex flex-col gap-3">
        {BUSINESS_TYPES.map(biz => (
          <div
            key={biz.id}
            onClick={() => { setSelectedType(biz.id); setError('') }}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
              ${selectType === biz.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <span className="text-2xl">{biz.icon}</span>
            <div>
              <div className="text-sm font-medium">{biz.name}</div>
              <div className="text-xs text-gray-500">{biz.desc}</div>
            </div>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selectType === biz.id ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
              {selectType === biz.id && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Continue →
        </button>
      </div>
    </div>
    )
}
