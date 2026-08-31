import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePreferences } from '../api/shop'

const COLORS = ['Red', 'Blue', 'Green', 'Pink', 'Purple', 'Black', 'White', 'Gold', 'Silver', 'Turquoise']
const MATERIALS = ['Beads', 'Crystal', 'Silver', 'Gold', 'Wood', 'Leather', 'Thread', 'Pearl', 'Gemstone']
const STYLES = ['Boho', 'Minimalist', 'Elegant', 'Casual', 'Statement', 'Traditional', 'Gift']
const OCCASIONS = ['Birthday', 'Wedding', 'Party', 'Everyday', 'Gift']

export default function Onboarding() {
  const navigate = useNavigate()
  const [colors, setColors] = useState([])
  const [materials, setMaterials] = useState([])
  const [styles, setStyles] = useState([])
  const [saving, setSaving] = useState(false)

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updatePreferences({
        colors,
        materials,
        styles,
      })
      navigate('/')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-4xl font-semibold text-brand-800 capitalize tracking-wide">What's Your Style?</h1>
      <p className="mt-2 text-wood/80">
        A few quick questions so we can match you with pieces you'll love. You can skip this anytime.
      </p>

      <div className="mt-8 space-y-8">
        <ChipGroup title="Favourite colours" options={COLORS} selected={colors} onToggle={(v) => toggle(colors, setColors, v)} />
        <ChipGroup
          title="Preferred materials"
          options={MATERIALS}
          selected={materials}
          onToggle={(v) => toggle(materials, setMaterials, v)}
        />
        <ChipGroup title="Style" options={STYLES} selected={styles} onToggle={(v) => toggle(styles, setStyles, v)} />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          <i aria-hidden="true" className="fa-solid fa-wand-magic-sparkles" />
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
        <button onClick={() => navigate('/')} className="font-medium text-wood/70 hover:text-gold-500">
          Skip for now
        </button>
      </div>
    </div>
  )
}

function ChipGroup({ title, options, selected, onToggle }) {
  return (
    <div>
      <h3 className="mb-2.5 font-display text-lg font-semibold text-brand-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onToggle(o)}
            className={`${selected.includes(o) ? 'chip-active' : 'chip'} !px-4 !py-1.5 !text-sm`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
