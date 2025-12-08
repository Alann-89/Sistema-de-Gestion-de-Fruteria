import React, { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { formatCurrency } from '../../utils/helpers';
import { supabase } from '../../supabase/supabaseClient';

const SuppliersModule = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payingSupplier, setPayingSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar proveedores activos
  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('active', true); // SOLO ACTIVOS

    if (error) {
      console.error('Error cargando proveedores:', error);
      return;
    }
    setSuppliers(data);
  };

  // Cargar pagos
  const fetchPayments = async () => {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) {
      console.error('Error cargando pagos:', error);
      return;
    }
    setPayments(data);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPayments();
  }, []);

  // Actualizar deuda
  const updateSupplierDebt = async (id, newDebt) => {
    const { error } = await supabase.from('suppliers').update({ debt: newDebt }).eq('id', id);
    if (error) console.error("Error actualizando deuda:", error);
  };

  // Registrar pago
  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;

    const newDebt = Math.max(0, payingSupplier.debt - amount);

    const { error } = await supabase.from('payments').insert({
      supplier_id: payingSupplier.id,
      amount,
      date: new Date(),
      method: payMethod
    });

    if (error) {
      console.error('Error guardando pago:', error);
      alert('Error al registrar pago: ' + error.message);
      return;
    }

    await updateSupplierDebt(payingSupplier.id, newDebt);

    setSuppliers(suppliers.map(s => s.id === payingSupplier.id ? { ...s, debt: newDebt } : s));
    setPayments([...payments, { id: Date.now(), supplier_id: payingSupplier.id, amount, date: new Date(), method: payMethod }]);

    setPayingSupplier(null);
    setPayAmount('');
    alert('Abono registrado correctamente.');
  };

  // Guardar proveedor nuevo
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newSupplier = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      visit_day: formData.get('visitDay'),
      debt: 0,
      active: true // NUEVO CAMPO
    };

    const { data, error } = await supabase.from('suppliers').insert(newSupplier).select();
    if (error) {
      console.error('Error agregando proveedor:', error);
      alert('Error al agregar proveedor: ' + error.message);
      return;
    }

    setSuppliers([...suppliers, data[0]]);
    setIsModalOpen(false);
  };

  // DESACTIVAR PROVEEDOR
  const deactivateSupplier = async (id) => {
    const { error } = await supabase
      .from('suppliers')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      console.error("Error desactivando proveedor:", error);
      return alert("Error desactivando proveedor.");
    }

    // Quitar de la lista sin alterar UI existente
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Directorio de Proveedores</h2>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>Registrar Proveedor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map(prov => (
          <Card key={prov.id} className="relative overflow-visible">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-[#1A1A1A]">{prov.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>📞 {prov.phone}</span>
                  <span className="text-gray-300">|</span>
                  <span>Visita: {prov.visit_day}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase text-gray-400">Deuda Actual</div>
                <div className={`text-2xl font-bold ${prov.debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(prov.debt)}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex gap-2">
              <Button variant="outline" className="flex-1 text-sm py-1" icon={FileText} onClick={() => setSelectedSupplier(prov)}>Ver Historial</Button>

              {prov.debt > 0 && (
                <Button
                  variant="secondary"
                  className="flex-1 text-sm py-1"
                  icon={DollarSign}
                  onClick={() => setPayingSupplier(prov)}
                >
                  Registrar Abono
                </Button>
              )}

              <Button
                variant="ghost"
                className="flex-1 text-sm py-1 text-red-700 border-red-300 hover:bg-red-50"
                onClick={() => {
                  if (confirm("¿Desactivar este proveedor?")) {
                    deactivateSupplier(prov.id);
                  }
                }}
              >
                Desactivar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de pago */}
      <Modal isOpen={!!payingSupplier} onClose={() => setPayingSupplier(null)} title="Registrar Pago a Proveedor">
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded border text-center">
            <div className="text-xs text-gray-500">Deuda Actual</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(payingSupplier?.debt || 0)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold block mb-1">Monto a Pagar</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-3 border rounded text-lg font-bold text-green-700"
                placeholder="$0.00"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="text-sm font-bold block mb-1">Método</label>
              <select className="w-full p-3 border rounded" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Cheque</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPayingSupplier(null)}>Cancelar</Button>
            <Button variant="primary" type="submit">Confirmar Pago</Button>
          </div>
        </form>
      </Modal>

      {/* Modal nuevo proveedor */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Proveedor">
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre o Empresa</label>
              <input name="name" required className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Ej. Frutas del Campo" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input name="phone" required className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Ej. 449-123-4567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input name="address" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Calle, Número, Colonia" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
              <input name="email" type="email" className="w-full p-2 border rounded focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="contacto@proveedor.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Día de Visita</label>
              <select name="visitDay" className="w-full p-2 border rounded bg-white">
                <option>Lunes</option>
                <option>Martes</option>
                <option>Miércoles</option>
                <option>Jueves</option>
                <option>Viernes</option>
                <option>Sábado</option>
                <option>Domingo</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar Proveedor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SuppliersModule;
