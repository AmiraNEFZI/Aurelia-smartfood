package com.aurelia.backend.service;

import com.aurelia.backend.dto.request.ProductRequest;
import com.aurelia.backend.dto.response.ProductResponse;
import com.aurelia.backend.entity.CartItem;
import com.aurelia.backend.entity.OrderItem;
import com.aurelia.backend.entity.Product;
import com.aurelia.backend.exception.ResourceNotFoundException;
import com.aurelia.backend.repository.CartItemRepository;
import com.aurelia.backend.repository.OrderItemRepository;
import com.aurelia.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));
        return toResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .image(request.getImage())
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImage(request.getImage());
        return toResponse(productRepository.save(product));
    }

    /**
     * Suppression d'un produit :
     * 1. Nullifier product_id dans order_items (on garde les snapshots productName/unitPrice)
     * 2. Supprimer les cart_items qui référencent ce produit
     * 3. Supprimer le produit
     */
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produit introuvable : " + id));

        // 1. Nullifier la référence dans order_items (les commandes gardent leur snapshot)
        List<OrderItem> orderItems = orderItemRepository.findByProductId(id);
        for (OrderItem item : orderItems) {
            item.setProduct(null);
        }
        orderItemRepository.saveAll(orderItems);

        // 2. Supprimer les cart_items liés (panier = pas de snapshot nécessaire)
        List<CartItem> cartItems = cartItemRepository.findByProductId(id);
        cartItemRepository.deleteAll(cartItems);

        // 3. Supprimer le produit
        productRepository.delete(product);
    }

    public ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .image(product.getImage())
                .build();
    }
}
