import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Customer } from '../types';
import { CloseIcon, EditIcon, DeleteIcon } from '../components/Icons';

const CustomerFormModal: React.FC<{
    onClose: () => void;
    onSave: (customer: Customer) => void;
    customerToEdit?: Customer | null;
}> = ({ onClose, onSave, customerToEdit }) => {
    const [name, setName] = useState(customerToEdit?.name || '');
    const [email, setEmail] = useState(customerToEdit?.email || '');
    const [phone, setPhone] = useState(customerToEdit?.phone || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customerData: Customer = {
            id: customerToEdit?.id || crypto.randomUUID(),
            createdAt: customerToEdit?.createdAt || new Date().toISOString(),
            name,
            email,
            phone,
        };
        onSave(customerData);
    };

    const modalTitle = customerToEdit ? "Edit Customer" : "Add New Customer";
    const submitButtonText = customerToEdit ? "Save Changes" : "Add Customer";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><CloseIcon /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
                        <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-200 focus:ring-indigo-500 focus:border-indigo-500" />
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

const CustomersPage = () => {
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const openAddModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSaveCustomer = (customerData: Customer) => {
        if (editingCustomer) {
            setCustomers(prev => prev.map(c => c.id === customerData.id ? customerData : c));
        } else {
            setCustomers(prev => [...prev, customerData]);
        }
        closeModal();
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            setCustomers(customers.filter(c => c.id !== customerId));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Customers</h1>
                <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 shadow-sm transition">
                    Add Customer
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Name</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Phone</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Joined On</th>
                            <th className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 dark:text-slate-200">
                        {customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{customer.name}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{customer.email}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{customer.phone}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">{new Date(customer.createdAt).toLocaleDateString()}</td>
                                <td className="px-5 py-5 border-b border-slate-200 dark:border-slate-700 text-sm">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => openEditModal(customer)} className="text-indigo-600 hover:text-indigo-900"><EditIcon /></button>
                                        <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-900"><DeleteIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <CustomerFormModal onClose={closeModal} onSave={handleSaveCustomer} customerToEdit={editingCustomer} />}
        </div>
    );
};

export default CustomersPage;