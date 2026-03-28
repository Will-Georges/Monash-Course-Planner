export default function SetupModal({ 
  startYear, 
  setStartYear, 
  degreeLength, 
  setDegreeLength, 
  selectedCourseCode,
  setSelectedCourseCode,
  creatingPlan,
  onComplete 
}) {
  return (
    <div className="min-h-screen bg-blue-400 flex items-center justify-center p-8">
      <div className="bg-white shadow-2xl p-12 max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Setup Your Plan</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Year
            </label>
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Degree Length (years)
            </label>
            <input
              type="number"
              value={degreeLength}
              onChange={(e) => setDegreeLength(parseInt(e.target.value))}
              min="1"
              max="12"
              className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Code (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. C2001"
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
            <p className="text-xs text-gray-500 mt-2">
              If provided, units will be preloaded from the handbook structure for this course.
            </p>
          </div>
          <button
            onClick={onComplete}
            disabled={creatingPlan}
            className="w-full bg-blue-600 text-white py-4 font-semibold hover:bg-blue-700 transition"
          >
            {creatingPlan ? 'Creating Plan...' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
