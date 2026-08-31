import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'customer',
    phone: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'seller' ? '/seller' : '/onboarding')
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: ['Something went wrong. Please try again.'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="surface r-organic-lg p-9">
        <h1 className="font-display text-3xl font-semibold text-brand-600">join the hub</h1>
        <p className="mt-1 text-sm text-wood/75">Buy handmade, or start selling your own.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-800">I am a...</label>
          <div className="flex gap-3">
            {[
              { key: 'customer', icon: 'fa-heart' },
              { key: 'seller', icon: 'fa-store' },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setForm({ ...form, role: r.key })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm capitalize transition ${
                  form.role === r.key
                    ? 'border-gold-400 bg-gold-100/50 font-semibold text-brand-700'
                    : 'border-line text-wood/80 hover:bg-white/60'
                }`}
              >
                <i aria-hidden="true" className={`fa-solid ${r.icon} mr-1.5`} />
                {r.key}
              </button>
            ))}
          </div>
        </div>

        <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} errors={errors.name} />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
          errors={errors.email}
        />
        <Field
          label="Phone (optional)"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          errors={errors.phone}
          required={false}
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
          errors={errors.password}
        />
        <Field
          label="Confirm password"
          type="password"
          value={form.password_confirmation}
          onChange={(v) => setForm({ ...form, password_confirmation: v })}
        />

        {errors.general && <p className="text-sm text-red-600">{errors.general[0]}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
        </form>

        <p className="mt-5 text-sm text-wood/80">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', errors, required = true }) {
  const id = 'field-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-brand-800">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
      {errors && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
    </div>
  )
}
