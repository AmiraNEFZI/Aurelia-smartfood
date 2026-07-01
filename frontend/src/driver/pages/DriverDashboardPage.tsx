export function DriverDashboardPage() {
  return (
    <section className="driver-card">
      <div className="driver-card-header">
        <h3>Résumé du livreur</h3>
        <p>Statut en ligne, commandes à récupérer et livraisons en cours.</p>
      </div>

      <div className="driver-grid">
        <div className="driver-stat">
          <span className="driver-stat-label">Commandes assignées</span>
          <strong>8</strong>
        </div>
        <div className="driver-stat">
          <span className="driver-stat-label">En cours</span>
          <strong>3</strong>
        </div>
        <div className="driver-stat">
          <span className="driver-stat-label">Livrées aujourd’hui</span>
          <strong>5</strong>
        </div>
      </div>

      <div className="driver-panel">
        <h4>Actions rapides</h4>
        <ul>
          <li>Activer / désactiver mon statut de livraison</li>
          <li>Voir les détails de chaque commande</li>
          <li>Marquer une livraison comme complète</li>
        </ul>
      </div>
    </section>
  )
}
