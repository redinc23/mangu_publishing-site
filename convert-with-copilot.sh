#!/bin/bash

# Script to use GitHub Copilot CLI for batch HTML to React conversion
# Usage: ./convert-with-copilot.sh

HTML_DIR="/Users/redinc23gmail.com/projects/samples/new_halloween-Publishing"
OUTPUT_DIR="/Users/redinc23gmail.com/.cursor/worktrees/mangu2-publishing/z4zxv/client/src/pages"

echo "🚀 Starting batch conversion with GitHub Copilot CLI..."
echo ""

# Check if copilot is installed
if ! command -v copilot &> /dev/null; then
    echo "❌ GitHub Copilot CLI not found. Install with: npm install -g @github/copilot"
    exit 1
fi

# List of HTML files to convert (priority order)
files=(
    "events_hub_v1.html"
    "events_detail_v1.html"
    "authors_hub_v1.html"
    "author_detail_v1.html"
    "author_portal_dashboard.html"
    "author_portal_submit.html"
    "series_hub_v1.html"
    "genres_hub_v1.html"
    "store_hub_v1.html"
    "newsletter_signup.html"
)

for file in "${files[@]}"; do
    if [ -f "$HTML_DIR/$file" ]; then
        echo "📄 Processing: $file"
        
        # Create a prompt for Copilot
        prompt="Convert the HTML file at $HTML_DIR/$file to a React component. 
        - Create a new React component file in $OUTPUT_DIR
        - Extract and create a separate CSS file
        - Use React hooks (useState, useEffect) where needed
        - Replace all href='#' with React Router Link components
        - Convert inline styles to CSS classes
        - Follow the same pattern as AboutPage.jsx and BlogHubPage.jsx
        - Name the component based on the file name (e.g., events_hub_v1.html -> EventsHubPage.jsx)"
        
        echo "🤖 Asking Copilot to convert $file..."
        copilot "$prompt"
        
        echo "✅ Completed: $file"
        echo ""
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 Batch conversion complete!"

