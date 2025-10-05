import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Sale, Product, Customer, Invoice } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center">
        <div className="p-3 bg-indigo-500 rounded-full text-white">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const DashboardPage = () => {
    const [sales] = useLocalStorage<Sale[]>('sales', []);
    const [products] = useLocalStorage<Product[]>('products', []);
    const [customers] = useLocalStorage<Customer[]>('customers', []);
    const [invoices] = useLocalStorage<Invoice[]>('invoices', []);

    const today = new Date().toISOString().slice(0, 10);
    const todaysSales = sales
        .filter(sale => sale.date === today)
        .reduce((acc, sale) => acc + sale.amount, 0);

    const salesChartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().slice(0, 10);
        }).reverse();
        
        return last7Days.map(date => {
            const total = sales
                .filter(sale => sale.date === date)
                .reduce((sum, sale) => sum + sale.amount, 0);
            return {
                name: new Date(date).toLocaleString('en-US', { weekday: 'short' }),
                sales: total,
            };
        });
    }, [sales]);

    const stats = [
        { title: "Today's Sales", value: `₹${todaysSales.toFixed(2)}`, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg> },
        { title: "Total Products", value: products.length, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg> },
        { title: "Total Customers", value: customers.length, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> },
        { title: "Total Invoices", value: invoices.length, icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> }
    ];

    return (
        <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-white mb-4">Last 7 Days Sales</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart data={salesChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(51, 51, 51, 0.8)', border: 'none', borderRadius: '0.75rem' }} />
                            <Legend />
                            <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;