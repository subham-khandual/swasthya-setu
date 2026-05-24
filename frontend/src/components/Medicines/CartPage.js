import API_BASE_URL from '../../apiConfig';
import React from 'react';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = React.useState([]);
  const [loadingOrders, setLoadingOrders] = React.useState(false);

  React.useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoadingOrders(true);
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
          const userId = user.userId || user._id;
          const axios = (await import('axios')).default;
          const response = await axios.get(`${API_BASE_URL}/api/orders/user/${userId}`);
          // Show last 3 orders
          setRecentOrders(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to fetch recent orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchRecentOrders();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any medicines to your cart yet.</p>
        <button className="continue-shopping" onClick={() => navigate('/medicines')}>
          <ArrowLeft size={18} /> Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <button className="continue-shopping-top" onClick={() => navigate('/medicines')}>
          <ArrowLeft size={16} /> Back to Store
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.medicineId} className="cart-item">
              <img 
                src={item.imageUrl || 'https://placehold.co/80x80'} 
                alt={item.name} 
                className="item-image"
                loading="lazy" 
                decoding="async" 
              />
              
              <div className="item-details">
                <h3>{item.name}</h3>
                <p className="item-price">₹{item.price}</p>
              </div>

              {/* Reorganize for better CSS grid application */}
              <div className="cart-item-info">
              
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="qty-btn"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="qty-btn"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="item-total">
                    ₹{item.price * item.quantity}
                  </div>

                  <button 
                    className="remove-btn" 
                    onClick={() => removeFromCart(item.medicineId)}
                  >
                    <Trash2 size={20} />
                  </button>
              </div>
            </div>
          ))}
          
          <div className="cart-actions">
            <button className="clear-cart" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal ({cartItems.length} items)</span>
            <span>₹{cartTotal}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Total</span>
            <span>₹{cartTotal}</span>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <div className="recent-orders-section">
        <h2>Recent Orders</h2>
        {loadingOrders ? (
          <p>Loading recent orders...</p>
        ) : recentOrders.length > 0 ? (
          <div className="recent-orders-list">
            {recentOrders.map(order => (
              <div key={order._id} className="recent-order-card" onClick={() => navigate('/order-history')}>
                <div className="order-info">
                  <span className="order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="order-details">
                  <span className="order-items">{order.items.length} items</span>
                  <span className="order-total">₹{order.totalAmount}</span>
                  <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recent orders found.</p>
        )}
        <button className="view-all-orders" onClick={() => navigate('/order-history')}>
          View All Order History
        </button>
      </div>
    </div>
  );
};

export default CartPage;
