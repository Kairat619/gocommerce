package db

import (
	"context"
	"embed"
	"fmt"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed schema/*.up.sql schema/*.down.sql
var migrations embed.FS

func migrateDSN(dsn string) string {
	if strings.HasPrefix(dsn, "postgres://") {
		return "pgx5://" + strings.TrimPrefix(dsn, "postgres://")
	}
	if strings.HasPrefix(dsn, "postgresql://") {
		return "pgx5://" + strings.TrimPrefix(dsn, "postgresql://")
	}
	return dsn
}

// MigrateSchema runs all pending database migrations from the embedded schema files.
func MigrateSchema(ctx context.Context, pool *pgxpool.Pool) error {
	dsn := migrateDSN(pool.Config().ConnString())

	d, err := iofs.New(migrations, "schema")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, dsn)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration failed: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		return fmt.Errorf("failed to get migration version: %w", err)
	}

	if dirty {
		fmt.Printf("WARNING: Database is in dirty state at version %d\n", version)
	}

	fmt.Printf("Database migration complete. Current version: %d\n", version)
	return nil
}

// MigrateDown rolls back the last migration.
func MigrateDown(ctx context.Context, pool *pgxpool.Pool) error {
	dsn := migrateDSN(pool.Config().ConnString())

	d, err := iofs.New(migrations, "schema")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, dsn)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Steps(-1); err != nil {
		return fmt.Errorf("migration rollback failed: %w", err)
	}

	fmt.Println("Migration rollback complete.")
	return nil
}

// MigrateStatus returns the current migration version and status.
func MigrateStatus(ctx context.Context, pool *pgxpool.Pool) (version uint, dirty bool, err error) {
	dsn := migrateDSN(pool.Config().ConnString())

	d, err := iofs.New(migrations, "schema")
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, dsn)
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	v, d2, err := m.Version()
	if err != nil {
		if err == migrate.ErrNilVersion {
			return 0, false, nil
		}
		return 0, false, err
	}

	return v, d2, nil
}

// MigrateForce forces the migration version without running migrations.
func MigrateForce(ctx context.Context, pool *pgxpool.Pool, version uint) error {
	dsn := migrateDSN(pool.Config().ConnString())

	d, err := iofs.New(migrations, "schema")
	if err != nil {
		return fmt.Errorf("failed to create migration source: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", d, dsn)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Force(int(version)); err != nil {
		return fmt.Errorf("failed to force version %d: %w", version, err)
	}

	fmt.Printf("Forced migration to version %d\n", version)
	return nil
}

// ParseMigrationError extracts useful information from migrate errors.
func ParseMigrationError(err error) string {
	if err == nil {
		return ""
	}

	msg := err.Error()
	if strings.Contains(msg, "dirty") {
		return "Database is in dirty state. Run 'make migrate-force' to fix."
	}
	if strings.Contains(msg, "no change") {
		return "No pending migrations."
	}
	return msg
}
