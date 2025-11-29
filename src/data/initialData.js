export const INITIAL_DATA = {
  users: [
    { id: 1, name: 'Juan Pérez', email: 'juan@ici.com', phone: '4491112233', role: 'admin', pin: '1234', password: 'admin', joinDate: '2023-01-01', active: true },
    { id: 2, name: 'Ana López', email: 'ana@ici.com', phone: '4494445566', role: 'vendedor', pin: '0000', password: 'user', joinDate: '2023-05-15', active: true },
  ],
  products: [
    { id: 101, name: 'Tomate Saladette', category: 'Verduras', price: 28.50, cost: 15.00, stock: 45.5, unit: 'kg', code: 'TOM01', minStock: 10, image: '🍅' },
    { id: 102, name: 'Plátano Tabasco', category: 'Frutas', price: 18.00, cost: 10.00, stock: 12.0, unit: 'kg', code: 'PLA01', minStock: 15, image: '🍌' },
    { id: 103, name: 'Aguacate Hass', category: 'Verduras', price: 85.00, cost: 50.00, stock: 5.0, unit: 'kg', code: 'AGU01', minStock: 8, image: '🥑' },
    { id: 104, name: 'Huevo (Reja)', category: 'Abarrotes', price: 90.00, cost: 75.00, stock: 20, unit: 'pza', code: 'HUE01', minStock: 5, image: '🥚' },
    { id: 105, name: 'Cebolla Blanca', category: 'Verduras', price: 32.00, cost: 18.00, stock: 60.0, unit: 'kg', code: 'CEB01', minStock: 10, image: '🧅' },
    { id: 106, name: 'Leche Entera', category: 'Lácteos', price: 26.00, cost: 21.00, stock: 24, unit: 'lt', code: 'LEC01', minStock: 12, image: '🥛' },
  ],
  suppliers: [
    { id: 1, name: 'Agropecuaria El Sol', phone: '449-123-4567', debt: 1500.00, visitDay: 'Lunes' },
    { id: 2, name: 'Frutas del Bajío', phone: '449-987-6543', debt: 0.00, visitDay: 'Jueves' },
  ],
  sales: [],
  purchases: [],
  payments: [],
  heldSales: [],
  wasteLogs: [],
  cashFunds: [],
  priceHistory: [] // Feature: Historial de precios
};