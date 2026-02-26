function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg shadow-lg p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-2">Support</h1>
        <p className="text-slate-400 mb-6">We are here to help you with FarmEazy.</p>

        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400">Phone Support</p>
            <p className="text-lg font-semibold text-white">+91 63016 30368</p>
            <a
              href="tel:+916301630368"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              📞 Call Now
            </a>
          </div>

          <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-2">Email Support</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-500">General Inquiries</p>
                <a
                  href="mailto:info@farm-eazy.com"
                  className="block text-blue-400 font-semibold hover:underline"
                >
                  info@farm-eazy.com
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500">Technical Support</p>
                <a
                  href="mailto:support@farm-eazy.com"
                  className="block text-blue-400 font-semibold hover:underline"
                >
                  support@farm-eazy.com
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500">System Notifications</p>
                <a
                  href="mailto:no-reply@farm-eazy.com"
                  className="block text-blue-400 font-semibold hover:underline"
                >
                  no-reply@farm-eazy.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-2">Website</p>
            <a
              href="https://www.farm-eazy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 font-semibold hover:underline"
            >
              www.farm-eazy.com
            </a>
          </div>

          <p className="text-xs text-slate-500 text-center">Support available Monday - Saturday, 9 AM - 6 PM IST</p>
        </div>
      </div>
    </div>
  )
}

export default Support
