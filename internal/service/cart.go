package service

import (
	"encoding/json"
	"fmt"

	"gocommerce/internal/session"
)

const cartSessionKey = "cart"

// CartItem represents a single item in the shopping cart.
type CartItem struct {
	ProductID string  `json:"product_id"`
	Name      string  `json:"name"`
	Slug      string  `json:"slug"`
	Price     float64 `json:"price"`
	Quantity  int     `json:"quantity"`
	ImageURL  string  `json:"image_url"`
	SKU       string  `json:"sku"`
}

// Cart represents the shopping cart.
type Cart struct {
	Items      []CartItem `json:"items"`
	TotalItems int        `json:"total_items"`
	TotalPrice float64    `json:"total_price"`
}

// CartService handles cart operations.
type CartService struct{}

// NewCartService creates a new cart service.
func NewCartService() *CartService {
	return &CartService{}
}

// Get retrieves the cart from the session.
func (s *CartService) Get(sess *session.Session) *Cart {
	if sess == nil {
		return &Cart{}
	}

	cartData, ok := sess.Get(cartSessionKey)
	if !ok {
		return &Cart{}
	}

	cartJSON, ok := cartData.(string)
	if !ok {
		return &Cart{}
	}

	var cart Cart
	if err := json.Unmarshal([]byte(cartJSON), &cart); err != nil {
		return &Cart{}
	}

	return &cart
}

// Save saves the cart to the session.
func (s *CartService) Save(sess *session.Session, cart *Cart) error {
	if sess == nil {
		return fmt.Errorf("session is nil")
	}

	cartJSON, err := json.Marshal(cart)
	if err != nil {
		return err
	}

	sess.Set(cartSessionKey, string(cartJSON))
	return nil
}

// AddItem adds a product to the cart.
func (s *CartService) AddItem(sess *session.Session, item CartItem) error {
	cart := s.Get(sess)

	// Check if item already exists
	for i, existing := range cart.Items {
		if existing.ProductID == item.ProductID {
			cart.Items[i].Quantity += item.Quantity
			s.updateTotals(cart)
			return s.Save(sess, cart)
		}
	}

	// Add new item
	cart.Items = append(cart.Items, item)
	s.updateTotals(cart)
	return s.Save(sess, cart)
}

// UpdateItem updates the quantity of an item in the cart.
func (s *CartService) UpdateItem(sess *session.Session, productID string, quantity int) error {
	cart := s.Get(sess)

	if quantity <= 0 {
		return s.RemoveItem(sess, productID)
	}

	for i, item := range cart.Items {
		if item.ProductID == productID {
			cart.Items[i].Quantity = quantity
			s.updateTotals(cart)
			return s.Save(sess, cart)
		}
	}

	return fmt.Errorf("item not found in cart")
}

// RemoveItem removes an item from the cart.
func (s *CartService) RemoveItem(sess *session.Session, productID string) error {
	cart := s.Get(sess)

	for i, item := range cart.Items {
		if item.ProductID == productID {
			cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			s.updateTotals(cart)
			return s.Save(sess, cart)
		}
	}

	return fmt.Errorf("item not found in cart")
}

// Clear clears the entire cart.
func (s *CartService) Clear(sess *session.Session) error {
	return s.Save(sess, &Cart{})
}

// GetItemCount returns the total number of items in the cart.
func (s *CartService) GetItemCount(sess *session.Session) int {
	cart := s.Get(sess)
	return cart.TotalItems
}

func (s *CartService) updateTotals(cart *Cart) {
	cart.TotalItems = 0
	cart.TotalPrice = 0

	for _, item := range cart.Items {
		cart.TotalItems += item.Quantity
		cart.TotalPrice += float64(item.Quantity) * item.Price
	}
}
