
export interface User {
  id: string;
  email: string;
  password?: string; // Optional because we don't store it in the session
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  status: 'Paid' | 'Unpaid';
}

export interface Sale {
  date: string; // YYYY-MM-DD
  amount: number;
  invoiceId: string;
}
