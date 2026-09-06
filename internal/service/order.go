package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/big"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"

	"gocommerce/internal/db"
	"gocommerce/internal/session"
)

var (
	ErrCartEmpty         = errors.New("cart is empty")
	ErrInsufficientStock = errors.New("insufficient stock")
)

const (
	TaxRate               = 0.08
	ShippingCost          = 9.99
	FreeShippingThreshold = 100.00
)

type CheckoutInput struct {
	ShippingName       string
	ShippingAddress    string
	ShippingCity       string
	ShippingState      string
	ShippingPostalCode string
	ShippingCountry    string
	BillingName        string
	BillingAddress     string
	BillingCity        string
	BillingState       string
	BillingPostalCode  string
	BillingCountry     string
	Notes              string
}

type OrderResult struct {
	OrderID string
	Total   float64
}

// Totals is the checkout arithmetic in one place. CreateOrder charges these
// numbers and the checkout page displays them, so the two cannot disagree.
type Totals struct {
	Subtotal float64 `json:"subtotal"`
	Discount float64 `json:"discount"`
	Tax      float64 `json:"tax"`
	Shipping float64 `json:"shipping"`
	Total    float64 `json:"total"`
}

// ComputeTotals applies the discount to the subtotal first, then charges tax on
// what the customer actually pays for goods, then shipping. A free-shipping
// coupon zeroes the shipping line; the free-shipping threshold is measured
// against the discounted subtotal.
//
// With no coupon, discount is 0 and freeShipping is false, which reproduces the
// arithmetic this function replaced exactly.
func ComputeTotals(settings StoreSettings, subtotal, discount float64, freeShipping bool) Totals {
	if discount > subtotal {
		discount = subtotal
	}
	if discount < 0 {
		discount = 0
	}

	discounted := subtotal - discount
	tax := discounted * settings.TaxRate

	shipping := settings.ShippingCost
	if freeShipping || discounted >= settings.FreeShippingThreshold {
		shipping = 0
	}

	return Totals{
		Subtotal: round2(subtotal),
		Discount: round2(discount),
		Tax:      round2(tax),
		Shipping: round2(shipping),
		Total:    round2(discounted + tax + shipping),
	}
}

func round2(f float64) float64 {
	return math.Round(f*100) / 100
}

type OrderService struct {
	queries  *db.Queries
	cart     *CartService
	settings *SettingsService
	coupons  *CouponService
}

func NewOrderService(queries *db.Queries, cart *CartService, settings *SettingsService, coupons *CouponService) *OrderService {
	return &OrderService{queries: queries, cart: cart, settings: settings, coupons: coupons}
}

func (s *OrderService) GetCart(sess *session.Session) *Cart {
	return s.cart.Get(sess)
}

func (s *OrderService) ValidateCheckout(sess *session.Session) error {
	cart := s.cart.Get(sess)
	if len(cart.Items) == 0 {
		return ErrCartEmpty
	}

	for _, item := range cart.Items {
		productID, err := parseUUID(item.ProductID)
		if err != nil {
			return fmt.Errorf("invalid product ID: %w", err)
		}

		product, err := s.queries.GetProductByID(context.Background(), productID)
		if err != nil {
			return fmt.Errorf("product not found: %s", item.Name)
		}

		if product.StockQuantity < int32(item.Quantity) {
			return fmt.Errorf("%w: %s (only %d available)", ErrInsufficientStock, item.Name, product.StockQuantity)
		}
	}

	return nil
}

func (s *OrderService) CreateOrder(ctx context.Context, sess *session.Session, input CheckoutInput) (*OrderResult, error) {
	cart := s.cart.Get(sess)
	if len(cart.Items) == 0 {
		return nil, ErrCartEmpty
	}

	userID, ok := sess.Get("user_id")
	if !ok {
		return nil, errors.New("user not authenticated")
	}

	userUUID, err := parseUUID(fmt.Sprintf("%v", userID))
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	settings := s.settings.Get(ctx)

	// Re-evaluated here rather than trusted from the session or the client, so
	// the amount charged is the amount the coupon is worth at this instant.
	userIDStr := fmt.Sprintf("%x", userUUID.Bytes)
	applied := s.coupons.ForSession(ctx, sess, cart, userIDStr)

	discount := 0.0
	freeShipping := false
	couponCode := pgtype.Text{Valid: false}
	if applied != nil {
		discount = applied.DiscountAmount
		freeShipping = applied.FreeShipping
		couponCode = pgtype.Text{String: applied.Code, Valid: true}
	}

	totals := ComputeTotals(settings, cart.TotalPrice, discount, freeShipping)

	notes := pgtype.Text{String: input.Notes, Valid: input.Notes != ""}

	order, err := s.queries.CreateOrder(ctx, db.CreateOrderParams{
		UserID:             userUUID,
		Status:             db.OrderStatusPending,
		Total:              floatToNumeric(totals.Total),
		Subtotal:           floatToNumeric(totals.Subtotal),
		Tax:                floatToNumeric(totals.Tax),
		ShippingCost:       floatToNumeric(totals.Shipping),
		Discount:           floatToNumeric(totals.Discount),
		CouponCode:         couponCode,
		Notes:              notes,
		ShippingName:       input.ShippingName,
		ShippingAddress:    input.ShippingAddress,
		ShippingCity:       input.ShippingCity,
		ShippingState:      pgtype.Text{String: input.ShippingState, Valid: input.ShippingState != ""},
		ShippingPostalCode: input.ShippingPostalCode,
		ShippingCountry:    input.ShippingCountry,
		BillingName:        pgtype.Text{String: input.BillingName, Valid: input.BillingName != ""},
		BillingAddress:     pgtype.Text{String: input.BillingAddress, Valid: input.BillingAddress != ""},
		BillingCity:        pgtype.Text{String: input.BillingCity, Valid: input.BillingCity != ""},
		BillingState:       pgtype.Text{String: input.BillingState, Valid: input.BillingState != ""},
		BillingPostalCode:  pgtype.Text{String: input.BillingPostalCode, Valid: input.BillingPostalCode != ""},
		BillingCountry:     pgtype.Text{String: input.BillingCountry, Valid: input.BillingCountry != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// The order's first entry in its audit trail. Deliberately fire-and-forget,
	// exactly like RecordRedemption below: a placed order is a financial fact,
	// and failing to write its history entry must never unwind it or fail the
	// customer's checkout. The actor is left NULL because this is the customer
	// checking out, not a member of staff acting on the order.
	_, _ = s.queries.CreateOrderActivity(ctx, db.CreateOrderActivityParams{
		OrderID: order.ID,
		Kind:    "created",
		Message: "Order placed at checkout.",
	})

	for _, item := range cart.Items {
		productID, err := parseUUID(item.ProductID)
		if err != nil {
			continue
		}

		itemTotal := float64(item.Quantity) * item.Price

		variantName := pgtype.Text{Valid: false}
		variantID := pgtype.UUID{Valid: false}

		_, err = s.queries.CreateOrderItem(ctx, db.CreateOrderItemParams{
			OrderID:     order.ID,
			ProductID:   productID,
			VariantID:   variantID,
			ProductName: item.Name,
			VariantName: variantName,
			Quantity:    int32(item.Quantity),
			UnitPrice:   floatToNumeric(item.Price),
			Total:       floatToNumeric(itemTotal),
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create order item: %w", err)
		}

		product, err := s.queries.GetProductByID(ctx, productID)
		if err == nil {
			newStock := product.StockQuantity - int32(item.Quantity)
			if newStock < 0 {
				newStock = 0
			}
			_ = s.queries.UpdateProductStock(ctx, db.UpdateProductStockParams{
				ID:            productID,
				StockQuantity: newStock,
			})
		}
	}

	orderID := fmt.Sprintf("%x", order.ID.Bytes)

	// Booked only once the order exists, so an abandoned checkout never burns a
	// redemption. A failure here must not undo a placed order, so it is logged
	// by the caller's error path rather than returned.
	if applied != nil {
		_ = s.coupons.RecordRedemption(ctx, applied.CouponID, userIDStr, orderID, totals.Discount)
	}

	s.cart.Clear(sess)
	s.coupons.Clear(sess)

	return &OrderResult{
		OrderID: orderID,
		Total:   totals.Total,
	}, nil
}

func (s *OrderService) GetOrderByID(ctx context.Context, orderID string, userID string) (*db.GetOrderByIDRow, []db.GetOrderItemsByOrderIDRow, error) {
	orderUUID, err := parseUUID(orderID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid order ID: %w", err)
	}

	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid user ID: %w", err)
	}

	order, err := s.queries.GetOrderByID(ctx, orderUUID)
	if err != nil {
		return nil, nil, fmt.Errorf("order not found: %w", err)
	}

	if fmt.Sprintf("%x", order.UserID.Bytes) != fmt.Sprintf("%x", userUUID.Bytes) {
		return nil, nil, errors.New("unauthorized")
	}

	items, err := s.queries.GetOrderItemsByOrderID(ctx, orderUUID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch order items: %w", err)
	}

	return &order, items, nil
}

func (s *OrderService) ListOrdersByUser(ctx context.Context, userID string, page, perPage int) ([]db.Order, int64, error) {
	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid user ID: %w", err)
	}

	offset := int32((page - 1) * perPage)
	orders, err := s.queries.ListOrdersByUser(ctx, db.ListOrdersByUserParams{
		UserID: userUUID,
		Limit:  int32(perPage),
		Offset: offset,
	})
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list orders: %w", err)
	}

	count, err := s.queries.CountOrdersByUser(ctx, userUUID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count orders: %w", err)
	}

	return orders, count, nil
}

func (s *OrderService) GetUserAddresses(ctx context.Context, userID string) ([]db.Address, error) {
	userUUID, err := parseUUID(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	addresses, err := s.queries.ListAddressesByUser(ctx, userUUID)
	if err != nil {
		return nil, fmt.Errorf("failed to list addresses: %w", err)
	}

	return addresses, nil
}

func (s *OrderService) UpdateProfile(ctx context.Context, userID, name, email string) error {
	userUUID, err := parseUUID(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	_, err = s.queries.UpdateUser(ctx, db.UpdateUserParams{
		ID:    userUUID,
		Name:  name,
		Email: email,
	})
	return err
}

func parseUUID(s string) (pgtype.UUID, error) {
	var uuid pgtype.UUID
	s = strings.ReplaceAll(s, "-", "")
	if len(s) != 32 {
		return uuid, errors.New("invalid UUID format")
	}
	err := uuid.Scan(s)
	return uuid, err
}

func floatToNumeric(f float64) pgtype.Numeric {
	cents := int64(math.Round(f * 100))
	return pgtype.Numeric{
		Int:   big.NewInt(cents),
		Exp:   -2,
		Valid: true,
	}
}
