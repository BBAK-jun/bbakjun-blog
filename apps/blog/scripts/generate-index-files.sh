#!/bin/bash
# FSD Index File Generation Script
# This script automatically generates index.ts files for FSD layers

echo "🔧 Starting FSD index file generation..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_DIR/src"

# FSD layer directories
FSD_LAYERS=("entities" "features" "shared" "processes" "widgets")

# Create index file for a directory
create_index_file() {
    local dir_path="$1"
    local index_file="$dir_path/index.ts"

    if [ -f "$index_file" ]; then
        echo "  ✅ Index exists: $index_file"
        return 0
    fi

    echo "  📝 Creating: $index_file"

    # Find all TypeScript/React files in the directory (excluding index files)
    local files=$(find "$dir_path" -maxdepth 1 -name "*.ts" -o -name "*.tsx" | grep -v "index.ts" | grep -v "index.tsx" | sort)

    if [ -z "$files" ]; then
        # Empty index file for directories with no direct files
        cat > "$index_file" << 'EOF'
// Public API
EOF
        return 0
    fi

    # Generate exports based on file patterns
    cat > "$index_file" << 'EOF'
// Public API
EOF

    while IFS= read -r file; do
        if [ -n "$file" ]; then
            local basename=$(basename "$file" | sed 's/\.[^.]*$//')
            local dirname=$(basename "$dir_path")

            # Determine export type based on file content
            if grep -q "export default" "$file" 2>/dev/null; then
                # Default export
                echo "export { default as $basename } from './$basename'" >> "$index_file"
            fi

            # Named exports (exclude type-only exports for cleaner API)
            if grep -q "export const\|export function\|export class\|export enum\|export interface" "$file" 2>/dev/null; then
                echo "export * from './$basename'" >> "$index_file"
            fi
        fi
    done <<< "$files"
}

# Generate index files for all FSD layers
echo "📚 Scanning FSD structure..."

for layer in "${FSD_LAYERS[@]}"; do
    layer_dir="$SRC_DIR/$layer"

    if [ ! -d "$layer_dir" ]; then
        echo "  ⚠️  Layer directory not found: $layer_dir"
        continue
    fi

    echo "  📁 Processing layer: $layer"

    # Create index for the layer root
    create_index_file "$layer_dir"

    # Find all subdirectories and create index files
    find "$layer_dir" -type d -not -path "$layer_dir" | while read -r subdir; do
        if [ -n "$subdir" ]; then
            create_index_file "$subdir"
        fi
    done
done

echo ""
echo "🎉 FSD index file generation completed!"
echo ""
echo "📊 Generated index files:"
find "$SRC_DIR" -name "index.ts" | wc -l | xargs echo "  Total index files:"
echo ""
echo "🔍 To verify the index files work correctly:"
echo "  cd $PROJECT_DIR"
echo "  pnpm build"