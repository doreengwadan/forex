export function SubscriptionPlanSkeleton() {
  return (
    <div className="animate-pulse p-6 border border-gray-200 rounded-xl bg-white">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="h-10 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>
      
      <div className="mb-8">
        <div className="h-5 bg-gray-200 rounded w-28 mb-3"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
              <div className="h-4 bg-gray-200 rounded flex-1 max-w-[80%]"></div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-12 bg-gray-200 rounded-lg"></div>
    </div>
  )
}