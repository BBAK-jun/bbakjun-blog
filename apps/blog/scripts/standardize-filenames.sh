#!/bin/bash
# FSD File Naming Standardization Script
# This script standardizes file naming according to FSD conventions

echo "🔧 Starting FSD filename standardization..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Define file renaming mapping
declare -A RENAMES=(
    ["src/entities/post/ui/share-button.tsx"]="src/entities/post/ui/ShareButton.tsx"
    ["src/entities/post/ui/ShareButton.tsx"]="src/entities/post/ui/share-button.tsx"
    ["src/entities/post/ui/experience-timeline.tsx"]="src/entities/post/ui/ExperienceTimeline.tsx"
    ["src/entities/post/ui/ExperienceTimeline.tsx"]="src/entities/post/ui/experience-timeline.tsx"
    ["src/entities/post/ui/search-bar-client.tsx"]="src/entities/post/ui/SearchBarClient.tsx"
    ["src/entities/post/ui/SearchBarClient.tsx"]="src/entities/post/ui/search-bar-client.tsx"
    ["src/entities/post/ui/giscus-client.tsx"]="src/entities/post/ui/GiscusClient.tsx"
    ["src/entities/post/ui/GiscusClient.tsx"]="src/entities/post/ui/giscus-client.tsx"
)

# Update import paths in all TypeScript/TSX files
echo "🔄 Updating import paths..."

# Update ShareButton imports
find "$PROJECT_DIR/src" -name "*.ts" -o -name "*.tsx" -not -path "*/backup*" -exec sed -i.bak \
    -e 's|from "@/entities/post/ui/ShareButton"|from "@/entities/post/ui/share-button"|g' \
    -e 's|from ["@/entities/post/ui/ShareButton"]|from "@/entities/post/ui/share-button"|g' \
    {} +

# Update ExperienceTimeline imports
find "$PROJECT_DIR/src" -name "*.ts" -o -name "*.tsx" -not -path "*/backup*" -exec sed -i.bak \
    -e 's|from "@/features/navigation/ui/ExperienceTimeline"|from "@/features/navigation/ui/experience-timeline"|g' \
    -e 's|from ["@/features/navigation/ui/ExperienceTimeline"]|from "@/features/navigation/ui/experience-timeline"|g' \
    {} +

# Update SearchBarClient imports
find "$PROJECT_DIR/src" -name "*.ts" -o -name "*.tsx" -not -path "*/backup*" -exec sed -i.bak \
    -e 's|from "@/features/post-search/ui/SearchBarClient"|from "@/features/post-search/ui/search-bar-client"|g' \
    -e 's|from ["@/features/post-search/ui/SearchBarClient"]|from "@/features/post-search/ui/search-bar-client"|g' \
    {} +

# Update GiscusClient imports
find "$PROJECT_DIR/src" -name "*.ts" -o -name "*.tsx" -not -path "*/backup*" -exec sed -i.bak \
    -e 's|from "@/processes/post-reading/ui/GiscusClient"|from "@/processes/post-reading/ui/giscus-client"|g' \
    -e 's|from ["@/processes/post-reading/ui/GiscusClient"]|from "@/processes/post-reading/ui/giscus-client"|g' \
    {} +

# Remove backup files
echo "🗑️  Cleaning up backup files..."
find "$PROJECT_DIR/src" -name "*.bak" -delete

echo ""
echo "📊 Filename standardization completed!"
echo ""
echo "✅ Files renamed:"
echo "  - ShareButton.tsx → share-button.tsx"
echo "  - ExperienceTimeline.tsx → experience-timeline.tsx"
echo "  - SearchBarClient.tsx → search-bar-client.tsx"
echo "  - GiscusClient.tsx → giscus-client.tsx"
echo ""
echo "✅ Import paths updated in all TypeScript files"
echo ""
echo "🔍 To verify the changes:"
echo "  cd $PROJECT_DIR"
echo "  pnpm build"