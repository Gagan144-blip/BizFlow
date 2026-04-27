'use client'
import { useState } from 'react'

export default function Step1({ onNext }){
    const [form, setForm] = useState({
        businessName: '',
        ownerName: '',
        phone: ''
    })
    const [errors, setErrors] = useState({})

    const validate = () =>{
        let e = {}
        if(!form.businessName.trim()) e.businessName = 'Business name requires'
        if(!form.ownerName.trim()) e.ownerName = 'Owner name required'
        if(!/^\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter valide 10 digit Number'
        return e
    }

    const handleNext = () =>{
        const e = validate()
        if(Object.keys(e).length > 0) { setErrors(e); return}
        onNext(form)
    }

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="text-xl font-medium">Welcome to BizFlow</h2>
                <p className="text-sm text-gray-500 mt-1">Let's set up your Business</p>
            </div>
            <div className="flex flex-col gap">
                <div>
                    <label className="text-sm font-medium text-gray-600">Business name</label>
                    <input
            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-green-500 ${errors.businessName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="e.g. Sharma Cyber Cafe"
            value={form.businessName}
            onChange={e => setForm({ ...form, businessName: e.target.value })}
          />
          {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
                </div>
            <div>
          <label className="text-sm font-medium text-gray-600">Owner name</label>
          <input
            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-green-500 ${errors.ownerName ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="e.g. Rahul Sharma"
            value={form.ownerName}
            onChange={e => setForm({ ...form, ownerName: e.target.value })}
          />
          {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">Phone number</label>
          <input
            className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-green-500 ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="e.g. 98765 43210"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>
      </div> 

    <button
    onClick={handleNext}
    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
    Continue →
      </button>
    </div>
  )
}