package handler

import (
	"context"
	"fmt"
	"math"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	inertia "github.com/mayahiro/go-inertia"

	"gocommerce/internal/db"
	"gocommerce/internal/service"
)

// ---------------------------------------------------------------------------
// The dashboard
//
// This is the only admin screen that asks about the whole store at once, and
// it is the screen a merchant reads before doing anything else. Three rules
// shape everything below.
//
// 1. The database does the arithmetic. Every number here arrives already
//    aggregated from sql/queries/analytics.sql. Nothing sums, averages or
//    re-derives money in Go, and nothing does it in React either. The revenue
//    on this page is the same SUM(total) WHERE status <> 'cancelled' that the
//    orders page, the customer lifetime-value card and GetOrderSummary have
//    always used.
//
// 2. One slow or broken section must not take the page down. The sections run
//    concurrently and each records its own error; a section that fails sends
//    nil and names itself in `section_errors`, and the other eleven still
//    render. The old handler swallowed every error into a zero value, which is
//    worse than an error — it showed the merchant a confident $0.00.
//
// 3. Nothing is displayed that the data cannot support. There is no profit or
//    margin here, because order_items never captured cost at the time of sale
//    and computing it from today's cost_price would re-price history. There is
//    no payment or refund metric, because the schema has neither. There is no
//    collection performance, because nothing records a collection view.
// ---------------------------------------------------------------------------

const (
	// How many rows each list section shows. Small on purpose: the dashboard
	// points at the management pages, it does not replace them.
	dashboardListLimit     = 5
	dashboardActivityLimit = 8
	dashboardAlertLimit    = 6

	// An open order older than this is called out as stalled. It is a
	// presentation threshold over recorded timestamps, not a claim about
	// payment or delivery — the store records neither.
	dashboardStalledAfterDays = 3
)

type AdminDashboardHandler struct {
	renderer *inertia.Renderer
	queries  *db.Queries
	settings *service.SettingsService
}

func NewAdminDashboardHandler(renderer *inertia.Renderer, queries *db.Queries, settings *service.SettingsService) *AdminDashboardHandler {
	return &AdminDashboardHandler{renderer: renderer, queries: queries, settings: settings}
}

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

// dashboardRanges are the presets the period selector offers, in display order.
//
// The first four are the same keys the orders list uses, and they resolve
// through the same dateRanges map in admin_orders.go — so "Today" on the
// dashboard and "Today" on the orders list are the same window, in the same
// timezone, to the microsecond. That is the whole reason they are not
// redefined here.
var dashboardRanges = []struct{ Value, Label string }{
	{"today", "Today"},
	{"yesterday", "Yesterday"},
	{"7d", "Last 7 days"},
	{"30d", "Last 30 days"},
	{"month", "This month"},
	{"last_month", "Last month"},
	{"year", "This year"},
	{"custom", "Custom range"},
}

const defaultDashboardRange = "30d"

// dashboardPeriod is a resolved window plus the window it is compared against.
type dashboardPeriod struct {
	Key   string
	Label string

	// The window itself, half-open: [From, To).
	From time.Time
	To   time.Time

	// The equivalent earlier window, also half-open. Its length always equals
	// the *elapsed* length of this one — see resolveDashboardPeriod.
	PrevFrom time.Time
	PrevTo   time.Time

	// What the comparison is called in the UI, e.g. "vs previous 30 days".
	ComparisonLabel string

	// True when To is still in the future, i.e. the period has not finished.
	InProgress bool

	// date_trunc unit for the sales chart: hour, day, week or month.
	Bucket string

	// Echoed back so a custom range survives the round trip and the form stays
	// populated, exactly as the orders list echoes its filters.
	CustomFrom string
	CustomTo   string
}

const dashboardDateLayout = "2006-01-02"

// resolveDashboardPeriod turns the query string into a window and its
// comparison window.
//
// COMPARISONS ARE LENGTH-MATCHED, ALWAYS.
//
// A period that has not finished yet is only partly elapsed, and comparing four
// hours of today against twenty-four hours of yesterday would manufacture a
// collapse in sales every morning. So the comparison window is always exactly
// as long as the *elapsed* part of the current one:
//
//	elapsed  = min(To, now) - From
//	previous = [previousStart, previousStart + elapsed)
//
// For "This month" on the 8th that means the 1st-to-8th of last month, not all
// of last month. For "Today" at 10am it means yesterday up to 10am. Completed
// periods (Yesterday, Last month) are fully elapsed, so they compare whole
// against whole and this reduces to the obvious thing.
//
// previousStart is the calendar predecessor for calendar ranges (the month
// before, the year before) and From minus the window's own length otherwise.
// Using a fixed 30 days to step back from a calendar month is exactly the
// mismatch that makes a dashboard's percentages untrustworthy.
func resolveDashboardPeriod(r *http.Request, now time.Time) dashboardPeriod {
	query := r.URL.Query()
	key := strings.TrimSpace(query.Get("range"))

	var (
		from, to  time.Time
		prevStart time.Time
		label     string
		compare   string
		customTo  string
		customFrm string
	)

	switch key {
	case "month":
		from = startOfMonth(now)
		to = from.AddDate(0, 1, 0)
		prevStart = from.AddDate(0, -1, 0)
		label, compare = "This month", "vs the same days last month"

	case "last_month":
		from = startOfMonth(now).AddDate(0, -1, 0)
		to = startOfMonth(now)
		prevStart = from.AddDate(0, -1, 0)
		label, compare = "Last month", "vs the month before"

	case "year":
		from = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		to = from.AddDate(1, 0, 0)
		prevStart = from.AddDate(-1, 0, 0)
		label, compare = "This year", "vs the same period last year"

	case "custom":
		start, end, ok := parseCustomRange(query.Get("from"), query.Get("to"), now)
		if !ok {
			// An unparseable custom range falls back to the default rather
			// than erroring: the merchant gets a working dashboard and a
			// selector they can correct.
			return resolveDashboardPeriod(withRange(r, defaultDashboardRange), now)
		}
		from, to = start, end
		prevStart = from.Add(-to.Sub(from))
		label = fmt.Sprintf("%s – %s", from.Format("Jan 2, 2006"), to.AddDate(0, 0, -1).Format("Jan 2, 2006"))
		compare = "vs the preceding period of equal length"
		customFrm = from.Format(dashboardDateLayout)
		customTo = to.AddDate(0, 0, -1).Format(dashboardDateLayout)

	default:
		// today / yesterday / 7d / 30d, resolved by the orders list's own map
		// so the two screens cannot drift apart.
		if key == "" {
			key = defaultDashboardRange
		}
		window, ok := dateRanges[key]
		if !ok {
			key = defaultDashboardRange
			window = dateRanges[key]
		}
		from, to = window(now)
		prevStart = from.Add(-to.Sub(from))

		switch key {
		case "today":
			label, compare = "Today", "vs yesterday at this time"
		case "yesterday":
			label, compare = "Yesterday", "vs the day before"
		case "7d":
			label, compare = "Last 7 days", "vs the previous 7 days"
		default:
			label, compare = "Last 30 days", "vs the previous 30 days"
		}
	}

	elapsedTo := to
	inProgress := false
	if now.Before(to) {
		elapsedTo = now
		inProgress = true
	}
	elapsed := elapsedTo.Sub(from)
	if elapsed < 0 {
		elapsed = 0
	}

	return dashboardPeriod{
		Key:             key,
		Label:           label,
		From:            from,
		To:              elapsedTo,
		PrevFrom:        prevStart,
		PrevTo:          prevStart.Add(elapsed),
		ComparisonLabel: compare,
		InProgress:      inProgress,
		Bucket:          chooseBucket(from, elapsedTo),
		CustomFrom:      customFrm,
		CustomTo:        customTo,
	}
}

func startOfMonth(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
}

// withRange rewrites the request's ?range= so the custom-range fallback can
// re-enter resolveDashboardPeriod without recursing forever.
func withRange(r *http.Request, key string) *http.Request {
	clone := r.Clone(r.Context())
	q := clone.URL.Query()
	q.Set("range", key)
	q.Del("from")
	q.Del("to")
	clone.URL.RawQuery = q.Encode()
	return clone
}

// parseCustomRange reads two YYYY-MM-DD dates in the server's timezone and
// returns a half-open window whose end is the start of the day *after* `to` —
// so a range of 3rd to 3rd is that whole day, which is what a merchant picking
// one date on a calendar means.
func parseCustomRange(rawFrom, rawTo string, now time.Time) (time.Time, time.Time, bool) {
	loc := now.Location()

	from, err := time.ParseInLocation(dashboardDateLayout, strings.TrimSpace(rawFrom), loc)
	if err != nil {
		return time.Time{}, time.Time{}, false
	}
	to, err := time.ParseInLocation(dashboardDateLayout, strings.TrimSpace(rawTo), loc)
	if err != nil {
		return time.Time{}, time.Time{}, false
	}
	if to.Before(from) {
		from, to = to, from
	}

	return startOfDay(from), startOfDay(to).AddDate(0, 0, 1), true
}

// chooseBucket picks the chart's granularity from the span, so a one-day view
// is not a single bar and a one-year view is not 365 of them.
//
// The returned value is interpolated into a Postgres interval by GetSalesSeries,
// so it must stay inside this closed set.
func chooseBucket(from, to time.Time) string {
	span := to.Sub(from)
	switch {
	case span <= 48*time.Hour:
		return "hour"
	case span <= 92*24*time.Hour:
		return "day"
	case span <= 400*24*time.Hour:
		return "week"
	default:
		return "month"
	}
}

// bucketLabel is the x-axis tick and the tooltip heading for one bucket.
func bucketLabel(t time.Time, bucket string) string {
	switch bucket {
	case "hour":
		return t.Format("15:04")
	case "month":
		return t.Format("Jan 2006")
	case "week":
		return "Week of " + t.Format("Jan 2")
	default:
		return t.Format("Jan 2")
	}
}

func stamp(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}

// ---------------------------------------------------------------------------
// Deltas
// ---------------------------------------------------------------------------

// metric is one KPI: what it is now, what it was over the comparison window,
// and the change between them.
//
// change is deliberately nil rather than 0 or 100 when the previous value was
// zero. There is no percentage change from nothing, and "+100%" against a
// zero baseline is the single most common way a dashboard lies. The UI shows
// "no prior data" instead.
type metric struct {
	Value    any
	Previous any
	Change   *float64
}

func (m metric) props() map[string]any {
	return map[string]any{
		"value":    m.Value,
		"previous": m.Previous,
		"change":   m.Change,
	}
}

func changePercent(current, previous float64) *float64 {
	if previous == 0 {
		return nil
	}
	change := (current - previous) / math.Abs(previous) * 100
	rounded := math.Round(change*10) / 10
	return &rounded
}

// moneyMetric pairs two money aggregates.
//
// numericFloat (shared with the coupon handler) is used only to compute the
// *percentage change* between two values the database already aggregated. No
// money total is ever produced from a float here — the displayed amounts stay
// as the strings formatNumeric returns, at the precision the database decided.
func moneyMetric(current, previous pgtype.Numeric) metric {
	return metric{
		Value:    formatNumeric(current),
		Previous: formatNumeric(previous),
		Change:   changePercent(numericFloat(current), numericFloat(previous)),
	}
}

func countMetric(current, previous int64) metric {
	return metric{
		Value:    current,
		Previous: previous,
		Change:   changePercent(float64(current), float64(previous)),
	}
}

// ---------------------------------------------------------------------------
// Section runner
// ---------------------------------------------------------------------------

// sections collects the results of the concurrent queries and the errors of
// whichever ones failed.
type sections struct {
	mu    sync.Mutex
	props inertia.Props
	errs  map[string]string
}

func newSections() *sections {
	return &sections{props: inertia.Props{}, errs: map[string]string{}}
}

// run executes one dashboard section. A section that returns an error sets its
// props to nil and records the failure under `name`; the page still renders,
// and that card shows a retry in place of a number. A section is never allowed
// to report zero when what it means is "I don't know".
func (s *sections) run(wg *sync.WaitGroup, name string, fn func() (inertia.Props, error)) {
	wg.Add(1)
	go func() {
		defer wg.Done()
		props, err := fn()

		s.mu.Lock()
		defer s.mu.Unlock()
		if err != nil {
			s.errs[name] = err.Error()
			return
		}
		for key, value := range props {
			s.props[key] = value
		}
	}()
}

// ---------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------

func (h *AdminDashboardHandler) Show() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		now := time.Now()
		period := resolveDashboardPeriod(r, now)

		window := db.GetSalesSummaryParams{From: stamp(period.From), To: stamp(period.To)}
		prior := db.GetSalesSummaryParams{From: stamp(period.PrevFrom), To: stamp(period.PrevTo)}

		s := newSections()
		var wg sync.WaitGroup

		// --- Section 1: executive KPIs -------------------------------------
		//
		// Current and comparison windows are fetched together because a KPI
		// card is meaningless without its delta: if one of the pair fails the
		// whole card must fail, not silently show a change against zero.
		s.run(&wg, "kpis", func() (inertia.Props, error) {
			current, err := h.queries.GetSalesSummary(ctx, window)
			if err != nil {
				return nil, err
			}
			previous, err := h.queries.GetSalesSummary(ctx, prior)
			if err != nil {
				return nil, err
			}

			newCustomers, err := h.queries.CountNewCustomersInRange(ctx, db.CountNewCustomersInRangeParams(window))
			if err != nil {
				return nil, err
			}
			prevCustomers, err := h.queries.CountNewCustomersInRange(ctx, db.CountNewCustomersInRangeParams(prior))
			if err != nil {
				return nil, err
			}

			return inertia.Props{
				"kpis": map[string]any{
					"revenue":             moneyMetric(current.Revenue, previous.Revenue).props(),
					"orders":              countMetric(current.Orders, previous.Orders).props(),
					"average_order_value": moneyMetric(current.AverageOrderValue, previous.AverageOrderValue).props(),
					"new_customers":       countMetric(newCustomers, prevCustomers).props(),
					"items_sold":          countMetric(current.ItemsSold, previous.ItemsSold).props(),
					"buyers":              countMetric(current.Buyers, previous.Buyers).props(),
					"discount_total":      moneyMetric(current.DiscountTotal, previous.DiscountTotal).props(),
				},
			}, nil
		})

		// --- Section 2: sales over time ------------------------------------
		s.run(&wg, "sales_series", func() (inertia.Props, error) {
			rows, err := h.queries.GetSalesSeries(ctx, db.GetSalesSeriesParams{
				From:   window.From,
				To:     window.To,
				Bucket: period.Bucket,
			})
			if err != nil {
				return nil, err
			}

			series := make([]map[string]any, len(rows))
			for i, row := range rows {
				series[i] = map[string]any{
					"bucket_at": row.BucketAt.Time.Format(time.RFC3339),
					"label":     bucketLabel(row.BucketAt.Time, period.Bucket),
					"revenue":   formatNumeric(row.Revenue),
					"orders":    row.Orders,
				}
			}
			return inertia.Props{"sales_series": series}, nil
		})

		// --- Section 3: order health ---------------------------------------
		//
		// The status split is period-scoped; the backlog is not. An order
		// stuck since last month is precisely the one a 7-day filter would
		// hide, so the two are separate queries and the UI labels them
		// differently.
		s.run(&wg, "order_status", func() (inertia.Props, error) {
			rows, err := h.queries.CountOrdersByStatusInRange(ctx, db.CountOrdersByStatusInRangeParams(window))
			if err != nil {
				return nil, err
			}

			counts := map[string]int64{}
			var total int64
			for _, row := range rows {
				counts[string(row.Status)] = row.Count
				total += row.Count
			}

			// Every status appears, including the ones with no orders: a
			// distribution with missing slices reads as a smaller store rather
			// than a quieter one.
			breakdown := make([]map[string]any, len(orderStatuses))
			for i, status := range orderStatuses {
				breakdown[i] = map[string]any{
					"status": string(status),
					"count":  counts[string(status)],
				}
			}

			return inertia.Props{
				"order_status": map[string]any{
					"total":     total,
					"breakdown": breakdown,
				},
			}, nil
		})

		s.run(&wg, "backlog", func() (inertia.Props, error) {
			cutoff := stamp(now.AddDate(0, 0, -dashboardStalledAfterDays))
			backlog, err := h.queries.GetOpenOrderBacklog(ctx, cutoff)
			if err != nil {
				return nil, err
			}

			orders, err := h.queries.ListOrdersNeedingAttention(ctx, dashboardListLimit)
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(orders))
			for i, o := range orders {
				rows[i] = map[string]any{
					"id":             fmt.Sprintf("%x", o.ID.Bytes),
					"status":         string(o.Status),
					"total":          formatNumeric(o.Total),
					"customer_name":  o.CustomerName,
					"customer_email": o.CustomerEmail,
					"item_count":     o.ItemCount,
					"created_at":     o.CreatedAt.Time.Format(time.RFC3339),
					// Age is computed once, here, against the same clock the
					// stalled cutoff used — rather than in the browser, whose
					// clock and timezone are not the store's.
					"age_days": int(now.Sub(o.CreatedAt.Time).Hours() / 24),
					"stalled":  o.CreatedAt.Time.Before(now.AddDate(0, 0, -dashboardStalledAfterDays)),
				}
			}

			return inertia.Props{
				"backlog": map[string]any{
					"pending":             backlog.Pending,
					"awaiting_fulfilment": backlog.AwaitingFulfilment,
					"in_transit":          backlog.InTransit,
					"stalled":             backlog.Stalled,
					"stalled_after_days":  dashboardStalledAfterDays,
					"orders":              rows,
				},
			}, nil
		})

		// --- Recent orders --------------------------------------------------
		//
		// Reuses GetRecentOrders, the query the dashboard has always used. The
		// rows are serialized to the same shape the orders list sends so
		// OrdersTable renders them without a second representation.
		s.run(&wg, "recent_orders", func() (inertia.Props, error) {
			orders, err := h.queries.GetRecentOrders(ctx, dashboardListLimit)
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(orders))
			for i, o := range orders {
				rows[i] = map[string]any{
					"id":             fmt.Sprintf("%x", o.ID.Bytes),
					"status":         string(o.Status),
					"total":          formatNumeric(o.Total),
					"customer_name":  o.CustomerName,
					"customer_email": o.CustomerEmail,
					"coupon_code":    o.CouponCode.String,
					"created_at":     o.CreatedAt.Time.Format(time.RFC3339),
				}
			}
			return inertia.Props{"recent_orders": rows}, nil
		})

		// --- Section 4: product performance --------------------------------
		s.run(&wg, "top_products", func() (inertia.Props, error) {
			products, err := h.queries.GetTopProductsInRange(ctx, db.GetTopProductsInRangeParams{
				From: window.From, To: window.To, ResultLimit: dashboardListLimit,
			})
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(products))
			for i, p := range products {
				rows[i] = map[string]any{
					"id":          fmt.Sprintf("%x", p.ID.Bytes),
					"name":        p.Name,
					"slug":        p.Slug,
					"sku":         p.Sku.String,
					"image_url":   p.ImageUrl.String,
					"units_sold":  p.UnitsSold,
					"revenue":     formatNumeric(p.Revenue),
					"order_count": p.OrderCount,
				}
			}
			return inertia.Props{"top_products": rows}, nil
		})

		s.run(&wg, "top_categories", func() (inertia.Props, error) {
			categories, err := h.queries.GetTopCategoriesInRange(ctx, db.GetTopCategoriesInRangeParams{
				From: window.From, To: window.To, ResultLimit: dashboardListLimit,
			})
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(categories))
			for i, c := range categories {
				rows[i] = map[string]any{
					"id":          fmt.Sprintf("%x", c.ID.Bytes),
					"name":        c.Name,
					"slug":        c.Slug,
					"units_sold":  c.UnitsSold,
					"revenue":     formatNumeric(c.Revenue),
					"order_count": c.OrderCount,
				}
			}
			return inertia.Props{"top_categories": rows}, nil
		})

		// --- Section 5: customers ------------------------------------------
		s.run(&wg, "customers", func() (inertia.Props, error) {
			mix, err := h.queries.GetCustomerMix(ctx, db.GetCustomerMixParams(window))
			if err != nil {
				return nil, err
			}

			top, err := h.queries.GetTopCustomersInRange(ctx, db.GetTopCustomersInRangeParams{
				From: window.From, To: window.To, ResultLimit: dashboardListLimit,
			})
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(top))
			for i, c := range top {
				rows[i] = map[string]any{
					"id":          fmt.Sprintf("%x", c.ID.Bytes),
					"name":        c.Name,
					"email":       c.Email,
					"order_count": c.OrderCount,
					"revenue":     formatNumeric(c.Revenue),
				}
			}

			return inertia.Props{
				"customers": map[string]any{
					"new_buyers":       mix.NewBuyers,
					"returning_buyers": mix.ReturningBuyers,
					"top":              rows,
				},
			}, nil
		})

		// --- Section 6: inventory ------------------------------------------
		s.run(&wg, "inventory", func() (inertia.Props, error) {
			health, err := h.queries.GetInventoryHealth(ctx)
			if err != nil {
				return nil, err
			}

			alerts, err := h.queries.ListInventoryAlerts(ctx, dashboardAlertLimit)
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(alerts))
			for i, p := range alerts {
				rows[i] = map[string]any{
					"id":                  fmt.Sprintf("%x", p.ID.Bytes),
					"name":                p.Name,
					"slug":                p.Slug,
					"sku":                 p.Sku.String,
					"image_url":           p.ImageUrl.String,
					"category_name":       p.CategoryName.String,
					"stock_quantity":      p.StockQuantity,
					"low_stock_threshold": p.LowStockThreshold,
					"allow_backorders":    p.AllowBackorders,
				}
			}

			return inertia.Props{
				"inventory": map[string]any{
					"out_of_stock":     health.OutOfStock,
					"low_stock":        health.LowStock,
					"tracked_products": health.TrackedProducts,
					"alerts":           rows,
				},
			}, nil
		})

		// --- Section 7: promotions -----------------------------------------
		s.run(&wg, "promotions", func() (inertia.Props, error) {
			performance, err := h.queries.GetCouponPerformanceInRange(ctx, db.GetCouponPerformanceInRangeParams(window))
			if err != nil {
				return nil, err
			}

			live, err := h.queries.CountLiveCoupons(ctx)
			if err != nil {
				return nil, err
			}

			top, err := h.queries.ListTopCouponsInRange(ctx, db.ListTopCouponsInRangeParams{
				From: window.From, To: window.To, ResultLimit: dashboardListLimit,
			})
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(top))
			for i, c := range top {
				rows[i] = map[string]any{
					"id":             fmt.Sprintf("%x", c.ID.Bytes),
					"code":           c.Code,
					"description":    c.Description,
					"discount_type":  c.DiscountType,
					"discount_value": formatNumeric(c.DiscountValue),
					"is_active":      c.IsActive,
					"redemptions":    c.Redemptions,
					"discount_total": formatNumeric(c.DiscountTotal),
					"revenue":        formatNumeric(c.Revenue),
				}
			}

			return inertia.Props{
				"promotions": map[string]any{
					"redemptions":    performance.Redemptions,
					"discount_total": formatNumeric(performance.DiscountTotal),
					"orders":         performance.Orders,
					"revenue":        formatNumeric(performance.Revenue),
					"live_coupons":   live,
					"top":            rows,
				},
			}, nil
		})

		// --- Section 8: activity -------------------------------------------
		s.run(&wg, "activity", func() (inertia.Props, error) {
			events, err := h.queries.ListRecentActivity(ctx, dashboardActivityLimit)
			if err != nil {
				return nil, err
			}

			rows := make([]map[string]any, len(events))
			for i, e := range events {
				rows[i] = map[string]any{
					"id":            fmt.Sprintf("%x", e.ID.Bytes),
					"order_id":      fmt.Sprintf("%x", e.OrderID.Bytes),
					"kind":          e.Kind,
					"message":       e.Message,
					"actor_name":    e.ActorName,
					"customer_name": e.CustomerName,
					"from_status":   nullStatusString(e.FromStatus),
					"to_status":     nullStatusString(e.ToStatus),
					"created_at":    e.CreatedAt.Time.Format(time.RFC3339),
				}
			}
			return inertia.Props{"activity": rows}, nil
		})

		// --- Catalogue counts ----------------------------------------------
		//
		// Not analytics — context for the quick actions, and the numbers the
		// empty state needs to tell "no orders yet" apart from "no catalogue
		// yet", which want different advice.
		s.run(&wg, "catalog", func() (inertia.Props, error) {
			return h.catalogCounts(ctx)
		})

		wg.Wait()

		props := s.props
		props["period"] = map[string]any{
			"range":            period.Key,
			"label":            period.Label,
			"from":             period.From.Format(time.RFC3339),
			"to":               period.To.Format(time.RFC3339),
			"comparison_label": period.ComparisonLabel,
			"in_progress":      period.InProgress,
			"bucket":           period.Bucket,
			"custom_from":      period.CustomFrom,
			"custom_to":        period.CustomTo,
			"ranges":           dashboardRangeOptions(),
		}
		props["currency"] = h.settings.Get(ctx).Currency
		props["section_errors"] = s.errs

		h.renderer.Render(w, r, "Pages/Admin/Dashboard", props)
	}
}

// catalogCounts reuses the counting queries the list pages already use, rather
// than adding a fifth way to count a product.
func (h *AdminDashboardHandler) catalogCounts(ctx context.Context) (inertia.Props, error) {
	products, err := h.queries.CountAllProducts(ctx)
	if err != nil {
		return nil, err
	}
	customers, err := h.queries.CountCustomers(ctx)
	if err != nil {
		return nil, err
	}
	categories, err := h.queries.CountAllCategories(ctx)
	if err != nil {
		return nil, err
	}
	collections, err := h.queries.CountActiveCollections(ctx)
	if err != nil {
		return nil, err
	}

	return inertia.Props{
		"catalog": map[string]any{
			"products":    products,
			"customers":   customers,
			"categories":  categories,
			"collections": collections,
		},
	}, nil
}

func dashboardRangeOptions() []map[string]any {
	options := make([]map[string]any, len(dashboardRanges))
	for i, option := range dashboardRanges {
		options[i] = map[string]any{"value": option.Value, "label": option.Label}
	}
	return options
}

func nullStatusString(s db.NullOrderStatus) string {
	if !s.Valid {
		return ""
	}
	return string(s.OrderStatus)
}
