import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const orderItems = [
  { name: 'Awesome Broccoli', price: 69, qty: 2, img: '/fruitables/img/vegetable-item-2.jpg' },
  { name: 'Potatoes', price: 69, qty: 2, img: '/fruitables/img/vegetable-item-5.jpg' },
  { name: 'Big Banana', price: 69, qty: 2, img: '/fruitables/img/vegetable-item-3.png' },
]

export function CheckoutPage() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [form, setForm] = useState({
    firstName: '', lastName: '', company: '', address: '',
    city: '', country: '', zip: '', mobile: '', email: '', notes: ''
  })

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Order placed successfully! Thank you for shopping with SmartFood.')
    navigate('/')
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Checkout</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/cart">Cart</Link></li>
          <li className="breadcrumb-item active text-white">Checkout</li>
        </ol>
      </div>

      {/* Checkout */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <h1 className="mb-4">Billing details</h1>
          <form onSubmit={handleSubmit}>
            <div className="row g-5">
              {/* Billing Form */}
              <div className="col-md-12 col-lg-6 col-xl-7">
                <div className="row">
                  <div className="col-md-12 col-lg-6">
                    <div className="form-item w-100">
                      <label className="form-label my-3">First Name<sup>*</sup></label>
                      <input type="text" name="firstName" className="form-control" value={form.firstName} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="col-md-12 col-lg-6">
                    <div className="form-item w-100">
                      <label className="form-label my-3">Last Name<sup>*</sup></label>
                      <input type="text" name="lastName" className="form-control" value={form.lastName} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
                {[
                  { label: 'Company Name', name: 'company', type: 'text', ph: '' },
                  { label: 'Address', name: 'address', type: 'text', ph: 'House Number Street Name' },
                  { label: 'Town/City', name: 'city', type: 'text', ph: '' },
                  { label: 'Country', name: 'country', type: 'text', ph: '' },
                  { label: 'Postcode/Zip', name: 'zip', type: 'text', ph: '' },
                  { label: 'Mobile', name: 'mobile', type: 'tel', ph: '' },
                  { label: 'Email Address', name: 'email', type: 'email', ph: '' },
                ].map(f => (
                  <div key={f.name} className="form-item">
                    <label className="form-label my-3">{f.label}<sup>*</sup></label>
                    <input type={f.type} name={f.name} className="form-control" placeholder={f.ph}
                      value={(form as Record<string, string>)[f.name]} onChange={handleChange} required={f.name !== 'company'} />
                  </div>
                ))}
                <div className="form-check my-3">
                  <input type="checkbox" className="form-check-input" id="createAccount" />
                  <label className="form-check-label" htmlFor="createAccount">Create an account?</label>
                </div>
                <hr />
                <div className="form-check my-3">
                  <input className="form-check-input" type="checkbox" id="diffAddress" />
                  <label className="form-check-label" htmlFor="diffAddress">Ship to a different address?</label>
                </div>
                <div className="form-item">
                  <textarea name="notes" className="form-control" rows={6} placeholder="Order Notes (Optional)" value={form.notes} onChange={handleChange}></textarea>
                </div>
              </div>

              {/* Order Summary */}
              <div className="col-md-12 col-lg-6 col-xl-5">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Products</th><th>Name</th><th>Price</th><th>Qty</th><th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, i) => (
                        <tr key={i}>
                          <td><img src={item.img} className="img-fluid rounded-circle" style={{ width: '80px', height: '80px' }} alt={item.name} /></td>
                          <td className="py-4">{item.name}</td>
                          <td className="py-4">${item.price}.00</td>
                          <td className="py-4">{item.qty}</td>
                          <td className="py-4">${item.price * item.qty}.00</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={3}></td>
                        <td className="py-4"><p className="mb-0 text-dark py-3">Subtotal</p></td>
                        <td className="py-4"><div className="py-3 border-bottom border-top"><p className="mb-0 text-dark">${subtotal}.00</p></div></td>
                      </tr>
                      <tr>
                        <td colSpan={1}></td>
                        <td className="py-4"><p className="mb-0 text-dark py-4">Shipping</p></td>
                        <td colSpan={3} className="py-4">
                          {[{ id: 'free', label: 'Free Shipping', val: 'free' }, { id: 'flat', label: 'Flat rate: $15.00', val: 'flat' }, { id: 'pickup', label: 'Local Pickup: $8.00', val: 'pickup' }].map(s => (
                            <div key={s.id} className="form-check text-start">
                              <input type="radio" className="form-check-input bg-primary border-0" id={s.id} name="shipping" value={s.val} defaultChecked={s.val === 'free'} />
                              <label className="form-check-label" htmlFor={s.id}>{s.label}</label>
                            </div>
                          ))}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3}></td>
                        <td className="py-4"><p className="mb-0 text-dark text-uppercase py-3">TOTAL</p></td>
                        <td className="py-4"><div className="py-3 border-bottom border-top"><p className="mb-0 text-dark">${subtotal}.00</p></div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Payment methods */}
                {[
                  { id: 'transfer', label: 'Direct Bank Transfer', desc: 'Make your payment directly into our bank account. Please use your Order ID as the payment reference.' },
                  { id: 'check', label: 'Check Payments', desc: '' },
                  { id: 'cod', label: 'Cash On Delivery', desc: '' },
                  { id: 'paypal', label: 'PayPal', desc: '' },
                ].map(pm => (
                  <div key={pm.id} className={`row g-4 text-center align-items-center justify-content-center ${pm.id !== 'paypal' ? 'border-bottom' : ''} py-3`}>
                    <div className="col-12">
                      <div className="form-check text-start my-3">
                        <input type="radio" className="form-check-input bg-primary border-0" id={pm.id} name="payment"
                          checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
                        <label className="form-check-label" htmlFor={pm.id}>{pm.label}</label>
                      </div>
                      {pm.desc && paymentMethod === pm.id && <p className="text-start text-dark small">{pm.desc}</p>}
                    </div>
                  </div>
                ))}

                <div className="row g-4 text-center align-items-center justify-content-center pt-4">
                  <button type="submit" className="btn border-secondary py-3 px-4 text-uppercase w-100 text-primary">
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
