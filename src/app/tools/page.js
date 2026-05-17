'use client'
import { useState, useRef } from 'react'

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'aadhaar',  icon: '🪪', label: 'Aadhaar Combiner',  desc: 'Combine front & back into one A4 page — no scanner software needed' },
  { id: 'passport', icon: '🖼️', label: 'Passport Photos',   desc: 'Arrange multiple passport photos on A4 ready to print'             },
  { id: 'print',    icon: '🖨️', label: 'Print Calculator',  desc: 'Calculate print job cost instantly — B&W, color, scan, lamination'  },
  { id: 'portals',  icon: '🔗', label: 'Gov. Portals',      desc: 'One-click access to every government portal you use daily'          },
]

// ─── Government portals ───────────────────────────────────────────────────────
const PORTALS = [
  // Identity
  { cat: 'Identity & Documents', name: 'Aadhaar Portal',    icon: '🪪', color: 'blue',   url: 'https://myaadhaar.uidai.gov.in/',                                              desc: 'Aadhaar correction, e-Aadhaar download, lock/unlock biometrics'       },
  { cat: 'Identity & Documents', name: 'DigiLocker',         icon: '📂', color: 'blue',   url: 'https://digilocker.gov.in/',                                                   desc: 'Digital wallet for Aadhaar, PAN, certificates, driving licence'       },
  { cat: 'Identity & Documents', name: 'PAN Card (NSDL)',    icon: '💳', color: 'orange', url: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',         desc: 'Apply new PAN card or correct existing PAN details'                   },
  { cat: 'Identity & Documents', name: 'Voter ID (NVSP)',    icon: '🗳️', color: 'orange', url: 'https://www.nvsp.in/',                                                         desc: 'New voter card, correction, check name in voter list'                 },
  // Travel & Transport
  { cat: 'Travel & Transport',   name: 'Passport Seva',      icon: '📘', color: 'blue',   url: 'https://passportindia.gov.in/',                                                desc: 'New passport, renewal, police verification, track application'        },
  { cat: 'Travel & Transport',   name: 'Driving Licence',    icon: '🚗', color: 'green',  url: 'https://sarathi.parivahan.gov.in/',                                            desc: 'Apply DL, renewal, RC transfer, PUCC certificate'                     },
  { cat: 'Travel & Transport',   name: 'IRCTC',              icon: '🚂', color: 'blue',   url: 'https://www.irctc.co.in/',                                                     desc: 'Railway ticket booking, PNR status, cancel tickets'                   },
  // Finance
  { cat: 'Finance & Tax',        name: 'Income Tax',         icon: '📊', color: 'green',  url: 'https://www.incometax.gov.in/',                                                desc: 'ITR filing, Form 26AS, refund status, PAN verification'               },
  { cat: 'Finance & Tax',        name: 'EPFO / PF',          icon: '💰', color: 'green',  url: 'https://unifiedportal-mem.epfindia.gov.in/',                                   desc: 'PF balance check, withdrawal, UAN activation, passbook'               },
  { cat: 'Finance & Tax',        name: 'Ration Card (NFSA)', icon: '🌾', color: 'yellow', url: 'https://nfsa.gov.in/',                                                         desc: 'Ration card beneficiary search, supply chain status'                  },
  // All-in-one services
  { cat: 'All-in-one Services',  name: 'UMANG App',          icon: '🏛️', color: 'purple', url: 'https://web.umang.gov.in/',                                                    desc: '100+ central & state govt services — PF, Aadhaar, CBSE, more'        },
  { cat: 'All-in-one Services',  name: 'CSC Portal',         icon: '🏪', color: 'orange', url: 'https://www.csc.gov.in/',                                                      desc: 'Common Service Centre — apply for all citizen certificates'           },
]

// ─── Helper: Promise-based image loader ──────────────────────────────────────
const loadImg = (src) => new Promise(resolve => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.src = src
})

// ─── Helper: open print window ────────────────────────────────────────────────
const printDataUrl = (dataUrl) => {
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}img{width:100%;display:block}</style>
    </head><body><img src="${dataUrl}"/></body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print(); }, 500)
}

// ─── Helper: download data URL as file ───────────────────────────────────────
const downloadDataUrl = (dataUrl, filename) => {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

// ─── Helper: read file as data URL ───────────────────────────────────────────
const readFile = (file) => new Promise(resolve => {
  const r = new FileReader()
  r.onload = e => resolve(e.target.result)
  r.readAsDataURL(file)
})


// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 1 — Aadhaar Card Combiner
// Solves: owner has to manually combine front+back using Paint or other software
// Solution: Upload 2 photos → canvas combines them → download/print in 1 click
// ═══════════════════════════════════════════════════════════════════════════════
function AadhaarCombiner() {
  const [front,   setFront]   = useState(null)
  const [back,    setBack]    = useState(null)
  const [result,  setResult]  = useState(null)
  const [busy,    setBusy]    = useState(false)
  const [layout,  setLayout]  = useState('portrait')  // portrait | landscape
  const canvasRef = useRef(null)

  const pickImage = (side) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await readFile(file)
    side === 'front' ? setFront(url) : setBack(url)
    setResult(null)   // reset result when image changes
  }

  const combine = async () => {
    if (!front || !back) return
    setBusy(true)
    setResult(null)

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const [fi, bi] = await Promise.all([loadImg(front), loadImg(back)])

    // Aadhaar card aspect ratio: 85.6mm wide × 54mm tall = 1.585 : 1
    const RATIO = 85.6 / 54

    if (layout === 'portrait') {
      // A4 portrait at 150 DPI ≈ 1240 × 1754 px
      canvas.width  = 1240
      canvas.height = 1754
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const pad   = 30
      const cardW = canvas.width - pad * 2
      const cardH = Math.round(cardW / RATIO)

      // ── FRONT ──
      ctx.font = 'bold 28px sans-serif'
      ctx.fillStyle = '#6b7280'
      ctx.textAlign = 'left'
      ctx.fillText('FRONT SIDE', pad, 46)
      ctx.drawImage(fi, pad, 58, cardW, cardH)
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2
      ctx.strokeRect(pad, 58, cardW, cardH)

      // ── SEPARATOR ──
      const sepY = 58 + cardH + 46
      ctx.save()
      ctx.setLineDash([14, 7])
      ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(pad, sepY); ctx.lineTo(pad + cardW, sepY); ctx.stroke()
      ctx.restore()
      ctx.font = '24px sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'
      ctx.fillText('✂  cut here  ✂', canvas.width / 2, sepY - 8)

      // ── BACK ──
      const y2 = sepY + 44
      ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
      ctx.fillText('BACK SIDE', pad, y2 - 10)
      ctx.drawImage(bi, pad, y2, cardW, cardH)
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2
      ctx.strokeRect(pad, y2, cardW, cardH)

    } else {
      // A4 landscape at 150 DPI ≈ 1754 × 1240 px
      canvas.width  = 1754
      canvas.height = 1240
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const pad   = 30
      const cardW = Math.round((canvas.width - pad * 3) / 2)
      const cardH = Math.round(cardW / RATIO)
      const cardY = Math.round((canvas.height - cardH - 40) / 2) + 20

      // FRONT
      ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.textAlign = 'left'
      ctx.fillText('FRONT', pad, cardY - 10)
      ctx.drawImage(fi, pad, cardY, cardW, cardH)
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2
      ctx.strokeRect(pad, cardY, cardW, cardH)

      // SEPARATOR
      const sepX = pad + cardW + Math.round(pad / 2)
      ctx.save()
      ctx.setLineDash([14, 7])
      ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(sepX, 30); ctx.lineTo(sepX, canvas.height - 30); ctx.stroke()
      ctx.restore()

      // BACK
      const x2 = pad + cardW + pad
      ctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#6b7280'
      ctx.fillText('BACK', x2, cardY - 10)
      ctx.drawImage(bi, x2, cardY, cardW, cardH)
      ctx.strokeStyle = '#d1d5db'
      ctx.strokeRect(x2, cardY, cardW, cardH)
    }

    setResult(canvas.toDataURL('image/jpeg', 0.95))
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
        <p className="text-blue-800 text-sm font-bold mb-1">How it works</p>
        <p className="text-blue-700 text-sm">
          Upload a photo of the <strong>front</strong> and <strong>back</strong> of the Aadhaar card
          (camera photo or scanned image) → click <strong>Combine</strong> → download or print the
          merged A4 sheet. No external software needed.
        </p>
      </div>

      {/* Layout toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Layout:</span>
        {[
          { val: 'portrait',  label: '📄 Portrait — stacked (recommended)' },
          { val: 'landscape', label: '📋 Landscape — side by side'          },
        ].map(l => (
          <button
            key={l.val}
            onClick={() => { setLayout(l.val); setResult(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${layout === l.val
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Upload cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { side: 'front', label: 'Front Side 🪪', hint: 'Side with photo & Aadhaar number', val: front },
          { side: 'back',  label: 'Back Side 🪪',  hint: 'Side with address & QR code',      val: back  },
        ].map(({ side, label, hint, val }) => (
          <label
            key={side}
            className={`flex flex-col items-center justify-center gap-3 p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all min-h-[180px]
              ${val ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50'}`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={pickImage(side)}
            />
            {val ? (
              <>
                <img src={val} className="max-h-36 max-w-full object-contain rounded-xl shadow-sm" alt={label} />
                <span className="text-xs font-semibold text-green-700">✅ {label} — tap to replace</span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-3xl shadow-sm">🪪</div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                  <p className="text-xs text-gray-400">Tap to upload or take photo</p>
                </div>
              </>
            )}
          </label>
        ))}
      </div>

      {/* Combine button */}
      <button
        onClick={combine}
        disabled={!front || !back || busy}
        className="w-full py-4 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 transition-all shadow-sm"
      >
        {busy ? '⏳ Combining images...' : '🔗 Combine Both Sides → Ready to Print'}
      </button>

      {/* Result preview + actions */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-700">✅ Combined — ready to download or print</p>
          </div>
          <img
            src={result}
            className="w-full rounded-2xl border border-gray-200 shadow-sm"
            alt="Combined Aadhaar"
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => downloadDataUrl(result, `aadhaar-combined-${Date.now()}.jpg`)}
              className="py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
            >
              ⬇️ Download Image
            </button>
            <button
              onClick={() => printDataUrl(result)}
              className="py-3 bg-gray-700 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
            >
              🖨️ Print Directly
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas — all drawing happens here */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 2 — Passport Photo Maker
// Solves: owner has to manually resize + arrange photos using external tools
// Solution: Upload 1 photo → auto-crop to 35×45mm → arrange grid → print
// ═══════════════════════════════════════════════════════════════════════════════
function PassportPhotoMaker() {
  const [photo,   setPhoto]   = useState(null)
  const [result,  setResult]  = useState(null)
  const [busy,    setBusy]    = useState(false)
  const [grid,    setGrid]    = useState('4x4')   // 4x4 | 2x4 | 2x2
  const canvasRef = useRef(null)

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(await readFile(file))
    setResult(null)
  }

  const process = async () => {
    if (!photo) return
    setBusy(true)
    setResult(null)

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const img    = await loadImg(photo)

    // A4 portrait at 150 DPI: 1240 × 1754 px
    canvas.width  = 1240
    canvas.height = 1754
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Passport photo standard: 35mm × 45mm (India govt requirement)
    // At 150 DPI: 35mm × (150/25.4) ≈ 207px,  45mm × (150/25.4) ≈ 266px
    const PW  = 207   // photo width  in pixels
    const PH  = 266   // photo height in pixels
    const GAP = 18    // gap between photos

    const [cols, rows] = grid === '4x4' ? [4, 4] : grid === '2x4' ? [2, 4] : [2, 2]

    const totalW = cols * PW + (cols - 1) * GAP
    const totalH = rows * PH + (rows - 1) * GAP
    const startX = Math.round((canvas.width  - totalW) / 2)
    const startY = Math.round((canvas.height - totalH) / 2) + 20

    // Auto center-crop to 35:45 (7:9) ratio
    const srcAspect  = img.width / img.height
    const destAspect = PW / PH
    let sx, sy, sw, sh
    if (srcAspect > destAspect) {
      sh = img.height
      sw = Math.round(img.height * destAspect)
      sx = Math.round((img.width - sw) / 2)
      sy = 0
    } else {
      sw = img.width
      sh = Math.round(img.width / destAspect)
      sx = 0
      sy = Math.round((img.height - sh) / 2)
    }

    // Draw all photos in grid
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (PW + GAP)
        const y = startY + r * (PH + GAP)
        ctx.drawImage(img, sx, sy, sw, sh, x, y, PW, PH)
        // Thin border around each photo (helps cutter guide)
        ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 1
        ctx.strokeRect(x, y, PW, PH)
      }
    }

    // Title at top
    ctx.font = 'bold 30px sans-serif'
    ctx.fillStyle = '#374151'
    ctx.textAlign = 'center'
    ctx.fillText(`Passport Photos — ${cols}×${rows} = ${cols * rows} photos | 35mm × 45mm each`, canvas.width / 2, startY - 24)

    setResult(canvas.toDataURL('image/jpeg', 0.95))
    setBusy(false)
  }

  return (
    <div className="space-y-5">
      <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-4">
        <p className="text-purple-800 text-sm font-bold mb-1">How it works</p>
        <p className="text-purple-700 text-sm">
          Upload <strong>one photo</strong> → select grid size → the tool auto-crops it to the
          standard Indian passport size <strong>(35mm × 45mm)</strong> and arranges copies on A4
          → print and cut.
        </p>
      </div>

      {/* Grid size selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Grid size:</span>
        {[
          { val: '4x4', label: '4×4 — 16 photos (most common)' },
          { val: '2x4', label: '2×4 — 8 photos'                },
          { val: '2x2', label: '2×2 — 4 large photos'          },
        ].map(g => (
          <button
            key={g.val}
            onClick={() => { setGrid(g.val); setResult(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${grid === g.val
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Upload area */}
      <label className={`flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all
        ${photo ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50'}`}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={pickPhoto}
        />
        {photo ? (
          <>
            <img
              src={photo}
              className="w-32 h-40 object-cover rounded-xl border border-gray-200 shadow-sm"
              style={{ objectFit: 'cover' }}
              alt="Passport photo"
            />
            <span className="text-xs font-semibold text-purple-700">✅ Photo uploaded — tap to replace</span>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-4xl">🖼️</div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-700">Upload passport photo</p>
              <p className="text-xs text-gray-400 mt-1">Will be auto-cropped to 35×45mm ratio</p>
              <p className="text-xs text-gray-400">Tap to upload or take a new photo with camera</p>
            </div>
          </>
        )}
      </label>

      <button
        onClick={process}
        disabled={!photo || busy}
        className="w-full py-4 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 disabled:opacity-40 transition-all shadow-sm"
      >
        {busy ? '⏳ Arranging photos...' : `🖼️ Arrange ${grid === '4x4' ? '16' : grid === '2x4' ? '8' : '4'} Photos on A4`}
      </button>

      {result && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-gray-700">✅ Ready — cut along the grey borders after printing</p>
          <img src={result} className="w-full rounded-2xl border border-gray-200 shadow-sm" alt="Arranged photos" />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => downloadDataUrl(result, `passport-photos-${Date.now()}.jpg`)}
              className="py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
            >
              ⬇️ Download Sheet
            </button>
            <button
              onClick={() => printDataUrl(result)}
              className="py-3 bg-gray-700 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
            >
              🖨️ Print Directly
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 3 — Print Cost Calculator
// Solves: owner manually counts pages and calculates cost in their head
// Solution: Enter pages + type → total shown instantly, no mental math needed
// ═══════════════════════════════════════════════════════════════════════════════
function PrintCalculator() {
  const [pages,  setPages]  = useState('')
  const [type,   setType]   = useState('bw')       // bw | color | scan | lam
  const [sided,  setSided]  = useState('single')   // single | double
  const [prices, setPrices] = useState({ bw: 2, color: 10, scan: 5, lam: 15 })

  const pageCount      = parseInt(pages) || 0
  const effectiveSheets = sided === 'double' ? Math.ceil(pageCount / 2) : pageCount
  const unitPrice      = prices[type] || 0
  const total          = effectiveSheets * unitPrice
  const showSided      = type === 'bw' || type === 'color'

  return (
    <div className="max-w-xl space-y-5">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
        <p className="text-orange-800 text-sm font-bold mb-1">Instant cost calculator</p>
        <p className="text-orange-700 text-sm">
          No more counting manually. Type the number of pages → select type → see the exact
          cost instantly. Prices are editable to match your rates.
        </p>
      </div>

      {/* Editable prices */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-bold text-gray-700 mb-4">Your Prices (click to edit)</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'bw',    label: 'B&W Print',  unit: 'per page' },
            { key: 'color', label: 'Color Print', unit: 'per page' },
            { key: 'scan',  label: 'Scanning',    unit: 'per page' },
            { key: 'lam',   label: 'Lamination',  unit: 'per page' },
          ].map(({ key, label, unit }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                {label} <span className="text-gray-400">({unit})</span>
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 transition-colors">
                <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 font-medium">₹</span>
                <input
                  type="number"
                  min="0"
                  className="px-3 py-2.5 text-sm font-bold outline-none w-full text-gray-800"
                  value={prices[key]}
                  onChange={e => setPrices(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calculator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        {/* Print type */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">Print type</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: 'bw',    label: '⬛ B&W'        },
              { val: 'color', label: '🌈 Color'      },
              { val: 'scan',  label: '📷 Scan'       },
              { val: 'lam',   label: '🏷️ Lamination' },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => setType(t.val)}
                className={`py-3 rounded-xl text-xs font-bold border transition-all
                  ${type === t.val
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Single / Double sided */}
        {showSided && (
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Sides</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'single', label: '📄 Single sided'              },
                { val: 'double', label: '📑 Double sided (÷2 sheets)'  },
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => setSided(s.val)}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all
                    ${sided === s.val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pages input */}
        <div>
          <label className="text-sm font-medium text-gray-600 mb-2 block">Number of pages</label>
          <input
            type="number"
            min="1"
            placeholder="Enter pages..."
            className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-3xl font-bold text-center outline-none focus:border-green-400 transition-colors"
            value={pages}
            onChange={e => setPages(e.target.value)}
            autoFocus
          />
        </div>

        {/* Result display */}
        <div className={`rounded-2xl p-6 text-center transition-all ${total > 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border-2 border-gray-200'}`}>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Cost</div>
          <div className={`text-6xl font-black ${total > 0 ? 'text-green-600' : 'text-gray-300'}`}>
            ₹{total}
          </div>
          {total > 0 && (
            <div className="text-sm text-gray-500 mt-3 space-y-0.5">
              <p>{effectiveSheets} sheet{effectiveSheets !== 1 ? 's' : ''} × ₹{unitPrice} per sheet = ₹{total}</p>
              {sided === 'double' && pageCount > 0 && (
                <p className="text-xs text-gray-400">({pageCount} pages printed double-sided = {effectiveSheets} sheets)</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// TOOL 4 — Government Portal Quick Links
// Solves: owner wastes time searching for govt portal URLs every single time
// Solution: One-click cards for every portal they use daily
// ═══════════════════════════════════════════════════════════════════════════════
function GovPortals() {
  const [search, setSearch] = useState('')
  const categories = [...new Set(PORTALS.map(p => p.cat))]

  const filtered = PORTALS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
        <p className="text-indigo-800 text-sm font-bold mb-1">One-click portal access</p>
        <p className="text-indigo-700 text-sm">
          All government portals your customers need — open in a new tab instantly.
          No more searching for URLs every time.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-400 bg-white"
          placeholder="Search portals... (e.g. PAN, Aadhaar, passport)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Portal groups */}
      {search ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(p => <PortalCard key={p.name} p={p} />)}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm">No portals found for "{search}"</p>
            </div>
          )}
        </div>
      ) : (
        categories.map(cat => (
          <div key={cat}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{cat}</p>
            <div className="grid grid-cols-2 gap-3">
              {PORTALS.filter(p => p.cat === cat).map(p => <PortalCard key={p.name} p={p} />)}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function PortalCard({ p }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 bg-white rounded-2xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-md transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-green-50 transition-colors">
        {p.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-800 text-sm group-hover:text-green-700 transition-colors">{p.name}</div>
        <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{p.desc}</div>
      </div>
      <span className="text-gray-300 group-hover:text-green-500 transition-colors text-base mt-1 flex-shrink-0">→</span>
    </a>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE — Tab shell
// ═══════════════════════════════════════════════════════════════════════════════
export default function ToolsPage() {
  const [tab, setTab] = useState('aadhaar')
  const active = TABS.find(t => t.id === tab)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Tools</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cyber cafe automation — everything you do manually, done in one click
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${tab === t.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active tab description */}
      {active && (
        <p className="text-sm text-gray-500">{active.desc}</p>
      )}

      {/* Tab content */}
      <div>
        {tab === 'aadhaar'  && <AadhaarCombiner />}
        {tab === 'passport' && <PassportPhotoMaker />}
        {tab === 'print'    && <PrintCalculator />}
        {tab === 'portals'  && <GovPortals />}
      </div>

    </div>
  )
}
