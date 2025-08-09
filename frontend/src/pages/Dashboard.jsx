import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { MapPin, Package, ShoppingCart, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores/public')
      setStores(response.data.stores)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Stores</p>
              <p className="text-2xl font-semibold text-gray-900">{stores.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stores.reduce((total, store) => total + (store.itemCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Orders</p>
              <p className="text-2xl font-semibold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Stores */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Stores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.slice(0, 6).map((store) => (
            <div key={store._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{store.address}</p>
              <p className="text-xs text-gray-500 mt-2">
                Manager: {store.manager?.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 