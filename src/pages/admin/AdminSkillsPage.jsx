import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { adminApi } from '../../api/adminApi'
import { skillApi } from '../../api/skillApi'
import { useToast } from '../../hooks/useToast.jsx'

export default function AdminSkillsPage() {
  const showToast = useToast()
  const [categories, setCategories] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)

  const [newCategory, setNewCategory] = useState('')
  const [newSkill, setNewSkill] = useState({ name: '', categoryId: '' })
  
  const [isSubmittingCat, setIsSubmittingCat] = useState(false)
  const [isSubmittingSkill, setIsSubmittingSkill] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, skillRes] = await Promise.all([
        skillApi.getCategories(),
        skillApi.getSkills()
      ])
      const catData = catRes.data?.data || catRes.data || []
      const skillData = skillRes.data?.data || skillRes.data || []
      
      setCategories(Array.isArray(catData) ? catData : [])
      setSkills(Array.isArray(skillData) ? skillData : [])
    } catch (err) {
      console.error('Failed to load categories or skills:', err)
      showToast(err.response?.data?.message || 'Could not fetch categories/skills', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.trim() || isSubmittingCat) return
    setIsSubmittingCat(true)
    try {
      await adminApi.createCategory(newCategory.trim())
      setNewCategory('')
      await loadData()
      showToast('Category added successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add category', 'error')
    } finally {
      setIsSubmittingCat(false)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    setDeletingId(`cat-${id}`)
    try {
      await adminApi.deleteCategory(id)
      await loadData()
      showToast('Category deleted successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete category — it may have associated skills', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkill.name.trim() || !newSkill.categoryId || isSubmittingSkill) return
    setIsSubmittingSkill(true)
    try {
      await adminApi.createSkill(newSkill.name.trim(), Number(newSkill.categoryId))
      setNewSkill({ name: '', categoryId: '' })
      await loadData()
      showToast('Skill added successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not add skill', 'error')
    } finally {
      setIsSubmittingSkill(false)
    }
  }

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return
    setDeletingId(`skill-${id}`)
    try {
      await adminApi.deleteSkill(id)
      await loadData()
      showToast('Skill deleted successfully', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete skill', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          Skills & Categories
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Manage platform taxonomy, taxonomy categories, and available technical skills.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs flex flex-col">
          <h2 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
            <span>📁</span> Categories
          </h2>

          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
            />
            <button
              type="submit"
              disabled={isSubmittingCat || !newCategory.trim()}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSubmittingCat ? 'Adding...' : 'Add'}
            </button>
          </form>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No categories found.</p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">{c.name}</span>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      disabled={deletingId === `cat-${c.id}`}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-50 transition cursor-pointer"
                    >
                      {deletingId === `cat-${c.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs flex flex-col">
          <h2 className="font-bold text-gray-900 mb-4 text-base flex items-center gap-2">
            <span>🧩</span> Skills
          </h2>

          <form onSubmit={handleAddSkill} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              value={newSkill.name}
              onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
              placeholder="Skill name"
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
            />
            <select
              value={newSkill.categoryId}
              onChange={(e) => setNewSkill((s) => ({ ...s, categoryId: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm outline-none focus:border-brand-blue bg-white text-gray-700 transition-all"
            >
              <option value="">Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isSubmittingSkill || !newSkill.name.trim() || !newSkill.categoryId}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs sm:text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSubmittingSkill ? 'Adding...' : 'Add'}
            </button>
          </form>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {skills.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No skills found.</p>
              ) : (
                skills.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                        {s.name}
                      </span>
                      {s.categoryName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                          {s.categoryName}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSkill(s.id)}
                      disabled={deletingId === `skill-${s.id}`}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold disabled:opacity-50 transition cursor-pointer shrink-0"
                    >
                      {deletingId === `skill-${s.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}