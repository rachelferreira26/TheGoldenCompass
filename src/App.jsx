import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

// ── Storage ──────────────────────────────────────────────────────────────────
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// ── Date utils ───────────────────────────────────────────────────────────────
const daysBetween = (a, b) => {
  const diff = new Date(b) - new Date(a)
  return Math.max(0, Math.round(diff / 86400000))
}
const averageDays = (periods) => {
  const valid = periods.filter(p => p.start && p.end)
  if (!valid.length) return null
  return Math.round(valid.reduce((s, p) => s + daysBetween(p.start, p.end), 0) / valid.length)
}
const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const fmtDuration = (days) => {
  if (days == null) return '—'
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}yr`
}
const monthlyFromDays = (price, days) => {
  if (!price || !days) return null
  return ((price / days) * 30).toFixed(2)
}
const fmtFrequency = (days) => {
  if (days == null) return '—'
  if (days < 7)   return `Every ${days}d`
  if (days < 30)  return `Every ${Math.round(days / 7)}w`
  if (days < 365) return `Every ${Math.round(days / 30)} mo`
  return `Every ${(days / 365).toFixed(1)} yr`
}
const purchasesPerYear = (days) => {
  if (!days) return null
  return (365 / days).toFixed(1)
}

// ── Icons (SVG inline) ───────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  basket:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  shirt:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>,
  medkit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M3 9l2-5h14l2 5"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>,
  leaf:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 004.69 21C12 21 21 15 21 7c-4 0-8 2-11 4"/><path d="M3.82 19.34C5.9 16.17 8 10 17 8"/></svg>,
  home:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  sparkles:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/></svg>,
  fitness:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  restaurant:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  car:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>,
  paw:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="17" cy="15" r="2"/><path d="M12 17.5c-1.5-2.5-5-4-5-7.5a5 5 0 0110 0c0 3.5-3.5 5-5 7.5z"/></svg>,
}

// ── Tiny UI primitives ───────────────────────────────────────────────────────
const s = (obj) => Object.entries(obj).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';')

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff',borderRadius:'24px 24px 0 0',padding:28,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
          <h2 style={{ fontSize:20,fontWeight:700 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none',border:'none',fontSize:22,color:'var(--muted)',lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Btn({ onClick, variant='primary', children, style={} }) {
  const base = { padding:'12px 20px',borderRadius:12,fontWeight:600,fontSize:15,border:'none',cursor:'pointer',transition:'opacity .15s' }
  const variants = {
    primary: { background:'var(--primary)',color:'#fff' },
    outline: { background:'none',border:'1px solid var(--border)',color:'var(--muted)' },
    danger:  { background:'var(--danger)',color:'#fff' },
    ghost:   { background:'none',border:'none',color:'var(--primary)',padding:'8px 12px' },
  }
  return <button onClick={onClick} style={{ ...base,...variants[variant],...style }}>{children}</button>
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6 }}>{label}</label>}
      <input style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',fontSize:15,color:'var(--text)',outline:'none' }} {...props} />
    </div>
  )
}

function Badge({ children, color='var(--primary)', bg='var(--primary-light)' }) {
  return <span style={{ background:bg,color,padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:600 }}>{children}</span>
}

// ── CATEGORIES screen ────────────────────────────────────────────────────────
function CategoriesScreen({ cats, setCats }) {
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('basket')

  const openAdd = () => { setEditing(null); setName(''); setIcon('basket'); setModal(true) }
  const openEdit = (c) => { setEditing(c); setName(c.name); setIcon(c.icon); setModal(true) }

  const saveIt = () => {
    if (!name.trim()) return
    const updated = editing
      ? cats.map(c => c.id === editing.id ? { ...c, name: name.trim(), icon } : c)
      : [...cats, { id: uuidv4(), name: name.trim(), icon }]
    setCats(updated)
    save('categories', updated)
    setModal(false)
  }

  const del = (id) => {
    if (!confirm('Delete this category?')) return
    const updated = cats.filter(c => c.id !== id)
    setCats(updated)
    save('categories', updated)
  }

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24 }}>
        <h1 style={{ fontSize:26,fontWeight:800 }}>Categories</h1>
        <Btn onClick={openAdd}>+ Add</Btn>
      </div>

      {cats.length === 0 && <p style={{ color:'var(--muted)',textAlign:'center',marginTop:60 }}>No categories yet. Add one to get started.</p>}

      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        {cats.map(c => (
          <div key={c.id} style={{ background:'#fff',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ width:40,height:40,borderRadius:20,background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <span style={{ width:20,height:20,display:'block' }}>{CATEGORY_ICONS[c.icon] || CATEGORY_ICONS.basket}</span>
              </span>
              <span style={{ fontWeight:600,fontSize:16 }}>{c.name}</span>
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <Btn variant='ghost' onClick={() => openEdit(c)}>Edit</Btn>
              <Btn variant='ghost' onClick={() => del(c.id)} style={{ color:'var(--danger)' }}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Body Care" autoFocus />
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10 }}>Icon</label>
          <div style={{ display:'flex',flexWrap:'wrap',gap:10 }}>
            {Object.keys(CATEGORY_ICONS).map(k => (
              <button key={k} onClick={() => setIcon(k)} style={{ width:48,height:48,borderRadius:24,border:`2px solid ${icon===k ? 'var(--primary)' : 'var(--border)'}`,background:icon===k ? 'var(--primary)' : '#fff',color:icon===k ? '#fff' : 'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                <span style={{ width:22,height:22,display:'block' }}>{CATEGORY_ICONS[k]}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex',gap:12 }}>
          <Btn variant='outline' onClick={() => setModal(false)} style={{ flex:1 }}>Cancel</Btn>
          <Btn onClick={saveIt} style={{ flex:1 }}>Save</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ── PRODUCT FORM ─────────────────────────────────────────────────────────────
function ProductForm({ cats, editing, onSave, onClose }) {
  const [name, setName]       = useState(editing?.name || '')
  const [brand, setBrand]     = useState(editing?.brand || '')
  const [catId, setCatId]     = useState(editing?.categoryId || '')
  const [price, setPrice]     = useState(editing?.price ?? '')
  const [notes, setNotes]     = useState(editing?.notes || '')
  const [periods, setPeriods] = useState(
    editing?.periods?.length ? editing.periods : [{ id: uuidv4(), start: '', end: '' }]
  )

  const addPeriod = () => {
    if (periods.length >= 3) return
    setPeriods([...periods, { id: uuidv4(), start: '', end: '' }])
  }

  const updPeriod = (id, field, val) =>
    setPeriods(periods.map(p => p.id === id ? { ...p, [field]: val } : p))

  const remPeriod = (id) => {
    if (periods.length === 1) return
    setPeriods(periods.filter(p => p.id !== id))
  }

  const submit = () => {
    if (!name.trim()) return alert('Product name is required')
    onSave({
      id: editing?.id || uuidv4(),
      name: name.trim(),
      brand: brand.trim(),
      categoryId: catId,
      price: price !== '' ? parseFloat(price) : null,
      notes: notes.trim(),
      periods,
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div>
      <Input label="Product Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Body Lotion" autoFocus />

      <Input label="Brand (optional)" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Dove" />

      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6 }}>Category</label>
        <select value={catId} onChange={e => setCatId(e.target.value)} style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',fontSize:15,color:'var(--text)',background:'#fff',outline:'none' }}>
          <option value="">— None —</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Input label="Price (optional)" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 8.99" />

      <div style={{ marginBottom:8 }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
          <label style={{ fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px' }}>Usage Periods (up to 3)</label>
          {periods.length < 3 && <Btn variant='ghost' onClick={addPeriod} style={{ fontSize:13,padding:'4px 10px' }}>+ Add Period</Btn>}
        </div>
        <p style={{ fontSize:13,color:'var(--muted)',marginBottom:12 }}>Track open/finish dates for each unit to calculate average lifespan.</p>
        {periods.map((p, i) => (
          <div key={p.id} style={{ background:'var(--bg)',borderRadius:12,padding:14,marginBottom:10,border:'1px solid var(--border)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
              <span style={{ fontWeight:600,fontSize:14 }}>Period {i + 1}</span>
              {periods.length > 1 && <button onClick={() => remPeriod(p.id)} style={{ background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:13,fontWeight:600 }}>Remove</button>}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div>
                <label style={{ display:'block',fontSize:12,color:'var(--muted)',marginBottom:4 }}>Start Date</label>
                <input type="date" value={p.start} onChange={e => updPeriod(p.id, 'start', e.target.value)} style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',fontSize:14,color:'var(--text)',background:'#fff',outline:'none' }} />
              </div>
              <div>
                <label style={{ display:'block',fontSize:12,color:'var(--muted)',marginBottom:4 }}>End Date</label>
                <input type="date" value={p.end} onChange={e => updPeriod(p.id, 'end', e.target.value)} style={{ width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--border)',fontSize:14,color:'var(--text)',background:'#fff',outline:'none' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:24 }}>
        <label style={{ display:'block',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:6 }}>Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Size, brand, variant…" rows={3} style={{ width:'100%',padding:'12px 14px',borderRadius:12,border:'1px solid var(--border)',fontSize:15,color:'var(--text)',outline:'none',resize:'vertical' }} />
      </div>

      <div style={{ display:'flex',gap:12 }}>
        <Btn variant='outline' onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={submit} style={{ flex:1 }}>Save Product</Btn>
      </div>
    </div>
  )
}

// ── PRODUCTS screen ───────────────────────────────────────────────────────────
function ProductsScreen({ products, setProducts, cats, onView }) {
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  const openAdd  = () => { setEditing(null); setModal(true) }
  const openEdit = (p) => { setEditing(p); setModal(true) }

  const saveProduct = (product) => {
    const updated = editing
      ? products.map(p => p.id === editing.id ? product : p)
      : [...products, product]
    setProducts(updated)
    save('products', updated)
    setModal(false)
  }

  const del = (id) => {
    if (!confirm('Delete this product?')) return
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    save('products', updated)
  }

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat  = filterCat ? p.categoryId === filterCat : true
    return matchName && matchCat
  })

  const catOf = (id) => cats.find(c => c.id === id)

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
        <h1 style={{ fontSize:26,fontWeight:800 }}>Products</h1>
        <Btn onClick={openAdd}>+ Add</Btn>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ flex:1,minWidth:160,padding:'10px 14px',borderRadius:12,border:'1px solid var(--border)',fontSize:14,outline:'none' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding:'10px 14px',borderRadius:12,border:'1px solid var(--border)',fontSize:14,color:'var(--text)',background:'#fff',outline:'none' }}>
          <option value="">All Categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <p style={{ color:'var(--muted)',textAlign:'center',marginTop:60 }}>No products found.</p>}

      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
        {filtered.map(p => {
          const avg = averageDays(p.periods)
          const monthly = monthlyFromDays(p.price, avg)
          const cat = catOf(p.categoryId)
          const done = p.periods.filter(x => x.start && x.end).length

          return (
            <div key={p.id} style={{ background:'#fff',borderRadius:16,padding:18,cursor:'pointer' }} onClick={() => onView(p.id)}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:14 }}>
                <span style={{ width:40,height:40,borderRadius:20,background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <span style={{ width:20,height:20,display:'block' }}>{CATEGORY_ICONS[cat?.icon || 'basket']}</span>
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:16 }}>{p.name}</div>
                  <div style={{ fontSize:13,color:'var(--muted)' }}>{[p.brand, cat?.name].filter(Boolean).join(' · ')}</div>
                </div>
                <div style={{ display:'flex',gap:4 }} onClick={e => e.stopPropagation()}>
                  <Btn variant='ghost' onClick={() => openEdit(p)} style={{ fontSize:13 }}>Edit</Btn>
                  <Btn variant='ghost' onClick={() => del(p.id)} style={{ fontSize:13,color:'var(--danger)' }}>Delete</Btn>
                </div>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',background:'var(--bg)',borderRadius:10,padding:'10px 0' }}>
                {[
                  ['Avg Life', fmtDuration(avg)],
                  ['Buy Every', fmtFrequency(avg)],
                  ['Price', p.price ? `$${p.price}` : '—'],
                  ['Monthly', monthly ? `$${monthly}` : '—'],
                ].map(([label, val]) => (
                  <div key={label} style={{ textAlign:'center',borderRight:'1px solid var(--border)',paddingRight:0 }}>
                    <div style={{ fontWeight:700,fontSize:15,color:'var(--text)' }}>{val}</div>
                    <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'New Product'}>
        <ProductForm cats={cats} editing={editing} onSave={saveProduct} onClose={() => setModal(false)} />
      </Modal>
    </div>
  )
}

// ── PRODUCT DETAIL ────────────────────────────────────────────────────────────
function ProductDetail({ product, cats, onBack, onEdit }) {
  const cat = cats.find(c => c.id === product.categoryId)
  const avg = averageDays(product.periods)
  const monthly = monthlyFromDays(product.price, avg)
  const yearly = monthly ? (parseFloat(monthly) * 12).toFixed(2) : null
  const done = product.periods.filter(p => p.start && p.end)

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:24 }}>
        <button onClick={onBack} style={{ background:'none',border:'none',color:'var(--primary)',fontSize:15,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4 }}>
          ← Back
        </button>
        <h1 style={{ flex:1,fontSize:22,fontWeight:800 }}>{product.name}</h1>
        <Btn variant='outline' onClick={onEdit}>Edit</Btn>
      </div>

      {/* Summary */}
      <div style={{ background:'#fff',borderRadius:16,padding:20,marginBottom:20,display:'flex',alignItems:'center',gap:14 }}>
        <span style={{ width:56,height:56,borderRadius:28,background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ width:28,height:28,display:'block' }}>{CATEGORY_ICONS[cat?.icon || 'basket']}</span>
        </span>
        <div>
          <div style={{ fontSize:20,fontWeight:700 }}>{product.name}</div>
          <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginTop:4 }}>
            {product.brand && <Badge color='var(--primary)' bg='var(--primary-light)'>{product.brand}</Badge>}
            {cat && <Badge>{cat.name}</Badge>}
          </div>
          {product.notes && <div style={{ fontSize:14,color:'var(--muted)',marginTop:6 }}>{product.notes}</div>}
        </div>
      </div>

      {/* Stats */}
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:12 }}>Budget Insights</h2>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:24 }}>
        {[
          ['Avg Lifespan', fmtDuration(avg)],
          ['Buy Frequency', fmtFrequency(avg)],
          ['Per Year', avg ? `${purchasesPerYear(avg)}×` : '—'],
          ['Unit Price', product.price ? `$${product.price}` : '—'],
          ['Monthly Cost', monthly ? `$${monthly}` : '—'],
          ['Yearly Cost', yearly ? `$${yearly}` : '—'],
        ].map(([label, val]) => (
          <div key={label} style={{ background:'#fff',borderRadius:14,padding:16,textAlign:'center' }}>
            <div style={{ fontSize:24,fontWeight:800,color:'var(--primary)' }}>{val}</div>
            <div style={{ fontSize:12,color:'var(--muted)',marginTop:4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Periods */}
      <h2 style={{ fontSize:16,fontWeight:700,marginBottom:12 }}>Usage Periods</h2>
      {product.periods.map((p, i) => {
        const days = p.start && p.end ? daysBetween(p.start, p.end) : null
        const hasData = p.start || p.end
        return (
          <div key={p.id} style={{ background:'#fff',borderRadius:14,padding:16,marginBottom:10,border:'1px solid var(--border)',opacity:hasData ? 1 : 0.5 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
              <Badge bg='var(--primary)' color='#fff'>Period {i + 1}</Badge>
              {days !== null && <Badge>{days} days</Badge>}
            </div>
            {hasData ? (
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <div style={{ flex:1,textAlign:'center' }}>
                  <div style={{ fontSize:11,color:'var(--muted)',marginBottom:4 }}>Opened</div>
                  <div style={{ fontWeight:600 }}>{fmtDate(p.start)}</div>
                </div>
                <div style={{ color:'var(--muted)' }}>→</div>
                <div style={{ flex:1,textAlign:'center' }}>
                  <div style={{ fontSize:11,color:'var(--muted)',marginBottom:4 }}>Finished</div>
                  <div style={{ fontWeight:600 }}>{fmtDate(p.end)}</div>
                </div>
              </div>
            ) : (
              <p style={{ color:'var(--muted)',fontStyle:'italic',fontSize:14 }}>No dates recorded</p>
            )}
          </div>
        )
      })}

      {done.length > 1 && (
        <div style={{ background:'var(--primary-light)',borderRadius:12,padding:14,display:'flex',alignItems:'center',gap:10,marginTop:4 }}>
          <span style={{ fontSize:20 }}>📊</span>
          <span style={{ fontSize:14 }}>Average across <strong>{done.length} periods</strong>: <strong style={{ color:'var(--primary)' }}>{avg} days ({fmtDuration(avg)})</strong></span>
        </div>
      )}
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ products, cats, onNavigate, onViewProduct }) {
  const totalMonthly = products.reduce((sum, p) => {
    const m = monthlyFromDays(p.price, averageDays(p.periods))
    return sum + (m ? parseFloat(m) : 0)
  }, 0)

  const withData = products.filter(p => averageDays(p.periods) !== null)

  const catSpend = cats.map(c => {
    const ps = products.filter(p => p.categoryId === c.id)
    const mo = ps.reduce((s, p) => {
      const m = monthlyFromDays(p.price, averageDays(p.periods))
      return s + (m ? parseFloat(m) : 0)
    }, 0)
    return { ...c, monthly: mo, count: ps.length }
  }).filter(c => c.monthly > 0).sort((a, b) => b.monthly - a.monthly)

  const recent = [...products].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 4)

  return (
    <div>
      <h1 style={{ fontSize:26,fontWeight:800,marginBottom:20 }}>Dashboard</h1>

      {/* Hero */}
      <div style={{ background:'var(--primary)',borderRadius:20,padding:'28px 24px',marginBottom:16,color:'#fff' }}>
        <div style={{ fontSize:13,opacity:.75,marginBottom:12,textAlign:'center' }}>Purchase Overview</div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11,opacity:.75,marginBottom:4 }}>Monthly Spend</div>
            <div style={{ fontSize:28,fontWeight:900 }}>${totalMonthly.toFixed(2)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11,opacity:.75,marginBottom:4 }}>Yearly Spend</div>
            <div style={{ fontSize:28,fontWeight:900 }}>${(totalMonthly*12).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24 }}>
        {[
          ['📦', products.length, 'Products'],
          ['📁', cats.length, 'Categories'],
          ['✅', withData.length, 'With Averages'],
        ].map(([icon, val, label]) => (
          <div key={label} style={{ background:'#fff',borderRadius:14,padding:16,textAlign:'center' }}>
            <div style={{ fontSize:22 }}>{icon}</div>
            <div style={{ fontSize:22,fontWeight:800,marginTop:4 }}>{val}</div>
            <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category spend */}
      {catSpend.length > 0 && (
        <>
          <h2 style={{ fontSize:16,fontWeight:700,marginBottom:12 }}>Spend by Category</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:24 }}>
            {catSpend.map(c => (
              <div key={c.id} style={{ background:'#fff',borderRadius:12,padding:14,display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ width:36,height:36,borderRadius:18,background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <span style={{ width:18,height:18,display:'block' }}>{CATEGORY_ICONS[c.icon || 'basket']}</span>
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600 }}>{c.name}</div>
                  <div style={{ fontSize:12,color:'var(--muted)' }}>{c.count} product{c.count!==1?'s':''}</div>
                </div>
                <div style={{ fontWeight:700,color:'var(--primary)',fontSize:15 }}>${c.monthly.toFixed(2)}/mo</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recent */}
      {recent.length > 0 && (
        <>
          <h2 style={{ fontSize:16,fontWeight:700,marginBottom:12 }}>Recently Updated</h2>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {recent.map(p => {
              const cat = cats.find(c => c.id === p.categoryId)
              const avg = averageDays(p.periods)
              return (
                <div key={p.id} style={{ background:'#fff',borderRadius:12,padding:14,display:'flex',alignItems:'center',gap:12,cursor:'pointer' }} onClick={() => onViewProduct(p.id)}>
                  <span style={{ width:36,height:36,borderRadius:18,background:'var(--primary-light)',color:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <span style={{ width:18,height:18,display:'block' }}>{CATEGORY_ICONS[cat?.icon || 'basket']}</span>
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600 }}>{p.name}</div>
                    <div style={{ fontSize:12,color:'var(--muted)' }}>{cat?.name || 'Uncategorized'}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:700,color:'var(--primary)',fontSize:14 }}>{fmtFrequency(avg)}</div>
                    <div style={{ fontSize:11,color:'var(--muted)',marginTop:2 }}>{avg != null ? `${avg} days` : '—'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {products.length === 0 && (
        <div style={{ textAlign:'center',padding:'60px 20px' }}>
          <div style={{ fontSize:60 }}>🧴</div>
          <h2 style={{ fontSize:20,fontWeight:700,marginTop:16,marginBottom:8 }}>Nothing tracked yet</h2>
          <p style={{ color:'var(--muted)',fontSize:14,lineHeight:1.6,marginBottom:24 }}>Add your first product to start tracking how long it lasts and what it costs per month.</p>
          <Btn onClick={() => onNavigate('products')}>Add a Product</Btn>
        </div>
      )}
    </div>
  )
}

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard', emoji:'📊' },
  { id:'products',  label:'Products',  emoji:'📦' },
  { id:'categories',label:'Categories',emoji:'📁' },
]

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [cats, setCats]         = useState(() => load('categories', []))
  const [products, setProducts] = useState(() => load('products', []))
  const [tab, setTab]           = useState('dashboard')
  const [viewId, setViewId]     = useState(null)
  const [editingId, setEditingId] = useState(null)

  const viewProduct = (id) => { setViewId(id); setTab('products') }

  const viewingProduct = tab === 'products' && viewId
  const product = viewingProduct ? products.find(p => p.id === viewId) : null

  const handleEdit = () => { setEditingId(viewId) }

  // editing modal within detail view
  const [editModal, setEditModal] = useState(false)
  useEffect(() => { if (editingId) setEditModal(true) }, [editingId])

  const saveFromDetail = (updated) => {
    const all = products.map(p => p.id === updated.id ? updated : p)
    setProducts(all)
    save('products', all)
    setEditModal(false)
    setEditingId(null)
  }

  return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column' }}>
      {/* Top bar */}
      <header style={{ background:'var(--primary)',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:11,color:'rgba(255,255,255,.7)',fontWeight:600,letterSpacing:1,textTransform:'uppercase' }}>Budget Tracker</div>
          <div style={{ fontSize:20,fontWeight:800,color:'#fff' }}>The Golden Compass</div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex:1,maxWidth:640,margin:'0 auto',width:'100%',padding:'24px 16px 100px' }}>
        {tab === 'dashboard' && <Dashboard products={products} cats={cats} onNavigate={setTab} onViewProduct={viewProduct} />}
        {tab === 'products' && !viewingProduct && (
          <ProductsScreen products={products} setProducts={setProducts} cats={cats} onView={viewProduct} />
        )}
        {tab === 'products' && viewingProduct && product && (
          <>
            <ProductDetail
              product={product}
              cats={cats}
              onBack={() => { setViewId(null) }}
              onEdit={handleEdit}
            />
            <Modal open={editModal} onClose={() => { setEditModal(false); setEditingId(null) }} title="Edit Product">
              <ProductForm cats={cats} editing={product} onSave={saveFromDetail} onClose={() => { setEditModal(false); setEditingId(null) }} />
            </Modal>
          </>
        )}
        {tab === 'categories' && <CategoriesScreen cats={cats} setCats={setCats} />}
      </main>

      {/* Bottom nav */}
      <nav style={{ position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'space-around',padding:'8px 0 12px' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setViewId(null) }}
            style={{ flex:1,background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,color:tab===item.id ? 'var(--primary)' : 'var(--muted)',fontWeight:tab===item.id ? 700 : 400,fontSize:11,padding:'4px 0' }}
          >
            <span style={{ fontSize:22 }}>{item.emoji}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
