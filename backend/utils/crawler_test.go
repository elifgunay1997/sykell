package utils

import (
	"fmt"
	"strings"
	"testing"

	"golang.org/x/net/html"
)

func TestExtractTitle(t *testing.T) {
	tests := []struct {
		name     string
		html     string
		expected string
	}{
		{
			name:     "extract title from HTML",
			html:     "<html><head><title>Test Title</title></head><body></body></html>",
			expected: "Test Title",
		},
		{
			name:     "no title tag",
			html:     "<html><head></head><body></body></html>",
			expected: "",
		},
		{
			name:     "empty title",
			html:     "<html><head><title></title></head><body></body></html>",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			doc, err := html.Parse(strings.NewReader(tt.html))
			if err != nil {
				t.Fatalf("Failed to parse HTML: %v", err)
			}

			result := extractTitle(doc)
			if result != tt.expected {
				t.Errorf("extractTitle() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestCountHeadings(t *testing.T) {
	htmlContent := `
	<html>
		<head><title>Test</title></head>
		<body>
			<h1>Title 1</h1>
			<h2>Subtitle 1</h2>
			<h2>Subtitle 2</h2>
			<h3>Section 1</h3>
			<h1>Title 2</h1>
		</body>
	</html>
	`

	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		t.Fatalf("Failed to parse HTML: %v", err)
	}

	tests := []struct {
		tag      string
		expected int
	}{
		{"h1", 2},
		{"h2", 2},
		{"h3", 1},
		{"h4", 0},
		{"h5", 0},
		{"h6", 0},
	}

	for _, tt := range tests {
		t.Run(tt.tag, func(t *testing.T) {
			result := countHeadings(doc, tt.tag)
			if result != tt.expected {
				t.Errorf("countHeadings(%s) = %v, want %v", tt.tag, result, tt.expected)
			}
		})
	}
}

func TestHasLoginForm(t *testing.T) {
	tests := []struct {
		name     string
		html     string
		expected bool
	}{
		{
			name:     "has password input",
			html:     `<html><body><form><input type="password" name="password"></form></body></html>`,
			expected: true,
		},
		{
			name:     "has password input with other attributes",
			html:     `<html><body><form><input type="password" name="password" required></form></body></html>`,
			expected: true,
		},
		{
			name:     "no password input",
			html:     `<html><body><form><input type="text" name="username"></form></body></html>`,
			expected: false,
		},
		{
			name:     "no form at all",
			html:     `<html><body><div>Content</div></body></html>`,
			expected: false,
		},
		{
			name:     "input without type",
			html:     `<html><body><form><input name="field"></form></body></html>`,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			doc, err := html.Parse(strings.NewReader(tt.html))
			if err != nil {
				t.Fatalf("Failed to parse HTML: %v", err)
			}

			result := hasLoginForm(doc)
			if result != tt.expected {
				t.Errorf("hasLoginForm() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestDetermineHTMLVersion(t *testing.T) {
	tests := []struct {
		name     string
		html     string
		expected string
	}{
		{
			name:     "HTML5 doctype",
			html:     `<!DOCTYPE html><html><head></head><body></body></html>`,
			expected: "HTML5",
		},
		{
			name:     "HTML4 doctype",
			html:     `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"><html><head></head><body></body></html>`,
			expected: "HTML5", // Our logic treats this as HTML5
		},
		{
			name:     "no doctype",
			html:     `<html><head></head><body></body></html>`,
			expected: "Unknown",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			doc, err := html.Parse(strings.NewReader(tt.html))
			if err != nil {
				t.Fatalf("Failed to parse HTML: %v", err)
			}

			result := determineHTMLVersion(doc)
			if result != tt.expected {
				t.Errorf("determineHTMLVersion() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestIsValidURL(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		expected bool
	}{
		{"valid http URL", "http://example.com", true},
		{"valid https URL", "https://example.com", true},
		{"valid URL with path", "https://example.com/path", true},
		{"valid URL with query", "https://example.com?param=value", true},
		{"invalid URL - no protocol", "example.com", false},
		{"invalid URL - empty", "", false},
		{"invalid URL - just protocol", "http://", false},
		{"invalid URL - malformed", "not-a-url", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidURL(tt.url)
			if result != tt.expected {
				t.Errorf("isValidURL(%s) = %v, want %v", tt.url, result, tt.expected)
			}
		})
	}
}

func TestGetStatusMessage(t *testing.T) {
	tests := []struct {
		statusCode int
		expected   string
	}{
		{200, "HTTP 200"},
		{404, "Not Found"},
		{500, "Internal Server Error"},
		{301, "HTTP 301"},
		{302, "HTTP 302"},
		{403, "Forbidden"},
		{401, "Unauthorized"},
		{0, "HTTP 0"},
	}

	for _, tt := range tests {
		t.Run(fmt.Sprintf("status_%d", tt.statusCode), func(t *testing.T) {
			result := getStatusMessage(tt.statusCode)
			if result != tt.expected {
				t.Errorf("getStatusMessage(%d) = %v, want %v", tt.statusCode, result, tt.expected)
			}
		})
	}
}

func TestMin(t *testing.T) {
	tests := []struct {
		a, b, expected int
	}{
		{1, 2, 1},
		{2, 1, 1},
		{5, 5, 5},
		{0, 10, 0},
		{-1, 1, -1},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := min(tt.a, tt.b)
			if result != tt.expected {
				t.Errorf("min(%d, %d) = %d, want %d", tt.a, tt.b, result, tt.expected)
			}
		})
	}
} 