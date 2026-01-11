'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Dropdown from '@/components/ui/dropdown';
import Modal from '@/components/ui/modal';
import FullPageLoader from '@/components/ui/full-page-loader';
import ButtonLoader from '@/components/ui/button-loader';
import { Plus, Edit, Trash2, Search, BookOpen, Eye, FileText, Upload, X, Calendar, MapPin, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { toast } from 'sonner';

const BOOK_CATEGORIES = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Science', label: 'Science' },
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'English', label: 'English' },
  { value: 'Urdu', label: 'Urdu' },
  { value: 'Islamiyat', label: 'Islamiyat' },
  { value: 'Social Studies', label: 'Social Studies' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Arts', label: 'Arts' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Literature', label: 'Literature' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Other', label: 'Other' },
];

const BOOK_STATUS = [
  { value: 'available', label: 'Available' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function LibraryPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const formRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    subCategory: '',
    publisher: '',
    publicationYear: '',
    edition: '',
    totalCopies: 1,
    purchasePrice: '',
    bookValue: '',
    purchaseDate: '',
    supplier: '',
    shelfLocation: '',
    callNumber: '',
    language: 'English',
    pages: '',
    keywords: '',
    notes: ''
  });

  useEffect(() => {
    fetchBooks();
  }, [search, categoryFilter, statusFilter, pagination.page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        category: categoryFilter,
        status: statusFilter
      };

      const response = await apiClient.get(API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.BOOKS, params);
      if (response.success) {
        setBooks(response.data.books);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      category: '',
      subCategory: '',
      publisher: '',
      publicationYear: '',
      edition: '',
      totalCopies: 1,
      purchasePrice: '',
      bookValue: '',
      purchaseDate: '',
      supplier: '',
      shelfLocation: '',
      callNumber: '',
      language: 'English',
      pages: '',
      keywords: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      description: book.description || '',
      category: book.category || '',
      subCategory: book.subCategory || '',
      publisher: book.publisher || '',
      publicationYear: book.publicationYear || '',
      edition: book.edition || '',
      totalCopies: book.totalCopies || 1,
      purchasePrice: book.purchasePrice || '',
      bookValue: book.bookValue || '',
      purchaseDate: book.purchaseDate ? new Date(book.purchaseDate).toISOString().split('T')[0] : '',
      supplier: book.supplier || '',
      shelfLocation: book.shelfLocation || '',
      callNumber: book.callNumber || '',
      language: book.language || 'English',
      pages: book.pages || '',
      keywords: book.keywords ? book.keywords.join(', ') : '',
      notes: book.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const endpoint = API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.DELETE.replace(':id', id);
      const response = await apiClient.delete(endpoint);
      if (response.success) {
        toast.success('Book deleted successfully!');
        fetchBooks();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete book');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.title || !formData.author || !formData.category || !formData.totalCopies) {
        toast.error('Please fill in all required fields');
        return;
      }

      const submitData = {
        ...formData,
        totalCopies: parseInt(formData.totalCopies),
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        pages: formData.pages ? parseInt(formData.pages) : undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        bookValue: formData.bookValue ? parseFloat(formData.bookValue) : undefined,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        purchaseDate: formData.purchaseDate || undefined
      };

      let response;
      if (editingBook) {
        // Use ID in URL for updates
        const endpoint = API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.UPDATE.replace(':id', editingBook._id);
        response = await apiClient.put(endpoint, submitData);
      } else {
        response = await apiClient.post(API_ENDPOINTS.BRANCH_ADMIN.LIBRARY_MANAGEMENT.BOOKS, submitData);
      }

      if (response.success) {
        toast.success(editingBook ? 'Book updated successfully!' : 'Book added successfully!');
        setIsModalOpen(false);
        setEditingBook(null);
        fetchBooks();
      } else {
        toast.error(response.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving book:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading && books.length === 0) {
    return <FullPageLoader message="Loading library books..." />;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Library Management</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Book
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Input
              placeholder="Search books..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
            <Dropdown
              placeholder="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...BOOK_CATEGORIES
              ]}
            />
            <Dropdown
              placeholder="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                ...BOOK_STATUS
              ]}
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Copies</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
              {books.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No books found
                  </TableCell>
                </TableRow>
              ) : (
                books.map((book) => (
                  <TableRow key={book._id}>
                    <TableCell className="font-medium">{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>{book.totalCopies}</TableCell>
                    <TableCell>{book.availableCopies}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          book.status === 'available'
                            ? 'bg-green-100 text-green-700'
                            : book.status === 'checked_out'
                              ? 'bg-blue-100 text-blue-700'
                              : book.status === 'damaged'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {book.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(book)} title="Edit Book">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(book._id)} title="Delete Book">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {books.length} of {pagination.total} books
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Book Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
      >
        <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
            <Input
              label="Author *"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="ISBN"
              value={formData.isbn}
              onChange={(e) => handleInputChange('isbn', e.target.value)}
            />
            <Dropdown
              label="Category *"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              options={BOOK_CATEGORIES}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            type="textarea"
          />

          {/* Publication Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Publisher"
              value={formData.publisher}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
            />
            <Input
              label="Publication Year"
              type="number"
              value={formData.publicationYear}
              onChange={(e) => handleInputChange('publicationYear', e.target.value)}
            />
            <Input
              label="Edition"
              value={formData.edition}
              onChange={(e) => handleInputChange('edition', e.target.value)}
            />
          </div>

          {/* Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Copies *"
              type="number"
              min="1"
              value={formData.totalCopies}
              onChange={(e) => handleInputChange('totalCopies', e.target.value)}
              required
            />
            <Input
              label="Language"
              value={formData.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Purchase Price"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
            />
            <Input
              label="Book Value"
              type="number"
              step="0.01"
              value={formData.bookValue}
              onChange={(e) => handleInputChange('bookValue', e.target.value)}
            />
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Shelf Location"
              value={formData.shelfLocation}
              onChange={(e) => handleInputChange('shelfLocation', e.target.value)}
            />
            <Input
              label="Call Number"
              value={formData.callNumber}
              onChange={(e) => handleInputChange('callNumber', e.target.value)}
            />
          </div>

          {/* Additional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Pages"
              type="number"
              value={formData.pages}
              onChange={(e) => handleInputChange('pages', e.target.value)}
            />
            <Input
              label="Keywords (comma separated)"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
            />
          </div>

          <Input
            label="Supplier"
            value={formData.supplier}
            onChange={(e) => handleInputChange('supplier', e.target.value)}
          />

          <Input
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            type="textarea"
          />

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <ButtonLoader /> : null}
              {editingBook ? 'Update Book' : 'Add Book'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
