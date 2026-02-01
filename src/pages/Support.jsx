function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Support</h1>
        <p className="text-gray-600 mb-6">We are here to help you.</p>

        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Phone Support</p>
            <p className="text-lg font-semibold text-gray-800">6301630368</p>
            <a
              href="tel:6301630368"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              📞 Call Now
            </a>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Email Support</p>
            <div className="space-y-2">
              <a
                href="mailto:kranthijambuluri@gmail.com"
                className="block text-blue-700 font-semibold hover:underline"
              >
                kranthijambuluri@gmail.com
              </a>
              <a
                href="mailto:kranthir520@gmail.com"
                className="block text-blue-700 font-semibold hover:underline"
              >
                kranthir520@gmail.com
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-500">Support available 9 AM - 6 PM IST</p>
        </div>
      </div>
    </div>
  )
}

export default Support
