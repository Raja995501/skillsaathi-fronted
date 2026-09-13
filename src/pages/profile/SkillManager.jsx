import { useEffect, useState, useCallback } from 'react'
import { skillApi } from '../../api/skillApi'
import Alert from '../../components/shared/Alert.jsx'

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

export default function SkillManager() {
  const [mySkills, setMySkills] = useState([])
  const [catalog, setCatalog] = useState([])
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [teachSkillId, setTeachSkillId] = useState('')
  const [teachLevel, setTeachLevel] = useState('BEGINNER')
  const [learnSkillId, setLearnSkillId] = useState('')

  const load = useCallback(async (isMounted = { current: true }) => {
    try {
      const [mineRes, catalogRes] = await Promise.all([
        skillApi.getMySkills(),
        skillApi.getSkills(),
      ])
      
      if (!isMounted.current) return

      setMySkills(mineRes.data?.data || mineRes.data || [])
      setCatalog(catalogRes.data?.data || catalogRes.data || [])
    } catch (err) {
      if (isMounted.current) {
        console.error('Failed to load skills:', err)
        setError('Failed to load skills list')
      }
    }
  }, [])

  useEffect(() => {
    const isMounted = { current: true }
    load(isMounted)

    return () => {
      isMounted.current = false
    }
  }, [load])

  const teachSkills = mySkills.filter((s) => s.type === 'TEACH')
  const learnSkills = mySkills.filter((s) => s.type === 'LEARN')

  // Filter catalog options so users cannot re-add existing skills
  const availableTeachCatalog = catalog.filter(
    (c) => !teachSkills.some((ts) => Number(ts.skillId || ts.skill?.id) === Number(c.id))
  )
  const availableLearnCatalog = catalog.filter(
    (c) => !learnSkills.some((ls) => Number(ls.skillId || ls.skill?.id) === Number(c.id))
  )

  const handleAdd = async (skillId, type, level) => {
    if (!skillId || actionLoading) return
    setError('')
    setActionLoading(true)
    try {
      await skillApi.addSkill({ skillId: Number(skillId), type, level })
      await load()
      if (type === 'TEACH') setTeachSkillId('')
      else setLearnSkillId('')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add skill')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (userSkillId) => {
    if (actionLoading) return
    setError('')
    setActionLoading(true)
    try {
      await skillApi.removeSkill(userSkillId)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove skill')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {error && <Alert type="error">{error}</Alert>}

      {/* SECTION 1: TEACH SKILLS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Skills I Can Teach</h2>
            <p className="text-xs text-gray-400 font-medium">Showcase skills you can mentor or assist others with</p>
          </div>
          <span className="text-xs font-bold bg-indigo-50 text-[#4B2ECF] px-3 py-1 rounded-full">
            {teachSkills.length} Added
          </span>
        </div>

        {/* Badges Display Area */}
        <div className="flex flex-wrap gap-2 min-h-[48px] items-center p-3.5 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
          {teachSkills.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No teaching skills added yet.</p>
          ) : (
            teachSkills.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 bg-white text-[#4B2ECF] border border-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs group hover:border-indigo-300 transition-all"
              >
                <span>{s.skillName || s.skill?.name}</span>
                {s.level && (
                  <span className="text-[10px] bg-indigo-50 text-[#4B2ECF] px-1.5 py-0.5 rounded-md font-semibold">
                    {s.level}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  disabled={actionLoading}
                  className="text-gray-400 hover:text-red-500 font-bold ml-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-6">
            <select
              value={teachSkillId}
              onChange={(e) => setTeachSkillId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white transition-all"
            >
              <option value="">Select skill to teach...</option>
              {availableTeachCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              value={teachLevel}
              onChange={(e) => setTeachLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 outline-none focus:border-[#4B2ECF] focus:bg-white transition-all"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => handleAdd(teachSkillId, 'TEACH', teachLevel)}
              disabled={!teachSkillId || actionLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4B2ECF] hover:bg-[#3b22ab] text-white text-xs font-bold disabled:opacity-40 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1"
            >
              {actionLoading && teachSkillId ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: LEARN SKILLS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Skills I Want to Learn</h2>
            <p className="text-xs text-gray-400 font-medium">Select subjects or skills you want to learn from mentors</p>
          </div>
          <span className="text-xs font-bold bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
            {learnSkills.length} Added
          </span>
        </div>

        {/* Badges Display Area */}
        <div className="flex flex-wrap gap-2 min-h-[48px] items-center p-3.5 bg-slate-50/50 rounded-xl border border-dashed border-gray-200">
          {learnSkills.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No learning goals added yet.</p>
          ) : (
            learnSkills.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-2 bg-white text-amber-800 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs group hover:border-amber-300 transition-all"
              >
                <span>{s.skillName || s.skill?.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  disabled={actionLoading}
                  className="text-gray-400 hover:text-red-500 font-bold ml-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-9">
            <select
              value={learnSkillId}
              onChange={(e) => setLearnSkillId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 outline-none focus:border-amber-500 focus:bg-white transition-all"
            >
              <option value="">Select skill to learn...</option>
              {availableLearnCatalog.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => handleAdd(learnSkillId, 'LEARN', null)}
              disabled={!learnSkillId || actionLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-40 transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1"
            >
              {actionLoading && learnSkillId ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}