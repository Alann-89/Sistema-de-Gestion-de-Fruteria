import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Users, UserCheck, TrendingUp, Settings, LogOut } from 'lucide-react';

import { INITIAL_DATA } from './data/initialData';
import { getCurrentDate } from './utils/helpers';
import { supabase } from './supabase/supabaseClient';

import LoginScreen from './modules/auth/LoginScreen';
import POSModule from './modules/pos/POSModule';
import InventoryModule from './modules/inventory/InventoryModule';
import SuppliersModule from './modules/suppliers/SuppliersModule';
import UserManagement from './modules/admin/UserManagement';
import ReportsModule from './modules/reports/ReportsModule';
import SettingsModule from './modules/admin/SettingsModule';

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 py-3 rounded-lg transition-all mb-1 ${active ? 'bg-[#FFC857] text-[#1A1A1A] font-bold shadow-md transform scale-[1.02]' : 'text-gray-300 hover:bg-[#4F7F61] hover:text-white'}`} title={label}>
    <Icon size={22} className={active ? 'text-[#1A1A1A]' : ''} />
    <span className="hidden md:inline">{label}</span>
  </button>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('pos'); 
  const [users, setUsers] = useState(INITIAL_DATA.users);
  const [products, setProducts] = useState(INITIAL_DATA.products);
  const [suppliers, setSuppliers] = useState(INITIAL_DATA.suppliers);
  const [sales, setSales] = useState(INITIAL_DATA.sales);
  const [purchases, setPurchases] = useState(INITIAL_DATA.purchases);
  const [payments, setPayments] = useState(INITIAL_DATA.payments);
  const [heldSales, setHeldSales] = useState(INITIAL_DATA.heldSales);
  const [wasteLogs, setWasteLogs] = useState(INITIAL_DATA.wasteLogs);
  const [cashFunds, setCashFunds] = useState(INITIAL_DATA.cashFunds);
  const [priceHistory, setPriceHistory] = useState(INITIAL_DATA.priceHistory);

  const refetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*');
      if (error) throw error;
      setProducts(productsData);
    } catch (err) {
      console.error('Error refetching products:', err);
    }
  };

  const refetchCashFunds = async () => {
    try {
      const { data: cashFundsData, error } = await supabase
        .from('cash_funds')
        .select('*')
        .order('opened_at', { ascending: false });
      if (error) throw error;
      setCashFunds(cashFundsData.map(fund => ({
        id: fund.id,
        openedAt: fund.opened_at,
        amount: fund.amount,
        closedAt: fund.closed_at,
        finalCounted: fund.final_counted,
        theoreticalCash: fund.theoretical_cash,
        difference: fund.difference
      })));
    } catch (err) {
      console.error('Error refetching cash funds:', err);
    }
  };

  useEffect(() => {
    refetchProducts();
    refetchCashFunds();
  }, []);

  const handleBackup = () => {
    const data = { users, products, suppliers, sales, purchases, payments, wasteLogs, cashFunds, priceHistory };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `respaldo_fruteria_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if(data.users) setUsers(data.users);
        if(data.products) setProducts(data.products);
        if(data.sales) setSales(data.sales);
        if(data.suppliers) setSuppliers(data.suppliers);
        alert("¡Base de datos restaurada con éxito!");
      } catch (err) { alert("Error al leer el archivo de respaldo."); }
    };
    reader.readAsText(file);
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} users={users} />;

  return (
    <div className="flex h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans overflow-hidden">
      <aside className="w-20 md:w-64 bg-[#0F4C3A] flex flex-col shadow-xl z-20 transition-all">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-[#0a3528]"><span className="text-2xl">🍊</span><span className="hidden md:block ml-3 font-bold text-white text-lg tracking-wide">Frutería ICI</span></div>
        <nav className="flex-1 p-2 md:p-4 space-y-1 overflow-y-auto">
          <NavButton active={currentView === 'pos'} onClick={() => setCurrentView('pos')} icon={ShoppingCart} label="Punto de Venta" />
          <NavButton active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} icon={Package} label="Inventario" />
          <NavButton active={currentView === 'suppliers'} onClick={() => setCurrentView('suppliers')} icon={Users} label="Proveedores" />
          {(currentUser.role === 'admin' || currentUser.role === 'dueño') && (
            <>
              <div className="hidden md:block text-xs font-bold text-[#4F7F61] uppercase mt-6 mb-2 ml-2">Gerencia</div>
              <NavButton active={currentView === 'admin'} onClick={() => setCurrentView('admin')} icon={UserCheck} label="Usuarios" />
              <NavButton active={currentView === 'reports'} onClick={() => setCurrentView('reports')} icon={TrendingUp} label="Reportes" />
              <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={Settings} label="Configuración" />
            </>
          )}
        </nav>
        <div className="p-4 border-t border-[#0a3528]"><button onClick={() => setCurrentUser(null)} className="w-full flex items-center justify-center md:justify-start gap-3 px-4 py-2 text-red-300 hover:bg-[#B71C1C] hover:text-white rounded-lg transition-colors"><LogOut size={20} /><span className="hidden md:inline font-medium">Salir</span></button></div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div><h1 className="text-xl font-bold text-[#0F4C3A] uppercase tracking-wide">{currentView === 'pos' ? 'Punto de Venta' : currentView === 'inventory' ? 'Inventario y Compras' : currentView === 'suppliers' ? 'Proveedores y Pagos' : currentView === 'reports' ? 'Reportes Financieros' : 'Configuración'}</h1><p className="text-xs text-gray-400 hidden md:block">{getCurrentDate()}</p></div>
          <div className="flex items-center gap-4"><div className="text-right hidden sm:block"><div className="font-bold text-sm">{currentUser.name}</div><div className="text-xs text-green-600 font-medium uppercase">{currentUser.role}</div></div><div className="w-10 h-10 rounded-full bg-[#0F4C3A] text-white flex items-center justify-center font-bold">{currentUser.name.charAt(0)}</div></div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-[#FAFAFA]">
          {currentView === 'pos' &&
                <POSModule
                    products={products}
                    users={users}
                    currentUser={currentUser}
                    sales={sales}
                    setSales={setSales}
                    heldSales={heldSales}
                    setHeldSales={setHeldSales}
                    setProducts={setProducts}
                    refetchProducts={refetchProducts}
                />
            }
          {currentView === 'inventory' && <InventoryModule products={products} setProducts={setProducts} wasteLogs={wasteLogs} setWasteLogs={setWasteLogs} suppliers={suppliers} setSuppliers={setSuppliers} setPurchases={setPurchases} currentUser={currentUser} priceHistory={priceHistory} setPriceHistory={setPriceHistory} />}
          {currentView === 'suppliers' && <SuppliersModule suppliers={suppliers} setSuppliers={setSuppliers} purchases={purchases} payments={payments} setPayments={setPayments} />}
          {currentView === 'admin' && <UserManagement users={users} setUsers={setUsers} />}
          {currentView === 'settings' && <SettingsModule onBackup={handleBackup} onRestore={handleRestore} />}
          {currentView === 'reports' && <ReportsModule sales={sales} wasteLogs={wasteLogs} cashFunds={cashFunds} setCashFunds={setCashFunds} payments={payments} />}
        </div>
      </main>
    </div>
  );
};

export default App;