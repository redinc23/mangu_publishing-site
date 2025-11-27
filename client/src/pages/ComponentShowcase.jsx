import { useState } from 'react';
import {
  Button,
  Input,
  Modal,
  Drawer,
  useToast,
  DataTable,
  LoadingSkeleton,
  BookCardSkeleton,
  EmptyState
} from '../components/ui';
import { Book, Plus, Search, Settings } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ComponentShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  const sampleData = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', year: 1925, sales: 25000000 },
    { id: 2, title: '1984', author: 'George Orwell', year: 1949, sales: 30000000 },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', year: 1960, sales: 40000000 },
    { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, sales: 20000000 },
    { id: 5, title: 'The Catcher in the Rye', author: 'J.D. Salinger', year: 1951, sales: 65000000 }
  ];

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'year', label: 'Year' },
    {
      key: 'sales',
      label: 'Sales',
      render: (value) => value.toLocaleString()
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
              Component Showcase
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Explore the MANGU Publishing design system components
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Buttons */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
            <Button variant="primary" loading>Loading...</Button>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
              With Icon
            </Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Input Fields</h2>
          <div className="space-y-4 max-w-md">
            <Input label="Email" placeholder="Enter your email" type="email" required />
            <Input
              label="Search"
              placeholder="Search books..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Input
              label="Password"
              placeholder="Enter password"
              type="password"
              helperText="Must be at least 8 characters"
            />
            <Input
              label="Error State"
              placeholder="Invalid input"
              error="This field is required"
            />
          </div>
        </section>

        {/* Toast Notifications */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Toast Notifications</h2>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => toast.success('Success! Your changes have been saved.')}>
              Success Toast
            </Button>
            <Button onClick={() => toast.error('Error! Something went wrong.')}>
              Error Toast
            </Button>
            <Button onClick={() => toast.warning('Warning! Please check your input.')}>
              Warning Toast
            </Button>
            <Button onClick={() => toast.info('Info: New features are available.')}>
              Info Toast
            </Button>
          </div>
        </section>

        {/* Modal & Drawer */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Modal & Drawer</h2>
          <div className="flex gap-4">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          </div>
        </section>

        {/* Data Table */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Data Table</h2>
          <DataTable data={sampleData} columns={columns} pageSize={3} />
        </section>

        {/* Loading Skeletons */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Loading Skeletons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BookCardSkeleton />
            <BookCardSkeleton />
            <BookCardSkeleton />
          </div>
        </section>

        {/* Empty State */}
        <section className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-neutral-50">Empty State</h2>
          <EmptyState
            icon={Book}
            title="No books found"
            description="Start building your library by adding your first book."
            action={() => toast.info('Add book clicked!')}
            actionLabel="Add Book"
          />
        </section>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example Modal"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Confirm
            </Button>
          </div>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-400">
          This is an example modal component. It can contain any content you need.
        </p>
      </Modal>

      {/* Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Settings"
        footer={
          <Button fullWidth onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-700 dark:text-neutral-300">Notifications</span>
            <Settings className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-700 dark:text-neutral-300">Dark Mode</span>
            <ThemeToggle />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
