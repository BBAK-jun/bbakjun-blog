// Re-export all UI components from @repo/ui
export {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  badgeVariants,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
} from '@repo/ui';

// Re-export types with proper naming
export type { BadgeProps, ButtonProps, InputProps, TextareaProps } from '@repo/ui';

// Export custom components specific to blog-admin
export { default as DeleteConfirmModal } from '@/shared/ui/modal/delete-confirm-modal';
export { default as ImageUploader } from '@/shared/ui/image-uploader/image-uploader';
export { MarkdownEditor } from '@/shared/ui/markdown-editor/markdown-editor';
export { TagInput } from '@/shared/ui/tag-input/tag-input';
