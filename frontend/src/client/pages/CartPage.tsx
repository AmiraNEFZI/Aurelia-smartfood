import { useState } from 'react'
import { Link } from 'react-router-dom'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  img: string
}

const initialCart: CartItem[] = [
  { id: 1, name: 'Big Banana', price: 2.99, quantity: 1, img: '/fruitables/img/vegetable-item-3.png' },
  { id: 2, name: 'Potatoes', price: 2.99, quantity: 1, img: '/fruitables/img/vegetable-item-5.jpg' },
  { id: 3, name: 'Awesome Broccoli', price: 2.99, quantity: 1, img: '/fruitables/img/vegetable-item-2.jpg' },
]

export function CartPage() {
  const [cart, setCart] = useState<CartItem[]>(initialCart)
  const [coupon, setCoupon] = useState('')

  const updateQty = (id: number, delta: number) => {
    setCart(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    )
  }

  const removeItem = (id: number) => setCart(items => items.filter(item => item.id !== id))

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = 3.00
  const total = subtotal + shipping

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Cart</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active text-white">Cart</li>
        </ol>
      </div>

      {/* Cart */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          {cart.length === 0 ? (
            <div className="text-center py-5">
              <i className="fa fa-shopping-bag fa-5x text-secondary mb-4"></i>
              <h3>Your cart is empty</h3>
              <Link to="/shop" className="btn btn-primary rounded-pill px-4 py-3 mt-3">Continue Shopping</Link>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Products</th>
                      <th scope="col">Name</th>
                      <th scope="col">Price</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Total</th>
                      <th scope="col">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img src={item.img} className="img-fluid me-5 rounded-circle" style={{ width: '80px', height: '80px' }} alt={item.name} />
                          </div>
                        </td>
                        <td><p className="mb-0 mt-4">{item.name}</p></td>
                        <td><p className="mb-0 mt-4">${item.price.toFixed(2)}</p></td>
                        <td>
                          <div className="input-group quantity mt-4" style={{ width: '100px' }}>
                            <div className="input-group-btn">
                              <button className="btn btn-sm btn-minus rounded-circle bg-light border" onClick={() => updateQty(item.id, -1)}>
                                <i className="fa fa-minus"></i>
                              </button>
                            </div>
                            <input type="text" className="form-control form-control-sm text-center border-0" value={item.quantity} readOnly />
                            <div className="input-group-btn">
                              <button className="btn btn-sm btn-plus rounded-circle bg-light border" onClick={() => updateQty(item.id, 1)}>
                                <i className="fa fa-plus"></i>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td><p className="mb-0 mt-4">${(item.price * item.quantity).toFixed(2)}</p></td>
                        <td>
                          <button className="btn btn-md rounded-circle bg-light border mt-4" onClick={() => removeItem(item.id)}>
                            <i className="fa fa-times text-danger"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5">
                <input
                  type="text"
                  className="border-0 border-bottom rounded me-5 py-3 mb-4"
                  placeholder="Coupon Code"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value)}
                />
                <button className="btn border-secondary rounded-pill px-4 py-3 text-primary" type="button">Apply Coupon</button>
              </div>

              <div className="row g-4 justify-content-end">
                <div className="col-8"></div>
                <div className="col-sm-8 col-md-7 col-lg-6 col-xl-4">
                  <div className="bg-light rounded">
                    <div className="p-4">
                      <h1 className="display-6 mb-4">Cart <span className="fw-normal">Total</span></h1>
                      <div className="d-flex justify-content-between mb-4">
                        <h5 className="mb-0 me-4">Subtotal:</h5>
                        <p className="mb-0">${subtotal.toFixed(2)}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <h5 className="mb-0 me-4">Shipping</h5>
                        <div><p className="mb-0">Flat rate: ${shipping.toFixed(2)}</p></div>
                      </div>
                    </div>
                    <div className="py-4 mb-4 border-top border-bottom d-flex justify-content-between">
                      <h5 className="mb-0 ps-4 me-4">Total</h5>
                      <p className="mb-0 pe-4">${total.toFixed(2)}</p>
                    </div>
                    <div className="px-4 pb-4">
                      <Link to="/checkout" className="btn border-secondary rounded-pill px-4 py-3 text-primary text-uppercase w-100">
                        Proceed to Checkout
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
