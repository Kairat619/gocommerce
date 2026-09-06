package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"gocommerce/internal/db"
	"gocommerce/internal/session"
)

// couponSessionKey stores only the applied code, never the computed discount.
// The coupon is re-evaluated from the database on every render, so a coupon
// that expires, is disabled, or runs out of uses while it sits in a session
// stops discounting immediately instead of honouring a stale amount.
const couponSessionKey = "coupon_code"

// Discount types. These are the values stored in coupons.discount_type and are
// constrained by a CHECK in the schema.
const (
	DiscountTypePercentage   = "percentage"
	DiscountTypeFixed        = "fixed"
	DiscountTypeFreeShipping = "free_shipping"
)

// Rejection reasons. Each is user-facing: the storefront shows the message as
// it is, so a shopper always learns why a code did not apply.
var (
	ErrCouponNotFound     = errors.New("that coupon code is not valid")
	ErrCouponInactive     = errors.New("that coupon is no longer available")
	ErrCouponNotStarted   = errors.New("that coupon is not active yet")
	ErrCouponExpired      = errors.New("that coupon has expired")
	ErrCouponUsedUp       = errors.New("that coupon has reached its usage limit")
	ErrCouponCustomerUsed = errors.New("you have already used that coupon")
	ErrCouponMinAmount    = errors.New("your order does not meet this coupon's minimum")
	ErrCouponMinQuantity  = errors.New("your order does not have enough items for this coupon")
	ErrCouponLoginNeeded  = errors.New("please sign in to use a coupon")
)

// AppliedCoupon is the outcome of evaluating a coupon against a cart. It is the
// only thing the rest of the application is allowed to base a discount on.
type AppliedCoupon struct {
	CouponID     string `json:"coupon_id"`
	Code         string `json:"code"`
	Description  string `json:"description"`
	DiscountType string `json:"discount_type"`
	// Amount taken off the subtotal. Always 0 for a free-shipping coupon.
	DiscountAmount float64 `json:"discount_amount"`
	FreeShipping   bool    `json:"free_shipping"`
}

type CouponService struct {
	queries *db.Queries
}

func NewCouponService(queries *db.Queries) *CouponService {
	return &CouponService{queries: queries}
}

// NormalizeCode is the single definition of what a coupon code looks like once
// stored. The admin form, the storefront and the uniqueness check all go
// through it, so "welcome10", " WELCOME10 " and "WELCOME10" are one coupon.
func NormalizeCode(code string) string {
	return strings.ToUpper(strings.TrimSpace(code))
}

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

// AppliedCode returns the coupon code held in the session, if any.
func (s *CouponService) AppliedCode(sess *session.Session) string {
	if sess == nil {
		return ""
	}
	value, ok := sess.Get(couponSessionKey)
	if !ok {
		return ""
	}
	code, ok := value.(string)
	if !ok {
		return ""
	}
	return code
}

// Store records an accepted coupon code on the session.
func (s *CouponService) Store(sess *session.Session, code string) {
	if sess == nil {
		return
	}
	sess.Set(couponSessionKey, NormalizeCode(code))
}

// Clear removes any applied coupon from the session.
func (s *CouponService) Clear(sess *session.Session) {
	if sess == nil {
		return
	}
	sess.Set(couponSessionKey, "")
}

// ForSession evaluates whatever coupon the session holds against the current
// cart. A coupon that has stopped qualifying — the cart dropped below the
// minimum, the coupon expired — returns nil with no error, so the caller can
// render the page without a discount rather than failing the request.
func (s *CouponService) ForSession(ctx context.Context, sess *session.Session, cart *Cart, userID string) *AppliedCoupon {
	code := s.AppliedCode(sess)
	if code == "" {
		return nil
	}

	applied, err := s.Evaluate(ctx, code, cart, userID)
	if err != nil {
		return nil
	}
	return applied
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

// Evaluate is the authoritative check. Every route that shows or charges a
// discount calls it; nothing else is allowed to decide whether a coupon
// applies or what it is worth.
func (s *CouponService) Evaluate(ctx context.Context, code string, cart *Cart, userID string) (*AppliedCoupon, error) {
	normalized := NormalizeCode(code)
	if normalized == "" {
		return nil, ErrCouponNotFound
	}

	coupon, err := s.queries.GetCouponByCode(ctx, normalized)
	if err != nil {
		return nil, ErrCouponNotFound
	}

	if !coupon.IsActive {
		return nil, ErrCouponInactive
	}

	now := time.Now()
	if coupon.StartsAt.Valid && now.Before(coupon.StartsAt.Time) {
		return nil, ErrCouponNotStarted
	}
	if coupon.EndsAt.Valid && !now.Before(coupon.EndsAt.Time) {
		return nil, ErrCouponExpired
	}

	if coupon.MaxUses.Valid && coupon.UsedCount >= coupon.MaxUses.Int32 {
		return nil, ErrCouponUsedUp
	}

	// A per-customer limit can only be enforced against a known customer, so
	// such a coupon is refused to guests rather than silently granted.
	if coupon.MaxUsesPerCustomer.Valid {
		if userID == "" {
			return nil, ErrCouponLoginNeeded
		}

		userUUID, err := parseUUID(userID)
		if err != nil {
			return nil, ErrCouponLoginNeeded
		}

		used, err := s.queries.CountCouponRedemptionsByUser(ctx, db.CountCouponRedemptionsByUserParams{
			CouponID: coupon.ID,
			UserID:   userUUID,
		})
		if err != nil {
			return nil, ErrCouponNotFound
		}
		if used >= int64(coupon.MaxUsesPerCustomer.Int32) {
			return nil, ErrCouponCustomerUsed
		}
	}

	subtotal := 0.0
	quantity := 0
	if cart != nil {
		subtotal = cart.TotalPrice
		quantity = cart.TotalItems
	}

	minAmount := numericToFloat(coupon.MinOrderAmount)
	if minAmount > 0 && subtotal < minAmount {
		return nil, fmt.Errorf("%w of %.2f", ErrCouponMinAmount, minAmount)
	}

	if coupon.MinOrderQuantity > 0 && quantity < int(coupon.MinOrderQuantity) {
		return nil, fmt.Errorf("%w (%d needed)", ErrCouponMinQuantity, coupon.MinOrderQuantity)
	}

	return &AppliedCoupon{
		CouponID:       fmt.Sprintf("%x", coupon.ID.Bytes),
		Code:           coupon.Code,
		Description:    coupon.Description,
		DiscountType:   coupon.DiscountType,
		DiscountAmount: discountFor(coupon, subtotal),
		FreeShipping:   coupon.DiscountType == DiscountTypeFreeShipping,
	}, nil
}

// discountFor turns a coupon and a subtotal into money off. It never returns
// more than the subtotal, so a discount can not push an order below zero.
func discountFor(coupon db.Coupon, subtotal float64) float64 {
	value := numericToFloat(coupon.DiscountValue)

	var amount float64
	switch coupon.DiscountType {
	case DiscountTypePercentage:
		amount = subtotal * value / 100
		if cap := numericToFloat(coupon.MaxDiscountAmount); coupon.MaxDiscountAmount.Valid && cap > 0 && amount > cap {
			amount = cap
		}
	case DiscountTypeFixed:
		amount = value
	case DiscountTypeFreeShipping:
		return 0
	}

	if amount > subtotal {
		amount = subtotal
	}
	if amount < 0 {
		return 0
	}
	return round2(amount)
}

// ---------------------------------------------------------------------------
// Redemption
// ---------------------------------------------------------------------------

// RecordRedemption books a use of a coupon against an order. It runs after the
// order exists so a failed checkout never consumes a coupon.
func (s *CouponService) RecordRedemption(ctx context.Context, couponID, userID, orderID string, amount float64) error {
	couponUUID, err := parseUUID(couponID)
	if err != nil {
		return err
	}
	userUUID, err := parseUUID(userID)
	if err != nil {
		return err
	}

	orderUUID := pgtype.UUID{Valid: false}
	if parsed, err := parseUUID(orderID); err == nil {
		orderUUID = parsed
	}

	if _, err := s.queries.CreateCouponRedemption(ctx, db.CreateCouponRedemptionParams{
		CouponID:       couponUUID,
		UserID:         userUUID,
		OrderID:        orderUUID,
		DiscountAmount: floatToNumeric(amount),
	}); err != nil {
		return err
	}

	return s.queries.IncrementCouponUsedCount(ctx, couponUUID)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func numericToFloat(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	v, err := n.Float64Value()
	if err != nil || !v.Valid {
		return 0
	}
	return v.Float64
}
