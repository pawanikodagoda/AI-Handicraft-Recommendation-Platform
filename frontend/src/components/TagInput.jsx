import { useState } from 'react'

export default function TagInput({ label, tags, onChange }) {
  const [draft, setDraft] = useState('')

  function add() {
    const value = draft.trim()
    if (value && !tags.includes(value)) onChange([...tags, value])
    setDraft('')
  }

  function remove(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-800">{label}</label>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white/70 p-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 rounded-full border border-line bg-sand px-2.5 py-1 text-xs font-semibold text-brand-800"
          >
            {tag}
            <button type="button" onClick={() => remove(tag)} className="text-wood/50 hover:text-red-500">
              &times;
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          placeholder="Type and press Enter"
          className="min-w-[8rem] flex-1 border-none text-sm focus:outline-none"
        />
      </div>
    </div>
  )
}
