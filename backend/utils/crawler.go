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

func NewCrawlerService() *CrawlerService {
	return &CrawlerService{
		client: &http.Client{
			Timeout: 10 * time.Second,
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
	baseURL, _ := url.Parse(targetURL)

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
	brokenLinks := c.checkBrokenLinks(allLinks[:min(len(allLinks), 10)])
	result.BrokenLinks = len(brokenLinks)

	return result, brokenLinks, nil
}

func extractTitle(doc *html.Node) string {
	var title string
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "title" {
			if n.FirstChild != nil {
				title = n.FirstChild.Data
			}
			return
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	return title
}

func determineHTMLVersion(doc *html.Node) string {
	var doctype string
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.DoctypeNode {
			doctype = n.Data
			return
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	
	if strings.Contains(strings.ToLower(doctype), "html5") || strings.Contains(strings.ToLower(doctype), "html") {
		return "HTML5"
	}
	return "Unknown"
}

func countHeadings(doc *html.Node, tag string) int {
	count := 0
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == tag {
			count++
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	return count
}

func hasLoginForm(doc *html.Node) bool {
	var hasPassword bool
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "input" {
			for _, attr := range n.Attr {
				if attr.Key == "type" && attr.Val == "password" {
					hasPassword = true
					return
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	return hasPassword
}

func extractLinks(doc *html.Node, baseURL *url.URL) ([]string, []string, []string) {
	var internalLinks, externalLinks, allLinks []string
	seen := make(map[string]bool)
	
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
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
						
						// Categorize as internal or external
						if strings.Contains(linkURL, baseURL.Host) {
							internalLinks = append(internalLinks, linkURL)
						} else {
							externalLinks = append(externalLinks, linkURL)
						}
					}
					break
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	
	return internalLinks, externalLinks, allLinks
}

func (c *CrawlerService) checkBrokenLinks(links []string) []models.BrokenLink {
	var brokenLinks []models.BrokenLink
	
	for _, link := range links {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		req, err := http.NewRequestWithContext(ctx, "HEAD", link, nil)
		if err != nil {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   0,
				ErrorMessage: "Invalid URL",
			})
			cancel()
			continue
		}
		
		resp, err := c.client.Do(req)
		cancel()
		
		if err != nil {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   0,
				ErrorMessage: err.Error(),
			})
			continue
		}
		
		if resp.StatusCode >= 400 {
			brokenLinks = append(brokenLinks, models.BrokenLink{
				URL:          link,
				StatusCode:   resp.StatusCode,
				ErrorMessage: resp.Status,
			})
		}
		resp.Body.Close()
	}
	
	return brokenLinks
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
} 