import React, { useState } from 'react';
import { Plus, FileText, DollarSign, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { formatCurrency, formatTime, formatDateShort } from '../../utils/helpers';

const SuppliersModule = ({ suppliers, setSuppliers, purchases, payments, setPayments }) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null); 
  const [payingSupplier, setPayingSupplier] = useState(null); 
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const handleRegisterPayment = (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    setSuppliers(suppliers.map(s => s.id === payingSupplier.id ? { ...s, debt: Math.max(0, s.debt - amount) } : s));
    setPayments([...payments, { id: Date.now(), date: new Date(), supplierId: payingSupplier.id, amount: amount, method: payMethod }]);
    setPayingSupplier(null); setPayAmount(''); alert("Abono registrado correctamente.");
  };

  const handleSaveSupplier = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSupplier = {
      id: Date.now(),
      name: formData.get('name'),
      phone: formData.get('phone'),
      visitDay: formData.get('visitDay'),
      address: formData.get('address'),
      email: formData.get('email'),
      debt: 0
    };
    setSuppliers([...suppliers, newSupplier]);
    setIsModalOpen(false);
  };

  const supplierPurchases = selectedSupplier ? purchases.filter(p => {
    const d = new Date(p.date);
    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if(end) end.setHours(23,59,59,999);
    return p.supplierId === selectedSupplier.id && (!start || d >= start) && (!end || d <= end);
  }) : [];

  const supplierPayments = selectedSupplier ? payments.filter(p => {
    const d = new Date(p.date);
    const start = filterStartDate ? new Date(filterStartDate) : null;
    const end = filterEndDate ? new Date(filterEndDate) : null;
    if(end) end.setHours(23,59,59,999);
    return p.supplierId === selectedSupplier.id && (!start || d >= start) && (!end || d <= end);
  }) : [];
  
  const totalPurchased = supplierPurchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-[#1A1A1A]">Directorio de Proveedores</h2><Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Registrar Proveedor</Button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{suppliers.map(prov => (
          <Card key={prov.id} className="relative overflow-visible">
            <div className="flex justify-between items-start"><div><h3 className="font-bold text-lg text-[#1A1A1A]">{prov.name}</h3><div className="flex items-center gap-2 text-sm text-gray-500 mt-1"><span>📞 {prov.phone}</span><span className="text-gray-300">|</span><span>Visita: {prov.visitDay}</span></div></div><div className="text-right"><div className="text-xs font-bold uppercase text-gray-400">Deuda Actual</div><div className={`text-2xl font-bold ${prov.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(prov.debt)}</div></div></div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2"><Button variant="outline" className="flex-1 text-sm py-1" icon={FileText} onClick={() => setSelectedSupplier(prov)}>Ver Historial</Button>{prov.debt > 0 && <Button variant="secondary" className="flex-1 text-sm py-1" icon={DollarSign} onClick={() => setPayingSupplier(prov)}>Registrar Abono</Button>}</div>
          </Card>
        ))}</div>
      <Modal isOpen={!!selectedSupplier} onClose={() => { setSelectedSupplier(null); setFilterStartDate(''); setFilterEndDate(''); }} title={`Historial: ${selectedSupplier?.name}`}>
         <div className="space-y-6">
            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
               <span className="text-xs font-bold text-gray-500">Filtrar:</span>
               <input type="date" className="p-1 border rounded text-xs" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
               <span className="text-gray-400">-</span>
               <input type="date" className="p-1 border rounded text-xs" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-4 rounded-lg text-center">
               <div><div className="text-xs text-gray-500">Total Comprado</div><div className="font-bold text-lg">{formatCurrency(totalPurchased)}</div></div>
               <div><div className="text-xs text-gray-500">Total Pagado</div><div className="font-bold text-lg text-green-600">{formatCurrency(totalPaid)}</div></div>
               <div><div className="text-xs text-gray-500">Deuda Actual</div><div className="font-bold text-lg text-red-600">{formatCurrency(selectedSupplier?.debt || 0)}</div></div>
            </div>
            <div><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ArrowDownCircle size={16} className="text-blue-600"/> Historial de Compras</h4>{supplierPurchases.length === 0 ? <p className="text-xs text-gray-400">No hay compras registradas en este periodo.</p> : <div className="max-h-60 overflow-y-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-50"><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">ID Compra</th><th className="p-2 text-right">Items</th><th className="p-2 text-right">Total</th></tr></thead><tbody>{supplierPurchases.map(p => <tr key={p.id} className="border-b"><td className="p-2">{formatDateShort(p.date)}</td><td className="p-2 font-mono text-gray-500">#{p.id.toString().slice(-4)}</td><td className="p-2 text-right">{p.items.length}</td><td className="p-2 text-right font-bold text-red-500">+{formatCurrency(p.total)}</td></tr>)}</tbody></table></div>}</div>
            <div><h4 className="font-bold text-sm mb-2 flex items-center gap-2"><ArrowUpCircle size={16} className="text-green-600"/> Historial de Abonos</h4>{supplierPayments.length === 0 ? <p className="text-xs text-gray-400">No hay pagos registrados en este periodo.</p> : <div className="max-h-40 overflow-y-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-50"><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Método</th><th className="p-2 text-right">Monto</th></tr></thead><tbody>{supplierPayments.map(p => <tr key={p.id} className="border-b"><td className="p-2">{formatTime(p.date)} {formatDateShort(p.date)}</td><td className="p-2">{p.method || 'Efectivo'}</td><td className="p-2 text-right font-bold text-green-500">-{formatCurrency(p.amount)}</td></tr>)}</tbody></table></div>}</div>
         </div>
      </Modal>
      <Modal isOpen={!!payingSupplier} onClose={() => setPayingSupplier(null)} title="Registrar Pago a Proveedor">
         <form onSubmit={handleRegisterPayment} className="space-y-4">
             <div className="p-4 bg-gray-50 rounded border text-center"><div className="text-xs text-gray-500">Deuda Actual</div><div className="text-2xl font-bold text-red-600">{formatCurrency(payingSupplier?.debt || 0)}</div></div>
             <div className="grid grid-cols-2 gap-4">
               <div><label className="text-sm font-bold block mb-1">Monto a Pagar</label><input type="number" step="0.01" className="w-full p-3 border rounded text-lg font-bold text-green-700" placeholder="$0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus required /></div>
               <div><label className="text-sm font-bold block mb-1">Método</label><select className="w-full p-3 border rounded" value={payMethod} onChange={e => setPayMethod(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Cheque</option></select></div>
             </div>
             <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setPayingSupplier(null)}>Cancelar</Button><Button variant="primary" type="submit">Confirmar Pago</Button></div>
         </form>
      </Modal>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Proveedor">
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">Nombre o Empresa</label><input name="name" required className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Ej. Frutas del Campo" /></div>
             <div><label className="block text-sm font-medium mb-1">Teléfono</label><input name="phone" required className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Ej. 449-123-4567" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Dirección</label><input name="address" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Calle, Número, Colonia" /></div>
          <div className="grid grid-cols-2 gap-4">
             <div><label className="block text-sm font-medium mb-1">Correo Electrónico</label><input name="email" type="email" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="contacto@proveedor.com" /></div>
             <div><label className="block text-sm font-medium mb-1">Día de Visita</label><select name="visitDay" className="w-full p-2 border rounded bg-white"><option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option><option>Domingo</option></select></div>
          </div>
          <div className="pt-4 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button variant="primary" type="submit">Guardar Proveedor</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersModule;