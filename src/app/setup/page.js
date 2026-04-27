'use client'
import { useState } from 'react'
import Step1 from '@/components/setup/Step1'
import Step2 from '@/components/setup/Step2'
import Step3 from '@/components/setup/Step3'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({})
  const router = useRouter()

  const update = (data) => setForm(prev => ({ ...prev, ...data }))

  const submit = async (data) => {
    update(data)
    const finalForm = { ...form, ...data }
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalForm)
    })
    const result = await res.json()
    if (result.success) router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                ${step > n ? 'bg-green-100 text-green-700' : step === n ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > n ? '✓' : n}
              </div>
              {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-green-500' : 'bg-gray-200'}`}/>}
            </div>
          ))}
        </div>

        {step === 1 && <Step1 onNext={(d) => { update(d); setStep(2) }} />}
        {step === 2 && <Step2 onNext={(d) => { update(d); setStep(3) }} onBack={() => setStep(1)} />}
        {step === 3 && <Step3 form={form} onBack={() => setStep(2)} onSubmit={submit} />}
      </div>
    </div>
  )
}