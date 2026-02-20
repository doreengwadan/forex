export function LiveClassCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-300"></div>
      
      <div className="pt-8 px-6 pb-6">
        {/* Mentor skeleton */}
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200"></div>
          <div className="ml-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
        
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        
        {/* Details grid skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  )
}