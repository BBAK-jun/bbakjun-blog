# Components Architecture Overview

- **Scope**: Component architecture following FSD (Feature-Sliced Design) layers
- **Source of Truth**: FSD layers structure in src/
- **Last Verified**: 2025-12-22
- **Repo Ref**: blog-admin (monorepo)

## FSD Layers Overview

### Shared Layer (`src/shared/`)

- **Location**: `src/shared/ui/`
- **Purpose**: Reusable UI components and utilities that can be used across all features
- **Key Details**:
  - Generic UI components without business logic
  - Styling utilities and configuration
  - Shared hooks and libraries
- **Dependencies**: External libraries (next-themes, sonner, overlay-kit)
- **Evidence**: `src/shared/ui/` contains generic components like ImageUploader, MarkdownEditor, TagInput

### Entities Layer (`src/entities/`)

- **Location**: `src/entities/*/ui/`
- **Purpose**: Core business entities and their UI representations
- **Key Details**:
  - File entity with list item component
  - Frontmatter entity for MDX metadata
  - Session entity for authentication
  - Contains model types and API logic
- **Dependencies**: Shared layer components, external APIs
- **Evidence**: `src/entities/file/ui/file-list-item.tsx` represents the File entity

### Features Layer (`src/features/`)

- **Location**: `src/features/*/ui/`
- **Purpose**: Specific user features or use cases
- **Key Details**:
  - Feature-specific components with business logic
  - Each feature is a self-contained unit
  - Features can use multiple entities
  - Includes feature-specific state management
- **Dependencies**: Entities layer, Shared layer
- **Evidence**: `src/features/file-create/ui/category-selector.tsx` handles category selection for file creation

### Widgets Layer (`src/widgets/`)

- **Location**: `src/widgets/*/ui/`
- **Purpose**: Complete UI pages or large sections composed of features and entities
- **Key Details**:
  - Combines multiple features into cohesive UI
  - Manages layout and composition
  - Handles cross-feature interactions
  - Route-level components
- **Dependencies**: Features layer, Entities layer
- **Evidence**: `src/widgets/file-manager/ui/file-manager-widget.tsx` composes file features

## Component Hierarchy

```
Pages (app router)
  └── Widgets
      └── Features
          └── Entities
              └── Shared
```

### Widget Composition Pattern

- **File Manager Widget** (`src/widgets/file-manager/`):
  - Uses: file-search, file-filter, file-delete features
  - Uses: file entity
  - Uses: format utilities from shared layer

- **File Creator Widget** (`src/widgets/file-creator/`):
  - Uses: file-create feature
  - Uses: frontmatter entity
  - Uses: shared UI components (MarkdownEditor, TagInput, ImageUploader)

- **File Viewer Widget** (`src/widgets/file-viewer/`):
  - Uses: file-edit feature
  - Uses: file entity
  - Uses: shared MarkdownEditor

## Naming Conventions

### File Naming

- **Components**: kebab-case with `Component` suffix (e.g., `file-list-item.tsx`)
- **Features**: feature-name with descriptive sub-components
- **Widgets**: widget-name with `-widget.tsx` suffix
- **Shared UI**: descriptive names without prefixes (e.g., `tag-input.tsx`)

### Directory Structure

```
[layer]/[domain]/
  ├── model/     - Types, interfaces, business logic
  ├── api/       - API calls for entities
  ├── lib/       - Utilities specific to domain
  └── ui/        - React components
```

## Import Patterns

### Allowed Dependencies

- **Widgets** → Features → Entities → Shared
- **Features** → Entities → Shared
- **Entities** → Shared
- **Shared** → External libraries only

### Import Examples

```typescript
// Widget importing features
import { useFileSearch } from '@/features/file-search';
import { useFileFilter } from '@/features/file-filter';

// Feature importing entities
import { type BlobFile } from '@/entities/file';

// Any layer importing shared
import { TagInput } from '@/shared/ui/tag-input';
import { formatFileSize } from '@/shared/lib/format';
```

## State Management Patterns

### Entity State

- Managed at entity level
- React Query for server state
- Example: `useFilesQuery()` in file entity

### Feature State

- Local to feature
- Custom hooks for feature logic
- Example: `useFileSearch()` hook with search state

### Widget State

- Composes feature and entity states
- Handles cross-feature interactions
- Example: FileManagerWidget orchestrates multiple features

## Styling Approach

### Tailwind CSS v4

- Utility-first CSS
- Dark mode support via `dark:` prefixes
- Consistent color scheme:
  - Slate: primary colors (slate-50 to slate-900)
  - Blue: interactive elements (blue-50 to blue-900)
  - Red: destructive actions (red-50 to red-900)
  - Green: success states (green-50 to green-900)

### Component Styling Patterns

```tsx
// Standard component styling
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg">
  {/* Content */}
</div>

// Interactive element
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
  {/* Button content */}
</button>

// Form input
<input className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500" />
```

## Accessibility Features

### Keyboard Navigation

- All interactive elements keyboard accessible
- Focus management in modals
- Keyboard shortcuts in MarkdownEditor (Cmd/Ctrl+B, I, K)

### ARIA Support

- Semantic HTML elements
- Proper button types
- Descriptive labels and placeholders
- Screen reader friendly error messages

### Focus Management

- Visible focus states on all interactive elements
- Modal focus trapping
- Skip links consideration

## Composition Patterns

### Feature Composition in Widgets

```tsx
// FileManagerWidget composing multiple features
const { searchQuery, setSearchQuery } = useFileSearch(files);
const { category, setCategory } = useFileFilter(filteredFiles);
const { deleteFile } = useFileDelete();
```

### Shared UI in Features

```tsx
// FileCreator using shared components
<MarkdownEditor value={content} onChange={setContent} />
<TagInput value={tags} onChange={setTags} />
<ImageUploader onImageUploaded={handleImageUpload} />
```

### Entity UI in Features

```tsx
// FileListWidget using entity component
{
  files.map(file => (
    <FileListItem key={file.id} file={file} onView={handleView} onDelete={handleDelete} />
  ));
}
```

## Error Boundaries

- Error boundaries at widget level
- Error states handled internally
- User-friendly error messages
- Recovery options provided

## Performance Considerations

### Code Splitting

- Lazy loading for modals
- Dynamic imports for large components
- Route-based splitting at app level

### Optimizations

- React.memo for expensive components
- Debounced search inputs
- Virtualization for large lists (when needed)

### Bundle Size

- Shared components optimized for reuse
- Feature-based code organization
- Tree-shaking friendly exports
