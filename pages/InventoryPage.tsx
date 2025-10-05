import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Product } from '../types';
import { CloseIcon, EditIcon, DeleteIcon, SearchIcon } from '../components/Icons';

// Modal for adding/editing a product
const ProductFormModal: React.FC<{
    onClose: () => void;
    onSave: (product: Product) => void;
    productToEdit?: Product | null;
}> = ({ onClose, onSave, productToEdit }) => {
    const [name, setName] = useState(productToEdit?.name || '');
    const [sku, setSku] = useState(productToEdit?.sku || '');
    const [stock, setStock] = useState(productToEdit?.stock.toString() || '0');
    const [price, setPrice] = useState(productToEdit?.price.toString() || '0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !sku || isNaN(parseInt(stock)) || isNaN(parseFloat(price))) {
            alert("Please fill all fields with valid values.");
            return;
        }
        const productData: Product = {
            id: productToEdit?.id || crypto.randomUUID(),
            createdAt: productToEdit?.createdAt || new Date().toISOString(),
            name,
            sku,
            stock: parseInt(stock, 10),
            price: parseFloat(price),
        };
        onSave(productData);
    };

    const modalTitle = productToEdit ? "Edit Product" : "Add New Product";
    const submitButtonText = productToEdit ? "Save Changes" : "Add Product";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="text" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="text" placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="number" placeholder="Stock Quantity" value={stock} onChange={e => setStock(e.target.value)} required min="0" className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition">{submitButtonText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InventoryPage = () => {
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSaveProduct = (productData: Product) => {
        if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
        } else {
            setProducts(prev => [...prev, productData]);
        }
        closeModal();
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== productId));
        }
    };

    const getStatusBadge = (stock: number): { text: string; className: string } => {
        if (stock <= 10) return { text: 'Low Stock', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
        if (stock <= 50) return { text: 'Okay', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        return { text: 'In Stock', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
    };

    const displayedProducts = useMemo(() => {
        return products
            .filter(product => {
                if (!searchTerm) return true;
                const lowerCaseSearch = searchTerm.toLowerCase();
                return (
                    product.name.toLowerCase().includes(lowerCaseSearch) ||
                    product.sku.toLowerCase().includes(lowerCaseSearch)
                );
            })
            .filter(product => {
                if (!showLowStockOnly) return true;
                return product.stock <= 10;
            });
    }, [products, searchTerm, showLowStockOnly]);

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-4">
                     <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showLowStockOnly}
                            onChange={() => setShowLowStockOnly(!showLowStockOnly)}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                        <span className="ms-3 text-sm font-medium text-slate-700 dark:text-slate-300">Show only low stock</span>
                    </label>
                    <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 shadow-sm transition">
                        Add Product
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Product Name</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">SKU</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Stock</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Price</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-200">
                        {displayedProducts.length > 0 ? (
                            displayedProducts.map(product => {
                                const status = getStatusBadge(product.stock);
                                return (
                                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{product.name}</td>
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{product.sku}</td>
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm font-medium">{product.stock}</td>
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${status.className}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">₹{product.price.toFixed(2)}</td>
                                        <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => openEditModal(product)} className="text-indigo-600 hover:text-indigo-900"><EditIcon /></button>
                                                <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <ProductFormModal onClose={closeModal} onSave={handleSaveProduct} productToEdit={editingProduct} />}
        </div>
    );
};

export default InventoryPage;