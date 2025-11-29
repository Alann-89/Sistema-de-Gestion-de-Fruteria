import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Save } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { formatCurrency, formatTime } from '../../utils/helpers';

const InventoryModule = ({ products, setProducts, wasteLogs, setWasteLogs, suppliers, setSuppliers, setPurchases, currentUser, setPriceHistory, priceHistory }) => {
  const [view, setView] = useState('list'); 
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});

  const [purchaseCart, setPurchaseCart] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [productToAddId, setProductToAddId] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [buyCost, setBuyCost] = useState('');

  const handlePriceChangeBuffer = (id, val) => {
    setPendingPriceChanges({ ...pendingPriceChanges, [id]: parseFloat(val) });
  };

  const saveAllPrices = () => {
    const changes = [];
    const updatedProducts = products.map(p => {
      if (pendingPriceChanges[p.id]) {
        changes.push({ date: new Date(), productId: p.id, oldPrice: p.price, newPrice: pendingPriceChanges[p.id] });
        return { ...p, price: pendingPriceChanges[p.id] };
      }
      return p;
    });
    setProducts(updatedProducts);
    setPriceHistory([...priceHistory, ...changes]);
    setPendingPriceChanges({});
    alert("Todos los precios han sido actualizados.");
  };

  const handleDeleteProduct = (id) => {
    if(window.confirm("¿Estás seguro de eliminar este producto?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: formData.get('name'), code: formData.get('code'), category: formData.get('category'),
      price: parseFloat(formData.get('price')), cost: parseFloat(formData.get('cost')),
      stock: parseFloat(formData.get('stock')), minStock: parseFloat(formData.get('minStock')),
      unit: formData.get('unit'), image: formData.get('image') || '📦' 
    };
    setProducts(editingProduct ? products.map(p => p.id === editingProduct.id ? productData : p) : [...products, productData]);
    setIsProductModalOpen(false);
  };

  const handleRegisterWaste = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const prodId = Number(formData.get('productId'));
    const amount = parseFloat(formData.get('amount'));
    const product = products.find(p => p.id === prodId);
    if (product) {
       setWasteLogs([...wasteLogs, { id: Date.now(), date: new Date(), productName: product.name, amount: amount, reason: formData.get('reason'), costLost: product.cost * amount }]);
       setProducts(products.map(p => p.id === prodId ? { ...p, stock: p.stock - amount } : p));
       e.target.reset(); alert("Merma registrada y stock actualizado");
    }
  };

  const addToPurchaseCart = () => {
    if (!productToAddId || !buyQty || !buyCost) return;
    const prod = products.find(p => p.id === Number(productToAddId));
    setPurchaseCart([...purchaseCart, { ...prod, buyQty: parseFloat(buyQty), buyCost: parseFloat(buyCost), total: parseFloat(buyQty) * parseFloat(buyCost) }]);
    setBuyQty(''); setBuyCost(''); setProductToAddId('');
  };

  const finalizePurchase = () => {
    if (!selectedSupplierId || purchaseCart.length === 0) return;
    const totalPurchase = purchaseCart.reduce((sum, item) => sum + item.total, 0);
    const supplier = suppliers.find(s => s.id === Number(selectedSupplierId));
    
    setProducts(products.map(p => {
      const item = purchaseCart.find(i => i.id === p.id);
      if (item) {
        const totalValue = (p.stock * p.cost) + (item.buyQty * item.buyCost);
        const totalQty = p.stock + item.buyQty;
        const newWeightedCost = totalQty > 0 ? totalValue / totalQty : item.buyCost;
        return { ...p, stock: totalQty, cost: newWeightedCost };
      }
      return p;
    }));
    
    setSuppliers(suppliers.map(s => s.id === Number(selectedSupplierId) ? { ...s, debt: s.debt + totalPurchase } : s));
    setPurchases(prev => [...prev, { id: Date.now(), date: new Date(), supplierId: Number(selectedSupplierId), supplierName: supplier.name, items: purchaseCart, total: totalPurchase }]);
    setPurchaseCart([]); setSelectedSupplierId(''); alert("Entrada de almacén registrada correctamente.");
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap ${view === 'list' ? 'bg-[#0F4C3A] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Lista General</button>
          <button onClick={() => setView('purchases')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap ${view === 'purchases' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Entradas (Compras)</button>
          <button onClick={() => setView('prices')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap ${view === 'prices' ? 'bg-[#FFC857] text-black shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Precios Rápidos</button>
          <button onClick={() => setView('waste')} className={`px-4 py-2 rounded-md text-sm font-bold whitespace-nowrap ${view === 'waste' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Registro Mermas</button>
        </div>
        <Button variant="primary" icon={Plus} className="text-sm" onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}>Nuevo Producto</Button>
      </div>

      {view === 'list' && (
        <Card className="flex-1 overflow-auto">
          <div className="p-4 border-b border-gray-300 bg-gray-50 flex gap-2">
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input type="text" className="w-full pl-9 pr-4 py-2 border rounded-md text-sm border-gray-300" placeholder="Buscar producto por nombre o código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-sm font-bold sticky top-0 z-10">
              <tr><th className="p-3 border-b border-gray-300 ">Código</th><th className="p-3 border-b border-gray-300">Producto</th><th className="p-3 border-b border-gray-300">Precio</th><th className="p-3 border-b text-center border-gray-300">Stock</th><th className="p-3 border-b text-center border-gray-300">Estado</th><th className="p-3 border-b text-center border-gray-300">Acciones</th></tr>
            </thead>
            <tbody className="text-sm">
              {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <tr key={p.id} className="hover:bg-gray-50 border-b border-gray-300 last:border-0">
                  <td className="p-3 text-gray-400 font-mono">{p.code}</td><td className="p-3 font-medium flex items-center gap-2"><span className="text-xl">{p.image}</span>{p.name}</td><td className="p-3 font-bold text-[#0F4C3A]">${p.price.toFixed(2)}</td><td className="p-3 text-center">{p.stock} {p.unit}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${p.stock <= p.minStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>{p.stock <= p.minStock ? 'Bajo' : 'Bien'}</span></td>
                  <td className="p-3 text-center flex justify-center gap-2">
                    {(currentUser.role === 'admin' || currentUser.role === 'dueño') && (
                      <>
                        <button onClick={() => { setEditingProduct(p); setIsProductModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit size={16}/></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view === 'purchases' && (
        <div className="flex flex-col md:flex-row gap-4 h-full">
           <Card className="md:w-1/3 flex flex-col gap-4" title="Nueva Entrada de Almacén">
             <div><label className="text-sm font-bold block mb-1">Proveedor</label><select className="w-full p-2 border rounded border-gray-300" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}><option value="">Seleccione...</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
             <div className="p-4 bg-gray-50 rounded border border-dashed border-gray-300 flex flex-col gap-3">
                <div className="text-xs font-bold text-gray-500 uppercase">Agregar Producto</div>
                <select className="w-full p-2 border rounded border-gray-300 bg-white" value={productToAddId} onChange={e => setProductToAddId(e.target.value)}><option value="">Buscar producto...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <div className="flex gap-2"><input type="number" placeholder="Cant." className="w-1/2 p-2 border rounded border-gray-300" value={buyQty} onChange={e => setBuyQty(e.target.value)} /><input type="number" placeholder="Costo $" className="w-1/2 p-2 border rounded border-gray-300" value={buyCost} onChange={e => setBuyCost(e.target.value)} /></div>
                <Button variant="secondary" onClick={addToPurchaseCart} disabled={!productToAddId}>Agregar</Button>
             </div>
           </Card>
           <Card className="flex-1 flex flex-col" title="Resumen de Compra">
             <div className="flex-1 overflow-auto">{purchaseCart.length === 0 ? <div className="text-center text-gray-400 mt-10">Lista vacía</div> : <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2 text-left">Prod</th><th className="p-2">Cant</th><th className="p-2">Costo</th><th className="p-2 text-right">Total</th><th className="p-2"></th></tr></thead><tbody>{purchaseCart.map((item, idx) => <tr key={idx} className="border-b"><td className="p-2">{item.name}</td><td className="p-2 text-center">{item.buyQty}</td><td className="p-2 text-center">${item.buyCost}</td><td className="p-2 text-right">${item.total.toFixed(2)}</td><td className="p-2 text-center"><button onClick={() => setPurchaseCart(purchaseCart.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={14}/></button></td></tr>)}</tbody></table>}</div>
             <div className="mt-4 pt-4 border-t border-gray-300 flex justify-between items-center"><div className="text-xl font-bold">Total: {formatCurrency(purchaseCart.reduce((sum, i) => sum + i.total, 0))}</div><Button variant="primary" onClick={finalizePurchase} disabled={purchaseCart.length === 0 || !selectedSupplierId}>Finalizar Entrada</Button></div>
           </Card>
        </div>
      )}

      {view === 'prices' && (
        <Card className="flex-1 overflow-auto border-t-4 border-t-[#FFC857]">
          <div className="p-4 bg-yellow-50 border-b border-yellow-100 mb-4 rounded-lg flex justify-between items-center">
             <div className="flex items-center gap-2 text-yellow-800"><AlertTriangle size={18} /><span className="font-bold text-sm">Cambio de precios diario</span></div>
             <div className="flex gap-2">
                <div className="text-xs text-yellow-700 self-center">{Object.keys(pendingPriceChanges).length} cambios pendientes</div>
                <Button variant="accent" icon={Save} onClick={saveAllPrices} disabled={Object.keys(pendingPriceChanges).length === 0}>Guardar Todos</Button>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{products.map(p => (
             <div key={p.id} className={`bg-white border rounded-lg p-3 shadow-sm flex items-center justify-between ${pendingPriceChanges[p.id] ? 'border-[#FFC857] bg-yellow-50' : 'border-gray-200'}`}>
                <div><div className="font-bold text-[#1A1A1A]">{p.name}</div><div className="text-xs text-gray-400 font-mono">{p.code}</div></div>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded border border-gray-200">
                   <span className="text-gray-400 pl-2">$</span>
                   <input type="number" defaultValue={p.price} onChange={(e) => handlePriceChangeBuffer(p.id, e.target.value)} className="w-20 bg-transparent font-bold text-lg text-right outline-none text-[#0F4C3A]" />
                </div>
             </div>
          ))}</div>
        </Card>
      )}

      {view === 'waste' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <Card className="md:col-span-1" title="Registrar Pérdida">
             <form className="space-y-4" onSubmit={handleRegisterWaste}>
               <div><label className="text-sm font-medium mb-1 block">Producto</label><select name="productId" className="w-full p-2 border rounded-lg border-gray-300 bg-white">{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
               <div className="grid grid-cols-2 gap-2"><div><label className="text-sm font-medium mb-1 block">Cantidad</label><input name="amount" type="number" step="0.01" className="w-full p-2 border rounded-lg border-gray-300" placeholder="0.00" required /></div><div><label className="text-sm font-medium mb-1 block">Unidad</label><input type="text" className="w-full p-2 border rounded-lg border-gray-300 bg-gray-100" disabled value="--" /></div></div>
               <div><label className="text-sm font-medium mb-1 block">Motivo</label><select name="reason" className="w-full p-2 border rounded-lg border-gray-300 bg-white"><option>Maduración Excesiva</option><option>Daño por Cliente</option><option>Plaga / Robo</option></select></div>
               <Button type="submit" variant="danger" className="w-full">Registrar Baja</Button>
             </form>
          </Card>
          <Card className="md:col-span-2" title="Historial de Mermas (Hoy)">{wasteLogs.length === 0 ? <div className="text-center text-gray-400 py-10"><Trash2 size={48} className="mx-auto mb-2 opacity-20"/><p>No hay mermas registradas</p></div> : <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-2">Hora</th><th className="p-2">Producto</th><th className="p-2">Motivo</th><th className="p-2 text-right">Pérdida ($)</th></tr></thead><tbody>{wasteLogs.map(log => <tr key={log.id} className="border-b border-gray-300"><td className="p-2 text-gray-500">{formatTime(log.date)}</td><td className="p-2 font-bold">{log.productName}</td><td className="p-2"><span className="bg-red-50 text-red-600 px-2 rounded text-xs">{log.reason}</span></td><td className="p-2 text-right font-bold text-red-700">{formatCurrency(log.costLost)}</td></tr>)}</tbody></table>}</Card>
        </div>
      )}

      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title={editingProduct ? "Editar Producto" : "Nuevo Producto"}>
         <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-bold block mb-1">Nombre</label><input name="name" required defaultValue={editingProduct?.name} className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A]" /></div><div><label className="text-sm font-bold block mb-1">Código / EAN</label><input name="code" required defaultValue={editingProduct?.code} className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A]" placeholder="EJ: TOM01" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-bold block mb-1">Categoría</label><select name="category" defaultValue={editingProduct?.category} className="w-full p-2 border rounded bg-white"><option>Frutas</option><option>Verduras</option><option>Abarrotes</option><option>Lácteos</option><option>Carnes</option></select></div><div><label className="text-sm font-bold block mb-1">Unidad</label><select name="unit" defaultValue={editingProduct?.unit || 'kg'} className="w-full p-2 border rounded bg-white"><option value="kg">Kilo (kg)</option><option value="pza">Pieza (pza)</option><option value="caja">Caja</option><option value="lt">Litro</option></select></div></div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border"><div><label className="text-sm font-bold block mb-1 text-gray-500">Costo Compra</label><input name="cost" type="number" step="0.01" required defaultValue={editingProduct?.cost} className="w-full p-2 border rounded" /></div><div><label className="text-sm font-bold block mb-1 text-[#0F4C3A]">Precio Venta</label><input name="price" type="number" step="0.01" required defaultValue={editingProduct?.price} className="w-full p-2 border rounded font-bold text-[#0F4C3A]" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-bold block mb-1">Stock Actual</label><input name="stock" type="number" step="0.01" required defaultValue={editingProduct?.stock} className="w-full p-2 border rounded" /></div><div><label className="text-sm font-bold block mb-1 text-red-500">Min. Stock (Alerta)</label><input name="minStock" type="number" step="0.01" required defaultValue={editingProduct?.minStock} className="w-full p-2 border rounded" /></div></div>
            <div><label className="text-sm font-bold block mb-1">Emoji / Imagen</label><input name="image" defaultValue={editingProduct?.image} className="w-full p-2 border rounded" placeholder="🍅" /></div>
            <div className="flex justify-end gap-2 pt-4 border-t"><Button variant="ghost" onClick={() => setIsProductModalOpen(false)}>Cancelar</Button><Button variant="primary" type="submit">Guardar Producto</Button></div>
         </form>
      </Modal>
    </div>
  );
};

export default InventoryModule;