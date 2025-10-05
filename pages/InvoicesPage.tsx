import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Invoice, InvoiceItem, Customer, Product, Sale } from '../types';
import { CloseIcon, EditIcon, DeleteIcon, PrintIcon, ViewIcon, WhatsAppIcon, DownloadIcon } from '../components/Icons';

// FIX: Declare jspdf and html2canvas on the window object to resolve TypeScript errors.
// These libraries are likely loaded from a script tag in the main HTML file.
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const getStockColor = (stock: number) => {
    if (stock <= 10) return 'text-red-600 dark:text-red-400';
    if (stock <= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
};

const InvoiceFormModal: React.FC<{
    onClose: () => void;
    onSave: (invoice: Invoice, originalStock?: { [productId: string]: number }) => void;
    invoiceToEdit?: Invoice | null;
}> = ({ onClose, onSave, invoiceToEdit }) => {
    const [customers] = useLocalStorage<Customer[]>('customers', []);
    const [products] = useLocalStorage<Product[]>('products', []);
    
    const [customerId, setCustomerId] = useState(invoiceToEdit?.customerId || '');
    const [items, setItems] = useState<InvoiceItem[]>(invoiceToEdit?.items || []);
    const [status, setStatus] = useState<'Paid' | 'Unpaid'>(invoiceToEdit?.status || 'Unpaid');

    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    const originalStock = useMemo(() => {
        if (!invoiceToEdit) return {};
        const stock: { [productId: string]: number } = {};
        invoiceToEdit.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                stock[item.productId] = product.stock + item.quantity;
            } else {
                 stock[item.productId] = item.quantity;
            }
        });
        return stock;
    }, [invoiceToEdit, products]);

    const handleAddItem = () => {
        const product = products.find(p => p.id === selectedProduct);
        if (!product || quantity <= 0) return;
        if (items.some(item => item.productId === product.id)) {
            alert("Product already added. Please edit the quantity in the list.");
            return;
        }
        if (product.stock < quantity) {
            alert(`Not enough stock for ${product.name}. Available: ${product.stock}`);
            return;
        }
        setItems([...items, {
            productId: product.id,
            productName: product.name,
            quantity,
            price: product.price,
        }]);
        setSelectedProduct('');
        setQuantity(1);
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    };

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId || items.length === 0) {
            alert('Please select a customer and add at least one item.');
            return;
        }
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const invoiceData: Invoice = {
            id: invoiceToEdit?.id || `#INV-${Date.now()}`,
            customerId,
            customerName: customer.name,
            items,
            total,
            date: invoiceToEdit?.date || new Date().toISOString(),
            status,
        };
        onSave(invoiceData, invoiceToEdit ? originalStock : undefined);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{invoiceToEdit ? 'Edit Invoice' : 'Create New Invoice'}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <select value={customerId} onChange={e => setCustomerId(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select a Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select value={status} onChange={e => setStatus(e.target.value as 'Paid' | 'Unpaid')} className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>

                    <div className="border-t pt-4 border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold mb-2 dark:text-white">Invoice Items</h3>
                        <div className="flex items-center gap-2">
                            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex-grow p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="">Select a Product</option>
                                {products.map(p => {
                                    const stockStatus = p.stock <= 0 ? ' (Out of Stock)' : ` (${p.stock} in stock)`;
                                    return <option key={p.id} value={p.id} disabled={p.stock <= 0} className={getStockColor(p.stock)}>
                                        {p.name}{stockStatus}
                                    </option>
                                })}
                            </select>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" className="w-20 p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                            <button type="button" onClick={handleAddItem} className="px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">Add</button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.productId} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                <span className="dark:text-slate-200">{item.productName} (Qty: {item.quantity})</span>
                                <div className="flex items-center gap-4">
                                  <span className="dark:text-slate-200">₹{(item.price * item.quantity).toFixed(2)}</span>
                                  <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold dark:text-white">Total: ₹{total.toFixed(2)}</h3>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition">{invoiceToEdit ? 'Save Changes' : 'Create Invoice'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InvoiceViewModal: React.FC<{
    onClose: () => void;
    invoice: Invoice | null;
    customers: Customer[];
}> = ({ onClose, invoice, customers }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    if (!invoice) return null;
    
    const currentCustomer = customers.find(c => c.id === invoice.customerId);

    const handlePrint = async () => {
        const element = printRef.current;
        if (!element) return;
    
        // Add a check for the libraries to provide a better user message if they're not loaded.
        if (!window.jspdf || typeof window.html2canvas !== 'function') {
            alert("PDF generation libraries are not loaded yet. Please try again in a moment.");
            console.error("jspdf or html2canvas not available on window object.");
            return;
        }

        setIsPrinting(true);
    
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            
            await pdf.html(element, {
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: 'transparent', // Use transparent to respect dark mode
                },
                autoPaging: 'body',
                margin: [10, 10, 10, 10],
                width: 190, // A4 width 210mm - 2*10mm margin
                windowWidth: element.scrollWidth,
            });
            pdf.save(`invoice-${invoice.id}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            setIsPrinting(false);
        }
    };
    
    const handleWhatsApp = () => {
        if (!currentCustomer?.phone) {
            alert("Customer phone number not available.");
            return;
        }
        const phone = currentCustomer.phone.replace(/[^0-9]/g, '');
        const countryCode = phone.length > 10 ? '' : '91';

        let message = `*Invoice Details*\n\n`;
        message += `Invoice ID: ${invoice.id}\n`;
        message += `Total Amount: ₹${invoice.total.toFixed(2)}\n`;
        message += `Status: ${invoice.status}\n\n`;
        message += `Thank you!`;

        const whatsappUrl = `https://wa.me/${countryCode}${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Invoice Details</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><CloseIcon /></button>
                </div>
                <div ref={printRef} className="printable-content text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-8">
                    {/* Company and Invoice Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Zenith Inc.</h2>
                            <p className="text-slate-500 dark:text-slate-400">123 Zenith Avenue</p>
                            <p className="text-slate-500 dark:text-slate-400">Business City, BC 12345</p>
                        </div>
                        <div className="text-right">
                             <h3 className="text-xl font-bold text-slate-700 dark:text-white">Invoice {invoice.id}</h3>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <p className="font-semibold text-slate-600 dark:text-slate-400">Billed To:</p>
                            <p>{invoice.customerName}</p>
                            <p>{currentCustomer?.email}</p>
                            <p>{currentCustomer?.phone}</p>
                        </div>
                        <div className="text-right">
                             <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                             <p><strong>Status:</strong> <span className={`${invoice.status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>{invoice.status}</span></p>
                        </div>
                    </div>
                    <table className="min-w-full leading-normal mb-4">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Item</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Quantity</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Price</th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="dark:text-slate-200">
                            {invoice.items.map(item => (
                                <tr key={item.productId}>
                                    <td className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">{item.productName}</td>
                                    <td className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">{item.quantity}</td>
                                    <td className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">₹{item.price.toFixed(2)}</td>
                                    <td className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="text-right font-bold text-xl mt-6 text-slate-900 dark:text-white">
                        Total: ₹{invoice.total.toFixed(2)}
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 no-print">
                    {currentCustomer?.phone && (
                        <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"><WhatsAppIcon /> Send</button>
                    )}
                    <button onClick={handlePrint} disabled={isPrinting} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"><PrintIcon /> {isPrinting ? 'Generating...' : 'Print / Save PDF'}</button>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Close</button>
                </div>
            </div>
        </div>
    );
};

const InvoicesPage = () => {
    const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', []);
    const [customers] = useLocalStorage<Customer[]>('customers', []);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

    const openAddModal = () => {
        setEditingInvoice(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsFormModalOpen(true);
    };

    const openViewModal = (invoice: Invoice) => {
        setViewingInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsViewModalOpen(false);
        setEditingInvoice(null);
        setViewingInvoice(null);
    };

    const handleSaveInvoice = (invoiceData: Invoice, originalStock?: { [productId: string]: number }) => {
        const isNew = !invoices.some(inv => inv.id === invoiceData.id);

        setProducts(prevProducts => {
            const newProducts = [...prevProducts];
            if (originalStock) {
                const oldInvoice = invoices.find(inv => inv.id === invoiceData.id);
                oldInvoice?.items.forEach(item => {
                    const productIndex = newProducts.findIndex(p => p.id === item.productId);
                    if (productIndex !== -1) {
                        newProducts[productIndex].stock += item.quantity;
                    }
                });
            }

            invoiceData.items.forEach(item => {
                const productIndex = newProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].stock -= item.quantity;
                }
            });
            return newProducts;
        });

        if (isNew) {
            setInvoices(prev => [...prev, invoiceData]);
        } else {
            setInvoices(prev => prev.map(inv => inv.id === invoiceData.id ? invoiceData : inv));
        }

        const saleExists = sales.some(s => s.invoiceId === invoiceData.id);
        if (invoiceData.status === 'Paid' && !saleExists) {
            setSales(prev => [...prev, { date: invoiceData.date.slice(0, 10), amount: invoiceData.total, invoiceId: invoiceData.id }]);
        } else if (invoiceData.status === 'Unpaid' && saleExists) {
            setSales(prev => prev.filter(s => s.invoiceId !== invoiceData.id));
        } else if (invoiceData.status === 'Paid' && saleExists) {
            setSales(prev => prev.map(s => s.invoiceId === invoiceData.id ? { ...s, amount: invoiceData.total } : s));
        }
        
        closeModals();
    };
    
    const handleDeleteInvoice = (invoice: Invoice) => {
        if (window.confirm('Are you sure you want to delete this invoice? This will also remove any associated sale record and restore product stock.')) {
            setProducts(prevProducts => {
                const newProducts = [...prevProducts];
                invoice.items.forEach(item => {
                    const productIndex = newProducts.findIndex(p => p.id === item.productId);
                    if (productIndex !== -1) {
                        newProducts[productIndex].stock += item.quantity;
                    }
                });
                return newProducts;
            });

            setInvoices(invoices.filter(i => i.id !== invoice.id));
            setSales(sales.filter(s => s.invoiceId !== invoice.id));
        }
    };
    
    const handleSendWhatsApp = (invoice: Invoice) => {
        const customer = customers.find(c => c.id === invoice.customerId);
        if (!customer?.phone) {
            alert("Customer phone number not available.");
            return;
        }
        const phone = customer.phone.replace(/[^0-9]/g, '');
        const countryCode = phone.length > 10 ? '' : '91';

        let message = `*Invoice Details*\n\n`;
        message += `Invoice ID: ${invoice.id}\n`;
        message += `Total Amount: ₹${invoice.total.toFixed(2)}\n`;
        message += `Status: ${invoice.status}\n\n`;
        message += `Thank you!`;

        const whatsappUrl = `https://wa.me/${countryCode}${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Invoices</h1>
                <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 shadow-sm transition">
                    Create Invoice
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Invoice ID</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Customer</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Date</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-200">
                        {invoices.map(invoice => (
                            <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{invoice.id}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{invoice.customerName}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">₹{invoice.total.toFixed(2)}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => openViewModal(invoice)} className="text-blue-600 hover:text-blue-900" title="View"><ViewIcon /></button>
                                        <button onClick={() => openViewModal(invoice)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" title="Print / Save PDF"><PrintIcon /></button>
                                        <button onClick={() => openViewModal(invoice)} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" title="Download PDF"><DownloadIcon /></button>
                                        <button onClick={() => handleSendWhatsApp(invoice)} className="text-green-600 hover:text-green-900" title="Send via WhatsApp"><WhatsAppIcon /></button>
                                        <button onClick={() => openEditModal(invoice)} className="text-indigo-600 hover:text-indigo-900" title="Edit"><EditIcon /></button>
                                        <button onClick={() => handleDeleteInvoice(invoice)} className="text-red-600 hover:text-red-900" title="Delete"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && <InvoiceFormModal onClose={closeModals} onSave={handleSaveInvoice} invoiceToEdit={editingInvoice} />}
            {isViewModalOpen && <InvoiceViewModal onClose={closeModals} invoice={viewingInvoice} customers={customers} />}
        </div>
    );
};

export default InvoicesPage;