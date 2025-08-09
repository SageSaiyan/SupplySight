import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { ShoppingCart, Package, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders')
      setOrders(response.data.orders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.role === 'manager' ? 'All Orders' : 'My Orders'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'manager' ? 'View all orders across stores' : 'View your order history'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">Start shopping to see your orders here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order._id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-600">{order.store?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    ${order.totalAmount?.toFixed(2)}
                  </p>
                  <span className={`text-sm px-2 py-1 rounded ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{item.item?.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>Qty: {item.quantity}</span>
                      <span>${item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center mt-4 text-xs text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(order.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders 