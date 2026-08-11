package service

import (
	"testing"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name    string
		pass    string
		wantErr bool
	}{
		{"valid password", "password123", false},
		{"valid long password", "this-is-a-very-long-password-that-is-still-valid", false},
		{"too short", "pass", true},
		{"exactly 8 chars", "12345678", false},
		{"7 chars", "1234567", true},
		{"empty", "", true},
		{"very long", string(make([]byte, 200)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.pass)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePassword() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestParseUUID(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid UUID", "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", false},
		{"valid UUID without dashes", "a0eebc999c0b4ef8bb6d6bb9bd380a11", false},
		{"invalid length", "abc123", true},
		{"invalid characters", "gggggggg-gggg-gggg-gggg-gggggggggggg", true},
		{"empty", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := ParseUUID(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseUUID() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestUUIDToString(t *testing.T) {
	uuid, _ := ParseUUID("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
	result := UUIDToString(uuid)
	expected := "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
	if result != expected {
		t.Errorf("UUIDToString() = %v, want %v", result, expected)
	}
}
