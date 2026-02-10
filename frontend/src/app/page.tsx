export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">SpendWise SA</h1>
        <p className="text-gray-600 mb-8">Personal Finance Management Platform</p>
        <div className="space-x-4">
          <a href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Login
          </a>
          <a href="/register" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Register
          </a>
        </div>
      </div>
    </div>
  )
}
