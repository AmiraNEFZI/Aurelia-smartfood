package com.aurelia.backend.enums;

/**
 * Statuts de disponibilité d'un livreur.
 *
 * DISPONIBLE   → Prêt, peut recevoir des commandes (sera assigné en priorité FIFO).
 * OCCUPE       → En cours de livraison, ne peut pas recevoir de nouvelle commande.
 * HORS_LIGNE   → Déconnecté ou non disponible.
 *
 * @deprecated EN_LIGNE est conservé uniquement pour la rétrocompatibilité BD.
 *             Il est automatiquement remplacé par DISPONIBLE au démarrage via DataInitializer.
 *             Ne plus utiliser EN_LIGNE dans le code applicatif.
 */
public enum StatutLivreur {
    DISPONIBLE,
    OCCUPE,
    HORS_LIGNE,

    /**
     * @deprecated Remplacé par DISPONIBLE. Conservé uniquement pour compatibilité BD.
     * Le DataInitializer migre automatiquement EN_LIGNE → DISPONIBLE au démarrage.
     */
    @Deprecated(since = "2.0", forRemoval = false)
    EN_LIGNE
}
