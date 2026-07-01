import { useMemo } from 'react'

const mockOrders = [
  { id: 148, customer: 'Lucie', address: '16 rue des Fleurs', status: 'Prête à livrer' },
  { id: 149, customer: 'Thierry', address: '24 avenue Victor Hugo', status: 'En cours' },
  { id: 150, customer: 'Mariam', address: 'Livraison terminée' },
]

export function DriverOrdersPage() {
  const orders = useMemo(() => mockOrders, [])

  return (
    <section className="driver-card">
      <div className="driver-card-header">
        <h3>Mes livraisons</h3>
        <p>Suivez l’état des commandes qui vous sont assignées.</p>
      </div>

      <div className="driver-table-wrap">
        <table className="driver-table">
          <thead>
            <tr>
              <th>Commande</th>
              <th>Client</th>
              <th>Adresse</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.address}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
