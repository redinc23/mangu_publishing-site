# MANGU Publishing Component Library

## Overview
This document describes the modern component library and design system implemented for MANGU Publishing.

## 🎨 Design System

### Location
- `src/styles/design-system.css` - Complete design tokens and CSS variables
- `src/styles/animations.css` - Reusable animations and transitions

### Color System
The design system includes comprehensive color palettes:
- **Primary**: Blue shades for main actions
- **Secondary**: Purple shades for secondary actions
- **Success**: Green shades for success states
- **Warning**: Yellow shades for warnings
- **Danger**: Red shades for errors
- **Neutral**: Gray shades for text and backgrounds

### Usage
```jsx
import './styles/design-system.css';

// Use CSS variables in components
<div style={{ color: 'var(--color-primary-600)' }}>
  Primary colored text
</div>
```

## 🧩 Component Library

### Location
All UI components are located in `src/components/ui/`

### Components

#### Button
Full-featured button component with multiple variants and states.

```jsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link'
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `fullWidth`: boolean
- `loading`: boolean
- `disabled`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode

#### Input
Form input component with validation and icons.

```jsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  error="Invalid email"
  leftIcon={<MailIcon />}
  helperText="Enter your email address"
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean

#### Modal
Accessible modal dialog with customizable size and actions.

```jsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
  footer={<Button>Save</Button>}
>
  <p>Modal content goes here</p>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `footer`: ReactNode
- `closeOnOverlayClick`: boolean
- `showCloseButton`: boolean

#### Drawer
Side panel component for navigation or forms.

```jsx
import { Drawer } from '@/components/ui';

<Drawer
  isOpen={isOpen}
  onClose={handleClose}
  title="Settings"
  position="right"
  size="md"
>
  <SettingsForm />
</Drawer>
```

**Props:**
- `isOpen`: boolean
- `onClose`: function
- `title`: string
- `position`: 'left' | 'right' | 'top' | 'bottom'
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `footer`: ReactNode

#### Toast Notifications
Global toast notification system.

```jsx
import { useToast } from '@/components/ui';

function MyComponent() {
  const { toast } = useToast();
  
  return (
    <button onClick={() => toast.success('Saved!')}>
      Save
    </button>
  );
}
```

**Methods:**
- `toast(message, options)` - Default info toast
- `toast.success(message, options)`
- `toast.error(message, options)`
- `toast.warning(message, options)`
- `toast.info(message, options)`

**Options:**
- `title`: string
- `duration`: number (ms) or Infinity

#### DataTable
Sortable, paginated data table component.

```jsx
import { DataTable } from '@/components/ui';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { 
    key: 'status', 
    label: 'Status',
    render: (value) => <Badge>{value}</Badge>
  }
];

<DataTable
  data={users}
  columns={columns}
  sortable
  pagination
  pageSize={10}
/>
```

**Props:**
- `data`: array
- `columns`: array of { key, label, render?, sortable? }
- `sortable`: boolean
- `pagination`: boolean
- `pageSize`: number
- `emptyMessage`: string

#### Loading Skeletons
Skeleton loaders for better perceived performance.

```jsx
import { LoadingSkeleton, BookCardSkeleton } from '@/components/ui';

<LoadingSkeleton variant="text" count={3} />
<BookCardSkeleton />
```

**Variants:**
- `text` - Text line
- `title` - Large title
- `avatar` - Circular avatar
- `button` - Button shape
- `card` - Card shape
- `thumbnail` - Image thumbnail

#### EmptyState
Component for empty state UIs.

```jsx
import { EmptyState } from '@/components/ui';
import { Book } from 'lucide-react';

<EmptyState
  icon={Book}
  title="No books found"
  description="Start by adding your first book"
  action={handleAddBook}
  actionLabel="Add Book"
/>
```

### Theme Toggle
Dark/light mode toggle component.

```jsx
import ThemeToggle from '@/components/ThemeToggle';

<ThemeToggle />
```

## 🎭 Animations

All animations are defined in `src/styles/animations.css` and can be used with utility classes:

```jsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-in-right">Slides from right</div>
<div className="animate-scale-in">Scales in</div>
<div className="hover-lift">Lifts on hover</div>
```

**Available animations:**
- `animate-fade-in` / `animate-fade-out`
- `animate-fade-in-up` / `animate-fade-in-down`
- `animate-slide-in-left` / `animate-slide-in-right`
- `animate-scale-in`
- `animate-bounce`
- `animate-pulse`
- `animate-spin`
- `animate-shimmer` (for skeletons)
- `animate-shake`

**Hover effects:**
- `hover-lift` - Elevates and adds shadow
- `hover-scale` - Scales up slightly
- `hover-glow` - Adds glow effect

## 🎯 Performance Optimizations

### Vite Configuration
The Vite config includes several optimizations:

1. **Code Splitting**: Vendor chunks are split by functionality
2. **Bundle Analysis**: Run `ANALYZE=1 npm run build` to see bundle stats
3. **Tree Shaking**: Unused code is automatically removed
4. **Minification**: Terser minification with console.log removal in production
5. **Asset Optimization**: Organized asset structure with hashing

### Image Optimization
- Use WebP format when possible
- Lazy load images with `loading="lazy"`
- Use responsive images with `srcset`

### Font Loading
- Fonts are preconnected in `index.html`
- Font display is set to `swap` for better performance

### Service Worker
A service worker is registered in production for:
- Offline support
- Asset caching
- API response caching
- Background sync

## 📱 PWA Support

The app includes full PWA support:

1. **Manifest**: `public/manifest.json` defines app metadata
2. **Service Worker**: `public/service-worker.js` handles caching
3. **Icons**: Add 192x192 and 512x512 icons to `/public`

## 🔧 Usage Example

See the complete showcase at `src/pages/ComponentShowcase.jsx`:

```bash
# Start dev server
npm run dev

# Navigate to /showcase to see all components
```

## 📦 Build & Deploy

```bash
# Development
npm run dev

# Build for production
npm run build

# Build with bundle analysis
ANALYZE=1 npm run build

# Preview production build
npm run preview
```

## 🧪 Testing Components

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 📝 Best Practices

1. **Always use design tokens** from `design-system.css` instead of hardcoded values
2. **Leverage existing components** before creating new ones
3. **Use proper semantic HTML** for accessibility
4. **Test keyboard navigation** for all interactive components
5. **Implement loading states** with skeletons
6. **Handle empty states** gracefully with EmptyState component
7. **Provide feedback** with toast notifications
8. **Support dark mode** by using CSS variables

## 🚀 Next Steps

- [ ] Add more form components (Select, Checkbox, Radio, Textarea)
- [ ] Implement Tooltip component
- [ ] Add Tabs component
- [ ] Create Accordion component
- [ ] Build Card component variants
- [ ] Add Badge and Tag components
- [ ] Implement Pagination component
- [ ] Create Breadcrumb navigation
- [ ] Add Progress indicators
