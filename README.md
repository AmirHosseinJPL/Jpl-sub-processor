# JPL Subscription Processor

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform: Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-f38020.svg?logo=cloudflare)](https://workers.cloudflare.com/)

**[🚀 View Live Demo](https://amirhosseinjpl.github.io/YOUR_REPO_NAME/)**

A serverless application for processing, testing, filtering, and hosting proxy configurations (VLESS, VMESS, Trojan, etc.) directly on Cloudflare Workers.

---

## Architecture Overview

```text
+-------------------+       Real Ping Test (< 700ms)     +-------------------+
|   User Browser    | -----------------------------> |   Proxy Servers   |
|  (Client Network) | <----------------------------- | (VLESS, VMESS...) |
+-------------------+          Success/Fail          +-------------------+
          |
          | Transmit Functional Configs Only
          v
+-------------------+       Store Base64 & TTL       +-------------------+
| Cloudflare Worker | -----------------------------> |    KV Database    |
|   (JPL Backend)   | <----------------------------- |   (sub:id links)  |
+-------------------+        Generate Sub Link       +-------------------+
```
## Core Logic: Why Client-Side Testing?
In restrictive network environments, testing configurations directly from a server (like a Cloudflare Worker) often yields inaccurate results due to IP blocking. Furthermore, if users access the Cloudflare domain through an active VPN to bypass these blocks, any server-side ping would simply reflect the VPN's latency rather than their true connection speed.

To solve this, the latency test runs purely on the client side (in the browser). It evaluates the configurations using the user's actual, direct network connection. Any configuration with a response time over 700ms or a timeout is instantly dropped. Only verified, functional configurations are sent to the Worker to generate the final subscription link.

## Features
Client-Side Latency Testing: Filters out dead or slow configurations (> 700ms) based on real user network conditions before saving.

Protocol Filtering: Selectively keep only the protocols you actually need.

Dynamic IP Replacement: Swap configuration IPs with custom addresses or predefined CDN ranges (Cloudflare, Gcore, Fastly).

Automated Renaming: Apply custom prefixes to your output configurations dynamically.

Subscription Expiration (TTL): Set expiration times for generated links to maintain a clean and efficient database.

## Deployment Guide
Create a new Worker in your Cloudflare dashboard and deploy the main code.

Navigate to Storage & Databases > KV and create a new namespace.

Bind the created KV namespace to your Worker. The variable name must be exactly JPL_KV.

Note on Restricted Domains: > If workers.dev domains are blocked in your region, you can easily host the frontend interface (index.html) independently on platforms like GitHub Pages. Simply update the WORKER_URL variable within the HTML file to point to your Cloudflare Worker URL. This separates the UI from the backend, allowing users to run the ping test and generate links without hitting domain restrictions.

## License
This project is open-source and available under the MIT License.
