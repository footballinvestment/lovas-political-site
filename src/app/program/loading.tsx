export default function ProgramLoading() {
  // Create an array of 6 items for skeleton loading
  const skeletons = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-[#1C1C1C] pt-20">
      {/* Hero Section Skeleton */}
      <div className="relative bg-gradient-to-r from-[#6DAEF0] to-[#8DEBD1]">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 relative z-10">
          <div className="text-center">
            <div className="h-12 w-64 bg-white/20 rounded-lg animate-pulse mx-auto mb-6" />
            <div className="h-6 w-96 bg-white/20 rounded-lg animate-pulse mx-auto" />
          </div>
        </div>
      </div>

      {/* Program Points Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          {/* Category Skeleton */}
          <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse mb-8" />

          {/* Grid of skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skeletons.map((index) => (
              <div
                key={index}
                className="bg-gray-900/50 border border-gray-800 backdrop-blur-sm rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-gray-800 rounded-lg animate-pulse mb-4" />
                  <div className="h-4 w-full bg-gray-800 rounded-lg animate-pulse" />
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="h-20 w-full bg-gray-800 rounded-lg animate-pulse" />
                    <div className="flex items-center justify-between pt-4">
                      <div className="h-6 w-24 bg-gray-800 rounded-full animate-pulse" />
                      <div className="h-6 w-20 bg-gray-800 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
