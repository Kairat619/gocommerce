package db

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Seed inserts sample data for development.
func Seed(ctx context.Context, pool *pgxpool.Pool) error {
	// Check if data already exists
	var count int64
	err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check users: %w", err)
	}
	if count > 0 {
		fmt.Println("Seed data already exists, skipping.")
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// --- Users ---
	_, err = tx.Exec(ctx, `
		INSERT INTO users (id, name, email, password_hash, role) VALUES
		('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Admin User',  'admin@gocommerce.com',  $1, 'admin'),
		('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Jane Doe',    'jane@example.com',      $1, 'customer'),
		('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'John Smith',  'john@example.com',      $1, 'customer')
	`, string(hash))
	if err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}

	// --- Categories ---
	_, err = tx.Exec(ctx, `
		INSERT INTO categories (id, parent_id, name, slug, description, sort_order, is_active) VALUES
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', NULL, 'Electronics',  'electronics',  'Phones, laptops, and gadgets', 1, true),
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', NULL, 'Clothing',     'clothing',     'Apparel and fashion accessories', 2, true),
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', NULL, 'Home & Garden','home-garden',  'Furniture, decor, and garden tools', 3, true),
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', NULL, 'Books',        'books',        'Fiction, non-fiction, and textbooks', 4, true),
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Smartphones',   'smartphones',   'Mobile phones and accessories', 1, true),
		('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Laptops',       'laptops',       'Notebooks and ultrabooks', 2, true)
	`)
	if err != nil {
		return fmt.Errorf("failed to seed categories: %w", err)
	}

	// --- Products ---
	_, err = tx.Exec(ctx, `
		INSERT INTO products (id, category_id, name, slug, description, price, compare_at_price, sku, image_url, is_active, is_featured, stock_quantity, meta_title, meta_description) VALUES
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'iPhone 15 Pro',        'iphone-15-pro',        'Apple iPhone 15 Pro with A17 Pro chip', 999.99, 1099.99, 'IPH15PRO', 'https://placehold.co/600x400?text=iPhone+15+Pro', true, true, 50, 'iPhone 15 Pro', 'Latest Apple iPhone with advanced features'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Samsung Galaxy S24',   'samsung-galaxy-s24',   'Samsung Galaxy S24 with AI features', 899.99, 999.99, 'SAMGS24', 'https://placehold.co/600x400?text=Galaxy+S24', true, true, 75, 'Samsung Galaxy S24', 'Next-generation Samsung smartphone'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'MacBook Air M3',       'macbook-air-m3',       'Apple MacBook Air with M3 chip', 1299.99, 1399.99, 'MBAM3', 'https://placehold.co/600x400?text=MacBook+Air', true, true, 30, 'MacBook Air M3', 'Ultra-thin laptop with M3 performance'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Dell XPS 15',          'dell-xps-15',          'Dell XPS 15 with Intel Core i7', 1199.99, 1299.99, 'DELXPS15', 'https://placehold.co/600x400?text=Dell+XPS', true, false, 40, 'Dell XPS 15', 'Premium Windows laptop'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Cotton T-Shirt',        'cotton-t-shirt',        'Premium cotton crew neck t-shirt', 24.99, 29.99, 'TSH001', 'https://placehold.co/600x400?text=T-Shirt', true, false, 300, 'Cotton T-Shirt', 'Comfortable everyday wear'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Denim Jacket',          'denim-jacket',          'Classic blue denim jacket', 79.99, 99.99, 'DNJ001', 'https://placehold.co/600x400?text=Denim+Jacket', true, false, 60, 'Denim Jacket', 'Timeless style for any occasion'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Desk Lamp',             'desk-lamp',             'Adjustable LED desk lamp with USB charging', 39.99, 49.99, 'LMP001', 'https://placehold.co/600x400?text=Desk+Lamp', true, false, 120, 'LED Desk Lamp', 'Modern desk lamp with USB charging'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Plant Pot Set',         'plant-pot-set',         'Set of 3 ceramic plant pots', 34.99, 44.99, 'POT001', 'https://placehold.co/600x400?text=Plant+Pots', true, false, 90, 'Ceramic Plant Pot Set', 'Beautiful pots for your plants'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Go Programming Guide',  'go-programming-guide',  'Comprehensive guide to Go development', 44.99, 54.99, 'BOOK001', 'https://placehold.co/600x400?text=Go+Guide', true, false, 50, 'Go Programming Guide', 'Master Go development'),
		('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'React Cookbook',         'react-cookbook',        'Advanced React patterns and recipes', 39.99, 49.99, 'BOOK002', 'https://placehold.co/600x400?text=React+Cookbook', true, false, 65, 'React Cookbook', 'Advanced React techniques')
	`)
	if err != nil {
		return fmt.Errorf("failed to seed products: %w", err)
	}

	// --- Addresses ---
	_, err = tx.Exec(ctx, `
		INSERT INTO addresses (id, user_id, label, first_name, last_name, address_line1, city, state, postal_code, country, is_default) VALUES
		('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Home', 'Jane', 'Doe', '123 Main Street', 'New York', 'NY', '10001', 'US', true),
		('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Home', 'John', 'Smith', '456 Oak Avenue', 'Los Angeles', 'CA', '90001', 'US', true)
	`)
	if err != nil {
		return fmt.Errorf("failed to seed addresses: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit seed transaction: %w", err)
	}

	fmt.Println("Seed data inserted successfully.")
	return nil
}
