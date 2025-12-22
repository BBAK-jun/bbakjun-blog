import { ClassValue } from 'clsx';
import '@radix-ui/react-avatar';
import '@radix-ui/react-separator';
import '@radix-ui/react-slot';
import 'class-variance-authority';
import 'lucide-react';
import 'tailwind-merge';
import 'uuid';

declare function cn(...inputs: ClassValue[]): string;

export { cn };
