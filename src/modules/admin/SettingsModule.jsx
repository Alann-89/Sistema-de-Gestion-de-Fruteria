import React from 'react';
import { Scale, Printer, Maximize, Download, Upload } from 'lucide-react';
import { Button, Card } from '../../components/ui/SharedComponents';

const SettingsModule = ({ onBackup, onRestore }) => {
  const connectScale = async () => {
    try {
      alert("Iniciando búsqueda de puerto serial (Web Serial API)... \n(Esta función requiere un entorno HTTPS seguro y hardware conectado)");
    } catch (err) {
      console.error("Error conectando báscula:", err);
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Error al intentar pantalla completa:", err);
      alert("El modo pantalla completa no está permitido en este entorno (iframe/sandbox).");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Periféricos POS">
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded-lg border-gray-300">
             <div className="flex items-center gap-3"><Scale className="text-[#0F4C3A]" /><div><div className="font-bold text-sm">Báscula Digital</div><div className="text-xs text-gray-500">Puerto COM3 (9600 baud)</div></div></div>
             <Button variant="outline" className="text-xs px-2 py-1" onClick={connectScale}>Conectar</Button>
          </div>
          <div className="flex justify-between items-center p-3 border rounded-lg border-gray-300">
             <div className="flex items-center gap-3"><Printer className="text-[#0F4C3A]" /><div><div className="font-bold text-sm">Impresora</div>
               <select className="text-xs border rounded border-gray-300 mt-1 bg-white">
                  <option>Epson TM-T20II</option>
                  <option>Star Micronics TSP100</option>
                  <option>Generic Text/Only</option>
               </select>
             </div></div>
             <Button variant="outline" className="text-xs px-2 py-1">Test Print</Button>
          </div>
          <Button onClick={toggleFullScreen} variant="secondary" className="w-full" icon={Maximize}>Modo Pantalla Completa</Button>
        </div>
      </Card>
      
      <Card title="Datos de la Tienda">
         <form className="space-y-4">
           <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre Comercial</label><input defaultValue="Frutería ICI" className="w-full p-2 border rounded border-gray-300 bg-gray-50 text-sm"/></div>
           <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Mensaje Ticket</label><input defaultValue="¡Gracias por su compra!" className="w-full p-2 border rounded border-gray-300 bg-gray-50 text-sm"/></div>
           <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Configuración Impuestos</label><select className="w-full p-2 border rounded border-gray-300 bg-gray-50 text-sm"><option>Exento de IVA</option><option>IVA 16%</option><option>IVA 0%</option></select></div>
           <Button variant="primary" className="w-full text-sm">Guardar Cambios</Button>
         </form>
      </Card>

      <Card title="Datos y Seguridad">
         <div className="space-y-4">
           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
             <h4 className="font-bold text-blue-800 mb-1 flex items-center gap-2"><Download size={18}/> Respaldo Local</h4>
             <p className="text-xs text-blue-600 mb-3">Descarga una copia de seguridad.</p>
             <Button variant="primary" className="w-full text-sm" onClick={onBackup}>Descargar JSON</Button>
           </div>
           <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
             <h4 className="font-bold text-orange-800 mb-1 flex items-center gap-2"><Upload size={18}/> Restaurar Datos</h4>
             <p className="text-xs text-orange-600 mb-3">Carga un archivo previo.</p>
             <input type="file" accept=".json" onChange={onRestore} className="text-xs w-full mb-2"/>
           </div>
         </div>
      </Card>
    </div>
  );
};

export default SettingsModule;