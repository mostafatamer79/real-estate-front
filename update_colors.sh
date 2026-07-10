#!/bin/bash
sed -i 's/--background: .*/--background: #ffffff;/' app/globals.css
sed -i 's/--card: oklch(1 0 0);/--card: #ffffff;/' app/globals.css
sed -i 's/--popover: oklch(1 0 0);/--popover: #ffffff;/' app/globals.css
sed -i 's/--secondary: oklch(0.94 0.005 264);/--secondary: #f8fafc;/' app/globals.css
sed -i 's/--muted: oklch(0.94 0.005 264);/--muted: #f1f5f9;/' app/globals.css
sed -i 's/--accent: oklch(0.94 0.005 264);/--accent: #f8fafc;/' app/globals.css
sed -i 's/--border: oklch(0.9 0.005 264);/--border: #e2e8f0;/' app/globals.css
sed -i 's/--input: oklch(0.9 0.005 264);/--input: #f8fafc;/' app/globals.css
sed -i 's/--sidebar: oklch(1 0 0 \/ 95%);/--sidebar: #ffffff;/' app/globals.css
