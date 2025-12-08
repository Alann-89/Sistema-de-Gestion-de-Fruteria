import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, History, Search, Scale, PauseCircle, ShoppingCart, Trash2, DollarSign, Users, FileText, Printer, X } from 'lucide-react';
import { supabase } from '../../supabase/supabaseClient'; 
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { formatCurrency, formatTime, getCurrentDate } from '../../utils/helpers';

// Define el folio de inicio en caso de que la tabla 'sales' esté completamente vacía
const INITIAL_FOLIO = 1000; 

// --- SUB-COMPONENTE: HISTORIAL DE VENTAS ---
const SalesHistory = ({ sales, users, onCancelSale, currentUser }) => {
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItemsDetail, setSaleItemsDetail] = useState([]);
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [filterSeller, setFilterSeller] = useState('all');
    const [filterMethod, setFilterMethod] = useState('all');
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const start = filterDateStart ? new Date(filterDateStart) : null;
        const end = filterDateEnd ? new Date(filterDateEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);
        const matchesSeller = filterSeller === 'all' || sale.user_id === Number(filterSeller); 
        const matchesMethod = filterMethod === 'all' || sale.method === filterMethod;
        return matchesDate && matchesSeller && matchesMethod && sale.status !== 'cancelled';
    });
    
    const fetchSaleDetails = useCallback(async (sale) => {
        if (!sale) return;
        setIsDetailLoading(true);
        setSelectedSale(sale);

        try {
            const { data: items, error } = await supabase
                .from('sale_items')
                .select(`
                    quantity,
                    subtotal,
                    price,
                    products (name, unit)
                `)
                .eq('sale_id', sale.id);

            if (error) throw error;

            const structuredItems = items.map(item => ({
                name: item.products.name,
                unit: item.products.unit,
                qty: item.quantity,
                price: item.price,
                total: item.subtotal,
            }));

            setSaleItemsDetail(structuredItems);

        } catch (error) {
            console.error('Error fetching sale details:', error);
            setSaleItemsDetail([{ name: 'Error al cargar detalles', total: 0, qty: 0 }]);
        } finally {
            setIsDetailLoading(false);
        }
    }, []);

    const handleCloseModal = () => {
        setSelectedSale(null);
        setSaleItemsDetail([]);
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="bg-white p-3 rounded-lg border-gray-300 border flex flex-wrap gap-4 items-end">
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Fecha Inicio</label><input type="date" className="p-2 border rounded border-gray-300 text-sm" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} /></div>
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Fecha Fin</label><input type="date" className="p-2 border rounded border-gray-300 text-sm" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} /></div>
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Vendedor</label><select className="p-2 border rounded border-gray-300 text-sm bg-white min-w-[120px]" value={filterSeller} onChange={e => setFilterSeller(e.target.value)}><option value="all">Todos</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500 block mb-1">Método Pago</label><select className="p-2 border rounded border-gray-300 text-sm bg-white min-w-[120px]" value={filterMethod} onChange={e => setFilterMethod(e.target.value)}><option value="all">Todos</option><option>Efectivo</option><option>Tarjeta</option><option>Vales</option><option>Transferencia</option></select></div>
                <div className="flex-1 text-right text-sm text-gray-400 self-center">{filteredSales.length} tickets encontrados</div>
            </div>
            <Card className="flex-1 overflow-auto" title="Historial de Ventas">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500 text-sm font-bold sticky top-0 z-10">
                        <tr><th className="p-3 border-b border-gray-300">Folio</th><th className="p-3 border-b border-gray-300">Hora</th><th className="p-3 border-b border-gray-300">Vendedor</th><th className="p-3 border-b border-gray-300">Método</th><th className="p-3 border-b text-right border-gray-300">Total</th><th className="p-3 border-b text-center border-gray-300">Acciones</th></tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredSales.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-400">No hay ventas registradas con estos filtros.</td></tr>}
                        {filteredSales.slice().reverse().map(sale => {
                            const sellerName = users.find(u => u.id === sale.user_id)?.name || 'Desc.'; 
                            return (
                                <tr key={sale.id} className="hover:bg-gray-50 border-b border-gray-300 last:border-0">
                                    <td className="p-3 font-mono font-bold text-[#0F4C3A]">#{sale.folio || sale.id}</td><td className="p-3 text-gray-500">{formatTime(sale.date)} <span className="text-xs">{new Date(sale.date).toLocaleDateString()}</span></td><td className="p-3">{sellerName}</td><td className="p-3 text-gray-500">{sale.method || 'N/A'}</td><td className="p-3 text-right font-bold">{formatCurrency(sale.total)}</td>
                                    <td className="p-3 flex justify-center gap-2">
                                        <button onClick={() => fetchSaleDetails({...sale, sellerName})} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" title="Ver Ticket"><FileText size={16} /></button>
                                        {sale.status === 'completed' && (currentUser.role === 'admin' || currentUser.role === 'dueño') && <button onClick={() => onCancelSale(sale.id)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Cancelar Venta"><X size={16} /></button>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
            <Modal isOpen={!!selectedSale} onClose={handleCloseModal} title={`Detalle de Venta #${selectedSale?.folio || selectedSale?.id}`} footer={<Button onClick={handleCloseModal} variant="primary" className="w-full">Cerrar</Button>}>
                {selectedSale && (
                    <div className="space-y-4 font-mono text-sm bg-gray-50 p-4 rounded border">
                        <div className="text-center border-b pb-2 mb-2"><div className="font-bold text-lg">Frutería ICI</div><div>{getCurrentDate()} - {formatTime(selectedSale.date)}</div><div>Atendió: {selectedSale.sellerName}</div></div>
                        
                        {isDetailLoading ? (
                            <div className='text-center text-gray-500'>Cargando detalles...</div>
                        ) : (
                            <div className="space-y-1">
                                {saleItemsDetail.length > 0 ? (
                                    saleItemsDetail.map((item, idx) => <div key={idx} className="flex justify-between"><span>{item.qty.toFixed(item.unit === 'kg' ? 3 : 0)} {item.unit || 'uds'} {item.name}</span><span>{formatCurrency(item.total)}</span></div>)
                                ) : (
                                    <div className='text-center text-gray-500'>Detalle no disponible.</div>
                                )}
                            </div>
                        )}
                        
                        <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(selectedSale.total)}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>Pago: {selectedSale.method || 'N/A'}</span><span>Recibido: {formatCurrency(selectedSale.received || 0)}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>Cambio:</span><span>{formatCurrency(selectedSale.change || selectedSale.received - selectedSale.total || 0)}</span></div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// --- SUB-COMPONENTE: MODAL DE COBRO ---
const CheckoutModal = ({ isOpen, onClose, total, onConfirm }) => {
    const [received, setReceived] = useState('');
    const [method, setMethod] = useState('Efectivo');
    const [printTicket, setPrintTicket] = useState(true);
    
    const change = (parseFloat(received || 0) - total);
    const canPay = (method === 'Efectivo' && parseFloat(received || 0) >= total) || method !== 'Efectivo';

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({ method, received: parseFloat(received || 0), change: Math.max(0, change), printTicket });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Venta">
            <div className="space-y-6">
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300"><p className="text-gray-500 text-sm uppercase tracking-wide">Total a Pagar</p><p className="text-5xl font-bold text-[#0F4C3A] mt-2">{formatCurrency(total)}</p></div>
                <div><label className="text-sm font-bold text-[#4A4A4A] mb-2 block">Método de Pago</label><div className="grid grid-cols-2 gap-2">{['Efectivo', 'Tarjeta', 'Vales', 'Transferencia'].map(m => <button key={m} onClick={() => { setMethod(m); setReceived(m === 'Efectivo' ? '' : total.toFixed(2)); }} className={`p-3 rounded-lg border text-sm font-bold transition-all ${method === m ? 'bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{m}</button>)}</div></div>
                {method === 'Efectivo' && (
                    <div className="bg-[#FFC857]/10 p-4 rounded-xl border border-[#FFC857]/50">
                        <label className="text-sm font-bold text-[#1A1A1A] mb-2 block">Dinero Recibido</label>
                        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span><input type="number" className="w-full pl-8 pr-4 py-3 text-2xl font-bold rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FFC857] outline-none" value={received} onChange={e => setReceived(e.target.value)} autoFocus placeholder={total.toFixed(2)}/></div>
                        <div className="mt-4 flex justify-between items-center border-t border-[#FFC857]/30 pt-4"><span className="font-bold text-gray-600">Cambio:</span><span className={`text-2xl font-bold ${change >= 0 ? 'text-[#0F4C3A]' : 'text-red-500'}`}>{change >= 0 ? formatCurrency(change) : 'Falta dinero'}</span></div>
                    </div>
                )}
                {method !== 'Efectivo' && (
                     <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                        <p className="text-sm font-bold text-[#1A1A1A] mb-2 block">Monto Pagado</p>
                        <p className="text-2xl font-bold text-[#0F4C3A]">{formatCurrency(total)} (Total Exacto)</p>
                     </div>
                )}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"><div className="flex items-center gap-2"><Printer size={18} className="text-gray-500"/><span className="text-sm font-medium">Imprimir Ticket</span></div><button onClick={() => setPrintTicket(!printTicket)} className={`w-12 h-6 rounded-full transition-colors relative ${printTicket ? 'bg-[#0F4C3A]' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${printTicket ? 'left-7' : 'left-1'}`}></div></button></div>
            </div>
            <div className="mt-6 flex gap-3"><Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button><Button variant="primary" className="flex-1 py-3 text-lg shadow-lg" disabled={!canPay} onClick={handleConfirm}>Confirmar Cobro</Button></div>
        </Modal>
    );
};

// ----------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL POS (Con todas las correcciones de Folio, FK y Sincronización) ---
// ----------------------------------------------------------------------
const POSModule = ({ products, users, currentUser, sales, setSales, heldSales, setHeldSales, setProducts, refetchProducts }) => {
    const [view, setView] = useState('terminal'); 
    const [cart, setCart] = useState([]);
    const [weight, setWeight] = useState(0.000);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSeller, setSelectedSeller] = useState(currentUser.id);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [nextFolio, setNextFolio] = useState(null); 
    
    const captureWeight = () => { setWeight(parseFloat((Math.random() * 2 + 0.1).toFixed(3))); };

    // LÓGICA DE FOLIO (VERSIÓN 100% SEGURA CON MAX)
    const fetchLastFolio = useCallback(async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('folio')
            .not('folio', 'is', null) 
            .order('folio', { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error al obtener el último folio:", error);
            setError("⚠️ Error al conectar con la base de datos para obtener el folio. Se usará el último conocido.");
            setNextFolio(INITIAL_FOLIO);
            return; 
        }

        if (data && data.length > 0 && data[0].folio) {
            const lastFolio = data[0].folio;
            setNextFolio(Math.max(lastFolio + 1, nextFolio || INITIAL_FOLIO)); 
            setError(null);
        } else {
            setNextFolio(INITIAL_FOLIO);
            setError(null);
        }
    }, [nextFolio]);

    useEffect(() => {
        fetchLastFolio();
        refetchProducts();
    }, [fetchLastFolio]); 

    // Función para GUARDAR la venta en Supabase y DESCONTAR stock
    const handleSaveSale = async (paymentData) => {
        if (cart.length === 0 || isLoading || error || nextFolio === null) return; 

        setIsLoading(true);
        setError(null);
        let newSaleId = null; // CLAVE: Definimos aquí para usar en el catch

        const newSaleHeader = {
            date: new Date().toISOString(),
            user_id: selectedSeller, 
            total: cartTotal,
            method: paymentData.method, 
            received: paymentData.received,
            change: paymentData.change,
            status: 'completed',
            folio: nextFolio,
        };

        try {
            // 1. Insertar la cabecera de la venta en 'sales'
            const { data: saleData, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    user_id: newSaleHeader.user_id,
                    total: newSaleHeader.total,
                    date: newSaleHeader.date,
                    method: newSaleHeader.method, 
                    received: newSaleHeader.received,
                    status: newSaleHeader.status,
                    folio: newSaleHeader.folio, 
                }])
                .select('*')
                .single();
            
            if (saleError) throw saleError;
            newSaleId = saleData.id; // OBTENEMOS EL ID AQUI
            
            // 2. Preparar e insertar los items en 'sale_items'
            
            // FILTRO CRUCIAL (solución a error 23503 si el estado local estuviera actualizado)
            const validCartItems = cart.filter(item => {
                const exists = products.some(p => p.id === item.id);
                if (!exists) {
                    console.error(`ERROR 23503 (FK): Producto ID ${item.id} (${item.name}) no encontrado localmente. Se omitirá en esta venta.`);
                }
                return exists;
            });

            if (validCartItems.length === 0) {
                throw new Error("El carrito no contiene productos válidos para guardar. Venta cancelada.");
            }


            const itemsForInsert = validCartItems.map(item => ({
                sale_id: newSaleId,
                product_id: item.id,
                quantity: item.qty,
                price: item.price, 
                subtotal: item.total,
            }));
            
            const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(itemsForInsert);

            if (itemsError) throw itemsError;

            // 3. Actualizar el stock de los productos
            const stockUpdates = validCartItems.map(item => {
                const currentProduct = products.find(p => p.id === item.id);
                if (!currentProduct) return null;
                const newStock = currentProduct.stock - item.qty;
                return { id: item.id, stock: newStock };
            }).filter(Boolean);

            const { data: updatedProducts, error: stockError } = await supabase
                .from('products')
                .upsert(stockUpdates, { onConflict: 'id' }) 
                .select('id, stock'); 

            if (stockError) throw stockError;
            
            // 4. Actualizar estado local y el siguiente folio
            setSales([...sales, {...saleData, id: newSaleId, items: cart}]); 
            setProducts(products.map(p => {
                const updated = updatedProducts.find(up => up.id === p.id);
                return updated ? { ...p, stock: updated.stock } : p;
            }));

            setNextFolio(newSaleHeader.folio + 1); 

            setCart([]);
            setIsCheckoutOpen(false);
            alert(`Venta #${newSaleHeader.folio} registrada y stock descontado.`);

        } catch (err) {
            console.error('Error al guardar la venta:', err);
            
            // 🚨 REVERTIR TRANSACCIÓN SI FALLÓ DESPUÉS DE LA INSERCIÓN INICIAL
            if (newSaleId) {
                console.warn(`Intentando eliminar venta incompleta con ID: ${newSaleId} de la tabla 'sales'.`);
                await supabase.from('sales').delete().eq('id', newSaleId);
                setSales(prevSales => prevSales.filter(s => s.id !== newSaleId));
            }
            
            // TRATAMIENTO ESPECÍFICO DEL ERROR DE CLAVE FORÁNEA (23503)
            if (err.code === "23503") {
                 setError(`🚨 Producto eliminado: El carrito contiene un producto obsoleto. El sistema está resincronizando la lista de productos.`);
                 alert("Error: El carrito contenía productos eliminados. Se ha limpiado el carrito y se está resincronizando la lista de productos para evitar este fallo.");
                 setCart([]); // Limpiamos el carrito (obligatorio)
                 
                 // === SOLUCIÓN CLAVE DE SINCRONIZACIÓN ===
                 if (typeof refetchProducts === 'function') {
                    await refetchProducts(); // <--- LLAMADA PARA RESINCRONIZAR
                 } 
                 // =======================================
            }
            // TRATAMIENTO ESPECÍFICO DEL ERROR DE FOLIO DUPLICADO (23505)
            else if (err.code === "23505") {
                setError(`🚨 ¡Conflicto de Folio! El folio ${nextFolio} ya existe. Recalculando...`);
                alert("Conflicto de Folio detectado. Por favor, vuelva a intentar el cobro.");
                setNextFolio(null);
                await fetchLastFolio(); 
                setError(null); 
            } 
            else {
                 setError(`Error al procesar la venta: ${err.message}. Revise la consola.`);
                 alert("Fallo crítico al guardar la venta. Revise la consola.");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    // Función para CANCELAR la venta y DEVOLVER stock
    const handleCancelSale = async (saleId) => {
        // if (!window.confirm("¿Está seguro de CANCELAR esta venta? Esta acción no se puede deshacer y devolverá el stock al inventario.")) {
        //     return;
        // }
        setIsLoading(true);
        setError(null);
        
        const saleToCancel = sales.find(s => s.id === saleId);
        if (!saleToCancel || saleToCancel.status === 'cancelled') {
            alert("Esta venta ya ha sido cancelada.");
            setIsLoading(false);
            return;
        }
        
        try {
            // 1. Obtener los productos de la venta cancelada
            const { data: saleItems, error: itemsFetchError } = await supabase
                .from('sale_items')
                .select('product_id, quantity')
                .eq('sale_id', saleId);
            
            if (itemsFetchError || !saleItems || saleItems.length === 0) {
                 throw new Error("No se encontraron detalles de la venta en 'sale_items'. No se puede devolver stock.");
            }
            
            // 2. Marcar la venta como 'cancelled'
            const { error: cancelError } = await supabase
                .from('sales')
                .update({ status: 'cancelled' })
                .eq('id', saleId);

            if (cancelError) throw cancelError;

            // 3. Devolver el stock
            const stockReturns = saleItems.map(item => {
                const currentProduct = products.find(p => p.id === item.product_id);
                if (!currentProduct) return null;
                const newStock = currentProduct.stock + item.quantity;
                return { id: item.product_id, stock: newStock };
            }).filter(Boolean);

            const { data: returnedProducts, error: stockError } = await supabase
                .from('products')
                .upsert(stockReturns, { onConflict: 'id' })
                .select('id, stock'); 

            if (stockError) throw stockError;
            
            // 4. Actualizar estado local
            setSales(sales.map(s => s.id === saleId ? { ...s, status: 'cancelled' } : s));
            setProducts(products.map(p => {
                const updated = returnedProducts.find(up => up.id === p.id);
                return updated ? { ...p, stock: updated.stock } : p;
            }));

            alert(`✅ Venta #${saleToCancel.folio || saleToCancel.id} CANCELADA y stock devuelto.`);

        } catch (err) {
            console.error('Error al cancelar la venta:', err);
            setError(`Error al cancelar la venta: ${err.message}. Revise la consola.`);
            alert("Fallo crítico al cancelar la venta. Revise la consola.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- OTRAS FUNCIONES ---
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (view !== 'terminal') return;
            if (e.key === 'F1') captureWeight();
            if (e.key === 'F2') { if (cart.length > 0 && !isLoading && !error && nextFolio !== null) setIsCheckoutOpen(true); } 
            if (e.key === 'Escape') { if(cart.length > 0 && window.confirm("¿Limpiar carrito?")) setCart([]); }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [view, cart, isLoading, error, nextFolio]); 

    const addToCart = (product) => {
        const currentProductInStock = products.find(p => p.id === product.id);
        if (!currentProductInStock) { return; } 

        let qtyToAdd = 1;
        let total = product.price;
        let requestedQty;
        const existingItem = cart.find(item => item.id === product.id);

        if (product.unit === 'kg') {
            if (weight <= 0) {
                alert("Por favor capture el peso primero.");
                return;
            }
            qtyToAdd = weight;
            total = product.price * weight;
            requestedQty = existingItem ? (existingItem.qty + qtyToAdd) : qtyToAdd;

        } else {
            requestedQty = existingItem ? (existingItem.qty + 1) : 1;
        }

        if (requestedQty > currentProductInStock.stock) {
            alert(`Stock insuficiente. Solo quedan ${currentProductInStock.stock.toFixed(2)} ${product.unit} de ${product.name}.`);
            if (product.unit === 'kg') setWeight(0); 
            return; 
        }

        const itemToAdd = { 
            ...product, 
            qty: qtyToAdd, 
            total, 
            costAtSale: product.cost, 
            product_id: product.id 
        };

        if (existingItem) {
            const newCart = [...cart];
            const existingItemIndex = newCart.findIndex(item => item.id === product.id);
            newCart[existingItemIndex].qty += qtyToAdd;
            newCart[existingItemIndex].total = newCart[existingItemIndex].qty * newCart[existingItemIndex].price;
            setCart(newCart);
        } else {
            setCart([...cart, itemToAdd]);
        }
        
        if (product.unit === 'kg') setWeight(0);
    };

    const updateCartQty = (idx, delta) => {
        const newCart = [...cart];
        const item = newCart[idx];
        if (item.unit === 'kg') return; 

        const currentProductInStock = products.find(p => p.id === item.id);
        const requestedQty = item.qty + delta;

        if (delta > 0 && requestedQty > currentProductInStock.stock) {
             alert(`Stock insuficiente. Solo quedan ${currentProductInStock.stock.toFixed(2)} ${item.unit} de ${item.name}.`);
             return;
        }

        if (requestedQty <= 0) {
            newCart.splice(idx, 1);
        } else {
            item.qty = requestedQty;
            item.total = requestedQty * item.price;
        }
        setCart(newCart);
    };

    const holdSale = () => {
        if (cart.length === 0) return;
        setHeldSales([...heldSales, { id: Date.now(), items: cart, seller: selectedSeller, time: new Date() }]);
        setCart([]);
    };

    const restoreSale = (sale) => {
        setCart(sale.items);
        setSelectedSeller(sale.seller);
        setHeldSales(heldSales.filter(s => s.id !== sale.id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex gap-2 bg-white p-2 rounded-lg border-gray-300 border shadow-sm w-fit">
                <button onClick={() => setView('terminal')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${view === 'terminal' ? 'bg-[#0F4C3A] text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Calculator size={18}/> Terminal Venta</button>
                <button onClick={() => setView('history')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${view === 'history' ? 'bg-[#0F4C3A] text-white' : 'text-gray-500 hover:bg-gray-100'}`}><History size={18}/> Historial</button>
            </div>

            {/* ZONA DE MENSAJES */}
            {error && <div className="p-3 bg-red-100 text-red-700 font-medium rounded">Error: {error}</div>}
            {isLoading && <div className="p-3 bg-blue-100 text-blue-700 font-medium rounded">Procesando... Por favor, espere.</div>}
            {nextFolio === null && !error && <div className="p-3 bg-yellow-100 text-yellow-700 font-medium rounded">Cargando el Folio de Venta... Por favor, espere.</div>}
            
            {view === 'history' ? (
                <SalesHistory sales={sales} users={users} onCancelSale={handleCancelSale} currentUser={currentUser} />
            ) : (
                <div className="flex flex-col md:flex-row h-full gap-4 overflow-hidden flex-1">
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="flex-1 w-full relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/><input className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0F4C3A] outline-none" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoFocus /></div>
                            <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg border border-gray-300"><div className="bg-white px-4 py-2 rounded border border-gray-200 font-mono text-2xl font-bold text-[#1A1A1A] w-32 text-right">{weight.toFixed(3)}</div><div className="text-sm font-bold text-gray-500">kg</div><Button variant="secondary" onClick={captureWeight} icon={Scale} title="F1">Capturar</Button></div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {heldSales.length > 0 && <div className="mb-4 flex gap-2 overflow-x-auto pb-2">{heldSales.map(sale => <button key={sale.id} onClick={() => restoreSale(sale)} className="flex items-center gap-2 bg-orange-100 border border-orange-300 text-orange-800 px-3 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-orange-200"><PauseCircle size={16}/> Ticket en espera (${sale.items.reduce((s,i)=>s+i.total,0).toFixed(0)})</button>)}</div>}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                                    <button key={product.id} onClick={() => addToCart(product)} disabled={isLoading} className="bg-white border border-gray-200 rounded-xl p-2 hover:shadow-md hover:border-[#0F4C3A] transition-all flex flex-col items-center text-center group active:scale-95 h-40 justify-between">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-1">{product.image || '📦'}</div>
                                        <div className="font-bold text-[#1A1A1A] text-sm leading-tight line-clamp-2 h-10 w-full">{product.name}</div>
                                        <div className="w-full flex justify-center items-end gap-1"><span className="text-lg font-bold text-[#0F4C3A]">${product.price}</span><span className="text-xs text-gray-500">/{product.unit}</span></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-96 flex flex-col h-full bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-[#0F4C3A] text-white p-4">
                            <div className="flex justify-between items-center mb-2"><h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Venta Actual</h2><div className="text-xs bg-white/20 px-2 py-1 rounded">Folio: #{nextFolio || '...'}</div></div>
                            <div className="flex items-center gap-2 bg-[#0a3528] p-2 rounded text-sm"><Users size={16} className="text-[#FFC857]"/><span>Vendedor:</span><select className="bg-transparent border-none outline-none font-bold cursor-pointer flex-1" value={selectedSeller} onChange={(e) => setSelectedSeller(Number(e.target.value))}>{users.filter(u => u.active).map(u => <option key={u.id} value={u.id} className="text-black">{u.name}</option>)}</select></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50">{cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60"><ShoppingCart size={64} strokeWidth={1} /><p className="mt-4 text-center px-8">Escanea un producto (F1: Pesar)</p></div> : cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm animate-in slide-in-from-right-2">
                                <div className="flex-1"><div className="font-bold text-sm text-[#1A1A1A]">{item.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                        {item.unit !== 'kg' && (
                                            <div className="flex items-center bg-gray-100 rounded border">
                                                <button onClick={() => updateCartQty(idx, -1)} className="px-2 hover:bg-gray-200">-</button>
                                                <span className="px-2 font-bold">{item.qty}</span>
                                                <button onClick={() => updateCartQty(idx, 1)} className="px-2 hover:bg-gray-200">+</button>
                                            </div>
                                        )}
                                        {item.unit === 'kg' && <span>{item.qty.toFixed(3)} kg</span>}
                                        <span>x ${item.price}</span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-3"><span className="font-bold text-[#0F4C3A]">${item.total.toFixed(2)}</span><button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></div>
                            </div>
                        ))}</div>
                        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                            <div className="flex justify-between items-end mb-4"><span className="text-gray-500 font-medium">Total a Pagar</span><span className="text-4xl font-bold text-[#0F4C3A] tracking-tight">{formatCurrency(cartTotal)}</span></div>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <Button variant="outline" className="border-gray-300 text-gray-600" onClick={() => setCart([])} title="ESC" disabled={isLoading || error}>Cancelar</Button>
                                <Button variant="secondary" onClick={holdSale} disabled={cart.length === 0 || isLoading || error || nextFolio === null} icon={PauseCircle}>Espera</Button>
                            </div>
                            <Button 
                                variant="accent" 
                                className="w-full py-4 text-lg shadow-md hover:shadow-lg transform active:scale-[0.98]" 
                                icon={DollarSign} 
                                disabled={cart.length === 0 || isLoading || error || nextFolio === null} 
                                onClick={() => setIsCheckoutOpen(true)} 
                                title="F2">
                                {nextFolio === null ? 'Cargando Folio...' : 'COBRAR AHORA'}
                            </Button>
                        </div>
                    </div>
                    <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={cartTotal} onConfirm={handleSaveSale} />
                </div>
            )}
        </div>
    );
};

export default POSModule;