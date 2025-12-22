#!/bin/bash
# FSD Import Path Fixing Script
# This script fixes @/components/ import violations

echo "🔧 Starting FSD import path fixes..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Count violations before fixing
VIOLATIONS_BEFORE=$(grep -r "from '@/components/'" "$PROJECT_DIR/src" --include="*.ts" --include="*.tsx" | wc -l)
echo "Found $VIOLATIONS_BEFORE import violations to fix"

# Create backup
echo "📦 Creating backup..."
cp -r "$PROJECT_DIR/src" "$PROJECT_DIR/src.backup.$(date +%Y%m%d_%H%M%S)"

# Fix shared UI imports (Button, Card, Badge, etc.)
echo "🔄 Fixing shared UI imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/ui/button"|from "@/shared/ui/button"|g' \
  -e 's|from "@/components/ui/card"|from "@/shared/ui/card"|g' \
  -e 's|from "@/components/ui/badge"|from "@/shared/ui/badge"|g' \
  -e 's|from "@/components/ui/separator"|from "@/shared/ui/separator"|g' \
  -e 's|from "@/components/ui/tabs"|from "@/shared/ui/tabs"|g' \
  -e 's|from "@/components/ui/input"|from "@/shared/ui/input"|g' \
  -e 's|from "@/components/ui/avatar"|from "@/shared/ui/avatar"|g' \
  -e 's|from "@/components/ui/skeleton"|from "@/shared/ui/skeleton"|g' {} +

# Fix feature component imports
echo "🔄 Fixing feature component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/ExperienceTimeline"|from "@/features/navigation"|g' \
  -e 's|from "@/components/NewsletterSubscribe"|from "@/features/newsletter"|g' \
  -e 's|from "@/components/SearchBarClient"|from "@/features/post-search"|g' \
  -e 's|from "@/components/BlogPostsList"|from "@/features/posts"|g' {} +

# Fix entity component imports
echo "🔄 Fixing entity component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/PostCard"|from "@/entities/post/ui"|g' \
  -e 's|from "@/components/RelatedPosts"|from "@/entities/post/ui"|g' \
  -e 's|from "@/components/SeriesNavigation"|from "@/entities/post/ui"|g' \
  -e 's|from "@/components/ShareButton"|from "@/entities/post/ui"|g' \
  -e 's|from "@/components/ViewCounter"|from "@/entities/view/ui"|g' {} +

# Fix shared component imports
echo "🔄 Fixing shared component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/ErrorBoundary"|from "@/shared/ui/error-boundary"|g' \
  -e 's|from "@/components/CodeBlockWrapper"|from "@/shared/ui/code-block-wrapper"|g' \
  -e 's|from "@/components/CodeCopyButton"|from "@/shared/ui/code-copy-button"|g' {} +

# Fix process component imports
echo "🔄 Fixing process component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/ReadingProgress"|from "@/processes/post-reading/ui"|g' \
  -e 's|from "@/components/MermaidRenderer"|from "@/processes/post-reading/ui"|g' \
  -e 's|from "@/components/TableOfContents"|from "@/processes/post-reading/ui"|g' \
  -e 's|from "@/components/Comments"|from "@/processes/post-reading/ui"|g' {} +

# Fix widget component imports
echo "🔄 Fixing widget component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/PopularPosts"|from "@/widgets/popular-posts/ui"|g' \
  -e 's|from "@/components/PopularPostsGrid"|from "@/widgets/popular-posts/ui"|g' {} +

# Fix streaming component imports (move to processes)
echo "🔄 Fixing streaming component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/StreamingRecentPosts"|from "@/processes/streaming-posts/ui"|g' \
  -e 's|from "@/components/StreamingPopularPostsGrid"|from "@/processes/streaming-posts/ui"|g' \
  -e 's|from "@/components/PostCardSkeleton"|from "@/shared/ui/post-card-skeleton"|g' \
  -e 's|from "@/components/PopularPostSkeleton"|from "@/shared/ui/popular-post-skeleton"|g' {} +

# Fix skeleton component imports
echo "🔄 Fixing skeleton component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/ui/skeleton"|from "@/shared/ui/skeleton"|g' {} +

# Fix remaining component imports with case-sensitive handling
echo "🔄 Fixing remaining component imports..."
find "$PROJECT_DIR/src" -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i.bak \
  -e 's|from "@/components/PostContent"|from "@/entities/post/ui/post-content"|g' \
  -e 's|from "@/components/PostSidebar"|from "@/processes/post-reading/ui/post-sidebar"|g' \
  -e 's|from "@/components/StreamingRelatedPosts"|from "@/processes/post-reading/ui/streaming-related-posts"|g' \
  -e 's|from "@/components/StreamingSeriesNavigation"|from "@/processes/post-reading/ui/streaming-series-navigation"|g' {} +

# Remove backup files
echo "🗑️  Cleaning up backup files..."
find "$PROJECT_DIR/src" -name "*.bak" -delete

# Count violations after fixing
VIOLATIONS_AFTER=$(grep -r "from '@/components/'" "$PROJECT_DIR/src" --include="*.ts" --include="*.tsx" | wc -l)

echo "✅ Import path fixing completed!"
echo "📊 Before: $VIOLATIONS_BEFORE violations"
echo "📊 After: $VIOLATIONS_AFTER violations"

if [ $VIOLATIONS_AFTER -gt 0 ]; then
  echo "⚠️  Still have $VIOLATIONS_AFTER violations - manual review needed:"
  grep -r "from '@/components/'" "$PROJECT_DIR/src" --include="*.ts" --include="*.tsx"
else
  echo "🎉 All import violations fixed!"
fi