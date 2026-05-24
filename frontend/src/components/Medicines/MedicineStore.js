import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Search, Loader2 } from 'lucide-react';
import './MedicineStore.css'; // Add basic CSS locally
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const MedicineStore = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/medicines`);
      setMedicines(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      setLoading(false);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    med.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="medicine-store-container">
      <div className="store-header">
        <h1>Medicine Store</h1>
        
        <div className="store-actions">
          <div className="search-bar">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search medicines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="cart-btn" onClick={() => navigate('/cart')}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={40} />
          <p>Loading medicines...</p>
        </div>
      ) : (
        <div className="medicines-grid">
          {filteredMedicines.length > 0 ? (
            filteredMedicines.map((medicine) => (
              <div key={medicine._id} className="medicine-card">
                <img 
                  src={medicine.imageUrl || 'https://placehold.co/150x150'} 
                  alt={medicine.name} 
                  className="medicine-image" 
                  loading="lazy" 
                  decoding="async" 
                />
                <div className="medicine-details">
                  <h3>{medicine.name}</h3>
                  <p className="category">{medicine.category}</p>
                  <p className="description">{medicine.description}</p>
                  <div className="price-row">
                    <span className="price">₹{medicine.price}</span>
                    <span className={`stock ${medicine.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      {medicine.stock > 0 ? `In Stock: ${medicine.stock}` : 'Out of Stock'}
                    </span>
                  </div>
                  <button 
                    className="add-to-cart-btn"
                    disabled={medicine.stock === 0}
                    onClick={() => addToCart(medicine)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">No medicines found matching your search.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicineStore;
