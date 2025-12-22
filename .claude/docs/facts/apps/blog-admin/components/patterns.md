# Reusable Component Patterns

- **Scope**: Common patterns and conventions for components
- **Source of Truth**: Implementation patterns across layers
- **Last Verified**: 2025-12-22
- **Repo Ref**: blog-admin (monorepo)

## Form Patterns

### React Hook Form + Zod Integration

- **Location**: Used throughout features layer
- **Purpose**: Type-safe form handling with validation
- **Key Details**:
  - Zod schemas for type-safe validation
  - React Hook Form for form state management
  - Server Actions for form submission
  - Automatic error handling and display
- **Dependencies**:
  - react-hook-form
  - @hookform/resolvers
  - zod
- **Evidence**: Form components in file-create and file-edit features

### Pattern Implementation

```tsx
// Schema definition
const schema = z.object({
  title: z.string().min(1, '제목을 입력해주세요'),
  content: z.string().min(1, '내용을 입력해주세요'),
  tags: z.array(z.string()).optional(),
});

// Form component
export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: FormData) => {
    const result = await createAction(data);
    if (result.success) {
      toast.success('성공적으로 저장되었습니다');
      router.push('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* Form fields */}</form>;
}
```

### Validation Patterns

1. **Client-Side Validation**:
   - Immediate feedback on field blur
   - Real-time validation while typing (optional)
   - Custom validation messages in Korean

2. **Server-Side Validation**:
   - Re-validate all inputs on server
   - Return structured errors
   - Preserve user input on validation failure

3. **Error Display**:
   - Field-level errors below inputs
   - Form-level errors at the top
   - Success messages via toast notifications

## Modal Patterns

### Overlay Kit Integration

- **Location**: Used in widgets and features
- **Purpose**: Dynamic modal management without prop drilling
- **Key Details**:
  - Declarative modal opening
  - Automatic backdrop and focus management
  - Support for nested modals
  - Clean up on unmount
- **Dependencies**: overlay-kit
- **Evidence**: Delete confirmation modals throughout the app

### Pattern Implementation

```tsx
// Modal usage in components
const handleDeleteClick = (item: Item) => {
  import('overlay-kit').then(({ overlay }) => {
    overlay.open(({ isOpen, close }) => (
      <ConfirmModal
        isOpen={isOpen}
        onClose={close}
        onConfirm={() => {
          deleteItem(item.id);
          close();
        }}
        itemName={item.name}
      />
    ));
  });
};
```

### Modal Best Practices

1. **Lazy Loading**: Always lazy load modals for performance
2. **Focus Management**: Trap focus within modal
3. **Escape Key**: Allow closing with ESC key
4. **Backdrop Click**: Close modal on backdrop click (optional)
5. **Loading States**: Show loading state during async operations

## Loading States

### Skeleton Patterns

- **Location**: Widget and feature components
- **Purpose**: Visual feedback during data loading
- **Key Details**:
  - Skeleton shapes matching content structure
  - Shimmer animation
  - Responsive design
- **Implementation**: Custom skeleton components using Tailwind

```tsx
// Skeleton example
<div className="animate-pulse">
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
</div>
```

### Spinner Patterns

- **Primary Spinner**: Lucide's `Loader2` with `animate-spin`
- **Button Loading**: Disable button, show spinner inline
- **Overlay Loading**: Full component overlay with backdrop

```tsx
// Button loading state
<button disabled={isLoading} className="...">
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      처리 중...
    </>
  ) : (
    '제출'
  )}
</button>
```

## Error Handling Patterns

### Error Boundaries

- **Location**: Widget level
- **Purpose**: Catch and handle React errors gracefully
- **Key Details**:
  - Try-catch at component boundaries
  - User-friendly error messages
  - Recovery options
  - Error logging

```tsx
// Error boundary pattern
try {
  return <Component />;
} catch (error) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <AlertCircle className="w-5 h-5 text-red-600 mb-2" />
      <p className="text-red-600 dark:text-red-400">오류가 발생했습니다. 새로고침해주세요.</p>
      <button onClick={() => window.location.reload()}>새로고침</button>
    </div>
  );
}
```

### Error Message Types

1. **Network Errors**: Connection issues, timeouts
2. **Validation Errors**: Invalid input data
3. **Permission Errors**: Unauthorized access
4. **Server Errors**: 500+ status codes
5. **Unknown Errors**: Unexpected issues

### Toast Notifications

- **Success**: Green toast with check icon
- **Error**: Red toast with X icon
- **Warning**: Yellow toast with warning icon
- **Info**: Blue toast with info icon

## Composition Patterns

### Widget Composition

- **Location**: Widgets layer
- **Purpose**: Combine multiple features into cohesive UI
- **Key Details**:
  - Feature state management at widget level
  - Props drilling minimized through composition
  - Cross-feature communication
- **Evidence**: FileManagerWidget combines file-search, file-filter, file-delete

```tsx
// Widget composition example
export function FileManagerWidget() {
  // Entity data
  const { data: files, isLoading } = useFilesQuery();

  // Feature hooks
  const { searchQuery, setSearchQuery } = useFileSearch(files);
  const { filteredFiles } = useFileFilter(files, searchQuery);
  const { deleteFile } = useFileDelete();

  // Render composed UI
  return (
    <div>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FileList files={filteredFiles} onDelete={deleteFile} />
    </div>
  );
}
```

### Feature Composition

- **Location**: Features layer
- **Purpose**: Combine entities and shared components
- **Key Details**:
  - Business logic encapsulation
  - Reusable across widgets
  - Independent state management

### Entity Composition

- **Location**: Entities layer
- **Purpose**: Core data representation
- **Key Details**:
  - Pure data models
  - API integration
  - No UI-specific logic

## Data Fetching Patterns

### React Query Integration

- **Location**: Entities and features
- **Purpose**: Server state management
- **Key Details**:
  - Automatic caching and refetching
  - Optimistic updates
  - Error and loading states
  - Pagination support

```tsx
// React Query pattern
export function useFilesQuery() {
  return useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Server Actions

- **Location**: app/actions/
- **Purpose**: Server-side mutations
- **Key Details**:
  - Type-safe server functions
  - Automatic validation
  - Error handling
  - Progressive enhancement

## Event Handling Patterns

### Debounced Search

- **Location**: Search features
- **Purpose**: Reduce API calls during search
- **Implementation**: Custom debounce hook or lodash

```tsx
// Debounced search pattern
const debouncedSearch = useMemo(
  () =>
    debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
  []
);
```

### Optimistic Updates

- **Location**: Mutation operations
- **Purpose**: Improve perceived performance
- **Key Details**:
  - Update UI immediately
  - Rollback on error
  - Toast notifications

## Styling Patterns

### Component Variants

- **Location**: Shared components
- **Purpose**: Multiple visual variants
- **Implementation**: Tailwind classes or variant libraries

```tsx
// Button variants pattern
const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

// Usage
<button className={buttonVariants[type]}>{children}</button>;
```

### Responsive Design

- **Mobile-first approach**
- `sm:` for small screens (640px+)
- `md:` for medium screens (768px+)
- `lg:` for large screens (1024px+)
- `xl:` for extra large screens (1280px+)

## Accessibility Patterns

### Focus Management

1. **Visible Focus**: Always show focus states
2. **Skip Links**: Add skip navigation for large pages
3. **Focus Trapping**: Modals trap focus internally
4. **Focus Restoration**: Return focus to trigger after modal close

### ARIA Patterns

```tsx
// ARIA example
<button
  aria-label="파일 삭제"
  aria-describedby="delete-warning"
  aria-expanded={isModalOpen}
>
  <Trash2 className="w-4 h-4" />
</button>
<div id="delete-warning" className="sr-only">
  이 작업은 되돌릴 수 없습니다
</div>
```

## Performance Patterns

### Code Splitting

- **Route-based**: Automatic with Next.js
- **Component-based**: Lazy load heavy components
- **Feature-based**: Dynamic imports for optional features

```tsx
// Lazy loading pattern
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Usage with Suspense
<Suspense fallback={<div>로딩 중...</div>}>
  <HeavyComponent />
</Suspense>;
```

### Memoization

- **React.memo**: Prevent unnecessary re-renders
- **useMemo**: Cache expensive calculations
- **useCallback**: Stable function references

```tsx
// Memoization pattern
const MemoizedComponent = React.memo(({ data }) => {
  const expensiveValue = useMemo(() => {
    return processLargeData(data);
  }, [data]);

  return <div>{expensiveValue}</div>;
});
```
