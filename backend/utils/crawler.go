package utils

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/sykell/backend/models"
	"golang.org/x/net/html"
)

type CrawlerService struct {
	client *http.Client
}

const MaxCheckedLinks = 10

func NewCrawlerService() *CrawlerService {
	return &CrawlerService{
		client: &http.Client{
			Timeout: 10 * time.Second,
			// Don't follow redirects automatically to avoid redirect loops
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				if len(via) >= 10 {
					return fmt.Errorf("too many redirects")
				}
				return nil
			},
		},
	}
}

func (c *CrawlerService) AnalyzeURL(targetURL string) (*models.AnalysisResult, []models.BrokenLink, error) {
	// Fetch the HTML content
	resp, err := c.client.Get(targetURL)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse HTML
	doc, err := html.Parse(strings.NewReader(string(body)))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	// Extract base URL for relative link resolution
	baseURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid base URL: %w", err)
	}

	// Analyze the HTML
	result := &models.AnalysisResult{}
	
	// Extract title
	result.Title = extractTitle(doc)
	
	// Determine HTML version
	result.HTMLVersion = determineHTMLVersion(doc)
	
	// Count headings
	result.H1Count = countHeadings(doc, "h1")
	result.H2Count = countHeadings(doc, "h2")
	result.H3Count = countHeadings(doc, "h3")
	result.H4Count = countHeadings(doc, "h4")
	result.H5Count = countHeadings(doc, "h5")
	result.H6Count = countHeadings(doc, "h6")
	
	// Check for login form
	result.HasLoginForm = hasLoginForm(doc)
	
	// Extract and categorize links
	internalLinks, externalLinks, allLinks := extractLinks(doc, baseURL)
	result.InternalLinks = len(internalLinks)
	result.ExternalLinks = len(externalLinks)
	
	// Check for broken links (limit to first 10)
	brokenLinks := c.checkBrokenLinks(allLinks[:min(len(allLinks), MaxCheckedLinks)])
	result.BrokenLinks = len(brokenLinks)

	return result, brokenLinks, nil
}

// Add a generic traverseHTML function
func traverseHTML(doc *html.Node, visitor func(*html.Node)) {
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		visitor(n)
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
}

func extractTitle(doc *html.Node) string {
	var title string
	traverseHTML(doc, func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "title" {
			if n.FirstChild != nil {
				title = n.FirstChild.Data
			}
		}
	})
	return title
}

func determineHTMLVersion(doc *html.Node) string {
	var doctype string
	traverseHTML(doc, func(n *html.Node) {
		if n.Type == html.DoctypeNode {
			doctype = n.Data
		}
	})
	if strings.Contains(strings.ToLower(doctype), "html5") || strings.Contains(strings.ToLower(doctype), "html") {
		return "HTML5"
	}
	return "Unknown"
}

func countHeadings(doc *html.Node, tag string) int {
	count := 0
	traverseHTML(doc, func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == tag {
			count++
		}
	})
	return count
}

func hasLoginForm(doc *html.Node) bool {
	hasPassword := false
	traverseHTML(doc, func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "input" {
			for _, attr := range n.Attr {
				if attr.Key == "type" && attr.Val == "password" {
					hasPassword = true
				}
			}
		}
	})
	return hasPassword
}

func extractLinks(doc *html.Node, baseURL *url.URL) ([]string, []string, []string) {
	var internalLinks, externalLinks, allLinks []string
	seen := make(map[string]bool)
	traverseHTML(doc, func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					linkURL := attr.Val
					if linkURL == "" || strings.HasPrefix(linkURL, "#") || strings.HasPrefix(linkURL, "javascript:") {
						continue
					}
					// Resolve relative URLs
					if !strings.HasPrefix(linkURL, "http") {
						if resolved, err := baseURL.Parse(linkURL); err == nil {
							linkURL = resolved.String()
						}
					}
					if !seen[linkURL] {
						seen[linkURL] = true
						allLinks = append(allLinks, linkURL)
						if strings.Contains(linkURL, baseURL.Host) {
							internalLinks = append(internalLinks, linkURL)
						} else {
							externalLinks = append(externalLinks, linkURL)
						}
					}
				}
			}
		}
	})
	return internalLinks, externalLinks, allLinks
}

func (c *CrawlerService) checkBrokenLinks(links []string) []models.BrokenLink {
	var brokenLinks []models.BrokenLink
	
	for _, link := range links {
		// Validate URL format first
		if !isValidURL(link) {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   0,
				ErrorMessage: "Invalid URL format",
			})
			continue
		}

		// Try HEAD request first, fallback to GET if needed
		statusCode, err := c.checkLinkWithHEAD(link)
		if err != nil {
			// If HEAD fails with 405, try GET
			if strings.Contains(err.Error(), "405") {
				statusCode, err = c.checkLinkWithGET(link)
			}
		}

		if err != nil {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   0,
				ErrorMessage: c.sanitizeErrorMessage(err.Error()),
			})
			continue
		}

		// Consider 4xx and 5xx as broken, but handle some edge cases
		if statusCode >= 400 {
			// Don't mark rate limiting as broken (429)
			if statusCode == 429 {
				continue
			}
			// Don't mark authentication required as broken (401, 407)
			if statusCode == 401 || statusCode == 407 {
				continue
			}
			
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   statusCode,
				ErrorMessage: getStatusMessage(statusCode),
			})
		}
	}
	
	return brokenLinks
}

func (c *CrawlerService) checkLinkWithHEAD(link string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "HEAD", link, nil)
	if err != nil {
		return 0, err
	}
	
	// Set a realistic user agent to avoid blocking
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; SykellBot/1.0)")
	req.Header.Set("Accept", "*/*")
	
	resp, err := c.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	return resp.StatusCode, nil
}

func (c *CrawlerService) checkLinkWithGET(link string) (int, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	req, err := http.NewRequestWithContext(ctx, "GET", link, nil)
	if err != nil {
		return 0, err
	}
	
	// Set a realistic user agent to avoid blocking
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; SykellBot/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	
	resp, err := c.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	return resp.StatusCode, nil
}

func isValidURL(link string) bool {
	parsed, err := url.Parse(link)
	if err != nil {
		return false
	}
	return parsed.Scheme != "" && parsed.Host != ""
}

func (c *CrawlerService) sanitizeErrorMessage(errMsg string) string {
	// Remove sensitive information from error messages
	if strings.Contains(errMsg, "x509") {
		return "SSL/TLS certificate error"
	}
	if strings.Contains(errMsg, "no such host") {
		return "DNS resolution failed"
	}
	if strings.Contains(errMsg, "timeout") {
		return "Request timeout"
	}
	if strings.Contains(errMsg, "connection refused") {
		return "Connection refused"
	}
	if strings.Contains(errMsg, "too many redirects") {
		return "Too many redirects"
	}
	return errMsg
}

func getStatusMessage(statusCode int) string {
	switch statusCode {
	case 400:
		return "Bad Request"
	case 401:
		return "Unauthorized"
	case 403:
		return "Forbidden"
	case 404:
		return "Not Found"
	case 405:
		return "Method Not Allowed"
	case 408:
		return "Request Timeout"
	case 429:
		return "Too Many Requests"
	case 500:
		return "Internal Server Error"
	case 502:
		return "Bad Gateway"
	case 503:
		return "Service Unavailable"
	case 504:
		return "Gateway Timeout"
	default:
		return fmt.Sprintf("HTTP %d", statusCode)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
} 