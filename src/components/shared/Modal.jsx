import { useState } from 'react'
import { useToast } from '../../hooks/useToast.jsx'

/**
 * Replaces the prototype's #modal + openModal()/closeModal() global functions.
 * `type` controls the title ("teach" -> "Share your skill", anything else -> signup title),
 * exactly matching the original inline script's ternary.
 */
export default function Modal({ open, type, onClose }) {
  const showToast = useToast()
  const [form, setForm] = useState({ name: '', email: '', location: '', teach: '', learn: '' })

  if (!open) return null

  const title = type === 'teach' ? 'Share your skill' : 'Create your Skill Equator account'

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = () => {
    onClose()
    // Prototype behavior was a static toast; real submission wires to POST /auth/register
    // once the auth pages exist — placeholder kept intentionally for now.
    showToast('Prototype signup submitted!')
  }

  return (
    <div className={`modal ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>

        <label>Name</label>
        <input placeholder="Your name" value={form.name} onChange={handleChange('name')} />

        <label>Email</label>
        <input type="email" placeholder="you@example.com" value={form.email} onChange={handleChange('email')} />

        <label>City / State</label>
        <input placeholder="e.g. Patna, Bihar" value={form.location} onChange={handleChange('location')} />

        <label>I can teach</label>
        <input placeholder="e.g. Excel" value={form.teach} onChange={handleChange('teach')} />

        <label>I want to learn</label>
        <input placeholder="e.g. Spoken English" value={form.learn} onChange={handleChange('learn')} />

        <button className="btn primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSubmit}>
          Continue
        </button>
      </div>
    </div>
  )
}
