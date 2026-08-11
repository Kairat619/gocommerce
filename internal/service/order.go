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

type OrderService struct {
	queries  *db.Queries
	cart     *CartService
	settings *SettingsService
}

func NewOrderService(queries *db.Queries, cart *CartService, settings *SettingsService) *OrderService {
	return &OrderService{queries: queries, cart: cart, settings: settings}
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

	subtotal := cart.TotalPrice
	tax := subtotal * settings.TaxRate
	shipping := settings.ShippingCost
	if subtotal >= settings.FreeShippingThreshold {
		shipping = 0
	}
	total := subtotal + tax + shipping

	notes := pgtype.Text{String: input.Notes, Valid: input.Notes != ""}

	order, err := s.queries.CreateOrder(ctx, db.CreateOrderParams{
		UserID:             userUUID,
		Status:             db.OrderStatusPending,
		Total:              floatToNumeric(total),
		Subtotal:           floatToNumeric(subtotal),
		Tax:                floatToNumeric(tax),
		ShippingCost:       floatToNumeric(shipping),
		Discount:           floatToNumeric(0),
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

	s.cart.Clear(sess)

	orderID := fmt.Sprintf("%x", order.ID.Bytes)
	return &OrderResult{
		OrderID: orderID,
		Total:   total,
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
