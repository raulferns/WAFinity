# WAFinity

<div align="center">

<p align="center">
  <img src="./app/src/static/favicon.svg" width="96px" alt="WAFinity Logo" />
</p>

# WAFinity — Advanced Web Application Firewall & Security Audit Platform

An all-in-one web security suite and reconnaissance platform built on Cloudflare Workers. Test WAF robustness against real-world exploits, measure false positive resilience, inspect security headers, fingerprint target infrastructure, and run high-speed performance and SEO audits.

[![Repository](https://img.shields.io/badge/GitHub-raulferns%2FWAFinity-orange?style=flat-square&logo=github)](https://github.com/raulferns/WAFinity)
[![Runtime](https://img.shields.io/badge/Platform-Cloudflare%20Workers-f38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## Overview

**WAFinity** is a modern security audit workbench designed for penetration testers, DevSecOps engineers, and website owners. It combines deep automated WAF payload testing with passive and active reconnaissance tools—all wrapped in a cyber-inspired, dark-mode user interface.

Whether evaluating firewall rules against OWASP Top 10 vectors or conducting comprehensive domain intelligence checks, WAFinity delivers real-time streaming feedback and actionable reports.

---

## Core Capabilities

### 1. WAF Security Testing
- **19+ Attack Vectors**: Automated testing for SQL Injection (SQLi), Cross-Site Scripting (XSS), Path Traversal, OS Command Injection, Server-Side Request Forgery (SSRF), NoSQL Injection, Local File Inclusion (LFI), LDAP Injection, XML External Entity (XXE), Server-Side Template Injection (SSTI), CRLF Injection, Open Redirect, and more.
- **Advanced Bypass Techniques**: Double URL encoding, Unicode normalization, mixed-case mutation, comment obfuscation, and HTTP manipulation testing.
- **Real-Time SSE Streaming**: Live status progression showing exact request timings, HTTP methods, payloads, and response codes.
- **Instant Verdict Indicators**: Clear color-coded test indicators marking blocked attacks as **Protected (Green)** and bypasses as **Vulnerable (Red)**.
- **False Positive Mode**: Test benign, everyday payloads to identify over-aggressive rules blocking legitimate user traffic.

### 2. Auto WAF Detection
- Identifies active firewall signatures and vendors, including:
  - Cloudflare
  - AWS WAF
  - Akamai
  - Imperva / Incapsula
  - ModSecurity / OWASP CRS
  - F5 BIG-IP
  - Sucuri
  - Fastly
  - Fortinet FortiWeb
  - Barracuda

### 3. Full Reconnaissance
- **Tech Stack Fingerprinting**: CMS identification (WordPress, Drupal, Joomla, Shopify), backend web servers, CDN providers, frontend frameworks, and JavaScript libraries.
- **DNS Intelligence**: Resolution for A, AAAA, CNAME, MX, NS, TXT, and SOA records.
- **WHOIS & IP Geolocation**: ASN details, ISP organization, geographic country/region, and reverse DNS (PTR).
- **Subdomain Discovery**: Certificate Transparency (crt.sh) log analysis and DNS brute-force discovery.
- **Shared Hosting Detection**: Reverse IP lookup identifying co-hosted domains on shared infrastructure.
- **SSL/TLS Diagnostics**: Issuer verification, validity dates, Subject Alternative Names (SANs), and cryptographic parameters.
- **Asset Probing**: Detection of `robots.txt`, `sitemap.xml`, `security.txt`, Open Graph metadata, and RSS feeds.

### 4. Security Headers Audit
- **Letter Grade Scoring**: Evaluates HTTP headers from **A+** down to **F**.
- **Header Analysis**: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy.
- **Information Leakage Detection**: Detects server disclosure headers (`Server`, `X-Powered-By`, `X-AspNet-Version`, debug banners).
- **Remediation Guides**: Actionable directives and configuration snippets for missing security headers.

### 5. Performance & Speed Test
- **Core Web Vitals**: First Contentful Paint (FCP), Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS), and Time to Interactive (TTI).
- **Network Breakdown**: DNS lookup duration, Time to First Byte (TTFB), content download time, and total latency.
- **Page Weight Analysis**: Breakdown by content type (HTML, CSS, JavaScript, images, web fonts).

### 6. SEO & Hygiene Audit
- **Comprehensive Score**: Meta tags verification (title, description, viewport, canonical, robots directives, lang, charset).
- **Page Structure**: Heading hierarchy analysis, content-to-HTML ratio, keyword density, and link health (internal/external/broken anchors).
- **Accessibility Checks**: Semantic landmarks, image alt attributes, contrast checks, and ARIA form labels.

### 7. Export & Analytics
- Multi-format export options: **JSON**, **CSV**, **HTML Report**, and visual dashboard analytics.

---

## Architecture & Tech Stack

```
WAFinity/
├── app/
│   ├── src/
│   │   ├── api.ts              # Backend API & WAF check handlers (Cloudflare Worker)
│   │   ├── static/             # Frontend client assets
│   │   │   ├── index.html      # Main Single-Page Application (SPA)
│   │   │   ├── style.css       # Core theme tokens & UI layout styles
│   │   │   ├── favicon.svg     # Logo vector
│   │   │   └── js/
│   │   │       ├── main.js     # Primary dashboard logic & test streaming
│   │   │       ├── modules/    # Modular tools (Recon, Headers, Speed, SEO, History, Export)
│   │   │       └── utils/      # HTTP status helpers and UI utilities
│   ├── wrangler.toml           # Worker deployment configuration
│   └── package.json            # Worker dependencies
└── README.md                   # Project documentation
```

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (V8 Serverless Engine)
- **Backend**: TypeScript / ES Modules
- **Frontend**: Vanilla JavaScript (ES6+), Vanilla CSS, Tailwind CSS utilities
- **Network**: Fetch API with Server-Sent Events (SSE) streaming

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raulferns/WAFinity.git
   cd WAFinity
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd app && npm install && cd ..
   ```

3. **Start local development server:**
   ```bash
   cd app
   npx wrangler dev
   ```

4. **Access the application:**
   Open [http://127.0.0.1:8787](http://127.0.0.1:8787) in your browser.

---

## Deployment to Cloudflare

Deploy globally to Cloudflare Workers in seconds:

1. **Authenticate Wrangler CLI:**
   ```bash
   npx wrangler login
   ```

2. **Deploy Worker:**
   ```bash
   cd app
   npx wrangler deploy
   ```

---

## Customizing Payloads

Payload categories are configured dynamically or customized directly in the UI:
1. Open the dashboard and click **Configure Payloads** in the top navigation.
2. Add custom strings, modify existing payloads, or import external payload lists.
3. Custom payloads are persistently stored in your browser's local storage and executed in testing runs.

---

## Legal & Ethics Notice

> **Important**: WAFinity is intended strictly for authorized security assessments, defensive validation, and research on infrastructure you own or have explicit, documented permission to test. Unauthorized testing against third-party systems may violate applicable computer misuse and cybersecurity laws.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author & Maintainer

Maintained by **[raulferns](https://github.com/raulferns)**  
GitHub: [https://github.com/raulferns/WAFinity](https://github.com/raulferns/WAFinity)
