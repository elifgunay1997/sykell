# Sykell Web Crawler Dashboard

A full-stack web application that crawls websites and displays analysis results including HTML version, headings, links, and broken link detection.

## Quick Start

```bash
# Start the application
make start

# Access the dashboard
open http://localhost:3000
```

## Features

- **URL Analysis**: Add URLs to crawl and analyze
- **Dashboard**: View all analyzed URLs with pagination and search
- **Details View**: See charts and broken links for each URL
- **Real-time Status**: Monitor crawling progress
- **Bulk Actions**: Delete or re-analyze multiple URLs

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Go + Gin + MySQL
- **Auth**: Bearer token authentication
- **Testing**: Jest + React Testing Library

## API Endpoints

- `POST /api/urls` - Add URL for analysis
- `GET /api/urls` - List all URLs
- `GET /api/urls/:id` - Get analysis details
- `DELETE /api/urls` - Delete URLs
- `POST /api/urls/:id/reanalyze` - Re-analyze URL

## Development

```bash
# Run tests
make test

# View logs
make logs

# Stop services
make stop
```

## Auth

Use Bearer token: `Bearer sykell-api-token-2025`