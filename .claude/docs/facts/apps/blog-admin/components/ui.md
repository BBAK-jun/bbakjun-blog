# Shared UI Components

- **Scope**: Reusable UI components in src/shared/ui/
- **Source of Truth**: src/shared/ui/ directory structure
- **Last Verified**: 2025-12-22
- **Repo Ref**: blog-admin (monorepo)

## ImageUploader

- **Location**: `src/shared/ui/image-uploader/image-uploader.tsx`
- **Purpose**: Drag-and-drop image upload component with preview
- **Key Details**:
  - Supports drag-and-drop and click-to-upload
  - File type validation (images only)
  - Upload progress indication
  - Error handling with user feedback
- **Props**:
  - `onImageUploaded: (url: string, filename: string) => void` - Callback on successful upload
- **Dependencies**:
  - Server action: `uploadImage` from `@/app/actions/files`
  - Icons: Lucide React (Upload, Image, X, Loader2)
- **Evidence**: Handles both file input and drag-drop events with visual feedback

```tsx
interface ImageUploaderProps {
  onImageUploaded: (url: string, filename: string) => void;
}
```

**Features**:

- Drag-and-drop visual feedback
- Loading state with spinner
- Error message display
- File type validation
- Size limit: 5MB
- Supported formats: PNG, JPG, GIF, WebP

## MarkdownEditor

- **Location**: `src/shared/ui/markdown-editor/markdown-editor.tsx`
- **Purpose**: Full-featured markdown editor with toolbar and shortcuts
- **Key Details**:
  - CodeMirror-based editor with syntax highlighting
  - Rich toolbar for common markdown operations
  - Keyboard shortcuts (Cmd/Ctrl+B, I, K, Shift+Cmd/Ctrl combinations)
  - Dark mode support with automatic theme detection
  - Drag-and-drop image upload support
- **Props**:
  - `value: string` - Current markdown content
  - `onChange: (value: string) => void` - Content change handler
  - `placeholder?: string` - Input placeholder text
  - `height?: string` - Editor height (default: "400px")
  - `onImageClick?: () => void` - Custom image button handler
  - `onImageDrop?: (file: File) => Promise<string | void>` - Custom image drop handler
- **Dependencies**:
  - @uiw/react-codemirror
  - @codemirror/lang-markdown
  - @codemirror/theme-one-dark
  - Lucide React icons
- **Evidence**: Comprehensive toolbar with 11 markdown formatting buttons

```tsx
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  onImageClick?: () => void;
  onImageDrop?: (file: File) => Promise<string | void>;
}
```

**Toolbar Features**:

- Headings (H1, H2, H3)
- Text formatting (bold, italic)
- Links and images
- Code blocks and inline code
- Quotes
- Lists (ordered and unordered)

**Keyboard Shortcuts**:

- `Cmd/Ctrl+B`: Bold
- `Cmd/Ctrl+I`: Italic
- `Cmd/Ctrl+K`: Link
- `Shift+Cmd/Ctrl+C`: Inline code
- `Shift+Cmd/Ctrl+K`: Code block
- `Shift+Cmd/Ctrl+I`: Image

## TagInput

- **Location**: `src/shared/ui/tag-input/tag-input.tsx`
- **Purpose**: Multi-select tag input component
- **Key Details**:
  - Add tags by typing and pressing Enter or comma
  - Visual tag display with remove buttons
  - Duplicate prevention
  - Backspace to remove last tag
- **Props**:
  - `value: string[]` - Array of selected tags
  - `onChange: (tags: string[]) => void` - Tag change handler
  - `placeholder?: string` - Input placeholder
  - `className?: string` - Additional CSS classes
- **Dependencies**: Lucide React (X icon)
- **Evidence**: Handles keyboard events for tag management and visual tag rendering

```tsx
interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}
```

**Features**:

- Tag visualization with pills
- Individual tag removal
- Add tags via Enter key or comma
- Auto-trim whitespace
- Remove last tag with backspace on empty input
- Custom styling support

## DeleteConfirmModal

- **Location**: `src/shared/ui/modal/delete-confirm-modal.tsx`
- **Purpose**: Confirmation modal for destructive actions
- **Key Details**:
  - Full-screen overlay with backdrop blur
  - Warning message with filename display
  - Cancel and confirm actions
  - Loading state during deletion
- **Props**:
  - `isOpen: boolean` - Modal visibility
  - `onClose: () => void` - Close handler
  - `onConfirm: () => void` - Confirm handler
  - `fileName: string` - Name of file to delete
  - `isDeleting?: boolean` - Deletion in progress state
- **Dependencies**: Lucide React (AlertCircle, X)
- **Evidence**: Renders null when not open, fixed positioning for overlay

```tsx
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  isDeleting?: boolean;
}
```

**Features**:

- Backdrop blur effect
- Warning icon and styling
- File name in monospace font
- Disabled state during deletion
- Loading spinner animation
- Keyboard ESC to close (inherited)

## Toaster

- **Location**: `src/shared/ui/toaster.tsx`
- **Purpose**: Global toast notification system
- **Key Details**:
  - Sonner-based toast implementation
  - Theme-aware styling (light/dark)
  - Multiple toast types (success, error, warning, info)
  - Auto-dismiss with close button
- **Props**: None (configured via props)
- **Dependencies**:
  - sonner (SonnerToaster)
  - next-themes (useTheme hook)
- **Evidence**: Positioned at top-right with custom styling

**Features**:

- Toast type-specific styling
- Rich colors support
- Close button
- Expandable toast messages
- Theme integration
- Position: top-right

## Styling System

### Common Patterns

All shared components follow consistent styling patterns:

1. **Color Scheme**:
   - Primary: Slate (50-900)
   - Interactive: Blue (50-900)
   - Success: Green (50-900)
   - Error/Destructive: Red (50-900)

2. **Border Radius**:
   - Small: `rounded` (4px)
   - Medium: `rounded-lg` (8px)
   - Large: `rounded-xl` (12px)

3. **Spacing**:
   - Tight: `gap-1` to `gap-2` (4px-8px)
   - Normal: `gap-3` to `gap-4` (12px-16px)
   - Loose: `gap-6` to `gap-8` (24px-32px)

4. **Typography**:
   - Body: `text-sm`
   - Small: `text-xs`
   - Medium: `text-base`
   - Large: `text-lg`

5. **Transitions**:
   - Default: `transition-colors`
   - Hover states on all interactive elements

### Dark Mode Support

All components support dark mode via Tailwind dark prefixes:

- Backgrounds: `bg-white dark:bg-slate-900`
- Text: `text-slate-900 dark:text-white`
- Borders: `border-slate-200 dark:border-slate-600`
- Hover states: `hover:bg-slate-50 dark:hover:bg-slate-800`

## Accessibility Features

### Keyboard Navigation

- All inputs keyboard accessible
- Tab order logical
- Focus states visible
- Modals trap focus

### ARIA Support

- Semantic HTML elements
- Proper button types
- Label associations
- Error announcements

### Visual Accessibility

- High contrast ratios
- Clear visual hierarchy
- Loading states communicated
- Error states clearly marked

## Usage Patterns

### Form Integration

```tsx
// TagInput in forms
<div className="form-group">
  <label>Tags</label>
  <TagInput value={tags} onChange={setTags} placeholder="Add tags..." />
</div>
```

### Modal Usage

```tsx
// Lazy-loaded modal for performance
const DeleteConfirmModal = lazy(() =>
  import('@/shared/ui/modal').then(m => ({ default: m.DeleteConfirmModal }))
);
```

### Editor Integration

```tsx
// MarkdownEditor with image upload
<MarkdownEditor
  value={content}
  onChange={setContent}
  onImageDrop={handleImageUpload}
  height="500px"
/>
```

## Best Practices

1. **Composition over Inheritance**: Components are designed to be composable
2. **Controlled Components**: All form inputs are controlled components
3. **Error Boundaries**: Each component handles its own error states
4. **Performance**: Lazy loading for heavy components like modals
5. **Consistency**: All components follow the same styling and interaction patterns
