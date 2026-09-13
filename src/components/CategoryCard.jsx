import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

const CategoryCard = ({ category }) => {
  const navigate = useNavigate()

  const handleCategoryClick = () => {
    if (category?.id) {
      // Category click hone par URL query parameter ke sath navigate karega
      navigate(`/search?category=${encodeURIComponent(category.id)}`)
    }
  }

  return (
    <div 
      onClick={handleCategoryClick}
      className="p-5 border border-gray-100 sm:border-gray-200 rounded-2xl shadow-xs hover:shadow-md active:scale-[0.98] cursor-pointer transition-all duration-200 flex flex-col items-center justify-center bg-white hover:border-[#4B2ECF]/30 group"
    >
      <h3 className="text-sm sm:text-base font-bold text-gray-800 group-hover:text-[#4B2ECF] transition-colors text-center line-clamp-1">
        {category?.name || 'Category'}
      </h3>
    </div>
  )
}

CategoryCard.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
  }),
}

export default CategoryCard