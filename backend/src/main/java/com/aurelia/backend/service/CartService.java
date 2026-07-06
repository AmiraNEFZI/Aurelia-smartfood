package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.AddCartItemRequest;
import com.aurelia.backend.dto.response.CartItemResponse;
import com.aurelia.backend.dto.response.CartResponse;
import com.aurelia.backend.entity.Cart;
import com.aurelia.backend.entity.CartItem;
import com.aurelia.backend.entity.Product;
import com.aurelia.backend.entity.User;
import com.aurelia.backend.exception.BusinessException;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.CartItemRepository;
import com.aurelia.backend.repository.CartRepository;
import com.aurelia.backend.repository.ProductRepository;
import com.aurelia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    @Lazy
    private final PartnerService partnerService;

    /**
     * Récupérer le panier du client connecté.
     */
    public CartResponse getCart(String email) {
        Cart cart = getCartByEmail(email);
        return toResponse(cart);
    }

    /**
     * Ajouter un produit au panier.
     * Si le produit est déjà dans le panier → incrémenter la quantité.
     */
    @Transactional
    public CartResponse addItem(String email, AddCartItemRequest request) {
        Cart cart = getCartByEmail(email);

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Produit introuvable : " + request.getProductId()));

        if (product.getStock() < request.getQuantity()) {
            // Vérifier si un partenaire peut fournir ce produit
            boolean partnerAvailable = partnerService.isProductAvailableAnywhere(product.getId());
            if (!partnerAvailable) {
                throw new BusinessException("Stock insuffisant pour le produit : " + product.getName());
            }
            // Partenaire disponible → on autorise l'ajout au panier
        }

        Optional<CartItem> existingItem =
                cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            // Vérifier stock total disponible (Aurelia + partenaire)
            int totalStock = product.getStock() + partnerService.getBestPartnerStock(product.getId());
            if (totalStock < newQty) {
                throw new BusinessException("Stock insuffisant pour le produit : " + product.getName());
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        cartRepository.save(cart);
        return toResponse(cartRepository.findById(cart.getId()).orElseThrow());
    }

    /**
     * Modifier la quantité d'un article du panier.
     */
    @Transactional
    public CartResponse updateItemQuantity(String email, Long itemId, int quantity) {
        Cart cart = getCartByEmail(email);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Article introuvable dans le panier."));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            if (item.getProduct() != null && item.getProduct().getStock() < quantity) {
                throw new BusinessException("Stock insuffisant.");
            }
            item.setQuantity(quantity);
        }

        return toResponse(cartRepository.save(cart));
    }

    /**
     * Supprimer un article du panier.
     */
    @Transactional
    public CartResponse removeItem(String email, Long itemId) {
        Cart cart = getCartByEmail(email);
        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        return toResponse(cartRepository.save(cart));
    }

    /**
     * Vider complètement le panier (utilisé après checkout).
     */
    @Transactional
    public void clearCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("Panier introuvable."));
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Cart getCartByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        return cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Panier introuvable."));
    }

    public CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        BigDecimal total = items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .total(total)
                .itemCount(items.size())
                .build();
    }

    private CartItemResponse toItemResponse(CartItem item) {
        // Sécurité : si le produit a été supprimé entre temps
        if (item.getProduct() == null) {
            return CartItemResponse.builder()
                    .id(item.getId())
                    .productId(null)
                    .productName("Produit supprimé")
                    .productImage(null)
                    .unitPrice(BigDecimal.ZERO)
                    .quantity(item.getQuantity())
                    .subtotal(BigDecimal.ZERO)
                    .build();
        }
        BigDecimal subtotal = item.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));
        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productImage(item.getProduct().getImage())
                .unitPrice(item.getProduct().getPrice())
                .quantity(item.getQuantity())
                .subtotal(subtotal)
                .build();
    }
}
