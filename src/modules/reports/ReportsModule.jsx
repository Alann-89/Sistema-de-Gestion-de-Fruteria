import React, { useState, useMemo } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Button, Card, Modal } from '../../components/ui/SharedComponents';
import { formatCurrency, formatTime, formatDateShort, downloadCSV } from '../../utils/helpers';

// Componente auxiliar para la gráfica de barras
const SimpleBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 100);
    return (
        <div className="flex items-end gap-2 h-40 pt-4 pb-2 border-b border-gray-200">
            {data.map((item, idx) => {
                const height = (item.value / maxVal) * 100;
                return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full bg-gray-100 rounded-t-md relative h-full flex items-end overflow-hidden hover:bg-gray-200">
                           <div className="w-full bg-[#0F4C3A] transition-all duration-500" style={{ height: `${height}%` }}></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold mt-1 truncate w-full text-center">{item.label}</span>
                        {/* Tooltip con el monto exacto (si no es 0) */}
                        {item.value > 0 && (
                            <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 absolute -mt-6 bg-black text-white px-1 rounded pointer-events-none">${item.value.toFixed(0)}</div>
                        )}
                    </div>
                )
            })}
        </div>
    )
};

const ReportsModule = ({ sales, wasteLogs, cashFunds, setCashFunds, payments }) => {
    const [openingAmount, setOpeningAmount] = useState('');
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    
    const [closingAmount, setClosingAmount] = useState('');
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    
    const [timeRange, setTimeRange] = useState('today'); 
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // ------------------------------------------
    // LÓGICA DE FILTRADO DE DATOS
    // ------------------------------------------
    const filteredData = useMemo(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (timeRange === 'today') {
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
        } else if (timeRange === 'week') {
            const day = now.getDay(); // 0 (Domingo) - 6 (Sábado)
            // Calcula el inicio de la semana (Lunes). Lunes es el día 1, Domingo es el día 0.
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que Lunes (1) sea el inicio
            start = new Date(now.setDate(diff));
            start.setHours(0,0,0,0);
            end = new Date(start);
            end.setDate(start.getDate() + 6); // Lunes + 6 días = Domingo
            end.setHours(23,59,59,999);
        } else if (timeRange === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (timeRange === 'custom') {
            start = customStart ? new Date(customStart) : new Date(0);
            end = customEnd ? new Date(customEnd) : new Date();
            end.setHours(23, 59, 59, 999);
        }

        const _sales = sales.filter(s => {
            const d = new Date(s.date);
            const saleDate = d.toISOString().split('T')[0];
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            return saleDate >= startDate && saleDate <= endDate;
        });
        const _payments = payments.filter(p => {
            const d = new Date(p.date);
            const payDate = d.toISOString().split('T')[0];
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];
            return payDate >= startDate && payDate <= endDate;
        });
        
        // El filtro de cashFunds debe incluir si la caja fue abierta O cerrada dentro del rango.
        const _funds = cashFunds.filter(f => { 
            const opened = new Date(f.openedAt);
            const closed = f.closedAt ? new Date(f.closedAt) : end; // Usamos 'end' si está abierta

            // El turno se cuenta si: 1) Se abrió en el rango O 2) Se cerró en el rango (y se abrió antes)
            return (opened >= start && opened <= end) || (f.closedAt && closed >= start && closed <= end);
        });
        
        const _waste = wasteLogs.filter(w => { const d = new Date(w.date); return d >= start && d <= end; });

        // Movimientos para la tabla de detalle (ordenados por fecha descendente)
        const allMovements = [
            // Ventas totales (incluye digital y efectivo)
            ..._sales.map(s => ({ ...s, type: 'Venta', amount: s.total, isPositive: true, dateObj: new Date(s.date), method: s.method, folio: s.folio })),
            // Pagos a proveedores (salidas)
            ..._payments.map(p => ({ ...p, type: 'Pago Proveedor', amount: p.amount, isPositive: false, dateObj: new Date(p.date), method: p.method, supplierId: p.supplierId })),
            // Aperturas de caja
            ..._funds.map(f => ({ ...f, type: 'Apertura Caja', amount: f.amount, isPositive: true, dateObj: new Date(f.openedAt), method: 'Efectivo', folio: null }))
        ].sort((a,b) => b.dateObj - a.dateObj);

        return { sales: _sales, payments: _payments, funds: _funds, waste: _waste, allMovements, start, end };
    }, [sales, wasteLogs, cashFunds, payments, timeRange, customStart, customEnd]);

    // ------------------------------------------
    // CÁLCULOS PRINCIPALES
    // ------------------------------------------
    const totalSales = filteredData.sales.reduce((sum, s) => sum + s.total, 0);
    const totalCashSales = filteredData.sales.filter(s => s.method === 'Efectivo').reduce((sum, s) => sum + s.total, 0);
    const totalDigital = totalSales - totalCashSales;
    
    // Asumiendo que wasteLogs tienen el campo costLost (Costo perdido)
    const totalWaste = filteredData.waste.reduce((sum, w) => sum + (w.costLost || 0), 0);
    
    // Costo de la Mercancía Vendida (CMV)
    const totalCostSold = filteredData.sales.reduce((acc, sale) => {
        // Asumiendo que sale.items tiene costAtSale y qty
        return acc + (sale.items ? sale.items.reduce((sItem, item) => sItem + (item.costAtSale * item.qty), 0) : 0);
    }, 0);
    const grossProfit = totalSales - totalCostSold - totalWaste;

    const totalFunds = filteredData.funds.reduce((sum, f) => sum + f.amount, 0);
    const totalCashPayments = filteredData.payments.filter(p => p.method === 'Efectivo').reduce((sum, p) => sum + p.amount, 0);
    
    // Dinero Teórico = Fondos Iniciales + Ventas Efectivo - Pagos Efectivo
    const theoreticalCash = totalFunds + totalCashSales - totalCashPayments;

    // Estado de la caja para el turno actual (solo si el rango es 'today')
    // Nota: currentFund debe ser el ÚLTIMO turno, no el último del filtro.
    const currentFund = cashFunds.length > 0 ? cashFunds[cashFunds.length - 1] : null;
    const isShiftOpen = timeRange === 'today' && currentFund && !currentFund.closedAt;

    // ------------------------------------------
    // MANEJO DE CAJA (APERTURA Y CIERRE)
    // ------------------------------------------
    const handleOpenShift = (e) => {
        e.preventDefault();
        const amount = parseFloat(openingAmount);
        if (isNaN(amount) || amount < 0) {
            alert("Por favor, ingrese un monto inicial válido.");
            return;
        }
        
        // ************************************************
        // CORRECCIÓN APLICADA AQUÍ: 
        // Se asegura que la fecha se guarde como un STRING (ISO), 
        // lo que es consistente con cómo Supabase/DB lo devuelve
        // y con cómo se usa en 'new Date(f.openedAt)' en el useMemo.
        const newOpenedAt = new Date().toISOString(); 
        // ************************************************

        setCashFunds([...cashFunds, {
            id: Date.now(),
            openedAt: newOpenedAt, 
            amount: amount,
            closedAt: null,
            finalCounted: null,
            theoreticalCash: null,
            difference: null
        }]);
        setOpeningAmount('');
        setIsCashModalOpen(false);
        alert("✅ Caja abierta exitosamente.");
    };

    const handleCloseShift = () => {
        // Abre el modal para que el usuario ingrese el monto contado
        setClosingAmount(theoreticalCash.toFixed(2)); // Sugiere el monto teórico
        setIsCloseModalOpen(true);
    };

    const handleFinalClose = (e) => {
        e.preventDefault();
        const finalCounted = parseFloat(closingAmount);

        if (isNaN(finalCounted)) {
            alert("Por favor, ingrese un monto válido.");
            return;
        }

        const updated = [...cashFunds];
        const current = updated[updated.length - 1];

        // 1. Calcular Sobrante/Faltante
        const difference = finalCounted - theoreticalCash;

        // 2. Actualizar el fondo actual
        current.closedAt = new Date().toISOString(); // Guardar como string
        current.finalCounted = finalCounted;
        current.theoreticalCash = theoreticalCash;
        current.difference = difference;

        setCashFunds(updated);
        setClosingAmount('');
        setIsCloseModalOpen(false);
        alert(`✅ Corte de Caja completado. Diferencia: ${formatCurrency(difference)}`);
    };
    
    // ------------------------------------------
    // EXPORTACIÓN DE DATOS
    // ------------------------------------------
    const exportExcel = () => {
        downloadCSV(filteredData.allMovements.map(m => ({
            Fecha: m.dateObj.toLocaleDateString(),
            Hora: m.dateObj.toLocaleTimeString(),
            Tipo: m.type,
            // Detalle más preciso
            Descripcion: m.folio ? `Ticket #${m.folio}` : (m.supplierId ? `Pago a Proveedor ID ${m.supplierId}` : (m.type === 'Apertura Caja' ? 'Fondo de Caja' : 'Movimiento de Caja')), 
            Metodo: m.method || 'Efectivo',
            Monto: m.isPositive ? `${m.amount}` : `-${m.amount}`
        })), `ReporteMovimientos_${timeRange}.csv`);
    };

    // ------------------------------------------
// DATOS PARA GRÁFICOS
    // ------------------------------------------
    const chartData = useMemo(() => {
        if (timeRange === 'today') {
            const hours = Array(14).fill(0).map((_, i) => ({ label: `${i+8}h`, value: 0 }));
            filteredData.sales.forEach(s => {
                const h = new Date(s.date).getHours();
                // Asumiendo horario de 8h a 21h (14 horas)
                if (h >= 8 && h <= 21) hours[h-8].value += s.total;
            });
            return hours;
        } else if (timeRange === 'week') {
            const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const weekData = daysOfWeek.map(day => ({ label: day, value: 0 }));
            filteredData.sales.forEach(s => {
                const date = new Date(s.date);
                const dayIndex = date.getDay(); // 0 = Domingo, 1 = Lunes, etc.
                weekData[dayIndex].value += s.total;
            });
            return weekData;
        } else if (timeRange === 'month') {
            const daysInMonth = new Date(filteredData.end.getFullYear(), filteredData.end.getMonth() + 1, 0).getDate();
            const monthData = Array.from({ length: daysInMonth }, (_, i) => ({ label: `${i+1}`, value: 0 }));
            filteredData.sales.forEach(s => {
                const day = new Date(s.date).getDate();
                monthData[day - 1].value += s.total;
            });
            return monthData;
        } else if (timeRange === 'custom') {
            const start = new Date(filteredData.start);
            const end = new Date(filteredData.end);
            const days = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                days.push({ label: formatDateShort(d.toISOString().split('T')[0]), value: 0 });
            }
            filteredData.sales.forEach(s => {
                const key = formatDateShort(s.date);
                const day = days.find(d => d.label === key);
                if (day) day.value += s.total;
            });
            return days;
        }
        return [];
    }, [filteredData, timeRange]);
    
    const productStats = {};
    filteredData.sales.forEach(sale => { 
        sale.items.forEach(item => { 
            if (!productStats[item.name]) productStats[item.name] = 0; 
            productStats[item.name] += item.qty; 
        }); 
    });
    const topProducts = Object.entries(productStats).sort(([, a], [, b]) => b - a).slice(0, 5); 

    const wasteStats = {};
    // Usamos 'costLost' para calcular la pérdida económica
    filteredData.waste.forEach(log => { 
        if (!wasteStats[log.productName]) wasteStats[log.productName] = 0; 
        wasteStats[log.productName] += log.costLost; 
    });
    const topWasteProducts = Object.entries(wasteStats).sort(([, a], [, b]) => b - a).slice(0, 5);

    // ------------------------------------------
    // RENDERIZADO (JSX)
    // ------------------------------------------
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div><h2 className="text-2xl font-bold text-[#1A1A1A]">Reporte Financiero</h2><p className="text-sm text-gray-500">Vista general de flujos y caja</p></div>
                <div className="flex gap-2 bg-white p-1 rounded border border-gray-300 shadow-sm">
                    <button onClick={() => setTimeRange('today')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'today' ? 'bg-[#0F4C3A] text-white' : 'text-gray-600'}`}>Hoy</button>
                    <button onClick={() => setTimeRange('week')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'week' ? 'bg-[#0F4C3A] text-white' : 'text-gray-600'}`}>Semana</button>
                    <button onClick={() => setTimeRange('month')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'month' ? 'bg-[#0F4C3A] text-white' : 'text-gray-600'}`}>Mes</button>
                    <button onClick={() => setTimeRange('custom')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'custom' ? 'bg-[#0F4C3A] text-white' : 'text-gray-600'}`}>Rango</button>
                </div>
                <div className="flex gap-2">
                    {timeRange === 'custom' && (<div className="flex gap-1 items-center bg-white border rounded px-2"><input type="date" className="text-xs p-1" value={customStart} onChange={e => setCustomStart(e.target.value)}/><span>-</span><input type="date" className="text-xs p-1" value={customEnd} onChange={e => setCustomEnd(e.target.value)}/></div>)}
                    <Button variant="outline" icon={FileSpreadsheet} onClick={exportExcel}>Exportar</Button>
                    {timeRange === 'today' && (!isShiftOpen 
                        ? <Button variant="secondary" onClick={() => setIsCashModalOpen(true)}>Abrir Caja</Button> 
                        : <Button variant="danger" onClick={handleCloseShift}>Corte Caja</Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="border-l-4 border-l-[#0F4C3A]"><div className="text-xs font-bold text-gray-500 uppercase">Ventas Totales</div><div className="text-3xl font-bold text-[#0F4C3A] mt-1">{formatCurrency(totalSales)}</div><div className="text-xs text-gray-400 mt-2">{filteredData.sales.length} transacciones</div></Card>
                <Card className="border-l-4 border-l-blue-500"><div className="text-xs font-bold text-gray-500 uppercase">Flujo de Efectivo (Caja)</div><div className="text-3xl font-bold text-blue-600 mt-1">{formatCurrency(theoreticalCash)}</div><div className="text-xs text-blue-400 mt-2">Dinero físico esperado</div></Card>
                <Card className="border-l-4 border-l-red-600"><div className="text-xs font-bold text-gray-500 uppercase">Salidas (Pagos)</div><div className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalCashPayments)}</div><div className="text-xs text-red-400 mt-2">Pagos en efectivo</div></Card>
                <Card className="border-l-4 border-l-pink-500"><div className="text-xs font-bold text-gray-500 uppercase">Costo de Ventas (CMV)</div><div className="text-3xl font-bold text-pink-600 mt-1">{formatCurrency(totalCostSold)}</div><div className="text-xs text-pink-400 mt-2">Costo de la mercancía vendida</div></Card>
                <Card className="border-l-4 border-l-[#FFC857]"><div className="text-xs font-bold text-gray-500 uppercase">Fondo Inicial</div><div className="text-3xl font-bold text-[#1A1A1A] mt-1">{formatCurrency(totalFunds)}</div><div className="text-xs text-gray-400 mt-2">Aperturas en periodo</div></Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-indigo-500">
                    <div className="text-xs font-bold text-gray-500 uppercase">Desglose Ventas</div>
                    <div className="mt-1">
                        <div className="flex justify-between text-sm"><span>Efectivo:</span> <span className="font-bold">{formatCurrency(totalCashSales)}</span></div>
                        <div className="flex justify-between text-sm"><span>Digital:</span> <span className="font-bold text-indigo-600">{formatCurrency(totalDigital)}</span></div>
                    </div>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <div className="text-xs font-bold text-gray-500 uppercase">Mermas (Pérdidas)</div>
                    <div className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(totalWaste)}</div>
                    <div className="text-xs text-gray-400 mt-1">{filteredData.waste.length} registros (costo)</div>
                </Card>
                <Card className="border-l-4 border-l-teal-500">
                    <div className="text-xs font-bold text-gray-500 uppercase">Utilidad Bruta</div>
                    <div className="text-2xl font-bold text-teal-600 mt-1">{formatCurrency(grossProfit)}</div>
                    <div className="text-xs text-gray-400 mt-1">Ventas - Costos - Mermas</div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Tendencia de Ventas" className="col-span-2">
                    <div className="h-48 w-full">
                        {chartData.length > 0 ? <SimpleBarChart data={chartData} /> : <div className="h-full flex items-center justify-center text-gray-400">Sin datos para graficar</div>}
                    </div>
                </Card>
                <Card title="Resumen de Caja (Cálculo)">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span>(+) Fondos Apertura:</span><span className="font-bold">{formatCurrency(totalFunds)}</span></div>
                        <div className="flex justify-between"><span>(+) Ventas Efectivo:</span><span className="font-bold text-green-600">{formatCurrency(totalCashSales)}</span></div>
                        <div className="flex justify-between border-b border-gray-300 pb-2"><span>(-) Pagos Efectivo:</span><span className="font-bold text-red-600">-{formatCurrency(totalCashPayments)}</span></div>
                        <div className="flex justify-between pt-2 text-lg font-bold"><span>= Total en Caja:</span><span className="text-blue-600">{formatCurrency(theoreticalCash)}</span></div>
                        
                        {/* Mostrar la diferencia si la caja está cerrada en este turno */}
                        {currentFund && currentFund.closedAt && currentFund.difference !== null && (
                            <div className="pt-2 text-sm font-bold border-t border-dashed border-gray-300">
                                <div className="flex justify-between">
                                    <span>Contado:</span>
                                    <span className="text-gray-700">{formatCurrency(currentFund.finalCounted)}</span>
                                </div>
                                <div className="flex justify-between text-lg">
                                    <span>Diferencia (Sobrante/Faltante):</span>
                                    <span className={currentFund.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        {formatCurrency(currentFund.difference)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Top 5 Productos Más Vendidos (Cantidad)">
                   <div className="space-y-2">
                    {topProducts.length === 0 ? <p className="text-gray-400 text-center text-xs">Sin datos</p> : topProducts.map(([name, qty], idx) => (
                        <div key={name} className="flex justify-between text-sm border-b pb-1 border-gray-300">
                            <span>{idx + 1}. {name}</span>
                            <span className="font-bold">{qty.toFixed(1)}</span>
                        </div>
                    ))}
                   </div>
                </Card>
                <Card title="Mayores Pérdidas (Mermas - Costo)">
                   <div className="space-y-2">
                    {topWasteProducts.length === 0 ? <p className="text-gray-400 text-center text-xs">Sin datos</p> : topWasteProducts.map(([name, cost], idx) => (
                        <div key={name} className="flex justify-between text-sm border-b pb-1 text-red-600">
                            <span>{idx + 1}. {name}</span>
                            <span className="font-bold">-{formatCurrency(cost)}</span>
                        </div>
                    ))}
                   </div>
                </Card>
            </div>

            <Card title="Detalle de Movimientos (Entradas y Salidas de Efectivo y Venta Total)">
                <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                           <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr><th className="p-2">Hora</th><th className="p-2">Tipo</th><th className="p-2">Descripción</th><th className="p-2">Método</th><th className="p-2 text-right">Monto</th></tr>
                           </thead>
                           <tbody>
                                {filteredData.allMovements.length === 0 ? <tr><td colSpan="5" className="p-4 text-center text-gray-400">Sin movimientos</td></tr> : 
                                    filteredData.allMovements.map((m, idx) => (
                                       <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50">
                                            <td className="p-2">{formatDateShort(m.dateObj)} {formatTime(m.dateObj)}</td>
                                            <td className="p-2 font-bold">{m.type}</td>
                                            <td className="p-2 text-gray-500">{m.folio ? `Ticket #${m.folio}` : (m.supplierId ? `Pago Proveedor ID ${m.supplierId}` : (m.type === 'Apertura Caja' ? 'Fondo de Caja' : 'Movimiento de Caja'))}</td>
                                            <td className="p-2">{m.method || 'Efectivo'}</td>
                                            <td className={`p-2 text-right font-bold ${m.isPositive ? 'text-green-600' : 'text-red-600'}`}>{m.isPositive ? '+' : '-'}{formatCurrency(m.amount)}</td>
                                       </tr>
                                    ))
                                }
                           </tbody>
                    </table>
                </div>
            </Card>

            {/* --- MODAL APERTURA DE CAJA --- */}
            <Modal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} title="Apertura de Caja">
                <form onSubmit={handleOpenShift} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Monto Inicial (Fondo)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 border rounded text-2xl font-bold" 
                            autoFocus 
                            required 
                            value={openingAmount} 
                            onChange={e => setOpeningAmount(e.target.value)} 
                            placeholder="$0.00"
                            step="0.01"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="primary" type="submit">Iniciar Turno</Button>
                    </div>
                </form>
            </Modal>
            
            {/* --- MODAL CIERRE DE CAJA --- */}
            <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Corte y Cierre de Caja">
                <form onSubmit={handleFinalClose} className="space-y-4">
                    {/* Mostrar el teórico actual */}
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-sm text-blue-800">Caja Teórica Esperada:</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(theoreticalCash)}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold mb-1">Monto Contado (Dinero Físico en Caja)</label>
                        <input 
                            type="number" 
                            className="w-full p-3 border rounded text-2xl font-bold focus:ring-2 focus:ring-blue-500" 
                            autoFocus 
                            required 
                            value={closingAmount} 
                            onChange={e => setClosingAmount(e.target.value)} 
                            placeholder={formatCurrency(theoreticalCash).replace('$', '')} 
                            step="0.01"
                        />
                    </div>
                    
                    <div className="flex justify-between pt-2">
                        <Button variant="ghost" onClick={() => setIsCloseModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" type="submit">Cerrar Turno y Calcular Diferencia</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ReportsModule;