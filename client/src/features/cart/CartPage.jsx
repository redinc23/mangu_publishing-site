import React, { useContext } from 'react';
import { CartContext } from '../../context/CartContext';

const CartPage = () => {
  const { cartItems } = useContext(CartContext);

  return (
    <main style={{ padding: '80px 20px' }}>
      <h1>Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <p>You have {cartItems.length} item(s) in your cart.</p>
          <ul>
            {cartItems.map(item => (
              <li key={item.id}>
                <strong>{item.title}</strong> by {item.author}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
};

export default CartPage;
